/**
 * Sprites do patinho — Canvas 2D aprimorado com poses.
 *
 * Estilo Cartoon 2D: contornos, cores vibrantes, expressão fofa.
 * 5 poses: idle, leanLeft, leanRight, scared, falling.
 *
 * Ref: 03-TECH-STACK.md § 3.2
 */

import type { DuckPose } from '../types/index.ts';

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/** Desenha o corpo oval do patinho. */
function drawBody(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  outline: number,
): void {
  // Sombra no chão
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 0, bw * 0.8, bw * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Corpo principal
  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = '#CC8800';
  ctx.lineWidth = outline;
  ctx.beginPath();
  ctx.ellipse(0, -bh * 0.55, bw, bh, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ventre mais claro
  ctx.fillStyle = '#FFECB3';
  ctx.beginPath();
  ctx.ellipse(0, -bh * 0.4, bw * 0.55, bh * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Brilho no peito
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath();
  ctx.ellipse(-bw * 0.2, -bh * 0.75, bw * 0.25, bh * 0.3, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

/** Desenha uma asa. side: -1 esquerda, +1 direita */
function drawWing(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  side: number,
  raised: boolean,
): void {
  ctx.fillStyle = '#E6C200';
  ctx.strokeStyle = '#CC8800';
  ctx.lineWidth = 1.5;
  const wingAngle = raised ? side * -0.5 : side * 0.2;
  const wingY = raised ? -bh * 0.65 : -bh * 0.5;
  ctx.beginPath();
  ctx.ellipse(
    side * bw * 0.7, wingY,
    bw * 0.28, bh * 0.4,
    wingAngle, 0, Math.PI * 2,
  );
  ctx.fill();
  ctx.stroke();
}

/** Desenha a cabeça e rosto. */
function drawHead(
  ctx: CanvasRenderingContext2D,
  size: number,
  bh: number,
  pose: DuckPose,
): void {
  const headR = size * 0.22;
  const headY = -bh * 1.05;

  // Cabeça
  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = '#CC8800';
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Topete fofo
  ctx.fillStyle = '#FFCA28';
  ctx.beginPath();
  ctx.ellipse(-headR * 0.1, headY - headR * 0.85, headR * 0.3, headR * 0.25, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headR * 0.15, headY - headR * 0.9, headR * 0.2, headR * 0.2, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Bico
  const beakS = headR * 0.6;
  ctx.fillStyle = '#FF8C00';
  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = 1;
  if (pose === 'scared' || pose === 'falling') {
    // Bico aberto (surpresa)
    ctx.beginPath();
    ctx.moveTo(headR * 0.3, headY - beakS * 0.3);
    ctx.lineTo(headR + beakS * 0.8, headY - beakS * 0.15);
    ctx.lineTo(headR + beakS * 0.8, headY + beakS * 0.3);
    ctx.lineTo(headR * 0.3, headY + beakS * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Interior da boca
    ctx.fillStyle = '#D32F2F';
    ctx.beginPath();
    ctx.ellipse(headR * 0.65, headY + beakS * 0.1, beakS * 0.2, beakS * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(headR * 0.4, headY - beakS * 0.2);
    ctx.lineTo(headR + beakS, headY);
    ctx.lineTo(headR * 0.4, headY + beakS * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Olhos
  drawEyes(ctx, headR, headY, pose);

  // Bochechas
  ctx.fillStyle = 'rgba(255, 150, 150, 0.35)';
  ctx.beginPath();
  ctx.ellipse(headR * 0.55, headY + headR * 0.22, headR * 0.2, headR * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-headR * 0.35, headY + headR * 0.22, headR * 0.15, headR * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Desenha os olhos baseado na pose. */
function drawEyes(
  ctx: CanvasRenderingContext2D,
  headR: number,
  headY: number,
  pose: DuckPose,
): void {
  const eyeX = headR * 0.15;
  const eyeY = headY - headR * 0.15;

  if (pose === 'scared' || pose === 'falling') {
    // Olhos arregalados
    const eyeR = headR * 0.22;
    const pupilR = eyeR * 0.45;

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupila pequena (susto)
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY + eyeR * 0.1, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Brilho
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.25, eyeY - eyeR * 0.25, pupilR * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Olhos normais (felizes)
    const eyeR = headR * 0.16;
    const pupilR = eyeR * 0.6;
    const lookX = pose === 'leanLeft' ? -0.3 : pose === 'leanRight' ? 0.3 : 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(eyeX + lookX * eyeR, eyeY, pupilR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.2, eyeY - eyeR * 0.25, pupilR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Desenha o patinho na pose especificada.
 *
 * @param ctx Contexto 2D do canvas.
 * @param x Posição X (centro).
 * @param y Posição Y (base).
 * @param size Tamanho de referência (altura total).
 * @param pose Pose atual do patinho.
 * @param lean Inclinação lateral (-1 a +1) para offset visual.
 */
export function drawDuck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  pose: DuckPose,
  lean: number,
): void {
  ctx.save();
  ctx.translate(x, y);

  const bodyW = size * 0.45;
  const bodyH = size * 0.5;
  const outline = Math.max(1.5, size * 0.025);

  switch (pose) {
    case 'idle':
      drawBody(ctx, bodyW, bodyH, outline);
      drawWing(ctx, bodyW, bodyH, -1, false);
      drawWing(ctx, bodyW, bodyH, 1, false);
      drawHead(ctx, size, bodyH, pose);
      break;

    case 'leanLeft':
      ctx.rotate(lean * 0.22);
      drawBody(ctx, bodyW, bodyH, outline);
      drawWing(ctx, bodyW, bodyH, -1, true);
      drawWing(ctx, bodyW, bodyH, 1, false);
      drawHead(ctx, size, bodyH, pose);
      break;

    case 'leanRight':
      ctx.rotate(lean * 0.22);
      drawBody(ctx, bodyW, bodyH, outline);
      drawWing(ctx, bodyW, bodyH, -1, false);
      drawWing(ctx, bodyW, bodyH, 1, true);
      drawHead(ctx, size, bodyH, pose);
      break;

    case 'scared': {
      // Corpo encolhido, tremor leve
      const tremor = Math.sin(Date.now() * 0.03) * 1.5;
      ctx.translate(tremor, 0);
      drawBody(ctx, bodyW * 0.95, bodyH * 0.95, outline);
      drawWing(ctx, bodyW, bodyH, -1, true);
      drawWing(ctx, bodyW, bodyH, 1, true);
      drawHead(ctx, size, bodyH * 0.95, pose);
      break;
    }

    case 'falling': {
      // Rotação dramática + braços estendidos
      const wobble = Math.sin(Date.now() * 0.008) * 0.15;
      ctx.rotate(0.3 + wobble);
      ctx.translate(0, -size * 0.08);
      drawBody(ctx, bodyW, bodyH, outline);
      drawWing(ctx, bodyW * 1.1, bodyH, -1, true);
      drawWing(ctx, bodyW * 1.1, bodyH, 1, true);
      drawHead(ctx, size, bodyH, pose);
      break;
    }
  }

  ctx.restore();
}

/**
 * Desenha um patinho pequeno para o HUD (indicador de vidas).
 */
export function drawDuckIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alive: boolean,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alive ? 1.0 : 0.25;

  const color = alive ? '#FFD700' : '#888888';
  const beakColor = alive ? '#FF8C00' : '#666666';

  // Corpo
  ctx.fillStyle = color;
  ctx.strokeStyle = alive ? '#CC8800' : '#555';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.3, size * 0.35, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ventre
  if (alive) {
    ctx.fillStyle = '#FFECB3';
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.2, size * 0.18, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cabeça
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -size * 0.75, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bico
  ctx.fillStyle = beakColor;
  ctx.beginPath();
  ctx.moveTo(size * 0.1, -size * 0.78);
  ctx.lineTo(size * 0.35, -size * 0.75);
  ctx.lineTo(size * 0.1, -size * 0.7);
  ctx.closePath();
  ctx.fill();

  // Olho
  ctx.fillStyle = alive ? '#333' : '#555';
  ctx.beginPath();
  ctx.arc(size * 0.02, -size * 0.78, size * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Brilho no olho
  if (alive) {
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(size * 0.04, -size * 0.8, size * 0.02, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
