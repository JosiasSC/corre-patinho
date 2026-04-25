/**
 * Layout & Responsividade — LayoutManager.
 *
 * Gerencia:
 * - Redimensionamento do canvas 16:9 com letterboxing
 * - Limite de viewport no desktop (max ~1280×720)
 * - Orientação landscape forçada (Screen Orientation API)
 * - Fullscreen request na primeira interação (mobile)
 * - Cursor escondido durante gameplay
 *
 * Ref: 03-TECH-STACK.md § 6
 */

// ---------------------------------------------------------------------------
// Constantes de layout
// ---------------------------------------------------------------------------

/** Aspect ratio alvo (16:9). */
const TARGET_ASPECT = 16 / 9;

/** Resolução interna fixa do canvas. */
export const INTERNAL_WIDTH = 1280;
export const INTERNAL_HEIGHT = 720;

/** Limite máximo do canvas CSS no desktop. */
const MAX_DISPLAY_WIDTH = 1280;
const MAX_DISPLAY_HEIGHT = 720;

// ---------------------------------------------------------------------------
// LayoutManager
// ---------------------------------------------------------------------------

/**
 * Responsável por toda lógica de layout, responsividade e
 * integrações com APIs de plataforma (orientation lock, fullscreen).
 */
export class LayoutManager {
  private readonly canvas: HTMLCanvasElement;
  private _isPlaying = false;
  private _orientationLocked = false;
  private _fullscreenRequested = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Configurar resolução interna fixa
    canvas.width = INTERNAL_WIDTH;
    canvas.height = INTERNAL_HEIGHT;

    // Resize inicial + listener
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Também recalcular ao mudar orientação (mobile)
    window.addEventListener('orientationchange', () => {
      // Delay para permitir que o browser atualize innerWidth/Height
      setTimeout(() => this.resize(), 150);
    });

    // Observar mudança de orientação via Screen Orientation API
    if (screen.orientation) {
      screen.orientation.addEventListener('change', () => {
        setTimeout(() => this.resize(), 150);
      });
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Notifica o LayoutManager sobre mudança de estado do jogo.
   * Controla cursor e fullscreen conforme o estado.
   */
  setPlaying(playing: boolean): void {
    this._isPlaying = playing;
    this.updateCursor();
  }

  /**
   * Tenta travar a orientação em landscape e entrar em fullscreen.
   * Deve ser chamado em resposta a um gesto do usuário (click/tap).
   *
   * Seguro para chamar múltiplas vezes — opera como no-op após sucesso.
   */
  async requestImmersive(): Promise<void> {
    await this.tryFullscreen();
    await this.tryOrientationLock();
  }

  /**
   * Retorna as dimensões CSS atuais do canvas (para debugging/HUD).
   */
  getDisplaySize(): { width: number; height: number } {
    return {
      width: parseFloat(this.canvas.style.width) || INTERNAL_WIDTH,
      height: parseFloat(this.canvas.style.height) || INTERNAL_HEIGHT,
    };
  }

  /**
   * Limpa listeners ao destruir.
   */
  destroy(): void {
    // Unlock orientation se travado
    if (this._orientationLocked && screen.orientation) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (screen.orientation as any).unlock?.();
      } catch {
        // Silently ignore
      }
    }

    // Sair de fullscreen se ativo
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  // -------------------------------------------------------------------------
  // Private — Resize
  // -------------------------------------------------------------------------

  /**
   * Redimensiona o canvas CSS mantendo aspect ratio 16:9.
   * A resolução interna é fixa (1280×720); o CSS escala.
   *
   * Ref: 03-TECH-STACK.md § 6.2, § 6.3
   */
  private resize(): void {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const windowAspect = windowW / windowH;

    let displayWidth: number;
    let displayHeight: number;

    if (windowAspect > TARGET_ASPECT) {
      // Janela mais larga que 16:9 — letterbox horizontal (barras laterais)
      displayHeight = Math.min(windowH, MAX_DISPLAY_HEIGHT);
      displayWidth = displayHeight * TARGET_ASPECT;
    } else {
      // Janela mais alta que 16:9 — letterbox vertical (barras topo/baixo)
      displayWidth = Math.min(windowW, MAX_DISPLAY_WIDTH);
      displayHeight = displayWidth / TARGET_ASPECT;
    }

    // Aplicar tamanho CSS
    this.canvas.style.width = `${Math.round(displayWidth)}px`;
    this.canvas.style.height = `${Math.round(displayHeight)}px`;
  }

  // -------------------------------------------------------------------------
  // Private — Orientation Lock
  // -------------------------------------------------------------------------

  /**
   * Tenta travar orientação em landscape via Screen Orientation API.
   * Ref: 03-TECH-STACK.md § 6.1
   *
   * Nota: screen.orientation.lock() não está em todos os typings TS,
   * mas é uma API Web válida. Usamos cast explícito.
   */
  private async tryOrientationLock(): Promise<void> {
    if (this._orientationLocked) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orientation = screen.orientation as any;
    if (!orientation || typeof orientation.lock !== 'function') return;

    try {
      await orientation.lock('landscape');
      this._orientationLocked = true;
    } catch {
      // Esperado falhar em desktop ou sem fullscreen — silently ignore.
      // O overlay CSS de portrait continua como fallback.
    }
  }

  // -------------------------------------------------------------------------
  // Private — Fullscreen
  // -------------------------------------------------------------------------

  /**
   * Tenta entrar em fullscreen (melhor experiência mobile).
   * Ref: 03-TECH-STACK.md § 5.3 (display: fullscreen)
   */
  private async tryFullscreen(): Promise<void> {
    if (this._fullscreenRequested) return;
    if (document.fullscreenElement) {
      this._fullscreenRequested = true;
      return;
    }

    // Só tentar em mobile (telas ≤ 1024px largura, heurística)
    if (window.innerWidth > 1024 && window.innerHeight > 768) return;

    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      this._fullscreenRequested = true;
    } catch {
      // Fullscreen não suportado ou bloqueado — silently ignore.
    }
  }

  // -------------------------------------------------------------------------
  // Private — Cursor
  // -------------------------------------------------------------------------

  /**
   * Esconde o cursor durante gameplay no desktop.
   * Ref: 03-TECH-STACK.md § 6.3
   */
  private updateCursor(): void {
    if (this._isPlaying) {
      this.canvas.style.cursor = 'none';
    } else {
      this.canvas.style.cursor = 'pointer';
    }
  }
}
