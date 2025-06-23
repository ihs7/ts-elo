import {
  Duel,
  FreeForAll,
  Team,
  Player,
  TeamMatch,
  CalculationStrategy,
  calculateDuel,
  calculateFreeForAll,
  calculateTeamMatch,
  getExpectedScore,
} from ".";

const DEFAULT_RATING = 1200;
const LOWER_RATING = 1199;
const HIGHER_RATING = 1460;
const MUCH_LOWER_RATING = 1130;

const createPlayer = (id: string, rating: number = DEFAULT_RATING) =>
  new Player(id, rating);

const createPlayers = (ratings: number[]) =>
  ratings.map((rating, index) => createPlayer((index + 1).toString(), rating));

const findPlayerResult = (results: any[], identifier: string) =>
  results.find((r) => r.identifier === identifier);

const expectPlayerRating = (
  results: any[],
  identifier: string,
  expectedRating: number,
) => {
  const result = findPlayerResult(results, identifier);
  expect(result?.rating).toBe(expectedRating);
};

const calculateTotalRating = (players: Player[]) =>
  players.reduce((sum, player) => sum + player.rating, 0);

describe("ELO Rating System", () => {
  describe("Player Expected Scores", () => {
    test("should expect draw when players have equal ratings", () => {
      const [player1, player2] = createPlayers([
        DEFAULT_RATING,
        DEFAULT_RATING,
      ]);
      expect(player1.expectedScoreAgainst(player2)).toBe(0.5);
    });

    test("should expect higher rated player to win", () => {
      const [higherRated, lowerRated] = createPlayers([
        DEFAULT_RATING,
        LOWER_RATING,
      ]);
      expect(higherRated.expectedScoreAgainst(lowerRated)).toBeGreaterThan(0.5);
    });

    test("should expect lower rated player to lose", () => {
      const [lowerRated, higherRated] = createPlayers([
        LOWER_RATING,
        DEFAULT_RATING,
      ]);
      expect(lowerRated.expectedScoreAgainst(higherRated)).toBeLessThan(0.5);
    });

    test("should calculate precise expected score for significant rating difference", () => {
      const [higherRated, lowerRated] = createPlayers([
        HIGHER_RATING,
        MUCH_LOWER_RATING,
      ]);
      expect(higherRated.expectedScoreAgainst(lowerRated)).toBe(
        0.8698499490743091,
      );
    });
  });

  describe("Team Expected Scores", () => {
    test("should expect lower rated team to lose", () => {
      const team1 = new Team("team1", 1);
      team1.addPlayer(createPlayer("1", LOWER_RATING));

      const team2 = new Team("team2", 2);
      team2.addPlayer(createPlayer("2", DEFAULT_RATING));

      expect(team1.expectedScoreAgainst(team2)).toBeLessThan(0.5);
    });
  });

  describe("Duel Matches", () => {
    test("should calculate winner vs loser with different ratings", () => {
      const match = new Duel();
      match.addPlayer(createPlayer("winner", LOWER_RATING), true);
      match.addPlayer(createPlayer("loser", DEFAULT_RATING), false);

      const results = match.calculate();

      expectPlayerRating(results.results, "winner", 1207);
      expectPlayerRating(results.results, "loser", 1192);
    });

    test("should calculate winner vs loser with equal ratings", () => {
      const match = new Duel();
      match.addPlayer(createPlayer("winner", DEFAULT_RATING), true);
      match.addPlayer(createPlayer("loser", DEFAULT_RATING), false);

      const results = match.calculate();

      expectPlayerRating(results.results, "winner", 1208);
      expectPlayerRating(results.results, "loser", 1192);
    });
  });

  describe("Free-For-All Matches", () => {
    test("should calculate ratings based on finishing positions", () => {
      const match = new FreeForAll();
      const testData = [
        { id: "4th", rating: 1000, rank: 4 },
        { id: "3rd", rating: 1200, rank: 3 },
        { id: "2nd", rating: 1300, rank: 2 },
        { id: "1st", rating: 1500, rank: 1 },
      ];

      testData.forEach(({ id, rating, rank }) => {
        match.addPlayer(createPlayer(id, rating), rank);
      });

      const results = match.calculate();

      expectPlayerRating(results.results, "4th", 1038);
      expectPlayerRating(results.results, "3rd", 1211);
      expectPlayerRating(results.results, "2nd", 1289);
      expectPlayerRating(results.results, "1st", 1462);
    });
  });

  describe("Team Matches", () => {
    const setupBasicTeamMatch = (strategy?: CalculationStrategy) => {
      const match = new TeamMatch(
        strategy ? { calculationStrategy: strategy } : undefined,
      );

      const winningTeam = match.addTeam("winners", 2);
      winningTeam.addPlayer(createPlayer("winner1", DEFAULT_RATING));
      winningTeam.addPlayer(createPlayer("winner2", DEFAULT_RATING));

      const losingTeam = match.addTeam("losers", 1);
      losingTeam.addPlayer(createPlayer("loser1", DEFAULT_RATING));
      losingTeam.addPlayer(createPlayer("loser2", DEFAULT_RATING));

      return match;
    };

    test("should calculate team match with equal ratings (default strategy)", () => {
      const match = setupBasicTeamMatch();
      const results = match.calculate();

      expectPlayerRating(results.results, "winner1", 1208);
      expectPlayerRating(results.results, "winner2", 1208);
      expectPlayerRating(results.results, "loser1", 1192);
      expectPlayerRating(results.results, "loser2", 1192);
    });

    describe("AVERAGE_TEAMS Strategy", () => {
      test("should calculate with mixed team ratings", () => {
        const match = new TeamMatch({
          calculationStrategy: CalculationStrategy.AVERAGE_TEAMS,
        });

        const team1 = match.addTeam("team1", 2);
        team1.addPlayer(createPlayer("p1", 1100));
        team1.addPlayer(createPlayer("p2", 1150));

        const team2 = match.addTeam("team2", 1);
        team2.addPlayer(createPlayer("p3", 1300));
        team2.addPlayer(createPlayer("p4", 1000));

        const results = match.calculate();

        expectPlayerRating(results.results, "p1", 1108);
        expectPlayerRating(results.results, "p2", 1158);
        expectPlayerRating(results.results, "p3", 1292);
        expectPlayerRating(results.results, "p4", 992);
      });
    });

    describe("WEIGHTED_TEAMS Strategy", () => {
      test("should calculate with moderate rating differences", () => {
        const match = new TeamMatch({
          calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
        });

        const team1 = match.addTeam("team1", 2);
        team1.addPlayer(createPlayer("p1", 700));
        team1.addPlayer(createPlayer("p2", 1150));

        const team2 = match.addTeam("team2", 1);
        team2.addPlayer(createPlayer("p3", 1300));
        team2.addPlayer(createPlayer("p4", 1000));

        const results = match.calculate();

        expectPlayerRating(results.results, "p1", 709);
        expectPlayerRating(results.results, "p2", 1165);
        expectPlayerRating(results.results, "p3", 1286);
        expectPlayerRating(results.results, "p4", 990);
      });

      test("should handle extreme rating differences", () => {
        const match = new TeamMatch({
          calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
        });

        const team1 = match.addTeam("team1", 2);
        team1.addPlayer(createPlayer("p1", 38));
        team1.addPlayer(createPlayer("p2", 768));

        const team2 = match.addTeam("team2", 1);
        team2.addPlayer(createPlayer("p3", 858));
        team2.addPlayer(createPlayer("p4", 78));

        const results = match.calculate();

        expectPlayerRating(results.results, "p1", 39);
        expectPlayerRating(results.results, "p2", 785);
        expectPlayerRating(results.results, "p3", 841);
        expectPlayerRating(results.results, "p4", 77);
      });

      test("should work correctly with single players per team", () => {
        const match = new TeamMatch({
          calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
        });

        const team1 = match.addTeam("team1", 2);
        team1.addPlayer(createPlayer("p1", DEFAULT_RATING));

        const team2 = match.addTeam("team2", 1);
        team2.addPlayer(createPlayer("p2", DEFAULT_RATING));

        const results = match.calculate();

        expectPlayerRating(results.results, "p1", 1208);
        expectPlayerRating(results.results, "p2", 1192);
      });

      test("should handle equal ratings across teams", () => {
        const match = setupBasicTeamMatch(CalculationStrategy.WEIGHTED_TEAMS);
        const results = match.calculate();

        expectPlayerRating(results.results, "winner1", 1208);
        expectPlayerRating(results.results, "winner2", 1208);
        expectPlayerRating(results.results, "loser1", 1192);
        expectPlayerRating(results.results, "loser2", 1192);
      });
    });

    describe("ELO Point Conservation", () => {
      const testEloConservation = (
        strategy: CalculationStrategy,
        iterations = 1000,
      ) => {
        for (let i = 0; i < iterations; i++) {
          const match = new TeamMatch({ calculationStrategy: strategy });

          const team1 = match.addTeam("team1", 2);
          team1.addPlayer(createPlayer("p1", Math.random() * 1000));
          team1.addPlayer(createPlayer("p2", Math.random() * 1000));

          const team2 = match.addTeam("team2", 1);
          team2.addPlayer(createPlayer("p3", Math.random() * 1000));
          team2.addPlayer(createPlayer("p4", Math.random() * 1000));

          const ratingsBefore = calculateTotalRating(
            match.getTeams().flatMap((team) => team.players),
          );

          const results = match.calculate();
          const ratingsAfter = results.results.reduce(
            (sum, result) => sum + result.rating,
            0,
          );

          expect(ratingsBefore).toBe(ratingsAfter);
        }
      };

      test("should conserve ELO points with WEIGHTED_TEAMS strategy", () => {
        testEloConservation(CalculationStrategy.WEIGHTED_TEAMS);
      });

      test("should conserve ELO points with AVERAGE_TEAMS strategy", () => {
        testEloConservation(CalculationStrategy.AVERAGE_TEAMS);
      });
    });
  });

  describe("Functional Interface", () => {
    test("should calculate duel match", () => {
      const results = calculateDuel(
        { identifier: "winner", rating: LOWER_RATING, won: true },
        { identifier: "loser", rating: DEFAULT_RATING, won: false },
      );

      expectPlayerRating(results, "winner", 1207);
      expectPlayerRating(results, "loser", 1192);
    });

    test("should calculate free-for-all match", () => {
      const players = [
        { identifier: "4th", rating: 1000, rank: 4 },
        { identifier: "3rd", rating: 1200, rank: 3 },
        { identifier: "2nd", rating: 1300, rank: 2 },
        { identifier: "1st", rating: 1500, rank: 1 },
      ];

      const results = calculateFreeForAll(players);

      expectPlayerRating(results, "4th", 1038);
      expectPlayerRating(results, "3rd", 1211);
      expectPlayerRating(results, "2nd", 1289);
      expectPlayerRating(results, "1st", 1462);
    });

    test("should calculate team match with default strategy", () => {
      const teams = [
        {
          identifier: "winners",
          rank: 2,
          players: [
            { identifier: "winner1", rating: DEFAULT_RATING },
            { identifier: "winner2", rating: DEFAULT_RATING },
          ],
        },
        {
          identifier: "losers",
          rank: 1,
          players: [
            { identifier: "loser1", rating: DEFAULT_RATING },
            { identifier: "loser2", rating: DEFAULT_RATING },
          ],
        },
      ];

      const results = calculateTeamMatch(teams);

      expectPlayerRating(results, "winner1", 1208);
      expectPlayerRating(results, "winner2", 1208);
      expectPlayerRating(results, "loser1", 1192);
      expectPlayerRating(results, "loser2", 1192);
    });

    test("should calculate team match with WEIGHTED_TEAMS strategy", () => {
      const teams = [
        {
          identifier: "team1",
          rank: 2,
          players: [
            { identifier: "p1", rating: 700 },
            { identifier: "p2", rating: 1150 },
          ],
        },
        {
          identifier: "team2",
          rank: 1,
          players: [
            { identifier: "p3", rating: 1300 },
            { identifier: "p4", rating: 1000 },
          ],
        },
      ];

      const results = calculateTeamMatch(teams, {
        calculationStrategy: CalculationStrategy.WEIGHTED_TEAMS,
      });

      expectPlayerRating(results, "p1", 709);
      expectPlayerRating(results, "p2", 1165);
      expectPlayerRating(results, "p3", 1286);
      expectPlayerRating(results, "p4", 990);
    });

    test("should calculate expected score between players", () => {
      const expectedScore = getExpectedScore(HIGHER_RATING, MUCH_LOWER_RATING);
      expect(expectedScore).toBe(0.8698499490743091);
    });
  });
});
