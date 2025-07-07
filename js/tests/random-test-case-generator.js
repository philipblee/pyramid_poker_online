// js/tests/random-test-case-generator.js
// Node.js version - writes directly to files

const fs = require('fs');
const path = require('path');

class RandomTestCaseGenerator {
    constructor() {
        // Standard deck with 2 decks (no wild cards)
        this.suits = ['♠', '♥', '♦', '♣'];
        this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.deck = this.createDeck();
    }

    /**
     * Create a deck with 2 standard decks (104 cards total)
     */
    createDeck() {
        const deck = [];

        // Add 2 copies of each card (2 standard decks)
        for (let copy = 1; copy <= 2; copy++) {
            for (const suit of this.suits) {
                for (const rank of this.ranks) {
                    deck.push(`${rank}${suit}`);
                }
            }
        }

        return deck;
    }

    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Generate a random 17-card hand
     */
    generateRandomHand() {
        const shuffledDeck = this.shuffleArray(this.deck);
        return shuffledDeck.slice(0, 17);
    }

    /**
     * Format cards array as space-separated string
     */
    formatCardsString(cards) {
        return cards.join(' ');
    }

    /**
     * Generate a single test case
     */
    generateTestCase(id) {
        const cards = this.generateRandomHand();
        const cardsString = this.formatCardsString(cards);

        return {
            id: id,
            name: `Random Test Case ${id}`,
            cards: cardsString
            // No expected field - will be calculated by framework
        };
    }

    /**
     * Generate multiple test cases
     */
    generateTestCases(startId, count) {
        const testCases = [];

        for (let i = 0; i < count; i++) {
            const testCase = this.generateTestCase(startId + i);
            testCases.push(testCase);
        }

        return testCases;
    }

    /**
     * Format test case as JavaScript code string
     */
    formatTestCaseCode(testCase) {
        return `    {
        id: ${testCase.id},
        name: "${testCase.name}",
        cards: "${testCase.cards}"
    }`;
    }

    /**
     * Generate complete JavaScript file content
     */
    generateFileContent(testCases) {
        const testCaseStrings = testCases.map(tc => this.formatTestCaseCode(tc));

        return `${testCaseStrings.join(',\n\n')}`;
    }

    /**
     * Write test cases to file
     */
    writeToFile(testCases, filename = 'random-test-cases-generated.js') {
        const content = this.generateFileContent(testCases);
        const filepath = path.join(__dirname, filename);

        try {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`✅ Successfully wrote ${testCases.length} test cases to: ${filepath}`);
            console.log(`📁 File size: ${fs.statSync(filepath).size} bytes`);
            return filepath;
        } catch (error) {
            console.error(`❌ Error writing file: ${error.message}`);
            throw error;
        }
    }

    /**
     * Auto-detect current test case count from existing file
     */
    detectCurrentTestCaseCount() {
        const testCasesPath = path.join(__dirname, 'hand-detector-test-cases.js');

        try {
            if (!fs.existsSync(testCasesPath)) {
                console.log(`⚠️ Test cases file not found: ${testCasesPath}`);
                console.log(`📁 Using default count of 17`);
                return 17;
            }

            const content = fs.readFileSync(testCasesPath, 'utf8');

            // Look for id: numbers in the file
            const idMatches = content.match(/id:\s*(\d+)/g);

            if (!idMatches || idMatches.length === 0) {
                console.log(`⚠️ No test case IDs found in file`);
                return 17;
            }

            // Extract the highest ID number
            const ids = idMatches.map(match => {
                const num = match.match(/\d+/)[0];
                return parseInt(num);
            });

            const maxId = Math.max(...ids);

            console.log(`🔍 Detected ${ids.length} test cases in file, highest ID: ${maxId}`);
            return maxId;

        } catch (error) {
            console.log(`⚠️ Error reading test cases file: ${error.message}`);
            console.log(`📁 Using default count of 17`);
            return 17;
        }
    }

    /**
     * Main function to generate test cases and write to file
     */
    generateAndWriteTestCases(currentCount = null, addCount = 3, filename = 'random-test-cases-generated.js') {
        // Auto-detect current count if not provided
        if (currentCount === null) {
            currentCount = this.detectCurrentTestCaseCount();
        }

        console.log(`🎲 Generating ${addCount} random test cases...`);
        console.log(`📊 Current cases: ${currentCount}, Target: ${currentCount + addCount}`);

        const startId = currentCount + 1;
        const newTestCases = this.generateTestCases(startId, addCount);

        console.log(`\n✅ Generated ${newTestCases.length} new test cases (IDs ${startId}-${startId + addCount - 1})`);

        // Write to file
        const filepath = this.writeToFile(newTestCases, filename);

        // Display summary
        console.log('\n📋 Generated hands summary:');
        newTestCases.forEach(tc => {
            const cardCount = tc.cards.split(' ').length;
            console.log(`   ${tc.name}: ${cardCount} cards`);
        });

        console.log(`\n📝 Next steps:`);
        console.log(`   1. Open: ${filepath}`);
        console.log(`   2. Copy the test cases from the GENERATED_TEST_CASES array`);
        console.log(`   3. Paste into hand-detector-test-cases.js before the closing ];`);

        return newTestCases;
    }
}

// CLI Usage functions
function generateRandomTestCases(addCount = 3) {
    const generator = new RandomTestCaseGenerator();
    return generator.generateAndWriteTestCases(null, addCount); // null = auto-detect
}

function generateToTarget(targetCount = 20) {
    const generator = new RandomTestCaseGenerator();
    const currentCount = generator.detectCurrentTestCaseCount();
    const addCount = targetCount - currentCount;

    if (addCount <= 0) {
        console.log(`Already at or above target count of ${targetCount} (current: ${currentCount})`);
        return [];
    }

    return generator.generateAndWriteTestCases(currentCount, addCount);
}

// CLI execution
if (require.main === module) {
    // Get command line arguments
    const args = process.argv.slice(2);
    const addCount = parseInt(args[0]) || 3;

    console.log('🎲 Random Test Case Generator');
    console.log('==============================');

    generateRandomTestCases(addCount);
}

// Export for use as module
module.exports = { RandomTestCaseGenerator, generateRandomTestCases, generateToTarget };