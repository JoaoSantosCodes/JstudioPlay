const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const verifiedChannels = [
    {
        id: 'ch_redbull',
        name: 'Red Bull TV HD (Esportes & Ação)',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_TV_logo.svg/512px-Red_Bull_TV_logo.svg.png',
        group: 'Esportes & Aventura',
        url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
        streamType: 'live',
        status: 'online',
        latency: 110
    },
    {
        id: 'ch_bloomberg',
        name: 'Bloomberg TV Global HD (Notícias)',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Bloomberg_Television_logo.svg/512px-Bloomberg_Television_logo.svg.png',
        group: 'Notícias Internacionais',
        url: 'https://liveproduseast.akamaized.net/us/Channel-USTV-AWS-virginia-1/Source-USTV-1000-1_live.m3u8',
        streamType: 'live',
        status: 'online',
        latency: 135
    },
    {
        id: 'ch_dw',
        name: 'DW Deutsch HD (Documentários)',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_logo.svg/512px-Deutsche_Welle_logo.svg.png',
        group: 'Documentários & Cultura',
        url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
        streamType: 'live',
        status: 'online',
        latency: 140
    },
    {
        id: 'vod_bigbuck',
        name: 'Big Buck Bunny (Filme Demo 1080p)',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/440px-Big_buck_bunny_poster_big.jpg',
        group: 'Filmes & Animação (VOD)',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        streamType: 'vod',
        status: 'online',
        latency: 75
    },
    {
        id: 'vod_tears',
        name: 'Tears of Steel (Filme Sci-Fi Demo 4K)',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Tears_of_Steel_poster.jpg/440px-Tears_of_Steel_poster.jpg',
        group: 'Filmes & Animação (VOD)',
        url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        streamType: 'vod',
        status: 'online',
        latency: 82
    },
    {
        id: 'series_cosmos_s1e1',
        name: 'Cosmos: Uma Odisseia S01E01',
        logo: 'https://i.imgur.com/7YqZq2C.png',
        group: 'Séries & Documentários',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        streamType: 'series',
        status: 'online',
        latency: 80
    },
    {
        id: 'series_cosmos_s1e2',
        name: 'Cosmos: Uma Odisseia S01E02',
        logo: 'https://i.imgur.com/7YqZq2C.png',
        group: 'Séries & Documentários',
        url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        streamType: 'series',
        status: 'online',
        latency: 85
    }
];

if (data.playlists.length > 0) {
    const pid = data.playlists[0].id;
    data.channels[pid] = verifiedChannels;
    data.playlists[0].total = verifiedChannels.length;
    data.playlists[0].onlineCount = verifiedChannels.length;
    data.playlists[0].live = 3;
    data.playlists[0].vod = 2;
    data.playlists[0].series = 2;
}

fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
console.log('db.json successfully updated with verified channels!');
