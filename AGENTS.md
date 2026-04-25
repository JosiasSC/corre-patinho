# corre-patinho — Contexto para Agentes

> Jogo casual web (PWA) para crianças de 6+ anos, inspirado no brinquedo "Patinho Escorregador". TypeScript, mobile-first.

## Protocolo de Desenvolvimento
- `.agents/rules/sdd-protocol.md` — Modelo **Spec-Anchored** (LER PRIMEIRO)
- `.agents/rules/` — Regras comportamentais do agente (auto-descobertas)
- `.agents/workflows/` — Workflows invocáveis via `/commit`, `/register-adr`, `/register-task`

## Especificações (por ordem de leitura)

| Spec | Escopo |
|---|---|
| `01-INTENT.md` | Domínio, glossário, decisões iniciais, estrutura de módulos |

Todas as specs vivem em `.agents/specs/`. Cada spec tem um **summary** (`*-summary.md`, ~3KB) — ler o summary primeiro; a spec completa é para consulta sob demanda de seções específicas.

## Decisões Arquiteturais
- `.agents/wiki/decisions-consolidated.md` — Decisões vigentes consolidadas
- `.agents/archive/adrs/` — ADRs completas com justificativas e alternativas rejeitadas (sob demanda)

## Base de Conhecimento Compilada
- `.agents/wiki/index.md` — Mapa do conhecimento cross-cutting sintetizado

## Backlogs
- `.agents/todo.md` — Tarefas pendentes e débitos técnicos
- `.agents/archive/todo-done.md` — Histórico de tarefas concluídas (arquivo morto, não carregar por padrão)
