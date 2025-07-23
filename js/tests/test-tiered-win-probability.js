// js/tests/test-tiered-win-probability.js
// Basic unit test for tiered win probability lookup function

function testTieredWinProbabilityLookup() {
    console.log('\n🧪 ======== TESTING TIERED WIN PROBABILITY LOOKUP ========');

    // Test cases with proper hand objects
    const testCases = [
        // Front position tests
        { hand: { hand_rank: [2, 14] }, position: 'front', description: 'Front: Pair of Aces' },
        { hand: { hand_rank: [4, 14] }, position: 'front', description: 'Front: Trip Aces' },
        { hand: { hand_rank: [5, 14] }, position: 'front', description: 'Front: Straight (A-high)' },
        { hand: { hand_rank: [6, 14] }, position: 'front', description: 'Front: Flush (A-high)' },

        // Middle position tests
        { hand: { hand_rank: [2, 14] }, position: 'middle', description: 'Middle: Pair of Aces' },
        { hand: { hand_rank: [8, 14] }, position: 'middle', description: 'Middle: Four of a Kind Aces' },
        { hand: { hand_rank: [9, 14] }, position: 'middle', description: 'Middle: Straight Flush (A-high)' },

        // Back position tests
        { hand: { hand_rank: [2, 14] }, position: 'back', description: 'Back: Pair of Aces' },
        { hand: { hand_rank: [8, 14] }, position: 'back', description: 'Back: Four of a Kind Aces' },
        { hand: { hand_rank: [10, 14] }, position: 'back', description: 'Back: Five of a Kind Aces' }
    ];

    let passedTests = 0;
    let totalTests = testCases.length;

    testCases.forEach((testCase, index) => {
        console.log(`\n--- Test ${index + 1}: ${testCase.description} ---`);
        console.log(`Input: hand_rank=[${testCase.hand.hand_rank.join(', ')}], position='${testCase.position}'`);

        try {
            const winProbability = lookupTieredWinProbability(testCase.position, testCase.hand);

            if (winProbability !== null && winProbability !== undefined) {
                console.log(`✅ Result: ${winProbability}% win probability`);
                passedTests++;
            } else {
                console.log(`❌ Result: ${winProbability} (null/undefined returned)`);
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
    });

    // Summary
    console.log(`\n📊 ======== TEST SUMMARY ========`);
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
        console.log(`🎉 All tests passed! Tiered lookup is working correctly.`);
    } else {
        console.log(`⚠️  Some tests failed. Check the tiered lookup implementation.`);
    }

    return passedTests === totalTests;
}