/**
 * ============================================================================
 * VINTAGE 3D GACHAPON CAPSULE VENDING MACHINE ("LA IMPERIAL ACÚSTICA 1958")
 * Ultra-Realistic Three.js PBR 3D Machine, Real-Time 26-Ball Sphere Physics,
 * Mechanical Crank & Chute Choreography, and Cinematic 3D Capsule Burst Reveal
 * ============================================================================
 */
(function () {
  'use strict';

  const RARITY_TIERS = {
    legendary: {
      id: 'legendary',
      label: '★ LEGENDARIO ★',
      colorHex: 0xfbbf24,
      secondaryHex: 0x38bdf8,
      cssColor: '#fbbf24',
      glowCss: 'rgba(251, 191, 36, 0.65)',
      badgeBg: 'linear-gradient(135deg, #f59e0b 0%, #fde047 50%, #d97706 100%)',
      badgeText: '#1c1002',
      weightNormal: 12,
      weightGolden: 34
    },
    epic: {
      id: 'epic',
      label: '◆ ÉPICO ◆',
      colorHex: 0xe11d48,
      secondaryHex: 0xc084fc,
      cssColor: '#f43f5e',
      glowCss: 'rgba(244, 63, 94, 0.55)',
      badgeBg: 'linear-gradient(135deg, #be123c 0%, #f43f5e 50%, #9333ea 100%)',
      badgeText: '#ffffff',
      weightNormal: 26,
      weightGolden: 42
    },
    rare: {
      id: 'rare',
      label: '● RARO ●',
      colorHex: 0x10b981,
      secondaryHex: 0x34d399,
      cssColor: '#34d399',
      glowCss: 'rgba(52, 211, 153, 0.50)',
      badgeBg: 'linear-gradient(135deg, #047857 0%, #10b981 50%, #0d9488 100%)',
      badgeText: '#ffffff',
      weightNormal: 36,
      weightGolden: 24
    },
    classic: {
      id: 'classic',
      label: '✦ CLÁSICO ✦',
      colorHex: 0x38bdf8,
      secondaryHex: 0xe2e8f0,
      cssColor: '#7dd3fc',
      glowCss: 'rgba(56, 189, 248, 0.45)',
      badgeBg: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 50%, #475569 100%)',
      badgeText: '#ffffff',
      weightNormal: 26,
      weightGolden: 0
    }
  };

  // Preset Vintage & Concert Stage Backgrounds unlockable from capsules
  const VINTAGE_STAGE_BACKGROUNDS = [
    {
      id: 'bg_imperial_velvet',
      name: 'Escenario: Terciopelo Imperial 1920',
      desc: 'Cortinaje de ópera carmesí con filigranas de oro envejecido e iluminación cálida de candelabro.',
      rarity: 'rare',
      palette: ['#1a0509', '#590d1b', '#c5a059', '#fde68a']
    },
    {
      id: 'bg_golden_conservatory',
      name: 'Escenario: Conservatorio Real de Viena',
      desc: 'Parquet de caoba imperial y haces volumétricos dorados sobre cámara acústica de concierto.',
      rarity: 'epic',
      palette: ['#0f0a06', '#3b2313', '#eab308', '#fef08a']
    },
    {
      id: 'bg_celestial_cathedral',
      name: 'Escenario: Vitral Celestial Áureo',
      desc: 'Rosetón gótico luminiscente con destellos de zafiro, esmeralda y latón bruñido.',
      rarity: 'legendary',
      palette: ['#050b14', '#1e3a8a', '#38bdf8', '#fbbf24']
    },
    {
      id: 'bg_midnight_jazz_club',
      name: 'Escenario: Club de Jazz Vinilo 1958',
      desc: 'Atmósfera íntima de club nocturno vintage con humo cálido, latón de saxofón y neón ámbar.',
      rarity: 'rare',
      palette: ['#09060d', '#2e1065', '#f59e0b', '#f43f5e']
    }
  ];

  // Synthesized Vintage Mechanical & Musical Sound Engine (Web Audio API)
  class GachaponSoundFX {
    constructor() {
      this.ctx = null;
    }

    ensureCtx() {
      if (localStorage.getItem('beatstar_master_muted') === 'true') return null;
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    getMasterGain() {
      const vol = parseFloat(localStorage.getItem('beatstar_master_volume') ?? '1.0');
      return Math.max(0.05, Math.min(1.0, isNaN(vol) ? 0.8 : vol)) * 0.45;
    }

    playCoinInsert() {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = this.getMasterGain();

      // Metallic coin clink (two high bell partials)
      [2450, 3680, 5120].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.035);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.04, now + i * 0.035 + 0.14);
        gain.gain.setValueAtTime(vol * (0.45 - i * 0.1), now + i * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.035);
        osc.stop(now + i * 0.035 + 0.19);
      });
    }

    playRatchetClick(pitchScale = 1.0) {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = this.getMasterGain();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 * pitchScale, now);
      osc.frequency.exponentialRampToValueAtTime(68 * pitchScale, now + 0.045);
      gain.gain.setValueAtTime(vol * 0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    }

    playBallClatter(intensity = 0.6) {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = this.getMasterGain() * Math.min(1, intensity);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 520 + Math.random() * 480;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, now + 0.04);
      gain.gain.setValueAtTime(vol * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }

    playChuteDropAndDoor() {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = this.getMasterGain();

      // Heavy hollow thud + metallic flap clack
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
      gain.gain.setValueAtTime(vol * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);

      // Metallic flap ring
      const flapOsc = ctx.createOscillator();
      const flapGain = ctx.createGain();
      flapOsc.type = 'square';
      flapOsc.frequency.setValueAtTime(880, now + 0.08);
      flapOsc.frequency.exponentialRampToValueAtTime(310, now + 0.19);
      flapGain.gain.setValueAtTime(vol * 0.22, now + 0.08);
      flapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      flapOsc.connect(flapGain);
      flapGain.connect(ctx.destination);
      flapOsc.start(now + 0.08);
      flapOsc.stop(now + 0.21);
    }

    playSuspenseCharge() {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = this.getMasterGain();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.55);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(vol * 0.35, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.60);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.62);
    }

    playCapsuleBurstFanfare(rarityId = 'rare') {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = this.getMasterGain();

      // 1. Pop / Burst transient
      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(420, now);
      popOsc.frequency.exponentialRampToValueAtTime(65, now + 0.18);
      popGain.gain.setValueAtTime(vol * 0.85, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      popOsc.connect(popGain);
      popGain.connect(ctx.destination);
      popOsc.start(now);
      popOsc.stop(now + 0.21);

      // 2. Grand Piano / Celeste Harmonic Arpeggio based on Rarity
      const chords = {
        classic: [523.25, 659.25, 783.99, 1046.50],
        rare: [523.25, 659.25, 783.99, 987.77, 1318.51],
        epic: [440.0, 554.37, 659.25, 880.0, 1108.73, 1318.51],
        legendary: [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]
      };
      const notes = chords[rarityId] || chords.rare;

      notes.forEach((freq, idx) => {
        const delay = idx * 0.065;
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        sub.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        sub.frequency.setValueAtTime(freq * 2, now + delay);

        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.linearRampToValueAtTime(vol * 0.36, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + delay + 0.95);

        osc.connect(gain);
        sub.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        sub.start(now + delay);
        osc.stop(now + delay + 1.0);
        sub.stop(now + delay + 1.0);
      });
    }
  }

  class VintageGachapon3D {
    constructor(canvasEl, callbacks = {}) {
      this.canvas = canvasEl;
      this.callbacks = callbacks;
      this.sfx = new GachaponSoundFX();

      this.isRunning = false;
      this.rafId = null;
      this.lastTime = 0;

      // Machine state: 'IDLE' | 'COIN_AND_CRANK' | 'BALL_DROP_CHUTE' | 'HERO_PRESENTATION' | 'CAPSULE_BURST_OPEN'
      this.state = 'IDLE';
      this.stateTimer = 0;
      this.pendingReward = null;
      this.lastRatchetStep = -1;

      // Orbit / camera interaction
      this.userYaw = 0;
      this.targetYaw = 0;
      this.userPitch = 0.04;
      this.targetPitch = 0.04;
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;

      // Physics balls array inside the glass dome
      this.balls = [];
      this.domeCenter = new THREE.Vector3(0, 1.52, 0);
      this.domeRadius = 1.34;
      this.ballRadius = 0.255;

      // Burst particles in 3D
      this.burstParticles = [];

      this.initScene();
      this.buildMaterials();
      this.buildMachineMesh();
      this.populateCapsules(26);
      this.buildHeroCapsule();
      this.bindInteraction();
    }

    initScene() {
      const w = this.canvas.clientWidth || 340;
      const h = this.canvas.clientHeight || 420;

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 50);
      this.defaultCamPos = new THREE.Vector3(0, 0.72, 7.65);
      this.defaultLookAt = new THREE.Vector3(0, 0.42, 0);
      this.currentCamPos = this.defaultCamPos.clone();
      this.currentLookAt = this.defaultLookAt.clone();
      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h, false);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (THREE.ACESFilmicToneMapping !== undefined) {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.18;
      }
      if (THREE.sRGBEncoding !== undefined) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }

      // Generate Procedural Warm Vintage Showroom Environment Map for PBR Metals & Glass
      this.createStudioEnvironment();

      // Theatrical Vintage Lighting Setup
      const ambient = new THREE.AmbientLight(0xfff0d4, 0.55);
      this.scene.add(ambient);

      this.keyLight = new THREE.DirectionalLight(0xfff5e0, 1.85);
      this.keyLight.position.set(4.5, 7.5, 6.0);
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.width = 1024;
      this.keyLight.shadow.mapSize.height = 1024;
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 20;
      const d = 3.5;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0015;
      this.scene.add(this.keyLight);

      // Warm Golden Rim Light from Left/Back
      this.rimLight = new THREE.PointLight(0xfbbf24, 1.6, 14);
      this.rimLight.position.set(-4.2, 3.2, -2.5);
      this.scene.add(this.rimLight);

      // Cool Cyan/Sapphire Accent Fill from Right for Glass Specular Contrast
      this.fillLight = new THREE.PointLight(0x38bdf8, 1.15, 14);
      this.fillLight.position.set(4.4, 2.0, 3.2);
      this.scene.add(this.fillLight);

      // Internal Dome Warm Bulb Glow (illuminates capsules from inside the crown!)
      this.domeInnerLight = new THREE.PointLight(0xffdfa0, 1.35, 4.5);
      this.domeInnerLight.position.set(0, 2.55, 0);
      this.scene.add(this.domeInnerLight);

      // Hero Spotlight for Capsule Reveal
      this.heroLight = new THREE.PointLight(0xffffff, 0, 8);
      this.heroLight.position.set(0, 1.2, 4.4);
      this.scene.add(this.heroLight);
    }

    createStudioEnvironment() {
      try {
        if (!THREE.PMREMGenerator) return;
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileCubemapShader();

        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color(0x12090d);

        // Warm overhead softbox
        const topBox = new THREE.Mesh(
          new THREE.PlaneGeometry(12, 12),
          new THREE.MeshBasicMaterial({ color: 0xfffaed, side: THREE.DoubleSide })
        );
        topBox.position.set(0, 7, 0);
        topBox.rotation.x = Math.PI / 2;
        envScene.add(topBox);

        // Left golden strip reflector
        const leftStrip = new THREE.Mesh(
          new THREE.PlaneGeometry(4, 10),
          new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide })
        );
        leftStrip.position.set(-6, 2, 2);
        leftStrip.lookAt(0, 0, 0);
        envScene.add(leftStrip);

        // Right crystal-blue strip reflector
        const rightStrip = new THREE.Mesh(
          new THREE.PlaneGeometry(3.5, 10),
          new THREE.MeshBasicMaterial({ color: 0xe0f2fe, side: THREE.DoubleSide })
        );
        rightStrip.position.set(6, 2.5, 3);
        rightStrip.lookAt(0, 0, 0);
        envScene.add(rightStrip);

        // Front warm ring highlight for glass globe reflection
        const frontArc = new THREE.Mesh(
          new THREE.RingGeometry(1.8, 2.3, 32),
          new THREE.MeshBasicMaterial({ color: 0xfffbeb, side: THREE.DoubleSide })
        );
        frontArc.position.set(0, 2.0, 7);
        envScene.add(frontArc);

        const envRT = pmremGenerator.fromScene(envScene, 0.035);
        this.scene.environment = envRT.texture;
        pmremGenerator.dispose();
      } catch (e) {
        console.warn('[Gachapon3D] Fallback environment lighting:', e);
      }
    }

    createHammeredMetalBumpTexture() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 256, 256);

      for (let i = 0; i < 420; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = 4 + Math.random() * 12;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const shade = Math.random() > 0.5 ? 165 : 105;
        g.addColorStop(0, `rgb(${shade},${shade},${shade})`);
        g.addColorStop(1, 'rgba(128,128,128,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      return tex;
    }

    createVintagePlaqueTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d');

      // Dark antique bronze background with golden border
      const grad = ctx.createLinearGradient(0, 0, 512, 256);
      grad.addColorStop(0, '#2a1808');
      grad.addColorStop(0.5, '#42260d');
      grad.addColorStop(1, '#1f1105');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      // Ornate double brass border
      ctx.strokeStyle = '#f3d791';
      ctx.lineWidth = 10;
      ctx.strokeRect(12, 12, 488, 232);
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 4;
      ctx.strokeRect(26, 26, 460, 204);

      // Corner rivets
      const corners = [[38, 38], [474, 38], [38, 218], [474, 218]];
      ctx.fillStyle = '#fde68a';
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Vintage Typography
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 42px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('IMPERIAL 1958', 256, 86);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('★ CÁPSULAS DE CONCIERTO ★', 256, 132);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText('25 𝄞  •  PREMIO SEGURO', 256, 188);

      const tex = new THREE.CanvasTexture(c);
      return tex;
    }

    buildMaterials() {
      const bumpTex = this.createHammeredMetalBumpTexture();

      // 1. Vintage Crimson Cast-Iron Enamel (Body)
      this.matCrimsonEnamel = new THREE.MeshStandardMaterial({
        color: 0x99111c,
        roughness: 0.18,
        metalness: 0.38,
        bumpMap: bumpTex,
        bumpScale: 0.012,
        envMapIntensity: 1.5
      });

      // 2. Deep Mahogany / Ebony Pedestal Trim
      this.matMahoganyDark = new THREE.MeshStandardMaterial({
        color: 0x1c0d0a,
        roughness: 0.28,
        metalness: 0.25,
        envMapIntensity: 1.2
      });

      // 3. Polished Royal Brass (Crown, Collar, Moldings, Plaque)
      this.matPolishedBrass = new THREE.MeshStandardMaterial({
        color: 0xeab308,
        roughness: 0.16,
        metalness: 0.92,
        bumpMap: bumpTex,
        bumpScale: 0.005,
        envMapIntensity: 1.85
      });

      // 4. Antique Brushed Bronze
      this.matAntiqueBronze = new THREE.MeshStandardMaterial({
        color: 0x9a6b28,
        roughness: 0.32,
        metalness: 0.85,
        envMapIntensity: 1.4
      });

      // 5. Mirror Chrome (Crank Handle, Chute Door, Internal Rod)
      this.matMirrorChrome = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.08,
        metalness: 0.96,
        envMapIntensity: 2.0
      });

      // 6. Crystal Glass Globe Material (Outer & Inner Specular Layers)
      this.matGlassOuter = new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        roughness: 0.04,
        metalness: 0.15,
        transparent: true,
        opacity: 0.24,
        envMapIntensity: 2.4,
        depthWrite: false,
        side: THREE.FrontSide
      });

      this.matGlassRim = new THREE.MeshStandardMaterial({
        color: 0xfffbeb,
        roughness: 0.08,
        metalness: 0.3,
        transparent: true,
        opacity: 0.14,
        envMapIntensity: 2.0,
        depthWrite: false,
        side: THREE.BackSide
      });

      // 7. Velvet Chute Interior
      this.matVelvetInterior = new THREE.MeshStandardMaterial({
        color: 0x26050c,
        roughness: 0.9,
        metalness: 0.05
      });
    }

    buildMachineMesh() {
      this.machineGroup = new THREE.Group();
      this.machineGroup.position.set(0, -0.35, 0);
      this.scene.add(this.machineGroup);

      // ======================================================================
      // A. HEAVY OCTAGONAL CAST-IRON & BRASS PEDESTAL BASE (y: -2.45 to -1.75)
      // ======================================================================
      const baseFootGeo = new THREE.CylinderGeometry(1.42, 1.58, 0.26, 32);
      const baseFoot = new THREE.Mesh(baseFootGeo, this.matMahoganyDark);
      baseFoot.position.y = -2.30;
      baseFoot.castShadow = true;
      baseFoot.receiveShadow = true;
      this.machineGroup.add(baseFoot);

      // Brass step ring above base foot
      const baseBrassRingGeo = new THREE.TorusGeometry(1.40, 0.065, 16, 48);
      const baseBrassRing = new THREE.Mesh(baseBrassRingGeo, this.matPolishedBrass);
      baseBrassRing.rotation.x = Math.PI / 2;
      baseBrassRing.position.y = -2.16;
      this.machineGroup.add(baseBrassRing);

      // 4 Ornate Brass Lion/Ball Claw Feet
      const clawGeo = new THREE.SphereGeometry(0.16, 16, 16);
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const foot = new THREE.Mesh(clawGeo, this.matPolishedBrass);
        foot.scale.set(1.1, 0.75, 1.1);
        foot.position.set(Math.cos(ang) * 1.44, -2.40, Math.sin(ang) * 1.44);
        this.machineGroup.add(foot);
      }

      // ======================================================================
      // B. VINTAGE TAPERED CRIMSON ENAMEL BODY (y: -2.15 to +0.18)
      // ======================================================================
      // Lathe profile for authentic 1950s curved gumball pedestal waist
      const lathePoints = [
        new THREE.Vector2(1.38, -2.15),
        new THREE.Vector2(1.32, -1.85),
        new THREE.Vector2(1.12, -1.25),
        new THREE.Vector2(1.06, -0.60),
        new THREE.Vector2(1.18, -0.05),
        new THREE.Vector2(1.28, 0.16)
      ];
      const bodyGeo = new THREE.LatheGeometry(lathePoints, 48);
      const bodyMesh = new THREE.Mesh(bodyGeo, this.matCrimsonEnamel);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      this.machineGroup.add(bodyMesh);

      // 6 Decorative Fluted Brass Ribs along the crimson body
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
        // Skip the very front center so the plaque & chute sit cleanly
        if (Math.abs(Math.sin(ang)) < 0.3 && Math.cos(ang) > 0) continue;
        const ribGeo = new THREE.CylinderGeometry(0.032, 0.042, 2.15, 12);
        const rib = new THREE.Mesh(ribGeo, this.matPolishedBrass);
        rib.position.set(Math.sin(ang) * 1.16, -1.0, Math.cos(ang) * 1.16);
        this.machineGroup.add(rib);
      }

      // Mid-waist ornamental brass belt
      const waistBelt = new THREE.Mesh(
        new THREE.TorusGeometry(1.11, 0.04, 14, 48),
        this.matPolishedBrass
      );
      waistBelt.rotation.x = Math.PI / 2;
      waistBelt.position.y = -0.95;
      this.machineGroup.add(waistBelt);

      // ======================================================================
      // C. COLLAR NECK RING SUPPORTING THE GLASS GLOBE (y: +0.16 to +0.34)
      // ======================================================================
      const collarGeo = new THREE.CylinderGeometry(1.32, 1.25, 0.22, 48);
      const collarMesh = new THREE.Mesh(collarGeo, this.matPolishedBrass);
      collarMesh.position.y = 0.22;
      collarMesh.castShadow = true;
      this.machineGroup.add(collarMesh);

      const collarLip = new THREE.Mesh(
        new THREE.TorusGeometry(1.31, 0.055, 16, 48),
        this.matPolishedBrass
      );
      collarLip.rotation.x = Math.PI / 2;
      collarLip.position.y = 0.31;
      this.machineGroup.add(collarLip);

      // ======================================================================
      // D. FRONT EMBOSSED VINTAGE BRASS PLAQUE & ROTARY CRANK MECHANISM
      // ======================================================================
      // Curved/Bevelled Front Escutcheon Plate
      const plaqueGroup = new THREE.Group();
      plaqueGroup.position.set(0, -0.46, 1.11);
      this.machineGroup.add(plaqueGroup);

      // Brass backing shield
      const shieldGeo = new THREE.BoxGeometry(1.16, 0.92, 0.12);
      const shieldMesh = new THREE.Mesh(shieldGeo, this.matPolishedBrass);
      shieldMesh.castShadow = true;
      plaqueGroup.add(shieldMesh);

      // Textured Vintage Nameplate on top half of shield
      const plaqueTex = this.createVintagePlaqueTexture();
      const nameplateMat = new THREE.MeshStandardMaterial({
        map: plaqueTex,
        roughness: 0.25,
        metalness: 0.65
      });
      const nameplateMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.04, 0.44),
        nameplateMat
      );
      nameplateMesh.position.set(0, 0.19, 0.065);
      plaqueGroup.add(nameplateMesh);

      // Coin Slot Bezel (Left of crank)
      const coinBezel = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.30, 0.08),
        this.matAntiqueBronze
      );
      coinBezel.position.set(-0.36, -0.18, 0.06);
      plaqueGroup.add(coinBezel);

      const coinSlit = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.18, 0.09),
        this.matVelvetInterior
      );
      coinSlit.position.set(-0.36, -0.18, 0.068);
      plaqueGroup.add(coinSlit);

      // 3D Animated Golden Coin (slides into coinSlit during COIN_AND_CRANK)
      this.coinMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.028, 24),
        this.matPolishedBrass
      );
      this.coinMesh.rotation.z = Math.PI / 2;
      this.coinMesh.position.set(-0.36, -0.18, 0.35);
      this.coinMesh.visible = false;
      plaqueGroup.add(this.coinMesh);

      // Rotary Chrome & Brass Crank Mechanism (Center-Right of shield)
      this.crankGroup = new THREE.Group();
      this.crankGroup.position.set(0.10, -0.18, 0.08);
      plaqueGroup.add(this.crankGroup);

      // Circular dial drum
      const dialDrum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.26, 0.12, 32),
        this.matMirrorChrome
      );
      dialDrum.rotation.x = Math.PI / 2;
      this.crankGroup.add(dialDrum);

      // Brass inner hub
      const dialHub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.18, 24),
        this.matPolishedBrass
      );
      dialHub.rotation.x = Math.PI / 2;
      dialHub.position.z = 0.04;
      this.crankGroup.add(dialHub);

      // Crossbar Wing Handle (What the player turns!)
      const handleBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.042, 0.56, 16),
        this.matMirrorChrome
      );
      handleBar.rotation.z = Math.PI / 2;
      handleBar.position.z = 0.13;
      this.crankGroup.add(handleBar);

      // Brass end-knobs on the crossbar
      [-0.27, 0.27].forEach(xOff => {
        const knob = new THREE.Mesh(
          new THREE.SphereGeometry(0.068, 16, 16),
          this.matPolishedBrass
        );
        knob.position.set(xOff, 0, 0.13);
        this.crankGroup.add(knob);
      });

      // ======================================================================
      // E. LOWER DISPENSER CHUTE ALCOVE, HINGED FLAP DOOR & VELVET TRAY
      // ======================================================================
      const chuteGroup = new THREE.Group();
      chuteGroup.position.set(0, -1.65, 1.22);
      this.machineGroup.add(chuteGroup);

      // Outer Brass Chute Frame
      const chuteFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.86, 0.68, 0.26),
        this.matPolishedBrass
      );
      chuteFrame.castShadow = true;
      chuteGroup.add(chuteFrame);

      // Dark Velvet Recessed Interior Cavity
      const chuteCavity = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.52, 0.24),
        this.matVelvetInterior
      );
      chuteCavity.position.set(0, -0.02, 0.03);
      chuteGroup.add(chuteCavity);

      // Protruding Curved Lip / Collection Tray at the bottom of the chute
      const trayLip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.44, 0.38, 0.12, 24, 1, false, 0, Math.PI),
        this.matPolishedBrass
      );
      trayLip.position.set(0, -0.30, 0.08);
      chuteGroup.add(trayLip);

      // Hinged Swinging Chrome Flap Door (pivots from its top edge!)
      this.flapPivot = new THREE.Group();
      this.flapPivot.position.set(0, 0.22, 0.12);
      chuteGroup.add(this.flapPivot);

      const flapDoorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.44, 0.035),
        this.matMirrorChrome
      );
      flapDoorMesh.position.set(0, -0.22, 0);
      this.flapPivot.add(flapDoorMesh);

      // Embossed brass emblem on the flap door
      const flapBadge = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.12, 0.045),
        this.matPolishedBrass
      );
      flapBadge.position.set(0, -0.24, 0.008);
      this.flapPivot.add(flapBadge);

      // ======================================================================
      // F. CRYSTAL GLASS GLOBE, INTERNAL BRASS ROD & AGITATOR WHEEL
      // ======================================================================
      // Central Threaded Brass Rod inside the globe
      const centerRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, 2.72, 20),
        this.matPolishedBrass
      );
      centerRod.position.copy(this.domeCenter);
      this.machineGroup.add(centerRod);

      // Internal Rotating Brass Agitator Wheel at bottom of globe
      this.agitatorGroup = new THREE.Group();
      this.agitatorGroup.position.set(0, 0.42, 0);
      this.machineGroup.add(this.agitatorGroup);

      const agitatorDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.88, 0.88, 0.06, 24),
        this.matPolishedBrass
      );
      this.agitatorGroup.add(agitatorDisc);

      for (let i = 0; i < 4; i++) {
        const fin = new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 0.14, 0.05),
          this.matMirrorChrome
        );
        const a = (i / 4) * Math.PI * 2;
        fin.rotation.y = a;
        fin.position.set(Math.cos(a) * 0.35, 0.08, Math.sin(a) * 0.35);
        this.agitatorGroup.add(fin);
      }

      // 4 External Vintage Brass Tie-Rods framing the glass globe
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const rodX = Math.cos(ang) * 1.37;
        const rodZ = Math.sin(ang) * 1.37;
        const tieRod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 2.38, 12),
          this.matPolishedBrass
        );
        tieRod.position.set(rodX, 1.50, rodZ);
        this.machineGroup.add(tieRod);
      }

      // Inner Glass Back-Face Rim Sphere
      const glassBackMesh = new THREE.Mesh(
        new THREE.SphereGeometry(this.domeRadius * 0.99, 48, 36),
        this.matGlassRim
      );
      glassBackMesh.position.copy(this.domeCenter);
      this.machineGroup.add(glassBackMesh);

      // Outer Crystal Glass Globe
      this.glassGlobeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(this.domeRadius, 48, 36),
        this.matGlassOuter
      );
      this.glassGlobeMesh.position.copy(this.domeCenter);
      this.glassGlobeMesh.renderOrder = 2;
      this.machineGroup.add(this.glassGlobeMesh);

      // Specular Studio Highlight Arc painted inside glass for unmistakable 3D glass depth
      const highlightGeo = new THREE.SphereGeometry(
        this.domeRadius * 1.002,
        32,
        24,
        -Math.PI * 0.38,
        Math.PI * 0.22,
        Math.PI * 0.18,
        Math.PI * 0.55
      );
      const highlightMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.22,
        side: THREE.FrontSide,
        depthWrite: false
      });
      const glassHighlight = new THREE.Mesh(highlightGeo, highlightMat);
      glassHighlight.position.copy(this.domeCenter);
      glassHighlight.renderOrder = 3;
      this.machineGroup.add(glassHighlight);

      // ======================================================================
      // G. ORNATE VICTORIAN / ART-DECO BRASS CROWN LID & FINIAL (y: +2.68 to +3.40)
      // ======================================================================
      const crownGroup = new THREE.Group();
      crownGroup.position.set(0, 2.68, 0);
      this.machineGroup.add(crownGroup);

      const crownBaseRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.92, 0.06, 16, 48),
        this.matPolishedBrass
      );
      crownBaseRing.rotation.x = Math.PI / 2;
      crownGroup.add(crownBaseRing);

      const crownDome = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.92, 0.32, 32),
        this.matCrimsonEnamel
      );
      crownDome.position.y = 0.16;
      crownGroup.add(crownDome);

      const crownTopCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.46, 0.16, 32),
        this.matPolishedBrass
      );
      crownTopCap.position.y = 0.38;
      crownGroup.add(crownTopCap);

      // Iconic Vintage Gumball Finial Orb & Spire
      const finialOrb = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 24, 24),
        this.matPolishedBrass
      );
      finialOrb.position.y = 0.56;
      crownGroup.add(finialOrb);

      const finialSpire = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.22, 16),
        this.matPolishedBrass
      );
      finialSpire.position.y = 0.76;
      crownGroup.add(finialSpire);
    }

    createCapsuleMesh(rarityKey, radius = this.ballRadius) {
      const tier = RARITY_TIERS[rarityKey] || RARITY_TIERS.rare;
      const group = new THREE.Group();

      // 1. Bottom Metallic/Pearlescent Hemisphere
      const bottomMat = new THREE.MeshStandardMaterial({
        color: tier.colorHex,
        roughness: 0.16,
        metalness: 0.55,
        envMapIntensity: 1.7
      });
      const bottomGeo = new THREE.SphereGeometry(radius, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      const bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
      group.add(bottomMesh);

      // 2. Equatorial Gold/Chrome Seam Ring
      const seamMat = new THREE.MeshStandardMaterial({
        color: 0xfde68a,
        roughness: 0.2,
        metalness: 0.9
      });
      const seamMesh = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.995, radius * 0.045, 10, 28),
        seamMat
      );
      seamMesh.rotation.x = Math.PI / 2;
      group.add(seamMesh);

      // 3. Top Translucent Glossy Dome
      const topMat = new THREE.MeshStandardMaterial({
        color: tier.secondaryHex,
        roughness: 0.08,
        metalness: 0.15,
        transparent: true,
        opacity: 0.76,
        envMapIntensity: 2.0
      });
      const topGeo = new THREE.SphereGeometry(radius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const topMesh = new THREE.Mesh(topGeo, topMat);
      group.add(topMesh);

      // 4. Inner Glowing Prize Core (Octahedron Gem visible inside the top dome!)
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: tier.colorHex,
        emissiveIntensity: 0.85,
        roughness: 0.1,
        metalness: 0.8
      });
      const coreMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(radius * 0.42, 0),
        coreMat
      );
      group.add(coreMesh);

      group.userData = {
        rarityKey,
        bottomMesh,
        topMesh,
        seamMesh,
        coreMesh
      };

      return group;
    }

    populateCapsules(count = 26) {
      const rarityKeys = ['legendary', 'epic', 'rare', 'classic', 'rare', 'epic'];
      this.balls = [];

      for (let i = 0; i < count; i++) {
        const rKey = rarityKeys[i % rarityKeys.length];
        const mesh = this.createCapsuleMesh(rKey, this.ballRadius);

        // Place inside lower-to-mid hemisphere of the glass dome
        const layer = Math.floor(i / 7);
        const angle = (i % 7) * ((Math.PI * 2) / 7) + layer * 0.45;
        const dist = 0.34 + (i % 3) * 0.28;
        const bx = Math.cos(angle) * dist;
        const bz = Math.sin(angle) * dist;
        const by = this.domeCenter.y - 0.65 + layer * 0.36 + (Math.random() - 0.5) * 0.08;

        mesh.position.set(bx, by, bz);
        mesh.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );

        this.machineGroup.add(mesh);

        this.balls.push({
          mesh,
          pos: mesh.position,
          vel: new THREE.Vector3(0, 0, 0),
          angVel: new THREE.Vector3(
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5
          ),
          rarityKey: rKey
        });
      }
    }

    buildHeroCapsule() {
      // Dedicated high-detail Hero Capsule used for Chute Drop -> Presentation -> Burst Reveal
      this.heroGroup = new THREE.Group();
      this.heroGroup.visible = false;
      this.scene.add(this.heroGroup);

      const r = 0.42;

      this.heroBottomMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        roughness: 0.14,
        metalness: 0.68,
        envMapIntensity: 2.0
      });
      this.heroBottomHalf = new THREE.Mesh(
        new THREE.SphereGeometry(r, 36, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        this.heroBottomMat
      );
      this.heroGroup.add(this.heroBottomHalf);

      // Inner hollow lip on bottom half
      const innerRim = new THREE.Mesh(
        new THREE.TorusGeometry(r * 0.98, r * 0.05, 14, 36),
        this.matPolishedBrass
      );
      innerRim.rotation.x = Math.PI / 2;
      this.heroBottomHalf.add(innerRim);

      this.heroTopMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.06,
        metalness: 0.15,
        transparent: true,
        opacity: 0.80,
        envMapIntensity: 2.2
      });
      this.heroTopHalf = new THREE.Mesh(
        new THREE.SphereGeometry(r, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2),
        this.heroTopMat
      );
      this.heroGroup.add(this.heroTopHalf);

      // Glowing 3D Prize Totem inside the Hero Capsule
      this.heroPrizeTotem = new THREE.Group();
      this.heroGroup.add(this.heroPrizeTotem);

      this.totemCoreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfbbf24,
        emissiveIntensity: 1.1,
        roughness: 0.08,
        metalness: 0.9
      });
      this.totemGem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.24, 1),
        this.totemCoreMat
      );
      this.heroPrizeTotem.add(this.totemGem);

      // Orbiting Golden Halo Ring around the Prize Totem
      this.totemHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.022, 12, 40),
        this.matPolishedBrass
      );
      this.heroPrizeTotem.add(this.totemHalo);

      // 3D Shockwave Ring on Burst
      this.shockwaveMat = new THREE.MeshBasicMaterial({
        color: 0xfde68a,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      this.shockwaveRing = new THREE.Mesh(
        new THREE.RingGeometry(0.35, 0.48, 48),
        this.shockwaveMat
      );
      this.heroGroup.add(this.shockwaveRing);
    }

    spawnBurstParticles(colorHex, secondaryHex) {
      // Clear any previous burst particles
      this.burstParticles.forEach(p => this.scene.remove(p.mesh));
      this.burstParticles = [];

      const geo = new THREE.OctahedronGeometry(0.055, 0);
      const colors = [colorHex, secondaryHex, 0xffffff, 0xfde047];

      for (let i = 0; i < 64; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: colors[i % colors.length],
          transparent: true,
          opacity: 1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(this.heroGroup.position);

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.6 + Math.random() * 3.8;

        const vel = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed + 0.8,
          Math.cos(phi) * speed * 0.65
        );

        this.scene.add(mesh);
        this.burstParticles.push({
          mesh,
          vel,
          rotSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
          ),
          life: 1.0,
          decay: 0.55 + Math.random() * 0.45
        });
      }
    }

    shakeGlobe(strength = 1.0) {
      this.sfx.playBallClatter(0.85 * strength);
      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];
        b.vel.x += (Math.random() - 0.5) * 6.5 * strength;
        b.vel.y += (1.8 + Math.random() * 4.2) * strength;
        b.vel.z += (Math.random() - 0.5) * 6.5 * strength;
      }
    }

    startVendingSequence(rewardObj) {
      if (this.state !== 'IDLE' && this.state !== 'CAPSULE_BURST_OPEN') return false;

      // Reset any open hero capsule state
      this.heroGroup.visible = false;
      this.flapPivot.rotation.x = 0;
      this.pendingReward = rewardObj;

      const tier = RARITY_TIERS[rewardObj.rarity] || RARITY_TIERS.rare;
      this.heroBottomMat.color.setHex(tier.colorHex);
      this.heroTopMat.color.setHex(tier.secondaryHex);
      this.totemCoreMat.emissive.setHex(tier.colorHex);
      this.shockwaveMat.color.setHex(tier.colorHex);

      // Prepare coin animation
      this.coinMesh.visible = true;
      this.coinMesh.position.set(-0.36, -0.18, 0.36);

      this.state = 'COIN_AND_CRANK';
      this.stateTimer = 0;
      this.lastRatchetStep = -1;
      this.sfx.playCoinInsert();

      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange(this.state, rewardObj);
      }
      return true;
    }

    triggerCapsuleBurstNow() {
      if (this.state !== 'HERO_PRESENTATION') return;
      this.state = 'CAPSULE_BURST_OPEN';
      this.stateTimer = 0;

      const tier = RARITY_TIERS[this.pendingReward?.rarity] || RARITY_TIERS.rare;
      this.sfx.playCapsuleBurstFanfare(tier.id);
      this.spawnBurstParticles(tier.colorHex, tier.secondaryHex);

      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange(this.state, this.pendingReward);
      }
      if (this.callbacks.onRewardRevealed && this.pendingReward) {
        this.callbacks.onRewardRevealed(this.pendingReward);
      }
    }

    resetToIdle() {
      this.state = 'IDLE';
      this.stateTimer = 0;
      this.heroGroup.visible = false;
      this.heroLight.intensity = 0;
      this.flapPivot.rotation.x = 0;
      this.crankGroup.rotation.z = 0;
      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange('IDLE', null);
      }
    }

    updatePhysics(dt) {
      const gravity = -16.5;
      const maxAllowableR = this.domeRadius - this.ballRadius - 0.04;
      const rodMinR = 0.075 + this.ballRadius;
      const isMixing = (this.state === 'COIN_AND_CRANK');

      // 1. Integrate velocities, gravity, and vortex mixing forces
      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];

        b.vel.y += gravity * dt;

        if (isMixing) {
          // Strong tangential vortex swirl + upward fountain lift from spinning agitator
          const dx = b.pos.x;
          const dz = b.pos.z;
          const distXZ = Math.sqrt(dx * dx + dz * dz) || 0.001;
          const tangX = -dz / distXZ;
          const tangZ = dx / distXZ;

          b.vel.x += (tangX * 14.5 + (Math.random() - 0.5) * 9.0) * dt;
          b.vel.z += (tangZ * 14.5 + (Math.random() - 0.5) * 9.0) * dt;
          if (b.pos.y < this.domeCenter.y - 0.15) {
            b.vel.y += (18.0 + Math.random() * 14.0) * dt;
          }
        }

        // Air damping
        const damping = isMixing ? 0.992 : 0.965;
        b.vel.multiplyScalar(damping);

        // Clamp max speed
        const speedSq = b.vel.lengthSq();
        if (speedSq > 64) {
          b.vel.multiplyScalar(8 / Math.sqrt(speedSq));
        }

        b.pos.addScaledVector(b.vel, dt);

        // Rotate capsule visually based on velocity
        b.mesh.rotation.x += (b.vel.z * 2.2 + b.angVel.x * 0.2) * dt;
        b.mesh.rotation.y += b.angVel.y * dt;
        b.mesh.rotation.z -= (b.vel.x * 2.2 + b.angVel.z * 0.2) * dt;

        // 2. Central vertical brass rod collision
        const rXZ = Math.sqrt(b.pos.x * b.pos.x + b.pos.z * b.pos.z);
        if (rXZ < rodMinR && rXZ > 0.0001) {
          const nx = b.pos.x / rXZ;
          const nz = b.pos.z / rXZ;
          b.pos.x = nx * rodMinR;
          b.pos.z = nz * rodMinR;
          const vn = b.vel.x * nx + b.vel.z * nz;
          if (vn < 0) {
            b.vel.x -= 1.5 * vn * nx;
            b.vel.z -= 1.5 * vn * nz;
          }
        }

        // 3. Floor collar plate inside globe (y >= 0.66)
        const minY = 0.68;
        if (b.pos.y < minY) {
          b.pos.y = minY;
          if (b.vel.y < 0) b.vel.y = -b.vel.y * 0.55;
        }

        // 4. Spherical Glass Dome Boundary Constraint
        const relX = b.pos.x - this.domeCenter.x;
        const relY = b.pos.y - this.domeCenter.y;
        const relZ = b.pos.z - this.domeCenter.z;
        const distFromCenter = Math.sqrt(relX * relX + relY * relY + relZ * relZ);

        if (distFromCenter > maxAllowableR && distFromCenter > 0.0001) {
          const nx = relX / distFromCenter;
          const ny = relY / distFromCenter;
          const nz = relZ / distFromCenter;

          b.pos.set(
            this.domeCenter.x + nx * maxAllowableR,
            this.domeCenter.y + ny * maxAllowableR,
            this.domeCenter.z + nz * maxAllowableR
          );

          const vn = b.vel.x * nx + b.vel.y * ny + b.vel.z * nz;
          if (vn > 0) {
            b.vel.x -= 1.62 * vn * nx;
            b.vel.y -= 1.62 * vn * ny;
            b.vel.z -= 1.62 * vn * nz;
          }
        }
      }

      // 5. Pairwise Sphere-to-Sphere Elastic Collisions (2 solver iterations for solid stacking)
      const minDist = this.ballRadius * 2.0;
      const minDistSq = minDist * minDist;

      for (let iter = 0; iter < 2; iter++) {
        for (let i = 0; i < this.balls.length; i++) {
          const b1 = this.balls[i];
          for (let j = i + 1; j < this.balls.length; j++) {
            const b2 = this.balls[j];
            const dx = b2.pos.x - b1.pos.x;
            const dy = b2.pos.y - b1.pos.y;
            const dz = b2.pos.z - b1.pos.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < minDistSq && distSq > 0.00001) {
              const dist = Math.sqrt(distSq);
              const overlap = (minDist - dist) * 0.52;
              const nx = dx / dist;
              const ny = dy / dist;
              const nz = dz / dist;

              b1.pos.x -= nx * overlap;
              b1.pos.y -= ny * overlap;
              b1.pos.z -= nz * overlap;
              b2.pos.x += nx * overlap;
              b2.pos.y += ny * overlap;
              b2.pos.z += nz * overlap;

              if (iter === 0) {
                const rvx = b2.vel.x - b1.vel.x;
                const rvy = b2.vel.y - b1.vel.y;
                const rvz = b2.vel.z - b1.vel.z;
                const velAlongNormal = rvx * nx + rvy * ny + rvz * nz;

                if (velAlongNormal < 0) {
                  const impulse = -(1 + 0.58) * velAlongNormal * 0.5;
                  b1.vel.x -= impulse * nx;
                  b1.vel.y -= impulse * ny;
                  b1.vel.z -= impulse * nz;
                  b2.vel.x += impulse * nx;
                  b2.vel.y += impulse * ny;
                  b2.vel.z += impulse * nz;
                }
              }
            }
          }
        }
      }
    }

    updateStateMachine(dt) {
      this.stateTimer += dt;

      // Update 3D burst particles if active
      for (let i = this.burstParticles.length - 1; i >= 0; i--) {
        const p = this.burstParticles[i];
        p.life -= p.decay * dt;
        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          this.burstParticles.splice(i, 1);
          continue;
        }
        p.vel.y -= 4.5 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.rotation.x += p.rotSpeed.x * dt;
        p.mesh.rotation.y += p.rotSpeed.y * dt;
        p.mesh.material.opacity = Math.max(0, p.life);
        const s = 0.5 + p.life * 0.8;
        p.mesh.scale.set(s, s, s);
      }

      if (this.state === 'IDLE') {
        // Smooth camera return to default with user orbit
        const targetX = Math.sin(this.userYaw) * 7.65;
        const targetZ = Math.cos(this.userYaw) * 7.65;
        const targetY = 0.72 + this.userPitch * 2.2;
        this.currentCamPos.lerp(new THREE.Vector3(targetX, targetY, targetZ), Math.min(1, dt * 6));
        this.currentLookAt.lerp(this.defaultLookAt, Math.min(1, dt * 6));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);
        return;
      }

      if (this.state === 'COIN_AND_CRANK') {
        const duration = 1.38;
        const t = Math.min(1, this.stateTimer / duration);

        // 1. Coin slides into brass slot in first 0.32s
        if (t < 0.25) {
          const ct = t / 0.25;
          this.coinMesh.position.z = 0.36 * (1 - ct);
        } else {
          this.coinMesh.visible = false;
        }

        // 2. Rotate Heavy Brass Crank 360 degrees with mechanical gear clicks
        const crankT = Math.max(0, Math.min(1, (t - 0.12) / 0.88));
        // Ease in-out cubic with slight mechanical step feel
        const easedCrank = crankT < 0.5
          ? 4 * crankT * crankT * crankT
          : 1 - Math.pow(-2 * crankT + 2, 3) / 2;

        this.crankGroup.rotation.z = -easedCrank * Math.PI * 2;
        this.agitatorGroup.rotation.y += dt * 14.0;

        const ratchetStep = Math.floor(easedCrank * 9);
        if (ratchetStep > this.lastRatchetStep && ratchetStep <= 8) {
          this.lastRatchetStep = ratchetStep;
          this.sfx.playRatchetClick(0.92 + ratchetStep * 0.03);
          if (ratchetStep % 2 === 0) this.sfx.playBallClatter(0.75);
        }

        // Camera zooms slightly toward the globe & crank
        this.targetYaw = 0;
        this.userYaw *= 0.88;
        this.currentCamPos.lerp(new THREE.Vector3(0, 0.65, 6.75), Math.min(1, dt * 5));
        this.currentLookAt.lerp(new THREE.Vector3(0, 0.35, 0), Math.min(1, dt * 5));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);

        if (this.stateTimer >= duration) {
          this.state = 'BALL_DROP_CHUTE';
          this.stateTimer = 0;
          this.crankGroup.rotation.z = 0;

          // Position hero capsule inside the chute behind the flap door
          this.heroGroup.visible = true;
          this.heroBottomHalf.position.set(0, 0, 0);
          this.heroBottomHalf.rotation.set(0, 0, 0);
          this.heroTopHalf.position.set(0, 0, 0);
          this.heroTopHalf.rotation.set(0, 0, 0);
          this.heroPrizeTotem.scale.set(0.55, 0.55, 0.55);
          this.shockwaveMat.opacity = 0;
          this.heroGroup.scale.set(0.62, 0.62, 0.62);
          this.heroGroup.position.set(0, -1.55, 0.85);
          this.sfx.playChuteDropAndDoor();
        }
        return;
      }

      if (this.state === 'BALL_DROP_CHUTE') {
        const duration = 0.82;
        const t = Math.min(1, this.stateTimer / duration);

        // Flap door gets kicked open by the capsule and swings down with spring bounce
        const flapAngle = t < 0.45
          ? -Math.sin((t / 0.45) * (Math.PI / 2)) * 1.28
          : -1.28 * Math.exp(-(t - 0.45) * 4.5) * Math.cos((t - 0.45) * 14);
        this.flapPivot.rotation.x = Math.min(0, flapAngle);

        // Capsule rolls out of the chute cavity into the front velvet tray
        const dropY = -1.55 - Math.sin(t * Math.PI) * 0.22 - t * 0.42;
        const dropZ = 0.85 + t * 0.72;
        this.heroGroup.position.set(0, dropY, dropZ);
        this.heroGroup.rotation.x += dt * 9.5;
        this.heroGroup.rotation.z += dt * 3.2;

        // Camera pans down slightly toward the dispenser tray
        this.currentCamPos.lerp(new THREE.Vector3(0, -0.35, 6.2), Math.min(1, dt * 6));
        this.currentLookAt.lerp(new THREE.Vector3(0, -1.25, 0.8), Math.min(1, dt * 6));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);

        if (this.stateTimer >= duration) {
          this.state = 'HERO_PRESENTATION';
          this.stateTimer = 0;
          this.sfx.playSuspenseCharge();
          if (this.callbacks.onStateChange) {
            this.callbacks.onStateChange(this.state, this.pendingReward);
          }
        }
        return;
      }

      if (this.state === 'HERO_PRESENTATION') {
        const flyDuration = 0.68;
        const t = Math.min(1, this.stateTimer / flyDuration);
        const easeOutBack = 1 + 1.8 * Math.pow(t - 1, 3) + 0.8 * Math.pow(t - 1, 2);

        // Fly from tray (0, -1.97, 1.57) to center camera stage (0, 0.52, 4.15)
        const targetPos = new THREE.Vector3(0, 0.52, 4.15);
        this.heroGroup.position.lerp(targetPos, Math.min(1, dt * 8.5));
        const sc = 0.62 + 0.48 * Math.min(1.12, easeOutBack);
        this.heroGroup.scale.set(sc, sc, sc);

        // Anticipation vibration + spinning before burst
        const vib = Math.min(1, this.stateTimer / 0.8) * 0.035;
        this.heroGroup.position.x = Math.sin(this.stateTimer * 55) * vib;
        this.heroGroup.rotation.y += dt * (4.5 + this.stateTimer * 6.0);
        this.heroGroup.rotation.x = Math.sin(this.stateTimer * 12) * 0.18;
        this.heroGroup.rotation.z = Math.cos(this.stateTimer * 15) * 0.14;

        // Slight seam separation showing inner glow
        const seamGap = Math.min(0.06, this.stateTimer * 0.05);
        this.heroTopHalf.position.y = seamGap;
        this.heroBottomHalf.position.y = -seamGap;

        this.heroLight.intensity = Math.min(2.6, this.stateTimer * 3.5);

        // Camera centers on the floating Hero Capsule
        this.currentCamPos.lerp(new THREE.Vector3(0, 0.55, 6.85), Math.min(1, dt * 6));
        this.currentLookAt.lerp(new THREE.Vector3(0, 0.35, 2.5), Math.min(1, dt * 6));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);

        // Auto-burst after 0.95s of dramatic buildup so the experience is seamless & thrilling!
        if (this.stateTimer >= 0.95) {
          this.triggerCapsuleBurstNow();
        }
        return;
      }

      if (this.state === 'CAPSULE_BURST_OPEN') {
        const t = Math.min(1, this.stateTimer / 0.75);
        const easeOut = 1 - Math.pow(1 - t, 3);

        // Keep Hero Group centered in upper-mid viewport so the Reveal Card fits cleanly below
        this.heroGroup.position.lerp(new THREE.Vector3(0, 0.92, 4.25), Math.min(1, dt * 7));
        this.heroGroup.rotation.set(0, 0, 0);

        // Top and Bottom Capsule Hemispheres fly apart and tilt dramatically
        this.heroTopHalf.position.set(-easeOut * 0.52, 0.42 + easeOut * 0.45, -easeOut * 0.25);
        this.heroTopHalf.rotation.set(-easeOut * 0.85, this.stateTimer * 1.8, easeOut * 0.65);

        this.heroBottomHalf.position.set(easeOut * 0.52, -0.42 - easeOut * 0.38, -easeOut * 0.25);
        this.heroBottomHalf.rotation.set(easeOut * 0.75, -this.stateTimer * 1.6, -easeOut * 0.55);

        // Central 3D Prize Totem expands and spins majestically
        const totemScale = 0.55 + easeOut * 0.75 + Math.sin(this.stateTimer * 4) * 0.05;
        this.heroPrizeTotem.scale.set(totemScale, totemScale, totemScale);
        this.totemGem.rotation.y += dt * 2.4;
        this.totemGem.rotation.x = Math.sin(this.stateTimer * 2.2) * 0.25;
        this.totemHalo.rotation.x = Math.PI / 3 + Math.sin(this.stateTimer * 1.7) * 0.3;
        this.totemHalo.rotation.y -= dt * 1.9;

        // Expanding 3D Shockwave Ring
        if (this.stateTimer < 0.55) {
          const swT = this.stateTimer / 0.55;
          const swScale = 1 + swT * 5.2;
          this.shockwaveRing.scale.set(swScale, swScale, 1);
          this.shockwaveMat.opacity = (1 - swT) * 0.9;
        } else {
          this.shockwaveMat.opacity = 0;
        }

        this.currentCamPos.lerp(new THREE.Vector3(0, 0.55, 6.85), Math.min(1, dt * 5));
        this.currentLookAt.lerp(new THREE.Vector3(0, 0.45, 2.5), Math.min(1, dt * 5));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);
      }
    }

    bindInteraction() {
      const onDown = (clientX, clientY) => {
        this.isDragging = true;
        this.dragStartX = clientX;
        this.dragStartY = clientY;
        this.downTime = performance.now();
      };

      const onMove = (clientX, clientY) => {
        if (!this.isDragging) return;
        const dx = clientX - this.dragStartX;
        const dy = clientY - this.dragStartY;
        this.dragStartX = clientX;
        this.dragStartY = clientY;

        this.userYaw = Math.max(-0.65, Math.min(0.65, this.userYaw - dx * 0.007));
        this.userPitch = Math.max(-0.25, Math.min(0.35, this.userPitch + dy * 0.005));
      };

      const onUp = (clientX, clientY) => {
        if (!this.isDragging) return;
        this.isDragging = false;
        const elapsed = performance.now() - (this.downTime || 0);
        if (elapsed < 260) {
          if (this.state === 'HERO_PRESENTATION') {
            this.triggerCapsuleBurstNow();
          } else if (this.state === 'IDLE') {
            this.shakeGlobe(0.85);
          }
        }
      };

      this.canvas.addEventListener('mousedown', e => onDown(e.clientX, e.clientY));
      window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
      window.addEventListener('mouseup', e => onUp(e.clientX, e.clientY));

      this.canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
          onDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      this.canvas.addEventListener('touchmove', e => {
        if (this.isDragging && e.touches.length === 1) {
          onMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      this.canvas.addEventListener('touchend', e => {
        onUp(0, 0);
      }, { passive: true });
    }

    resize() {
      if (!this.canvas || !this.renderer || !this.camera) return;
      const w = this.canvas.clientWidth || 340;
      const h = this.canvas.clientHeight || 420;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.resize();
      this.lastTime = performance.now();

      const loop = (now) => {
        if (!this.isRunning) return;
        this.rafId = requestAnimationFrame(loop);

        const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
        this.lastTime = now;

        this.updatePhysics(dt);
        this.updateStateMachine(dt);
        this.renderer.render(this.scene, this.camera);
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
  }

  window.VintageGachapon3D = VintageGachapon3D;
  window.GACHAPON_RARITY_TIERS = RARITY_TIERS;
  window.VINTAGE_STAGE_BACKGROUNDS = VINTAGE_STAGE_BACKGROUNDS;
})();
