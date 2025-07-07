// Smart Hand Analyzer for Auto-Arrange (No Wilds)
// Add this to a new file: js/hand-analyzer.js

class HandAnalyzer {
    constructor(cards) {
        this.cards = cards.filter(c => !c.isWild); // Skip wilds for now
        this.possibleHands = [];
    }

    // Find all possible 5-card poker hands
    findAllPossibleHands() {
        this.possibleHands = [];

        // Generate all possible 5-card combinations
        const combinations = this.generateCombinations(this.cards, 5);

        combinations.forEach(combo => {
            const handStrength = evaluateHand(combo);
            this.possibleHands.push({
                cards: combo,
                strength: handStrength,
                handRank: handStrength.hand_rank[0], // Primary rank (9=SF, 8=4K, etc.)
                description: handStrength.name
            });
        });

        // Sort by strength (strongest first)
        this.possibleHands.sort((a, b) => {
            return this.compareHandStrengths(b.strength.hand_rank, a.strength.hand_rank);
        });

        return this.possibleHands;
    }

    // Find all possible 3-card poker hands
    findAllPossibleThreeCardHands() {
        const threeCardHands = [];
        const combinations = this.generateCombinations(this.cards, 3);

        combinations.forEach(combo => {
            const handStrength = evaluateThreeCardHand(combo);
            threeCardHands.push({
                cards: combo,
                strength: handStrength,
                handRank: handStrength.hand_rank[0],
                description: handStrength.name
            });
        });

        // Sort by strength
        threeCardHands.sort((a, b) => {
            return this.compareHandStrengths(b.strength.hand_rank, a.strength.hand_rank);
        });

        return threeCardHands;
    }

    // Generate all combinations of r cards from the deck
    generateCombinations(cards, r) {
        if (r > cards.length) return [];
        if (r === 1) return cards.map(card => [card]);
        if (r === cards.length) return [cards];

        const combinations = [];

        for (let i = 0; i <= cards.length - r; i++) {
            const first = cards[i];
            const remaining = cards.slice(i + 1);
            const subCombinations = this.generateCombinations(remaining, r - 1);

            subCombinations.forEach(subCombo => {
                combinations.push([first, ...subCombo]);
            });
        }

        return combinations;
    }

    // Compare hand strengths (returns positive if hand1 > hand2)
    compareHandStrengths(hand1Rank, hand2Rank) {
        for (let i = 0; i < Math.max(hand1Rank.length, hand2Rank.length); i++) {
            const rank1 = hand1Rank[i] || 0;
            const rank2 = hand2Rank[i] || 0;

            if (rank1 !== rank2) {
                return rank1 - rank2;
            }
        }
        return 0;
    }

    // Find hands by type
    findHandsByType(handType) {
        return this.possibleHands.filter(hand => hand.handRank === handType);
    }

    // Find straights
    findStraights() {
        return this.findHandsByType(5); // Straight = rank 5
    }

    // Find flushes
    findFlushes() {
        return this.findHandsByType(6); // Flush = rank 6
    }

    // Find full houses
    findFullHouses() {
        return this.findHandsByType(7); // Full House = rank 7
    }

    // Find four of a kinds
    findFourOfAKinds() {
        return this.findHandsByType(8); // Four of a Kind = rank 8
    }

    // Find straight flushes
    findStraightFlushes() {
        return this.findHandsByType(9); // Straight Flush = rank 9
    }

    // Get the strongest possible hands for arrangement
    getBestHandsForArrangement() {
        if (this.possibleHands.length === 0) {
            this.findAllPossibleHands();
        }

        // Group hands by strength tier
        const straightFlushes = this.findStraightFlushes();
        const fourOfAKinds = this.findFourOfAKinds();
        const fullHouses = this.findFullHouses();
        const flushes = this.findFlushes();
        const straights = this.findStraights();

        return {
            straightFlushes,
            fourOfAKinds,
            fullHouses,
            flushes,
            straights,
            allHands: this.possibleHands.slice(0, 20) // Top 20 hands
        };
    }

    // Find non-overlapping hands (no shared cards)
    findNonOverlappingHands(selectedHands = []) {
        const usedCards = new Set();
        selectedHands.forEach(hand => {
            hand.cards.forEach(card => usedCards.add(card.id));
        });

        return this.possibleHands.filter(hand => {
            return hand.cards.every(card => !usedCards.has(card.id));
        });
    }

    // Debug: Show analysis summary
    getAnalysisSummary() {
        const bestHands = this.getBestHandsForArrangement();

        return {
            totalCards: this.cards.length,
            totalPossibleHands: this.possibleHands.length,
            straightFlushes: bestHands.straightFlushes.length,
            fourOfAKinds: bestHands.fourOfAKinds.length,
            fullHouses: bestHands.fullHouses.length,
            flushes: bestHands.flushes.length,
            straights: bestHands.straights.length,
            bestHand: this.possibleHands[0]?.description || 'None'
        };
    }
}

// Usage example:
// const analyzer = new HandAnalyzer(playerCards);
// const analysis = analyzer.findAllPossibleHands();
// console.log('Best possible hands:', analysis.slice(0, 5));