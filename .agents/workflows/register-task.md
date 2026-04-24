---
description: >
  Procedimento para registrar uma nova tarefa no backlog do projeto (.agents/todo.md).
  Usar quando identificar um gap entre spec e implementação, um débito técnico,
  um bug, ou uma feature pendente que não será implementada na sessão atual.
---

# Registrar Tarefa no Backlog

## Quando registrar uma tarefa

Registrar em `.agents/todo.md` **sempre que**:

- Identificar um **gap entre spec e implementação** (código não faz o que a spec define).
- Identificar um **débito técnico** que o esforço de corrigir agora é desproporcional à entrega.
- Encontrar um **bug** que não será corrigido na sessão atual.
- Planejar uma **feature futura** que está especificada mas não implementada.
- O usuário indicar que algo deve ser feito "depois" ou "no futuro".

**Não registrar tarefa para:**
- Decisões arquiteturais → usar workflow `/register-adr`.
- Ajustes triviais que podem ser feitos imediatamente (< 5 min).
- Itens que pertencem a um issue tracker externo (GitHub Issues) — a menos que o projeto não use um.

## Tarefa vs. ADR — Quando usar cada um

| Situação | Artefato |
|---|---|
| "Devemos usar X em vez de Y para comunicação" | **ADR** — é uma decisão arquitetural |
| "O campo `name` precisa ser adicionado ao modelo" | **Tarefa** — é um gap spec ↔ código |
| "O módulo de pagamento ainda não existe" | **Tarefa** — é uma implementação pendente |
| "Renomear endpoint de `/events` para `/races`" | **ADR** (decisão) + **Tarefa** (implementação) |

## Template de Tarefa

```markdown
### ⬚ [ID] Título descritivo da tarefa

**Prioridade:** alta | média | baixa — [justificativa curta]
**Dependências:** [IDs de tarefas que precisam ser feitas antes] ou Nenhuma
**Módulo:** `<módulo ou componente afetado>`
**Arquivos:** `src/modulo/Arquivo.ts`, `src/modulo/outro.ts`

**Problema:**

[Descrição clara do gap, bug ou feature pendente.]

**Implementação:**

1. [Passo concreto 1]
2. [Passo concreto 2]
3. [Passo concreto N]

**Critério de aceitação:**
- [Condição verificável 1]
- [Condição verificável 2]
- **Testes:** [quais testes criar/atualizar]

**Referência:** `NN-SPEC.md § seção`, ADR-NNNN
```

## Convenções

### IDs

- Formato: `MÓDULO-NN` (ex: `APP-01`, `API-03`, `AUTH-02`)
- Módulos válidos: serão definidos conforme a arquitetura do projeto evolui
- Numeração é sequencial dentro de cada módulo — consultar o maior ID existente antes de criar

### Marcadores de status

| Marcador | Significado |
|---|---|
| `⬚` | Pendente (não iniciada) |
| `🔄` | Em progresso |
| `✅` | Concluída |

### Agrupamento

- Tarefas são agrupadas em **Grupos** temáticos com justificativa de ordenação.
- Se houver dependências entre tarefas, manter o **Mapa de Dependências** em Mermaid atualizado.

## Ciclo de vida

1. **Criação:** Tarefa é registrada em `.agents/todo.md` com status `⬚` e todos os campos preenchidos.
2. **Execução:** Ao iniciar trabalho, mudar status para `🔄`. Ao criar o `task.md` da sessão, referenciar o ID da tarefa do backlog.
3. **Conclusão:** Ao finalizar, mudar status para `✅`. Atualizar a tabela de referência rápida.
4. **Arquivamento:** Periodicamente (ou quando o arquivo ficar grande), mover tarefas `✅` para `.agents/archive/todo-done.md` para manter o backlog limpo.

## Passos para registrar

// turbo
1. Abrir `.agents/todo.md`
2. Identificar o grupo temático adequado (criar novo se necessário)
3. Identificar o próximo ID sequencial do módulo
4. Preencher o template completo
5. Atualizar o Mapa de Dependências (Mermaid) se houver dependências
6. Atualizar a Tabela de Referência Rápida no final do arquivo
