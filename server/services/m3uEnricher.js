/**
 * M3U PLAY PRO - Channel Metadata Enricher & Logo Auto-Fixer
 * Automatically cleans channel names, assigns high-res logos, and categorizes streams.
 */

const CHANNEL_DICTIONARY = [
    // TV Aberta Brasil
    { match: /globo/i, name: 'TV Globo HD', tvgId: 'Globo.br', group: 'TV Aberta', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/globo.png' },
    { match: /\bsbt\b|sistema brasileiro de televis/i, name: 'SBT HD', tvgId: 'SBT.br', group: 'TV Aberta', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/sbt.png' },
    { match: /record(?!\s*news)/i, name: 'Record TV HD', tvgId: 'Record.br', group: 'TV Aberta', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/record.png' },
    { match: /bandeirantes|\bband\b/i, name: 'Rede Bandeirantes HD', tvgId: 'Band.br', group: 'TV Aberta', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/band.png' },
    { match: /redetv|rede tv/i, name: 'RedeTV! HD', tvgId: 'RedeTV.br', group: 'TV Aberta', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/redetv.png' },
    { match: /tv cultura|cultura/i, name: 'TV Cultura HD', tvgId: 'TVCultura.br', group: 'TV Aberta', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/tvcultura.png' },
    { match: /tv brasil/i, name: 'TV Brasil HD', tvgId: 'TVBrasil.br', group: 'TV Aberta', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/tvbrasil.png' },
    { match: /futura/i, name: 'Canal Futura', tvgId: 'Futura.br', group: 'TV Aberta', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/futura.png' },
    { match: /tv aparecida|aparecida/i, name: 'TV Aparecida HD', tvgId: 'TVAparecida.br', group: 'TV Aberta', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/tvaparecida.png' },
    { match: /cancao nova|canção nova/i, name: 'TV Canção Nova', tvgId: 'CancaoNova.br', group: 'TV Aberta', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/cancaonova.png' },
    { match: /tv senado|senado/i, name: 'TV Senado HD', tvgId: 'TVSenado.br', group: 'TV Aberta', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/tvsenado.png' },
    { match: /tv camara|câmara/i, name: 'TV Câmara HD', tvgId: 'TVCamara.br', group: 'TV Aberta', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/tvcamara.png' },

    // Pluto TV Brasil
    { match: /pluto tv cine|cine sucessos/i, name: 'Pluto TV Cine Sucessos HD', tvgId: 'PlutoTVCineSucessos.br', group: 'Pluto TV', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/plutotvcinesucessos.png' },
    { match: /pluto tv series|pluto tv séries/i, name: 'Pluto TV Séries HD', tvgId: 'PlutoTVSeries.br', group: 'Pluto TV', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/plutotvseries.png' },
    { match: /south park/i, name: 'South Park 24/7 HD', tvgId: 'SouthPark.br', group: 'Pluto TV', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/southpark.png' },
    { match: /naruto|anime/i, name: 'Pluto TV Anime HD', tvgId: 'PlutoTVAnime.br', group: 'Pluto TV', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/plutotvanime.png' },
    { match: /tastemade/i, name: 'Tastemade Brasil HD', tvgId: 'Tastemade.br', group: 'Variedades & Culinária', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/tastemade.png' },
    { match: /masterchef/i, name: 'MasterChef Brasil 24h', tvgId: 'MasterChef.br', group: 'Variedades & Culinária', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/masterchef.png' },

    // Notícias 24h
    { match: /record news/i, name: 'Record News HD', tvgId: 'RecordNews.br', group: 'Notícias', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/recordnews.png' },
    { match: /bandnews|band news/i, name: 'BandNews TV HD', tvgId: 'BandNews.br', group: 'Notícias', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/bandnewstv.png' },
    { match: /jovem pan|jovempan/i, name: 'Jovem Pan News HD', tvgId: 'JovemPanNews.br', group: 'Notícias', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/jovempannews.png' },
    { match: /cnn brasil|cnn/i, name: 'CNN Brasil HD', tvgId: 'CNNBrasil.br', group: 'Notícias', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/cnnbrasil.png' },
    { match: /globonews|globo news/i, name: 'GloboNews HD', tvgId: 'GloboNews.br', group: 'Notícias', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/globonews.png' },
    { match: /bbc/i, name: 'BBC News HD', tvgId: 'BBCNews.uk', group: 'Notícias', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/bbcnews.png' },
    { match: /euronews/i, name: 'Euronews PT HD', tvgId: 'Euronews.pt', group: 'Notícias', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/euronews.png' },
    { match: /bloomberg/i, name: 'Bloomberg TV HD', tvgId: 'Bloomberg.us', group: 'Notícias', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/bloomberg.png' },
    { match: /al jazeera|aljazeera/i, name: 'Al Jazeera English HD', tvgId: 'AlJazeera.qa', group: 'Notícias', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/aljazeera.png' },

    // Esportes
    { match: /caze\s*tv|cazé\s*tv/i, name: 'CazéTV HD', tvgId: 'CazeTV.br', group: 'Esportes', logo: 'https://yt3.googleusercontent.com/tHqX1p2b-Nq0M1uC169X1N8tT1mI9_1s3l8G6Lz4v=s900-c-k-c0x00ffffff-no-rj' },
    { match: /red bull|redbull/i, name: 'Red Bull TV HD', tvgId: 'RedBullTV.at', group: 'Esportes', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/redbulltv.png' },
    { match: /espn/i, name: 'ESPN HD', tvgId: 'ESPN.br', group: 'Esportes', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/espn.png' },
    { match: /sportv/i, name: 'SporTV HD', tvgId: 'SporTV.br', group: 'Esportes', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/sportv.png' },
    { match: /premiere/i, name: 'Premiere Clubes HD', tvgId: 'Premiere.br', group: 'Esportes', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/premiere.png' },
    { match: /bandsports|band sports/i, name: 'BandSports HD', tvgId: 'BandSports.br', group: 'Esportes', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/bandsports.png' },
    { match: /fifa/i, name: 'FIFA+ TV HD', tvgId: 'FIFAPlus.ch', group: 'Esportes', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/fifaplus.png' },
    { match: /combate/i, name: 'Canal Combate HD', tvgId: 'Combate.br', group: 'Esportes', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/combate.png' },

    // Infantil / Kids
    { match: /turma da monica|monica/i, name: 'Turma da Mônica TV', tvgId: 'TurmaMonica.br', group: 'Infantil', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/turmadamonica.png' },
    { match: /galinha pintadinha/i, name: 'Galinha Pintadinha 24h', tvgId: 'GalinhaPintadinha.br', group: 'Infantil', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/galinhapintadinha.png' },
    { match: /cartoon|cartoon network/i, name: 'Cartoon Network HD', tvgId: 'CartoonNetwork.br', group: 'Infantil', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/cartoonnetwork.png' },
    { match: /discovery kids/i, name: 'Discovery Kids HD', tvgId: 'DiscoveryKids.br', group: 'Infantil', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/discoverykids.png' },
    { match: /nickelodeon|nick/i, name: 'Nickelodeon HD', tvgId: 'Nickelodeon.br', group: 'Infantil', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/nickelodeon.png' },
    { match: /moonbug|pocoyo/i, name: 'Kids TV Brasil HD', tvgId: 'KidsTV.br', group: 'Infantil', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/kidstv.png' },

    // Documentários, Natureza & Ciência
    { match: /discovery channel|discovery/i, name: 'Discovery Channel HD', tvgId: 'Discovery.br', group: 'Documentários', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/discovery.png' },
    { match: /national geographic|nat geo/i, name: 'National Geographic HD', tvgId: 'NatGeo.br', group: 'Documentários', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/natgeo.png' },
    { match: /history/i, name: 'History Channel HD', tvgId: 'History.br', group: 'Documentários', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/history.png' },
    { match: /nasa/i, name: 'NASA TV UHD 4K', tvgId: 'NASATV.us', group: 'Natureza & Ciência', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/nasatv.png' },
    { match: /lofi|lo-fi/i, name: 'Lofi Girl Beats 24/7', tvgId: 'LofiGirl.us', group: 'Música & Relax', logo: 'https://yt3.googleusercontent.com/ytc/AIdro_nkp_P-T-JtW27-Rk2VbW5qV-169X1N8tT1mI9=s900-c-k-c0x00ffffff-no-rj' },

    // Música & Rádios HD
    { match: /vevo|mtv/i, name: 'MTV / Vevo Music HD', tvgId: 'MTV.br', group: 'Música', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/mtv.png' },
    { match: /clubbing|lounge/i, name: 'Clubbing TV HD', tvgId: 'ClubbingTV.fr', group: 'Música', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/clubbingtv.png' },
    { match: /antena 1|antena1/i, name: 'Rádio Antena 1 FM HD', tvgId: 'Antena1.br', group: 'Rádios', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/antena1.png' },
    { match: /alpha fm|alphafm/i, name: 'Rádio Alpha FM HD', tvgId: 'AlphaFM.br', group: 'Rádios', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/alphafm.png' },
    { match: /89|radio rock|rádio rock/i, name: '89 FM A Rádio Rock', tvgId: '89RadioRock.br', group: 'Rádios', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/89radiorock.png' },
    { match: /kiss fm|kissfm/i, name: 'Kiss FM Rock HD', tvgId: 'KissFM.br', group: 'Rádios', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/kissfm.png' },
    { match: /cbn/i, name: 'Rádio CBN FM/AM HD', tvgId: 'CBN.br', group: 'Rádios', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/cbn.png' },
    { match: /metropolitana/i, name: 'Metropolitana FM HD', tvgId: 'Metropolitana.br', group: 'Rádios', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/metropolitana.png' },
    { match: /novabrasil|nova brasil/i, name: 'NovaBrasil FM HD', tvgId: 'NovaBrasil.br', group: 'Rádios', logo: 'https://raw.githubusercontent.com/iptv-org/epg/master/sites/meuguia.tv/novabrasil.png' }
];

class M3UEnricher {
    /**
     * Clean and format a channel name
     */
    cleanChannelName(rawName) {
        if (!rawName) return 'Canal Sem Nome';
        let name = rawName;

        // Remove typical IPTV clutter prefix/suffixes: [BR], (BR), [FHD], [HD], [4K], [HEVC], VIP -, | BR |
        name = name.replace(/^(\[[^\]]+\]|\([^\)]+\)|[\|\-\s]+)+/g, '');
        name = name.replace(/(\[[^\]]+\]|\([^\)]+\)|[\|\-\s]+)+$/g, '');
        name = name.replace(/\b(1080p|720p|4k|fhd|uhd|hevc|h265|sd|br|brasil)\b/gi, '');
        name = name.replace(/\s{2,}/g, ' ').trim();

        return name || rawName;
    }

    /**
     * Enrich a single channel object with matching metadata
     */
    enrichChannel(channel) {
        if (!channel) return channel;
        const searchTarget = `${channel.name || ''} ${channel.tvgName || ''} ${channel.tvgId || ''}`.trim();

        for (const item of CHANNEL_DICTIONARY) {
            if (item.match.test(searchTarget)) {
                if (!channel.logo || channel.logo.includes('placeholder')) {
                    channel.logo = item.logo;
                }
                if (!channel.tvgId) {
                    channel.tvgId = item.tvgId;
                }
                if (!channel.group || channel.group === 'Geral' || channel.group === 'Undefined' || channel.group === 'TV Aberta') {
                    channel.group = item.group;
                }
                break;
            }
        }

        // Auto-classify stream type if not set
        if (!channel.streamType) {
            const grp = (channel.group || '').toLowerCase();
            const nm = (channel.name || '').toLowerCase();
            if (grp.includes('filme') || grp.includes('vod') || grp.includes('cinema') || nm.includes('filme') || nm.includes('movie')) {
                channel.streamType = 'vod';
            } else if (grp.includes('série') || grp.includes('series') || /(?:s\d{1,2}e\d{1,2}|temporada)/i.test(nm)) {
                channel.streamType = 'series';
            } else {
                channel.streamType = 'live';
            }
        }

        return channel;
    }

    /**
     * Enrich a list of channels
     */
    enrichChannels(channels) {
        if (!Array.isArray(channels)) return [];
        return channels.map(ch => this.enrichChannel(ch));
    }
}

module.exports = new M3UEnricher();
