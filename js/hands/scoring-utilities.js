// js/hands/scoring-utilities.js
// SINGLE SOURCE OF TRUTH for all Pyramid Poker scoring

class ScoringUtilities {

    // =============================================================================
    // CORE SCORING: Official Pyramid Poker point values
    // =============================================================================

static getPointsForHand(hand, position, cardCount = null) {
    const handName = hand.name ? hand.name.toLowerCase() : '';
    const numCards = cardCount || (hand.cards ? hand.cards.length : 5);
    const pos = position.toLowerCase();

    if (pos === 'front') {
        // Front hand scoring (3-5 cards)
        if (handName.includes('three of a kind')) return 3;
        if (handName.includes('straight flush')) return 15;
        if (handName.includes('flush')) return 4;
        if (handName.includes('straight') && !handName.includes('straight flush')) return 4;
        if (handName.includes('full house')) return 5;
        if (handName.includes('four of a kind')) return 12;
        if (handName.includes('five of a kind')) return 18;
        return 1; // High card, pair, two pair

    } else if (pos === 'middle') {
        // Check LARGE HANDS FIRST (6-7 cards)
        if (numCards >= 6) {
            if (handName.includes('straight flush')) {
                if (numCards === 6) return 16; // 2x back 6-card SF (8pts)
                if (numCards === 7) return 22; // 2x back 7-card SF (11pts)
            }
            if (handName.includes('of a kind')) {
                if (numCards === 6) return 20; // 2x back 6-of-a-kind (10pts)
                if (numCards === 7) return 28; // 2x back 7-of-a-kind (14pts)
            }
        }

        // THEN check standard 5-card hands
        if (handName.includes('full house')) return 2;
        if (handName.includes('four of a kind')) return 8;
        if (handName.includes('straight flush')) return 10;
        if (handName.includes('five of a kind')) return 12;

        return 1; // Weaker hands (straight, flush, etc.)

    } else if (pos === 'back') {
        // Check LARGE HANDS FIRST (6-8 cards)
        if (numCards >= 6) {
            if (handName.includes('straight flush')) {
                if (numCards === 6) return 8;  // 6-card Straight Flush
                if (numCards === 7) return 11; // 7-card Straight Flush
                if (numCards === 8) return 14; // 8-card Straight Flush
            }
            if (handName.includes('of a kind')) {
                if (numCards === 6) return 10; // 6 of a Kind
                if (numCards === 7) return 14; // 7 of a Kind
                if (numCards === 8) return 18; // 8 of a Kind
            }
        }

        // THEN check standard 5-card hands
        if (handName.includes('four of a kind')) return 4;
        if (handName.includes('straight flush')) return 5;  // 5-card SF
        if (handName.includes('five of a kind')) return 6;

        return 1; // Weaker hands (full house, flush, straight, etc.)
    }

    return 1; // Default fallback
}

    // =============================================================================
    // PROBABILITY ESTIMATION
    // =============================================================================

    static estimateWinProbability(handStrength, position, playerCount = 4) {
        // Estimate based on hand rank (0-10 scale) and position
        const rank = handStrength.hand_rank[0];

        // Base probabilities for 4-player game (adjustable for different player counts)
        const baseProbabilities = {
            10: 0.85, // Five of a kind - very likely to win
            9: 0.75,  // Straight flush - strong
            8: 0.65,  // Four of a kind - good
            7: 0.55,  // Full house - decent
            6: 0.45,  // Flush - okay
            5: 0.40,  // Straight - okay
            4: 0.35,  // Three of a kind - weak
            3: 0.25,  // Two pair - weak
            2: 0.20,  // One pair - very weak
            1: 0.15,  // High card - very weak
            0: 0.10   // Fallback
        };

        let probability = baseProbabilities[rank] || 0.10;

        // Adjust for player count
        if (playerCount !== 4) {
            const adjustment = Math.pow(probability, (playerCount - 1) / 3);
            probability = adjustment;
        }

        // Position adjustments
        const pos = position.toLowerCase();
        if (pos === 'front') {
            // Front hands are harder to win with weaker hands
            if (rank < 4) probability *= 0.8;
        } else if (pos === 'back') {
            // Back hands with strong cards more likely to win
            if (rank >= 7) probability *= 1.1;
        }

        return Math.min(probability, 0.95); // Cap at 95%
    }

    // =============================================================================
    // EXPECTED VALUE CALCULATION
    // =============================================================================

    static getExpectedPoints(handStrength, cards, position, playerCount = 4) {
        // Expected points = (Win Probability) × (Points if Win)
        const winProbability = this.estimateWinProbability(handStrength, position, playerCount);
        const pointsIfWin = this.getPointsForHand(handStrength, position, cards.length);

        return winProbability * pointsIfWin;
    }

    // =============================================================================
    // FORMATTING AND DISPLAY HELPERS
    // =============================================================================

    static formatPointDisplay(hand, position, cardCount) {
        const points = this.getPointsForHand(hand, position, cardCount);

        // Show card count for large hands
        if (cardCount > 5) {
            return `${points} pts (${cardCount}-card)`;
        }

        return `${points} pts`;
    }

    static formatWinProbability(probability) {
        return `${(probability * 100).toFixed(1)}%`;
    }

    static formatExpectedPoints(expectedPoints) {
        return expectedPoints.toFixed(2);
    }

    // =============================================================================
    // VALIDATION HELPERS
    // =============================================================================

    static isValidArrangement(backStrength, middleStrength, frontStrength) {
        // Check if arrangement meets game rules: Back >= Middle >= Front
        const backRank = backStrength.hand_rank[0];
        const middleRank = middleStrength.hand_rank[0];
        const frontRank = frontStrength.hand_rank[0];

        // Allow some flexibility for same rank (e.g., back flush vs middle flush)
        return backRank >= middleRank && middleRank >= frontRank - 1;
    }

    static getArrangementValidationMessage(backStrength, middleStrength, frontStrength) {
        if (this.isValidArrangement(backStrength, middleStrength, frontStrength)) {
            return "✅ Valid arrangement";
        }

        const backRank = backStrength.hand_rank[0];
        const middleRank = middleStrength.hand_rank[0];
        const frontRank = frontStrength.hand_rank[0];

        if (backRank < middleRank) {
            return "❌ Back hand must be >= Middle hand";
        }
        if (middleRank < frontRank - 1) {
            return "❌ Middle hand must be >= Front hand";
        }

        return "❌ Invalid arrangement";
    }

    // =============================================================================
    // DEBUGGING AND ANALYSIS
    // =============================================================================

    static debugHandScoring(hand, position, cardCount, label = "") {
        console.log(`\n🎯 ${label} Hand Scoring Debug:`);
        console.log(`Position: ${position}`);
        console.log(`Hand: ${hand.name}`);
        console.log(`Cards: ${cardCount}`);
        console.log(`Points if Win: ${this.getPointsForHand(hand, position, cardCount)}`);
        console.log(`Win Probability: ${this.formatWinProbability(this.estimateWinProbability(hand, position))}`);
        console.log(`Expected Points: ${this.formatExpectedPoints(this.getExpectedPoints(hand, {length: cardCount}, position))}`);
    }

    // =============================================================================
    // QUICK REFERENCE TABLES (for debugging/verification)
    // =============================================================================

    static getPointsReferenceTable() {
        return {
            front: {
                "Three of a Kind": 3,
                "Flush": 4,
                "Straight": 4,
                "Full House": 5,
                "Four of a Kind": 12,
                "Straight Flush": 15,
                "Five of a Kind": 18
            },
            middle: {
                "Full House": 2,
                "Four of a Kind": 8,
                "Straight Flush": 10,
                "Five of a Kind": 12,
                "6-card Straight Flush": 16,
                "7-card Straight Flush": 22,
                "6 of a Kind": 20,
                "7 of a Kind": 28
            },
            back: {
                "Four of a Kind": 4,
                "Straight Flush": 5,
                "Five of a Kind": 6,
                "6-card Straight Flush": 8,
                "7-card Straight Flush": 11,
                "8-card Straight Flush": 14,
                "6 of a Kind": 10,
                "7 of a Kind": 14,
                "8 of a Kind": 18
            }
        };
    }

    static printPointsReference() {
        const table = this.getPointsReferenceTable();
        console.log("\n📊 Pyramid Poker Points Reference:");

        Object.keys(table).forEach(position => {
            console.log(`\n${position.toUpperCase()} HAND:`);
            Object.entries(table[position]).forEach(([hand, points]) => {
                console.log(`  ${hand}: ${points} points`);
            });
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoringUtilities;
}