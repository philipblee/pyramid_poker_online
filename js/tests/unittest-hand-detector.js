// js/tests/hand-detector-unit-tests.js
// Focused unit tests for HandDetector to debug Two Pair issue

/**
 * Test HandDetector with specific card scenarios
 */
function testHandDetectorUnitTests() {
    console.log('\n🧪 ======== HAND DETECTOR UNIT TESTS ========');

    // Test 1: Four 2s scenario (the failing case)
    testFour2sScenario();

    // Test 2: Valid Two Pair scenario
    testValidTwoPairScenario();

    // Test 3: Mixed ranks scenario
    testMixedRanksScenario();

    console.log('\n✅ Hand Detector unit tests complete');
}

/**
 * Test 1: Four 2s - should create 4K, not Two Pair
 */
function testFour2sScenario() {
    console.log('\n🧪 Test 1: Four 2s Scenario');

    const testCards = [
        {rank: '2', suit: '♠', value: 2, id: '2♠_1', isWild: false},
        {rank: '2', suit: '♥', value: 2, id: '2♥_2', isWild: false},
        {rank: '2', suit: '♦', value: 2, id: '2♦_3', isWild: false},
        {rank: '2', suit: '♣', value: 2, id: '2♣_4', isWild: false},
        {rank: 'A', suit: '♠', value: 14, id: 'A♠_5', isWild: false},
        {rank: 'K', suit: '♠', value: 13, id: 'K♠_6', isWild: false},
        {rank: 'Q', suit: '♠', value: 12, id: 'Q♠_7', isWild: false}
    ];

    console.log('Input cards:', testCards.map(c => c.rank + c.suit).join(', '));

    const detector = new HandDetector(testCards);
    const results = detector.results;

    console.log(`\nTotal hands detected: ${results.total}`);

    // Check for Four of a Kind hands
    const fourOfAKinds = results.hands.filter(h => h.handType === 'Four of a Kind');
    console.log(`Four of a Kind hands: ${fourOfAKinds.length}`);
    fourOfAKinds.forEach((hand, index) => {
        console.log(`  ${index + 1}. Cards: ${hand.cards.map(c => c.rank + c.suit).join(', ')}`);
        console.log(`     hand_rank: [${hand.hand_rank.join(', ')}]`);
    });

    // Check for Two Pair hands (should be ZERO)
    const twoPairs = results.hands.filter(h => h.handType === 'Two Pair');
    console.log(`Two Pair hands: ${twoPairs.length}`);
    twoPairs.forEach((hand, index) => {
        console.log(`  ${index + 1}. Cards: ${hand.cards.map(c => c.rank + c.suit).join(', ')}`);
        console.log(`     hand_rank: [${hand.hand_rank.join(', ')}]`);
        console.log(`     ❌ ERROR: This should NOT exist!`);
    });

    // Check for Pair hands
    const pairs = results.hands.filter(h => h.handType === 'Pair');
    console.log(`Pair hands: ${pairs.length}`);
    pairs.forEach((hand, index) => {
        console.log(`  ${index + 1}. Cards: ${hand.cards.map(c => c.rank + c.suit).join(', ')}`);
        console.log(`     Rank: ${hand.rank}, hand_rank: [${hand.hand_rank.join(', ')}]`);
    });
}

/**
 * Test 2: Valid Two Pair - Aces and Kings
 */
function testValidTwoPairScenario() {
    console.log('\n🧪 Test 2: Valid Two Pair Scenario (Aces and Kings)');

    const testCards = [
        {rank: 'A', suit: '♠', value: 14, id: 'A♠_1', isWild: false},
        {rank: 'A', suit: '♥', value: 14, id: 'A♥_2', isWild: false},
        {rank: 'K', suit: '♠', value: 13, id: 'K♠_3', isWild: false},
        {rank: 'K', suit: '♥', value: 13, id: 'K♥_4', isWild: false},
        {rank: 'Q', suit: '♠', value: 12, id: 'Q♠_5', isWild: false},
        {rank: 'J', suit: '♠', value: 11, id: 'J♠_6', isWild: false},
        {rank: '10', suit: '♠', value: 10, id: '10♠_7', isWild: false}
    ];

    console.log('Input cards:', testCards.map(c => c.rank + c.suit).join(', '));

    const detector = new HandDetector(testCards);
    const results = detector.results;

    console.log(`Total hands detected: ${results.total}`);

    // Check for Two Pair hands (should be exactly 1)
    const twoPairs = results.hands.filter(h => h.handType === 'Two Pair');
    console.log(`Two Pair hands: ${twoPairs.length}`);
    twoPairs.forEach((hand, index) => {
        console.log(`  ${index + 1}. Cards: ${hand.cards.map(c => c.rank + c.suit).join(', ')}`);
        console.log(`     hand_rank: [${hand.hand_rank.join(', ')}]`);

        // Validate the hand_rank
        if (hand.hand_rank.includes(undefined)) {
            console.log(`     ❌ ERROR: Contains undefined values!`);
        } else {
            console.log(`     ✅ GOOD: No undefined values`);
        }
    });

    // Check for Pair hands (should be 2: one Aces, one Kings)
    const pairs = results.hands.filter(h => h.handType === 'Pair');
    console.log(`Pair hands: ${pairs.length}`);
    pairs.forEach((hand, index) => {
        console.log(`  ${index + 1}. Rank: ${hand.rank}, Cards: ${hand.cards.map(c => c.rank + c.suit).join(', ')}`);
    });
}

/**
 * Test 3: Mixed ranks to see overall behavior
 */
function testMixedRanksScenario() {
    console.log('\n🧪 Test 3: Mixed Ranks Scenario');

    const testCards = [
        {rank: 'A', suit: '♠', value: 14, id: 'A♠_1', isWild: false},
        {rank: 'A', suit: '♥', value: 14, id: 'A♥_2', isWild: false},
        {rank: 'A', suit: '♦', value: 14, id: 'A♦_3', isWild: false},
        {rank: 'K', suit: '♠', value: 13, id: 'K♠_4', isWild: false},
        {rank: 'K', suit: '♥', value: 13, id: 'K♥_5', isWild: false},
        {rank: 'Q', suit: '♠', value: 12, id: 'Q♠_6', isWild: false},
        {rank: 'J', suit: '♠', value: 11, id: 'J♠_7', isWild: false}
    ];

    console.log('Input cards:', testCards.map(c => c.rank + c.suit).join(', '));

    const detector = new HandDetector(testCards);
    const results = detector.results;

    console.log(`Total hands detected: ${results.total}`);

    // Summary by hand type
    const handTypeSummary = {};
    results.hands.forEach(hand => {
        handTypeSummary[hand.handType] = (handTypeSummary[hand.handType] || 0) + 1;
    });

    console.log('Hand type summary:');
    Object.entries(handTypeSummary).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });

    // Check all Two Pair hands for undefined values
    const twoPairs = results.hands.filter(h => h.handType === 'Two Pair');
    if (twoPairs.length > 0) {
        console.log('\nTwo Pair analysis:');
        twoPairs.forEach((hand, index) => {
            const hasUndefined = hand.hand_rank.includes(undefined);
            const status = hasUndefined ? '❌ HAS UNDEFINED' : '✅ OK';
            console.log(`  ${index + 1}. ${status} - [${hand.hand_rank.join(', ')}] - Cards: ${hand.cards.map(c => c.rank + c.suit).join(', ')}`);
        });
    }
}

/**
 * Helper function to run all tests
 */
function runHandDetectorUnitTests() {
    testHandDetectorUnitTests();
}

// Export for console use
if (typeof window !== 'undefined') {
    window.testHandDetectorUnitTests = testHandDetectorUnitTests;
    window.runHandDetectorUnitTests = runHandDetectorUnitTests;
}