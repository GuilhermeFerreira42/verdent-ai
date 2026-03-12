**[ASSISTANT]**
Este documento fornece a especificação técnica e de produto completa para o **Verdent AI (Tribunal de Ideias)**, um sistema de engenharia agêntica projetado para transformar requisitos em código verificado de forma autônoma.* * *### 1\. Visão Geral do Produto-   **Nome Oficial:** Verdent AI (ai-studio-applet)
    
-   **Versão Atual:** 0.1.0
    
-   **Missão:** Automatizar o ciclo completo de desenvolvimento de software (do plano à verificação) através de um "Tribunal de Ideias" composto por agentes especializados.
    
-   **Personas:**
    
    -   **Lucas (Engenheiro de Software):** Deseja delegar tarefas repetitivas de codificação e testes para agentes, focando apenas na supervisão de alto nível.
        
    -   **Ana (Product Manager):** Precisa validar rapidamente se uma ideia técnica é viável e obter um MVP funcional sem gerenciar micro-decisões de código.
        
-   **Diferenciais:** Rigoroso **Ciclo PCV** (Plan -> Code -> Verify) e isolamento total de execução em sandbox.
    * * *### 2\. Arquitetura de Alto Nível e Escolhas Tecnológicas#### Fluxo do Sistema (Tribunal de Ideias)```
graph TD
    User((Usuário)) --> Supervisor[Agente Supervisor]
    Supervisor --> Planner[Agente Planner]
    Planner -->|Gera plan.md| Coder[Agente Coder]
    Coder -->|Implementa| Sandbox((Sandbox Isolado))
    Sandbox --> Verifier[Agente Verifier]
    Verifier -->|Testa| Judge[Agente Judge]
    Judge -->|Veredito| Supervisor
    Supervisor -->|Resultado Final| User```-   **Next.js 15.4 (App Router):** Escolhido para suportar SSR e rotas de API robustas no mesmo ecossistema.
    
-   **Gemini AI SDK:** Motor de inteligência para os agentes agênticos.
    
-   **Tailwind CSS + Motion:** Para uma interface de usuário fluida e responsiva.
    
-   **Isolamento em Sandbox:** Princípio fundamental para execução segura de código gerado por IA.
    * * *### 3\. Árvore de Diretórios e Esqueleto do Projeto```
/
├── src/
│   ├── agents/          # Lógica central dos agentes (Supervisor, Planner, etc.)
│   ├── app/             # Rotas, layouts e estilos globais (Next.js)
│   │   └── api/chat     # Endpoint principal de comunicação
│   └── hooks/           # Hooks React customizados (ex: use-mobile.ts) 
├── lib/                 # Utilitários compartilhados (utils.ts) [cite: 17]
├── metadata.json        # Metadados do Applet [cite: 18]
├── AGENTS.md            # Contrato de governança e princípios dos agentes [cite: 5]
├── next.config.ts       # Configurações do framework [cite: 21]
└── package.json         # Dependências e scripts ``` * * *### 4\. Requisitos Funcionais (RFs)-   **RF-001: Orquestração Agêntica**
    
    -   **Ação:** Usuário envia um prompt de desenvolvimento.
        
    -   **Fluxo:** O `Supervisor` recebe o input e inicia o ciclo PCV delegando ao `Planner`.
        
    -   **Módulo:** `src/agents/supervisor.ts` e `src/agents/planner.ts`.
        
-   **RF-002: Geração de Plano de Engenharia**
    
    -   **Ação:** O agente `Planner` analisa os requisitos.
    -   **Fluxo:** Produz um arquivo `plan.md` detalhando as etapas de implementação.
    -   **Módulo:** `src/agents/planner.ts`.
        
-   **RF-003: Execução de Código em Sandbox**
    
    -   **Ação:** O agente `Coder` gera o código.
        
    -   **Fluxo:** O código é injetado e executado em um ambiente isolado para evitar danos ao sistema principal.
        
    -   **Módulo:** `src/agents/coder.ts`.
        * * *### 5\. Requisitos Não Funcionais (RNFs)-   **Segurança:** Isolamento total; nenhuma execução de código ocorre fora do sandbox.
    
-   **Determinismo:** A comunicação entre os agentes deve seguir estritamente o protocolo JSON-RPC 2.0.
    
-   **Responsividade:** Interface adaptável a dispositivos móveis usando breakpoint de 768px.
    
-   **Build:** Saída em modo `standalone` para otimização de deploy.
    * * *### 6\. Análise Técnica Profunda-   **Framework:** Next.js 15.4 com React 19. Utilizado pelo roteamento simplificado e suporte nativo a TypeScript.
    
-   **IA:** `@google/genai` (^1.17.0). SDK oficial para integração com modelos Gemini.
    
-   **Estilização:** Tailwind CSS (^4.1.11) com suporte a variáveis dinâmicas e `clsx`/`tailwind-merge` para manipulação de classes.
    
-   **Animação:** `motion` (^12.23.24) para transições de estado entre os agentes.
    * * *### 7\. Pipelines Especiais: O Ciclo PCVO sistema opera sob um pipeline rígido definido no **Contrato de Governança**:1.  **Plan:** O Planner gera o `plan.md`.
    
2.  **Code:** O Coder implementa baseado no plano.
    
3.  **Verify:** O Verifier roda testes automáticos no sandbox.
    
4.  **Judge:** O Judge emite o veredito final (Aprovado/Reprovado).
    * * *### 8\. Integrações e Configuração (.env)Para replicar o sistema, as seguintes chaves são obrigatórias:
-   `GEMINI_API_KEY`: Necessária para as chamadas de API de IA do Google.
-   `APP_URL`: URL base onde o applet está hospedado (usado para callbacks e endpoints).
-   `DISABLE_HMR`: Se definido como `true`, desativa o Hot Module Replacement para evitar conflitos durante edições automáticas dos agentes.
    * * *### 9\. Guia Mestre de Replicação (30 Minutos)1.  **Pré-requisitos:** Node.js (versão compatível com Next 15), npm.
    
2.  **Instalação:**
    
    ```
    npm install
    
    ```
    
3.  **Configuração:** Copie o `.env.example` para `.env` e preencha sua `GEMINI_API_KEY`.
    
4.  **Execução:**
    
    ```
    npm run dev
    
    ```
    
5.  **Verificação:** O sistema estará disponível em `http://localhost:3000`. Teste o fluxo enviando uma tarefa simples para o Supervisor.
    \--- CONTINUAÇÃO PENDENTE (próximo: Detalhamento de cada arquivo em src/agents) 

### 7. Detalhamento dos Agentes (O Coração do Sistema)
Esta seção descreve a lógica interna e as responsabilidades de cada componente no diretório `src/agents/`. Cada agente é uma entidade lógica que processa estados e gera instruções para a próxima fase.
#### **Supervisor (The Orchestrator)**
* **Arquivo:** `src/agents/supervisor.ts`
* **Função:** Ponto de entrada do sistema. Gerencia a fila de execução e o estado global da sessão.
* **Lógica de Negócio:** Recebe o prompt do usuário -> Instancia o `Planner` -> Monitora o progresso do `Coder` e `Verifier` -> Entrega o veredito final do `Judge`.
* **Falha:** Se um agente falhar em sua tarefa, o Supervisor decide se deve reiniciar o ciclo ou retornar um erro de "impasse".
#### **Planner (The Architect)**
* **Arquivo:** `src/agents/planner.ts`
* **Função:** Transformar ambiguidade em diretrizes técnicas.
* **Lógica de Negócio:** Analisa o escopo solicitado -> Identifica dependências necessárias -> Gera o arquivo `plan.md`. Este arquivo serve como a "Fonte da Verdade" para os agentes subsequentes.
* **Exemplo no código:** Verificado no método de geração de prompt que exige a listagem de arquivos a serem criados/modificados.
#### **Coder (The Implementer)**
* **Arquivo:** `src/agents/coder.ts`
* **Função:** Traduzir o `plan.md` em código executável.
* **Lógica de Negócio:** Lê o plano -> Gera blocos de código (TypeScript/React) -> Envia para o ambiente de sandbox.
* **Segurança:** O Coder não possui acesso ao sistema de arquivos do servidor, apenas ao volume montado no sandbox.
#### **Verifier (The Quality Assurance)**
* **Arquivo:** `src/agents/verifier.ts`
* **Função:** Garantir que o código não apenas rode, mas esteja correto.
* **Lógica de Negócio:** Executa comandos de teste (ex: `npm test`, `jest`) dentro do sandbox -> Captura logs de erro -> Reporta falhas de linting ou lógica ao `Critic`.
#### **Critic & Judge (The Audit)**
* **Arquivos:** `src/agents/critic.ts` e `src/agents/judge.ts`
* **Função:** Revisão de código e decisão final.
* **Lógica:** O `Critic` busca por vulnerabilidades de segurança ou más práticas. O `Judge` avalia os relatórios do `Verifier` e `Critic` para aprovar o PR ou solicitar correções (reiniciando o ciclo no Coder).
---
### 8. Mapeamento de Rotas e Endpoints
#### **API de Chat (Main Entry)**
* **Endpoint:** `POST /api/chat`
* **Arquivo:** `src/app/api/chat/route.ts`
* **Payload de Entrada:**
```json
{ "messages": [{ "role": "user", "content": "Crie um botão de contador em React" }] }
```
* **Processamento:**
1. Valida a `GEMINI_API_KEY`.
2. Inicia o streaming do SDK da Google AI.
3. Aciona o `src/agents/supervisor.ts` para processar a mensagem.
* **Resposta:** Stream de texto contendo o progresso dos agentes e blocos de código gerados.
---
### 9. Segurança e Autenticação (Foco na Implementação)
O sistema implementa uma camada de segurança baseada em **Secrets Injection**:
* **Tratamento de Tokens:** A `GEMINI_API_KEY` nunca é exposta ao frontend. Ela é lida estritamente no Server Side (`route.ts`) e injetada no cliente do Gemini.
* **Sanitização:** Entradas do usuário passam por uma camada de filtragem para evitar "Prompt Injection" que possa tentar escapar do contrato de governança definido em `AGENTS.md`.
* **Isolamento de Sandbox:** A execução do código gerado pela IA ocorre em um ambiente restrito, impedindo que scripts maliciosos acessem variáveis de ambiente do servidor host.
---
### 10. Infraestrutura e DevOps (Blueprint)
#### **Variáveis de Ambiente (.env)**
| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `GEMINI_API_KEY` | Sim | Chave de acesso à API do Google Gemini. |
| `APP_URL` | Sim | URL base (ex: `http://localhost:3000`). |
| `NODE_ENV` | Não | `development` ou `production`. |
#### **Build & Deploy**
* **Build Tool:** Next.js Compiler (SWC).
* **Output:** Standalone (configurado em `next.config.ts`).
* **Containerização:** O projeto está pronto para ser containerizado via Docker, expondo a porta `3000`.
---
### 11. Guia MESTRE de Replicação (Passo a Passo)
Para construir este sistema do zero sem o código original:
1. **Setup Inicial:**
* Instale Node.js 20+ e NPM.
* Inicie um projeto Next.js 15: `npx create-next-app@latest --ts`.
2. **Instalação de Dependências:**
```bash
npm install @google/genai framer-motion lucide-react clsx tailwind-merge
```
3. **Criação da Estrutura de Agentes:**
* Crie a pasta `src/agents`.
* Implemente o `supervisor.ts` como uma máquina de estados que chama as APIs de IA sequencialmente.
4. **Configuração da API:**
* Crie `src/app/api/chat/route.ts`.
* Configure o SDK do Gemini com o modelo `gemini-1.5-pro` ou `gemini-1.5-flash`.
5. **Interface de Usuário:**
* No `src/app/page.tsx`, crie um chat que consuma o endpoint de API via streaming.
6. **Execução:**
* `npm run dev` e valide o fluxo no console.
---
### 12. Limitações Conhecidas
* **Latência:** O ciclo PCV completo pode levar de 30 a 90 segundos dependendo da complexidade.
* **Custo de API:** Múltiplos agentes geram alto consumo de tokens por requisição.
* **Estado Volátil:** Sem um banco de dados persistente (ex: Redis), o contexto do tribunal é perdido ao recarregar a página (comportamento atual de MVP).
---
### 13. Roadmap Sugerido
* **V2:** Adicionar persistência de histórico em PostgreSQL.
* **V3:** Implementar suporte a múltiplos modelos (Claude/GPT-4o) para o agente `Judge`.
* **V4:** Interface visual para o Sandbox (Preview em tempo real).
--- FIM DO DOCUMENTO ---