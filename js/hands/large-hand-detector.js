// js/hands/large-hand-detector.js
// Phase 4: Extracted from auto-arrange.js

class LargeHandDetector {
    constructor(game) {
        this.game = game;
    }

    /**
     * Main entry point for finding large hand arrangements (6-8 cards)
     * @param {Array} allCards - All 17 cards to analyze
     * @returns {Object|null} - Large hand arrangement or null if none found
     */
    findLargeHandArrangement(allCards) {
        // Only handle non-wild cards for now (wild cards use fallback)
        return this.findLargeHandWithoutWilds(allCards);
    }

    /**
     * Find large hand arrangements without wild card optimization
     * @param {Array} allCards - All cards to analyze
     * @returns {Object|null} - Best large hand arrangement or null
     */
    findLargeHandWithoutWilds(allCards) {
        // Look for 6-8 card straight flushes and 6-8 of a kind
        const largeStraightFlush = this.findLargeStraightFlush(allCards);
        const largeOfAKind = this.findLargeOfAKind(allCards);

        // Prioritize the best large hand found
        let bestLargeHand = null;
        let bestScore = 0;

        if (largeStraightFlush) {
            const score = ArrangementScorer.scoreLargeHand(largeStraightFlush, 'straight_flush');
            if (score > bestScore) {
                bestScore = score;
                bestLargeHand = largeStraightFlush;
            }
        }

        if (largeOfAKind) {
            const score = ArrangementScorer.scoreLargeHand(largeOfAKind, 'of_a_kind');
            if (score > bestScore) {
                bestScore = score;
                bestLargeHand = largeOfAKind;
            }
        }

        if (bestLargeHand) {
            return this.createLargeHandArrangement(allCards, bestLargeHand);
        }

        return null;
    }

    /**
     * Find the longest straight flush of 6+ cards
     * @param {Array} allCards - All cards to analyze
     * @returns {Object|null} - Large straight flush or null
     */
    findLargeStraightFlush(allCards) {
        // Group cards by suit
        const suitGroups = CardUtilities.groupCardsBySuit(allCards);

        let bestStraightFlush = null;
        let bestLength = 0;

        // Check each suit for straight flushes
        for (const suit in suitGroups) {
            const suitCards = suitGroups[suit];
            if (suitCards.length >= 6) {
                // Sort by value (descending)
                const sortedSuitCards = CardUtilities.sortCardsByValue(suitCards, true);

                // Find longest straight flush
                const straightFlush = CardUtilities.findLongestStraightFlush(sortedSuitCards);
                if (straightFlush && straightFlush.length >= 6 && straightFlush.length > bestLength) {
                    bestLength = straightFlush.length;
                    bestStraightFlush = {
                        cards: straightFlush,
                        type: 'straight_flush',
                        length: straightFlush.length
                    };
                }
            }
        }

        return bestStraightFlush;
    }

    /**
     * Find the largest group of same rank cards (6+ cards)
     * @param {Array} allCards - All cards to analyze
     * @returns {Object|null} - Large of-a-kind or null
     */
    findLargeOfAKind(allCards) {
        // Find the largest group of same rank (6+ cards)
        const largestRankGroup = CardUtilities.findLargestRankGroup(allCards, 6);

        if (largestRankGroup) {
            return {
                cards: largestRankGroup.cards,
                type: 'of_a_kind',
                length: largestRankGroup.length,
                rank: largestRankGroup.rank
            };
        }

        return null;
    }

    /**
     * Create a complete hand arrangement with the large hand as the back
     * @param {Array} allCards - All 17 cards
     * @param {Object} largeHand - The large hand to place in back
     * @returns {Object|null} - Complete arrangement or null if invalid
     */
    createLargeHandArrangement(allCards, largeHand) {
        const usedCards = CardUtilities.getAllCardIds(largeHand.cards);
        const remainingCards = CardUtilities.filterCardsExcluding(allCards, usedCards);

        // Put the large hand in the back
        const backHand = largeHand.cards;

        // Arrange remaining cards optimally
        const analyzer = new HandAnalyzer(remainingCards);

        // Try to make a good middle hand (5 cards)
        const possibleMiddleHands = analyzer.findAllPossibleHands().slice(0, 10);
        let bestMiddleHand = null;
        let bestMiddleScore = -1;

        for (const middleHand of possibleMiddleHands) {
            const middleScore = middleHand.strength.hand_rank[0];
            if (middleScore > bestMiddleScore) {
                bestMiddleScore = middleScore;
                bestMiddleHand = middleHand;
            }
        }

        let middleCards = [];
        let cardsAfterMiddle = remainingCards;

        if (bestMiddleHand) {
            middleCards = bestMiddleHand.cards;
            const usedMiddleIds = CardUtilities.getAllCardIds(middleCards);
            cardsAfterMiddle = CardUtilities.filterCardsExcluding(remainingCards, usedMiddleIds);
        } else {
            // Fallback: take 5 best remaining cards
            const sortedRemaining = CardUtilities.sortCardsByValue(remainingCards, true);
            middleCards = sortedRemaining.slice(0, 5);
            cardsAfterMiddle = sortedRemaining.slice(5);
        }

        // Front hand: take 3 best remaining cards
        const sortedAfterMiddle = CardUtilities.sortCardsByValue(cardsAfterMiddle, true);
        const frontCards = sortedAfterMiddle.slice(0, 3);
        const stagingCards = sortedAfterMiddle.slice(3);

        const arrangement = {
            back: backHand,
            middle: middleCards,
            front: frontCards,
            staging: stagingCards
        };

        // Validate the arrangement meets game rules
        if (!this.validateLargeHandArrangement(arrangement)) {
            console.log('❌ Large hand arrangement failed validation');
            return null;
        }

        return arrangement;
    }

    /**
     * Validate that a large hand arrangement follows all game rules
     * @param {Object} arrangement - The arrangement to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    validateLargeHandArrangement(arrangement) {
        // Check hand sizes are valid
        const backCount = arrangement.back.length;
        const middleCount = arrangement.middle.length;
        const frontCount = arrangement.front.length;

        const isValidBackSize = [5, 6, 7, 8].includes(backCount);
        const isValidMiddleSize = [5, 6, 7].includes(middleCount);
        const isValidFrontSize = frontCount === 3 || frontCount === 5;

        if (!isValidBackSize || !isValidMiddleSize || !isValidFrontSize) {
            console.log(`❌ Invalid hand sizes: back=${backCount}, middle=${middleCount}, front=${frontCount}`);
            return false;
        }

        // Check 6+ card hands follow special rules
        const isValidBackHand = backCount < 6 || this.game.validateLargeHand(arrangement.back);
        const isValidMiddleHand = middleCount < 6 || this.game.validateLargeHand(arrangement.middle);

        if (!isValidBackHand || !isValidMiddleHand) {
            console.log('❌ Large hands do not follow special rules (must be all same rank or straight flush)');
            return false;
        }

        // Check hand ordering (Back >= Middle >= Front)
        const backStrength = evaluateHand(arrangement.back);
        const middleStrength = evaluateHand(arrangement.middle);
        const frontStrength = evaluateThreeCardHand(arrangement.front);

        const backVsMiddle = compareTuples(backStrength.hand_rank, middleStrength.hand_rank);
        const middleVsFront = compareTuples(middleStrength.hand_rank, frontStrength.hand_rank);

        // Special case: 5-card front must be at least a straight
        if (frontCount === 5 && frontStrength.hand_rank[0] < 5) {
            console.log('❌ 5-card front hand must be at least a straight');
            return false;
        }

        if (backVsMiddle < 0 || middleVsFront < 0) {
            console.log('❌ Invalid hand order: Back >= Middle >= Front required');
            console.log(`Back: ${backStrength.name}, Middle: ${middleStrength.name}, Front: ${frontStrength.name}`);
            return false;
        }

        return true;
    }
}