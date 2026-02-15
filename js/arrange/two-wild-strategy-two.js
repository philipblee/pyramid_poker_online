// js/arrange/two-wild-strategy-two.js
// Strategy 2: Nested wild candidate generation for comprehensive 2-wild optimization

/**
 * Execute Strategy 2: Nested wild candidate generation
 * @param {Array} cards - Array of 15 non-wild cards
 * @returns {Object} Results with 2-wild combinations and statistics
 */

function twoWildStrategyTwo(cards) {
    const startTime = performance.now();

    const firstLayerRelevantHands = ['threeOfAKind', 'natural4K', 'fiveOfAKind', 'sixOfAKind', 'sevenOfAKind',
        'eightOfAKind', 'straightFlush', 'sixCardStraightFlush', 'sevenCardStraightFlush', 'eightCardStraightFlush'];
    const secondLayerRelevantHands = [...firstLayerRelevantHands, 'straight'];

    const relevantHands = ['threeOfAKind', 'natural4K', 'fiveOfAKind', 'sixOfAKind', 'sevenOfAKind',
                            'eightOfAKind', 'straight', 'straightFlush', 'sixCardStraightFlush',
                            'sevenCardStraightFlush', 'eightCardStraightFlush'];

    // Step 1: Get first-layer wild candidates from 15 baseline cards
//    console.log('\n📋 Step 1: First Wild Card - using 15 cards find subset candidates');
    const step1Start = performance.now();
    const firstResult = oneWildCandidates(cards);
    const step1End = performance.now();

    const firstLayerCandidates = firstResult.wildCandidatesRanked.map(item => ({
        ...Analysis.createCardFromString(item.card),
        handRank: item.rank
    }));

    const firstLayerCount = firstLayerCandidates.length;

    const validTwoCardCombinations = [];

    // Step 2: For each first-layer candidate, find second-layer candidates
    const step2Start = performance.now();

    firstLayerCandidates.forEach((firstCard, index) => {
        const iterationStart = performance.now();

        // Create 16-card hand (15 baseline + 1 first candidate)
        const sixteenCardHand = [...cards, firstCard];

        // Get second-layer candidates for this 16-card hand
        const secondResult = oneWildCandidates(sixteenCardHand);

        const secondLayerCandidates = secondResult.wildCandidatesRanked.map(item => ({
            ...Analysis.createCardFromString(item.card),
            handRank: item.rank
        }));

        // Create two-card combinations: [firstCard, secondCard]
        secondLayerCandidates.forEach(secondCard => {
            validTwoCardCombinations.push({
                cards: [firstCard, secondCard],
                combinationRank: firstCard.handRank + secondCard.handRank
            });
        });

        const iterationEnd = performance.now();
    });

    const step2End = performance.now();

    // Sort by combinationRank descending before dedup
    validTwoCardCombinations.sort((a, b) => b.combinationRank - a.combinationRank);

    // Deduplicate using .cards
    const seenKeys = new Set();
    const dedupedCombinations = validTwoCardCombinations.filter(combo => {
        const key = [combo.cards[0].rank + combo.cards[0].suit,
                     combo.cards[1].rank + combo.cards[1].suit].sort().join(',');
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
    });

    const totalEnd = performance.now();

    return {
        combinations: dedupedCombinations.map(c => c.cards),
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
