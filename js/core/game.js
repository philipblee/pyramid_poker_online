// js/core/game.js
// Main game orchestration - much cleaner!

class ChinesePokerGame {
    constructor() {
        // Initialize managers
        this.playerManager = new PlayerManager();
        this.deckManager = new DeckManager();
        this.autoArrangeManager = new AutoArrangeManager(this);

        // Game state
        this.gameState = 'waiting';
        this.playerHands = new Map();
        this.submittedHands = new Map();
        this.sidebarVisible = false;

        // NEW: Round tracking
        this.currentRound = 0;          // 0 = no game started, 1-3 = active rounds
        this.maxRounds = 3;             // Tournament limit
        this.roundHistory = [];         // Store completed round data
        this.tournamentScores = new Map(); // Running totals across rounds

        // Auto-add default players for easier testing
        this.playerManager.addDefaultPlayers();

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
        document.getElementById('newGame').addEventListener('click', () => this.startNewGame());

        // NEW: Add "newRound" button to deal new hands to existing players
        document.getElementById('newRound').addEventListener('click', () => this.startNewRound());
        document.getElementById('autoArrange').addEventListener('click', () => this.handleAutoArrangeToggle());
        document.getElementById('sortByRank').addEventListener('click', () => this.resetAndSortByRank());
        document.getElementById('sortBySuit').addEventListener('click', () => this.resetAndSortBySuit());
        document.getElementById('submitHand').addEventListener('click', () => this.submitCurrentHand());
        document.getElementById('gameSettings').addEventListener('click', () => openGameSettings());
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
            // Undo auto-arrange
            this.restoreToDealtState();
            this.autoArrangeUsed = false;
            document.getElementById('autoArrange').textContent = 'Auto';
            console.log('🔄 Undid auto-arrange');
        } else {
            // Run auto-arrange
            this.autoArrangeManager.autoArrangeHand();
            this.autoArrangeUsed = true;
            document.getElementById('autoArrange').textContent = 'Undo Auto';
            console.log('🧠 Auto-arrange applied');
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

    startNewGame() {

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

            // NEW: Initialize tournament
            console.log('🏆 Starting new tournament...');
            this.currentRound = 1;
            this.roundHistory = [];
            this.tournamentScores.clear();

            // Initialize tournament scores for all players
            for (let player of this.playerManager.players) {
                this.tournamentScores.set(player.name, 0);
            }

        // Setup first round
        this.deckManager.createNewDeck();
        this.gameState = 'playing';
        this.playerManager.currentPlayerIndex = 0;
        this.submittedHands.clear();

        // Deal cards to all players
        for (let player of this.playerManager.players) {
            const hand = this.deckManager.dealCards(17);

//            console.log(`\n🎴 Cards dealt to ${player.name}:`);
//            console.log('Current format:', hand);
            const analysis = new Analysis(hand);

            this.playerHands.set(player.name, {
                cards: hand,
                originalCards: [...hand],  // Save original dealt cards
                back: [],
                middle: [],
                front: []
            });
            player.ready = false;
        }

        this.loadCurrentPlayerHand();
        updateDisplay(this);
    }

    startNewRound() {
        // Must have existing players to start a new round
        if (this.playerManager.players.length < 2) {
            alert('Need at least 2 players to start a round. Click "New Game" to configure players.');
            return;
        }

        // Check if tournament is complete
        if (this.currentRound >= this.maxRounds) {
            alert(`Tournament complete! All ${this.maxRounds} rounds have been played. Click "New Game" to start a new tournament.`);
            return;
        }

        // Check if we're in the middle of a round
        if (this.gameState === 'playing') {
            const readyCount = this.playerManager.getReadyCount();
            if (readyCount < this.playerManager.players.length) {
                if (!confirm(`Round ${this.currentRound} is still in progress (${readyCount}/${this.playerManager.players.length} players ready). Start Round ${this.currentRound + 1} anyway?`)) {
                    return;
                }
            }
        }

        // Advance to next round
        this.currentRound++;
        console.log(`🔄 Starting Round ${this.currentRound} of ${this.maxRounds}...`);

        // Setup new round (same as before but with round tracking)
        this.deckManager.createNewDeck();
        this.gameState = 'playing';
        this.playerManager.currentPlayerIndex = 0;
        this.submittedHands.clear();

        // Reset all players' ready status
        for (let player of this.playerManager.players) {
            player.ready = false;
        }

        // Deal new cards to all existing players
        for (let player of this.playerManager.players) {
            const hand = this.deckManager.dealCards(17);

            this.playerHands.set(player.name, {
                cards: hand,
                originalCards: [...hand],  // Save original dealt cards
                back: [],
                middle: [],
                front: []
            });
        }

        this.loadCurrentPlayerHand();
        updateDisplay(this);
    }

    loadCurrentPlayerHand() {
        if (this.gameState !== 'playing') return;

        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);

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

        // Handle AI player turn
        if (currentPlayer.type === 'ai') {
            this.handleAITurn();
        }
    }

    handleAITurn() {
        const currentPlayer = this.playerManager.getCurrentPlayer();
//        console.log(`AI ${currentPlayer.name} is taking their turn...`);

        // Add a small delay to make AI actions feel more natural
        setTimeout(() => {

            this.autoArrangeManager.autoArrangeHand();
            
            // Add another delay before submitting
            setTimeout(() => {
                this.submitCurrentHand();
            }, 1000);
        }, 500);
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
        // Add this at the start of validateHands():
//        console.log('🔄 validateHands() called');

        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;


        // After this line: const playerData = this.playerHands.get(currentPlayer.name);
        // Add:
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

            // Validate hand order (Back >= Middle >= Front)
            const backTuple = backStrength.hand_rank;
            const middleTuple = middleStrength.hand_rank;
            const frontTuple = frontStrength.hand_rank;

            const backVsMiddle = compareTuples(backTuple, middleTuple);
            const middleVsFront = compareTuples(middleTuple, frontTuple);

            // Special validation for 5-card front hands
            let frontIsValid = true;
            if (frontCount === 5 && frontStrength.hand_rank[0] < 5) {
                frontIsValid = false;
            }

            const isValidOrder = backVsMiddle >= 0 && middleVsFront >= 0 && frontIsValid;

            // Display hand strengths
            document.getElementById('backStrength').textContent = `${backStrength.name} (${backStrength.hand_rank.join(', ')})`;
            document.getElementById('middleStrength').textContent = `${middleStrength.name} (${middleStrength.hand_rank.join(', ')})`;
            document.getElementById('frontStrength').textContent = `${frontStrength.name} (${frontStrength.hand_rank.join(', ')})`;

            if (isValidOrder) {
                // Valid setup
                backHand.classList.add('valid');
                middleHand.classList.add('valid');
                frontHand.classList.add('valid');
                submitBtn.disabled = false;

                const readyCount = this.playerManager.getReadyCount();
                statusDiv.innerHTML = `${currentPlayer.name}'s turn - <span style="color: #4ecdc4; font-weight: bold;">✓ SETUP VALID</span> - Ready to submit! (${readyCount}/${this.playerManager.players.length} players ready)`;
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
        const currentPlayer = this.playerManager.getCurrentPlayer();
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        // Analyze each hand
        if (playerData.back.length > 0) {
            const backAnalysis = new Analysis(playerData.back);
//            console.log('Back analysis:', backAnalysis.summary());
        }


        const backCount = playerData.back.length;
        const middleCount = playerData.middle.length;
        const frontCount = playerData.front.length;
        const totalPlaced = backCount + middleCount + frontCount;

        // Validate hand sizes (allow variable sizes)
        const isValidBackSize = [5, 6, 7, 8].includes(backCount);
        const isValidMiddleSize = [5, 6, 7].includes(middleCount);
        const isValidFrontSize = frontCount === 3 || frontCount === 5;

        // Validate 6+ card hands follow special rules
        const isValidBackHand = backCount < 6 || this.validateLargeHand(playerData.back);
        const isValidMiddleHand = middleCount < 6 || this.validateLargeHand(playerData.middle);

        if (!isValidBackSize || !isValidMiddleSize || !isValidFrontSize || !isValidBackHand || !isValidMiddleHand) {
            let errorMsg = 'Invalid hand configuration:\n';
            if (!isValidBackSize) errorMsg += `- Back hand must have 5-8 cards (has ${backCount})\n`;
            if (!isValidMiddleSize) errorMsg += `- Middle hand must have 5-7 cards (has ${middleCount})\n`;
            if (!isValidFrontSize) errorMsg += `- Front hand must have 3 or 5 cards (has ${frontCount})\n`;
            if (!isValidBackHand) errorMsg += `- Back hand with 6+ cards must be all same rank or straight flush\n`;
            if (!isValidMiddleHand) errorMsg += `- Middle hand with 6+ cards must be all same rank or straight flush\n`;
            
            alert(errorMsg);
            return;
        }

        // Calculate expected total based on actual hand sizes
        const minExpected = 5 + 5 + 3; // 13 cards minimum
        const maxExpected = 8 + 7 + 5; // 20 cards maximum
        
        if (totalPlaced < minExpected || totalPlaced > maxExpected) {
            alert(`Invalid total cards placed: ${totalPlaced}. Must be between ${minExpected} and ${maxExpected} cards.`);
            return;
        }

        const backStrength = evaluateHand(playerData.back);
        const middleStrength = evaluateHand(playerData.middle);
        const frontStrength = evaluateThreeCardHand(playerData.front);

        const isValidOrder = compareTuples(backStrength.hand_rank, middleStrength.hand_rank) >= 0 &&
                           compareTuples(middleStrength.hand_rank, frontStrength.hand_rank) >= 0;

        if (!isValidOrder) {
            const message = `INVALID HAND ORDER!\n\n` +
                `Back Hand: ${backStrength.name} (${backStrength.hand_rank.join(', ')})\n` +
                `Middle Hand: ${middleStrength.name} (${middleStrength.hand_rank.join(', ')})\n` +
                `Front Hand: ${frontStrength.name} (${frontStrength.hand_rank.join(', ')})\n\n` +
                `Rule: Back ≥ Middle ≥ Front`;

            if (confirm(message + '\n\nWould you like to reset your cards and try again?')) {
                this.resetCards();
            }
            return;
        }

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
        const playerNames = this.playerManager.getPlayerNames();
        const roundScores = new Map();
        const detailedResults = [];
        const bonusPoints = new Map();

        // Initialize round scores
        playerNames.forEach(name => {
            roundScores.set(name, 0);
            bonusPoints.set(name, 0);
        });

        // Head-to-head comparisons (same as before)
        for (let i = 0; i < playerNames.length; i++) {
            for (let j = i + 1; j < playerNames.length; j++) {
                const player1 = playerNames[i];
                const player2 = playerNames[j];

                const hand1 = this.submittedHands.get(player1);
                const hand2 = this.submittedHands.get(player2);

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

        // NEW: Only store round history ONCE per round
        const roundAlreadyStored = this.roundHistory.some(round => round.roundNumber === this.currentRound);
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

        // Update individual round scores (keep existing for current round display)
        roundScores.forEach((roundScore, playerName) => {
            if (!roundAlreadyStored) {
                this.playerManager.updatePlayerScore(playerName, roundScore);
            }
        });

        showScoringPopup(this, detailedResults, roundScores, new Map());
        updateDisplay(this);

        // NEW - No popup, just return to display
        if (this.currentRound >= this.maxRounds) {
            console.log('🏆 Tournament Complete! Check final standings in sidebar.');
            // Just return to normal display - tournament standings show the results
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
        console.log('Round history length:', this.roundHistory.length);
        this.roundHistory.forEach((round, index) => {
            console.log(`Round ${index + 1}:`, round.roundNumber, 'Scores:', [...round.roundScores.entries()]);
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
        <h1 style="color: #ffd700; margin-bottom: 30px; font-size: 32px;">
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
                <span style="font-size: 20px;">${medal} ${standing.position}. ${standing.playerName}</span>
                <span style="font-size: 18px; font-weight: bold; color: #4ecdc4;">${standing.totalScore} points</span>
            </div>
        `;
    });

    html += `</div><div style="background: rgba(52, 73, 94, 0.5); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
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

    html += `
        </div>
        <button onclick="this.parentElement.parentElement.remove(); game.gameState='waiting'; game.currentRound=0; updateDisplay(game);"
                style="background: #4ecdc4; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">
            Start New Tournament
        </button>
    `;

    content.innerHTML = html;
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Reset to waiting state when closed
    this.gameState = 'waiting';
    this.currentRound = 0;
    updateDisplay(this);
    }

    compareHands(hand1, hand2) {
        let player1Score = 0;
        let player2Score = 0;
        const details = [];

        // Back hand comparison
        const back1 = evaluateHand(hand1.back);
        const back2 = evaluateHand(hand2.back);
        const backComparison = compareTuples(back1.hand_rank, back2.hand_rank);
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
        const middleComparison = compareTuples(middle1.hand_rank, middle2.hand_rank);
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
        const frontComparison = compareTuples(front1.hand_rank, front2.hand_rank);
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

    async saveGameToFirebase(scores) {
        const gameDoc = doc(collection(db, 'gameHistory'));
        await setDoc(gameDoc, {
            userId: this.authManager.currentUser.uid,
            gameMode: this.config.gameMode,
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



}

document.addEventListener('DOMContentLoaded', () => {
    game = new ChinesePokerGame();

    // Add safety check for loadVersionInfo
    if (typeof loadVersionInfo === 'function') {
        loadVersionInfo();
    } else {
        console.warn('loadVersionInfo function not available');
    }
});