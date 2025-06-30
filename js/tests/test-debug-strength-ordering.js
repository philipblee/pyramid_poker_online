// Debug test case for the 4 sevens strength ordering issue

/**
 * Test case based on your actual game hand showing invalid arrangement
 */
function testDebugCase() {
    console.log('🧪 ======== DEBUG TEST CASE - 4 SEVENS ISSUE ========');

    // The exact 17 cards from your game
    const testCards = [
        // Staging area (4 cards)
        {suit: '♦', rank: '5', value: 5, id: '5♦_1'},
        {suit: '♥', rank: '5', value: 5, id: '5♥_2'},
        {suit: '♥', rank: '2', value: 2, id: '2♥_3'},
        {suit: '♥', rank: '7', value: 7, id: '7♥_4'},

        // Back hand - Currently Two Pair (should be 4K)
        {suit: '♠', rank: '6', value: 6, id: '6♠_5'},
        {suit: '♦', rank: '6', value: 6, id: '6♦_6'},
        {suit: '♠', rank: 'A', value: 14, id: 'A♠_7'},
        {suit: '♥', rank: 'A', value: 14, id: 'A♥_8'},
        {suit: '♠', rank: 'A', value: 14, id: 'A♠_9'},

        // Middle hand - Currently 4K (should be weaker)
        {suit: '♥', rank: 'K', value: 13, id: 'K♥_10'},
        {suit: '♦', rank: 'Q', value: 12, id: 'Q♦_11'},
        {suit: '♠', rank: 'K', value: 13, id: 'K♠_12'},
        {suit: '♦', rank: 'Q', value: 12, id: 'Q♦_13'},
        {suit: '♠', rank: 'K', value: 13, id: 'K♠_14'},

        // Front hand - Currently Full House (should be weakest)
        {suit: '♠', rank: '7', value: 7, id: '7♠_15'},
        {suit: '♠', rank: '7', value: 7, id: '7♠_16'},
        {suit: '♦', rank: '7', value: 7, id: '7♦_17'}
    ];

    // Run the complete detection and arrangement pipeline
    console.log('\n📋 Step 1: Running HandDetector...');
    const handDetector = new HandDetector(testCards);
    const detectionResults = handDetector.detectAllHands();

    console.log(`✅ Detected ${detectionResults.total} hands`);
    console.log(`   Complete: ${detectionResults.completeHands}`);
    console.log(`   Incomplete: ${detectionResults.incompleteHands}`);

    // Check what hands are available
    console.log('\n🔍 Available Hand Types:');
    const handsByType = {};
    detectionResults.hands.forEach(hand => {
        if (!handsByType[hand.handType]) handsByType[hand.handType] = [];
        handsByType[hand.handType].push(hand);
    });

    Object.entries(handsByType).forEach(([type, hands]) => {
        console.log(`   ${type}: ${hands.length} hands`);
        if (type === 'Four of a Kind') {
            hands.forEach((hand, i) => {
                const cards = hand.cards.map(c => c.rank + c.suit).join(' ');
                console.log(`      ${i+1}. ${cards} - Rank: [${hand.hand_rank.join(', ')}]`);
            });
        }
    });

    console.log('\n🔄 Step 2: Sorting hands by strength...');
    const handSorter = new HandSorter();
    const sortResult = handSorter.sortHandsByStrength(detectionResults.hands);

    console.log(`✅ Sorted ${sortResult.sortedHands.length} hands`);
    console.log(`   Strongest: ${sortResult.metadata.strengthRange.strongest.handType}`);
    console.log(`   Weakest: ${sortResult.metadata.strengthRange.weakest.handType}`);

    // Show top 10 hands to see if 4K is at the top
    console.log('\n🏆 Top 10 Strongest Hands:');
    sortResult.sortedHands.slice(0, 10).forEach((hand, i) => {
        const cards = hand.cards.map(c => c.rank + c.suit).join(' ');
        console.log(`${i+1}. ${hand.handType} - [${hand.hand_rank.join(', ')}] - ${cards}`);
    });

    console.log('\n🎯 Step 3: Finding best arrangement...');
    const generator = new BestArrangementGenerator();
    const result = generator.generateBestArrangement(sortResult.sortedHands, testCards);

    if (result.arrangement) {
        console.log(`\n🏆 Result: Score ${result.score} (${result.statistics.searchTime.toFixed(1)}ms)`);

        console.log('\n📊 ARRANGEMENT DETAILS:');
        console.log(`🔙 Back:   ${result.arrangement.back.handType} - [${result.arrangement.back.hand_rank?.join(', ') || 'no rank'}]`);
        const backCards = result.arrangement.back.cards.map(c => c.rank + c.suit).join(' ');
        console.log(`   Cards: ${backCards}`);

        console.log(`🔄 Middle: ${result.arrangement.middle.handType} - [${result.arrangement.middle.hand_rank?.join(', ') || 'no rank'}]`);
        const middleCards = result.arrangement.middle.cards.map(c => c.rank + c.suit).join(' ');
        console.log(`   Cards: ${middleCards}`);

        console.log(`🔜 Front:  ${result.arrangement.front.handType} - [${result.arrangement.front.hand_rank?.join(', ') || 'no rank'}]`);
        const frontCards = result.arrangement.front.cards.map(c => c.rank + c.suit).join(' ');
        console.log(`   Cards: ${frontCards}`);

        // Check strength order
        console.log('\n⚖️ STRENGTH VALIDATION:');
        const backRank = result.arrangement.back.hand_rank || [0];
        const middleRank = result.arrangement.middle.hand_rank || [0];
        const frontRank = result.arrangement.front.hand_rank || [0];

        console.log(`Back rank: [${backRank.join(', ')}]`);
        console.log(`Middle rank: [${middleRank.join(', ')}]`);
        console.log(`Front rank: [${frontRank.join(', ')}]`);

        // Manual strength comparison
        const backStronger = compareHandRanks(backRank, middleRank) >= 0;
        const middleStronger = compareHandRanks(middleRank, frontRank) >= 0;

        console.log(`Back ≥ Middle: ${backStronger ? '✅' : '❌'}`);
        console.log(`Middle ≥ Front: ${middleStronger ? '✅' : '❌'}`);
        console.log(`Valid order: ${backStronger && middleStronger ? '✅' : '❌'}`);

    } else {
        console.log('❌ No arrangement found');
    }

    return result;
}

/**
 * Simple hand rank comparison function for debugging
 */
function compareHandRanks(rankA, rankB) {
    for (let i = 0; i < Math.max(rankA.length, rankB.length); i++) {
        const a = rankA[i] || 0;
        const b = rankB[i] || 0;
        if (a !== b) return a - b;
    }
    return 0;
}

// Quick runner
function runDebugTest() {
    return testDebugCase();
}