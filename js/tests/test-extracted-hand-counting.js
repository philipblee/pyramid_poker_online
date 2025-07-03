// js/tests/test-extracted-hand-counting.js
// Test that extracted CountValidHands produces identical results to original HandDetectorTestFramework

/**
 * Test extracted hand counting functions against original
 * @param {number} caseId - Test case ID to use (default: 1)
 */
function testExtractedHandCounting(caseId = 1) {
    console.log(`\n🧪 ======== TESTING EXTRACTED HAND COUNTING ========`);

    // Use existing test case from hand-detector-test-cases.js
    const testCase = HAND_DETECTOR_TEST_CASES.find(t => t.id === caseId);
    if (!testCase) {
        console.log(`❌ Could not find test case ${caseId} from HAND_DETECTOR_TEST_CASES`);
        return null;
    }

    console.log(`\n📋 Test Case: ${testCase.name}`);
    console.log(`Cards: ${testCase.cards}`);

    // Test original framework
    console.log('\n🔧 Testing Original HandDetectorTestFramework...');
    const originalFramework = new HandDetectorTestFramework();
    const originalResults = originalFramework.calculateExpectedCounts(testCase.cards);

    // Test extracted utilities
    console.log('\n🆕 Testing Extracted CountValidHands...');
    const extractedUtils = new CountValidHands();
    const extractedResults = extractedUtils.calculateExpectedCounts(testCase.cards);

    // Compare results
    console.log('\n🔍 Comparing Results...');
    const comparison = compareResults(originalResults, extractedResults);

    if (comparison.identical) {
        console.log('✅ SUCCESS: Extracted functions produce identical results!');
    } else {
        console.log('❌ FAILURE: Results differ!');
        comparison.differences.forEach(diff => {
            console.log(`   ${diff.category}: original=${diff.original}, extracted=${diff.extracted}`);
        });
    }

    return comparison;
}

/**
 * Compare two result objects
 */
function compareResults(original, extracted) {
    const differences = [];
    let identical = true;

    // Get all categories from both results
    const allCategories = new Set([...Object.keys(original), ...Object.keys(extracted)]);

    allCategories.forEach(category => {
        const originalValue = original[category] || 0;
        const extractedValue = extracted[category] || 0;

        if (originalValue !== extractedValue) {
            identical = false;
            differences.push({
                category,
                original: originalValue,
                extracted: extractedValue
            });
        }
    });

    console.log(`📊 Categories compared: ${allCategories.size}`);
    console.log(`🎯 Identical results: ${identical}`);

    if (identical) {
        console.log('📈 Sample results:');
        ['fourOfAKind', 'pair', 'flush', 'straight', 'total'].forEach(key => {
            if (original[key] !== undefined) {
                console.log(`   ${key}: ${original[key]}`);
            }
        });
    }

    return { identical, differences };
}

/**
 * Quick test runner
 * @param {number} caseId - Test case ID to use (default: 1)
 */
function runExtractionTest(caseId = 1) {
    return testExtractedHandCounting(caseId);
}