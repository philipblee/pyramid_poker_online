// js/hands/deal-automatic.js
// Debug/test utility for dealing preset automatic hands

function dealTwoWilds() {
    document.getElementById('playerHand').innerHTML = '';
    document.getElementById('backHand').innerHTML = '';
    document.getElementById('middleHand').innerHTML = '';
    document.getElementById('frontHand').innerHTML = '';

    const hand = [
        {id: 'A♠_1',   rank: 'A',  suit: '♠', value: 14, isWild: false},
        {id: 'A♥_2',   rank: 'A',  suit: '♥', value: 14, isWild: false},
        {id: 'K♠_3',   rank: 'K',  suit: '♠', value: 13, isWild: false},
        {id: 'K♥_4',   rank: 'K',  suit: '♥', value: 13, isWild: false},
        {id: 'Q♠_5',   rank: 'Q',  suit: '♠', value: 12, isWild: false},
        {id: 'Q♥_6',   rank: 'Q',  suit: '♥', value: 12, isWild: false},
        {id: 'J♠_7',   rank: 'J',  suit: '♠', value: 11, isWild: false},
        {id: 'J♥_8',   rank: 'J',  suit: '♥', value: 11, isWild: false},
        {id: '10♠_9',  rank: '10', suit: '♠', value: 10, isWild: false},
        {id: '9♠_10',  rank: '9',  suit: '♠', value: 9,  isWild: false},
        {id: '8♥_11',  rank: '8',  suit: '♥', value: 8,  isWild: false},
        {id: '7♦_12',  rank: '7',  suit: '♦', value: 7,  isWild: false},
        {id: '5♣_13',  rank: '5',  suit: '♣', value: 5,  isWild: false},
        {id: '3♦_14',  rank: '3',  suit: '♦', value: 3,  isWild: false},
        {id: '2♣_15',  rank: '2',  suit: '♣', value: 2,  isWild: false},
        {id: 'WILD_16', rank: '', suit: '', value: 0, isWild: true},
        {id: 'WILD_17', rank: '', suit: '', value: 0, isWild: true}
    ];

    const stagingArea = document.getElementById('playerHand');
    hand.forEach(card => {
        const cardEl = createCardElement(card);
        stagingArea.appendChild(cardEl);
    });

    if (window.game) {
        const currentPlayer = window.game.playerManager.getCurrentPlayer();
        const playerData = window.game.playerHands.get(currentPlayer.name);
        if (playerData) {
            playerData.cards = hand.map(card => ({...card}));
            playerData.originalCards = hand.map(card => ({...card}));
            playerData.back = [];
            playerData.middle = [];
            playerData.front = [];
        }
    }

    console.log('✅ Dealt two-wild test hand');
}

window.dealTwoWilds = dealTwoWilds;

function dealAutomatic(type) {
    // Clear everything first
    document.getElementById('playerHand').innerHTML = '';
    document.getElementById('backHand').innerHTML = '';
    document.getElementById('middleHand').innerHTML = '';
    document.getElementById('frontHand').innerHTML = '';

    const automaticHands = {
        // DRAGON: All 13 unique ranks (A-K-Q-J-10-9-8-7-6-5-4-3-2)
        'dragon': [
            {id: 'A♠_1',  rank: 'A',  suit: '♠', value: 14, isWild: false},
            {id: 'K♠_2',  rank: 'K',  suit: '♠', value: 13, isWild: false},
            {id: 'Q♠_3',  rank: 'Q',  suit: '♠', value: 12, isWild: false},
            {id: 'J♠_4',  rank: 'J',  suit: '♠', value: 11, isWild: false},
            {id: '10♠_5', rank: '10', suit: '♠', value: 10, isWild: false},
            {id: '9♥_6',  rank: '9',  suit: '♥', value: 9,  isWild: false},
            {id: '8♥_7',  rank: '8',  suit: '♥', value: 8,  isWild: false},
            {id: '7♥_8',  rank: '7',  suit: '♥', value: 7,  isWild: false},
            {id: '6♥_9',  rank: '6',  suit: '♥', value: 6,  isWild: false},
            {id: '5♥_10', rank: '5',  suit: '♥', value: 5,  isWild: false},
            {id: '4♦_11', rank: '4',  suit: '♦', value: 4,  isWild: false},
            {id: '3♦_12', rank: '3',  suit: '♦', value: 3,  isWild: false},
            {id: '2♦_13', rank: '2',  suit: '♦', value: 2,  isWild: false},
            {id: 'A♣_14', rank: 'A',  suit: '♣', value: 14, isWild: false},
            {id: 'K♣_15', rank: 'K',  suit: '♣', value: 13, isWild: false},
            {id: 'Q♣_16', rank: 'Q',  suit: '♣', value: 12, isWild: false},
            {id: 'J♣_17', rank: 'J',  suit: '♣', value: 11, isWild: false}
        ],

        // DRAGON with ONE wild (missing 7 - wild fills it)
        'dragon-one-wild': [
            {id: 'A♠_1',    rank: 'A',  suit: '♠', value: 14, isWild: false},
            {id: 'K♠_2',    rank: 'K',  suit: '♠', value: 13, isWild: false},
            {id: 'Q♠_3',    rank: 'Q',  suit: '♠', value: 12, isWild: false},
            {id: 'J♠_4',    rank: 'J',  suit: '♠', value: 11, isWild: false},
            {id: '10♥_5',   rank: '10', suit: '♥', value: 10, isWild: false},
            {id: '9♥_6',    rank: '9',  suit: '♥', value: 9,  isWild: false},
            {id: '8♥_7',    rank: '8',  suit: '♥', value: 8,  isWild: false},
            {id: '6♦_8',    rank: '6',  suit: '♦', value: 6,  isWild: false},
            {id: '5♦_9',    rank: '5',  suit: '♦', value: 5,  isWild: false},
            {id: '4♦_10',   rank: '4',  suit: '♦', value: 4,  isWild: false},
            {id: '3♣_11',   rank: '3',  suit: '♣', value: 3,  isWild: false},
            {id: '2♣_12',   rank: '2',  suit: '♣', value: 2,  isWild: false},
            {id: 'WILD_13',  rank: '',   suit: '',   value: 0,  isWild: true},
            {id: 'A♥_14',   rank: 'A',  suit: '♥', value: 14, isWild: false},
            {id: 'K♦_15',   rank: 'K',  suit: '♦', value: 13, isWild: false},
            {id: 'Q♣_16',   rank: 'Q',  suit: '♣', value: 12, isWild: false},
            {id: 'J♥_17',   rank: 'J',  suit: '♥', value: 11, isWild: false}
        ],

        // THREE-FLUSH: 5♠ + 5♥ + 5♦
        'three-flush': [
            {id: 'A♠_1',   rank: 'A',  suit: '♠', value: 14, isWild: false},
            {id: 'K♠_2',   rank: 'K',  suit: '♠', value: 13, isWild: false},
            {id: 'Q♠_3',   rank: 'Q',  suit: '♠', value: 12, isWild: false},
            {id: 'J♠_4',   rank: 'J',  suit: '♠', value: 11, isWild: false},
            {id: '10♠_5',  rank: '10', suit: '♠', value: 10, isWild: false},
            {id: 'A♥_6',   rank: 'A',  suit: '♥', value: 14, isWild: false},
            {id: 'K♥_7',   rank: 'K',  suit: '♥', value: 13, isWild: false},
            {id: 'Q♥_8',   rank: 'Q',  suit: '♥', value: 12, isWild: false},
            {id: 'J♥_9',   rank: 'J',  suit: '♥', value: 11, isWild: false},
            {id: '10♥_10', rank: '10', suit: '♥', value: 10, isWild: false},
            {id: 'A♦_11',  rank: 'A',  suit: '♦', value: 14, isWild: false},
            {id: 'K♦_12',  rank: 'K',  suit: '♦', value: 13, isWild: false},
            {id: 'Q♦_13',  rank: 'Q',  suit: '♦', value: 12, isWild: false},
            {id: 'J♦_14',  rank: 'J',  suit: '♦', value: 11, isWild: false},
            {id: '10♦_15', rank: '10', suit: '♦', value: 10, isWild: false},
            {id: '9♣_16',  rank: '9',  suit: '♣', value: 9,  isWild: false},
            {id: '8♣_17',  rank: '8',  suit: '♣', value: 8,  isWild: false}
        ],

        // THREE-FLUSH with ONE wild
        'three-flush-no-wild': [
            {id: 'K♥_1',   rank: 'K',  suit: '♥', value: 13, isWild: false},
            {id: 'A♠_2',   rank: 'A',  suit: '♠', value: 14, isWild: false},
            {id: '10♦_3',  rank: '10', suit: '♦', value: 10, isWild: false},
            {id: 'J♥_4',   rank: 'J',  suit: '♥', value: 11, isWild: false},
            {id: 'K♠_5',   rank: 'K',  suit: '♠', value: 13, isWild: false},
            {id: 'A♦_6',   rank: 'A',  suit: '♦', value: 14, isWild: false},
            {id: '9♥_7',   rank: '9',  suit: '♥', value: 9,  isWild: false},
            {id: 'Q♠_8',   rank: 'Q',  suit: '♠', value: 12, isWild: false},
            {id: '9♦_9',   rank: '9',  suit: '♦', value: 9,  isWild: false},
            {id: 'J♠_10',  rank: 'J',  suit: '♠', value: 11, isWild: false},
            {id: '8♥_11',  rank: '8',  suit: '♥', value: 8,  isWild: false},
            {id: '8♦_12',  rank: '8',  suit: '♦', value: 8,  isWild: false},
            {id: '10♠_13', rank: '10', suit: '♠', value: 10, isWild: false},
            {id: 'Q♥_14',  rank: 'Q',  suit: '♥', value: 12, isWild: false},
            {id: '7♦_15',  rank: '7',  suit: '♦', value: 7,  isWild: false},
            {id: '5♣_16',  rank: '5',  suit: '♣', value: 5,  isWild: false},
            {id: '4♣_17',  rank: '4',  suit: '♣', value: 4,  isWild: false}
        ],

        // THREE-FLUSH with ONE wild
        'three-flush-one-wild': [
            {id: 'Q♦_1',   rank: 'Q',  suit: '♦', value: 12, isWild: false},
            {id: 'K♠_2',   rank: 'K',  suit: '♠', value: 13, isWild: false},
            {id: 'J♦_3',   rank: 'J',  suit: '♦', value: 11, isWild: false},
            {id: 'Q♥_4',   rank: 'Q',  suit: '♥', value: 12, isWild: false},
            {id: '10♠_5',  rank: '10', suit: '♠', value: 10, isWild: false},
            {id: '10♦_6',  rank: '10', suit: '♦', value: 10, isWild: false},
            {id: 'J♥_7',   rank: 'J',  suit: '♥', value: 11, isWild: false},
            {id: '9♠_8',   rank: '9',  suit: '♠', value: 9,  isWild: false},
            {id: 'K♥_9',   rank: 'K',  suit: '♥', value: 13, isWild: false},
            {id: 'Q♠_10',  rank: 'Q',  suit: '♠', value: 12, isWild: false},
            {id: '9♦_11',  rank: '9',  suit: '♦', value: 9,  isWild: false},
            {id: '10♥_12', rank: '10', suit: '♥', value: 10, isWild: false},
            {id: 'J♠_13',  rank: 'J',  suit: '♠', value: 11, isWild: false},
            {id: '8♥_14',  rank: '8',  suit: '♥', value: 8,  isWild: false},
            {id: 'WILD_15', rank: '',  suit: '',   value: 0,  isWild: true},
            {id: '6♣_16',  rank: '6',  suit: '♣', value: 6,  isWild: false},
            {id: '5♣_17',  rank: '5',  suit: '♣', value: 5,  isWild: false}
        ],

        // THREE-STRAIGHT: Mixed suits, overlapping ranks
        'three-straight': [
            {id: 'A♠_1',  rank: 'A',  suit: '♠', value: 14, isWild: false},
            {id: '2♥_2',  rank: '2',  suit: '♥', value: 2,  isWild: false},
            {id: '3♦_3',  rank: '3',  suit: '♦', value: 3,  isWild: false},
            {id: '4♣_4',  rank: '4',  suit: '♣', value: 4,  isWild: false},
            {id: '5♠_5',  rank: '5',  suit: '♠', value: 5,  isWild: false},
            {id: '7♥_6',  rank: '7',  suit: '♥', value: 7,  isWild: false},
            {id: '6♦_7',  rank: '6',  suit: '♦', value: 6,  isWild: false},
            {id: '5♣_8',  rank: '5',  suit: '♣', value: 5,  isWild: false},
            {id: '4♠_9',  rank: '4',  suit: '♠', value: 4,  isWild: false},
            {id: '3♥_10', rank: '3',  suit: '♥', value: 3,  isWild: false},
            {id: '9♦_11', rank: '9',  suit: '♦', value: 9,  isWild: false},
            {id: '8♣_12', rank: '8',  suit: '♣', value: 8,  isWild: false},
            {id: '7♠_13', rank: '7',  suit: '♠', value: 7,  isWild: false},
            {id: '6♥_14', rank: '6',  suit: '♥', value: 6,  isWild: false},
            {id: '5♦_15', rank: '5',  suit: '♦', value: 5,  isWild: false},
            {id: 'K♣_16', rank: 'K',  suit: '♣', value: 13, isWild: false},
            {id: 'Q♣_17', rank: 'Q',  suit: '♣', value: 12, isWild: false}
        ],

        // THREE-STRAIGHT with ONE wild (mixed suits prevent flush, wild becomes A♠)
        'three-straight-one-wild': [
            {id: 'A♠_1',    rank: 'A',  suit: '♠', value: 14, isWild: false},
            {id: 'K♥_2',    rank: 'K',  suit: '♥', value: 13, isWild: false},
            {id: 'Q♦_3',    rank: 'Q',  suit: '♦', value: 12, isWild: false},
            {id: 'J♣_4',    rank: 'J',  suit: '♣', value: 11, isWild: false},
            {id: '10♠_5',   rank: '10', suit: '♠', value: 10, isWild: false},
            {id: 'K♦_6',    rank: 'K',  suit: '♦', value: 13, isWild: false},
            {id: 'Q♣_7',    rank: 'Q',  suit: '♣', value: 12, isWild: false},
            {id: 'J♠_8',    rank: 'J',  suit: '♠', value: 11, isWild: false},
            {id: '10♥_9',   rank: '10', suit: '♥', value: 10, isWild: false},
            {id: '9♦_10',   rank: '9',  suit: '♦', value: 9,  isWild: false},
            {id: 'Q♥_11',   rank: 'Q',  suit: '♥', value: 12, isWild: false},
            {id: 'J♦_12',   rank: 'J',  suit: '♦', value: 11, isWild: false},
            {id: '10♣_13',  rank: '10', suit: '♣', value: 10, isWild: false},
            {id: '8♠_14',   rank: '8',  suit: '♠', value: 8,  isWild: false},
            {id: 'WILD_15',  rank: '',   suit: '',   value: 0,  isWild: true},
            {id: '3♥_16',   rank: '3',  suit: '♥', value: 3,  isWild: false},
            {id: '4♣_17',   rank: '4',  suit: '♣', value: 4,  isWild: false}
        ],

        // THREE-FULL-HOUSES: AAA22 + KKK88 + QQQ77
        'three-full-houses': [
            {id: 'A♠_1',  rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: 'A♥_2',  rank: 'A', suit: '♥', value: 14, isWild: false},
            {id: 'A♦_3',  rank: 'A', suit: '♦', value: 14, isWild: false},
            {id: '2♠_4',  rank: '2', suit: '♠', value: 2,  isWild: false},
            {id: '2♥_5',  rank: '2', suit: '♥', value: 2,  isWild: false},
            {id: 'K♠_6',  rank: 'K', suit: '♠', value: 13, isWild: false},
            {id: 'K♥_7',  rank: 'K', suit: '♥', value: 13, isWild: false},
            {id: 'K♦_8',  rank: 'K', suit: '♦', value: 13, isWild: false},
            {id: '8♠_9',  rank: '8', suit: '♠', value: 8,  isWild: false},
            {id: '8♥_10', rank: '8', suit: '♥', value: 8,  isWild: false},
            {id: 'Q♠_11', rank: 'Q', suit: '♠', value: 12, isWild: false},
            {id: 'Q♥_12', rank: 'Q', suit: '♥', value: 12, isWild: false},
            {id: 'Q♦_13', rank: 'Q', suit: '♦', value: 12, isWild: false},
            {id: '7♠_14', rank: '7', suit: '♠', value: 7,  isWild: false},
            {id: '7♥_15', rank: '7', suit: '♥', value: 7,  isWild: false},
            {id: '3♣_16', rank: '3', suit: '♣', value: 3,  isWild: false},
            {id: '4♣_17', rank: '4', suit: '♣', value: 4,  isWild: false}
        ],

        // THREE-FULL-HOUSES with ONE wild (wild becomes 9 to complete trips)
        'three-full-houses-one-wild': [
            {id: 'A♠_1',   rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: 'A♥_2',   rank: 'A', suit: '♥', value: 14, isWild: false},
            {id: 'A♦_3',   rank: 'A', suit: '♦', value: 14, isWild: false},
            {id: 'K♠_4',   rank: 'K', suit: '♠', value: 13, isWild: false},
            {id: 'K♥_5',   rank: 'K', suit: '♥', value: 13, isWild: false},
            {id: 'Q♠_6',   rank: 'Q', suit: '♠', value: 12, isWild: false},
            {id: 'Q♥_7',   rank: 'Q', suit: '♥', value: 12, isWild: false},
            {id: 'Q♦_8',   rank: 'Q', suit: '♦', value: 12, isWild: false},
            {id: 'J♠_9',   rank: 'J', suit: '♠', value: 11, isWild: false},
            {id: 'J♥_10',  rank: 'J', suit: '♥', value: 11, isWild: false},
            {id: '9♠_11',  rank: '9', suit: '♠', value: 9,  isWild: false},
            {id: '9♥_12',  rank: '9', suit: '♥', value: 9,  isWild: false},
            {id: '8♠_13',  rank: '8', suit: '♠', value: 8,  isWild: false},
            {id: '8♥_14',  rank: '8', suit: '♥', value: 8,  isWild: false},
            {id: 'WILD_15', rank: '', suit: '',   value: 0,  isWild: true},
            {id: '3♣_16',  rank: '3', suit: '♣', value: 3,  isWild: false},
            {id: '4♣_17',  rank: '4', suit: '♣', value: 4,  isWild: false}
        ],


        'three-straight-one-wild': [
            {id: 'A♠_1',   rank: 'A',  suit: '♠', value: 14, isWild: false},
            {id: 'K♥_2',   rank: 'K',  suit: '♥', value: 13, isWild: false},
            {id: 'Q♦_3',   rank: 'Q',  suit: '♦', value: 12, isWild: false},
            {id: 'J♣_4',   rank: 'J',  suit: '♣', value: 11, isWild: false},
            {id: '10♠_5',  rank: '10', suit: '♠', value: 10, isWild: false},
            {id: 'K♦_6',   rank: 'K',  suit: '♦', value: 13, isWild: false},
            {id: 'Q♣_7',   rank: 'Q',  suit: '♣', value: 12, isWild: false},
            {id: 'J♠_8',   rank: 'J',  suit: '♠', value: 11, isWild: false},
            {id: '10♥_9',  rank: '10', suit: '♥', value: 10, isWild: false},
            {id: '9♦_10',  rank: '9',  suit: '♦', value: 9,  isWild: false},
            {id: 'Q♥_11',  rank: 'Q',  suit: '♥', value: 12, isWild: false},
            {id: 'J♦_12',  rank: 'J',  suit: '♦', value: 11, isWild: false},
            {id: '10♣_13', rank: '10', suit: '♣', value: 10, isWild: false},
            {id: '8♠_14',  rank: '8',  suit: '♠', value: 8,  isWild: false},
            {id: 'WILD_15', rank: '',  suit: '',   value: 0,  isWild: true},
            {id: '3♥_16',  rank: '3',  suit: '♥', value: 3,  isWild: false},
            {id: '4♣_17',  rank: '4',  suit: '♣', value: 4,  isWild: false}
        ],

        // DRAGON with ONE wild
        // Natural ranks: A,K,Q,J,10,9,8,6,5,4,3,2 (missing 7 - wild fills it)
        // Extras: A♥, K♦, Q♣, J♥
        'dragon-one-wild': [
            {id: 'A♠_1',   rank: 'A',  suit: '♠', value: 14, isWild: false},
            {id: 'K♠_2',   rank: 'K',  suit: '♠', value: 13, isWild: false},
            {id: 'Q♠_3',   rank: 'Q',  suit: '♠', value: 12, isWild: false},
            {id: 'J♠_4',   rank: 'J',  suit: '♠', value: 11, isWild: false},
            {id: '10♥_5',  rank: '10', suit: '♥', value: 10, isWild: false},
            {id: '9♥_6',   rank: '9',  suit: '♥', value: 9,  isWild: false},
            {id: '8♥_7',   rank: '8',  suit: '♥', value: 8,  isWild: false},
            {id: '6♦_8',   rank: '6',  suit: '♦', value: 6,  isWild: false},
            {id: '5♦_9',   rank: '5',  suit: '♦', value: 5,  isWild: false},
            {id: '4♦_10',  rank: '4',  suit: '♦', value: 4,  isWild: false},
            {id: '3♣_11',  rank: '3',  suit: '♣', value: 3,  isWild: false},
            {id: '2♣_12',  rank: '2',  suit: '♣', value: 2,  isWild: false},
            {id: 'WILD_13', rank: '',  suit: '',   value: 0,  isWild: true},
            {id: 'A♥_14',  rank: 'A',  suit: '♥', value: 14, isWild: false},
            {id: 'K♦_15',  rank: 'K',  suit: '♦', value: 13, isWild: false},
            {id: 'Q♣_16',  rank: 'Q',  suit: '♣', value: 12, isWild: false},
            {id: 'J♥_17',  rank: 'J',  suit: '♥', value: 11, isWild: false}
        ],

        // FLUSH SF WILD TEST: Wild in front should resolve to 9♣ (SF), not A♣
        'flush-sf-wild': [
            {id: 'A♠_1',   rank: 'A',  suit: '♠', value: 14, isWild: false},
            {id: 'K♠_2',   rank: 'K',  suit: '♠', value: 13, isWild: false},
            {id: 'Q♠_3',   rank: 'Q',  suit: '♠', value: 12, isWild: false},
            {id: 'J♠_4',   rank: 'J',  suit: '♠', value: 11, isWild: false},
            {id: '10♠_5',  rank: '10', suit: '♠', value: 10, isWild: false},
            {id: 'K♥_6',   rank: 'K',  suit: '♥', value: 13, isWild: false},
            {id: 'Q♥_7',   rank: 'Q',  suit: '♥', value: 12, isWild: false},
            {id: 'J♥_8',   rank: 'J',  suit: '♥', value: 11, isWild: false},
            {id: '10♥_9',  rank: '10', suit: '♥', value: 10, isWild: false},
            {id: '9♥_10',  rank: '9',  suit: '♥', value: 9,  isWild: false},
            {id: 'Q♣_11',  rank: 'Q',  suit: '♣', value: 12, isWild: false},
            {id: 'J♣_12',  rank: 'J',  suit: '♣', value: 11, isWild: false},
            {id: '10♣_13', rank: '10', suit: '♣', value: 10, isWild: false},
            {id: '8♣_14',  rank: '8',  suit: '♣', value: 8,  isWild: false},
            {id: 'WILD_15', rank: '',  suit: '',   value: 0,  isWild: true},
            {id: '8♦_16',  rank: '8',  suit: '♦', value: 8,  isWild: false},
            {id: '7♦_17',  rank: '7',  suit: '♦', value: 7,  isWild: false}
        ],

        // THREE-FULL-HOUSES with ONE wild
        // FH1: AAA-KK, FH2: QQQ-JJ, FH3: 99-WILD-88 (wild becomes 9)
        // Extras: 3♣ 4♣
        'three-full-houses-one-wild': [
            {id: 'A♠_1',  rank: 'A', suit: '♠', value: 14, isWild: false},
            {id: 'A♥_2',  rank: 'A', suit: '♥', value: 14, isWild: false},
            {id: 'A♦_3',  rank: 'A', suit: '♦', value: 14, isWild: false},
            {id: 'K♠_4',  rank: 'K', suit: '♠', value: 13, isWild: false},
            {id: 'K♥_5',  rank: 'K', suit: '♥', value: 13, isWild: false},
            {id: 'Q♠_6',  rank: 'Q', suit: '♠', value: 12, isWild: false},
            {id: 'Q♥_7',  rank: 'Q', suit: '♥', value: 12, isWild: false},
            {id: 'Q♦_8',  rank: 'Q', suit: '♦', value: 12, isWild: false},
            {id: 'J♠_9',  rank: 'J', suit: '♠', value: 11, isWild: false},
            {id: 'J♥_10', rank: 'J', suit: '♥', value: 11, isWild: false},
            {id: '9♠_11', rank: '9', suit: '♠', value: 9,  isWild: false},
            {id: '9♥_12', rank: '9', suit: '♥', value: 9,  isWild: false},
            {id: '8♠_13', rank: '8', suit: '♠', value: 8,  isWild: false},
            {id: '8♥_14', rank: '8', suit: '♥', value: 8,  isWild: false},
            {id: 'WILD_15', rank: '', suit: '', value: 0,   isWild: true},
            {id: '3♣_16', rank: '3', suit: '♣', value: 3,  isWild: false},
            {id: '4♣_17', rank: '4', suit: '♣', value: 4,  isWild: false}
        ],

        // 6-card wheel SF: A♠-2♠-3♠-4♠-5♠-6♠ + tempting full house material
        // Tests that BEST picks 6-card SF over full house
        'six-card-wheel': [
            {id: 'A♠_1',  rank: 'A',  suit: '♠', value: 14, isWild: false},
            {id: '2♠_2',  rank: '2',  suit: '♠', value: 2,  isWild: false},
            {id: '3♠_3',  rank: '3',  suit: '♠', value: 3,  isWild: false},
            {id: '4♠_4',  rank: '4',  suit: '♠', value: 4,  isWild: false},
            {id: '5♠_5',  rank: '5',  suit: '♠', value: 5,  isWild: false},
            {id: '6♠_6',  rank: '6',  suit: '♠', value: 6,  isWild: false},
            {id: 'K♥_7',  rank: 'K',  suit: '♥', value: 13, isWild: false},
            {id: 'K♦_8',  rank: 'K',  suit: '♦', value: 13, isWild: false},
            {id: 'K♣_9',  rank: 'K',  suit: '♣', value: 13, isWild: false},
            {id: 'Q♥_10', rank: 'Q',  suit: '♥', value: 12, isWild: false},
            {id: 'Q♦_11', rank: 'Q',  suit: '♦', value: 12, isWild: false},
            {id: 'J♥_12', rank: 'J',  suit: '♥', value: 11, isWild: false},
            {id: 'J♦_13', rank: 'J',  suit: '♦', value: 11, isWild: false},
            {id: 'J♣_14', rank: 'J',  suit: '♣', value: 11, isWild: false},
            {id: '10♥_15',rank: '10', suit: '♥', value: 10, isWild: false},
            {id: '10♦_16',rank: '10', suit: '♦', value: 10, isWild: false},
            {id: '9♥_17', rank: '9',  suit: '♥', value: 9,  isWild: false}
        ],

    };

    const stagingArea = document.getElementById('playerHand');
    stagingArea.innerHTML = '';

    if (!automaticHands[type]) {
        console.error(`❌ Unknown automatic type: ${type}`);
        console.log('Available types:', Object.keys(automaticHands).join(', '));
        return;
    }

    automaticHands[type].forEach(card => {
        const cardEl = createCardElement(card);
        stagingArea.appendChild(cardEl);
    });

    // Sync playerData with dealt cards
    if (window.game) {
        const currentPlayer = window.game.playerManager.getCurrentPlayer();
        const playerData = window.game.playerHands.get(currentPlayer.name);
        if (playerData) {
            playerData.cards = automaticHands[type].map(card => ({...card}));
            playerData.back = [];
            playerData.middle = [];
            playerData.front = [];
            console.log(`✅ playerData synced with ${automaticHands[type].length} cards`);
        }
    }

    console.log(`✅ Dealt ${type} automatic`);
}

window.dealAutomatic = dealAutomatic;
window.dealSixCardWheel = () => dealAutomatic('six-card-wheel');
