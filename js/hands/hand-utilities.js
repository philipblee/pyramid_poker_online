// js/utilities/hand-utilities.js
/**
 * Hand ranking, description, and utility functions
 * function: handUtilities()
 * arguments(handType, position) returns points,
 */

function handUtilities() {
    
    const rankToName = (rankValue) => {
        const rankNames = {
            2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
            11: 'J', 12: 'Q', 13: 'K', 14: 'A'
        };
        return rankNames[rankValue] || String(rankValue);
    };

    const getHandDescription = (handType, handRankTuple) => {
        if (!handRankTuple || handRankTuple.length < 2) {
            return "Unknown";
        }

        // Extract relevant ranks based on hand type
        const rank1 = handRankTuple.length > 1 ? rankToName(handRankTuple[1]) : "";
        const rank2 = handRankTuple.length > 2 ? rankToName(handRankTuple[2]) : "";

        switch (handType) {
            case 'Four of a Kind':
                return `4 ${rank1}s`;
            case 'Three of a Kind':
                return `3 ${rank1}s`;
            case 'Pair':
                return `Pair ${rank1}s`;
            case 'Full House':
                return `${rank1}s over ${rank2}s`;
            case 'Flush':
                return `${rank1}-high flush`;
            case 'Straight':
                // Distinguish royal vs wheel vs regular
                if (rank1 === 'A' && rank2 === 'K') {
                    return "Royal straight";
                } else if (rank1 === '5' && rank2 === '4') {
                    return "Wheel straight";
                } else {
                    return `${rank1}-high straight`;
                }
            case '5 of a Kind':
            case '6 of a Kind':
            case '7 of a Kind':
            case '8 of a Kind':
                return `${handType} ${rank1}s`;
            default:
                if (handType.includes('Straight Flush')) {
                    if (rank1 === 'A' && rank2 === 'K') {
                        return `Royal ${handType}`;
                    } else if (rank1 === '5' && rank2 === '4') {
                        return `Wheel ${handType}`;
                    } else {
                        return `${rank1}-high ${handType}`;
                    }
                }
                return `${rank1}-high ${handType}`;
        }
    };

    const getPointValue = (handTypeCode, position) => {
        const pointTables = {
            'front': {
                1: 1,   // High Card/Pair/Two Pair
                3: 3,   // Three of a Kind
                5: 4,   // Straight
                6: 4,   // Flush
                7: 5,   // Full House
                8: 12,  // Four of a Kind
                9: 15,  // Straight Flush
                10: 18  // Five of a Kind
                // No front hands above 10
            },
            'middle': {
                1: 1,   // High Card/Pair/Two Pair
                3: 1,   // Three of a Kind
                5: 1,   // Straight
                6: 1,   // Flush
                7: 2,   // Full House
                8: 8,   // Four of a Kind
                9: 10,  // Straight Flush
                10: 12, // Five of a Kind
                11: 16, // 6-card Straight Flush
                12: 20, // 6 of a Kind
                13: 22, // 7-card Straight Flush
                14: 28  // 7 of a Kind
            },
            'back': {
                1: 1,   // High Card/Pair/Two Pair
                3: 1,   // Three of a Kind
                5: 1,   // Straight
                6: 1,   // Flush
                7: 1,   // Full House
                8: 4,   // Four of a Kind
                9: 5,   // Straight Flush
                10: 6,  // Five of a Kind
                11: 8,  // 6-card Straight Flush
                12: 11, // 6 of a Kind
                13: 11, // 7-card Straight Flush
                14: 14, // 7 of a Kind
                15: 14, // 8-card Straight Flush
                16: 18  // 8 of a Kind
            }
        };
        
        return pointTables[position]?.[handTypeCode] || 1;
    };

    // Return public interface
    return {
        rankToName,
        getHandDescription,
        getPointValue
    };
}

