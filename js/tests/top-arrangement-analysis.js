function topArrangementAnalysis(testCaseIds = [1, 2, 3, 4, 5, 6]) {
    console.log(`🎯 Running exhaustive analysis with test cases: ${testCaseIds.join(', ')}`);

    // Step 1: Get top-20 arrangements for each test case
    const playerData = [];
    for (let i = 0; i < testCaseIds.length; i++) {
        const testCaseId = testCaseIds[i];
        const cards = createFromCardsTestCase(testCaseId);
        const optimizer = new FindBestSetupNoWild();
        const result = optimizer.findBestSetupNoWild(cards);

        // PUT THE DEBUG HERE:
        console.log(`🔍 Player ${i + 1} IMMEDIATE result:`, result);
        console.log(`  result.topArrangements exists:`, !!result.topArrangements);
        console.log(`  result.topArrangements length:`, result.topArrangements ? result.topArrangements.length : 'N/A');
        console.log(`  result keys:`, Object.keys(result));

        playerData.push({
            playerId: i + 1,
            testCaseId: testCaseId,
            arrangements: result.topArrangements.slice(0, 20),
            bestArrangement: result.topArrangements[0]
        });

        console.log(`✅ Player ${i + 1} (Case ${testCaseId}): ${result.topArrangements.length} arrangements`);
    }

    // Step 2: Run tournament for each player testing all their arrangements
    const tournamentResults = [];

    for (let playerIndex = 0; playerIndex < playerData.length; playerIndex++) {
        console.log(`\n🏆 Testing Player ${playerIndex + 1} arrangements...`);

        const playerResults = testPlayerArrangements(playerData, playerIndex);
        tournamentResults.push(playerResults);
    }

    // Step 3: Generate summary
    const summary = generateSummary(tournamentResults);

    return {
        playerData,
        tournamentResults,
        summary
    };
}

/**
 * Run single 6-player game
 * @param {Array} playerData - All player data
 * @param {number} testPlayerIndex - Player testing arrangements
 * @param {number} arrangementIndex - Which arrangement (0-19) to test
 * @returns {Object} - Game result
 */
function runSixPlayerGame(playerData, testPlayerIndex, arrangementIndex) {
    const gameSetup = [];

    for (let i = 0; i < playerData.length; i++) {
        if (i === testPlayerIndex) {
            gameSetup.push({
                playerId: i + 1,
                playerName: `Player${i + 1}`,
                arrangement: playerData[i].arrangements[arrangementIndex].arrangement,  // Direct access
                theoreticalRank: arrangementIndex + 1
            });
        } else {
            gameSetup.push({
                playerId: i + 1,
                playerName: `Player${i + 1}`,
                arrangement: playerData[i].bestArrangement.arrangement,  // Direct access
                theoreticalRank: 1
            });
        }
    }

    // Run head-to-head comparisons between all players
    const detailedResults = [];
    const playerScores = new Map();

    // Initialize scores
    gameSetup.forEach(player => {
        playerScores.set(player.playerName, 0);
    });

    // Round-robin comparisons
    for (let i = 0; i < gameSetup.length; i++) {
        for (let j = i + 1; j < gameSetup.length; j++) {
            const player1 = gameSetup[i];
            const player2 = gameSetup[j];

            const result = compareArrangementsHeadToHead(player1.arrangement, player2.arrangement);

            // Update scores
            playerScores.set(player1.playerName, playerScores.get(player1.playerName) + result.player1Score);
            playerScores.set(player2.playerName, playerScores.get(player2.playerName) + result.player2Score);

            detailedResults.push({
                player1: player1.playerName,
                player2: player2.playerName,
                player1Score: result.player1Score,
                player2Score: result.player2Score,
                details: result.details
            });
        }
    }

    // Find game winner
    let winner = null;
    let highestScore = -Infinity;
    playerScores.forEach((score, playerName) => {
        if (score > highestScore) {
            highestScore = score;
            winner = playerName;
        }
    });

    // Get test player's performance
    const testPlayerName = gameSetup[testPlayerIndex].playerName;
    const testPlayerScore = playerScores.get(testPlayerName);
    const testPlayerWon = winner === testPlayerName;

    return {
        testPlayerIndex,
        arrangementIndex: arrangementIndex + 1, // 1-based ranking
        testPlayerName,
        testPlayerScore,
        testPlayerWon,
        winner,
        highestScore,
        allScores: Object.fromEntries(playerScores),
        detailedResults
    };
}

/**
 * Test all 20 arrangements for a specific player
 * @param {Array} playerData - All player data
 * @param {number} testPlayerIndex - Index of player to test arrangements for
 * @returns {Object} - Results for this player's arrangements
 */

/**
 * Test all 20 arrangements for a specific player (SIMPLIFIED)
 */
function testPlayerArrangements(playerData, testPlayerIndex) {
    const testPlayer = playerData[testPlayerIndex];
    const arrangementResults = [];

    console.log(`  Testing arrangements 1-20 for Player ${testPlayer.playerId}...`);

    // Test each of the 20 arrangements (now already completed!)
    for (let arrangementIndex = 0; arrangementIndex < testPlayer.arrangements.length; arrangementIndex++) {
        const gameResult = runSixPlayerGame(playerData, testPlayerIndex, arrangementIndex);
        arrangementResults.push(gameResult);

        if ((arrangementIndex + 1) % 5 === 0) {
            console.log(`    Completed ${arrangementIndex + 1}/20 arrangements`);
        }
    }

    const wins = arrangementResults.filter(r => r.testPlayerWon).length;
    const avgScore = arrangementResults.reduce((sum, r) => sum + r.testPlayerScore, 0) / arrangementResults.length;
    const bestPerformingArrangement = arrangementResults.reduce((best, current) =>
        current.testPlayerScore > best.testPlayerScore ? current : best
    );

    console.log(`    Player ${testPlayer.playerId} summary: ${wins}/20 wins, avg score: ${avgScore.toFixed(2)}`);
    console.log(`    Best performer: Arrangement #${bestPerformingArrangement.arrangementIndex} (score: ${bestPerformingArrangement.testPlayerScore})`);

    return {
        playerId: testPlayer.playerId,
        testCaseId: testPlayer.testCaseId,
        arrangementResults,
        summary: {
            totalWins: wins,
            averageScore: avgScore,
            bestPerformingArrangement: bestPerformingArrangement.arrangementIndex,
            bestPerformingScore: bestPerformingArrangement.testPlayerScore
        }
    };
}

/**
 * Run single 6-player game (SIMPLIFIED)
 */
 
function runSixPlayerGame(playerData, testPlayerIndex, arrangementIndex) {
    // Build 6-player game setup
    const gameSetup = [];

    for (let i = 0; i < playerData.length; i++) {
        if (i === testPlayerIndex) {
            gameSetup.push({
                playerId: i + 1,
                playerName: `Player${i + 1}`,
                arrangement: playerData[i].arrangements[arrangementIndex].arrangement,
                theoreticalRank: arrangementIndex + 1
            });
        } else {
            gameSetup.push({
                playerId: i + 1,
                playerName: `Player${i + 1}`,
                arrangement: playerData[i].bestArrangement.arrangement,  // ADD .arrangement here too!
                theoreticalRank: 1
            });
        }
    }

    // MISSING: Actually run the game!
    const detailedResults = [];
    const playerScores = new Map();

    // Initialize scores
    gameSetup.forEach(player => {
        playerScores.set(player.playerName, 0);
    });

    // Round-robin comparisons (15 matchups)
    for (let i = 0; i < gameSetup.length; i++) {
        for (let j = i + 1; j < gameSetup.length; j++) {
            const player1 = gameSetup[i];
            const player2 = gameSetup[j];

            const result = compareArrangementsHeadToHead(player1.arrangement, player2.arrangement);

            // Update scores
            playerScores.set(player1.playerName, playerScores.get(player1.playerName) + result.player1Score);
            playerScores.set(player2.playerName, playerScores.get(player2.playerName) + result.player2Score);

            detailedResults.push({
                player1: player1.playerName,
                player2: player2.playerName,
                player1Score: result.player1Score,
                player2Score: result.player2Score,
                details: result.details
            });
        }
    }

    // Find winner
    let winner = null;
    let highestScore = -Infinity;
    playerScores.forEach((score, playerName) => {
        if (score > highestScore) {
            highestScore = score;
            winner = playerName;
        }
    });

    // Get test player results
    const testPlayerName = gameSetup[testPlayerIndex].playerName;
    const testPlayerScore = playerScores.get(testPlayerName);
    const testPlayerWon = winner === testPlayerName;

    return {
        testPlayerIndex,
        arrangementIndex: arrangementIndex + 1,
        testPlayerScore,
        testPlayerWon,
        winner,
        highestScore,
        allScores: Object.fromEntries(playerScores),
        detailedResults
    };
}

/**
 * Generate overall summary of tournament results
 * @param {Array} tournamentResults - Results from all players
 * @returns {Object} - Summary analysis
 */
function generateSummary(tournamentResults) {
    console.log(`\n🏆 ======== TOURNAMENT SUMMARY ========`);

    tournamentResults.forEach(playerResult => {
        const summary = playerResult.summary;
        console.log(`Player ${playerResult.playerId} (Case ${playerResult.testCaseId}):`);
        console.log(`  Wins: ${summary.totalWins}/20`);
        console.log(`  Avg Score: ${summary.averageScore.toFixed(2)}`);
        console.log(`  Best Arrangement: #${summary.bestPerformingArrangement} (${summary.bestPerformingScore} pts)`);

        // Check if best theoretical arrangement (#1) actually performed best
        const arrangement1Result = playerResult.arrangementResults[0]; // First arrangement (theoretical best)
        const arrangement1Score = arrangement1Result.testPlayerScore;
        const arrangement1Won = arrangement1Result.testPlayerWon;

        if (summary.bestPerformingArrangement === 1) {
            console.log(`  ✅ Theoretical best (#1) was also empirical best`);
        } else {
            console.log(`  ⚠️  Theoretical best (#1) scored ${arrangement1Score}, but #${summary.bestPerformingArrangement} scored ${summary.bestPerformingScore}`);
        }
    });

    return {
        totalPlayers: tournamentResults.length,
        totalGames: tournamentResults.length * 20,
        // Add more summary statistics as needed
    };
}


/**
 * Compare two arrangements head-to-head (extracted from game.js)
 * @param {Object} arrangement1 - First player's arrangement
 * @param {Object} arrangement2 - Second player's arrangement
 * @returns {Object} - Comparison result with scores and details
 */
function compareArrangementsHeadToHead(arrangement1, arrangement2) {
    let player1Score = 0;
    let player2Score = 0;
    const details = [];

    // Back hand comparison
    const back1 = evaluateHand(arrangement1.back.cards);
    const back2 = evaluateHand(arrangement2.back.cards);
    const backComparison = compareTuples(back1.hand_rank, back2.hand_rank);
    let backResult = 'tie';

    if (backComparison > 0) {
        const points = ScoringUtilities.getPointsForHand(arrangement1.back, 'back', arrangement1.back.cards.length);
        player1Score += points;
        player2Score -= points;
        backResult = 'player1';
    } else if (backComparison < 0) {
        const points = ScoringUtilities.getPointsForHand(arrangement2.back, 'back', arrangement2.back.cards.length);
        player2Score += points;
        player1Score -= points;
        backResult = 'player2';
    }

    details.push({
        hand: 'Back',
        player1Hand: back1,
        player2Hand: back2,
        winner: backResult
    });

    // Middle hand comparison
    const middle1 = evaluateHand(arrangement1.middle.cards);
    const middle2 = evaluateHand(arrangement2.middle.cards);
    const middleComparison = compareTuples(middle1.hand_rank, middle2.hand_rank);
    let middleResult = 'tie';

    if (middleComparison > 0) {
        const points = ScoringUtilities.getPointsForHand(arrangement1.middle, 'middle', arrangement1.middle.cards.length);
        player1Score += points;
        player2Score -= points;
        middleResult = 'player1';
    } else if (middleComparison < 0) {
        const points = ScoringUtilities.getPointsForHand(arrangement2.middle, 'middle', arrangement2.middle.cards.length);
        player2Score += points;
        player1Score -= points;
        middleResult = 'player2';
    }

    details.push({
        hand: 'Middle',
        player1Hand: middle1,
        player2Hand: middle2,
        winner: middleResult
    });

    // Front hand comparison
    const front1 = evaluateThreeCardHand(arrangement1.front.cards);
    const front2 = evaluateThreeCardHand(arrangement2.front.cards);
    const frontComparison = compareTuples(front1.hand_rank, front2.hand_rank);
    let frontResult = 'tie';

    if (frontComparison > 0) {
        const points = ScoringUtilities.getPointsForHand(arrangement1.front, 'front', arrangement1.front.cards.length);
        player1Score += points;
        player2Score -= points;
        frontResult = 'player1';
    } else if (frontComparison < 0) {
        const points = ScoringUtilities.getPointsForHand(arrangement2.front, 'front', arrangement2.front.cards.length);
        player2Score += points;
        player1Score -= points;
        frontResult = 'player2';
    }

    details.push({
        hand: 'Front',
        player1Hand: front1,
        player2Hand: front2,
        winner: frontResult
    });

    return { player1Score, player2Score, details };
}