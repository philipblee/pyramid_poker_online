// UI and interaction functions for Pyramid Poker

// Create a visual card element
function createCardElement(card) {
    const cardEl = document.createElement('div');

    if (card.isWild) {
        cardEl.className = 'card wild';
        cardEl.innerHTML = `<div style="font-size: 16px;">WILD</div><div style="font-size: 28px;">🃏</div>`;
    } else {
        cardEl.className = `card ${['♥', '♦'].includes(card.suit) ? 'red' : 'black'}`;
        cardEl.innerHTML = `<div style="font-size: 20px;">${card.rank}</div><div style="font-size: 28px;">${card.suit}</div>`;
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

// Render mini cards for scoring popup
function renderMiniCards(cards) {
    return cards.map(card => {
        if (card.isWild) {
            return `<div class="card-mini wild">🃏</div>`;
        } else {
            const colorClass = ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
            return `<div class="card-mini ${colorClass}"><div>${card.rank}</div><div>${card.suit}</div></div>`;
        }
    }).join('');
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
        status.textContent = `Players: ${game.players.length}/4 - Add players and click "New Game" to start!`;
    } else if (game.gameState === 'playing') {
        const currentPlayer = game.players[game.currentPlayerIndex];
        const readyCount = game.players.filter(p => p.ready).length;
        status.textContent = `${currentPlayer.name}'s turn - Arrange your cards! (${readyCount}/${game.players.length} players ready)`;
    } else if (game.gameState === 'scoring') {
        status.textContent = 'Round complete! Check the scores below.';
    }
}

// Update player list display
function updatePlayerList(game) {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';

    game.players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';

        if (game.gameState === 'playing' && index === game.currentPlayerIndex) {
            playerDiv.classList.add('current');
        }
        if (player.ready) {
            playerDiv.classList.add('ready');
        }

        const score = game.scores.get(player.name) || 0;
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

    if (game.gameState === 'scoring' && game.scores.size > 0) {
        scoring.style.display = 'block';
        scoreList.innerHTML = '';

        const sortedScores = [...game.scores.entries()].sort((a, b) => b[1] - a[1]);

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
        newGameBtn.disabled = game.players.length < 2;
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

// Replace the showScoringPopup function in ui.js with this cleaned up version:

function showScoringPopup(game, detailedResults, roundScores, specialPoints) {
    const popup = document.getElementById('scoringPopup');
    const allPlayerHands = document.getElementById('allPlayerHands');
    const roundRobinResults = document.getElementById('roundRobinResults');

    allPlayerHands.innerHTML = '';
    game.players.forEach(player => {
        const hand = game.submittedHands.get(player.name);

        if (hand) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-hand-display';
            playerDiv.innerHTML = `
            <div class="player-hand-title">${player.name}</div>
                <div class="hand-row">
                    <div class="hand-label-popup">Back:</div>
                    <div class="hand-cards">${renderMiniCards(hand.back)}</div>
                    <div class="hand-strength-popup">${getHandName(evaluateHand(hand.back))} (${evaluateHand(hand.back).hand_rank.join(', ')})</div>
                </div>
                <div class="hand-row">
                    <div class="hand-label-popup">Middle:</div>
                    <div class="hand-cards">${renderMiniCards(hand.middle)}</div>
                    <div class="hand-strength-popup">${getHandName(evaluateHand(hand.middle))} (${evaluateHand(hand.middle).hand_rank.join(', ')})</div>
                </div>
                <div class="hand-row">
                    <div class="hand-label-popup">Front:</div>
                    <div class="hand-cards">${renderMiniCards(hand.front)}</div>
                    <div class="hand-strength-popup">${getThreeCardHandName(evaluateThreeCardHand(hand.front))} (${evaluateThreeCardHand(hand.front).hand_rank.join(', ')})</div>
                </div>
            `;
            allPlayerHands.appendChild(playerDiv);
        }
    });

    roundRobinResults.innerHTML = '';
    detailedResults.forEach(result => {
        const matchupDiv = document.createElement('div');
        matchupDiv.className = 'matchup';

        let matchupHTML = `
            <div class="matchup-title">${result.player1} vs ${result.player2}</div>
        `;

        result.details.forEach(detail => {
            const p1Class = detail.winner === 'player1' ? 'winner' : detail.winner === 'tie' ? 'tie' : 'loser';
            const p2Class = detail.winner === 'player2' ? 'winner' : detail.winner === 'tie' ? 'tie' : 'loser';

            matchupHTML += `
                <div class="comparison-row">
                    <div class="player-result ${p1Class}">

                        ${detail.player1Hand.name} (${detail.player1Hand.hand_rank.join(', ')}) ${(() => {
                               if (detail.winner === 'tie') return '(0)';
                               const points = getPointsForHand(detail.winner === 'player1' ? detail.player1Hand : detail.player2Hand, detail.hand);
                               return detail.winner === 'player1' ? `(+${points})` : `(-${points})`;
                        })()}

                    </div>
                    <div style="color: #ffd700; font-weight: bold;">${detail.hand}</div>
                    <div class="player-result ${p2Class}">

                        ${detail.player2Hand.name} (${detail.player2Hand.hand_rank.join(', ')}) ${(() => {
                            if (detail.winner === 'tie') return '(0)';
                            const points = getPointsForHand(detail.winner === 'player1' ? detail.player1Hand : detail.player2Hand, detail.hand);
                            return detail.winner === 'player2' ? `(+${points})` : `(-${points})`;
                        })()}

                    </div>
                </div>
            `;
        });

        matchupHTML += `
            <div class="comparison-row">
                <div class="player-result ${result.player1Score > result.player2Score ? 'winner' : result.player1Score < result.player2Score ? 'loser' : 'tie'}">
                    ${result.player1}: ${result.player1Score} points
                </div>
                <div style="color: #ffd700; font-weight: bold;">HEAD-TO-HEAD</div>
                <div class="player-result ${result.player2Score > result.player1Score ? 'winner' : result.player2Score < result.player1Score ? 'loser' : 'tie'}">
                    ${result.player2}: ${result.player2Score} points
                </div>
            </div>
        `;

        matchupDiv.innerHTML = matchupHTML;
        roundRobinResults.appendChild(matchupDiv);
    });

      // Create scoring matrix
    const matrixDiv = document.createElement('div');
    matrixDiv.innerHTML = `
        <h3 style="color: #ffd700; margin-top: 30px; margin-bottom: 15px;">Head-to-Head Matrix</h3>
        <div id="scoringMatrix"></div>
    `;
    roundRobinResults.appendChild(matrixDiv);

    // Build the matrix
    const matrixContainer = document.getElementById('scoringMatrix');
    const playerNames = game.players.map(p => p.name);

    // Create matrix data
    const matrix = {};
    playerNames.forEach(player => {
        matrix[player] = {};
        playerNames.forEach(opponent => {
            matrix[player][opponent] = player === opponent ? '-' : 0;
        });
    });

    // Fill matrix with results
    detailedResults.forEach(result => {
        matrix[result.player1][result.player2] = result.player1Score > 0 ? `+${result.player1Score}` : result.player1Score;
        matrix[result.player2][result.player1] = result.player2Score > 0 ? `+${result.player2Score}` : result.player2Score;
    });

    // Create HTML table
    let tableHTML = `
        <table style="border-collapse: collapse; margin: 0 auto; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: rgba(255,215,0,0.2);">
                    <th style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #ffd700; font-weight: bold;">vs</th>
    `;

    // Header row
    playerNames.forEach(player => {
        tableHTML += `<th style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #ffd700; font-weight: bold; min-width: 80px;">${player}</th>`;
    });
    tableHTML += `</tr></thead><tbody>`;

    // Data rows
    playerNames.forEach(player => {
        tableHTML += `<tr>`;
        tableHTML += `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #ffd700; font-weight: bold; background: rgba(255,215,0,0.1);">${player}</td>`;

        playerNames.forEach(opponent => {
            const score = matrix[player][opponent];
            let cellClass = '';
            let cellColor = '#ccc';

            if (score === '-') {
                cellClass = 'diagonal';
                cellColor = '#666';
            } else if (score > 0) {
                cellClass = 'positive';
                cellColor = '#4ecdc4';
            } else if (score < 0) {
                cellClass = 'negative';
                cellColor = '#ff6b6b';
            }

            tableHTML += `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: center; color: ${cellColor}; font-weight: bold;">${score}</td>`;
        });
        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table>`;
    matrixContainer.innerHTML = tableHTML;

    popup.style.display = 'block';
}

// Close scoring popup
function closeScoringPopup() {
    document.getElementById('scoringPopup').style.display = 'none';
}

// Update all display elements
function updateDisplay(game) {
    updateStatus(game);
    updatePlayerList(game);
    updateScoring(game);
    updateButtonStates(game);
}


// Calculate points for a winning hand
function getPointsForHand(hand, position) {
    const handName = hand.name.toLowerCase();

    if (position === 'Front') {
        if (handName.includes('three of a kind')) return 3;
        if (handName.includes('flush')) return 4;
        if (handName.includes('straight')) return 4;
        if (handName.includes('full house')) return 5;
        if (handName.includes('four of a kind')) return 12;
        if (handName.includes('straight flush')) return 15;
        if (handName.includes('five of a kind')) return 18;
        return 1;
    } else if (position === 'Middle') {
        if (handName.includes('full house')) return 2;
        if (handName.includes('four of a kind')) return 8;
        if (handName.includes('straight flush')) return 10;
        if (handName.includes('five of a kind')) return 12;
        return 1;
    } else if (position === 'Back') {
        if (handName.includes('four of a kind')) return 4;
        if (handName.includes('straight flush')) return 5;
        if (handName.includes('five of a kind')) return 6;
        return 1;
    }
    return 1;
}