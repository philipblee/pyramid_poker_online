// js/arrange/best-arrangement-generator.js v1
// Greedy branch-and-bound algorithm to find optimal arrangement
// Starts with strongest hands and uses pruning to avoid exhaustive search

class BestArrangementGenerator {
    constructor() {
        this.bestScore = -Infinity;
        this.bestArrangement = null;
        this.exploredNodes = 0;
        this.prunedNodes = 0;
    }

    /**
     * Find the best single arrangement using greedy branch-and-bound
     * @param {Array} sortedHands - Hands sorted by strength (strongest first)
     * @returns {Object} - Best arrangement with score and statistics
     */
    generateBestArrangement(sortedHands) {
        console.log(`🎯 BestArrangementGenerator: Finding optimal arrangement from ${sortedHands.length} hands...`);

        this.resetSearch();
        const startTime = performance.now();

        // Try each valid back hand (strongest first)
        for (let backIdx = 0; backIdx < sortedHands.length; backIdx++) {
            const backHand = sortedHands[backIdx];

            if (!this.canUseInPosition(backHand, 'back')) continue;

            this.searchMiddleHands(sortedHands, backHand, backIdx);

            // Early termination if we've found a very strong arrangement
            if (this.shouldTerminateEarly()) break;
        }

        const endTime = performance.now();

        return {
            arrangement: this.bestArrangement,
            score: this.bestScore,
            statistics: {
                exploredNodes: this.exploredNodes,
                prunedNodes: this.prunedNodes,
                searchTime: endTime - startTime,
                efficiency: this.prunedNodes / (this.exploredNodes + this.prunedNodes)
            }
        };
    }

    /**
     * Search for compatible middle hands
     * @param {Array} sortedHands - All hands
     * @param {Object} backHand - Selected back hand
     * @param {number} backIdx - Index of back hand
     */
    searchMiddleHands(sortedHands, backHand, backIdx) {
        const backUsedCards = new Set(backHand.cards.map(c => c.id));

        // Try middle hands (same strength or weaker than back)
        for (let middleIdx = backIdx; middleIdx < sortedHands.length; middleIdx++) {
            const middleHand = sortedHands[middleIdx];

            if (!this.canUseInPosition(middleHand, 'middle')) continue;
            if (this.hasCardOverlap(backUsedCards, middleHand.cards)) continue;

            // Pruning: check if this branch can possibly beat current best
            const partialScore = this.calculatePartialScore(backHand, middleHand);
            const maxFrontScore = this.estimateMaxFrontScore(sortedHands, middleIdx);

            if (partialScore + maxFrontScore <= this.bestScore) {
                this.prunedNodes++;
                continue;
            }

            this.searchFrontHands(sortedHands, backHand, middleHand, backUsedCards, middleIdx);
        }
    }

    /**
     * Search for compatible front hands
     * @param {Array} sortedHands - All hands
     * @param {Object} backHand - Selected back hand
     * @param {Object} middleHand - Selected middle hand
     * @param {Set} backUsedCards - Cards used by back hand
     * @param {number} middleIdx - Index of middle hand
     */
    searchFrontHands(sortedHands, backHand, middleHand, backUsedCards, middleIdx) {
        const allUsedCards = new Set([
            ...backUsedCards,
            ...middleHand.cards.map(c => c.id)
        ]);

        // Try front hands (same strength or weaker than middle)
        for (let frontIdx = middleIdx; frontIdx < sortedHands.length; frontIdx++) {
            const frontHand = sortedHands[frontIdx];

            if (!this.canUseInPosition(frontHand, 'front')) continue;
            if (this.hasCardOverlap(allUsedCards, frontHand.cards)) continue;

            this.exploredNodes++;

            // Calculate full arrangement score
            const arrangement = { back: backHand, middle: middleHand, front: frontHand };
            const score = this.scoreArrangement(arrangement);

            if (score > this.bestScore) {
                this.bestScore = score;
                this.bestArrangement = arrangement;
                console.log(`🏆 New best arrangement found! Score: ${score}`);
                this.logArrangement(arrangement);
            }
        }
    }

    /**
     * Check if hand can be used in specified position
     * @param {Object} hand - Hand object
     * @param {string} position - 'back', 'middle', or 'front'
     * @returns {boolean} - True if hand can be used in position
     */
    canUseInPosition(hand, position) {
        return hand.validPositions && hand.validPositions.includes(position);
    }

    /**
     * Check if new cards overlap with used cards
     * @param {Set} usedCards - Set of card IDs already used
     * @param {Array} newCards - Array of card objects to check
     * @returns {boolean} - True if there's overlap
     */
    hasCardOverlap(usedCards, newCards) {
        return newCards.some(card => usedCards.has(card.id));
    }

    /**
     * Calculate partial score for back + middle (for pruning)
     * @param {Object} backHand - Back hand
     * @param {Object} middleHand - Middle hand
     * @returns {number} - Partial score
     */
    calculatePartialScore(backHand, middleHand) {
        // Simplified scoring - just hand strengths for now
        // TODO: Replace with actual Pyramid Poker scoring
        return (backHand.strength || 0) + (middleHand.strength || 0);
    }

    /**
     * Estimate maximum possible front score for pruning
     * @param {Array} sortedHands - All hands
     * @param {number} startIdx - Index to start searching from
     * @returns {number} - Estimated maximum front score
     */
    estimateMaxFrontScore(sortedHands, startIdx) {
        // Simple estimate: strongest hand that could be front
        for (let i = startIdx; i < Math.min(startIdx + 50, sortedHands.length); i++) {
            const hand = sortedHands[i];
            if (this.canUseInPosition(hand, 'front')) {
                return hand.strength || 0;
            }
        }
        return 0;
    }

    /**
     * Score a complete arrangement
     * @param {Object} arrangement - {back, middle, front}
     * @returns {number} - Total arrangement score
     */
    scoreArrangement(arrangement) {
        // Placeholder scoring - replace with actual Pyramid Poker scoring
        // This should use the ScoringUtilities class when available

        const backScore = this.getHandScore(arrangement.back, 'back');
        const middleScore = this.getHandScore(arrangement.middle, 'middle');
        const frontScore = this.getHandScore(arrangement.front, 'front');

        return backScore + middleScore + frontScore;
    }

    /**
     * Get score for a hand in a specific position
     * @param {Object} hand - Hand object
     * @param {string} position - Position ('back', 'middle', 'front')
     * @returns {number} - Hand score for that position
     */
    getHandScore(hand, position) {
        // Placeholder - replace with actual Pyramid Poker position-specific scoring
        const baseScore = hand.strength || 0;

        // Front hands can score higher (temporary multipliers)
        const positionMultipliers = {
            'front': 3,   // Front hands worth more
            'middle': 2,  // Middle hands medium value
            'back': 1     // Back hands base value
        };

        return baseScore * (positionMultipliers[position] || 1);
    }

    /**
     * Check if search should terminate early
     * @returns {boolean} - True if should terminate
     */
    shouldTerminateEarly() {
        // Terminate if we've found a very high-scoring arrangement
        // or explored enough nodes
        return this.bestScore > 1000 || this.exploredNodes > 100000;
    }

    /**
     * Reset search state
     */
    resetSearch() {
        this.bestScore = -Infinity;
        this.bestArrangement = null;
        this.exploredNodes = 0;
        this.prunedNodes = 0;
    }

    /**
     * Log arrangement details for debugging
     * @param {Object} arrangement - Arrangement to log
     */
    logArrangement(arrangement) {
        console.log(`   Back: ${arrangement.back.handType} (${arrangement.back.cards.length} cards)`);
        console.log(`   Middle: ${arrangement.middle.handType} (${arrangement.middle.cards.length} cards)`);
        console.log(`   Front: ${arrangement.front.handType} (${arrangement.front.cards.length} cards)`);

        // Show cards used
        const totalCards = arrangement.back.cards.length +
                          arrangement.middle.cards.length +
                          arrangement.front.cards.length;
        console.log(`   Total cards used: ${totalCards}/17`);
    }

    /**
     * Validate arrangement follows game rules
     * @param {Object} arrangement - Arrangement to validate
     * @returns {Object} - Validation result
     */
    validateArrangement(arrangement) {
        const issues = [];

        // Check card count
        const totalCards = arrangement.back.cards.length +
                          arrangement.middle.cards.length +
                          arrangement.front.cards.length;

        if (totalCards > 17) {
            issues.push(`Too many cards used: ${totalCards}/17`);
        }

        // Check no card overlap
        const allCards = [
            ...arrangement.back.cards,
            ...arrangement.middle.cards,
            ...arrangement.front.cards
        ];

        const cardIds = allCards.map(c => c.id);
        const uniqueCardIds = new Set(cardIds);

        if (cardIds.length !== uniqueCardIds.size) {
            issues.push('Card overlap detected');
        }

        // Check strength order (using hand_rank comparison)
        // TODO: Implement proper hand strength comparison

        return {
            isValid: issues.length === 0,
            issues: issues,
            totalCards: totalCards,
            cardOverlap: cardIds.length !== uniqueCardIds.size
        };
    }
}