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

//    console.log(`🎯 showScoringPopup called - Round ${game.currentRound}, Call count:`, ++window.popupCallCount || (window.popupCallCount = 1));

//    console.log('🔍 showScoringPopup called with:', {
//        game,
//        detailedResults,
//        roundScores,
//        specialPoints,
//        roundNumber
//    });

    // CAPTURE SCORES FOR STATS - Check all possible score sources
    window.lastGameDetailedResults = detailedResults;
    window.lastGameRoundScores = roundScores;
    window.lastGameScores = {};

    // Try detailedResults first
    if (detailedResults && detailedResults.length > 0) {
//        console.log('🔍 Using detailedResults:', detailedResults);
        detailedResults.forEach(result => {
            window.lastGameScores[result.player1] = (window.lastGameScores[result.player1] || 0) + result.player1Score;
            window.lastGameScores[result.player2] = (window.lastGameScores[result.player2] || 0) + result.player2Score;
        });
    }

    // Try roundScores if detailedResults didn't work
    if (Object.keys(window.lastGameScores).length === 0 && roundScores) {
        console.log('🔍 Using roundScores:', roundScores);
        // roundScores might be an object like {Player1: 15, Player2: -3}
        if (typeof roundScores === 'object') {
            window.lastGameScores = {...roundScores};
        }
    }

    // Try specialPoints if nothing else worked
    if (Object.keys(window.lastGameScores).length === 0 && specialPoints) {
        console.log('🔍 Using specialPoints:', specialPoints);
        if (typeof specialPoints === 'object') {
            window.lastGameScores = {...specialPoints};
        }
    }

//    console.log('🔍 Final captured scores:', window.lastGameScores);
    // In showScoringPopup, after line 80, add:
//    console.log('🔍 Final captured scores DETAILS:', JSON.stringify(window.lastGameScores, null, 2));

    const popup = document.getElementById('scoringPopup');
    const allPlayerHands = document.getElementById('allPlayerHands');
    const roundRobinResults = document.getElementById('roundRobinResults');

    roundRobinResults.innerHTML = '';  // ADD THIS LINE

    // After roundRobinResults.innerHTML = '';
//    console.log('After clearing roundRobinResults:', roundRobinResults.children.length);

    // And later when you create the matrix:
//    console.log('Adding matrix to:', roundRobinResults);
//    console.log('roundRobinResults children before matrix:', roundRobinResults.children.length);

    // After adding the matrix:
//    console.log('roundRobinResults children after matrix:', roundRobinResults.children.length);

    // After the existing debug logs, add this:
    try {
        // Your matrix creation code
        const matrixDiv = document.createElement('div');
//        console.log('Created matrixDiv:', matrixDiv);

        matrixDiv.innerHTML = `
//            <h3 style="color: #ffd700; margin-top: 30px; margin-bottom: 15px;">Head-to-Head Matrix</h3>
            <div id="scoringMatrix"></div>
        `;
//        console.log('Set matrixDiv innerHTML');

//        commented out this block because roundRobinResults keep appending
//        roundRobinResults.appendChild(matrixDiv);
//        console.log('Appended matrixDiv to roundRobinResults');
//        console.log('roundRobinResults children NOW:', roundRobinResults.children.length);

    } catch (error) {
        console.error('Error creating matrix:', error);
    }

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


    // MOVE THIS SECTION TO THE TOP to show it first
    // Create scoring matrix
    const matrixContainer = document.getElementById('scoringMatrix');
    // Check if the HTML element exists, if not, create it
    if (!matrixContainer) {
        // Find a place to insert it. Let's assume you want it at the start of the popup content.
        const firstSection = document.querySelector('.player-hands-section');
        if (firstSection) {
            const matrixDiv = document.createElement('div');
            matrixDiv.id = 'scoringMatrix';
            matrixDiv.innerHTML = `<h3 style="color: #ffd700; margin-top: 30px; margin-bottom: 15px;">  </h3>`;
            firstSection.parentNode.insertBefore(matrixDiv, firstSection);
        }
    }

    // Build the matrix
    const playerNames = game.players.map(p => p.name);
    // Create matrix data
    const matrix = {};
    playerNames.forEach(player => {
        matrix[player] = {};
        playerNames.forEach(opponent => {
            matrix[player][opponent] = player === opponent ? '-' : 0;
        });
    });


//console.log(`🎯 Matrix created for round ${game.currentRound}. Total children in roundRobinResults:`, roundRobinResults.children.length);

    // Fill matrix with results
    detailedResults.forEach(result => {
        matrix[result.player1][result.player2] = result.player1Score > 0 ? `+${result.player1Score}` : result.player1Score;
        matrix[result.player2][result.player1] = result.player2Score > 0 ? `+${result.player2Score}` : result.player2Score;
    });

    // Create HTML table
    let tableHTML = `
        <h3 style="color: #ffd700; margin-top: 30px; margin-bottom: 15px;">Head-to-Head Matrix</h3>
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
            let cellColor = '#ccc';

            if (score === '-') {
                cellColor = '#666';
            } else if (score > 0) {
                cellColor = '#4ecdc4';
                rowTotal += parseInt(score);
            } else if (score < 0) {
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

    // The HTML has a placeholder for a scoring matrix. Let's make sure it's at the top.
    const container = document.querySelector('.scoring-content');
    if (container) {
        // Remove any existing tournament matrix (safest - only removes our specific element)
        const oldMatrix = container.querySelector('#tournament-head-to-head-matrix');
        if (oldMatrix) oldMatrix.remove();

        const matrixDiv = document.createElement('div');
        matrixDiv.id = 'tournament-head-to-head-matrix'; // Give it a unique ID
        matrixDiv.innerHTML = tableHTML;
        // Insert the matrix right after the title and close button
        container.insertBefore(matrixDiv, container.children[2]);
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

    // The original code appended the matrix here. We've moved it up.

    popup.style.display = 'block';
}

// Close scoring popup and clear all hands for next round (unchanged)function closeScoringPopup() {
async function closeScoringPopup() {
    // Save game stats before closing popup
    saveGameStats();

    document.getElementById('scoringPopup').style.display = 'none';


    resetGameUI();

    // Clear previous round's game data from Firestore
    if (window.isOwner && window.multiDeviceIntegration) {
        const tableId = window.multiDeviceIntegration.tableId;
        await firebase.firestore().collection('tables').doc(tableId.toString()).update({
            'currentGame': firebase.firestore.FieldValue.delete()
        });
    }

    // Clear all hand areas for next round
    clearAllHandAreas();

        if (window.gameConfig.config.gameDeviceMode === 'single-device') {
            // Single-player: use fallback logic
            setTimeout(() => {
            const newRoundButton = document.querySelector('button[onclick*="newRound"]') ||
                                  document.getElementById('newRoundButton') ||
                                  document.querySelector('.new-round-btn');

            if (newRoundButton) {
                console.log('🎮 Auto-starting new round...');
                newRoundButton.click();
            } else {
//                console.log('🎮 New round button not found, trying direct function call...');
                // Try calling the function directly if button not found
                if (typeof newRound === 'function') {
                    newRound();
                } else if (typeof game !== 'undefined' && game.startNewRound) {
                    game.startNewRound();
                }
            }
            }, 200); // Small delay to let popup close and hands clear

         } else if (window.isOwner) {
            // Multi-device owner: controls round progression
            game.startNewRound();
            setTableState('dealing');

        } else {
            // Multi-device non-owner: just advance currentRound
            // Owner's setTableState should trigger retrieveHandFromFirebase
             game.startNewRound();
        }
    }

function resetGameUI() {
    // Reset auto arrange state
    if (game.autoArrangeUsed) {
        game.autoArrangeUsed = false;
    }

    // Reset auto button to "Auto"
    const autoArrange = document.getElementById('autoArrange');
    if (autoArrange) {
        autoArrange.textContent = 'Auto';
        autoArrange.disabled = false;
    }

    // Reset submit button to disabled "Submit"
    const submitHand = document.getElementById('submitHand');
    if (submitHand) {
        submitHand.textContent = 'Submit';
        submitHand.disabled = true;
    }

    // Clear any submission indicators
    // Add other UI resets as needed
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

}

// ADD THIS FUNCTION - Save game statistics to Firebase
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
//        console.log('🔍 DEBUG - All player scores:', playerScores);

        const playerName = getPlayerName();
//        console.log('🔍 DEBUG - Player name:', playerName);

        const playerScore = playerScores[playerName] || 0;
//        console.log('🔍 DEBUG - Player score:', playerScore);

        const playerRank = calculatePlayerRank(playerScores, playerName);
//        console.log('🔍 DEBUG - Player rank:', playerRank);

        // Get game configuration
        const gameConfig = window.gameConfig ? window.gameConfig.getConfig() : {};

        // Create game data object
        const gameData = {
            gameMode: gameConfig.gameMode || 'multiplayer',
            wildCardCount: gameConfig.wildCardCount || 0,
            playerCount: Object.keys(playerScores).length,
            playerScore: playerScore,
            playerRank: playerRank,
            allPlayerScores: playerScores,
            gameLength: getGameLength(),
            opponents: Object.keys(playerScores).filter(name => name !== playerName)
        };

//        console.log('📊 Saving game stats:', gameData);
        window.userStatsManager.saveGameResult(gameData);

    } catch (error) {
        console.error('❌ Error saving game stats:', error);
    }
}

// Helper functions (add these too if they don't exist)
function calculateFinalScores() {
    console.log('🔍 Calculating final scores...');

    // FIRST: Use captured scores from popup (this is the correct data!)
    if (window.lastGameScores && Object.keys(window.lastGameScores).length > 0) {
//        console.log('🔍 Using captured scores from popup:', window.lastGameScores);
        return window.lastGameScores;
    }

    // Remove or comment out the rest of this function since it creates empty scores
    console.log('🔍 No captured scores available - this should not happen!');
    return {};
}

function getPlayerName() {
    // Check if there's a human player in the game
    if (window.game && window.game.players) {
        const humanPlayer = window.game.players.find(p => !p.isAI);
        if (humanPlayer) {
//            console.log('🔍 Found human player:', humanPlayer.name);
            return humanPlayer.name;
        }
    }

    // Fallback: assume first player is human
    if (window.game && window.game.playerManager && window.game.playerManager.players) {
        const firstPlayer = window.game.playerManager.players[0];
        if (firstPlayer) {
            console.log('🔍 Using first player:', firstPlayer.name);
            return firstPlayer.name;
        }
    }

    // Last resort
    console.log('🔍 Last resort using Player 1:');
    return 'Player 1';
}

function calculatePlayerRank(playerScores, playerName) {
    const scores = Object.values(playerScores).sort((a, b) => b - a);
    const playerScore = playerScores[playerName];
    return scores.indexOf(playerScore) + 1;
}

function getGameLength() {
    return 60; // placeholder - replace with actual timing
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
