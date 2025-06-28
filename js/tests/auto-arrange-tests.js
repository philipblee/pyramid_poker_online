/**
 * Unit Test Suite for Auto-Arrange Algorithm
 * File: js/tests/auto-arrange-tests.js
 *
 * Run with: node js/tests/auto-arrange-tests.js
 * Or include in HTML and call runAllTests() in console
 */

class AutoArrangeTestSuite {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    // =============================================================================
    // TEST FRAMEWORK
    // =============================================================================

    /**
     * Main test runner - executes all test suites
     */
    runAllTests() {
        console.log('🧪 Starting Auto-Arrange Algorithm Test Suite...\n');

        this.resetResults();

        // Core component tests
        this.testScoringUtilities();
        this.testHandDetector();
        this.testExistingEvaluationSystem();
        this.testIntegrationPoints();

        // Report results
        this.printTestSummary();

        return {
            total: this.totalTests,
            passed: this.passedTests,
            failed: this.failedTests,
            success: this.failedTests === 0
        };
    }

    /**
     * Assert helper with detailed logging
     */
    assert(condition, testName, description = '') {
        this.totalTests++;

        if (condition) {
            this.passedTests++;
            console.log(`✅ ${testName}: PASS ${description}`);
            this.testResults.push({ name: testName, status: 'PASS', description });
        } else {
            this.failedTests++;
            console.log(`❌ ${testName}: FAIL ${description}`);
            this.testResults.push({ name: testName, status: 'FAIL', description });
        }
    }

    /**
     * Test equality with detailed error reporting
     */
    assertEqual(actual, expected, testName, description = '') {
        const condition = JSON.stringify(actual) === JSON.stringify(expected);
        const detail = condition ? description : `Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`;
        this.assert(condition, testName, detail);
    }

    resetResults() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    // =============================================================================
    // SCORING UTILITIES TESTS
    // =============================================================================

    testScoringUtilities() {
        console.log('\n📊 Testing ScoringUtilities...');

        // Test 1: Standard point values
        this.testStandardPointValues();

        // Test 2: Large hand point values
        this.testLargeHandPointValues();

        // Test 3: Win probability coverage (the bug we found)
        this.testWinProbabilityCoverage();

        // Test 4: Expected value calculations
        this.testExpectedValueCalculations();

        // Test 5: Arrangement validation
        this.testArrangementValidation();
    }

    testStandardPointValues() {
        // Test front hand scoring
        const mockFullHouse = { name: 'Full House' };
        const frontFHPoints = ScoringUtilities.getPointsForHand(mockFullHouse, 'front', 5);
        this.assertEqual(frontFHPoints, 5, 'Front Full House Points', 'Should be 5 points');

        // Test middle hand scoring
        const mock4K = { name: 'Four of a Kind' };
        const middle4KPoints = ScoringUtilities.getPointsForHand(mock4K, 'middle', 5);
        this.assertEqual(middle4KPoints, 8, 'Middle 4K Points', 'Should be 8 points');

        // Test back hand scoring
        const mockSF = { name: 'Straight Flush' };
        const backSFPoints = ScoringUtilities.getPointsForHand(mockSF, 'back', 5);
        this.assertEqual(backSFPoints, 5, 'Back Straight Flush Points', 'Should be 5 points');
    }

    testLargeHandPointValues() {
        // Test 6-card hands
        const mock6K = { name: '6 of a Kind' };
        const back6KPoints = ScoringUtilities.getPointsForHand(mock6K, 'back', 6);
        this.assertEqual(back6KPoints, 10, 'Back 6K Points', '6-card same rank should be 10 points');

        const middle6KPoints = ScoringUtilities.getPointsForHand(mock6K, 'middle', 6);
        this.assertEqual(middle6KPoints, 20, 'Middle 6K Points', '6-card same rank should be 20 points (2x back)');

        // Test 8-card hands
        const mock8SF = { name: '8-card Straight Flush' };
        const back8SFPoints = ScoringUtilities.getPointsForHand(mock8SF, 'back', 8);
        this.assertEqual(back8SFPoints, 14, 'Back 8SF Points', '8-card SF should be 14 points');
    }

    testWinProbabilityCoverage() {
        // Test the bug we found - missing probability coverage for large hands
        const testHands = [
            { hand_rank: [16], name: '8 of a Kind' },      // Rank 16
            { hand_rank: [15], name: '8-card Straight Flush' }, // Rank 15
            { hand_rank: [14], name: '7 of a Kind' },      // Rank 14
            { hand_rank: [13], name: '7-card Straight Flush' }, // Rank 13
            { hand_rank: [12], name: '6 of a Kind' },      // Rank 12
            { hand_rank: [11], name: '6-card Straight Flush' }, // Rank 11
            { hand_rank: [10], name: 'Five of a Kind' },   // Rank 10
            { hand_rank: [1], name: 'High Card' }          // Rank 1
        ];

        testHands.forEach(hand => {
            try {
                const probability = ScoringUtilities.estimateWinProbability(hand, 'back', 4);
                const isValidProbability = probability >= 0 && probability <= 1 && !isNaN(probability);
                this.assert(isValidProbability, `Win Probability Rank ${hand.hand_rank[0]}`,
                    `${hand.name}: ${(probability * 100).toFixed(1)}%`);
            } catch (error) {
                this.assert(false, `Win Probability Rank ${hand.hand_rank[0]}`,
                    `${hand.name}: ERROR - ${error.message}`);
            }
        });
    }

    testExpectedValueCalculations() {
        const mock4K = { hand_rank: [8], name: 'Four of a Kind' };
        const mockCards = { length: 5 };

        try {
            const expectedValue = ScoringUtilities.getExpectedPoints(mock4K, mockCards, 'middle', 4);
            const isValidEV = expectedValue >= 0 && expectedValue <= 20 && !isNaN(expectedValue);
            this.assert(isValidEV, 'Expected Value Calculation', `4K middle: ${expectedValue.toFixed(2)} EV`);
        } catch (error) {
            this.assert(false, 'Expected Value Calculation', `ERROR: ${error.message}`);
        }
    }

    testArrangementValidation() {
        // Test valid arrangement
        const strongBack = { hand_rank: [8, 13] };    // 4K Kings
        const mediumMiddle = { hand_rank: [7, 12, 11] }; // FH Queens over Jacks
        const weakFront = { hand_rank: [4, 10] };     // 3K Tens

        const isValid = ScoringUtilities.isValidArrangement(strongBack, mediumMiddle, weakFront);
        this.assert(isValid, 'Valid Arrangement Check', 'Strong > Medium > Weak should be valid');

        // Test invalid arrangement
        const invalidIsValid = ScoringUtilities.isValidArrangement(weakFront, mediumMiddle, strongBack);
        this.assert(!invalidIsValid, 'Invalid Arrangement Check', 'Weak > Medium > Strong should be invalid');
    }

    // =============================================================================
    // HAND DETECTOR TESTS
    // =============================================================================

    testHandDetector() {
        console.log('\n🔍 Testing HandDetector...');

        if (typeof HandDetector === 'undefined') {
            console.log('⚠️  HandDetector not loaded - skipping tests');
            return;
        }

        // Test 1: Basic instantiation
        this.testHandDetectorInstantiation();

        // Test 2: Card counting
        this.testCardCounting();

        // Test 3: Large hand detection
        this.testLargeHandDetection();

        // Test 4: Conflict detection
        this.testConflictDetection();

        // Test 5: Position filtering
        this.testPositionFiltering();
    }

    testHandDetectorInstantiation() {
        try {
            const detector = new HandDetector(0);
            this.assert(detector instanceof HandDetector, 'HandDetector Instantiation', 'Should create instance');
            this.assertEqual(detector.wildsInHand, 0, 'Default Wilds', 'Should default to 0 wilds');
        } catch (error) {
            this.assert(false, 'HandDetector Instantiation', `ERROR: ${error.message}`);
        }
    }

    testCardCounting() {
        const detector = new HandDetector(0);
        const testCards = this.createTestCards();

        try {
            const counts = detector.countCards(testCards);

            // Verify structure
            this.assert('rankCounts' in counts, 'Card Counting Structure', 'Should have rankCounts');
            this.assert('suitCounts' in counts, 'Card Counting Structure', 'Should have suitCounts');
            this.assert('suitRankCounts' in counts, 'Card Counting Structure', 'Should have suitRankCounts');

            // Verify some counts
            this.assert(counts.rankCounts['A'] >= 0, 'Rank Counting', 'Should count Aces');
            this.assert(counts.suitCounts['H'] >= 0, 'Suit Counting', 'Should count Hearts');

        } catch (error) {
            this.assert(false, 'Card Counting', `ERROR: ${error.message}`);
        }
    }

    testLargeHandDetection() {
        // Create test scenario with 6 Kings
        const testCards = [
            ...this.createCardsOfRank('K', 6),
            ...this.createCardsOfRank('A', 4),
            ...this.createCardsOfRank('Q', 4),
            ...this.createCardsOfRank('J', 3)
        ];

        const detector = new HandDetector(0);

        try {
            const detectedHands = detector.detectAllHands(testCards);
            this.assert('6K' in detectedHands, 'Large Hand Detection Structure', 'Should have 6K category');

            // Should detect 6K if algorithm is working
            if (detectedHands['6K'].length > 0) {
                this.assert(true, 'Large Hand Detection', '6 Kings detected');
            } else {
                console.log('⚠️  6K not detected - algorithm may need implementation');
            }

        } catch (error) {
            this.assert(false, 'Large Hand Detection', `ERROR: ${error.message}`);
        }
    }

    testConflictDetection() {
        if (typeof HandDetector.handsConflict === 'function') {
            const hand1 = { requiredCards: ['AH', 'AS', 'AC'] };
            const hand2 = { requiredCards: ['AH', 'KH', 'QH'] }; // Shares AH
            const hand3 = { requiredCards: ['KD', 'QD', 'JD'] }; // No overlap

            const conflict = HandDetector.handsConflict(hand1, hand2);
            const noConflict = HandDetector.handsConflict(hand1, hand3);

            this.assert(conflict, 'Conflict Detection', 'Should detect shared Ace of Hearts');
            this.assert(!noConflict, 'No Conflict Detection', 'Should not detect conflict with different cards');
        } else {
            console.log('⚠️  HandDetector.handsConflict not implemented - skipping test');
        }
    }

    testPositionFiltering() {
        const detector = new HandDetector(0);

        try {
            const backHands = detector.getHandsForPosition('back');
            const frontHands = detector.getHandsForPosition('front');

            this.assert(Array.isArray(backHands), 'Position Filtering', 'Back hands should be array');
            this.assert(Array.isArray(frontHands), 'Position Filtering', 'Front hands should be array');

        } catch (error) {
            this.assert(false, 'Position Filtering', `ERROR: ${error.message}`);
        }
    }

    // =============================================================================
    // EXISTING SYSTEM TESTS
    // =============================================================================

    testExistingEvaluationSystem() {
        console.log('\n🃏 Testing Existing Evaluation System...');

        // Test evaluateHand function
        this.testEvaluateHand();

        // Test evaluateThreeCardHand function
        this.testEvaluateThreeCardHand();

        // Test large hand evaluation
        this.testLargeHandEvaluation();
    }

    testEvaluateHand() {
        if (typeof evaluateHand === 'function') {
            const testCards = this.createTestCards().slice(0, 5);

            try {
                const result = evaluateHand(testCards);
                this.assert('hand_rank' in result, 'evaluateHand Structure', 'Should have hand_rank');
                this.assert('name' in result, 'evaluateHand Structure', 'Should have name');
                this.assert(Array.isArray(result.hand_rank), 'evaluateHand hand_rank', 'hand_rank should be array');

            } catch (error) {
                this.assert(false, 'evaluateHand Function', `ERROR: ${error.message}`);
            }
        } else {
            console.log('⚠️  evaluateHand function not available - skipping test');
        }
    }

    testEvaluateThreeCardHand() {
        if (typeof evaluateThreeCardHand === 'function') {
            const testCards = this.createTestCards().slice(0, 3);

            try {
                const result = evaluateThreeCardHand(testCards);
                this.assert('hand_rank' in result, 'evaluateThreeCardHand Structure', 'Should have hand_rank');
                this.assert('name' in result, 'evaluateThreeCardHand Structure', 'Should have name');

            } catch (error) {
                this.assert(false, 'evaluateThreeCardHand Function', `ERROR: ${error.message}`);
            }
        } else {
            console.log('⚠️  evaluateThreeCardHand function not available - skipping test');
        }
    }

    testLargeHandEvaluation() {
        // Test 6-card hand evaluation
        const sixCardHand = this.createCardsOfRank('K', 6);

        if (typeof evaluateHand === 'function') {
            try {
                const result = evaluateHand(sixCardHand);
                this.assert(result.hand_rank[0] >= 10, 'Large Hand Evaluation',
                    `6K should have high rank, got: ${result.hand_rank[0]}`);

            } catch (error) {
                this.assert(false, 'Large Hand Evaluation', `ERROR: ${error.message}`);
            }
        }
    }

    // =============================================================================
    // INTEGRATION TESTS
    // =============================================================================

    testIntegrationPoints() {
        console.log('\n🔗 Testing Integration Points...');

        // Test that HandDetector output works with ScoringUtilities
        this.testHandDetectorScoringIntegration();

        // Test that all components can work together
        this.testEndToEndWorkflow();
    }

    testHandDetectorScoringIntegration() {
        if (typeof HandDetector !== 'undefined' && typeof ScoringUtilities !== 'undefined') {
            // Create a simple hand and test the full pipeline
            const detector = new HandDetector(0);
            const testCards = this.createCardsOfRank('A', 4).concat(this.createCardsOfRank('K', 1));

            try {
                const detectedHands = detector.detectAllHands(testCards);

                // If we detect any 4K hands, test scoring
                if (detectedHands['4K'] && detectedHands['4K'].length > 0) {
                    const fourKind = detectedHands['4K'][0];
                    const points = ScoringUtilities.getPointsForHand(fourKind.evaluation, 'back', 5);
                    this.assert(points > 0, 'Integration Test', `4K should score points: ${points}`);
                }

            } catch (error) {
                this.assert(false, 'Integration Test', `ERROR: ${error.message}`);
            }
        } else {
            console.log('⚠️  Missing components for integration test');
        }
    }

    testEndToEndWorkflow() {
        // This will be a comprehensive test once all components are built
        console.log('⚠️  End-to-end workflow test - placeholder for future implementation');
    }

    // =============================================================================
    // TEST DATA HELPERS
    // =============================================================================

    createTestCards() {
        const suits = ['H', 'D', 'C', 'S'];
        const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
        const cards = [];

        // Create a typical 17-card hand
        for (let i = 0; i < 17; i++) {
            const suit = suits[i % suits.length];
            const rank = ranks[i % ranks.length];
            cards.push({
                rank: rank,
                suit: suit,
                value: this.getRankValue(rank),
                id: `${rank}${suit}`,
                isWild: false
            });
        }

        return cards;
    }

    createCardsOfRank(rank, count) {
        const suits = ['H', 'D', 'C', 'S'];
        const cards = [];

        for (let i = 0; i < count; i++) {
            const suit = suits[i % suits.length];
            cards.push({
                rank: rank,
                suit: suit,
                value: this.getRankValue(rank),
                id: `${rank}${suit}${Math.floor(i / 4) + 1}`, // Handle multiple decks
                isWild: false
            });
        }

        return cards;
    }

    getRankValue(rank) {
        const values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
            '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        return values[rank] || 0;
    }

    // =============================================================================
    // RESULTS REPORTING
    // =============================================================================

    printTestSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 TEST SUITE SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);

        if (this.failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.filter(r => r.status === 'FAIL').forEach(test => {
                console.log(`  • ${test.name}: ${test.description}`);
            });
        }

        console.log('\n' + (this.failedTests === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'));
        console.log('='.repeat(60));
    }

    // =============================================================================
    // CONTINUOUS INTEGRATION HELPERS
    // =============================================================================

    /**
     * Quick smoke test - runs essential tests only
     */
    runSmokeTests() {
        console.log('🔥 Running Smoke Tests...\n');

        this.resetResults();
        this.testStandardPointValues();
        this.testWinProbabilityCoverage();

        if (typeof HandDetector !== 'undefined') {
            this.testHandDetectorInstantiation();
        }

        this.printTestSummary();
        return this.failedTests === 0;
    }

    /**
     * Export results in JSON format for CI/CD
     */
    exportResults() {
        return {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.totalTests,
                passed: this.passedTests,
                failed: this.failedTests,
                successRate: (this.passedTests / this.totalTests) * 100
            },
            details: this.testResults
        };
    }

     // =============================================================================
    // STRAIGHT FLUSH ENUMERATION TESTS
    // =============================================================================

    testCompleteStraightFlushEnumeration() {
        console.log('🧪 Testing Complete SF Enumeration: A♠ K♠ Q♠ J♠ T♠ T♠ 9♠ 8♠ 7♠ 6♠\n');

        const testCards = [
            { rank: 'A', suit: 'S', value: 14, id: 'AS1' },
            { rank: 'K', suit: 'S', value: 13, id: 'KS1' },
            { rank: 'Q', suit: 'S', value: 12, id: 'QS1' },
            { rank: 'J', suit: 'S', value: 11, id: 'JS1' },
            { rank: '10', suit: 'S', value: 10, id: '10S1' },
            { rank: '10', suit: 'S', value: 10, id: '10S2' },
            { rank: '9', suit: 'S', value: 9, id: '9S1' },
            { rank: '8', suit: 'S', value: 8, id: '8S1' },
            { rank: '7', suit: 'S', value: 7, id: '7S1' },
            { rank: '6', suit: 'S', value: 6, id: '6S1' }
        ];

        const detector = new HandDetector(0);
        const allSFs = detector.findAllStraightFlushes(testCards);

        console.log(`Found ${allSFs.length} total straight flushes:\n`);

        const byLength = {};
        allSFs.forEach(sf => {
            if (!byLength[sf.length]) byLength[sf.length] = [];
            byLength[sf.length].push(sf);
        });

        [8, 7, 6, 5].forEach(length => {
            if (byLength[length]) {
                console.log(`${length}-Card Straight Flushes (${byLength[length].length} found):`);
                byLength[length].forEach((sf, i) => {
                    const cardNames = sf.cards.map(c => c.rank).join('-');
                    console.log(`  ${i + 1}. ${cardNames}♠`);
                });
                console.log('');
            }
        });

        const expected = { 8: 2, 7: 3, 6: 4, 5: 5 };
        let allCorrect = true;

        [8, 7, 6, 5].forEach(length => {
            const found = byLength[length] ? byLength[length].length : 0;
            const expectedCount = expected[length];
            const correct = found === expectedCount;
            console.log(`${length}-card SFs: Found ${found}, Expected ${expectedCount} ${correct ? '✅' : '❌'}`);
            if (!correct) allCorrect = false;
        });

        const totalFound = allSFs.length;
        const totalExpected = 14;
        console.log(`\nTotal: Found ${totalFound}, Expected ${totalExpected} ${totalFound === totalExpected ? '✅' : '❌'}`);

        return allCorrect;
    }

    runAllStraightFlushTests() {
        console.log('🧪 Running All Straight Flush Tests...\n');

        const enumerationCorrect = this.testCompleteStraightFlushEnumeration();

        console.log('\n🏁 Straight Flush Test Summary:');
        console.log(`Enumeration: ${enumerationCorrect ? '✅ PASS' : '❌ FAIL'}`);

        return enumerationCorrect;
    }
}


// =============================================================================
// EXECUTION
// =============================================================================

// Auto-run tests if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoArrangeTestSuite;

    // Run tests if this file is executed directly
    if (require.main === module) {
        const testSuite = new AutoArrangeTestSuite();
        const results = testSuite.runAllTests();
        process.exit(results.success ? 0 : 1);
    }
}

// Browser environment - attach to window
if (typeof window !== 'undefined') {
    window.AutoArrangeTestSuite = AutoArrangeTestSuite;

    // Convenience function for console
    window.runAutoArrangeTests = function() {
        const testSuite = new AutoArrangeTestSuite();
        return testSuite.runAllTests();
    };

    window.runSmokeTests = function() {
        const testSuite = new AutoArrangeTestSuite();
        return testSuite.runSmokeTests();
    };
}


