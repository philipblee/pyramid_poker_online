// js/ui/scoring-popup.js
// COMPLETE VERSION: Uses ScoringUtilities for all scoring calculations

// Render mini cards for scoring popup
function renderMiniCards(cards) {
    return cards.map(card => {
        if (card.isWild) {
            return `<div class="card-mini wild">🃏</div>`;
        } else if (card.wasWild) {
            // Substituted wild card - show with yellow background
            const colorClass = ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
            return `<div class="card-mini ${colorClass}" style="background: linear-gradient(135deg, #ffd700, #ffed4e); border: 1px solid #ff6b6b;"><div>${card.rank}</div><div>${card.suit}</div></div>`;
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
function showScoringPopup(game, detailedResults, roundScores, specialPoints, roundNumber = null) {
    const popup = document.getElementById('scoringPopup');
    const allPlayerHands = document.getElementById('allPlayerHands');
    const roundRobinResults = document.getElementById('roundRobinResults');

    // Update the popup title to show which round
    const title = roundNumber ? `Round ${roundNumber} Results` : `Round ${game.currentRound} Results`;
    popup.querySelector('h2').textContent = `🏆 ${title}`;

    // For historical rounds, get hands from round history
    let handsToDisplay;
    if (roundNumber && game.roundHistory) {
        const historicalRound = game.roundHistory.find(round => round.roundNumber === roundNumber);
        handsToDisplay = historicalRound ? historicalRound.submittedHands : game.submittedHands;
    } else {
        handsToDisplay = game.submittedHands;
    }


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
            const getPointsDisplay = (playerHand, position, playerName, isPlayer1) => {
                if (detail.winner === 'tie') return '(0)';

                // Get actual card count from submitted hands
                const cardCount = getCardCountFromSubmittedHands(game, playerName, position);

                // Only calculate points for the WINNER's hand
                let points = 0;
                if (detail.winner === 'player1') {
                    points = ScoringUtilities.getPointsForHand(detail.player1Hand, position, cardCount);
                    return isPlayer1 ? `(+${points})` : `(-${points})`;
                } else if (detail.winner === 'player2') {
                    points = ScoringUtilities.getPointsForHand(detail.player2Hand, position, cardCount);
                    return isPlayer1 ? `(-${points})` : `(+${points})`;
                }

                return '(0)';
            };

            matchupHTML += `
                <div class="comparison-row">
                    <div class="player-result ${p1Class}">
                        ${detail.player1Hand.name} (${detail.player1Hand.hand_rank.join(', ')}) ${getPointsDisplay(detail.player1Hand, detail.hand, result.player1, true)}
                    </div>
                    <div style="color: #ffd700; font-weight: bold;">${detail.hand}</div>
                    <div class="player-result ${p2Class}">
                        ${detail.player2Hand.name} (${detail.player2Hand.hand_rank.join(', ')}) ${getPointsDisplay(detail.player2Hand, detail.hand, result.player2, false)}
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

    // Add Total column header
    tableHTML += `<th style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #4ecdc4; font-weight: bold; min-width: 80px; background: rgba(78,205,196,0.2);">Total</th>`;

    tableHTML += `</tr></thead><tbody>`;

    // Data rows
    playerNames.forEach(player => {
        tableHTML += `<tr>`;
        tableHTML += `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #ffd700; font-weight: bold; background: rgba(255,215,0,0.1);">${player}</td>`;

        let rowTotal = 0;

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
                rowTotal += parseInt(score);
            } else if (score < 0) {
                cellClass = 'negative';
                cellColor = '#ff6b6b';
                rowTotal += parseInt(score);
            }

            tableHTML += `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: center; color: ${cellColor}; font-weight: bold;">${score}</td>`;
        });

        // Add total cell with special styling
        const totalColor = rowTotal > 0 ? '#4ecdc4' : rowTotal < 0 ? '#ff6b6b' : '#ffd700';
        const totalSign = rowTotal > 0 ? '+' : '';
        tableHTML += `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: center; color: ${totalColor}; font-weight: bold; font-size: 16px; background: rgba(78,205,196,0.1);">${totalSign}${rowTotal}</td>`;

        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table>`;
    matrixContainer.innerHTML = tableHTML;

    popup.style.display = 'block';
}

// Close scoring popup and clear all hands for next round (unchanged)
function closeScoringPopup() {

    // Save game stats before closing popup
    saveGameStats();

    document.getElementById('scoringPopup').style.display = 'none';

    // Clear all hand areas for next round
    clearAllHandAreas();
}

// Clear all hand areas (unchanged)
function clearAllHandAreas() {
    const handAreas = ['playerHand', 'backHand', 'middleHand', 'frontHand'];

    handAreas.forEach(handId => {
        const handElement = document.getElementById(handId);
        if (handElement) {
            handElement.innerHTML = '';
        }
    });

    // Clear hand strength displays
    const strengthDisplays = ['backStrength', 'middleStrength', 'frontStrength'];
    strengthDisplays.forEach(strengthId => {
        const strengthElement = document.getElementById(strengthId);
        if (strengthElement) {
            strengthElement.textContent = '';
        }
    });

    console.log('🧹 Cleared all hand areas for next round');

    setTimeout(() => {
        const newRoundButton = document.querySelector('button[onclick*="newRound"]') ||
                              document.getElementById('newRoundButton') ||
                              document.querySelector('.new-round-btn');

        if (newRoundButton) {
            console.log('🎮 Auto-starting new round...');
            newRoundButton.click();
        } else {
            console.log('🎮 New round button not found, trying direct function call...');
            // Try calling the function directly if button not found
            if (typeof newRound === 'function') {
                newRound();
            } else if (typeof game !== 'undefined' && game.startNewRound) {
                game.startNewRound();
            }
        }
    }, 200); // Small delay to let popup close and hands clear

}

// Save game statistics to Firebase
function saveGameStats() {
    // Only save if user is logged in
    if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
        console.log('📊 No user logged in, skipping stats save');
        return;
    }

    if (!window.userStatsManager) {
        console.log('📊 User stats manager not available');
        return;
    }

    try {
        // Calculate final scores and rankings
        const playerScores = calculateFinalScores();
        const playerName = getPlayerName();
        const playerScore = playerScores[playerName] || 0;
        const playerRank = calculatePlayerRank(playerScores, playerName);

        // Get game configuration
        const gameConfig = window.gameConfig ? window.gameConfig.getConfig() : {};

        // Get final hands for the human player
        const finalHands = getFinalPlayerHands(playerName);

        // Create game data object
        const gameData = {
            // Game Settings
            gameMode: gameConfig.gameMode || 'multiplayer',
            wildCardCount: gameConfig.wildCardCount || 0,
            playerCount: Object.keys(playerScores).length,

            // Player Performance
            playerScore: playerScore,
            playerRank: playerRank,

            // Hand Details
            finalHands: finalHands,

            // All Players Results
            allPlayerScores: playerScores,

            // Game Timing
            gameLength: getGameLength(), // seconds

            // Opponents
            opponents: Object.keys(playerScores).filter(name => name !== playerName)
        };

        console.log('📊 Saving game stats:', gameData);

        // Save to Firebase
        window.userStatsManager.saveGameResult(gameData);

    } catch (error) {
        console.error('❌ Error saving game stats:', error);
    }
}

// Helper function to calculate final scores from the game state
function calculateFinalScores() {
    const scores = {};

    // Initialize all player scores
    if (window.game && window.game.players) {
        window.game.players.forEach(player => {
            scores[player.name] = 0;
        });
    }

    // Add up scores from the latest round results
    // This depends on how your scoring system stores results
    if (window.game && window.game.latestDetailedResults) {
        window.game.latestDetailedResults.forEach(result => {
            scores[result.player1] = (scores[result.player1] || 0) + result.player1Score;
            scores[result.player2] = (scores[result.player2] || 0) + result.player2Score;
        });
    }

    return scores;
}

// Helper function to get the human player's name
function getPlayerName() {
    // Check different ways the player name might be stored
    if (window.game && window.game.players) {
        const humanPlayer = window.game.players.find(p => !p.isAI);
        if (humanPlayer) return humanPlayer.name;
    }

    // Default fallback
    return 'Human Player';
}

// Helper function to calculate player rank
function calculatePlayerRank(playerScores, playerName) {
    const scores = Object.values(playerScores).sort((a, b) => b - a);
    const playerScore = playerScores[playerName];
    return scores.indexOf(playerScore) + 1;
}

// Helper function to get final hands
function getFinalPlayerHands(playerName) {
    if (window.game && window.game.submittedHands) {
        const playerHands = window.game.submittedHands.get(playerName);
        if (playerHands) {
            return {
                back: playerHands.back ? playerHands.back.map(card => ({rank: card.rank, suit: card.suit})) : [],
                middle: playerHands.middle ? playerHands.middle.map(card => ({rank: card.rank, suit: card.suit})) : [],
                front: playerHands.front ? playerHands.front.map(card => ({rank: card.rank, suit: card.suit})) : []
            };
        }
    }
    return { back: [], middle: [], front: [] };
}

// Helper function to track game timing
let gameStartTime = Date.now();
function resetGameTimer() {
    gameStartTime = Date.now();
}

function getGameLength() {
    return Math.round((Date.now() - gameStartTime) / 1000); // seconds
}