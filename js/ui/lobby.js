// lobby.js

// In lobby.js, update the tableSettings object (around line 4):

let tableSettings = {
    gameConnectMode: 'offline',
    gameDeviceMode: 'single-device',
    gameMode: 'single-human',
    gameVariant: 'no-surrender',
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
    // stakes:
    stakes: 'yes',                   // 'yes', 'no'
    stakesAnteAmount: 10,           // 0, 10, 20, etc.
    stakesMultiplierAmount: 2,      // 0, 1, 2, 3, etc.
    stakesSurrenderAmount: 10,      // 10, 20, etc.
    automaticsAllowed: 'yes',        // NEW
    autoArrangeAllowed: 'yes',       // NEW
    // countdown:
    countdownTime: 5,              // 10, 20, 30, etc.
    tableId: null,                   // For multiplayer table identification
    tableName: ''                   // Display name for table
};

// Update defaultTables array to use new structure:
const defaultTables = [
    {
        id: 1,
        name: '1. SINGLE PLAYER - NO SURRENDER',
        settings: {
                    ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    gameVariant: 'no-surrender',
                    computerPlayers: 1,
                    rounds: 3,
                    wildCardCount: 2,
                    winProbabilityMethod: 'netEV' },
        icon: '🏓'
    },

    {
        id: 2,
        name: '2. SINGLE PLAYER - NO SURRENDER',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    gameVariant: 'kitty',
                    computerPlayers: 2,
                    rounds: 3,
                    wildCardCount: 1,
                    winProbabilityMethod: 'netEV' },
        icon: '🏓'
    },

    {
        id: 3,
        name: '3. SINGLE PLAYER - NO SURRENDER',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    computerPlayers: 5,
                    rounds: 5,
                    wildCardCount: 2,
                    winProbabilityMethod: 'tiered2' },
        icon: '🏓'
    },

    {
        id: 4,
        name: '4. SINGLE PLAYER - NO SURRENDER',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    computerPlayers: 5,
                    rounds: 5,
                    wildCardCount: 2,
                    winProbabilityMethod: 'tiered2' },
        icon: '🏓'
    },

    {
        id: 5,
        name: '5. SINGLE PLAYER - NO SURRENDER',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameDeviceMode: 'single-device',
                    gameConnectMode: 'offline',
                    computerPlayers: 5,
                    rounds: 5,
                    wildCardCount: 2,
                    winProbabilityMethod: 'tiered2' },
        icon: '🏓'
    },

    {
        id: 6,
        name: '6. SINGLE PLAYER - NO SURRENDER',
        settings: {

                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    computerPlayers: 2,
                    rounds: 3,
                    wildCardCount: 2,
                    winProbabilityMethod: 'netEV' },
        icon: '☁️'
    },

    {
        id: 7,
        name: '7. MULTIPLAYER - NO SURRENDER',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'multiple-humans',
                    gameConnectMode: 'online',
                    gameDeviceMode: 'multi-device',
                    gameVariant: 'no-surrender',
                    computerPlayers: 0,
                    rounds: 3,
                    wildCardCount: 2,
                    maxPlayers: 6,
                    winProbabilityMethod: 'netEV' },
        icon: '☁️'
    },

    {
        id: 8,
        name: '8. MULTIPLAYER - 4-CARD KITTY',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'multiple-humans',
                    gameConnectMode: 'online',
                    gameDeviceMode: 'multi-device',
                    gameVariant: 'kitty',
                    computerPlayers: 0,
                    rounds: 3,
                    wildCardCount: 2,
                    maxPlayers: 6,
                    winProbabilityMethod: 'netEV' },
        icon: '☁️'
    },

    {
        id: 9,
        name: '9. MULTIPLAYER - NO SURRENDER',
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
async function initializeLobby(userName) {
    document.getElementById('currentUser').textContent = userName;

    // Load and display chip data
    await updateChipDisplay();

    populateLobby();
    showLobbyScreen();
}

// NEW FUNCTION: Load and display chip data
async function updateChipDisplay() {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;

    const encodedEmail = currentUser.email.replace(/\./g, ',').replace('@', '_at_');
    const playerRef = firebase.database().ref(`players/${encodedEmail}`);

    try {
        const snapshot = await playerRef.once('value');
        const data = snapshot.val() || {};
        const chips = data.chips || 0;
        const reloads = data.reloads || 0;

        // Update the user-info display
        const userInfoDiv = document.querySelector('.user-info');
        if (userInfoDiv) {
            userInfoDiv.innerHTML = `
                👤 ${currentUser.email} |
                💰 ${chips.toLocaleString()} chips |
                🔄 ${reloads} reloads
            `;
        }

        console.log('💰 Chip display updated:', { chips, reloads });
    } catch (error) {
        console.error('❌ Failed to load chip data:', error);
    }
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
    updateGameChipDisplays();
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

    const settings = table.settings;
    const currentPlayers = settings.humanPlayers || 0;
    const maxPlayers = settings.maxHumanPlayers || 1;
    const isFull = currentPlayers >= maxPlayers;

    // Set onclick only if table isn't full
    if (!isFull) {
        card.onclick = () => joinTable(table);
    } else {
        card.classList.add('table-full');
        card.style.cursor = 'not-allowed';
    }

    const gameConnectModeText = settings.gameConnectMode === 'online' ? 'Online' : 'Offline';
    const gameModeText = settings.gameMode === 'single-human' ? 'SINGLE PLAYER' : 'MULTIPLAYER';
    const gameVariantText = settings.gameVariant === 'no-surrender' ? 'NO SURRENDER' : '4-CARD KITTY';


    card.innerHTML = `
        <div class="table-header">
            <div class="table-name">${table.name}</div>
            <div class="table-icon">${table.icon}</div>
        </div>
        <div class="table-settings">
            Rounds: ${settings.rounds}<br>
            Wild Cards: ${settings.wildCardCount}<br>
            Stakes Ante: ${settings.stakesAnteAmount}<br>
            Stakes Surrender: ${settings.stakesSurrenderAmount}<br>
            Stakes Multiplier: ${settings.stakesMultiplierAmount}x<br>
            AI Players: ${settings.computerPlayers}<br>
            AI Algorithm: ${settings.winProbabilityMethod}<br>
            Automatics Allowed: ${settings.automaticsAllowed || 'yes'}<br>
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
    console.log('🔍 joinTable called for:', table.name);

    // Initialize window.game if needed and set tableId for ALL modes
    window.game = window.game || {};
    window.game.currentTableId = table.id;

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

        if (currentHumanPlayers >= maxHumanPlayers) {
            alert(`Table "${table.name}" is full (${currentHumanPlayers}/${maxHumanPlayers} players)`);
            console.log('❌ JOIN BLOCKED - table actually full');
            return;
        }

//        console.log('✅ JOIN ALLOWED - proceeding with fresh data');


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

//        console.log('🌐 Joining multi-human table:', table.name);

        // Initialize MultiDeviceIntegration if not already done
        if (!window.multiDeviceIntegration) {
//            console.log('🔧 Initializing MultiDeviceIntegration...');
            window.multiDeviceIntegration = new MultiDeviceIntegration(table.id, {
                tablesRef: firebase.firestore().collection('tables')
            });
        }

        // ADD back:
        window.multiDeviceIntegration.currentTableId = table.id;
        window.multiDeviceIntegration.setupMultiDeviceEnhancements();

        // In joinTable()
        const currentUser = firebase.auth().currentUser;
        let uniquePlayerName = currentUser ? currentUser.email : 'Guest Player';

        if (currentUser && currentUser.email && window.game?.playerManager) {
//            console.log('🔧 Log in joinTable - Generating unique player name...');
            uniquePlayerName = await window.game.playerManager.generateUniquePlayerName(currentUser.email, table.id);
//            console.log('🔧 Log in joinTable - Generated uniquePlayerName:', uniquePlayerName);
            // Add this line:
            window.uniquePlayerName = uniquePlayerName;
            console.log('🔧 Log in joinTable - Set window.uniquePlayerName to:', window.uniquePlayerName);
        }

        // this  is needed.  isOwner is false for owner without it
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

        // In your joinTable function, after table selection
        console.log('🔍 Selected table from menu - id:', table.id);
        console.log('🔍 Selected table name:', table.name);
        console.log('🔍 tableSettings.tableId before join:', tableSettings.tableId);

        window.isOwner = playerInfo.isOwner;

        window.multiDeviceIntegration.enhanceContinueButton();

        console.log('🔍 userName, isOwner:', uniquePlayerName, isOwner);

        // Clear previous round's game data from Firestore
        if (window.isOwner && window.multiDeviceIntegration) {
            const tableId = window.multiDeviceIntegration.tableId;
            const docRef = firebase.firestore().collection('tables').doc(tableId.toString());
            const docSnapshot = await docRef.get();

            if (docSnapshot.exists) {
                await docRef.update({
                    'currentGame': firebase.firestore.FieldValue.delete()
                });
            } else {
                // Create the table document
                await docRef.set({
                    id: tableId,
                    name: table.name,
                    settings: table.settings
                });
            }
        }

        // Add player to Firebase table (using .then() instead of await)
        window.multiDeviceIntegration.addPlayerToTable(table.id, playerInfo)
            // After the .then() in joinTable()
            .then(async () => {
//                console.log('✅ Player added successfully');

                // Set up listener for real-time updates
                window.multiDeviceIntegration.setupPlayerListListener(table.id, updatePlayerListUI);
                window.multiDeviceIntegration.setupScoreListener(); // Add this line

                // Then after joining
                console.log('🔍 tableSettings.tableId after join:', tableSettings.tableId);

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

        // Set up listener to detect if table gets deleted while we're in it
        firebase.database().ref(`tables/${table.id}`).on('value', (snapshot) => {
            if (!snapshot.exists() && currentTable && currentTable.id === table.id) {
                // Table was deleted while we were in it
                console.log('🚨 Table deleted by owner, returning to lobby');

                // Clean up Firebase listeners
                if (window.multiDeviceIntegration) {
                    window.multiDeviceIntegration.cleanup();
                }

                currentTable = null;
                showLobbyScreen();

                // Clean up this listener since table no longer exists
                firebase.database().ref(`tables/${table.id}`).off('value');
            }
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

    // This is where the Current Table Settings are displayed
//    const modeText = tableSettings.gameConnectMode === 'online' ? 'Online' : 'Offline';
    const humanPlayers = tableSettings.humanPlayers + 1
    const settingsHtml = `

        Connect: ${tableSettings.gameConnectMode}<br>
        Device: ${tableSettings.gameDeviceMode}<br>
        Humans: ${tableSettings.gameMode}<br>
        AI Players: ${tableSettings.computerPlayers}<br>
        Tournament Rounds: ${tableSettings.rounds}<br>
        Decks: ${tableSettings.deckCount}<br>
        Wild Cards: ${tableSettings.wildCardCount}<br>
        Countdown Time: ${tableSettings.countdownTime}<br>
        Stakes Ante: ${tableSettings.stakesAnteAmount}<br>
        Stakes SurrenderAmount: ${tableSettings.stakesSurrenderAmount}<br>
        Stakes Multiplier: ${tableSettings.stakesMultiplierAmount}<br>
        Game Variation: ${tableSettings.gameVariant}<br>
        AI Method: ${tableSettings.winProbabilityMethod}
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
async function leaveTable() {
    console.log('🚪 Leave table clicked');

    if (!currentTable) {
        console.log('❌ Not currently in a table');
        return;
    }

    try {
        const tableId = currentTable.id;
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

        // Clean up Firebase listeners
                if (window.multiDeviceIntegration) {
                    window.multiDeviceIntegration.cleanup();
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

// Create table settings modal HTML (replace this function)
function createTableSettingsModal() {
    const modal = document.createElement('div');
    modal.id = 'tableSettingsModal';
    modal.className = 'scoring-popup';

    modal.innerHTML = `
        <div class="scoring-content">
            <button class="close-popup" onclick="closeTableSettings()">&times;</button>
            <h2 style="text-align: center; margin-bottom: 30px; color: #ffd700;">⚙️ Table Settings</h2>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">Rounds (1-5):</label>
                <input type="number" id="tableRounds" min="1" max="5" value="3"
                       style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid #ffd700; border-radius: 5px;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">Wild Cards (0-2):</label>
                <input type="number" id="tableWildCardCounts" min="0" max="2" value="2"
                       style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid #ffd700; border-radius: 5px;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">Stakes Ante:</label>
                <input type="number" id="stakesAnteAmount" min="0" max="100" step="10" value="10"
                       style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid #ffd700; border-radius: 5px;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">Stakes Surrender:</label>
                <input type="number" id="stakesSurrenderAmount" min="0" max="100" step="10" value="10"
                       style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid #ffd700; border-radius: 5px;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">Stakes Multiplier (1x-5x):</label>
                <input type="number" id="stakesMultiplierAmount" min="1" max="5" value="2"
                       style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid #ffd700; border-radius: 5px;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">AI Players (0-5):</label>
                <input type="number" id="tableComputerPlayers" min="0" max="5" value="1"
                       style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid #ffd700; border-radius: 5px;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">AI Algorithm:</label>
                <select id="winProbabilityMethod" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid #ffd700; border-radius: 5px;">
                    <option value="points">Points</option>
                    <option value="tiered">Tiered</option>
                    <option value="tiered2">Tiered2</option>
                    <option value="netEV">NetEV</option>
                </select>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="color: #ffd700; display: block; margin-bottom: 8px;">Automatics Allowed:</label>
                <select id="automaticsAllowed" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid #ffd700; border-radius: 5px;">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <button class="btn btn-secondary" onclick="closeTableSettings()" style="margin-right: 15px;">Cancel</button>
                <button class="btn btn-primary" onclick="saveTableSettings()">Save Settings</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Close table settings modal
function closeTableSettings() {
    document.getElementById('tableSettingsModal').style.display = 'none';
}

// Update display functions for sliders
function updateRoundsDisplay(value) {
    document.getElementById('rounds').textContent = value;
}

// Open table settings modal
function openTableSettings() {
    // Force recreate modal every time
    const existingModal = document.getElementById('tableSettingsModal');
    if (existingModal) {
        existingModal.remove();
    }
    createTableSettingsModal();

    // Populate current settings (all 8)
    document.getElementById('tableRounds').value = tableSettings.rounds || 3;
    document.getElementById('tableWildCardCounts').value = tableSettings.wildCardCount || 2;
    document.getElementById('stakesAnteAmount').value = tableSettings.stakesAnteAmount || 10;
    document.getElementById('stakesSurrenderAmount').value = tableSettings.stakesSurrenderAmount || 10;
    document.getElementById('stakesMultiplierAmount').value = tableSettings.stakesMultiplierAmount || 2;
    document.getElementById('tableComputerPlayers').value = tableSettings.computerPlayers || 1;
    document.getElementById('winProbabilityMethod').value = tableSettings.winProbabilityMethod || 'netEV';
    document.getElementById('automaticsAllowed').value = tableSettings.automaticsAllowed || 'yes';

    // Show modal
    document.getElementById('tableSettingsModal').style.display = 'block';
}

// Save table settings
function saveTableSettings() {
    // Save all 8 settings
    tableSettings.rounds = parseInt(document.getElementById('tableRounds').value);
    tableSettings.wildCardCount = parseInt(document.getElementById('tableWildCardCounts').value);
    tableSettings.stakesAnteAmount = parseInt(document.getElementById('stakesAnteAmount').value);
    tableSettings.stakesSurrenderAmount = parseInt(document.getElementById('stakesSurrenderAmount').value);
    tableSettings.stakesMultiplierAmount = parseInt(document.getElementById('stakesMultiplierAmount').value);
    tableSettings.computerPlayers = parseInt(document.getElementById('tableComputerPlayers').value);
    tableSettings.winProbabilityMethod = document.getElementById('winProbabilityMethod').value;
    tableSettings.automaticsAllowed = document.getElementById('automaticsAllowed').value;

    // Sync to gameConfig immediately
    if (window.gameConfig) {
        window.gameConfig.config.rounds = tableSettings.rounds;
        window.gameConfig.config.wildCardCount = tableSettings.wildCardCount;
        window.gameConfig.config.stakesAnteAmount = tableSettings.stakesAnteAmount;
        window.gameConfig.config.stakesSurrenderAmount = tableSettings.stakesSurrenderAmount;
        window.gameConfig.config.stakesMultiplierAmount = tableSettings.stakesMultiplierAmount;
        window.gameConfig.config.computerPlayers = tableSettings.computerPlayers;
        window.gameConfig.config.winProbabilityMethod = tableSettings.winProbabilityMethod;
        window.gameConfig.config.automaticsAllowed = tableSettings.automaticsAllowed;
        console.log('✅ Synced all settings to gameConfig');
    }

    // Update the display
    updateTableDisplay();

    // Close modal
    closeTableSettings();
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

    // 🔧 FIX: Sync to gameConfig immediately
    if (window.gameConfig) {
        window.gameConfig.config.rounds = tableSettings.rounds;
        window.gameConfig.config.winProbabilityMethod = tableSettings.winProbabilityMethod;
        window.gameConfig.config.wildCardCount = tableSettings.wildCardCount;
        window.gameConfig.config.computerPlayers = tableSettings.computerPlayers;
        console.log('✅ Synced rounds to gameConfig:', tableSettings.rounds);
    }

    if (currentTable) {
        currentTable.settings = { ...tableSettings };
    }

    updateTableDisplay();
    closeTableSettings();
    console.log('✅ Table settings saved:', tableSettings);
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

// DEBUG: Clear stuck tables
async function clearTable(tableId) {
    console.log(`🗑️ Clearing table ${tableId}...`);

    try {
        // Remove from Realtime Database
        await firebase.database().ref(`tables/${tableId}`).remove();
        console.log(`✅ Realtime DB table ${tableId} cleared`);

        // Remove from Firestore (if exists)
        try {
            await firebase.firestore().collection('tables').doc(String(tableId)).delete();
            console.log(`✅ Firestore table ${tableId} cleared`);
        } catch (firestoreError) {
            // Table might not exist in Firestore, that's okay
            console.log(`ℹ️ Firestore table ${tableId} not found (okay)`);
        }

//        alert(`✅ Table ${tableId} cleared successfully`);

    } catch (error) {
        console.error(`❌ Error clearing table ${tableId}:`, error);
        alert(`❌ Error clearing table: ${error.message}`);
    }
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
