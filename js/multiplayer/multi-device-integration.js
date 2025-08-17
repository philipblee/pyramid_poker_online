// js/multiplayer/multi-device-integration.js
// Clean integration that enhances existing single-device system

class MultiDeviceIntegration {
    constructor() {
        this.tableManager = null;
        this.currentTableId = null;
        this.currentUserId = null;
        this.isMultiDevice = false;
        this.originalSubmitHandler = null;
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

// Export for use in other modules
window.MultiDeviceIntegration = MultiDeviceIntegration;