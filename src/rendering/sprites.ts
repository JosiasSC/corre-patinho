/**
 * Carregamento e gerenciamento de sprites do patinho.
 *
 * Versão T-009: patinho desenhado via Canvas 2D (formas geométricas).
 * Será substituído por assets de imagem em T-010.
 *
 * Ref: 03-TECH-STACK.md § 3.2
 * Ref: 03-TECH-STACK.md § 8 — src/rendering/sprites.ts
 */

/**
 * Desenha o patinho usando formas geométricas no Canvas 2D.
 *
 * @param ctx Contexto 2D do canvas.
 * @param x Posição X (centro do patinho).
 * @param y Posição Y (base do patinho).
 * @param size Tamanho de referência (altura total).
 * @param lean Inclinação lateral (-1 a +1) para feedback visual de curva.
 */
export function drawDuck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  lean: number,
): void {
  ctx.save();
  ctx.translate(x, y);

  // Rotação leve baseada no lean (max ±15°)
  const rotation = lean * 0.26; // ~15° em radianos
  ctx.rotate(rotation);

  const bodyWidth = size * 0.45;
  const bodyHeight = size * 0.5;
  const headRadius = size * 0.2;

  // --- Sombra no chão ---
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 0, bodyWidth * 0.8, size * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Corpo (oval amarelo) ---
  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = '#CC8800';
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.beginPath();
  ctx.ellipse(0, -bodyHeight * 0.55, bodyWidth, bodyHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // --- Asa (leve, visível do lado da inclinação) ---
  if (Math.abs(lean) > 0.1) {
    const side = lean > 0 ? 1 : -1;
    ctx.fillStyle = '#E6C200';
    ctx.beginPath();
    ctx.ellipse(
      side * bodyWidth * 0.6,
      -bodyHeight * 0.5,
      bodyWidth * 0.3,
      bodyHeight * 0.45,
      side * 0.3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // --- Cabeça (círculo) ---
  const headY = -bodyHeight * 1.05;
  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = '#CC8800';
  ctx.beginPath();
  ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // --- Bico (triângulo laranja) ---
  const beakSize = headRadius * 0.6;
  ctx.fillStyle = '#FF8C00';
  ctx.beginPath();
  ctx.moveTo(headRadius * 0.4, headY - beakSize * 0.2);
  ctx.lineTo(headRadius + beakSize, headY);
  ctx.lineTo(headRadius * 0.4, headY + beakSize * 0.3);
  ctx.closePath();
  ctx.fill();

  // --- Olhos ---
  const eyeX = headRadius * 0.15;
  const eyeY = headY - headRadius * 0.15;
  const eyeRadius = headRadius * 0.15;
  const pupilRadius = eyeRadius * 0.6;

  // Branco do olho
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Pupila (deslocada na direção do lean)
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.arc(eyeX + lean * eyeRadius * 0.3, eyeY, pupilRadius, 0, Math.PI * 2);
  ctx.fill();

  // Brilho no olho
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(eyeX + eyeRadius * 0.2, eyeY - eyeRadius * 0.25, pupilRadius * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // --- Bochechas (rosa suave) ---
  ctx.fillStyle = 'rgba(255, 150, 150, 0.3)';
  ctx.beginPath();
  ctx.ellipse(headRadius * 0.55, headY + headRadius * 0.2, headRadius * 0.2, headRadius * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

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

  // Corpo simples
  ctx.fillStyle = alive ? '#FFD700' : '#888888';
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.3, size * 0.35, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cabeça
  ctx.beginPath();
  ctx.arc(0, -size * 0.75, size * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Bico
  ctx.fillStyle = alive ? '#FF8C00' : '#666666';
  ctx.beginPath();
  ctx.moveTo(size * 0.1, -size * 0.78);
  ctx.lineTo(size * 0.35, -size * 0.75);
  ctx.lineTo(size * 0.1, -size * 0.7);
  ctx.closePath();
  ctx.fill();

  // Olho
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.arc(size * 0.02, -size * 0.78, size * 0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
