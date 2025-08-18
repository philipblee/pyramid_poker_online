// js/ui/lobby.js
// Pyramid Poker Lobby System

// Game state
let currentTable = null;
let tableSettings = {
    gameMode: 'offline',
    aiPlayers: 4,
    totalRounds: 3,
    wildCards: 2
};

// Default tables available in lobby
const defaultTables = [
    {
        id: 1,
        name: 'Quick Play',
        settings: { gameMode: 'offline', aiPlayers: 4, totalRounds: 3, wildCards: 2 },
        icon: '📱'
    },
    {
        id: 2,
        name: 'Practice Table',
        settings: { gameMode: 'offline', aiPlayers: 2, totalRounds: 5, wildCards: 1 },
        icon: '📱'
    },
    {
        id: 3,
        name: 'Cloud Ranked',
        settings: { gameMode: 'online', aiPlayers: 5, totalRounds: 3, wildCards: 2 },
        icon: '☁️'
    },
    {
        id: 4,
        name: 'Challenge Mode',
        settings: { gameMode: 'offline', aiPlayers: 5, totalRounds: 10, wildCards: 0 },
        icon: '📱'
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
            Rounds: ${settings.totalRounds}<br>
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

// Update table display
function updateTableDisplay() {
    if (!currentTable) return;

    document.getElementById('tableTitle').textContent = `🪑 Sitting at ${currentTable.name}`;

    const modeText = tableSettings.gameMode === 'online' ? 'Online (Cloud Sync)' : 'Offline (Local Device)';
    const settingsHtml = `
        Mode: ${modeText}<br>
        AI Players: ${tableSettings.aiPlayers}<br>
        Total Rounds: ${tableSettings.totalRounds}<br>
        Wild Cards: ${tableSettings.wildCards}
    `;

    document.getElementById('settingsDisplay').innerHTML = settingsHtml;
}

// Edit settings (use your existing modal)
function editSettings() {
    // Call your existing game config function
    if (typeof openGameConfig === 'function') {
        openGameConfig();
    } else {
        console.warn('openGameConfig function not found');
    }
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

    console.log('Starting game with settings:', tableSettings);

    // If online mode, call your existing cloudNewGame() function
    if (tableSettings.gameMode === 'online') {
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
        // For offline mode, directly launch game
        launchGameInterface();
    }
}

// Launch your existing game interface
function launchGameInterface() {
    // Hide lobby, show your existing game interface
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('tableScreen').style.display = 'none';

    // Show your existing game area
    const gameArea = document.getElementById('gameArea');
    if (gameArea) {
        gameArea.style.display = 'block';
    }

    // Call your existing startNewGame function
    if (typeof startNewGame === 'function') {
        startNewGame();
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

// Export functions for integration
window.PyramidPokerLobby = {
    initializeLobby,
    showLobbyScreen,
    showTableScreen,
    onSettingsSaved,
    returnToTable,
    getCurrentTableSettings: () => tableSettings
};