# 01 — INTENT: Domínio, Glossário e Decisões Iniciais

## § 1 — Visão Geral

**corre-patinho** é um jogo casual para crianças a partir de 6 anos, inspirado no brinquedo físico "Patinho Escorregador" — um brinquedo onde patinhos sobem uma escada mecânica e descem por um tobogã em loop contínuo.

No jogo digital, o jogador controla um patinho descendo por um tobogã (escorregador) com curvas e obstáculos. A dinâmica central é **ajustar a intensidade das curvas** para que o patinho não caia do tobogã durante a descida.

- **Público-alvo:** crianças de 6 anos ou mais
- **Plataforma:** Web (PWA — Progressive Web App), otimizado para smartphones e tablets
- **Perspectiva:** primeira pessoa (visão do patinho descendo o tobogã)
- **Inspiração:** brinquedo "Patinho Escorregador" (tobogã + escada mecânica automática)

## § 2 — Glossário

| Termo | Definição |
|---|---|
| **Patinho** | Personagem controlado pelo jogador; desce o tobogã |
| **Tobogã** | Pista de descida com curvas; percurso gerado aleatoriamente a cada partida |
| **Curva** | Trecho do tobogã com curvatura lateral; o jogador deve ajustar a intensidade para não cair |
| **Intensidade da curva** | Grau de inclinação/força que o jogador aplica ao fazer uma curva — muito pouco e o patinho não vira o suficiente; demais e ele cai para fora |
| **Sinalização de curva** | Indicador visual que aparece antes de uma curva, mostrando a intensidade recomendada (presente apenas no modo Fácil) |
| **Partida** | Uma sessão completa de descida do tobogã, do topo até o final ou até o patinho cair |
| **PWA** | Progressive Web App — aplicação web que pode ser instalada e usada como app nativo |

## § 3 — Mecânicas de Jogo

### § 3.1 — Dinâmica Central

- O tobogã tem um **percurso aleatório** gerado a cada partida
- O percurso é composto por trechos retos e trechos curvos (esquerda/direita)
- O jogador deve **escolher a intensidade da curva** ao passar por cada trecho curvo
- Se a intensidade for inadequada (muito pouca ou em excesso), o patinho **cai do tobogã** e a partida termina
- A visão é em **primeira pessoa** — o jogador vê o tobogã da perspectiva do patinho

### § 3.2 — Controles

- Interação principal via **touch/swipe** (mobile) ou **mouse/teclado** (desktop)
- Detalhes em `02-GAME-MECHANICS.md § 2`

### § 3.3 — Geração de Percurso

- O percurso do tobogã é **gerado proceduralmente** a cada partida
- Os parâmetros da geração (quantidade de curvas, severidade, comprimento) variam conforme o nível de dificuldade
- Detalhes do algoritmo de geração em `02-GAME-MECHANICS.md § 3`

## § 4 — Níveis de Dificuldade

O jogo possui **3 níveis de dificuldade**:

| Nível | Sinalização de Curva | Velocidade | Descrição |
|---|---|---|---|
| **Fácil** | ✅ Sim — indicador visual mostra a intensidade recomendada antes de cada curva | Normal | Para jogadores iniciantes; a sinalização prévia ajuda a antecipar as curvas |
| **Normal** | ❌ Não — sem indicador de intensidade | Normal | Para jogadores com alguma prática; exige atenção e reflexo para avaliar a curva por conta própria |
| **Difícil** | ❌ Não — sem indicador de intensidade | Rápida | Para jogadores experientes; sem sinalização e com velocidade aumentada, exigindo reflexo rápido |

## § 5 — Stack Tecnológica

| Aspecto | Decisão |
|---|---|
| **Linguagem** | TypeScript |
| **Plataforma** | Web (PWA) |
| **Dispositivos-alvo** | Smartphones e tablets (mobile-first), com suporte a desktop |
| **Renderização** | Canvas 2D com pseudo-3D (detalhes em `03-TECH-STACK.md § 3`) |
| **Build/tooling** | Vite (detalhes em `03-TECH-STACK.md § 2`) |

### § 5.1 — Justificativa

- **TypeScript** foi escolhido por familiaridade do desenvolvedor e tipagem estática
- **PWA** atende o requisito de rodar como app em dispositivos móveis sem necessidade de publicação em lojas de apps
- **Mobile-first** pois o público-alvo (crianças) usará principalmente smartphones e tablets

## § 6 — Estrutura de Módulos (Preliminar)

> Estrutura preliminar. Será refinada conforme as specs de cada módulo forem criadas.

| Módulo | Responsabilidade |
|---|---|
| `core/game` | Loop principal do jogo, estado da partida, física da descida |
| `core/track` | Geração procedural do percurso do tobogã |
| `core/input` | Captura e interpretação de inputs do jogador (touch, mouse, teclado) |
| `ui/hud` | Interface durante o jogo (HUD) — velocímetro, sinalização de curvas, score |
| `ui/menus` | Telas de menu — seleção de dificuldade, início, game-over |
| `rendering` | Renderização do tobogã e do patinho (engine a definir) |
| `pwa` | Service Worker, manifest, cache — infraestrutura PWA |
| `audio` | Efeitos sonoros e música de fundo |

## § 7 — Decisões Iniciais

| ID | Decisão | Alternativas Consideradas | Justificativa |
|---|---|---|---|
| D-001 | Linguagem: TypeScript | JavaScript, Dart (Flutter) | Familiaridade do desenvolvedor; tipagem estática para manutenibilidade |
| D-002 | Distribuição: PWA | App nativo (React Native, Flutter), apenas web | PWA combina alcance web com experiência app-like; sem custo de publicação em lojas |
| D-003 | Perspectiva: primeira pessoa | Top-down, side-scroller, terceira pessoa | Mais imersivo; simula a experiência de "ser o patinho" no tobogã |
| D-004 | Percurso: gerado aleatoriamente | Percursos fixos/manuais, editor de fases | Rejogabilidade alta; cada partida é uma experiência diferente |
| D-005 | 3 níveis de dificuldade | Dificuldade adaptativa, dificuldade contínua | Simples e claro para o público infantil; progressão de desafio bem definida |

## § 8 — Escopo Futuro (Não Incluso na v1)

Itens identificados que podem ser explorados em versões futuras:

- Personalização visual do patinho (cores, acessórios)
- Modos multiplayer (corrida lado a lado)
- Animação do patinho subindo a escada (referência ao brinquedo original) como tela de loading
- Progressão de fases com dificuldade crescente dentro de cada nível
- Controle via acelerômetro (opção alternativa de input)
- Suporte a gamepad e switch (acessibilidade)
