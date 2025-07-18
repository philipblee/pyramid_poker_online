// js/tests/batch.js
// Universal test batch runner - works with any test class
// Examples
// Batch.testNoWild(TestHandDetector, 'confirmHandCounts');   // Cases 1-100
// Batch.testOneWild(TestFindBestSetup, 'validateSetup');     // Cases 1001-1100
// Batch.testRange(TestHandDetector, 'confirmHandCounts', 1, 10); // Cases 1-10

class Batch {

    /**
     * Run a test method on multiple test cases
     * @param {Class} TestClass - Test class to instantiate
     * @param {string} methodName - Method to call on each test case
     * @param {Array} testCases - Array of test cases to run
     * @param {Object} options - Optional configuration
     * @returns {Array} - Array of test results
     */
    static test(TestClass, methodName, testCases, options = {}) {
        const className = TestClass.name;
        const totalCases = testCases.length;

        console.log(`🧪 ======== BATCH: ${className}.${methodName}() ========`);
        console.log(`📊 Running ${totalCases} test cases...`);

        // Create instance of the test class
        const instance = new TestClass();

        // Verify the method exists
        if (typeof instance[methodName] !== 'function') {
            throw new Error(`Method '${methodName}' not found on class '${className}'`);
        }

        const results = [];
        const startTime = performance.now();

        // Run each test case
        testCases.forEach((testCase, index) => {
            if (options.showProgress) {
                console.log(`\n[${index + 1}/${totalCases}] Testing case ${testCase.id}...`);
            }

            try {
                const result = instance[methodName](testCase);
                results.push(result);
            } catch (error) {
                console.log(`❌ Error in case ${testCase.id}: ${error.message}`);
                results.push({
                    id: testCase.id,
                    error: error.message,
                    passed: false
                });
            }
        });

        const endTime = performance.now();

        // Display batch summary
        this.displayBatchSummary(results, endTime - startTime, className, methodName);

        return results;
    }

    /**
     * Display summary of batch test results
     * @param {Array} results - Test results
     * @param {number} totalTime - Total execution time in ms
     * @param {string} className - Name of test class
     * @param {string} methodName - Name of test method
     */
    static displayBatchSummary(results, totalTime, className, methodName) {
        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed).length;
        const total = results.length;

        console.log(`\n📋 ======== BATCH SUMMARY ========`);
        console.log(`🎯 ${className}.${methodName}()`);
        console.log(`✅ Passed: ${passed}/${total}`);
        console.log(`❌ Failed: ${failed}/${total}`);
        console.log(`⏱️ Total Time: ${totalTime.toFixed(2)}ms`);
        console.log(`⚡ Average: ${(totalTime / total).toFixed(2)}ms per test`);

        // Show failed tests
        if (failed > 0) {
            console.log(`\n❌ FAILED TESTS:`);
            results.filter(r => !r.passed).forEach(test => {
                const reason = test.error || 'Verification failed';
                console.log(`   ${test.id}: ${reason}`);
            });
        }

        const status = failed === 0 ? 'ALL TESTS PASSED!' : `${failed} TESTS FAILED`;
        console.log(`\n🏆 Overall: ${status}`);
        console.log(`=====================================`);
    }

    /**
     * Quick helpers for common test scenarios
     */

    // Test all no-wild cases (1-100)
    static testNoWild(TestClass, methodName, options = {}) {
        const noWildCases = getTestCasesByWildCount(0);
        return this.test(TestClass, methodName, noWildCases, options);
    }

    // Test all one-wild cases (1001-1100)
    static testOneWild(TestClass, methodName, options = {}) {
        const oneWildCases = getTestCasesByWildCount(1);
        return this.test(TestClass, methodName, oneWildCases, options);
    }

    // Test all two-wild cases (2001-2100)
    static testTwoWild(TestClass, methodName, options = {}) {
        const twoWildCases = getTestCasesByWildCount(2);
        return this.test(TestClass, methodName, twoWildCases, options);
    }

    // Test specific range of case IDs
    static testRange(TestClass, methodName, startId, endId, options = {}) {
        const rangeCases = TEST_CASES.filter(c => c.id >= startId && c.id <= endId);
        return this.test(TestClass, methodName, rangeCases, options);
    }

    // Add to Batch class
    static playHandStats(handCount = 100, options = {}) {
        console.log(`🎲 ======== BATCH HAND STATS: ${handCount} HANDS ========`);

        const allResults = [];
        const startTime = performance.now();

        for (let i = 0; i < handCount; i++) {
            if (options.showProgress && i % 10 === 0) {
                console.log(`[${i + 1}/${handCount}] Generating hands...`);
            }

            const stats = new PlayHandStats();
            const handResult = stats.playHandStats();
            allResults.push(handResult);
        }

        const endTime = performance.now();

        // Use existing displayBatchSummary pattern + export
//        this.processHandStats(allResults, endTime - startTime, handCount, options);

        return allResults;
    }

    static downloadResults(results, filename = 'hand-stats.json') {
        const jsonData = JSON.stringify(results, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);

        console.log(`📁 Downloaded ${filename} (${(jsonData.length / 1024).toFixed(1)} KB)`);
    }

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Batch;
}