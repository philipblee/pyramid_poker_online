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
function createArrangement(back, middle, front, score, stagingCards, isValid = true) {
    // Read method from game-config automatically
    const method = window.gameConfig?.config?.winProbabilityMethod || 'empirical';

    return {
        back,
        middle,
        front,
        score,
        isValid,
        stagingCards,
        method,
        statistics: null
    };
}

function createFindBestSetupNoWild(flag) {
  switch (flag) {
    case 'points':
        return new FindBestSetupNoWildPoints();
    case 'tiered':
        return new FindBestSetupNoWildTiered();
    case 'empirical':
    default:
        return new FindBestSetupNoWild();
  }
}