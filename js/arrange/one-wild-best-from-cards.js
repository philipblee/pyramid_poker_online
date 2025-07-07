// js/arrange/one-wild-best-from-cards.js
// Find best arrangement for hands with exactly one wild card using smart candidates
// Works directly with card objects from the game

/**
 * Find best arrangement for a hand with one wild card using smart candidate approach
 * @param {Array} cardObjects - Array of 17 card objects (including 1 wild)
 * @returns {Object} Best arrangement result (same format as brute force version)
 */
function oneWildBestFromCards(cardObjects) {
    console.log(`\n🧠 ======== ONE WILD SMART ARRANGEMENT - FROM CARDS ========`);

    // STEP 1: Convert to Card Model format FIRST
    const properCardObjects = convertToCardModel(cardObjects);

    // STEP 2: Extract wild and non-wild cards from converted objects
    const wildCard = properCardObjects.find(card => card.isWild);
    const nonWildCards = properCardObjects.filter(card => !card.isWild);

    if (!wildCard) {
        console.log(`❌ No wild card found in provided cards`);
        return {
            arrangement: null,
            score: -Infinity,
            wildCard: null,
            success: false,
            statistics: null
        };
    }

    if (nonWildCards.length !== 16) {
        console.log(`❌ Expected 16 non-wild cards, found ${nonWildCards.length}`);
        return {
            arrangement: null,
            score: -Infinity,
            wildCard: null,
            success: false,
            statistics: null
        };
    }

    // STEP 3: Get smart candidates using converted cards
    console.log(`\n📋 Step 3: Getting smart candidates...`);
    const candidatesResult = generateWildCandidatesFromCards(properCardObjects);

    if (!candidatesResult) {
        console.log(`❌ Failed to get smart candidates`);
        return {
            arrangement: null,
            score: -Infinity,
            wildCard: null,
            success: false,
            statistics: null
        };
    }

    const allCandidates = candidatesResult.wildCandidates;
    console.log(`✅ Generated ${allCandidates.length} smart candidates`);

    // STEP 4: Process each smart candidate (same proven logic as brute force)
    console.log(`\n🔄 Step 4: Processing ${allCandidates.length} candidates (smart subset)...`);
    const results = [];

    allCandidates.forEach((candidate, index) => {
        // Progress indicator every 5 cards for smart subset
        if ((index + 1) % 5 === 0) {
            console.log(`   Progress: ${index + 1}/${allCandidates.length} candidates processed...`);
        }

        try {
            // Create substituted card (same as brute force)
            const substitutedCard = createCardFromString(candidate, wildCard.id);
            const cards = [...nonWildCards, substitutedCard];

            // Run HandDetector (auto-sorted)
            const detector = new HandDetector(cards);
            const handResults = detector.detectAllHands();

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

    // STEP 5: Sort results by score and summarize (same as brute force)
    console.log(`\n📊 Step 5: Analyzing smart results...`);
    results.sort((a, b) => b.score - a.score);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n✅ ======== SMART SUMMARY ========`);
    console.log(`Total candidates processed: ${results.length}`);
    console.log(`Successful arrangements: ${successful.length}`);
    console.log(`Failed attempts: ${failed.length}`);

    if (successful.length > 0) {
        const best = successful[0];
        console.log(`\n🏆 Best Result (Smart):`);
        console.log(`   Wild card: ${best.wildCard}`);
        console.log(`   Score: ${best.score}`);
        console.log(`   Back: ${best.arrangement.back.handType}`);
        console.log(`   Middle: ${best.arrangement.middle.handType}`);
        console.log(`   Front: ${best.arrangement.front.handType}`);

        // Show top 5 results for smart approach
        console.log(`\n🥇 Top 5 Results (Smart):`);
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

        // Return same format as brute force version
        console.log(`🔍 DEBUG: Returning best result from smart success block`);
        return {
            arrangement: best.arrangement,
            score: best.score,
            wildCard: best.wildCard,
            success: true,
            statistics: best.statistics
        };

    } else {
        console.log(`❌ No successful arrangements found!`);
        console.log(`🔍 DEBUG: Returning null from smart failure block`);
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
 * Create a card object from string representation (copied from brute force)
 * @param {string} cardString - Card string like "A♠"
 * @param {string} originalId - ID from the original wild card
 * @returns {Object} Card object with wasWild flag
 */
function createCardFromString(cardString, originalId) {
    // Parse rank and suit from string like "A♠"
    const match = cardString.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
    if (!match) {
        throw new Error(`Invalid card format: ${cardString}`);
    }

    const [, rank, suit] = match;

    const substitutedCard = {
        id: originalId,
        rank: rank,
        suit: suit,
        isWild: false,
        wasWild: true,  // Visual indication flag
        value: getRankValue(rank)
    };

    return substitutedCard;
}

/**
 * Get numeric value for rank (copied from brute force)
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
 * Quick test function for console use
 * @param {Array} cardObjects - Array of card objects with 1 wild
 */
function testOneWildBestFromCards(cardObjects) {
    return oneWildBestFromCards(cardObjects);
}