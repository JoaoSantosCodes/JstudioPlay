const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'scraped');
const destDir = path.join(__dirname, 'public');

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const child of fs.readdirSync(src)) {
            copyRecursive(path.join(src, child), path.join(dest, child));
        }
    } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
    }
}

copyRecursive(srcDir, destDir);
console.log('Public folder prepared successfully.');
