/**
 * Entry point — inicialização do jogo Corre Patinho.
 *
 * Ref: 03-TECH-STACK.md § 8 — src/main.ts
 */

import './style.css';

/**
 * Inicializa o canvas do jogo e exibe uma tela de placeholder
 * até que o game loop seja implementado (T-009).
 */
function init(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #game-canvas não encontrado');
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Não foi possível obter contexto 2D do canvas');
  }

  // Ajustar canvas para preencher o viewport
  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  // Tela de placeholder — será substituída pelo game loop em T-009
  drawPlaceholder(ctx, canvas);
}

/** Redimensiona o canvas mantendo aspect ratio 16:9. */
function resizeCanvas(canvas: HTMLCanvasElement): void {
  const targetAspect = 16 / 9;
  const windowAspect = window.innerWidth / window.innerHeight;

  let width: number;
  let height: number;

  if (windowAspect > targetAspect) {
    // Janela mais larga que 16:9 — letterbox horizontal
    height = Math.min(window.innerHeight, 720);
    width = height * targetAspect;
  } else {
    // Janela mais alta que 16:9 — letterbox vertical
    width = Math.min(window.innerWidth, 1280);
    height = width / targetAspect;
  }

  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  canvas.style.width = `${Math.round(width)}px`;
  canvas.style.height = `${Math.round(height)}px`;

  // Redesenhar após resize
  const ctx = canvas.getContext('2d');
  if (ctx) drawPlaceholder(ctx, canvas);
}

/** Desenha tela de placeholder enquanto o jogo não está implementado. */
function drawPlaceholder(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  // Fundo com gradiente azul (água do tobogã)
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#1E90FF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Título
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(canvas.height * 0.08)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐥 Corre Patinho!', canvas.width / 2, canvas.height * 0.4);

  // Subtítulo
  ctx.font = `${Math.round(canvas.height * 0.035)}px sans-serif`;
  ctx.fillStyle = '#FFFFFFCC';
  ctx.fillText('Projeto inicializado — aguardando T-009', canvas.width / 2, canvas.height * 0.55);
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
