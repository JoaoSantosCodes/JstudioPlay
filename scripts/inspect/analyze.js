const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, 'scraped', 'static', 'app.js');
const jsCode = fs.readFileSync(jsPath, 'utf8');

console.log('Total characters:', jsCode.length);

const keywords = ['fetch', 'localStorage', 'indexedDB', 'm3u', 'playlist', 'api', 'stream', 'cors', 'hls', 'xtream', 'proxy', 'import', 'export', 'account', 'auth', 'login', 'token', 'backend', 'server'];
keywords.forEach(kw => {
    const reg = new RegExp(kw, 'gi');
    const matches = jsCode.match(reg);
    console.log(`- "${kw}": ${matches ? matches.length : 0}`);
});

// Let's find all URLs or API endpoints in app.js
const urlMatches = jsCode.match(/(https?:\/\/[^\s"'`]+|\/api\/[^\s"'`]+)/g) || [];
console.log('\nUnique URLs / endpoints found:');
[...new Set(urlMatches)].forEach(u => console.log('  ', u));
