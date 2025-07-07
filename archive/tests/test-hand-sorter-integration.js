// js/tests/test-hand-sorter-integration.js v1
// Integration test for HandSorter using existing HandDetector test cases

class HandSorterIntegrationTest {
    constructor() {
        this.sorter = new HandSorter();
        this.results = [];
    }

    /**
     * Test HandSorter with a specific HandDetector test case
     * @param {number} caseId - Test case ID (1-17)
     */
    testCase(caseId) {
        console.log(`\n🧪 ======== TESTING CASE ${caseId} ========`);

        // Run the HandDetector test
        const testResult = runSingleTest(caseId);

        if (!testResult || !testResult.results) {
            console.log(`❌ Failed to run test case ${caseId}`);
            return null;
        }

        console.log(`📋 Test: ${testResult.name}`);
        console.log(`🃏 Cards: ${testResult.cards}`);

        // Sort the detected hands
        const startTime = performance.now();
        const sortResult = this.sorter.sortHandsByStrength(testResult.results.hands);
        const endTime = performance.now();

        // Validate sort order
        const validation = this.sorter.validateSortOrder(sortResult.sortedHands);

        // Display results
        this.displayResults(testResult, sortResult, validation, endTime - startTime);

        // Store for summary
        const result = {
            caseId,
            name: testResult.name,
            detected: testResult.results.total,
            sorted: sortResult.sortedHands.length,
            valid: validation.isValid,
            timing: endTime - startTime,
            strongest: sortResult.metadata.strengthRange.strongest,
            weakest: sortResult.metadata.strengthRange.weakest
        };

        this.results.push(result);
        return result;
    }

    /**
     * Display detailed results for a single test
     */
    displayResults(testResult, sortResult, validation, timing) {
        console.log(`\n📊 RESULTS:`);
        console.log(`   Detected: ${testResult.results.total} hands`);
        console.log(`   Sorted: ${sortResult.sortedHands.length} hands`);
        console.log(`   Time: ${timing.toFixed(2)}ms`);
        console.log(`   Validation: ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}`);

        if (!validation.isValid) {
            console.log(`   Issues: ${validation.issues.length}`);
            validation.issues.slice(0, 3).forEach(issue => {
                console.log(`      - ${issue.message} at index ${issue.index}`);
            });
        }

        console.log(`\n🏆 STRONGEST HANDS (Top 5):`);
        sortResult.sortedHands.slice(0, 5).forEach((hand, i) => {
            const cards = hand.cards.map(c => c.rank + c.suit).join(' ');
            console.log(`   ${i+1}. ${hand.handType} - [${hand.hand_rank.join(', ')}] - ${cards}`);
        });

        console.log(`\n🎯 WEAKEST HANDS (Bottom 3):`);
        const weakest = sortResult.sortedHands.slice(-3);
        weakest.forEach((hand, i) => {
            const cards = hand.cards.map(c => c.rank + c.suit).join(' ');
            const index = sortResult.sortedHands.length - 3 + i;
            console.log(`   ${index + 1}. ${hand.handType} - [${hand.hand_rank.join(', ')}] - ${cards}`);
        });

        console.log(`\n📈 HAND DISTRIBUTION:`);
        const distribution = sortResult.metadata.handTypeDistribution;
        Object.entries(distribution)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .slice(0, 8) // Show top 8
            .forEach(([type, count]) => {
                console.log(`   ${type}: ${count}`);
            });
    }

    /**
     * Test multiple cases
     * @param {Array} caseIds - Array of case IDs to test
     */
    testMultipleCases(caseIds) {
        console.log(`\n🚀 ======== TESTING MULTIPLE CASES ========`);
        console.log(`Cases to test: ${caseIds.join(', ')}`);

        caseIds.forEach(caseId => {
            this.testCase(caseId);
        });

        this.displaySummary();
    }

    /**
     * Test all cases (1-17)
     */
    testAllCases() {
        const allCases = Array.from({length: 17}, (_, i) => i + 1);
        this.testMultipleCases(allCases);
    }

    /**
     * Test a quick set of representative cases
     */
    testQuickSet() {
        const quickCases = [1, 6, 9, 14]; // Four Aces, Multiple 4Ks, Straight Flush, Mixed Suits
        console.log(`\n⚡ ======== QUICK TEST SET ========`);
        this.testMultipleCases(quickCases);
    }

    /**
     * Display summary of all tested cases
     */
    displaySummary() {
        if (this.results.length === 0) {
            console.log(`\n📋 No tests run yet`);
            return;
        }

        console.log(`\n📋 ======== SUMMARY ========`);
        console.log(`Total cases tested: ${this.results.length}`);

        const passed = this.results.filter(r => r.valid).length;
        const avgTime = this.results.reduce((sum, r) => sum + r.timing, 0) / this.results.length;

        console.log(`✅ Validation passed: ${passed}/${this.results.length}`);
        console.log(`⏱️ Average time: ${avgTime.toFixed(2)}ms`);

        console.log(`\n📊 PERFORMANCE BY CASE:`);
        this.results.forEach(result => {
            const status = result.valid ? '✅' : '❌';
            console.log(`   ${status} Case ${result.caseId}: ${result.detected} hands, ${result.timing.toFixed(1)}ms`);
        });

        // Show any failures
        const failures = this.results.filter(r => !r.valid);
        if (failures.length > 0) {
            console.log(`\n❌ FAILED CASES:`);
            failures.forEach(failure => {
                console.log(`   Case ${failure.caseId}: ${failure.name}`);
            });
        } else {
            console.log(`\n🎉 ALL TESTS PASSED! HandSorter working correctly.`);
        }
    }

    /**
     * Compare hand strengths between two specific hands
     * @param {number} caseId - Test case to use
     * @param {number} index1 - First hand index
     * @param {number} index2 - Second hand index
     */
    compareSpecificHands(caseId, index1, index2) {
        const testResult = runSingleTest(caseId);
        if (!testResult) return;

        const sortResult = this.sorter.sortHandsByStrength(testResult.results.hands);
        const hand1 = sortResult.sortedHands[index1];
        const hand2 = sortResult.sortedHands[index2];

        if (!hand1 || !hand2) {
            console.log(`❌ Invalid hand indices`);
            return;
        }

        console.log(`\n🆚 HAND COMPARISON:`);
        console.log(`Hand ${index1 + 1}: ${hand1.handType} - [${hand1.hand_rank.join(', ')}]`);
        console.log(`Hand ${index2 + 1}: ${hand2.handType} - [${hand2.hand_rank.join(', ')}]`);

        const comparison = this.sorter.compareHandRanks(hand1.hand_rank, hand2.hand_rank);
        if (comparison > 0) {
            console.log(`✅ Hand ${index1 + 1} is stronger`);
        } else if (comparison < 0) {
            console.log(`✅ Hand ${index2 + 1} is stronger`);
        } else {
            console.log(`🤝 Hands are equal strength`);
        }
    }

    /**
     * Clear previous results
     */
    reset() {
        this.results = [];
        console.log(`🔄 Test results cleared`);
    }
}

// =============================================================================
// CONVENIENT FUNCTIONS FOR CONSOLE TESTING
// =============================================================================

/**
 * Test a single case - shorthand function
 * @param {number} caseId - Test case ID (1-17)
 */
function testHandSorterCase(caseId) {
    const tester = new HandSorterIntegrationTest();
    return tester.testCase(caseId);
}

/**
 * Test multiple cases - shorthand function
 * @param {Array} caseIds - Array of case IDs
 */
function testHandSorterCases(caseIds) {
    const tester = new HandSorterIntegrationTest();
    return tester.testMultipleCases(caseIds);
}

/**
 * Quick test with representative cases
 */
function quickTestHandSorter() {
    const tester = new HandSorterIntegrationTest();
    return tester.testQuickSet();
}

/**
 * Test all 17 cases
 */
function testAllHandSorterCases() {
    const tester = new HandSorterIntegrationTest();
    return tester.testAllCases();
}

/**
 * Compare two specific hands from a test case
 * @param {number} caseId - Test case ID
 * @param {number} index1 - First hand index
 * @param {number} index2 - Second hand index
 */
function compareHands(caseId, index1, index2) {
    const tester = new HandSorterIntegrationTest();
    return tester.compareSpecificHands(caseId, index1, index2);
}