// js/hands/wild-card-optimizer.js

class WildCardOptimizer {
    constructor(game) {
        this.game = game;
    }

    // =============================================================================
    // MAIN WILD CARD OPTIMIZATION METHODS
    // =============================================================================

    optimizeWildForSmallHands(allCards, wildCard) {
        const { nonWildCards } = CardUtilities.separateWildCards(allCards);
        let bestOptimizedCards = null;
        let bestScore = 0;
        let bestDescription = '';

        console.log('🃏 Optimizing wild for regular hands...');

        const ranks = CardUtilities.getRanks();
        const suits = CardUtilities.getSuits();

        // Try wild as each possible card
        for (const rank of ranks) {
            for (const suit of suits) {
                const testCards = [...nonWildCards, CardUtilities.createTestCard(wildCard, rank, suit)];
                const score = this.evaluateWildOptimization(testCards, wildCard.id);

                if (score > bestScore) {
                    bestScore = score;
                    bestOptimizedCards = [...nonWildCards, CardUtilities.createOptimalWild(wildCard, rank, suit)];
                    bestDescription = `${rank}${suit}`;
                }
            }
        }

        if (bestOptimizedCards) {
            console.log(`🎯 Wild optimized as ${bestDescription} (score: ${bestScore})`);
        } else {
            console.log('🃏 No significant improvement found, wild will be used as high card');
            bestOptimizedCards = [...nonWildCards, CardUtilities.createOptimalWild(wildCard, 'A', '♠')];
        }

        return bestOptimizedCards;
    }

    evaluateWildOptimization(testCards, wildId) {
        // Create a temporary hand analyzer to evaluate the potential
        const analyzer = new HandAnalyzer(testCards);
        const allPossibleHands = analyzer.findAllPossibleHands();

        let maxScore = 0;

        // Score the best possible hands this wild arrangement could create
        for (const hand of allPossibleHands.slice(0, 20)) { // Check top 20 hands
            const handCards = hand.cards;
            const usesWild = handCards.some(c => c.id === wildId);

            if (usesWild) {
                // Give bonus for utilizing the wild card
                const baseScore = ArrangementScorer.getHandTypeScore(hand.strength.hand_rank[0]);
                const wildBonus = 10; // Bonus for using wild
                maxScore = Math.max(maxScore, baseScore + wildBonus);
            }
        }

        return maxScore;
    }

    // =============================================================================
    // LARGE HAND WILD CARD METHODS
    // =============================================================================

    findLargeHandWithOneWild(allCards, wildCard) {
        // Try large hands first (6+ cards)
        const largeHandResult = this.tryLargeHandsWithWild(allCards, wildCard);
        if (largeHandResult) {
            return largeHandResult;
        }

        // If no large hands possible, optimize wild for best regular hands
        console.log('🃏 No large hands possible, optimizing wild for regular hands...');
        return null; // Let the enhanced normal algorithm handle it
    }

    tryLargeHandsWithWild(allCards, wildCard) {
        const { nonWildCards } = CardUtilities.separateWildCards(allCards);
        let bestArrangement = null;
        let bestScore = 0;

        console.log('🃏 Checking for large hands with wild card...');

        // Try wild as each possible rank for of-a-kind (6K+)
        const ranks = CardUtilities.getRanks();
        for (const rank of ranks) {
            const testCards = [...nonWildCards, CardUtilities.createTestCard(wildCard, rank, '♠')];
            const ofAKind = this.findAnyOfAKind(testCards);

            if (ofAKind && ofAKind.length >= 6) {
                const score = ArrangementScorer.scoreOfAKindHand(ofAKind);
                if (score > bestScore) {
                    bestScore = score;
                    const optimalWild = CardUtilities.createOptimalWild(wildCard, rank, ofAKind.cards[0].suit);
                    const finalCards = [...nonWildCards, optimalWild];
                    bestArrangement = this.createLargeHandArrangement(finalCards, {
                        ...ofAKind,
                        cards: ofAKind.cards.map(c => c.id === wildCard.id ? optimalWild : c)
                    });
                }
            }
        }

        // Try wild for straight flush completion (6+ cards)
        const suits = CardUtilities.getSuits();
        for (const suit of suits) {
            const suitCards = nonWildCards.filter(card => card.suit === suit);
            if (suitCards.length >= 5) {
                for (const rank of ranks) {
                    const testCards = [...nonWildCards, CardUtilities.createTestCard(wildCard, rank, suit)];
                    const largeStraightFlush = this.findLargeStraightFlush(testCards);

                    if (largeStraightFlush && largeStraightFlush.length >= 6) {
                        const score = ArrangementScorer.scoreLargeHand(largeStraightFlush, 'straight_flush');
                        if (score > bestScore) {
                            bestScore = score;
                            const optimalWild = CardUtilities.createOptimalWild(wildCard, rank, suit);
                            const finalCards = [...nonWildCards, optimalWild];
                            bestArrangement = this.createLargeHandArrangement(finalCards, {
                                ...largeStraightFlush,
                                cards: largeStraightFlush.cards.map(c => c.id === wildCard.id ? optimalWild : c)
                            });
                        }
                    }
                }
            }
        }

        if (bestArrangement) {
            console.log(`🎯 Found large hand with wild, score: ${bestScore}`);
        }

        return bestArrangement;
    }

    // =============================================================================
    // HELPER METHODS (used by wild card logic)
    // =============================================================================

    findAnyOfAKind(allCards) {
        // Find the largest group of same rank (4+ cards)
        const largestRankGroup = CardUtilities.findLargestRankGroup(allCards, 4);

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