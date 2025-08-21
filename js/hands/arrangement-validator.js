// js/hands/arrangement-validator.js
// Phase 6: Final validation logic extracted from auto-arrange.js

class ArrangementValidator {
    constructor(game) {
        this.game = game;
    }

    /**
     * Comprehensive final validation of any arrangement
     * @param {Object} arrangement - The arrangement to validate
     * @returns {boolean} - True if arrangement is valid and legal
     */
    validateFinalArrangement(arrangement) {
        // Re-evaluate hands to ensure they're still valid after any modifications
        const backStrength = evaluateHand(arrangement.back);
        const middleStrength = evaluateHand(arrangement.middle);
        const frontStrength = evaluateThreeCardHand(arrangement.front);

        // Check hand ordering (Back >= Middle >= Front)
        if (!this.validateHandOrder(backStrength, middleStrength, frontStrength)) {
            return false;
        }

        // Replace with delayed validation:
        setTimeout(() => {
            if (!this.validateHandSizes(arrangement)) {
                // show popup
            }
        }, 350); // Small delay to let arrangement update complete

        // Check large hands follow special rules
        if (!this.validateLargeHands(arrangement)) {
            return false;
        }

        // Check 5-card front hand constraint
        if (!this.validateFrontHandConstraint(arrangement, frontStrength)) {
            return false;
        }

        return true;
    }

    /**
     * Validate that hands are in correct strength order
     */
    validateHandOrder(backStrength, middleStrength, frontStrength) {
        const backVsMiddle = compareTuples(backStrength.hand_rank, middleStrength.hand_rank);
        const middleVsFront = compareTuples(middleStrength.hand_rank, frontStrength.hand_rank);

        if (backVsMiddle < 0 || middleVsFront < 0) {
            console.log('❌ Final validation: Invalid hand order');
            console.log(`Back: ${backStrength.name} (${backStrength.hand_rank.join(', ')})`);
            console.log(`Middle: ${middleStrength.name} (${middleStrength.hand_rank.join(', ')})`);
            console.log(`Front: ${frontStrength.name} (${frontStrength.hand_rank.join(', ')})`);
            return false;
        }

        return true;
    }

    /**
     * Validate that all hand sizes are legal
     */
    validateHandSizes(arrangement) {
        const backCount = arrangement.back.length;
        const middleCount = arrangement.middle.length;
        const frontCount = arrangement.front.length;

        // ADD: Check DOM state too
        const domBackCount = document.getElementById('backHand').children.length;
        const domMiddleCount = document.getElementById('middleHand').children.length;
        const domFrontCount = document.getElementById('frontHand').children.length;

        console.log('Arrangement object counts:', { backCount, middleCount, frontCount });
        console.log('DOM visual counts:', { domBackCount, domMiddleCount, domFrontCount });
        console.log('Arrangement object:', arrangement);

        const isValidBackSize = [5, 6, 7, 8].includes(backCount);
        const isValidMiddleSize = [5, 6, 7].includes(middleCount);
        const isValidFrontSize = frontCount === 3 || frontCount === 5;

        if (!isValidBackSize || !isValidMiddleSize || !isValidFrontSize) {
            console.log(`❌ Final validation: Invalid hand sizes: back=${backCount}, middle=${middleCount}, front=${frontCount}`);
            return false;
        }

        return true;
    }

    /**
     * Validate that 6+ card hands follow special rules
     */
    validateLargeHands(arrangement) {
        const backCount = arrangement.back.length;
        const middleCount = arrangement.middle.length;

        const isValidBackHand = backCount < 6 || this.game.validateLargeHand(arrangement.back);
        const isValidMiddleHand = middleCount < 6 || this.game.validateLargeHand(arrangement.middle);

        if (!isValidBackHand || !isValidMiddleHand) {
            console.log('❌ Final validation: Large hands do not follow special rules');
            return false;
        }

        return true;
    }

    /**
     * Validate 5-card front hand must be at least a straight
     */
    validateFrontHandConstraint(arrangement, frontStrength) {
        const frontCount = arrangement.front.length;

        if (frontCount === 5 && frontStrength.hand_rank[0] < 5) {
            console.log('❌ Final validation: 5-card front hand must be at least a straight');
            return false;
        }

        return true;
    }

    /**
     * Quick validation for testing - returns simple boolean
     */
    isValidArrangement(arrangement) {
        try {
            return this.validateFinalArrangement(arrangement);
        } catch (error) {
            console.log('❌ Validation error:', error.message);
            return false;
        }
    }
}
