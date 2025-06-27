// js/hands/auto-arrange.js
// Phase 6: Final cleanup - Pure orchestrator pattern

class AutoArrangeManager {
    constructor(game) {
        this.game = game;
        // Specialized components for different responsibilities
        this.wildCardOptimizer = new WildCardOptimizer(game);
        this.largeHandDetector = new LargeHandDetector(game);
        this.arrangementGenerator = new ArrangementGenerator(game);
        this.arrangementValidator = new ArrangementValidator(game);
    }

    /**
     * Main entry point - Smart auto-arrange with all optimizations
     * Orchestrates the entire arrangement process
     */
    smartAutoArrangeHand() {
        const playerData = this.getPlayerData();
        if (!playerData) return false;

        const allCards = this.getAllCards(playerData);
        if (!this.validateCardCount(allCards)) return false;

        // Handle wild cards with specialized optimizer (with fallback)
        const { wildCards } = CardUtilities.separateWildCards(allCards);
        if (wildCards.length > 0) {
            console.log('🃏 Wild cards detected - using specialized optimizer');
            try {
                return this.wildCardOptimizer.optimizeWildArrangement(allCards, playerData);
            } catch (error) {
                console.warn('🃏 Wild card optimizer failed, falling back to standard arrangement:', error.message);
                console.log('🔄 Proceeding with normal arrangement logic...');
                // Continue to normal arrangement logic below
            }
        }

        console.log('🧠 Smart Auto-Arrange starting...');

        // 1. Check for large hands first (6-8 cards)
        const largeHandArrangement = this.largeHandDetector.findLargeHandArrangement(allCards);
        if (largeHandArrangement) {
            console.log('🎯 Found large hand arrangement!');
            this.logArrangement(largeHandArrangement);
            return this.applyArrangement(playerData, largeHandArrangement);
        }

        // 2. Generate and find best normal arrangement
        const bestArrangement = this.findBestNormalArrangement(allCards);
        if (bestArrangement) {
            console.log('✨ Best arrangement found and validated!');
            this.logArrangement(bestArrangement);
            return this.applyArrangement(playerData, bestArrangement);
        }

        // 3. Fallback to simple arrangement
        console.log('❌ No optimal arrangement found, using fallback');
        return this.fallbackAutoArrange(allCards, playerData);
    }

    /**
     * Simple entry point - Basic auto-arrange without optimizations
     * For when you just want a quick, reasonable arrangement
     */
    autoArrangeHand() {
        return this.smartAutoArrangeHand();
    }

    /**
     * Find best arrangement for normal hands (5-card combinations)
     */
    findBestNormalArrangement(allCards) {
        // Analyze all possible hands
        const analyzer = new HandAnalyzer(allCards);
        const allPossibleHands = analyzer.findAllPossibleHands();

        console.log(`Found ${allPossibleHands.length} possible 5-card hands`);

        // Generate and score arrangements
        const bestArrangement = this.arrangementGenerator.findBestArrangement(allCards, allPossibleHands);

        // Final validation before returning
        if (bestArrangement && this.arrangementValidator.validateFinalArrangement(bestArrangement)) {
            return bestArrangement;
        }

        return null;
    }

    /**
     * Apply arrangement to player data and update game state
     */
    applyArrangement(playerData, arrangement) {
        playerData.back = arrangement.back;
        playerData.middle = arrangement.middle;
        playerData.front = arrangement.front;
        playerData.cards = arrangement.staging;
        this.game.loadCurrentPlayerHand();
        return true;
    }

    /**
     * Emergency fallback - Simple sort-based arrangement
     */
    fallbackAutoArrange(allCards, playerData) {
        console.log('🔄 Using fallback auto-arrange...');

        // Sort all cards and distribute optimally
        const sortedCards = CardUtilities.sortCardsByValue(allCards, true);

        const arrangement = {
            back: sortedCards.slice(0, 5),    // 5 best cards
            middle: sortedCards.slice(5, 10), // next 5 cards
            front: sortedCards.slice(10, 13), // next 3 cards
            staging: sortedCards.slice(13, 17) // 4 worst cards in staging
        };

        return this.applyArrangement(playerData, arrangement);
    }

    // =============================================================================
    // UTILITY METHODS - Clean, focused helper functions
    // =============================================================================

    /**
     * Get current player's data safely
     */
    getPlayerData() {
        const currentPlayer = this.game.playerManager.getCurrentPlayer();
        return currentPlayer ? this.game.playerHands.get(currentPlayer.name) : null;
    }

    /**
     * Combine all cards from all positions
     */
    getAllCards(playerData) {
        return CardUtilities.combineCards(
            playerData.cards,
            playerData.back,
            playerData.middle,
            playerData.front
        );
    }

    /**
     * Validate we have exactly 17 cards
     */
    validateCardCount(allCards) {
        return CardUtilities.validateCardCount(allCards, 17);
    }

    /**
     * Log arrangement in a clean, readable format
     */
    logArrangement(arrangement) {
        CardUtilities.logCardList(arrangement.back, 'Back');
        CardUtilities.logCardList(arrangement.middle, 'Middle');
        CardUtilities.logCardList(arrangement.front, 'Front');
        CardUtilities.logCardList(arrangement.staging, 'Staging');
    }
}