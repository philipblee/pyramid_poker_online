// js/hands/arrangement-scorer.js

class ArrangementScorer {
    static scoreArrangement(arrangement) {
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

    static getBaseHandScore(handStrength, position) {
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

    static getBonusPoints(handStrength, cardCount, position) {
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

    static scoreLargeHand(largeHand, type) {
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

    static scoreOfAKindHand(ofAKind) {
        // Score based on actual game point values
        const length = ofAKind.length;
        if (length === 8) return 18; // 8 of a Kind (back hand)
        if (length === 7) return 14; // 7 of a Kind (back hand)
        if (length === 6) return 10; // 6 of a Kind (back hand)
        if (length === 5) return 6;  // 5 of a Kind (back hand)
        if (length === 4) return 4;  // 4 of a Kind (back hand)
        return 0;
    }

    static getHandTypeScore(handRank) {
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

    // =============================================================================
    // SCORING ANALYSIS UTILITIES
    // =============================================================================

    static analyzeArrangementValue(arrangement) {
        // Provides detailed breakdown of arrangement scoring
        const analysis = {
            totalScore: this.scoreArrangement(arrangement),
            breakdown: {
                back: {
                    base: this.getBaseHandScore(arrangement.backStrength, 'back'),
                    bonus: this.getBonusPoints(arrangement.backStrength, arrangement.back.length, 'back'),
                    handType: arrangement.backStrength.name,
                    cardCount: arrangement.back.length
                },
                middle: {
                    base: this.getBaseHandScore(arrangement.middleStrength, 'middle'),
                    bonus: this.getBonusPoints(arrangement.middleStrength, arrangement.middle.length, 'middle'),
                    handType: arrangement.middleStrength.name,
                    cardCount: arrangement.middle.length
                },
                front: {
                    base: this.getBaseHandScore(arrangement.frontStrength, 'front'),
                    bonus: this.getBonusPoints(arrangement.frontStrength, arrangement.front.length, 'front'),
                    handType: arrangement.frontStrength.name,
                    cardCount: arrangement.front.length
                }
            }
        };

        return analysis;
    }

    static compareArrangements(arrangement1, arrangement2) {
        // Compare two arrangements and return which is better
        const score1 = this.scoreArrangement(arrangement1);
        const score2 = this.scoreArrangement(arrangement2);

        return {
            better: score1 > score2 ? 'arrangement1' : score2 > score1 ? 'arrangement2' : 'tie',
            scoreDifference: Math.abs(score1 - score2),
            arrangement1Score: score1,
            arrangement2Score: score2
        };
    }

    static getExpectedWinRate(handStrength, position) {
        // Estimate win rate based on hand strength and position
        const rank = handStrength.hand_rank[0];

        // These are rough estimates for typical 4-player games
        const winRates = {
            back: {
                10: 0.95, 9: 0.90, 8: 0.85, 7: 0.75, 6: 0.65, 5: 0.55, 4: 0.45, 3: 0.35, 2: 0.25, 1: 0.15, 0: 0.10
            },
            middle: {
                10: 0.95, 9: 0.90, 8: 0.85, 7: 0.75, 6: 0.65, 5: 0.55, 4: 0.45, 3: 0.35, 2: 0.25, 1: 0.15, 0: 0.10
            },
            front: {
                10: 0.95, 9: 0.90, 8: 0.85, 7: 0.75, 6: 0.65, 5: 0.55, 4: 0.45, 3: 0.35, 2: 0.25, 1: 0.15, 0: 0.10
            }
        };

        return winRates[position][rank] || 0.10;
    }
}