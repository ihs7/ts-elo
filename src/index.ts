export enum CalculationStrategy {
  TEAM_VS_TEAM,
  INDIVIDUAL_VS_TEAM,
}

const DEFAULT_K_FACTOR = 15;
const DEFAULT_CALCULATION_STRATEGY = CalculationStrategy.TEAM_VS_TEAM;

type Options = {
  kFactor?: number;
  calculationStrategy?: CalculationStrategy;
};

type PlayerRank = {
  player: Player;
  rank: number;
};

export class Player {
  identifier: string;
  rating: number;

  constructor(identifier: string, rating: number) {
    this.identifier = identifier;
    this.rating = rating;
  }

  private expectedScore(versusRating: number): number {
    return 1 / (1 + Math.pow(10, (versusRating - this.rating) / 400));
  }

  expectedScoreAgainst(other: Team | Player | number): number {
    if (other instanceof Player) {
      return this.expectedScore(other.rating);
    } else if (other instanceof Team) {
      return this.expectedScore(other.averageRating());
    } else {
      return this.expectedScore(other);
    }
  }
}

export class Duel {
  private playerRanks: Map<string, PlayerRank> = new Map();
  private kFactor: number;
  private strategy: CalculationStrategy;

  constructor(options?: Options) {
    this.playerRanks = new Map();
    this.kFactor = options?.kFactor ?? DEFAULT_K_FACTOR;
    this.strategy =
      options?.calculationStrategy ?? DEFAULT_CALCULATION_STRATEGY;
  }

  guardDuplicate(newPlayer: Player) {
    if (this.playerRanks.has(newPlayer.identifier)) {
      throw new Error(
        `Player with identifier ${newPlayer.identifier} already exists`
      );
    }
  }

  guardTooManyPlayers() {
    if (this.playerRanks.size >= 2) {
      throw new Error("Too many playerRanks");
    }
  }

  addPlayer(player: Player, won: boolean): Duel {
    this.guardTooManyPlayers();
    this.guardDuplicate(player);
    this.playerRanks.set(player.identifier, { player, rank: won ? 0 : 1 });
    return this;
  }

  calculate(): EloMatchResult {
    if (this.playerRanks.size < 2) {
      throw new Error("Must have 2 playerRanks");
    }

    let teams = new Array<Team>();

    for (var playerRank of this.playerRanks) {
      const team = new Team(playerRank[0], playerRank[1].rank);
      team.addPlayer(playerRank[1].player);
      teams.push(team);
    }

    return new EloMatchResult(teams, this.kFactor, this.strategy).calculate();
  }
}

export class Team {
  public players: Player[] = [];
  public rank: number;

  identifier: string;

  constructor(identifier: string, rank: number) {
    this.identifier = identifier;
    this.rank = rank;
  }

  averageRating(): number {
    const yourTeamRating = this.players.reduce((acc, team) => {
      return acc + team.rating;
    }, 0);
    return yourTeamRating / this.players.length;
  }

  addPlayer(player: Player): Team {
    this.players.push(player);
    return this;
  }

  private expectedScore(versusRating: number): number {
    return 1 / (1 + Math.pow(10, (versusRating - this.averageRating()) / 400));
  }

  expectedScoreAgainst(other: Team | Player | number): number {
    if (other instanceof Player) {
      return this.expectedScore(other.rating);
    } else if (other instanceof Team) {
      return this.expectedScore(other.averageRating());
    } else {
      return this.expectedScore(other);
    }
  }
}

export class TeamMatch {
  private playerRanks: Map<string, PlayerRank> = new Map();
  private teams: Team[] = [];
  private kFactor: number;
  private strategy: CalculationStrategy;

  constructor(options?: Options) {
    this.playerRanks = new Map();
    this.kFactor = options?.kFactor ?? DEFAULT_K_FACTOR;
    this.strategy =
      options?.calculationStrategy ?? DEFAULT_CALCULATION_STRATEGY;
  }

  guardDuplicate(newPlayer: Player) {
    if (this.playerRanks.has(newPlayer.identifier)) {
      throw new Error(
        `Player with identifier ${newPlayer.identifier} already exists`
      );
    }
  }

  guardTooManyPlayers() {
    if (this.playerRanks.size >= 2) {
      throw new Error("Too many playerRanks");
    }
  }

  addTeam(teamIdentifier: string, rank: number): Team {
    const team = new Team(teamIdentifier, rank);
    this.teams.push(team);
    return team;
  }

  calculate(): EloMatchResult {
    return new EloMatchResult(
      this.teams,
      this.kFactor,
      this.strategy
    ).calculate();
  }
}

export class FreeForAll {
  private playerRanks: Map<string, PlayerRank> = new Map();
  private kFactor: number;
  private strategy: CalculationStrategy;

  constructor(options?: Options) {
    this.playerRanks = new Map();
    this.kFactor = options?.kFactor ?? DEFAULT_K_FACTOR;
    this.strategy =
      options?.calculationStrategy ?? DEFAULT_CALCULATION_STRATEGY;
  }

  static newMatch = (options?: Options): FreeForAll => {
    return new FreeForAll(options);
  };

  guardDuplicate(newPlayer: Player) {
    if (this.playerRanks.has(newPlayer.identifier)) {
      throw new Error(
        `Player with identifier ${newPlayer.identifier} already exists`
      );
    }
  }

  addPlayer(player: Player, rank: number): FreeForAll {
    this.guardDuplicate(player);
    this.playerRanks.set(player.identifier, { player, rank });
    return this;
  }

  calculate(): EloMatchResult {
    if (this.playerRanks.size < 2) {
      throw new Error("Must have at least 2 playerRanks");
    }

    let teams = new Array<Team>();

    for (var playerRank of this.playerRanks) {
      const team = new Team(playerRank[0], playerRank[1].rank);
      team.addPlayer(playerRank[1].player);
      teams.push(team);
    }

    return new EloMatchResult(teams, this.kFactor, this.strategy).calculate();
  }
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
  private teams: Team[] = [];
  private kFactor: number;
  private strategy: CalculationStrategy;
  public results: EloPlayerResult[] = [];

  constructor(teams: Team[], kFactor: number, strategy: CalculationStrategy) {
    this.teams = teams;
    this.kFactor = kFactor;
    this.strategy = strategy;
  }

  calculate(): EloMatchResult {
    function actual(): number {
      let s: number;

      if (team.rank < otherTeam.rank) {
        s = 1;
      } else if (team.rank == otherTeam.rank) {
        s = 0.5;
      } else if (team.rank > otherTeam.rank) {
        s = 0;
      }
      return s;
    }

    for (var team of this.teams) {
      for (var player of team.players) {
        let eloDiff: number = 0;
        for (var otherTeam of this.teams.filter(
          (otherTeam) => otherTeam.identifier !== team.identifier
        )) {
          if (this.strategy === CalculationStrategy.TEAM_VS_TEAM) {
            eloDiff +=
              this.kFactor *
              (actual() - team.expectedScoreAgainst(otherTeam.averageRating()));
          } else if (this.strategy === CalculationStrategy.INDIVIDUAL_VS_TEAM) {
            eloDiff +=
              this.kFactor *
              (actual() - player.expectedScoreAgainst(otherTeam));
          }
        }

        const newRating = player.rating + eloDiff;
        this.results.push(
          new EloPlayerResult(player.identifier, Math.round(newRating))
        );
      }
    }

    return this;
  }
}
