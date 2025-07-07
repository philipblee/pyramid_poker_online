// js/hands/arrangement-scorer.js
// CLEAN VERSION: Uses ScoringUtilities as single source of truth

class ArrangementScorer {

    // =============================================================================
    // ARRANGEMENT EVALUATION: Uses ScoringUtilities for all calculations
    // =============================================================================

    static scoreArrangement(arrangement) {
        // Calculate EXPECTED POINTS based on hand strengths and win probabilities
        let expectedPoints = 0;

        // Get expected points for each position using ScoringUtilities
        expectedPoints += ScoringUtilities.getExpectedPoints(
            arrangement.backStrength,
            arrangement.back,
            'back'
        );

        expectedPoints += ScoringUtilities.getExpectedPoints(
            arrangement.middleStrength,
            arrangement.middle,
            'middle'
        );

        expectedPoints += ScoringUtilities.getExpectedPoints(
            arrangement.frontStrength,
            arrangement.front,
            'front'
        );

        // Add strategic bonuses
        expectedPoints += this.getStrategicBonuses(arrangement);

        return Math.round(expectedPoints * 100) / 100; // Round to 2 decimals
    }

    static getStrategicBonuses(arrangement) {
        let bonus = 0;

        // Bonus for valid arrangement (meets ordering requirements)
        if (ScoringUtilities.isValidArrangement(
            arrangement.backStrength,
            arrangement.middleStrength,
            arrangement.frontStrength
        )) {
            bonus += 0.5;
        }

        // Bonus for efficient card usage (no waste)
        const totalCards = arrangement.back.length + arrangement.middle.length + arrangement.front.length;
        if (totalCards === 17) {
            bonus += 0.3;
        }

        // Bonus for front hand optimization (4+ point potential)
        const frontPoints = ScoringUtilities.getPointsForHand(
            arrangement.frontStrength,
            'front',
            arrangement.front.length
        );
        if (frontPoints >= 4 && arrangement.front.length >= 4) {
            bonus += 0.5; // Good front hand strategy
        }

        // Bonus for large hand utilization
        if (arrangement.back.length >= 6 || arrangement.middle.length >= 6) {
            bonus += 0.3; // Reward for using large hands effectively
        }

        return bonus;
    }

    // =============================================================================
    // ANALYSIS AND COMPARISON
    // =============================================================================

    static analyzeArrangementValue(arrangement) {
        const totalScore = this.scoreArrangement(arrangement);

        return {
            totalScore: totalScore,
            breakdown: {
                back: {
                    expectedPoints: ScoringUtilities.getExpectedPoints(
                        arrangement.backStrength, arrangement.back, 'back'
                    ),
                    winProbability: ScoringUtilities.estimateWinProbability(
                        arrangement.backStrength, 'back'
                    ),
                    pointsIfWin: ScoringUtilities.getPointsForHand(
                        arrangement.backStrength, 'back', arrangement.back.length
                    ),
                    handType: arrangement.backStrength.name,
                    cardCount: arrangement.back.length
                },
                middle: {
                    expectedPoints: ScoringUtilities.getExpectedPoints(
                        arrangement.middleStrength, arrangement.middle, 'middle'
                    ),
                    winProbability: ScoringUtilities.estimateWinProbability(
                        arrangement.middleStrength, 'middle'
                    ),
                    pointsIfWin: ScoringUtilities.getPointsForHand(
                        arrangement.middleStrength, 'middle', arrangement.middle.length
                    ),
                    handType: arrangement.middleStrength.name,
                    cardCount: arrangement.middle.length
                },
                front: {
                    expectedPoints: ScoringUtilities.getExpectedPoints(
                        arrangement.frontStrength, arrangement.front, 'front'
                    ),
                    winProbability: ScoringUtilities.estimateWinProbability(
                        arrangement.frontStrength, 'front'
                    ),
                    pointsIfWin: ScoringUtilities.getPointsForHand(
                        arrangement.frontStrength, 'front', arrangement.front.length
                    ),
                    handType: arrangement.frontStrength.name,
                    cardCount: arrangement.front.length
                }
            },
            strategicBonuses: this.getStrategicBonuses(arrangement),
            isValid: ScoringUtilities.isValidArrangement(
                arrangement.backStrength,
                arrangement.middleStrength,
                arrangement.frontStrength
            ),
            validationMessage: ScoringUtilities.getArrangementValidationMessage(
                arrangement.backStrength,
                arrangement.middleStrength,
                arrangement.frontStrength
            )
        };
    }

    static compareArrangements(arrangement1, arrangement2) {
        const score1 = this.scoreArrangement(arrangement1);
        const score2 = this.scoreArrangement(arrangement2);

        return {
            better: score1 > score2 ? 'arrangement1' : score2 > score1 ? 'arrangement2' : 'tie',
            scoreDifference: Math.abs(score1 - score2),
            arrangement1Score: score1,
            arrangement2Score: score2,
            arrangement1Analysis: this.analyzeArrangementValue(arrangement1),
            arrangement2Analysis: this.analyzeArrangementValue(arrangement2)
        };
    }

    // =============================================================================
    // STRATEGIC ANALYSIS HELPERS
    // =============================================================================

    static getArrangementStrategicValue(arrangement) {
        // Beyond expected points, what strategic value does this arrangement have?
        const analysis = this.analyzeArrangementValue(arrangement);

        return {
            riskLevel: this.assessRiskLevel(arrangement),
            flexibilityScore: this.assessFlexibility(arrangement),
            competitiveAdvantage: this.assessCompetitiveAdvantage(arrangement),
            overallRating: this.getOverallRating(analysis)
        };
    }

    static assessRiskLevel(arrangement) {
        // How risky is this arrangement? (high variance vs safe)
        const frontWinProb = ScoringUtilities.estimateWinProbability(arrangement.frontStrength, 'front');
        const middleWinProb = ScoringUtilities.estimateWinProbability(arrangement.middleStrength, 'middle');
        const backWinProb = ScoringUtilities.estimateWinProbability(arrangement.backStrength, 'back');

        const avgWinProb = (frontWinProb + middleWinProb + backWinProb) / 3;

        if (avgWinProb > 0.7) return "Low Risk";
        if (avgWinProb > 0.4) return "Medium Risk";
        return "High Risk";
    }

    static assessFlexibility(arrangement) {
        // How much flexibility was maintained? (based on large hands usage)
        const largeHandCount = [arrangement.back, arrangement.middle, arrangement.front]
            .filter(hand => hand.length > 5).length;

        if (largeHandCount >= 2) return "High Flexibility";
        if (largeHandCount === 1) return "Medium Flexibility";
        return "Low Flexibility";
    }

    static assessCompetitiveAdvantage(arrangement) {
        // How likely is this to beat typical opponents?
        const totalExpected = this.scoreArrangement(arrangement);

        if (totalExpected > 8) return "Strong Advantage";
        if (totalExpected > 5) return "Moderate Advantage";
        if (totalExpected > 3) return "Slight Advantage";
        return "Weak Position";
    }

    static getOverallRating(analysis) {
        // A-F rating based on multiple factors
        const score = analysis.totalScore;
        const valid = analysis.isValid;

        if (!valid) return "F - Invalid";
        if (score > 10) return "A - Excellent";
        if (score > 8) return "B - Very Good";
        if (score > 6) return "C - Good";
        if (score > 4) return "D - Fair";
        return "F - Poor";
    }

    // =============================================================================
    // DEBUGGING AND LOGGING
    // =============================================================================

    static debugArrangement(arrangement, label = "Arrangement") {
        const analysis = this.analyzeArrangementValue(arrangement);
        const strategic = this.getArrangementStrategicValue(arrangement);

        console.log(`\n🎯 ${label} Analysis:`);
        console.log(`${analysis.validationMessage}`);
        console.log(`Total Expected Points: ${analysis.totalScore}`);
        console.log(`Overall Rating: ${strategic.overallRating}`);
        console.log(`Risk Level: ${strategic.riskLevel}`);
        console.log(`Competitive Advantage: ${strategic.competitiveAdvantage}`);

        console.log(`\nDetailed Breakdown:`);
        ['back', 'middle', 'front'].forEach(position => {
            const pos = analysis.breakdown[position];
            console.log(`  ${position.toUpperCase()}: ${pos.handType} (${pos.cardCount} cards)`);
            console.log(`    Win Probability: ${ScoringUtilities.formatWinProbability(pos.winProbability)}`);
            console.log(`    Points if Win: ${pos.pointsIfWin}`);
            console.log(`    Expected Points: ${ScoringUtilities.formatExpectedPoints(pos.expectedPoints)}`);
        });

        console.log(`\nStrategic Bonuses: +${analysis.strategicBonuses}`);

        return analysis;
    }

    static debugComparison(arrangement1, arrangement2, label1 = "Option 1", label2 = "Option 2") {
        const comparison = this.compareArrangements(arrangement1, arrangement2);

        console.log(`\n⚖️ Comparing ${label1} vs ${label2}:`);
        console.log(`${label1}: ${comparison.arrangement1Score} expected points`);
        console.log(`${label2}: ${comparison.arrangement2Score} expected points`);
        console.log(`Winner: ${comparison.better === 'arrangement1' ? label1 : comparison.better === 'arrangement2' ? label2 : 'Tie'}`);
        console.log(`Score Difference: ${comparison.scoreDifference.toFixed(2)} points`);

        return comparison;
    }
}