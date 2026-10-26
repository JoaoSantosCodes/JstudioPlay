# 🏛️ Zettelkasten: Keystore de Release Definitiva & Migração de Pacote Android (v8.3.11)

- **Data:** 2026-10-26
- **Status:** Concluído / Aprovado
- **Pacote:** `br.com.jstudioplay.app`
- **Versão:** `8.3.11` (versionCode 1)
- **Tags:** #android #keystore #release #google-play #aab #apk #security

---

## 1. Contexto e Diagnóstico

Durante a tentativa de upload do bundle anterior no Google Play Console para o pacote `com.jstudioplay.app`, o console retornou conflito de chave de upload (SHA1 incompatível entre a build debug e uma assinatura anterior registrada). Optou-se pela criação de um aplicativo limpo com identificador empresarial nacional exclusivo `br.com.jstudioplay.app` e geração de uma Keystore de Produção permanente.

---

## 2. Implementação Técnica

### 2.1 Keystore de Produção Definitiva
- **Arquivo:** `android/app/jstudioplay-release.jks`
- **Backup Protegido:** `CREDENCIAIS/jstudioplay-release.jks`
- **Alias:** `jstudioplay`
- **Algoritmo:** RSA 2048 bit / SHA384withRSA
- **Validade:** 10.000 dias (até 2054)
- **Distinguished Name:** `CN=JstudioPlay, OU=Mobile, O=JstudioPlay, L=SaoPaulo, ST=SP, C=BR`

### 2.2 Configuração do Gradle (`android/app/build.gradle`)
```groovy
signingConfigs {
    release {
        storeFile file('jstudioplay-release.jks')
        storePassword 'jstudioplay2026'
        keyAlias 'jstudioplay'
        keyPassword 'jstudioplay2026'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### 2.3 Sincronização de Identificadores
- `capacitor.config.json`: `"appId": "br.com.jstudioplay.app"`
- `android/app/src/main/res/values/strings.xml`: `package_name` e `custom_url_scheme`
- `android/app/src/main/java/br/com/jstudioplay/app/MainActivity.java`: Nova estrutura de diretório de código-fonte Java.

---

## 3. Binários Produzidos
- [JstudioPlay-v8.3.11.aab](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/dist-android/JstudioPlay-v8.3.11.aab) (~3.5 MB)
- [JstudioPlay-v8.3.11.apk](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/dist-android/JstudioPlay-v8.3.11.apk) (~3.6 MB)
