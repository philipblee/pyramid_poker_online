// js/core/game-config.js
// Game configuration management - starting with wild card count

class GameConfig {
    constructor() {
        this.config = {
            // Wild card settings
            wildCardCount: 2,           // Number of wild cards (0-4)

            // Future expansion options (commented out for now)
            // deckCount: 2,             // Number of standard decks (1-3)
            // maxPlayers: 4,            // Maximum players (2-6)
            // frontHandOptions: [3, 5], // Allowed front hand sizes
            // timeLimit: 0,             // Turn time limit in seconds (0 = none)
            // scoringSystem: 'standard' // 'standard', 'tournament', 'casual'
        };

        this.loadFromStorage();
    }

    // Get current configuration
    getConfig() {
        return { ...this.config }; // Return a copy to prevent external modification
    }

    // Set wild card count (0-4)
    setWildCardCount(count) {
        if (count < 0 || count > 4) {
            throw new Error('Wild card count must be between 0 and 4');
        }
        this.config.wildCardCount = count;
        this.saveToStorage();
        console.log(`🃏 Wild card count set to: ${count}`);
    }

    // Get wild card count
    getWildCardCount() {
        return this.config.wildCardCount;
    }

    // Reset to default settings
    resetToDefaults() {
        this.config = {
            wildCardCount: 2
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
        return {
            'Wild Cards': `${this.config.wildCardCount} cards`,
            // Future options will be added here
        };
    }

    // Validate configuration
    isValid() {
        const { wildCardCount } = this.config;

        if (wildCardCount < 0 || wildCardCount > 4) {
            return { valid: false, error: 'Wild card count must be between 0 and 4' };
        }

        return { valid: true };
    }
}

// Global configuration instance
window.gameConfig = new GameConfig();