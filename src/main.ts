/**
 * Entry point — inicialização do jogo Corre Patinho.
 *
 * Configura o canvas 16:9 via LayoutManager, instancia o Game e inicia o loop.
 * Ref: 03-TECH-STACK.md § 8 — src/main.ts
 */

import './style.css';
import { Game } from './core/game.ts';
import { LayoutManager } from './ui/layout.ts';
import { initPWA } from './pwa/sw-register.ts';

/** Inicializa o jogo. */
function init(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #game-canvas não encontrado');
  }

  // Configurar layout (resolução interna, resize, orientation lock)
  // Ref: 03-TECH-STACK.md § 6
  const layout = new LayoutManager(canvas);

  // Criar e iniciar o jogo, passando o layout manager
  const game = new Game(canvas, layout);
  game.run();

  // Inicializar PWA (Service Worker + prompt de update)
  // Ref: 03-TECH-STACK.md § 5
  initPWA();
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
