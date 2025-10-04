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
        ...tableSettings,
        tableId: 1,
        tableName: '1. Offline vs. 1 AI Opponents - 2 Wilds',
        gameMode: 'single-human',
        gameConnectMode: 'offline',
        gameDeviceMode: 'single-device',
        computerPlayers: 1,
        rounds: 3,
        wildCardCount: 2,
        winProbabilityMethod: 'netEV',
        icon: '🏓'
    },
    {
        ...tableSettings,
        tableId: 2,
        tableName: '2. Offline vs. 2 AI Opponents - 1 Wild',
        gameMode: 'single-human',
        gameConnectMode: 'offline',
        gameDeviceMode: 'single-device',
        computerPlayers: 2,
        rounds: 3,
        wildCardCount: 1,
        winProbabilityMethod: 'netEV',
        icon: '🏓'
    },
    {
        ...tableSettings,
        tableId: 3,
        tableName: '3. Offline vs 3 AI Opponents - No Wilds',
        gameMode: 'single-human',
        gameConnectMode: 'offline',
        gameDeviceMode: 'single-device',
        computerPlayers: 5,
        rounds: 5,
        wildCardCount: 0,
        winProbabilityMethod: 'tiered2',
        icon: '🏓'
    },
    {
        ...tableSettings,
        tableId: 4,
        tableName: '4. Offline vs 5 AI Opponents - No Wilds',
        gameMode: 'single-human',
        gameConnectMode: 'offline',
        gameDeviceMode: 'single-device',
        computerPlayers: 5,
        rounds: 5,
        wildCardCount: 0,
        winProbabilityMethod: 'tiered2',
        icon: '🏓'
    },
    {
        ...tableSettings,
        tableId: 5,
        tableName: '5. Offline Challenge - No Wilds',
        gameMode: 'single-human',
        gameDeviceMode: 'single-device',
        gameConnectMode: 'offline',
        computerPlayers: 5,
        rounds: 5,
        wildCardCount: 0,
        winProbabilityMethod: 'tiered2',
        icon: '🏓'
    },
    {
        ...tableSettings,
        tableId: 6,
        tableName: '6. Online - 2 Wild Card',
        gameMode: 'single-human',
        gameConnectMode: 'online',
        gameDeviceMode: 'multi-device',
        computerPlayers: 2,
        rounds: 3,
        wildCardCount: 2,
        winProbabilityMethod: 'netEV',
        icon: '☁️'
    },
    {
        ...tableSettings,
        tableId: 7,
        tableName: '7. Online - 2 Wild Card - 6 Players',
        gameMode: 'multiple-humans',
        gameConnectMode: 'online',
        gameDeviceMode: 'multi-device',
        computerPlayers: 0,
        rounds: 3,
        wildCardCount: 2,
        maxPlayers: 6,
        winProbabilityMethod: 'netEV',
        icon: '☁️'
    },
    {
        ...tableSettings,
        tableId: 8,
        tableName: '8. Online - 2 Wild Card - 2 Players',
        gameMode: 'multiple-humans',
        gameConnectMode: 'online',
        gameDeviceMode: 'multi-device',
        computerPlayers: 0,
        rounds: 3,
        wildCardCount: 2,
        maxPlayers: 2,
        winProbabilityMethod: 'netEV',
        icon: '☁️'
    },
    {
        ...tableSettings,
        tableId: 9,
        tableName: '9. Online - 2 Wild Card',
        gameMode: 'multiple-humans',
        gameConnectMode: 'online',
        gameDeviceMode: 'multi-device',
        computerPlayers: 5,
        rounds: 3,
        wildCardCount: 2,
        winProbabilityMethod: 'netEV',
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

function createTableCard(table) {
    const card = document.createElement('div');
    card.className = 'table-card';

    const currentPlayers = table.humanPlayers || 0;  // Changed: no more table.settings
    const maxPlayers = table.maxHumanPlayers || 1;   // Changed
    const isFull = currentPlayers >= maxPlayers;

    // Set onclick only if table isn't full
    if (!isFull) {
        card.onclick = () => joinTable(table);
    } else {
        card.classList.add('table-full');
        card.style.cursor = 'not-allowed';
    }

    const gameConnectModeText = table.gameConnectMode === 'online' ? 'Online' : 'Offline';  // Changed
    const gameModeText = table.gameMode === 'single-human' ? 'Single Human Player' : 'Multiple Human Players';  // Changed

    card.innerHTML = `
        <div class="table-header">
            <div class="table-name">${table.tableName}</div>
            <div class="table-icon">${table.icon}</div>
        </div>
        <div class="table-settings">
            Player(s): ${gameModeText}<br>
            Computer Players: ${table.computerPlayers}<br>
            Connect Mode: ${gameConnectModeText}<br>
            Computer Methodology: ${table.winProbabilityMethod}<br>
            Rounds: ${table.rounds}<br>
            Wild Cards: ${table.wildCardCount}
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
//        console.log('👑 Claimed table ownership');
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
    console.log('🔍 joinTable called for:', table.tableName);  // Changed

    // Update gameConfig.config
    if (window.gameConfig) {
        Object.assign(window.gameConfig.config, {
            ...table,  // Changed: no more table.settings nesting
            gameDeviceMode: table.gameDeviceMode.replace(' ', '-'),  // Changed
            tableId: table.tableId  // Changed
        });
    } else {
        console.error('❌ window.gameConfig not found during joinTable!');
    }

    // Firebase transaction
    firebase.database().ref(`tables/${table.tableId}/state/${TABLE_STATES.NUM_HUMAN_PLAYERS}`)  // Changed
        .transaction((current) => (current || 0) + 1);

    isOwner = (TABLE_STATES.NUM_HUMAN_PLAYERS === 1);

    // Get CURRENT data from Firebase
    firebase.database().ref(`tables/${table.tableId}/settings/humanPlayers`).once('value', (snapshot) => {  // Changed
        const currentHumanPlayers = snapshot.val() || 0;
        const maxHumanPlayers = table.maxHumanPlayers || 6;  // Changed

        if (currentHumanPlayers >= maxHumanPlayers) {
            alert(`Table "${table.tableName}" is full (${currentHumanPlayers}/${maxHumanPlayers} players)`);  // Changed
            console.log('❌ JOIN BLOCKED - table actually full');
            return;
        }

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
        tableSettings = { ...table };  // Changed: no more table.settings

        // Initialize the start button state
        if (table.gameMode === 'single-human') {  // Changed
            updateStartGameButton(1);
        } else {
            updateStartGameButton(0);
        }

        firebase.database().ref(`tables/${table.tableId}/settings/humanPlayers`)  // Changed
            .transaction((current) => (current || 0) + 1)
            .then(() => {
                table.humanPlayers += 1  // Changed
            });
        updateTableDisplay();
        showTableScreen();
    });

    // Check if multi-human table
    if (table.gameMode === 'multiple-humans' &&  // Changed
        table.gameDeviceMode === 'multi-device' &&  // Changed
        table.gameConnectMode === 'online') {  // Changed

        // Initialize MultiDeviceIntegration
        if (!window.multiDeviceIntegration) {
            window.multiDeviceIntegration = new MultiDeviceIntegration(table.tableId, {  // Changed
                tablesRef: firebase.firestore().collection('tables')
            });

            window.multiDeviceIntegration.setupMultiDeviceEnhancements();
        }

        const currentUser = firebase.auth().currentUser;
        let uniquePlayerName = currentUser ? currentUser.email : 'Guest Player';

        if (currentUser && currentUser.email && window.game?.playerManager) {
            uniquePlayerName = await window.game.playerManager.generateUniquePlayerName(currentUser.email, table.tableId);  // Changed
            window.uniquePlayerName = uniquePlayerName;
            console.log('🔧 Log in joinTable - Set window.uniquePlayerName to:', window.uniquePlayerName);
        }

        const isOwner = await claimOwnershipIfNeeded(table.tableId, uniquePlayerName);  // Changed

        const playerInfo = {
            id: 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: uniquePlayerName,
            joinedAt: Date.now(),
            ready: false,
            isOwner: isOwner
        };

        console.log('log in joinTable Creating playerInfo with isOwner:', isOwner);
        console.log('log in joinTable Final playerInfo:', playerInfo);

        console.log('🔍 Selected table from menu - id:', table.tableId);  // Changed
        console.log('🔍 Selected table name:', table.tableName);  // Changed
        console.log('🔍 tableSettings.tableId before join:', tableSettings.tableId);

        window.isOwner = playerInfo.isOwner;

        window.multiDeviceIntegration.enhanceContinueButton();

        console.log('🔍 userName, isOwner:', uniquePlayerName, isOwner);

        // Clear previous round's game data
        if (window.isOwner && window.multiDeviceIntegration) {
            const tableId = currentTable.tableId;
            await firebase.firestore().collection('tables').doc(tableId.toString()).update({
                'currentGame': firebase.firestore.FieldValue.delete()
            });
        }

        // Add player to Firebase table
        window.multiDeviceIntegration.addPlayerToTable(table.tableId, playerInfo)  // Changed
            .then(async () => {
                // Set up listeners
                window.multiDeviceIntegration.setupPlayerListListener(table.tableId, updatePlayerListUI);  // Changed
                window.multiDeviceIntegration.setupScoreListener();

                console.log('🔍 tableSettings.tableId after join:', tableSettings.tableId);

                window.multiDeviceIntegration.setupTableStateListener(table.tableId, handleTableStateChange);  // Changed

                setupLobbyStateListener(table.tableId);  // Changed

                // If owner and enough players, set lobby to ready
                if (playerInfo.isOwner) {
                    const playersSnapshot = await firebase.database().ref(`tables/${table.tableId}/players`).once('value');  // Changed
                    const players = playersSnapshot.val() || {};
                    const currentPlayerCount = Object.keys(players).length;

                    if (currentPlayerCount >= 2) {
                        await firebase.database().ref(`tables/${table.tableId}/state/LOBBY_STATE`).set('ready');  // Changed
                        console.log('🏛️ Owner set lobby state to ready');
                    }
                }
            })
            .catch(error => {
                console.error('❌ Error adding player:', error);
            });

        // Set up listener to detect if table gets deleted
        firebase.database().ref(`tables/${table.tableId}`).on('value', (snapshot) => {  // Changed
            if (!snapshot.exists() && currentTable && currentTable.tableId === table.tableId) {  // Changed
                console.log('🚨 Table deleted by owner, returning to lobby');
                currentTable = null;
                showLobbyScreen();

                firebase.database().ref(`tables/${table.tableId}`).off('value');  // Changed
            }
        });

        // Show the multi-human player section
        const playerSection = document.getElementById('multiHumanPlayers');
        if (playerSection) {
            playerSection.style.display = 'block';
        }

    } else {
        // Hide multi-human section
        const playerSection = document.getElementById('multiHumanPlayers');
        if (playerSection) {
            playerSection.style.display = 'none';
        }
    }
}

// Create new table
function createNewTable() {
    currentTable = {
        ...tableSettings,           // Changed: spread all fields
        tableId: Date.now(),        // Changed: id → tableId
        tableName: 'Custom Table',  // Changed: name → tableName
        icon: tableSettings.gameMode === 'online' ? '☁️' : '📱'
    };

    if (typeof openGameConfig === 'function') {
        openGameConfig();
    } else {
        console.warn('openGameConfig function not found');
    }
}

// Update table display
function updateTableDisplay() {
    if (!currentTable) return;

    document.getElementById('tableTitle').textContent = `🪑 Sitting at ${currentTable.tableName}`;  // Changed

    const modeText = currentTable.gameMode === 'online' ? 'Online (Cloud Sync)' : 'Offline (Local Device)';  // Changed: use currentTable
    const settingsHtml = `
        Mode: ${modeText}<br>
        AI Players: ${currentTable.computerPlayers}<br>
        Rounds: ${currentTable.rounds}<br>
        Wild Cards: ${currentTable.wildCardCount}<br>
        AI Method: ${currentTable.winProbabilityMethod}
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

// Leave table v2
async function leaveTable() {
    console.log('🚪 Leave table clicked');

    if (!currentTable) {
        console.log('❌ Not currently in a table');
        return;
    }

    try {
        const tableId = currentTable.tableId;
        console.log('🔍 Leaving table:', tableId);

        const currentUser = window.firebaseAuth.currentUser;
        if (!currentUser) {
            console.log('❌ No user logged in');
            return;
        }

        // Check if leaving player is the owner
        const stateSnapshot = await firebase.database().ref(`tables/${tableId}/state`).once('value');
        const state = stateSnapshot.val() || {};
        const isOwner = state.TABLE_OWNER === currentUser.email;

        if (isOwner) {
            console.log('🗑️ Player is owner, removing entire table...');
            await firebase.database().ref(`tables/${tableId}`).remove();
            console.log('✅ Table deleted');
        } else {
            // Non-owner leaving - just remove the player
            const playersSnapshot = await firebase.database().ref(`tables/${tableId}/players`).once('value');
            const players = playersSnapshot.val() || {};

            let playerKeyToRemove = null;
            for (const [playerKey, playerData] of Object.entries(players)) {
                if (playerData.name === currentUser.email) {
                    playerKeyToRemove = playerKey;
                    break;
                }
            }

            if (playerKeyToRemove) {
                await firebase.database().ref(`tables/${tableId}/players/${playerKeyToRemove}`).remove();
                console.log('✅ Removed player:', playerKeyToRemove);

                // Update both player count locations
                await firebase.database().ref(`tables/${tableId}/settings/humanPlayers`)
                    .transaction((current) => Math.max(0, (current || 1) - 1));
                await firebase.database().ref(`tables/${tableId}/state/num_human_players`)
                    .transaction((current) => Math.max(0, (current || 1) - 1));
                console.log('✅ Decremented human player count');
            }
        }

        // Clear local state
        currentTable = null;
        showLobbyScreen();
        console.log('🎉 Successfully left table');

    } catch (error) {
        console.error('❌ Error leaving table:', error);
    }
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
//    console.log('🖥️ Updating player list UI:', players);

    // NEW: Sync Firebase players to local PlayerManager
    if (window.game?.playerManager) {
        window.game.playerManager.players = players.map(firebasePlayer => ({
            name: firebasePlayer.name,
            id: firebasePlayer.id,
            isAI: false
        }));
//        console.log(`✅ Synced ${window.game.playerManager.players.length} Firebase players to PlayerManager`);
    }

    // DEBUG: Find the player manager object (remove after testing)
//    console.log('🔍 window.playerManager:', window.playerManager);
//    console.log('🔍 window.game:', window.game);
//    console.log('🔍 window.game?.playerManager:', window.game?.playerManager);

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
//        console.log(`🔍 Player ${index}:`, player);
//        console.log(`🔍 Player ${index} name:`, player.name);
//        console.log(`🔍 Player ${index} type:`, typeof player.name);
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
//    console.log('🔧 Found player slots:', playerSlots.length);

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

//    console.log('✅ Updated all player slots');

    // Update the player count display
//    const playerCountElement = document.getElementById('currentPlayerCount');
    if (playerCountElement) {
        playerCountElement.textContent = players.length;
    }

    // Update start game button
    updateStartGameButton(players.length);

//    console.log('Updated all player slots');

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
