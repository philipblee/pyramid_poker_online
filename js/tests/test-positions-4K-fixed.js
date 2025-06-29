// js/tests/test-positions-4k-fixed.js
// Test suite with 4K and 2-card hand fixes

class MockHandDetector {
    determineValidPositions(handType, cardCount) {
        const positions = [];

        // 1-card hands - can contribute to front (3 cards) or middle (5 cards)
        if (cardCount === 1) {
            positions.push('front', 'middle'); // Essential for big hand scenarios
        }

        // 2-card hands (pairs that will get kickers)
        else if (cardCount === 2) {
            if (handType === 'Pair') {
                positions.push('front', 'middle', 'back'); // Will become 3-5 cards with kickers
            }
        }

        // 3-card hands - ONLY FRONT!
        else if (cardCount === 3) {
            if (['High Card', 'Pair', 'Three of a Kind'].includes(handType)) {
                positions.push('front');
            }
            // 3-card hands CANNOT go middle or back (need 5+ cards)
        }

        // 4-card hands (different rules for different hand types)
        else if (cardCount === 4) {
            if (handType === 'Two Pair') {
                positions.push('middle', 'back'); // Two Pair: below straight, middle/back only
            } else if (handType.includes('of a Kind')) {
                positions.push('front', 'middle', 'back'); // 4K: straight or better, all positions
            }
        }

        // 5-card hands
        else if (cardCount === 5) {
            positions.push('middle', 'back');

            // Front: only if straight or better
            if (this.isStraightOrBetter(handType)) {
                positions.push('front');
            }
        }

        // 6-7 card hands (ONLY straight flushes or of-a-kind)
        else if (cardCount >= 6 && cardCount <= 7) {
            if (this.isStraightFlushOrOfAKind(handType)) {
                positions.push('middle', 'back');
            }
            // Invalid 6-7 card hands get no valid positions
        }

        // 8 card hands (ONLY straight flushes or of-a-kind)
        else if (cardCount === 8) {
            if (this.isStraightFlushOrOfAKind(handType)) {
                positions.push('back'); // Only back for 8-card hands
            }
        }

        return positions;
    }

    isStraightOrBetter(handType) {
        return ['Straight', 'Flush', 'Full House', 'Four of a Kind',
                'Straight Flush', 'Five of a Kind',
                '6 of a Kind', '7 of a Kind', '8 of a Kind',
                '6-card Straight Flush', '7-card Straight Flush', '8-card Straight Flush'].includes(handType);
    }

    isStraightFlushOrOfAKind(handType) {
        return handType.includes('Straight Flush') ||
               handType.includes('of a Kind');
    }
}

class ValidPositionsTests {
    constructor() {
        this.handDetector = new MockHandDetector();
        this.testResults = [];
    }

    runAllTests() {
        console.log('🧪 Fixed ValidPositions Test Suite (with 4K and 2-card fixes)\n');

        // Test all scenarios including fixed cases
        this.test1CardHands();
        this.test2CardHands();
        this.test3CardHands();
        this.test4CardHands();
        this.test5CardHands();
        this.test6CardHands();
        this.test7CardHands();
        this.test8CardHands();
        this.testInvalidHands();

        // Summary
        this.printSummary();
    }

    test1CardHands() {
        console.log('🔍 Testing 1-Card Hands:');
        this.runTest('High Card', 1, ['front', 'middle'], '1-card High Card');
    }

    test2CardHands() {
        console.log('\n🔍 Testing 2-Card Hands (Pairs needing kickers):');

        const testCases = [
            { handType: 'Pair', expected: ['front', 'middle', 'back'] },
            { handType: 'High Card', expected: [] }, // Invalid 2-card hand
        ];

        testCases.forEach(testCase => {
            this.runTest(testCase.handType, 2, testCase.expected,
                `2-card ${testCase.handType}`);
        });
    }

    test3CardHands() {
        console.log('\n🔍 Testing 3-Card Hands (FRONT ONLY):');

        const testCases = [
            { handType: 'High Card', expected: ['front'] },
            { handType: 'Pair', expected: ['front'] },
            { handType: 'Three of a Kind', expected: ['front'] },
            { handType: 'Straight', expected: [] }, // Invalid 3-card hand
            { handType: 'Flush', expected: [] }     // Invalid 3-card hand
        ];

        testCases.forEach(testCase => {
            this.runTest(testCase.handType, 3, testCase.expected,
                `3-card ${testCase.handType}`);
        });
    }

    test4CardHands() {
        console.log('\n🔍 Testing 4-Card Hands (4K and Two Pair needing kickers):');

        const testCases = [
            { handType: '4 of a Kind', expected: ['front', 'middle', 'back'] },
            { handType: 'Two Pair', expected: ['middle', 'back'] }, // Two Pair: below straight, no front
            { handType: 'Flush', expected: [] }, // Invalid 4-card hand
            { handType: 'Straight', expected: [] }, // Invalid 4-card hand
        ];

        testCases.forEach(testCase => {
            this.runTest(testCase.handType, 4, testCase.expected,
                `4-card ${testCase.handType}`);
        });
    }

    test5CardHands() {
        console.log('\n🔍 Testing 5-Card Hands:');

        const testCases = [
            // Below Straight - middle and back only
            { handType: 'High Card', expected: ['middle', 'back'] },
            { handType: 'Pair', expected: ['middle', 'back'] },
            { handType: 'Two Pair', expected: ['middle', 'back'] },
            { handType: 'Three of a Kind', expected: ['middle', 'back'] },

            // Straight or better - front, middle, and back
            { handType: 'Straight', expected: ['front', 'middle', 'back'] },
            { handType: 'Flush', expected: ['front', 'middle', 'back'] },
            { handType: 'Full House', expected: ['front', 'middle', 'back'] },
            { handType: 'Four of a Kind', expected: ['front', 'middle', 'back'] },
            { handType: 'Straight Flush', expected: ['front', 'middle', 'back'] },
            { handType: 'Five of a Kind', expected: ['front', 'middle', 'back'] }
        ];

        testCases.forEach(testCase => {
            this.runTest(testCase.handType, 5, testCase.expected,
                `5-card ${testCase.handType}`);
        });
    }

    test6CardHands() {
        console.log('\n🔍 Testing 6-Card Hands:');

        const testCases = [
            { handType: '6 of a Kind', expected: ['middle', 'back'] },
            { handType: '6-card Straight Flush', expected: ['middle', 'back'] },
            { handType: 'Flush', expected: [] },
            { handType: 'Straight', expected: [] }
        ];

        testCases.forEach(testCase => {
            this.runTest(testCase.handType, 6, testCase.expected,
                `6-card ${testCase.handType}`);
        });
    }

    test7CardHands() {
        console.log('\n🔍 Testing 7-Card Hands:');

        const testCases = [
            { handType: '7 of a Kind', expected: ['middle', 'back'] },
            { handType: '7-card Straight Flush', expected: ['middle', 'back'] },
            { handType: 'Flush', expected: [] }
        ];

        testCases.forEach(testCase => {
            this.runTest(testCase.handType, 7, testCase.expected,
                `7-card ${testCase.handType}`);
        });
    }

    test8CardHands() {
        console.log('\n🔍 Testing 8-Card Hands:');

        const testCases = [
            { handType: '8 of a Kind', expected: ['back'] },
            { handType: '8-card Straight Flush', expected: ['back'] },
            { handType: 'Flush', expected: [] }
        ];

        testCases.forEach(testCase => {
            this.runTest(testCase.handType, 8, testCase.expected,
                `8-card ${testCase.handType}`);
        });
    }

    testInvalidHands() {
        console.log('\n🔍 Testing Edge Cases:');
        this.runTest('High Card', 0, [], '0-card hand');
        this.runTest('Some Hand', 9, [], '9-card hand');
    }

    runTest(handType, cardCount, expected, description) {
        const actual = this.handDetector.determineValidPositions(handType, cardCount);
        const passed = this.arraysEqual(actual.sort(), expected.sort());

        const status = passed ? '✅' : '❌';
        const expectedStr = expected.length > 0 ? expected.join(', ') : 'none';
        const actualStr = actual.length > 0 ? actual.join(', ') : 'none';

        console.log(`  ${status} ${description}: Expected [${expectedStr}], Got [${actualStr}]`);

        if (!passed) {
            console.log(`    ⚠️  MISMATCH: Expected ${JSON.stringify(expected)}, Got ${JSON.stringify(actual)}`);
        }

        this.testResults.push({
            description,
            handType,
            cardCount,
            expected,
            actual,
            passed
        });
    }

    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        return a.every((val, index) => val === b[index]);
    }

    printSummary() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;

        console.log('\n📊 Test Summary:');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);

        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(r => !r.passed).forEach(test => {
                console.log(`  - ${test.description}: Expected [${test.expected.join(', ')}], Got [${test.actual.join(', ')}]`);
            });
        } else {
            console.log('\n🎉 All tests passed! 4K and 2-card position logic working correctly.');
        }

        return failedTests === 0;
    }
}

// Run all tests
const tester = new ValidPositionsTests();
tester.runAllTests();

console.log('\n💡 Fixed Critical Bug:');
console.log('• 4-card "Two Pair": Now gets [middle, back] (was getting [])');
console.log('• 4-card "4 of a Kind": Gets [front, middle, back] (straight or better)');
console.log('• Different 4-card hands follow different position rules');
console.log('• All hands now have appropriate valid positions');