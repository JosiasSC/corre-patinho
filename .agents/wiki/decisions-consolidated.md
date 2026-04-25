---
description: >
  Decisões arquiteturais vigentes do corre-patinho, consolidadas a partir das ADRs
  e análise de gaps. Inclui decisão final, alternativas rejeitadas (resumo) e fonte.
  Consultar SEMPRE antes de propor mudanças arquiteturais.
  Para detalhes completos e justificativas, consultar a ADR original em
  .agents/archive/adrs/.
---

# Decisões Arquiteturais Vigentes

> Última atualização: 2026-04-24

## D-001 — Linguagem: TypeScript

- **Decisão:** TypeScript como linguagem principal
- **Alternativas rejeitadas:** JavaScript (sem tipagem estática), Dart/Flutter (menor familiaridade do desenvolvedor)
- **Justificativa:** Familiaridade do desenvolvedor; tipagem estática para manutenibilidade em projeto de jogo
- **Fonte:** `01-INTENT.md § 5`

## D-002 — Distribuição: PWA

- **Decisão:** Progressive Web App (PWA)
- **Alternativas rejeitadas:** App nativo (React Native, Flutter — custo de desenvolvimento e publicação), apenas web sem PWA (sem experiência app-like)
- **Justificativa:** Combina alcance web com experiência app-like; sem custo de publicação em lojas; público-alvo (crianças) acessa via dispositivos móveis
- **Fonte:** `01-INTENT.md § 5`

## D-003 — Perspectiva: Primeira Pessoa

- **Decisão:** Visão em primeira pessoa (perspectiva do patinho)
- **Alternativas rejeitadas:** Top-down, side-scroller, terceira pessoa
- **Justificativa:** Mais imersivo; simula a experiência de "ser o patinho" descendo o tobogã
- **Fonte:** `01-INTENT.md § 3`

## D-004 — Percurso: Geração Procedural

- **Decisão:** Tobogã com percurso gerado aleatoriamente a cada partida
- **Alternativas rejeitadas:** Percursos fixos/manuais, editor de fases
- **Justificativa:** Rejogabilidade alta; cada partida é uma experiência diferente
- **Fonte:** `01-INTENT.md § 3.3`

## D-005 — Dificuldade: 3 Níveis Discretos

- **Decisão:** 3 níveis fixos (Fácil, Normal, Difícil) com diferenciação por sinalização de curva e velocidade
- **Alternativas rejeitadas:** Dificuldade adaptativa (complexidade desnecessária), dificuldade contínua (confuso para crianças)
- **Justificativa:** Simples e claro para público infantil; progressão de desafio bem definida
- **Fonte:** `01-INTENT.md § 4`

## P1 — Input: Swipe Lateral Contínuo

- **Decisão:** Swipe lateral contínuo (mobile) + setas/A-D (desktop). Controle em tempo real enquanto passa pela curva. Full-screen gesture.
- **Alternativas rejeitadas:** Tilt/acelerômetro (sem suporte desktop, calibração complexa), slider/gauge (menos imersivo), tap-and-hold (menos intuitivo para crianças), botões discretos (limita expressividade)
- **Justificativa:** Melhor equilíbrio entre imersão, simplicidade e compatibilidade cross-platform
- **Fonte:** `02-GAME-MECHANICS.md § 2`, Gap Analysis P1

## P2 — Engine: Canvas 2D Pseudo-3D

- **Decisão:** Canvas 2D com efeito pseudo-3D (perspectiva simulada, estilo jogos de corrida arcade)
- **Alternativas rejeitadas:** Three.js (mais complexo, sem necessidade de 3D real), Babylon.js (overkill), Phaser 3 (3D limitado), PlayCanvas (vendor lock-in), R3F (adiciona React)
- **Justificativa:** Performance mobile máxima; simplicidade de implementação; sem dependência de WebGL
- **Fonte:** `03-TECH-STACK.md § 3`, Gap Analysis P2

## P3 — Build: Vite

- **Decisão:** Vite como bundler + dev server, com vite-plugin-pwa para Service Worker
- **Alternativas rejeitadas:** esbuild puro (configuração manual), Webpack (lento, overkill)
- **Justificativa:** Suporte TS nativo, HMR instantâneo, plugin PWA, padrão de facto
- **Fonte:** `03-TECH-STACK.md § 2`, Gap Analysis P3

## P4 — Percurso Infinito com Seed

- **Decisão:** Percurso infinito (~2min partida média), seed compartilhável para replay
- **Alternativas rejeitadas:** Percurso finito (limita rejogabilidade), sem seed (sem compartilhamento social)
- **Justificativa:** Loop de engajamento natural (desafiar amigos com mesma seed); duração adequada para casual
- **Fonte:** `02-GAME-MECHANICS.md § 3`, Gap Analysis P4

## P5 — Pontuação: Distância Percorrida

- **Decisão:** Score por distância percorrida, persistência local (localStorage, top 10 por dificuldade), incluso na v1
- **Alternativas rejeitadas:** Tempo de descida (só funciona com finito), curvas acertadas, combo/multiplicador (complexo para crianças), score composto (difícil de entender)
- **Justificativa:** Simples e intuitivo para público infantil; funciona naturalmente com percurso infinito
- **Fonte:** `02-GAME-MECHANICS.md § 5`, Gap Analysis P5

## P6 — Física Customizada Simplificada

- **Decisão:** Física customizada sem lib externa; gravidade básica, tolerância variável por dificuldade, inércia leve
- **Alternativas rejeitadas:** cannon-es, rapier (overkill para mecânica single-axis)
- **Justificativa:** A mecânica é single-axis em Canvas 2D; lib de física é overhead desnecessário
- **Fonte:** `02-GAME-MECHANICS.md § 4`, Gap Analysis P6

## P7 — 3 Vidas + Checkpoints

- **Decisão:** 3 vidas por partida; ao perder vida, retorna ao último checkpoint; game over ao perder todas
- **Alternativas rejeitadas:** 1 vida (muito frustrante para crianças), sem checkpoints (frustrante perder progresso)
- **Justificativa:** Reduz frustração para público infantil; checkpoints mantêm engajamento
- **Fonte:** `02-GAME-MECHANICS.md § 6`, Gap Analysis P7

## P8 — Estilo Visual: Cartoon 2D

- **Decisão:** Sprites desenhados com contornos, estilo jogo infantil mobile, cores vibrantes saturadas
- **Alternativas rejeitadas:** Low-poly 3D (incompatível com Canvas 2D), Flat/Minimal (menos atrativo para crianças), Voxel (incompatível com Canvas 2D)
- **Justificativa:** Mais imediatamente atrativo para o público-alvo (crianças 6+); compatível com Canvas 2D
- **Fonte:** `03-TECH-STACK.md § 3.3`, Gap Analysis P8

## P9 — Áudio: Howler.js

- **Decisão:** Howler.js para áudio; música de fundo (loop alegre), SFX completos, iniciar muted
- **Alternativas rejeitadas:** Web Audio API pura (mais trabalho manual), Tone.js (overkill, focada em síntese musical)
- **Justificativa:** Leve (~10KB), battle-tested em jogos web, sprites de áudio, fallback automático
- **Fonte:** `03-TECH-STACK.md § 4`, Gap Analysis P9

## P10 — PWA: Offline-first

- **Decisão:** 100% funcional offline após primeiro acesso; cache-first para assets; notificar updates
- **Alternativas rejeitadas:** Online-only (limita usabilidade), auto-update silencioso (pode quebrar partida)
- **Justificativa:** Jogo casual single-player é candidato ideal para offline-first
- **Fonte:** `03-TECH-STACK.md § 5`, Gap Analysis P10

## P11 — Layout: Landscape Forçado

- **Decisão:** Orientação landscape forçada; canvas 16:9; letterboxing; overlay de aviso em portrait
- **Alternativas rejeitadas:** Portrait (menos espaço para tobogã), ambos (complexidade de layout)
- **Justificativa:** Landscape oferece mais espaço horizontal para renderizar curvas do tobogã
- **Fonte:** `03-TECH-STACK.md § 6`, Gap Analysis P11

## P12 — Acessibilidade: WCAG AA

- **Decisão:** WCAG AA (4.5:1 texto, 3:1 gráficos); formas além de cores na sinalização; sem gamepad na v1
- **Alternativas rejeitadas:** WCAG AAA (muito restritivo para jogo infantil colorido), gamepad v1 (complexidade de input mapping)
- **Justificativa:** WCAG AA é padrão da indústria sem complexidade extra; formas garantem acessibilidade para daltonismo
- **Fonte:** `03-TECH-STACK.md § 7`, Gap Analysis P12

## Fontes
- ADRs originais completas: `.agents/archive/adrs/`
- Specs relacionadas: `.agents/specs/`
- Gap Analysis: sessão de análise de 2026-04-24
