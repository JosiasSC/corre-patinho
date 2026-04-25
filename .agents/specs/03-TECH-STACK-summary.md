---
spec: "03-TECH-STACK"
title: "Arquitetura Técnica"
status: "🟢 Definido"
last_updated: "2026-04-24"
sections:
  - "§ 1 — Visão Geral"
  - "§ 2 — Stack Completa"
  - "§ 3 — Engine de Renderização"
  - "§ 4 — Áudio"
  - "§ 5 — PWA"
  - "§ 6 — Layout e Responsividade"
  - "§ 7 — Acessibilidade"
  - "§ 8 — Estrutura de Diretórios"
  - "§ 9 — Dependências"
  - "§ 10 — Decisões Registradas"
---

# 03-TECH-STACK — Summary

Arquitetura técnica completa do corre-patinho. Complementa `01-INTENT.md § 5` com decisões granulares.

## Stack (§ 2)

TypeScript + Vite + Canvas 2D (pseudo-3D) + Howler.js + localStorage. Sem framework UI (vanilla HTML/CSS/TS).

## Renderização (§ 3)

- **Canvas 2D pseudo-3D** — projeção de perspectiva via scanlines (técnica "Mode 7" / OutRun)
- Patinho: **sprite 2D cartoon** (contornos, expressão fofa) na base da tela
- Estilo: **Cartoon 2D** — vibrante, saturado, cenário detalhado (Cut the Rope / Angry Birds)
- Target: 60 FPS em mobile mid-range

## Áudio (§ 4)

- **Howler.js** (~10KB): sprites de áudio, volume, fade, loop, pool, fallback automático
- Música de fundo (loop alegre) + SFX (curva, queda, countdown, recorde, game over)
- **Iniciar muted**; preferência salva em localStorage

## PWA (§ 5)

- **Offline-first**: 100% funcional offline após primeiro acesso
- Cache-first (assets) + Network-first (updates)
- `vite-plugin-pwa` com `registerType: 'prompt'` — notifica updates
- Manifest: `display: fullscreen`, `orientation: landscape`

## Layout (§ 6)

- **Landscape forçado**; overlay de aviso em portrait
- Canvas 16:9, letterboxing em aspect ratios diferentes
- Desktop: max ~1280x720, centralizado com background temático

## Acessibilidade (§ 7)

- WCAG AA (4.5:1 texto, 3:1 gráficos)
- Formas além de cores na sinalização de curvas
- Sem gamepad/switch na v1

## Estrutura (§ 8)

`src/core/` (game, track, physics, input), `src/rendering/` (renderer, sprites, camera), `src/ui/` (hud, menus), `src/audio/`, `src/pwa/`, `src/utils/` (prng, storage), `src/types/`.

## Dependências (§ 9)

- Produção: apenas `howler`
- Dev: `typescript`, `vite`, `vite-plugin-pwa`
- Política: dependências mínimas; sem framework UI sem ADR
