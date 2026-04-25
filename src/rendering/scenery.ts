/**
 * Elementos de cenário desenhados via Canvas 2D.
 *
 * Estilo Cartoon 2D com contornos e cores saturadas,
 * referência visual: Cut the Rope, Angry Birds.
 *
 * Ref: 03-TECH-STACK.md § 3.3
 */

// ---------------------------------------------------------------------------
// Nuvem (aprimorada)
// ---------------------------------------------------------------------------

/**
 * Desenha uma nuvem fofa estilizada.
 *
 * @param ctx Contexto 2D.
 * @param x Posição X (centro).
 * @param y Posição Y (centro).
 * @param scale Escala (1.0 = tamanho padrão ~120px).
 * @param alpha Opacidade (0.0–1.0).
 */
export function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  alpha = 0.85,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // Sombra da nuvem
  ctx.fillStyle = 'rgba(180, 210, 240, 0.3)';
  ctx.beginPath();
  ctx.ellipse(2, 6, 58, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Corpo principal (branco com tom azulado suave)
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = 'rgba(180, 200, 220, 0.5)';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  // Base larga
  ctx.ellipse(0, 8, 55, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  // Bump esquerdo
  ctx.ellipse(-25, -2, 22, 20, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  // Bump central (maior, mais alto)
  ctx.ellipse(0, -10, 28, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  // Bump direito
  ctx.ellipse(22, 0, 20, 18, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Brilho no topo
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.ellipse(-5, -18, 14, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Árvore
// ---------------------------------------------------------------------------

/**
 * Desenha uma árvore estilizada cartoon.
 *
 * @param ctx Contexto 2D.
 * @param x Posição X (base do tronco).
 * @param y Posição Y (base do tronco).
 * @param scale Escala (1.0 = ~80px altura).
 * @param variant Variação visual (0–2) para diversidade.
 */
export function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  variant = 0,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const outlineW = 2.5;

  // --- Sombra no chão ---
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Tronco ---
  ctx.fillStyle = '#8B5E3C';
  ctx.strokeStyle = '#5D3A1A';
  ctx.lineWidth = outlineW;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(-5, -25);
  ctx.lineTo(5, -25);
  ctx.lineTo(6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Textura do tronco
  ctx.strokeStyle = 'rgba(93, 58, 26, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, -5);
  ctx.lineTo(-1, -18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, -8);
  ctx.lineTo(3, -20);
  ctx.stroke();

  // --- Copa ---
  const greens = [
    ['#4CAF50', '#2E7D32'], // Verde médio
    ['#66BB6A', '#388E3C'], // Verde claro
    ['#43A047', '#1B5E20'], // Verde escuro
  ];
  const [mainGreen, darkGreen] = greens[variant % 3];

  ctx.strokeStyle = darkGreen;
  ctx.lineWidth = outlineW;

  // Camada inferior (maior)
  ctx.fillStyle = darkGreen;
  ctx.beginPath();
  ctx.ellipse(0, -35, 24, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Camada superior
  ctx.fillStyle = mainGreen;
  ctx.beginPath();
  ctx.ellipse(0, -48, 20, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Topo
  ctx.fillStyle = mainGreen;
  ctx.beginPath();
  ctx.ellipse(-2, -58, 13, 12, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Brilho na copa
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.ellipse(-6, -52, 8, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Flor
// ---------------------------------------------------------------------------

/**
 * Desenha uma florzinha decorativa cartoon.
 *
 * @param ctx Contexto 2D.
 * @param x Posição X (centro).
 * @param y Posição Y (centro).
 * @param scale Escala (1.0 = ~16px).
 * @param hue Matiz HSL da cor das pétalas (0–360).
 */
export function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  hue = 0,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Caule
  ctx.strokeStyle = '#388E3C';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(0, 0);
  ctx.stroke();

  // Folhinha
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.ellipse(4, 4, 4, 2, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Pétalas (5)
  ctx.fillStyle = `hsl(${hue}, 80%, 65%)`;
  ctx.strokeStyle = `hsl(${hue}, 70%, 45%)`;
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const px = Math.cos(angle) * 5;
    const py = Math.sin(angle) * 5;
    ctx.beginPath();
    ctx.ellipse(px, py - 1, 3.5, 2.5, angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Centro
  ctx.fillStyle = '#FFC107';
  ctx.strokeStyle = '#F57F17';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, -1, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Montanha
// ---------------------------------------------------------------------------

/**
 * Desenha uma montanha no horizonte.
 *
 * @param ctx Contexto 2D.
 * @param x Posição X (centro da base).
 * @param y Posição Y (base).
 * @param scale Escala (1.0 = ~100px).
 * @param hue Matiz (default: azul-cinza para distância atmosférica).
 */
export function drawMountain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  hue = 220,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Montanha principal
  const gradient = ctx.createLinearGradient(0, -70, 0, 0);
  gradient.addColorStop(0, `hsla(${hue}, 25%, 55%, 0.7)`);
  gradient.addColorStop(1, `hsla(${hue}, 20%, 45%, 0.5)`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(-70, 0);
  ctx.lineTo(-10, -60);
  ctx.lineTo(5, -70);
  ctx.lineTo(20, -55);
  ctx.lineTo(80, 0);
  ctx.closePath();
  ctx.fill();

  // Contorno suave
  ctx.strokeStyle = `hsla(${hue}, 30%, 40%, 0.3)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Neve no pico
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.moveTo(-5, -63);
  ctx.lineTo(5, -70);
  ctx.lineTo(12, -60);
  ctx.lineTo(3, -57);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Sol
// ---------------------------------------------------------------------------

/**
 * Desenha o sol com raios animados.
 *
 * @param ctx Contexto 2D.
 * @param x Posição X (centro).
 * @param y Posição Y (centro).
 * @param scale Escala (1.0 = ~40px).
 * @param time Tempo em ms para animação dos raios.
 */
export function drawSun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  time = 0,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const rotation = time * 0.0003;
  const pulse = 1.0 + Math.sin(time * 0.002) * 0.06;

  // Brilho externo (glow)
  const glow = ctx.createRadialGradient(0, 0, 12, 0, 0, 40 * pulse);
  glow.addColorStop(0, 'rgba(255, 236, 64, 0.35)');
  glow.addColorStop(1, 'rgba(255, 236, 64, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 40 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Raios
  ctx.save();
  ctx.rotate(rotation);
  ctx.strokeStyle = 'rgba(255, 193, 7, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  const rayCount = 10;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i * Math.PI * 2) / rayCount;
    const innerR = 16 * pulse;
    const outerR = 26 * pulse;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
    ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
    ctx.stroke();
  }
  ctx.restore();

  // Corpo do sol
  ctx.fillStyle = '#FFD54F';
  ctx.strokeStyle = '#F9A825';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Brilho
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(-4, -4, 5, 0, Math.PI * 2);
  ctx.fill();

  // Expressão fofa: olhos e sorriso
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.arc(-4, -1, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4, -1, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Sorriso
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 1, 5, 0.15, Math.PI - 0.15);
  ctx.stroke();

  // Bochechas rosadas
  ctx.fillStyle = 'rgba(255, 138, 101, 0.35)';
  ctx.beginPath();
  ctx.ellipse(-8, 3, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(8, 3, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Grama decorativa (tufos)
// ---------------------------------------------------------------------------

/**
 * Desenha um tufo de grama estilizado.
 *
 * @param ctx Contexto 2D.
 * @param x Posição X (centro base).
 * @param y Posição Y (base).
 * @param scale Escala (1.0 = ~12px).
 */
export function drawGrassTuft(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = '#2E7D32';
  ctx.strokeStyle = '#1B5E20';
  ctx.lineWidth = 0.8;

  // 3 lâminas
  const blades = [
    { angle: -0.3, h: 10 },
    { angle: 0, h: 13 },
    { angle: 0.25, h: 9 },
  ];

  for (const blade of blades) {
    ctx.save();
    ctx.rotate(blade.angle);
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.quadraticCurveTo(-1, -blade.h * 0.6, 0, -blade.h);
    ctx.quadraticCurveTo(1, -blade.h * 0.6, 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}
