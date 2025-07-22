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
    return {
        back,
        middle,
        front,
        score,
        isValid,
        stagingCards,
        statistics: null
    };
}

function createFindBestSetupNoWild(flag, data, options) {
  switch (flag) {
    case 'points':
        return new OFindBestSetupNoWildPoints(data, options);
    case 'tiered':
        return new FindBestSetupNoWildTiered(data, options);
    case 'empirical':
    default:
        return new FindBestSetupNoWild(data, options);
  }
}