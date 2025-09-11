const DEFAULT_K_FACTOR = 15;

export enum CalculationStrategy {
  /** Teams are treated as single entities with average ratings */
  AVERAGE_TEAMS = "AVERAGE_TEAMS",
  /** Individual player contributions are weighted by their rating percentage within the team */
  WEIGHTED_TEAMS = "WEIGHTED_TEAMS",
}

export interface Player {
  id: string;
  rating: number;
}

export interface MatchResultItem {
  id: string;
  newRating: number;
}

export type MatchResult = MatchResultItem[];

export interface Options {
  kFactor?: number;
  strategy?: CalculationStrategy;
}

export interface PlayerWithScore {
  player: Player;
  score: number;
}

export interface TeamWithScore {
  players: Player[];
  score: number;
}

export interface Team {
  players: Player[];
}

const getAverageRating = (players: Player[]): number => {
  if (players.length === 0) {
    throw new Error("Team cannot be empty");
  }
  return (
    players.reduce((sum, player) => sum + player.rating, 0) / players.length
  );
};

const getRating = (entity: number | Player | Team): number => {
  if (typeof entity === "number") {
    return entity;
  }
  if ("rating" in entity) {
    return entity.rating;
  }
  if ("players" in entity) {
    return getAverageRating(entity.players);
  }
  throw new Error("Invalid entity type for rating calculation");
};

export const calculateExpectedScore = (
  entity1: number | Player | Team,
  entity2: number | Player | Team,
): number => {
  const rating1 = getRating(entity1);
  const rating2 = getRating(entity2);
  return 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
};

export const calculateDuel = (
  winner: Player,
  loser: Player,
  options: Options = {},
): MatchResult => {
  const kFactor = options.kFactor ?? DEFAULT_K_FACTOR;

  const expectedWinner = calculateExpectedScore(winner.rating, loser.rating);
  const expectedLoser = calculateExpectedScore(loser.rating, winner.rating);

  const winnerChange = Math.round(kFactor * (1 - expectedWinner));
  const loserChange = Math.round(kFactor * (0 - expectedLoser));

  return [
    { id: winner.id, newRating: winner.rating + winnerChange },
    { id: loser.id, newRating: loser.rating + loserChange },
  ];
};

export const calculateFreeForAll = (
  playersWithScores: PlayerWithScore[],
  options: Options = {},
): MatchResult => {
  const kFactor = options.kFactor ?? DEFAULT_K_FACTOR;
  const results: MatchResult = [];

  for (const playerScore of playersWithScores) {
    let totalRatingChange = 0;

    for (const otherPlayerScore of playersWithScores) {
      if (playerScore.player.id === otherPlayerScore.player.id) continue;

      const expected = calculateExpectedScore(
        playerScore.player.rating,
        otherPlayerScore.player.rating,
      );

      let actual: number;
      if (playerScore.score > otherPlayerScore.score) {
        actual = 1; // won against this player (higher score = better)
      } else if (playerScore.score === otherPlayerScore.score) {
        actual = 0.5; // tied with this player
      } else {
        actual = 0; // lost to this player
      }

      totalRatingChange += kFactor * (actual - expected);
    }

    const finalChange =
      Math.sign(totalRatingChange) * Math.round(Math.abs(totalRatingChange));
    results.push({
      id: playerScore.player.id,
      newRating: playerScore.player.rating + finalChange,
    });
  }

  return results;
};

const calculateTeamAverageRating = (players: Player[]): number => {
  if (players.length === 0) {
    throw new Error("Team cannot be empty");
  }
  return (
    players.reduce((sum, player) => sum + player.rating, 0) / players.length
  );
};

const calculateTeamTotalRating = (players: Player[]): number => {
  return players.reduce((sum, player) => sum + player.rating, 0);
};

const calculatePlayerWeight = (
  player: Player,
  teamPlayers: Player[],
): number => {
  const totalRating = calculateTeamTotalRating(teamPlayers);
  let weight = player.rating / totalRating;

  // Micro-adjustment to prevent exact 0.5 weights and ensure rating conservation
  if (weight > 0.5) {
    weight += 0.0001;
  } else {
    weight -= 0.0001;
  }
  return weight;
};

export const calculateTeamMatch = (
  team1: TeamWithScore,
  team2: TeamWithScore,
  options: Options = {},
): MatchResult => {
  return calculateMultiTeamMatch([team1, team2], options);
};

export const calculateMultiTeamMatch = (
  teams: TeamWithScore[],
  options: Options = {},
): MatchResult => {
  if (teams.length < 2) {
    throw new Error("At least 2 teams are required for a team match");
  }

  const kFactor = options.kFactor ?? DEFAULT_K_FACTOR;
  const strategy = options.strategy ?? CalculationStrategy.AVERAGE_TEAMS;
  const results: MatchResult = [];

  for (const team of teams) {
    if (team.players.length === 0) {
      throw new Error("Team cannot be empty");
    }
  }

  const playerChanges = new Map<string, number>();

  for (const team of teams) {
    let teamRatingChange = 0;
    const teamAvgRating = calculateTeamAverageRating(team.players);

    for (const otherTeam of teams) {
      if (team === otherTeam) continue;

      const otherTeamAvgRating = calculateTeamAverageRating(otherTeam.players);
      const expected = calculateExpectedScore(
        teamAvgRating,
        otherTeamAvgRating,
      );

      let actual: number;
      if (team.score > otherTeam.score) {
        actual = 1; // won against this team (higher score = better)
      } else if (team.score === otherTeam.score) {
        actual = 0.5; // tied with this team
      } else {
        actual = 0; // lost to this team
      }

      teamRatingChange += kFactor * (actual - expected);
    }

    teamRatingChange =
      Math.sign(teamRatingChange) * Math.round(Math.abs(teamRatingChange));

    for (const player of team.players) {
      if (strategy === CalculationStrategy.WEIGHTED_TEAMS) {
        const playerWeight = calculatePlayerWeight(player, team.players);
        const playerChange = Math.round(
          teamRatingChange * team.players.length * playerWeight,
        );
        playerChanges.set(player.id, playerChange);
      } else {
        playerChanges.set(player.id, teamRatingChange);
      }
    }
  }

  playerChanges.forEach((change, playerId) => {
    const player = teams
      .flatMap((team) => team.players)
      .find((p) => p.id === playerId);

    if (!player) {
      throw new Error(`Player with id ${playerId} not found`);
    }

    results.push({
      id: playerId,
      newRating: player.rating + change,
    });
  });

  return results;
};
