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

    // Step 2: Generate baseline relevant hands count
    const baselineResult = analyzeCards(nonWildCardString);
    const baselineCount = baselineResult.relevantTotal;
    console.log(`🔢 Baseline relevant hands: ${baselineCount}`);

    // Step 3: Reviewing all 52 cards to find candidates
    console.log(`\n🔄 Step 3: Reviewing all 52 cards to find candidates...`);
    const allCards = generateAll52Cards();
    const wildCandidates = [];
    const rejectedCards = [];

    allCards.forEach((card, index) => {
        // Add this card to the 16 non-wilds (making 17 total)
        const testCardString = nonWildCardString + ' ' + card;

        // Analyze the 17 cards
        const testResult = analyzeCards(testCardString);
        const testCount = testResult.relevantTotal;

        // Compare to baseline
        if (testCount > baselineCount) {
            wildCandidates.push(card);
        } else {
            rejectedCards.push(card);
        }

        // Progress indicator
        if ((index + 1) % 13 === 0) {
            console.log(`   Progress: ${index + 1}/52 cards tested...`);
        }
    });

    // Step 4: Add missing flush Aces as potential candidates
    console.log(`\n🌊 Step 4: Adding Aces in potential flushes...`);
    const cardCount = countCardsFromString(nonWildCardString);
    const suitsWith4Plus = cardCount.flushSuits(4);

    if (suitsWith4Plus.length > 0) {
        suitsWith4Plus.forEach(({suit, count}) => {
            const aceOfSuit = `A${suit}`;
            if (!wildCandidates.includes(aceOfSuit)) {
                wildCandidates.push(aceOfSuit);
                console.log(`✅ Added missing flush Ace: ${aceOfSuit} (${count} cards in ${suit})`);
            } else {
                console.log(`⚠️ Flush Ace ${aceOfSuit} already found (${count} cards in ${suit})`);
            }
        });
    } else {
        console.log(`No flush opportunities (4+ cards) found`);
    }

    // Step 5: Results
    const results = {
        caseId: caseId,
        testName: testCase.name,
        nonWildCards: nonWildCards,
        baseline: baselineCount,
        wildCandidates: wildCandidates,
        wildCandidatesCount: wildCandidates.length,
        rejectedCards: rejectedCards,
        rejectedCount: rejectedCards.length,
        efficiency: ((52 - wildCandidates.length) / 52 * 100).toFixed(1)
    };

    console.log(`\n📋 ======== RESULTS ========`);
    console.log(`✅ Wild candidates: ${results.wildCandidatesCount}/52 (${((results.wildCandidatesCount/52)*100).toFixed(1)}%)`);
    console.log(`❌ Rejected cards: ${results.rejectedCount}/52 (${results.efficiency}%)`);
    console.log(`🎯 Efficiency: ${results.efficiency}% search space reduction`);

    console.log(`📝 Wild candidates: ${wildCandidates.join(', ')}`);

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
 * Generate smart wild card candidates from card objects (not test cases)
 * @param {Array} cardObjects - Array of 17 card objects (including 1 wild)
 * @returns {Object} Results with smart candidates and statistics
 */
function generateWildCandidatesFromCards(cardObjects) {
    console.log(`\n🎯 ======== GENERATING WILD CANDIDATES FROM CARDS ========`);

    // Step 1: Convert to Card Model format FIRST (same pattern as brute force)
    const properCardObjects = convertToCardModel(cardObjects);

    // Step 2: Extract wild and non-wild cards from converted objects
    const wildCard = properCardObjects.find(card => card.isWild);
    const nonWildCards = properCardObjects.filter(card => !card.isWild);

    if (!wildCard) {
        console.log(`❌ No wild card found in provided cards`);
        return null;
    }

    if (nonWildCards.length !== 16) {
        console.log(`❌ Expected 16 non-wild cards, found ${nonWildCards.length}`);
        return null;
    }

    // Step 3: Convert non-wild cards to string format for existing analysis logic
    const nonWildCardStrings = nonWildCards.map(card => card.rank + card.suit);
    const nonWildCardString = nonWildCardStrings.join(' ');

    console.log(`🎴 Non-wild cards (${nonWildCards.length}): ${nonWildCardString}`);

    // Step 4: Use existing candidate generation logic (copied from generateWildCandidates)
    const baselineResult = analyzeCards(nonWildCardString);
    const baselineCount = baselineResult.relevantTotal;
    console.log(`🔢 Baseline relevant hands: ${baselineCount}`);

    console.log(`\n🔄 Reviewing all 52 cards to find candidates...`);
    const allCards = generateAll52Cards();
    const wildCandidates = [];
    const rejectedCards = [];

    allCards.forEach((card, index) => {
        // Add this card to the 16 non-wilds (making 17 total)
        const testCardString = nonWildCardString + ' ' + card;

        // Analyze the 17 cards
        const testResult = analyzeCards(testCardString);
        const testCount = testResult.relevantTotal;

        // Compare to baseline
        if (testCount > baselineCount) {
            wildCandidates.push(card);
        } else {
            rejectedCards.push(card);
        }

        // Progress indicator
        if ((index + 1) % 13 === 0) {
            console.log(`   Progress: ${index + 1}/52 cards tested...`);
        }
    });

    // Step 5: Add missing flush Aces (copied from existing logic)
    console.log(`\n🌊 Adding Aces in potential flushes...`);
    const cardCount = countCardsFromString(nonWildCardString);
    const suitsWith4Plus = cardCount.flushSuits(4);

    if (suitsWith4Plus.length > 0) {
        suitsWith4Plus.forEach(({suit, count}) => {
            const aceOfSuit = `A${suit}`;
            if (!wildCandidates.includes(aceOfSuit)) {
                wildCandidates.push(aceOfSuit);
                console.log(`✅ Added missing flush Ace: ${aceOfSuit} (${count} cards in ${suit})`);
            } else {
                console.log(`⚠️ Flush Ace ${aceOfSuit} already found (${count} cards in ${suit})`);
            }
        });
    } else {
        console.log(`No flush opportunities (4+ cards) found`);
    }

    // Step 6: Return results (same format as existing function)
    const results = {
        testName: "From Card Objects",
        nonWildCards: nonWildCardStrings,
        baseline: baselineCount,
        wildCandidates: wildCandidates,
        wildCandidatesCount: wildCandidates.length,
        rejectedCards: rejectedCards,
        rejectedCount: rejectedCards.length,
        efficiency: ((52 - wildCandidates.length) / 52 * 100).toFixed(1)
    };

    console.log(`\n📋 ======== RESULTS ========`);
    console.log(`✅ Wild candidates: ${results.wildCandidatesCount}/52 (${((results.wildCandidatesCount/52)*100).toFixed(1)}%)`);
    console.log(`❌ Rejected cards: ${results.rejectedCount}/52 (${results.efficiency}%)`);
    console.log(`🎯 Efficiency: ${results.efficiency}% search space reduction`);
    console.log(`📝 Wild candidates: ${wildCandidates.join(', ')}`);

    return results;
}