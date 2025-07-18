// js/utilities/win-probability-data.js
// Step 1: CSV Parser for empirical win probability data
// Parses data/hand_tuple_lookup.csv into usable lookup structure

class WinProbabilityData {
    constructor() {
        this.probabilityMap = new Map();
        this.isLoaded = false;
        this.loadError = null;
    }

    /**
     * Load and parse CSV data from file
     * @returns {Promise<boolean>} - True if loaded successfully
     */
    async loadData() {
        try {
            console.log('🔍 Loading win probability data from CSV...');

            // Fetch the CSV file
            const response = await fetch('data/hand_tuple_lookup.csv');
            if (!response.ok) {
                throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
            }

            const csvText = await response.text();
            this.parseCSV(csvText);

            console.log(`✅ Loaded ${this.probabilityMap.size} probability entries`);
            this.isLoaded = true;
            return true;

        } catch (error) {
            console.error('❌ Error loading win probability data:', error);
            this.loadError = error.message;
            return false;
        }
    }

    /**
     * Parse CSV text into probability map
     * @param {string} csvText - Raw CSV content
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');

        // Skip header row (assumes first line is headers)
        const dataLines = lines.slice(1);

        let parseCount = 0;
        let errorCount = 0;

        dataLines.forEach((line, index) => {
            try {
                // Parse CSV line (handle quoted fields)
                const fields = this.parseCSVLine(line);

                if (fields.length >= 5) {
                    const position = fields[0].trim();
                    const handRankStr = fields[1].trim();
                    const wins = parseInt(fields[2]);
                    const total = parseInt(fields[3]);
                    const probability = parseFloat(fields[4]);

                    // Convert hand rank string "(10, 10)" to array [10, 10]
                    const handRank = this.parseHandRank(handRankStr);

                    if (handRank && !isNaN(probability) && total > 0) {
                        // Create lookup key
                        const key = this.createLookupKey(position, handRank);

                        // Store in map
                        this.probabilityMap.set(key, {
                            position,
                            handRank,
                            wins,
                            total,
                            probability
                        });

                        parseCount++;
                    } else {
                        throw new Error(`Invalid data values`);
                    }
                } else {
                    throw new Error(`Expected 5 fields, got ${fields.length}`);
                }

            } catch (error) {
                console.warn(`⚠️  Line ${index + 2}: ${error.message} - "${line}"`);
                errorCount++;
            }
        });

        console.log(`📊 CSV parsing complete: ${parseCount} entries parsed, ${errorCount} errors`);

        if (parseCount === 0) {
            throw new Error('No valid data entries found in CSV');
        }
    }

    /**
     * Parse a single CSV line, handling quoted fields
     * @param {string} line - CSV line
     * @returns {Array<string>} - Array of field values
     */
    parseCSVLine(line) {
        const fields = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        fields.push(current); // Add last field
        return fields;
    }

    /**
     * Parse hand rank string "(10, 10)" to array [10, 10]
     * @param {string} handRankStr - Hand rank as string
     * @returns {Array<number>|null} - Hand rank array or null if invalid
     */

    parseHandRank(handRankStr) {
        try {
            // Step 1: Remove double quotes only
            let cleaned = handRankStr;
            if (cleaned.startsWith('"')) {
                cleaned = cleaned.slice(1);
            }
            if (cleaned.endsWith('"')) {
                cleaned = cleaned.slice(0, -1);
            }

            // Step 2: Extract content between parentheses
            if (!cleaned.startsWith('(') || !cleaned.endsWith(')')) {
                return null;
            }
            const innerContent = cleaned.slice(1, -1); // Remove ( and )

            // Step 3: Parse numbers
            const values = innerContent.split(',').map(v => {
                const num = parseInt(v.trim());
                return isNaN(num) ? null : num;
            });

            // Return null if any value is invalid
            return values.includes(null) ? null : values;

        } catch (error) {
            return null;
        }
    }

    /**
     * Create lookup key for position and hand rank
     * @param {string} position - Position (back/middle/front)
     * @param {Array<number>} handRank - Hand rank array
     * @returns {string} - Lookup key
     */
    createLookupKey(position, handRank) {
        return `${position.toLowerCase()}:${handRank.join(',')}`;
    }

    /**
     * Get win probability for position and hand rank
     * @param {string} position - Position (back/middle/front)
     * @param {Array<number>} handRank - Hand rank array
     * @returns {number|null} - Win probability or null if not found
     */
    getWinProbability(position, handRank) {
        if (!this.isLoaded) {
            console.warn('⚠️  Win probability data not loaded yet');
            return null;
        }

        const key = this.createLookupKey(position, handRank);
        const entry = this.probabilityMap.get(key);

        return entry ? entry.probability : null;
    }

    /**
     * Get detailed data for position and hand rank
     * @param {string} position - Position (back/middle/front)
     * @param {Array<number>} handRank - Hand rank array
     * @returns {Object|null} - Full entry or null if not found
     */
    getDetailedData(position, handRank) {
        if (!this.isLoaded) {
            console.warn('⚠️  Win probability data not loaded yet');
            return null;
        }

        const key = this.createLookupKey(position, handRank);
        return this.probabilityMap.get(key) || null;
    }

    /**
     * Get statistics about loaded data
     * @returns {Object} - Data statistics
     */
    getStatistics() {
        if (!this.isLoaded) {
            return { loaded: false, error: this.loadError };
        }

        const positions = new Set();
        const handRanks = new Set();
        let totalWins = 0;
        let totalGames = 0;

        this.probabilityMap.forEach(entry => {
            positions.add(entry.position);
            handRanks.add(entry.handRank.join(','));
            totalWins += entry.wins;
            totalGames += entry.total;
        });

        return {
            loaded: true,
            totalEntries: this.probabilityMap.size,
            positions: Array.from(positions),
            uniqueHandRanks: handRanks.size,
            totalWins,
            totalGames,
            overallWinRate: totalGames > 0 ? (totalWins / totalGames) : 0
        };
    }

    /**
     * Debug: Print sample data
     * @param {number} count - Number of entries to show
     */
    debugPrintSample(count = 10) {
        if (!this.isLoaded) {
            console.log('❌ Data not loaded');
            return;
        }

        console.log(`\n📋 Sample Win Probability Data (first ${count} entries):`);

        let shown = 0;
        for (const [key, entry] of this.probabilityMap) {
            if (shown >= count) break;

            console.log(`${entry.position}: [${entry.handRank.join(', ')}] = ${entry.probability.toFixed(4)} (${entry.wins}/${entry.total})`);
            shown++;
        }
    }
}

// Create singleton instance
const winProbabilityData = new WinProbabilityData();

// Add this section after the class definition and before the lookup functions:


// =============================================================================
// INCOMPLETE FRONT HAND HANDLING
// =============================================================================

// Hardcoded win probabilities for incomplete front pairs (from empirical data)
const FRONT_PAIR_WIN_PROBABILITIES = {
    2: 0.06835,   // Pair of 2s (extrapolated)
    3: 0.07355,   // Pair of 3s
    4: 0.07875,   // Pair of 4s
    5: 0.08542,   // Pair of 5s
    6: 0.09197,   // Pair of 6s
    7: 0.12046,   // Pair of 7s
    8: 0.12847,   // Pair of 8s
    9: 0.15077,   // Pair of 9s
    10: 0.17756,  // Pair of 10s
    11: 0.21210,  // Pair of Jacks
    12: 0.27089,  // Pair of Queens
    13: 0.33715,  // Pair of Kings
    14: 0.42356   // Pair of Aces
};

/**
 * Handle incomplete front hands with special logic
 * @param {Array<number>} handRank - Hand rank array
 * @returns {number|null} - Win probability or null if not incomplete front hand
 */
function handleIncompleteFrontHand(handRank) {
    if (handRank.length >= 2) {
        const handType = handRank[0];
        const primaryRank = handRank[1];

        // Handle incomplete pairs in front position
        if (handType === 2) {
            return FRONT_PAIR_WIN_PROBABILITIES[primaryRank] || 0.05;
        }

        // Handle incomplete high cards in front position
        if (handType === 1) {
            const baseProb = 0.02; // Lower than worst pair
            const rankBonus = (primaryRank - 2) * 0.002; // Small rank scaling
            return baseProb + rankBonus;
        }
    }

    return null; // Not an incomplete front hand
}

/**
 * Get empirical win probability with complete hand model
 * @param {string} position - Position (back/middle/front)
 * @param {Object} hand - Complete hand object with isIncomplete, hand_rank, etc.
 * @returns {number|null} - Win probability or null if no fallback found
 */
function lookupWinProbability(position, hand) {
    // Extract hand_rank for compatibility
    const handRank = hand.hand_rank || hand;

    // SPECIAL HANDLING: Incomplete front hands
    if (position.toLowerCase() === 'front' && hand.isIncomplete) {
        const incompleteProbability = handleIncompleteFrontHand(handRank);
        if (incompleteProbability !== null) {
            return incompleteProbability;
        }
    }

    // SPECIAL HANDLING: Incomplete middle/back hands get zero probability
    if ((position.toLowerCase() === 'middle' || position.toLowerCase() === 'back') && hand.isIncomplete) {
        return 0.01;
    }

    // Try hierarchical fallback - progressively truncate tuple
    for (let length = handRank.length; length >= 1; length--) {
        let truncatedTuple = handRank.slice(0, length);
        let probability = winProbabilityData.getWinProbability(position, truncatedTuple);

        if (probability !== null) {
            // Optional: Log fallback level for debugging (comment out to reduce noise)
            // if (length < handRank.length) {
            //     console.log(`🎯 Hierarchical match: level ${length}/${handRank.length} for ${position} [${handRank.join(',')}] → [${truncatedTuple.join(',')}]`);
            // }

            return probability;
        }
    }

    // No match found at any level (comment out to reduce noise)
    // console.warn('🚨 No hierarchical match found for:', position, handRank);
    return null; // Let ScoringUtilities handle the final fallback
}

/**
 * Get empirical win probability with intelligent fallback
 * @param {string} position - Position (back/middle/front)
 * @param {Array<number>} handRank - Hand rank array
 * @param {number} playerCount - Number of players (for fallback estimation)
 * @returns {number} - Win probability between 0 and 1
 */
function lookupWinProbabilityWithSmartFallback(position, handRank, playerCount = 4) {
    // First try empirical data
    const empiricalProbability = lookupWinProbability(position, handRank);
    if (empiricalProbability !== null) {
        return empiricalProbability;
    }

    // Fallback to estimated probability using original logic
    const rank = handRank[0];
    const baseProbabilities = {
        10: 0.85, 9: 0.75, 8: 0.65, 7: 0.55, 6: 0.45,
        5: 0.40, 4: 0.35, 3: 0.25, 2: 0.20, 1: 0.15, 0: 0.10
    };

    let probability = baseProbabilities[rank] || 0.10;

    // Adjust for player count
    if (playerCount !== 4) {
        probability = Math.pow(probability, (playerCount - 1) / 3);
    }

    // Position adjustments
    const pos = position.toLowerCase();
    if (pos === 'front' && rank < 4) {
        probability *= 0.8;
    } else if (pos === 'back' && rank >= 7) {
        probability *= 1.1;
    }

    return Math.min(probability, 0.95);
}

/**
 * Get empirical win probability with fallback
 * @param {string} position - Position (back/middle/front)
 * @param {Array<number>} handRank - Hand rank array
 * @param {number} fallback - Fallback probability if not found
 * @returns {number} - Win probability or fallback
 */
function lookupWinProbabilityWithFallback(position, handRank, fallback = 0.5) {
    const probability = lookupWinProbability(position, handRank);
    return probability !== null ? probability : fallback;
}

/**
 * Initialize win probability data (call once at startup)
 * @returns {Promise<boolean>} - True if loaded successfully
 */
async function initializeWinProbabilityData() {
    return await winProbabilityData.loadData();
}

/**
 * Get data loading status
 * @returns {Object} - Status information
 */
function getWinProbabilityDataStatus() {
    return {
        isLoaded: winProbabilityData.isLoaded,
        error: winProbabilityData.loadError,
        statistics: winProbabilityData.getStatistics()
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WinProbabilityData,
        winProbabilityData,
        lookupWinProbability,
        lookupWinProbabilityWithFallback,
        initializeWinProbabilityData,
        getWinProbabilityDataStatus
    };
}