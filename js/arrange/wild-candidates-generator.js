// js/arrange/wild-candidates-generator.js
// Generate smart subset of wild card substitution candidates using CardCount class

/**
 * Generate smart wild card candidates for a test case
 * @param {number} caseId - Test case ID from one-wild-test-cases.js
 * @returns {Object} Results with smart candidates and statistics
 */
function generateWildCandidates(caseId) {
    console.log(`\n🎯 ======== GENERATING WILD CANDIDATES FOR CASE ${caseId} ========`);

    // Step 1: Get test case and extract non-wild cards
    const testCase = ONE_WILD_TEST_CASES.find(t => t.id === caseId);
    if (!testCase) {
        console.log(`❌ Case ${caseId} not found`);
        return null;
    }

    // Extract 16 non-wild cards (remove the wild)
    const nonWildCards = extractNonWildCards(testCase.cards);
    const nonWildCardString = nonWildCards.join(' ');

    console.log(`📋 Test case: ${testCase.name}`);
    console.log(`🎴 Non-wild cards (${nonWildCards.length}): ${nonWildCardString}`);

    // Step 2: Analyze non-wild cards using CardCount
    console.log(`\n📊 Step 2: Analyzing cards with CardCount...`);
    const cardCount = countCardsFromString(nonWildCardString);

    console.log(`🔢 Card distribution:`);
    console.log(`   Total cards: ${cardCount.totalCards}`);
    console.log(`   Unique ranks: ${cardCount.rankCounts.size}`);
    console.log(`   Unique suits: ${cardCount.suitCounts.size}`);

    // Show flush opportunities
    const flushSuits = cardCount.flushSuits(4);
    if (flushSuits.length > 0) {
        console.log(`🌊 Flush opportunities:`, flushSuits);
    }

    // Show of-a-kind opportunities
    const pairs = cardCount.ofAKindRanks(2);
    if (pairs.length > 0) {
        console.log(`🃏 Of-a-kind opportunities:`, pairs);
    }

    // Step 3: Generate baseline relevant hands count
    const baselineResult = analyzeCards(nonWildCardString);
    const baselineCount = baselineResult.relevantTotal;
    console.log(`🔢 Baseline relevant hands: ${baselineCount}`);

    // Step 4: Generate smart candidates using CardCount analysis
    console.log(`\n🎯 Step 4: Generating smart candidates...`);
    const smartCandidates = new Set();
    const existingCardSet = new Set(nonWildCards);

    // ADD FLUSH ACE CANDIDATES (NEW LOGIC)
    console.log(`\n🌊 Adding flush Ace candidates...`);
    cardCount.flushSuits(4).forEach(({suit, count}) => {
        const aceOfSuit = `A${suit}`;
        if (!existingCardSet.has(aceOfSuit)) {
            smartCandidates.add(aceOfSuit);
            console.log(`✅ Added ${aceOfSuit} for flush opportunity (${count} cards in ${suit})`);
        } else {
            console.log(`⚠️ ${aceOfSuit} already present (${count} cards in ${suit})`);
        }
    });

    // Step 5: Test all 52 cards for comparison (brute force validation)
    console.log(`\n🔄 Step 5: Testing all 52 cards for validation...`);
    const allCards = generateAll52Cards();
    const validatedCandidates = [];
    const rejectedCards = [];

    allCards.forEach((card, index) => {
        // Add this card to the 16 non-wilds (making 17 total)
        const testCardString = nonWildCardString + ' ' + card;

        // Analyze the 17 cards
        const testResult = analyzeCards(testCardString);
        const testCount = testResult.relevantTotal;

        // Compare to baseline
        if (testCount > baselineCount) {
            validatedCandidates.push(card);

            // Check if our smart logic caught this
            const wasSmartCandidate = smartCandidates.has(card);
            if (wasSmartCandidate) {
                if (validatedCandidates.length <= 5) {
                    console.log(`✅ Accept ${card}: ${testCount} hands (was ${baselineCount}) [SMART PREDICTED]`);
                }
            } else {
                if (validatedCandidates.length <= 5) {
                    console.log(`✅ Accept ${card}: ${testCount} hands (was ${baselineCount}) [MISSED BY SMART]`);
                }
            }
        } else {
            rejectedCards.push(card);
        }

        // Progress indicator
        if ((index + 1) % 13 === 0) {
            console.log(`   Progress: ${index + 1}/52 cards tested...`);
        }
    });

    // Step 6: Compare smart vs brute force results
    console.log(`\n📊 Step 6: Comparing smart vs brute force results...`);
    const smartCandidatesArray = Array.from(smartCandidates);
    const smartMissed = validatedCandidates.filter(card => !smartCandidates.has(card));
    const smartExtra = smartCandidatesArray.filter(card => !validatedCandidates.includes(card));

    console.log(`🤖 Smart candidates: ${smartCandidatesArray.length}`);
    console.log(`🔬 Brute force found: ${validatedCandidates.length}`);
    console.log(`❌ Smart missed: ${smartMissed.length} ${smartMissed.length > 0 ? smartMissed : ''}`);
    console.log(`➕ Smart extra: ${smartExtra.length} ${smartExtra.length > 0 ? smartExtra : ''}`);

    // Step 7: Results
    const results = {
        caseId: caseId,
        testName: testCase.name,
        nonWildCards: nonWildCards,
        baseline: baselineCount,
        smartCandidates: smartCandidatesArray,
        smartCount: smartCandidatesArray.length,
        validatedCandidates: validatedCandidates,
        validatedCount: validatedCandidates.length,
        rejectedCards: rejectedCards,
        rejectedCount: rejectedCards.length,
        smartMissed: smartMissed,
        smartExtra: smartExtra,
        efficiency: ((52 - validatedCandidates.length) / 52 * 100).toFixed(1),
        smartEfficiency: ((52 - smartCandidatesArray.length) / 52 * 100).toFixed(1)
    };

    console.log(`\n📋 ======== RESULTS ========`);
    console.log(`✅ Validated candidates: ${results.validatedCount}/52 (${((results.validatedCount/52)*100).toFixed(1)}%)`);
    console.log(`🤖 Smart candidates: ${results.smartCount}/52 (${((results.smartCount/52)*100).toFixed(1)}%)`);
    console.log(`❌ Rejected cards: ${results.rejectedCount}/52 (${results.efficiency}%)`);
    console.log(`🎯 Brute force efficiency: ${results.efficiency}% reduction`);
    console.log(`🧠 Smart efficiency: ${results.smartEfficiency}% reduction`);

    if (smartCandidatesArray.length <= 20) {
        console.log(`📝 Smart candidates: ${smartCandidatesArray.join(', ')}`);
    } else {
        console.log(`📝 Smart candidates (first 20): ${smartCandidatesArray.slice(0, 20).join(', ')}...`);
    }

    return results;
}

/**
 * Extract non-wild cards from a card string
 * @param {string} cardString - Card string with wild marked as 🃏
 * @returns {Array} Array of non-wild card strings
 */
function extractNonWildCards(cardString) {
    const cards = cardString.trim().split(/\s+/);
    return cards.filter(card => card !== '🃏');
}

/**
 * Generate all 52 possible cards
 * @returns {Array} Array of all possible card strings
 */
function generateAll52Cards() {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suits = ['♠', '♥', '♦', '♣'];

    const allCards = [];

    ranks.forEach(rank => {
        suits.forEach(suit => {
            allCards.push(rank + suit);
        });
    });

    return allCards;
}

/**
 * Test multiple cases and compare efficiency
 * @param {Array} caseIds - Array of case IDs to test
 */
function testMultipleCases(caseIds = [1, 2, 3, 4, 5]) {
    console.log(`\n🚀 ======== TESTING MULTIPLE CASES ========`);

    const results = [];

    caseIds.forEach(caseId => {
        const result = generateWildCandidates(caseId);
        if (result) {
            results.push(result);
        }
    });

    // Summary
    console.log(`\n📊 ======== SUMMARY ========`);
    results.forEach(r => {
        const smartAccuracy = r.smartCount === r.validatedCount ? '✅' : '⚠️';
        console.log(`Case ${r.caseId}: Smart ${r.smartCount}/52, Validated ${r.validatedCount}/52 ${smartAccuracy}`);
    });

    const avgEfficiency = results.reduce((sum, r) => sum + parseFloat(r.efficiency), 0) / results.length;
    const avgSmartEfficiency = results.reduce((sum, r) => sum + parseFloat(r.smartEfficiency), 0) / results.length;

    console.log(`\n🎯 Average brute force efficiency: ${avgEfficiency.toFixed(1)}% search space reduction`);
    console.log(`🧠 Average smart efficiency: ${avgSmartEfficiency.toFixed(1)}% search space reduction`);

    return results;
}

/**
 * Quick test function for console
 * @param {number} caseId - Test case ID (default: 1)
 */
function testWildCandidates(caseId = 1) {
    return generateWildCandidates(caseId);
}