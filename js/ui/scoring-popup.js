// js/ui/scoring-popup.js
// COMPLETE VERSION: Uses ScoringUtilities for all scoring calculations

// Add this helper function at the top of scoring-popup.js
function sortCardsForDisplay(cards, handStrength) {
    const suitRank = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
    return [...cards].sort((a, b) => {
        if (a.value !== b.value) return b.value - a.value;
        return suitRank[b.suit] - suitRank[a.suit];
    });
}

// Show mini cards for scoring popup
function showMiniCards(cards) {
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

    const playerTotals = window.game?.lastRoundTotals || {};

    // 🔧 Read pot from Firebase, not cached value
    const tableId = window.game?.currentTableId;
    const potSnapshot = await firebase.database().ref(`tables/${tableId}/pot`).once('value');
    const pot = potSnapshot.val() || 0;

    const multiplier = window.gameConfig?.config?.stakesMultiplierAmount || 1;

    // Filter out surrendered players from pot eligibility
    const activePlayers = Object.keys(playerTotals).filter(playerName => {
        const decision = window.game.surrenderDecisions?.get(playerName);
        return decision !== 'surrender';
    });

    // 🔧 NEW: Check if ALL players surrendered
    const allPlayerNames = Object.keys(playerTotals);
    const allSurrendered = allPlayerNames.every(name =>
        window.game.surrenderDecisions?.get(name) === 'surrender'
    );

    if (allSurrendered) {
        console.log('⚖️ All players surrendered - splitting pot equally');
        const equalShare = Math.floor(pot / allPlayerNames.length);
        const anteAmount = window.gameConfig?.config?.anteAmount || 10;
        const chipChanges = new Map();

        for (const playerName of allPlayerNames) {
            // Update chips in Firebase
            const playerKey = playerName.replace(/\./g, ',').replace(/@/g, '_at_');
            await firebase.database().ref(`players/${playerKey}/chips`)
                .transaction(currentChips => (currentChips || 0) + equalShare);

            // Build chip change: got equalShare back, paid ante + 10 penalty
            const totalChange = equalShare - anteAmount - 10;
            chipChanges.set(playerName, totalChange);
            console.log(`⚖️ ${playerName}: share=${equalShare}, ante=${anteAmount}, penalty=10, net=${totalChange}`);
        }

        // Store for summary display
        if (window.game) {
            window.game.lastRoundChipChanges = chipChanges;
        }

        // 🔧 NEW: Set winners to ALL players for display
        window.lastRoundFinancial = {
            surrenderDecisions: window.game.surrenderDecisions,
            pot: pot,
            winners: allPlayerNames,  // ← Everyone is a winner!
            potShare: equalShare,
            playerTotals: playerTotals
        };

        // Clear the pot
//        await firebase.database().ref(`tables/${window.game.currentTableId}/pot`).set(0);
        console.log('✅ Pot split equally among all surrendered players');

        return chipChanges; // Return the map
    }

    // Normal chip distribution continues - calculate winners
    const maxTotal = Math.max(...activePlayers.map(name => playerTotals[name]));
    const winners = activePlayers.filter(p => playerTotals[p] === maxTotal);
    const potShare = winners.length > 0 ? Math.floor(pot / winners.length) : 0;

    // ONLY OWNER updates Firebase
    if (window.isOwner) {
        // Update each player's chips
        for (const [playerName, netPoints] of Object.entries(playerTotals)) {
            const payout = netPoints * multiplier;
            const potWin = winners.includes(playerName) ? potShare : 0;
            const totalChange = payout + potWin;

            // Get Firebase key
            const isAI = playerName.endsWith('_AI') || playerName.includes(' AI');
            const playerKey = isAI ? playerName : playerName.replace(/\./g, ',').replace(/@/g, '_at_');

            const result = await firebase.database().ref(`players/${playerKey}/chips`)
                .transaction(current => (current || 0) + totalChange);

            const newChips = result.snapshot.val();

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
    }
    // Build chip changes map (AFTER the update loop)
    const chipChanges = new Map();
    const anteAmount = window.gameConfig?.config?.anteAmount || 10;
    for (const [playerName, netPoints] of Object.entries(playerTotals)) {
        const payout = netPoints * multiplier;
        const potWin = winners.includes(playerName) ? potShare : 0;

        // Include surrender penalty in chip delta so sidebar / history totals match
        const surrendered = window.game.surrenderDecisions?.get(playerName) === 'surrender';
        const surrenderPenalty = surrendered ? -10 : 0;

        const totalChange = payout + potWin - anteAmount + surrenderPenalty;
        chipChanges.set(playerName, totalChange);
    }

    // Persist chip changes so sidebar / history can access them
    if (window.game) {
        window.game.lastRoundChipChanges = chipChanges;
    }

    console.log(`✅ Chips distributed. Pot ${pot} to: ${winners.join(', ')}`);

    // Capture financial snapshot for debugging / stats
    window.lastRoundFinancial = {
        surrenderDecisions: window.game.surrenderDecisions,  // ✅ FIX
        pot: pot,
        winners: winners,
        potShare: potShare,
        playerTotals: playerTotals
    };

    return chipChanges;

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

    // CAPTURE SCORES FOR STATS - Check all possible score sources
    window.lastGameDetailedResults = detailedResults;
    window.lastGameRoundScores = roundScores;
    window.lastGameScores = {};

    // Try detailedResults first
    if (detailedResults && detailedResults.length > 0) {
        detailedResults.forEach(result => {
            window.lastGameScores[result.player1] = (window.lastGameScores[result.player1] || 0) + result.player1Score;
            window.lastGameScores[result.player2] = (window.lastGameScores[result.player2] || 0) + result.player2Score;
        });
    }


    const popup = document.getElementById('scoringPopup');
    const allPlayerHands = document.getElementById('allPlayerHands');
    const roundRobinResults = document.getElementById('roundRobinResults');

     // Clear previous round robin results content
    roundRobinResults.innerHTML = '';  // Good — keep this

    // Update the popup title
    const title = roundNumber ? `Round ${roundNumber} Results` : `Round ${game.currentRound} Results`;
    popup.querySelector('h2').textContent = `🏆 ${title}`;

    // Determine hands to display
    let handsToDisplay = game.submittedHands;
    if (roundNumber && game.roundHistory) {
        const historicalRound = game.roundHistory.find(r => r.roundNumber === roundNumber);
        if (historicalRound) handsToDisplay = historicalRound.submittedHands;
    }

    // === Calculate playerTotals ONCE (net points this round) ===
    // Use roundScores directly if available (it includes automatic points)
    // Otherwise calculate from detailedResults
    const playerTotals = {};

    game.players.forEach(player => {
        playerTotals[player.name] = 0;
    });

    if (roundScores && roundScores instanceof Map && roundScores.size > 0) {
        // Use roundScores directly - it already includes automatic points
        roundScores.forEach((score, playerName) => {
            if (playerTotals.hasOwnProperty(playerName)) {
                playerTotals[playerName] = score;
            }
        });
    } else {
        // Fallback: calculate from detailedResults (for backwards compatibility)
        detailedResults.forEach(result => {
            playerTotals[result.player1] += result.player1Score;
            playerTotals[result.player2] += result.player2Score;
        });
    }


    window.game.lastRoundTotals = playerTotals;
    window.game.lastGameScores = playerTotals;  // if sidebar uses this too

    // === Fetch pot from Firebase ===
    const tableId = window.game?.currentTableId;

    const potSnapshot = await firebase.database().ref(`tables/${tableId}/pot`).once('value');
    const pot = potSnapshot.val() || 0;

    window.game.currentRoundPot = pot;

    // === Determine pot winners (excluding surrendered players) ===
    const activePlayers = Object.keys(playerTotals).filter(playerName => {
        const decision = window.game.surrenderDecisions?.get(playerName);
        return decision !== 'surrender';
    });

    const maxTotal = Math.max(...activePlayers.map(name => playerTotals[name]));
    const winners = activePlayers.filter(p => playerTotals[p] === maxTotal);

//    // === Show Head-to-Head Matrix ===
    showHeadToHeadMatrix(game, detailedResults, playerTotals, pot, winners);

    // Show All Players Hands
    allPlayerHands.innerHTML = '';
    showPlayerHands(game, handsToDisplay, allPlayerHands);

    // Show Round Robin Scoring (detailed matchups)
    roundRobinResults.innerHTML = '';
    showRoundRobinScoring(detailedResults, game, roundRobinResults, roundScores);

    // Distribute chips and then show Round Summary for Chips
    // This chart includes initial ante, pot winnings and net payouts
    const chipChanges = await distributeChips();

    // 🔧 NEW: If all surrendered, use corrected financial data
    let finalPot = pot;
    let finalWinners = winners;
    if (window.lastRoundFinancial?.winners) {
        finalPot = window.lastRoundFinancial.pot;
        finalWinners = window.lastRoundFinancial.winners;
        console.log('🔧 Using corrected financial data for all-surrendered case');
    }

    const financialHtml = showRoundSummaryForChips(
        game,
        window.game.surrenderDecisions,
        finalPot,                                 // ← Use corrected pot
        finalWinners,                            // ← Use corrected winners
        null,
        playerTotals,
        chipChanges
    );

    if (financialHtml) {
        roundRobinResults.innerHTML += financialHtml;
    }

    popup.style.display = 'block';

    // Chip summary - add last so it positions correctly
    // This includes all players and includes pot and payouts (excludes ante because that was collected earlier)
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

    // ✅ Always enable button when showing popup
    const closeButton = popup.querySelector('.btn.btn-primary');
    if (closeButton) {
        closeButton.disabled = false;
        console.log('✅ Continue button enabled after chip distribution');
    }

    // Return Promise that waits for close button
    return new Promise((resolve) => {
        if (window.gameConfig?.config?.gameDeviceMode === 'multi-device') {
            // Multi-device: preserve enhanceContinueButton wrapper
            const existingOnClick = closeButton.onclick;
            closeButton.onclick = async () => {
                if (existingOnClick) {
                    await existingOnClick.call(closeButton);
                }
                closeScoringPopup();
                resolve();
            };
        } else {
            // Single-player: replace handler (no nesting)
            closeButton.onclick = () => {
                closeScoringPopup();
                resolve();
            };
        }
    });

    console.log('🔍 showScoringPopup END - button disabled:', document.querySelector('#scoringPopup .btn.btn-primary')?.disabled);
}

// Close scoring popup and clear all hands for next round
let isClosingPopup = false; // Guard against double calls

async function closeScoringPopup() {
    // Prevent double calls - if already closing, return early
    if (isClosingPopup) {
        return;
    }
    
    const popup = document.getElementById('scoringPopup');
    if (!popup || popup.style.display === 'none') {
        console.log('🔍 closeScoringPopup: Popup already closed, skipping');
        return;
    }
    
    isClosingPopup = true;
    
    try {
        // Save game stats before closing popup
        saveGameStats();

        popup.style.display = 'none';

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

    // UPDATE CHIP CHANGES IN ROUND HISTORY - ADD THIS HERE
    if (window.game.lastRoundChipChanges) {
        const currentRoundData = window.game.roundHistory.find(r => r.roundNumber === window.game.currentRound);
        if (currentRoundData) {
            currentRoundData.chipChanges = new Map(window.game.lastRoundChipChanges);
        } else {
            console.log('🔍 Could not find roundData for round:', window.game.currentRound);
        }
    }

    // NOW proceed with device-specific logic
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
    } else {
        // Multi-device non-owner: just advance currentRound
        // Owner's setTableState should trigger retrieveHandFromFirebase
        game.startNewRound();
    }
    } finally {
        // Reset guard after completion (even if error occurred)
        isClosingPopup = false;
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
        autoArrange.textContent = 'BEST';
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

async function showHeadToHeadMatrix(game, detailedResults, playerTotals, pot, winners, containerSelector = '.scoring-content') {

    // Build the player names list
    const playerNames = game.players.map(p => p.name);

    // Create matrix data structure
    const matrix = {};
    playerNames.forEach(player => {
        matrix[player] = {};
        playerNames.forEach(opponent => {
            matrix[player][opponent] = player === opponent ? '-' : 0;
        });
    });

    // Fill matrix with scores — always as strings with consistent formatting
    detailedResults.forEach(result => {
        const format = (s) => s > 0 ? `+${s}` : s === 0 ? '0' : `${s}`;

        matrix[result.player1][result.player2] = format(result.player1Score);
        matrix[result.player2][result.player1] = format(result.player2Score);
    });

    // Re-calculate row totals (in case we're reusing playerTotals from elsewhere)
    const rowTotals = {};
    playerNames.forEach(player => {
        let total = 0;
        playerNames.forEach(opponent => {
            const score = matrix[player][opponent];
            if (score !== '-' && score !== 0) {
                total += parseInt(score);
            }
        });
        rowTotals[player] = total;
    });

    // Use provided playerTotals if available, otherwise use calculated
    const finalTotals = playerTotals || rowTotals;

    // Get stakes multiplier
    const multiplier = window.gameConfig?.config?.stakesMultiplierAmount || 1;

    // Build the table HTML
    let tableHTML = `
        <h3 style="color: #ffd700; margin-top: 30px; margin-bottom: 15px;">Head-to-Head Matrix</h3>
        <table style="border-collapse: collapse; margin: 0 auto; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: rgba(255,215,0,0.2);">
                    <th style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #ffd700; font-weight: bold;">vs</th>
    `;

    // Header row: player names
    playerNames.forEach(player => {
        tableHTML += `<th style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #ffd700; font-weight: bold; min-width: 80px;">${getCompactName(player)}</th>`;
    });

    // Total and Payout columns
    tableHTML += `
        <th style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #4ecdc4; font-weight: bold; min-width: 80px; background: rgba(78,205,196,0.2);">Total</th>
        <th style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #ffd700; font-weight: bold; min-width: 80px; background: rgba(255,215,0,0.2);">Payout</th>
    `;

    tableHTML += `</tr></thead><tbody>`;

    // Data rows
    playerNames.forEach(player => {
        tableHTML += `<tr>`;
        tableHTML += `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); color: #ffd700; font-weight: bold; background: rgba(255,215,0,0.1);">${getCompactName(player)}</td>`;

        let rowTotal = 0;
        playerNames.forEach(opponent => {
            const score = matrix[player][opponent];
            let cellColor = '#ccc';

            const numericScore = parseInt(score);

            if (score === '-' || score === '0') {
                cellColor = '#666';
            } else if (numericScore > 0) {
                cellColor = '#4ecdc4';
                rowTotal += numericScore;
            } else if (numericScore < 0) {
                cellColor = '#ff6b6b';
                rowTotal += numericScore;
            }

            tableHTML += `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: center; color: ${cellColor}; font-weight: bold;">${score}</td>`;
        });

        // Total cell
        const total = finalTotals[player] || rowTotal;
        const totalColor = total > 0 ? '#4ecdc4' : total < 0 ? '#ff6b6b' : '#ffd700';
        const totalSign = total > 0 ? '+' : '';
        tableHTML += `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: center; color: ${totalColor}; font-weight: bold; font-size: 16px; background: rgba(78,205,196,0.1);">${totalSign}${total}</td>`;

        // Payout cell
        const payout = total * multiplier;
        const payoutColor = payout > 0 ? '#4ecdc4' : payout < 0 ? '#ff6b6b' : '#ffd700';
        const payoutSign = payout > 0 ? '+' : '';
        tableHTML += `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: center; color: ${payoutColor}; font-weight: bold; font-size: 16px; background: rgba(255,215,0,0.1);">${payoutSign}${payout}</td>`;

        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table>`;

    // Pot winner banner (if pot > 0)
    let potWinnerHTML = '';
    if (pot > 0 && winners && winners.length > 0) {
        if (winners.length === 1) {
            potWinnerHTML = `<div style="text-align: center; margin-top: 15px; padding: 10px; background: rgba(255,215,0,0.2); border-radius: 8px; color: #ffd700; font-size: 18px; font-weight: bold;">🏆 Pot Winner: ${winners[0]} +${pot} chips</div>`;
        } else {
            const splitAmount = Math.floor(pot / winners.length);
            potWinnerHTML = `<div style="text-align: center; margin-top: 15px; padding: 10px; background: rgba(255,215,0,0.2); border-radius: 8px; color: #ffd700; font-size: 18px; font-weight: bold;">🏆 Pot Split: ${winners.join(', ')} +${splitAmount} chips each</div>`;
        }
    }

    tableHTML += potWinnerHTML;

}

async function showPlayerHands(game, handsToDisplay, containerElement) {
    // Clear previous content
    containerElement.innerHTML = '';

    game.players.forEach(player => {
        const hand = handsToDisplay.get(player.name);

        if (!hand) {
            // Optional: show missing hand (shouldn't happen in normal flow)
            return;
        }

        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-hand-display';

        // Check if player surrendered
        const surrendered = window.game.surrenderDecisions?.get(player.name) === 'surrender';

        if (surrendered) {
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
            // Display normal hand
            const backCardCount = hand.back ? hand.back.length : 5;
            const middleCardCount = hand.middle ? hand.middle.length : 5;
            const frontCardCount = hand.front ? hand.front.length : 3;

            // Sort all three hands before displaying
            const sortedBack = sortCardsForDisplay(hand.back, evaluateHand(hand.back));
            const sortedMiddle = sortCardsForDisplay(hand.middle, evaluateHand(hand.middle));
            const sortedFront = sortCardsForDisplay(hand.front, evaluateThreeCardHand(hand.front));

            // Then use sorted versions
            showMiniCards(sortedBack)
            showMiniCards(sortedMiddle)
            showMiniCards(sortedFront)

            playerDiv.innerHTML = `
                <div class="player-hand-title">${player.name}</div>
                <div class="hand-row">
                    <div class="hand-label-popup">Back (${backCardCount}):</div>
                    <div class="hand-cards">${showMiniCards(sortedBack)}</div>
                    <div class="hand-strength-popup">${getHandName(evaluateHand(hand.back))} (${evaluateHand(hand.back).handStrength.join(', ')})</div>
                </div>
                <div class="hand-row">
                    <div class="hand-label-popup">Middle (${middleCardCount}):</div>
                    <div class="hand-cards">${showMiniCards(sortedMiddle)}</div>
                    <div class="hand-strength-popup">${getHandName(evaluateHand(hand.middle))} (${evaluateHand(hand.middle).handStrength.join(', ')})</div>
                </div>
                <div class="hand-row">
                    <div class="hand-label-popup">Front (${frontCardCount}):</div>
                    <div class="hand-cards">${showMiniCards(sortedFront)}</div>
                    <div class="hand-strength-popup">${getThreeCardHandName(evaluateThreeCardHand(hand.front))} (${evaluateThreeCardHand(hand.front).handStrength.join(', ')})</div>
                </div>
            `;
        }

        containerElement.appendChild(playerDiv);
    });
}

function showRoundRobinScoring(detailedResults, game, containerElement, roundScores) {
    // Clear previous content
    containerElement.innerHTML = '';

    // Show automatic wins first
    const automaticInfo = game.automaticHands;
    if (automaticInfo && automaticInfo.size > 0) {
        const automaticDiv = document.createElement('div');
        automaticDiv.style.cssText = 'background: rgba(255, 215, 0, 0.2); padding: 15px; border-radius: 8px; margin-bottom: 20px;';

        let automaticHTML = '<h3 style="color: #ffd700; margin-bottom: 10px;">⚡ Automatic Hands Played</h3>';

        automaticInfo.forEach((automatic, playerName) => {
            const automaticType = automatic.type.replace(/-/g, ' ').toUpperCase();

            // Check if this player won, lost, or tied
            const playerScore = roundScores.get(playerName) || 0;

            if (playerScore > 0) {
                // Won
                automaticHTML += `<p style="color: #4ecdc4; margin: 8px 0; font-weight: bold;">
                    ${playerName} played <span style="color: #ffd700;">${automaticType}</span> and won +${playerScore} points
                </p>`;
            } else if (playerScore < 0) {
                // Lost
                automaticHTML += `<p style="color: #ff6b6b; margin: 8px 0; font-weight: bold;">
                    ${playerName} played <span style="color: #ffd700;">${automaticType}</span> but lost ${playerScore} points (opponent had better automatic)
                </p>`;
            } else {
                // Tied (playerScore === 0)
                automaticHTML += `<p style="color: #95a5a6; margin: 8px 0; font-weight: bold;">
                    ${playerName} played <span style="color: #ffd700;">${automaticType}</span> and tied (0 points - identical automatics)
                </p>`;
            }
        });

        automaticDiv.innerHTML = automaticHTML;
        containerElement.appendChild(automaticDiv);
    }

    detailedResults.forEach(result => {
        const matchupDiv = document.createElement('div');
        matchupDiv.className = 'matchup';

        let matchupHTML = `
            <div class="matchup-title">${result.player1} vs ${result.player2}</div>
        `;

        result.details.forEach(detail => {
            const p1Class = detail.winner === 'player1' ? 'winner' : detail.winner === 'tie' ? 'tie' : 'loser';
            const p2Class = detail.winner === 'player2' ? 'winner' : detail.winner === 'tie' ? 'tie' : 'loser';

            // Helper to show points correctly for winner only
            const getPointsDisplay = (playerHand, position, playerName, isPlayer1) => {
                if (detail.winner === 'tie') return '(0)';

                // Get actual card count from submitted hands (for royalty calculation)
                const cardCount = getCardCountFromSubmittedHands(game, playerName, position);

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
                        ${detail.player1Hand.name} (${detail.player1Hand.handStrength.join(', ')})
                        ${getPointsDisplay(detail.player1Hand, detail.hand, result.player1, true)}
                    </div>
                    <div style="color: #ffd700; font-weight: bold;">${detail.hand}</div>
                    <div class="player-result ${p2Class}">
                        ${detail.player2Hand.name} (${detail.player2Hand.handStrength.join(', ')})
                        ${getPointsDisplay(detail.player2Hand, detail.hand, result.player2, false)}
                    </div>
                </div>
            `;
        });

        // Final head-to-head score
        matchupHTML += `
            <div class="comparison-row">
                <div class="player-result ${result.player1Score > result.player2Score ? 'winner' : result.player1Score < result.player2Score ? 'loser' : 'tie'}">
                    ${result.player1}: ${result.player1Score > 0 ? '+' : ''}${result.player1Score} points
                </div>
                <div style="color: #ffd700; font-weight: bold;">HEAD-TO-HEAD</div>
                <div class="player-result ${result.player2Score > result.player1Score ? 'winner' : result.player2Score < result.player1Score ? 'loser' : 'tie'}">
                    ${result.player2}: ${result.player2Score > 0 ? '+' : ''}${result.player2Score} points
                </div>
            </div>
        `;

        matchupDiv.innerHTML = matchupHTML;
        containerElement.appendChild(matchupDiv);
    });
}

// Create round financial summary table
function showRoundSummaryForChips(game, surrenderDecisions, pot, winners, potShare, playerTotals, chipChanges) {
    // === Show Round Chip Summary (matching original design) ===
    if (chipChanges && chipChanges.size > 0) {
        const multiplier = window.gameConfig?.config?.stakesMultiplierAmount || 1;
        const ante = -1 * window.gameConfig?.config?.stakesAnteAmount || 10;

        let summaryHTML = `
            <div style="margin: 0px 0 20px 0;">
                <h3 style="color: #ffd700; text-align: left; margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">
                    Round Summary for Chips
                </h3>
                <table style="width: 100%; border-collapse: separate; border-spacing: 0; background: rgba(0,0,0,0.4); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                    <thead>
                        <tr style="background: linear-gradient(to bottom, #b8860b, #8b6914); height: 50px;">
                            <th style="padding: 12px; color: #ffd700; font-weight: bold; text-align: left; width: 30%;">Player</th>
                            <th style="padding: 12px; color: #ffd700; font-weight: bold;">Ante</th>
                            <th style="padding: 12px; color: #ffd700; font-weight: bold;">Surr.</th>
                            <th style="padding: 12px; color: #ffd700; font-weight: bold;">Payout</th>
                            <th style="padding: 12px; color: #ffd700; font-weight: bold;">Pot</th>
                            <th style="padding: 12px; color: #4ecdc4; font-weight: bold; font-size: 18px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        game.players.forEach(player => {
            const name = player.name;
            const totalChange = chipChanges.get(name) || 0;

            const payout = (playerTotals[name] || 0) * multiplier;
            const potWin = winners.includes(name) ? Math.floor(pot / winners.length) : 0;
            const surrenderPenalty = window.game.surrenderDecisions?.get(name) === 'surrender' ? -10 : 0;

            const payoutDisplay = payout !== 0 ? (payout > 0 ? `+${payout}` : payout) : '-';
            const potDisplay = potWin > 0 ? `+${potWin}` : '-';
            const surrenderDisplay = surrenderPenalty < 0 ? surrenderPenalty : '-';

            // Add these lines:
            const anteColor = ante < 0 ? '#ff6b6b' : ante > 0 ? '#4ecdc4' : '#ffd700';
            const surrenderColor = surrenderPenalty < 0 ? '#ff6b6b' : surrenderPenalty > 0 ? '#4ecdc4' : '#ffd700';
            const payoutColor = payout > 0 ? '#4ecdc4' : payout < 0 ? '#ff6b6b' : '#ffd700';
            const potColor = potWin > 0 ? '#4ecdc4' : potWin < 0 ? '#ff6b6b' : '#ffd700';

            const totalColor = totalChange > 0 ? '#4ecdc4' : totalChange < 0 ? '#ff6b6b' : '#ffd700';
            const totalSign = totalChange > 0 ? '+' : '';

            summaryHTML += `
                <tr style="height: 50px;">
                    <td style="padding: 12px; color: #ecf0f1; text-align: left; font-weight: bold;">
                        ${getCompactName(name)}
                    </td>

                    <td style="padding: 12px; text-align: center; color: ${anteColor};">${ante}</td>
                    <td style="padding: 12px; text-align: center; color: ${surrenderColor};">${surrenderDisplay}</td>
                    <td style="padding: 12px; text-align: center; color: ${payoutColor};">${payoutDisplay}</td>
                    <td style="padding: 12px; text-align: center; color: ${potColor};">${potDisplay}</td>

                    <td style="padding: 12px; text-align: center; color: ${totalColor}; font-weight: bold; font-size: 18px;">
                        ${totalSign}${totalChange}
                    </td>
                </tr>
            `;
        });

        summaryHTML += `
                    </tbody>
                </table>
            </div>
        `;

        return summaryHTML;
    }

    return '';
}
