# Arquitetura de Módulos — Implementação

> Última atualização: 2026-04-25

Mapeamento dos módulos implementados, suas responsabilidades e fluxo de dados.

## Game Loop

O game loop é orquestrado por `Game` (`src/core/game.ts`):

1. `InputManager.update(dt)` — captura input bruto
2. `updatePhysics(session, player, config, dt)` — aplica velocidade, inércia, avança posição
3. `updateCurrentSegment()` — localiza segmento atual no track
4. `checkCurrentCurve()` — verifica tolerância de curva (uma vez por segmento, a 55% de progresso)
5. `Renderer.renderFrame()` — projeta e desenha tudo

**Timestep:** fixed dt (1/60s) com acumulador. Rendering desacoplado da lógica.

## Máquina de Estados

```
ready → playing → dying → playing (respawn)
                 → game-over → ready
```

- `ready`: tela de início, aguarda tap/tecla
- `playing`: gameplay ativo, lógica + rendering
- `dying`: flash vermelho, pausa de ~1s, respawn no checkpoint
- `game-over`: overlay com score, seed, prompt de retry

## Módulos

| Módulo | Arquivo | Responsabilidade |
|---|---|---|
| Types | `src/types/index.ts` | Interfaces, tipos, `DIFFICULTY_CONFIGS` |
| PRNG | `src/utils/prng.ts` | Mulberry32 seedable |
| Track | `src/core/track.ts` | `TrackGenerator` — segmentos on-demand, rampa, checkpoints |
| Physics | `src/core/physics.ts` | `updatePhysics`, `checkCurve` — velocidade, inércia, tolerância |
| Input | `src/core/input.ts` | `InputManager` — touch/swipe + teclado + mouse |
| Camera | `src/rendering/camera.ts` | `projectTrack` — scanlines pseudo-3D |
| Sprites | `src/rendering/sprites.ts` | `drawDuck`, `drawDuckIcon` — Canvas 2D procedural |
| Renderer | `src/rendering/renderer.ts` | `Renderer` — céu, tobogã, patinho, HUD |
| Game | `src/core/game.ts` | `Game` — loop, estados, orquestração |
| Main | `src/main.ts` | Entry point, canvas 1280×720, letterboxing |

## Fluxo de Dados

```
Input → rawInput → Physics (inércia) → smoothInput → Camera → Renderer
                                   ↓
                    Track (segmentos) → checkCurve → Lives
```

## Padrões Adotados

- **Resolução interna fixa** (1280×720) com CSS scaling — evita recalcular proporções
- **Geração on-demand** de segmentos — `TrackGenerator.ensureSegments()` gera lookahead de 40 segmentos
- **Verificação de curva tardia** — checada a 55% do segmento para dar tempo de ajustar
- **Score monotônico** — `maxScore` nunca regride (mesmo com respawn no checkpoint)
- **Sprite procedural** — patinho desenhado com Canvas 2D (temporário até T-010)
- **erasableSyntaxOnly** — TypeScript 6+ não permite `private` em parâmetros de construtor; campos devem ser declarados explicitamente

## Fontes
- `02-GAME-MECHANICS.md` — mecânicas (input, track, física, vidas)
- `03-TECH-STACK.md` — stack técnica (renderização, layout, estrutura)
- Sessão T-009 (2026-04-25)
