// js/arrange/one-wild-brute-force-arrangement.js
// Find best arrangement for hands with exactly one wild card using brute force
// Tests ALL 52 possible substitutions + best-arrangement-generator

/**
 * Find best arrangement for a hand with one wild card using brute force approach
 * @param {number} caseId - Test case ID from one-wild-test-cases.js
 * @returns {Array} Array of results, each with wild card used and arrangement found
 */
function bestArrangementOneWildBruteForce(caseId) {
    console.log(`\n🔨 ======== ONE WILD BRUTE FORCE ARRANGEMENT - CASE ${caseId} ========`);

    // Step 1: Get all 52 possible cards
    console.log(`\n📋 Step 1: Generating all 52 possible cards...`);
    const allCandidates = generateAll52Cards();
    console.log(`✅ Generated ${allCandidates.length} total candidates`);

    // Get the test case for wild substitution
    const testCase = ONE_WILD_TEST_CASES.find(t => t.id === caseId);
    if (!testCase) {
        console.log(`❌ Test case ${caseId} not found`);
        return [];
    }

    // Step 2: Process each candidate (brute force)
    console.log(`\n🔄 Step 2: Processing ALL ${allCandidates.length} candidates (brute force)...`);
    const results = [];

    allCandidates.forEach((candidate, index) => {
        // Progress indicator every 13 cards (one suit)
        if ((index + 1) % 13 === 0) {
            console.log(`   Progress: ${index + 1}/${allCandidates.length} candidates processed...`);
        }

        try {
            // Replace wild card with candidate and parse
            const cards = CardParser.parseWithWildSubstitution(testCase.cards, candidate);

            // Run HandDetector (auto-sorted)
            const detector = new HandDetector(cards);
            const handResults = detector.detectAllHands(); // Pre-sorted hands!

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
            }

        } catch (error) {
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
    console.log(`\n📊 Step 3: Analyzing brute force results...`);
    results.sort((a, b) => b.score - a.score);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n✅ ======== BRUTE FORCE SUMMARY ========`);
    console.log(`Total candidates processed: ${results.length}`);
    console.log(`Successful arrangements: ${successful.length}`);
    console.log(`Failed attempts: ${failed.length}`);

    if (successful.length > 0) {
        const best = successful[0];
        console.log(`\n🏆 Best Result (Brute Force):`);
        console.log(`   Wild card: ${best.wildCard}`);
        console.log(`   Score: ${best.score}`);
        console.log(`   Back: ${best.arrangement.back.handType}`);
        console.log(`   Middle: ${best.arrangement.middle.handType}`);
        console.log(`   Front: ${best.arrangement.front.handType}`);

        // Show top 5 results for brute force
        console.log(`\n🥇 Top 5 Results (Brute Force):`);
        successful.slice(0, 5).forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.wildCard}: ${result.score} points`);
        });

        // Show optimal score distribution
        const optimalScore = best.score;
        const optimalResults = successful.filter(r => r.score === optimalScore);
        console.log(`\n🎯 Optimal Score Analysis:`);
        console.log(`   Optimal score: ${optimalScore} points`);
        console.log(`   Cards achieving optimal: ${optimalResults.length}/${successful.length}`);
        console.log(`   Optimal wild cards: ${optimalResults.map(r => r.wildCard).join(', ')}`);

    } else {
        console.log(`❌ No successful arrangements found!`);
    }

    return results;
}

/**
 * Generate all 52 possible cards
 * @returns {Array} Array of all possible card strings
 */
function generateAll52Cards() {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suits = ['♠', '♥', '♦', '♣'];

    const allCards = [];

    ranks.forEach(rank => {
        suits.forEach(suit => {
            allCards.push(rank + suit);
        });
    });

    return allCards;
}

/**
 * Quick test function for console use
 * @param {number} caseId - Test case ID (default: 1)
 */
function testOneWildBruteForce(caseId = 1) {
    return bestArrangementOneWildBruteForce(caseId);
}

/**
 * Compare smart vs brute force approaches with side-by-side results
 * @param {number} caseId - Test case ID to compare
 */
function compareSmartVsBruteForce(caseId = 1) {
    console.log(`\n🔬 ======== SMART VS BRUTE FORCE COMPARISON - CASE ${caseId} ========`);

    // Run smart approach (quietly - capture output without display)
    console.log(`\n🧠 Running smart approach (quietly)...`);
    const startSmart = performance.now();
    const smartResults = bestArrangementOneWild(caseId);
    const endSmart = performance.now();
    const smartTime = endSmart - startSmart;

    // Run brute force approach (quietly - capture output without display)
    console.log(`\n🔨 Running brute force approach (quietly)...`);
    const startBrute = performance.now();
    const bruteResults = bestArrangementOneWildBruteForce(caseId);
    const endBrute = performance.now();
    const bruteTime = endBrute - startBrute;

    // Display side-by-side results
    console.log(`\n📊 ======== SIDE-BY-SIDE RESULTS ========`);

    const smartSuccessful = smartResults.filter(r => r.success);
    const bruteSuccessful = bruteResults.filter(r => r.success);

    console.log(`\n📈 PERFORMANCE:`);
    console.log(`   Smart: ${smartTime.toFixed(1)}ms, ${smartResults.length} candidates`);
    console.log(`   Brute: ${bruteTime.toFixed(1)}ms, ${bruteResults.length} candidates`);
    console.log(`   Speedup: ${(bruteTime / smartTime).toFixed(1)}x faster`);

    console.log(`\n✅ SUCCESS RATES:`);
    console.log(`   Smart: ${smartSuccessful.length}/${smartResults.length} (${(smartSuccessful.length/smartResults.length*100).toFixed(1)}%)`);
    console.log(`   Brute: ${bruteSuccessful.length}/${bruteResults.length} (${(bruteSuccessful.length/bruteResults.length*100).toFixed(1)}%)`);

    console.log(`\n🏆 BEST RESULTS:`);
    const smartBest = smartSuccessful.length > 0 ? smartSuccessful[0] : null;
    const bruteBest = bruteSuccessful.length > 0 ? bruteSuccessful[0] : null;

    if (smartBest && bruteBest) {
        console.log(`   Smart best: ${smartBest.score} points (${smartBest.wildCard})`);
        console.log(`   Brute best: ${bruteBest.score} points (${bruteBest.wildCard})`);

        console.log(`\n🎯 OPTIMAL ANALYSIS:`);
        const optimalScore = bruteBest.score;
        const smartOptimal = smartSuccessful.filter(r => r.score === optimalScore);
        const bruteOptimal = bruteSuccessful.filter(r => r.score === optimalScore);

        console.log(`   Optimal score: ${optimalScore} points`);
        console.log(`   Smart found optimal: ${smartOptimal.length} cards`);
        console.log(`   Brute found optimal: ${bruteOptimal.length} cards`);

        if (smartOptimal.length === bruteOptimal.length) {
            console.log(`   ✅ PERFECT MATCH! Both found same ${smartOptimal.length} optimal cards`);
        } else {
            console.log(`   ⚠️ DIFFERENCE! Smart found ${smartOptimal.length}, Brute found ${bruteOptimal.length}`);
        }

        console.log(`\n🃏 OPTIMAL CARDS:`);
        console.log(`   Smart: ${smartOptimal.map(r => r.wildCard).join(', ')}`);
        console.log(`   Brute: ${bruteOptimal.map(r => r.wildCard).join(', ')}`);
    }

    // Compare results
    console.log(`\n📊 ======== COMPARISON RESULTS ========`);

    // const smartSuccessful = smartResults.filter(r => r.success);
    // const bruteSuccessful = bruteResults.filter(r => r.success);

    console.log(`Performance:`);
    console.log(`   Smart approach: ${smartTime.toFixed(1)}ms, ${smartResults.length} candidates`);
    console.log(`   Brute force: ${bruteTime.toFixed(1)}ms, ${bruteResults.length} candidates`);
    console.log(`   Speedup: ${(bruteTime / smartTime).toFixed(1)}x faster`);

    console.log(`\nSuccess rates:`);
    console.log(`   Smart: ${smartSuccessful.length}/${smartResults.length} (${(smartSuccessful.length/smartResults.length*100).toFixed(1)}%)`);
    console.log(`   Brute: ${bruteSuccessful.length}/${bruteResults.length} (${(bruteSuccessful.length/bruteResults.length*100).toFixed(1)}%)`);

    // Compare best scores
    // const smartBest = smartSuccessful.length > 0 ? smartSuccessful[0] : null;
    // const bruteBest = bruteSuccessful.length > 0 ? bruteSuccessful[0] : null;

    if (smartBest && bruteBest) {
        console.log(`\nBest scores:`);
        console.log(`   Smart best: ${smartBest.score} (${smartBest.wildCard})`);
        console.log(`   Brute best: ${bruteBest.score} (${bruteBest.wildCard})`);

        if (smartBest.score === bruteBest.score) {
            console.log(`   ✅ SCORES MATCH! Both found optimal score.`);
        } else {
            console.log(`   ⚠️ SCORE DIFFERENCE! Smart may have missed optimal.`);
        }

        // Check if smart approach found the optimal wild card(s)
        const optimalScore = bruteBest.score;
        const allOptimalBrute = bruteSuccessful.filter(r => r.score === optimalScore);
        const smartFoundOptimal = smartSuccessful.some(r => r.score === optimalScore);

        console.log(`\nOptimal analysis:`);
        console.log(`   Optimal score: ${optimalScore}`);
        console.log(`   Cards achieving optimal: ${allOptimalBrute.length}`);
        console.log(`   Smart found optimal: ${smartFoundOptimal ? '✅ YES' : '❌ NO'}`);

        if (smartFoundOptimal) {
            const smartOptimal = smartSuccessful.filter(r => r.score === optimalScore);
            console.log(`   Smart optimal cards: ${smartOptimal.map(r => r.wildCard).join(', ')}`);
        }
    }

    return {
        smartResults,
        bruteResults,
        comparison: {
            smartTime,
            bruteTime,
            speedup: bruteTime / smartTime,
            smartBest: smartBest?.score || -Infinity,
            bruteBest: bruteBest?.score || -Infinity,
            scoresMatch: smartBest?.score === bruteBest?.score
        }
    };
}