// js/tests/hand-detector-tests.js v9
// Testing framework for HandDetector - of-a-kind + full houses + flushes + straights
// v9: Added automatic calculation of expected values to verify manual counts
// v8: Of-a-kind + full houses + flushes + straights
// v7: Of-a-kind + full houses + flushes
// v6: Of-a-kind + full houses
// v5: Of-a-kind focused tests with drop-one pattern

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

        // Calculate of-a-kind hands
        this.calculateOfAKindHands(rankCounts, calculated);

        // Calculate flush hands
        this.calculateFlushHands(suitCounts, calculated);

        // Calculate straight hands
        this.calculateStraightHands(rankCounts, calculated);

        // Calculate full houses
        this.calculateFullHouses(rankCounts, calculated);

        // Calculate total
        calculated.total = Object.entries(calculated)
            .filter(([key]) => key !== 'total')
            .reduce((sum, [, count]) => sum + count, 0);

        console.log('📊 CALCULATED EXPECTED COUNTS:', calculated);
        return calculated;
    }

    /**
     * Calculate of-a-kind hands (pairs, trips, 4K, 5K, 6K, 7K, 8K)
     */
    calculateOfAKindHands(rankCounts, calculated) {
        // Initialize counters
        calculated.pair = 0;
        calculated.threeOfAKind = 0;
        calculated.fourOfAKind = 0;
        calculated.fiveOfAKind = 0;
        calculated.sixOfAKind = 0;
        calculated.sevenOfAKind = 0;
        calculated.eightOfAKind = 0;

        Object.entries(rankCounts).forEach(([rank, count]) => {
            // Natural hands and ONLY immediate drop-one variants
            if (count >= 8) {
                calculated.eightOfAKind += 1;
                calculated.sevenOfAKind += count; // 8K → 7K only
            } else if (count >= 7) {
                calculated.sevenOfAKind += 1;
                calculated.sixOfAKind += count; // 7K → 6K only
            } else if (count >= 6) {
                calculated.sixOfAKind += 1;
                calculated.fiveOfAKind += count; // 6K → 5K only
            } else if (count >= 5) {
                calculated.fiveOfAKind += 1;
                calculated.fourOfAKind += count; // 5K → 4K only (NO trips)
            } else if (count >= 4) {
                calculated.fourOfAKind += 1;
                calculated.threeOfAKind += count; // 4K → 3K only (NO pairs)
            } else if (count === 3) {
                calculated.threeOfAKind += 1; // Natural trip
                calculated.pair += count; // Natural trips → pairs only
            } else if (count === 2) {
                calculated.pair += 1; // Natural pairs only
            }
        });
    }

    /**
     * Calculate flush hands using combination formula C(n,5)
     */
    calculateFlushHands(suitCounts, calculated) {
        calculated.flush = 0;

        Object.entries(suitCounts).forEach(([suit, count]) => {
            if (count >= 5) {
                // C(n,5) = n! / (5! * (n-5)!)
                calculated.flush += this.combination(count, 5);
            }
        });
    }

    /**
     * Calculate straight hands
     */
    calculateStraightHands(rankCounts, calculated) {
        calculated.straight = 0;

        // Define all possible straights (using rank values for easier calculation)
        const straightPatterns = [
            [14, 13, 12, 11, 10], // A-K-Q-J-10
            [13, 12, 11, 10, 9],  // K-Q-J-10-9
            [12, 11, 10, 9, 8],   // Q-J-10-9-8
            [11, 10, 9, 8, 7],    // J-10-9-8-7
            [10, 9, 8, 7, 6],     // 10-9-8-7-6
            [9, 8, 7, 6, 5],      // 9-8-7-6-5
            [8, 7, 6, 5, 4],      // 8-7-6-5-4
            [7, 6, 5, 4, 3],      // 7-6-5-4-3
            [6, 5, 4, 3, 2],      // 6-5-4-3-2
            [5, 4, 3, 2, 14]      // 5-4-3-2-A (wheel)
        ];

        // Convert rankCounts to use numeric values
        const valueCount = {};
        Object.entries(rankCounts).forEach(([rank, count]) => {
            const value = this.getRankValue(rank);
            valueCount[value] = count;
        });

        straightPatterns.forEach(pattern => {
            let ways = 1;
            let canForm = true;

            pattern.forEach(value => {
                const available = valueCount[value] || 0;
                if (available === 0) {
                    canForm = false;
                } else {
                    ways *= available;
                }
            });

            if (canForm) {
                calculated.straight += ways;
            }
        });
    }

    /**
     * Calculate full house hands
     */
    calculateFullHouses(rankCounts, calculated) {
        calculated.fullHouse = 0;

        // Get trips and pairs, but don't double-count the same cards
        Object.entries(rankCounts).forEach(([tripRank, tripCount]) => {
            if (tripCount === 3 || tripCount === 4) {
                // Only natural trips (3) and 4K (which create trips) can provide trips
                const tripsAvailable = tripCount === 3 ? 1 : tripCount; // Natural trip = 1, 4K = count

                Object.entries(rankCounts).forEach(([pairRank, pairCount]) => {
                    if (pairRank !== tripRank && pairCount >= 2) {
                        // Different rank can provide pairs
                        let pairsAvailable;
                        if (pairCount === 2) {
                            pairsAvailable = 1; // Natural pair
                        } else if (pairCount === 3) {
                            pairsAvailable = 3; // Natural trip creates 3 pairs
                        } else {
                            pairsAvailable = 0; // 4K+ don't create pairs, only trips
                        }

                        calculated.fullHouse += tripsAvailable * pairsAvailable;
                    }
                });
            }
        });
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
     * Run a single test case
     */
    runTestCase(testCase) {
        console.log(`\n🧪 TEST ${testCase.id}: ${testCase.name}`);
        console.log(`Cards: ${testCase.cards}`);

        try {
            // Calculate expected counts
            const calculatedExpected = this.calculateExpectedCounts(testCase.cards);

            // Compare with manual expected values
            console.log('📋 MANUAL vs CALCULATED COMPARISON:');
            const comparison = this.compareExpectedValues(testCase.expected, calculatedExpected);

            if (!comparison.match) {
                console.log('⚠️ WARNING: Manual and calculated values differ!');
                comparison.differences.forEach(diff => {
                    console.log(`   ${diff.category}: manual=${diff.manual}, calculated=${diff.calculated}`);
                });
            } else {
                console.log('✅ Manual and calculated values match!');
            }

            // Parse cards
            const testCards = this.parseCards(testCase.cards);

            // Run HandDetector
            const startTime = performance.now();
            const detector = new HandDetector(testCards);
            const results = detector.detectAllHands();
            const endTime = performance.now();

            // Verify expectations (use calculated values if available)
            const expectedToUse = comparison.match ? testCase.expected : calculatedExpected;
            const verification = this.verifyExpectations(results, expectedToUse);

            const testResult = {
                id: testCase.id,
                name: testCase.name,
                cards: testCase.cards,
                timing: endTime - startTime,
                results: results,
                expected: expectedToUse,
                manual: testCase.expected,
                calculated: calculatedExpected,
                comparison: comparison,
                verification: verification,
                passed: verification.allPassed
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
     * Verify results match expectations
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
                // For our simplified results, all hands are in results.hands array
                // Count hands of specific types
                if (category === 'fourOfAKind') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === '4 of a Kind').length : 0;
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
                } else if (category === 'fullHouse') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'Full House').length : 0;
                } else if (category === 'flush') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'Flush').length : 0;
                } else if (category === 'straight') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'Straight').length : 0;
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

        // Show examples of found hands
        if (testResult.results.hands && testResult.results.hands.length > 0) {
            testResult.results.hands.forEach(hand => {
                const cardStr = hand.cards.map(c => c.rank + c.suit).join(' ');
                console.log(`   ${hand.handType}: ${cardStr} (${hand.rank}s)`);
            });
        }

        console.log(`🎯 RESULT: ${testResult.passed ? 'PASSED' : 'FAILED'}`);
    }

    /**
     * Run all test cases
     */
    runAllTests(testCases) {
        console.log('🧪 ======== HANDDETECTOR OF-A-KIND + FULL HOUSE + FLUSH + STRAIGHT TESTING ========');

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

// =============================================================================
// TEST CASES - FOCUSED ON 4+ OF A KIND + FULL HOUSES + FLUSHES + STRAIGHTS
// =============================================================================

const HAND_DETECTOR_TEST_CASES = [
    {
        id: 1,
        name: "Four Aces + Two Kings",
        cards: "A♠ A♥ A♦ A♣ K♠ Q♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠ 2♠ K♥",
        expected: {
            fourOfAKind: 1,      // 1 natural 4K
            threeOfAKind: 4,     // 4 drop-one variants from 4K
            pair: 1,             // 1 natural pair (Kings)
            fullHouse: 4,        // 4 trips × 1 pair = 4 full houses
            flush: 1287,         // C(13,5) = 1287 spades flushes
            straight: 21,        // 21 straights (A-K-Q-J-10: 8, K-Q-J-10-9: 2, others: 1 each, 5-4-3-2-A: 4)
            total: 1318
        }
    },

    {
        id: 2,
        name: "Five Kings",
        cards: "K♠ K♥ K♦ K♣ K♠ A♠ Q♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠ 2♠",
        expected: {
            fiveOfAKind: 1,      // 1 natural 5K
            fourOfAKind: 5,      // 5 drop-one variants from 5K
            flush: 2002,         // C(14,5) = 2002 spades flushes
            straight: 18,        // 18 straights (A-K-Q-J-10: 5, K-Q-J-10-9: 5, others: 1 each)
            total: 2026
        }
    },

    {
        id: 3,
        name: "Six Queens",
        cards: "Q♠ Q♥ Q♦ Q♣ Q♠ Q♥ A♠ K♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠",
        expected: {
            sixOfAKind: 1,       // 1 natural 6K
            fiveOfAKind: 6,      // 6 drop-one variants from 6K
            flush: 1287,         // C(13,5) = 1287 spades flushes (13♠, 2♥, 1♦, 1♣)
            straight: 23,        // 23 straights (A-K-Q-J-10: 6, K-Q-J-10-9: 6, Q-J-10-9-8: 6, others: 5×1)
            total: 1317
        }
    },

    {
        id: 4,
        name: "Seven Jacks",
        cards: "J♠ J♥ J♦ J♣ J♠ J♥ J♦ A♠ K♠ Q♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠",
        expected: {
            sevenOfAKind: 1,     // 1 natural 7K
            sixOfAKind: 7,       // 7 drop-one variants from 7K
            flush: 792,          // C(12,5) = 792 spades flushes (12♠, 2♥, 2♦, 1♣)
            straight: 31,        // 31 straights (A-K-Q-J-10: 7, K-Q-J-10-9: 7, Q-J-10-9-8: 7, J-10-9-8-7: 7, others: 3×1)
            total: 831
        }
    },

    {
        id: 5,
        name: "Eight Tens",
        cards: "10♠ 10♥ 10♦ 10♣ 10♠ 10♥ 10♦ 10♣ A♠ K♠ Q♠ J♠ 9♠ 8♠ 7♠ 6♠ 5♠",
        expected: {
            eightOfAKind: 1,     // 1 natural 8K
            sevenOfAKind: 8,     // 8 drop-one variants from 8K
            flush: 462,          // C(11,5) = 462 spades flushes (11♠, 2♥, 2♦, 2♣)
            straight: 41,        // 41 straights (A-K-Q-J-10: 8, K-Q-J-10-9: 8, Q-J-10-9-8: 8, J-10-9-8-7: 8, 10-9-8-7-6: 8, 9-8-7-6-5: 1)
            total: 512
        }
    },

    {
        id: 6,
        name: "Multiple 4-of-a-kinds",
        cards: "A♠ A♥ A♦ A♣ K♠ K♥ K♦ K♣ Q♠ Q♥ Q♦ Q♣ J♠ J♥ J♦ J♣ 10♠",
        expected: {
            fourOfAKind: 4,      // 4 natural 4Ks (A,K,Q,J)
            threeOfAKind: 16,    // 4×4 = 16 drop-one variants
            flush: 1,            // C(5,5) = 1 spades flush (A,K,Q,J,10)
            straight: 256,       // 256 straights (A-K-Q-J-10: 4×4×4×4×1)
            total: 277
        }
    },

    {
        id: 7,
        name: "Triples and Pairs",
        cards: "A♠ A♥ A♦ K♠ K♥ K♦ Q♠ Q♥ Q♦ J♠ J♥ J♦ 10♠ 10♥ 10♦ 9♠ 9♥",
        expected: {
            threeOfAKind: 5,     // 5 natural 3Ks (A,K,Q,J,10)
            pair: 16,            // 5×3 = 15 from 3Ks + 1 natural pair (9s)
            fullHouse: 65,       // 5 trips × 13 eligible pairs = 65 full houses
            flush: 13,           // 6♠ + 6♥ + 1♦ = C(6,5) + C(6,5) + C(5,5) = 6+6+1 = 13 flushes
            straight: 405,       // 405 straights (A-K-Q-J-10: 243, K-Q-J-10-9: 162)
            total: 504
        }
    },

    {
        id: 8,
        name: "Mixed: 5K + 4K + 3Ks + pairs",
        cards: "A♠ A♥ A♦ A♣ A♠ K♠ K♥ K♦ K♣ Q♠ Q♥ Q♦ J♠ J♥ J♦ 10♠ 9♠",
        expected: {
            fiveOfAKind: 1,      // 1 natural 5K (Aces)
            fourOfAKind: 6,      // 5 from 5K + 1 natural 4K (Kings)
            threeOfAKind: 6,     // 4 from 4K + 1 natural 3K (Q) + 1 natural 3K (J)
            pair: 6,             // 3 from Q 3K + 3 from J 3K
            fullHouse: 30,       // 4×6 + 1×3 + 1×3 = 30 full houses
            flush: 21,           // C(7,5) = 21 spades flushes (A♠,A♠,K♠,Q♠,J♠,10♠,9♠)
            straight: 216,       // 216 straights (A-K-Q-J-10: 180, K-Q-J-10-9: 36)
            total: 286
        }
    }
];

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

/**
 * Run all HandDetector tests
 */
function runHandDetectorTests() {
    const framework = new HandDetectorTestFramework();
    const results = framework.runAllTests(HAND_DETECTOR_TEST_CASES);
    return results;
}

/**
 * Run a specific test by ID
 */
function runSingleTest(testId) {
    const framework = new HandDetectorTestFramework();
    const testCase = HAND_DETECTOR_TEST_CASES.find(t => t.id === testId);

    if (!testCase) {
        console.log(`❌ Test ${testId} not found`);
        return null;
    }

    return framework.runTestCase(testCase);
}

/**
 * Calculate expected values for a test case without running the detector
 */
function calculateExpectedValues(testId) {
    const framework = new HandDetectorTestFramework();
    const testCase = HAND_DETECTOR_TEST_CASES.find(t => t.id === testId);

    if (!testCase) {
        console.log(`❌ Test ${testId} not found`);
        return null;
    }

    console.log(`\n🧮 CALCULATING EXPECTED VALUES FOR TEST ${testId}: ${testCase.name}`);
    console.log(`Cards: ${testCase.cards}`);

    const calculated = framework.calculateExpectedCounts(testCase.cards);
    const comparison = framework.compareExpectedValues(testCase.expected, calculated);

    console.log('\n📋 COMPARISON RESULTS:');
    console.log('Manual expected:', testCase.expected);
    console.log('Calculated expected:', calculated);

    if (comparison.match) {
        console.log('✅ Values match perfectly!');
    } else {
        console.log('⚠️ Differences found:');
        comparison.differences.forEach(diff => {
            console.log(`   ${diff.category}: manual=${diff.manual}, calculated=${diff.calculated}`);
        });
    }

    return { manual: testCase.expected, calculated, comparison };
}