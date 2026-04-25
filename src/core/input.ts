/**
 * Captura de swipe, teclado; normalização de input.
 *
 * Versão básica para o protótipo T-009.
 * Versão completa em T-012.
 *
 * Ref: 02-GAME-MECHANICS.md § 2
 * Ref: 03-TECH-STACK.md § 8 — src/core/input.ts
 */

/** Estado do input num dado instante. */
export interface InputState {
  /** Direção contínua: -1 (full esquerda) a +1 (full direita), 0 = neutro. */
  direction: number;
}

/** Taxa de intensidade crescente (desktop) — por segundo. Ref: § 2.2 */
const KEYBOARD_RAMP_RATE = 3.0;

/** Distância máxima do swipe em px para atingir intensidade 1.0. */
const SWIPE_MAX_DISTANCE = 120;

/**
 * Gerenciador de input — captura touch/swipe e teclado.
 * Full-screen gesture (Ref: § 2.3).
 */
export class InputManager {
  private direction = 0;

  // Teclado
  private leftPressed = false;
  private rightPressed = false;
  private keyHoldTime = 0;

  // Touch
  private touchActive = false;
  private touchStartX = 0;
  private touchCurrentX = 0;

  /** Se o input recebeu pelo menos um tap/click (para "toque para começar"). */
  tapReceived = false;

  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupKeyboard();
    this.setupTouch();
  }

  /** Retorna o estado atual do input. */
  getState(): InputState {
    return { direction: this.direction };
  }

  /** Atualiza o input (deve ser chamado a cada frame). */
  update(dt: number): void {
    if (this.touchActive) {
      // Touch: distância normalizada
      const dx = this.touchCurrentX - this.touchStartX;
      this.direction = Math.max(-1, Math.min(1, dx / SWIPE_MAX_DISTANCE));
    } else if (this.leftPressed || this.rightPressed) {
      // Teclado: intensidade crescente com tempo pressionado
      this.keyHoldTime += dt;
      const intensity = Math.min(1, this.keyHoldTime * KEYBOARD_RAMP_RATE);
      if (this.leftPressed && !this.rightPressed) {
        this.direction = -intensity;
      } else if (this.rightPressed && !this.leftPressed) {
        this.direction = intensity;
      } else {
        // Ambas pressionadas = neutro
        this.direction = 0;
      }
    } else {
      // Nenhum input ativo — zerar (inércia é aplicada na physics)
      this.direction = 0;
    }
  }

  /** Remove os event listeners. */
  destroy(): void {
    // Listeners são adicionados no documento, seriam removidos se guardássemos refs.
    // Para o protótipo, não removemos (single instance).
  }

  // ---------------------------------------------------------------------------
  // Keyboard
  // ---------------------------------------------------------------------------

  private setupKeyboard(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (!this.leftPressed) {
          this.leftPressed = true;
          this.keyHoldTime = 0;
        }
        e.preventDefault();
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (!this.rightPressed) {
          this.rightPressed = true;
          this.keyHoldTime = 0;
        }
        e.preventDefault();
      }
      this.tapReceived = true;
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.leftPressed = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.rightPressed = false;
      }
      if (!this.leftPressed && !this.rightPressed) {
        this.keyHoldTime = 0;
      }
    });

    // Espaço e Enter também contam como tap
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        this.tapReceived = true;
        e.preventDefault();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Touch / Mouse (full-screen gesture § 2.3)
  // ---------------------------------------------------------------------------

  private setupTouch(): void {
    const el = this.canvas;

    // Touch events
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.touchActive = true;
      this.touchStartX = touch.clientX;
      this.touchCurrentX = touch.clientX;
      this.tapReceived = true;
    }, { passive: false });

    el.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.touchActive) {
        this.touchCurrentX = e.touches[0].clientX;
      }
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touchActive = false;
      this.direction = 0;
    }, { passive: false });

    el.addEventListener('touchcancel', () => {
      this.touchActive = false;
      this.direction = 0;
    });

    // Mouse fallback (para testes desktop)
    el.addEventListener('mousedown', (e) => {
      this.touchActive = true;
      this.touchStartX = e.clientX;
      this.touchCurrentX = e.clientX;
      this.tapReceived = true;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.touchActive) {
        this.touchCurrentX = e.clientX;
      }
    });

    document.addEventListener('mouseup', () => {
      this.touchActive = false;
      this.direction = 0;
    });
  }
}
