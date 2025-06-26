// js/core/deck.js
// Deck creation and card dealing functionality

class DeckManager {
    constructor() {
        this.deck = [];
    }

    createNewDeck() {
        this.deck = createDeck(); // Uses existing createDeck function from utils
        return this.deck;
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

    shuffleDeck() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        return this.deck;
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