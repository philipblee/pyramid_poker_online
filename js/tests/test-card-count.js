// js/tests/test-card-count.js
// Clean test for CardCount class - no old naming remnants

function testCardCount() {
    console.log('🧪 Testing CardCount Class\n');

    // Test data: 4 Aces + 13 spades (flush) + 2 Kings
    const testCards = "A♠ A♥ A♦ A♣ K♠ Q♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠ 2♠ K♥";

    console.log(`📋 Input: ${testCards}`);
    console.log(`📊 Expected: 17 cards total`);

    // Create CardCount instance using the helper function
    const count = countCardsFromString(testCards);

    console.log('\n🔢 Basic Properties:');
    console.log('  Total cards:', count.totalCards);
    console.log('  Unique ranks:', count.rankCounts.size);
    console.log('  Unique suits:', count.suitCounts.size);

    console.log('\n🎯 Rank Counting:');
    console.log('  Aces (A):', count.rankCount('A'));
    console.log('  Kings (K):', count.rankCount('K'));
    console.log('  Queens (Q):', count.rankCount('Q'));
    console.log('  Missing rank (7):', count.rankCount('7'));

    console.log('\n🎯 Suit Counting:');
    console.log('  Spades (♠):', count.suitCount('♠'));
    console.log('  Hearts (♥):', count.suitCount('♥'));
    console.log('  Diamonds (♦):', count.suitCount('♦'));
    console.log('  Clubs (♣):', count.suitCount('♣'));

    console.log('\n🌊 Flush Detection:');
    const flushSuits5 = count.flushSuits(5);
    const flushSuits10 = count.flushSuits(10);
    console.log('  5+ card suits:', flushSuits5);
    console.log('  10+ card suits:', flushSuits10);

    console.log('\n🃏 Of-a-Kind Detection:');
    const pairs = count.ofAKindRanks(2);
    const trips = count.ofAKindRanks(3);
    const quads = count.ofAKindRanks(4);
    console.log('  Pairs (2+):', pairs);
    console.log('  Trips (3+):', trips);
    console.log('  Quads (4+):', quads);

    console.log('\n📈 Summary Stats:');
    const summary = count.summary();
    console.log('  Summary:', summary);

    // Validation tests
    console.log('\n✅ Validation Tests:');
    const tests = [
        { name: 'Total cards', actual: count.totalCards, expected: 17 },
        { name: 'Aces count', actual: count.rankCount('A'), expected: 4 },
        { name: 'Kings count', actual: count.rankCount('K'), expected: 2 },
        { name: 'Spades count', actual: count.suitCount('♠'), expected: 13 },
        { name: 'Hearts count', actual: count.suitCount('♥'), expected: 3 },
        { name: 'Flush suits (5+)', actual: flushSuits5.length, expected: 1 },
        { name: 'Quad ranks', actual: quads.length, expected: 1 },
        { name: 'Pair ranks', actual: pairs.length, expected: 2 }
    ];

    let allPassed = true;
    tests.forEach(test => {
        const passed = test.actual === test.expected;
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${test.name}: ${test.actual} (expected ${test.expected})`);
        if (!passed) allPassed = false;
    });

    console.log(`\n🎯 Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    return count;
}

// Test helper: Create CardCount from individual cards array
function testCardCountDirect() {
    console.log('🧪 Testing CardCount Direct Construction\n');

    const cards = [
        { rank: 'A', suit: '♠', id: 'A♠_1' },
        { rank: 'A', suit: '♥', id: 'A♥_2' },
        { rank: 'K', suit: '♠', id: 'K♠_3' }
    ];

    const count = new CardCount(cards);

    console.log('📊 Results:');
    console.log('  Total cards:', count.totalCards);
    console.log('  Aces:', count.rankCount('A'));
    console.log('  Kings:', count.rankCount('K'));
    console.log('  Spades:', count.suitCount('♠'));

    return count;
}

// Usage:
// testCardCount()
// testCardCountDirect()