// js/utilities/card-count.js
// Centralized card counting utilities
// Clean class-based approach for basic rank/suit counting

/**
 * Card counting class - focuses on basic rank and suit distribution
 */
class CardCount {
    constructor(cards) {
        this.rankCounts = new Map();
        this.suitCounts = new Map();
        this.totalCards = cards.length;

        // Count once in constructor
        this._count(cards);
    }

    /**
     * Internal counting method
     * @private
     */
    _count(cards) {
        cards.forEach(card => {
            // Count ranks
            const rankCount = this.rankCounts.get(card.rank) || 0;
            this.rankCounts.set(card.rank, rankCount + 1);

            // Count suits
            const suitCount = this.suitCounts.get(card.suit) || 0;
            this.suitCounts.set(card.suit, suitCount + 1);
        });
    }

    /**
     * Get count for a specific rank
     * @param {string} rank - Card rank (A, K, Q, J, 10, 9, etc.)
     * @returns {number} Count of cards with this rank
     */
    rankCount(rank) {
        return this.rankCounts.get(rank) || 0;
    }

    /**
     * Get count for a specific suit
     * @param {string} suit - Card suit (♠, ♥, ♦, ♣)
     * @returns {number} Count of cards in this suit
     */
    suitCount(suit) {
        return this.suitCounts.get(suit) || 0;
    }

    /**
     * Get suits with minimum card count (for flush detection)
     * @param {number} min - Minimum cards required (default 5)
     * @returns {Array} Array of {suit, count} objects
     */
    flushSuits(min = 5) {
        return Array.from(this.suitCounts.entries())
            .filter(([suit, count]) => count >= min)
            .map(([suit, count]) => ({ suit, count }));
    }

    /**
     * Get ranks with minimum card count (for of-a-kind detection)
     * @param {number} min - Minimum cards required (default 2)
     * @returns {Array} Array of {rank, count} objects
     */
    ofAKindRanks(min = 2) {
        return Array.from(this.rankCounts.entries())
            .filter(([rank, count]) => count >= min)
            .map(([rank, count]) => ({ rank, count }));
    }

    /**
     * Get arrays for backward compatibility
     */
    rankCountsArray() {
        return Array.from(this.rankCounts.entries());
    }

    suitCountsArray() {
        return Array.from(this.suitCounts.entries());
    }

    /**
     * Basic summary statistics
     * @returns {Object} Summary of card distribution
     */
    summary() {
        const flushSuits = this.flushSuits(5);
        const pairs = this.ofAKindRanks(2);
        const trips = this.ofAKindRanks(3);
        const quads = this.ofAKindRanks(4);

        return {
            totalCards: this.totalCards,
            uniqueRanks: this.rankCounts.size,
            uniqueSuits: this.suitCounts.size,
            flushSuits: flushSuits.length,
            pairs: pairs.length,
            trips: trips.length,
            quads: quads.length
        };
    }
}

/**
 * Parse card string into card objects
 * @param {string} cardString - Space-separated cards like "A♠ K♠ Q♠"
 * @returns {Array} Array of card objects
 */
function parseCardString(cardString) {
    return cardString.trim().split(/\s+/).map((token, index) => {
        const match = token.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
        if (!match) {
            throw new Error(`Invalid card format: ${token}`);
        }

        const [, rank, suit] = match;
        return {
            suit: suit,
            rank: rank,
            id: `${rank}${suit}_${index + 1}`,
            isWild: false
        };
    });
}

/**
 * Convenience function to count cards from string format
 * @param {string} cardString - Space-separated cards
 * @returns {CardCount} CardCount instance
 */
function countCardsFromString(cardString) {
    const cards = parseCardString(cardString);
    return new CardCount(cards);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CardCount,
        parseCardString,
        countCardsFromString
    };
}