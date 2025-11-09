// js/ui/display.js
// UI display and update functions extracted from ui.js

// Create a visual card element
function createCardElement(card) {
    const cardEl = document.createElement('div');

    //    console.log(`🃏 Creating card element:`, {
    //        rank: card.rank,
    //        suit: card.suit,
    //        isWild: card.isWild,
    //        wasWild: card.wasWild
    //    });

    if (card.isWild) {
        cardEl.className = 'card wild';
        cardEl.innerHTML = `<div style="font-size: 16px;">WILD</div><div style="font-size: 28px;">🃏</div>`;
    } else {
        const wasWildClass = card.wasWild ? ' was-wild' : '';
        cardEl.className = `card ${['♥', '♦'].includes(card.suit) ? 'red' : 'black'}${wasWildClass}`;
        cardEl.innerHTML = `<div style="font-size: 20px;">${card.rank}</div><div style="font-size: 28px;">${card.suit}</div>`;

        // Add inline style for wasWild cards to override CSS conflicts
        if (card.wasWild) {
            cardEl.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)';
            cardEl.style.border = '2px solid #ff6b6b';
            cardEl.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.6)';
            // Don't override color - let the suit keep its red/black color
        }
    }

    cardEl.draggable = true;
    cardEl.dataset.card = JSON.stringify(card);
    return cardEl;
}

// Display cards in a container
function displayCards(cards, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !cards || cards.length === 0) return;

    cards.forEach(card => {
        const cardElement = createCardElement(card);
        container.appendChild(cardElement);
    });
}

// Setup drag and drop functionality
function setupDragAndDrop(game) {
    const handAreas = document.querySelectorAll('.hand-area');

    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('card')) {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.dataset.card);
            e.dataTransfer.setData('source', e.target.parentElement.id);
        }
    });

    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('card')) {
            e.target.classList.remove('dragging');
        }
    });

    handAreas.forEach(area => {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('drop-target');
        });

        area.addEventListener('dragleave', (e) => {
            if (!area.contains(e.relatedTarget)) {
                area.classList.remove('drop-target');
            }
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('drop-target');

            const cardData = e.dataTransfer.getData('text/plain');
            const sourceId = e.dataTransfer.getData('source');
            const targetHand = area.dataset.hand;

            game.moveCard(cardData, sourceId, targetHand);
        });
    });
}

// Update game status display
function updateStatus(game) {
    const status = document.getElementById('status');

    if (game.gameState === 'waiting') {
        status.textContent = `Players: ${game.playerManager.players.length} - Add players and click "New Game" to start!`;
    } else if (game.gameState === 'playing') {
        const currentPlayer = game.playerManager.getCurrentPlayer();
        const readyCount = game.playerManager.getReadyCount();
        status.textContent = `Round ${game.currentRound} of ${game.maxRounds}: ${currentPlayer.name}'s turn - Arrange your cards!`;
//        status.textContent = `Round ${game.currentRound} of ${game.maxRounds}: ${currentPlayer.name}'s turn - Arrange your cards! (${readyCount}/${game.playerManager.players.length} players ready)`;
    } else if (game.gameState === 'scoring') {
        status.textContent = `Round ${game.currentRound} of ${game.maxRounds} complete! Check the scores below.`;
    }
}

// Update player list display
function updatePlayerList(game) {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';

    // 1. FIRST: Tournament standings (if tournament is active)

    if (game.currentRound > 0) {
        const standingsSection = document.createElement('div');
        standingsSection.className = 'tournament-standings';
        standingsSection.innerHTML = `
            <h4 style="color: #ffd700; margin: 0 0 10px 0; font-size: 14px;">🏆 Tournament Standings</h4>
        `;

        // Sort players by tournament total scores
        const standings = [...game.tournamentScores.entries()]
            .sort((a, b) => b[1] - a[1]);

        standings.forEach(([playerName, totalScore], index) => {
            const position = index + 1;
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;

            // Color logic for tournament scores
            const scoreColor = totalScore < 0 ? '#ff6b6b' : '#4ecdc4';

            const standingDiv = document.createElement('div');
            standingDiv.style.cssText = `
                display: flex; justify-content: space-between;
                padding: 8px 12px; margin: 3px 0;
                background: rgba(255, 215, 0, 0.1); border-radius: 6px;
                border: 1px solid rgba(255, 215, 0, 0.3);
                font-size: 14px; font-weight: bold;
            `;
            standingDiv.innerHTML = `
                <span style="color: #ffd700;">${medal} ${playerName}</span>
                <span style="color: ${scoreColor};">${totalScore > 0 ? '+' : ''}${totalScore}</span>
            `;
            standingsSection.appendChild(standingDiv);
        });

        playerList.appendChild(standingsSection);
    }

    // 2. SECOND: All completed rounds + current round (stacked vertically)
    if (game.currentRound > 0) {

        // In display.js where tournament standings are built
//        console.log(`📺 Tournament Display: currentRound=${game.currentRound}, roundHistory.length=${game.roundHistory.length}`);
//        console.log(`📺 Will loop from roundNum=1 to roundNum=${game.currentRound}`);

        // Show all rounds from 1 to current round
        for (let roundNum = 1; roundNum <= game.currentRound; roundNum++) {
            const roundSection = document.createElement('div');
            roundSection.className = 'round-section';

            // Get scores for this specific round
            let roundScores = new Map();
            if (roundNum === game.currentRound && game.gameState === 'playing') {
                // Current round in progress - show current scores
                game.playerManager.players.forEach(player => {
                    const score = game.playerManager.getPlayerScore(player.name);
                    roundScores.set(player.name, score);
                });
            } else {
                // Completed round - get from history
                const historicalRound = game.roundHistory.find(round => round.roundNumber === roundNum);
                if (historicalRound) {
                    roundScores = historicalRound.roundScores;
                }
            }

            // Create clickable round header
            const roundHeader = document.createElement('div');
            roundHeader.style.cssText = `
                color: #4ecdc4; font-size: 14px; font-weight: bold;
                margin: 15px 0 5px 0; cursor: pointer;
                padding: 5px 8px; border-radius: 4px;
                background: rgba(78, 205, 196, 0.1);
                border: 1px solid rgba(78, 205, 196, 0.3);
                transition: background 0.2s ease;
            `;
            roundHeader.innerHTML = `📋 Round ${roundNum}`;

            // Disable all round buttons (buggy - fix later)
            roundHeader.style.cursor = 'default';
            roundHeader.style.opacity = '0.7';
            // Remove click handlers and hover effects

            roundSection.appendChild(roundHeader);

            // Show players for this round with smaller fonts
            game.playerManager.players.forEach((player, index) => {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'round-player-item';
                playerDiv.style.cssText = `
                    display: flex; justify-content: space-between;
                    padding: 3px 12px; margin: 1px 0;
                    font-size: 14px; color: #ecf0f1;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 3px;
                `;

                // Add current player indicator for active round
                if (roundNum === game.currentRound && game.gameState === 'playing' && index === game.playerManager.currentPlayerIndex) {
                    playerDiv.style.background = 'rgba(78, 205, 196, 0.2)';
                    playerDiv.style.border = '1px solid #4ecdc4';
                }

                // Add ready indicator for active round
                let readyIndicator = '';
                if (roundNum === game.currentRound && game.gameState === 'playing' && player.ready) {
                    readyIndicator = '✓ ';
                }


                // Check if this round has been completed
                const roundCompleted = game.roundHistory.find(round => round.roundNumber === roundNum);

                let scoreDisplay, scoreColor;

                if (roundCompleted) {
                    // Round completed - show actual round score
                    const score = roundScores.get(player.name) || 0;
                    scoreColor = score < 0 ? '#ff6b6b' : '#4ecdc4';
                    scoreDisplay = `${score > 0 ? '+' : ''}${score} pts`;
                } else {
                // Round not played yet - show dash
                scoreColor = '#ffffff'; // White for maximum visibility
                scoreDisplay = '-';
                }

                playerDiv.innerHTML = `
                    <span>${readyIndicator}${player.name}</span>
                    <span style="color: ${scoreColor};">${scoreDisplay}</span>
                `;


                roundSection.appendChild(playerDiv);
            });

            playerList.appendChild(roundSection);
        }
    } else {
        // No tournament started - show basic player list
        const playersSection = document.createElement('div');
        playersSection.innerHTML = `
            <h4 style="color: #ecf0f1; margin: 0 0 10px 0; font-size: 14px;">👥 Players</h4>
        `;

        game.playerManager.players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `<span>${player.name}</span>`;
            playersSection.appendChild(playerDiv);
        });

        playerList.appendChild(playersSection);
    }
}

// Update scoring
function updateScoring(game) {
    const scoring = document.getElementById('scoring');

    // Always hide the redundant current scores section
    // We show tournament standings in the player list now
    if (scoring) {
        scoring.style.display = 'none';
    }
}

// Update button states based on game state
function updateButtonStates(game) {
    console.log('🎮 updateButtonStates() called from:', new Error().stack.split('\n')[2].trim());

    

    const newGameBtn = document.getElementById('newGame');
    const newRoundBtn = document.getElementById('newRound');
//    const addPlayerBtn = document.getElementById('addPlayer');
    const autoBtn = document.getElementById('autoArrange');
    const rankBtn = document.getElementById('sortByRank');
    const suitBtn = document.getElementById('sortBySuit');
    const submitBtn = document.getElementById('submitHand');

    if (game.gameState === 'waiting') {
//        addPlayerBtn.disabled = false;
//        newGameBtn.disabled = game.playerManager.players.length < 2;
//        newRoundBtn.disabled = false; // No tournament started
        autoBtn.disabled = true;
        rankBtn.disabled = true;
        suitBtn.disabled = true;
        submitBtn.disabled = true;
    } else if (game.gameState === 'playing') {

        // NEW LOGIC: Check if any players have started playing (moved cards around)
        const gameInProgress = game.playerManager.getReadyCount() > 0 ||
                              Array.from(game.playerHands.values()).some(hand =>
                                  hand.back.length > 0 || hand.middle.length > 0 || hand.front.length > 0
                              );

//        newRoundBtn.disabled = gameInProgress || game.currentRound >= game.maxRounds;
        autoBtn.disabled = false;
        rankBtn.disabled = false;
        suitBtn.disabled = false;
    } else if (game.gameState === 'scoring') {
//        addPlayerBtn.disabled = false;
//        newGameBtn.disabled = false;
//        newRoundBtn.disabled = game.currentRound >= game.maxRounds; // Enable for next round
        autoBtn.disabled = true;
        rankBtn.disabled = true;
        suitBtn.disabled = true;
        submitBtn.disabled = true;

    // Log what decisions are being made:
    if (game.gameState === 'playing') {
        const currentPlayer = game.playerManager.getCurrentPlayer();
        const isAITurn = currentPlayer && (currentPlayer.type === 'ai' || currentPlayer.isAI);
        console.log(`🎮 Button decision: gameState=${game.gameState}, currentPlayer=${currentPlayer?.name}, isAI=${isAITurn}`);
    }

    }
}

// Toggle sidebar visibility
function toggleSidebar(game) {
    game.sidebarVisible = !game.sidebarVisible;

    const sidebar = document.getElementById('sidebar');
    const gameArea = document.getElementById('gameArea');
    const toggleIcon = document.getElementById('toggleIcon');
    const toggleText = document.getElementById('toggleText');

    if (game.sidebarVisible) {
        if (sidebar) {
            sidebar.classList.remove('hidden');
            sidebar.style.display = 'block';
        }
        if (gameArea) {
            gameArea.classList.remove('sidebar-hidden');
            gameArea.style.gridTemplateColumns = '1fr 320px';
        }
        if (toggleIcon) toggleIcon.textContent = '◀';
        if (toggleText) toggleText.textContent = 'Hide';
    } else {
        if (sidebar) {
            sidebar.classList.add('hidden');
            sidebar.style.display = 'none';
        }
        if (gameArea) {
            gameArea.classList.add('sidebar-hidden');
            gameArea.style.gridTemplateColumns = '1fr';
        }
        if (toggleIcon) toggleIcon.textContent = '▶';
        if (toggleText) toggleText.textContent = 'Show';
    }
}

// Update all display elements
function updateDisplay(game) {
    console.log('🔍 updateDisplay() called from:', new Error().stack.split('\n')[2].trim());
    updateStatus(game);
    updatePlayerList(game);
    updateScoring(game);
    updateButtonStates(game);
}

// Show historical round results
function showHistoricalRound(game, roundNumber) {
    console.log(`📋 Showing historical Round ${roundNumber} results...`);

    const roundData = game.roundHistory.find(round => round.roundNumber === roundNumber);
    if (!roundData) {
        console.error(`Round ${roundNumber} data not found`);
        return;
    }

    // For now, just show the scoring popup with historical data
    // We'll enhance this in Phase 3B to have round selector tabs
    showScoringPopup(game, roundData.detailedResults, roundData.roundScores, new Map(), roundNumber);
}
