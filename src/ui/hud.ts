/**
 * HUD in-game: score, vidas, mute, sinalização de curvas.
 *
 * Renderiza sobreposições de jogo no canvas 2D.
 * A sinalização de curvas é exclusiva do modo Fácil (formas + cores).
 *
 * Ref: 02-GAME-MECHANICS.md § 5, § 6, § 7
 * Ref: 03-TECH-STACK.md § 4, § 8 — src/ui/hud.ts
 */

import type { GameSession, UpcomingCurve } from '../types/index.ts';
import { drawDuckIcon } from '../rendering/sprites.ts';
import { getMutedPreference, setMutedPreference } from '../utils/storage.ts';

// ---------------------------------------------------------------------------
// Constantes de layout (proporcionais ao canvas)
// ---------------------------------------------------------------------------

/** Padding geral como fração da largura. */
const PAD_FRAC = 0.025;

/** Tamanho da fonte do score como fração da altura. */
const SCORE_FONT_FRAC = 0.048;

/** Tamanho dos ícones de vida como fração da altura. */
const LIFE_ICON_FRAC = 0.042;

/** Tamanho do botão mute como fração da altura. */
const MUTE_SIZE_FRAC = 0.038;



// ---------------------------------------------------------------------------
// Cores da sinalização por faixa de intensidade (§ 7)
// ---------------------------------------------------------------------------

interface IntensityBand {
  /** Limite inferior da faixa (inclusive). */
  min: number;
  /** Cor da seta/gauge. */
  color: string;
  /** Cor de fundo do gauge. */
  bgColor: string;
  /** Escala do triângulo direcional. */
  arrowScale: number;
  /** Label textual (acessibilidade futura). */
  label: string;
}

const INTENSITY_BANDS: IntensityBand[] = [
  { min: 0.0, color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.2)', arrowScale: 0.6, label: 'Leve' },
  { min: 0.3, color: '#FFC107', bgColor: 'rgba(255, 193, 7, 0.2)', arrowScale: 0.8, label: 'Média' },
  { min: 0.6, color: '#F44336', bgColor: 'rgba(244, 67, 54, 0.2)', arrowScale: 1.0, label: 'Forte' },
];

/** Retorna a faixa de intensidade para um valor dado. */
function getIntensityBand(intensity: number): IntensityBand {
  for (let i = INTENSITY_BANDS.length - 1; i >= 0; i--) {
    if (intensity >= INTENSITY_BANDS[i].min) {
      return INTENSITY_BANDS[i];
    }
  }
  return INTENSITY_BANDS[0];
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------

/**
 * Renderiza o HUD in-game sobre o canvas.
 * Gerencia estado de mute e hit-test para interação.
 */
export class HUD {
  private readonly ctx: CanvasRenderingContext2D;
  private muted: boolean;

  /** Bounding box do botão mute para hit-test. */
  private muteBtnRect = { x: 0, y: 0, w: 0, h: 0 };

  /** Timer de animação para shake das vidas ao perder vida. */
  private lifeShakeTimer = 0;
  private lastLives = 3;

  /** Callback invocado ao alternar mute (para sincronizar com AudioManager). */
  onMuteToggle: ((muted: boolean) => void) | null = null;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.muted = getMutedPreference();
  }

  /** Estado atual de mute. */
  get isMuted(): boolean {
    return this.muted;
  }

  /**
   * Renderiza o HUD completo sobre o frame atual.
   */
  render(session: GameSession, upcomingCurve: UpcomingCurve | null): void {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Detectar perda de vida para shake
    if (session.lives < this.lastLives) {
      this.lifeShakeTimer = 0.4; // 400ms de shake
    }
    this.lastLives = session.lives;

    // Decrementar shake timer
    if (this.lifeShakeTimer > 0) {
      this.lifeShakeTimer = Math.max(0, this.lifeShakeTimer - 1 / 60);
    }

    this.drawScore(session, w, h);
    this.drawLives(session, w, h);
    this.drawMuteButton(w, h);

    // Sinalização de curvas — apenas modo Fácil (§ 7)
    if (session.config.difficulty === 'easy' && upcomingCurve) {
      this.drawCurveSignal(upcomingCurve, w, h);
    }
  }

  /**
   * Testa se um click/tap atingiu o botão mute.
   * Retorna true se consumiu o evento (toggle mute).
   *
   * As coordenadas devem ser em espaço do canvas (não CSS).
   */
  handleClick(canvasX: number, canvasY: number): boolean {
    const { x, y, w, h } = this.muteBtnRect;
    // Hit area expandida 50% para facilitar toque mobile
    const expand = Math.max(w, h) * 0.25;
    if (
      canvasX >= x - expand &&
      canvasX <= x + w + expand &&
      canvasY >= y - expand &&
      canvasY <= y + h + expand
    ) {
      this.muted = !this.muted;
      setMutedPreference(this.muted);
      // Notificar AudioManager via callback
      if (this.onMuteToggle) {
        this.onMuteToggle(this.muted);
      }
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Private — Score
  // ---------------------------------------------------------------------------

  private drawScore(session: GameSession, w: number, h: number): void {
    const { ctx } = this;
    const padding = w * PAD_FRAC;
    const fontSize = Math.round(h * SCORE_FONT_FRAC);
    const scoreText = `${Math.floor(session.maxScore)}m`;

    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${fontSize}px "Segoe UI", sans-serif`;

    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillText(scoreText, w - padding + 2, padding + 2);

    // Texto principal
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(scoreText, w - padding, padding);
    ctx.shadowBlur = 0;

    // Label "DISTÂNCIA" menor acima do score
    ctx.font = `${Math.round(fontSize * 0.38)}px "Segoe UI", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText('DISTÂNCIA', w - padding, padding - fontSize * 0.42);
  }

  // ---------------------------------------------------------------------------
  // Private — Vidas
  // ---------------------------------------------------------------------------

  private drawLives(session: GameSession, w: number, h: number): void {
    const { ctx } = this;
    const padding = w * PAD_FRAC;
    const iconSize = h * LIFE_ICON_FRAC;
    const iconSpacing = iconSize * 1.6;

    // Shake ao perder vida
    let shakeX = 0;
    let shakeY = 0;
    if (this.lifeShakeTimer > 0) {
      const intensity = this.lifeShakeTimer / 0.4; // 1→0
      shakeX = Math.sin(Date.now() * 0.04) * 3 * intensity;
      shakeY = Math.cos(Date.now() * 0.05) * 2 * intensity;
    }

    for (let i = 0; i < 3; i++) {
      drawDuckIcon(
        ctx,
        padding + iconSize + i * iconSpacing + shakeX,
        padding + iconSize * 1.2 + shakeY,
        iconSize,
        i < session.lives,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Private — Botão Mute
  // ---------------------------------------------------------------------------

  private drawMuteButton(w: number, h: number): void {
    const { ctx } = this;
    const padding = w * PAD_FRAC;
    const size = h * MUTE_SIZE_FRAC;
    const fontSize = Math.round(h * SCORE_FONT_FRAC);

    // Posição: abaixo do score, canto superior direito
    const btnX = w - padding - size;
    const btnY = padding + fontSize + fontSize * 0.5;

    // Salvar bounding box para hit-test
    this.muteBtnRect = { x: btnX, y: btnY, w: size, h: size };

    ctx.save();
    ctx.translate(btnX + size / 2, btnY + size / 2);

    // Fundo circular semitransparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Ícone de alto-falante
    const s = size * 0.35;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1, size * 0.06);
    ctx.lineCap = 'round';

    // Corpo do alto-falante (retângulo + triângulo)
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.3);
    ctx.lineTo(-s * 0.6, -s * 0.3);
    ctx.lineTo(-s * 0.6, s * 0.3);
    ctx.lineTo(-s * 0.2, s * 0.3);
    ctx.lineTo(s * 0.3, s * 0.7);
    ctx.lineTo(s * 0.3, -s * 0.7);
    ctx.closePath();
    ctx.fill();

    if (this.muted) {
      // X vermelho
      ctx.strokeStyle = '#FF5252';
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.beginPath();
      ctx.moveTo(s * 0.55, -s * 0.4);
      ctx.lineTo(s * 1.1, s * 0.4);
      ctx.moveTo(s * 1.1, -s * 0.4);
      ctx.lineTo(s * 0.55, s * 0.4);
      ctx.stroke();
    } else {
      // Ondas de som
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = Math.max(1, size * 0.05);

      // Onda pequena
      ctx.beginPath();
      ctx.arc(s * 0.4, 0, s * 0.35, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();

      // Onda grande
      ctx.beginPath();
      ctx.arc(s * 0.4, 0, s * 0.6, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Private — Sinalização de Curvas (modo Fácil) — § 7
  // ---------------------------------------------------------------------------

  private drawCurveSignal(
    curve: UpcomingCurve,
    w: number,
    h: number,
  ): void {
    const { ctx } = this;

    // Fade-in/out baseado na distância
    const approachProgress = 1 - (curve.distanceAhead / curve.totalApproachDist);
    // 0 = longe (recém apareceu), 1 = entrando na curva
    const clampedProgress = Math.max(0, Math.min(1, approachProgress));

    // Fade-in nos primeiros 20% de visibilidade, fade-out nos últimos 10%
    let alpha: number;
    if (clampedProgress < 0.2) {
      alpha = clampedProgress / 0.2;
    } else if (clampedProgress > 0.9) {
      alpha = (1 - clampedProgress) / 0.1;
    } else {
      alpha = 1.0;
    }
    alpha = Math.max(0, Math.min(1, alpha));

    if (alpha <= 0.01) return;

    const band = getIntensityBand(curve.intensity);

    // Escala de entrada (pop-in)
    const scaleIn = clampedProgress < 0.15
      ? 0.5 + 0.5 * (clampedProgress / 0.15)
      : 1.0;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Posição: centro-inferior da tela (acima do patinho)
    const centerX = w / 2;
    const centerY = h * 0.6;

    ctx.translate(centerX, centerY);
    ctx.scale(scaleIn, scaleIn);

    // Fundo pill semitransparente
    const pillW = w * 0.22;
    const pillH = h * 0.16;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.roundRectPath(-pillW / 2, -pillH / 2, pillW, pillH, pillH * 0.2);
    ctx.fill();

    // Borda colorida
    ctx.strokeStyle = band.color;
    ctx.lineWidth = 2.5;
    this.roundRectPath(-pillW / 2, -pillH / 2, pillW, pillH, pillH * 0.2);
    ctx.stroke();

    // Seta direcional (triângulo com tamanho variável por intensidade)
    const arrowSize = pillH * 0.32 * band.arrowScale;
    const arrowDir = curve.direction === 'left' ? -1 : 1;
    const arrowX = arrowDir * pillW * 0.05;
    const arrowY = -pillH * 0.08;

    ctx.fillStyle = band.color;
    ctx.beginPath();
    ctx.moveTo(arrowX + arrowDir * arrowSize, arrowY);
    ctx.lineTo(arrowX - arrowDir * arrowSize * 0.5, arrowY - arrowSize * 0.7);
    ctx.lineTo(arrowX - arrowDir * arrowSize * 0.5, arrowY + arrowSize * 0.7);
    ctx.closePath();
    ctx.fill();

    // Contorno da seta para contraste
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Gauge de intensidade (barra horizontal abaixo da seta)
    const gaugeW = pillW * 0.7;
    const gaugeH = pillH * 0.12;
    const gaugeX = -gaugeW / 2;
    const gaugeY = arrowY + arrowSize * 0.7 + pillH * 0.06;

    // Fundo do gauge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.roundRectPath(gaugeX, gaugeY, gaugeW, gaugeH, gaugeH * 0.4);
    ctx.fill();

    // Preenchimento proporcional do gauge
    const fillW = gaugeW * Math.min(1, curve.intensity);
    ctx.fillStyle = band.color;
    this.roundRectPath(gaugeX, gaugeY, fillW, gaugeH, gaugeH * 0.4);
    ctx.fill();

    // Marcas de divisão no gauge (para acessibilidade por forma)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const markX = gaugeX + gaugeW * (i / 3);
      ctx.beginPath();
      ctx.moveTo(markX, gaugeY + 1);
      ctx.lineTo(markX, gaugeY + gaugeH - 1);
      ctx.stroke();
    }

    // Label de intensidade (forma textual — acessibilidade)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = `bold ${Math.round(pillH * 0.13)}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(band.label, 0, gaugeY + gaugeH + pillH * 0.03);

    // Pulsação sutil na seta (urgência crescente)
    if (clampedProgress > 0.6) {
      const pulseIntensity = (clampedProgress - 0.6) / 0.4;
      const pulse = 0.3 + Math.sin(Date.now() * 0.008) * 0.3 * pulseIntensity;
      ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.15})`;
      this.roundRectPath(-pillW / 2, -pillH / 2, pillW, pillH, pillH * 0.2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Cria um path de retângulo arredondado (sem fill/stroke). */
  private roundRectPath(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
