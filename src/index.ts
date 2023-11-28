export enum CalculationStrategy {
  TEAM_VS_TEAM = "TEAM_VS_TEAM",
  INDIVIDUAL_VS_TEAM = "INDIVIDUAL_VS_TEAM",
}

const DEFAULT_K_FACTOR = 15;
const DEFAULT_CALCULATION_STRATEGY = CalculationStrategy.TEAM_VS_TEAM;

interface Options {
  kFactor?: number;
  calculationStrategy?: CalculationStrategy;
}

interface PlayerRank {
  player: Player;
  rank: number;
}

export class Player {
  identifier: string;
  rating: number;

  constructor(identifier: string, rating: number) {
    this.identifier = identifier;
    this.rating = rating;
  }

  private readonly expectedScore = (versusRating: number): number => {
    return 1 / (1 + Math.pow(10, (versusRating - this.rating) / 400));
  };

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

export class Duel {
  private readonly playerRanks = new Map<string, PlayerRank>();
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

  addPlayer = (player: Player, won: boolean): Duel => {
    this.guardTooManyPlayers();
    this.guardDuplicate(player);
    this.playerRanks.set(player.identifier, { player, rank: won ? 1 : 0 });
    return this;
  };

  calculate = (): EloMatchResult => {
    if (this.playerRanks.size < 2) {
      throw new Error("Must have 2 playerRanks");
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

export class Team {
  public players: Player[] = [];
  public score: number;

  identifier: string;

  constructor(identifier: string, score: number) {
    this.identifier = identifier;
    this.score = score;
  }

  averageRating = (): number => {
    const yourTeamRating = this.players.reduce((acc, team) => {
      return acc + team.rating;
    }, 0);
    return yourTeamRating / this.players.length;
  };

  addPlayer = (player: Player): Team => {
    this.players.push(player);
    return this;
  };

  private readonly expectedScore = (versusRating: number): number => {
    return 1 / (1 + Math.pow(10, (versusRating - this.averageRating()) / 400));
  };

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

  addPlayer = (player: Player, rank: number): FreeForAll => {
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

export class EloPlayerResult {
  rating: number;
  identifier: string;

  constructor(identifier: string, rating: number) {
    this.identifier = identifier;
    this.rating = rating;
  }
}

export class EloMatchResult {
  private readonly teams: Team[] = [];
  private readonly kFactor: number;
  private readonly strategy: CalculationStrategy;
  public results: EloPlayerResult[] = [];

  constructor(teams: Team[], kFactor: number, strategy: CalculationStrategy) {
    this.teams = teams;
    this.kFactor = kFactor;
    this.strategy = strategy;
  }

  calculate = (): EloMatchResult => {
    function actual(team: Team, otherTeam: Team): number {
      let s = 0;

      if (team.score > otherTeam.score) {
        s = 1;
      } else if (team.score === otherTeam.score) {
        s = 0.5;
      } else if (team.score < otherTeam.score) {
        s = 0;
      }
      return s;
    }

    for (const team of this.teams) {
      for (const player of team.players) {
        let eloDiff: number = 0;
        for (const otherTeam of this.teams.filter(
          (otherTeam) => otherTeam.identifier !== team.identifier,
        )) {
          if (this.strategy === CalculationStrategy.TEAM_VS_TEAM) {
            eloDiff +=
              this.kFactor *
              (actual(team, otherTeam) -
                team.expectedScoreAgainst(otherTeam.averageRating()));
          } else if (this.strategy === CalculationStrategy.INDIVIDUAL_VS_TEAM) {
            eloDiff +=
              this.kFactor *
              (actual(team, otherTeam) -
                player.expectedScoreAgainst(otherTeam));
          }
        }

        const newRating =
          player.rating + Math.sign(eloDiff) * Math.round(Math.abs(eloDiff));
        this.results.push(new EloPlayerResult(player.identifier, newRating));
      }
    }

    return this;
  };
}
