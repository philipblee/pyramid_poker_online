// js/utilities/count-valid-hands.js
// Utilities for counting valid hands from any number of cards
// Extracted from hand-detector-test-framework.js for reuse in smart subset optimization

class CountValidHands {
    constructor() {
        // Constructor can be empty or minimal
    }

    /**
     * Calculate expected hand counts for a given card set
     * Copied from hand-detector-test-framework.js calculateExpectedCounts()
     */
    calculateExpectedCounts(cardString) {
        const testCards = this.parseCards(cardString);

        // Count cards by rank
        const rankCounts = {};
        testCards.forEach(card => {
            rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        });

        // Count cards by suit
        const suitCounts = {};
        testCards.forEach(card => {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        });

        console.log('🔢 CALCULATING EXPECTED COUNTS:');
        console.log('Rank distribution:', rankCounts);
        console.log('Suit distribution:', suitCounts);

        const calculated = {};

        // Calculate of-a-kind hands
        this.calculateOfAKindHands(rankCounts, calculated);

        // Calculate two pairs
        this.calculateTwoPairs(rankCounts, calculated);

        // Calculate flush hands
        this.calculateFlushHands(suitCounts, calculated);

        // Calculate straight hands
        this.calculateStraightHands(rankCounts, calculated);

        // Calculate straight flush hands
        this.calculateStraightFlushHands(suitCounts, testCards, calculated);

        // Calculate full houses
        this.calculateFullHouses(rankCounts, calculated);

        // Calculate single card hands
        this.calculateSingleCardHands(testCards, calculated);

        // Calculate total
        calculated.total = Object.entries(calculated)
            .filter(([key]) => key !== 'total')
            .reduce((sum, [, count]) => sum + count, 0);

        console.log('📊 CALCULATED EXPECTED COUNTS:', calculated);
        return calculated;
    }

    /**
     * Calculate of-a-kind hands (pairs, trips, 4K, 5K, 6K, 7K, 8K)
     */
    calculateOfAKindHands(rankCounts, calculated) {
        // Initialize counters
        calculated.pair = 0;
        calculated.threeOfAKind = 0;
        calculated.fourOfAKind = 0;
        calculated.fiveOfAKind = 0;
        calculated.sixOfAKind = 0;
        calculated.sevenOfAKind = 0;
        calculated.eightOfAKind = 0;

        Object.entries(rankCounts).forEach(([rank, count]) => {
            // Handle natural pairs (exactly 2 cards)
            if (count === 2) {
                calculated.pair += 1;
            }

            // Handle 3 cards: natural trip + drop-one variants
            else if (count === 3) {
                calculated.threeOfAKind += 1; // Natural trip
                calculated.pair += count; // Natural trips → pairs only
            }

            // Handle 4K: EXPAND WITH KICKERS
            else if (count === 4) {
                // Calculate available kickers for this 4K
                const availableKickers = this.calculateAvailableKickers(rank, rankCounts);
                calculated.fourOfAKind += availableKickers; // Expanded 4K hands
                calculated.threeOfAKind += count; // 4K → 3K drop-one variants

                console.log(`🃏 4K of ${rank}s: ${availableKickers} kickers available → ${availableKickers} complete 4K hands`);
            }

            // Handle 5+ cards: natural + drop-one variants
            else if (count >= 5) {
                // Natural hand
                if (count >= 8) {
                    calculated.eightOfAKind += 1;
                    calculated.sevenOfAKind += count; // 8K → 7K only
                } else if (count >= 7) {
                    calculated.sevenOfAKind += 1;
                    calculated.sixOfAKind += count; // 7K → 6K only
                } else if (count >= 6) {
                    calculated.sixOfAKind += 1;
                    calculated.fiveOfAKind += count; // 6K → 5K only
                } else if (count >= 5) {
                    calculated.fiveOfAKind += 1;

                    // 5K → 4K variants need expansion too!
                    const availableKickers = this.calculateAvailableKickers(rank, rankCounts);
                    calculated.fourOfAKind += (count * availableKickers); // Each 5K→4K gets expanded
                }
            }
        });
    }

    /**
     * Calculate available kickers for 4K expansion
     * Returns number of individual cards available as kickers
     */
    calculateAvailableKickers(excludeRank, rankCounts) {
        let kickers = 0;

        console.log(`🃏 Calculating kickers for 4K of ${excludeRank}s:`);

        Object.entries(rankCounts).forEach(([rank, count]) => {
            if (rank !== excludeRank) {
                // Each individual card can be a kicker
                kickers += count;
                console.log(`  ${rank}: ${count} cards → ${count} kickers`);
            }
        });

        console.log(`🃏 Total kickers available: ${kickers}`);
        return kickers;
    }

    /**
     * Calculate two pairs hands
     */
    calculateTwoPairs(rankCounts, calculated) {
        const totalPairs = calculated.pair || 0;

        if (totalPairs >= 2) {
            calculated.twoPair = this.combination(totalPairs, 2);
        } else {
            calculated.twoPair = 0;
        }

        console.log(`👥 Two pairs: C(${totalPairs}, 2) = ${calculated.twoPair}`);
    }

    /**
     * Calculate flush hands using combination formula C(n,5)
     */
    calculateFlushHands(suitCounts, calculated) {
        calculated.flush = 0;

        Object.entries(suitCounts).forEach(([suit, count]) => {
            if (count >= 5) {
                calculated.flush += this.combination(count, 5);
            }
        });
    }

    /**
     * Calculate straight hands
     */
    calculateStraightHands(rankCounts, calculated) {
        calculated.straight = 0;

        const straightPatterns = [
            [14, 13, 12, 11, 10], // A-K-Q-J-10
            [13, 12, 11, 10, 9],  // K-Q-J-10-9
            [12, 11, 10, 9, 8],   // Q-J-10-9-8
            [11, 10, 9, 8, 7],    // J-10-9-8-7
            [10, 9, 8, 7, 6],     // 10-9-8-7-6
            [9, 8, 7, 6, 5],      // 9-8-7-6-5
            [8, 7, 6, 5, 4],      // 8-7-6-5-4
            [7, 6, 5, 4, 3],      // 7-6-5-4-3
            [6, 5, 4, 3, 2],      // 6-5-4-3-2
            [5, 4, 3, 2, 14]      // 5-4-3-2-A (wheel)
        ];

        const valueCount = {};
        Object.entries(rankCounts).forEach(([rank, count]) => {
            const value = this.getRankValue(rank);
            valueCount[value] = count;
        });

        straightPatterns.forEach(pattern => {
            let ways = 1;
            let canForm = true;

            pattern.forEach(value => {
                const available = valueCount[value] || 0;
                if (available === 0) {
                    canForm = false;
                } else {
                    ways *= available;
                }
            });

            if (canForm) {
                calculated.straight += ways;
            }
        });
    }

    /**
     * Calculate straight flush hands (5-8 cards)
     */
    calculateStraightFlushHands(suitCounts, testCards, calculated) {
        calculated.straightFlush = 0;
        calculated.sixCardStraightFlush = 0;
        calculated.sevenCardStraightFlush = 0;
        calculated.eightCardStraightFlush = 0;

        Object.entries(suitCounts).forEach(([suit, count]) => {
            if (count >= 5) {
                const suitCards = testCards.filter(c => c.suit === suit);
                const suitRankCounts = {};
                suitCards.forEach(card => {
                    suitRankCounts[this.getRankValue(card.rank)] =
                        (suitRankCounts[this.getRankValue(card.rank)] || 0) + 1;
                });

                console.log(`🌈 Suit ${suit} rank counts:`, suitRankCounts);

                for (let length = 5; length <= Math.min(8, count); length++) {
                    const combinations = this.calculateStraightFlushCombinations(suitRankCounts, length);

                    if (length === 5) calculated.straightFlush += combinations;
                    else if (length === 6) calculated.sixCardStraightFlush += combinations;
                    else if (length === 7) calculated.sevenCardStraightFlush += combinations;
                    else if (length === 8) calculated.eightCardStraightFlush += combinations;
                }
            }
        });
    }

    /**
     * Calculate straight flush combinations for a specific length
     */
    calculateStraightFlushCombinations(suitRankCounts, length) {
        let totalCombinations = 0;

        for (let startValue = 2; startValue <= (15 - length); startValue++) {
            const consecutive = [];
            for (let i = 0; i < length; i++) {
                consecutive.push(startValue + i);
            }

            if (consecutive.every(val => suitRankCounts[val] > 0)) {
                const combinations = consecutive.reduce((product, val) =>
                    product * suitRankCounts[val], 1
                );
                totalCombinations += combinations;
                console.log(`🌈 Found ${length}-card SF ${consecutive.join('-')}: ${combinations} combinations`);
            }
        }

        if (length <= 6) {
            const wheelValues = [14];
            for (let i = 2; i < 2 + length - 1; i++) {
                wheelValues.push(i);
            }

            if (wheelValues.every(val => suitRankCounts[val] > 0)) {
                const combinations = wheelValues.reduce((product, val) =>
                    product * suitRankCounts[val], 1
                );
                totalCombinations += combinations;
                console.log(`🌈 Found ${length}-card wheel SF A-${wheelValues.slice(1).join('-')}: ${combinations} combinations`);
            }
        }

        return totalCombinations;
    }

    /**
     * Calculate single card hands
     */
    calculateSingleCardHands(testCards, calculated) {
        calculated.highCard = testCards.length;
        console.log(`🃏 Single cards: ${calculated.highCard} (one per card)`);
    }

    /**
     * Calculate full house hands
     */
    calculateFullHouses(rankCounts, calculated) {
        calculated.fullHouse = 0;

        Object.entries(rankCounts).forEach(([tripRank, tripCount]) => {
            if (tripCount === 3 || tripCount === 4) {
                const tripsAvailable = tripCount === 3 ? 1 : tripCount;

                Object.entries(rankCounts).forEach(([pairRank, pairCount]) => {
                    if (pairRank !== tripRank && pairCount >= 2) {
                        let pairsAvailable;
                        if (pairCount === 2) {
                            pairsAvailable = 1;
                        } else if (pairCount === 3) {
                            pairsAvailable = 3;
                        } else {
                            pairsAvailable = 0;
                        }

                        calculated.fullHouse += tripsAvailable * pairsAvailable;
                    }
                });
            }
        });
    }

    /**
     * Combination formula C(n,r) = n! / (r! * (n-r)!)
     */
    combination(n, r) {
        if (n < r) return 0;
        if (r === 0 || r === n) return 1;

        let result = 1;
        for (let i = 0; i < r; i++) {
            result = result * (n - i) / (i + 1);
        }
        return Math.round(result);
    }

    /**
     * Parse compact card notation into testCards array
     */
    parseCards(cardString) {
        const cards = [];
        const cardTokens = cardString.trim().split(/\s+/);

        cardTokens.forEach((token, index) => {
            if (token === '🃏') {
                // Skip wild cards for this analysis
                return;
            }

            const match = token.match(/^(\d+|[AKQJ])([♠♥♦♣])$/);
            if (!match) {
                throw new Error(`Invalid card format: ${token}`);
            }

            const [, rank, suit] = match;
            const value = this.getRankValue(rank);

            cards.push({
                suit: suit,
                rank: rank,
                value: value,
                id: `${rank}${suit}_${index + 1}`,
                isWild: false
            });
        });

        return cards;
    }

    /**
     * Get numeric value for rank
     */
    getRankValue(rank) {
        const values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        return values[rank];
    }
}