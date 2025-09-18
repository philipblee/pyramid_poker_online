// js/multiplayer/multi-device-integration.js
// Clean integration that enhances existing single-device system

// Enhanced MultiDeviceIntegration with Table Management
class MultiDeviceIntegration {
    constructor(tableId = null, tableManager = null) {

        console.log('🔧 MultiDeviceIntegration constructor called');
        console.log('  tableId:', tableId);
        console.log('  tableManager:', tableManager);

        this.currentTableId = tableId;
        this.tableId = tableId
        this.tableManager = tableManager;

        // Debug the isMultiDevice setting
        console.log('  window.gameConfig exists:', !!window.gameConfig);
        console.log('  window.gameConfig:', window.gameConfig);
//        console.log('  gameConfig.config:', window.gameConfig?.config);
//        console.log('  gameDeviceMode value:', window.gameConfig?.config?.gameDeviceMode);
//        console.log('  gameDeviceMode type:', typeof window.gameConfig?.config?.gameDeviceMode);
//        console.log('  comparison result:', window.gameConfig?.config?.gameDeviceMode === 'multi-device');

        this.isMultiDevice = window.gameConfig?.config?.gameDeviceMode === 'multi-device';
        console.log('  final isMultiDevice:', this.isMultiDevice);

        // ... existing properties
        this.playersData = new Map(); // Track all players
        this.submissionTracker = new Map(); // Track who submitted
        this.reconnectionTimers = new Map(); // 60-second timers
        this.tableStateListener = null; // Firebase listener

        // ADD OWNER DETECTION:
        this.isOwner = this.isTableOwner();
        console.log('🏗️ Constructor - Setting isOwner:', this.isOwner);

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

    // state listener
    setupTableStateListener(tableId, callback) {
        console.log('🔥 Setting up table state listener for table:', tableId);

        // Reference to the table's state
        const tableStateRef = firebase.database().ref(`tables/${tableId}/tableState`);

        // Listen for changes
        this.tableStateListener = tableStateRef.on('value', (snapshot) => {
            const tableState = snapshot.val();
            console.log('🔥 Table state updated:', tableState);

            if (tableState) {
                callback(tableState);
            }

        // Store reference to remove listener later
        this.currentTableStateRef = tableStateRef;

        // In setupTableStateListener
        firebase.database().ref(`tables/${tableId}/state/${TABLE_STATES.NUM_HUMAN_PLAYERS}`)
            .on('value', (snapshot) => {
                const playerCount = snapshot.val() || 0;
                console.log(`🔍 Shared player count: ${playerCount}`);
                updateStartGameButton(playerCount);
            });
        });
    }

    // list listener
    setupPlayerListListener(tableId, callback) {
        console.log('🔥 Setting up player list listener for table:', tableId);

        // Reference to the table's players
        const playersRef = firebase.database().ref(`tables/${tableId}/players`);

        // Listen for changes
        this.playerListListener = playersRef.on('value', (snapshot) => {
            const playersData = snapshot.val() || {};
            const playersArray = Object.values(playersData);

            console.log('🔥 Player list updated:', playersArray);
            callback(playersArray);
        });

        // Store reference to remove listener later
        this.currentPlayersRef = playersRef;
    }

    // Add this method to your MultiDeviceIntegration class
    async addPlayerToTable(tableId, playerInfo) {
        try {
            console.log('🔥 Adding player to Firebase table:', tableId, playerInfo);

            // Reference to the table's players collection (v8 compatible syntax)
            const tableRef = firebase.database().ref(`tables/${tableId}/players`);

            // Add player to Firebase
            await tableRef.child(playerInfo.id).set({
                id: playerInfo.id,
                name: playerInfo.name,
                joinedAt: playerInfo.joinedAt,
                ready: playerInfo.ready,
                connected: true,
                isOwner: window.currentPlayerIsOwner
            });

            // Track locally
            this.playersData.set(playerInfo.id, playerInfo);

            console.log('✅ Player added successfully');
            return playerInfo.id;

        } catch (error) {
            console.error('❌ Error adding player to table:', error);
            throw error;
        }
    }

    // NEW: Real-time submission tracking
    async onPlayerSubmitted(userId) {
        // Update submission status
        await this.tableManager.tablesRef.doc(this.currentTableId).update({
            [`submissions.${userId}`]: true,
            'lastActivity': Date.now()
        });

        // Check if all players submitted
        if (await this.isTableOwner()) {
            await this.checkAllPlayersSubmitted();
        } else {
            console.log('Not owner - skipping submission check');
        }
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

    // Check if all players have submitted their arrangements
    async checkAllPlayersSubmitted() {
        console.log('👑 Owner checking if all players have submitted...');
//
//        // Debug: Check what data we're working with
        const playersSnapshot = await firebase.database().ref(`tables/${this.tableId}/players`).once('value');
        const players = playersSnapshot.val() || {};
        const totalPlayers = Object.keys(players).length;

        // Alternative check - look at Firestore arrangements
        const arrangementsSnapshot = await firebase.firestore()
            .collection('tables')
            .doc(this.tableId.toString())
            .get();

        const arrangementsData = arrangementsSnapshot.data()?.currentGame?.arrangements;

        console.log('🔍 DEBUG - Full arrangements snapshot:', arrangementsSnapshot);
        console.log('🔍 DEBUG - Firestore arrangements:', arrangementsData);

        // COUNT ARRANGEMENTS, NOT SUBMISSIONS:
        const arrangements = arrangementsData || {};
        const submittedCount = Object.keys(arrangements).length;
        console.log('🔍 DEBUG - arrangements keys:', Object.keys(arrangements));
        console.log('🔍 DEBUG - arrangementsData type:', typeof arrangementsData);
        console.log('🔍 DEBUG - Arrangements count:', submittedCount);
        console.log('🔍 DEBUG - Total players needed:', totalPlayers);

        if (submittedCount >= totalPlayers) {
            console.log('🎉 All players have submitted! Transitioning...');
            await this.transitionToAllSubmitted();
        } else {
            console.log(`⏳ Waiting for more submissions (${submittedCount}/${totalPlayers})`);
        }
    }

    // Transition to ALL_SUBMITTED state
    async transitionToAllSubmitted() {
        console.log('🚀 Transitioning to ALL_SUBMITTED state...');

        try {
            // Update table state in Realtime Database
            await this.tableManager.tablesRef.doc(this.currentTableId.toString()).update({
                'currentGame.status': 'ALL_SUBMITTED',
                'currentGame.allSubmittedAt': Date.now()
            });

            console.log('✅ Successfully transitioned to ALL_SUBMITTED state');

            // Show "All players submitted" message
            this.showAllSubmittedMessage();

            // Start scoring process (with slight delay for UI feedback)
            setTimeout(() => {
                this.proceedToScoring();
            }, 2000);

        } catch (error) {
            console.error('❌ Error transitioning to ALL_SUBMITTED:', error);
        }
    }

    /**
     * Update UI to show submission status
     */
    updateSubmissionStatus(submittedCount, totalPlayers) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.innerHTML = `⏳ Waiting for players to submit (${submittedCount}/${totalPlayers} submitted)`;
            statusElement.style.color = '#ffd700';
        }

        // Disable submit button after submission
        const submitBtn = document.getElementById('submitHand');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitted ✓';
            submitBtn.style.backgroundColor = '#28a745';
        }
    }

    /**
     * Show "All players submitted" message
     */
    showAllSubmittedMessage() {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.innerHTML = '🎉 All players submitted! Starting scoring...';
            statusElement.style.color = '#4ecdc4';
        }
    }

    /**
     * Proceed to scoring phase
     */

    async proceedToScoring() {
        console.log('🏆 Proceeding to scoring phase...');

        // Load arrangements from Firestore
        await this.RetrieveAllArrangementsFromFirebase();

        // Debug: Check what's actually in submittedHands before scoring
        console.log('🔍 submittedHands before calculateScores:', window.game.submittedHands);
        console.log('🔍 submittedHands size:', window.game.submittedHands.size);
        window.game.submittedHands.forEach((value, key) => {
            console.log(`🔍 ${key}: has back =`, !!value?.back, 'has middle =', !!value?.middle, 'has front =', !!value?.front);
        });

        // Call scoring
        if (window.game && window.game.calculateScores) {
            window.game.calculateScores();
        }

        // In proceedToScoring(), after calculateScores() and before syncResultsToFirebase()
        console.log('🔍 Cleaning up dual-value Map behavior...');
        if (window.game.submittedHands._originalGet) {
            window.game.submittedHands.get = window.game.submittedHands._originalGet;
            delete window.game.submittedHands._originalGet;
            console.log('✅ Original Map.get method restored');

            // Also reset any other temporary properties
            console.log('🔍 submittedHands after restoration:', window.game.submittedHands.size);
        }

        this.syncResultsToFirebase();
    }

    /**
     * Enhanced submit button with submission coordination
     */
    enhanceSubmitButton() {
        const submitBtn = document.getElementById('submitHand');
        if (!submitBtn) return;

        // Add enhanced handler that runs FIRST and stops other handlers
        submitBtn.addEventListener('click', async (e) => {

            e.stopImmediatePropagation(); // Prevents original handler

            // Enhanced multi-device logic
            const humanPlayer = window.game.players.find(p => !p.isAI);
//            const playerName = humanPlayer ? humanPlayer.name : 'fallback@gmail.com';

            const playerName = window.currentPlayerUniquePlayerName;

            // Read from where single instance actually stored the data (playerHands[0])
            const playerData = window.game.playerHands.get(window.game.players[0].name);
            if (playerData) {
                // Store the actual arrangement data under the correct unique player key
                window.game.playerHands.set(playerName, {
                    back: [...playerData.back],
                    middle: [...playerData.middle],
                    front: [...playerData.front],
                    cards: [...playerData.cards],
                    originalCards: [...playerData.originalCards]
                });
}

            console.log('🔍 PLAYER IDENTITY CHECK:');
            console.log('- playerName:', playerName);
            console.log('- Expected for this device:'), // what should it be?
            console.log('- playerHands before storage:', window.game.playerHands);
            console.log('- playerHands has this key?', window.game.playerHands.has(playerName));

            try {
                console.log(`📝 Storing arrangement for human player: ${playerName}`);

                // RIGHT BEFORE calling storePlayerArrangementToFirebase:
                console.log('🔍 PRE-STORAGE DEBUG for:', playerName);
                console.log('🔍 Current playerHands Map:', window.game.playerHands);
                console.log('🔍 PlayerHands has key?', window.game.playerHands.has(playerName));
                console.log('🔍 Direct playerHands.get():', window.game.playerHands.get(playerName));

                // Also check what's visually arranged:
                console.log('🔍 DOM back hand:', document.querySelector('.back-hand')?.children.length);
                console.log('🔍 DOM middle hand:', document.querySelector('.middle-hand')?.children.length);
                console.log('🔍 DOM front hand:', document.querySelector('.front-hand')?.children.length);

                await this.storePlayerArrangementToFirebase(playerName);


                // Add after successful storage:
                const submitBtn = document.getElementById('submitHand');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Submitted ✓';
                }


                if (await this.isTableOwner()) {
                    await this.checkAllPlayersSubmitted();
                } else {
                    console.log('Not owner - skipping submission check');
                }
            } catch (error) {
                console.error('❌ Error in enhanced submit:', error);
            }
        }, true); // 'true' = capture phase, runs before original handler
    }

    /**
     * Set up listener for submission state changes (call this during initialization)
     */
    // In setupSubmissionListener(), add more logging:
    async setupSubmissionListener() {
        if (!this.isMultiDevice) return;

        console.log('👂 Setting up submission state listener...');
        console.log('👂 Table ID:', this.currentTableId);
        console.log('👂 Is Owner:', this.isOwner);

        const tableRef = this.tableManager.tablesRef.doc(this.currentTableId.toString());

        this.submissionListener = tableRef.onSnapshot(async (doc) => {
            console.log('📡 FIRESTORE LISTENER TRIGGERED!');

            if (this.isOwner) {
                const stateSnapshot = await firebase.database().ref(`tables/${this.tableId}/tableState`).once('value');
                const currentState = stateSnapshot.val(); // Should return "dealing" or "playing"

                console.log('📡 Current TABLE_STATE:', currentState);

                if (currentState === TABLE_STATES.PLAYING) {
                    console.log('📡 Owner checking submissions (PLAYING state)');
                    this.checkAllPlayersSubmitted();
                } else {
                    console.log('📡 Skipping check - not in PLAYING state:', currentState);
                }
            }
        });
    }

    /**
     * Clean up listeners (call this when leaving the game)
     */
    cleanupSubmissionListener() {
        if (this.submissionListener) {
            this.submissionListener();
            this.submissionListener = null;
            console.log('🧹 Cleaned up submission listener');
        }
    }

    // Add multi-device enhancements to existing UI
    async setupMultiDeviceEnhancements() {
        console.log('🌐 Setting up multi-device enhancements');

        // this.enhanceNewGameButton();
        this.enhanceSubmitButton();
        // this.enhanceCalculateScores();
        this.addMultiDeviceStatus();

        // Submission coordination
        this.setupSubmissionListener();

        console.log('✅ Multi-device enhancements setup complete');
        return Promise.resolve();
    }

    // Enhance new game button to sync to Firebase
    enhanceNewGameButton() {
        const newGameBtn = document.getElementById('newGame');
        if (!newGameBtn) return;

        // Store original handler
        const originalNewGame = newGameBtn.onclick;

        console.log('🎮 Configured for multi-device game');

        // Replace with enhanced version
        newGameBtn.onclick = async () => {
            try {
                // ✅ NEW: Owner-only check
                if (!await this.isTableOwner()) {
                    console.log('❌ Only table owner can start the game');
                    alert('Only the table owner can start the game');
                    return;
                }

                console.log('🎮 Owner starting multi-device game');

                // ✅ NEW: Owner sets state for ALL players
                await firebase.database().ref(`tables/${this.tableId}/state/tableState`).set(TABLE_STATES.DEALING);

                // Use existing startNewGame() - works perfectly as-is
                if (originalNewGame) {
                    originalNewGame();
                } else {
                    window.game.startNewGame();
                }

                // Add: sync dealt hands to Firebase for cloud storage
                await this.syncHandsToFirebase();
                console.log('✅ Owner: Game started and all hands synced to Firebase');

                // All players retrieve hands from Firebase
                await this.retrieveAllHandsFromFirebase();
                console.log('🔍 After Firebase retrieval - playerHands size:', window.game.playerHands.size);

            } catch (error) {
                console.error('❌ Error starting multi-device game:', error);
                alert('Error starting cloud game. Please try again.');
            }
        };
    }

    // Add this helper method to check ownership
async isTableOwner() {
    console.log('🔍 isTableOwner START');
    try {
        const ownerSnapshot = await firebase.database().ref(`tables/${this.currentTableId}/state/TABLE_OWNER`).once('value');
        const tableOwner = ownerSnapshot.val();

        const myUniquePlayerName = window.currentPlayerUniquePlayerName;

        console.log('🔍 Ownership check debug:', {
            tableOwner,
            myUniquePlayerName,
            tableId: this.currentTableId,
            match: tableOwner === myUniquePlayerName
        });

        return tableOwner === myUniquePlayerName;
    } catch (error) {
        console.error('❌ Error in isTableOwner:', error);
        return false;
    }
}

    // this handles retrieve arrangements from Firebase
    enhanceCalculateScores() {
        if (!window.game || typeof window.game.calculateScores !== 'function') return;

        console.log('🔧 Enhancing calculateScores for Firebase coordination...');

        // Store original handler
        this.originalCalculateScores = window.game.calculateScores;

        // Replace with enhanced version
        window.game.calculateScores = async () => {
            console.log('🎯 Enhanced calculateScores called!');

            try {
                // Phase 3: Retrieve all arrangements before scoring
                if (this.isMultiDevice) {
                    await this.retrieveAllArrangementsFromFirebase();
                }

                // Call original calculateScores
                if (this.originalCalculateScores) {
                    this.originalCalculateScores.call(window.game);
                }

            } catch (error) {
                console.error('❌ Error in enhanced calculateScores:', error);

                // Fallback to original on error
                if (this.originalCalculateScores) {
                    this.originalCalculateScores.call(window.game);
                }
            }
        };

        console.log('✅ calculateScores enhanced for Firebase coordination');
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

        // In syncHandsToFirebase(), before the Firebase call:
        console.log('🔍 About to sync hands to Firebase:', handsData);
        console.log('🔍 Sample hand cards:', handsData[Object.keys(handsData)[0]]?.cards?.slice(0,2));

        console.log('🔍 currentTableId type:', typeof this.currentTableId);
        console.log('🔍 currentTableId value:', this.currentTableId);

        // ✅ Correct - actual object
        // Instead of .update()
        await this.tableManager.tablesRef.doc(this.currentTableId.toString()).set({
            'currentGame': {
                'dealtHands': handsData,
                'round': window.game.currentRound,
                'status': 'cardsDealt'
            }
        }, { merge: true }); // merge: true will update existing or create new

        console.log(`✅ Synced ${Object.keys(handsData).length} hands to Firebase`);
    }

    async retrieveAllHandsFromFirebase() {
        if (!this.isMultiDevice || !this.currentTableId) return;

        console.log('☁️ Retrieving all dealt hands from Firebase...');

        try {

            // ✅ Correct - string "6"
            const tableDoc = await this.tableManager.tablesRef.doc(this.currentTableId.toString()).get();

            const dealtHands = tableDoc.data()?.currentGame?.dealtHands;

            if (!dealtHands) {
                console.error('❌ No dealt hands found in Firebase');
                return;
            }

            // Clear current hands and repopulate from Firebase
            window.game.playerHands.clear();

            Object.entries(dealtHands).forEach(([playerName, handData]) => {
                window.game.playerHands.set(playerName, {
                    cards: handData.cards,        // Direct from Firebase
                    originalCards: handData.cards, // Same data
                    back: [],
                    middle: [],
                    front: []
                });
            });

            console.log(`✅ Retrieved ${Object.keys(dealtHands).length} hands from Firebase`);

        } catch (error) {
            console.error('❌ Error retrieving hands from Firebase:', error);
        }

    console.log('🔍 After Firebase retrieval - playerHands size:', window.game.playerHands.size);
    window.game.playerHands.forEach((hand, playerName) => {
        console.log(`🔍 ${playerName} has ${hand.cards.length} cards from Firebase`);
    });

    }

    // In RetrieveAllArrangementsFromFirebase()
    async RetrieveAllArrangementsFromFirebase() {
        console.log('☁️ Loading arrangements from Firestore...');

        const doc = await this.tableManager.tablesRef.doc(this.currentTableId.toString()).get();
        const data = doc.data();
        const firebaseArrangements = data?.currentGame?.arrangements || {};

        // Store arrangements with unique keys
        window.game.submittedHands.clear();
        const arrangementEntries = Object.entries(firebaseArrangements);

        arrangementEntries.forEach(([key, arrangement], index) => {
            const uniqueKey = `arrangement_${index}`;
            console.log(`🔍 Storing arrangement with unique key: ${uniqueKey}`);
            window.game.submittedHands.set(uniqueKey, arrangement);
        });

        console.log('🔍 submittedHands size:', window.game.submittedHands.size);
        console.log('🔍 submittedHands keys:', Array.from(window.game.submittedHands.keys()));

        // After storing arrangements with unique keys
        console.log('🔍 Creating dual-value Map behavior...');

        let callCount = 0;
        const arrangements = [
            window.game.submittedHands.get('arrangement_0'),
            window.game.submittedHands.get('arrangement_1')
        ];

        console.log('🔍 Retrieved arrangements for dual behavior:');
        console.log('🔍 arrangement_0:', arrangements[0] ? 'exists' : 'missing');
        console.log('🔍 arrangement_1:', arrangements[1] ? 'exists' : 'missing');

        // Store original get method
        window.game.submittedHands._originalGet = window.game.submittedHands.get;

        // Override get to return alternating arrangements for the same player name
        window.game.submittedHands.get = function(playerName) {
            const arrangement = arrangements[callCount % 2];
            console.log(`🔍 Get call ${callCount} for "${playerName}" returning arrangement_${callCount % 2}`);
            console.log(`🔍 Returned arrangement has back:`, !!arrangement?.back, 'cards:', arrangement?.back?.length);
            callCount++;
            return arrangement;
        };

        // Clear the unique keys and set up the original player names
        console.log('🔍 Before clearing - submittedHands size:', window.game.submittedHands.size);
        console.log('🔍 Before clearing - keys:', Array.from(window.game.submittedHands.keys()));

        window.game.submittedHands.clear();
        window.game.submittedHands.set('peter@gmail.com', 'placeholder');

        console.log('🔍 After setup - submittedHands size:', window.game.submittedHands.size);
        console.log('🔍 After setup - keys:', Array.from(window.game.submittedHands.keys()));
        console.log('🔍 callCount reset to:', callCount);
    }

    async storePlayerArrangementToFirebase(playerName) {
        console.log(`☁️ Storing player arrangement to Firebase for: ${playerName}`);

        // DEBUG 1: Check what we're looking for
        console.log('🔍 DEBUG - Input playerName:', playerName);
        console.log('🔍 DEBUG - typeof playerName:', typeof playerName);

        // DEBUG 2: Check if playerHands exists and has the player
        console.log('🔍 DEBUG - window.game.playerHands exists:', !!window.game.playerHands);
        console.log('🔍 DEBUG - playerHands keys:', window.game.playerHands ? Array.from(window.game.playerHands.keys()) : 'No playerHands');

        const playerHand = window.game.playerHands.get(playerName);
        console.log('🔍 DEBUG - Retrieved playerHand:', playerHand);
        console.log('🔍 DEBUG - playerHand exists:', !!playerHand);

        if (playerHand) {
            console.log('🔍 DEBUG - playerHand.back length:', playerHand.back?.length);
            console.log('🔍 DEBUG - playerHand.middle length:', playerHand.middle?.length);
            console.log('🔍 DEBUG - playerHand.front length:', playerHand.front?.length);
        }

        // DEBUG 3: Check players array and ID matching
        console.log('🔍 DEBUG - window.game.players:', window.game.players?.map(p => ({name: p.name, id: p.id})));

        const player = window.game.players.find(p => p.name === playerName);
        console.log('🔍 DEBUG - Found matching player:', player);

        const uniquePlayerId = player ? player.id : playerName;
        console.log('🔍 DEBUG - Using uniquePlayerId:', uniquePlayerId);

        const arrangementData = {
            [uniquePlayerId]: {
                back: playerHand.back,
                middle: playerHand.middle,
                front: playerHand.front,
                timestamp: Date.now()
            }
        };

        console.log('🔍 DEBUG - Final arrangementData:', JSON.stringify(arrangementData, null, 2));

        await this.tableManager.tablesRef.doc(this.currentTableId.toString()).set({
            'currentGame': {
                'arrangements': arrangementData
            }
        }, { merge: true });

        console.log(`✅ Stored arrangement for ${playerName}`);
    }
    // Sync tournament results to Firebase for cloud storage
    async syncResultsToFirebase() {
        if (!this.isMultiDevice) return;

        console.log('☁️ Syncing results to Firebase...');

        // Get results from existing game system
        const results = this.extractGameResults();

        // Store in Firebase
        await this.tableManager.tablesRef.doc(this.currentTableId.toString()).update({
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
            detailedResults: window.game.lastDetailedResults || [], // Include detailed results
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

        // NEW: Load current player's hand from Firebase
        await window.game.loadCurrentPlayerHandFromFirebase();
        window.game.loadCurrentPlayerHand();
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

    // Add Firebase listener for score updates
    setupScoreListener() {
        firebase.database().ref(`tables/${currentTable.id}/scores`).on('value', (snapshot) => {
            const scoresData = snapshot.val() || {};
            this.updateLocalScoreDisplay(scoresData);
        });
    }

    updateLocalScoreDisplay(scoresData) {
        // Update the local game UI with scores from Firebase
        Object.entries(scoresData).forEach(([playerName, score]) => {
            // Update score in your existing game UI
            if (window.game && window.game.playerManager) {
                window.game.playerManager.updatePlayerScore(playerName, score);
            }
        });
    }

    // Add to multi-device-integration.js
    setupHandListener() {
        const currentUser = firebase.auth().currentUser;
        const userName = currentUser ? currentUser.displayName || currentUser.email : 'Guest Player';

        firebase.database().ref(`tables/${this.currentTableId}/hands/${userName}`).on('value', (snapshot) => {
            const handData = snapshot.val();
            if (handData) {
                this.updateLocalPlayerHand(handData);
            }
        });
    }

    updateLocalPlayerHand(handData) {
        // Update the local game with the player's hand from Firebase
        if (window.game && window.game.playerManager) {
            // Need to integrate with your existing hand management system
            // This depends on how your game currently handles player hands
            console.log('Retrieved hand from Firebase:', handData);
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

async function showMultiDeviceScoringResults() {
    try {
        const resultsSnapshot = await firebase.database()
            .ref(`tables/7/currentGame/results`)
            .once('value');

        console.log('🔍 Firebase results snapshot:', resultsSnapshot.val());
        const results = resultsSnapshot.val();

        if (results) {
            console.log('✅ Found results, showing popup...');
            console.log('🔍 detailedResults:', results.detailedResults);
            console.log('🔍 scores:', results.scores);

            // Extract the scoring data
            const detailedResults = results.detailedResults || [];
            const roundScores = new Map(Object.entries(results.scores || {}));
            const specialPoints = new Map(); // If you have special points

            // Show the scoring popup using existing function
            showScoringPopup(window.game, detailedResults, roundScores, specialPoints);
        } else {
            console.log('❌ No results found in Firebase');
        }
    } catch (error) {
        console.error('❌ Error loading scoring results:', error);
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
