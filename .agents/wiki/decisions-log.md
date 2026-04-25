# Registro de Decisões Consolidado

> Última atualização: 2026-04-24

## Decisões Formalizadas (ADRs)

Consolidadas em [decisions-consolidated.md](decisions-consolidated.md).
ADRs completas com justificativas: `.agents/archive/adrs/`.

## Decisões Operacionais (sem ADR formal)

| Data | ID | Decisão | Contexto |
|---|---|---|---|
| 2026-04-24 | D-001 | TypeScript como linguagem | Familiaridade do desenvolvedor — `01-INTENT.md § 5` |
| 2026-04-24 | D-002 | Distribuição via PWA | Alcance web + experiência app-like — `01-INTENT.md § 5` |
| 2026-04-24 | D-003 | Perspectiva em primeira pessoa | Imersão — `01-INTENT.md § 3` |
| 2026-04-24 | D-004 | Percurso gerado proceduralmente | Rejogabilidade — `01-INTENT.md § 3.3` |
| 2026-04-24 | D-005 | 3 níveis de dificuldade discretos | Clareza para público infantil — `01-INTENT.md § 4` |
| 2026-04-24 | P1 | Swipe lateral contínuo + setas desktop | Equilíbrio imersão/simplicidade — `02-GAME-MECHANICS.md § 2` |
| 2026-04-24 | P2 | Canvas 2D pseudo-3D | Performance mobile + simplicidade — `03-TECH-STACK.md § 3` |
| 2026-04-24 | P3 | Vite + vite-plugin-pwa | Padrão de facto, TS nativo, HMR — `03-TECH-STACK.md § 2` |
| 2026-04-24 | P4 | Percurso infinito, ~2min, seed compartilhável | Engajamento + rejogabilidade — `02-GAME-MECHANICS.md § 3` |
| 2026-04-24 | P5 | Score por distância, localStorage, v1 | Simples para crianças — `02-GAME-MECHANICS.md § 5` |
| 2026-04-24 | P6 | Física customizada simplificada | Sem lib externa, single-axis — `02-GAME-MECHANICS.md § 4` |
| 2026-04-24 | P7 | 3 vidas + checkpoints | Reduz frustração infantil — `02-GAME-MECHANICS.md § 6` |
| 2026-04-24 | P8 | Estilo visual Cartoon 2D | Atrativo para crianças 6+ — `03-TECH-STACK.md § 3.3` |
| 2026-04-24 | P9 | Howler.js, loop alegre + SFX, muted | Leve, battle-tested — `03-TECH-STACK.md § 4` |
| 2026-04-24 | P10 | PWA offline-first, notificar updates | Ideal para casual single-player — `03-TECH-STACK.md § 5` |
| 2026-04-24 | P11 | Landscape forçado | Mais espaço para tobogã — `03-TECH-STACK.md § 6` |
| 2026-04-24 | P12 | WCAG AA, formas além de cores, sem gamepad v1 | Padrão da indústria — `03-TECH-STACK.md § 7` |

## Fontes
- `.agents/wiki/decisions-consolidated.md` (decisões vigentes)
- `.agents/archive/adrs/` (ADRs completas)
- `.agents/todo.md`
