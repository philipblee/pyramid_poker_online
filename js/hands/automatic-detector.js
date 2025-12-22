// js/hands/automatic-detector.js
// Automatic hand detection for Pyramid Poker

/**
 * Automatic hand types and their precedence (higher = better)
 */
const AUTOMATIC_TYPES = {
    'three-full-houses': 4,  // Highest
    'dragon': 3,
    'three-flush': 2,
    'three-straight': 1     // Lowest
};

/**
 * Detect if an arrangement qualifies as an automatic
 * @param {Object} arrangement - {back, middle, front} with cards
 * @returns {Object|null} - {type, precedence} or null if no automatic
 */
function detectAutomatic(arrangement) {
    // Check in precedence order (highest first)
    if (hasThreeFullHouses(arrangement)) {
        return { type: 'three-full-houses', precedence: AUTOMATIC_TYPES['three-full-houses'] };
    }
    if (hasDragon(arrangement)) {
        return { type: 'dragon', precedence: AUTOMATIC_TYPES['dragon'] };
    }
    if (hasThreeFlush(arrangement)) {
        return { type: 'three-flush', precedence: AUTOMATIC_TYPES['three-flush'] };
    }
    if (hasThreeStraight(arrangement)) {
        return { type: 'three-straight', precedence: AUTOMATIC_TYPES['three-straight'] };
    }
    return null; // No automatic
}

/**
 * Check if arrangement has a dragon (one of each rank A-2)
 */
function hasDragon(arrangement) {
    const allCards = [
        ...arrangement.back,
        ...arrangement.middle,
        ...arrangement.front
    ];

    // Must have exactly 13 cards total
    if (allCards.length !== 13) return false;

    const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    const foundRanks = new Set();
    let wildCount = 0;

    allCards.forEach(card => {
        if (card.isWild) {
            wildCount++;
        } else if (card.rank) {
            foundRanks.add(card.rank);
        }
    });

    // Dragon = all 13 ranks (natural + wilds filling gaps)
    const totalUniqueRanks = foundRanks.size + wildCount;
    return totalUniqueRanks === 13 && allCards.length === 13;
}

function hasThreeFullHouses(arrangement) {
    const backCards = arrangement.back.filter(c => !c.isWild);
    const middleCards = arrangement.middle.filter(c => !c.isWild);
    const frontCards = arrangement.front.filter(c => !c.isWild);

    const backWilds = arrangement.back.filter(c => c.isWild).length;
    const middleWilds = arrangement.middle.filter(c => c.isWild).length;
    const frontWilds = arrangement.front.filter(c => c.isWild).length;

    return canBeFullHouse(backCards, backWilds, 5) &&
           canBeFullHouse(middleCards, middleWilds, 5) &&
           canBeFullHouse(frontCards, frontWilds, 5);
}

function hasThreeFlush(arrangement) {
    const backCards = arrangement.back.filter(c => !c.isWild);
    const middleCards = arrangement.middle.filter(c => !c.isWild);
    const frontCards = arrangement.front.filter(c => !c.isWild);

    const backWilds = arrangement.back.filter(c => c.isWild).length;
    const middleWilds = arrangement.middle.filter(c => c.isWild).length;
    const frontWilds = arrangement.front.filter(c => c.isWild).length;

    return canBeFlush(backCards, backWilds, 5) &&
           canBeFlush(middleCards, middleWilds, 5) &&
           canBeFlush(frontCards, frontWilds, 5);
}

function hasThreeStraight(arrangement) {
    const backCards = arrangement.back.filter(c => !c.isWild);
    const middleCards = arrangement.middle.filter(c => !c.isWild);
    const frontCards = arrangement.front.filter(c => !c.isWild);

    const backWilds = arrangement.back.filter(c => c.isWild).length;
    const middleWilds = arrangement.middle.filter(c => c.isWild).length;
    const frontWilds = arrangement.front.filter(c => c.isWild).length;

    return canBeStraight(backCards, backWilds, 5) &&
           canBeStraight(middleCards, middleWilds, 5) &&
           canBeStraight(frontCards, frontWilds, 5);
}

// Helper: Can make full house (trips+pair for 5 cards)
function canBeFullHouse(cards, wildCount, handSize) {
    const rankCounts = {};
    cards.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);

    // Back/Middle - need trips + pair
    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    // Try to make trips from highest count
    if (counts.length >= 2) {
        const wildsNeededForTrips = Math.max(0, 3 - counts[0]);
        const wildsNeededForPair = Math.max(0, 2 - counts[1]);
        if (wildsNeededForTrips + wildsNeededForPair <= wildCount) return true;
    }

    // All wilds
    return wildCount >= 5;
}

// Helper: Can make flush (all same suit)
function canBeFlush(cards, wildCount, handSize) {
    const suitCounts = {};
    cards.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);

    const maxSuitCount = Math.max(...Object.values(suitCounts), 0);
    return maxSuitCount + wildCount >= handSize;
}

// Helper: Can make straight (consecutive ranks)
function canBeStraight(cards, wildCount, handSize) {
    if (cards.length + wildCount < handSize) return false;

    const ranks = [...new Set(cards.map(c => c.value))].sort((a, b) => b - a);

    // Try each possible straight starting point
    const straightStarts = handSize === 5 ? [14, 13, 12, 11, 10, 9, 8, 7, 6, 5] : [14, 13, 12];

    for (const high of straightStarts) {
        const neededRanks = [];
        for (let i = 0; i < handSize; i++) {
            let rank = high - i;
            if (rank === 1 && high === 14) rank = 14; // Ace in wheel
            neededRanks.push(rank);
        }

        const missingRanks = neededRanks.filter(r => !ranks.includes(r));
        if (missingRanks.length <= wildCount) return true;
    }

    // Check wheel (A-2-3-4-5 or A-2-3 for front)
    if (handSize === 5) {
        const wheelRanks = [14, 2, 3, 4, 5];
        const missingWheel = wheelRanks.filter(r => !ranks.includes(r));
        if (missingWheel.length <= wildCount) return true;
    }

    return false;
}

/**
 * Detect if 17 cards can form ANY automatic pattern
 * @param {Array} allCards - All 17 cards dealt to player
 * @returns {Array} - List of possible automatics: ['dragon', 'three-full-houses', etc.]
 */
function detectPossibleAutomatics(allCards) {
    const possibleAutomatics = [];

    // Separate wilds from natural cards
    const naturalCards = allCards.filter(c => !c.isWild);
    const wildCount = allCards.filter(c => c.isWild).length;

    // Check Dragon (easiest - just need all 13 ranks)
    if (canFormDragon(naturalCards, wildCount)) {
        possibleAutomatics.push('dragon');
    }

    // Check Three Full Houses
    if (canFormThreeFullHouses(naturalCards, wildCount)) {
        possibleAutomatics.push('three-full-houses');
    }

    // Check Three Flush
    if (canFormThreeFlush(naturalCards, wildCount)) {
        possibleAutomatics.push('three-flush');
    }

    // Check Three Straight
    if (canFormThreeStraight(naturalCards, wildCount)) {
        possibleAutomatics.push('three-straight');
    }

    return possibleAutomatics;
}

/**
 * Can the cards form a dragon (all 13 ranks)?
 */
function canFormDragon(naturalCards, wildCount) {
    const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    const foundRanks = new Set();

    naturalCards.forEach(card => {
        if (card.rank) foundRanks.add(card.rank);
    });

    const missingRanks = ranks.filter(r => !foundRanks.has(r)).length;
    return missingRanks <= wildCount && (foundRanks.size + wildCount) >= 13;
}

/**
 * Can the cards form three full houses?
 * Need: Back 3+2, Middle 3+2, Front 3+2 = 15 cards with FH pattern
 */
function canFormThreeFullHouses(naturalCards, wildCount) {
    const rankCounts = {};
    naturalCards.forEach(c => {
        if (c.rank) rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
    });

    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    // Need at least 15 cards total for three 5-card full houses
    if (naturalCards.length + wildCount < 15) return false;

    // Count available trips and pairs
    let tripsAvailable = 0;
    let pairsAvailable = 0;

    for (const count of counts) {
        if (count >= 3) {
            tripsAvailable++;
            // A rank with 5+ can provide BOTH trips and pair
            if (count >= 5) {
                pairsAvailable++;
            }
        } else if (count === 2) {
            pairsAvailable++;
        }
    }

    // Calculate what we need to build with wilds
    // Need: 3 trips and 3 pairs (but FH uses trips+pair from different ranks)
    const tripsNeeded = Math.max(0, 3 - tripsAvailable);
    const pairsNeeded = Math.max(0, 3 - pairsAvailable);

    // Estimate wilds needed (rough heuristic)
    // Converting pair→trips needs 1 wild
    // Creating pair from singles needs 2 wilds
    // Creating trips from singles needs 3 wilds

    // Simplified: if we have lots of wilds, we can fill gaps
    if (wildCount >= 6) return true;  // Very flexible with many wilds

    // Conservative: need at least 2 trips OR 1 trip + 2 pairs
    if (tripsAvailable >= 3 && pairsAvailable >= 3) return true;
    if (tripsAvailable >= 2 && pairsAvailable >= 2 && wildCount >= 3) return true;
    if (tripsAvailable >= 1 && pairsAvailable >= 3 && wildCount >= 2) return true;

    return false;
}

/**
 * Can the cards form three flushes?
 * Need: 5 cards same suit, 5 cards same suit, 5 cards same suit
 */
function canFormThreeFlush(naturalCards, wildCount) {
    // Count natural cards by suit
    const suitCounts = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 };
    naturalCards.forEach(c => {
        if (c.suit) suitCounts[c.suit]++;
    });

    // Get counts in descending order
    const counts = Object.values(suitCounts).sort((a, b) => b - a);

    // Need at least 15 cards total for three 5-card flushes
    if (naturalCards.length + wildCount < 15) return false;

    // Calculate wilds needed to bring top 3 suits to 5 cards each
    const wildsForSuit1 = Math.max(0, 5 - counts[0]);
    const wildsForSuit2 = Math.max(0, 5 - counts[1]);
    const wildsForSuit3 = Math.max(0, 5 - counts[2]);

    const totalWildsNeeded = wildsForSuit1 + wildsForSuit2 + wildsForSuit3;

    return totalWildsNeeded <= wildCount;
}

/**
 * Can the cards form three straights?
 * Need: 5-card straight, 5-card straight, 5-card straight
 */
function canFormThreeStraight(naturalCards, wildCount) {
    // Get unique ranks (by value)
    const rankValues = [...new Set(naturalCards.map(c => c.value))].sort((a, b) => b - a);

    // Need enough rank coverage for 3 straights
    // 5-card straight needs 5 consecutive ranks (or gaps filled by wilds)
    // 3-card straight needs 3 consecutive ranks

    // Heuristic: if we have 8+ unique ranks + some wilds, likely possible
    const uniqueRankCount = rankValues.length;

    if (uniqueRankCount >= 10) return true; // Lots of ranks = easy
    if (uniqueRankCount >= 7 && wildCount >= 2) return true;

    // More precise: check for consecutive sequences
    // This is complex - simplified version:
    return (uniqueRankCount + wildCount) >= 11; // Need ~11 ranks worth
}

/**
 * Compare two automatics by precedence
 * @param {Object} auto1 - {type, precedence}
 * @param {Object} auto2 - {type, precedence}
 * @returns {number} - Positive if auto1 > auto2, negative if auto1 < auto2, 0 if equal
 */
function compareAutomatics(auto1, auto2) {
    return auto2.precedence - auto1.precedence; // Higher precedence wins
}

/**
 * Find and arrange the best automatic from 17 cards
 * @param {Array} allCards - All 17 cards
 * @returns {Object} - {type, arrangement} or null
 */
function findAndArrangeBestAutomatic(allCards) {
    const possibleAutomatics = detectPossibleAutomatics(allCards);

    if (possibleAutomatics.length === 0) {
        return null;
    }

    // Pick highest precedence
    const precedenceOrder = ['three-full-houses', 'dragon', 'three-flush', 'three-straight'];
    const bestAutomatic = precedenceOrder.find(type => possibleAutomatics.includes(type));

    // Arrange cards for that automatic
    let arrangement;
    switch(bestAutomatic) {
        case 'dragon':
            arrangement = arrangeDragon(allCards);
            break;
        case 'three-full-houses':
            arrangement = arrangeThreeFullHouses(allCards);
            break;
        case 'three-flush':
            arrangement = arrangeThreeFlush(allCards);
            break;
        case 'three-straight':
            arrangement = arrangeThreeStraight(allCards);
            break;
    }

    return { type: bestAutomatic, arrangement };
}

// Arrange cards for dragon (distribute across back/middle/front showing all 13 ranks)
// Three-full-houses - build trips+pairs
function arrangeThreeFullHouses(allCards) {
    const wilds = allCards.filter(c => c.isWild);
    const naturals = allCards.filter(c => !c.isWild);

    // Count ranks
    const rankGroups = {};
    naturals.forEach(c => {
        if (!rankGroups[c.rank]) rankGroups[c.rank] = [];
        rankGroups[c.rank].push(c);
    });

    // Separate: TRIPS (exactly 3+) and PAIRS (exactly 2, NOT from trips)
    const tripsRanks = [];
    const pairsRanks = [];

    for (const [rank, cards] of Object.entries(rankGroups)) {
        if (cards.length >= 3) {
            tripsRanks.push({rank, cards});
        } else if (cards.length === 2) {  // ONLY pairs, not from trips
            pairsRanks.push({rank, cards});
        }
    }

    // Sort by value
    tripsRanks.sort((a, b) => b.cards[0].value - a.cards[0].value);
    pairsRanks.sort((a, b) => b.cards[0].value - a.cards[0].value);

    const back = [];
    const middle = [];
    const front = [];

    // Allocate: trips[0]+pair[0], trips[1]+pair[1], trips[2]+pair[2]
    if (tripsRanks[0] && pairsRanks[0]) {
        back.push(...tripsRanks[0].cards.slice(0, 3));
        back.push(...pairsRanks[0].cards.slice(0, 2));
    }

    if (tripsRanks[1] && pairsRanks[1]) {
        middle.push(...tripsRanks[1].cards.slice(0, 3));
        middle.push(...pairsRanks[1].cards.slice(0, 2));
    }

    if (tripsRanks[2] && pairsRanks[2]) {
        front.push(...tripsRanks[2].cards.slice(0, 3));
        front.push(...pairsRanks[2].cards.slice(0, 2));
    }

    // Fill with wilds if needed
    while (back.length < 5 && wilds.length > 0) back.push(wilds.shift());
    while (middle.length < 5 && wilds.length > 0) middle.push(wilds.shift());
    while (front.length < 5 && wilds.length > 0) front.push(wilds.shift());

    return { back, middle, front };
}

// Dragon - should already work, but here's a cleaner version
function arrangeDragon(allCards) {
    // Dragon just needs all 13 unique ranks visible
    // Simple distribution works fine
    return {
        back: allCards.slice(0, 5),
        middle: allCards.slice(5, 10),
        front: allCards.slice(10, 13)
    };
}

// Arrange for three flush
function arrangeThreeFlush(allCards) {
    // Separate wilds from naturals
    const wilds = allCards.filter(c => c.isWild);
    const naturals = allCards.filter(c => !c.isWild);

    // Group naturals by suit
    const suitGroups = { '♠': [], '♥': [], '♦': [], '♣': [] };
    naturals.forEach(c => suitGroups[c.suit].push(c));

    // Sort suits by count (descending)
    const sortedSuits = Object.entries(suitGroups)
        .sort((a, b) => b[1].length - a[1].length);

    // Take 5 from each of top 3 suits
    const back = [...sortedSuits[0][1].slice(0, 5)];
    const middle = [...sortedSuits[1][1].slice(0, 5)];
    const front = [...sortedSuits[2][1].slice(0, 5)];

    // Fill gaps with wilds
    let wildIndex = 0;
    while (back.length < 5 && wildIndex < wilds.length) {
        back.push(wilds[wildIndex++]);
    }
    while (middle.length < 5 && wildIndex < wilds.length) {
        middle.push(wilds[wildIndex++]);
    }
    while (front.length < 5 && wildIndex < wilds.length) {
        front.push(wilds[wildIndex++]);
    }

    return { back, middle, front };
}

// Three-straight - find 3 consecutive sequences
function arrangeThreeStraight(allCards) {
    const wilds = allCards.filter(c => c.isWild);
    const naturals = allCards.filter(c => !c.isWild);

    // Sort by value descending
    naturals.sort((a, b) => b.value - a.value);

    // Try to build three 5-card straights
    // Strategy: greedy approach - find highest straight first

    const back = [];
    const middle = [];
    const front = [];
    const used = new Set();

    // Helper: try to build a 5-card straight starting at highCard
    function buildStraight(targetHand, startValue) {
        const needed = [];
        for (let i = 0; i < 5; i++) {
            needed.push(startValue - i);
        }

        // Find cards for this straight
        for (const val of needed) {
            // Try to find natural card with this value
            const card = naturals.find(c => c.value === val && !used.has(c.id));
            if (card) {
                targetHand.push(card);
                used.add(card.id);
            } else if (wilds.length > 0) {
                // Use wild as substitute
                targetHand.push(wilds.shift());
            } else {
                return false; // Can't complete this straight
            }
        }
        return true;
    }

    // Try to build 3 straights (start high, work down)
    const attempts = [
        [back, 14],    // A-high
        [middle, 9],   // 9-high
        [front, 5]     // 5-high (wheel)
    ];

    for (const [hand, start] of attempts) {
        buildStraight(hand, start);
    }

    // If any hand is incomplete, fill with remaining cards
    const remaining = allCards.filter(c => !used.has(c.id) && !c.isWild);
    while (back.length < 5 && remaining.length > 0) back.push(remaining.shift());
    while (middle.length < 5 && remaining.length > 0) middle.push(remaining.shift());
    while (front.length < 5 && remaining.length > 0) front.push(remaining.shift());

    return { back, middle, front };
}


window.dealAutomatic = function(type) {
    // Clear everything first
    document.getElementById('playerHand').innerHTML = '';
    document.getElementById('backHand').innerHTML = '';
    document.getElementById('middleHand').innerHTML = '';
    document.getElementById('frontHand').innerHTML = '';

    const automaticHands = {
        // DRAGON: All 13 unique ranks (A-K-Q-J-10-9-8-7-6-5-4-3-2)
        'dragon': [
            {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: 'K♠_2', rank: 'K', suit: '♠', value: 13, isWild: false},
            {id: 'Q♠_3', rank: 'Q', suit: '♠', value: 12, isWild: false},
            {id: 'J♠_4', rank: 'J', suit: '♠', value: 11, isWild: false},
            {id: '10♠_5', rank: '10', suit: '♠', value: 10, isWild: false},
            {id: '9♥_6', rank: '9', suit: '♥', value: 9, isWild: false},
            {id: '8♥_7', rank: '8', suit: '♥', value: 8, isWild: false},
            {id: '7♥_8', rank: '7', suit: '♥', value: 7, isWild: false},
            {id: '6♥_9', rank: '6', suit: '♥', value: 6, isWild: false},
            {id: '5♥_10', rank: '5', suit: '♥', value: 5, isWild: false},
            {id: '4♦_11', rank: '4', suit: '♦', value: 4, isWild: false},
            {id: '3♦_12', rank: '3', suit: '♦', value: 3, isWild: false},
            {id: '2♦_13', rank: '2', suit: '♦', value: 2, isWild: false},
            {id: 'A♣_14', rank: 'A', suit: '♣', value: 14, isWild: false},
            {id: 'K♣_15', rank: 'K', suit: '♣', value: 13, isWild: false},
            {id: 'Q♣_16', rank: 'Q', suit: '♣', value: 12, isWild: false},
            {id: 'J♣_17', rank: 'J', suit: '♣', value: 11, isWild: false}
        ],

        // THREE-FLUSH: 5♠ + 5♥ + 5♦ (NOT dragon - only 5 ranks: A,K,Q,J,10)
        'three-flush': [
            {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: 'K♠_2', rank: 'K', suit: '♠', value: 13, isWild: false},
            {id: 'Q♠_3', rank: 'Q', suit: '♠', value: 12, isWild: false},
            {id: 'J♠_4', rank: 'J', suit: '♠', value: 11, isWild: false},
            {id: '10♠_5', rank: '10', suit: '♠', value: 10, isWild: false},
            {id: 'A♥_6', rank: 'A', suit: '♥', value: 14, isWild: false},
            {id: 'K♥_7', rank: 'K', suit: '♥', value: 13, isWild: false},
            {id: 'Q♥_8', rank: 'Q', suit: '♥', value: 12, isWild: false},
            {id: 'J♥_9', rank: 'J', suit: '♥', value: 11, isWild: false},
            {id: '10♥_10', rank: '10', suit: '♥', value: 10, isWild: false},
            {id: 'A♦_11', rank: 'A', suit: '♦', value: 14, isWild: false},
            {id: 'K♦_12', rank: 'K', suit: '♦', value: 13, isWild: false},
            {id: 'Q♦_13', rank: 'Q', suit: '♦', value: 12, isWild: false},
            {id: 'J♦_14', rank: 'J', suit: '♦', value: 11, isWild: false},
            {id: '10♦_15', rank: '10', suit: '♦', value: 10, isWild: false},
            {id: '9♣_16', rank: '9', suit: '♣', value: 9, isWild: false},
            {id: '8♣_17', rank: '8', suit: '♣', value: 8, isWild: false}
        ],

        // THREE-STRAIGHT: Mixed suits, overlapping ranks (NOT dragon - only 9 ranks: A,2,3,4,5,6,7,8,9)
        'three-straight': [
            {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: '2♥_2', rank: '2', suit: '♥', value: 2, isWild: false},
            {id: '3♦_3', rank: '3', suit: '♦', value: 3, isWild: false},
            {id: '4♣_4', rank: '4', suit: '♣', value: 4, isWild: false},
            {id: '5♠_5', rank: '5', suit: '♠', value: 5, isWild: false},
            {id: '7♥_6', rank: '7', suit: '♥', value: 7, isWild: false},
            {id: '6♦_7', rank: '6', suit: '♦', value: 6, isWild: false},
            {id: '5♣_8', rank: '5', suit: '♣', value: 5, isWild: false},
            {id: '4♠_9', rank: '4', suit: '♠', value: 4, isWild: false},
            {id: '3♥_10', rank: '3', suit: '♥', value: 3, isWild: false},
            {id: '9♦_11', rank: '9', suit: '♦', value: 9, isWild: false},
            {id: '8♣_12', rank: '8', suit: '♣', value: 8, isWild: false},
            {id: '7♠_13', rank: '7', suit: '♠', value: 7, isWild: false},
            {id: '6♥_14', rank: '6', suit: '♥', value: 6, isWild: false},
            {id: '5♦_15', rank: '5', suit: '♦', value: 5, isWild: false},
            {id: 'K♣_16', rank: 'K', suit: '♣', value: 13, isWild: false},
            {id: 'Q♣_17', rank: 'Q', suit: '♣', value: 12, isWild: false}
        ],

        // THREE-FULL-HOUSES: AAA22 + KKK88 + QQQ77 (15 cards)
        'three-full-houses': [
            {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: 'A♥_2', rank: 'A', suit: '♥', value: 14, isWild: false},
            {id: 'A♦_3', rank: 'A', suit: '♦', value: 14, isWild: false},
            {id: '2♠_4', rank: '2', suit: '♠', value: 2, isWild: false},
            {id: '2♥_5', rank: '2', suit: '♥', value: 2, isWild: false},
            {id: 'K♠_6', rank: 'K', suit: '♠', value: 13, isWild: false},
            {id: 'K♥_7', rank: 'K', suit: '♥', value: 13, isWild: false},
            {id: 'K♦_8', rank: 'K', suit: '♦', value: 13, isWild: false},
            {id: '8♠_9', rank: '8', suit: '♠', value: 8, isWild: false},
            {id: '8♥_10', rank: '8', suit: '♥', value: 8, isWild: false},
            {id: 'Q♠_11', rank: 'Q', suit: '♠', value: 12, isWild: false},
            {id: 'Q♥_12', rank: 'Q', suit: '♥', value: 12, isWild: false},
            {id: 'Q♦_13', rank: 'Q', suit: '♦', value: 12, isWild: false},
            {id: '7♠_14', rank: '7', suit: '♠', value: 7, isWild: false},
            {id: '7♥_15', rank: '7', suit: '♥', value: 7, isWild: false},
            {id: '3♣_16', rank: '3', suit: '♣', value: 3, isWild: false},
            {id: '4♣_17', rank: '4', suit: '♣', value: 4, isWild: false}
        ]
    };

    // Clear staging and deal
    const stagingArea = document.getElementById('playerHand');
    stagingArea.innerHTML = '';

    if (!automaticHands[type]) {
        console.error(`❌ Unknown automatic type: ${type}`);
        return;
    }

    automaticHands[type].forEach(card => {
        const cardEl = createCardElement(card);
        stagingArea.appendChild(cardEl);
    });

    console.log(`✅ Dealt ${type} automatic`);
};

// Export or add to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { detectPossibleAutomatics };
} else {
    window.detectPossibleAutomatics = detectPossibleAutomatics;
}

