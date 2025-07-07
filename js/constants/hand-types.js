// js/constants/hand-types.js
// Centralized hand type names with consistent numbering
// All multi-card hands use numbers for consistency

/**
 * Hand type constants - single source of truth for all hand type names
 * Uses consistent numbering: "3 of a Kind", "4 of a Kind", "5-card Straight Flush", etc.
 */
const HAND_TYPES = {
    // Basic poker hands
    HIGH_CARD: 'High Card',
    PAIR: 'Pair',
    TWO_PAIR: 'Two Pair',
    THREE_OF_A_KIND: '3 of a Kind',
    STRAIGHT: 'Straight',
    FLUSH: 'Flush',
    FULL_HOUSE: 'Full House',

    // Of-a-kind hands (consistent numbering)
    FOUR_OF_A_KIND: '4 of a Kind',
    FIVE_OF_A_KIND: '5 of a Kind',
    SIX_OF_A_KIND: '6 of a Kind',
    SEVEN_OF_A_KIND: '7 of a Kind',
    EIGHT_OF_A_KIND: '8 of a Kind',

    // Straight flush hands (consistent numbering)
    STRAIGHT_FLUSH: '5-card Straight Flush',
    SIX_CARD_STRAIGHT_FLUSH: '6-card Straight Flush',
    SEVEN_CARD_STRAIGHT_FLUSH: '7-card Straight Flush',
    EIGHT_CARD_STRAIGHT_FLUSH: '8-card Straight Flush'
};

/**
 * Hand types in order from weakest to strongest
 * Used for iteration and display purposes
 */
const HAND_TYPE_ORDER = [
    HAND_TYPES.HIGH_CARD,
    HAND_TYPES.PAIR,
    HAND_TYPES.TWO_PAIR,
    HAND_TYPES.THREE_OF_A_KIND,
    HAND_TYPES.STRAIGHT,
    HAND_TYPES.FLUSH,
    HAND_TYPES.FULL_HOUSE,
    HAND_TYPES.FOUR_OF_A_KIND,
    HAND_TYPES.FIVE_OF_A_KIND,
    HAND_TYPES.SIX_OF_A_KIND,
    HAND_TYPES.SEVEN_OF_A_KIND,
    HAND_TYPES.EIGHT_OF_A_KIND,
    HAND_TYPES.STRAIGHT_FLUSH,
    HAND_TYPES.SIX_CARD_STRAIGHT_FLUSH,
    HAND_TYPES.SEVEN_CARD_STRAIGHT_FLUSH,
    HAND_TYPES.EIGHT_CARD_STRAIGHT_FLUSH
];

/**
 * Helper function to get of-a-kind hand type name by count
 * @param {number} count - Number of cards of same rank (3-8)
 * @returns {string} Hand type name
 */
function getOfAKindHandType(count) {
    switch (count) {
        case 3: return HAND_TYPES.THREE_OF_A_KIND;
        case 4: return HAND_TYPES.FOUR_OF_A_KIND;
        case 5: return HAND_TYPES.FIVE_OF_A_KIND;
        case 6: return HAND_TYPES.SIX_OF_A_KIND;
        case 7: return HAND_TYPES.SEVEN_OF_A_KIND;
        case 8: return HAND_TYPES.EIGHT_OF_A_KIND;
        default: throw new Error(`Invalid of-a-kind count: ${count}`);
    }
}

/**
 * Helper function to get straight flush hand type name by length
 * @param {number} length - Number of cards in straight flush (5-8)
 * @returns {string} Hand type name
 */
function getStraightFlushHandType(length) {
    switch (length) {
        case 5: return HAND_TYPES.STRAIGHT_FLUSH;
        case 6: return HAND_TYPES.SIX_CARD_STRAIGHT_FLUSH;
        case 7: return HAND_TYPES.SEVEN_CARD_STRAIGHT_FLUSH;
        case 8: return HAND_TYPES.EIGHT_CARD_STRAIGHT_FLUSH;
        default: throw new Error(`Invalid straight flush length: ${length}`);
    }
}

/**
 * Check if a hand type is an of-a-kind hand
 * @param {string} handType - Hand type name
 * @returns {boolean} True if it's an of-a-kind hand
 */
function isOfAKindHand(handType) {
    return [
        HAND_TYPES.THREE_OF_A_KIND,
        HAND_TYPES.FOUR_OF_A_KIND,
        HAND_TYPES.FIVE_OF_A_KIND,
        HAND_TYPES.SIX_OF_A_KIND,
        HAND_TYPES.SEVEN_OF_A_KIND,
        HAND_TYPES.EIGHT_OF_A_KIND
    ].includes(handType);
}

/**
 * Check if a hand type is a straight flush hand
 * @param {string} handType - Hand type name
 * @returns {boolean} True if it's a straight flush hand
 */
function isStraightFlushHand(handType) {
    return [
        HAND_TYPES.STRAIGHT_FLUSH,
        HAND_TYPES.SIX_CARD_STRAIGHT_FLUSH,
        HAND_TYPES.SEVEN_CARD_STRAIGHT_FLUSH,
        HAND_TYPES.EIGHT_CARD_STRAIGHT_FLUSH
    ].includes(handType);
}

/**
 * Get the numeric strength order of a hand type (higher = stronger)
 * @param {string} handType - Hand type name
 * @returns {number} Strength order (0-15)
 */
function getHandTypeStrength(handType) {
    return HAND_TYPE_ORDER.indexOf(handType);
}

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = {
        HAND_TYPES,
        HAND_TYPE_ORDER,
        getOfAKindHandType,
        getStraightFlushHandType,
        isOfAKindHand,
        isStraightFlushHand,
        getHandTypeStrength
    };
}