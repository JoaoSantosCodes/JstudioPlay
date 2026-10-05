const fs = require('fs');
const path = require('path');

const jsCode = fs.readFileSync(path.join(__dirname, 'scraped', 'static', 'app.formatted.js'), 'utf8');
const lines = jsCode.split('\n');

console.log('--- Key Functions & Classes ---');
lines.forEach((line, idx) => {
    if (line.match(/^(function\s+\w+|const\s+\w+\s*=|class\s+\w+|async\s+function\s+\w+)/)) {
        console.log(`L${idx+1}: ${line.slice(0, 100)}`);
    }
});
