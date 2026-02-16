// js/ui/resolve-wild-in-hand.js
// Auto-resolves a wild card based on the context of the hand it's in

/**
 * Resolve a wild card to its best rank/suit based on hand context.
 *
 * 3-card hands:  Trips → Pair → High Card
 * 5-card hands:  SF → 4K → Full House → Flush → Straight → Trips → Pair → High Card
 * 6-card hands:  6K → 6-card SF → 5-card logic
 * 7-card hands:  7K → 7-card SF → 6K → 6-card SF → 5-card logic
 * 8-card hands:  8K → 8-card SF → 7K → 7-card SF → 6K → 6-card SF → 5-card logic
 *
 * @param {Object} wildCard  - The wild card object (isWild: true)
 * @param {Array}  handCards - All cards in the hand including the wild
 */
function resolveWildInHand(wildCard, handCards) {
    if (!wildCard || (!wildCard.isWild && !wildCard.wasWild)) {
        console.warn('⚠️ resolveWildInHand: card is not a wild', wildCard);
        return;
    }

    const otherCards = handCards.filter(c => c !== wildCard && !c.isWild);
    const rankCounts = {};
    const suitCounts = {};
    otherCards.forEach(c => {
        rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
        suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    });

    const handSize = handCards.length;

    if (handSize === 3) {
        resolveThreeCardWild(wildCard, otherCards, rankCounts);
    } else if (handSize >= 6) {
        resolveLargeHandWild(wildCard, otherCards, rankCounts, suitCounts, handSize);
    } else {
        resolveFiveCardWild(wildCard, otherCards, rankCounts, suitCounts);
    }
}

/**
 * Resolve wild for 3-card front hand.
 * Priority: Trips → Pair → High Card
 */
function resolveThreeCardWild(wildCard, otherCards, rankCounts) {
    // Trips (2 of same rank)
    const tripsCandidate = Object.entries(rankCounts)
        .filter(([rank, count]) => count >= 2)
        .sort((a, b) => (RANK_VALUES[b[0]] || 0) - (RANK_VALUES[a[0]] || 0))[0];

    if (tripsCandidate) {
        console.log(`🃏 resolveWildInHand [3-card]: trips → ${tripsCandidate[0]}♠`);
        assignWildCard(wildCard, tripsCandidate[0], '♠');
        return;
    }

    // Pair (highest rank present)
    const pairCandidate = Object.entries(rankCounts)
        .sort((a, b) => (RANK_VALUES[b[0]] || 0) - (RANK_VALUES[a[0]] || 0))[0];

    if (pairCandidate) {
        console.log(`🃏 resolveWildInHand [3-card]: pair → ${pairCandidate[0]}♠`);
        assignWildCard(wildCard, pairCandidate[0], '♠');
        return;
    }

    // Fallback
    const highestRank = [...otherCards].sort((a, b) => b.value - a.value)[0]?.rank || 'A';
    console.log(`🃏 resolveWildInHand [3-card]: fallback → ${highestRank}♠`);
    assignWildCard(wildCard, highestRank, '♠');
}

/**
 * Resolve wild for 6, 7, 8 card hands.
 * Checks n-of-a-kind and n-card SF from largest down, then falls to 5-card logic.
 */
function resolveLargeHandWild(wildCard, otherCards, rankCounts, suitCounts, handSize) {
    // Check from largest possible hand down to 6
    for (let n = handSize; n >= 6; n--) {
        // n of a Kind: need n-1 same rank
        const nKindCandidate = Object.entries(rankCounts)
            .filter(([rank, count]) => count >= n - 1)
            .sort((a, b) => (RANK_VALUES[b[0]] || 0) - (RANK_VALUES[a[0]] || 0))[0];

        if (nKindCandidate) {
            console.log(`🃏 resolveWildInHand [${handSize}-card]: ${n}-of-a-kind → ${nKindCandidate[0]}♠`);
            assignWildCard(wildCard, nKindCandidate[0], '♠');
            return;
        }

        // n-card SF: need n-1 same suit consecutive (wild fills highest gap)
        const nSFResult = findNCardStraightFlushCompletion(otherCards, suitCounts, n);
        if (nSFResult) {
            console.log(`🃏 resolveWildInHand [${handSize}-card]: ${n}-card SF → ${nSFResult.rank}${nSFResult.suit}`);
            assignWildCard(wildCard, nSFResult.rank, nSFResult.suit);
            return;
        }
    }

    // Fall through to 5-card logic
    resolveFiveCardWild(wildCard, otherCards, rankCounts, suitCounts);
}

/**
 * Resolve wild for 5-card hand (also used as fallback for larger hands).
 * Priority: SF → 4K → Full House → Flush → Straight → Trips → Pair → High Card
 */
function resolveFiveCardWild(wildCard, otherCards, rankCounts, suitCounts) {
    // 1. Straight Flush
    const sfResult = findNCardStraightFlushCompletion(otherCards, suitCounts, 5);
    if (sfResult) {
        console.log(`🃏 resolveWildInHand [5-card]: straight flush → ${sfResult.rank}${sfResult.suit}`);
        assignWildCard(wildCard, sfResult.rank, sfResult.suit);
        return;
    }

    // 2. Four of a Kind (3 of same rank)
    const quadCandidate = Object.entries(rankCounts)
        .filter(([rank, count]) => count >= 3)
        .sort((a, b) => (RANK_VALUES[b[0]] || 0) - (RANK_VALUES[a[0]] || 0))[0];

    if (quadCandidate) {
        console.log(`🃏 resolveWildInHand [5-card]: four of a kind → ${quadCandidate[0]}♠`);
        assignWildCard(wildCard, quadCandidate[0], '♠');
        return;
    }

    // 3. Full House
    const fullHouseResult = findFullHouseCompletion(rankCounts);
    if (fullHouseResult) {
        console.log(`🃏 resolveWildInHand [5-card]: full house → ${fullHouseResult}♠`);
        assignWildCard(wildCard, fullHouseResult, '♠');
        return;
    }

    // 4. Flush (4 same suit)
    const flushSuit = Object.entries(suitCounts).find(([suit, count]) => count >= 4);
    if (flushSuit) {
        const suit = flushSuit[0];
        const highestRank = [...otherCards].sort((a, b) => b.value - a.value)[0]?.rank || 'A';
        console.log(`🃏 resolveWildInHand [5-card]: flush → ${highestRank}${suit}`);
        assignWildCard(wildCard, highestRank, suit);
        return;
    }

    // 5. Straight (4 consecutive)
    const values = otherCards.map(c => c.value);
    const straightResult = findBestStraightCompletion(values, 5);
    if (straightResult) {
        console.log(`🃏 resolveWildInHand [5-card]: straight → ${straightResult}♠`);
        assignWildCard(wildCard, straightResult, '♠');
        return;
    }

    // 6. Trips (2 of same rank)
    const tripsCandidate = Object.entries(rankCounts)
        .filter(([rank, count]) => count >= 2)
        .sort((a, b) => (RANK_VALUES[b[0]] || 0) - (RANK_VALUES[a[0]] || 0))[0];

    if (tripsCandidate) {
        console.log(`🃏 resolveWildInHand [5-card]: trips → ${tripsCandidate[0]}♠`);
        assignWildCard(wildCard, tripsCandidate[0], '♠');
        return;
    }

    // 7. Pair (highest rank)
    const pairCandidate = Object.entries(rankCounts)
        .sort((a, b) => (RANK_VALUES[b[0]] || 0) - (RANK_VALUES[a[0]] || 0))[0];

    if (pairCandidate) {
        console.log(`🃏 resolveWildInHand [5-card]: pair → ${pairCandidate[0]}♠`);
        assignWildCard(wildCard, pairCandidate[0], '♠');
        return;
    }

    // 8. Fallback
    const highestRank = [...otherCards].sort((a, b) => b.value - a.value)[0]?.rank || 'A';
    console.log(`🃏 resolveWildInHand [5-card]: fallback → ${highestRank}♠`);
    assignWildCard(wildCard, highestRank, '♠');
}

/**
 * Find best straight flush completion for an n-card hand.
 * Needs n-1 same-suit cards with one gap; wild fills highest possible missing rank.
 * Returns {rank, suit} or null.
 */
function findNCardStraightFlushCompletion(otherCards, suitCounts, n) {
    const neededSuitCount = n - 1;
    const flushSuitEntry = Object.entries(suitCounts)
        .find(([suit, count]) => count >= neededSuitCount);

    if (!flushSuitEntry) return null;

    const flushSuit = flushSuitEntry[0];
    const suitedCards = otherCards.filter(c => c.suit === flushSuit);
    if (suitedCards.length < neededSuitCount) return null;

    const suitedValues = suitedCards.map(c => c.value);
    const missingRank = findBestStraightCompletion(suitedValues, n);
    if (!missingRank) return null;

    return { rank: missingRank, suit: flushSuit };
}

/**
 * Find the BEST (highest value) missing rank to complete an n-card straight.
 * Always maximizes the value of the wild card assigned.
 * Returns rank string or null.
 */
function findBestStraightCompletion(values, n) {
    const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
    if (uniqueValues.length < n - 1) return null;

    const neededNaturals = n - 1;
    let bestMissingValue = null;

    // Try each possible n-card straight window, collect all valid completions
    for (let high = 14; high >= n; high--) {
        const window = [];
        for (let i = 0; i < n; i++) window.push(high - i);

        const missing = window.filter(v => !uniqueValues.includes(v));
        const present = window.filter(v => uniqueValues.includes(v));

        if (missing.length === 1 && present.length >= neededNaturals) {
            // Pick highest missing value across all valid windows
            if (bestMissingValue === null || missing[0] > bestMissingValue) {
                bestMissingValue = missing[0];
            }
        }
    }

    // Check wheel (A-2-3-4-5) for 5-card hands
    if (n === 5) {
        const wheelWindow = [14, 5, 4, 3, 2];
        const wheelMissing = wheelWindow.filter(v => !uniqueValues.includes(v));
        const wheelPresent = wheelWindow.filter(v => uniqueValues.includes(v));
        if (wheelMissing.length === 1 && wheelPresent.length >= neededNaturals) {
            if (bestMissingValue === null || wheelMissing[0] > bestMissingValue) {
                bestMissingValue = wheelMissing[0];
            }
        }
    }

    return bestMissingValue ? numericRankToString(bestMissingValue) : null;
}

/**
 * Find rank wild should complete for a full house.
 * Two pairs present → wild becomes trips of higher pair.
 * Trips + pair present → wild joins trips rank.
 * Returns rank string or null.
 */
function findFullHouseCompletion(rankCounts) {
    const trips = Object.entries(rankCounts)
        .filter(([rank, count]) => count >= 3)
        .sort((a, b) => (RANK_VALUES[b[0]] || 0) - (RANK_VALUES[a[0]] || 0));

    const pairs = Object.entries(rankCounts)
        .filter(([rank, count]) => count >= 2)
        .sort((a, b) => (RANK_VALUES[b[0]] || 0) - (RANK_VALUES[a[0]] || 0));

    // Trips + pair present — wild joins trips
    if (trips.length >= 1 && pairs.length >= 2) {
        const pairRank = pairs.find(([rank]) => rank !== trips[0][0]);
        if (pairRank) return trips[0][0];
    }

    // Two pairs — wild becomes trips of higher pair
    if (pairs.length >= 2) {
        return pairs[0][0];
    }

    return null;
}

window.resolveWildInHand = resolveWildInHand;
