# Migration Guide: ts-elo 1.x to 2.x

v2 introduces a functional API that replaces the class-based approach with simple, pure functions.

## Breaking Changes

- All classes removed → replaced with functions
- `Player` class → `{ id, rating }` objects
- Multi-step setup → single function calls
- Team matches now use `score` instead of `rank` (higher score = better performance)
- Strong typing enforces at least 2 teams at compile time

## Migration Examples

### 1v1 Duels

**Before (v1):**

```typescript
const match = new Duel({ kFactor: 15 });
match.addPlayer(new Player("player1", 1200), true);
match.addPlayer(new Player("player2", 1320), false);
const results = match.calculate();
```

**After (v2):**

```typescript
const results = calculateDuel(
  { id: "player1", rating: 1200 }, // winner
  { id: "player2", rating: 1320 }, // loser
  { kFactor: 15 }
);
```

### Free-for-All

**Before (v1):**

```typescript
const match = new FreeForAll();
match.addPlayer(new Player("player1", 1280), 1);
match.addPlayer(new Player("player2", 1300), 2);
match.addPlayer(new Player("player3", 1220), 3);
const results = match.calculate();
```

**After (v2):**

```typescript
const results = calculateFreeForAll([
  { player: { id: "player1", rating: 1280 }, score: 100 },
  { player: { id: "player2", rating: 1300 }, score: 75 },
  { player: { id: "player3", rating: 1220 }, score: 50 },
]);
```

### Team Matches

**Before (v1):**

```typescript
const match = new TeamMatch({
  calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
});
const team1 = match.addTeam("team1", 2);
team1.addPlayer(new Player("p1", 1230));
team1.addPlayer(new Player("p2", 1260));
const team2 = match.addTeam("team2", 1);
team2.addPlayer(new Player("p3", 1120));
team2.addPlayer(new Player("p4", 1410));
const results = match.calculate();
```

**After (v2):**

```typescript
const winningTeam = {
  players: [
    { id: "p1", rating: 1230 },
    { id: "p2", rating: 1260 },
  ],
  score: 100, // higher score = better performance
};

const losingTeam = {
  players: [
    { id: "p3", rating: 1120 },
    { id: "p4", rating: 1410 },
  ],
  score: 75,
};

const results = calculateTeamMatch(winningTeam, losingTeam, {
  strategy: CalculationStrategy.WEIGHTED_TEAMS
});
```

**For 3+ teams, use `calculateMultiTeamMatch`:**

```typescript
const teams = [team1, team2, team3];
const results = calculateMultiTeamMatch(teams, {
  strategy: CalculationStrategy.WEIGHTED_TEAMS
});
```

### Expected Score

**Before (v1):**

```typescript
const player1 = new Player("p1", 1460);
const expectedScore = player1.expectedScoreAgainst(1130);
```

**After (v2):**

```typescript
const expectedScore = calculateExpectedScore(1460, 1130);
```
