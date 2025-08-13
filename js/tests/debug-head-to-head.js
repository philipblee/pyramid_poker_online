// Convert our simple format to standard card format
function convertToStandardFormat(hand) {
    return hand.map((card, index) => {
        const cardString = `${card.rank}${card.suit}`;
        const match = cardString.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
        
        if (!match) {
            throw new Error(`Invalid card format: ${cardString}`);
        }
        
        const [, rank, suit] = match;
        
        return {
            id: `${rank}${suit}_${index}`,
            rank: rank,
            suit: suit,
            value: getRankValue(rank),
            isWild: false
        };
    });
}

function getRankValue(rank) {
    switch(rank) {
        case 'A': return 14;
        case 'K': return 13;
        case 'Q': return 12;
        case 'J': return 11;
        default: return parseInt(rank);
    }
}

// Updated debug function with proper card conversion
function debugHeadToHead(arrangement1, arrangement2, playerName1 = "Player A", playerName2 = "Player B") {
    console.log(`\n=== HEAD-TO-HEAD DEBUG: ${playerName1} vs ${playerName2} ===`);
    
    let player1Score = 0;
    let player2Score = 0;
    
    const positions = ['Front', 'Middle', 'Back'];
    
    for (let i = 0; i < 3; i++) {
        const hand1 = convertToStandardFormat(arrangement1[i]);
        const hand2 = convertToStandardFormat(arrangement2[i]);
        
        console.log(`\n${positions[i]} Hand Comparison:`);
        console.log(`  ${playerName1}:`, arrangement1[i].map(c => `${c.rank}${c.suit}`).join(' '));
        console.log(`  ${playerName2}:`, arrangement2[i].map(c => `${c.rank}${c.suit}`).join(' '));
        
        // Use correct evaluation function based on position (front = 3 cards, middle/back = 5 cards)
        const eval1 = i === 0 ? evaluateThreeCardHand(hand1) : evaluateHand(hand1);
        const eval2 = i === 0 ? evaluateThreeCardHand(hand2) : evaluateHand(hand2);
        
        console.log(`  ${playerName1} eval: ${eval1.name} - rank: [${eval1.hand_rank.join(',')}]`);
        console.log(`  ${playerName2} eval: ${eval2.name} - rank: [${eval2.hand_rank.join(',')}]`);
        
        // Compare hand_rank arrays element by element
        const comparison = compareHandRanks(eval1.hand_rank, eval2.hand_rank);
        
        // Apply multipliers based on hand type
        const multiplier1 = getMultiplierFromHandType(eval1.name);
        const multiplier2 = getMultiplierFromHandType(eval2.name);
        
        console.log(`  Base comparison: ${comparison > 0 ? playerName1 : comparison < 0 ? playerName2 : 'Tie'}`);
        console.log(`  Multipliers: ${multiplier1}x vs ${multiplier2}x`);
        
        if (comparison > 0) {
            const points = getPointsFromHandType(eval1.name);
            player1Score += points;
            player2Score -= points;
            console.log(`  Winner: ${playerName1} (wins ${points} points, ${playerName2} loses ${points} points)`);
        } else if (comparison < 0) {
            const points = getPointsFromHandType(eval2.name);
            player2Score += points;
            player1Score -= points;
            console.log(`  Winner: ${playerName2} (wins ${points} points, ${playerName1} loses ${points} points)`);
        }
    }
    
    console.log(`\n=== FINAL RESULT ===`);
    console.log(`${playerName1}: ${player1Score} arrangements won`);
    console.log(`${playerName2}: ${player2Score} arrangements won`);
    console.log(`Net score for ${playerName1}: ${player1Score - player2Score}`);
    
    return { player1Score, player2Score, netScore: player1Score - player2Score };
}

function formatHand(hand) {
    // Format hand for readable output
    return hand.map(card => `${card.rank}${card.suit}`).join(' ');
}

function getMultiplierFromHandType(handName) {
    switch(handName) {
        case 'Four of a Kind': return 4;
        case 'Full House': return 2;
        default: return 1;
    }
}

function compareHandRanks(rank1, rank2) {
    for (let i = 0; i < Math.max(rank1.length, rank2.length); i++) {
        const val1 = rank1[i] || 0;
        const val2 = rank2[i] || 0;

        if (val1 > val2) return 1;
        if (val2 > val1) return -1;
    }
    return 0;
}

function getPointsFromHandType(handName) {
    switch(handName) {
        case 'Four of a Kind': return 4;
        case 'Full House': return 2;
        default: return 1;
    }
}