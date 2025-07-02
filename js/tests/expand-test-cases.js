// js/tests/expand-test-cases.js
// Script to add random test cases to HAND_DETECTOR_TEST_CASES array

/**
 * Generate a random test case with 17 cards from 2-deck pool
 * @param {number} id - Test case ID
 * @returns {Object} Test case object matching existing format
 */
function generateRandomTestCase(id) {
    // Create 2-deck pool (104 cards total, no wilds)
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    const cardPool = [];

    // Add each card twice (2 decks)
    suits.forEach(suit => {
        ranks.forEach(rank => {
            cardPool.push(`${rank}${suit}`);
            cardPool.push(`${rank}${suit}`); // Second copy
        });
    });

    // Shuffle the pool
    for (let i = cardPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]];
    }

    // Take first 17 cards
    const selectedCards = cardPool.slice(0, 17);
    const cardsString = selectedCards.join(' ');

    return {
        id: id,
        name: `Random Case ${id}`,
        cards: cardsString
        // No expected values - will be calculated by framework
    };
}

/**
 * Add random test cases to the existing HAND_DETECTOR_TEST_CASES array
 * @param {number} count - Number of random cases to add
 * @param {number} startId - Starting ID (default: 18)
 */
function addRandomTestCases(count, startId = 18) {
    console.log(`🎲 Adding ${count} random test cases starting from ID ${startId}`);

    const newCases = [];

    for (let i = 0; i < count; i++) {
        const caseId = startId + i;
        const randomCase = generateRandomTestCase(caseId);
        newCases.push(randomCase);

        // Add to existing array
        HAND_DETECTOR_TEST_CASES.push(randomCase);

        console.log(`✅ Added Case ${caseId}: ${randomCase.cards.substring(0, 30)}...`);
    }

    console.log(`🎯 Total test cases now: ${HAND_DETECTOR_TEST_CASES.length}`);
    return newCases;
}

/**
 * Run incremental testing: 17 → 30 → 60 → 90
 * @returns {Object} Complete results summary
 */
function runIncrementalTesting() {
    console.log('🚀 ======== INCREMENTAL TESTING STARTED ========');

    const phases = [
        { target: 30, label: '17 → 30' },
        { target: 60, label: '30 → 60' },
        { target: 90, label: '60 → 90' }
    ];

    const allResults = [];

    phases.forEach((phase, phaseIndex) => {
        console.log(`\n📈 Phase ${phaseIndex + 1}: ${phase.label}`);

        // Add cases if needed
        const currentCount = HAND_DETECTOR_TEST_CASES.length;
        if (currentCount < phase.target) {
            const needed = phase.target - currentCount;
            addRandomTestCases(needed, currentCount + 1);
        }

        // Test all cases up to target
        console.log(`\n🧪 Testing cases 1-${phase.target}...`);
        const phaseResults = runTestBatch(1, phase.target);
        allResults.push(...phaseResults);

        // Phase summary
        console.log(`\n📊 Phase ${phaseIndex + 1} Summary:`);
        console.log(`   Cases tested: ${phaseResults.length}`);
        const avgScore = phaseResults.reduce((sum, r) => sum + r.score, 0) / phaseResults.length;
        const avgTime = phaseResults.reduce((sum, r) => sum + r.searchTime, 0) / phaseResults.length;
        console.log(`   Average score: ${avgScore.toFixed(1)}`);
        console.log(`   Average time: ${avgTime.toFixed(1)}ms`);
    });

    // Final comprehensive summary
    displayComprehensiveSummary(allResults);

    return allResults;
}

/**
 * Run a batch of test cases
 * @param {number} startId - First case ID to test
 * @param {number} endId - Last case ID to test
 * @returns {Array} Results array
 */
function runTestBatch(startId, endId) {
    const results = [];

    for (let i = startId; i <= endId; i++) {
        console.log(`\n--- Testing Case ${i} ---`);

        try {
            const result = testBestArrangementGenerator(i);
            if (result && result.arrangement) {
                results.push({
                    caseId: i,
                    score: result.score,
                    searchTime: result.statistics.searchTime,
                    exploredNodes: result.statistics.exploredNodes,
                    efficiency: result.statistics.efficiency,
                    arrangement: {
                        back: {
                            handType: result.arrangement.back.handType,
                            score: getHandScore(result.arrangement.back, 'back'),
                            cards: result.arrangement.back.cards.map(c => c.rank + c.suit).join(' ')
                        },
                        middle: {
                            handType: result.arrangement.middle.handType,
                            score: getHandScore(result.arrangement.middle, 'middle'),
                            cards: result.arrangement.middle.cards.map(c => c.rank + c.suit).join(' ')
                        },
                        front: {
                            handType: result.arrangement.front.handType,
                            score: getHandScore(result.arrangement.front, 'front'),
                            cards: result.arrangement.front.cards.map(c => c.rank + c.suit).join(' ')
                        }
                    },
                    source: 'BestArrangementGenerator' // Could expand to detect fallbacks
                });
            }
        } catch (error) {
            console.log(`❌ Case ${i} failed: ${error.message}`);
            results.push({
                caseId: i,
                error: error.message,
                source: 'Failed'
            });
        }
    }

    return results;
}

/**
 * Get hand score using ScoringUtilities
 * @param {Object} hand - Hand object with cards and evaluation
 * @param {string} position - 'front', 'middle', 'back'
 * @returns {number} Points for this hand if it wins
 */
function getHandScore(hand, position) {
    if (!hand || !hand.cards) return 0;

    try {
        return ScoringUtilities.getPointsForHand(hand, position, hand.cards.length);
    } catch (error) {
        return 0;
    }
}

/**
 * Display comprehensive summary of all results
 * @param {Array} allResults - All test results
 */
function displayComprehensiveSummary(allResults) {
    console.log('\n🏆 ======== COMPREHENSIVE SUMMARY ========');

    const successful = allResults.filter(r => !r.error);
    const failed = allResults.filter(r => r.error);

    console.log(`📊 Overall Statistics:`);
    console.log(`   Total cases: ${allResults.length}`);
    console.log(`   Successful: ${successful.length}`);
    console.log(`   Failed: ${failed.length}`);

    if (successful.length > 0) {
        const avgScore = successful.reduce((sum, r) => sum + r.score, 0) / successful.length;
        const avgTime = successful.reduce((sum, r) => sum + r.searchTime, 0) / successful.length;
        const avgNodes = successful.reduce((sum, r) => sum + r.exploredNodes, 0) / successful.length;

        console.log(`   Average score: ${avgScore.toFixed(1)}`);
        console.log(`   Average time: ${avgTime.toFixed(1)}ms`);
        console.log(`   Average nodes: ${avgNodes.toFixed(0)}`);

        // Score distribution
        const scores = successful.map(r => r.score).sort((a, b) => b - a);
        console.log(`   Score range: ${scores[0]} to ${scores[scores.length - 1]}`);
    }

    // Detailed results table
    console.log(`\n📋 Detailed Results:`);
    console.log(`Case | Score | Time(ms) | Nodes | Back Hand | Middle Hand | Front Hand | Source`);
    console.log(`-----|-------|----------|-------|-----------|-------------|------------|-------`);

    allResults.forEach(r => {
        if (r.error) {
            console.log(`${r.caseId.toString().padStart(4)} | ERROR | ${r.error}`);
        } else {
            const backHand = r.arrangement.back.handType.padEnd(15);
            const middleHand = r.arrangement.middle.handType.padEnd(15);
            const frontHand = r.arrangement.front.handType.padEnd(15);

            console.log(`${r.caseId.toString().padStart(4)} | ${r.score.toString().padStart(5)} | ${r.searchTime.toFixed(1).padStart(8)} | ${r.exploredNodes.toString().padStart(5)} | ${backHand} | ${middleHand} | ${frontHand} | ${r.source}`);
        }
    });
}

// Quick start functions
function addThreeRandomCases() {
    return addRandomTestCases(3); // Add cases 18, 19, 20
}

function testFirst20Cases() {
    console.log('🧪 Testing first 20 cases (17 existing + 3 new)...');
    return runTestBatch(1, 20);
}