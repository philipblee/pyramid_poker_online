// js/arrange/hand-sorter.js v1
// Step 1 of ArrangementGenerator: Sort hands by strength (strongest first)

class HandSorter {
    /**
     * Sort hands by strength using hand_rank tuples (strongest first)
     * @param {Array} hands - Array of hand objects from HandDetector
     * @returns {Object} - Sorted hands with metadata
     */
    sortHandsByStrength(hands) {
//        console.log(`🔄 HandSorter: Sorting ${hands.length} hands by strength...`);

        if (!hands || hands.length === 0) {
            return {
                sortedHands: [],
                metadata: {
                    totalHands: 0,
                    strengthRange: { strongest: null, weakest: null }
                }
            };
        }

        // TO THIS (preserve all properties explicitly):
        const sorted = hands.map(hand => ({ ...hand })).sort((a, b) => {
             return this.compareHandRanks(b.handEvaluation.handStrength, a.handEvaluation.handStrength);
        });

        // Generate metadata
        const metadata = {
            totalHands: sorted.length,
            strengthRange: {
                strongest: {
                    handName: sorted[0]?.handEvaluation.name,
                    handType: sorted[0]?.handEvaluation.handType,
                    handStrength: sorted[0]?.handEvaluation.handStrength
                },
                weakest: {
                    handName: sorted[sorted.length - 1]?.handEvaluation.name,
                    handType: sorted[sorted.length - 1]?.handEvaluation.handType,
                    handStrength: sorted[sorted.length - 1]?.handEvaluation.handStrength
                }
            },
            handTypeDistribution: this.getHandTypeDistribution(sorted)
        };

//        console.log(`✅ HandSorter: Sorted ${sorted.length} hands`);
//        console.log(`   Strongest: ${metadata.strengthRange.strongest.handName}`);
//        console.log(`   Weakest: ${metadata.strengthRange.weakest.handName}`);

        return {
            sortedHands: sorted,
            metadata: metadata
        };
    }



    /**
     * Compare hand_rank tuples element by element
     * @param {Array} rankA - First hand rank tuple
     * @param {Array} rankB - Second hand rank tuple
     * @returns {number} - Comparison result (positive if A > B)
     */
    compareHandRanks(rankA, rankB) {
        // Handle missing ranks
        if (!rankA && !rankB) return 0;
        if (!rankA) return -1;
        if (!rankB) return 1;

        // Compare tuple elements in order
        const maxLength = Math.max(rankA.length, rankB.length);

        for (let i = 0; i < maxLength; i++) {
            const a = rankA[i] || 0;
            const b = rankB[i] || 0;

            if (a !== b) {
                return a - b;
            }
        }

        return 0; // Equal ranks
    }

    /**
     * Get distribution of hand types for metadata
     * @param {Array} sortedHands - Already sorted hands
     * @returns {Object} - Count of each hand type
     */
    getHandTypeDistribution(sortedHands) {
        const distribution = {};

        sortedHands.forEach(hand => {
            const type = hand.handEvaluation.name;
            distribution[type] = (distribution[type] || 0) + 1;
        });

        return distribution;
    }

    /**
     * Validate that hands are properly sorted (for testing)
     * @param {Array} sortedHands - Hands to validate
     * @returns {Object} - Validation result
     */
    validateSortOrder(sortedHands) {
        const issues = [];

        for (let i = 0; i < sortedHands.length - 1; i++) {
            const current = sortedHands[i];
            const next = sortedHands[i + 1];

            const comparison = this.compareHandRanks(current.handEvaluation.handStrength, next.handEvaluation.handStrength);

            if (comparison < 0) {
                issues.push({
                    index: i,
                    current: current.handEvaluation.name,
                    next: next.handEvaluation.name,
                    currentRank: current.handEvaluation.handStrength,
                    nextRank: next.handEvaluation.handStrength,
                    message: 'Sort order violation: weaker hand appears before stronger hand'
                });
            }
        }

        return {
            isValid: issues.length === 0,
            issues: issues,
            totalChecked: sortedHands.length - 1
        };
    }
}
