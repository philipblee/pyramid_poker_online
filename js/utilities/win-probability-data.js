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



// =============================================================================
// LOOKUP FUNCTIONS - For integration with ScoringUtilities
// =============================================================================

/**
 * Get empirical win probability for a hand
 * @param {string} position - Position (back/middle/front)
 * @param {Array<number>} handRank - Hand rank array from handStrength.hand_rank
 * @returns {number|null} - Win probability or null if not found
 */
function lookupWinProbability(position, handRank) {
    return winProbabilityData.getWinProbability(position, handRank);
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