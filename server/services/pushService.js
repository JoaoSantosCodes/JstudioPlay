/**
 * JstudioPlay Pro — Web Push Service
 *
 * Usa a API nativa Web Push (VAPID) para enviar notificações push
 * a dispositivos cadastrados. Não depende de biblioteca externa —
 * usa o módulo `web-push` do npm se disponível; caso contrário,
 * registra aviso e opera em modo silencioso (graceful degradation).
 *
 * Variáveis de ambiente necessárias (CREDENCIAIS/.env):
 *   VAPID_PUBLIC_KEY   — chave pública VAPID (base64url)
 *   VAPID_PRIVATE_KEY  — chave privada VAPID (base64url)
 *   VAPID_SUBJECT      — mailto: ou URL do remetente
 */

let webpush = null;
let vapidReady = false;

try {
    webpush = require('web-push');
    const pub  = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const subj = process.env.VAPID_SUBJECT || 'mailto:admin@jstudioplay.com.br';

    if (pub && priv) {
        webpush.setVapidDetails(subj, pub, priv);
        vapidReady = true;
        console.log('[Push] VAPID configurado. Web Push ativo.');
    } else {
        console.warn('[Push] VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY ausentes. Push desativado.');
    }
} catch {
    console.warn('[Push] Módulo web-push não instalado. Push desativado. Execute: npm install web-push');
}

/**
 * Envia uma notificação push para uma subscription específica.
 * @param {{ endpoint, keys_p256, keys_auth }} sub  — linha da tabela push_subscriptions
 * @param {{ title, body, icon, data }}        payload
 * @returns {Promise<boolean>}
 */
async function sendToSubscription(sub, payload) {
    if (!vapidReady || !webpush) return false;
    const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys_p256, auth: sub.keys_auth },
    };
    try {
        await webpush.sendNotification(pushSub, JSON.stringify(payload));
        return true;
    } catch (err) {
        // 410 = subscription expired/unregistered
        if (err.statusCode === 410) return 'expired';
        console.warn('[Push] Falha ao enviar notificação:', err.message);
        return false;
    }
}

/**
 * Envia notificação para todos os dispositivos de um usuário.
 * Remove automaticamente subscriptions expiradas.
 * @param {import('../db/database')} db
 * @param {string}                   userId
 * @param {{ title, body, icon?, data? }} payload
 */
async function notifyUser(db, userId, payload) {
    if (!vapidReady) return;
    const subs = db.getPushSubscriptionsByUser(userId);
    for (const sub of subs) {
        const result = await sendToSubscription(sub, payload);
        if (result === 'expired') {
            db.deletePushSubscription(userId, sub.endpoint);
        }
    }
}

/**
 * Envia notificação para todos os usuários com papel `master` ou `admin`.
 */
async function notifyAdmins(db, payload) {
    if (!vapidReady) return;
    const allSubs = db.getAllPushSubscriptions();
    for (const sub of allSubs) {
        const user = db.findUserById(sub.user_id);
        if (!user || !['master', 'admin'].includes(user.role)) continue;
        const result = await sendToSubscription(sub, payload);
        if (result === 'expired') db.deletePushSubscription(sub.user_id, sub.endpoint);
    }
}

/**
 * Retorna a chave pública VAPID para o frontend registrar subscriptions.
 */
function getVapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY || null;
}

module.exports = { sendToSubscription, notifyUser, notifyAdmins, getVapidPublicKey, isReady: () => vapidReady };
