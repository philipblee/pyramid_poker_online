// Smart Auto-Arrange Algorithm
// Add this to your ChinesePokerGame class (replace the existing autoArrangeHand method)

    smartAutoArrangeHand() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const playerData = this.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        // Get all 17 cards
        const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];

        if (allCards.length !== 17) {
            console.error('Card count error:', allCards.length);
            return;
        }

        console.log('🧠 Smart Auto-Arrange starting...');

        // Analyze all possible hands
        const analyzer = new HandAnalyzer(allCards);
        const allPossibleHands = analyzer.findAllPossibleHands();

        console.log(`Found ${allPossibleHands.length} possible 5-card hands`);

        // Find the best valid arrangement
        const bestArrangement = this.findBestArrangement(allCards, allPossibleHands);

        if (bestArrangement) {
            console.log('✨ Best arrangement found!');
            console.log('Back:', bestArrangement.back.map(c => c.rank + c.suit).join(', '));
            console.log('Middle:', bestArrangement.middle.map(c => c.rank + c.suit).join(', '));
            console.log('Front:', bestArrangement.front.map(c => c.rank + c.suit).join(', '));
            console.log('Staging:', bestArrangement.staging.map(c => c.rank + c.suit).join(', '));

            // Apply the arrangement
            playerData.back = bestArrangement.back;
            playerData.middle = bestArrangement.middle;
            playerData.front = bestArrangement.front;
            playerData.cards = bestArrangement.staging;

            this.loadCurrentPlayerHand();
        } else {
            console.log('❌ No valid arrangement found, falling back to simple sort');
            this.fallbackAutoArrange();
        }
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
            const usedFrontIds = new Set(frontHand.cards.map(c => c.id));
            const remainingCards = allCards.filter(c => !usedFrontIds.has(c.id));

            // Find possible middle hands from remaining cards
            const middleAnalyzer = new HandAnalyzer(remainingCards);
            const middleHands = middleAnalyzer.findAllPossibleHands().slice(0, 10);

            for (const middleHand of middleHands) {
                const usedMiddleIds = new Set(middleHand.cards.map(c => c.id));
                const cardsAfterMiddle = remainingCards.filter(c => !usedMiddleIds.has(c.id));

                // Find possible back hands from remaining cards
                const backAnalyzer = new HandAnalyzer(cardsAfterMiddle);
                const backHands = backAnalyzer.findAllPossibleHands().slice(0, 5);

                for (const backHand of backHands) {
                    // Check if this arrangement is valid (Back >= Middle >= Front)
                    if (this.isValidHandOrder(backHand, middleHand, frontHand)) {
                        const usedBackIds = new Set(backHand.cards.map(c => c.id));
                        const stagingCards = cardsAfterMiddle.filter(c => !usedBackIds.has(c.id));

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

        // Special case: 5-card front must be at least a straight
        if (frontHand.cards.length === 5) {
            if (frontRank[0] < 5) { // Less than straight
                return false;
            }
        }

        return backVsMiddle >= 0 && middleVsFront >= 0;
    }

    scoreArrangement(arrangement) {
        let score = 0;

        // Base points for winning hands (assuming average opponents)
        score += this.getBaseHandScore(arrangement.backStrength, 'back');
        score += this.getBaseHandScore(arrangement.middleStrength, 'middle');
        score += this.getBaseHandScore(arrangement.frontStrength, 'front');

        // Bonus points (same as calculateScores method)
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

    fallbackAutoArrange() {
        // Use the old simple method as fallback
        const currentPlayer = this.players[this.currentPlayerIndex];
        const playerData = this.playerHands.get(currentPlayer.name);
        const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];
        const sortedCards = [...allCards].sort((a, b) => b.value - a.value);

        playerData.back = sortedCards.slice(0, 5);
        playerData.middle = sortedCards.slice(5, 10);
        playerData.front = sortedCards.slice(10, 13);
        playerData.cards = sortedCards.slice(13);

        this.loadCurrentPlayerHand();
    }