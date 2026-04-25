/**
 * Tipos compartilhados do corre-patinho.
 *
 * Ref: 03-TECH-STACK.md § 8 — src/types/index.ts
 */

/** Nível de dificuldade do jogo. */
export type Difficulty = 'easy' | 'normal' | 'hard';

/** Estado da partida. */
export type GameState = 'menu' | 'playing' | 'paused' | 'game-over';

/** Direção de uma curva no tobogã. */
export type CurveDirection = 'left' | 'right';

/** Tipo de segmento do tobogã. */
export type SegmentType = 'straight' | 'curve-left' | 'curve-right';

/** Um segmento do tobogã gerado proceduralmente. */
export interface TrackSegment {
  type: SegmentType;
  /** Intensidade da curvatura (0 = reto, 1 = máximo). */
  curvature: number;
  /** Comprimento do segmento em unidades do jogo. */
  length: number;
}
