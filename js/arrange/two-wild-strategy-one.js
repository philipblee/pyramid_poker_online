// js/arrange/two-wild-strategy-one.js
// Hard-coded wild candidates generator for 15 cards + 2 wilds, straight flushes only

/**
* Generate two-wild candidates for straight flush improvements
* @param {Array} cardObjects - Array of 15 non-wild cards
* @returns {Object} Results with smart 2-wild combinations and statistics
*/
function twoWildStrategyOne(cardObjects) {
   console.log('\n🎯 ======== TWO WILD CANDIDATES ========');
   console.log(`Analyzing ${cardObjects.length} card objects for 2-wild straight flush combinations`);

   // Hard-coded for straight flushes only
   const handTypes = ['straightFlush', 'sixCardStraightFlush', 'sevenCardStraightFlush', 'eightCardStraightFlush'];
   console.log(`📋 Hand types: ${handTypes.join(', ')}`);

   // Step 1: Get baseline hand counts
   console.log('\n📊 Step 1: Getting baseline hand counts...');
   const baselineCounts = countValidHandsFromCards(cardObjects);

   console.log('🔢 Baseline straight flush counts:');
   handTypes.forEach(handType => {
       const count = baselineCounts[handType] || 0;
       console.log(`   ${handType}: ${count}`);
   });

   // Step 2: Test each possible 2-wild combination
   console.log('\n🔄 Step 2: Testing all 312 same-suit combinations...');
   const allCombinations = generateAll312SameSuitCombinations(cardObjects);
   const wildCandidates = [];
   const rejectedCombinations = [];

   allCombinations.forEach((combination, index) => {
       // Create test hand (15 + 2 wilds = 17 cards)
       const testCards = [...cardObjects, ...combination];

       // Get hand counts for test case
       const testCounts = countValidHandsFromCards(testCards);

       // Check if ANY straight flush type improved
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

       // Accept if ANY straight flush type improved
       if (improved) {
           console.log(`   ✅Combination Accepted: ${combination.map(c => c.rank + c.suit).join(', ')}`);
           wildCandidates.push({
               combination: combination,
               improvements: improvementDetails
           });

           if (improvementDetails.length === 1) {
               console.log(`   ✅ ${combination.map(c => c.rank + c.suit).join(', ')}: ${improvementDetails[0]}`);
           } else {
               console.log(`   ✅ ${combination.map(c => c.rank + c.suit).join(', ')}: ${improvementDetails.length} improvements`);
           }
       } else {
           rejectedCombinations.push(combination);
           console.log(`   ✅ Rejected Combination: ${combination.map(c => c.rank + c.suit).join(', ')}`);
       }

       // Progress indicator
       if ((index + 1) % 20 === 0) {
           console.log(`   Progress: ${index + 1}/312 combinations tested...`);
       }
   });

   // Step 3: Results
   const results = {
       baseline: cardObjects,
       baselineCounts: baselineCounts,
       handTypes: handTypes,
       wildCandidates: wildCandidates.map(c => c.combination), // Just the combinations
       wildCandidateDetails: wildCandidates, // Full details with improvements
       wildCandidatesCount: wildCandidates.length,
       rejectedCombinations: rejectedCombinations,
       rejectedCount: rejectedCombinations.length,
       efficiency: ((312 - wildCandidates.length) / 312 * 100).toFixed(1)
   };

   console.log(`\n📋 ======== RESULTS ========`);
   console.log(`✅ Wild combinations: ${results.wildCandidatesCount}/312 (${((results.wildCandidatesCount/312)*100).toFixed(1)}%)`);
   console.log(`❌ Rejected combinations: ${results.rejectedCount}/312 (${results.efficiency}%)`);
   console.log(`🎯 Efficiency: ${results.efficiency}% search space reduction`);

    return results;  // Just full object with metadata
}

/**
* Generate all 312 same-suit 2-card combinations
* @param {Array} existingCards - Cards already in hand (to avoid duplicates)
* @returns {Array} Array of all possible 2-card same-suit combinations
*/
function generateAll312SameSuitCombinations(existingCards) {
   const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
   const suits = ['♠', '♥', '♦', '♣'];
   const allCombinations = [];

   suits.forEach(suit => {
       // Get ranks already used in this suit
       const usedRanks = new Set(
           existingCards
               .filter(card => card.suit === suit)
               .map(card => card.rank)
       );

       // Get available ranks for this suit
       const availableRanks = ranks.filter(rank => !usedRanks.has(rank));

       // Generate all 2-card combinations from available ranks
       for (let i = 0; i < availableRanks.length; i++) {
           for (let j = i + 1; j < availableRanks.length; j++) {
               const card1 = createWildCard(availableRanks[i], suit, 1);
               const card2 = createWildCard(availableRanks[j], suit, 2);

               allCombinations.push([card1, card2]);
           }
       }
   });

   return allCombinations;
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
       value: Analysis.getRankValue(rank),
       isWild: false,
       wasWild: true
   };
}

// Test function
function testTwoWildCandidates() {
   console.log('\n🧪 Testing Two Wild Candidates');

   // Create test cards that could form straight flush with 2 wilds
   const test15Cards = [
       {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
       {id: 'K♠_2', rank: 'K', suit: '♠', value: 13, isWild: false},
       {id: 'Q♠_3', rank: 'Q', suit: '♠', value: 12, isWild: false},
       {id: '9♠_4', rank: '9', suit: '♠', value: 9, isWild: false},
       {id: '8♠_5', rank: '8', suit: '♠', value: 8, isWild: false},
       // Add some other suits
       {id: '7♥_6', rank: '7', suit: '♥', value: 7, isWild: false},
       {id: '6♥_7', rank: '6', suit: '♥', value: 6, isWild: false},
       {id: '5♦_8', rank: '5', suit: '♦', value: 5, isWild: false},
       {id: '4♦_9', rank: '4', suit: '♦', value: 4, isWild: false},
       {id: '3♣_10', rank: '3', suit: '♣', value: 3, isWild: false},
       {id: '2♣_11', rank: '2', suit: '♣', value: 2, isWild: false},
       {id: 'J♥_12', rank: 'J', suit: '♥', value: 11, isWild: false},
       {id: '10♦_13', rank: '10', suit: '♦', value: 10, isWild: false},
       {id: '6♣_14', rank: '6', suit: '♣', value: 6, isWild: false},
       {id: '4♥_15', rank: '4', suit: '♥', value: 4, isWild: false}
   ];

   console.log(`\n📋 Testing with ${test15Cards.length} card objects`);
   console.log('🎯 This should find 2-wild combinations that improve straight flushes');

   // Test the function
   const result = twoWildCandidates(test15Cards);

   console.log('\n🔍 Sample results:');
   result.wildCandidates.slice(0, 3).forEach((combo, index) => {
       console.log(`   ${index + 1}: ${combo.map(c => c.rank + c.suit).join(', ')}`);
   });

   return result;
}

/**
* Compare original strategy one vs two-wild-candidates with timing
* @param {Array} cards - Test cards (15 non-wild cards)
*/
//function compareStrategyOneVsTwoWildCandidates(cards) {
//   console.log('\n🔬 ======== COMPARING STRATEGY 1 VS TWO-WILD-CANDIDATES ========');
//
//   // Time original version (HandDetector 312 times)
//   console.log('\n📊 Timing Original Strategy 1...');
//   const originalStart = performance.now();
//   const originalResults = twoWildStrategyOne(cards);
//   const originalEnd = performance.now();
//   const originalTime = originalEnd - originalStart;
//
//   // Time new version (called once)
//   console.log('\n📊 Timing Two-Wild-Candidates...');
//   const newStart = performance.now();
//   const newResult = twoWildCandidates(cards);
//   const newResults = newResult.wildCandidates;
//   const newEnd = performance.now();
//   const newTime = newEnd - newStart;
//
//   // Calculate speedup
//   const speedup = originalTime / newTime;
//   const timeSaved = originalTime - newTime;
//
//   // Compare results
//   console.log('\n📋 ======== COMPARISON RESULTS ========');
//   console.log(`Original Strategy 1: ${originalResults.length} combinations`);
//   console.log(`Two-Wild-Candidates: ${newResults.length} combinations`);
//
//   // Check if results match
//   const originalCombos = new Set(originalResults.map(combo =>
//       combo.map(c => c.rank + c.suit).sort().join(',')
//   ));
//   const newCombos = new Set(newResults.map(combo =>
//       combo.map(c => c.rank + c.suit).sort().join(',')
//   ));
//
//   const match = originalCombos.size === newCombos.size &&
//                 [...originalCombos].every(combo => newCombos.has(combo));
//
//   console.log(`Results match: ${match ? '✅ YES' : '❌ NO'}`);
//
//   console.log('\n⚡ ======== TIMING RESULTS ========');
//   console.log(`Original Strategy 1: ${originalTime.toFixed(2)}ms`);
//   console.log(`Two-Wild-Candidates: ${newTime.toFixed(2)}ms`);
//   console.log(`Time saved: ${timeSaved.toFixed(2)}ms`);
//   console.log(`Speedup: ${speedup.toFixed(1)}x faster`);
//   console.log(`Efficiency gain: ${((timeSaved / originalTime) * 100).toFixed(1)}% reduction`);
//
//   if (!match) {
//       console.log('\n⚠️ Differences found:');
//       console.log('Original only:', [...originalCombos].filter(c => !newCombos.has(c)));
//       console.log('New only:', [...newCombos].filter(c => !originalCombos.has(c)));
//   }
//
//   return { originalTime, newTime, speedup, timeSaved, match };
//}