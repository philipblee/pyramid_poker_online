// js/arrange/two-wild-strategy-one.js
// Strategy 1: Find same-suit 2-wild combinations that create 5-8 card straight flushes

/**
 * Execute Strategy 1: Same-suit 2-wild combinations for straight flushes
 * @param {Array} cards - Array of 15 non-wild cards
 * @returns {Array} Array of 2-card combinations that improve straight flush count
 */
function twoWildStrategyOne(cards) {
    console.log('\n🎯 ======== STRATEGY 1: SAME-SUIT STRAIGHT FLUSHES ========');
    console.log(`Analyzing ${cards.length} cards for 2-wild straight flush opportunities`);

    // Get baseline straight flush count
    const baselineCount = countStraightFlushes(cards);
    console.log(`📊 Baseline 5-8 card straight flushes: ${baselineCount}`);

    const validCombinations = [];

    // Test same-suit combinations only (312 total vs 1,326)
    for (let suit of ['♠', '♥', '♦', '♣']) {
        console.log(`\n🔍 Testing ${suit} suit combinations...`);

        const suitCombos = generateSameSuitCombinations(suit, cards);
        console.log(`   Generated ${suitCombos.length} same-suit combinations`);

        suitCombos.forEach(combo => {
            const testCards = [...cards, ...combo];
            const testCount = countStraightFlushes(testCards);

            if (testCount > baselineCount) {
                validCombinations.push({
                    cards: combo,
                    suit: suit,
                    baselineCount: baselineCount,
                    improvedCount: testCount,
                    improvement: testCount - baselineCount
                });

                console.log(`   ✅ Found improvement: ${combo.map(c => c.rank + c.suit).join(', ')} (+${testCount - baselineCount})`);
            }
        });
    }

    console.log(`\n📋 Strategy 1 Results:`);
    console.log(`   Valid combinations found: ${validCombinations.length}`);
    console.log(`   Expected range: 0-5 combinations`);

    // Sort by improvement (highest first)
    validCombinations.sort((a, b) => b.improvement - a.improvement);

    // Return just the card combinations
    return validCombinations.map(combo => combo.cards);
}

/**
 * Generate all same-suit 2-card combinations for a given suit
 * @param {string} suit - Suit to generate combinations for
 * @param {Array} existingCards - Cards already in hand (to avoid duplicates)
 * @returns {Array} Array of 2-card combinations
 */
function generateSameSuitCombinations(suit, existingCards) {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    // Get ranks already used in this suit
    const usedRanks = new Set(
        existingCards
            .filter(card => card.suit === suit)
            .map(card => card.rank)
    );

    // Get available ranks for this suit
    const availableRanks = ranks.filter(rank => !usedRanks.has(rank));

    const combinations = [];

    // Generate all 2-card combinations from available ranks
    for (let i = 0; i < availableRanks.length; i++) {
        for (let j = i + 1; j < availableRanks.length; j++) {
            const card1 = createWildCard(availableRanks[i], suit, 1);
            const card2 = createWildCard(availableRanks[j], suit, 2);

            combinations.push([card1, card2]);
        }
    }

    return combinations;
}

/**
 * Count 5-8 card straight flushes in a hand
 * @param {Array} cards - Cards to analyze
 * @returns {number} Count of 5-8 card straight flushes
 */
function countStraightFlushes(cards) {
    // Use existing HandDetector
    const detector = new HandDetector(cards);
    const results = detector.detectAllHands();

    let straightFlushCount = 0;

    results.hands.forEach(hand => {
        if (isStraightFlush(hand) && hand.cardCount >= 5 && hand.cardCount <= 8) {
            straightFlushCount++;
        }
    });

    return straightFlushCount;
}

/**
 * Check if a hand is a straight flush
 * @param {Object} hand - Hand to check
 * @returns {boolean} True if hand is a straight flush
 */
function isStraightFlush(hand) {
    return hand.handType === 'Straight Flush' ||
           hand.handType.includes('Straight Flush');
}

/**
 * Create a wild card object
 * @param {string} rank - Card rank
 * @param {string} suit - Card suit
 * @param {number} wildIndex - Index for unique ID
 * @returns {Object} Wild card object
 */
function createWildCard(rank, suit, wildIndex) {
    return {
        id: `${rank}${suit}_wild${wildIndex}`,
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
function testStrategyOne() {
    console.log('\n🧪 Testing Strategy 1 Implementation');

    // Create test cards that could form straight flush with 2 wilds
    const testCards = [
        {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
        {id: 'K♠_2', rank: 'K', suit: '♠', value: 13, isWild: false},
        {id: 'Q♠_3', rank: 'Q', suit: '♠', value: 12, isWild: false},
        {id: '9♠_4', rank: '9', suit: '♠', value: 9, isWild: false},
        {id: '8♠_5', rank: '8', suit: '♠', value: 8, isWild: false},
        // Add some other suits
        {id: '7♥_6', rank: '7', suit: '♥', value: 7, isWild: false},
        {id: '6♥_7', rank: '6', suit: '♥', value: 6, isWild: false},
        {id: '5♦_8', rank: '5', suit: '♦', value: 5, isWild: false}
    ];

    console.log(`\n📋 Test cards: ${testCards.map(c => c.rank + c.suit).join(', ')}`);

    const results = twoWildStrategyOne(testCards);

    console.log(`\n📊 Strategy 1 Test Results:`);
    console.log(`   Combinations found: ${results.length}`);

    results.forEach((combo, index) => {
        console.log(`   ${index + 1}: ${combo.map(c => c.rank + c.suit).join(', ')}`);
    });

    return results;
}