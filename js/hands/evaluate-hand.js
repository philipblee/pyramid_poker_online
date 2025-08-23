// Card evaluation functions for Pyramid Poker

function evaluateHand(cards) {
    if (cards.length !== 5 && cards.length !== 6 && cards.length !== 7 && cards.length !== 8) return { rank: 1, hand_rank: [1, 7], name: 'High Card' };
    const analysis = new Analysis(cards);
    const handType = getHandType(analysis);
    return handType;
}

function getHandType(analysis) {
    const cards = analysis.cards;
    const values = analysis.getSortedValues();
    const suits = analysis.getSuits();
    const valueCounts = analysis.getValueCounts();
    const numberOfCards = cards.length
    const counts = Object.keys(valueCounts).map(Number).sort((a, b) => b - a);
    const isFlush = analysis.isAllSameSuit(suits);
    const isStraight = analysis.isSequentialValues(values);

    if (isFlush && isStraight && numberOfCards === 5) {
        return getStraightFlushHand(analysis);
    }

    if (isFlush && isStraight && numberOfCards === 6) {
        return getSixCardStraightFlushHand(analysis);
    }

    if (isFlush && isStraight && numberOfCards === 7) {
        return getSevenCardStraightFlushHand(analysis);
    }

    if (isFlush && isStraight && numberOfCards === 8) {
        return getEightCardStraightFlushHand(analysis);
    }


    if (counts[0] === 4) {
        return getFourOfAKindHand(analysis, valueCounts);
    }

    if (counts[0] === 5) {
        return getFiveOfAKindHand(analysis, valueCounts);
    }

    if (counts[0] === 6) {
        return getSixOfAKindHand(analysis, valueCounts);
    }

    if (counts[0] === 7) {
        return getSevenOfAKindHand(analysis, valueCounts);
    }

    if (counts[0] === 8) {
        return getEightOfAKindHand(analysis, valueCounts);
    }

    if (counts[0] === 3 && counts[1] === 2) {
        return getFullHouseHand(analysis, valueCounts);

    }
    if (isFlush) {
        return getFlushHand(analysis);
    }

    if (counts[0] === 3) {
        return getThreeOfAKindHand(analysis, valueCounts);
    }

    if (counts[0] === 2) {
        if (valueCounts[2].length >= 2) {
            return getTwoPairHand(analysis, valueCounts);
        } else {
            return getPairHand(analysis, valueCounts);
        }
    }


    if (isStraight) {
        return getStraightHand(analysis);
    }

    return getHighCardHand(analysis);
}

function getStraightFlushHand(analysis) {
    const straightInfo = analysis.getStraightInfo();
    const name = straightInfo.high === 14 && straightInfo.low === 13 ? 'Royal Flush' : 'Straight Flush';
    return { rank: 9, hand_rank: [9, straightInfo.high, straightInfo.low], name: name };
}

function getSixCardStraightFlushHand(analysis) {
    const straightInfo = analysis.getStraightInfo();
    const name = straightInfo.high === 14 && straightInfo.low === 13 ? 'Six-Card Royal Flush' : 'Straight Flush';
    return { rank: 11, hand_rank: [11, straightInfo.high, straightInfo.low], name: name };
}


function getSevenCardStraightFlushHand(analysis) {
    const straightInfo = analysis.getStraightInfo();
    const name = straightInfo.high === 14 && straightInfo.low === 13 ? 'Seven-Card Royal Flush' : 'Straight Flush';
    return { rank: 13, hand_rank: [13, straightInfo.high, straightInfo.low], name: name };
}

function getEightCardStraightFlushHand(analysis) {
    const straightInfo = analysis.getStraightInfo();
    const name = straightInfo.high === 14 && straightInfo.low === 13 ? 'Eight-Card Royal Flush' : 'Straight Flush';
    return { rank: 15, hand_rank: [15, straightInfo.high, straightInfo.low], name: name };
}


function getFourOfAKindHand(analysis, valueCounts) {
    const quadRank = valueCounts[4][0];
    const kicker = valueCounts[1][0];
    const quadCards = analysis.cards.filter(c => c.value === quadRank);
    const kickerCard = analysis.cards.find(c => c.value === kicker);
    const suitValues = getSuitValues([...quadCards, kickerCard]);
    return { rank: 8, hand_rank: [8, quadRank, kicker, ...suitValues], name: 'Four of a Kind' };
}

function getFiveOfAKindHand(analysis, valueCounts) {
    const fiveRank = valueCounts[5][0];
    const fiveCards = analysis.cards.filter(c => c.value === fiveRank);
    const suitValues = getSuitValues([...fiveCards]);
    return { rank: 10, hand_rank: [10, fiveRank, ...suitValues], name: 'Five of a Kind' };
}

function getSixOfAKindHand(analysis, valueCounts) {
    const sixRank = valueCounts[6][0];
    const sixCards = analysis.cards.filter(c => c.value === sixRank);
    const suitValues = getSuitValues([...sixCards]);
    return { rank: 12, hand_rank: [12, sixRank, ...suitValues], name: 'Six of a Kind' };
}

function getSevenOfAKindHand(analysis, valueCounts) {
    const sevenRank = valueCounts[7][0];
    const sevenCards = analysis.cards.filter(c => c.value === sevenRank);
    const suitValues = getSuitValues([...sevenCards]);
    return { rank: 14, hand_rank: [14, sevenRank, ...suitValues], name: 'Seven of a Kind' };
}

function getEightOfAKindHand(analysis, valueCounts) {
    const eightRank = valueCounts[8][0];
    const eightCards = analysis.cards.filter(c => c.value === eightRank);
    const suitValues = getSuitValues([...eightCards]);
    return { rank: 16, hand_rank: [16, eightRank, ...suitValues], name: 'Eight of a Kind' };
}

function getFullHouseHand(analysis, valueCounts) {
    const tripsRank = valueCounts[3][0];
    const pairRank = valueCounts[2][0];
    return { rank: 7, hand_rank: [7, tripsRank, pairRank], name: 'Full House' };
}

function getFlushHand(analysis) {
    const values = analysis.getSortedValues();
    return { rank: 6, hand_rank: [6, ...values], name: 'Flush' };
}

function getStraightHand(analysis) {
    const straightInfo = analysis.getStraightInfo();
    return { rank: 5, hand_rank: [5, straightInfo.high, straightInfo.low], name: 'Straight' };
}

function getThreeOfAKindHand(analysis, valueCounts) {
    const tripsRank = valueCounts[3][0];
    const kickers = valueCounts[1];
    return { rank: 4, hand_rank: [4, tripsRank, ...kickers], name: 'Three of a Kind' };
}

function getTwoPairHand(analysis, valueCounts) {
    const pairs = valueCounts[2];
    const kicker = valueCounts[1][0];
    return { rank: 3, hand_rank: [3, Math.max(...pairs), Math.min(...pairs), kicker], name: 'Two Pair' };
}

function getPairHand(analysis, valueCounts) {
    const pairRank = valueCounts[2][0];
    const kickers = valueCounts[1];
    return { rank: 2, hand_rank: [2, pairRank, ...kickers], name: 'Pair' };
}

function getHighCardHand(analysis) {
    const values = analysis.getSortedValues();
    return { rank: 1, hand_rank: [1, ...values], name: 'High Card' };
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
                    const straightInfo = getStraightInfo(straight);
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
            const straightInfo = getStraightInfo(straight);
            return { rank: 4, hand_rank: [5, straightInfo.high, straightInfo.low], name: 'Straight (Wild)' };
        }
    }
    return null;
}

// Evaluate 3-card or 5-card front hands
function evaluateThreeCardHand(cards) {
    // Handle 5-card front hands
    if (cards.length === 5) {
        // Use the regular 5-card evaluation for 5-card front hands
        return evaluateHand(cards);
    }

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

    if (cards.length === 1) return { rank: 1, hand_rank: [1, 7], name: 'High Card' };

    if (cards.length === 2) return { rank: 1, hand_rank: [1, 8, 7], name: 'High Card' };

    if (cards.length !== 3) return { rank: 1, hand_rank: [1, 7], name: 'Invalid' };

    const counts = Object.keys(valuesByCount).map(Number).sort((a, b) => b - a);

    // Found trip
    if (counts[0] === 3) {
        const tripsRank = valuesByCount[3][0];
        return { rank: 4, hand_rank: [4, tripsRank], name: 'Three of a Kind' };
    }

    // found pair
    if (counts[0] === 2) {
        const pairRank = valuesByCount[2][0];
        const kicker = valuesByCount[1][0];
        return { rank: 2, hand_rank: [2, pairRank, kicker], name: 'Pair' };
    }

    // else it's a high card
    return { rank: 1, hand_rank: [1, ...values], name: 'High Card' };
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

// Universal straight info - handles both value arrays and pre-sorted straight arrays
function getStraightInfo(input) {
    let values;

    // Handle different input formats
    if (Array.isArray(input) && input.length === 5) {
        // If it's already a 5-element array, assume it's pre-sorted high-to-low
        if (input[0] >= input[1] && input[1] >= input[2]) {
            values = input; // Already sorted
        } else {
            values = [...input].sort((a, b) => b - a); // Sort if needed
        }
    } else {
        // Handle Set, unsorted array, or other iterable
        values = [...input].sort((a, b) => b - a);
    }

    // Check for wheel straight (A-5-4-3-2)
    if (values.includes(14) && values.includes(5) && values.includes(4) && values.includes(3) && values.includes(2)) {
        return { high: 14, low: 5 }; // Wheel: ace=14, five=5
    }

    // Regular straight - return highest and second-highest
    return { high: values[0], low: values[1] };
}

// Convert card suits to numeric values for tiebreaking
// Spades=4, Hearts=3, Diamonds=2, Clubs=1
function getSuitValues(cards) {
    const suitRanks = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
    return cards.map(card => suitRanks[card.suit] || 0);
}