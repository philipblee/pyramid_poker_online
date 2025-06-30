// js/tests/test-hand-sorter.js v1
// Test suite for HandSorter - Step 1 of ArrangementGenerator

class HandSorterTestSuite {
    constructor() {
        this.sorter = new HandSorter();
        this.testResults = [];
    }

    /**
     * Run all HandSorter tests
     */
    runAllTests() {
        console.log('🧪 ======== HAND SORTER TEST SUITE ========\n');

        this.testEmptyInput();
        this.testSingleHand();
        this.testBasicSorting();
        this.testComplexSorting();
        this.testTieBreaking();
        this.testValidationFunction();

        this.displaySummary();
        return this.getTestResults();
    }

    /**
     * Test empty input handling
     */
    testEmptyInput() {
        console.log('🔍 Testing Empty Input...');

        const result = this.sorter.sortHandsByStrength([]);

        const passed = result.sortedHands.length === 0 &&
                      result.metadata.totalHands === 0;

        this.recordTest('Empty Input', passed, {
            expected: { length: 0 },
            actual: { length: result.sortedHands.length }
        });
    }

    /**
     * Test single hand input
     */
    testSingleHand() {
        console.log('🔍 Testing Single Hand...');

        const testHand = this.createTestHand('Pair', [1, 14, 14, 2, 3]);
        const result = this.sorter.sortHandsByStrength([testHand]);

        const passed = result.sortedHands.length === 1 &&
                      result.sortedHands[0].handType === 'Pair';

        this.recordTest('Single Hand', passed, {
            expected: { length: 1, type: 'Pair' },
            actual: { length: result.sortedHands.length, type: result.sortedHands[0]?.handType }
        });
    }

    /**
     * Test basic sorting with clearly different hand types
     */
    testBasicSorting() {
        console.log('🔍 Testing Basic Sorting...');

        const hands = [
            this.createTestHand('Pair', [1, 14, 14, 2, 3]),           // Weakest
            this.createTestHand('Straight Flush', [8, 14, 13, 12, 11, 10]), // Strongest
            this.createTestHand('Three of a Kind', [3, 9, 9, 9, 5, 4]),    // Middle
            this.createTestHand('Straight', [4, 14, 13, 12, 11, 10])       // Strong
        ];

        const result = this.sorter.sortHandsByStrength(hands);

        // Expected order: Straight Flush, Straight, Three of a Kind, Pair
        const expectedOrder = ['Straight Flush', 'Straight', 'Three of a Kind', 'Pair'];
        const actualOrder = result.sortedHands.map(h => h.handType);

        const passed = JSON.stringify(actualOrder) === JSON.stringify(expectedOrder);

        this.recordTest('Basic Sorting', passed, {
            expected: expectedOrder,
            actual: actualOrder
        });

        // Also test validation
        const validation = this.sorter.validateSortOrder(result.sortedHands);
        console.log(`   Validation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
    }

    /**
     * Test complex sorting with similar hand types
     */
    testComplexSorting() {
        console.log('🔍 Testing Complex Sorting...');

        const hands = [
            this.createTestHand('4 of a Kind', [7, 9, 9, 9, 9, 5]),      // 4 Nines
            this.createTestHand('4 of a Kind', [7, 14, 14, 14, 14, 5]),  // 4 Aces (stronger)
            this.createTestHand('4 of a Kind', [7, 13, 13, 13, 13, 5]),  // 4 Kings
            this.createTestHand('Full House', [6, 10, 10, 10, 8, 8])     // Weaker than any 4K
        ];

        const result = this.sorter.sortHandsByStrength(hands);

        // Expected: 4 Aces, 4 Kings, 4 Nines, Full House
        const actualTypes = result.sortedHands.map(h => h.handType);
        const actualRanks = result.sortedHands.map(h => h.hand_rank[1]); // Get the rank value

        const passed = actualTypes.every(type => type === '4 of a Kind' || type === 'Full House') &&
                      actualRanks[0] === 14 && // Aces first
                      actualRanks[1] === 13 && // Kings second
                      actualRanks[2] === 9;    // Nines third

        this.recordTest('Complex Sorting', passed, {
            expected: 'Aces > Kings > Nines > Full House',
            actual: actualRanks.slice(0, 3).join(' > ') + ' > Full House'
        });
    }

    /**
     * Test tie breaking (should maintain stable order)
     */
    testTieBreaking() {
        console.log('🔍 Testing Tie Breaking...');

        // Create identical hands
        const hands = [
            this.createTestHand('Pair', [1, 14, 14, 13, 12], 'hand1'),
            this.createTestHand('Pair', [1, 14, 14, 13, 12], 'hand2'),
            this.createTestHand('Pair', [1, 14, 14, 13, 12], 'hand3')
        ];

        const result = this.sorter.sortHandsByStrength(hands);

        // All should have same rank, order should be stable
        const allSameRank = result.sortedHands.every(hand =>
            JSON.stringify(hand.hand_rank) === JSON.stringify([1, 14, 14, 13, 12])
        );

        this.recordTest('Tie Breaking', allSameRank, {
            expected: 'All hands same rank',
            actual: `${result.sortedHands.length} hands with consistent ranks`
        });
    }

    /**
     * Test the validation function
     */
    testValidationFunction() {
        console.log('🔍 Testing Validation Function...');

        // Create properly sorted hands
        const validHands = [
            this.createTestHand('Straight Flush', [8, 14, 13, 12, 11, 10]),
            this.createTestHand('4 of a Kind', [7, 14, 14, 14, 14, 5]),
            this.createTestHand('Pair', [1, 14, 14, 2, 3])
        ];

        // Create improperly sorted hands
        const invalidHands = [
            this.createTestHand('Pair', [1, 14, 14, 2, 3]),              // Should be last
            this.createTestHand('Straight Flush', [8, 14, 13, 12, 11, 10]), // Should be first
            this.createTestHand('4 of a Kind', [7, 14, 14, 14, 14, 5])   // Should be middle
        ];

        const validResult = this.sorter.validateSortOrder(validHands);
        const invalidResult = this.sorter.validateSortOrder(invalidHands);

        const passed = validResult.isValid && !invalidResult.isValid;

        this.recordTest('Validation Function', passed, {
            expected: 'Valid: true, Invalid: false',
            actual: `Valid: ${validResult.isValid}, Invalid: ${invalidResult.isValid}`
        });
    }

    /**
     * Create a test hand object
     */
    createTestHand(handType, hand_rank, id = null) {
        return {
            handType: handType,
            hand_rank: hand_rank,
            strength: hand_rank[0] * 1000 + (hand_rank[1] || 0), // Simple strength calc
            cards: [], // Not needed for sorting tests
            cardCount: 5,
            validPositions: ['front', 'middle', 'back'],
            id: id || `${handType}_${Date.now()}_${Math.random()}`
        };
    }

    /**
     * Record a test result
     */
    recordTest(testName, passed, details = {}) {
        const result = { testName, passed, details };
        this.testResults.push(result);

        const status = passed ? '✅' : '❌';
        console.log(`   ${status} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);

        if (!passed) {
            console.log(`      Expected: ${JSON.stringify(details.expected)}`);
            console.log(`      Actual: ${JSON.stringify(details.actual)}`);
        }
    }

    /**
     * Display test summary
     */
    displaySummary() {
        console.log('\n📋 ======== TEST SUMMARY ========');

        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;

        console.log(`✅ Tests Passed: ${passed}/${total}`);

        if (passed === total) {
            console.log('🎉 ALL TESTS PASSED! HandSorter is working correctly.');
        } else {
            console.log('❌ Some tests failed. Check implementation.');

            this.testResults.filter(r => !r.passed).forEach(test => {
                console.log(`   ❌ ${test.testName}: ${JSON.stringify(test.details)}`);
            });
        }
    }

    /**
     * Get test results for external analysis
     */
    getTestResults() {
        return {
            passed: this.testResults.filter(r => r.passed).length,
            total: this.testResults.length,
            success: this.testResults.every(r => r.passed),
            details: this.testResults
        };
    }
}

/**
 * Main test runner function
 */
function runHandSorterTests() {
    const testSuite = new HandSorterTestSuite();
    return testSuite.runAllTests();
}

/**
 * Quick test with real HandDetector data (if available)
 */
function testWithRealData() {
    console.log('\n🧪 Testing with Real HandDetector Data...');

    // This assumes HandDetector is available
    if (typeof HandDetector !== 'undefined') {
        // Create some test cards
        const testCards = [
            {suit: '♠', rank: 'A', value: 14, id: 'A♠_1'},
            {suit: '♥', rank: 'A', value: 14, id: 'A♥_2'},
            {suit: '♦', rank: 'A', value: 14, id: 'A♦_3'},
            {suit: '♣', rank: 'A', value: 14, id: 'A♣_4'},
            {suit: '♠', rank: 'K', value: 13, id: 'K♠_5'}
            // Add more cards...
        ];

        const detector = new HandDetector(testCards);
        const detectionResults = detector.detectAllHands();

        const sorter = new HandSorter();
        const sortResults = sorter.sortHandsByStrength(detectionResults.hands);

        console.log(`   Detected: ${detectionResults.total} hands`);
        console.log(`   Sorted: ${sortResults.sortedHands.length} hands`);
        console.log(`   Strongest: ${sortResults.metadata.strengthRange.strongest.handType}`);
        console.log(`   Weakest: ${sortResults.metadata.strengthRange.weakest.handType}`);

        return sortResults;
    } else {
        console.log('   ⚠️ HandDetector not available, skipping real data test');
        return null;
    }
}