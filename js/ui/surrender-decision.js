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
    // TODO: Handle decision submission
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSurrenderDecision);
} else {
    initializeSurrenderDecision();
}
