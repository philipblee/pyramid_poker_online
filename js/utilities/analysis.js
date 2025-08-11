// js/utilities/analysis.js
// SINGLE SOURCE OF TRUTH for all card analysis operations
// Consolidates: CardCount, analyze-cards, countRanksAndSuits, scattered constants, etc.

class Analysis {
    constructor(cards) {
        // Store cards (accept either objects or string)
        if (typeof cards === 'string') {
            this.cards = this.parseCardString(cards);
        } else {
            this.cards = cards.filter(c => !c.isWild); // Filter out wilds
        }

        // Pre-compute all analysis data
        this._computeBasicCounts();
//        this._computeHandCounts();
        this._computeUtilityData();
    }

    // =============================================================================
    // CONSTANTS - Single source of truth
    // =============================================================================

    static get RANKS() {
        return ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    }

    static get SUITS() {
        return ['♠', '♥', '♦', '♣'];
    }

    static get RANK_VALUES() {
        return {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
    }

    static WHEEL_STRAIGHT = [14, 2, 3, 4, 5]; // A-2-3-4-5 (Ace acts as 1)

    static generateConsecutiveValues(startValue, length) {
        return Array.from({length}, (_, i) => startValue + i);
    }

    static generateWheelValues(length) {
        return [14, ...Array.from({length: length - 1}, (_, i) => i + 2)];
    }

    static get RANK_ORDER() {
        return { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
    }

    static get SUIT_ORDER() {
        return { '♠': 1, '♥': 2, '♦': 3, '♣': 4 };
    }

    static RANKS_ACES_FIRST = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];




    // =============================================================================
    // STATIC UTILITIES - No card analysis needed
    // =============================================================================

    static getRankValue(rank) {
        return Analysis.RANK_VALUES[rank] || 0;
    }

    static createStandardDeck() {
        const deck = [];
        Analysis.RANKS.forEach(rank => {
            Analysis.SUITS.forEach(suit => {
                deck.push({
                    id: `${rank}${suit}`,
                    rank: rank,
                    suit: suit,
                    value: Analysis.getRankValue(rank),
                    isWild: false
                });
            });
        });
        return deck;
    }

    static generateAll52CardStrings() {
        const cards = [];
        Analysis.RANKS.forEach(rank => {
            Analysis.SUITS.forEach(suit => {
                cards.push(rank + suit);
            });
        });
        return cards;
    }

    static createCardFromString(cardString) {
        const match = cardString.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
        if (!match) {
            throw new Error(`Invalid card format: ${cardString}`);
        }

        const [, rank, suit] = match;

        return {
            id: `${rank}${suit}_wild`,
            rank: rank,
            suit: suit,
            value: Analysis.getRankValue(rank),
            isWild: false,
            wasWild: true
        };
    }

    static generateAll52CardStringsAcesFirst() {
        const cards = [];
        Analysis.RANKS_ACES_FIRST.forEach(rank => {
            Analysis.SUITS.forEach(suit => {
                cards.push(rank + suit);
            });
        });
        return cards;
    }

    static getDefaultRelevantHandTypes() {
        return [
            'threeOfAKind', 'natural4K', 'fiveOfAKind', 'sixOfAKind', 'sevenOfAKind', 'eightOfAKind',
            'straight', 'straightFlush', 'sixCardStraightFlush', 'sevenCardStraightFlush', 'eightCardStraightFlush'
        ];
    }

    // =============================================================================
    // BASIC COUNTS - Rank and suit distribution
    // =============================================================================

    _computeBasicCounts() {
        this.rankCounts = {};
        this.suitCounts = {};
        this.totalCards = this.cards.length;

        this.cards.forEach(card => {
            // Count ranks
            this.rankCounts[card.rank] = (this.rankCounts[card.rank] || 0) + 1;
            // Count suits
            this.suitCounts[card.suit] = (this.suitCounts[card.suit] || 0) + 1;
        });
    }

    // Access methods for basic counts
    rankCount(rank) {
        return this.rankCounts[rank] || 0;
    }

    suitCount(suit) {
        return this.suitCounts[suit] || 0;
    }

    // =============================================================================
    // HAND COUNTS - All possible hand types from these cards
    // =============================================================================

    _computeHandCounts() {
        // Use the proven countValidHandsFromCards function
        const handCounts = countValidHandsFromCards(this.cards);

        // Store as direct properties for easy access
        this.fourOfAKind = handCounts.fourOfAKind || 0;
        this.fiveOfAKind = handCounts.fiveOfAKind || 0;
        this.sixOfAKind = handCounts.sixOfAKind || 0;
        this.sevenOfAKind = handCounts.sevenOfAKind || 0;
        this.eightOfAKind = handCounts.eightOfAKind || 0;
        this.threeOfAKind = handCounts.threeOfAKind || 0;
        this.pair = handCounts.pair || 0;
        this.twoPair = handCounts.twoPair || 0;
        this.fullHouse = handCounts.fullHouse || 0;
        this.flush = handCounts.flush || 0;
        this.straight = handCounts.straight || 0;
        this.straightFlush = handCounts.straightFlush || 0;
        this.sixCardStraightFlush = handCounts.sixCardStraightFlush || 0;
        this.sevenCardStraightFlush = handCounts.sevenCardStraightFlush || 0;
        this.eightCardStraightFlush = handCounts.eightCardStraightFlush || 0;
        this.highCard = handCounts.highCard || 0;
        this.natural4K = handCounts.natural4K || 0;
        this.total = handCounts.total || 0;

        // Store full object for backward compatibility
        this.handCounts = handCounts;
    }

    // =============================================================================
    // UTILITY DATA - Derived analysis
    // =============================================================================

    _computeUtilityData() {
        // Flush-possible suits
        this.flushSuits = Object.entries(this.suitCounts)
            .filter(([suit, count]) => count >= 5)
            .map(([suit, count]) => ({ suit, count }));

        // Of-a-kind ranks
        this.ofAKindRanks = Object.entries(this.rankCounts)
            .filter(([rank, count]) => count >= 2)
            .map(([rank, count]) => ({ rank, count }));

        // Natural quads specifically
        this.naturalQuads = Object.entries(this.rankCounts)
            .filter(([rank, count]) => count === 4)
            .map(([rank, count]) => ({ rank, count }));
    }

    // =============================================================================
    // STANDARD POKER HAND CHECKS
    // =============================================================================

    isAllSameRank() {
        return Object.keys(this.rankCounts).length === 1;
    }

    isAllSameSuit() {
        return Object.keys(this.suitCounts).length === 1;
    }

    isSequentialValues() {
        const values = [...new Set(this.cards.map(c => c.value))].sort((a, b) => a - b);
        return values.every((val, i) => i === 0 || val === values[i-1] + 1);
    }

    isWheelStraight() {
        const values = new Set(this.cards.map(c => c.value));
        return values.has(14) && values.has(2) && values.has(3) && values.has(4) && values.has(5);
    }

    getStraightHigh() {
        if (this.isWheelStraight()) {
            const values = [...new Set(this.cards.map(c => c.value))].sort((a, b) => b - a);
            return values[1]; // Second highest for wheel
        }
        return Math.max(...this.cards.map(c => c.value));
    }

    getOfAKindRank() {
        // Return the rank that appears most frequently
        const maxCount = Math.max(...Object.values(this.rankCounts));
        return Object.entries(this.rankCounts).find(([rank, count]) => count === maxCount)[0];
    }

    // from Meta ai (using Meta to fix for now
    getSortedValues() {
    return [...this.cards].sort((a, b) => b.value - a.value).map(c => c.value);
    }

    getSuits() {
    return this.cards.map(c => c.suit);
    }

    getValueCounts() {
        const valueCounts = {};
        this.cards.forEach(c => {
          valueCounts[c.value] = (valueCounts[c.value] || 0) + 1;
        });

        // Group values by count frequency
        const valuesByCount = {};
        for (const [value, count] of Object.entries(valueCounts)) {
          if (!valuesByCount[count]) valuesByCount[count] = [];
          valuesByCount[count].push(parseInt(value));
        }

        // Sort each group by descending value
        for (const count in valuesByCount) {
          valuesByCount[count].sort((a, b) => b - a);
        }

        return valuesByCount;
    }

    getStraightInfo() {
        const values = this.getSortedValues();
        const high = Math.max(...values);
        const low = Math.min(...values);

        // Check for wheel straight (A-2-3-4-5)
        if (values.includes(14) && values.includes(2) && values.includes(3) && values.includes(4) && values.includes(5)) {
          return { high: 5, low: 14 };
        }

        return { high: high, low: low };
    }

    isAllSameSuit(suits = this.getSuits()) {
        return suits.every(suit => suit === suits[0]);
    }



    // =============================================================================
    // ANALYSIS METHODS - Higher-level insights
    // =============================================================================

    getRelevantHandsForWildOptimization() {
        const relevantCategories = [
            'threeOfAKind', 'natural4K', 'fiveOfAKind', 'sixOfAKind', 'sevenOfAKind', 'eightOfAKind',
            'straight', 'straightFlush', 'sixCardStraightFlush', 'sevenCardStraightFlush', 'eightCardStraightFlush',
            'fullHouse'
        ];

        const relevant = {};
        let total = 0;

        relevantCategories.forEach(category => {
            const count = this[category] || 0;
            if (count > 0) {
                relevant[category] = count;
                total += count;
            }
        });

        return { categories: relevant, total };
    }

    hasFlushPotential() {
        return this.flushSuits.length > 0;
    }

    hasOfAKindPotential(minCount = 2) {
        return this.ofAKindRanks.some(item => item.count >= minCount);
    }

    // =============================================================================
    // UTILITY FUNCTIONS - Available for other modules
    // =============================================================================

    static parseCardString(cardString) {
    return cardString.trim().split(/\s+/).map((token, index) => {
        // Handle wild cards first
        if (token === '🃏') {
            return {
                id: `wild_${index + 1}`,
                rank: '',
                suit: '',
                value: 0,
                isWild: true
            };
        }

        // Handle regular cards
        const match = token.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
        if (!match) {
            throw new Error(`Invalid card format: ${token}`);
        }

        const [, rank, suit] = match;
        return {
            id: `${rank}${suit}_${index + 1}`,
            rank: rank,
            suit: suit,
            value: Analysis.getRankValue(rank),
            isWild: false
        };
    });
}

    static getCardIds(cards) {
        return cards.map(c => c.id);
    }

    static sortCards(cards) {
        return cards.sort((a, b) => {
            const rankDiff = Analysis.RANK_ORDER[b.rank] - Analysis.RANK_ORDER[a.rank];
            return rankDiff !== 0 ? rankDiff : Analysis.SUIT_ORDER[a.suit] - Analysis.SUIT_ORDER[b.suit];
        });
    }

    static generateCombinations(cards, r) {
        if (r > cards.length) return [];
        if (r === 1) return cards.map(card => [card]);
        if (r === cards.length) return [cards];

        const combinations = [];

        function combine(start, current) {
            if (current.length === r) {
                combinations.push([...current]);
                return;
            }

            for (let i = start; i < cards.length; i++) {
                current.push(cards[i]);
                combine(i + 1, current);
                current.pop();
            }
        }

        combine(0, []);
        return combinations;
    }

    findKickers(excludeRanks = []) {
        const kickers = [];
        const availableCards = this.cards.filter(card => !excludeRanks.includes(card.rank));

        // Group by rank
        const kickerRankCounts = {};
        availableCards.forEach(card => {
            kickerRankCounts[card.rank] = (kickerRankCounts[card.rank] || 0) + 1;
        });

        // Add each individual card as a potential kicker
        Object.entries(kickerRankCounts).forEach(([rank, count]) => {
            const cardsOfRank = availableCards.filter(c => c.rank === rank);
            cardsOfRank.forEach(card => {
                kickers.push([card]); // Each kicker is 1-card array
            });
        });

        return kickers;
    }

    // =============================================================================
    // SUMMARY AND DEBUG
    // =============================================================================

    summary() {
        return {
            totalCards: this.totalCards,
            uniqueRanks: Object.keys(this.rankCounts).length,
            uniqueSuits: Object.keys(this.suitCounts).length,
            flushSuits: this.flushSuits.length,
            ofAKindRanks: this.ofAKindRanks.length,
            naturalQuads: this.naturalQuads.length,
            totalHands: this.total,
            relevantHands: this.getRelevantHandsForWildOptimization().total
        };
    }

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Analysis;
}