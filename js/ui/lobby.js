// lobby.js

// In lobby.js, update the tableSettings object (around line 4):

let tableSettings = {
    gameConnectMode: 'offline',
    gameDeviceMode: 'single-device',
    gameMode: 'single-human',
    gameVariant: 'no surrender',
    computerPlayers: 4,
    wildCardCount: 2,
    deckCount: 2,
    winProbabilityMethod: 'tiered2',  // NEW - added AI method
    rounds: 3,           // NEW - changed from totalRounds
    // Table/Lobby settings
    maxPlayers: 6,                   // Maximum players allowed at table (2-6)
    minPlayers: 2,                   // Minimum players to start game
    maxHumanPlayers: 6,              // Maximum number of human players, then join is disabled
    humanPlayers: 0,
    tableId: null,                   // For multiplayer table identification
    tableName: ''                   // Display name for table
};

// Update defaultTables array to use new structure:
const defaultTables = [
    {
        id: 1,
        name: '1. Offline vs. 1 AI Opponents - 2 Wilds',
        settings: {
                    ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    computerPlayers: 1,
                    rounds: 3,
                    wildCardCount: 2,
                    winProbabilityMethod: 'netEV' },
        icon: '🏓'
    },

    {
        id: 2,
        name: '2. Offline vs. 2 AI Opponents - 1 Wild',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    computerPlayers: 2,
                    rounds: 3,
                    wildCardCount: 1,
                    winProbabilityMethod: 'netEV' },
        icon: '🏓'
    },

    {
        id: 3,
        name: '3. Offline vs 3 AI Opponents - No Wilds',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    computerPlayers: 5,
                    rounds: 5,
                    wildCardCount: 0,
                    winProbabilityMethod: 'tiered2' },
        icon: '🏓'
    },

    {
        id: 4,
        name: '4. Offline vs 5 AI Opponents - No Wilds',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    computerPlayers: 5,
                    rounds: 5,
                    wildCardCount: 0,
                    winProbabilityMethod: 'tiered2' },
        icon: '🏓'
    },

    {
        id: 5,
        name: '5. Offline Challenge - No Wilds',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameDeviceMode: 'single-device',
                    gameConnectMode: 'offline',
                    computerPlayers: 5,
                    rounds: 5,
                    wildCardCount: 0,
                    winProbabilityMethod: 'tiered2' },
        icon: '🏓'
    },

    {
        id: 6,
        name: '6. Online - 2 Wild Card',
        settings: {

                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'online',
                    gameDeviceMode: 'multi-device',
                    computerPlayers: 2,
                    rounds: 3,
                    wildCardCount: 2,
                    winProbabilityMethod: 'netEV' },
        icon: '☁️'
    },

    {
        id: 7,
        name: '7. Online - 2 Wild Card - 6 Players',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'multiple-humans',
                    gameConnectMode: 'online',
                    gameDeviceMode: 'multi-device',
                    computerPlayers: 0,
                    rounds: 3,
                    wildCardCount: 2,
                    maxPlayers: 6,
                    winProbabilityMethod: 'netEV' },
        icon: '☁️'
    },

    {
        id: 8,
        name: '8. Online - 2 Wild Card - 2 Players',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'multiple-humans',
                    gameConnectMode: 'online',
                    gameDeviceMode: 'multi-device',
                    computerPlayers: 0,
                    rounds: 3,
                    wildCardCount: 2,
                    maxPlayers: 2,
                    winProbabilityMethod: 'netEV' },
        icon: '☁️'
    },

    {
        id: 9,
        name: '9. Online - 2 Wild Card',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'multiple-humans',
                    gameConnectMode: 'online',
                    gameDeviceMode: 'multi-device',
                    computerPlayers: 5,
                    rounds: 3,
                    wildCardCount: 2,
                    winProbabilityMethod: 'netEV' },
        icon: '☁️'
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
    // ADD THIS DEBUG BLOCK:
//    console.log('🔍 Creating card for table:', table.name);
//    console.log('🔍 Table settings:', settings);
//    console.log('🔍 humanPlayers:', settings.humanPlayers);
//    console.log('🔍 maxHumanPlayers:', settings.maxHumanPlayers);

    const currentPlayers = settings.humanPlayers || 0;
    const maxPlayers = settings.maxHumanPlayers || 1;
    const isFull = currentPlayers >= maxPlayers;

//    console.log('🔍 isFull calculation:', isFull, `(${currentPlayers}/${maxPlayers})`);

    // Set onclick only if table isn't full
    if (!isFull) {
//        console.log('🔍 Adding click handler for table:', table.name);
        card.onclick = () => joinTable(table);
    } else {
//        console.log('🔍 Table is full, NOT adding click handler');
        card.classList.add('table-full');
        card.style.cursor = 'not-allowed';
    }


    const gameConnectModeText = settings.gameConnectMode === 'online' ? 'Online' : 'Offline';
    const gameModeText = settings.gameMode === 'single-human' ? 'Single Human Player' : 'Multiple Human Players';

    card.innerHTML = `
        <div class="table-header">
            <div class="table-name">${table.name}</div>
            <div class="table-icon">${table.icon}</div>
        </div>
        <div class="table-settings">
            Player(s): ${gameModeText}<br>
            Computer Players: ${settings.computerPlayers}<br>
            Connect Mode: ${gameConnectModeText}<br>
            Computer Methodology: ${settings.winProbabilityMethod}<br>
            Rounds: ${settings.rounds}<br>
            Wild Cards: ${settings.wildCardCount}
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

// In joinTable() function - after generating userName
async function claimOwnershipIfNeeded(tableId, playerName) {
    // Check who currently owns the table
    const ownerRef = firebase.database().ref(`tables/${tableId}/state/TABLE_OWNER`);
    const snapshot = await ownerRef.once('value');
    const currentOwner = snapshot.val();

    if (!currentOwner) {
        // No owner, claim it
        await ownerRef.set(playerName);
        console.log('👑 Claimed table ownership');
        return true;
    } else if (currentOwner === playerName) {
        // We already own it
        console.log('👑 We already own this table');
        return true;
    } else {
        // Someone else owns it
        console.log(`🔍 Table owned by: ${currentOwner}`);
        return false;
    }
}


async function joinTable(table) {
    console.log('🔍 joinTable called for:', table.name);


    // NEW: Check for stale table data and clean up if needed
//    console.log('🧹 Checking for stale table data...');
    const playersSnapshot = await firebase.database().ref(`tables/${table.id}/players`).once('value');
    const existingPlayers = playersSnapshot.val() || {};
    const playerCount = Object.keys(existingPlayers).length;

    // When players join, set lastActivity
    await firebase.database().ref(`tables/${table.id}/lastActivity`).set(Date.now());

    if (playerCount > 0) {
        console.log(`🔍 Found ${playerCount} existing players in table`);

        // Check last activity
        const lastActivitySnapshot = await firebase.database().ref(`tables/${table.id}/lastActivity`).once('value');
        const lastActivity = lastActivitySnapshot.val() || 0;
        const timeSinceActivity = Date.now() - lastActivity;
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

        console.log('🔍 Current timestamp:', Date.now());
        console.log('🔍 Last activity timestamp:', lastActivity);

        if (lastActivity && lastActivity > 0) {
            const timeSinceActivity = Date.now() - lastActivity;
            const fiveMinutes = 5 * 60 * 1000;

            console.log(`🕒 Time since last activity: ${Math.round(timeSinceActivity / 1000)} seconds`);

            if (timeSinceActivity > fiveMinutes) {
                console.log('🧹 Cleaning up stale table data...');
                await firebase.database().ref(`tables/${table.id}`).remove();
                await firebase.firestore().collection('currentGames').doc(`table_${table.id}`).delete();
                console.log('✅ Stale data cleaned up');
            } else {
                console.log('🔍 Table data is recent, keeping existing players');
            }
        } else {
                // Don't clean up if there's no timestamp - could be a legitimate new game
                console.log('🔍 No lastActivity timestamp - assuming fresh table, keeping players');

        }

        }

    // 🎯 FIX: Update gameConfig.config (not the whole gameConfig object)
    if (window.gameConfig) {
        Object.assign(window.gameConfig.config, {
            ...table.settings,
            gameDeviceMode: table.settings.gameDeviceMode.replace(' ', '-'),
            tableId: table.id
        });
//        console.log('✅ gameConfig.config updated with table settings');
//        console.log('🔍 gameDeviceMode now:', window.gameConfig.config.gameDeviceMode);
    } else {
        console.error('❌ window.gameConfig not found during joinTable!');
    }


    // In joinTable() after successful join
    firebase.database().ref(`tables/${table.id}/state/${TABLE_STATES.NUM_HUMAN_PLAYERS}`)
        .transaction((current) => (current || 0) + 1);

    // Use it:
    isOwner = (TABLE_STATES.NUM_HUMAN_PLAYERS === 1);

    // Get CURRENT data from Firebase, not stale table data
    firebase.database().ref(`tables/${table.id}/settings/humanPlayers`).once('value', (snapshot) => {
        const currentHumanPlayers = snapshot.val() || 0;
        const maxHumanPlayers = table.settings.maxHumanPlayers || 6;

        console.log('🔍 Current human players from Firebase:', currentHumanPlayers);
        // Check if table is full (applies to ALL table types)
//        console.log('🔍 Calculated - current:', currentHumanPlayers, 'max:', maxHumanPlayers);
//        console.log('🔍 Is full?', currentHumanPlayers >= maxHumanPlayers);
//        console.log('🔍 Max players:', maxHumanPlayers);

        if (currentHumanPlayers >= maxHumanPlayers) {
            alert(`Table "${table.name}" is full (${currentHumanPlayers}/${maxHumanPlayers} players)`);
            console.log('❌ JOIN BLOCKED - table actually full');
            return;
        }

        console.log('✅ JOIN ALLOWED - proceeding with fresh data');


        // In joinTable() after determining isOwner

        const playerInfo = {
            id: 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: 'n/a not using Firebase',
            joinedAt: Date.now(),
            ready: false,
            isOwner: isOwner
        };

        window.isOwner = playerInfo.isOwner;

        // NOW proceed with joining...
        currentTable = table;
        tableSettings = { ...table.settings };

        // Initialize the start button state for single-player tables
        if (table.settings.gameMode === 'single-human') {
            updateStartGameButton(1); // Single player is always ready
        } else {
            updateStartGameButton(0); // Multi-player starts with 0 players
        }

        firebase.database().ref(`tables/${table.id}/settings/humanPlayers`)
            .transaction((current) => (current || 0) + 1)
            .then(() => {
//                console.log('✅ Human player counter incremented');
                table.settings.humanPlayers += 1
            });
    updateTableDisplay();
    showTableScreen();

    });

    // NEW: Check if this is a multi-human table
    if (table.settings.gameMode === 'multiple-humans' &&
        table.settings.gameDeviceMode === 'multi-device' &&
        table.settings.gameConnectMode === 'online') {

        console.log('🌐 Joining multi-human table:', table.name);

        // Initialize MultiDeviceIntegration if not already done
        if (!window.multiDeviceIntegration) {
            console.log('🔧 Initializing MultiDeviceIntegration...');
            window.multiDeviceIntegration = new MultiDeviceIntegration(table.id, {
                tablesRef: firebase.firestore().collection('tables')
            });

            // ADD back:
            window.multiDeviceIntegration.setupMultiDeviceEnhancements();
        }

        // In joinTable()
        const currentUser = firebase.auth().currentUser;
        let uniquePlayerName = currentUser ? currentUser.email : 'Guest Player';

        if (currentUser && currentUser.email && window.game?.playerManager) {
            console.log('🔧 Log in joinTable - Generating unique player name...');
            uniquePlayerName = await window.game.playerManager.generateUniquePlayerName(currentUser.email, table.id);
            console.log('🔧 Log in joinTable - Generated uniquePlayerName:', uniquePlayerName);
            // Add this line:
            window.uniquePlayerName = uniquePlayerName;
            console.log('🔧 Log in joinTable - Set window.uniquePlayerName to:', window.uniquePlayerName);
        }

        const isOwner = await claimOwnershipIfNeeded(table.id, uniquePlayerName);

        const playerInfo = {
            id: 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: uniquePlayerName,  // Always use uniquePlayerName
            joinedAt: Date.now(),
            ready: false,
            isOwner: isOwner
        };

        console.log('log in joinTable Creating playerInfo with isOwner:', isOwner);
        console.log('log in joinTable Final playerInfo:', playerInfo);

        window.isOwner = playerInfo.isOwner;

        window.multiDeviceIntegration.enhanceContinueButton();

        console.log('🔍 userName, isOwner:', uniquePlayerName, isOwner);

        // Clear previous round's game data from Firestore
        if (window.isOwner && window.multiDeviceIntegration) {
            const tableId = window.multiDeviceIntegration.tableId;
            await firebase.firestore().collection('tables').doc(tableId.toString()).update({
                'currentGame': firebase.firestore.FieldValue.delete()
            });
        }

        // Add player to Firebase table (using .then() instead of await)
        window.multiDeviceIntegration.addPlayerToTable(table.id, playerInfo)
            // After the .then() in joinTable()
            .then(async () => {
                console.log('✅ Player added successfully');

                // Set up listener for real-time updates
                window.multiDeviceIntegration.setupPlayerListListener(table.id, updatePlayerListUI);
                window.multiDeviceIntegration.setupScoreListener(); // Add this line
                

                // NEW: Add table state listener
                window.multiDeviceIntegration.setupTableStateListener(table.id, handleTableStateChange);

                // Set up lobby state listener
                setupLobbyStateListener(table.id);

                // If owner and enough players, set lobby to ready
                if (playerInfo.isOwner) {
                    const playersSnapshot = await firebase.database().ref(`tables/${table.id}/players`).once('value');
                    const players = playersSnapshot.val() || {};
                    const currentPlayerCount = Object.keys(players).length;

                    if (currentPlayerCount >= 2) {
                        await firebase.database().ref(`tables/${table.id}/state/LOBBY_STATE`).set('ready');
                        console.log('🏛️ Owner set lobby state to ready');
                    }
                }
            })

            .catch(error => {
                console.error('❌ Error adding player:', error);
            });

        // Show the multi-human player section
        const playerSection = document.getElementById('multiHumanPlayers');
        if (playerSection) {
            playerSection.style.display = 'block';
        }

    } else {
        // Hide multi-human section for single-player tables
        const playerSection = document.getElementById('multiHumanPlayers');
        if (playerSection) {
            playerSection.style.display = 'none';
        }
    }
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
                    <input type="range" id="tableRounds" min="3" max="20" value="3" input="updateRoundsDisplay(this.value)">
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
                    <input type="range" id="tableWildCardCounts" min="0" max="4" value="2" input="updateWildCardsDisplay(this.value)">
                    <span id="wildCardsValue">2</span>
                </div>

                <div class="setting-group">
                    <label for="tableComputerPlayers">AI Players (1-5):</label>
                    <input type="range" id="tableComputerPlayers" min="1" max="5" value="4" input="updateAiPlayersDisplay(this.value)">
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
    tableSettings.gameDeviceMode = tableSettings.gameDeviceMode || 'single-device';
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
                           input="updateRoundsDisplay(this.value)" style="flex: 1;">
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
                           input="updateWildCardsDisplay(this.value)" style="flex: 1;">
                    <span id="wildCardsValue" style="color: #ffd700; font-weight: bold; min-width: 30px;">2</span>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">AI Players (1-5):</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="range" id="tableComputerPlayers" min="1" max="5" value="4"
                           input="updateAiPlayersDisplay(this.value)" style="flex: 1;">
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
function updatePlayerListUI(players, tableId) {
    console.log('🖥️ Updating player list UI:', players);

    // NEW: Sync Firebase players to local PlayerManager
    if (window.game?.playerManager) {
        window.game.playerManager.players = players.map(firebasePlayer => ({
            name: firebasePlayer.name,
            id: firebasePlayer.id,
            isAI: false
        }));
        console.log(`✅ Synced ${window.game.playerManager.players.length} Firebase players to PlayerManager`);
    }

    // DEBUG: Find the player manager object (remove after testing)
    console.log('🔍 window.playerManager:', window.playerManager);
    console.log('🔍 window.game:', window.game);
    console.log('🔍 window.game?.playerManager:', window.game?.playerManager);

    // NEW: Sync Firebase players to local player manager array
    if (window.playerManager) {
        window.playerManager.players = players.map(firebasePlayer => ({
            name: firebasePlayer.name,
            id: firebasePlayer.id,
            isAI: false,
            // Add any other properties that existing validation expects
        }));
        console.log(`✅ Synced ${window.playerManager.players.length} Firebase players to local array`);
    }

    // ADD THIS DEBUG BLOCK:
    players.forEach((player, index) => {
        console.log(`🔍 Player ${index}:`, player);
        console.log(`🔍 Player ${index} name:`, player.name);
        console.log(`🔍 Player ${index} type:`, typeof player.name);
    });

    const playerCount = players.length;
    const maxPlayers = 6;

    // Update player count
    const playerCountElement = document.querySelector('.player-count');
    if (playerCountElement) {
        playerCountElement.textContent = `${playerCount} of ${maxPlayers} players`;
    }

    // Update individual player slots
    const playerSlots = document.querySelectorAll('.player-slot');
    console.log('🔧 Found player slots:', playerSlots.length);

    playerSlots.forEach((slot, index) => {
        if (index < players.length) {
            // Player exists - show their info
            slot.innerHTML = `
                <span class="player-icon">👤</span>
                <span class="player-name">${players[index].name}</span>
            `;
            slot.classList.remove('waiting');
            slot.classList.add('occupied');
        } else {
            // Empty slot - show waiting
            slot.innerHTML = `
                <span class="player-icon">⏳</span>
                <span class="player-name">Waiting for players...</span>
            `;
            slot.classList.add('waiting');
            slot.classList.remove('occupied');
        }
    });

    console.log('✅ Updated all player slots');

    // Update the player count display
//    const playerCountElement = document.getElementById('currentPlayerCount');
    if (playerCountElement) {
        playerCountElement.textContent = players.length;
    }

    // Update start game button
    updateStartGameButton(players.length);

    console.log('Updated all player slots');

    // In your updatePlayerListUI function, add this at the end:
    tableOwnerManager(players ? players.length : 0, players,tableId);

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
