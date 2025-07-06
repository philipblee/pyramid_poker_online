// js/utilities/convert-to-card-model.js
// Convert card objects to standard Card Model format

/**
 * Convert card objects to Card Model format
 * @param {Array} cardObjects - Array of card objects
 * @returns {Array} Array of Card Model compliant objects
 */
function convertToCardModel(cardObjects) {
    return cardObjects.map((card, index) => {
        // Wild cards - return as-is if already have required properties
        if (card.isWild) {
            return {
                id: card.id || `wild_${index + 1}`,
                rank: card.rank || '🃏',
                suit: card.suit || '',
                value: 0,
                isWild: true,
                wasWild: card.wasWild || false
            };
        }

        // Non-wild cards - add missing properties
        return {
            id: card.id || `${card.rank}${card.suit}_${index + 1}`,
            rank: card.rank,
            suit: card.suit,
            value: card.value || getRankValue(card.rank),
            isWild: false,
            wasWild: card.wasWild || false
        };
    });
}

/**
 * Get numeric value for rank
 * @param {string} rank - Card rank
 * @returns {number} Numeric value (2-14, A=14)
 */
function getRankValue(rank) {
    const values = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return values[rank] || 0;
}