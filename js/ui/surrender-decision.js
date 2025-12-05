// js/ui/surrender-decision.js - handles play/surrender decision UI

function initializeSurrenderDecision() {
    const toggleBtn = document.getElementById('toggleDecision');
    const submitBtn = document.getElementById('submitDecision');

    let currentDecision = 'play'; // default

    // Set initial state - Play is red to draw attention
    toggleBtn.classList.add('btn-danger');

    // Toggle between Play/Surrender
    toggleBtn.addEventListener('click', () => {
        if (currentDecision === 'play') {
            currentDecision = 'surrender';
            toggleBtn.textContent = 'Surrender';
            toggleBtn.classList.remove('btn-danger');
            toggleBtn.classList.add('btn-warning'); // Yellow/orange for surrender
        } else {
            currentDecision = 'play';
            toggleBtn.textContent = 'Play';
            toggleBtn.classList.remove('btn-warning');
            toggleBtn.classList.add('btn-danger'); // Back to red
        }

        // Enable submit button once decision is made
        submitBtn.disabled = false;
    });

    // Submit decision
    submitBtn.addEventListener('click', () => {
        submitSurrenderDecision(currentDecision);
    });
}

function showDecisionButtons() {
    document.getElementById('toggleDecision').style.display = 'inline-block';
    document.getElementById('submitDecision').style.display = 'inline-block';
    document.getElementById('submitHand').style.display = 'none';
    document.getElementById('autoArrange').style.display = 'none'; // Hide instead of disable
}

function hideDecisionButtons() {
    document.getElementById('toggleDecision').style.display = 'none';
    document.getElementById('submitDecision').style.display = 'none';
    document.getElementById('submitHand').style.display = 'inline-block';
    document.getElementById('autoArrange').style.display = 'inline-block'; // Show again
}

function submitSurrenderDecision(decision) {
    console.log(`Player decided to: ${decision}`);

    const currentPlayer = window.game.playerManager.getCurrentPlayer();

    // Store human player's decision
    window.game.surrenderDecisions.set(currentPlayer.name, decision);

    console.log(`✅ ${currentPlayer.name} chose: ${decision}`);

    // Disable buttons after submission
    document.getElementById('toggleDecision').disabled = true;
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
            console.log(`🤖 ${player.name} decided: ${decision}`);
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

    console.log(`🤖 ${player.name} has ${wildCount} wild cards in first 13`);

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

    console.log(`Decisions: ${decidedCount}/${allPlayers.length}`);

    if (decidedCount === allPlayers.length) {
        console.log('✅ All players decided!');
        handleAllDecided();
    }
}

function handleAllDecided() {
    // Transition to ALL_DECIDED state
    window.game.tableState = TABLE_STATES.ALL_DECIDED;

    // TODO: Collect surrender penalties
    // TODO: Reveal remaining 4 cards for "play" players
    // TODO: Transition to PLAYING

    console.log('🎮 Moving to ALL_DECIDED state');
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSurrenderDecision);
} else {
    initializeSurrenderDecision();
}
