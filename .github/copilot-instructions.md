# Copilot Instructions for ts-elo

## Project Overview

A TypeScript library implementing the Elo rating system for competitive games. The library provides a functional API with four main calculation functions supporting head-to-head duels, free-for-all matches, team matches, and multi-team tournaments.

## API Structure

### Functional Design Philosophy

The library provides a clean functional API organized around match scenarios. Each calculation function is pure, stateless, and focused on a specific competitive format. The API scales from simple head-to-head matches to complex multi-team tournaments while maintaining consistent input/output patterns.

### Match Type Coverage

The library handles the full spectrum of competitive scenarios: binary win/loss duels, score-based free-for-all competitions, team-versus-team matches, and multi-team tournaments. Each match type accepts contextually appropriate inputs while following the same underlying Elo mathematical principles.

### Team Strategy Flexibility

Team-based calculations offer two approaches: averaging team member ratings for uniform distribution, or weighting individual contributions based on relative skill levels within the team. This flexibility accommodates different competitive philosophies and fairness requirements.

### Mathematical Integrity

All calculations preserve the zero-sum property fundamental to Elo systems. The library ensures mathematical correctness through consistent rounding, proper expected score calculations, and invariant validation across all match scenarios.

## Development Patterns

### Functional API Design

All functions are pure with no side effects, accepting parameters and returning new rating calculations.

### Options Pattern

Functions accept optional configuration with kFactor (default: 15) and strategy (default: AVERAGE_TEAMS).

### Self-Explanatory Code Style

The codebase prioritizes clear, descriptive naming and structure over code comments:

- Method names should clearly indicate purpose
- Use explicit variable names
- Complex logic is broken into well-named private methods rather than commented blocks
- Avoid adding code comments unless documenting non-obvious mathematical formulas or business rules

## Testing Philosophy

### Comprehensive Strategy Coverage

Tests cover both calculation strategies extensively, including edge cases like:

- Identical ratings
- Extreme rating differences
- Single-player teams
- Rounding precision

### Zero-Sum Validation

Critical invariant tests ensure total Elo points remain constant across all rating changes.

## Build & Development Workflow

### Commands

- `npm run build`: TypeScript compilation to `dist/`
- `npm test`: Jest test suite with ts-jest
- `npm run test:watch`: Watch mode for TDD
- `npm run lint`: ESLint with TypeScript strict rules
- `npm run prettier`: Code formatting
- `npm run prettier:check`: Format validation

### Code Quality Setup

- ESLint with `typescript-eslint` strict configurations
- Prettier integration via `eslint-config-prettier`
- Jest with `ts-jest` preset for TypeScript testing
- CommonJS module system targeting ES6
- Dist folder excluded from version control and testing

## Mathematical Implementation Notes

### Expected Score Formula

Uses standard Elo formula: `1 / (1 + 10^((opponent_rating - player_rating) / 400))`

### Weighted Teams Calculation

Player weight = `player_rating / team_total_rating` with micro-adjustments for rounding precision (±0.0001).

### Rating Updates

Final changes rounded using `Math.sign(eloDiff) * Math.round(Math.abs(eloDiff))` to preserve directionality.

## Development Guidelines

### Mathematical Correctness

- All rating calculations must maintain zero-sum property (total Elo unchanged)
- Test edge cases: identical ratings, extreme differences, single players
- Validate rounding behavior preserves mathematical integrity

### Code Standards

- Maintain functional programming approach with pure functions
- Use explicit, self-documenting naming over comments
- Follow TypeScript strict mode requirements
- Add comprehensive test coverage for new features

### API Changes

- Update README examples for any new public functions
- Maintain backward compatibility or provide migration guide
- Export new types and enums from main index file
