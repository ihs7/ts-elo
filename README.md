@ihs7/ts-elo
=======

ELO calculation library in TypeScript

Supports heads up, team and multiplayer calculations

### Installing ts-elo

	npm i @ihs7/ts-elo

### Two player scenario
Create and calculate match between two players
* Player 1 has 1200 rating and wins
* Player 2 has 1320 rating and loses
* Get results

```typescript
const match = new Duel();
match.addPlayer(new Player("player-identifier-1", 1200), true);
match.addPlayer(new Player("player-identifier-2", 1320), false);
const results = match.calculate();
```
### Three player scenario
Create a match between three players
* Player 1 has 1280 rating and places 1st
* Player 2 has 1300 rating and places 2nd
* Player 3 has 1220 rating and places 3rd
* Get results

```typescript
const match = new FreeForAll();
match.addPlayer(new Player("player-identifier-1", 1280), 1);
match.addPlayer(new Player("player-identifier-2", 1300), 2);
match.addPlayer(new Player("player-identifier-3", 1220), 3);
const results = match.calculate();
```
The calculations is based on:
- Player 1 won Player 2 and Player 3
- Player 2 won Player 3 and lost to Player 1
- Player 3 lost to Player 1 and Player 2

### Two versus two scenario
* Team 1 consists of Player 1 with 1230 ELO and Player 2 with 1260 ELO
* Team 2 consists of Player 3 with 1120 ELO and Player 4 with 1410 ELO
* Team 1 wins Team 2
* Get results

```typescript
const match = new TeamMatch();
const team1 = match.addTeam("1", 1);
team1.addPlayer(new Player("player-identifier-1", 1230));
team1.addPlayer(new Player("player-identifier-2", 1260));
const team2 = match.addTeam("2", 2);
team2.addPlayer(new Player("player-identifier-3", 1120));
team2.addPlayer(new Player("player-identifier-4", 1410));
const results = match.calculate();
```

Each team has a rating which is an average of the team members. 

Team 1 has a rating of 1245 ((1230+1260)/2)

Team 2 has a rating of 1265 ((1120+1410)/2)

### Get expected score between two ratings

Say you have two players, one with 1460 ELO and another with 1130 ELO, and want to know the likelihood of one winning another.

```typescript
const player1 = new Player("player-identifier-1", 1460);
const player2 = new Player("player-identifier-2", 1130);
const expectedScore = player1.expectedScoreAgainst(player2);
```

This returns a float number and in this specific scenario the value is 0.8698499 meaning the higher ranked player is estimated to win 87% of encounters.