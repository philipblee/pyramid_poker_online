// js/hands/hand-detector.js v12
// FIXED: 4K and 2-card position logic
// Added validPositions field for Phase 2 combination generator
// Integrated with card-evaluation.js for proper hand rankings

class HandDetector {
    constructor(cards) {
        this.cards = cards.filter(c => !c.isWild); // No wilds for now
        this.allHands = [];
    }

    /**
     * Main entry point - detect of-a-kind hands, two pairs, full houses, flushes, and straights
     * @returns {Object} Structured results
     */
    detectAllHands() {
        console.log(`🔍 HandDetector analyzing ${this.cards.length} cards...`);

        // Count ranks and suits
        const { rankCounts, suitCounts } = this.countRanksAndSuits();

        // Detect straight flushes (5-8 cards)
        this.detectStraightFlushes(suitCounts);

        // Detect of-a-kind hands with drop-one-card pattern
        this.detectOfAKind(rankCounts);

        // Detect two pairs
        this.detectTwoPairs();

        // Detect full houses using all trips and pairs
        this.detectFullHouses();

        // Detect flushes using combinations from each suit
        this.detectFlushes(suitCounts);

        // Detect straights using consecutive rank counts
        this.detectStraights(rankCounts);

        // Detect single cards
        this.detectSingleCards();

        return this.formatResults();
    }

    /**
     * Determine which positions a hand can legally be placed in
     * @param {string} handType - Type of hand (e.g., 'Straight', 'Pair')
     * @param {number} cardCount - Number of cards in hand
     * @returns {Array} Array of valid positions ['front', 'middle', 'back']
     */
    determineValidPositions(handType, cardCount) {
        const positions = [];

        // 1-card hands - can contribute to front (3 cards) or middle (5 cards)
        if (cardCount === 1) {
            positions.push('front', 'middle'); // Essential for big hand scenarios
        }

        // 2-card hands (pairs that will get kickers)
        else if (cardCount === 2) {
            if (handType === 'Pair') {
                positions.push('front', 'middle', 'back'); // Will become 3-5 cards with kickers
            }
        }

        // 3-card hands - ONLY FRONT!
        else if (cardCount === 3) {
            if (['High Card', 'Pair', 'Three of a Kind'].includes(handType)) {
                positions.push('front');
            }
            // 3-card hands CANNOT go middle or back (need 5+ cards)
        }

        // 4-card hands (different rules for different hand types)
        else if (cardCount === 4) {
            if (handType === 'Two Pair') {
                positions.push('middle', 'back'); // Two Pair: below straight, middle/back only
            } else if (handType.includes('of a Kind')) {
                positions.push('front', 'middle', 'back'); // 4K: straight or better, all positions
            }
        }

        // 5-card hands
        else if (cardCount === 5) {
            positions.push('middle', 'back');

            // Front: only if straight or better
            if (this.isStraightOrBetter(handType)) {
                positions.push('front');
            }
        }

        // 6-7 card hands (ONLY straight flushes or of-a-kind)
        else if (cardCount >= 6 && cardCount <= 7) {
            if (this.isStraightFlushOrOfAKind(handType)) {
                positions.push('middle', 'back');
            }
            // Invalid 6-7 card hands get no valid positions
        }

        // 8 card hands (ONLY straight flushes or of-a-kind)
        else if (cardCount === 8) {
            if (this.isStraightFlushOrOfAKind(handType)) {
                positions.push('back'); // Only back for 8-card hands
            }
        }

        return positions;
    }

    /**
     * Check if hand type is straight or better (for front 5-card requirement)
     */
    isStraightOrBetter(handType) {
        return ['Straight', 'Flush', 'Full House', 'Four of a Kind',
                'Straight Flush', 'Five of a Kind',
                '6 of a Kind', '7 of a Kind', '8 of a Kind',
                '6-card Straight Flush', '7-card Straight Flush', '8-card Straight Flush'].includes(handType);
    }

    /**
     * Check if hand type is valid for 6-8 card hands
     */
    isStraightFlushOrOfAKind(handType) {
        return handType.includes('Straight Flush') ||
               handType.includes('of a Kind');
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
     * Detect straight flushes (5-8 cards) using consecutive rank counts within each suit
     */
    detectStraightFlushes(suitCounts) {
        console.log(`🌈 Straight flush detection starting...`);

        Object.entries(suitCounts).forEach(([suit, count]) => {
            if (count >= 5) {
                console.log(`🌈 Checking suit ${suit} with ${count} cards...`);

                // Get only cards of this suit
                const suitCards = this.cards.filter(c => c.suit === suit);

                // Create rank counts for this suit only
                const suitRankCounts = {};
                suitCards.forEach(card => {
                    suitRankCounts[card.rank] = (suitRankCounts[card.rank] || 0) + 1;
                });

                console.log(`🌈 Suit ${suit} rank counts:`, suitRankCounts);

                // Detect straights within this suit (5-8 cards)
                this.detectStraightsInSuit(suitRankCounts, suitCards, suit);
            }
        });
    }

    /**
     * Detect straights within a specific suit (for straight flushes)
     */
    detectStraightsInSuit(suitRankCounts, suitCards, suit) {
        // Convert ranks to values for easier consecutive checking
        const rankValues = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };

        // Create value-to-count mapping for this suit
        const valueCounts = {};
        Object.entries(suitRankCounts).forEach(([rank, count]) => {
            const value = rankValues[rank];
            valueCounts[value] = count;
        });

        // Check for 5-8 card straight flushes
        for (let straightLength = 5; straightLength <= 8; straightLength++) {
            // Check regular straights (5-6-7-8-9 through sequences ending at Ace)
            for (let startValue = 2; startValue <= (15 - straightLength); startValue++) {
                const consecutive = [];
                for (let i = 0; i < straightLength; i++) {
                    consecutive.push(startValue + i);
                }

                // Check if all consecutive values exist in this suit
                if (consecutive.every(val => valueCounts[val] > 0)) {
                    console.log(`🌈 Found ${straightLength}-card straight flush in ${suit}: ${consecutive.join('-')}`);

                    // Generate all combinations for this straight flush
                    this.generateStraightFlushCombinations(consecutive, valueCounts, rankValues, suitCards, suit, straightLength);
                }
            }

            // Check wheel straight flush (A-2-3-4-5, A-2-3-4-5-6, etc.)
            if (straightLength <= 6) { // Wheel can only go up to A-2-3-4-5-6
                const wheelValues = [14]; // Start with Ace
                for (let i = 2; i < 2 + straightLength - 1; i++) {
                    wheelValues.push(i);
                }

                if (wheelValues.every(val => valueCounts[val] > 0)) {
                    console.log(`🌈 Found ${straightLength}-card wheel straight flush in ${suit}: A-${wheelValues.slice(1).join('-')}`);

                    // Generate wheel straight flush combinations
                    this.generateStraightFlushCombinations(wheelValues, valueCounts, rankValues, suitCards, suit, straightLength);
                }
            }
        }
    }

    /**
     * Generate all combinations for a specific straight flush
     */
    generateStraightFlushCombinations(values, valueCounts, rankValues, suitCards, suit, straightLength) {
        // Get all cards for each value in the straight flush (from this suit only)
        const cardsByValue = {};
        values.forEach(value => {
            cardsByValue[value] = suitCards.filter(card => {
                const cardValue = rankValues[card.rank];
                return cardValue === value;
            });
        });

        // Generate all combinations (one card from each value)
        const generateCombos = (valueIndex, currentCombo) => {
            if (valueIndex >= values.length) {
                // Complete combination - add as straight flush with appropriate name
                const handTypeName = straightLength === 5 ? 'Straight Flush' : `${straightLength}-card Straight Flush`;
                this.addHand([...currentCombo], handTypeName);
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
     * Detect of-a-kind hands with drop-one-card pattern
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
     * Detect two pairs using existing pair hands
     */
    detectTwoPairs() {
        const pairs = this.allHands.filter(h => h.handType === 'Pair');
        console.log(`👥 Two pair detection: ${pairs.length} pairs available`);

        let twoPairCount = 0;
        if (pairs.length >= 2) {
            for (let i = 0; i < pairs.length; i++) {
                for (let j = i + 1; j < pairs.length; j++) {
                    const twoPair = [...pairs[i].cards, ...pairs[j].cards];
                    this.addHand(twoPair, 'Two Pair');
                    twoPairCount++;
                }
            }
        }
        console.log(`👥 Created ${twoPairCount} two pair hands`);
    }

    /**
     * Detect straights using consecutive rank counts
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
     * Detect single card hands (high cards)
     */
    detectSingleCards() {
        console.log(`🃏 Single card detection starting...`);

        let singleCardCount = 0;

        this.cards.forEach(card => {
            // Create a 1-card hand for each card
            this.addSingleCardHand([card], 'High Card');
            singleCardCount++;
        });

        console.log(`🃏 Created ${singleCardCount} single card hands`);
    }

    /**
     * Add a single card hand to our results (modified version of addHand)
     */
    addSingleCardHand(cards, handType) {
        // Get proper hand ranking from card-evaluation.js
        const handStrength = evaluateHand(cards);

        // Determine valid positions for this hand
        const validPositions = this.determineValidPositions(handType, cards.length);

        this.allHands.push({
            cards: [...cards],
            handType,
            cardCount: cards.length,
            rank: cards[0].rank,                    // Keep for backward compatibility
            handStrength: handStrength,             // NEW: Full evaluation result
            hand_rank: handStrength.hand_rank,      // NEW: Proper ranking tuple
            strength: handStrength.rank,            // NEW: Numeric strength
            validPositions: validPositions          // NEW: Where this hand can be placed
        });

        console.log(`🃏 Found: ${handType} ${cards[0].rank} of ${cards[0].suit} (${cards.length} card) - Valid: ${validPositions.join(', ')}`);
    }

    /**
     * Detect full houses using all available trips and pairs
     */
    detectFullHouses() {
        // Get all trips and pairs from our existing hands
        const trips = this.allHands.filter(h => h.handType === 'Three of a Kind');
        const pairs = this.allHands.filter(h => h.handType === 'Pair');

        console.log(`🏠 Full house detection: ${trips.length} trips, ${pairs.length} pairs`);

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
     * Add a hand to our results - NOW WITH PROPER RANKING AND VALID POSITIONS!
     */
    addHand(cards, handType) {
        // Get proper hand ranking from card-evaluation.js
        const handStrength = evaluateHand(cards);

        // Determine valid positions for this hand
        const validPositions = this.determineValidPositions(handType, cards.length);

        this.allHands.push({
            cards: [...cards],
            handType,
            cardCount: cards.length,
            rank: cards[0].rank,                // Keep for backward compatibility
            handStrength: handStrength,         // NEW: Full evaluation result
            hand_rank: handStrength.hand_rank,  // NEW: Proper ranking tuple
            strength: handStrength.rank,        // NEW: Numeric strength
            validPositions: validPositions      // NEW: Where this hand can be placed
        });

        console.log(`🎯 Found: ${handType} of ${cards[0].rank}s (${cards.length} cards) - Strength: ${handStrength.rank} - Valid: ${validPositions.join(', ')}`);
    }

    /**
     * Format results
     */
    formatResults() {
        const results = {
            total: this.allHands.length,
            hands: this.allHands
        };

        console.log(`✅ HandDetector found ${results.total} hands with proper rankings and position validation!`);
        return results;
    }
}