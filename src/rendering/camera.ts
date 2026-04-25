/**
 * Projeção pseudo-3D, viewport, perspectiva.
 *
 * Implementa a técnica "Mode 7" / OutRun de renderização de estrada.
 * Cada scanline é projetada de baixo para cima com perspectiva decrescente.
 *
 * Ref: 03-TECH-STACK.md § 3.1
 * Ref: 03-TECH-STACK.md § 8 — src/rendering/camera.ts
 */

import type { ProjectedSegment, TrackSegment } from '../types/index.ts';

/** Parâmetros da câmera pseudo-3D. */
export interface CameraConfig {
  /** Altura do ponto de vista (afeta perspectiva). */
  height: number;
  /** Distância focal (afeta FOV). */
  focalLength: number;
  /** Profundidade do draw distance (quantas unidades renderizar). */
  drawDistance: number;
}

/** Configuração padrão da câmera. */
export const DEFAULT_CAMERA: CameraConfig = {
  height: 800,
  focalLength: 100,
  drawDistance: 3000,
};

/** Número de scanlines para renderização. */
export const SCANLINE_COUNT = 200;

/** Largura base da pista em unidades do mundo. */
const ROAD_BASE_WIDTH = 600;

/**
 * Projeta o percurso do tobogã em scanlines pseudo-3D.
 *
 * @param cameraZ Posição Z da câmera no track.
 * @param segments Segmentos do track visíveis.
 * @param segmentStartZs Posição Z de início de cada segmento.
 * @param canvasWidth Largura do canvas.
 * @param canvasHeight Altura do canvas.
 * @param camera Configuração da câmera.
 * @returns Array de segmentos projetados, de baixo para cima.
 */
export function projectTrack(
  cameraZ: number,
  segments: TrackSegment[],
  segmentStartZs: number[],
  canvasWidth: number,
  canvasHeight: number,
  camera: CameraConfig = DEFAULT_CAMERA,
): ProjectedSegment[] {
  const projected: ProjectedSegment[] = [];

  // Renderizar scanlines de baixo para cima
  let accumulatedCurvature = 0;
  const halfWidth = canvasWidth / 2;
  const horizonY = canvasHeight * 0.38; // Horizonte em ~38% do topo

  for (let i = 0; i < SCANLINE_COUNT; i++) {
    // Z no mundo para esta scanline (mais perto = index baixo)
    const ratio = i / SCANLINE_COUNT;
    const worldZ = cameraZ + camera.focalLength + ratio * camera.drawDistance;

    // Encontrar o segmento correspondente a este Z
    const segment = findSegmentAtZ(worldZ, segments, segmentStartZs);

    // Projeção de perspectiva
    const relativeZ = worldZ - cameraZ;
    const scale = camera.focalLength / relativeZ;

    // Posição Y na tela (de baixo para cima)
    const screenY = horizonY + (1 - ratio) * (canvasHeight - horizonY);

    // Curvatura acumulada (desloca lateralmente)
    if (segment) {
      accumulatedCurvature += segment.curvature * scale * 2.5;
    }
    const offsetX = halfWidth + accumulatedCurvature * canvasWidth * 0.6;

    // Largura da pista nesta scanline
    const roadWidth = ROAD_BASE_WIDTH * scale;

    // Alternância de faixas para efeito de velocidade
    const stripeFrequency = 3;
    const worldStripe = Math.floor(worldZ / (80 / stripeFrequency));
    const isLightStripe = worldStripe % 2 === 0;

    projected.push({
      screenY,
      scale,
      offsetX,
      roadWidth,
      isLightStripe,
      curvature: segment?.curvature ?? 0,
    });
  }

  return projected;
}

/**
 * Encontra o segmento do track na posição Z dada.
 */
function findSegmentAtZ(
  z: number,
  segments: TrackSegment[],
  segmentStartZs: number[],
): TrackSegment | null {
  for (let i = segments.length - 1; i >= 0; i--) {
    if (z >= segmentStartZs[i]) {
      return segments[i];
    }
  }
  return segments[0] ?? null;
}
