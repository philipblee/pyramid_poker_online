// js/tests/metadata-test-runner-v2.js
// Fixed version that shows calculated vs actual (not manual vs actual)

/**
 * Run metadata report for a specific test case by ID
 * @param {number} testCaseId - ID of test case from HAND_DETECTOR_TEST_CASES
 */
function runMetadataTestById(testCaseId) {
    console.log(`\n🧪 ======== METADATA TEST FOR CASE ${testCaseId} ========`);

    // Find the test case
    const testCase = HAND_DETECTOR_TEST_CASES.find(tc => tc.id === testCaseId);

    if (!testCase) {
        console.log(`❌ Test case ${testCaseId} not found!`);
        console.log(`Available test cases: ${HAND_DETECTOR_TEST_CASES.map(tc => tc.id).join(', ')}`);
        return null;
    }

    console.log(`📋 Test Case: ${testCase.name}`);
    console.log(`🃏 Cards: ${testCase.cards}`);

    try {
        // Parse the cards
        const testCards = parseTestCaseCards(testCase.cards);

        // Calculate expected values using our corrected framework
        console.log('\n🔍 Calculating expected values...');
        const framework = new HandDetectorTestFramework();
        const calculatedExpected = framework.calculateExpectedCounts(testCase.cards);

        // Run HandDetector
        console.log('\n🔍 Running HandDetector...');
        const startTime = performance.now();
        const detector = new HandDetector(testCards);
        const results = detector.detectAllHands();
        const endTime = performance.now();

        console.log(`⏱️ Detection time: ${(endTime - startTime).toFixed(2)}ms`);

        // Generate metadata report
        reportHandDetectorMetadata(results, testCards);

        // Show CORRECTED comparison: calculated vs actual
        console.log('\n📊 ======== CORRECTED COMPARISON ========');
        console.log('✅ Calculated expected values (from corrected framework):', calculatedExpected);

        // Get actual counts
        const actualCounts = {};
        actualCounts.total = results.total;
        actualCounts.highCard = results.hands.filter(h => h.handType === 'High Card').length;
        actualCounts.pair = results.hands.filter(h => h.handType === 'Pair').length;
        actualCounts.twoPair = results.hands.filter(h => h.handType === 'Two Pair').length;
        actualCounts.threeOfAKind = results.hands.filter(h => h.handType === 'Three of a Kind').length;
        actualCounts.straight = results.hands.filter(h => h.handType === 'Straight').length;
        actualCounts.flush = results.hands.filter(h => h.handType === 'Flush').length;
        actualCounts.fullHouse = results.hands.filter(h => h.handType === 'Full House').length;
        actualCounts.fourOfAKind = results.hands.filter(h => h.handType === 'Four of a Kind').length;
        actualCounts.fiveOfAKind = results.hands.filter(h => h.handType === 'Five of a Kind').length;
        actualCounts.sixOfAKind = results.hands.filter(h => h.handType === '6 of a Kind').length;
        actualCounts.sevenOfAKind = results.hands.filter(h => h.handType === '7 of a Kind').length;
        actualCounts.eightOfAKind = results.hands.filter(h => h.handType === '8 of a Kind').length;
        actualCounts.straightFlush = results.hands.filter(h => h.handType === 'Straight Flush').length;
        actualCounts.sixCardStraightFlush = results.hands.filter(h => h.handType === '6-card Straight Flush').length;
        actualCounts.sevenCardStraightFlush = results.hands.filter(h => h.handType === '7-card Straight Flush').length;
        actualCounts.eightCardStraightFlush = results.hands.filter(h => h.handType === '8-card Straight Flush').length;

        console.log('✅ Actual detected counts:', actualCounts);

        // Check for differences (should be none!)
        let allMatch = true;
        const differences = [];

        Object.keys(calculatedExpected).forEach(key => {
            const expected = calculatedExpected[key];
            const actual = actualCounts[key] || 0;
            if (expected !== actual) {
                allMatch = false;
                differences.push({key, expected, actual, diff: actual - expected});
                console.log(`  ⚠️ ${key}: expected ${expected}, got ${actual} (diff: ${actual - expected})`);
            }
        });

        if (allMatch) {
            console.log('🎉 ✅ ALL VALUES MATCH! Calculated expected = Actual detected');
            console.log('🎉 ✅ 4K expansion and framework calculation working perfectly!');
        } else {
            console.log(`❌ Found ${differences.length} differences between calculated and actual`);
            differences.forEach(diff => {
                console.log(`   ${diff.key}: expected ${diff.expected}, actual ${diff.actual}`);
            });
        }

        // Show old manual values for reference
        if (testCase.expected) {
            console.log('\n📋 Reference: Old manual expected values:', testCase.expected);
            console.log('💡 Note: Manual values are outdated since 4K expansion was added');
        }

        return {
            testCase,
            results,
            timing: endTime - startTime,
            cards: testCards,
            calculatedExpected,
            actualCounts,
            allMatch,
            differences
        };

    } catch (error) {
        console.log(`❌ Error running test: ${error.message}`);
        console.log(`❌ Error stack:`, error.stack);  // Add this line
        return null;
    }
}

/**
 * Run metadata reports for multiple test cases
 * @param {Array} testCaseIds - Array of test case IDs to run
 */
function runMetadataTestsForIds(testCaseIds) {
    console.log(`\n🧪 ======== METADATA TESTS FOR CASES: ${testCaseIds.join(', ')} ========`);

    const results = [];

    testCaseIds.forEach(id => {
        const result = runMetadataTestById(id);
        if (result) {
            results.push(result);
        }
        console.log('\n' + '='.repeat(80)); // Separator
    });

    // Summary across all tests
    if (results.length > 1) {
        console.log(`\n📊 ======== SUMMARY ACROSS ${results.length} TEST CASES ========`);

        let totalHands = 0;
        let totalComplete = 0;
        let totalIncomplete = 0;
        let avgTime = 0;
        let allTestsMatch = 0;

        results.forEach(result => {
            totalHands += result.results.total;
            totalComplete += result.results.completeHands;
            totalIncomplete += result.results.incompleteHands;
            avgTime += result.timing;
            if (result.allMatch) allTestsMatch++;
        });

        avgTime /= results.length;

        console.log(`Total hands across all tests: ${totalHands}`);
        console.log(`Total complete hands: ${totalComplete}`);
        console.log(`Total incomplete hands: ${totalIncomplete}`);
        console.log(`Average detection time: ${avgTime.toFixed(2)}ms`);
        console.log(`Tests with perfect match: ${allTestsMatch}/${results.length}`);

        if (allTestsMatch === results.length) {
            console.log('🎉 ALL TESTS HAVE PERFECT CALCULATED VS ACTUAL MATCH!');
        }

        // Find most/least complex test cases
        const maxHands = Math.max(...results.map(r => r.results.total));
        const minHands = Math.min(...results.map(r => r.results.total));
        const maxTest = results.find(r => r.results.total === maxHands);
        const minTest = results.find(r => r.results.total === minHands);

        console.log(`Most complex: Test ${maxTest.testCase.id} (${maxHands} hands)`);
        console.log(`Least complex: Test ${minTest.testCase.id} (${minHands} hands)`);
    }

    return results;
}

/**
 * Parse test case card string into card objects
 * @param {string} cardString - Card string from test case
 * @returns {Array} Array of card objects
 */
function parseTestCaseCards(cardString) {
    const cards = [];
    const cardTokens = cardString.trim().split(/\s+/);

    cardTokens.forEach((token, index) => {
        const match = token.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
        if (!match) {
            throw new Error(`Invalid card format: ${token}`);
        }

        const [, rank, suit] = match;

        cards.push({
            suit: suit,
            rank: rank,
            id: `${rank}${suit}_${index + 1}`,
            isWild: false
        });
    });

    if (cards.length !== 17) {
        throw new Error(`Expected 17 cards, got ${cards.length}`);
    }

    return cards;
}

/**
 * Quick test of interesting cases
 */
function runInterestingMetadataTests() {
    console.log('🧪 ======== RUNNING INTERESTING METADATA TESTS (V2) ========');

    // Test cases with different complexity levels
    const interestingCases = [
        1,  // Four Aces + Two Kings (4K expansion)
        6,  // Multiple 4-of-a-kinds (multiple 4K expansions)
        2,  // Five Kings (5K, complete)
        9,  // 5-card Straight Flush
        17  // Auto-calculated test
    ];

    return runMetadataTestsForIds(interestingCases);
}

// Export functions
if (typeof module !== 'undefined') {
    module.exports = {
        runMetadataTestById,
        runMetadataTestsForIds,
        runInterestingMetadataTests,
        parseTestCaseCards
    };
}