const fs = require('fs');
const path = require('path');

const jsCode = fs.readFileSync(path.join(__dirname, 'scraped', 'static', 'app.formatted.js'), 'utf8');
const lines = jsCode.split('\n');

function printFunction(fnName) {
    console.log(`\n=================== FUNCTION: ${fnName} ===================`);
    const startIdx = lines.findIndex(l => l.includes(`function ${fnName}`));
    if (startIdx !== -1) {
        console.log(lines.slice(startIdx, startIdx + 30).join('\n'));
    }
}

printFunction('playlistRows');
printFunction('renderChannelRow');
printFunction('navLink');
