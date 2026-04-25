/**
 * Canvas 2D pseudo-3D — renderização principal.
 *
 * Renderiza o tobogã como scanlines horizontais com perspectiva,
 * o patinho na base da tela, cenário decorativo e HUD mínimo.
 *
 * Ref: 03-TECH-STACK.md § 3
 * Ref: 03-TECH-STACK.md § 8 — src/rendering/renderer.ts
 */

import type { GameSession, PlayerState, TrackSegment, UpcomingCurve } from '../types/index.ts';
import { projectTrack } from './camera.ts';
import type { CameraConfig } from './camera.ts';
import { drawDuck } from './sprites.ts';
import { drawCloud, drawTree, drawFlower, drawMountain, drawSun, drawGrassTuft } from './scenery.ts';
import { HUD } from '../ui/hud.ts';

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
  readonly hud: HUD;

  constructor(ctx: CanvasRenderingContext2D, cameraConfig: CameraConfig) {
    this.ctx = ctx;
    this.cameraConfig = cameraConfig;
    this.hud = new HUD(ctx);
  }

  /**
   * Renderiza um frame completo do jogo.
   */
  renderFrame(
    session: GameSession,
    visibleSegments: TrackSegment[],
    segmentStartZs: number[],
    player: PlayerState,
    upcomingCurve: UpcomingCurve | null = null,
  ): void {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // 1. Céu + cenário de fundo
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

    // 3. Árvores e flores roadside
    this.drawRoadsideScenery(projected, w);

    // 4. Patinho
    const duckX = w / 2 + player.lean * w * 0.15;
    const duckY = h * 0.88;
    const duckSize = h * 0.18;
    drawDuck(ctx, duckX, duckY, duckSize, player.pose, player.lean);

    // 5. HUD
    this.hud.render(session, upcomingCurve);
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

  drawSky(w: number, h: number): void {
    const { ctx } = this;
    const horizonY = h * 0.38;

    const gradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    gradient.addColorStop(0, SKY_TOP);
    gradient.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, horizonY);

    const now = Date.now();

    // Sol (canto superior direito)
    drawSun(ctx, w * 0.88, horizonY * 0.28, 1.8, now);

    // Montanhas no horizonte
    drawMountain(ctx, w * 0.12, horizonY, 1.2, 210);
    drawMountain(ctx, w * 0.35, horizonY, 1.6, 225);
    drawMountain(ctx, w * 0.7, horizonY, 1.0, 200);

    // Nuvens
    const cloudY = horizonY * 0.35;
    drawCloud(ctx, w * 0.12, cloudY, 0.7, 0.7);
    drawCloud(ctx, w * 0.5, cloudY * 0.65, 0.9, 0.8);
    drawCloud(ctx, w * 0.8, cloudY * 1.1, 0.55, 0.65);
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

  /**
   * Desenha cenário decorativo nas margens da pista (árvores, flores, grama).
   * Renderiza apenas nos segmentos mais próximos para performance.
   */
  private drawRoadsideScenery(
    projected: ReturnType<typeof projectTrack>,
    w: number,
  ): void {
    const { ctx } = this;

    // Só decorar segmentos com escala visível (próximos)
    for (let i = projected.length - 1; i >= 0; i--) {
      const seg = projected[i];
      if (seg.scale < 0.005 || seg.scale > 0.4) continue;

      const roadHalfW = seg.roadWidth / 2;
      const borderW = seg.roadWidth * 0.12;
      const leftEdge = seg.offsetX - roadHalfW - borderW;
      const rightEdge = seg.offsetX + roadHalfW + borderW;

      // Árvores a cada ~6 scanlines (evitar overcrowding)
      if (i % 18 === 0 && seg.scale > 0.01) {
        const treeScale = seg.scale * 2.5;
        // Árvore à esquerda
        if (leftEdge > 30) {
          drawTree(ctx, leftEdge - 25 * treeScale, seg.screenY, treeScale, i % 3);
        }
        // Árvore à direita
        if (rightEdge < w - 30) {
          drawTree(ctx, rightEdge + 25 * treeScale, seg.screenY, treeScale, (i + 1) % 3);
        }
      }

      // Flores a cada ~10 scanlines
      if (i % 10 === 3 && seg.scale > 0.015) {
        const flowerScale = seg.scale * 12;
        const hues = [0, 45, 280, 320, 200]; // vermelho, laranja, roxo, rosa, azul
        const hue = hues[i % 5];
        if (leftEdge > 15) {
          drawFlower(ctx, leftEdge - 8 * flowerScale, seg.screenY, flowerScale, hue);
        }
        if (rightEdge < w - 15) {
          drawFlower(ctx, rightEdge + 10 * flowerScale, seg.screenY, flowerScale, (hue + 120) % 360);
        }
      }

      // Tufos de grama
      if (i % 7 === 0 && seg.scale > 0.02) {
        const grassScale = seg.scale * 6;
        if (leftEdge > 10) {
          drawGrassTuft(ctx, leftEdge - 4 * grassScale, seg.screenY, grassScale);
        }
      }
    }
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
