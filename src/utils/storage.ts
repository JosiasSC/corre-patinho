/**
 * Wrapper localStorage — high scores, preferências.
 *
 * Ref: 02-GAME-MECHANICS.md § 5
 * Ref: 03-TECH-STACK.md § 4, § 8 — src/utils/storage.ts
 */

import type { Difficulty, HighScoreEntry, HighScores } from '../types/index.ts';

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const STORAGE_KEY_MUTED = 'corre-patinho:muted';
const STORAGE_KEY_HIGHSCORES = 'corre-patinho:highscores';

/** Número máximo de entradas por dificuldade. Ref: § 5 */
const MAX_ENTRIES_PER_DIFFICULTY = 10;

// ---------------------------------------------------------------------------
// Mute preference
// ---------------------------------------------------------------------------

/**
 * Lê a preferência de mute do localStorage.
 * Default: `true` (iniciar muted — Ref: 03-TECH-STACK.md § 4).
 */
export function getMutedPreference(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MUTED);
    if (stored === null) return true; // default muted
    return stored === 'true';
  } catch {
    // localStorage indisponível (e.g. modo privado em Safari antigo)
    return true;
  }
}

/**
 * Salva a preferência de mute no localStorage.
 */
export function setMutedPreference(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_MUTED, String(muted));
  } catch {
    // Silenciosamente falha se localStorage indisponível
  }
}

// ---------------------------------------------------------------------------
// High Scores — Ref: 02-GAME-MECHANICS.md § 5
// ---------------------------------------------------------------------------

/** Retorna a estrutura vazia de high scores. */
function emptyHighScores(): HighScores {
  return { easy: [], normal: [], hard: [] };
}

/**
 * Lê os high scores do localStorage.
 * Retorna top 10 por dificuldade (ordenados por score desc).
 */
export function getHighScores(): HighScores {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HIGHSCORES);
    if (!raw) return emptyHighScores();

    const parsed = JSON.parse(raw) as Partial<HighScores>;
    const result = emptyHighScores();

    // Validar cada dificuldade
    for (const diff of ['easy', 'normal', 'hard'] as Difficulty[]) {
      const entries = parsed[diff];
      if (Array.isArray(entries)) {
        result[diff] = entries
          .filter(
            (e): e is HighScoreEntry =>
              typeof e === 'object' &&
              e !== null &&
              typeof e.score === 'number' &&
              typeof e.seed === 'number' &&
              typeof e.date === 'string',
          )
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_ENTRIES_PER_DIFFICULTY);
      }
    }

    return result;
  } catch {
    return emptyHighScores();
  }
}

/**
 * Salva um novo high score se qualificar para o top 10.
 * Retorna `true` se é novo recorde pessoal (posição #1).
 */
export function saveHighScore(
  difficulty: Difficulty,
  entry: HighScoreEntry,
): boolean {
  try {
    const scores = getHighScores();
    const list = scores[difficulty];

    // Inserir ordenado (desc por score)
    list.push(entry);
    list.sort((a, b) => b.score - a.score);

    // Manter apenas top 10
    if (list.length > MAX_ENTRIES_PER_DIFFICULTY) {
      list.length = MAX_ENTRIES_PER_DIFFICULTY;
    }

    scores[difficulty] = list;
    localStorage.setItem(STORAGE_KEY_HIGHSCORES, JSON.stringify(scores));

    // É recorde se ficou na posição 0
    return list[0].score === entry.score && list[0].seed === entry.seed;
  } catch {
    return false;
  }
}

/**
 * Retorna o melhor score pessoal para uma dificuldade.
 * Retorna 0 se não houver entradas.
 */
export function getPersonalBest(difficulty: Difficulty): number {
  const scores = getHighScores();
  const list = scores[difficulty];
  return list.length > 0 ? list[0].score : 0;
}
