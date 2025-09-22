// js/multiplayer/game-integration.js
// Bridge tournament sync with existing 6-player tournament system

class GameIntegration {
    constructor() {
        this.tournamentSync = null;
        this.tableManager = null;
        this.currentTableId = null;
        this.currentUserId = null;
        this.isMultiplayerMode = false;
        this.playerMappings = new Map(); // Maps Firebase player IDs to game player names
    }

    // Initialize with tournament components
    initialize(tournamentSync, tableManager) {
        this.tournamentSync = tournamentSync;
        this.tableManager = tableManager;
        this.currentTableId = tableManager.currentTable;
        this.currentUserId = tableManager.currentUser.id;
        this.isMultiplayerMode = true;

        // Connect tournament sync callbacks
        this.tournamentSync.gameIntegration = this;
        this.setupEventListeners();

        console.log('Game integration initialized for existing tournament system');
    }

    // Set up event listeners
    setupEventListeners() {
        this.tableManager.onTournamentStateChanged = this.onTournamentStateChanged.bind(this);
        this.tableManager.onPlayersChanged = this.onPlayersChanged.bind(this);
    }

    // Called when tournament state changes - start using existing game system
    onTournamentStateChanged(tournament) {
        if (!tournament) return;

        console.log('Tournament state changed - starting existing game system');

        if (tournament.round === 1 && !this.gameStarted) {
            this.startMultiplayerTournament();
            this.gameStarted = true;
        }
    }

    // Start tournament using existing game system
    async startMultiplayerTournament() {
        console.log('🎮 Starting multiplayer tournament with existing game system');

        // Get Firebase player data
        const tableDoc = await this.tableManager.tablesRef.doc(this.currentTableId).get();
        const tableData = tableDoc.data();
        const firebasePlayers = tableData.players;

        // Set up player mappings (Firebase ID → Game Name)
        this.setupPlayerMappings(firebasePlayers);

        // Start existing game system
        this.initializeExistingGameSystem();

        // Use existing startNewGame but override with Firebase players
        this.startGameWithFirebasePlayers(firebasePlayers);

        // Auto-arrange AI players
        this.autoArrangeAIPlayers();

        // Set up human player UI
        this.setupHumanPlayerUI();
    }

    // Map Firebase players to game system players
    setupPlayerMappings(firebasePlayers) {
        this.playerMappings.clear();
        const gamePlayerNames = ['Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6'];
        let aiPlayerIndex = 0;

        Object.entries(firebasePlayers).forEach(([firebaseId, playerData]) => {
            if (firebaseId === this.currentUserId) {
                // Human player is always "You"
                this.playerMappings.set(firebaseId, 'You');
                console.log(`Mapped Firebase ${playerData.name} (${firebaseId}) → Game You (HUMAN)`);
            } else {
                // AI players get sequential names
                const gameName = gamePlayerNames[aiPlayerIndex];
                this.playerMappings.set(firebaseId, gameName);
                console.log(`Mapped Firebase ${playerData.name} (${firebaseId}) → Game ${gameName} (AI)`);
                aiPlayerIndex++;
            }
        });
    }

    // Initialize existing game system
    initializeExistingGameSystem() {
        if (!window.game) {
            console.error('Game object not available');
            return;
        }

        // Ensure game is in correct state
        window.game.gameState = 'playing';
        window.game.currentRound = 1;
        window.game.submittedHands.clear();
        window.game.playerHands.clear();
    }

    // Start game with Firebase players using existing system
    startGameWithFirebasePlayers(firebasePlayers) {
        // Use existing startNewGame logic but adapt for Firebase players

        // Initialize game state
        window.game.gameState = 'playing';
        window.game.currentRound = 1;
        window.game.submittedHands.clear();
        window.game.playerHands.clear();

        // Ensure we have the right number of players in PlayerManager
        window.game.playerManager.ensurePlayersExist();

        // Create deck using existing system
        window.game.deckManager.createNewDeck();
        window.game.deckManager.shuffleDeck();

        // Deal cards using existing PlayerManager names
        const players = window.game.playerManager.players;
        const firebasePlayerIds = Object.keys(firebasePlayers);

        players.forEach((player, index) => {
            const hand = window.game.deckManager.dealCards(17);

            // Store in existing game format using PlayerManager names
            window.game.playerHands.set(player.name, {
                cards: hand,
                originalCards: [...hand],
                back: [],
                middle: [],
                front: []
            });

            // Map Firebase player to game player for later reference
            if (index < firebasePlayerIds.length) {
                const firebaseId = firebasePlayerIds[index];
                const firebasePlayerData = firebasePlayers[firebaseId];

                // Store mapping for later (submission, etc.)
                this.playerMappings.set(firebaseId, player.name);

                console.log(`Dealt 17 cards to ${player.name} (Firebase: ${firebasePlayerData.name})`);
            }
        });

        // Set current player to first player (human)
        window.game.playerManager.currentPlayerIndex = 0;

        // Load human player's cards into UI using existing system
        window.game.loadCurrentPlayerHand();

        // Update display
        if (typeof updateDisplay === 'function') {
            updateDisplay(window.game);
        }

        console.log('✅ Game started with existing PlayerManager system');
    }

    // Auto-arrange all AI players using existing system
    autoArrangeAIPlayers() {
        console.log('🤖 Auto-arranging AI players using PlayerManager names');

        const players = window.game.playerManager.players;

        players.forEach((player, index) => {
            // Skip human player (first player)
            if (index === 0 && player.type === 'human') {
                console.log(`👤 Skipping human player: ${player.name}`);
                return;
            }

            const playerHand = window.game.playerHands.get(player.name);
            if (!playerHand) {
                console.log(`❌ No hand found for ${player.name}`);
                return;
            }

            // Use existing auto-arrange system for AI only
            this.autoArrangePlayerHand(player.name, playerHand.cards);
        });

        console.log('✅ All AI players auto-arranged using PlayerManager system');
    }

    // Auto-arrange specific player using existing system
    autoArrangePlayerHand(playerName, cards) {
        try {
            // Use existing FindBestSetup system
            if (typeof FindBestSetup !== 'function') {
                console.error('FindBestSetup not available');
                return;
            }

            const setup = new FindBestSetup();
            const result = setup.findBestSetup(cards);

            if (result && result.arrangement && result.arrangement.isValid) {
                const arrangement = result.arrangement;

                // Store arrangement in existing game format
                window.game.playerHands.set(playerName, {
                    cards: cards,
                    originalCards: [...cards],
                    back: arrangement.back.cards || [],
                    middle: arrangement.middle.cards || [],
                    front: arrangement.front.cards || []
                });

                console.log(`✅ Auto-arranged ${playerName} - Back:${arrangement.back.cards?.length}, Middle:${arrangement.middle.cards?.length}, Front:${arrangement.front.cards?.length}`);
            } else {
                console.error(`❌ Failed to auto-arrange ${playerName} - Invalid arrangement`);
            }
        } catch (error) {
            console.error(`Error auto-arranging ${playerName}:`, error);
        }
    }

    // Set up UI for human player
    setupHumanPlayerUI() {
        // Show multiplayer status
        this.showMultiplayerStatus();

        // Override submit button to sync with Firebase
        this.setupMultiplayerSubmit();

        // Show timer
        this.showRoundTimer();
    }

    // Override submit button for multiplayer coordination
    setupMultiplayerSubmit() {
        const submitButton = document.getElementById('submitHand');
        if (!submitButton) return;

        // Store original submit handler
        const originalSubmit = submitButton.onclick;

        // Replace with multiplayer submit
        submitButton.onclick = async () => {
            try {
                // Use existing validation
                if (!this.isValidSubmission()) {
                    alert('Please arrange your cards properly before submitting');
                    return;
                }

                // Submit to Firebase
                await this.submitToFirebase();

                // Run existing tournament scoring
                this.runExistingTournamentScoring();

                // Show results
                this.showTournamentResults();

            } catch (error) {
                console.error('Error submitting arrangement:', error);
                alert('Error submitting. Please try again.');
            }
        };
    }

    // Check if submission is valid using existing system
    isValidSubmission() {
        const humanHand = window.game.playerHands.get('You');
        if (!humanHand) return false;

        // Use existing validation logic
        return humanHand.back.length > 0 &&
               humanHand.middle.length > 0 &&
               humanHand.front.length > 0;
    }

    // Submit arrangement to Firebase
    async submitToFirebase() {
        const humanHand = window.game.playerHands.get('You');

        const arrangement = {
            front: { cards: humanHand.front },
            middle: { cards: humanHand.middle },
            back: { cards: humanHand.back },
            timestamp: Date.now()
        };

        await this.tournamentSync.submitArrangement(arrangement);
        console.log('✅ Arrangement submitted to Firebase');
    }

    // Run existing tournament scoring system
    async runExistingTournamentScoring() {
        console.log('🏆 Running existing tournament scoring');

        // Phase 3: Retrieve all arrangements before scoring
        if (this.isMultiDevice) {
            await this.RetrieveAllArrangementsFromFirebase();
        }

        // Trigger existing scoring system
        if (window.game && typeof window.game.calculateScores === 'function') {
            window.game.calculateScores();
        } else {
            // Fallback: trigger submit logic
            this.triggerExistingScoring();
        }
    }

    // Trigger existing scoring logic
    triggerExistingScoring() {
        // Mark all players as submitted for existing system
        window.game.playerManager.players.forEach(player => {
            player.ready = true;
        });

        // Use existing scoring if available
        if (typeof calculateRoundScores === 'function') {
            calculateRoundScores(window.game);
        }
    }

    // Show tournament results using existing popup
    showTournamentResults() {
        // Use existing scoring popup
        if (typeof showScoringPopup === 'function') {
            // Get results from existing system
            const detailedResults = this.getDetailedResults();
            const roundScores = this.getRoundScores();

            showScoringPopup(window.game, detailedResults, roundScores, {});
        }
    }

    // Get detailed results from existing system
    getDetailedResults() {
        // Extract from existing game system
        const results = new Map();

        window.game.playerHands.forEach((hand, playerName) => {
            results.set(playerName, {
                back: hand.back,
                middle: hand.middle,
                front: hand.front
            });
        });

        return results;
    }

    // Get round scores from existing system
    getRoundScores() {
        // Use existing scoring system results
        return window.game.tournamentScores || new Map();
    }

    // Show multiplayer status
    showMultiplayerStatus() {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.innerHTML = '🌐 Multiplayer Tournament - Round 1';
        }
    }

    // Show round timer
    showRoundTimer() {
        // Add timer display to UI
        const timerHTML = '<div id="multiplayer-timer" style="font-size: 18px; color: #ff6b6b; margin: 10px;">⏱️ 3:00</div>';

        const controls = document.querySelector('.game-controls');
        if (controls && !document.getElementById('multiplayer-timer')) {
            controls.insertAdjacentHTML('afterend', timerHTML);
        }

        // Start countdown
        this.startTimerCountdown();
    }

    // Start timer countdown
    startTimerCountdown() {
        let timeLeft = 180; // 3 minutes

        const timerInterval = setInterval(() => {
            timeLeft--;

            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;

            const timerElement = document.getElementById('multiplayer-timer');
            if (timerElement) {
                timerElement.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;

                if (timeLeft <= 30) {
                    timerElement.style.color = '#ff0000';
                }
            }

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                this.handleTimeUp();
            }
        }, 1000);
    }

    // Handle time up
    handleTimeUp() {
        alert('⏰ Time is up! Your current arrangement will be submitted automatically.');

        // Force submit current state
        const submitButton = document.getElementById('submitHand');
        if (submitButton && !submitButton.disabled) {
            submitButton.click();
        }
    }

    // Called when players change
    onPlayersChanged(players) {
        console.log('Players changed:', Object.keys(players).length);
    }
}

// Export for use in other modules
window.GameIntegration = GameIntegration;
