---
description: >
  Protocolo SDD (Spec Driven Development) do corre-patinho. Define o modelo
  Spec-Anchored, hierarquia de especificações, integração com o planning mode,
  protocolo Spec-Change-First e detecção de drift. Aplicar SEMPRE que houver
  alteração de código ou criação de novos módulos/componentes.
---

# Protocolo SDD (Spec Driven Development)

O projeto adota o modelo **Spec-Anchored**: as especificações em `.agents/specs/` são a **fonte de verdade autoritativa**. O código é um artefato derivado das specs.

## Hierarquia de Artefatos do Projeto

Cada spec possui um **summary** (`*-summary.md`) com ~3KB e um arquivo completo. Ler o summary primeiro; só abrir a spec completa para consultar seções específicas.

| Diretório / Arquivo | Natureza | Escopo |
| --- | --- | --- |
| `.agents/specs/01-INTENT.md` | Spec | Domínio de negócio, glossário, decisões iniciais, estrutura de módulos |
| `.agents/specs/NN-*.md` | Spec | Especificações individuais de cada módulo/componente |
| `.agents/wiki/decisions-consolidated.md` | Wiki | Decisões vigentes consolidadas — decisão, alternativas rejeitadas (resumo), gatilhos de consulta |
| `.agents/archive/adrs/ADR-NNNN-*.md` | ADR (arquivo) | ADRs completas com justificativas e alternativas rejeitadas — consultar sob demanda para detalhes |
| `.agents/todo.md` | Backlog | Gaps entre spec e implementação, débitos técnicos, ordem de execução |

## Integração SDD com o Planning Mode

O fluxo SDD se integra ao planning mode nativo do agente da seguinte forma:

**Fase de Research (Pesquisa):**
- Ler os **summaries** (`*-summary.md`) das specs relevantes em `.agents/specs/`. Só abrir a spec completa (`NN-NOME.md`) quando precisar de detalhes de uma seção específica referenciada no summary.
- Consultar decisões vigentes em `.agents/wiki/decisions-consolidated.md` — especialmente as alternativas rejeitadas — para **não propor soluções já descartadas**. Para detalhes completos, consultar ADRs em `.agents/archive/adrs/`.
- Consultar `.agents/todo.md` para verificar se já existe trabalho planejado ou em andamento para o mesmo escopo.
- Specs, wiki de decisões e ADRs do projeto **têm prioridade sobre Knowledge Items** de conversas anteriores — são versionadas com o código; KIs podem estar desatualizados.

**Fase de Plan (implementation_plan.md):**
- O `implementation_plan.md` DEVE referenciar as seções de spec que fundamentam cada decisão técnica (ex: "Conforme `01-INTENT.md § 3`").
- Se a alteração planejada contradiz uma spec existente, incluir a atualização da spec como item do plano **antes** da implementação de código.
- Se uma decisão arquitetural significativa for tomada durante o planejamento, registrar uma ADR seguindo o workflow `/register-adr`.

**Fase de Execute (task.md):**
- O `task.md` do agente é o checklist da sessão de trabalho atual. É diferente do `.agents/todo.md`, que é o backlog persistente do projeto.
- Se novos gaps, débitos técnicos ou bugs forem identificados durante a execução, registrá-los no backlog seguindo o workflow `/register-task`.
- Tarefas concluídas são archivadas periodicamente em `.agents/archive/todo-done.md` para manter o backlog limpo.

**Fase de Verify (walkthrough.md):**
- Executar testes automatizados e validar compilação (quando aplicável).
- Confirmar que nenhuma divergência spec ↔ código foi introduzida.

## Manutenção de Testes em Refatorações

Ao alterar **assinaturas de construtores, métodos públicos ou remover APIs**:

1. **Verificação obrigatória:** executar testes automatizados **antes de concluir a sessão**. Não é aceitável entregar código refatorado sem confirmar que os testes existentes passam.
2. **Item explícito no checklist:** incluir no `task.md` um item dedicado à atualização dos testes que consomem as APIs alteradas/removidas. O item deve listar os arquivos de teste impactados.
3. **Testes de integração:** qualquer mudança em interfaces públicas de módulos DEVE verificar e atualizar os testes de integração.

## Protocolo Spec-Change-First

- **NUNCA altere o comportamento do código de forma que contradiga uma spec existente** sem antes atualizar a spec correspondente.
- Se descobrir que uma spec está desatualizada em relação ao código já implementado, corrija a spec imediatamente.
- Ao criar novos módulos ou componentes, a spec DEVE existir antes da implementação.
- Toda spec nova DEVE ter um **summary** (`*-summary.md`) com frontmatter e um arquivo completo sem frontmatter. Seguir a estrutura existente: Markdown com listas de marcadores, tabelas, blocos de código e linguagem imperativa direta.

## Detecção de Drift

Ao iniciar uma tarefa, se perceber divergência entre código e spec:
1. Registre a divergência explicitamente no `implementation_plan.md`.
2. Proponha se a correção deve ser na spec ou no código.
3. Não prossiga com a implementação principal até a divergência ser resolvida.

## Governança de Regras do Agente

Toda solicitação de **inclusão ou alteração de regras** do agente DEVE considerar o contexto de **SDD dentro do Google Antigravity**:

- **Local:** regras vivem exclusivamente em `.agents/rules/` como arquivos Markdown (`.md`). Não usar `.agrules`, `.cursorrules`, `GEMINI.md` na raiz ou qualquer outro formato proprietário.
- **Formato:** cada arquivo de regra DEVE possuir YAML frontmatter com campo `description` descrevendo quando a regra se aplica.
- **Modularidade:** regras devem ser organizadas por escopo (ex: protocolo SDD, restrições de arquitetura, padrões de código, tooling). Não consolidar tudo em um único arquivo.
- **Verificabilidade SDD:** toda regra nova deve ser binária e verificável — se não for possível validar o cumprimento em uma revisão rápida de código, a regra é vaga demais.
- **Consistência com specs:** regras não devem duplicar informação já presente nas specs em `.agents/specs/`. Se a informação pertence à especificação do sistema, ela vai na spec; se é uma diretriz operacional para o agente, vai na regra.
