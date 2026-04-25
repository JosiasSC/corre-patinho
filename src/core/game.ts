/**
 * Game loop, estado da partida, gerenciamento de vidas.
 *
 * Orquestra todos os sistemas: track, physics, input, rendering.
 * Ref: 02-GAME-MECHANICS.md § 4, § 6
 * Ref: 03-TECH-STACK.md § 8 — src/core/game.ts
 */

import type { GameConfig, GameSession, PlayerState, TrackSegment, DuckPose, UpcomingCurve } from '../types/index.ts';
import { DIFFICULTY_CONFIGS } from '../types/index.ts';
import { TrackGenerator } from './track.ts';
import { updatePhysics, checkCurve } from './physics.ts';
import { InputManager } from './input.ts';
import { Renderer } from '../rendering/renderer.ts';
import { DEFAULT_CAMERA } from '../rendering/camera.ts';
import { generateSeed } from '../utils/prng.ts';


/** Duração da pausa de morte (segundos). Ref: § 6.3 */
const DEATH_PAUSE_DURATION = 1.0;

/** Delta time fixo para lógica (60fps target). */
const FIXED_DT = 1 / 60;

/** Lookback de segmentos visíveis para renderização. */
const VISIBLE_SEGMENTS_BEHIND = 5;
const VISIBLE_SEGMENTS_AHEAD = 35;

/** Distância de abordagem para sinalização de curvas (unidades do jogo). */
const CURVE_SIGNAL_DISTANCE = 350;

/**
 * Controla o jogo inteiro: loop, estado, transições.
 */
export class Game {
  private readonly input: InputManager;
  private readonly renderer: Renderer;

  private session!: GameSession;
  private track!: TrackGenerator;
  private player!: PlayerState;

  private lastTimestamp = 0;
  private accumulator = 0;
  private animFrameId = 0;

  private lastCheckedSegmentIndex = -1;
  private upcomingCurve: UpcomingCurve | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context não disponível');
    this.input = new InputManager(canvas);
    this.renderer = new Renderer(ctx, DEFAULT_CAMERA);

    this.setupMuteHandler(canvas);
    this.initSession();
  }

  /** Inicia/reinicia uma partida. */
  start(seed?: number): void {
    const actualSeed = seed ?? generateSeed();
    const config = DIFFICULTY_CONFIGS['normal']; // T-009: protótipo usa Normal
    this.initSessionWithConfig(config, actualSeed);
    this.session.state = 'playing';
    this.lastTimestamp = 0;
    this.accumulator = 0;
    this.lastCheckedSegmentIndex = -1;
  }

  /** Inicia o loop de renderização (independente do estado). */
  run(): void {
    const loop = (timestamp: number): void => {
      this.animFrameId = requestAnimationFrame(loop);

      if (this.lastTimestamp === 0) {
        this.lastTimestamp = timestamp;
        return;
      }

      const frameTime = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
      this.lastTimestamp = timestamp;

      // Input sempre atualiza
      this.input.update(FIXED_DT);

      if (this.session.state === 'playing') {
        this.accumulator += frameTime;
        while (this.accumulator >= FIXED_DT) {
          this.fixedUpdate(FIXED_DT);
          this.accumulator -= FIXED_DT;
        }
      } else if (this.session.state === 'dying') {
        this.session.deathPauseTimer -= frameTime;
        if (this.session.deathPauseTimer <= 0) {
          this.respawnAtCheckpoint();
        }
      }

      // Verificar tap para transições de estado
      if (this.input.tapReceived) {
        this.input.tapReceived = false;
        if (this.session.state === 'ready') {
          this.start();
        } else if (this.session.state === 'game-over') {
          this.initSession();
          this.session.state = 'ready';
        }
      }

      this.render();
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  /** Para o loop e limpa recursos. */
  stop(): void {
    cancelAnimationFrame(this.animFrameId);
    this.input.destroy();
  }

  // ---------------------------------------------------------------------------
  // Private — Logic
  // ---------------------------------------------------------------------------

  private initSession(): void {
    const config = DIFFICULTY_CONFIGS['normal'];
    this.initSessionWithConfig(config, generateSeed());
    this.session.state = 'ready';
  }

  private initSessionWithConfig(config: GameConfig, seed: number): void {
    this.track = new TrackGenerator(seed, config);
    this.session = {
      state: 'playing',
      config,
      seed,
      score: 0,
      maxScore: 0,
      lives: config.lives,
      speed: 0.1, // Começa lento, acelera gradualmente
      trackPosition: 0,
      currentSegmentIndex: 0,
      segmentProgress: 0,
      lastCheckpointIndex: 0,
      lastCheckpointPosition: 0,
      elapsedTime: 0,
      curvesCompleted: 0,
      deathPauseTimer: 0,
    };
    this.player = {
      rawInput: 0,
      smoothInput: 0,
      lean: 0,
      pose: 'idle',
    };
  }

  private fixedUpdate(dt: number): void {
    const { session, track, player, input } = this;

    // Atualizar tempo
    session.elapsedTime += dt;

    // Atualizar rampa de dificuldade no gerador
    track.updateRamp(session.elapsedTime);

    // Capturar input (dead zone já aplicada no InputManager)
    player.rawInput = input.getState().direction;

    // Atualizar física (velocidade, posição, inércia)
    updatePhysics(session, player, session.config, dt);

    // Determinar segmento atual
    this.updateCurrentSegment();

    // Garantir segmentos gerados à frente
    track.ensureSegments(session.currentSegmentIndex);

    // Verificar curva
    this.checkCurrentCurve();

    // Verificar checkpoints
    this.updateCheckpoints();

    // Calcular pose visual do patinho
    player.pose = this.computeDuckPose();

    // Calcular próxima curva para sinalização (modo Fácil — § 7)
    this.upcomingCurve = this.computeUpcomingCurve();
  }

  private updateCurrentSegment(): void {
    const { session, track } = this;

    // Encontrar o segmento que contém a posição atual
    let accZ = 0;
    for (let i = 0; i < track.segments.length; i++) {
      const segEnd = accZ + track.segments[i].length;
      if (session.trackPosition < segEnd) {
        if (session.currentSegmentIndex !== i) {
          session.currentSegmentIndex = i;
          session.segmentProgress = 0;
        }
        session.segmentProgress = (session.trackPosition - accZ) / track.segments[i].length;
        return;
      }
      accZ = segEnd;
    }
  }

  private checkCurrentCurve(): void {
    const { session, track, player } = this;
    const segment = track.getSegment(session.currentSegmentIndex);

    // Só verificar curvas na fase apex (onde requiredIntensity > 0),
    // e só uma vez por segmento
    if (segment.type !== 'curve') return;
    if (segment.phase !== 'apex') return;
    if (this.lastCheckedSegmentIndex === session.currentSegmentIndex) return;

    // Verificar quando estiver a ~50% do apex (dando tempo de ajustar)
    if (session.segmentProgress < 0.45) return;

    this.lastCheckedSegmentIndex = session.currentSegmentIndex;

    const result = checkCurve(segment, player, session.config);

    if (!result.passed) {
      this.loseLife();
    } else {
      session.curvesCompleted++;
    }
  }

  private updateCheckpoints(): void {
    const { session, track } = this;
    const segment = track.getSegment(session.currentSegmentIndex);

    if (segment.isCheckpoint) {
      session.lastCheckpointIndex = session.currentSegmentIndex;
      session.lastCheckpointPosition = track.getSegmentStartZ(session.currentSegmentIndex);
    }
  }

  private loseLife(): void {
    const { session } = this;
    session.lives--;

    if (session.lives <= 0) {
      session.state = 'game-over';
    } else {
      session.state = 'dying';
      session.deathPauseTimer = DEATH_PAUSE_DURATION;
    }
  }

  private respawnAtCheckpoint(): void {
    const { session, track } = this;
    session.state = 'playing';
    session.trackPosition = session.lastCheckpointPosition;
    session.currentSegmentIndex = session.lastCheckpointIndex;
    session.segmentProgress = 0;
    this.lastCheckedSegmentIndex = session.lastCheckpointIndex - 1;
    // Score NÃO regride (Ref: § 6.2)
    // Velocidade reduz um pouco ao respawnar
    session.speed = Math.max(0.5, session.speed * 0.7);

    // Reset lateral
    this.player.rawInput = 0;
    this.player.smoothInput = 0;
    this.player.lean = 0;
    this.player.pose = 'idle';

    // Garantir segmentos
    track.ensureSegments(session.currentSegmentIndex);
  }

  /**
   * Calcula a pose visual do patinho baseada no estado do jogo.
   * Ref: 03-TECH-STACK.md § 3.2
   */
  private computeDuckPose(): DuckPose {
    const { session, player } = this;

    if (session.state === 'dying') {
      // Primeiros 500ms: susto, depois: queda
      const elapsed = DEATH_PAUSE_DURATION - session.deathPauseTimer;
      return elapsed < 0.35 ? 'scared' : 'falling';
    }

    if (session.state === 'game-over') {
      return 'falling';
    }

    // Playing — baseado no lean
    const leanThreshold = 0.15;
    if (player.lean < -leanThreshold) return 'leanLeft';
    if (player.lean > leanThreshold) return 'leanRight';
    return 'idle';
  }

  // ---------------------------------------------------------------------------
  // Private — Rendering
  // ---------------------------------------------------------------------------

  private render(): void {
    const { session, renderer } = this;

    if (session.state === 'ready') {
      renderer.renderReadyScreen();
      return;
    }

    if (session.state === 'game-over') {
      // Renderizar frame do jogo congelado + overlay game over
      this.renderGameFrame();
      renderer.renderGameOverScreen(session);
      return;
    }

    if (session.state === 'dying') {
      // Atualizar pose durante dying (computada a cada render)
      this.player.pose = this.computeDuckPose();
      this.renderGameFrame();
      const intensity = session.deathPauseTimer / DEATH_PAUSE_DURATION;
      renderer.renderDeathFlash(intensity);
      return;
    }

    // Playing
    this.renderGameFrame();
  }

  private renderGameFrame(): void {
    const { session, track, player, renderer } = this;

    // Coletar segmentos visíveis
    const startIdx = Math.max(0, session.currentSegmentIndex - VISIBLE_SEGMENTS_BEHIND);
    const endIdx = Math.min(
      track.segments.length,
      session.currentSegmentIndex + VISIBLE_SEGMENTS_AHEAD,
    );
    track.ensureSegments(endIdx);

    const visibleSegments: TrackSegment[] = [];
    const segmentStartZs: number[] = [];

    for (let i = startIdx; i < endIdx; i++) {
      visibleSegments.push(track.segments[i]);
      segmentStartZs.push(track.getSegmentStartZ(i));
    }

    renderer.renderFrame(session, visibleSegments, segmentStartZs, player, this.upcomingCurve);
  }

  // ---------------------------------------------------------------------------
  // Private — HUD interaction
  // ---------------------------------------------------------------------------

  /**
   * Configura handler de click/tap para botão mute do HUD.
   * Converte coordenadas CSS para coordenadas do canvas.
   */
  private setupMuteHandler(canvas: HTMLCanvasElement): void {
    const handler = (e: MouseEvent | TouchEvent): void => {
      // Converter coordenadas do evento para espaço do canvas
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let clientX: number;
      let clientY: number;

      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const canvasX = (clientX - rect.left) * scaleX;
      const canvasY = (clientY - rect.top) * scaleY;

      this.renderer.hud.handleClick(canvasX, canvasY);
    };

    // Click para desktop, touchend para mobile
    canvas.addEventListener('click', handler);
  }

  // ---------------------------------------------------------------------------
  // Private — Sinalização de curvas (§ 7)
  // ---------------------------------------------------------------------------

  /**
   * Busca a próxima curva apex à frente do jogador para sinalização.
   * Retorna null se não houver curva próxima ou se não for modo Fácil.
   */
  private computeUpcomingCurve(): UpcomingCurve | null {
    const { session, track } = this;

    if (session.config.difficulty !== 'easy') return null;

    const currentZ = session.trackPosition;
    let accZ = 0;

    // Buscar nos segmentos à frente
    for (let i = 0; i < track.segments.length; i++) {
      const seg = track.segments[i];
      const segStartZ = accZ;
      accZ += seg.length;

      // Só interessa segmentos à frente
      if (segStartZ < currentZ) continue;

      const distAhead = segStartZ - currentZ;

      // Só sinalizar dentro da distância de abordagem
      if (distAhead > CURVE_SIGNAL_DISTANCE) break;

      // Encontrar o próximo apex
      if (seg.type === 'curve' && seg.phase === 'apex' && seg.requiredIntensity > 0) {
        return {
          direction: seg.direction,
          intensity: seg.requiredIntensity,
          distanceAhead: distAhead,
          totalApproachDist: CURVE_SIGNAL_DISTANCE,
        };
      }
    }

    return null;
  }
}
