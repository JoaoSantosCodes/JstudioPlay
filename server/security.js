/**
 * M3U PLAY PRO v7.1 — Security, Auth & Rate Limiting Module
 * Provides hardened cryptographic authentication, rate-limiting, and RBAC guards.
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const BCRYPT_COST = 12;
const envFile = fs.existsSync(path.join(__dirname, '..', 'CREDENCIAIS', '.env'))
    ? path.join(__dirname, '..', 'CREDENCIAIS', '.env')
    : path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envFile });

class SecurityManager {
    constructor() {
        this.envPath = envFile;
        this.adminUsername = process.env.ADMIN_USERNAME || 'admin';
        this.adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        this.apiSecretKey = process.env.API_SECRET_KEY || this.generateSecureKey(32);
        this.sessionSecret = process.env.SESSION_SECRET || this.generateSecureKey(32);

        this.rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000;
        this.rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 180;

        this.ipRequestMap = new Map(); // ip -> [timestamps]
        this.activeSessions = new Map(); // token -> { userId, username, role, expiresAt }

        // ST-07: Limpeza periódica de sessões expiradas (a cada 1 hora)
        setInterval(() => this._cleanExpiredSessions(), 60 * 60 * 1000);
    }

    _cleanExpiredSessions() {
        const now = Date.now();
        for (const [token, payload] of this.activeSessions.entries()) {
            if (payload.expiresAt && now > payload.expiresAt) {
                this.activeSessions.delete(token);
            }
        }
    }

    generateSecureKey(bytes = 32) {
        return crypto.randomBytes(bytes).toString('hex');
    }

    hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    /**
     * Gera hash bcrypt (custo 12) — para novos usuários e migração lazy.
     */
    hashPasswordBcrypt(password) {
        return bcrypt.hashSync(password, BCRYPT_COST);
    }

    /**
     * Verifica senha contra hash legado SHA-256 ou bcrypt.
     * Retorna { valid: bool, needsUpgrade: bool }
     */
    verifyPassword(plain, storedHash, algo) {
        if (algo === 'bcrypt' || storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
            return { valid: bcrypt.compareSync(plain, storedHash), needsUpgrade: false };
        }
        // Legado SHA-256
        const sha = crypto.createHash('sha256').update(plain).digest('hex');
        return { valid: sha === storedHash, needsUpgrade: true };
    }

    createSessionToken(user) {
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role || 'user',
            issuedAt: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 3600 * 1000 // 7 days
        };

        const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = crypto.createHmac('sha256', this.sessionSecret).update(serialized).digest('base64url');
        const token = `${serialized}.${signature}`;

        this.activeSessions.set(token, payload);
        return token;
    }

    verifySessionToken(token) {
        if (!token || typeof token !== 'string' || !token.includes('.')) return null;
        const [serialized, signature] = token.split('.');

        const expectedSignature = crypto.createHmac('sha256', this.sessionSecret).update(serialized).digest('base64url');
        if (signature !== expectedSignature) return null;

        try {
            const payload = JSON.parse(Buffer.from(serialized, 'base64url').toString('utf8'));
            if (payload.expiresAt && Date.now() > payload.expiresAt) {
                this.activeSessions.delete(token);
                return null;
            }
            return payload;
        } catch (e) {
            return null;
        }
    }

    /**
     * Express Rate Limiting Middleware
     */
    rateLimiterMiddleware() {
        return (req, res, next) => {
            const ip = req.ip || req.connection.remoteAddress || 'unknown';
            const now = Date.now();

            if (!this.ipRequestMap.has(ip)) {
                this.ipRequestMap.set(ip, [now]);
                return next();
            }

            const timestamps = this.ipRequestMap.get(ip).filter(t => now - t < this.rateLimitWindowMs);
            if (timestamps.length >= this.rateLimitMaxRequests) {
                return res.status(429).json({
                    error: 'Muitas requisições. Limite de taxa excedido. Tente novamente em 1 minuto.',
                    retryAfterSeconds: Math.ceil((this.rateLimitWindowMs - (now - timestamps[0])) / 1000)
                });
            }

            timestamps.push(now);
            this.ipRequestMap.set(ip, timestamps);
            next();
        };
    }

    /**
     * Security Headers Middleware
     */
    securityHeadersMiddleware() {
        return (req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            next();
        };
    }

    /**
     * Middleware requiring valid API Key, Bearer Token or Session Cookie
     */
    requireAuth(db) {
        return (req, res, next) => {
            const authHeader = req.headers['authorization'];
            const apiKey = req.headers['x-api-key'] || req.query.api_key;
            let token = null;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7).trim();
            }

            // 1. Validate API Key (n8n, automation bots, CLI)
            if (apiKey && (apiKey === this.apiSecretKey || apiKey === db.getSettings().apiKey)) {
                req.isApiKey = true;
                req.user = db.data.users.find(u => u.role === 'admin') || db.data.users[0];
                return next();
            }

            // 2. Validate Session Token (Bearer)
            if (token) {
                const session = this.verifySessionToken(token);
                if (session) {
                    req.user = db.findUserById(session.id) || session;
                    return next();
                }
            }

            return res.status(401).json({ error: 'Acesso não autorizado. Forneça um token ou chave de API válida.' });
        };
    }

    /**
     * Middleware requiring Admin Role
     */
    requireAdmin() {
        return (req, res, next) => {
            if (req.user && req.user.role === 'admin') {
                return next();
            }
            return res.status(403).json({ error: 'Ação restrita a administradores do sistema.' });
        };
    }

    /**
     * Rotate API Secret Key dynamically and persist to .env
     */
    rotateApiKey() {
        const newKey = `m3u_sec_${this.generateSecureKey(24)}`;
        this.apiSecretKey = newKey;

        // Persist to env
        const envPath = this.envPath || path.join(__dirname, '..', '.env');
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            if (envContent.includes('API_SECRET_KEY=')) {
                envContent = envContent.replace(/API_SECRET_KEY=.*/g, `API_SECRET_KEY=${newKey}`);
            } else {
                envContent += `\nAPI_SECRET_KEY=${newKey}\n`;
            }
            fs.writeFileSync(envPath, envContent, 'utf8');
        }

        return newKey;
    }
}

module.exports = new SecurityManager();
