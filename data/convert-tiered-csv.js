const fs = require('fs');

// Read the file
const data = fs.readFileSync('tiered_win_probability.csv', 'utf8');
const lines = data.trim().split('\n');

// Convert header
const newLines = ['position,hand_rank_tuple,wins,total_matchups,win_rate'];

// Convert data lines
for(let i = 1; i < lines.length; i++) {
    const line = lines[i].trim().replace(/\r/g, ''); // Remove Windows line endings
    if(line) {
        // Parse: position,"[9, 14, 13]",99.9
        const match = line.match(/^([^,]+),"\[([^\]]+)\]",(.+)$/);
        if(match) {
            const position = match[1];
            const tupleContent = match[2]; // "9, 14, 13"
            const winProbability = parseFloat(match[3]); // 99.9

            // Convert [9, 14, 13] to (9, 14, 13) and percentage to decimal
            const newTuple = `"(${tupleContent})"`;
            const winRate = (winProbability / 100).toFixed(3); // 99.9 -> 0.999

            // Use dummy values for wins/total_matchups
            newLines.push(`${position},${newTuple},1,1,${winRate}`);
        } else {
            console.log('Failed to parse line:', line);
        }
    }
}

// Save the file
fs.writeFileSync('tiered_win_probability.csv', newLines.join('\n'));

console.log(`✅ Converted ${newLines.length - 1} entries and saved file!`);
console.log('Sample converted lines:');
for(let i = 0; i < Math.min(5, newLines.length); i++) {
    console.log(newLines[i]);
}