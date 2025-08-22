// Fixed NetEV Lookup with Prefix Pattern Matching
// Instead of exact truncated matches, do prefix-based searches

// Mock lookup class with prefix matching support
class PrefixMatchNetEVLookup {
    constructor(data) {
        this.data = data;
        // Create reverse lookup index for faster prefix searches
        this.createPrefixIndex();
    }

    createPrefixIndex() {
        this.prefixIndex = {};

        Object.keys(this.data).forEach(key => {
            const [position, ...tuple] = key.split('_');
            const numericTuple = tuple.map(x => parseInt(x));

            // Index by position and hand type
            const handType = numericTuple[0];
            const indexKey = `${position}_${handType}`;

            if (!this.prefixIndex[indexKey]) {
                this.prefixIndex[indexKey] = [];
            }

            this.prefixIndex[indexKey].push({
                fullTuple: numericTuple,
                key: key,
                value: this.data[key]
            });
        });

        console.log('🗂️ Prefix index created:', Object.keys(this.prefixIndex));
    }

    // Exact lookup (original behavior)
    getNetEV(position, tuple) {
        const key = `${position.toLowerCase()}_${tuple.join('_')}`;
        return this.data[key] || null;
    }

    // NEW: Prefix lookup - find ANY match with same prefix
    getNetEVByPrefix(position, partialTuple) {
        const handType = partialTuple[0];
        const indexKey = `${position.toLowerCase()}_${handType}`;

        console.log(`🔍 Prefix search: ${indexKey} with prefix [${partialTuple.join(',')}]`);

        const candidates = this.prefixIndex[indexKey] || [];

        // Find entries that match the partial tuple prefix
        const matches = candidates.filter(candidate => {
            // Check if candidate starts with our partial tuple
            for (let i = 0; i < partialTuple.length; i++) {
                if (candidate.fullTuple[i] !== partialTuple[i]) {
                    return false;
                }
            }
            return true;
        });

        if (matches.length > 0) {
            // Return the first match (could implement better selection logic)
            const bestMatch = matches[0];
            console.log(`✅ Prefix match found: [${bestMatch.fullTuple.join(',')}] = ${bestMatch.value}`);
            return bestMatch.value;
        }

        console.log(`❌ No prefix matches found for [${partialTuple.join(',')}]`);
        return null;
    }

    // Get all possible matches for debugging
    getAllPrefixMatches(position, partialTuple) {
        const handType = partialTuple[0];
        const indexKey = `${position.toLowerCase()}_${handType}`;

        const candidates = this.prefixIndex[indexKey] || [];

        const matches = candidates.filter(candidate => {
            for (let i = 0; i < partialTuple.length; i++) {
                if (candidate.fullTuple[i] !== partialTuple[i]) {
                    return false;
                }
            }
            return true;
        });

        return matches.map(m => ({
            tuple: m.fullTuple,
            value: m.value
        }));
    }
}

// Enhanced mock data with more straight variations
const enhancedMockData = {
    // Ace-high straights (different second cards)
    'back_5_14_13': 2.45,    // A-K-Q-J-10
    'back_5_14_12': 2.42,    // A-K-Q-J-9 (if this exists in poker)
    'back_5_14_11': 2.40,    // A-K-Q-10-9 (if this exists)
    'back_5_14_5': 2.35,     // A-2-3-4-5 wheel

    // King-high straights
    'back_5_13_12': 2.38,    // K-Q-J-10-9
    'back_5_13_11': 2.35,    // K-Q-J-10-8 (if exists)

    // Queen-high straights
    'back_5_12_11': 2.31,    // Q-J-10-9-8
    'back_5_12_10': 2.28,    // Q-J-10-9-7 (if exists)

    // Lower straights
    'back_5_9_8': 2.15,      // 9-8-7-6-5
    'back_5_8_7': 2.10,      // 8-7-6-5-4

    // Middle position
    'middle_5_14_13': 1.85,
    'middle_5_13_12': 1.78,
    'middle_5_12_11': 1.71,

    // Front position
    'front_3_14': 0.95,
    'front_3_13': 0.88,
    'front_2_14': 0.42,

    // Four of a kind with various kickers
    'back_8_14_13': 5.85,    // 4 Aces, King kicker
    'back_8_14_12': 5.82,    // 4 Aces, Queen kicker
    'back_8_14_11': 5.79,    // 4 Aces, Jack kicker
    'back_8_13_14': 5.75,    // 4 Kings, Ace kicker
    'back_8_13_12': 5.72,    // 4 Kings, Queen kicker
};

// Initialize the prefix lookup
const prefixNetEVLookup = new PrefixMatchNetEVLookup(enhancedMockData);

// FIXED NetEV Lookup Function with Prefix Fallback
function lookupNetEVFixed(position, hand) {
    const handRank = hand.hand_rank || hand;

    console.log(`🔍 Starting NetEV lookup: ${position} [${handRank.join(',')}]`);

    // Step 1: Try exact match first (full tuple)
    let netEV = prefixNetEVLookup.getNetEV(position, handRank);
    if (netEV !== null) {
        console.log(`✅ Exact match found: ${netEV}`);
        return netEV;
    }

    // Step 2: Try prefix fallback with progressively shorter prefixes
    for (let length = Math.min(handRank.length - 1, 2); length >= 2; length--) {
        let partialTuple = handRank.slice(0, length);
        console.log(`🔍 Trying prefix match with: [${partialTuple.join(',')}]`);

        netEV = prefixNetEVLookup.getNetEVByPrefix(position, partialTuple);

        if (netEV !== null) {
            console.log(`🎯 Prefix match found at level ${length}: ${netEV}`);
            return netEV;
        }
    }

    // Step 3: Final hardcoded fallback (if prefix also fails)
    if (handRank.length >= 2) {
        const handType = handRank[0];
        const primaryRank = handRank[1];

        if (position.toLowerCase() === 'back') {
            const backFallback = handleIncompleteBackHand(handRank);
            if (backFallback !== null) {
                console.log(`🎯 Back hardcoded fallback: ${backFallback}`);
                return backFallback;
            }
        }
        // ... other position fallbacks
    }

    console.log('❌ Complete lookup failure - no prefix or hardcoded match');
    return null;
}

// Test the prefix lookup logic
function testPrefixLookup() {
    console.log('🧪 Testing Prefix Lookup Logic');
    console.log('=' .repeat(50));

    const testCases = [
        {
            name: "Exact match exists",
            position: "back",
            tuple: [5, 14, 13],  // Should find exact match
            expected: "exact_match"
        },
        {
            name: "Exact missing, prefix should work",
            position: "back",
            tuple: [5, 14, 10],  // No exact match, but [5,14] prefix should find [5,14,13]
            expected: "prefix_match"
        },
        {
            name: "Different prefix scenario",
            position: "back",
            tuple: [5, 13, 10],  // Should find [5,13,12] via prefix
            expected: "prefix_match"
        },
        {
            name: "Complete failure case",
            position: "back",
            tuple: [5, 6, 5],    // No matches at all
            expected: "hardcoded_fallback"
        }
    ];

    testCases.forEach(test => {
        console.log(`\n📋 Test: ${test.name}`);
        console.log(`   Input: ${test.position} [${test.tuple.join(',')}]`);

        // Show what prefix matches are available
        const prefixMatches = prefixNetEVLookup.getAllPrefixMatches(test.position, test.tuple.slice(0, 2));
        if (prefixMatches.length > 0) {
            console.log(`   Available prefix matches:`);
            prefixMatches.forEach(m => {
                console.log(`     [${m.tuple.join(',')}] = ${m.value}`);
            });
        }

        const result = lookupNetEVFixed(test.position, { hand_rank: test.tuple });
        console.log(`   Result: ${result}`);
        console.log('   ' + '-'.repeat(30));
    });
}

// Hardcoded fallback function (unchanged)
function handleIncompleteBackHand(handRank) {
    const handType = handRank[0];
    const primaryRank = handRank[1];

    switch(handType) {
        case 5: // Straights
            if (primaryRank >= 14) return 2.20;  // Ace-high
            if (primaryRank >= 13) return 2.15;  // King-high
            if (primaryRank >= 10) return 2.05;  // Medium straights
            return 1.95;  // Low straights
        case 8: // Four of a kind
            return primaryRank >= 12 ? 5.70 : 5.50;
        case 3: // Trips
            return primaryRank >= 12 ? 1.85 : 1.65;
        case 2: // Pairs
            return primaryRank >= 12 ? 0.45 : 0.25;
        case 1: // High card
            return -1.29;
        default:
            return null;
    }
}

// Run the test
testPrefixLookup();