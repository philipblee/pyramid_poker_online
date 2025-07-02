// js/tests/one-wild-brute-force-optimizer.js
// Brute-force optimizer for exactly 1 wild card scenarios
// Tries all 52 possible substitutions and returns results

class OneWildBruteForceOptimizer {
    constructor() {
        // Generate standard 52-card deck for substitutions
        this.substitutionDeck = this.generateStandardDeck();
    }

    /**
     * Generate standard 52-card deck
     * @returns {Array} Array of card strings
     */
    generateStandardDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck = [];

        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push(`${rank}${suit}`);
            }
        }

        return deck;
    }

    /**
     * Parse cards string into array and find wild card position
     * @param {string} cardsString - Space-separated cards including 🃏
     * @returns {Object} {cards: Array, wildIndex: number}
     */
    parseCardsAndFindWild(cardsString) {
        const cards = cardsString.trim().split(/\s+/);
        const wildIndex = cards.findIndex(card => card === '🃏');

        if (wildIndex === -1) {
            throw new Error('No wild card found in cards string');
        }

        if (cards.filter(card => card === '🃏').length !== 1) {
            throw new Error('Expected exactly 1 wild card');
        }

        return { cards, wildIndex };
    }

    /**
     * Convert card string to card object format expected by BestArrangementGenerator
     * @param {string} cardString - Card like "A♠"
     * @param {number} index - Card index for unique ID
     * @returns {Object} Card object
     */
    createCardObject(cardString, index) {
        const match = cardString.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
        if (!match) {
            throw new Error(`Invalid card format: ${cardString}`);
        }

        const [, rank, suit] = match;
        const value = this.getRankValue(rank);

        return {
            suit: suit,
            rank: rank,
            value: value,
            id: `${rank}${suit}_${index}`,
            isWild: false
        };
    }

    /**
     * Get numeric value for rank
     */
    getRankValue(rank) {
        const values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        return values[rank];
    }

    /**
     * Sort cards by rank (highest first) for display
     * @param {Array} cards - Array of card strings like ["A♠", "K♥", "2♣"]
     * @returns {Array} Sorted cards array
     */
    sortCardsByRank(cards) {
        return cards.sort((a, b) => {
            const rankA = this.getRankValue(a.match(/^(\d+|[AKQJ])/)[1]);
            const rankB = this.getRankValue(b.match(/^(\d+|[AKQJ])/)[1]);
            return rankB - rankA; // Highest first
        });
    }

    /**
     * Extract hand details from BestArrangementGenerator result
     * @param {Object} arrangement - Result from BestArrangementGenerator
     * @returns {Object} Formatted hand details
     */
    extractHandDetails(arrangement) {
        if (!arrangement || !arrangement.arrangement) {
            return {
                success: false,
                front: null,
                middle: null,
                back: null,
                totalScore: 0
            };
        }

        const arr = arrangement.arrangement;

        return {
            success: arrangement.success || false,
            front: {
                cards: this.sortCardsByRank(arr.front.cards.map(c => c.rank + c.suit)),
                name: arr.front.handType || 'Unknown',
                score: arr.front.positionScores.front
            },
            middle: {
                cards: this.sortCardsByRank(arr.middle.cards.map(c => c.rank + c.suit)),
                name: arr.middle.handType || 'Unknown',
                score: arr.middle.positionScores.middle
            },
            back: {
                cards: this.sortCardsByRank(arr.back.cards.map(c => c.rank + c.suit)),
                name: arr.back.handType || 'Unknown',
                score: arr.back.positionScores.back
            },
            totalScore: arrangement.score || 0
        };
    }

    /**
     * Get top N arrangements sorted by score
     * @param {Array} results - All 52 results from brute force
     * @param {number} topN - Number of top results to return (default 5)
     * @returns {Object} {topResults: Array, summary: Object}
     */
    getTopArrangements(results, topN = 5) {
        // Filter only successful arrangements
        const successfulResults = results.filter(result => result.handDetails.success);

        // Sort by total score (highest first)
        const sortedResults = successfulResults.sort((a, b) =>
            b.handDetails.totalScore - a.handDetails.totalScore
        );

        // Take top N and add ranking
        const topResults = sortedResults.slice(0, topN).map((result, index) => ({
            rank: index + 1,
            substitution: result.substitution,
            handDetails: result.handDetails,
            statistics: result.statistics
        }));

        return {
            topResults: topResults,
            summary: {
                totalSuccessful: successfulResults.length,
                totalFailed: results.length - successfulResults.length,
                topScore: topResults.length > 0 ? topResults[0].handDetails.totalScore : 0,
                scoreRange: {
                    highest: topResults.length > 0 ? topResults[0].handDetails.totalScore : 0,
                    lowest: topResults.length > 0 ? topResults[topResults.length - 1].handDetails.totalScore : 0
                }
            }
        };
    }

    /**
     * Main brute force function - try all 52 substitutions
     * @param {string} cardsString - Cards string from test case
     * @returns {Object} {allResults: Array, topArrangements: Object, summary: Object}
     */
    bruteForceOptimize(cardsString) {
        console.log(`\n🃏 ======== BRUTE FORCE ONE WILD OPTIMIZER ========`);
        console.log(`Input: ${cardsString}`);

        // Parse input and find wild card
        const { cards, wildIndex } = this.parseCardsAndFindWild(cardsString);
        console.log(`Wild card found at position ${wildIndex + 1}/17`);

        const results = [];
        let successCount = 0;

        // Try each of the 52 possible substitutions
        for (let i = 0; i < this.substitutionDeck.length; i++) {
            const substitution = this.substitutionDeck[i];

            // Create new cards array with substitution
            const substitutedCards = [...cards];
            substitutedCards[wildIndex] = substitution;

            // Convert to card objects for BestArrangementGenerator
            const cardObjects = substitutedCards.map((cardStr, index) =>
                this.createCardObject(cardStr, index)
            );

            // Run through HandDetector and HandSorter first
            try {
                const detector = new HandDetector(cardObjects);
                const detectionResults = detector.detectAllHands();

                const sorter = new HandSorter();
                const sortResult = sorter.sortHandsByStrength(detectionResults.hands);

                // Generate best arrangement with all substituted cards
                const generator = new BestArrangementGenerator();
                const arrangement = generator.generateBestArrangement(sortResult.sortedHands, cardObjects);

                // Extract hand details
                const handDetails = this.extractHandDetails(arrangement);

                if (handDetails.success) {
                    successCount++;
                }

                results.push({
                    substitution: substitution,
                    handDetails: handDetails,
                    statistics: arrangement.statistics || {}
                });

            } catch (error) {
                console.log(`❌ Error with substitution ${substitution}: ${error.message}`);
                results.push({
                    substitution: substitution,
                    handDetails: {
                        success: false,
                        error: error.message,
                        front: null,
                        middle: null,
                        back: null,
                        totalScore: 0
                    },
                    statistics: {}
                });
            }
        }

        console.log(`\n📊 Completed ${this.substitutionDeck.length} substitutions`);
        console.log(`✅ Successful arrangements: ${successCount}/${this.substitutionDeck.length}`);

        // Get top 5 arrangements
        const topArrangements = this.getTopArrangements(results, 5);

        return {
            allResults: results,
            topArrangements: topArrangements,
            summary: {
                totalSubstitutions: 52,
                successfulArrangements: successCount,
                successRate: (successCount / 52) * 100,
                topScore: topArrangements.summary.topScore,
                scoreRange: topArrangements.summary.scoreRange
            }
        };
    }
}

/**
 * Display detailed results with enhanced formatting
 * @param {Object} results - Results from bruteForceOptimize
 * @param {string} testCaseName - Name of the test case
 */
function displayDetailedResults(results, testCaseName = "Unknown") {
    console.log(`\n🃏 ======== ONE WILD BRUTE FORCE RESULTS ========`);
    console.log(`📋 Test Case: ${testCaseName}`);
    console.log(`🎯 Analyzed ${results.summary.totalSubstitutions} possible wild card substitutions`);
    console.log(`✅ Success Rate: ${results.summary.successfulArrangements}/${results.summary.totalSubstitutions} (${results.summary.successRate.toFixed(1)}%)`);

    if (results.topArrangements.topResults.length === 0) {
        console.log(`❌ No successful arrangements found`);
        return;
    }

    console.log(`📊 Score Range: ${results.summary.scoreRange.lowest} → ${results.summary.scoreRange.highest}`);
    console.log(`\n🏆 ======== TOP ${results.topArrangements.topResults.length} ARRANGEMENTS ========`);

    results.topArrangements.topResults.forEach((result, index) => {
        const { rank, substitution, handDetails } = result;

        console.log(`\n🥇 RANK #${rank} - Wild Card → ${substitution}`);
        console.log(`   💯 Total Score: ${handDetails.totalScore} points`);
        console.log(`   ⚡ Search Stats: ${result.statistics.exploredNodes?.toLocaleString() || 'N/A'} nodes, ${result.statistics.searchTime?.toFixed(1) || 'N/A'}ms`);

        // Format hands with aligned columns
        const backName = handDetails.back.name.padEnd(18);
        const middleName = handDetails.middle.name.padEnd(18);
        const frontName = handDetails.front.name.padEnd(18);

        const backCards = handDetails.back.cards.join(' ').padEnd(25);
        const middleCards = handDetails.middle.cards.join(' ').padEnd(25);
        const frontCards = handDetails.front.cards.join(' ').padEnd(25);

        console.log(`   🔙 BACK HAND:   ${backName} - ${backCards} - ${handDetails.back.score} pts`);
        console.log(`   🔄 MIDDLE HAND: ${middleName} - ${middleCards} - ${handDetails.middle.score} pts`);
        console.log(`   🔜 FRONT HAND:  ${frontName} - ${frontCards} - ${handDetails.front.score} pts`);;

        // Add separator except for last result
        if (index < results.topArrangements.topResults.length - 1) {
            console.log(`   ${'─'.repeat(50)}`);
        }
    });

    // Performance summary
    const avgSearchTime = results.topArrangements.topResults
        .reduce((sum, r) => sum + (r.statistics.searchTime || 0), 0) / results.topArrangements.topResults.length;

    const totalNodes = results.topArrangements.topResults
        .reduce((sum, r) => sum + (r.statistics.exploredNodes || 0), 0);

    console.log(`\n📈 ======== PERFORMANCE SUMMARY ========`);
    console.log(`⏱️  Average search time: ${avgSearchTime.toFixed(1)}ms per substitution`);
    console.log(`🔍 Total nodes explored: ${totalNodes.toLocaleString()}`);
    console.log(`🎯 Best substitution: ${results.topArrangements.topResults[0].substitution} (${results.summary.scoreRange.highest} pts)`);
}

/**
 * Enhanced convenience function for console testing with detailed output
 * @param {string} cardsString - Cards string from test case
 * @param {string} testCaseName - Optional name for the test case
 * @returns {Object} Results with top arrangements and summary
 */
function testOneWildBruteForce(cardsString, testCaseName = "Manual Test") {
    const optimizer = new OneWildBruteForceOptimizer();
    const results = optimizer.bruteForceOptimize(cardsString);

    // Display detailed results
    displayDetailedResults(results, testCaseName);

    return results;
}

/**
 * Quick test function that just shows top 5 in compact format
 * @param {string} cardsString - Cards string from test case
 * @returns {Object} Results with top arrangements and summary
 */
function testOneWildBruteForceQuick(cardsString) {
    const optimizer = new OneWildBruteForceOptimizer();
    const results = optimizer.bruteForceOptimize(cardsString);

    console.log(`\n🏆 TOP 5 - Success: ${results.summary.successfulArrangements}/52 (${results.summary.successRate.toFixed(1)}%)`);
    results.topArrangements.topResults.forEach(result => {
        console.log(`#${result.rank}: ${result.substitution} → ${result.handDetails.totalScore} pts`);
        console.log(`  Back: ${result.handDetails.back.name} (${result.handDetails.back.score})`);
        console.log(`  Mid:  ${result.handDetails.middle.name} (${result.handDetails.middle.score})`);
        console.log(`  Front: ${result.handDetails.front.name} (${result.handDetails.front.score})`);
    });

    return results;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OneWildBruteForceOptimizer, testOneWildBruteForce };
}