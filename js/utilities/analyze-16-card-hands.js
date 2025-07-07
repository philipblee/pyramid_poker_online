// js/tests/analyze-16-card-hands.js
// Analyze 16 non-wild cards from one-wild test cases

/**
 * Access and print any case cards
 * @param {number} caseId - Case ID to analyze (default: 1)
 */
function analyzeCase(caseId = 1) {
    console.log(`\n🔍 ======== ANALYZING CASE ${caseId} ========`);

    // Get the specified case
    const testCase = ONE_WILD_TEST_CASES.find(t => t.id === caseId);
    if (!testCase) {
        console.log(`❌ Case ${caseId} not found`);
        return;
    }

    console.log(`📋 Case: ${testCase.name}`);
    console.log(`🃏 All 17 cards: ${testCase.cards}`);

    // Split cards and identify wild vs non-wild
    const allCards = testCase.cards.trim().split(/\s+/);
    console.log(`📊 Total cards: ${allCards.length}`);

    const wildCards = allCards.filter(card => card === '🃏');
    const nonWildCards = allCards.filter(card => card !== '🃏');

    // Parse and sort non-wild cards by rank, then suit
    const parsedCards = nonWildCards.map(cardStr => {
        const match = cardStr.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
        if (!match) return null;
        const [, rank, suit] = match;
        return { cardStr, rank, suit };
    }).filter(card => card !== null);

    // Sort by rank (A=14, K=13, Q=12, J=11), then by suit (♠♥♦♣)
    const rankOrder = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
    const suitOrder = { '♠': 1, '♥': 2, '♦': 3, '♣': 4 };

    parsedCards.sort((a, b) => {
        const rankDiff = rankOrder[b.rank] - rankOrder[a.rank];
        return rankDiff !== 0 ? rankDiff : suitOrder[a.suit] - suitOrder[b.suit];
    });

    const sortedNonWildCards = parsedCards.map(card => card.cardStr);

    // Analyze what hands are possible with these 16 cards
    console.log('\n🧮 Analyzing possible hands with 16 cards...');
    const cardString16 = sortedNonWildCards.join(' ');
    const handCounter = new CountValidHands();
    const handCounts = handCounter.calculateExpectedCounts(cardString16);

    console.log('\n📊 Hand types possible with 16 cards:');
    Object.entries(handCounts).forEach(([handType, count]) => {
        if (count > 0) {
            console.log(`   ${handType}: ${count}`);
        }
    });


    console.log(`🃏 Wild cards (${wildCards.length}): ${wildCards.join(' ')}`);
    console.log(`🎴 Non-wild cards (${sortedNonWildCards.length}): ${sortedNonWildCards.join(' ')}`);

    // Filter to relevant hands only - omit flushes and 4K with kicker
    console.log('\n🎯 Relevant hands for wild card optimization:');
    const relevantCategories = [
        'threeOfAKind', 'fiveOfAKind', 'sixOfAKind', 'sevenOfAKind', 'eightOfAKind',
        'straightFlush', 'sixCardStraightFlush', 'sevenCardStraightFlush', 'eightCardStraightFlush',
        'straight'
    ];

    let relevantTotal = 0;
    relevantCategories.forEach(category => {
        const count = handCounts[category] || 0;
        if (count > 0) {
            relevantTotal += count;
            console.log(`   ${category}: ${count}`);
        }

    });

    // const handCounts = handCounter.calculateExpectedCounts(cardString16);

    // Count natural 4Ks from rank distribution
    const rankCounts = {};
    // console.log('sortedNonWildCards:', sortedNonWildCards);

    sortedNonWildCards.forEach(cardStr => {
        // console.log('Processing card:', cardStr);
        const match = cardStr.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
        if (match) {
            const rank = match[1];
            rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        } else {
            console.log('No match for:', cardStr);
        }
    });

    // console.log('rankCounts:', rankCounts);

    let natural4Ks = 0;
    Object.entries(rankCounts).forEach(([rank, count]) => {

    if (count === 4) {
        // console.log(`Found natural 4K: ${rank}`);
        natural4Ks++;
        }
    });

    // console.log('Total natural4Ks found:', natural4Ks);

    if (natural4Ks > 0) {
        relevantTotal += natural4Ks;
        console.log(`   natural4K: ${natural4Ks}`);
    }



    console.log(`🔢 Total relevant hands: ${relevantTotal}`);






    return { wildCards, nonWildCards };
}