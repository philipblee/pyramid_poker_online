// Main game class for Pyramid Poker

class ChinesePokerGame {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameState = 'waiting';
        this.deck = [];
        this.playerHands = new Map();
        this.scores = new Map();
        this.submittedHands = new Map();
        this.sidebarVisible = true;

        // Auto-add default players for easier testing
        this.addDefaultPlayers();

        this.initializeEventListeners();
        updateDisplay(this);
        createParticles();
    }

    // Add this new method to the ChinesePokerGame class:
    addDefaultPlayers() {
        const defaultPlayers = ['Player 1', 'Player 2'];

        defaultPlayers.forEach(playerName => {
            this.players.push({
                name: playerName,
                id: Date.now() + Math.random(),
                ready: false
            });
            this.scores.set(playerName, 0);
        });

        console.log('Auto-added default players:', defaultPlayers);
    }

    initializeEventListeners() {
        document.getElementById('newGame').addEventListener('click', () => this.startNewGame());
        document.getElementById('addPlayer').addEventListener('click', () => this.addPlayer());
        document.getElementById('autoArrange').addEventListener('click', () => this.autoArrangeHand());
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
        const playerName = prompt('Enter player name:') || `Player ${this.players.length + 1}`;
        this.players.push({
            name: playerName,
            id: Date.now() + Math.random(),
            ready: false
        });
        this.scores.set(playerName, 0);
        updateDisplay(this);
    }

    startNewGame() {
        // Auto-add default players if none exist (for easier testing)
        if (this.players.length === 0) {
            console.log('No players found - adding default players for testing');

            // Add two default players
            const defaultPlayers = ['Player 1', 'Player 2'];

            defaultPlayers.forEach(playerName => {
                this.players.push({
                    name: playerName,
                    id: Date.now() + Math.random(),
                    ready: false
                });
                this.scores.set(playerName, 0);
            });

            updateDisplay(this);
            console.log('Added default players:', defaultPlayers);
        }

        if (this.players.length < 2) {
            alert('Need at least 2 players to start!');
            return;
        }

        // Hide sidebar when game starts to give more space for card play
        if (this.sidebarVisible) {
            toggleSidebar(this);
        }

        this.deck = createDeck();
        this.gameState = 'playing';
        this.currentPlayerIndex = 0;
        this.submittedHands.clear();

        for (let player of this.players) {
            const hand = this.deck.splice(0, 17);
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

        const currentPlayer = this.players[this.currentPlayerIndex];
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        document.getElementById('playerHand').innerHTML = '';
        document.getElementById('backHand').innerHTML = '';
        document.getElementById('middleHand').innerHTML = '';
        document.getElementById('frontHand').innerHTML = '';

        displayCards(playerData.cards, 'playerHand');
        displayCards(playerData.back, 'backHand');
        displayCards(playerData.middle, 'middleHand');
        displayCards(playerData.front, 'frontHand');

        this.validateHands();
    }

    moveCard(cardData, sourceId, targetHand) {
        const card = JSON.parse(cardData);
        const currentPlayer = this.players[this.currentPlayerIndex];
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
        const currentPlayer = this.players[this.currentPlayerIndex];
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

        // Check card counts and total
        const backCount = playerData.back.length;
        const middleCount = playerData.middle.length;
        const frontCount = playerData.front.length;
        const totalPlaced = backCount + middleCount + frontCount;
        const totalCards = playerData.cards.length + totalPlaced;

        // Validate hand sizes - new flexible limits
        const isValidCounts = backCount <= 8 && middleCount <= 7 && (frontCount <= 5);
        const isValidFrontSize = frontCount === 3 || frontCount === 5; // No 4 cards allowed
        const isValidBackSize = [5, 6, 7, 8].includes(backCount) || backCount === 0; // 0 for incomplete
        const isValidMiddleSize = [5, 6, 7].includes(middleCount) || middleCount === 0; // 0 for incomplete

        // NEW: Validate 6+ card hands follow special rules
        const isValidBackHand = backCount < 6 || this.validateLargeHand(playerData.back);
        const isValidMiddleHand = middleCount < 6 || this.validateLargeHand(playerData.middle);

        // Calculate expected total based on hand sizes
        let expectedTotal = 0;
        if (frontCount === 3 || frontCount === 5) expectedTotal += frontCount;
        if (isValidBackSize && backCount > 0) expectedTotal += backCount;
        if (isValidMiddleSize && middleCount > 0) expectedTotal += middleCount;

        const isComplete = (backCount > 0 && middleCount > 0 && frontCount > 0) &&
                          isValidFrontSize && isValidBackSize && isValidMiddleSize &&
                          isValidBackHand && isValidMiddleHand;

        if (!isValidCounts || !isValidFrontSize || !isValidBackSize || !isValidMiddleSize || !isValidBackHand || !isValidMiddleHand) {
            // Mark oversized hands as invalid
            if (backCount > 8) backHand.classList.add('invalid');
            if (middleCount > 7) middleHand.classList.add('invalid');
            if (frontCount > 5 || frontCount === 4) frontHand.classList.add('invalid');
            if (!isValidBackHand) backHand.classList.add('invalid');
            if (!isValidMiddleHand) middleHand.classList.add('invalid');

            submitBtn.disabled = true;

            let backError = '';
            if (backCount > 8) backError = ' (TOO MANY!)';
            else if (backCount > 0 && !isValidBackSize) backError = ' (INVALID SIZE!)';
            else if (!isValidBackHand) backError = ' (MUST BE STRAIGHT FLUSH OR SAME RANK!)';

            let middleError = '';
            if (middleCount > 7) middleError = ' (TOO MANY!)';
            else if (middleCount > 0 && !isValidMiddleSize) middleError = ' (INVALID SIZE!)';
            else if (!isValidMiddleHand) middleError = ' (MUST BE STRAIGHT FLUSH OR SAME RANK!)';

            let frontError = '';
            if (frontCount > 5) frontError = ' (TOO MANY!)';
            else if (frontCount === 4) frontError = ' (4 CARDS NOT ALLOWED!)';

            document.getElementById('backStrength').textContent = `${backCount}/5-8 cards${backError}`;
            document.getElementById('middleStrength').textContent = `${middleCount}/5-7 cards${middleError}`;
            document.getElementById('frontStrength').textContent = `${frontCount}/3 or 5 cards${frontError}`;

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

            // Special validation: 5-card front hands must be at least a straight
            let frontIsValid = true;
            if (frontCount === 5) {
                // Check if 5-card front hand is at least a straight (rank 4 or higher)
                if (frontStrength.hand_rank[0] < 5) { // Straight is rank 5, so anything less is invalid
                    frontIsValid = false;
                }
            }

            // Check if hands are in proper order (Back >= Middle >= Front)
            const backTuple = backStrength.hand_rank;
            const middleTuple = middleStrength.hand_rank;
            const frontTuple = frontStrength.hand_rank;

            console.log('Validation Debug:');
            console.log('Back hand:', backStrength.name, backTuple);
            console.log('Middle hand:', middleStrength.name, middleTuple);
            console.log('Front hand:', frontStrength.name, frontTuple);
            console.log('Front hand valid (if 5-card)?', frontIsValid);

            const backVsMiddle = compareTuples(backTuple, middleTuple);
            const middleVsFront = compareTuples(middleTuple, frontTuple);

            console.log('Back >= Middle?', backVsMiddle >= 0);
            console.log('Middle >= Front?', middleVsFront >= 0);

            const isValidOrder = backVsMiddle >= 0 && middleVsFront >= 0 && frontIsValid;

            // Display hand strengths with bonus indicators
            document.getElementById('backStrength').textContent = `${getHandName(backStrength)} (${backStrength.hand_rank.join(', ')})${getBackBonus(backStrength)}`;
            document.getElementById('middleStrength').textContent = `${getHandName(middleStrength)} (${middleStrength.hand_rank.join(', ')})${getMiddleBonus(middleStrength)}`;
            document.getElementById('frontStrength').textContent = `${getThreeCardHandName(frontStrength)} (${frontStrength.hand_rank.join(', ')})${getFrontBonus(frontStrength)}`;

            if (isValidOrder) {
                // Setup is completely valid
                backHand.classList.add('valid');
                middleHand.classList.add('valid');
                frontHand.classList.add('valid');
                submitBtn.disabled = false;

                // Update status to show setup is valid
                const readyCount = this.players.filter(p => p.ready).length;
                statusDiv.innerHTML = `${currentPlayer.name}'s turn - <span style="color: #4ecdc4; font-weight: bold;">✓ SETUP VALID</span> - Ready to submit! (${readyCount}/${this.players.length} players ready)`;
            } else {
                // Hands are out of order or front hand invalid
                backHand.classList.add('invalid');
                middleHand.classList.add('invalid');
                frontHand.classList.add('invalid');
                submitBtn.disabled = true;

                // Update status to show setup is invalid with specific reason
                const readyCount = this.players.filter(p => p.ready).length;
                let reason = '';
                if (!frontIsValid) reason = '5-card front hand must be at least a Straight';
                else if (backVsMiddle < 0) reason = 'Back hand must be >= Middle hand';
                else if (middleVsFront < 0) reason = 'Middle hand must be >= Front hand';

                statusDiv.innerHTML = `${currentPlayer.name}'s turn - <span style="color: #ff6b6b; font-weight: bold;">✗ INVALID ORDER</span> - ${reason}! (${readyCount}/${this.players.length} players ready)`;
            }
        } else {
            submitBtn.disabled = true;
            document.getElementById('backStrength').textContent = `${backCount}/5 cards`;
            document.getElementById('middleStrength').textContent = `${middleCount}/5 cards`;
            document.getElementById('frontStrength').textContent = `${frontCount}/3 cards`;

            // Update status to show incomplete setup
            const readyCount = this.players.filter(p => p.ready).length;
            const cardsInPlay = totalPlaced;
            const cardsRemaining = totalCards - totalPlaced;

            let expectedCards = frontCount === 3 ? 13 : 15; // 13 for 3-card front, 15 for 5-card front
            let frontExpected = frontCount === 3 ? '3' : frontCount === 5 ? '5' : '3 or 5';

            statusDiv.innerHTML = `${currentPlayer.name}'s turn - <span style="color: #ffd700; font-weight: bold;">⚠ INCOMPLETE</span> - Need ${expectedCards} cards in play (${totalPlaced}/${expectedCards} placed, ${cardsRemaining} in staging) - Front: ${frontCount}/${frontExpected} (${readyCount}/${this.players.length} players ready)`;
        }
    }

// Validate that 6+ card hands follow the special rules
    validateLargeHand(cards) {
        if (cards.length < 6) return true; // Only apply to 6+ card hands

        // Separate wild cards from normal cards
        const wildCards = cards.filter(c => c.isWild);
        const normalCards = cards.filter(c => !c.isWild);

        // Check for same rank (all cards same value)
        if (this.isAllSameRank(normalCards, wildCards.length)) {
            return true;
        }

        // Check for straight flush (sequential cards, same suit)
        if (this.isStraightFlush(normalCards, wildCards.length)) {
            return true;
        }

        return false; // Neither same rank nor straight flush
    }

    // Check if cards (+ wilds) can form all same rank
    isAllSameRank(normalCards, wildCount) {
        if (normalCards.length === 0) return true; // All wilds - valid

        // Count each rank
        const rankCounts = {};
        normalCards.forEach(card => {
            rankCounts[card.value] = (rankCounts[card.value] || 0) + 1;
        });

        // Find the most common rank
        const ranks = Object.keys(rankCounts);
        if (ranks.length === 1) {
            // All normal cards are same rank - valid
            return true;
        }

        if (ranks.length === 2) {
            // Two different ranks - check if wilds can make them all the same
            const counts = Object.values(rankCounts);
            const maxCount = Math.max(...counts);
            const minCount = Math.min(...counts);

            // Can we use wilds to make all cards the same rank as the majority?
            if (wildCount >= minCount) {
                return true;
            }
        }

        return false; // Too many different ranks
    }

    // Check if cards (+ wilds) can form a straight flush
    isStraightFlush(normalCards, wildCount) {
        if (normalCards.length === 0) return wildCount >= 6; // All wilds can form straight flush

        // Group by suit
        const suitGroups = {};
        normalCards.forEach(card => {
            if (!suitGroups[card.suit]) suitGroups[card.suit] = [];
            suitGroups[card.suit].push(card.value);
        });

        // Check each suit to see if we can make a straight flush
        for (const [suit, values] of Object.entries(suitGroups)) {
            const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

            if (this.canMakeStraightFlush(uniqueValues, wildCount, normalCards.length + wildCount)) {
                return true;
            }
        }

        // Check if all wilds can form a straight flush in any suit
        if (normalCards.length === 0 && wildCount >= 6) {
            return true;
        }

        return false;
    }

    // Helper: Check if values + wilds can form a straight flush of target length
    canMakeStraightFlush(values, wildCount, targetLength) {
        // Try all possible straights that could include these values
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        // Try straights starting from (minValue - wildCount) to maxValue
        for (let start = Math.max(2, minValue - wildCount); start <= maxValue; start++) {
            const straightValues = [];
            for (let i = 0; i < targetLength; i++) {
                straightValues.push(start + i);
            }

            // Check if this straight can be made with our cards + wilds
            const needed = straightValues.filter(v => !values.includes(v)).length;
            if (needed <= wildCount) {
                return true;
            }
        }

        // Check for wheel straights (A-2-3-4-5-6...)
        const wheelStraight = [14, 2, 3, 4, 5, 6].slice(0, targetLength);
        const wheelNeeded = wheelStraight.filter(v => !values.includes(v)).length;
        if (wheelNeeded <= wildCount) {
            return true;
        }

        return false;
    }

    resetCards() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];

        playerData.cards = allCards;
        playerData.back = [];
        playerData.middle = [];
        playerData.front = [];

        this.loadCurrentPlayerHand();
    }

    autoArrangeHand() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];

        if (allCards.length !== 17) {
            console.error('Card count debug:', {
                totalCards: allCards.length,
                inStaging: playerData.cards.length,
                inBack: playerData.back.length,
                inMiddle: playerData.middle.length,
                inFront: playerData.front.length
            });
            alert(`Card count error: Found ${allCards.length} cards instead of 17! Check console for details.`);
            return;
        }

        // Sort all cards and pick the best 13 for play, leave 4 best rejects in staging
        const sortedCards = [...allCards].sort((a, b) => b.value - a.value);

        // Take the best 13 cards for play
        const playCards = sortedCards.slice(0, 13);
        const stagingCards = sortedCards.slice(13, 17); // 4 worst cards stay in staging

        const backHand = playCards.slice(0, 5);   // 5 best cards
        const middleHand = playCards.slice(5, 10); // next 5 cards
        const frontHand = playCards.slice(10, 13); // next 3 cards

        playerData.cards = stagingCards; // 4 cards left in staging
        playerData.back = backHand;
        playerData.middle = middleHand;
        playerData.front = frontHand;

        this.loadCurrentPlayerHand();
    }

    resetAndSortByRank() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        // First reset: collect all cards from all hands
        const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];

        // Then sort by rank (high to low)
        allCards.sort((a, b) => {
            if (a.value !== b.value) {
                return b.value - a.value; // High to low
            }
            // If same rank, sort by suit order (spades, hearts, diamonds, clubs)
            const suitOrder = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
            return suitOrder[b.suit] - suitOrder[a.suit];
        });

        // Put all cards back in staging area
        playerData.cards = allCards;
        playerData.back = [];
        playerData.middle = [];
        playerData.front = [];

        this.loadCurrentPlayerHand();
    }

    resetAndSortBySuit() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        // First reset: collect all cards from all hands
        const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];

        // Then sort by suit, then by rank within each suit
        allCards.sort((a, b) => {
            // First sort by suit (spades, hearts, diamonds, clubs)
            const suitOrder = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
            if (a.suit !== b.suit) {
                return suitOrder[b.suit] - suitOrder[a.suit];
            }
            // Within same suit, sort by rank (high to low)
            return b.value - a.value;
        });

        // Put all cards back in staging area
        playerData.cards = allCards;
        playerData.back = [];
        playerData.middle = [];
        playerData.front = [];

        this.loadCurrentPlayerHand();
    }

    submitCurrentHand() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        const totalPlaced = playerData.back.length + playerData.middle.length + playerData.front.length;
        const frontCount = playerData.front.length;
        const expectedTotal = frontCount === 3 ? 13 : 15;

        if (totalPlaced !== expectedTotal || playerData.back.length !== 5 ||
            playerData.middle.length !== 5 || (frontCount !== 3 && frontCount !== 5)) {
            alert(`Please arrange exactly ${expectedTotal} cards: 5 in back, 5 in middle, ${frontCount === 3 ? '3' : '5'} in front! You can leave ${17 - expectedTotal} cards in staging area.`);
            return;
        }

        const backStrength = evaluateHand(playerData.back);
        const middleStrength = evaluateHand(playerData.middle);
        const frontStrength = evaluateThreeCardHand(playerData.front);

        const backTuple = backStrength.hand_rank;
        const middleTuple = middleStrength.hand_rank;
        const frontTuple = frontStrength.hand_rank;

        const isValidOrder = compareTuples(backTuple, middleTuple) >= 0 &&
                           compareTuples(middleTuple, frontTuple) >= 0;

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

        currentPlayer.ready = true;

        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

        const allReady = this.players.every(p => p.ready);

        if (allReady) {
            this.calculateScores();
            this.gameState = 'scoring';
        } else {
            this.loadCurrentPlayerHand();
        }

        updateDisplay(this);
    }

    calculateScores() {
        const playerNames = this.players.map(p => p.name);
        const roundScores = new Map();
        const detailedResults = [];
        const bonusPoints = new Map();

        playerNames.forEach(name => {
            roundScores.set(name, 0);
            bonusPoints.set(name, 0);
        });

        playerNames.forEach(playerName => {
            const hand = this.submittedHands.get(playerName);
            let playerBonus = 0;

            const frontEval = evaluateThreeCardHand(hand.front);

        // FRONT HAND - Replace the entire front hand section:
        // Front hand bonuses - different for 3-card vs 5-card
        if (hand.front.length === 3) {
            // 3-card front hand bonuses
            if (frontEval.hand_rank[0] === 4) { // Three of a kind
                playerBonus += 3;  // Keep at 2 (this wasn't in your table, keeping current)
            }
        } else if (hand.front.length === 5) {
            // 5-card front hand bonuses
            if (frontEval.hand_rank[0] === 10) { // Five of a Kind
                playerBonus += 18;  // Changed from 17 to 18
            } else if (frontEval.hand_rank[0] === 9) { // Straight Flush
                playerBonus += 15;  // Changed from 14 to 15
            } else if (frontEval.hand_rank[0] === 8) { // Four of a Kind
                playerBonus += 12;  // Changed from 11 to 12
            } else if (frontEval.hand_rank[0] === 7) { // Full House
                playerBonus += 5;   // Changed from 4 to 5
            } else if (frontEval.hand_rank[0] === 6) { // Flush
                playerBonus += 4;   // Changed from 3 to 4
            } else if (frontEval.hand_rank[0] === 5) { // Straight
                playerBonus += 4;   // Changed from 3 to 4
            }
        }

        // MIDDLE HAND - Replace the middle hand section:
        const middleEval = evaluateHand(hand.middle);
        if (middleEval.hand_rank[0] === 10) { // Five of a Kind
            playerBonus += 12;  // Changed from 5 to 12
        } else if (middleEval.hand_rank[0] === 9) { // Straight Flush
            playerBonus += 10;  // Changed from 9 to 10
        } else if (middleEval.hand_rank[0] === 8) { // Four of a Kind
            playerBonus += 8;   // Changed from 7 to 8
        } else if (middleEval.hand_rank[0] === 7) { // Full House
            playerBonus += 2;   // Changed from 1 to 2
        }

            const backEval = evaluateHand(hand.back);
            if (backEval.hand_rank[0] === 10) { // Five of a Kind
                playerBonus += 6;  // Changed from 5 to 6
            } else if (backEval.hand_rank[0] === 8) { // Four of a Kind
                playerBonus += 4;  // Changed from 3 to 4
            } else if (backEval.hand_rank[0] === 9) { // Straight Flush
                playerBonus += 5;  // Changed from 4 to 5
}
            bonusPoints.set(playerName, playerBonus);
            roundScores.set(playerName, playerBonus);
        });

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
                    details: result.details,
                    sweepBonus: result.sweepBonus
                });
            }
        }

        roundScores.forEach((roundScore, playerName) => {
            this.scores.set(playerName, this.scores.get(playerName) + roundScore);
        });

        showScoringPopup(this, detailedResults, roundScores, bonusPoints);
        updateDisplay(this);
    }

   // Replace the compareHands() method with zero-sum scoring:

    compareHands(hand1, hand2) {
        let player1Score = 0;
        let player2Score = 0;
        const details = [];

        // BACK HAND COMPARISON
        const back1 = evaluateHand(hand1.back);
        const back2 = evaluateHand(hand2.back);
        const backComparison = compareTuples(back1.hand_rank, back2.hand_rank);
        let backResult = 'tie';
        if (backComparison > 0) {
            const points = this.getHandPoints(back1, hand1.back.length, 'back');
            player1Score += points;  // Winner gets points
            player2Score -= points;  // Loser loses same points
            backResult = 'player1';
        } else if (backComparison < 0) {
            const points = this.getHandPoints(back2, hand2.back.length, 'back');
            player2Score += points;  // Winner gets points
            player1Score -= points;  // Loser loses same points
            backResult = 'player2';
        }
        details.push({
            hand: 'Back',
            player1Hand: back1,
            player2Hand: back2,
            winner: backResult
        });

        // MIDDLE HAND COMPARISON
        const middle1 = evaluateHand(hand1.middle);
        const middle2 = evaluateHand(hand2.middle);
        const middleComparison = compareTuples(middle1.hand_rank, middle2.hand_rank);
        let middleResult = 'tie';
        if (middleComparison > 0) {
            const points = this.getHandPoints(middle1, hand1.middle.length, 'middle');
            player1Score += points;  // Winner gets points
            player2Score -= points;  // Loser loses same points
            middleResult = 'player1';
        } else if (middleComparison < 0) {
            const points = this.getHandPoints(middle2, hand2.middle.length, 'middle');
            player2Score += points;  // Winner gets points
            player1Score -= points;  // Loser loses same points
            middleResult = 'player2';
        }
        details.push({
            hand: 'Middle',
            player1Hand: middle1,
            player2Hand: middle2,
            winner: middleResult
        });

        // FRONT HAND COMPARISON
        const front1 = evaluateThreeCardHand(hand1.front);
        const front2 = evaluateThreeCardHand(hand2.front);
        const frontComparison = compareTuples(front1.hand_rank, front2.hand_rank);
        let frontResult = 'tie';
        if (frontComparison > 0) {
            const points = this.getHandPoints(front1, hand1.front.length, 'front');
            player1Score += points;  // Winner gets points
            player2Score -= points;  // Loser loses same points
            frontResult = 'player1';
        } else if (frontComparison < 0) {
            const points = this.getHandPoints(front2, hand2.front.length, 'front');
            player2Score += points;  // Winner gets points
            player1Score -= points;  // Loser loses same points
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

    // Add this helper method to get the correct points for winning hands:
    getHandPoints(handEval, cardCount, position) {
        const handRank = handEval.hand_rank[0];

        if (position === 'back') {
            // Back hand points
            if (cardCount === 5) {
                if (handRank === 8) return 4;  // Four of a Kind = 4 points
                if (handRank === 9) return 5;  // Straight Flush = 5 points
                if (handRank === 10) return 6; // Five of a Kind = 6 points
                return 1; // Regular hand = 1 point
            } else if (cardCount === 6) {
                if (handRank === 11) return 8;  // 6-card Straight Flush = 8 points
                if (handRank === 12) return 10; // 6 of a Kind = 10 points
                return 1;
            } else if (cardCount === 7) {
                if (handRank === 13) return 11; // 7-card Straight Flush = 11 points
                if (handRank === 14) return 14; // 7 of a Kind = 14 points
                return 1;
            } else if (cardCount === 8) {
                if (handRank === 15) return 14; // 8-card Straight Flush = 14 points
                if (handRank === 16) return 18; // 8 of a Kind = 18 points
                return 1;
            }
        } else if (position === 'middle') {
            // Middle hand points (doubled from back)
            if (cardCount === 5) {
                if (handRank === 7) return 2;  // Full House = 2 points
                if (handRank === 8) return 8;  // Four of a Kind = 8 points
                if (handRank === 9) return 10; // Straight Flush = 10 points
                if (handRank === 10) return 12; // Five of a Kind = 12 points
                return 1; // Regular hand = 1 point
            } else if (cardCount === 6) {
                if (handRank === 11) return 16; // 6-card Straight Flush = 16 points
                if (handRank === 12) return 20; // 6 of a Kind = 20 points
                return 1;
            } else if (cardCount === 7) {
                if (handRank === 13) return 22; // 7-card Straight Flush = 22 points
                if (handRank === 14) return 28; // 7 of a Kind = 28 points
                return 1;
            }
        } else if (position === 'front') {
            // Front hand points
            if (cardCount === 3) {
                if (handRank === 4) return 3; // Three of a kind = 3 points
                return 1; // Regular hand = 1 point
            } else if (cardCount === 5) {
                if (handRank === 5) return 4;  // Straight = 4 points
                if (handRank === 6) return 4;  // Flush = 4 points
                if (handRank === 7) return 5;  // Full House = 5 points
                if (handRank === 8) return 12; // Four of a Kind = 12 points
                if (handRank === 9) return 15; // Straight Flush = 15 points
                if (handRank === 10) return 18; // Five of a Kind = 18 points
                return 1; // Regular hand = 1 point
            }
        }

        return 1; // Default: regular hand = 1 point
    }
    closeScoringPopup() {
        closeScoringPopup();
    }
}

async function loadVersionInfo() {
    try {
        const response = await fetch('./version.json');
        const versionInfo = await response.json();

        // Update the existing version-tag element
        const versionElement = document.getElementById('version-info');
        if (versionElement) {
            versionElement.textContent = `Enhanced Edition - v${versionInfo.version}`;
            versionElement.title = `Build Details:
Branch: ${versionInfo.branch}
Commit: ${versionInfo.commit}
Built: ${new Date(versionInfo.buildDate).toLocaleString()}
Last Commit: ${new Date(versionInfo.lastCommit).toLocaleString()}

Click to copy version info`;

            // Add click handler to copy version info
            versionElement.style.cursor = 'pointer';
            versionElement.addEventListener('click', () => {
                const versionText = `Pyramid Poker Online v${versionInfo.version}\nCommit: ${versionInfo.commit}\nBranch: ${versionInfo.branch}\nBuilt: ${versionInfo.buildDate}`;
                navigator.clipboard.writeText(versionText).then(() => {
                    const originalText = versionElement.textContent;
                    versionElement.textContent = 'Copied to clipboard!';
                    setTimeout(() => {
                        versionElement.textContent = originalText;
                    }, 2000);
                });
            });
        }

        // Log for debugging
        console.log('🎮 Pyramid Poker Online Version Info:', versionInfo);

    } catch (error) {
        console.warn('Could not load version info:', error);
        // Fallback to static version
        const versionElement = document.getElementById('version-info');
        if (versionElement) {
            versionElement.textContent = 'Enhanced Edition - v2.0';
        }
    }
}


// Update your existing DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    game = new ChinesePokerGame();
    loadVersionInfo(); // Add this line
});

