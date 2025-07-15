// js/ui/config.js
// Configuration UI management

class ConfigUI {
    constructor() {
        this.isOpen = false;
        this.createConfigModal();
        this.setupEventListeners();
    }

    setupConfigButton() {
        // Create tooltip element
        this.createTooltip();

        // Find the config button and set up hover events
        const configButton = document.getElementById('gameConfig');
        if (configButton) {
            configButton.addEventListener('mouseenter', () => this.showTooltip());
            configButton.addEventListener('mouseleave', () => this.hideTooltip());
            configButton.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));

            // Update button text to show current config
            this.updateButtonText();
        }
    }

    createTooltip() {
        if (document.getElementById('configTooltip')) return;

        const tooltip = document.createElement('div');
        tooltip.id = 'configTooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid #4ecdc4;
            font-size: 12px;
            z-index: 1000;
            display: none;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            max-width: 200px;
            line-height: 1.4;
        `;
        document.body.appendChild(tooltip);
    }

    // Update the showTooltip method to show more info
    showTooltip() {
        const tooltip = document.getElementById('configTooltip');
        const config = window.gameConfig.getConfig();

        const modeText = config.gameMode === 'singleplayer' ?
            `Single Player vs ${config.computerPlayers} AI` : 'Multiplayer';

        tooltip.innerHTML = `
            <div style="color: #ffd700; font-weight: bold; margin-bottom: 4px;">⚙️ Current Configuration</div>
            <div style="color: #4ecdc4;">🎮 Mode: ${modeText}</div>
            <div style="color: #4ecdc4;">🃏 Wild Cards: ${config.wildCardCount}</div>
            <div style="color: #4ecdc4;">🎴 Decks: ${config.deckCount}</div>
            <div style="color: #95a5a6; font-size: 10px; margin-top: 4px; font-style: italic;">Click to change settings</div>
        `;
        tooltip.style.display = 'block';
    }


    hideTooltip() {
        const tooltip = document.getElementById('configTooltip');
        tooltip.style.display = 'none';
    }

    updateTooltipPosition(e) {
        const tooltip = document.getElementById('configTooltip');
        const offset = 10;

        // Position tooltip near cursor but avoid going off-screen
        let x = e.clientX + offset;
        let y = e.clientY - tooltip.offsetHeight - offset;

        // Adjust if tooltip would go off right edge
        if (x + tooltip.offsetWidth > window.innerWidth) {
            x = e.clientX - tooltip.offsetWidth - offset;
        }

        // Adjust if tooltip would go off top edge
        if (y < 0) {
            y = e.clientY + offset;
        }

        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }

    updateButtonText() {
    const configButton = document.getElementById('gameConfig');
    const config = window.gameConfig.getConfig();

    if (configButton) {
        // Update button to show mode and wild card count
        const modeIcon = config.gameMode === 'singleplayer' ? '🤖' : '👥';
        const wildCount = config.wildCardCount;
        configButton.innerHTML = `⚙️ Config ${modeIcon}${wildCount > 0 ? ` (${wildCount}🃏)` : ''}`;
    }
}

    // Update the showTooltip method to show more info
    showTooltip() {
        const tooltip = document.getElementById('configTooltip');
        const config = window.gameConfig.getConfig();

        const modeText = config.gameMode === 'singleplayer' ?
            `Single Player vs ${config.computerPlayers} AI` : 'Multiplayer';

        tooltip.innerHTML = `
            <div style="color: #ffd700; font-weight: bold; margin-bottom: 4px;">⚙️ Current Configuration</div>
            <div style="color: #4ecdc4;">🎮 Mode: ${modeText}</div>
            <div style="color: #4ecdc4;">🃏 Wild Cards: ${config.wildCardCount}</div>
            <div style="color: #4ecdc4;">🎴 Decks: ${config.deckCount}</div>
            <div style="color: #95a5a6; font-size: 10px; margin-top: 4px; font-style: italic;">Click to change settings</div>
        `;
        tooltip.style.display = 'block';
    }

    createConfigModal() {
    // Create modal HTML if it doesn't exist
    if (document.getElementById('configModal')) return;

    const modalHTML = `
        <div id="configModal" class="config-modal" style="display: none;">
            <div class="config-content">
                <div class="config-header">
                    <h2>⚙️ Game Settings</h2>
                    <button class="config-close" id="configClose">×</button>
                </div>
                <div class="config-body">
                    <!-- Game Mode Settings -->
                    <div class="config-section">
                        <h3>🎮 Game Mode</h3>
                        <div class="config-option">
                            <label for="gameMode">Game Mode:</label>
                            <select id="gameMode">
                                <option value="multiplayer">Multiplayer - Play with friends</option>
                                <option value="singleplayer">Single Player - vs Computer</option>
                            </select>
                            <div class="config-description">Choose between multiplayer or single player vs AI opponents.</div>
                        </div>
                        <div class="config-option" id="computerPlayersOption" style="display: none;">
                            <label for="computerPlayers">Number of Computer Opponents:</label>
                            <select id="computerPlayers">
                                <option value="1">1 Computer Player</option>
                                <option value="2">2 Computer Players</option>
                                <option value="3">3 Computer Players (Default)</option>
                                <option value="4">4 Computer Players</option>
                                <option value="5">5 Computer Players</option>
                            </select>
                            <div class="config-description">How many AI opponents you'll play against.</div>
                        </div>
                    </div>

                    <!-- Card Settings -->
                    <div class="config-section">
                        <h3>🃏 Card Settings</h3>
                        <div class="config-option">
                            <label for="wildCardCount">Number of Wild Cards:</label>
                            <select id="wildCardCount">
                                <option value="0">0 - No Wild Cards</option>
                                <option value="1">1 - Minimal Wilds</option>
                                <option value="2">2 - Standard (Default)</option>
                                <option value="3">3 - Extra Wilds</option>
                                <option value="4">4 - Maximum Wilds</option>
                            </select>
                            <div class="config-description">Wild cards can be used as any card you need to complete hands.</div>
                        </div>
                        <div class="config-option">
                            <label for="deckCount">Number of Decks:</label>
                            <select id="deckCount">
                                <option value="1">1 - Single Deck</option>
                                <option value="2">2 - Standard (Default)</option>
                                <option value="3">3 - Triple Deck</option>
                            </select>
                            <div class="config-description">More decks allow for larger games and more duplicate cards.</div>
                        </div>
                    </div>

                    // Player Settings Section
                    <div class="config-section">
                        <h3>👥 Player Settings</h3>
                        <div class="config-option">
                            <label>Current Players:</label>
                            <div id="playerManagement" style="margin: 10px 0;">
                                <!-- Player list will be populated here -->
                            </div>
                            <button type="button" id="addPlayerBtn" class="btn btn-secondary" style="width: 100%; margin: 5px 0;">
                                + Add Player
                            </button>
                            <div class="config-description">Add or remove players before starting the tournament.</div>
                        </div>
                    </div>

                    <!-- Configuration Preview -->
                    <div class="config-preview">
                        <h4>Current Settings:</h4>
                        <div id="configPreview"></div>
                        <div id="configWarnings" class="config-warnings"></div>
                    </div>
                </div>
                <div class="config-footer">
                    <button id="configReset" class="btn btn-secondary">Reset to Defaults</button>
                    <button id="configSave" class="btn btn-primary">Save & Close</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.addConfigStyles();
}

    addConfigStyles() {
        if (document.getElementById('configStyles')) return;

        const styles = `
            <style id="configStyles">
                .config-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .config-content {
                    background: linear-gradient(135deg, #2c3e50, #34495e);
                    border-radius: 15px;
                    border: 2px solid #4ecdc4;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    color: white;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                }

                .config-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                }

                .config-header h2 {
                    margin: 0;
                    color: #ffd700;
                }

                .config-close {
                    background: none;
                    border: none;
                    color: #ff6b6b;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 50%;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .config-close:hover {
                    background: rgba(255, 107, 107, 0.2);
                }

                .config-body {
                    padding: 20px;
                }

                .config-section {
                    margin-bottom: 25px;
                }

                .config-section h3 {
                    color: #4ecdc4;
                    margin-bottom: 15px;
                    font-size: 18px;
                }

                .config-option {
                    margin-bottom: 15px;
                }

                .config-option label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: bold;
                    color: #ecf0f1;
                }

                .config-option select {
                    width: 100%;
                    padding: 10px;
                    border-radius: 8px;
                    border: 1px solid #4ecdc4;
                    background: rgba(52, 73, 94, 0.8);
                    color: white;
                    font-size: 14px;
                }

                .config-option select:focus {
                    outline: none;
                    border-color: #ffd700;
                    box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
                }

                .config-description {
                    margin-top: 5px;
                    font-size: 12px;
                    color: #95a5a6;
                    font-style: italic;
                }

                .config-preview {
                    background: rgba(52, 73, 94, 0.5);
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .config-preview h4 {
                    margin-bottom: 10px;
                    color: #ffd700;
                }

                .config-footer {
                    padding: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }

                .config-footer .btn {
                    padding: 10px 20px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }

                .config-footer .btn-secondary {
                    background: #95a5a6;
                    color: white;
                }

                .config-footer .btn-secondary:hover {
                    background: #7f8c8d;
                }

                .config-footer .btn-primary {
                    background: #4ecdc4;
                    color: white;
                }

                .config-footer .btn-primary:hover {
                    background: #45b7aa;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // Update the setupEventListeners method to handle game mode changes
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'configClose') {
                this.close();
            } else if (e.target.id === 'configSave') {
                this.save();
            } else if (e.target.id === 'configReset') {
                this.reset();
            } else if (e.target.id === 'addPlayerBtn') {  // NEW
                this.addPlayer();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'wildCardCount' ||
                e.target.id === 'deckCount' ||
                e.target.id === 'gameMode' ||
                e.target.id === 'computerPlayers') {

                // Show/hide computer players option based on game mode
                if (e.target.id === 'gameMode') {
                    this.toggleComputerPlayersOption();
                }

                this.updatePreview();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    // Add method to toggle computer players option visibility
    toggleComputerPlayersOption() {
        const gameMode = document.getElementById('gameMode').value;
        const computerPlayersOption = document.getElementById('computerPlayersOption');

        if (gameMode === 'singleplayer') {
            computerPlayersOption.style.display = 'block';
        } else {
            computerPlayersOption.style.display = 'none';
        }
    }

    loadPlayerList() {
    const playerManagement = document.getElementById('playerManagement');
    if (!playerManagement) return;

    playerManagement.innerHTML = '';

    // Get current players from game
    const players = window.game ? window.game.playerManager.players : [];

    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.style.cssText = `
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px 12px; margin: 5px 0; border-radius: 6px;
            background: rgba(78, 205, 196, 0.1); border: 1px solid #4ecdc4;
        `;

        playerDiv.innerHTML = `
            <span style="color: #4ecdc4;">${player.name}</span>
            <button onclick="window.configUI.removePlayer(${index})"
                    style="background: #ff6b6b; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                Remove
            </button>
        `;

        playerManagement.appendChild(playerDiv);
    });

    // Show player count
    const countDiv = document.createElement('div');
    countDiv.style.cssText = 'color: #95a5a6; font-size: 12px; margin-top: 5px;';
    countDiv.textContent = `${players.length} player(s) - Need at least 2 to start tournament`;
    playerManagement.appendChild(countDiv);
}

    addPlayer() {
        if (!window.game) {
            this.showNotification('Game not initialized yet', 'error');
            return;
        }

        const playerName = window.game.addPlayer();
        if (playerName) {
            this.loadPlayerList();
            this.showNotification(`Added ${playerName}`, 'success');
        }
    }

    removePlayer(index) {
    if (!window.game) return;

    const removedPlayer = window.game.playerManager.removePlayer(index);
    if (removedPlayer) {
        this.loadPlayerList();
        updateDisplay(window.game);
        this.showNotification(`Removed ${removedPlayer.name}`, 'info');
    }
}

    show() {
        this.isOpen = true;
        const modal = document.getElementById('configModal');
        modal.style.display = 'flex';

        // Load current configuration
        this.loadCurrentConfig();
        this.updatePreview();
    }

    close() {
        this.isOpen = false;
        document.getElementById('configModal').style.display = 'none';
    }

    // Update the loadCurrentConfig method
    loadCurrentConfig() {
        const config = window.gameConfig.getConfig();
        document.getElementById('gameMode').value = config.gameMode;
        document.getElementById('computerPlayers').value = config.computerPlayers;
        document.getElementById('wildCardCount').value = config.wildCardCount;
        document.getElementById('deckCount').value = config.deckCount;

        // Show/hide computer players option
        this.toggleComputerPlayersOption();

        // NEW: Load current players
        this.loadPlayerList();
    }

    // Update the updatePreview method
    updatePreview() {
        const gameMode = document.getElementById('gameMode').value;
        const computerPlayers = document.getElementById('computerPlayers').value;
        const wildCardCount = document.getElementById('wildCardCount').value;
        const deckCount = document.getElementById('deckCount').value;
        const preview = document.getElementById('configPreview');
        const warnings = document.getElementById('configWarnings');

        let previewHTML = `
            <div>🎮 Mode: ${gameMode === 'singleplayer' ? `Single Player vs ${computerPlayers} AI` : 'Multiplayer'}</div>
            <div>🃏 Wild Cards: ${wildCardCount}</div>
            <div>🎴 Decks: ${deckCount}</div>
        `;

        // Check if configuration is valid
        const totalPlayers = gameMode === 'singleplayer' ? (1 + parseInt(computerPlayers)) : 4;
        const totalCards = (parseInt(deckCount) * 52) + parseInt(wildCardCount);
        const cardsNeeded = totalPlayers * 17;

        if (totalCards < cardsNeeded) {
            const shortage = cardsNeeded - totalCards;
            warnings.innerHTML = `⚠️ Warning: Not enough cards! Need ${cardsNeeded} cards but only have ${totalCards}. Short by ${shortage} cards.`;
            warnings.classList.add('show');
        } else {
            warnings.classList.remove('show');
        }

        preview.innerHTML = previewHTML;
    }


    // Update the save method
    save() {
        const gameMode = document.getElementById('gameMode').value;
        const computerPlayers = parseInt(document.getElementById('computerPlayers').value);
        const wildCardCount = parseInt(document.getElementById('wildCardCount').value);
        const deckCount = parseInt(document.getElementById('deckCount').value);

        try {
            window.gameConfig.setGameMode(gameMode);
            window.gameConfig.setComputerPlayers(computerPlayers);
            window.gameConfig.setWildCardCount(wildCardCount);
            window.gameConfig.setDeckCount(deckCount);

            this.updateButtonText();
            this.close();

            if (window.game) {
                window.game.startNewGame();  // Actually start the new game!
            }

            // Show confirmation
            this.showNotification('Configuration saved successfully!', 'success');

        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    reset() {
        if (confirm('Reset all settings to defaults?')) {
            window.gameConfig.resetToDefaults();
            this.loadCurrentConfig();
            this.updatePreview();
            this.updateButtonText(); // ADD THIS LINE
            this.showNotification('Configuration reset to defaults', 'info');
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1001;
            transition: all 0.3s ease;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Global configuration UI instance
window.configUI = new ConfigUI();

// Global function to open configuration
function openGameSettings() {
    window.configUI.show();
}

// Initialize the config UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment for all elements to be ready
    setTimeout(() => {
        if (window.configUI) {
            window.configUI.setupConfigButton();
            window.configUI.updateButtonText(); // Add this line
        }
    }, 100);
});