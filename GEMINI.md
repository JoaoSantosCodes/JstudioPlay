# 🚨 PROTOCOLO OBRIGATÓRIO DE GOVERNANÇA (GEMINI.md)

Toda e qualquer ideia, proposta, refatoração ou alteração técnica DEVE OBRIGATORIAMENTE seguir o ciclo em 6 etapas:
1. Pauta do Propositor (code-optimizer)
2. Sala de Guerra (war-room: Arquiteto, SRE, Estrategista, Segurança/IAM -> Veredito)
3. Tech Lead (DAG de bloqueio e DoD)
4. Governança no GLPI (Chamado Formal e Subtasks)
5. Esquadrão Técnico Coordenado
6. Validação & Memória (100% testes verdes, Zettelkasten em MEMORIA/, fechamento e commit)

### 🔐 Diretriz de Credenciais (IAM)
Toda credencial deve ser mantida exclusivamente na pasta `CREDENCIAIS/.env`, blindada pelo `.gitignore`.
