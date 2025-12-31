// js/hands/check-arrangement-for-automatic.js
// Check if current arrangement matches any automatic pattern

/**
 * Check if the current arrangement is an automatic
 * @param {Array<Card>} back - Back hand cards
 * @param {Array<Card>} middle - Middle hand cards
 * @param {Array<Card>} front - Front hand cards
 * @returns {Object} - {isAutomatic: boolean, type: string}
 */
function checkArrangementForAutomatic(back, middle, front) {
    // Check Dragon first (most specific pattern)
    if (isDragon(back, middle, front)) {
        return { isAutomatic: true, type: 'Dragon' };
    }

    // For other automatics, all hands must be exactly 5 cards
    if (back.length !== 5 || middle.length !== 5 || front.length !== 5) {
        return { isAutomatic: false };
    }

    // Check Three-Full-Houses
    if (isThreeFullHouses(back, middle, front)) {
        return { isAutomatic: true, type: 'Three-Full-Houses' };
    }

    // Check Three-Flush
    if (isThreeFlush(back, middle, front)) {
        return { isAutomatic: true, type: 'Three-Flush' };
    }

    // Check Three-Straight
    if (isThreeStraight(back, middle, front)) {
        return { isAutomatic: true, type: 'Three-Straight' };
    }

    return { isAutomatic: false };
}

/**
 * Check if arrangement is a Dragon
 * Back: A, K, Q, J, T (5 cards)
 * Middle: 9, 8, 7, 6, 5 (5 cards)
 * Front: 4, 3, 2 (3 cards)
 * Wild cards can substitute for missing ranks
 */
function isDragon(back, middle, front) {
    // Dragon requires specific card counts
    if (back.length !== 5 || middle.length !== 5 || front.length !== 3) {
        return false;
    }

    // Required ranks for each hand
    const requiredBack = new Set([14, 13, 12, 11, 10]); // A, K, Q, J, T
    const requiredMiddle = new Set([9, 8, 7, 6, 5]);
    const requiredFront = new Set([4, 3, 2]);

    // Check if each hand contains required ranks (with wild cards)
    return hasRequiredRanks(back, requiredBack) &&
           hasRequiredRanks(middle, requiredMiddle) &&
           hasRequiredRanks(front, requiredFront);
}

/**
 * Check if cards contain all required ranks (wild cards can substitute)
 */
function hasRequiredRanks(cards, requiredRanks) {
    const normalCards = cards.filter(c => !c.isWild);
    const wildCount = cards.filter(c => c.isWild).length;

    // Count how many required ranks we have
    const foundRanks = normalCards.filter(c => requiredRanks.has(c.value)).length;
    const missingRanks = requiredRanks.size - foundRanks;

    // Wild cards must be able to fill the gaps
    return missingRanks <= wildCount && foundRanks + wildCount === requiredRanks.size;
}

/**
 * Check if all three 5-card hands are full houses
 */
function isThreeFullHouses(back, middle, front) {
    const backEval = evaluateHand(back);
    const middleEval = evaluateHand(middle);
    const frontEval = evaluateHand(front);

    // All three must be full houses (handType === 7)
    return backEval.handType === 7 &&
           middleEval.handType === 7 &&
           frontEval.handType === 7;
}

/**
 * Check if all three 5-card hands are flushes (or better)
 */
function isThreeFlush(back, middle, front) {
    const backEval = evaluateHand(back);
    const middleEval = evaluateHand(middle);
    const frontEval = evaluateHand(front);

    // All three must be at least flush (handType >= 6)
    // Flush=6, Full House=7, etc. are all valid
    return backEval.handType >= 6 &&
           middleEval.handType >= 6 &&
           frontEval.handType >= 6;
}

/**
 * Check if all three 5-card hands are straights (or better)
 */
function isThreeStraight(back, middle, front) {
    const backEval = evaluateHand(back);
    const middleEval = evaluateHand(middle);
    const frontEval = evaluateHand(front);

    // All three must be at least straight (handType >= 5)
    // Straight=5, Flush=6, Full House=7, etc. are all valid
    return backEval.handType >= 5 &&
           middleEval.handType >= 5 &&
           frontEval.handType >= 5;
}
