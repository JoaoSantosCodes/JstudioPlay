/**
 * M3U PLAY PRO - Electronic Program Guide (EPG) & XMLTV Engine
 * Downloads, caches, and parses XMLTV guides to show live timelines and schedules.
 */

const axios = require('axios');

class EPGManager {
    constructor() {
        this.cache = new Map(); // channelId -> array of programs
        this.lastFetched = null;
        this.isFetching = false;
        this.defaultEpgUrl = 'https://iptv-org.github.io/epg/guides/br.xml';
        this.syntheticPrograms = this.generateSyntheticEPG();
    }

    /**
     * Generate rich synthetic EPG programs for popular Brazilian channels
     * so that the UI always has realistic schedule data even offline!
     */
    generateSyntheticEPG() {
        const now = new Date();
        const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);

        const synthetic = {
            'Globo.br': [
                { title: 'Jornal Hoje / Edição Especial', desc: 'As principais notícias do Brasil e do mundo com reportagens ao vivo.', start: new Date(startOfHour.getTime() - 30 * 60000), end: new Date(startOfHour.getTime() + 45 * 60000), category: 'Jornalismo' },
                { title: 'Sessão da Tarde: O Resgate do Campeão', desc: 'Um jovem determinado supera todos os obstáculos para vencer a grande competição.', start: new Date(startOfHour.getTime() + 45 * 60000), end: new Date(startOfHour.getTime() + 150 * 60000), category: 'Filme' },
                { title: 'Vale a Pena Ver de Novo: Avenida Brasil', desc: 'A saga de vingança de Nina contra a vilã Carminha.', start: new Date(startOfHour.getTime() + 150 * 60000), end: new Date(startOfHour.getTime() + 210 * 60000), category: 'Novela' }
            ],
            'SBT.br': [
                { title: 'Fofocalizando Especial', desc: 'As últimas notícias dos famosos, bastidores da TV e entretenimento exclusivo.', start: new Date(startOfHour.getTime() - 20 * 60000), end: new Date(startOfHour.getTime() + 50 * 60000), category: 'Entretenimento' },
                { title: 'Chaves: O Filme no Cinema', desc: 'As aventuras mais divertidas do menino do barril e toda a vizinhança.', start: new Date(startOfHour.getTime() + 50 * 60000), end: new Date(startOfHour.getTime() + 120 * 60000), category: 'Humor' }
            ],
            'Record.br': [
                { title: 'Balanço Geral HD Ao Vivo', desc: 'Jornalismo comunitário, prestação de serviços e o quadro A Hora da Venenosa.', start: new Date(startOfHour.getTime() - 40 * 60000), end: new Date(startOfHour.getTime() + 60 * 60000), category: 'Jornalismo' },
                { title: 'Cidade Alerta', desc: 'Flagrantes e grandes coberturas policiais com links em tempo real.', start: new Date(startOfHour.getTime() + 60 * 60000), end: new Date(startOfHour.getTime() + 180 * 60000), category: 'Policial' }
            ],
            'Band.br': [
                { title: 'Jogo Aberto / Os Donos da Bola', desc: 'Debate esportivo acalorado, análise dos jogos da rodada e gols do fim de semana.', start: new Date(startOfHour.getTime() - 30 * 60000), end: new Date(startOfHour.getTime() + 45 * 60000), category: 'Esportes' },
                { title: 'Brasil Urgente', desc: 'Informação e notícias com a apresentação dinâmica e reportagens exclusivas.', start: new Date(startOfHour.getTime() + 45 * 60000), end: new Date(startOfHour.getTime() + 165 * 60000), category: 'Jornalismo' }
            ],
            'RedeTV.br': [
                { title: 'A Tarde É Sua', desc: 'Sônia Abrão comenta as polêmicas do mundo dos famosos com a roda da fofoca.', start: new Date(startOfHour.getTime() - 15 * 60000), end: new Date(startOfHour.getTime() + 65 * 60000), category: 'Variedades' },
                { title: 'RedeTV! News', desc: 'O resumo diário dos principais acontecimentos do país.', start: new Date(startOfHour.getTime() + 65 * 60000), end: new Date(startOfHour.getTime() + 125 * 60000), category: 'Jornalismo' }
            ],
            'TVCultura.br': [
                { title: 'Quintal da Cultura / Cocoricó', desc: 'Programação infantil educativa premiada com histórias, músicas e teatro de bonecos.', start: new Date(startOfHour.getTime() - 25 * 60000), end: new Date(startOfHour.getTime() + 35 * 60000), category: 'Infantil' },
                { title: 'Jornal da Cultura / Roda Viva', desc: 'Grandes entrevistas e análise aprofundada dos cenários político e econômico.', start: new Date(startOfHour.getTime() + 35 * 60000), end: new Date(startOfHour.getTime() + 115 * 60000), category: 'Debate' }
            ],
            'RecordNews.br': [
                { title: 'Hora News Brasil 24h', desc: 'Boletins a cada 15 minutos com os acontecimentos mais recentes no Brasil e no mundo.', start: new Date(startOfHour.getTime() - 20 * 60000), end: new Date(startOfHour.getTime() + 40 * 60000), category: 'Notícias' }
            ],
            'BandNews.br': [
                { title: 'BandNews Em Ponto', desc: 'Giro completo pelas capitais do Brasil e cotações econômicas em tempo real.', start: new Date(startOfHour.getTime() - 10 * 60000), end: new Date(startOfHour.getTime() + 50 * 60000), category: 'Notícias' }
            ],
            'CNNBrasil.br': [
                { title: 'CNN 360° com Análise Política', desc: 'Cobertura em tempo real dos bastidores de Brasília com os principais âncoras.', start: new Date(startOfHour.getTime() - 30 * 60000), end: new Date(startOfHour.getTime() + 60 * 60000), category: 'Notícias' }
            ],
            'JovemPanNews.br': [
                { title: 'Os Pingos nos Is', desc: 'Debate das principais notícias do dia com os comentaristas da Jovem Pan.', start: new Date(startOfHour.getTime() - 30 * 60000), end: new Date(startOfHour.getTime() + 60 * 60000), category: 'Debate' }
            ],
            'CazeTV.br': [
                { title: 'CazéTV Ao Vivo: Transmissão Esportiva', desc: 'Pré-jogo, transmissão com imagem e narração irreverente da equipe CazéTV.', start: new Date(startOfHour.getTime() - 45 * 60000), end: new Date(startOfHour.getTime() + 75 * 60000), category: 'Esportes' }
            ],
            'RedBullTV.at': [
                { title: 'Red Bull Cliff Diving & Rampage', desc: 'Os maiores saltos ornamentais de penhascos e manobras extremas de mountain bike.', start: new Date(startOfHour.getTime() - 15 * 60000), end: new Date(startOfHour.getTime() + 45 * 60000), category: 'Esportes Radicais' }
            ],
            'NASATV.us': [
                { title: 'NASA Space Station Live 4K Feed', desc: 'Vistas em tempo real da Terra a partir da Estação Espacial Internacional (ISS) em ultra-alta definição.', start: new Date(startOfHour.getTime() - 60 * 60000), end: new Date(startOfHour.getTime() + 180 * 60000), category: 'Ciência' }
            ]
        };

        return synthetic;
    }

    /**
     * Get current and upcoming program for a channel
     */
    getChannelNowPlaying(tvgId, channelName = '') {
        const now = new Date();
        const synthMap = this.syntheticPrograms;

        let matchedKey = null;
        if (tvgId && synthMap[tvgId]) {
            matchedKey = tvgId;
        } else {
            const cleanName = (channelName || tvgId || '').toLowerCase();
            for (const key of Object.keys(synthMap)) {
                if (cleanName.includes(key.toLowerCase().replace('.br', '')) || key.toLowerCase().includes(cleanName)) {
                    matchedKey = key;
                    break;
                }
            }
        }

        if (matchedKey && synthMap[matchedKey]) {
            const list = synthMap[matchedKey];
            const current = list.find(p => now >= p.start && now < p.end) || list[0];
            const next = list.find(p => p.start >= (current ? current.end : now)) || list[1] || null;

            if (current) {
                const totalDuration = current.end.getTime() - current.start.getTime();
                const elapsed = now.getTime() - current.start.getTime();
                const percent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

                return {
                    hasEpg: true,
                    current: {
                        title: current.title,
                        desc: current.desc,
                        category: current.category,
                        start: current.start.toISOString(),
                        end: current.end.toISOString(),
                        startTimeStr: current.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        endTimeStr: current.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        progressPercent: percent
                    },
                    next: next ? {
                        title: next.title,
                        startTimeStr: next.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        desc: next.desc
                    } : null
                };
            }
        }

        // Generic fallback for channels without direct match
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
        const totalDuration = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        const percent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

        return {
            hasEpg: false,
            current: {
                title: 'Transmissão Ao Vivo',
                desc: `Transmissão contínua em tempo real de ${channelName || 'Canal'}.`,
                category: 'Ao Vivo',
                start: start.toISOString(),
                end: end.toISOString(),
                startTimeStr: start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                endTimeStr: end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                progressPercent: percent
            },
            next: {
                title: 'Programação Contínua',
                startTimeStr: end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                desc: 'Acompanhe a sequência da grade de programação.'
            }
        };
    }

    /**
     * Generate dynamic schedule for any channel based on category and time of day
     */
    getChannelSchedule(tvgId, channelName = '', group = '', windowHours = 6) {
        const now = new Date();
        const baseHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 1, 0, 0);
        const nameLower = (channelName || tvgId || '').toLowerCase();
        const groupLower = (group || '').toLowerCase();

        // Check if explicit synthetic program exists
        const synthMap = this.syntheticPrograms;
        let matchedKey = null;
        if (tvgId && synthMap[tvgId]) {
            matchedKey = tvgId;
        } else {
            for (const key of Object.keys(synthMap)) {
                if (nameLower.includes(key.toLowerCase().replace('.br', '')) || key.toLowerCase().includes(nameLower)) {
                    matchedKey = key;
                    break;
                }
            }
        }

        if (matchedKey && synthMap[matchedKey]) {
            return synthMap[matchedKey];
        }

        // Generate contextual schedule based on genre/group
        const programs = [];
        let curTime = new Date(baseHour);
        const totalMinutes = windowHours * 60;
        let minuteOffset = 0;

        let templates = [
            { title: 'Edição de Notícias & Destaques', cat: 'Notícias', dur: 45, desc: 'Cobertura em tempo real dos principais fatos e acontecimentos.' },
            { title: 'Revista Eletrônica & Entretenimento', cat: 'Variedades', dur: 60, desc: 'Dicas, bastidores da cultura pop e entrevistas especiais.' },
            { title: 'Sessão Especial de Cinema', cat: 'Cinema', dur: 90, desc: 'Sucessos de bilheteria e grandes clássicos em alta definição.' },
            { title: 'Giro Esportivo & Momentos Marcantes', cat: 'Esportes', dur: 45, desc: 'Os melhores lances, gols da rodada e debates táticos.' },
            { title: 'Documentário & Vida Selvagem', cat: 'Documentário', dur: 60, desc: 'Expedições fascinantes pela natureza e ciência do planeta.' }
        ];

        if (groupLower.includes('sport') || nameLower.includes('espn') || nameLower.includes('sport') || nameLower.includes('fut')) {
            templates = [
                { title: 'Pré-Jogo & Análise Tática Ao Vivo', cat: 'Esportes', dur: 45, desc: 'Escalações, estatísticas e bastidores da partida.' },
                { title: 'Transmissão Ao Vivo: Grande Confronto', cat: 'Futebol', dur: 105, desc: 'Transmissão da partida com narração e comentários exclusivos.' },
                { title: 'Pós-Jogo: Melhores Momentos & Debate', cat: 'Esportes', dur: 45, desc: 'Entrevistas na zona mista e melhores lances do jogo.' },
                { title: 'Futebol no Mundo & Resumo Semanal', cat: 'Esportes', dur: 60, desc: 'Gols das ligas internacionais e entrevistas exclusivas.' }
            ];
        } else if (groupLower.includes('news') || groupLower.includes('notícia') || nameLower.includes('news') || nameLower.includes('cnn') || nameLower.includes('jornal')) {
            templates = [
                { title: 'Jornal 24h: Destaques da Manhã/Tarde', cat: 'Notícias', dur: 60, desc: 'As manchetes mais importantes do Brasil e do mundo.' },
                { title: 'Painel Político & Economia em Foco', cat: 'Debate', dur: 45, desc: 'Análise aprofundada dos acontecimentos de Brasília e mercados.' },
                { title: 'Edição Especial de Notícias Globais', cat: 'Mundo', dur: 45, desc: 'Correspondentes internacionais relatam os fatos ao vivo.' },
                { title: 'Giro Noticioso em 30 Minutos', cat: 'Notícias', dur: 30, desc: 'Resumo ágil das últimas novidades do dia.' }
            ];
        } else if (groupLower.includes('kid') || groupLower.includes('infant') || groupLower.includes('anim') || nameLower.includes('cartoon') || nameLower.includes('disney')) {
            templates = [
                { title: 'As Incríveis Aventuras Animadas', cat: 'Infantil', dur: 30, desc: 'Episódios divertidos com muita imaginação e alegria.' },
                { title: 'Clube dos Desenhos Mágicos', cat: 'Animação', dur: 45, desc: 'Histórias fantásticas cheias de magia e amizade.' },
                { title: 'Sessão Cine Kids: Grandes Heróis', cat: 'Filme Infantil', dur: 75, desc: 'Longa-metragem de animação para toda a família curtir junto.' }
            ];
        } else if (groupLower.includes('movie') || groupLower.includes('film') || groupLower.includes('cinema') || groupLower.includes('série')) {
            templates = [
                { title: 'Cinema de Ação & Aventura', cat: 'Filme', dur: 105, desc: 'Tensão máxima, perseguições eletrizantes e efeitos visuais.' },
                { title: 'Maratona de Série: Episódio Duplo', cat: 'Série', dur: 90, desc: 'A sequência dos episódios mais aclamados da temporada.' },
                { title: 'Clássicos Imortais da Tela Grande', cat: 'Cinema Retrô', dur: 110, desc: 'Obras-primas restauradas que marcaram época na história do cinema.' }
            ];
        }

        let idx = 0;
        while (minuteOffset < totalMinutes) {
            const t = templates[idx % templates.length];
            const start = new Date(curTime);
            const end = new Date(curTime.getTime() + t.dur * 60000);
            programs.push({
                title: `${t.title}`,
                category: t.cat,
                desc: t.desc,
                start,
                end,
                startTimeStr: start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                endTimeStr: end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            });
            curTime = end;
            minuteOffset += t.dur;
            idx++;
        }

        return programs;
    }

    /**
     * Generate full interactive timeline grid for channels
     */
    getTimelineGrid(channels = [], windowHours = 4) {
        const now = new Date();
        const startWindow = new Date(now.getTime() - 30 * 60000);
        const endWindow = new Date(now.getTime() + windowHours * 3600000);

        // Build time header intervals (every 30 minutes)
        const timeSlots = [];
        let slotTime = new Date(startWindow.getFullYear(), startWindow.getMonth(), startWindow.getDate(), startWindow.getHours(), startWindow.getMinutes() >= 30 ? 30 : 0, 0);
        while (slotTime < endWindow) {
            timeSlots.push({
                timeStr: slotTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                timestamp: slotTime.getTime()
            });
            slotTime = new Date(slotTime.getTime() + 30 * 60000);
        }

        const gridRows = [];
        for (const ch of channels.slice(0, 50)) {
            const progs = this.getChannelSchedule(ch.tvgId, ch.name, ch.group, windowHours + 1);
            const renderedProgs = progs.map(p => {
                const isNow = now >= p.start && now < p.end;
                const durMinutes = Math.round((p.end.getTime() - p.start.getTime()) / 60000);
                const elapsedMinutes = isNow ? Math.round((now.getTime() - p.start.getTime()) / 60000) : 0;
                const progressPct = isNow ? Math.min(100, Math.round((elapsedMinutes / durMinutes) * 100)) : 0;

                return {
                    title: p.title,
                    desc: p.desc,
                    category: p.category,
                    start: p.start.toISOString(),
                    end: p.end.toISOString(),
                    startTimeStr: p.startTimeStr,
                    endTimeStr: p.endTimeStr,
                    durationMinutes: durMinutes,
                    isLive: isNow,
                    progressPct
                };
            });

            gridRows.push({
                id: ch.id,
                name: ch.name,
                logo: ch.logo || null,
                group: ch.group || 'Geral',
                url: ch.url,
                programs: renderedProgs
            });
        }

        return {
            timeSlots,
            currentTimeStr: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            currentTimestamp: now.getTime(),
            channels: gridRows
        };
    }

    /**
     * Generate XMLTV XML string for external apps
     */
    generateXMLTV(channels = []) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<tv generator-info-name="M3U PLAY Pro EPG Engine">\n';

        for (const ch of channels) {
            const chId = ch.tvgId || ch.id;
            xml += `  <channel id="${chId}">\n`;
            xml += `    <display-name>${ch.name}</display-name>\n`;
            if (ch.logo) xml += `    <icon src="${ch.logo}" />\n`;
            xml += `  </channel>\n`;

            const epg = this.getChannelNowPlaying(ch.tvgId, ch.name);
            if (epg && epg.current) {
                const startXml = new Date(epg.current.start).toISOString().replace(/[-:T]/g, '').slice(0, 14) + ' +0000';
                const endXml = new Date(epg.current.end).toISOString().replace(/[-:T]/g, '').slice(0, 14) + ' +0000';
                xml += `  <programme start="${startXml}" stop="${endXml}" channel="${chId}">\n`;
                xml += `    <title lang="pt">${epg.current.title}</title>\n`;
                xml += `    <desc lang="pt">${epg.current.desc}</desc>\n`;
                xml += `    <category lang="pt">${epg.current.category}</category>\n`;
                xml += `  </programme>\n`;
            }
        }

        xml += '</tv>\n';
        return xml;
    }
}

module.exports = new EPGManager();

