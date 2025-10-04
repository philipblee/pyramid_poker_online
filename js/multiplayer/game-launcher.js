// Start game
function startGame() {
    if (!currentTable) return;

//    console.log('🔥 STARTGAME FUNCTION CALLED!'); // ← Add this
//    console.log('🎮 Starting game with table settings:', tableSettings);

    // STEP 1: Update the CORRECT gameConfig object
    if (window.gameConfig) {
        Object.assign(window.gameConfig.config, tableSettings);
        window.gameConfig.saveToStorage();
//        console.log('✅ Applied settings to window.gameConfig:', window.gameConfig.config);
    } else {
        console.error('❌ window.gameConfig not found!');
    }

    // STEP 2: Enhanced branching based on game mode AND connect mode
    if (window.gameConfig.config.gameMode === 'single-human' && window.gameConfig.config.gameConnectMode === 'offline') {
//        console.log('🔥 CALLING startSingleHumanGame()!');
        startSingleHumanGame();

    } else if (window.gameConfig.config.gameMode === 'single-human' && window.gameConfig.config.gameConnectMode === 'online') {
//        console.log('🔥 CALLING startsingleHumanGame()!');
        startMultiHumanCloudGame();

    } else if (window.gameConfig.config.gameMode === 'multiple-humans' && window.gameConfig.config.gameConnectMode === 'online') {
//        console.log('🔥 CALLING startMultiHumanCloudGame()!');
        startMultiHumanCloudGame();
    } else if (window.gameConfig.config.gameMode === 'multiple-humans' && window.gameConfig.config.gameConnectMode === 'offline') {
//        console.log('🔥 CALLING startMultiHumanOfflineGame()!');
        startMultiHumanOfflineGame();
    } else {
        console.log('❌ No matching game mode found');
    }
}

async function startSingleHumanGame() {

    console.log('🔥 startSingleHumanGame() CALLED!'); // ← Add this

    if (tableSettings.gameConnectMode === 'online') {
        // Create tableManager and initialize
        const tableManager = {
            tablesRef: firebase.firestore().collection('tables'),
            currentTable: currentTable.tableId,
            currentUser: { id: 'player-1' }
        };

        console.log('🎮 Starting single-human online game');

        window.multiDevice = new MultiDeviceIntegration();
        await window.multiDevice.initialize(tableManager);
        window.game.startNewGame();

        // ✅ Clean Firebase coordination using multiDevice methods:
        await window.multiDevice.syncHandsToFirebase();
        await window.multiDevice.retrieveAllHandsFromFirebase();

        console.log('✅ Single-human game synced and retrieved from Firebase');

        // ✅ MISSING: Continue with normal game flow
        window.game.loadCurrentPlayerHand(); // Load human player's cards into UI
        // Or call whatever function starts the card arrangement phase
        launchGameInterface();

    } else {
        launchGameInterface();
    }
}

function startMultiHumanCloudGame() {
    console.log('🚀 Starting multi-human cloud game for table:', currentTable.tableId);

    // Write to tableState to match your listener
    firebase.database().ref(`tables/${currentTable.tableId}`).update({
        tableState: TABLE_STATES.NEW_TOURNAMENT,  // Changed from DEALING
        gameStarted: Date.now(),
        currentRound: 1
    }).then(() => {
        console.log('✅ Table state set to NEW_TOURNAMENT - all players should be notified');

        // Remove the tournament initialization code from here
        // It will now be handled by the NEW_TOURNAMENT state case

        setupMultiDeviceMultiHuman().then(() => {
            launchGameInterface();
        });
    });
}

// multiple humans, multiple devices
async function setupMultiDeviceMultiHuman() {
    console.log('🌐 Setting up multi-device multi-human mode');

    // Get the current user info
    const currentUser = firebase.auth().currentUser;
    const userName = currentUser ?
        currentUser.displayName || currentUser.email || 'Anonymous Player' :
        'Guest Player';

//    console.log('🎮 Setting up local player:', userName);

    // Only reset players in single-device mode
    if (window.gameConfig.config.gameDeviceMode === 'single-device') {
        window.game.playerManager.resetPlayers();
        window.game.playerManager.addPlayer(userName, true);
    } else {
//        console.log('🌐 Multi-device mode: players already synced from Firebase');
    }

    return Promise.resolve();
}

async function setupMultiHumanPlayers() {
//    console.log('🌐 Setting up players for multi-device mode...');

    // Get current user info to identify THIS player
    const currentUser = firebase.auth().currentUser;
    const currentUserName = currentUser ?
        currentUser.displayName || currentUser.email || 'Anonymous Player' :
        'Guest Player';

    console.log('🎮 Current user:', currentUserName);

    if (window.game && window.game.playerManager) {
        // Clear any existing players
        window.game.playerManager.resetPlayers();

        // Add ONLY the current player to this device
        // Other devices will manage their own players
        window.game.playerManager.addPlayer(currentUserName, true); // true = isHuman

        console.log(`✅ Added current player "${currentUserName}" to this device`);
        console.log('🌐 Other players will be managed by their own devices via Firebase');

        // Get total player count for game setup
        const playersSnapshot = await firebase.database().ref(`tables/${currentTable.tableId}/players`).once('value');
        const playersData = playersSnapshot.val() || {};
        const totalPlayers = Object.keys(playersData).length;

        console.log(`📊 Total players in game: ${totalPlayers}`);
        console.log(`🖥️ This device manages: 1 player (${currentUserName})`);

        // Update game config to reflect multi-device setup
        gameConfig.config.computerPlayers = 0; // No AI needed
        gameConfig.config.totalPlayers = totalPlayers; // For reference
    }
}

// Launch your existing game interface
function launchGameInterface() {
//    console.log('🎮 Launching game interface with tablesettings:', tableSettings);

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
        window.game.playerManager.resetPlayers();
    }

//    console.log('🎮 Settings used for launching game:', gameConfig.config);

    // Show your existing game area
    const gameArea = document.getElementById('gameArea');
    if (gameArea) {
        gameArea.style.display = 'block';
    }

    // Call your existing startNewGame function
    if (typeof startNewGame === 'function') {
        startNewGame();
    } else if (window.game && typeof window.game.startNewGame === 'function') {
        window.game.startNewGame();
    } else {
        console.warn('No startNewGame function found');
    }
}
