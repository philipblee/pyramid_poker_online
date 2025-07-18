// Card evaluation functions for Pyramid Poker

// Main 5-card hand evaluation function
function evaluateHand(cards) {

    // Initialize with enough zeros to prevent undefined
    let hand_rank = [1, 0, 0, 0, 0, 0]; // 6 positions should cover all cases

    // Handle large hands (6, 7, 8 cards) - basic evaluation for now
    if (cards.length > 5) {

    // Quick check: are all cards the same rank?
    const values = cards.map(c => c.value);
    const uniqueValues = new Set(values);

    if (uniqueValues.size === 1) {
        // All same rank
        const rank = values[0,0,0,0,0,0];
    const sameRankRating = 10 + (cards.length - 5) * 2; // 6→12, 7→14, 8→16
    return { rank: sameRankRating - 1, hand_rank: [sameRankRating, rank], name: `${cards.length} of a Kind` };
    }

    // Quick check: are all cards same suit and sequential?
    const suits = cards.map(c => c.suit);
    const uniqueSuits = new Set(suits);

    if (uniqueSuits.size === 1) {
        const sortedValues = [...uniqueValues].sort((a, b) => a - b);

        // Check for regular sequential
        const isSequential = sortedValues.every((val, i) => i === 0 || val === sortedValues[i-1] + 1);

        // Check for wheel pattern (Ace + low cards)
        const isWheel = sortedValues.includes(14) && sortedValues[0] === 2;

        if (isSequential || isWheel) {
            const highCard = isWheel ? sortedValues[sortedValues.length - 2] : Math.max(...sortedValues); // For wheel, use second-highest
            const straightFlushRating = 9 + (cards.length - 5) * 2;
            return { rank: straightFlushRating - 1, hand_rank: [straightFlushRating, highCard], name: `${cards.length}-Card Straight Flush` };
        }
    }

    // If neither, return generic (this shouldn't happen if validation works)
    return { rank: 0, hand_rank: [0, cards.length], name: `${cards.length}-Card Hand` };
}

    if (cards.length !== 5) return { rank: 0, hand_rank: [70, 80], name: 'Invalid' };

    const wildCards = cards.filter(c => c.isWild);
    const normalCards = cards.filter(c => !c.isWild);

    if (wildCards.length > 0) {
        return evaluateHandWithWilds(normalCards, wildCards.length);
    }

    const sortedCards = [...cards].sort((a, b) => b.value - a.value);
    const suits = cards.map(c => c.suit);
    const values = sortedCards.map(c => c.value);

    const isFlush = suits.every(suit => suit === suits[0]);
    const isStraightHand = isStraight(values);

    // Count values - handles duplicates from two decks
    const valueCounts = {};
    values.forEach(val => valueCounts[val] = (valueCounts[val] || 0) + 1);

    // Group values by count frequency
    const valuesByCount = {};
    for (const [value, count] of Object.entries(valueCounts)) {
        if (!valuesByCount[count]) valuesByCount[count] = [];
        valuesByCount[count].push(parseInt(value));
    }

    // Sort each group by descending value
    for (const count in valuesByCount) {
        valuesByCount[count].sort((a, b) => b - a);
    }

    const counts = Object.keys(valuesByCount).map(Number).sort((a, b) => b - a);

    // Check for five of a kind (only possible with two decks + wilds)
    if (counts[0] === 5) {
        const fiveRank = valuesByCount[5][0];
        return { rank: 9, hand_rank: [10, fiveRank], name: 'Five of a Kind' };
    }

    if (isStraightHand && isFlush) {
        const straightInfo = getStraightInfo(values);
        const name = straightInfo.high === 14 && straightInfo.low === 10 ? 'Royal Flush' : 'Straight Flush';
        return { rank: 8, hand_rank: [9, straightInfo.high, straightInfo.low], name: name };
    }

    if (counts[0] === 4) {
        // Four of a Kind: [8, quad_rank, kicker, quad_suits..., kicker_suit]
        const quadRank = valuesByCount[4][0];
        const kicker = valuesByCount[1][0];

        const quadCards = cards.filter(c => c.value === quadRank);
        const kickerCard = cards.find(c => c.value === kicker);
        const suitValues = getSuitValues([...quadCards, kickerCard]);

        return { rank: 7, hand_rank: [8, quadRank, kicker, ...suitValues], name: 'Four of a Kind' };
    }

    if (counts[0] === 3 && counts[1] === 2) {
        // Full House: [7, trips_rank, pair_rank]
        const tripsRank = valuesByCount[3][0];
        const pairRank = valuesByCount[2][0];
        return { rank: 6, hand_rank: [7, tripsRank, pairRank], name: 'Full House' };
    }

    if (isFlush) {
        // Flush: [6, high, second, third, fourth, fifth]
        return { rank: 5, hand_rank: [6, ...values], name: 'Flush' };
    }

    if (isStraightHand) {
        const straightInfo = getStraightInfo(values);
        return { rank: 4, hand_rank: [5, straightInfo.high, straightInfo.low], name: 'Straight' };
    }

    // Three of a Kind
    if (counts[0] === 3) {
        hand_rank[0] = 4;
        hand_rank[1] = valuesByCount[3][0]; // trips rank
        hand_rank[2] = valuesByCount[1] ? valuesByCount[1][0] : 0; // first kicker
        hand_rank[3] = valuesByCount[1] && valuesByCount[1][1] ? valuesByCount[1][1] : 0; // second kicker
        return { rank: 3, hand_rank: hand_rank.slice(), name: 'Three of a Kind' };
    }

//    console.log('Two Pair debug 1:', { valuesByCount, pairs: valuesByCount[2] });

    // This block covers both pair and two pair (highest count of cards is 2)
    if (counts[0] === 2) {
        if (valuesByCount[2] && valuesByCount[2].length >= 2) {
            // Two Pair: [3, higher_pair, lower_pair, kicker]
            const pairs = valuesByCount[2];
            hand_rank[0] = 3;
            hand_rank[1] = Math.max(...pairs);
            hand_rank[2] = Math.min(...pairs);
            hand_rank[3] = valuesByCount[1] ? valuesByCount[1][0] : 0;

//            console.log('Two Pair debug 2:', { pairs, higherPair, lowerPair, kicker });

            return { rank: 2, hand_rank: hand_rank.slice(), name: 'Two Pair' };
        } else {
            // Single Pair: [2, pair_rank, kicker1, kicker2, kicker3]
            hand_rank[0] = 2;
            hand_rank[1] = valuesByCount[2][0];
            hand_rank[2] = valuesByCount[1] ? valuesByCount[1][0] : 0;
            hand_rank[3] = valuesByCount[1] && valuesByCount[1][1] ? valuesByCount[1][1] : 0;
            hand_rank[4] = valuesByCount[1] && valuesByCount[1][2] ? valuesByCount[1][2] : 0;
            return { rank: 1, hand_rank: hand_rank.slice(), name: 'Pair' };
        }
    }

    // High Card (already looks correct but make sure)
    hand_rank[0] = 1;
    for (let i = 0; i < 5 && i < values.length; i++) {
        hand_rank[i + 1] = values[i];
    }
    return { rank: 0, hand_rank: hand_rank.slice(), name: 'High Card' };


    // High Card: [1, high, second, third, fourth, fifth]
    return { rank: 0, hand_rank: [1, ...values], name: 'High Card' };
}

// Evaluate hand with wild cards
function evaluateHandWithWilds(normalCards, wildCount) {
    const values = normalCards.map(c => c.value).sort((a, b) => b - a);
    const suits = normalCards.map(c => c.suit);

    // Count existing values and suits
    const valueCounts = {};
    values.forEach(val => valueCounts[val] = (valueCounts[val] || 0) + 1);

    const suitCounts = {};
    suits.forEach(suit => suitCounts[suit] = (suitCounts[suit] || 0) + 1);

    // Try for BEST possible hand (highest ranking first)

    // 1. Try for Five of a Kind
    for (const [value, count] of Object.entries(valueCounts)) {
        if (count + wildCount >= 5) {
            const fiveRank = parseInt(value);
            return { rank: 9, hand_rank: [10, fiveRank], name: 'Five of a Kind (Wild)' };
        }
    }
    if (wildCount >= 4) {
        const highCard = values[0] || 14;
        return { rank: 9, hand_rank: [10, highCard], name: 'Five of a Kind (Wild)' };
    }

    // 2. Try for Straight Flush
    const straightFlush = tryForStraightFlushWithWilds(normalCards, wildCount);
    if (straightFlush) return straightFlush;

    // 3. Try for Four of a Kind
    for (const [value, count] of Object.entries(valueCounts)) {
        if (count + wildCount >= 4) {
            const quadRank = parseInt(value);
            const remainingCards = normalCards.filter(c => c.value !== quadRank);
            const kicker = remainingCards.length > 0 ? Math.max(...remainingCards.map(c => c.value)) : 13;
            return { rank: 7, hand_rank: [8, quadRank, kicker], name: 'Four of a Kind (Wild)' };
        }
    }
    if (wildCount >= 3) {
        const quadRank = values[0] || 14;
        const kicker = values[1] || 13;
        return { rank: 7, hand_rank: [8, quadRank, kicker], name: 'Four of a Kind (Wild)' };
    }

    // 4. Try for Full House
    const pairs = Object.entries(valueCounts).filter(([v, c]) => c >= 2);
    const singles = Object.entries(valueCounts).filter(([v, c]) => c === 1);

    if (pairs.length >= 2 && wildCount >= 1) {
        const sortedPairs = pairs.sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
        const tripsRank = parseInt(sortedPairs[0][0]);
        const pairRank = parseInt(sortedPairs[1][0]);
        return { rank: 6, hand_rank: [7, tripsRank, pairRank], name: 'Full House (Wild)' };
    }
    if (pairs.length >= 1 && singles.length >= 1 && wildCount >= 2) {
        const pairRank = parseInt(pairs[0][0]);
        const singleRank = parseInt(singles[0][0]);
        const tripsRank = Math.max(pairRank, singleRank);
        const finalPairRank = Math.min(pairRank, singleRank);
        return { rank: 6, hand_rank: [7, tripsRank, finalPairRank], name: 'Full House (Wild)' };
    }
    if (singles.length >= 2 && wildCount >= 3) {
        const sortedSingles = singles.sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
        const tripsRank = parseInt(sortedSingles[0][0]);
        const pairRank = parseInt(sortedSingles[1][0]);
        return { rank: 6, hand_rank: [7, tripsRank, pairRank], name: 'Full House (Wild)' };
    }

    // 5. Try for Flush
    const flush = tryForFlushWithWilds(normalCards, wildCount);
    if (flush) return flush;

    // 6. Try for Straight
    const straight = tryForStraightWithWilds(normalCards, wildCount);
    if (straight) return straight;

    // 7. Try for Three of a Kind
    for (const [value, count] of Object.entries(valueCounts)) {
        if (count + wildCount >= 3) {
            const tripsRank = parseInt(value);
            const remainingCards = normalCards.filter(c => c.value !== tripsRank);
            const kickers = remainingCards.map(c => c.value).sort((a, b) => b - a).slice(0, 2);
            while (kickers.length < 2) kickers.push(13 - kickers.length);
            return { rank: 3, hand_rank: [4, tripsRank, ...kickers], name: 'Three of a Kind (Wild)' };
        }
    }
    if (wildCount >= 2) {
        const tripsRank = values[0] || 14;
        const remainingValues = values.filter(v => v !== tripsRank);
        const kickers = remainingValues.slice(0, 2);
        while (kickers.length < 2) kickers.push(13 - kickers.length);
        return { rank: 3, hand_rank: [4, tripsRank, ...kickers], name: 'Three of a Kind (Wild)' };
    }

    // 8. Try for Two Pair
    if (pairs.length >= 1 && singles.length >= 1 && wildCount >= 1) {
        const pairRank = parseInt(pairs[0][0]);
        const secondPairRank = parseInt(singles[0][0]);
        const higherPair = Math.max(pairRank, secondPairRank);
        const lowerPair = Math.min(pairRank, secondPairRank);
        const kicker = singles.length > 1 ? parseInt(singles[1][0]) : 13;
        return { rank: 2, hand_rank: [3, higherPair, lowerPair, kicker], name: 'Two Pair (Wild)' };
    }

    // 9. Try for Pair
    if (wildCount >= 1) {
        const pairRank = values[0] || 14;
        const remainingValues = values.filter(v => v !== pairRank);
        const kickers = remainingValues.slice(0, 3);
        while (kickers.length < 3) kickers.push(13 - kickers.length);
        return { rank: 1, hand_rank: [2, pairRank, ...kickers], name: 'Pair (Wild)' };
    }

    // 10. High Card (fallback)
    const allValues = [...values];
    while (allValues.length < 5) allValues.push(14 - allValues.length);
    return { rank: 0, hand_rank: [1, ...allValues.slice(0, 5)], name: 'High Card (Wild)' };
}

// Try for straight flush with wild cards
function tryForStraightFlushWithWilds(normalCards, wildCount) {
    // Group cards by suit
    const suitGroups = {};
    normalCards.forEach(card => {
        suitGroups[card.suit] = (suitGroups[card.suit] || []).concat(card);
    });

    // Check each suit to see if we can make a straight flush
    for (const [suit, cards] of Object.entries(suitGroups)) {
        if (cards.length + wildCount >= 5) {
            const values = cards.map(c => c.value).sort((a, b) => b - a);
            const uniqueValues = [...new Set(values)];

            // Try all possible straight flushes from HIGHEST to LOWEST
            const possibleStraights = [
                [14, 13, 12, 11, 10], // Royal Flush (A-K-Q-J-10)
                [13, 12, 11, 10, 9],  // K-Q-J-10-9
                [12, 11, 10, 9, 8],   // Q-J-10-9-8
                [11, 10, 9, 8, 7],    // J-10-9-8-7
                [10, 9, 8, 7, 6],     // 10-9-8-7-6
                [9, 8, 7, 6, 5],      // 9-8-7-6-5
                [8, 7, 6, 5, 4],      // 8-7-6-5-4
                [7, 6, 5, 4, 3],      // 7-6-5-4-3
                [6, 5, 4, 3, 2],      // 6-5-4-3-2
                [14, 5, 4, 3, 2]      // Steel Wheel (A-5-4-3-2)
            ];

            // Check each straight from highest to lowest
            for (const straight of possibleStraights) {
                const needed = straight.filter(v => !uniqueValues.includes(v)).length;
                if (needed <= wildCount) {
                    const straightInfo = getStraightInfoFromArray(straight);
                    const name = straight[0] === 14 && straight[1] === 13 ? 'Royal Flush (Wild)' : 'Straight Flush (Wild)';
                    return { rank: 8, hand_rank: [9, straightInfo.high, straightInfo.low], name: name };
                }
            }
        }
    }
    return null;
}

// Try for flush with wild cards
function tryForFlushWithWilds(normalCards, wildCount) {
    const suitCounts = {};
    normalCards.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);

    for (const [suit, count] of Object.entries(suitCounts)) {
        if (count + wildCount >= 5) {
            const flushCards = normalCards.filter(c => c.suit === suit);
            const values = flushCards.map(c => c.value).sort((a, b) => b - a);

            // Add optimal high cards for the wild cards to make the best flush
            while (values.length < 5) {
                // Add the highest possible card that doesn't duplicate existing values
                let nextHighCard = 14; // Start with Ace
                while (values.includes(nextHighCard) && nextHighCard > 2) {
                    nextHighCard--;
                }
                values.push(nextHighCard);
                values.sort((a, b) => b - a); // Keep sorted
            }

            return { rank: 5, hand_rank: [6, ...values.slice(0, 5)], name: 'Flush (Wild)' };
        }
    }
    return null;
}

// Try for straight with wild cards
function tryForStraightWithWilds(normalCards, wildCount) {
    const values = [...new Set(normalCards.map(c => c.value))].sort((a, b) => b - a);

    // Try all possible straights from HIGHEST to LOWEST to find the best one
    const possibleStraights = [
        [14, 13, 12, 11, 10], // A-K-Q-J-10 (Broadway - highest)
        [13, 12, 11, 10, 9],  // K-Q-J-10-9
        [12, 11, 10, 9, 8],   // Q-J-10-9-8
        [11, 10, 9, 8, 7],    // J-10-9-8-7
        [10, 9, 8, 7, 6],     // 10-9-8-7-6
        [9, 8, 7, 6, 5],      // 9-8-7-6-5
        [8, 7, 6, 5, 4],      // 8-7-6-5-4
        [7, 6, 5, 4, 3],      // 7-6-5-4-3
        [6, 5, 4, 3, 2],      // 6-5-4-3-2
        [14, 5, 4, 3, 2]      // A-5-4-3-2 (wheel - lowest)
    ];

    // Check each straight from highest to lowest - return the FIRST (highest) one that works
    for (const straight of possibleStraights) {
        const needed = straight.filter(v => !values.includes(v)).length;
        if (needed <= wildCount) {
            const straightInfo = getStraightInfoFromArray(straight);
            return { rank: 4, hand_rank: [5, straightInfo.high, straightInfo.low], name: 'Straight (Wild)' };
        }
    }
    return null;
}

// Evaluate 3-card or 5-card front hands
function evaluateThreeCardHand(cards) {
    // Handle both 3-card and 5-card front hands
    if (cards.length === 5) {
        // Use the regular 5-card evaluation for 5-card front hands
        return evaluateHand(cards);
    }

    if (cards.length !== 3) return { rank: 0, hand_rank: [0, 0], name: 'Invalid' };

    // Handle wild cards in 3-card hands
    const wildCards = cards.filter(c => c.isWild);
    const normalCards = cards.filter(c => !c.isWild);

    if (wildCards.length > 0) {
        return evaluateThreeCardHandWithWilds(normalCards, wildCards.length);
    }

    const sortedCards = [...cards].sort((a, b) => b.value - a.value);
    const values = sortedCards.map(c => c.value);

    const valueCounts = {};
    values.forEach(val => valueCounts[val] = (valueCounts[val] || 0) + 1);

    const valuesByCount = {};
    for (const [value, count] of Object.entries(valueCounts)) {
        if (!valuesByCount[count]) valuesByCount[count] = [];
        valuesByCount[count].push(parseInt(value));
    }

    for (const count in valuesByCount) {
        valuesByCount[count].sort((a, b) => b - a);
    }

    const counts = Object.keys(valuesByCount).map(Number).sort((a, b) => b - a);

    if (counts[0] === 3) {
        const tripsRank = valuesByCount[3][0];
        return { rank: 3, hand_rank: [4, tripsRank], name: 'Three of a Kind' };
    }

    if (counts[0] === 2) {
        const pairRank = valuesByCount[2][0];
        const kicker = valuesByCount[1][0];
        return { rank: 1, hand_rank: [2, pairRank, kicker], name: 'Pair' };
    }

    return { rank: 0, hand_rank: [1, ...values], name: 'High Card' };
}

// Evaluate 3-card hand with wild cards
function evaluateThreeCardHandWithWilds(normalCards, wildCount) {
    const values = normalCards.map(c => c.value).sort((a, b) => b - a);
    const highCard = values[0] || 14;

    if (wildCount >= 2) {
        return { rank: 3, hand_rank: [4, highCard], name: 'Three of a Kind (Wild)' };
    }

    if (wildCount === 1) {
        const pairRank = highCard;
        const kicker = values.find(v => v !== pairRank) || 13;
        return { rank: 1, hand_rank: [2, pairRank, kicker], name: 'Pair (Wild)' };
    }

    const allValues = [...values];
    while (allValues.length < 3) allValues.push(13 - allValues.length);
    return { rank: 0, hand_rank: [1, ...allValues.slice(0, 3)], name: 'High Card' };
}

// Get straight info from sorted values (high to low)
function getStraightInfo(values) {
    // Check for wheel straight (A-5-4-3-2)
    if (values.includes(14) && values.includes(5) && values.includes(4) && values.includes(3) && values.includes(2)) {
        return { high: 14, low: 5 }; // Wheel: ace=14, five=5 (the two key cards)
    }

    // Regular straight
    const sorted = [...values].sort((a, b) => b - a);
    return { high: sorted[0], low: sorted[4] };
}

// Get straight info from straight array
function getStraightInfoFromArray(straightArray) {
    // Handle wheel straight
    if (straightArray[0] === 14 && straightArray[1] === 5) {
        return { high: 14, low: 5 };
    }

    // Regular straight
    return { high: straightArray[0], low: straightArray[4] };
}

// Convert card suits to numeric values for tiebreaking
// Spades=4, Hearts=3, Diamonds=2, Clubs=1
function getSuitValues(cards) {
    const suitRanks = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
    return cards.map(card => suitRanks[card.suit] || 0);
}