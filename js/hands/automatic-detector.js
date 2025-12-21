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
 * Compare two automatics by precedence
 * @param {Object} auto1 - {type, precedence}
 * @param {Object} auto2 - {type, precedence}
 * @returns {number} - Positive if auto1 > auto2, negative if auto1 < auto2, 0 if equal
 */
function compareAutomatics(auto1, auto2) {
    return auto2.precedence - auto1.precedence; // Higher precedence wins
}
