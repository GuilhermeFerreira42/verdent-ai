## 🔒 META-COMANDO UNIVERSAL DE DOCUMENTAÇÃO ARQUITETURAL DETERMINÍSTICA

> Gere a documentação completa da fase solicitada seguindo rigorosamente o Protocolo Arquitetural Determinístico Universal.
>
> A documentação deve ser suficiente para que uma IA executora implemente a solução integralmente sem realizar inferências, suposições adicionais ou decisões arquiteturais próprias.
>
> Nenhuma ambiguidade, nenhuma lacuna estrutural, nenhuma decisão implícita é permitida.

---

# PRINCÍPIOS FUNDAMENTAIS OBRIGATÓRIOS

1. Toda decisão deve ser explícita.
2. Todo fluxo deve ser numerado ponta a ponta.
3. Todo estado deve possuir máquina formal de transição.
4. Todo requisito deve possuir teste que o valide.
5. Toda alteração deve declarar impacto.
6. Todo limite deve ser declarado.
7. Toda suposição deve ser listada.
8. Todo comportamento fora do escopo deve ser explicitamente proibido.
9. Nenhum trecho pode ser discursivo ou genérico.
10. A documentação deve ser implementável sem perguntas adicionais.

---

# ESTRUTURA OBRIGATÓRIA DE ENTREGA

A IA documentadora deve gerar obrigatoriamente os seguintes arquivos:

---

## 1️⃣ PHASE_X_OVERVIEW.md

Função: Direção estratégica e limites formais.

Deve conter obrigatoriamente:

* Objetivo de negócio mensurável
* Problema resolvido
* Métricas quantificáveis de sucesso
* Impacto sistêmico detalhado
* Análise de regressão potencial
* Escopo fechado (Inclui / Não Inclui)
* Invariantes que não podem ser violados
* Dependências externas
* Riscos estratégicos
* Critérios objetivos de conclusão

Proibido conter:

* Especificação técnica detalhada
* Pseudocódigo
* Descrição de implementação

---

## 2️⃣ PHASE_X_ARCHITECTURE.md

Função: Arquitetura formal e contratos internos.

Deve conter obrigatoriamente:

* Arquitetura em camadas explicitamente definida
* Diagrama Mermaid obrigatório
* Fluxo operacional numerado ponta a ponta
* Definição formal de fronteiras entre módulos
* Contratos de interface (assinaturas explícitas)
* Responsabilidades únicas por componente
* Lista de arquivos que PODEM ser alterados
* Lista de arquivos que NÃO podem ser alterados
* Definição de invariantes sistêmicos
* Estratégia de concorrência (se aplicável)
* Estratégia transacional (se aplicável)
* Política de rollback por componente

Nenhuma ambiguidade permitida.

---

## 3️⃣ PHASE_X_TECH_SPECS.md

Função: Contrato técnico executável.

Deve conter obrigatoriamente:

* Modelo de dados completo
* Estruturas imutáveis definidas formalmente
* Máquina de estados formal (se houver estados)

  * Tabela de transições
  * Eventos permitidos
  * Estados proibidos
* Requisitos funcionais numerados (RF-01, RF-02…)
* Requisitos não funcionais numerados (RNF-01…)
* Segurança (OWASP quando aplicável)
* Performance esperada com métricas numéricas
* Estratégia explícita de tratamento de erro
* Política de versionamento
* Política de persistência
* Estratégia de isolamento e locking (se houver concorrência)

Nenhum comportamento pode depender de interpretação implícita.

---

## 4️⃣ PHASE_X_STRUCTURAL_STANDARDS.md

Função: Blindagem contra dívida técnica.

Deve conter obrigatoriamente:

* Padrões arquiteturais adotados
* Design patterns permitidos
* Design patterns proibidos
* Regras de modularização
* Regras de acoplamento máximo permitido
* Estratégia formal de logging
* Estratégia de auditoria
* Estratégia de testes automatizados
* Estratégia de enforcement (CI, linter, validações automáticas)
* Escopo congelado formal
* Lista explícita de alterações proibidas

Deve incluir mecanismo de detecção de violação estrutural.

---

## 5️⃣ PHASE_X_TRACEABILITY_MATRIX.md

Função: Garantia de rastreabilidade e verificabilidade.

Deve conter tabela obrigatória:

RF | Componente | Arquivo | Método | Teste que valida | Critério binário de aceite

Nenhum requisito pode ficar sem teste correspondente.

---

## 6️⃣ PHASE_X_EXECUTION.md

Função: Manual determinístico de implementação.

Deve conter obrigatoriamente:

* Ordem sequencial de implementação
* Lista exata de arquivos criados/modificados
* Pseudocódigo das partes críticas
* Plano de migração (se houver)
* Plano de rollback completo
* Estratégia de validação incremental
* Testes obrigatórios
* Critérios de aceite em Gherkin
* Procedimento de verificação pós-deploy

Nenhuma etapa pode depender de decisão criativa da IA executora.

---

# REGRAS GLOBAIS OBRIGATÓRIAS

1. Nenhuma redundância entre arquivos.
2. Nenhuma linguagem subjetiva.
3. Nenhuma decisão deixada em aberto.
4. Sempre declarar limites técnicos.
5. Sempre declarar o que está fora do escopo.
6. Sempre prever impacto futuro e risco de escala.
7. Sempre declarar suposições feitas.
8. Sempre declarar riscos de regressão.
9. Sempre declarar pontos de falha crítica.
10. Sempre formalizar fluxo, estados e contratos.

---

# REGRAS DE FORMALISMO

Se o sistema possuir:

* Estados → incluir máquina de estados formal.
* Concorrência → incluir política de isolamento.
* Persistência → incluir modelo transacional explícito.
* Integração externa → incluir contrato formal de API.
* Orquestração de múltiplos módulos → incluir fluxo numerado ponta a ponta.

---

# CLÁUSULA ANTI-ALUCINAÇÃO ESTRUTURAL

A documentação deve:

* Impedir refatoração fora do escopo.
* Impedir alteração de assinatura pública sem declaração explícita.
* Impedir introdução de dependência não listada.
* Impedir mudança arquitetural não prevista.
* Impedir modificação de arquivos declarados como protegidos.

Qualquer elemento não explicitamente autorizado deve ser considerado proibido.

---

# GARANTIA DE NÃO SUPERFICIALIDADE

Adicionar obrigatoriamente ao final de toda geração:

> Esta documentação foi estruturada para eliminar ambiguidade operacional.
>
> Se qualquer seção permitir múltiplas interpretações, expandir até que reste apenas uma forma implementável.
>
> Não produzir explicações genéricas.
>
> Não produzir texto descritivo sem valor executável.
>
> Toda decisão deve ser rastreável, testável e verificável.

---

# RESULTADO ESPERADO

A documentação gerada sob este meta-comando deve:

* Ser auto-suficiente.
* Ser verificável.
* Ser auditável.
* Ser rastreável.
* Ser imune a interpretações criativas.
* Reduzir drasticamente risco de regressão estrutural.
* Permitir rollback seguro.
* Minimizar dívida técnica futura.

Esse meta-comando é aplicável a qualquer projeto, domínio ou tecnologia.