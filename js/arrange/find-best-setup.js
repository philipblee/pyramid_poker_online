// js/arrange/find-best-setup.js
// Universal dispatcher for finding optimal 3-hand arrangements
// Handles all wild card scenarios by dispatching to specialized solvers

class FindBestSetup {
    constructor() {
        this.statistics = {
            totalCalls: 0,
            wildDistribution: {
                noWild: 0,
                oneWild: 0,
                twoWild: 0,
                threeWild: 0,
                fourWild: 0
            }
        };
    }

    /**
     * Find the best arrangement for any 17-card hand
     * Automatically handles wild card detection and dispatching
     * @param {Array} allCards - Array of 17 card objects (Card Model format)
     * @returns {Object} Best arrangement result (Arrangement Model format)
     */
    findBestSetup(allCards) {
        console.log(`🎯 FindBestSetup: Analyzing 17 cards for optimal arrangement...`);

        // Validate input
        if (!this.validateInput(allCards)) {
            return this.createErrorResult('Invalid input cards');
        }

        this.statistics.totalCalls++;
        const startTime = performance.now();

        try {
            // Count wild cards
            const { wildCards, nonWildCards } = CardUtilities.separateWildCards(allCards);
            const wildCount = wildCards.length;

            console.log(`🃏 Wild card analysis: ${wildCount} wild cards, ${nonWildCards.length} non-wild cards`);
            this.updateWildStatistics(wildCount);

            // Dispatch to appropriate solver
            let result;

            if (wildCount === 0) {
                console.log(`📊 Dispatching to NO-WILD solver...`);
                result = this.handleNoWild(allCards);

            } else if (wildCount === 1) {
                console.log(`🃏 Dispatching to ONE-WILD solver...`);
                result = this.handleOneWild(allCards);

            } else if (wildCount === 2) {
                console.log(`🃏🃏 Dispatching to TWO-WILD solver...`);
                result = this.handleTwoWild(allCards);

            } else {
                console.log(`🃏+ Dispatching to FALLBACK solver (${wildCount} wilds)...`);
                result = this.handleFallback(allCards, wildCount);
            }

            // Add timing information
            const endTime = performance.now();
            if (result && result.statistics) {
                result.statistics.dispatchTime = endTime - startTime;
                result.statistics.wildCount = wildCount;
            }

            this.logResult(result, wildCount);
            return result;

        } catch (error) {
            console.error(`❌ FindBestSetup error:`, error);
            return this.createErrorResult(error.message);
        }
    }

    /**
     * Handle hands with no wild cards
     * @param {Array} allCards - 17 card objects with 0 wilds
     * @returns {Object} Arrangement result
     */
    handleNoWild(allCards) {
        const finder = new FindBestSetupNoWild();
        return finder.findBestSetupNoWild(allCards);
    }

    /**
     * Handle hands with one wild card
     * @param {Array} allCards - 17 card objects with 1 wild
     * @returns {Object} Arrangement result
     */
    handleOneWild(allCards) {
        // TODO: Implement when ready
        // return oneWildBestFromCards(allCards);
        throw new Error('One wild card support not yet implemented');
    }

    /**
     * Handle hands with two wild cards
     * @param {Array} allCards - 17 card objects with 2 wilds
     * @returns {Object} Arrangement result
     */
    handleTwoWild(allCards) {
        // TODO: Implement when ready
        // return twoWildBestFromCards(allCards);
        throw new Error('Two wild card support not yet implemented');
    }

    /**
     * Handle hands with 3+ wild cards (fallback)
     * @param {Array} allCards - 17 card objects with 3+ wilds
     * @param {number} wildCount - Number of wild cards
     * @returns {Object} Arrangement result
     */
    handleFallback(allCards, wildCount) {
        // TODO: Implement fallback logic
        throw new Error(`${wildCount} wild cards not supported (fallback not implemented)`);
    }

    /**
     * Validate input cards
     * @param {Array} allCards - Cards to validate
     * @returns {boolean} True if valid
     */
    validateInput(allCards) {
        if (!Array.isArray(allCards)) {
            console.error(`❌ Input must be an array, got ${typeof allCards}`);
            return false;
        }

        if (allCards.length !== 17) {
            console.error(`❌ Expected 17 cards, got ${allCards.length}`);
            return false;
        }

        // Basic card validation
        for (let i = 0; i < allCards.length; i++) {
            const card = allCards[i];
            if (!card || typeof card !== 'object') {
                console.error(`❌ Invalid card at index ${i}:`, card);
                return false;
            }

            if (!card.hasOwnProperty('id') || !card.hasOwnProperty('rank') || !card.hasOwnProperty('suit')) {
                console.error(`❌ Card missing required properties at index ${i}:`, card);
                return false;
            }
        }

        return true;
    }

    /**
     * Update wild card statistics
     * @param {number} wildCount - Number of wild cards
     */
    updateWildStatistics(wildCount) {
        switch (wildCount) {
            case 0: this.statistics.wildDistribution.noWild++; break;
            case 1: this.statistics.wildDistribution.oneWild++; break;
            case 2: this.statistics.wildDistribution.twoWild++; break;
            case 3: this.statistics.wildDistribution.threeWild++; break;
            case 4: this.statistics.wildDistribution.fourWild++; break;
            default:
                // Handle 5+ wilds if that ever happens
                console.warn(`⚠️ Unusual wild count: ${wildCount}`);
        }
    }

    /**
     * Create error result in standard format
     * @param {string} errorMessage - Error description
     * @returns {Object} Error result
     */
    createErrorResult(errorMessage) {
        return {
            arrangement: null,
            score: -Infinity,
            success: false,
            error: errorMessage,
            statistics: {
                dispatchTime: 0,
                wildCount: -1
            }
        };
    }

    /**
     * Log the final result
     * @param {Object} result - Result to log
     * @param {number} wildCount - Number of wild cards
     */
    logResult(result, wildCount) {
        if (result && result.success) {
            console.log(`✅ FindBestSetup SUCCESS (${wildCount} wilds): Score ${result.score}`);
            if (result.statistics) {
                console.log(`   Dispatch time: ${result.statistics.dispatchTime?.toFixed(2)}ms`);
            }
        } else {
            console.log(`❌ FindBestSetup FAILED (${wildCount} wilds):`, result?.error || 'Unknown error');
        }
    }

    /**
     * Get usage statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        return {
            ...this.statistics,
            totalWildCards: Object.values(this.statistics.wildDistribution).reduce((a, b) => a + b, 0)
        };
    }

    /**
     * Reset statistics
     */
    resetStatistics() {
        this.statistics = {
            totalCalls: 0,
            wildDistribution: {
                noWild: 0,
                oneWild: 0,
                twoWild: 0,
                threeWild: 0,
                fourWild: 0
            }
        };
        console.log(`📊 FindBestSetup statistics reset`);
    }
}

/**
 * Convenience function for direct usage
 * @param {Array} allCards - 17 card objects
 * @returns {Object} Best arrangement result
 */
function findBestSetup(allCards) {
    const finder = new FindBestSetup();
    return finder.findBestSetup(allCards);
}