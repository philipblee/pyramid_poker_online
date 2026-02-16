// js/ui/assign-wild-card.js
// Utility for assigning a rank and suit to a wild card (data + DOM)

const RANK_VALUES = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5,
    '4': 4, '3': 3, '2': 2
};

/**
 * Assign a rank and suit to a wild card, updating both the data object and DOM element.
 * @param {Object} cardObject - Card data object (must have isWild:true or wasWild:true)
 * @param {string} rank - Rank to assign e.g. 'A', 'K', '10'
 * @param {string} suit - Suit to assign e.g. '♠', '♥', '♦', '♣'
 * @returns {Object} The mutated card object
 */
function assignWildCard(cardObject, rank, suit) {
    if (!cardObject) {
        console.error('❌ assignWildCard: cardObject is null');
        return null;
    }

    if (!cardObject.isWild && !cardObject.wasWild) {
        console.warn('⚠️ assignWildCard: card is not a wild card', cardObject);
        return cardObject;
    }

    // 1. Mutate card data
    cardObject.rank = rank;
    cardObject.suit = suit;
    cardObject.value = RANK_VALUES[rank];
    cardObject.number = RANK_VALUES[rank];
    cardObject.isWild = false;
    cardObject.wasWild = true;

    console.log(`✅ assignWildCard: assigned ${rank}${suit} to wild ${cardObject.id}`);

    // 2. Find DOM element - prefer attached element, fallback to data-card-id query
    const cardElement = cardObject.element ||
        document.querySelector(`[data-card-id="${cardObject.id}"]`);

    if (cardElement) {
        // 3. Update visual display
        const suitColor = (suit === '♥' || suit === '♦') ? 'red' : 'black';
        cardElement.innerHTML = `<div style="font-size: 20px; color: ${suitColor};">${rank}</div><div style="font-size: 28px; color: ${suitColor};">${suit}</div>`;
        cardElement.classList.remove('wild-undefined');
        cardElement.classList.add('wild-assigned');
    } else {
        console.warn(`⚠️ assignWildCard: no DOM element found for card ${cardObject.id}`);
    }

    return cardObject;
}

function numericRankToString(value) {
    const map = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J' };
    return map[value] || String(value);
}
window.numericRankToString = numericRankToString;



// Expose globally
window.assignWildCard = assignWildCard;
window.RANK_VALUES = RANK_VALUES;
