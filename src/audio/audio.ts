/**
 * Wrapper Howler.js — música, SFX, mute state.
 *
 * Gera áudio proceduralmente via Web Audio API (OfflineAudioContext),
 * encapsula em instâncias Howl para gerenciamento unificado.
 *
 * Ref: 03-TECH-STACK.md § 4
 * Ref: 03-TECH-STACK.md § 8 — src/audio/audio.ts
 */

import { Howl, Howler } from 'howler';
import { getMutedPreference, setMutedPreference } from '../utils/storage.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Nomes de SFX disponíveis. Ref: 03-TECH-STACK.md § 4.2 */
export type SfxName =
  | 'curve'
  | 'fall'
  | 'loseLife'
  | 'countdown'
  | 'record'
  | 'gameOver'
  | 'menuClick';

// ---------------------------------------------------------------------------
// Audio generation constants
// ---------------------------------------------------------------------------

/** Sample rate para geração offline. */
const SAMPLE_RATE = 44100;

/** Notas da escala pentatônica maior em C (Hz) — alegre e infantil. */
const PENTATONIC_C = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
];

/** Duração de cada nota na música (segundos). */
const NOTE_DURATION = 0.18;

/** Padrão melódico (índices em PENTATONIC_C) — melodia alegre em loop. */
const MELODY_PATTERN = [
  0, 2, 4, 5, 4, 2, 3, 1,
  0, 1, 2, 4, 5, 7, 5, 4,
  3, 4, 5, 4, 2, 1, 0, 2,
  4, 5, 4, 3, 2, 1, 0, 0,
];

// ---------------------------------------------------------------------------
// Procedural audio generation helpers
// ---------------------------------------------------------------------------

/**
 * Gera um buffer WAV a partir de um OfflineAudioContext renderizado.
 * Retorna uma data URI que o Howler.js pode carregar.
 */
async function renderToDataUri(
  duration: number,
  setupFn: (ctx: OfflineAudioContext) => void,
): Promise<string> {
  const length = Math.ceil(SAMPLE_RATE * duration);
  const ctx = new OfflineAudioContext(1, length, SAMPLE_RATE);

  setupFn(ctx);

  const buffer = await ctx.startRendering();
  return audioBufferToWavDataUri(buffer);
}

/**
 * Converte um AudioBuffer em uma WAV data URI.
 */
function audioBufferToWavDataUri(buffer: AudioBuffer): string {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const numSamples = samples.length;

  // WAV header + data
  const dataSize = numSamples * 2; // 16-bit PCM
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
  view.setUint16(32, numChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM samples (clamp to [-1, 1], convert to 16-bit)
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  // Convert to base64 data URI
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ---------------------------------------------------------------------------
// SFX Generators
// ---------------------------------------------------------------------------

/** SFX: deslizar/água ao passar por curva (~200ms). */
function generateCurveSfx(): Promise<string> {
  return renderToDataUri(0.25, (ctx) => {
    // Ruído filtrado com bandpass simulando água
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, 0);
    osc.frequency.exponentialRampToValueAtTime(400, 0.2);
    gain.gain.setValueAtTime(0.12, 0);
    gain.gain.linearRampToValueAtTime(0.15, 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(0);
    osc.stop(0.25);

    // Segundo oscilador mais agudo para textura
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, 0);
    osc2.frequency.exponentialRampToValueAtTime(600, 0.2);
    gain2.gain.setValueAtTime(0.06, 0);
    gain2.gain.exponentialRampToValueAtTime(0.001, 0.2);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(0);
    osc2.stop(0.25);
  });
}

/** SFX: splash ao perder vida (~500ms). */
function generateFallSfx(): Promise<string> {
  return renderToDataUri(0.6, (ctx) => {
    // Tom descendente (queda)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, 0);
    osc.frequency.exponentialRampToValueAtTime(100, 0.5);
    gain.gain.setValueAtTime(0.25, 0);
    gain.gain.linearRampToValueAtTime(0.2, 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.55);
    osc.connect(gain).connect(ctx.destination);
    osc.start(0);
    osc.stop(0.6);

    // Splash — noise-like burst
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(300, 0.15);
    osc2.frequency.exponentialRampToValueAtTime(80, 0.5);
    gain2.gain.setValueAtTime(0, 0);
    gain2.gain.linearRampToValueAtTime(0.15, 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, 0.55);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(0.15);
    osc2.stop(0.6);
  });
}

/** SFX: perda de vida — impacto curto (~300ms). */
function generateLoseLifeSfx(): Promise<string> {
  return renderToDataUri(0.35, (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, 0);
    osc.frequency.exponentialRampToValueAtTime(80, 0.15);
    gain.gain.setValueAtTime(0.2, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(0);
    osc.stop(0.35);

    // Sub hit
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(150, 0);
    osc2.frequency.exponentialRampToValueAtTime(50, 0.2);
    gain2.gain.setValueAtTime(0.15, 0);
    gain2.gain.exponentialRampToValueAtTime(0.001, 0.25);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(0);
    osc2.stop(0.3);
  });
}

/** SFX: bip de countdown (~150ms). */
function generateCountdownSfx(): Promise<string> {
  return renderToDataUri(0.15, (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, 0);
    gain.gain.setValueAtTime(0.2, 0);
    gain.gain.setValueAtTime(0.2, 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(0);
    osc.stop(0.15);
  });
}

/** SFX: fanfarra de recorde (~800ms) — acorde ascendente. */
function generateRecordSfx(): Promise<string> {
  return renderToDataUri(1.0, (ctx) => {
    // 3 notas ascendentes em sequência
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const noteDur = 0.25;

    notes.forEach((freq, i) => {
      const startTime = i * 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, Math.max(0, startTime - 0.001));
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.setValueAtTime(0.2, startTime + noteDur * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDur + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + noteDur + 0.15);

      // Oitava acima para brilho
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, startTime);
      gain2.gain.setValueAtTime(0, Math.max(0, startTime - 0.001));
      gain2.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + noteDur + 0.1);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(startTime);
      osc2.stop(startTime + noteDur + 0.15);
    });
  });
}

/** SFX: game over — tom triste descendente (~1s). */
function generateGameOverSfx(): Promise<string> {
  return renderToDataUri(1.2, (ctx) => {
    // 3 notas descendentes tristes (menor)
    const notes = [392.00, 311.13, 261.63]; // G4, Eb4, C4
    const noteDur = 0.35;

    notes.forEach((freq, i) => {
      const startTime = i * 0.3;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, Math.max(0, startTime - 0.001));
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
      gain.gain.setValueAtTime(0.18, startTime + noteDur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDur + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + noteDur + 0.1);
    });
  });
}

/** SFX: click de menu (~100ms). */
function generateMenuClickSfx(): Promise<string> {
  return renderToDataUri(0.1, (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, 0);
    osc.frequency.exponentialRampToValueAtTime(600, 0.08);
    gain.gain.setValueAtTime(0.12, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(0);
    osc.stop(0.1);
  });
}

/**
 * Gera a música de fundo (loop alegre pentatônico).
 * ~5.8s loop — melodia infantil simples.
 */
function generateMusic(): Promise<string> {
  const totalDuration = MELODY_PATTERN.length * NOTE_DURATION + 0.3; // +tail

  return renderToDataUri(totalDuration, (ctx) => {
    MELODY_PATTERN.forEach((noteIdx, i) => {
      const startTime = i * NOTE_DURATION;
      const freq = PENTATONIC_C[noteIdx];

      // Melodia principal (sine — suave e infantil)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, Math.max(0, startTime - 0.001));
      gain.gain.linearRampToValueAtTime(0.13, startTime + 0.02);
      gain.gain.setValueAtTime(0.12, startTime + NOTE_DURATION * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + NOTE_DURATION + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + NOTE_DURATION + 0.08);

      // Harmônico sutil (oitava acima, baixo volume)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, startTime);
      gain2.gain.setValueAtTime(0, Math.max(0, startTime - 0.001));
      gain2.gain.linearRampToValueAtTime(0.03, startTime + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + NOTE_DURATION + 0.05);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(startTime);
      osc2.stop(startTime + NOTE_DURATION + 0.08);

      // Bass note a cada 4 notas (ritmo)
      if (i % 4 === 0) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(freq / 2, startTime);
        bassGain.gain.setValueAtTime(0, Math.max(0, startTime - 0.001));
        bassGain.gain.linearRampToValueAtTime(0.07, startTime + 0.01);
        bassGain.gain.exponentialRampToValueAtTime(0.001, startTime + NOTE_DURATION * 3);
        bassOsc.connect(bassGain).connect(ctx.destination);
        bassOsc.start(startTime);
        bassOsc.stop(startTime + NOTE_DURATION * 3 + 0.05);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// AudioManager
// ---------------------------------------------------------------------------

/**
 * Gerencia todo o áudio do jogo: música de fundo e efeitos sonoros.
 *
 * Singleton — usar via `AudioManager.instance()`.
 * Inicialização é assíncrona (gera áudio proceduralmente).
 *
 * Ref: 03-TECH-STACK.md § 4
 */
export class AudioManager {
  private static _instance: AudioManager | null = null;

  private music: Howl | null = null;
  private sfx: Map<SfxName, Howl> = new Map();
  private _muted: boolean;
  private _initialized = false;
  private _initializing = false;
  private musicPlaying = false;

  private constructor() {
    this._muted = getMutedPreference();
    // Aplicar estado muted global no Howler
    Howler.mute(this._muted);
  }

  /** Obtém a instância singleton. */
  static instance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }
    return AudioManager._instance;
  }

  /** Se já foi inicializado (áudio gerado e pronto). */
  get initialized(): boolean {
    return this._initialized;
  }

  /** Estado atual de mute. */
  get muted(): boolean {
    return this._muted;
  }

  /**
   * Inicializa o AudioManager — gera todos os buffers de áudio.
   * Chamada idempotente (pode ser chamada múltiplas vezes).
   */
  async init(): Promise<void> {
    if (this._initialized || this._initializing) return;
    this._initializing = true;

    try {
      // Gerar todos os áudios em paralelo
      const [
        musicUri,
        curveUri,
        fallUri,
        loseLifeUri,
        countdownUri,
        recordUri,
        gameOverUri,
        menuClickUri,
      ] = await Promise.all([
        generateMusic(),
        generateCurveSfx(),
        generateFallSfx(),
        generateLoseLifeSfx(),
        generateCountdownSfx(),
        generateRecordSfx(),
        generateGameOverSfx(),
        generateMenuClickSfx(),
      ]);

      // Criar instâncias Howl
      this.music = new Howl({
        src: [musicUri],
        loop: true,
        volume: 0.4,
        preload: true,
      });

      const sfxDefs: [SfxName, string, number][] = [
        ['curve', curveUri, 0.5],
        ['fall', fallUri, 0.6],
        ['loseLife', loseLifeUri, 0.6],
        ['countdown', countdownUri, 0.5],
        ['record', recordUri, 0.7],
        ['gameOver', gameOverUri, 0.6],
        ['menuClick', menuClickUri, 0.4],
      ];

      for (const [name, uri, volume] of sfxDefs) {
        this.sfx.set(name, new Howl({
          src: [uri],
          volume,
          preload: true,
        }));
      }

      this._initialized = true;
    } catch (err) {
      console.warn('[AudioManager] Falha ao inicializar áudio:', err);
    } finally {
      this._initializing = false;
    }
  }

  /**
   * Define o estado de mute global.
   * Persiste a preferência em localStorage.
   */
  setMuted(muted: boolean): void {
    this._muted = muted;
    Howler.mute(muted);
    setMutedPreference(muted);
  }

  /**
   * Inicia a música de fundo com fade-in.
   * Idempotente — se já estiver tocando, não faz nada.
   */
  playMusic(): void {
    if (!this._initialized || !this.music || this.musicPlaying) return;
    this.music.volume(0);
    this.music.play();
    this.music.fade(0, 0.4, 800);
    this.musicPlaying = true;
  }

  /**
   * Para a música de fundo com fade-out.
   * @param fadeDuration Duração do fade em ms (default: 600ms).
   */
  stopMusic(fadeDuration = 600): void {
    if (!this._initialized || !this.music || !this.musicPlaying) return;
    this.music.fade(0.4, 0, fadeDuration);
    this.musicPlaying = false;

    // Parar efetivamente após o fade
    setTimeout(() => {
      if (!this.musicPlaying && this.music) {
        this.music.stop();
      }
    }, fadeDuration + 50);
  }

  /**
   * Toca um efeito sonoro por nome.
   * Ignora silenciosamente se não inicializado ou nome inválido.
   */
  playSfx(name: SfxName): void {
    if (!this._initialized) return;
    const howl = this.sfx.get(name);
    if (howl) {
      howl.play();
    }
  }

  /**
   * Libera todos os recursos de áudio.
   */
  dispose(): void {
    this.stopMusic(0);
    this.music?.unload();
    this.music = null;

    for (const howl of this.sfx.values()) {
      howl.unload();
    }
    this.sfx.clear();

    this._initialized = false;
    AudioManager._instance = null;
  }
}
