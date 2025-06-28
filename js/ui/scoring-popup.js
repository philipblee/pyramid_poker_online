// js/ui/scoring-popup.js
// CLEAN VERSION: Uses ScoringUtilities for all scoring calculations

// Render mini cards for scoring popup (unchanged from original)
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

// SIMPLIFIED: Just delegates to ScoringUtilities (maintains backward compatibility)
function getPointsForHand(hand, position, cardCount = null) {
    return ScoringUtilities.getPointsForHand(hand, position, cardCount);
}

// Helper function to get card count from submitted hands
function getCardCountFromSubmittedHands(game, playerName, position) {
    const playerHand = game.submittedHands.get(playerName);
    if (!playerHand) return 5; // Default

    const pos = position.toLowerCase();
    if (pos === 'front') return playerHand.front?.length || 3;
    if (pos === 'middle') return playerHand.middle?.length || 5;
    if (pos === 'back') return playerHand.back?.length || 5;

    return 5; // Default
}

// Enhanced showScoringPopup with proper large hand support
function showScoringPopup(game, detailedResults, roundScores, specialPoints) {
    const popup = document.getElementById('scoringPopup');
    const allPlayerHands = document.getElementById('allPlayerHands');
    const roundRobinResults = document.getElementById('roundRobinResults');

    // Display all player hands with card counts
    allPlayerHands.innerHTML = '';
    game.players.forEach(player => {
        const hand = game.submittedHands.get(player.name);

        if (hand) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-hand-display';

            // Get actual card counts for display
            const backCardCount = hand.back ? hand.back.length : 5;
            const middleCardCount = hand.middle ? hand.middle.length : 5;
            const frontCardCount = hand.front ? hand.front.length : 3;

            playerDiv.innerHTML = `
                <div class="player-hand-title">${player.name}</div>
                <div class="hand-row">
                    <div class="hand-label-popup">Back (${backCardCount}):</div>
                    <div class="hand-cards">${renderMiniCards(hand.back)}</div>
                    <div class="hand-strength-popup">${getHandName(evaluateHand(hand.back))} (${evaluateHand(hand.back).hand_rank.join(', ')})</div>
                </div>
                <div class="hand-row">
                    <div class="hand-label-popup">Middle (${middleCardCount}):</div>
                    <div class="hand-cards">${renderMiniCards(hand.middle)}</div>
                    <div class="hand-strength-popup">${getHandName(evaluateHand(hand.middle))} (${evaluateHand(hand.middle).hand_rank.join(', ')})</div>
                </div>
                <div class="hand-row">
                    <div class="hand-label-popup">Front (${frontCardCount}):</div>
                    <div class="hand-cards">${renderMiniCards(hand.front)}</div>
                    <div class="hand-strength-popup">${getThreeCardHandName(evaluateThreeCardHand(hand.front))} (${evaluateThreeCardHand(hand.front).hand_rank.join(', ')})</div>
                </div>
            `;
            allPlayerHands.appendChild(playerDiv);
        }
    });

    // Display round robin results with correct scoring
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

            // Calculate points using ScoringUtilities with correct card counts
            const getPointsDisplay = (hand, position, playerName, isWinner) => {
                if (detail.winner === 'tie') return '(0)';

                // Get actual card count from submitted hands
                const cardCount = getCardCountFromSubmittedHands(game, playerName, position);
                const points = ScoringUtilities.getPointsForHand(hand, position, cardCount);

                return isWinner ? `(+${points})` : `(-${points})`;
            };

            matchupHTML += `
                <div class="comparison-row">
                    <div class="player-result ${p1Class}">
                        ${detail.player1Hand.name} (${detail.player1Hand.hand_rank.join(', ')}) ${getPointsDisplay(detail.player1Hand, detail.hand, result.player1, detail.winner === 'player1')}
                    </div>
                    <div style="color: #ffd700; font-weight: bold;">${detail.hand}</div>
                    <div class="player-result ${p2Class}">
                        ${detail.player2Hand.name} (${detail.player2Hand.hand_rank.join(', ')}) ${getPointsDisplay(detail.player2Hand, detail.hand, result.player2, detail.winner === 'player2')}
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

    // Create scoring matrix (unchanged from original)
    const matrixDiv = document.createElement('div');
    matrixDiv.innerHTML = `
        <h3 style="color: #ffd700; margin-top: 30px; margin-bottom: 15px;">Head-to-Head Matrix</h3>
        <div id="scoringMatrix"></div>
    `;
    roundRobinResults.appendChild(matrixDiv);

    // Build the matrix (unchanged from original logic)
    const matrixContainer = document.getElementById('scoringMatrix');
    const playerNames = game.players.map(