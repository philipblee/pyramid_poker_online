// js/tests/metadata-test-runner-breakdown.js
// Breaking down the test runner into small, testable functions

/**
 * STEP 1: Test card parsing
 * This function should parse cards correctly
 */
function testStep1_CardParsing() {
    console.log('🧪 STEP 1: Testing Card Parsing');

    const testCards = "A♠ A♥ A♦ A♣ K♠ Q♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠ 2♠ K♥";

    try {
        const framework = new HandDetectorTestFramework();
        const parsedCards = framework.parseCards(testCards);

        console.log(`✅ Parsed ${parsedCards.length} cards`);
        console.log(`✅ First card: ${parsedCards[0].rank}${parsedCards[0].suit}`);
        console.log(`✅ Last card: ${parsedCards[16].rank}${parsedCards[16].suit}`);

        return { success: true, cards: parsedCards };
    } catch (error) {
        console.log(`❌ Card parsing failed: ${error.message}`);
        return { success: false, error };
    }
}

/**
 * STEP 2: Test framework calculation
 * This should show the 4K calculation working
 */
function testStep2_FrameworkCalculation() {
    console.log('\n🧪 STEP 2: Testing Framework Calculation');

    const testCards = "A♠ A♥ A♦ A♣ K♠ Q♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠ 2♠ K♥";

    try {
        const framework = new HandDetectorTestFramework();
        const calculated = framework.calculateExpectedCounts(testCards);

        console.log(`✅ Calculation completed`);
        console.log(`✅ fourOfAKind calculated: ${calculated.fourOfAKind} (should be 13)`);
        console.log(`✅ total calculated: ${calculated.total}`);

        const success = calculated.fourOfAKind === 13;
        console.log(`✅ 4K calculation correct: ${success ? 'YES' : 'NO'}`);

        return { success, calculated };
    } catch (error) {
        console.log(`❌ Framework calculation failed: ${error.message}`);
        return { success: false, error };
    }
}

/**
 * STEP 3: Test HandDetector execution
 * This should run the actual detector
 */
function testStep3_HandDetectorExecution() {
    console.log('\n🧪 STEP 3: Testing HandDetector Execution');

    const testCards = "A♠ A♥ A♦ A♣ K♠ Q♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠ 2♠ K♥";

    try {
        const framework = new HandDetectorTestFramework();
        const parsedCards = framework.parseCards(testCards);

        const detector = new HandDetector(parsedCards);
        const results = detector.detectAllHands();

        const fourOfAKindHands = results.hands.filter(h => h.handType === 'Four of a Kind').length;

        console.log(`✅ HandDetector completed`);
        console.log(`✅ Total hands detected: ${results.total}`);
        console.log(`✅ fourOfAKind hands: ${fourOfAKindHands} (should be 13)`);

        const success = fourOfAKindHands === 13;
        console.log(`✅ HandDetector 4K correct: ${success ? 'YES' : 'NO'}`);

        return { success, results, fourOfAKindHands };
    } catch (error) {
        console.log(`❌ HandDetector execution failed: ${error.message}`);
        return { success: false, error };
    }
}

/**
 * STEP 4: Test comparison logic
 * This should compare calculated vs actual correctly
 */
function testStep4_ComparisonLogic() {
    console.log('\n🧪 STEP 4: Testing Comparison Logic');

    try {
        // Get calculated values
        const step2Result = testStep2_FrameworkCalculation();
        if (!step2Result.success) {
            console.log('❌ Cannot test comparison - Step 2 failed');
            return { success: false };
        }

        // Get actual values
        const step3Result = testStep3_HandDetectorExecution();
        if (!step3Result.success) {
            console.log('❌ Cannot test comparison - Step 3 failed');
            return { success: false };
        }

        const calculatedFourOfAKind = step2Result.calculated.fourOfAKind;
        const actualFourOfAKind = step3Result.fourOfAKindHands;

        console.log(`✅ Calculated 4K: ${calculatedFourOfAKind}`);
        console.log(`✅ Actual 4K: ${actualFourOfAKind}`);

        const match = calculatedFourOfAKind === actualFourOfAKind;
        console.log(`✅ Values match: ${match ? 'YES' : 'NO'}`);

        if (match) {
            console.log('🎉 Comparison logic working correctly!');
        } else {
            console.log('⚠️ Values should match but do not');
        }

        return {
            success: true,
            match,
            calculated: calculatedFourOfAKind,
            actual: actualFourOfAKind
        };
    } catch (error) {
        console.log(`❌ Comparison logic failed: ${error.message}`);
        return { success: false, error };
    }
}

/**
 * STEP 5: Test finding test case data
 * This should locate the correct test case
 */
function testStep5_TestCaseData() {
    console.log('\n🧪 STEP 5: Testing Test Case Data');

    try {
        const testCase = HAND_DETECTOR_TEST_CASES.find(tc => tc.id === 1);

        if (!testCase) {
            console.log('❌ Test case 1 not found');
            return { success: false };
        }

        console.log(`✅ Found test case: ${testCase.name}`);
        console.log(`✅ Cards match: ${testCase.cards.length > 0 ? 'YES' : 'NO'}`);
        console.log(`✅ Has expected values: ${testCase.expected ? 'YES' : 'NO'}`);

        if (testCase.expected) {
            console.log(`✅ Manual expected 4K: ${testCase.expected.fourOfAKind} (old value)`);
        }

        return { success: true, testCase };
    } catch (error) {
        console.log(`❌ Test case data failed: ${error.message}`);
        return { success: false, error };
    }
}

/**
 * RUN ALL STEPS: Test everything step by step
 */
function runAllSteps() {
    console.log('🔧 ======== METADATA TEST RUNNER DIAGNOSIS ========\n');

    const results = {};

    results.step1 = testStep1_CardParsing();
    results.step2 = testStep2_FrameworkCalculation();
    results.step3 = testStep3_HandDetectorExecution();
    results.step4 = testStep4_ComparisonLogic();
    results.step5 = testStep5_TestCaseData();

    console.log('\n📊 ======== STEP SUMMARY ========');
    Object.entries(results).forEach(([step, result]) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${step}: ${result.success ? 'PASSED' : 'FAILED'}`);
    });

    const allPassed = Object.values(results).every(r => r.success);
    console.log(`\n🎯 Overall: ${allPassed ? 'ALL STEPS WORK' : 'SOME STEPS FAILED'}`);

    if (allPassed) {
        console.log('\n🎉 All components work individually!');
        console.log('The issue is in how they are connected in the main test runner.');
    }

    return results;
}

// Export functions for individual testing
if (typeof module !== 'undefined') {
    module.exports = {
        testStep1_CardParsing,
        testStep2_FrameworkCalculation,
        testStep3_HandDetectorExecution,
        testStep4_ComparisonLogic,
        testStep5_TestCaseData,
        runAllSteps
    };
}