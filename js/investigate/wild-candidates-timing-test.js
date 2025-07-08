// investigate/wild-candidates-timing-test.js
// Simple timing test to investigate parameterized-wild-candidates performance

/**
 * Diagnose performance of wild candidates generation
 * Tests actual timing vs expected timing to identify HandDetector usage
 */
function diagnoseWildCandidatesPerformance() {
    console.log('\n🩺 ======== DIAGNOSING WILD CANDIDATES PERFORMANCE ========');

    // Test multiple cases to get consistent timing
    const testCases = [1, 2, 3, 4, 5];
    const timings = [];

    testCases.forEach(caseId => {
        console.log(`\n📋 Testing Case ${caseId}:`);

        // FIXED: Get actual cards from test framework
        const testResult = runSingleTest(caseId);
        const testCards = testResult.cards;

        console.log(`📋 Using ${testCards.length} cards from case ${caseId}`);

        // Time the wild candidates generation
        console.time(`WildCandidates-${caseId}`);
        const startTime = performance.now();

        const result = parameterizedWildCandidates(testCards);  // Pass cards with default hand types
    const candidates = result.wildCandidates;

        const endTime = performance.now();
        console.timeEnd(`WildCandidates-${caseId}`);

        const duration = endTime - startTime;
        timings.push(duration);

        console.log(`   ⏱️ Duration: ${duration.toFixed(2)}ms`);
        console.log(`   📊 Candidates found: ${candidates.length}`);
        console.log(`   🎯 Performance per candidate: ${(duration / candidates.length).toFixed(2)}ms`);
    });

    // Calculate statistics
    const avgTime = timings.reduce((a, b) => a + b) / timings.length;
    const maxTime = Math.max(...timings);
    const minTime = Math.min(...timings);

    console.log('\n📊 ======== PERFORMANCE SUMMARY ========');
    console.log(`Average time: ${avgTime.toFixed(2)}ms`);
    console.log(`Min time: ${minTime.toFixed(2)}ms`);
    console.log(`Max time: ${maxTime.toFixed(2)}ms`);

    // Performance assessment
    console.log('\n🎯 ======== PERFORMANCE ASSESSMENT ========');
    if (avgTime < 5) {
        console.log('✅ GOOD: Fast performance - likely using calculateExpectedCounts');
    } else if (avgTime < 20) {
        console.log('⚠️ MODERATE: Slower than expected - investigate further');
    } else {
        console.log('🚨 SLOW: Very slow - likely running HandDetector!');
    }

    return {
        averageTime: avgTime,
        timings: timings,
        assessment: avgTime < 5 ? 'GOOD' : avgTime < 20 ? 'MODERATE' : 'SLOW'
    };
}

/**
 * Quick single-case timing test
 * @param {number} caseId - Test case ID to check
 */
function quickTimingTest(caseId = 1) {
    console.log(`\n⚡ Quick timing test for case ${caseId}:`);

    // FIXED: Get actual cards from test framework (cards are at testResult.cards)
    const testResult = runSingleTest(caseId);
    const testCards = testResult.cards;

    console.log(`📋 Using ${testCards.length} cards from case ${caseId}`);

    const startTime = performance.now();
            const result = parameterizedWildCandidates(testCards);  // Pass cards with default hand types
        const candidates = result.wildCandidates;
    const endTime = performance.now();

    const duration = endTime - startTime;

    console.log(`⏱️ Time: ${duration.toFixed(2)}ms`);
    console.log(`📊 Candidates: ${candidates.length}`);
    console.log(`🎯 Performance: ${duration < 10 ? 'GOOD' : 'NEEDS INVESTIGATION'}`);

    return { duration, candidateCount: candidates.length };
}

/**
 * Compare with baseline HandDetector performance
 * This tells us what "slow" looks like for comparison
 */
function baselineHandDetectorTiming() {
    console.log('\n🔬 ======== BASELINE: HandDetector Performance ========');

    // Run HandDetector on a typical case for comparison
    const testResult = runSingleTest(1);
    if (!testResult) {
        console.log('❌ Could not run baseline test');
        return null;
    }

    console.log(`⏱️ HandDetector time: ${testResult.timing.toFixed(2)}ms`);
    console.log(`📊 Hands detected: ${testResult.results.total}`);

    return testResult.timing;
}

/**
 * Full diagnostic - timing test + baseline comparison
 */
function fullDiagnostic() {
    console.log('\n🔍 ======== FULL WILD CANDIDATES DIAGNOSTIC ========');

    // 1. Test wild candidates performance
    const wildResult = diagnoseWildCandidatesPerformance();

    // 2. Get HandDetector baseline
    const baselineTime = baselineHandDetectorTiming();

    // 3. Compare results
    if (baselineTime) {
        console.log('\n🔍 ======== COMPARISON ANALYSIS ========');
        const ratio = wildResult.averageTime / baselineTime;

        console.log(`Wild Candidates: ${wildResult.averageTime.toFixed(2)}ms`);
        console.log(`HandDetector: ${baselineTime.toFixed(2)}ms`);
        console.log(`Ratio: ${ratio.toFixed(2)}x`);

        if (ratio > 0.1) {
            console.log('🚨 PROBLEM: Wild candidates taking significant fraction of HandDetector time!');
            console.log('   This suggests HandDetector is being called internally.');
        } else {
            console.log('✅ GOOD: Wild candidates much faster than HandDetector');
        }
    }

    return wildResult;
}