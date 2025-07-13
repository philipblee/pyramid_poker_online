// js/arrange/two-wild-best-from-cards.js
// Find best arrangement for hands with exactly two wild cards using smart strategies
// Works directly with card objects from the game

/**
 * Find best arrangement for a hand with two wild cards using smart strategy approach
 * @param {Array} cardObjects - Array of 17 card objects (including 2 wilds)
 * @returns {Object} Best arrangement result (same format as one-wild version)
 */
function FindBestSetupTwoWild(cardObjects) {
    console.log(`\n🧠 ======== TWO WILD SMART ARRANGEMENT - FROM CARDS ========`);

    // STEP 1: Convert to Card Model format FIRST
    const properCardObjects = convertToCardModel(cardObjects);

    // STEP 2: Extract wild and non-wild cards from converted objects
    const wildCards = properCardObjects.filter(card => card.isWild);
    const nonWildCards = properCardObjects.filter(card => !card.isWild);

//    if (wildCards.length !== 2) {
//        console.log(`❌ Expected 2 wild cards, found ${wildCards.length}`);
//        return {
//            arrangement: null,
//            score: -Infinity,
//            wildCards: null,
//            success: false,
//            statistics: null
//        };
//    }
//
//    if (nonWildCards.length !== 15) {
//        console.log(`❌ Expected 15 non-wild cards, found ${nonWildCards.length}`);
//        return {
//            arrangement: null,
//            score: -Infinity,
//            wildCards: null,
//            success: false,
//            statistics: null
//        };
//    }

    // STEP 3: Get smart 2-wild combinations using both strategies
    console.log(`\n📋 Step 3: Getting smart 2-wild combinations...`);

    // Strategy 1: Same-suit combinations for straight flushes
    console.log(`   Running Strategy 1...`);

    const result = twoWildStrategyOne(nonWildCards);        // NEW: object
    const strategy1Results = result.wildCandidates;           // Extract array

    // Strategy 2: Nested wild candidates for comprehensive coverage
    console.log(`   Running Strategy 2...`);
    const strategy2Result = twoWildStrategyTwo(nonWildCards);
    const strategy2Results = strategy2Result.combinations;

    // Combine and deduplicate
    console.log(`   Combining strategies...`);
    const allCombinations = combineAndDeduplicate(strategy1Results, strategy2Results);

    console.log(`✅ Generated ${allCombinations.length} smart 2-wild combinations`);
    console.log(`   Strategy 1: ${strategy1Results.length} combinations`);
    console.log(`   Strategy 2: ${strategy2Results.length} combinations (${strategy2Result.firstLayerCount}/52 first-layer)`);

    if (allCombinations.length === 0) {
        console.log(`❌ No smart combinations found`);
        return {
            arrangement: null,
            score: -Infinity,
            wildCards: null,
            success: false,
            statistics: null
        };
    }

    // STEP 4: Process each smart 2-wild combination (same proven logic as one-wild)
    console.log(`\n🔄 Step 4: Processing ${allCombinations.length} combinations (smart subset)...`);
    const results = [];

    allCombinations.forEach((combination, index) => {
        // Progress indicator every 10 combinations
        if ((index + 1) % 10 === 0) {
            console.log(`   Progress: ${index + 1}/${allCombinations.length} combinations processed...`);
        }

        try {
            // Create two substituted cards
            const substitutedCard1 = createCardFromObject(combination[0], wildCards[0].id);
            const substitutedCard2 = createCardFromObject(combination[1], wildCards[1].id);
            const cards = [...nonWildCards, substitutedCard1, substitutedCard2];

            // Run HandDetector (auto-sorted)
            const detector = new HandDetector(cards);
            const handResults = detector.detectAllHands();

            // Run BestArrangementGenerator
            const generator = new BestArrangementGenerator();
            const arrangementResult = generator.generateBestArrangement(handResults.hands, cards);

            if (arrangementResult.success) {
                results.push({
                    wildCards: [combination[0].rank + combination[0].suit, combination[1].rank + combination[1].suit],
                    arrangement: arrangementResult.arrangement,
                    score: arrangementResult.score,
                    success: true,
                    statistics: arrangementResult.statistics,
                    handCount: handResults.total
                });
            } else {
                results.push({
                    wildCards: [combination[0].rank + combination[0].suit, combination[1].rank + combination[1].suit],
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
                wildCards: ['ERROR', 'ERROR'],
                arrangement: null,
                score: -Infinity,
                success: false,
                statistics: null,
                handCount: 0,
                error: error.message
            });
        }
    });

    // STEP 5: Sort results by score and summarize (same as one-wild)
    console.log(`\n📊 Step 5: Analyzing smart results...`);
    results.sort((a, b) => b.score - a.score);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n✅ ======== SMART SUMMARY ========`);
    console.log(`Total combinations processed: ${results.length}`);
    console.log(`Successful arrangements: ${successful.length}`);
    console.log(`Failed attempts: ${failed.length}`);

    if (successful.length > 0) {
        const best = successful[0];
        console.log(`\n🏆 Best Result (Smart Two-Wild):`);
        console.log(`   Wild cards: ${best.wildCards.join(', ')}`);
        console.log(`   Score: ${best.score}`);
        console.log(`   Back: ${best.arrangement.back.handType} (${best.arrangement.back.cardCount} cards)`);
        console.log(`   Middle: ${best.arrangement.middle.handType} (${best.arrangement.middle.cardCount} cards)`);
        console.log(`   Front: ${best.arrangement.front.handType} (${best.arrangement.front.cardCount} cards)`);

        // Show top 5 results for smart approach
        console.log(`\n🥇 Top 5 Results (Smart Two-Wild):`);
        successful.slice(0, 5).forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.wildCards.join(', ')}: ${result.score} points`);
        });

        // Show optimal score distribution
        const optimalScore = best.score;
        const optimalResults = successful.filter(r => r.score === optimalScore);
        console.log(`\n🎯 Optimal Score Analysis:`);
        console.log(`   Optimal score: ${optimalScore} points`);
        console.log(`   Combinations achieving optimal: ${optimalResults.length}/${successful.length}`);
        console.log(`   Optimal wild combinations: ${optimalResults.map(r => r.wildCards.join(', ')).slice(0, 3).join(' | ')}`);

        // Return same format as one-wild version
        console.log(`🔍 DEBUG: Returning best result from smart success block`);
        return {
            arrangement: best.arrangement,
            score: best.score,
            wildCards: best.wildCards,
            success: true,
            statistics: best.statistics
        };

    } else {
        console.log(`❌ No successful arrangements found!`);
        console.log(`🔍 DEBUG: Returning null from smart failure block`);
        return {
            arrangement: null,
            score: -Infinity,
            wildCards: null,
            success: false,
            statistics: null
        };
    }
}

/**
 * Create a card object from card object representation (adapted from one-wild)
 * @param {Object} cardObject - Card object from strategy
 * @param {string} originalId - ID from the original wild card
 * @returns {Object} Card object with wasWild flag
 */
function createCardFromObject(cardObject, originalId) {
    const substitutedCard = {
        id: originalId,
        rank: cardObject.rank,
        suit: cardObject.suit,
        isWild: false,
        wasWild: true,  // Visual indication flag
        value: cardObject.value
    };

    return substitutedCard;
}

/**
 * Combine results from both strategies and remove duplicates (same as main orchestrator)
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

/**
 * Quick test function for console use - uses the proven 5J+5×3 test case
 */
function testTwoWildBestFromCards() {
    console.log('\n🧪 Testing Two Wild Best From Cards with proven test case');

    //    // Create 17-card hand (15 + 2 wilds) using the 5J+5×3 test that worked well
    //    const testCards = [
    //        // Five Jacks
    //        {id: 'J♠_1', rank: 'J', suit: '♠', value: 11, isWild: false},
    //        {id: 'J♥_2', rank: 'J', suit: '♥', value: 11, isWild: false},
    //        {id: 'J♦_3', rank: 'J', suit: '♦', value: 11, isWild: false},
    //        {id: 'J♣_4', rank: 'J', suit: '♣', value: 11, isWild: false},
    //        {id: 'J♠_5', rank: 'J', suit: '♠', value: 11, isWild: false}, // 5th Jack
    //
    //        // Five 3's
    //        {id: '3♠_6', rank: '3', suit: '♠', value: 3, isWild: false},
    //        {id: '3♥_7', rank: '3', suit: '♥', value: 3, isWild: false},
    //        {id: '3♦_8', rank: '3', suit: '♦', value: 3, isWild: false},
    //        {id: '3♣_9', rank: '3', suit: '♣', value: 3, isWild: false},
    //        {id: '3♠_10', rank: '3', suit: '♠', value: 3, isWild: false}, // 5th 3
    //
    //        // Scattered singles
    //        {id: 'A♥_11', rank: 'A', suit: '♥', value: 14, isWild: false},
    //        {id: 'Q♠_12', rank: 'Q', suit: '♠', value: 12, isWild: false},
    //        {id: '8♦_13', rank: '8', suit: '♦', value: 8, isWild: false},
    //        {id: '7♣_14', rank: '7', suit: '♣', value: 7, isWild: false},
    //        {id: '4♥_15', rank: '4', suit: '♥', value: 4, isWild: false},
    //
    //        // Two wild cards
    //        {id: 'WILD_1', rank: '', suit: '', value: 0, isWild: true},
    //        {id: 'WILD_2', rank: '', suit: '', value: 0, isWild: true}
    //    ];

    const testCards = [
        // Four 10's (already 4K, could become 5K)
        {id: '10♠_1', rank: '10', suit: '♠', value: 10, isWild: false},
        {id: '10♥_2', rank: '10', suit: '♥', value: 10, isWild: false},
        {id: '10♦_3', rank: '10', suit: '♦', value: 10, isWild: false},
        {id: '10♣_4', rank: '10', suit: '♣', value: 10, isWild: false},
        // Scattered other cards
        {id: 'A♠_5', rank: 'A', suit: '♠', value: 14, isWild: false},
        {id: 'K♥_6', rank: 'K', suit: '♥', value: 13, isWild: false},
        {id: 'Q♦_7', rank: 'Q', suit: '♦', value: 12, isWild: false},
        {id: 'J♣_8', rank: 'J', suit: '♣', value: 11, isWild: false},
        {id: '9♠_9', rank: '9', suit: '♠', value: 9, isWild: false},
        {id: '8♥_10', rank: '8', suit: '♥', value: 8, isWild: false},
        {id: '7♦_11', rank: '7', suit: '♦', value: 7, isWild: false},
        {id: '6♣_12', rank: '6', suit: '♣', value: 6, isWild: false},
        {id: '5♠_13', rank: '5', suit: '♠', value: 5, isWild: false},
        {id: '4♥_14', rank: '4', suit: '♥', value: 4, isWild: false},
        {id: '3♦_15', rank: '3', suit: '♦', value: 3, isWild: false},

        // Two wild cards
        {id: 'WILD_1', rank: '', suit: '', value: 0, isWild: true},
        {id: 'WILD_2', rank: '', suit: '', value: 0, isWild: true}
    ];


    console.log(`\n📋 Test cards (${testCards.length}): 5J + 5×3 + 5 singles + 2 wilds`);

    const result = twoWildBestFromCards(testCards);

    console.log('\n📊 Test Results Summary:');
    console.log(`   Success: ${result.success}`);
    if (result.success) {
        console.log(`   Final Score: ${result.score}`);
        console.log(`   Wild Cards: ${result.wildCards.join(', ')}`);
        console.log(`   Back: ${result.arrangement.back.handType}`);
        console.log(`   Middle: ${result.arrangement.middle.handType}`);
        console.log(`   Front: ${result.arrangement.front.handType}`);
    } else {
        console.log(`   Error: No successful arrangements found`);
    }

    return result;
}

/**
 * Find best arrangement for a hand with two wild cards using case ID (wrapper for backward compatibility)
 * @param {number} caseId - Test case ID from two-wild-test-cases.js
 * @returns {Object} Best arrangement result (same format as twoWildBestFromCards)
 */
function twoWildBestFromCaseId(caseId) {
    console.log(`\n🎯 ======== TWO WILD BEST ARRANGEMENT - CASE ${caseId} ========`);

    // Get test case
    const testCase = TWO_WILD_TEST_CASES.find(t => t.id === caseId);
    if (!testCase) {
        console.log(`❌ Test case ${caseId} not found`);
        return {
            arrangement: null,
            score: -Infinity,
            wildCards: null,
            success: false,
            statistics: null
        };
    }

    // Parse the cards string into card objects
    const cardObjects = CardParser.parseCardString(testCase.cards);
    console.log(`✅ Parsed ${cardObjects.length} card objects from case ${caseId}`);

    // Call the main function
    return twoWildBestFromCards(cardObjects);
}