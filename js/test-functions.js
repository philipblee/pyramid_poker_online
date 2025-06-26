/**
 * Test functions for Pyramid Poker Online
 * Contains helper functions for testing specific game scenarios
 */

/**
 * Creates a test hand with 6-card straight flush potential
 * @param {Object} deckManager - Instance of DeckManager
 * @param {Object} game - Instance of ChinesePokerGame
 * @param {number} playerIndex - Which player to deal the test hand to (0-based)
 * @returns {Array} The dealt cards
 */
function dealSixCardStraightFlushTestHand(deckManager, game, playerIndex = 0) {
    // Clear the deck and create a new one
    deckManager.createNewDeck();
    
    // Define the 6-card straight flush: A♠ K♠ Q♠ J♠ 10♠ 9♠
    const straightFlushCards = [
        { suit: '♠', rank: 'A', value: 14, id: 'A♠_1', isWild: false },
        { suit: '♠', rank: 'K', value: 13, id: 'K♠_1', isWild: false },
        { suit: '♠', rank: 'Q', value: 12, id: 'Q♠_1', isWild: false },
        { suit: '♠', rank: 'J', value: 11, id: 'J♠_1', isWild: false },
        { suit: '♠', rank: '10', value: 10, id: '10♠_1', isWild: false },
        { suit: '♠', rank: '9', value: 9, id: '9♠_1', isWild: false }
    ];
    
    // Create the complete hand directly (17 cards total)
    const completeHand = [
        ...straightFlushCards,
        { suit: '♥', rank: '8', value: 8, id: '8♥_1', isWild: false },
        { suit: '♦', rank: '7', value: 7, id: '7♦_1', isWild: false },
        { suit: '♣', rank: '6', value: 6, id: '6♣_1', isWild: false },
        { suit: '♥', rank: '5', value: 5, id: '5♥_1', isWild: false },
        { suit: '♦', rank: '4', value: 4, id: '4♦_1', isWild: false },
        { suit: '♣', rank: '3', value: 3, id: '3♣_1', isWild: false },
        { suit: '♥', rank: '2', value: 2, id: '2♥_1', isWild: false },
        { suit: '♠', rank: '8', value: 8, id: '8♠_1', isWild: false },
        { suit: '♦', rank: 'K', value: 13, id: 'K♦_1', isWild: false },
        { suit: '♣', rank: 'Q', value: 12, id: 'Q♣_1', isWild: false },
        { suit: '♥', rank: 'J', value: 11, id: 'J♥_1', isWild: false }
    ];
    
    const dealtCards = completeHand;
    
    // Add cards to player's hand data
    const playerName = game.playerManager.players[playerIndex]?.name;
    if (playerName) {
        game.playerHands.set(playerName, {
            cards: dealtCards,
            back: [],
            middle: [],
            front: []
        });
    }
    
    console.log('Dealt test hand with 6-card straight flush potential:');
    console.log('Straight flush cards:', straightFlushCards.map(c => c.rank + c.suit).join(' '));
    console.log(`All dealt cards (${dealtCards.length}):`, dealtCards.map(c => c.rank + c.suit).join(' '));
    
    return dealtCards;
}

/**
 * Tests if auto-arrange correctly identifies and creates a 6-card straight flush
 * @param {Object} game - Instance of ChinesePokerGame
 * @param {number} playerIndex - Which player to test (0-based)
 * @returns {Object} Test results
 */
function testAutoArrangeSixCardStraightFlush(game, playerIndex = 0) {
    const playerName = game.playerManager.players[playerIndex]?.name;
    const playerData = game.playerHands.get(playerName);
    
    console.log('Testing auto-arrange for 6-card straight flush...');
    console.log('Player cards before arrangement:', playerData.cards.map(c => c.rank + c.suit).join(' '));
    
    // Set the current player to the test player
    game.playerManager.currentPlayerIndex = playerIndex;
    
    // Run smart auto-arrange using the game's auto-arrange manager
    game.autoArrangeManager.smartAutoArrangeHand();
    
    // Get the arranged hands
    const updatedPlayerData = game.playerHands.get(playerName);
    
    console.log('Auto-arrange results:');
    console.log('Back hand:', updatedPlayerData.back.map(c => c.rank + c.suit).join(' '));
    console.log('Middle hand:', updatedPlayerData.middle.map(c => c.rank + c.suit).join(' '));
    console.log('Front hand:', updatedPlayerData.front.map(c => c.rank + c.suit).join(' '));
    console.log('Staging:', updatedPlayerData.cards.map(c => c.rank + c.suit).join(' '));
    
    // Check if back hand contains the 6-card straight flush
    const backHand = updatedPlayerData.back;
    const hasSixCardStraightFlush = checkForSixCardStraightFlush(backHand);
    
    const results = {
        arrangement: updatedPlayerData,
        hasSixCardStraightFlush: hasSixCardStraightFlush,
        backHandSize: backHand.length,
        backHandCards: backHand.map(c => c.rank + c.suit).join(' ')
    };
    
    console.log('Test Results:');
    console.log('- Has 6-card straight flush in back hand:', hasSixCardStraightFlush);
    console.log('- Back hand size:', results.backHandSize);
    
    return results;
}

/**
 * Checks if a hand contains a 6-card straight flush
 * @param {Array} cards - Array of card objects
 * @returns {boolean} True if hand contains 6-card straight flush
 */
function checkForSixCardStraightFlush(cards) {
    if (cards.length < 6) return false;
    
    // Group cards by suit
    const suitGroups = {};
    cards.forEach(card => {
        if (!suitGroups[card.suit]) {
            suitGroups[card.suit] = [];
        }
        suitGroups[card.suit].push(card);
    });
    
    // Check each suit for 6+ cards that form a straight
    for (const suit in suitGroups) {
        const suitCards = suitGroups[suit];
        if (suitCards.length >= 6) {
            // Sort by value
            suitCards.sort((a, b) => b.value - a.value);
            
            // Check for 6-card straight
            for (let i = 0; i <= suitCards.length - 6; i++) {
                let isConsecutive = true;
                for (let j = 1; j < 6; j++) {
                    if (suitCards[i + j].value !== suitCards[i + j - 1].value - 1) {
                        isConsecutive = false;
                        break;
                    }
                }
                if (isConsecutive) {
                    console.log('Found 6-card straight flush:', 
                        suitCards.slice(i, i + 6).map(c => c.rank + c.suit).join(' '));
                    return true;
                }
            }
        }
    }
    
    return false;
}

/**
 * Complete test scenario: Deal hand and test auto-arrange
 * @param {Object} deckManager - Instance of DeckManager
 * @param {Object} game - Instance of ChinesePokerGame
 * @param {number} playerIndex - Which player to test (0-based)
 */
function runSixCardStraightFlushTest(deckManager, game, playerIndex = 0) {
    console.log('=== Starting 6-Card Straight Flush Test ===');
    
    // Deal the test hand
    dealSixCardStraightFlushTestHand(deckManager, game, playerIndex);
    
    // Test auto-arrange
    const results = testAutoArrangeSixCardStraightFlush(game, playerIndex);
    
    console.log('=== Test Complete ===');
    return results;
}