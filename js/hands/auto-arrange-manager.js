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

    // TODO: The following methods will be moved to other files in upcoming phases
    // Keeping them here temporarily to maintain functionality

    findLargeHandArrangement(allCards) {
        // PHASE 4: Will move to large-hand-detector.js
        const { wildCards } = CardUtilities.separateWildCards(allCards);

        if (wildCards.length === 1) {
            return this.findLargeHandWithOneWild(allCards, wildCards[0]);
        } else {
            return this.findLargeHandWithoutWilds(allCards);
        }
    }

    optimizeWildForSmallHands(allCards, wildCard) {
        // PHASE 3: Will move to wild-card-optimizer.js
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

    scoreArrangement(arrangement) {
        // PHASE 2: Will move to arrangement-scorer.js
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

    // Additional methods temporarily kept here...
    // (All the remaining methods from the original file)
}