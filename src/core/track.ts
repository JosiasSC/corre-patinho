/**
 * Geração procedural do percurso (PRNG seedable, segmentos, rampa).
 *
 * Gera segmentos retos e curvos com sub-segmentos de transição
 * (entry/apex/exit) para curvas orgânicas. Suporta padrões compostos
 * (S-curve, chicane) com rampa de dificuldade multidimensional.
 *
 * Ref: 02-GAME-MECHANICS.md § 3
 * Ref: 03-TECH-STACK.md § 8 — src/core/track.ts
 */

import type { GameConfig, TrackSegment, CurveDirection, TrackPattern } from '../types/index.ts';
import { createPRNG, randomRange } from '../utils/prng.ts';
import type { PRNG } from '../utils/prng.ts';

/** Número máximo de segmentos buffered à frente do jogador. */
const LOOKAHEAD = 60;

/** Comprimento base de um segmento em unidades do jogo. */
const BASE_SEGMENT_LENGTH = 80;

/** Máximo de curvas consecutivas na mesma direção (Ref: § 3.5). */
const MAX_SAME_DIRECTION = 3;

/** Número mínimo de curvas simples antes de padrões compostos (warm-up). */
const WARMUP_CURVES = 4;

/** Proporção de comprimento para fases entry/exit vs. apex. */
const ENTRY_EXIT_RATIO = 0.25;

// ---------------------------------------------------------------------------
// Parâmetros efetivos (com rampa aplicada)
// ---------------------------------------------------------------------------

/** Parâmetros efetivos após aplicar rampa de dificuldade. */
interface EffectiveParams {
  curveFrequency: number;
  curveMaxIntensity: number;
  minStraightBetweenCurves: number;
  patternChance: number; // Probabilidade de padrão composto
}

/** Calcula parâmetros efetivos aplicando rampa multidimensional. */
function getEffectiveParams(config: GameConfig, rampFactor: number): EffectiveParams {
  return {
    curveFrequency: Math.min(
      config.curveFrequency + rampFactor * config.rampCurveFrequencyCoeff,
      0.8,
    ),
    curveMaxIntensity: Math.min(
      config.curveMaxIntensity + rampFactor * config.rampIntensityCoeff,
      1.0,
    ),
    minStraightBetweenCurves: Math.max(
      Math.round(config.minStraightBetweenCurves - rampFactor * config.rampSpacingCoeff * 5),
      0,
    ),
    patternChance: Math.min(rampFactor * 0.15, 0.35),
  };
}

// ---------------------------------------------------------------------------
// TrackGenerator
// ---------------------------------------------------------------------------

/**
 * Gerador incremental de percurso.
 * Gera segmentos on-demand conforme o jogador avança.
 * Suporta sub-segmentos de transição e padrões compostos.
 */
export class TrackGenerator {
  private readonly prng: PRNG;
  private readonly config: GameConfig;

  /** Segmentos já gerados. */
  readonly segments: TrackSegment[] = [];

  /** Contagem de curvas geradas (para checkpoints). */
  private curveCount = 0;

  /** Segmentos desde a última curva (para espaçamento mínimo). */
  private segmentsSinceLastCurve = 0;

  /** Direção da última curva (para alternância). */
  private lastCurveDirection: 'left' | 'right' = 'right';

  /** Contagem de curvas consecutivas na mesma direção. */
  private sameDirectionCount = 0;

  /** Fator de rampa de dificuldade (cresce com o tempo). */
  private rampFactor = 0;

  constructor(seed: number, config: GameConfig) {
    this.prng = createPRNG(seed);
    this.config = config;

    // Gerar primeiros segmentos retos para aceleração inicial
    for (let i = 0; i < 5; i++) {
      this.addStraight();
    }
  }

  /** Garante que existam segmentos suficientes à frente da posição dada. */
  ensureSegments(currentIndex: number): void {
    while (this.segments.length < currentIndex + LOOKAHEAD) {
      this.generateNext();
    }
  }

  /** Atualiza o fator de rampa baseado no tempo decorrido. */
  updateRamp(elapsedTime: number): void {
    this.rampFactor = elapsedTime * this.config.difficultyRampRate;
  }

  /** Retorna a posição Z acumulada no início do segmento de índice dado. */
  getSegmentStartZ(index: number): number {
    let z = 0;
    for (let i = 0; i < index && i < this.segments.length; i++) {
      z += this.segments[i].length;
    }
    return z;
  }

  /** Retorna o segmento no índice dado, gerando se necessário. */
  getSegment(index: number): TrackSegment {
    this.ensureSegments(index);
    return this.segments[index];
  }

  // ---------------------------------------------------------------------------
  // Private — Geração de segmentos
  // ---------------------------------------------------------------------------

  private generateNext(): void {
    const params = getEffectiveParams(this.config, this.rampFactor);

    // Decidir se gera curva ou reto
    const canCurve = this.segmentsSinceLastCurve >= params.minStraightBetweenCurves;

    if (canCurve && this.prng() < params.curveFrequency) {
      // Tentar padrão composto (se warmed up)
      if (this.curveCount >= WARMUP_CURVES && this.prng() < params.patternChance) {
        this.addCompositePattern(params);
      } else {
        this.addCurveWithTransitions(params, 'simple');
      }
    } else {
      this.addStraight();
    }
  }

  /**
   * Adiciona um segmento reto.
   */
  private addStraight(): void {
    const length = BASE_SEGMENT_LENGTH * randomRange(this.prng, 0.8, 1.4);
    this.pushSegment({
      type: 'straight',
      direction: 'none',
      curvature: 0,
      requiredIntensity: 0,
      length,
      isCheckpoint: false,
      phase: 'full',
      pattern: 'simple',
    });
    this.segmentsSinceLastCurve++;
  }

  /**
   * Adiciona uma curva com sub-segmentos de transição (entry/apex/exit).
   * Cria 3 TrackSegments internos para curva orgânica.
   */
  private addCurveWithTransitions(
    params: EffectiveParams,
    pattern: TrackPattern,
    forcedDirection?: 'left' | 'right',
    forcedIntensity?: number,
  ): void {
    // Decidir direção — evitar mais de MAX_SAME_DIRECTION consecutivas
    const direction = forcedDirection ?? this.pickDirection();

    // Intensidade da curvatura com rampa
    const minIntensity = 0.15;
    const intensity = forcedIntensity ?? randomRange(this.prng, minIntensity, params.curveMaxIntensity);
    const signedCurvature = direction === 'left' ? -intensity : intensity;

    // Comprimentos das fases
    const totalLength = BASE_SEGMENT_LENGTH * randomRange(this.prng, 0.8, 1.1) * (1 + intensity * 0.3);
    const transitionLength = totalLength * ENTRY_EXIT_RATIO;
    const apexLength = totalLength * (1 - 2 * ENTRY_EXIT_RATIO);

    // Curvatura eased para entry e exit (sinusoidal: 0→peak e peak→0)
    const entryCurvature = signedCurvature * 0.5;  // Média de 0→1 via sin
    const exitCurvature = signedCurvature * 0.5;

    // Checkpoint? (verificar apenas no apex)
    this.curveCount++;
    const isCheckpoint = this.curveCount % this.config.checkpointInterval === 0;

    // Entry — curvatura gradual crescente
    this.pushSegment({
      type: 'curve',
      direction,
      curvature: entryCurvature,
      requiredIntensity: 0, // Não verificado na entry
      length: transitionLength,
      isCheckpoint: false,
      phase: 'entry',
      pattern,
    });

    // Apex — curvatura plena, verificação do jogador ocorre aqui
    this.pushSegment({
      type: 'curve',
      direction,
      curvature: signedCurvature,
      requiredIntensity: intensity,
      length: apexLength,
      isCheckpoint,
      phase: 'apex',
      pattern,
    });

    // Exit — curvatura gradual decrescente
    this.pushSegment({
      type: 'curve',
      direction,
      curvature: exitCurvature,
      requiredIntensity: 0, // Não verificado na exit
      length: transitionLength,
      isCheckpoint: false,
      phase: 'exit',
      pattern,
    });

    // Atualizar estado de rastreamento
    this.updateDirectionTracking(direction);
    this.segmentsSinceLastCurve = 0;
  }

  /**
   * Adiciona um padrão composto (S-curve ou chicane).
   */
  private addCompositePattern(params: EffectiveParams): void {
    const isChicane = this.prng() < 0.35; // 35% chicane, 65% S-curve

    if (isChicane) {
      this.addChicane(params);
    } else {
      this.addSCurve(params);
    }
  }

  /**
   * S-curve: duas curvas consecutivas em direções opostas.
   * Trecho reto curto entre elas.
   */
  private addSCurve(params: EffectiveParams): void {
    const firstDirection = this.pickDirection();
    const secondDirection: CurveDirection = firstDirection === 'left' ? 'right' : 'left';

    // Intensidades similares para parecer orgânico
    const baseIntensity = randomRange(this.prng, 0.2, params.curveMaxIntensity * 0.85);
    const variation = randomRange(this.prng, 0.9, 1.1);

    this.addCurveWithTransitions(params, 's-curve', firstDirection, baseIntensity);
    this.addShortStraight('s-curve');
    this.addCurveWithTransitions(params, 's-curve', secondDirection, baseIntensity * variation);
  }

  /**
   * Chicane: sequência rápida esquerda-direita-esquerda (ou inverso).
   * Mais desafiador que S-curve.
   */
  private addChicane(params: EffectiveParams): void {
    const startDirection = this.pickDirection();
    const midDirection: CurveDirection = startDirection === 'left' ? 'right' : 'left';

    // Chicanes usam intensidades mais moderadas (precisam ser jogáveis)
    const intensity = randomRange(this.prng, 0.2, params.curveMaxIntensity * 0.7);

    this.addCurveWithTransitions(params, 'chicane', startDirection, intensity);
    this.addShortStraight('chicane');
    this.addCurveWithTransitions(params, 'chicane', midDirection, intensity * 1.05);
    this.addShortStraight('chicane');
    this.addCurveWithTransitions(params, 'chicane', startDirection, intensity * 0.95);
  }

  /**
   * Trecho reto curto usado entre curvas em padrões compostos.
   */
  private addShortStraight(pattern: TrackPattern): void {
    const length = BASE_SEGMENT_LENGTH * randomRange(this.prng, 0.3, 0.5);
    this.pushSegment({
      type: 'straight',
      direction: 'none',
      curvature: 0,
      requiredIntensity: 0,
      length,
      isCheckpoint: false,
      phase: 'full',
      pattern,
    });
    // Não incrementar segmentsSinceLastCurve (faz parte do padrão)
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Escolhe direção respeitando limite de consecutivas. */
  private pickDirection(): 'left' | 'right' {
    if (this.sameDirectionCount >= MAX_SAME_DIRECTION) {
      return this.lastCurveDirection === 'left' ? 'right' : 'left';
    }

    // Tendência para alternar (60%), mas não obrigatório
    const preferAlternate = this.prng() < 0.6;
    if (preferAlternate) {
      return this.lastCurveDirection === 'left' ? 'right' : 'left';
    }
    return this.prng() < 0.5 ? 'left' : 'right';
  }

  /** Atualiza tracking de direção consecutiva. */
  private updateDirectionTracking(direction: 'left' | 'right'): void {
    if (direction === this.lastCurveDirection) {
      this.sameDirectionCount++;
    } else {
      this.sameDirectionCount = 1;
    }
    this.lastCurveDirection = direction;
  }

  /** Adiciona um segmento ao array, atribuindo o índice sequencial. */
  private pushSegment(
    seg: Omit<TrackSegment, 'index'>,
  ): void {
    this.segments.push({
      ...seg,
      index: this.segments.length,
    });
  }
}
