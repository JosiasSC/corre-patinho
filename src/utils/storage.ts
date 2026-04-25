/**
 * Wrapper localStorage — high scores, preferências.
 *
 * Ref: 02-GAME-MECHANICS.md § 5
 * Ref: 03-TECH-STACK.md § 4, § 8 — src/utils/storage.ts
 */

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const STORAGE_KEY_MUTED = 'corre-patinho:muted';

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

// TODO: T-014 — Implementar persistência de high scores (top 10 por dificuldade)
