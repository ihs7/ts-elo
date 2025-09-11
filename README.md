# @ihs7/ts-elo

ELO calculation library in TypeScript

Supports heads up, team and multiplayer calculations

## Installation

```bash
npm i @ihs7/ts-elo
```

## Quick Examples

### 1v1 Duel

```typescript
import { calculateDuel } from "@ihs7/ts-elo";

const results = calculateDuel(
  { id: "player1", rating: 1200 }, // winner
  { id: "player2", rating: 1320 }, // loser
  { kFactor: 15 } // optional
);

console.log(results);
// [
//   { id: "player1", newRating: 1219 },
//   { id: "player2", newRating: 1301 }
// ]
```

### Free-for-All (3+ players)

```typescript
import { calculateFreeForAll } from "@ihs7/ts-elo";

const results = calculateFreeForAll([
  { player: { id: "player1", rating: 1280 }, score: 100 }, // 1st place
  { player: { id: "player2", rating: 1300 }, score: 75 }, // 2nd place
  { player: { id: "player3", rating: 1220 }, score: 50 }, // 3rd place
]);

console.log(results);
// [
//   { id: "player1", newRating: 1294 },
//   { id: "player2", newRating: 1299 },
//   { id: "player3", newRating: 1207 }
// ]
```

**Note**: Higher score = better performance (100 = winner, 75 = second place, etc.)

### Team Match

```typescript
import { calculateTeamMatch, CalculationStrategy } from "@ihs7/ts-elo";

const winningTeam = {
  players: [
    { id: "p1", rating: 1230 },
    { id: "p2", rating: 1260 },
  ],
  score: 100, // winning team (higher score = better)
};

const losingTeam = {
  players: [
    { id: "p3", rating: 1120 },
    { id: "p4", rating: 1410 },
  ],
  score: 50, // losing team
};

const results = calculateTeamMatch(winningTeam, losingTeam, {
  strategy: CalculationStrategy.AVERAGE_TEAMS, // default
  kFactor: 15, // default
});

console.log(results);
// [
//   { id: "p1", newRating: 1237 },
//   { id: "p2", newRating: 1267 },
//   { id: "p3", newRating: 1113 },
//   { id: "p4", newRating: 1403 }
// ]
```

### Multi-Team Match (3+ teams)

```typescript
import { calculateMultiTeamMatch, CalculationStrategy } from "@ihs7/ts-elo";

const teams = [
  {
    players: [{ id: "p1", rating: 1200 }],
    score: 100, // 1st place
  },
  {
    players: [{ id: "p2", rating: 1200 }],
    score: 75, // 2nd place
  },
  {
    players: [{ id: "p3", rating: 1200 }],
    score: 50, // 3rd place
  },
];

const results = calculateMultiTeamMatch(teams, {
  strategy: CalculationStrategy.AVERAGE_TEAMS,
});
```

## Team Calculation Strategies

### Average Teams (Default)

All team members get the same rating change based on team average ratings.

### Weighted Teams

Rating changes are distributed based on individual player contributions to the team.

```typescript
import { calculateTeamMatch, CalculationStrategy } from "@ihs7/ts-elo";

const teamA = {
  players: [
    { id: "p1", rating: 700 },
    { id: "p2", rating: 1150 },
  ],
  score: 85,
};

const teamB = {
  players: [
    { id: "p3", rating: 1300 },
    { id: "p4", rating: 1000 },
  ],
  score: 75,
};

const results = calculateTeamMatch(teamA, teamB, {
  strategy: CalculationStrategy.WEIGHTED_TEAMS,
});
```

With weighted strategy:

- Higher-rated players get larger rating changes
- Reflects individual skill contribution to team performance

## Utility Function

### Expected Score

Calculate the probability of one entity beating another. Supports numbers, Player objects, and Team objects:

```typescript
import { calculateExpectedScore } from "@ihs7/ts-elo";

// Using ratings directly
const expected1 = calculateExpectedScore(1460, 1130);
console.log(expected1); // 0.87

// Using Player objects  
const player1 = { id: "p1", rating: 1460 };
const player2 = { id: "p2", rating: 1130 };
const expected2 = calculateExpectedScore(player1, player2);

// Using Team objects (uses average rating)
const team1 = { players: [{ id: "p1", rating: 1400 }, { id: "p2", rating: 1500 }] };
const team2 = { players: [{ id: "p3", rating: 1200 }, { id: "p4", rating: 1100 }] };
const expected3 = calculateExpectedScore(team1, team2);

// Mixed types work too
const expected4 = calculateExpectedScore(player1, team2);
```

## API Reference

### Types

```typescript
interface Player {
  id: string;
  rating: number;
}

interface MatchResultItem {
  id: string;
  newRating: number;
}

type MatchResult = MatchResultItem[];

interface Options {
  kFactor?: number; // default: 15
  strategy?: CalculationStrategy; // default: AVERAGE_TEAMS
}

interface PlayerWithScore {
  player: Player;
  score: number; // higher = better performance
}

interface TeamWithScore {
  players: Player[];
  score: number; // higher = better performance
}

interface Team {
  players: Player[];
}

enum CalculationStrategy {
  AVERAGE_TEAMS = "AVERAGE_TEAMS",
  WEIGHTED_TEAMS = "WEIGHTED_TEAMS",
}
```

### Functions

```typescript
// 1v1 match
calculateDuel(winner: Player, loser: Player, options?: Options): MatchResult

// Free-for-all match
calculateFreeForAll(playersWithScores: PlayerWithScore[], options?: Options): MatchResult

// Team match (2 teams)
calculateTeamMatch(team1: TeamWithScore, team2: TeamWithScore, options?: Options): MatchResult

// Multi-team match (3+ teams, tournaments)
calculateMultiTeamMatch(teams: TeamWithScore[], options?: Options): MatchResult

// Expected score calculation
calculateExpectedScore(entity1: number | Player | Team, entity2: number | Player | Team): number
```

## Migration from v1

See [MIGRATION_v2.md](./MIGRATION_v2.md) for a complete migration guide.
