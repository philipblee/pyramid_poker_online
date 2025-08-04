// js/tests/create-from-cards-test-case.js
// Utility to create card arrays from test case IDs for testing

/**
 * Create allCards array from TEST_CASES by case ID
 * @param {number} caseId - Test case ID (1-100, 1001-1100, 2001-2100)
 * @returns {Array} Array of 17 card objects ready for testing
  */
function createFromCardsTestCase(caseId) {
//    console.log(`🧪 Creating card objects from test case ${caseId}`);
    const testCase = getTestCase(caseId);

    if (!testCase) {
        console.error(`❌ Test case ${caseId} not found`);
        return null;
    }

//    console.log(`✅ Found test case: ${testCase.name}`);
    const allCards = Analysis.parseCardString(testCase.cards); // or CardParser.parseCardString

    if (!allCards || allCards.length !== 17) {
        console.error(`❌ Expected 17 cards, got ${allCards ? allCards.length : 0}`);
        return null;
    }

    return allCards;
}