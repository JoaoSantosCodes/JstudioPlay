const axios = require('axios');

async function testN8nIntegration() {
    const base = 'http://localhost:3000';
    const apiKey = 'm3u_secret_key_889922aabbcc';

    console.log('=== TESTANDO INTEGRAÇÃO E FLUXOS N8N ===\n');

    try {
        // 1. Test Stats Endpoint with API Key
        console.log('1. Testando GET /api/webhooks/stats com X-API-Key...');
        const statsRes = await axios.get(`${base}/api/webhooks/stats`, {
            headers: { 'X-API-Key': apiKey }
        });
        console.log('   [OK] Resposta Stats:', statsRes.data.counts);

        // 2. Test Provision User (Workflow 3)
        console.log('\n2. Testando POST /api/webhooks/provision-user (Provisionamento de Cliente)...');
        const userRes = await axios.post(`${base}/api/webhooks/provision-user`, {
            name: 'Cliente Teste n8n',
            username: 'cliente_n8n_test',
            password: 'senha_segura_123',
            email: 'cliente@teste.com',
            daysValid: 15
        }, {
            headers: { 'X-API-Key': apiKey }
        });
        console.log('   [OK] Cliente criado com sucesso!');
        console.log('   [OK] Usuário:', userRes.data.user.username);
        console.log('   [OK] Expira em:', userRes.data.user.expiresAt);
        console.log('   [OK] Credenciais retornadas:', userRes.data.loginCredentials);

        // 3. Test Webhook Validate (Workflow 2)
        console.log('\n3. Testando POST /api/webhooks/validate (Validador n8n)...');
        const valRes = await axios.post(`${base}/api/webhooks/validate`, {
            url: 'https://iptv-org.github.io/iptv/countries/br.m3u',
            name: 'Lista Importada via n8n',
            concurrency: 5,
            timeout: 2500
        }, {
            headers: { 'X-API-Key': apiKey }
        });
        console.log('   [OK] Validação disparada pelo n8n:', valRes.data);

        console.log('\n====================================================');
        console.log('✅ TODOS OS ENDPOINTS DO N8N FUNCIONARAM COM SUCESSO!');
        console.log('====================================================');
    } catch (e) {
        console.error('Erro no teste do n8n:', e.message, e.response?.data);
    }
}

testN8nIntegration();
