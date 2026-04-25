/**
 * Modelo de física (velocidade, tolerância, inércia).
 *
 * Física customizada simplificada — sem lib externa.
 * Ref: 02-GAME-MECHANICS.md § 4
 * Ref: 03-TECH-STACK.md § 8 — src/core/physics.ts
 */

import type { GameConfig, GameSession, PlayerState, TrackSegment } from '../types/index.ts';

/** Constantes de física. */
const PHYSICS = {
  /** Aceleração por segundo (multiplicador) durante início. */
  ACCELERATION: 0.4,
  /** Tempo de inércia do input lateral (segundos). Ref: § 4.5 */
  INERTIA_DECAY: 0.2,
  /** Distância em unidades do jogo por frame a velocidade 1.0x e 60fps. */
  BASE_SPEED_UNITS: 120,
  /** Lean visual lerp speed. */
  LEAN_SPEED: 8.0,
} as const;

/** Resultado da verificação de curva. */
export interface CurveCheckResult {
  passed: boolean;
  error: number;
}

/**
 * Atualiza a física da sessão de jogo.
 * Retorna true se o jogador perdeu vida neste frame.
 */
export function updatePhysics(
  session: GameSession,
  player: PlayerState,
  _config: GameConfig,
  dt: number,
): void {
  // Aceleração gradual no início → estabiliza na velocidade-alvo
  const targetSpeed = getTargetSpeed(session);
  if (session.speed < targetSpeed) {
    session.speed = Math.min(
      session.speed + PHYSICS.ACCELERATION * dt,
      targetSpeed,
    );
  }

  // Suavizar input com inércia (§ 4.5)
  const inertiaFactor = 1 - Math.exp(-dt / PHYSICS.INERTIA_DECAY);
  player.smoothInput += (player.rawInput - player.smoothInput) * inertiaFactor;

  // Lean visual do patinho
  player.lean += (player.smoothInput - player.lean) * PHYSICS.LEAN_SPEED * dt;

  // Avançar posição no track
  const distance = PHYSICS.BASE_SPEED_UNITS * session.speed * dt;
  session.trackPosition += distance;
  session.score = session.trackPosition;
  if (session.score > session.maxScore) {
    session.maxScore = session.score;
  }
}

/**
 * Verifica se o jogador passou pela curva com sucesso.
 * Deve ser chamado quando o jogador está dentro de um segmento curvo.
 */
export function checkCurve(
  segment: TrackSegment,
  player: PlayerState,
  config: GameConfig,
): CurveCheckResult {
  if (segment.type === 'straight') {
    return { passed: true, error: 0 };
  }

  const required = segment.curvature;
  const applied = player.smoothInput;
  const error = Math.abs(applied - required);
  const maxError = Math.abs(required) * config.tolerance + 0.08; // tolerância absoluta mínima

  return {
    passed: error <= maxError,
    error,
  };
}

/** Calcula a velocidade-alvo considerando a rampa de dificuldade. */
function getTargetSpeed(session: GameSession): number {
  const { config, elapsedTime } = session;
  const ramp = elapsedTime * config.difficultyRampRate;
  return Math.min(
    config.speedBase + ramp,
    config.speedMax,
  );
}

/** Distância por segundo na velocidade atual. */
export function getSpeedUnitsPerSecond(speed: number): number {
  return PHYSICS.BASE_SPEED_UNITS * speed;
}
