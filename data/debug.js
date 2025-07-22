const fs = require('fs');

const data = fs.readFileSync('tiered_win_probability.csv', 'utf8');
const lines = data.trim().split('\n');

console.log('Total lines:', lines.length);
console.log('Header:', lines[0]);
console.log('First data line:', lines[1]);
console.log('Second data line:', lines[2]);

// Check what split gives us
if(lines[1]) {
    const parts = lines[1].split(',');
    console.log('Split parts:', parts);
    console.log('Parts length:', parts.length);
}