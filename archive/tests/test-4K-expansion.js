// Simple test to verify 4K expansion is working
// Test with known card set and verify 4K expansion

function test4KExpansion() {
    console.log('🧪 ======== 4K EXPANSION TEST ========');

    // Create simple test scenario: 4 Kings + 3 other cards
    const testCards = [
        { rank: 'K', suit: '♠', id: 'K♠_1', isWild: false },
        { rank: 'K', suit: '♥', id: 'K♥_2', isWild: false },
        { rank: 'K', suit: '♦', id: 'K♦_3', isWild: false },
        { rank: 'K', suit: '♣', id: 'K♣_4', isWild: false },
        { rank: 'A', suit: '♠', id: 'A♠_5', isWild: false },
        { rank: 'Q', suit: '♥', id: 'Q♥_6', isWild: false },
        { rank: 'J', suit: '♦', id: 'J♦_7', isWild: false }
    ];

    console.log('📋 Test Scenario: 4 Kings + A♠ + Q♥ + J♦');
    console.log('Expected: 3 complete 4K hands (4K+A, 4K+Q, 4K+J)');

    // Run HandDetector
    const detector = new HandDetector(testCards);
    const results = detector.detectAllHands();

    // Analyze results
    const fourOfAKindHands = results.hands.filter(h => h.handType === 'Four of a Kind');
    const incompleteHands = results.hands.filter(h => h.isIncomplete);

    console.log('\n📊 RESULTS:');
    console.log(`Total hands detected: ${results.total}`);
    console.log(`Four of a Kind hands: ${fourOfAKindHands.length}`);
    console.log(`Incomplete hands: ${incompleteHands.length}`);

    console.log('\n🃏 Four of a Kind hands found:');
    fourOfAKindHands.forEach((hand, index) => {
        const cardStr = hand.cards.map(c => c.rank + c.suit).join(' ');
        const complete = hand.isIncomplete ? 'INCOMPLETE' : 'COMPLETE';
        console.log(`  ${index + 1}. ${cardStr} (${hand.cardCount} cards) - ${complete}`);
    });

    // Verify expectations
    const expectedFourOfAKinds = 3; // 4K+A, 4K+Q, 4K+J
    const allFourOfAKindsComplete = fourOfAKindHands.every(h => !h.isIncomplete);
    const allHaveFiveCards = fourOfAKindHands.every(h => h.cardCount === 5);

    console.log('\n✅ VERIFICATION:');
    console.log(`Expected 4K hands: ${expectedFourOfAKinds}`);
    console.log(`Actual 4K hands: ${fourOfAKindHands.length} ${fourOfAKindHands.length === expectedFourOfAKinds ? '✅' : '❌'}`);
    console.log(`All 4K hands complete: ${allFourOfAKindsComplete ? '✅' : '❌'}`);
    console.log(`All 4K hands have 5 cards: ${allHaveFiveCards ? '✅' : '❌'}`);

    // Check for any incomplete 4K hands (should be none)
    const incomplete4Ks = results.hands.filter(h => h.handType === 'Four of a Kind' && h.isIncomplete);
    console.log(`Incomplete 4K hands: ${incomplete4Ks.length} ${incomplete4Ks.length === 0 ? '✅' : '❌'}`);

    if (incomplete4Ks.length > 0) {
        console.log('❌ Found incomplete 4K hands:');
        incomplete4Ks.forEach(hand => {
            const cardStr = hand.cards.map(c => c.rank + c.suit).join(' ');
            console.log(`   ${cardStr} (${hand.cardCount} cards)`);
        });
    }

    const testPassed = (fourOfAKindHands.length === expectedFourOfAKinds) &&
                      allFourOfAKindsComplete &&
                      allHaveFiveCards &&
                      (incomplete4Ks.length === 0);

    console.log(`\n🎯 OVERALL TEST: ${testPassed ? 'PASSED ✅' : 'FAILED ❌'}`);

    return {
        passed: testPassed,
        fourOfAKindCount: fourOfAKindHands.length,
        expectedCount: expectedFourOfAKinds,
        allComplete: allFourOfAKindsComplete,
        allFiveCards: allHaveFiveCards,
        incompleteCount: incomplete4Ks.length
    };
}

// Additional test with pairs as kickers
function test4KExpansionWithPairs() {
    console.log('\n🧪 ======== 4K EXPANSION WITH PAIRS TEST ========');

    // 4 Kings + pair of Aces + single Queen = should create 3 4K hands (4K+A1, 4K+A2, 4K+Q)
    const testCards = [
        { rank: 'K', suit: '♠', id: 'K♠_1', isWild: false },
        { rank: 'K', suit: '♥', id: 'K♥_2', isWild: false },
        { rank: 'K', suit: '♦', id: 'K♦_3', isWild: false },
        { rank: 'K', suit: '♣', id: 'K♣_4', isWild: false },
        { rank: 'A', suit: '♠', id: 'A♠_5', isWild: false },
        { rank: 'A', suit: '♥', id: 'A♥_6', isWild: false },
        { rank: 'Q', suit: '♦', id: 'Q♦_7', isWild: false }
    ];

    console.log('📋 Test Scenario: 4 Kings + pair of Aces + Q♦');
    console.log('Expected: 3 complete 4K hands (4K+A♠, 4K+A♥, 4K+Q♦)');

    const detector = new HandDetector(testCards);
    const results = detector.detectAllHands();

    const fourOfAKindHands = results.hands.filter(h => h.handType === 'Four of a Kind');

    console.log('\n📊 RESULTS:');
    console.log(`Four of a Kind hands: ${fourOfAKindHands.length}`);

    console.log('\n🃏 Four of a Kind hands found:');
    fourOfAKindHands.forEach((hand, index) => {
        const cardStr = hand.cards.map(c => c.rank + c.suit).join(' ');
        const complete = hand.isIncomplete ? 'INCOMPLETE' : 'COMPLETE';
        console.log(`  ${index + 1}. ${cardStr} (${hand.cardCount} cards) - ${complete}`);
    });

    const expectedCount = 3; // 4K+A♠, 4K+A♥, 4K+Q♦
    const testPassed = fourOfAKindHands.length === expectedCount &&
                      fourOfAKindHands.every(h => !h.isIncomplete);

    console.log(`\n🎯 PAIR KICKER TEST: ${testPassed ? 'PASSED ✅' : 'FAILED ❌'}`);

    return {
        passed: testPassed,
        fourOfAKindCount: fourOfAKindHands.length,
        expectedCount: expectedCount
    };
}

// Run both tests
function runAll4KTests() {
    const test1 = test4KExpansion();
    const test2 = test4KExpansionWithPairs();

    console.log('\n🏆 ======== 4K EXPANSION TEST SUMMARY ========');
    console.log(`Simple 4K test: ${test1.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`4K with pairs test: ${test2.passed ? 'PASSED ✅' : 'FAILED ❌'}`);

    const allPassed = test1.passed && test2.passed;
    console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED! 🎉' : 'SOME TESTS FAILED ❌'}`);

    return allPassed;
}

// Export for use
if (typeof module !== 'undefined') {
    module.exports = { test4KExpansion, test4KExpansionWithPairs, runAll4KTests };
}