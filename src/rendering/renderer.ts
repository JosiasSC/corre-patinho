/**
 * Canvas 2D pseudo-3D — renderização principal.
 *
 * Renderiza o tobogã como scanlines horizontais com perspectiva,
 * o patinho na base da tela, e HUD mínimo.
 *
 * Ref: 03-TECH-STACK.md § 3
 * Ref: 03-TECH-STACK.md § 8 — src/rendering/renderer.ts
 */

import type { GameSession, PlayerState, TrackSegment } from '../types/index.ts';
import { projectTrack } from './camera.ts';
import type { CameraConfig } from './camera.ts';
import { drawDuck, drawDuckIcon } from './sprites.ts';

// ---------------------------------------------------------------------------
// Cores do tobogã (estilo água/piscina)
// ---------------------------------------------------------------------------

/** Cor clara da pista (água rasa). */
const ROAD_LIGHT = '#4FC3F7';
/** Cor escura da pista (água profunda). */
const ROAD_DARK = '#039BE5';
/** Cor clara da borda (parede do tobogã). */
const BORDER_LIGHT = '#FFEB3B';
/** Cor escura da borda. */
const BORDER_DARK = '#FBC02D';
/** Cor do piso fora da pista. */
const GRASS_LIGHT = '#66BB6A';
const GRASS_DARK = '#43A047';
/** Cor do céu (gradiente). */
const SKY_TOP = '#1565C0';
const SKY_BOTTOM = '#81D4FA';

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly cameraConfig: CameraConfig;

  constructor(ctx: CanvasRenderingContext2D, cameraConfig: CameraConfig) {
    this.ctx = ctx;
    this.cameraConfig = cameraConfig;
  }

  /**
   * Renderiza um frame completo do jogo.
   */
  renderFrame(
    session: GameSession,
    visibleSegments: TrackSegment[],
    segmentStartZs: number[],
    player: PlayerState,
  ): void {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // 1. Céu
    this.drawSky(w, h);

    // 2. Tobogã pseudo-3D
    const projected = projectTrack(
      session.trackPosition,
      visibleSegments,
      segmentStartZs,
      w, h,
      this.cameraConfig,
    );
    this.drawRoad(projected, w, h);

    // 3. Patinho
    const duckX = w / 2 + player.lean * w * 0.15;
    const duckY = h * 0.88;
    const duckSize = h * 0.18;
    drawDuck(ctx, duckX, duckY, duckSize, player.lean);

    // 4. HUD
    this.drawHUD(session, w, h);
  }

  /**
   * Renderiza a tela de "Toque para começar".
   */
  renderReadyScreen(): void {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    this.drawSky(w, h);

    // Tobogã estático
    ctx.fillStyle = ROAD_LIGHT;
    ctx.fillRect(w * 0.25, h * 0.38, w * 0.5, h * 0.62);

    // Bordas
    ctx.fillStyle = BORDER_LIGHT;
    ctx.fillRect(w * 0.22, h * 0.38, w * 0.04, h * 0.62);
    ctx.fillRect(w * 0.74, h * 0.38, w * 0.04, h * 0.62);

    // Patinho
    drawDuck(ctx, w / 2, h * 0.75, h * 0.22, 0);

    // Título
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(h * 0.08)}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.fillText('🐥 Corre Patinho!', w / 2, h * 0.2);
    ctx.shadowBlur = 0;

    // Subtítulo pulsante
    const pulse = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
    ctx.font = `${Math.round(h * 0.04)}px "Segoe UI", sans-serif`;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.fillText('Toque para começar', w / 2, h * 0.35);
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.6})`;
    ctx.font = `${Math.round(h * 0.025)}px "Segoe UI", sans-serif`;
    ctx.fillText('Setas ←/→ ou arraste para desviar das curvas', w / 2, h * 0.42);
  }

  /**
   * Renderiza a tela de game over.
   */
  renderGameOverScreen(session: GameSession): void {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Fundo escurecido
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, w, h);

    // Painel central
    const panelW = w * 0.5;
    const panelH = h * 0.55;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    ctx.fillStyle = 'rgba(26, 26, 46, 0.92)';
    ctx.strokeStyle = '#FFEB3B';
    ctx.lineWidth = 3;
    this.roundRect(panelX, panelY, panelW, panelH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Título
    ctx.fillStyle = '#FF5252';
    ctx.font = `bold ${Math.round(h * 0.07)}px "Segoe UI", sans-serif`;
    ctx.fillText('Game Over!', w / 2, panelY + panelH * 0.18);

    // Score
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.round(h * 0.04)}px "Segoe UI", sans-serif`;
    ctx.fillText(`Distância: ${Math.floor(session.maxScore)}m`, w / 2, panelY + panelH * 0.4);

    // Seed
    ctx.fillStyle = '#AAAAAA';
    ctx.font = `${Math.round(h * 0.025)}px "Segoe UI", sans-serif`;
    ctx.fillText(`Seed: ${session.seed}`, w / 2, panelY + panelH * 0.55);

    // Retry
    const pulse = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
    ctx.fillStyle = `rgba(255, 235, 59, ${pulse})`;
    ctx.font = `${Math.round(h * 0.035)}px "Segoe UI", sans-serif`;
    ctx.fillText('Toque para jogar novamente', w / 2, panelY + panelH * 0.78);
  }

  /**
   * Renderiza flash vermelho de perda de vida.
   */
  renderDeathFlash(intensity: number): void {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.35})`;
    ctx.fillRect(0, 0, w, h);
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private drawSky(w: number, h: number): void {
    const { ctx } = this;
    const horizonY = h * 0.38;

    const gradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    gradient.addColorStop(0, SKY_TOP);
    gradient.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, horizonY);

    // Nuvens simples (decorativas)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const cloudY = horizonY * 0.35;
    this.drawCloud(w * 0.15, cloudY, w * 0.12);
    this.drawCloud(w * 0.55, cloudY * 0.7, w * 0.15);
    this.drawCloud(w * 0.82, cloudY * 1.1, w * 0.1);
  }

  private drawCloud(x: number, y: number, size: number): void {
    const { ctx } = this;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y - size * 0.15, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x - size * 0.3, y + size * 0.05, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawRoad(
    projected: ReturnType<typeof projectTrack>,
    w: number,
    h: number,
  ): void {
    const { ctx } = this;

    // Preencher área abaixo do horizonte com grama
    const horizonY = h * 0.38;
    ctx.fillStyle = GRASS_LIGHT;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // Renderizar scanlines de trás para frente (mais distante primeiro)
    for (let i = projected.length - 1; i >= 0; i--) {
      const seg = projected[i];
      const nextSeg = i > 0 ? projected[i - 1] : null;

      const y = seg.screenY;
      const nextY = nextSeg ? nextSeg.screenY : h;
      const lineHeight = nextY - y;

      if (lineHeight <= 0) continue;

      const centerX = seg.offsetX;
      const roadHalfW = seg.roadWidth / 2;
      const borderW = seg.roadWidth * 0.12;

      // Grama
      ctx.fillStyle = seg.isLightStripe ? GRASS_LIGHT : GRASS_DARK;
      ctx.fillRect(0, y, w, lineHeight);

      // Borda esquerda
      ctx.fillStyle = seg.isLightStripe ? BORDER_LIGHT : BORDER_DARK;
      ctx.fillRect(centerX - roadHalfW - borderW, y, borderW, lineHeight);

      // Borda direita
      ctx.fillRect(centerX + roadHalfW, y, borderW, lineHeight);

      // Pista (água do tobogã)
      ctx.fillStyle = seg.isLightStripe ? ROAD_LIGHT : ROAD_DARK;
      ctx.fillRect(centerX - roadHalfW, y, roadHalfW * 2, lineHeight);

      // Linha central (brilho de água)
      if (seg.isLightStripe && seg.scale > 0.003) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        const lineW = seg.roadWidth * 0.02;
        ctx.fillRect(centerX - lineW / 2, y, lineW, lineHeight);
      }
    }
  }

  private drawHUD(session: GameSession, w: number, h: number): void {
    const { ctx } = this;
    const padding = w * 0.025;
    const fontSize = Math.round(h * 0.045);

    // Score (canto superior direito)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${fontSize}px "Segoe UI", sans-serif`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillText(`${Math.floor(session.maxScore)}m`, w - padding + 2, padding + 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(`${Math.floor(session.maxScore)}m`, w - padding, padding);
    ctx.shadowBlur = 0;

    // Vidas (canto superior esquerdo, ícones de patinho)
    const iconSize = h * 0.04;
    const iconSpacing = iconSize * 1.6;
    for (let i = 0; i < 3; i++) {
      drawDuckIcon(
        ctx,
        padding + iconSize + i * iconSpacing,
        padding + iconSize * 1.2,
        iconSize,
        i < session.lives,
      );
    }

    // Indicador de velocidade (sutil)
    ctx.textAlign = 'right';
    ctx.font = `${Math.round(h * 0.025)}px "Segoe UI", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(`${session.speed.toFixed(1)}x`, w - padding, padding + fontSize + 8);
  }

  /** Desenha um retângulo arredondado (helper). */
  private roundRect(
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

  /**
   * Renderiza scanlines de debug (para calibração).
   * Não usado em produção.
   */
  renderDebug(
    _session: GameSession,
    _projected: ReturnType<typeof projectTrack>,
    _w: number,
    _h: number,
  ): void {
    // Reservado para T-011 e calibração
  }
}

/** Cria o renderer. */
export function createRenderer(
  ctx: CanvasRenderingContext2D,
  cameraConfig: CameraConfig,
): Renderer {
  return new Renderer(ctx, cameraConfig);
}
