// js/utils/card-sorter.js
// Card sorting utilities extracted from game.js

/**
 * Sort all cards (staging + hands) by rank, reset all hands to staging
 * @param {PyramidPoker} game - The game instance
 */
function resetAndSortByRank(game) {
    const currentPlayer = game.playerManager.getCurrentPlayer();
    const playerData = game.playerHands.get(currentPlayer.name);

    if (!playerData) return;

    const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];

    allCards.sort((a, b) => {
        if (a.value !== b.value) return b.value - a.value;
        const suitOrder = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
        return suitOrder[b.suit] - suitOrder[a.suit];
    });

    playerData.cards = allCards;
    playerData.back = [];
    playerData.middle = [];
    playerData.front = [];

    game.loadCurrentPlayerHand();
}

/**
 * Sort all cards (staging + hands) by suit, reset all hands to staging
 * @param {PyramidPoker} game - The game instance
 */
function resetAndSortBySuit(game) {
    const currentPlayer = game.playerManager.getCurrentPlayer();
    const playerData = game.playerHands.get(currentPlayer.name);

    if (!playerData) return;

    const allCards = [...playerData.cards, ...playerData.back, ...playerData.middle, ...playerData.front];

    allCards.sort((a, b) => {
        const suitOrder = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
        if (a.suit !== b.suit) return suitOrder[b.suit] - suitOrder[a.suit];
        return b.value - a.value;
    });

    playerData.cards = allCards;
    playerData.back = [];
    playerData.middle = [];
    playerData.front = [];

    game.loadCurrentPlayerHand();
}

/**
 * Sort only the visible cards in staging (first 13 for kitty variant) by rank
 * Does not move cards from hands, does not affect kitty cards
 * @param {PyramidPoker} game - The game instance
 */
function reorderStagingByRank(game) {
    const currentPlayer = game.playerManager.getCurrentPlayer();
    const playerData = game.playerHands.get(currentPlayer.name);

    if (!playerData || playerData.cards.length === 0) return;

    // Split into visible (first 13) and kitty (last 4)
    const visibleCards = playerData.cards.slice(0, 13);
    const kittyCards = playerData.cards.slice(13);

    // Sort ONLY the visible 13 cards
    visibleCards.sort((a, b) => {
        if (a.value !== b.value) return b.value - a.value;
        const suitOrder = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
        return suitOrder[b.suit] - suitOrder[a.suit];
    });

    // Recombine: sorted visible + unchanged kitty
    playerData.cards = [...visibleCards, ...kittyCards];

    game.loadCurrentPlayerHand();
    console.log('≡ƒöä Reordered first 13 cards by rank');
}

/**
 * Sort only the visible cards in staging (first 13 for kitty variant) by suit
 * Does not move cards from hands, does not affect kitty cards
 * @param {PyramidPoker} game - The game instance
 */
function reorderStagingBySuit(game) {
    const currentPlayer = game.playerManager.getCurrentPlayer();
    const playerData = game.playerHands.get(currentPlayer.name);

    if (!playerData || playerData.cards.length === 0) return;

    // Split into visible (first 13) and kitty (last 4)
    const visibleCards = playerData.cards.slice(0, 13);
    const kittyCards = playerData.cards.slice(13);

    // Sort ONLY the visible 13 cards
    visibleCards.sort((a, b) => {
        const suitOrder = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
        if (a.suit !== b.suit) return suitOrder[b.suit] - suitOrder[a.suit];
        return b.value - a.value;
    });

    // Recombine: sorted visible + unchanged kitty
    playerData.cards = [...visibleCards, ...kittyCards];

    game.loadCurrentPlayerHand();
    console.log('Reordered first 13 cards by suit');
}

function resetSortToggle() {
    const sortReset = document.getElementById('sortReset');
    const sortByRank = document.getElementById('sortByRank');
    const sortBySuit = document.getElementById('sortBySuit');
    if (sortReset) sortReset.classList.replace('toggle-inactive', 'toggle-active');
    if (sortByRank) sortByRank.classList.replace('toggle-active', 'toggle-inactive');
    if (sortBySuit) sortBySuit.classList.replace('toggle-active', 'toggle-inactive');
}

function reorderStagingReset(game) {
    const currentPlayer = game.playerManager.getCurrentPlayer();
    const playerData = game.playerHands.get(currentPlayer.name);

    if (!playerData || !playerData.originalCards) return;

    // Restore first 13 from original, keep current kitty (13-17)
    const kittyCards = playerData.cards.slice(13);
    playerData.cards = [...playerData.originalCards.slice(0, 13), ...kittyCards];

    game.loadCurrentPlayerHand();
    console.log('🔄 Restored first 13 cards to original deal order');
}

function resetReorderToggle() {
    const reorderReset = document.getElementById('reorderReset');
    const reorderByRank = document.getElementById('reorderByRank');
    const reorderBySuit = document.getElementById('reorderBySuit');
    if (reorderReset) reorderReset.classList.replace('toggle-inactive', 'toggle-active');
    if (reorderByRank) reorderByRank.classList.replace('toggle-active', 'toggle-inactive');
    if (reorderBySuit) reorderBySuit.classList.replace('toggle-active', 'toggle-inactive');
}
