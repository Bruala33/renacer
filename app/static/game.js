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

class HighFidelityAudioPlayer {
  constructor() {
    this.missAudio = new Audio(SFX_MISS_BASE64);
    this.missAudio.volume = 0.85;
    this.audioCtx = null;
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
      this.missAudio.currentTime = 0;
      this.missAudio.play().catch(() => {});
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
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }
}

// ==========================================
// DIRECT HIGH-FIDELITY AUDIO SYNC ENGINE
// ==========================================

class DirectAudioSync {
  constructor(onReady, onEnded, onError) {
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    this.audioElement.volume = 1.0;
    
    this.onReady = onReady;
    this.onEnded = onEnded;
    this.onError = onError;

    this.isPlaying = false;
    this.isLoaded = false;
    this.duration = 0;
    this.playbackRate = 1.0;
    
    // High-resolution clock anchor
    this.baseTimeMs = 0;
    this.basePerfNow = performance.now();

    const enforceSpeedAndPitch = () => {
      if (this.audioElement) {
        try {
          this.audioElement.defaultPlaybackRate = this.playbackRate;
          this.audioElement.playbackRate = this.playbackRate;
          this.audioElement.preservesPitch = true;
          this.audioElement.mozPreservesPitch = true;
          this.audioElement.webkitPreservesPitch = true;
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
      this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
      this.basePerfNow = performance.now();
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
      this.basePerfNow = performance.now();
    });

    this.audioElement.addEventListener('seeking', () => {
      enforceSpeedAndPitch();
      this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
      this.basePerfNow = performance.now();
    });

    this.audioElement.addEventListener('seeked', () => {
      enforceSpeedAndPitch();
      this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
      this.basePerfNow = performance.now();
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      if (this.onEnded) this.onEnded();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback error event:', e);
      if (this.audioElement.src && this.onError) {
        this.onError('Error en la reproducción de audio.');
      }
    });

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.isPlaying) {
        const audioCurrent = this.audioElement.currentTime;
        const now = performance.now();
        const actual = audioCurrent * 1000;
        this.baseTimeMs = actual;
        this.basePerfNow = now;
      }
    });
  }

  setPlaybackRate(rate) {
    const r = Math.max(0.5, Math.min(2.0, parseFloat(rate) || 1.0));
    this.playbackRate = r;
    if (this.audioElement) {
      try {
        this.audioElement.defaultPlaybackRate = r;
        this.audioElement.playbackRate = r;
        this.audioElement.preservesPitch = true;
        this.audioElement.mozPreservesPitch = true;
        this.audioElement.webkitPreservesPitch = true;
      } catch (e) {}
    }
    this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
    this.basePerfNow = performance.now();
  }

  loadAudioBlob(blob) {
    if (!blob) return;
    if (typeof blob === 'string') {
      this.loadAudioUrl(blob);
      return;
    }
    const url = URL.createObjectURL(blob);
    this.loadAudioUrl(url);
  }

  loadAudioUrl(url) {
    this.isLoaded = false;
    this.isPlaying = false;
    this.audioElement.loop = false;
    this.audioElement.src = url;
    if (this.playbackRate !== 1.0) {
      this.audioElement.playbackRate = this.playbackRate;
    }
    this.audioElement.load();
    this.baseTimeMs = 0;
    this.basePerfNow = performance.now();
  }

  play() {
    if (!this.audioElement.src) return Promise.resolve();
    try {
      try {
        this.audioElement.defaultPlaybackRate = this.playbackRate;
        this.audioElement.playbackRate = this.playbackRate;
        this.audioElement.preservesPitch = true;
        this.audioElement.mozPreservesPitch = true;
        this.audioElement.webkitPreservesPitch = true;
      } catch (e) {}
      const p = this.audioElement.play();
      if (p && typeof p.then === 'function') {
        return p.then(() => {
          this.isPlaying = true;
          this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
          this.basePerfNow = performance.now();
        }).catch(err => {
          if (err.name !== 'AbortError') {
            console.warn('Audio play request catch:', err);
          }
        });
      }
      return Promise.resolve();
    } catch (e) {
      console.warn('Audio play exception:', e);
      return Promise.resolve();
    }
  }

  pause() {
    this.isPlaying = false;
    try {
      this.audioElement.pause();
    } catch (e) {}
    this.baseTimeMs = (this.audioElement.currentTime || 0) * 1000;
    this.basePerfNow = performance.now();
  }

  seekTo(seconds) {
    const sec = Math.max(0, parseFloat(seconds) || 0);
    try {
      this.audioElement.currentTime = sec;
    } catch (e) {}
    this.baseTimeMs = sec * 1000;
    this.basePerfNow = performance.now();
  }

  getCurrentTimeMs() {
    if (!this.isPlaying) {
      return (this.audioElement.currentTime || 0) * 1000;
    }
    const rate = this.playbackRate || this.audioElement.playbackRate || 1.0;
    const elapsed = (performance.now() - this.basePerfNow) * rate;
    return Math.max(0, this.baseTimeMs + elapsed);
  }
}

// ==========================================
// HIGH PERFORMANCE ZERO-GC PARTICLE POOL SYSTEM
// ==========================================

class ParticleSystem {
  constructor(maxParticles = 500, maxShockwaves = 40) {
    this.maxParticles = maxParticles;
    this.maxShockwaves = maxShockwaves;
    this.maxArcs = 16;

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

  // 1. Standard Minimal / Neon Sparks
  emitHit(x, y, color = '#00f2fe', count = 20) {
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 200;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 30;
      p.gravity = 0;
      p.drag = 0.96;
      p.radius = 1.8 + Math.random() * 3.0;
      p.color = color;
      p.alpha = 1.0;
      p.decay = 2.0 + Math.random() * 1.5;
      p.type = 'spark';
      p.rotation = 0;
      p.rotSpeed = 0;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 8;
      sw.maxRadius = 60;
      sw.growth = 12.0;
      sw.color = color;
      sw.alpha = 0.85;
      sw.decay = 3.5;
      sw.lineWidth = 2.0;
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

  emitSwipeBurst(x, y, direction = 'up', color = '#ffd700', count = 28) {
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      let baseAngle = -Math.PI / 2;
      if (direction === 'down') baseAngle = Math.PI / 2;
      else if (direction === 'left') baseAngle = Math.PI;
      else if (direction === 'right') baseAngle = 0;

      const angle = baseAngle + (Math.random() - 0.5) * 1.1;
      const speed = 120 + Math.random() * 260;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 0;
      p.drag = 0.95;
      p.radius = 2.5 + Math.random() * 3.5;
      p.color = color;
      p.alpha = 1.0;
      p.decay = 2.2 + Math.random() * 1.5;
      p.type = 'spark';
      p.rotation = 0;
      p.rotSpeed = 0;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 10;
      sw.maxRadius = 80;
      sw.growth = 14.0;
      sw.color = color;
      sw.alpha = 0.95;
      sw.decay = 4.0;
      sw.lineWidth = 2.5;
    }
  }

  emitHoldSpark(x, y, color = '#00ff88') {
    for (let i = 0; i < 3; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = (Math.random() - 0.5) * Math.PI - Math.PI / 2;
      const speed = 40 + Math.random() * 90;

      p.x = x + (Math.random() - 0.5) * 18;
      p.y = y + (Math.random() - 0.5) * 6;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 0;
      p.drag = 0.96;
      p.radius = 1.4 + Math.random() * 2.2;
      p.color = color;
      p.alpha = 0.85;
      p.decay = 3.2;
      p.type = 'spark';
      p.rotation = 0;
      p.rotSpeed = 0;
      p.scaleX = 1;
      p.scaleY = 1;
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
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p || !p.active || p.alpha <= 0.01) continue;

      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;

      if (p.type === 'paint_drop') {
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
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (0.6 + p.alpha * 0.4), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
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

class BeatstarEngine {
  constructor(canvas, uiCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.ui = uiCallbacks;

    // Cap resolution scaling at 2x max for 120 FPS mobile GPU efficiency
    this.dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2);
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

    // PC Controls & Detection
    this.isPCMode = (typeof window !== 'undefined') && (!('ontouchstart' in window) && (navigator.maxTouchPoints === 0 || (window.matchMedia && window.matchMedia('(pointer: fine)').matches)));
    const savedKeybinds = (typeof localStorage !== 'undefined') ? localStorage.getItem('beatstar_pc_keybinds') : null;
    this.pcKeybinds = savedKeybinds ? JSON.parse(savedKeybinds) : { 0: 'd', 1: 'f', 2: 'j' };
    this.initCustomBackground();

    // Scoring & Multiplier
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.streakCount = 0;
    this.multiplier = 1;
    this.stars = 0;
    this.targetScore = 100000;
    this.missCount = 0;
    this.invulnerableUntil = 0;
    this.isInitialLaunch = true;
    this.isRewinding = false;
    this.isCountingDown = false;
    this.judgements = [];
    this.stats = { perfectPlus: 0, perfect: 0, great: 0, miss: 0 };
    this.vignetteAlpha = 0;
    this.vignetteColor = '#00f2fe';

    // Custom judgment colors (persisted in localStorage)
    const _savedJudgeColors = (() => { try { return JSON.parse(localStorage.getItem('beatstar_judge_colors') || 'null'); } catch(e) { return null; } })();
    this.judgeColors = Object.assign({
      perfectPlus: '#00f2fe',
      perfect:     '#00ff88',
      great:       '#ffd700',
      good:        '#ff8800'
    }, _savedJudgeColors || {});

    this.nextCalibNoteTime = 0;
    this.synth = new HighFidelityAudioPlayer();

    this.particles = new ParticleSystem();
    this.sync = new DirectAudioSync(
      () => this.onAudioReady(),
      () => this.onAudioEnded(),
      (msg) => this.onAudioError(msg)
    );
    this.audioSync = this.sync;

    this.initCanvasSize();
    this.bindEvents();
  }

  emitKeyHit(x, y, color = '#00f2fe', count = 22) {
    if (this.activeEffect === 'paint_splash') {
      this.particles.emitPaintSplash(x, y, 30);
    } else if (this.activeEffect === 'fire_inferno') {
      this.particles.emitFireInferno(x, y, 32);
    } else if (this.activeEffect === 'full_focus_base') {
      this.vignetteAlpha = 0.85;
      this.vignetteColor = color;
      this.particles.emitHit(x, y, color, 20);
    } else if (this.activeEffect === 'full_focus_fireworks') {
      this.vignetteAlpha = 0.70;
      this.vignetteColor = color;
      this.particles.emitFullFocusFireworks(x, y, color, this.width || 360, this.height || 740);
    } else if (this.activeEffect === 'full_focus_electric') {
      this.vignetteAlpha = 0.75;
      this.vignetteColor = color;
      this.particles.emitFullFocusElectric(x, y, color, this.width || 360, this.height || 740);
    } else {
      this.particles.emitHit(x, y, color, count);
    }
  }

  setActiveEffect(effectId) {
    this.activeEffect = effectId || 'default_neon';
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

  setJudgeColors(colors) {
    this.judgeColors = Object.assign(this.judgeColors || {}, colors);
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
    const base = this.baseScrollDurationMs || 1200;
    const mult = Math.max(0.5, Math.min(2.5, this.noteSpeedMultiplier));
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
    const rect = (this.canvas && this.canvas.getBoundingClientRect) ? this.canvas.getBoundingClientRect() : { width: 360, height: 640 };
    const viewport = typeof document !== 'undefined' ? document.querySelector('.game-viewport') : null;
    const vpRect = (viewport && viewport.getBoundingClientRect) ? viewport.getBoundingClientRect() : null;

    this.width = rect.width || (vpRect ? vpRect.width : 0) || (typeof window !== 'undefined' ? window.innerWidth : 360) || 360;
    this.height = rect.height || (vpRect ? vpRect.height : 0) || (typeof window !== 'undefined' ? window.innerHeight : 640) || 640;
    this.numLanes = 3;
    this.laneWidth = this.width / 3;
    this.hitLineY = this.height * 0.82;

    this.dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    if (this.ctx) {
      if (typeof this.ctx.setTransform === 'function') {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      this.ctx.scale(this.dpr, this.dpr);
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.initCanvasSize());

    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

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

      if (e.key === 'ArrowLeft') this.triggerLaneInput(0, 'swipe', 'left');
      if (e.key === 'ArrowRight') this.triggerLaneInput(2, 'swipe', 'right');
      if (e.key === 'ArrowUp') this.triggerLaneInput(1, 'swipe', 'up');
      if (e.key === 'ArrowDown') this.triggerLaneInput(1, 'swipe', 'down');
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
   * Adjusted to a slower, comfortable and readable speed curve.
   */
  computeDynamicScrollDuration(stars, rawNotes = []) {
    const s = Math.max(1.0, Math.min(10.0, parseFloat(stars) || 3.5));
    
    // Curva de velocidad por estrellas altamente diferenciada (ms):
    // Cuantas más estrellas tiene la canción, más rápido caen las notas (menor scroll duration).
    // 1★:  2000ms (Muy lento / relajado, ideal para aprender)
    // 2★:  1840ms (Fácil)
    // 3★:  1680ms (Normal)
    // 4★:  1520ms (Intermedio)
    // 5★:  1360ms (Difícil)
    // 6★:  1200ms (Desafío alto)
    // 7★:  1040ms (Extrema)
    // 8★:  880ms  (Experto)
    // 9★:  720ms  (Insana)
    // 10★: 580ms  (Máxima velocidad pro)
    const duration = Math.round(2000 - (s - 1.0) * ((2000 - 580) / 9.0));
    return Math.max(500, Math.min(2400, duration));
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
    this.isCalibrating = false;
    this.beatmapData = beatmapData;
    this.currentAudioSource = audioBlobOrUrl || (beatmapData && beatmapData.audio_blob_url) || null;
    this.numLanes = 3;
    this.laneGlows = [0, 0, 0];
    this.fxRipples = [];
    this.bgBursts = [];
    this.initCanvasSize();

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.particles) {
      this.particles.reset();
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
        end_timestamp_ms: isHold ? (rawT + Math.max(150, rawDur)) : null
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

    const densityMode = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_map_density') : null) || 'hard';
    const sanitizedNotes = (!isCommunity && typeof LaneRemapper !== 'undefined' && LaneRemapper.sanitizeForTwoFingers)
      ? LaneRemapper.sanitizeForTwoFingers(rawNotes, this.bpm, diffStars, densityMode)
      : rawNotes;

    // Set dynamic base scroll duration based on difficulty curve or explicit custom preset
    const baseScroll = (Number.isFinite(this.beatmapData.baseScrollDurationMs) && this.beatmapData.baseScrollDurationMs > 0)
      ? this.beatmapData.baseScrollDurationMs
      : this.computeDynamicScrollDuration(diffStars, sanitizedNotes);
    this.baseScrollDurationMs = baseScroll;

    // Apply the active note speed multiplier to the dynamic scroll duration
    const speedMult = Math.max(0.5, Math.min(2.5, this.noteSpeedMultiplier || 1.0));
    this.scrollDurationMs = Math.round(baseScroll / speedMult);
    console.log(`[BeatstarEngine] Diff: ${diffStars}★ ("${dNameRaw}") | BaseScroll: ${baseScroll}ms | Mult: ${speedMult}x -> Final: ${this.scrollDurationMs}ms`);

    // Apply custom song playback rate if provided
    const songRate = Math.max(0.5, Math.min(2.0, parseFloat(this.beatmapData.songPlaybackSpeed) || 1.0));
    this.setSongPlaybackSpeed(songRate);

    this.notes = sanitizedNotes.map((n, idx) => {
      const rawT = Number.isFinite(n.timestamp_ms) ? n.timestamp_ms : idx * 500;
      const adjustedTime = Math.round(rawT);
      const rawDur = Number.isFinite(n.duration_ms) ? n.duration_ms : 0;
      const adjustedEndTime = (n.type === 'hold' || rawDur > 0) ? (adjustedTime + Math.max(150, rawDur)) : null;
      const laneVal = Math.max(0, Math.min(2, parseInt(n.lane ?? n.column ?? n.track ?? 0, 10) || 0));
      return {
        ...n,
        id: n.id !== undefined ? n.id : idx,
        lane: laneVal,
        column: laneVal,
        track: laneVal,
        type: (n.type === 'hold' || rawDur > 0) ? 'hold' : (n.type === 'swipe' ? 'swipe' : 'tap'),
        time: adjustedTime / 1000,
        timeMs: adjustedTime,
        timestamp_ms: adjustedTime,
        duration_ms: rawDur,
        holdDuration: rawDur / 1000,
        end_timestamp_ms: adjustedEndTime,
        hit: false,
        holding: false,
        holdCompleted: false,
        missed: false,
        processed: false
      };
    });

    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.streakCount = 0;
    this.multiplier = 1;
    this.stars = 0;
    this.currentMedalTier = null;
    this.missCount = 0;
    this.invulnerableUntil = 2400; // Invulnerable during startup grace period
    this.stats = { perfectPlus: 0, perfect: 0, great: 0, miss: 0 };
    
    // Cálculo preciso de la puntuación máxima teórica (100% Perfect+ con multiplicadores)
    this.maxPossibleScore = this.computeMaxPossibleScore(this.notes);
    this.targetScore = this.maxPossibleScore;

    // Load audio track properly depending on type (Blob vs URL/String)
    if (audioBlobOrUrl instanceof Blob) {
      this.sync.loadAudioBlob(audioBlobOrUrl);
    } else if (typeof audioBlobOrUrl === 'string' && audioBlobOrUrl) {
      this.sync.loadAudioUrl(audioBlobOrUrl);
    } else if (beatmapData.audio_blob_url) {
      this.sync.loadAudioUrl(beatmapData.audio_blob_url);
    }

    this.sync.seekTo(0);
    this.sync.pause();

    this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, null, 0);
    this.ui.onSongLoaded(beatmapData.metadata);

    // Start fast 3-2-1 countdown, then start playback and rendering loop strictly at '¡YA!'
    const startPlay = () => {
      this.isCountingDown = false;
      this.isPaused = false;
      this.invulnerableUntil = 2400; // 2.4s initial protection
      const startSec = (Number.isFinite(this.beatmapData.startMarkerMs) && this.beatmapData.startMarkerMs > 0)
        ? (this.beatmapData.startMarkerMs / 1000)
        : 0;
      this.sync.seekTo(startSec);
      this.sync.play();
      this.startLoop();
    };

    if (this.ui && this.ui.onStartCountdown) {
      this.ui.onStartCountdown(() => {
        startPlay();
      });
    } else {
      startPlay();
    }
  }

  startNativeCalibration() {
    this.isCalibrating = true;
    this.calibrationIntervalMs = 1200; // Intervalo de nota cada 1.2s en bucle infinito
    this.scrollDurationMs = 1200;
    this.isPaused = false;
    this.isGameOver = false;
    this.isRewinding = false;
    this.isCountingDown = false;
    this.sync.pause();
    this.notes = [];
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];

    this.synth.ensureContext();
    this.calibrationStartTime = performance.now();
    this.nextCalibNoteTime = performance.now() + 300;
    this.startLoop();
  }

  stopNativeCalibration() {
    this.isCalibrating = false;
    this.notes = [];
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.stop();
  }

  pause() {
    this.isPaused = true;
    this.sync.pause();
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
    this.lastMissTimePerf = performance.now();
    this.initCanvasSize();
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
    ctx.fillStyle = `rgba(0, 242, 254, ${alpha * 0.12})`;
    ctx.fillRect(0, 0, w, h);

    // 2. Upward tape scanlines
    ctx.strokeStyle = `rgba(0, 242, 254, ${alpha * 0.35})`;
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
      ctx.fillStyle = `rgba(0, 242, 254, ${chevronAlpha})`;
      ctx.font = '900 20px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 16;
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
      this.renderLanes();
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

    // 3. Clear ALL notes prior to and at the failure point!
    // Any note with timestamp <= failTimeMs + 60ms is completely deleted (marked as processed/completed)
    // Only upcoming notes after the failure point will fall down!
    for (const note of this.notes) {
      const noteTime = note.timestamp_ms || 0;
      if (noteTime <= failTimeMs + 60) {
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

    if (this.particles) {
      this.particles.reset();
    }
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.fxRipples = [];
    this.bgBursts = [];

    this.isProcessingMiss = false;
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

  stop() {
    this.isPaused = true;
    this.isRunning = false;
    this.isRewinding = false;
    this.isProcessingMiss = false;
    this.isCountingDown = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.sync.pause();
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.notes = [];
    this.judgements = [];
    this.fxRipples = [];
  }

  getLaneFromX(clientX) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const lane = Math.floor(x / (rect.width / 3));
    return Math.max(0, Math.min(2, lane));
  }

  handleTouchStart(e) {
    e.preventDefault();
    if (this.isPaused || this.isRewinding || this.isCountingDown) return;

    const rect = this.canvas.getBoundingClientRect();
    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const lane = this.getLaneFromX(touch.clientX);

      this.activeTouches.set(touch.identifier, {
        x0: x, y0: y, t0: now, lane, swiped: false
      });

      this.triggerLaneInput(lane, 'tap', null, touch.identifier);
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (this.isPaused || this.isRewinding || this.isCountingDown) return;

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
      const dist = Math.hypot(dx, dy);
      const elapsed = now - touchData.t0;

      if (dist > 20 && elapsed < 350) {
        let direction = 'up';
        if (Math.abs(dx) > Math.abs(dy)) {
          direction = dx > 0 ? 'right' : 'left';
        } else {
          direction = dy > 0 ? 'down' : 'up';
        }

        touchData.swiped = true;
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
    }
  }

  handleMouseDown(e) {
    if (this.isPaused || this.isRewinding || this.isCountingDown) return;
    const lane = this.getLaneFromX(e.clientX);
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
    if (!this.mouseTouch || this.mouseTouch.swiped || this.isPaused || this.isRewinding || this.isCountingDown) return;
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
    this.laneGlows[lane] = 1.0;
    const currentTime = this.isCalibrating 
      ? (performance.now() - this.calibrationStartTime) + this.latencyOffsetMs
      : this.sync.getCurrentTimeMs() + this.latencyOffsetMs;

    const hitX = (lane + 0.5) * this.laneWidth;
    const hitY = this.hitLineY;

    // Palette per lane
    const burstPalette = [
      { c1: '#00f2fe', c2: '#3b82f6', alt: '#39ff14' }, // Lane 0: Electric Cyan / Lime
      { c1: '#ff007f', c2: '#a855f7', alt: '#ffe600' }, // Lane 1: Hot Magenta / Royal Purple
      { c1: '#fbbf24', c2: '#ff3300', alt: '#ff007f' }  // Lane 2: Radiant Gold / Crimson
    ];
    const p = burstPalette[lane % 3] || { c1: '#00f2fe', c2: '#ff007f', alt: '#ffe600' };

    const effect = this.activeEffect || 'default_neon';

    // Spawn rich, creative full-screen phenomena strictly on key tap
    if (effect === 'paint_splash') {
      const blotches = [];
      const blotchColors = ['#ff007f', '#00f2fe', '#ffe600', '#39ff14', '#b142ff', '#ff3366'];
      const numBlotches = 8;
      for (let i = 0; i < numBlotches; i++) {
        const ang = (Math.random() - 0.5) * Math.PI * 1.7 - Math.PI / 2;
        const dist = 50 + Math.random() * (this.height * 0.65);
        blotches.push({
          angle: ang,
          dist: dist,
          maxDist: dist * (1.2 + Math.random() * 0.3),
          radius: 12 + Math.random() * 26,
          color: blotchColors[i % blotchColors.length],
          subDrops: [
            { dx: (Math.random() - 0.5) * 35, dy: (Math.random() - 0.5) * 35, r: 3 + Math.random() * 6 },
            { dx: (Math.random() - 0.5) * 45, dy: (Math.random() - 0.5) * 45, r: 2.5 + Math.random() * 5 }
          ]
        });
      }

      this.bgBursts.push({
        type: 'paint_splash',
        lane,
        x: hitX,
        y: hitY,
        radius: 35,
        maxRadius: Math.max(this.width, this.height) * 1.1,
        alpha: 0.9,
        decay: 2.2,
        color1: p.c1,
        color2: p.c2,
        blotches: blotches
      });
    } else if (effect === 'fire_inferno') {
      const flames = [];
      const numFlames = 4;
      for (let i = 0; i < numFlames; i++) {
        flames.push({
          targetX: (this.width * 0.1) + Math.random() * (this.width * 0.8),
          curveOffsetX: (Math.random() - 0.5) * 140,
          speed: 1.1 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
          width: 22 + Math.random() * 30,
          color: i % 2 === 0 ? '#ffea00' : '#ff3300'
        });
      }

      this.bgBursts.push({
        type: 'fire_inferno',
        lane,
        x: hitX,
        y: hitY,
        progress: 0,
        radius: 25,
        maxRadius: Math.max(this.width, this.height),
        alpha: 0.95,
        decay: 2.1,
        color1: '#ff8800',
        color2: '#ff2200',
        flames: flames
      });
    } else if (effect === 'color_burst') {
      const rays = [];
      const numRays = 10;
      for (let i = 0; i < numRays; i++) {
        rays.push({
          angle: (i / numRays) * Math.PI * 2 + (Math.random() - 0.5) * 0.2,
          len: 100 + Math.random() * (this.height * 0.7),
          width: 8 + Math.random() * 16,
          color: i % 2 === 0 ? p.c1 : p.c2
        });
      }

      this.bgBursts.push({
        type: 'color_burst',
        lane,
        x: hitX,
        y: hitY,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.5,
        radius: 25,
        maxRadius: Math.max(this.width, this.height) * 1.2,
        alpha: 0.9,
        decay: 2.0,
        color1: p.c1,
        color2: p.c2,
        rays: rays
      });
    }

    this.fxRipples.push({
      lane,
      x: hitX,
      y: hitY,
      radius: 12,
      maxRadius: 180,
      alpha: 0.85,
      decay: 2.2,
      color: p.c1
    });

    let closestNote = null;
    let minDiff = Infinity;

    for (const note of this.notes) {
      if ((!this.isCalibrating && note.lane !== lane) || note.hit || note.missed || note.holdCompleted) continue;
      const diff = Math.abs(note.timestamp_ms - currentTime);
      if (diff < 260 && diff < minDiff) {
        minDiff = diff;
        closestNote = note;
      }
    }

    if (!closestNote) {
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, '#00f2fe');
      }
      if (this.isCalibrating) {
        this.synth.playClick();
        this.emitKeyHit(hitX, hitY, this.judgeColors?.perfectPlus || '#00f2fe', 24);
        return;
      }
      
      const nowPerf = performance.now();
      if (this.beatmapData && this.sync.isPlaying && currentTime > this.invulnerableUntil && !this.isProcessingMiss && (nowPerf - this.lastMissTimePerf >= 750)) {
        this.synth.playPunchyArcadeMiss();
        this.addJudgement('GHOST TAP', '#ff4d4d');
        this.handleMiss();
      }
      return;
    }

    if (this.isCalibrating) {
      const jCalib = this.judgeHit(closestNote, minDiff, hitX, hitY);
      closestNote.hit = true;
      this.emitKeyHit(hitX, hitY, jCalib.color, 28);
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, jCalib.color);
      }
      return;
    }

    if (closestNote.type === 'tap' && inputType === 'tap') {
      const j = this.judgeHit(closestNote, minDiff, hitX, hitY);
      closestNote.hit = true;
      this.emitKeyHit(hitX, hitY, j.color, 24);
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, j.color);
      }
    } 
    else if (closestNote.type === 'swipe') {
      const targetDir = closestNote.direction || 'up';
      if (inputType === 'swipe' && (swipeDirection === targetDir || !closestNote.direction)) {
        const j = this.judgeHit(closestNote, minDiff, hitX, hitY, 'SWIPE');
        closestNote.hit = true;
        this.emitKeyHit(hitX, hitY, j.color, 28);
        this.particles.emitSwipeBurst(hitX, hitY, targetDir, j.color, 32);
        if (this.customBgMode === 'reactive') {
          this.addReactiveBurst(lane, hitX, hitY, j.color);
        }
      } else if (this.isPCMode && inputType === 'tap') {
        // EN PC: Las notas swipe se tocan con la tecla normal del carril sin deslizar
        const j = this.judgeHit(closestNote, minDiff, hitX, hitY, 'SWIPE');
        closestNote.hit = true;
        this.emitKeyHit(hitX, hitY, j.color, 28);
        this.particles.emitSwipeBurst(hitX, hitY, targetDir, j.color, 32);
        if (this.customBgMode === 'reactive') {
          this.addReactiveBurst(lane, hitX, hitY, j.color);
        }
      }
    } 
    else if (closestNote.type === 'hold' && inputType === 'tap') {
      const j = this.judgeHit(closestNote, minDiff, hitX, hitY);
      closestNote.holding = true;
      closestNote.missed = false;
      this.activeHolds.set(lane, {
        note: closestNote,
        touchId: touchId,
        startTime: currentTime,
        initialTime: closestNote.timestamp_ms,
        color: j.color
      });
      this.emitKeyHit(hitX, hitY, j.color, 22);
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, j.color);
      }
    }
  }

  releaseLaneHold(lane, touchId = null) {
    const active = this.activeHolds.get(lane);
    if (!active) return;
    if (touchId !== null && active.touchId !== touchId) return;

    const currentTime = this.sync.getCurrentTimeMs() + this.latencyOffsetMs;
    const note = active.note;
    const endT = note.end_timestamp_ms || (note.timestamp_ms + (note.duration_ms || 700));

    if (currentTime >= endT - 160) {
      note.holdCompleted = true;
      note.hit = true;
      note.holding = false;
      this.addScore(450 * this.multiplier);
      const hitX = (lane + 0.5) * this.laneWidth;
      const holdColor = active.color || '#00ff88';
      this.emitKeyHit(hitX, this.hitLineY, holdColor, 30);
    } else {
      note.missed = true;
      note.holding = false;
      const nowPerf = performance.now();
      if (!this.isProcessingMiss && (nowPerf - this.lastMissTimePerf >= 750)) {
        this.synth.playPunchyArcadeMiss();
        this.addJudgement('HOLD DROP', '#ff4d4d');
        this.handleMiss();
      }
    }
    this.activeHolds.delete(lane);
  }

  judgeHit(note, diffMs, x, y, customLabel = null) {
    const jc = this.judgeColors || {};
    let text = 'GREAT';
    let color = jc.great || '#ffd700';
    let points = 150;

    if (diffMs <= 45) {
      text = customLabel ? `PERFECT+ ${customLabel}` : 'PERFECT+';
      color = jc.perfectPlus || '#00f2fe';
      points = 450;
      this.stats.perfectPlus++;
      this.streakCount++;
    } else if (diffMs <= 90) {
      text = customLabel ? `PERFECT ${customLabel}` : 'PERFECT';
      color = jc.perfect || '#00ff88';
      points = 300;
      this.stats.perfect++;
      this.streakCount++;
    } else if (diffMs <= 170) {
      text = customLabel ? `GREAT ${customLabel}` : 'GREAT';
      color = jc.great || '#ffd700';
      points = 150;
      this.stats.great++;
      this.streakCount = Math.max(0, this.streakCount - 1);
    } else {
      text = customLabel ? `GOOD ${customLabel}` : 'GOOD';
      color = jc.good || '#ff8800';
      points = 75;
      this.stats.good = (this.stats.good || 0) + 1;
      this.streakCount = 0;
    }

    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Nuevos Umbrales de Multiplicador Beatstar:
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
    
    this.addScore(points * this.multiplier);
    this.addJudgement(text, color);
    return { text, color, points };
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
    this.stars = Math.max(this.stars, stars);

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

    this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, this.currentMedalTier, scorePct, accuracyPct);
  }

  handleMiss() {
    const nowPerf = performance.now();
    if (this.isProcessingMiss || (nowPerf - this.lastMissTimePerf < 750)) {
      return;
    }

    this.isProcessingMiss = true;
    this.lastMissTimePerf = nowPerf;
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

    // Al fallar, las estrellas y medallas alcanzadas no disminuyen
    this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, this.currentMedalTier, scorePct, accuracyPct);

    if (!this.continueMode && !this.isCalibrating && this.beatmapData) {
      const penaltyCost = Math.pow(2, this.missCount);
      this.missCount++;
      this.pause();
      if (this.ui.onMissPenalty) {
        this.ui.onMissPenalty(penaltyCost, this.missCount);
      }
    }
  }

  /**
   * Judgements rendered in upper screen area (below HUD) to prevent blocking incoming notes
   */
  addJudgement(text, color) {
    this.judgements.push({
      text: text,
      color: color,
      y: this.height * 0.20,
      alpha: 1.0,
      scale: 1.25,
      decay: 2.0
    });
  }

  update(dt) {
    if (this.isPaused || this.isRewinding) return;

    if (this.sync && this.sync.audioElement && this.sync.isPlaying) {
      if (Math.abs(this.sync.audioElement.playbackRate - this.songPlaybackRate) > 0.01) {
        try {
          this.sync.audioElement.playbackRate = this.songPlaybackRate;
          this.sync.audioElement.defaultPlaybackRate = this.songPlaybackRate;
        } catch (e) {}
      }
    }

    if (this.isCalibrating) {
      const now = performance.now();
      const currentCalibTime = (now - this.calibrationStartTime) + this.latencyOffsetMs;
      const interval = this.calibrationIntervalMs || 1200;

      if (now >= this.nextCalibNoteTime) {
        const targetHitTime = currentCalibTime + this.scrollDurationMs;
        const audioCtx = this.synth.ensureContext();
        const delaySec = Math.max(0, (this.scrollDurationMs - this.latencyOffsetMs) / 1000);
        if (audioCtx) this.synth.playPianoChime(audioCtx.currentTime + delaySec);

        this.notes.push({
          id: Date.now() + Math.random(),
          lane: 1,
          type: 'tap',
          timestamp_ms: targetHitTime,
          hit: false,
          missed: false,
          flashed: false
        });

        this.nextCalibNoteTime = now + interval;
      }

      for (const note of this.notes) {
        if (!note.flashed && currentCalibTime >= note.timestamp_ms) {
          note.flashed = true;
          const hitX = (1 + 0.5) * this.laneWidth;
          // Only pulse lane glow — full effect fires on player tap to avoid double animation
          this.laneGlows[1] = 1.0;

          if (this.ui && this.ui.onMetronomeBeat) {
            this.ui.onMetronomeBeat();
          }
        }
      }

      if (this.notes.length > 25) {
        this.notes = this.notes.filter(n => (currentCalibTime - n.timestamp_ms) < 1500);
      }

      this.updateVisualEffects(dt);
      return;
    }

    const currentTime = this.sync.getCurrentTimeMs() + this.latencyOffsetMs;
    const nowPerf = performance.now();
    const canTriggerMiss = !this.isProcessingMiss && (nowPerf - this.lastMissTimePerf >= 750);

    // Calculate exact time offset when notes physically exit the bottom of the canvas:
    // y = hitLineY + ((currentTime - note.timestamp_ms) / scrollDurationMs) * hitLineY
    // When y >= height + 40 -> note has fallen off the bottom of the screen!
    const exitScreenOffsetMs = Math.max(220, (((this.height - this.hitLineY) + 40) / Math.max(1, this.hitLineY)) * this.scrollDurationMs);

    for (const note of this.notes) {
      if (!note.hit && !note.missed && !note.holding && !note.processed && !note.holdCompleted) {
        if (currentTime - note.timestamp_ms >= exitScreenOffsetMs) {
          note.missed = true;
          note.processed = true;

          if (currentTime > this.invulnerableUntil && canTriggerMiss) {
            this.synth.playPunchyArcadeMiss();
            this.addJudgement('MISS', '#ff4d4d');
            this.handleMiss();
            break;
          } else {
            // Still reset combo and record stats if in continue mode or cooldown
            this.combo = 0;
            this.multiplier = 1;
            this.streakCount = 0;
            this.stats.miss++;

            const maxScore = Math.max(1, this.maxPossibleScore || 1);
            const scorePct = Math.min(100.0, (this.score / maxScore) * 100);

            const totalJudged = (this.stats.perfectPlus || 0) + (this.stats.perfect || 0) + (this.stats.great || 0) + (this.stats.good || 0) + (this.stats.miss || 0);
            const accuracyPct = totalJudged > 0
              ? Math.min(100.0, Math.max(0.0, (((this.stats.perfectPlus * 100) + (this.stats.perfect * 80) + (this.stats.great * 50) + ((this.stats.good || 0) * 25)) / (totalJudged * 100)) * 100))
              : 100.0;

            if (this.ui && this.ui.onScoreUpdate) {
              this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, this.currentMedalTier, scorePct, accuracyPct);
            }
          }
        }
      }
    }

    for (const [lane, active] of this.activeHolds.entries()) {
      const note = active.note;
      const endT = note.end_timestamp_ms || (note.timestamp_ms + (note.duration_ms || 700));
      const hitX = (lane + 0.5) * this.laneWidth;
      const holdColor = active.color || '#00ff88';
      
      this.particles.emitHoldSpark(hitX, this.hitLineY, holdColor);
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
        this.emitKeyHit(hitX, this.hitLineY, holdColor, 35);
        this.addJudgement('HOLD CLEAR!', holdColor);
      }
    }

    this.updateVisualEffects(dt);

    if (this.beatmapData && this.notes.length > 0 && !this.isGameOver) {
      const lastNoteTime = Math.max(...this.notes.map(n => n.end_timestamp_ms || n.timestamp_ms));
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

    // Claves (Clefs) - Reducidas 10 VECES (1 a 5 claves base + bonos de 1 a 3):
    const diffStars = this.beatmapData.metadata?.stars || 3.0;
    let diffMultiplier = diffStars < 3.0 ? 1 : (diffStars < 6.0 ? 1.2 : 1.5);

    const scoreRatio = Math.min(1.0, Math.max(0.0, this.score / maxScore));
    const performanceFactor = Math.pow(scoreRatio, 1.4) * (accuracyPct / 100);
    // Escala base: 1 a 5 claves
    const baseScoreClefs = Math.max(1, Math.round(5 * performanceFactor));
    const scoreClefs = Math.max(1, Math.round(baseScoreClefs * diffMultiplier));

    // Bonos de medallas reducidos 10 veces: Platino +3, Oro +2, Plata +1
    const medalBonus = (earnedMedals.platinum * 3) + (earnedMedals.gold * 2) + (earnedMedals.silver * 1);
    const earnedClefs = scoreClefs + medalBonus;

    if (this.ui && this.ui.onGameEnd) {
      this.ui.onGameEnd(this.score, this.maxCombo, this.stars, this.stats, earnedClefs, finalMedal, scorePct, earnedMedals, totalNotes, accuracyPct);
    }
  }

  updateVisualEffects(dt) {
    for (let l = 0; l < 3; l++) {
      this.laneGlows[l] = Math.max(0, (this.laneGlows[l] || 0) - dt * 4.0);
    }

    for (let i = this.judgements.length - 1; i >= 0; i--) {
      const j = this.judgements[i];
      j.alpha -= j.decay * dt;
      j.y -= 15 * dt;
      j.scale = Math.max(1.0, j.scale - dt * 1.2);
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
      b.radius += (b.maxRadius - b.radius) * 5.5 * dt;
      if (b.rotation !== undefined) {
        b.rotation += (b.rotSpeed || 0) * dt;
      }
      if (b.progress !== undefined) {
        b.progress = Math.min(1.0, b.progress + dt * 2.2);
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

    this.particles.update(dt);
  }

  /**
   * Canvas Background & Key FX:
   * Fondo negro absoluto sin parpadeos pasivos.
   * Efectos visuales divertidos, originales y que inundan toda la pantalla ÚNICAMENTE al pulsar teclas.
   */
  renderBackgroundFX(currentTime) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!w || !h) return;

    // 1. Fondo negro base inmersivo y sólido (Cero parpadeos si no se tocan teclas)
    ctx.fillStyle = '#06040a';
    ctx.fillRect(0, 0, w, h);

    // 1b. Fondo estático personalizado (si el usuario eligió modo estático)
    if (this.customBgMode === 'static' && this.customBgMedia) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.05, Math.min(0.9, this.customBgOpacity || 0.40));
      this.drawCoverMedia(ctx, this.customBgMedia, w, h);
      ctx.restore();
    }

    const hexToRgba = (hex, alpha) => {
      const a = Math.max(0, Math.min(1, alpha));
      if (typeof hex === 'string' && hex.startsWith('#')) {
        const c = hex.slice(1);
        const r = parseInt(c.substring(0, 2), 16) || 255;
        const g = parseInt(c.substring(2, 4), 16) || 0;
        const b = parseInt(c.substring(4, 6), 16) || 128;
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
      }
      return `rgba(0, 242, 254, ${a.toFixed(3)})`;
    };

    // 2. Full Focus Vignette Ambient Flash (Bordes y esquinas brillantes a pantalla completa)
    if (this.vignetteAlpha > 0.01) {
      const vGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.82);
      vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vGrad.addColorStop(0.60, hexToRgba(this.vignetteColor || '#00f2fe', this.vignetteAlpha * 0.35));
      vGrad.addColorStop(1, hexToRgba(this.vignetteColor || '#00f2fe', this.vignetteAlpha * 0.72));
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, w, h);
    }

    const effect = this.activeEffect || 'default_neon';
    const isReactiveActive = this.customBgMode === 'reactive' && !!this.customBgMedia;
    if (!isReactiveActive && (effect === 'default_neon' || this.bgBursts.length === 0)) {
      return;
    }

    try {

      // ====================================================
      // 1. CHORROS DE PINTURA (Graffiti & Manchas de Acuarela por toda la pantalla)
      // ====================================================
      if (effect === 'paint_splash') {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (const b of this.bgBursts) {
          if (b.alpha <= 0.01) continue;

          // A. Expansión de halo de acuarela en el fondo
          const washRadius = b.radius * 1.4;
          const washGrad = ctx.createRadialGradient(b.x, b.y, 5, b.x, b.y, washRadius);
          washGrad.addColorStop(0, hexToRgba(b.color1, b.alpha * 0.28));
          washGrad.addColorStop(0.5, hexToRgba(b.color2, b.alpha * 0.14));
          washGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = washGrad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, washRadius, 0, Math.PI * 2);
          ctx.fill();

          // B. Manchas orgánicas de pintura y estelas de gotas disparadas
          if (b.blotches) {
            for (const blotch of b.blotches) {
              const progress = 1 - (b.alpha / 0.9);
              const curDist = blotch.dist + (blotch.maxDist - blotch.dist) * progress;
              const bx = b.x + Math.cos(blotch.angle) * curDist;
              const by = b.y + Math.sin(blotch.angle) * curDist;
              const curR = blotch.radius * (0.4 + b.alpha * 0.6);

              // 1. Estela conectora fluida
              ctx.strokeStyle = hexToRgba(blotch.color, b.alpha * 0.16);
              ctx.lineWidth = Math.max(1, curR * 0.3);
              ctx.beginPath();
              ctx.moveTo(b.x, b.y);
              ctx.quadraticCurveTo((b.x + bx) / 2 + Math.sin(blotch.angle) * 20, (b.y + by) / 2, bx, by);
              ctx.stroke();

              // 2. Mancha principal
              ctx.fillStyle = hexToRgba(blotch.color, b.alpha * 0.30);
              ctx.beginPath();
              ctx.arc(bx, by, curR, 0, Math.PI * 2);
              ctx.fill();

              // 3. Gotas satélite
              if (blotch.subDrops) {
                for (const sd of blotch.subDrops) {
                  ctx.fillStyle = hexToRgba(blotch.color, b.alpha * 0.26);
                  ctx.beginPath();
                  ctx.arc(bx + sd.dx, by + sd.dy, sd.r * (0.5 + b.alpha * 0.5), 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
          }
        }
        ctx.restore();
        return;
      }

      // ====================================================
      // 2. MODO FUEGO / INFIERNO (Cintas de Fuego Serpentino y Vórtice de Magma)
      // ====================================================
      if (effect === 'fire_inferno') {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (const b of this.bgBursts) {
          if (b.alpha <= 0.01) continue;

          // A. Resplandor térmico suave que inunda la pantalla al toque
          const heatRadius = b.radius * 1.5;
          const heatGrad = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, heatRadius);
          heatGrad.addColorStop(0, hexToRgba('#ff8800', b.alpha * 0.28));
          heatGrad.addColorStop(0.5, hexToRgba('#ff2200', b.alpha * 0.14));
          heatGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = heatGrad;
          ctx.fillRect(0, 0, w, h);

          // B. Llamaradas serpentinas ascendentes
          if (b.flames) {
            for (const fl of b.flames) {
              const wave = Math.sin((1 - b.alpha) * 8 + fl.phase) * fl.curveOffsetX;
              const midX = (b.x + fl.targetX) / 2 + wave;
              const midY = (b.y + 0) / 2;

              const flGrad = ctx.createLinearGradient(b.x, b.y, fl.targetX, 0);
              flGrad.addColorStop(0, hexToRgba('#ffffff', b.alpha * 0.38));
              flGrad.addColorStop(0.35, hexToRgba(fl.color, b.alpha * 0.28));
              flGrad.addColorStop(0.75, hexToRgba('#ff0033', b.alpha * 0.16));
              flGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

              ctx.strokeStyle = flGrad;
              ctx.lineWidth = fl.width * (0.4 + b.alpha * 0.6);
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(b.x, b.y);
              ctx.quadraticCurveTo(midX, midY, fl.targetX, 0);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
        return;
      }

      // ====================================================
      // 3. EXPLOSIONES DE COLOR NEÓN (Rayos Supernova y Ondas Celestiales)
      // ====================================================
      if (effect === 'color_burst') {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (const b of this.bgBursts) {
          if (b.alpha <= 0.01) continue;

          // A. Ondas concéntricas de distorsión neón
          const warpRadius = b.radius * 1.5;
          const warpGrad = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, warpRadius);
          warpGrad.addColorStop(0, hexToRgba(b.color1, b.alpha * 0.30));
          warpGrad.addColorStop(0.45, hexToRgba(b.color2, b.alpha * 0.16));
          warpGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = warpGrad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, warpRadius, 0, Math.PI * 2);
          ctx.fill();

          // B. Rayos Supernova giratorios por toda la pantalla
          if (b.rays) {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.rotation || 0);

            for (const ray of b.rays) {
              const curLen = ray.len * (0.6 + (1 - b.alpha) * 0.8);
              const rayGrad = ctx.createLinearGradient(0, 0, Math.cos(ray.angle) * curLen, Math.sin(ray.angle) * curLen);
              rayGrad.addColorStop(0, hexToRgba('#ffffff', b.alpha * 0.35));
              rayGrad.addColorStop(0.4, hexToRgba(ray.color, b.alpha * 0.26));
              rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

              ctx.strokeStyle = rayGrad;
              ctx.lineWidth = ray.width * (0.5 + b.alpha * 0.5);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(ray.angle) * curLen, Math.sin(ray.angle) * curLen);
              ctx.stroke();
            }
            ctx.restore();
          }
        }
        ctx.restore();
        return;
      }

      // ====================================================
      // 4. FONDO REACTIVO: ILUMINACIÓN ADITIVA DINÁMICA (MÁS TECLAS = MÁS LUZ)
      // ====================================================
      if (this.customBgMode === 'reactive' && this.customBgMedia) {
        const hasBursts = this.bgBursts.some(b => b.type === 'reactive_reveal' && b.alpha > 0.01);
        const hasHolds = this.activeHolds.size > 0;
        const hasBoost = (this.reactiveLightBoost || 0) > 0.01;

        if (hasBursts || hasHolds || hasBoost) {
          if (!this.spotlightCanvas || this.spotlightCanvas.width !== w || this.spotlightCanvas.height !== h) {
            this.spotlightCanvas = document.createElement('canvas');
            this.spotlightCanvas.width = w;
            this.spotlightCanvas.height = h;
            this.spotlightCtx = this.spotlightCanvas.getContext('2d');
          }
          const sCtx = this.spotlightCtx;
          sCtx.clearRect(0, 0, w, h);

          // PASO 1: Dibujar todas las fuentes de luz en la máscara usando 'lighter' (ADITIVO: más teclas = más luz, NUNCA se queda negro!)
          sCtx.save();
          sCtx.globalCompositeOperation = 'lighter';

          // A. Resplandor ambiental reactivo acumulado por ráfagas de notas
          if (hasBoost) {
            const ambGrad = sCtx.createRadialGradient(w / 2, this.hitLineY, 20, w / 2, this.hitLineY, Math.max(w, h));
            const boostA = Math.min(0.70, (this.reactiveLightBoost || 0) * 0.70);
            ambGrad.addColorStop(0, `rgba(255, 255, 255, ${boostA.toFixed(3)})`);
            ambGrad.addColorStop(0.5, `rgba(255, 255, 255, ${(boostA * 0.45).toFixed(3)})`);
            ambGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            sCtx.fillStyle = ambGrad;
            sCtx.fillRect(0, 0, w, h);
          }

          // B. Cada onda expansiva de cada tecla pulsada suma luz
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

          // C. Cada nota mantenida (hold) añade un haz de luz continuo
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

          // PASO 2: Recortar la imagen o vídeo con la máscara de luz sumada (source-in)
          sCtx.save();
          sCtx.globalCompositeOperation = 'source-in';
          this.drawCoverMedia(sCtx, this.customBgMedia, w, h);
          sCtx.restore();

          // PASO 3: Dibujar la escena iluminada sobre el fondo negro base
          ctx.save();
          ctx.drawImage(this.spotlightCanvas, 0, 0);

          // PASO 4: Halo de onda expansiva perimetral con el color exacto del juicio (Perfect+, Perfect, Great, Good)
          ctx.globalCompositeOperation = 'screen';
          for (const b of this.bgBursts) {
            if (b.type !== 'reactive_reveal' || b.alpha <= 0.01) continue;
            const rad = Math.max(15, b.radius);
            const rimCol = b.color || '#00f2fe';
            const rim = ctx.createRadialGradient(b.x, b.y, Math.max(0, rad - 35), b.x, b.y, rad);
            rim.addColorStop(0, 'rgba(0, 0, 0, 0)');
            rim.addColorStop(0.65, hexToRgba(rimCol, b.alpha * 0.45));
            rim.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = rim;
            ctx.beginPath();
            ctx.arc(b.x, b.y, rad, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        return;
      }
    } catch (fxErr) {
      console.warn('Background FX warning:', fxErr);
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const currentTime = this.isCalibrating 
      ? (performance.now() - this.calibrationStartTime) + this.latencyOffsetMs
      : this.sync.getCurrentTimeMs() + this.latencyOffsetMs;

    this.renderBackgroundFX(currentTime);
    this.renderLanes();
    this.renderNotes(currentTime);
    this.particles.render(this.ctx);
    this.renderHitLine();
    this.renderJudgements();
  }

  renderLanes() {
    const ctx = this.ctx;

    for (let l = 0; l < 3; l++) {
      const x0 = l * this.laneWidth;

      const isHolding = this.activeHolds.has(l);
      if (isHolding) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 255, 136, 0.22)';
        ctx.fillRect(x0, 0, this.laneWidth, this.height);
        ctx.restore();
      } else if (this.laneGlows[l] > 0) {
        ctx.save();
        ctx.fillStyle = `#00f2fe${Math.round(this.laneGlows[l] * 50).toString(16).padStart(2, '0')}`;
        ctx.fillRect(x0, 0, this.laneWidth, this.height);
        ctx.restore();
      }

      if (l > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0, this.height);
        ctx.stroke();
      }
    }
  }

  renderHitLine() {
    const ctx = this.ctx;
    const y = this.hitLineY;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 16;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(this.width, y);
    ctx.stroke();

    const baseRadius = 28;
    const pressedRadius = 33;
    const holdingRadius = 36;
    const ringRadius = 42;

    for (let l = 0; l < 3; l++) {
      const cx = (l + 0.5) * this.laneWidth;
      const isHolding = this.activeHolds.has(l);
      const isPressed = this.laneGlows[l] > 0.4 || isHolding;

      ctx.beginPath();
      ctx.arc(cx, y, isHolding ? holdingRadius : (isPressed ? pressedRadius : baseRadius), 0, Math.PI * 2);
      ctx.fillStyle = isHolding 
        ? 'rgba(0, 255, 136, 0.45)' 
        : (isPressed ? 'rgba(0, 242, 254, 0.35)' : 'rgba(255, 255, 255, 0.08)');
      ctx.fill();
      ctx.strokeStyle = isHolding ? '#00ff88' : (isPressed ? '#00f2fe' : 'rgba(255, 255, 255, 0.3)');
      ctx.lineWidth = isHolding ? 4 : (isPressed ? 3 : 2);
      ctx.stroke();

      if (isHolding) {
        const active = this.activeHolds.get(l);
        const startT = active.startTime;
        const endT = active.note.end_timestamp_ms || (startT + (active.note.duration_ms || 700));
        const currT = this.sync.getCurrentTimeMs() + this.latencyOffsetMs;
        const progress = Math.min(1.0, Math.max(0, (currT - startT) / (endT - startT)));

        ctx.beginPath();
        ctx.arc(cx, y, ringRadius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }

      if (this.isPCMode) {
        const kb = this.pcKeybinds || { 0: 'd', 1: 'f', 2: 'j' };
        const keyChar = ((kb[l] || (l === 0 ? 'd' : (l === 1 ? 'f' : 'j'))).toUpperCase());
        ctx.save();
        ctx.font = '900 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isPressed ? '#00f2fe' : 'rgba(255, 255, 255, 0.60)';
        ctx.shadowColor = isPressed ? '#00f2fe' : 'transparent';
        ctx.shadowBlur = isPressed ? 10 : 0;
        ctx.fillText(`[ ${keyChar} ]`, cx, y + 44);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  renderVectorChevron(ctx, x, y, direction, size = 32, strokeColor = '#ffffff') {
    ctx.save();
    ctx.translate(x, y);

    let angle = 0;
    if (direction === 'down') angle = Math.PI;
    else if (direction === 'left') angle = -Math.PI / 2;
    else if (direction === 'right') angle = Math.PI / 2;

    ctx.rotate(angle);

    const w = size * 1.35;
    const h = size * 0.70;
    const thickness = size * 0.38;

    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, thickness);
    ctx.lineTo(0, -h + thickness);
    ctx.lineTo(-w, thickness);
    ctx.lineTo(-w, 0);
    ctx.closePath();

    ctx.fillStyle = strokeColor;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -h + thickness * 1.3);
    ctx.lineTo(w * 0.75, thickness * 1.3);
    ctx.lineTo(w * 0.75, thickness * 1.9);
    ctx.lineTo(0, -h + thickness * 1.9);
    ctx.lineTo(-w * 0.75, thickness * 1.9);
    ctx.lineTo(-w * 0.75, thickness * 1.3);
    ctx.closePath();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();

    ctx.restore();
  }

  renderNotes(currentTime) {
    const ctx = this.ctx;
    const len = this.notes.length;
    const hitLine = Number.isFinite(this.hitLineY) ? this.hitLineY : 500;
    const scrollDur = (Number.isFinite(this.scrollDurationMs) && this.scrollDurationMs > 0) ? this.scrollDurationMs : 1400;
    const laneW = (Number.isFinite(this.laneWidth) && this.laneWidth > 0) ? this.laneWidth : (this.width / 3);

    for (let i = 0; i < len; i++) {
      const note = this.notes[i];
      if (!note || note.holdCompleted) continue;
      if (note.hit && note.type !== 'hold') continue;
      if (note.missed && !note.holding) continue;
      if (note.processed && !note.holding) continue;

      // Sanitización matemática estricta de carril y tiempo de la nota
      const lane = Number.isFinite(note.lane)
        ? Math.max(0, Math.min(2, Math.round(note.lane)))
        : (Number.isFinite(note.column) ? Math.max(0, Math.min(2, Math.round(note.column))) : 0);

      const noteT = Number.isFinite(note.timestamp_ms)
        ? note.timestamp_ms
        : (Number.isFinite(note.timeMs)
            ? note.timeMs
            : (Number.isFinite(note.time) ? (note.time > 100 ? note.time : note.time * 1000) : 0));

      if (!Number.isFinite(noteT)) continue;

      const isBeingHeld = Boolean(note.holding && !note.holdCompleted);
      const timeUntilHit = noteT - currentTime;
      if (!Number.isFinite(timeUntilHit)) continue;

      const x = (lane + 0.5) * laneW;
      const w = laneW * 0.78;
      const h = 28;

      if (!Number.isFinite(x) || !Number.isFinite(w) || w <= 0) continue;

      if (note.type === 'hold') {
        const rawDur = Number.isFinite(note.duration_ms)
          ? note.duration_ms
          : (Number.isFinite(note.holdDuration)
              ? (note.holdDuration > 50 ? note.holdDuration : note.holdDuration * 1000)
              : (Number.isFinite(note.duration) ? (note.duration > 50 ? note.duration : note.duration * 1000) : 700));
        const holdDuration = Math.max(150, Number.isFinite(rawDur) ? rawDur : 700);
        const fullTailLength = (holdDuration / scrollDur) * hitLine;
        const endT = Number.isFinite(note.end_timestamp_ms) ? note.end_timestamp_ms : (noteT + holdDuration);
        
        let headY = hitLine - (timeUntilHit / scrollDur) * hitLine;
        let tailLength = fullTailLength;

        if (isBeingHeld) {
          headY = hitLine;
          const remainingMs = Math.max(0, endT - currentTime);
          tailLength = (remainingMs / scrollDur) * hitLine;
        }

        const endY = headY - tailLength;
        if (!Number.isFinite(headY) || !Number.isFinite(endY) || !Number.isFinite(tailLength)) continue;
        if (endY > this.height + 100 || headY < -300) continue;

        ctx.save();
        let grad = null;
        if (Number.isFinite(endY) && Number.isFinite(headY)) {
          try {
            grad = ctx.createLinearGradient(0, endY, 0, headY);
            if (isBeingHeld) {
              grad.addColorStop(0, 'rgba(0, 255, 136, 0.25)');
              grad.addColorStop(1, 'rgba(0, 255, 136, 0.95)');
            } else {
              grad.addColorStop(0, 'rgba(240, 147, 251, 0.2)');
              grad.addColorStop(1, 'rgba(245, 87, 108, 0.85)');
            }
          } catch (e) {
            grad = null;
          }
        }

        ctx.fillStyle = grad || (isBeingHeld ? 'rgba(0, 255, 136, 0.85)' : 'rgba(245, 87, 108, 0.85)');
        ctx.fillRect(x - w * 0.4, endY, w * 0.8, tailLength);
        
        ctx.strokeStyle = isBeingHeld ? '#00ff88' : '#f5576c';
        ctx.lineWidth = isBeingHeld ? 3.5 : 2.5;
        ctx.strokeRect(x - w * 0.4, endY, w * 0.8, tailLength);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - w * 0.45, endY - 4, w * 0.9, 8);

        ctx.fillStyle = isBeingHeld ? '#00ff88' : '#ffffff';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x - w / 2, headY - h / 2, w, h, 12);
        } else {
          ctx.rect(x - w / 2, headY - h / 2, w, h);
        }
        ctx.fill();
        ctx.restore();

      } else if (note.type === 'swipe') {
        const giantW = laneW * 0.92;
        const giantH = 58;
        const y = hitLine - (timeUntilHit / scrollDur) * hitLine;
        if (!Number.isFinite(y) || y < -300 || y > this.height + 60) continue;

        ctx.save();
        const dir = note.direction || 'up';
        
        let grad1 = '#00f2fe';
        let grad2 = '#0066ff';

        if (dir === 'up') {
          grad1 = '#ffd700';
          grad2 = '#ff007f';
        } else if (dir === 'down') {
          grad1 = '#00ff88';
          grad2 = '#00b4d8';
        }
        
        const x0 = x - giantW / 2;
        const x1 = x + giantW / 2;
        let grad = null;
        if (Number.isFinite(x0) && Number.isFinite(x1) && Number.isFinite(y)) {
          try {
            grad = ctx.createLinearGradient(x0, y, x1, y);
            grad.addColorStop(0, grad1);
            grad.addColorStop(1, grad2);
          } catch (e) {
            grad = null;
          }
        }
        ctx.fillStyle = grad || grad1;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x - giantW / 2, y - giantH / 2, giantW, giantH, 18);
        } else {
          ctx.rect(x - giantW / 2, y - giantH / 2, giantW, giantH);
        }
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.0;
        ctx.stroke();

        this.renderVectorChevron(ctx, x, y, dir, 28, '#ffffff');
        ctx.restore();

      } else {
        const y = hitLine - (timeUntilHit / scrollDur) * hitLine;
        if (!Number.isFinite(y) || y < -300 || y > this.height + 60) continue;

        ctx.save();
        const x0 = x - w / 2;
        const x1 = x + w / 2;
        let grad = null;
        if (Number.isFinite(x0) && Number.isFinite(x1) && Number.isFinite(y)) {
          try {
            grad = ctx.createLinearGradient(x0, y, x1, y);
            grad.addColorStop(0, '#00f2fe');
            grad.addColorStop(1, '#4facfe');
          } catch (e) {
            grad = null;
          }
        }
        ctx.fillStyle = grad || '#00f2fe';

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x - w / 2, y - h / 2, w, h, 12);
        } else {
          ctx.rect(x - w / 2, y - h / 2, w, h);
        }
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x - w / 4, y - h / 4, w / 2, h / 2, 6);
        } else {
          ctx.rect(x - w / 4, y - h / 4, w / 2, h / 2);
        }
        ctx.fill();
        ctx.restore();
      }
    }
  }

  renderJudgements() {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const len = this.judgements.length;
    for (let i = 0; i < len; i++) {
      const j = this.judgements[i];
      ctx.globalAlpha = Math.max(0, j.alpha);
      ctx.font = `900 ${23 * j.scale}px Outfit, sans-serif`;
      
      // High-contrast clean text outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = 4;
      ctx.strokeText(j.text, this.width / 2, j.y);

      ctx.fillStyle = j.color;
      ctx.fillText(j.text, this.width / 2, j.y);
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
      // Uncapped high-refresh-rate delta calculation (60Hz, 90Hz, 120Hz, 144Hz)
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      try {
        this.update(dt);
        this.render();
      } catch (err) {
        console.error('Error inside render loop:', err);
      }

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  onAudioReady() {
    console.log("Audio track ready and buffered.");
  }

  onAudioEnded() {
    console.log("Audio track finished.");
    if (!this.isGameOver && this.beatmapData) {
      setTimeout(() => {
        this.triggerGameEnd();
      }, 400);
    }
  }

  onAudioError(msg) {
    console.warn("Audio sync error notification:", msg);
  }
}

window.BeatstarEngine = BeatstarEngine;
window.DirectAudioSync = DirectAudioSync;
window.ParticleSystem = ParticleSystem;
window.HighFidelityAudioPlayer = HighFidelityAudioPlayer;
