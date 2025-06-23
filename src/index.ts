export enum CalculationStrategy {
  AVERAGE_TEAMS = "AVERAGE_TEAMS",
  WEIGHTED_TEAMS = "WEIGHTED_TEAMS",
}

const DEFAULT_K_FACTOR = 15;
const DEFAULT_CALCULATION_STRATEGY = CalculationStrategy.AVERAGE_TEAMS;

interface Options {
  kFactor?: number;
  calculationStrategy?: CalculationStrategy;
}

interface PlayerRank {
  readonly player: Player;
  readonly rank: number;
}

export class Player {
  readonly identifier: string;
  rating: number;

  constructor(identifier: string, rating: number) {
    if (!identifier?.trim()) {
      throw new Error("Player identifier cannot be empty");
    }
    this.identifier = identifier.trim();
    this.rating = Math.round(rating);
  }

  expectedScoreAgainst(other: Team | Player | number): number {
    const versusRating =
      other instanceof Player
        ? other.rating
        : other instanceof Team
          ? other.averageRating()
          : other;
    return 1 / (1 + Math.pow(10, (versusRating - this.rating) / 400));
  }
}

export class Team {
  public players: Player[] = [];
  readonly identifier: string;
  readonly score: number;

  constructor(identifier: string, score: number) {
    if (!identifier?.trim()) {
      throw new Error("Team identifier cannot be empty");
    }
    this.identifier = identifier.trim();
    this.score = score;
  }

  averageRating(): number {
    return (
      this.players.reduce((acc, player) => acc + player.rating, 0) /
      this.players.length
    );
  }

  totalRating(): number {
    return this.players.reduce((acc, player) => acc + player.rating, 0);
  }

  getPlayerWeight(player: Player): number {
    const totalRating = this.totalRating();
    if (totalRating === 0) {
      return 1 / this.players.length;
    }

    const playerWeight = player.rating / totalRating;
    return playerWeight > 0.5 ? playerWeight + 0.0001 : playerWeight - 0.0001;
  }

  addPlayer(player: Player): this {
    this.players.push(player);
    return this;
  }

  expectedScoreAgainst(other: Team | Player | number): number {
    const versusRating =
      other instanceof Player
        ? other.rating
        : other instanceof Team
          ? other.averageRating()
          : other;
    return 1 / (1 + Math.pow(10, (versusRating - this.averageRating()) / 400));
  }
}

abstract class BaseMatch {
  protected readonly kFactor: number;
  protected readonly strategy: CalculationStrategy;

  constructor(options?: Options) {
    this.kFactor = options?.kFactor ?? DEFAULT_K_FACTOR;
    this.strategy =
      options?.calculationStrategy ?? DEFAULT_CALCULATION_STRATEGY;

    if (this.kFactor <= 0) {
      throw new Error("K-factor must be positive");
    }
  }

  abstract calculate(): EloMatchResult;
}

export class Duel extends BaseMatch {
  private readonly playerRanks = new Map<string, PlayerRank>();

  private ensureCanAddPlayer(): void {
    if (this.playerRanks.size >= 2) {
      throw new Error("Duel can only have 2 players");
    }
  }

  private ensurePlayerNotExists(player: Player): void {
    if (this.playerRanks.has(player.identifier)) {
      throw new Error(`Player ${player.identifier} already exists`);
    }
  }

  guardDuplicate = (newPlayer: Player): void => {
    this.ensurePlayerNotExists(newPlayer);
  };

  guardTooManyPlayers = (): void => {
    this.ensureCanAddPlayer();
  };

  addPlayer(player: Player, won: boolean): this {
    this.ensureCanAddPlayer();
    this.ensurePlayerNotExists(player);
    this.playerRanks.set(player.identifier, { player, rank: won ? 1 : 0 });
    return this;
  }

  calculate(): EloMatchResult {
    if (this.playerRanks.size !== 2) {
      throw new Error("Duel must have exactly 2 players");
    }

    const teams = Array.from(this.playerRanks.values()).map(
      ({ player, rank }) => {
        const team = new Team(player.identifier, rank);
        team.addPlayer(player);
        return team;
      },
    );

    return new EloMatchResult(teams, this.kFactor, this.strategy).calculate();
  }
}

export class TeamMatch extends BaseMatch {
  private readonly teams: Team[] = [];

  addTeam(teamIdentifier: string, rank: number): Team {
    if (this.teams.some((team) => team.identifier === teamIdentifier)) {
      throw new Error(`Team ${teamIdentifier} already exists`);
    }
    const team = new Team(teamIdentifier, rank);
    this.teams.push(team);
    return team;
  }

  getTeams(): readonly Team[] {
    return this.teams;
  }

  calculate(): EloMatchResult {
    if (this.teams.length < 2) {
      throw new Error("Must have at least 2 teams");
    }
    return new EloMatchResult(
      this.teams,
      this.kFactor,
      this.strategy,
    ).calculate();
  }
}

export class FreeForAll extends BaseMatch {
  private readonly playerRanks = new Map<string, PlayerRank>();

  static newMatch(options?: Options): FreeForAll {
    return new FreeForAll(options);
  }

  private ensurePlayerNotExists(player: Player): void {
    if (this.playerRanks.has(player.identifier)) {
      throw new Error(`Player ${player.identifier} already exists`);
    }
  }

  guardDuplicate = (newPlayer: Player): void => {
    this.ensurePlayerNotExists(newPlayer);
  };

  addPlayer(player: Player, rank: number): this {
    this.ensurePlayerNotExists(player);
    if (rank < 1) {
      throw new Error("Rank must be at least 1");
    }
    this.playerRanks.set(player.identifier, { player, rank });
    return this;
  }

  calculate(): EloMatchResult {
    if (this.playerRanks.size < 2) {
      throw new Error("Must have at least 2 players");
    }

    const teams = Array.from(this.playerRanks.values()).map(
      ({ player, rank }) => {
        const team = new Team(player.identifier, rank);
        team.addPlayer(player);
        return team;
      },
    );

    return new EloMatchResult(teams, this.kFactor, this.strategy).calculate();
  }
}

export class EloPlayerResult {
  identifier: string;
  rating: number;

  constructor(identifier: string, rating: number) {
    this.identifier = identifier;
    this.rating = Math.round(rating);
  }
}

export class EloMatchResult {
  private readonly teams: Team[];
  private readonly kFactor: number;
  private readonly strategy: CalculationStrategy;
  public results: EloPlayerResult[] = [];

  constructor(teams: Team[], kFactor: number, strategy: CalculationStrategy) {
    this.teams = teams;
    this.kFactor = kFactor;
    this.strategy = strategy;
  }

  private calculateActualScore(team: Team, otherTeam: Team): number {
    if (team.score > otherTeam.score) return 1;
    if (team.score === otherTeam.score) return 0.5;
    return 0;
  }

  private calculateTeamEloDifference(team: Team, otherTeam: Team): number {
    const actualScore = this.calculateActualScore(team, otherTeam);
    const expectedScore = team.expectedScoreAgainst(otherTeam.averageRating());
    return this.kFactor * (actualScore - expectedScore);
  }

  calculate(): this {
    const playerEloDiff = new Map<Player, number>();

    for (const team of this.teams) {
      let totalEloDiff = 0;

      for (const otherTeam of this.teams) {
        if (otherTeam.identifier !== team.identifier) {
          totalEloDiff += this.calculateTeamEloDifference(team, otherTeam);
        }
      }

      const roundedEloDiff =
        Math.sign(totalEloDiff) * Math.round(Math.abs(totalEloDiff));

      for (const player of team.players) {
        const playerDiff =
          this.strategy === CalculationStrategy.WEIGHTED_TEAMS
            ? Math.round(
                roundedEloDiff *
                  team.players.length *
                  team.getPlayerWeight(player),
              )
            : roundedEloDiff;

        playerEloDiff.set(player, playerDiff);
      }
    }

    this.results.length = 0;
    playerEloDiff.forEach((eloDiff, player) => {
      const newRating = player.rating + eloDiff;
      this.results.push(new EloPlayerResult(player.identifier, newRating));
    });

    return this;
  }
}

export const calculateDuel = (
  player1: { identifier: string; rating: number; won: boolean },
  player2: { identifier: string; rating: number; won: boolean },
  options?: Options,
): EloPlayerResult[] => {
  const match = new Duel(options);
  match.addPlayer(new Player(player1.identifier, player1.rating), player1.won);
  match.addPlayer(new Player(player2.identifier, player2.rating), player2.won);
  return match.calculate().results;
};

export const calculateFreeForAll = (
  players: { identifier: string; rating: number; rank: number }[],
  options?: Options,
): EloPlayerResult[] => {
  const match = new FreeForAll(options);
  players.forEach((player) => {
    match.addPlayer(new Player(player.identifier, player.rating), player.rank);
  });
  return match.calculate().results;
};

export const calculateTeamMatch = (
  teams: {
    identifier: string;
    rank: number;
    players: { identifier: string; rating: number }[];
  }[],
  options?: Options,
): EloPlayerResult[] => {
  const match = new TeamMatch(options);
  teams.forEach((teamData) => {
    const team = match.addTeam(teamData.identifier, teamData.rank);
    teamData.players.forEach((playerData) => {
      team.addPlayer(new Player(playerData.identifier, playerData.rating));
    });
  });
  return match.calculate().results;
};

export const getExpectedScore = (rating1: number, rating2: number): number => {
  const player1 = new Player("temp", rating1);
  const player2 = new Player("temp", rating2);
  return player1.expectedScoreAgainst(player2);
};
