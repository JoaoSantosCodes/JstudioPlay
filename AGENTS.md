# 🚨 DIRETRIZES FUNDAMENTAIS DO ESPAÇO DE TRABALHO (AGENTS.md) - JstudioPlay

## CLÁUSULA PÉTREA: PROTOCOLO OBRIGATÓRIO DE GOVERNANÇA

Toda e qualquer nova ideia, proposta de funcionalidade, refatoração arquitetural, nova ferramenta externa ou modificação de fluxo **DEVE OBRIGATORIAMENTE** passar pelo **Fluxo Canônico de Governança Multi-Agente**. É expressamente proibido pular qualquer etapa ou escrever código de funcionalidades antes da deliberação formal.

---

### 🔄 As 6 Etapas Inegociáveis

1. **💡 Pauta do Propositor (`code-optimizer`)**:
   - Diagnóstico claro do gargalo ou oportunidade.
   - Solução proposta com análise de ganhos e trade-offs.

2. **⚔️ Sala de Guerra (`war-room`)**:
   - Debate obrigatório sob as 4 perspectivas permanentes (Arquiteto, SRE, Produto, Segurança & IAM).
   - Emissão do **Veredito Oficial Consolidado**.

3. **👑 Tech Lead & Orquestrador (`tech-lead`)**:
   - Ordem crítica de bloqueio (DAG de Dependências):
     $$\text{Banco de Dados} \longrightarrow \text{API & Contratos} \longrightarrow \text{Back-End} \longrightarrow \text{Front-End}$$
   - Estabelecimento estrito da **Definition of Done (DoD)**.

4. **🎫 Governança de Mudanças no GLPI (`glpi-governance-specialist`)**:
   - Abertura Obrigatória de Chamado Formal no GLPI (`http://localhost:8086`).
   - Criação e Vinculação de Subtasks mapeadas para cada especialista técnico responsável.

5. **🛠️ Esquadrão Técnico Coordenado**:
   - Execução ordenada por cada especialista e conformidade com IAM.

6. **🧪 Validação, DoD e Fechamento de Memória**:
   - **100% de testes verdes** (tolerância zero a falhas ou regressões).
   - Registro de nota técnica em `MEMORIA/` no padrão Zettelkasten Obsidian.
   - Fechamento formal do chamado no GLPI e commit semântico no Git.

---

## 🔐 DIRETRIZ MANDATÓRIA DE GESTÃO DE ACESSOS (IAM)

> [!CAUTION]
> **REGRA DE ARMAZENAMENTO DE CREDENCIAIS:**  
> Toda e qualquer credencial, chave de API, token de serviço ou senha **DEVE OBRIGATORIAMENTE** ser salva e gerenciada exclusivamente na pasta `CREDENCIAIS/.env`.  
> - A pasta `CREDENCIAIS/` é permanentemente blindada pelo `.gitignore`.
