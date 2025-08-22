// Tiered2 Lookup Unit Test - Comprehensive Testing Framework
// Tests Tiered2 win probability lookup behavior with detailed logging

// Mock data structure for testing - Win probabilities (0.0 to 1.0)
const mockTiered2Data = {
    // Complete straights that should be found
    'back_5_14_13': 0.89,    // A-K-Q-J-10 straight
    'back_5_13_12': 0.86,    // K-Q-J-10-9 straight
    'back_5_12_11': 0.83,    // Q-J-10-9-8 straight
    'back_5_9_8': 0.78,      // 9-8-7-6-5 straight
    'back_5_14_5': 0.75,     // A-2-3-4-5 wheel

    // Middle position straights
    'middle_5_14_13': 0.72,
    'middle_5_13_12': 0.69,
    'middle_5_9_8': 0.65,

    // Front position hands
    'front_3_14': 0.95,      // Trip Aces
    'front_3_13': 0.92,      // Trip Kings
    'front_2_14': 0.68,      // Pair of Aces
    'front_2_13': 0.65,      // Pair of Kings

    // Four of a kind variations
    'back_8_14_13': 0.98,    // 4 Aces with King kicker
    'back_8_14_12': 0.97,    // 4 Aces with Queen kicker
    'back_8_13_14': 0.96,    // 4 Kings with Ace kicker

    // Truncated lookups (2-element fallbacks)
    'back_5_14': 0.82,       // Any Ace-high straight
    'back_5_13': 0.79,       // Any King-high straight
    'back_8_14': 0.95,       // Any 4 Aces
    'back_3_14': 0.88,       // Any trip Aces

    // Pairs and lower hands
    'back_2_14_13': 0.45,    // Pair of Aces with King kicker
    'back_2_13_12': 0.42,    // Pair of Kings with Queen kicker
    'back_1_14_13': 0.15,    // Ace-King high
    'middle_2_14': 0.35,     // Any pair of Aces in middle
    'middle_1_14': 0.08,     // Ace high in middle
};

// Mock Tiered2 lookup class
class MockTiered2WinProbability {
    getTiered2WinProbability(position, tuple) {
        const key = `${position.toLowerCase()}_${tuple.join('_')}`;
        const result = mockTiered2Data[key] || null;

        if (result !== null) {
            console.log(`✅ Mock Tiered2 lookup found: ${key} = ${result}`);
        } else {
            console.log(`❌ Mock Tiered2 lookup failed: ${key}`);
        }

        return result;
    }
}

// Mock fallback functions (same as NetEV but for win probabilities)
function handleIncompleteFrontHand(handRank) {
    const handType = handRank[0];
    if (handType === 1) return 0.12;  // High card (low win probability)
    if (handType === 2) return 0.58;  // Pairs (decent win probability)
    if (handType === 3) return 0.89;  // Trips (high win probability)
    return null;
}

function handleIncompleteMiddleHand(handRank) {
    const handType = handRank[0];
    if (handType === 1) return 0.05;  // High card (very low in middle)
    if (handType === 2) return 0.32;  // Pairs (lower than front)
    if (handType === 3) return 0.78;  // Trips (good but not as good as front)
    return null;
}

// Mock debug function
function debugHandCorruption(hand, context) {
    console.log(`🔧 Debug hand corruption: ${context}`);
    console.log(`   Hand type: ${typeof hand}`);
    console.log(`   Hand keys: ${Object.keys(hand)}`);
}

// Initialize mock lookup
const tiered2WinProbability = new MockTiered2WinProbability();

// Your actual lookupTiered2WinProbability function (cleaned up for testing)
function lookupTiered2WinProbability(position, hand) {
    const handRank = hand.hand_rank || hand;

    // SPECIAL HANDLING: Incomplete front hands
    if (position.toLowerCase() === 'front' && hand.isIncomplete) {
        const incompleteProbability = handleIncompleteFrontHand(handRank);
        if (incompleteProbability !== null) {
            console.log(`🎯 Incomplete front hand: ${incompleteProbability}`);
            return incompleteProbability;
        }
    }

    // SPECIAL HANDLING: Incomplete middle/back hands - use tiered2 data for middle
    if ((position.toLowerCase() === 'middle' || position.toLowerCase() === 'back') && hand.isIncomplete) {
        if (position.toLowerCase() === 'middle') {
            // Try tiered2 incomplete middle hand lookup
            const tiered2Probability = handleIncompleteMiddleHand(hand.hand_rank);
            if (tiered2Probability !== null) {
                console.log(`🎯 Incomplete middle hand: ${tiered2Probability}`);
                return tiered2Probability;
            }
        }

        // Fall back to low probability for back position or if middle lookup fails
        console.log(`🎯 Incomplete back/fallback: 0.001`);
        return 0.001;
    }

    // Try hierarchical fallback - 3 elements, then 2 elements only
    for (let length = Math.min(handRank.length, 3); length >= 2; length--) {
        let truncatedTuple = handRank.slice(0, length);
        console.log(`     Truncated Tuple: ${truncatedTuple}`);

        let probability = tiered2WinProbability.getTiered2WinProbability(position, truncatedTuple);

        if (probability !== null) {
            console.log(`🎯 Hierarchical match: level ${length}/${handRank.length} for ${position} [${handRank.join(',')}] → [${truncatedTuple.join(',')}] = ${probability}`);
            return probability;
        }
    }

    // Final fallback to hardcoded hand type probabilities
    if (handRank.length >= 2) {
        const handType = handRank[0];
        const primaryRank = handRank[1];

        // Use existing hardcoded fallback functions
        if (position.toLowerCase() === 'front') {
            const frontFallback = handleIncompleteFrontHand(handRank);
            if (frontFallback !== null) {
                console.log(`🎯 Front hardcoded fallback: ${frontFallback}`);
                return frontFallback;
            }
        } else if (position.toLowerCase() === 'middle') {
            const middleFallback = handleIncompleteMiddleHand(handRank);
            if (middleFallback !== null) {
                console.log(`🎯 Middle hardcoded fallback: ${middleFallback}`);
                return middleFallback;
            }
        }
    }

    console.log('❌ No match found at any level, returning null');
    console.log(`   🔍 Position: ${position}`);
    console.log(`   🔍 Hand rank tuple: [${handRank.join(', ')}]`);
    console.log(`   🔍 Attempted lookups:`);

    // Debug hand corruption
    debugHandCorruption(hand, "When lookup fails");
    console.log(`     lookupTiered2WinProbability: position, hand: ${position}`);
    console.log("Hand (formatted):", JSON.stringify(hand, null, 2));

    // Show exactly what tuples were tried
    for (let length = Math.min(handRank.length, 3); length >= 2; length--) {
        let truncatedTuple = handRank.slice(0, length);
        console.log(`     Tried: [${truncatedTuple.join(', ')}] - No match`);
    }

    return null;
}

// Test Cases - Organized by scenario (adapted for win probabilities)
const testCases = [
    // === COMPLETE STRAIGHTS (The problematic ones) ===
    {
        name: "Complete Ace-High Straight (Back)",
        position: "back",
        hand: { hand_rank: [5, 14, 13] },
        expected: 0.89,
        category: "complete_straights"
    },
    {
        name: "Complete King-High Straight (Back)",
        position: "back",
        hand: { hand_rank: [5, 13, 12] },
        expected: 0.86,
        category: "complete_straights"
    },
    {
        name: "Complete Wheel Straight (Back)",
        position: "back",
        hand: { hand_rank: [5, 14, 5] },
        expected: 0.75,
        category: "complete_straights"
    },
    {
        name: "Complete Middle Straight",
        position: "middle",
        hand: { hand_rank: [5, 14, 13] },
        expected: 0.72,
        category: "complete_straights"
    },

    // === HIERARCHICAL FALLBACK SCENARIOS ===
    {
        name: "4-Element Tuple (Should truncate to 3)",
        position: "back",
        hand: { hand_rank: [8, 14, 13, 12] },  // 4 elements, should use first 3
        expected: 0.98,
        category: "hierarchical_fallback"
    },
    {
        name: "3-Element Missing (Should fallback to 2)",
        position: "back",
        hand: { hand_rank: [5, 11, 10] },  // Not in our mock data, should fallback
        expected: null,  // No 2-element fallback data for this combo
        category: "hierarchical_fallback"
    },
    {
        name: "2-Element Direct Lookup",
        position: "back",
        hand: { hand_rank: [8, 14] },
        expected: 0.95,
        category: "hierarchical_fallback"
    },

    // === INCOMPLETE HAND SPECIAL HANDLING ===
    {
        name: "Incomplete Front Hand - Trips",
        position: "front",
        hand: { hand_rank: [3, 14], isIncomplete: true },
        expected: 0.89,  // handleIncompleteFrontHand for type 3
        category: "incomplete_hands"
    },
    {
        name: "Incomplete Front Hand - Pairs",
        position: "front",
        hand: { hand_rank: [2, 13], isIncomplete: true },
        expected: 0.58,  // handleIncompleteFrontHand for type 2
        category: "incomplete_hands"
    },
    {
        name: "Incomplete Middle Hand - High Card",
        position: "middle",
        hand: { hand_rank: [1, 14], isIncomplete: true },
        expected: 0.05,  // handleIncompleteMiddleHand for type 1
        category: "incomplete_hands"
    },
    {
        name: "Incomplete Back Hand",
        position: "back",
        hand: { hand_rank: [1, 14], isIncomplete: true },
        expected: 0.001,  // Hardcoded fallback for back incomplete
        category: "incomplete_hands"
    },

    // === FRONT POSITION SPECIALS ===
    {
        name: "Front Trip Aces",
        position: "front",
        hand: { hand_rank: [3, 14] },
        expected: 0.95,
        category: "front_position"
    },
    {
        name: "Front Pair with Fallback",
        position: "front",
        hand: { hand_rank: [2, 10] },  // Not in mock data
        expected: 0.58,  // Should use handleIncompleteFrontHand
        category: "front_position"
    },

    // === EDGE CASES ===
    {
        name: "Single Element (Invalid)",
        position: "back",
        hand: { hand_rank: [5] },
        expected: null,
        category: "edge_cases"
    },
    {
        name: "Empty Array",
        position: "back",
        hand: { hand_rank: [] },
        expected: null,
        category: "edge_cases"
    },
    {
        name: "Missing Data with Middle Fallback",
        position: "middle",
        hand: { hand_rank: [2, 9] },  // Not in mock data
        expected: 0.32,  // Should use handleIncompleteMiddleHand
        category: "edge_cases"
    }
];

// Test Runner Function
function runTiered2LookupTests() {
    console.log("🧪 Starting Tiered2 Win Probability Lookup Unit Tests");
    console.log("=" .repeat(70));

    let passed = 0;
    let failed = 0;
    const failures = [];

    testCases.forEach((testCase, index) => {
        console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
        console.log(`   Category: ${testCase.category}`);
        console.log(`   Position: ${testCase.position}`);
        console.log(`   Hand Rank: [${testCase.hand.hand_rank.join(', ')}]`);
        console.log(`   Incomplete: ${testCase.hand.isIncomplete || false}`);

        const result = lookupTiered2WinProbability(testCase.position, testCase.hand);

        const success = result === testCase.expected;

        if (success) {
            console.log(`✅ PASS: Got ${result}, expected ${testCase.expected}`);
            passed++;
        } else {
            console.log(`❌ FAIL: Got ${result}, expected ${testCase.expected}`);
            failed++;
            failures.push({
                test: testCase.name,
                expected: testCase.expected,
                actual: result,
                category: testCase.category
            });
        }

        console.log("-".repeat(50));
    });

    // Summary Report
    console.log(`\n📊 TIERED2 TEST SUMMARY`);
    console.log(`Total Tests: ${testCases.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failures.length > 0) {
        console.log(`\n🚨 FAILURES BY CATEGORY:`);
        const failuresByCategory = {};
        failures.forEach(f => {
            if (!failuresByCategory[f.category]) {
                failuresByCategory[f.category] = [];
            }
            failuresByCategory[f.category].push(f);
        });

        Object.keys(failuresByCategory).forEach(category => {
            console.log(`\n  ${category.toUpperCase()}:`);
            failuresByCategory[category].forEach(f => {
                console.log(`    - ${f.test}: expected ${f.expected}, got ${f.actual}`);
            });
        });
    }

    return { passed, failed, failures };
}

// Quick test for specific scenario (like Test 1009)
function testSpecificTiered2Straight(position, handRank, isIncomplete = false) {
    console.log(`\n🎯 FOCUSED TIERED2 TEST: ${position} [${handRank.join(', ')}] ${isIncomplete ? '(incomplete)' : ''}`);
    console.log("=" .repeat(60));

    const hand = { hand_rank: handRank };
    if (isIncomplete) hand.isIncomplete = true;

    const result = lookupTiered2WinProbability(position, hand);

    console.log(`Final result: ${result}`);
    return result;
}

// Comparison function to test both NetEV and Tiered2 side by side
function compareNetEVAndTiered2(position, handRank, isIncomplete = false) {
    console.log(`\n🔄 COMPARISON TEST: ${position} [${handRank.join(', ')}]`);
    console.log("=" .repeat(60));

    const hand = { hand_rank: handRank };
    if (isIncomplete) hand.isIncomplete = true;

    console.log("🟦 Testing Tiered2:");
    const tiered2Result = lookupTiered2WinProbability(position, hand);

    console.log("\n🟨 Testing NetEV:");
    // Note: You'd need to include the NetEV function here or import it
    // const netEVResult = lookupNetEV(position, hand);

    console.log(`\n📊 Results:`);
    console.log(`   Tiered2: ${tiered2Result}`);
    // console.log(`   NetEV: ${netEVResult}`);

    return { tiered2: tiered2Result }; // netEV: netEVResult
}

// Run the tests
console.log("Running Tiered2 Lookup Tests...\n");
const results = runTiered2LookupTests();

// Test specific problematic straights
console.log("\n\n🔍 FOCUSED TESTING - Problematic Straights:");
testSpecificTiered2Straight("back", [5, 14, 13]);  // Should find 0.89
testSpecificTiered2Straight("back", [5, 11, 10]);  // Should fallback
testSpecificTiered2Straight("middle", [5, 14, 13]); // Should find 0.72

// Test incomplete hand scenarios
console.log("\n\n🔍 INCOMPLETE HAND TESTING:");
testSpecificTiered2Straight("front", [3, 14], true);  // Incomplete trips
testSpecificTiered2Straight("middle", [1, 14], true); // Incomplete high card
testSpecificTiered2Straight("back", [2, 13], true);   // Incomplete back hand