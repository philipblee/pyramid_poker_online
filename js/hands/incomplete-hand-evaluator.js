// js/hands/incomplete-hand-evaluator.js v1
// Evaluates incomplete hands (1, 2, 4 cards) that need kickers
// Keeps card-evaluation.js clean for complete hands only

/**
 * Evaluate incomplete hands (1, 2, or 4 cards) and generate proper hand_rank tuples
 * @param {Array} cards - Array of card objects
 * @param {string} handType - Hand type string (e.g., 'Pair', 'High Card', '4 of a Kind')
 * @returns {Object} - Hand strength object with proper hand_rank tuple
 */
function evaluateIncompleteHand(cards, handType) {
    console.log(`🔧 Evaluating incomplete hand: ${handType} with ${cards.length} cards`);

    if (!cards || cards.length === 0) {
        return { rank: 0, hand_rank: [0, 0], name: 'Invalid' };
    }

    // Handle wild cards if present
    const wildCards = cards.filter(c => c.isWild);
    const normalCards = cards.filter(c => !c.isWild);

    if (wildCards.length > 0) {
        return evaluateIncompleteHandWithWilds(normalCards, wildCards.length, handType);
    }

    // Sort cards by value (highest first)
    const sortedCards = [...cards].sort((a, b) => b.value - a.value);
    const values = sortedCards.map(c => c.value);

    // Generate hand_rank tuple based on hand type and card count
    switch (cards.length) {
        case 1:
            return evaluateOneCardHand(values, handType);
        case 2:
            return evaluateTwoCardHand(values, handType);
        case 4:
            return evaluateFourCardHand(values, handType, cards);
        default:
            console.warn(`⚠️ Unexpected card count for incomplete hand: ${cards.length}`);
            return { rank: 0, hand_rank: [0, 0], name: 'Invalid' };
    }
}

/**
 * Evaluate 1-card hands (High Card)
 * @param {Array} values - Sorted card values
 * @param {string} handType - Should be 'High Card'
 * @returns {Object} - Hand strength object
 */
function evaluateOneCardHand(values, handType) {
    if (handType !== 'High Card') {
        console.warn(`⚠️ Unexpected hand type for 1-card hand: ${handType}`);
    }

    const highCard = values[0];

    return {
        rank: 0,                    // High Card base rank
        hand_rank: [1, highCard],   // [1=High Card type, high card value]
        name: 'High Card'
    };
}

/**
 * Evaluate 2-card hands (Pairs that need kickers)
 * @param {Array} values - Sorted card values
 * @param {string} handType - Should be 'Pair'
 * @returns {Object} - Hand strength object
 */
function evaluateTwoCardHand(values, handType) {
    if (handType !== 'Pair') {
        console.warn(`⚠️ Unexpected hand type for 2-card hand: ${handType}`);
        // Handle as high card if not a pair
        return {
            rank: 0,
            hand_rank: [1, values[0], values[1] || 0],
            name: 'High Card'
        };
    }

    // Should be a pair - both cards same value
    const pairRank = values[0];

    if (values[0] !== values[1]) {
        console.warn(`⚠️ 2-card hand marked as Pair but values don't match: ${values}`);
    }

    return {
        rank: 1,                           // Pair base rank
        hand_rank: [2, pairRank],          // [2=Pair type, pair rank] - kickers added later
        name: 'Pair'
    };
}

/**
 * Evaluate 4-card hands (4 of a Kind or Two Pair that need kickers)
 * @param {Array} values - Sorted card values
 * @param {string} handType - '4 of a Kind' or 'Two Pair'
 * @param {Array} cards - Original card objects for analysis
 * @returns {Object} - Hand strength object
 */
function evaluateFourCardHand(values, handType, cards) {
    // Count occurrences of each value
    const valueCounts = {};
    values.forEach(val => valueCounts[val] = (valueCounts[val] || 0) + 1);

    if (handType === '4 of a Kind') {
        return evaluateFourOfAKind(values, valueCounts);
    } else if (handType === 'Two Pair') {
        return evaluateTwoPair(values, valueCounts);
    } else {
        console.warn(`⚠️ Unexpected hand type for 4-card hand: ${handType}`);
        return { rank: 0, hand_rank: [0, 0], name: 'Invalid' };
    }
}

/**
 * Evaluate 4 of a Kind (4 cards, needs 1 kicker)
 * @param {Array} values - Sorted card values
 * @param {Object} valueCounts - Count of each value
 * @returns {Object} - Hand strength object
 */
function evaluateFourOfAKind(values, valueCounts) {
    // Find the rank that appears 4 times
    const quadRank = Object.entries(valueCounts)
        .find(([rank, count]) => count === 4)?.[0];

    if (!quadRank) {
        console.warn(`⚠️ 4 of a Kind hand doesn't have 4 matching cards: ${values}`);
        return { rank: 0, hand_rank: [0, 0], name: 'Invalid' };
    }

    const quadValue = parseInt(quadRank);

    return {
        rank: 7,                           // Four of a Kind base rank
        hand_rank: [8, quadValue],         // [8=Four of a Kind type, quad rank] - kicker added later
        name: '4 of a Kind'
    };
}

/**
 * Evaluate Two Pair (4 cards, needs 1 kicker)
 * @param {Array} values - Sorted card values
 * @param {Object} valueCounts - Count of each value
 * @returns {Object} - Hand strength object
 */
function evaluateTwoPair(values, valueCounts) {
    // Find the two ranks that appear twice each
    const pairs = Object.entries(valueCounts)
        .filter(([rank, count]) => count === 2)
        .map(([rank, count]) => parseInt(rank))
        .sort((a, b) => b - a); // Sort pairs by rank (highest first)

    if (pairs.length !== 2) {
        console.warn(`⚠️ Two Pair hand doesn't have exactly 2 pairs: ${values}`);
        return { rank: 0, hand_rank: [0, 0], name: 'Invalid' };
    }

    const higherPair = pairs[0];
    const lowerPair = pairs[1];

    return {
        rank: 2,                                      // Two Pair base rank
        hand_rank: [3, higherPair, lowerPair],        // [3=Two Pair type, higher pair, lower pair] - kicker added later
        name: 'Two Pair'
    };
}

/**
 * Evaluate incomplete hands with wild cards
 * @param {Array} normalCards - Non-wild cards
 * @param {number} wildCount - Number of wild cards
 * @param {string} handType - Hand type string
 * @returns {Object} - Hand strength object
 */
function evaluateIncompleteHandWithWilds(normalCards, wildCount, handType) {
    console.log(`🃏 Evaluating incomplete hand with ${wildCount} wilds: ${handType}`);

    const values = normalCards.map(c => c.value).sort((a, b) => b - a);
    const totalCards = normalCards.length + wildCount;

    // For incomplete hands with wilds, we optimize the wild usage
    switch (totalCards) {
        case 1:
            // 1 wild card = make highest possible card (Ace)
            const highCard = values[0] || 14;
            return {
                rank: 0,
                hand_rank: [1, Math.max(highCard, 14)],
                name: 'High Card (Wild)'
            };

        case 2:
            // 1 normal + 1 wild = make pair with the normal card
            if (normalCards.length === 1 && wildCount === 1) {
                const pairRank = values[0];
                return {
                    rank: 1,
                    hand_rank: [2, pairRank],
                    name: 'Pair (Wild)'
                };
            }
            // 2 wilds = make pair of Aces
            if (wildCount === 2) {
                return {
                    rank: 1,
                    hand_rank: [2, 14],
                    name: 'Pair (Wild)'
                };
            }
            break;

        case 4:
            // For 4-card incomplete hands with wilds, optimize based on hand type
            if (handType === '4 of a Kind') {
                const quadRank = values[0] || 14; // Use highest normal card or Ace
                return {
                    rank: 7,
                    hand_rank: [8, quadRank],
                    name: '4 of a Kind (Wild)'
                };
            } else if (handType === 'Two Pair') {
                // Make two pairs with highest possible ranks
                const firstPair = values[0] || 14;
                const secondPair = values[1] || 13;
                const higherPair = Math.max(firstPair, secondPair);
                const lowerPair = Math.min(firstPair, secondPair);
                return {
                    rank: 2,
                    hand_rank: [3, higherPair, lowerPair],
                    name: 'Two Pair (Wild)'
                };
            }
            break;
    }

    // Fallback - treat as high card with best possible wild usage
    const bestHighCard = Math.max(values[0] || 0, 14);
    return {
        rank: 0,
        hand_rank: [1, bestHighCard],
        name: 'High Card (Wild)'
    };
}

/**
 * Check if a hand is incomplete (needs kickers)
 * @param {number} cardCount - Number of cards in hand
 * @param {string} handType - Hand type string
 * @returns {boolean} - True if hand is incomplete
 */
function isIncompleteHand(cardCount, handType) {
    return cardCount === 1 ||
           cardCount === 2 ||
           (cardCount === 4 && (handType.includes('of a Kind') || handType === 'Two Pair'));
}

/**
 * Main evaluation router - decides between complete and incomplete evaluation
 * @param {Array} cards - Array of card objects
 * @param {string} handType - Hand type string
 * @returns {Object} - Hand strength object
 */
function evaluateHandSmart(cards, handType) {
    if (isIncompleteHand(cards.length, handType)) {
        return evaluateIncompleteHand(cards, handType);
    } else {
        // Use existing complete hand evaluation
        if (cards.length === 3) {
            return evaluateThreeCardHand(cards);
        } else {
            return evaluateHand(cards);
        }
    }
}