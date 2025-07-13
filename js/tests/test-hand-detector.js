// js/tests/test-hand-detector.js v1
// Streamlined hand detector testing - uses Analysis utilities

class TestHandDetector {
    constructor() {
        this.testResults = [];
    }

    /**
     * Confirm HandDetector found the correct number of each hand type
     */
    confirmHandCounts(testCase) {
        console.log(`\n🧪 TEST ${testCase.id}: ${testCase.name}`);
        console.log(`Cards: ${testCase.cards}`);

        try {
            // Get expected counts using CountValidHands
            const counter = new CountValidHands();
            const expected = counter.calculateExpectedCounts(testCase.cards);

            // Parse cards using Analysis utility
            const testCards = Analysis.parseCardString(testCase.cards);

            // Run HandDetector
            const startTime = performance.now();
            const detector = new HandDetector(testCards);
            const results = detector.detectAllHands();
            const endTime = performance.now();

            // Verify actual vs expected
            const verification = this.verifyExpectations(results, expected);

            const testResult = {
                id: testCase.id,
                name: testCase.name,
                timing: endTime - startTime,
                results: results,
                expected: expected,
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
     * Verify HandDetector results match expected counts
     */
    verifyExpectations(results, expected) {
        const verification = {
            checks: [],
            allPassed: true
        };

        // Map expected categories to HandDetector hand types
        const handTypeMap = {
            'fourOfAKind': 'Four of a Kind',
            'fiveOfAKind': '5 of a Kind',
            'sixOfAKind': '6 of a Kind',
            'sevenOfAKind': '7 of a Kind',
            'eightOfAKind': '8 of a Kind',
            'threeOfAKind': 'Three of a Kind',
            'pair': 'Pair',
            'twoPair': 'Two Pair',
            'fullHouse': 'Full House',
            'flush': 'Flush',
            'straight': 'Straight',
            'straightFlush': 'Straight Flush',
            'sixCardStraightFlush': '6-card Straight Flush',
            'sevenCardStraightFlush': '7-card Straight Flush',
            'eightCardStraightFlush': '8-card Straight Flush',
            'highCard': 'High Card'
        };

        Object.entries(expected).forEach(([category, expectedCount]) => {
            let actualCount;

            if (category === 'total') {
                actualCount = results.total || 0;
            } else {
                const handTypeName = handTypeMap[category];
                if (handTypeName) {
                    actualCount = results.hands ?
                        results.hands.filter(h => h.handType === handTypeName).length : 0;
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
     * Display test result summary
     */
    displayTestResult(testResult) {
        console.log(`⏱️ Time: ${testResult.timing.toFixed(2)}ms`);
        console.log(`📊 Total hands: ${testResult.results.total}`);

        // Show verification results
        testResult.verification.checks.forEach(check => {
            const status = check.passed ? '✅' : '❌';
            console.log(`${status} ${check.category}: ${check.actual} (expected: ${check.expected})`);
        });

        console.log(`🎯 RESULT: ${testResult.passed ? 'PASSED' : 'FAILED'}`);
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