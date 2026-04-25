/**
 * Menu principal, seleção de dificuldade, game over, high scores.
 *
 * Renderiza todas as telas de menu no Canvas 2D (sem DOM).
 * Estilo cartoon vibrante — Ref: P8 (Cartoon 2D).
 *
 * Ref: 01-INTENT.md § 4 — 3 dificuldades
 * Ref: 02-GAME-MECHANICS.md § 5 — score, recorde, seed, top 10
 * Ref: 03-TECH-STACK.md § 6, § 8 — src/ui/menus.ts
 */

import type {
  Difficulty,
  GameSession,
  HighScores,
  MenuAction,
} from '../types/index.ts';
import { drawDuck } from '../rendering/sprites.ts';

// ---------------------------------------------------------------------------
// Paleta de cores
// ---------------------------------------------------------------------------

const COL = {
  panelBg: 'rgba(26, 26, 46, 0.93)',
  panelBorder: '#FFEB3B',
  title: '#FFEB3B',
  text: '#FFFFFF',
  textMuted: '#AAAAAA',
  textDim: 'rgba(255,255,255,0.55)',
  accent: '#4FC3F7',
  danger: '#FF5252',
  success: '#4CAF50',
  btnPlay: '#4CAF50',
  btnPlayDark: '#388E3C',
  btnScores: '#7C4DFF',
  btnScoresDark: '#5E35B1',
  btnBack: 'rgba(255,255,255,0.15)',
  btnRetry: '#FF9800',
  btnRetryDark: '#E65100',
  diffEasy: '#4CAF50',
  diffNormal: '#FFC107',
  diffHard: '#F44336',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
} as const;

const FONT = '"Segoe UI", sans-serif';

// ---------------------------------------------------------------------------
// Button rect tracking
// ---------------------------------------------------------------------------

interface BtnRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---------------------------------------------------------------------------
// MenuRenderer
// ---------------------------------------------------------------------------

export class MenuRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private buttons: BtnRect[] = [];
  /** Fade-in alpha (0→1) para transições suaves. */
  private fadeAlpha = 0;
  private lastState = '';

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  // =========================================================================
  // Hit-test
  // =========================================================================

  /**
   * Testa clique contra os botões registrados na última renderização.
   * Coordenadas em espaço do canvas (não CSS).
   */
  handleClick(x: number, y: number): MenuAction | null {
    for (const btn of this.buttons) {
      const ex = Math.max(btn.w, btn.h) * 0.1; // hit expand
      if (x >= btn.x - ex && x <= btn.x + btn.w + ex &&
          y >= btn.y - ex && y <= btn.y + btn.h + ex) {
        return this.buttonToAction(btn.id);
      }
    }
    return null;
  }

  private buttonToAction(id: string): MenuAction | null {
    switch (id) {
      case 'play': return { type: 'play' };
      case 'scores': return { type: 'show-scores' };
      case 'back': return { type: 'back' };
      case 'retry': return { type: 'retry' };
      case 'menu': return { type: 'menu' };
      case 'diff-easy': return { type: 'select-difficulty', value: 'easy' };
      case 'diff-normal': return { type: 'select-difficulty', value: 'normal' };
      case 'diff-hard': return { type: 'select-difficulty', value: 'hard' };
      case 'tab-easy': return { type: 'show-scores-tab', value: 'easy' };
      case 'tab-normal': return { type: 'show-scores-tab', value: 'normal' };
      case 'tab-hard': return { type: 'show-scores-tab', value: 'hard' };
      default: return null;
    }
  }

  // =========================================================================
  // Fade transition
  // =========================================================================

  private updateFade(stateKey: string): void {
    if (this.lastState !== stateKey) {
      this.fadeAlpha = 0;
      this.lastState = stateKey;
    }
    this.fadeAlpha = Math.min(1, this.fadeAlpha + 0.05);
  }

  // =========================================================================
  // 1. Title Screen
  // =========================================================================

  renderTitleScreen(drawSkyFn: () => void): void {
    this.buttons = [];
    this.updateFade('title');
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Sky background
    drawSkyFn();

    // Ground fill below horizon
    ctx.fillStyle = '#43A047';
    ctx.fillRect(0, h * 0.38, w, h * 0.62);

    // Decorative slide
    ctx.fillStyle = '#4FC3F7';
    ctx.fillRect(w * 0.3, h * 0.42, w * 0.4, h * 0.58);
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(w * 0.27, h * 0.42, w * 0.04, h * 0.58);
    ctx.fillRect(w * 0.69, h * 0.42, w * 0.04, h * 0.58);

    ctx.save();
    ctx.globalAlpha = this.fadeAlpha;

    // Duck bobbing
    const bob = Math.sin(Date.now() * 0.003) * 6;
    drawDuck(ctx, w / 2, h * 0.68 + bob, h * 0.2, 'idle', 0);

    // Title
    const titleSize = Math.round(h * 0.09);
    ctx.font = `bold ${titleSize}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = COL.title;
    ctx.fillText('🐥 Corre Patinho!', w / 2, h * 0.15);
    ctx.shadowBlur = 0;

    // Subtitle
    const subSize = Math.round(h * 0.028);
    ctx.font = `${subSize}px ${FONT}`;
    ctx.fillStyle = COL.textDim;
    ctx.fillText('Setas ←/→ ou arraste para desviar das curvas', w / 2, h * 0.24);

    // Play button
    const btnW = w * 0.22;
    const btnH = h * 0.09;
    const btnX = w / 2 - btnW / 2;
    const btnY = h * 0.32;
    this.drawPillButton(btnX, btnY, btnW, btnH, 'JOGAR', COL.btnPlay, COL.btnPlayDark, 'play');

    // Scores button
    const scBtnW = w * 0.18;
    const scBtnH = h * 0.065;
    const scBtnX = w / 2 - scBtnW / 2;
    const scBtnY = btnY + btnH + h * 0.025;
    this.drawPillButton(scBtnX, scBtnY, scBtnW, scBtnH, '🏆 Recordes', COL.btnScores, COL.btnScoresDark, 'scores');

    ctx.restore();
  }

  // =========================================================================
  // 2. Difficulty Select
  // =========================================================================

  renderDifficultySelect(drawSkyFn: () => void): void {
    this.buttons = [];
    this.updateFade('difficulty');
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    drawSkyFn();

    // Dimmed overlay
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = this.fadeAlpha;

    // Title
    const titleSize = Math.round(h * 0.065);
    ctx.font = `bold ${titleSize}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COL.text;
    ctx.fillText('Escolha a Dificuldade', w / 2, h * 0.12);

    // 3 difficulty cards
    const cardW = w * 0.24;
    const cardH = h * 0.52;
    const gap = w * 0.03;
    const totalW = cardW * 3 + gap * 2;
    const startX = (w - totalW) / 2;
    const cardY = h * 0.22;

    const cards: { diff: Difficulty; color: string; label: string; desc: string; speed: string }[] = [
      { diff: 'easy', color: COL.diffEasy, label: 'Fácil', desc: 'Com sinalização\nde curvas', speed: '🐢 Normal' },
      { diff: 'normal', color: COL.diffNormal, label: 'Normal', desc: 'Sem sinalização\nReflexo necessário', speed: '🐇 Normal' },
      { diff: 'hard', color: COL.diffHard, label: 'Difícil', desc: 'Sem sinalização\nVelocidade alta', speed: '🚀 Rápida' },
    ];

    cards.forEach((c, i) => {
      const cx = startX + i * (cardW + gap);
      this.drawDifficultyCard(cx, cardY, cardW, cardH, c.diff, c.color, c.label, c.desc, c.speed);
    });

    // Back button
    const backW = w * 0.12;
    const backH = h * 0.06;
    this.drawPillButton(w * 0.03, h * 0.9, backW, backH, '← Voltar', COL.btnBack, 'rgba(255,255,255,0.08)', 'back');

    ctx.restore();
  }

  private drawDifficultyCard(
    x: number, y: number, w: number, h: number,
    diff: Difficulty, color: string, label: string, desc: string, speed: string,
  ): void {
    const { ctx } = this;

    // Card background
    ctx.fillStyle = COL.panelBg;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    this.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();

    // Color accent bar at top
    ctx.fillStyle = color;
    this.roundRectTop(x, y, w, h * 0.06, 14);
    ctx.fill();

    // Label
    const lblSize = Math.round(h * 0.12);
    ctx.font = `bold ${lblSize}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(label, x + w / 2, y + h * 0.2);

    // Description (multiline)
    const descSize = Math.round(h * 0.065);
    ctx.font = `${descSize}px ${FONT}`;
    ctx.fillStyle = COL.textMuted;
    const lines = desc.split('\n');
    lines.forEach((line, li) => {
      ctx.fillText(line, x + w / 2, y + h * 0.4 + li * descSize * 1.4);
    });

    // Speed
    const spdSize = Math.round(h * 0.07);
    ctx.font = `${spdSize}px ${FONT}`;
    ctx.fillStyle = COL.text;
    ctx.fillText(speed, x + w / 2, y + h * 0.7);

    // "Jogar" mini-button at bottom
    const btnW = w * 0.7;
    const btnH = h * 0.1;
    const btnX = x + (w - btnW) / 2;
    const btnY = y + h * 0.83;
    this.drawPillButton(btnX, btnY, btnW, btnH, 'Jogar', color, color, `diff-${diff}`);

    // Register the whole card as clickable too
    this.buttons.push({ id: `diff-${diff}`, x, y, w, h });
  }

  // =========================================================================
  // 3. Game Over
  // =========================================================================

  renderGameOver(
    session: GameSession,
    isNewRecord: boolean,
    personalBest: number,
  ): void {
    this.buttons = [];
    this.updateFade('gameover');
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Dark overlay (game frame already rendered beneath)
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = this.fadeAlpha;

    // Panel
    const pW = w * 0.42;
    const pH = h * 0.78;
    const pX = (w - pW) / 2;
    const pY = (h - pH) / 2;

    ctx.fillStyle = COL.panelBg;
    ctx.strokeStyle = COL.panelBorder;
    ctx.lineWidth = 3;
    this.roundRect(pX, pY, pW, pH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title
    const tSize = Math.round(h * 0.065);
    ctx.font = `bold ${tSize}px ${FONT}`;
    ctx.fillStyle = COL.danger;
    ctx.fillText('Game Over!', w / 2, pY + pH * 0.09);

    // Sad duck
    drawDuck(ctx, w / 2, pY + pH * 0.22, h * 0.1, 'scared', 0);

    // Score
    const sSize = Math.round(h * 0.045);
    ctx.font = `bold ${sSize}px ${FONT}`;
    ctx.fillStyle = COL.text;
    ctx.fillText(`Distância: ${Math.floor(session.maxScore)}m`, w / 2, pY + pH * 0.37);

    // Record
    if (isNewRecord) {
      ctx.fillStyle = COL.gold;
      ctx.font = `bold ${Math.round(h * 0.032)}px ${FONT}`;
      ctx.fillText('⭐ NOVO RECORDE! ⭐', w / 2, pY + pH * 0.45);
    } else {
      ctx.fillStyle = COL.textMuted;
      ctx.font = `${Math.round(h * 0.028)}px ${FONT}`;
      ctx.fillText(`Recorde: ${Math.floor(personalBest)}m`, w / 2, pY + pH * 0.45);
    }

    // Seed
    ctx.fillStyle = COL.textMuted;
    ctx.font = `${Math.round(h * 0.022)}px ${FONT}`;
    ctx.fillText(`Seed: ${session.seed}`, w / 2, pY + pH * 0.53);

    // Difficulty label
    const diffLabels: Record<Difficulty, string> = { easy: 'Fácil', normal: 'Normal', hard: 'Difícil' };
    ctx.fillStyle = COL.textDim;
    ctx.font = `${Math.round(h * 0.02)}px ${FONT}`;
    ctx.fillText(`Dificuldade: ${diffLabels[session.config.difficulty]}`, w / 2, pY + pH * 0.58);

    // Buttons
    const bW = pW * 0.7;
    const bH = h * 0.065;
    const bX = w / 2 - bW / 2;

    // Retry
    this.drawPillButton(bX, pY + pH * 0.65, bW, bH, '🔄 Jogar de Novo', COL.btnRetry, COL.btnRetryDark, 'retry');
    // Scores
    const sBW = pW * 0.55;
    this.drawPillButton(w / 2 - sBW / 2, pY + pH * 0.77, sBW, bH * 0.85, '🏆 Recordes', COL.btnScores, COL.btnScoresDark, 'scores');
    // Menu
    const mBW = pW * 0.45;
    this.drawPillButton(w / 2 - mBW / 2, pY + pH * 0.88, mBW, bH * 0.75, 'Menu', COL.btnBack, 'rgba(255,255,255,0.08)', 'menu');

    ctx.restore();
  }

  // =========================================================================
  // 4. High Scores
  // =========================================================================

  renderHighScores(
    scores: HighScores,
    selectedDifficulty: Difficulty,
    drawSkyFn: () => void,
  ): void {
    this.buttons = [];
    this.updateFade('highscores');
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    drawSkyFn();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = this.fadeAlpha;

    // Panel
    const pW = w * 0.55;
    const pH = h * 0.88;
    const pX = (w - pW) / 2;
    const pY = (h - pH) / 2;

    ctx.fillStyle = COL.panelBg;
    ctx.strokeStyle = COL.panelBorder;
    ctx.lineWidth = 3;
    this.roundRect(pX, pY, pW, pH, 16);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COL.title;
    ctx.font = `bold ${Math.round(h * 0.055)}px ${FONT}`;
    ctx.fillText('🏆 Recordes', w / 2, pY + pH * 0.06);

    // Tabs
    const tabs: { diff: Difficulty; label: string; color: string }[] = [
      { diff: 'easy', label: 'Fácil', color: COL.diffEasy },
      { diff: 'normal', label: 'Normal', color: COL.diffNormal },
      { diff: 'hard', label: 'Difícil', color: COL.diffHard },
    ];

    const tabW = pW * 0.28;
    const tabH = h * 0.05;
    const tabGap = pW * 0.02;
    const tabTotalW = tabW * 3 + tabGap * 2;
    const tabStartX = w / 2 - tabTotalW / 2;
    const tabY = pY + pH * 0.12;

    tabs.forEach((t, i) => {
      const tx = tabStartX + i * (tabW + tabGap);
      const isActive = t.diff === selectedDifficulty;
      ctx.fillStyle = isActive ? t.color : 'rgba(255,255,255,0.1)';
      this.roundRect(tx, tabY, tabW, tabH, 6);
      ctx.fill();

      ctx.fillStyle = isActive ? '#000' : COL.textMuted;
      ctx.font = `${isActive ? 'bold ' : ''}${Math.round(tabH * 0.55)}px ${FONT}`;
      ctx.fillText(t.label, tx + tabW / 2, tabY + tabH / 2);

      this.buttons.push({ id: `tab-${t.diff}`, x: tx, y: tabY, w: tabW, h: tabH });
    });

    // Score list
    const list = scores[selectedDifficulty];
    const rowH = pH * 0.065;
    const listY = tabY + tabH + h * 0.025;
    const rowFont = Math.round(h * 0.026);

    // Header
    ctx.fillStyle = COL.textDim;
    ctx.font = `bold ${Math.round(rowFont * 0.85)}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('#', pX + pW * 0.08, listY);
    ctx.fillText('Distância', pX + pW * 0.18, listY);
    ctx.textAlign = 'right';
    ctx.fillText('Seed', pX + pW * 0.72, listY);
    ctx.fillText('Data', pX + pW * 0.93, listY);

    if (list.length === 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = COL.textMuted;
      ctx.font = `${rowFont}px ${FONT}`;
      ctx.fillText('Nenhum recorde ainda', w / 2, listY + rowH * 3);
    } else {
      list.forEach((entry, i) => {
        const ry = listY + rowH * (i + 1);
        const medalColors = [COL.gold, COL.silver, COL.bronze];
        ctx.fillStyle = i < 3 ? medalColors[i] : COL.text;
        ctx.font = `${i < 3 ? 'bold ' : ''}${rowFont}px ${FONT}`;

        ctx.textAlign = 'left';
        const posLabels = ['🥇', '🥈', '🥉'];
        ctx.fillText(i < 3 ? posLabels[i] : `${i + 1}.`, pX + pW * 0.06, ry);
        ctx.fillText(`${Math.floor(entry.score)}m`, pX + pW * 0.18, ry);

        ctx.textAlign = 'right';
        ctx.fillStyle = COL.textMuted;
        ctx.font = `${Math.round(rowFont * 0.85)}px ${FONT}`;
        ctx.fillText(String(entry.seed), pX + pW * 0.72, ry);

        // Date (short format)
        const d = new Date(entry.date);
        const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        ctx.fillText(dateStr, pX + pW * 0.93, ry);
      });
    }

    // Back button
    const backW = w * 0.12;
    const backH = h * 0.06;
    this.drawPillButton(w * 0.03, h * 0.9, backW, backH, '← Voltar', COL.btnBack, 'rgba(255,255,255,0.08)', 'back');

    ctx.restore();
  }

  // =========================================================================
  // Shared drawing helpers
  // =========================================================================

  private drawPillButton(
    x: number, y: number, w: number, h: number,
    label: string, color: string, colorDark: string, id: string,
  ): void {
    const { ctx } = this;

    // Gradient fill
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, color);
    grad.addColorStop(1, colorDark);
    ctx.fillStyle = grad;
    this.roundRect(x, y, w, h, h * 0.4);
    ctx.fill();

    // Subtle top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this.roundRectTop(x + 2, y + 1, w - 4, h * 0.4, h * 0.4);
    ctx.fill();

    // Label
    ctx.fillStyle = COL.text;
    ctx.font = `bold ${Math.round(h * 0.48)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);

    // Register for hit-test
    this.buttons.push({ id, x, y, w, h });
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
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

  /** Rounded rect with only top corners rounded (for accent bars). */
  private roundRectTop(x: number, y: number, w: number, h: number, r: number): void {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
