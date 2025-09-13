# Migration Guide: ts-elo 0.x to 1.x

This guide helps you migrate from ts-elo version 0.x to 1.x, which introduced breaking changes to the `CalculationStrategy` enum.

## Breaking Changes

### 1. Removed `CalculationStrategy.INDIVIDUAL_VS_TEAM`

The `INDIVIDUAL_VS_TEAM` calculation strategy has been removed in v1.0.0.

**Before (0.x):**

```typescript
import { CalculationStrategy, TeamMatch } from "ts-elo";

const match = new TeamMatch({
  calculationStrategy: CalculationStrategy.INDIVIDUAL_VS_TEAM,
});
```

**After (1.x):**

```typescript
import { CalculationStrategy, TeamMatch } from "ts-elo";

// Use WEIGHTED_TEAMS for individual player contribution weighting
const match = new TeamMatch({
  calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
});

// Or use AVERAGE_TEAMS for team-based calculations
const match = new TeamMatch({
  calculationStrategy: CalculationStrategy.AVERAGE_TEAMS,
});
```

### 2. Renamed `CalculationStrategy.TEAM_VS_TEAM` to `CalculationStrategy.AVERAGE_TEAMS`

**Before (0.x):**

```typescript
import { CalculationStrategy, TeamMatch } from "ts-elo";

const match = new TeamMatch({
  calculationStrategy: CalculationStrategy.TEAM_VS_TEAM,
});
```

**After (1.x):**

```typescript
import { CalculationStrategy, TeamMatch } from "ts-elo";

const match = new TeamMatch({
  calculationStrategy: CalculationStrategy.AVERAGE_TEAMS,
});
```

## New Features

### 3. New `CalculationStrategy.WEIGHTED_TEAMS`

v1.0.0 introduces a new calculation strategy that weights individual player contributions based on their rating percentage within the team.

**Usage:**

```typescript
import { CalculationStrategy, TeamMatch, Team, Player } from "ts-elo";

const match = new TeamMatch({
  calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
});

const team1 = match.addTeam("team1", 1); // winning team
const team2 = match.addTeam("team2", 0); // losing team

// Higher-rated players will have more impact on rating changes
team1.addPlayer(new Player("alice", 1500)); // 60% weight
team1.addPlayer(new Player("bob", 1000)); // 40% weight

team2.addPlayer(new Player("charlie", 1200)); // 55% weight
team2.addPlayer(new Player("dave", 1000)); // 45% weight

const results = match.calculate();
```

## Migration Steps

1. **Replace `TEAM_VS_TEAM` with `AVERAGE_TEAMS`**
   - Search your codebase for `CalculationStrategy.TEAM_VS_TEAM`
   - Replace all occurrences with `CalculationStrategy.AVERAGE_TEAMS`

2. **Handle `INDIVIDUAL_VS_TEAM` removal**
   - Search your codebase for `CalculationStrategy.INDIVIDUAL_VS_TEAM`
   - Choose between:
     - `WEIGHTED_TEAMS`: For individual player contribution weighting
     - `AVERAGE_TEAMS`: For traditional team-based calculations

3. **Update TypeScript types**
   - If you have any type annotations referencing the old enum values, update them accordingly

## Complete Migration Example

**Before (0.x):**

```typescript
import { CalculationStrategy, TeamMatch, Player } from "ts-elo";

// Old enum values
const teamMatch = new TeamMatch({
  calculationStrategy: CalculationStrategy.TEAM_VS_TEAM,
});

const individualMatch = new TeamMatch({
  calculationStrategy: CalculationStrategy.INDIVIDUAL_VS_TEAM,
});
```

**After (1.x):**

```typescript
import { CalculationStrategy, TeamMatch, Player } from "ts-elo";

// Renamed enum value
const teamMatch = new TeamMatch({
  calculationStrategy: CalculationStrategy.AVERAGE_TEAMS,
});

// Choose new strategy based on your needs
const weightedMatch = new TeamMatch({
  calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
});
```

## Default Behavior

The default calculation strategy remains unchanged - it's still team-based averaging (now called `AVERAGE_TEAMS`), so basic usage without specifying a strategy will continue to work as before.

**Works the same in both versions:**

```typescript
import { TeamMatch } from "ts-elo";

const match = new TeamMatch(); // Uses default AVERAGE_TEAMS strategy
```