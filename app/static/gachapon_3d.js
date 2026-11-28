/**
 * ============================================================================
 * HYPER-OPTIMIZED 3D LAS VEGAS VINTAGE GACHAPON MACHINE (THREE.JS PBR)
 * - Shared Capsule Geometries & Materials (Zero Geometry Duplication)
 * - InstancedMesh 32-Bulb Las Vegas Marquee Light Ring (1 Draw Call)
 * - InstancedMesh 72-Shard Crystal Burst + Dual 3D Shockwave Rings (3 Draw Calls)
 * - Animated 3D Brass Coin Insert + Art Deco Engraved Escutcheon
 * - Pre-Baked Rotating Sunburst Caustic Stage + Floating Golden Dust Motes
 * - Interactive Tap-to-Shake Glass Globe + Drag/Tap 3D Side Lever
 * - Rarity-Scaled Anticipation Cinematography & Web Audio Synthesizer
 * ============================================================================
 */

(function () {
  'use strict';

  const RARITY_TIERS = {
    classic: {
      id: 'classic',
      label: 'CLÁSICO',
      shellHex: 0x0284c7,
      glowHex: 0x38bdf8,
      accentHex: 0xbae6fd,
      cssColor: '#38bdf8',
      badgeBg: 'linear-gradient(135deg, #0369a1, #38bdf8)',
      badgeText: '#ffffff'
    },
    rare: {
      id: 'rare',
      label: 'RARO',
      shellHex: 0x059669,
      glowHex: 0x34d399,
      accentHex: 0xa7f3d0,
      cssColor: '#34d399',
      badgeBg: 'linear-gradient(135deg, #047857, #34d399)',
      badgeText: '#022c22'
    },
    epic: {
      id: 'epic',
      label: 'ÉPICO',
      shellHex: 0x9333ea,
      glowHex: 0xe879f9,
      accentHex: 0xf5d0fe,
      cssColor: '#e879f9',
      badgeBg: 'linear-gradient(135deg, #7e22ce, #ec4899)',
      badgeText: '#ffffff'
    },
    legendary: {
      id: 'legendary',
      label: 'LEGENDARIO',
      shellHex: 0xd97706,
      glowHex: 0xfde047,
      accentHex: 0xfef9c3,
      cssColor: '#fde047',
      badgeBg: 'linear-gradient(135deg, #f59e0b, #fef08a, #d97706)',
      badgeText: '#1c1917'
    },
    transcendent: {
      id: 'transcendent',
      label: 'TRASCENDENTAL',
      shellHex: 0x150830,
      glowHex: 0x00f2fe,
      accentHex: 0xfde047,
      cssColor: '#00f2fe',
      badgeBg: 'linear-gradient(135deg, #00f2fe 0%, #a855f7 38%, #ff007f 72%, #fde047 100%)',
      badgeText: '#ffffff'
    }
  };

  const CAPSULE_PALETTE = [
    0xdc2626, // Ruby Crimson
    0x2563eb, // Royal Sapphire
    0x059669, // Imperial Emerald
    0xd97706, // Vegas Amber Gold
    0x9333ea, // Royal Amethyst
    0xdb2777, // Velvet Rose
    0x0891b2  // Deep Lagoon Cyan
  ];

  // ==========================================================================
  // PROCEDURAL WEB AUDIO MECHANICAL, COIN & PRIZE SYNTHESIZER
  // ==========================================================================
  class GachaponSoundEngine {
    constructor() {
      this.ctx = null;
    }

    _ensureCtx() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    isMuted() {
      return localStorage.getItem('beatstar_master_muted') === 'true';
    }

    getVol() {
      if (this.isMuted()) return 0;
      const v = parseFloat(localStorage.getItem('beatstar_master_volume') ?? '1.0');
      return isNaN(v) ? 1.0 : Math.max(0, Math.min(1, v));
    }

    playCoinInsert() {
      const ctx = this._ensureCtx();
      const vol = this.getVol();
      if (!ctx || vol <= 0) return;
      const now = ctx.currentTime;

      const freqs = [2489.02, 3322.44];
      freqs.forEach((f, idx) => {
        const t = now + idx * 0.055;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 0.96, t + 0.16);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.16 * vol, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.20);
      });
    }

    playLeverPull() {
      const ctx = this._ensureCtx();
      const vol = this.getVol();
      if (!ctx || vol <= 0) return;

      this.playCoinInsert();

      const clicks = [0.09, 0.145, 0.20, 0.26, 0.33, 0.41, 0.50];
      clicks.forEach((delay, idx) => {
        const t = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(185 + idx * 28, t);
        osc.frequency.exponentialRampToValueAtTime(64, t + 0.038);
        gain.gain.setValueAtTime(0.22 * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.044);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.05);
      });
    }

    playCapsuleumble() {
      const ctx = this._ensureCtx();
      const vol = this.getVol();
      if (!ctx || vol <= 0) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(560 + Math.random() * 260, t);
      osc.frequency.exponentialRampToValueAtTime(170, t + 0.032);
      gain.gain.setValueAtTime(0.10 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.036);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    }

    playGlassShake() {
      const ctx = this._ensureCtx();
      const vol = this.getVol();
      if (!ctx || vol <= 0) return;
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.048 + Math.random() * 0.015;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(640 + Math.random() * 380, t);
        osc.frequency.exponentialRampToValueAtTime(210, t + 0.035);
        gain.gain.setValueAtTime((0.11 - i * 0.018) * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.045);
      }
    }

    playChuteDropBounce() {
      const ctx = this._ensureCtx();
      const vol = this.getVol();
      if (!ctx || vol <= 0) return;

      const hits = [
        { d: 0.0, f: 340, a: 0.26 },
        { d: 0.16, f: 440, a: 0.21 },
        { d: 0.30, f: 280, a: 0.30 },
        { d: 0.56, f: 680, a: 0.14 }
      ];
      hits.forEach((h) => {
        const t = ctx.currentTime + h.d;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(h.f, t);
        osc.frequency.exponentialRampToValueAtTime(75, t + 0.075);
        gain.gain.setValueAtTime(h.a * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.09);
      });
    }

    playRarityRiser(rarity = 'classic') {
      const ctx = this._ensureCtx();
      const vol = this.getVol();
      if (!ctx || vol <= 0) return;
      const now = ctx.currentTime;
      const dur = rarity === 'transcendent' ? 0.82 : (rarity === 'legendary' ? 0.68 : 0.55);
      const startF = rarity === 'transcendent' ? 240 : (rarity === 'legendary' ? 280 : 320);
      const endF = rarity === 'transcendent' ? 1240 : (rarity === 'legendary' ? 1020 : 760);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = rarity === 'transcendent' || rarity === 'legendary' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(startF, now);
      osc.frequency.exponentialRampToValueAtTime(endF, now + dur);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14 * vol, now + dur * 0.72);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    }

    playCapsuleOpenFanfare(rarity = 'classic') {
      const ctx = this._ensureCtx();
      const vol = this.getVol();
      if (!ctx || vol <= 0) return;
      const now = ctx.currentTime;

      // Crisp cork-pop transient
      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(300, now);
      popOsc.frequency.exponentialRampToValueAtTime(1260, now + 0.06);
      popGain.gain.setValueAtTime(0.30 * vol, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      popOsc.connect(popGain);
      popGain.connect(ctx.destination);
      popOsc.start(now);
      popOsc.stop(now + 0.08);

      // Warm sub-bass impact bloom for epic+ tiers
      if (rarity === 'epic' || rarity === 'legendary' || rarity === 'transcendent') {
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(130, now);
        sub.frequency.exponentialRampToValueAtTime(48, now + 0.34);
        subGain.gain.setValueAtTime(0.28 * vol, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 0.38);
      }

      const chords = {
        classic: [523.25, 659.25, 783.99, 1046.50],
        rare: [587.33, 739.99, 880.00, 1174.66, 1479.98],
        epic: [523.25, 659.25, 783.99, 987.77, 1318.51, 1567.98],
        legendary: [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00],
        transcendent: [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98, 1975.53, 2349.32, 2637.02]
      };
      const notes = chords[rarity] || chords.classic;
      notes.forEach((freq, i) => {
        const t = now + 0.035 + i * (rarity === 'transcendent' ? 0.042 : 0.052);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = rarity === 'transcendent'
          ? (i % 3 === 0 ? 'sawtooth' : 'triangle')
          : (i % 2 === 0 ? 'triangle' : 'sine');
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime((rarity === 'transcendent' ? 0.22 : 0.19) * vol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + (rarity === 'transcendent' ? 1.05 : 0.72));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + (rarity === 'transcendent' ? 1.08 : 0.75));
      });
    }
  }

  // ==========================================================================
  // MAIN 3D LAS VEGAS VINTAGE GACHAPON ENGINE
  // ==========================================================================
  class VintageGachapon3D {
    constructor(canvas, callbacks = {}) {
      this.canvas = canvas;
      this.callbacks = callbacks;
      this.sfx = new GachaponSoundEngine();

      this.isRunning = false;
      this.rafId = null;
      this.clock = typeof THREE !== 'undefined' ? new THREE.Clock() : null;

      // States: IDLE | LEVER_PULL | BALL_DROP_CHUTE | CAPSULE_PRESENT | CAPSULE_BURST_OPEN
      this.state = 'IDLE';
      this.stateTimer = 0;
      this._wakeTimer = 0;
      this._globeShakeTimer = 0;
      this._cameraShakeTimer = 0;
      this._cameraShakeMag = 0;
      this.pendingReward = null;

      this.globeCenter = typeof THREE !== 'undefined' ? new THREE.Vector3(0, 1.55, 0) : null;
      this.globeRadius = 1.48;
      this.capsuleRadius = 0.245;
      this.capsules = [];

      // Reusable zero-allocation scratch objects
      if (typeof THREE !== 'undefined') {
        this._scratchDummy = new THREE.Object3D();
        this._scratchColor = new THREE.Color();
        this._scratchColorAlt = new THREE.Color();
        this._scratchVec = new THREE.Vector3();
      }

      // Drag/Tap interaction state for the 3D lever
      this.isDraggingLever = false;
      this.dragStartY = 0;
      this.leverPullProgress = 0;

      if (typeof THREE !== 'undefined') {
        try {
          this._initThreeScene();
          if (this.renderer) {
            this._buildMaterials();
            this._buildMachineGeometry();
            this._buildMarqueeLights();
            this._buildStageAmbience();
            this._buildAnimatedCoinRig();
            this._populateCapsules(28);
            this._buildDispensingCapsuleRig();
            this._buildBurstSystem();
            this._bindPointerInteraction();
          }
        } catch (err) {
          console.warn('[Gachapon3D] WebGL fallback:', err);
          this.renderer = null;
        }
      }
    }

    _initThreeScene() {
      this.scene = new THREE.Scene();

      const w = this.canvas.clientWidth || window.innerWidth || 380;
      const h = this.canvas.clientHeight || window.innerHeight || 680;

      this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
      this.baseCamPos = new THREE.Vector3(0.12, 0.26, 9.6);
      this.baseLookAt = new THREE.Vector3(0.08, 0.12, 0);
      this.currentCamPos = this.baseCamPos.clone();
      this.currentLookAt = this.baseLookAt.clone();
      this.targetCamPos = this.baseCamPos.clone();
      this.targetLookAt = this.baseLookAt.clone();

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: false,
        alpha: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h, false);
      // Skip expensive shadow map render pass; stage contact shadow & starburst caustic are pre-baked
      this.renderer.shadowMap.enabled = false;
      if ('outputColorSpace' in this.renderer) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      } else if ('outputEncoding' in this.renderer) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.06;

      // Rich Las Vegas 4-Point Studio Lighting
      const ambient = new THREE.AmbientLight(0xfff1e6, 0.42);
      this.scene.add(ambient);

      const hemi = new THREE.HemisphereLight(0xfffbeb, 0x220810, 0.50);
      hemi.position.set(0, 8, 0);
      this.scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.60);
      keyLight.position.set(4.5, 6.8, 6.5);
      this.scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.44);
      fillLight.position.set(-5.5, 2.2, 3.2);
      this.scene.add(fillLight);

      const rimLight = new THREE.SpotLight(0xfbbf24, 1.45, 18, Math.PI * 0.36, 0.55);
      rimLight.position.set(0, 5.8, -5.0);
      this.scene.add(rimLight);

      // Warm internal uplight illuminating the jewel-toned capsules inside the glass globe
      this.globeInnerLight = new THREE.PointLight(0xffd27d, 0.85, 4.2);
      this.globeInnerLight.position.set(0, 0.82, 0.45);
      this.scene.add(this.globeInnerLight);

      // Dynamic prize spotlight during levitation & reveal
      this.prizeLight = new THREE.PointLight(0xfde047, 0, 6.5);
      this.prizeLight.position.set(0, -0.05, 3.8);
      this.scene.add(this.prizeLight);

      this.machineRoot = new THREE.Group();
      this.scene.add(this.machineRoot);
    }

    _createEnvTexture() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 128;
      const ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0.0, '#fffbeb');
      g.addColorStop(0.18, '#94a3b8');
      g.addColorStop(0.46, '#1e1b2e');
      g.addColorStop(0.54, '#090612');
      g.addColorStop(0.78, '#d97706');
      g.addColorStop(1.0, '#451a03');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 128);

      // Warm Vegas marquee softbox strips
      ctx.fillStyle = 'rgba(255, 251, 235, 0.94)';
      ctx.fillRect(28, 12, 52, 22);
      ctx.fillStyle = 'rgba(253, 224, 71, 0.86)';
      ctx.fillRect(156, 16, 56, 18);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fillRect(98, 22, 34, 14);

      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      return tex;
    }

    _createGlassGlobeReflectionTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d');

      ctx.fillStyle = 'rgba(224, 242, 254, 0.11)';
      ctx.fillRect(0, 0, 512, 256);

      // Left curved studio window specular ribbon
      const hl1 = ctx.createLinearGradient(180, 18, 238, 224);
      hl1.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
      hl1.addColorStop(0.32, 'rgba(255, 255, 255, 0.92)');
      hl1.addColorStop(0.68, 'rgba(224, 242, 254, 0.62)');
      hl1.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = hl1;
      ctx.beginPath();
      ctx.ellipse(206, 110, 15, 78, -0.18, 0, Math.PI * 2);
      ctx.fill();

      // Secondary warm Las Vegas rim bounce highlight on right
      const hl2 = ctx.createLinearGradient(300, 90, 326, 200);
      hl2.addColorStop(0.0, 'rgba(254, 240, 138, 0)');
      hl2.addColorStop(0.45, 'rgba(254, 240, 138, 0.52)');
      hl2.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = hl2;
      ctx.beginPath();
      ctx.ellipse(314, 144, 10, 48, 0.16, 0, Math.PI * 2);
      ctx.fill();

      // Tiny crisp top specular catchlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.beginPath();
      ctx.ellipse(234, 58, 12, 5, -0.25, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    _createBrassPlateTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d');

      // Brushed vintage Art Deco brass plate
      const bg = ctx.createLinearGradient(0, 0, 512, 256);
      bg.addColorStop(0.0, '#78350f');
      bg.addColorStop(0.24, '#d97706');
      bg.addColorStop(0.50, '#fef08a');
      bg.addColorStop(0.76, '#b45309');
      bg.addColorStop(1.0, '#451a03');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 512, 256);

      // Outer gilded frame
      ctx.strokeStyle = '#fef9c3';
      ctx.lineWidth = 8;
      ctx.strokeRect(12, 12, 488, 232);

      // Deep lacquered obsidian-mahogany plaque inset
      const inset = ctx.createRadialGradient(256, 128, 18, 256, 128, 245);
      inset.addColorStop(0.0, '#2c1008');
      inset.addColorStop(1.0, '#120503');
      ctx.fillStyle = inset;
      ctx.fillRect(24, 24, 464, 208);

      // Inner Art Deco hairline border
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(34, 34, 444, 188);

      // Art Deco corner diamond rivets
      const rivets = [
        [48, 48], [464, 48], [48, 208], [464, 208]
      ];
      ctx.fillStyle = '#fde047';
      rivets.forEach(([rx, ry]) => {
        ctx.beginPath();
        ctx.moveTo(rx, ry - 9);
        ctx.lineTo(rx + 9, ry);
        ctx.lineTo(rx, ry + 9);
        ctx.lineTo(rx - 9, ry);
        ctx.closePath();
        ctx.fill();
      });

      // Decorative Art Deco horizontal rules flanking subtitle
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(64, 148);
      ctx.lineTo(448, 148);
      ctx.stroke();

      // Main engraved price typography (clean serif, zero emojis)
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 68px "Cinzel", Georgia, serif';
      ctx.fillText('100 CLAVES', 256, 98);

      ctx.fillStyle = '#fde68a';
      ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TIRA DE LA PALANCA', 256, 184);

      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    _createStageSunburstTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      const mid = 256;

      // Soft warm golden Art Deco sunburst rays
      ctx.save();
      ctx.translate(mid, mid);
      for (let i = 0; i < 24; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 24);
        const rg = ctx.createLinearGradient(0, 0, 240, 0);
        rg.addColorStop(0.0, 'rgba(251, 191, 36, 0.30)');
        rg.addColorStop(0.55, 'rgba(217, 119, 6, 0.14)');
        rg.addColorStop(1.0, 'rgba(217, 119, 6, 0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(240, -14);
        ctx.lineTo(240, 14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Fine engraved brass compass rings
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.34)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(mid, mid, 206, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mid, mid, 178, 0, Math.PI * 2);
      ctx.stroke();

      // Grounded soft contact shadow under the cast-iron machine foot
      const sh = ctx.createRadialGradient(mid, mid, 40, mid, mid, 192);
      sh.addColorStop(0.0, 'rgba(0, 0, 0, 0.84)');
      sh.addColorStop(0.66, 'rgba(0, 0, 0, 0.48)');
      sh.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sh;
      ctx.beginPath();
      ctx.arc(mid, mid, 192, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    _createSoftGlowDotTexture() {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      const rg = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
      rg.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
      rg.addColorStop(0.32, 'rgba(253, 224, 71, 0.78)');
      rg.addColorStop(0.68, 'rgba(245, 158, 11, 0.26)');
      rg.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    _buildMaterials() {
      const envMap = this._createEnvTexture();
      this.envMap = envMap;

      // Rich Vintage Candy-Apple Crimson Lacquer
      this.crimsonMat = new THREE.MeshPhysicalMaterial({
        color: 0x991b1b,
        emissive: 0x240406,
        emissiveIntensity: 0.38,
        metalness: 0.18,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMap,
        envMapIntensity: 0.78
      });

      // Polished Mirror Chrome
      this.chromeMat = new THREE.MeshPhysicalMaterial({
        color: 0xe2e8f0,
        metalness: 0.92,
        roughness: 0.09,
        clearcoat: 0.65,
        envMap,
        envMapIntensity: 1.35
      });

      // Warm Las Vegas Gold / Brass
      this.brassMat = new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        emissive: 0x451a03,
        emissiveIntensity: 0.24,
        metalness: 0.86,
        roughness: 0.15,
        clearcoat: 0.55,
        envMap,
        envMapIntensity: 1.25
      });

      // Dark Obsidian Cast Iron
      this.castIronMat = new THREE.MeshStandardMaterial({
        color: 0x16141a,
        metalness: 0.74,
        roughness: 0.32,
        envMap,
        envMapIntensity: 0.55
      });

      // Crystal-Clear Blown Glass Globe
      const globeTex = this._createGlassGlobeReflectionTexture();
      this.glassGlobeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: globeTex,
        transparent: true,
        opacity: 0.23,
        roughness: 0.025,
        metalness: 0.06,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMap,
        envMapIntensity: 1.5,
        depthWrite: false
      });

      // Opaque High-Gloss Pearl Ivory Top Shell for Capsules
      this.capsulePearlTopMat = new THREE.MeshPhysicalMaterial({
        color: 0xfffbeb,
        metalness: 0.10,
        roughness: 0.11,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        envMap,
        envMapIntensity: 1.05
      });

      // Pre-build 7 Shared Capsule Color Materials & 3 Shared Capsule Geometries (Zero Duplication!)
      const r = this.capsuleRadius;
      this._capBotGeo = new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      this._capTopGeo = new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      this._capSeamGeo = new THREE.TorusGeometry(r * 0.995, 0.016, 8, 22);

      this._capsuleColorMats = CAPSULE_PALETTE.map((hex) => new THREE.MeshPhysicalMaterial({
        color: hex,
        metalness: 0.16,
        roughness: 0.11,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        envMap,
        envMapIntensity: 1.15
      }));
    }

    _buildMachineGeometry() {
      // 1. CIRCULAR LAS VEGAS STAGE PEDESTAL
      const stageBase = new THREE.Mesh(
        new THREE.CylinderGeometry(2.26, 2.48, 0.24, 48),
        this.castIronMat
      );
      stageBase.position.y = -2.28;
      this.machineRoot.add(stageBase);

      const stageBrassTrim = new THREE.Mesh(
        new THREE.TorusGeometry(2.30, 0.044, 14, 64),
        this.brassMat
      );
      stageBrassTrim.rotation.x = Math.PI / 2;
      stageBrassTrim.position.y = -2.16;
      this.machineRoot.add(stageBrassTrim);

      const stageLowerTrim = new THREE.Mesh(
        new THREE.TorusGeometry(2.47, 0.032, 12, 64),
        this.brassMat
      );
      stageLowerTrim.rotation.x = Math.PI / 2;
      stageLowerTrim.position.y = -2.38;
      this.machineRoot.add(stageLowerTrim);

      // 2. LOWER CAST-IRON FOOT & FLARED CRIMSON SKIRT
      const ironFoot = new THREE.Mesh(
        new THREE.CylinderGeometry(1.42, 1.66, 0.32, 48),
        this.castIronMat
      );
      ironFoot.position.y = -1.98;
      this.machineRoot.add(ironFoot);

      const footBrassBead = new THREE.Mesh(
        new THREE.TorusGeometry(1.43, 0.032, 12, 48),
        this.brassMat
      );
      footBrassBead.rotation.x = Math.PI / 2;
      footBrassBead.position.y = -1.82;
      this.machineRoot.add(footBrassBead);

      const lowerSkirt = new THREE.Mesh(
        new THREE.CylinderGeometry(1.10, 1.42, 0.84, 48),
        this.crimsonMat
      );
      lowerSkirt.position.y = -1.42;
      this.machineRoot.add(lowerSkirt);

      // Brass Waist Ring at y = -1.00
      const waistBelt = new THREE.Mesh(
        new THREE.TorusGeometry(1.11, 0.052, 16, 48),
        this.brassMat
      );
      waistBelt.rotation.x = Math.PI / 2;
      waistBelt.position.y = -1.00;
      this.machineRoot.add(waistBelt);

      // 3. UPPER TAPERED CRIMSON HOPPER BODY
      const upperBody = new THREE.Mesh(
        new THREE.CylinderGeometry(1.32, 1.10, 1.26, 48),
        this.crimsonMat
      );
      upperBody.position.y = -0.37;
      this.machineRoot.add(upperBody);

      // Vertical Art Deco Brass Flutes framing the hopper sides
      const fluteGeo = new THREE.CylinderGeometry(0.026, 0.022, 1.16, 10);
      const fluteAngles = [-1.05, -0.72, 0.72, 1.05, Math.PI - 0.5, Math.PI + 0.5];
      for (let i = 0; i < fluteAngles.length; i++) {
        const ang = fluteAngles[i];
        const flute = new THREE.Mesh(fluteGeo, this.brassMat);
        flute.position.set(Math.sin(ang) * 1.21, -0.37, Math.cos(ang) * 1.21);
        flute.rotation.z = -Math.sin(ang) * 0.16;
        flute.rotation.x = Math.cos(ang) * 0.16;
        this.machineRoot.add(flute);
      }

      // 4. CHROME COLLAR RING CRADLING THE GLOBE
      const collarCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(1.36, 1.32, 0.24, 48),
        this.chromeMat
      );
      collarCyl.position.y = 0.28;
      this.machineRoot.add(collarCyl);

      const collarRim = new THREE.Mesh(
        new THREE.TorusGeometry(1.36, 0.056, 16, 48),
        this.chromeMat
      );
      collarRim.rotation.x = Math.PI / 2;
      collarRim.position.y = 0.38;
      this.machineRoot.add(collarRim);

      const collarBrassAccent = new THREE.Mesh(
        new THREE.TorusGeometry(1.34, 0.028, 12, 48),
        this.brassMat
      );
      collarBrassAccent.rotation.x = Math.PI / 2;
      collarBrassAccent.position.y = 0.17;
      this.machineRoot.add(collarBrassAccent);

      const funnelFloor = new THREE.Mesh(
        new THREE.CylinderGeometry(1.24, 0.92, 0.14, 40),
        this.chromeMat
      );
      funnelFloor.position.y = 0.34;
      this.machineRoot.add(funnelFloor);

      // 5. AGITATOR PADDLE WHEEL & CENTER ROD INSIDE GLOBE
      this.agitatorGroup = new THREE.Group();
      this.agitatorGroup.position.set(0, 0.44, 0);
      this.machineRoot.add(this.agitatorGroup);

      const agitatorHub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.36, 0.14, 24),
        this.brassMat
      );
      this.agitatorGroup.add(agitatorHub);

      const bladeGeo = new THREE.BoxGeometry(1.52, 0.07, 0.09);
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(bladeGeo, this.brassMat);
        blade.rotation.y = (i * Math.PI) / 2;
        blade.position.y = 0.04;
        this.agitatorGroup.add(blade);
      }

      const centerPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 2.52, 18),
        this.chromeMat
      );
      centerPost.position.set(0, 1.68, 0);
      this.machineRoot.add(centerPost);

      // 6. SPHERICAL GLASS GLOBE + CONCENTRIC SPHERICAL TOP CROWN LID
      this.globeGroup = new THREE.Group();
      this.globeGroup.position.copy(this.globeCenter);
      this.machineRoot.add(this.globeGroup);

      this.glassSphereMesh = new THREE.Mesh(
        new THREE.SphereGeometry(this.globeRadius, 44, 32),
        this.glassGlobeMat
      );
      this.glassSphereMesh.renderOrder = 3;
      this.globeGroup.add(this.glassSphereMesh);

      // Concentric Top Crown Cap (Zero Gap)
      const crownCapMesh = new THREE.Mesh(
        new THREE.SphereGeometry(this.globeRadius + 0.02, 44, 18, 0, Math.PI * 2, 0, 0.52),
        this.crimsonMat
      );
      crownCapMesh.renderOrder = 4;
      this.globeGroup.add(crownCapMesh);

      const crownRimRadius = (this.globeRadius + 0.02) * Math.sin(0.52);
      const crownRimY = (this.globeRadius + 0.02) * Math.cos(0.52);
      const crownRim = new THREE.Mesh(
        new THREE.TorusGeometry(crownRimRadius, 0.048, 14, 48),
        this.chromeMat
      );
      crownRim.rotation.x = Math.PI / 2;
      crownRim.position.y = crownRimY;
      this.globeGroup.add(crownRim);

      const crownGoldBand = new THREE.Mesh(
        new THREE.TorusGeometry(crownRimRadius * 0.94, 0.024, 10, 48),
        this.brassMat
      );
      crownGoldBand.rotation.x = Math.PI / 2;
      crownGoldBand.position.y = crownRimY + 0.04;
      this.globeGroup.add(crownGoldBand);

      const finialBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.24, 0.11, 24),
        this.chromeMat
      );
      finialBase.position.y = this.globeRadius + 0.04;
      this.globeGroup.add(finialBase);

      const finialRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.16, 0.026, 10, 24),
        this.brassMat
      );
      finialRing.rotation.x = Math.PI / 2;
      finialRing.position.y = this.globeRadius + 0.10;
      this.globeGroup.add(finialRing);

      const finialKnob = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 24, 24),
        this.brassMat
      );
      finialKnob.position.y = this.globeRadius + 0.20;
      this.globeGroup.add(finialKnob);

      // 8. CONCENTRIC CURVED FRONT ESCUTCHEON PLATE ("100 CLAVES / TIRA DE LA PALANCA")
      const bezelShell = new THREE.Mesh(
        new THREE.CylinderGeometry(1.273 + 0.032, 1.179 + 0.032, 0.56, 36, 1, true, -0.39, 0.78),
        this.chromeMat
      );
      bezelShell.position.set(0, -0.37, 0);
      this.machineRoot.add(bezelShell);

      const plateTexture = this._createBrassPlateTexture();
      const curvedPlateMat = new THREE.MeshBasicMaterial({
        map: plateTexture,
        side: THREE.FrontSide
      });
      const curvedPlateMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.273 + 0.046, 1.179 + 0.046, 0.48, 36, 1, true, -0.35, 0.70),
        curvedPlateMat
      );
      curvedPlateMesh.position.set(0, -0.37, 0);
      this.machineRoot.add(curvedPlateMesh);

      // 3D Brass Coin Slot Housing above the front plate
      const coinSlotHousing = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.12, 0.10),
        this.brassMat
      );
      coinSlotHousing.position.set(0, -0.02, 1.31);
      coinSlotHousing.rotation.x = -0.16;
      this.machineRoot.add(coinSlotHousing);

      const coinSlotSlit = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.085, 0.115),
        this.castIronMat
      );
      coinSlotSlit.position.set(0, -0.02, 1.315);
      coinSlotSlit.rotation.x = -0.16;
      this.machineRoot.add(coinSlotSlit);

      // 9. COHESIVE 3D CHROME DISPENSER ALCOVE & HINGED FLAP DOOR
      const chuteGroup = new THREE.Group();
      chuteGroup.position.set(0, -1.42, 1.28);
      this.machineRoot.add(chuteGroup);

      const chuteHousingTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.12, 0.34),
        this.chromeMat
      );
      chuteHousingTop.position.set(0, 0.24, 0);
      chuteGroup.add(chuteHousingTop);

      const chuteHousingLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.56, 0.34),
        this.chromeMat
      );
      chuteHousingLeft.position.set(-0.305, 0, 0);
      chuteGroup.add(chuteHousingLeft);

      const chuteHousingRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.56, 0.34),
        this.chromeMat
      );
      chuteHousingRight.position.set(0.305, 0, 0);
      chuteGroup.add(chuteHousingRight);

      const chuteDarkRecess = new THREE.Mesh(
        new THREE.BoxGeometry(0.50, 0.48, 0.06),
        this.castIronMat
      );
      chuteDarkRecess.position.set(0, -0.02, -0.08);
      chuteGroup.add(chuteDarkRecess);

      // Hinged Chrome Chute Flap Door
      this.chuteFlapPivot = new THREE.Group();
      this.chuteFlapPivot.position.set(0, -1.21, 1.44);
      this.machineRoot.add(this.chuteFlapPivot);

      const chuteFlap = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.25, 0.032),
        this.chromeMat
      );
      chuteFlap.position.set(0, -0.125, 0);
      this.chuteFlapPivot.add(chuteFlap);

      const flapEmblem = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.03, 0.042),
        this.brassMat
      );
      flapEmblem.position.set(0, -0.18, 0.005);
      this.chuteFlapPivot.add(flapEmblem);

      // Curved Chrome & Brass Collection Tray
      const trayGroup = new THREE.Group();
      trayGroup.position.set(0, -1.75, 1.55);
      this.machineRoot.add(trayGroup);

      const trayFloor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 0.42, 0.12, 32),
        this.chromeMat
      );
      trayGroup.add(trayFloor);

      const trayLip = new THREE.Mesh(
        new THREE.TorusGeometry(0.47, 0.052, 14, 32, Math.PI * 1.15),
        this.brassMat
      );
      trayLip.rotation.x = Math.PI / 2;
      trayLip.rotation.z = -Math.PI * 0.075;
      trayLip.position.y = 0.06;
      trayGroup.add(trayLip);

      // 10. SIDE-MOUNTED 3D LEVER WITH OUTWARD AXLE (ZERO MACHINE COLLISION)
      this.leverGroup = new THREE.Group();
      this.leverGroup.position.set(1.16, -0.44, 0.08);
      this.machineRoot.add(this.leverGroup);

      const leverMountBox = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.28, 0.34, 24),
        this.chromeMat
      );
      leverMountBox.rotation.z = Math.PI / 2;
      leverMountBox.position.set(0.08, 0, 0);
      this.leverGroup.add(leverMountBox);

      const leverBrassRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.036, 12, 24),
        this.brassMat
      );
      leverBrassRing.rotation.y = Math.PI / 2;
      leverBrassRing.position.set(0.25, 0, 0);
      this.leverGroup.add(leverBrassRing);

      const outwardAxle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.56, 20),
        this.chromeMat
      );
      outwardAxle.rotation.z = Math.PI / 2;
      outwardAxle.position.set(0.36, 0, 0);
      this.leverGroup.add(outwardAxle);

      this.leverPivot = new THREE.Group();
      this.leverPivot.position.set(0.56, 0, 0);
      this.leverGroup.add(this.leverPivot);

      const outerHub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.145, 0.145, 0.16, 24),
        this.brassMat
      );
      outerHub.rotation.z = Math.PI / 2;
      this.leverPivot.add(outerHub);

      const leverArmGroup = new THREE.Group();
      leverArmGroup.rotation.z = -0.05;
      this.leverPivot.add(leverArmGroup);

      const leverShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.075, 1.12, 20),
        this.chromeMat
      );
      leverShaft.position.set(0, 0.54, 0);
      leverArmGroup.add(leverShaft);

      const knobCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.105, 0.068, 0.12, 20),
        this.brassMat
      );
      knobCollar.position.set(0, 1.08, 0);
      leverArmGroup.add(knobCollar);

      this.leverKnobMat = new THREE.MeshPhysicalMaterial({
        color: 0xdc2626,
        emissive: 0x991b1b,
        emissiveIntensity: 0.42,
        metalness: 0.18,
        roughness: 0.08,
        clearcoat: 1.0,
        envMap: this.envMap,
        envMapIntensity: 1.35
      });

      this.leverKnobMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.245, 28, 28),
        this.leverKnobMat
      );
      this.leverKnobMesh.position.set(0, 1.26, 0);
      leverArmGroup.add(this.leverKnobMesh);

      // Subtle glowing brass halo ring around the lever knob in IDLE to invite pulling
      this.leverPulseRingMat = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.42
      });
      this.leverPulseRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.30, 0.015, 8, 28),
        this.leverPulseRingMat
      );
      this.leverPulseRing.position.set(0, 1.26, 0);
      leverArmGroup.add(this.leverPulseRing);

      this.leverInteractables = [
        this.leverKnobMesh,
        leverShaft,
        knobCollar,
        outerHub,
        outwardAxle,
        leverMountBox
      ];
    }

    // 32 Las Vegas Chasing Marquee Bulbs rendered in a SINGLE InstancedMesh draw call!
    _buildMarqueeLights() {
      const bulbCount = 32;
      this._marqueeCount = bulbCount;
      const bulbGeo = new THREE.SphereGeometry(0.052, 10, 8);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      this.marqueeInstanced = new THREE.InstancedMesh(bulbGeo, bulbMat, bulbCount);
      this.marqueeInstanced.instanceMatrix.setUsage(THREE.StaticDrawUsage);

      const dummy = this._scratchDummy;
      const col = this._scratchColor;
      col.setHex(0xfde047);

      // 16 bulbs around the globe chrome collar (y = 0.28, r = 1.40)
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        dummy.position.set(Math.cos(ang) * 1.40, 0.28, Math.sin(ang) * 1.40);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        this.marqueeInstanced.setMatrixAt(i, dummy.matrix);
        this.marqueeInstanced.setColorAt(i, col);
      }

      // 16 bulbs around the circular stage pedestal (y = -2.14, r = 2.34)
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2 + Math.PI / 16;
        dummy.position.set(Math.cos(ang) * 2.34, -2.14, Math.sin(ang) * 2.34);
        dummy.scale.set(1.12, 1.12, 1.12);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        this.marqueeInstanced.setMatrixAt(16 + i, dummy.matrix);
        this.marqueeInstanced.setColorAt(16 + i, col);
      }

      this.marqueeInstanced.instanceMatrix.needsUpdate = true;
      if (this.marqueeInstanced.instanceColor) {
        this.marqueeInstanced.instanceColor.needsUpdate = true;
      }
      this.machineRoot.add(this.marqueeInstanced);
    }

    _updateMarqueeLights(nowSec) {
      if (!this.marqueeInstanced) return;
      const col = this._scratchColor;
      const alt = this._scratchColorAlt;
      const rarity = (this.pendingReward && this.pendingReward.rarity) || 'classic';
      const tier = RARITY_TIERS[rarity] || RARITY_TIERS.classic;

      const isActivePull = this.state === 'LEVER_PULL' || this.state === 'BALL_DROP_CHUTE';
      const isReveal = this.state === 'CAPSULE_PRESENT' || this.state === 'CAPSULE_BURST_OPEN';

      const speed = isActivePull ? 14.0 : (isReveal ? 11.0 : 4.2);

      for (let i = 0; i < this._marqueeCount; i++) {
        const ringIdx = i % 16;
        const phase = ringIdx * 0.785 - nowSec * speed;
        const wave = 0.5 + 0.5 * Math.sin(phase);

        if (isReveal && rarity === 'transcendent') {
          const hue = ((ringIdx / 16) + nowSec * 0.65) % 1.0;
          col.setHSL(hue, 0.92, 0.55 + wave * 0.35);
        } else if (isReveal) {
          col.setHex(tier.glowHex);
          alt.setHex(0xffffff);
          col.lerp(alt, wave * 0.65);
          col.multiplyScalar(0.55 + wave * 0.55);
        } else if (isActivePull) {
          col.setHex(i % 2 === 0 ? 0xfde047 : 0xff4d6d);
          col.multiplyScalar(0.45 + wave * 0.75);
        } else {
          // Warm Las Vegas golden chase
          col.setHex(0xf59e0b);
          alt.setHex(0xfffbeb);
          col.lerp(alt, wave * 0.85);
          col.multiplyScalar(0.42 + wave * 0.68);
        }
        this.marqueeInstanced.setColorAt(i, col);
      }
      if (this.marqueeInstanced.instanceColor) {
        this.marqueeInstanced.instanceColor.needsUpdate = true;
      }
    }

    // Rotating Art Deco Sunburst Stage Disc + Floating Golden Dust Motes (2 Draw Calls Total)
    _buildStageAmbience() {
      const sunTex = this._createStageSunburstTexture();
      const sunMat = new THREE.MeshBasicMaterial({
        map: sunTex,
        transparent: true,
        opacity: 0.92,
        depthWrite: false
      });
      this.stageSunburstMesh = new THREE.Mesh(
        new THREE.CircleGeometry(2.24, 48),
        sunMat
      );
      this.stageSunburstMesh.rotation.x = -Math.PI / 2;
      this.stageSunburstMesh.position.y = -2.154;
      this.machineRoot.add(this.stageSunburstMesh);

      // 40 Floating Golden Dust Motes in 1 THREE.Points Draw Call
      const moteCount = 40;
      const positions = new Float32Array(moteCount * 3);
      this._moteSeeds = new Float32Array(moteCount * 3);
      for (let i = 0; i < moteCount; i++) {
        const ang = (i / moteCount) * Math.PI * 2 + Math.random() * 0.4;
        const rad = 1.9 + Math.random() * 1.45;
        const y = -2.0 + Math.random() * 5.2;
        positions[i * 3] = Math.cos(ang) * rad;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(ang) * rad * 0.75;
        this._moteSeeds[i * 3] = ang;
        this._moteSeeds[i * 3 + 1] = rad;
        this._moteSeeds[i * 3 + 2] = 0.22 + Math.random() * 0.35;
      }
      const moteGeo = new THREE.BufferGeometry();
      moteGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const moteMat = new THREE.PointsMaterial({
        map: this._createSoftGlowDotTexture(),
        color: 0xfde68a,
        size: 0.17,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.dustMotes = new THREE.Points(moteGeo, moteMat);
      this.scene.add(this.dustMotes);
    }

    _updateDustMotes(dt) {
      if (!this.dustMotes) return;
      const attr = this.dustMotes.geometry.attributes.position;
      const arr = attr.array;
      const swirlMult = (this.state === 'LEVER_PULL' || this.state === 'CAPSULE_PRESENT') ? 3.2 : 1.0;
      const riseMult = (this.state === 'CAPSULE_BURST_OPEN') ? 2.4 : 1.0;
      const count = arr.length / 3;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        this._moteSeeds[idx] += dt * (0.18 + (i % 5) * 0.04) * swirlMult;
        const ang = this._moteSeeds[idx];
        const rad = this._moteSeeds[idx + 1];
        let y = arr[idx + 1] + dt * this._moteSeeds[idx + 2] * riseMult;
        if (y > 3.4) y = -2.1;
        arr[idx] = Math.cos(ang) * rad;
        arr[idx + 1] = y;
        arr[idx + 2] = Math.sin(ang) * rad * 0.75;
      }
      attr.needsUpdate = true;
    }

    // Animated 3D Gold Brass Coin that flips into the coin slot on Lever Pull
    _buildAnimatedCoinRig() {
      this.coinMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.115, 0.115, 0.024, 24),
        this.brassMat
      );
      this.coinMesh.visible = false;
      this.scene.add(this.coinMesh);
    }

    _createSingleCapsuleMesh(paletteIdx) {
      const group = new THREE.Group();

      const bottomHemisphere = new THREE.Mesh(
        this._capBotGeo,
        this._capsuleColorMats[paletteIdx % this._capsuleColorMats.length]
      );
      group.add(bottomHemisphere);

      const topHemisphere = new THREE.Mesh(
        this._capTopGeo,
        this.capsulePearlTopMat
      );
      group.add(topHemisphere);

      const seamBand = new THREE.Mesh(this._capSeamGeo, this.brassMat);
      seamBand.rotation.x = Math.PI / 2;
      group.add(seamBand);

      return group;
    }

    _populateCapsules(count = 28) {
      this.capsules.forEach((c) => this.scene.remove(c.mesh));
      this.capsules = [];

      for (let i = 0; i < count; i++) {
        const palIdx = i % CAPSULE_PALETTE.length;
        const colorHex = CAPSULE_PALETTE[palIdx];
        const mesh = this._createSingleCapsuleMesh(palIdx);

        const layer = Math.floor(i / 9);
        const idxInLayer = i % 9;
        const angle = idxInLayer * ((Math.PI * 2) / 9) + layer * 0.55;
        const rad = 0.44 + (idxInLayer % 3) * 0.24;

        const pos = new THREE.Vector3(
          Math.cos(angle) * rad,
          this.globeCenter.y - 0.72 + layer * 0.34,
          Math.sin(angle) * rad
        );

        mesh.position.copy(pos);
        mesh.rotation.set(
          (i * 0.42) % 0.9 - 0.45,
          i * 1.1,
          (i * 0.35) % 0.9 - 0.45
        );
        this.scene.add(mesh);

        this.capsules.push({
          mesh,
          colorHex,
          pos,
          restPos: pos.clone(),
          restRot: mesh.rotation.clone(),
          vel: new THREE.Vector3(0, 0, 0),
          angVel: new THREE.Vector3(0, 0, 0)
        });
      }

      for (let step = 0; step < 220; step++) {
        this._stepCapsulePhysics(1 / 60, false, true);
      }

      for (let i = 0; i < this.capsules.length; i++) {
        const c = this.capsules[i];
        c.vel.set(0, 0, 0);
        c.angVel.set(0, 0, 0);
        c.restPos.copy(c.pos);
        c.restRot.copy(c.mesh.rotation);
        c.mesh.position.copy(c.pos);
      }
    }

    _buildDispensingCapsuleRig() {
      this.activeCapsuleRig = new THREE.Group();
      this.activeCapsuleRig.visible = false;
      this.scene.add(this.activeCapsuleRig);

      const r = this.capsuleRadius * 1.15;

      this.activeBottomMat = new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0.26,
        roughness: 0.11,
        clearcoat: 1.0,
        envMap: this.envMap,
        envMapIntensity: 1.35
      });

      this.activeBottomHalf = new THREE.Group();
      const botShell = new THREE.Mesh(
        new THREE.SphereGeometry(r, 28, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        this.activeBottomMat
      );
      const botRim = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.025, 10, 28),
        this.brassMat
      );
      botRim.rotation.x = Math.PI / 2;
      this.activeBottomHalf.add(botShell, botRim);
      this.activeCapsuleRig.add(this.activeBottomHalf);

      this.activeTopHalf = new THREE.Group();
      const topShell = new THREE.Mesh(
        new THREE.SphereGeometry(r, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2),
        this.capsulePearlTopMat
      );
      const topRim = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.022, 10, 28),
        this.chromeMat
      );
      topRim.rotation.x = Math.PI / 2;
      this.activeTopHalf.add(topShell, topRim);
      this.activeCapsuleRig.add(this.activeTopHalf);

      // Rarity-Scaled 3D Gyroscopic Aura Rings (1 for classic/rare, 2 for epic/legendary, 3 for transcendent)
      this.auraHaloGroup = new THREE.Group();
      this.auraHaloGroup.visible = false;

      this.haloMat1 = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.90 });
      this.haloMat2 = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.85 });
      this.haloMat3 = new THREE.MeshBasicMaterial({ color: 0xff007f, transparent: true, opacity: 0.85 });

      this.haloRing1 = new THREE.Mesh(new THREE.TorusGeometry(r * 1.40, 0.015, 10, 42), this.haloMat1);
      this.haloRing2 = new THREE.Mesh(new THREE.TorusGeometry(r * 1.62, 0.013, 10, 42), this.haloMat2);
      this.haloRing2.rotation.x = Math.PI / 3;
      this.haloRing3 = new THREE.Mesh(new THREE.TorusGeometry(r * 1.84, 0.011, 10, 42), this.haloMat3);
      this.haloRing3.rotation.y = Math.PI / 3;

      this.auraHaloGroup.add(this.haloRing1, this.haloRing2, this.haloRing3);
      this.activeCapsuleRig.add(this.auraHaloGroup);
    }

    // 72 Crystal Burst Shards in a SINGLE InstancedMesh + 2 Expanding 3D Shockwave Rings (3 Draw Calls Total!)
    _buildBurstSystem() {
      this._burstCount = 72;
      const shardGeo = new THREE.OctahedronGeometry(0.056, 0);
      const shardMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.96,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      this.burstInstanced = new THREE.InstancedMesh(shardGeo, shardMat, this._burstCount);
      this.burstInstanced.visible = false;
      this.burstInstanced.frustumCulled = false;
      this.scene.add(this.burstInstanced);

      this._burstData = [];
      for (let i = 0; i < this._burstCount; i++) {
        this._burstData.push({
          pos: new THREE.Vector3(),
          vel: new THREE.Vector3(),
          rot: new THREE.Euler(),
          rotSpeed: new THREE.Vector3(),
          life: 0,
          maxLife: 1.0,
          baseScale: 1.0
        });
      }
      this._burstActive = false;

      // Dual Expanding 3D Shockwave Torus Rings
      this.shockwaveRings = [];
      for (let r = 0; r < 2; r++) {
        const mat = new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const mesh = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.022 - r * 0.006, 10, 40), mat);
        mesh.visible = false;
        this.scene.add(mesh);
        this.shockwaveRings.push({ mesh, mat, life: 0, maxLife: 0.58 + r * 0.18, delay: r * 0.09 });
      }
    }

    _triggerBurstParticles(origin, tier) {
      const colorHex = tier.glowHex || 0xfde047;
      const accentHex = tier.accentHex || 0xffffff;
      const isTrans = tier.id === 'transcendent';
      const isHigh = isTrans || tier.id === 'legendary' || tier.id === 'epic';

      this._burstActive = true;
      this.burstInstanced.visible = true;
      const col = this._scratchColor;
      const dummy = this._scratchDummy;
      const prismPalette = [0x00f2fe, 0xfde047, 0xff007f, 0xa855f7, 0x34d399, 0xffffff];

      for (let i = 0; i < this._burstCount; i++) {
        const p = this._burstData[i];
        p.pos.copy(origin);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = (isHigh ? 2.1 : 1.5) + Math.random() * (isHigh ? 4.1 : 3.0);
        p.vel.set(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed + 0.95,
          Math.cos(phi) * speed
        );
        p.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        p.rotSpeed.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
        p.life = 0;
        p.maxLife = 0.65 + Math.random() * 0.65;
        p.baseScale = 0.65 + Math.random() * 0.95;

        if (isTrans) {
          col.setHex(prismPalette[i % prismPalette.length]);
        } else {
          col.setHex(i % 4 === 0 ? 0xffffff : (i % 3 === 0 ? accentHex : colorHex));
        }
        this.burstInstanced.setColorAt(i, col);

        dummy.position.copy(p.pos);
        dummy.rotation.copy(p.rot);
        dummy.scale.setScalar(p.baseScale);
        dummy.updateMatrix();
        this.burstInstanced.setMatrixAt(i, dummy.matrix);
      }

      this.burstInstanced.instanceMatrix.needsUpdate = true;
      if (this.burstInstanced.instanceColor) {
        this.burstInstanced.instanceColor.needsUpdate = true;
      }

      // Trigger dual 3D shockwave rings
      for (let r = 0; r < this.shockwaveRings.length; r++) {
        const sw = this.shockwaveRings[r];
        sw.mesh.position.copy(origin);
        sw.mesh.rotation.set(r === 0 ? 0.12 : -0.35, r === 0 ? 0 : 0.42, 0);
        sw.mesh.scale.setScalar(0.35);
        sw.mat.color.setHex(r === 0 ? colorHex : accentHex);
        sw.mat.opacity = 0;
        sw.life = -sw.delay;
        sw.mesh.visible = true;
      }

      // Camera micro-shake on epic / legendary / transcendent reveals
      if (isHigh) {
        this._cameraShakeTimer = isTrans ? 0.42 : 0.28;
        this._cameraShakeMag = isTrans ? 0.16 : (tier.id === 'legendary' ? 0.12 : 0.08);
      }
    }

    _updateBurstSystem(dt) {
      if (this._burstActive && this.burstInstanced.visible) {
        const dummy = this._scratchDummy;
        let anyAlive = false;

        for (let i = 0; i < this._burstCount; i++) {
          const p = this._burstData[i];
          if (p.life >= p.maxLife) {
            dummy.scale.setScalar(0);
            dummy.updateMatrix();
            this.burstInstanced.setMatrixAt(i, dummy.matrix);
            continue;
          }
          p.life += dt;
          if (p.life >= p.maxLife) {
            dummy.scale.setScalar(0);
            dummy.updateMatrix();
            this.burstInstanced.setMatrixAt(i, dummy.matrix);
            continue;
          }
          anyAlive = true;
          p.vel.y -= 4.4 * dt;
          p.vel.multiplyScalar(0.985);
          p.pos.addScaledVector(p.vel, dt);
          p.rot.x += p.rotSpeed.x * dt;
          p.rot.y += p.rotSpeed.y * dt;
          p.rot.z += p.rotSpeed.z * dt;

          const remain = Math.max(0, 1 - p.life / p.maxLife);
          const sc = p.baseScale * Math.pow(remain, 0.72);
          dummy.position.copy(p.pos);
          dummy.rotation.copy(p.rot);
          dummy.scale.setScalar(sc);
          dummy.updateMatrix();
          this.burstInstanced.setMatrixAt(i, dummy.matrix);
        }

        this.burstInstanced.instanceMatrix.needsUpdate = true;
        if (!anyAlive) {
          this._burstActive = false;
          this.burstInstanced.visible = false;
        }
      }

      for (let r = 0; r < this.shockwaveRings.length; r++) {
        const sw = this.shockwaveRings[r];
        if (!sw.mesh.visible) continue;
        sw.life += dt;
        if (sw.life < 0) continue;
        const prog = sw.life / sw.maxLife;
        if (prog >= 1.0) {
          sw.mesh.visible = false;
          continue;
        }
        const ease = 1 - Math.pow(1 - prog, 2.4);
        sw.mesh.scale.setScalar(0.45 + ease * (4.6 + r * 1.4));
        sw.mat.opacity = (1 - prog) * (r === 0 ? 0.88 : 0.62);
      }
    }

    _bindPointerInteraction() {
      this.raycaster = new THREE.Raycaster();
      this.pointerNDC = new THREE.Vector2();

      const updateNDC = (clientX, clientY) => {
        const rect = this.canvas.getBoundingClientRect();
        this.pointerNDC.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
        this.pointerNDC.y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
      };

      const checkHitTarget = () => {
        this.raycaster.setFromCamera(this.pointerNDC, this.camera);
        const leverHits = this.raycaster.intersectObjects(this.leverInteractables, true);
        if (leverHits.length > 0) return 'lever';
        if (this.pointerNDC.x > 0.14 && this.pointerNDC.y > -0.60 && this.pointerNDC.y < 0.34) {
          return 'lever';
        }
        if (this.glassSphereMesh) {
          const globeHits = this.raycaster.intersectObject(this.glassSphereMesh, false);
          if (globeHits.length > 0) return 'globe';
        }
        return null;
      };

      this._onPointerDown = (e) => {
        if (this.state !== 'IDLE') return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        updateNDC(clientX, clientY);

        const target = checkHitTarget();
        if (target === 'lever') {
          this.isDraggingLever = true;
          this.dragStartY = clientY;
          this.leverPullProgress = 0.15;
        } else if (target === 'globe') {
          this.shakeGlobe(0.85);
        }
      };

      this._onPointerMove = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (this.isDraggingLever && this.state === 'IDLE') {
          const dy = clientY - this.dragStartY;
          this.leverPullProgress = Math.max(0.1, Math.min(1.0, 0.15 + dy / 90));
          this.leverPivot.rotation.x = this.leverPullProgress * 1.05;

          if (this.leverPullProgress >= 0.68) {
            this.isDraggingLever = false;
            this.leverPullProgress = 0;
            if (this.callbacks.onLeverPulled) {
              this.callbacks.onLeverPulled();
            }
          }
          return;
        }

        if (!e.touches && this.state === 'IDLE') {
          updateNDC(clientX, clientY);
          const target = checkHitTarget();
          this.canvas.style.cursor = target === 'lever' ? 'grab' : (target === 'globe' ? 'pointer' : 'default');
        }
      };

      this._onPointerUp = () => {
        if (!this.isDraggingLever) return;
        this.isDraggingLever = false;
        if (this.state === 'IDLE') {
          this.leverPullProgress = 0;
          if (this.callbacks.onLeverPulled) {
            this.callbacks.onLeverPulled();
          }
        }
      };

      this.canvas.addEventListener('mousedown', this._onPointerDown);
      window.addEventListener('mousemove', this._onPointerMove);
      window.addEventListener('mouseup', this._onPointerUp);

      this.canvas.addEventListener('touchstart', this._onPointerDown, { passive: true });
      window.addEventListener('touchmove', this._onPointerMove, { passive: true });
      window.addEventListener('touchend', this._onPointerUp, { passive: true });
    }

    shakeGlobe(intensity = 0.6) {
      if (this.state !== 'IDLE') return;
      this.sfx.playGlassShake();
      this._wakeTimer = 0.85;
      this._globeShakeTimer = 0.42;
      for (let i = 0; i < this.capsules.length; i++) {
        const c = this.capsules[i];
        c.vel.x += (Math.random() - 0.5) * 4.8 * intensity;
        c.vel.y += (0.55 + Math.random() * 1.7) * intensity;
        c.vel.z += (Math.random() - 0.5) * 4.8 * intensity;
      }
    }

    startVendingSequence(rewardData) {
      if (this.state !== 'IDLE' && this.state !== 'CAPSULE_BURST_OPEN') return;

      this.resetToIdle();
      this.pendingReward = rewardData || {
        rarity: 'classic',
        title: '+80 Claves de Sol',
        desc: 'Premio directo de la máquina expendedora.'
      };

      const rarity = this.pendingReward.rarity || 'classic';
      const tier = RARITY_TIERS[rarity] || RARITY_TIERS.classic;

      this.activeBottomMat.color.setHex(tier.shellHex);
      if (rarity === 'transcendent') {
        this.activeBottomMat.emissive.setHex(0x7e22ce);
        this.activeBottomMat.emissiveIntensity = 0.55;
      } else if (rarity === 'legendary') {
        this.activeBottomMat.emissive.setHex(0x92400e);
        this.activeBottomMat.emissiveIntensity = 0.30;
      } else {
        this.activeBottomMat.emissive.setHex(0x000000);
        this.activeBottomMat.emissiveIntensity = 0;
      }

      // Configure rarity-scaled aura rings
      this.haloMat1.color.setHex(tier.glowHex);
      this.haloMat2.color.setHex(tier.accentHex || 0xffffff);
      this.haloMat3.color.setHex(rarity === 'transcendent' ? 0xff007f : tier.glowHex);
      this.haloRing1.visible = true;
      this.haloRing2.visible = (rarity === 'epic' || rarity === 'legendary' || rarity === 'transcendent');
      this.haloRing3.visible = (rarity === 'transcendent');

      this.prizeLight.color.setHex(tier.glowHex);

      let lowestIdx = 0;
      let lowestScore = Infinity;
      for (let i = 0; i < this.capsules.length; i++) {
        const c = this.capsules[i];
        const score = c.pos.y - c.pos.z * 0.35;
        if (score < lowestScore) {
          lowestScore = score;
          lowestIdx = i;
        }
      }
      this.dispensedPoolCapsule = this.capsules[lowestIdx];

      if (this.coinMesh) {
        this.coinMesh.visible = true;
        this.coinMesh.position.set(0.32, 0.55, 2.35);
      }

      this.state = 'LEVER_PULL';
      this.stateTimer = 0;
      this.sfx.playLeverPull();

      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange(this.state);
      }
    }

    resetToIdle() {
      this.state = 'IDLE';
      this.stateTimer = 0;
      this._wakeTimer = 0;
      this._globeShakeTimer = 0;
      this._cameraShakeTimer = 0;
      this.activeCapsuleRig.visible = false;
      this.activeCapsuleRig.scale.set(1, 1, 1);
      if (this.auraHaloGroup) this.auraHaloGroup.visible = false;
      if (this.coinMesh) this.coinMesh.visible = false;
      this.activeTopHalf.position.set(0, 0, 0);
      this.activeTopHalf.rotation.set(0, 0, 0);
      this.activeBottomHalf.position.set(0, 0, 0);
      this.activeBottomHalf.rotation.set(0, 0, 0);
      this.leverPivot.rotation.set(0, 0, 0);
      this.chuteFlapPivot.rotation.set(0, 0, 0);
      this.prizeLight.intensity = 0;

      if (this.dispensedPoolCapsule) {
        this.dispensedPoolCapsule.mesh.visible = true;
        if (this.dispensedPoolCapsule.restPos) {
          this.dispensedPoolCapsule.pos.copy(this.dispensedPoolCapsule.restPos);
        }
        this.dispensedPoolCapsule.vel.set(0, 0, 0);
        this.dispensedPoolCapsule.mesh.position.copy(this.dispensedPoolCapsule.pos);
        this.dispensedPoolCapsule = null;
      }

      for (let step = 0; step < 50; step++) {
        this._stepCapsulePhysics(1 / 60, false, true);
      }

      for (let i = 0; i < this.capsules.length; i++) {
        this.capsules[i].vel.set(0, 0, 0);
        this.capsules[i].angVel.set(0, 0, 0);
        this.capsules[i].mesh.position.copy(this.capsules[i].pos);
      }

      this.targetCamPos.copy(this.baseCamPos);
      this.targetLookAt.copy(this.baseLookAt);

      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange('IDLE');
      }
    }

    _stepCapsulePhysics(dt, agitate = false, silent = false) {
      if (!silent && this.state === 'IDLE' && !agitate && (!this._wakeTimer || this._wakeTimer <= 0)) {
        return;
      }
      if (!silent && this._wakeTimer > 0) {
        this._wakeTimer = Math.max(0, this._wakeTimer - dt);
      }

      const safeDt = Math.min(dt, 0.025);
      const gravity = -28.0;
      const maxContainR = this.globeRadius - this.capsuleRadius - 0.08;
      const minDist = this.capsuleRadius * 2.02;
      const floorY = this.globeCenter.y - 1.02;
      const rodClearanceR = 0.065 + this.capsuleRadius;

      for (let i = 0; i < this.capsules.length; i++) {
        const c = this.capsules[i];
        if (c === this.dispensedPoolCapsule && !c.mesh.visible) continue;

        c.vel.y += gravity * safeDt;

        if (agitate) {
          const dx = c.pos.x;
          const dz = c.pos.z;
          const distXZ = Math.hypot(dx, dz) || 0.001;
          const heightFactor = Math.max(0, 1.0 - (c.pos.y - floorY) / 1.12);
          const swirlStrength = 11.4 * heightFactor;

          c.vel.x += (-dz / distXZ) * swirlStrength * safeDt;
          c.vel.z += (dx / distXZ) * swirlStrength * safeDt;
          c.vel.y += (1.25 + Math.sin(this.stateTimer * 18 + i) * 1.35) * heightFactor * safeDt;

          if (!silent && Math.random() < 0.05) {
            this.sfx.playCapsuleumble();
          }
        }

        const damping = agitate ? 0.93 : 0.78;
        c.vel.multiplyScalar(damping);
        c.pos.addScaledVector(c.vel, safeDt);

        if (c.pos.y < floorY) {
          c.pos.y = floorY;
          if (c.vel.y < 0) c.vel.y *= -0.14;
          c.vel.x *= 0.80;
          c.vel.z *= 0.80;
        }

        const maxAllowedY = agitate ? (this.globeCenter.y + 0.22) : (this.globeCenter.y - 0.05);
        if (c.pos.y > maxAllowedY) {
          c.pos.y = maxAllowedY;
          if (c.vel.y > 0) c.vel.y = 0;
        }

        const rXZ = Math.hypot(c.pos.x, c.pos.z);
        if (rXZ < rodClearanceR) {
          const pushAngle = rXZ > 0.0001 ? Math.atan2(c.pos.z, c.pos.x) : (i * 1.1);
          const nx = Math.cos(pushAngle);
          const nz = Math.sin(pushAngle);
          c.pos.x = nx * rodClearanceR;
          c.pos.z = nz * rodClearanceR;
          const vn = c.vel.x * nx + c.vel.z * nz;
          if (vn < 0) {
            c.vel.x -= 1.2 * vn * nx;
            c.vel.z -= 1.2 * vn * nz;
          }
        }

        const relX = c.pos.x - this.globeCenter.x;
        const relY = c.pos.y - this.globeCenter.y;
        const relZ = c.pos.z - this.globeCenter.z;
        const dist = Math.hypot(relX, relY, relZ);

        if (dist > maxContainR && dist > 0.0001) {
          const nx = relX / dist;
          const ny = relY / dist;
          const nz = relZ / dist;

          c.pos.set(
            this.globeCenter.x + nx * maxContainR,
            this.globeCenter.y + ny * maxContainR,
            this.globeCenter.z + nz * maxContainR
          );

          const vn = c.vel.x * nx + c.vel.y * ny + c.vel.z * nz;
          if (vn > 0) {
            c.vel.x -= 1.2 * vn * nx;
            c.vel.y -= 1.2 * vn * ny;
            c.vel.z -= 1.2 * vn * nz;
          }
        }
      }

      for (let iter = 0; iter < 4; iter++) {
        for (let i = 0; i < this.capsules.length; i++) {
          const a = this.capsules[i];
          if (a === this.dispensedPoolCapsule && !a.mesh.visible) continue;

          for (let j = i + 1; j < this.capsules.length; j++) {
            const b = this.capsules[j];
            if (b === this.dispensedPoolCapsule && !b.mesh.visible) continue;

            const dx = b.pos.x - a.pos.x;
            const dy = b.pos.y - a.pos.y;
            const dz = b.pos.z - a.pos.z;
            const dSq = dx * dx + dy * dy + dz * dz;

            if (dSq < minDist * minDist && dSq > 0.00001) {
              const d = Math.sqrt(dSq);
              const overlap = (minDist - d) * 0.5;
              const nx = dx / d;
              const ny = dy / d;
              const nz = dz / d;

              a.pos.x -= nx * overlap;
              a.pos.y -= ny * overlap;
              a.pos.z -= nz * overlap;

              b.pos.x += nx * overlap;
              b.pos.y += ny * overlap;
              b.pos.z += nz * overlap;

              const rvx = b.vel.x - a.vel.x;
              const rvy = b.vel.y - a.vel.y;
              const rvz = b.vel.z - a.vel.z;
              const vn = rvx * nx + rvy * ny + rvz * nz;

              if (vn < 0) {
                const imp = -0.48 * vn;
                a.vel.x -= imp * nx;
                a.vel.y -= imp * ny;
                a.vel.z -= imp * nz;
                b.vel.x += imp * nx;
                b.vel.y += imp * ny;
                b.vel.z += imp * nz;
              }
            }
          }
        }
      }

      for (let i = 0; i < this.capsules.length; i++) {
        const c = this.capsules[i];
        if (c === this.dispensedPoolCapsule && !c.mesh.visible) continue;

        if (c.pos.y < floorY) c.pos.y = floorY;
        const rXZ = Math.hypot(c.pos.x, c.pos.z);
        if (rXZ < rodClearanceR) {
          const pushAngle = rXZ > 0.0001 ? Math.atan2(c.pos.z, c.pos.x) : (i * 1.1);
          c.pos.x = Math.cos(pushAngle) * rodClearanceR;
          c.pos.z = Math.sin(pushAngle) * rodClearanceR;
        }

        const speed = c.vel.length();
        if (!agitate && speed < 0.08) {
          c.vel.set(0, 0, 0);
        } else {
          c.mesh.position.copy(c.pos);
          c.mesh.rotation.x += c.vel.z * safeDt * 1.45;
          c.mesh.rotation.z -= c.vel.x * safeDt * 1.45;
        }
      }
    }

    _updateAnimationState(dt) {
      const now = performance.now() * 0.001;

      // Ambient stage rotation, marquee bulb chase & golden dust motes
      if (this.stageSunburstMesh) {
        this.stageSunburstMesh.rotation.z += dt * (this.state === 'IDLE' ? 0.14 : 0.65);
      }
      this._updateMarqueeLights(now);
      this._updateDustMotes(dt);

      if (this.globeInnerLight) {
        this.globeInnerLight.intensity = this.state === 'LEVER_PULL'
          ? 1.35 + 0.35 * Math.sin(now * 24)
          : 0.78 + 0.16 * Math.sin(now * 2.4);
      }

      if (this.state === 'IDLE') {
        this.machineRoot.rotation.y = Math.sin(now * 0.45) * 0.04;
        if (this._globeShakeTimer > 0) {
          this._globeShakeTimer = Math.max(0, this._globeShakeTimer - dt);
          const s = this._globeShakeTimer / 0.42;
          this.machineRoot.rotation.z = Math.sin(now * 44) * 0.025 * s;
        } else {
          this.machineRoot.rotation.z *= 0.85;
        }

        if (!this.isDraggingLever) {
          this.leverPivot.rotation.x += (0 - this.leverPivot.rotation.x) * Math.min(1, dt * 10);
        }
        const pulse = 0.5 + 0.5 * Math.sin(now * 3.4);
        this.leverKnobMat.emissiveIntensity = 0.32 + 0.30 * pulse;
        if (this.leverPulseRing) {
          this.leverPulseRing.visible = true;
          this.leverPulseRing.scale.setScalar(0.95 + pulse * 0.24);
          this.leverPulseRingMat.opacity = 0.16 + (1 - pulse) * 0.38;
        }
        this._stepCapsulePhysics(dt, false, false);
      }

      // PHASE 1: COIN INSERT + SPRING LEVER PULL + VORTEX GLOBE AGITATION
      else if (this.state === 'LEVER_PULL') {
        this.stateTimer += dt;
        if (this.leverPulseRing) this.leverPulseRing.visible = false;

        // Animated brass coin arcs & drops into the slot during first 0.28s
        if (this.coinMesh && this.coinMesh.visible) {
          const cp = Math.min(1.0, this.stateTimer / 0.28);
          const easeC = 1 - Math.pow(1 - cp, 2.2);
          this.coinMesh.position.set(
            0.32 * (1 - easeC),
            0.55 + Math.sin(cp * Math.PI) * 0.28 + (-0.04 - 0.55) * easeC,
            2.35 + (1.28 - 2.35) * easeC
          );
          this.coinMesh.rotation.set(Math.PI * 0.5, cp * Math.PI * 3.5, Math.PI * 0.5);
          if (cp >= 1.0) this.coinMesh.visible = false;
        }

        const p = Math.min(1.0, this.stateTimer / 0.88);
        let leverAngle = 0;
        if (p < 0.54) {
          const t = p / 0.54;
          leverAngle = Math.sin(t * Math.PI * 0.5) * 1.15;
        } else {
          const t = (p - 0.54) / 0.46;
          leverAngle = (1 - t) * 1.15 * Math.cos(t * Math.PI * 0.5);
        }
        this.leverPivot.rotation.x = leverAngle;

        this.agitatorGroup.rotation.y += dt * 11.2 * Math.sin(p * Math.PI);
        this.machineRoot.rotation.z = Math.sin(this.stateTimer * 36) * 0.011 * Math.sin(p * Math.PI);

        this._stepCapsulePhysics(dt, true, false);

        if (p >= 1.0) {
          this.leverPivot.rotation.x = 0;
          this.machineRoot.rotation.z = 0;
          if (this.coinMesh) this.coinMesh.visible = false;

          if (this.dispensedPoolCapsule) {
            this.dispensedPoolCapsule.mesh.visible = false;
          }
          this.activeCapsuleRig.visible = true;
          this.activeCapsuleRig.scale.set(1, 1, 1);
          this.activeCapsuleRig.position.set(0, -1.32, 1.15);
          if (this.auraHaloGroup) this.auraHaloGroup.visible = false;
          this.activeTopHalf.position.set(0, 0, 0);
          this.activeTopHalf.rotation.set(0, 0, 0);
          this.activeBottomHalf.position.set(0, 0, 0);
          this.activeBottomHalf.rotation.set(0, 0, 0);

          this.state = 'BALL_DROP_CHUTE';
          this.stateTimer = 0;
          this.sfx.playChuteDropBounce();

          this.targetCamPos.set(0.04, -0.42, 7.6);
          this.targetLookAt.set(0, -0.82, 0.85);

          if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
        }
      }

      // PHASE 2: RIGID-BODY CONTACT CHUTE TUMBLE PUSHING HINGED FLAP DOOR (ZERO CLIPPING)
      else if (this.state === 'BALL_DROP_CHUTE') {
        this.stateTimer += dt;
        this._stepCapsulePhysics(dt, false, true);

        const p = Math.min(1.0, this.stateTimer / 0.82);
        let yPos = -1.32;
        let zPos = 1.15;

        if (p < 0.14) {
          const t = p / 0.14;
          yPos = -1.32 + (-1.36 - -1.32) * t;
          zPos = 1.15 + (1.20 - 1.15) * t;
        } else if (p < 0.62) {
          const t = (p - 0.14) / 0.48;
          const easeOut = 1 - Math.pow(1 - t, 2.1);
          yPos = -1.36 + (-1.53 - -1.36) * Math.pow(t, 1.35);
          zPos = 1.20 + (1.84 - 1.20) * easeOut;
        } else {
          const t = (p - 0.62) / 0.38;
          const bounce = Math.sin(t * Math.PI * 2.0) * Math.exp(-t * 3.5) * 0.048;
          yPos = -1.53 + Math.abs(bounce);
          zPos = 1.84 + (1.86 - 1.84) * t;
        }

        const yH = -1.21;
        const zH = 1.44;
        const L = 0.25;
        const rSafe = this.capsuleRadius * 1.15 + 0.024;
        let flapAngle = 0;

        if (p >= 0.12 && p < 0.64) {
          const dy = yPos - yH;
          const dz = zPos - zH;
          const dist = Math.hypot(dy, dz);
          const alpha = Math.atan2(dz, Math.max(0.01, -dy));
          let thetaContact = 0;

          if (dist <= Math.hypot(L, rSafe)) {
            const spread = Math.asin(Math.min(0.99, rSafe / Math.max(0.01, dist)));
            thetaContact = Math.max(0, alpha + spread);
          } else if (dist < L + rSafe) {
            const cosDelta = (L * L + dist * dist - rSafe * rSafe) / (2 * L * dist);
            const delta = Math.acos(Math.max(-1, Math.min(1, cosDelta)));
            thetaContact = Math.max(0, alpha + delta);
          }
          flapAngle = -Math.min(1.42, thetaContact);
        } else if (p >= 0.64) {
          const tClose = (p - 0.64) / 0.36;
          const dampedSwing = Math.max(0, Math.cos(tClose * Math.PI * 1.65) * Math.exp(-tClose * 4.2));
          flapAngle = -0.38 * dampedSwing;
        }

        this.chuteFlapPivot.rotation.x = flapAngle;
        this.activeCapsuleRig.position.set(0, yPos, zPos);
        this.activeCapsuleRig.rotation.x += dt * 10.5;

        if (p >= 1.0) {
          this.chuteFlapPivot.rotation.x = 0;
          this.state = 'CAPSULE_PRESENT';
          this.stateTimer = 0;
          if (this.auraHaloGroup) this.auraHaloGroup.visible = true;

          const rarity = (this.pendingReward && this.pendingReward.rarity) || 'classic';
          this.sfx.playRarityRiser(rarity);

          this.targetCamPos.set(0, -0.02, 6.55);
          this.targetLookAt.set(0, -0.06, 1.9);

          if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
        }
      }

      // PHASE 3: MAGNETIC LEVITATION RISE & RARITY-SCALED ANTICIPATION BUILDUP
      else if (this.state === 'CAPSULE_PRESENT') {
        this.stateTimer += dt;
        const rarity = (this.pendingReward && this.pendingReward.rarity) || 'classic';
        const dur = rarity === 'transcendent' ? 0.86 : (rarity === 'legendary' ? 0.72 : 0.60);
        const p = Math.min(1.0, this.stateTimer / dur);
        const ease = 1 - Math.pow(1 - p, 3);
        const jitterAmp = rarity === 'transcendent' ? 0.052 : (rarity === 'legendary' ? 0.040 : 0.026);

        this.activeCapsuleRig.position.set(
          Math.sin(p * Math.PI * 14) * jitterAmp * p,
          -1.53 + (0.06 - -1.53) * ease,
          1.86 + (3.24 - 1.86) * ease
        );
        const sc = 1.0 + 0.58 * ease;
        this.activeCapsuleRig.scale.set(sc, sc, sc);
        this.activeCapsuleRig.rotation.x = (1 - ease) * 0.5;
        this.activeCapsuleRig.rotation.y = ease * Math.PI * (rarity === 'transcendent' ? 3.0 : 2.0);

        if (this.auraHaloGroup && this.auraHaloGroup.visible) {
          this.haloRing1.rotation.x += dt * 4.8;
          this.haloRing1.rotation.y += dt * 3.4;
          if (this.haloRing2.visible) {
            this.haloRing2.rotation.y -= dt * 5.2;
            this.haloRing2.rotation.z += dt * 4.0;
          }
          if (this.haloRing3.visible) {
            this.haloRing3.rotation.x -= dt * 6.0;
            this.haloRing3.rotation.z -= dt * 4.4;
          }
        }

        const lightTarget = rarity === 'transcendent' ? 4.2 : (rarity === 'legendary' ? 3.2 : 2.3);
        this.prizeLight.intensity = ease * lightTarget;

        if (p >= 1.0) {
          this.state = 'CAPSULE_BURST_OPEN';
          this.stateTimer = 0;

          const tier = RARITY_TIERS[rarity] || RARITY_TIERS.classic;
          this.sfx.playCapsuleOpenFanfare(rarity);
          this._triggerBurstParticles(this.activeCapsuleRig.position, tier);

          if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
          if (this.callbacks.onRewardRevealed) {
            this.callbacks.onRewardRevealed(this.pendingReward);
          }
        }
      }

      // PHASE 4: CAPSULE SPLITS OPEN CLEANLY ABOVE & BELOW THE PRIZE SHOWCASE
      else if (this.state === 'CAPSULE_BURST_OPEN') {
        this.stateTimer += dt;
        const openT = Math.min(1.0, this.stateTimer / 0.44);
        const easeOut = 1 - Math.pow(1 - openT, 3);

        this.activeTopHalf.position.set(0, easeOut * 0.80, 0);
        this.activeTopHalf.rotation.x = -easeOut * 0.54;

        this.activeBottomHalf.position.set(0, -easeOut * 0.80, 0);
        this.activeBottomHalf.rotation.x = easeOut * 0.44;

        if (this.auraHaloGroup && this.auraHaloGroup.visible) {
          this.haloRing1.rotation.x += dt * 2.4;
          this.haloRing1.rotation.y += dt * 2.0;
          if (this.haloRing2.visible) {
            this.haloRing2.rotation.y -= dt * 3.0;
            this.haloRing2.rotation.z += dt * 2.2;
          }
          if (this.haloRing3.visible) {
            this.haloRing3.rotation.x -= dt * 3.4;
            this.haloRing3.rotation.z -= dt * 2.6;
          }
        }

        this.prizeLight.intensity = 2.6 + Math.sin(this.stateTimer * 6.0) * 0.55;
      }

      this._updateBurstSystem(dt);

      const camLerp = Math.min(1.0, dt * 5.2);
      this.currentCamPos.lerp(this.targetCamPos, camLerp);
      this.currentLookAt.lerp(this.targetLookAt, camLerp);

      if (this._cameraShakeTimer > 0) {
        this._cameraShakeTimer = Math.max(0, this._cameraShakeTimer - dt);
        const decay = this._cameraShakeTimer / 0.35;
        const amp = this._cameraShakeMag * Math.min(1, decay);
        this._scratchVec.set(
          this.currentCamPos.x + (Math.random() - 0.5) * amp,
          this.currentCamPos.y + (Math.random() - 0.5) * amp,
          this.currentCamPos.z
        );
        this.camera.position.copy(this._scratchVec);
      } else {
        this.camera.position.copy(this.currentCamPos);
      }
      this.camera.lookAt(this.currentLookAt);
    }

    resize() {
      if (!this.canvas || !this.renderer || !this.camera) return;
      const w = this.canvas.clientWidth || window.innerWidth || 380;
      const h = this.canvas.clientHeight || window.innerHeight || 680;
      const aspect = w / Math.max(1, h);

      this.camera.aspect = aspect;
      if (aspect < 0.60) {
        this.baseCamPos.set(0.18, 0.25, 11.4);
      } else if (aspect < 0.80) {
        this.baseCamPos.set(0.16, 0.26, 10.4);
      } else {
        this.baseCamPos.set(0.12, 0.28, 9.2);
      }
      if (this.state === 'IDLE') {
        this.targetCamPos.copy(this.baseCamPos);
      }
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.resize();
      if (this.clock) this.clock.getDelta();

      const loop = () => {
        if (!this.isRunning) return;
        this.rafId = requestAnimationFrame(loop);
        const dt = this.clock ? Math.min(this.clock.getDelta(), 0.05) : 1 / 60;
        this._updateAnimationState(dt);
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      };
      this.rafId = requestAnimationFrame(loop);
    }

    stop() {
      this.isRunning = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    stopLoop() {
      this.stop();
    }
  }

  window.VintageGachapon3D = VintageGachapon3D;
  window.GACHAPON_RARITY_TIERS = RARITY_TIERS;
})();
