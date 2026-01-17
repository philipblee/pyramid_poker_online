// js/hands/automatic-detector.js
// Automatic hand detection for Pyramid Poker

/**
 * Automatic hand types and their precedence (higher = better)
 */
const AUTOMATIC_TYPES = {
    'three-full-houses': 4,  // Highest
    'dragon': 3,
    'three-flush': 2,
    'three-straight': 1     // Lowest
};

/**
 * Detect if an arrangement qualifies as an automatic
 * @param {Object} arrangement - {back, middle, front} with cards
 * @returns {Object|null} - {type, precedence} or null if no automatic
 */
function detectAutomatic(arrangement) {
    // Check in precedence order (highest first)
    if (hasThreeFullHouses(arrangement)) {
        return { type: 'three-full-houses', precedence: AUTOMATIC_TYPES['three-full-houses'] };
    }
    if (hasDragon(arrangement)) {
        return { type: 'dragon', precedence: AUTOMATIC_TYPES['dragon'] };
    }
    if (hasThreeFlush(arrangement)) {
        return { type: 'three-flush', precedence: AUTOMATIC_TYPES['three-flush'] };
    }
    if (hasThreeStraight(arrangement)) {
        return { type: 'three-straight', precedence: AUTOMATIC_TYPES['three-straight'] };
    }
    return null; // No automatic
}

/**
 * Check if arrangement has a dragon (one of each rank A-2)
 */
function hasDragon(arrangement) {
    const allCards = [
        ...arrangement.back,
        ...arrangement.middle,
        ...arrangement.front
    ];

    // Must have exactly 13 cards total
    if (allCards.length !== 13) return false;

    const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    const foundRanks = new Set();
    let wildCount = 0;

    allCards.forEach(card => {
        if (card.isWild) {
            wildCount++;
        } else if (card.rank) {
            foundRanks.add(card.rank);
        }
    });

    // Dragon = all 13 ranks (natural + wilds filling gaps)
    const totalUniqueRanks = foundRanks.size + wildCount;
    return totalUniqueRanks === 13 && allCards.length === 13;
}

function hasThreeFullHouses(arrangement) {
    const backCards = arrangement.back.filter(c => !c.isWild);
    const middleCards = arrangement.middle.filter(c => !c.isWild);
    const frontCards = arrangement.front.filter(c => !c.isWild);

    const backWilds = arrangement.back.filter(c => c.isWild).length;
    const middleWilds = arrangement.middle.filter(c => c.isWild).length;
    const frontWilds = arrangement.front.filter(c => c.isWild).length;

    return canBeFullHouse(backCards, backWilds, 5) &&
           canBeFullHouse(middleCards, middleWilds, 5) &&
           canBeFullHouse(frontCards, frontWilds, 5);
}

function hasThreeFlush(arrangement) {
    const backCards = arrangement.back.filter(c => !c.isWild);
    const middleCards = arrangement.middle.filter(c => !c.isWild);
    const frontCards = arrangement.front.filter(c => !c.isWild);

    const backWilds = arrangement.back.filter(c => c.isWild).length;
    const middleWilds = arrangement.middle.filter(c => c.isWild).length;
    const frontWilds = arrangement.front.filter(c => c.isWild).length;

    return canBeFlush(backCards, backWilds, 5) &&
           canBeFlush(middleCards, middleWilds, 5) &&
           canBeFlush(frontCards, frontWilds, 5);
}

function hasThreeStraight(arrangement) {
    const backCards = arrangement.back.filter(c => !c.isWild);
    const middleCards = arrangement.middle.filter(c => !c.isWild);
    const frontCards = arrangement.front.filter(c => !c.isWild);

    const backWilds = arrangement.back.filter(c => c.isWild).length;
    const middleWilds = arrangement.middle.filter(c => c.isWild).length;
    const frontWilds = arrangement.front.filter(c => c.isWild).length;

    return canBeStraight(backCards, backWilds, 5) &&
           canBeStraight(middleCards, middleWilds, 5) &&
           canBeStraight(frontCards, frontWilds, 5);
}

// Helper: Can make full house (trips+pair for 5 cards)
function canBeFullHouse(cards, wildCount, handSize) {
    const rankCounts = {};
    cards.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);

    // Back/Middle - need trips + pair
    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    // Try to make trips from highest count
    if (counts.length >= 2) {
        const wildsNeededForTrips = Math.max(0, 3 - counts[0]);
        const wildsNeededForPair = Math.max(0, 2 - counts[1]);
        if (wildsNeededForTrips + wildsNeededForPair <= wildCount) return true;
    }

    // All wilds
    return wildCount >= 5;
}

// Helper: Can make flush (all same suit)
function canBeFlush(cards, wildCount, handSize) {
    const suitCounts = {};
    cards.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);

    const maxSuitCount = Math.max(...Object.values(suitCounts), 0);
    return maxSuitCount + wildCount >= handSize;
}

// Helper: Can make straight (consecutive ranks)
function canBeStraight(cards, wildCount, handSize) {
    if (cards.length + wildCount < handSize) return false;

    const ranks = [...new Set(cards.map(c => c.value))].sort((a, b) => b - a);

    // Try each possible straight starting point
    const straightStarts = handSize === 5 ? [14, 13, 12, 11, 10, 9, 8, 7, 6, 5] : [14, 13, 12];

    for (const high of straightStarts) {
        const neededRanks = [];
        for (let i = 0; i < handSize; i++) {
            let rank = high - i;
            if (rank === 1 && high === 14) rank = 14; // Ace in wheel
            neededRanks.push(rank);
        }

        const missingRanks = neededRanks.filter(r => !ranks.includes(r));
        if (missingRanks.length <= wildCount) return true;
    }

    // Check wheel (A-2-3-4-5 or A-2-3 for front)
    if (handSize === 5) {
        const wheelRanks = [14, 2, 3, 4, 5];
        const missingWheel = wheelRanks.filter(r => !ranks.includes(r));
        if (missingWheel.length <= wildCount) return true;
    }

    return false;
}

/**
 * Detect if 17 cards can form ANY automatic pattern
 * @param {Array} allCards - All 17 cards dealt to player
 * @returns {Array} - List of possible automatics: ['dragon', 'three-full-houses', etc.]
 */
function detectPossibleAutomatics(allCards) {
    const possibleAutomatics = [];

    // Separate wilds from natural cards
    const naturalCards = allCards.filter(c => !c.isWild);
    const wildCount = allCards.filter(c => c.isWild).length;

    // Check Dragon (easiest - just need all 13 ranks)
    if (canFormDragon(naturalCards, wildCount)) {
        possibleAutomatics.push('dragon');
    }

    // Check Three Full Houses
    if (canFormThreeFullHouses(naturalCards, wildCount)) {
        possibleAutomatics.push('three-full-houses');
    }

    // Check Three Flush
    if (canFormThreeFlush(naturalCards, wildCount)) {
        possibleAutomatics.push('three-flush');
    }

    // Check Three Straight
    if (canFormThreeStraight(naturalCards, wildCount)) {
        possibleAutomatics.push('three-straight');
    }

    return possibleAutomatics;
}

/**
 * Can the cards form a dragon (all 13 ranks)?
 */
function canFormDragon(naturalCards, wildCount) {
    const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    const foundRanks = new Set();

    naturalCards.forEach(card => {
        if (card.rank) foundRanks.add(card.rank);
    });

    const missingRanks = ranks.filter(r => !foundRanks.has(r)).length;
    return missingRanks <= wildCount && (foundRanks.size + wildCount) >= 13;
}

/**
 * Can the cards form three full houses?
 * Need: Back 3+2, Middle 3+2, Front 3+2 = 15 cards with FH pattern
 */
function canFormThreeFullHouses(naturalCards, wildCount) {

    // Count inventory of each rank
    const rankCounts = {};
    naturalCards.forEach(c => {
        if (c.rank) {
            rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
        }
    });

    let availableWilds = wildCount;
    let fullHousesBuilt = 0;

    // Try to build a single full house (trips + pair from different ranks)
    function tryBuildFullHouse() {

        // Find best trips candidate (rank with most cards)
        let tripsRank = null;
        let tripsCount = 0;

        for (const [rank, count] of Object.entries(rankCounts)) {
            if (count > tripsCount) {
                tripsRank = rank;
                tripsCount = count;
            }
        }

        if (!tripsRank) {
            return false;
        }

        // Calculate wilds needed for trips
        const wildsForTrips = Math.max(0, 3 - tripsCount);

        if (wildsForTrips > availableWilds) {
            return false;
        }

        // Find best pair candidate (different rank)
        // PREFER ranks with exactly 2 cards (pure pairs, not wasted trips)
        let pairRank = null;
        let pairCount = 0;
        let preferPurePair = true;

        // First pass: look for pure pairs (count === 2)
        for (const [rank, count] of Object.entries(rankCounts)) {
            if (rank !== tripsRank && count === 2) {
                if (count > pairCount) {
                    pairRank = rank;
                    pairCount = count;
                }
            }
        }

        // Second pass: if no pure pairs, use any rank with ≥2 cards
        if (!pairRank) {
            for (const [rank, count] of Object.entries(rankCounts)) {
                if (rank !== tripsRank && count >= 2) {
                    if (count > pairCount) {
                        pairRank = rank;
                        pairCount = count;
                        preferPurePair = false;
                    }
                }
            }
        }

        if (!pairRank) {
            return false;
        }

        // Calculate wilds needed for pair
        const wildsForPair = Math.max(0, 2 - pairCount);
        const totalWildsNeeded = wildsForTrips + wildsForPair;

        if (totalWildsNeeded > availableWilds) {
            return false;
        }

        // Consume cards
        rankCounts[tripsRank] -= Math.min(3, tripsCount);
        if (rankCounts[tripsRank] === 0) delete rankCounts[tripsRank];

        rankCounts[pairRank] -= Math.min(2, pairCount);
        if (rankCounts[pairRank] === 0) delete rankCounts[pairRank];

        availableWilds -= totalWildsNeeded;
        return true;
    }

    // Try to build 3 full houses
    const fh1 = tryBuildFullHouse();
    if (fh1) fullHousesBuilt++;

    const fh2 = fh1 && tryBuildFullHouse();
    if (fh2) fullHousesBuilt++;

    const fh3 = fh2 && tryBuildFullHouse();
    if (fh3) fullHousesBuilt++;

    return fullHousesBuilt === 3;
}

/**
 * Can the cards form three flushes?
 * Need: 5 cards same suit, 5 cards same suit, 5 cards same suit
 */
function canFormThreeFlush(naturalCards, wildCount) {
    // Count natural cards by suit
    const suitCounts = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 };
    naturalCards.forEach(c => {
        if (c.suit) suitCounts[c.suit]++;
    });

    // Get counts in descending order
    const counts = Object.values(suitCounts).sort((a, b) => b - a);

    // Need at least 15 cards total for three 5-card flushes
    if (naturalCards.length + wildCount < 15) return false;

    // Calculate wilds needed to bring top 3 suits to 5 cards each
    const wildsForSuit1 = Math.max(0, 5 - counts[0]);
    const wildsForSuit2 = Math.max(0, 5 - counts[1]);
    const wildsForSuit3 = Math.max(0, 5 - counts[2]);

    const totalWildsNeeded = wildsForSuit1 + wildsForSuit2 + wildsForSuit3;

    return totalWildsNeeded <= wildCount;
}

/**
 * Can the cards form three straights?
 * Need: 5-card straight, 5-card straight, 5-card straight
 */
function canFormThreeStraight(naturalCards, wildCount) {

    // Count inventory of each rank
    const rankCounts = {};
    for (let i = 2; i <= 14; i++) {
        rankCounts[i] = 0;
    }

    naturalCards.forEach(c => {
        rankCounts[c.value]++;
    });

    let availableWilds = wildCount;
    let straightsBuilt = 0;

    // Try to build 3 straights greedily (highest first)
    function tryBuildStraight() {
        // Try each possible 5-card straight
        for (let high = 14; high >= 5; high--) {
            const needed = [];
            for (let i = 0; i < 5; i++) {
                needed.push(high - i);
            }

            // Check if we have enough cards for this straight
            let wildsNeeded = 0;
            let canBuild = true;

            for (const rank of needed) {
                if (rankCounts[rank] > 0) {
                    // Have natural card
                } else if (wildsNeeded < availableWilds) {
                    wildsNeeded++;
                } else {
                    canBuild = false;
                    break;
                }
            }

            if (canBuild) {
                // Consume cards for this straight
                for (const rank of needed) {
                    if (rankCounts[rank] > 0) {
                        rankCounts[rank]--;
                    } else {
                        availableWilds--;
                    }
                }
                return true;
            }
        }

        // Try wheel (A-2-3-4-5)
        const wheelRanks = [14, 2, 3, 4, 5];
        let wildsNeeded = 0;
        let canBuild = true;

        for (const rank of wheelRanks) {
            if (rankCounts[rank] > 0) {
                // Have natural card
            } else if (wildsNeeded < availableWilds) {
                wildsNeeded++;
            } else {
                canBuild = false;
                break;
            }
        }

        if (canBuild) {
            for (const rank of wheelRanks) {
                if (rankCounts[rank] > 0) {
                    rankCounts[rank]--;
                } else {
                    availableWilds--;
                }
            }
            return true;
        }

        return false;
    }

    // Try to build 3 straights
    const straight1 = tryBuildStraight();
    if (straight1) straightsBuilt++;

    const straight2 = straight1 && tryBuildStraight();
    if (straight2) straightsBuilt++;

    const straight3 = straight2 && tryBuildStraight();
    if (straight3) straightsBuilt++;

    return straightsBuilt === 3;
}

/**
 * Compare two automatics by precedence
 * @param {Object} auto1 - {type, precedence}
 * @param {Object} auto2 - {type, precedence}
 * @returns {number} - Positive if auto1 > auto2, negative if auto1 < auto2, 0 if equal
 */
function compareAutomatics(auto1, auto2) {
    return auto2.precedence - auto1.precedence; // Higher precedence wins
}

/**
 * Find and arrange the best automatic from 17 cards
 * @param {Array} allCards - All 17 cards
 * @returns {Object} - {type, arrangement} or null
 */
function findAndArrangeBestAutomatic(allCards) {
    const possibleAutomatics = detectPossibleAutomatics(allCards);

    if (possibleAutomatics.length === 0) {
        return null;
    }

    // Pick highest precedence
    const precedenceOrder = ['three-full-houses', 'dragon', 'three-flush', 'three-straight'];
    const bestAutomatic = precedenceOrder.find(type => possibleAutomatics.includes(type));

    // Arrange cards for that automatic
    let arrangement;
    switch(bestAutomatic) {
        case 'dragon':
            arrangement = arrangeDragon(allCards);
            break;
        case 'three-full-houses':
            arrangement = arrangeThreeFullHouses(allCards);
            break;
        case 'three-flush':
            arrangement = arrangeThreeFlush(allCards);
            break;
        case 'three-straight':
            arrangement = arrangeThreeStraight(allCards);
            break;
    }

    return { type: bestAutomatic, arrangement };
}

// Three-full-houses - build trips+pairs
function arrangeThreeFullHouses(allCards) {
    console.log('🎨 arrangeThreeFullHouses - arranging 17 cards');

    const wilds = allCards.filter(c => c.isWild);
    const naturals = allCards.filter(c => !c.isWild);

    // Build rank inventory (rank → array of cards)
    const rankInventory = {};
    naturals.forEach(c => {
        if (!rankInventory[c.rank]) rankInventory[c.rank] = [];
        rankInventory[c.rank].push(c);
    });

    console.log('📊 Initial inventory:',
        Object.fromEntries(Object.entries(rankInventory).map(([k,v]) => [k, v.length])));

    let availableWilds = [...wilds];

    // Build a single full house
    function buildFullHouse(targetHand) {

        const fhNumber = hands.length + 1;
        console.log(`\n🎯 Building full house #${fhNumber}`);
        console.log(`   Wilds available: ${availableWilds.length}`);

        // Find best trips candidate (rank with most cards)
        let tripsRank = null;
        let tripsCount = 0;

        for (const [rank, cards] of Object.entries(rankInventory)) {
            if (cards.length > tripsCount) {
                tripsRank = rank;
                tripsCount = cards.length;
            }
        }

        if (!tripsRank) {
            console.log('❌ No ranks available for trips');
            return false;
        }

        const wildsForTrips = Math.max(0, 3 - tripsCount);

        if (wildsForTrips > availableWilds.length) {
            console.log(`❌ Need ${wildsForTrips} wilds for trips, only have ${availableWilds.length}`);
            return false;
        }

        console.log(`✓ Using trips: ${tripsRank} (${tripsCount} cards, need ${wildsForTrips} wilds)`);

        // Find best pair candidate (different rank)
        // PREFER ranks with exactly 2 cards (pure pairs, not wasted trips)
        let pairRank = null;
        let pairCount = 0;
        let isPurePair = false;

        // First pass: look for pure pairs (count === 2)
        for (const [rank, cards] of Object.entries(rankInventory)) {
            if (rank !== tripsRank && cards.length === 2) {
                pairRank = rank;
                pairCount = 2;
                isPurePair = true;
                break; // Found pure pair, use it
            }
        }

        // Second pass: if no pure pairs, use any rank with most cards
        if (!pairRank) {
            for (const [rank, cards] of Object.entries(rankInventory)) {
                if (rank !== tripsRank && cards.length > pairCount) {
                    pairRank = rank;
                    pairCount = cards.length;
                }
            }
        }

        if (!pairRank) {
            console.log('❌ No second rank available for pair');
            return false;
        }

        const wildsForPair = Math.max(0, 2 - pairCount);
        const totalWildsNeeded = wildsForTrips + wildsForPair;

        if (totalWildsNeeded > availableWilds.length) {
            console.log(`❌ Need ${totalWildsNeeded} total wilds, only have ${availableWilds.length}`);
            return false;
        }

        console.log(`✓ Using pair: ${pairRank} (${pairCount} cards, ${isPurePair ? 'pure pair' : 'from trips'}, need ${wildsForPair} wilds)`);

        console.log(`✅ Built full house: ${tripsRank}-${tripsRank}-${tripsRank}-${pairRank}-${pairRank}`);

        // Add trips to hand
        const tripsToUse = Math.min(3, tripsCount);
        for (let i = 0; i < tripsToUse; i++) {
            targetHand.push(rankInventory[tripsRank].shift());
        }
        for (let i = 0; i < wildsForTrips; i++) {
            targetHand.push(availableWilds.shift());
        }

        // Clean up empty rank
        if (rankInventory[tripsRank].length === 0) {
            delete rankInventory[tripsRank];
        }

        // Add pair to hand
        const pairToUse = Math.min(2, pairCount);
        for (let i = 0; i < pairToUse; i++) {
            targetHand.push(rankInventory[pairRank].shift());
        }
        for (let i = 0; i < wildsForPair; i++) {
            targetHand.push(availableWilds.shift());
        }

        // Clean up empty rank
        if (rankInventory[pairRank].length === 0) {
            delete rankInventory[pairRank];
        }

        console.log('📊 Remaining inventory:',
            Object.fromEntries(Object.entries(rankInventory).map(([k,v]) => [k, v.length])));

        return true;
    }

    // Build 3 full houses
    const hands = [];

    const hand1 = [];
    if (buildFullHouse(hand1)) hands.push(hand1);

    const hand2 = [];
    if (buildFullHouse(hand2)) hands.push(hand2);

    const hand3 = [];
    if (buildFullHouse(hand3)) hands.push(hand3);

    // Sort by hand strength (strongest first)
    hands.sort((a, b) => {
        const strengthA = evaluateHand(a);
        const strengthB = evaluateHand(b);
        return compareTuples(strengthB.handStrength, strengthA.handStrength);
    });

    // Assign to back/middle/front (strongest to weakest)
    const back = hands[0] || [];
    const middle = hands[1] || [];
    const front = hands[2] || [];

    console.log('🏁 Arrangement complete (sorted by strength)');
    console.log(`   Back: ${back.length} cards`);
    console.log(`   Middle: ${middle.length} cards`);
    console.log(`   Front: ${front.length} cards`);

    return { back, middle, front };

}

// Dragon - should already work, but here's a cleaner version
function arrangeDragon(allCards) {
    // Dragon just needs all 13 unique ranks visible
    // Simple distribution works fine
    return {
        back: allCards.slice(0, 5),
        middle: allCards.slice(5, 10),
        front: allCards.slice(10, 13)
    };
}

// Arrange for three flush
function arrangeThreeFlush(allCards) {
    const wilds = allCards.filter(c => c.isWild);
    const naturals = allCards.filter(c => !c.isWild);

    // Group naturals by suit and sort by rank
    const suitGroups = { '♠': [], '♥': [], '♦': [], '♣': [] };
    naturals.forEach(c => suitGroups[c.suit].push(c));

    // Get top 5 from each suit, sorted by rank
    const flushHands = Object.entries(suitGroups)
        .map(([suit, cards]) => {
            return {
                suit: suit,
                cards: cards.sort((a, b) => b.value - a.value).slice(0, 5)
            };
        })
        .filter(hand => hand.cards.length > 0);

    // Fill each hand to 5 cards with wilds
    let wildIndex = 0;
    flushHands.forEach(hand => {
        while (hand.cards.length < 5 && wildIndex < wilds.length) {
            hand.cards.push(wilds[wildIndex++]);
        }
    });

    // Evaluate and sort by handRank (descending)
    const evaluatedHands = flushHands
        .map(hand => {
            console.log(`  📋 Hand suit ${hand.suit}, cards:`, hand.cards.map(c => `${c.rank||'WILD'}${c.suit} (isWild:${c.isWild})`).join(', '));

            const evalCards = hand.cards.map(card => {
                if (card.isWild) {
                    const replacement = {
                        ...card,
                        id: `A${hand.suit}_wild`,
                        rank: "A",
                        suit: hand.suit,
                        value: 14,
                        isWild: false,
                        wasWild: true
                    };
                    console.log('  🔄 WILD REPLACEMENT:', replacement);
                    return replacement;
                }
                return card;
            });

            console.log('🔄 Before evaluateHand:');
            console.log('  evalCards:', evalCards.map(c => `${c.rank}${c.suit} (isWild:${c.isWild})`).join(', '));

            return {
                cards: evalCards,  // ✅ Return replaced cards, not originals
                handRank: evaluateHand(evalCards)
            };
        })
        .filter(hand => hand.cards.length === 5)
        .sort((a, b) => {
            if (b.handRank.handType !== a.handRank.handType) {
                return b.handRank.handType - a.handRank.handType;
            }
            for (let i = 0; i < a.handRank.handStrength.length; i++) {
                if (b.handRank.handStrength[i] !== a.handRank.handStrength[i]) {
                    return b.handRank.handStrength[i] - a.handRank.handStrength[i];
                }
            }
            return 0;
        });

    console.log('🃏 Three-Flush Evaluation:');
    evaluatedHands.forEach((hand, index) => {
        const handType = index === 0 ? 'BACK' : index === 1 ? 'MIDDLE' : 'FRONT';
        const cardList = hand.cards.map(c => `${c.rank}${c.suit}`).join(' ');
        console.log(`  ${handType}: ${cardList}`);
        console.log(`    Type: ${hand.handRank.handType}, Strength: [${hand.handRank.handStrength.join(', ')}]`);
    });

    const back = evaluatedHands[0]?.cards || [];
    const middle = evaluatedHands[1]?.cards || [];
    const front = evaluatedHands[2]?.cards || [];

    return { back, middle, front };
}

function arrangeThreeStraight(allCards) {
    console.log('🎨 arrangeThreeStraight - arranging 17 cards');

    const wilds = allCards.filter(c => c.isWild);
    const naturals = allCards.filter(c => !c.isWild);

    // Build rank inventory (rank → array of cards)
    const rankInventory = {};
    for (let i = 2; i <= 14; i++) {
        rankInventory[i] = [];
    }

    naturals.forEach(c => {
        rankInventory[c.value].push(c);
    });

    console.log('📊 Initial inventory counts:',
        Object.fromEntries(Object.entries(rankInventory).map(([k,v]) => [k, v.length])));

    let availableWilds = [...wilds];

    // NESTED FUNCTION - can access parent variables
    function buildStraight(targetHand) {

        // Try each possible 5-card straight (high to low)
        for (let high = 14; high >= 5; high--) {
            const needed = [];
            for (let i = 0; i < 5; i++) {
                needed.push(high - i);
            }

            // Check if we can build this straight
            let wildsNeeded = 0;
            const cardsForStraight = [];
            let canBuild = true;

            for (const rank of needed) {
                if (rankInventory[rank] && rankInventory[rank].length > 0) {
                    cardsForStraight.push(rankInventory[rank][0]);
                } else if (wildsNeeded < availableWilds.length) {
                    cardsForStraight.push(null);
                    wildsNeeded++;
                } else {
                    canBuild = false;
                    break;
                }
            }

            if (canBuild) {
                console.log(`✅ Building straight: ${needed.join('-')} (using ${wildsNeeded} wilds)`);

                // Consume cards from inventory
                for (let i = 0; i < cardsForStraight.length; i++) {
                    if (cardsForStraight[i]) {
                        const rank = needed[i];
                        const card = rankInventory[rank].shift();
                        targetHand.push(card);
                        if (rankInventory[rank].length === 0) {
                            delete rankInventory[rank];
                        }
                    } else {
                        targetHand.push(availableWilds.shift());
                    }
                }

                console.log('📊 Remaining inventory:',
                    Object.fromEntries(Object.entries(rankInventory).map(([k,v]) => [k, v.length])));
                return true;
            }
        }

        // Try wheel (A-2-3-4-5)
        const wheelRanks = [14, 2, 3, 4, 5];
        let wildsNeeded = 0;
        const cardsForStraight = [];
        let canBuild = true;

        for (const rank of wheelRanks) {
            if (rankInventory[rank] && rankInventory[rank].length > 0) {
                cardsForStraight.push(rankInventory[rank][0]);
            } else if (wildsNeeded < availableWilds.length) {
                cardsForStraight.push(null);
                wildsNeeded++;
            } else {
                canBuild = false;
                break;
            }
        }

        if (canBuild) {
            console.log(`✅ Building wheel straight: A-2-3-4-5 (using ${wildsNeeded} wilds)`);

            for (let i = 0; i < cardsForStraight.length; i++) {
                if (cardsForStraight[i]) {
                    const rank = wheelRanks[i];
                    const card = rankInventory[rank].shift();
                    targetHand.push(card);
                    if (rankInventory[rank].length === 0) {
                        delete rankInventory[rank];
                    }
                } else {
                    targetHand.push(availableWilds.shift());
                }
            }

            console.log('📊 Remaining inventory:',
                Object.fromEntries(Object.entries(rankInventory).map(([k,v]) => [k, v.length])));
            return true;
        }

        console.log('❌ Could not build straight');
        return false;
    }

    // Build 3 straights (at the end of arrangeThreeStraight, replace the build calls)
    const hands = [];

    // Build first straight
    const hand1 = [];
    if (buildStraight(hand1)) hands.push(hand1);

    // Build second straight
    const hand2 = [];
    if (buildStraight(hand2)) hands.push(hand2);

    // Build third straight
    const hand3 = [];
    if (buildStraight(hand3)) hands.push(hand3);

    // Sort by hand strength (strongest first)
    hands.sort((a, b) => {
        const strengthA = evaluateHand(a);
        const strengthB = evaluateHand(b);
        return compareTuples(strengthB.handStrength, strengthA.handStrength);
    });

    // Assign to back/middle/front (strongest to weakest)
    let back = hands[0] || [];
    let middle = hands[1] || [];
    let front = hands[2] || [];

    console.log('🏁 Arrangement complete (sorted by strength)');
    console.log(`   Back: ${back.length} cards`);
    console.log(`   Middle: ${middle.length} cards`);
    console.log(`   Front: ${front.length} cards`);

    return { back, middle, front };
}

window.dealAutomatic = function(type) {
    // Clear everything first
    document.getElementById('playerHand').innerHTML = '';
    document.getElementById('backHand').innerHTML = '';
    document.getElementById('middleHand').innerHTML = '';
    document.getElementById('frontHand').innerHTML = '';

    const automaticHands = {
        // DRAGON: All 13 unique ranks (A-K-Q-J-10-9-8-7-6-5-4-3-2)
        'dragon': [
            {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: 'K♠_2', rank: 'K', suit: '♠', value: 13, isWild: false},
            {id: 'Q♠_3', rank: 'Q', suit: '♠', value: 12, isWild: false},
            {id: 'J♠_4', rank: 'J', suit: '♠', value: 11, isWild: false},
            {id: '10♠_5', rank: '10', suit: '♠', value: 10, isWild: false},
            {id: '9♥_6', rank: '9', suit: '♥', value: 9, isWild: false},
            {id: '8♥_7', rank: '8', suit: '♥', value: 8, isWild: false},
            {id: '7♥_8', rank: '7', suit: '♥', value: 7, isWild: false},
            {id: '6♥_9', rank: '6', suit: '♥', value: 6, isWild: false},
            {id: '5♥_10', rank: '5', suit: '♥', value: 5, isWild: false},
            {id: '4♦_11', rank: '4', suit: '♦', value: 4, isWild: false},
            {id: '3♦_12', rank: '3', suit: '♦', value: 3, isWild: false},
            {id: '2♦_13', rank: '2', suit: '♦', value: 2, isWild: false},
            {id: 'A♣_14', rank: 'A', suit: '♣', value: 14, isWild: false},
            {id: 'K♣_15', rank: 'K', suit: '♣', value: 13, isWild: false},
            {id: 'Q♣_16', rank: 'Q', suit: '♣', value: 12, isWild: false},
            {id: 'J♣_17', rank: 'J', suit: '♣', value: 11, isWild: false}
        ],

        // THREE-FLUSH: 5♠ + 5♥ + 5♦ (NOT dragon - only 5 ranks: A,K,Q,J,10)
        'three-flush': [
            {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: 'K♠_2', rank: 'K', suit: '♠', value: 13, isWild: false},
            {id: 'Q♠_3', rank: 'Q', suit: '♠', value: 12, isWild: false},
            {id: 'J♠_4', rank: 'J', suit: '♠', value: 11, isWild: false},
            {id: '10♠_5', rank: '10', suit: '♠', value: 10, isWild: false},
            {id: 'A♥_6', rank: 'A', suit: '♥', value: 14, isWild: false},
            {id: 'K♥_7', rank: 'K', suit: '♥', value: 13, isWild: false},
            {id: 'Q♥_8', rank: 'Q', suit: '♥', value: 12, isWild: false},
            {id: 'J♥_9', rank: 'J', suit: '♥', value: 11, isWild: false},
            {id: '10♥_10', rank: '10', suit: '♥', value: 10, isWild: false},
            {id: 'A♦_11', rank: 'A', suit: '♦', value: 14, isWild: false},
            {id: 'K♦_12', rank: 'K', suit: '♦', value: 13, isWild: false},
            {id: 'Q♦_13', rank: 'Q', suit: '♦', value: 12, isWild: false},
            {id: 'J♦_14', rank: 'J', suit: '♦', value: 11, isWild: false},
            {id: '10♦_15', rank: '10', suit: '♦', value: 10, isWild: false},
            {id: '9♣_16', rank: '9', suit: '♣', value: 9, isWild: false},
            {id: '8♣_17', rank: '8', suit: '♣', value: 8, isWild: false}
        ],

        // THREE-STRAIGHT: Mixed suits, overlapping ranks (NOT dragon - only 9 ranks: A,2,3,4,5,6,7,8,9)
        'three-straight': [
            {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: '2♥_2', rank: '2', suit: '♥', value: 2, isWild: false},
            {id: '3♦_3', rank: '3', suit: '♦', value: 3, isWild: false},
            {id: '4♣_4', rank: '4', suit: '♣', value: 4, isWild: false},
            {id: '5♠_5', rank: '5', suit: '♠', value: 5, isWild: false},
            {id: '7♥_6', rank: '7', suit: '♥', value: 7, isWild: false},
            {id: '6♦_7', rank: '6', suit: '♦', value: 6, isWild: false},
            {id: '5♣_8', rank: '5', suit: '♣', value: 5, isWild: false},
            {id: '4♠_9', rank: '4', suit: '♠', value: 4, isWild: false},
            {id: '3♥_10', rank: '3', suit: '♥', value: 3, isWild: false},
            {id: '9♦_11', rank: '9', suit: '♦', value: 9, isWild: false},
            {id: '8♣_12', rank: '8', suit: '♣', value: 8, isWild: false},
            {id: '7♠_13', rank: '7', suit: '♠', value: 7, isWild: false},
            {id: '6♥_14', rank: '6', suit: '♥', value: 6, isWild: false},
            {id: '5♦_15', rank: '5', suit: '♦', value: 5, isWild: false},
            {id: 'K♣_16', rank: 'K', suit: '♣', value: 13, isWild: false},
            {id: 'Q♣_17', rank: 'Q', suit: '♣', value: 12, isWild: false}
        ],

        // THREE-FULL-HOUSES: AAA22 + KKK88 + QQQ77 (15 cards)
        'three-full-houses': [
            {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: 'A♥_2', rank: 'A', suit: '♥', value: 14, isWild: false},
            {id: 'A♦_3', rank: 'A', suit: '♦', value: 14, isWild: false},
            {id: '2♠_4', rank: '2', suit: '♠', value: 2, isWild: false},
            {id: '2♥_5', rank: '2', suit: '♥', value: 2, isWild: false},
            {id: 'K♠_6', rank: 'K', suit: '♠', value: 13, isWild: false},
            {id: 'K♥_7', rank: 'K', suit: '♥', value: 13, isWild: false},
            {id: 'K♦_8', rank: 'K', suit: '♦', value: 13, isWild: false},
            {id: '8♠_9', rank: '8', suit: '♠', value: 8, isWild: false},
            {id: '8♥_10', rank: '8', suit: '♥', value: 8, isWild: false},
            {id: 'Q♠_11', rank: 'Q', suit: '♠', value: 12, isWild: false},
            {id: 'Q♥_12', rank: 'Q', suit: '♥', value: 12, isWild: false},
            {id: 'Q♦_13', rank: 'Q', suit: '♦', value: 12, isWild: false},
            {id: '7♠_14', rank: '7', suit: '♠', value: 7, isWild: false},
            {id: '7♥_15', rank: '7', suit: '♥', value: 7, isWild: false},
            {id: '3♣_16', rank: '3', suit: '♣', value: 3, isWild: false},
            {id: '4♣_17', rank: '4', suit: '♣', value: 4, isWild: false}
        ],

        // TEST 1: Three flushes, no wilds - scrambled order to test sorting
        // Expected result after sorting:
        // Back: Spades A-K-Q-J-10 (best)
        // Middle: Diamonds A-10-9-8-7 (second - Ace high beats King high)
        // Front: Hearts K-Q-J-9-8 (third - King high)
        'three-flush-no-wild': [
            {id: 'K♥_1', rank: 'K', suit: '♥', value: 13, isWild: false},
            {id: 'A♠_2', rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: '10♦_3', rank: '10', suit: '♦', value: 10, isWild: false},
            {id: 'J♥_4', rank: 'J', suit: '♥', value: 11, isWild: false},
            {id: 'K♠_5', rank: 'K', suit: '♠', value: 13, isWild: false},
            {id: 'A♦_6', rank: 'A', suit: '♦', value: 14, isWild: false},
            {id: '9♥_7', rank: '9', suit: '♥', value: 9, isWild: false},
            {id: 'Q♠_8', rank: 'Q', suit: '♠', value: 12, isWild: false},
            {id: '9♦_9', rank: '9', suit: '♦', value: 9, isWild: false},
            {id: 'J♠_10', rank: 'J', suit: '♠', value: 11, isWild: false},
            {id: '8♥_11', rank: '8', suit: '♥', value: 8, isWild: false},
            {id: '8♦_12', rank: '8', suit: '♦', value: 8, isWild: false},
            {id: '10♠_13', rank: '10', suit: '♠', value: 10, isWild: false},
            {id: 'Q♥_14', rank: 'Q', suit: '♥', value: 12, isWild: false},
            {id: '7♦_15', rank: '7', suit: '♦', value: 7, isWild: false},
            {id: '5♣_16', rank: '5', suit: '♣', value: 5, isWild: false},
            {id: '4♣_17', rank: '4', suit: '♣', value: 4, isWild: false}
        ],

        // TEST 2: Three flushes with ONE wild card
        // Expected result after wild becomes Ace of Diamonds:
        // Back: Diamonds A-Q-J-10-9 (best with wild as A♦)
        // Middle: Spades K-Q-J-10-9 (second)
        // Front: Hearts K-Q-J-10-8 (third)
        'three-flush-one-wild': [
            {id: 'Q♦_1', rank: 'Q', suit: '♦', value: 12, isWild: false},
            {id: 'K♠_2', rank: 'K', suit: '♠', value: 13, isWild: false},
            {id: 'J♦_3', rank: 'J', suit: '♦', value: 11, isWild: false},
            {id: 'Q♥_4', rank: 'Q', suit: '♥', value: 12, isWild: false},
            {id: '10♠_5', rank: '10', suit: '♠', value: 10, isWild: false},
            {id: '10♦_6', rank: '10', suit: '♦', value: 10, isWild: false},
            {id: 'J♥_7', rank: 'J', suit: '♥', value: 11, isWild: false},
            {id: '9♠_8', rank: '9', suit: '♠', value: 9, isWild: false},
            {id: 'K♥_9', rank: 'K', suit: '♥', value: 13, isWild: false},
            {id: 'Q♠_10', rank: 'Q', suit: '♠', value: 12, isWild: false},
            {id: '9♦_11', rank: '9', suit: '♦', value: 9, isWild: false},
            {id: '10♥_12', rank: '10', suit: '♥', value: 10, isWild: false},
            {id: 'J♠_13', rank: 'J', suit: '♠', value: 11, isWild: false},
            {id: '8♥_14', rank: '8', suit: '♥', value: 8, isWild: false},
            {id: 'WILD_15', rank: '', suit: '', value: 0, isWild: true},
            {id: '6♣_16', rank: '6', suit: '♣', value: 6, isWild: false},
            {id: '5♣_17', rank: '5', suit: '♣', value: 5, isWild: false}
        ]

    };

    // Clear staging and deal
    const stagingArea = document.getElementById('playerHand');
    stagingArea.innerHTML = '';

    if (!automaticHands[type]) {
        console.error(`❌ Unknown automatic type: ${type}`);
        return;
    }

    automaticHands[type].forEach(card => {
        const cardEl = createCardElement(card);
        stagingArea.appendChild(cardEl);
    });

    console.log(`✅ Dealt ${type} automatic`);
};

// Export or add to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { detectPossibleAutomatics };
} else {
    window.detectPossibleAutomatics = detectPossibleAutomatics;
}
