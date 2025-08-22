// NetEV Lookup Unit Test - Comprehensive Testing Framework
// Tests both NetEV and Tiered2 lookup behavior with detailed logging

// Mock data structure for testing
const mockNetEVData = {
    // Complete straights that should be found
    'back_5_14_13': 2.45,    // A-K-Q-J-10 straight
    'back_5_13_12': 2.38,    // K-Q-J-10-9 straight
    'back_5_12_11': 2.31,    // Q-J-10-9-8 straight
    'back_5_9_8': 2.15,      // 9-8-7-6-5 straight
    'back_5_14_5': 2.10,     // A-2-3-4-5 wheel

    // Middle position straights
    'middle_5_14_13': 1.85,
    'middle_5_13_12': 1.78,
    'middle_5_9_8': 1.65,

    // Front position hands
    'front_3_14': 0.95,      // Trip Aces
    'front_3_13': 0.88,      // Trip Kings
    'front_2_14': 0.42,      // Pair of Aces
    'front_2_13': 0.38,      // Pair of Kings

    // Four of a kind variations
    'back_8_14_13': 5.85,    // 4 Aces with King kicker
    'back_8_14_12': 5.82,    // 4 Aces with Queen kicker
    'back_8_13_14': 5.75,    // 4 Kings with Ace kicker

    // Truncated lookups (2-element fallbacks)
    'back_5_14': 2.20,       // Any Ace-high straight
    'back_5_13': 2.15,       // Any King-high straight
    'back_8_14': 5.70,       // Any 4 Aces
    'back_3_14': 1.85,       // Any trip Aces
};

// Mock NetEV lookup class
class MockNetEVLookup {
    getNetEV(position, tuple) {
        const key = `${position.toLowerCase()}_${tuple.join('_')}`;
        const result = mockNetEVData[key] || null;

        if (result !== null) {
            console.log(`✅ Mock lookup found: ${key} = ${result}`);
        } else {
            console.log(`❌ Mock lookup failed: ${key}`);
        }

        return result;
    }
}

// Mock fallback functions
function handleIncompleteFrontHand(handRank) {
    const handType = handRank[0];
    if (handType === 1) return -0.89;  // High card
    if (handType === 2) return 0.35;   // Pairs
    if (handType === 4) return 0.85;   // Trips
    return null;
}

function handleIncompleteMiddleHand(handRank) {
    const handType = handRank[0];
    if (handType === 1) return -1.19;  // High card
    if (handType === 2) return 0.25;   // Pairs
    if (handType === 4) return 1.65;   // Trips
    return null;
}

// Initialize mock lookup
const netEVLookup = new MockNetEVLookup();

// Your actual lookupNetEV function (with console.log cleanup for testing)
function lookupNetEV(position, hand) {
    const handRank = hand.hand_rank || hand;

    // Try hierarchical fallback - 3 elements, then 2 elements only
    for (let length = Math.min(handRank.length, 3); length >= 2; length--) {
        let truncatedTuple = handRank.slice(0, length);
        console.log(`     Truncated Tuple: ${truncatedTuple}`);

        let netEV = netEVLookup.getNetEV(position, truncatedTuple);

        if (netEV !== null) {
            console.log(`🎯 Hierarchical match: level ${length}/${handRank.length} for ${position} [${handRank.join(',')}] → [${truncatedTuple.join(',')}] = ${netEV}`);
            return netEV;
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

    return null;
}

// Test Cases - Organized by scenario
const testCases = [
    // === COMPLETE STRAIGHTS (The problematic ones) ===
    {
        name: "Complete Ace-High Straight (Back)",
        position: "back",
        hand: { hand_rank: [5, 14, 13] },
        expected: 2.45,
        category: "complete_straights"
    },
    {
        name: "Complete King-High Straight (Back)",
        position: "back",
        hand: { hand_rank: [5, 13, 12] },
        expected: 2.38,
        category: "complete_straights"
    },
    {
        name: "Complete Wheel Straight (Back)",
        position: "back",
        hand: { hand_rank: [5, 14, 5] },
        expected: 2.10,
        category: "complete_straights"
    },
    {
        name: "Complete Middle Straight",
        position: "middle",
        hand: { hand_rank: [5, 14, 13] },
        expected: 1.85,
        category: "complete_straights"
    },

    // === HIERARCHICAL FALLBACK SCENARIOS ===
    {
        name: "4-Element Tuple (Should truncate to 3)",
        position: "back",
        hand: { hand_rank: [8, 14, 13, 12] },  // 4 elements, should use first 3
        expected: 5.85,
        category: "hierarchical_fallback"
    },
    {
        name: "3-Element Missing (Should fallback to 2)",
        position: "back",
        hand: { hand_rank: [5, 11, 10] },  // Not in our mock data
        expected: null,  // Should fallback but we don't have 2-element data
        category: "hierarchical_fallback"
    },
    {
        name: "2-Element Direct Lookup",
        position: "back",
        hand: { hand_rank: [8, 14] },
        expected: 5.70,
        category: "hierarchical_fallback"
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
        expected: 0.35,  // Should use handleIncompleteFrontHand
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
        expected: 0.25,  // Should use handleIncompleteMiddleHand
        category: "edge_cases"
    }
];

// Test Runner Function
function runNetEVLookupTests() {
    console.log("🧪 Starting NetEV Lookup Unit Tests");
    console.log("=" .repeat(60));

    let passed = 0;
    let failed = 0;
    const failures = [];

    testCases.forEach((testCase, index) => {
        console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
        console.log(`   Category: ${testCase.category}`);
        console.log(`   Position: ${testCase.position}`);
        console.log(`   Hand Rank: [${testCase.hand.hand_rank.join(', ')}]`);

        const result = lookupNetEV(testCase.position, testCase.hand);

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

        console.log("-".repeat(40));
    });

    // Summary Report
    console.log(`\n📊 TEST SUMMARY`);
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
function testSpecificStraight(position, handRank) {
    console.log(`\n🎯 FOCUSED TEST: ${position} [${handRank.join(', ')}]`);
    console.log("=" .repeat(50));

    const result = lookupNetEV(position, { hand_rank: handRank });

    console.log(`Final result: ${result}`);
    return result;
}

// Run the tests
console.log("Running NetEV Lookup Tests...\n");
const results = runNetEVLookupTests();

// Test specific problematic straights
console.log("\n\n🔍 FOCUSED TESTING - Problematic Straights:");
testSpecificStraight("back", [5, 14, 13]);  // Should find 2.45
testSpecificStraight("back", [5, 11, 10]);  // Should fallback
testSpecificStraight("middle", [5, 14, 13]); // Should find 1.85