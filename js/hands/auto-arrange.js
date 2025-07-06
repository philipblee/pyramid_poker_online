// js/hands/auto-arrange.js
// Phase 8: Integrated single wild optimization - simplified wild card handling

class AutoArrangeManager {
    constructor(game) {
        this.game = game;
        // Removed: wildCardOptimizer - replaced with direct single wild optimization
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

        // Handle wild cards
        const { wildCards } = CardUtilities.separateWildCards(allCards);
        if (wildCards.length === 1) {
            console.log('🃏 Single wild detected - using smart optimization');
            return this.optimizeSingleWild(allCards, playerData);
        } else if (wildCards.length > 1) {
            console.log('🃏 Multiple wilds detected - using fallback');
            return this.fallbackAutoArrange(allCards, playerData);
        }

        console.log('🧠 Smart Auto-Arrange starting with BestArrangementGenerator...');

        // Use our optimized arrangement generator (handles ALL hand types including 6-8 card special hands)
        const bestArrangement = this.findBestArrangementOptimized(allCards);
        if (bestArrangement) {
            console.log('✨ Optimal arrangement found and validated!');
            this.logArrangement(bestArrangement);
            return this.applyArrangement(playerData, bestArrangement);
        }

        // Fallback to simple arrangement
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
     * NEW: Single wild optimization using proven smart approach
     */
    optimizeSingleWild(allCards, playerData) {
        try {
            const result = oneWildBestFromCards(allCards);

            console.log('🔍 Debug result:', result); // ADD THIS LINE

            if (result && result.arrangement) {
                console.log(`✨ Single wild optimization successful! Score: ${result.score}`);

                // Calculate staging cards
                const usedCards = [
                    ...result.arrangement.back.cards,
                    ...result.arrangement.middle.cards,
                    ...result.arrangement.front.cards
                ];

                const stagingCards = allCards.filter(card =>
                    !usedCards.some(usedCard => usedCard.id === card.id)
                );

                const arrangement = {
                    back: result.arrangement.back.cards,
                    middle: result.arrangement.middle.cards,
                    front: result.arrangement.front.cards,
                    staging: stagingCards
                };

                return this.applyArrangement(playerData, arrangement);
            }

            console.warn('⚠️ Single wild optimization failed, using fallback');
            return this.fallbackAutoArrange(allCards, playerData);

        } catch (error) {
            console.error('❌ Single wild optimization error:', error);
            return this.fallbackAutoArrange(allCards, playerData);
        }
    }

    /**
     * Find best arrangement using greedy branch-and-bound algorithm
     * Handles ALL hand types including 6-8 card special hands optimally
     */
    findBestArrangementOptimized(allCards) {
        console.log('🎯 Using BestArrangementGenerator (handles 5-8 card hands optimally)...');

        try {
            // Step 1: Detect all possible hands
            const handDetector = new HandDetector(allCards);
            const detectionResults = handDetector.detectAllHands();
            console.log(`🔍 Detected ${detectionResults.total} possible hands`);

            // Step 2: Sort hands by strength
            const handSorter = new HandSorter();
            const sortResult = handSorter.sortHandsByStrength(detectionResults.hands);
            console.log(`🔄 Sorted hands by strength`);

            // Step 3: Find optimal arrangement using greedy algorithm
            const generator = new BestArrangementGenerator();
            const result = generator.generateBestArrangement(sortResult.sortedHands, allCards);

            if (result.arrangement) {
                console.log(`🏆 Optimal arrangement found! Score: ${result.score} (${result.statistics.searchTime.toFixed(1)}ms, ${result.statistics.efficiency * 100}% pruning efficiency)`);

                // Calculate remaining cards for staging
                const usedCards = [
                    ...result.arrangement.back.cards,
                    ...result.arrangement.middle.cards,
                    ...result.arrangement.front.cards
                ];

                const stagingCards = allCards.filter(card =>
                    !usedCards.some(usedCard => usedCard.id === card.id)
                );

                // Convert to the format expected by existing game code
                const gameArrangement = {
                    back: result.arrangement.back.cards,
                    middle: result.arrangement.middle.cards,
                    front: result.arrangement.front.cards,
                    staging: stagingCards
                };

                // Final validation before returning
                if (this.arrangementValidator.validateFinalArrangement(gameArrangement)) {
                    return gameArrangement;
                } else {
                    console.warn('⚠️ Generated arrangement failed validation');
                    return null;
                }
            }

            console.warn('⚠️ BestArrangementGenerator could not find valid arrangement');
            return null;

        } catch (error) {
            console.error('❌ Error in BestArrangementGenerator:', error);
            return null;
        }
    }

    /**
     * DEPRECATED: Old method - kept for fallback compatibility
     * Find best arrangement for normal hands (5-card combinations)
     */
    findBestNormalArrangement(allCards) {
        console.log('⚠️ Using deprecated findBestNormalArrangement - consider updating to findBestArrangementOptimized');
        return this.findBestArrangementOptimized(allCards);
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