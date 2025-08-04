// js/tests/comprehensive-test-all-methods.js
// Enhanced: Compare arrangements between methods to ensure same optimal results

function runComprehensiveTests() {
    console.log('\n🧪 ======== COMPREHENSIVE TEST SUITE WITH ARRANGEMENT COMPARISON ========');
    console.log('Testing all wild scenarios × all optimization methods');
    console.log('Total tests: 90 (10 cases × 3 wild scenarios × 3 methods)');
    console.log('NEW: Comparing arrangements between methods for consistency');

    const results = {
        noWild: { points: [], empirical: [], tiered: [] , tiered2: [] },
        oneWild: { points: [], empirical: [], tiered: [] , tiered2: [] },
        twoWild: { points: [], empirical: [], tiered: [] , tiered2: [] },
        summary: { passed: 0, failed: 0, total: 120 },
        comparisons: [] // NEW: Track arrangement comparisons
    };

    // Test ranges
    const testRanges = [
        { name: 'No-Wild', start: 1, end: 10, wildCount: 0 },
        { name: 'One-Wild', start: 1001, end: 1010, wildCount: 1 },
        { name: 'Two-Wild', start: 2001, end: 2010, wildCount: 2 }
    ];

    // Test each range with each method AND compare arrangements
    testRanges.forEach(range => {
        console.log(`\n📋 ======== ${range.name} Tests (Cases ${range.start}-${range.end}) ========`);

        // Test all three methods for each case and compare
        for (let testId = range.start; testId <= range.end; testId++) {
            console.log(`\n🔍 Test Case ${testId}:`);

            const caseResults = {};
            const methods = ['points', 'empirical', 'tiered', 'tiered2'];

            // Run all three methods on same test case
            methods.forEach(method => {
                console.log(`  ${method.padEnd(10)}: `);

                try {
                    const cards = createFromCardsTestCase(testId);
                    const originalMethod = gameConfig.config.winProbabilityMethod;
                    gameConfig.config.winProbabilityMethod = method;

                    const setup = new FindBestSetup();
                    const startTime = performance.now();
                    const result = setup.findBestSetup(cards);
                    const endTime = performance.now();

                    gameConfig.config.winProbabilityMethod = originalMethod;

                    caseResults[method] = {
                        testId,
                        method,
                        wildCount: range.wildCount,
                        success: result.success,
                        score: result.score,
                        time: endTime - startTime,
                        arrangement: result.arrangement,
                        cards: cards
                    };

                    console.log(result.success ? '✅' : '❌', `(${result.score.toFixed(2)}, ${(endTime - startTime).toFixed(0)}ms)`);

                } catch (error) {
                    console.log(`❌ ERROR: ${error.message}`);
                    caseResults[method] = {
                        testId, method, wildCount: range.wildCount,
                        success: false, score: 0, time: 0, error: error.message
                    };
                }
            });

            // Store individual results
            results[toCamelCase(range.name)].points.push(caseResults.points);
            results[toCamelCase(range.name)].empirical.push(caseResults.empirical);
            results[toCamelCase(range.name)].tiered.push(caseResults.tiered);
            results[toCamelCase(range.name)].tiered2.push(caseResults.tiered2);

            // NEW: Compare arrangements between methods
            const comparison = compareArrangements(caseResults, testId);
            results.comparisons.push(comparison);
            displayArrangementComparison(comparison);
        }
    });

    // Calculate summary statistics
    calculateSummaryStats(results);

    // NEW: Display arrangement comparison summary
    displayArrangementSummary(results.comparisons);

    // Display comprehensive results
    displayComprehensiveResults(results);

    return results;
}

function compareArrangements(caseResults, testId) {
    const methods = ['points', 'empirical', 'tiered', 'tiered2'];
    const arrangements = {};
    const scores = {};

    // Extract arrangements and scores
    methods.forEach(method => {
        const result = caseResults[method];
        if (result && result.success && result.arrangement) {
            arrangements[method] = serializeArrangement(result.arrangement);
            scores[method] = result.score;
        } else {
            arrangements[method] = null;
            scores[method] = null;
        }
    });

    // Compare arrangements
    const comparison = {
        testId,
        arrangements,
        scores,
        identical: false,
        scoresSimilar: false,
        differences: []
    };

    // Check if all successful arrangements are identical
    const successfulMethods = methods.filter(m => arrangements[m] !== null);
    if (successfulMethods.length > 1) {
        const firstArrangement = arrangements[successfulMethods[0]];
        comparison.identical = successfulMethods.every(method =>
            arrangements[method] === firstArrangement
        );

        // Check if scores are similar (within 5%)
        const scoreValues = successfulMethods.map(m => scores[m]).filter(s => s !== null);
        if (scoreValues.length > 1) {
            const maxScore = Math.max(...scoreValues);
            const minScore = Math.min(...scoreValues);
            const scoreDiff = ((maxScore - minScore) / maxScore) * 100;
            comparison.scoresSimilar = scoreDiff < 5; // Within 5%
            comparison.scoreDifference = scoreDiff.toFixed(2) + '%';
        }

        // Find specific differences
        if (!comparison.identical) {
            methods.forEach(method1 => {
                methods.forEach(method2 => {
                    if (method1 < method2 && arrangements[method1] && arrangements[method2]) {
                        if (arrangements[method1] !== arrangements[method2]) {
                            comparison.differences.push({
                                methods: `${method1} vs ${method2}`,
                                score1: scores[method1],
                                score2: scores[method2],
                                arrangement1: arrangements[method1],
                                arrangement2: arrangements[method2]
                            });
                        }
                    }
                });
            });
        }
    }

    return comparison;
}

function serializeArrangement(arrangement) {
    if (!arrangement) return null;

    const serialize = (hand) => {
        if (!hand || !hand.cards) return 'empty';
        return hand.cards
            .map(card => `${card.rank}${card.suit}`)
            .sort()
            .join(',');
    };

    return {
        back: serialize(arrangement.back),
        middle: serialize(arrangement.middle),
        front: serialize(arrangement.front)
    };
}

function displayArrangementComparison(comparison) {
    if (comparison.identical) {
        console.log(`    🎯 Arrangements: IDENTICAL (all methods found same optimal solution)`);
        if (comparison.scoresSimilar) {
            console.log(`    📊 Scores: Similar (within ${comparison.scoreDifference})`);
        }
    } else if (comparison.differences.length > 0) {
        console.log(`    ⚠️  Arrangements: DIFFERENT between methods!`);
        comparison.differences.forEach(diff => {
            console.log(`      ${diff.methods}: Score ${diff.score1.toFixed(2)} vs ${diff.score2.toFixed(2)}`);
        });
    }
}

function displayArrangementSummary(comparisons) {
    console.log('\n🔍 ======== ARRANGEMENT COMPARISON SUMMARY ========');

    const identicalCount = comparisons.filter(c => c.identical).length;
    const differentCount = comparisons.filter(c => !c.identical && c.differences.length > 0).length;
    const totalComparisons = comparisons.length;

    console.log(`📊 Arrangement Consistency:`);
    console.log(`   Identical arrangements: ${identicalCount}/${totalComparisons} (${(identicalCount/totalComparisons*100).toFixed(1)}%)`);
    console.log(`   Different arrangements: ${differentCount}/${totalComparisons} (${(differentCount/totalComparisons*100).toFixed(1)}%)`);

    if (differentCount > 0) {
        console.log(`\n⚠️  ARRANGEMENT DIFFERENCES FOUND:`);
        const differences = comparisons.filter(c => c.differences.length > 0);
        differences.forEach(comp => {
            console.log(`   Test ${comp.testId}:`);
            comp.differences.forEach(diff => {
                console.log(`     ${diff.methods}: ${diff.score1.toFixed(2)} vs ${diff.score2.toFixed(2)} points`);

                // Show arrangement details if significantly different
                const scoreDiff = Math.abs(diff.score1 - diff.score2);
                if (scoreDiff > 1) {
                    console.log(`       Back:   ${diff.arrangement1.back} vs ${diff.arrangement2.back}`);
                    console.log(`       Middle: ${diff.arrangement1.middle} vs ${diff.arrangement2.middle}`);
                    console.log(`       Front:  ${diff.arrangement1.front} vs ${diff.arrangement2.front}`);
                }
            });
        });

        console.log(`\n💡 Analysis: Different arrangements may indicate:`);
        console.log(`   • Multiple equally-good solutions exist`);
        console.log(`   • Different scoring methods prefer different arrangements`);
        console.log(`   • Potential optimization differences between methods`);
    } else {
        console.log(`\n✅ PERFECT CONSISTENCY: All methods found identical optimal arrangements!`);
    }
}

function calculateSummaryStats(results) {
    let totalPassed = 0;
    let totalFailed = 0;

    // Count results across all scenarios and methods
    Object.values(results).forEach(scenario => {
        if (typeof scenario === 'object' && scenario.points) {
            [scenario.points, scenario.empirical, scenario.tiered, scenario.tiered2].forEach(methodResults => {
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
    const methods = ['points', 'empirical', 'tiered', 'tiered2'];

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

// Quick comparison functions
function quickCompareArrangements(testId) {
    console.log(`\n🔍 Quick Arrangement Comparison for Test ${testId}:`);

    const methods = ['points', 'empirical', 'tiered', 'tiered2'];
    const results = {};

    methods.forEach(method => {
        const cards = createFromCardsTestCase(testId);
        gameConfig.config.winProbabilityMethod = method;
        const setup = new FindBestSetup();
        const result = setup.findBestSetup(cards);

        results[method] = {
            success: result.success,
            score: result.score,
            arrangement: serializeArrangement(result.arrangement)
        };

        console.log(`${method.padEnd(10)}: ${result.success ? '✅' : '❌'} Score: ${result.score.toFixed(2)}`);
    });

    // Compare arrangements
    const pointsArr = results.points.arrangement;
    const empiricalArr = results.empirical.arrangement;
    const tieredArr = results.tiered.arrangement;
    const tiered2Arr = results.tiered2.arrangement;

    const allSame = JSON.stringify(pointsArr) === JSON.stringify(empiricalArr) &&
                    JSON.stringify(empiricalArr) === JSON.stringify(tieredArr);

    console.log(`\nArrangement Consistency: ${allSame ? '✅ IDENTICAL' : '⚠️ DIFFERENT'}`);

    if (!allSame) {
        console.log('Back hands:', {
            points: pointsArr?.back,
            empirical: empiricalArr?.back,
            tiered: tieredArr?.back,
            tiered2: tiered2Arr?.back
        });
        console.log('Middle hands:', {
            points: pointsArr?.middle,
            empirical: empiricalArr?.middle,
            tiered: tieredArr?.middle,
            tiered2: tiered2Arr?.middle
        });
        console.log('Front hands:', {
            points: pointsArr?.front,
            empirical: empiricalArr?.front,
            tiered: tieredArr?.front,
            tiered2: tiered2Arr?.front
        });
    }

    return results;
}

// Export main function
function testAllMethodsSystematically() {
    return runComprehensiveTests();
}