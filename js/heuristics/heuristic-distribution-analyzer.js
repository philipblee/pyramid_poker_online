// js/heuristics/heuristic-distribution-analyzer.js
// Analyze score distribution of seventeen-card-strength-estimator across 100,000 hands

/**
 * Analyze heuristic score distribution to establish hand strength bands
 * @param {number} numHands - Number of hands to analyze (default 100,000)
 * @returns {Object} - Complete distribution analysis
 */
function heuristicDistributionAnalyzer(numHands = 100000) {
    console.log(`Starting heuristic distribution analysis with ${numHands.toLocaleString()} hands...`);

    const results = {
        hands: [],
        statistics: {
            total: 0,
            withWilds: 0,
            withoutWilds: 0,
            scores: {
                min: Infinity,
                max: -Infinity,
                sum: 0,
                average: 0
            },
            wildCardStats: {
                zeroWilds: { count: 0, avgScore: 0, scores: [] },
                oneWild: { count: 0, avgScore: 0, scores: [] },
                twoWilds: { count: 0, avgScore: 0, scores: [] }
            }
        },
        bands: {},
        examples: {
            elite: [],
            strong: [],
            average: [],
            weak: [],
            horrible: []
        }
    };

    // Generate and analyze hands
    for (let i = 0; i < numHands; i++) {
        if (i % 10000 === 0) {
            console.log(`Progress: ${i.toLocaleString()}/${numHands.toLocaleString()} (${Math.round(i/numHands*100)}%)`);
        }

        try {
            const hand = generateRandomSeventeenCardHand();
            const analysis = seventeenCardHandStrengthEstimator(hand.cards);

            const handResult = {
                id: i + 1,
                cards: hand.cards,
                wildCount: hand.wildCount,
                heuristicScore: analysis.score,
                complexity: analysis.complexity,
                strategy: analysis.expectedStrategy,
                confidence: analysis.confidenceLevel,
                analysis: analysis.analysis,
                description: describeHandBriefly(analysis.analysis)
            };

            results.hands.push(handResult);
            updateRunningStatistics(results.statistics, handResult);

        } catch (error) {
            console.warn(`Hand ${i + 1} failed:`, error.message);
        }
    }

    // Calculate final statistics
    calculateFinalStatistics(results);

    // Establish score bands
    establishScoreBands(results);

    // Collect examples for each band
    collectBandExamples(results);

    // Generate comprehensive report
    generateDistributionReport(results);

    return results;
}

/**
 * Generate a random 17-card hand
 */
function generateRandomSeventeenCardHand() {
    const suits = ['♠', '♥', '♦', '♣'];
    const deck = [];

    // Create double deck + 2 wilds (106 total cards)
    suits.forEach(suit => {
        for (let value = 1; value <= 13; value++) {
            // First copy
            deck.push({
                id: `${value}${suit}_1`,
                rank: value === 1 ? 'A' : (value <= 10 ? value.toString() : ['J', 'Q', 'K'][value - 11]),
                suit: suit,
                value: value,
                isWild: false
            });
            // Second copy
            deck.push({
                id: `${value}${suit}_2`,
                rank: value === 1 ? 'A' : (value <= 10 ? value.toString() : ['J', 'Q', 'K'][value - 11]),
                suit: suit,
                value: value,
                isWild: false
            });
        }
    });

    // Add 2 wild cards
    deck.push({
        id: 'WILD_1',
        rank: 'W',
        suit: 'W',
        value: 0,
        isWild: true
    });
    deck.push({
        id: 'WILD_2',
        rank: 'W',
        suit: 'W',
        value: 0,
        isWild: true
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Deal 17 cards
    const cards = deck.slice(0, 17);
    const wildCount = cards.filter(c => c.isWild).length;

    return { cards, wildCount };
}

/**
 * Update running statistics as we process hands
 */
function updateRunningStatistics(stats, handResult) {
    stats.total++;

    const score = handResult.heuristicScore;
    const wildCount = handResult.wildCount;

    // Overall score stats
    stats.scores.min = Math.min(stats.scores.min, score);
    stats.scores.max = Math.max(stats.scores.max, score);
    stats.scores.sum += score;

    // Wild card categorization
    if (wildCount > 0) {
        stats.withWilds++;
    } else {
        stats.withoutWilds++;
    }

    // Detailed wild card stats
    const wildKey = wildCount === 0 ? 'zeroWilds' :
                   wildCount === 1 ? 'oneWild' : 'twoWilds';

    if (stats.wildCardStats[wildKey]) {
        stats.wildCardStats[wildKey].count++;
        stats.wildCardStats[wildKey].scores.push(score);
    }
}

/**
 * Calculate final statistics after all hands processed
 */
function calculateFinalStatistics(results) {
    const stats = results.statistics;

    // Calculate averages
    stats.scores.average = stats.scores.sum / stats.total;

    // Calculate wild card averages
    Object.keys(stats.wildCardStats).forEach(key => {
        const wildStats = stats.wildCardStats[key];
        if (wildStats.count > 0) {
            wildStats.avgScore = wildStats.scores.reduce((a, b) => a + b, 0) / wildStats.count;

            // Calculate percentiles for this wild count category
            wildStats.scores.sort((a, b) => a - b);
            wildStats.percentiles = {
                p10: wildStats.scores[Math.floor(wildStats.count * 0.1)],
                p25: wildStats.scores[Math.floor(wildStats.count * 0.25)],
                p50: wildStats.scores[Math.floor(wildStats.count * 0.5)],
                p75: wildStats.scores[Math.floor(wildStats.count * 0.75)],
                p90: wildStats.scores[Math.floor(wildStats.count * 0.9)]
            };
        }
    });
}

/**
 * Establish score bands based on percentiles
 */
function establishScoreBands(results) {
    // Sort all hands by score
    const sortedHands = [...results.hands].sort((a, b) => b.heuristicScore - a.heuristicScore);
    const total = sortedHands.length;

    // Define band boundaries based on percentiles
    results.bands = {
        ELITE: {
            threshold: sortedHands[Math.floor(total * 0.05)].heuristicScore, // Top 5%
            count: Math.floor(total * 0.05),
            percentage: 5,
            description: "Top 5% of hands - Multiple premium arrangements possible"
        },
        STRONG: {
            threshold: sortedHands[Math.floor(total * 0.20)].heuristicScore, // Top 20%
            count: Math.floor(total * 0.15), // 20% - 5% = 15%
            percentage: 15,
            description: "Strong hands with solid arrangement options"
        },
        AVERAGE: {
            threshold: sortedHands[Math.floor(total * 0.70)].heuristicScore, // Top 70%
            count: Math.floor(total * 0.50), // 70% - 20% = 50%
            percentage: 50,
            description: "Average hands requiring strategic arrangement"
        },
        WEAK: {
            threshold: sortedHands[Math.floor(total * 0.90)].heuristicScore, // Top 90%
            count: Math.floor(total * 0.20), // 90% - 70% = 20%
            percentage: 20,
            description: "Weak hands with limited arrangement options"
        },
        HORRIBLE: {
            threshold: 0, // Bottom 10%
            count: Math.floor(total * 0.10),
            percentage: 10,
            description: "Bottom 10% - Very limited scoring potential"
        }
    };

    // Add score ranges for display
    const bandKeys = ['ELITE', 'STRONG', 'AVERAGE', 'WEAK', 'HORRIBLE'];
    for (let i = 0; i < bandKeys.length; i++) {
        const band = results.bands[bandKeys[i]];
        const nextBand = i < bandKeys.length - 1 ? results.bands[bandKeys[i + 1]] : null;

        band.scoreRange = {
            min: nextBand ? nextBand.threshold + 0.1 : results.statistics.scores.min,
            max: band.threshold
        };
    }
}

/**
 * Collect example hands for each band
 */
function collectBandExamples(results) {
    const bands = ['ELITE', 'STRONG', 'AVERAGE', 'WEAK', 'HORRIBLE'];

    bands.forEach(bandName => {
        const band = results.bands[bandName];
        const examples = results.hands.filter(hand => {
            return hand.heuristicScore >= band.scoreRange.min &&
                   hand.heuristicScore <= band.scoreRange.max;
        });

        // Take diverse examples (different wild counts, strategies)
        results.examples[bandName.toLowerCase()] = selectDiverseExamples(examples, 10);
    });
}

/**
 * Select diverse examples from a band
 */
function selectDiverseExamples(hands, maxExamples) {
    if (hands.length <= maxExamples) return hands;

    // Try to get mix of wild counts and strategies
    const byWildCount = {
        0: hands.filter(h => h.wildCount === 0),
        1: hands.filter(h => h.wildCount === 1),
        2: hands.filter(h => h.wildCount === 2)
    };

    const examples = [];
    const targetPerWildCount = Math.ceil(maxExamples / 3);

    // Get examples from each wild count category
    Object.values(byWildCount).forEach(wildHands => {
        const selected = wildHands.slice(0, targetPerWildCount);
        examples.push(...selected);
    });

    return examples.slice(0, maxExamples);
}

/**
 * Generate comprehensive distribution report
 */
function generateDistributionReport(results) {
    console.log('\n' + '='.repeat(70));
    console.log('HEURISTIC SCORE DISTRIBUTION ANALYSIS');
    console.log('='.repeat(70));

    const stats = results.statistics;

    console.log(`\nOVERALL STATISTICS:`);
    console.log(`   Total hands analyzed: ${stats.total.toLocaleString()}`);
    console.log(`   Score range: ${stats.scores.min.toFixed(1)} to ${stats.scores.max.toFixed(1)}`);
    console.log(`   Average score: ${stats.scores.average.toFixed(2)}`);
    console.log(`   Hands with wilds: ${stats.withWilds.toLocaleString()} (${(stats.withWilds/stats.total*100).toFixed(1)}%)`);
    console.log(`   Hands without wilds: ${stats.withoutWilds.toLocaleString()} (${(stats.withoutWilds/stats.total*100).toFixed(1)}%)`);

    console.log(`\nWILD CARD IMPACT:`);
    Object.entries(stats.wildCardStats).forEach(([key, wildStats]) => {
        if (wildStats.count > 0) {
            const wildLabel = key === 'zeroWilds' ? '0 wilds' :
                             key === 'oneWild' ? '1 wild' : '2 wilds';
            console.log(`   ${wildLabel}: ${wildStats.count.toLocaleString()} hands, avg score ${wildStats.avgScore.toFixed(2)}`);
            if (wildStats.percentiles) {
                console.log(`     Percentiles: 10th=${wildStats.percentiles.p10.toFixed(1)}, 50th=${wildStats.percentiles.p50.toFixed(1)}, 90th=${wildStats.percentiles.p90.toFixed(1)}`);
            }
        }
    });

    console.log(`\nSTRENGTH BANDS:`);
    Object.entries(results.bands).forEach(([name, band]) => {
        console.log(`   ${name}: ${band.scoreRange.min.toFixed(1)}+ points (${band.percentage}% of hands)`);
        console.log(`     ${band.description}`);
        console.log(`     Threshold: ${band.threshold.toFixed(1)} points`);
    });

    // Show examples from each band
    showBandExamples(results);

    return results;
}

/**
 * Show example hands from each strength band
 */
function showBandExamples(results) {
    const bandNames = ['ELITE', 'STRONG', 'AVERAGE', 'WEAK', 'HORRIBLE'];

    bandNames.forEach(bandName => {
        const examples = results.examples[bandName.toLowerCase()];
        if (examples && examples.length > 0) {
            console.log(`\n${bandName} BAND EXAMPLES:`);

            examples.slice(0, 5).forEach((hand, i) => {
                console.log(`   ${i + 1}. Score ${hand.heuristicScore.toFixed(1)} (${hand.wildCount} wilds):`);
                console.log(`      ${hand.description}`);
                console.log(`      Strategy: ${hand.strategy}, Complexity: ${hand.complexity}`);
            });
        }
    });
}

/**
 * Create brief description of hand
 */
function describeHandBriefly(analysis) {
    const parts = [];

    if (analysis.madeStraightFlushes > 0) parts.push(`${analysis.madeStraightFlushes} SF`);
    if (analysis.pentas > 0) parts.push(`${analysis.pentas} 5K`);
    if (analysis.quads > 0) parts.push(`${analysis.quads} 4K`);
    if (analysis.trips > 0) parts.push(`${analysis.trips} trips`);
    if (analysis.pairs >= 3) parts.push(`${analysis.pairs} pairs`);
    if (analysis.madeFlushes > 0) parts.push(`${analysis.madeFlushes} flushes`);
    if (analysis.madeStrights > 0) parts.push(`${analysis.madeStrights} straights`);
    if (analysis.wildCount > 0) parts.push(`${analysis.wildCount} wilds`);

    if (parts.length === 0) {
        parts.push(`${analysis.highCards} high cards`);
    }

    return parts.join(', ');
}

/**
 * Quick test with small sample
 */
function quickDistributionTest(numHands = 1000) {
    console.log(`Running quick test with ${numHands} hands...`);
    return heuristicDistributionAnalyzer(numHands);
}

// Make functions globally available for browser
window.heuristicDistributionAnalyzer = heuristicDistributionAnalyzer;
window.quickDistributionTest = quickDistributionTest;
window.generateRandomSeventeenCardHand = generateRandomSeventeenCardHand;