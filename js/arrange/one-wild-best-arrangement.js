/**
 * Find best arrangement for a hand with one wild card
 * @param {number} caseId - Test case ID from one-wild-test-cases.js
 * @returns {Array} Array of results, each with wild card used and arrangement found
 */
function oneWildBestArrangement(caseId) {
    console.log(`\n🎯 ======== ONE WILD BEST ARRANGEMENT - CASE ${caseId} ========`);

    // Step 1: Get smart candidates
    console.log(`\n📋 Step 1: Getting smart candidates...`);
    const candidatesResult = generateWildCandidates(caseId);

    if (!candidatesResult) {
        console.log(`❌ Failed to get candidates for case ${caseId}`);
        return [];
    }

    const smartCandidates = candidatesResult.wildCandidates;
    console.log(`✅ Found ${smartCandidates.length} smart candidates`);

    // Get the test case for wild substitution
    const testCase = ONE_WILD_TEST_CASES.find(t => t.id === caseId);
    if (!testCase) {
        console.log(`❌ Test case ${caseId} not found`);
        return [];
    }

    // Step 2: Process each smart candidate
    console.log(`\n🔄 Step 2: Processing ${smartCandidates.length} candidates...`);
    const results = [];

    smartCandidates.forEach((candidate, index) => {
        console.log(`\n--- Processing candidate ${index + 1}/${smartCandidates.length}: ${candidate} ---`);

        try {
            // Replace wild card with candidate and parse
            const cards = CardParser.parseWithWildSubstitution(testCase.cards, candidate);
            console.log(`✅ Parsed ${cards.length} cards with ${candidate} substituted`);

            // Run HandDetector (auto-sorted)
            const detector = new HandDetector(cards);
            const handResults = detector.detectAllHands(); // Pre-sorted hands!
            console.log(`✅ Detected ${handResults.total} hands (auto-sorted)`);

            // Run BestArrangementGenerator
            const generator = new BestArrangementGenerator();
            const arrangementResult = generator.generateBestArrangement(handResults.hands, cards);

            if (arrangementResult.success) {
                results.push({
                    wildCard: candidate,
                    arrangement: arrangementResult.arrangement,
                    score: arrangementResult.score,
                    success: true,
                    statistics: arrangementResult.statistics,
                    handCount: handResults.total
                });

                console.log(`✅ Found arrangement with score: ${arrangementResult.score}`);
                console.log(`   Back: ${arrangementResult.arrangement.back.handType}`);
                console.log(`   Middle: ${arrangementResult.arrangement.middle.handType}`);
                console.log(`   Front: ${arrangementResult.arrangement.front.handType}`);
            } else {
                results.push({
                    wildCard: candidate,
                    arrangement: null,
                    score: -Infinity,
                    success: false,
                    statistics: arrangementResult.statistics,
                    handCount: handResults.total,
                    error: 'No valid arrangement found'
                });

                console.log(`❌ No valid arrangement found for ${candidate}`);
            }

        } catch (error) {
            console.log(`❌ Error processing ${candidate}: ${error.message}`);
            results.push({
                wildCard: candidate,
                arrangement: null,
                score: -Infinity,
                success: false,
                statistics: null,
                handCount: 0,
                error: error.message
            });
        }
    });

    // Step 3: Sort results by score and summarize
    console.log(`\n📊 Step 3: Analyzing results...`);
    results.sort((a, b) => b.score - a.score);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n✅ ======== SUMMARY ========`);
    console.log(`Total candidates processed: ${results.length}`);
    console.log(`Successful arrangements: ${successful.length}`);
    console.log(`Failed attempts: ${failed.length}`);

    if (successful.length > 0) {
        const best = successful[0];
        console.log(`\n🏆 Best Result:`);
        console.log(`   Wild card: ${best.wildCard}`);
        console.log(`   Score: ${best.score}`);
        console.log(`   Back: ${best.arrangement.back.handType}`);
        console.log(`   Middle: ${best.arrangement.middle.handType}`);
        console.log(`   Front: ${best.arrangement.front.handType}`);

        // Show top 3 results
        console.log(`\n🥇 Top Results:`);
        successful.slice(0, Math.min(8, successful.length)).forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.wildCard}: ${result.score} points`);
        });
    } else {
        console.log(`❌ No successful arrangements found!`);
    }

    return results;
}

/**
 * Quick test function for console use
 * @param {number} caseId - Test case ID (default: 1)
 */
function testOneWildBestArrangement(caseId = 1) {
    return oneWildBestArrangement(caseId);
}

/**
 * Compare multiple test cases
 * @param {Array} caseIds - Array of case IDs to test
 */
function testMultipleOneWildCases(caseIds = [1, 2, 3]) {
    console.log(`\n🚀 ======== TESTING MULTIPLE ONE-WILD CASES ========`);

    const summaryResults = [];

    caseIds.forEach(caseId => {
        const results = oneWildBestArrangement(caseId);
        const successful = results.filter(r => r.success);

        if (successful.length > 0) {
            const best = successful[0];
            summaryResults.push({
                caseId,
                bestScore: best.score,
                bestWildCard: best.wildCard,
                successfulCandidates: successful.length,
                totalCandidates: results.length
            });
        } else {
            summaryResults.push({
                caseId,
                bestScore: -Infinity,
                bestWildCard: null,
                successfulCandidates: 0,
                totalCandidates: results.length
            });
        }
    });

    // Summary table
    console.log(`\n📋 ======== MULTI-CASE SUMMARY ========`);
    summaryResults.forEach(r => {
        const successRate = ((r.successfulCandidates / r.totalCandidates) * 100).toFixed(1);
        console.log(`Case ${r.caseId}: Best ${r.bestScore} (${r.bestWildCard}) | Success: ${r.successfulCandidates}/${r.totalCandidates} (${successRate}%)`);
    });

    return summaryResults;
}