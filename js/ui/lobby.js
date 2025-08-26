// lobby.js

// In lobby.js, update the tableSettings object (around line 4):

let tableSettings = {
    gameConnectMode: 'offline',
    gameDeviceMode: 'single device',
    gameMode: 'singleplayer',
    gameVariant: 'no surrender',
    computerPlayers: 4,
    wildCardCount: 2,
    deckCount: 2,
    winProbabilityMethod: 'tiered2',  // NEW - added AI method
    rounds: 3,           // NEW - changed from totalRounds
    // Table/Lobby settings
    maxPlayers: 6,                   // Maximum players allowed at table (2-6)
    minPlayers: 2,                   // Minimum players to start game
    tableId: null,                   // For multiplayer table identification
    tableName: ''                   // Display name for table
};

// Update defaultTables array to use new structure:
const defaultTables = [
    {
        id: 1,
        name: 'Quick Play',
        settings: { gameMode: 'offline', aiPlayers: 5, rounds: 3, wildCards: 2, aiMethod: 'tiered2' },
        icon: '🏓'
    },
//    {
//        id: 2,
//        name: 'Practice Table',
//        settings: { gameMode: 'offline', aiPlayers: 1, rounds: 5, wildCards: 1, aiMethod: 'points' },
//        icon: '🏓'
//    },
//    {
//        id: 3,
//        name: 'Cloud Ranked',
//        settings: { gameMode: 'online', aiPlayers: 5, rounds: 3, wildCards: 2, aiMethod: 'netEV' },
//        icon: '☁️'
//    },
    {
        id: 4,
        name: 'Challenge Mode',
        settings: { gameMode: 'offline', aiPlayers: 5, rounds: 10, wildCards: 0, aiMethod: 'tiered2' },
        icon: '🏓'
    }
];

// Initialize lobby (call this after your Firebase login)
function initializeLobby(userName) {
    document.getElementById('currentUser').textContent = userName;
    populateLobby();
    showLobbyScreen();
}

// Show lobby screen
function showLobbyScreen() {
    document.getElementById('lobbyScreen').style.display = 'block';
    document.getElementById('tableScreen').style.display = 'none';
    document.getElementById('gameArea').style.display = 'none';
}

// Show table screen
function showTableScreen() {
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('tableScreen').style.display = 'block';
    document.getElementById('gameArea').style.display = 'none';
}

// Populate lobby with tables
function populateLobby() {
    const tableGrid = document.getElementById('tableGrid');
    tableGrid.innerHTML = '';

    // Add default tables
    defaultTables.forEach(table => {
        const tableCard = createTableCard(table);
        tableGrid.appendChild(tableCard);
    });

    // Add "Create Table" option
    const createCard = createCreateTableCard();
    tableGrid.appendChild(createCard);
}

// Create table card element
function createTableCard(table) {
    const card = document.createElement('div');
    card.className = 'table-card';
    card.onclick = () => joinTable(table);
    const settings = table.settings;
    const modeText = settings.gameMode === 'online' ? 'Online' : 'Offline';

    card.innerHTML = `
        <div class="table-header">
            <div class="table-name">${table.name}</div>
            <div class="table-icon">${table.icon}</div>
        </div>
        <div class="table-settings">
            Mode: ${modeText}<br>
            AI Players: ${settings.aiPlayers}<br>
            Rounds: ${settings.rounds}<br>
            Wild Cards: ${settings.wildCards}
        </div>
        <div class="table-status">Join Table</div>
    `;

    return card;
}

// Create "Create Table" card
function createCreateTableCard() {
    const card = document.createElement('div');
    card.className = 'table-card create-table';
    card.onclick = () => createNewTable();

    card.innerHTML = `
        <div class="table-header">
            <div class="table-name">Create Table</div>
            <div class="table-icon">➕</div>
        </div>
        <div class="table-settings">
            Set up a new table<br>
            with custom settings<br>
            &nbsp;
        </div>
        <div class="table-status">Customize Settings</div>
    `;

    return card;
}

// Join existing table
function joinTable(table) {
    currentTable = table;
    tableSettings = { ...table.settings };
    updateTableDisplay();
    showTableScreen();
}

// Create new table (opens your existing settings modal)
function createNewTable() {
    currentTable = {
        id: Date.now(),
        name: 'Custom Table',
        settings: { ...tableSettings },
        icon: tableSettings.gameMode === 'online' ? '☁️' : '📱'
    };

    // Call your existing game config function
    if (typeof openGameConfig === 'function') {
        openGameConfig();
    } else {
        console.warn('openGameConfig function not found');
    }
}

// Update table display (replace existing function)
function updateTableDisplay() {
    if (!currentTable) return;

    document.getElementById('tableTitle').textContent = `🪑 Sitting at ${currentTable.name}`;

    const modeText = tableSettings.gameMode === 'online' ? 'Online (Cloud Sync)' : 'Offline (Local Device)';
    const settingsHtml = `
        Mode: ${modeText}<br>
        AI Players: ${tableSettings.computerPlayers}<br>
        Rounds: ${tableSettings.rounds}<br>          <!-- NEW -->
        Wild Cards: ${tableSettings.wildCardCount}<br>
        AI Method: ${tableSettings.winProbabilityMethod}         <!-- NEW -->
    `;

    document.getElementById('settingsDisplay').innerHTML = settingsHtml;
}

// Replace the editSettings function (around line 125):
function editSettings() {
    openTableSettings();
}

// Function to call when your settings modal saves
function onSettingsSaved(newSettings) {
    // Update our table settings from your modal
    tableSettings = {
        gameMode: newSettings.gameMode || 'offline',
        aiPlayers: newSettings.aiPlayers || 4,
        totalRounds: newSettings.totalRounds || 3,
        wildCards: newSettings.wildCards || 2
    };

    // Update current table
    if (currentTable) {
        currentTable.settings = { ...tableSettings };
        currentTable.icon = tableSettings.gameMode === 'online' ? '☁️' : '📱';
        updateTableDisplay();
        showTableScreen();
    }
}

// Start game
function startGame() {
    if (!currentTable) return;

    console.log('Starting game with aligned settings:', tableSettings);

    // Now tableSettings uses the same names as GameConfig - direct copy!
    if (game && game.gameConfig) {
        Object.assign(game.gameConfig.config, tableSettings);
        console.log('Applied settings to GameConfig:', game.gameConfig.config);
    }

    // Continue with your existing game start logic
    if (tableSettings.gameConnectMode === 'online') {
        if (typeof cloudNewGame === 'function') {
            cloudNewGame().then(() => {
                launchGameInterface();
            }).catch(error => {
                console.error('Cloud setup failed:', error);
                alert('Failed to connect to cloud. Try offline mode.');
            });
        } else {
            console.warn('cloudNewGame function not found');
            launchGameInterface();
        }
    } else {
        launchGameInterface();
    }
}

// Launch your existing game interface
function launchGameInterface() {

    console.log('🎮 Launching game interface with settings:', tableSettings);

    // Hide lobby, show your existing game interface
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('tableScreen').style.display = 'none';

    // Create or update game config with table settings
    if (typeof game !== 'undefined' && game.gameConfig) {
        // Apply table settings to existing game config
        gameConfig.winProbabilityMethod = tableSettings.winProbabilityMethod;
        gameConfig.wildCardCount = tableSettings.wildCardCount;
        gameConfig.computerPlayers = tableSettings.computerPlayers;
        gameConfig.rounds = tableSettings.rounds;
        gameConfig.gameMode = tableSettings.gameMode;
    }


    // Show your existing game area
    const gameArea = document.getElementById('gameArea');
    if (gameArea) {
        gameArea.style.display = 'block';
    }

    // Call your existing startNewGame function
    if (typeof startNewGame === 'function') {
//        startNewGame();
          window.game.startNewGame();
    } else {
//        console.warn('startNewGame function not found');
    }
}

// Leave table
function leaveTable() {
    currentTable = null;
    showLobbyScreen();
}

// Return to table after game ends (call this from your game end code)
function returnToTable() {
    if (currentTable) {
        updateTableDisplay();
        showTableScreen();

        // Hide your game interface
        const gameArea = document.getElementById('gameArea');
        if (gameArea) {
            gameArea.style.display = 'none';
        }
    } else {
        showLobbyScreen();
    }
}

// Create table settings modal HTML (add this function to lobby.js)
function createTableSettingsModal() {
    const modal = document.createElement('div');
    modal.id = 'tableSettingsModal';
    modal.className = 'modal';
    modal.style.display = 'none';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>🎯 Table Settings</h2>
                <span class="close" onclick="closeTableSettings()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="setting-group">
                    <label for="tableRounds">Rounds (3-20):</label>
                    <input type="range" id="tableRounds" min="3" max="20" value="3" oninput="updateRoundsDisplay(this.value)">
                    <span id="rounds">3</span>
                </div>

                <div class="setting-group">
                    <label for="winProbabilityMethod">AI Method:</label>
                    <select id="winProbabilityMethod">
                        <option value="points">Points</option>
                        <option value="tiered2">Tiered2</option>
                        <option value="netEV">NetEV</option>
                    </select>
                </div>

                <div class="setting-group">
                    <label for="tableWildCardCounts">Wild Cards (0-4):</label>
                    <input type="range" id="tableWildCardCounts" min="0" max="4" value="2" oninput="updateWildCardsDisplay(this.value)">
                    <span id="wildCardsValue">2</span>
                </div>

                <div class="setting-group">
                    <label for="tableComputerPlayers">AI Players (1-5):</label>
                    <input type="range" id="tableComputerPlayers" min="1" max="5" value="4" oninput="updateAiPlayersDisplay(this.value)">
                    <span id="aiPlayersValue">4</span>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeTableSettings()">Cancel</button>
                <button class="btn btn-primary" onclick="saveTableSettings()">Save Settings</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Open table settings modal
function openTableSettings() {
    // Create modal if it doesn't exist
    if (!document.getElementById('tableSettingsModal')) {
        createTableSettingsModal();
    }

    // Populate current settings
    document.getElementById('tableRounds').value = tableSettings.rounds || 3;
    document.getElementById('winProbabilityMethod').value = tableSettings.winProbabilityMethod || 'tiered2';
    document.getElementById('tableWildCardCounts').value = tableSettings.wildCardCount || 2;
    document.getElementById('tableComputerPlayers').value = tableSettings.computerPlayers || 4;

    // Update displays
    updateRoundsDisplay(tableSettings.rounds || 3);
    updateAiPlayersDisplay(tableSettings.computerPlayers || 4);
    updateWildCardsDisplay(tableSettings.wildCardCount || 2);

    // Show modal
    document.getElementById('tableSettingsModal').style.display = 'block';
}

// Close table settings modal
function closeTableSettings() {
    document.getElementById('tableSettingsModal').style.display = 'none';
}

// Save table settings
function saveTableSettings() {
    // Get values from modal using GameConfig variable names
    tableSettings.rounds = parseInt(document.getElementById('tableRounds').value);
    tableSettings.winProbabilityMethod = document.getElementById('winProbabilityMethod').value;  // Changed from aiMethod
    tableSettings.wildCardCount = parseInt(document.getElementById('tableWildCardCounts').value);        // Changed from wildCards
    tableSettings.computerPlayers = parseInt(document.getElementById('tableComputerPlayers').value);      // Changed from aiPlayers

    // Add other GameConfig settings that might be set in lobby
    tableSettings.gameConnectMode = tableSettings.gameConnectMode || 'offline';
    tableSettings.gameDeviceMode = tableSettings.gameDeviceMode || 'single device';
    tableSettings.gameMode = tableSettings.gameMode || 'singleplayer';

    // Update current table if we have one
    if (currentTable) {
        currentTable.settings = { ...tableSettings };
    }

    // Update the display
    updateTableDisplay();

    // Close modal
    closeTableSettings();

    console.log('Table settings saved (aligned with GameConfig):', tableSettings);
}

// Update display functions for sliders
function updateRoundsDisplay(value) {
    document.getElementById('rounds').textContent = value;
}

function updateAiPlayersDisplay(value) {
    document.getElementById('aiPlayersValue').textContent = value;
}

function updateWildCardsDisplay(value) {
    document.getElementById('wildCardsValue').textContent = value;
}

// Table Settings Modal Functions - Add to lobby.js

// Table Settings Modal Functions - Add to end of lobby.js

// Open table settings modal
function openTableSettings() {
    // Create modal if it doesn't exist
    if (!document.getElementById('tableSettingsModal')) {
        createTableSettingsModal();
    }

    // Populate current settings
    document.getElementById('tableRounds').value = tableSettings.rounds || 3;
    document.getElementById('winProbabilityMethod').value = tableSettings.winProbabilityMethod || 'tiered2';
    document.getElementById('tableWildCardCounts').value = tableSettings.wildCardCount || 2;
    document.getElementById('tableComputerPlayers').value = tableSettings.computerPlayers || 4;

    // Update displays
    updateRoundsDisplay(tableSettings.rounds || 3);
    updateAiPlayersDisplay(tableSettings.computerPlayers || 4);
    updateWildCardsDisplay(tableSettings.wildCardCount || 2);

    // Show modal
    document.getElementById('tableSettingsModal').style.display = 'block';
}

// Create modal dynamically (matches your scoring popup style)
function createTableSettingsModal() {
    const modal = document.createElement('div');
    modal.id = 'tableSettingsModal';
    modal.className = 'scoring-popup'; // Reuse existing popup CSS

    modal.innerHTML = `
        <div class="scoring-content">
            <button class="close-popup" onclick="closeTableSettings()">&times;</button>
            <h2 style="text-align: center; margin-bottom: 30px; color: #ffd700;">⚙️ Table Settings</h2>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">Rounds (3-20):</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="range" id="tableRounds" min="3" max="20" value="3"
                           oninput="updateRoundsDisplay(this.value)" style="flex: 1;">
                    <span id="rounds" style="color: #ffd700; font-weight: bold; min-width: 30px;">3</span>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">AI Method:</label>
                <select id="winProbabilityMethod" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid #ffd700; border-radius: 5px;">
                    <option value="points">Points</option>
                    <option value="tiered2">Tiered2</option>
                    <option value="netEV">NetEV</option>
                </select>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">Wild Cards (0-4):</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="range" id="tableWildCardCounts" min="0" max="4" value="2"
                           oninput="updateWildCardsDisplay(this.value)" style="flex: 1;">
                    <span id="wildCardsValue" style="color: #ffd700; font-weight: bold; min-width: 30px;">2</span>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">AI Players (1-5):</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="range" id="tableComputerPlayers" min="1" max="5" value="4"
                           oninput="updateAiPlayersDisplay(this.value)" style="flex: 1;">
                    <span id="aiPlayersValue" style="color: #ffd700; font-weight: bold; min-width: 30px;">4</span>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <button class="btn btn-secondary" onclick="closeTableSettings()" style="margin-right: 15px;">Cancel</button>
                <button class="btn btn-primary" onclick="saveTableSettings()">Save Settings</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Close, save, and update functions
function closeTableSettings() {
    document.getElementById('tableSettingsModal').style.display = 'none';
}

function saveTableSettings() {
    tableSettings.rounds = parseInt(document.getElementById('tableRounds').value);
    tableSettings.winProbabilityMethod = document.getElementById('winProbabilityMethod').value;
    tableSettings.wildCardCount = parseInt(document.getElementById('tableWildCardCounts').value);
    tableSettings.computerPlayers = parseInt(document.getElementById('tableComputerPlayers').value);

    if (currentTable) {
        currentTable.settings = { ...tableSettings };
    }

    updateTableDisplay();
    closeTableSettings();
    console.log('✅ Table settings saved:', tableSettings);
}

function updateRoundsDisplay(value) {
    document.getElementById('rounds').textContent = value;
}

function updateAiPlayersDisplay(value) {
    document.getElementById('aiPlayersValue').textContent = value;
}

function updateWildCardsDisplay(value) {
    document.getElementById('wildCardsValue').textContent = value;
}
// Export functions for integration
window.PyramidPokerLobby = {
    initializeLobby,
    showLobbyScreen,
    showTableScreen,
    onSettingsSaved,
    returnToTable,
    getCurrentTableSettings: () => tableSettings
};