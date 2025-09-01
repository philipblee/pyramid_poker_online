// js/multiplayer/multi-device-integration.js
// Clean integration that enhances existing single-device system

// Enhanced MultiDeviceIntegration with Table Management
class MultiDeviceIntegration {
    constructor() {
        // ... existing properties
        this.playersData = new Map(); // Track all players
        this.submissionTracker = new Map(); // Track who submitted
        this.reconnectionTimers = new Map(); // 60-second timers
        this.tableStateListener = null; // Firebase listener
    }

    // NEW: Create or join table
    async createOrJoinTable(tableId = null) {
        if (!tableId) {
            // Create new table
            tableId = this.generateTableId();
            await this.createNewTable(tableId);
        } else {
            // Join existing table
            await this.joinExistingTable(tableId);
        }

        this.currentTableId = tableId;
        await this.setupTableListener();
    }

    // NEW: Real-time submission tracking
    async onPlayerSubmitted(userId) {
        // Update submission status
        await this.tableManager.tablesRef.doc(this.currentTableId).update({
            [`submissions.${userId}`]: true,
            'lastActivity': Date.now()
        });

        // Check if all players submitted
        await this.checkAllSubmitted();
    }


    // Initialize multi-device mode with table
    async initialize(tableManager) {
        this.tableManager = tableManager;
        this.currentTableId = tableManager.currentTable;
        this.currentUserId = tableManager.currentUser.id;
        this.isMultiDevice = true;

        console.log('🌐 Multi-device integration initialized');
        this.setupMultiDeviceEnhancements();
    }

    // Add multi-device enhancements to existing UI
    setupMultiDeviceEnhancements() {
        // Override new game button to sync to Firebase
        this.enhanceNewGameButton();

        // Override submit button to sync results
        this.enhanceSubmitButton();

        // Add multi-device status indicator
        this.addMultiDeviceStatus();

        console.log('✅ Multi-device enhancements added to existing game');
    }

    // Enhance new game button to sync to Firebase
    enhanceNewGameButton() {
        const newGameBtn = document.getElementById('newGame');
        if (!newGameBtn) return;

        // Store original handler
        const originalNewGame = newGameBtn.onclick;

        // Configure for multi-device single player (1 human + 5 AI)
        window.gameConfig.config.gameMode = 'singleplayer';  // Single player mode
        window.gameConfig.config.computerPlayers = 5;        // 5 AI opponents
        window.gameConfig.saveToStorage();

        console.log('🎮 Configured for single player vs 5 AI');

        // Replace with enhanced version
        newGameBtn.onclick = async () => {
            try {
                console.log('🎮 Starting multi-device single player game');

                // Use existing startNewGame() - works perfectly as-is
                if (originalNewGame) {
                    originalNewGame();
                } else {
                    window.game.startNewGame();
                }

                // Add: sync dealt hands to Firebase for cloud storage
                await this.syncHandsToFirebase();

                console.log('✅ Game started and synced to cloud');

            } catch (error) {
                console.error('❌ Error starting multi-device game:', error);
                alert('Error starting cloud game. Please try again.');
            }
        };
    }

    // Enhance submit button to sync results
    enhanceSubmitButton() {
        const submitBtn = document.getElementById('submitHand');
        if (!submitBtn) return;

        // Store original handler
        this.originalSubmitHandler = submitBtn.onclick;

        // Replace with enhanced version
        submitBtn.onclick = async () => {
            try {
                console.log('📤 Submitting with cloud sync');

                // Use existing submit logic - works perfectly as-is
                if (this.originalSubmitHandler) {
                    this.originalSubmitHandler();
                }

                // Add: sync results to Firebase for cloud storage
                await this.syncResultsToFirebase();

                console.log('✅ Results submitted and synced to cloud');

            } catch (error) {
                console.error('❌ Error syncing results:', error);
                // Don't block the game, just log the error
            }
        };
    }

    // Sync all dealt hands to Firebase for cloud storage
    async syncHandsToFirebase() {
        if (!this.isMultiDevice || !window.game.playerHands) return;

        console.log('☁️ Syncing dealt hands to Firebase...');

        const handsData = {};

        // Convert all player hands to Firebase format
        window.game.playerHands.forEach((hand, playerName) => {
            handsData[playerName] = {
                cards: hand.originalCards, // Use original dealt cards
                timestamp: Date.now()
            };
        });

        // Store in Firebase
        await this.tableManager.tablesRef.doc(this.currentTableId).update({
            'currentGame.dealtHands': handsData,
            'currentGame.round': window.game.currentRound,
            'currentGame.status': 'cardsDealt'
        });

        console.log(`✅ Synced ${Object.keys(handsData).length} hands to Firebase`);
    }

    // Sync tournament results to Firebase for cloud storage
    async syncResultsToFirebase() {
        if (!this.isMultiDevice) return;

        console.log('☁️ Syncing results to Firebase...');

        // Get results from existing game system
        const results = this.extractGameResults();

        // Store in Firebase
        await this.tableManager.tablesRef.doc(this.currentTableId).update({
            'currentGame.results': results,
            'currentGame.completedAt': Date.now(),
            'currentGame.status': 'completed'
        });

        // Update player stats in Firebase
        await this.updatePlayerStats(results);

        console.log('✅ Results synced to Firebase');
    }

    // Extract results from existing game system
    extractGameResults() {
        const results = {
            round: window.game.currentRound,
            scores: {},
            arrangements: {},
            timestamp: Date.now()
        };

        // Extract scores
        if (window.game.tournamentScores) {
            window.game.tournamentScores.forEach((score, playerName) => {
                results.scores[playerName] = score;
            });
        }

        // Extract final arrangements
        if (window.game.playerHands) {
            window.game.playerHands.forEach((hand, playerName) => {
                results.arrangements[playerName] = {
                    back: hand.back,
                    middle: hand.middle,
                    front: hand.front
                };
            });
        }

        return results;
    }

    // Update player stats in Firebase
    async updatePlayerStats(results) {
        const userScore = results.scores[this.getUserPlayerName()];
        if (userScore === undefined) return;

        const statsUpdate = {
            gamesPlayed: firebase.firestore.FieldValue.increment(1),
            totalScore: firebase.firestore.FieldValue.increment(userScore),
            lastPlayed: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Add win/loss stats
        if (userScore > 0) {
            statsUpdate.wins = firebase.firestore.FieldValue.increment(1);
        }

        // Update user stats
        await firebase.firestore()
            .collection('userStats')
            .doc(this.currentUserId)
            .set(statsUpdate, { merge: true });

        console.log(`📊 Updated stats for user: ${userScore > 0 ? 'win' : 'loss'}`);
    }

    // Get the player name that represents the current user
    getUserPlayerName() {
        // In single player mode, user is typically the first human player
        const humanPlayer = window.game.playerManager.players.find(p => p.type === 'human');
        return humanPlayer ? humanPlayer.name : 'Player 1';
    }

    // Add visual indicator for multi-device mode
    addMultiDeviceStatus() {
        const statusElement = document.getElementById('status');
        if (!statusElement) return;

        // Add cloud indicator
        const cloudIndicator = document.createElement('div');
        cloudIndicator.id = 'multi-device-status';
        cloudIndicator.innerHTML = '☁️ Cloud Game - Single Player vs AI';
        cloudIndicator.style.cssText = `
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            margin: 10px 0;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        statusElement.parentNode.insertBefore(cloudIndicator, statusElement.nextSibling);
    }

    // Load existing game from Firebase (for rejoining)
    async loadGameFromFirebase() {
        console.log('📥 Loading game from Firebase...');

        const tableDoc = await this.tableManager.tablesRef.doc(this.currentTableId).get();
        const tableData = tableDoc.data();

        if (tableData.currentGame && tableData.currentGame.dealtHands) {
            // Restore game state
            this.restoreGameState(tableData.currentGame);
            console.log('✅ Game state restored from Firebase');
        }
    }

    // Restore game state from Firebase data
    restoreGameState(gameData) {
        // Clear current game
        window.game.playerHands.clear();

        // Restore player hands
        Object.entries(gameData.dealtHands).forEach(([playerName, handData]) => {
            window.game.playerHands.set(playerName, {
                cards: handData.cards,
                originalCards: [...handData.cards],
                back: [],
                middle: [],
                front: []
            });
        });

        // Set game state
        window.game.gameState = 'playing';
        window.game.currentRound = gameData.round || 1;

        // Load current player hand
        window.game.loadCurrentPlayerHand();

        // Update display
        if (typeof updateDisplay === 'function') {
            updateDisplay(window.game);
        }
    }

    // NEW: Owner transfer
    async transferOwnership() {
        const players = Object.entries(this.playersData);

        // Find next player (earliest joined)
        const newOwner = players
            .filter(([id, data]) => id !== this.currentUserId)
            .sort((a, b) => a[1].joinedAt - b[1].joinedAt)[0];

        if (newOwner) {
            await this.tableManager.tablesRef.doc(this.currentTableId).update({
                [`players.${newOwner[0]}.isOwner`]: true,
                [`players.${this.currentUserId}.isOwner`]: false
            });

            console.log(`👑 Ownership transferred to ${newOwner[1].name}`);
        }
    }

    // Add to MultiDeviceIntegration class

    // Show lobby screen
    showLobbyScreen(tableId) {
        // Hide game screen, show lobby
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('lobbyScreen').style.display = 'block';

        // Set table ID
        document.getElementById('currentTableId').textContent = tableId;

        // Setup lobby controls
        this.setupLobbyControls();
    }

    // Setup lobby button handlers
    setupLobbyControls() {
        const startBtn = document.getElementById('startGameBtn');
        const leaveBtn = document.getElementById('leaveTableBtn');

        startBtn.onclick = () => this.startCountdown();
        leaveBtn.onclick = () => this.leaveTable();
    }

    // Update lobby display with current players
    updateLobbyDisplay(playersData) {
        const playerElements = document.querySelectorAll('.lobby-player');
        const playerCount = Object.keys(playersData).length;

        // Update player count
        document.getElementById('playerCount').textContent = playerCount;

        // Update player slots
        let index = 0;
        Object.entries(playersData).forEach(([userId, player]) => {
            const element = playerElements[index];
            element.classList.remove('empty');
            element.textContent = player.isOwner ? `👑 ${player.name} (Owner)` : `🎯 ${player.name}`;

            if (userId === this.currentUserId) {
                element.textContent += ' (You)';
            }
            index++;
        });

        // Update start button
        const startBtn = document.getElementById('startGameBtn');
        if (playerCount >= 2) {
            startBtn.disabled = false;
            startBtn.textContent = 'Start Game';
        } else {
            startBtn.disabled = true;
            startBtn.textContent = 'Need 2+ Players';
        }

        // Update status
        const status = document.getElementById('lobbyStatus');
        if (playerCount < 2) {
            status.textContent = 'Waiting for more players to join...';
        } else {
            status.textContent = 'Ready to start! Waiting for game owner...';
        }
    }

    // 3-2-1 countdown
    async startCountdown() {
        // Update Firebase: start countdown
        await this.tableManager.tablesRef.doc(this.currentTableId).update({
            'state': 'countdown',
            'countdownStarted': Date.now()
        });

        this.showCountdown();
    }

    // Show countdown overlay
    showCountdown() {
        const overlay = document.getElementById('countdownOverlay');
        const number = overlay.querySelector('.countdown-number');

        overlay.style.display = 'flex';

        let count = 3;
        const interval = setInterval(() => {
            number.textContent = count;

            if (count <= 0) {
                clearInterval(interval);
                overlay.style.display = 'none';
                this.startActualGame();
            }
            count--;
        }, 1000);
    }

    // Start the actual game
    async startActualGame() {
        // Switch to game screen
        document.getElementById('lobbyScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';

        // Deal cards and start multiplayer game
        // Use existing startNewGame() but with multiplayer sync
        window.game.startNewGame();
        await this.syncHandsToFirebase();
    }

    // Add these methods to your existing MultiDeviceIntegration class

    // Show the lobby screen
    showLobbyScreen(tableId) {
        console.log('🎮 Showing lobby for table:', tableId);

        // Hide game screen, show lobby
        const gameContainer = document.getElementById('gameContainer');
        const lobbyScreen = document.getElementById('lobbyScreen');

        if (gameContainer) gameContainer.style.display = 'none';
        if (lobbyScreen) {
            lobbyScreen.style.display = 'block';

            // Set table ID
            const tableIdElement = document.getElementById('currentTableId');
            if (tableIdElement) {
                tableIdElement.textContent = tableId.slice(-6); // Show last 6 chars
            }
        }

        // Setup controls
        this.setupLobbyControls();
    }

    // Setup lobby button handlers
    setupLobbyControls() {
        const startBtn = document.getElementById('startGameBtn');
        const leaveBtn = document.getElementById('leaveTableBtn');

        if (startBtn) {
            startBtn.onclick = () => {
                console.log('🚀 Start game clicked');
                this.startCountdown();
            };
        }

        if (leaveBtn) {
            leaveBtn.onclick = () => {
                console.log('👋 Leave table clicked');
                this.leaveTable();
            };
        }
    }

    // Update lobby with current players
    updateLobbyDisplay(playersData) {
        console.log('👥 Updating lobby display:', playersData);

        const playerElements = document.querySelectorAll('.lobby-player');
        const playerCount = Object.keys(playersData).length;

        // Update player count
        const countElement = document.getElementById('playerCount');
        if (countElement) {
            countElement.textContent = playerCount;
        }

        // Clear all player slots first
        playerElements.forEach(element => {
            element.className = 'lobby-player empty';
            element.textContent = '⏳ Waiting...';
        });

        // Fill in actual players
        let index = 0;
        Object.entries(playersData).forEach(([userId, player]) => {
            if (index < playerElements.length) {
                const element = playerElements[index];
                element.classList.remove('empty');

                if (player.isOwner) {
                    element.classList.add('owner');
                    element.textContent = `👑 ${player.name}`;
                } else {
                    element.textContent = `🎯 ${player.name}`;
                }

                if (userId === this.currentUserId) {
                    element.textContent += ' (You)';
                }
            }
            index++;
        });

        // Update start button
        this.updateStartButton(playerCount);

        // Update status message
        this.updateLobbyStatus(playerCount);
    }

    // Update start button based on player count
    updateStartButton(playerCount) {
        const startBtn = document.getElementById('startGameBtn');
        if (!startBtn) return;

        if (playerCount >= 2) {
            startBtn.disabled = false;
            startBtn.textContent = `Start Game (${playerCount} Players)`;
        } else {
            startBtn.disabled = true;
            startBtn.textContent = 'Need 2+ Players';
        }
    }

    // Update status message
    updateLobbyStatus(playerCount) {
        const status = document.getElementById('lobbyStatus');
        if (!status) return;

        if (playerCount < 2) {
            status.textContent = `Waiting for more players... (${playerCount}/6)`;
        } else {
            status.textContent = `Ready to start! ${playerCount} players joined.`;
        }
    }

    // Start countdown (placeholder for now)
    startCountdown() {
        console.log('⏰ Starting countdown...');
        alert('Countdown feature coming next! For now, this just shows the alert.');

        // TODO: Implement actual countdown
        // this.showCountdown();
    }

    // Leave table (placeholder)
    leaveTable() {
        console.log('👋 Leaving table...');

        // Hide lobby, show game screen
        document.getElementById('lobbyScreen').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';

        alert('Left table! (In real version, this would clean up Firebase)');
}

    // Cleanup - restore original handlers
    cleanup() {
        const newGameBtn = document.getElementById('newGame');
        const submitBtn = document.getElementById('submitHand');

        // Restore original handlers would go here if needed
        // For now, just mark as not multi-device
        this.isMultiDevice = false;

        // Remove status indicator
        const statusIndicator = document.getElementById('multi-device-status');
        if (statusIndicator) {
            statusIndicator.remove();
        }

        console.log('🧹 Multi-device integration cleaned up');
    }
}

// NEW: Disconnection handling
class DisconnectionManager {
    startDisconnectionTimer(userId) {
        console.log(`⏰ Starting 60-second timer for ${userId}`);

        const timer = setTimeout(async () => {
            console.log(`🤖 Auto-arranging for disconnected player: ${userId}`);

            // Get player's current cards
            const playerHand = await this.getPlayerHand(userId);

            // Use existing findBestSetup for auto-arrange
            const autoArrangement = window.findBestSetup(playerHand.cards);

            // Submit auto-arranged hand
            await this.submitPlayerHand(userId, autoArrangement, true); // isAutoSubmit = true

            // Update table status
            await this.updateTableStatus(`${playerName} auto-submitted (disconnected)`);

        }, 60000); // 60 seconds

        this.reconnectionTimers.set(userId, timer);
    }

    cancelDisconnectionTimer(userId) {
        const timer = this.reconnectionTimers.get(userId);
        if (timer) {
            clearTimeout(timer);
            this.reconnectionTimers.delete(userId);
            console.log(`✅ ${userId} reconnected - cancelled auto-arrange timer`);
        }
    }
}

// Export for use in other modules
window.MultiDeviceIntegration = MultiDeviceIntegration;