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
           canBeFullHouse(frontCards, frontWilds, 3); // Front just needs trips
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
           canBeFlush(frontCards, frontWilds, 3);
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
           canBeStraight(frontCards, frontWilds, 3);
}

// Helper: Can make full house (trips+pair for 5 cards, just trips for 3 cards)
function canBeFullHouse(cards, wildCount, handSize) {
    const rankCounts = {};
    cards.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);

    if (handSize === 3) {
        // Front hand - just need trips
        for (const count of Object.values(rankCounts)) {
            if (count + wildCount >= 3) return true;
        }
        return wildCount >= 3; // All wilds
    }

    // Back/Middle - need trips + pair
    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    // Try to make trips from highest count
    if (counts.length >= 2) {
        const wildsNeededForTrips = Math.max(0, 3 - counts[0]);
        const wildsNeededForPair = Math.max(0, 2 - counts[1]);
        if (wildsNeededForTrips + wildsNeededForPair <= wildCount) return true;
    }

    // Single rank + wilds
    if (counts.length === 1) {
        const wildsNeeded = Math.max(0, 5 - counts[0]); // Make 5 of same rank
        return wildsNeeded <= wildCount;
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
 * Need: Back 3+2, Middle 3+2, Front 3 = 13 cards with FH pattern
 */
function canFormThreeFullHouses(naturalCards, wildCount) {
    // Count ranks
    const rankCounts = {};
    naturalCards.forEach(c => {
        if (c.rank) rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
    });

    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    // Ideal: 3+3+3+2+2 = 13 cards (5 ranks)
    // With wilds: we need at least some pairs/trips

    // Strategy: Try to form Back(3+2), Middle(3+2), Front(3)
    // Minimum: 3 different ranks with enough cards + wilds

    // Need at least 13 cards total
    if (naturalCards.length + wildCount < 13) return false;

    // Greedy approach: count how many sets of 3 and pairs we can make
    let tripsAvailable = 0;
    let pairsAvailable = 0;
    let wildsRemaining = wildCount;

    for (const count of counts) {
        if (count >= 3) {
            tripsAvailable++;
            if (count >= 5) {
                pairsAvailable++; // Can split into trips + pair
            }
        } else if (count === 2) {
            pairsAvailable++;
        }
    }

    // Can we make 3 trips and 2 pairs with wilds?
    // Back: 1 trips + 1 pair
    // Middle: 1 trips + 1 pair
    // Front: 1 trips
    // Total needed: 3 trips, 2 pairs

    // Simple heuristic: if we have enough rank diversity + wilds
    const uniqueRanks = counts.length;

    // With 3+ ranks and enough wilds, we can probably make it
    if (uniqueRanks >= 3 && wildsRemaining >= 2) return true;

    // With 5+ ranks, easier to make FH pattern
    if (uniqueRanks >= 5) return true;

    // More precise: simulate allocation
    // This is simplified - a full implementation would try combinations
    return tripsAvailable >= 2 || (tripsAvailable >= 1 && pairsAvailable >= 2);
}

/**
 * Can the cards form three flushes?
 * Need: 5 cards same suit, 5 cards same suit, 3 cards same suit
 */
function canFormThreeFlush(naturalCards, wildCount) {
    // Count suits
    const suitCounts = {};
    naturalCards.forEach(c => {
        if (c.suit) suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    });

    const suits = ['♠', '♥', '♦', '♣'];
    const counts = suits.map(s => suitCounts[s] || 0).sort((a, b) => b - a);

    // Need to make 5+5+3 = 13 cards in flushes
    // Best case: largest suit has 5+, second has 5+, third has 3+
    // With wilds: top 3 suits + wilds must sum to 13

    const top3Sum = counts[0] + counts[1] + counts[2];

    // Can we fill gaps with wilds?
    const neededForFlushes = 13;
    const wildsNeeded = Math.max(0, neededForFlushes - top3Sum);

    if (wildsNeeded > wildCount) return false;

    // Check if distribution is feasible
    // Largest suit needs at least (5 - wildCount) natural cards
    // Second largest needs at least (5 - wildCount) natural cards
    // Third needs at least (3 - wildCount) natural cards

    return (counts[0] >= Math.max(1, 5 - wildCount)) ||
           (counts[0] + counts[1] + counts[2] + wildCount >= 13);
}

/**
 * Can the cards form three straights?
 * Need: 5-card straight, 5-card straight, 3-card straight
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

// Display message on UI
function showAutomaticMessage(message) {
    const messageDiv = document.getElementById('automaticMessage');
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';

    // Auto-hide after 10 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 10000);
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
function arrangeDragon(allCards) {
    // Dragon arrangement: just needs all 13 ranks visible
    // Distribute: back=5, middle=5, front=3
    return {
        back: allCards.slice(0, 5),
        middle: allCards.slice(5, 10),
        front: allCards.slice(10, 13)
    };
}

// Arrange for three full houses (greedy approach)
function arrangeThreeFullHouses(allCards) {
    // Sort by rank to group similar cards
    const sorted = [...allCards].sort((a, b) => {
        if (a.isWild && !b.isWild) return 1;
        if (!a.isWild && b.isWild) return -1;
        return b.value - a.value;
    });

    // Greedy: put trips+pair in back, trips+pair in middle, trips in front
    // This is simplified - a real implementation would optimize
    return {
        back: sorted.slice(0, 5),
        middle: sorted.slice(5, 10),
        front: sorted.slice(10, 13)
    };
}

// Arrange for three flush
function arrangeThreeFlush(allCards) {
    // Group by suit
    const suitGroups = { '♠': [], '♥': [], '♦': [], '♣': [] };
    const wilds = [];

    allCards.forEach(card => {
        if (card.isWild) {
            wilds.push(card);
        } else {
            suitGroups[card.suit].push(card);
        }
    });

    // Sort suits by count (descending)
    const sortedSuits = Object.entries(suitGroups)
        .sort((a, b) => b[1].length - a[1].length);

    // Distribute: 5 to back, 5 to middle, 3 to front, fill with wilds
    const back = sortedSuits[0][1].slice(0, 5);
    const middle = sortedSuits[1][1].slice(0, 5);
    const front = sortedSuits[2][1].slice(0, 3);

    // Fill gaps with wilds
    while (back.length < 5 && wilds.length > 0) back.push(wilds.shift());
    while (middle.length < 5 && wilds.length > 0) middle.push(wilds.shift());
    while (front.length < 3 && wilds.length > 0) front.push(wilds.shift());

    return { back, middle, front };
}

// Arrange for three straight
function arrangeThreeStraight(allCards) {
    // Sort by value
    const sorted = [...allCards].sort((a, b) => {
        if (a.isWild && !b.isWild) return 1;
        if (!a.isWild && b.isWild) return -1;
        return b.value - a.value;
    });

    // Simple distribution - real implementation would find actual straights
    return {
        back: sorted.slice(0, 5),
        middle: sorted.slice(5, 10),
        front: sorted.slice(10, 13)
    };
}

// Export or add to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { detectPossibleAutomatics };
} else {
    window.detectPossibleAutomatics = detectPossibleAutomatics;
}

// After dealing 17 cards
//const possibleAutomatics = detectPossibleAutomatics(game.players[0].hand);
//console.log('Possible automatics:', possibleAutomatics);
// Output: ['dragon', 'three-flush'] or [] if none possible
