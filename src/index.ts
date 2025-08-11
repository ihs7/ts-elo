/**
 * Strategy for calculating Elo changes in team matches.
 */
export enum CalculationStrategy {
  /** Teams are treated as single entities with average ratings */
  AVERAGE_TEAMS = "AVERAGE_TEAMS",
  /** Individual player contributions are weighted by their rating percentage within the team */
  WEIGHTED_TEAMS = "WEIGHTED_TEAMS",
}

const DEFAULT_K_FACTOR = 15;
const DEFAULT_CALCULATION_STRATEGY = CalculationStrategy.AVERAGE_TEAMS;

/**
 * Configuration options for Elo match calculations.
 */
interface Options {
  /** K-factor determines how much ratings change after a match. Default: 15 */
  kFactor?: number;
  /** Strategy for team-based calculations. Default: AVERAGE_TEAMS */
  calculationStrategy?: CalculationStrategy;
}

interface PlayerRank {
  player: Player;
  rank: number;
}

/**
 * Represents a player with an identifier and Elo rating.
 */
export class Player {
  identifier: string;
  rating: number;

  /**
   * Creates a new player.
   * @param identifier - Unique identifier for the player
   * @param rating - Initial Elo rating (will be rounded to nearest integer)
   */
  constructor(identifier: string, rating: number) {
    if (!identifier || identifier.trim().length === 0) {
      throw new Error("Player identifier cannot be empty");
    }
    if (!Number.isFinite(rating)) {
      throw new Error("Player rating must be a finite number");
    }
    this.identifier = identifier.trim();
    this.rating = Math.round(rating);
  }

  private readonly expectedScore = (versusRating: number): number => {
    return 1 / (1 + Math.pow(10, (versusRating - this.rating) / 400));
  };

  /**
   * Calculates the expected score of this player against another player, team, or rating.
   * @param other - The opponent (Player, Team, or numeric rating)
   * @returns Expected score between 0 and 1 (0.5 means equal chance)
   */
  public expectedScoreAgainst = (other: Team | Player | number): number => {
    if (other instanceof Player) {
      return this.expectedScore(other.rating);
    } else if (other instanceof Team) {
      return this.expectedScore(other.averageRating());
    } else {
      return this.expectedScore(other);
    }
  };
}

/**
 * Represents a duel (1v1 match) between two players.
 */
export class Duel {
  private readonly playerRanks = new Map<string, PlayerRank>();
  private readonly kFactor: number;
  private readonly strategy: CalculationStrategy;

  /**
   * Creates a new duel match.
   * @param options - Configuration options for the match
   */
  constructor(options?: Options) {
    this.playerRanks = new Map();
    this.kFactor = options?.kFactor ?? DEFAULT_K_FACTOR;
    this.strategy =
      options?.calculationStrategy ?? DEFAULT_CALCULATION_STRATEGY;
  }

  /**
   * Validates that a player is not already in the match.
   * @param newPlayer - Player to validate
   * @throws Error if player already exists in the match
   */
  guardDuplicate = (newPlayer: Player): void => {
    if (this.playerRanks.has(newPlayer.identifier)) {
      throw new Error(
        `Player with identifier '${newPlayer.identifier}' is already in this duel`,
      );
    }
  };

  /**
   * Validates that the match doesn't exceed the maximum number of players.
   * @throws Error if trying to add more than 2 players to a duel
   */
  guardTooManyPlayers = (): void => {
    if (this.playerRanks.size >= 2) {
      throw new Error(
        "Duel matches can only have 2 players. Use FreeForAll or TeamMatch for more players.",
      );
    }
  };

  /**
   * Adds a player to the duel match.
   * @param player - Player to add to the match
   * @param won - Whether the player won the match
   * @returns This match instance for method chaining
   * @throws Error if player already exists or too many players
   */
  addPlayer = (player: Player, won: boolean): this => {
    this.guardTooManyPlayers();
    this.guardDuplicate(player);
    this.playerRanks.set(player.identifier, { player, rank: won ? 1 : 0 });
    return this;
  };

  /**
   * Calculates the Elo rating changes for both players in the duel.
   * @returns EloMatchResult containing the new ratings for both players
   * @throws Error if fewer than 2 players are in the match
   */
  calculate = (): EloMatchResult => {
    if (this.playerRanks.size < 2) {
      throw new Error("Duel must have exactly 2 players to calculate results");
    }

    const teams = new Array<Team>();

    for (const playerRank of this.playerRanks) {
      const team = new Team(playerRank[0], playerRank[1].rank);
      team.addPlayer(playerRank[1].player);
      teams.push(team);
    }

    return new EloMatchResult(teams, this.kFactor, this.strategy).calculate();
  };
}

/**
 * Represents a team in a match with players and a score.
 */
export class Team {
  public players: Player[] = [];
  public score: number;

  identifier: string;

  /**
   * Creates a new team.
   * @param identifier - Unique identifier for the team
   * @param score - Team's score/ranking in the match
   */
  constructor(identifier: string, score: number) {
    if (!identifier || identifier.trim().length === 0) {
      throw new Error("Team identifier cannot be empty");
    }
    if (!Number.isFinite(score)) {
      throw new Error("Team score must be a finite number");
    }
    this.identifier = identifier.trim();
    this.score = score;
  }

  /**
   * Calculates the average rating of all players in the team.
   * @returns Average rating of team members
   * @throws Error if team has no players
   */
  averageRating = (): number => {
    if (this.players.length === 0) {
      throw new Error(
        "Cannot calculate average rating for team with no players",
      );
    }
    const yourTeamRating = this.players.reduce((acc, team) => {
      return acc + team.rating;
    }, 0);
    return yourTeamRating / this.players.length;
  };

  /**
   * Calculates the total rating of all players in the team.
   * @returns Total rating of all team members
   */
  totalRating = (): number => {
    return this.players.reduce((acc, player) => {
      return acc + player.rating;
    }, 0);
  };

  /**
   * Calculates the weight of a player's contribution to the team based on rating.
   * @param player - Player to calculate weight for
   * @returns Weight as a decimal between 0 and 1
   * @throws Error if player is not in team or team has no players
   */
  getPlayerWeight = (player: Player): number => {
    if (this.players.length === 0) {
      throw new Error(
        "Cannot calculate player weight for team with no players",
      );
    }

    const playerExists = this.players.some(
      (p) => p.identifier === player.identifier,
    );
    if (!playerExists) {
      throw new Error(
        `Player ${player.identifier} is not in team ${this.identifier}`,
      );
    }

    let playerWeight = player.rating / this.totalRating();

    // Adjust player weight to accommodate rounding for both negative and positive numbers
    // This assumes that the player that has larger weight takes a bigger hit/win in
    // case of rounding problems.
    if (playerWeight > 0.5) {
      playerWeight += 0.0001;
    } else {
      playerWeight -= 0.0001;
    }
    return playerWeight;
  };

  /**
   * Adds a player to the team.
   * @param player - Player to add to the team
   * @returns This team instance for method chaining
   * @throws Error if player is already in the team
   */
  addPlayer = (player: Player): this => {
    const existingPlayer = this.players.find(
      (p) => p.identifier === player.identifier,
    );
    if (existingPlayer) {
      throw new Error(
        `Player ${player.identifier} is already in team ${this.identifier}`,
      );
    }
    this.players.push(player);
    return this;
  };

  private readonly expectedScore = (versusRating: number): number => {
    return 1 / (1 + Math.pow(10, (versusRating - this.averageRating()) / 400));
  };

  /**
   * Calculates the expected score of this team against another team, player, or rating.
   * @param other - The opponent (Team, Player, or numeric rating)
   * @returns Expected score between 0 and 1 (0.5 means equal chance)
   */
  public expectedScoreAgainst = (other: Team | Player | number): number => {
    if (other instanceof Player) {
      return this.expectedScore(other.rating);
    } else if (other instanceof Team) {
      return this.expectedScore(other.averageRating());
    } else {
      return this.expectedScore(other);
    }
  };
}

export class TeamMatch {
  private readonly playerRanks = new Map<string, PlayerRank>();
  private readonly teams: Team[] = [];
  private readonly kFactor: number;
  private readonly strategy: CalculationStrategy;

  constructor(options?: Options) {
    this.playerRanks = new Map();
    this.kFactor = options?.kFactor ?? DEFAULT_K_FACTOR;
    this.strategy =
      options?.calculationStrategy ?? DEFAULT_CALCULATION_STRATEGY;
  }

  guardDuplicate = (newPlayer: Player): void => {
    if (this.playerRanks.has(newPlayer.identifier)) {
      throw new Error(
        `Player with identifier ${newPlayer.identifier} already exists`,
      );
    }
  };

  guardTooManyPlayers = (): void => {
    if (this.playerRanks.size >= 2) {
      throw new Error("Too many playerRanks");
    }
  };

  addTeam = (teamIdentifier: string, rank: number): Team => {
    const team = new Team(teamIdentifier, rank);
    this.teams.push(team);
    return team;
  };

  getTeams = () => {
    return this.teams;
  };

  calculate = (): EloMatchResult => {
    return new EloMatchResult(
      this.teams,
      this.kFactor,
      this.strategy,
    ).calculate();
  };
}

export class FreeForAll {
  private readonly playerRanks = new Map<string, PlayerRank>();
  private readonly kFactor: number;
  private readonly strategy: CalculationStrategy;

  constructor(options?: Options) {
    this.playerRanks = new Map();
    this.kFactor = options?.kFactor ?? DEFAULT_K_FACTOR;
    this.strategy =
      options?.calculationStrategy ?? DEFAULT_CALCULATION_STRATEGY;
  }

  static newMatch = (options?: Options): FreeForAll => {
    return new FreeForAll(options);
  };

  guardDuplicate = (newPlayer: Player): void => {
    if (this.playerRanks.has(newPlayer.identifier)) {
      throw new Error(
        `Player with identifier ${newPlayer.identifier} already exists`,
      );
    }
  };

  addPlayer = (player: Player, rank: number): this => {
    this.guardDuplicate(player);
    this.playerRanks.set(player.identifier, { player, rank });
    return this;
  };

  calculate = (): EloMatchResult => {
    if (this.playerRanks.size < 2) {
      throw new Error("Must have at least 2 playerRanks");
    }

    const teams = new Array<Team>();

    Array.from(this.playerRanks).forEach(([identifier, playerRank]) => {
      const team = new Team(identifier, playerRank.rank);
      team.addPlayer(playerRank.player);
      teams.push(team);
    });

    return new EloMatchResult(teams, this.kFactor, this.strategy).calculate();
  };
}

/**
 * Represents the result of a single player after an Elo calculation.
 */
export class EloPlayerResult {
  rating: number;
  identifier: string;

  /**
   * Creates a new player result.
   * @param identifier - Player identifier
   * @param rating - New Elo rating after the match
   */
  constructor(identifier: string, rating: number) {
    this.identifier = identifier;
    this.rating = rating;
  }
}

/**
 * Handles the calculation of Elo rating changes for a match result.
 */
export class EloMatchResult {
  private readonly teams: Team[] = [];
  private readonly kFactor: number;
  private readonly strategy: CalculationStrategy;
  public results: EloPlayerResult[] = [];

  /**
   * Creates a new match result calculator.
   * @param teams - Teams that participated in the match
   * @param kFactor - K-factor for rating change calculations
   * @param strategy - Strategy for team-based calculations
   */
  constructor(teams: Team[], kFactor: number, strategy: CalculationStrategy) {
    this.teams = teams;
    this.kFactor = kFactor;
    this.strategy = strategy;
  }

  calculate = (): this => {
    const actual = (team: Team, otherTeam: Team): number => {
      let s = 0;

      if (team.score > otherTeam.score) {
        s = 1;
      } else if (team.score === otherTeam.score) {
        s = 0.5;
      } else if (team.score < otherTeam.score) {
        s = 0;
      }
      return s;
    };

    const teamVsTeam = (
      kFactor: number,
      team: Team,
      otherTeam: Team,
    ): number => {
      return (
        kFactor *
        (actual(team, otherTeam) -
          team.expectedScoreAgainst(otherTeam.averageRating()))
      );
    };

    const playerEloDiff = new Map<Player, number>();
    for (const team of this.teams) {
      let eloDiff = 0;
      for (const otherTeam of this.teams.filter(
        (otherTeam) => otherTeam.identifier !== team.identifier,
      )) {
        eloDiff += teamVsTeam(this.kFactor, team, otherTeam);
      }
      eloDiff = Math.sign(eloDiff) * Math.round(Math.abs(eloDiff));
      for (const player of team.players) {
        if (this.strategy === CalculationStrategy.WEIGHTED_TEAMS) {
          const playerWeight = team.getPlayerWeight(player);
          playerEloDiff.set(
            player,
            Math.round(eloDiff * team.players.length * playerWeight),
          );
        } else {
          playerEloDiff.set(player, eloDiff);
        }
      }
    }

    playerEloDiff.forEach((eloDiff, player) => {
      const newRating = player.rating + eloDiff;
      this.results.push(new EloPlayerResult(player.identifier, newRating));
    });

    return this;
  };
}
