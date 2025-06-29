// js/tests/hand-detector-test-cases.js v11
// Test cases for HandDetector - includes straight flush cases (5-8 card) + single cards
// UPDATED: Added highCard: 17 to all test cases and updated totals

const HAND_DETECTOR_TEST_CASES = [
    {
        id: 1,
        name: "Four Aces + Two Kings",
        cards: "A♠ A♥ A♦ A♣ K♠ Q♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠ 2♠ K♥",
        expected: {
            fourOfAKind: 1,      // 1 natural 4K
            threeOfAKind: 4,     // 4 drop-one variants from 4K
            pair: 1,             // 1 natural pair (Kings)
            fullHouse: 4,        // 4 trips × 1 pair = 4 full houses
            flush: 1287,         // C(13,5) = 1287 spades flushes
            straight: 21,        // 21 straights (A-K-Q-J-10: 8, K-Q-J-10-9: 2, others: 1 each, 5-4-3-2-A: 4)
            highCard: 17,        // NEW: 17 single cards
            total: 1335          // Updated: 1318 + 17 = 1335
        }
    },

    {
        id: 2,
        name: "Five Kings",
        cards: "K♠ K♥ K♦ K♣ K♠ A♠ Q♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠ 2♠",
        expected: {
            fiveOfAKind: 1,
            fourOfAKind: 5,
            flush: 2002,
            straight: 18,
            straightFlush: 12,        // ADD THIS
            sixCardStraightFlush: 11, // ADD THIS
            sevenCardStraightFlush: 9, // ADD THIS
            eightCardStraightFlush: 8, // ADD THIS
            highCard: 17,
            total: 2083                 // UPDATE TOTAL
        }
    },


    {
        id: 3,
        name: "Six Queens",
        cards: "Q♠ Q♥ Q♦ Q♣ Q♠ Q♥ A♠ K♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠",
        expected: {
            sixOfAKind: 1,       // 1 natural 6K
            fiveOfAKind: 6,      // 6 drop-one variants from 6K
            flush: 1287,         // C(13,5) = 1287 spades flushes (13♠, 2♥, 1♦, 1♣)
            straight: 23,        // 23 straights (A-K-Q-J-10: 6, K-Q-J-10-9: 6, Q-J-10-9-8: 6, others: 5×1)
            highCard: 17,        // NEW: 17 single cards
            total: 1334          // Updated: 1317 + 17 = 1334
        }
    },

    {
        id: 4,
        name: "Seven Jacks",
        cards: "J♠ J♥ J♦ J♣ J♠ J♥ J♦ A♠ K♠ Q♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠",
        expected: {
            sevenOfAKind: 1,     // 1 natural 7K
            sixOfAKind: 7,       // 7 drop-one variants from 7K
            flush: 792,          // C(12,5) = 792 spades flushes (12♠, 2♥, 2♦, 1♣)
            straight: 31,        // 31 straights (A-K-Q-J-10: 7, K-Q-J-10-9: 7, Q-J-10-9-8: 7, J-10-9-8-7: 7, others: 3×1)
            highCard: 17,        // NEW: 17 single cards
            total: 848           // Updated: 831 + 17 = 848
        }
    },

    {
        id: 5,
        name: "Eight Tens",
        cards: "10♠ 10♥ 10♦ 10♣ 10♠ 10♥ 10♦ 10♣ A♠ K♠ Q♠ J♠ 9♠ 8♠ 7♠ 6♠ 5♠",
        expected: {
            eightOfAKind: 1,     // 1 natural 8K
            sevenOfAKind: 8,     // 8 drop-one variants from 8K
            flush: 462,          // C(11,5) = 462 spades flushes (11♠, 2♥, 2♦, 2♣)
            straight: 41,        // 41 straights (A-K-Q-J-10: 8, K-Q-J-10-9: 8, Q-J-10-9-8: 8, J-10-9-8-7: 8, 10-9-8-7-6: 8, 9-8-7-6-5: 1)
            highCard: 17,        // NEW: 17 single cards
            total: 529           // Updated: 512 + 17 = 529
        }
    },

    {
        id: 6,
        name: "Multiple 4-of-a-kinds",
        cards: "A♠ A♥ A♦ A♣ K♠ K♥ K♦ K♣ Q♠ Q♥ Q♦ Q♣ J♠ J♥ J♦ J♣ 10♠",
        expected: {
            fourOfAKind: 4,      // 4 natural 4Ks (A,K,Q,J)
            threeOfAKind: 16,    // 4×4 = 16 drop-one variants
            flush: 1,            // C(5,5) = 1 spades flush (A,K,Q,J,10)
            straight: 256,       // 256 straights (A-K-Q-J-10: 4×4×4×4×1)
            highCard: 17,        // NEW: 17 single cards
            total: 294           // Updated: 277 + 17 = 294
        }
    },

    {
        id: 7,
        name: "Triples and Pairs",
        cards: "A♠ A♥ A♦ K♠ K♥ K♦ Q♠ Q♥ Q♦ J♠ J♥ J♦ 10♠ 10♥ 10♦ 9♠ 9♥",
        expected: {
            threeOfAKind: 5,     // 5 natural 3Ks (A,K,Q,J,10)
            pair: 16,            // 5×3 = 15 from 3Ks + 1 natural pair (9s)
            fullHouse: 65,       // 5 trips × 13 eligible pairs = 65 full houses
            flush: 13,           // 6♠ + 6♥ + 1♦ = C(6,5) + C(6,5) + C(5,5) = 6+6+1 = 13 flushes
            straight: 405,       // 405 straights (A-K-Q-J-10: 243, K-Q-J-10-9: 162)
            highCard: 17,        // NEW: 17 single cards
            total: 521           // Updated: 504 + 17 = 521
        }
    },

    {
        id: 8,
        name: "Mixed: 5K + 4K + 3Ks + pairs",
        cards: "A♠ A♥ A♦ A♣ A♠ K♠ K♥ K♦ K♣ Q♠ Q♥ Q♦ J♠ J♥ J♦ 10♠ 9♠",
        expected: {
            fiveOfAKind: 1,      // 1 natural 5K (Aces)
            fourOfAKind: 6,      // 5 from 5K + 1 natural 4K (Kings)
            threeOfAKind: 6,     // 4 from 4K + 1 natural 3K (Q) + 1 natural 3K (J)
            pair: 6,             // 3 from Q 3K + 3 from J 3K
            fullHouse: 30,       // 4×6 + 1×3 + 1×3 = 30 full houses
            flush: 21,           // C(7,5) = 21 spades flushes (A♠,A♠,K♠,Q♠,J♠,10♠,9♠)
            straight: 216,       // 216 straights (A-K-Q-J-10: 180, K-Q-J-10-9: 36)
            highCard: 17,        // NEW: 17 single cards
            total: 303           // Updated: 286 + 17 = 303
        }
    },

    // =============================================================================
    // STRAIGHT FLUSH TEST CASES (5-8 card) - UPDATED WITH HIGH CARDS
    // =============================================================================

    {
        id: 9,
        name: "5-card Straight Flush (A-K-Q-J-10 spades)",
        cards: "A♠ K♠ Q♠ J♠ 10♠ A♥ K♥ Q♥ J♥ 10♥ 9♦ 8♦ 7♦ 6♦ 5♦ 4♣ 3♣",
        expected: {
            straightFlush: 2,    // A-K-Q-J-10♠ and A-K-Q-J-10♥
            flush: 1,            // C(5,5) = 1 diamonds flush
            straight: 8,         // A-K-Q-J-10: 2×2=4, K-Q-J-10-9: 2×1=2, 9-8-7-6-5: 1×1=1, 7-6-5-4-3: 1×1=1
            highCard: 17,        // NEW: 17 single cards
            total: 28            // Updated: 11 + 17 = 28
        }
    },

    {
        id: 10,
        name: "6-card Straight Flush (A-K-Q-J-10-9 spades)",
        cards: "A♠ K♠ Q♠ J♠ 10♠ 9♠ A♥ K♥ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠ 2♠ 8♥ 7♥",
        expected: {
            sixCardStraightFlush: 2, // A-K-Q-J-10-9♠ and K-Q-J-10-9-8♠
            straightFlush: 10,       // Various 5-card SFs from the spades
            flush: 1287,            // C(13,5) = 1287 spades flushes
            straight: 26,           // Multiple straights possible
            highCard: 17,           // NEW: 17 single cards
            total: 1342             // Updated: 1325 + 17 = 1342
        }
    },

    {
        id: 11,
        name: "7-card Straight Flush (A-K-Q-J-10-9-8 spades)",
        cards: "A♠ K♠ Q♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠ 2♠ A♥ K♥ Q♥ J♥",
        expected: {
            sevenCardStraightFlush: 3, // A-K-Q-J-10-9-8♠, K-Q-J-10-9-8-7♠, Q-J-10-9-8-7-6♠
            sixCardStraightFlush: 9,   // Various 6-card SFs
            straightFlush: 21,         // Various 5-card SFs
            flush: 1287,              // C(13,5) = 1287 spades flushes
            straight: 33,             // Multiple straights
            highCard: 17,             // NEW: 17 single cards
            total: 1370               // Updated: 1353 + 17 = 1370
        }
    },

    {
        id: 12,
        name: "8-card Straight Flush (A-K-Q-J-10-9-8-7 spades)",
        cards: "A♠ K♠ Q♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠ 2♠ A♥ K♥ Q♥ J♥",
        expected: {
            eightCardStraightFlush: 4, // A-K-Q-J-10-9-8-7♠, K-Q-J-10-9-8-7-6♠, Q-J-10-9-8-7-6-5♠, J-10-9-8-7-6-5-4♠
            sevenCardStraightFlush: 12, // Various 7-card SFs
            sixCardStraightFlush: 24,   // Various 6-card SFs
            straightFlush: 36,          // Various 5-card SFs
            flush: 1287,               // C(13,5) = 1287 spades flushes
            straight: 40,              // Multiple straights
            highCard: 17,              // NEW: 17 single cards
            total: 1420                // Updated: 1403 + 17 = 1420
        }
    },

    {
        id: 13,
        name: "Wheel Straight Flush (5-4-3-2-A spades)",
        cards: "5♠ 4♠ 3♠ 2♠ A♠ 6♠ 7♠ 8♠ 9♠ 10♠ J♠ Q♠ K♠ 5♥ 4♥ 3♥ 2♥",
        expected: {
            straightFlush: 10,       // 5-4-3-2-A♠ + various others from K-Q-J-10-9 down
            flush: 1287,            // C(13,5) = 1287 spades flushes
            straight: 19,           // Various straights including wheel
            highCard: 17,           // NEW: 17 single cards
            total: 1333             // Updated: 1316 + 17 = 1333
        }
    },

    {
        id: 14,
        name: "Mixed Suits - No Straight Flushes",
        cards: "A♠ K♥ Q♦ J♣ 10♠ 9♥ 8♦ 7♣ 6♠ 5♥ 4♦ 3♣ 2♠ A♥ K♦ Q♣ J♠",
        expected: {
            straightFlush: 0,        // No 5+ cards of same suit in sequence
            flush: 0,               // No suit has 5+ cards
            straight: 32,           // A-K-Q-J-10: 16, others: 16
            highCard: 17,           // NEW: 17 single cards
            total: 49               // Updated: 32 + 17 = 49
        }
    },

    {
        id: 15,
        name: "Multiple Straight Flushes in Different Suits",
        cards: "A♠ K♠ Q♠ J♠ 10♠ A♥ K♥ Q♥ J♥ 10♥ 9♦ 8♦ 7♦ 6♦ 5♦ 4♣ 3♣",
        expected: {
            straightFlush: 3,        // A-K-Q-J-10♠, A-K-Q-J-10♥, 9-8-7-6-5♦
            flush: 1,               // C(5,5) = 1 diamonds flush
            straight: 6,            // Various combinations
            highCard: 17,           // NEW: 17 single cards
            total: 27               // Updated: 10 + 17 = 27
        }
    },

    {
        id: 16,
        name: "6-card Wheel Straight Flush",
        cards: "6♠ 5♠ 4♠ 3♠ 2♠ A♠ 7♠ 8♠ 9♠ 10♠ J♠ Q♠ K♠ 6♥ 5♥ 4♥ 3♥",
        expected: {
            sixCardStraightFlush: 1, // 6-5-4-3-2-A♠
            straightFlush: 9,        // 5-4-3-2-A♠ + others
            flush: 1287,            // C(13,5) = 1287 spades flushes
            straight: 15,           // Various straights
            highCard: 17,           // NEW: 17 single cards
            total: 1329             // Updated: 1312 + 17 = 1329
        }
    },

    {
        id: 17,
        name: "Auto-Calculated Test - No Manual Expected",
        cards: "A♠ A♥ K♠ K♥ Q♠ Q♥ J♠ J♥ 10♠ 10♥ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠"
    }

];

// =============================================================================
// MAIN TEST RUNNER FUNCTIONS
// =============================================================================

/**
 * Run all HandDetector tests
 */
function runHandDetectorTests() {
    const framework = new HandDetectorTestFramework();
    const results = framework.runAllTests(HAND_DETECTOR_TEST_CASES);
    return results;
}

/**
 * Run a specific test by ID
 */
function runSingleTest(testId) {
    const framework = new HandDetectorTestFramework();
    const testCase = HAND_DETECTOR_TEST_CASES.find(t => t.id === testId);

    if (!testCase) {
        console.log(`❌ Test ${testId} not found`);
        return null;
    }

    return framework.runTestCase(testCase);
}

/**
 * Run only the straight flush tests (ids 9-16)
 */
function runStraightFlushTests() {
    const framework = new HandDetectorTestFramework();
    const sfTestCases = HAND_DETECTOR_TEST_CASES.filter(t => t.id >= 9);

    console.log('🌈 ======== STRAIGHT FLUSH TESTS ONLY ========');
    const results = framework.runAllTests(sfTestCases);
    return results;
}

/**
 * Calculate expected values for a test case without running the detector
 */
function calculateExpectedValues(testId) {
    const framework = new HandDetectorTestFramework();
    const testCase = HAND_DETECTOR_TEST_CASES.find(t => t.id === testId);

    if (!testCase) {
        console.log(`❌ Test ${testId} not found`);
        return null;
    }

    console.log(`\n🧮 CALCULATING EXPECTED VALUES FOR TEST ${testId}: ${testCase.name}`);
    console.log(`Cards: ${testCase.cards}`);

    const calculated = framework.calculateExpectedCounts(testCase.cards);
    const comparison = framework.compareExpectedValues(testCase.expected, calculated);

    console.log('\n📋 COMPARISON RESULTS:');
    console.log('Manual expected:', testCase.expected);
    console.log('Calculated expected:', calculated);

    if (comparison.match) {
        console.log('✅ Values match perfectly!');
    } else {
        console.log('⚠️ Differences found:');
        comparison.differences.forEach(diff => {
            console.log(`   ${diff.category}: manual=${diff.manual}, calculated=${diff.calculated}`);
        });
    }

    return { manual: testCase.expected, calculated, comparison };
}