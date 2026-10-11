const fs = require('fs');
const path = require('path');

const jsCode = fs.readFileSync(path.join(__dirname, 'scraped', 'static', 'app.js'), 'utf8');

// Simple formatting for readability
let formatted = '';
let indent = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < jsCode.length; i++) {
    const c = jsCode[i];
    const prev = jsCode[i - 1];
    
    if (inString) {
        formatted += c;
        if (c === stringChar && prev !== '\\') {
            inString = false;
        }
        continue;
    }
    
    if (c === '"' || c === "'" || c === '`') {
        inString = true;
        stringChar = c;
        formatted += c;
        continue;
    }
    
    if (c === '{') {
        indent += 2;
        formatted += ' {\n' + ' '.repeat(indent);
    } else if (c === '}') {
        indent = Math.max(0, indent - 2);
        formatted += '\n' + ' '.repeat(indent) + '}';
    } else if (c === ';') {
        formatted += ';\n' + ' '.repeat(indent);
    } else {
        formatted += c;
    }
}

fs.writeFileSync(path.join(__dirname, 'scraped', 'static', 'app.formatted.js'), formatted, 'utf8');
console.log('Formatted JS saved. Sample lines:');

const lines = formatted.split('\n');
console.log('Total lines:', lines.length);
console.log(lines.slice(0, 50).join('\n'));
