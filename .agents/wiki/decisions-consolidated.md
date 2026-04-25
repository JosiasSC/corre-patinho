---
description: >
  Decisões arquiteturais vigentes do corre-patinho, consolidadas a partir das ADRs.
  Inclui decisão final, alternativas rejeitadas (resumo) e condições de consulta.
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

## Fontes
- ADRs originais completas: `.agents/archive/adrs/`
- Specs relacionadas: `.agents/specs/`
