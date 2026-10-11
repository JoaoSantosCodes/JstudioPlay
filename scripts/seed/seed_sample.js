const fs = require('fs');
const path = require('path');
const db = require('./server/database');

const sampleChannels = [
    {
        id: 'ch_sbt',
        name: 'Record News HD',
        logo: 'https://i.imgur.com/8QjZg5P.png',
        group: 'Notícias & Aberta',
        url: 'https://stream.ecrstream.com/recordnews/recordnews/playlist.m3u8',
        streamType: 'live',
        status: 'online',
        latency: 120
    },
    {
        id: 'ch_tvbrasil',
        name: 'TV Brasil HD',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/TV_Brasil_2019_logo.svg/512px-TV_Brasil_2019_logo.svg.png',
        group: 'Notícias & Aberta',
        url: 'https://tvbrasil-hls.ebc.com.br/hls/tvbrasil.m3u8',
        streamType: 'live',
        status: 'online',
        latency: 95
    },
    {
        id: 'ch_redetv',
        name: 'Rede TV HD',
        logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/d/d7/RedeTV%21_logo_2019.png/512px-RedeTV%21_logo_2019.png',
        group: 'Notícias & Aberta',
        url: 'https://rntv.akamaized.net/hls/live/2042858/redetv/master.m3u8',
        streamType: 'live',
        status: 'online',
        latency: 110
    },
    {
        id: 'ch_bloomberg',
        name: 'Bloomberg TV Global (English)',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Bloomberg_Television_logo.svg/512px-Bloomberg_Television_logo.svg.png',
        group: 'Internacional & Notícias',
        url: 'https://liveproduseast.akamaized.net/us/Channel-USTV-AWS-virginia-1/Source-USTV-1000-1_live.m3u8',
        streamType: 'live',
        status: 'online',
        latency: 140
    },
    {
        id: 'ch_euronews',
        name: 'Euronews Português',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Euronews_2016_logo.svg/512px-Euronews_2016_logo.svg.png',
        group: 'Internacional & Notícias',
        url: 'https://euronews-euronews-portugues-1-pt.samsung.wurl.tv/playlist.m3u8',
        streamType: 'live',
        status: 'online',
        latency: 130
    },
    {
        id: 'ch_nasa',
        name: 'NASA TV HD',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg',
        group: 'Ciência & Documentários',
        url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
        streamType: 'live',
        status: 'online',
        latency: 150
    },
    {
        id: 'vod_bigbuck',
        name: 'Big Buck Bunny (4K / 1080p Demo)',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/440px-Big_buck_bunny_poster_big.jpg',
        group: 'Filmes & Animação (VOD)',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        streamType: 'vod',
        status: 'online',
        latency: 80
    },
    {
        id: 'vod_tears',
        name: 'Tears of Steel (Sci-Fi Demo)',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Tears_of_Steel_poster.jpg/440px-Tears_of_Steel_poster.jpg',
        group: 'Filmes & Animação (VOD)',
        url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        streamType: 'vod',
        status: 'online',
        latency: 90
    },
    {
        id: 'series_cosmos_s1e1',
        name: 'Cosmos: Uma Odisseia S01E01',
        logo: 'https://i.imgur.com/7YqZq2C.png',
        group: 'Séries & Documentários',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        streamType: 'series',
        status: 'online',
        latency: 85
    },
    {
        id: 'series_cosmos_s1e2',
        name: 'Cosmos: Uma Odisseia S01E02',
        logo: 'https://i.imgur.com/7YqZq2C.png',
        group: 'Séries & Documentários',
        url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        streamType: 'series',
        status: 'online',
        latency: 88
    }
];

const existing = db.getPlaylists('usr_admin');
if (existing.length === 0) {
    db.createPlaylist({
        userId: 'usr_admin',
        name: 'Lista VIP Master (Demonstração)',
        url: 'https://iptv-org.github.io/iptv/countries/br.m3u',
        channels: sampleChannels,
        autoSync: true
    });
    console.log('Sample playlist seeded successfully.');
} else {
    console.log('Playlists already exist.');
}
