---
title: "Migração SHA-256 → bcrypt (Lazy) e Remoção de better-sqlite3"
date: "2026-10-10"
tags:
  - zettelkasten
  - governanca
  - seguranca
  - iam
  - migracao
  - performance
  - dependencias
  - glpi
ticket_glpi: "2026-1010-002"
status: concluido
versao_anterior: "7.2"
versao_atual: "7.3"
---

# 🧠 Nota de Memória Técnica — Migração bcrypt + Remoção better-sqlite3

## 🎯 Contexto

Sprint 2 de saúde sistêmica, executado em conformidade com a Cláusula Pétrea de Governança ([AGENTS.md](../AGENTS.md)). Continuação do Chamado `#2026-1010-001`.

---

## 🔐 Mudança 1 — SHA-256 → bcrypt (Lazy Migration)

### Problema
Senhas armazenadas como `SHA-256(plaintext)` — função de hash de propósito geral, ~500M hashes/s em hardware comum. Banco `db.json` exposto = conta comprometida em segundos.

### Decisão
**bcrypt com cost=12** via pacote `bcrypt@5.1.1`. Custo 12 ≈ 250ms por hash, ~300 tentativas/segundo para um atacante — 6 ordens de magnitude mais seguro.

**Estratégia Lazy Migration** (zero-downtime, zero-breaking):
- Campo `passwordHashAlgo: 'sha256' | 'bcrypt'` adicionado ao schema de usuário
- Na autenticação: `security.verifyPassword()` detecta o algoritmo e verifica
- Se senha legada SHA-256 for correta → re-hasheia com bcrypt e salva silenciosamente
- Usuários existentes migram automaticamente no próximo login sem qualquer ação manual

### Arquitetura da solução

```
security.verifyPassword(plain, storedHash, algo)
  ├── algo === 'bcrypt' OU hash começa com $2b$/$2a$
  │   └── bcrypt.compareSync(plain, storedHash) → { valid, needsUpgrade: false }
  └── fallback legado SHA-256
      └── sha256(plain) === storedHash → { valid, needsUpgrade: true }
```

```
POST /login
  ├── verifyPassword(password, user.passwordHash, user.passwordHashAlgo)
  ├── se valid === false → 401
  ├── se needsUpgrade === true → db.updateUser(id, { password }) ← re-hasheia bcrypt
  └── continua fluxo normal
```

### Arquivos modificados

| Arquivo | O que mudou |
|---|---|
| `server/security.js` | Importa `bcrypt`, adiciona `hashPasswordBcrypt()` e `verifyPassword()` |
| `server/database.js` | `createUser()` e `updateUser()` usam bcrypt; campo `passwordHashAlgo: 'bcrypt'`; usuário admin padrão já em bcrypt |
| `server/index.js` | `POST /login` usa `verifyPassword()` + lazy upgrade |
| `server/xtreamServer.js` | `authenticate()` usa `verifyPassword()` + lazy upgrade |

### Compatibilidade backward
- Usuários com `passwordHashAlgo: undefined` e hash SHA-256 (legado) → funcionam normalmente
- Detecção por prefixo `$2b$`/`$2a$` garante compatibilidade mesmo sem o campo `algo`
- Nenhum dado existente precisa ser modificado manualmente

---

## 📦 Mudança 2 — Remoção de `better-sqlite3`

### Problema
`better-sqlite3@11.8.1` estava em `package.json` como dependência mas **nunca foi importado** (`require('better-sqlite3')`) em nenhum arquivo do projeto. Impacto:
- +31 sub-pacotes desnecessários
- Compilação nativa (python3/make/g++) no Dockerfile → build mais lento
- Superfície de ataque desnecessária

### Ação
```bash
npm uninstall better-sqlite3
```
31 pacotes removidos. Imagem Docker mais leve.

---

## ✅ Resultados da Validação (16/16 PASS)

```
✅ SHA-256 legado correto → valid=true
✅ SHA-256 legado correto → needsUpgrade=true
✅ SHA-256 legado errado → valid=false
✅ bcrypt correto (campo algo) → valid=true
✅ bcrypt correto (campo algo) → needsUpgrade=false
✅ bcrypt errado → valid=false
✅ Auto-detecção $2b$ → valid=true
✅ Auto-detecção $2b$ → needsUpgrade=false
✅ hashPasswordBcrypt gera hash $2b$
✅ hashPasswordBcrypt verificável
✅ createUser gera passwordHashAlgo=bcrypt
✅ createUser hash começa com $2b$
✅ createUser hash verificável
✅ updateUser re-hasheia em bcrypt
✅ updateUser nova senha verificável
✅ better-sqlite3 não encontrado (correto)
```

---

## 🔗 Referências

- [[20261010-sprint-saude-sistemica-v72]]
- [[20261010-saneamento-arquitetural-iam-e-persistencia]]
- [AGENTS.md — Fluxo Canônico de Governança](../AGENTS.md)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- Chamado GLPI: `#2026-1010-002` (fechado)
