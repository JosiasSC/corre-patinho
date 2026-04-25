/**
 * Tipos compartilhados do corre-patinho.
 *
 * Ref: 02-GAME-MECHANICS.md § 2–7
 * Ref: 03-TECH-STACK.md § 8 — src/types/index.ts
 */

// ---------------------------------------------------------------------------
// Enums & Unions
// ---------------------------------------------------------------------------

/** Nível de dificuldade do jogo. */
export type Difficulty = 'easy' | 'normal' | 'hard';

/** Estado da partida. */
export type GameState = 'ready' | 'playing' | 'dying' | 'game-over';

/** Direção de uma curva no tobogã. */
export type CurveDirection = 'left' | 'right' | 'none';

/** Tipo de segmento do tobogã. */
export type SegmentType = 'straight' | 'curve';

/** Fase dentro de uma curva composta (sub-segmentos para transição suave). */
export type CurvePhase = 'entry' | 'apex' | 'exit' | 'full';

/** Tipo de padrão de percurso gerado. */
export type TrackPattern = 'simple' | 's-curve' | 'chicane';

/**
 * Pose visual do patinho.
 * Ref: 03-TECH-STACK.md § 3.2 — Animações via troca de frames/sprites.
 */
export type DuckPose = 'idle' | 'leanLeft' | 'leanRight' | 'scared' | 'falling';

// ---------------------------------------------------------------------------
// Track
// ---------------------------------------------------------------------------

/** Um segmento do tobogã gerado proceduralmente. */
export interface TrackSegment {
  type: SegmentType;
  /** Direção da curva (none para retos). */
  direction: CurveDirection;
  /**
   * Curvatura para renderização (-1 a +1).
   * Negativo = esquerda, positivo = direita, 0 = reto.
   * Usada pela câmera para projeção visual.
   */
  curvature: number;
  /**
   * Intensidade que o jogador precisa aplicar (0–1, valor absoluto).
   * Usada pela physics para verificação de sucesso na curva.
   * 0 para segmentos retos e fases entry/exit.
   */
  requiredIntensity: number;
  /** Comprimento do segmento em unidades do jogo. */
  length: number;
  /** Se este segmento é um checkpoint. */
  isCheckpoint: boolean;
  /** Índice sequencial no percurso. */
  index: number;
  /** Fase dentro de uma curva composta. Retos usam 'full'. */
  phase: CurvePhase;
  /** Padrão de percurso ao qual este segmento pertence. */
  pattern: TrackPattern;
}

// ---------------------------------------------------------------------------
// Game Config (constantes por dificuldade)
// ---------------------------------------------------------------------------

/**
 * Configuração imutável de uma partida, definida pela dificuldade.
 * Ref: 02-GAME-MECHANICS.md § 3.3, § 4.2, § 4.4, § 6.2
 */
export interface GameConfig {
  readonly difficulty: Difficulty;
  /** Velocidade base (multiplicador). */
  readonly speedBase: number;
  /** Velocidade máxima com rampa. */
  readonly speedMax: number;
  /** Tolerância de erro ±% (0.0–1.0). */
  readonly tolerance: number;
  /** Probabilidade de curva por segmento (0.0–1.0). */
  readonly curveFrequency: number;
  /** Intensidade máxima de curvatura (0.0–1.0). */
  readonly curveMaxIntensity: number;
  /** Comprimento mínimo de segmento reto entre curvas. */
  readonly minStraightBetweenCurves: number;
  /** Checkpoint a cada N curvas. */
  readonly checkpointInterval: number;
  /** Taxa de rampa de dificuldade (multiplicador por segundo). */
  readonly difficultyRampRate: number;
  /** Vidas iniciais. */
  readonly lives: number;
  /** Coeficiente da rampa para frequência de curvas. */
  readonly rampCurveFrequencyCoeff: number;
  /** Coeficiente da rampa para intensidade máxima de curvas. */
  readonly rampIntensityCoeff: number;
  /** Coeficiente da rampa para redução de espaçamento. */
  readonly rampSpacingCoeff: number;
}

/**
 * Configurações por dificuldade.
 * Calibrado para partida média de ~2min (Normal).
 * Ref: 02-GAME-MECHANICS.md § 3.3, § 4.2–4.4, § 6.2
 */
export const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  easy: {
    difficulty: 'easy',
    speedBase: 1.0,
    speedMax: 1.3,
    tolerance: 0.30,
    curveFrequency: 0.25,
    curveMaxIntensity: 0.45,
    minStraightBetweenCurves: 3,
    checkpointInterval: 5,
    difficultyRampRate: 0.0015,
    lives: 3,
    rampCurveFrequencyCoeff: 0.3,
    rampIntensityCoeff: 0.2,
    rampSpacingCoeff: 0.1,
  },
  normal: {
    difficulty: 'normal',
    speedBase: 1.0,
    speedMax: 1.5,
    tolerance: 0.20,
    curveFrequency: 0.40,
    curveMaxIntensity: 0.65,
    minStraightBetweenCurves: 2,
    checkpointInterval: 8,
    difficultyRampRate: 0.003,
    lives: 3,
    rampCurveFrequencyCoeff: 0.5,
    rampIntensityCoeff: 0.3,
    rampSpacingCoeff: 0.2,
  },
  hard: {
    difficulty: 'hard',
    speedBase: 1.4,
    speedMax: 2.0,
    tolerance: 0.10,
    curveFrequency: 0.55,
    curveMaxIntensity: 0.85,
    minStraightBetweenCurves: 1,
    checkpointInterval: 12,
    difficultyRampRate: 0.005,
    lives: 3,
    rampCurveFrequencyCoeff: 0.5,
    rampIntensityCoeff: 0.3,
    rampSpacingCoeff: 0.3,
  },
};

// ---------------------------------------------------------------------------
// Game Session (estado mutável da partida)
// ---------------------------------------------------------------------------

/** Estado mutável de uma partida em andamento. */
export interface GameSession {
  state: GameState;
  config: GameConfig;
  seed: number;
  /** Score = distância percorrida (unidades de jogo). */
  score: number;
  /** Score máximo (não regride com checkpoint). */
  maxScore: number;
  /** Vidas restantes. */
  lives: number;
  /** Velocidade atual (multiplicador). */
  speed: number;
  /** Posição Z no track (distância percorrida em unidades). */
  trackPosition: number;
  /** Índice do segmento atual. */
  currentSegmentIndex: number;
  /** Posição dentro do segmento atual (0.0–1.0). */
  segmentProgress: number;
  /** Índice do último checkpoint alcançado. */
  lastCheckpointIndex: number;
  /** Posição Z do último checkpoint. */
  lastCheckpointPosition: number;
  /** Tempo total de jogo (segundos). */
  elapsedTime: number;
  /** Número de curvas passadas (para rampa de dificuldade). */
  curvesCompleted: number;
  /** Timer da pausa de morte (segundos restantes). */
  deathPauseTimer: number;
}

// ---------------------------------------------------------------------------
// Player State
// ---------------------------------------------------------------------------

/** Estado do jogador (posição lateral e input). */
export interface PlayerState {
  /** Input bruto atual (-1 = full esquerda, +1 = full direita). */
  rawInput: number;
  /** Input suavizado com inércia (-1 a +1). */
  smoothInput: number;
  /** Inclinação visual do patinho (-1 a +1). */
  lean: number;
  /** Pose visual atual do patinho. */
  pose: DuckPose;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** Segmento projetado para renderização. */
export interface ProjectedSegment {
  /** Posição Y na tela. */
  screenY: number;
  /** Escala (1.0 = perto, 0.0 = horizonte). */
  scale: number;
  /** Offset X acumulado pela curvatura. */
  offsetX: number;
  /** Largura da pista nesta scanline. */
  roadWidth: number;
  /** Se é faixa clara ou escura (alternância para efeito velocidade). */
  isLightStripe: boolean;
  /** Curvatura neste ponto. */
  curvature: number;
}
