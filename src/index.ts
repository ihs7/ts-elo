type Options = {
  kFactor: number;
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

  expectedScoreAgainst(other: Player | number): number {
    if (other instanceof Player) {
      return this.expectedScore(other.rating);
    } else {
      return this.expectedScore(other);
    }
  }
}

export class Duel {
  private playerRanks: Map<string, PlayerRank> = new Map();
  private kFactor: number = 15;

  constructor(options?: Options) {
    this.playerRanks = new Map();
    if (options) {
      this.kFactor = options.kFactor;
    }
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

    let teams = new Set<Team>();

    for (var playerRank of this.playerRanks) {
      const team = new Team(playerRank[0], playerRank[1].rank);
      team.addPlayer(playerRank[1].player);
      teams.add(team);
    }

    return new EloMatchResult(teams, this.kFactor).calculate();
  }
}

export class Team {
  public players: Set<Player> = new Set();
  public rank: number;

  identifier: string;

  constructor(identifier: string, rank: number) {
    this.identifier = identifier;
    this.rank = rank;
  }

  addPlayer(player: Player): Team {
    this.players.add(player);
    return this;
  }
}

export class TeamMatch {
  private playerRanks: Map<string, PlayerRank> = new Map();
  private teams: Set<Team> = new Set();
  private kFactor: number = 15;

  constructor(options?: Options) {
    this.playerRanks = new Map();
    if (options) {
      this.kFactor = options.kFactor;
    }
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
    this.teams.add(team);
    return team;
  }

  calculate(): EloMatchResult {
    return new EloMatchResult(this.teams, this.kFactor).calculate();
  }
}

export class FreeForAll {
  private playerRanks: Map<string, PlayerRank> = new Map();
  private kFactor: number = 15;

  constructor(options?: Options) {
    this.playerRanks = new Map();
    if (options) {
      this.kFactor = options.kFactor;
    }
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

    let teams = new Set<Team>();

    for (var playerRank of this.playerRanks) {
      const team = new Team(playerRank[0], playerRank[1].rank);
      team.addPlayer(playerRank[1].player);
      teams.add(team);
    }

    return new EloMatchResult(teams, this.kFactor).calculate();
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
  private teams: Set<Team> = new Set();
  private kFactor: number;
  public results: EloPlayerResult[] = [];

  constructor(teams: Set<Team>, kFactor: number) {
    this.teams = teams;
    this.kFactor = kFactor;
  }

  calculate(): EloMatchResult {
    for (var team of this.teams) {
      for (var player of team.players) {
        let eloDiff: number = 0;
        for (var otherTeam of this.teams) {
          if (otherTeam.identifier !== team.identifier) {
            for (var opponent of otherTeam.players) {
              let s: number;

              if (team.rank < otherTeam.rank) {
                s = 1;
              } else if (team.rank == otherTeam.rank) {
                s = 0.5;
              } else if (team.rank > otherTeam.rank) {
                s = 0;
              }

              eloDiff +=
                this.kFactor * (s - player.expectedScoreAgainst(opponent));
            }
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
