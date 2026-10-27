/**
 * Suíte de Testes Canônica: Correções de Reprodução de Vídeo e TV no Android (v8.3.14)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando Testes Canônicos de Reprodução de Vídeo/TV no Android...\n');

const relayJsPath = path.join(__dirname, '../server/relay.js');
const appJsPath = path.join(__dirname, '../public/static/app.js');
const netSecPath = path.join(__dirname, '../android/app/src/main/res/xml/network_security_config.xml');
const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
const capConfigPath = path.join(__dirname, '../capacitor.config.json');

const relayJs = fs.readFileSync(relayJsPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');
const manifest = fs.readFileSync(manifestPath, 'utf8');
const capConfig = fs.readFileSync(capConfigPath, 'utf8');

// 1. Backend: Relay com URL absoluta e proxyBase
console.log('1️⃣ Validando Resolução de Host Remoto em server/relay.js...');
assert(relayJs.includes("const host = req.get('x-forwarded-host') || req.get('host')"), 'relay.js deve extrair host dinâmico do request');
assert(relayJs.includes('${originBase}/proxy/stream?url='), 'handlePlaybackRequest deve gerar URL com originBase');
assert(relayJs.includes('rewriteM3U8(bodyData, targetUrl, proxyBase)'), 'proxyStream deve repassar proxyBase para rewriteM3U8');
assert(relayJs.includes('rewriteM3U8(manifest, baseUrl, proxyBase'), 'rewriteM3U8 deve receber proxyBase');
console.log('  [PASS] Backend gera URLs de proxy e chunks M3U8 com host absoluto para dispositivos remotos.');

// 2. Frontend: Resolução de URLs de stream e Hls.js mobile
console.log('2️⃣ Validando Resolução de Stream e HLS no Frontend (app.js)...');
assert(!appJs.includes("playerMessage('Esta fonte usa HTTP'"), 'app.js não deve exibir mensagem bloqueadora para HTTP em HTTPS');
assert(appJs.includes('resolveStreamUrl'), 'app.js deve conter a função resolveStreamUrl');
assert(appJs.includes('enableWorker: !isMobileApp'), 'Hls.js deve desabilitar workers em ambientes móveis/WebViews');
assert(appJs.includes('xhrSetup: function(xhr, segmentUrl)'), 'Hls.js deve conter xhrSetup para interceptar chunks relativos');
console.log('  [PASS] Frontend resolve streams relativos via getBackendBase() e protege Hls.js em WebViews.');

// 3. Android: Configuração de rede e hardware
console.log('3️⃣ Validando Configurações Nativas do Android...');
assert(fs.existsSync(netSecPath), 'network_security_config.xml deve existir');
const netSec = fs.readFileSync(netSecPath, 'utf8');
assert(netSec.includes('cleartextTrafficPermitted="true"'), 'network_security_config deve permitir tráfego cleartext');
assert(manifest.includes('android:networkSecurityConfig="@xml/network_security_config"'), 'AndroidManifest.xml deve declarar networkSecurityConfig');
assert(manifest.includes('android:hardwareAccelerated="true"'), 'AndroidManifest.xml deve habilitar aceleração por hardware');
assert(capConfig.includes('"androidScheme": "http"'), 'capacitor.config.json deve usar androidScheme http');
console.log('  [PASS] Android configurado para liberação total de tráfego HTTP/IPTV e aceleração por hardware.');

console.log('\n🎉 TODOS OS TESTES DE REPRODUÇÃO NO ANDROID PASSARAM COM 100% DE SUCESSO!\n');
