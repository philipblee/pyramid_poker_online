// js/hands/auto-arrange.js
// Auto-arrangement algorithms extracted from game.js

class AutoArrangeManager {
    constructor(game) {
        this.game = game;
    }

    smartAutoArrangeHand() {
        const currentPlayer = this.game.playerManager.getCurrentPlayer();
        const playerData = this.game.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        // Get all 17 cards
        const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];

        if (allCards.length !== 17) {
            console.error('Card count error:', allCards.length);
            return;
        }

        console.log('🧠 Smart Auto-Arrange starting...');

        // First check for 6-8 card special hands (straight flushes and of-a-kind)
        const largeHandArrangement = this.findLargeHandArrangement(allCards);
        if (largeHandArrangement) {
            console.log('🎯 Found large hand arrangement!');
            console.log('Back:', largeHandArrangement.back.map(c => c.rank + c.suit).join(', '));
            console.log('Middle:', largeHandArrangement.middle.map(c => c.rank + c.suit).join(', '));
            console.log('Front:', largeHandArrangement.front.map(c => c.rank + c.suit).join(', '));
            console.log('Staging:', largeHandArrangement.staging.map(c => c.rank + c.suit).join(', '));

            // Apply the arrangement
            playerData.back = largeHandArrangement.back;
            playerData.middle = largeHandArrangement.middle;
            playerData.front = largeHandArrangement.front;
            playerData.cards = largeHandArrangement.staging;

            this.game.loadCurrentPlayerHand();
            return;
        }

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

            this.game.loadCurrentPlayerHand();
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
        const currentPlayer = this.game.playerManager.getCurrentPlayer();
        const playerData = this.game.playerHands.get(currentPlayer.name);
        const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];
        const sortedCards = [...allCards].sort((a, b) => b.value - a.value);

        playerData.back = sortedCards.slice(0, 5);
        playerData.middle = sortedCards.slice(5, 10);
        playerData.front = sortedCards.slice(10, 13);
        playerData.cards = sortedCards.slice(13);

        this.game.loadCurrentPlayerHand();
    }

    // Simple auto-arrange (original method)
    autoArrangeHand() {
        const currentPlayer = this.game.playerManager.getCurrentPlayer();
        const playerData = this.game.playerHands.get(currentPlayer.name);

        if (!playerData) return;

        const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];

        if (allCards.length !== 17) {
            console.error('Card count debug:', {
                totalCards: allCards.length,
                inStaging: playerData.cards.length,
                inBack: playerData.back.length,
                inMiddle: playerData.middle.length,
                inFront: playerData.front.length
            });
            alert(`Card count error: Found ${allCards.length} cards instead of 17! Check console for details.`);
            return;
        }

        // Sort all cards and pick the best 13 for play, leave 4 best rejects in staging
        const sortedCards = [...allCards].sort((a, b) => b.value - a.value);

        // Take the best 13 cards for play
        const playCards = sortedCards.slice(0, 13);
        const stagingCards = sortedCards.slice(13, 17); // 4 worst cards stay in staging

        const backHand = playCards.slice(0, 5);   // 5 best cards
        const middleHand = playCards.slice(5, 10); // next 5 cards
        const frontHand = playCards.slice(10, 13); // next 3 cards

        playerData.cards = stagingCards; // 4 cards left in staging
        playerData.back = backHand;
        playerData.middle = middleHand;
        playerData.front = frontHand;

        this.game.loadCurrentPlayerHand();
    }

    findLargeHandArrangement(allCards) {
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

    findLargeStraightFlush(allCards) {
        // Group cards by suit
        const suitGroups = {};
        allCards.forEach(card => {
            if (!suitGroups[card.suit]) {
                suitGroups[card.suit] = [];
            }
            suitGroups[card.suit].push(card);
        });

        let bestStraightFlush = null;
        let bestLength = 0;

        // Check each suit for straight flushes
        for (const suit in suitGroups) {
            const suitCards = suitGroups[suit];
            if (suitCards.length >= 6) {
                // Sort by value (descending)
                suitCards.sort((a, b) => b.value - a.value);
                
                // Find longest straight flush
                const straightFlush = this.findLongestStraightFlush(suitCards);
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

    findLongestStraightFlush(suitCards) {
        if (suitCards.length < 5) return null;

        let longestStraight = [];
        let currentStraight = [suitCards[0]];

        for (let i = 1; i < suitCards.length; i++) {
            const current = suitCards[i];
            const previous = suitCards[i - 1];

            // Check if consecutive (accounting for duplicates from multiple decks)
            if (current.value === previous.value - 1) {
                currentStraight.push(current);
            } else if (current.value === previous.value) {
                // Skip duplicates
                continue;
            } else {
                // Break in sequence
                if (currentStraight.length >= 5 && currentStraight.length > longestStraight.length) {
                    longestStraight = [...currentStraight];
                }
                currentStraight = [current];
            }
        }

        // Check final sequence
        if (currentStraight.length >= 5 && currentStraight.length > longestStraight.length) {
            longestStraight = [...currentStraight];
        }

        return longestStraight.length >= 5 ? longestStraight : null;
    }

    findLargeOfAKind(allCards) {
        // Group cards by rank
        const rankGroups = {};
        allCards.forEach(card => {
            if (!rankGroups[card.rank]) {
                rankGroups[card.rank] = [];
            }
            rankGroups[card.rank].push(card);
        });

        // Find the largest group of same rank (6+ cards)
        let bestOfAKind = null;
        let bestLength = 0;

        for (const rank in rankGroups) {
            const rankCards = rankGroups[rank];
            if (rankCards.length >= 6 && rankCards.length > bestLength) {
                bestLength = rankCards.length;
                bestOfAKind = {
                    cards: rankCards,
                    type: 'of_a_kind',
                    length: rankCards.length,
                    rank: rank
                };
            }
        }

        return bestOfAKind;
    }

    scoreLargeHand(largeHand, type) {
        // Score based on type and length
        const length = largeHand.length;
        
        if (type === 'straight_flush') {
            // Straight flush scoring: exponential growth for longer hands
            if (length === 8) return 1000;
            if (length === 7) return 500;
            if (length === 6) return 250;
        } else if (type === 'of_a_kind') {
            // Of a kind scoring: also exponential
            if (length === 8) return 800;
            if (length === 7) return 400;
            if (length === 6) return 200;
        }

        return 0;
    }

    createLargeHandArrangement(allCards, largeHand) {
        const usedCards = new Set(largeHand.cards.map(c => c.id));
        const remainingCards = allCards.filter(c => !usedCards.has(c.id));

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
            const usedMiddleIds = new Set(middleCards.map(c => c.id));
            cardsAfterMiddle = remainingCards.filter(c => !usedMiddleIds.has(c.id));
        } else {
            // Fallback: take 5 best remaining cards
            const sortedRemaining = [...remainingCards].sort((a, b) => b.value - a.value);
            middleCards = sortedRemaining.slice(0, 5);
            cardsAfterMiddle = sortedRemaining.slice(5);
        }

        // Front hand: take 3 best remaining cards
        const sortedAfterMiddle = [...cardsAfterMiddle].sort((a, b) => b.value - a.value);
        const frontCards = sortedAfterMiddle.slice(0, 3);
        const stagingCards = sortedAfterMiddle.slice(3);

        return {
            back: backHand,
            middle: middleCards,
            front: frontCards,
            staging: stagingCards
        };
    }
}