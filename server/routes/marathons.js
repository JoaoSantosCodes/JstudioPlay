/**
 * JstudioPlay Pro — Rotas REST de Maratonas Narrativas & Sagas Cronológicas
 * Versão: v8.2.0
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth, requireMaster } = require('../security');

/**
 * GET /api/marathons/curated
 * Retorna as maratonas oficiais com resumo e preview de itens
 */
router.get('/curated', (req, res) => {
    try {
        const marathons = db.getCuratedMarathons();
        res.json({
            total: marathons.length,
            data: marathons
        });
    } catch (err) {
        console.error('[MARATHONS] Erro ao listar maratonas:', err);
        res.status(500).json({ error: 'Erro ao carregar maratonas narrativas.' });
    }
});

/**
 * GET /api/marathons
 * Alias para /curated
 */
router.get('/', (req, res) => {
    try {
        const marathons = db.getCuratedMarathons();
        res.json({
            total: marathons.length,
            data: marathons
        });
    } catch (err) {
        console.error('[MARATHONS] Erro ao listar maratonas:', err);
        res.status(500).json({ error: 'Erro ao carregar maratonas narrativas.' });
    }
});

/**
 * GET /api/marathons/:id
 * Retorna os detalhes de uma maratona específica com seus itens ordenados
 */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const marathon = db.getMarathonById(id);

        if (!marathon) {
            return res.status(404).json({ error: 'Maratona narrativa não encontrada.' });
        }

        res.json(marathon);
    } catch (err) {
        console.error('[MARATHONS] Erro ao buscar maratona:', err);
        res.status(500).json({ error: 'Erro interno ao buscar maratona.' });
    }
});

/**
 * POST /api/marathons
 * Cria uma nova maratona narrativa
 */
router.post('/', (req, res) => {
    try {
        const { title, description, slug, badge, coverUrl, cover_url, isCurated, is_curated, isPublic, is_public } = req.body;

        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ error: 'O título da maratona é obrigatório.' });
        }

        const created = db.createMarathon({
            title: title.trim(),
            description: (description || '').trim(),
            slug: slug ? slug.trim() : undefined,
            badge: badge ? badge.trim() : undefined,
            coverUrl: coverUrl || cover_url,
            isCurated: isCurated !== undefined ? isCurated : is_curated,
            isPublic: isPublic !== undefined ? isPublic : is_public,
            createdBy: req.user ? req.user.username : 'user_active'
        });

        res.status(201).json(created);
    } catch (err) {
        console.error('[MARATHONS] Erro ao criar maratona:', err);
        res.status(500).json({ error: 'Erro ao criar maratona narrativa.' });
    }
});

/**
 * PUT /api/marathons/:id
 * Atualiza metadados da maratona
 */
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const updated = db.updateMarathon(id, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Maratona não encontrada.' });
        }
        res.json(updated);
    } catch (err) {
        console.error('[MARATHONS] Erro ao atualizar maratona:', err);
        res.status(500).json({ error: 'Erro ao atualizar maratona.' });
    }
});

/**
 * DELETE /api/marathons/:id
 * Remove a maratona
 */
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const deleted = db.deleteMarathon(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Maratona não encontrada.' });
        }
        res.json({ message: 'Maratona removida com sucesso.' });
    } catch (err) {
        console.error('[MARATHONS] Erro ao excluir maratona:', err);
        res.status(500).json({ error: 'Erro ao excluir maratona.' });
    }
});

/**
 * POST /api/marathons/:id/items
 * Adiciona um título à maratona na sequência narrativa
 */
router.post('/:id/items', (req, res) => {
    try {
        const { id: marathonId } = req.params;
        const marathon = db.getMarathonById(marathonId);
        if (!marathon) {
            return res.status(404).json({ error: 'Maratona não encontrada.' });
        }

        const { title, streamUrl, stream_url } = req.body;
        if (!title || (!streamUrl && !stream_url)) {
            return res.status(400).json({ error: 'Título e URL de transmissão (streamUrl) são obrigatórios.' });
        }

        const item = db.addMarathonItem(marathonId, req.body);
        res.status(201).json(item);
    } catch (err) {
        console.error('[MARATHONS] Erro ao adicionar item na maratona:', err);
        res.status(500).json({ error: 'Erro ao adicionar item na maratona.' });
    }
});

/**
 * PUT /api/marathons/:id/reorder
 * Reordenação em lote (Drag & Drop)
 * Payload: { items: [ { id: "pi_1", order_index: 1 }, ... ] }
 */
router.put('/:id/reorder', (req, res) => {
    try {
        const { id: marathonId } = req.params;
        const marathon = db.getMarathonById(marathonId);
        if (!marathon) {
            return res.status(404).json({ error: 'Maratona não encontrada.' });
        }

        const { items } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Envie um array 'items' com { id, order_index }." });
        }

        const updatedItems = db.reorderMarathonItems(marathonId, items);
        res.json({
            message: 'Sequência narrativa da maratona atualizada com sucesso.',
            items: updatedItems
        });
    } catch (err) {
        console.error('[MARATHONS] Erro ao reordenar maratona:', err);
        res.status(500).json({ error: 'Erro ao reordenar maratona.' });
    }
});

/**
 * DELETE /api/marathons/:id/items/:itemId
 * Remove um item da maratona e reajusta automaticamente a sequência
 */
router.delete('/:id/items/:itemId', (req, res) => {
    try {
        const { id: marathonId, itemId } = req.params;
        const marathon = db.getMarathonById(marathonId);
        if (!marathon) {
            return res.status(404).json({ error: 'Maratona não encontrada.' });
        }

        const remaining = db.removeMarathonItem(marathonId, itemId);
        if (!remaining) {
            return res.status(404).json({ error: 'Item não encontrado nesta maratona.' });
        }

        res.json({
            message: 'Item removido com sucesso e sequência narrativa reajustada.',
            items: remaining
        });
    } catch (err) {
        console.error('[MARATHONS] Erro ao remover item da maratona:', err);
        res.status(500).json({ error: 'Erro ao remover item da maratona.' });
    }
});

/**
 * GET /api/marathons/:slug/export.m3u
 * Rota de exportação M3U: gera playlist padronizada com prefixo 01., 02.
 */
router.get('/:slug/export.m3u', (req, res) => {
    try {
        const { slug } = req.params;
        const marathon = db.getMarathonById(slug);

        if (!marathon) {
            return res.status(404).send('#EXTM3U\n# Maratona não encontrada.');
        }

        let m3uContent = `#EXTM3U\n# Maratona JstudioPlay: ${marathon.title}\n`;
        m3uContent += `# Descrição: ${marathon.description}\n`;
        m3uContent += `# Total de títulos: ${marathon.totalItems}\n\n`;

        marathon.items.forEach(item => {
            const padIndex = String(item.orderIndex).padStart(2, '0');
            const displayTitle = `${padIndex}. ${item.title}${item.year ? ` (${item.year})` : ''}`;
            const groupTitle = `Maratona - ${marathon.title}`;
            const tvgLogo = item.posterUrl || '';
            const tvgId = item.mediaId || '';

            m3uContent += `#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${displayTitle}" tvg-logo="${tvgLogo}" group-title="${groupTitle}",${displayTitle}\n`;
            m3uContent += `${item.streamUrl}\n\n`;
        });

        res.setHeader('Content-Type', 'application/x-mpegurl; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${marathon.slug || 'maratona'}.m3u"`);
        res.send(m3uContent);
    } catch (err) {
        console.error('[MARATHONS] Erro ao exportar M3U:', err);
        res.status(500).send('#EXTM3U\n# Erro ao exportar maratona.');
    }
});

module.exports = router;
