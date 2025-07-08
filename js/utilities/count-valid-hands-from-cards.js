// js/utilities/count-valid-hands-from-cards.js
// Adapter to use count-valid-hands.js with card objects instead of strings

/**
 * Count valid hands from card objects (adapter for count-valid-hands.js)
 * @param {Array} cardObjects - Array of card objects
 * @returns {Object} Hand counts object (same format as count-valid-hands)
 */
function countValidHandsFromCards(cardObjects) {
    // Step 1: Convert to Card Model format (reuse existing proven function)
    const properCards = convertToCardModel(cardObjects);

    // Step 2: Filter out wild cards and convert to string format
    const cardString = properCards
        .filter(card => !card.isWild)
        .map(card => card.rank + card.suit)
        .join(' ');

    // Step 3: Use existing proven count-valid-hands logic
    const counter = new CountValidHands();
    const result = counter.calculateExpectedCounts(cardString);

    // Step 4: Add natural4K calculation (like analyze-cards.js)
    result.natural4K = counter.calculateNatural4K(cardString);

    return result;
}

// Test function
function testCountValidHandsFromCards() {
    console.log('\n🧪 Testing Count Valid Hands From Cards');

    // Test with the quad cards we've been using
    const test16CardsWithQuads = [
        // Four Aces (4K #1)
        {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
        {id: 'A♥_2', rank: 'A', suit: '♥', value: 14, isWild: false},
        {id: 'A♦_3', rank: 'A', suit: '♦', value: 14, isWild: false},
        {id: 'A♣_4', rank: 'A', suit: '♣', value: 14, isWild: false},

        // Four Kings (4K #2)
        {id: 'K♠_5', rank: 'K', suit: '♠', value: 13, isWild: false},
        {id: 'K♥_6', rank: 'K', suit: '♥', value: 13, isWild: false},
        {id: 'K♦_7', rank: 'K', suit: '♦', value: 13, isWild: false},
        {id: 'K♣_8', rank: 'K', suit: '♣', value: 13, isWild: false},

        // Random scattered cards (8 more)
        {id: '7♠_9', rank: '7', suit: '♠', value: 7, isWild: false},
        {id: '3♥_10', rank: '3', suit: '♥', value: 3, isWild: false},
        {id: '8♦_11', rank: '8', suit: '♦', value: 8, isWild: false},
        {id: '5♣_12', rank: '5', suit: '♣', value: 5, isWild: false},
        {id: '2♠_13', rank: '2', suit: '♠', value: 2, isWild: false},
        {id: '9♥_14', rank: '9', suit: '♥', value: 9, isWild: false},
        {id: '6♦_15', rank: '6', suit: '♦', value: 6, isWild: false},
        {id: '4♣_16', rank: '4', suit: '♣', value: 4, isWild: false}
    ];

    console.log(`\n📋 Testing with ${test16CardsWithQuads.length} card objects`);

    // Test the adapter
    const result = countValidHandsFromCards(test16CardsWithQuads);

    console.log('\n📊 Results:');
    console.log(`   Four of a Kind: ${result.fourOfAKind}`);
    console.log(`   Five of a Kind: ${result.fiveOfAKind}`);
    console.log(`   Straights: ${result.straight}`);
    console.log(`   Total hands: ${result.total}`);

    return result;
}