# 02 — GAME-MECHANICS: Mecânicas Detalhadas de Jogo

## § 1 — Visão Geral

Esta spec detalha as mecânicas de jogo do corre-patinho: controles, geração procedural do percurso, modelo de física, sistema de pontuação e condições de derrota. Complementa `01-INTENT.md` com decisões granulares necessárias para implementação.

## § 2 — Controles e Input

### § 2.1 — Mecânica de Input

O jogador controla a intensidade da curva em **tempo real** (modelo contínuo) enquanto o patinho passa por cada trecho curvo do tobogã.

| Plataforma | Método | Mapeamento |
|---|---|---|
| **Mobile (primário)** | Swipe lateral (arrastar dedo) | Distância horizontal do swipe → intensidade da curva. Arrastar para esquerda = curva à esquerda; para direita = curva à direita |
| **Desktop (fallback)** | Setas ←/→ ou teclas A/D | Enquanto pressionada, aplica intensidade crescente na direção correspondente. Soltar = parar de curvar |

### § 2.2 — Modelo Contínuo

- O controle é **contínuo**: o jogador ajusta a intensidade em tempo real enquanto passa pela curva
- Não há momento de "escolha prévia" — o feedback é imediato
- A intensidade aplicada é proporcional à distância do swipe (mobile) ou ao tempo de tecla pressionada (desktop)
- Ao soltar o dedo/tecla, a intensidade retorna gradualmente a zero (centro)

### § 2.3 — Zona de Interação (Mobile)

- O swipe pode ser iniciado em **qualquer ponto da tela** (full-screen gesture)
- Não há botões fixos na tela para curvar — a área de toque é a tela inteira
- A direção do swipe é relativa ao ponto de toque inicial (não à posição absoluta na tela)

### § 2.4 — Acelerômetro

- **Não incluso na v1**
- Candidato para versão futura como opção alternativa de controle
- Se implementado no futuro, será opt-in nas configurações com calibração

## § 3 — Geração Procedural do Percurso

### § 3.1 — Tipo de Percurso

- O percurso é **infinito** — não há "fim" do tobogã
- A meta do jogador é **sobreviver o máximo possível**, percorrendo a maior distância
- A dificuldade do percurso aumenta gradualmente ao longo da descida (curvas mais fechadas, menor espaçamento entre curvas)
- A duração-alvo de uma partida média é **~2 minutos** (calibrar parâmetros de dificuldade para esse tempo)

### § 3.2 — Estrutura do Percurso

O percurso é composto por uma sequência de **segmentos**:

| Tipo de Segmento | Descrição |
|---|---|
| **Reto** | Trecho sem curvatura; o patinho desce em linha reta |
| **Curva** | Trecho com curvatura lateral (esquerda ou direita); requer input do jogador |

Cada segmento possui:
- **Direção da curva**: esquerda, direita, ou nenhuma (reto)
- **Intensidade requerida**: valor numérico representando a intensidade ideal para percorrer a curva com segurança (0 para retos)
- **Comprimento**: duração/extensão do segmento

### § 3.3 — Parâmetros por Dificuldade

Os parâmetros da geração procedural variam conforme o nível de dificuldade (D-005):

| Parâmetro | Fácil | Normal | Difícil |
|---|---|---|---|
| **Frequência de curvas** | Baixa — mais trechos retos entre curvas | Média | Alta — curvas mais frequentes |
| **Intensidade máxima das curvas** | Suave (valores baixos) | Moderada | Severa (valores altos) |
| **Espaçamento mínimo entre curvas** | Grande — tempo generoso para preparar | Médio | Pequeno — curvas em sequência rápida |
| **Velocidade base** | Normal | Normal | Rápida (conforme D-005) |
| **Sinalização de curva** | ✅ Sim — indicador visual com intensidade recomendada | ❌ Não | ❌ Não |
| **Rampa de dificuldade** | Lenta — demora mais para ficar difícil | Média | Rápida — escala rapidamente |

### § 3.4 — Seed e Compartilhamento

- Cada percurso é gerado a partir de uma **seed numérica**
- A seed é exibida na tela de game over e na tela de high scores
- O jogador pode **compartilhar a seed** para que outros joguem o mesmo percurso
- A mesma seed + mesma dificuldade = mesmo percurso (determinístico)
- Implementação: usar PRNG (Pseudo-Random Number Generator) seedable — ex: `mulberry32` ou similar

### § 3.5 — Validação do Percurso

- As curvas geradas devem ser **sempre jogáveis** — nunca gerar curvas impossíveis
- Validação via constraints durante a geração:
  - Intensidade da curva nunca excede o máximo definido para a dificuldade
  - Espaçamento mínimo entre curvas respeita o tempo de reação humano
  - Curvas consecutivas na mesma direção não excedem um limite (evitar monotonia)
- Não é necessário validação pós-geração — constraints inline são suficientes

## § 4 — Modelo de Física

### § 4.1 — Abordagem

Física **customizada simplificada** — sem lib externa (cannon-es, rapier, etc.). A mecânica é single-axis (esquerda/direita) e não requer simulação de física realista.

### § 4.2 — Velocidade e Aceleração

- O patinho possui **aceleração gradual** (gravidade simulada) no início da partida
- Após atingir a velocidade-alvo (definida pela dificuldade), a velocidade se estabiliza
- A velocidade pode aumentar levemente ao longo da partida como parte da rampa de dificuldade
- Velocidade base por dificuldade:

| Dificuldade | Velocidade Base | Velocidade Máxima (rampa) |
|---|---|---|
| Fácil | 1.0x | 1.3x |
| Normal | 1.0x | 1.5x |
| Difícil | 1.4x | 2.0x |

> Os valores acima são referência inicial. Calibrar durante prototipagem.

### § 4.3 — Mecânica de Curvas

- O jogador aplica intensidade na direção da curva via swipe/tecla
- A intensidade aplicada é comparada com a **intensidade requerida** da curva
- Se a diferença (erro) estiver dentro da **faixa de tolerância**, o patinho passa com segurança
- Se o erro exceder a tolerância, o patinho **perde uma vida**

### § 4.4 — Faixa de Tolerância

A tolerância define o quão preciso o jogador precisa ser:

| Dificuldade | Tolerância (margem de erro) |
|---|---|
| Fácil | ±30% — margem generosa |
| Normal | ±20% |
| Difícil | ±10% — precisa ser preciso |

> Valores de referência. Calibrar para que a partida média dure ~2 minutos na dificuldade Normal.

### § 4.5 — Inércia

- Há **inércia leve** no controle: ao soltar o swipe/tecla, a intensidade não zera instantaneamente
- A inércia adiciona suavidade ao controle e evita movimentos bruscos
- O tempo de decay da inércia é curto (~200ms) para manter responsividade

## § 5 — Sistema de Pontuação

### § 5.1 — Critério de Score

- O score é baseado na **distância percorrida** (metros/unidades de segmentos completados)
- O score é exibido no HUD durante a partida
- O score incrementa continuamente enquanto o patinho está descendo
- Incluso na **v1** — não é escopo futuro

### § 5.2 — Persistência Local

- High scores são salvos localmente no dispositivo via **localStorage**
- Armazenar os **top 10 scores** por dificuldade
- Cada entrada salva: score (distância), seed, data, dificuldade
- Tela de high scores acessível no menu principal

### § 5.3 — Score na Tela de Game Over

A tela de game over exibe:
- Score da partida atual (distância)
- Melhor score pessoal (na mesma dificuldade)
- Se bateu recorde pessoal (feedback visual de celebração)
- Seed do percurso (para compartilhamento)
- Botões: retry (mesma seed), novo jogo (nova seed), mudar dificuldade, menu principal

## § 6 — Sistema de Vidas e Derrota

### § 6.1 — Vidas

- O jogador inicia cada partida com **3 vidas**
- Ao errar uma curva (erro além da tolerância), o patinho **perde 1 vida**
- O jogo **não termina imediatamente** ao perder uma vida — o patinho retorna ao último checkpoint
- O jogo termina (game over) quando o jogador perde **todas as 3 vidas**
- As vidas restantes são exibidas no HUD (ícones de patinho ou corações)

### § 6.2 — Checkpoints

- Checkpoints são posicionados ao longo do percurso em **intervalos regulares**
- Ao perder uma vida, o patinho retorna ao **último checkpoint atingido**
- O score NÃO regride ao voltar ao checkpoint — mantém a distância máxima alcançada
- A frequência de checkpoints varia por dificuldade:

| Dificuldade | Frequência de Checkpoints |
|---|---|
| Fácil | A cada ~5 curvas |
| Normal | A cada ~8 curvas |
| Difícil | A cada ~12 curvas |

> Valores de referência. Calibrar para balancear frustração vs. desafio.

### § 6.3 — Feedback de Perda de Vida

- Animação breve de "queda" do patinho (ou câmera tremendo/flash na tela)
- Som de splash/queda (se áudio ativado)
- Pausa momentânea (~1s) antes de reposicionar no checkpoint
- Indicador de vidas no HUD atualiza imediatamente

### § 6.4 — Game Over

Quando todas as 3 vidas são perdidas:
- Animação final de derrota
- Transição para tela de game over (§ 5.3)
- O percurso gerado é descartado (a menos que o jogador use retry com mesma seed)

## § 7 — Sinalização de Curvas (Modo Fácil)

Exclusivo para o modo Fácil (conforme D-005):

- Um **indicador visual** aparece antes de cada curva
- O indicador mostra a **direção** (esquerda/direita) e a **intensidade recomendada**
- A sinalização usa **formas além de cores** para acessibilidade (conforme P12):
  - Seta direcional (←/→)
  - Gauge/barra de intensidade
  - Forma/ícone diferente para cada faixa de intensidade (ex: triângulo pequeno = leve, triângulo grande = forte)
- O indicador aparece com antecedência suficiente para o jogador se preparar (~1-2 segundos antes da curva, conforme velocidade)

## § 8 — Decisões Registradas nesta Spec

| ID | Decisão | Fonte |
|---|---|---|
| P1 | Input: swipe lateral contínuo (mobile) + setas/A-D (desktop) | Gap Analysis |
| P4 | Percurso infinito, ~2min, seed compartilhável | Gap Analysis |
| P5 | Pontuação por distância percorrida, v1, localStorage | Gap Analysis |
| P6 | Física customizada simplificada | Gap Analysis |
| P7 | 3 vidas + checkpoints | Gap Analysis |
