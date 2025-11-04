// js/multiplayer/game-launcher.js
// FIXED: Table 6 single-player vs AI freeze issue

// Start game
function startGame() {
    if (!currentTable) return;

    console.log('🔥 STARTGAME FUNCTION CALLED!');
    console.log('🎮 Starting game with table settings:', tableSettings);

    // STEP 1: Update the CORRECT gameConfig object
    if (window.gameConfig) {
        Object.assign(window.gameConfig.config, tableSettings);
        window.gameConfig.saveToStorage();
        console.log('✅ Applied settings to window.gameConfig:', window.gameConfig.config);
    } else {
        console.error('❌ window.gameConfig not found!');
    }

    // STEP 2: Enhanced branching based on game mode AND connect mode
    // tables 1-5
    if (window.gameConfig.config.gameMode === 'single-human' && window.gameConfig.config.gameConnectMode === 'offline') {
        console.log('🔥 CALLING startSingleHumanGame()!');
        startSingleHumanGame();

    // table 6 - FIXED: Now treated as single-player vs AI
    } else if (window.gameConfig.config.gameMode === 'single-human' && window.gameConfig.config.gameConnectMode === 'online') {
        console.log('🔥 CALLING startSingleHumanGame() - Table 6 single-player vs AI!');
        startSingleHumanGame();

    // tables 7-9
    } else if (window.gameConfig.config.gameMode === 'multiple-humans' && window.gameConfig.config.gameConnectMode === 'online') {
        console.log('🔥 CALLING startMultiHumanCloudGame()!');
        startMultiHumanCloudGame();

    // single-device multi-human - pass device around human users
    } else if (window.gameConfig.config.gameMode === 'multiple-humans' && window.gameConfig.config.gameConnectMode === 'offline') {
        console.log('🔥 CALLING startMultiHumanOfflineGame()!');
        startMultiHumanOfflineGame();
    } else {
        console.log('❌ No matching game mode found');
    }
}

// FIXED: Table 6 now starts immediately without MultiDeviceIntegration
async function startSingleHumanGame() {

    console.log('🔥 startSingleHumanGame() CALLED!');

    if (tableSettings.gameConnectMode === 'online') {
        // 🎯 FIX: Table 6 is single-player vs AI, NOT multi-player
        // Don't use MultiDeviceIntegration - just start immediately like Tables 1-5
        console.log('🎮 Table 6: Single-player vs AI - starting immediately');
        console.log('📝 Note: MultiDeviceIntegration bypassed - no waiting for other players');

        // 🏆 FIX: Set ownership for single-player (fixes "Waiting for table owner" issue)
        window.isOwner = true;
        console.log('✅ Set window.isOwner = true for single-player Table 6');

        // Start game immediately without waiting for other players
        launchGameInterface();

        // TODO: Add simple Firebase storage for game persistence later (optional)
        // But don't use MultiDeviceIntegration which expects multiple players

    } else {
        // Tables 1-5: offline single-player
        console.log('🎮 Tables 1-5: Offline single-player');

        // 🏆 FIX: Set ownership for single-player (all single-player games need this)
        window.isOwner = true;
        console.log('✅ Set window.isOwner = true for offline single-player');

        launchGameInterface();
    }
}

function startMultiHumanCloudGame() {
    console.log('🚀 Starting multi-human cloud game for table:', currentTable.id);

    // Write to tableState to match your listener
    firebase.database().ref(`tables/${currentTable.id}`).update({
        tableState: TABLE_STATES.NEW_TOURNAMENT,  // Changed from DEALING
        gameStarted: Date.now(),
        currentRound: 1
    }).then(() => {
        console.log('✅ Table state set to NEW_TOURNAMENT - all players should be notified');
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

    console.log('🎮 Setting up local player:', userName);

    // Only reset players in single-device mode
    if (window.gameConfig.config.gameDeviceMode === 'single-device') {
        window.game.playerManager.resetPlayers();
        window.game.playerManager.addPlayer(userName, true);
    } else {
        console.log('🌐 Multi-device mode: players already synced from Firebase');
    }

    return Promise.resolve();
}

async function setupMultiHumanPlayers() {
    console.log('🌐 Setting up players for multi-device mode...');

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
        const playersSnapshot = await firebase.database().ref(`tables/${currentTable.id}/players`).once('value');
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
    console.log('🎮 Launching game interface with table settings:', tableSettings);

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

    console.log('🎮 Settings used for launching game:', gameConfig.config);

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

// IMPLEMENTATION NOTES:
//
// 🎯 KEY FIX: Table 6 now bypasses MultiDeviceIntegration entirely
//
// ✅ BEFORE: Table 6 used MultiDeviceIntegration expecting multiple players
//    - Created Firebase listeners waiting for other players
//    - Set up multi-device coordination
//    - Froze waiting for players who would never join
//
// ✅ AFTER: Table 6 treated as single-player vs AI
//    - Starts immediately like Tables 1-5
//    - No Firebase coordination or waiting
//    - AI opponents managed locally
//    - Optional Firebase storage can be added later for persistence
//
// 🔧 NEXT STEPS:
//    1. Test Table 6 - should start immediately
//    2. Add Firebase sync inside startNewGame()/startNewRound() for persistence
//    3. Verify AI opponents play automatically in sequence
