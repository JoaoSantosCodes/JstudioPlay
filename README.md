# 🚀 JstudioPlay Pro

Central autônoma de streaming, gerenciamento de listas IPTV M3U, validação de streams e proxy de mídia com integração EPG e automações.

---

## 📋 Visão Geral

O **JstudioPlay Pro** é uma solução completa para operação e distribuição de conteúdos IPTV, oferecendo:
- **Dashboard Web Moderno**: Interface responsiva e moderna com métricas em tempo real, reprodutor HLS integrado e gerenciador de categorias.
- **Automação Contínua**: Agendador de tarefas em background para sincronização periódica de listas M3U e guias EPG.
- **Health Check & Stream Checker**: Testes concorrentes de disponibilidade de canais com timeouts configuráveis.
- **Proxy & Relay de Streaming**: Tratamento de CORS, headers personalizados e compatibilidade com navegadores e reprodutores externos.
- **Integração com n8n**: Webhooks e alertas automáticos para monitoramento de integridade e falhas de transmissão.
- **Inicialização Automática com o Windows**: Execução silenciosa e invisível em segundo plano ao ligar o computador.

---

## 🛠️ Tecnologias Utilizadas

- **Node.js** (v18+)
- **Express.js** (API REST & Servidor estático)
- **better-sqlite3** (Armazenamento rápido e persistente)
- **node-cron** (Agendamentos e rotinas autônomas)
- **PowerShell & Batch Scripting** (Automação de inicialização do Windows)

---

## ⚡ Instalação e Execução

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) v18 ou superior instalado.

### 2. Configuração de Variáveis
Copie o arquivo de exemplo e ajuste suas credenciais conforme necessário:
```bash
copy .env.example .env
```

### 3. Execução Rápida (Windows)
Basta dar um duplo clique no script:
```text
iniciar.bat
```
ou pelo terminal:
```bash
npm install
npm start
```

O painel será aberto automaticamente em:
- **Painel Web**: [http://localhost:3000](http://localhost:3000)
- **Dashboard**: [http://localhost:3000/#/dashboard](http://localhost:3000/#/dashboard)

---

## 🔄 Inicialização com o Windows

Para que o servidor inicie silenciosamente em segundo plano sempre que o computador for ligado:
- Execute `instalar_inicializacao_automatica.bat` (ou escolha a opção 4 no menu do `iniciar.bat`).
- Para remover a inicialização automática, execute `desinstalar_inicializacao_automatica.bat`.

---

## 🔐 Segurança e Acesso Padrão

- **Usuário Padrão**: `admin`
- **Senha Padrão**: `admin123`
*(As credenciais e a chave de API podem ser personalizadas no arquivo `.env`)*
