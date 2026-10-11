/**
 * M3U PLAY PRO - Curated M3U Hub Directory
 * High quality, verified, legal and permanent public M3U streams categorized for 1-click loading.
 */

const CURATED_PLAYLISTS = [
    {
        id: 'hub_tv_aberta_br',
        title: '🇧🇷 TV Aberta Brasil & Regionais HD',
        description: 'Globo, SBT, Record TV, Rede Bandeirantes, RedeTV, TV Cultura, TV Brasil, Canal Futura e dezenas de emissoras regionais de todos os estados brasileiros.',
        category: 'TV Aberta',
        badge: '🇧🇷 Brasil TV Aberta',
        icon: 'tv',
        channelCountEstimate: 390,
        url: 'https://iptv-org.github.io/iptv/countries/br.m3u',
        epgUrl: 'https://iptv-org.github.io/epg/guides/br.xml',
        tags: ['Globo', 'SBT', 'Record', 'Band', 'Cultura', 'Ao Vivo', 'HD']
    },
    {
        id: 'hub_esportes_global',
        title: '⚽ Esportes & Aventura Ao Vivo HD',
        description: 'Transmissões esportivas oficiais, CazéTV, Red Bull TV HD, FIFA+ Live, Fight Network, Automobilismo, MMA, Surf e esportes radicais mundiais.',
        category: 'Esportes',
        badge: '⚽ 100% Esportes',
        icon: 'activity',
        channelCountEstimate: 445,
        url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
        tags: ['CazéTV', 'Red Bull TV', 'Futebol', 'Lutas', 'Automobilismo', 'Ao Vivo']
    },
    {
        id: 'hub_noticias_24h',
        title: '📰 Notícias & Jornalismo 24 Horas BR & Mundo',
        description: 'Cobertura jornalística mundial em tempo real: Record News, BandNews TV, Jovem Pan News, CNN Brasil, BBC News, Euronews PT, DW e Al Jazeera English.',
        category: 'Notícias',
        badge: '📰 24h News',
        icon: 'globe',
        channelCountEstimate: 1030,
        url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
        tags: ['CNN', 'BandNews', 'Jovem Pan', 'Record News', 'BBC', 'Tempo Real']
    },
    {
        id: 'hub_kids_animacao',
        title: '👶 Desenhos, Animações & Kids HD',
        description: 'Canais 24h dedicados às crianças: Turma da Mônica, Galinha Pintadinha, Moonbug Kids, Toon Goggles, Desenhos Clássicos e séries educativas.',
        category: 'Infantil',
        badge: '👶 Kids & Animação',
        icon: 'smile',
        channelCountEstimate: 280,
        url: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
        tags: ['Desenhos', 'Kids', 'Família', 'Educativo', '24 Horas']
    },
    {
        id: 'hub_musicas_shows',
        title: '🎵 Músicas, Shows & Videoclipes 24h',
        description: 'Canais 24 horas ininterruptos de clipes musicais: Vevo Pop, Clubbing TV HD, MTV Retrô Clássicos, Lounge TV, Eletrônica e Festivais Internacionais.',
        category: 'Música',
        badge: '🎵 Música & Shows',
        icon: 'music',
        channelCountEstimate: 760,
        url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
        tags: ['Pop', 'Rock', 'Eletrônica', 'Shows', 'Clipes 24h']
    },
    {
        id: 'hub_documentarios_ciencia',
        title: '🌿 Documentários, Ciência & NASA TV UHD 4K',
        description: 'Exploração espacial da NASA em 4K, imagens ao vivo da Terra na Estação Espacial (ISS), vida selvagem, história e arqueologia.',
        category: 'Documentários',
        badge: '🌿 Ciência & NASA 4K',
        icon: 'film',
        channelCountEstimate: 255,
        url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
        tags: ['NASA 4K', 'ISS Live', 'Natureza', 'História', 'Ciência']
    },
    {
        id: 'hub_cinema_retro',
        title: '🎬 Cinema Retrô & Filmes Clássicos VOD',
        description: 'Grandes clássicos de Hollywood, filmes cult, faroeste americano, cinema noir, comédias históricas e ficção científica vintage.',
        category: 'Filmes & Cinema',
        badge: '🎬 Clássicos VOD',
        icon: 'video',
        channelCountEstimate: 105,
        url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
        tags: ['Cinema', 'Faroeste', 'Sci-Fi', 'Clássicos']
    },
    {
        id: 'hub_comedy_shows',
        title: '🎭 Comédia, Humor & Stand-Up 24h',
        description: 'Canais de humor 24 horas, esquetes clássicas, sit-coms vintage, stand-up comedy e programas de entretenimento leve.',
        category: 'Comédia',
        badge: '🎭 Comédia 24h',
        icon: 'smile',
        channelCountEstimate: 95,
        url: 'https://iptv-org.github.io/iptv/categories/comedy.m3u',
        tags: ['Comédia', 'Humor', 'Stand-up', 'Sitcoms', '24h']
    },
    {
        id: 'hub_portugues_global',
        title: '🌍 Lusofonia Global (Portugal, Angola, Moçambique)',
        description: 'Transmissões em língua portuguesa do mundo todo: Portugal (RTP Internacional, SIC Notícias, TVI), Angola (TPA) e Moçambique (TVM).',
        category: 'Internacional',
        badge: '🌍 Lusofonia',
        icon: 'flag',
        channelCountEstimate: 470,
        url: 'https://iptv-org.github.io/iptv/languages/por.m3u',
        tags: ['Brasil', 'Portugal', 'Angola', 'Moçambique', 'RTP', 'SIC']
    },
    {
        id: 'hub_natureza_relax_4k',
        title: '✨ Paisagens 4K, Aquários & Lofi Beats 24/7',
        description: 'Transmissões em Ultra HD 4K com imagens relaxantes da natureza, praias paradisíacas, aurora boreal, aquários marinhos e música lofi ambiental.',
        category: 'Relax & 4K',
        badge: '✨ Ultra HD 4K',
        icon: 'sun',
        channelCountEstimate: 40,
        url: 'https://iptv-org.github.io/iptv/categories/relax.m3u',
        tags: ['4K UHD', 'Lofi Girl', 'Natureza', 'Praias', 'Relax']
    },
    {
        id: 'hub_entertainment_all',
        title: '🎪 Entretenimento, Séries & Variedades',
        description: 'Super catálogo com programas de auditório, realities, talk shows, séries clássicas e variedades de canais abertos globais.',
        category: 'Entretenimento',
        badge: '🎪 Variedades',
        icon: 'grid',
        channelCountEstimate: 850,
        url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
        tags: ['Talk Shows', 'Variedades', 'Séries', 'Entretenimento']
    }
];

class M3UHub {
    getCatalog() {
        return CURATED_PLAYLISTS;
    }

    getPlaylistById(id) {
        return CURATED_PLAYLISTS.find(p => p.id === id);
    }
}

module.exports = new M3UHub();
