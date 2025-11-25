// js/core/game.js
// Main game orchestration - much cleaner!

class PyramidPoker {
    constructor() {
        // Initialize managers
        this.playerManager = new PlayerManager();
        this.deckManager = new DeckManager();
        this.autoArrangeManager = new AutoArrange(this);

        // Game state
        this.gameState = 'waiting';
        this.playerHands = new Map();
        this.submittedHands = new Map();
        this.sidebarVisible = false;

        // NEW: Round tracking
        this.currentRound = 0;          // 0 = no game started, 1-3 = active rounds
        this.maxRounds = gameConfig.config.rounds;             // Tournament limit
        this.roundHistory = [];         // Store completed round data
        this.tournamentScores = new Map(); // Running totals across rounds
        this.initializeEventListeners();
        updateDisplay(this);
        createParticles();
    }

    // Getters for backward compatibility
    get players() { return this.playerManager.players; }
    get currentPlayerIndex() { return this.playerManager.currentPlayerIndex; }
    get scores() { return this.playerManager.getAllScores(); }
    get deck() { return this.deckManager.deck; }

    initializeEventListeners() {
        // NEW: Make "newGame" button open config screen
//        document.getElementById('newGame').addEventListener('click', () => this.startNewGame());

        // NEW: Add "newRound" button to deal new hands to existing players
//        document.getElementById('newRound').addEventListener('click', () => this.startNewRound());
        document.getElementById('autoArrange').addEventListener('click', () => this.handleAutoArrangeToggle());
        document.getElementById('sortByRank').addEventListener('click', () => this.resetAndSortByRank());
        document.getElementById('sortBySuit').addEventListener('click', () => this.resetAndSortBySuit());
        document.getElementById('submitHand').addEventListener('click', () => this.submitCurrentHand());
//        document.getElementById('gameSettings').addEventListener('click', () => openGameSettings());
        document.getElementById('helpButton').addEventListener('click', () => openGameRules());


        const toggleButton = document.getElementById('sidebarToggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => toggleSidebar(this));
        }

        setupDragAndDrop(this);
    }

    addPlayer() {
        const playerName = this.playerManager.addPlayer();
        updateDisplay(this);
        return playerName;
    }

    handleAutoArrangeToggle() {
        if (this.autoArrangeUsed) {
            // Undo auto-arrange (instant, no spinner needed)
            this.restoreToDealtState();
            this.autoArrangeUsed = false;
            document.getElementById('autoArrange').textContent = 'Auto';
            console.log('Log from handleAutoArrange: 🔄 Undid auto-arrange');
        } else {
            showLoadingSpinner(2);

            // Use setTimeout to allow UI to update before computation
            setTimeout(() => {
                try {
//                    console.log('Log from handleAutoArrange: 🧠 Starting auto-arrange optimization...');

                    // Your existing auto-arrange logic
                    this.autoArrangeManager.autoArrangeHand();
                    this.autoArrangeUsed = true;
                    document.getElementById('autoArrange').textContent = 'Undo Auto';

                    // Hide spinner when done
                    hideLoadingSpinner();

//                    console.log('Log from handleAutoArrange: ✅ Auto-arrange applied successfully');

                } catch (error) {
                    console.error('❌ Auto-arrange failed:', error);
                    hideLoadingSpinner();
                    alert('Auto-arrange failed. Please try manually.');
                }
            }, 100); // Small delay ensures spinner shows
        }
    }

    restoreToDealtState() {
        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData || !playerData.originalCards) return;

        // Restore from original dealt cards (not current modified ones)
        playerData.cards = [...playerData.originalCards];  // Copy of originals
        playerData.back = [];
        playerData.middle = [];
        playerData.front = [];

        this.loadCurrentPlayerHand();
        console.log('🔄 Restored to original dealt state');
    }

    async startNewGame() {
        // Add this when a new game starts
        resetGameTimer();

        // 🔧 FIX: Refresh ALL settings from current config (not stale constructor values)
        this.maxRounds = gameConfig.config.rounds;
        // Add any other cached settings here if we find them

        // Set multiDeviceMode based on gameConfig
        this.multiDeviceMode = window.gameConfig?.config?.gameDeviceMode === 'multi-device';
        console.log('🔧 Constructor set multiDeviceMode:', this.multiDeviceMode);

        // Add this when a new game starts
        resetGameTimer();

        // Ensure we have players
        const playersAdded = this.playerManager.ensurePlayersExist();
        if (playersAdded) {
            updateDisplay(this);
            console.log('Added default players for testing');
        }

        try {
            this.playerManager.validateMinimumPlayers();
        } catch (error) {
            alert(error.message);
            return;
        }

        // Add countdown
        const isSingleHuman = window.gameConfig?.config?.gameMode === 'single-human';

        if (isSingleHuman) {
            await this.handleCountdown();  // ADD THIS
        }


        // Configure players based on GameConfig
        if (window.gameConfig) {
            // Check if we're in multi-device mode
            const isMultiDevice = window.gameConfig.config.gameDeviceMode === 'multi-device';

            if (isMultiDevice) {
                // For multi-device, get actual player count from the game
                const humanPlayers = this.players.filter(p => !p.isAI).length;
                const aiPlayers = this.players.filter(p => p.isAI).length;
                const totalPlayers = this.players.length;

                console.log(`🎮 Multi-device configured for ${totalPlayers} players (${humanPlayers} human + ${aiPlayers} AI)`);
            } else {
                // For single-device, use the original logic
                const targetPlayerCount = 1 + window.gameConfig.config.computerPlayers; // 1 human + N AI
//                console.log(`🎮 Single-device configured for ${targetPlayerCount} players (1 human + ${window.gameConfig.config.computerPlayers} AI)`);
            }
        }

        // NEW: Initialize tournament
        this.currentRound = 1;
        this.roundHistory = [];
        this.tournamentScores.clear();
        console.log(`Round ${this.currentRound} of ${this.maxRounds}`);

        // Initialize tournament scores for all players
        for (let player of this.playerManager.players) {
            this.tournamentScores.set(player.name, 0);
        }

        // This block is essential for single-player.  Without it, single-player breaks
        // Setup first round
        this.deckManager.createNewDeck();
        this.gameState = 'playing';
        this.playerManager.currentPlayerIndex = 0;
        this.submittedHands.clear();

        await this.dealCardsToAllPlayers();

        // Only load hand immediately for owner/single-player
        // Non-owners will load after Firebase retrieval completes
        if (!this.multiDeviceMode || window.isOwner) {
            this.loadCurrentPlayerHand();
            updateDisplay(this);
        }
    }

    async handleNonOwnerCardRetrieval() {
        console.log('📱 Non-owner retrieving cards from Firebase');
        await window.multiDeviceIntegration.retrieveAllHandsFromFirebase();
        console.log('✅ Non-owner retrieved hands from Firebase');

        // 🎯 SIMPLE FIX: Load MY cards into the local Player 0 slot
        const myPlayerName = window.uniquePlayerName;
        const myActualHand = this.playerHands.get(myPlayerName);
        const localPlayer0Name = this.playerManager.players[0].name;

        console.log('🔄 Loading my cards into local Player 0 slot');
        console.log('  - My name:', myPlayerName);
        console.log('  - Local Player 0 name:', localPlayer0Name);

        // Overwrite local Player 0 with my actual cards from Firebase
        this.playerHands.set(localPlayer0Name, myActualHand);

        // Now everything works exactly like single-player!
        this.loadCurrentPlayerHand();
        updateDisplay(this);
        console.log('✅ Non-owner loaded correct hand into UI (as Player 0)');
    }

    async startNewRound() {
        console.log('🔍 startNewRound CALLED');
        console.log('🔍 isOwner:', window.isOwner);
        console.log('🔍 multiDeviceMode:', this.multiDeviceMode);
        console.trace('Call stack:');  // This shows where it was called from

        // Must have existing players to start a new round
        if (this.playerManager.players.length < 2) {
            alert('Need at least 2 players to start a round. Click "New Game" to configure players.');
            return;
        }

        if (this.currentRound >= this.maxRounds) {
            // Single-player always shows summary directly
            const isSingleHuman = window.gameConfig?.config?.gameMode === 'single-human';

            if (isSingleHuman) {
                this.showTournamentSummary();  // Direct call for all single-player
            } else if (window.isOwner) {
                setTableState(TABLE_STATES.TOURNAMENT_COMPLETE);  // Multi-player uses state machine
            }
            return;
        }

        // Continue with new round
        if (window.isOwner) {
            setTableState(TABLE_STATES.DEALING);
        }

        // Advance to next round
        this.currentRound++;
        console.log(`🔄 Starting Round ${this.currentRound} of ${this.maxRounds}...`);

        // 🆕 ADD COUNTDOWN HERE (before dealing cards)
        const config = window.gameConfig?.config;
        const isSingleHuman = config?.gameMode === 'single-human';

        if (isSingleHuman) {
            await this.handleCountdown();
        }

        // Setup new round (same as before but with round tracking)
        this.gameState = 'playing';
        this.playerManager.currentPlayerIndex = 0;
        this.submittedHands.clear();

        // IN startNewRound() method, ADD this block after the card dealing loop:

        await this.dealCardsToAllPlayers();

        this.loadCurrentPlayerHand();

        updateDisplay(this);

        // Add at end of startNewRound()
        console.log('🔍 Round', this.currentRound, 'setup complete:');
        console.log('- Players:', this.players.map(p => `${p.name}(ready:${p.ready})`));
        console.log('- PlayerHands size:', this.playerHands.size);
        console.log('- SubmittedHands size:', this.submittedHands.size);
        this.playerHands.forEach((hand, name) => {
//            console.log(`- ${name}: ${hand.cards.length} cards`);
        });

    }

    async dealCardsToAllPlayers() {
        if (!this.multiDeviceMode || window.isOwner) {
            this.deckManager.createNewDeck();

            for (let player of this.playerManager.players) {
                const hand = this.deckManager.dealCards(17);
                this.playerHands.set(player.name, {
                    cards: hand,
                    originalCards: [...hand],
                    back: [],
                    middle: [],
                    front: []
                });
                player.ready = false;
            }

            if (this.multiDeviceMode && window.multiDeviceIntegration) {
                setTimeout(async () => {
                    await window.multiDeviceIntegration.storeAllHandsToFirebase();
                    console.log('✅ Owner synced all hands to Firebase');
                }, 500);
            }
        } else {
            setTimeout(() => this.handleNonOwnerCardRetrieval(), 1500);
        }

        // Table 6 Firebase sync
        if (window.table6FirebaseSync && gameConfig.config.gameConnectMode === 'online') {
            try {
                await window.table6FirebaseSync.storeAllHandsToFirebase();
                console.log('✅ Hands synced to Firebase for persistence');
            } catch (error) {
                console.error('❌ Firebase sync failed:', error);
            }
        }
    }



    async startNewTournament() {
        console.log('🏆 Starting completely new tournament...');

        if (gameConfig.config.gameDeviceMode === 'multi-device'){
            setTableState(TABLE_STATES.NEW_TOURNAMENT)
            return;
        }

        // Clear all tournament-level data - not needed after
        this.currentRound = 0;  // or 1, depending on your preference
        this.roundHistory = [];
        this.roundRobinResults = [];  // <-- This is the key line for your bug
        this.tournamentScores.clear();

        // Reset game state
        this.gameState = 'waiting';

        // 🆕 ADD COUNTDOWN HERE (before dealing cards)
        const config = window.gameConfig?.config;
        const isSingleHuman = config?.gameMode === 'single-human';

        if (isSingleHuman) {
            await this.handleCountdown();
        }

        // Call the regular game start logic
        this.startNewGame();
    }

    // load all current playerHand
    loadCurrentPlayerHand() {
        if (this.gameState !== 'playing') return;

        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);
//        console.log(`loadCurrentPlayerHand called for ${currentPlayer.name}`)

        if (!playerData) return;

        // Clear display
        document.getElementById('playerHand').innerHTML = '';
        document.getElementById('backHand').innerHTML = '';
        document.getElementById('middleHand').innerHTML = '';
        document.getElementById('frontHand').innerHTML = '';

        // Display cards
        displayCards(playerData.cards, 'playerHand');
        displayCards(playerData.back, 'backHand');
        displayCards(playerData.middle, 'middleHand');
        displayCards(playerData.front, 'frontHand');

        this.validateHands();

        // Add the guard to prevent multiple AI turns
        if (currentPlayer.type === 'ai' && !currentPlayer.isReady && !currentPlayer.aiTurnInProgress) {
            currentPlayer.aiTurnInProgress = true; // Set flag
            this.handleAITurn();
        }

    }


    // Load current player's hand from Firebase into local playerHands Map
    async loadCurrentPlayerHandFromFirebase() {
            console.log('🔧 DEBUG: Firebase loading function called');

        if (!window.multiDevice?.isMultiDevice || !window.multiDevice.currentTableId) {
            console.log('🔧 DEBUG: Exiting early - multiDevice check failed');
            console.log('isMultiDevice:', window.multiDevice?.isMultiDevice);
            console.log('currentTableId:', window.multiDevice.currentTableId);
            return;
        }



        if (!window.multiDevice?.isMultiDevice || !window.multiDevice.currentTableId) return;

        try {
            const currentPlayer = this.playerManager.getCurrentPlayer();
            if (!currentPlayer) return;

            console.log(`☁️ Loading ${currentPlayer.name}'s hand from Firebase...`);

            // Get from Realtime Database instead of Firestore
            const snapshot = await firebase.database()
                .ref(`tables/${window.multiDevice.currentTableId}/currentGame/dealtHands/${currentPlayer.name}`)
                .once('value');

            const handData = snapshot.val();

            if (!handData) {
                console.log(`⚠️ No hand found for ${currentPlayer.name} in Firebase`);
                return;
            }

            // Update local playerHands Map
            this.playerHands.set(currentPlayer.name, {
                cards: handData.cards,
                originalCards: [...handData.cards],
                back: [],
                middle: [],
                front: []
            });

            console.log(`✅ Loaded ${currentPlayer.name}'s hand from Firebase`);

        } catch (error) {
            console.error('❌ Error loading hand from Firebase:', error);
        }
    }


    // Replace enablePlayerButtons() with these:
    saveButtonStates() {
        this.savedButtonStates = {
            autoArrange: document.getElementById('autoArrange').disabled,
            sortByRank: document.getElementById('sortByRank').disabled,
            sortBySuit: document.getElementById('sortBySuit').disabled,
            submitHand: document.getElementById('submitHand').disabled
        };
    }

    restoreButtonStates() {
        if (!this.savedButtonStates) return;

        document.getElementById('autoArrange').disabled = this.savedButtonStates.autoArrange;
        document.getElementById('sortByRank').disabled = this.savedButtonStates.sortByRank;
        document.getElementById('sortBySuit').disabled = this.savedButtonStates.sortBySuit;
        document.getElementById('submitHand').disabled = this.savedButtonStates.submitHand;

        this.savedButtonStates = null;
    }


    // Keep this one - it's fine
    disablePlayerButtons() {
        document.getElementById('submitHand').disabled = true;
        document.getElementById('autoArrange').disabled = true;
        document.getElementById('sortByRank').disabled = true;   // Add missing buttons
        document.getElementById('sortBySuit').disabled = true;   // Add missing buttons
    }

    async handleAITurn() {


        const currentPlayer = this.playerManager.getCurrentPlayer();

        // 🔧 SAVE button states before disabling
        this.saveButtonStates();
        // DISABLE BUTTONS when AI starts
        this.disablePlayerButtons();

        // Show spinner immediately
        showLoadingSpinner();

        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

        console.log(`🤖 ${currentPlayer.name} is playing...`);

        // Step 1: Show AI is thinking (1 second)
        setTimeout(() => {
            this.autoArrangeManager.autoArrangeHand();

            // Step 2: Let player see the AI's arranged hand (3 seconds)
            setTimeout(() => {
//                console.log(`Log from handleAITurn: 👀 AI ${currentPlayer.name} displaying final arrangement...`);

                // Hide spinner once arrangement is visible
                hideLoadingSpinner();

                this.validateHands(); // This updates the UI with hand strengths and colors

            // Step 3: Let player read the hand details (2 more seconds)
            setTimeout(async () => {
//                console.log(`Log from handleAITurn: ✅ AI ${currentPlayer.name} submitting hand...`);
                this.submitAIPlayerHand();

                // Store AI arrangement to Firebase
                if (window.multiDevice && window.multiDevice.isMultiDevice) {
                    await window.multiDevice.storePlayerArrangementToFirebase(currentPlayer.name);
                }
            }, 2000);

            }, 1500); // 3 seconds to see the arranged cards

        }, 1000); // 1 second thinking time


        // At the very end of handleAITurn, replace the enablePlayerButtons() call:
        setTimeout(() => {
            const currentPlayer = this.playerManager.getCurrentPlayer();
            currentPlayer.aiTurnInProgress = false;

            // 🔧 Check if all players are ready (meaning we're going to scoring)
            const allPlayersReady = this.playerManager.areAllPlayersReady();
            const isHumanTurn = !currentPlayer.isAI && currentPlayer.type !== 'ai';

            if (isHumanTurn && !allPlayersReady && this.gameState === 'playing') {
                // Only restore if it's genuinely the human's turn (not going to scoring)
                this.restoreButtonStates();
                updateDisplay(this);
                console.log('🔄 Restored buttons - human player turn');
            } else if (allPlayersReady) {
                // All players ready - going to scoring, keep buttons disabled
                console.log('🏁 All players ready - keeping buttons disabled for scoring');
            } else {
                // Another AI turn - keep buttons disabled
                console.log('🤖 Next AI player - keeping buttons disabled');
            }

}, 1200);

    }

    submitAIPlayerHand() {
        // For AI players, add a small delay to let DOM update after auto-arrange
        setTimeout(() => {
            this.submitCurrentHand(); // Uses validateHands() + working flow
        }, 150); // Small delay for DOM updates
    }

    moveCard(cardData, sourceId, targetHand) {
        const card = JSON.parse(cardData);
        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        const sourceKey = getHandKey(sourceId);
        const sourceArray = sourceKey === 'cards' ? playerData.cards : playerData[sourceKey];
        const cardIndex = sourceArray.findIndex(c => c.id === card.id);

        if (cardIndex === -1) return;

        const targetKey = getHandKey(targetHand);
        const targetArray = targetKey === 'cards' ? playerData.cards : playerData[targetKey];


        if (targetKey === 'front' && targetArray.length >= 5) {
            alert('Front hand can only have up to 5 cards!');
            return;
        }

        if (targetKey === 'middle' && targetArray.length >= 7) {
            alert('Middle hand can only have up to 7 cards!');
            return;
        }

        if (targetKey === 'back' && targetArray.length >= 8) {
            alert('Back hand can only have up to 8 cards!');
            return;
        }

        sourceArray.splice(cardIndex, 1);
        targetArray.push(card);

        this.loadCurrentPlayerHand();
    }

    validateHands() {

        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        if (playerData && playerData.cards.length > 0) {
//            console.log(`\n🔍 Validating ${currentPlayer.name}'s cards:`);
//            const analysis = new Analysis(playerData.cards);
//            analysis.debugInfo();
        }

        const backHand = document.getElementById('backHand');
        const middleHand = document.getElementById('middleHand');
        const frontHand = document.getElementById('frontHand');
        const submitBtn = document.getElementById('submitHand');
        const statusDiv = document.getElementById('status');

        // Reset classes
        [backHand, middleHand, frontHand].forEach(hand => {
            hand.classList.remove('valid', 'invalid');
        });

        // Check card counts
        const backCount = playerData.back.length;
        const middleCount = playerData.middle.length;
        const frontCount = playerData.front.length;
        const totalPlaced = backCount + middleCount + frontCount;

        // Validate hand sizes
        const isValidCounts = backCount <= 8 && middleCount <= 7 && (frontCount <= 5);
        const isValidFrontSize = frontCount === 3 || frontCount === 5;
        const isValidBackSize = [5, 6, 7, 8].includes(backCount) || backCount === 0;
        const isValidMiddleSize = [5, 6, 7].includes(middleCount) || middleCount === 0;

        // Validate 6+ card hands follow special rules
        const isValidBackHand = backCount < 6 || this.validateLargeHand(playerData.back);
        const isValidMiddleHand = middleCount < 6 || this.validateLargeHand(playerData.middle);

        const isComplete = (backCount > 0 && middleCount > 0 && frontCount > 0) &&
                          isValidFrontSize && isValidBackSize && isValidMiddleSize &&
                          isValidBackHand && isValidMiddleHand;

        if (!isValidCounts || !isValidFrontSize || !isValidBackSize || !isValidMiddleSize || !isValidBackHand || !isValidMiddleHand) {
            // Mark invalid hands
            if (backCount > 8) backHand.classList.add('invalid');
            if (middleCount > 7) middleHand.classList.add('invalid');
            if (frontCount > 5 || frontCount === 4) frontHand.classList.add('invalid');
            if (!isValidBackHand) backHand.classList.add('invalid');
            if (!isValidMiddleHand) middleHand.classList.add('invalid');

            submitBtn.disabled = true;

            // Update strength displays with error messages
            let backError = backCount > 8 ? ' (TOO MANY!)' : !isValidBackHand ? ' (MUST BE STRAIGHT FLUSH OR SAME RANK!)' : '';
            let middleError = middleCount > 7 ? ' (TOO MANY!)' : !isValidMiddleHand ? ' (MUST BE STRAIGHT FLUSH OR SAME RANK!)' : '';
            let frontError = frontCount > 5 ? ' (TOO MANY!)' : frontCount === 4 ? ' (4 CARDS NOT ALLOWED!)' : '';

            document.getElementById('backStrength').textContent = `${backCount}/5-8 cards${backError}`;
            document.getElementById('middleStrength').textContent = `${middleCount}/5-7 cards${middleError}`;
            document.getElementById('frontStrength').textContent = `${frontCount}/3 or 5 cards${frontError}`;
            return;
        }

        if (isComplete) {
            // Evaluate hand strengths
            const backStrength = evaluateHand(playerData.back);
            const middleStrength = evaluateHand(playerData.middle);
            const frontStrength = evaluateThreeCardHand(playerData.front);

            const handUtils = handUtilities();

            const backPoints = handUtils.getPointValue(backStrength.handType, 'back');
            const middlePoints = handUtils.getPointValue(middleStrength.handType, 'middle');
            const frontPoints = handUtils.getPointValue(frontStrength.handType, 'front');

            // Validate hand order (Back >= Middle >= Front)
            const backTuple = backStrength.handStrength;
            const middleTuple = middleStrength.handStrength;
            const frontTuple = frontStrength.handStrength;

//            console.log('🔍 backStrength:', backStrength);
//            console.log('🔍 middleStrength:', middleStrength);
//            console.log('🔍 frontStrength:', frontStrength);

            const backVsMiddle = compareTuples(backTuple, middleTuple);
            const middleVsFront = compareTuples(middleTuple, frontTuple);

            // Special validation for 5-card front hands
            let frontIsValid = true;
            if (frontCount === 5 && frontStrength.handType < 5) {
                frontIsValid = false;
            }

            const isValidOrder = backVsMiddle >= 0 && middleVsFront >= 0 && frontIsValid;

            const backStrengthEl = document.getElementById('backStrength');
            const middleStrengthEl = document.getElementById('middleStrength');
            const frontStrengthEl = document.getElementById('frontStrength');

            // Set content and styling
            backStrengthEl.textContent = `${backStrength.name}   -   ${backPoints} Points`;
            backStrengthEl.style.color = '#FFFF00';
            backStrengthEl.style.fontWeight = 'bold';
            backStrengthEl.style.fontSize = '16px';

            middleStrengthEl.textContent = `${middleStrength.name}  -  ${middlePoints} Points`;
            middleStrengthEl.style.color = '#FFFF00';
            middleStrengthEl.style.fontWeight = 'bold';
            middleStrengthEl.style.fontSize = '16px';

            frontStrengthEl.textContent = `${frontStrength.name}  -  ${frontPoints} Points`;
            frontStrengthEl.style.color = '#FFFF00';
            frontStrengthEl.style.fontWeight = 'bold';
            frontStrengthEl.style.fontSize = '16px';

            // Display hand strengths
            document.getElementById('backStrength');
            document.getElementById('middleStrength');
            document.getElementById('frontStrength');

            if (isValidOrder) {
                // Valid setup
                backHand.classList.add('valid');
                middleHand.classList.add('valid');
                frontHand.classList.add('valid');
                submitBtn.disabled = false;

                const readyCount = this.playerManager.getReadyCount();
                statusDiv.innerHTML = `Round ${this.currentRound} of ${this.maxRounds}.  Player ${currentPlayer.name}'s turn - <span style="color: #4ecdc4; font-weight: bold;">✓ SETUP VALID</span>`;
            } else {
                // Invalid order
                backHand.classList.add('invalid');
                middleHand.classList.add('invalid');
                frontHand.classList.add('invalid');
                submitBtn.disabled = true;

                let reason = '';
                if (!frontIsValid) reason = '5-card front hand must be at least a Straight';
                else if (backVsMiddle < 0) reason = 'Back hand must be >= Middle hand';
                else if (middleVsFront < 0) reason = 'Middle hand must be >= Front hand';

                const readyCount = this.playerManager.getReadyCount();
                statusDiv.innerHTML = `${currentPlayer.name}'s turn - <span style="color: #ff6b6b; font-weight: bold;">✗ INVALID ORDER</span> - ${reason}! (${readyCount}/${this.playerManager.players.length} players ready)`;
            }
        } else {
            // Incomplete setup
            submitBtn.disabled = true;
            document.getElementById('backStrength').textContent = `${backCount}/5 cards`;
            document.getElementById('middleStrength').textContent = `${middleCount}/5 cards`;
            document.getElementById('frontStrength').textContent = `${frontCount}/3 cards`;

            const readyCount = this.playerManager.getReadyCount();
            const expectedCards = frontCount === 3 ? 13 : 15;

            statusDiv.innerHTML = `${currentPlayer.name}'s turn - <span style="color: #ffd700; font-weight: bold;">⚠ INCOMPLETE</span> - Need ${expectedCards} cards in play (${totalPlaced}/${expectedCards} placed) (${readyCount}/${this.playerManager.players.length} players ready)`;
        }

    return !submitBtn.disabled; // Use the existing submitBtn variable

    }

    validateLargeHand(cards) {
        if (cards.length < 6) return true;

        const wildCards = cards.filter(c => c.isWild);
        const normalCards = cards.filter(c => !c.isWild);

        return this.isAllSameRank(normalCards, wildCards.length) ||
               this.isStraightFlush(normalCards, wildCards.length);
    }

    isAllSameRank(normalCards, wildCount) {
        if (normalCards.length === 0) return true;

        const rankCounts = {};
        normalCards.forEach(card => {
            rankCounts[card.value] = (rankCounts[card.value] || 0) + 1;
        });

        const ranks = Object.keys(rankCounts);
        if (ranks.length === 1) return true;

        if (ranks.length === 2) {
            const counts = Object.values(rankCounts);
            const minCount = Math.min(...counts);
            return wildCount >= minCount;
        }

        return false;
    }

    isStraightFlush(normalCards, wildCount) {
        const totalLength = normalCards.length + wildCount;
        if (normalCards.length === 0) return wildCount >= 6;

        const suitGroups = {};
        normalCards.forEach(card => {
            if (!suitGroups[card.suit]) suitGroups[card.suit] = [];
            suitGroups[card.suit].push(card.value);
        });

        for (const [suit, values] of Object.entries(suitGroups)) {
            const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
            if (this.canMakeStraightFlush(uniqueValues, wildCount, totalLength)) {
                return true;
            }
        }

        return false;
    }

    canMakeStraightFlush(values, wildCount, targetLength) {
        if (values.length === 0) return wildCount >= targetLength;
        
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        // Check all possible consecutive straights
        for (let start = Math.max(Analysis.getRankValue('2'), minValue - wildCount);
             start <= Math.min(Analysis.getRankValue('A') - targetLength + 1, maxValue + wildCount); start++) {

            const straightValues = [];
            for (let i = 0; i < targetLength; i++) {
                straightValues.push(start + i);
            }

            const needed = straightValues.filter(v => !values.includes(v)).length;
            if (needed <= wildCount) return true;
        }

        // Check wheel straights (A-2-3-4-5-6 for 6-card, A-2-3-4-5 for 5-card, etc.)
        if (targetLength <= 6) {
            const wheelStraight = Analysis.generateWheelValues(targetLength);
            const wheelNeeded = wheelStraight.filter(v => !values.includes(v)).length;
            if (wheelNeeded <= wildCount) return true;
        }

        return false;
    }

    resetCards() {
        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];

        playerData.cards = allCards;
        playerData.cards = this.restoreWildsInStaging(playerData.cards);
        playerData.back = [];
        playerData.middle = [];
        playerData.front = [];

        this.loadCurrentPlayerHand();
    }

    resetAndSortByRank() {
        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];

        allCards.sort((a, b) => {
            if (a.value !== b.value) return b.value - a.value;
            const suitOrder = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
            return suitOrder[b.suit] - suitOrder[a.suit];
        });

        playerData.cards = allCards;
//        playerData.cards = this.restoreWildsInStaging(playerData.cards);
        playerData.back = [];
        playerData.middle = [];
        playerData.front = [];

        this.loadCurrentPlayerHand();
    }

    resetAndSortBySuit() {
        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];

        allCards.sort((a, b) => {
            const suitOrder = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
            if (a.suit !== b.suit) return suitOrder[b.suit] - suitOrder[a.suit];
            return b.value - a.value;
        });

        playerData.cards = allCards;
        playerData.back = [];
        playerData.middle = [];
        playerData.front = [];

        this.loadCurrentPlayerHand();
    }

    // Add these methods to your js/core/game.js file
    // Insert after the resetAndSortBySuit() method

    submitCurrentHand() {

        // Replace validation with the good function
        if (!this.validateHands()) {
            return; // Don't submit if validation failed
        }

        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        this.submittedHands.set(currentPlayer.name, {
            back: [...playerData.back],
            middle: [...playerData.middle],
            front: [...playerData.front]
        });

        this.playerManager.setPlayerReady(currentPlayer.name, true);
        this.playerManager.nextPlayer();


         // Reset auto button for next turn (always happens after submit)
        this.autoArrangeUsed = false;
        document.getElementById('autoArrange').textContent = 'Auto';

        if (this.playerManager.areAllPlayersReady()) {
            this.calculateScores();
            this.gameState = 'scoring';
        } else {
            this.loadCurrentPlayerHand();
        }

        updateDisplay(this);
    }

    calculateScores() {
//        console.log('🚀 calculateScores() START - this.maxRounds:', this.maxRounds);

        const playerNames = this.playerManager.getPlayerNames();
//        console.log('🔍 After getPlayerNames() - this.maxRounds:', this.maxRounds);

        const roundScores = new Map();
        const detailedResults = [];
        const bonusPoints = new Map();

        // Initialize round scores
        playerNames.forEach(name => {
            roundScores.set(name, 0);
            bonusPoints.set(name, 0);
        });

//        console.log('🔍 After initialization - this.maxRounds:', this.maxRounds);

        // Head-to-head comparisons (same as before)
        for (let i = 0; i < playerNames.length; i++) {
            for (let j = i + 1; j < playerNames.length; j++) {
                const player1 = playerNames[i];
                const player2 = playerNames[j];

                const hand1 = this.submittedHands.get(player1);
                const hand2 = this.submittedHands.get(player2);

//                console.log(`🔍 Player in calculateScores ${player1} hand:`, hand1);
//                console.log(`🔍 Player in calculateScores ${player2} hand:`, hand2);

                const result = this.compareHands(hand1, hand2);

                roundScores.set(player1, roundScores.get(player1) + result.player1Score);
                roundScores.set(player2, roundScores.get(player2) + result.player2Score);

                detailedResults.push({
                    player1,
                    player2,
                    player1Score: result.player1Score,
                    player2Score: result.player2Score,
                    details: result.details
                });
            }
        }

//        console.log('Detailed Results from calculateScores()', detailedResults)
//        console.log(`📊 Storing round ${this.currentRound}, history length: ${this.roundHistory.length}`);
//        console.log('🔍 After head-to-head comparisons - this.maxRounds:', this.maxRounds);

        // NEW: Only store round history ONCE per round
        const roundAlreadyStored = this.roundHistory.some(round => round.roundNumber === this.currentRound);

//        console.log('🔍 After roundAlreadyStored check - this.maxRounds:', this.maxRounds);

        if (!roundAlreadyStored) {
            const roundData = {
                roundNumber: this.currentRound,
                roundScores: new Map(roundScores),
                detailedResults: [...detailedResults],
                submittedHands: new Map(this.submittedHands),
                timestamp: new Date()
            };
            this.roundHistory.push(roundData);

            // Update tournament totals only once per round
            roundScores.forEach((roundScore, playerName) => {
                const currentTotal = this.tournamentScores.get(playerName) || 0;
                this.tournamentScores.set(playerName, currentTotal + roundScore);
            });
        }

//        console.log('🔍 After round history update - this.maxRounds:', this.maxRounds);

        // Update individual round scores (keep existing for current round display)
        roundScores.forEach((roundScore, playerName) => {
            if (!roundAlreadyStored) {
                this.playerManager.updatePlayerScore(playerName, roundScore);
            }
        });

//        console.log('🔍 After updatePlayerScore - this.maxRounds:', this.maxRounds);
//        console.log('🔍 Just before showScoringPopup - this.maxRounds:', this.maxRounds);

        // In calculateScores(), after generating detailed results
        window.game.detailedResults = detailedResults; // Store for later extraction

        showScoringPopup(this, detailedResults, roundScores, new Map());

        updateDisplay(this);

//        console.log(`🔍 Round Check: currentRound=${this.currentRound}, maxRounds=${this.maxRounds}, this.currentRound=${this.currentRound}`);
//        console.log(`🔍 Comparison: currentRound >= maxRounds = ${this.currentRound >= this.maxRounds}`);

        // NEW - No popup, just return to display
        /*
        MODIFICATION 4: Optional - Add Firebase cleanup when tournament completes
        Location: In calculateScores() when tournament ends
        */

        // IN calculateScores() method, after tournament complete logic:

        if (this.currentRound >= this.maxRounds) {
            console.log('🏆 Tournament Complete! Check final standings in sidebar.');

            // ☁️ NEW: Clean up Firebase data when tournament completes
            if (window.table6FirebaseSync && gameConfig.config.gameConnectMode === 'online') {
                try {
                    window.table6FirebaseSync.clearFirebaseData();
                    console.log('🧹 Firebase data cleared after tournament completion');
                } catch (error) {
                    console.error('❌ Firebase cleanup failed:', error);
                }
            }

            return;
        }
        // ADD THIS RETURN at the end:
        return {
            detailedResults,
            roundScores,
            bonusPoints
        };

    }

    showTournamentSummary() {
        console.log('🏆 Showing tournament summary...');

        // DEBUG: Check what's actually in round history
        this.roundHistory.forEach((round, index) => {
            // console.log(`Round ${index + 1}:`, round.roundNumber, 'Scores:', [...round.roundScores.entries()]);
        });

        // Create sorted tournament standings
        const standings = [...this.tournamentScores.entries()]
            .sort((a, b) => b[1] - a[1])
            .map((entry, index) => ({
                position: index + 1,
                playerName: entry[0],
                totalScore: entry[1]
            }));

        // Create tournament summary modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8); z-index: 1001;
            display: flex; align-items: center; justify-content: center;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #2c3e50, #34495e);
            border-radius: 15px; border: 2px solid #ffd700;
            max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;
            color: white; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            padding: 30px; text-align: center;
        `;

        // Build HTML content
        let html = `
            <h1 style="color: #ffd700; margin-bottom: 24px; font-size: 20px;">
                🏆 TOURNAMENT COMPLETE! 🏆
            </h1>
            <div style="background: rgba(255, 215, 0, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
                <h2 style="color: #4ecdc4; margin-bottom: 20px;">Final Standings</h2>
        `;

        standings.forEach(standing => {
            const medal = standing.position === 1 ? '🥇' :
                         standing.position === 2 ? '🥈' :
                         standing.position === 3 ? '🥉' : '🏅';
            const bgColor = standing.position === 1 ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
            html += `
                <div style="background: ${bgColor}; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 16px;">${medal} ${standing.position}. ${standing.playerName}</span>
                    <span style="font-size: 14px; font-weight: bold; color: #4ecdc4;">${standing.totalScore} points</span>
                </div>
            `;
        });

        html += `</div><div style="background: rgba(52, 73, 94, 0.5); padding: 20px; border-radius: 10px; margin-bottom: 24px;">
            <h3 style="color: #4ecdc4; margin-bottom: 15px;">Round-by-Round Breakdown</h3>
        `;

        for (let round = 1; round <= this.roundHistory.length; round++) {
            const roundData = this.roundHistory[round - 1];
            html += `<div style="margin-bottom: 15px;"><h4 style="color: #ffd700;">Round ${round}</h4>`;
            roundData.roundScores.forEach((score, playerName) => {
                const sign = score > 0 ? '+' : '';
                const color = score > 0 ? '#4ecdc4' : score < 0 ? '#ff6b6b' : '#95a5a6';
                html += `<div style="color: ${color};">${playerName}: ${sign}${score}</div>`;
            });
            html += `</div>`;
        }

        html += `</div>`;

        // ✨ NEW: Add "Return to Table" button or waiting message
        const canReturn = gameConfig.config.gameDeviceMode !== 'multi-device' || window.isOwner;

        if (canReturn) {
            // Owner (or single-player) can return to table
            html += `
                <button onclick="game.returnToTable();"
                        style="background: #4ecdc4; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;">
                    Return to Table
                </button>
            `;
        } else {
            // Non-owner waits
            html += `
                <p style="color: #ffd700; margin-top: 20px; font-size: 16px;">
                    Waiting for table owner to continue...
                </p>
            `;
        }

        content.innerHTML = html;
        modal.appendChild(content);
        document.body.appendChild(modal);

        // ✨ REMOVED: Don't reset state here anymore - only when Return to Table is clicked
    }

    returnToTable() {
        console.log('🔙 Returning to table/lobby...');

        // Close the tournament summary modal
        const modals = document.querySelectorAll('div[style*="position: fixed"]');
        modals.forEach(modal => {
            if (modal.textContent.includes('TOURNAMENT COMPLETE')) {
                modal.remove();
            }
        });

        if (gameConfig.config.gameDeviceMode === 'multi-device') {
            // MULTIPLAYER: Return to lobby state
            setTableState(TABLE_STATES.LOBBY);
            console.log('✅ Owner set tableState back to LOBBY');
        } else {
            // SINGLE PLAYER: Reset to lobby state
            this.gameState = 'waiting'; // Already set in showTournamentSummary
            this.currentRound = 0;
            updateDisplay(this);
            console.log('✅ Single-player returned to lobby');
        }
        }

    returnToTable() {
        console.log('🔙 Returning to table/lobby...');

        // Close the tournament summary modal
        const modals = document.querySelectorAll('div[style*="position: fixed"]');
        modals.forEach(modal => {
            if (modal.textContent.includes('TOURNAMENT COMPLETE')) {
                modal.remove();
            }
        });

        if (gameConfig.config.gameDeviceMode === 'multi-device') {
            // MULTIPLAYER: Only owner sets state, non-owners just do cleanup
            if (window.isOwner) {
                setTableState(TABLE_STATES.LOBBY);
                console.log('✅ Owner set tableState back to LOBBY');
            } else {
                // Non-owner just does local cleanup
                console.log('✅ Non-owner cleaned up locally');
            }
        } else {
            // SINGLE PLAYER: Reset to waiting state
            this.gameState = 'waiting';
            this.currentRound = 0;
            updateDisplay(this);
            console.log('✅ Single-player returned to waiting');
        }

        // Show table screen for everyone
        showTableScreen();
    }

    compareHands(hand1, hand2) {
        let player1Score = 0;
        let player2Score = 0;
        const details = [];

        // Back hand comparison
        const back1 = evaluateHand(hand1.back);
        const back2 = evaluateHand(hand2.back);
        const backComparison = compareTuples(back1.handStrength, back2.handStrength);
        let backResult = 'tie';

        if (backComparison > 0) {
            const points = this.getHandPoints(back1, hand1.back.length, 'back');
            player1Score += points;
            player2Score -= points;
            backResult = 'player1';
        } else if (backComparison < 0) {
            const points = this.getHandPoints(back2, hand2.back.length, 'back');
            player2Score += points;
            player1Score -= points;
            backResult = 'player2';
        }

        details.push({
            hand: 'Back',
            player1Hand: back1,
            player2Hand: back2,
            winner: backResult
        });

        // Middle hand comparison
        const middle1 = evaluateHand(hand1.middle);
        const middle2 = evaluateHand(hand2.middle);
        const middleComparison = compareTuples(middle1.handStrength, middle2.handStrength);
        let middleResult = 'tie';

        if (middleComparison > 0) {
            const points = this.getHandPoints(middle1, hand1.middle.length, 'middle');
            player1Score += points;
            player2Score -= points;
            middleResult = 'player1';
        } else if (middleComparison < 0) {
            const points = this.getHandPoints(middle2, hand2.middle.length, 'middle');
            player2Score += points;
            player1Score -= points;
            middleResult = 'player2';
        }

        details.push({
            hand: 'Middle',
            player1Hand: middle1,
            player2Hand: middle2,
            winner: middleResult
        });

        // Front hand comparison
        const front1 = evaluateThreeCardHand(hand1.front);
        const front2 = evaluateThreeCardHand(hand2.front);
        const frontComparison = compareTuples(front1.handStrength, front2.handStrength);
        let frontResult = 'tie';

        if (frontComparison > 0) {
            const points = this.getHandPoints(front1, hand1.front.length, 'front');
            player1Score += points;
            player2Score -= points;
            frontResult = 'player1';
        } else if (frontComparison < 0) {
            const points = this.getHandPoints(front2, hand2.front.length, 'front');
            player2Score += points;
            player1Score -= points;
            frontResult = 'player2';
        }

        details.push({
            hand: 'Front',
            player1Hand: front1,
            player2Hand: front2,
            winner: frontResult
        });

        return { player1Score, player2Score, details };
    }

    getHandPoints(handEval, cardCount, position) {
        return ScoringUtilities.getPointsForHand(handEval, position, cardCount);
    }

    closeScoringPopup() {
        closeScoringPopup();
    }

    // ADD THIS AS A NEW METHOD - doesn't touch existing code
    compareScoringMethods(handEval, cardCount, position) {
        // Call your existing method (unchanged)
        const currentPoints = this.getHandPoints(handEval, cardCount, position);

        // Call standard method
        const standardPoints = ScoringUtilities.getPointsForHand(handEval, position, cardCount);

        // Just log the comparison
        console.log(`🎯 Scoring comparison - ${position} (${cardCount} cards):`,
                    `current=${currentPoints}, standard=${standardPoints}`,
                    currentPoints === standardPoints ? '✅ MATCH' : '❌ DIFFERENT');

        // Don't return anything - this is just for comparison
    }

    // Enhance existing game completion
    // In js/core/game.js (modify existing endRound method)
    async endRound() {
        // ... existing game logic ...

        // NEW: Save game results to Firebase
        if (this.authManager.currentUser) {
            await this.saveGameToFirebase(finalScores);
            await this.updateUserStats(this.authManager.currentUser.uid, myScore);
        } else {
            // Fallback: save to localStorage
            this.saveGameToLocalStorage(finalScores);
        }
    }

    saveGameToLocalStorage(finalScores) {
        try {
            // Get existing stats or create new
            const existingStats = JSON.parse(localStorage.getItem('userStats') || '{}');

            // Convert finalScores to Firebase-compatible format
            const myScore = finalScores.find(player => player.name === 'You')?.score || 0;
            const won = myScore > 0; // Simple win logic

            // Update stats using same structure as Firebase
            const updatedStats = {
                email: existingStats.email || 'local@player.com',
                gamesPlayed: (existingStats.gamesPlayed || 0) + 1,
                totalScore: (existingStats.totalScore || 0) + myScore,
                highScore: Math.max(existingStats.highScore || 0, myScore),
                wins: (existingStats.wins || 0) + (won ? 1 : 0),
                winRate: 0, // Will calculate below
                currentStreak: won ? (existingStats.currentStreak || 0) + 1 : 0,
                bestStreak: 0, // Will calculate below
                lastGameAt: new Date().toISOString(),
                createdAt: existingStats.createdAt || new Date().toISOString(),
                // Add other Firebase fields as needed
                averageScore: 0, // Will calculate below
                lowScore: existingStats.lowScore === undefined ? myScore : Math.min(existingStats.lowScore, myScore)
            };

            // Calculate derived fields
            updatedStats.averageScore = Math.round(updatedStats.totalScore / updatedStats.gamesPlayed);
            updatedStats.winRate = Math.round((updatedStats.wins / updatedStats.gamesPlayed) * 100);
            updatedStats.bestStreak = Math.max(updatedStats.bestStreak || 0, updatedStats.currentStreak);

            // Save to localStorage
            localStorage.setItem('userStats', JSON.stringify(updatedStats));

            console.log('💾 Game saved to localStorage:', updatedStats);

        } catch (error) {
            console.error('❌ Failed to save game to localStorage:', error);
        }
    }

    async saveGameToFirebase(scores) {
        const gameDoc = doc(collection(db, 'gameHistory'));
        await setDoc(gameDoc, {
            userId: this.authManager.currentUser.uid,
            gameConnectMode: this.config.gameConnectMode,
            gameMode: this.config.gameDeviceMode,
            finalScore: scores.humanPlayer,
            wildCardCount: this.config.wildCardCount,
            opponents: scores.aiPlayers,
            playedAt: new Date()
        });
    }

    async updateUserStats(userId, gameScore) {
        const userStatsRef = doc(db, 'userStats', userId);
        const userStats = await getDoc(userStatsRef);

        if (userStats.exists()) {
            const current = userStats.data();
            await updateDoc(userStatsRef, {
                gamesPlayed: current.gamesPlayed + 1,
                totalScore: current.totalScore + gameScore,
                averageScore: (current.totalScore + gameScore) / (current.gamesPlayed + 1),
                highScore: Math.max(current.highScore, gameScore),
                updatedAt: new Date()
            });
        }
    }

    initializeTournament() {
        console.log('🏆 from window.game.initializeTournament: Starting new tournament...');
        this.currentRound = 1;
        this.roundHistory = [];
        this.tournamentScores.clear();

        // Initialize tournament scores for all players
        for (let player of this.playerManager.players) {
            this.tournamentScores.set(player.name, 0);
        }
    }

async handleCountdown() {
    console.log('🔍 handleCountdown CALLED');
    const config = window.gameConfig?.config;
    console.log('🔍 countdownTime:', config?.countdownTime);

    const countdownTime = config.countdownTime || 0;

    if (countdownTime > 0) {
        showCountdownModal(countdownTime);

        for (let i = countdownTime; i > 0; i--) {
            updateCountdownNumber(i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        hideCountdownModal();
    }
}

}

// this function is used to update GameChipDisplay for table screeb and game screen
function updateGameChipDisplays() {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;

    // Player chips listener
    const encodedEmail = currentUser.email.replace(/\./g, ',').replace(/@/g, '_at_');
    firebase.database().ref(`players/${encodedEmail}`).on('value', (snapshot) => {
        const data = snapshot.val() || {};
        const chips = data.chips || 0;
        const reloads = data.reloads || 0;

        document.querySelectorAll('.user-chips-display').forEach(span => {
            span.innerHTML = `👤 ${currentUser.email} | 💰 ${chips.toLocaleString()} chips | 🔄 ${reloads} reloads`;
        });
    });

    // Pot listener
    const tableId = window.game?.currentTableId;
    if (tableId) {
        firebase.database().ref(`tables/${tableId}/pot`).on('value', (snapshot) => {
            const pot = snapshot.val() || 0;
            document.querySelectorAll('.pot-display').forEach(span => {
                span.innerHTML = `🏆 Pot: ${pot.toLocaleString()} chips`;
            });
        });
    }
}


document.addEventListener('DOMContentLoaded', () => {
    game = new PyramidPoker();

    // Add safety check for loadVersionInfo
    if (typeof loadVersionInfo === 'function') {
        loadVersionInfo();
    } else {
        console.warn('loadVersionInfo function not available');
    }
});
