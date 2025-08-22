// js/utilities/net-ev-lookup.js
// Net EV Lookup with hierarchical fallback (adapted from empirical-win-netev.js)

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
//                console.log(`${fields[0]}, ${fields[1]}, ${fields[2]}, ${fields[3]}, ${fields[4]}`)

//                console.log(`Raw line: "${line}"`);
////                const fields = this.parseCSVLine(line);
//                console.log(`Parsed fields:`, fields);
//                console.log(`Field 4: "${fields[4]}" (exists: ${fields[4] !== undefined})`);

                if (fields.length >= 5) {
                    const position = fields[0].trim();
                    const handRankStr = fields[1].trim();
                    const wins = parseInt(fields[2]);
                    const total = parseInt(fields[3]);
                    const netev = parseFloat(fields[4]);

                    // Convert hand rank string "(10, 10)" to array [10, 10]
                    const handRank = this.parseHandRank(handRankStr);

                    if (handRank && !isNaN(netev) && total > 0) {
                        // Create lookup key
                        const key = this.createLookupKey(position, handRank);

                        // Store in map
                        this.evMap.set(key, {
                            position,
                            handRank,
                            wins,
                            total,
                            netev
                        });

                        // Verify what we just stored
                        const storedData = this.evMap.get(key);
//                        console.log(`✅ Stored for key "${key}":`, storedData);
//                        console.log(`✅ netev field: ${storedData.netev} (type: ${typeof storedData.netev})`);

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

    // In getNetEV() method, add this:
    console.log(`🔧 DEBUG: Looking for key "${position.toLowerCase()}_${tuple.join('_')}"`);
    console.log(`🔧 Data exists: ${this.lookupData ? 'YES' : 'NO'}`);
    if (this.lookupData) {
        const totalKeys = Object.keys(this.lookupData).length;
        const sampleKeys = Object.keys(this.lookupData).slice(0, 5);
        console.log(`🔧 Total entries: ${totalKeys}, Sample keys: ${sampleKeys}`);
    }

        if (!this.isLoaded) {
            console.warn('⚠️ Net EV data not loaded yet');
            return null;
        }

        const key = this.createLookupKey(position, handRank);

//        console.log(`🔍 Looking for key: "${key}"`);
//        console.log(`🔍 evMap has this key: ${this.evMap.has(key)}`);

        const entry = this.evMap.get(key);

        if (entry) {
//            console.log(`🔍 Found data:`, entry);
//            console.log(`🔍 entry.netev = ${entry.netev} (type: ${typeof entry.netev})`);
            return entry.netev;
        }

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

    // Add this method to your NetEV lookup class
    getNetEVByPrefix(position, partialTuple) {
        if (!this.lookupData) {
            console.log(`❌ NetEV lookup data is null/undefined`);
            return null;
        }

        const handType = partialTuple[0];
        console.log(`🔍 DEBUG Prefix search: ${position} handType=${handType} prefix=[${partialTuple.join(',')}]`);

        // Show what entries we actually have for this position/handType
        const allKeys = Object.keys(this.lookupData);
        const relevantKeys = allKeys.filter(key => {
            const keyParts = key.split('_');
            return keyParts.length >= 3 &&
                   keyParts[0].toLowerCase() === position.toLowerCase() &&
                   parseInt(keyParts[1]) === handType;
        });

        console.log(`🔍 Found ${relevantKeys.length} relevant entries for ${position}_${handType}:`);
        relevantKeys.slice(0, 5).forEach(key => {
            console.log(`   ${key} = ${this.lookupData[key]}`);
        });
        if (relevantKeys.length > 5) {
            console.log(`   ... and ${relevantKeys.length - 5} more`);
        }

        // Try the matching logic
        const matchingEntries = [];

        for (const [key, value] of Object.entries(this.lookupData)) {
            const keyParts = key.split('_');
            if (keyParts.length < 3) continue;

            const keyPosition = keyParts[0];
            const keyTuple = keyParts.slice(1).map(x => parseInt(x));

            // Debug each step
            const positionMatch = keyPosition.toLowerCase() === position.toLowerCase();
            if (!positionMatch) continue;

            let prefixMatch = true;
            for (let i = 0; i < partialTuple.length; i++) {
                if (i >= keyTuple.length || keyTuple[i] !== partialTuple[i]) {
                    prefixMatch = false;
                    break;
                }
            }

            if (prefixMatch) {
                console.log(`✅ Prefix match found: ${key} = ${value}`);
                matchingEntries.push({ key, value, tuple: keyTuple });
            }
        }

        console.log(`🔍 Total prefix matches found: ${matchingEntries.length}`);

        if (matchingEntries.length > 0) {
            const bestMatch = matchingEntries[0];
            console.log(`🎯 Returning first match: [${bestMatch.tuple.join(',')}] = ${bestMatch.value}`);
            return bestMatch.value;
        }

        console.log(`❌ No prefix matches found despite having ${relevantKeys.length} relevant entries!`);
        return null;
    }

}

// Create singleton instance
const netEVLookup = new NetEVLookup();

/**
 * Get Net EV with hierarchical fallback (mirrors tiered logic)
 * @param {string} position - Position (back/middle/front)
 * @param {Object} hand - Complete hand object with hand_rank, isIncomplete, etc.
 * @returns {number|null} - Net EV or null if no fallback found
 */

function lookupNetEV(position, hand) {
    const handRank = hand.hand_rank || hand;

    // Step 1: Try exact match first
    let netEV = netEVLookup.getNetEV(position, handRank);
    if (netEV !== null) {
        console.log(`🎯 Exact match: ${position} [${handRank.join(',')}] = ${netEV}`);
        return netEV;
    }

    // Step 2: Try prefix matching fallback
    for (let length = Math.min(handRank.length - 1, 2); length >= 2; length--) {
        let prefixTuple = handRank.slice(0, length);
        console.log(`🔍 Trying prefix match: ${position} [${prefixTuple.join(',')}]`);

        netEV = netEVLookup.getNetEVByPrefix(position, prefixTuple);

        if (netEV !== null) {
            console.log(`🎯 Prefix match: ${position} level ${length}/${handRank.length} [${handRank.join(',')}] → [${prefixTuple.join(',')}] = ${netEV}`);
            return netEV;
        }
    }

    // Step 3: Final hardcoded fallback
    if (handRank.length >= 2) {
        if (position.toLowerCase() === 'front') {
            const frontFallback = handleIncompleteFrontHand(handRank);
            if (frontFallback !== null) {
                console.log(`🎯 Front hardcoded fallback: ${position} [${handRank.join(',')}] = ${frontFallback}`);
                return frontFallback;
            }
        } else if (position.toLowerCase() === 'middle') {
            const middleFallback = handleIncompleteMiddleHand(handRank);
            if (middleFallback !== null) {
                console.log(`🎯 Middle hardcoded fallback: ${position} [${handRank.join(',')}] = ${middleFallback}`);
                return middleFallback;
            }
        } else if (position.toLowerCase() === 'back') {
            const backFallback = handleIncompleteBackHand(handRank);
            if (backFallback !== null) {
                console.log(`🎯 Back hardcoded fallback: ${position} [${handRank.join(',')}] = ${backFallback}`);
                return backFallback;
            }
        }
    }

    console.log(`❌ Complete lookup failure: ${position} [${handRank.join(',')}]`);
    return null;
}


function handleIncompleteBackHand(handRank) {
    const handType = handRank[0];
    const primaryRank = handRank[1];

    console.log(`🎯 Back fallback called for handType ${handType}, primaryRank ${primaryRank}`);

    // ✅ FIXED: NetEV values (can be negative, risk-adjusted)
    switch(handType) {
        case 5: // Straights
            if (primaryRank >= 14) return 2.20;  // Ace-high
            if (primaryRank >= 13) return 2.15;  // King-high
            if (primaryRank >= 10) return 2.05;  // Medium straights
            return 1.95;  // Low straights
        case 8: // Four of a kind - very strong
            return primaryRank >= 12 ? 5.70 : 5.50;
        case 7: // Full house - strong
            return primaryRank >= 12 ? 3.85 : 3.65;
        case 6: // Flush - decent
            return primaryRank >= 12 ? 1.45 : 1.25;
        case 3: // Trips - okay in back
            return primaryRank >= 12 ? 0.85 : 0.65;
        case 2: // Pairs - RISKY in back position
            return primaryRank >= 12 ? -0.85 : -1.25;  // ✅ NEGATIVE
        case 1: // High card - TERRIBLE in back
            return -2.50;  // ✅ VERY NEGATIVE
        default:
            return null;
    }
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