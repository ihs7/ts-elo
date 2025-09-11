import {
  calculateDuel,
  calculateFreeForAll,
  calculateTeamMatch,
  calculateMultiTeamMatch,
  calculateExpectedScore,
  CalculationStrategy,
  type Player,
  type Team,
} from "./index";

describe("calculateExpectedScore", () => {
  test("should calculate expected score correctly with numbers", () => {
    expect(calculateExpectedScore(1200, 1200)).toBeCloseTo(0.5);
    expect(calculateExpectedScore(1300, 1200)).toBeGreaterThan(0.5);
    expect(calculateExpectedScore(1100, 1200)).toBeLessThan(0.5);
  });

  test("should calculate expected score correctly with Player objects", () => {
    const higherRatedPlayer: Player = { id: "p1", rating: 1300 };
    const lowerRatedPlayer: Player = { id: "p2", rating: 1200 };
    const expectedScoreForEqualRatings = 0.5;

    expect(
      calculateExpectedScore(higherRatedPlayer, lowerRatedPlayer),
    ).toBeGreaterThan(expectedScoreForEqualRatings);
    expect(
      calculateExpectedScore(lowerRatedPlayer, higherRatedPlayer),
    ).toBeLessThan(expectedScoreForEqualRatings);
  });

  test("should calculate expected score correctly with Team objects", () => {
    const higherRatedTeam: Team = {
      players: [
        { id: "p1", rating: 1200 },
        { id: "p2", rating: 1400 },
      ],
    }; // average: 1300

    const lowerRatedTeam: Team = {
      players: [
        { id: "p3", rating: 1100 },
        { id: "p4", rating: 1100 },
      ],
    }; // average: 1100

    const expectedScoreForEqualRatings = 0.5;

    expect(
      calculateExpectedScore(higherRatedTeam, lowerRatedTeam),
    ).toBeGreaterThan(expectedScoreForEqualRatings);
    expect(
      calculateExpectedScore(lowerRatedTeam, higherRatedTeam),
    ).toBeLessThan(expectedScoreForEqualRatings);
  });

  test("should calculate expected score with mixed entity types", () => {
    const higherRatedPlayer: Player = { id: "p1", rating: 1300 };
    const lowerRatedTeam: Team = {
      players: [
        { id: "p2", rating: 1200 },
        { id: "p3", rating: 1200 },
      ],
    }; // average: 1200

    const highestRating = 1400;
    const lowestRating = 1100;
    const expectedScoreForEqualRatings = 0.5;

    expect(
      calculateExpectedScore(higherRatedPlayer, lowerRatedTeam),
    ).toBeGreaterThan(expectedScoreForEqualRatings);
    expect(
      calculateExpectedScore(highestRating, higherRatedPlayer),
    ).toBeGreaterThan(expectedScoreForEqualRatings);
    expect(
      calculateExpectedScore(lowerRatedTeam, lowestRating),
    ).toBeGreaterThan(expectedScoreForEqualRatings);
  });

  test("should throw error for empty team", () => {
    const emptyTeam: Team = { players: [] };
    const validPlayer: Player = { id: "p1", rating: 1200 };
    const expectedErrorMessage = "Team cannot be empty";

    expect(() => calculateExpectedScore(emptyTeam, validPlayer)).toThrow(
      expectedErrorMessage,
    );
  });

  test("should validate getRating function with invalid entity", () => {
    const invalidEntity = { someOtherProperty: "value" };
    const validRating = 1200;
    const expectedErrorMessage = "Invalid entity type for rating calculation";

    expect(() =>
      calculateExpectedScore(invalidEntity as never, validRating),
    ).toThrow(expectedErrorMessage);
  });
});

describe("calculateDuel", () => {
  test("should calculate 1v1 match correctly", () => {
    const winner: Player = { id: "player1", rating: 1200 };
    const loser: Player = { id: "player2", rating: 1320 };
    const initialWinnerRating = winner.rating;
    const initialLoserRating = loser.rating;
    const expectedResultCount = 2;

    const results = calculateDuel(winner, loser);

    expect(results).toHaveLength(expectedResultCount);

    const winnerResult = results.find((r) => r.id === "player1")!;
    const loserResult = results.find((r) => r.id === "player2")!;

    expect(winnerResult.newRating).toBeGreaterThan(initialWinnerRating);
    expect(loserResult.newRating).toBeLessThan(initialLoserRating);
  });

  test("should handle custom k-factor", () => {
    const winner: Player = { id: "player1", rating: 1200 };
    const loser: Player = { id: "player2", rating: 1200 };
    const customKFactor = 30;
    const expectedRatingGain = 15; // 30 * 0.5 = 15 points for equal ratings

    const results = calculateDuel(winner, loser, { kFactor: customKFactor });
    const winnerResult = results.find((r) => r.id === "player1")!;

    expect(winnerResult.newRating).toBe(winner.rating + expectedRatingGain);
  });

  test("should handle negative ratings", () => {
    const negativeRatedPlayer: Player = { id: "p1", rating: -100 };
    const positiveRatedPlayer: Player = { id: "p2", rating: 1200 };

    const results = calculateDuel(negativeRatedPlayer, positiveRatedPlayer);
    const expectedResultCount = 2;

    expect(results).toHaveLength(expectedResultCount);
    expect(results.find((r) => r.id === "p1")!.newRating).toBeGreaterThan(-100);
  });

  test("should handle very large rating differences", () => {
    const lowRatedPlayer: Player = { id: "low", rating: 400 };
    const highRatedPlayer: Player = { id: "high", rating: 2800 };

    const results = calculateDuel(lowRatedPlayer, highRatedPlayer);
    const lowPlayerResult = results.find((r) => r.id === "low")!;
    const highPlayerResult = results.find((r) => r.id === "high")!;

    // Low rated player beating high rated should gain significant points
    expect(lowPlayerResult.newRating - lowRatedPlayer.rating).toBeGreaterThan(
      10,
    );
    expect(highPlayerResult.newRating).toBeLessThan(highRatedPlayer.rating);
  });

  test("should handle identical players in duel", () => {
    const identicalRating = 1500;
    const player1: Player = { id: "p1", rating: identicalRating };
    const player2: Player = { id: "p2", rating: identicalRating };

    const results = calculateDuel(player1, player2);
    const player1Result = results.find((r) => r.id === "p1")!;
    const player2Result = results.find((r) => r.id === "p2")!;

    // Winner should gain points, loser should lose points
    expect(player1Result.newRating).toBeGreaterThan(player1.rating);
    expect(player2Result.newRating).toBeLessThan(player2.rating);

    // Verify zero-sum property
    const totalChange =
      player1Result.newRating -
      player1.rating +
      (player2Result.newRating - player2.rating);
    expect(Math.abs(totalChange)).toBeLessThanOrEqual(1); // Allow for rounding
  });

  test("should handle zero k-factor", () => {
    const winner: Player = { id: "winner", rating: 1200 };
    const loser: Player = { id: "loser", rating: 1300 };
    const zeroKFactor = 0;

    const results = calculateDuel(winner, loser, { kFactor: zeroKFactor });
    const winnerResult = results.find((r) => r.id === "winner")!;
    const loserResult = results.find((r) => r.id === "loser")!;

    // With k-factor 0, ratings should not change
    expect(winnerResult.newRating).toBe(winner.rating);
    expect(loserResult.newRating).toBe(loser.rating);
  });

  test("should handle very high k-factor", () => {
    const winner: Player = { id: "winner", rating: 1200 };
    const loser: Player = { id: "loser", rating: 1200 };
    const highKFactor = 1000;
    const expectedRatingGain = 500; // 1000 * 0.5 = 500

    const results = calculateDuel(winner, loser, { kFactor: highKFactor });
    const winnerResult = results.find((r) => r.id === "winner")!;

    expect(winnerResult.newRating - winner.rating).toBe(expectedRatingGain);
  });
});

describe("calculateFreeForAll", () => {
  test("should calculate free-for-all match correctly", () => {
    const firstPlacePlayer = { id: "player1", rating: 1280 };
    const secondPlacePlayer = { id: "player2", rating: 1300 };
    const thirdPlacePlayer = { id: "player3", rating: 1220 };

    const playersWithScores = [
      { player: firstPlacePlayer, score: 100 }, // 1st place
      { player: secondPlacePlayer, score: 75 }, // 2nd place
      { player: thirdPlacePlayer, score: 50 }, // 3rd place
    ];

    const expectedResultCount = 3;
    const results = calculateFreeForAll(playersWithScores);

    expect(results).toHaveLength(expectedResultCount);

    const firstPlaceResult = results.find((r) => r.id === firstPlacePlayer.id)!;
    const lastPlaceResult = results.find((r) => r.id === thirdPlacePlayer.id)!;

    expect(firstPlaceResult.newRating).toBeGreaterThan(firstPlacePlayer.rating); // Winner gains points
    expect(lastPlaceResult.newRating).toBeLessThan(thirdPlacePlayer.rating); // Last place loses points
  });

  test("should handle ties correctly", () => {
    const baseRating = 1200;
    const tiedPlayer1 = { id: "player1", rating: baseRating };
    const tiedPlayer2 = { id: "player2", rating: baseRating };
    const thirdPlacePlayer = { id: "player3", rating: baseRating };

    const playersWithScores = [
      { player: tiedPlayer1, score: 100 }, // Tied for 1st
      { player: tiedPlayer2, score: 100 }, // Tied for 1st
      { player: thirdPlacePlayer, score: 50 }, // 3rd place
    ];

    const expectedResultCount = 3;
    const results = calculateFreeForAll(playersWithScores);

    expect(results).toHaveLength(expectedResultCount);

    const tiedPlayer1Result = results.find((r) => r.id === tiedPlayer1.id)!;
    const tiedPlayer2Result = results.find((r) => r.id === tiedPlayer2.id)!;

    expect(tiedPlayer1Result.newRating).toBe(tiedPlayer2Result.newRating); // Tied players get same rating
  });

  test("should handle single player free-for-all", () => {
    const singlePlayer = { id: "solo", rating: 1200 };
    const playersWithScores = [{ player: singlePlayer, score: 100 }];
    const expectedResultCount = 1;

    const results = calculateFreeForAll(playersWithScores);

    expect(results).toHaveLength(expectedResultCount);
    expect(results[0].newRating).toBe(singlePlayer.rating); // No change with only one player
  });

  test("should handle players with identical scores and ratings", () => {
    const baseRating = 1300;
    const identicalScore = 75;
    const player1 = { id: "p1", rating: baseRating };
    const player2 = { id: "p2", rating: baseRating };
    const player3 = { id: "p3", rating: baseRating };

    const playersWithScores = [
      { player: player1, score: identicalScore },
      { player: player2, score: identicalScore },
      { player: player3, score: identicalScore },
    ];

    const expectedResultCount = 3;
    const results = calculateFreeForAll(playersWithScores);

    expect(results).toHaveLength(expectedResultCount);

    // All players should have the same rating change since everything is identical
    const allNewRatings = results.map((r) => r.newRating);
    expect(allNewRatings.every((rating) => rating === allNewRatings[0])).toBe(
      true,
    );
  });

  test("should handle extreme score differences", () => {
    const baseRating = 1200;
    const dominantPlayer = { id: "dominant", rating: baseRating };
    const averagePlayer = { id: "average", rating: baseRating };
    const poorPlayer = { id: "poor", rating: baseRating };

    const playersWithScores = [
      { player: dominantPlayer, score: 10000 }, // Extremely high score
      { player: averagePlayer, score: 100 }, // Normal score
      { player: poorPlayer, score: 1 }, // Very low score
    ];

    const results = calculateFreeForAll(playersWithScores);

    const dominantResult = results.find((r) => r.id === "dominant")!;
    const poorResult = results.find((r) => r.id === "poor")!;

    expect(dominantResult.newRating).toBeGreaterThan(dominantPlayer.rating);
    expect(poorResult.newRating).toBeLessThan(poorPlayer.rating);
  });
});

describe("calculateTeamMatch", () => {
  test("should calculate team match with two-team overload", () => {
    const winningTeam = {
      players: [
        { id: "p1", rating: 1100 },
        { id: "p2", rating: 1150 },
      ],
      score: 100,
    };

    const losingTeam = {
      players: [
        { id: "p3", rating: 1300 },
        { id: "p4", rating: 1000 },
      ],
      score: 50,
    };

    const expectedResultCount = 4;

    // Test the two-team case
    const results = calculateTeamMatch(winningTeam, losingTeam, {
      strategy: CalculationStrategy.AVERAGE_TEAMS,
    });

    expect(results).toHaveLength(expectedResultCount);

    // Winners should gain points, losers should lose points
    const winningPlayer1Result = results.find((r) => r.id === "p1")!;
    const losingPlayer1Result = results.find((r) => r.id === "p3")!;

    expect(winningPlayer1Result.newRating).toBeGreaterThan(
      winningTeam.players[0].rating,
    );
    expect(losingPlayer1Result.newRating).toBeLessThan(
      losingTeam.players[0].rating,
    );
  });

  test("should calculate team match with two-team overload without options", () => {
    const team1 = {
      players: [{ id: "p1", rating: 1200 }],
      score: 100,
    };

    const team2 = {
      players: [{ id: "p2", rating: 1200 }],
      score: 50,
    };

    // Test the two-team case without options (should use defaults)
    const results = calculateTeamMatch(team1, team2);

    expect(results).toHaveLength(2);

    const winnerResult = results.find((r) => r.id === "p1")!;
    const loserResult = results.find((r) => r.id === "p2")!;

    expect(winnerResult.newRating).toBeGreaterThan(team1.players[0].rating);
    expect(loserResult.newRating).toBeLessThan(team2.players[0].rating);
  });

  test("should calculate team match with AVERAGE_TEAMS strategy", () => {
    const winningTeam = {
      players: [
        { id: "p1", rating: 1100 },
        { id: "p2", rating: 1150 },
      ],
      score: 100,
    };

    const losingTeam = {
      players: [
        { id: "p3", rating: 1300 },
        { id: "p4", rating: 1000 },
      ],
      score: 50,
    };

    const teamsWithScores = [winningTeam, losingTeam];
    const expectedResultCount = 4;

    const results = calculateMultiTeamMatch(teamsWithScores, {
      strategy: CalculationStrategy.AVERAGE_TEAMS,
    });

    expect(results).toHaveLength(expectedResultCount);

    // Winners should gain points, losers should lose points
    const winningPlayer1Result = results.find((r) => r.id === "p1")!;
    const losingPlayer1Result = results.find((r) => r.id === "p3")!;

    expect(winningPlayer1Result.newRating).toBeGreaterThan(
      winningTeam.players[0].rating,
    );
    expect(losingPlayer1Result.newRating).toBeLessThan(
      losingTeam.players[0].rating,
    );
  });

  test("should calculate team match with WEIGHTED_TEAMS strategy", () => {
    const winningTeam = {
      players: [
        { id: "p1", rating: 700 },
        { id: "p2", rating: 1150 },
      ],
      score: 100,
    };

    const losingTeam = {
      players: [
        { id: "p3", rating: 1300 },
        { id: "p4", rating: 1000 },
      ],
      score: 50,
    };

    const teamsWithScores = [winningTeam, losingTeam];
    const expectedResultCount = 4;

    const results = calculateMultiTeamMatch(teamsWithScores, {
      strategy: CalculationStrategy.WEIGHTED_TEAMS,
    });

    expect(results).toHaveLength(expectedResultCount);

    const lowerRatedWinnerResult = results.find((r) => r.id === "p1")!;
    const higherRatedWinnerResult = results.find((r) => r.id === "p2")!;
    const lowerRatedWinnerGain =
      lowerRatedWinnerResult.newRating - winningTeam.players[0].rating;
    const higherRatedWinnerGain =
      higherRatedWinnerResult.newRating - winningTeam.players[1].rating;

    // Higher rated player in winning team should get more points
    expect(higherRatedWinnerGain).toBeGreaterThan(lowerRatedWinnerGain);
  });

  test("should handle single player teams", () => {
    const winningTeam = {
      players: [{ id: "p1", rating: 1200 }],
      score: 100,
    };

    const losingTeam = {
      players: [{ id: "p2", rating: 1200 }],
      score: 50,
    };

    const expectedResultCount = 2;

    const results = calculateTeamMatch(winningTeam, losingTeam);

    expect(results).toHaveLength(expectedResultCount);

    const winnerResult = results.find((r) => r.id === "p1")!;
    const loserResult = results.find((r) => r.id === "p2")!;

    expect(winnerResult.newRating).toBeGreaterThan(
      winningTeam.players[0].rating,
    );
    expect(loserResult.newRating).toBeLessThan(losingTeam.players[0].rating);
  });

  test("should throw error for empty teams", () => {
    const emptyTeam = {
      players: [],
      score: 100,
    };

    const validTeam = {
      players: [{ id: "p1", rating: 1200 }],
      score: 50,
    };

    const teamsWithScores = [emptyTeam, validTeam];
    const expectedErrorMessage = "Team cannot be empty";

    expect(() => calculateMultiTeamMatch(teamsWithScores)).toThrow(
      expectedErrorMessage,
    );
  });

  test("should handle duplicate player IDs gracefully", () => {
    const duplicateId = "duplicate";
    const team1 = {
      players: [
        { id: duplicateId, rating: 1200 },
        { id: "p2", rating: 1300 },
      ],
      score: 100,
    };
    const team2 = {
      players: [{ id: duplicateId, rating: 1400 }], // Same ID as in team1
      score: 50,
    };

    // The function should still work, but behavior with duplicate IDs is worth testing
    const results = calculateTeamMatch(team1, team2);

    // Should have results for all players, including duplicates
    expect(results.length).toBeGreaterThan(0);
  });

  test("should handle micro-adjustments in weighted teams", () => {
    // Test the specific micro-adjustment logic (±0.0001) for weights
    const equalRating = 1000;
    const team1 = {
      players: [
        { id: "p1", rating: equalRating }, // This will have exactly 0.5 weight before micro-adjustment
        { id: "p2", rating: equalRating },
      ],
      score: 100,
    };

    const team2 = {
      players: [{ id: "p3", rating: equalRating }],
      score: 50,
    };

    const results = calculateTeamMatch(team1, team2, {
      strategy: CalculationStrategy.WEIGHTED_TEAMS,
    });

    // Verify that the calculation completes without issues and maintains conservation
    const initialTotal = team1.players
      .concat(team2.players)
      .reduce((sum, player) => sum + player.rating, 0);

    const finalTotal = results.reduce(
      (sum, result) => sum + result.newRating,
      0,
    );
    const allowedRoundingError = 10; // Increase tolerance for this specific test

    expect(Math.abs(finalTotal - initialTotal)).toBeLessThanOrEqual(
      allowedRoundingError,
    );
    expect(results).toHaveLength(3); // Ensure all players have results
  });

  test("should handle teams with vastly different total ratings in weighted strategy", () => {
    const powerhouse = {
      players: [
        { id: "star", rating: 2000 },
        { id: "pro", rating: 1800 },
      ],
      score: 75, // Lower score - they lose despite being higher rated
    };

    const underdogs = {
      players: [
        { id: "rookie1", rating: 800 },
        { id: "rookie2", rating: 600 },
      ],
      score: 100, // Higher score - upset victory
    };

    const results = calculateTeamMatch(powerhouse, underdogs, {
      strategy: CalculationStrategy.WEIGHTED_TEAMS,
    });

    const starResult = results.find((r) => r.id === "star")!;
    const rookie1Result = results.find((r) => r.id === "rookie1")!;

    // Verify upset result: underdogs win, so they gain points, powerhouse loses points
    const starGain = starResult.newRating - powerhouse.players[0].rating;
    const rookieGain = rookie1Result.newRating - underdogs.players[0].rating;

    // The underdog team should win (rookie gains points, star loses points)
    expect(rookieGain).toBeGreaterThan(0);
    expect(starGain).toBeLessThan(0);

    // Rookies should gain more points due to the upset nature of the victory
    expect(Math.abs(rookieGain)).toBeGreaterThan(Math.abs(starGain));
  });

  test("should conserve total rating points in team matches", () => {
    const team1 = {
      players: [
        { id: "p1", rating: 1200 },
        { id: "p2", rating: 1000 },
      ],
      score: 100,
    };
    const team2 = {
      players: [
        { id: "p3", rating: 1400 },
        { id: "p4", rating: 800 },
      ],
      score: 50,
    };

    const initialTotal = team1.players
      .concat(team2.players)
      .reduce((sum, player) => sum + player.rating, 0);

    const results = calculateTeamMatch(team1, team2, {
      strategy: CalculationStrategy.AVERAGE_TEAMS,
    });

    const finalTotal = results.reduce(
      (sum, result) => sum + result.newRating,
      0,
    );

    const allowedRoundingError = 1;
    expect(Math.abs(finalTotal - initialTotal)).toBeLessThanOrEqual(
      allowedRoundingError,
    );
  });

  test("should conserve rating points in weighted team matches", () => {
    const teamsWithScores = [
      {
        players: [
          { id: "p1", rating: 800 },
          { id: "p2", rating: 1200 },
        ],
        score: 100,
      },
      {
        players: [
          { id: "p3", rating: 1100 },
          { id: "p4", rating: 900 },
        ],
        score: 50,
      },
    ];

    const initialTotal = teamsWithScores
      .flatMap((team) => team.players)
      .reduce((sum, player) => sum + player.rating, 0);

    const results = calculateMultiTeamMatch(teamsWithScores, {
      strategy: CalculationStrategy.WEIGHTED_TEAMS,
    });

    const finalTotal = results.reduce(
      (sum, result) => sum + result.newRating,
      0,
    );

    const allowedRoundingError = 2;
    expect(Math.abs(finalTotal - initialTotal)).toBeLessThanOrEqual(
      allowedRoundingError,
    );
  });

  test("should not inflate/deflate ELO points using WEIGHTED_TEAMS", () => {
    const iterationCount = 100;
    const allowedRoundingError = 2;

    for (let i = 0; i < iterationCount; i++) {
      const teamsWithScores = [
        {
          players: [
            { id: "p1", rating: Math.random() * 1000 },
            { id: "p2", rating: Math.random() * 1000 },
          ],
          score: 100,
        },
        {
          players: [
            { id: "p3", rating: Math.random() * 1000 },
            { id: "p4", rating: Math.random() * 1000 },
          ],
          score: 50,
        },
      ];

      const initialTotal = teamsWithScores
        .flatMap((team) => team.players)
        .reduce((sum, player) => sum + player.rating, 0);

      const results = calculateMultiTeamMatch(teamsWithScores, {
        strategy: CalculationStrategy.WEIGHTED_TEAMS,
      });

      const finalTotal = results.reduce(
        (sum, result) => sum + result.newRating,
        0,
      );

      expect(Math.abs(finalTotal - initialTotal)).toBeLessThanOrEqual(
        allowedRoundingError,
      );
    }
  });

  test("should not inflate/deflate ELO points using AVERAGE_TEAMS", () => {
    const iterationCount = 100;
    const allowedRoundingError = 1;

    for (let i = 0; i < iterationCount; i++) {
      const teamsWithScores = [
        {
          players: [
            { id: "p1", rating: Math.random() * 1000 },
            { id: "p2", rating: Math.random() * 1000 },
          ],
          score: 100,
        },
        {
          players: [
            { id: "p3", rating: Math.random() * 1000 },
            { id: "p4", rating: Math.random() * 1000 },
          ],
          score: 50,
        },
      ];

      const initialTotal = teamsWithScores
        .flatMap((team) => team.players)
        .reduce((sum, player) => sum + player.rating, 0);

      const results = calculateMultiTeamMatch(teamsWithScores, {
        strategy: CalculationStrategy.AVERAGE_TEAMS,
      });

      const finalTotal = results.reduce(
        (sum, result) => sum + result.newRating,
        0,
      );

      expect(Math.abs(finalTotal - initialTotal)).toBeLessThanOrEqual(
        allowedRoundingError,
      );
    }
  });
});

describe("calculateMultiTeamMatch", () => {
  test("should handle 3+ teams correctly", () => {
    const baseRating = 1200;
    const team1 = { players: [{ id: "p1", rating: baseRating }], score: 100 };
    const team2 = { players: [{ id: "p2", rating: baseRating }], score: 75 };
    const team3 = { players: [{ id: "p3", rating: baseRating }], score: 50 };
    const teamsWithScores = [team1, team2, team3];
    const expectedResultCount = 3;

    const results = calculateMultiTeamMatch(teamsWithScores);

    expect(results).toHaveLength(expectedResultCount);

    const firstPlaceResult = results.find((r) => r.id === "p1")!;
    const lastPlaceResult = results.find((r) => r.id === "p3")!;

    expect(firstPlaceResult.newRating).toBeGreaterThan(team1.players[0].rating);
    expect(lastPlaceResult.newRating).toBeLessThan(team3.players[0].rating);
  });

  test("should handle AVERAGE_TEAMS strategy in multi-team match", () => {
    const winningTeam = {
      players: [
        { id: "p1", rating: 1100 },
        { id: "p2", rating: 1150 },
      ],
      score: 100,
    };

    const losingTeam = {
      players: [
        { id: "p3", rating: 1300 },
        { id: "p4", rating: 1000 },
      ],
      score: 50,
    };

    const teamsWithScores = [winningTeam, losingTeam];
    const expectedResultCount = 4;

    const results = calculateMultiTeamMatch(teamsWithScores, {
      strategy: CalculationStrategy.AVERAGE_TEAMS,
    });

    expect(results).toHaveLength(expectedResultCount);

    // Winners should gain points, losers should lose points
    const winningPlayer1Result = results.find((r) => r.id === "p1")!;
    const losingPlayer1Result = results.find((r) => r.id === "p3")!;

    expect(winningPlayer1Result.newRating).toBeGreaterThan(
      winningTeam.players[0].rating,
    );
    expect(losingPlayer1Result.newRating).toBeLessThan(
      losingTeam.players[0].rating,
    );
  });

  test("should handle WEIGHTED_TEAMS strategy in multi-team match", () => {
    const winningTeam = {
      players: [
        { id: "p1", rating: 700 },
        { id: "p2", rating: 1150 },
      ],
      score: 100,
    };

    const losingTeam = {
      players: [
        { id: "p3", rating: 1300 },
        { id: "p4", rating: 1000 },
      ],
      score: 50,
    };

    const teamsWithScores = [winningTeam, losingTeam];
    const expectedResultCount = 4;

    const results = calculateMultiTeamMatch(teamsWithScores, {
      strategy: CalculationStrategy.WEIGHTED_TEAMS,
    });

    expect(results).toHaveLength(expectedResultCount);

    const lowerRatedWinnerResult = results.find((r) => r.id === "p1")!;
    const higherRatedWinnerResult = results.find((r) => r.id === "p2")!;
    const lowerRatedWinnerGain =
      lowerRatedWinnerResult.newRating - winningTeam.players[0].rating;
    const higherRatedWinnerGain =
      higherRatedWinnerResult.newRating - winningTeam.players[1].rating;

    // Higher rated player in winning team should get more points
    expect(higherRatedWinnerGain).toBeGreaterThan(lowerRatedWinnerGain);
  });

  test("should throw error for empty teams in multi-team match", () => {
    const emptyTeam = {
      players: [],
      score: 100,
    };

    const validTeam = {
      players: [{ id: "p1", rating: 1200 }],
      score: 50,
    };

    const teamsWithScores = [emptyTeam, validTeam];
    const expectedErrorMessage = "Team cannot be empty";

    expect(() => calculateMultiTeamMatch(teamsWithScores)).toThrow(
      expectedErrorMessage,
    );
  });

  test("should handle all teams tied in multi-team match", () => {
    const baseRating = 1200;
    const tiedScore = 50;
    const team1 = {
      players: [{ id: "p1", rating: baseRating }],
      score: tiedScore,
    };
    const team2 = {
      players: [{ id: "p2", rating: baseRating }],
      score: tiedScore,
    };
    const team3 = {
      players: [{ id: "p3", rating: baseRating }],
      score: tiedScore,
    };
    const teamsWithScores = [team1, team2, team3];
    const expectedResultCount = 3;

    const results = calculateMultiTeamMatch(teamsWithScores);

    expect(results).toHaveLength(expectedResultCount);

    // All players should have the same rating since all teams tied
    const allResults = results.map((r) => r.newRating);
    const firstPlayerNewRating = allResults[0];

    expect(allResults.every((rating) => rating === firstPlayerNewRating)).toBe(
      true,
    );
  });

  test("should conserve total rating points in multi-team matches", () => {
    const teamsWithScores = [
      {
        players: [
          { id: "p1", rating: 1200 },
          { id: "p2", rating: 1000 },
        ],
        score: 100,
      },
      {
        players: [
          { id: "p3", rating: 1400 },
          { id: "p4", rating: 800 },
        ],
        score: 50,
      },
    ];

    const initialTotal = teamsWithScores
      .flatMap((team) => team.players)
      .reduce((sum, player) => sum + player.rating, 0);

    const results = calculateMultiTeamMatch(teamsWithScores, {
      strategy: CalculationStrategy.AVERAGE_TEAMS,
    });

    const finalTotal = results.reduce(
      (sum, result) => sum + result.newRating,
      0,
    );

    const allowedRoundingError = 1;
    expect(Math.abs(finalTotal - initialTotal)).toBeLessThanOrEqual(
      allowedRoundingError,
    );
  });

  test("should conserve rating points in weighted multi-team matches", () => {
    const teamsWithScores = [
      {
        players: [
          { id: "p1", rating: 800 },
          { id: "p2", rating: 1200 },
        ],
        score: 100,
      },
      {
        players: [
          { id: "p3", rating: 1100 },
          { id: "p4", rating: 900 },
        ],
        score: 50,
      },
    ];

    const initialTotal = teamsWithScores
      .flatMap((team) => team.players)
      .reduce((sum, player) => sum + player.rating, 0);

    const results = calculateMultiTeamMatch(teamsWithScores, {
      strategy: CalculationStrategy.WEIGHTED_TEAMS,
    });

    const finalTotal = results.reduce(
      (sum, result) => sum + result.newRating,
      0,
    );

    const allowedRoundingError = 2;
    expect(Math.abs(finalTotal - initialTotal)).toBeLessThanOrEqual(
      allowedRoundingError,
    );
  });
});
