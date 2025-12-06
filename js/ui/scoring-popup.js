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

// Strip @gmail.com for compact display
function getCompactName(playerName) {
    return playerName.replace(/@gmail\.com$/, '');
}

async function distributeChips() {
    console.log('🔍 distributeChips START');

    // Only owner distributes (prevents double in multiplayer)
    if (window.game?.multiDeviceMode && !window.isOwner) {
        console.log('🔍 Non-owner, skipping distribution');
        return;
    }

    const playerTotals = window.game?.lastRoundTotals || {};
    const pot = window.game?.currentRoundPot || 0;
    const multiplier = window.gameConfig?.config?.stakesMultiplierAmount || 1;

    console.log('🔍 playerTotals:', playerTotals);
    console.log('🔍 pot:', pot);
    console.log('🔍 multiplier:', multiplier);

    // Filter out surrendered players from pot eligibility
    const activePlayers = Object.keys(playerTotals).filter(playerName => {
        const decision = window.game.surrenderDecisions?.get(playerName);
        console.log(`🔍 ${playerName}: decision=${decision}, surrenderDecisions exists=${!!window.game.surrenderDecisions}`);
        return decision !== 'surrender';
    });

    console.log('🔍 activePlayers eligible for pot:', activePlayers);
    console.log('🔍 All playerTotals:', Object.keys(playerTotals));
    console.log('🔍 surrenderDecisions Map:', Array.from(window.game.surrenderDecisions?.entries() || []));

    // Find pot winner(s) - only among active players
    const maxTotal = Math.max(...activePlayers.map(name => playerTotals[name]));
    const winners = activePlayers.filter(p => playerTotals[p] === maxTotal);
    const potShare = Math.floor(pot / winners.length);

    console.log('🔍 maxTotal:', maxTotal);
    console.log('🔍 winners:', winners);
    console.log('🔍 potShare:', potShare);

    // Update each player's chips
    for (const [playerName, netPoints] of Object.entries(playerTotals)) {
        const payout = netPoints * multiplier;
        const potWin = winners.includes(playerName) ? potShare : 0;
        const totalChange = payout + potWin;

        // Get Firebase key
        const isAI = playerName.endsWith('_AI') || playerName.includes(' AI');
        const playerKey = isAI ? playerName : playerName.replace(/\./g, ',').replace(/@/g, '_at_');

        console.log(`🔍 ${playerName}: netPoints=${netPoints}, payout=${payout}, potWin=${potWin}, totalChange=${totalChange}`);

        const result = await firebase.database().ref(`players/${playerKey}/chips`)
            .transaction(current => (current || 0) + totalChange);

        const newChips = result.snapshot.val();
        console.log(`🔍 ${playerName}: newChips=${newChips}`);

        // Reload if less than 0
        if (newChips < 0) {
            await firebase.database().ref(`players/${playerKey}/chips`).set(10000);
            await firebase.database().ref(`players/${playerKey}/lastKnownChips`).set(10000);
            await firebase.database().ref(`players/${playerKey}/reloads`)
                .transaction(current => (current || 0) + 1);
            console.log(`🔄 ${playerName} balance below 0, reload 10,000 chips`);
        } else {
            await firebase.database().ref(`players/${playerKey}/lastKnownChips`).set(newChips);
        }
    }

    console.log(`✅ Chips distributed. Pot ${pot} to: ${winners.join(', ')}`);
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
async function showScoringPopup(game, detailedResults, roundScores, specialPoints, roundNumber = null) {

    console.log ('DEBUG: showScoringPopup called')


    // CAPTURE SCORES FOR STATS - Check all possible score sources
    window.lastGameDetailedResults = detailedResults;
    window.lastGameRoundScores = roundScores;
    window.lastGameScores = {};

    // Try detailedResults first
    if (detailedResults && detailedResults.length > 0) {
        console.log('🔍 Using detailedResults:', detailedResults);
        detailedResults.forEach(result => {
            window.lastGameScores[result.player1] = (window.lastGameScores[result.player1] || 0) + result.player1Score;
            window.lastGameScores[result.player2] = (window.lastGameScores[result.player2] || 0) + result.player2Score;
        });
    }

//    console.log('🔍 Final captured scores:', window.lastGameScores);
    // In showScoringPopup, after line 80, add:
//    console.log('🔍 Final captured scores DETAILS:', JSON.stringify(window.lastGameScores, null, 2));

    const popup = document.getElementById('scoringPopup');
    const allPlayerHands = document.getElementById('allPlayerHands');
    const roundRobinResults = document.getElementById('roundRobinResults');

    roundRobinResults.innerHTML = '';  // ADD THIS LINE

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
        tableHTML += `<th style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #ffd700; font-weight: bold; min-width: 80px;">${getCompactName(player)}</th>`;
    });

    // Add Total column header

    tableHTML += `<th style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #4ecdc4; font-weight: bold; min-width: 80px; background: rgba(78,205,196,0.2);">Total</th>`;

    // ADD THIS:
    tableHTML += `<th style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #ffd700; font-weight: bold; min-width: 80px; background: rgba(255,215,0,0.2);">Payout</th>`;

    const playerTotals = {};

    // Data rows
    playerNames.forEach(player => {
        tableHTML += `<tr>`;
        tableHTML += `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #ffd700; font-weight: bold; background: rgba(255,215,0,0.1);">${getCompactName(player)}</td>`;

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
            playerTotals[player] = rowTotal
        });

        window.game.lastRoundTotals = playerTotals

        // Add total cell with special styling
        const totalColor = rowTotal > 0 ? '#4ecdc4' : rowTotal < 0 ? '#ff6b6b' : '#ffd700';
        const totalSign = rowTotal > 0 ? '+' : '';
        tableHTML += `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: center; color: ${totalColor}; font-weight: bold; font-size: 16px; background: rgba(78,205,196,0.1);">${totalSign}${rowTotal}</td>`;


        // ADD THIS:
        const multiplier = window.gameConfig?.config?.stakesMultiplierAmount || 1;
        const payout = rowTotal * multiplier;
        const payoutColor = payout > 0 ? '#4ecdc4' : payout < 0 ? '#ff6b6b' : '#ffd700';
        const payoutSign = payout > 0 ? '+' : '';
        tableHTML += `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: center; color: ${payoutColor}; font-weight: bold; font-size: 16px; background: rgba(255,215,0,0.1);">${payoutSign}${payout}</td>`;

        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table>`;

    // Determine pot winner(s)
    const tableId = window.game?.currentTableId;
    const potSnapshot = await firebase.database().ref(`tables/${tableId}/pot`).once('value');
    const pot = potSnapshot.val() || 0;
    console.log('🔍 Current Round Pot from Firebase:', pot);
    window.game.currentRoundPot = pot;  // Save for distributeChips

    // Find highest total
    const maxTotal = Math.max(...Object.values(playerTotals));
    const winners = Object.keys(playerTotals).filter(p => playerTotals[p] === maxTotal);

    // Build pot winner display
    let potWinnerHTML = '';
    if (pot > 0) {
        if (winners.length === 1) {
            potWinnerHTML = `<div style="text-align: center; margin-top: 15px; padding: 10px; background: rgba(255,215,0,0.2); border-radius: 8px; color: #ffd700; font-size: 18px; font-weight: bold;">🏆 Pot Winner: ${winners[0]} +${pot} chips</div>`;
        } else {
            const splitAmount = Math.floor(pot / winners.length);
            potWinnerHTML = `<div style="text-align: center; margin-top: 15px; padding: 10px; background: rgba(255,215,0,0.2); border-radius: 8px; color: #ffd700; font-size: 18px; font-weight: bold;">🏆 Pot Split: ${winners.join(', ')} +${splitAmount} chips each</div>`;
        }
    }

    tableHTML += potWinnerHTML;

    // Distribute chips NOW so display shows actual values
    window.game.lastRoundTotals = playerTotals;
    window.game.currentRoundPot = pot;
    await distributeChips();

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

            // Check if player surrendered
            const surrendered = window.game.surrenderDecisions?.get(player.name) === 'surrender';

            if (surrendered) {
                // Display surrender message
                playerDiv.innerHTML = `
                    <div class="player-hand-title">${player.name}</div>
                    <div class="hand-row" style="padding: 20px; text-align: center;">
                        <div style="color: #ff6b6b; font-weight: bold; font-size: 1.1em;">
                            Surrendered
                        </div>
                        <div style="color: #888; margin-top: 10px;">
                            Paid 10 chip penalty
                        </div>
                    </div>
                `;
            } else {
                // Display normal hand (existing code)
                const backCardCount = hand.back ? hand.back.length : 5;
                const middleCardCount = hand.middle ? hand.middle.length : 5;
                const frontCardCount = hand.front ? hand.front.length : 3;

                playerDiv.innerHTML = `
                    <div class="player-hand-title">${player.name}</div>
                    <div class="hand-row">
                        <div class="hand-label-popup">Back (${backCardCount}):</div>
                        <div class="hand-cards">${renderMiniCards(hand.back)}</div>
                        <div class="hand-strength-popup">${getHandName(evaluateHand(hand.back))} (${evaluateHand(hand.back).handStrength.join(', ')})</div>
                    </div>
                    <div class="hand-row">
                        <div class="hand-label-popup">Middle (${middleCardCount}):</div>
                        <div class="hand-cards">${renderMiniCards(hand.middle)}</div>
                        <div class="hand-strength-popup">${getHandName(evaluateHand(hand.middle))} (${evaluateHand(hand.middle).handStrength.join(', ')})</div>
                    </div>
                    <div class="hand-row">
                        <div class="hand-label-popup">Front (${frontCardCount}):</div>
                        <div class="hand-cards">${renderMiniCards(hand.front)}</div>
                        <div class="hand-strength-popup">${getThreeCardHandName(evaluateThreeCardHand(hand.front))} (${evaluateThreeCardHand(hand.front).handStrength.join(', ')})</div>
                    </div>
                `;
            }
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
                        ${detail.player1Hand.name} (${detail.player1Hand.handStrength.join(', ')}) ${getPointsDisplay(detail.player1Hand, detail.hand, result.player1, true)}
                    </div>
                    <div style="color: #ffd700; font-weight: bold;">${detail.hand}</div>
                    <div class="player-result ${p2Class}">
                        ${detail.player2Hand.name} (${detail.player2Hand.handStrength.join(', ')}) ${getPointsDisplay(detail.player2Hand, detail.hand, result.player2, false)}
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

    // Chip summary - add last so it positions correctly
    const currentChips = window.lastKnownChips || 0;

    const currentUser = firebase.auth().currentUser;
    const userEmail = currentUser?.email || 'You';
    const payoutMultiplier = window.gameConfig?.config?.stakesMultiplierAmount || 1;
    const myTotal = playerTotals[userEmail] || 0;
    const myPayout = myTotal * payoutMultiplier;
    const myPotWin = winners.includes(userEmail) ? Math.floor(pot / winners.length) : 0;
    const expectedChips = currentChips + myPayout + myPotWin;

    // Chip summary for ALL players
    let chipSummaryDiv = document.getElementById('popup-chip-summary');
    if (!chipSummaryDiv) {
        chipSummaryDiv = document.createElement('div');
        chipSummaryDiv.id = 'popup-chip-summary';
        chipSummaryDiv.style.cssText = 'padding: 10px; background: #2c3e50; color: white; border-radius: 8px; margin-bottom: 15px;';
    }

    // Insert right after h2, before the matrix
    const titleH2 = popup.querySelector('h2');
    titleH2.insertAdjacentElement('afterend', chipSummaryDiv);

    // Build chip lines for all players
//    const payoutMultiplier = window.gameConfig?.config?.stakesMultiplierAmount || 1;
    let chipLinesHTML = '';

    for (const player of game.players) {
        // Get Firebase key
        const isAI = player.type === 'ai' || player.name.endsWith('_AI');
        const playerKey = isAI
            ? player.name
            : player.name.replace(/\./g, ',').replace('@', '_at_');

        // Read lastKnownChips from Firebase
        const snapshot = await firebase.database().ref(`players/${playerKey}/lastKnownChips`).once('value');
        const lastKnownChips = snapshot.val() || 0;

        // Calculate changes
        const playerTotal = playerTotals[player.name] || 0;
        const playerPayout = playerTotal * payoutMultiplier;
        const playerPotWin = winners.includes(player.name) ? Math.floor(pot / winners.length) : 0;
        const totalChange = playerPayout + playerPotWin;

        // Read actual chips after distribution
        const chipsSnapshot = await firebase.database().ref(`players/${playerKey}/chips`).once('value');
        const actualChips = chipsSnapshot.val() || 0;
        const beforeChips = actualChips - totalChange;  // Calculate what it was before

        const changeSign = totalChange >= 0 ? '+' : '';
        const changeColor = totalChange > 0 ? '#4ecdc4' : totalChange < 0 ? '#ff6b6b' : '#ffd700';

        chipLinesHTML += `<div style="margin: 5px 0;">
            👤 ${player.name} | 💰 ${beforeChips.toLocaleString()}
            <span style="color: ${changeColor}">${changeSign}${totalChange}</span>
            = ${actualChips.toLocaleString()} chips
        </div>`;

    }

    chipSummaryDiv.innerHTML = chipLinesHTML;

    popup.style.display = 'block';

    // Return Promise that waits for close button
    return new Promise((resolve) => {
        const closeButton = popup.querySelector('.btn.btn-primary');

        // Remove old handler without cloning (preserves disabled state)
        closeButton.onclick = null;

        closeButton.onclick = () => {
            closeScoringPopup();
            resolve();
        };
    });

    console.log('🔍 showScoringPopup END - button disabled:', document.querySelector('#scoringPopup .btn.btn-primary')?.disabled);
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

        // Check if tournament is complete - don't start new round
        if (window.game.currentRound >= window.game.totalRounds) {
            console.log('🏆 Tournament complete - not starting new round');
            return;
        }

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
            // comment this out because it's redundant as it's already set to dealing somewhere else
//            setTableState('dealing');

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
