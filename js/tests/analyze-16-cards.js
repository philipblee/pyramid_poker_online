// js/tests/analyze-16-card-hands.js
// Analyze 16 non-wild cards from one-wild test cases

/**
 * Access and print any case cards
 * @param {number} caseId - Case ID to analyze (default: 1)
 */
function analyzeCase(caseId = 1) {
    console.log(`\n🔍 ======== ANALYZING CASE ${caseId} ========`);

    // Get the specified case
    const testCase = ONE_WILD_TEST_CASES.find(t => t.id === caseId);
    if (!testCase) {
        console.log(`❌ Case ${caseId} not found`);
        return;
    }

    console.log(`📋 Case: ${testCase.name}`);
    console.log(`🃏 All 17 cards: ${testCase.cards}`);

    // Split cards and identify wild vs non-wild
    const allCards = testCase.cards.trim().split(/\s+/);
    console.log(`📊 Total cards: ${allCards.length}`);

    const wildCards = allCards.filter(card => card === '🃏');
    const nonWildCards = allCards.filter(card => card !== '🃏');

    console.log(`🃏 Wild cards (${wildCards.length}): ${wildCards.join(' ')}`);
    console.log(`🎴 Non-wild cards (${nonWildCards.length}): ${nonWildCards.join(' ')}`);

    return { wildCards, nonWildCards };
}