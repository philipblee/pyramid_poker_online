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

    // Add this right before the return statement
    console.log(`\n🔍 DEBUG: Complete list of 2-card combinations (in order):`);
    dedupedCombinations.forEach((combo, index) => {
        console.log(`   ${index + 1}: [${combo[0].rank}${combo[0].suit}, ${combo[1].rank}${combo[1].suit}]`);
    });


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