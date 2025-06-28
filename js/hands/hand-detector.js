// File: js/hands/hand-detector.js
// Hand Detection Engine - Integrated with existing evaluation system
// Efficiently detects all possible hands from 17 cards using counting optimization
// Produces hands compatible with existing evaluateHand() and ScoringUtilities

class HandDetector {
    constructor(wildsInHand = 0) {
        this.wildsInHand = wildsInHand;
        this.detectedHands = null; // Cache for efficiency
    }

    /**
     * Main detection method - finds all possible hands from 17 cards
     * @param {Array} cards - Array of card objects {rank, suit, value, etc.}
     * @returns {Object} - Object containing arrays of detected hands by type
     */
    detectAllHands(cards) {
        // Use cached results if available
        if (this.detectedHands) {
            return this.detectedHands;
        }

        console.log(`🔍 Detecting hands from ${cards.length} cards...`);

        // Step 1: Count ranks and suits for efficient detection
        const counts = this.countCards(cards);

        // Step 2: Initialize result structure
        this.detectedHands = {
            // Large hands (6-8 cards) - premium scoring
            '8K': [], '8SF': [], '7K': [], '7SF': [], '6K': [], '6SF': [],

            // Standard premium hands (5 cards)
            '5K': [], '5SF': [], '4K': [], 'FH': [], '5F': [], '5S': [],

            // Large flushes and straights (6-8 cards)
            '8F': [], '7F': [], '6F': [], '8S': [], '7S': [], '6S': [],

            // Standard hands
            '3K': [], 'PAIR': [], 'HIGH': []
        };

        // Step 3: Detect hands in hierarchical order (highest value first)
        this.detectLargeOfAKind(cards, counts.rankCounts);
        this.detectLargeStraightFlushes(cards, counts.suitRankCounts);
        this.detectStandardPremiumHands(cards, counts);
        this.detectLargeFlushesAndStraights(cards, counts);
        this.detectStandardHands(cards, counts.rankCounts);

        console.log(`✅ Hand detection complete. Found:`, this.getDetectionSummary());
        return this.detectedHands;
    }

    /**
     * Count cards by rank and suit for efficient detection
     */
    countCards(cards) {
        const rankCounts = {};
        const suitCounts = {};
        const suitRankCounts = {};

        // Initialize counting structures
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const suits = ['H', 'D', 'C', 'S'];

        ranks.forEach(rank => rankCounts[rank] = 0);
        suits.forEach(suit => {
            suitCounts[suit] = 0;
            suitRankCounts[suit] = {};
            ranks.forEach(rank => suitRankCounts[suit][rank] = 0);
        });

        // Count each card (skip wilds for now)
        cards.forEach(card => {
            if (!card.isWild && card.rank && card.suit) {
                rankCounts[card.rank]++;
                suitCounts[card.suit]++;
                suitRankCounts[card.suit][card.rank]++;
            }
        });

        return { rankCounts, suitCounts, suitRankCounts };
    }

    /**
     * Detect large same-rank hands (6K, 7K, 8K) - highest priority
     */
    detectLargeOfAKind(cards, rankCounts) {
        Object.entries(rankCounts).forEach(([rank, count]) => {
            if (count >= 8) {
                const hand = this.buildSameRankHand(cards, rank, 8);
                if (hand) this.detectedHands['8K'].push(hand);
            }
            if (count >= 7) {
                const hand = this.buildSameRankHand(cards, rank, 7);
                if (hand) this.detectedHands['7K'].push(hand);
            }
            if (count >= 6) {
                const hand = this.buildSameRankHand(cards, rank, 6);
                if (hand) this.detectedHands['6K'].push(hand);
            }
        });
    }

    /**
     * Detect large straight flushes (6SF, 7SF, 8SF)
     */
    detectLargeStraightFlushes(cards, suitRankCounts) {
        Object.entries(suitRankCounts).forEach(([suit, rankCounts]) => {
            const suitCardCount = Object.values(rankCounts).reduce((sum, count) => sum + count, 0);

            if (suitCardCount >= 6) {
                // Get all cards of this suit
                const suitCards = cards.filter(c => c.suit === suit && !c.isWild);

                // Find all straight flushes in this suit
                const allSFs = this.findAllStraightFlushesInSuit(suitCards);

                // Categorize by length
                allSFs.forEach(sf => {
                    if (sf.length === 8) {
                        this.detectedHands['8SF'].push(sf);
                    } else if (sf.length === 7) {
                        this.detectedHands['7SF'].push(sf);
                    } else if (sf.length === 6) {
                        this.detectedHands['6SF'].push(sf);
                    }
                });
            }
        });
    }

    /**
     * Detect standard premium hands (5K, 5SF, 4K, FH, 5F, 5S)
     */
    detectStandardPremiumHands(cards, counts) {
        // 5 of a kind and 4 of a kind
        Object.entries(counts.rankCounts).forEach(([rank, count]) => {
            if (count >= 5) {
                const hand = this.buildSameRankHand(cards, rank, 5);
                if (hand) this.detectedHands['5K'].push(hand);
            }
            if (count >= 4) {
                const hand = this.buildSameRankHand(cards, rank, 4);
                if (hand) this.detectedHands['4K'].push(hand);
            }
        });

        // 5-card straight flushes
        Object.entries(counts.suitRankCounts).forEach(([suit, rankCounts]) => {
            const suitCardCount = Object.values(rankCounts).reduce((sum, count) => sum + count, 0);

            if (suitCardCount >= 5) {
                const suitCards = cards.filter(c => c.suit === suit && !c.isWild);
                const allSFs = this.findAllStraightFlushesInSuit(suitCards);

                // Add 5-card straight flushes
                allSFs.forEach(sf => {
                    if (sf.length === 5) {
                        this.detectedHands['5SF'].push(sf);
                    }
                });
            }
        });

        // Full houses
        this.detectFullHouses(cards, counts.rankCounts);

        // 5-card flushes and straights
        this.detect5CardFlushesAndStraights(cards, counts);
    }

    /**
     * Detect full houses (trips + different rank pair)
     */
    detectFullHouses(cards, rankCounts) {
        const tripsRanks = Object.entries(rankCounts)
            .filter(([rank, count]) => count >= 3)
            .map(([rank]) => rank);

        const pairRanks = Object.entries(rankCounts)
            .filter(([rank, count]) => count >= 2)
            .map(([rank]) => rank);

        // Find all valid trips + pair combinations (different ranks)
        tripsRanks.forEach(tripsRank => {
            pairRanks.forEach(pairRank => {
                if (tripsRank !== pairRank) {
                    const hand = this.buildFullHouse(cards, tripsRank, pairRank);
                    if (hand) {
                        this.detectedHands['FH'].push(hand);
                    }
                }
            });
        });
    }

    /**
     * Detect 5-card flushes and straights
     */
    detect5CardFlushesAndStraights(cards, counts) {
        // 5-card flushes
        Object.entries(counts.suitCounts).forEach(([suit, count]) => {
            if (count >= 5) {
                const hand = this.buildFlush(cards, suit, 5);
                if (hand) this.detectedHands['5F'].push(hand);
            }
        });

        // 5-card straights
        const straights = this.findAllStraights(cards, 5);
        this.detectedHands['5S'] = straights;
    }

    /**
     * Detect large flushes and straights (6-8 cards)
     */
    detectLargeFlushesAndStraights(cards, counts) {
        // Large flushes
        Object.entries(counts.suitCounts).forEach(([suit, count]) => {
            if (count >= 8) {
                const hand = this.buildFlush(cards, suit, 8);
                if (hand) this.detectedHands['8F'].push(hand);
            }
            if (count >= 7) {
                const hand = this.buildFlush(cards, suit, 7);
                if (hand) this.detectedHands['7F'].push(hand);
            }
            if (count >= 6) {
                const hand = this.buildFlush(cards, suit, 6);
                if (hand) this.detectedHands['6F'].push(hand);
            }
        });

        // Large straights
        [8, 7, 6].forEach(size => {
            const straights = this.findAllStraights(cards, size);
            this.detectedHands[`${size}S`] = straights;
        });
    }

    /**
     * Detect standard hands (3K, pairs, high card)
     */
    detectStandardHands(cards, rankCounts) {
        // 3 of a kind
        Object.entries(rankCounts).forEach(([rank, count]) => {
            if (count >= 3) {
                const hand = this.buildSameRankHand(cards, rank, 3);
                if (hand) this.detectedHands['3K'].push(hand);
            }
        });

        // Pairs (for completeness, though less important for arrangement)
        Object.entries(rankCounts).forEach(([rank, count]) => {
            if (count >= 2) {
                const hand = this.buildSameRankHand(cards, rank, 2);
                if (hand) this.detectedHands['PAIR'].push(hand);
            }
        });
    }

    // =============================================================================
    // STRAIGHT FLUSH DETECTION METHODS
    // =============================================================================

    /**
     * Find all straight flushes in a suit (5+ cards)
     * @param {Array} suitCards - Cards of same suit
     * @returns {Array} - All straight flushes found (all lengths)
     */
    findAllStraightFlushes(suitCards) {
        return this.findAllStraightFlushesInSuit(suitCards);
    }

    /**
     * Find all straight flushes of specific length
     * @param {Array} suitCards - Cards of same suit
     * @param {number} size - Target size (5, 6, 7, or 8)
     * @returns {Array} - All straight flushes of target length
     */
    findStraightFlushesOfLength(suitCards, size) {
        const allSFs = this.findAllStraightFlushesInSuit(suitCards);
        return allSFs.filter(sf => sf.length === size);
    }

    /**
     * Find ALL possible straight flushes in a suit (the main method)
     * @param {Array} suitCards - All cards of same suit
     * @returns {Array} - Array of all possible straight flush hands
     */
    findAllStraightFlushesInSuit(suitCards) {
        if (suitCards.length < 5) return [];

        const allSFs = [];

        // Count available ranks in this suit
        const rankCounts = {};
        suitCards.forEach(card => {
            if (!card.isWild) {
                rankCounts[card.value] = (rankCounts[card.value] || 0) + 1;
            }
        });

        // Find all possible straight flushes for each length (8 down to 5)
        for (let length = 8; length >= 5; length--) {
            const sfsOfLength = this.findAllStraightFlushesOfLength(suitCards, rankCounts, length);
            allSFs.push(...sfsOfLength);
        }

        return allSFs;
    }

    /**
     * Find all straight flushes of specific length
     * @param {Array} suitCards - Cards of same suit
     * @param {Object} rankCounts - Count of each rank
     * @param {number} length - Target length
     * @returns {Array} - All SFs of this length
     */
    findAllStraightFlushesOfLength(suitCards, rankCounts, length) {
        const sfs = [];

        // Try all possible starting positions (high card values)
        for (let high = 14; high >= length + 1; high--) {
            if (this.canMakeStraightFlush(rankCounts, high, length)) {
                const sf = this.buildStraightFlushHand(suitCards, high, length);
                if (sf) {
                    const evaluation = evaluateHand(sf);
                    sfs.push({
                        cards: sf,
                        evaluation: evaluation,
                        type: `${length}SF`,
                        strength: evaluation.hand_rank[0],
                        requiredCards: sf.map(c => c.id || `${c.rank}${c.suit}`),
                        length: length,
                        high: high,
                        low: high - length + 1
                    });
                }
            }
        }

        // Special case: Check for wheel straight (A-5-4-3-2) for 5-card only
        if (length === 5 && this.canMakeWheelStraightFlush(rankCounts)) {
            const wheelSF = this.buildWheelStraightFlush(suitCards);
            if (wheelSF) {
                const evaluation = evaluateHand(wheelSF);
                sfs.push({
                    cards: wheelSF,
                    evaluation: evaluation,
                    type: `${length}SF`,
                    strength: evaluation.hand_rank[0],
                    requiredCards: wheelSF.map(c => c.id || `${c.rank}${c.suit}`),
                    length: length,
                    high: 14,
                    low: 5,
                    isWheel: true
                });
            }
        }

        return sfs;
    }

    /**
     * Check if we can make a straight flush of given length starting from high card
     * @param {Object} rankCounts - Available rank counts
     * @param {number} high - Highest card value
     * @param {number} length - Length needed
     * @returns {boolean} - True if possible
     */
    canMakeStraightFlush(rankCounts, high, length) {
        for (let i = 0; i < length; i++) {
            const rank = high - i;
            if (!rankCounts[rank] || rankCounts[rank] === 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if we can make wheel straight flush (A-5-4-3-2)
     * @param {Object} rankCounts - Available rank counts
     * @returns {boolean} - True if wheel is possible
     */
    canMakeWheelStraightFlush(rankCounts) {
        return rankCounts[14] && rankCounts[5] && rankCounts[4] && rankCounts[3] && rankCounts[2];
    }

    /**
     * Build straight flush hand from available cards
     * @param {Array} suitCards - All cards in suit
     * @param {number} high - Highest card value
     * @param {number} length - Length of straight
     * @returns {Array|null} - Cards forming the straight flush
     */
    buildStraightFlushHand(suitCards, high, length) {
        const handCards = [];

        for (let i = 0; i < length; i++) {
            const rank = high - i;
            const card = suitCards.find(c => c.value === rank && !c.isWild);
            if (card) {
                handCards.push(card);
            } else {
                return null; // Shouldn't happen if canMakeStraightFlush returned true
            }
        }

        return handCards;
    }

    /**
     * Build wheel straight flush (A-5-4-3-2)
     * @param {Array} suitCards - All cards in suit
     * @returns {Array|null} - Cards forming wheel straight flush
     */
    buildWheelStraightFlush(suitCards) {
        const wheelRanks = [14, 5, 4, 3, 2]; // A-5-4-3-2
        const handCards = [];

        wheelRanks.forEach(rank => {
            const card = suitCards.find(c => c.value === rank && !c.isWild);
            if (card) {
                handCards.push(card);
            }
        });

        return handCards.length === 5 ? handCards : null;
    }

    // =============================================================================
    // STRAIGHT DETECTION METHODS
    // =============================================================================

    /**
     * Find all possible straights of given size (mixed suits)
     * @param {Array} cards - All cards to search
     * @param {number} size - Target straight size
     * @returns {Array} - Array of straight hands found
     */
    findAllStraights(cards, size) {
        const straights = [];

        // Count all ranks across all suits
        const rankCounts = {};
        cards.forEach(card => {
            if (!card.isWild) {
                rankCounts[card.value] = (rankCounts[card.value] || 0) + 1;
            }
        });

        // Find all possible straights
        for (let high = 14; high >= size + 1; high--) {
            if (this.canMakeStraight(rankCounts, high, size)) {
                const handCards = this.buildBestStraightHand(cards, high, size);
                if (handCards) {
                    const evaluation = evaluateHand(handCards);
                    straights.push({
                        cards: handCards,
                        evaluation: evaluation,
                        type: `${size}S`,
                        strength: evaluation.hand_rank[0],
                        requiredCards: handCards.map(c => c.id || `${c.rank}${c.suit}`),
                        high: high,
                        low: high - size + 1
                    });
                }
            }
        }

        // Check for wheel straight (A-5-4-3-2) for 5-card
        if (size === 5 && this.canMakeWheelStraightFlush(rankCounts)) {
            const wheelCards = this.buildWheelStraight(cards);
            if (wheelCards) {
                const evaluation = evaluateHand(wheelCards);
                straights.push({
                    cards: wheelCards,
                    evaluation: evaluation,
                    type: `${size}S`,
                    strength: evaluation.hand_rank[0],
                    requiredCards: wheelCards.map(c => c.id || `${c.rank}${c.suit}`),
                    high: 14,
                    low: 5,
                    isWheel: true
                });
            }
        }

        return straights;
    }

    /**
     * Check if we can make a straight (mixed suits)
     * @param {Object} rankCounts - Available rank counts
     * @param {number} high - Highest card value
     * @param {number} length - Length needed
     * @returns {boolean} - True if possible
     */
    canMakeStraight(rankCounts, high, length) {
        for (let i = 0; i < length; i++) {
            const rank = high - i;
            if (!rankCounts[rank] || rankCounts[rank] === 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Build best possible straight hand (mixed suits)
     * @param {Array} cards - All available cards
     * @param {number} high - Highest card value
     * @param {number} length - Straight length
     * @returns {Array|null} - Best straight hand
     */
    buildBestStraightHand(cards, high, length) {
        const handCards = [];

        for (let i = 0; i < length; i++) {
            const rank = high - i;
            const availableCards = cards.filter(c => c.value === rank && !c.isWild);
            if (availableCards.length > 0) {
                // Take first available (could be enhanced to pick best suit, etc.)
                handCards.push(availableCards[0]);
            } else {
                return null;
            }
        }

        return handCards;
    }

    /**
     * Build wheel straight (A-5-4-3-2) with mixed suits
     * @param {Array} cards - All available cards
     * @returns {Array|null} - Cards forming wheel straight
     */
    buildWheelStraight(cards) {
        const wheelRanks = [14, 5, 4, 3, 2];
        const handCards = [];

        wheelRanks.forEach(rank => {
            const availableCards = cards.filter(c => c.value === rank && !c.isWild);
            if (availableCards.length > 0) {
                handCards.push(availableCards[0]);
            }
        });

        return handCards.length === 5 ? handCards : null;
    }

    // =============================================================================
    // HAND BUILDING METHODS
    // =============================================================================

    /**
     * Build a same-rank hand using existing evaluation system
     */
    buildSameRankHand(cards, rank, count) {
        const sameRankCards = cards.filter(c => c.rank === rank && !c.isWild);

        if (sameRankCards.length < count) return null;

        const handCards = sameRankCards.slice(0, count);

        // Use existing evaluation system to get proper hand object
        const evaluation = evaluateHand(handCards);

        return {
            cards: handCards,
            evaluation: evaluation,
            type: `${count}K`,
            strength: evaluation.hand_rank[0],
            requiredCards: handCards.map(c => c.id || `${c.rank}${c.suit}`) // For conflict detection
        };
    }

    /**
     * Build a full house using existing evaluation system
     */
    buildFullHouse(cards, tripsRank, pairRank) {
        const tripsCards = cards.filter(c => c.rank === tripsRank && !c.isWild).slice(0, 3);
        const pairCards = cards.filter(c => c.rank === pairRank && !c.isWild).slice(0, 2);

        if (tripsCards.length < 3 || pairCards.length < 2) return null;

        const handCards = [...tripsCards, ...pairCards];
        const evaluation = evaluateHand(handCards);

        return {
            cards: handCards,
            evaluation: evaluation,
            type: 'FH',
            strength: evaluation.hand_rank[0],
            requiredCards: handCards.map(c => c.id || `${c.rank}${c.suit}`)
        };
    }

    /**
     * Build a flush using existing evaluation system
     */
    buildFlush(cards, suit, size) {
        const suitCards = cards.filter(c => c.suit === suit && !c.isWild)
            .sort((a, b) => b.value - a.value) // Highest cards first
            .slice(0, size);

        if (suitCards.length < size) return null;

        const evaluation = evaluateHand(suitCards);

        return {
            cards: suitCards,
            evaluation: evaluation,
            type: `${size}F`,
            strength: evaluation.hand_rank[0],
            requiredCards: suitCards.map(c => c.id || `${c.rank}${c.suit}`)
        };
    }

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    /**
     * Get detection summary for debugging
     */
    getDetectionSummary() {
        if (!this.detectedHands) return {};

        const summary = {};
        Object.entries(this.detectedHands).forEach(([type, hands]) => {
            if (hands.length > 0) {
                summary[type] = hands.length;
            }
        });
        return summary;
    }

    /**
     * Check if two hands conflict (share cards)
     */
    static handsConflict(hand1, hand2) {
        const cards1 = new Set(hand1.requiredCards);
        const cards2 = new Set(hand2.requiredCards);

        // Check for any shared cards
        for (const card of cards1) {
            if (cards2.has(card)) return true;
        }
        return false;
    }

    /**
     * Get hands that can be placed in specific positions
     */
    getHandsForPosition(position) {
        if (!this.detectedHands) return [];

        const pos = position.toLowerCase();
        const allHands = [];

        if (pos === 'back') {
            // Back can hold any hand type, any size (5-8 cards)
            Object.entries(this.detectedHands).forEach(([type, hands]) => {
                allHands.push(...hands);
            });
        } else if (pos === 'middle') {
            // Middle can hold 5-7 card hands
            ['5K', '5SF', '4K', 'FH', '5F', '5S', '6K', '6SF', '6F', '6S', '7K', '7SF', '7F', '7S', '3K'].forEach(type => {
                if (this.detectedHands[type]) {
                    allHands.push(...this.detectedHands[type]);
                }
            });
        } else if (pos === 'front') {
            // Front typically holds 3-card hands, but can hold 5-card if strong enough
            ['3K', 'PAIR', 'HIGH'].forEach(type => {
                if (this.detectedHands[type]) {
                    allHands.push(...this.detectedHands[type]);
                }
            });
        }

        return allHands;
    }

    /**
     * Debug helper - get summary of all straight flushes found
     * @param {Array} suitCards - Cards in suit to analyze
     * @returns {Object} - Summary of findings
     */
    getStraightFlushSummary(suitCards) {
        const allSFs = this.findAllStraightFlushesInSuit(suitCards);

        const summary = {
            total: allSFs.length,
            by_length: {}
        };

        allSFs.forEach(sf => {
            const length = sf.length;
            if (!summary.by_length[length]) {
                summary.by_length[length] = [];
            }
            summary.by_length[length].push({
                high: sf.high,
                low: sf.low,
                cards: sf.cards.map(c => c.rank).join('-')
            });
        });

        return summary;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HandDetector;
}