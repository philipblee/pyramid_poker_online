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
        this.automaticHands = new Map(); // Track which players submitted automatics
        this.sidebarVisible = false;

        // NEW: Round tracking
        this.currentRound = 0;          // 0 = no game started, 1-3 = active rounds
        this.maxRounds = gameConfig.config.rounds;             // Tournament limit
        this.roundHistory = [];         // Store completed round data
        this.tournamentScores = new Map(); // Running totals across rounds
        this.initializeEventListeners();
        this.surrenderDecisions = new Map(); // playerName -> 'play' or 'surrender'
        updateDisplay(this);
        createParticles();
    }

    // Getters for backward compatibility
    get players() { return this.playerManager.players; }
    get currentPlayerIndex() { return this.playerManager.currentPlayerIndex; }
    get scores() { return this.playerManager.getAllScores(); }
    get deck() { return this.deckManager.deck; }

    initializeEventListeners() {

        document.getElementById('autoArrange').addEventListener('click', () => this.handleAutoArrangeToggle());
        document.getElementById('sortByRank').addEventListener('click', () => resetAndSortByRank(this));
        document.getElementById('sortBySuit').addEventListener('click', () => resetAndSortBySuit(this));
        document.getElementById('submitHand').addEventListener('click', () => this.submitCurrentHand());

        // Find Automatics button (may not exist on all pages)
        const detectAutomaticsBtn = document.getElementById('detectAutomatics');
        if (detectAutomaticsBtn) {
            console.log('🔧 Attaching detectAutomatics listener');
            detectAutomaticsBtn.addEventListener('click', () => {
                console.log('🔧 Button clicked, currentAutomatic:', window.currentAutomatic);
                if (window.currentAutomatic) {
                    window.playAutomatic();
                } else {
                    window.detectAutomatics();
                }
            });
        }

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
            document.getElementById('autoArrange').textContent = 'BEST';
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
                    document.getElementById('autoArrange').textContent = 'Undo BEST';

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

        // Deep copy to restore original state including wild cards
        playerData.cards = playerData.originalCards.map(card => ({...card}));
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

        // Clear surrender decisions from previous round
        if (this.surrenderDecisions) {
            this.surrenderDecisions.clear();
        }

        // Clear automatic hands from previous game
        if (this.automaticHands) {
            this.automaticHands.clear();
        }

        hideDecisionButtons();

        // Set multiDeviceMode based on gameConfig
        this.multiDeviceMode = window.gameConfig?.config?.gameDeviceMode === 'multi-device';

        // Add this when a new game starts
        resetGameTimer();

        // Ensure we have players
        const playersAdded = this.playerManager.ensurePlayersExist();
        if (playersAdded) {
            updateDisplay(this);
        }

        try {
            this.playerManager.validateMinimumPlayers();
        } catch (error) {
            alert(error.message);
            return;
        }

        // NEW: Collect antes
        await this.collectAntes();

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
        this.tableState = TABLE_STATES.DEALING; // Add this - parallel tracking
        window.resetAutomaticButton()
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

        // Show appropriate buttons based on state
        if (this.tableState === TABLE_STATES.DECIDE_PLAYING) {
            showDecisionButtons();
        } else {
            hideDecisionButtons();
        }

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


        // Clear surrender decisions from previous round
        if (this.surrenderDecisions) {
            this.surrenderDecisions.clear();
            console.log('🧹 Cleared local surrender decisions for new round');
        }

        // Clear Firebase decisions (for multi-player)
        if (window.isOwner && window.multiDeviceIntegration) {
            const tableId = window.multiDeviceIntegration.tableId;  // ← ADD THIS
            await firebase.database()
                .ref(`tables/${tableId}/surrenderDecisions`)
                .remove();

            console.log('🧹 Cleared Firebase surrender decisions for new round');

            // After clearing Firebase surrender decisions
            if (typeof window.cleanupDecisionListener === 'function') {
                window.cleanupDecisionListener();
            }
        }

        hideDecisionButtons();

        // NEW: Collect antes
        await this.collectAntes();

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
        if (this.automaticHands) {
            this.automaticHands.clear();
        }

        // IN startNewRound() method, ADD this block after the card dealing loop:

        await this.dealCardsToAllPlayers();
        resetAutomaticButton();

        // Only load hand immediately for owner/single-player AND not kitty variant
        // Multi-device kitty uses state machine, everything else loads immediately
        const skipLoad = this.multiDeviceMode && gameConfig.config.gameVariant === 'kitty';

        if (!skipLoad && (!this.multiDeviceMode || window.isOwner)) {
            this.loadCurrentPlayerHand();
        }

        updateDisplay(this);

        // Add at end of startNewRound()
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
                    originalCards: hand.map(card => ({...card})),
                    back: [],
                    middle: [],
                    front: []
                });
                player.ready = false;
            }

            // After dealing completes, set appropriate state
            if (!this.multiDeviceMode) {
                if (gameConfig.config.gameVariant === 'kitty') {
                    this.tableState = TABLE_STATES.DECIDE_PLAYING;
                } else {
                    this.tableState = TABLE_STATES.PLAYING;
                }
            }
            // Multi-device already handles tableState via Firebase

        if (this.multiDeviceMode && window.multiDeviceIntegration) {
            if (window.isOwner) {
                // Owner: Sync hands immediately, then signal ready
                await window.multiDeviceIntegration.storeAllHandsToFirebase();
                console.log('✅ Owner synced all hands to Firebase');
                await setTableState(TABLE_STATES.HANDS_DEALT);
            }
            // Non-owner: Do nothing - will wait for HANDS_DEALT state
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

    // if player surrenders, skip his turn
    skipSurrenderedPlayer() {
        const currentPlayer = this.playerManager.getCurrentPlayer();

        // Mark as submitted (with empty hands)
        this.submittedHands.set(currentPlayer.name, {
            name: currentPlayer.name,
            surrendered: true,
            front: [],
            middle: [],
            back: []
        });

        // Move to next player
        this.playerManager.advanceToNextPlayer();

        // Check if all active players submitted
        if (this.checkAllActivePlayersSubmitted()) {
            this.handleAllPlayersSubmitted();
        } else {
            this.loadCurrentPlayerHand(); // Load next player
        }
    }

    // load all current playerHand (added the gameVariant === 'kitty')
    loadCurrentPlayerHand() {

        // Allow loading during DECIDE_PLAYING for kitty variant
        const isDecisionPhase = this.tableState === TABLE_STATES.DECIDE_PLAYING;

        if (this.gameState !== 'playing' && !isDecisionPhase) return;

        const currentPlayer = this.playerManager.getCurrentPlayer();

        // 🔧 Check surrender based on actual player in multi-device mode
        const playerToCheck = this.multiDeviceMode ? window.uniquePlayerName : currentPlayer.name;

        // Check if player surrendered - skip their turn
        if (this.surrenderDecisions && this.surrenderDecisions.get(currentPlayer.name) === 'surrender') {

            // Mark as submitted with empty hands
            this.submittedHands.set(currentPlayer.name, {
                back: [],
                middle: [],
                front: [],
                surrendered: true
            });

            this.playerManager.setPlayerReady(currentPlayer.name, true);
            this.playerManager.nextPlayer();

            // Check if all done
            if (this.playerManager.areAllPlayersReady()) {
                this.calculateScores();
                this.gameState = 'scoring';
            } else {
                this.loadCurrentPlayerHand(); // Recursive - load next player
            }

            updateDisplay(this);
            return;
        }

        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        // Clear display
        document.getElementById('playerHand').innerHTML = '';
        document.getElementById('backHand').innerHTML = '';
        document.getElementById('middleHand').innerHTML = '';
        document.getElementById('frontHand').innerHTML = '';

        // Determine how many cards to show
        let cardsToDisplay = playerData.cards;  // ← KEEP THIS LINE!

        const isKittyVariant = gameConfig.config.gameVariant === 'kitty';

        const shouldShowLimited = isDecisionPhase ||
            (isKittyVariant && (this.tableState === TABLE_STATES.DEALING || this.tableState === TABLE_STATES.HANDS_DEALT));

        resetAutomaticButton();

        if (shouldShowLimited) {
            cardsToDisplay = playerData.cards.slice(0, 13);
        }

        // Show appropriate buttons based on state
        if (this.tableState === TABLE_STATES.DECIDE_PLAYING) {
            showDecisionButtons();
        } else if (gameConfig.config.gameVariant === 'kitty' &&
                  (this.tableState === TABLE_STATES.HANDS_DEALT ||
                   this.tableState === TABLE_STATES.DEALING)) {
            // Don't change buttons during transition states - keep decision buttons
            console.log('⏭️ Keeping decision buttons during transition');
        } else {
            hideDecisionButtons();
        }

        // Display cards
        displayCards(cardsToDisplay, 'playerHand');
        displayCards(playerData.back, 'backHand');
        displayCards(playerData.middle, 'middleHand');
        displayCards(playerData.front, 'frontHand');

        this.validateHands();

        // Add the guard to prevent multiple AI turns
        // At the END of loadCurrentPlayerHand(), replace the guard:
        if (currentPlayer.type === 'ai') {

            if (!currentPlayer.isReady && !currentPlayer.aiTurnInProgress) {
                console.log('✅ Guard passed - triggering AI turn');
                currentPlayer.aiTurnInProgress = true;
                this.handleAITurn();
            } else {
            }
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
                originalCards: hand.map(card => ({...card})),
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
            } else {
                // Another AI turn - keep buttons disabled
            }

}, 1200);

    }

    submitAIPlayerHand() {
        // For AI players, add a small delay to let DOM update after auto-arrange
        setTimeout(() => {
            this.submitCurrentHand(); // Uses validateHands() + working flow
        }, 150); // Small delay for DOM updates
    }

    moveCard(cardId, sourceId, targetHand) {
        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);
        if (!playerData) return;

        const sourceKey = getHandKey(sourceId);
        const sourceArray = sourceKey === 'cards' ? playerData.cards : playerData[sourceKey];
        const cardIndex = sourceArray.findIndex(c => c.id === cardId);
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

        // Move the ACTUAL card object, not stale JSON
        const actualCard = sourceArray.splice(cardIndex, 1)[0];
        targetArray.push(actualCard);

        // Clear sorted flag for both source and target hands
        if (sourceKey === 'back') playerData.backSorted = false;
        if (sourceKey === 'middle') playerData.middleSorted = false;
        if (sourceKey === 'front') playerData.frontSorted = false;
        if (targetKey === 'back') playerData.backSorted = false;
        if (targetKey === 'middle') playerData.middleSorted = false;
        if (targetKey === 'front') playerData.frontSorted = false;

        this.loadCurrentPlayerHand();
    }

    sortHandByStrength(cards, handStrength) {
        const sorted = [...cards];
        const handType = handStrength.handType;

        // Helper to get card value
        const getCardValue = (card) => {
            const values = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
            return values[card.rank] || card.value || 0;
        };

        if (handType >= 9) {
            // Straight Flush / Royal Flush
            return sorted.sort((a, b) => getCardValue(b) - getCardValue(a));
        } else if (handType === 8 || handType === 7 || handType === 4 ||
                   handType === 3 || handType === 2) {
            // Four of a Kind / Full House
            const rankGroups = {};
            sorted.forEach(card => {
                const rank = card.rank;
                if (!rankGroups[rank]) rankGroups[rank] = [];
                rankGroups[rank].push(card);
            });

            const groups = Object.entries(rankGroups)
                .sort((a, b) => {
                    if (b[1].length !== a[1].length) return b[1].length - a[1].length;
                    return getCardValue(b[1][0]) - getCardValue(a[1][0]);
                });

            return groups.flatMap(([rank, cardGroup]) =>
                cardGroup.sort((a, b) => getCardValue(b) - getCardValue(a))
            );
        } else {
//            console.log('Input cards:', sorted.map(c => ({rank: c.rank, value: c.value, computed: getCardValue(c)})));
            return sorted.sort((a, b) => {
                const valA = getCardValue(a);
                const valB = getCardValue(b);
                const result = valB - valA;
//                console.log(`Comparing ${a.rank}(${valA}) vs ${b.rank}(${valB}) = ${result}`);
                return result;
            });
        }
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

        // Check for unassigned wild cards
        const allPlayerCards = [
            ...playerData.cards,
            ...playerData.back,
            ...playerData.middle,
            ...playerData.front
        ];

        const hasUnassignedWilds = allPlayerCards.some(card => card.isWild);

        if (hasUnassignedWilds) {
            submitBtn.disabled = true;
            const automaticBtn = document.getElementById('playAutomatic');
            if (automaticBtn) automaticBtn.disabled = true;

            // Show warning message
            if (statusDiv) {
                statusDiv.innerHTML = `<span style="color: #ff6b6b;">⚠️ Please assign all wild cards before submitting!</span>`;
            }
            return; // Exit early
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

            // Sort complete hands by strength
            playerData.back = this.sortHandByStrength(playerData.back, backStrength);
            playerData.middle = this.sortHandByStrength(playerData.middle, middleStrength);
            playerData.front = this.sortHandByStrength(playerData.front, frontStrength);

            // Re-render the sorted cards
            const backHand = document.getElementById('backHand');
            const middleHand = document.getElementById('middleHand');
            const frontHand = document.getElementById('frontHand');

            backHand.innerHTML = '';
            middleHand.innerHTML = '';
            frontHand.innerHTML = '';

            playerData.back.forEach(card => backHand.appendChild(createCardElement(card, 'back')));
            playerData.middle.forEach(card => middleHand.appendChild(createCardElement(card, 'middle')));
            playerData.front.forEach(card => frontHand.appendChild(createCardElement(card, 'front')));

            // Mark as sorted
            playerData.backSorted = true;
            playerData.middleSorted = true;
            playerData.frontSorted = true;


            // Validate hand order (Back >= Middle >= Front)
            const backTuple = backStrength.handStrength;
            const middleTuple = middleStrength.handStrength;
            const frontTuple = frontStrength.handStrength;

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
            backStrengthEl.textContent = `${backStrength.name} (sorted)  -   ${backPoints} Points`;
            backStrengthEl.style.color = '#FFFF00';
            backStrengthEl.style.fontWeight = 'bold';
            backStrengthEl.style.fontSize = '16px';

            middleStrengthEl.textContent = `${middleStrength.name} (sorted) -  ${middlePoints} Points`;
            middleStrengthEl.style.color = '#FFFF00';
            middleStrengthEl.style.fontWeight = 'bold';
            middleStrengthEl.style.fontSize = '16px';

            frontStrengthEl.textContent = `${frontStrength.name} (sorted) -  ${frontPoints} Points`;
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

                // Check PLAY-A button state
                const playABtn = document.getElementById('playAutomatic');
                if (playABtn) {
                    const arrangement = {
                        back: playerData.back,
                        middle: playerData.middle,
                        front: playerData.front
                    };

                    const automatic = validateAutomaticArrangement(arrangement);
                    const handsNotEmpty = playerData.back.length > 0 && playerData.middle.length > 0 && playerData.front.length > 0;
                    playABtn.disabled = !(automatic && handsNotEmpty);
                    // Check FIND-AUTO button state
                    const detectAutoBtn = document.getElementById('detectAutomatics');
                    if (detectAutoBtn) {
                        detectAutoBtn.style.display =
                            (gameConfig.config.findAutoEnabled === 'yes') ? 'inline-block' : 'none';
                    }
                }

                const readyCount = this.playerManager.getReadyCount();
                statusDiv.innerHTML = `Round ${this.currentRound} of ${this.maxRounds}.  Player ${currentPlayer.name}'s turn - <span style="color: #4ecdc4; font-weight: bold;">✓ SETUP VALID</span>`;
            } else {
                // Invalid order
                backHand.classList.add('invalid');
                middleHand.classList.add('invalid');
                frontHand.classList.add('invalid');
                submitBtn.disabled = true;
                const automaticBtn = document.getElementById('detectAutomatics'); // CHANGED
                if (automaticBtn) automaticBtn.disabled = true; // null check already there

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
            const automaticBtn = document.getElementById('playAutomatic');
            if (automaticBtn) automaticBtn.disabled = true;
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

    validateAutomaticArrangement(type, arrangement) {
        const { front, middle, back } = arrangement;

        switch(type) {
            case 'dragon':
                return this.validateDragonArrangement(front, middle, back);
            case 'three-flush':
                return this.validateThreeFlushArrangement(front, middle, back);
            case 'three-full-houses':
                return this.validateThreeFullHousesArrangement(front, middle, back);
            case 'three-straight':
                return this.validateThreeStraightArrangement(front, middle, back);
            default:
                return false;
        }
    }

    validateDragonArrangement(front, middle, back) {
        const allCards = [...back, ...middle, ...front];
        const ranks = new Set();
        allCards.forEach(card => {
            if (!card.isWild) ranks.add(card.rank);
        });
        return ranks.size === 13; // Must have all 13 unique ranks
    }

    validateThreeFlushArrangement(front, middle, back) {
        // Check each row is 5 cards of same suit
        const checkFlush = (hand) => {
            if (hand.length !== 5) return false;
            const suits = new Set();
            hand.forEach(card => {
                if (!card.isWild) suits.add(card.suit);
            });
            return suits.size === 1; // All same suit (wilds don't count)
        };
        return checkFlush(back) && checkFlush(middle) && checkFlush(front);
    }

    validateThreeFullHousesArrangement(front, middle, back) {
        // Check each row forms a full house
        const checkFullHouse = (hand) => {
            const strength = evaluateHand(hand);
            return strength.handType === 7; // Full house = 7
        };
        return checkFullHouse(back) && checkFullHouse(middle) && checkFullHouse(front);
    }

    validateThreeStraightArrangement(front, middle, back) {
        // Check each row forms a straight
        const checkStraight = (hand) => {
            const strength = evaluateHand(hand);
            return strength.handType >= 5; // Straight = 5, Straight Flush = 9
        };
        return checkStraight(back) && checkStraight(middle) && checkStraight(front);
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

    disableAllGameButtons() {
        console.log('🔒 disableAllGameButtons() CALLED');

        // Only disable card-arrangement buttons, not game-flow buttons
        const buttonsToDisable = [
            'autoArrange',
            'sortByRank',
            'sortBySuit',
            'reorderRank',
            'reorderSuit',
            'submitHand',
            'detectAutomatics',
            'playAutomatic'
        ];

        buttonsToDisable.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = true;
//                button.style.display = 'none';  // ✅ ADD THIS - HIDE COMPLETELY
            }
        });
    }

    async playAutomatic() {
        // Check if automatics are allowed
        if (gameConfig.config.automaticsAllowed !== 'yes') {
            return;
        }

        // Validate hands first
        if (!this.validateHands()) {
            return;
        }

        // For multiplayer: always use player 0's hand (local player)
        const localPlayerName = this.players[0].name;
        const playerData = this.playerHands.get(localPlayerName);

        if (!playerData) return;

        // Check if this is actually an automatic
        const arrangement = {
            back: playerData.back,
            middle: playerData.middle,
            front: playerData.front
        };
        const automatic = validateAutomaticArrangement(arrangement);

        if (!automatic) {
            alert('This hand does not qualify as an automatic.');
            return;
        }

        // For multiplayer, use uniquePlayerName; for single-player use currentPlayer
        const playerName = gameConfig.config.gameConnectMode === 'online'
            ? window.uniquePlayerName
            : this.playerManager.getCurrentPlayer().name;

        // Store as automatic WITH UNIQUE NAME
        this.submittedHands.set(playerName, {
            back: [...playerData.back],
            middle: [...playerData.middle],
            front: [...playerData.front]
        });
        this.automaticHands.set(playerName, automatic);

        // 🆕 ADD THIS LINE
        this.disableAllGameButtons();

        this.playerManager.setPlayerReady(localPlayerName, true);

        // NEW: For multiplayer, use Firebase coordination
        if (gameConfig.config.gameConnectMode === 'online') {
            await window.multiDeviceIntegration.storePlayerArrangementToFirebase(playerName, true);

            // 🆕 ADD THIS LINE HERE TOO
            this.disableAllGameButtons();

            const autoBtn = document.getElementById('detectAutomatics');
            if (autoBtn) {
                autoBtn.disabled = true;
                autoBtn.textContent = 'Submitted ✓';
            }

            if (await window.multiDeviceIntegration.isTableOwner()) {
                await window.multiDeviceIntegration.checkAllPlayersSubmitted();
            }

            return; // Exit early for multiplayer
        }

        // Single-player logic continues below
        this.playerManager.nextPlayer();

        // Reset auto button for next turn
        this.autoArrangeUsed = false;
        document.getElementById('autoArrange').textContent = 'BEST';

        const detectAutomaticsBtn = document.getElementById('detectAutomatics');
        if (detectAutomaticsBtn) {
            resetAutomaticButton();
        }

        if (this.playerManager.areAllPlayersReady()) {
            this.calculateScores();
            this.gameState = 'scoring';
        } else {
            const currentPlayer = this.playerManager.getCurrentPlayer();
            this.loadCurrentPlayerHand();
        }


        updateDisplay(this);
    }

    submitCurrentHand() {
        console.log('🎯 submitCurrentHand() CALLED'); // ADD THIS
        // Replace validation with the good function
        if (!this.validateHands()) {
            return; // Don't submit if validation failed
        }

        // 🆕 ADD THIS LINE
        this.disableAllGameButtons();

        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        this.submittedHands.set(currentPlayer.name, {
            back: [...playerData.back],
            middle: [...playerData.middle],
            front: [...playerData.front]
        });

        // Clear any automatic flag for this player (they submitted normally)
        this.automaticHands.delete(currentPlayer.name);

        this.playerManager.setPlayerReady(currentPlayer.name, true);
        this.playerManager.nextPlayer();


        // Reset auto button for next turn (always happens after submit)
        this.autoArrangeUsed = false;
        document.getElementById('autoArrange').textContent = 'BEST';

        const detectAutomaticsBtn = document.getElementById('detectAutomatics'); // CHANGED - added 's'
        if (detectAutomaticsBtn) {
            detectAutomaticsBtn.disabled = false;
        }

        if (this.playerManager.areAllPlayersReady()) {
            this.calculateScores();
            this.gameState = 'scoring';
        } else {
            this.loadCurrentPlayerHand();
        }

        updateDisplay(this);
    }

    async calculateScores() {

        const allPlayerNames = this.playerManager.getPlayerNames();

       // Filter out surrendered players from scoring
        const playerNames = allPlayerNames.filter(name => {
            const decision = this.surrenderDecisions?.get(name);
            return decision !== 'surrender';
        });

        console.log(`📊 Scoring ${playerNames.length} active players
            (${allPlayerNames.length - playerNames.length} surrendered)`);

        const roundScores = new Map();
        const detailedResults = [];
        const bonusPoints = new Map();

        // Initialize round scores
        playerNames.forEach(name => {
            roundScores.set(name, 0);
            bonusPoints.set(name, 0);
        });

        // Handle automatics if allowed
        let automaticPlayers = [];
        let regularPlayers = [];

        if (gameConfig.config.automaticsAllowed === 'yes') {
            automaticPlayers = playerNames.filter(name => this.automaticHands.has(name));
            regularPlayers = playerNames.filter(name => !this.automaticHands.has(name));

            if (automaticPlayers.length > 0) {
                if (automaticPlayers.length === 1) {
                    const automaticPlayer = automaticPlayers[0];
                    const automaticPoints = 3 * regularPlayers.length;

                    roundScores.set(automaticPlayer, roundScores.get(automaticPlayer) + automaticPoints);

                    regularPlayers.forEach(regularPlayer => {
                        roundScores.set(regularPlayer, roundScores.get(regularPlayer) - 3);
                    });

                    console.log(`🎯 ${automaticPlayer} wins ${automaticPoints} points for automatic`);

                    // DON'T ADD detailedResults - causes UI errors
                } else {
                    this.handleMultiAutomatics(automaticPlayers, roundScores, detailedResults);
                }
            }
        } else {
            regularPlayers = [...playerNames];
        }

        for (let i = 0; i < regularPlayers.length; i++) {
            for (let j = i + 1; j < regularPlayers.length; j++) {
                const player1 = regularPlayers[i];
                const player2 = regularPlayers[j];

                // Check if automatics are enabled AND either player has one
                const automaticsEnabled = gameConfig.config.automaticsAllowed === 'yes';
                const player1HasAuto = automaticsEnabled && automaticPlayers.includes(player1);
                const player2HasAuto = automaticsEnabled && automaticPlayers.includes(player2);

                if (player1HasAuto || player2HasAuto) {
                    // Get automatic info for both players
                    const hand1 = this.submittedHands.get(player1);
                    const hand2 = this.submittedHands.get(player2);
                    const auto1 = player1HasAuto ? this.automaticHands.get(player1) : null;
                    const auto2 = player2HasAuto ? this.automaticHands.get(player2) : null;

                    if (auto1 && auto2 && auto1.type === auto2.type) {
                        // SAME automatic - fall through to normal comparison
                        console.log(`🔄 Both have ${auto1.type} - doing normal comparison`);
                    } else {
                        // Different automatics OR one automatic vs regular
                        // Skip hand comparison - automatic bonus already applied above
                        console.log(`⚡ Skipping ${player1} vs ${player2} - automatic played`);

                        // Create result for UI showing automatic winner
                        detailedResults.push({
                            player1,
                            player2,
                            player1Score: auto1 ? 3 : -3,
                            player2Score: auto2 ? 3 : -3,
                            details: [{
                                hand: 'Back',
                                winner: auto1 ? 'player1' : 'player2',
                                automatic: true
                            }, {
                                hand: 'Middle',
                                winner: auto1 ? 'player1' : 'player2',
                                automatic: true
                            }, {
                                hand: 'Front',
                                winner: auto1 ? 'player1' : 'player2',
                                automatic: true
                            }],
                            automaticType: auto1?.type || auto2?.type
                        });

                        continue;
                    }
                }

                // Normal hand comparison
                const hand1 = this.submittedHands.get(player1);
                const hand2 = this.submittedHands.get(player2);

                const result = compareHands(hand1, hand2);

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

        // NEW: Only store round history ONCE per round
        const roundAlreadyStored = this.roundHistory.some(round => round.roundNumber === this.currentRound);

//        console.log('🔍 After roundAlreadyStored check - this.maxRounds:', this.maxRounds);

        if (!roundAlreadyStored) {
            const roundData = {
                roundNumber: this.currentRound,
                roundScores: new Map(roundScores),
                chipChanges: new Map(this.lastRoundChipChanges || new Map()),  // ADD THIS
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

        // In calculateScores(), after generating detailed results
        window.game.detailedResults = detailedResults; // Store for later extraction

        await showScoringPopup(this, detailedResults, roundScores, new Map());

        updateDisplay(this);

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

    comparePlayerHands(player1Name, player2Name) {
        // Get hands from submittedHands
        const hand1 = this.submittedHands.get(player1Name);
        const hand2 = this.submittedHands.get(player2Name);

        if (!hand1 || !hand2) {
            console.error('❌ Missing hands for comparison:', player1Name, player2Name);
            return { p1Score: 0, p2Score: 0, details: [] };
        }

        // Use the existing compareHands function
        const result = compareHands(hand1, hand2);

        // Return in the format expected by handleMultiAutomatics
        return {
            p1Score: result.player1Score,
            p2Score: result.player2Score,
            player1Score: result.player1Score,  // ADD THIS
            player2Score: result.player2Score,  // ADD THIS
            player1: player1Name,
            player2: player2Name,
            details: result.details
        };
    }

    handleMultiAutomatics(automaticPlayers, roundScores, detailedResults) {
        console.log('🎯 Multiple automatics detected:', automaticPlayers);

        // Rank automatics by strength
        const automaticRanking = {
            'three-full-houses': 4,
            'dragon': 3,
            'three-flush': 2,
            'three-straight': 1
        };

        // Group players by automatic type
        const byType = {};
        automaticPlayers.forEach(player => {
            const automatic = this.automaticHands.get(player);
            const type = automatic.type;
            if (!byType[type]) byType[type] = [];
            byType[type].push(player);
        });

        // Find highest automatic type
        const types = Object.keys(byType).sort((a, b) => automaticRanking[b] - automaticRanking[a]);
        const highestType = types[0];
        const winners = byType[highestType];

        // If one clear winner (highest automatic type, alone)
        if (winners.length === 1 && types.length > 1) {
            const winner = winners[0];
            const losers = automaticPlayers.filter(p => p !== winner);

            roundScores.set(winner, roundScores.get(winner) + (3 * losers.length));
            losers.forEach(loser => {
                roundScores.set(loser, roundScores.get(loser) - 3);
            });

            console.log(`🏆 ${winner} wins with ${highestType} automatic (+${3 * losers.length} points)`);
        } else {
            // Multiple players with same highest automatic - compare head-to-head
            console.log(`⚖️ ${winners.length} players with ${highestType} - comparing hands head-to-head`);

            // Compare all pairs of automatic winners
            for (let i = 0; i < winners.length; i++) {
                for (let j = i + 1; j < winners.length; j++) {
                    const p1 = winners[i];
                    const p2 = winners[j];

                    const comparison = this.comparePlayerHands(p1, p2);

                    // Automatics use flat 1 point per hand, not position-weighted
                    let p1FlatScore = 0;
                    let p2FlatScore = 0;

                    comparison.details.forEach(detail => {
                        if (detail.winner === 'player1') {
                            p1FlatScore++; p2FlatScore--;
                            detail.player1Points = 1;
                            detail.player2Points = -1;
                        } else if (detail.winner === 'player2') {
                            p2FlatScore++; p1FlatScore--;
                            detail.player1Points = -1;
                            detail.player2Points = 1;
                        } else {
                            detail.player1Points = 0;
                            detail.player2Points = 0;
                        }
                    });

                    roundScores.set(p1, roundScores.get(p1) + p1FlatScore);
                    roundScores.set(p2, roundScores.get(p2) + p2FlatScore);

                    // Update scores for display consistency
                    comparison.p1Score = p1FlatScore;
                    comparison.p2Score = p2FlatScore;
                    comparison.player1Score = p1FlatScore;
                    comparison.player2Score = p2FlatScore;

                    if (detailedResults) {
                        detailedResults.push(comparison);
                    }
                }
            }

            // Lower-ranked automatics lose -3 to each winner
            if (types.length > 1) {
                const losers = types.slice(1).flatMap(type => byType[type]);
                losers.forEach(loser => {
                    roundScores.set(loser, roundScores.get(loser) - (3 * winners.length));
                });
                winners.forEach(winner => {
                    roundScores.set(winner, roundScores.get(winner) + (3 * losers.length));
                });
            }
        }

        // Apply ALL automatics against non-automatic players
        const allPlayers = Array.from(roundScores.keys());
        const nonAutomaticPlayers = allPlayers.filter(p => !automaticPlayers.includes(p));

        if (nonAutomaticPlayers.length > 0) {
            console.log(`⚔️ Applying ${automaticPlayers.length} automatics against ${nonAutomaticPlayers.length} normal players`);

            automaticPlayers.forEach(autoPlayer => {
                nonAutomaticPlayers.forEach(normalPlayer => {
                    // Automatic hands (both wins AND losses) beat normal hands
                    roundScores.set(autoPlayer, roundScores.get(autoPlayer) + 3);
                    roundScores.set(normalPlayer, roundScores.get(normalPlayer) - 3);

                    console.log(`  ${autoPlayer} (automatic) beats ${normalPlayer} (normal): +3/-3`);
                });
            });
        }
    }

    showTournamentSummary() {
        console.log('🏆 Showing tournament summary...');
        console.log('📊 roundHistory.length:', this.roundHistory.length);
        console.log('📊 Full roundHistory:', JSON.stringify(this.roundHistory, null, 2));

        console.log('📊 TOURNAMENT SUMMARY DATA:');
        console.log('  - roundHistory.length:', this.roundHistory.length);
        this.roundHistory.forEach((round, idx) => {
            console.log(`  - Round ${idx + 1}: roundNumber=${round.roundNumber}, hasChipChanges=${!!round.chipChanges}`);
        });

        // Calculate cumulative chip changes from all completed rounds
        const chipTotals = new Map();
        this.playerManager.players.forEach(player => {
            chipTotals.set(player.name, 0);
        });

        this.roundHistory.forEach(roundData => {
            if (roundData.chipChanges) {
                roundData.chipChanges.forEach((chipChange, playerName) => {
                    const current = chipTotals.get(playerName) || 0;
                    chipTotals.set(playerName, current + chipChange);
                });
            }
        });

        // Create sorted tournament standings by chip changes
        const standings = [...chipTotals.entries()]
            .sort((a, b) => b[1] - a[1])
            .map((entry, index) => ({
                position: index + 1,
                playerName: entry[0],
                totalChipChange: entry[1]
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
            const color = standing.totalChipChange >= 0 ? '#4ecdc4' : '#ff6b6b';
            html += `
                <div style="background: ${bgColor}; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 16px;">${medal} ${standing.position}. ${standing.playerName}</span>
                    <span style="font-size: 14px; font-weight: bold; color: ${color};">${standing.totalChipChange > 0 ? '+' : ''}${standing.totalChipChange}</span>
                </div>
            `;
        });

        html += `</div><div style="background: rgba(52, 73, 94, 0.5); padding: 20px; border-radius: 10px; margin-bottom: 24px;">
            <h3 style="color: #4ecdc4; margin-bottom: 15px;">Round-by-Round Breakdown</h3>
        `;

        for (let round = 1; round <= this.roundHistory.length; round++) {
            const roundData = this.roundHistory[round - 1];
            html += `<div style="margin-bottom: 15px;"><h4 style="color: #ffd700;">Round ${round}</h4>`;

            if (roundData.chipChanges) {
                roundData.chipChanges.forEach((chipChange, playerName) => {
                    const sign = chipChange > 0 ? '+' : '';
                    const color = chipChange > 0 ? '#4ecdc4' : chipChange < 0 ? '#ff6b6b' : '#95a5a6';
                    html += `<div style="color: ${color};">${playerName}: ${sign}${chipChange}</div>`;
                });
            }
            html += `</div>`;
        }

        html += `</div>`;

        const canReturn = gameConfig.config.gameDeviceMode !== 'multi-device' || window.isOwner;

        if (canReturn) {
            html += `
                <button onclick="game.returnToTable();"
                        style="background: #4ecdc4; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;">
                    Return to Table
                </button>
            `;
        } else {
            html += `
                <p style="color: #ffd700; margin-top: 20px; font-size: 16px;">
                    Waiting for table owner to continue...
                </p>
            `;
        }

        content.innerHTML = html;
        modal.appendChild(content);
        document.body.appendChild(modal);
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

    closeScoringPopup() {
        closeScoringPopup();
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
        // Clear decisions from previous tournament
        if (this.surrenderDecisions) {
            this.surrenderDecisions.clear();
        }

        // Clear Firebase decisions (owner only)
        if (this.multiDeviceMode && window.isOwner && this.currentTableId) {
            firebase.database().ref(`tables/${this.currentTableId}/surrenderDecisions`).remove();
        }

        this.currentRound = 1;
        this.roundHistory = [];
        this.tournamentScores.clear();

        // Initialize tournament scores for all players
        for (let player of this.playerManager.players) {
            this.tournamentScores.set(player.name, 0);
        }
    }

    async collectAntes() {
        const anteAmount = window.gameConfig?.config?.stakesAnteAmount || 0;

        if (anteAmount === 0) return;

        const tableId = window.game?.currentTableId;

        if (!tableId) {
            console.warn('No tableId for ante collection');
            return;
        }

        // Only owner collects all antes
        if (this.multiDeviceMode && !window.isOwner) return;

        const players = this.playerManager.players;
        const totalPot = players.length * anteAmount;

        // Deduct from each player
        for (const player of players) {
            let playerKey;
            if (player.type === 'ai') {
                playerKey = player.name;
            } else {
                // Human - encode email
                playerKey = player.name.replace(/\./g, ',').replace(/@/g, '_at_');
            }

            const result = await firebase.database().ref(`players/${playerKey}/chips`)
                .transaction(currentChips => (currentChips || 0) - anteAmount);

            // Also update lastKnownChips
            await firebase.database().ref(`players/${playerKey}/lastKnownChips`).set(result.snapshot.val());

        }

        // Set pot (not transaction - owner controls it)
        await firebase.database().ref(`tables/${tableId}/pot`).set(totalPot);

        console.log(`✅ Collected ${anteAmount} ante from ${players.length} players. Pot: ${totalPot}`);
    }

    async handleCountdown() {
        const config = window.gameConfig?.config;

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

        // Only update previous when chips actually change
        if (window.lastKnownChips !== undefined && window.lastKnownChips !== chips) {
            window.previousPlayerChips = window.lastKnownChips;
            window.lastChipChange = chips - window.lastKnownChips;
        }
        window.lastKnownChips = chips;

        let chipDisplay;
        if (window.previousPlayerChips !== undefined && window.lastChipChange !== undefined) {
            const sign = window.lastChipChange >= 0 ? '+' : '';
            chipDisplay = window.previousPlayerChips.toLocaleString() + ' ' + sign + window.lastChipChange.toLocaleString() + ' = ' + chips.toLocaleString() + ' chips';
        } else {
            chipDisplay = chips.toLocaleString() + ' chips';
        }

        document.querySelectorAll('.user-chips-display').forEach(span => {
            span.innerHTML = '👤 ' + currentUser.email + ' | 💰 ' + chipDisplay + ' | 🔄 ' + reloads + ' reloads';
        });
    });

    // Pot listener
    const tableId = window.game?.currentTableId;
    if (tableId) {
        firebase.database().ref(`tables/${tableId}/pot`).on('value', (snapshot) => {
            const pot = snapshot.val() || 0;
            window.game.currentPot = pot;  // ADD THIS
            document.querySelectorAll('.pot-display').forEach(span => {
                span.innerHTML = `🏆 Pot: ${pot.toLocaleString()} chips`;
            });
        });
    }
}

/**
 * Compare two dragons - 13 cards A-2, compare by suit from Ace down
 * @param {Object} hand1 - {back, middle, front}
 * @param {Object} hand2 - {back, middle, front}
 * @returns {string} - 'player1', 'player2', or 'tie'
 */
function compareDragons(hand1, hand2) {
    // Combine all cards from each dragon
    const dragon1Cards = [...hand1.back, ...hand1.middle, ...hand1.front];
    const dragon2Cards = [...hand2.back, ...hand2.middle, ...hand2.front];

    // Create rank->card map for each dragon
    const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    const dragon1Map = new Map();
    const dragon2Map = new Map();

    dragon1Cards.forEach(card => {
        if (!card.isWild) dragon1Map.set(card.rank, card);
    });
    dragon2Cards.forEach(card => {
        if (!card.isWild) dragon2Map.set(card.rank, card);
    });

    // Compare suits rank by rank (Ace first, then K, etc.)
    const suitOrder = ['♠', '♥', '♦', '♣'];

    for (const rank of ranks) {
        const card1 = dragon1Map.get(rank);
        const card2 = dragon2Map.get(rank);

        const suit1Index = suitOrder.indexOf(card1.suit);
        const suit2Index = suitOrder.indexOf(card2.suit);

        if (suit1Index < suit2Index) return 'player1';
        if (suit2Index < suit1Index) return 'player2';
        // If equal, continue to next rank
    }

    return 'tie'; // All suits matched
}

document.addEventListener('DOMContentLoaded', () => {
    game = new PyramidPoker();
    window.game = game;  // Expose globally

    // Add safety check for loadVersionInfo
    if (typeof loadVersionInfo === 'function') {
        loadVersionInfo();
    } else {
        console.warn('loadVersionInfo function not available');
    }
});
