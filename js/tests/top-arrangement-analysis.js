// top-arrangement-analysis.js

function topArrangementAnalysis(testCaseIds = [1, 2, 3, 4, 5, 6]) {
    console.log(`🎯 Running exhaustive analysis with test cases: ${testCaseIds.join(', ')}`);

    // Step 1: Get top-20 arrangements for each test case
    const playerData = [];
    for (let i = 0; i < testCaseIds.length; i++) {
        const testCaseId = testCaseIds[i];
        const cards = createFromCardsTestCase(testCaseId);
        const findBest = new FindBestSetupNoWild();
        const result = findBest.findBestSetupNoWild(cards);

        const uniqueArrangements = findBest.getStrategicallyDifferentArrangements(findBest.topArrangements);
        findBest.topArrangements = uniqueArrangements.slice(0, 20); // Keep top 20 unique

        // PUT THE DEBUG HERE:
        console.log(`----------------------------------------------`)
        console.log(`🔍 Player ${i + 1} IMMEDIATE result:`, result);
        console.log(`✅ Player ${i + 1} (Case ${testCaseId}): ${findBest.topArrangements.length} arrangements`);
        console.log(`\n📋 TOP 20 UNIQUE ARRANGEMENTS FOR TEST CASE ${testCaseId}:`);
        findBest.topArrangements.forEach((item, index) => {
            console.log(`\n🏆 Rank #${index + 1} - Score: ${item.score}`);
            console.log(`   🏆 Back:   ${item.arrangement.back.handType} - [${item.arrangement.back.cards.map(c => c.rank + c.suit).join(' ')}]`);
            const scoresBack = item.arrangement.back.positionScores;
            console.log(`   🏆 Back:   ${item.arrangement.back.hand_rank} - scores back:${scoresBack.back}`);
            console.log(`   🥈 Middle: ${item.arrangement.middle.handType} - [${item.arrangement.middle.cards.map(c => c.rank + c.suit).join(' ')}]`);
            const scoresMiddle = item.arrangement.middle.positionScores;
            console.log(`   🏆 Middle:   ${item.arrangement.middle.hand_rank} - scores middle: ${scoresMiddle.middle}`);
            console.log(`   🥉 Front:  ${item.arrangement.front.handType} - [${item.arrangement.front.cards.map(c => c.rank + c.suit).join(' ')}]`);
            const scoresFront = item.arrangement.front.positionScores;
            console.log(`   🏆 Front:   ${item.arrangement.front.hand_rank} - scores front:${scoresFront.front}`);
        });
//        console.log(`\n🎯 Starting tournament with these ${findBest.topArrangements.length} arrangements...\n`);

        playerData.push({
            playerId: i + 1,
            testCaseId: testCaseId,
            arrangements: findBest.topArrangements.slice(0, 20),
            bestArrangement: findBest.topArrangements[0]
        });

    }

    // Step 2: Run tournament for each player testing all their arrangements
    const tournamentResults = [];
    // Initialize at the start of your tournament analysis
    const allPlayerResults = [];

    for (let playerIndex = 0; playerIndex < playerData.length; playerIndex++) {
        const playerResults = testPlayerArrangements(playerData, playerIndex);
        tournamentResults.push(playerResults);
        addPlayerToSummary(playerIndex + 1, playerData, allPlayerResults )
    }

    // Step 3: Generate summary
    const summary = generateSummary(tournamentResults);
//    const tournamentSummary = generateTournamentSummary(allPlayerResults)
    return {
        playerData,
        tournamentResults,
        summary
    };
}

/**
 * Test all 20 arrangements for a specific player
 * @param {Array} playerData - All player data
 * @param {number} testPlayerIndex - Index of player to test arrangements for
 * @returns {Object} - Results for this player's arrangements
 */
function testPlayerArrangements(playerData, testPlayerIndex) {
    const testPlayer = playerData[testPlayerIndex];
    const arrangementResults = [];

    // ADD STEP 2 HERE - section header
    console.log(`\n🎯 ===== TESTING PLAYER ${testPlayer.playerId} =====`);

    // Test each of the 20 arrangements
    for (let arrangementIndex = 0; arrangementIndex < testPlayer.arrangements.length; arrangementIndex++) {

        const gameResult = scoreRoundOfHands(playerData, testPlayerIndex, arrangementIndex);
        arrangementResults.push(gameResult);

        // Progress every 5 (keep your existing progress logging)
        if ((arrangementIndex + 1) % 5 === 0) {
            console.log(`    Completed ${arrangementIndex + 1}/20 arrangements`);
        }
    }

    const wins = arrangementResults.filter(r => r.testPlayerWon).length;
    const avgScore = arrangementResults.reduce((sum, r) => sum + r.testPlayerScore, 0) / arrangementResults.length;
    const avgDelta = arrangementResults.reduce((sum, r) => sum + r.delta, 0) / arrangementResults.length;

    // ADD THE MISSING bestPerformingArrangement calculation
    const bestPerformingArrangementTemp = arrangementResults.reduce((best, current) =>
        current.testPlayerScore > best.testPlayerScore ? current : best
    );

    const bestPerformingArrangement = bestPerformingArrangementTemp;
    bestPerformingArrangement.testPlayerScore = bestPerformingArrangementTemp.testPlayerScore/5

    // REMOVE DUPLICATE - Keep only the enhanced summary
    console.log(`\n✅ Player ${testPlayer.playerId} complete - ${wins}/20 wins, avg score: ${avgScore.toFixed(2)}, avg delta: ${avgDelta.toFixed(2)}`);
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
 * Run single 6-player game
 * @param {Array} playerData - All player data
 * @param {number} testPlayerIndex - Player testing arrangements
 * @param {number} arrangementIndex - Which arrangement (0-19) to test
 * @returns {Object} - Game result
 */
function scoreRoundOfHands(playerData, testPlayerIndex, arrangementIndex) {
    const gameSetup = [];

    // In scoreRoundOfHands, log the arrangement details:
//    console.log(`🔍 Debug - Player ${testPlayerIndex + 1}, Arrangement #${arrangementIndex + 1}:`);
//    console.log(`   EV: ${playerData[testPlayerIndex].arrangements[arrangementIndex].arrangement.score}`);
//    console.log(`   Back: ${playerData[testPlayerIndex].arrangements[arrangementIndex].arrangement.hand.back}`);
//    console.log(`   Middle: ${playerData[testPlayerIndex].arrangements[arrangementIndex].arrangement.hand.middle}`);
//    console.log(`   Front: ${playerData[testPlayerIndex].arrangements[arrangementIndex].arrangement.hand.front}`);

    // Debug the full arrangement structure:
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
            const arr1 = player1.arrangement;
            const arr2 = player2.arrangement;

            const result = compareArrangementsHeadToHead(
                arr1,
                arr2,
                arr1.score,
                arr2.score,
                `Player ${i+1} Arrangement #${player1.theoreticalRank}`,
                `Player ${j+1} Arrangement #${player2.theoreticalRank}`
            );

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

    // At the end of scoreRoundOfHands function, before return:
    const testPlayer = gameSetup[testPlayerIndex];
    const expectedValue = testPlayer.arrangement.score;
    const actualScore = testPlayerScore/5;  //need to divide by number of players
    const delta = actualScore - expectedValue;

    // Clear performance logging
    console.log(`Player ${testPlayerIndex + 1}, Arrangement #${arrangementIndex + 1} - EV: ${expectedValue.toFixed(2)}; Actual: ${actualScore.toFixed(1)}; Delta: ${delta > 0 ? '+' : ''}${delta.toFixed(1)} ${testPlayerWon ? '🏆' : ''}`);

    return {
        testPlayerIndex,
        arrangementIndex: arrangementIndex + 1,
        testPlayerName,
        testPlayerScore,
        testPlayerWon,
        expectedValue,
        actualScore,
        delta,
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
function compareArrangementsHeadToHead(arrangement1, arrangement2, score1, score2, rank1, rank2) {

   // LOG ARRANGEMENT 1
//    console.log(`\n👤 ${rank1 || '?'} (Score: ${score1})`);
//    console.log(`   🏆 Back:   ${arrangement1.back.handType} - [${arrangement1.back.cards.map(c => c.rank + c.suit).join(' ')}]`);
//    console.log(`   🥈 Middle: ${arrangement1.middle.handType} - [${arrangement1.middle.cards.map(c => c.rank + c.suit).join(' ')}]`);
//    console.log(`   🥉 Front:  ${arrangement1.front.handType} - [${arrangement1.front.cards.map(c => c.rank + c.suit).join(' ')}]`);
//
//    // LOG ARRANGEMENT 2
//    console.log(`\n👤 ${rank2 || '?'} (Score: ${score2})`);
//    console.log(`   🏆 Back:   ${arrangement2.back.handType} - [${arrangement2.back.cards.map(c => c.rank + c.suit).join(' ')}]`);
//    console.log(`   🥈 Middle: ${arrangement2.middle.handType} - [${arrangement2.middle.cards.map(c => c.rank + c.suit).join(' ')}]`);
//    console.log(`   🥉 Front:  ${arrangement2.front.handType} - [${arrangement2.front.cards.map(c => c.rank + c.suit).join(' ')}]`);

    let player1Score = 0;
    let player2Score = 0;
    const details = [];

    // Back hand comparison
    const back1 = evaluateHand(arrangement1.back.cards);
    const back2 = evaluateHand(arrangement2.back.cards);

//    debugHandCorruption(back1, "After initial evaluation back1");
//    debugHandCorruption(back2, "After initial evaluation back2");

    // SET the hand names from evaluation results
    arrangement1.back.name = back1.name;
    arrangement2.back.name = back2.name;

    const backComparison = compareTuples(back1.hand_rank, back2.hand_rank);
    let backResult = 'tie';

    if (backComparison > 0) {
        // Now arrangement1.back.name has the correct hand name
        const points = ScoringUtilities.getPointsForHand(arrangement1.back, 'back', arrangement1.back.cards.length);
        player1Score += points;
        player2Score -= points;
        backResult = 'player1';
    } else if (backComparison < 0) {
        // Now arrangement2.back.name has the correct hand name
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
//    debugHandCorruption(middle1, "After initial evaluation middle1");
    const middle2 = evaluateHand(arrangement2.middle.cards);
//    debugHandCorruption(middle2, "After initial evaluation middle2");
    arrangement1.middle.name = middle1.name;
    arrangement2.middle.name = middle2.name;

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

//    debugHandCorruption(front1, "After initial evaluation front1");

    const front2 = evaluateThreeCardHand(arrangement2.front.cards);

//    debugHandCorruption(front2, "After initial evaluation front2");

    arrangement1.front.name = front1.name;
    arrangement2.front.name = front2.name;

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

//    console.log(` Net Scores: ${player1Score}    vs.   ${player2Score}`)
    return { player1Score, player2Score, details };
}

function generateTournamentSummary(playerResults) {
    console.log('\n🏆 ======== TOURNAMENT RESULTS SUMMARY ========\n');

    // Sort players by net points (descending)
    const sortedPlayers = [...playerResults].sort((a, b) => b.avgScore - a.avgScore);

    // Create the table header
    console.log('┌─────────┬──────────────────────────────────┬──────┬───────────┬─────────┬──────────────────┐');
    console.log('│ Rank    │ Hand Structure                   │  EV  │ Net Points│  Delta  │ Performance Tier │');
    console.log('├─────────┼──────────────────────────────────┼──────┼───────────┼─────────┼──────────────────┤');

    // Generate rows for each player
    sortedPlayers.forEach((player, index) => {
        const rank = getRankEmoji(index + 1);
        const tier = getPerformanceTier(player.topArrangementEV, player.avgScore);
        const handStructure = formatHandStructure(player.topArrangement);

        console.log(`│ ${rank.padEnd(7)} │ ${handStructure.padEnd(32)} │ ${player.topArrangementEV.toFixed(2).padStart(4)} │ ${formatScore(player.avgScore).padStart(9)} │ ${formatDelta(player.avgDelta).padStart(7)} │ ${tier.padEnd(16)} │`);
    });

    console.log('└─────────┴──────────────────────────────────┴──────┴───────────┴─────────┴──────────────────┘');

    // Summary insights
    console.log('\n📊 KEY INSIGHTS:');
    console.log(`🎯 EV Range: ${Math.min(...playerResults.map(p => p.topArrangementEV)).toFixed(2)} - ${Math.max(...playerResults.map(p => p.topArrangementEV)).toFixed(2)}`);
    console.log(`⚡ Score Range: ${Math.min(...playerResults.map(p => p.avgScore)).toFixed(1)} - ${Math.max(...playerResults.map(p => p.avgScore)).toFixed(1)}`);
    console.log(`🏆 Tournament Winner: Player ${sortedPlayers[0].playerId} (${formatScore(sortedPlayers[0].avgScore)} points)`);
    console.log(`💸 Biggest Loser: Player ${sortedPlayers[sortedPlayers.length - 1].playerId} (${formatScore(sortedPlayers[sortedPlayers.length - 1].avgScore)} points)`);

    // Calculate total points (should be close to zero)
    const totalPoints = playerResults.reduce((sum, p) => sum + p.avgScore, 0);
    console.log(`⚖️  Point Balance: ${totalPoints.toFixed(2)} (should be ~0.0)`);

    console.log('\n' + '='.repeat(80));
}

function getRankEmoji(rank) {
    switch(rank) {
        case 1: return '🏆 #1';
        case 2: return '🥈 #2';
        case 3: return '🥉 #3';
        default: return `#${rank}`;
    }
}

function getPerformanceTier(ev, avgScore) {
    if (ev >= 3.0 && avgScore > 0) return '🏆 Champion';
    if (ev >= 3.0) return '🥈 Contender';
    if (ev >= 2.0) return '⚖️ Competitive';
    if (ev >= 1.0) return '📉 Struggling';
    return '💸 Crushed';
}

function formatHandStructure(arrangement) {
    // Extract hand types from arrangement
    const front = getHandTypeShort(arrangement.front);
    const middle = getHandTypeShort(arrangement.middle);
    const back = getHandTypeShort(arrangement.back);

    return `${front} + ${middle} + ${back}`;
}

function getHandTypeShort(hand) {
    if (!hand || !hand.name) return 'Unknown';

    const name = hand.name.toLowerCase();
    if (name.includes('four of a kind')) return '**Quads**';
    if (name.includes('full house')) return '**FH**';
    if (name.includes('flush')) return '**Flush**';
    if (name.includes('straight')) return 'Straight';
    if (name.includes('three of a kind')) return 'Trips';
    if (name.includes('two pair')) return '2-Pair';
    if (name.includes('pair')) return 'Pair';
    return 'High';
}

function formatScore(score) {
    return score >= 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
}

function formatDelta(delta) {
    return delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
}

// Example usage:
// Call this function after all players complete their analysis
// generateTournamentSummary(allPlayerResults);

// Example data structure expected:
const examplePlayerResults = [
    {
        playerId: 6,
        topArrangementEV: 3.32,
        avgScore: 6.29,
        avgDelta: -0.86,
        topArrangement: {
            front: { name: 'Pair' },
            middle: { name: 'Straight' },
            back: { name: 'Four of a Kind' }
        }
    },
    // ... other players
];

// After EACH player completes (not just Player 6)
function addPlayerToSummary(playerNum, playerData, allPlayerResults) {
    allPlayerResults.push({
        playerId: playerNum,
        topArrangementEV: playerData.topArrangementEV,
        avgScore: playerData.avgScore,
        avgDelta: playerData.avgDelta,
        wins: playerData.wins,
        topArrangement: playerData.topArrangement
    });
}
