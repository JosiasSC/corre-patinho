/**
 * Geração procedural do percurso (PRNG, segmentos).
 *
 * Versão simplificada para T-009 — gera segmentos retos + curvos
 * com parâmetros da dificuldade selecionada.
 *
 * Ref: 02-GAME-MECHANICS.md § 3
 * Ref: 03-TECH-STACK.md § 8 — src/core/track.ts
 */

import type { GameConfig, TrackSegment } from '../types/index.ts';
import { createPRNG, randomRange } from '../utils/prng.ts';
import type { PRNG } from '../utils/prng.ts';

/** Número máximo de segmentos buffered à frente do jogador. */
const LOOKAHEAD = 40;

/** Comprimento base de um segmento em unidades do jogo. */
const BASE_SEGMENT_LENGTH = 80;

/**
 * Gerador incremental de percurso.
 * Gera segmentos on-demand conforme o jogador avança.
 */
export class TrackGenerator {
  private readonly prng: PRNG;
  private readonly config: GameConfig;

  /** Segmentos já gerados. */
  readonly segments: TrackSegment[] = [];

  /** Contagem de curvas geradas (para checkpoints). */
  private curveCount = 0;

  /** Segmentos retos desde a última curva (para espaçamento mínimo). */
  private straightsSinceLastCurve = 0;

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
  // Private
  // ---------------------------------------------------------------------------

  private generateNext(): void {
    // Decidir se gera curva ou reto
    const effectiveFrequency = Math.min(
      this.config.curveFrequency + this.rampFactor * 0.5,
      0.8,
    );

    const canCurve = this.straightsSinceLastCurve >= this.config.minStraightBetweenCurves;

    if (canCurve && this.prng() < effectiveFrequency) {
      this.addCurve();
    } else {
      this.addStraight();
    }
  }

  private addStraight(): void {
    const length = BASE_SEGMENT_LENGTH * randomRange(this.prng, 0.8, 1.4);
    this.segments.push({
      type: 'straight',
      direction: 'none',
      curvature: 0,
      length,
      isCheckpoint: false,
      index: this.segments.length,
    });
    this.straightsSinceLastCurve++;
  }

  private addCurve(): void {
    // Decidir direção — evitar mais de 3 consecutivas na mesma direção
    let direction: 'left' | 'right';
    if (this.sameDirectionCount >= 3) {
      direction = this.lastCurveDirection === 'left' ? 'right' : 'left';
    } else {
      // Tendência para alternar, mas não obrigatório
      const preferAlternate = this.prng() < 0.6;
      if (preferAlternate) {
        direction = this.lastCurveDirection === 'left' ? 'right' : 'left';
      } else {
        direction = this.prng() < 0.5 ? 'left' : 'right';
      }
    }

    // Intensidade da curvatura com rampa
    const maxIntensity = Math.min(
      this.config.curveMaxIntensity + this.rampFactor * 0.3,
      1.0,
    );
    const minIntensity = 0.15;
    const intensity = randomRange(this.prng, minIntensity, maxIntensity);
    const curvature = direction === 'left' ? -intensity : intensity;

    // Comprimento da curva (curvas mais intensas são um pouco mais longas)
    const length = BASE_SEGMENT_LENGTH * randomRange(this.prng, 0.7, 1.0) * (1 + intensity * 0.3);

    // Checkpoint?
    this.curveCount++;
    const isCheckpoint = this.curveCount % this.config.checkpointInterval === 0;

    this.segments.push({
      type: 'curve',
      direction,
      curvature,
      length,
      isCheckpoint,
      index: this.segments.length,
    });

    // Atualizar estado de rastreamento
    if (direction === this.lastCurveDirection) {
      this.sameDirectionCount++;
    } else {
      this.sameDirectionCount = 1;
    }
    this.lastCurveDirection = direction;
    this.straightsSinceLastCurve = 0;
  }
}
