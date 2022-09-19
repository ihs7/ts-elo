import {
  Duel,
  FreeForAll,
  Team,
  Player,
  TeamMatch,
  CalculationStrategy,
} from ".";

test("should expect equal players to draw", () => {
  const player1 = new Player("1", 1200);
  const player2 = new Player("2", 1200);
  expect(player1.expectedScoreAgainst(player2)).toBe(0.5);
});

test("should expect higher rated player to win", () => {
  const player1 = new Player("1", 1200);
  const player2 = new Player("2", 1199);
  expect(player1.expectedScoreAgainst(player2)).toBeGreaterThan(0.5);
});

test("should expect lower rated player to lose", () => {
  const player1 = new Player("1", 1199);
  const player2 = new Player("2", 1200);
  expect(player1.expectedScoreAgainst(player2)).toBeLessThan(0.5);
});

test("should expect lower rated team to lose", () => {
  const team1 = new Team("1", 1);
  team1.addPlayer(new Player("1", 1199));
  const team2 = new Team("2", 2);
  team2.addPlayer(new Player("2", 1200));

  expect(team1.expectedScoreAgainst(team2)).toBeLessThan(0.5);
});

test("should calculate expectedScoreAgainst correctly", () => {
  const player1 = new Player("1", 1460);
  const player2 = new Player("2", 1130);
  expect(player1.expectedScoreAgainst(player2)).toBe(0.8698499490743091);
});

test("should calculate Duel correctly", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";

  const match = new Duel();
  match.addPlayer(new Player(playerIdentifier1, 1199), true);
  match.addPlayer(new Player(playerIdentifier2, 1200), false);
  const results = match.calculate();
  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating
  ).toBe(1207);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating
  ).toBe(1192);
});

test("should calculate FreeForAll correctly", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";
  const playerIdentifier3 = "3";
  const playerIdentifier4 = "4";
  const match = new FreeForAll();
  match.addPlayer(new Player(playerIdentifier1, 1000), 1);
  match.addPlayer(new Player(playerIdentifier2, 1200), 2);
  match.addPlayer(new Player(playerIdentifier3, 1300), 3);
  match.addPlayer(new Player(playerIdentifier4, 1500), 4);
  const results = match.calculate();
  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating
  ).toBe(1038);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating
  ).toBe(1211);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier3)?.rating
  ).toBe(1289);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier4)?.rating
  ).toBe(1462);
});

test("should calculate TeamMatch correctly with TEAM_VS_TEAM strategy", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";
  const playerIdentifier3 = "3";
  const playerIdentifier4 = "4";

  const match = new TeamMatch({
    calculationStrategy: CalculationStrategy.TEAM_VS_TEAM,
  });
  const team1 = match.addTeam("1", 1);
  team1.addPlayer(new Player(playerIdentifier1, 1100));
  team1.addPlayer(new Player(playerIdentifier2, 1150));
  const team2 = match.addTeam("2", 2);
  team2.addPlayer(new Player(playerIdentifier3, 1300));
  team2.addPlayer(new Player(playerIdentifier4, 1000));

  const results = match.calculate();
  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating
  ).toBe(1108);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating
  ).toBe(1158);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier3)?.rating
  ).toBe(1292);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier4)?.rating
  ).toBe(992);
});

test("should calculate TeamMatch correctly with INDIVIDUAL_VS_TEAM strategy", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";
  const playerIdentifier3 = "3";
  const playerIdentifier4 = "4";

  const match = new TeamMatch({
    calculationStrategy: CalculationStrategy.INDIVIDUAL_VS_TEAM,
  });
  const team1 = match.addTeam("1", 1);
  team1.addPlayer(new Player(playerIdentifier1, 1100));
  team1.addPlayer(new Player(playerIdentifier2, 1150));
  const team2 = match.addTeam("2", 2);
  team2.addPlayer(new Player(playerIdentifier3, 1300));
  team2.addPlayer(new Player(playerIdentifier4, 1000));

  const results = match.calculate();

  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating
  ).toBe(1109);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating
  ).toBe(1158);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier3)?.rating
  ).toBe(1289);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier4)?.rating
  ).toBe(995);
});
