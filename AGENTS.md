# Verdent AI - Contrato de Governança (AGENTS.md)

## 1. Princípios Fundamentais
- **Ciclo PCV:** Todo desenvolvimento deve seguir estritamente as fases Plan -> Code -> Verify.
- **Isolamento:** Nenhuma execução de código ocorre fora do sandbox.
- **Determinismo:** A comunicação entre agentes usa JSON-RPC 2.0.

## 2. Papéis dos Agentes
- **Supervisor:** Orquestra o fluxo, gerencia o estado e delega tarefas.
- **Planner:** Analisa requisitos e gera o plano de engenharia (`plan.md`).
- **Coder:** Implementa o código no sandbox baseado no plano aprovado.
- **Verifier:** Executa testes e valida a implementação.
- **Judge:** Avalia o resultado final e emite o veredito.
