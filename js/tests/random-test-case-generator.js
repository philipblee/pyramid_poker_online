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
    * Generate a random hand with specified number of wild cards
    * @param {number} wildCount - Number of wild cards to include (0-17)
    */
   generateRandomHand(wildCount = 0) {
       if (wildCount < 0 || wildCount > 17) {
           throw new Error(`Invalid wildCount: ${wildCount}. Must be 0-17.`);
       }

       const regularCardCount = 17 - wildCount;
       const shuffledDeck = this.shuffleArray(this.deck);
       const regularCards = shuffledDeck.slice(0, regularCardCount);

       // Add wild cards
       const wildCards = [];
       for (let i = 0; i < wildCount; i++) {
           wildCards.push('🃏');
       }

       return [...regularCards, ...wildCards];
   }

   /**
    * Format cards array as space-separated string
    */
   formatCardsString(cards) {
       return cards.join(' ');
   }

   /**
    * Generate a single test case with specified wild count
    */
   generateTestCase(id, wildCount = 0) {
       const cards = this.generateRandomHand(wildCount);
       const cardsString = this.formatCardsString(cards);

       return {
           id: id,
           name: `Random Test Case ${id} (${wildCount} wild${wildCount !== 1 ? 's' : ''})`,
           cards: cardsString
       };
   }

   /**
    * Generate multiple test cases with specified wild count
    */
   generateTestCases(startId, count, wildCount = 0) {
       const testCases = [];

       for (let i = 0; i < count; i++) {
           const testCase = this.generateTestCase(startId + i, wildCount);
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
    * Get constant name based on wild count
    */
   getConstantName(wildCount) {
       if (wildCount === 0) return 'HAND_DETECTOR_TEST_CASES';
       if (wildCount === 1) return 'ONE_WILD_TEST_CASES';
       if (wildCount === 2) return 'TWO_WILD_TEST_CASES';
       return `${wildCount}_WILD_TEST_CASES`;
   }

   /**
    * Generate complete JavaScript file content with proper constant name
    */
   generateFileContent(testCases, wildCount = 0) {
       const testCaseStrings = testCases.map(tc => this.formatTestCaseCode(tc));
       const constantName = this.getConstantName(wildCount);

       return `// Auto-generated test cases with ${wildCount} wild card${wildCount !== 1 ? 's' : ''}
const ${constantName} = [
${testCaseStrings.join(',\n\n')}
];`;
   }

   /**
    * Write test cases to file with wild-count-based filename
    */
   writeToFile(testCases, wildCount = 0, filename = null) {
       if (!filename) {
           const wildSuffix = wildCount === 0 ? '' : `-${wildCount}-wild`;
           filename = `random-test-cases${wildSuffix}-generated.js`;
       }

       const content = this.generateFileContent(testCases, wildCount);
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
    * Main function to generate test cases and write to file (PARAMETERIZED)
    */
   generateAndWriteTestCases(currentCount = null, addCount = 3, wildCount = 0, filename = null) {
       // Auto-detect current count if not provided
       if (currentCount === null) {
           currentCount = this.detectCurrentTestCaseCount();
       }

       console.log(`🎲 Generating ${addCount} random test cases with ${wildCount} wild card${wildCount !== 1 ? 's' : ''}...`);
       console.log(`📊 Current cases: ${currentCount}, Target: ${currentCount + addCount}`);

       const startId = currentCount + 1;
       const newTestCases = this.generateTestCases(startId, addCount, wildCount);

       console.log(`\n✅ Generated ${newTestCases.length} new test cases (IDs ${startId}-${startId + addCount - 1})`);

       // Write to file
       const filepath = this.writeToFile(newTestCases, wildCount, filename);

       // Display summary
       console.log('\n📋 Generated hands summary:');
       newTestCases.forEach(tc => {
           const cardCount = tc.cards.split(' ').length;
           const wildCardCount = (tc.cards.match(/🃏/g) || []).length;
           const regularCount = cardCount - wildCardCount;
           console.log(`   ${tc.name}: ${regularCount} regular + ${wildCardCount} wild = ${cardCount} total`);
       });

       const constantName = this.getConstantName(wildCount);
       console.log(`\n📝 Next steps:`);
       console.log(`   1. Open: ${filepath}`);
       console.log(`   2. Copy the ${constantName} array`);
       console.log(`   3. Create or update the appropriate test cases file`);

       return newTestCases;
   }
}

// CLI Usage functions
function generateRandomTestCases(addCount = 3, wildCount = 0) {
   const generator = new RandomTestCaseGenerator();
   return generator.generateAndWriteTestCases(null, addCount, wildCount);
}

function generateToTarget(targetCount = 20, wildCount = 0) {
   const generator = new RandomTestCaseGenerator();
   const currentCount = generator.detectCurrentTestCaseCount();
   const addCount = targetCount - currentCount;

   if (addCount <= 0) {
       console.log(`Already at or above target count of ${targetCount} (current: ${currentCount})`);
       return [];
   }

   return generator.generateAndWriteTestCases(currentCount, addCount, wildCount);
}

// CLI execution
if (require.main === module) {
   // Get command line arguments
   const args = process.argv.slice(2);
   const addCount = parseInt(args[0]) || 3;
   const wildCount = parseInt(args[1]) || 0;

   console.log('🎲 Random Test Case Generator');
   console.log('==============================');

   generateRandomTestCases(addCount, wildCount);
}

// Export for use as module
module.exports = { RandomTestCaseGenerator, generateRandomTestCases, generateToTarget };