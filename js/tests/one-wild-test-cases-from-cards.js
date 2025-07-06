// Test cases 2-5 in proper card object format for smart optimizer testing
// Copy/paste these into your console one at a time

// ==========================================
// TEST CASE 2: One Wild Random 2
// Cards: "2♣ A♠ 2♠ Q♥ 5♣ 7♦ Q♠ 8♥ 5♥ 4♥ 5♣ 6♥ 4♦ 9♣ Q♦ 🃏 J♣"
// ==========================================
console.log("🧪 TESTING CASE 2...");
const testCards2 = [
    {id: 1, rank: '2', suit: '♣', isWild: false},
    {id: 2, rank: 'A', suit: '♠', isWild: false},
    {id: 3, rank: '2', suit: '♠', isWild: false},
    {id: 4, rank: 'Q', suit: '♥', isWild: false},
    {id: 5, rank: '5', suit: '♣', isWild: false},
    {id: 6, rank: '7', suit: '♦', isWild: false},
    {id: 7, rank: 'Q', suit: '♠', isWild: false},
    {id: 8, rank: '8', suit: '♥', isWild: false},
    {id: 9, rank: '5', suit: '♥', isWild: false},
    {id: 10, rank: '4', suit: '♥', isWild: false},
    {id: 11, rank: '5', suit: '♣', isWild: false},
    {id: 12, rank: '6', suit: '♥', isWild: false},
    {id: 13, rank: '4', suit: '♦', isWild: false},
    {id: 14, rank: '9', suit: '♣', isWild: false},
    {id: 15, rank: 'Q', suit: '♦', isWild: false},
    {id: 16, rank: '🃏', suit: '', isWild: true},
    {id: 17, rank: 'J', suit: '♣', isWild: false}
];
const case2Result = oneWildBestFromCards(testCards2);

// ==========================================
// TEST CASE 3: One Wild Random 3
// Cards: "2♣ 10♦ 7♥ 3♥ 6♠ Q♠ 6♥ 3♠ 3♦ 7♥ 3♠ 🃏 3♣ 2♠ K♦ 2♦ 4♠"
// ==========================================
console.log("🧪 TESTING CASE 3...");
const testCards3 = [
    {id: 1, rank: '2', suit: '♣', isWild: false},
    {id: 2, rank: '10', suit: '♦', isWild: false},
    {id: 3, rank: '7', suit: '♥', isWild: false},
    {id: 4, rank: '3', suit: '♥', isWild: false},
    {id: 5, rank: '6', suit: '♠', isWild: false},
    {id: 6, rank: 'Q', suit: '♠', isWild: false},
    {id: 7, rank: '6', suit: '♥', isWild: false},
    {id: 8, rank: '3', suit: '♠', isWild: false},
    {id: 9, rank: '3', suit: '♦', isWild: false},
    {id: 10, rank: '7', suit: '♥', isWild: false},
    {id: 11, rank: '3', suit: '♠', isWild: false},
    {id: 12, rank: '🃏', suit: '', isWild: true},
    {id: 13, rank: '3', suit: '♣', isWild: false},
    {id: 14, rank: '2', suit: '♠', isWild: false},
    {id: 15, rank: 'K', suit: '♦', isWild: false},
    {id: 16, rank: '2', suit: '♦', isWild: false},
    {id: 17, rank: '4', suit: '♠', isWild: false}
];
const case3Result = oneWildBestFromCards(testCards3);

// ==========================================
// TEST CASE 4: One Wild Random 4
// Cards: "🃏 J♥ 6♠ J♠ 9♠ 10♦ 3♦ 9♣ K♣ 4♠ 6♦ 10♥ 9♣ 3♣ K♠ 5♥ 10♣"
// ==========================================
console.log("🧪 TESTING CASE 4...");
const testCards4 = [
    {id: 1, rank: '🃏', suit: '', isWild: true},
    {id: 2, rank: 'J', suit: '♥', isWild: false},
    {id: 3, rank: '6', suit: '♠', isWild: false},
    {id: 4, rank: 'J', suit: '♠', isWild: false},
    {id: 5, rank: '9', suit: '♠', isWild: false},
    {id: 6, rank: '10', suit: '♦', isWild: false},
    {id: 7, rank: '3', suit: '♦', isWild: false},
    {id: 8, rank: '9', suit: '♣', isWild: false},
    {id: 9, rank: 'K', suit: '♣', isWild: false},
    {id: 10, rank: '4', suit: '♠', isWild: false},
    {id: 11, rank: '6', suit: '♦', isWild: false},
    {id: 12, rank: '10', suit: '♥', isWild: false},
    {id: 13, rank: '9', suit: '♣', isWild: false},
    {id: 14, rank: '3', suit: '♣', isWild: false},
    {id: 15, rank: 'K', suit: '♠', isWild: false},
    {id: 16, rank: '5', suit: '♥', isWild: false},
    {id: 17, rank: '10', suit: '♣', isWild: false}
];
const case4Result = oneWildBestFromCards(testCards4);

// ==========================================
// TEST CASE 5: One Wild Random 5
// Cards: "🃏 9♥ 4♠ 10♠ 10♦ 6♠ J♣ 8♠ 7♣ 7♠ 6♣ 9♥ J♦ 5♥ 2♥ A♥ 3♦"
// ==========================================
console.log("🧪 TESTING CASE 5...");
const testCards5 = [
    {id: 1, rank: '🃏', suit: '', isWild: true},
    {id: 2, rank: '9', suit: '♥', isWild: false},
    {id: 3, rank: '4', suit: '♠', isWild: false},
    {id: 4, rank: '10', suit: '♠', isWild: false},
    {id: 5, rank: '10', suit: '♦', isWild: false},
    {id: 6, rank: '6', suit: '♠', isWild: false},
    {id: 7, rank: 'J', suit: '♣', isWild: false},
    {id: 8, rank: '8', suit: '♠', isWild: false},
    {id: 9, rank: '7', suit: '♣', isWild: false},
    {id: 10, rank: '7', suit: '♠', isWild: false},
    {id: 11, rank: '6', suit: '♣', isWild: false},
    {id: 12, rank: '9', suit: '♥', isWild: false},
    {id: 13, rank: 'J', suit: '♦', isWild: false},
    {id: 14, rank: '5', suit: '♥', isWild: false},
    {id: 15, rank: '2', suit: '♥', isWild: false},
    {id: 16, rank: 'A', suit: '♥', isWild: false},
    {id: 17, rank: '3', suit: '♦', isWild: false}
];
const case5Result = oneWildBestFromCards(testCards5);

// ==========================================
// QUICK TEST SUMMARY
// ==========================================
console.log("\n📋 SUMMARY OF ALL TESTS:");
console.log("Case 2 Success:", case2Result?.success);
console.log("Case 3 Success:", case3Result?.success);
console.log("Case 4 Success:", case4Result?.success);
console.log("Case 5 Success:", case5Result?.success);