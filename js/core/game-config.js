// Update js/core/game-config.js - add game mode configuration

class GameConfig {
    constructor() {
        this.config = {
            // Game mode settings
            gameMode: 'multiplayer',        // 'multiplayer' or 'singleplayer'
            computerPlayers: 3,             // Number of computer opponents (1-5)

            // Wild card settings
            wildCardCount: 2,               // Number of wild cards (0-4)

            // Deck settings
            deckCount: 2,                   // Number of standard decks (1-3)

            // Win probability method
            winProbabilityMethod: 'netEV',  // 'points', 'empirical', 'tiered', 'tiered2', "netEV"

            // Future expansion options (commented out for now)
            // maxPlayers: 4,               // Maximum players (2-6)
            // frontHandOptions: [3, 5],    // Allowed front hand sizes
            // timeLimit: 0,                // Turn time limit in seconds (0 = none)
            // scoringSystem: 'standard'    // 'standard', 'tournament', 'casual'
        };

        this.loadFromStorage();
    }

    // Get current configuration
    getConfig() {
        return { ...this.config }; // Return a copy to prevent external modification
    }

    // Game mode settings
    setGameMode(mode) {
        const validModes = ['multiplayer', 'singleplayer'];
        if (!validModes.includes(mode)) {
            throw new Error('Game mode must be: multiplayer or singleplayer');
        }
        this.config.gameMode = mode;
        this.saveToStorage();
        console.log(`🎮 Game mode set to: ${mode}`);
    }

    getGameMode() {
        return this.config.gameMode;
    }

    setComputerPlayers(count) {
        if (count < 1 || count > 5) {
            throw new Error('Computer players must be between 1 and 5');
        }
        this.config.computerPlayers = count;
        this.saveToStorage();
        console.log(`🤖 Computer players set to: ${count}`);
    }

    getComputerPlayers() {
        return this.config.computerPlayers;
    }

    // Wild card settings
    setWildCardCount(count) {
        if (count < 0 || count > 4) {
            throw new Error('Wild card count must be between 0 and 4');
        }
        this.config.wildCardCount = count;
        this.saveToStorage();
        console.log(`🃏 Wild card count set to: ${count}`);
    }

    getWildCardCount() {
        return this.config.wildCardCount;
    }

    // Deck settings
    setDeckCount(count) {
        if (count < 1 || count > 3) {
            throw new Error('Deck count must be between 1 and 3');
        }
        this.config.deckCount = count;
        this.saveToStorage();
        console.log(`🎴 Deck count set to: ${count}`);
    }

    getDeckCount() {
        return this.config.deckCount;
    }

    // Reset to default settings
    resetToDefaults() {
        this.config = {
            gameMode: 'multiplayer',
            computerPlayers: 3,
            wildCardCount: 2,
            deckCount: 2
        };
        this.saveToStorage();
        console.log('🔄 Game configuration reset to defaults');
    }

    // Save configuration to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('pyramidPokerConfig', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Could not save configuration to localStorage:', error);
        }
    }

    // Load configuration from localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('pyramidPokerConfig');
            if (saved) {
                const savedConfig = JSON.parse(saved);
                this.config = { ...this.config, ...savedConfig };
                console.log('⚙️ Loaded game configuration:', this.config);
            }
        } catch (error) {
            console.warn('Could not load configuration from localStorage:', error);
        }
    }

    // Get configuration summary for display
    getConfigSummary() {
        const summary = {
            'Game Mode': this.config.gameMode === 'singleplayer' ?
                `Single Player (vs ${this.config.computerPlayers} AI)` : 'Multiplayer',
            'Wild Cards': `${this.config.wildCardCount} cards`,
            'Decks': `${this.config.deckCount} ${this.config.deckCount === 1 ? 'deck' : 'decks'}`
        };

        return summary;
    }

    // Validate configuration
    isValid() {
        const { gameMode, computerPlayers, wildCardCount, deckCount } = this.config;

        if (!['multiplayer', 'singleplayer'].includes(gameMode)) {
            return { valid: false, error: 'Game mode must be multiplayer or singleplayer' };
        }

        if (computerPlayers < 1 || computerPlayers > 5) {
            return { valid: false, error: 'Computer players must be between 1 and 5' };
        }

        if (wildCardCount < 0 || wildCardCount > 4) {
            return { valid: false, error: 'Wild card count must be between 0 and 4' };
        }

        if (deckCount < 1 || deckCount > 3) {
            return { valid: false, error: 'Deck count must be between 1 and 3' };
        }

        return { valid: true };
    }

    // Check if enough cards for the selected configuration
    canSupportGame() {
        const standardCardsPerDeck = 52;
        const totalStandardCards = this.config.deckCount * standardCardsPerDeck;
        const totalCards = totalStandardCards + this.config.wildCardCount;

        let playersNeeded;
        if (this.config.gameMode === 'singleplayer') {
            playersNeeded = 1 + this.config.computerPlayers; // Human + computers
        } else {
            playersNeeded = 4; // Default for multiplayer
        }

        const cardsNeeded = playersNeeded * 17;

        return {
            canSupport: totalCards >= cardsNeeded,
            totalCards,
            cardsNeeded,
            playersNeeded,
            shortage: Math.max(0, cardsNeeded - totalCards)
        };
    }
}

// Global configuration instance
window.gameConfig = new GameConfig();