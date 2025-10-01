// Utility functions for Pyramid Poker

// Create animated background particles
function createParticles() {
    const container = document.getElementById('bgParticles');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (4 + Math.random() * 4) + 's';
        container.appendChild(particle);
    }
}

// Convert element ID to hand key for game logic
function getHandKey(elementId) {
    switch (elementId) {
        case 'playerHand': return 'cards';
        case 'backHand': case 'back': return 'back';
        case 'middleHand': case 'middle': return 'middle';
        case 'frontHand': case 'front': return 'front';
        default: return 'cards';
    }
}

// Compare two tuples (arrays) for hand ranking
function compareTuples(tuple1, tuple2) {
    const minLength = Math.min(tuple1.length, tuple2.length);

    for (let i = 0; i < minLength; i++) {
        if (tuple1[i] > tuple2[i]) return 1;
        if (tuple1[i] < tuple2[i]) return -1;
    }

    if (tuple1.length > tuple2.length) return 1;
    if (tuple1.length < tuple2.length) return -1;
    return 0;
}

// Check if array of values forms a straight
function isStraight(values) {
    for (let i = 0; i < values.length - 1; i++) {
        if (values[i] - values[i + 1] !== 1) {
            // Check for A-2-3-4-5 wheel straight
            if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
                return true;
            }
            return false;
        }
    }
    return true;
}

// Get human-readable hand name
function getHandName(evaluation) {
    return evaluation.name;
}

function getThreeCardHandName(evaluation) {
    return evaluation.name;
}
