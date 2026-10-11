const fs = require('fs');
const path = require('path');

const jsCode = fs.readFileSync(path.join(__dirname, 'scraped', 'static', 'app.formatted.js'), 'utf8');
const lines = jsCode.split('\n');

const startIdx = lines.findIndex(l => l.includes('async function renderRoute'));
if (startIdx !== -1) {
    console.log(lines.slice(startIdx, startIdx + 50).join('\n'));
}
