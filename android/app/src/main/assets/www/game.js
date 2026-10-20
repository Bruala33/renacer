/**
 * Beatstar 120 FPS High-Performance Canvas Rhythm Engine
 * Fixed 3-Lane Rhythm Game with Direct Audio Playback & Sub-Millisecond Synchronization
 * Features:
 * - Upper-Screen Judgements (unobstructed highway)
 * - Canvas Background FX Engine synced 1:1 with song BPM (Aura, Ocean Waves, Synthwave, Aurora)
 * - Real-Time 3-Lane Collision Resolution & Multi-Lane Downsampler (4K/7K/8K -> 3K 2-finger limit)
 * - Rock-solid stability for restart, countdown and arcade revive rewinding
 */

const SFX_MISS_BASE64 = 'data:audio/wav;base64,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';

const LEAD_IN_TIME = 1200; // 1.2 segundos de preparación visual (400ms por dígito)

// ==========================================
// ZERO-GC COLOR & GEOMETRY UTILITIES
// ==========================================
const _rgbaCache = new Map();
const _PROLONG_RE = /^[\s~♪♫▲\-]+$/;
const _HYPHEN_RE = /([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])-([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])/g;
function hexToRgba(hex, alpha) {
  const aClamped = Math.max(0, Math.min(1, alpha));
  const aInt = (aClamped * 100) | 0; // 100 niveles de precisión idénticos al ojo
  const key = `${hex}_${aInt}`;
  let cached = _rgbaCache.get(key);
  if (cached) return cached;

  let r = 255, g = 255, b = 255;
  if (typeof hex === 'string' && hex.charCodeAt(0) === 35) {
    const len = hex.length;
    if (len === 7) {
      r = parseInt(hex.substring(1, 3), 16) || 255;
      g = parseInt(hex.substring(3, 5), 16) || 255;
      b = parseInt(hex.substring(5, 7), 16) || 255;
    } else if (len === 4) {
      r = parseInt(hex[1] + hex[1], 16) || 255;
      g = parseInt(hex[2] + hex[2], 16) || 255;
      b = parseInt(hex[3] + hex[3], 16) || 255;
    }
  }
  cached = `rgba(${r}, ${g}, ${b}, ${(aInt * 0.01).toFixed(2)})`;
  if (_rgbaCache.size < 800) _rgbaCache.set(key, cached);
  return cached;
}

// Sacada fuera del bucle de notas para evitar instanciar funciones en memoria en cada frame
function tracePerspectiveQuad(ctx, x0T, x1T, x0B, x1B, topY, botY, rad) {
  const cr = Math.min(rad, (botY - topY) * 0.35, (x1T - x0T) * 0.30);
  ctx.beginPath();
  ctx.moveTo((x0T + x1T) * 0.5, topY);
  ctx.arcTo(x1T, topY, x1B, botY, cr);
  ctx.arcTo(x1B, botY, x0B, botY, cr);
  ctx.arcTo(x0B, botY, x0T, topY, cr);
  ctx.arcTo(x0T, topY, x1T, topY, cr);
  ctx.closePath();
}

// ==========================================
// MODO KARAOKE: FORMATEO Y RENDERIZADO DEFINITIVO
// ==========================================
function renderizarVersoKaraoke(verso, contenedor) {
  // 1. Obligatorio para que el navegador respete los espacios en blanco nativos
  contenedor.style.whiteSpace = 'pre-wrap';

  // 2. Mapear sílabas sin añadir espacios artificiales entre spans
  const htmlSpans = verso.map((s) => {
    let texto = s.text;
    const esMelisma = texto.trim() === '~';

    // Reemplazar guiones de sinalefa por espacios
    texto = texto.replace(/-/g, ' ');

    if (esMelisma) {
      // Se mantiene en el DOM con display:none para evitar errores de ID nulo
      return `<span id="lyric-${s.time}" class="karaoke-syllable melisma" style="display:none;" data-time="${s.time}"></span>`;
    }

    // Los spans van pegados directamente
    return `<span id="lyric-${s.time}" class="karaoke-syllable" data-time="${s.time}" data-dur="${s.dur}">${texto}</span>`;
  }).join(''); // NUNCA usar .join(' ') ni saltos de línea

  contenedor.innerHTML = htmlSpans;
}
if (typeof window !== 'undefined') window.renderizarVersoKaraoke = renderizarVersoKaraoke;

function iluminarSilaba(tiempoMs) {
  const el = document.getElementById(`lyric-${tiempoMs}`);
  if (el && !el.classList.contains('activa')) {
    el.classList.add('activa');
    // Captura el color exacto que tu CSS le aplica a la sílaba activa
    if (window.engine && !window.engine._teleprompterGold) {
      try {
        const compColor = window.getComputedStyle(el).color;
        if (compColor && compColor !== 'rgba(0, 0, 0, 0)') {
          window.engine._teleprompterGold = compColor;
        }
      } catch (_) {}
    }
  }
}

// ==========================================
// DYNAMIC SONG COLOR PALETTE REGISTRY (BEATSTAR PRESETS & ADAPTIVE SYSTEM)
// ==========================================
const SONG_COLOR_PALETTES = {
  extreme_magenta: {
    id: 'extreme_magenta',
    name: 'Extremo / Magenta Neón',
    primary: '#ff007f',
    secondary: '#d946ef',
    glow: '#ff007f',
    ribs: '#f43f5e',
    spotlight1: '#ff007f',
    spotlight2: '#a855f7',
    spark: '#ff70c5'
  },
  cyber_cyan: {
    id: 'cyber_cyan',
    name: 'Cyber / Cian Eléctrico',
    primary: '#00f2fe',
    secondary: '#00c6ff',
    glow: '#00f2fe',
    ribs: '#00f5d4',
    spotlight1: '#00f2fe',
    spotlight2: '#3b82f6',
    spark: '#a5f3fc'
  },
  fever_gold: {
    id: 'fever_gold',
    name: 'Fiebre / Oro Radiante',
    primary: '#ffd700',
    secondary: '#ffb703',
    glow: '#ffaa00',
    ribs: '#ffe082',
    spotlight1: '#ffd700',
    spotlight2: '#fb8500',
    spark: '#fff8db'
  },
  amethyst: {
    id: 'amethyst',
    name: 'Amatista / Electrónica',
    primary: '#9b51e0',
    secondary: '#e0aaff',
    glow: '#9b51e0',
    ribs: '#c77dff',
    spotlight1: '#9b51e0',
    spotlight2: '#7b2cbf',
    spark: '#e0aaff'
  },
  fire: {
    id: 'fire',
    name: 'Fuego / Rock',
    primary: '#f2994a',
    secondary: '#eb5757',
    glow: '#f2994a',
    ribs: '#ff7a00',
    spotlight1: '#f2994a',
    spotlight2: '#d90429',
    spark: '#ffbe0b'
  },
  emerald: {
    id: 'emerald',
    name: 'Esmeralda / Chill',
    primary: '#00f5a0',
    secondary: '#6fcf97',
    glow: '#00f5a0',
    ribs: '#2ec4b6',
    spotlight1: '#00f5a0',
    spotlight2: '#06d6a0',
    spark: '#a7f3d0'
  },
  classic: {
    id: 'classic',
    name: 'Clásico / Concierto',
    primary: '#e5b869',
    secondary: '#ffffff',
    glow: '#e5b869',
    ribs: '#f3d791',
    spotlight1: '#e5b869',
    spotlight2: '#d4af37',
    spark: '#fff4d1'
  }
};

function getSongColorPalette(meta = {}) {
  if (meta.palette && SONG_COLOR_PALETTES[meta.palette]) {
    return SONG_COLOR_PALETTES[meta.palette];
  }
  if (meta.primary && meta.secondary) {
    return {
      id: meta.palette || 'custom',
      name: meta.palette || 'Personalizada',
      primary: meta.primary,
      secondary: meta.secondary,
      glow: meta.glow || meta.primary,
      ribs: meta.ribs || meta.secondary,
      spotlight1: meta.primary,
      spotlight2: meta.secondary,
      spark: meta.secondary
    };
  }

  const text = `${meta.title || ''} ${meta.artist || ''} ${meta.genre || ''} ${meta.difficulty_name || ''}`.toLowerCase();
  if (text.includes('extreme') || text.includes('extremo') || text.includes('experto') || text.includes('frenzy') || text.includes('hard') || text.includes('difícil')) {
    return SONG_COLOR_PALETTES.extreme_magenta;
  }
  if (text.includes('cyber') || text.includes('synth') || text.includes('electronic') || text.includes('electro') || text.includes('galaxy') || text.includes('neon') || text.includes('future') || text.includes('remix')) {
    return SONG_COLOR_PALETTES.cyber_cyan;
  }
  if (text.includes('fire') || text.includes('fuego') || text.includes('rock') || text.includes('metal') || text.includes('dragon') || text.includes('impuestos') || text.includes('sanxe') || text.includes('pikete')) {
    return SONG_COLOR_PALETTES.fire;
  }
  if (text.includes('chill') || text.includes('groove') || text.includes('moonlight') || text.includes('flow') || text.includes('nature') || text.includes('rain') || text.includes('breeze') || text.includes('summer') || text.includes('fácil') || text.includes('easy')) {
    return SONG_COLOR_PALETTES.emerald;
  }
  if (text.includes('piano') || text.includes('renacer') || text.includes('chopin') || text.includes('classic') || text.includes('clásic') || text.includes('mozart') || text.includes('bach') || text.includes('beethoven') || text.includes('bumblebee') || text.includes('rachmaninoff')) {
    return SONG_COLOR_PALETTES.classic;
  }

  // Fallback determinista por hash del título
  const str = (meta.title || '') + (meta.id || 'default');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  const keys = ['extreme_magenta', 'cyber_cyan', 'fever_gold', 'amethyst', 'fire', 'emerald'];
  return SONG_COLOR_PALETTES[keys[hash % keys.length]];
}

const _rgbCache = new Map();
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 229, g: 184, b: 105 };
  let cached = _rgbCache.get(hex);
  if (cached) return cached;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const num = parseInt(c, 16);
  cached = isNaN(num)
    ? { r: 229, g: 184, b: 105 }
    : { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  if (_rgbCache.size < 256) _rgbCache.set(hex, cached);
  return cached;
}

class HighFidelityAudioPlayer {
  constructor() {
    const savedVol = parseFloat(localStorage.getItem('beatstar_master_volume') ?? '1.0');
    const savedMuted = localStorage.getItem('beatstar_master_muted') === 'true';
    this.masterVolume = isNaN(savedVol) ? 1.0 : Math.max(0, Math.min(1, savedVol));
    this.isMuted = savedMuted;
    this.audioCtx = null;
  }

  setVolume(vol, muted = false) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.isMuted = !!muted;
  }

  ensureContext() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (e) {}
    return this.audioCtx;
  }

  playPunchyArcadeMiss() {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);
      const vol = this.isMuted ? 0 : (this.masterVolume * 0.45);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch (_) {} };
      osc.start(now);
      osc.stop(now + 0.20);
    } catch (e) {}
  }

  playAnalogTapeRewind() {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.45);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch (_) {} };
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  playPianoChime(scheduledTime = null, freq = 523.25) {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const t = scheduledTime !== null ? scheduledTime : ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch (_) {} };
      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  playClick(scheduledTime = null) {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const t = scheduledTime !== null ? scheduledTime : ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch (_) {} };
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }

  playMiss(scheduledTime = null) {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const t = scheduledTime !== null ? scheduledTime : ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.22);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch (_) {} };
      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {}
  }
}

// ==========================================
// DIRECT HIGH-FIDELITY AUDIO SYNC ENGINE
// ==========================================

// ==========================================
// DIRECT HIGH-FIDELITY AUDIO SYNC ENGINE (120 FPS JITTER-FREE)
// ==========================================

class DirectAudioSync {
  constructor(onReady, onEnded, onError) {
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    
    this.volume = 1.0;
    this.muted = false;
    this.audioElement.muted = false;
    this.audioElement.volume = 1.0;
    this._blobUrl = null;
    
    this.onReady = onReady;
    this.onEnded = onEnded;
    this.onError = onError;

    this.isPlaying = false;
    this.isLoaded = false;
    this.duration = 0;
    this.playbackRate = 1.0;
    
    // Anclaje de alta precisión con corrección de deriva suave (PLL sin saltos)
    this._anchorPerf = 0;
    this._anchorAudioMs = 0;
    this._lastSyncCheck = 0;
    this._clockSkewRate = 1.0;
    this._lastRawAudioTime = -1;

    const enforceSpeedAndPitch = () => {
      if (this.audioElement) {
        try {
          this.audioElement.defaultPlaybackRate = this.playbackRate;
          this.audioElement.playbackRate = this.playbackRate;
          this.audioElement.preservesPitch = true;
        } catch (e) {}
      }
    };

    this.audioElement.addEventListener('canplaythrough', () => {
      this.isLoaded = true;
      this.duration = this.audioElement.duration || 0;
      enforceSpeedAndPitch();
      if (this.onReady) this.onReady();
    });

    this.audioElement.addEventListener('playing', () => {
      this.isPlaying = true;
      enforceSpeedAndPitch();
      const rawSec = this.audioElement.currentTime || 0;
      this._anchorAudioMs = rawSec * 1000;
      this._anchorPerf = performance.now();
      this._lastSyncCheck = this._anchorPerf;
      this._clockSkewRate = 1.0;
      this._lastRawAudioTime = rawSec;
      const toast = document.getElementById('audioUnlockToast');
      if (toast) toast.classList.remove('show');
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this._anchorPerf = 0;
      this._clockSkewRate = 1.0;
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      this._anchorPerf = 0;
      this._clockSkewRate = 1.0;
      if (this.onEnded) this.onEnded();
    });

    this.audioElement.addEventListener('error', (e) => {
      if (this.audioElement.src && this.onError) {
        this.onError('Error en la reproducción de audio.');
      }
    });
  }

  unlockAudio() {
    if (window.engine && (window.engine.isPaused || window.engine.isProcessingMiss || window.engine.isGameOver || !window.engine.isRunning)) {
      return;
    }
    if (this.audioElement) {
      this.audioElement.muted = false;
      this.audioElement.volume = 1.0;
      try {
        const p = this.audioElement.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            if (!this.isPlaying) this.audioElement.pause();
          }).catch(() => {});
        }
      } catch (e) {}
    }
  }

  showUnlockPrompt() {
    const toast = document.getElementById('audioUnlockToast');
    if (toast) toast.classList.add('show');
  }

  setPlaybackRate(rate) {
    const r = Math.max(0.5, Math.min(2.0, parseFloat(rate) || 1.0));
    this.playbackRate = r;
    if (this.audioElement) {
      try {
        this.audioElement.defaultPlaybackRate = r;
        this.audioElement.playbackRate = r;
        this.audioElement.preservesPitch = true;
      } catch (e) {}
    }
    if (this.isPlaying) {
      this._anchorAudioMs = (this.audioElement.currentTime || 0) * 1000;
      this._anchorPerf = performance.now();
    }
  }

  setVolume(vol, muted = false) {
    this.volume = isNaN(vol) ? 1.0 : Math.max(0, Math.min(1, vol));
    this.muted = !!muted;
    if (this.audioElement) {
      this.audioElement.muted = this.muted;
      this.audioElement.volume = this.muted ? 0 : this.volume;
    }
  }

  loadAudioBlob(blob) {
    if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
      try { window.pauseMenuAmbientMusic(); } catch (_) {}
    }
    if (!blob) return;
    if (typeof blob === 'string') {
      this.loadAudioUrl(blob);
      return;
    }
    if (this._blobUrl) {
      try { URL.revokeObjectURL(this._blobUrl); } catch (e) {}
    }
    this._blobUrl = URL.createObjectURL(blob);
    this.loadAudioUrl(this._blobUrl);
  }

  loadAudioUrl(url) {
    if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
      try { window.pauseMenuAmbientMusic(); } catch (_) {}
    }
    this.isLoaded = false;
    this.isPlaying = false;
    this.audioElement.loop = false;
    if (url) {
      this.audioElement.src = url;
      if (this.playbackRate !== 1.0) {
        this.audioElement.playbackRate = this.playbackRate;
      }
      this.audioElement.load();
    } else {
      this.audioElement.removeAttribute('src');
      this.audioElement.load();
    }
    this._anchorPerf = 0;
    this._anchorAudioMs = 0;
  }

  play() {
    if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
      try { window.pauseMenuAmbientMusic(); } catch (_) {}
    }
    if (!this.audioElement.src) return Promise.resolve();
    if (window.engine && (window.engine.isPaused || window.engine.isProcessingMiss || window.engine.isGameOver || !window.engine.isRunning || window.engine.isCountingDown)) {
      return Promise.resolve();
    }
    try {
      this.audioElement.playbackRate = this.playbackRate;
      this.audioElement.muted = this.muted;
      this.audioElement.volume = this.muted ? 0 : this.volume;

      const p = this.audioElement.play();
      if (p && typeof p.then === 'function') {
        return p.then(() => {
          this.isPlaying = true;
          this._anchorAudioMs = (this.audioElement.currentTime || 0) * 1000;
          this._anchorPerf = performance.now();
          this._lastSyncCheck = this._anchorPerf;
        }).catch(err => {
          if (err.name === 'NotAllowedError') this.showUnlockPrompt();
        });
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  }

  pause() {
    this.isPlaying = false;
    this._anchorPerf = 0;
    try {
      this.audioElement.pause();
    } catch (e) {}
  }

  seekTo(seconds) {
    const sec = Math.max(0, parseFloat(seconds) || 0);
    this._anchorPerf = 0;
    this._anchorAudioMs = sec * 1000;
    this._lastReturnedMs = sec * 1000;
    this._lastRawAudioTime = -1;
    try {
      if (this.audioElement.readyState >= 1) {
        this.audioElement.currentTime = sec;
      }
    } catch (e) {}
  }

  // ==========================================
  // RELOJ PLL 100% LINEAL, MONÓTONO Y CONTINUO ANCLADO AL VSYNC (0 TIRONES A 120 FPS)
  // ==========================================
  getCurrentTimeMs(frameNow) {
    const now = (frameNow !== undefined && frameNow !== null) ? frameNow : performance.now();

    if (!this.isPlaying) {
      if (this.audioElement && !isNaN(this.audioElement.currentTime) && this.audioElement.currentTime > 0) {
        return this.audioElement.currentTime * 1000;
      }
      if (window.engine && window.engine.isRunning && !window.engine.isPaused && !window.engine.isCountingDown) {
        if (!this._fallbackAnchor) this._fallbackAnchor = now;
        return (now - this._fallbackAnchor) * (this.playbackRate || 1.0);
      }
      return this._anchorAudioMs || 0;
    }

    // Si ya se calculó para este mismo VSync frameNow, devolver en O(1)
    if (frameNow !== undefined && frameNow !== null && this._cachedFrameNow === frameNow) {
      return this._lastReturnedMs;
    }

    this._fallbackAnchor = null;
    const rate = this.playbackRate || 1.0;

    if (!this._anchorPerf) {
      const rawSec = (this.audioElement && !isNaN(this.audioElement.currentTime)) ? this.audioElement.currentTime : 0;
      this._anchorPerf = now;
      this._anchorAudioMs = rawSec * 1000;
      this._lastReturnedMs = this._anchorAudioMs;
      this._lastSyncCheck = now;
      this._clockSkewRate = 1.0;
      this._smoothedDrift = 0;
      this._lastRawAudioTime = rawSec;
      this._cachedFrameNow = frameNow;
      return this._anchorAudioMs;
    }

    const elapsed = Math.max(0, now - this._anchorPerf);
    let currentPredMs = this._anchorAudioMs + elapsed * rate * (this._clockSkewRate || 1.0);

    // Muestrear deriva cada 250ms filtrando el escalón de cuantización del buffer de audio (21-46ms en Android)
    if (now - this._lastSyncCheck >= 250) {
      this._lastSyncCheck = now;
      const rawSec = this.audioElement ? this.audioElement.currentTime : 0;
      if (rawSec !== this._lastRawAudioTime && rawSec > 0) {
        this._lastRawAudioTime = rawSec;
        const hwAudioMs = rawSec * 1000;
        const drift = hwAudioMs - currentPredMs;

        this._anchorPerf = now;
        this._anchorAudioMs = currentPredMs;

        if (Math.abs(drift) > 450) {
          this._anchorAudioMs = hwAudioMs;
          this._lastReturnedMs = hwAudioMs;
          this._clockSkewRate = 1.0;
          this._smoothedDrift = 0;
          currentPredMs = hwAudioMs;
        } else {
          // Filtro paso-bajo exponencial que absorbe el jitter de cuantización del mixer de audio
          this._smoothedDrift = (this._smoothedDrift || 0) * 0.86 + drift * 0.14;
          if (Math.abs(this._smoothedDrift) > 36.0) {
            // Corrección de frecuencia ultra-suave (±0.35% máx) totalmente imperceptible al ojo a 120Hz
            this._clockSkewRate = 1.0 + Math.max(-0.0035, Math.min(0.0035, this._smoothedDrift / 4000));
          } else {
            this._clockSkewRate = 1.0;
          }
        }
      }
    }

    if (this._lastReturnedMs !== undefined && currentPredMs < this._lastReturnedMs) {
      currentPredMs = this._lastReturnedMs;
    } else {
      this._lastReturnedMs = currentPredMs;
    }

    this._cachedFrameNow = frameNow;
    return currentPredMs;
  }
}


// ==========================================
// HIGH PERFORMANCE ZERO-GC PARTICLE POOL SYSTEM
// ==========================================

class ParticleSystem {
  constructor(maxParticles = 72, maxShockwaves = 12) {
    this.maxParticles = maxParticles;
    this.maxShockwaves = maxShockwaves;
    this.maxArcs = 12;

    // Fixed pre-allocated memory pool (Zero Garbage Collection spikes)
    this.particles = new Array(maxParticles);
    for (let i = 0; i < maxParticles; i++) {
      this.particles[i] = {
        active: false,
        x: 0, y: 0,
        vx: 0, vy: 0,
        gravity: 0,
        drag: 1.0,
        radius: 0,
        color: '#ffffff',
        alpha: 1.0,
        decay: 1.0,
        type: 'spark',
        rotation: 0,
        rotSpeed: 0,
        scaleX: 1,
        scaleY: 1
      };
    }

    this.shockwaves = new Array(maxShockwaves);
    for (let i = 0; i < maxShockwaves; i++) {
      this.shockwaves[i] = {
        active: false,
        x: 0, y: 0,
        radius: 0,
        maxRadius: 0,
        growth: 0,
        color: '#ffffff',
        alpha: 1.0,
        decay: 1.0,
        lineWidth: 2.0
      };
    }

    this.lightningArcs = new Array(this.maxArcs);
    for (let i = 0; i < this.maxArcs; i++) {
      this.lightningArcs[i] = {
        active: false,
        points: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
        color: '#00f2fe',
        alpha: 1.0,
        decay: 4.5,
        lineWidth: 3.0
      };
    }
  }

  reset() {
    if (this.particles) {
      for (let i = 0; i < this.maxParticles; i++) {
        if (this.particles[i]) this.particles[i].active = false;
      }
    }
    if (this.shockwaves) {
      for (let i = 0; i < this.maxShockwaves; i++) {
        if (this.shockwaves[i]) this.shockwaves[i].active = false;
      }
    }
    if (this.lightningArcs) {
      for (let i = 0; i < this.maxArcs; i++) {
        if (this.lightningArcs[i]) this.lightningArcs[i].active = false;
      }
    }
  }

  spawnParticle() {
    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.particles[i].active) {
        this.particles[i].active = true;
        return this.particles[i];
      }
    }
    return null;
  }

  spawnShockwave() {
    for (let i = 0; i < this.maxShockwaves; i++) {
      if (!this.shockwaves[i].active) {
        this.shockwaves[i].active = true;
        return this.shockwaves[i];
      }
    }
    return null;
  }

  // 1. Acoustic Grand Piano Warm Golden Flash & Radiant Sparks
  emitHit(x, y, color = '#ffdf9e', count = 8) {
    const goldPalette = ['#ffdf9e', '#ffd700', '#fff4d1', '#f5cb6c', '#ffffff', '#00f5a0'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 25;
      p.gravity = 40;
      p.drag = 0.95;
      p.radius = 1.8 + Math.random() * 3.0;
      p.color = (color === '#00f2fe' || !color) ? goldPalette[Math.floor(Math.random() * goldPalette.length)] : color;
      p.alpha = 1.0;
      p.decay = 2.4 + Math.random() * 1.5;
      p.type = Math.random() < 0.4 ? 'glitter_star' : 'spark';
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 8;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 8;
      sw.maxRadius = 70;
      sw.growth = 15.0;
      sw.color = (color === '#00f2fe' || !color) ? '#ffdf9e' : color;
      sw.alpha = 0.95;
      sw.decay = 3.6;
      sw.lineWidth = 2.5;
    }
  }

  // Lluvia de brillantitos continuos y diamantes estelares en Holds
  emitHoldSparks(x, y, color = '#ffe082', count = 6) {
    const glitterPal = [color, '#ffffff', '#fff7d6', '#ffd700', '#00f5a0', '#00f2fe', '#ff00aa'];
    const safeCount = Math.min(count, 8);
    for (let i = 0; i < safeCount; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const speed = 70 + Math.random() * 240;

      p.x = x + (Math.random() - 0.5) * 28;
      p.y = y + (Math.random() - 0.5) * 10;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 35;
      p.gravity = 110;
      p.drag = 0.94;
      p.radius = 2.2 + Math.random() * 3.2;
      p.color = glitterPal[Math.floor(Math.random() * glitterPal.length)];
      p.alpha = 1.0;
      p.decay = 2.8 + Math.random() * 1.8;
      p.type = Math.random() < 0.65 ? 'glitter_star' : (Math.random() < 0.5 ? 'diamond_spark' : 'spark');
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 12;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    if (Math.random() < 0.60) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = x;
        sw.y = y;
        sw.radius = 6;
        sw.maxRadius = 45;
        sw.growth = 26.0;
        sw.color = color;
        sw.alpha = 0.85;
        sw.decay = 4.2;
        sw.lineWidth = 2.0;
      }
    }

    // Micro-onda expansiva de choque de contacto en el receptor
    if (Math.random() < 0.45) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = x;
        sw.y = y;
        sw.radius = 4;
        sw.maxRadius = 38;
        sw.growth = 24.0;
        sw.color = color;
        sw.alpha = 0.90;
        sw.decay = 5.5;
        sw.lineWidth = 2.0;
      }
    }
  }

  emitHoldSpark(x, y, color = '#ffe082') {
    this.emitHoldSparks(x, y, color, 3);
  }

  // Celebración de Estrella Desbloqueada: Shockwave circular + 8 chispas en caída parabólica aditiva
  emitStarCelebration(x, y, isPlatinum = false) {
    const pal = isPlatinum 
      ? ['#ffffff', '#a5f3fc', '#e0f2fe', '#ffffff', '#38bdf8'] 
      : ['#fff0c2', '#e5b869', '#ffd700', '#f3d791', '#ffffff'];
    
    // 8 chispas aditivas con trayectoria parabólica descendente
    for (let i = 0; i < 8; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (Math.PI * 0.15) + (Math.random() * Math.PI * 0.7); // Dispersión angular lateral/inferior
      const speed = 75 + Math.random() * 115;
      p.x = x + (Math.random() - 0.5) * 14;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 20;
      p.gravity = 220; // Caída parabólica pronunciada hacia abajo
      p.drag = 0.95;
      p.radius = 2.2 + Math.random() * 1.8;
      p.color = pal[Math.floor(Math.random() * pal.length)];
      p.alpha = 1.0;
      p.decay = 2.0 + Math.random() * 0.8;
      p.type = 'spark';
      p.rotation = 0;
      p.rotSpeed = 0;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    // Micro-onda expansiva (shockwave) circular desde el nodo de la estrella
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 6;
      sw.maxRadius = 45;
      sw.growth = 16.0;
      sw.color = isPlatinum ? '#ffffff' : '#e5b869';
      sw.alpha = 1.0;
      sw.decay = 4.2;
      sw.lineWidth = 2.5;
    }
  }

  // 2. EFECTO 1: CHORROS DE PINTURA NEÓN (SPLASH / SPLATTER)
  emitPaintSplash(x, y, count = 30) {
    const paintPalette = [
      '#ff007f', // Vivid Magenta
      '#00f2fe', // Electric Cyan
      '#ffe600', // Neon Yellow
      '#39ff14', // Acid Lime
      '#b142ff', // Purple Neon
      '#ff3366'  // Coral Splat
    ];

    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = (Math.random() - 0.5) * Math.PI * 1.6 - Math.PI / 2; // Upward-biased radial fan
      const speed = 80 + Math.random() * 220;
      const col = paintPalette[Math.floor(Math.random() * paintPalette.length)];

      p.x = x + (Math.random() - 0.5) * 16;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 240; // Quick downward fall
      p.drag = 0.93;    // Liquid air resistance
      p.radius = 2.5 + Math.random() * 4.5;
      p.color = col;
      p.alpha = 1.0;
      p.decay = 2.8 + Math.random() * 1.2; // Quick fade (300-380ms)
      p.type = 'paint_drop';
      p.rotation = angle + Math.PI / 2;
      p.rotSpeed = (Math.random() - 0.5) * 4.0;
      p.scaleX = 0.85 + Math.random() * 0.4;
      p.scaleY = 1.2 + Math.random() * 0.8; // Elongated paint splatter tear
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 10;
      sw.maxRadius = 75;
      sw.growth = 14.0;
      sw.color = paintPalette[Math.floor(Math.random() * paintPalette.length)];
      sw.alpha = 0.95;
      sw.decay = 3.6;
      sw.lineWidth = 3.0;
    }
  }

  // 3. EFECTO 2: MODO FUEGO / INFIERNO (FIRE EFFECT)
  emitFireInferno(x, y, count = 32) {
    const fireColors = ['#ffffff', '#ffea00', '#ff8800', '#ff3300', '#ff0033'];

    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1; // Rising flame column
      const speed = 90 + Math.random() * 240;
      const col = fireColors[Math.floor(Math.random() * fireColors.length)];

      p.x = x + (Math.random() - 0.5) * 22;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 60; // Powerful upward lift
      p.gravity = -80; // Anti-gravity buoyancy for fire embers
      p.drag = 0.94;
      p.radius = 3.0 + Math.random() * 5.0;
      p.color = col;
      p.alpha = 0.95;
      p.decay = 2.6 + Math.random() * 1.4;
      p.type = 'fire_ember';
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 6.0;
      p.scaleX = 1;
      p.scaleY = 1.3;
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 8;
      sw.maxRadius = 80;
      sw.growth = 13.0;
      sw.color = '#ff6600';
      sw.alpha = 0.9;
      sw.decay = 3.8;
      sw.lineWidth = 2.5;
    }
  }

  spawnLightningArc(startX, startY, endX, endY, color = '#00f2fe') {
    if (!this.lightningArcs) return null;
    for (let i = 0; i < this.maxArcs; i++) {
      const arc = this.lightningArcs[i];
      if (!arc.active) {
        arc.active = true;
        arc.color = color;
        arc.alpha = 0.95;
        arc.decay = 5.0; // Quick snappy lightning flash
        arc.lineWidth = 2.5 + Math.random() * 2.0;

        const numPts = arc.points.length;
        arc.points[0].x = startX;
        arc.points[0].y = startY;
        arc.points[numPts - 1].x = endX;
        arc.points[numPts - 1].y = endY;

        const dx = (endX - startX) / (numPts - 1);
        const dy = (endY - startY) / (numPts - 1);
        const normalX = -dy;
        const normalY = dx;
        const len = Math.hypot(normalX, normalY) || 1;

        for (let j = 1; j < numPts - 1; j++) {
          const jitter = (Math.random() - 0.5) * 50;
          arc.points[j].x = startX + dx * j + (normalX / len) * jitter;
          arc.points[j].y = startY + dy * j + (normalY / len) * jitter;
        }
        return arc;
      }
    }
    return null;
  }

  // 4. FULL FOCUS: FUEGOS ARTIFICIALES (Múltiples salvas a pantalla completa con física de gravedad)
  emitFullFocusFireworks(x, y, color = '#00f2fe', width = 360, height = 740) {
    const burstPositions = [
      { x: x, y: y, count: 28, speed: 260 },
      { x: width * 0.22, y: height * 0.22, count: 22, speed: 230 },
      { x: width * 0.78, y: height * 0.26, count: 22, speed: 230 },
      { x: width * 0.50, y: height * 0.45, count: 24, speed: 240 }
    ];

    for (let bIdx = 0; bIdx < burstPositions.length; bIdx++) {
      const b = burstPositions[bIdx];
      for (let i = 0; i < b.count; i++) {
        const p = this.spawnParticle();
        if (!p) break;

        const angle = Math.random() * Math.PI * 2;
        const speed = 75 + Math.random() * b.speed;

        p.x = b.x;
        p.y = b.y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 50;
        p.gravity = 320; // Gravitational descent
        p.drag = 0.94;
        p.radius = 2.2 + Math.random() * 3.5;
        p.color = color;
        p.alpha = 1.0;
        p.decay = 2.2 + Math.random() * 1.2;
        p.type = 'spark';
        p.rotation = 0;
        p.rotSpeed = 0;
        p.scaleX = 1;
        p.scaleY = 1;
      }

      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = b.x;
        sw.y = b.y;
        sw.radius = 6;
        sw.maxRadius = 75;
        sw.growth = 16.0;
        sw.color = color;
        sw.alpha = 0.9;
        sw.decay = 4.0;
        sw.lineWidth = 2.5;
      }
    }
  }

  // 5. FULL FOCUS: AROS ELÉCTRICOS (Ondas de choque gigantes a pantalla completa y arcos eléctricos)
  emitFullFocusElectric(x, y, color = '#00f2fe', width = 360, height = 740) {
    const maxScreen = Math.max(width, height) * 1.35;

    // 1. Aros eléctricos gigantes concéntricos que superan los bordes de la pantalla
    for (let i = 0; i < 3; i++) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = (i === 0) ? x : width / 2;
        sw.y = (i === 0) ? y : height * 0.55;
        sw.radius = 8 + i * 20;
        sw.maxRadius = maxScreen;
        sw.growth = 38.0 + i * 10;
        sw.color = color;
        sw.alpha = 0.95;
        sw.decay = 3.6;
        sw.lineWidth = 4.0 - i * 0.8;
      }
    }

    // 2. Arcos eléctricos ramificados a lo largo de toda la pantalla
    this.spawnLightningArc(0, height * 0.20, width, height * 0.85, color);
    this.spawnLightningArc(width, height * 0.15, 0, height * 0.80, color);
    this.spawnLightningArc(width * 0.15, 0, x, y, color);
    this.spawnLightningArc(width * 0.85, 0, x, y, color);

    // 3. Chispas de impacto de alta energía
    for (let i = 0; i < 18; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (i / 18) * Math.PI * 2;
      const speed = 140 + Math.random() * 220;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 0;
      p.drag = 0.91;
      p.radius = 2.0 + Math.random() * 2.5;
      p.color = '#ffffff';
      p.alpha = 1.0;
      p.decay = 3.5;
      p.type = 'spark';
      p.rotation = 0;
      p.rotSpeed = 0;
      p.scaleX = 1;
      p.scaleY = 1;
    }
  }

  emitBurst(x, y, color = '#ffe082', count = 20) {
    this.emitHit(x, y, color, Math.min(count, 18));
  }

  emitSwipeBurst(x, y, direction = 'up', color = '#ffd700', count = 36) {
    const swipePalette = [color, '#ffffff', '#fff7d6', '#00f2fe', '#ffd700'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      let baseAngle = -Math.PI / 2;
      if (direction === 'down') baseAngle = Math.PI / 2;
      else if (direction === 'left') baseAngle = Math.PI;
      else if (direction === 'right') baseAngle = 0;

      const angle = baseAngle + (Math.random() - 0.5) * 0.9;
      const speed = 220 + Math.random() * 480; // Hipersónico

      p.x = x + (Math.random() - 0.5) * 20;
      p.y = y + (Math.random() - 0.5) * 10;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 0;
      p.drag = 0.95;
      p.radius = 2.4 + Math.random() * 3.8;
      p.color = swipePalette[Math.floor(Math.random() * swipePalette.length)];
      p.alpha = 1.0;
      p.decay = 2.4 + Math.random() * 1.8;
      p.type = Math.random() < 0.55 ? 'glitter_star' : (Math.random() < 0.4 ? 'diamond_spark' : 'spark');
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 16;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 12;
      sw.maxRadius = 95;
      sw.growth = 22.0;
      sw.color = color;
      sw.alpha = 1.0;
      sw.decay = 3.8;
      sw.lineWidth = 3.2;
    }
  }

  // 1. EXCLUSIVO 3D: CHISPAS DE LATÓN REAL (Royal Brass Sparks & Embers)
  emitRoyalBrass(x, y, count = 28) {
    const brassPalette = ['#fff3cf', '#ffd700', '#c5a059', '#e6af34', '#ffffff', '#f59e0b'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (Math.random() - 0.5) * Math.PI * 1.5 - Math.PI / 2;
      const speed = 90 + Math.random() * 240;
      p.x = x + (Math.random() - 0.5) * 12;
      p.y = y + (Math.random() - 0.5) * 6;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 180;
      p.drag = 0.94;
      p.radius = 1.8 + Math.random() * 3.2;
      p.color = brassPalette[Math.floor(Math.random() * brassPalette.length)];
      p.alpha = 1.0;
      p.decay = 2.4 + Math.random() * 1.6;
      p.type = 'spark';
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 12;
      p.scaleX = 1;
      p.scaleY = 1;
    }
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 10;
      sw.maxRadius = 75;
      sw.growth = 16.0;
      sw.color = '#ffd700';
      sw.alpha = 1.0;
      sw.decay = 3.5;
      sw.lineWidth = 3.2;
    }
  }

  // 2. EXCLUSIVO 3D: RESONANCIA ARMÓNICA (Acoustic Standing Waves)
  emitAcousticResonance(x, y) {
    const sw1 = this.spawnShockwave();
    if (sw1) {
      sw1.x = x;
      sw1.y = y;
      sw1.radius = 6;
      sw1.maxRadius = 90;
      sw1.growth = 18.0;
      sw1.color = '#ffe082';
      sw1.alpha = 1.0;
      sw1.decay = 3.2;
      sw1.lineWidth = 3.5;
    }
    const sw2 = this.spawnShockwave();
    if (sw2) {
      sw2.x = x;
      sw2.y = y;
      sw2.radius = 2;
      sw2.maxRadius = 130;
      sw2.growth = 12.0;
      sw2.color = '#c5a059';
      sw2.alpha = 0.8;
      sw2.decay = 2.0;
      sw2.lineWidth = 2.0;
    }
    const goldTones = ['#fff8db', '#f3d791', '#d4af37', '#ffffff'];
    for (let i = 0; i < 16; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 110;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 15;
      p.gravity = -20;
      p.drag = 0.96;
      p.radius = 1.4 + Math.random() * 2.2;
      p.color = goldTones[Math.floor(Math.random() * goldTones.length)];
      p.alpha = 0.95;
      p.decay = 1.8 + Math.random() * 1.2;
      p.type = 'spark';
    }
  }

  // 3. EXCLUSIVO 3D: FUEGO CARMESÍ & TERCIOPELO (Crimson Damper Royale)
  emitCrimsonRoyale(x, y, count = 26) {
    const crimsonPalette = ['#85141d', '#b91c1c', '#dc2626', '#ffd700', '#fff3cf', '#f87171'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (Math.random() - 0.5) * Math.PI * 1.6 - Math.PI / 2;
      const speed = 70 + Math.random() * 180;
      p.x = x + (Math.random() - 0.5) * 14;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 60;
      p.drag = 0.95;
      p.radius = 2.0 + Math.random() * 3.5;
      p.color = crimsonPalette[Math.floor(Math.random() * crimsonPalette.length)];
      p.alpha = 1.0;
      p.decay = 2.0 + Math.random() * 1.4;
      p.type = 'spark';
    }
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 8;
      sw.maxRadius = 80;
      sw.growth = 15.0;
      sw.color = '#e11d48';
      sw.alpha = 0.9;
      sw.decay = 3.0;
      sw.lineWidth = 3.0;
    }
  }

  // 4. EXCLUSIVO 3D: MARFIL CENITAL (Luminous Zenith Ivory)
  emitLuminousIvory(x, y, count = 25) {
    const ivoryPalette = ['#ffffff', '#fdfbf7', '#fff8e7', '#fef3c7', '#ffd700', '#f5e6d3'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 200;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 20;
      p.gravity = 25;
      p.drag = 0.94;
      p.radius = 2.0 + Math.random() * 3.0;
      p.color = ivoryPalette[Math.floor(Math.random() * ivoryPalette.length)];
      p.alpha = 1.0;
      p.decay = 2.2 + Math.random() * 1.5;
      p.type = 'spark';
    }
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 12;
      sw.maxRadius = 85;
      sw.growth = 17.0;
      sw.color = '#ffffff';
      sw.alpha = 1.0;
      sw.decay = 3.8;
      sw.lineWidth = 3.5;
    }
  }

  // 5. GACHAPON COLECCIONISTA: SINFONÍA ESMERALDA IMPERIAL
  emitEmeraldSymphony(x, y, count = 28) {
    const emeraldPalette = ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#ecfdf5', '#059669'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const speed = 75 + Math.random() * 210;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 35;
      p.gravity = 30;
      p.drag = 0.94;
      p.radius = 2.2 + Math.random() * 3.2;
      p.color = emeraldPalette[i % emeraldPalette.length];
      p.alpha = 1.0;
      p.decay = 2.0 + Math.random() * 1.3;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 10;
      p.type = i % 2 === 0 ? 'diamond_spark' : 'glitter_star';
    }
    for (let r = 0; r < 2; r++) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = x;
        sw.y = y;
        sw.radius = 8 + r * 10;
        sw.maxRadius = 75 + r * 22;
        sw.growth = 15.0 + r * 3;
        sw.color = r === 0 ? '#34d399' : '#fbbf24';
        sw.alpha = 0.95;
        sw.decay = 3.2;
        sw.lineWidth = 3.0 - r * 0.8;
      }
    }
  }

  // 6. GACHAPON ÉPICO: VÓRTICE DE AMATISTA VINTAGE
  emitAmethystVortex(x, y, count = 30) {
    const amethystPalette = ['#c084fc', '#a855f7', '#e879f9', '#f5d0fe', '#fbbf24', '#f43f5e'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const spiralAngle = (i / count) * Math.PI * 4;
      const speed = 65 + (i / count) * 195;
      p.x = x + Math.cos(spiralAngle) * 6;
      p.y = y + Math.sin(spiralAngle) * 4;
      p.vx = Math.cos(spiralAngle) * speed;
      p.vy = Math.sin(spiralAngle) * speed - 25;
      p.gravity = 20;
      p.drag = 0.95;
      p.radius = 2.0 + Math.random() * 3.4;
      p.color = amethystPalette[i % amethystPalette.length];
      p.alpha = 1.0;
      p.decay = 1.9 + Math.random() * 1.4;
      p.rotation = spiralAngle;
      p.rotSpeed = 12;
      p.type = i % 3 === 0 ? 'glitter_star' : 'diamond_spark';
    }
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 10;
      sw.maxRadius = 92;
      sw.growth = 16.5;
      sw.color = '#e879f9';
      sw.alpha = 0.95;
      sw.decay = 3.4;
      sw.lineWidth = 3.2;
    }
  }

  // 7. GACHAPON LEGENDARIO: SUPERNOVA DE DIAMANTE CELESTIAL
  emitDiamondSupernova(x, y, count = 36) {
    const diamondPalette = ['#ffffff', '#38bdf8', '#bae6fd', '#fde047', '#f472b6', '#7dd3fc'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const speed = 90 + Math.random() * 240;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 40;
      p.gravity = 18;
      p.drag = 0.94;
      p.radius = 2.4 + Math.random() * 3.8;
      p.color = diamondPalette[i % diamondPalette.length];
      p.alpha = 1.0;
      p.decay = 1.85 + Math.random() * 1.3;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 14;
      p.type = i % 2 === 0 ? 'glitter_star' : 'diamond_spark';
    }
    for (let r = 0; r < 2; r++) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = x;
        sw.y = y;
        sw.radius = 10 + r * 14;
        sw.maxRadius = 95 + r * 25;
        sw.growth = 18.0;
        sw.color = r === 0 ? '#ffffff' : '#38bdf8';
        sw.alpha = 1.0;
        sw.decay = 3.5;
        sw.lineWidth = 3.6 - r * 1.0;
      }
    }
  }

  update(dt) {
    if (!this.particles || !this.shockwaves) return;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p || !p.active) continue;

      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy = (p.vy + p.gravity * dt) * Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.rotSpeed) {
        p.rotation += p.rotSpeed * dt;
      }

      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        p.active = false;
      }
    }

    for (let i = 0; i < this.maxShockwaves; i++) {
      const s = this.shockwaves[i];
      if (!s || !s.active) continue;

      s.radius += (s.maxRadius - s.radius) * s.growth * dt;
      s.alpha -= s.decay * dt;
      if (s.alpha <= 0) {
        s.active = false;
      }
    }

    if (this.lightningArcs) {
      for (let i = 0; i < this.maxArcs; i++) {
        const a = this.lightningArcs[i];
        if (!a || !a.active) continue;
        a.alpha -= a.decay * dt;
        if (a.alpha <= 0) a.active = false;
      }
    }
  }

  render(ctx) {
    if (!this.particles || !this.shockwaves || !ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p || !p.active || p.alpha <= 0.01) continue;

      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;

      if (p.type === 'glitter_star') {
        // Estrella diamante ✦ de 4 puntas ultra-brillante
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const rOuter = Math.max(2.0, p.radius * 2.2);
        const rInner = rOuter * 0.22;
        ctx.beginPath();
        for (let pt = 0; pt < 8; pt++) {
          const rCur = (pt % 2 === 0) ? rOuter : rInner;
          const aCur = (pt / 8) * Math.PI * 2;
          const px = Math.cos(aCur) * rCur;
          const py = Math.sin(aCur) * rCur;
          if (pt === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();

        // Núcleo blanco diamantino
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, rInner * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'diamond_spark') {
        // Micro-diamante facetado ◆
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const dW = p.radius * 1.6;
        const dH = p.radius * 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -dH);
        ctx.lineTo(dW, 0);
        ctx.lineTo(0, dH);
        ctx.lineTo(-dW, 0);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'paint_drop') {
        // Render stylized tear/droplet of paint
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.scaleX, p.scaleY);
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'fire_ember') {
        const r = p.radius * (0.6 + p.alpha * 0.4);
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      } else {
        const r = p.radius;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      }
    }

    for (let i = 0; i < this.maxShockwaves; i++) {
      const s = this.shockwaves[i];
      if (!s.active || s.alpha <= 0.01) continue;

      ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth || 2.0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.lightningArcs) {
      for (let i = 0; i < this.maxArcs; i++) {
        const a = this.lightningArcs[i];
        if (!a || !a.active || a.alpha <= 0.01) continue;

        ctx.globalAlpha = Math.max(0, Math.min(1, a.alpha));
        ctx.strokeStyle = a.color;
        ctx.lineWidth = a.lineWidth || 2.5;
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        for (let j = 1; j < a.points.length; j++) {
          ctx.lineTo(a.points[j].x, a.points[j].y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, (a.lineWidth || 2.5) * 0.4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

// ==========================================
// 3-LANE FIXED BEATSTAR ENGINE
// ==========================================

const GLOBAL_SYNTH_PALETTES = [
  ['#7c3aed', '#8b5cf6', '#3b82f6', '#00f2fe', '#10b981', '#39ff14', '#ff007f', '#ff2040'],
  ['#4c1d95', '#c026d3', '#ec4899', '#f43f5e', '#fb923c', '#fbbf24', '#fde047', '#ffffff'],
  ['#1e3a8a', '#0284c7', '#06b6d4', '#10b981', '#34d399', '#39ff14', '#a3e635', '#fef08a'],
  ['#312e81', '#6366f1', '#818cf8', '#38bdf8', '#2dd4bf', '#f472b6', '#fb7185', '#fed7aa'],
  ['#881337', '#be123c', '#e11d48', '#f97316', '#f59e0b', '#facc15', '#fef08a', '#ffffff']
];

const GLOBAL_BEAM_PALETTE = [
  { r: 0,   g: 242, b: 254 }, // Cian Neón
  { r: 255, g: 0,   b: 127 }, // Magenta Metálico
  { r: 251, g: 191, b: 36  }, // Oro Radiante
  { r: 168, g: 85,  b: 247 }, // Violeta Eléctrico
  { r: 57,  g: 255, b: 20  }, // Lima Flúor
  { r: 56,  g: 189, b: 248 }  // Azul Turquesa
];

const GLOBAL_DISCO_SPOTLIGHTS = [
  { x: -0.65, y: -0.55, z: 0.52, rgb: { r: 255, g: 255, b: 255 }, weight: 1.1 },
  { x: 0.70, y: -0.45, z: 0.55, rgb: { r: 0, g: 242, b: 254 }, weight: 0.95 },
  { x: -0.25, y: -0.75, z: 0.60, rgb: { r: 255, g: 0, b: 127 }, weight: 1.0 },
  { x: 0.40, y: -0.60, z: 0.70, rgb: { r: 251, g: 191, b: 36 }, weight: 0.9 }
];

class BeatstarEngine {
  constructor(canvas, uiCallbacks) {
    this.canvas = canvas;
    this.ctx = (canvas && canvas.getContext)
      ? canvas.getContext('2d')
      : null;
    this.ui = uiCallbacks;

    // Buffers reutilizables Zero-GC para coordenadas en perspectiva a 120 FPS
    this._coordScratch0 = { x: 0, y: 0, scale: 1, laneW: 50, pCurved: 0 };
    this._coordScratch1 = { x: 0, y: 0, scale: 1, laneW: 50, pCurved: 0 };
    this._coordScratch2 = { x: 0, y: 0, scale: 1, laneW: 50, pCurved: 0 };
    this._frameDt = 1 / 120;
    this._lastPortalPulse = -1;
    this._canvasRect = null;

    // Cap resolution scaling for 120 FPS mobile GPU efficiency
    this.dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 1.5);
    this.width = 0;
    this.height = 0;
    this.numLanes = 3; // Fixed strictly to 3 vertical lanes
    this.laneWidth = 0;
    this.hitLineY = 0;
    this.baseScrollDurationMs = 1200;
    this.noteSpeedMultiplier = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_note_speed') || '1.0') : '1.0') || 1.0;
    this.songPlaybackRate = 1.0;
    this.scrollDurationMs = Math.round(this.baseScrollDurationMs / Math.max(0.5, Math.min(2.5, this.noteSpeedMultiplier)));

    this.notes = [];
    this.activeHolds = new Map();
    this.activeTouches = new Map();
    this.laneGlows = [0, 0, 0];
    this.fxRipples = [];
    this.bgBursts = [];
    this.musicalNotes = [];
    this.topComboToast = null;
    this.combo3DExplosions = [];
    this.activeAtmosphereColor = null;
    this.targetAtmosphereColor = null;
    this.atmosphereShiftProgress = 1.0;
    this.speedStreaks = [];

    // Key FX Theme (default_neon, color_burst, spotlight_reveal)
    this.activeEffect = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_active_effect') : null) || 'default_neon';
    this.latencyOffsetMs = parseInt(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_offset') || '0') : '0', 10) || 0;

    // Custom Background & Reactive Illumination System
    this.customBgMode = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_bg_mode') : null) || 'black';
    this.customBgOpacity = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_opacity') || '0.40') : '0.40') || 0.40;
    this.customBgCropX = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_crop_x') || '0.5') : '0.5');
    this.customBgCropY = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_crop_y') || '0.5') : '0.5');
    this.customBgZoom = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_crop_zoom') || '1.0') : '1.0');
    this.customBgFit = (typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_fit') || 'cover') : 'cover');
    this.customBgMedia = null;
    this.customBgMediaType = null; // 'image' or 'video'
    this.customBgVideo = null;
    this.reactiveLightBoost = 0;
    this.lastHitColor = '#00f2fe';
    this.spotlightCanvas = null;
    this.spotlightCtx = null;
    this.activeSwipeDrags = new Map();
    this.hudArtistPortalEl = null;

    // Bola de Discoteca Ultra-Optimizada (120 FPS, 0 Lag, Luces de Colores Glow)
    this.discoBall = {
      active: false,
      descendY: -120,
      targetY: -120,
      radius: 27,
      rotation: 0,
      rotSpeed: 0.85,
      latBands: 7,
      lonSegments: 14,
      specks: []
    };
    for (let i = 0; i < 14; i++) {
      this.discoBall.specks.push({
        theta: Math.random() * Math.PI * 2,
        phi: (Math.random() - 0.5) * Math.PI * 0.88,
        dist: 0.15 + Math.random() * 0.80,
        size: 4.0 + Math.random() * 5.0,
        speed: 0.35 + Math.random() * 0.85,
        colorIdx: i % 6,
        brightness: 0.60 + Math.random() * 0.40,
        shimmerPhase: Math.random() * Math.PI * 2,
        shimmerSpeed: 3.0 + Math.random() * 5.0
      });
    }

    // PC Controls & Detection
    this.isPCMode = (typeof window !== 'undefined') && (!('ontouchstart' in window) && (navigator.maxTouchPoints === 0 || (window.matchMedia && window.matchMedia('(pointer: fine)').matches)));
    const savedKeybinds = (typeof localStorage !== 'undefined') ? localStorage.getItem('beatstar_pc_keybinds') : null;
    this.pcKeybinds = savedKeybinds ? JSON.parse(savedKeybinds) : { 0: 'd', 1: 'f', 2: 'j' };
    this.initCustomBackground();

    // Scoring & Multiplier
    this.score = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.streakCount = 0;
    this.multiplier = 1;
    this.stars = 0;
    this.lastCelebratedStar = 0;
    this.targetScore = 100000;
    this.missCount = 0;
    this.invulnerableUntil = 0;
    this.isInitialLaunch = true;
    this.isRewinding = false;
    this.isCountingDown = false;
    const savedContinueMode = typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_continue_mode') : null;
    this.continueMode = (savedContinueMode === 'true' || savedContinueMode === true);
    this.judgements = [];
    this.flyingLyrics = [];
    this.activeKaraokeLyrics = [];
    this._lastCurLyricIndex = -1;
    this.stats = { perfectPlus: 0, perfect: 0, great: 0, miss: 0 };
    this.timingStats = { count: 0, sumSignedMs: 0, sumAbsMs: 0, earlyCount: 0, lateCount: 0, exactCount: 0 };
    this.overdriveLevel = 0;
    this.overdriveFlash = 0;
    this._wasOverdrive = false;
    this.vignetteAlpha = 0;
    this.vignetteColor = '#e5b869';

    // Master Volume & Mute
    const savedMasterVol = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_master_volume') ?? '1.0') : '1.0');
    const savedMasterMuted = typeof localStorage !== 'undefined' && localStorage.getItem('beatstar_master_muted') === 'true';
    this.masterVolume = isNaN(savedMasterVol) ? 1.0 : Math.max(0, Math.min(1, savedMasterVol));
    this.masterMuted = savedMasterMuted;

    // Custom judgment colors: Paleta vibrante Beatstar para juicios y resplandor de carril
    const _savedJudgeColors = (() => { try { return JSON.parse(localStorage.getItem('beatstar_judge_colors') || 'null'); } catch(e) { return null; } })();
    if (_savedJudgeColors && _savedJudgeColors.perfectPlus === '#ffffff' && _savedJudgeColors.perfect === '#e5b869') {
      delete _savedJudgeColors.perfectPlus;
      delete _savedJudgeColors.perfect;
      delete _savedJudgeColors.great;
      delete _savedJudgeColors.good;
    }
    this.judgeColors = Object.assign({
      perfectPlus: '#00f5a0',
      perfect:     '#ffd700',
      great:       '#00d4ff',
      good:        '#ff7b00'
    }, _savedJudgeColors || {});

    this.visualDimension = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_visual_dimension') : null) || '3d';
    this.keyStyle = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_key_style') : null) || 'beatstar_large';

    this.nextCalibNoteTime = 0;
    this.synth = new HighFidelityAudioPlayer();

    this.particles = new ParticleSystem();
    this.sync = new DirectAudioSync(
      () => this.onAudioReady(),
      () => this.onAudioEnded(),
      (msg) => this.onAudioError(msg)
    );
    this.audioSync = this.sync;

    this.lanePressAnim = [0, 0, 0];
    this.laneFlashTimers = [0, 0, 0];
    this.laneFlashColors = ['#00f5a0', '#00f5a0', '#00f5a0'];
    this.lastHitTimePerf = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this._holdPointsBuffer = Array.from({ length: 16 }, () => ({ x: 0, y: 0, scale: 1, laneW: 50, halfW: 20 }));

    this.initCanvasSize();
    this.bindEvents();

    // Cache de elementos de odómetro (roller digits)
    this.cachedRollerDigits = [0, 1, 2, 3, 4, 5, 6].map(d => (typeof document !== 'undefined' ? document.getElementById(`rollerDigit${6 - d}`) : null));
    this.lastDisplayedRollerValues = new Array(7).fill(-1);
    this.cachedHudScoreEl = (typeof document !== 'undefined' ? document.getElementById('hudScore') : null);
    this.lastScoreInt = -1;
  }

  setMasterVolume(val, muted = false) {
    this.masterVolume = Math.max(0, Math.min(1, parseFloat(val) || 0));
    this.masterMuted = !!muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beatstar_master_volume', this.masterVolume.toString());
      localStorage.setItem('beatstar_master_muted', this.masterMuted.toString());
    }
    if (this.sync && this.sync.setVolume) {
      this.sync.setVolume(this.masterVolume, this.masterMuted);
    }
    if (this.synth && this.synth.setVolume) {
      this.synth.setVolume(this.masterVolume, this.masterMuted);
    }
  }

  unlockAudio() {
    if (this.sync && this.sync.unlockAudio) {
      this.sync.unlockAudio();
    }
    if (this.synth && this.synth.ensureContext) {
      this.synth.ensureContext();
    }
  }

  onAudioReady() {
    console.log('[BeatstarEngine] Audio track ready and buffered.');
  }

  onAudioEnded() {
    console.log('[BeatstarEngine] Audio reached end of stream.');
    if (this.isRunning && !this.isGameOver && this.beatmapData) {
      setTimeout(() => this.triggerGameEnd(), 350);
    }
  }

  onAudioError(msg) {
    console.warn('[BeatstarEngine] Audio warning/error:', msg);
  }

  getScoreColor(type) {
    const jc = this.judgeColors || {};
    switch (type) {
      case 'perfectPlus':
      case 'PERFECT+':
        return jc.perfectPlus || '#00f5a0';
      case 'perfect':
      case 'PERFECT':
        return jc.perfect || '#ffd700';
      case 'great':
      case 'GREAT':
        return jc.great || '#00d4ff';
      case 'good':
      case 'GOOD':
        return jc.good || '#ff7b00';
      case 'miss':
      case 'MISS':
        return '#ff1744';
      default:
        return '#00f5a0';
    }
  }

  getJudgeGlowColor(type) {
    const raw = this.getScoreColor(type);
    if (!raw || raw.toLowerCase() === '#ffffff' || raw.toLowerCase() === '#fff') {
      switch (type) {
        case 'perfectPlus':
        case 'PERFECT+':
          return '#00f5a0';
        case 'perfect':
        case 'PERFECT':
          return '#ffd700';
        case 'great':
        case 'GREAT':
          return '#00d4ff';
        case 'good':
        case 'GOOD':
          return '#ff7b00';
        default:
          return '#00f5a0';
      }
    }
    return raw;
  }

  setVisualDimension(dim) {
    this.visualDimension = (dim === '2d') ? '2d' : '3d';
    this._hitSpriteSocket = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beatstar_visual_dimension', this.visualDimension);
    }
  }

  setKeyStyle(style) {
    this.keyStyle = (style === 'compact') ? 'compact' : 'beatstar_large';
    this._hitSpriteSocket = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beatstar_key_style', this.keyStyle);
    }
  }

  normalizeEffectId(rawId) {
    const LEGACY_MAP = {
      default_neon: 'solar_inferno',
      royal_brass: 'solar_inferno',
      fire_inferno: 'solar_inferno',
      crimson_royale: 'solar_inferno',
      acoustic_resonance: 'cryo_blizzard',
      luminous_ivory: 'aurora_borealis',
      paint_splash: 'cyber_neon',
      color_burst: 'cyber_neon',
      full_focus_base: 'zeus_lightning',
      full_focus_fireworks: 'grand_fireworks',
      full_focus_electric: 'zeus_lightning',
      emerald_symphony: 'dragon_fire',
      amethyst_vortex: 'deep_cosmos',
      diamond_supernova: 'supernova_burst'
    };
    const validIds = new Set([
      'solar_inferno',
      'cryo_blizzard',
      'cyber_neon',
      'grand_fireworks',
      'zeus_lightning',
      'deep_cosmos',
      'asteroid_impact',
      'black_hole',
      'dragon_fire',
      'aurora_borealis',
      'supernova_burst',
      'quantum_prism'
    ]);
    if (validIds.has(rawId)) return rawId;
    return LEGACY_MAP[rawId] || 'solar_inferno';
  }

  emitKeyHit(x, y, color = '#ffdf9e', count = 24) {
    const fx = this.normalizeEffectId(this.activeEffect);
    this.activeEffect = fx;

    const paletteByFx = {
      solar_inferno: ['#ffffff', '#fde047', '#fb923c', '#ff3300', '#dc2626'],
      cryo_blizzard: ['#ffffff', '#e0f2fe', '#7dd3fc', '#38bdf8', '#0284c7'],
      cyber_neon: ['#ff007f', '#00f2fe', '#ffe600', '#a855f7', '#39ff14'],
      grand_fireworks: ['#ffd700', '#ff0055', '#00ff88', '#00f2fe', '#e879f9', '#ffffff'],
      zeus_lightning: ['#ffffff', '#a5f3fc', '#00f2fe', '#818cf8', '#c084fc'],
      deep_cosmos: ['#c084fc', '#f472b6', '#38bdf8', '#fde047', '#818cf8'],
      asteroid_impact: ['#fde047', '#fb923c', '#ea580c', '#dc2626', '#78350f'],
      black_hole: ['#f97316', '#ec4899', '#a855f7', '#fde047', '#38bdf8'],
      dragon_fire: ['#fde047', '#34d399', '#10b981', '#059669', '#a7f3d0'],
      aurora_borealis: ['#2dd4bf', '#34d399', '#38bdf8', '#c084fc', '#f472b6'],
      supernova_burst: ['#ffffff', '#fde047', '#ff007f', '#00f2fe', '#a855f7'],
      quantum_prism: ['#39ff14', '#00f2fe', '#a855f7', '#ffffff', '#fde047']
    };

    const pal = paletteByFx[fx] || paletteByFx.solar_inferno;
    for (let i = 0; i < count; i++) {
      const p = this.particles.spawnParticle();
      if (!p) break;

      const isRising = (fx === 'solar_inferno' || fx === 'dragon_fire' || fx === 'aurora_borealis');
      const angle = isRising
        ? (-Math.PI / 2 + (Math.random() - 0.5) * 1.35)
        : (Math.random() * Math.PI * 2);
      const speed = 95 + Math.random() * 250;

      p.x = x + (Math.random() - 0.5) * 20;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - (isRising ? 75 : 30);
      p.gravity = isRising ? -95 : (fx === 'grand_fireworks' || fx === 'asteroid_impact' ? 280 : 45);
      p.drag = 0.94;
      p.radius = 2.6 + Math.random() * 4.2;
      p.color = pal[i % pal.length];
      p.alpha = 1.0;
      p.decay = 2.1 + Math.random() * 1.2;
      p.type = (i % 2 === 0) ? 'glitter_star' : 'diamond_spark';
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 12;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    if (fx === 'zeus_lightning' || fx === 'cyber_neon' || fx === 'supernova_burst') {
      const w = this.width || 360;
      const h = this.height || 740;
      this.particles.spawnLightningArc(x + (Math.random() - 0.5) * 90, h * 0.16, x, y, pal[1]);
      this.particles.spawnLightningArc(x - 65, y - 35, x + 65, y - 10, pal[2]);
    }
  }

  setActiveEffect(effectId) {
    this.activeEffect = this.normalizeEffectId(effectId);
    localStorage.setItem('beatstar_active_effect', this.activeEffect);
  }

  initCustomBackground() {
    try {
      const rawData = typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_custom_bg_data') : null;
      if (rawData) {
        if (rawData.startsWith('data:video') || rawData.endsWith('.mp4') || rawData.endsWith('.webm')) {
          this.setCustomBackground(rawData, 'video', this.customBgMode, this.customBgOpacity);
        } else {
          this.setCustomBackground(rawData, 'image', this.customBgMode, this.customBgOpacity);
        }
      }
    } catch (e) {
      console.warn('Could not load custom background from storage:', e);
    }
  }

  setCustomBackground(mediaSource, mediaType = 'image', mode = null, opacity = null) {
    if (mode !== undefined && mode !== null) {
      this.customBgMode = mode;
      localStorage.setItem('beatstar_bg_mode', mode);
    }
    if (opacity !== undefined && opacity !== null) {
      this.customBgOpacity = parseFloat(opacity) || 0.40;
      localStorage.setItem('beatstar_bg_opacity', this.customBgOpacity.toString());
    }

    if (mediaSource !== undefined && mediaSource !== null) {
      if (mediaSource === '' || mediaSource === 'none') {
        if (this.customBgVideo) {
          try { this.customBgVideo.pause(); } catch(e) {}
          this.customBgVideo = null;
        }
        this.customBgMedia = null;
        this.customBgMediaType = null;
        localStorage.removeItem('beatstar_custom_bg_data');
      } else if (mediaType === 'video' || (typeof mediaSource === 'string' && (mediaSource.startsWith('data:video') || mediaSource.includes('.mp4') || mediaSource.includes('.webm') || (mediaSource.startsWith('blob:') && mediaType !== 'image')))) {
        // HTML5 Video Element
        if (!this.customBgVideo) {
          this.customBgVideo = document.createElement('video');
          this.customBgVideo.muted = true;
          this.customBgVideo.defaultMuted = true;
          this.customBgVideo.loop = true;
          this.customBgVideo.playsInline = true;
          this.customBgVideo.setAttribute('muted', '');
          this.customBgVideo.setAttribute('playsinline', '');
          this.customBgVideo.setAttribute('webkit-playsinline', '');
          this.customBgVideo.autoplay = true;
        }
        if (typeof mediaSource === 'string' && (mediaSource.startsWith('http://') || mediaSource.startsWith('https://'))) {
          this.customBgVideo.crossOrigin = 'anonymous';
        } else {
          this.customBgVideo.removeAttribute('crossOrigin');
        }
        this.customBgVideo.src = mediaSource;
        this.customBgVideo.load();
        const p = this.customBgVideo.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        this.customBgMedia = this.customBgVideo;
        this.customBgMediaType = 'video';
      } else {
        // HTML Image Element
        if (this.customBgVideo) {
          try { this.customBgVideo.pause(); } catch(e) {}
          this.customBgVideo = null;
        }
        const img = new Image();
        if (typeof mediaSource === 'string' && (mediaSource.startsWith('http://') || mediaSource.startsWith('https://'))) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          this.customBgMedia = img;
          this.customBgMediaType = 'image';
        };
        img.src = mediaSource;
        this.customBgMedia = img;
        this.customBgMediaType = 'image';
      }
    }
  }

  setCustomBgTransform(cropX = 0.5, cropY = 0.5, zoom = 1.0, fit = 'cover') {
    this.customBgCropX = Math.max(0, Math.min(1, parseFloat(cropX) ?? 0.5));
    this.customBgCropY = Math.max(0, Math.min(1, parseFloat(cropY) ?? 0.5));
    this.customBgZoom = Math.max(0.5, Math.min(3.0, parseFloat(zoom) ?? 1.0));
    this.customBgFit = fit || 'cover';
    localStorage.setItem('beatstar_bg_crop_x', this.customBgCropX.toString());
    localStorage.setItem('beatstar_bg_crop_y', this.customBgCropY.toString());
    localStorage.setItem('beatstar_bg_crop_zoom', this.customBgZoom.toString());
    localStorage.setItem('beatstar_bg_fit', this.customBgFit);
  }

  drawCoverMedia(ctx, media, targetW, targetH) {
    if (!media) return;
    let mw = 0;
    let mh = 0;
    if (media instanceof HTMLVideoElement) {
      mw = media.videoWidth;
      mh = media.videoHeight;
      if (media.paused && !media.ended) {
        media.play().catch(() => {});
      }
    } else if (media instanceof HTMLImageElement) {
      mw = media.naturalWidth || media.width;
      mh = media.naturalHeight || media.height;
    }
    if (!mw || !mh) return;

    const fit = this.customBgFit || 'cover';
    const zoom = Math.max(0.5, Math.min(3.0, this.customBgZoom || 1.0));
    const cropX = (this.customBgCropX !== undefined) ? this.customBgCropX : 0.5;
    const cropY = (this.customBgCropY !== undefined) ? this.customBgCropY : 0.5;

    let baseScale = (fit === 'contain') 
      ? Math.min(targetW / mw, targetH / mh)
      : Math.max(targetW / mw, targetH / mh);

    const scale = baseScale * zoom;
    const sw = mw * scale;
    const sh = mh * scale;

    const dx = (targetW - sw) * cropX;
    const dy = (targetH - sh) * cropY;

    ctx.drawImage(media, dx, dy, sw, sh);
  }

  setPCKeybind(lane, key) {
    if (lane >= 0 && lane <= 2 && key) {
      this.pcKeybinds[lane] = key.toLowerCase();
      localStorage.setItem('beatstar_pc_keybinds', JSON.stringify(this.pcKeybinds));
    }
  }

  addReactiveBurst(lane, x, y, color = '#00f2fe') {
    const hitX = (x !== undefined && x !== null) ? x : (lane + 0.5) * this.laneWidth;
    const hitY = (y !== undefined && y !== null) ? y : this.hitLineY;
    this.bgBursts.push({
      type: 'reactive_reveal',
      lane,
      x: hitX,
      y: hitY,
      radius: 40,
      maxRadius: Math.max(this.width, this.height) * 0.75,
      alpha: 1.0,
      decay: 1.6,
      color: color || '#00f2fe'
    });
    // Boost reactive ambient light: more hits = brighter scene!
    this.reactiveLightBoost = Math.min(1.0, (this.reactiveLightBoost || 0) + 0.22);
    this.lastHitColor = color || '#00f2fe';
  }

  triggerScreenShake(intensity = 2.0, durationMs = 50) {
    // Vibración visual de pantalla desactivada para evitar que la pista tiemble al pulsar 2 teclas a la vez
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }

  setJudgeColors(colors) {
    this.judgeColors = Object.assign(this.judgeColors || {}, colors);
    this._laneTapGradCache = null;
    this._judgementSpriteCache = null;
    localStorage.setItem('beatstar_judge_colors', JSON.stringify(this.judgeColors));
  }

  setLatencyOffset(offsetMs) {
    this.latencyOffsetMs = parseInt(offsetMs, 10) || 0;
    localStorage.setItem('beatstar_offset', this.latencyOffsetMs.toString());
  }

  setContinueMode(enabled) {
    this.continueMode = !!enabled;
    localStorage.setItem('beatstar_continue_mode', this.continueMode.toString());
  }

  setNoteSpeedMultiplier(multiplier) {
    this.noteSpeedMultiplier = parseFloat(multiplier) || 1.0;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beatstar_note_speed', this.noteSpeedMultiplier.toString());
    }
    const base = this.baseScrollDurationMs || 1400;
    const mult = Math.max(0.7, Math.min(2.0, this.noteSpeedMultiplier || 1.0));
    this.scrollDurationMs = Math.round(base / mult);
  }

  setSongPlaybackSpeed(speed) {
    const s = Math.max(0.5, Math.min(2.0, parseFloat(speed) || 1.0));
    this.songPlaybackRate = s;
    if (this.sync) {
      this.sync.setPlaybackRate(s);
    }
    if (this.audioSync && this.audioSync !== this.sync) {
      this.audioSync.setPlaybackRate(s);
    }
  }

  initCanvasSize() {
    const rect = (this.canvas && this.canvas.getBoundingClientRect) ? this.canvas.getBoundingClientRect() : { left: 0, top: 0, right: 360, bottom: 640, width: 360, height: 640 };
    const viewport = typeof document !== 'undefined' ? document.querySelector('.game-viewport') : null;
    const vpRect = (viewport && viewport.getBoundingClientRect) ? viewport.getBoundingClientRect() : null;

    this.width = rect.width || (vpRect ? vpRect.width : 0) || (typeof window !== 'undefined' ? window.innerWidth : 360) || 360;
    this.height = rect.height || (vpRect ? vpRect.height : 0) || (typeof window !== 'undefined' ? window.innerHeight : 640) || 640;
    this._canvasRect = (rect && rect.width > 0) ? rect : (vpRect && vpRect.width > 0 ? vpRect : { left: 0, top: 0, right: this.width, bottom: this.height, width: this.width, height: this.height });
    this.numLanes = 3;
    this.laneWidth = this.width / 3;
    this.hitLineY = this.height * 0.82;

    // Constantes precalculadas para proyección cónica 3D (Zero-GC en renderNotes y getLaneBoundaryX)
    this._perspHorizonY = 12;
    this._perspHitY = this.hitLineY;
    this._perspSpanY = Math.max(1, this._perspHitY - this._perspHorizonY);
    this._perspInvSpanY = 1.0 / this._perspSpanY;
    this._perspMidX = this.width * 0.5;
    this._perspBaseLaneW = (this.width * 0.94) / 3;

    // ⚡ OPTIMIZADO PARA 120 FPS ESTABLES: DPR 1.5 en móviles (ahorra 44% de fill-rate de GPU manteniendo nitidez Retina)
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const dprCap = isMobile ? 1.5 : 2.0;
    this.dpr = Math.min(window.devicePixelRatio || 1, dprCap);

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    if (this.ctx) {
      if (typeof this.ctx.setTransform === 'function') {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      this.ctx.scale(this.dpr, this.dpr);
    }

    // Degradado 3D nacarado de alta gama para la autopista blanca con volumen tridimensional real
    const horizonY = 12;
    const bottomY = this.height + 30;
    this._trackGrad = this.ctx.createLinearGradient(this.width / 2, horizonY, this.width / 2, bottomY);
    this._trackGrad.addColorStop(0.00, '#64748b');
    this._trackGrad.addColorStop(0.08, '#94a3b8');
    this._trackGrad.addColorStop(0.18, '#cbd5e1');
    this._trackGrad.addColorStop(0.32, '#e2e8f0');
    this._trackGrad.addColorStop(0.50, '#f1f5f9');
    this._trackGrad.addColorStop(0.70, '#f8fafc');
    this._trackGrad.addColorStop(0.86, '#ffffff');
    this._trackGrad.addColorStop(1.00, '#dbeafe');

    // Sombra atmosférica 3D suavemente difuminada al final de la pista (horizonte) sin bloques negros
    const shadowEnd = horizonY + (this.hitLineY - horizonY) * 0.30;
    this._trackHorizonShadowGrad = this.ctx.createLinearGradient(0, horizonY, 0, shadowEnd);
    this._trackHorizonShadowGrad.addColorStop(0.00, 'rgba(6, 8, 20, 0.84)');
    this._trackHorizonShadowGrad.addColorStop(0.16, 'rgba(8, 12, 28, 0.62)');
    this._trackHorizonShadowGrad.addColorStop(0.36, 'rgba(12, 18, 40, 0.38)');
    this._trackHorizonShadowGrad.addColorStop(0.60, 'rgba(16, 25, 52, 0.16)');
    this._trackHorizonShadowGrad.addColorStop(0.82, 'rgba(20, 32, 64, 0.05)');
    this._trackHorizonShadowGrad.addColorStop(1.00, 'rgba(20, 32, 64, 0.00)');

    // Brillo especular cilíndrico 3D sobre la pista con oclusión suave en los bordes laterales
    this._trackEdgeShadowGrad = this.ctx.createLinearGradient(0, 0, this.width, 0);
    this._trackEdgeShadowGrad.addColorStop(0.00, 'rgba(51, 65, 85, 0.32)');
    this._trackEdgeShadowGrad.addColorStop(0.14, 'rgba(100, 116, 139, 0.12)');
    this._trackEdgeShadowGrad.addColorStop(0.30, 'rgba(255, 255, 255, 0.08)');
    this._trackEdgeShadowGrad.addColorStop(0.50, 'rgba(255, 255, 255, 0.45)');
    this._trackEdgeShadowGrad.addColorStop(0.70, 'rgba(255, 255, 255, 0.08)');
    this._trackEdgeShadowGrad.addColorStop(0.86, 'rgba(100, 116, 139, 0.12)');
    this._trackEdgeShadowGrad.addColorStop(1.00, 'rgba(51, 65, 85, 0.32)');

    // Degradados de fondo cacheados (evita crearlos 120 veces por segundo)
    const h = this.height;
    const bgStops = [
      [[0.0, '#060310'], [0.45, '#0e0920'], [0.80, '#181030'], [1.0, '#0e081e']],
      [[0.0, '#0d0716'], [0.40, '#221509'], [0.75, '#361d0d'], [1.0, '#180d07']],
      [[0.0, '#140324'], [0.40, '#32063e'], [0.75, '#500a5e'], [1.0, '#240430']],
      [[0.0, '#031224'], [0.40, '#082d4f'], [0.75, '#0c4472'], [1.0, '#061e35']],
      [[0.0, '#100322'], [0.35, '#2b0846'], [0.70, '#4a116d'], [1.0, '#220836']]
    ];
    this._bgGrads = [];
    for (let m = 0; m < 5; m++) {
      const g = this.ctx.createLinearGradient(0, 0, 0, h);
      for (let s = 0; s < bgStops[m].length; s++) {
        g.addColorStop(bgStops[m][s][0], bgStops[m][s][1]);
      }
      this._bgGrads[m] = g;
    }

    // Invalidar sprites precompilados (cambia el tamaño del canvas)
    this._hitSprites = null;
    this._hitSpriteSocket = null;
    this._hitSpriteKeyIdle = null;
    this._hitSpriteKeyPressed = null;
    this._laneFloodGradCache = {};

    // Caché de font strings (Zero-GC: elimina template literal + Skia re-parse por nota)
    this._fontCache = {};
    for (let s = 11; s <= 30; s++) {
      this._fontCache[s] = `900 ${s}px Montserrat, -apple-system, sans-serif`;
    }

    // Caché de geometría para sideGrad de renderLanes (evita createLinearGradient por frame)
    this._sideGradGeom = { horizonY: 12, bottomY: this.height + 30 };
    this._sideGradCache = null;
    this._sideGradHue = -1;
  }

  bindEvents() {
    if (this._touchBound) return;
    this._touchBound = true;

    window.addEventListener('resize', () => this.initCanvasSize());

    // ⚡ ENTRADA TÁCTIL (TOUCH) A NIVEL DE VENTANA SIN REFLOWS DE DOM NI GESTURE DELAY
    window.addEventListener('touchstart', (e) => {
      if (this.isPaused || this.isRewinding) return;
      const targetEl = e.target;
      const isUiTap = targetEl && targetEl !== this.canvas && targetEl.closest &&
        (targetEl.closest('.hud-pause-btn') || targetEl.closest('button') || targetEl.closest('.modal-overlay'));
      if (isUiTap) return;

      if (this.isRunning && e.cancelable) {
        e.preventDefault();
      }

      const now = performance.now();
      this.lastTouchTime = now;
      let rect = this._canvasRect;
      if (!rect || rect.width <= 0) {
        rect = this.canvas.getBoundingClientRect();
        this._canvasRect = rect;
      }
      if (!rect || rect.width <= 0) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.clientX < rect.left || t.clientX > rect.right) continue;

        const normX = (t.clientX - rect.left) / rect.width;
        const lane = Math.max(0, Math.min(2, (normX * 3) | 0));

        // Guardar origen de toque para el cálculo del swipe
        this.activeTouches.set(t.identifier, {
          startX: t.clientX,
          startY: t.clientY,
          startTime: now,
          lane: lane,
          swiped: false
        });

        this.triggerLaneInput(lane, 'tap', null, t.identifier);
      }
    }, { passive: false });

    // ⚡ DETECCIÓN DE DESLIZAMIENTO / FLICK (SWIPE)
    window.addEventListener('touchmove', (e) => {
      if (this.isPaused || this.isRewinding) return;
      const now = performance.now();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const tData = this.activeTouches.get(t.identifier);
        if (!tData || tData.swiped) continue;

        const dx = t.clientX - tData.startX;
        const dy = t.clientY - tData.startY;
        const distSq = dx * dx + dy * dy;
        const elapsed = now - tData.startTime;

        // Umbral de activación natural de swipe (18px -> 324px² en menos de 500ms)
        if (distSq > 324 && elapsed < 500) {
          let direction = 'up';
          if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left';
          } else {
            direction = dy > 0 ? 'down' : 'up';
          }

          tData.swiped = true;
          this.triggerLaneInput(tData.lane, 'swipe', direction, t.identifier);
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      const rect = this._canvasRect;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const tData = this.activeTouches.get(t.identifier);
        if (tData) {
          this.releaseLaneHold(tData.lane, t.identifier);
          this.activeTouches.delete(t.identifier);
        } else if (rect && rect.width > 0) {
          const normX = (t.clientX - rect.left) / rect.width;
          const lane = Math.max(0, Math.min(2, (normX * 3) | 0));
          this.releaseLaneHold(lane, t.identifier);
        }
      }
    }, { passive: true });

    window.addEventListener('touchcancel', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const tData = this.activeTouches.get(t.identifier);
        if (tData) {
          this.releaseLaneHold(tData.lane, t.identifier);
          this.activeTouches.delete(t.identifier);
        }
      }
    }, { passive: true });

    // ⚡ RATÓN PC CON SOPORTE DE ARRASTRE PARA SWIPE
    window.addEventListener('mousedown', (e) => {
      if (performance.now() - (this.lastTouchTime || 0) < 500) return;
      if (this.isPaused || this.isRewinding) return;

      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target && (target.closest('.hud-pause-btn') || target.closest('button') || target.closest('.modal-overlay'))) {
        return;
      }

      const rect = this.canvas.getBoundingClientRect();
      if (!rect || rect.width <= 0) return;
      if (e.clientX < rect.left || e.clientX > rect.right) return;

      const normX = (e.clientX - rect.left) / rect.width;
      const lane = Math.max(0, Math.min(2, Math.floor(normX * 3)));

      this.mouseTouch = {
        startX: e.clientX,
        startY: e.clientY,
        startTime: performance.now(),
        lane: lane,
        swiped: false
      };

      this.triggerLaneInput(lane, 'tap', null, 'mouse');
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.mouseTouch || this.mouseTouch.swiped || this.isPaused || this.isRewinding) return;
      const dx = e.clientX - this.mouseTouch.startX;
      const dy = e.clientY - this.mouseTouch.startY;
      const dist = Math.hypot(dx, dy);
      const elapsed = performance.now() - this.mouseTouch.startTime;

      if (dist > 18 && elapsed < 500) {
        let direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        this.mouseTouch.swiped = true;
        this.triggerLaneInput(this.mouseTouch.lane, 'swipe', direction, 'mouse');
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.mouseTouch) {
        this.releaseLaneHold(this.mouseTouch.lane, 'mouse');
        this.mouseTouch = null;
      }
    });

    // ⚡ TECLADO PC (D, F, J y Flechas para Swipe)
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (!this.isCalibrating && this.beatmapData) {
          if (this.isPaused) {
            if (this.ui.onResume) this.ui.onResume();
          } else {
            if (this.ui.onTogglePause) this.ui.onTogglePause();
          }
          return;
        }
      }
      if (this.isPaused || this.isRewinding || this.isCountingDown) return;

      const k = (e.key || '').toLowerCase();
      const kb = this.pcKeybinds || { 0: 'd', 1: 'f', 2: 'j' };

      if (k === (kb[0] || 'd') || k === 'a' || k === '1') this.triggerLaneInput(0, 'tap');
      else if (k === (kb[1] || 'f') || k === 's' || k === ' ' || k === '2') this.triggerLaneInput(1, 'tap');
      else if (k === (kb[2] || 'j') || k === 'k' || k === '3') this.triggerLaneInput(2, 'tap');

      const handleArrowSwipe = (dir) => {
        const currentTime = this.getCurrentGameTimeMs(this._frameNow);
        let targetLane = -1;
        let bestDiff = Infinity;
        if (Array.isArray(this.notes)) {
          const startIdx = Math.max(0, (this.firstActiveNoteIndex || 0) - 2);
          for (let i = startIdx; i < this.notes.length; i++) {
            const n = this.notes[i];
            if (!n || n.hit || n.missed || n.holdCompleted || n.holding) continue;
            if (n.timestamp_ms - currentTime > 400) break;
            const diff = currentTime - n.timestamp_ms;
            const absDiff = Math.abs(diff);
            if (absDiff <= 340 && n.type === 'swipe' && (!n.direction || n.direction === dir)) {
              if (absDiff < bestDiff) {
                bestDiff = absDiff;
                targetLane = n.lane;
              }
            }
          }
        }
        if (targetLane === -1) {
          targetLane = (dir === 'left' ? 0 : dir === 'right' ? 2 : 1);
        }
        this.triggerLaneInput(targetLane, 'swipe', dir);
      };

      if (e.key === 'ArrowLeft') handleArrowSwipe('left');
      else if (e.key === 'ArrowRight') handleArrowSwipe('right');
      else if (e.key === 'ArrowUp') handleArrowSwipe('up');
      else if (e.key === 'ArrowDown') handleArrowSwipe('down');
    });

    window.addEventListener('keyup', (e) => {
      if (this.isPaused || this.isRewinding || this.isCountingDown) return;
      const k = (e.key || '').toLowerCase();
      const kb = this.pcKeybinds || { 0: 'd', 1: 'f', 2: 'j' };

      if (k === (kb[0] || 'd') || k === 'a' || k === '1') this.releaseLaneHold(0);
      else if (k === (kb[1] || 'f') || k === 's' || k === ' ' || k === '2') this.releaseLaneHold(1);
      else if (k === (kb[2] || 'j') || k === 'k' || k === '3') this.releaseLaneHold(2);
    });
  }

  /**
   * Calculates optimal scroll duration (ms) based on difficulty stars and note density.
   * Tailored for realistic rhythm gameplay: higher difficulty provides faster scroll & wider note separation.
   */
  /**
   * Calculates optimal scroll duration (ms) based on difficulty stars.
   * Proporciona una variación tangible y palpable de velocidad según dificultad:
   * 1★: ~1700ms | 2.5★: ~1500ms | 3.5★: ~1360ms | 5★: ~1160ms | 7★+: ~890ms
   */
  computeDynamicScrollDuration(stars, rawNotes = []) {
    // Curva equilibrada optimizada para 120 FPS ultra fluidos sin tirones ni pixel skipping
    const s = Math.max(1.0, Math.min(10.0, parseFloat(stars) || 3.5));
    const duration = Math.round(1550 - (s - 1.0) * 45);
    return Math.max(1150, Math.min(1650, duration));
  }

  computeMaxPossibleScore(notes) {
    if (!notes || notes.length === 0) return 1;
    let simCombo = 0;
    let simScore = 0;
    for (const n of notes) {
      simCombo++;
      let mult = 1;
      if (simCombo >= 100) mult = 5;
      else if (simCombo >= 50) mult = 4;
      else if (simCombo >= 25) mult = 3;
      else if (simCombo >= 10) mult = 2;

      let basePts = 450;
      if (n.type === 'hold') {
        const durationSec = Math.max(0.15, ((n.duration_ms || 600) / 1000));
        basePts = 450 + Math.round(260 * durationSec);
      }
      simScore += basePts * mult;
    }
    return Math.max(1, simScore);
  }

  loadBeatmap(beatmapData, audioBlobOrUrl = null) {
    this.visualDimension = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_visual_dimension') : null) || '3d';
    this.keyStyle = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_key_style') : null) || 'beatstar_large';
    this.isCalibrating = false;
    this.beatmapData = beatmapData;
    this.activeSongPalette = (typeof getSongColorPalette === 'function') ? getSongColorPalette(beatmapData.metadata || beatmapData) : SONG_COLOR_PALETTES.classic;
    this._hitSpriteSocket = null; // el palette cambió → regenerar con el color nuevo
    if (this.ui && typeof this.ui.onSongLoaded === 'function') {
      this.ui.onSongLoaded(beatmapData.metadata || beatmapData, this.activeSongPalette);
    }
    this.currentAudioSource = audioBlobOrUrl || (beatmapData && beatmapData.audio_blob_url) || null;
    this.numLanes = 3;
    this.laneGlows = [0, 0, 0];
    this.fxRipples = [];
    this.bgBursts = [];
    this.musicalNotes = [];
    this.initCanvasSize();

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.particles) {
      this.particles.reset();
    }
    this.flyingLyrics = [];
    this._lastCurLyricIndex = -1;
    if (typeof document !== 'undefined') {
      const curEl = document.getElementById('karaokeCurrentLine');
      if (curEl) curEl.innerHTML = '';
    }
    if (beatmapData && beatmapData.activeKaraokeLyrics && beatmapData.activeKaraokeLyrics.length > 0) {
      this.activeKaraokeLyrics = beatmapData.activeKaraokeLyrics;
    } else if (beatmapData && (beatmapData.lyrics || (beatmapData.metadata && beatmapData.metadata.lyrics))) {
      const bLyrics = beatmapData.lyrics || beatmapData.metadata.lyrics;
      if (typeof window !== 'undefined' && typeof window.parseTopLevelLyrics === 'function') {
        this.activeKaraokeLyrics = window.parseTopLevelLyrics(bLyrics);
        beatmapData.activeKaraokeLyrics = this.activeKaraokeLyrics;
      } else {
        this.activeKaraokeLyrics = [];
      }
    } else if (!this.activeKaraokeLyrics) {
      this.activeKaraokeLyrics = [];
    }

    // Extract real BPM and Beat Grid Offset
    this.bpm = Number.isFinite(beatmapData.metadata?.bpm) ? beatmapData.metadata.bpm : (Number.isFinite(beatmapData.bpm) ? beatmapData.bpm : 120);
    const beatDurationMs = 60000 / (this.bpm || 120);
    const firstRawTime = (beatmapData.notes && beatmapData.notes.length > 0)
      ? (Number.isFinite(beatmapData.notes[0].timestamp_ms)
          ? beatmapData.notes[0].timestamp_ms
          : (Number.isFinite(beatmapData.notes[0].timeMs)
              ? beatmapData.notes[0].timeMs
              : (Number.isFinite(beatmapData.notes[0].time) ? (beatmapData.notes[0].time > 100 ? beatmapData.notes[0].time : beatmapData.notes[0].time * 1000) : 0)))
      : 0;
    this.firstBeatOffsetMs = Number.isFinite(firstRawTime)
      ? (((firstRawTime % beatDurationMs) + beatDurationMs) % beatDurationMs)
      : 0;

    // Explicitly reset all game state flags
    this.isRunning = false;
    this.isPaused = true;
    this.isCountingDown = true;
    this.isGameOver = false;
    this.isInitialLaunch = true;
    this.isRewinding = false;
    this.isProcessingMiss = false;
    this.missHighlight = null;
    this.lastMissTimePerf = 0;
    this.lastFailSongTimeSec = 0;

    // Extracción robusta y priorizada de estrellas de dificultad
    let diffStars = null;
    const dNameRaw = ((beatmapData.metadata?.difficulty_name || beatmapData.difficulty_name || '') + '');
    const starMatch = dNameRaw.match(/([0-9]+(?:\.[0-9]+)?)\s*★/);
    if (starMatch) {
      diffStars = parseFloat(starMatch[1]);
    }

    if (diffStars === null || !Number.isFinite(diffStars)) {
      if (Number.isFinite(beatmapData.selectedStars)) {
        diffStars = beatmapData.selectedStars;
      } else if (Number.isFinite(beatmapData.metadata?.stars) && beatmapData.metadata.stars !== 3.5) {
        diffStars = beatmapData.metadata.stars;
      } else if (Number.isFinite(beatmapData.stars) && beatmapData.stars !== 3.5) {
        diffStars = beatmapData.stars;
      } else if (Number.isFinite(beatmapData.difficulties?.[0]?.stars)) {
        diffStars = beatmapData.difficulties[0].stars;
      } else if (Number.isFinite(beatmapData.metadata?.stars)) {
        diffStars = beatmapData.metadata.stars;
      } else if (Number.isFinite(beatmapData.stars)) {
        diffStars = beatmapData.stars;
      }
    }

    // Inferencia por palabra clave si aún es nulo o 3.5 por defecto
    if (diffStars === null || diffStars === 3.5) {
      const dName = dNameRaw.toLowerCase();
      if (dName.includes('fácil') || dName.includes('easy') || dName.includes('beginner')) {
        diffStars = 1.5;
      } else if (dName.includes('media') || dName.includes('medium') || dName.includes('normal')) {
        diffStars = 3.5;
      } else if (dName.includes('difícil') || dName.includes('hard')) {
        diffStars = 5.5;
      } else if (dName.includes('extrema') || dName.includes('extreme') || dName.includes('expert')) {
        diffStars = 7.5;
      } else if (dName.includes('insana') || dName.includes('insane') || dName.includes('master')) {
        diffStars = 9.5;
      } else {
        diffStars = diffStars || 3.5;
      }
    }

    // Pass notes through LaneRemapper.sanitizeForTwoFingers to guarantee 2-finger compliance & density limit
    const rawNotes = (beatmapData && Array.isArray(beatmapData.notes)) ? beatmapData.notes.map((n, idx) => {
      let rawT = Number.isFinite(n.timestamp_ms)
        ? n.timestamp_ms
        : (Number.isFinite(n.timeMs)
            ? n.timeMs
            : (Number.isFinite(n.timestamp) ? n.timestamp : (Number.isFinite(n.time) ? (n.time > 100 ? n.time : n.time * 1000) : idx * 500)));
      if (!Number.isFinite(rawT)) rawT = idx * 500;
      rawT = Math.round(rawT);

      let rawDur = Number.isFinite(n.duration_ms)
        ? n.duration_ms
        : (Number.isFinite(n.holdDuration)
            ? (n.holdDuration > 50 ? n.holdDuration : n.holdDuration * 1000)
            : (Number.isFinite(n.duration) ? (n.duration > 50 ? n.duration : n.duration * 1000) : 0));
      if (!Number.isFinite(rawDur) || rawDur < 0) rawDur = 0;
      rawDur = Math.round(rawDur);

      const laneVal = Math.max(0, Math.min(2, parseInt(n.lane ?? n.column ?? n.track ?? 0, 10) || 0));
      const isHold = n.type === 'hold' || n.type === 'long' || rawDur > 0;
      const typeStr = isHold ? 'hold' : ((n.type === 'swipe' || n.type === 'slide') ? 'swipe' : 'tap');

      return {
        ...n,
        id: n.id !== undefined ? n.id : idx,
        lane: laneVal,
        column: laneVal,
        track: laneVal,
        type: typeStr,
        time: rawT / 1000,
        timeMs: rawT,
        timestamp_ms: rawT,
        duration_ms: rawDur,
        holdDuration: rawDur / 1000,
        end_timestamp_ms: isHold ? (rawT + Math.max(150, rawDur)) : null,
        lyric: (n.lyric !== undefined && n.lyric !== null && n.lyric !== '') ? n.lyric : (n.text || n.syllable || n.word || n.l || n.w || null),
        wordIdx: n.wordIdx !== undefined ? n.wordIdx : null,
        lineIdx: n.lineIdx !== undefined ? n.lineIdx : null,
        isInstrumental: Boolean(n.isInstrumental || n.is_instrumental || n.isInst)
      };
    }) : [];

    rawNotes.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    // Bypass difficulty thinning & note-altering algorithms for all community / editor maps
    const isCommunity = !!(
      this.beatmapData.is_community || 
      this.beatmapData.isCommunity ||
      this.beatmapData.source === 'community' ||
      this.beatmapData.source === 'custom' ||
      this.beatmapData.source_name === 'Comunidad' || 
      this.beatmapData.source_name === 'Mi Creación' ||
      (this.beatmapData.metadata && (
        this.beatmapData.metadata.is_community || 
        this.beatmapData.metadata.isCommunity || 
        this.beatmapData.metadata.source === 'community' ||
        this.beatmapData.metadata.source === 'custom' ||
        this.beatmapData.metadata.source_name === 'Comunidad' ||
        this.beatmapData.metadata.source_name === 'Mi Creación'
      )) ||
      window.isPlaytestingFromEditor
    );

    const isStormActive = Boolean(this.isStormModeActive || (typeof window !== 'undefined' && window.isStormModeActive));
    const baseDensityMode = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_map_density') : null) || 'hard';
    const densityMode = (isStormActive && baseDensityMode === 'hard') ? 'extreme' : baseDensityMode;
    const effectiveStars = isStormActive ? Math.min(10.0, (diffStars || 3.5) + 1.2) : diffStars;
    const sanitizedNotes = (!isCommunity && typeof LaneRemapper !== 'undefined' && LaneRemapper.sanitizeForTwoFingers)
      ? LaneRemapper.sanitizeForTwoFingers(rawNotes, this.bpm, effectiveStars, densityMode)
      : rawNotes;

    // Set dynamic base scroll duration based on difficulty stars curve
    const baseScroll = this.computeDynamicScrollDuration(effectiveStars, sanitizedNotes);
    this.baseScrollDurationMs = baseScroll;

    // Apply the active note speed multiplier to the dynamic scroll duration (+12% velocidad eléctrica en Modo Tormenta)
    const speedMult = Math.max(0.5, Math.min(2.5, this.noteSpeedMultiplier || 1.0)) * (isStormActive ? 1.12 : 1.0);
    this.scrollDurationMs = Math.round(baseScroll / speedMult);
    console.log(`[BeatstarEngine] Diff: ${effectiveStars}★ ("${dNameRaw}") | BaseScroll: ${baseScroll}ms | Mult: ${speedMult}x -> Final: ${this.scrollDurationMs}ms`);

    // Apply custom song playback rate if provided
    const songRate = Math.max(0.5, Math.min(2.0, parseFloat(this.beatmapData.songPlaybackSpeed) || 1.0));
    this.setSongPlaybackSpeed(songRate);

    // Sanitización y de-duplicación estricta cronológica para evitar notas solapadas en el mismo carril
    const sortedCandidateNotes = [...sanitizedNotes].sort((a, b) => {
      const tA = Number.isFinite(a.timestamp_ms) ? a.timestamp_ms : (a.timeMs || (a.time * 1000) || 0);
      const tB = Number.isFinite(b.timestamp_ms) ? b.timestamp_ms : (b.timeMs || (b.time * 1000) || 0);
      return tA - tB;
    });

    // Eliminar cualquier nota prematura (< 1600ms) para que nunca aparezcan notas antes de que arranque la canción
    let notesPool = sortedCandidateNotes.filter(n => {
      const t = Number.isFinite(n.timestamp_ms) ? n.timestamp_ms : (n.timeMs || (n.time * 1000) || 0);
      return t >= 1600;
    });
    if (notesPool.length === 0 && sortedCandidateNotes.length > 0) {
      const firstT = sortedCandidateNotes[0].timestamp_ms || sortedCandidateNotes[0].timeMs || 0;
      const shift = 1600 - firstT;
      notesPool = sortedCandidateNotes.map(n => {
        const origT = Number.isFinite(n.timestamp_ms) ? n.timestamp_ms : (n.timeMs || (n.time * 1000) || 0);
        const newT = origT + shift;
        return {
          ...n,
          timestamp_ms: newT,
          timeMs: newT,
          time: newT / 1000
        };
      });
    }

    const cleanedNotes = [];
    const lastLaneHitTime = [-Infinity, -Infinity, -Infinity];

    for (const n of notesPool) {
      const rawT = Number.isFinite(n.timestamp_ms) ? n.timestamp_ms : (n.timeMs || (n.time * 1000) || 0);
      const adjustedTime = Math.round(rawT);
      const laneVal = Math.max(0, Math.min(2, parseInt(n.lane ?? n.column ?? n.track ?? 0, 10) || 0));

      // Mantener todas las notas del beatmap sin descartar ninguna
      lastLaneHitTime[laneVal] = adjustedTime;

      let rawDur = Number.isFinite(n.duration_ms) ? n.duration_ms : (n.holdDuration ? n.holdDuration * 1000 : 0);
      if (!Number.isFinite(rawDur) || rawDur < 0) rawDur = 0;
      rawDur = Math.round(rawDur);

      // Micro-holds menores a 220ms se convierten en tap directo (en móvil un hold de 100ms es físicamente un tap)
      const isRealHold = (n.type === 'hold' || rawDur > 220) && rawDur > 220;
      let noteType = isRealHold ? 'hold' : (n.type === 'swipe' ? 'swipe' : 'tap');
      // Si se detecta que el jugador está en PC (teclado/ratón), convertir automáticamente swipes a notas normales de tap
      if (this.isPCMode && noteType === 'swipe') {
        noteType = 'tap';
      }
      const finalDur = isRealHold ? Math.max(220, rawDur) : 0;
      const adjustedEndTime = isRealHold ? (adjustedTime + finalDur) : null;

      cleanedNotes.push({
        ...n,
        id: n.id !== undefined ? n.id : cleanedNotes.length,
        lane: laneVal,
        column: laneVal,
        track: laneVal,
        type: noteType,
        time: adjustedTime / 1000,
        timeMs: adjustedTime,
        timestamp_ms: adjustedTime,
        duration_ms: finalDur,
        holdDuration: finalDur / 1000,
        end_timestamp_ms: adjustedEndTime,
        hit: false,
        holding: false,
        holdCompleted: false,
        missed: false,
        processed: false
      });
    }

    // Precalcular nextSameLaneDiffMs una sola vez para evitar loops anidados en cada frame de renderizado
    const cLen = cleanedNotes.length;
    for (let i = 0; i < cLen; i++) {
      const curN = cleanedNotes[i];
      let diff = Infinity;
      const maxJ = Math.min(cLen, i + 40);
      for (let j = i + 1; j < maxJ; j++) {
        const nextN = cleanedNotes[j];
        if (nextN.timestamp_ms - curN.timestamp_ms > 3000) break;
        if (nextN.lane === curN.lane && nextN.timestamp_ms > curN.timestamp_ms) {
          diff = nextN.timestamp_ms - curN.timestamp_ms;
          break;
        }
      }
      curN.nextSameLaneDiffMs = diff;
    }

    this.notes = cleanedNotes;
    // Si estamos en Modo Karaoke y tenemos letras, vincular o construir 1:1 desde las notas reales
    if (typeof window !== 'undefined' && window.isKaraokeModeActive) {
      if (this.activeKaraokeLyrics && this.activeKaraokeLyrics.length > 0) {
        if (typeof window.linkSyllablesToNotes === 'function') {
          window.linkSyllablesToNotes(this.notes, this.activeKaraokeLyrics);
        } else if (typeof window.linkExistingNotesToReconstructedLines === 'function') {
          window.linkExistingNotesToReconstructedLines(this.notes, this.activeKaraokeLyrics);
        }
        const teleBar = document.getElementById('karaokeTeleprompterBar');
        if (teleBar) teleBar.classList.remove('hidden');
      } else if (typeof window.buildLrcLinesFromExistingNotes === 'function') {
        const lines = window.buildLrcLinesFromExistingNotes(this.notes);
        if (lines && lines.length > 0) {
          this.activeKaraokeLyrics = lines;
          if (this.beatmapData) this.beatmapData.activeKaraokeLyrics = lines;
          const teleBar = document.getElementById('karaokeTeleprompterBar');
          if (teleBar) teleBar.classList.remove('hidden');
        }
      }
    }
    this.lastNoteTime = this.notes && this.notes.length > 0
      ? this.notes.reduce((max, n) => Math.max(max, n.end_timestamp_ms || n.timestamp_ms || 0), 0)
      : 0;

    this.firstActiveNoteIndex = 0;
    this.lastLitSyllableIndex = -1;
    // Pre-computar texto limpio de sílabas y pre-renderizar sprites de sílabas para Karaoke (0 rasterizado de fuentes en el render loop)
    if (!this._lyricKeySpriteCache) {
      this._lyricKeySpriteCache = new Map();
    }
    const isKaraokePrewarm = Boolean((typeof window !== 'undefined' && window.isKaraokeModeActive) || this.isKaraokeModeActive);
    const isMushPrewarm = Boolean((typeof window !== 'undefined' && window.isMushroomModeActive) || this.isMushroomModeActive);
    for (let i = 0, nLen = this.notes.length; i < nLen; i++) {
      const n = this.notes[i];
      if (n.lyric && !_PROLONG_RE.test(String(n.lyric))) {
        _HYPHEN_RE.lastIndex = 0;
        n._cleanLyric = String(n.lyric).replace(_HYPHEN_RE, '$1 $2').trim().toUpperCase();
        if (isKaraokePrewarm && n._cleanLyric) {
          this._getLyricKeySprite(n._cleanLyric, false);
        }
      } else {
        n._cleanLyric = null;
      }

      // En modo Setas Alucinógenas: asignar fase de oscilación de grosor/tamaño y salto travieso de carril (~30% de notas)
      n._mushPhase = (i * 1.41) % (Math.PI * 2);
      n._mushColorIdx = i % 4;
      const prevT = i > 0 ? (this.notes[i - 1].timestamp_ms ?? 0) : -9999;
      const nextT = i + 1 < nLen ? (this.notes[i + 1].timestamp_ms ?? 9999999) : 9999999;
      const curT = n.timestamp_ms ?? 0;
      if (isMushPrewarm && n.type !== 'hold' && (curT - prevT > 240) && (nextT - curT > 240) && (i % 3 === 1)) {
        n._mushFromLane = (n.lane + ((i % 2 === 0) ? 1 : 2)) % 3;
      } else {
        n._mushFromLane = n.lane;
      }
    }

    if ((typeof window !== 'undefined' && window.isStormModeActive) || this.isStormModeActive) {
      this.initStormModeAssets();
    }
    if (isMushPrewarm) {
      this.initMushroomModeAssets();
      this._mushFlipProgress = 0.0;
      this._mushTargetFlipped = false;
      this._mushNextFlipTimeMs = 9500;
      this._mushSafeGraceUntilMs = 0;
      this._mushBannerText = '🍄 ¡MODO SETAS ALUCINÓGENAS! 🍄';
      this._mushBannerTimer = 2.6;
    }
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.score = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.streakCount = 0;
    this.multiplier = 1;
    this.stars = 0;
    this.lastCelebratedStar = 0;
    this.currentMedalTier = null;
    this.missCount = 0;
    this.invulnerableUntil = 2400; // Invulnerable during startup grace period
    this.stats = { perfectPlus: 0, perfect: 0, great: 0, miss: 0 };
    this.timingStats = { count: 0, sumSignedMs: 0, sumAbsMs: 0, earlyCount: 0, lateCount: 0, exactCount: 0 };
    this.overdriveLevel = 0;
    this.overdriveFlash = 0;
    this._wasOverdrive = false;
    
    if (this.discoBall) {
      this.discoBall.active = false;
      this.discoBall.descendY = -120;
      this.discoBall.targetY = -120;
      this.discoBall.rotation = 0;
    }
    // Precalentamiento de audio synth y búferes para eliminar cualquier micro-lag en la primera tecla
    if (this.synth && typeof this.synth.ensureContext === 'function') {
      try { this.synth.ensureContext(); } catch (_) {}
    }
    if (!this.borderEqLeftSurges) this.borderEqLeftSurges = new Float32Array(16);
    if (!this.borderEqRightSurges) this.borderEqRightSurges = new Float32Array(16);
    this.borderEqLeftSurges.fill(0);
    this.borderEqRightSurges.fill(0);

    // Cálculo preciso de la puntuación máxima teórica (100% Perfect+ con multiplicadores)
    this.maxPossibleScore = this.computeMaxPossibleScore(this.notes);
    this.targetScore = this.maxPossibleScore;

    // Load audio track properly depending on type (Blob vs URL/String)
    if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
      try { window.pauseMenuAmbientMusic(); } catch (_) {}
    }
    if (audioBlobOrUrl instanceof Blob) {
      this.sync.loadAudioBlob(audioBlobOrUrl);
    } else if (typeof audioBlobOrUrl === 'string' && audioBlobOrUrl) {
      this.sync.loadAudioUrl(audioBlobOrUrl);
    } else if (beatmapData.audio_blob_url) {
      this.sync.loadAudioUrl(beatmapData.audio_blob_url);
    } else {
      this.sync.loadAudioUrl('');
    }

    this.sync.seekTo(0);
    this.sync.pause();

    if (this.ui && typeof this.ui.onScoreUpdate === 'function') {
      this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, null, 0);
    }
    if (this.ui && typeof this.ui.onSongLoaded === 'function') {
      this.ui.onSongLoaded(beatmapData.metadata, this.activeSongPalette);
    }

    // Configuración del margen de entrada Lead-In: Reloj corre desde -LEAD_IN_TIME hasta 0
    this.isCountingDown = true;
    this.leadInDurationMs = LEAD_IN_TIME;
    this.leadInStartTime = performance.now();
    this.isRunning = true;
    this.isPaused = false;
    this.invulnerableUntil = 2400; // Protección post-arranque

    // El bucle de renderizado arranca inmediatamente para que las notas caigan desde el horizonte durante la cuenta atrás
    this.startLoop();

    if (this.ui && this.ui.onStartCountdown) {
      this.ui.onStartCountdown(this.leadInDurationMs);
    }
  }

  startNativeCalibration() {
    this.visualDimension = '3d';
    this.keyStyle = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_key_style') : null) || 'beatstar_large';
    this.isCalibrating = true;
    this.calibrationIntervalMs = this.isEffectDemoMode ? 720 : 1200;
    this.scrollDurationMs = 1150;
    this.isPaused = false;
    this.isGameOver = false;
    this.isRewinding = false;
    this.isCountingDown = false;
    this.firstActiveNoteIndex = 0;
    this._calibLaneCounter = 0;
    this.sync.pause();
    this.notes = [];
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];

    this.initCanvasSize();
    this.synth.ensureContext();
    this.calibrationStartTime = performance.now();
    this.nextCalibNoteTime = performance.now() + 180;
    this.startLoop();
  }

  stopNativeCalibration() {
    this.isCalibrating = false;
    this.isEffectDemoMode = false;
    this.notes = [];
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.stop();
  }

  // ⚡ OPTIMIZADO: Pausa vídeo de fondo + bucle para evitar decodificación en menús
  pause() {
    this.isPaused = true;
    this.isRunning = false;
    this.sync.pause();
    if (this.customBgVideo) {
      try { this.customBgVideo.pause(); } catch(e) {}
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resume() {
    this.isPaused = false;
    this.isRunning = true;
    this.isRewinding = false;
    this.isProcessingMiss = false;
    this.isCountingDown = false;
    this.missHighlight = null;
    this.lastMissTimePerf = performance.now();
    this.initCanvasSize();
    // Reanudar vídeo de fondo si estaba configurado
    if (this.customBgVideo && this.customBgVideo.paused && this.customBgMediaType === 'video') {
      const p = this.customBgVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
    this.sync.play();
    this.startLoop();
  }

  renderRewindVFX(progress) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!w || !h) return;

    ctx.save();
    // 1. Cyan tint vignette
    const alpha = Math.max(0, (1 - progress) * 0.4);
    ctx.fillStyle = `rgba(229, 184, 105, ${alpha * 0.12})`;
    ctx.fillRect(0, 0, w, h);

    // 2. Upward tape scanlines
    ctx.strokeStyle = `rgba(229, 184, 105, ${alpha * 0.35})`;
    ctx.lineWidth = 1.5;
    const numLines = 8;
    const speedOffset = (progress * 1600) % 70;
    for (let i = 0; i < numLines; i++) {
      const lineY = (h * 0.15 + i * 65 - speedOffset + h) % h;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(w, lineY);
      ctx.stroke();
    }

    // 3. Upward motion indicator
    const chevronAlpha = Math.sin(progress * Math.PI) * 0.75;
    if (chevronAlpha > 0.05) {
      ctx.fillStyle = `rgba(229, 184, 105, ${chevronAlpha})`;
      ctx.font = '900 20px "Cinzel", "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('▲ ▲ ▲', w / 2, this.hitLineY - 120 - (progress * 90));
    }
    ctx.restore();
  }

  animateRewind(fromTimeMs, toTimeMs, durationMs = 600, onComplete = null) {
    this.isRewinding = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const startPerf = performance.now();

    const rewindStep = (now) => {
      const elapsed = now - startPerf;
      const progress = Math.min(1.0, elapsed / durationMs);

      // Smooth cubic-out easing (fast start, silky-smooth deceleration)
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentRenderTime = fromTimeMs + (toTimeMs - fromTimeMs) * eased;

      this.ctx.clearRect(0, 0, this.width, this.height);
      this.renderBackgroundFX(currentRenderTime);
      this.renderLanes(currentRenderTime);
      this.renderRewindVFX(progress);
      this.renderNotes(currentRenderTime);
      this.renderHitLine();

      if (progress < 1.0) {
        this.animFrameId = requestAnimationFrame(rewindStep);
      } else {
        this.isRewinding = false;
        this.animFrameId = null;
        if (onComplete) onComplete();
      }
    };

    this.animFrameId = requestAnimationFrame(rewindStep);
  }

  reviveAndResume() {
    try {
      this.synth.playAnalogTapeRewind();
    } catch (e) {}

    // 1. Exact fail time and rewind position (-2.0s)
    const failTimeSec = this.lastFailSongTimeSec || ((this.sync.getCurrentTimeMs() || 0) / 1000);
    const failTimeMs = failTimeSec * 1000;
    const fromTimeMs = failTimeMs + this.latencyOffsetMs;

    const rewindTargetSec = Math.max(0, failTimeSec - 2.0);
    const rewindTargetMs = rewindTargetSec * 1000;
    const toTimeMs = rewindTargetMs + this.latencyOffsetMs;

    // 2. Seek audio to rewind target
    this.sync.pause();
    this.sync.seekTo(rewindTargetSec);

    // 3. Clear ALL notes prior to and at the failure point + 1.6s clear runway!
    // Any note with timestamp <= rewindTargetMs + 1600 is cleared so the player has reaction time!
    const clearThresholdMs = Math.max(failTimeMs + 60, rewindTargetMs + 1600);
    for (const note of this.notes) {
      const noteTime = note.timestamp_ms || 0;
      if (noteTime <= clearThresholdMs) {
        note.hit = true;
        note.missed = false;
        note.processed = true;
        note.holding = false;
        note.holdCompleted = true;
      } else {
        note.hit = false;
        note.missed = false;
        note.processed = false;
        note.holding = false;
        note.holdCompleted = false;
      }
    }

    this.firstActiveNoteIndex = 0;
    this.lastLitSyllableIndex = -1;
    if (this.particles) {
      this.particles.reset();
    }
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.fxRipples = [];
    this.bgBursts = [];

    this.isProcessingMiss = false;
    this.missHighlight = null;
    this.lastMissTimePerf = performance.now();
    // 2.5s invulnerability grace period
    this.invulnerableUntil = failTimeMs + this.latencyOffsetMs + 2500;

    if (this.ui && this.ui.onShowRewindBadge) {
      this.ui.onShowRewindBadge();
    }

    this.isPaused = false;
    this.isGameOver = false;
    this.isCountingDown = false;
    this.initCanvasSize();

    // 4. Start smooth 600ms rewind animation:
    // Notes from failTimeMs onward glide smoothly upwards from hitline to top
    // while all notes prior to failure are completely gone!
    this.animateRewind(fromTimeMs, toTimeMs, 600, () => {
      this.resume();
    });
  }

  restart() {
    if (!this.beatmapData) return;
    this.stop();
    this.loadBeatmap(this.beatmapData, this.currentAudioSource);
  }

  // ⚡ OPTIMIZADO: Pausa vídeo de fondo al detener
  stop() {
    this.isPaused = true;
    this.isRunning = false;
    this.isRewinding = false;
    this.isProcessingMiss = false;
    this.isCountingDown = false;
    this.missHighlight = null;
    if (this.customBgVideo) {
      try { this.customBgVideo.pause(); } catch(e) {}
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.sync.pause();
    if (this.sync.audioElement) {
      try {
        this.sync.audioElement.pause();
        this.sync.audioElement.removeAttribute('src');
        this.sync.audioElement.load();
      } catch (e) {}
    }
    if (this.sync._blobUrl) {
      try {
        URL.revokeObjectURL(this.sync._blobUrl);
      } catch (e) {}
      this.sync._blobUrl = null;
    }
    if (this.sync) {
      this.sync._lastRawAudio = -1;
      this.sync._interpolatedTime = 0;
      this.sync._lastSyncPerf = performance.now();
    }
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.notes.length = 0;
    this.judgements.length = 0;
    this.fxRipples.length = 0;
    this.flyingLyrics.length = 0;
    this.bgBursts.length = 0;
    this.musicalNotes.length = 0;
    this.firstActiveNoteIndex = 0;
    this.lastLitSyllableIndex = -1;
    this._lastCurLyricIndex = -1;
    if (typeof document !== 'undefined') {
      const curEl = document.getElementById('karaokeCurrentLine');
      if (curEl) curEl.innerHTML = '';
    }
  }

  getCurrentGameTimeMs(frameNow = null) {
    const fn = (frameNow !== null && Number.isFinite(frameNow)) ? frameNow : (this._frameNow || performance.now());
    if (this.isCountingDown) {
      const elapsed = fn - this.leadInStartTime;
      return Math.min(0, elapsed - this.leadInDurationMs);
    }
    if (this.isCalibrating) {
      return (fn - this.calibrationStartTime) + this.latencyOffsetMs;
    }
    return this.sync.getCurrentTimeMs(fn) + this.latencyOffsetMs;
  }

  handleTouchStart(e) {
    e.preventDefault();
    if (this.isPaused || this.isRewinding) return;

    this.lastTouchTime = performance.now();
    const rect = this.canvas.getBoundingClientRect();
    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const lane = this.getLaneFromX(touch.clientX, touch.clientY);

      this.activeTouches.set(touch.identifier, {
        x0: x, y0: y, t0: now, lane, swiped: false
      });

      // Registro de arrastre interactivo para notas de deslizamiento (Swipe)
      this.activeSwipeDrags.set(touch.identifier, {
        lane, startX: touch.clientX, startY: touch.clientY, dx: 0, dy: 0
      });

      this.triggerLaneInput(lane, 'tap', null, touch.identifier);
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (this.isPaused || this.isRewinding) return;

    const rect = this.canvas.getBoundingClientRect();
    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.activeTouches.get(touch.identifier);
      if (!touchData || touchData.swiped) continue;

      const currentX = touch.clientX - rect.left;
      const currentY = touch.clientY - rect.top;
      const dx = currentX - touchData.x0;
      const dy = currentY - touchData.y0;

      // Actualizar offset de arrastre en tiempo real (mueve la flecha con el dedo)
      const drag = this.activeSwipeDrags.get(touch.identifier);
      if (drag) {
        drag.dx = dx;
        drag.dy = dy;
      }

      const dist = Math.hypot(dx, dy);
      const elapsed = now - touchData.t0;

      if (dist > 22 && elapsed < 400) {
        let direction = 'up';
        if (Math.abs(dx) > Math.abs(dy)) {
          direction = dx > 0 ? 'right' : 'left';
        } else {
          direction = dy > 0 ? 'down' : 'up';
        }

        touchData.swiped = true;
        this.activeSwipeDrags.delete(touch.identifier);
        this.triggerLaneInput(touchData.lane, 'swipe', direction, touch.identifier);
      }
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.activeTouches.get(touch.identifier);
      if (touchData) {
        this.releaseLaneHold(touchData.lane, touch.identifier);
        this.activeTouches.delete(touch.identifier);
      }
      this.activeSwipeDrags.delete(touch.identifier);
    }
  }

  handleMouseDown(e) {
    if (this.isPaused || this.isRewinding) return;
    // Evitar eventos de ratón sintéticos duplicados en dispositivos táctiles
    if (performance.now() - (this.lastTouchTime || 0) < 500) return;
    const lane = this.getLaneFromX(e.clientX, e.clientY);
    const rect = this.canvas.getBoundingClientRect();
    this.mouseTouch = {
      x0: e.clientX - rect.left,
      y0: e.clientY - rect.top,
      t0: performance.now(),
      lane: lane,
      swiped: false
    };
    this.triggerLaneInput(lane, 'tap', null, 'mouse');
  }

  handleMouseMove(e) {
    if (!this.mouseTouch || this.mouseTouch.swiped || this.isPaused || this.isRewinding) return;
    const rect = this.canvas.getBoundingClientRect();
    const dx = (e.clientX - rect.left) - this.mouseTouch.x0;
    const dy = (e.clientY - rect.top) - this.mouseTouch.y0;
    const dist = Math.hypot(dx, dy);

    if (dist > 20) {
      let direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      this.mouseTouch.swiped = true;
      this.triggerLaneInput(this.mouseTouch.lane, 'swipe', direction, 'mouse');
    }
  }

  handleMouseUp() {
    if (this.mouseTouch) {
      this.releaseLaneHold(this.mouseTouch.lane, 'mouse');
      this.mouseTouch = null;
    }
  }

  triggerLaneInput(lane, inputType = 'tap', swipeDirection = null, touchId = null) {
    if (!this.borderEqLeftSurges) this.borderEqLeftSurges = new Float32Array(16);
    if (!this.borderEqRightSurges) this.borderEqRightSurges = new Float32Array(16);
    const rowCount = 12;
    if (lane === 0) {
      this.borderSurgeL = 1.0;
      this.borderSurgeR = Math.max(this.borderSurgeR || 0, 0.35);
      for (let i = 0; i < rowCount; i++) {
        this.borderEqLeftSurges[i] = Math.min(1.0, (this.borderEqLeftSurges[i] || 0) * 0.4 + 0.55 + Math.random() * 0.35);
      }
    } else if (lane === 2) {
      this.borderSurgeR = 1.0;
      this.borderSurgeL = Math.max(this.borderSurgeL || 0, 0.35);
      for (let i = 0; i < rowCount; i++) {
        this.borderEqRightSurges[i] = Math.min(1.0, (this.borderEqRightSurges[i] || 0) * 0.4 + 0.55 + Math.random() * 0.35);
      }
    } else {
      this.borderSurgeL = Math.max(this.borderSurgeL || 0, 0.85);
      this.borderSurgeR = Math.max(this.borderSurgeR || 0, 0.85);
      for (let i = 0; i < rowCount; i++) {
        this.borderEqLeftSurges[i] = Math.min(1.0, (this.borderEqLeftSurges[i] || 0) * 0.4 + 0.48 + Math.random() * 0.30);
        this.borderEqRightSurges[i] = Math.min(1.0, (this.borderEqRightSurges[i] || 0) * 0.4 + 0.48 + Math.random() * 0.30);
      }
    }
    this.laneGlows[lane] = 1.0;
    if (this.laneFlashTimers) this.laneFlashTimers[lane] = 0.28;
    if (this.laneFlashColors) this.laneFlashColors[lane] = this.getJudgeGlowColor('perfectPlus');
    const nowInput = performance.now();
    if (this.lanePressAnim) this.lanePressAnim[lane] = nowInput;
    const currentTime = this.getCurrentGameTimeMs(this._frameNow || nowInput);

    const hitX = (lane + 0.5) * this.laneWidth;
    const hitY = this.hitLineY;

    // Palette per lane (pre-allocated para 0 GC)
    if (!this._laneBurstPalettes) {
      this._laneBurstPalettes = [
        { c1: '#00f2fe', c2: '#3b82f6', alt: '#39ff14' }, // Lane 0: Electric Cyan / Lime
        { c1: '#ff007f', c2: '#a855f7', alt: '#ffe600' }, // Lane 1: Hot Magenta / Royal Purple
        { c1: '#fbbf24', c2: '#ff3300', alt: '#ff007f' }  // Lane 2: Radiant Gold / Crimson
      ];
    }
    const p = this._laneBurstPalettes[lane % 3];

    const effect = this.normalizeEffectId(this.activeEffect);
    this.activeEffect = effect;

    if (this.bgBursts.length >= 4) this.bgBursts.shift();
    if (this.fxRipples.length >= 4) this.fxRipples.shift();

    this.bgBursts.push({
      type: effect,
      lane,
      x: hitX,
      y: hitY,
      age: 0,
      duration: 0.55,
      radius: 16,
      maxRadius: Math.max(this.width, this.height) * 0.50,
      alpha: 1.0,
      decay: 1.85,
      seed: Math.random() * 100,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() < 0.5 ? 1 : -1) * 2.8,
      color1: p.c1,
      color2: p.c2
    });

    this.fxRipples.push({
      lane,
      x: hitX,
      y: hitY,
      radius: 10,
      maxRadius: Math.max(55, (this.laneWidth || 100) * 0.72),
      alpha: 0.90,
      decay: 3.4,
      color: p.c1
    });

    // ⚡ Ventana amplia para swipes (320ms) para compensar el tiempo que tarda el dedo en desplazarse 18px
    const HIT_WINDOW = (inputType === 'swipe') ? 320 : 240;
    let closestNote = null;
    let minDiff = Infinity;

    // 1. Recolectar notas activas en este carril empezando en firstActiveNoteIndex y cortando temprano
    const laneNotes = [];
    const nLen = this.notes.length;
    const startSearchIdx = Math.max(0, (this.firstActiveNoteIndex || 0) - 2);
    for (let i = startSearchIdx; i < nLen; i++) {
      const note = this.notes[i];
      if (!note || note.hit || note.missed || note.holdCompleted || note.holding) continue;
      if (note.timestamp_ms - currentTime > HIT_WINDOW + 80) break;
      if (!this.isCalibrating && note.lane !== lane) continue;

      const diffFromNote = currentTime - note.timestamp_ms;
      const absDiff = Math.abs(diffFromNote);
      if (absDiff <= HIT_WINDOW) {
        laneNotes.push({ note, absDiff, diff: diffFromNote, time: note.timestamp_ms });
      }
    }

    // ⚡ Si es swipe y el jugador empezó el gesto ligeramente ladeado, buscar en carriles adyacentes
    if (inputType === 'swipe' && laneNotes.length === 0) {
      for (let i = startSearchIdx; i < nLen; i++) {
        const note = this.notes[i];
        if (!note || note.hit || note.missed || note.holdCompleted || note.holding) continue;
        if (note.timestamp_ms - currentTime > HIT_WINDOW + 80) break;
        if (note.type !== 'swipe') continue;
        const diffFromNote = currentTime - note.timestamp_ms;
        const absDiff = Math.abs(diffFromNote);
        if (absDiff <= HIT_WINDOW) {
          laneNotes.push({ note, absDiff, diff: diffFromNote, time: note.timestamp_ms });
        }
      }
    }

    if (laneNotes.length > 1) {
      laneNotes.sort((a, b) => a.time - b.time);
    }
    const isActivelyPlaying = (this.isRunning || (this.sync && this.sync.isPlaying)) && !this.isPaused && !this.isGameOver && !this.isCountingDown && !this.isCalibrating && !!this.beatmapData;

    if (laneNotes.length === 0) {
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, this.getScoreColor('perfectPlus'));
      }
      if (this.isCalibrating) {
        this.synth.playClick();
        this.emitKeyHit(hitX, hitY, this.getScoreColor('perfectPlus'), 24);
        return;
      }
      if (isActivelyPlaying && !this.isProcessingMiss) {
        this.synth.playPunchyArcadeMiss();
        this.addJudgement('MISS', '#a81b26', lane);
        this.missHighlight = {
          type: 'empty_tap',
          lane: lane,
          x: hitX,
          y: hitY,
          time: performance.now()
        };
        this.handleMiss();
        return;
      }
      this.synth.playClick();
      return;
    }

    // La nota frontal es la que está más abajo en la pista (más cercana a la línea de golpeo)
    const frontEntry = laneNotes[0];
    const frontNote = frontEntry.note;

    if (inputType === 'tap') {
      // Si la nota frontal es un SWIPE, el toque inicial (touchstart) NO la falla;
      // se espera a que handleTouchMove detecte el deslizamiento del dedo.
      if (frontNote.type === 'swipe') {
        return;
      }
      // La nota frontal es un tap normal o un hold
      closestNote = frontNote;
      minDiff = frontEntry.absDiff;
    } else if (inputType === 'swipe') {
      // Si la nota frontal es un SWIPE, verificar dirección
      if (frontNote.type === 'swipe') {
        const targetDir = (frontNote.direction || 'up').toLowerCase();
        const curDir = (swipeDirection || '').toLowerCase();
        if (!curDir || !targetDir || curDir === targetDir) {
          closestNote = frontNote;
          minDiff = frontEntry.absDiff;
        } else {
          return;
        }
      } else {
        // Swipe sobre nota normal o hold: se valida fluidamente como acierto
        closestNote = frontNote;
        minDiff = frontEntry.absDiff;
      }
    }

    if (!closestNote) {
      return;
    }

    if (this.isCalibrating) {
      closestNote.hit = true;
      const jCalib = this.judgeHit(closestNote, minDiff, hitX, hitY);
      this.emitKeyHit(hitX, hitY, jCalib.color, 24);
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, jCalib.color);
      }
      return;
    }

    // Nota tap o notas estándar (cualquier toque o tecla sobre la nota la valida inmediatamente)
    if (closestNote.type === 'tap' || (!closestNote.type || closestNote.type === 'single' || closestNote.type === 'normal')) {
      closestNote.hit = true;
      let j;
      try {
        j = this.judgeHit(closestNote, minDiff, hitX, hitY);
      } catch (eTap) {
        console.error('[Engine] Error en judgeHit tap:', eTap);
        j = { text: 'PERFECT', color: '#ffd700', points: 80 };
      }
      this.emitKeyHit(hitX, hitY, j.color, 22);
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, j.color);
      }
    } 
    else if (closestNote.type === 'swipe') {
      const targetDir = (closestNote.direction || 'up').toLowerCase();
      const curDir = (swipeDirection || '').toLowerCase();
      const isExactSwipe = (inputType === 'swipe' && (!curDir || !closestNote.direction || curDir === targetDir));
      
      if (!isExactSwipe) {
        // Dirección errónea o toque simple: no valida
        return;
      }

      closestNote.hit = true;
      let j;
      try {
        j = this.judgeHit(closestNote, minDiff, hitX, hitY, 'SWIPE');
      } catch (eSwipe) {
        console.error('[Engine] Error en judgeHit swipe:', eSwipe);
        j = { text: 'SWIPE', color: '#ffd700', points: 100 };
      }
      this.emitKeyHit(hitX, hitY, j.color, 26);

      // ANIMACIÓN DE EXPULSIÓN HIPERSÓNICA: La tecla sale disparada hacia esa dirección
      if (!this.activeSwipeLaunches) this.activeSwipeLaunches = [];
      const launchVx = targetDir === 'left' ? -1550 : (targetDir === 'right' ? 1550 : 0);
      const launchVy = targetDir === 'up' ? -1650 : (targetDir === 'down' ? 1450 : 0);
      const launchRot = targetDir === 'left' ? -0.45 : (targetDir === 'right' ? 0.45 : (targetDir === 'down' ? 0.2 : -0.2));

      this.activeSwipeLaunches.push({
        lane: closestNote.lane,
        x: hitX,
        y: hitY,
        dir: targetDir,
        color: j.color || '#00f2fe',
        startTime: performance.now(),
        duration: 420,
        vx: launchVx,
        vy: launchVy,
        rot: launchRot
      });

      if (this.particles && typeof this.particles.emitSwipeBurst === 'function') {
        this.particles.emitSwipeBurst(hitX, hitY, targetDir, j.color, 36);
      }
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, j.color);
      }
    } 
    else if (closestNote.type === 'hold') {
      const rawDur = closestNote.duration_ms || 0;
      if (rawDur <= 220) {
        // Micro-hold se completa inmediatamente como tap seguro
        closestNote.hit = true;
        closestNote.holdCompleted = true;
        let j;
        try {
          j = this.judgeHit(closestNote, minDiff, hitX, hitY);
        } catch (eHold) {
          j = { text: 'PERFECT', color: '#ffd700', points: 80 };
        }
        this.emitKeyHit(hitX, hitY, j.color, 22);
        if (this.customBgMode === 'reactive') {
          this.addReactiveBurst(lane, hitX, hitY, j.color);
        }
      } else {
        const prevHold = this.activeHolds.get(lane);
        if (prevHold && prevHold.note && prevHold.note !== closestNote) {
          prevHold.note.holding = false;
          prevHold.note.holdCompleted = true;
          prevHold.note.hit = true;
        }
        closestNote.holding = true;
        closestNote.missed = false;
        let j;
        try {
          j = this.judgeHit(closestNote, minDiff, hitX, hitY);
        } catch (eHold2) {
          j = { text: 'PERFECT', color: '#ffd700', points: 80 };
        }
        this.activeHolds.set(lane, {
          note: closestNote,
          touchId: touchId,
          startTime: currentTime,
          initialTime: closestNote.timestamp_ms,
          color: j.color
        });
        this.emitKeyHit(hitX, hitY, j.color, 20);
        if (this.customBgMode === 'reactive') {
          this.addReactiveBurst(lane, hitX, hitY, j.color);
        }
      }
    } else {
      closestNote.hit = true;
      let j;
      try {
        j = this.judgeHit(closestNote, minDiff, hitX, hitY);
      } catch (eDef) {
        j = { text: 'GOOD', color: '#9e7b66', points: 25 };
      }
      this.emitKeyHit(hitX, hitY, j.color, 20);
    }
  }

  releaseLaneHold(lane, touchId = null) {
    const active = this.activeHolds.get(lane);
    if (!active) return;
    if (touchId !== null && active.touchId !== null && active.touchId !== touchId) return;

    const currentTime = this.getCurrentGameTimeMs();
    const note = active.note;
    const endT = note.end_timestamp_ms || (note.timestamp_ms + (note.duration_ms || 700));
    const heldDuration = currentTime - active.startTime;
    const totalDuration = endT - active.startTime;

    // Acierto completado si se mantuvo al menos el 60% o hasta 180ms del final
    if (currentTime >= endT - 180 || (totalDuration > 0 && (heldDuration / totalDuration) >= 0.60)) {
      note.holdCompleted = true;
      note.hit = true;
      note.holding = false;
      this.addScore(450 * this.multiplier);
      if (this.ui && this.ui.onHitBeatPulse) {
        this.ui.onHitBeatPulse(this.combo);
      }
      const hitX = (lane + 0.5) * this.laneWidth;
      const holdColor = (active.color && active.color !== '#00ff88' && active.color !== '#00f2fe') ? active.color : '#e5b869';
      this.emitKeyHit(hitX, this.hitLineY, holdColor, 30);
    } else {
      note.missed = true;
      note.holding = false;
      if (!this.isProcessingMiss && !this.isGameOver && !this.isPaused) {
        this.synth.playPunchyArcadeMiss();
        this.addJudgement('HOLD DROP', '#a81b26', lane);
        this.missHighlight = {
          type: 'hold_dropped',
          lane: lane,
          note: note,
          time: performance.now()
        };
        this.handleMiss();
      }
    }
    this.activeHolds.delete(lane);
  }

  judgeHit(note, diffMs, x, y, customLabel = null) {
    let text = 'GREAT';
    let color = this.getScoreColor('great');
    let points = 150;
    let flashDuration = 0.18;
    let flashColor = '#ffd700';
    let judgeTier = 'great';

    if (diffMs <= 45) {
      text = customLabel ? `PERFECT+ ${customLabel}` : 'PERFECT+';
      color = this.getScoreColor('perfectPlus');
      flashColor = this.getJudgeGlowColor('perfectPlus');
      flashDuration = 0.34;
      points = 450;
      this.stats.perfectPlus++;
      this.streakCount++;
      judgeTier = 'perfectPlus';
    } else if (diffMs <= 90) {
      text = customLabel ? `PERFECT ${customLabel}` : 'PERFECT';
      color = this.getScoreColor('perfect');
      flashColor = this.getJudgeGlowColor('perfect');
      flashDuration = 0.30;
      points = 300;
      this.stats.perfect++;
      this.streakCount++;
      judgeTier = 'perfect';
    } else if (diffMs <= 170) {
      text = customLabel ? `GREAT ${customLabel}` : 'GREAT';
      color = this.getScoreColor('great');
      flashColor = this.getJudgeGlowColor('great');
      flashDuration = 0.26;
      points = 150;
      this.stats.great++;
      this.streakCount = Math.max(0, this.streakCount - 1);
      judgeTier = 'great';
    } else {
      text = customLabel ? `GOOD ${customLabel}` : 'GOOD';
      color = this.getScoreColor('good');
      flashColor = this.getJudgeGlowColor('good');
      flashDuration = 0.22;
      points = 75;
      this.stats.good = (this.stats.good || 0) + 1;
      this.streakCount = 0;
      judgeTier = 'good';
    }

    // Telemetría de precisión sub-milisegundo (Early < 0 / Late > 0, 0 allocs)
    if (note) {
      if (!this.timingStats) {
        this.timingStats = { count: 0, sumSignedMs: 0, sumAbsMs: 0, earlyCount: 0, lateCount: 0, exactCount: 0 };
      }
      const noteT = Number.isFinite(note.timestamp_ms) ? note.timestamp_ms : (Number.isFinite(note.timeMs) ? note.timeMs : 0);
      const curT = this.getCurrentGameTimeMs(this._frameNow);
      const signedDiff = Math.max(-180, Math.min(180, curT - noteT));
      this.timingStats.count++;
      this.timingStats.sumSignedMs += signedDiff;
      this.timingStats.sumAbsMs += Math.abs(signedDiff);
      if (signedDiff < -15) this.timingStats.earlyCount++;
      else if (signedDiff > 15) this.timingStats.lateCount++;
      else this.timingStats.exactCount++;

      if (this.ui && typeof this.ui.onTimingOffset === 'function') {
        this.ui.onTimingOffset(signedDiff, judgeTier);
      }
    }

    if (typeof window !== 'undefined' && window.isKaraokeModeActive) {
      const nTime = (note && Number.isFinite(note.sylTime))
        ? note.sylTime
        : (note ? (Number.isFinite(note.timestamp_ms) ? note.timestamp_ms : (Number.isFinite(note.timeMs) ? note.timeMs : Math.round((note.time || 0) * 1000))) : null);

      if (nTime !== null) {
        if (typeof iluminarSilaba === 'function') {
          iluminarSilaba(nTime);
        } else if (typeof window.iluminarSilaba === 'function') {
          window.iluminarSilaba(nTime);
        }
      }
    }

    const noteLane = (note && typeof note.lane === 'number') ? note.lane : 1;

    // Resplandor difuminado de carril con el color exacto del juicio (PERFECT+, PERFECT, GREAT, GOOD)
    this.laneFlashTimers[noteLane] = flashDuration;
    this.laneFlashColors[noteLane] = flashColor;
    this.laneGlows[noteLane] = 1.0;
    this.lastHitTimePerf = performance.now();

    const prevMult = this.multiplier || 1;
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Beat Pulse dinámico en cada acierto
    if (this.ui && this.ui.onHitBeatPulse) {
      this.ui.onHitBeatPulse(this.combo);
    }

    // Umbrales de Multiplicador:
    // x2 -> Combo 10 | x3 -> Combo 25 | x4 -> Combo 50 | x5 -> Combo 100
    if (this.combo >= 100) {
      this.multiplier = 5;
    } else if (this.combo >= 50) {
      this.multiplier = 4;
    } else if (this.combo >= 25) {
      this.multiplier = 3;
    } else if (this.combo >= 10) {
      this.multiplier = 2;
    } else {
      this.multiplier = 1;
    }

    if (this.multiplier > prevMult) {
      const midX = this.width / 2;
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
      this.addRipple(midX, hitY, '#ffd700', 320);

      // Explosión 3D cinemática luminosa sin oscurecer jamás la pantalla
      if (this.multiplier === 2) {
        this.triggerComboExplosion('2X MULTI', '¡BOOST ÁMBAR!', '#ffd700', '#ffd700', 1.2);
      } else if (this.multiplier === 3) {
        this.triggerComboExplosion('3X FIEBRE', '¡MAGENTA NEÓN!', '#ff007f', '#ff007f', 1.4);
      } else if (this.multiplier === 4) {
        this.triggerComboExplosion('4X HIPER', '¡CIAN ELÉCTRICO!', '#00f2fe', '#00f2fe', 1.6);
      } else if (this.multiplier >= 5) {
        this.triggerComboExplosion('5X DIAMANTE', '¡APOTEOSIS TOTAL!', '#ffffff', '#ffffff', 2.0);
      }
    } else {
      this.checkComboMilestone(this.combo);
    }

    if (diffMs <= 90) {
      this.spawnMusicalNotes(x, y, color, diffMs <= 45 ? 2 : 1);
    }
    
    this.addScore(points * this.multiplier);
    if (text && String(text).trim().length > 0) {
      this.addJudgement(text, color, noteLane);
    }
    return { text, color, points };
  }

  // Nueva Explosión 3D Cinemática y Transformación de Color de Fondo
  triggerComboExplosion(title, subtext = '', color = '#ffd700', targetAtmosphereColor = '#ffd700', intensity = 1.0) {
    const w = this.width || 360;
    const h = this.height || 640;
    const midX = w / 2;
    const midY = h * 0.42;

    // Actualizar paleta activa de la atmósfera con resplandor aditivo luminoso
    this.targetAtmosphereColor = color || targetAtmosphereColor;
    this.atmosphereShiftProgress = 0.0;

    // Crear partículas en perspectiva 3D (optimizado para 120 FPS móviles)
    const sparks = [];
    const sparkCount = Math.min(12, Math.round(10 * Math.min(1.5, intensity)));
    const pal = [color, '#ffffff', '#fff5cc', '#ffe082', '#00f2fe', '#ff007f'];

    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (90 + Math.random() * 240) * intensity;
      const zSpeed = (-120 + Math.random() * 320) * intensity;
      sparks.push({
        x: midX + (Math.random() - 0.5) * 36,
        y: midY + (Math.random() - 0.5) * 26,
        z: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: zSpeed,
        radius: (2.0 + Math.random() * 3.0) * intensity,
        color: pal[Math.floor(Math.random() * pal.length)],
        alpha: 1.0,
        decay: 1.8 + Math.random() * 1.4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8
      });
    }

    // Rayos de luz volumétricos rotatorios (optimizado: 6 rayos suaves)
    const rays = [];
    const rayCount = 6;
    for (let i = 0; i < rayCount; i++) {
      const baseAngle = (i / rayCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      rays.push({
        angle: baseAngle,
        length: Math.hypot(w, h) * (0.75 + Math.random() * 0.4),
        width: 16 + Math.random() * 20,
        color: i % 2 === 0 ? color : '#ffffff'
      });
    }

    const explosion = {
      title,
      subtext,
      color: color || '#ffd700',
      targetAtmosphereColor: color || targetAtmosphereColor,
      originX: midX,
      originY: midY,
      radius: 0,
      maxRadius: Math.hypot(w, h) * 1.35,
      age: 0,
      duration: 1.8,
      alpha: 1.0,
      scale: 1.7,
      intensity: intensity || 1.0,
      sparks,
      rays,
      rotation: 0
    };

    if (this.combo3DExplosions.length >= 2) this.combo3DExplosions.shift();
    this.combo3DExplosions.push(explosion);

    this.topComboToast = explosion; // Retrocompatibilidad para HUD listeners
    this.triggerScreenShake(3.8 * intensity, 90);

    if (this.ui && typeof this.ui.onComboMilestone === 'function') {
      this.ui.onComboMilestone(title, subtext, color);
    }
  }

  showTopMilestone(title, subtext = '', color = '#ffd700', duration = 1.2) {
    this.triggerComboExplosion(title, subtext, color, color, 1.0);
  }

  checkComboMilestone(c) {
    const milestones = [10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
    if (milestones.includes(c)) {
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
      this.addRipple(this.width / 2, hitY, '#ffd700', 260);

      let sub = '¡COMBO RACHA!';
      let col = '#ffd700';
      let intens = 1.0;

      if (c >= 300) {
        sub = '¡LEGENDARIO!';
        col = '#ffffff';
        intens = 1.8;
      } else if (c >= 200) {
        sub = '¡SUPERNOVA!';
        col = '#00f2fe';
        intens = 1.6;
      } else if (c >= 100) {
        sub = '¡FIEBRE TOTAL!';
        col = '#ff007f';
        intens = 1.4;
      } else if (c >= 50) {
        sub = '¡EN LLAMAS!';
        col = '#ffaa00';
        intens = 1.2;
      }

      this.triggerComboExplosion(`${c} COMBO`, sub, col, col, intens);
    }
  }

  addRipple(x, y, color = '#ffd700', maxRadius = 240) {
    const w = this.width || 360;
    const lane = Math.max(0, Math.min(2, Math.floor((x / Math.max(1, w)) * 3)));
    if (this.fxRipples.length >= 6) this.fxRipples.shift();
    this.fxRipples.push({
      lane,
      x: x,
      y: y,
      radius: 14,
      maxRadius: maxRadius,
      alpha: 0.90,
      decay: 2.2,
      color: color || '#ffd700'
    });
  }

  triggerGameOver() {
    this.triggerGameEnd();
  }

  spawnMusicalNotes(x, y, color = '#ffd700', count = 2) {
    if (this.musicalNotes.length > 8) {
      this.musicalNotes.splice(0, this.musicalNotes.length - 8);
    }
    const symbols = ['𝄞', '𝅘𝅥𝅯', '♬', '♩', '𝅘𝅥𝅮', '♪'];
    const safeCount = Math.min(count, 2);
    for (let i = 0; i < safeCount; i++) {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
      const speed = 75 + Math.random() * 95;
      this.musicalNotes.push({
        symbol: sym,
        x: x + (Math.random() - 0.5) * 36,
        y: y - 12 + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed * 0.45,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        decay: 1.1 + Math.random() * 0.8,
        color: color,
        scale: 0.9 + Math.random() * 0.45,
        rotation: (Math.random() - 0.5) * 0.35,
        rotSpeed: (Math.random() - 0.5) * 1.2
      });
    }
  }

  addScore(pts) {
    this.score += pts;
    const maxScore = Math.max(1, this.maxPossibleScore || 1);
    const scorePct = Math.min(100.0, (this.score / maxScore) * 100);

    const totalNotes = (this.notes && this.notes.length) || 0;

    // Asignación progresiva de estrellas (0 a 5) según la puntuación acumulada sobre maxPossibleScore:
    // 1★: >= 20% | 2★: >= 40% | 3★: >= 60% | 4★: >= 75% | 5★: >= 90%
    let stars = 0;
    if (scorePct >= 90.0) stars = 5;
    else if (scorePct >= 75.0) stars = 4;
    else if (scorePct >= 60.0) stars = 3;
    else if (scorePct >= 40.0) stars = 2;
    else if (scorePct >= 20.0) stars = 1;
    // Las estrellas nunca disminuyen durante la partida
    const prevStars = this.lastCelebratedStar || 0;
    this.stars = Math.max(this.stars, stars);

    // Celebración de Estrella Desbloqueada:
    // 1. Shockwave circular en nodo de la estrella
    // 2. 8 chispas en caída parabólica aditiva
    // 3. Camera micro-shake de 2px durante 40ms
    if (this.stars > prevStars) {
      for (let s = prevStars + 1; s <= this.stars; s++) {
        if (this.ui && this.ui.onStarUnlocked) {
          this.ui.onStarUnlocked(s, s === 5);
        }
        if (this.particles && this.particles.emitStarCelebration) {
          const cutPct = (s === 1 ? 0.20 : s === 2 ? 0.40 : s === 3 ? 0.60 : s === 4 ? 0.75 : 0.90);
          const starX = (this.width / 2) - 80 + (cutPct * 160);
          const starY = 32;
          this.particles.emitStarCelebration(starX, starY, s === 5);
        }
        this.triggerScreenShake(2.0, 40);
      }
      this.lastCelebratedStar = this.stars;
    }

    // Medallas en tiempo real: Requiere un mínimo de 100 notas en la pista
    // Plata: >= 92% | Oro: >= 94% | Platino: >= 96%
    let medalTier = null;
    if (totalNotes >= 100) {
      if (scorePct >= 96.0) medalTier = 'platinum';
      else if (scorePct >= 94.0) medalTier = 'gold';
      else if (scorePct >= 92.0) medalTier = 'silver';
    }
    // La medalla alcanzada nunca disminuye durante la partida
    if (this.currentMedalTier === 'platinum') medalTier = 'platinum';
    else if (this.currentMedalTier === 'gold' && medalTier !== 'platinum') medalTier = 'gold';
    else if (this.currentMedalTier === 'silver' && !medalTier) medalTier = 'silver';
    this.currentMedalTier = medalTier;

    const totalJudged = (this.stats.perfectPlus || 0) + (this.stats.perfect || 0) + (this.stats.great || 0) + (this.stats.good || 0) + (this.stats.miss || 0);
    const accuracyPct = totalJudged > 0
      ? Math.min(100.0, Math.max(0.0, (((this.stats.perfectPlus * 100) + (this.stats.perfect * 80) + (this.stats.great * 50) + ((this.stats.good || 0) * 25)) / (totalJudged * 100)) * 100))
      : 100.0;

    const nowPerf = this._frameNow || performance.now();
    const stateChanged = (this.stars !== prevStars) || (this._lastUiMult !== this.multiplier) || (this._lastUiCombo !== this.combo) || (this._lastUiMedal !== this.currentMedalTier);
    if (stateChanged || !this._lastUiScoreTime || (nowPerf - this._lastUiScoreTime >= 50)) {
      this._lastUiScoreTime = nowPerf;
      this._lastUiMult = this.multiplier;
      this._lastUiCombo = this.combo;
      this._lastUiMedal = this.currentMedalTier;
      if (this.ui && typeof this.ui.onScoreUpdate === 'function') {
        this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, this.currentMedalTier, scorePct, accuracyPct);
      }
    }
  }

  handleMiss() {
    if (this.isProcessingMiss || this.isGameOver || this.isPaused) {
      console.warn('[MISS] Blocked: processing=' + this.isProcessingMiss + ' gameOver=' + this.isGameOver + ' paused=' + this.isPaused);
      return;
    }

    this.isProcessingMiss = true;
    this.lastMissTimePerf = performance.now();
    this.lastFailSongTimeSec = (this.sync.getCurrentTimeMs() || 0) / 1000;

    this.combo = 0;
    this.streakCount = 0;
    this.multiplier = 1;
    this.stats.miss++;
    
    const maxScore = Math.max(1, this.maxPossibleScore || 1);
    const scorePct = Math.min(100.0, (this.score / maxScore) * 100);

    const totalJudged = (this.stats.perfectPlus || 0) + (this.stats.perfect || 0) + (this.stats.great || 0) + (this.stats.good || 0) + (this.stats.miss || 0);
    const accuracyPct = totalJudged > 0
      ? Math.min(100.0, Math.max(0.0, (((this.stats.perfectPlus * 100) + (this.stats.perfect * 80) + (this.stats.great * 50) + ((this.stats.good || 0) * 25)) / (totalJudged * 100)) * 100))
      : 100.0;

    // Haptic & visual feedback on miss
    this.triggerScreenShake(4.5, 80);
    this.vignetteAlpha = 0.55;
    this.vignetteColor = '#ff1133';

    // Iluminar el carril de fallo en rojo intenso durante el segundo de gracia
    const failLane = (this.missHighlight && typeof this.missHighlight.lane === 'number') ? this.missHighlight.lane : 1;
    this.laneFlashColors[failLane] = '#ff0033';
    this.laneFlashTimers[failLane] = 1.1;
    this.laneGlows[failLane] = 1.0;

    // Al fallar, las estrellas y medallas alcanzadas no disminuyen
    if (this.ui && typeof this.ui.onScoreUpdate === 'function') {
      this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, this.currentMedalTier, scorePct, accuracyPct);
    }

    // SIEMPRE pausar y mostrar pantalla de muerte si hay notas cargadas
    const hasActiveGame = this.notes && this.notes.length > 0;
    if (hasActiveGame) {
      const penaltyCost = Math.pow(2, this.missCount);
      this.missCount++;
      console.log('[MISS] Delaying death screen 1s to display miss reason. penaltyCost=' + penaltyCost + ' missCount=' + this.missCount + ' score=' + this.score);
      
      // Detener audio inmediatamente para congelar la música
      if (this.sync && this.sync.pause) {
        try { this.sync.pause(); } catch(e) {}
      }

      // Dejar exactamente 1.0s (1000ms) para que el jugador vea en la pista DÓNDE ha fallado
      setTimeout(() => {
        this.pause();
        try {
          if (this.ui && typeof this.ui.onMissPenalty === 'function') {
            this.ui.onMissPenalty(penaltyCost, this.missCount, this.score);
            console.log('[MISS] onMissPenalty callback executed successfully');
          } else {
            console.error('[MISS] onMissPenalty callback NOT available! ui=' + !!this.ui);
            this.isProcessingMiss = false;
          }
        } catch (err) {
          console.error('[MISS] Error in onMissPenalty:', err);
          this.isProcessingMiss = false;
        }
      }, 1000);
    } else {
      console.warn('[MISS] No active game, resetting after 750ms');
      setTimeout(() => {
        this.isProcessingMiss = false;
      }, 750);
    }
  }

  /**
   * Juicio Pop-Up Dinámico sobre el carril impactado:
   * Nace con escala 1.45, se comprime a 1.0 en 90ms (compresión elástica visual),
   * y flota 15px hacia arriba mientras decae suavemente.
   */
  addJudgement(text, color, lane = null) {
    if (!text || !String(text).trim().length) return;
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    const startY = hitY - 24;
    let posX = this.width / 2;
    if (lane !== null && lane >= 0 && lane <= 2) {
      if (this.visualDimension !== '2d') {
        const xL = this.getLaneBoundaryX(lane, startY);
        const xR = this.getLaneBoundaryX(lane + 1, startY);
        posX = (xL + xR) / 2;
      } else {
        posX = (lane + 0.5) * (this.width / 3);
      }
    }
    this.judgements.push({
      text: text,
      color: color || '#fff5db',
      x: posX,
      y: startY,
      baseY: startY,
      alpha: 1.0,
      scale: 1.45,
      age: 0
    });
  }

  getKaraokeWordAtTime(curTimeMs, note = null) {
    if (!this.activeKaraokeLyrics || !this.activeKaraokeLyrics.length) return null;
    for (let i = 0; i < this.activeKaraokeLyrics.length; i++) {
      const l = this.activeKaraokeLyrics[i];
      const nextL = this.activeKaraokeLyrics[i + 1];
      const endMs = nextL ? nextL.timeMs : (l.timeMs + 5000);
      if (curTimeMs >= (l.timeMs - 250) && curTimeMs < endMs) {
        if (l.words && l.words.length > 0) {
          const ratio = Math.max(0, Math.min(1, (curTimeMs - l.timeMs) / Math.max(1, endMs - l.timeMs)));
          const wordIdx = Math.min(l.words.length - 1, Math.floor(ratio * l.words.length));
          return l.words[wordIdx];
        }
        return l.text;
      }
    }
    return null;
  }

  splitWordSyllables(rawWord) {
    const word = String(rawWord || '').trim();
    if (!word) return [];
    const clean = word.replace(/^[^\wáéíóúüñÁÉÍÓÚÜÑ]+|[^\wáéíóúüñÁÉÍÓÚÜÑ]+$/gi, '').toUpperCase();
    if (clean.length <= 2) return [clean || word.toUpperCase()];

    const isVowel = c => /[AEIOUÁÉÍÓÚÜ]/.test(c);
    const isStrong = c => /[AEOÁÉÍÓÚ]/.test(c);

    const syllables = [];
    let currentSyl = '';
    const letters = clean.split('');
    let i = 0;

    while (i < letters.length) {
      currentSyl += letters[i];
      if (i < letters.length - 1 && isVowel(letters[i])) {
        const nextChar = letters[i + 1];
        const afterNext = letters[i + 2];
        const after2 = letters[i + 3];

        if (isVowel(nextChar)) {
          if (isStrong(letters[i]) && isStrong(nextChar)) {
            syllables.push(currentSyl + '-');
            currentSyl = '';
          }
        } else if (!isVowel(nextChar)) {
          if (!afterNext) {
          } else if (isVowel(afterNext)) {
            syllables.push(currentSyl + '-');
            currentSyl = '';
          } else {
            const pair = nextChar + afterNext;
            const inseparable = /^(CH|LL|RR|QU|GU|BL|BR|CL|CR|DR|FL|FR|GL|GR|PL|PR|TR)$/.test(pair);
            if (after2 && isVowel(after2) && inseparable) {
              syllables.push(currentSyl + '-');
              currentSyl = '';
            } else if (afterNext && !after2) {
            } else if (after2 && !isVowel(after2)) {
              currentSyl += nextChar;
              i++;
              syllables.push(currentSyl + '-');
              currentSyl = '';
            } else {
              currentSyl += nextChar;
              i++;
              syllables.push(currentSyl + '-');
              currentSyl = '';
            }
          }
        }
      }
      i++;
    }
    if (currentSyl) syllables.push(currentSyl);
    if (syllables.length > 0) {
      syllables[syllables.length - 1] = syllables[syllables.length - 1].replace(/-+$/, '');
    }
    return syllables.length > 0 ? syllables : [clean];
  }

  distributeKaraokeLyrics(targetNotes, lrcLines) {
    if (!targetNotes || !Array.isArray(targetNotes) || !lrcLines || !Array.isArray(lrcLines) || lrcLines.length === 0) return;

    // Si las notas ya tienen letras y asignaciones válidas (ej. UltraStar con sílabas integradas), no sobreescribir
    const alreadyMapped = targetNotes.some(n => n.lineIdx !== null && n.lineIdx !== undefined && n.lyric && !['♪', '♫', '▲', '~', '-'].includes(String(n.lyric).trim()));
    if (alreadyMapped) {
      return;
    }

    // 1. Limpiar asignaciones previas
    for (let i = 0; i < targetNotes.length; i++) {
      targetNotes[i].lyric = null;
      targetNotes[i].wordIdx = null;
      targetNotes[i].lineIdx = null;
    }

    // 2. Ordenar notas cronológicamente
    targetNotes.sort((a, b) => {
      const tA = Number.isFinite(a.timestamp_ms) ? a.timestamp_ms : (a.timeMs || 0);
      const tB = Number.isFinite(b.timestamp_ms) ? b.timestamp_ms : (b.timeMs || 0);
      return tA - tB;
    });

    const firstLrcTime = lrcLines[0].timeMs;

    // 3. Agrupar notas simultáneas en eventos melódicos ÚNICAMENTE si no son instrumentales
    const rhythmicEvents = [];
    let currentEvent = null;
    for (let i = 0; i < targetNotes.length; i++) {
      const n = targetNotes[i];
      const t = Number.isFinite(n.timestamp_ms) ? n.timestamp_ms : (n.timeMs || 0);

      // BLINDAJE INSTRUMENTAL:
      // Notas marcadas explícitamente como instrumentales o muy anteriores al canto (< firstLrcTime - 1200ms)
      // permanecen 100% instrumentales sin letra.
      const isExplicitInst = Boolean(n.isInstrumental || n.is_instrumental || n.isInst);
      if (isExplicitInst || t < (firstLrcTime - 1200)) {
        continue;
      }

      if (!currentEvent || Math.abs(t - currentEvent.timeMs) > 45) {
        currentEvent = { timeMs: t, notes: [n] };
        rhythmicEvents.push(currentEvent);
      } else {
        currentEvent.notes.push(n);
      }
    }

    let lastAssignedEventIdx = -1;

    // 4. Asignación secuencial musical garantizada SÍLABA A SÍLABA (1 nota = 1 sílaba cantada)
    for (let lIdx = 0; lIdx < lrcLines.length; lIdx++) {
      const line = lrcLines[lIdx];
      const nextLine = lrcLines[lIdx + 1];
      const lineStart = line.timeMs;
      const rawWords = (line.words || (line.text ? line.text.split(/\s+/).filter(Boolean) : []))
        .map(w => String(w).toUpperCase().trim())
        .filter(Boolean);
      if (!rawWords.length) continue;

      line.words = rawWords;
      line.wordTimestamps = [];

      // Descomponer las palabras de la línea en sílabas cantadas exactas
      const lineSyllables = [];
      rawWords.forEach((wText, wIdx) => {
        const syls = this.splitWordSyllables(wText);
        syls.forEach((sText, sIdx) => {
          lineSyllables.push({
            text: sText,
            wordIdx: wIdx,
            isFirstOfWord: sIdx === 0,
            isLastOfWord: sIdx === syls.length - 1,
            fullWord: wText
          });
        });
      });

      let startSearchTime;
      if (lIdx === 0) {
        startSearchTime = (rhythmicEvents.length > 0) ? rhythmicEvents[0].timeMs - 100 : lineStart - 1200;
      } else {
        const minT = (lastAssignedEventIdx >= 0 && lastAssignedEventIdx < rhythmicEvents.length)
          ? rhythmicEvents[lastAssignedEventIdx].timeMs + 80
          : 0;
        startSearchTime = Math.max(minT, lineStart - 800);
      }

      const maxDur = Math.max(1200, lineSyllables.length * 520);
      const endSearchTime = nextLine
        ? Math.min(nextLine.timeMs - 150, lineStart + maxDur + 400)
        : (lineStart + maxDur + 1200);

      const phraseEvents = [];
      for (let eIdx = Math.max(0, lastAssignedEventIdx + 1); eIdx < rhythmicEvents.length; eIdx++) {
        const ev = rhythmicEvents[eIdx];
        if (ev.timeMs >= startSearchTime && ev.timeMs <= endSearchTime) {
          phraseEvents.push({ ev, eIdx });
        } else if (ev.timeMs > endSearchTime) {
          break;
        }
      }

      if (!phraseEvents.length) {
        if (lIdx === 0 && rhythmicEvents.length > 0) {
          const count = Math.min(rhythmicEvents.length, Math.max(lineSyllables.length, 3));
          for (let eIdx = 0; eIdx < count; eIdx++) {
            phraseEvents.push({ ev: rhythmicEvents[eIdx], eIdx });
          }
        } else {
          for (let wIdx = 0; wIdx < rawWords.length; wIdx++) {
            line.wordTimestamps[wIdx] = lineStart + wIdx * 350;
          }
          continue;
        }
      }

      const numEvents = phraseEvents.length;
      const numSyllables = lineSyllables.length;

      if (numEvents >= numSyllables) {
        for (let sIdx = 0; sIdx < numSyllables; sIdx++) {
          const syl = lineSyllables[sIdx];
          const item = phraseEvents[sIdx];
          item.ev.notes[0].lyric = syl.text;
          item.ev.notes[0].wordIdx = syl.wordIdx;
          item.ev.notes[0].lineIdx = lIdx;
          if (syl.isFirstOfWord && line.wordTimestamps[syl.wordIdx] === undefined) {
            line.wordTimestamps[syl.wordIdx] = item.ev.notes[0].timestamp_ms;
          }
          lastAssignedEventIdx = item.eIdx;
        }
      } else {
        // Si hay menos notas que sílabas (sinalefas o canto rápido), agrupar sílabas proporcionalmente
        let sylIdx = 0;
        for (let eIdx = 0; eIdx < numEvents; eIdx++) {
          const item = phraseEvents[eIdx];
          const remainingEvents = numEvents - eIdx;
          const remainingSyls = numSyllables - sylIdx;
          const take = (remainingEvents === 1) ? remainingSyls : Math.max(1, Math.round(remainingSyls / remainingEvents));
          const assignedSyls = lineSyllables.slice(sylIdx, sylIdx + take);
          const combinedText = assignedSyls.map(s => s.text).join('').replace(/-+/g, '-');
          const lastSyl = assignedSyls[assignedSyls.length - 1];

          item.ev.notes[0].lyric = combinedText;
          item.ev.notes[0].wordIdx = lastSyl.wordIdx;
          item.ev.notes[0].lineIdx = lIdx;

          assignedSyls.forEach(s => {
            if (s.isFirstOfWord && line.wordTimestamps[s.wordIdx] === undefined) {
              line.wordTimestamps[s.wordIdx] = item.ev.notes[0].timestamp_ms;
            }
          });

          sylIdx += take;
          lastAssignedEventIdx = item.eIdx;
        }
      }

      // Rellenar timestamps para palabras completas
      for (let wIdx = 0; wIdx < rawWords.length; wIdx++) {
        if (!Number.isFinite(line.wordTimestamps[wIdx])) {
          const prevT = (wIdx > 0 && Number.isFinite(line.wordTimestamps[wIdx - 1]))
            ? line.wordTimestamps[wIdx - 1] + 320
            : lineStart + wIdx * 320;
          line.wordTimestamps[wIdx] = prevT;
        }
      }
    }
  }

    update(dt, frameNow) {
    this._frameNow = frameNow || performance.now();
    this._frameDt = dt || 0.00833;
    if (this.isPaused || this.isRewinding) return;

    // ⚡ Reloj único por frame: se calcula una sola vez y se reutiliza en render()
    let currentTime = this.getCurrentGameTimeMs(this._frameNow);
    this._frameGameTimeMs = currentTime;

    if (this.isCalibrating) {
      const now = this._frameNow;
      const currentCalibTime = (now - this.calibrationStartTime) + this.latencyOffsetMs;
      const interval = this.calibrationIntervalMs || (this.isEffectDemoMode ? 720 : 1200);

      if (now >= this.nextCalibNoteTime) {
        const targetHitTime = currentCalibTime + this.scrollDurationMs;
        const audioCtx = this.synth.ensureContext();
        const delaySec = Math.max(0, (this.scrollDurationMs - this.latencyOffsetMs) / 1000);
        if (audioCtx) this.synth.playPianoChime(audioCtx.currentTime + delaySec);

        const spawnLane = this.isEffectDemoMode
          ? ((this._calibLaneCounter = ((this._calibLaneCounter || 0) + 1) % 3))
          : 1;

        this.notes.push({
          id: Date.now() + Math.random(),
          lane: spawnLane,
          type: 'tap',
          timestamp_ms: targetHitTime,
          timeMs: targetHitTime,
          hit: false,
          missed: false,
          flashed: false
        });

        this.nextCalibNoteTime = now + interval;
      }

      for (const note of this.notes) {
        if (!note.flashed && currentCalibTime >= note.timestamp_ms) {
          note.flashed = true;
          const nLane = note.lane ?? 1;
          this.laneGlows[nLane] = 1.0;
          if (this.isEffectDemoMode && !note.hit) {
            this.triggerLaneInput(nLane, 'tap');
          } else if (this.ui && this.ui.onMetronomeBeat) {
            this.ui.onMetronomeBeat();
          }
        }
      }

      if (this.notes.length > 25) {
        this.notes = this.notes.filter(n => (currentCalibTime - n.timestamp_ms) < 1500);
        this.firstActiveNoteIndex = 0;
      }

      this.updateVisualEffects(dt);
      return;
    }

    if (this.isCountingDown) {
      const elapsed = this._frameNow - this.leadInStartTime;
      if (elapsed >= this.leadInDurationMs) {
        this.isCountingDown = false;
        if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
          try { window.pauseMenuAmbientMusic(); } catch (_) {}
        }
        const startSec = (Number.isFinite(this.beatmapData.startMarkerMs) && this.beatmapData.startMarkerMs > 0)
          ? (this.beatmapData.startMarkerMs / 1000)
          : 0;
        this.sync.seekTo(startSec);
        this.sync.play();
        currentTime = this.getCurrentGameTimeMs(this._frameNow);
        this._frameGameTimeMs = currentTime;
      }
    }

    // Actualización de Teleprompter de Letras en tiempo real (Modo Karaoke)
    if ((!this.activeKaraokeLyrics || this.activeKaraokeLyrics.length === 0) && this.beatmapData && this.beatmapData.activeKaraokeLyrics && this.beatmapData.activeKaraokeLyrics.length > 0) {
      this.activeKaraokeLyrics = this.beatmapData.activeKaraokeLyrics;
    }

    if (typeof window !== 'undefined' && window.isKaraokeModeActive && this.activeKaraokeLyrics && this.activeKaraokeLyrics.length > 0) {
      let curIndex = -1;
      const leadTimeMs = Math.max(900, (this.scrollDurationMs || 1400) * 0.75);
      const startLyricIdx = Math.max(0, (this._lastCurLyricIndex > 0 ? this._lastCurLyricIndex - 1 : 0));
      for (let k = startLyricIdx; k < this.activeKaraokeLyrics.length; k++) {
        const item = this.activeKaraokeLyrics[k];
        const nextItem = this.activeKaraokeLyrics[k + 1];
        const verso = item ? (item.verso || item.syllables || (Array.isArray(item) ? item : [])) : [];

        // Anclar inicio de línea al primer timestamp de la sílaba
        const hasVerso = Array.isArray(verso) && verso.length > 0;
        const lineStart = (hasVerso && Number.isFinite(verso[0].time))
          ? verso[0].time
          : ((item.wordTimestamps && item.wordTimestamps.length > 0 && Number.isFinite(item.wordTimestamps[0])) ? item.wordTimestamps[0] : item.timeMs);

        if (lineStart - leadTimeMs > currentTime + 2000) break;

        // Fin de la estrofa/frase cantada
        const lastSyl = hasVerso ? verso[verso.length - 1] : null;
        const lastNoteTs = (lastSyl && Number.isFinite(lastSyl.time))
          ? (lastSyl.time + (Number(lastSyl.dur) || 350))
          : ((item.wordTimestamps && Number.isFinite(item.wordTimestamps[item.wordTimestamps.length - 1])) ? item.wordTimestamps[item.wordTimestamps.length - 1] : (lineStart + 2500));

        // Inicio de la siguiente estrofa
        const nextVerso = nextItem ? (nextItem.verso || nextItem.syllables || (Array.isArray(nextItem) ? nextItem : [])) : [];
        const nextStart = (Array.isArray(nextVerso) && nextVerso.length > 0 && Number.isFinite(nextVerso[0].time))
          ? nextVerso[0].time
          : ((nextItem && nextItem.wordTimestamps && nextItem.wordTimestamps.length > 0 && Number.isFinite(nextItem.wordTimestamps[0])) ? nextItem.wordTimestamps[0] : (nextItem ? nextItem.timeMs : null));

        const lineEnd = nextStart
          ? Math.min(lastNoteTs + 1200, nextStart - leadTimeMs)
          : (lastNoteTs + 2500);

        if (currentTime >= (lineStart - leadTimeMs) && currentTime < lineEnd) {
          curIndex = k;
          break;
        }
      }

      if (!this._cachedKaraokeEl && typeof document !== 'undefined') {
        this._cachedKaraokeEl = document.getElementById('karaokeCurrentLine');
      }
      const curEl = this._cachedKaraokeEl;

      if (curIndex !== -1 && curIndex !== this._lastCurLyricIndex) {
        this._lastCurLyricIndex = curIndex;
        this.lastLitSyllableIndex = -1;
        const curItem = this.activeKaraokeLyrics[curIndex];
        const verso = curItem ? (curItem.verso || curItem.syllables || (Array.isArray(curItem) ? curItem : [])) : [];

        if (curEl && Array.isArray(verso) && verso.length > 0) {
          if (typeof renderizarVersoKaraoke === 'function') {
            renderizarVersoKaraoke(verso, curEl);
          } else if (typeof window.renderizarVersoKaraoke === 'function') {
            window.renderizarVersoKaraoke(verso, curEl);
          }
        }
      } else if (curIndex === -1 && this._lastCurLyricIndex !== -1) {
        this._lastCurLyricIndex = -1;
        this.lastLitSyllableIndex = -1;
        if (curEl) curEl.innerHTML = '';
      }

      // Iluminación sincronizada de sílabas sin spam al DOM: avanzar lastLitSyllableIndex una sola vez por sílaba
      if (curIndex !== -1 && curEl) {
        const curItem = this.activeKaraokeLyrics[curIndex];
        const verso = curItem ? (curItem.verso || curItem.syllables || (Array.isArray(curItem) ? curItem : [])) : [];
        while (this.lastLitSyllableIndex + 1 < verso.length) {
          const nextSyl = verso[this.lastLitSyllableIndex + 1];
          if (nextSyl && Number.isFinite(nextSyl.time) && currentTime >= nextSyl.time) {
            this.lastLitSyllableIndex++;
            if (typeof iluminarSilaba === 'function') {
              iluminarSilaba(nextSyl.time);
            } else if (typeof window.iluminarSilaba === 'function') {
              window.iluminarSilaba(nextSyl.time);
            }
          } else {
            break;
          }
        }
      }
    }

    // Once a note has passed the hit window (+120ms), it can no longer be hit and is judged MISS
    const exitScreenOffsetMs = 120;
    const notesLen = this.notes.length;

    while (this.firstActiveNoteIndex < notesLen) {
      const pastN = this.notes[this.firstActiveNoteIndex];
      if (!pastN) { this.firstActiveNoteIndex++; continue; }
      const pastT = pastN.end_timestamp_ms || pastN.timestamp_ms || pastN.timeMs || 0;
      if (currentTime - pastT > 450) {
        pastN.holding = false;
        pastN.processed = true;
        this.firstActiveNoteIndex++;
      } else {
        break;
      }
    }

    const startUpdateIdx = Math.min(this.firstActiveNoteIndex, notesLen);
    for (let i = startUpdateIdx; i < notesLen; i++) {
      const note = this.notes[i];
      if (!note || note.hit || note.missed || note.holding || note.processed || note.holdCompleted) continue;

      const noteTime = Number.isFinite(note.timestamp_ms)
        ? note.timestamp_ms
        : (Number.isFinite(note.timeMs)
            ? note.timeMs
            : (Number.isFinite(note.time) ? (note.time > 100 ? note.time : note.time * 1000) : 0));

      // Si la nota está a más de 1200ms en el futuro, no puede haber caído
      if (noteTime - currentTime > 1200) {
        break;
      }

      // En Modo Setas Alucinógenas: durante la transición elegante de inversión de gravedad,
      // auto-completar las notas que cruzan la línea para que sea 100% imposible perder en mitad del giro
      if (this._mushInSafeTransition && currentTime >= noteTime - 25) {
        note.hit = true;
        note.processed = true;
        if (note.type === 'hold') note.holdCompleted = true;
        const autoX = ((note.lane ?? 1) + 0.5) * (this.width / 3);
        const autoY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
        this.judgeHit(note, 10, autoX, autoY, '🍄');
        this.emitKeyHit(autoX, autoY, '#ff00ff', 14);
        continue;
      }

      if (currentTime >= 0 && (currentTime - noteTime >= exitScreenOffsetMs)) {
        note.missed = true;
        note.processed = true;
        note.missHighlight = true;
        this.missHighlight = {
          type: 'note_dropped',
          lane: note.lane,
          note: note,
          time: this._frameNow
        };

        this.synth.playPunchyArcadeMiss();
        this.addJudgement('MISS', '#ff4d4d', note.lane);
        this.handleMiss();
        break;
      }
    }

    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    for (const [lane, active] of this.activeHolds.entries()) {
      const note = active.note;
      const endT = note.end_timestamp_ms || (note.timestamp_ms + (note.duration_ms || 700));
      const hitX = (this.visualDimension !== '2d')
        ? (this.getLaneBoundaryX(lane, hitY) + this.getLaneBoundaryX(lane + 1, hitY)) * 0.5
        : (lane + 0.5) * this.laneWidth;
      const holdColor = (active.color && active.color !== '#00ff88' && active.color !== '#00f2fe') ? active.color : '#ffe082';
      this.laneFlashTimers[lane] = 0.11;

      if (!active._lastSparkTime || (this._frameNow - active._lastSparkTime >= 22)) {
        active._lastSparkTime = this._frameNow;
        this.particles.emitHoldSparks(hitX, hitY, holdColor, 2);
      }
      this.addScore(Math.round(260 * dt * this.multiplier));

      // Keep vignette alive and colored during full_focus holds
      if (this.activeEffect && this.activeEffect.startsWith('full_focus')) {
        this.vignetteColor = holdColor;
        this.vignetteAlpha = Math.max(this.vignetteAlpha, 0.55);
      }

      if (currentTime >= endT) {
        note.holdCompleted = true;
        note.hit = true;
        note.holding = false;
        this.activeHolds.delete(lane);
        this.emitKeyHit(hitX, hitY, holdColor, 35);
        this.addJudgement('HOLD CLEAR!', '#ffe082');
      }
    }

    this.updateVisualEffects(dt);

    if (this.beatmapData && this.notes.length > 0 && !this.isGameOver) {
      const lastNoteTime = this.lastNoteTime || 0;
      const hasExplicitEnd = Number.isFinite(this.beatmapData.endMarkerMs) && this.beatmapData.endMarkerMs > 0;
      const endLimitMs = hasExplicitEnd
        ? this.beatmapData.endMarkerMs
        : (Number.isFinite(this.beatmapData.endTimestampMs) && this.beatmapData.endTimestampMs > 0
            ? this.beatmapData.endTimestampMs
            : (lastNoteTime + 1400));

      const isPastEnd = currentTime >= endLimitMs;
      const isPastLastNote = !hasExplicitEnd && (currentTime > (lastNoteTime + 1400));
      const isAudioFinished = this.sync.duration > 0 && (currentTime / 1000 >= this.sync.duration - 0.25);

      if (isPastEnd || isPastLastNote || isAudioFinished) {
        this.triggerGameEnd();
      }
    }
  }

  triggerGameEnd() {
    if (this.isGameOver || !this.beatmapData) return;
    this.isGameOver = true;
    this.isRunning = false;
    this.isPaused = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.sync.pause();

    const totalNotes = (this.notes && this.notes.length) || 0;
    const maxScore = Math.max(1, this.maxPossibleScore || 1);
    const scorePct = Math.min(100.0, Math.max(0.0, (this.score / maxScore) * 100));

    // Precisión de impacto física:
    const totalJudged = (this.stats.perfectPlus || 0) + (this.stats.perfect || 0) + (this.stats.great || 0) + (this.stats.good || 0) + (this.stats.miss || 0);
    const accuracyPct = totalJudged > 0
      ? Math.min(100.0, Math.max(0.0, (((this.stats.perfectPlus * 100) + (this.stats.perfect * 80) + (this.stats.great * 50) + ((this.stats.good || 0) * 25)) / (totalJudged * 100)) * 100))
      : 100.0;

    // La evaluación de estrellas y medallas se rige ESTRICTAMENTE por scorePct:
    // 5★: >= 90% | 4★: >= 75% | 3★: >= 60% | 2★: >= 40% | 1★: >= 20%
    let stars = 0;
    if (scorePct >= 90.0) {
      stars = 5;
    } else if (scorePct >= 75.0) {
      stars = 4;
    } else if (scorePct >= 60.0) {
      stars = 3;
    } else if (scorePct >= 40.0) {
      stars = 2;
    } else if (scorePct >= 20.0) {
      stars = 1;
    }
    this.stars = Math.max(this.stars, stars);

    // Medallas: Requiere un mínimo de 100 notas en la pista
    // Plata: >= 92% | Oro: >= 94% | Platino: >= 96%
    let finalMedal = null;
    const earnedMedals = { silver: 0, gold: 0, platinum: 0 };
    if (totalNotes >= 100) {
      if (scorePct >= 96.0) {
        finalMedal = 'platinum';
        earnedMedals.platinum = 1;
        earnedMedals.gold = 1;
        earnedMedals.silver = 1;
      } else if (scorePct >= 94.0) {
        finalMedal = 'gold';
        earnedMedals.gold = 1;
        earnedMedals.silver = 1;
      } else if (scorePct >= 92.0) {
        finalMedal = 'silver';
        earnedMedals.silver = 1;
      }
    }
    this.currentMedalTier = finalMedal;

    // Claves (Clefs) según fórmula solicitada: puntuación * 0.00001 * dificultad (estrellas, máximo x7) con x2 en destacadas
    const rawDiffStars = Number(this.beatmapData?.metadata?.stars || this.beatmapData?.stars || this.stars || 3.0);
    const diffMultiplier = Math.min(7, Math.max(1, Math.round(rawDiffStars * 10) / 10));
    const baseScoreClefs = Math.floor((this.score || 0) * 0.00001);
    const isFeatured = !!(
      this.beatmapData?.is_daily_featured || 
      this.beatmapData?.metadata?.is_daily_featured || 
      (typeof window !== 'undefined' && (window.currentActiveBeatmap?.is_daily_featured || window.currentActiveBeatmap?.metadata?.is_daily_featured || window.currentFeaturedSongX2))
    );
    const isStormX2 = Boolean(
      this.isStormModeActive ||
      this.isMushroomModeActive ||
      (typeof window !== 'undefined' && (window.isStormModeActive || window.isMushroomModeActive))
    );
    const clefMultiplier = (isFeatured ? 2 : 1) * (isStormX2 ? 2 : 1);
    const earnedClefs = Math.max(1, Math.round(baseScoreClefs * diffMultiplier)) * clefMultiplier;

    // Consumir inmediatamente el multiplicador x2 de tragaperras para que NO afecte a partidas posteriores
    if (typeof window !== 'undefined') {
      window.currentFeaturedSongX2 = false;
    }

    // Adjuntar telemetría de sincronización de impacto en stats para el informe y auto-calibración
    const ts = this.timingStats || { count: 0, sumSignedMs: 0, sumAbsMs: 0, earlyCount: 0, lateCount: 0, exactCount: 0 };
    this.stats.timing = {
      count: ts.count,
      avgSignedMs: ts.count > 0 ? Math.round((ts.sumSignedMs / ts.count) * 10) / 10 : 0,
      avgAbsMs: ts.count > 0 ? Math.round((ts.sumAbsMs / ts.count) * 10) / 10 : 0,
      earlyCount: ts.earlyCount,
      lateCount: ts.lateCount,
      exactCount: ts.exactCount
    };

    if (this.ui && this.ui.onGameEnd) {
      this.ui.onGameEnd(this.score, this.maxCombo, this.stars, this.stats, earnedClefs, finalMedal, scorePct, earnedMedals, totalNotes, accuracyPct);
    }
  }

  updateVisualEffects(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration = Math.max(0, this.shakeDuration - dt);
    }

    // Efecto blanco de Overdrive en X4 desactivado completamente para mantener la pista limpia y contrastada
    this.overdriveLevel = 0;
    this.overdriveFlash = 0;
    this._wasOverdrive = false;

    if (typeof this.displayScore !== 'number') this.displayScore = 0;
    if (Math.abs(this.displayScore - this.score) > 0.5) {
      this.displayScore += (this.score - this.displayScore) * 0.20;
    } else {
      this.displayScore = this.score;
    }

    // Física de la Bola de Discoteca (Aparece y desciende ÚNICAMENTE a partir de combo 200)
    if (this.discoBall) {
      const is200Combo = (this.combo >= 200);
      if (is200Combo) {
        this.discoBall.active = true;
        this.discoBall.targetY = 86; // Posición suspendida bajo el contador de estrellas
      } else {
        this.discoBall.targetY = -120; // Asciende y se oculta en el techo
      }

      if (this.discoBall.descendY < this.discoBall.targetY) {
        this.discoBall.descendY += (this.discoBall.targetY - this.discoBall.descendY) * Math.min(1, dt * 2.8);
      } else if (this.discoBall.descendY > this.discoBall.targetY) {
        this.discoBall.descendY += (this.discoBall.targetY - this.discoBall.descendY) * Math.min(1, dt * 4.2);
      }

      if (!is200Combo && this.discoBall.descendY <= -105) {
        this.discoBall.active = false;
      }

      if (this.discoBall.active || this.discoBall.descendY > -100) {
        const activeBpm = this.currentBpm || (this.beatmapData && this.beatmapData.metadata ? this.beatmapData.metadata.bpm : 128) || 128;
        const bpmFactor = activeBpm / 120;
        this.discoBall.rotation += this.discoBall.rotSpeed * dt * (0.85 + 0.40 * bpmFactor);
      }
    }

    // Actualizar Explosiones 3D Cinemáticas y Partículas en Profundidad
    if (this.combo3DExplosions && this.combo3DExplosions.length > 0) {
      for (let i = this.combo3DExplosions.length - 1; i >= 0; i--) {
        const exp = this.combo3DExplosions[i];
        exp.age += dt;
        exp.radius += (exp.maxRadius - exp.radius) * 4.2 * dt;
        exp.rotation += 0.65 * dt;

        // Rebote elástico del rótulo 3D
        if (exp.age < 0.18) {
          const p = exp.age / 0.18;
          exp.scale = 1.0 + 0.70 * Math.cos(p * Math.PI * 0.5);
        } else {
          exp.scale = 1.0 + 0.04 * Math.sin((exp.age - 0.18) * 3.5);
        }

        if (exp.age > exp.duration - 0.45) {
          exp.alpha = Math.max(0, (exp.duration - exp.age) / 0.45);
        }

        // Simulación 3D de chispas
        if (exp.sparks) {
          for (let s = exp.sparks.length - 1; s >= 0; s--) {
            const sp = exp.sparks[s];
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.z += (sp.vz || 0) * dt;
            sp.vy += 140 * dt;
            sp.rot += (sp.rotSpeed || 0) * dt;
            sp.alpha -= (sp.decay || 2.0) * dt;
            if (sp.alpha <= 0) exp.sparks.splice(s, 1);
          }
        }

        if (exp.age >= exp.duration) {
          if (this.topComboToast === exp) this.topComboToast = null;
          this.combo3DExplosions.splice(i, 1);
        }
      }
    }

    // Progresión de transición de color ambiental de la atmósfera
    if (this.atmosphereShiftProgress < 1.0) {
      this.atmosphereShiftProgress = Math.min(1.0, this.atmosphereShiftProgress + dt * 1.8);
    }

    for (let l = 0; l < 3; l++) {
      this.laneGlows[l] = Math.max(0, (this.laneGlows[l] || 0) - dt * 4.0);
      if (this.laneFlashTimers[l] > 0) {
        this.laneFlashTimers[l] = Math.max(0, this.laneFlashTimers[l] - dt);
      }
    }

    for (let i = this.judgements.length - 1; i >= 0; i--) {
      const j = this.judgements[i];
      j.age += dt;
      // Compresión elástica visual: nace en 1.45 y se comprime a 1.0 en 90ms (0.09s)
      if (j.age < 0.09) {
        const p = j.age / 0.09;
        j.scale = 1.0 + 0.45 * Math.cos(p * Math.PI * 0.5);
      } else {
        j.scale = 1.0;
        j.alpha -= dt * 2.8;
      }
      // Flota 15px hacia arriba mientras decae la opacidad
      j.y = j.baseY - Math.min(15, (j.age / 0.35) * 15);
      if (j.alpha <= 0) this.judgements.splice(i, 1);
    }

    for (let i = this.fxRipples.length - 1; i >= 0; i--) {
      const r = this.fxRipples[i];
      r.radius += (r.maxRadius - r.radius) * 7.5 * dt;
      r.alpha -= r.decay * dt;
      if (r.alpha <= 0) this.fxRipples.splice(i, 1);
    }

    for (let i = this.bgBursts.length - 1; i >= 0; i--) {
      const b = this.bgBursts[i];
      b.age = (b.age || 0) + dt;
      b.radius += (b.maxRadius - b.radius) * 5.5 * dt;
      if (b.rotation !== undefined) {
        b.rotation += (b.rotSpeed || 0) * dt;
      }
      b.alpha -= b.decay * dt;
      if (b.alpha <= 0) this.bgBursts.splice(i, 1);
    }

    if (this.vignetteAlpha > 0.001) {
      this.vignetteAlpha = Math.max(0, this.vignetteAlpha - dt * 3.2);
    }

    if (this.reactiveLightBoost > 0.001) {
      this.reactiveLightBoost = Math.max(0, this.reactiveLightBoost - dt * 1.5);
    }

    for (let i = this.musicalNotes.length - 1; i >= 0; i--) {
      const mn = this.musicalNotes[i];
      mn.wobble += dt * 5.0;
      mn.x += (mn.vx + Math.sin(mn.wobble) * 22) * dt;
      mn.y += mn.vy * dt;
      mn.vy += 30 * dt;
      mn.rot += mn.rotSpeed * dt;
      mn.alpha -= mn.decay * dt;
      mn.scale += dt * 0.15;
      if (mn.alpha <= 0) this.musicalNotes.splice(i, 1);
    }

    this.particles.update(dt);
  }

  /**
   * Canvas Background & Concert Atmosphere:
   * Fondos atmosféricos dinámicos de estadio con iluminación volumétrica,
   * focos móviles, estelas de velocidad en perspectiva y apoteosis reactiva al BPM y multiplicador.
   */

  // =========================================================================
  // SYNTHESIZER EQUALIZER STRIPES WITH LARGE COLORED BLOCKS
  // Abarcan desde el 75% hasta arriba del todo, más largas arriba, reactivas a teclas
  // =========================================================================
  getEffectBorderTheme(fxRaw) {
    const fx = this.normalizeEffectId(fxRaw || this.activeEffect);
    const THEMES = {
      solar_inferno: {
        id: 'solar_inferno',
        cCore: '#ffffff',
        cInner: '#fde047',
        cMid: '#f97316',
        cOuter: '#dc2626',
        cDeep: '#7f1d1d',
        blocks: ['#7f1d1d', '#b91c1c', '#dc2626', '#ea580c', '#f97316', '#facc15', '#fde047']
      },
      cryo_blizzard: {
        id: 'cryo_blizzard',
        cCore: '#ffffff',
        cInner: '#e0f2fe',
        cMid: '#38bdf8',
        cOuter: '#0284c7',
        cDeep: '#0c4a6e',
        blocks: ['#0c4a6e', '#075985', '#0369a1', '#0284c7', '#38bdf8', '#7dd3fc', '#bae6fd']
      },
      cyber_neon: {
        id: 'cyber_neon',
        cCore: '#ffffff',
        cInner: '#00f2fe',
        cMid: '#ff007f',
        cOuter: '#a855f7',
        cDeep: '#3b0764',
        blocks: ['#4c1d95', '#7e22ce', '#a855f7', '#db2777', '#ff007f', '#06b6d4', '#00f2fe']
      },
      grand_fireworks: {
        id: 'grand_fireworks',
        cCore: '#ffffff',
        cInner: '#fde047',
        cMid: '#ff007f',
        cOuter: '#00f2fe',
        cDeep: '#39ff14',
        blocks: ['#be185d', '#ff007f', '#f59e0b', '#fde047', '#39ff14', '#00f2fe', '#e879f9']
      },
      zeus_lightning: {
        id: 'zeus_lightning',
        cCore: '#ffffff',
        cInner: '#bae6fd',
        cMid: '#38bdf8',
        cOuter: '#6366f1',
        cDeep: '#1e1b4b',
        blocks: ['#1e1b4b', '#312e81', '#4338ca', '#6366f1', '#38bdf8', '#7dd3fc', '#e0f2fe']
      },
      deep_cosmos: {
        id: 'deep_cosmos',
        cCore: '#ffffff',
        cInner: '#f472b6',
        cMid: '#a855f7',
        cOuter: '#06b6d4',
        cDeep: '#2e1065',
        blocks: ['#2e1065', '#4c1d95', '#6d28d9', '#9333ea', '#c084fc', '#f472b6', '#22d3ee']
      },
      asteroid_impact: {
        id: 'asteroid_impact',
        cCore: '#ffffff',
        cInner: '#facc15',
        cMid: '#ea580c',
        cOuter: '#b91c1c',
        cDeep: '#451a03',
        blocks: ['#451a03', '#7c2d12', '#991b1b', '#dc2626', '#ea580c', '#f59e0b', '#fde047']
      },
      black_hole: {
        id: 'black_hole',
        cCore: '#ffffff',
        cInner: '#fde047',
        cMid: '#f97316',
        cOuter: '#db2777',
        cDeep: '#4c1d95',
        blocks: ['#2e1065', '#581c87', '#831843', '#be185d', '#ea580c', '#f97316', '#fde047']
      },
      dragon_fire: {
        id: 'dragon_fire',
        cCore: '#ffffff',
        cInner: '#fde047',
        cMid: '#10b981',
        cOuter: '#047857',
        cDeep: '#064e3b',
        blocks: ['#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#fde047']
      },
      aurora_borealis: {
        id: 'aurora_borealis',
        cCore: '#ffffff',
        cInner: '#34d399',
        cMid: '#06b6d4',
        cOuter: '#8b5cf6',
        cDeep: '#f43f5e',
        blocks: ['#4c1d95', '#7c3aed', '#0891b2', '#06b6d4', '#10b981', '#34d399', '#a7f3d0']
      },
      supernova_burst: {
        id: 'supernova_burst',
        cCore: '#ffffff',
        cInner: '#fde047',
        cMid: '#ff007f',
        cOuter: '#00f2fe',
        cDeep: '#701a75',
        blocks: ['#701a75', '#a21caf', '#db2777', '#ff007f', '#f59e0b', '#fde047', '#00f2fe']
      },
      quantum_prism: {
        id: 'quantum_prism',
        cCore: '#ffffff',
        cInner: '#39ff14',
        cMid: '#00f2fe',
        cOuter: '#a855f7',
        cDeep: '#0f172a',
        blocks: ['#1e1b4b', '#581c87', '#7e22ce', '#0369a1', '#00f2fe', '#22c55e', '#39ff14']
      }
    };
    return THEMES[fx] || THEMES.solar_inferno;
  }

  renderEqualizerBorders(ctx, w, h, currentTime, bpmSpeed, beatPulse, mult) {
    if (!this.borderEqLeftSurges) this.borderEqLeftSurges = new Float32Array(16);
    if (!this.borderEqRightSurges) this.borderEqRightSurges = new Float32Array(16);

    const frameScale = Math.min(2.5, (this._frameDt || 0.00833) * 60);
    const decayStep = 0.036 * frameScale;
    const numBars = 12;
    let avgSurgeL = 0;
    let avgSurgeR = 0;
    for (let i = 0; i < numBars; i++) {
      if (this.borderEqLeftSurges[i] > 0) {
        this.borderEqLeftSurges[i] = Math.max(0, this.borderEqLeftSurges[i] - decayStep);
      }
      if (this.borderEqRightSurges[i] > 0) {
        this.borderEqRightSurges[i] = Math.max(0, this.borderEqRightSurges[i] - decayStep);
      }
      avgSurgeL += this.borderEqLeftSurges[i];
      avgSurgeR += this.borderEqRightSurges[i];
    }
    avgSurgeL /= numBars;
    avgSurgeR /= numBars;

    const theme = this.getEffectBorderTheme(this.activeEffect);
    const fx = theme.id;
    const blockPalette = theme.blocks;
    const palLen = blockPalette.length;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const timeSec = (this._frameNow || performance.now()) * 0.001;
    const waveT = timeSec * 1.65;

    // 0. DIFUMINADO ATMOSFÉRICO SUPERIOR EN LOS BORDES (Pre-cacheado por dimensión y efecto: 0 allocs/frame)
    const topZoneY = h * 0.20;
    const leftBloomR = Math.max(85, w * 0.34);
    const cacheKey = `${w}_${h}_${fx}`;
    if (!this._eqGradCache || this._eqGradCache.key !== cacheKey) {
      const lBloom = ctx.createRadialGradient(w * 0.08, topZoneY, 4, w * 0.08, topZoneY, leftBloomR);
      lBloom.addColorStop(0.0, hexToRgba(theme.cMid, 0.36));
      lBloom.addColorStop(0.55, hexToRgba(theme.cOuter, 0.16));
      lBloom.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      const rBloom = ctx.createRadialGradient(w * 0.92, topZoneY, 4, w * 0.92, topZoneY, leftBloomR);
      rBloom.addColorStop(0.0, hexToRgba(theme.cMid, 0.36));
      rBloom.addColorStop(0.55, hexToRgba(theme.cOuter, 0.16));
      rBloom.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      const lRib = ctx.createLinearGradient(4, 0, w * 0.36, 0);
      lRib.addColorStop(0.0, hexToRgba(theme.cOuter, 0.42));
      lRib.addColorStop(0.7, hexToRgba(theme.cInner, 0.24));
      lRib.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      const rRib = ctx.createLinearGradient(w - 4, 0, w * 0.64, 0);
      rRib.addColorStop(0.0, hexToRgba(theme.cOuter, 0.42));
      rRib.addColorStop(0.7, hexToRgba(theme.cInner, 0.24));
      rRib.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      this._eqGradCache = { key: cacheKey, lBloom, rBloom, lRib, rRib };
    }

    ctx.globalAlpha = Math.min(1.0, 0.65 + avgSurgeL * 0.55 + beatPulse * 0.25);
    ctx.fillStyle = this._eqGradCache.lBloom;
    ctx.fillRect(0, 0, w * 0.45, h * 0.45);

    ctx.globalAlpha = Math.min(1.0, 0.65 + avgSurgeR * 0.55 + beatPulse * 0.25);
    ctx.fillStyle = this._eqGradCache.rBloom;
    ctx.fillRect(w * 0.55, 0, w * 0.45, h * 0.45);
    ctx.globalAlpha = 1.0;

    const blockW = 11.5;
    const blockH = 7.6;
    const blockGap = 1.6;

    const renderSideEqualizerZone = (isLeft) => {
      let prevPeakX = null;
      let prevPeakY = null;
      const cachedRibGrad = isLeft ? this._eqGradCache.lRib : this._eqGradCache.rRib;

      for (let i = 0; i < numBars; i++) {
        const frac = i / (numBars - 1);
        const y = h * (0.04 + frac * 0.33);
        const trackEdgeX = isLeft
          ? (this.getLaneBoundaryX(0, y) - 7)
          : (this.getLaneBoundaryX(3, y) + 7);
        const outerEdgeX = isLeft ? 4 : (w - 4);
        const availW = Math.max(14, isLeft ? (trackEdgeX - outerEdgeX) : (outerEdgeX - trackEdgeX));
        const totalPossibleBlocks = Math.max(2, Math.floor((availW + blockGap) / (blockW + blockGap)));

        const phaseShift = isLeft ? 0 : 1.85;
        const organicRand = 0.62
          + 0.26 * Math.sin(i * 3.1 + waveT + phaseShift)
          + 0.18 * Math.cos(i * 5.7 - waveT * 0.8 + phaseShift)
          + 0.14 * Math.sin((i + mult) * 2.1 + waveT * 1.4);
        const slopeFactor = 1.0 - (frac * 0.35);
        const rowMaxBlocks = Math.max(2, Math.round(totalPossibleBlocks * Math.max(0.32, Math.min(1.0, slopeFactor * organicRand))));

        const surge = (isLeft ? this.borderEqLeftSurges[i] : this.borderEqRightSurges[i]) || 0;
        const beatDrive = 0.25 + beatPulse * 0.35;
        const effectiveDrive = Math.min(1.0, Math.max(beatDrive * 0.65, surge));
        const activeBlocks = Math.max(1, Math.min(rowMaxBlocks, Math.round(1 + effectiveDrive * (rowMaxBlocks - 1))));
        const rowSpanPx = activeBlocks * (blockW + blockGap);

        // 1. Cinta difuminada de fondo por cada fila (0 allocs/frame)
        const rowStartX = outerEdgeX;
        const rowEndX = isLeft ? (outerEdgeX + rowSpanPx + 14) : (outerEdgeX - rowSpanPx - 14);
        ctx.globalAlpha = 0.55 + effectiveDrive * 0.45;
        ctx.fillStyle = cachedRibGrad;
        ctx.fillRect(
          Math.min(rowStartX, rowEndX),
          y - blockH * 0.85,
          Math.abs(rowEndX - rowStartX),
          blockH * 1.7
        );

        // 2. Cuadraditos con degradado temático del efecto activo (fillRect directo para máximo rendimiento GPU)
        const alphaBase = 0.26 + effectiveDrive * 0.62;
        for (let b = 0; b < activeBlocks; b++) {
          const bx = isLeft
            ? (outerEdgeX + b * (blockW + blockGap))
            : (outerEdgeX - (b + 1) * (blockW + blockGap));
          const colIdx = Math.min(palLen - 1, Math.floor((b / Math.max(1, rowMaxBlocks - 1)) * palLen));
          ctx.fillStyle = blockPalette[colIdx];
          ctx.globalAlpha = (b === 0 && surge <= 0.02) ? 0.28 : alphaBase;
          ctx.fillRect(bx, y - blockH / 2, blockW, blockH);
        }

        // Coordenada de la punta activa (Peak) de esta fila superior
        const peakX = isLeft
          ? (outerEdgeX + (activeBlocks - 1) * (blockW + blockGap) + blockW * 0.5)
          : (outerEdgeX - (activeBlocks - 1) * (blockW + blockGap) - blockW * 0.5);
        const dirSign = isLeft ? 1 : -1;

        // 3. Punta incandescente en el extremo de cada fila
        ctx.globalAlpha = Math.min(0.95, 0.45 + effectiveDrive * 0.55);
        ctx.fillStyle = theme.cCore;
        ctx.fillRect(peakX - blockW * 0.5, y - blockH / 2, blockW, blockH);

        // 4. FENÓMENO COMPLEMENTARIO EN LA PARTE SUPERIOR SEGÚN EL EFECTO ACTIVO (0 Gradient Allocs)
        if (fx === 'solar_inferno' || fx === 'dragon_fire') {
          const flameLen = (10 + effectiveDrive * 22) * (1 + 0.25 * Math.sin(timeSec * 11 + i * 1.7));
          const flameLift = -6 - 5 * Math.cos(timeSec * 9 + i);
          ctx.fillStyle = theme.cMid;
          ctx.globalAlpha = 0.68;
          ctx.beginPath();
          ctx.moveTo(peakX, y - blockH * 0.65);
          ctx.quadraticCurveTo(
            peakX + dirSign * flameLen * 0.65,
            y - blockH * 0.9 + flameLift * 0.5,
            peakX + dirSign * flameLen,
            y + flameLift
          );
          ctx.quadraticCurveTo(
            peakX + dirSign * flameLen * 0.55,
            y + blockH * 0.75,
            peakX,
            y + blockH * 0.65
          );
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = theme.cInner;
          ctx.globalAlpha = 0.82;
          ctx.beginPath();
          ctx.moveTo(peakX, y - blockH * 0.35);
          ctx.lineTo(peakX + dirSign * flameLen * 0.58, y + flameLift * 0.55);
          ctx.lineTo(peakX, y + blockH * 0.35);
          ctx.closePath();
          ctx.fill();
        } else if (fx === 'cryo_blizzard') {
          const spikeLen = 9 + effectiveDrive * 18;
          ctx.fillStyle = theme.cInner;
          ctx.globalAlpha = 0.80;
          ctx.beginPath();
          ctx.moveTo(peakX, y - blockH * 0.55);
          ctx.lineTo(peakX + dirSign * spikeLen, y);
          ctx.lineTo(peakX, y + blockH * 0.55);
          ctx.closePath();
          ctx.fill();
        } else if (fx === 'zeus_lightning' && prevPeakX !== null) {
          const midArcX = (prevPeakX + peakX) * 0.5 + Math.sin(timeSec * 28 + i * 3.1) * 7;
          const midArcY = (prevPeakY + y) * 0.5;
          ctx.strokeStyle = theme.cMid;
          ctx.lineWidth = 2.6;
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          ctx.moveTo(prevPeakX, prevPeakY);
          ctx.lineTo(midArcX, midArcY);
          ctx.lineTo(peakX, y);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.1;
          ctx.stroke();
        } else if (fx === 'grand_fireworks' || fx === 'supernova_burst') {
          if (i % 2 === 0) {
            const starR = 5 + effectiveDrive * 9;
            ctx.strokeStyle = i % 4 === 0 ? theme.cInner : theme.cMid;
            ctx.lineWidth = 1.8;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.moveTo(peakX - starR, y);
            ctx.lineTo(peakX + starR, y);
            ctx.moveTo(peakX, y - starR);
            ctx.lineTo(peakX, y + starR);
            ctx.stroke();
          }
        } else if (fx === 'aurora_borealis' || fx === 'deep_cosmos' || fx === 'cyber_neon') {
          if (prevPeakX !== null) {
            ctx.strokeStyle = i % 2 === 0 ? theme.cInner : theme.cMid;
            ctx.lineWidth = 2.2;
            ctx.globalAlpha = 0.62;
            ctx.beginPath();
            ctx.moveTo(prevPeakX, prevPeakY);
            ctx.quadraticCurveTo(
              (prevPeakX + peakX) * 0.5 + dirSign * 6 * Math.sin(timeSec * 5 + i),
              (prevPeakY + y) * 0.5,
              peakX,
              y
            );
            ctx.stroke();
          }
        } else if (fx === 'quantum_prism' && i % 2 === 0) {
          const cSz = 5 + effectiveDrive * 5;
          ctx.save();
          ctx.translate(peakX + dirSign * 6, y);
          ctx.rotate(timeSec * 2.5 + i);
          ctx.strokeStyle = theme.cInner;
          ctx.lineWidth = 1.4;
          ctx.globalAlpha = 0.82;
          ctx.strokeRect(-cSz * 0.5, -cSz * 0.5, cSz, cSz);
          ctx.restore();
        }

        prevPeakX = peakX;
        prevPeakY = y;
      }
    };

    renderSideEqualizerZone(true);
    renderSideEqualizerZone(false);

    ctx.restore();
  }

  renderBackgroundFX(currentTime) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!w || !h) return;

    const horizY = Math.max(14, h * 0.035);
    const safePerfNow = this._frameNow || performance.now();

    const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : { primary: '#c5a059', secondary: '#ede5d8', glow: '#c5a059', ribs: '#e5b869', spotlight1: '#c5a059', spotlight2: '#8c6d23', spark: '#fff3cf' });

    const mult = this.multiplier || 1;
    const rawBpm = (this.beatmapData && this.beatmapData.bpm) ? Math.max(40, this.beatmapData.bpm) : (this.bpm || 120);
    let normBpm = rawBpm;
    while (normBpm > 175) normBpm /= 2;
    while (normBpm < 75) normBpm *= 2;
    const beatInterval = 60 / normBpm;
    const audioTime = (currentTime >= 0 ? currentTime : safePerfNow) / 1000;
    const beatFraction = ((audioTime % beatInterval) + beatInterval) % beatInterval / beatInterval;
    const beatPulse = Math.pow(Math.max(0, 1 - beatFraction), 2.8);


    // 0. IMAGEN DE FONDO PERSONALIZADA DE LA CANCIÓN
    const customBgSrc = this.beatmapData && (this.beatmapData.background_image || this.beatmapData.bg_image || (this.beatmapData.metadata && (this.beatmapData.metadata.background_image || this.beatmapData.metadata.bg_image)));
    if (customBgSrc) {
      if (!this.cachedCustomBgImg || this.cachedCustomBgSrc !== customBgSrc) {
        this.cachedCustomBgSrc = customBgSrc;
        this.cachedCustomBgImg = new Image();
        this.cachedCustomBgImg.crossOrigin = 'anonymous';
        this.cachedCustomBgImg.src = customBgSrc;
      }
      if (this.cachedCustomBgImg && this.cachedCustomBgImg.complete && this.cachedCustomBgImg.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = 0.40;
        const imgW = this.cachedCustomBgImg.naturalWidth;
        const imgH = this.cachedCustomBgImg.naturalHeight;
        const s = Math.max(w / imgW, h / imgH);
        const dw = imgW * s;
        const dh = imgH * s;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(this.cachedCustomBgImg, dx, dy, dw, dh);
        ctx.restore();
      }
    }

    // 1. GRADIENTE ATMOSFÉRICO DE ESTADIO SEGÚN MULTIPLICADOR (Con margen anti-artefactos de shake)
    const bgGradIdx = mult >= 5 ? 4 : Math.max(0, mult - 1);
    ctx.fillStyle = (this._bgGrads && this._bgGrads[bgGradIdx]) ? this._bgGrads[bgGradIdx] : '#0e081e';
    ctx.fillRect(-20, -20, w + 40, h + 40);

    // 1b. Fondo personalizado si está activo
    if (this.customBgMode === 'static' && this.customBgMedia) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.05, Math.min(0.9, this.customBgOpacity || 0.40));
      this.drawCoverMedia(ctx, this.customBgMedia, w, h);
      ctx.restore();
    }

    // Intensidades y velocidad según multiplicador (sin blanquear la escena en X4/X5)
    let stageIntensity = 0.65;
    let swingFreq = 0.0011;
    let beamColor1 = palette.spotlight1 || '#9b51e0';
    let beamColor2 = palette.spotlight2 || '#ff5964';

    if (mult === 2) {
      stageIntensity = 0.80;
      swingFreq = 0.0014;
      beamColor1 = '#ffd700';
      beamColor2 = '#ff9900';
    } else if (mult === 3) {
      stageIntensity = 0.90;
      swingFreq = 0.0018;
      beamColor1 = '#ff007f';
      beamColor2 = '#d946ef';
    } else if (mult === 4) {
      stageIntensity = 0.95;
      swingFreq = 0.0020;
      beamColor1 = '#00b4d8';
      beamColor2 = '#7c3aed';
    } else if (mult >= 5) {
      stageIntensity = 1.00;
      swingFreq = 0.0022;
      beamColor1 = '#a855f7';
      beamColor2 = '#ffd700';
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 2. RAYAS DE SINTETIZADOR CON CUADRADITOS (75% hasta arriba, reactivas a teclas)
    const bpmSpeedVal = (this.currentBpm || 120);
    this.renderEqualizerBorders(ctx, w, h, currentTime, bpmSpeedVal, beatPulse, mult);

    // 3. FOCOS ZENITALES MÓVILES VOLUMÉTRICOS (Fase continua monotónica sin saltos)
    // Foco Izquierdo
    const spot1BaseX = w * 0.15;
    const spot1Swing = Math.sin(safePerfNow * swingFreq) * (w * 0.45);
    const spot1TargetX = (w * 0.50) + spot1Swing;
    const spot1TargetY = h * 0.90;

    ctx.fillStyle = hexToRgba(beamColor1, 0.10 * stageIntensity);
    ctx.beginPath();
    ctx.moveTo(spot1BaseX - 30, -10);
    ctx.lineTo(spot1BaseX + 30, -10);
    ctx.lineTo(spot1TargetX + (w * 0.22 * (1 + beatPulse * 0.16)), spot1TargetY);
    ctx.lineTo(spot1TargetX - (w * 0.22 * (1 + beatPulse * 0.16)), spot1TargetY);
    ctx.closePath();
    ctx.fill();

    // Foco Derecho
    const spot2BaseX = w * 0.85;
    const spot2Swing = Math.sin(safePerfNow * swingFreq + 1.4) * (w * 0.45);
    const spot2TargetX = (w * 0.50) - spot2Swing;
    const spot2TargetY = h * 0.90;

    ctx.fillStyle = hexToRgba(beamColor2, 0.10 * stageIntensity);
    ctx.beginPath();
    ctx.moveTo(spot2BaseX - 30, -10);
    ctx.lineTo(spot2BaseX + 30, -10);
    ctx.lineTo(spot2TargetX + (w * 0.22 * (1 + beatPulse * 0.16)), spot2TargetY);
    ctx.lineTo(spot2TargetX - (w * 0.22 * (1 + beatPulse * 0.16)), spot2TargetY);
    ctx.closePath();
    ctx.fill();

    // Focos adicionales en combo alto (3x, 4x, 5x)
    if (mult >= 3) {
      const spot3BaseX = w * 0.50;
      const spot3Swing = Math.cos(safePerfNow * swingFreq * 1.3) * (w * 0.40);
      const spot3TargetX = (w * 0.50) + spot3Swing;
      const spot3TargetY = h * 0.92;

      ctx.fillStyle = hexToRgba(beamColor1, 0.08 * stageIntensity);
      ctx.beginPath();
      ctx.moveTo(spot3BaseX - 20, -10);
      ctx.lineTo(spot3BaseX + 20, -10);
      ctx.lineTo(spot3TargetX + (w * 0.16), spot3TargetY);
      ctx.lineTo(spot3TargetX - (w * 0.16), spot3TargetY);
      ctx.closePath();
      ctx.fill();
    }

    // 5. ESTELAS DE VELOCIDAD HIPERSÓNICAS (Cap a 18 estelas para máximo rendimiento)
    if (mult >= 2) {
      const targetCount = Math.min(18, 10 + mult * 2);
      if (!this.speedStreaks) this.speedStreaks = [];
      while (this.speedStreaks.length < targetCount) {
        this.speedStreaks.push({
          angle: -0.85 + Math.random() * 1.70,
          speed: 1.8 + Math.random() * 2.6,
          progress: Math.random(),
          len: 0.018 + Math.random() * 0.035, // Líneas cortas y electrizantes
          side: Math.random() > 0.5 ? 1 : -1,
          col: Math.random() > 0.45 ? beamColor1 : beamColor2,
          thick: 1.1 + Math.random() * 2.0,
          lateralShift: (Math.random() - 0.5) * 0.25
        });
      }

      const frameScale = Math.min(2.5, (this._frameDt || 0.00833) * 60);
      for (let i = 0; i < this.speedStreaks.length; i++) {
        const s = this.speedStreaks[i];
        const warpSpeed = (0.9 + mult * 0.55);
        s.progress += 0.018 * s.speed * warpSpeed * frameScale;
        if (s.progress > 1.0) {
          s.progress = 0;
          s.speed = 1.8 + Math.random() * 2.6;
          s.len = 0.018 + Math.random() * 0.035;
          s.side = Math.random() > 0.5 ? 1 : -1;
          s.col = Math.random() > 0.45 ? beamColor1 : beamColor2;
          s.lateralShift = (Math.random() - 0.5) * 0.25;
        }

        const p1 = s.progress;
        const p2 = Math.min(1.0, p1 + s.len);
        const xCenter = w / 2;
        const yCenter = horizY;

        const startRad = 35 + p1 * (w * 0.88);
        const endRad = 35 + p2 * (w * 0.88);

        const spread1 = 0.44 + 0.56 * p1;
        const x1 = xCenter + s.side * (w * (0.38 + s.lateralShift) + startRad * 0.45) * spread1;
        const y1 = yCenter + Math.pow(p1, 1.35) * h * 0.98;

        const spread2 = 0.44 + 0.56 * p2;
        const x2 = xCenter + s.side * (w * (0.38 + s.lateralShift) + endRad * 0.45) * spread2;
        const y2 = yCenter + Math.pow(p2, 1.35) * h * 0.98;

        const streakAlpha = Math.sin(p1 * Math.PI) * (0.32 + 0.12 * mult) * stageIntensity;
        ctx.strokeStyle = hexToRgba(s.col || beamColor1, streakAlpha);
        ctx.lineWidth = s.thick * (0.7 + 0.4 * p1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Punta incandescente de la estela
        ctx.fillStyle = hexToRgba('#ffffff', streakAlpha * 0.9);
        ctx.beginPath();
        ctx.arc(x2, y2, s.thick * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. MOTAS DE POLVO ESCÉNICO Y DESTELLOS FLOTANTES
    if (!this.stageDustMotes || this.stageDustMotes.length === 0) {
      this.stageDustMotes = [];
      for (let i = 0; i < 28; i++) {
        this.stageDustMotes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1.0 + Math.random() * 2.4,
          speed: 0.35 + Math.random() * 0.65,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.15 + Math.random() * 0.35
        });
      }
    }

    const dustScale = Math.min(2.5, (this._frameDt || 0.00833) * 60);
    for (let i = 0; i < this.stageDustMotes.length; i++) {
      const m = this.stageDustMotes[i];
      m.y -= m.speed * (mult >= 3 ? 1.5 : 1.0) * dustScale;
      m.x += Math.sin(m.phase + safePerfNow * 0.0016) * 0.5 * dustScale;
      if (m.y < -10) {
        m.y = h + 10;
        m.x = Math.random() * w;
      }
      ctx.fillStyle = hexToRgba(beamColor1, m.alpha * (0.5 + 0.5 * beatPulse));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. REFLEJOS ESPECULARES EN EL SUELO BAJO LAS NOTAS (Optimizado: empieza en firstActiveNoteIndex y sin RadialGradient por frame)
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.84);
    if (Array.isArray(this.notes)) {
      let drawnReflections = 0;
      const startRefIdx = Math.min(this.firstActiveNoteIndex || 0, this.notes.length);
      const scrollDur = this.scrollDurationMs || 1000;
      for (let i = startRefIdx; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (!n || n.consumed || n.hit || n.missed) continue;
        const noteTime = n.timeMs || n.timestamp_ms || 0;
        const diff = noteTime - currentTime;
        if (diff > 500) break;
        if (diff >= -50 && diff <= 500 && drawnReflections < 3) {
          const laneCoord = this.getPerspectiveCoord(n.lane, 1.0 - (diff / scrollDur), this._coordScratch0);
          if (laneCoord && laneCoord.y > hitY * 0.4) {
            drawnReflections++;
            const refAlpha = Math.max(0, Math.min(0.20, (1 - diff / 500) * 0.20));
            ctx.fillStyle = hexToRgba(beamColor1, refAlpha);
            ctx.beginPath();
            ctx.ellipse(laneCoord.x, hitY + 12, laneCoord.laneW * 0.55, 11, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    ctx.restore();

    // 7. Full Focus Vignette Ambient Flash (0 Gradient Allocs)
    if (this.vignetteAlpha > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = hexToRgba(this.vignetteColor || beamColor1, this.vignetteAlpha * 0.28);
      ctx.lineWidth = Math.max(18, w * 0.06);
      ctx.strokeRect(0, 0, w, h);
      ctx.restore();
    }

    const isReactiveActive = this.customBgMode === 'reactive' && !!this.customBgMedia;
    if (!isReactiveActive) {
      return;
    }

    try {
      // FONDO REACTIVO: ILUMINACIÓN ADITIVA DINÁMICA
      if (this.customBgMode === 'reactive' && this.customBgMedia) {
        const hasBursts = this.bgBursts.some(b => b.type === 'reactive_reveal' && b.alpha > 0.01);
        const hasHolds = this.activeHolds.size > 0;
        const hasBoost = (this.reactiveLightBoost || 0) > 0.01;

        if (hasBursts || hasHolds || hasBoost) {
          const spotScale = 0.5;
          const spotW = Math.max(160, Math.round(w * spotScale));
          const spotH = Math.max(160, Math.round(h * spotScale));
          if (!this.spotlightCanvas || this.spotlightCanvas.width !== spotW || this.spotlightCanvas.height !== spotH) {
            this.spotlightCanvas = document.createElement('canvas');
            this.spotlightCanvas.width = spotW;
            this.spotlightCanvas.height = spotH;
            this.spotlightCtx = this.spotlightCanvas.getContext('2d');
          }
          const sCtx = this.spotlightCtx;
          sCtx.clearRect(0, 0, spotW, spotH);

          sCtx.save();
          sCtx.scale(spotScale, spotScale);
          sCtx.globalCompositeOperation = 'lighter';

          if (hasBoost) {
            const ambGrad = sCtx.createRadialGradient(w / 2, this.hitLineY, 20, w / 2, this.hitLineY, Math.max(w, h));
            const boostA = Math.min(0.70, (this.reactiveLightBoost || 0) * 0.70);
            ambGrad.addColorStop(0, `rgba(255, 255, 255, ${boostA.toFixed(3)})`);
            ambGrad.addColorStop(0.5, `rgba(255, 255, 255, ${(boostA * 0.45).toFixed(3)})`);
            ambGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            sCtx.fillStyle = ambGrad;
            sCtx.fillRect(0, 0, w, h);
          }

          for (const b of this.bgBursts) {
            if (b.type !== 'reactive_reveal' || b.alpha <= 0.01) continue;
            const rad = Math.max(20, b.radius);
            const grad = sCtx.createRadialGradient(b.x, b.y, 0, b.x, b.y, rad);
            const a = Math.min(1.0, b.alpha);
            grad.addColorStop(0, `rgba(255, 255, 255, ${a.toFixed(3)})`);
            grad.addColorStop(0.35, `rgba(255, 255, 255, ${(a * 0.85).toFixed(3)})`);
            grad.addColorStop(0.70, `rgba(255, 255, 255, ${(a * 0.40).toFixed(3)})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            sCtx.fillStyle = grad;
            sCtx.beginPath();
            sCtx.arc(b.x, b.y, rad, 0, Math.PI * 2);
            sCtx.fill();
          }

          for (const [holdLane] of this.activeHolds.entries()) {
            const hx = (holdLane + 0.5) * this.laneWidth;
            const hy = this.hitLineY;
            const hRad = this.laneWidth * 1.8;
            const grad = sCtx.createRadialGradient(hx, hy, 0, hx, hy, hRad);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.60)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            sCtx.fillStyle = grad;
            sCtx.beginPath();
            sCtx.arc(hx, hy, hRad, 0, Math.PI * 2);
            sCtx.fill();
          }
          sCtx.restore();

          sCtx.save();
          sCtx.globalCompositeOperation = 'source-in';
          sCtx.scale(spotScale, spotScale);
          this.drawCoverMedia(sCtx, this.customBgMedia, w, h);
          sCtx.restore();

          ctx.save();
          ctx.drawImage(this.spotlightCanvas, 0, 0, w, h);
          ctx.restore();
        }
      }
    } catch (fxErr) {
      console.warn('Background FX warning:', fxErr);
    }
  }

  // =========================================================================
  // MOTOR DE 12 EFECTOS ORIGINALES DE ALTA GAMA (VISIBLES SOBRE PISTA Y CÁPSULA)
  // =========================================================================
  static drawSingleEffectBurst(ctx, b, nowMs = 0, spanScale = 1.0) {
    if (!ctx || !b || b.alpha <= 0.01) return;
    const fx = b.type || 'solar_inferno';
    const a = Math.max(0, Math.min(1, b.alpha));
    const p = Math.max(0, Math.min(1, 1 - a));
    const x = b.x;
    const y = b.y;
    const s = spanScale;
    const seed = b.seed || 17.3;

    ctx.save();

    // 1. LLAMARADA INFERNAL (FUEGO VOLUMÉTRICO INTENSO - 0 Gradient Allocs)
    if (fx === 'solar_inferno') {
      ctx.fillStyle = `rgba(234, 88, 12, ${(a * 0.38).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y - 35 * s * p, 62 * s, 90 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      const flameCols = ['#dc2626', '#ff4500', '#fb923c', '#fde047', '#ffffff'];
      ctx.fillStyle = '#ff5500';
      ctx.globalAlpha = a * 0.85;
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const frac = i / 6;
        const spread = (frac - 0.5) * 76 * s;
        const flameH = (85 + Math.sin(seed + i * 2.1) * 35 + p * 145) * s;
        const wave = Math.sin(nowMs * 0.018 + i * 1.4) * 16 * s;
        const topX = x + spread * (0.55 + p * 0.45) + wave;
        const topY = y - flameH;
        const baseW = (24 - (i % 3) * 4) * s * a;

        ctx.moveTo(x + spread * 0.35 - baseW, y + 6 * s);
        ctx.quadraticCurveTo(x + spread * 0.7 - wave * 0.6, y - flameH * 0.5, topX, topY);
        ctx.quadraticCurveTo(x + spread * 0.7 + wave * 0.6, y - flameH * 0.5, x + spread * 0.35 + baseW, y + 6 * s);
      }
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.globalAlpha = a * 0.90;
      ctx.beginPath();
      for (let i = 1; i < 6; i++) {
        const frac = i / 6;
        const spread = (frac - 0.5) * 52 * s;
        const flameH = (52 + Math.sin(seed + i * 2.1) * 22 + p * 95) * s;
        const wave = Math.sin(nowMs * 0.018 + i * 1.4) * 10 * s;
        const topX = x + spread * 0.5 + wave;
        const topY = y - flameH;
        const baseW = 12 * s * a;
        ctx.moveTo(x + spread * 0.25 - baseW, y + 4 * s);
        ctx.lineTo(topX, topY);
        ctx.lineTo(x + spread * 0.25 + baseW, y + 4 * s);
      }
      ctx.fill();

      ctx.strokeStyle = '#ff4500';
      ctx.lineWidth = 4.5 * s * a;
      ctx.beginPath();
      ctx.ellipse(x, y, (24 + p * 68) * s, (10 + p * 26) * s, 0, 0, Math.PI * 2);
      ctx.stroke();

      for (let e = 0; e < 8; e++) {
        const ang = seed + e * 0.9 + p * 3.5;
        const ex = x + Math.sin(ang) * (15 + e * 5.5) * s;
        const ey = y - (p * (60 + e * 16) + (e * 7)) * s;
        ctx.fillStyle = flameCols[e % flameCols.length];
        ctx.beginPath();
        ctx.arc(ex, ey, (3.6 - (e % 3) * 0.7) * s * a, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. VENTISCA CRIOGÉNICA (CRISTALES DE HIELO Y ESCARCHA - 0 Gradient Allocs)
    else if (fx === 'cryo_blizzard') {
      ctx.fillStyle = `rgba(14, 165, 233, ${(a * 0.35).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 76 * s, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 9; i++) {
        const ang = -Math.PI * 0.88 + (i / 8) * Math.PI * 0.76;
        const len = (42 + (i % 2) * 32 + p * 68) * s;
        const tipX = x + Math.cos(ang) * len;
        const tipY = y + Math.sin(ang) * len;
        const perpX = -Math.sin(ang) * 9 * s * a;
        const perpY = Math.cos(ang) * 9 * s * a;

        ctx.beginPath();
        ctx.moveTo(x + perpX, y + perpY);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(x - perpX, y - perpY);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? `rgba(2, 132, 199, ${(a * 0.85).toFixed(3)})` : `rgba(56, 189, 248, ${(a * 0.88).toFixed(3)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${(a * 0.95).toFixed(3)})`;
        ctx.lineWidth = 1.6 * s;
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(x, y - 28 * p * s);
      ctx.rotate(p * 1.4 + seed);
      const hexR = (22 + p * 54) * s;
      ctx.strokeStyle = `rgba(224, 242, 254, ${(a * 0.95).toFixed(3)})`;
      ctx.lineWidth = 2.6 * s * a;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ka = (k * Math.PI) / 3;
        const kx = Math.cos(ka) * hexR;
        const ky = Math.sin(ka) * hexR;
        ctx.moveTo(0, 0);
        ctx.lineTo(kx, ky);
        const b1x = Math.cos(ka) * hexR * 0.62;
        const b1y = Math.sin(ka) * hexR * 0.62;
        ctx.moveTo(b1x, b1y);
        ctx.lineTo(b1x + Math.cos(ka + 0.6) * hexR * 0.28, b1y + Math.sin(ka + 0.6) * hexR * 0.28);
        ctx.moveTo(b1x, b1y);
        ctx.lineTo(b1x + Math.cos(ka - 0.6) * hexR * 0.28, b1y + Math.sin(ka - 0.6) * hexR * 0.28);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. PULSO CYBERPUNK (EFECTO NEÓN SYNTHWAVE - 0 Gradient Allocs)
    else if (fx === 'cyber_neon') {
      const neonCols = ['#ff007f', '#00f2fe', '#a855f7', '#ffe600'];
      const beamH = (120 + p * 180) * s;
      ctx.fillStyle = `rgba(255, 0, 127, ${(a * 0.42).toFixed(3)})`;
      ctx.fillRect(x - 34 * s * a, y - beamH * 0.65, 68 * s * a, beamH * 0.65);
      ctx.fillStyle = `rgba(0, 242, 254, ${(a * 0.32).toFixed(3)})`;
      ctx.fillRect(x - 20 * s * a, y - beamH, 40 * s * a, beamH);

      for (let hIdx = 0; hIdx < 3; hIdx++) {
        ctx.save();
        ctx.translate(x, y - hIdx * 24 * p * s);
        ctx.rotate((hIdx % 2 === 0 ? 1 : -1) * (p * 2.5 + hIdx));
        ctx.scale(1, 0.62);
        const rad = (20 + hIdx * 18 + p * 52) * s;
        ctx.beginPath();
        for (let v = 0; v < 6; v++) {
          const va = (v * Math.PI) / 3;
          if (v === 0) ctx.moveTo(Math.cos(va) * rad, Math.sin(va) * rad);
          else ctx.lineTo(Math.cos(va) * rad, Math.sin(va) * rad);
        }
        ctx.closePath();
        ctx.strokeStyle = neonCols[hIdx % neonCols.length];
        ctx.lineWidth = (4.0 - hIdx * 0.8) * s * a;
        ctx.stroke();
        ctx.restore();
      }

      for (let g = 0; g < 6; g++) {
        const gy = y - (g * 26 + p * 65) * s;
        const gw = (35 + ((g * 19) % 45)) * s * a;
        const gx = x + Math.sin(seed + g * 2.3 + p * 8) * 28 * s;
        ctx.fillStyle = neonCols[g % neonCols.length];
        ctx.globalAlpha = a * 0.90;
        ctx.fillRect(gx - gw * 0.5, gy, gw, 3.5 * s);
      }
    }

    // 4. PIROTECNIA IMPERIAL (FUEGOS ARTIFICIALES MULTICOLOR)
    else if (fx === 'grand_fireworks') {
      const shells = [
        { ox: 0, oy: -68 * s, col1: '#ff0055', col2: '#ffd700', r: 72 * s },
        { ox: -36 * s, oy: -105 * s, col1: '#00f2fe', col2: '#39ff14', r: 54 * s },
        { ox: 38 * s, oy: -96 * s, col1: '#a855f7', col2: '#fde047', r: 56 * s }
      ];
      for (let sIdx = 0; sIdx < shells.length; sIdx++) {
        const sh = shells[sIdx];
        const cx = x + sh.ox * (0.4 + p * 0.6);
        const cy = y + sh.oy * (0.35 + p * 0.65);

        ctx.fillStyle = `rgba(15, 6, 30, ${(a * 0.45).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, sh.r * (0.3 + p * 0.7), 0, Math.PI * 2);
        ctx.fill();

        const spokes = 12;
        ctx.strokeStyle = sh.col1;
        ctx.lineWidth = 2.5 * s * a;
        ctx.beginPath();
        for (let k = 0; k < spokes; k++) {
          const ang = (k / spokes) * Math.PI * 2 + sIdx * 0.3;
          const dist = sh.r * (0.18 + p * 0.85);
          const droop = p * p * 26 * s;
          const tx = cx + Math.cos(ang) * dist;
          const ty = cy + Math.sin(ang) * dist + droop;
          ctx.moveTo(cx + Math.cos(ang) * dist * 0.25, cy + Math.sin(ang) * dist * 0.25);
          ctx.lineTo(tx, ty);
        }
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let k = 0; k < spokes; k++) {
          const ang = (k / spokes) * Math.PI * 2 + sIdx * 0.3;
          const dist = sh.r * (0.18 + p * 0.85);
          const droop = p * p * 26 * s;
          const tx = cx + Math.cos(ang) * dist;
          const ty = cy + Math.sin(ang) * dist + droop;
          ctx.moveTo(tx + 2.6 * s * a, ty);
          ctx.arc(tx, ty, 2.6 * s * a, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }

    // 5. TORMENTA DE ZEUS (ILUMINACIONES Y RAYOS TESLA - 0 Gradient Allocs)
    else if (fx === 'zeus_lightning') {
      const stormH = 220 * s;
      ctx.fillStyle = `rgba(124, 58, 237, ${(a * 0.35).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y - stormH * 0.45, 48 * s, stormH * 0.50, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let bIdx = 0; bIdx < 3; bIdx++) {
        const startX = x + (bIdx - 1) * 34 * s;
        const startY = y - (170 + bIdx * 28) * s;
        const segments = 7;

        ctx.strokeStyle = bIdx === 1 ? '#00f2fe' : '#a855f7';
        ctx.lineWidth = (7.0 - bIdx * 1.5) * s * a;
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let seg = 1; seg < segments; seg++) {
          const frac = seg / segments;
          const jx = startX + (x - startX) * frac + Math.sin(nowMs * 0.045 + seg * 3.7 + bIdx * 2.1) * 24 * s;
          const jy = startY + (y - startY) * frac;
          ctx.lineTo(jx, jy);
        }
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2 * s * a;
        ctx.stroke();
      }

      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 3.2 * s * a;
      ctx.beginPath();
      ctx.ellipse(x, y, (28 + p * 64) * s, (12 + p * 26) * s, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 6. NEBULOSA CÓSMICA (EFECTO DEL ESPACIO Y GALAXIA - 0 Gradient Allocs)
    else if (fx === 'deep_cosmos') {
      const cy = y - 28 * p * s;
      const maxR = (42 + p * 54) * s;

      ctx.fillStyle = `rgba(88, 28, 135, ${(a * 0.62).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, cy, maxR, maxR * 0.68, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(219, 39, 119, ${(a * 0.38).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, cy, maxR * 0.65, maxR * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();

      const armCols = ['#38bdf8', '#f472b6', '#fde047', '#c084fc', '#ffffff'];
      for (let i = 0; i < 20; i++) {
        const arm = i % 2;
        const t = i / 20;
        const theta = arm * Math.PI + t * Math.PI * 3.2 - p * 4.2 + seed;
        const r = t * maxR * 0.88;
        const sx = x + Math.cos(theta) * r;
        const sy = cy + Math.sin(theta) * r * 0.68;
        ctx.fillStyle = armCols[i % armCols.length];
        const sr = (1.8 + (1 - t) * 2.8) * s * a;
        ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
      }

      const pAng = seed + p * 3.8;
      const px = x + Math.cos(pAng) * maxR * 0.52;
      const py = cy + Math.sin(pAng) * maxR * 0.34;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, py, 7.5 * s * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.2 * s * a;
      ctx.beginPath();
      ctx.ellipse(px, py, 15 * s * a, 4.5 * s * a, -0.35, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 7. LLUVIA DE ASTEROIDES (METEORITOS EN LLAMAS E IMPACTO - 0 Gradient Allocs)
    else if (fx === 'asteroid_impact') {
      const craterR = (28 + p * 58) * s;
      ctx.fillStyle = `rgba(234, 88, 12, ${(a * 0.65).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, craterR, craterR * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(254, 240, 138, ${(a * 0.85).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, craterR * 0.45, craterR * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let m = 0; m < 6; m++) {
        const ang = -Math.PI * 0.82 + (m / 5) * Math.PI * 0.64;
        const dist = (18 + p * (72 + (m % 3) * 28)) * s;
        const rx = x + Math.cos(ang) * dist;
        const ry = y + Math.sin(ang) * dist + p * p * 34 * s;
        const rockR = (8.5 - (m % 3) * 1.8) * s * a;

        ctx.strokeStyle = `rgba(249, 115, 22, ${(a * 0.75).toFixed(3)})`;
        ctx.lineWidth = rockR * 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(rx, ry);
        ctx.stroke();

        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(seed + m + p * 6);
        ctx.beginPath();
        for (let v = 0; v < 7; v++) {
          const va = (v / 7) * Math.PI * 2;
          const vr = rockR * (v % 2 === 0 ? 1.15 : 0.78);
          if (v === 0) ctx.moveTo(Math.cos(va) * vr, Math.sin(va) * vr);
          else ctx.lineTo(Math.cos(va) * vr, Math.sin(va) * vr);
        }
        ctx.closePath();
        ctx.fillStyle = '#292524';
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.8 * s;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 8. HORIZONTE DE SUCESOS (AGUJERO NEGRO GRAVITACIONAL - 0 Gradient Allocs)
    else if (fx === 'black_hole') {
      const cy = y - 18 * p * s;
      const diskR = (38 + p * 52) * s;

      ctx.fillStyle = `rgba(219, 39, 119, ${(a * 0.55).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, cy, diskR, diskR * 0.52, -0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(249, 115, 22, ${(a * 0.78).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, cy, diskR * 0.65, diskR * 0.34, -0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(56, 189, 248, ${(a * 0.75).toFixed(3)})`;
      ctx.lineWidth = 5 * s * a;
      ctx.beginPath();
      ctx.moveTo(x, cy - diskR * 1.45);
      ctx.lineTo(x, cy + diskR * 0.85);
      ctx.stroke();

      const coreR = (18 + (1 - p) * 8) * s * a;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, cy, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.8 * s * a;
      ctx.stroke();
    }

    // 9. LLAMA DE DRAGÓN ESMERALDA (DOBLE HÉLICE DE FUEGO MÍSTICO - 0 Gradient Allocs)
    else if (fx === 'dragon_fire') {
      const hMax = (110 + p * 160) * s;
      ctx.fillStyle = `rgba(16, 185, 129, ${(a * 0.36).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y - hMax * 0.35, 54 * s, 84 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let strand = 0; strand < 2; strand++) {
        ctx.beginPath();
        for (let step = 0; step <= 14; step++) {
          const f = step / 14;
          const angle = f * Math.PI * 3.5 + p * 7.0 + strand * Math.PI;
          const hx = x + Math.sin(angle) * (28 * (1 - f * 0.45)) * s;
          const hy = y - f * hMax;
          if (step === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.strokeStyle = strand === 0 ? '#10b981' : '#fde047';
        ctx.lineWidth = 7.5 * s * a;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2 * s * a;
        ctx.stroke();
      }
    }

    // 10. AURORA BOREAL CELESTIAL (CORTINAS DE LUZ PRISMÁTICA - 0 Gradient Allocs)
    else if (fx === 'aurora_borealis') {
      const ribbons = [
        { col: '#06b6d4', off: -32 },
        { col: '#10b981', off: -10 },
        { col: '#8b5cf6', off: 12 },
        { col: '#f43f5e', off: 34 }
      ];
      const curH = (125 + p * 135) * s;
      ctx.globalAlpha = a * 0.72;
      for (let r = 0; r < ribbons.length; r++) {
        const rb = ribbons[r];
        const wave = Math.sin(nowMs * 0.008 + r * 1.4 + p * 4) * 18 * s;
        const rx = x + rb.off * s + wave;
        ctx.fillStyle = rb.col;
        ctx.beginPath();
        ctx.moveTo(rx - 14 * s, y);
        ctx.quadraticCurveTo(rx + wave, y - curH * 0.5, rx - 6 * s, y - curH);
        ctx.lineTo(rx + 14 * s, y - curH);
        ctx.quadraticCurveTo(rx + wave + 14 * s, y - curH * 0.5, rx + 14 * s, y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 11. EXPLOSIÓN SUPERNOVA (ESTRELLA HIPERMASIVA - 0 Gradient Allocs)
    else if (fx === 'supernova_burst') {
      const cy = y - 16 * p * s;
      const rad = (45 + p * 75) * s;

      ctx.fillStyle = `rgba(255, 0, 127, ${(a * 0.45).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, cy, rad, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(253, 224, 71, ${(a * 0.78).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, cy, rad * 0.55, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(x, cy);
      ctx.rotate(p * 0.8);
      for (let sp = 0; sp < 8; sp++) {
        ctx.save();
        ctx.rotate((sp * Math.PI) / 4);
        const spikeLen = (sp % 2 === 0 ? rad * 1.45 : rad * 0.88);
        ctx.fillStyle = sp % 2 === 0 ? '#ffffff' : '#fde047';
        ctx.globalAlpha = a * 0.95;
        ctx.beginPath();
        ctx.moveTo(0, -4.5 * s);
        ctx.lineTo(spikeLen, 0);
        ctx.lineTo(0, 4.5 * s);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // 12. MATRIZ HIPER-CUÁNTICA (HIPERCUBOS 3D Y LÁSER)
    else if (fx === 'quantum_prism') {
      const cy = y - 35 * p * s;
      const scanY = y - p * 175 * s;
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 3.5 * s * a;
      ctx.beginPath();
      ctx.moveTo(x - 48 * s, scanY);
      ctx.lineTo(x + 48 * s, scanY);
      ctx.stroke();

      for (let c = 0; c < 2; c++) {
        const sz = (24 + c * 18 + p * 32) * s;
        ctx.save();
        ctx.translate(x, cy);
        ctx.rotate((c === 0 ? 1 : -1) * (p * 3.2 + seed));
        ctx.strokeStyle = c === 0 ? '#00f2fe' : '#a855f7';
        ctx.lineWidth = 3.0 * s * a;
        ctx.strokeRect(-sz * 0.5, -sz * 0.5, sz, sz);
        ctx.fillStyle = c === 0 ? `rgba(0, 242, 254, ${(a * 0.22).toFixed(3)})` : `rgba(168, 85, 247, ${(a * 0.18).toFixed(3)})`;
        ctx.fillRect(-sz * 0.5, -sz * 0.5, sz, sz);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  renderForegroundEffectBursts(ctx, currentTime) {
    if (!this.bgBursts || this.bgBursts.length === 0 || !ctx) return;
    const nowMs = this._frameNow || performance.now();
    for (let i = 0; i < this.bgBursts.length; i++) {
      const b = this.bgBursts[i];
      if (!b || b.type === 'reactive_reveal' || b.alpha <= 0.01) continue;
      BeatstarEngine.drawSingleEffectBurst(ctx, b, nowMs, 1.0);
    }
  }

  render(frameNow) {
    this._frameNow = frameNow || performance.now();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1.0;
    this.ctx.shadowBlur = 0;

    // ⚡ TIEMPO BLOQUEADO AL FRAME: Un solo valor inmutable para todo el frame
    const currentTime = this.getCurrentGameTimeMs(this._frameNow);
    const isMushActive = Boolean(this.isMushroomModeActive || (typeof window !== 'undefined' && window.isMushroomModeActive));

    this.renderBackgroundFX(currentTime);
    if (isMushActive) {
      this._beginMushroomWorldTransform(this.ctx, currentTime);
    }
    this.renderLanes(currentTime);
    this.renderHitLine(currentTime);
    this.renderRipples(this.ctx);
    this.renderForegroundEffectBursts(this.ctx, currentTime);
    this.renderNotes(currentTime);
    this.renderSwipeLaunches(this.ctx, currentTime);
    this.particles.render(this.ctx);
    this.renderMusicalNotes();
    if (isMushActive) {
      this._endMushroomWorldTransform(this.ctx);
      this.renderMushroomModeOverlay(this.ctx, currentTime);
    }
    if (this.isStormModeActive || (typeof window !== 'undefined' && window.isStormModeActive)) {
      this.renderStormModeOverlay(this.ctx, currentTime);
    }
    this.renderJudgements();
    this.renderFlyingLyrics(this.ctx, currentTime);
    this.renderDiscoLighting(this.ctx, currentTime);
    this.renderDiscoBall(this.ctx, currentTime);
    this.render3DComboExplosion(this.ctx);
    this.renderMissFailureFeedback(this.ctx, currentTime);
  }

  renderSwipeLaunches(ctx, currentTime) {
    if (!this.activeSwipeLaunches || this.activeSwipeLaunches.length === 0) return;
    const now = this._frameNow || performance.now();
    const isLarge = this.keyStyle === 'beatstar_large';

    for (let i = this.activeSwipeLaunches.length - 1; i >= 0; i--) {
      const launch = this.activeSwipeLaunches[i];
      const elapsed = now - launch.startTime;
      if (elapsed > launch.duration) {
        this.activeSwipeLaunches.splice(i, 1);
        continue;
      }

      const progress = Math.max(0, Math.min(1, elapsed / launch.duration)); // 0 to 1
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const easeInCubic = progress * progress * progress;

      // Trayectoria de eyección balística hacia la dirección del deslizamiento
      const curX = launch.x + (launch.vx * (elapsed / 1000));
      const curY = launch.y + (launch.vy * (elapsed / 1000));
      const curScale = Math.max(0.25, (1.0 + progress * 0.45) * (1.0 - easeInCubic * 0.6));
      const curAlpha = Math.max(0, 1.0 - Math.pow(progress, 1.5));
      const curRot = launch.rot * progress * 2.8;

      ctx.save();
      ctx.globalAlpha = curAlpha;
      ctx.translate(curX, curY);
      ctx.rotate(curRot);
      ctx.scale(curScale, curScale);

      const keyW = (this.laneWidth || 100) * 0.78;
      const keyH = isLarge ? 58 : 30;

      // 1. Estela de propulsión hipersónica luminosa (0 Gradient Allocs)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const trailLenX = -launch.vx * 0.05;
      const trailLenY = -launch.vy * 0.05;
      ctx.fillStyle = hexToRgba(launch.color, 0.72);
      ctx.beginPath();
      ctx.moveTo(-keyW / 2, -keyH / 2);
      ctx.lineTo(keyW / 2, -keyH / 2);
      ctx.lineTo((keyW / 4) + trailLenX, trailLenY);
      ctx.lineTo((-keyW / 4) + trailLenX, trailLenY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. Tecla marfil en 3D saliendo proyectada (0 Gradient Allocs)
      ctx.fillStyle = '#e8edf4';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;

      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-keyW / 2, -keyH / 2, keyW, keyH, 8);
      else ctx.rect(-keyW / 2, -keyH / 2, keyW, keyH);
      ctx.fill();
      ctx.stroke();

      // Halo de propulsión luminoso en hardware puro
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = hexToRgba(launch.color, (1 - progress) * 0.85);
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-keyW / 2, -keyH / 2, keyW, keyH, 8);
      else ctx.rect(-keyW / 2, -keyH / 2, keyW, keyH);
      ctx.stroke();
      ctx.restore();

      // 3. Chevrón vectorial brillante de la dirección
      this.renderVectorChevron(ctx, 0, 0, launch.dir, keyW, keyH);

      ctx.restore();
    }
  }



  renderFlyingLyrics(ctx, currentTime) {
    if (!this.flyingLyrics || this.flyingLyrics.length === 0) return;
    const now = this._frameNow || performance.now();

    for (let i = this.flyingLyrics.length - 1; i >= 0; i--) {
      const fly = this.flyingLyrics[i];
      const elapsed = now - fly.startTime;
      const t = elapsed / fly.duration;

      if (t >= 1.0) {
        // Al impactar, ilumina la sílaba en el DOM una sola vez
        if (Number.isFinite(fly.sylTime)) {
          if (typeof iluminarSilaba === 'function') iluminarSilaba(fly.sylTime);
          else if (typeof window.iluminarSilaba === 'function') window.iluminarSilaba(fly.sylTime);
        }
        this.flyingLyrics.splice(i, 1);
        continue;
      }

      // Parábola fluida ease-out
      const p = 1.0 - Math.pow(1.0 - t, 3);
      const inv = 1.0 - p;
      const curX = inv * inv * fly.startX + 2 * inv * p * fly.ctrlX + p * p * fly.targetX;
      const curY = inv * inv * fly.startY + 2 * inv * p * fly.ctrlY + p * p * fly.targetY;

      ctx.save();
      ctx.translate(curX, curY);

      // Sombra sólida negra de contraste
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillText(fly.text, 1.5, 1.5);

      // Núcleo de oro brillante
      ctx.fillStyle = '#ffd700';
      ctx.fillText(fly.text, 0, 0);

      ctx.restore();
    }
  }  render3DComboExplosion(ctx) {
    if (!this.combo3DExplosions || this.combo3DExplosions.length === 0) return;
    const explosions = this.combo3DExplosions;

    for (const exp of explosions) {
      if (!exp || exp.alpha <= 0.01) continue;
      const w = this.width;
      const h = this.height;
      const midX = exp.originX || (w / 2);
      const topY = Math.max(120, Math.min(210, h * 0.18));
      const expAlpha = Math.max(0, Math.min(1, exp.alpha));
      const col = exp.color || '#ffd700';
      const rgb = hexToRgb(col);

      ctx.save();

      // Partículas discretas sin nebulosa ni rayos blancos que blanqueen la pista
      if (exp.sparks && exp.sparks.length > 0) {
        ctx.save();
        for (const sp of exp.sparks) {
          if (sp.alpha <= 0.01) continue;
          const zScale = Math.max(0.3, 1.0 + (sp.z / 260));
          const pRad = Math.max(1.5, sp.radius * zScale * 1.2);
          const pAlpha = Math.max(0, Math.min(1, sp.alpha * expAlpha * 0.55));
          const spRgb = hexToRgb(sp.color || col);

          ctx.fillStyle = `rgba(${spRgb.r}, ${spRgb.g}, ${spRgb.b}, ${pAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, pRad, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 5. TIPOGRAFÍA ELEGANTE CON RESPLANDOR ETÉREO DIFUMINADO
      ctx.save();
      ctx.globalAlpha = expAlpha;
      ctx.translate(midX, topY);
      ctx.scale(exp.scale, exp.scale);

      const hasSub = Boolean(exp.subtext);
      const titleText = String(exp.title || '').toUpperCase();
      const subText = String(exp.subtext || '').toUpperCase();

      // Título nítido de alta fidelidad sin shadowBlur
      ctx.font = '900 22px "Plus Jakarta Sans", "Outfit", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.save();
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.90)`;
      ctx.lineWidth = 4.5;
      ctx.strokeText(titleText, 0, 0);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(titleText, 0, 0);
      ctx.restore();

      // Subtítulo con cápsula luminosa etérea (sin oscurecer jamás la pista)
      if (hasSub) {
        const subY = 22;
        ctx.font = '800 10.5px "Plus Jakarta Sans", "Outfit", system-ui, sans-serif';
        const subMetrics = ctx.measureText(subText);
        const pillW = Math.max(90, subMetrics.width + 20);
        const pillH = 19;

        // Base difuminada luminosa translúcida
        ctx.save();
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-pillW / 2, subY - pillH / 2, pillW, pillH, 9.5);
        else ctx.rect(-pillW / 2, subY - pillH / 2, pillW, pillH);
        ctx.fill();

        // Borde fino brillante
        ctx.strokeStyle = `rgba(255, 255, 255, 0.70)`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
        ctx.restore();

        // Texto suave
        ctx.fillStyle = '#ffffff';
        ctx.fillText(subText, 0, subY);
      }

      ctx.restore();
      ctx.restore();
    }
  }

  renderMissFailureFeedback(ctx, currentTime) {
    if (!this.missHighlight) return;
    const now = performance.now();
    const elapsed = now - (this.missHighlight.time || now);
    if (elapsed > 1100) return;
    const alpha = Math.max(0, 1.0 - (elapsed / 1100));

    ctx.save();
    if (this.missHighlight.type === 'empty_tap') {
      const x = this.missHighlight.x || (this.width / 2);
      const y = this.missHighlight.y || (this.hitLineY || this.height * 0.84);

      // Neon red shockwaves
      const radius = 22 + (elapsed * 0.12);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 23, 68, ${(alpha * 0.9).toFixed(3)})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, radius * 1.45, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 0, 51, ${(alpha * 0.5).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing red warning cross
      const crossSize = 16;
      ctx.beginPath();
      ctx.moveTo(x - crossSize, y - crossSize);
      ctx.lineTo(x + crossSize, y + crossSize);
      ctx.moveTo(x + crossSize, y - crossSize);
      ctx.lineTo(x - crossSize, y + crossSize);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 4.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x - crossSize, y - crossSize);
      ctx.lineTo(x + crossSize, y + crossSize);
      ctx.moveTo(x + crossSize, y - crossSize);
      ctx.lineTo(x - crossSize, y + crossSize);
      ctx.strokeStyle = `rgba(255, 0, 51, ${(alpha * 0.95).toFixed(3)})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

    } else if (this.missHighlight.type === 'note_dropped') {
      const note = this.missHighlight.note;
      const lane = (note && typeof note.lane === 'number') ? note.lane : (this.missHighlight.lane || 1);
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
      let noteX = this.width / 2;
      if (this.visualDimension !== '2d') {
        const xL = this.getLaneBoundaryX(lane, hitY);
        const xR = this.getLaneBoundaryX(lane + 1, hitY);
        noteX = (xL + xR) / 2;
      } else {
        noteX = (lane + 0.5) * (this.width / 3);
      }

      // Glowing red warning aura around dropped note at hitline
      ctx.beginPath();
      ctx.arc(noteX, hitY, 48 + Math.sin(now * 0.015) * 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 0, 51, ${(alpha * 0.45).toFixed(3)})`;
      ctx.fill();

      // Warning text
      ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▼ PERDIDA ▼', noteX, hitY - 32);
    }
    ctx.restore();
  }

  renderDiscoLighting(ctx, currentTime) {
    if (!this.discoBall || (!this.discoBall.active && this.discoBall.descendY <= -80)) return;
    const w = this.width, h = this.height;
    const midX = w / 2;
    const nowSec = performance.now() / 1000;
    const swayX = Math.sin(nowSec * 1.3) * 3.0;
    const bobY = Math.sin(nowSec * 2.4) * 1.5;
    const ballX = midX + swayX;
    const ballY = this.discoBall.descendY + bobY;
    if (ballY < -40) return;

    const beatPulse = (typeof this.getBeatPulse === 'function') ? this.getBeatPulse() : 0;
    const rot = this.discoBall.rotation;
    const visAlpha = Math.max(0, Math.min(1, (ballY + 40) / 100));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = visAlpha;

    const numBeams = 8;
    const beamLength = Math.max(w, h) * 1.30;
    const beamPalette = GLOBAL_BEAM_PALETTE;

    // 1. HACES DE LUZ VOLUMÉTRICOS GIRATORIOS (Optimizado GPU: 0 Gradient Allocs por frame)
    for (let b = 0; b < numBeams; b++) {
      const angle = rot * 0.90 + (b * (Math.PI * 2 / numBeams));
      const rgb = beamPalette[b % beamPalette.length];
      const beamSpread = 0.075;
      const beamIntensity = (0.18 + 0.10 * beatPulse);

      ctx.save();
      ctx.translate(ballX, ballY);
      ctx.rotate(angle);

      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamIntensity.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(beamLength * 0.72, -Math.tan(beamSpread) * beamLength * 0.72);
      ctx.lineTo(beamLength * 0.72, Math.tan(beamSpread) * beamLength * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2. RESPLANDOR DIFUMINADO DE LUCES DE COLORES (Optimizado GPU: 0 Gradient Allocs por frame)
    const numGlowSpots = 6;
    for (let s = 0; s < numGlowSpots; s++) {
      const spotAngle = rot * 1.1 + (s * (Math.PI * 2 / numGlowSpots));
      const sinA = Math.sin(spotAngle);
      const cosA = Math.cos(spotAngle);
      if (cosA <= -0.2) continue;

      const progress = 0.25 + 0.65 * ((sinA + 1) * 0.5);
      const spotY = (h * 0.20) + (h * 0.65) * progress;
      const spotX = (w * 0.5) + (w * 0.44) * sinA;
      const spotRad = (20 + 28 * progress) * (1.0 + beatPulse * 0.20);
      const rgb = beamPalette[(s + 1) % beamPalette.length];
      const spotAlpha = (0.18 + 0.08 * Math.sin(nowSec * 3.5 + s * 1.7)) * (1.0 + beatPulse * 0.25);

      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(spotAlpha * 0.45).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(spotX, spotY, spotRad, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(spotAlpha * 0.85).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(spotX, spotY, spotRad * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. MOTAS BRILLANTES DE ESPEJO
    if (this.discoBall.specks && this.discoBall.specks.length > 0) {
      const speckCount = Math.min(12, this.discoBall.specks.length);
      for (let i = 0; i < speckCount; i++) {
        const sp = this.discoBall.specks[i];
        const curAngle = sp.theta + rot * sp.speed;
        const distRatio = sp.dist;
        const spreadX = (w * 0.95) * distRatio;
        const spreadY = (h * 0.75) * distRatio;
        const sx = ballX + Math.cos(curAngle) * spreadX;
        const sy = ballY + Math.sin(curAngle) * spreadY + (sp.phi * h * 0.35);

        if (sx < 0 || sx > w || sy < 0 || sy > h) continue;

        const rgb = beamPalette[sp.colorIdx % beamPalette.length];
        const shimmer = 0.6 + 0.4 * Math.sin(nowSec * sp.shimmerSpeed + sp.shimmerPhase);
        const rad = (sp.size * 0.65) * (1.0 + beatPulse * 0.2);
        const alpha = Math.min(0.40, sp.brightness * shimmer * (0.22 + beatPulse * 0.18));

        ctx.fillStyle = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  renderDiscoTrackLightBeams(ctx, currentTime) {
    // Función anulada: sin elipses ni sombras en la pista
  }

  renderDiscoBall(ctx, currentTime) {
    if (!this.discoBall || (!this.discoBall.active && this.discoBall.descendY <= -80)) return;
    const w = this.width;
    const midX = w / 2;
    const nowSec = (this._frameNow || performance.now()) / 1000;
    const swayX = Math.sin(nowSec * 1.3) * 3.0;
    const bobY = Math.sin(nowSec * 2.4) * 1.5;
    const ballX = midX + swayX;
    const ballY = this.discoBall.descendY + bobY;
    if (ballY < -50) return;

    const radius = this.discoBall.radius || 27;
    const rot = this.discoBall.rotation;
    const visAlpha = Math.max(0, Math.min(1, (ballY + 40) / 100));

    ctx.save();
    ctx.globalAlpha = visAlpha;

    // 1. Cuerda metálica plateada
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(ballX, ballY - radius - 3);
    ctx.stroke();

    // 2. Enganche superior cromado
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(ballX, ballY - radius - 3, 4.0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Base esférica cromada (Sin createRadialGradient ni ctx.clip por frame)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(ballX - radius * 0.14, ballY - radius * 0.14, radius * 0.78, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ballX - radius * 0.32, ballY - radius * 0.32, radius * 0.36, 0, Math.PI * 2);
    ctx.fill();

    // 4. Malla 3D de facetas (Todos los vértices están matemáticamente dentro de radius: 0 ctx.clip stencil stall)
    const latBands = 6;
    const lonSegments = 10;

    ctx.beginPath();
    for (let i = 0; i < latBands; i++) {
      const lat0 = -Math.PI * 0.42 + (i / latBands) * (Math.PI * 0.84);
      const lat1 = -Math.PI * 0.42 + ((i + 1) / latBands) * (Math.PI * 0.84);
      const cosLat0 = Math.cos(lat0), sinLat0 = Math.sin(lat0);
      const cosLat1 = Math.cos(lat1), sinLat1 = Math.sin(lat1);

      for (let j = 0; j < lonSegments; j++) {
        const lon0 = rot + (j / lonSegments) * Math.PI * 2;
        const lon1 = rot + ((j + 1) / lonSegments) * Math.PI * 2;

        if (cosLat0 * Math.cos(lon0) <= -0.15) continue;

        const x00 = radius * cosLat0 * Math.sin(lon0);
        const y00 = -radius * sinLat0;
        const x10 = radius * cosLat0 * Math.sin(lon1);
        const y10 = -radius * sinLat0;
        const x11 = radius * cosLat1 * Math.sin(lon1);
        const y11 = -radius * sinLat1;
        const x01 = radius * cosLat1 * Math.sin(lon0);
        const y01 = -radius * sinLat1;

        ctx.moveTo(ballX + x00, ballY + y00);
        ctx.lineTo(ballX + x10, ballY + y10);
        ctx.lineTo(ballX + x11, ballY + y11);
        ctx.lineTo(ballX + x01, ballY + y01);
      }
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 0.65;
    ctx.stroke();

    // 5. Halo perimetral ligero (0 Gradient Allocs)
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.28)';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius + 1.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  renderTopMilestone(ctx) {
    this.render3DComboExplosion(ctx);
  }

  renderRipples(ctx) {
    if (!this.fxRipples || this.fxRipples.length === 0 || !ctx) return;
    ctx.save();
    const len = this.fxRipples.length;

    for (let i = 0; i < len; i++) {
      const r = this.fxRipples[i];
      if (!r || r.alpha <= 0.01) continue;
      const alpha = Math.max(0, Math.min(1, r.alpha));
      const col = r.color || '#00f2fe';
      const rad = Math.max(1, r.radius);
      const maxR = Math.max(10, r.maxRadius || 90);
      const progress = Math.min(1, rad / maxR);
      const widthFactor = 1 - progress;

      // Halo elíptico en escorzo 3D contenido dentro del receptor
      ctx.strokeStyle = hexToRgba(col, alpha * 0.85);
      ctx.lineWidth = Math.max(1.5, 4.0 * widthFactor);
      ctx.beginPath();
      if (ctx.ellipse) {
        ctx.ellipse(r.x, r.y, rad, rad * 0.36, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(r.x, r.y, rad * 0.6, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  renderMusicalNotes() {
    if (!this.musicalNotes || this.musicalNotes.length === 0) return;
    const ctx = this.ctx;
    if (!this._musicalNoteSpriteCache) {
      this._musicalNoteSpriteCache = new Map();
    }
    ctx.save();
    for (let i = 0; i < this.musicalNotes.length; i++) {
      const mn = this.musicalNotes[i];
      if (!mn || mn.alpha <= 0.01) continue;
      const col = mn.color || '#ffd700';
      const sym = mn.symbol || '♪';
      const cacheKey = `${sym}_${col}`;
      let sprite = this._musicalNoteSpriteCache.get(cacheKey);
      if (!sprite) {
        const off = document.createElement('canvas');
        off.width = 40;
        off.height = 40;
        const octx = off.getContext('2d');
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.font = 'bold 22px "Cinzel", serif';
        octx.fillStyle = col;
        octx.fillText(sym, 20, 20);
        octx.fillStyle = '#ffffff';
        octx.font = 'bold 18px "Cinzel", serif';
        octx.fillText(sym, 20, 20);
        sprite = off;
        if (this._musicalNoteSpriteCache.size < 64) {
          this._musicalNoteSpriteCache.set(cacheKey, sprite);
        }
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, mn.alpha));
      ctx.translate(mn.x, mn.y);
      ctx.rotate(mn.rotation || 0);
      ctx.scale(mn.scale || 1, mn.scale || 1);
      ctx.drawImage(sprite, -20, -20);
      ctx.restore();
    }
    ctx.restore();
  }

  _getLyricKeySprite(cleanLyric, isPressed = false) {
    if (!this._lyricKeySpriteCache) {
      this._lyricKeySpriteCache = new Map();
    }
    const key = `${cleanLyric}_${isPressed ? 1 : 0}`;
    let sp = this._lyricKeySpriteCache.get(key);
    if (sp) return sp;

    const sprW = 132;
    const sprH = 42;
    const off = document.createElement('canvas');
    off.width = sprW;
    off.height = sprH;
    const octx = off.getContext('2d');
    const fontScale = cleanLyric.length > 6 ? (6 / cleanLyric.length) : 1.0;
    const fontSize = Math.round(Math.max(13, 25 * fontScale));
    octx.font = `900 ${fontSize}px Montserrat, -apple-system, sans-serif`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.lineJoin = 'round';
    octx.strokeStyle = 'rgba(255, 175, 0, 0.90)';
    octx.lineWidth = 3.2;
    octx.strokeText(cleanLyric, sprW * 0.5, sprH * 0.5);
    octx.fillStyle = isPressed ? '#ffe57f' : '#ffffff';
    octx.fillText(cleanLyric, sprW * 0.5, sprH * 0.5);

    if (this._lyricKeySpriteCache.size > 320) {
      this._lyricKeySpriteCache.clear();
    }
    this._lyricKeySpriteCache.set(key, off);
    return off;
  }

  initStormModeAssets() {
    if (this._stormAssetsReady && this._stormCloudLayers && this._stormCloudLayers.length === 3) {
      return;
    }
    this._stormAssetsReady = true;
    this._stormCloudLayers = [];

    // Pre-hornear 3 capas de nubes cumulonimbus volumétricas de alta definición (0 gradientes en tiempo real)
    const layerConfigs = [
      { w: 520, h: 210, puffs: 34, darkCol: [8, 13, 26], midCol: [24, 35, 58], rimCol: [94, 126, 168], seed: 11 },
      { w: 520, h: 220, puffs: 40, darkCol: [6, 10, 22], midCol: [18, 28, 48], rimCol: [120, 155, 200], seed: 29 },
      { w: 520, h: 200, puffs: 32, darkCol: [4, 8, 18],  midCol: [14, 22, 40], rimCol: [148, 184, 228], seed: 47 }
    ];

    for (let lIdx = 0; lIdx < layerConfigs.length; lIdx++) {
      const cfg = layerConfigs[lIdx];
      const cvs = document.createElement('canvas');
      cvs.width = cfg.w;
      cvs.height = cfg.h;
      const cctx = cvs.getContext('2d');

      // Función pseudo-aleatoria determinista para tiling horizontal perfecto (wrap-around en cfg.w)
      let s = cfg.seed;
      const rand = () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      };

      const drawPuffWrapped = (px, py, rx, ry, rCol, gCol, bCol, alphaPeak) => {
        for (let offset = -cfg.w; offset <= cfg.w; offset += cfg.w) {
          const cx = px + offset;
          if (cx + rx < 0 || cx - rx > cfg.w) continue;
          cctx.save();
          cctx.translate(cx, py);
          cctx.scale(1, ry / Math.max(1, rx));
          const grad = cctx.createRadialGradient(0, -rx * 0.18, rx * 0.08, 0, 0, rx);
          grad.addColorStop(0.0, `rgba(${rCol}, ${gCol}, ${bCol}, ${alphaPeak})`);
          grad.addColorStop(0.48, `rgba(${rCol}, ${gCol}, ${bCol}, ${(alphaPeak * 0.85).toFixed(3)})`);
          grad.addColorStop(0.78, `rgba(${rCol}, ${gCol}, ${bCol}, ${(alphaPeak * 0.38).toFixed(3)})`);
          grad.addColorStop(1.0, `rgba(${rCol}, ${gCol}, ${bCol}, 0)`);
          cctx.fillStyle = grad;
          cctx.beginPath();
          cctx.arc(0, 0, rx, 0, Math.PI * 2);
          cctx.fill();
          cctx.restore();
        }
      };

      // 1. Base densa del banco de tormenta en el centro de la franja para cubrir la pista con volumen realista
      const bodyGrad = cctx.createLinearGradient(0, cfg.h * 0.14, 0, cfg.h * 0.90);
      bodyGrad.addColorStop(0.00, `rgba(${cfg.midCol[0]}, ${cfg.midCol[1]}, ${cfg.midCol[2]}, 0)`);
      bodyGrad.addColorStop(0.24, `rgba(${cfg.midCol[0]}, ${cfg.midCol[1]}, ${cfg.midCol[2]}, 0.82)`);
      bodyGrad.addColorStop(0.55, `rgba(${cfg.darkCol[0]}, ${cfg.darkCol[1]}, ${cfg.darkCol[2]}, 0.96)`);
      bodyGrad.addColorStop(0.80, `rgba(${cfg.darkCol[0]}, ${cfg.darkCol[1]}, ${cfg.darkCol[2]}, 0.78)`);
      bodyGrad.addColorStop(1.00, `rgba(${cfg.darkCol[0]}, ${cfg.darkCol[1]}, ${cfg.darkCol[2]}, 0)`);
      cctx.fillStyle = bodyGrad;
      cctx.fillRect(0, 0, cfg.w, cfg.h);

      // 2. Cúmulos superiores con borde plateado/azulado iluminado por la luna y tormenta
      for (let i = 0; i < cfg.puffs; i++) {
        const px = (i / cfg.puffs) * cfg.w + (rand() - 0.5) * 28;
        const py = cfg.h * (0.26 + rand() * 0.34);
        const rx = 44 + rand() * 52;
        const ry = 32 + rand() * 36;
        drawPuffWrapped(px, py - ry * 0.22, rx * 0.95, ry * 0.88, cfg.rimCol[0], cfg.rimCol[1], cfg.rimCol[2], 0.52);
        drawPuffWrapped(px, py, rx, ry, cfg.midCol[0], cfg.midCol[1], cfg.midCol[2], 0.92);
        drawPuffWrapped(px, py + ry * 0.28, rx * 1.05, ry * 0.92, cfg.darkCol[0], cfg.darkCol[1], cfg.darkCol[2], 0.95);
      }

      this._stormCloudLayers.push(cvs);
    }

    // Sprite pre-horneado de resplandor interno de nube para relámpagos
    const flashCvs = document.createElement('canvas');
    flashCvs.width = 256;
    flashCvs.height = 160;
    const fctx = flashCvs.getContext('2d');
    const fGrad = fctx.createRadialGradient(128, 80, 8, 128, 80, 124);
    fGrad.addColorStop(0.0, 'rgba(235, 250, 255, 0.95)');
    fGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.65)');
    fGrad.addColorStop(0.72, 'rgba(30, 64, 175, 0.25)');
    fGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0)');
    fctx.fillStyle = fGrad;
    fctx.fillRect(0, 0, 256, 160);
    this._stormFlashSprite = flashCvs;

    // Pool fijo de gotas de lluvia (0 GC)
    const w = this.width || 360;
    const h = this.height || 640;
    this._stormRainPool = Array.from({ length: 72 }, (_, idx) => ({
      x: Math.random() * (w + 120) - 40,
      y: Math.random() * h,
      len: (idx % 3 === 0) ? (22 + Math.random() * 14) : (13 + Math.random() * 10),
      speed: (idx % 3 === 0) ? (820 + Math.random() * 260) : (580 + Math.random() * 200),
      fg: (idx % 3 === 0)
    }));

    this._stormSplashes = Array.from({ length: 14 }, () => ({
      x: Math.random() * w,
      y: (this.hitLineY || h * 0.84) + (Math.random() - 0.5) * 18,
      r: Math.random() * 10,
      maxR: 7 + Math.random() * 9
    }));

    this._stormLightningBolts = [];
    this._stormNextLightningTime = (performance.now() || 0) + 1200;
    this._stormLightningFlashAlpha = 0;
    this._stormLastRenderNow = performance.now() || 0;
  }

  _spawnStormLightningBolt(nowPerf) {
    const w = this.width || 360;
    const h = this.height || 640;
    const startX = w * (0.16 + Math.random() * 0.68);
    const startY = 0;
    const endY = h * (0.56 + Math.random() * 0.28);
    const segments = [];
    const branches = [];
    let curX = startX;
    let curY = startY;
    const steps = 11;
    const stepY = (endY - startY) / steps;

    for (let i = 0; i < steps; i++) {
      const nextX = curX + (Math.random() - 0.5) * 42;
      const nextY = curY + stepY;
      segments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });

      if (i > 1 && i < steps - 2 && Math.random() < 0.48) {
        let bx = nextX;
        let by = nextY;
        const bDir = Math.random() < 0.5 ? -1 : 1;
        for (let b = 0; b < 3; b++) {
          const nbx = bx + bDir * (10 + Math.random() * 18);
          const nby = by + stepY * (0.7 + Math.random() * 0.4);
          branches.push({ x1: bx, y1: by, x2: nbx, y2: nby });
          bx = nbx;
          by = nby;
        }
      }
      curX = nextX;
      curY = nextY;
    }

    if (!this._stormLightningBolts) this._stormLightningBolts = [];
    if (this._stormLightningBolts.length >= 2) this._stormLightningBolts.shift();
    this._stormLightningBolts.push({
      segments,
      branches,
      flashX: curX,
      flashY: Math.min(h * 0.60, endY * 0.85),
      birth: nowPerf,
      duration: 340
    });
    this._stormLightningFlashAlpha = 0.92;
    this._playStormThunderSound();
  }

  _playStormThunderSound() {
    try {
      if (this.masterMuted) return;
      const ctx = (this.synth && this.synth.ctx) ? this.synth.ctx : null;
      if (!ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(92, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.48);
      const vol = Math.min(0.16, (this.masterVolume ?? 1.0) * 0.14);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.52);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.54);
    } catch (_) {}
  }

  renderStormModeOverlay(ctx, currentTime) {
    if (!this._stormAssetsReady || !this._stormCloudLayers || this._stormCloudLayers.length === 0) {
      this.initStormModeAssets();
    }
    const nowPerf = this._frameNow || performance.now();
    const dt = Math.min(0.05, Math.max(0.004, (nowPerf - (this._stormLastRenderNow || nowPerf)) / 1000));
    this._stormLastRenderNow = nowPerf;

    const w = this.width || 360;
    const h = this.height || 640;
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.84);

    // Disparar rayos automáticos de la tormenta cada 1.8s - 3.6s
    if (nowPerf >= (this._stormNextLightningTime || 0)) {
      this._spawnStormLightningBolt(nowPerf);
      this._stormNextLightningTime = nowPerf + 1750 + Math.random() * 1850;
    }

    if (this._stormLightningFlashAlpha > 0) {
      this._stormLightningFlashAlpha = Math.max(0, this._stormLightningFlashAlpha - dt * 2.8);
    }

    // Ráfaga de viento dinámica que inclina la lluvia y mece las nubes
    const windAngleX = -0.18 + Math.sin(nowPerf * 0.0011) * 0.07;
    const rainPool = this._stormRainPool || [];

    ctx.save();

    // 1. Lluvia de fondo (un solo path por lote para 0 sobrecarga GPU)
    ctx.strokeStyle = 'rgba(148, 197, 255, 0.34)';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    for (let i = 0; i < rainPool.length; i++) {
      const r = rainPool[i];
      r.y += r.speed * dt;
      r.x += r.speed * windAngleX * dt;
      if (r.y > hitY + 28) {
        r.y = -25 - (i % 40);
        r.x = ((i * 53 + Math.floor(nowPerf * 0.17)) % (w + 140)) - 30;
      }
      if (!r.fg) {
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.len * windAngleX, r.y + r.len);
      }
    }
    ctx.stroke();

    // 2. Rayos eléctricos bifurcados de alta tensión
    if (this._stormLightningBolts && this._stormLightningBolts.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let bIdx = this._stormLightningBolts.length - 1; bIdx >= 0; bIdx--) {
        const bolt = this._stormLightningBolts[bIdx];
        const age = nowPerf - bolt.birth;
        if (age >= bolt.duration) {
          this._stormLightningBolts.splice(bIdx, 1);
          continue;
        }
        // Parpadeo eléctrico realista del rayo (enciende-apaga-enciende)
        const norm = age / bolt.duration;
        const flicker = (norm > 0.22 && norm < 0.36) || (norm > 0.56 && norm < 0.66) ? 0.15 : (1.0 - norm * 0.65);
        if (flicker <= 0.05) continue;

        // Halo exterior azul-eléctrico (sin shadowBlur)
        ctx.strokeStyle = `rgba(56, 189, 248, ${(flicker * 0.48).toFixed(3)})`;
        ctx.lineWidth = 7.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let s = 0; s < bolt.segments.length; s++) {
          const seg = bolt.segments[s];
          if (s === 0) ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();

        // Ramas secundarias
        if (bolt.branches.length > 0) {
          ctx.strokeStyle = `rgba(125, 211, 252, ${(flicker * 0.72).toFixed(3)})`;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          for (let br = 0; br < bolt.branches.length; br++) {
            const bSeg = bolt.branches[br];
            ctx.moveTo(bSeg.x1, bSeg.y1);
            ctx.lineTo(bSeg.x2, bSeg.y2);
          }
          ctx.stroke();
        }

        // Núcleo incandescente blanco puro del rayo
        ctx.strokeStyle = `rgba(255, 255, 255, ${(flicker * 0.98).toFixed(3)})`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let s = 0; s < bolt.segments.length; s++) {
          const seg = bolt.segments[s];
          if (s === 0) ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. BANCO DE NUBES VOLUMÉTRICAS HD EN LA ZONA MEDIA-BAJA DE LA PANTALLA
    // Cubre la parte media-baja de la pista (~38% a ~78% de la altura), dejando ver el inicio arriba y la línea de impacto abajo
    const cloudBandTop = hitY * 0.42;
    const cloudBandH = hitY * 0.46;
    const speeds = [22, -34, 46];

    for (let lIdx = 0; lIdx < this._stormCloudLayers.length; lIdx++) {
      const layerCvs = this._stormCloudLayers[lIdx];
      const tileW = Math.max(w * 1.25, 440);
      const scrollX = ((nowPerf * 0.001 * speeds[lIdx]) % tileW + tileW) % tileW;
      const bobY = Math.sin(nowPerf * 0.0016 + lIdx * 1.9) * 8;
      const drawY = cloudBandTop + (lIdx - 1) * 16 + bobY;

      ctx.globalAlpha = lIdx === 1 ? 0.98 : 0.92;
      ctx.drawImage(layerCvs, -scrollX, drawY, tileW, cloudBandH);
      ctx.drawImage(layerCvs, tileW - scrollX, drawY, tileW, cloudBandH);
    }

    // 4. Iluminación interna de las nubes cuando cae un rayo
    if (this._stormLightningFlashAlpha > 0.02 && this._stormFlashSprite) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(0.85, this._stormLightningFlashAlpha);
      const fx = (this._stormLightningBolts && this._stormLightningBolts[0]) ? this._stormLightningBolts[0].flashX : (w * 0.5);
      const fy = cloudBandTop + cloudBandH * 0.48;
      ctx.drawImage(this._stormFlashSprite, fx - w * 0.55, fy - cloudBandH * 0.55, w * 1.1, cloudBandH * 1.1);
      ctx.restore();
    }

    // 5. Lluvia intensa de primer plano + salpicaduras en la línea de golpeo
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = 'rgba(210, 235, 255, 0.56)';
    ctx.lineWidth = 1.65;
    ctx.beginPath();
    for (let i = 0; i < rainPool.length; i++) {
      const r = rainPool[i];
      if (r.fg) {
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.len * windAngleX, r.y + r.len);
      }
    }
    ctx.stroke();

    if (this._stormSplashes) {
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.42)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let i = 0; i < this._stormSplashes.length; i++) {
        const sp = this._stormSplashes[i];
        sp.r += dt * 26;
        if (sp.r > sp.maxR) {
          sp.r = 1;
          sp.x = ((i * 73 + Math.floor(nowPerf * 0.23)) % (w - 40)) + 20;
        }
        ctx.moveTo(sp.x + sp.r, sp.y);
        if (ctx.ellipse) {
          ctx.ellipse(sp.x, sp.y, sp.r, sp.r * 0.32, 0, 0, Math.PI * 2);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================================
  // MODO SETAS ALUCINÓGENAS (PSICODELIA 120 FPS, SETAS HD, CÁMARA EBRIA E INVERSIÓN DE GRAVEDAD)
  // =========================================================================
  initMushroomModeAssets() {
    if (this._mushAssetsReady && this._mushSprites && this._mushSprites.length === 4) {
      return;
    }
    this._mushAssetsReady = true;
    this._mushSprites = [];

    // Pre-hornear 4 sprites de setas mágicas bioluminiscentes en alta definición (0 gradientes en tiempo real)
    const palettes = [
      { capTop: '#ff00aa', capBot: '#7900ff', spots: '#00f2fe', stem: '#ffe6ff', glow: 'rgba(255, 0, 170, 0.42)' },
      { capTop: '#00ff88', capBot: '#0088ff', spots: '#ffee00', stem: '#e0fff4', glow: 'rgba(0, 255, 136, 0.42)' },
      { capTop: '#ff5500', capBot: '#ff0055', spots: '#ffffff', stem: '#fff3e0', glow: 'rgba(255, 85, 0, 0.42)' },
      { capTop: '#00e5ff', capBot: '#7b2cbf', spots: '#ff00ff', stem: '#e0f7fa', glow: 'rgba(0, 229, 255, 0.42)' }
    ];

    for (let i = 0; i < palettes.length; i++) {
      const pal = palettes[i];
      const cvs = document.createElement('canvas');
      cvs.width = 76;
      cvs.height = 76;
      const c = cvs.getContext('2d');
      const cx = 38;
      const cy = 38;

      // Halo psicodélico exterior
      const halo = c.createRadialGradient(cx, cy - 4, 4, cx, cy, 36);
      halo.addColorStop(0, pal.glow);
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = halo;
      c.fillRect(0, 0, 76, 76);

      // Tallo orgánico curvado de la seta
      c.fillStyle = pal.stem;
      c.strokeStyle = pal.capBot;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(cx - 7, cy + 2);
      c.quadraticCurveTo(cx - 9, cy + 16, cx - 10, cy + 26);
      c.quadraticCurveTo(cx, cy + 31, cx + 10, cy + 26);
      c.quadraticCurveTo(cx + 8, cy + 15, cx + 7, cy + 2);
      c.closePath();
      c.fill();
      c.stroke();

      // Sombrero de seta alucinógena
      const capGrad = c.createLinearGradient(cx, cy - 26, cx, cy + 6);
      capGrad.addColorStop(0, pal.capTop);
      capGrad.addColorStop(1, pal.capBot);
      c.fillStyle = capGrad;
      c.beginPath();
      c.moveTo(cx - 26, cy + 4);
      c.bezierCurveTo(cx - 28, cy - 26, cx + 28, cy - 26, cx + 26, cy + 4);
      c.quadraticCurveTo(cx, cy + 10, cx - 26, cy + 4);
      c.closePath();
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.6;
      c.stroke();

      // Motas luminosas del sombrero
      c.fillStyle = pal.spots;
      const spotCoords = [
        { x: cx, y: cy - 14, r: 4.5 },
        { x: cx - 13, y: cy - 8, r: 3.6 },
        { x: cx + 13, y: cy - 8, r: 3.6 },
        { x: cx - 7, y: cy - 1, r: 2.6 },
        { x: cx + 8, y: cy - 1, r: 2.8 }
      ];
      for (let s = 0; s < spotCoords.length; s++) {
        const sp = spotCoords[s];
        c.beginPath();
        c.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        c.fill();
      }

      this._mushSprites.push(cvs);
    }

    // Pool fijo de setas flotantes a ambos lados de la pista y esporas luminosas (0 allocs en el bucle)
    this._mushSideMushrooms = [];
    for (let i = 0; i < 8; i++) {
      this._mushSideMushrooms.push({
        side: i % 2 === 0 ? -1 : 1,
        progress: (i / 8),
        speed: 0.14 + (i % 3) * 0.04,
        spriteIdx: i % 4,
        phase: i * 0.9,
        baseSize: 34 + (i % 3) * 10
      });
    }

    this._mushSporesPool = [];
    for (let i = 0; i < 28; i++) {
      this._mushSporesPool.push({
        x: (i * 41) % 360,
        y: (i * 67) % 640,
        vx: (i % 2 === 0 ? 1 : -1) * (12 + (i % 5) * 5),
        vy: -18 - (i % 4) * 9,
        r: 2.0 + (i % 3) * 1.4,
        color: ['#ff00ff', '#00ff88', '#00f2fe', '#ffee00'][i % 4],
        phase: i * 0.7
      });
    }
  }

  _beginMushroomWorldTransform(ctx, currentTime) {
    if (!this._mushAssetsReady) this.initMushroomModeAssets();
    const nowPerf = this._frameNow || performance.now();
    const dt = Math.min(0.05, Math.max(0.004, (nowPerf - (this._mushLastTransformNow || nowPerf)) / 1000));
    this._mushLastTransformNow = nowPerf;

    // Programar inversiones elegantes de gravedad cada ~13.5 segundos
    if (currentTime > 3000 && currentTime >= (this._mushNextFlipTimeMs || 9500)) {
      this._mushTargetFlipped = !this._mushTargetFlipped;
      this._mushNextFlipTimeMs = currentTime + 13500;
      this._mushBannerText = this._mushTargetFlipped
        ? '🍄 ¡GRAVEDAD INVERTIDA: PERFECT ARRIBA! 🍄'
        : '🍄 ¡GRAVEDAD NORMAL: PERFECT ABAJO! 🍄';
      this._mushBannerTimer = 2.6;
    }

    const targetP = this._mushTargetFlipped ? 1.0 : 0.0;
    const curP = this._mushFlipProgress || 0.0;
    if (Math.abs(targetP - curP) > 0.001) {
      const step = dt / 1.65; // Transición suave y elegante de 1.65s
      if (curP < targetP) {
        this._mushFlipProgress = Math.min(1.0, curP + step);
      } else {
        this._mushFlipProgress = Math.max(0.0, curP - step);
      }
      this._mushSafeGraceUntilMs = currentTime + 750;
      this._mushInSafeTransition = true;
      this.invulnerableUntil = Math.max(this.invulnerableUntil || 0, currentTime + 900);
    } else {
      this._mushFlipProgress = targetP;
      this._mushInSafeTransition = currentTime < (this._mushSafeGraceUntilMs || 0);
    }

    if (this._mushBannerTimer > 0) {
      this._mushBannerTimer = Math.max(0, this._mushBannerTimer - dt);
    }

    const w = this.width || 360;
    const h = this.height || 640;
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.84);
    const horizonY = 12;
    const midTrackY = (horizonY + hitY) * 0.52;

    const tSec = currentTime * 0.001;
    const flipEase = 0.5 - 0.5 * Math.cos(Math.PI * (this._mushFlipProgress || 0));
    const flipSin = Math.sin(Math.PI * flipEase);

    // Balanceo de cámara ebria + rotación suave durante la transición de gravedad
    const camRoll = Math.sin(tSec * 1.45) * 0.052 + Math.cos(tSec * 0.82) * 0.025 + flipSin * 0.18;
    const camScaleX = (1.0 + Math.sin(tSec * 2.15) * 0.036) * (1.0 - flipSin * 0.12);
    const rawScaleY = (1.0 - 2.0 * flipEase) * (1.0 + Math.cos(tSec * 1.85) * 0.03);
    const safeScaleY = Math.abs(rawScaleY) < 0.07 ? (rawScaleY < 0 ? -0.07 : 0.07) : rawScaleY;
    const swayX = Math.sin(tSec * 1.15) * 11;

    ctx.save();
    ctx.translate(w * 0.5 + swayX, midTrackY);
    ctx.rotate(camRoll);
    ctx.scale(camScaleX, safeScaleY);
    ctx.translate(-w * 0.5, -midTrackY);
  }

  _endMushroomWorldTransform(ctx) {
    ctx.restore();
  }

  renderMushroomModeOverlay(ctx, currentTime) {
    if (!this._mushAssetsReady || !this._mushSprites) {
      this.initMushroomModeAssets();
    }
    const nowPerf = this._frameNow || performance.now();
    const dt = Math.min(0.05, Math.max(0.004, (nowPerf - (this._mushLastOverlayNow || nowPerf)) / 1000));
    this._mushLastOverlayNow = nowPerf;

    const w = this.width || 360;
    const h = this.height || 640;
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.84);
    const tSec = currentTime * 0.001;
    const beatDur = 60000 / Math.max(60, this.bpm || 120);
    const beatPulse = Math.pow(1.0 - ((currentTime % beatDur) / beatDur), 2.0);

    ctx.save();

    // 1. Neblina caleidoscópica psicodélica en los bordes (sin costosos radialGradients por frame)
    ctx.globalCompositeOperation = 'lighter';
    const auraColors = ['rgba(255, 0, 170, 0.11)', 'rgba(0, 255, 136, 0.10)', 'rgba(0, 229, 255, 0.11)'];
    const activeAura = auraColors[Math.floor(tSec * 1.5) % auraColors.length];
    ctx.fillStyle = activeAura;
    ctx.fillRect(0, 0, 18 + Math.sin(tSec * 3) * 6, h);
    ctx.fillRect(w - (18 + Math.cos(tSec * 3) * 6), 0, 24, h);

    // 2. Esporas psicodélicas flotantes
    if (this._mushSporesPool) {
      for (let i = 0; i < this._mushSporesPool.length; i++) {
        const sp = this._mushSporesPool[i];
        sp.x += (sp.vx + Math.sin(tSec * 2.2 + sp.phase) * 18) * dt;
        sp.y += sp.vy * (this._mushTargetFlipped ? -1 : 1) * dt;
        if (sp.y < -10) sp.y = h + 10;
        if (sp.y > h + 10) sp.y = -10;
        if (sp.x < -10) sp.x = w + 10;
        if (sp.x > w + 10) sp.x = -10;

        ctx.fillStyle = sp.color;
        ctx.globalAlpha = 0.45 + 0.35 * Math.sin(tSec * 4 + sp.phase);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r * (1 + beatPulse * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Setas alucinógenas animadas brotando y bailando a los lados de la pista
    ctx.globalCompositeOperation = 'source-over';
    if (this._mushSideMushrooms && this._mushSprites.length > 0) {
      for (let i = 0; i < this._mushSideMushrooms.length; i++) {
        const m = this._mushSideMushrooms[i];
        m.progress = (m.progress + m.speed * dt) % 1.0;
        const p = m.progress;
        const yPos = this._mushTargetFlipped
          ? (hitY - p * (hitY - 30))
          : (30 + p * (hitY - 30));
        const bndX = this.getLaneBoundaryX(m.side < 0 ? 0 : 3, 30 + p * (hitY - 30));
        const xPos = bndX + m.side * (16 + p * 18) + Math.sin(tSec * 3.2 + m.phase) * 7;
        const scaleM = (0.55 + 0.65 * p) * (1.0 + beatPulse * 0.24);
        const sz = m.baseSize * scaleM;
        const tilt = Math.sin(tSec * 4.0 + m.phase) * 0.28;

        ctx.save();
        ctx.globalAlpha = Math.min(0.95, p * 2.5) * (1.0 - Math.max(0, (p - 0.85) / 0.15));
        ctx.translate(xPos, yPos);
        ctx.rotate(tilt);
        ctx.scale(1.0 + Math.sin(tSec * 5 + m.phase) * 0.16, 1.0 + Math.cos(tSec * 5 + m.phase) * 0.16);
        const spr = this._mushSprites[m.spriteIdx % this._mushSprites.length];
        ctx.drawImage(spr, -sz * 0.5, -sz * 0.5, sz, sz);
        ctx.restore();
      }
    }

    // 4. Portal circular y cartel durante la transición elegante de gravedad (sin perder combo)
    const flipEase = 0.5 - 0.5 * Math.cos(Math.PI * (this._mushFlipProgress || 0));
    const flipSin = Math.sin(Math.PI * flipEase);
    if (flipSin > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const portalR = (w * 0.42) * flipSin;
      ctx.strokeStyle = `rgba(255, 0, 255, ${(flipSin * 0.75).toFixed(2)})`;
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.46, portalR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(0, 255, 136, ${(flipSin * 0.75).toFixed(2)})`;
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.46, portalR * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this._mushBannerTimer > 0 && this._mushBannerText) {
      ctx.save();
      const alpha = Math.min(1, this._mushBannerTimer * 1.5);
      ctx.globalAlpha = alpha;
      const bannerY = h * 0.24;
      ctx.fillStyle = 'rgba(10, 4, 20, 0.82)';
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2.2;
      const bw = Math.min(w - 24, 332);
      const bh = 34;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(w * 0.5 - bw * 0.5, bannerY - bh * 0.5, bw, bh, 12);
      else ctx.rect(w * 0.5 - bw * 0.5, bannerY - bh * 0.5, bw, bh);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 12px "Outfit", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(this._mushBannerText, w * 0.5, bannerY);
      ctx.restore();
    }

    ctx.restore();
  }

  // =========================================================================
  // PSEUDO-3D CONICAL ENGINE (BEATSTAR PERSPECTIVE)
  // =========================================================================

  getPerspectiveCoord(lane, p, out = null) {
    // p: 0.0 at horizon, 1.0 at hit line (y = hitLineY)
    const pClamped = p < -0.25 ? -0.25 : (p > 1.4 ? 1.4 : p);
    const pCurved = pClamped >= 0 ? Math.pow(pClamped, 1.7) : -Math.pow(-pClamped, 1.7);
    const horizonY = this._perspHorizonY || 12;
    const spanY = this._perspSpanY || ((Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84)) - horizonY);
    const y = horizonY + spanY * pCurved;

    const baseLaneW = this._perspBaseLaneW || ((this.width * 0.94) / 3);
    const scale = 0.50 + 0.50 * pCurved;
    const laneW = baseLaneW * scale;
    const midX = this._perspMidX || (this.width * 0.5);
    const x = midX + (lane - 1) * laneW;

    if (out) {
      out.x = x;
      out.y = y;
      out.scale = scale;
      out.laneW = laneW;
      out.pCurved = pCurved;
      return out;
    }
    return { x, y, scale, laneW, pCurved };
  }

  getLaneBoundaryX(lineIdx, yTarget) {
    const horizonY = this._perspHorizonY || 12;
    const invSpanY = this._perspInvSpanY || (1.0 / ((Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84)) - horizonY));
    const midX = this._perspMidX || (this.width * 0.5);
    const baseLaneW = this._perspBaseLaneW || ((this.width * 0.94) / 3);
    const t = (yTarget - horizonY) * invSpanY;
    const scale = 0.50 + 0.50 * t;
    return midX + (lineIdx - 1.5) * (baseLaneW * scale);
  }

  drawIvoryKey(ctx, laneOrCx, cy, h, scale = 1.0, isPressed = false, isLarge = true, isSwipe = false, lyricText = null) {
    ctx.save();

    let lane = 0;
    if (typeof laneOrCx === 'number') {
      if (laneOrCx <= 2.5) {
        lane = Math.max(0, Math.min(2, laneOrCx));
      } else {
        const laneW = this.width / 3;
        lane = Math.max(0, Math.min(2, Math.floor(laneOrCx / laneW)));
      }
    }

    const depressOffset = isPressed ? (3.5 * scale) : 0;
    const y = cy + depressOffset;
    const y0 = y - h / 2;
    const y1 = y0 + h;

    const margin = Math.max(3.0, (isLarge ? 5.0 : 3.5) * scale);

    const x0Top = this.getLaneBoundaryX(lane, y0) + margin;
    const x1Top = this.getLaneBoundaryX(lane + 1, y0) - margin;
    const x0Bot = this.getLaneBoundaryX(lane, y1) + margin;
    const x1Bot = this.getLaneBoundaryX(lane + 1, y1) - margin;

    const r = Math.max(4, (isLarge ? 10 : 6) * scale);

    const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : { primary: '#ff00aa', secondary: '#ffffff', glow: '#ff00aa' });
    const glowColor = palette ? (palette.glow || palette.primary) : '#ff00aa';

    const cx = (x0Top + x1Top + x0Bot + x1Bot) / 4;
    const cyMid = (y0 + y1) / 2;
    const keyW = x1Bot - x0Bot;
    const keyH = y1 - y0;
    const isMushKey = Boolean(this.isMushroomModeActive || (typeof window !== 'undefined' && window.isMushroomModeActive));

    // 1. Sombra suave bajo la tecla (sin bordes semitransparentes hacia los lados)
    ctx.fillStyle = isPressed ? 'rgba(0, 0, 0, 0.20)' : 'rgba(0, 0, 0, 0.35)';
    const shadowOff = (isLarge ? 4.5 : 2.5) * scale;
    tracePerspectiveQuad(ctx, x0Top, x1Top, x0Bot, x1Bot, y0 + shadowOff, y1 + shadowOff, r);
    ctx.fill();

    // 2. Cara Frontal en grosor 3D negro mate (#141419)
    const bevelH = Math.max(3, (isLarge ? 9 : 5) * scale);
    const yBevelTop = y1 - bevelH;
    const x0Bev = this.getLaneBoundaryX(lane, yBevelTop) + margin;
    const x1Bev = this.getLaneBoundaryX(lane + 1, yBevelTop) - margin;

    ctx.fillStyle = isPressed ? '#22222a' : (isMushKey ? '#230b36' : '#141419');
    tracePerspectiveQuad(ctx, x0Bev, x1Bev, x0Bot, x1Bot, yBevelTop, y1, r);
    ctx.fill();

    // 3. Cara Superior en negro pulido (o púrpura psicodélico profundo en modo Setas)
    ctx.fillStyle = isPressed ? '#45e69e' : (isMushKey ? '#2d124d' : '#1a1d28');
    tracePerspectiveQuad(ctx, x0Top, x1Top, x0Bev, x1Bev, y0, yBevelTop, r);
    ctx.fill();

    // 4. Borde metálico nítido (o neón cambiante en modo Setas)
    ctx.save();
    const mushRimColors = ['#ff00ff', '#00ff88', '#00f2fe', '#ffee00'];
    const mushRimCol = isMushKey ? mushRimColors[Math.floor((cy * 0.03 + (this._frameNow || 0) * 0.006)) & 3] : '#3e4252';
    ctx.strokeStyle = isPressed ? '#ffffff' : mushRimCol;
    ctx.lineWidth = Math.max(1.1, (isPressed ? 2.2 : (isMushKey ? 2.1 : 1.4)) * scale);
    tracePerspectiveQuad(ctx, x0Top, x1Top, x0Bot, x1Bot, y0, y1, r);
    ctx.stroke();

    // Destello de bisel reflectante superior
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.40)';
    ctx.lineWidth = Math.max(0.8, 1.1 * scale);
    ctx.beginPath();
    ctx.moveTo(x0Top + r, y0 + 0.8);
    ctx.lineTo(x1Top - r, y0 + 0.8);
    ctx.stroke();
    ctx.restore();

    // ===========================================================================
    // 5. Hendidura de Luz Central incandescente O Palabra Grabada en Relieve
    // ===========================================================================
    if (!isSwipe) {
      if (lyricText) {
        const sp = this._getLyricKeySprite(lyricText, isPressed);
        const drawW = Math.min(keyW * 0.94, 132 * scale);
        const drawH = 42 * (drawW / 132);
        if (isMushKey && (this._mushFlipProgress || 0) > 0.5) {
          ctx.save();
          ctx.translate(cx, cyMid);
          ctx.scale(1, -1);
          ctx.drawImage(sp, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
          ctx.restore();
        } else {
          ctx.drawImage(sp, cx - drawW * 0.5, cyMid - drawH * 0.5, drawW, drawH);
        }
      } else {
        // Línea blanca neón pura y elegante en su posición original exacta (cyMid) con brillo blanco intenso (0 pasadas de shadowBlur GPU)
        const slitW = keyW * 0.62;
        const slitH = Math.max(4.5, 6.8 * scale);
        const slitX = cx - slitW / 2;
        const slitY = cyMid - slitH / 2;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // 0. Corona exterior difuminada amplia (sustituye exactamente el radio de 18px de shadowBlur sin penalizar la GPU)
        const wideSpreadX = 11.5 * scale;
        const wideSpreadY = 8.5 * scale;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(
            slitX - wideSpreadX,
            slitY - wideSpreadY,
            slitW + wideSpreadX * 2,
            slitH + wideSpreadY * 2,
            (slitH + wideSpreadY * 2) / 2
          );
        } else {
          ctx.rect(slitX - wideSpreadX, slitY - wideSpreadY, slitW + wideSpreadX * 2, slitH + wideSpreadY * 2);
        }
        ctx.fill();

        // 1. Resplandor difuminado exterior blanco neón puro
        const outerSpreadX = 5.5 * scale;
        const outerSpreadY = 4.2 * scale;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(
            slitX - outerSpreadX,
            slitY - outerSpreadY,
            slitW + outerSpreadX * 2,
            slitH + outerSpreadY * 2,
            (slitH + outerSpreadY * 2) / 2
          );
        } else {
          ctx.rect(slitX - outerSpreadX, slitY - outerSpreadY, slitW + outerSpreadX * 2, slitH + outerSpreadY * 2);
        }
        ctx.fill();

        // 2. Halo intermedio blanco brillante de alta luminosidad
        const midSpreadX = 2.4 * scale;
        const midSpreadY = 1.8 * scale;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(
            slitX - midSpreadX,
            slitY - midSpreadY,
            slitW + midSpreadX * 2,
            slitH + midSpreadY * 2,
            (slitH + midSpreadY * 2) / 2
          );
        } else {
          ctx.rect(slitX - midSpreadX, slitY - midSpreadY, slitW + midSpreadX * 2, slitH + midSpreadY * 2);
        }
        ctx.fill();

        // 3. Núcleo de tubo neón blanco puro incandescente (#ffffff)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(slitX, slitY, slitW, slitH, slitH / 2);
        else ctx.rect(slitX, slitY, slitW, slitH);
        ctx.fill();

        ctx.restore();
      }
    }

    ctx.restore();
    if (!this._keyRectScratch) {
      this._keyRectScratch = { cx: 0, cy: 0, w: 0, h: 0 };
    }
    this._keyRectScratch.cx = cx;
    this._keyRectScratch.cy = cyMid;
    this._keyRectScratch.w = keyW;
    this._keyRectScratch.h = keyH;
    return this._keyRectScratch;
  }

  // Tecla Neón 2D Clásica (para modo 2D Neón)
  draw2DNeonKey(ctx, cx, cy, w, h, isPressed = false, isLarge = true, lyricText = null) {
    ctx.save();
    const x0 = cx - w / 2;
    const y0 = cy - h / 2;
    const r = isLarge ? 8 : 5;

    ctx.shadowBlur = 0;

    const grad = ctx.createLinearGradient(0, y0, 0, y0 + h);
    if (isPressed) {
      grad.addColorStop(0.0, '#ffffff');
      grad.addColorStop(0.3, '#ff007f');
      grad.addColorStop(0.8, '#aa0055');
      grad.addColorStop(1.0, '#550022');
    } else {
      grad.addColorStop(0.0, '#ffffff');
      grad.addColorStop(0.15, '#e0fcff');
      grad.addColorStop(0.5, '#00d2fe');
      grad.addColorStop(0.85, '#005588');
      grad.addColorStop(1.0, '#002244');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x0, y0, w, h, r);
    else ctx.rect(x0, y0, w, h);
    ctx.fill();

    ctx.strokeStyle = isPressed ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = isLarge ? 2.2 : 1.4;
    ctx.stroke();

    if (lyricText) {
      const sp = this._getLyricKeySprite(lyricText, isPressed);
      const drawW = Math.min(w * 0.94, 124);
      const drawH = 42 * (drawW / 132);
      ctx.drawImage(sp, cx - drawW * 0.5, cy - drawH * 0.5, drawW, drawH);
    } else if (isLarge) {
      // Línea de energía central blanco neón brillante para teclas grandes en 2D (0 shadowBlur GPU)
      const slitW = w * 0.62;
      const slitH = 6.0;
      const slitX = cx - slitW / 2;
      const slitY = cy - slitH / 2;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(slitX - 7, slitY - 5, slitW + 14, slitH + 10, (slitH + 10) / 2);
      else ctx.rect(slitX - 7, slitY - 5, slitW + 14, slitH + 10);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(slitX - 3, slitY - 2.5, slitW + 6, slitH + 5, (slitH + 5) / 2);
      else ctx.rect(slitX - 3, slitY - 2.5, slitW + 6, slitH + 5);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(slitX, slitY, slitW, slitH, slitH / 2);
      else ctx.rect(slitX, slitY, slitW, slitH);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  renderLanes(currentTime = null) {
    const ctx = this.ctx;
    const cTime = Number.isFinite(currentTime) ? currentTime : (this.getCurrentGameTimeMs() || 0);
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    const horizonY = 12;
    const bottomY = this.height + 30;
    const midX = this.width / 2;
    const is3D = (this.visualDimension !== '2d');

    // Cálculo exacto del pulso Beatstar sincronizado al BPM de la canción
    const songBpm = (this.beatmapData && this.beatmapData.bpm) ? Math.max(40, this.beatmapData.bpm) : 128;
    let normBpm = songBpm;
    while (normBpm > 175) normBpm /= 2;
    while (normBpm < 75) normBpm *= 2;
    const beatInterval = 60 / normBpm;
    const safePerfNow = this._frameNow || performance.now();
    const audioTime = (cTime >= 0 ? cTime : safePerfNow) / 1000;
    const beatFraction = ((audioTime % beatInterval) + beatInterval) % beatInterval / beatInterval;
    const beatPulse = Math.pow(Math.max(0, 1 - beatFraction), 2.8); // Pico en el bombo

    // Multiplicador activo y color temático
    const mult = this.multiplier || 1;
    const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : null);
    let railLaserCol = palette ? (palette.primary || '#00f5a0') : '#00f5a0';
    let railGlowCol = palette ? (palette.glow || '#00f5a0') : '#00f5a0';

    if (mult === 2) {
      railLaserCol = '#ffd700'; // Dorado 2x
      railGlowCol = '#ffaa00';
    } else if (mult === 3) {
      railLaserCol = '#ff007f'; // Magenta Neón 3x
      railGlowCol = '#d946ef';
    } else if (mult === 4) {
      railLaserCol = '#00d4ff'; // Cian Eléctrico 4x
      railGlowCol = '#38bdf8';
    } else if (mult >= 5) {
      railLaserCol = '#a855f7'; // Púrpura Imperial / Oro 5x (sin blanco cegador)
      railGlowCol = '#ffd700';
    }

    // Actualizar portal del artista al compás del BPM con filtro de umbral para no tocar el DOM 120 veces/seg
    if (!this.hudArtistPortalEl) this.hudArtistPortalEl = document.getElementById('hudArtistPortal');
    if (this.hudArtistPortalEl && Math.abs(beatPulse - (this._lastPortalPulse || 0)) > 0.018) {
      this._lastPortalPulse = beatPulse;
      this.hudArtistPortalEl.style.transform = `scale(${(1 + beatPulse * 0.12).toFixed(3)})`;
    }

    ctx.save();

    if (is3D) {
      const getBoundaryX = (lineIdx, yTarget) => this.getLaneBoundaryX(lineIdx, yTarget);

      // 1. AUTOPISTA 3D BLANCA NACARADA DE ALTA GAMA CON VOLUMEN CILÍNDRICO Y SOMBRA DIFUMINADA EN EL HORIZONTE
      const tL_top = getBoundaryX(0, horizonY);
      const tR_top = getBoundaryX(3, horizonY);
      const tR_bot = getBoundaryX(3, bottomY);
      const tL_bot = getBoundaryX(0, bottomY);

      // A1. Superficie principal con degradado nacarado 3D (o autopista psicodélica en Modo Setas Alucinógenas)
      const isMushTrack = Boolean(this.isMushroomModeActive || (typeof window !== 'undefined' && window.isMushroomModeActive));
      if (isMushTrack && (!this._mushTrackGrad || this._mushTrackGradH !== bottomY)) {
        this._mushTrackGradH = bottomY;
        const mg = ctx.createLinearGradient(this.width / 2, horizonY, this.width / 2, bottomY);
        mg.addColorStop(0.00, '#120324');
        mg.addColorStop(0.25, '#2b0952');
        mg.addColorStop(0.55, '#431278');
        mg.addColorStop(0.82, '#5e179e');
        mg.addColorStop(1.00, '#380b66');
        this._mushTrackGrad = mg;
      }
      ctx.beginPath();
      ctx.moveTo(tL_top, horizonY);
      ctx.lineTo(tR_top, horizonY);
      ctx.lineTo(tR_bot, bottomY);
      ctx.lineTo(tL_bot, bottomY);
      ctx.closePath();
      ctx.fillStyle = isMushTrack ? (this._mushTrackGrad || '#2b0952') : (this._trackGrad || '#f8fafc');
      ctx.fill();

      // A2. Sombreado cilíndrico 3D de bordes y brillo central perlado
      if (this._trackEdgeShadowGrad) {
        ctx.fillStyle = this._trackEdgeShadowGrad;
        ctx.fill();
      }

      // A3. Lomo especular 3D en el centro de cada uno de los 3 carriles para dar relieve individual
      ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.beginPath();
      for (let l = 0; l < 3; l++) {
        const cTopL = getBoundaryX(l + 0.28, horizonY);
        const cTopR = getBoundaryX(l + 0.72, horizonY);
        const cBotR = getBoundaryX(l + 0.72, bottomY);
        const cBotL = getBoundaryX(l + 0.28, bottomY);
        ctx.moveTo(cTopL, horizonY);
        ctx.lineTo(cTopR, horizonY);
        ctx.lineTo(cBotR, bottomY);
        ctx.lineTo(cBotL, bottomY);
        ctx.closePath();
      }
      ctx.fill();

      // A4. Oclusión ambiental interna a lo largo de los bordes laterales en perspectiva 3D
      ctx.fillStyle = 'rgba(30, 41, 59, 0.16)';
      ctx.beginPath();
      // Borde interior izquierdo
      ctx.moveTo(tL_top, horizonY);
      ctx.lineTo(getBoundaryX(0.14, horizonY), horizonY);
      ctx.lineTo(getBoundaryX(0.14, bottomY), bottomY);
      ctx.lineTo(tL_bot, bottomY);
      ctx.closePath();
      // Borde interior derecho
      ctx.moveTo(getBoundaryX(2.86, horizonY), horizonY);
      ctx.lineTo(tR_top, horizonY);
      ctx.lineTo(tR_bot, bottomY);
      ctx.lineTo(getBoundaryX(2.86, bottomY), bottomY);
      ctx.closePath();
      ctx.fill();

      // B. Líneas de compás en perspectiva 3D (se desvanecen suavemente hacia el horizonte)
      const numRungs = 20;
      for (let r = 2; r < numRungs; r++) {
        const p = Math.pow(r / numRungs, 2.25);
        const ry = horizonY + (bottomY - horizonY) * p;
        const rungAlpha = Math.min(0.16, p * 0.18);
        ctx.strokeStyle = `rgba(71, 85, 105, ${rungAlpha.toFixed(3)})`;
        ctx.lineWidth = 0.8 + p * 0.7;
        ctx.beginPath();
        ctx.moveTo(getBoundaryX(0, ry) + 2, ry);
        ctx.lineTo(getBoundaryX(3, ry) - 2, ry);
        ctx.stroke();
      }

      // C. Hendiduras divisorias de carril grabadas en 3D (Sombra de surco + Bisel especular blanco)
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.34)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let l = 1; l <= 2; l++) {
        ctx.moveTo(getBoundaryX(l, horizonY), horizonY);
        ctx.lineTo(getBoundaryX(l, bottomY), bottomY);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let l = 1; l <= 2; l++) {
        ctx.moveTo(getBoundaryX(l, horizonY) + 1.4, horizonY);
        ctx.lineTo(getBoundaryX(l, bottomY) + 1.8, bottomY);
      }
      ctx.stroke();

      // D. SOMBRA 3D DIFUMINADA AL FINAL DE LA PISTA (Horizonte profundo sin bloques negros)
      if (this._trackHorizonShadowGrad) {
        const shadowEndY = horizonY + (hitY - horizonY) * 0.30;
        const sL_bot = getBoundaryX(0, shadowEndY);
        const sR_bot = getBoundaryX(3, shadowEndY);
        ctx.save();
        ctx.fillStyle = this._trackHorizonShadowGrad;
        ctx.beginPath();
        ctx.moveTo(tL_top - 1, horizonY);
        ctx.lineTo(tR_top + 1, horizonY);
        ctx.lineTo(sR_bot + 1, shadowEndY);
        ctx.lineTo(sL_bot - 1, shadowEndY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 2. RESPLANDOR DIFUMINADO EN EL CARRIL AL TOCAR UNA TECLA (Color exacto de PERFECT+, PERFECT, GREAT, GOOD - 0 Gradient Allocs por frame)
      const hitGradCacheKey = `${this.width}_${hitY}_${horizonY}`;
      if (!this._laneTapGradCache || this._laneTapGradCacheKey !== hitGradCacheKey) {
        this._laneTapGradCache = new Map();
        this._laneTapGradCacheKey = hitGradCacheKey;
      }

      for (let l = 0; l < 3; l++) {
        const flashTimer = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
        const isHolding = this.activeHolds.has(l);
        const glow = this.laneGlows[l] || 0;

        if (isHolding || flashTimer > 0.005 || glow > 0.02) {
          const flashCol = (Array.isArray(this.laneFlashColors) && this.laneFlashColors[l]) || this.getJudgeGlowColor('perfectPlus');
          const intensity = isHolding
            ? 0.88
            : Math.min(1.0, Math.max(flashTimer / 0.28, glow * 0.75));
          const easeGlow = Math.pow(intensity, 0.85);

          const cKey = `${l}_${flashCol}`;
          let cached = this._laneTapGradCache.get(cKey);
          if (!cached) {
            const rgb = hexToRgb(flashCol);
            const auraTopY = horizonY + (hitY - horizonY) * 0.22;
            const auraBotY = hitY + 30;
            const aL_top = getBoundaryX(l, auraTopY);
            const aR_top = getBoundaryX(l + 1, auraTopY);
            const aL_bot = getBoundaryX(l, auraBotY);
            const aR_bot = getBoundaryX(l + 1, auraBotY);

            const vGrad = ctx.createLinearGradient(0, auraBotY, 0, auraTopY);
            vGrad.addColorStop(0.00, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.62)`);
            vGrad.addColorStop(0.14, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.54)`);
            vGrad.addColorStop(0.32, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.36)`);
            vGrad.addColorStop(0.55, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`);
            vGrad.addColorStop(0.78, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`);
            vGrad.addColorStop(1.00, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.000)`);

            const hitCx = (getBoundaryX(l, hitY) + getBoundaryX(l + 1, hitY)) * 0.5;
            const laneWAtHit = Math.max(30, getBoundaryX(l + 1, hitY) - getBoundaryX(l, hitY));
            const bloomCy = hitY - 8;
            const bloomRadius = laneWAtHit * 0.95;

            const rGrad = ctx.createRadialGradient(hitCx, bloomCy, 2, hitCx, bloomCy, bloomRadius);
            rGrad.addColorStop(0.00, `rgba(255, 255, 255, 0.75)`);
            rGrad.addColorStop(0.22, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.72)`);
            rGrad.addColorStop(0.52, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38)`);
            rGrad.addColorStop(0.80, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
            rGrad.addColorStop(1.00, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.000)`);

            cached = { auraTopY, auraBotY, aL_top, aR_top, aL_bot, aR_bot, vGrad, rGrad };
            if (this._laneTapGradCache.size < 36) {
              this._laneTapGradCache.set(cKey, cached);
            }
          }

          ctx.save();
          ctx.globalAlpha = easeGlow;

          // A. Degradado longitudinal ultra-difuminado que nace en el receptor y se disipa suavemente por el carril
          ctx.fillStyle = cached.vGrad;
          ctx.beginPath();
          ctx.moveTo(cached.aL_top, cached.auraTopY);
          ctx.lineTo(cached.aR_top, cached.auraTopY);
          ctx.lineTo(cached.aR_bot, cached.auraBotY);
          ctx.lineTo(cached.aL_bot, cached.auraBotY);
          ctx.closePath();
          ctx.fill();

          // B. Nebulosa elíptica radial difuminada centrada en la zona de impacto del carril
          ctx.fillStyle = cached.rGrad;
          ctx.fill();

          ctx.restore();
        }
      }
      // 3. BISEL METÁLICO 3D DE PRECISIÓN EN LOS BORDES DE LA AUTOPISTA (Estilo Beatstar Original)
      const railTopW = 5.0;
      const railBotW = 14.0;

      ctx.save();
      ctx.fillStyle = '#0d1322';
      // Bisel lateral izquierdo
      ctx.beginPath();
      ctx.moveTo(tL_top, horizonY);
      ctx.lineTo(Math.max(0, tL_top - railTopW), horizonY);
      ctx.lineTo(Math.max(0, tL_bot - railBotW), bottomY);
      ctx.lineTo(tL_bot, bottomY);
      ctx.closePath();
      ctx.fill();

      // Bisel lateral derecho
      ctx.beginPath();
      ctx.moveTo(tR_top, horizonY);
      ctx.lineTo(Math.min(this.width, tR_top + railTopW), horizonY);
      ctx.lineTo(Math.min(this.width, tR_bot + railBotW), bottomY);
      ctx.lineTo(tR_bot, bottomY);
      ctx.closePath();
      ctx.fill();

      // Arista exterior cromada de los raíles 3D
      ctx.strokeStyle = 'rgba(148, 178, 214, 0.48)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.max(0, tL_top - railTopW), horizonY);
      ctx.lineTo(Math.max(0, tL_bot - railBotW), bottomY);
      ctx.moveTo(Math.min(this.width, tR_top + railTopW), horizonY);
      ctx.lineTo(Math.min(this.width, tR_bot + railBotW), bottomY);
      ctx.stroke();
      ctx.restore();

      // 4. ALAS DE RITMO NEÓN ESTILO BEATSTAR ORIGINAL + EFECTOS ESPECIALES DE BORDE (Fuego, Hielo, Rayos, etc.)
      const numRibs = 34;
      const bpmSpeed = (normBpm / 60) * Math.PI * 2;
      const theme = this.getEffectBorderTheme(this.activeEffect);
      const fx = theme.id;
      const timeSec = safePerfNow * 0.001;

      const frameScale = Math.min(2.5, (this._frameDt || 0.00833) * 60);
      this.borderSurgeL = Math.max(0, (this.borderSurgeL || 0) - 0.045 * frameScale);
      this.borderSurgeR = Math.max(0, (this.borderSurgeR || 0) - 0.045 * frameScale);
      const surgeL = this.borderSurgeL || 0;
      const surgeR = this.borderSurgeR || 0;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const tLx_top = getBoundaryX(0, horizonY);
      const tLx_bot = getBoundaryX(0, bottomY);
      const dyL = bottomY - horizonY;
      const dxL = tLx_bot - tLx_top;
      const lenL = Math.hypot(dxL, dyL) || 1;
      const normLx = -dyL / lenL;
      const normLy = dxL / lenL;

      const tRx_top = getBoundaryX(3, horizonY);
      const tRx_bot = getBoundaryX(3, bottomY);
      const dyR = bottomY - horizonY;
      const dxR = tRx_bot - tRx_top;
      const lenR = Math.hypot(dxR, dyR) || 1;
      const normRx = dyR / lenR;
      const normRy = -dxR / lenR;

      // --- CAPA 1: AURA DIFUMINADA VOLUMÉTRICA LATERAL FIEL AL TEMA DEL EFECTO (Pre-cacheada: 0 allocs/frame) ---
      const auraSpanTop = 34 + beatPulse * 12;
      const auraSpanBot = 82 + beatPulse * 24;
      const borderCacheKey = `${this.width}_${this.height}_${fx}`;
      if (!this._borderGradCache || this._borderGradCache.key !== borderCacheKey) {
        const primaryWingCol = theme.cInner;
        const midWingCol = theme.cMid;
        const outerWingCol = theme.cOuter;

        const lAura = ctx.createLinearGradient(
          (tLx_top + tLx_bot) * 0.5,
          (horizonY + bottomY) * 0.5,
          (tLx_top + tLx_bot) * 0.5 + normLx * 82,
          (horizonY + bottomY) * 0.5 + normLy * 82
        );
        lAura.addColorStop(0.0, hexToRgba(primaryWingCol, 0.46));
        lAura.addColorStop(0.40, hexToRgba(midWingCol, 0.25));
        lAura.addColorStop(0.80, hexToRgba(outerWingCol, 0.08));
        lAura.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

        const rAura = ctx.createLinearGradient(
          (tRx_top + tRx_bot) * 0.5,
          (horizonY + bottomY) * 0.5,
          (tRx_top + tRx_bot) * 0.5 + normRx * 82,
          (horizonY + bottomY) * 0.5 + normRy * 82
        );
        rAura.addColorStop(0.0, hexToRgba(primaryWingCol, 0.46));
        rAura.addColorStop(0.40, hexToRgba(midWingCol, 0.25));
        rAura.addColorStop(0.80, hexToRgba(outerWingCol, 0.08));
        rAura.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

        const vGrad = ctx.createLinearGradient(0, horizonY, 0, hitY);
        vGrad.addColorStop(0.00, outerWingCol);
        vGrad.addColorStop(0.32, midWingCol);
        vGrad.addColorStop(0.72, primaryWingCol);
        vGrad.addColorStop(1.00, '#ffffff');

        this._borderGradCache = { key: borderCacheKey, lAura, rAura, vGrad, primaryWingCol, midWingCol };
      }

      ctx.globalAlpha = Math.min(1.0, 0.72 + surgeL * 0.35 + beatPulse * 0.20);
      ctx.fillStyle = this._borderGradCache.lAura;
      ctx.beginPath();
      ctx.moveTo(tLx_top - railTopW, horizonY);
      ctx.lineTo(tLx_top + normLx * auraSpanTop, horizonY + normLy * auraSpanTop);
      ctx.lineTo(tLx_bot + normLx * auraSpanBot, bottomY + normLy * auraSpanBot);
      ctx.lineTo(tLx_bot - railBotW, bottomY);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = Math.min(1.0, 0.72 + surgeR * 0.35 + beatPulse * 0.20);
      ctx.fillStyle = this._borderGradCache.rAura;
      ctx.beginPath();
      ctx.moveTo(tRx_top + railTopW, horizonY);
      ctx.lineTo(tRx_top + normRx * auraSpanTop, horizonY + normRy * auraSpanTop);
      ctx.lineTo(tRx_bot + normRx * auraSpanBot, bottomY + normRy * auraSpanBot);
      ctx.lineTo(tRx_bot + railBotW, bottomY);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // --- CAPA 2: EFECTOS EXTRA TEMÁTICOS EN LOS BORDES LATERALES (Fuego 3D, Hielo, Relámpagos, Plasma, Meteoros) ---
      if (fx === 'solar_inferno' || fx === 'dragon_fire') {
        const numFlames = 18;
        ctx.fillStyle = hexToRgba(theme.cMid, 0.54);
        ctx.beginPath();
        for (let side = 0; side < 2; side++) {
          const isLeft = side === 0;
          const nX = isLeft ? normLx : normRx;
          const nY = isLeft ? normLy : normRy;
          const sideSurge = isLeft ? surgeL : surgeR;
          for (let f = 0; f < numFlames; f++) {
            const p0 = Math.pow(f / numFlames, 1.2);
            const p1 = Math.pow((f + 1.35) / numFlames, 1.2);
            const y0 = horizonY + (bottomY - horizonY) * p0;
            const y1 = horizonY + (bottomY - horizonY) * p1;
            const yMid = (y0 + y1) * 0.5;
            const x0 = getBoundaryX(isLeft ? 0 : 3, y0);
            const x1 = getBoundaryX(isLeft ? 0 : 3, y1);
            const xMid = (x0 + x1) * 0.5;
            const flicker = 0.55 + 0.30 * Math.sin(f * 2.1 - timeSec * 11.5 + side * 1.7) + 0.20 * Math.cos(f * 3.7 - timeSec * 7.8);
            const reach = (18 + 38 * p0) * flicker * (1.0 + beatPulse * 0.35 + sideSurge * 0.45);
            const liftY = -(10 + 22 * p0) * (0.7 + 0.3 * Math.sin(timeSec * 9.0 + f));
            const tipX = xMid + nX * reach;
            const tipY = yMid + nY * reach + liftY;
            ctx.moveTo(x0, y0);
            ctx.quadraticCurveTo(xMid + nX * reach * 0.65, y0 + liftY * 0.4, tipX, tipY);
            ctx.quadraticCurveTo(xMid + nX * reach * 0.55, y1, x1, y1);
          }
        }
        ctx.fill();

        ctx.fillStyle = hexToRgba(theme.cInner, 0.68);
        ctx.beginPath();
        for (let side = 0; side < 2; side++) {
          const isLeft = side === 0;
          const nX = isLeft ? normLx : normRx;
          const nY = isLeft ? normLy : normRy;
          const sideSurge = isLeft ? surgeL : surgeR;
          for (let f = 0; f < numFlames; f++) {
            const p0 = Math.pow(f / numFlames, 1.2);
            const p1 = Math.pow((f + 1.35) / numFlames, 1.2);
            const y0 = horizonY + (bottomY - horizonY) * p0;
            const y1 = horizonY + (bottomY - horizonY) * p1;
            const yMid = (y0 + y1) * 0.5;
            const x0 = getBoundaryX(isLeft ? 0 : 3, y0);
            const x1 = getBoundaryX(isLeft ? 0 : 3, y1);
            const xMid = (x0 + x1) * 0.5;
            const flicker = 0.55 + 0.30 * Math.sin(f * 2.1 - timeSec * 11.5 + side * 1.7) + 0.20 * Math.cos(f * 3.7 - timeSec * 7.8);
            const reach = (18 + 38 * p0) * flicker * (1.0 + beatPulse * 0.35 + sideSurge * 0.45);
            const liftY = -(10 + 22 * p0) * (0.7 + 0.3 * Math.sin(timeSec * 9.0 + f));
            ctx.moveTo(x0, y0 + (y1 - y0) * 0.18);
            ctx.quadraticCurveTo(xMid + nX * reach * 0.38, yMid + liftY * 0.35, xMid + nX * reach * 0.58, yMid + nY * reach * 0.58 + liftY * 0.65);
            ctx.quadraticCurveTo(xMid + nX * reach * 0.32, y1 - (y1 - y0) * 0.15, x1, y1 - (y1 - y0) * 0.18);
          }
        }
        ctx.fill();
      } else if (fx === 'cryo_blizzard') {
        const numSpikes = 18;
        ctx.fillStyle = hexToRgba(theme.cInner, 0.56);
        ctx.beginPath();
        for (let side = 0; side < 2; side++) {
          const isLeft = side === 0;
          const nX = isLeft ? normLx : normRx;
          const nY = isLeft ? normLy : normRy;
          const sideSurge = isLeft ? surgeL : surgeR;
          for (let k = 0; k < numSpikes; k++) {
            const p = Math.pow(k / (numSpikes - 1), 1.22);
            const yBase = horizonY + (bottomY - horizonY) * p;
            const xBase = getBoundaryX(isLeft ? 0 : 3, yBase);
            const pulseWave = 0.6 + 0.4 * Math.sin(p * 10 - timeSec * 5.5 + side);
            const spikeLen = (16 + 34 * p) * pulseWave * (1 + beatPulse * 0.3 + sideSurge * 0.4);
            const halfW = 5 + 9 * p;
            const tipX = xBase + nX * spikeLen;
            const tipY = yBase + nY * spikeLen - 8 * p;
            ctx.moveTo(xBase, yBase - halfW);
            ctx.lineTo(tipX, tipY);
            ctx.lineTo(xBase, yBase + halfW);
          }
        }
        ctx.fill();
      } else if (fx === 'zeus_lightning') {
        for (let side = 0; side < 2; side++) {
          const isLeft = side === 0;
          const nX = isLeft ? normLx : normRx;
          const nY = isLeft ? normLy : normRy;
          const sideSurge = isLeft ? surgeL : surgeR;

          ctx.beginPath();
          const steps = 26;
          for (let k = 0; k <= steps; k++) {
            const p = k / steps;
            const yPos = horizonY + (bottomY - horizonY) * p;
            const xRail = getBoundaryX(isLeft ? 0 : 3, yPos);
            const jag = (10 + 26 * p) * (0.45 + 0.55 * Math.abs(Math.sin(k * 4.3 - timeSec * 24 + side * 2))) * (1 + sideSurge * 0.45);
            const lx = xRail + nX * jag;
            const ly = yPos + nY * jag;
            if (k === 0) ctx.moveTo(lx, ly);
            else ctx.lineTo(lx, ly);
          }
          ctx.strokeStyle = hexToRgba(theme.cMid, 0.72);
          ctx.lineWidth = 5.5;
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.9;
          ctx.stroke();
        }
      } else if (fx === 'aurora_borealis' || fx === 'deep_cosmos' || fx === 'cyber_neon' || fx === 'black_hole') {
        for (let side = 0; side < 2; side++) {
          const isLeft = side === 0;
          const nX = isLeft ? normLx : normRx;
          const nY = isLeft ? normLy : normRy;
          const sideSurge = isLeft ? surgeL : surgeR;

          for (let ribbon = 0; ribbon < 2; ribbon++) {
            ctx.beginPath();
            const steps = 24;
            for (let k = 0; k <= steps; k++) {
              const p = k / steps;
              const yPos = horizonY + (bottomY - horizonY) * p;
              const xRail = getBoundaryX(isLeft ? 0 : 3, yPos);
              const wave = 0.55 + 0.45 * Math.sin(p * 11.0 - timeSec * (4.5 + ribbon * 2.2) + ribbon * 1.9 + side);
              const offset = (12 + 34 * p) * wave * (1 + beatPulse * 0.3 + sideSurge * 0.4);
              const rx = xRail + nX * offset;
              const ry = yPos + nY * offset;
              if (k === 0) ctx.moveTo(rx, ry);
              else ctx.lineTo(rx, ry);
            }
            ctx.strokeStyle = ribbon === 0 ? theme.cMid : theme.cInner;
            ctx.lineWidth = ribbon === 0 ? 5.0 : 2.6;
            ctx.stroke();
          }
        }
      } else if (fx === 'grand_fireworks' || fx === 'supernova_burst' || fx === 'asteroid_impact' || fx === 'quantum_prism') {
        const numNodes = 14;
        for (let side = 0; side < 2; side++) {
          const isLeft = side === 0;
          const nX = isLeft ? normLx : normRx;
          const nY = isLeft ? normLy : normRy;
          const sideSurge = isLeft ? surgeL : surgeR;

          for (let k = 1; k < numNodes; k++) {
            const p = Math.pow(((k / numNodes) + (timeSec * 0.18) % (1 / numNodes)), 1.25);
            if (p > 1.0) continue;
            const yPos = horizonY + (bottomY - horizonY) * p;
            const xRail = getBoundaryX(isLeft ? 0 : 3, yPos);
            const distOut = (16 + 32 * p) * (0.65 + 0.35 * Math.sin(k * 2.7 + timeSec * 5)) * (1 + sideSurge * 0.35);
            const nx = xRail + nX * distOut;
            const ny = yPos + nY * distOut;
            const sz = (4 + 7 * p) * (1 + beatPulse * 0.35);

            if (fx === 'quantum_prism') {
              ctx.save();
              ctx.translate(nx, ny);
              ctx.rotate(timeSec * 3.0 + k);
              ctx.strokeStyle = k % 2 === 0 ? theme.cInner : theme.cMid;
              ctx.lineWidth = 1.8;
              ctx.strokeRect(-sz * 0.5, -sz * 0.5, sz, sz);
              ctx.restore();
            } else {
              ctx.strokeStyle = k % 2 === 0 ? theme.cInner : theme.cMid;
              ctx.lineWidth = 2.0;
              ctx.beginPath();
              ctx.moveTo(nx - sz, ny);
              ctx.lineTo(nx + sz, ny);
              ctx.moveTo(nx, ny - sz);
              ctx.lineTo(nx, ny + sz);
              ctx.stroke();
            }
          }
        }
      }

      // --- CAPA 3: ECUALIZADOR RÍTMICO LATERAL HORIZONTAL EN PERSPECTIVA 3D (Beatstar Original Stage Wings) ---
      const startY = horizonY + 14;
      const endY = hitY - 14;
      const spanRhythmY = Math.max(60, endY - startY);
      const eqSurgesL = this.borderEqLeftSurges;
      const eqSurgesR = this.borderEqRightSurges;
      const borderVertGrad = this._borderGradCache.vGrad;
      const midWingCol = this._borderGradCache.midWingCol;

      if (!this._ribScratch) {
        this._ribScratch = {
          y: new Float32Array(numRibs),
          xStartL: new Float32Array(numRibs),
          lenL: new Float32Array(numRibs),
          xStartR: new Float32Array(numRibs),
          lenR: new Float32Array(numRibs),
          p: new Float32Array(numRibs)
        };
      }
      const rs = this._ribScratch;

      for (let s = 0; s < numRibs; s++) {
        const pNorm = s / (numRibs - 1);
        const p = Math.pow(pNorm, 1.32);
        const yPos = startY + spanRhythmY * p;

        const railWAtY = railTopW + (railBotW - railTopW) * p;
        const railGap = 4.5 + 3.5 * p;
        const xStartL = getBoundaryX(0, yPos) - railWAtY - railGap;
        const xStartR = getBoundaryX(3, yPos) + railWAtY + railGap;

        const maxWingReach = Math.max(12, Math.min(this.width * 0.21, xStartL - 6));

        const cascadeWave = 0.5 + 0.5 * Math.sin(p * 10.5 - audioTime * bpmSpeed);
        const subHarmonic = 0.5 + 0.5 * Math.cos(s * 1.55 + audioTime * bpmSpeed * 0.5);
        const barCadence = (s % 2 === 0) ? 1.0 : 0.70;
        const wingEnvelope = Math.sin(Math.pow(pNorm, 0.72) * Math.PI * 0.94);

        const bandIdx = Math.min(11, Math.floor(pNorm * 12));
        const bandSurgeL = (eqSurgesL ? eqSurgesL[bandIdx] : 0) || 0;
        const bandSurgeR = (eqSurgesR ? eqSurgesR[bandIdx] : 0) || 0;

        const driveL = (0.28 + 0.44 * cascadeWave + 0.28 * subHarmonic) * barCadence * (1.0 + beatPulse * 0.42 + surgeL * 0.48 + bandSurgeL * 0.45);
        const driveR = (0.28 + 0.44 * cascadeWave + 0.28 * subHarmonic) * barCadence * (1.0 + beatPulse * 0.42 + surgeR * 0.48 + bandSurgeR * 0.45);

        const baseMin = 5 + 8 * p;
        const lenLVal = Math.min(maxWingReach, baseMin + maxWingReach * 0.72 * wingEnvelope * Math.min(1.25, driveL));
        const lenRVal = Math.min(maxWingReach, baseMin + maxWingReach * 0.72 * wingEnvelope * Math.min(1.25, driveR));

        rs.y[s] = yPos;
        rs.xStartL[s] = xStartL;
        rs.lenL[s] = lenLVal;
        rs.xStartR[s] = xStartR;
        rs.lenR[s] = lenRVal;
        rs.p[s] = p;
      }

      // Pasada A: Halo exterior difuminado de neón (Batched en 1 draw call)
      ctx.strokeStyle = hexToRgba(midWingCol, 0.30 + beatPulse * 0.14);
      ctx.lineWidth = 6.0;
      ctx.beginPath();
      for (let s = 0; s < numRibs; s++) {
        const yPos = rs.y[s];
        const xL = rs.xStartL[s];
        const xR = rs.xStartR[s];
        ctx.moveTo(xL, yPos);
        ctx.lineTo(xL - rs.lenL[s], yPos);
        ctx.moveTo(xR, yPos);
        ctx.lineTo(xR + rs.lenR[s], yPos);
      }
      ctx.stroke();

      // Pasada B: Cuerpo principal de las barras de ritmo con degradado vertical en perspectiva (1 draw call)
      ctx.strokeStyle = borderVertGrad;
      ctx.lineWidth = 2.6 + beatPulse * 0.55;
      ctx.beginPath();
      for (let s = 0; s < numRibs; s++) {
        const yPos = rs.y[s];
        const xL = rs.xStartL[s];
        const xR = rs.xStartR[s];
        ctx.moveTo(xL, yPos);
        ctx.lineTo(xL - rs.lenL[s], yPos);
        ctx.moveTo(xR, yPos);
        ctx.lineTo(xR + rs.lenR[s], yPos);
      }
      ctx.stroke();

      // Pasada C: Núcleo interior blanco incandescente junto al raíl + Puntas Peak-Hold flotantes (1 draw call)
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.84 + beatPulse * 0.16).toFixed(2)})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let s = 0; s < numRibs; s++) {
        const yPos = rs.y[s];
        const xL = rs.xStartL[s];
        const xR = rs.xStartR[s];
        const coreLenL = rs.lenL[s] * 0.56;
        const coreLenR = rs.lenR[s] * 0.56;

        ctx.moveTo(xL, yPos);
        ctx.lineTo(xL - coreLenL, yPos);
        ctx.moveTo(xR, yPos);
        ctx.lineTo(xR + coreLenR, yPos);

        if (s % 2 === 0) {
          const p = rs.p[s];
          const peakGap = 4.0 + 2.5 * p + beatPulse * 2.0;
          const peakDotLen = 2.2 + 2.0 * p;
          const tipL = xL - rs.lenL[s] - peakGap;
          const tipR = xR + rs.lenR[s] + peakGap;
          if (tipL - peakDotLen > 2) {
            ctx.moveTo(tipL, yPos);
            ctx.lineTo(tipL - peakDotLen, yPos);
          }
          if (tipR + peakDotLen < this.width - 2) {
            ctx.moveTo(tipR, yPos);
            ctx.lineTo(tipR + peakDotLen, yPos);
          }
        }
      }
      ctx.stroke();

      ctx.restore();

      // 5. GUÍAS LÁSER DE NEÓN CONTINUAS DE ALTA INTENSIDAD Y PULSOS VIAJEROS DE COMPÁS
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      // Halo exterior del raíl láser
      ctx.strokeStyle = hexToRgba(this._borderGradCache.midWingCol, 0.58 + beatPulse * 0.34);
      ctx.lineWidth = 7.2;
      ctx.beginPath();
      ctx.moveTo(tL_top, horizonY);
      ctx.lineTo(tL_bot, bottomY);
      ctx.moveTo(tR_top, horizonY);
      ctx.lineTo(tR_bot, bottomY);
      ctx.stroke();

      // Filamento central blanco puro incandescente del raíl
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(tL_top, horizonY);
      ctx.lineTo(tL_bot, bottomY);
      ctx.moveTo(tR_top, horizonY);
      ctx.lineTo(tR_bot, bottomY);
      ctx.stroke();

      // Pulsos viajeros de energía descendiendo por los raíles al compás del BPM
      const pulseP = Math.pow(beatFraction, 1.5);
      const pulseY0 = horizonY + (hitY - horizonY) * Math.max(0, pulseP - 0.08);
      const pulseY1 = horizonY + (hitY - horizonY) * Math.min(1, pulseP + 0.08);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(getBoundaryX(0, pulseY0), pulseY0);
      ctx.lineTo(getBoundaryX(0, pulseY1), pulseY1);
      ctx.moveTo(getBoundaryX(3, pulseY0), pulseY0);
      ctx.lineTo(getBoundaryX(3, pulseY1), pulseY1);
      ctx.stroke();

      ctx.restore();

    } else {
      // ==========================================
      // 2D NEÓN CLÁSICO (Modo Plano)
      // ==========================================
      const laneW = this.width / 3;

      ctx.fillStyle = this._trackGrad || '#ffffff';
      ctx.fillRect(0, 0, this.width, this.height);
      if (this._trackEdgeShadowGrad) {
        ctx.fillStyle = this._trackEdgeShadowGrad;
        ctx.fillRect(0, 0, this.width, this.height);
      }

      for (let l = 1; l <= 2; l++) {
        const lx = l * laneW;
        ctx.save();
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.28)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, this.height);
        ctx.stroke();
        ctx.restore();
      }

      for (let l = 0; l < 3; l++) {
        const isHolding = this.activeHolds.has(l);
        const flashTimer = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
        const glow = this.laneGlows[l] || 0;
        if (isHolding || flashTimer > 0.001 || glow > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const neonGrad = ctx.createLinearGradient(0, hitY, 0, 0);
          let alpha = 0;
          if (isHolding) {
            alpha = 0.85;
          } else if (flashTimer > 0) {
            const p = flashTimer / 0.15;
            alpha = 0.85 * Math.sin(Math.min(1, Math.max(0, p)) * Math.PI * 0.5);
          } else {
            alpha = Math.min(0.80, glow * 0.80);
          }
          const flashCol = (Array.isArray(this.laneFlashColors) && this.laneFlashColors[l]) || '#00f2fe';
          const rgb = hexToRgb(flashCol);
          neonGrad.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(3)})`);
          neonGrad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(alpha * 0.45).toFixed(3)})`);
          neonGrad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
          ctx.fillStyle = neonGrad;
          ctx.fillRect(l * laneW, 0, laneW, hitY + 20);
          ctx.restore();
        }
      }

    }

    ctx.restore();
  }
    // =========================================================================
    // ZONA PERFECT+ 3D EN PERSPECTIVA CÓNICA REAL CON ANIMACIONES DINÁMICAS
    // =========================================================================
    buildHitLineSprites() {
      const isLarge = (this.keyStyle !== 'compact');
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.82);
      const padH = isLarge ? 84 : 48;
      const yDeckTop = hitY - padH * 0.56;
      const yDeckBot = hitY + padH * 0.60;

      // Degradados pre-cacheados para el chasis 3D y las cavidades en perspectiva (Zero-GC a 120 FPS)
      const deckGrad = this.ctx.createLinearGradient(0, yDeckTop, 0, yDeckBot);
      deckGrad.addColorStop(0.00, '#1e2b48');
      deckGrad.addColorStop(0.18, '#121b30');
      deckGrad.addColorStop(0.55, '#090e1c');
      deckGrad.addColorStop(0.88, '#060913');
      deckGrad.addColorStop(1.00, '#03050a');

      const deckLipGrad = this.ctx.createLinearGradient(0, yDeckBot, 0, yDeckBot + 12);
      deckLipGrad.addColorStop(0.00, '#2a3b60');
      deckLipGrad.addColorStop(0.45, '#121a2e');
      deckLipGrad.addColorStop(1.00, '#04060d');

      const apronGrad = this.ctx.createLinearGradient(0, yDeckBot, 0, this.height + 30);
      apronGrad.addColorStop(0.00, '#050811');
      apronGrad.addColorStop(0.45, '#080d1a');
      apronGrad.addColorStop(1.00, '#020307');

      const wellGrad = this.ctx.createLinearGradient(0, yDeckTop, 0, yDeckBot);
      wellGrad.addColorStop(0.00, '#020409');
      wellGrad.addColorStop(0.40, '#070c18');
      wellGrad.addColorStop(1.00, '#0e172c');

      const plateIdleGrad = this.ctx.createLinearGradient(0, hitY - padH * 0.46, 0, hitY + padH * 0.46);
      plateIdleGrad.addColorStop(0.00, '#2a3550');
      plateIdleGrad.addColorStop(0.28, '#1b2438');
      plateIdleGrad.addColorStop(0.65, '#111726');
      plateIdleGrad.addColorStop(1.00, '#0a0e19');

      const glassBandGrad = this.ctx.createLinearGradient(0, hitY - 14, 0, hitY + 14);
      glassBandGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.22)');
      glassBandGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.06)');
      glassBandGrad.addColorStop(0.50, 'rgba(255, 255, 255, 0.14)');
      glassBandGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0.06)');
      glassBandGrad.addColorStop(1.00, 'rgba(255, 255, 255, 0.24)');

      this._hitSprites = {
        padH,
        yDeckTop,
        yDeckBot,
        deckGrad,
        deckLipGrad,
        apronGrad,
        wellGrad,
        plateIdleGrad,
        glassBandGrad
      };
      this._hitSpriteSocket = true;
    }

    _traceQuadOn(ctx, x0T, x1T, x0B, x1B, topY, botY, rad) {
      const cr = Math.min(rad, (botY - topY) * 0.35, (x1T - x0T) * 0.30);
      ctx.beginPath();
      if (cr < 1.2) {
        ctx.moveTo(x0T, topY); ctx.lineTo(x1T, topY); ctx.lineTo(x1B, botY); ctx.lineTo(x0B, botY);
        ctx.closePath();
        return;
      }
      ctx.moveTo((x0T + x1T) * 0.5, topY);
      ctx.arcTo(x1T, topY, x1B, botY, cr);
      ctx.arcTo(x1B, botY, x0B, botY, cr);
      ctx.arcTo(x0B, botY, x0T, topY, cr);
      ctx.arcTo(x0T, topY, x1T, topY, cr);
      ctx.closePath();
    }

    renderHitLine(currentTime = null) {
      const ctx = this.ctx;
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.82);
      const is3D = (this.visualDimension !== '2d');
      const nowPerf = this._frameNow || performance.now();
      const cTime = Number.isFinite(currentTime) ? currentTime : this.getCurrentGameTimeMs(nowPerf);

      if (is3D && !this._hitSprites) {
        this.buildHitLineSprites();
      }

      // Color reactivo según multiplicador y paleta
      const mult = this.multiplier || 1;
      const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : null);
      let laserCol = palette ? (palette.primary || '#00f5a0') : '#00f5a0';
      let accentCol = palette ? (palette.glow || '#00f2fe') : '#00f2fe';
      if (mult === 2) {
        laserCol = '#ffd700';
        accentCol = '#ff9900';
      } else if (mult === 3) {
        laserCol = '#ff007f';
        accentCol = '#d946ef';
      } else if (mult === 4) {
        laserCol = '#00f2fe';
        accentCol = '#38bdf8';
      } else if (mult >= 5) {
        laserCol = '#00f5a0';
        accentCol = '#ffd700';
      }
      const laserRgb = hexToRgb(laserCol);
      const accentRgb = hexToRgb(accentCol);

      // Pulso rítmico sincronizado al BPM (monotónico en cuenta atrás)
      const songBpm = (this.beatmapData && this.beatmapData.bpm) ? Math.max(40, this.beatmapData.bpm) : 128;
      let normBpm = songBpm;
      while (normBpm > 175) normBpm /= 2;
      while (normBpm < 75) normBpm *= 2;
      const beatInterval = 60 / normBpm;
      const audioTime = (cTime >= 0 ? cTime : nowPerf) / 1000;
      const beatFraction = ((audioTime % beatInterval) + beatInterval) % beatInterval / beatInterval;
      const beatPulse = Math.pow(Math.max(0, 1 - beatFraction), 2.6);

      ctx.save();
      if (is3D) {
        const s = this._hitSprites;
        const isLarge = (this.keyStyle !== 'compact');
        const padH = s.padH;
        const yDeckTop = s.yDeckTop;
        const yDeckBot = s.yDeckBot;
        const bottomY = this.height + 30;

        // 1. FALDÓN ESCÉNICO INFERIOR EN PERSPECTIVA CÓNICA CON REJILLA ACÚSTICA 3D
        const apL_top = this.getLaneBoundaryX(0, yDeckBot);
        const apR_top = this.getLaneBoundaryX(3, yDeckBot);
        const apL_bot = this.getLaneBoundaryX(0, bottomY);
        const apR_bot = this.getLaneBoundaryX(3, bottomY);
        ctx.fillStyle = s.apronGrad;
        ctx.beginPath();
        ctx.moveTo(apL_top - 14, yDeckBot);
        ctx.lineTo(apR_top + 14, yDeckBot);
        ctx.lineTo(apR_bot + 24, bottomY);
        ctx.lineTo(apL_bot - 24, bottomY);
        ctx.closePath();
        ctx.fill();

        // Líneas de fuga y costillas horizontales en el faldón inferior
        ctx.strokeStyle = `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, 0.22)`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let l = 1; l <= 2; l++) {
          ctx.moveTo(this.getLaneBoundaryX(l, yDeckBot), yDeckBot);
          ctx.lineTo(this.getLaneBoundaryX(l, bottomY), bottomY);
        }
        for (let r = 1; r <= 3; r++) {
          const ry = yDeckBot + (bottomY - yDeckBot) * (r * 0.26);
          if (ry < bottomY) {
            ctx.moveTo(this.getLaneBoundaryX(0, ry) - 8, ry);
            ctx.lineTo(this.getLaneBoundaryX(3, ry) + 8, ry);
          }
        }
        ctx.stroke();

        // 2. CONSOLA / CHASIS 3D EN PERSPECTIVA CÓNICA CON LABIO FRONTAL EXTRUIDO
        const chMarginTop = 12;
        const chMarginBot = 16;
        const chL_top = this.getLaneBoundaryX(0, yDeckTop) - chMarginTop;
        const chR_top = this.getLaneBoundaryX(3, yDeckTop) + chMarginTop;
        const chL_bot = this.getLaneBoundaryX(0, yDeckBot) - chMarginBot;
        const chR_bot = this.getLaneBoundaryX(3, yDeckBot) + chMarginBot;

        // A. Pared frontal extruida del puente (3D Front Lip)
        const lipH = isLarge ? 10 : 7;
        const yLipBot = yDeckBot + lipH;
        const chL_lip = this.getLaneBoundaryX(0, yLipBot) - (chMarginBot + 2);
        const chR_lip = this.getLaneBoundaryX(3, yLipBot) + (chMarginBot + 2);
        ctx.fillStyle = s.deckLipGrad;
        this._traceQuadOn(ctx, chL_bot, chR_bot, chL_lip, chR_lip, yDeckBot - 2, yLipBot, 10);
        ctx.fill();
        ctx.strokeStyle = `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.40 + beatPulse * 0.25).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // B. Cubierta superior inclinada del puente (3D Perspective Deck)
        ctx.fillStyle = s.deckGrad;
        this._traceQuadOn(ctx, chL_top, chR_top, chL_bot, chR_bot, yDeckTop, yDeckBot, 13);
        ctx.fill();

        // Bisel metálico cromado perimetral del puente 3D
        ctx.strokeStyle = `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.38 + beatPulse * 0.28).toFixed(3)})`;
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // Filamento especular en la arista superior e inferior del puente
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(chL_top + 12, yDeckTop + 1.5);
        ctx.lineTo(chR_top - 12, yDeckTop + 1.5);
        ctx.moveTo(chL_bot + 12, yDeckBot - 1.5);
        ctx.lineTo(chR_bot - 12, yDeckBot - 1.5);
        ctx.stroke();

        // 3. RECEPTORES MECÁNICOS 3D POR CARRIL (Fieles al punto de fuga de la autopista)
        const wellHalfH = padH * 0.46;
        const yWellTop = hitY - wellHalfH;
        const yWellBot = hitY + wellHalfH;
        const wellMargin = isLarge ? 3.8 : 2.8;
        const plateMargin = isLarge ? 6.2 : 4.4;
        const maxSink = isLarge ? 7.0 : 4.5;
        const cornerRad = isLarge ? 10 : 6;

        for (let l = 0; l < 3; l++) {
          const elapsedPress = nowPerf - (this.lanePressAnim ? (this.lanePressAnim[l] || 0) : 0);
          const isTapping = elapsedPress >= 0 && elapsedPress < 260;
          let tapWave = 0;
          let shockProgress = 0;
          if (isTapping) {
            const t = elapsedPress / 260;
            shockProgress = t;
            tapWave = t < 0.16
              ? (t / 0.16)
              : Math.exp(-((t - 0.16) / 0.84) * 3.6) * Math.cos(((t - 0.16) / 0.84) * Math.PI * 1.8);
          }

          const isHolding = this.activeHolds.has(l);
          const flashTimer = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
          const glow = this.laneGlows[l] || 0;
          const isActive = isHolding || flashTimer > 0.01 || glow > 0.18 || (isTapping && elapsedPress < 130);
          const energy = Math.min(1.0, Math.max(
            isHolding ? 1.0 : 0,
            flashTimer > 0 ? Math.min(1.0, flashTimer / 0.15) : 0,
            glow * 0.85,
            isTapping ? Math.max(0, 1 - elapsedPress / 200) : 0
          ));

          const laneFlashCol = (Array.isArray(this.laneFlashColors) && this.laneFlashColors[l]) || laserCol;
          const activeRgb = isActive ? hexToRgb(laneFlashCol) : laserRgb;

          // A. Cavidad receptora profunda (3D Recessed Socket) con paredes interiores visibles
          const wL_top = this.getLaneBoundaryX(l, yWellTop) + wellMargin;
          const wR_top = this.getLaneBoundaryX(l + 1, yWellTop) - wellMargin;
          const wL_bot = this.getLaneBoundaryX(l, yWellBot) + wellMargin;
          const wR_bot = this.getLaneBoundaryX(l + 1, yWellBot) - wellMargin;

          ctx.fillStyle = s.wellGrad;
          this._traceQuadOn(ctx, wL_top, wR_top, wL_bot, wR_bot, yWellTop, yWellBot, cornerRad);
          ctx.fill();

          // Pared interior superior de la cavidad (efecto de profundidad real 3D)
          const yInnerWall = yWellTop + (isLarge ? 6.5 : 4.5);
          const iwL = this.getLaneBoundaryX(l, yInnerWall) + wellMargin + 1.5;
          const iwR = this.getLaneBoundaryX(l + 1, yInnerWall) - wellMargin - 1.5;
          ctx.fillStyle = isActive
            ? `rgba(${Math.round(activeRgb.r * 0.35)}, ${Math.round(activeRgb.g * 0.35)}, ${Math.round(activeRgb.b * 0.35)}, 0.90)`
            : 'rgba(2, 4, 10, 0.92)';
          ctx.beginPath();
          ctx.moveTo(wL_top, yWellTop);
          ctx.lineTo(wR_top, yWellTop);
          ctx.lineTo(iwR, yInnerWall);
          ctx.lineTo(iwL, yInnerWall);
          ctx.closePath();
          ctx.fill();

          // Marco luminoso perimetral de la cavidad
          ctx.strokeStyle = isActive
            ? `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(0.55 + energy * 0.45).toFixed(3)})`
            : `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.22 + beatPulse * 0.12).toFixed(3)})`;
          ctx.lineWidth = isActive ? 1.8 : 1.2;
          this._traceQuadOn(ctx, wL_top, wR_top, wL_bot, wR_bot, yWellTop, yWellBot, cornerRad);
          ctx.stroke();

          // B. Placa Táctil 3D con compresión de pistón en el plano de perspectiva
          const currentSink = Math.max(-1.8, (isHolding ? maxSink * 0.88 : 0) + (isTapping ? maxSink * tapWave : (glow > 0.22 ? maxSink * 0.50 : 0)));
          const yPlateTop = yWellTop + 3.0 + currentSink * 0.85;
          const yPlateBot = yWellBot - 2.2 + currentSink * 0.42;
          const bevelH = Math.max(3.5, (isLarge ? 8.5 : 5.0) - Math.max(0, currentSink * 0.70));
          const yBevelTop = yPlateBot - bevelH;

          const pL_top = this.getLaneBoundaryX(l, yPlateTop) + plateMargin;
          const pR_top = this.getLaneBoundaryX(l + 1, yPlateTop) - plateMargin;
          const pL_bev = this.getLaneBoundaryX(l, yBevelTop) + plateMargin;
          const pR_bev = this.getLaneBoundaryX(l + 1, yBevelTop) - plateMargin;
          const pL_bot = this.getLaneBoundaryX(l, yPlateBot) + plateMargin;
          const pR_bot = this.getLaneBoundaryX(l + 1, yPlateBot) - plateMargin;
          const plateRad = Math.max(4, cornerRad - 2);

          // Cara frontal 3D (Bisel delantero de la tecla receptora)
          ctx.fillStyle = isActive
            ? `rgba(${Math.round(activeRgb.r * 0.52)}, ${Math.round(activeRgb.g * 0.52)}, ${Math.round(activeRgb.b * 0.52)}, 0.96)`
            : '#090d18';
          this._traceQuadOn(ctx, pL_bev, pR_bev, pL_bot, pR_bot, yBevelTop, yPlateBot, plateRad);
          ctx.fill();

          // Cara superior 3D de la tecla receptora
          ctx.fillStyle = s.plateIdleGrad;
          this._traceQuadOn(ctx, pL_top, pR_top, pL_bev, pR_bev, yPlateTop, yBevelTop, plateRad);
          ctx.fill();

          // Retroiluminación interna reactiva al impacto o nota mantenida
          if (energy > 0.02) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(energy * 0.36).toFixed(3)})`;
            this._traceQuadOn(ctx, pL_top, pR_top, pL_bev, pR_bev, yPlateTop, yBevelTop, plateRad);
            ctx.fill();
            ctx.restore();
          }

          // Chevrons guía en escorzo 3D sobre la placa receptora (animados hacia el centro de impacto)
          const chevShift = ((audioTime * 2.2) % 1.0);
          const plateMidXTop = (pL_top + pR_top) * 0.5;
          const plateMidXBot = (pL_bev + pR_bev) * 0.5;
          const chevW = (pR_top - pL_top) * 0.24;
          const chevY = yPlateTop + 5 + chevShift * 5;
          ctx.strokeStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(0.20 + energy * 0.35 + (1 - chevShift) * 0.15).toFixed(3)})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(plateMidXTop - chevW, chevY - 2.5);
          ctx.lineTo(plateMidXTop, chevY + 1.5);
          ctx.lineTo(plateMidXTop + chevW, chevY - 2.5);
          const chevBotY = yBevelTop - 4 - chevShift * 4;
          ctx.moveTo(plateMidXBot - chevW * 1.05, chevBotY + 2.5);
          ctx.lineTo(plateMidXBot, chevBotY - 1.5);
          ctx.lineTo(plateMidXBot + chevW * 1.05, chevBotY + 2.5);
          ctx.stroke();

          // Borde especular metálico de la placa 3D
          ctx.strokeStyle = isActive
            ? `rgba(255, 255, 255, ${(0.65 + energy * 0.35).toFixed(3)})`
            : `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.28 + beatPulse * 0.16).toFixed(3)})`;
          ctx.lineWidth = isActive ? 1.9 : 1.25;
          this._traceQuadOn(ctx, pL_top, pR_top, pL_bev, pR_bev, yPlateTop, yBevelTop, plateRad);
          ctx.stroke();
        }

        // 4. BANDA HOLOGRÁFICA CONTINUA PERFECT+ EN PERSPECTIVA CÓNICA (Atraviesa los 3 carriles)
        const bandHalfH = isLarge ? 12.5 : 8.5;
        const yBandTop = hitY - bandHalfH;
        const yBandBot = hitY + bandHalfH;
        const bandOuterMargin = 4;
        const bandL_top = this.getLaneBoundaryX(0, yBandTop) - bandOuterMargin;
        const bandR_top = this.getLaneBoundaryX(3, yBandTop) + bandOuterMargin;
        const bandL_bot = this.getLaneBoundaryX(0, yBandBot) - bandOuterMargin;
        const bandR_bot = this.getLaneBoundaryX(3, yBandBot) + bandOuterMargin;

        ctx.save();
        // Lente acrílica translúcida continua de la ventana Perfect+
        ctx.fillStyle = s.glassBandGrad;
        this._traceQuadOn(ctx, bandL_top, bandR_top, bandL_bot, bandR_bot, yBandTop, yBandBot, 6);
        ctx.fill();

        // Tinte de energía reactiva en la banda Perfect+
        ctx.fillStyle = `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.12 + beatPulse * 0.10).toFixed(3)})`;
        ctx.fill();

        // Bordes superior e inferior de la ventana Perfect+ (delimitan visualmente el área exacta Perfect+)
        ctx.strokeStyle = `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.55 + beatPulse * 0.30).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bandL_top + 4, yBandTop);
        ctx.lineTo(bandR_top - 4, yBandTop);
        ctx.moveTo(bandL_bot + 4, yBandBot);
        ctx.lineTo(bandR_bot - 4, yBandBot);
        ctx.stroke();

        // Escáner láser sub-superficial sincronizado al BPM que recorre la lente acrílica Perfect+
        const scanPhase = ((audioTime * 0.85) % 1.0);
        const scanFrac = 0.5 + 0.44 * Math.sin(scanPhase * Math.PI * 2);
        const scanXTop = bandL_top + (bandR_top - bandL_top) * scanFrac;
        const scanXBot = bandL_bot + (bandR_bot - bandL_bot) * scanFrac;
        const scanW = 18 + beatPulse * 10 + (this.overdriveLevel || 0) * 14;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.16 + beatPulse * 0.14 + (this.overdriveLevel || 0) * 0.12).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(scanXTop - scanW, yBandTop);
        ctx.lineTo(scanXTop + scanW, yBandTop);
        ctx.lineTo(scanXBot + scanW * 1.15, yBandBot);
        ctx.lineTo(scanXBot - scanW * 1.15, yBandBot);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 5. NÚCLEOS DE PRECISIÓN PERFECT+, CORCHETES Y ANIMACIONES ESPECTACULARES POR CARRIL
        for (let l = 0; l < 3; l++) {
          const elapsedPress = nowPerf - (this.lanePressAnim ? (this.lanePressAnim[l] || 0) : 0);
          const isTapping = elapsedPress >= 0 && elapsedPress < 260;
          const shockProgress = isTapping ? (elapsedPress / 260) : 0;
          const tapWave = isTapping
            ? (shockProgress < 0.16
                ? (shockProgress / 0.16)
                : Math.exp(-((shockProgress - 0.16) / 0.84) * 3.6) * Math.cos(((shockProgress - 0.16) / 0.84) * Math.PI * 1.8))
            : 0;

          const isHolding = this.activeHolds.has(l);
          const flashTimer = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
          const glow = this.laneGlows[l] || 0;
          const isActive = isHolding || flashTimer > 0.01 || glow > 0.18 || (isTapping && elapsedPress < 130);
          const energy = Math.min(1.0, Math.max(
            isHolding ? 1.0 : 0,
            flashTimer > 0 ? Math.min(1.0, flashTimer / 0.15) : 0,
            glow * 0.85,
            isTapping ? Math.max(0, 1 - elapsedPress / 200) : 0
          ));

          const laneFlashCol = (Array.isArray(this.laneFlashColors) && this.laneFlashColors[l]) || laserCol;
          const activeRgb = isActive ? hexToRgb(laneFlashCol) : laserRgb;

          const currentSink = Math.max(-1.8, (isHolding ? maxSink * 0.88 : 0) + (isTapping ? maxSink * tapWave : (glow > 0.22 ? maxSink * 0.50 : 0)));
          const perfY = hitY + currentSink * 0.55;
          const cBandTop = perfY - (isLarge ? 10.5 : 7.5);
          const cBandBot = perfY + (isLarge ? 10.5 : 7.5);
          const bandInset = plateMargin + 3.5;

          // Expansión elástica de los corchetes al impactar
          const brkRecoil = (isTapping ? Math.sin(Math.min(1, shockProgress * 2.2) * Math.PI) * 4.5 : 0) + (isHolding ? 2.5 : 0);
          const bL_top = this.getLaneBoundaryX(l, cBandTop) + bandInset - brkRecoil;
          const bR_top = this.getLaneBoundaryX(l + 1, cBandTop) - bandInset + brkRecoil;
          const bL_bot = this.getLaneBoundaryX(l, cBandBot) + bandInset - brkRecoil;
          const bR_bot = this.getLaneBoundaryX(l + 1, cBandBot) - bandInset + brkRecoil;
          const cx = (bL_top + bR_top + bL_bot + bR_bot) * 0.25;

          ctx.save();
          // A. Resplandor localizado de ventana Perfect+ cuando el carril está activo
          if (energy > 0.01) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(0.22 + energy * 0.36).toFixed(3)})`;
            this._traceQuadOn(ctx, bL_top, bR_top, bL_bot, bR_bot, cBandTop, cBandBot, 5);
            ctx.fill();
          }

          // B. Corchetes de bloqueo en perspectiva cónica [   ] con rebote táctil
          const brkLen = Math.max(9, (bR_bot - bL_bot) * 0.19);
          ctx.strokeStyle = isActive
            ? '#ffffff'
            : `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.78 + beatPulse * 0.22).toFixed(3)})`;
          ctx.lineWidth = isActive ? 2.5 : 1.7;
          ctx.beginPath();
          // Corchete izquierdo alineado a la pendiente del carril
          ctx.moveTo(bL_top + brkLen, cBandTop);
          ctx.lineTo(bL_top, cBandTop);
          ctx.lineTo(bL_bot, cBandBot);
          ctx.lineTo(bL_bot + brkLen, cBandBot);
          // Corchete derecho alineado a la pendiente del carril
          ctx.moveTo(bR_top - brkLen, cBandTop);
          ctx.lineTo(bR_top, cBandTop);
          ctx.lineTo(bR_bot, cBandBot);
          ctx.lineTo(bR_bot - brkLen, cBandBot);
          ctx.stroke();

          // C. Haz Láser Central Perfect+ y Retícula Diamante 3D en Escorzo
          ctx.globalCompositeOperation = 'lighter';
          const coreL = (bL_top + bL_bot) * 0.5 + 3;
          const coreR = (bR_top + bR_bot) * 0.5 - 3;

          // Halo exterior del láser del carril
          ctx.strokeStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(0.58 + energy * 0.42 + beatPulse * 0.20).toFixed(3)})`;
          ctx.lineWidth = isActive ? 6.0 : 3.8;
          ctx.beginPath();
          ctx.moveTo(coreL, perfY);
          ctx.lineTo(coreR, perfY);
          ctx.stroke();

          // Filamento central incandescente
          ctx.strokeStyle = `rgba(255, 255, 255, ${(0.84 + energy * 0.16).toFixed(3)})`;
          ctx.lineWidth = isActive ? 2.5 : 1.6;
          ctx.beginPath();
          ctx.moveTo(coreL + 3, perfY);
          ctx.lineTo(coreR - 3, perfY);
          ctx.stroke();

          // Emblema Prisma / Diamante 3D en el centro del carril (achatado en Y por perspectiva cónica)
          const prismScale = 1.0 + beatPulse * 0.18 + energy * 0.48;
          const rx = (isLarge ? 12.0 : 8.5) * prismScale;
          const ry = (isLarge ? 6.6 : 4.8) * prismScale;

          // Anillo exterior del prisma
          ctx.strokeStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(0.70 + energy * 0.30).toFixed(3)})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(cx, perfY - ry * 1.32);
          ctx.lineTo(cx + rx * 1.32, perfY);
          ctx.lineTo(cx, perfY + ry * 1.32);
          ctx.lineTo(cx - rx * 1.32, perfY);
          ctx.closePath();
          ctx.stroke();

          // Cuerpo del prisma energético
          ctx.fillStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(0.80 + energy * 0.20).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(cx, perfY - ry);
          ctx.lineTo(cx + rx, perfY);
          ctx.lineTo(cx, perfY + ry);
          ctx.lineTo(cx - rx, perfY);
          ctx.closePath();
          ctx.fill();

          // Núcleo de diamante blanco puro
          const irx = rx * 0.52;
          const iry = ry * 0.52;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(cx, perfY - iry);
          ctx.lineTo(cx + irx, perfY);
          ctx.lineTo(cx, perfY + iry);
          ctx.lineTo(cx - irx, perfY);
          ctx.closePath();
          ctx.fill();

          // D. ANIMACIÓN DE IMPACTO: Doble Onda de Choque Trapezoidal 3D + Barrido de Luz Ascendente + Destello Anamórfico
          if (isTapping && shockProgress > 0 && shockProgress < 1.0) {
            const easeOut = 1 - Math.pow(1 - shockProgress, 2.5);
            const shockAlpha = (1 - shockProgress) * 0.90;
            const expandX = easeOut * 14;
            const expandY = easeOut * 11;

            const wL_top = this.getLaneBoundaryX(l, yWellTop) + wellMargin;
            const wR_top = this.getLaneBoundaryX(l + 1, yWellTop) - wellMargin;
            const wL_bot = this.getLaneBoundaryX(l, yWellBot) + wellMargin;
            const wR_bot = this.getLaneBoundaryX(l + 1, yWellBot) - wellMargin;

            // Onda exterior trapezoidal alineada al carril
            ctx.strokeStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${shockAlpha.toFixed(3)})`;
            ctx.lineWidth = Math.max(1.0, 3.4 * (1 - shockProgress));
            this._traceQuadOn(
              ctx,
              wL_top - expandX * 0.85,
              wR_top + expandX * 0.85,
              wL_bot - expandX * 1.05,
              wR_bot + expandX * 1.05,
              yWellTop - expandY,
              yWellBot + expandY,
              cornerRad + 4
            );
            ctx.stroke();

            // Segunda onda interior desfasada en blanco brillante
            if (shockProgress > 0.08) {
              const p2 = (shockProgress - 0.08) / 0.92;
              const ease2 = 1 - Math.pow(1 - p2, 2.2);
              const ex2 = ease2 * 8;
              const ey2 = ease2 * 6;
              ctx.strokeStyle = `rgba(255, 255, 255, ${((1 - p2) * 0.75).toFixed(3)})`;
              ctx.lineWidth = Math.max(0.8, 2.0 * (1 - p2));
              this._traceQuadOn(ctx, bL_top - ex2, bR_top + ex2, bL_bot - ex2, bR_bot + ex2, cBandTop - ey2, cBandBot + ey2, 6);
              ctx.stroke();
            }

            // Destello horizontal anamórfico en la línea Perfect+
            const flareHalfW = ((coreR - coreL) * 0.65) * (0.5 + easeOut * 0.75);
            const flareH = Math.max(1.5, 5.8 * (1 - shockProgress));
            ctx.fillStyle = `rgba(255, 255, 255, ${(shockAlpha * 0.95).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(cx - flareHalfW, perfY);
            ctx.lineTo(cx, perfY - flareH);
            ctx.lineTo(cx + flareHalfW, perfY);
            ctx.lineTo(cx, perfY + flareH);
            ctx.closePath();
            ctx.fill();

            // Onda de Choque con Refracción Cristalina (Aberración Cromática Prismática 3D en el Acrílico)
            const refRx = ((bR_bot - bL_bot) * 0.22) + easeOut * ((bR_bot - bL_bot) * 0.52);
            const refRy = refRx * 0.44;
            if (ctx.ellipse) {
              // Canal Cian (Desfase exterior)
              ctx.strokeStyle = `rgba(0, 242, 254, ${(shockAlpha * 0.78).toFixed(3)})`;
              ctx.lineWidth = Math.max(1.0, 2.6 * (1 - shockProgress));
              ctx.beginPath();
              ctx.ellipse(cx - 2.2 * (1 - shockProgress), perfY, refRx * 1.05, refRy * 1.05, 0, 0, Math.PI * 2);
              ctx.stroke();

              // Canal Magenta (Desfase interior)
              ctx.strokeStyle = `rgba(255, 0, 127, ${(shockAlpha * 0.72).toFixed(3)})`;
              ctx.lineWidth = Math.max(1.0, 2.2 * (1 - shockProgress));
              ctx.beginPath();
              ctx.ellipse(cx + 2.2 * (1 - shockProgress), perfY, refRx * 0.94, refRy * 0.94, 0, 0, Math.PI * 2);
              ctx.stroke();

              // Destello especular diamante central
              ctx.strokeStyle = `rgba(255, 255, 255, ${(shockAlpha * 0.90).toFixed(3)})`;
              ctx.lineWidth = Math.max(0.8, 1.8 * (1 - shockProgress));
              ctx.beginPath();
              ctx.ellipse(cx, perfY, refRx, refRy, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // E. ANIMACIÓN DE NOTA MANTENIDA (HOLD): Reactor de Plasma Elíptico en Perspectiva 3D
          if (isHolding) {
            const active = this.activeHolds.get(l);
            const startT = active.startTime;
            const endT = active.note.end_timestamp_ms || (startT + (active.note.duration_ms || 700));
            const progress = Math.min(1.0, Math.max(0, (cTime - startT) / Math.max(1, endT - startT)));

            const ringRx = (bR_bot - bL_bot) * 0.36;
            const ringRy = ringRx * 0.54; // Escorzo cónico 3D exacto del plano de la pista

            // Onda de compresión concéntrica hacia el núcleo del reactor
            const inWave = 1.0 - ((nowPerf * 0.0035) % 1.0);
            ctx.strokeStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${((1 - inWave) * 0.65).toFixed(3)})`;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            if (ctx.ellipse) {
              ctx.ellipse(cx, perfY, ringRx * (0.4 + inWave * 0.9), ringRy * (0.4 + inWave * 0.9), 0, 0, Math.PI * 2);
            }
            ctx.stroke();

            // Anillo base en perspectiva 3D
            ctx.strokeStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, 0.42)`;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            if (ctx.ellipse) {
              ctx.ellipse(cx, perfY, ringRx, ringRy, 0, 0, Math.PI * 2);
            } else {
              ctx.arc(cx, perfY, ringRy, 0, Math.PI * 2);
            }
            ctx.stroke();

            // Arco de carga progresiva incandescente en perspectiva
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.6;
            ctx.beginPath();
            if (ctx.ellipse) {
              ctx.ellipse(cx, perfY, ringRx, ringRy, 0, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            } else {
              ctx.arc(cx, perfY, ringRy, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            }
            ctx.stroke();

            // Nodos orbitales giratorios en el plano 3D de la tecla
            const orbitAngle = nowPerf * 0.009;
            for (let n = 0; n < 3; n++) {
              const a = orbitAngle + n * ((Math.PI * 2) / 3);
              const nx = cx + Math.cos(a) * ringRx;
              const ny = perfY + Math.sin(a) * ringRy;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(nx, ny, 3.0, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          ctx.restore();
        }

        // 6. EMISORES LÁSER LATERALES 3D Y LÍNEA HORIZONTE DE PRECISIÓN PERFECT+
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const lineL = this.getLaneBoundaryX(0, hitY) - 12;
        const lineR = this.getLaneBoundaryX(3, hitY) + 12;

        // Haz láser continuo que une los 3 carriles y los emisores exteriores
        ctx.strokeStyle = `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.48 + beatPulse * 0.32).toFixed(3)})`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(lineL, hitY);
        ctx.lineTo(lineR, hitY);
        ctx.stroke();

        // Nodos divisores luminosos sobre las separaciones de carril (l = 1, 2)
        for (let div = 1; div <= 2; div++) {
          const divX = this.getLaneBoundaryX(div, hitY);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(divX, hitY - 5);
          ctx.lineTo(divX + 3.5, hitY);
          ctx.lineTo(divX, hitY + 5);
          ctx.lineTo(divX - 3.5, hitY);
          ctx.closePath();
          ctx.fill();
        }

        // Cabezales Emisores Láser 3D en los extremos izquierdo y derecho de la zona Perfect+
        const podW = 10 + beatPulse * 3.0;
        const podH = 9 + beatPulse * 2.0;
        ctx.fillStyle = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.92)`;
        ctx.beginPath();
        // Emisor Izquierdo apuntando hacia el centro de la pista
        ctx.moveTo(lineL - podW, hitY - podH * 0.45);
        ctx.lineTo(lineL + 3, hitY - podH);
        ctx.lineTo(lineL + 6, hitY);
        ctx.lineTo(lineL + 3, hitY + podH);
        ctx.lineTo(lineL - podW, hitY + podH * 0.45);
        ctx.closePath();
        // Emisor Derecho apuntando hacia el centro de la pista
        ctx.moveTo(lineR + podW, hitY - podH * 0.45);
        ctx.lineTo(lineR - 3, hitY - podH);
        ctx.lineTo(lineR - 6, hitY);
        ctx.lineTo(lineR - 3, hitY + podH);
        ctx.lineTo(lineR + podW, hitY + podH * 0.45);
        ctx.closePath();
        ctx.fill();

        // Núcleo blanco de los emisores laterales
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(lineL, hitY, 2.8, 0, Math.PI * 2);
        ctx.arc(lineR, hitY, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

      } else {
        // Modo 2D
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, hitY); ctx.lineTo(this.width, hitY);
        ctx.stroke();
      }
      ctx.restore();
    }

    renderVectorChevron(ctx, x, y, direction, maxW = 50, maxH = 30) {
      ctx.save();
      let angle = 0;
      if (direction === 'down') angle = Math.PI;
      else if (direction === 'left') angle = -Math.PI / 2;
      else if (direction === 'right') angle = Math.PI / 2;

      ctx.translate(x, y);
      ctx.rotate(angle);

      const arrowW = Math.max(16, ((maxW > 0 ? maxW : 60) * 0.52));
      const arrowH = Math.max(14, ((maxH > 0 ? maxH : 35) * 0.55));
      const headH = arrowH * 0.55;
      const stemW = arrowW * 0.42;

      ctx.beginPath();
      ctx.moveTo(0, -arrowH / 2);
      ctx.lineTo(arrowW / 2, -arrowH / 2 + headH);
      ctx.lineTo(stemW / 2, -arrowH / 2 + headH);
      ctx.lineTo(stemW / 2, arrowH / 2);
      ctx.lineTo(-stemW / 2, arrowH / 2);
      ctx.lineTo(-stemW / 2, -arrowH / 2 + headH);
      ctx.lineTo(-arrowW / 2, -arrowH / 2 + headH);
      ctx.closePath();

      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    renderNotes(currentTime) {
      const ctx = this.ctx;
      const len = this.notes.length;
      const scrollDur = (Number.isFinite(this.scrollDurationMs) && this.scrollDurationMs > 0) ? this.scrollDurationMs : 1400;
      const invScrollDur = 1.0 / scrollDur;
      const is3D = (this.visualDimension !== '2d');
      const isLarge = (this.keyStyle !== 'compact');
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
      const horizonY = 12;
      const spanY = hitY - horizonY;

      while (this.firstActiveNoteIndex < len) {
        const pastN = this.notes[this.firstActiveNoteIndex];
        if (!pastN) { this.firstActiveNoteIndex++; continue; }
        const pastT = pastN.end_timestamp_ms || pastN.timestamp_ms || pastN.timeMs || 0;
        if ((pastN.hit || pastN.missed || pastN.processed || pastN.holdCompleted) && !pastN.holding && (currentTime - pastT > 400)) {
          this.firstActiveNoteIndex++;
        } else {
          break;
        }
      }

      const startIdx = Math.min(this.firstActiveNoteIndex, len);
      const isKaraokeActive = Boolean((typeof window !== 'undefined' && window.isKaraokeModeActive) || this.isKaraokeModeActive);
      const isMushroomActive = Boolean((typeof window !== 'undefined' && window.isMushroomModeActive) || this.isMushroomModeActive);

      for (let i = startIdx; i < len; i++) {
        const note = this.notes[i];
        if (!note || note.holdCompleted) continue;
        if (note.hit && note.type !== 'hold') continue;
        if (note.missed && !note.holding) continue;
        if (note.processed && !note.holding) continue;

        const lane = Math.max(0, Math.min(2, Math.round(note.lane ?? 0)));
        const noteT = note.timestamp_ms ?? note.timeMs ?? 0;
        const isBeingHeld = Boolean(note.holding && !note.holdCompleted);
        const timeUntilHit = noteT - currentTime;

        if (timeUntilHit > 1200 && timeUntilHit > scrollDur) break;

        const pHead = 1.0 - timeUntilHit * invScrollDur;
        if (pHead < -0.15 || (!isBeingHeld && pHead > 1.25)) continue;

        // En Modo Setas Alucinógenas: algunas teclas saltan de un carril a otro mientras caen y su grosor/tamaño respira
        let drawLane = lane;
        let mushHeightMult = 1.0;
        if (isMushroomActive && note.type !== 'hold') {
          const fromL = (note._mushFromLane !== undefined) ? note._mushFromLane : lane;
          if (fromL !== lane && pHead < 0.54) {
            const swapT = Math.max(0, Math.min(1, (pHead - 0.06) / 0.46));
            const easeSwap = 0.5 - 0.5 * Math.cos(Math.PI * swapT);
            drawLane = fromL + (lane - fromL) * easeSwap;
          } else if (pHead < 0.72) {
            // Oscilación ebria sutil del carril antes de llegar a la zona de golpeo
            drawLane = Math.max(0, Math.min(2, lane + Math.sin(currentTime * 0.007 + (note._mushPhase || 0)) * 0.11 * (1 - pHead)));
          }
          mushHeightMult = 1.0 + Math.sin(currentTime * 0.009 + (note._mushPhase || 0)) * 0.25;
        }

        const nextDiff = note.nextSameLaneDiffMs ?? Infinity;
        const coord = this.getPerspectiveCoord(drawLane, pHead, this._coordScratch0);
        const maxH3D = nextDiff < scrollDur ? Math.max(26, ((nextDiff * invScrollDur) * spanY * coord.scale) - 8) : Infinity;
        const lyricForNote = isKaraokeActive ? note._cleanLyric : null;

        // ==========================================
        // 1. NOTAS HOLD (ONDA SINUSOIDAL + FILAMENTO DE PLASMA)
        // ==========================================
        if (note.type === 'hold') {
          const rawDur = Number.isFinite(note.duration_ms)
            ? note.duration_ms
            : (Number.isFinite(note.holdDuration)
                ? (note.holdDuration > 50 ? note.holdDuration : note.holdDuration * 1000)
                : (Number.isFinite(note.duration) ? (note.duration > 50 ? note.duration : note.duration * 1000) : 700));
          const holdDuration = Math.max(150, Number.isFinite(rawDur) ? rawDur : 700);
          const endT = Number.isFinite(note.end_timestamp_ms) ? note.end_timestamp_ms : (noteT + holdDuration);

          let currentHeadP = isBeingHeld ? 1.0 : pHead;
          let currentTailP = 1.0 - (endT - currentTime) * invScrollDur;

          if (currentTailP > 1.25 || currentHeadP < -0.2) continue;

          ctx.save();

          const segments = 10;
          const stringPoints = this._holdPointsBuffer || [];
          const timeSec = currentTime * 0.001;
          for (let s = 0; s <= segments; s++) {
            const frac = s / segments;
            const pStep = currentTailP + (currentHeadP - currentTailP) * frac;
            const ptCoord = this.getPerspectiveCoord(lane, pStep, this._coordScratch1);

            const standingEnvelope = Math.sin(Math.PI * frac);
            const vibration = isBeingHeld 
              ? (Math.sin(timeSec * 30.0 + ptCoord.y * 0.10) * (6.0 * standingEnvelope * ptCoord.scale))
              : (Math.sin(timeSec * 6.0 + ptCoord.y * 0.05) * (1.2 * standingEnvelope * ptCoord.scale));

            const wave = Math.sin((ptCoord.y * 0.04) - (currentTime * 0.008)) * (2.4 * ptCoord.scale);
            const halfW = Math.max(4, (ptCoord.laneW * 0.40) + wave);

            let pt = stringPoints[s];
            if (!pt) {
              pt = { x: 0, y: 0, scale: 1, laneW: 50, halfW: 20 };
              stringPoints[s] = pt;
            }
            pt.x = ptCoord.x + vibration;
            pt.y = ptCoord.y;
            pt.scale = ptCoord.scale;
            pt.laneW = ptCoord.laneW;
            pt.halfW = halfW;
          }

          // 1. Cinta Hold 100% Opaca y Ultra-Saturada (Máximo contraste sobre la pista blanca 3D)
          const LANE_HOLD_THEMES = [
            { body: '#0066ff', mid: '#00c8ff', rail: '#0044cc', rim: '#04081c' }, // Carril 0: Azul/Cian Eléctrico Saturado
            { body: '#d9006c', mid: '#ff1a8c', rail: '#99004d', rim: '#1c0412' }, // Carril 1: Magenta/Rubí Neón Saturado
            { body: '#7c00ff', mid: '#b833ff', rail: '#4d0099', rim: '#110420' }  // Carril 2: Violeta/Amatista Eléctrico Saturado
          ];
          const hTheme = LANE_HOLD_THEMES[lane % 3];
          const holdCol = isBeingHeld ? '#00d67f' : hTheme.body;
          const holdMid = isBeingHeld ? '#00ff9d' : hTheme.mid;
          const holdGlow = isBeingHeld ? '#00a862' : hTheme.rail;

          ctx.save();
          // Todo el cuerpo del Hold se dibuja en source-over con opacidad 1.0 (sin transparencia ni blanqueo lighter)
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;

          // A1. Carcasa exterior oscura sólida (100% opaca) para contraste absoluto sobre pista blanca
          const borderPad = 3.5;
          ctx.beginPath();
          for (let s = 0; s <= segments; s++) {
            const pt = stringPoints[s];
            if (s === 0) ctx.moveTo(pt.x - pt.halfW - borderPad, pt.y);
            else ctx.lineTo(pt.x - pt.halfW - borderPad, pt.y);
          }
          for (let s = segments; s >= 0; s--) {
            const pt = stringPoints[s];
            ctx.lineTo(pt.x + pt.halfW + borderPad, pt.y);
          }
          ctx.closePath();
          ctx.fillStyle = hTheme.rim;
          ctx.fill();

          // A2. Cuerpo principal 100% opaco y profundamente saturado
          ctx.beginPath();
          for (let s = 0; s <= segments; s++) {
            const pt = stringPoints[s];
            if (s === 0) ctx.moveTo(pt.x - pt.halfW, pt.y);
            else ctx.lineTo(pt.x - pt.halfW, pt.y);
          }
          for (let s = segments; s >= 0; s--) {
            const pt = stringPoints[s];
            ctx.lineTo(pt.x + pt.halfW, pt.y);
          }
          ctx.closePath();
          ctx.fillStyle = holdCol;
          ctx.fill();

          // A3. Banda interior saturada de alto brillo (sin transparencia)
          ctx.beginPath();
          for (let s = 0; s <= segments; s++) {
            const pt = stringPoints[s];
            const innerW = pt.halfW * 0.62;
            if (s === 0) ctx.moveTo(pt.x - innerW, pt.y);
            else ctx.lineTo(pt.x - innerW, pt.y);
          }
          for (let s = segments; s >= 0; s--) {
            const pt = stringPoints[s];
            const innerW = pt.halfW * 0.62;
            ctx.lineTo(pt.x + innerW, pt.y);
          }
          ctx.closePath();
          ctx.fillStyle = holdMid;
          ctx.fill();

          // B. Raíles laterales sólidos de alta saturación
          ctx.strokeStyle = holdGlow;
          ctx.lineWidth = Math.max(2.5, 4.4 * stringPoints[segments].scale);
          ctx.beginPath();
          for (let s = 0; s <= segments; s++) {
            const pt = stringPoints[s];
            if (s === 0) ctx.moveTo(pt.x - pt.halfW, pt.y);
            else ctx.lineTo(pt.x - pt.halfW, pt.y);
          }
          for (let s = 0; s <= segments; s++) {
            const pt = stringPoints[s];
            if (s === 0) ctx.moveTo(pt.x + pt.halfW, pt.y);
            else ctx.lineTo(pt.x + pt.halfW, pt.y);
          }
          ctx.stroke();

          // C. Espina dorsal central con borde de contraste y núcleo blanco puro
          ctx.strokeStyle = hTheme.rim;
          ctx.lineWidth = Math.max(3.5, 6.8 * stringPoints[segments].scale);
          ctx.beginPath();
          for (let s = 0; s <= segments; s++) {
            if (s === 0) ctx.moveTo(stringPoints[s].x, stringPoints[s].y);
            else ctx.lineTo(stringPoints[s].x, stringPoints[s].y);
          }
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(2.0, 3.4 * stringPoints[segments].scale);
          ctx.stroke();

          // D. Pulsos de energía sólidos viajando a lo largo del Hold
          const pulseCycle = (currentTime * 0.003) % 1.0;
          for (let pIdx = 0; pIdx < 3; pIdx++) {
            const pFrac = (pulseCycle + pIdx * 0.33) % 1.0;
            const ptIdx = Math.min(stringPoints.length - 1, Math.floor(pFrac * (stringPoints.length - 1)));
            const pulsePt = stringPoints[ptIdx];
            if (pulsePt) {
              const pRad = (isBeingHeld ? 7.5 : 5.2) * pulsePt.scale;
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = hTheme.rim;
              ctx.lineWidth = 2.0;
              ctx.beginPath();
              ctx.arc(pulsePt.x, pulsePt.y, pRad, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          }

          // E. Filamento Doble Hélice cuando el Hold está siendo pulsado
          if (isBeingHeld) {
            for (let strand = 0; strand < 2; strand++) {
              ctx.strokeStyle = strand === 0 ? '#ffffff' : '#ffe600';
              ctx.lineWidth = (strand === 0 ? 2.4 : 2.0) * stringPoints[segments].scale;
              ctx.beginPath();
              const phaseOffset = strand * Math.PI;
              for (let s = 0; s <= segments; s++) {
                const pt = stringPoints[s];
                const env = Math.sin((s / segments) * Math.PI);
                const helixX = pt.x + Math.sin(s * 0.95 - currentTime * 0.016 + phaseOffset) * (pt.halfW * 0.65 * env);
                if (s === 0) ctx.moveTo(helixX, pt.y);
                else ctx.lineTo(helixX, pt.y);
              }
              ctx.stroke();
            }
          }
          ctx.restore();

          // F. CAPUCHÓN TERMINAL 100% OPACO Y CON ALTO CONTRASTE
          const tailPt = stringPoints[0];
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
          const pinRad = (isLarge ? 11 : 7.5) * tailPt.scale;

          // Barra transversal de cierre con borde oscuro
          const barW = Math.max(12, (tailPt.laneW * 0.42));
          ctx.strokeStyle = hTheme.rim;
          ctx.lineWidth = Math.max(4.5, 7.5 * tailPt.scale);
          ctx.beginPath();
          ctx.moveTo(tailPt.x - barW, tailPt.y);
          ctx.lineTo(tailPt.x + barW, tailPt.y);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(2.4, 4.2 * tailPt.scale);
          ctx.stroke();

          // Medallón sólido saturado en la punta del Hold
          ctx.fillStyle = hTheme.rim;
          ctx.beginPath();
          ctx.arc(tailPt.x, tailPt.y, pinRad * 1.55, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = holdCol;
          ctx.beginPath();
          ctx.arc(tailPt.x, tailPt.y, pinRad * 1.25, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1.8, 2.8 * tailPt.scale);
          ctx.stroke();

          // Estrella diamante central blanca
          const starRot = currentTime * 0.004;
          ctx.save();
          ctx.translate(tailPt.x, tailPt.y);
          ctx.rotate(starRot);
          const sOuter = pinRad * 1.15;
          const sInner = pinRad * 0.38;
          ctx.beginPath();
          for (let pt = 0; pt < 8; pt++) {
            const rCur = (pt % 2 === 0) ? sOuter : sInner;
            const aCur = (pt / 8) * Math.PI * 2;
            const px = Math.cos(aCur) * rCur;
            const py = Math.sin(aCur) * rCur;
            if (pt === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.restore();

          ctx.restore();

          // Cabeza del Hold
          const headPt = stringPoints[segments];
          const headH = Math.min((isLarge ? 80 : 30) * headPt.scale, maxH3D);
          this.drawIvoryKey(ctx, lane, headPt.y, headH, headPt.scale, isBeingHeld, isLarge, false, lyricForNote);

          ctx.restore();
        
        // ==========================================
        // 2. NOTAS SWIPE (DESLIZAMIENTO CON CHEVRÓN + ESTELA DE POLVO ESTELAR)
        // ==========================================
        } else if (note.type === 'swipe') {
          const h = Math.min((isLarge ? 84 : 32) * coord.scale, maxH3D);
          // Estela aerodinámica de polvo estelar detrás de la tecla Swipe (0 allocs)
          if (pHead > 0.04 && pHead < 1.12) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const swipeDir = note.direction || 'up';
            const wakeCol = (this.activeSongPalette && this.activeSongPalette.glow) ? this.activeSongPalette.glow : '#00f2fe';
            for (let wIdx = 1; wIdx <= 3; wIdx++) {
              const pWake = Math.max(0.01, pHead - wIdx * 0.036);
              const wCoord = this.getPerspectiveCoord(lane, pWake, this._coordScratch1);
              const wakeAlpha = (0.38 - wIdx * 0.09) * Math.min(1, pHead * 1.8);
              if (wakeAlpha <= 0.02) continue;
              const wHalf = wCoord.laneW * (0.34 - wIdx * 0.05);
              const wY = wCoord.y - h * 0.45;
              ctx.strokeStyle = wIdx === 1 ? `rgba(255, 255, 255, ${wakeAlpha.toFixed(2)})` : hexToRgba(wakeCol, wakeAlpha);
              ctx.lineWidth = Math.max(1.2, (3.2 - wIdx * 0.6) * wCoord.scale);
              ctx.beginPath();
              if (swipeDir === 'left') {
                ctx.moveTo(wCoord.x + wHalf * 0.4, wY - 6 * wCoord.scale);
                ctx.lineTo(wCoord.x - wHalf * 0.5, wY);
                ctx.lineTo(wCoord.x + wHalf * 0.4, wY + 6 * wCoord.scale);
              } else if (swipeDir === 'right') {
                ctx.moveTo(wCoord.x - wHalf * 0.4, wY - 6 * wCoord.scale);
                ctx.lineTo(wCoord.x + wHalf * 0.5, wY);
                ctx.lineTo(wCoord.x - wHalf * 0.4, wY + 6 * wCoord.scale);
              } else {
                ctx.moveTo(wCoord.x - wHalf, wY + 5 * wCoord.scale);
                ctx.lineTo(wCoord.x, wY - 4 * wCoord.scale);
                ctx.lineTo(wCoord.x + wHalf, wY + 5 * wCoord.scale);
              }
              ctx.stroke();
            }
            ctx.restore();
          }
          const swipeKey = this.drawIvoryKey(ctx, drawLane, coord.y, h * mushHeightMult, coord.scale, false, isLarge, true, lyricForNote);
          this.renderVectorChevron(ctx, swipeKey.cx, swipeKey.cy, note.direction || 'up', swipeKey.w, swipeKey.h);

        // ==========================================
        // 3. NOTAS NORMALES (TAP ESTÁNDAR)
        // ==========================================
        } else {
          const h = Math.min((isLarge ? 80 : 30) * coord.scale * mushHeightMult, maxH3D);
          const tapKey = this.drawIvoryKey(ctx, drawLane, coord.y, h, coord.scale, false, isLarge, false, lyricForNote);
          // En modo Setas: si la tecla está saltando de carril o es múltiplo de 3, dibujar seta mágica sobre la tecla
          if (isMushroomActive && this._mushSprites && this._mushSprites.length > 0 && ((note._mushFromLane !== undefined && note._mushFromLane !== lane) || (i % 3 === 0))) {
            const spr = this._mushSprites[(note._mushColorIdx || 0) % this._mushSprites.length];
            const mSz = Math.max(16, 30 * coord.scale);
            ctx.drawImage(spr, tapKey.cx - mSz * 0.5, tapKey.cy - mSz * 0.5, mSz, mSz);
          }
        }
      }
    }

    renderJudgements() {
      const ctx = this.ctx;
      const len = this.judgements.length;
      if (len === 0) return;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 22px "Outfit", system-ui, sans-serif';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 0;

      for (let i = 0; i < len; i++) {
        const j = this.judgements[i];
        if (!j || !j.text || j.alpha <= 0.01) continue;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, j.alpha));
        const drawX = (typeof j.x === 'number') ? j.x : (this.width / 2);
        ctx.translate(drawX, j.y);
        const s = j.scale || 1;
        ctx.scale(s, s);

        ctx.strokeStyle = '#040207';
        ctx.lineWidth = 5.5;
        ctx.strokeText(j.text, 0, 0);

        ctx.fillStyle = j.color || '#ffffff';
        ctx.fillText(j.text, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    startLoop() {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      this.isRunning = true;
      let lastTime = performance.now();

      const loop = (now) => {
        if (!this.isRunning || this.isPaused || this.isRewinding) {
          this.animFrameId = null;
          return;
        }
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;
        this._frameNow = now;

        try {
          this.update(dt, now);
          this.render(now);
        } catch (err) {
          console.error('Error inside render loop:', err);
        }

        this.animFrameId = requestAnimationFrame(loop);
      };
      this.animFrameId = requestAnimationFrame(loop);
    }
}

  // Exportación al objeto global
window.BeatstarEngine = BeatstarEngine;
window.DirectAudioSync = DirectAudioSync;
window.ParticleSystem = ParticleSystem;
window.HighFidelityAudioPlayer = HighFidelityAudioPlayer;