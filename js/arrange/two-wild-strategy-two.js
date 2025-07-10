// js/arrange/two-wild-strategy-two.js
// Strategy 2: Nested wild candidate generation for comprehensive 2-wild optimization

/**
 * Execute Strategy 2: Nested wild candidate generation
 * @param {Array} cards - Array of 15 non-wild cards
 * @returns {Object} Results with 2-wild combinations and statistics
 */

function twoWildStrategyTwo(cards) {
    const firstLayerRelevantHands = ['threeOfAKind', 'natural4K', 'fiveOfAKind', 'sixOfAKind', 'sevenOfAKind',
    'eightOfAKind', 'straightFlush', 'sixCardStraightFlush', 'sevenCardStraightFlush', 'eightCardStraightFlush'];
    const secondLayerRelevantHands = [...firstLayerRelevantHands, 'straight'];
    console.log('\n🎯 ======== STRATEGY 2: NESTED WILD CANDIDATES ========');
    console.log(`Analyzing ${cards.length} cards using nested wild candidate approach`);

    const relevantHands = ['threeOfAKind', 'natural4K', 'fiveOfAKind', 'sixOfAKind', 'sevenOfAKind',
                            'eightOfAKind', 'straight', 'straightFlush', 'sixCardStraightFlush',
                            'sevenCardStraightFlush', 'eightCardStraightFlush'];

    // Step 1: Get first-layer wild candidates from 15 baseline cards
    console.log('\n📋 Step 1: First Wild Card - using 15 cards find subset candidates');
    console.log('DEBUG: About to call oneWildCandidates...');
    const firstResult = oneWildCandidates(cards);   // change 1
    console.log('DEBUG: oneWildCandidates returned:', firstResult);
    console.log('DEBUG: About to map wildCandidateDetails...');

    const firstLayerCandidates = firstResult.wildCandidates.map(cardString =>
        Analysis.createCardFromString(cardString)
    );
    const firstLayerCount = firstLayerCandidates.length; // Add this line

    console.log('DEBUG: firstLayerCandidates created, length:', firstLayerCandidates.length);
    console.log(`✅ Found ${firstLayerCandidates.length} first-layer candidates`);

    // return firstLayerCandidates; // Just return first layer for now


    const validTwoCardCombinations = [];

    // Step 2: For each first-layer candidate, find second-layer candidates
    console.log('\n📋 Step 2: Second Wild Card - using 16 cards');

    firstLayerCandidates.forEach((firstCard, index) => {
        console.log(`\n🔍 Testing first card ${index + 1}/${firstLayerCandidates.length}: ${firstCard.rank}${firstCard.suit}`);

        // Create 16-card hand (15 baseline + 1 first candidate)
        const sixteenCardHand = [...cards, firstCard];

        // Get second-layer candidates for this 16-card hand
        const secondResult = oneWildCandidates(sixteenCardHand);
        const secondLayerCandidates = secondResult.wildCandidates.map(cardString =>
            Analysis.createCardFromString(cardString)
        );

        console.log(`   Found ${secondLayerCandidates.length} second-layer candidates`);

        // Create two-card combinations: [firstCard, secondCard]
        secondLayerCandidates.forEach(secondCard => {
            validTwoCardCombinations.push([firstCard, secondCard]);
        });

        console.log(`   ✅ Added ${secondLayerCandidates.length} combinations with ${firstCard.rank}${firstCard.suit}`);
    });

    // Deduplicate combinations
    const dedupedCombinations = validTwoCardCombinations.filter((combo, index, array) => {
        const key = [combo[0].rank + combo[0].suit, combo[1].rank + combo[1].suit].sort().join(',');
        return array.findIndex(c =>
            [c[0].rank + c[0].suit, c[1].rank + c[1].suit].sort().join(',') === key
        ) === index;
    });

    console.log(`\n📋 Strategy 2 Results:`);
    console.log(`   Total 2-card combinations found: ${validTwoCardCombinations.length}`);
    console.log(`   After deduplication: ${dedupedCombinations.length}`);

    return {
        combinations: dedupedCombinations,
        firstLayerCount: firstLayerCount
    };

}

/**
 * Create a wild card object
 * @param {string} rank - Card rank
 * @param {string} suit - Card suit
 * @param {string} wildType - Type identifier for unique ID
 * @returns {Object} Wild card object
 */
function createWildCard(rank, suit, wildType) {
    return {
        id: `${rank}${suit}_wild_${wildType}`,
        rank: rank,
        suit: suit,
        value: getRankValue(rank),
        isWild: false,
        wasWild: true
    };
}

/**
 * Helper function to get rank value
 * @param {string} rank - Card rank
 * @returns {number} Numeric value
 */
function getRankValue(rank) {
    const values = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return values[rank];
}

// Test function
function testStrategyTwo() {
    console.log('\n🧪 Testing Strategy 2 Implementation');

    // Create test cards - smaller set for testing
    //    const testCards = [
    //        // Scattered singles (no pairs, no sequences)
    //        {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
    //        {id: '9♥_2', rank: '9', suit: '♥', value: 9, isWild: false},
    //        {id: '6♦_3', rank: '6', suit: '♦', value: 6, isWild: false},
    //        {id: '3♣_4', rank: '3', suit: '♣', value: 3, isWild: false},
    //        {id: 'K♥_5', rank: 'K', suit: '♥', value: 13, isWild: false},
    //        {id: '7♦_6', rank: '7', suit: '♦', value: 7, isWild: false},
    //        {id: '4♠_7', rank: '4', suit: '♠', value: 4, isWild: false},
    //        {id: 'J♣_8', rank: 'J', suit: '♣', value: 11, isWild: false},
    //        {id: '5♥_9', rank: '5', suit: '♥', value: 5, isWild: false},
    //        {id: '2♦_10', rank: '2', suit: '♦', value: 2, isWild: false},
    //        {id: '10♠_11', rank: '10', suit: '♠', value: 10, isWild: false},
    //        {id: '8♣_12', rank: '8', suit: '♣', value: 8, isWild: false},
    //        {id: 'Q♥_13', rank: 'Q', suit: '♥', value: 12, isWild: false},
    //        {id: '6♠_14', rank: '6', suit: '♠', value: 6, isWild: false},
    //        {id: '9♦_15', rank: '9', suit: '♦', value: 9, isWild: false}
    //    ];

    //    const testCards = [
    //        // Five Jacks
    //        {id: 'J♠_1', rank: 'J', suit: '♠', value: 11, isWild: false},
    //        {id: 'J♥_2', rank: 'J', suit: '♥', value: 11, isWild: false},
    //        {id: 'J♦_3', rank: 'J', suit: '♦', value: 11, isWild: false},
    //        {id: 'J♣_4', rank: 'J', suit: '♣', value: 11, isWild: false},
    //        {id: 'J♠_5', rank: 'J', suit: '♠', value: 11, isWild: false}, // 5th Jack (duplicate spade)
    //
    //        // Five 3's
    //        {id: '3♠_6', rank: '3', suit: '♠', value: 3, isWild: false},
    //        {id: '3♥_7', rank: '3', suit: '♥', value: 3, isWild: false},
    //        {id: '3♦_8', rank: '3', suit: '♦', value: 3, isWild: false},
    //        {id: '3♣_9', rank: '3', suit: '♣', value: 3, isWild: false},
    //        {id: '3♠_10', rank: '3', suit: '♠', value: 3, isWild: false}, // 5th 3 (duplicate spade)
    //
    //        // Scattered singles
    //        {id: 'A♥_11', rank: 'A', suit: '♥', value: 14, isWild: false},
    //        {id: 'Q♠_12', rank: 'Q', suit: '♠', value: 12, isWild: false},
    //        {id: '8♦_13', rank: '8', suit: '♦', value: 8, isWild: false},
    //        {id: '7♣_14', rank: '7', suit: '♣', value: 7, isWild: false},
    //        {id: '4♥_15', rank: '4', suit: '♥', value: 4, isWild: false}
    //    ];

    //    const testCards = [
    //        // Three Aces (close to 4K)
    //        {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
    //        {id: 'A♥_2', rank: 'A', suit: '♥', value: 14, isWild: false},
    //        {id: 'A♦_3', rank: 'A', suit: '♦', value: 14, isWild: false},
    //        // Three Kings (close to 4K)
    //        {id: 'K♠_4', rank: 'K', suit: '♠', value: 13, isWild: false},
    //        {id: 'K♥_5', rank: 'K', suit: '♥', value: 13, isWild: false},
    //        {id: 'K♦_6', rank: 'K', suit: '♦', value: 13, isWild: false},
    //        // Scattered singles
    //        {id: '9♣_7', rank: '9', suit: '♣', value: 9, isWild: false},
    //        {id: '7♦_8', rank: '7', suit: '♦', value: 7, isWild: false},
    //        {id: '5♥_9', rank: '5', suit: '♥', value: 5, isWild: false},
    //        {id: '3♣_10', rank: '3', suit: '♣', value: 3, isWild: false},
    //        {id: '8♠_11', rank: '8', suit: '♠', value: 8, isWild: false},
    //        {id: '6♥_12', rank: '6', suit: '♥', value: 6, isWild: false},
    //        {id: '4♦_13', rank: '4', suit: '♦', value: 4, isWild: false},
    //        {id: '2♣_14', rank: '2', suit: '♣', value: 2, isWild: false},
    //        {id: '10♠_15', rank: '10', suit: '♠', value: 10, isWild: false}
    //    ];

    //    const testCards = [
    //        // Spades sequence with gaps
    //        {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
    //        {id: 'K♠_2', rank: 'K', suit: '♠', value: 13, isWild: false},
    //        {id: 'Q♠_3', rank: 'Q', suit: '♠', value: 12, isWild: false},
    //        {id: '10♠_4', rank: '10', suit: '♠', value: 10, isWild: false},
    //        {id: '8♠_5', rank: '8', suit: '♠', value: 8, isWild: false},
    //        {id: '6♠_6', rank: '6', suit: '♠', value: 6, isWild: false},
    //        // Random other suits
    //        {id: '9♥_7', rank: '9', suit: '♥', value: 9, isWild: false},
    //        {id: '7♦_8', rank: '7', suit: '♦', value: 7, isWild: false},
    //        {id: '5♣_9', rank: '5', suit: '♣', value: 5, isWild: false},
    //        {id: '4♥_10', rank: '4', suit: '♥', value: 4, isWild: false},
    //        {id: '3♦_11', rank: '3', suit: '♦', value: 3, isWild: false},
    //        {id: '2♣_12', rank: '2', suit: '♣', value: 2, isWild: false},
    //        {id: 'J♥_13', rank: 'J', suit: '♥', value: 11, isWild: false},
    //        {id: '9♦_14', rank: '9', suit: '♦', value: 9, isWild: false},
    //        {id: '7♣_15', rank: '7', suit: '♣', value: 7, isWild: false}
    //    ];

    //    const testCards = [
    //        // Completely scattered, no patterns
    //        {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
    //        {id: 'K♥_2', rank: 'K', suit: '♥', value: 13, isWild: false},
    //        {id: 'Q♦_3', rank: 'Q', suit: '♦', value: 12, isWild: false},
    //        {id: 'J♣_4', rank: 'J', suit: '♣', value: 11, isWild: false},
    //        {id: '9♠_5', rank: '9', suit: '♠', value: 9, isWild: false},
    //        {id: '7♥_6', rank: '7', suit: '♥', value: 7, isWild: false},
    //        {id: '5♦_7', rank: '5', suit: '♦', value: 5, isWild: false},
    //        {id: '3♣_8', rank: '3', suit: '♣', value: 3, isWild: false},
    //        {id: '2♠_9', rank: '2', suit: '♠', value: 2, isWild: false},
    //        {id: '8♥_10', rank: '8', suit: '♥', value: 8, isWild: false},
    //        {id: '6♦_11', rank: '6', suit: '♦', value: 6, isWild: false},
    //        {id: '4♣_12', rank: '4', suit: '♣', value: 4, isWild: false},
    //        {id: '10♠_13', rank: '10', suit: '♠', value: 10, isWild: false},
    //        {id: '9♥_14', rank: '9', suit: '♥', value: 9, isWild: false},
    //        {id: '8♦_15', rank: '8', suit: '♦', value: 8, isWild: false}
    //    ];


    console.log(`\n📋 Test cards: ${testCards.map(c => c.rank + c.suit).join(', ')}`);

    const results = twoWildStrategyTwo(testCards);

    console.log(`\n📋 Strategy 2 Results:`);
    console.log(`   First-layer candidates: ${results.firstLayerCount}/52`);
    console.log(`   2-card combinations found: ${results.combinations.length}`);
    // console.log(`   After deduplication: ${results.dedupedCombinations.length}`);

    // Show first few results
    results.combinations.slice(0, 25).forEach((combo, index) => {
        console.log(`   ${index + 1}: ${combo.map(c => c.rank + c.suit).join(', ')}`);
    });


    if (results.length > 25) {
        console.log(`   ... and ${results.length - 25} more combinations`);
    }

    return results;
}