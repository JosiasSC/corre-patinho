/**
 * Captura de touch/swipe full-screen, teclado desktop, normalização.
 *
 * Implementação completa — T-012.
 * Ref: 02-GAME-MECHANICS.md § 2 (Controles e Input)
 * Ref: 02-GAME-MECHANICS.md § 4.5 (Inércia — decay em physics.ts)
 * Ref: 03-TECH-STACK.md § 8 — src/core/input.ts
 */

/** Estado do input num dado instante. */
export interface InputState {
  /** Direção contínua: -1 (full esquerda) a +1 (full direita), 0 = neutro. */
  direction: number;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/**
 * Taxa de rampa do teclado — coeficiente para ease-in quadrático.
 * Intensidade = min(1, (holdTime * RATE)²).
 * Com RATE=2.5, atinge intensidade 1.0 em ~0.4s.
 * Ref: § 2.2 — intensidade crescente com tempo pressionado.
 */
const KEYBOARD_RAMP_RATE = 2.5;

/**
 * Fração da largura do viewport usada como distância máxima de swipe.
 * Telas de 320px → 48px, telas de 1280px → 150px (clamped).
 * Ref: § 2.1 — distância horizontal do swipe → intensidade.
 */
const SWIPE_MAX_FRACTION = 0.15;

/** Limites absolutos para a distância máxima de swipe em pixels. */
const SWIPE_MIN_PX = 40;
const SWIPE_MAX_PX = 150;

/**
 * Dead zone — inputs com |direction| abaixo desse limiar são tratados como 0.
 * Evita micro-movimentos involuntários no touchscreen.
 */
const DEAD_ZONE = 0.05;

// ---------------------------------------------------------------------------
// InputManager
// ---------------------------------------------------------------------------

/**
 * Gerenciador de input — captura touch/swipe e teclado.
 * Full-screen gesture (Ref: § 2.3).
 *
 * A inércia de ~200ms (§ 4.5) é aplicada em physics.ts via `smoothInput`.
 * Este módulo produz o `rawInput` — valor bruto antes da suavização.
 */
export class InputManager {
  private direction = 0;

  // -- Teclado --
  private leftPressed = false;
  private rightPressed = false;
  private keyHoldTime = 0;

  // -- Touch --
  private touchActive = false;
  private touchStartX = 0;
  private touchCurrentX = 0;
  /** ID do primeiro toque ativo — multi-touch rejection. */
  private activeTouchId: number | null = null;

  /** Se o input recebeu pelo menos um tap/click (para "toque para começar"). */
  tapReceived = false;

  /** Distância máxima de swipe em px (recalculada no resize). */
  private swipeMaxDistance: number;

  /** AbortController para lifecycle de todos os listeners. */
  private readonly abortController: AbortController;

  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.abortController = new AbortController();
    this.swipeMaxDistance = this.computeSwipeMaxDistance();

    this.setupKeyboard();
    this.setupTouch();
    this.setupResize();
  }

  /** Retorna o estado atual do input. */
  getState(): InputState {
    return { direction: this.direction };
  }

  /**
   * Atualiza o input (deve ser chamado a cada frame).
   *
   * § 2.2: Ao soltar dedo/tecla, a intensidade retorna gradualmente a zero.
   * Isso é feito pela inércia em physics.ts — aqui apenas paramos de
   * atualizar `direction`, mantendo o último valor para o decay.
   */
  update(dt: number): void {
    if (this.touchActive) {
      // Touch ativo: distância normalizada relativa ao ponto de toque (§ 2.3)
      const dx = this.touchCurrentX - this.touchStartX;
      const raw = dx / this.swipeMaxDistance;
      this.direction = this.applyDeadZone(Math.max(-1, Math.min(1, raw)));
    } else if (this.leftPressed || this.rightPressed) {
      // Teclado: intensidade crescente com ease-in quadrático (§ 2.2)
      this.keyHoldTime += dt;
      const t = Math.min(1, this.keyHoldTime * KEYBOARD_RAMP_RATE);
      const intensity = t * t; // ease-in quadrático

      if (this.leftPressed && !this.rightPressed) {
        this.direction = -intensity;
      } else if (this.rightPressed && !this.leftPressed) {
        this.direction = intensity;
      } else {
        // Ambas pressionadas = neutro
        this.direction = 0;
      }
    } else {
      // Nenhum input ativo — NÃO zerar direction.
      // O último valor é mantido; physics.ts aplica decay via smoothInput (§ 4.5).
      // Ao soltar, queremos o retorno GRADUAL a zero, não um snap.
      // Porém, se já estiver dentro da dead zone, zerar para evitar drift residual.
      if (Math.abs(this.direction) < DEAD_ZONE) {
        this.direction = 0;
      }
    }
  }

  /** Remove todos os event listeners. */
  destroy(): void {
    this.abortController.abort();
  }

  // ---------------------------------------------------------------------------
  // Private — Dead Zone
  // ---------------------------------------------------------------------------

  /** Aplica dead zone: valores abaixo do limiar viram 0. */
  private applyDeadZone(value: number): number {
    if (Math.abs(value) < DEAD_ZONE) return 0;
    // Remapear para que a faixa útil comece em 0 logo após o dead zone
    const sign = value > 0 ? 1 : -1;
    return sign * ((Math.abs(value) - DEAD_ZONE) / (1 - DEAD_ZONE));
  }

  // ---------------------------------------------------------------------------
  // Private — Swipe distance
  // ---------------------------------------------------------------------------

  /** Calcula a distância máxima de swipe baseada no viewport. */
  private computeSwipeMaxDistance(): number {
    const vw = window.innerWidth;
    return Math.max(SWIPE_MIN_PX, Math.min(SWIPE_MAX_PX, vw * SWIPE_MAX_FRACTION));
  }

  // ---------------------------------------------------------------------------
  // Private — Keyboard
  // ---------------------------------------------------------------------------

  private setupKeyboard(): void {
    const signal = this.abortController.signal;

    document.addEventListener('keydown', (e: KeyboardEvent) => {
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
    }, { signal });

    document.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.leftPressed = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.rightPressed = false;
      }
      if (!this.leftPressed && !this.rightPressed) {
        this.keyHoldTime = 0;
      }
    }, { signal });

    // Espaço e Enter também contam como tap
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        this.tapReceived = true;
        e.preventDefault();
      }
    }, { signal });
  }

  // ---------------------------------------------------------------------------
  // Touch / Mouse (full-screen gesture § 2.3)
  // ---------------------------------------------------------------------------

  private setupTouch(): void {
    const el = this.canvas;
    const signal = this.abortController.signal;

    // -- Touch events --

    el.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();

      // Multi-touch rejection: só aceitar o primeiro toque
      if (this.touchActive && this.activeTouchId !== null) return;

      const touch = e.changedTouches[0];
      this.activeTouchId = touch.identifier;
      this.touchActive = true;
      this.touchStartX = touch.clientX;
      this.touchCurrentX = touch.clientX;
      this.tapReceived = true;
    }, { passive: false, signal });

    el.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
      if (!this.touchActive) return;

      // Encontrar o toque com o ID ativo (multi-touch safe)
      const touch = this.findActiveTouch(e.touches);
      if (touch) {
        this.touchCurrentX = touch.clientX;
      }
    }, { passive: false, signal });

    el.addEventListener('touchend', (e: TouchEvent) => {
      e.preventDefault();
      // Só processar se o toque encerrado é o nosso toque ativo
      const touch = this.findActiveTouchInList(e.changedTouches);
      if (touch) {
        this.touchActive = false;
        this.activeTouchId = null;
        // NÃO zerar direction — inércia em physics.ts faz o decay (§ 2.2, § 4.5)
      }
    }, { passive: false, signal });

    el.addEventListener('touchcancel', (e: TouchEvent) => {
      const touch = this.findActiveTouchInList(e.changedTouches);
      if (touch) {
        this.touchActive = false;
        this.activeTouchId = null;
      }
    }, { signal });

    // -- Mouse fallback (testes desktop) --

    el.addEventListener('mousedown', (e: MouseEvent) => {
      this.touchActive = true;
      this.activeTouchId = null; // Mouse não tem ID
      this.touchStartX = e.clientX;
      this.touchCurrentX = e.clientX;
      this.tapReceived = true;
    }, { signal });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.touchActive && this.activeTouchId === null) {
        this.touchCurrentX = e.clientX;
      }
    }, { signal });

    document.addEventListener('mouseup', () => {
      if (this.touchActive && this.activeTouchId === null) {
        this.touchActive = false;
        // NÃO zerar direction — inércia (§ 2.2, § 4.5)
      }
    }, { signal });
  }

  // ---------------------------------------------------------------------------
  // Private — Resize
  // ---------------------------------------------------------------------------

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.swipeMaxDistance = this.computeSwipeMaxDistance();
    }, { signal: this.abortController.signal });
  }

  // ---------------------------------------------------------------------------
  // Private — Touch helpers
  // ---------------------------------------------------------------------------

  /** Encontra o toque ativo numa TouchList (touchmove). */
  private findActiveTouch(touches: TouchList): Touch | null {
    if (this.activeTouchId === null) return null;
    for (let i = 0; i < touches.length; i++) {
      if (touches[i].identifier === this.activeTouchId) {
        return touches[i];
      }
    }
    return null;
  }

  /** Encontra o toque ativo numa TouchList de changedTouches (touchend/cancel). */
  private findActiveTouchInList(changedTouches: TouchList): Touch | null {
    if (this.activeTouchId === null) return null;
    for (let i = 0; i < changedTouches.length; i++) {
      if (changedTouches[i].identifier === this.activeTouchId) {
        return changedTouches[i];
      }
    }
    return null;
  }
}
