// js/tests/test-runner-one-wild.js
// Test runner for one wild card brute force optimizer
// Runs optimizer on test cases and collects results

// Global variable to store all test results with enhanced performance tracking
let oneWildTestResults = [];
let performanceMetrics = {
    totalTests: 0,
    successfulTests: 0,
    failedTests: 0,
    totalSearchTime: 0,
    totalNodesExplored: 0,
    averageSearchTime: 0,
    averageNodesPerTest: 0,
    searchTimeDistribution: [],
    nodeDistribution: [],
    scoreDistribution: [],
    testStartTime: null,
    testEndTime: null
};

/**
 * Reset performance metrics
 */
function resetPerformanceMetrics() {
    performanceMetrics = {
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        totalSearchTime: 0,
        totalNodesExplored: 0,
        averageSearchTime: 0,
        averageNodesPerTest: 0,
        searchTimeDistribution: [],
        nodeDistribution: [],
        scoreDistribution: [],
        testStartTime: performance.now(),
        testEndTime: null
    };
}

/**
 * Collect performance metrics from a test result
 * @param {Object} testResult - Individual test result
 */
function collectPerformanceMetrics(testResult) {
    if (!testResult.success) {
        performanceMetrics.failedTests++;
        return;
    }

    performanceMetrics.successfulTests++;
    performanceMetrics.totalSearchTime += testResult.timing.totalTime;

    // Collect nodes explored across all substitutions
    const totalNodes = testResult.result.allResults.reduce((sum, substitutionResult) => {
        return sum + (substitutionResult.statistics.exploredNodes || 0);
    }, 0);

    performanceMetrics.totalNodesExplored += totalNodes;

    // Track distributions
    performanceMetrics.searchTimeDistribution.push({
        caseId: testResult.caseId,
        time: testResult.timing.totalTime,
        avgPerSubstitution: testResult.timing.avgTimePerSubstitution
    });

    performanceMetrics.nodeDistribution.push({
        caseId: testResult.caseId,
        totalNodes: totalNodes,
        avgNodesPerSubstitution: totalNodes / 52
    });

    performanceMetrics.scoreDistribution.push({
        caseId: testResult.caseId,
        topScore: testResult.result.summary.scoreRange.highest,
        scoreRange: testResult.result.summary.scoreRange,
        successRate: testResult.result.summary.successRate
    });
}

/**
 * Finalize performance metrics calculation
 */
function finalizePerformanceMetrics() {
    performanceMetrics.testEndTime = performance.now();
    performanceMetrics.totalTests = performanceMetrics.successfulTests + performanceMetrics.failedTests;

    if (performanceMetrics.successfulTests > 0) {
        performanceMetrics.averageSearchTime = performanceMetrics.totalSearchTime / performanceMetrics.successfulTests;
        performanceMetrics.averageNodesPerTest = performanceMetrics.totalNodesExplored / performanceMetrics.successfulTests;
    }
}

/**
 * Display comprehensive performance analysis
 */
function showPerformanceAnalysis() {
    if (performanceMetrics.totalTests === 0) {
        console.log("❌ No performance data available. Run tests first.");
        return;
    }

    console.log(`\n📊 ======== PERFORMANCE ANALYSIS ========`);

    // Overall metrics
    console.log(`\n🎯 Overall Performance:`);
    console.log(`   Tests completed: ${performanceMetrics.totalTests}`);
    console.log(`   Success rate: ${performanceMetrics.successfulTests}/${performanceMetrics.totalTests} (${(performanceMetrics.successfulTests / performanceMetrics.totalTests * 100).toFixed(1)}%)`);
    console.log(`   Total runtime: ${((performanceMetrics.testEndTime - performanceMetrics.testStartTime) / 1000).toFixed(1)}s`);

    if (performanceMetrics.successfulTests === 0) return;

    // Search time analysis
    console.log(`\n⏱️  Search Time Analysis:`);
    console.log(`   Total search time: ${(performanceMetrics.totalSearchTime / 1000).toFixed(1)}s`);
    console.log(`   Average per test: ${performanceMetrics.averageSearchTime.toFixed(1)}ms`);
    console.log(`   Average per substitution: ${(performanceMetrics.averageSearchTime / 52).toFixed(2)}ms`);

    const times = performanceMetrics.searchTimeDistribution.map(d => d.time);
    console.log(`   Fastest test: ${Math.min(...times).toFixed(1)}ms (Case ${performanceMetrics.searchTimeDistribution.find(d => d.time === Math.min(...times)).caseId})`);
    console.log(`   Slowest test: ${Math.max(...times).toFixed(1)}ms (Case ${performanceMetrics.searchTimeDistribution.find(d => d.time === Math.max(...times)).caseId})`);

    // Node exploration analysis
    console.log(`\n🔍 Node Exploration Analysis:`);
    console.log(`   Total nodes explored: ${performanceMetrics.totalNodesExplored.toLocaleString()}`);
    console.log(`   Average nodes per test: ${Math.round(performanceMetrics.averageNodesPerTest).toLocaleString()}`);
    console.log(`   Average nodes per substitution: ${Math.round(performanceMetrics.averageNodesPerTest / 52).toLocaleString()}`);

    const nodes = performanceMetrics.nodeDistribution.map(d => d.totalNodes);
    console.log(`   Most complex test: ${Math.max(...nodes).toLocaleString()} nodes (Case ${performanceMetrics.nodeDistribution.find(d => d.totalNodes === Math.max(...nodes)).caseId})`);
    console.log(`   Simplest test: ${Math.min(...nodes).toLocaleString()} nodes (Case ${performanceMetrics.nodeDistribution.find(d => d.totalNodes === Math.min(...nodes)).caseId})`);

    // Score analysis
    console.log(`\n🏆 Score Analysis:`);
    const topScores = performanceMetrics.scoreDistribution.map(d => d.topScore);
    const avgScore = topScores.reduce((a, b) => a + b, 0) / topScores.length;
    console.log(`   Highest score achieved: ${Math.max(...topScores)} (Case ${performanceMetrics.scoreDistribution.find(d => d.topScore === Math.max(...topScores)).caseId})`);
    console.log(`   Lowest score achieved: ${Math.min(...topScores)} (Case ${performanceMetrics.scoreDistribution.find(d => d.topScore === Math.min(...topScores)).caseId})`);
    console.log(`   Average top score: ${avgScore.toFixed(1)}`);

    // Efficiency metrics
    console.log(`\n⚡ Efficiency Metrics:`);
    const avgSuccessRate = performanceMetrics.scoreDistribution.reduce((sum, d) => sum + d.successRate, 0) / performanceMetrics.scoreDistribution.length;
    console.log(`   Average substitution success rate: ${avgSuccessRate.toFixed(1)}%`);
    console.log(`   Nodes per millisecond: ${(performanceMetrics.totalNodesExplored / performanceMetrics.totalSearchTime).toFixed(0)}`);
    console.log(`   Tests per second: ${(performanceMetrics.successfulTests * 1000 / performanceMetrics.totalSearchTime).toFixed(2)}`);
}

/**
 * Show top/bottom performers for specific metrics
 * @param {string} metric - 'time', 'nodes', 'score'
 * @param {number} count - Number of top/bottom to show
 */
function showPerformanceRanking(metric = 'time', count = 5) {
    if (performanceMetrics.totalTests === 0) {
        console.log("❌ No performance data available.");
        return;
    }

    console.log(`\n🏅 ======== TOP/BOTTOM ${count} BY ${metric.toUpperCase()} ========`);

    let data, getValue, label;

    switch (metric) {
        case 'time':
            data = performanceMetrics.searchTimeDistribution;
            getValue = d => d.time;
            label = 'ms';
            break;
        case 'nodes':
            data = performanceMetrics.nodeDistribution;
            getValue = d => d.totalNodes;
            label = 'nodes';
            break;
        case 'score':
            data = performanceMetrics.scoreDistribution;
            getValue = d => d.topScore;
            label = 'pts';
            break;
        default:
            console.log("❌ Invalid metric. Use 'time', 'nodes', or 'score'");
            return;
    }

    const sorted = [...data].sort((a, b) => getValue(b) - getValue(a));

    console.log(`\n🏆 TOP ${count} (${metric}):`);
    sorted.slice(0, count).forEach((item, index) => {
        console.log(`   ${index + 1}. Case ${item.caseId}: ${getValue(item).toLocaleString()} ${label}`);
    });

    console.log(`\n📉 BOTTOM ${count} (${metric}):`);
    sorted.slice(-count).reverse().forEach((item, index) => {
        console.log(`   ${count - index}. Case ${item.caseId}: ${getValue(item).toLocaleString()} ${label}`);
    });
}

/**
 * Generate comprehensive summary report
 * @param {boolean} includeDetailedBreakdown - Include detailed per-case analysis
 * @returns {Object} Complete summary report object
 */
function generateSummaryReport(includeDetailedBreakdown = true) {
    if (performanceMetrics.totalTests === 0) {
        console.log("❌ No test data available for summary report.");
        return null;
    }

    const report = {
        metadata: {
            reportGeneratedAt: new Date().toISOString(),
            totalTestCases: performanceMetrics.totalTests,
            successfulTests: performanceMetrics.successfulTests,
            failedTests: performanceMetrics.failedTests,
            testSuiteRuntime: (performanceMetrics.testEndTime - performanceMetrics.testStartTime) / 1000
        },

        performance: {
            searchTime: {
                total: performanceMetrics.totalSearchTime,
                average: performanceMetrics.averageSearchTime,
                perSubstitution: performanceMetrics.averageSearchTime / 52,
                fastest: Math.min(...performanceMetrics.searchTimeDistribution.map(d => d.time)),
                slowest: Math.max(...performanceMetrics.searchTimeDistribution.map(d => d.time))
            },

            nodeExploration: {
                total: performanceMetrics.totalNodesExplored,
                averagePerTest: performanceMetrics.averageNodesPerTest,
                averagePerSubstitution: performanceMetrics.averageNodesPerTest / 52,
                mostComplex: Math.max(...performanceMetrics.nodeDistribution.map(d => d.totalNodes)),
                leastComplex: Math.min(...performanceMetrics.nodeDistribution.map(d => d.totalNodes))
            },

            efficiency: {
                nodesPerMillisecond: performanceMetrics.totalNodesExplored / performanceMetrics.totalSearchTime,
                testsPerSecond: (performanceMetrics.successfulTests * 1000) / performanceMetrics.totalSearchTime,
                avgSuccessRate: performanceMetrics.scoreDistribution.reduce((sum, d) => sum + d.successRate, 0) / performanceMetrics.scoreDistribution.length
            }
        },

        scoring: {
            topScores: performanceMetrics.scoreDistribution.map(d => ({ caseId: d.caseId, score: d.topScore })).sort((a, b) => b.score - a.score),
            averageTopScore: performanceMetrics.scoreDistribution.reduce((sum, d) => sum + d.topScore, 0) / performanceMetrics.scoreDistribution.length,
            scoreRange: {
                highest: Math.max(...performanceMetrics.scoreDistribution.map(d => d.topScore)),
                lowest: Math.min(...performanceMetrics.scoreDistribution.map(d => d.topScore))
            },
            scoreDistribution: performanceMetrics.scoreDistribution.reduce((acc, d) => {
                acc[d.topScore] = (acc[d.topScore] || 0) + 1;
                return acc;
            }, {})
        },

        trends: {
            performanceByComplexity: performanceMetrics.nodeDistribution.map(d => ({
                caseId: d.caseId,
                complexity: d.totalNodes,
                searchTime: performanceMetrics.searchTimeDistribution.find(t => t.caseId === d.caseId).time,
                topScore: performanceMetrics.scoreDistribution.find(s => s.caseId === d.caseId).topScore
            })).sort((a, b) => a.complexity - b.complexity),

            correlations: {
                complexityVsTime: calculateCorrelation(
                    performanceMetrics.nodeDistribution.map(d => d.totalNodes),
                    performanceMetrics.searchTimeDistribution.map(d => d.time)
                ),
                complexityVsScore: calculateCorrelation(
                    performanceMetrics.nodeDistribution.map(d => d.totalNodes),
                    performanceMetrics.scoreDistribution.map(d => d.topScore)
                ),
                timeVsScore: calculateCorrelation(
                    performanceMetrics.searchTimeDistribution.map(d => d.time),
                    performanceMetrics.scoreDistribution.map(d => d.topScore)
                )
            }
        }
    };

    // Add detailed breakdown if requested
    if (includeDetailedBreakdown) {
        report.detailedResults = oneWildTestResults.map(result => ({
            caseId: result.caseId,
            caseName: result.caseName,
            success: result.success,
            error: result.error,
            timing: result.timing,
            topArrangement: result.success ? {
                substitution: result.result.topArrangements.topResults[0]?.substitution,
                score: result.result.topArrangements.topResults[0]?.handDetails.totalScore,
                hands: {
                    back: result.result.topArrangements.topResults[0]?.handDetails.back,
                    middle: result.result.topArrangements.topResults[0]?.handDetails.middle,
                    front: result.result.topArrangements.topResults[0]?.handDetails.front
                }
            } : null
        }));
    }

    return report;
}

/**
 * Calculate correlation coefficient between two arrays
 * @param {Array} x - First dataset
 * @param {Array} y - Second dataset
 * @returns {number} Correlation coefficient (-1 to 1)
 */
function calculateCorrelation(x, y) {
    if (x.length !== y.length) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Display formatted summary report
 * @param {boolean} includeDetailedBreakdown - Include per-case details
 */
function showSummaryReport(includeDetailedBreakdown = false) {
    const report = generateSummaryReport(includeDetailedBreakdown);
    if (!report) return;

    console.log(`\n📋 ======== COMPREHENSIVE SUMMARY REPORT ========`);
    console.log(`📅 Generated: ${new Date(report.metadata.reportGeneratedAt).toLocaleString()}`);

    // Test Overview
    console.log(`\n🎯 Test Overview:`);
    console.log(`   Total tests: ${report.metadata.totalTestCases}`);
    console.log(`   Successful: ${report.metadata.successfulTests} (${(report.metadata.successfulTests/report.metadata.totalTestCases*100).toFixed(1)}%)`);
    console.log(`   Failed: ${report.metadata.failedTests}`);
    console.log(`   Suite runtime: ${report.metadata.testSuiteRuntime.toFixed(1)}s`);

    // Performance Summary
    console.log(`\n⚡ Performance Summary:`);
    console.log(`   Total search time: ${(report.performance.searchTime.total/1000).toFixed(1)}s`);
    console.log(`   Average per test: ${report.performance.searchTime.average.toFixed(1)}ms`);
    console.log(`   Average per substitution: ${report.performance.searchTime.perSubstitution.toFixed(2)}ms`);
    console.log(`   Performance range: ${report.performance.searchTime.fastest.toFixed(1)}ms - ${report.performance.searchTime.slowest.toFixed(1)}ms`);

    // Node Exploration
    console.log(`\n🔍 Search Complexity:`);
    console.log(`   Total nodes explored: ${report.performance.nodeExploration.total.toLocaleString()}`);
    console.log(`   Average per test: ${Math.round(report.performance.nodeExploration.averagePerTest).toLocaleString()}`);
    console.log(`   Complexity range: ${report.performance.nodeExploration.leastComplex.toLocaleString()} - ${report.performance.nodeExploration.mostComplex.toLocaleString()} nodes`);

    // Efficiency Metrics
    console.log(`\n📊 Efficiency Metrics:`);
    console.log(`   Search throughput: ${Math.round(report.performance.efficiency.nodesPerMillisecond).toLocaleString()} nodes/ms`);
    console.log(`   Test throughput: ${report.performance.efficiency.testsPerSecond.toFixed(2)} tests/second`);
    console.log(`   Average success rate: ${report.performance.efficiency.avgSuccessRate.toFixed(1)}%`);

    // Scoring Analysis
    console.log(`\n🏆 Scoring Analysis:`);
    console.log(`   Score range: ${report.scoring.scoreRange.lowest} - ${report.scoring.scoreRange.highest} points`);
    console.log(`   Average top score: ${report.scoring.averageTopScore.toFixed(1)} points`);
    console.log(`   Best performers: ${report.scoring.topScores.slice(0, 3).map(s => `Case ${s.caseId} (${s.score}pts)`).join(', ')}`);

    // Score distribution
    console.log(`   Score distribution:`);
    Object.entries(report.scoring.scoreDistribution)
        .sort(([a], [b]) => parseInt(b) - parseInt(a))
        .forEach(([score, count]) => {
            console.log(`     ${score} points: ${count} test${count > 1 ? 's' : ''}`);
        });

    // Trend Analysis
    console.log(`\n📈 Trend Analysis (Correlations):`);
    console.log(`   Complexity vs Time: ${report.trends.correlations.complexityVsTime.toFixed(3)} ${interpretCorrelation(report.trends.correlations.complexityVsTime)}`);
    console.log(`   Complexity vs Score: ${report.trends.correlations.complexityVsScore.toFixed(3)} ${interpretCorrelation(report.trends.correlations.complexityVsScore)}`);
    console.log(`   Time vs Score: ${report.trends.correlations.timeVsScore.toFixed(3)} ${interpretCorrelation(report.trends.correlations.timeVsScore)}`);

    // Detailed results if requested
    if (includeDetailedBreakdown && report.detailedResults) {
        console.log(`\n📝 Detailed Results:`);
        report.detailedResults.forEach(result => {
            if (result.success) {
                console.log(`   Case ${result.caseId}: ${result.topArrangement.substitution} → ${result.topArrangement.score}pts (${result.timing.totalTime.toFixed(1)}ms)`);
            } else {
                console.log(`   Case ${result.caseId}: FAILED - ${result.error}`);
            }
        });
    }

    console.log(`\n💾 Full report object available in: generateSummaryReport()`);
}

/**
 * Interpret correlation coefficient
 * @param {number} correlation - Correlation value (-1 to 1)
 * @returns {string} Interpretation
 */
function interpretCorrelation(correlation) {
    const abs = Math.abs(correlation);
    const direction = correlation > 0 ? 'positive' : 'negative';

    if (abs < 0.1) return '(no correlation)';
    if (abs < 0.3) return `(weak ${direction})`;
    if (abs < 0.7) return `(moderate ${direction})`;
    return `(strong ${direction})`;
}

/**
 * Export summary report as formatted text
 * @param {boolean} includeDetails - Include detailed breakdown
 * @returns {string} Formatted report text
 */
function exportSummaryReport(includeDetails = false) {
    const report = generateSummaryReport(includeDetails);
    if (!report) return "No data available for export.";

    let output = `PYRAMID POKER - ONE WILD CARD BRUTE FORCE OPTIMIZER REPORT\n`;
    output += `=${'='.repeat(65)}\n`;
    output += `Generated: ${new Date(report.metadata.reportGeneratedAt).toLocaleString()}\n\n`;

    output += `TEST OVERVIEW:\n`;
    output += `- Total Tests: ${report.metadata.totalTestCases}\n`;
    output += `- Successful: ${report.metadata.successfulTests} (${(report.metadata.successfulTests/report.metadata.totalTestCases*100).toFixed(1)}%)\n`;
    output += `- Failed: ${report.metadata.failedTests}\n`;
    output += `- Runtime: ${report.metadata.testSuiteRuntime.toFixed(1)}s\n\n`;

    output += `PERFORMANCE METRICS:\n`;
    output += `- Total Search Time: ${(report.performance.searchTime.total/1000).toFixed(1)}s\n`;
    output += `- Average per Test: ${report.performance.searchTime.average.toFixed(1)}ms\n`;
    output += `- Total Nodes Explored: ${report.performance.nodeExploration.total.toLocaleString()}\n`;
    output += `- Search Throughput: ${Math.round(report.performance.efficiency.nodesPerMillisecond).toLocaleString()} nodes/ms\n\n`;

    output += `SCORING RESULTS:\n`;
    output += `- Score Range: ${report.scoring.scoreRange.lowest} - ${report.scoring.scoreRange.highest} points\n`;
    output += `- Average Top Score: ${report.scoring.averageTopScore.toFixed(1)} points\n`;
    output += `- Best Performer: Case ${report.scoring.topScores[0].caseId} (${report.scoring.topScores[0].score} points)\n\n`;

    if (includeDetails && report.detailedResults) {
        output += `DETAILED RESULTS:\n`;
        report.detailedResults.forEach(result => {
            if (result.success) {
                output += `Case ${result.caseId}: ${result.topArrangement.substitution} → ${result.topArrangement.score}pts (${result.timing.totalTime.toFixed(1)}ms)\n`;
            } else {
                output += `Case ${result.caseId}: FAILED - ${result.error}\n`;
            }
        });
    }

    return output;
}

/**
 * Copy summary report to clipboard (if supported)
 * @param {boolean} includeDetails - Include detailed breakdown
 */
function copySummaryToClipboard(includeDetails = false) {
    const reportText = exportSummaryReport(includeDetails);

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(reportText).then(() => {
            console.log("📋 Summary report copied to clipboard!");
        }).catch(err => {
            console.log("❌ Failed to copy to clipboard:", err);
            console.log("📝 Report text:\n" + reportText);
        });
    } else {
        console.log("📝 Clipboard not available. Report text:");
        console.log(reportText);
    }
}

/**
 * Run brute force optimizer on all test cases
 * @returns {Array} Array of test results
 */
function runAllOneWildTests() {
    console.log(`\n🚀 ======== RUNNING ALL ONE WILD TESTS ========`);
    console.log(`📋 Total test cases: ${ONE_WILD_TEST_CASES.length}`);

    oneWildTestResults = []; // Reset results array
    resetPerformanceMetrics(); // Reset performance tracking

    ONE_WILD_TEST_CASES.forEach((testCase, index) => {
        console.log(`\n📊 ======== PROCESSING TEST CASE ${testCase.id}/${ONE_WILD_TEST_CASES.length} ========`);

        try {
            const caseStartTime = performance.now();
            const optimizer = new OneWildBruteForceOptimizer();
            const result = optimizer.bruteForceOptimize(testCase.cards);
            const caseEndTime = performance.now();

            // Store result with additional metadata
            const testResult = {
                caseId: testCase.id,
                caseName: testCase.name,
                cards: testCase.cards,
                result: result,
                timing: {
                    totalTime: caseEndTime - caseStartTime,
                    avgTimePerSubstitution: (caseEndTime - caseStartTime) / 52
                },
                success: true,
                error: null
            };

            oneWildTestResults.push(testResult);
            collectPerformanceMetrics(testResult); // Collect performance data

            // Display detailed results for this case
            displayDetailedResults(result, testCase.name);

            console.log(`\n✅ Case ${testCase.id} completed in ${(caseEndTime - caseStartTime).toFixed(1)}ms`);

        } catch (error) {
            console.log(`\n❌ Case ${testCase.id} FAILED: ${error.message}`);

            // Store failed result
            const failedResult = {
                caseId: testCase.id,
                caseName: testCase.name,
                cards: testCase.cards,
                result: null,
                timing: { totalTime: 0, avgTimePerSubstitution: 0 },
                success: false,
                error: error.message
            };

            oneWildTestResults.push(failedResult);
            collectPerformanceMetrics(failedResult); // Track failed tests too
        }
    });

    finalizePerformanceMetrics(); // Calculate final metrics

    console.log(`\n🏁 ======== ALL TESTS COMPLETED ========`);
    console.log(`⏱️  Total time: ${((performanceMetrics.testEndTime - performanceMetrics.testStartTime) / 1000).toFixed(1)} seconds`);
    console.log(`📊 Results stored in global variable: oneWildTestResults`);
    console.log(`📈 Performance metrics available: use showPerformanceAnalysis()`);

    return oneWildTestResults;
}

/**
 * Run brute force optimizer on specific test cases
 * @param {Array} caseIds - Array of case IDs to run (e.g., [1, 3, 5])
 * @returns {Array} Array of test results for specified cases
 */
function runSpecificOneWildTests(caseIds) {
    console.log(`\n🎯 ======== RUNNING SPECIFIC ONE WILD TESTS ========`);
    console.log(`📋 Test cases: ${caseIds.join(', ')}`);

    const specificResults = [];
    const startTime = performance.now();

    caseIds.forEach(caseId => {
        const testCase = ONE_WILD_TEST_CASES.find(tc => tc.id === caseId);

        if (!testCase) {
            console.log(`\n❌ Test case ${caseId} not found`);
            return;
        }

        console.log(`\n📊 ======== PROCESSING TEST CASE ${caseId} ========`);

        try {
            const caseStartTime = performance.now();
            const optimizer = new OneWildBruteForceOptimizer();
            const result = optimizer.bruteForceOptimize(testCase.cards);
            const caseEndTime = performance.now();

            // Store result
            const testResult = {
                caseId: testCase.id,
                caseName: testCase.name,
                cards: testCase.cards,
                result: result,
                timing: {
                    totalTime: caseEndTime - caseStartTime,
                    avgTimePerSubstitution: (caseEndTime - caseStartTime) / 52
                },
                success: true,
                error: null
            };

            specificResults.push(testResult);

            // Display detailed results
            displayDetailedResults(result, testCase.name);

            console.log(`\n✅ Case ${caseId} completed in ${(caseEndTime - caseStartTime).toFixed(1)}ms`);

        } catch (error) {
            console.log(`\n❌ Case ${caseId} FAILED: ${error.message}`);

            const failedResult = {
                caseId: testCase.id,
                caseName: testCase.name,
                cards: testCase.cards,
                result: null,
                timing: { totalTime: 0, avgTimePerSubstitution: 0 },
                success: false,
                error: error.message
            };

            specificResults.push(failedResult);
        }
    });

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    console.log(`\n🏁 ======== SPECIFIC TESTS COMPLETED ========`);
    console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(1)} seconds`);

    return specificResults;
}

/**
 * Quick run without detailed output - just progress and summary
 * @param {Array} caseIds - Optional array of specific case IDs
 * @returns {Array} Array of test results
 */
function runOneWildTestsQuick(caseIds = null) {
    const testCases = caseIds ?
        ONE_WILD_TEST_CASES.filter(tc => caseIds.includes(tc.id)) :
        ONE_WILD_TEST_CASES;

    console.log(`\n⚡ ======== QUICK ONE WILD TESTS ========`);
    console.log(`📋 Running ${testCases.length} test cases...`);

    const results = [];
    const startTime = performance.now();

    testCases.forEach((testCase, index) => {
        console.log(`🔄 Processing case ${testCase.id}... (${index + 1}/${testCases.length})`);

        try {
            const caseStartTime = performance.now();
            const optimizer = new OneWildBruteForceOptimizer();
            const result = optimizer.bruteForceOptimize(testCase.cards);
            const caseEndTime = performance.now();

            results.push({
                caseId: testCase.id,
                caseName: testCase.name,
                result: result,
                timing: {
                    totalTime: caseEndTime - caseStartTime,
                    avgTimePerSubstitution: (caseEndTime - caseStartTime) / 52
                },
                success: true,
                error: null
            });

        } catch (error) {
            results.push({
                caseId: testCase.id,
                caseName: testCase.name,
                result: null,
                timing: { totalTime: 0, avgTimePerSubstitution: 0 },
                success: false,
                error: error.message
            });
        }
    });

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    console.log(`\n\n✅ Completed ${testCases.length} tests in ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`📊 Success rate: ${results.filter(r => r.success).length}/${results.length}`);

    return results;
}

/**
 * Display a quick summary of stored results
 */
function showOneWildTestSummary() {
    if (oneWildTestResults.length === 0) {
        console.log("❌ No test results available. Run tests first.");
        return;
    }

    console.log(`\n📋 ======== ONE WILD TEST SUMMARY ========`);
    console.log(`📊 Total tests: ${oneWildTestResults.length}`);

    const successful = oneWildTestResults.filter(r => r.success);
    const failed = oneWildTestResults.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (successful.length > 0) {
        const avgTime = successful.reduce((sum, r) => sum + r.timing.totalTime, 0) / successful.length;
        console.log(`⏱️  Average time per test: ${avgTime.toFixed(1)}ms`);

        // Show top scores
        const topScores = successful
            .map(r => ({
                caseId: r.caseId,
                topScore: r.result?.summary?.scoreRange?.highest || 0
            }))
            .sort((a, b) => b.topScore - a.topScore)
            .slice(0, 3);

        console.log(`\n🏆 Top 3 highest scores:`);
        topScores.forEach((score, index) => {
            console.log(`   ${index + 1}. Case ${score.caseId}: ${score.topScore} points`);
        });
    }

    if (failed.length > 0) {
        console.log(`\n❌ Failed cases: ${failed.map(r => r.caseId).join(', ')}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllOneWildTests,
        runSpecificOneWildTests,
        runOneWildTestsQuick,
        showOneWildTestSummary,
        showPerformanceAnalysis,
        showPerformanceRanking,
        resetPerformanceMetrics,
        generateSummaryReport,
        showSummaryReport,
        exportSummaryReport,
        copySummaryToClipboard
    };
}