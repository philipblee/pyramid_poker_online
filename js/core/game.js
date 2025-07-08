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
        this.sidebarVisible = true;

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
        document.getElementById('newGame').addEventListener('click', () => this.startNewGame());
        document.getElementById('addPlayer').addEventListener('click', () => this.addPlayer());
        document.getElementById('autoArrange').addEventListener('click', () => this.autoArrangeManager.autoArrangeHand());
        document.getElementById('sortByRank').addEventListener('click', () => this.resetAndSortByRank());
        document.getElementById('sortBySuit').addEventListener('click', () => this.resetAndSortBySuit());
        document.getElementById('submitHand').addEventListener('click', () => this.submitCurrentHand());

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

    startNewGame() {
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

        // Hide sidebar when game starts
        if (this.sidebarVisible) {
            toggleSidebar(this);
        }

        // Setup new game
        this.deckManager.createNewDeck();
        this.gameState = 'playing';
        this.playerManager.currentPlayerIndex = 0;
        this.submittedHands.clear();

        // Deal cards to all players
        for (let player of this.playerManager.players) {
            const hand = this.deckManager.dealCards(17);
            this.playerHands.set(player.name, {
                cards: hand,
                back: [],
                middle: [],
                front: []
            });
            player.ready = false;
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
        console.log(`AI ${currentPlayer.name} is taking their turn...`);

        // Add a small delay to make AI actions feel more natural
        setTimeout(() => {

            this.autoArrangeManager.autoArrangeHand();
            
            // Add another delay before submitting
            setTimeout(() => {
                this.submitCurrentHand();
            }, 1000);
        }, 500);
    }



    // Add these methods to your js/core/game.js file
    // Insert them after the loadCurrentPlayerHand() method

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
        for (let start = Math.max(2, minValue - wildCount); start <= Math.min(14 - targetLength + 1, maxValue + wildCount); start++) {
            const straightValues = [];
            for (let i = 0; i < targetLength; i++) {
                straightValues.push(start + i);
            }

            const needed = straightValues.filter(v => !values.includes(v)).length;
            if (needed <= wildCount) return true;
        }

        // Check wheel straights (A-2-3-4-5-6 for 6-card, A-2-3-4-5 for 5-card, etc.)
        if (targetLength <= 6) {
            const wheelStraight = [14, 2, 3, 4, 5, 6].slice(0, targetLength);
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

        // Initialize scores
        playerNames.forEach(name => {
            roundScores.set(name, 0);
            bonusPoints.set(name, 0);
        });

        // Calculate bonus points for each player
        // Keep this simple initialization:
        playerNames.forEach(name => {
            roundScores.set(name, 0);  // Start at 0, not bonus points
        });


        // Head-to-head comparisons
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

        // Update total scores
        roundScores.forEach((roundScore, playerName) => {
            this.playerManager.updatePlayerScore(playerName, roundScore);
        });

        showScoringPopup(this, detailedResults, roundScores, new Map());
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
        const handRank = handEval.hand_rank[0];

        if (position === 'back') {
            if (cardCount === 5) {
                if (handRank === 8) return 4;  // Four of a Kind
                if (handRank === 9) return 5;  // Straight Flush
                if (handRank === 10) return 6; // Five of a Kind
                return 1;
            } else if (cardCount === 6) {
                if (handRank === 11) return 8;  // 6-card Straight Flush
                if (handRank === 12) return 10; // 6 of a Kind
                return 1;
            } else if (cardCount === 7) {
                if (handRank === 13) return 11; // 7-card Straight Flush
                if (handRank === 14) return 14; // 7 of a Kind
                return 1;
            } else if (cardCount === 8) {
                if (handRank === 15) return 14; // 8-card Straight Flush
                if (handRank === 16) return 18; // 8 of a Kind
                return 1;
            }
        } else if (position === 'middle') {
            if (cardCount === 5) {
                if (handRank === 7) return 2;  // Full House
                if (handRank === 8) return 8;  // Four of a Kind
                if (handRank === 9) return 10; // Straight Flush
                if (handRank === 10) return 12; // Five of a Kind
                return 1;
            } else if (cardCount === 6) {
                if (handRank === 11) return 16; // 6-card Straight Flush
                if (handRank === 12) return 20; // 6 of a Kind
                return 1;
            } else if (cardCount === 7) {
                if (handRank === 13) return 22; // 7-card Straight Flush
                if (handRank === 14) return 28; // 7 of a Kind
                return 1;
            }
        } else if (position === 'front') {
            if (cardCount === 3) {
                if (handRank === 4) return 3; // Three of a kind
                return 1;
            } else if (cardCount === 5) {
                if (handRank === 5) return 4;  // Straight
                if (handRank === 6) return 4;  // Flush
                if (handRank === 7) return 5;  // Full House
                if (handRank === 8) return 12; // Four of a Kind
                if (handRank === 9) return 15; // Straight Flush
                if (handRank === 10) return 18; // Five of a Kind
                return 1;
            }
        }

        return 1;
    }

    closeScoringPopup() {
        closeScoringPopup();
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