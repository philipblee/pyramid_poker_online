// js/arrange/parameterized-wild-candidates.js
// Fixed wild candidates generator using individual hand type compari
/**
 * Generate wild card candidates using improved individual hand type comparison
 * @param {Array} cardObjects - Array of card objects (16 non-wild cards)
 * @param {Array} relevantHandTypes - Array of hand types to consider (e.g., ['fourOfAKind', 'fiveOfAKind', 'straight'])
 * @returns {Object} Results with smart candidates and statistics
 */
function parameterizedWildCandidates(cardObjects, relevantHandTypes = null) {
    console.log('\n🎯 ======== PARAMETERIZED WILD CANDIDATES ========');
    console.log(`Analyzing ${cardObjects.length} card objects with individual hand type comparison`);

    // Use default relevant hand types if none provided
    const handTypes = relevantHandTypes || getDefaultRelevantHandTypes();
    console.log(`📋 Relevant hand types: ${handTypes.join(', ')}`);

    // Step 1: Get baseline hand counts using our new adapter
    console.log('\n📊 Step 1: Getting baseline hand counts...');
    const baselineCounts = countValidHandsFromCards(cardObjects);

    console.log('🔢 Baseline relevant hand counts:');
    handTypes.forEach(handType => {
        const count = baselineCounts[handType] || 0;
        console.log(`   ${handType}: ${count}`);
    });

    // Step 2: Test each possible wild card substitution
    console.log('\n🔄 Step 2: Testing all 52 possible wild cards...');
    const allCards = generateAll52Cards();
    const wildCandidates = [];
    const rejectedCards = [];

    allCards.forEach((cardString, index) => {
        // Convert card string to card object
        const wildCard = createCardObjectFromString(cardString);
        console.log("Trying this card:", wildCard)

        // Create test hand (16 + 1 wild = 17 cards)
        const testCards = [...cardObjects, wildCard];

        // Get hand counts for test case
        const testCounts = countValidHandsFromCards(testCards);

        // Check if ANY relevant hand type improved
        let improved = false;
        let improvementDetails = [];

        handTypes.forEach(handType => {
            const baselineCount = baselineCounts[handType] || 0;
            const testCount = testCounts[handType] || 0;

            if (testCount > baselineCount) {
                improved = true;
                improvementDetails.push(`${handType}: ${baselineCount} → ${testCount} (+${testCount - baselineCount})`);
            }
        });

        // Accept if ANY relevant hand type improved
        if (improved) {
            console.log(`   ✅Card Accepted: ${cardString}`);
            wildCandidates.push({
                card: cardString,
                cardObject: wildCard,
                improvements: improvementDetails
            });

            if (improvementDetails.length === 1) {
                console.log(`   ✅ ${cardString}: ${improvementDetails[0]}`);
            } else {
                console.log(`   ✅ ${cardString}: ${improvementDetails.length} improvements`);
            }
        } else {
            rejectedCards.push(cardString);
            console.log(`   ✅ Rejected Card: ${cardString}`);
        }

        // Progress indicator
        if ((index + 1) % 13 === 0) {
            console.log(`   Progress: ${index + 1}/52 cards tested...`);
        }
    });

    // Step 3: Results
    const results = {
        baseline: cardObjects,
        baselineCounts: baselineCounts,
        relevantHandTypes: handTypes,
        wildCandidates: wildCandidates.map(c => c.card), // Just the card strings
        wildCandidateDetails: wildCandidates, // Full details with improvements
        wildCandidatesCount: wildCandidates.length,
        rejectedCards: rejectedCards,
        rejectedCount: rejectedCards.length,
        efficiency: ((52 - wildCandidates.length) / 52 * 100).toFixed(1)
    };

    console.log(`\n📋 ======== RESULTS ========`);
    console.log(`✅ Wild candidates: ${results.wildCandidatesCount}/52 (${((results.wildCandidatesCount/52)*100).toFixed(1)}%)`);
    console.log(`❌ Rejected cards: ${results.rejectedCount}/52 (${results.efficiency}%)`);
    console.log(`🎯 Efficiency: ${results.efficiency}% search space reduction`);
    console.log(`📝 Wild candidates: ${results.wildCandidates.join(', ')}`);

    return results;
}

/**
 * Get default relevant hand types (what matters for wild card optimization)
 * FIXED: Use natural4K instead of fourOfAKind to avoid kicker expansion
 * @returns {Array} Array of hand type property names
 */
function getDefaultRelevantHandTypes() {
    return [
        'threeOfAKind',
        'natural4K',          // ← FIXED: Use natural4K instead of fourOfAKind
        'fiveOfAKind',
        'sixOfAKind',
        'sevenOfAKind',
        'eightOfAKind',
        'straight',
        'straightFlush',
        'sixCardStraightFlush',
        'sevenCardStraightFlush',
        'eightCardStraightFlush',
        'fullHouse'
    ];
}

/**
 * Generate all 52 possible cards as strings
 * @returns {Array} Array of card strings like "A♠", "K♥", etc.
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
 * Create a card object from a card string
 * @param {string} cardString - Card string like "A♠"
 * @returns {Object} Card object
 */
function createCardObjectFromString(cardString) {
    const match = cardString.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
    if (!match) {
        throw new Error(`Invalid card format: ${cardString}`);
    }

    const [, rank, suit] = match;

    return {
        id: `${rank}${suit}_wild`,
        rank: rank,
        suit: suit,
        value: getRankValue(rank),
        isWild: false,
        wasWild: true
    };
}

/**
 * Get numeric value for rank
 * @param {string} rank - Card rank
 * @returns {number} Numeric value (2-14, A=14)
 */
function getRankValue(rank) {
    const values = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return values[rank] || 0;
}

// Test function
function testParameterizedWildCandidates() {
    console.log('\n🧪 Testing Parameterized Wild Candidates');

    // Use the quad test cards that caused the Ace problem
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
    console.log('🎯 This should FIND the Aces as candidates (5K improvement)');

    // Test the improved generator
    const result = parameterizedWildCandidates(test16CardsWithQuads);

    console.log('\n🔍 Checking for Ace candidates:');
    const aceCards = ['A♠', 'A♥', 'A♦', 'A♣'];
    aceCards.forEach(ace => {
        const found = result.wildCandidates.includes(ace);
        console.log(`   ${ace}: ${found ? '✅ FOUND' : '❌ MISSING'}`);
    });

    return result;
}