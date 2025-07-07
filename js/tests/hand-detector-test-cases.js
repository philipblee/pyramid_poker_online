// js/tests/hand-detector-test-cases.js v11
// Test cases for HandDetector - includes straight flush cases (5-8 card) + single cards
// UPDATED: Added highCard: 17 to all test cases and updated totals

const HAND_DETECTOR_TEST_CASES = [

    {
        id: 1,
        name: "Four Aces + Two Kings",
        cards: "A♠ A♥ A♦ A♣ K♠ Q♠ J♠ 10♠ 9♠ 8♠ 7♠ 6♠ 5♠ 4♠ 3♠ 2♠ K♥",
        expected: {
            fourOfAKind: 5,      // FIXED: 1 natural + 4 drop-one variants from 4 Aces
            threeOfAKind: 4,     // 4 drop-one variants from 4K (no change)
            pair: 1,             // 1 natural pair (Kings) (no change)
            fullHouse: 4,        // 4 trips × 1 pair = 4 full houses (no change)
            flush: 1287,         // C(13,5) = 1287 spades flushes (no change)
            straight: 21,        // 21 straights (no change)
            highCard: 17,        // 17 single cards (no change)
            total: 1339          // UPDATED: 1335 + 4 = 1339 (added 4 more 4Ks)
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
    },

    {
        id: 18,
        name: "Random Test Case 18",
        cards: "Q♣ 5♦ 4♦ K♦ 3♠ J♦ Q♦ 10♣ 9♦ A♥ 3♣ 8♣ J♠ 8♥ 4♣ 9♠ 10♥"
    },

    {
        id: 19,
        name: "Random Test Case 19",
        cards: "A♠ 6♥ K♣ 6♠ 4♦ 7♠ 4♦ 6♦ 10♣ 7♠ 3♦ Q♦ 2♥ 8♣ Q♠ 4♠ A♦"
    },

    {
        id: 20,
        name: "Random Test Case 20",
        cards: "Q♣ Q♣ 4♠ 10♠ 7♣ J♥ A♦ 5♠ 10♣ Q♦ 8♣ A♠ K♠ 5♣ 10♠ 3♠ 6♦"
    },

    {
        id: 21,
        name: "Random Test Case 21",
        cards: "2♠ 10♠ 2♠ 3♠ K♠ 4♥ 5♣ 10♦ 9♥ K♥ 3♠ 7♥ J♠ K♠ K♦ 5♠ 3♦"
    },

    {
        id: 22,
        name: "Random Test Case 22",
        cards: "J♥ 8♥ 10♦ 8♥ 4♥ 7♦ 9♠ 5♦ 3♥ 6♥ 4♣ K♥ 2♠ 2♥ 5♠ Q♦ 7♣"
    },

    {
        id: 23,
        name: "Random Test Case 23",
        cards: "9♥ 10♦ Q♥ 8♣ 8♥ 4♠ K♠ 6♣ 7♥ 7♥ 10♥ 6♦ 10♣ 7♣ 7♠ K♣ 4♦"
    },

    {
        id: 24,
        name: "Random Test Case 24",
        cards: "5♦ 3♥ 7♠ 9♠ 4♠ 2♣ Q♦ 8♠ 6♥ 5♠ 3♦ Q♠ K♦ 7♦ 4♦ 2♠ 6♦"
    },

    {
        id: 25,
        name: "Random Test Case 25",
        cards: "5♥ A♥ 4♠ K♦ 7♠ 2♥ 9♣ Q♦ 5♠ 2♥ 10♣ 4♠ 4♥ J♦ 2♠ Q♠ 2♠"
    },

    {
        id: 26,
        name: "Random Test Case 26",
        cards: "5♣ 10♥ Q♠ A♣ 6♣ 2♥ 8♣ 7♣ 5♠ 8♠ A♠ 8♥ 8♠ 7♥ 5♥ J♦ 9♦"
    },

    {
        id: 27,
        name: "Random Test Case 27",
        cards: "6♠ 8♠ Q♦ Q♥ 2♦ A♥ 3♥ 4♣ 8♥ 3♠ Q♠ 6♣ 6♠ 6♦ 2♥ 2♠ K♥"
    },

    {
        id: 28,
        name: "Random Test Case 28",
        cards: "K♦ J♦ Q♣ K♦ 10♥ 9♥ 8♥ K♠ 5♥ 10♣ 10♠ 5♣ 2♠ 5♣ J♣ Q♦ 2♦"
    },

    {
        id: 29,
        name: "Random Test Case 29",
        cards: "7♦ 3♥ 9♣ K♣ 6♥ J♥ A♠ 2♠ 2♥ 7♣ 8♥ Q♥ J♦ 7♦ 4♥ 3♦ 10♣"
    },

    {
        id: 30,
        name: "Random Test Case 30",
        cards: "K♥ 10♣ A♠ 3♦ 2♣ J♦ J♣ 7♣ A♣ 7♠ 3♥ 6♦ 6♠ Q♥ 10♠ 7♠ 4♣"
    },

    {
        id: 31,
        name: "Random Test Case 31",
        cards: "Q♣ 8♣ K♣ 4♦ K♥ 4♠ Q♥ 7♣ 9♦ 6♣ 10♠ 7♦ 9♣ A♠ A♣ 9♠ 5♥"
    },

    {
        id: 32,
        name: "Random Test Case 32",
        cards: "7♥ 4♠ J♠ J♦ K♥ 6♠ 6♥ 3♥ K♠ 3♠ 7♠ 2♣ 8♣ 2♥ 5♥ 3♥ 5♥"
    },

    {
        id: 33,
        name: "Random Test Case 33",
        cards: "K♥ Q♣ 10♣ 7♥ A♣ 5♦ 9♠ 4♠ J♠ 9♠ 3♣ K♠ 3♦ 8♥ A♥ 3♠ 4♣"
    },

    {
        id: 34,
        name: "Random Test Case 34",
        cards: "10♦ 6♥ A♣ 3♣ A♦ 7♥ A♦ 5♦ K♠ 8♣ 7♥ 6♠ 7♠ Q♦ Q♥ A♥ 9♥"
    },

    {
        id: 35,
        name: "Random Test Case 35",
        cards: "5♥ A♦ 7♦ 5♣ 8♠ K♣ A♠ K♦ 3♦ 3♠ A♥ 4♠ 2♠ 3♥ 10♥ 8♥ A♣"
    },

    {
        id: 36,
        name: "Random Test Case 36",
        cards: "5♠ Q♦ 2♣ 4♠ 2♣ Q♣ 7♥ 7♣ 6♠ 9♦ 10♦ 5♦ 4♣ A♣ 2♠ 3♣ K♠"
    },

    {
        id: 37,
        name: "Random Test Case 37",
        cards: "2♥ 6♠ K♠ 3♥ 10♣ 9♠ A♥ 3♠ A♦ 6♥ 3♣ 2♣ 10♠ 5♥ 3♣ K♥ A♠"
    },

    {
        id: 38,
        name: "Random Test Case 38",
        cards: "8♥ 9♠ 3♦ Q♦ 9♦ 2♠ 5♦ 3♥ 5♦ Q♠ Q♣ 9♦ 3♦ K♥ A♦ 2♣ K♣"
    },

    {
        id: 39,
        name: "Random Test Case 39",
        cards: "8♦ 5♥ 7♣ 10♠ A♦ A♠ K♠ 10♥ Q♠ 6♣ A♦ 5♦ K♦ 7♦ K♦ 9♥ 9♥"
    },

    {
        id: 40,
        name: "Random Test Case 40",
        cards: "7♥ 3♦ 2♥ Q♦ K♥ 7♥ 8♦ 8♠ 2♣ 6♦ 9♠ K♠ 9♦ 5♦ 2♥ 5♣ A♦"
    },

        {
        id: 41,
        name: "Random Test Case 41",
        cards: "9♠ 8♣ 10♠ 5♣ 4♥ 6♠ J♠ J♦ K♥ 7♠ Q♠ 6♥ 3♠ 6♦ 9♥ 4♦ 5♠"
    },

    {
        id: 42,
        name: "Random Test Case 42",
        cards: "J♥ 9♦ 7♣ 3♣ 8♥ 6♦ 5♥ K♦ K♥ J♦ 2♦ Q♣ 6♠ 4♦ 6♣ A♣ 7♣"
    },

    {
        id: 43,
        name: "Random Test Case 43",
        cards: "10♣ 2♣ A♦ K♦ 6♣ 10♠ 6♠ 8♣ Q♥ J♠ 3♠ J♠ 7♦ K♠ 10♦ 7♠ 4♥"
    },

    {
        id: 44,
        name: "Random Test Case 44",
        cards: "J♥ A♣ A♦ 6♥ K♣ A♥ Q♣ Q♠ 6♠ 2♣ 3♠ 8♥ K♠ 8♦ K♦ 4♣ 9♥"
    },

    {
        id: 45,
        name: "Random Test Case 45",
        cards: "3♥ 2♥ 4♥ 3♦ 9♠ J♣ 3♠ 6♠ 6♠ 7♣ 5♣ 8♦ 7♠ 6♣ 8♠ A♣ K♦"
    },

    {
        id: 46,
        name: "Random Test Case 46",
        cards: "Q♣ 8♠ 4♣ 7♠ 9♣ 9♥ 9♣ 4♦ Q♦ J♦ 6♣ 10♦ 2♣ 8♣ 4♣ 3♣ 3♥"
    },

    {
        id: 47,
        name: "Random Test Case 47",
        cards: "A♣ A♠ 9♠ 7♥ Q♠ 8♠ 6♠ 2♠ 9♣ 5♠ 2♥ 4♣ 5♦ J♦ K♣ 7♣ Q♦"
    },

    {
        id: 48,
        name: "Random Test Case 48",
        cards: "10♥ 2♠ J♥ 2♦ 5♦ A♣ 3♣ Q♥ 6♣ 6♦ A♥ 10♦ 4♦ 5♥ K♦ 10♠ 5♠"
    },

    {
        id: 49,
        name: "Random Test Case 49",
        cards: "5♣ 4♠ 9♣ 7♣ J♠ 3♠ 8♥ Q♥ 3♦ K♥ 7♠ 7♦ 10♣ 4♠ 3♠ 2♥ 3♣"
    },

    {
        id: 50,
        name: "Random Test Case 50",
        cards: "K♥ 6♠ 6♥ 7♣ 9♠ 7♥ J♦ 3♥ 9♦ 9♣ 7♦ 4♦ 4♥ K♦ K♥ Q♣ 9♣"
    },

    {
        id: 51,
        name: "Random Test Case 51",
        cards: "6♠ 7♠ 5♠ A♦ 5♣ 8♥ 10♦ 2♦ 3♠ Q♦ K♣ 10♣ K♦ J♣ K♠ A♠ 8♦"
    },

    {
        id: 52,
        name: "Random Test Case 52",
        cards: "10♥ J♥ 8♣ K♠ 9♦ 2♣ A♠ 7♥ 6♠ Q♥ 4♥ 3♦ 5♠ 9♠ 10♣ 4♠ J♣"
    },

    {
        id: 53,
        name: "Random Test Case 53",
        cards: "5♠ 8♥ 4♠ 3♦ J♣ Q♣ 8♠ 7♥ 9♥ Q♦ A♣ 7♣ 9♣ J♠ J♦ 8♣ 6♣"
    },

    {
        id: 54,
        name: "Random Test Case 54",
        cards: "9♦ 2♥ 10♣ 8♣ Q♠ Q♣ 3♠ J♦ Q♣ K♣ 7♦ 7♣ 8♠ Q♦ 8♣ K♥ K♦"
    },

    {
        id: 55,
        name: "Random Test Case 55",
        cards: "K♠ 4♠ 5♦ 8♠ 7♠ 2♠ 8♥ 4♦ J♦ 9♣ A♣ 8♣ 8♣ 3♦ 7♥ Q♥ Q♠"
    },

    {
        id: 56,
        name: "Random Test Case 56",
        cards: "8♠ 7♣ Q♠ A♣ J♥ 8♣ 2♥ K♦ 7♥ Q♥ J♣ 9♦ 10♠ 4♥ 10♥ 6♣ 9♣"
    },

    {
        id: 57,
        name: "Random Test Case 57",
        cards: "8♥ Q♣ Q♣ 5♠ 3♣ K♠ J♦ 8♦ K♥ A♦ 4♣ 9♥ 2♠ 2♠ 8♣ 10♣ 8♣"
    },

    {
        id: 58,
        name: "Random Test Case 58",
        cards: "K♠ A♠ 2♣ J♥ J♣ 6♦ 5♣ 8♦ K♥ J♥ 6♥ Q♦ 2♠ 10♠ 10♣ K♦ 10♥"
    },

    {
        id: 59,
        name: "Random Test Case 59",
        cards: "7♣ 10♥ 7♣ 3♠ 5♠ Q♣ A♥ J♠ K♠ 6♦ 9♥ 7♦ 5♦ A♠ 8♥ Q♥ A♦"
    },

    {
        id: 60,
        name: "Random Test Case 60",
        cards: "J♠ 6♥ 9♣ 2♣ 3♣ 6♥ 10♥ 8♦ 8♣ A♠ 5♥ 3♥ 6♠ 8♠ J♥ 7♥ 9♦"
    },

        {
        id: 61,
        name: "Random Test Case 61",
        cards: "K♠ 10♠ 10♣ 2♠ A♣ 8♠ 8♦ 3♠ J♠ 4♥ A♥ 9♣ 2♣ 2♦ 7♦ 9♠ 5♥"
    },

    {
        id: 62,
        name: "Random Test Case 62",
        cards: "3♦ K♣ 6♥ 6♣ 3♠ 10♥ A♦ 7♦ 2♣ Q♦ 7♥ 4♠ 6♣ 2♠ 10♥ 3♣ 8♥"
    },

    {
        id: 63,
        name: "Random Test Case 63",
        cards: "4♥ 3♣ 5♥ 6♦ 5♦ J♦ Q♠ 10♠ 8♥ 9♠ 5♠ 6♣ 5♣ K♠ 4♠ A♣ 3♥"
    },

    {
        id: 64,
        name: "Random Test Case 64",
        cards: "10♥ 2♣ A♦ K♣ 8♣ 9♥ A♥ Q♣ 8♠ K♥ J♥ J♠ 8♣ 2♥ Q♠ 5♦ 10♣"
    },

    {
        id: 65,
        name: "Random Test Case 65",
        cards: "6♦ 5♠ J♥ 7♥ 10♥ 4♦ 9♣ K♦ 3♠ 7♠ 4♦ K♥ J♠ Q♠ 6♦ 4♥ A♥"
    },

    {
        id: 66,
        name: "Random Test Case 66",
        cards: "3♦ A♥ 10♥ J♥ 9♣ 3♣ Q♦ J♣ 8♠ 8♣ 2♣ 10♦ 2♠ 4♣ 6♦ 7♥ 2♥"
    },

    {
        id: 67,
        name: "Random Test Case 67",
        cards: "2♥ 8♦ 2♠ 6♣ 6♥ 5♠ A♣ 8♠ 10♣ 5♥ A♦ J♣ 7♥ 5♣ K♠ 9♦ A♥"
    },

    {
        id: 68,
        name: "Random Test Case 68",
        cards: "10♦ 8♦ 5♦ 3♦ 5♣ J♦ A♥ 4♠ 8♥ 3♣ 3♣ A♠ J♣ 10♥ J♦ 9♣ K♣"
    },

    {
        id: 69,
        name: "Random Test Case 69",
        cards: "5♥ K♥ 4♠ A♣ 10♠ 2♣ K♠ 2♠ 8♦ J♠ K♦ 4♣ 5♠ 7♦ 8♣ 9♣ 2♥"
    },

    {
        id: 70,
        name: "Random Test Case 70",
        cards: "4♠ K♦ 6♦ Q♦ 4♣ 2♣ 2♦ 8♥ 3♠ 3♦ 10♦ J♥ 8♣ 2♥ 3♠ 5♥ 7♥"
    },

    {
        id: 71,
        name: "Random Test Case 71",
        cards: "K♣ Q♣ A♦ 7♠ 2♦ 8♥ 8♦ 8♣ Q♣ 6♦ Q♠ 10♦ J♥ 9♥ 4♦ 6♣ K♥"
    },

    {
        id: 72,
        name: "Random Test Case 72",
        cards: "5♠ 4♥ 6♦ 2♥ Q♥ 5♣ 8♦ 6♣ 10♠ K♠ 5♠ 5♦ A♣ J♥ Q♠ 7♥ 7♠"
    },

    {
        id: 73,
        name: "Random Test Case 73",
        cards: "10♣ K♠ 7♥ J♠ 8♦ 3♦ 7♦ Q♥ 8♠ 6♠ J♦ Q♣ 3♣ Q♠ K♥ K♠ 2♦"
    },

    {
        id: 74,
        name: "Random Test Case 74",
        cards: "Q♠ 4♣ 8♣ 9♥ J♦ Q♣ 4♦ 3♥ 8♣ 6♦ 5♦ A♥ 8♠ 9♥ A♣ K♥ A♥"
    },

    {
        id: 75,
        name: "Random Test Case 75",
        cards: "5♣ Q♣ A♣ J♣ 6♠ 4♦ 2♠ A♥ 7♣ 7♠ 4♠ 2♣ 6♣ 5♥ 9♦ 9♥ Q♥"
    },

    {
        id: 76,
        name: "Random Test Case 76",
        cards: "2♥ 5♦ 8♥ A♣ 8♣ 4♠ 6♣ 5♥ 8♣ K♦ 3♣ Q♥ 4♦ 10♠ 6♥ 10♦ A♦"
    },

    {
        id: 77,
        name: "Random Test Case 77",
        cards: "10♥ 4♣ 6♠ 5♣ 6♦ 10♣ J♣ 7♠ K♥ 10♦ 2♠ 5♦ Q♦ 10♠ A♦ 8♠ 3♥"
    },

    {
        id: 78,
        name: "Random Test Case 78",
        cards: "Q♣ K♠ J♠ 9♦ J♣ 7♠ A♠ 5♠ 9♠ 5♥ 3♣ A♦ K♥ Q♠ K♥ 8♣ 7♣"
    },

    {
        id: 79,
        name: "Random Test Case 79",
        cards: "J♠ Q♦ 3♣ 5♠ 2♥ Q♦ 4♠ 10♦ K♠ 3♣ K♥ 4♣ 8♠ 3♠ 6♣ 8♣ 2♣"
    },

    {
        id: 80,
        name: "Random Test Case 80",
        cards: "J♥ 8♣ 5♦ K♠ 2♥ 2♠ Q♣ A♥ K♦ 9♠ 5♣ 8♣ 9♠ J♦ 7♣ 10♣ 10♣"
    },

        {
        id: 81,
        name: "Random Test Case 81",
        cards: "7♠ 3♥ 8♦ 9♣ 4♦ 10♣ 8♣ 2♦ K♥ 6♠ 8♠ J♠ 3♠ J♠ 10♠ 5♥ 4♥"
    },

    {
        id: 82,
        name: "Random Test Case 82",
        cards: "3♠ K♥ 10♥ 5♦ 10♠ 2♦ 3♥ 2♦ 8♦ 9♠ K♦ 4♣ 6♠ Q♥ J♥ Q♠ 2♣"
    },

    {
        id: 83,
        name: "Random Test Case 83",
        cards: "10♣ 9♦ 3♦ K♥ Q♣ 6♣ 9♦ 7♥ J♦ 2♣ Q♥ 8♠ 4♣ 9♥ K♥ K♠ 8♥"
    },

    {
        id: 84,
        name: "Random Test Case 84",
        cards: "6♣ 10♥ A♣ 9♠ 5♠ 4♥ K♦ 10♣ 8♠ 9♥ 7♠ Q♥ Q♣ 5♥ A♥ 7♥ 8♥"
    },

    {
        id: 85,
        name: "Random Test Case 85",
        cards: "2♦ 8♦ Q♦ 10♠ K♦ 5♠ 3♠ 3♠ 10♠ 5♣ K♠ Q♠ Q♣ J♥ 8♣ A♠ A♣"
    },

    {
        id: 86,
        name: "Random Test Case 86",
        cards: "Q♣ J♠ 8♠ 4♦ 5♣ 10♣ A♠ 6♥ K♦ 9♣ 5♠ Q♦ 6♥ 3♦ Q♠ 10♥ 4♥"
    },

    {
        id: 87,
        name: "Random Test Case 87",
        cards: "10♦ 9♠ K♠ 8♥ 6♥ 2♠ 5♠ K♣ 3♠ 5♣ 3♦ A♦ 10♥ 7♦ 2♠ J♠ 6♠"
    },

    {
        id: 88,
        name: "Random Test Case 88",
        cards: "5♣ Q♦ J♣ 4♥ 5♦ 7♦ Q♣ 10♥ 2♥ 6♠ 3♣ 3♥ 5♠ 9♣ 8♣ 7♣ Q♥"
    },

    {
        id: 89,
        name: "Random Test Case 89",
        cards: "5♣ 4♠ K♦ Q♣ 10♣ 9♠ 5♦ K♣ J♥ J♦ 7♣ K♠ 4♥ 4♣ 4♣ K♥ 2♥"
    },

    {
        id: 90,
        name: "Random Test Case 90",
        cards: "Q♠ 9♥ J♣ J♥ 8♦ 9♣ 4♣ 4♠ A♣ 5♠ 3♦ 4♦ 2♦ A♠ 6♣ 3♣ 6♠"
    },

    {
        id: 91,
        name: "Random Test Case 91",
        cards: "8♣ 8♦ 5♦ 10♣ A♦ 10♥ Q♦ K♠ 7♥ 9♠ J♠ K♥ Q♠ 4♣ 6♦ 3♦ J♦"
    },

    {
        id: 92,
        name: "Random Test Case 92",
        cards: "K♠ 5♠ 6♠ 4♦ K♠ 10♦ 4♦ K♥ A♣ 3♠ A♥ 5♦ 4♥ 5♣ 3♥ A♠ 6♦"
    },

    {
        id: 93,
        name: "Random Test Case 93",
        cards: "J♣ J♠ 9♣ A♦ A♥ 6♦ 7♣ 8♦ 10♠ 4♥ 2♠ 8♥ 9♦ A♠ 4♦ 9♦ 5♣"
    },

    {
        id: 94,
        name: "Random Test Case 94",
        cards: "Q♠ A♠ J♣ 7♣ 4♥ 10♠ 7♦ 5♦ 5♣ A♠ 8♣ 8♦ 6♥ 10♥ Q♠ 6♠ 9♣"
    },

    {
        id: 95,
        name: "Random Test Case 95",
        cards: "7♦ 4♣ 4♥ A♣ 8♥ 9♠ 5♦ A♠ 4♦ K♠ Q♣ 5♥ A♣ A♦ J♥ 6♣ Q♦"
    },

    {
        id: 96,
        name: "Random Test Case 96",
        cards: "2♥ Q♠ Q♦ 6♠ 2♦ 9♥ 9♣ 2♣ 4♦ 5♠ 9♣ K♣ 4♥ 4♠ 8♦ 3♠ 7♦"
    },

    {
        id: 97,
        name: "Random Test Case 97",
        cards: "7♦ K♠ 3♦ A♣ 4♥ 3♣ 10♦ J♣ 9♥ 6♠ 9♦ K♣ 5♣ 2♦ 6♠ 4♣ 10♠"
    },

    {
        id: 98,
        name: "Random Test Case 98",
        cards: "6♥ 5♦ 5♥ 7♥ 8♦ 6♣ 4♥ 9♠ 8♦ J♥ 4♦ 3♦ 2♦ 2♠ 4♠ 7♠ A♥"
    },

    {
        id: 99,
        name: "Random Test Case 99",
        cards: "10♠ 8♠ A♠ 5♥ 5♦ 9♠ Q♠ 3♣ 2♣ 9♦ K♦ 6♣ 4♣ K♦ 5♣ K♥ 9♦"
    },

    {
        id: 100,
        name: "Random Test Case 100",
        cards: "A♥ 2♠ K♠ 6♠ 10♦ 2♥ J♥ A♦ 9♠ 5♦ Q♣ 9♦ 8♣ J♠ Q♣ 10♣ 4♦"
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

