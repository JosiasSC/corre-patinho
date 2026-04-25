/**
 * PRNG seedable — mulberry32.
 *
 * Garante que a mesma seed + mesma dificuldade = mesmo percurso.
 * Ref: 02-GAME-MECHANICS.md § 3.4
 * Ref: 03-TECH-STACK.md § 8 — src/utils/prng.ts
 */

/** Tipo da função PRNG: retorna número entre 0 (inclusive) e 1 (exclusive). */
export type PRNG = () => number;

/**
 * Cria um PRNG seedable usando o algoritmo mulberry32.
 * Rápido, determinístico, boa distribuição para jogos.
 */
export function createPRNG(seed: number): PRNG {
  let state = seed | 0;
  return (): number => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Retorna um número aleatório entre min (inclusive) e max (exclusive). */
export function randomRange(prng: PRNG, min: number, max: number): number {
  return min + prng() * (max - min);
}

/** Retorna um elemento aleatório do array. */
export function randomChoice<T>(prng: PRNG, array: readonly T[]): T {
  return array[Math.floor(prng() * array.length)];
}

/** Gera uma seed aleatória (não-determinística). */
export function generateSeed(): number {
  return (Math.random() * 0xFFFFFFFF) >>> 0;
}
