// js/utilities/create-arrangement.js
// Factory function for Standard Arrangement Model compliance

/**
 * Create a standard arrangement object following the Standard Arrangement Model
 * @param {Object} back - Back hand object
 * @param {Object} middle - Middle hand object
 * @param {Object} front - Front hand object
 * @param {number} score - Total expected score
 * @param {Array} stagingCards - Array of unused cards
 * @param {boolean} isValid - Whether arrangement follows game rules
 * @returns {Object} Standard Arrangement Model object
 */
function createArrangement(back, middle, front, score, stagingCards, isValid = true,
                         scoreFront = null, scoreMiddle = null, scoreBack = null) {
    const method = window.gameConfig?.config?.winProbabilityMethod || 'tiered';

    return {
        back,
        middle,
        front,
        score,           // Total arrangement score (existing)
        isValid,
        stagingCards,
        method,
        statistics: null,
        // NEW: Individual position EV scores
        scoreFront,
        scoreMiddle,
        scoreBack
    };
}

function createFindBestSetupNoWild(flag) {

//      console.log('🏭 Factory creating optimizer for method:', flag);
      switch (flag) {
        case 'points':
            return new FindBestSetupNoWildPoints();
        case 'tiered':
            return new FindBestSetupNoWildTiered();
        case 'tiered2':
            return new FindBestSetupNoWildTiered2();
        case 'best-back':
            return new FindBestSetupNoWildBestBack();
        case 'best-middle':
            return new FindBestSetupNoWildBestMiddle();
        case 'best-front':
            return new FindBestSetupNoWildBestFront();
        case 'empirical':
        default:
            return new FindBestSetupNoWildEmpirical();  // ← Fix this line
      }
}
