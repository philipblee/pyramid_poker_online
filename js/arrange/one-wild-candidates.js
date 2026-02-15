// js/arrange/one-wild-candidates.js
// Hard-coded wild candidates generator for 16 cards + 1 wild

/**
* Generate one-wild candidates for hand improvements
* @param {Array} cardObjects - Array of 16 non-wild cards
* @returns {Array} Array of wild card strings that improve hand counts
*/
// Add rank lookup near top of function
const handTypeRank = {
    'eightOfAKind': 18,
    'eightCardStraightFlush': 15,
    'sevenOfAKind': 14,
    'sevenCardStraightFlush': 11,
    'sixOfAKind': 10,
    'sixCardStraightFlush': 8,
    'fiveOfAKind': 6,
    'straightFlush': 5,
    'natural4K': 4,
    'flush': 1,
    'straight': 1
};

function oneWildCandidates(cardObjects) {
//   console.log('\n🎯 ======== ONE WILD CANDIDATES ========');
//   console.log(`Analyzing ${cardObjects.length} card objects for 1-wild improvements`);

   // Hard-coded relevant hand types
   const handTypes = ['natural4K', 'fiveOfAKind', 'sixOfAKind', 'sevenOfAKind', 'eightOfAKind',
                     'straight', 'straightFlush', 'sixCardStraightFlush',
                     'sevenCardStraightFlush', 'eightCardStraightFlush', 'flush'];
                     
//   console.log(`📋 Hand types: ${handTypes.join(', ')}`);

   // Step 1: Get baseline hand counts
//   console.log('\n📊 Step 1: Getting baseline hand counts...');
   const baselineCounts = countValidHandsFromCards(cardObjects);

   // Step 2: Test each possible wild card substitution
//   console.log('\n🔄 Step 2: Testing all 52 possible wild cards...');
   const allCards = Analysis.generateAll52CardStringsAcesFirst();
   const wildCandidates = [];
   const rejectedCards = [];

    allCards.forEach((cardString, index) => {
        const wildCard = Analysis.createCardFromString(cardString);
        const testCards = [...cardObjects, wildCard];
        const testCounts = countValidHandsFromCards(testCards);

        let improved = false;
        let bestRank = 0;

        handTypes.forEach(handType => {
            const baselineCount = baselineCounts[handType] || 0;
            const testCount = testCounts[handType] || 0;

            if (testCount > baselineCount) {
                improved = true;
                const rank = handTypeRank[handType] || 0;
                if (rank > bestRank) bestRank = rank;
            }
        });

        if (improved) {
            wildCandidates.push({ card: cardString, rank: bestRank });
        } else {
            rejectedCards.push(cardString);
        }
    });

    // Sort by rank descending, extract strings
    const sortedRanked = [...wildCandidates].sort((a, b) => b.rank - a.rank);
    const sortedCandidates = sortedRanked.map(c => c.card);

    const results = {
        baseline: cardObjects,
        baselineCounts: baselineCounts,
        relevantHandTypes: handTypes,
        wildCandidates: sortedCandidates,
        wildCandidatesRanked: sortedRanked,   // explicitly sorted, no ambiguity
        wildCandidatesCount: sortedCandidates.length,
        rejectedCards: rejectedCards,
        rejectedCount: rejectedCards.length,
        efficiency: (((52 - wildCandidates.length) / 52) * 100).toFixed(1) + "%"
    };

    return results;

}
