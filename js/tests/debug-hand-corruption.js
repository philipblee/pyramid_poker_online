// Debug function to track hand corruption
function debugHandCorruption(hand, context = "Unknown") {
    console.log(`\n🔍 HAND DEBUG: ${context}`);
    console.log("=" * 50);

    // Check for inconsistencies
    const cards = hand.cards || [];
    console.log(`📋 Cards (${cards.length}):`, cards.map(c => `${c.rank}${c.suit}`).join(' '));

    // Analyze what the hand SHOULD be
    const actualPairs = findPairs(cards);
    const expectedHandType = determineExpectedHandType(cards);

    console.log(`🎯 Expected hand type: ${expectedHandType}`);
    console.log(`🔧 Current handType: ${hand.handType}`);
    console.log(`🏆 Current handStrength.name: ${hand.handStrength?.name}`);

    // Check for corruption indicators
    const corrupted = [];
    if (hand.handType !== hand.handStrength?.name) {
        corrupted.push(`handType mismatch: ${hand.handType} vs ${hand.handStrength?.name}`);
    }

    if (hand.handType !== expectedHandType) {
        corrupted.push(`Expected ${expectedHandType}, got ${hand.handType}`);
    }

    // Check hand_rank consistency
    const rankValue = hand.hand_rank?.[0];
    const expectedRankValue = getExpectedRankValue(expectedHandType);
    if (rankValue !== expectedRankValue) {
        corrupted.push(`hand_rank[0] is ${rankValue}, expected ${expectedRankValue} for ${expectedHandType}`);
    }

    if (corrupted.length > 0) {
        console.log("🚨 CORRUPTION DETECTED:");
        corrupted.forEach(issue => console.log(`   ❌ ${issue}`));
    } else {
        console.log("✅ Hand appears consistent");
    }

    // Detailed breakdown
    console.log(`📊 hand_rank: [${hand.hand_rank?.join(', ') || 'none'}]`);
    console.log(`🎲 Rank breakdown:`);
    if (hand.hand_rank) {
        console.log(`   Type code: ${hand.hand_rank[0]} (${getRankTypeName(hand.hand_rank[0])})`);
        console.log(`   Values: ${hand.hand_rank.slice(1, 6).filter(x => x > 0).join(', ')}`);
    }

    return {
        isCorrupted: corrupted.length > 0,
        issues: corrupted,
        expectedType: expectedHandType,
        actualType: hand.handType
    };
}

function findPairs(cards) {
    const rankCounts = {};
    cards.forEach(card => {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    });

    const pairs = Object.entries(rankCounts)
        .filter(([rank, count]) => count >= 2)
        .map(([rank, count]) => ({ rank, count }));

    return pairs;
}

function determineExpectedHandType(cards) {
    if (!cards || cards.length === 0) return "No Cards";

    // Check flush first (all same suit)
    const suits = [...new Set(cards.map(c => c.suit))];
    const isFlush = suits.length === 1 && cards.length >= 5;

    // Check straight
    const ranks = cards.map(c => c.value).sort((a,b) => b-a);
    const isStraight = isConsecutive(ranks);

    if (isFlush && isStraight) return "Straight Flush";
    if (isFlush) return "Flush";
    if (isStraight) return "Straight";

    // Then check pairs/trips/quads
    const pairs = findPairs(cards);

    if (pairs.length === 0) return "High Card";
    if (pairs.length === 1 && pairs[0].count === 2) return "Pair";
    if (pairs.length === 1 && pairs[0].count === 3) return "Three of a Kind";
    if (pairs.length === 1 && pairs[0].count === 4) return "Four of a Kind";
    if (pairs.length === 2) return "Two Pair";
    if (pairs.some(p => p.count === 3) && pairs.some(p => p.count === 2)) return "Full House";

    return "Complex Hand";
}

function isConsecutive(sortedRanks) {
    for (let i = 0; i < sortedRanks.length - 1; i++) {
        if (sortedRanks[i] - sortedRanks[i + 1] !== 1) {
            return false;
        }
    }
    return true;
}

function getExpectedRankValue(handType) {
    switch(handType) {
        case "High Card": return 1;
        case "Pair": return 2;
        case "Two Pair": return 3;
        case "Three of a Kind": return 4;
        case "Straight": return 5;
        case "Flush": return 6;
        case "Full House": return 7;
        case "Four of a Kind": return 8;
        case "Straight Flush": return 9;
        case "Five of a Kind": return 10;
        default: return 0;
    }
}

function getRankTypeName(rankValue) {
    const names = {
        1: "High Card",
        2: "Pair",
        3: "Two Pair",
        4: "Three of a Kind",
        5: "Straight",
        6: "Flush",
        7: "Full House",
        8: "Four of a Kind",
        9: "Straight Flush",
        10: "Five of a Kind"
    };
    return names[rankValue] || "Unknown";
}