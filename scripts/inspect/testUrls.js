const axios = require('axios');

const urls = [
    { id: 'comedy', url: 'https://iptv-org.github.io/iptv/categories/comedy.m3u' },
    { id: 'kids', url: 'https://iptv-org.github.io/iptv/categories/kids.m3u' },
    { id: 'entertainment', url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u' },
    { id: 'education', url: 'https://iptv-org.github.io/iptv/categories/education.m3u' },
    { id: 'family', url: 'https://iptv-org.github.io/iptv/categories/family.m3u' },
    { id: 'general', url: 'https://iptv-org.github.io/iptv/categories/general.m3u' }
];

async function check() {
    for (const item of urls) {
        try {
            const res = await axios.head(item.url, { timeout: 8000 });
            console.log(`[OK ${res.status}] ${item.id} -> ${item.url}`);
        } catch (e) {
            console.log(`[ERR ${e.response ? e.response.status : e.message}] ${item.id} -> ${item.url}`);
        }
    }
}

check();
