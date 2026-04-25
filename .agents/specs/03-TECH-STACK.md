# 03 — TECH-STACK: Arquitetura Técnica

## § 1 — Visão Geral

Esta spec detalha a stack tecnológica completa do corre-patinho: build tooling, engine de renderização, bibliotecas, infraestrutura PWA, e estrutura de diretórios do código-fonte. Complementa `01-INTENT.md § 5` com decisões técnicas granulares.

## § 2 — Stack Completa

| Camada | Tecnologia | Versão/Nota |
|---|---|---|
| **Linguagem** | TypeScript | Conforme D-001 |
| **Bundler** | Vite | Dev server + build de produção |
| **PWA** | vite-plugin-pwa | Service Worker, manifest, cache |
| **Renderização** | Canvas 2D (API nativa) | Pseudo-3D via projeção de perspectiva |
| **Áudio** | Howler.js | Efeitos sonoros + música de fundo |
| **Persistência** | localStorage | High scores, preferências |
| **Framework UI** | Nenhum | HTML/CSS/TS vanilla para menus e HUD |

### § 2.1 — Justificativas

- **Vite**: suporte TS nativo, HMR instantâneo, ecossistema de plugins (PWA). Padrão de facto para projetos web modernos.
- **Canvas 2D pseudo-3D**: prioriza performance mobile e simplicidade. Sem dependência de WebGL. Efeito de perspectiva simulado (estilo jogos de corrida arcade dos anos 90).
- **Howler.js** (~10KB gzip): API simples, Web Audio API com fallback HTML5 Audio, sprites de áudio para SFX. Battle-tested em jogos web.
- **Sem framework UI**: a complexidade de UI do jogo (menus simples + HUD) não justifica React/Vue. HTML/CSS vanilla é suficiente e elimina overhead.

## § 3 — Engine de Renderização

### § 3.1 — Canvas 2D com Pseudo-3D

A renderização utiliza a API `CanvasRenderingContext2D` nativa do navegador. O efeito 3D é simulado via projeção de perspectiva 2D.

**Técnica de pseudo-3D:**
- O tobogã é renderizado como uma série de segmentos horizontais (scanlines) desenhados de baixo para cima
- Cada scanline é escalada e posicionada para simular profundidade (linhas superiores são menores e mais próximas do centro)
- As curvas são simuladas deslocando os segmentos horizontalmente conforme a curvatura do trecho
- Referência técnica: técnica "Mode 7" / "road rendering" usada em jogos como OutRun, F-Zero

### § 3.2 — Renderização do Patinho

- **Sprite 2D** sobreposto ao cenário pseudo-3D
- Estilo: **Cartoon 2D** com contornos, expressão facial fofa, cores vibrantes (conforme P8)
- Posição fixa na **base da tela** (visão de "cockpit" — parte superior do patinho visível)
- Animações via troca de frames/sprites:
  - Idle (descendo reto)
  - Inclinando para esquerda/direita (durante curvas)
  - Expressão de susto (ao perder vida)
  - Animação de queda (ao errar curva)

### § 3.3 — Estilo Visual

- **Cartoon 2D**: sprites desenhados com contornos, sombreamento suave
- Cores vibrantes e saturadas — paleta alegre e infantil
- Cenário: árvores estilizadas, nuvens, flores, água no tobogã
- Referências visuais: Cut the Rope, Angry Birds, jogos infantis mobile
- Alternativas rejeitadas: Low-poly 3D (incompatível com Canvas 2D), Flat/Minimal (menos atrativo para crianças de 6+), Voxel (incompatível com Canvas 2D)

### § 3.4 — Performance

- Target: **60 FPS** em dispositivos mobile mid-range
- Canvas é limpo e redesenhado a cada frame (immediate mode rendering)
- Otimizações possíveis: off-screen canvas para elementos estáticos, object pooling para segmentos do tobogã
- Sem WebGL — compatibilidade máxima com dispositivos antigos

## § 4 — Áudio

### § 4.1 — Biblioteca

**Howler.js** (MIT, ~10KB gzip)

| Feature | Uso no Projeto |
|---|---|
| **Sprites de áudio** | Múltiplos SFX num único arquivo — reduz requests HTTP |
| **Volume/fade** | Transições suaves entre menu e gameplay |
| **Loop** | Música de fundo em loop |
| **Pool** | Tocar múltiplos SFX simultaneamente sem atrasos |
| **Fallback** | Web Audio API → HTML5 Audio automaticamente |

### § 4.2 — Assets de Áudio

| Tipo | Descrição |
|---|---|
| **Música de fundo** | Loop alegre com referência ao brinquedo original (tons infantis, melodia animada) |
| **SFX — Curva** | Som de deslizar/água ao passar por curvas |
| **SFX — Queda** | Splash ao perder vida |
| **SFX — Countdown** | Contagem regressiva antes do início da partida |
| **SFX — Recorde** | Celebração ao bater recorde pessoal |
| **SFX — Game Over** | Som de fim de jogo |

### § 4.3 — Comportamento de Áudio

- **Iniciar muted** por padrão (padrão mobile — evitar som inesperado)
- Botão de mute/unmute visível no HUD e nos menus
- Preferência de mute/unmute salva em localStorage
- Respeitar Media Session API quando disponível

## § 5 — PWA

### § 5.1 — Estratégia Offline

- **Offline-first**: o jogo funciona 100% offline após o primeiro acesso
- Todos os assets (JS, CSS, sprites, áudio) são cached no primeiro carregamento
- Cache strategy: **Cache-first** para assets estáticos, **Network-first** para verificação de updates

### § 5.2 — Atualização

- Quando uma nova versão estiver disponível, o **usuário é notificado** via UI discreta (banner/toast)
- O update é aplicado no próximo reload — não interromper partida em andamento
- Implementação via `vite-plugin-pwa` com `registerType: 'prompt'`

### § 5.3 — Manifest

| Campo | Valor |
|---|---|
| `name` | Corre Patinho |
| `short_name` | Corre Patinho |
| `display` | `fullscreen` |
| `orientation` | `landscape` |
| `theme_color` | A definir (baseado na paleta Cartoon 2D) |
| `background_color` | A definir |
| `icons` | Ícone do patinho em múltiplos tamanhos |

## § 6 — Layout e Responsividade

### § 6.1 — Orientação

- **Landscape forçado** — o jogo é projetado para orientação paisagem
- Em portrait, exibir tela de aviso pedindo para girar o dispositivo
- Manifest com `"orientation": "landscape"`
- CSS: `@media (orientation: portrait)` para overlay de aviso

### § 6.2 — Aspect Ratio

- Canvas de jogo com aspect ratio **16:9** (padrão para landscape)
- Em telas com aspect ratio diferente, o canvas é centralizado com letterboxing (barras nos lados)
- Background do letterboxing: cor sólida ou gradiente temático

### § 6.3 — Desktop

- Viewport máximo: canvas centralizado, não esticar além de um tamanho máximo (~1280x720)
- Background temático ao redor do canvas
- Cursor do mouse escondido durante gameplay

## § 7 — Acessibilidade

### § 7.1 — Visual

- Contraste mínimo **WCAG AA**: 4.5:1 para texto, 3:1 para elementos gráficos
- Sinalização de curvas (modo Fácil) usa **formas além de cores** — setas direcionais, barras de intensidade, ícones de tamanho variável
- Texto do HUD (score, vidas) com fonte legível e tamanho adequado para tela mobile

### § 7.2 — Controles

- **v1:** swipe lateral (mobile) + teclado (desktop)
- **Não na v1:** gamepad, switch — reavaliar com feedback de usuários
- Controles devem ser responsivos com latência mínima

## § 8 — Estrutura de Diretórios

```
src/
├── core/
│   ├── game.ts          # Game loop, estado da partida, gerenciamento de vidas
│   ├── track.ts         # Geração procedural do percurso (PRNG, segmentos)
│   ├── physics.ts       # Modelo de física (velocidade, tolerância, inércia)
│   └── input.ts         # Captura de swipe, teclado; normalização de input
├── rendering/
│   ├── renderer.ts      # Canvas 2D pseudo-3D — renderização principal
│   ├── sprites.ts       # Carregamento e gerenciamento de sprites do patinho
│   └── camera.ts        # Projeção pseudo-3D, viewport, perspectiva
├── ui/
│   ├── hud.ts           # HUD in-game: score, vidas, mute, sinalização
│   └── menus.ts         # Menu principal, seleção de dificuldade, game over, high scores
├── audio/
│   └── audio.ts         # Wrapper Howler.js — música, SFX, mute state
├── pwa/
│   └── sw-register.ts   # Registro do Service Worker, prompt de atualização
├── utils/
│   ├── prng.ts          # PRNG seedable (mulberry32 ou similar)
│   └── storage.ts       # Wrapper localStorage — high scores, preferências
├── types/
│   └── index.ts         # Tipos compartilhados (Segment, Difficulty, GameState, etc.)
├── main.ts              # Entry point — inicialização do jogo
└── index.html           # HTML base
```

### § 8.1 — Mapeamento Módulos ↔ Spec

| Módulo (01-INTENT § 6) | Diretório | Spec de Referência |
|---|---|---|
| `core/game` | `src/core/game.ts` | 02-GAME-MECHANICS § 4, § 6 |
| `core/track` | `src/core/track.ts` | 02-GAME-MECHANICS § 3 |
| `core/input` | `src/core/input.ts` | 02-GAME-MECHANICS § 2 |
| `ui/hud` | `src/ui/hud.ts` | 02-GAME-MECHANICS § 5, § 7 |
| `ui/menus` | `src/ui/menus.ts` | 03-TECH-STACK § 6 |
| `rendering` | `src/rendering/` | 03-TECH-STACK § 3 |
| `pwa` | `src/pwa/` | 03-TECH-STACK § 5 |
| `audio` | `src/audio/` | 03-TECH-STACK § 4 |

## § 9 — Dependências

### § 9.1 — Produção

| Pacote | Versão | Uso |
|---|---|---|
| `howler` | latest | Áudio (SFX + música) |

### § 9.2 — Desenvolvimento

| Pacote | Versão | Uso |
|---|---|---|
| `typescript` | latest | Linguagem |
| `vite` | latest | Bundler + dev server |
| `vite-plugin-pwa` | latest | Service Worker + manifest |

> O projeto mantém dependências mínimas. Não adicionar frameworks UI (React, Vue, etc.) sem justificativa e ADR.

## § 10 — Decisões Registradas nesta Spec

| ID | Decisão | Fonte |
|---|---|---|
| P2 | Engine: Canvas 2D com pseudo-3D | Gap Analysis |
| P2b | Patinho: sprite 2D cartoon sobreposto | Gap Analysis |
| P3 | Build: Vite + vite-plugin-pwa | Gap Analysis |
| P8 | Estilo visual: Cartoon 2D | Gap Analysis |
| P9 | Áudio: Howler.js, loop alegre + SFX, muted | Gap Analysis |
| P10 | PWA: offline-first, notificar updates | Gap Analysis |
| P11 | Layout: landscape forçado | Gap Analysis |
| P12 | Acessibilidade: WCAG AA, formas além de cores, sem gamepad v1 | Gap Analysis |
