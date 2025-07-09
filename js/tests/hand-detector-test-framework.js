// js/tests/hand-detector-test-framework.js v12
// Testing framework class for HandDetector - supports all hand types including two pairs
// v12: Added automatic 4K expansion calculation

class HandDetectorTestFramework {
    constructor() {
        this.testResults = [];
    }

    /**
     * Calculate expected hand counts for a given card set
     * This will help verify our manual calculations and catch errors
     */
    calculateExpectedCounts(cardString) {
        const testCards = this.parseCards(cardString);

        // Count cards by rank
        const rankCounts = {};
        testCards.forEach(card => {
            rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        });

        // Count cards by suit
        const suitCounts = {};
        testCards.forEach(card => {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        });

        console.log('🔢 CALCULATING EXPECTED COUNTS:');
        console.log('Rank distribution:', rankCounts);
        console.log('Suit distribution:', suitCounts);

        const calculated = {};

        // Calculate of-a-kind hands (NOW WITH 4K EXPANSION)
        this.calculateOfAKindHands(rankCounts, calculated);

        // NEW: Calculate two pairs (must come AFTER of-a-kind calculation)
        this.calculateTwoPairs(rankCounts, calculated);

        // Calculate flush hands
        this.calculateFlushHands(suitCounts, calculated);

        // Calculate straight hands
        this.calculateStraightHands(rankCounts, calculated);

        // Calculate straight flush hands
        this.calculateStraightFlushHands(suitCounts, testCards, calculated);

        // Subtract straight flushes from flush count to eliminate duplicates
        calculated.flush = calculated.flush - calculated.straightFlush;

        // Calculate full houses
        this.calculateFullHouses(rankCounts, calculated);

        // Calculate single card hands
        this.calculateSingleCardHands(testCards, calculated);

        // Calculate total
        calculated.total = Object.entries(calculated)
            .filter(([key]) => key !== 'total')
            .reduce((sum, [, count]) => sum + count, 0);

        console.log('📊 CALCULATED EXPECTED COUNTS:', calculated);
        return calculated;
    }

    /**
     * Combination formula C(n,r) = n! / (r! * (n-r)!)
     */
    combination(n, r) {
        if (n < r) return 0;
        if (r === 0 || r === n) return 1;

        let result = 1;
        for (let i = 0; i < r; i++) {
            result = result * (n - i) / (i + 1);
        }
        return Math.round(result);
    }

    /**
     * Parse compact card notation into testCards array
     * Format: "A♠ K♠ Q♠ J♠ 10♠ A♥ A♦ A♣ K♥ K♦ 9♥ 8♦ 7♣ 6♥ 5♦ 4♣ 3♥"
     */
    parseCards(cardString) {
        const cards = [];
        const cardTokens = cardString.trim().split(/\s+/);

        cardTokens.forEach((token, index) => {
            const match = token.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
            if (!match) {
                throw new Error(`Invalid card format: ${token}`);
            }

            const [, rank, suit] = match;
            const value = this.getRankValue(rank);

            cards.push({
                suit: suit,
                rank: rank,
                value: value,
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
     * Get numeric value for rank
     */
    getRankValue(rank) {
        const values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        return values[rank];
    }

    /**
     * Run a single test case - always uses calculated expected values
     */
    runTestCase(testCase) {
        console.log(`\n🧪 TEST ${testCase.id}: ${testCase.name}`);
        console.log(`Cards: ${testCase.cards}`);

        try {
            let expectedToUse;
            let useCalculated = false;

            // ALWAYS calculate expected values (our source of truth)
            const counter = new CountValidHands();
            const calculatedExpected = counter.calculateExpectedCounts(testCase.cards);

            // Check if test case has manual expected values to validate
            if (testCase.expected && Object.keys(testCase.expected).length > 0) {
                const comparison = this.compareExpectedValues(testCase.expected, calculatedExpected);

                if (comparison.match) {
                    console.log('✅ Manual and calculated values match!');
                } else {
                    console.log('⚠️ WARNING: Manual expected values do not match calculated!');
                    console.log('   This test case needs manual expected values updated.');
                    comparison.differences.forEach(diff => {
                        console.log(`   ${diff.category}: manual=${diff.manual}, calculated=${diff.calculated}`);
                    });
                }
            } else {
                console.log('🤖 Using calculated expected values (no manual expected provided)');
            }

            // ALWAYS use calculated values for testing (they're our source of truth)
            expectedToUse = calculatedExpected;
            useCalculated = true;

            // Parse cards and run detector
            const testCards = this.parseCards(testCase.cards);
            const startTime = performance.now();
            const detector = new HandDetector(testCards);
            const results = detector.detectAllHands();
            const endTime = performance.now();

            // Verify results using CALCULATED expected values (source of truth)
            const verification = this.verifyExpectations(results, calculatedExpected);

            const testResult = {
                id: testCase.id,
                name: testCase.name,
                cards: testCase.cards,
                timing: endTime - startTime,
                results: results,
                expected: calculatedExpected,        // Use calculated as expected
                manual: testCase.expected || null,   // Keep manual for reference
                useCalculated: useCalculated,
                verification: verification,
                passed: verification.allPassed       // Pass/fail based on calculated vs detected
            };

            this.testResults.push(testResult);
            this.displayTestResult(testResult);
            return testResult;

        } catch (error) {
            console.log(`❌ TEST FAILED: ${error.message}`);
            const errorResult = {
                id: testCase.id,
                name: testCase.name,
                error: error.message,
                passed: false
            };
            this.testResults.push(errorResult);
            return errorResult;
        }
    }

    /**
     * Compare manual vs calculated expected values
     */
    compareExpectedValues(manual, calculated) {
        const differences = [];
        let match = true;

        // Check each category
        const allCategories = new Set([...Object.keys(manual), ...Object.keys(calculated)]);

        allCategories.forEach(category => {
            const manualValue = manual[category] || 0;
            const calculatedValue = calculated[category] || 0;

            if (manualValue !== calculatedValue) {
                match = false;
                differences.push({
                    category,
                    manual: manualValue,
                    calculated: calculatedValue
                });
            }
        });

        return { match, differences };
    }

    /**
     * Verify results match expectations - UPDATED with Two Pair support
     */
    verifyExpectations(results, expected) {
        const verification = {
            checks: [],
            allPassed: true
        };

        Object.entries(expected).forEach(([category, expectedCount]) => {
            let actualCount;

            if (category === 'total') {
                actualCount = results.total || 0;
            } else {
                // Count hands of specific types
                if (category === 'fourOfAKind') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'Four of a Kind').length : 0;
                } else if (category === 'fiveOfAKind') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === '5 of a Kind').length : 0;
                } else if (category === 'sixOfAKind') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === '6 of a Kind').length : 0;
                } else if (category === 'sevenOfAKind') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === '7 of a Kind').length : 0;
                } else if (category === 'eightOfAKind') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === '8 of a Kind').length : 0;
                } else if (category === 'threeOfAKind') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'Three of a Kind').length : 0;
                } else if (category === 'pair') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'Pair').length : 0;
                } else if (category === 'twoPair') {
                    // NEW: Two Pair verification
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'Two Pair').length : 0;
                } else if (category === 'fullHouse') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'Full House').length : 0;
                } else if (category === 'flush') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'Flush').length : 0;
                } else if (category === 'straight') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'Straight').length : 0;
                } else if (category === 'straightFlush') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'Straight Flush').length : 0;
                } else if (category === 'sixCardStraightFlush') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === '6-card Straight Flush').length : 0;
                } else if (category === 'sevenCardStraightFlush') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === '7-card Straight Flush').length : 0;
                } else if (category === 'eightCardStraightFlush') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === '8-card Straight Flush').length : 0;
                } else if (category === 'highCard') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'High Card').length : 0;
                } else {
                    actualCount = 0; // Unknown category
                }
            }

            const passed = actualCount === expectedCount;

            verification.checks.push({
                category,
                expected: expectedCount,
                actual: actualCount,
                passed
            });

            if (!passed) {
                verification.allPassed = false;
            }
        });

        return verification;
    }

    /**
     * Display single test result
     */
    displayTestResult(testResult) {
        console.log(`⏱️ Time: ${testResult.timing.toFixed(2)}ms`);
        console.log(`📊 Total hands: ${testResult.results.total}`);

        // Show verification results
        testResult.verification.checks.forEach(check => {
            const status = check.passed ? '✅' : '❌';
            console.log(`${status} ${check.category}: ${check.actual} (expected: ${check.expected})`);
        });

        // Show examples of found hands (limited to avoid spam)
        if (testResult.results.hands && testResult.results.hands.length > 0) {
            const handTypes = ['Four of a Kind', 'Full House', 'Straight Flush', 'Flush', 'Straight'];
            handTypes.forEach(handType => {
                const handsOfType = testResult.results.hands.filter(h => h.handType === handType);
                if (handsOfType.length > 0) {
                    const example = handsOfType[0];
                    const cardStr = example.cards.map(c => c.rank + c.suit).join(' ');
                    const positionScores = example.positionScores ? JSON.stringify(example.positionScores) : 'none';
                    console.log(`   ${handType}: ${cardStr} (${example.cardCount} cards, complete: ${!example.isIncomplete}, scores: ${positionScores})`);

                    if (handsOfType.length > 1) {
                        console.log(`     ... +${handsOfType.length - 1} more ${handType} hands`);
                    }
                }
            });
        }

        console.log(`🎯 RESULT: ${testResult.passed ? 'PASSED' : 'FAILED'}`);
    }

    /**
     * Run all test cases
     */
    runAllTests(testCases) {
        console.log('🧪 ======== HANDDETECTOR TESTING WITH 4K EXPANSION ========');

        this.testResults = [];

        testCases.forEach(testCase => {
            this.runTestCase(testCase);
        });

        this.displaySummary();
        return this.testResults;
    }

    /**
     * Display test summary
     */
    displaySummary() {
        console.log('\n📋 ======== TEST SUMMARY ========');

        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const avgTime = this.testResults
            .filter(r => r.timing)
            .reduce((sum, r) => sum + r.timing, 0) / total;

        console.log(`✅ Tests Passed: ${passed}/${total}`);
        console.log(`⏱️ Average Time: ${avgTime.toFixed(2)}ms`);

        // Show failed tests
        const failed = this.testResults.filter(r => !r.passed);
        if (failed.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            failed.forEach(test => {
                console.log(`   ${test.id}: ${test.name}`);
                if (test.verification) {
                    test.verification.checks.forEach(check => {
                        if (!check.passed) {
                            console.log(`      ${check.category}: got ${check.actual}, expected ${check.expected}`);
                        }
                    });
                }
            });
        }

        console.log('\n🎯 Overall:', passed === total ? 'ALL TESTS PASSED!' : 'SOME TESTS FAILED');
    }
}