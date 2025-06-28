// js/hands/hand-detector.js v8
// Added straight detection using consecutive rank counts
// v7: Added flush detection using combinations from each suit
// v6: Added full house detection using all trips and pairs combinations
// v5: Drop-one-card pattern for of-a-kind hands

class HandDetector {
    constructor(cards) {
        this.cards = cards.filter(c => !c.isWild); // No wilds for now
        this.allHands = [];
    }

    /**
     * Main entry point - detect of-a-kind hands, full houses, flushes, and straights
     * @returns {Object} Structured results
     */
    detectAllHands() {
        console.log(`🔍 HandDetector analyzing ${this.cards.length} cards...`);

        // Count ranks and suits
        const { rankCounts, suitCounts } = this.countRanksAndSuits();

        // Detect of-a-kind hands with drop-one-card pattern
        this.detectOfAKind(rankCounts);

        // Detect full houses using all trips and pairs
        this.detectFullHouses();

        // Detect flushes using combinations from each suit
        this.detectFlushes(suitCounts);

        // Detect straights using consecutive rank counts
        this.detectStraights(rankCounts);

        return this.formatResults();
    }

    /**
     * Count how many cards we have of each rank and suit
     */
    countRanksAndSuits() {
        const rankCounts = {};
        const suitCounts = {};

        this.cards.forEach(card => {
            // Count ranks
            rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;

            // Count suits
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        });

        console.log('📊 Rank counts:', rankCounts);
        console.log('📊 Suit counts:', suitCounts);

        return { rankCounts, suitCounts };
    }

    /**
     * Detect of-a-kind hands with drop-one-card pattern
     * For each rank with N cards (N >= 2):
     * - Natural pairs (count = 2): just the pair
     * - 3+ cards: 1 natural N-of-a-kind + N different (N-1)-of-a-kinds
     * NO CASCADING - just one level down
     */
    detectOfAKind(rankCounts) {
        Object.entries(rankCounts).forEach(([rank, count]) => {
            if (count >= 2) {
                const allCardsOfRank = this.cards.filter(c => c.rank === rank);

                // Handle natural pairs (exactly 2 cards)
                if (count === 2) {
                    const naturalPair = allCardsOfRank.slice(0, 2);
                    this.addHand(naturalPair, 'Pair');
                }

                // Handle 3+ cards: natural + drop-one variants
                else if (count >= 3) {
                    // 1. Create natural N-of-a-kind
                    const naturalHand = allCardsOfRank.slice(0, count);
                    const naturalHandType = count >= 4 ? `${count} of a Kind` : 'Three of a Kind';
                    this.addHand(naturalHand, naturalHandType);

                    // 2. Create count different (count-1)-of-a-kinds by dropping one card each
                    const targetSize = count - 1;
                    const targetHandType = targetSize >= 4 ? `${targetSize} of a Kind` :
                                         targetSize === 3 ? 'Three of a Kind' : 'Pair';

                    for (let dropIndex = 0; dropIndex < count; dropIndex++) {
                        const variantHand = allCardsOfRank.slice(0, count)
                            .filter((card, index) => index !== dropIndex);

                        this.addHand(variantHand, targetHandType);
                    }
                }
            }
        });
    }

    /**
     * Detect straights using consecutive rank counts
     * 5 consecutive ranks with count >= 1 each
     * Number of straights = product of the 5 consecutive counts
     * Include A-2-3-4-5 wheel straight
     */
    detectStraights(rankCounts) {
        // Convert ranks to values for easier consecutive checking
        const rankValues = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };

        // Create value-to-count mapping
        const valueCounts = {};
        Object.entries(rankCounts).forEach(([rank, count]) => {
            const value = rankValues[rank];
            valueCounts[value] = count;
        });

        console.log(`🔢 Straight detection - value counts:`, valueCounts);

        // Check regular straights (5-6-7-8-9 through 10-J-Q-K-A)
        for (let startValue = 2; startValue <= 10; startValue++) {
            const consecutive = [startValue, startValue+1, startValue+2, startValue+3, startValue+4];

            // Check if all 5 consecutive values exist
            if (consecutive.every(val => valueCounts[val] > 0)) {
                const straightCount = consecutive.reduce((product, val) => product * valueCounts[val], 1);
                console.log(`🔢 Found straight ${startValue}-${startValue+4}: ${straightCount} combinations`);

                // Generate all combinations for this straight
                this.generateStraightCombinations(consecutive, valueCounts, rankValues);
            }
        }

        // Check wheel straight (A-2-3-4-5)
        const wheelValues = [14, 2, 3, 4, 5]; // A=14, but acts as 1 in wheel
        if (wheelValues.every(val => valueCounts[val] > 0)) {
            const wheelCount = wheelValues.reduce((product, val) => product * valueCounts[val], 1);
            console.log(`🔢 Found wheel straight A-2-3-4-5: ${wheelCount} combinations`);

            // Generate wheel straight combinations
            this.generateStraightCombinations(wheelValues, valueCounts, rankValues);
        }
    }

    /**
     * Generate all combinations for a specific straight
     */
    generateStraightCombinations(values, valueCounts, rankValues) {
        // Get all cards for each value in the straight
        const cardsByValue = {};
        values.forEach(value => {
            cardsByValue[value] = this.cards.filter(card => {
                const cardValue = rankValues[card.rank];
                return cardValue === value;
            });
        });

        // Generate all combinations (one card from each value)
        const generateCombos = (valueIndex, currentCombo) => {
            if (valueIndex >= values.length) {
                // Complete combination - add as straight
                this.addHand([...currentCombo], 'Straight');
                return;
            }

            const value = values[valueIndex];
            const availableCards = cardsByValue[value];

            availableCards.forEach(card => {
                currentCombo.push(card);
                generateCombos(valueIndex + 1, currentCombo);
                currentCombo.pop();
            });
        };

        generateCombos(0, []);
    }

    /**
     * Detect flushes using combinations from each suit
     * Any suit with 5+ cards generates C(n,5) different 5-card flushes
     */
    detectFlushes(suitCounts) {
        Object.entries(suitCounts).forEach(([suit, count]) => {
            if (count >= 5) {
                // Get all cards of this suit
                const suitCards = this.cards.filter(c => c.suit === suit);

                // Generate all 5-card combinations from this suit
                const flushCombinations = this.generateCombinations(suitCards, 5);

                console.log(`♠️ Suit ${suit}: ${count} cards → ${flushCombinations.length} flushes`);

                flushCombinations.forEach(combo => {
                    this.addHand(combo, 'Flush');
                });
            }
        });
    }

    /**
     * Generate all combinations of r cards from the given array
     */
    generateCombinations(cards, r) {
        if (r > cards.length) return [];
        if (r === 1) return cards.map(card => [card]);
        if (r === cards.length) return [cards];

        const combinations = [];

        function combine(start, current) {
            if (current.length === r) {
                combinations.push([...current]);
                return;
            }

            for (let i = start; i < cards.length; i++) {
                current.push(cards[i]);
                combine(i + 1, current);
                current.pop();
            }
        }

        combine(0, []);
        return combinations;
    }

    /**
     * Detect full houses using all available trips and pairs
     * Full house = 3 cards of one rank + 2 cards of different rank
     */
    detectFullHouses() {
        // Get all trips and pairs from our existing hands
        const trips = this.allHands.filter(h => h.handType === 'Three of a Kind');
        const pairs = this.allHands.filter(h => h.handType === 'Pair');

        console.log(`🏠 Full house detection: ${trips.length} trips, ${pairs.length} pairs`);

        // Debug: show rank breakdown
        const tripsByRank = {};
        const pairsByRank = {};
        trips.forEach(t => {
            tripsByRank[t.rank] = (tripsByRank[t.rank] || 0) + 1;
        });
        pairs.forEach(p => {
            pairsByRank[p.rank] = (pairsByRank[p.rank] || 0) + 1;
        });
        console.log(`🏠 Trips by rank:`, tripsByRank);
        console.log(`🏠 Pairs by rank:`, pairsByRank);

        // Create full house from each trip + each pair (different ranks only)
        let fullHouseCount = 0;
        trips.forEach(trip => {
            pairs.forEach(pair => {
                if (trip.rank !== pair.rank) {
                    const fullHouse = [...trip.cards, ...pair.cards];
                    this.addHand(fullHouse, 'Full House');
                    fullHouseCount++;
                }
            });
        });

        console.log(`🏠 Created ${fullHouseCount} full houses`);
    }

    /**
     * Add a hand to our results
     */
    addHand(cards, handType) {
        this.allHands.push({
            cards: [...cards],
            handType,
            cardCount: cards.length,
            rank: cards[0].rank  // All cards same rank for of-a-kind
        });

        console.log(`🎯 Found: ${handType} of ${cards[0].rank}s (${cards.length} cards)`);
    }

    /**
     * Format results
     */
    formatResults() {
        const results = {
            total: this.allHands.length,
            hands: this.allHands
        };

        console.log(`✅ HandDetector found ${results.total} hands (of-a-kind + full houses + flushes + straights)`);
        return results;
    }
}