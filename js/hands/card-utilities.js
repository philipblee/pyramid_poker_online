// js/hands/card-utilities.js

class CardUtilities {
    static createTestCard(wildCard, rank, suit) {
        const values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };

        return {
            suit: suit,
            rank: rank,
            value: values[rank],
            id: wildCard.id, // Keep same ID so we can find it later
            isWild: false // Temporarily treat as normal card
        };
    }

    static createOptimalWild(originalWild, rank, suit) {
        const values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };

        return {
            suit: '🃏', // Keep wild suit for proper display and evaluation
            rank: 'WILD', // Keep wild rank for proper evaluation
            value: 15, // Keep wild value of 15 for proper sorting to the left
            id: originalWild.id,
            isWild: true, // Essential for hand evaluation
            optimizedAs: { rank, suit, gameValue: values[rank] }, // Store what the wild represents
            originalWild: true // Mark as optimized wild
        };
    }

    static groupCardsBySuit(cards) {
        const suitGroups = {};
        cards.forEach(card => {
            if (!suitGroups[card.suit]) {
                suitGroups[card.suit] = [];
            }
            suitGroups[card.suit].push(card);
        });
        return suitGroups;
    }

    static groupCardsByRank(cards) {
        const rankGroups = {};
        cards.forEach(card => {
            if (!rankGroups[card.rank]) {
                rankGroups[card.rank] = [];
            }
            rankGroups[card.rank].push(card);
        });
        return rankGroups;
    }

    static sortCardsByValue(cards, descending = true) {
        return [...cards].sort((a, b) => descending ? b.value - a.value : a.value - b.value);
    }

    static findLongestStraightFlush(suitCards) {
        if (suitCards.length < 5) return null;

        let longestStraight = [];
        let currentStraight = [suitCards[0]];

        for (let i = 1; i < suitCards.length; i++) {
            const current = suitCards[i];
            const previous = suitCards[i - 1];

            // Check if consecutive (accounting for duplicates from multiple decks)
            if (current.value === previous.value - 1) {
                currentStraight.push(current);
            } else if (current.value === previous.value) {
                // Skip duplicates
                continue;
            } else {
                // Break in sequence
                if (currentStraight.length >= 5 && currentStraight.length > longestStraight.length) {
                    longestStraight = [...currentStraight];
                }
                currentStraight = [current];
            }
        }

        // Check final sequence
        if (currentStraight.length >= 5 && currentStraight.length > longestStraight.length) {
            longestStraight = [...currentStraight];
        }

        return longestStraight.length >= 5 ? longestStraight : null;
    }

    static findLargestRankGroup(cards, minSize = 1) {
        const rankGroups = this.groupCardsByRank(cards);

        let bestRankGroup = null;
        let bestLength = minSize - 1;

        for (const rank in rankGroups) {
            const rankCards = rankGroups[rank];
            if (rankCards.length > bestLength) {
                bestLength = rankCards.length;
                bestRankGroup = {
                    cards: rankCards,
                    rank: rank,
                    length: rankCards.length
                };
            }
        }

        return bestRankGroup;
    }

    static validateCardCount(allCards, expectedCount = 17) {
        if (allCards.length !== expectedCount) {
            console.error(`Card count error: Found ${allCards.length} cards instead of ${expectedCount}`);
            return false;
        }
        return true;
    }

    static getAllCardIds(cards) {
        return new Set(cards.map(c => c.id));
    }

    static filterCardsExcluding(allCards, excludeIds) {
        return allCards.filter(c => !excludeIds.has(c.id));
    }

    static getRanks() {
        return ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    }

    static getSuits() {
        return ['♠', '♥', '♦', '♣'];
    }

    static getCardValues() {
        return {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
    }

    static logCardList(cards, label = 'Cards') {
        const cardStrings = cards.map(c => c.rank + c.suit);
        console.log(`${label}:`, cardStrings.join(', '));
    }

    static combineCards(...cardArrays) {
        return cardArrays.flat();
    }

    static separateWildCards(cards) {
        const wildCards = cards.filter(card => card.isWild);
        const nonWildCards = cards.filter(card => !card.isWild);
        return { wildCards, nonWildCards };
    }

    static createCardCopy(originalCard) {
        return { ...originalCard };
    }

    static hasWildCards(cards) {
        return cards.some(card => card.isWild);
    }

    static countWildCards(cards) {
        return cards.filter(card => card.isWild).length;
    }
}