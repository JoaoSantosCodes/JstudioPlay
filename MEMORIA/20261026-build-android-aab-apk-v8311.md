# 📱 Registro Técnico Zettelkasten: Compilação Android (AAB & APK) (v8.3.11)

- **Data / Timestamp:** 2026-10-26T13:16:00-03:00
- **Versão do Sistema:** `v8.3.11`
- **Autor / Agente:** Antigravity (Protocolo Canônico de Governança Multi-Agente)
- **Tags:** `#android` `#capacitor` `#aab` `#apk` `#mobile-build` `#zettelkasten`

---

## 1. Contexto & Solicitação do Usuário

O usuário solicitou o pacote Android (**AAB / APK**) para testes práticos no celular com todas as melhorias e refinamentos visuais da versão **v8.3.11**:
- Layout da TopBar despoluído (sem badge excessivo de lista ativa);
- Player de vídeo VOD em 100% da tela (sem coluna preta espremendo a reprodução);
- Botão de Favoritar com ícone de coração e glow carmesim no modal de detalhes.

---

## 2. Processo de Build & Configuração Nativa

1. **Sincronização Capacitor:**
   - Adicionada a plataforma Android via `@capacitor/cli` v8.5.3 e `@capacitor/android` v8.5.2.
   - Sincronização dos assets web compilados (`public/`) para `android/app/src/main/assets/public`.
2. **Ajuste de Permissões de Rede:**
   - Em [AndroidManifest.xml](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/android/app/src/main/AndroidManifest.xml), habilitado `android:usesCleartextTraffic="true"` para permitir streams HTTP IPTV sem bloqueio pelo Network Security Config do Android.
   - Configurado `android/local.properties` apontando para o SDK Android oficial em `C:\Users\joaoc\AppData\Local\Android\Sdk`.
3. **Compilação Gradle com Java 21 (JBR):**
   - Utilizado o JDK 21 oficial do Android Studio (`jbr/bin`) com Gradle 8.14.3.
   - Executados os targets `bundleDebug` e `assembleDebug` gerando pacotes assinados para depuração e testes.

---

## 3. Artefatos Gerados & Disponíveis

Os binários foram organizados na pasta de distribuição [dist-android](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/dist-android/):

| Formato | Arquivo | Tamanho | Finalidade |
|---|---|---|---|
| **AAB** (Android App Bundle) | [JstudioPlay-v8.3.11.aab](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/dist-android/JstudioPlay-v8.3.11.aab) | **4.1 MB** | Padrão Google Play Store / Internal App Sharing |
| **APK** (Instalador Direto) | [JstudioPlay-v8.3.11.apk](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/dist-android/JstudioPlay-v8.3.11.apk) | **4.6 MB** | Instalação direta no celular / emulador (Sideload) |
