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
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating,
  ).toBe(1207);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating,
  ).toBe(1192);
});

test("should calculate Duel correctly with rounding", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";

  const match = new Duel();
  match.addPlayer(new Player(playerIdentifier1, 1200), true);
  match.addPlayer(new Player(playerIdentifier2, 1200), false);
  const results = match.calculate();
  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating,
  ).toBe(1208);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating,
  ).toBe(1192);
});

test("should calculate FreeForAll correctly", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";
  const playerIdentifier3 = "3";
  const playerIdentifier4 = "4";
  const match = new FreeForAll();
  match.addPlayer(new Player(playerIdentifier1, 1000), 4);
  match.addPlayer(new Player(playerIdentifier2, 1200), 3);
  match.addPlayer(new Player(playerIdentifier3, 1300), 2);
  match.addPlayer(new Player(playerIdentifier4, 1500), 1);
  const results = match.calculate();
  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating,
  ).toBe(1038);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating,
  ).toBe(1211);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier3)?.rating,
  ).toBe(1289);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier4)?.rating,
  ).toBe(1462);
});

test("should calculate TeamMatch correctly with rounding", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";
  const playerIdentifier3 = "3";
  const playerIdentifier4 = "4";

  const match = new TeamMatch();
  const team1 = match.addTeam("1", 2);
  team1.addPlayer(new Player(playerIdentifier1, 1200));
  team1.addPlayer(new Player(playerIdentifier2, 1200));
  const team2 = match.addTeam("2", 1);
  team2.addPlayer(new Player(playerIdentifier3, 1200));
  team2.addPlayer(new Player(playerIdentifier4, 1200));

  const results = match.calculate();
  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating,
  ).toBe(1208);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating,
  ).toBe(1208);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier3)?.rating,
  ).toBe(1192);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier4)?.rating,
  ).toBe(1192);
});

test("should calculate TeamMatch correctly with AVERAGE_TEAMS strategy", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";
  const playerIdentifier3 = "3";
  const playerIdentifier4 = "4";

  const match = new TeamMatch({
    calculationStrategy: CalculationStrategy.AVERAGE_TEAMS,
  });
  const team1 = match.addTeam("1", 2);
  team1.addPlayer(new Player(playerIdentifier1, 1100));
  team1.addPlayer(new Player(playerIdentifier2, 1150));
  const team2 = match.addTeam("2", 1);
  team2.addPlayer(new Player(playerIdentifier3, 1300));
  team2.addPlayer(new Player(playerIdentifier4, 1000));

  const results = match.calculate();
  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating,
  ).toBe(1108);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating,
  ).toBe(1158);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier3)?.rating,
  ).toBe(1292);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier4)?.rating,
  ).toBe(992);
});

test("should calculate TeamMatch correctly with WEIGHTED_TEAMS strategy", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";
  const playerIdentifier3 = "3";
  const playerIdentifier4 = "4";

  const match = new TeamMatch({
    calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
  });
  const team1 = match.addTeam("1", 2);
  team1.addPlayer(new Player(playerIdentifier1, 700));
  team1.addPlayer(new Player(playerIdentifier2, 1150));
  const team2 = match.addTeam("2", 1);
  team2.addPlayer(new Player(playerIdentifier3, 1300));
  team2.addPlayer(new Player(playerIdentifier4, 1000));

  const results = match.calculate();

  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating,
  ).toBe(709);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating,
  ).toBe(1165);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier3)?.rating,
  ).toBe(1286);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier4)?.rating,
  ).toBe(990);
});

test("should calculate TeamMatch correctly with WEIGHTED_TEAM strategy with big rating difference", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";
  const playerIdentifier3 = "3";
  const playerIdentifier4 = "4";

  const match = new TeamMatch({
    calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
  });
  const team1 = match.addTeam("1", 2);
  team1.addPlayer(new Player(playerIdentifier1, 38));
  team1.addPlayer(new Player(playerIdentifier2, 768));
  const team2 = match.addTeam("2", 1);
  team2.addPlayer(new Player(playerIdentifier3, 858));
  team2.addPlayer(new Player(playerIdentifier4, 78));

  const results = match.calculate();

  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating,
  ).toBe(39);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating,
  ).toBe(785);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier3)?.rating,
  ).toBe(841);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier4)?.rating,
  ).toBe(77);
});

test("should calculate TeamMatch correctly with AVERAGE_TEAMS even when singles", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";

  const match = new TeamMatch({
    calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
  });
  const team1 = match.addTeam("1", 2);
  team1.addPlayer(new Player(playerIdentifier1, 1200));
  const team2 = match.addTeam("2", 1);
  team2.addPlayer(new Player(playerIdentifier2, 1200));

  const results = match.calculate();

  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating,
  ).toBe(1208);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating,
  ).toBe(1192);
});

test("should calculate TeamMatch correctly with WEIGHTED_TEAM even when singles", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";

  const match = new TeamMatch({
    calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
  });
  const team1 = match.addTeam("1", 2);
  team1.addPlayer(new Player(playerIdentifier1, 1200));
  const team2 = match.addTeam("2", 1);
  team2.addPlayer(new Player(playerIdentifier2, 1200));

  const results = match.calculate();

  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating,
  ).toBe(1208);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating,
  ).toBe(1192);
});

test("should calculate TeamMatch correctly with WEIGHTED_TEAM strategy with same ratings", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";
  const playerIdentifier3 = "3";
  const playerIdentifier4 = "4";

  const match = new TeamMatch({
    calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
  });
  const team1 = match.addTeam("1", 2);
  team1.addPlayer(new Player(playerIdentifier1, 1200));
  team1.addPlayer(new Player(playerIdentifier2, 1200));
  const team2 = match.addTeam("2", 1);
  team2.addPlayer(new Player(playerIdentifier3, 1200));
  team2.addPlayer(new Player(playerIdentifier4, 1200));

  const results = match.calculate();

  expect(
    results.results.find((c) => c.identifier === playerIdentifier1)?.rating,
  ).toBe(1208);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier2)?.rating,
  ).toBe(1208);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier3)?.rating,
  ).toBe(1192);
  expect(
    results.results.find((c) => c.identifier === playerIdentifier4)?.rating,
  ).toBe(1192);
});

test("should not inflate/deflate ELO points using WEIGHTED_TEAM", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";
  const playerIdentifier3 = "3";
  const playerIdentifier4 = "4";

  for (let i = 0; i < 10000; i++) {
    const match = new TeamMatch({
      calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
    });
    const team1 = match.addTeam("1", 2);
    team1.addPlayer(new Player(playerIdentifier1, Math.random() * 1000));
    team1.addPlayer(new Player(playerIdentifier2, Math.random() * 1000));
    const team2 = match.addTeam("2", 1);
    team2.addPlayer(new Player(playerIdentifier3, Math.random() * 1000));
    team2.addPlayer(new Player(playerIdentifier4, Math.random() * 1000));

    const eloPointsBefore = match.getTeams().reduce((acc, team) => {
      return (
        acc +
        team.players.reduce((acc, player) => {
          return acc + player.rating;
        }, 0)
      );
    }, 0);

    const results = match.calculate();

    const eloPointsAfter = results.results.reduce((acc, result) => {
      return acc + result.rating;
    }, 0);

    expect(eloPointsBefore).toBe(eloPointsAfter);
  }
});

test("should not inflate/deflate ELO points using AVERAGE_TEAMS", () => {
  const playerIdentifier1 = "1";
  const playerIdentifier2 = "2";
  const playerIdentifier3 = "3";
  const playerIdentifier4 = "4";

  for (let i = 0; i < 10000; i++) {
    const match = new TeamMatch({
      calculationStrategy: CalculationStrategy.AVERAGE_TEAMS,
    });
    const team1 = match.addTeam("1", 2);
    team1.addPlayer(new Player(playerIdentifier1, Math.random() * 1000));
    team1.addPlayer(new Player(playerIdentifier2, Math.random() * 1000));
    const team2 = match.addTeam("2", 1);
    team2.addPlayer(new Player(playerIdentifier3, Math.random() * 1000));
    team2.addPlayer(new Player(playerIdentifier4, Math.random() * 1000));

    const eloPointsBefore = match.getTeams().reduce((acc, team) => {
      return (
        acc +
        team.players.reduce((acc, player) => {
          return acc + player.rating;
        }, 0)
      );
    }, 0);

    const results = match.calculate();

    const eloPointsAfter = results.results.reduce((acc, result) => {
      return acc + result.rating;
    }, 0);

    expect(eloPointsBefore).toBe(eloPointsAfter);
  }
});
