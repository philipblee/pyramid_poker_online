// js/core/deck.js
// Deck creation and card dealing functionality

class DeckManager {
    constructor() {
        this.deck = [];
    }

    createNewDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck = [];

        // Create two complete decks
        for (let deckNum = 1; deckNum <= 2; deckNum++) {
            for (let suit of suits) {
                for (let rank of ranks) {
                    deck.push({
                        suit,
                        rank,
                        value: this.getCardValue(rank),
                        id: `${rank}${suit}_${deckNum}`,
                        isWild: false
                    });
                }
            }
        }

        // Add wild cards
        const wildCardCount = window.gameConfig ? window.gameConfig.getWildCardCount() : 2;
        for (let i = 1; i <= wildCardCount; i++) {
            deck.push({
                suit: '🃏',
                rank: '🃏',
                value: 15,
                id: `WILD_JOKER_${i}`,
                isWild: true
            });
        }

        this.deck = this.shuffleDeck(deck);
        return this.deck;
    }

    getCardValue(rank) {
        if (rank === 'A') return 14;
        if (rank === 'K') return 13;
        if (rank === 'Q') return 12;
        if (rank === 'J') return 11;
        return parseInt(rank);
    }

    shuffleDeck(deck = null) {
        const deckToShuffle = deck || this.deck;
        for (let i = deckToShuffle.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deckToShuffle[i], deckToShuffle[j]] = [deckToShuffle[j], deckToShuffle[i]];
        }
        return deckToShuffle;
    }


    dealCards(numCards) {
        if (this.deck.length < numCards) {
            throw new Error(`Not enough cards in deck. Requested: ${numCards}, Available: ${this.deck.length}`);
        }
        return this.deck.splice(0, numCards);
    }

    getRemainingCards() {
        return this.deck.length;
    }

    resetDeck() {
        this.deck = [];
    }

    // For testing - add specific cards to deck
    addCardToDeck(card) {
        this.deck.push(card);
    }

    // For testing - create a controlled deck with specific cards
    createTestDeck(cards) {
        this.deck = [...cards];
        return this.deck;
    }
}
