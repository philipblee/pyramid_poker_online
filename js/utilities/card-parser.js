// js/utilities/card-parser.js
// Centralized card parsing utilities for all programs
// Ensures consistent card object format with all required properties

class CardParser {
    /**
     * Rank to numeric value mapping (used everywhere)
     */
    static RANK_VALUES = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    /**
     * Parse card string into standardized card objects
     * @param {string} cardString - Space-separated cards like "A♠ K♠ Q♠ 🃏 J♥"
     * @returns {Array} Array of card objects with all required properties
     */
    static parseCardString(cardString) {
        if (!cardString || typeof cardString !== 'string') {
            throw new Error('Invalid card string provided');
        }

        const cards = [];
        const cardTokens = cardString.trim().split(/\s+/);

        cardTokens.forEach((token, index) => {
            // Handle wild cards
            if (token === '🃏') {
                cards.push(this.createWildCard(index));
                return;
            }

            // Parse regular cards
            const match = token.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
            if (!match) {
                throw new Error(`Invalid card format: ${token}`);
            }

            const [, rank, suit] = match;
            cards.push(this.createCard(rank, suit, index));
        });

        return cards;
    }

    /**
     * Create a standardized card object
     * @param {string} rank - Card rank (A, K, Q, J, 10, 9, etc.)
     * @param {string} suit - Card suit (♠, ♥, ♦, ♣)
     * @param {number} index - Position index for unique ID
     * @returns {Object} Standardized card object
     */
    static createCard(rank, suit, index = 0) {
        const value = this.RANK_VALUES[rank];
        if (value === undefined) {
            throw new Error(`Invalid rank: ${rank}`);
        }

        return {
            rank: rank,
            suit: suit,
            value: value,
            id: `${rank}${suit}_${index + 1}`,
            isWild: false
        };
    }

    /**
     * Create a wild card object
     * @param {number} index - Position index for unique ID
     * @returns {Object} Wild card object
     */
    static createWildCard(index = 0) {
        return {
            rank: '🃏',
            suit: '🃏',
            value: null,        // Wild cards have no fixed value
            id: `WILD_${index + 1}`,
            isWild: true
        };
    }

    /**
     * Parse card string and substitute wild card with specific card
     * @param {string} cardString - Original card string with 🃏
     * @param {string} substituteCard - Card to replace wild with (e.g., "A♠")
     * @returns {Array} Array of card objects with wild substituted
     */
    static parseWithWildSubstitution(cardString, substituteCard) {
        if (!cardString.includes('🃏')) {
            throw new Error('Card string must contain a wild card (🃏)');
        }

        // Replace wild with substitute card
        const substitutedString = cardString.replace('🃏', substituteCard);

        // Parse the modified string
        return this.parseCardString(substitutedString);
    }

    /**
     * Validate card string format
     * @param {string} cardString - Card string to validate
     * @returns {Object} Validation result with details
     */
    static validateCardString(cardString) {
        const issues = [];

        if (!cardString || typeof cardString !== 'string') {
            issues.push('Card string must be a non-empty string');
            return { isValid: false, issues };
        }

        const tokens = cardString.trim().split(/\s+/);

        tokens.forEach((token, index) => {
            if (token === '🃏') {
                return; // Wild cards are valid
            }

            const match = token.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
            if (!match) {
                issues.push(`Invalid card format at position ${index + 1}: ${token}`);
                return;
            }

            const [, rank, suit] = match;
            if (!(rank in this.RANK_VALUES)) {
                issues.push(`Invalid rank at position ${index + 1}: ${rank}`);
            }
        });

        return {
            isValid: issues.length === 0,
            issues: issues,
            cardCount: tokens.length
        };
    }

    /**
     * Get numeric value for a rank
     * @param {string} rank - Card rank
     * @returns {number} Numeric value (2-14)
     */
    static getRankValue(rank) {
        return this.RANK_VALUES[rank] || 0;
    }

    /**
     * Convert existing card objects to ensure they have all required properties
     * @param {Array} cards - Array of card objects (may be missing properties)
     * @returns {Array} Array of standardized card objects
     */
    static standardizeCards(cards) {
        return cards.map((card, index) => {
            // If already standardized, return as-is
            if (card.value !== undefined && card.id && card.isWild !== undefined) {
                return card;
            }

            // Add missing properties
            const standardized = { ...card };

            if (card.isWild || card.rank === '🃏') {
                standardized.value = null;
                standardized.isWild = true;
                standardized.id = standardized.id || `WILD_${index + 1}`;
            } else {
                standardized.value = this.RANK_VALUES[card.rank] || 0;
                standardized.isWild = false;
                standardized.id = standardized.id || `${card.rank}${card.suit}_${index + 1}`;
            }

            return standardized;
        });
    }

    /**
     * Parse card string and return both cards and validation info
     * @param {string} cardString - Card string to parse
     * @returns {Object} Parse result with cards and metadata
     */
    static parseWithValidation(cardString) {
        const validation = this.validateCardString(cardString);

        if (!validation.isValid) {
            return {
                success: false,
                cards: null,
                validation: validation
            };
        }

        try {
            const cards = this.parseCardString(cardString);
            return {
                success: true,
                cards: cards,
                validation: validation
            };
        } catch (error) {
            return {
                success: false,
                cards: null,
                validation: {
                    isValid: false,
                    issues: [error.message],
                    cardCount: 0
                }
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CardParser };
}