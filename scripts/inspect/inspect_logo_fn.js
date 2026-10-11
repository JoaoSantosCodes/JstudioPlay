const fs = require('fs');
const path = require('path');

const js = fs.readFileSync(path.join(__dirname, 'public', 'static', 'app.js'), 'utf8');

const regex = /function\s+channelLogo[^{]+\{([\s\S]*?)\n\}/;
const match = js.match(regex);
if (match) {
    console.log('--- channelLogo implementation ---');
    console.log(match[0]);
} else {
    console.log('channelLogo not found with simple regex, searching...');
    const lines = js.split('\n');
    lines.forEach((l, idx) => {
        if (l.includes('channelLogo')) {
            console.log(`L${idx+1}:`, l);
        }
    });
}
