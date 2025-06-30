// js/hands/hand-detector-metadata-reporter.js
// Comprehensive metadata reporting for HandDetector analysis
// Shows detailed breakdown of detected hands for debugging ArrangementGenerator

class HandDetectorMetadataReporter {
    constructor() {
        this.handTypeOrder = [
            'High Card',
            'Pair',
            'Two Pair',
            'Three of a Kind',
            'Straight',
            'Flush',
            'Full House',
            'Four of a Kind',
            'Five of a Kind',
            'Six of a Kind',
            'Seven of a Kind',
            'Eight of a Kind',
            'Straight Flush',
            '6-card Straight Flush',
            '7-card Straight Flush',
            '8-card Straight Flush'
        ];
    }

    /**
     * Generate comprehensive metadata report for HandDetector results
     * @param {Object} results - HandDetector.detectAllHands() results
     * @param {Array} originalCards - Original card array passed to detector
     */
    generateReport(results, originalCards) {
        console.log('\n📊 ======== HAND DETECTOR METADATA REPORT ========');

        // Basic counts
        this.reportBasicCounts(results, originalCards);

        // Hand type breakdown
        this.reportHandTypeBreakdown(results);

        // Position analysis
        this.reportPositionAnalysis(results);

        // Completion status
        this.reportCompletionStatus(results);

        // Card usage analysis
        this.reportCardUsage(results, originalCards);

        // Summary for ArrangementGenerator
        this.reportArrangementGeneratorSummary(results);

        console.log('📊 ======== END METADATA REPORT ========\n');
    }

    /**
     * Report basic counts
     */
    reportBasicCounts(results, originalCards) {
        console.log('🎯 BASIC COUNTS:');
        console.log(`  Cards dealt: ${originalCards.length}`);
        console.log(`  Total hands detected: ${results.total}`);
        console.log(`  Complete hands: ${results.completeHands}`);
        console.log(`  Incomplete hands: ${results.incompleteHands}`);
    }

    /**
     * Report breakdown by hand type
     */
    reportHandTypeBreakdown(results) {
        console.log('\n🃏 HAND TYPE BREAKDOWN:');

        const handTypeCounts = {};
        const handTypeByPosition = {};
        const handTypeByCompletion = {};

        // Initialize tracking objects
        this.handTypeOrder.forEach(type => {
            handTypeCounts[type] = 0;
            handTypeByPosition[type] = { front: 0, middle: 0, back: 0, multiple: 0 };
            handTypeByCompletion[type] = { complete: 0, incomplete: 0 };
        });

        // Count hands by type
        results.hands.forEach(hand => {
            const type = hand.handType;
            handTypeCounts[type] = (handTypeCounts[type] || 0) + 1;

            // Count by completion status
            if (hand.isIncomplete) {
                handTypeByCompletion[type].incomplete++;
            } else {
                handTypeByCompletion[type].complete++;
            }

            // Count by valid positions
            const positions = hand.validPositions || [];
            if (positions.length === 1) {
                const pos = positions[0];
                handTypeByPosition[type][pos]++;
            } else if (positions.length > 1) {
                handTypeByPosition[type].multiple++;
            }
        });

        // Display hand type breakdown
        Object.entries(handTypeCounts).forEach(([type, count]) => {
            const count = handTypeCounts[type];
            if (count > 0) {
                const complete = handTypeByCompletion[type].complete;
                const incomplete = handTypeByCompletion[type].incomplete;
                const positions = handTypeByPosition[type];

                console.log(`  ${type}: ${count} total`);
                console.log(`    Complete: ${complete}, Incomplete: ${incomplete}`);
                console.log(`    Positions - Front only: ${positions.front}, Middle only: ${positions.middle}, Back only: ${positions.back}, Multiple: ${positions.multiple}`);
            }
        });
    }

    /**
     * Report position analysis
     */
    reportPositionAnalysis(results) {
        console.log('\n📍 POSITION ANALYSIS:');

        const positionCounts = {
            front: 0,
            middle: 0,
            back: 0,
            frontOnly: 0,
            middleOnly: 0,
            backOnly: 0,
            multiple: 0
        };

        results.hands.forEach(hand => {
            const positions = hand.validPositions || [];

            // Count total eligible for each position
            if (positions.includes('front')) positionCounts.front++;
            if (positions.includes('middle')) positionCounts.middle++;
            if (positions.includes('back')) positionCounts.back++;

            // Count exclusive positions
            if (positions.length === 1) {
                if (positions[0] === 'front') positionCounts.frontOnly++;
                else if (positions[0] === 'middle') positionCounts.middleOnly++;
                else if (positions[0] === 'back') positionCounts.backOnly++;
            } else if (positions.length > 1) {
                positionCounts.multiple++;
            }
        });

        console.log(`  Front eligible: ${positionCounts.front} hands`);
        console.log(`  Middle eligible: ${positionCounts.middle} hands`);
        console.log(`  Back eligible: ${positionCounts.back} hands`);
        console.log(`  Front only: ${positionCounts.frontOnly} hands`);
        console.log(`  Middle only: ${positionCounts.middleOnly} hands`);
        console.log(`  Back only: ${positionCounts.backOnly} hands`);
        console.log(`  Multiple positions: ${positionCounts.multiple} hands`);
    }

    /**
     * Report completion status details
     */
    reportCompletionStatus(results) {
        console.log('\n✅ COMPLETION STATUS:');

        const incompleteByType = {};
        const incompleteByPosition = {};
        const kickerRequirements = {};

        results.hands.forEach(hand => {
            if (hand.isIncomplete) {
                // Count by hand type
                incompleteByType[hand.handType] = (incompleteByType[hand.handType] || 0) + 1;

                // Count by position requirements
                const positions = hand.validPositions || [];
                positions.forEach(pos => {
                    incompleteByPosition[pos] = (incompleteByPosition[pos] || 0) + 1;
                });

                // Track kicker requirements
                if (hand.kickersNeeded) {
                    Object.entries(hand.kickersNeeded).forEach(([pos, count]) => {
                        const key = `${pos}_${count}`;
                        kickerRequirements[key] = (kickerRequirements[key] || 0) + 1;
                    });
                }
            }
        });

        console.log(`  Complete hands: ${results.completeHands} (ready for ArrangementGenerator)`);
        console.log(`  Incomplete hands: ${results.incompleteHands} (need kicker handling)`);

        if (Object.keys(incompleteByType).length > 0) {
            console.log('  Incomplete by type:');
            Object.entries(incompleteByType).forEach(([type, count]) => {
                console.log(`    ${type}: ${count}`);
            });

            console.log('  Incomplete by position:');
            Object.entries(incompleteByPosition).forEach(([pos, count]) => {
                console.log(`    ${pos}: ${count}`);
            });

            console.log('  Kicker requirements:');
            Object.entries(kickerRequirements).forEach(([key, count]) => {
                const [pos, kickerCount] = key.split('_');
                console.log(`    ${pos} position needs ${kickerCount} kickers: ${count} hands`);
            });
        }
    }

    /**
     * Report card usage analysis
     */
    reportCardUsage(results, originalCards) {
        console.log('\n🃏 CARD USAGE ANALYSIS:');

        const cardUsageCount = {};
        const handSizeDistribution = {};

        // Track how many times each card appears in hands
        results.hands.forEach(hand => {
            // Count hand sizes
            const size = hand.cardCount;
            handSizeDistribution[size] = (handSizeDistribution[size] || 0) + 1;

            // Count card usage
            hand.cards.forEach(card => {
                const cardId = `${card.rank}${card.suit}`;
                cardUsageCount[cardId] = (cardUsageCount[cardId] || 0) + 1;
            });
        });

        console.log('  Hand size distribution:');
        Object.entries(handSizeDistribution)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .forEach(([size, count]) => {
                console.log(`    ${size} cards: ${count} hands`);
            });

        console.log(`  Card reuse: ${Object.keys(cardUsageCount).length} unique cards in hands`);
        console.log(`  Original cards: ${originalCards.length}`);

        // Find most/least used cards
        const usageCounts = Object.values(cardUsageCount);
        if (usageCounts.length > 0) {
            const maxUsage = Math.max(...usageCounts);
            const minUsage = Math.min(...usageCounts);
            console.log(`  Max card usage: ${maxUsage} hands`);
            console.log(`  Min card usage: ${minUsage} hands`);
        }
    }

    /**
     * Report summary for ArrangementGenerator
     */
    reportArrangementGeneratorSummary(results) {
        console.log('\n🎯 ARRANGEMENT GENERATOR SUMMARY:');

        const frontHands = results.hands.filter(h => h.validPositions && h.validPositions.includes('front'));
        const middleHands = results.hands.filter(h => h.validPositions && h.validPositions.includes('middle'));
        const backHands = results.hands.filter(h => h.validPositions && h.validPositions.includes('back'));

        const completeHands = results.hands.filter(h => !h.isIncomplete);
        const incompleteHands = results.hands.filter(h => h.isIncomplete);

        console.log(`  Total hands for combination: ${results.total}`);
        console.log(`  Front eligible: ${frontHands.length} hands`);
        console.log(`  Middle eligible: ${middleHands.length} hands`);
        console.log(`  Back eligible: ${backHands.length} hands`);
        console.log(`  Complete hands: ${completeHands.length} (no kicker logic needed)`);
        console.log(`  Incomplete hands: ${incompleteHands.length} (will need kicker handling)`);

        // Estimate combination space (rough calculation)
        const roughCombinations = frontHands.length * middleHands.length * backHands.length;
        console.log(`  Rough combination space: ${roughCombinations.toLocaleString()} (before filtering)`);

        if (roughCombinations > 1000000) {
            console.log(`  ⚠️ Large combination space - may need optimization`);
        } else if (roughCombinations > 100000) {
            console.log(`  ⚠️ Moderate combination space - performance monitoring recommended`);
        } else {
            console.log(`  ✅ Manageable combination space`);
        }
    }
}

// Helper function to generate report for HandDetector results
function reportHandDetectorMetadata(results, originalCards) {
    const reporter = new HandDetectorMetadataReporter();
    reporter.generateReport(results, originalCards);
}

// Export for use
if (typeof module !== 'undefined') {
    module.exports = { HandDetectorMetadataReporter, reportHandDetectorMetadata };
}