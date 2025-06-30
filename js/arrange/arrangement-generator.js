// js/hands/arrangement-generator.js
// Phase 5: Extracted from auto-arrange.js

class ArrangementGenerator {
    constructor(game) {
        this.game = game;
    }

    /**
     * Find the best valid arrangement from all possible hands
     * @param {Array} allCards - All 17 cards to arrange
     * @param {Array} allPossibleHands - All possible 5-card hands
     * @returns {Object|null} - Best arrangement or null
     */
    findBestArrangement(allCards, allPossibleHands) {
        let bestScore = -1000;
        let bestArrangement = null;

        // Try both 3-card and 5-card front options
        const frontOptions = [3, 5];

        for (const frontSize of frontOptions) {
            console.log(`🔍 Trying ${frontSize}-card front arrangements...`);

            const arrangements = this.generateValidArrangements(allCards, allPossibleHands, frontSize);

            for (const arrangement of arrangements) {
                const score = ArrangementScorer.scoreArrangement(arrangement);

                if (score > bestScore) {
                    bestScore = score;
                    bestArrangement = arrangement;
                    console.log(`New best score: ${score}`);
                }
            }
        }

        return bestArrangement;
    }

    /**
     * Generate all valid arrangements for a given front hand size
     * @param {Array} allCards - All 17 cards
     * @param {Array} allPossibleHands - All possible 5-card hands
     * @param {number} frontSize - Size of front hand (3 or 5)
     * @returns {Array} - Array of valid arrangements
     */
    generateValidArrangements(allCards, allPossibleHands, frontSize) {
        const validArrangements = [];
        const maxArrangements = 100; // Limit to prevent slowdown

        // Get possible front hands
        const frontAnalyzer = new HandAnalyzer(allCards);
        const frontHands = frontSize === 3 ?
            frontAnalyzer.findAllPossibleThreeCardHands().slice(0, 20) :
            allPossibleHands.slice(0, 20); // Top 20 5-card hands for front

        for (const frontHand of frontHands) {
            if (validArrangements.length >= maxArrangements) break;

            // Get remaining cards after front
            const usedFrontIds = CardUtilities.getAllCardIds(frontHand.cards);
            const remainingCards = CardUtilities.filterCardsExcluding(allCards, usedFrontIds);

            // Find possible middle hands from remaining cards
            const middleAnalyzer = new HandAnalyzer(remainingCards);
            const middleHands = middleAnalyzer.findAllPossibleHands().slice(0, 10);

            for (const middleHand of middleHands) {
                const usedMiddleIds = CardUtilities.getAllCardIds(middleHand.cards);
                const cardsAfterMiddle = CardUtilities.filterCardsExcluding(remainingCards, usedMiddleIds);

                // Find possible back hands from remaining cards
                const backAnalyzer = new HandAnalyzer(cardsAfterMiddle);
                const backHands = backAnalyzer.findAllPossibleHands().slice(0, 5);

                for (const backHand of backHands) {
                    // Check if this arrangement is valid (Back >= Middle >= Front)
                    if (this.isValidHandOrder(backHand, middleHand, frontHand)) {
                        const usedBackIds = CardUtilities.getAllCardIds(backHand.cards);
                        const stagingCards = CardUtilities.filterCardsExcluding(cardsAfterMiddle, usedBackIds);

                        validArrangements.push({
                            back: backHand.cards,
                            middle: middleHand.cards,
                            front: frontHand.cards,
                            staging: stagingCards,
                            backStrength: backHand.strength,
                            middleStrength: middleHand.strength,
                            frontStrength: frontHand.strength
                        });
                    }
                }
            }
        }

        console.log(`Generated ${validArrangements.length} valid arrangements`);
        return validArrangements;
    }

    /**
     * Check if hand order is valid (Back >= Middle >= Front)
     * @param {Object} backHand - Back hand with strength
     * @param {Object} middleHand - Middle hand with strength
     * @param {Object} frontHand - Front hand with strength
     * @returns {boolean} - True if valid order
     */
    isValidHandOrder(backHand, middleHand, frontHand) {
        const backRank = backHand.strength.hand_rank;
        const middleRank = middleHand.strength.hand_rank;
        const frontRank = frontHand.strength.hand_rank;

        const backVsMiddle = compareTuples(backRank, middleRank);
        const middleVsFront = compareTuples(middleRank, frontRank);

        // Debug logging for invalid arrangements
        if (backVsMiddle < 0 || middleVsFront < 0) {
            console.log('❌ Invalid hand order detected:');
            console.log(`Back: ${backHand.strength.name} (${backRank.join(', ')})`);
            console.log(`Middle: ${middleHand.strength.name} (${middleRank.join(', ')})`);
            console.log(`Front: ${frontHand.strength.name} (${frontRank.join(', ')})`);
            console.log(`Back vs Middle: ${backVsMiddle}, Middle vs Front: ${middleVsFront}`);
        }

        // Special case: 5-card front must be at least a straight
        if (frontHand.cards.length === 5) {
            if (frontRank[0] < 5) { // Less than straight
                return false;
            }
        }

        // Validate 6+ card hands follow special rules
        const isValidBackHand = backHand.cards.length < 6 || this.game.validateLargeHand(backHand.cards);
        const isValidMiddleHand = middleHand.cards.length < 6 || this.game.validateLargeHand(middleHand.cards);

        return backVsMiddle >= 0 && middleVsFront >= 0 && isValidBackHand && isValidMiddleHand;
    }
}