# Copilot Instructions for ts-elo

## Project Overview

This is a TypeScript library implementing the Elo rating system for competitive games. It supports three core match types: head-to-head duels, free-for-all multiplayer matches, and team-based matches with two calculation strategies.

## Core Architecture

### Match Types & Calculation Flow

- **`Duel`**: 1v1 matches using boolean win/loss
- **`FreeForAll`**: Multi-player matches using numeric rankings (1st, 2nd, 3rd, etc.)
- **`TeamMatch`**: Team-based matches with two calculation strategies:
  - `AVERAGE_TEAMS`: Teams treated as single entities with average ratings
  - `WEIGHTED_TEAMS`: Individual player contributions weighted by their rating percentage within the team

All match types internally convert to `Team` objects and use `EloMatchResult` for calculation.

### Key Classes & Relationships

- `Player`: Basic entity with identifier and rating, provides `expectedScoreAgainst()` calculations
- `Team`: Container for players with scoring, calculates average/total ratings and player weights
- `EloMatchResult`: Core calculation engine that processes team-vs-team comparisons
- All rating updates preserve total Elo points (zero-sum system)

## Development Patterns

### Constructor Options Pattern

```typescript
interface Options {
  kFactor?: number; // Default: 15
  calculationStrategy?: CalculationStrategy; // Default: AVERAGE_TEAMS
}
```

All match classes accept optional `Options` parameter for customization.

### Fluent Interface Design

Match setup uses method chaining:

```typescript
const match = new TeamMatch()
  .addTeam("team1", 1)
  .addPlayer(new Player("p1", 1200));
```

### Guard Methods Convention

Classes use `guardDuplicate()` and similar methods to validate state before operations.

### Self-Explanatory Code Style

The codebase prioritizes clear, descriptive naming and structure over code comments:

- Method names like `expectedScoreAgainst()`, `averageRating()`, `getPlayerWeight()` clearly indicate purpose
- Variable names are explicit: `eloPointsBefore`, `playerWeight`, `versusRating`
- Complex logic is broken into well-named private methods rather than commented blocks
- Avoid adding code comments unless documenting non-obvious mathematical formulas or business rules

## Testing Philosophy

### Comprehensive Strategy Coverage

Tests cover both calculation strategies extensively, including edge cases like:

- Identical ratings
- Extreme rating differences (38 vs 768)
- Single-player teams
- Rounding precision

### Zero-Sum Validation

Critical invariant tests ensure total Elo points remain constant:

```typescript
// Pattern used in multiple tests
expect(eloPointsBefore).toBe(eloPointsAfter);
```

## Build & Development Workflow

### Commands

- `npm run build`: TypeScript compilation to `dist/`
- `npm test`: Jest test suite
- `npm run test:watch`: Watch mode for TDD
- `npm run lint`: ESLint with TypeScript strict rules
- `npm run prettier`: Code formatting

### Code Quality Setup

- ESLint with `typescript-eslint` strict + stylistic configs
- Prettier integration via `eslint-config-prettier`
- Tests excluded from linting but included in TypeScript compilation
- CommonJS module system with ES6 target

## Mathematical Implementation Notes

### Expected Score Formula

Uses standard Elo formula: `1 / (1 + 10^((opponent_rating - player_rating) / 400))`

### Weighted Teams Calculation

Player weight = `player_rating / team_total_rating` with micro-adjustments for rounding precision (±0.0001).

### Rating Updates

Final changes rounded using `Math.sign(eloDiff) * Math.round(Math.abs(eloDiff))` to preserve directionality.

## When Contributing

- All rating calculations must maintain zero-sum property
- Add corresponding tests for new calculation strategies
- Follow the established guard method pattern for validation
- Ensure TypeScript strict mode compliance
- Update README examples for new public APIs
