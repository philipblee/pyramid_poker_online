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

/**
 * Creates a test hand with 6 of a kind potential
 * @param {Object} deckManager - Instance of DeckManager
 * @param {Object} game - Instance of ChinesePokerGame
 * @param {number} playerIndex - Which player to deal the test hand to (0-based)
 * @returns {Array} The dealt cards
 */
function dealSixOfAKindTestHand(deckManager, game, playerIndex = 0) {
    deckManager.createNewDeck();
    
    // Define 6 Aces (from 2 decks)
    const sixAces = [
        { suit: '♠', rank: 'A', value: 14, id: 'A♠_1', isWild: false },
        { suit: '♥', rank: 'A', value: 14, id: 'A♥_1', isWild: false },
        { suit: '♦', rank: 'A', value: 14, id: 'A♦_1', isWild: false },
        { suit: '♣', rank: 'A', value: 14, id: 'A♣_1', isWild: false },
        { suit: '♠', rank: 'A', value: 14, id: 'A♠_2', isWild: false },
        { suit: '♥', rank: 'A', value: 14, id: 'A♥_2', isWild: false }
    ];
    
    // Fill remaining 11 cards with random values
    const remainingCards = [
        { suit: '♦', rank: 'K', value: 13, id: 'K♦_1', isWild: false },
        { suit: '♣', rank: 'Q', value: 12, id: 'Q♣_1', isWild: false },
        { suit: '♠', rank: 'J', value: 11, id: 'J♠_1', isWild: false },
        { suit: '♥', rank: '10', value: 10, id: '10♥_1', isWild: false },
        { suit: '♦', rank: '9', value: 9, id: '9♦_1', isWild: false },
        { suit: '♣', rank: '8', value: 8, id: '8♣_1', isWild: false },
        { suit: '♠', rank: '7', value: 7, id: '7♠_1', isWild: false },
        { suit: '♥', rank: '6', value: 6, id: '6♥_1', isWild: false },
        { suit: '♦', rank: '5', value: 5, id: '5♦_1', isWild: false },
        { suit: '♣', rank: '4', value: 4, id: '4♣_1', isWild: false },
        { suit: '♠', rank: '3', value: 3, id: '3♠_1', isWild: false }
    ];
    
    const completeHand = [...sixAces, ...remainingCards];
    const playerName = game.playerManager.players[playerIndex]?.name;
    
    if (playerName) {
        game.playerHands.set(playerName, {
            cards: completeHand,
            back: [],
            middle: [],
            front: []
        });
    }
    
    console.log('Dealt test hand with 6 Aces:');
    console.log('Six Aces:', sixAces.map(c => c.rank + c.suit).join(' '));
    console.log(`All dealt cards (${completeHand.length}):`, completeHand.map(c => c.rank + c.suit).join(' '));
    
    return completeHand;
}

/**
 * Creates a test hand with 7 of a kind potential
 * @param {Object} deckManager - Instance of DeckManager
 * @param {Object} game - Instance of ChinesePokerGame
 * @param {number} playerIndex - Which player to deal the test hand to (0-based)
 * @returns {Array} The dealt cards
 */
function dealSevenOfAKindTestHand(deckManager, game, playerIndex = 0) {
    deckManager.createNewDeck();
    
    // Define 7 Kings (with hypothetical third deck card)
    const sevenKings = [
        { suit: '♠', rank: 'K', value: 13, id: 'K♠_1', isWild: false },
        { suit: '♥', rank: 'K', value: 13, id: 'K♥_1', isWild: false },
        { suit: '♦', rank: 'K', value: 13, id: 'K♦_1', isWild: false },
        { suit: '♣', rank: 'K', value: 13, id: 'K♣_1', isWild: false },
        { suit: '♠', rank: 'K', value: 13, id: 'K♠_2', isWild: false },
        { suit: '♥', rank: 'K', value: 13, id: 'K♥_2', isWild: false },
        { suit: '♦', rank: 'K', value: 13, id: 'K♦_2', isWild: false }
    ];
    
    // Fill remaining 10 cards
    const remainingCards = [
        { suit: '♣', rank: 'A', value: 14, id: 'A♣_1', isWild: false },
        { suit: '♠', rank: 'Q', value: 12, id: 'Q♠_1', isWild: false },
        { suit: '♥', rank: 'J', value: 11, id: 'J♥_1', isWild: false },
        { suit: '♦', rank: '10', value: 10, id: '10♦_1', isWild: false },
        { suit: '♣', rank: '9', value: 9, id: '9♣_1', isWild: false },
        { suit: '♠', rank: '8', value: 8, id: '8♠_1', isWild: false },
        { suit: '♥', rank: '7', value: 7, id: '7♥_1', isWild: false },
        { suit: '♦', rank: '6', value: 6, id: '6♦_1', isWild: false },
        { suit: '♣', rank: '5', value: 5, id: '5♣_1', isWild: false },
        { suit: '♠', rank: '4', value: 4, id: '4♠_1', isWild: false }
    ];
    
    const completeHand = [...sevenKings, ...remainingCards];
    const playerName = game.playerManager.players[playerIndex]?.name;
    
    if (playerName) {
        game.playerHands.set(playerName, {
            cards: completeHand,
            back: [],
            middle: [],
            front: []
        });
    }
    
    console.log('Dealt test hand with 7 Kings:');
    console.log('Seven Kings:', sevenKings.map(c => c.rank + c.suit).join(' '));
    console.log(`All dealt cards (${completeHand.length}):`, completeHand.map(c => c.rank + c.suit).join(' '));
    
    return completeHand;
}

/**
 * Creates a test hand with 8 of a kind potential
 * @param {Object} deckManager - Instance of DeckManager
 * @param {Object} game - Instance of ChinesePokerGame
 * @param {number} playerIndex - Which player to deal the test hand to (0-based)
 * @returns {Array} The dealt cards
 */
function dealEightOfAKindTestHand(deckManager, game, playerIndex = 0) {
    deckManager.createNewDeck();
    
    // Define 8 Queens (from 2 decks)
    const eightQueens = [
        { suit: '♠', rank: 'Q', value: 12, id: 'Q♠_1', isWild: false },
        { suit: '♥', rank: 'Q', value: 12, id: 'Q♥_1', isWild: false },
        { suit: '♦', rank: 'Q', value: 12, id: 'Q♦_1', isWild: false },
        { suit: '♣', rank: 'Q', value: 12, id: 'Q♣_1', isWild: false },
        { suit: '♠', rank: 'Q', value: 12, id: 'Q♠_2', isWild: false },
        { suit: '♥', rank: 'Q', value: 12, id: 'Q♥_2', isWild: false },
        { suit: '♦', rank: 'Q', value: 12, id: 'Q♦_2', isWild: false },
        { suit: '♣', rank: 'Q', value: 12, id: 'Q♣_2', isWild: false }
    ];
    
    // Fill remaining 9 cards
    const remainingCards = [
        { suit: '♠', rank: 'A', value: 14, id: 'A♠_1', isWild: false },
        { suit: '♥', rank: 'K', value: 13, id: 'K♥_1', isWild: false },
        { suit: '♦', rank: 'J', value: 11, id: 'J♦_1', isWild: false },
        { suit: '♣', rank: '10', value: 10, id: '10♣_1', isWild: false },
        { suit: '♠', rank: '9', value: 9, id: '9♠_1', isWild: false },
        { suit: '♥', rank: '8', value: 8, id: '8♥_1', isWild: false },
        { suit: '♦', rank: '7', value: 7, id: '7♦_1', isWild: false },
        { suit: '♣', rank: '6', value: 6, id: '6♣_1', isWild: false },
        { suit: '♠', rank: '5', value: 5, id: '5♠_1', isWild: false }
    ];
    
    const completeHand = [...eightQueens, ...remainingCards];
    const playerName = game.playerManager.players[playerIndex]?.name;
    
    if (playerName) {
        game.playerHands.set(playerName, {
            cards: completeHand,
            back: [],
            middle: [],
            front: []
        });
    }
    
    console.log('Dealt test hand with 8 Queens:');
    console.log('Eight Queens:', eightQueens.map(c => c.rank + c.suit).join(' '));
    console.log(`All dealt cards (${completeHand.length}):`, completeHand.map(c => c.rank + c.suit).join(' '));
    
    return completeHand;
}

/**
 * Tests if auto-arrange correctly identifies and creates large of-a-kind hands
 * @param {Object} game - Instance of ChinesePokerGame
 * @param {number} playerIndex - Which player to test (0-based)
 * @param {number} expectedSize - Expected size of the of-a-kind hand
 * @returns {Object} Test results
 */
function testAutoArrangeLargeOfAKind(game, playerIndex = 0, expectedSize = 6) {
    const playerName = game.playerManager.players[playerIndex]?.name;
    const playerData = game.playerHands.get(playerName);
    
    console.log(`Testing auto-arrange for ${expectedSize} of a kind...`);
    console.log('Player cards before arrangement:', playerData.cards.map(c => c.rank + c.suit).join(' '));
    
    // Set the current player to the test player
    game.playerManager.currentPlayerIndex = playerIndex;
    
    // Run smart auto-arrange
    game.autoArrangeManager.smartAutoArrangeHand();
    
    // Get the arranged hands
    const updatedPlayerData = game.playerHands.get(playerName);
    
    console.log('Auto-arrange results:');
    console.log('Back hand:', updatedPlayerData.back.map(c => c.rank + c.suit).join(' '));
    console.log('Middle hand:', updatedPlayerData.middle.map(c => c.rank + c.suit).join(' '));
    console.log('Front hand:', updatedPlayerData.front.map(c => c.rank + c.suit).join(' '));
    console.log('Staging:', updatedPlayerData.cards.map(c => c.rank + c.suit).join(' '));
    
    // Check if back hand contains the expected of-a-kind
    const backHand = updatedPlayerData.back;
    const hasLargeOfAKind = checkForLargeOfAKind(backHand, expectedSize);
    
    const results = {
        arrangement: updatedPlayerData,
        hasLargeOfAKind: hasLargeOfAKind,
        backHandSize: backHand.length,
        backHandCards: backHand.map(c => c.rank + c.suit).join(' '),
        expectedSize: expectedSize
    };
    
    console.log('Test Results:');
    console.log(`- Has ${expectedSize} of a kind in back hand:`, hasLargeOfAKind);
    console.log('- Back hand size:', results.backHandSize);
    
    return results;
}

/**
 * Checks if a hand contains a large of-a-kind (6+ cards of same rank)
 * @param {Array} cards - Array of card objects
 * @param {number} minSize - Minimum size to check for
 * @returns {boolean} True if hand contains large of-a-kind
 */
function checkForLargeOfAKind(cards, minSize = 6) {
    if (cards.length < minSize) return false;
    
    // Group cards by rank
    const rankGroups = {};
    cards.forEach(card => {
        if (!rankGroups[card.rank]) {
            rankGroups[card.rank] = [];
        }
        rankGroups[card.rank].push(card);
    });
    
    // Check for large groups
    for (const rank in rankGroups) {
        const rankCards = rankGroups[rank];
        if (rankCards.length >= minSize) {
            console.log(`Found ${rankCards.length} of a kind (${rank}):`, 
                rankCards.map(c => c.rank + c.suit).join(' '));
            return true;
        }
    }
    
    return false;
}

/**
 * Test scenarios for 6-8 of a kind detection
 */
function runSixOfAKindTest(deckManager, game, playerIndex = 0) {
    console.log('=== Starting 6 of a Kind Test ===');
    dealSixOfAKindTestHand(deckManager, game, playerIndex);
    const results = testAutoArrangeLargeOfAKind(game, playerIndex, 6);
    console.log('=== Test Complete ===');
    return results;
}

function runSevenOfAKindTest(deckManager, game, playerIndex = 0) {
    console.log('=== Starting 7 of a Kind Test ===');
    dealSevenOfAKindTestHand(deckManager, game, playerIndex);
    const results = testAutoArrangeLargeOfAKind(game, playerIndex, 7);
    console.log('=== Test Complete ===');
    return results;
}

function runEightOfAKindTest(deckManager, game, playerIndex = 0) {
    console.log('=== Starting 8 of a Kind Test ===');
    dealEightOfAKindTestHand(deckManager, game, playerIndex);
    const results = testAutoArrangeLargeOfAKind(game, playerIndex, 8);
    console.log('=== Test Complete ===');
    return results;
}

/**
 * Creates a test hand with 5 Aces + 1 Wild (should become 6 of a kind)
 */
function dealFiveAcesOneWildTest(deckManager, game, playerIndex = 0) {
    deckManager.createNewDeck();
    
    // Define 5 Aces + 1 wild
    const fiveAcesOneWild = [
        { suit: '♠', rank: 'A', value: 14, id: 'A♠_1', isWild: false },
        { suit: '♥', rank: 'A', value: 14, id: 'A♥_1', isWild: false },
        { suit: '♦', rank: 'A', value: 14, id: 'A♦_1', isWild: false },
        { suit: '♣', rank: 'A', value: 14, id: 'A♣_1', isWild: false },
        { suit: '♠', rank: 'A', value: 14, id: 'A♠_2', isWild: false },
        { suit: '🃏', rank: 'WILD', value: 15, id: 'WILD_1', isWild: true }
    ];
    
    // Fill remaining 11 cards
    const remainingCards = [
        { suit: '♦', rank: 'K', value: 13, id: 'K♦_1', isWild: false },
        { suit: '♣', rank: 'Q', value: 12, id: 'Q♣_1', isWild: false },
        { suit: '♠', rank: 'J', value: 11, id: 'J♠_1', isWild: false },
        { suit: '♥', rank: '10', value: 10, id: '10♥_1', isWild: false },
        { suit: '♦', rank: '9', value: 9, id: '9♦_1', isWild: false },
        { suit: '♣', rank: '8', value: 8, id: '8♣_1', isWild: false },
        { suit: '♠', rank: '7', value: 7, id: '7♠_1', isWild: false },
        { suit: '♥', rank: '6', value: 6, id: '6♥_1', isWild: false },
        { suit: '♦', rank: '5', value: 5, id: '5♦_1', isWild: false },
        { suit: '♣', rank: '4', value: 4, id: '4♣_1', isWild: false },
        { suit: '♠', rank: '3', value: 3, id: '3♠_1', isWild: false }
    ];
    
    const completeHand = [...fiveAcesOneWild, ...remainingCards];
    const playerName = game.playerManager.players[playerIndex]?.name;
    
    if (playerName) {
        game.playerHands.set(playerName, {
            cards: completeHand,
            back: [],
            middle: [],
            front: []
        });
    }
    
    console.log('Dealt test hand with 5 Aces + 1 Wild:');
    console.log('Target cards:', fiveAcesOneWild.map(c => c.rank + c.suit).join(' '));
    console.log(`All dealt cards (${completeHand.length}):`, completeHand.map(c => c.rank + c.suit).join(' '));
    
    return completeHand;
}

/**
 * Creates a test hand with A♠ K♠ Q♠ J♠ 9♠ + Wild (should become 6-card straight flush)
 */
function dealAlmostStraightFlushOneWildTest(deckManager, game, playerIndex = 0) {
    deckManager.createNewDeck();
    
    // Define 5 spades in sequence with gap + wild
    const almostStraightFlush = [
        { suit: '♠', rank: 'A', value: 14, id: 'A♠_1', isWild: false },
        { suit: '♠', rank: 'K', value: 13, id: 'K♠_1', isWild: false },
        { suit: '♠', rank: 'Q', value: 12, id: 'Q♠_1', isWild: false },
        { suit: '♠', rank: 'J', value: 11, id: 'J♠_1', isWild: false },
        { suit: '♠', rank: '9', value: 9, id: '9♠_1', isWild: false },
        { suit: '🃏', rank: 'WILD', value: 15, id: 'WILD_1', isWild: true }
    ];
    
    // Fill remaining 11 cards
    const remainingCards = [
        { suit: '♥', rank: '8', value: 8, id: '8♥_1', isWild: false },
        { suit: '♦', rank: '7', value: 7, id: '7♦_1', isWild: false },
        { suit: '♣', rank: '6', value: 6, id: '6♣_1', isWild: false },
        { suit: '♥', rank: '5', value: 5, id: '5♥_1', isWild: false },
        { suit: '♦', rank: '4', value: 4, id: '4♦_1', isWild: false },
        { suit: '♣', rank: '3', value: 3, id: '3♣_1', isWild: false },
        { suit: '♥', rank: '2', value: 2, id: '2♥_1', isWild: false },
        { suit: '♦', rank: 'K', value: 13, id: 'K♦_1', isWild: false },
        { suit: '♣', rank: 'Q', value: 12, id: 'Q♣_1', isWild: false },
        { suit: '♥', rank: 'J', value: 11, id: 'J♥_1', isWild: false },
        { suit: '♦', rank: '10', value: 10, id: '10♦_1', isWild: false }
    ];
    
    const completeHand = [...almostStraightFlush, ...remainingCards];
    const playerName = game.playerManager.players[playerIndex]?.name;
    
    if (playerName) {
        game.playerHands.set(playerName, {
            cards: completeHand,
            back: [],
            middle: [],
            front: []
        });
    }
    
    console.log('Dealt test hand with almost straight flush + Wild:');
    console.log('Target cards:', almostStraightFlush.map(c => c.rank + c.suit).join(' '));
    console.log(`All dealt cards (${completeHand.length}):`, completeHand.map(c => c.rank + c.suit).join(' '));
    
    return completeHand;
}

/**
 * Test wild card optimization scenarios
 */
function runWildCardSixOfAKindTest(deckManager, game, playerIndex = 0) {
    console.log('=== Starting Wild Card 6 of a Kind Test ===');
    dealFiveAcesOneWildTest(deckManager, game, playerIndex);
    const results = testAutoArrangeLargeOfAKind(game, playerIndex, 6);
    console.log('=== Test Complete ===');
    return results;
}

function runWildCardStraightFlushTest(deckManager, game, playerIndex = 0) {
    console.log('=== Starting Wild Card Straight Flush Test ===');
    dealAlmostStraightFlushOneWildTest(deckManager, game, playerIndex);
    const results = testAutoArrangeSixCardStraightFlush(game, playerIndex);
    console.log('=== Test Complete ===');
    return results;
}

/**
 * Creates a test hand with 3 Kings + 1 Wild (should become 4 of a kind)
 */
function dealTripsOneWildTest(deckManager, game, playerIndex = 0) {
    deckManager.createNewDeck();
    
    // Define 3 Kings + 1 wild + some random cards
    const tripsOneWild = [
        { suit: '♠', rank: 'K', value: 13, id: 'K♠_1', isWild: false },
        { suit: '♥', rank: 'K', value: 13, id: 'K♥_1', isWild: false },
        { suit: '♦', rank: 'K', value: 13, id: 'K♦_1', isWild: false },
        { suit: '🃏', rank: 'WILD', value: 15, id: 'WILD_1', isWild: true }
    ];
    
    // Fill remaining 13 cards with various ranks (no other potential large hands)
    const remainingCards = [
        { suit: '♠', rank: 'A', value: 14, id: 'A♠_1', isWild: false },
        { suit: '♥', rank: 'Q', value: 12, id: 'Q♥_1', isWild: false },
        { suit: '♦', rank: 'Q', value: 12, id: 'Q♦_1', isWild: false },
        { suit: '♣', rank: 'J', value: 11, id: 'J♣_1', isWild: false },
        { suit: '♠', rank: '10', value: 10, id: '10♠_1', isWild: false },
        { suit: '♥', rank: '9', value: 9, id: '9♥_1', isWild: false },
        { suit: '♦', rank: '8', value: 8, id: '8♦_1', isWild: false },
        { suit: '♣', rank: '7', value: 7, id: '7♣_1', isWild: false },
        { suit: '♠', rank: '6', value: 6, id: '6♠_1', isWild: false },
        { suit: '♥', rank: '5', value: 5, id: '5♥_1', isWild: false },
        { suit: '♦', rank: '4', value: 4, id: '4♦_1', isWild: false },
        { suit: '♣', rank: '3', value: 3, id: '3♣_1', isWild: false },
        { suit: '♠', rank: '2', value: 2, id: '2♠_1', isWild: false }
    ];
    
    const completeHand = [...tripsOneWild, ...remainingCards];
    const playerName = game.playerManager.players[playerIndex]?.name;
    
    if (playerName) {
        game.playerHands.set(playerName, {
            cards: completeHand,
            back: [],
            middle: [],
            front: []
        });
    }
    
    console.log('Dealt test hand with 3 Kings + 1 Wild:');
    console.log('Target cards:', tripsOneWild.map(c => c.rank + c.suit).join(' '));
    console.log(`All dealt cards (${completeHand.length}):`, completeHand.map(c => c.rank + c.suit).join(' '));
    
    return completeHand;
}

/**
 * Tests if auto-arrange correctly creates 4 of a kind from trips + wild
 */
function testAutoArrangeFourOfAKind(game, playerIndex = 0) {
    const playerName = game.playerManager.players[playerIndex]?.name;
    const playerData = game.playerHands.get(playerName);
    
    console.log('Testing auto-arrange for 4 of a kind from trips + wild...');
    console.log('Player cards before arrangement:', playerData.cards.map(c => c.rank + c.suit).join(' '));
    
    // Set the current player to the test player
    game.playerManager.currentPlayerIndex = playerIndex;
    
    // Run smart auto-arrange
    game.autoArrangeManager.smartAutoArrangeHand();
    
    // Get the arranged hands
    const updatedPlayerData = game.playerHands.get(playerName);
    
    console.log('Auto-arrange results:');
    console.log('Back hand:', updatedPlayerData.back.map(c => c.rank + c.suit).join(' '));
    console.log('Middle hand:', updatedPlayerData.middle.map(c => c.rank + c.suit).join(' '));
    console.log('Front hand:', updatedPlayerData.front.map(c => c.rank + c.suit).join(' '));
    console.log('Staging:', updatedPlayerData.cards.map(c => c.rank + c.suit).join(' '));
    
    // Check if any hand contains 4 of a kind
    const hasFourOfAKind = checkForFourOfAKind(updatedPlayerData.back) || 
                          checkForFourOfAKind(updatedPlayerData.middle) || 
                          checkForFourOfAKind(updatedPlayerData.front);
    
    const results = {
        arrangement: updatedPlayerData,
        hasFourOfAKind: hasFourOfAKind,
        backHandCards: updatedPlayerData.back.map(c => c.rank + c.suit).join(' '),
        middleHandCards: updatedPlayerData.middle.map(c => c.rank + c.suit).join(' '),
        frontHandCards: updatedPlayerData.front.map(c => c.rank + c.suit).join(' ')
    };
    
    console.log('Test Results:');
    console.log('- Has 4 of a kind in any hand:', hasFourOfAKind);
    
    return results;
}

/**
 * Checks if a hand contains 4 of a kind
 */
function checkForFourOfAKind(cards) {
    if (cards.length < 4) return false;
    
    // Group cards by rank
    const rankGroups = {};
    cards.forEach(card => {
        const rank = card.rank === 'WILD' ? 'K' : card.rank; // Assume wild becomes King for this test
        if (!rankGroups[rank]) {
            rankGroups[rank] = [];
        }
        rankGroups[rank].push(card);
    });
    
    // Check for 4+ of same rank
    for (const rank in rankGroups) {
        const rankCards = rankGroups[rank];
        if (rankCards.length >= 4) {
            console.log(`Found 4 of a kind (${rank}):`, 
                rankCards.map(c => c.rank + c.suit).join(' '));
            return true;
        }
    }
    
    return false;
}

/**
 * Test wild card making 4 of a kind from trips
 */
function runWildCardFourOfAKindTest(deckManager, game, playerIndex = 0) {
    console.log('=== Starting Wild Card 4 of a Kind Test ===');
    dealTripsOneWildTest(deckManager, game, playerIndex);
    const results = testAutoArrangeFourOfAKind(game, playerIndex);
    console.log('=== Test Complete ===');
    return results;
}