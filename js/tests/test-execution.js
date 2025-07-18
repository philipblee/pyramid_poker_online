// js/tests/test-execution.js
// CENTRAL TEST EXECUTION - All test routines consolidated here
// Run tests with: TestExecution.runAllTests() or specific categories

class TestExecution {

    // =============================================================================
    // ANALYSIS TESTS
    // =============================================================================

    static runAnalysisTests() {
        console.log('\n🔬 ======== ANALYSIS TESTS ========');
        // We'll move test functions here
    }

    // =============================================================================
    // WILD CARD TESTS
    // =============================================================================

    static runWildCardTests() {
        console.log('\n🃏 ======== WILD CARD TESTS ========');

        // Test: Parameterized Wild Candidates (no function wrapper - code directly here)
        console.log('\n🧪 Testing Parameterized Wild Candidates (REFACTORED)');

        // Use the same quad test cards
        const test16CardsWithQuads = [
            // Four Aces (4K #1)
            {id: 'A♠_1', rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: 'A♥_2', rank: 'A', suit: '♥', value: 14, isWild: false},
            {id: 'A♦_3', rank: 'A', suit: '♦', value: 14, isWild: false},
            {id: 'A♣_4', rank: 'A', suit: '♣', value: 14, isWild: false},

            // Four Kings (4K #2)
            {id: 'K♠_5', rank: 'K', suit: '♠', value: 13, isWild: false},
            {id: 'K♥_6', rank: 'K', suit: '♥', value: 13, isWild: false},
            {id: 'K♦_7', rank: 'K', suit: '♦', value: 13, isWild: false},
            {id: 'K♣_8', rank: 'K', suit: '♣', value: 13, isWild: false},

            // Random scattered cards (8 more)
            {id: '7♠_9', rank: '7', suit: '♠', value: 7, isWild: false},
            {id: '3♥_10', rank: '3', suit: '♥', value: 3, isWild: false},
            {id: '8♦_11', rank: '8', suit: '♦', value: 8, isWild: false},
            {id: '5♣_12', rank: '5', suit: '♣', value: 5, isWild: false},
            {id: '2♠_13', rank: '2', suit: '♠', value: 2, isWild: false},
            {id: '9♥_14', rank: '9', suit: '♥', value: 9, isWild: false},
            {id: '6♦_15', rank: '6', suit: '♦', value: 6, isWild: false},
            {id: '4♣_16', rank: '4', suit: '♣', value: 4, isWild: false}
        ];

        console.log(`\n📋 Testing with ${test16CardsWithQuads.length} card objects`);
        console.log('🎯 This should FIND the Aces as candidates (5K improvement)');

        // Test the refactored generator
        const result = oneWildCandidates(test16CardsWithQuads);

        console.log('\n🔍 Checking for Ace candidates:');
        const aceCards = ['A♠', 'A♥', 'A♦', 'A♣'];
        aceCards.forEach(ace => {
            const found = result.wildCandidates.includes(ace);
            console.log(`   ${ace}: ${found ? '✅ FOUND' : '❌ MISSING'}`);
        });

        console.log('\n📊 Baseline Analysis Summary:');
        console.log(result.baselineAnalysis);
    }

    // =============================================================================
    // HAND DETECTOR TESTS
    // =============================================================================

    static runHandDetectorTests() {
        console.log('\n🔍 ======== HAND DETECTOR TESTS ========');
        // We'll move hand detector tests here
    }

    // =============================================================================
    // MAIN TEST RUNNER
    // =============================================================================

    static runAllTests() {
        console.log('\n🚀 ======== RUNNING ALL TESTS ========');
        this.runAnalysisTests();
        this.runWildCardTests();
        this.runHandDetectorTests();
        console.log('\n✅ ======== ALL TESTS COMPLETE ========');
    }
}