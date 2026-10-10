---
title: "Saneamento Arquitetural, Blindagem IAM e Persistência Não-Bloqueante"
date: "2026-10-10"
tags:
  - zettelkasten
  - governanca
  - arquitetura
  - seguranca
  - iam
  - performance
  - glpi
ticket_glpi: 49
status: concluido
---

# 🧠 Nota de Memória Técnica — JstudioPlay Pro

## 🎯 Contexto e Diagnóstico
Em conformidade com a **Cláusula Pétrea de Governança** ([AGENTS.md](file:///c:/Users/joaoc/Documents/Obsidia/JstudioPlay/AGENTS.md)) e [GEMINI.md](file:///c:/Users/joaoc/Documents/Obsidia/JstudioPlay/GEMINI.md), o projeto passou por uma revisão e saneamento arquitetural completo.

### Gargalos Identificados:
1. **Conflito de Porta Host**: A porta padrão `3000` estava alocada pelo Docker/WSL (Grafana), e o script `iniciar.bat` continha rotinas agressivas de `taskkill` cego contra PIDs alheios.
2. **Event Loop Freeze**: O banco de dados `data/db.json` (7.6 MB) realizava serialização síncrona `fs.writeFileSync` a cada operação em `server/database.js`, congelando a thread do Node.js.
3. **Exposição de Credenciais e IAM**: Chaves de API hardcoded em batch files e senhas do keystore Android em texto plano no `android/app/build.gradle`.

---

## 🛠️ Modificações Arquiteturais Implementadas

### 1. Gestão Centralizada de Segredos (IAM)
- Criado o cofre de credenciais em `CREDENCIAIS/.env` contendo todas as variáveis sensíveis do sistema.
- Blindagem total de `*.jks`, `*.keystore`, `*.env` e `*.key` no `.gitignore`.
- Remoção de segredos estáticos no `iniciar.bat` e parametrização do Gradle para leitura dinâmica via variáveis de ambiente.

### 2. Resolução do Conflito de Portas & SRE
- Porta padrão do JstudioPlay alterada para `3030`.
- O script `iniciar.bat` agora inspeciona se o processo escutando na porta é uma instância do `node.exe` antes de qualquer ação, protegendo serviços Docker e processos do sistema.

### 3. Persistência Atômica & Debouncing
- O método `save()` em `server/database.js` foi migrado para persistência debounced (300ms) com escrita atômica via arquivo temporário `.tmp` e `fs.renameSync`.
- Adicionados ganchos `beforeExit`, `SIGINT` e `SIGTERM` para garantir o flush síncrono final antes do encerramento do processo, eliminando travamento do event loop e riscos de corrupção.

### 4. Suíte de Testes Automatizados (DoD)
- Inclusão do comando `npm test` no `package.json`.
- Atualização do `test_system.js` com fluxo automatizado de login Bearer token, validação de canais, relay de streaming, stream checker e exportação M3U com 100% de sucesso.

---

## 🎫 Rastreabilidade GLPI
- **Chamado Principal**: GLPI Ticket `#49`
- **Subtasks**:
  - `#92`: Subtask IAM (Done)
  - `#93`: Subtask SRE (Done)
  - `#94`: Subtask DB/Arquiteto (Done)
  - `#95`: Subtask QA (Done)
- **Status Final**: Solved / Concluído
