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
 * Check if all three hands are full houses
 */
function hasThreeFullHouses(arrangement) {
    const backEval = evaluateHand(arrangement.back);
    const middleEval = evaluateHand(arrangement.middle);
    const frontEval = evaluateThreeCardHand(arrangement.front);
    
    return backEval.name === 'Full House' &&
           middleEval.name === 'Full House' &&
           frontEval.name === 'Full House';
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

/**
 * Check if all three hands are flushes
 */
function hasThreeFlush(arrangement) {
    const backEval = evaluateHand(arrangement.back);
    const middleEval = evaluateHand(arrangement.middle);
    const frontEval = evaluateThreeCardHand(arrangement.front);
    
    return backEval.name.includes('Flush') &&
           middleEval.name.includes('Flush') &&
           frontEval.name.includes('Flush');
}

/**
 * Check if all three hands are straights
 */
function hasThreeStraight(arrangement) {
    const backEval = evaluateHand(arrangement.back);
    const middleEval = evaluateHand(arrangement.middle);
    const frontEval = evaluateThreeCardHand(arrangement.front);
    
    return backEval.name.includes('Straight') &&
           middleEval.name.includes('Straight') &&
           frontEval.name.includes('Straight');
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
