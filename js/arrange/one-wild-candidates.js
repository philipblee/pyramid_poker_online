// js/arrange/one-wild-candidates.js
// Hard-coded wild candidates generator for 16 cards + 1 wild

/**
* Generate one-wild candidates for hand improvements
* @param {Array} cardObjects - Array of 16 non-wild cards
* @returns {Array} Array of wild card strings that improve hand counts
*/

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
       // Convert card string to card object
       const wildCard = Analysis.createCardFromString(cardString);

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
//           console.log(`   ✅Card Accepted: ${cardString}`);
           wildCandidates.push(cardString);

       } else {
           rejectedCards.push(cardString);
//           console.log(`   ✅ Rejected Card: ${cardString}`);
       }

   });

//   console.log(`\n📋 ======== RESULTS ========`);
//   console.log(`✅ Wild candidates: ${wildCandidates.length}/52 (${((wildCandidates.length/52)*100).toFixed(1)}%)`);
//   console.log(`❌ Rejected cards: ${rejectedCards.length}/52 (${((rejectedCards.length/52)*100).toFixed(1)}%)`);
//   console.log(`🎯 Efficiency: ${(((52 - wildCandidates.length) / 52) * 100).toFixed(1)}% search space reduction`);
//   console.log(`📝 Wild candidates: ${wildCandidates.join(', ')}`);

    const results = {
        baseline: cardObjects,
        baselineCounts: baselineCounts,
        relevantHandTypes: handTypes,
        wildCandidates: wildCandidates,
        wildCandidatesCount: wildCandidates.length,
        rejectedCards: rejectedCards,
        rejectedCount: rejectedCards.length,
        efficiency: (((52 - wildCandidates.length) / 52) * 100).toFixed(1) + "%"
    };

    return results;

}
