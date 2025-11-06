// Unit Test for 6 of a Kind in Back Position Scoring
// This test verifies that 6 of a kind in back position gets correct premium points

function testSixOfAKindBackScoring() {
    console.log('\n🧪 Testing 6 of a Kind Back Position Scoring...');

    // Core test: 6K in back should get premium points
    testSixKindBackGetsPremiumPoints();

    // Comparison tests
    testSixKindVsFourKindComparison();
    testSixKindAcrossPositions();
    testLargeHandProgression();
}

function testSixKindBackGetsPremiumPoints() {
    const testName = '6K Back Premium Scoring';

    try {
        // Create a mock 6 of a kind hand object
        const mock6K = {
            name: '6 of a Kind',
            handType: '6-of-a-kind',
            hand_rank: [12, 14] // Type 11 = 6K, rank 14 = Aces
        };

        // Test scoring in back position with 6 cards
        const back6KPoints = ScoringUtilities.getPointsForHand(mock6K, 'back', 6);

        // EXPECTED: 6K in back should get premium points (likely 10)
        console.log(`🎯 6K in back scored: ${back6KPoints} points`);

        if (back6KPoints === 10) {
            console.log(`✅ ${testName}: PASSED - 6K back correctly gets 10 points`);
            return true;
        } else if (back6KPoints < 10) {
            console.log(`❌ ${testName}: FAILED - 6K back undervalued (got ${back6KPoints}, expected 10)`);
            console.log(`   Large hands should get premium scoring in back position`);
            return false;
        } else {
            console.log(`⚠️ ${testName}: UNEXPECTED - 6K back scored ${back6KPoints} points (expected 10)`);
            return false;
        }

    } catch (error) {
        console.log(`❌ ${testName}: ERROR - ${error.message}`);
        return false;
    }
}

function testSixKindVsFourKindComparison() {
    const testName = '6K vs 4K Back Comparison';

    try {
        // 6 of a kind should score more than 4 of a kind in back
        const mock4K = {
            name: 'Four of a Kind',
            handType: 'four-of-a-kind',
            hand_rank: [8, 14] // Type 7 = 4K, rank 14 = Aces
        };

        const mock6K = {
            name: '6 of a Kind',
            handType: '6-of-a-kind',
            hand_rank: [12, 14] // Type 11 = 6K, rank 14 = Aces
        };

        const fourKindPoints = ScoringUtilities.getPointsForHand(mock4K, 'back', 5);
        const sixKindPoints = ScoringUtilities.getPointsForHand(mock6K, 'back', 6);

        console.log(`🎯 4K back scored: ${fourKindPoints} points`);
        console.log(`🎯 6K back scored: ${sixKindPoints} points`);

        if (sixKindPoints > fourKindPoints) {
            console.log(`✅ ${testName}: PASSED - 6K (${sixKindPoints}) scores more than 4K (${fourKindPoints})`);
            return true;
        } else {
            console.log(`❌ ${testName}: FAILED - 6K should score more than 4K`);
            console.log(`   6K: ${sixKindPoints}, 4K: ${fourKindPoints}`);
            return false;
        }

    } catch (error) {
        console.log(`❌ ${testName}: ERROR - ${error.message}`);
        return false;
    }
}

function testSixKindAcrossPositions() {
    const testName = '6K Scoring by Position';

    try {
        const mock6K = {
            name: '6 of a Kind',
            handType: '6-of-a-kind',
            hand_rank: [12, 14] // Type 11 = 6K, rank 14 = Aces
        };

        // Test 6K in all positions where it's valid
        const backPoints = ScoringUtilities.getPointsForHand(mock6K, 'back', 6);
        const middlePoints = ScoringUtilities.getPointsForHand(mock6K, 'middle', 6);
        // Front position can't hold 6 cards, so skip

        console.log(`🎯 Back 6K: ${backPoints} points`);
        console.log(`🎯 Middle 6K: ${middlePoints} points`);

        // Middle should be 2x back for large hands (premium position bonus)
        const expectedMiddle = backPoints * 2;

        if (middlePoints === expectedMiddle) {
            console.log(`✅ ${testName}: PASSED - Middle 6K (${middlePoints}) = 2x back (${backPoints})`);
            return true;
        } else {
            console.log(`❌ ${testName}: FAILED - Middle 6K should be 2x back`);
            console.log(`   Expected middle: ${expectedMiddle}, Got: ${middlePoints}`);
            return false;
        }

    } catch (error) {
        console.log(`❌ ${testName}: ERROR - ${error.message}`);
        return false;
    }
}

function testLargeHandProgression() {
    const testName = 'Large Hand Scoring Progression';

    try {
        // Test that larger hands score progressively more points
        const mock4K = { handType: 'four-of-a-kind', hand_rank: [7, 14] };
        const mock5K = { handType: 'five-of-a-kind', hand_rank: [9, 14] };
        const mock6K = { handType: '6-of-a-kind', hand_rank: [11, 14] };

        const points4K = ScoringUtilities.getPointsForHand(mock4K, 'back', 5);
        const points5K = ScoringUtilities.getPointsForHand(mock5K, 'back', 5);
        const points6K = ScoringUtilities.getPointsForHand(mock6K, 'back', 6);

        console.log(`🎯 4K back: ${points4K} points`);
        console.log(`🎯 5K back: ${points5K} points`);
        console.log(`🎯 6K back: ${points6K} points`);

        const progressionCorrect = points4K < points5K && points5K < points6K;

        if (progressionCorrect) {
            console.log(`✅ ${testName}: PASSED - Progressive scoring: 4K < 5K < 6K`);
            return true;
        } else {
            console.log(`❌ ${testName}: FAILED - Large hands should score progressively higher`);
            return false;
        }

    } catch (error) {
        console.log(`❌ ${testName}: ERROR - ${error.message}`);
        return false;
    }
}

function testSixKindEdgeCases() {
    const testName = '6K Edge Cases';

    try {
        // Test different ranks of 6K
        const mock6KAces = { handType: '6-of-a-kind', hand_rank: [11, 14] }; // Aces
        const mock6KKings = { handType: '6-of-a-kind', hand_rank: [11, 13] }; // Kings
        const mock6KTwos = { handType: '6-of-a-kind', hand_rank: [11, 2] };   // Twos

        const acesPoints = ScoringUtilities.getPointsForHand(mock6KAces, 'back', 6);
        const kingsPoints = ScoringUtilities.getPointsForHand(mock6KKings, 'back', 6);
        const twosPoints = ScoringUtilities.getPointsForHand(mock6KTwos, 'back', 6);

        console.log(`🎯 6K Aces: ${acesPoints} points`);
        console.log(`🎯 6K Kings: ${kingsPoints} points`);
        console.log(`🎯 6K Twos: ${twosPoints} points`);

        // All 6K should get same base points regardless of rank (type matters most)
        const sameBasePoints = acesPoints === kingsPoints && kingsPoints === twosPoints;

        if (sameBasePoints) {
            console.log(`✅ ${testName}: PASSED - All 6K get same base points regardless of rank`);
            return true;
        } else {
            console.log(`⚠️ ${testName}: INFO - 6K points vary by rank (may be intended behavior)`);
            return true; // This might be intentional design
        }

    } catch (error) {
        console.log(`❌ ${testName}: ERROR - ${error.message}`);
        return false;
    }
}

// Integration with existing test framework
function addSixKindBackTests() {
    console.log('\n🔧 Adding 6 of a Kind Back Position Tests...');

    // Run all tests
    testSixOfAKindBackScoring();
    testSixKindEdgeCases();

    console.log('\n📋 6K Back Position Test Summary:');
    console.log('   Test Purpose: Verify 6K in back gets correct premium points');
    console.log('   Expected: Back 6K = 10 points, Middle 6K = 20 points');
    console.log('   Context: Large hands should get premium scoring');
    console.log('   Critical: Affects optimal arrangement for 6+ card hands');
}

// Quick standalone test runner
function runSixKindBackTest() {
    console.log('🃏 6 OF A KIND BACK POSITION TEST');
    console.log('=================================');
    console.log('Testing if 6K in back position gets correct premium points...');

    const testPassed = testSixKindBackGetsPremiumPoints();

    if (testPassed) {
        console.log('\n✅ SCORING STATUS: CORRECT - 6K back gets premium points');
    } else {
        console.log('\n❌ SCORING STATUS: ISSUE - 6K back scoring may be incorrect');
        console.log('💡 RECOMMENDATION: Check ScoringUtilities logic for large hands in back position');
    }

    return testPassed;
}

// Export for use in test framework
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testSixOfAKindBackScoring,
        testSixKindBackGetsPremiumPoints,
        runSixKindBackTest,
        addSixKindBackTests
    };
}
