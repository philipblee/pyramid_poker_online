// js/multiplayer/tournament-sync.js
// Tournament coordination system for Pyramid Poker Online

class TournamentSync {
    constructor(tableManager) {
        this.tableManager = tableManager;
        this.db = window.firebaseDb;
        this.currentTableId = null;
        this.roundTimer = null;
        this.gameIntegration = null;

        // Bind to table manager events
        this.tableManager.onTournamentStateChanged = this.onTournamentStateChanged.bind(this);
    }

    // Initialize tournament sync with current table
    initialize(tableId, gameIntegration) {
        this.currentTableId = tableId;
        this.gameIntegration = gameIntegration; // Bridge to existing game.js
    }

    // Handle tournament state changes from table manager
    onTournamentStateChanged(tournament) {
        if (!tournament) return;

        console.log('Tournament sync - state changed:', tournament);

        // Handle different tournament phases
        switch (tournament.round) {
            case 1:
            case 2:
            case 3:
                this.handleRoundStart(tournament);
                break;
        }
    }

    // Start new round - deal cards and begin timer
    async handleRoundStart(tournament) {
        console.log(`Starting Round ${tournament.round}`);

        // Get current table data
        const tableDoc = await this.tableManager.tablesRef.doc(this.currentTableId).get();
        const tableData = tableDoc.data();

        // Check if cards are already dealt for this round (prevent infinite loop)
        if (tableData.currentTournament?.roundCards &&
            Object.keys(tableData.currentTournament.roundCards).length > 0) {
            console.log('Cards already dealt for this round, skipping deal');
        } else {
            // Deal cards to all players
            await this.dealCardsToPlayers(tableData.players, tableData.settings);
        }

        // Check if timer is already running
        if (!tournament.roundEndTime || this.roundTimer) {
            // Start round timer only if not already set
            this.startRoundTimer(tableData.settings.roundTimeLimit);

            // Set round end time only if not already set
            if (!tournament.roundEndTime) {
                const roundEndTime = new Date(Date.now() + tableData.settings.roundTimeLimit);
                await this.tableManager.tablesRef.doc(this.currentTableId).update({
                    'currentTournament.roundEndTime': firebase.firestore.Timestamp.fromDate(roundEndTime)
                });
            }
        }

        // Notify game integration
        if (this.gameIntegration) {
            this.gameIntegration.onRoundStart(tournament.round, tableData.settings.wildCards);
        }
    }

    // Deal 17 cards to each player using existing DeckManager
    async dealCardsToPlayers(players, settings) {
        console.log('Dealing cards to players...');

        // Use existing DeckManager system
        if (typeof DeckManager !== 'function') {
            console.error('DeckManager class not available - need to load deck.js');
            return;
        }

        // Create and shuffle deck using existing system
        const deckManager = new DeckManager();
        deckManager.createNewDeck(); // Uses existing createDeck() from utils
        deckManager.shuffleDeck();

        // Deal 17 cards to each player
        const dealData = {};
        const playerIds = Object.keys(players);

        try {
            playerIds.forEach(playerId => {
                const playerCards = deckManager.dealCards(17);
                dealData[`currentTournament.roundCards.${playerId}`] = playerCards;
            });

            // Update Firebase with dealt cards
            await this.tableManager.tablesRef.doc(this.currentTableId).update(dealData);

            console.log(`Cards dealt to ${playerIds.length} players`);
            console.log(`Remaining cards in deck: ${deckManager.getRemainingCards()}`);

        } catch (error) {
            console.error('Error dealing cards:', error);
            throw error;
        }
    }

    // Remove custom shuffle function - use DeckManager's shuffle
    // shuffleDeck() function removed - using DeckManager.shuffleDeck()

    // Shuffle deck
    // Note: Using DeckManager.shuffleDeck() instead of custom implementation

    // Start round countdown timer
    startRoundTimer(timeLimit) {
        console.log(`Round timer started: ${timeLimit / 1000} seconds`);

        // Clear any existing timer
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
        }

        // Set timer for round end
        this.roundTimer = setTimeout(() => {
            this.handleRoundTimeout();
        }, timeLimit);

        // Notify game integration of timer start
        if (this.gameIntegration) {
            this.gameIntegration.onTimerStart(timeLimit);
        }
    }

    // Handle round timeout - process submissions and calculate scores
    async handleRoundTimeout() {
        console.log('Round timer expired - processing submissions');

        // Get current tournament state
        const tableDoc = await this.tableManager.tablesRef.doc(this.currentTableId).get();
        const tableData = tableDoc.data();
        const tournament = tableData.currentTournament;

        // Process all player submissions
        await this.processRoundSubmissions(tournament, tableData.players);

        // Calculate scores using existing scoring logic
        await this.calculateRoundScores(tournament, tableData.players);

        // Advance to next round or end tournament
        await this.advanceRound(tournament);
    }

    // Process player submissions for the round
    async processRoundSubmissions(tournament, players) {
        console.log('Processing round submissions...');

        // Get submissions (will be empty for players who didn't submit)
        const submissions = tournament.roundSubmissions || {};

        // For each player, ensure they have a submission or mark as timed out
        Object.keys(players).forEach(playerId => {
            if (!submissions[playerId]) {
                console.log(`Player ${playerId} timed out - no submission`);
                // Player gets empty arrangement (will lose all comparisons)
                submissions[playerId] = {
                    front: null,
                    middle: null,
                    back: null,
                    timedOut: true,
                    timestamp: Date.now()
                };
            }
        });

        // Update submissions in Firebase
        await this.tableManager.tablesRef.doc(this.currentTableId).update({
            'currentTournament.roundSubmissions': submissions
        });
    }

    // Calculate round scores using existing pyramid poker logic
    async calculateRoundScores(tournament, players) {
        console.log('Calculating round scores...');

        // This will use your existing scoring system
        // For now, placeholder logic - will integrate with scoring-utilities.js
        const roundScores = {};

        Object.keys(players).forEach(playerId => {
            // Placeholder: random score for testing
            // TODO: Integrate with actual pyramid poker scoring
            roundScores[playerId] = Math.floor(Math.random() * 20) - 10; // -10 to +10
        });

        // Update round results
        await this.tableManager.tablesRef.doc(this.currentTableId).update({
            'currentTournament.roundResults': roundScores
        });

        // Update player total scores
        const playerUpdates = {};
        Object.keys(roundScores).forEach(playerId => {
            playerUpdates[`players.${playerId}.roundScores`] = firebase.firestore.FieldValue.arrayUnion(roundScores[playerId]);
            playerUpdates[`players.${playerId}.currentTournamentScore`] = firebase.firestore.FieldValue.increment(roundScores[playerId]);
        });

        await this.tableManager.tablesRef.doc(this.currentTableId).update(playerUpdates);

        console.log('Round scores calculated:', roundScores);
    }

    // Advance to next round or end tournament
    async advanceRound(tournament) {
        if (tournament.round >= tournament.totalRounds) {
            // Tournament finished
            await this.endTournament();
        } else {
            // Start next round
            await this.startNextRound(tournament.round + 1);
        }
    }

    // Start next round
    async startNextRound(nextRound) {
        console.log(`Advancing to round ${nextRound}`);

        // Reset for next round
        await this.tableManager.tablesRef.doc(this.currentTableId).update({
            'currentTournament.round': nextRound,
            'currentTournament.roundStartTime': firebase.firestore.FieldValue.serverTimestamp(),
            'currentTournament.roundSubmissions': {},
            'currentTournament.roundResults': {},
            'currentTournament.roundCards': {}
        });

        // Round will automatically start via tournament state change listener
    }

    // End tournament and return to waiting state
    async endTournament() {
        console.log('Tournament finished');

        // Update table status back to waiting for new tournament
        await this.tableManager.tablesRef.doc(this.currentTableId).update({
            status: 'waiting',
            currentTournament: null
        });

        // Reset all players to not ready
        const tableDoc = await this.tableManager.tablesRef.doc(this.currentTableId).get();
        const players = tableDoc.data().players;

        const resetUpdates = {};
        Object.keys(players).forEach(playerId => {
            if (players[playerId].type === 'human') {
                resetUpdates[`players.${playerId}.ready`] = false;
            } else {
                // Remove AI players
                resetUpdates[`players.${playerId}`] = firebase.firestore.FieldValue.delete();
            }
            resetUpdates[`players.${playerId}.currentTournamentScore`] = 0;
        });

        await this.tableManager.tablesRef.doc(this.currentTableId).update(resetUpdates);

        // Notify game integration
        if (this.gameIntegration) {
            this.gameIntegration.onTournamentEnd();
        }
    }

    // Submit player arrangement
    async submitArrangement(arrangement) {
        if (!this.currentTableId) return;

        const submission = {
            front: arrangement.front,
            middle: arrangement.middle,
            back: arrangement.back,
            timedOut: false,
            timestamp: Date.now()
        };

        await this.tableManager.tablesRef.doc(this.currentTableId).update({
            [`currentTournament.roundSubmissions.${this.tableManager.currentUser.id}`]: submission
        });

        console.log('Arrangement submitted:', submission);
    }

    // Clean up timers
    cleanup() {
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
            this.roundTimer = null;
        }
    }
}

// Export for use in other modules
window.TournamentSync = TournamentSync;