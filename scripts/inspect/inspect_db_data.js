const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('Playlists:', data.playlists.map(p => ({ id: p.id, name: p.name })));
for (const pid of Object.keys(data.channels)) {
    console.log(`Playlist ${pid} has ${data.channels[pid].length} channels. Channel 0:`, data.channels[pid][0].name, '->', data.channels[pid][0].url);
}
