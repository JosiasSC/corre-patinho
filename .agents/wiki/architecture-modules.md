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
6. `computeUpcomingCurve()` — busca próxima curva apex para sinalização (modo Fácil)
7. `Renderer.renderFrame()` — projeta e desenha tudo (inclui HUD via delegação)

**Timestep:** fixed dt (1/60s) com acumulador. Rendering desacoplado da lógica.

## Máquina de Estados

```
title → difficulty-select → playing → dying → playing (respawn)
                                     → game-over → title | playing (retry)
title → high-scores → title
game-over → high-scores → game-over
```

- `title`: tela de título com botões Jogar e Recordes
- `difficulty-select`: 3 cards (Fácil/Normal/Difícil) com descrição e velocidade
- `playing`: gameplay ativo, lógica + rendering
- `dying`: flash vermelho, pausa de ~1s, respawn no checkpoint
- `game-over`: overlay com score, recorde, seed, retry, recordes, menu
- `high-scores`: top 10 por dificuldade com tabs, botão voltar (contexto-aware)

## Módulos

| Módulo | Arquivo | Responsabilidade |
|---|---|---|
| Types | `src/types/index.ts` | Interfaces, tipos, `DuckPose`, `UpcomingCurve`, `DIFFICULTY_CONFIGS` |
| PRNG | `src/utils/prng.ts` | Mulberry32 seedable |
| Storage | `src/utils/storage.ts` | Persistência localStorage — mute preference (T-013), high scores (T-014) |
| Track | `src/core/track.ts` | `TrackGenerator` — sub-segmentos entry/apex/exit, S-curves, chicanes, rampa multidimensional |
| Physics | `src/core/physics.ts` | `updatePhysics`, `checkCurve` — velocidade, inércia, `requiredIntensity` |
| Input | `src/core/input.ts` | `InputManager` — touch/swipe + teclado + mouse, dead zone, multi-touch rejection (T-012) |
| Camera | `src/rendering/camera.ts` | `projectTrack` — scanlines pseudo-3D |
| Sprites | `src/rendering/sprites.ts` | `drawDuck(pose)`, `drawDuckIcon` — Canvas 2D com 5 poses |
| Scenery | `src/rendering/scenery.ts` | Cenário: nuvens, árvores, flores, montanhas, sol, grama |
| Renderer | `src/rendering/renderer.ts` | `Renderer` — céu, cenário, tobogã, patinho; delega HUD ao módulo `HUD`; `drawSky()` público para reuso |
| HUD | `src/ui/hud.ts` | `HUD` — score, vidas (shake), mute (procedural + hit-test + callback), sinalização de curvas (T-013) |
| Menus | `src/ui/menus.ts` | `MenuRenderer` — título, dificuldade, game over, high scores; hit-test de botões com bounding rects (T-014) |
| Audio | `src/audio/audio.ts` | `AudioManager` — singleton, geração procedural (OfflineAudioContext→WAV→Howl), música loop, 7 SFX, mute global (T-015) |
| Game | `src/core/game.ts` | `Game` — loop, 6 estados, orquestração, menus, click handler unificado, audio triggers (T-014, T-015) |
| Main | `src/main.ts` | Entry point, canvas 1280×720, letterboxing |

## Fluxo de Dados

```
Input → rawInput → Physics (inércia) → smoothInput → Camera → Renderer
                                   ↓
                    Track (segmentos) → checkCurve → Lives → AudioManager (SFX)
                                                              ↕
                                            HUD (mute toggle) → AudioManager (mute)
                                                              ↕
                                            Game (state transitions) → AudioManager (music)
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
- **HUD como módulo dedicado** — `HUD` instanciada pelo `Renderer` (DI), renderiza score, vidas, mute e sinalização (T-013)
- **Hit-test canvas para mute** — coordenadas CSS→canvas via `getBoundingClientRect()` + escala, hit area expandida 50% para mobile (T-013)
- **Mute persistido** — `localStorage` via `storage.ts`, default muted (§ 4 03-TECH-STACK) (T-013)
- **Sinalização de curvas (Easy)** — seta + gauge + formas por intensidade (leve/média/forte), fade-in/out + pulsação de urgência (T-013)
- **Acessibilidade na sinalização** — codificação por forma (tamanho do triângulo) + cor + label textual, nunca só cor (P12, § 7) (T-013)
- **Menus Canvas 2D** — `MenuRenderer` renderiza 4 telas no canvas (sem DOM), registra bounding rects de botões para hit-test (T-014)
- **Click handler unificado** — `Game.setupClickHandler()` converte CSS→canvas e delega para `MenuRenderer` ou `HUD` conforme estado (T-014)
- **High scores** — top 10 por dificuldade em localStorage, validação de integridade na leitura, save retorna booleano de recorde (T-014)
- **Fade-in de telas** — `MenuRenderer` incrementa `fadeAlpha` 0→1 ao trocar de estado para transição suave (T-014)
- **Contexto-aware back** — `previousState` permite que o botão Voltar de high-scores retorne ao game-over ou ao título (T-014)
- **Áudio procedural** — toda música e SFX gerados via `OfflineAudioContext` → WAV data URI → `Howl`. Zero assets externos de áudio (T-015)
- **AudioManager singleton** — `AudioManager.instance()`, init lazy na primeira interação do usuário (Web Audio API autoplay policy) (T-015)
- **Mute global via Howler** — `Howler.mute()` controla todo o áudio; HUD callback `onMuteToggle` sincroniza com AudioManager (T-015)
- **Música com fade** — `playMusic()` fade-in 800ms, `stopMusic()` fade-out 600ms para transições suaves (T-015)
- **SFX state-driven** — `Game` dispara SFX nas transições: curva→curve, vida→loseLife, game over→gameOver/record, menus→menuClick (T-015)

## Fontes
- `02-GAME-MECHANICS.md` — mecânicas (input, track, física, vidas, sinalização § 7)
- `03-TECH-STACK.md` — stack técnica (renderização, layout, estrutura, áudio § 4)
- Sessão T-009 (2026-04-25), T-010 (2026-04-25), T-011 (2026-04-25), T-012 (2026-04-25), T-013 (2026-04-25), T-014 (2026-04-25), T-015 (2026-04-25)
