// js/hands/auto-arrange.js

class AutoArrangeManager {
    constructor(game) {
        this.game = game;
    }

    smartAutoArrangeHand() {
        const currentPlayer = this.game.playerManager.getCurrentPlayer();
        const playerData = this.game.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        // Get all 17 cards
        const allCards = CardUtilities.combineCards(
            playerData.cards,
            playerData.back,
            playerData.middle,
            playerData.front
        );

        if (!CardUtilities.validateCardCount(allCards, 17)) {
            return;
        }

        console.log('🧠 Smart Auto-Arrange starting...');

        // First check for 6-8 card special hands (straight flushes and of-a-kind)
        const largeHandArrangement = this.findLargeHandArrangement(allCards);
        if (largeHandArrangement) {
            console.log('🎯 Found large hand arrangement!');
            CardUtilities.logCardList(largeHandArrangement.back, 'Back');
            CardUtilities.logCardList(largeHandArrangement.middle, 'Middle');
            CardUtilities.logCardList(largeHandArrangement.front, 'Front');
            CardUtilities.logCardList(largeHandArrangement.staging, 'Staging');

            this.applyArrangement(playerData, largeHandArrangement);
            return;
        }

        // Check if we have wild card optimization for 4K/5K
        const { wildCards } = CardUtilities.separateWildCards(allCards);
        let cardsToAnalyze = allCards;

        if (wildCards.length === 1) {
            const optimizedCards = this.optimizeWildForSmallHands(allCards, wildCards[0]);
            if (optimizedCards) {
                console.log('🃏 Using wild-optimized cards for normal arrangement');
                cardsToAnalyze = optimizedCards;
            }
        }

        // Analyze all possible hands
        const analyzer = new HandAnalyzer(cardsToAnalyze);
        const allPossibleHands = analyzer.findAllPossibleHands();

        console.log(`Found ${allPossibleHands.length} possible 5-card hands`);

        // Find the best valid arrangement
        const bestArrangement = this.findBestArrangement(cardsToAnalyze, allPossibleHands);

        if (bestArrangement) {
            // Final validation before applying
            if (!this.validateFinalArrangement(bestArrangement)) {
                console.log('❌ Best arrangement failed final validation, using fallback');
                this.fallbackAutoArrange();
                return;
            }

            console.log('✨ Best arrangement found and validated!');
            CardUtilities.logCardList(bestArrangement.back, 'Back');
            CardUtilities.logCardList(bestArrangement.middle, 'Middle');
            CardUtilities.logCardList(bestArrangement.front, 'Front');
            CardUtilities.logCardList(bestArrangement.staging, 'Staging');

            this.applyArrangement(playerData, bestArrangement);
        } else {
            console.log('❌ No valid arrangement found, falling back to simple sort');
            this.fallbackAutoArrange();
        }
    }

    applyArrangement(playerData, arrangement) {
        playerData.back = arrangement.back;
        playerData.middle = arrangement.middle;
        playerData.front = arrangement.front;
        playerData.cards = arrangement.staging;
        this.game.loadCurrentPlayerHand();
    }

    findBestArrangement(allCards, allPossibleHands) {
        let bestScore = -1000;
        let bestArrangement = null;

        // Try both 3-card and 5-card front options
        const frontOptions = [3, 5];

        for (const frontSize of frontOptions) {
            console.log(`🔍 Trying ${frontSize}-card front arrangements...`);

            const arrangements = this.generateValidArrangements(allCards, allPossibleHands, frontSize);

            for (const arrangement of arrangements) {
                const score = this.scoreArrangement(arrangement);

                if (score > bestScore) {
                    bestScore = score;
                    bestArrangement = arrangement;
                    console.log(`New best score: ${score}`);
                }
            }
        }

        return bestArrangement;
    }

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

    validateFinalArrangement(arrangement) {
        // Re-evaluate hands to ensure they're still valid
        const backStrength = evaluateHand(arrangement.back);
        const middleStrength = evaluateHand(arrangement.middle);
        const frontStrength = evaluateThreeCardHand(arrangement.front);

        const backVsMiddle = compareTuples(backStrength.hand_rank, middleStrength.hand_rank);
        const middleVsFront = compareTuples(middleStrength.hand_rank, frontStrength.hand_rank);

        // Check hand order
        if (backVsMiddle < 0 || middleVsFront < 0) {
            console.log('❌ Final validation: Invalid hand order');
            console.log(`Back: ${backStrength.name} (${backStrength.hand_rank.join(', ')})`);
            console.log(`Middle: ${middleStrength.name} (${middleStrength.hand_rank.join(', ')})`);
            console.log(`Front: ${frontStrength.name} (${frontStrength.hand_rank.join(', ')})`);
            return false;
        }

        // Check hand sizes
        const backCount = arrangement.back.length;
        const middleCount = arrangement.middle.length;
        const frontCount = arrangement.front.length;

        const isValidBackSize = [5, 6, 7, 8].includes(backCount);
        const isValidMiddleSize = [5, 6, 7].includes(middleCount);
        const isValidFrontSize = frontCount === 3 || frontCount === 5;

        if (!isValidBackSize || !isValidMiddleSize || !isValidFrontSize) {
            console.log(`❌ Final validation: Invalid hand sizes: back=${backCount}, middle=${middleCount}, front=${frontCount}`);
            return false;
        }

        // Check 6+ card hands follow special rules
        const isValidBackHand = backCount < 6 || this.game.validateLargeHand(arrangement.back);
        const isValidMiddleHand = middleCount < 6 || this.game.validateLargeHand(arrangement.middle);

        if (!isValidBackHand || !isValidMiddleHand) {
            console.log('❌ Final validation: Large hands do not follow special rules');
            return false;
        }

        // Check 5-card front hand constraint
        if (frontCount === 5 && frontStrength.hand_rank[0] < 5) {
            console.log('❌ Final validation: 5-card front hand must be at least a straight');
            return false;
        }

        return true;
    }

    // Simple auto-arrange (original method)
    autoArrangeHand() {
        const currentPlayer = this.game.playerManager.getCurrentPlayer();
        const playerData = this.game.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        const allCards = CardUtilities.combineCards(
            playerData.cards,
            playerData.back,
            playerData.middle,
            playerData.front
        );

        if (!CardUtilities.validateCardCount(allCards, 17)) {
            alert(`Card count error: Found ${allCards.length} cards instead of 17! Check console for details.`);
            return;
        }

        // Sort all cards and pick the best 13 for play, leave 4 best rejects in staging
        const sortedCards = CardUtilities.sortCardsByValue(allCards, true);

        // Take the best 13 cards for play
        const playCards = sortedCards.slice(0, 13);
        const stagingCards = sortedCards.slice(13, 17); // 4 worst cards stay in staging

        const arrangement = {
            back: playCards.slice(0, 5),    // 5 best cards
            middle: playCards.slice(5, 10), // next 5 cards
            front: playCards.slice(10, 13), // next 3 cards
            staging: stagingCards           // 4 cards left in staging
        };

        this.applyArrangement(playerData, arrangement);
    }

    fallbackAutoArrange() {
        console.log('🔄 Using fallback auto-arrange...');
        this.autoArrangeHand();
    }

    // =============================================================================
    // LARGE HAND DETECTION METHODS
    // TODO: PHASE 4 - Move to large-hand-detector.js
    // =============================================================================

    findLargeHandArrangement(allCards) {
        const { wildCards } = CardUtilities.separateWildCards(allCards);

        if (wildCards.length === 1) {
            return this.findLargeHandWithOneWild(allCards, wildCards[0]);
        } else {
            return this.findLargeHandWithoutWilds(allCards);
        }
    }

    findLargeHandWithoutWilds(allCards) {
        // Look for 6-8 card straight flushes and 6-8 of a kind
        const largeStraightFlush = this.findLargeStraightFlush(allCards);
        const largeOfAKind = this.findLargeOfAKind(allCards);

        // Prioritize the best large hand found
        let bestLargeHand = null;
        let bestScore = 0;

        if (largeStraightFlush) {
            const score = this.scoreLargeHand(largeStraightFlush, 'straight_flush');
            if (score > bestScore) {
                bestScore = score;
                bestLargeHand = largeStraightFlush;
            }
        }

        if (largeOfAKind) {
            const score = this.scoreLargeHand(largeOfAKind, 'of_a_kind');
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
                const score = this.scoreOfAKindHand(ofAKind);
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
                        const score = this.scoreLargeHand(largeStraightFlush, 'straight_flush');
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

    // =============================================================================
    // WILD CARD OPTIMIZATION METHODS
    // TODO: PHASE 3 - Move to wild-card-optimizer.js
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
                const baseScore = this.getHandTypeScore(hand.strength.hand_rank[0]);
                const wildBonus = 10; // Bonus for using wild
                maxScore = Math.max(maxScore, baseScore + wildBonus);
            }
        }

        return maxScore;
    }

    // =============================================================================
    // SCORING METHODS
    // TODO: PHASE 2 - Move to arrangement-scorer.js
    // =============================================================================

    scoreArrangement(arrangement) {
        let score = 0;

        // Base points for winning hands (assuming average opponents)
        score += this.getBaseHandScore(arrangement.backStrength, 'back');
        score += this.getBaseHandScore(arrangement.middleStrength, 'middle');
        score += this.getBaseHandScore(arrangement.frontStrength, 'front');

        // Bonus points
        score += this.getBonusPoints(arrangement.backStrength, arrangement.back.length, 'back');
        score += this.getBonusPoints(arrangement.middleStrength, arrangement.middle.length, 'middle');
        score += this.getBonusPoints(arrangement.frontStrength, arrangement.front.length, 'front');

        return score;
    }

    getBaseHandScore(handStrength, position) {
        // Estimate points for winning with this hand strength
        const rank = handStrength.hand_rank[0];

        if (position === 'back') {
            if (rank >= 8) return 3; // Strong hands likely to win
            if (rank >= 6) return 2; // Medium hands
            return 1; // Weak hands
        } else if (position === 'middle') {
            if (rank >= 7) return 3;
            if (rank >= 5) return 2;
            return 1;
        } else { // front
            if (rank >= 4) return 2;
            return 1;
        }
    }

    getBonusPoints(handStrength, cardCount, position) {
        const rank = handStrength.hand_rank[0];

        if (position === 'front') {
            if (cardCount === 3 && rank === 4) return 3; // Three of a kind
            if (cardCount === 5) {
                if (rank === 10) return 18; // Five of a kind
                if (rank === 9) return 15;  // Straight flush
                if (rank === 8) return 12;  // Four of a kind
                if (rank === 7) return 5;   // Full house
                if (rank >= 5) return 4;    // Straight/Flush
            }
        } else if (position === 'middle') {
            if (rank === 10) return 12; // Five of a kind
            if (rank === 9) return 10;  // Straight flush
            if (rank === 8) return 8;   // Four of a kind
            if (rank === 7) return 2;   // Full house
        } else if (position === 'back') {
            if (rank === 10) return 6;  // Five of a kind
            if (rank === 9) return 5;   // Straight flush
            if (rank === 8) return 4;   // Four of a kind
        }

        return 0;
    }

    scoreLargeHand(largeHand, type) {
        // Score based on actual game point values for back hand
        const length = largeHand.length;

        if (type === 'straight_flush') {
            // Back hand straight flush scores
            if (length === 8) return 14; // 8-card Straight Flush
            if (length === 7) return 11; // 7-card Straight Flush
            if (length === 6) return 8;  // 6-card Straight Flush
        } else if (type === 'of_a_kind') {
            // Back hand of-a-kind scores
            if (length === 8) return 18; // 8 of a Kind
            if (length === 7) return 14; // 7 of a Kind
            if (length === 6) return 10; // 6 of a Kind
        }

        return 0;
    }

    scoreOfAKindHand(ofAKind) {
        // Score based on actual game point values
        const length = ofAKind.length;
        if (length === 8) return 18; // 8 of a Kind (back hand)
        if (length === 7) return 14; // 7 of a Kind (back hand)
        if (length === 6) return 10; // 6 of a Kind (back hand)
        if (length === 5) return 6;  // 5 of a Kind (back hand)
        if (length === 4) return 4;  // 4 of a Kind (back hand)
        return 0;
    }

    getHandTypeScore(handRank) {
        // Score based on hand type (0-10 scale from card evaluation)
        const scores = {
            10: 1000, // Five of a kind
            9: 900,   // Straight flush
            8: 800,   // Four of a kind
            7: 700,   // Full house
            6: 600,   // Flush
            5: 500,   // Straight
            4: 400,   // Three of a kind
            3: 300,   // Two pair
            2: 200,   // One pair
            1: 100,   // High card
            0: 50     // High card (alternative)
        };
        return scores[handRank] || 0;
    }
}