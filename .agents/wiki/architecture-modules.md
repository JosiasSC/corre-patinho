# Arquitetura de Módulos — Implementação

> Última atualização: 2026-04-25

Mapeamento dos módulos implementados, suas responsabilidades e fluxo de dados.

## Game Loop

O game loop é orquestrado por `Game` (`src/core/game.ts`):

1. `InputManager.update(dt)` — captura input bruto
2. `updatePhysics(session, player, config, dt)` — aplica velocidade, inércia, avança posição
3. `updateCurrentSegment()` — localiza segmento atual no track
4. `checkCurrentCurve()` — verifica tolerância de curva (apenas na fase `apex`, a 45% de progresso)
5. `computeDuckPose()` — determina pose visual do patinho (idle/lean/scared/falling)
6. `Renderer.renderFrame()` — projeta e desenha tudo

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
| Types | `src/types/index.ts` | Interfaces, tipos, `DuckPose`, `DIFFICULTY_CONFIGS` |
| PRNG | `src/utils/prng.ts` | Mulberry32 seedable |
| Track | `src/core/track.ts` | `TrackGenerator` — sub-segmentos entry/apex/exit, S-curves, chicanes, rampa multidimensional |
| Physics | `src/core/physics.ts` | `updatePhysics`, `checkCurve` — velocidade, inércia, `requiredIntensity` |
| Input | `src/core/input.ts` | `InputManager` — touch/swipe + teclado + mouse, dead zone, multi-touch rejection (T-012) |
| Camera | `src/rendering/camera.ts` | `projectTrack` — scanlines pseudo-3D |
| Sprites | `src/rendering/sprites.ts` | `drawDuck(pose)`, `drawDuckIcon` — Canvas 2D com 5 poses |
| Scenery | `src/rendering/scenery.ts` | Cenário: nuvens, árvores, flores, montanhas, sol, grama |
| Renderer | `src/rendering/renderer.ts` | `Renderer` — céu, cenário, tobogã, patinho, HUD |
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
- **Geração on-demand** de segmentos — `TrackGenerator.ensureSegments()` gera lookahead de 60 segmentos
- **Sub-segmentos de transição** — cada curva é decomposta em 3 fases: entry (easing in), apex (verificação), exit (easing out) (T-011)
- **Padrões compostos** — S-curves (2 curvas opostas) e chicanes (3 curvas alternadas) com warm-up de 4 curvas simples (T-011)
- **Rampa multidimensional** — `rampFactor` afeta frequência, intensidade e espaçamento com coeficientes independentes (T-011)
- **Verificação de curva na fase apex** — `requiredIntensity` é campo explícito; fases entry/exit passam automaticamente (T-011)
- **Score monotônico** — `maxScore` nunca regride (mesmo com respawn no checkpoint)
- **Sprite procedural aprimorado** — patinho desenhado com Canvas 2D em 5 poses: idle, leanLeft, leanRight, scared, falling (T-010)
- **Cenário Canvas 2D** — sol animado, montanhas, nuvens, árvores, flores e grama nas margens da pista (T-010)
- **erasableSyntaxOnly** — TypeScript 6+ não permite `private` em parâmetros de construtor; campos devem ser declarados explicitamente
- **AbortController para listeners** — todos os event listeners registrados via `{ signal }`, canceláveis em `destroy()` para lifecycle limpo (T-012)
- **Dead zone de input** — `|direction| < 0.05` tratado como 0, com remapeamento da faixa útil para evitar micro-movimentos involuntários (T-012)
- **Multi-touch rejection** — `activeTouchId` rastreia o primeiro toque; toques adicionais são ignorados (T-012)
- **Swipe dinâmico** — `SWIPE_MAX_DISTANCE = min(vw * 0.15, 150px)`, recalculado no resize (T-012)
- **Retorno gradual ao centro** — ao soltar input, `direction` não zera; physics.ts aplica decay exponencial ~200ms via `smoothInput` (T-012, § 2.2 + § 4.5)
- **Rampa quadrática de teclado** — `intensity = (holdTime * rate)²` para controle fino no início (T-012)

## Fontes
- `02-GAME-MECHANICS.md` — mecânicas (input, track, física, vidas)
- `03-TECH-STACK.md` — stack técnica (renderização, layout, estrutura)
- Sessão T-009 (2026-04-25), T-010 (2026-04-25), T-011 (2026-04-25), T-012 (2026-04-25)
