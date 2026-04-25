---
spec: "02-GAME-MECHANICS"
title: "Mecânicas Detalhadas de Jogo"
status: "🟢 Definido"
last_updated: "2026-04-24"
sections:
  - "§ 1 — Visão Geral"
  - "§ 2 — Controles e Input"
  - "§ 3 — Geração Procedural do Percurso"
  - "§ 4 — Modelo de Física"
  - "§ 5 — Sistema de Pontuação"
  - "§ 6 — Sistema de Vidas e Derrota"
  - "§ 7 — Sinalização de Curvas (Modo Fácil)"
  - "§ 8 — Decisões Registradas"
---

# 02-GAME-MECHANICS — Summary

Mecânicas detalhadas do corre-patinho. Complementa `01-INTENT.md` com decisões granulares para implementação.

## Controles (§ 2)

- **Mobile:** swipe lateral contínuo — distância do swipe = intensidade da curva
- **Desktop:** setas ←/→ ou A/D — tempo pressionado = intensidade crescente
- Modelo **contínuo**: o jogador dosa em tempo real enquanto passa pela curva
- Full-screen gesture (swipe inicia em qualquer ponto da tela)
- Acelerômetro: não na v1

## Geração Procedural (§ 3)

- Percurso **infinito** — meta é sobreviver o máximo possível (~2min partida média)
- Segmentos: retos (sem input) + curvos (requerem input)
- Parâmetros variam por dificuldade: frequência, intensidade, espaçamento, velocidade, rampa
- **Seed compartilhável** — mesma seed + dificuldade = mesmo percurso (PRNG seedable)
- Validação inline durante geração (sem pós-processamento)

## Física (§ 4)

- **Customizada simplificada** — sem lib externa
- Aceleração gradual (gravidade) → estabiliza na velocidade-alvo
- Velocidade: Fácil 1.0x, Normal 1.0x, Difícil 1.4x (com rampa progressiva)
- Tolerância de erro: Fácil ±30%, Normal ±20%, Difícil ±10%
- Inércia leve (~200ms decay) para suavidade

## Pontuação (§ 5)

- Critério: **distância percorrida** (incrementa continuamente)
- **v1** — incluído na primeira versão
- Persistência: localStorage, top 10 por dificuldade
- Game over exibe: score, recorde pessoal, seed, retry/novo jogo

## Vidas e Derrota (§ 6)

- **3 vidas** por partida
- Erro na curva = perde 1 vida, retorna ao **último checkpoint**
- Score NÃO regride ao voltar ao checkpoint
- Checkpoints: a cada ~5 curvas (Fácil), ~8 (Normal), ~12 (Difícil)
- Game over: ao perder todas as 3 vidas

## Sinalização — Modo Fácil (§ 7)

- Indicador visual antes de cada curva: direção + intensidade recomendada
- Usa **formas além de cores** (acessibilidade): setas, gauge, ícones de tamanho variável
