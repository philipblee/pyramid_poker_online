// js/multiplayer/game-launcher.js
// FIXED: Table 6 single-player vs AI freeze issue

// Start game
function startGame() {
    if (!currentTable) return;

    // Apply settings to gameConfig
    if (window.gameConfig) {
        Object.assign(window.gameConfig.config, tableSettings);
        window.gameConfig.saveToStorage();
    }

    // Route to appropriate game mode
    if (window.gameConfig.config.gameMode === 'single-human') {
        startSingleHumanGame();
    } else if (window.gameConfig.config.gameMode === 'multiple-humans' && window.gameConfig.config.gameConnectMode === 'online') {
        startMultiHumanCloudGame();
    } else if (window.gameConfig.config.gameMode === 'multiple-humans' && window.gameConfig.config.gameConnectMode === 'offline') {
        startMultiHumanOfflineGame();
    }
}

// FIXED: Table 6 now starts immediately without MultiDeviceIntegration
async function startSingleHumanGame() {
    window.isOwner = true;

    // Optional Firebase sync for online mode
    if (tableSettings.gameConnectMode === 'online' && typeof window.createSimpleFirebaseSync === 'function') {
        window.table6FirebaseSync = window.createSimpleFirebaseSync(currentTable.id);
    }

    launchGameInterface();
}

function startMultiHumanCloudGame() {
//    console.log('🚀 Starting multi-human cloud game for table:', currentTable.id);

    // Write to tableState to match your listener
    firebase.database().ref(`tables/${currentTable.id}`).update({
        tableState: TABLE_STATES.NEW_TOURNAMENT,  // Changed from DEALING
        gameStarted: Date.now(),
        currentRound: 1
    }).then(() => {
        console.log('✅ Table state set to NEW_TOURNAMENT - all players should be notified');
    });
}


// Launch your existing game interface
async function launchGameInterface() {
//    console.log('🎮 Launching game interface with table settings:', tableSettings);
    updateGameChipDisplays();  // ADD THIS LINE
    // Hide lobby, show your existing game interface
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('tableScreen').style.display = 'none';

    // Apply table settings to gameConfig (the one that actually exists)
    gameConfig.config.gameConnectMode = tableSettings.gameConnectMode;
    gameConfig.config.gameDeviceMode = tableSettings.gameDeviceMode;
    gameConfig.config.gameVariant = tableSettings.gameVariant;
    gameConfig.config.computerPlayers = tableSettings.computerPlayers;
    gameConfig.config.wildCardCount = tableSettings.wildCardCount;
    gameConfig.config.deckCount = tableSettings.deckCount;
    gameConfig.config.winProbabilityMethod = tableSettings.winProbabilityMethod;
    gameConfig.config.rounds = tableSettings.rounds;
    gameConfig.config.gameMode = tableSettings.gameMode;

    // Use resetPlayers() to clear old players and create new ones with correct config
    // DON'T reset players for multi-human games - we already set them up manually
    if (window.game && window.game.playerManager && gameConfig.config.gameMode !== 'multiple-humans') {
        await window.game.playerManager.resetPlayers();
    }

//    console.log('🎮 Settings used for launching game:', gameConfig.config);

    // Show your existing game area
    const gameArea = document.getElementById('gameArea');
    if (gameArea) {
        gameArea.style.display = 'block';
    }

    // Start the game
    window.game.startNewGame();
}
