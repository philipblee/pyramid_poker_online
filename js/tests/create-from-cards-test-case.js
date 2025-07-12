// js/tests/create-from-cards-test-case.js
// Utility to create card arrays from test case IDs for testing

/**
 * Create allCards array from NO_WILD_TEST_CASES by case ID
 * @param {number} caseId - Test case ID from NO_WILD_TEST_CASES
 * @returns {Array} Array of 17 card objects ready for testing
 */
function createFromCardsTestCase(caseId) {
    console.log(`🧪 Creating card objects from NO_WILD test case ${caseId}`);

    // Get test case from NO_WILD_TEST_CASES
    const testCase = NO_WILD_TEST_CASES.find(t => t.id === caseId);
    if (!testCase) {
        console.error(`❌ NO_WILD test case ${caseId} not found`);
        return null;
    }

    console.log(`✅ Found test case: ${testCase.name}`);
    console.log(`📋 Cards: ${testCase.cards}`);

    // Parse the cards string into card objects
    const allCards = CardParser.parseCardString(testCase.cards);

    if (!allCards || allCards.length !== 17) {
        console.error(`❌ Expected 17 cards, got ${allCards ? allCards.length : 0}`);
        return null;
    }

    console.log(`✅ Created ${allCards.length} card objects`);

    // Log first few cards for verification
    console.log(`🔍 Sample cards:`, allCards.slice(0, 3).map(c => `${c.rank}${c.suit}`).join(', '), '...');

    return allCards;
}

/**
 * Create allCards array from ONE_WILD_TEST_CASES by case ID
 * @param {number} caseId - Test case ID from ONE_WILD_TEST_CASES
 * @returns {Array} Array of 17 card objects (16 normal + 1 wild) ready for testing
 */
function createFromCardsTestCaseOneWild(caseId) {
    console.log(`🧪 Creating card objects from ONE_WILD test case ${caseId}`);

    // Get test case from ONE_WILD_TEST_CASES
    const testCase = ONE_WILD_TEST_CASES.find(t => t.id === caseId);
    if (!testCase) {
        console.error(`❌ ONE_WILD test case ${caseId} not found`);
        return null;
    }

    console.log(`✅ Found test case: ${testCase.name}`);
    console.log(`📋 Cards: ${testCase.cards}`);

    // Parse the cards string into card objects
    const allCards = CardParser.parseCardStrings(testCase.cards);

    if (!allCards || allCards.length !== 17) {
        console.error(`❌ Expected 17 cards, got ${allCards ? allCards.length : 0}`);
        return null;
    }

    // Verify exactly one wild card
    const wildCards = allCards.filter(c => c.isWild);
    if (wildCards.length !== 1) {
        console.error(`❌ Expected 1 wild card, got ${wildCards.length}`);
        return null;
    }

    console.log(`✅ Created ${allCards.length} card objects (${wildCards.length} wild)`);

    // Log first few cards for verification
    const nonWilds = allCards.filter(c => !c.isWild);
    console.log(`🔍 Sample cards:`, nonWilds.slice(0, 3).map(c => `${c.rank}${c.suit}`).join(', '), '+ 1 wild');

    return allCards;
}

/**
 * Test the new FindBestSetupNoWild function using a NO_WILD test case
 * @param {number} caseId - Test case ID from NO_WILD_TEST_CASES
 * @returns {Object} Result from findBestSetupNoWild
 */
function testFindBestSetupNoWild(caseId = 1) {
    console.log(`\n🎯 Testing FindBestSetupNoWild with NO_WILD case ${caseId}`);

    const allCards = createFromCardsTestCase(caseId);
    if (!allCards) {
        console.error(`❌ Failed to create cards for test case ${caseId}`);
        return null;
    }

    // Test the new function
    const finder = new FindBestSetupNoWild();
    const result = finder.findBestSetupNoWild(allCards);

    console.log(`📊 Result:`, {
        success: result?.success,
        score: result?.score,
        hasArrangement: !!result?.arrangement
    });

    return result;
}

/**
 * Compare old vs new function on the same test case
 * @param {number} caseId - Test case ID from NO_WILD_TEST_CASES
 * @returns {Object} Comparison results
 */
function compareOldVsNew(caseId = 1) {
    console.log(`\n🔄 Comparing old vs new approach for NO_WILD case ${caseId}`);

    const allCards = createFromCardsTestCase(caseId);
    if (!allCards) return null;

    // Test old approach
    console.log(`\n📊 Testing OLD approach (BestArrangementGenerator)...`);
    const handDetector = new HandDetector(allCards);
    const detectionResults = handDetector.detectAllHands();
    const generator = new BestArrangementGenerator();
    const oldResult = generator.generateBestArrangement(detectionResults.hands, allCards);

    // Test new approach
    console.log(`\n📊 Testing NEW approach (FindBestSetupNoWild)...`);
    const finder = new FindBestSetupNoWild();
    const newResult = finder.findBestSetupNoWild(allCards);

    // Compare results
    const comparison = {
        scoresMatch: oldResult.score === newResult.score,
        oldScore: oldResult.score,
        newScore: newResult.score,
        bothSucceeded: oldResult.success && newResult.success,
        oldSuccess: oldResult.success,
        newSuccess: newResult.success
    };

    console.log(`\n📋 Comparison Results:`);
    console.log(`   Scores match: ${comparison.scoresMatch} (${comparison.oldScore} vs ${comparison.newScore})`);
    console.log(`   Both succeeded: ${comparison.bothSucceeded}`);

    if (!comparison.scoresMatch) {
        console.warn(`⚠️ MISMATCH: Old=${comparison.oldScore}, New=${comparison.newScore}`);
    }

    return comparison;
}