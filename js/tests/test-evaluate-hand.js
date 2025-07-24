// js/tests/test-evaluate-hand.js
// Comprehensive unit test suite for evaluateHand() function

class TestEvaluateHand {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
    }

    /**
     * Run all unit tests for evaluateHand function
     */
    runAllTests() {
        console.log('\n🧪 ======== EVALUATE HAND UNIT TESTS ========');
        console.log('Testing all hand types and edge cases');

        // Test all standard 5-card hands
        this.testHighCard();
        this.testPair();
        this.testTwoPair();
        this.testThreeOfAKind();
        this.testStraight();
        this.testFlush();
        this.testFullHouse();
        this.testFourOfAKind();
        this.testStraightFlush();
        this.testFiveOfAKind();

        // Test large hands (6-8 cards)
        this.testLargeHands();

        // Test edge cases
        this.testEdgeCases();

        // Test wild card hands
        this.testWildCardHands();

        // Display results
        this.displayResults();

        return {
            total: this.totalTests,
            passed: this.passedTests,
            failed: this.totalTests - this.passedTests,
            successRate: (this.passedTests / this.totalTests * 100).toFixed(1) + '%'
        };
    }

    /**
     * Test High Card hands
     */
    testHighCard() {
        console.log('\n🃏 Testing High Card hands...');

        const testCases = [
            {
                name: 'Ace High',
                cards: this.createCards(['A♠', 'K♥', 'Q♦', 'J♣', '9♠']),
                expected: { rank: 0, name: 'High Card', firstRank: 1, secondRank: 14 }
            },
            {
                name: 'King High',
                cards: this.createCards(['K♠', 'Q♥', 'J♦', '10♣', '8♠']),
                expected: { rank: 0, name: 'High Card', firstRank: 1, secondRank: 13 }
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Test Pair hands
     */
    testPair() {
        console.log('\n🃏 Testing Pair hands...');

        const testCases = [
            {
                name: 'Pair of Aces',
                cards: this.createCards(['A♠', 'A♥', 'K♦', 'Q♣', 'J♠']),
                expected: { rank: 1, name: 'Pair', firstRank: 2, secondRank: 14 }
            },
            {
                name: 'Pair of Twos',
                cards: this.createCards(['2♠', '2♥', 'A♦', 'K♣', 'Q♠']),
                expected: { rank: 1, name: 'Pair', firstRank: 2, secondRank: 2 }
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Test Two Pair hands
     */
    testTwoPair() {
        console.log('\n🃏 Testing Two Pair hands...');

        const testCases = [
            {
                name: 'Aces and Kings',
                cards: this.createCards(['A♠', 'A♥', 'K♦', 'K♣', 'Q♠']),
                expected: { rank: 2, name: 'Two Pair', firstRank: 3, secondRank: 14 }
            },
            {
                name: 'Fives and Threes',
                cards: this.createCards(['5♠', '5♥', '3♦', '3♣', '2♠']),
                expected: { rank: 2, name: 'Two Pair', firstRank: 3, secondRank: 5 }
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Test Three of a Kind hands
     */
    testThreeOfAKind() {
        console.log('\n🃏 Testing Three of a Kind hands...');

        const testCases = [
            {
                name: 'Trip Aces',
                cards: this.createCards(['A♠', 'A♥', 'A♦', 'K♣', 'Q♠']),
                expected: { rank: 3, name: 'Three of a Kind', firstRank: 4, secondRank: 14 }
            },
            {
                name: 'Trip Sevens',
                cards: this.createCards(['7♠', '7♥', '7♦', '5♣', '3♠']),
                expected: { rank: 3, name: 'Three of a Kind', firstRank: 4, secondRank: 7 }
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Test Straight hands
     */
    testStraight() {
        console.log('\n🃏 Testing Straight hands...');

        const testCases = [
            {
                name: 'Broadway Straight (A-K-Q-J-10)',
                cards: this.createCards(['A♠', 'K♥', 'Q♦', 'J♣', '10♠']),
                expected: { rank: 4, name: 'Straight', firstRank: 5, secondRank: 14 }
            },
            {
                name: 'Wheel Straight (5-4-3-2-A)',
                cards: this.createCards(['5♠', '4♥', '3♦', '2♣', 'A♠']),
                expected: { rank: 4, name: 'Straight', firstRank: 5, secondRank: 14 }
            },
            {
                name: 'Middle Straight (9-8-7-6-5)',
                cards: this.createCards(['9♠', '8♥', '7♦', '6♣', '5♠']),
                expected: { rank: 4, name: 'Straight', firstRank: 5, secondRank: 9 }
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Test Flush hands
     */
    testFlush() {
        console.log('\n🃏 Testing Flush hands...');

        const testCases = [
            {
                name: 'Spade Flush',
                cards: this.createCards(['A♠', 'K♠', 'Q♠', 'J♠', '9♠']),
                expected: { rank: 5, name: 'Flush', firstRank: 6, secondRank: 14 }
            },
            {
                name: 'Heart Flush',
                cards: this.createCards(['10♥', '8♥', '7♥', '5♥', '3♥']),
                expected: { rank: 5, name: 'Flush', firstRank: 6, secondRank: 10 }
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Test Full House hands
     */
    testFullHouse() {
        console.log('\n🃏 Testing Full House hands...');

        const testCases = [
            {
                name: 'Aces Full of Kings',
                cards: this.createCards(['A♠', 'A♥', 'A♦', 'K♣', 'K♠']),
                expected: { rank: 6, name: 'Full House', firstRank: 7, secondRank: 14 }
            },
            {
                name: 'Fives Full of Twos',
                cards: this.createCards(['5♠', '5♥', '5♦', '2♣', '2♠']),
                expected: { rank: 6, name: 'Full House', firstRank: 7, secondRank: 5 }
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Test Four of a Kind hands
     */
    testFourOfAKind() {
        console.log('\n🃏 Testing Four of a Kind hands...');

        const testCases = [
            {
                name: 'Quad Aces',
                cards: this.createCards(['A♠', 'A♥', 'A♦', 'A♣', 'K♠']),
                expected: { rank: 7, name: 'Four of a Kind', firstRank: 8, secondRank: 14 }
            },
            {
                name: 'Quad Fours',
                cards: this.createCards(['4♠', '4♥', '4♦', '4♣', '2♠']),
                expected: { rank: 7, name: 'Four of a Kind', firstRank: 8, secondRank: 4 }
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Test Straight Flush hands
     */
    testStraightFlush() {
        console.log('\n🃏 Testing Straight Flush hands...');

        const testCases = [
            {
                name: 'Royal Flush',
                cards: this.createCards(['A♠', 'K♠', 'Q♠', 'J♠', '10♠']),
                expected: { rank: 8, name: 'Royal Flush', firstRank: 9, secondRank: 14 }
            },
            {
                name: 'Straight Flush (9-high)',
                cards: this.createCards(['9♠', '8♠', '7♠', '6♠', '5♠']),
                expected: { rank: 8, name: 'Straight Flush', firstRank: 9, secondRank: 9 }
            },
            {
                name: 'Steel Wheel (5-high SF)',
                cards: this.createCards(['5♠', '4♠', '3♠', '2♠', 'A♠']),
                expected: { rank: 8, name: 'Straight Flush', firstRank: 9, secondRank: 14 }
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Test Five of a Kind hands
     */
    testFiveOfAKind() {
        console.log('\n🃏 Testing Five of a Kind hands...');

        const testCases = [
            {
                name: 'Five Aces',
                cards: this.createCards(['A♠', 'A♥', 'A♦', 'A♣', 'A♠']),
                expected: { rank: 9, name: 'Five of a Kind', firstRank: 10, secondRank: 14 }
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Test Large Hands (6-8 cards)
     */
    testLargeHands() {
        console.log('\n🃏 Testing Large Hands (6-8 cards)...');

        const testCases = [
            {
                name: '6 of a Kind',
                cards: this.createCards(['A♠', 'A♥', 'A♦', 'A♣', 'A♠', 'A♥']),
                expected: { rank: 11, name: '6 of a Kind', firstRank: 12 }
            },
            {
                name: '7-card Straight Flush',
                cards: this.createCards(['A♠', 'K♠', 'Q♠', 'J♠', '10♠', '9♠', '8♠']),
                expected: { rank: 13, name: '7-Card Straight Flush', firstRank: 13 }
            },
            {
                name: '8 of a Kind',
                cards: this.createCards(['K♠', 'K♥', 'K♦', 'K♣', 'K♠', 'K♥', 'K♦', 'K♣']),
                expected: { rank: 15, name: '8 of a Kind', firstRank: 16 }
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Test Edge Cases
     */
    testEdgeCases() {
        console.log('\n🃏 Testing Edge Cases...');

        const testCases = [
            {
                name: 'Invalid Hand (4 cards)',
                cards: this.createCards(['A♠', 'K♥', 'Q♦', 'J♣']),
                expected: { rank: 0, name: 'Invalid' }
            },
            {
                name: 'Invalid Hand (6 cards)',
                cards: this.createCards(['A♠', 'K♥', 'Q♦', 'J♣', '10♠', '9♥']),
                expected: { rank: 11 } // Should handle 6-card hands
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Test Wild Card Hands
     */
    testWildCardHands() {
        console.log('\n🃏 Testing Wild Card Hands...');

        const testCases = [
            {
                name: 'Pair with 1 Wild',
                cards: this.createCards(['A♠', '🃏', 'K♦', 'Q♣', 'J♠']),
                expected: { rank: 1, name: 'Pair (Wild)' }
            },
            {
                name: 'Three of a Kind with 2 Wilds',
                cards: this.createCards(['A♠', '🃏', '🃏', 'K♣', 'Q♠']),
                expected: { rank: 3, name: 'Three of a Kind (Wild)' }
            }
        ];

        testCases.forEach(testCase => this.runSingleTest(testCase));
    }

    /**
     * Run a single test case
     */
    runSingleTest(testCase) {
        this.totalTests++;

        try {
            const result = evaluateHand(testCase.cards);
            const passed = this.validateResult(result, testCase.expected, testCase.name);

            if (passed) {
                this.passedTests++;
                console.log(`  ✅ ${testCase.name}`);
            } else {
                console.log(`  ❌ ${testCase.name}`);
                console.log(`     Expected: rank=${testCase.expected.rank}, name="${testCase.expected.name}"`);
                console.log(`     Got: rank=${result.rank}, name="${result.name}"`);
                if (result.hand_rank) {
                    console.log(`     Hand rank: [${result.hand_rank.join(', ')}]`);
                }
            }

            this.testResults.push({
                name: testCase.name,
                passed,
                expected: testCase.expected,
                actual: result
            });

        } catch (error) {
            console.log(`  ❌ ${testCase.name} - ERROR: ${error.message}`);
            this.testResults.push({
                name: testCase.name,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Validate test result against expected values
     */
    validateResult(actual, expected, testName) {
        // Check rank
        if (actual.rank !== expected.rank) {
            return false;
        }

        // Check name (contains expected name)
        if (expected.name && !actual.name.includes(expected.name)) {
            return false;
        }

        // Check hand_rank array structure
        if (expected.firstRank !== undefined && actual.hand_rank) {
            if (actual.hand_rank[0] !== expected.firstRank) {
                return false;
            }
        }

        if (expected.secondRank !== undefined && actual.hand_rank) {
            if (actual.hand_rank[1] !== expected.secondRank) {
                return false;
            }
        }

        return true;
    }

    /**
     * Create card objects from string notation
     */
    createCards(cardStrings) {
        return cardStrings.map((cardStr, index) => {
            if (cardStr === '🃏') {
                return {
                    id: `wild_${index}`,
                    rank: '',
                    suit: '',
                    value: 0,
                    isWild: true
                };
            }

            const rank = cardStr.slice(0, -1);
            const suit = cardStr.slice(-1);
            const value = this.getRankValue(rank);

            return {
                id: `${rank}${suit}_${index}`,
                rank: rank,
                suit: suit,
                value: value,
                isWild: false
            };
        });
    }

    /**
     * Get numeric value for card rank
     */
    getRankValue(rank) {
        const rankValues = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        return rankValues[rank] || 0;
    }

    /**
     * Display final test results
     */
    displayResults() {
        console.log('\n📊 ======== TEST RESULTS SUMMARY ========');
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`Passed: ${this.passedTests} ✅`);
        console.log(`Failed: ${this.totalTests - this.passedTests} ❌`);
        console.log(`Success Rate: ${(this.passedTests / this.totalTests * 100).toFixed(1)}%`);

        // Show failed tests
        const failedTests = this.testResults.filter(r => !r.passed);
        if (failedTests.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            failedTests.forEach(test => {
                console.log(`  - ${test.name}`);
                if (test.error) {
                    console.log(`    Error: ${test.error}`);
                }
            });
        } else {
            console.log('\n🎉 ALL TESTS PASSED!');
        }
    }
}

// Main test runner functions
function testEvaluateHand() {
    const tester = new TestEvaluateHand();
    return tester.runAllTests();
}

function quickTestEvaluateHand() {
    console.log('\n🚀 Quick Test: Basic Hand Types');

    const testHands = [
        { name: 'High Card', cards: 'A♠ K♥ Q♦ J♣ 9♠' },
        { name: 'Pair', cards: 'A♠ A♥ K♦ Q♣ J♠' },
        { name: 'Two Pair', cards: 'A♠ A♥ K♦ K♣ Q♠' },
        { name: 'Three of a Kind', cards: 'A♠ A♥ A♦ K♣ Q♠' },
        { name: 'Straight', cards: 'A♠ K♥ Q♦ J♣ 10♠' },
        { name: 'Flush', cards: 'A♠ K♠ Q♠ J♠ 9♠' },
        { name: 'Full House', cards: 'A♠ A♥ A♦ K♣ K♠' },
        { name: 'Four of a Kind', cards: 'A♠ A♥ A♦ A♣ K♠' },
        { name: 'Straight Flush', cards: 'A♠ K♠ Q♠ J♠ 10♠' }
    ];

    testHands.forEach(testHand => {
        const tester = new TestEvaluateHand();
        const cards = tester.createCards(testHand.cards.split(' '));
        const result = evaluateHand(cards);
        console.log(`${testHand.name}: rank=${result.rank}, name="${result.name}", hand_rank=[${result.hand_rank.join(', ')}]`);
    });
}