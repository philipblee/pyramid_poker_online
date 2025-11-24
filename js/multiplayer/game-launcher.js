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
//    console.log('🎮 Launching game interface with table settings:', tableSettings);
    updateGameChipDisplay();  // ADD THIS LINE
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

    // 🔧 FIX: Check for actual game object (could be 'game' or 'window.game')
    let retryCount = 0;
    const maxRetries = 5; // Only retry 5 times (1 second total)

    function attemptGameStart() {
        retryCount++;

//        console.log(`🔍 DEBUG - Attempt ${retryCount}/${maxRetries} - Checking available game objects:`);
//        console.log('  - typeof startNewGame:', typeof startNewGame);
//        console.log('  - window.game exists:', !!window.game);
//        console.log('  - global game exists:', typeof game !== 'undefined' && !!game);

        // Check what actually exists
        if (typeof game !== 'undefined' && game) {
//            console.log('  - global game.startNewGame:', typeof game.startNewGame);
//            console.log('  - global game.initializeTournament:', typeof game.initializeTournament);
//            console.log('  - global game constructor:', game.constructor?.name);
        }

        if (window.game) {
//            console.log('  - window.game.startNewGame:', typeof window.game.startNewGame);
//            console.log('  - window.game.initializeTournament:', typeof window.game.initializeTournament);
        }

        // Try different game object locations
        if (typeof startNewGame === 'function') {
            console.log('✅ Found global startNewGame function - calling it');
            startNewGame();
        } else if (typeof game !== 'undefined' && game && typeof game.startNewGame === 'function') {
            console.log('✅ Found global game.startNewGame function - calling it');
            game.startNewGame();
        } else if (window.game && typeof window.game.startNewGame === 'function') {
            console.log('✅ Found window.game.startNewGame function - calling it');
            window.game.startNewGame();
        } else if (typeof game !== 'undefined' && game && typeof game.initializeTournament === 'function') {
            console.log('✅ Using global game.initializeTournament as fallback');
            game.initializeTournament();
        } else if (window.game && typeof window.game.initializeTournament === 'function') {
            console.log('✅ Using window.game.initializeTournament as fallback');
            window.game.initializeTournament();
        } else if (retryCount < maxRetries) {
            console.log(`⏳ Game object not ready yet, retrying ${retryCount}/${maxRetries} in 200ms...`);
            setTimeout(attemptGameStart, 200);
        } else {
            console.error('❌ GIVING UP: Could not find game object after', maxRetries, 'attempts');
            console.error('🔧 Possible fixes:');
            console.error('  1. Ensure game.js is loaded before game-launcher.js');
            console.error('  2. Check that PyramidPoker class is instantiated');
            console.error('  3. Verify DOMContentLoaded has fired');

            // 🔧 MANUAL FALLBACK: Try to create game object if PyramidPoker class exists
            if (typeof PyramidPoker !== 'undefined') {
                console.log('🔧 FALLBACK: PyramidPoker class found, attempting to create game object...');
                try {
                    window.game = new PyramidPoker();
                    console.log('✅ FALLBACK: Created window.game object');
                    if (typeof window.game.startNewGame === 'function') {
                        console.log('✅ FALLBACK: Calling startNewGame on newly created object');
                        window.game.startNewGame();
                    }
                } catch (error) {
                    console.error('❌ FALLBACK FAILED:', error);
                }
            } else {
                console.error('❌ PyramidPoker class not found - game.js not loaded?');
            }
        }
    }

    // Start the attempt
    attemptGameStart();
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
