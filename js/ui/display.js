// js/ui/display.js
// UI display and update functions extracted from ui.js

// Create a visual card element
function createCardElement(card) {
    const cardEl = document.createElement('div');

    console.log(`🃏 Creating card element:`, {
        rank: card.rank,
        suit: card.suit,
        isWild: card.isWild,
        wasWild: card.wasWild
    });

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
        status.textContent = `Players: ${game.playerManager.players.length}/4 - Add players and click "New Game" to start!`;
    } else if (game.gameState === 'playing') {
        const currentPlayer = game.playerManager.getCurrentPlayer();
        const readyCount = game.playerManager.getReadyCount();
        status.textContent = `${currentPlayer.name}'s turn - Arrange your cards! (${readyCount}/${game.playerManager.players.length} players ready)`;
    } else if (game.gameState === 'scoring') {
        status.textContent = 'Round complete! Check the scores below.';
    }
}

// Update player list display
function updatePlayerList(game) {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';

    game.playerManager.players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';

        if (game.gameState === 'playing' && index === game.playerManager.currentPlayerIndex) {
            playerDiv.classList.add('current');
        }
        if (player.ready) {
            playerDiv.classList.add('ready');
        }

        const score = game.playerManager.getPlayerScore(player.name);
        playerDiv.innerHTML = `
            <span>${player.name}</span>
            <span>${player.ready ? '✓' : ''} ${score} pts</span>
        `;

        playerList.appendChild(playerDiv);
    });
}

// Update scoring display
function updateScoring(game) {
    const scoring = document.getElementById('scoring');
    const scoreList = document.getElementById('scoreList');

    if (game.gameState === 'scoring' && game.playerManager.getAllScores().size > 0) {
        scoring.style.display = 'block';
        scoreList.innerHTML = '';

        const sortedScores = [...game.playerManager.getAllScores().entries()].sort((a, b) => b[1] - a[1]);

        sortedScores.forEach(([playerName, score]) => {
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'score-item';
            scoreDiv.innerHTML = `
                <span>${playerName}</span>
                <span>${score} points</span>
            `;
            scoreList.appendChild(scoreDiv);
        });
    } else {
        scoring.style.display = 'none';
    }
}

// Update button states based on game state
function updateButtonStates(game) {
    const newGameBtn = document.getElementById('newGame');
    const addPlayerBtn = document.getElementById('addPlayer');
    const autoBtn = document.getElementById('autoArrange');
    const rankBtn = document.getElementById('sortByRank');
    const suitBtn = document.getElementById('sortBySuit');
    const submitBtn = document.getElementById('submitHand');

    if (game.gameState === 'waiting') {
        addPlayerBtn.disabled = false;
        newGameBtn.disabled = game.playerManager.players.length < 2;
        autoBtn.disabled = true;
        rankBtn.disabled = true;
        suitBtn.disabled = true;
        submitBtn.disabled = true;
    } else if (game.gameState === 'playing') {
        addPlayerBtn.disabled = true;
        newGameBtn.disabled = false;
        autoBtn.disabled = false;
        rankBtn.disabled = false;
        suitBtn.disabled = false;
    } else if (game.gameState === 'scoring') {
        addPlayerBtn.disabled = false;
        newGameBtn.disabled = false;
        autoBtn.disabled = true;
        rankBtn.disabled = true;
        suitBtn.disabled = true;
        submitBtn.disabled = true;
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
    updateStatus(game);
    updatePlayerList(game);
    updateScoring(game);
    updateButtonStates(game);
}