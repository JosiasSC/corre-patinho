---
spec: "01-INTENT"
title: "Domínio, Glossário e Decisões Iniciais"
status: "🟢 Definido"
last_updated: "2026-04-24"
sections:
  - "§ 1 — Visão Geral"
  - "§ 2 — Glossário"
  - "§ 3 — Mecânicas de Jogo"
  - "§ 4 — Níveis de Dificuldade"
  - "§ 5 — Stack Tecnológica"
  - "§ 6 — Estrutura de Módulos (Preliminar)"
  - "§ 7 — Decisões Iniciais"
  - "§ 8 — Escopo Futuro"
---

# 01-INTENT — Summary

**corre-patinho** é um jogo casual web (PWA) para crianças de 6+ anos, inspirado no brinquedo "Patinho Escorregador".

## Conceito Central

Jogo de reflexo/habilidade em **primeira pessoa**: o jogador controla um patinho descendo um tobogã com curvas geradas aleatoriamente. A mecânica principal é **ajustar a intensidade das curvas** para não cair. Cada partida tem percurso único (geração procedural).

## Dificuldades

| Nível | Sinalização | Velocidade |
|---|---|---|
| Fácil | ✅ Indicador de intensidade | Normal |
| Normal | ❌ Sem indicador | Normal |
| Difícil | ❌ Sem indicador | Rápida |

## Stack

- **Linguagem:** TypeScript
- **Plataforma:** PWA (mobile-first — smartphones e tablets)
- **Renderização:** A definir
- **Build/tooling:** A definir

## Módulos Preliminares

`core/game` (loop + estado), `core/track` (geração procedural), `core/input` (inputs), `ui/hud` (HUD), `ui/menus` (menus), `rendering` (engine), `pwa` (service worker), `audio` (sons).

## Decisões Registradas (D-001 a D-005)

TypeScript por familiaridade; PWA para alcance web + experiência app; perspectiva primeira pessoa para imersão; percurso aleatório para rejogabilidade; 3 níveis claros para público infantil.

## Pendências / A Definir

- Mecânica exata de input (gestos, botões, slider)
- Engine de renderização (Canvas 2D, WebGL, framework de jogos)
- Build tooling (Vite, etc.)
- Algoritmo de geração procedural do percurso
- Sistema de pontuação
