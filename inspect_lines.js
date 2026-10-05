const fs = require('fs');
const path = require('path');

const js = fs.readFileSync(path.join(__dirname, 'public', 'static', 'app.js'), 'utf8');
const lines = js.split('\n');

console.log(lines.slice(270, 335).join('\n'));
