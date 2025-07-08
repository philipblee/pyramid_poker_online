// js/arrange/two-wild-best-arrangement.js
// Main orchestrator for 2-wild optimization using both strategies
// UPDATED: Handles new Strategy 2 return format

/**
 * Find best arrangement using 2 wild cards with dual strategy approach
 * @param {Array} cards - Array of 15 non-wild cards
 * @returns {Object} Best arrangement with 2 wild cards and statistics
 */
function twoWildBestArrangement(cards) {
    console.log('\n🎯 ======== TWO WILD BEST ARRANGEMENT ========');
    console.log(`Optimizing arrangement for ${cards.length} cards + 2 wild cards`);

    const startTime = performance.now();
    const statistics = {
        strategy1Combinations: 0,
        strategy2Combinations: 0,
        strategy2FirstLayer: 0,        // NEW: Track first-layer efficiency
        totalCombinations: 0,
        duplicatesRemoved: 0,
        bruteForceReduction: 0,
        searchTime: 0
    };

    // Strategy 1: Same-suit combinations for straight flushes
    console.log('\n🎯 Executing Strategy 1...');
    const strategy1Results = twoWildStrategyOne(cards);
    statistics.strategy1Combinations = strategy1Results.length;

    // Strategy 2: Nested wild candidates for comprehensive coverage
    console.log('\n🎯 Executing Strategy 2...');
    const strategy2Result = twoWildStrategyTwo(cards);  // NEW: Handle object return
    const strategy2Results = strategy2Result.combinations;  // NEW: Extract combinations
    statistics.strategy2Combinations = strategy2Results.length;
    statistics.strategy2FirstLayer = strategy2Result.firstLayerCount;  // NEW: Track first-layer

    // Combine and deduplicate results
    console.log('\n🔄 Combining and deduplicating results...');
    const combinedResults = combineAndDeduplicate(strategy1Results, strategy2Results);
    statistics.totalCombinations = combinedResults.length;
    statistics.duplicatesRemoved = (statistics.strategy1Combinations + statistics.strategy2Combinations) - statistics.totalCombinations;
    statistics.bruteForceReduction = ((1326 - statistics.totalCombinations) / 1326 * 100).toFixed(1);

    console.log(`📊 Combination Statistics:`);
    console.log(`   Strategy 1: ${statistics.strategy1Combinations} combinations`);
    console.log(`   Strategy 2: ${statistics.strategy2Combinations} combinations (${statistics.strategy2FirstLayer}/52 first-layer)`);  // NEW: Show first-layer
    console.log(`   Total after dedup: ${statistics.totalCombinations} combinations`);
    console.log(`   Brute force reduction: ${statistics.bruteForceReduction}%`);

    // Find best arrangement using bestArrangementGenerator
    console.log('\n🏆 Finding best arrangement...');
    let bestArrangement = null;
    let bestScore = -Infinity;

    if (combinedResults.length === 0) {
        console.log('⚠️ No valid 2-wild combinations found, using baseline cards only');

        // Fallback: use baseline cards only (no wild cards)
        const detector = new HandDetector(cards);
        const handResults = detector.detectAllHands();
        const sorter = new HandSorter();
        const sortResult = sorter.sortHandsByStrength(handResults.hands);
        const generator = new BestArrangementGenerator();
        const result = generator.generateBestArrangement(sortResult.sortedHands);

        bestArrangement = result.arrangement;
        bestScore = result.score;

    } else {
        // Test each 2-wild combination
        combinedResults.forEach((wildCombo, index) => {
            if (index % 10 === 0) {
                console.log(`   Testing combination ${index + 1}/${combinedResults.length}...`);
            }

            // Create full 17-card hand
            const fullHand = [...cards, ...wildCombo];

            // Generate and evaluate arrangement
            const detector = new HandDetector(fullHand);
            const handResults = detector.detectAllHands();
            const sorter = new HandSorter();
            const sortResult = sorter.sortHandsByStrength(handResults.hands);
            const generator = new BestArrangementGenerator();
            const result = generator.generateBestArrangement(sortResult.sortedHands);

            // Track best result
            if (result.arrangement && result.score > bestScore) {
                bestScore = result.score;
                bestArrangement = result.arrangement;
                bestArrangement.wildCards = wildCombo; // Track which wild cards were used

                console.log(`   🎯 New best score: ${bestScore} with wilds: ${wildCombo.map(c => c.rank + c.suit).join(', ')}`);
            }
        });
    }

    const endTime = performance.now();
    statistics.searchTime = endTime - startTime;

    // Final results
    console.log('\n🏆 ======== FINAL RESULTS ========');
    console.log(`Best Score: ${bestScore}`);
    if (bestArrangement && bestArrangement.wildCards) {
        console.log(`Wild Cards Used: ${bestArrangement.wildCards.map(c => c.rank + c.suit).join(', ')}`);
    }
    console.log(`Search Time: ${statistics.searchTime.toFixed(2)}ms`);
    console.log(`Efficiency Gain: ${statistics.bruteForceReduction}% reduction vs brute force`);

    if (bestArrangement) {
        console.log(`\nBest Arrangement:`);
        console.log(`   Back:   ${bestArrangement.back.handType} (${bestArrangement.back.cardCount} cards)`);
        console.log(`   Middle: ${bestArrangement.middle.handType} (${bestArrangement.middle.cardCount} cards)`);
        console.log(`   Front:  ${bestArrangement.front.handType} (${bestArrangement.front.cardCount} cards)`);
    }

    return {
        arrangement: bestArrangement,
        score: bestScore,
        statistics: statistics,
        wildCards: bestArrangement ? bestArrangement.wildCards : null
    };
}

/**
 * Combine results from both strategies and remove duplicates
 * @param {Array} strategy1Results - Results from Strategy 1
 * @param {Array} strategy2Results - Results from Strategy 2
 * @returns {Array} Combined and deduplicated results
 */
function combineAndDeduplicate(strategy1Results, strategy2Results) {
    const combinedResults = [...strategy1Results, ...strategy2Results];
    const uniqueResults = [];
    const seenCombinations = new Set();

    combinedResults.forEach(combo => {
        // Create a normalized key for this combination (sorted by card ID)
        const sortedCombo = [...combo].sort((a, b) => a.id.localeCompare(b.id));
        const comboKey = sortedCombo.map(c => `${c.rank}${c.suit}`).join(',');

        if (!seenCombinations.has(comboKey)) {
            seenCombinations.add(comboKey);
            uniqueResults.push(combo);
        }
    });

    return uniqueResults;
}

// Test function for the complete system
function testTwoWildBestArrangement() {
    console.log('\n🧪 Testing Complete Two Wild Best Arrangement System');

    // Use a realistic test case
    const testCards = [
        {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
        {id: 'K♠_2', rank: 'K', suit: '♠', value: 13, isWild: false},
        {id: 'Q♠_3', rank: 'Q', suit: '♠', value: 12, isWild: false},
        {id: 'J♠_4', rank: 'J', suit: '♠', value: 11, isWild: false},
        {id: '9♠_5', rank: '9', suit: '♠', value: 9, isWild: false},
        {id: 'A♥_6', rank: 'A', suit: '♥', value: 14, isWild: false},
        {id: 'A♦_7', rank: 'A', suit: '♦', value: 14, isWild: false},
        {id: 'K♥_8', rank: 'K', suit: '♥', value: 13, isWild: false},
        {id: 'K♦_9', rank: 'K', suit: '♦', value: 13, isWild: false},
        {id: '8♣_10', rank: '8', suit: '♣', value: 8, isWild: false},
        {id: '7♣_11', rank: '7', suit: '♣', value: 7, isWild: false},
        {id: '6♣_12', rank: '6', suit: '♣', value: 6, isWild: false},
        {id: '5♣_13', rank: '5', suit: '♣', value: 5, isWild: false},
        {id: '4♣_14', rank: '4', suit: '♣', value: 4, isWild: false},
        {id: '3♣_15', rank: '3', suit: '♣', value: 3, isWild: false}
    ];

    console.log(`\n📋 Test cards (${testCards.length}): ${testCards.map(c => c.rank + c.suit).join(', ')}`);

    const result = twoWildBestArrangement(testCards);

    console.log('\n📊 Test Results Summary:');
    console.log(`   Final Score: ${result.score}`);
    console.log(`   Wild Cards: ${result.wildCards ? result.wildCards.map(c => c.rank + c.suit).join(', ') : 'None'}`);
    console.log(`   Search Time: ${result.statistics.searchTime.toFixed(2)}ms`);
    console.log(`   Combinations Tested: ${result.statistics.totalCombinations}`);
    console.log(`   Efficiency: ${result.statistics.bruteForceReduction}% reduction`);

    return result;
}

// Quick test function with minimal cards for debugging
function quickTestTwoWild() {
    console.log('\n🚀 Quick Test - Two Wild Best Arrangement');

    // Minimal test case - use the 5 Jacks + 5 3's test that worked well
    const testCards = [
        // Five Jacks
        {id: 'J♠_1', rank: 'J', suit: '♠', value: 11, isWild: false},
        {id: 'J♥_2', rank: 'J', suit: '♥', value: 11, isWild: false},
        {id: 'J♦_3', rank: 'J', suit: '♦', value: 11, isWild: false},
        {id: 'J♣_4', rank: 'J', suit: '♣', value: 11, isWild: false},
        {id: 'J♠_5', rank: 'J', suit: '♠', value: 11, isWild: false}, // 5th Jack

        // Five 3's
        {id: '3♠_6', rank: '3', suit: '♠', value: 3, isWild: false},
        {id: '3♥_7', rank: '3', suit: '♥', value: 3, isWild: false},
        {id: '3♦_8', rank: '3', suit: '♦', value: 3, isWild: false},
        {id: '3♣_9', rank: '3', suit: '♣', value: 3, isWild: false},
        {id: '3♠_10', rank: '3', suit: '♠', value: 3, isWild: false}, // 5th 3

        // Scattered singles
        {id: 'A♥_11', rank: 'A', suit: '♥', value: 14, isWild: false},
        {id: 'Q♠_12', rank: 'Q', suit: '♠', value: 12, isWild: false},
        {id: '8♦_13', rank: '8', suit: '♦', value: 8, isWild: false},
        {id: '7♣_14', rank: '7', suit: '♣', value: 7, isWild: false},
        {id: '4♥_15', rank: '4', suit: '♥', value: 4, isWild: false}
    ];

    const result = twoWildBestArrangement(testCards);

    console.log('\n⚡ Quick Test Results:');
    console.log(`Score: ${result.score}, Time: ${result.statistics.searchTime.toFixed(1)}ms`);
    console.log(`Strategy 2 First-Layer: ${result.statistics.strategy2FirstLayer}/52`);

    return result;
}