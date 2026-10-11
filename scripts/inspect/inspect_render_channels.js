const fs = require('fs');
const path = require('path');

const js = fs.readFileSync(path.join(__dirname, 'public', 'static', 'app.js'), 'utf8');
const lines = js.split('\n');

lines.forEach((l, idx) => {
    if (l.includes('loadVisibleChannelLogos') || l.includes('channelLogoObserver') || l.includes('renderChannels')) {
        console.log(`L${idx+1}:`, l);
    }
});
