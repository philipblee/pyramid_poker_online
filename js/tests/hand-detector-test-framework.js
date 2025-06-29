// js/tests/hand-detector-test-framework.js v10
// Testing framework class for HandDetector - supports all hand types including straight flushes
// v10: Added straight flush test support (5-8 card)

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

        // Calculate straight flush hands
        this.calculateStraightFlushHands(suitCounts, testCards, calculated);

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
     * Calculate straight flush hands (5-8 cards)
     */
    calculateStraightFlushHands(suitCounts, testCards, calculated) {
        calculated.straightFlush = 0;
        calculated.sixCardStraightFlush = 0;
        calculated.sevenCardStraightFlush = 0;
        calculated.eightCardStraightFlush = 0;

        Object.entries(suitCounts).forEach(([suit, count]) => {
            if (count >= 5) {
                // Get cards of this suit and their ranks
                const suitCards = testCards.filter(c => c.suit === suit);
                const suitRanks = suitCards.map(c => this.getRankValue(c.rank)).sort((a, b) => a - b);

                console.log(`🌈 Suit ${suit} ranks:`, suitRanks);

                // Check for consecutive sequences of different lengths
                for (let length = 5; length <= Math.min(8, count); length++) {
                    const sequences = this.findConsecutiveSequences(suitRanks, length);

                    if (length === 5) calculated.straightFlush += sequences;
                    else if (length === 6) calculated.sixCardStraightFlush += sequences;
                    else if (length === 7) calculated.sevenCardStraightFlush += sequences;
                    else if (length === 8) calculated.eightCardStraightFlush += sequences;
                }
            }
        });
    }

    /**
     * Find consecutive sequences of specified length in sorted rank array
     */
    findConsecutiveSequences(sortedRanks, length) {
        let sequences = 0;

        // Check regular sequences
        for (let i = 0; i <= sortedRanks.length - length; i++) {
            let isConsecutive = true;
            for (let j = 1; j < length; j++) {
                if (sortedRanks[i + j] !== sortedRanks[i] + j) {
                    isConsecutive = false;
                    break;
                }
            }
            if (isConsecutive) {
                sequences++;
            }
        }

        // Check wheel (A-2-3-4-5, A-2-3-4-5-6, etc.) - only for length 5-6
        if (length <= 6 && sortedRanks.includes(14) && sortedRanks.includes(2)) {
            const wheelRanks = [14]; // Ace
            for (let i = 2; i < 2 + length - 1; i++) {
                wheelRanks.push(i);
            }

            if (wheelRanks.every(rank => sortedRanks.includes(rank))) {
                sequences++;
            }
        }

        return sequences;
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
                } else if (category === 'straightFlush') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === 'Straight Flush').length : 0;
                } else if (category === 'sixCardStraightFlush') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === '6-card Straight Flush').length : 0;
                } else if (category === 'sevenCardStraightFlush') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === '7-card Straight Flush').length : 0;
                } else if (category === 'eightCardStraightFlush') {
                    actualCount = results.hands ? results.hands.filter(h => h.handType === '8-card Straight Flush').length : 0;
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
        console.log('🧪 ======== HANDDETECTOR TESTING WITH STRAIGHT FLUSHES ========');

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