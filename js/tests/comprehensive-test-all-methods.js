// js/tests/comprehensive-test-all-methods.js
// Systematic testing: 10 cases each for no/one/two wild × 3 methods = 90 total tests

function runComprehensiveTests() {
    console.log('\n🧪 ======== COMPREHENSIVE TEST SUITE ========');
    console.log('Testing all wild scenarios × all optimization methods');
    console.log('Total tests: 90 (10 cases × 3 wild scenarios × 3 methods)');

    const results = {
        noWild: { points: [], empirical: [], tiered: [] },
        oneWild: { points: [], empirical: [], tiered: [] },
        twoWild: { points: [], empirical: [], tiered: [] },
        summary: { passed: 0, failed: 0, total: 90 }
    };

    // Test ranges
    const testRanges = [
        { name: 'No-Wild', start: 1, end: 10, wildCount: 0 },
        { name: 'One-Wild', start: 1001, end: 1010, wildCount: 1 },
        { name: 'Two-Wild', start: 2001, end: 2010, wildCount: 2 }
    ];

    // Test each range with each method
    testRanges.forEach(range => {
        console.log(`\n📋 ======== ${range.name} Tests (Cases ${range.start}-${range.end}) ========`);

        // Test Points method
        console.log(`\n🎯 Testing ${range.name} + Points...`);
        const pointsResults = testWildScenarioWithMethod(range, 'points');
        results[toCamelCase(range.name)].points = pointsResults;

        // Test Empirical method
        console.log(`\n📊 Testing ${range.name} + Empirical...`);
        const empiricalResults = testWildScenarioWithMethod(range, 'empirical');
        results[toCamelCase(range.name)].empirical = empiricalResults;

        // Test Tiered method
        console.log(`\n📈 Testing ${range.name} + Tiered...`);
        const tieredResults = testWildScenarioWithMethod(range, 'tiered');
        results[toCamelCase(range.name)].tiered = tieredResults;
    });

    // Calculate summary statistics
    calculateSummaryStats(results);

    // Display comprehensive results
    displayComprehensiveResults(results);

    return results;
}

function testWildScenarioWithMethod(range, method) {
    const results = [];

    for (let testId = range.start; testId <= range.end; testId++) {
        console.log(`  Test ${testId}: `, { endLine: false });

        try {
            // Create cards for test case
            const cards = createFromCardsTestCase(testId);

            // Set optimization method via GameConfig
            const originalMethod = gameConfig.config.winProbabilityMethod;
            gameConfig.config.winProbabilityMethod = method;

            // Create FindBestSetup instance
            const setup = new FindBestSetup();

            // Run test
            const startTime = performance.now();
            const result = setup.findBestSetup(cards);
            const endTime = performance.now();

            // Restore original method
            gameConfig.config.winProbabilityMethod = originalMethod;

            // Record result
            const testResult = {
                testId,
                method,
                wildCount: range.wildCount,
                success: result.success,
                score: result.score,
                time: endTime - startTime,
                arrangement: result.arrangement ? 'Valid' : 'None'
            };

            results.push(testResult);

            // Quick status
            console.log(result.success ? '✅' : '❌', `(${result.score.toFixed(2)}, ${(endTime - startTime).toFixed(0)}ms)`);

        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
            results.push({
                testId,
                method,
                wildCount: range.wildCount,
                success: false,
                score: 0,
                time: 0,
                error: error.message
            });
        }
    }

    return results;
}

function calculateSummaryStats(results) {
    let totalPassed = 0;
    let totalFailed = 0;

    // Count results across all scenarios and methods
    Object.values(results).forEach(scenario => {
        if (typeof scenario === 'object' && scenario.points) {
            [scenario.points, scenario.empirical, scenario.tiered].forEach(methodResults => {
                methodResults.forEach(result => {
                    if (result.success) totalPassed++;
                    else totalFailed++;
                });
            });
        }
    });

    results.summary = {
        passed: totalPassed,
        failed: totalFailed,
        total: totalPassed + totalFailed,
        successRate: (totalPassed / (totalPassed + totalFailed) * 100).toFixed(1) + '%'
    };
}

function displayComprehensiveResults(results) {
    console.log('\n📊 ======== COMPREHENSIVE TEST RESULTS ========');

    // Overall summary
    console.log(`🎯 Overall Results: ${results.summary.passed}/${results.summary.total} passed (${results.summary.successRate})`);

    // Results by scenario and method
    const scenarios = ['noWild', 'oneWild', 'twoWild'];
    const methods = ['points', 'empirical', 'tiered'];

    scenarios.forEach(scenario => {
        const scenarioName = scenario.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
        console.log(`\n📋 ${scenarioName.toUpperCase()} RESULTS:`);

        methods.forEach(method => {
            const methodResults = results[scenario][method];
            const passed = methodResults.filter(r => r.success).length;
            const total = methodResults.length;
            const avgScore = methodResults.filter(r => r.success).reduce((sum, r) => sum + r.score, 0) / passed || 0;
            const avgTime = methodResults.reduce((sum, r) => sum + r.time, 0) / total;

            console.log(`  ${method.padEnd(10)}: ${passed}/${total} passed, avg score: ${avgScore.toFixed(2)}, avg time: ${avgTime.toFixed(0)}ms`);
        });
    });

    // Flag any failures
    const failures = [];
    scenarios.forEach(scenario => {
        methods.forEach(method => {
            const failed = results[scenario][method].filter(r => !r.success);
            if (failed.length > 0) {
                failures.push({ scenario, method, count: failed.length, cases: failed.map(f => f.testId) });
            }
        });
    });

    if (failures.length > 0) {
        console.log('\n❌ FAILURE DETAILS:');
        failures.forEach(failure => {
            console.log(`  ${failure.scenario} + ${failure.method}: ${failure.count} failures (cases: ${failure.cases.join(', ')})`);
        });
    } else {
        console.log('\n🎉 ALL TESTS PASSED! System is robust across all scenarios and methods.');
    }
}

function toCamelCase(str) {
    return str.replace(/-(\w)/g, (match, letter) => letter.toUpperCase()).replace(/^(.)/, match => match.toLowerCase());
}

// Quick test runner functions
function quickTestNoWild() {
    return testWildScenarioWithMethod({ name: 'No-Wild', start: 1, end: 10, wildCount: 0 }, 'tiered');
}

function quickTestOneWild() {
    return testWildScenarioWithMethod({ name: 'One-Wild', start: 1001, end: 1010, wildCount: 1 }, 'tiered');
}

function quickTestTwoWild() {
    return testWildScenarioWithMethod({ name: 'Two-Wild', start: 2001, end: 2010, wildCount: 2 }, 'tiered');
}

// Export main function
function testAllMethodsSystematically() {
    return runComprehensiveTests();
}