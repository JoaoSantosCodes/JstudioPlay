const fs = require('fs');
const path = require('path');

fs.copyFileSync(
    path.join(__dirname, 'scraped', 'static', 'app.js'),
    path.join(__dirname, 'public', 'static', 'app.js')
);

console.log('Restored clean public/static/app.js from scraped/static/app.js');
