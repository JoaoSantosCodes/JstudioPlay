const fs = require('fs');
const path = require('path');

const jsCode = fs.readFileSync(path.join(__dirname, 'scraped', 'static', 'app.formatted.js'), 'utf8');

const regex = /api\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*['"`]([^'"`]+)['"`])?/g;
let match;
const endpoints = [];
while ((match = regex.exec(jsCode)) !== null) {
    endpoints.push({ path: match[1], method: match[2] || 'GET' });
}

console.log('--- API Endpoints called by app.js ---');
endpoints.forEach(e => console.log(`${e.method.padEnd(6)} ${e.path}`));
