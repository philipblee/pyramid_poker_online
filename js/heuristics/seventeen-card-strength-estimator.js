// js/heuristics/seventeen-card-hand-strength-estimator.js
// Converted from Python claude_13_card_analyzer.py
// Adapted for 17-card Pyramid Poker hands with wild card support

/**
 * Main function: Calculate heuristic strength score for 17-card hand
 * @param {Array} cards - Array of card objects {id, rank, suit, value, isWild}
 * @param {Object} gameVariant - Game variant configuration (optional)
 * @returns {Object} - Strength analysis and score
 */
function seventeenCardHandStrengthEstimator(cards, gameVariant = {}) {
    // Validate input
    if (!cards || cards.length !== 17) {
        throw new Error(`Expected 17 cards, got ${cards?.length || 0}`);
    }

    // Analyze hand strength
    const analysis = analyzeSeventeenCardStrength(cards);

    // Calculate heuristic score
    const score = calculateHandScore(analysis);

    // Determine arrangement complexity
    const complexity = estimateArrangementComplexity(analysis);

    return {
        analysis,
        score,
        complexity,
        wildCardPower: analysis.wildCardPower,
        confidenceLevel: calculateConfidenceLevel(analysis, score),
        expectedStrategy: determineOptimalStrategy(analysis)
    };
}

/**
 * Analyze the strength components of a 17-card hand
 * @param {Array} cards - Array of card objects
 * @returns {Object} - Detailed hand analysis
 */
function analyzeSeventeenCardStrength(cards) {
    // Separate wild cards from natural cards
    const naturalCards = cards.filter(card => !card.isWild);
    const wildCards = cards.filter(card => card.isWild);
    const wildCount = wildCards.length;

    // Convert to internal format for analysis
    const analysisCards = naturalCards.map(card => ({
        rank: card.value === 1 ? 14 : card.value, // Convert Ace to 14 for easier analysis
        suit: card.suit,
        originalValue: card.value
    }));

    // Count ranks and suits
    const rankCounts = {};
    const suitCounts = {};

    analysisCards.forEach(card => {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });

    const analysis = {
        // Made hands (actual complete hands in 17 cards)
        pairs: 0,
        trips: 0,
        quads: 0,
        pentas: 0,
        madeStrights: 0,
        madeFlushes: 0,
        madeStraightFlushes: 0,

        // Made hand details
        tripsRanks: [],
        pairsRanks: [],
        quadsRanks: [],
        pentaRanks: [],
        madeStrightRanks: [],
        madeFlushSuits: [],
        madeSFDetails: [],

        // Potential hands (could be completed with arrangement)
        straightPotential: 0,
        flushPotential: 0,
        straightFlushPotentialOpen: 0,
        straightFlushPotentialGap: 0,
        tripsPotential: 0,
        quadsPotential: 0,
        pentasPotential: 0,

        // Raw statistics
        maxFlushLength: Math.max(...Object.values(suitCounts)),
        highCards: analysisCards.filter(card => card.rank >= 10).length,
        connectedSuits: analyzeSuitedConnectors(analysisCards),
        rankDistribution: rankCounts,
        suitDistribution: suitCounts,

        // Wild card assessment
        wildCount: wildCount,
        wildCardPower: calculateWildCardPower(wildCount, rankCounts, suitCounts),

        // 17-card specific metrics
        totalCards: 17,
        naturalCards: naturalCards.length,
        arrangementFlexibility: calculateArrangementFlexibility(rankCounts, suitCounts, wildCount)
    };

    // Analyze made hands
    Object.entries(rankCounts).forEach(([rank, count]) => {
        rank = parseInt(rank);
        if (count === 2) {
            analysis.pairs += 1;
            analysis.pairsRanks.push(rank);
            analysis.tripsPotential += 1;
        } else if (count === 3) {
            analysis.trips += 1;
            analysis.tripsRanks.push(rank);
            analysis.quadsPotential += 1;
        } else if (count === 4) {
            analysis.quads += 1;
            analysis.quadsRanks.push(rank);
            analysis.pentasPotential += 1;
        } else if (count >= 5) {
            analysis.pentas += 1;
            analysis.pentaRanks.push(rank);
        }
    });

    // Analyze made straights (5+ consecutive cards)
    analysis.madeStrights = countMadeStraights(analysisCards);

    // Analyze made flushes (5+ cards same suit)
    Object.entries(suitCounts).forEach(([suit, count]) => {
        if (count >= 5) {
            analysis.madeFlushes += 1;
            analysis.madeFlushSuits.push(suit);
        }
    });

    // Analyze made straight flushes
    const sfAnalysis = analyzeStraightFlushes(analysisCards);
    analysis.madeStraightFlushes = sfAnalysis.madeCount;
    analysis.madeSFDetails = sfAnalysis.madeDetails;
    analysis.straightFlushPotentialOpen = sfAnalysis.openPotential;
    analysis.straightFlushPotentialGap = sfAnalysis.gapPotential;

    // Analyze straight potential (4-card sequences that could become straights)
    analysis.straightPotential = countStraightPotential(analysisCards);

    // Analyze flush potential (4-card same-suit sequences)
    Object.entries(suitCounts).forEach(([suit, count]) => {
        if (count === 4) {
            analysis.flushPotential += 1;
        }
    });

    return analysis;
}

/**
 * Calculate wild card power based on hand context
 * @param {number} wildCount - Number of wild cards
 * @param {Object} rankCounts - Count of each rank
 * @param {Object} suitCounts - Count of each suit
 * @returns {number} - Wild card power score
 */
function calculateWildCardPower(wildCount, rankCounts, suitCounts) {
    if (wildCount === 0) return 0;

    let wildPower = 0;

    // Progressive wild card value (1 wild = 10, 2 wilds = 35 total)
    if (wildCount >= 1) wildPower += 50;  // First wild = 10 points
    if (wildCount >= 2) wildPower += 100; // Second wild = 25 more points

    // Synergy bonuses based on existing cards

    // Pair completion potential (wild can make trips, quads, etc.)
    Object.values(rankCounts).forEach(count => {
        if (count === 1) wildPower += 2; // Can make pair
        if (count === 2) wildPower += 8; // Can make trips
        if (count === 3) wildPower += 15; // Can make quads
        if (count >= 4) wildPower += 25; // Can make pentas
    });

    // Flush completion potential
    Object.values(suitCounts).forEach(count => {
        if (count === 4) wildPower += 12; // One away from flush
        if (count === 3) wildPower += 6; // Two away from flush
        if (count >= 5) wildPower += 8; // Can improve existing flush
    });

    // Straight completion potential (simplified)
    const uniqueRanks = Object.keys(rankCounts).length;
    if (uniqueRanks >= 4) {
        wildPower += 10; // Likely can help with straights
    }

    // Multiple wild synergy
    if (wildCount >= 2) {
        wildPower += wildCount * 5; // Bonus for multiple wilds
    }

    return Math.round(wildPower);
}

/**
 * Calculate arrangement flexibility based on card distribution
 */
function calculateArrangementFlexibility(rankCounts, suitCounts, wildCount) {
    let flexibility = 0;

    // More unique ranks = more arrangement options
    flexibility += Object.keys(rankCounts).length * 2;

    // Balanced suit distribution = more flush options
    const suitBalance = 4 - Math.abs(4 - Object.keys(suitCounts).length);
    flexibility += suitBalance * 3;

    // Wild cards dramatically increase flexibility
    flexibility += wildCount * 15;

    // Multiple of same rank = more positional options
    Object.values(rankCounts).forEach(count => {
        if (count >= 2) flexibility += count * 2;
    });

    return Math.round(flexibility);
}

/**
 * Calculate the overall hand strength score (adapted from Python)
 * @param {Object} analysis - Hand analysis object
 * @returns {number} - Heuristic strength score
 */
function calculateHandScore(analysis) {
    let score = 0.0;

    // PREMIUM SINGLE ARRANGEMENTS

    // Made straight flushes (going to back, very strong)
    score += analysis.madeStraightFlushes * 200.0;

    // Pentas (going to back, strong)
    score += analysis.pentas * 240;

    // Quads (going to back, strong)
    score += analysis.quads * 160;

    // Multiple trips (can build multiple full houses)
    if (analysis.trips >= 3) {
        score += 50.0; // Three trips - can build strong across all positions
    } else if (analysis.trips === 2) {
        score += 35.0; // Two trips - strong middle/back potential
    }

    // Single premium trips (back hand material)
    analysis.tripsRanks.forEach(tripRank => {
        if (tripRank === 14) { // Aces (converted to 14)
            score += 15.0;
        } else if (tripRank >= 12) { // Kings/Queens
            score += 12.0;
        } else if (tripRank >= 10) { // Jacks/Tens
            score += 10.0;
        } else if (tripRank >= 7) { // 7,8,9
            score += 8.0;
        } else { // Low trips (2-6)
            score += 4.0;
        }
    });

    // STRONG SUPPORTING HANDS

    // Many pairs (full house potential, strong middle/back)
    const premiumPairs = analysis.pairsRanks.filter(rank => rank >= 11 || rank === 14).length;
    const mediumPairs = analysis.pairsRanks.filter(rank => rank >= 8 && rank <= 10).length;
    const lowPairs = analysis.pairs - premiumPairs - mediumPairs;

//    score += premiumPairs * 3.0;
//    score += mediumPairs * 2.0;
//    score += lowPairs * 1.0;

    // Multiple pairs synergy (can build across positions)
//    if (analysis.pairs >= 5) {
//        score += 15.0; // Many pairs - good flexibility
//    } else if (analysis.pairs === 4) {
//        score += 8.0;
//    } else if (analysis.pairs === 3) {
//        score += 4.0;
//    }

    // Single made hands (likely going to back)
    score += analysis.madeStrights * 12.0;
    score += analysis.madeFlushes * 10.0;

    // POTENTIAL IMPROVEMENTS (modest value)

    // Single flush potential
    if (analysis.maxFlushLength >= 7) {
        score += 8.0; // Very likely to complete
    } else if (analysis.maxFlushLength >= 6) {
        score += 5.0; // Good chance
    } else if (analysis.flushPotential > 0) {
        score += 3.0; // Possible
    }

    // Single straight potential
//    score += analysis.straightPotential * 4.0;

    // Straight flush potential (premium back hand)
//    score += analysis.straightFlushPotentialOpen * 8.0;
//    score += analysis.straightFlushPotentialGap * 5.0;

    // SYNERGY BONUSES

    // Trip + multiple pairs (full house opportunities)
    if (analysis.trips >= 1 && analysis.pairs >= 2) {
        score += 100.0;
    }

    // Multiple drawing opportunities
//    if (analysis.straightPotential >= 1 && analysis.flushPotential >= 1) {
//        score += 5.0;
//    }

    // WILD CARD POWER (Major addition for 17-card game)
    score += analysis.wildCardPower;

    // 17-CARD SPECIFIC BONUSES

    // More cards = more arrangement options
//    score += analysis.arrangementFlexibility * 0.5;
//
//    // Bonus for having many different hand types available
//    const handTypeDiversity = (analysis.pairs > 0 ? 1 : 0) +
//                             (analysis.trips > 0 ? 1 : 0) +
//                             (analysis.madeFlushes > 0 ? 1 : 0) +
//                             (analysis.madeStrights > 0 ? 1 : 0);
//    score += handTypeDiversity * 3.0;

    return Math.round(score * 10) / 10; // Round to 1 decimal place
}

/**
 * Estimate arrangement complexity level
 */
function estimateArrangementComplexity(analysis) {
    // Multiple strong hands = high complexity
    const strongHands = analysis.trips + analysis.quads + analysis.pentas +
                       analysis.madeFlushes + analysis.madeStrights + analysis.madeStraightFlushes;

    if (strongHands >= 3) return "HIGH";
    if (strongHands >= 2) return "MEDIUM";
    if (analysis.wildCount >= 1) return "MEDIUM";
    if (analysis.pairs >= 4) return "MEDIUM";
    return "LOW";
}

/**
 * Calculate confidence level in the heuristic prediction
 */
function calculateConfidenceLevel(analysis, score) {
    let confidence = 0.5; // Base confidence

    // High confidence cases
    if (analysis.madeStraightFlushes > 0 || analysis.pentas > 0) confidence = 0.95;
    else if (analysis.quads > 0 || analysis.trips >= 3) confidence = 0.90;
    else if (score >= 100) confidence = 0.85;
    else if (score >= 50) confidence = 0.75;
    else if (score >= 25) confidence = 0.65;

    // Reduce confidence for complex cases
    if (analysis.wildCount >= 2) confidence *= 0.8;
    if (estimateArrangementComplexity(analysis) === "HIGH") confidence *= 0.7;

    return Math.round(confidence * 100) / 100;
}

/**
 * Determine optimal strategy based on hand analysis
 */
function determineOptimalStrategy(analysis) {
    if (analysis.madeStraightFlushes > 0) return "SF_PREMIUM_FRONT";
    if (analysis.quads > 0) return "QUADS_PREMIUM_FRONT";
    if (analysis.trips >= 3) return "MULTIPLE_TRIPS_SPREAD";
    if (analysis.madeFlushes >= 2) return "MULTIPLE_FLUSHES";
    if (analysis.madeStrights >= 2) return "MULTIPLE_STRAIGHTS";
    if (analysis.trips >= 1 && analysis.pairs >= 2) return "FULLHOUSE_TARGET";
    if (analysis.wildCount >= 2) return "WILD_OPTIMIZATION";
    return "STANDARD_ARRANGEMENT";
}

// Helper functions (converted from Python)

function countMadeStraights(cards) {
    const ranks = [...new Set(cards.map(card => card.rank))].sort((a, b) => a - b);

    let straights = 0;
    let i = 0;

    while (i < ranks.length) {
        let consecutive = 1;
        const startIdx = i;

        // Count consecutive sequence
        while (i + 1 < ranks.length && ranks[i + 1] === ranks[i] + 1) {
            consecutive++;
            i++;
        }

        // Check if we have a 5+ card straight
        if (consecutive >= 5) {
            straights++;
        }

        i++;
    }

    // Special cases: A-2-3-4-5 (wheel) and 10-J-Q-K-A (broadway)
    const rankSet = new Set(ranks);
    if (rankSet.has(14) && [2, 3, 4, 5].every(r => rankSet.has(r))) straights++;
    if (rankSet.has(14) && [10, 11, 12, 13].every(r => rankSet.has(r))) straights++;

    return straights;
}

function analyzeStraightFlushes(cards) {
    // Group cards by suit
    const suitedCards = {};
    cards.forEach(card => {
        if (!suitedCards[card.suit]) suitedCards[card.suit] = [];
        suitedCards[card.suit].push(card.rank);
    });

    let madeCount = 0;
    let madeDetails = [];
    let openPotential = 0;
    let gapPotential = 0;

    Object.entries(suitedCards).forEach(([suit, ranks]) => {
        if (ranks.length < 4) return;

        ranks = [...new Set(ranks)].sort((a, b) => a - b);

        // Check for made straight flushes
        const sfMade = findMadeSFInSuit(ranks, suit);
        madeCount += sfMade.count;
        madeDetails.push(...sfMade.details);

        // Check for straight flush potential
        if (ranks.length >= 4) {
            const sfPotential = findSFPotentialInSuit(ranks, suit);
            openPotential += sfPotential.open;
            gapPotential += sfPotential.gap;
        }
    });

    return { madeCount, madeDetails, openPotential, gapPotential };
}

function findMadeSFInSuit(ranks, suit) {
    // Simplified implementation - counts 5+ consecutive cards in suit
    let count = 0;
    let details = [];

    for (let i = 0; i <= ranks.length - 5; i++) {
        let consecutive = 1;
        let j = i;

        while (j + 1 < ranks.length && ranks[j + 1] === ranks[j] + 1) {
            consecutive++;
            j++;
        }

        if (consecutive >= 5) {
            count++;
            details.push({
                suit,
                lowRank: ranks[i],
                highRank: ranks[j],
                length: consecutive
            });
            i = j; // Skip past this straight flush
        }
    }

    return { count, details };
}

function findSFPotentialInSuit(ranks, suit) {
    // Simplified - look for 4-card sequences with gaps
    let open = 0;
    let gap = 0;

    // This is a simplified implementation
    // In a full version, you'd analyze all possible 4-card combinations
    if (ranks.length >= 4) {
        // Basic heuristic: if we have 4+ cards in suit, assume some SF potential
        if (ranks.length >= 6) open++; // Strong potential
        else if (ranks.length === 5) gap++; // Moderate potential
    }

    return { open, gap };
}

function countStraightPotential(cards) {
    // Simplified implementation counting potential 4-card sequences
    const ranks = [...new Set(cards.map(card => card.rank))].sort((a, b) => a - b);
    let potential = 0;

    // Look for 4-card consecutive sequences
    for (let i = 0; i <= ranks.length - 4; i++) {
        if (ranks[i + 1] === ranks[i] + 1 &&
            ranks[i + 2] === ranks[i] + 2 &&
            ranks[i + 3] === ranks[i] + 3) {
            potential++;
        }
    }

    return potential;
}

function analyzeSuitedConnectors(cards) {
    // Group by suit and count consecutive sequences
    const suitedGroups = {};
    cards.forEach(card => {
        if (!suitedGroups[card.suit]) suitedGroups[card.suit] = [];
        suitedGroups[card.suit].push(card.rank);
    });

    let connectedSuits = 0;
    Object.values(suitedGroups).forEach(ranks => {
        if (ranks.length >= 4) {
            ranks.sort((a, b) => a - b);
            let consecutive = 1;
            for (let i = 1; i < ranks.length; i++) {
                if (ranks[i] === ranks[i - 1] + 1) {
                    consecutive++;
                } else {
                    if (consecutive >= 3) connectedSuits++;
                    consecutive = 1;
                }
            }
            if (consecutive >= 3) connectedSuits++;
        }
    });

    return connectedSuits;
}

// Make functions globally available for browser
window.seventeenCardHandStrengthEstimator = seventeenCardHandStrengthEstimator;