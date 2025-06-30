// js/tests/test-best-arrangement-generator.js v1
// Test the greedy branch-and-bound arrangement generator

/**
 * Test BestArrangementGenerator with real HandDetector data
 * @param {number} caseId - Test case ID (1-17)
 */
function testBestArrangementGenerator(caseId = 1) {
    console.log(`\n🎯 ======== TESTING BEST ARRANGEMENT GENERATOR ========`);
    console.log(`Test Case: ${caseId}`);

    // Step 1: Get hands from HandDetector
    console.log('\n📋 Step 1: Running HandDetector...');
    const testResult = runSingleTest(caseId);
    if (!testResult || !testResult.results) {
        console.log('❌ Failed to get test results');
        return null;
    }

    console.log(`✅ Detected ${testResult.results.total} hands`);

    // Step 2: Sort hands by strength
    console.log('\n🔄 Step 2: Sorting hands by strength...');
    const sorter = new HandSorter();
    const sortResult = sorter.sortHandsByStrength(testResult.results.hands);

    console.log(`✅ Sorted ${sortResult.sortedHands.length} hands`);
    console.log(`   Strongest: ${sortResult.metadata.strengthRange.strongest.handType}`);
    console.log(`   Weakest: ${sortResult.metadata.strengthRange.weakest.handType}`);

    // Step 3: Generate best arrangement
    console.log('\n🎯 Step 3: Finding best arrangement...');
    const generator = new BestArrangementGenerator();
    const result = generator.generateBestArrangement(sortResult.sortedHands);

    // Display results
    displayArrangementResults(result, testResult.name);

    return result;
}

/**
 * Display arrangement generation results
 * @param {Object} result - Result from BestArrangementGenerator
 * @param {string} testName - Name of the test case
 */
function displayArrangementResults(result, testName) {
    console.log(`\n📊 ======== RESULTS FOR ${testName} ========`);

    if (!result.arrangement) {
        console.log('❌ No valid arrangement found');
        return;
    }

    // Show the best arrangement
    console.log(`🏆 Best Arrangement (Score: ${result.score}):`);
    console.log(`   🔙 Back:   ${result.arrangement.back.handType} - [${result.arrangement.back.hand_rank.join(', ')}]`);
    console.log(`   🔄 Middle: ${result.arrangement.middle.handType} - [${result.arrangement.middle.hand_rank.join(', ')}]`);
    console.log(`   🔜 Front:  ${result.arrangement.front.handType} - [${result.arrangement.front.hand_rank.join(', ')}]`);

    // Show cards used
    const backCards = result.arrangement.back.cards.map(c => c.rank + c.suit).join(' ');
    const middleCards = result.arrangement.middle.cards.map(c => c.rank + c.suit).join(' ');
    const frontCards = result.arrangement.front.cards.map(c => c.rank + c.suit).join(' ');

    console.log(`\n🃏 Cards Used:`);
    console.log(`   Back:   ${backCards}`);
    console.log(`   Middle: ${middleCards}`);
    console.log(`   Front:  ${frontCards}`);

    // Show statistics
    console.log(`\n📈 Search Statistics:`);
    console.log(`   Nodes explored: ${result.statistics.exploredNodes.toLocaleString()}`);
    console.log(`   Nodes pruned: ${result.statistics.prunedNodes.toLocaleString()}`);
    console.log(`   Search time: ${result.statistics.searchTime.toFixed(2)}ms`);
    console.log(`   Pruning efficiency: ${(result.statistics.efficiency * 100).toFixed(1)}%`);

    // Validate the arrangement
    console.log(`\n✅ Validation:`);
    const generator = new BestArrangementGenerator();
    const validation = generator.validateArrangement(result.arrangement);

    if (validation.isValid) {
        console.log(`   ✅ Valid arrangement`);
        console.log(`   📊 Cards used: ${validation.totalCards}/17`);
    } else {
        console.log(`   ❌ Invalid arrangement:`);
        validation.issues.forEach(issue => {
            console.log(`      - ${issue}`);
        });
    }
}

/**
 * Quick test with multiple cases
 * @param {Array} caseIds - Array of case IDs to test
 */
function testMultipleCases(caseIds = [1, 6, 9]) {
    console.log(`\n🚀 ======== TESTING MULTIPLE CASES ========`);

    const results = [];

    caseIds.forEach(caseId => {
        console.log(`\n--- Testing Case ${caseId} ---`);
        const result = testBestArrangementGenerator(caseId);
        if (result) {
            results.push({
                caseId,
                score: result.score,
                searchTime: result.statistics.searchTime,
                efficiency: result.statistics.efficiency
            });
        }
    });

    // Summary
    console.log(`\n📋 ======== SUMMARY ========`);
    results.forEach(r => {
        console.log(`Case ${r.caseId}: Score ${r.score}, ${r.searchTime.toFixed(1)}ms, ${(r.efficiency * 100).toFixed(1)}% pruned`);
    });

    return results;
}

/**
 * Performance test with timing analysis
 * @param {number} caseId - Test case to use
 * @param {number} iterations - Number of iterations
 */
function performanceTest(caseId = 1, iterations = 5) {
    console.log(`\n⚡ ======== PERFORMANCE TEST ========`);
    console.log(`Case ${caseId}, ${iterations} iterations`);

    // Get the test data once
    const testResult = runSingleTest(caseId);
    const sorter = new HandSorter();
    const sortResult = sorter.sortHandsByStrength(testResult.results.hands);

    const times = [];
    const scores = [];

    for (let i = 0; i < iterations; i++) {
        const generator = new BestArrangementGenerator();
        const startTime = performance.now();
        const result = generator.generateBestArrangement(sortResult.sortedHands);
        const endTime = performance.now();

        times.push(endTime - startTime);
        scores.push(result.score);

        console.log(`Run ${i + 1}: ${(endTime - startTime).toFixed(2)}ms, Score: ${result.score}`);
    }

    // Statistics
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const avgScore = scores.reduce((a, b) => a + b) / scores.length;

    console.log(`\n📊 Performance Summary:`);
    console.log(`   Average time: ${avgTime.toFixed(2)}ms`);
    console.log(`   Min time: ${minTime.toFixed(2)}ms`);
    console.log(`   Max time: ${maxTime.toFixed(2)}ms`);
    console.log(`   Average score: ${avgScore.toFixed(1)}`);
    console.log(`   Score consistency: ${scores.every(s => s === scores[0]) ? 'Perfect' : 'Variable'}`);
}

/**
 * Compare with exhaustive search (small subset)
 * @param {number} caseId - Test case to use
 * @param {number} maxHands - Limit hands for exhaustive comparison
 */
function compareWithExhaustive(caseId = 1, maxHands = 100) {
    console.log(`\n🔬 ======== GREEDY VS EXHAUSTIVE COMPARISON ========`);
    console.log(`Using first ${maxHands} hands from case ${caseId}`);

    // Get limited dataset
    const testResult = runSingleTest(caseId);
    const sorter = new HandSorter();
    const sortResult = sorter.sortHandsByStrength(testResult.results.hands);
    const limitedHands = sortResult.sortedHands.slice(0, maxHands);

    console.log(`\n🎯 Greedy Approach:`);
    const greedyStart = performance.now();
    const generator = new BestArrangementGenerator();
    const greedyResult = generator.generateBestArrangement(limitedHands);
    const greedyEnd = performance.now();

    console.log(`   Score: ${greedyResult.score}`);
    console.log(`   Time: ${(greedyEnd - greedyStart).toFixed(2)}ms`);
    console.log(`   Nodes: ${greedyResult.statistics.exploredNodes}`);

    // TODO: Implement simple exhaustive search for comparison
    console.log(`\n🔍 Exhaustive search comparison: [Not implemented yet]`);
    console.log(`   Would check all valid combinations of ${maxHands} hands`);

    return greedyResult;
}