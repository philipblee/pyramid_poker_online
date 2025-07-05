// js/arrange/one-wild-brute-force-from-cards.js
// Find best arrangement for hands with exactly one wild card using brute force
// Works directly with card objects from the game (not test cases)
// MINIMAL CHANGES to existing tested brute force code

/**
 * Find best arrangement for a hand with one wild card using brute force approach
 * @param {Array} cardObjects - Array of 17 card objects (including 1 wild)
 * @returns {Array} Array of results, each with wild card used and arrangement found
 */
function bestArrangementOneWildBruteForceFromCards(cardObjects) {
    console.log(`\n🔨 ======== ONE WILD BRUTE FORCE ARRANGEMENT - FROM CARDS ========`);

    // CHANGE 1: Extract wild and non-wild cards from cardObjects instead of test case lookup
    const wildCard = cardObjects.find(card => card.isWild);
    const nonWildCards = cardObjects.filter(card => !card.isWild);

    if (!wildCard) {
        console.log(`❌ No wild card found in provided cards`);
        return [];
    }

    if (nonWildCards.length !== 16) {
        console.log(`❌ Expected 16 non-wild cards, found ${nonWildCards.length}`);
        return [];
    }

    // Step 1: Get all 52 possible cards
    console.log(`\n📋 Step 1: Generating all 52 possible cards...`);
    const allCandidates = generateAll52Cards();
    console.log(`✅ Generated ${allCandidates.length} total candidates`);

    // Step 2: Process each candidate (brute force)
    console.log(`\n🔄 Step 2: Processing ALL ${allCandidates.length} candidates (brute force)...`);
    const results = [];

    allCandidates.forEach((candidate, index) => {
        // Progress indicator every 13 cards (one suit)
        if ((index + 1) % 13 === 0) {
            console.log(`   Progress: ${index + 1}/${allCandidates.length} candidates processed...`);
        }

        try {
            // CHANGE 2: Create substituted cards array instead of using CardParser
            const substitutedCard = createCardFromString(candidate, wildCard.id);
            const cards = [...nonWildCards, substitutedCard];

            // Run HandDetector (auto-sorted)
            const detector = new HandDetector(cards);
            const handResults = detector.detectAllHands(); // Pre-sorted hands!

            // Run BestArrangementGenerator
            const generator = new BestArrangementGenerator();
            const arrangementResult = generator.generateBestArrangement(handResults.hands, cards);

            if (arrangementResult.success) {
                results.push({
                    wildCard: candidate,
                    arrangement: arrangementResult.arrangement,
                    score: arrangementResult.score,
                    success: true,
                    statistics: arrangementResult.statistics,
                    handCount: handResults.total
                });
            } else {
                results.push({
                    wildCard: candidate,
                    arrangement: null,
                    score: -Infinity,
                    success: false,
                    statistics: arrangementResult.statistics,
                    handCount: handResults.total,
                    error: 'No valid arrangement found'
                });
            }

        } catch (error) {
            results.push({
                wildCard: candidate,
                arrangement: null,
                score: -Infinity,
                success: false,
                statistics: null,
                handCount: 0,
                error: error.message
            });
        }
    });

    // Step 3: Sort results by score and summarize
    console.log(`\n📊 Step 3: Analyzing brute force results...`);
    results.sort((a, b) => b.score - a.score);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n✅ ======== BRUTE FORCE SUMMARY ========`);
    console.log(`Total candidates processed: ${results.length}`);
    console.log(`Successful arrangements: ${successful.length}`);
    console.log(`Failed attempts: ${failed.length}`);

    if (successful.length > 0) {
        const best = successful[0];
        console.log(`\n🏆 Best Result (Brute Force):`);
        console.log(`   Wild card: ${best.wildCard}`);
        console.log(`   Score: ${best.score}`);
        console.log(`   Back: ${best.arrangement.back.handType}`);
        console.log(`   Middle: ${best.arrangement.middle.handType}`);
        console.log(`   Front: ${best.arrangement.front.handType}`);

        // Show top 5 results for brute force
        console.log(`\n🥇 Top 5 Results (Brute Force):`);
        successful.slice(0, 5).forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.wildCard}: ${result.score} points`);
        });

        // Show optimal score distribution
        const optimalScore = best.score;
        const optimalResults = successful.filter(r => r.score === optimalScore);
        console.log(`\n🎯 Optimal Score Analysis:`);
        console.log(`   Optimal score: ${optimalScore} points`);
        console.log(`   Cards achieving optimal: ${optimalResults.length}/${successful.length}`);
        console.log(`   Optimal wild cards: ${optimalResults.map(r => r.wildCard).join(', ')}`);

        // RETURN RIGHT HERE - no way to miss it!
        console.log(`🔍 DEBUG: Returning best result from success block`);
        return {
            arrangement: best.arrangement,
            score: best.score,
            wildCard: best.wildCard,
            success: true,
            statistics: best.statistics
        };

    } else {
        console.log(`❌ No successful arrangements found!`);
        console.log(`🔍 DEBUG: Returning null from failure block`);
        return {
            arrangement: null,
            score: -Infinity,
            wildCard: null,
            success: false,
            statistics: null
        };
    }
}

/**
 * Create a card object from string representation
 * @param {string} cardString - Card string like "A♠"
 * @param {string} originalId - ID from the original wild card
 * @returns {Object} Card object
 */
function createCardFromString(cardString, originalId) {
    // Parse rank and suit from string like "A♠"
    const match = cardString.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
    if (!match) {
        throw new Error(`Invalid card format: ${cardString}`);
    }

    const [, rank, suit] = match;

    return {
        id: originalId, // Keep the original wild card's ID
        rank: rank,
        suit: suit,
        isWild: false, // No longer wild after substitution
        value: getRankValue(rank)
    };
}

/**
 * Get numeric value for rank
 * @param {string} rank - Card rank
 * @returns {number} Numeric value
 */
function getRankValue(rank) {
    const values = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return values[rank] || 0;
}

/**
 * Generate all 52 possible cards
 * @returns {Array} Array of all possible card strings
 */
function generateAll52Cards() {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suits = ['♠', '♥', '♦', '♣'];

    const allCards = [];

    ranks.forEach(rank => {
        suits.forEach(suit => {
            allCards.push(rank + suit);
        });
    });

    return allCards;
}

/**
 * Quick test function for console use
 * @param {Array} cardObjects - Array of card objects with 1 wild
 */
function testOneWildBruteForceFromCards(cardObjects) {
    return bestArrangementOneWildBruteForceFromCards(cardObjects);
}