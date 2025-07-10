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
    const handTypes = relevantHandTypes || Analysis.getDefaultRelevantHandTypes();
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
    const allCards = Analysis.generateAll52CardStringsAcesFirst();
    const wildCandidates = [];
    const rejectedCards = [];

    allCards.forEach((cardString, index) => {
        // Convert card string to card object
        const wildCard = Analysis.createCardFromString(cardString);
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


/**
 * Generate wild candidates from a test case ID (wrapper for backward compatibility)
 * @param {number} caseId - Test case ID from one-wild-test-cases.js
 * @returns {Object} Results with smart candidates (same format as old generateWildCandidates)
 */
function parameterizedWildCandidatesFromCaseId(caseId) {
    // Get test case
    const testCase = ONE_WILD_TEST_CASES.find(t => t.id === caseId);
    if (!testCase) {
        console.log(`❌ Test case ${caseId} not found`);
        return null;
    }

    // Extract non-wild cards
    const allCards = CardParser.parseCardString(testCase.cards);
    const nonWildCards = allCards.filter(card => !card.isWild);

    // Call the main function
    return parameterizedWildCandidates(nonWildCards);
}