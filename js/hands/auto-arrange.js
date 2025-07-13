// js/hands/auto-arrange.js
// Streamlined version using find-best-setup universal dispatcher

class AutoArrangeManager {
    constructor(game) {
        this.game = game;
        this.arrangementValidator = new ArrangementValidator(game);
    }

    /**
     * Main auto-arrange - uses universal find-best-setup
     */
    autoArrangeHand() {
        const playerData = this.getPlayerData();
        if (!playerData) return false;

        const allCards = this.getAllCards(playerData);
        if (!this.validateCardCount(allCards)) return false;

        console.log('🧠 Auto-Arrange using find-best-setup...');
        const result = findBestSetup(allCards);

        if (result?.success && result.arrangement) {
            console.log(`✨ Setup found! Score: ${result.score}`);
            const arrangement = {
                back: result.arrangement.back.cards,
                middle: result.arrangement.middle.cards,
                front: result.arrangement.front.cards,
                staging: result.arrangement.stagingCards  // ✅ Use built-in stagingCards
            };
            return this.applyArrangement(playerData, arrangement);
        }

        console.log('❌ find-best-setup failed, using fallback');
        return this.fallbackAutoArrange(allCards, playerData);
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
    // UTILITY METHODS
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