/**
 * Entry point — inicialização do jogo Corre Patinho.
 *
 * Configura o canvas 16:9, instancia o Game e inicia o loop.
 * Ref: 03-TECH-STACK.md § 8 — src/main.ts
 */

import './style.css';
import { Game } from './core/game.ts';
import { initPWA } from './pwa/sw-register.ts';

/** Resolução interna do canvas (16:9). */
const INTERNAL_WIDTH = 1280;
const INTERNAL_HEIGHT = 720;

/** Inicializa o jogo. */
function init(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #game-canvas não encontrado');
  }

  // Configurar resolução interna fixa
  canvas.width = INTERNAL_WIDTH;
  canvas.height = INTERNAL_HEIGHT;

  // Ajustar tamanho visual no DOM (CSS) mantendo 16:9
  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  // Criar e iniciar o jogo
  const game = new Game(canvas);
  game.run();

  // Inicializar PWA (Service Worker + prompt de update)
  // Ref: 03-TECH-STACK.md § 5
  initPWA();
}

/**
 * Redimensiona o canvas CSS mantendo aspect ratio 16:9.
 * A resolução interna é fixa (1280x720); o CSS escala.
 */
function resizeCanvas(canvas: HTMLCanvasElement): void {
  const targetAspect = 16 / 9;
  const windowAspect = window.innerWidth / window.innerHeight;

  let displayWidth: number;
  let displayHeight: number;

  if (windowAspect > targetAspect) {
    // Janela mais larga que 16:9 — letterbox horizontal
    displayHeight = Math.min(window.innerHeight, 720);
    displayWidth = displayHeight * targetAspect;
  } else {
    // Janela mais alta que 16:9 — letterbox vertical
    displayWidth = Math.min(window.innerWidth, 1280);
    displayHeight = displayWidth / targetAspect;
  }

  canvas.style.width = `${Math.round(displayWidth)}px`;
  canvas.style.height = `${Math.round(displayHeight)}px`;
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
