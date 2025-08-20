// js/utilities/net-ev-lookup.js
// Net EV Lookup with hierarchical fallback (adapted from empirical-win-probability.js)

class NetEVLookup {
    constructor() {
        this.evMap = new Map();
        this.isLoaded = false;
        this.loadError = null;
    }

    /**
     * Load and parse Net EV CSV data from file
     * @returns {Promise<boolean>} - True if loaded successfully
     */
    async loadData() {
        try {
            console.log('🎯 Loading Net EV Lookup from CSV...');

            // Fetch the CSV file
            const response = await fetch('data/netEV_lookup_table.csv');
            if (!response.ok) {
                throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
            }

            const csvText = await response.text();
            this.parseCSV(csvText);

            console.log(`✅ Loaded ${this.evMap.size} Net EV entries`);
            this.isLoaded = true;
            return true;

        } catch (error) {
            console.error('❌ Error loading Net EV data:', error);
            this.loadError = error.message;
            return false;
        }
    }

    /**
     * Parse CSV text into EV map
     * @param {string} csvText - Raw CSV content
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');

        // Skip header row
        const dataLines = lines.slice(1);

        let parseCount = 0;
        let errorCount = 0;

        dataLines.forEach((line, index) => {
            try {
                // Parse CSV line (handle quoted fields)
                const fields = this.parseCSVLine(line);

                if (fields.length >= 11) { // Expecting many fields in EV CSV
                    const handRankStr = fields[0].trim();
                    const position = fields[1].trim();
                    const handType = fields[2].trim();
                    const primaryRank = parseInt(fields[3]);
                    const winRate = parseFloat(fields[4]);
                    const winPoints = parseFloat(fields[5]);
                    const positiveEV = parseFloat(fields[6]);
                    const higherTypesLossEV = parseFloat(fields[7]);
                    const sameTypeLossEV = parseFloat(fields[8]);
                    const totalNegativeEV = parseFloat(fields[9]);
                    const finalEV = parseFloat(fields[10]);

                    // Convert hand rank string "(10, 10)" to array [10, 10]
                    const handRank = this.parseHandRank(handRankStr);

                    if (handRank && !isNaN(finalEV)) {
                        // Create lookup key
                        const key = this.createLookupKey(position, handRank);

                        // Store in map
                        this.evMap.set(key, {
                            position,
                            handRank,
                            handType,
                            primaryRank,
                            winRate,
                            winPoints,
                            positiveEV,
                            higherTypesLossEV,
                            sameTypeLossEV,
                            totalNegativeEV,
                            finalEV
                        });

                        parseCount++;
                    } else {
                        throw new Error(`Invalid data values`);
                    }
                } else {
                    throw new Error(`Expected 11+ fields, got ${fields.length}`);
                }

            } catch (error) {
                console.warn(`⚠️ Line ${index + 2}: ${error.message} - "${line}"`);
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
            // Remove double quotes
            let cleaned = handRankStr;
            if (cleaned.startsWith('"')) {
                cleaned = cleaned.slice(1);
            }
            if (cleaned.endsWith('"')) {
                cleaned = cleaned.slice(0, -1);
            }

            // Extract content between parentheses
            if (!cleaned.startsWith('(') || !cleaned.endsWith(')')) {
                return null;
            }
            const innerContent = cleaned.slice(1, -1);

            // Parse numbers
            const values = innerContent.split(',').map(v => {
                const num = parseInt(v.trim());
                return isNaN(num) ? null : num;
            });

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
     * Get Net EV for position and hand rank
     * @param {string} position - Position (back/middle/front)
     * @param {Array<number>} handRank - Hand rank array
     * @returns {number|null} - Net EV or null if not found
     */
    getNetEV(position, handRank) {
        if (!this.isLoaded) {
            console.warn('⚠️ Net EV data not loaded yet');
            return null;
        }

        const key = this.createLookupKey(position, handRank);
        const entry = this.evMap.get(key);

        return entry ? entry.finalEV : null;
    }

    /**
     * Get detailed EV data for position and hand rank
     * @param {string} position - Position (back/middle/front)
     * @param {Array<number>} handRank - Hand rank array
     * @returns {Object|null} - Full EV entry or null if not found
     */
    getDetailedEVData(position, handRank) {
        if (!this.isLoaded) {
            console.warn('⚠️ Net EV data not loaded yet');
            return null;
        }

        const key = this.createLookupKey(position, handRank);
        return this.evMap.get(key) || null;
    }

    /**
     * Get statistics about loaded EV data
     * @returns {Object} - Data statistics
     */
    getStatistics() {
        if (!this.isLoaded) {
            return { loaded: false, error: this.loadError };
        }

        const positions = new Set();
        const handTypes = new Set();
        let totalEntries = 0;
        let avgFinalEV = 0;

        this.evMap.forEach(entry => {
            positions.add(entry.position);
            handTypes.add(entry.handType);
            avgFinalEV += entry.finalEV;
            totalEntries++;
        });

        return {
            loaded: true,
            totalEntries,
            positions: Array.from(positions),
            handTypes: Array.from(handTypes),
            avgFinalEV: totalEntries > 0 ? (avgFinalEV / totalEntries) : 0
        };
    }
}

// Create singleton instance
const netEVLookup = new NetEVLookup();

/**
 * Get Net EV with hierarchical fallback (mirrors your empirical win probability logic)
 * @param {string} position - Position (back/middle/front)
 * @param {Object} hand - Complete hand object with hand_rank, isIncomplete, etc.
 * @returns {number|null} - Net EV or null if no fallback found
 */
function lookupNetEV(position, hand) {
    // Extract hand_rank for compatibility
    const handRank = hand.hand_rank || hand;

    // SPECIAL HANDLING: Incomplete hands - use your existing fallback logic
//    if (hand.isIncomplete) {
//        // For incomplete hands, fall back to Pure EV calculation
//        // (You can implement specific incomplete hand logic here if needed)
//        console.log(`🔄 Incomplete hand detected for Net EV, using Pure EV fallback`);
//        return null; // Let calling code fall back to Pure EV
//    }

    // Try hierarchical fallback - progressively truncate tuple (same as your logic)
    for (let length = handRank.length; length >= 1; length--) {
        let truncatedTuple = handRank.slice(0, length);
        let netEV = netEVLookup.getNetEV(position, truncatedTuple);

        if (netEV !== null) {
            // Optional: Log fallback level for debugging
//            if (length < handRank.length) {
//                console.log(`🎯 Net EV hierarchical match: level ${length}/${handRank.length} for ${position} [${handRank.join(',')}] → [${truncatedTuple.join(',')}] = ${netEV.toFixed(2)}`);
//            }

            return netEV;
        }
    }

    // No match found at any level
//    console.warn('🚨 No Net EV hierarchical match found for:', position, handRank);
    return null; // Let calling code fall back to Pure EV
}

/**
 * Initialize Net EV data (call once at startup)
 * @returns {Promise<boolean>} - True if loaded successfully
 */
async function initializeNetEVLookup() {
    return await netEVLookup.loadData();
}

/**
 * Get Net EV data loading status
 * @returns {Object} - Status information
 */
function getNetEVDataStatus() {
    return {
        isLoaded: netEVLookup.isLoaded,
        error: netEVLookup.loadError,
        statistics: netEVLookup.getStatistics()
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NetEVLookup,
        lookupNetEV,
        initializeNetEVLookup,
        getNetEVDataStatus
    };
}