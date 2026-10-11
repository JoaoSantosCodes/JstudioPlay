const fs = require('fs');
const path = require('path');

const jsCode = fs.readFileSync(path.join(__dirname, 'scraped', 'static', 'app.formatted.js'), 'utf8');
const lines = jsCode.split('\n');

function findSnippet(keyword, count = 25) {
    console.log(`\n=================== SEARCH: ${keyword} ===================`);
    lines.forEach((line, idx) => {
        if (line.includes(keyword)) {
            console.log(`--- Match at line ${idx+1} ---`);
            const start = Math.max(0, idx - 5);
            const end = Math.min(lines.length, idx + count);
            console.log(lines.slice(start, end).join('\n'));
        }
    });
}

findSnippet('/session', 30);
findSnippet('/library', 30);
findSnippet('/playlists', 30);
