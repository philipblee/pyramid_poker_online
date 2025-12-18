// js/ui/surrender-decision.js - handles play/surrender decision UI

function initializeSurrenderDecision() {
    const playBtn = document.getElementById('playButton');
    const surrenderBtn = document.getElementById('surrenderButton');
    const submitBtn = document.getElementById('submitDecision');

    let currentDecision = 'play'; // Default to play

    // Play button click
    playBtn.addEventListener('click', () => {
        currentDecision = 'play';
        playBtn.classList.remove('btn-secondary');
        playBtn.classList.add('btn-success'); // Green
        surrenderBtn.classList.remove('btn-danger');
        surrenderBtn.classList.add('btn-secondary'); // Gray
    });

    // Surrender button click
    surrenderBtn.addEventListener('click', () => {
        currentDecision = 'surrender';
        surrenderBtn.classList.remove('btn-secondary');
        surrenderBtn.classList.add('btn-danger'); // Red
        playBtn.classList.remove('btn-success');
        playBtn.classList.add('btn-secondary'); // Gray
    });

    // Submit decision
    submitBtn.addEventListener('click', () => {
        submitSurrenderDecision(currentDecision);
    });
}

function showDecisionButtons() {
    const rankBtn = document.getElementById('sortByRank');
    const suitBtn = document.getElementById('sortBySuit');

    // Hide traditional rank/suit buttons
    if (rankBtn) {
        rankBtn.style.display = 'none';
    }
    if (suitBtn) {
        suitBtn.style.display = 'none';
    }

    const playBtn = document.getElementById('playButton');
    const surrenderBtn = document.getElementById('surrenderButton');
    const submitBtn = document.getElementById('submitDecision');
    const reorderRankBtn = document.getElementById('reorderRank');
    const reorderSuitBtn = document.getElementById('reorderSuit');
    const submitHandBtn = document.getElementById('submitHand');
    const autoArrangeBtn = document.getElementById('autoArrange');

    // Hide traditional rank/suit buttons
    if (rankBtn) rankBtn.style.display = 'none';
    if (suitBtn) suitBtn.style.display = 'none';

    // Show reorder and decision buttons
    if (reorderRankBtn) {
        reorderRankBtn.style.display = 'inline-block';
        reorderRankBtn.disabled = false;
    }
    if (reorderSuitBtn) {
        reorderSuitBtn.style.display = 'inline-block';
        reorderSuitBtn.disabled = false;
    }
    if (playBtn) {
        playBtn.style.display = 'inline-block';
        playBtn.className = 'btn btn-success decision-btn';
        playBtn.disabled = false;
    }
    if (surrenderBtn) {
        surrenderBtn.style.display = 'inline-block';
        surrenderBtn.className = 'btn btn-secondary decision-btn';
        surrenderBtn.disabled = false;
    }
    if (submitBtn) {
        submitBtn.style.display = 'inline-block';
        submitBtn.disabled = false;
    }

    // Reset decision to 'play' for new round
    if (playBtn) playBtn.click();

    // Hide Auto and Submit Hand
    if (submitHandBtn) submitHandBtn.style.display = 'none';
    if (autoArrangeBtn) autoArrangeBtn.style.display = 'none';
}

function hideDecisionButtons() {
    const rankBtn = document.getElementById('sortByRank');
    const suitBtn = document.getElementById('sortBySuit');
    const playBtn = document.getElementById('playButton');
    const surrenderBtn = document.getElementById('surrenderButton');
    const submitBtn = document.getElementById('submitDecision');
    const reorderRankBtn = document.getElementById('reorderRank');
    const reorderSuitBtn = document.getElementById('reorderSuit');
    const submitHandBtn = document.getElementById('submitHand');
    const autoArrangeBtn = document.getElementById('autoArrange');

    // Hide decision buttons (with null checks)
    if (playBtn) playBtn.style.display = 'none';
    if (surrenderBtn) surrenderBtn.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'none';
    if (reorderRankBtn) reorderRankBtn.style.display = 'none';
    if (reorderSuitBtn) reorderSuitBtn.style.display = 'none';

    // Show traditional rank/suit buttons
    if (rankBtn) rankBtn.style.display = 'inline-block';
    if (suitBtn) suitBtn.style.display = 'inline-block';

    // Show all game buttons
    if (submitHandBtn) submitHandBtn.style.display = 'inline-block';
    if (autoArrangeBtn) autoArrangeBtn.style.display = 'inline-block';
}

function submitSurrenderDecision(decision) {

    // Multi-device: Submit for THIS device's player, not current turn player
    const playerName = window.game.multiDeviceMode
        ? window.uniquePlayerName
        : window.game.playerManager.getCurrentPlayer().name;

    const currentPlayer = window.game.playerManager.players.find(p => p.name === playerName);

    // Store the decision locally
    window.game.surrenderDecisions.set(currentPlayer.name, decision);

    // Store in Firebase for multi-device sync
    if (window.game.multiDeviceMode) {
        const tableId = window.game.currentTableId;
        console.log('🔍 About to write to Firebase - tableId:', tableId);

        const isAI = currentPlayer.name.endsWith('_AI') || currentPlayer.name.includes(' AI');
        const playerKey = isAI ? currentPlayer.name : currentPlayer.name.replace(/\./g, ',').replace(/@/g, '_at_');
        console.log('🔍 playerKey:', playerKey);

        const path = `tables/${tableId}/surrenderDecisions/${playerKey}`;
        console.log('🔍 Firebase path:', path);

        firebase.database()
            .ref(path)
            .set(decision)
            .then(() => {
                console.log(`📤 Wrote ${decision} decision to Firebase for ${currentPlayer.name}`);
            })
            .catch((error) => {
                console.error('❌ Failed to write decision to Firebase:', error);
            });
    }

    console.log(`✅ ${currentPlayer.name} chose: ${decision}`);

    // Disable buttons after submission
    document.getElementById('playButton').disabled = true;
    document.getElementById('surrenderButton').disabled = true;
    document.getElementById('submitDecision').disabled = true;

    // Process AI decisions
    processAIDecisions();

    // Check if all players have decided
    checkAllDecided();
}

function processAIDecisions() {
    const allPlayers = window.game.playerManager.players;

    allPlayers.forEach(player => {
        if (player.type === 'ai' && !window.game.surrenderDecisions.has(player.name)) {
            const decision = decideAISurrender(player);
            window.game.surrenderDecisions.set(player.name, decision);
        }
    });
}

function decideAISurrender(player) {
    // Get player's 13 cards
    const playerData = window.game.playerHands.get(player.name);
    if (!playerData) return 'play'; // Default to play if no data

    const cards = playerData.cards.slice(0, 13); // First 13 cards only

    // Count wild cards
    const wildCount = cards.filter(card => card.isWild).length;

    // Decision logic
    if (wildCount >= 2) {
        return 'play'; // Always play with 2+ wilds
    } else if (wildCount === 1) {
        return Math.random() < 1 ? 'play' : 'surrender'; // 98% play
    } else {
        // 0 wilds - evaluate hand strength
        return evaluateHandForSurrender(cards);
    }
}

function evaluateHandForSurrender(cards) {
    // TODO: Implement hand strength evaluation
    // For now, simple heuristic: count high cards
    const highCards = cards.filter(card =>
        !card.isWild && ['A', 'K', 'Q', 'J', '10'].includes(card.rank)
    ).length;

    // Play if 7+ high cards, surrender otherwise
    if (highCards >= 7) {
        return 'play';
    } else {
        return Math.random() < 0.7 ? 'play' : 'surrender'; // 70% play even with weak hand
    }
}

function checkAllDecided() {

    const allPlayers = window.game.playerManager.players;
    const decidedCount = window.game.surrenderDecisions.size;


    console.log(`🔍 DECISION - Checking if all decided. Count:, ${decidedCount}, 'Total:', ${allPlayers}`);

    if (decidedCount === allPlayers.length) {
        handleAllDecided();
    }
}

function handleAllDecided() {

    // Step 1: Collect surrender penalties
    collectSurrenderPenalties();

    // Step 2: Reveal remaining 4 cards for "play" players
    revealKittyCards();

    // Step 3: Transition to PLAYING state - write to Firebase!
    if (gameConfig.config.gameDeviceMode === 'multi-device') {
        setTableState(TABLE_STATES.PLAYING);
    } else {
        console.log('🔍 Taking SINGLE-PLAYER path');
        game.tableState = 'playing';  // ← ADD THIS
        game.loadCurrentPlayerHand();
        updateDisplay(game);  // ← Add this line
    }
}

async function collectSurrenderPenalties() {
    const surrenderPenalty = window.gameConfig?.config?.stakesSurrenderAmount || 10;
    const tableId = window.game?.currentTableId;

    if (!tableId) {
        console.warn('No tableId for penalty collection');
        return;
    }

    // Only owner collects penalties
    if (window.game.multiDeviceMode && !window.isOwner) return;

    let totalPenalties = 0;

    // Process each player's decision
    for (const [playerName, decision] of window.game.surrenderDecisions.entries()) {
        if (decision === 'surrender') {
            // Find player to get type
            const player = window.game.playerManager.players.find(p => p.name === playerName);
            if (!player) continue;

            // Get playerKey (same encoding as collectAntes)
            let playerKey;
            if (player.type === 'ai') {
                playerKey = player.name;
            } else {
                playerKey = player.name.replace(/\./g, ',').replace(/@/g, '_at_');
            }

            // Deduct penalty
            const result = await firebase.database().ref(`players/${playerKey}/chips`)
                .transaction(currentChips => (currentChips || 0) - surrenderPenalty);

            // Update lastKnownChips
            await firebase.database().ref(`players/${playerKey}/lastKnownChips`).set(result.snapshot.val());

            console.log(`💰 ${playerName} surrenders - paid ${surrenderPenalty} chips`);
            totalPenalties += surrenderPenalty;
        }
    }

    if (totalPenalties > 0) {
        // Add to existing pot
        await firebase.database().ref(`tables/${tableId}/pot`)
            .transaction(currentPot => (currentPot || 0) + totalPenalties);

        console.log(`✅ Collected ${totalPenalties} in surrender penalties. Added to pot.`);
    }
}

function revealKittyCards() {
    // Cards are already dealt (all 17), just log for now
    window.game.surrenderDecisions.forEach((decision, playerName) => {
        if (decision === 'play') {
            console.log(`🃏 ${playerName} receives 4 kitty cards (cards 14-17)`);
        }
    });
}

// NEW: Owner monitors Firebase for all decisions
function setupOwnerDecisionListener() {
    if (!window.game.multiDeviceMode || !window.isOwner) {
        console.log('⏭️ Not owner or not multi-device, skipping listener setup');
        return;
    }

    const tableId = window.game.currentTableId;
    const playerCount = window.game.playerManager.players.length;

    console.log(`👑 Owner setting up decision listener for ${playerCount} players`);

    firebase.database().ref(`tables/${tableId}/surrenderDecisions`)
        .on('value', (snapshot) => {
            const decisions = snapshot.val() || {};
            const decidedCount = Object.keys(decisions).length;

            console.log(`📊 Decisions: ${decidedCount}/${playerCount}`);

            if (decidedCount === playerCount) {
                console.log('✅ All players decided! Transitioning...');
                handleAllDecided();
            }
        });
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSurrenderDecision);
} else {
    initializeSurrenderDecision();
}
