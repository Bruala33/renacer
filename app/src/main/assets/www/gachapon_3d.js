/**
 * ============================================================================
 * HYPER-REALISTIC 3D VINTAGE GUMBALL MACHINE (THREE.JS PBR)
 * - Rock-Steady Sleeping Physics in IDLE (Zero Ball Vibration)
 * - Clean Non-Intersecting Geometry (No Body/Chute Clipping, Proper Lid & Lever)
 * - Balanced Deep Crimson, Brushed Brass & Chrome Studio Lighting
 * - Continuous Visible Ball Drop from Funnel -> Chute Window -> Dispenser Tray
 * ============================================================================
 */
(function () {
  'use strict';

  const RARITY_TIERS = {
    legendary: {
      id: 'legendary',
      label: '★ LEGENDARIO ★',
      colorHex: 0xd97706,
      secondaryHex: 0xfbbf24,
      cssColor: '#fbbf24',
      glowCss: 'rgba(251, 191, 36, 0.65)',
      badgeBg: 'linear-gradient(135deg, #f59e0b 0%, #fde047 50%, #d97706 100%)',
      badgeText: '#1c1002'
    },
    epic: {
      id: 'epic',
      label: '◆ ÉPICO ◆',
      colorHex: 0xbe123c,
      secondaryHex: 0x9333ea,
      cssColor: '#f43f5e',
      glowCss: 'rgba(244, 63, 94, 0.55)',
      badgeBg: 'linear-gradient(135deg, #be123c 0%, #f43f5e 50%, #9333ea 100%)',
      badgeText: '#ffffff'
    },
    rare: {
      id: 'rare',
      label: '● RARO ●',
      colorHex: 0x047857,
      secondaryHex: 0x10b981,
      cssColor: '#34d399',
      glowCss: 'rgba(52, 211, 153, 0.50)',
      badgeBg: 'linear-gradient(135deg, #047857 0%, #10b981 50%, #0d9488 100%)',
      badgeText: '#ffffff'
    },
    classic: {
      id: 'classic',
      label: '✦ CLÁSICO ✦',
      colorHex: 0x0369a1,
      secondaryHex: 0x38bdf8,
      cssColor: '#7dd3fc',
      glowCss: 'rgba(56, 189, 248, 0.45)',
      badgeBg: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 50%, #475569 100%)',
      badgeText: '#ffffff'
    }
  };

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
      return Math.max(0.05, Math.min(1.0, isNaN(vol) ? 0.8 : vol)) * 0.48;
    }

    playCoinAndLeverStart() {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = this.getMasterGain();

      [2200, 3350, 4680].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.03);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.03, now + i * 0.03 + 0.12);
        gain.gain.setValueAtTime(vol * (0.42 - i * 0.1), now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + i * 0.03 + 0.16);
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
      osc.frequency.setValueAtTime(195 * pitchScale, now);
      osc.frequency.exponentialRampToValueAtTime(58 * pitchScale, now + 0.042);
      gain.gain.setValueAtTime(vol * 0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.046);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }

    playBallRollClack(intensity = 0.5) {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = this.getMasterGain() * Math.min(1, intensity);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 420 + Math.random() * 280;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, now + 0.038);
      gain.gain.setValueAtTime(vol * 0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    }

    playChuteBounceAndDoor() {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = this.getMasterGain();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(155, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
      gain.gain.setValueAtTime(vol * 0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);

      const flapOsc = ctx.createOscillator();
      const flapGain = ctx.createGain();
      flapOsc.type = 'triangle';
      flapOsc.frequency.setValueAtTime(820, now + 0.04);
      flapOsc.frequency.exponentialRampToValueAtTime(260, now + 0.15);
      flapGain.gain.setValueAtTime(vol * 0.28, now + 0.04);
      flapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      flapOsc.connect(flapGain);
      flapGain.connect(ctx.destination);
      flapOsc.start(now + 0.04);
      flapOsc.stop(now + 0.17);
    }

    playCapsuleBurstFanfare(rarityId = 'rare') {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = this.getMasterGain();

      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(390, now);
      popOsc.frequency.exponentialRampToValueAtTime(62, now + 0.16);
      popGain.gain.setValueAtTime(vol * 0.85, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      popOsc.connect(popGain);
      popGain.connect(ctx.destination);
      popOsc.start(now);
      popOsc.stop(now + 0.19);

      const chords = {
        classic: [523.25, 659.25, 783.99, 1046.50],
        rare: [523.25, 659.25, 783.99, 987.77, 1318.51],
        epic: [440.0, 554.37, 659.25, 880.0, 1108.73, 1318.51],
        legendary: [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]
      };
      const notes = chords[rarityId] || chords.rare;

      notes.forEach((freq, idx) => {
        const delay = idx * 0.06;
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        sub.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        sub.frequency.setValueAtTime(freq * 2, now + delay);

        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.linearRampToValueAtTime(vol * 0.34, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + delay + 0.9);

        osc.connect(gain);
        sub.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        sub.start(now + delay);
        osc.stop(now + delay + 0.95);
        sub.stop(now + delay + 0.95);
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

      // States: 'IDLE' | 'LEVER_PULL_AND_TUMBLE' | 'BALL_VISIBLE_FALL' | 'HERO_PRESENTATION' | 'CAPSULE_BURST_OPEN'
      this.state = 'IDLE';
      this.stateTimer = 0;
      this.pendingReward = null;
      this.lastRatchetStep = -1;
      this.physicsSettlingTimer = 0;

      // Camera & Orbit state
      this.userYaw = 0;
      this.userPitch = 0.02;
      this.isDraggingOrbit = false;
      this.isPullingLeverDrag = false;
      this.leverPullProgress = 0;
      this.dragStartX = 0;
      this.dragStartY = 0;

      // Raycaster for 3D Lever interaction
      this.raycaster = new THREE.Raycaster();
      this.pointerNDC = new THREE.Vector2();
      this.leverInteractables = [];

      // Physics balls inside the glass globe
      this.balls = [];
      this.droppingBall = null;
      this.domeCenter = new THREE.Vector3(0, 1.48, 0);
      this.domeRadius = 1.32;
      this.ballRadius = 0.235;

      // 3D Burst particles
      this.burstParticles = [];

      this.initScene();
      this.buildMaterials();
      this.buildMachineMesh();
      this.populateCapsules(28);
      this.preSettleBalls();
      this.buildHeroOpenAssembly();
      this.bindInteraction();
    }

    initScene() {
      const w = this.canvas.clientWidth || window.innerWidth || 380;
      const h = this.canvas.clientHeight || window.innerHeight || 680;

      this.scene = new THREE.Scene();

      const aspect = w / Math.max(1, h);
      const fov = aspect < 0.65 ? 45 : 38;
      this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 50);
      this.defaultCamPos = new THREE.Vector3(0, 0.36, aspect < 0.65 ? 8.55 : 7.65);
      this.defaultLookAt = new THREE.Vector3(0, 0.18, 0);
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
        // Balanced exposure so reds stay rich crimson and metals don't wash out!
        this.renderer.toneMappingExposure = 0.92;
      }
      if (THREE.sRGBEncoding !== undefined) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }

      this.createStudioEnvironment();

      // Balanced Studio Lighting (No washed-out overexposure)
      const ambient = new THREE.AmbientLight(0xffe8cc, 0.36);
      this.scene.add(ambient);

      this.keyLight = new THREE.DirectionalLight(0xfff5e6, 1.15);
      this.keyLight.position.set(4.2, 7.5, 5.8);
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.width = 1024;
      this.keyLight.shadow.mapSize.height = 1024;
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 20;
      const d = 3.6;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0012;
      this.scene.add(this.keyLight);

      // Warm Golden Rim Light from Left
      this.rimLight = new THREE.PointLight(0xf59e0b, 0.95, 14);
      this.rimLight.position.set(-4.2, 3.0, -2.0);
      this.scene.add(this.rimLight);

      // Subtle Cool Fill from Right
      this.fillLight = new THREE.PointLight(0x38bdf8, 0.55, 14);
      this.fillLight.position.set(4.5, 1.5, 3.2);
      this.scene.add(this.fillLight);

      // Soft Chute Light so the falling ball is clearly visible in the front window
      this.chuteLight = new THREE.PointLight(0xffdfa0, 0.75, 2.8);
      this.chuteLight.position.set(0, -0.55, 1.55);
      this.scene.add(this.chuteLight);

      // Hero Reveal Light
      this.heroLight = new THREE.PointLight(0xffffff, 0, 8);
      this.heroLight.position.set(0, 0.9, 4.8);
      this.scene.add(this.heroLight);
    }

    createStudioEnvironment() {
      try {
        if (!THREE.PMREMGenerator) return;
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileCubemapShader();

        const envScene = new THREE.Scene();
        // Dark studio environment so metallic reflections have deep contrast
        envScene.background = new THREE.Color(0x060305);

        const topBox = new THREE.Mesh(
          new THREE.PlaneGeometry(8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffe4b5, side: THREE.DoubleSide })
        );
        topBox.position.set(0, 8.0, 0);
        topBox.rotation.x = Math.PI / 2;
        envScene.add(topBox);

        const leftStrip = new THREE.Mesh(
          new THREE.PlaneGeometry(2.8, 9),
          new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
        );
        leftStrip.position.set(-7.0, 2.0, 2.0);
        leftStrip.lookAt(0, 0, 0);
        envScene.add(leftStrip);

        const rightStrip = new THREE.Mesh(
          new THREE.PlaneGeometry(2.5, 9),
          new THREE.MeshBasicMaterial({ color: 0x94a3b8, side: THREE.DoubleSide })
        );
        rightStrip.position.set(7.0, 2.2, 2.5);
        rightStrip.lookAt(0, 0, 0);
        envScene.add(rightStrip);

        const envRT = pmremGenerator.fromScene(envScene, 0.04);
        this.scene.environment = envRT.texture;
        pmremGenerator.dispose();
      } catch (e) {
        console.warn('[Gachapon3D] Environment fallback:', e);
      }
    }

    createCastIronMicroBump() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 256, 256);

      for (let i = 0; i < 500; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = 2 + Math.random() * 5;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const shade = Math.random() > 0.5 ? 144 : 116;
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
      tex.repeat.set(4, 4);
      return tex;
    }

    createCoinPlateTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 512, 256);
      grad.addColorStop(0, '#170f09');
      grad.addColorStop(0.5, '#2b1c10');
      grad.addColorStop(1, '#120b06');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      // Ornate double brass frame with generous padding so text never clips
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 10;
      ctx.strokeRect(16, 16, 480, 224);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 452, 196);

      ctx.fillStyle = '#fde047';
      ctx.font = '900 68px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('100 𝄞', 256, 108);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('TIRA DE LA PALANCA ➔', 256, 182);

      return new THREE.CanvasTexture(c);
    }

    buildMaterials() {
      const bumpTex = this.createCastIronMicroBump();
      const PhysicalMat = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;

      // 1. Deep Vintage Crimson Automotive Lacquer (Rich dark red, never baby pink!)
      this.matCrimsonEnamel = new PhysicalMat({
        color: 0x7f0914,
        roughness: 0.20,
        metalness: 0.18,
        clearcoat: 0.85,
        clearcoatRoughness: 0.08,
        bumpMap: bumpTex,
        bumpScale: 0.005,
        envMapIntensity: 1.05
      });

      // 2. Heavy Cast-Iron Matte Gunmetal Base
      this.matCastIronBase = new THREE.MeshStandardMaterial({
        color: 0x111318,
        roughness: 0.48,
        metalness: 0.75,
        bumpMap: bumpTex,
        bumpScale: 0.012,
        envMapIntensity: 0.9
      });

      // 3. Black Vulcanized Rubber Gasket
      this.matRubberGasket = new THREE.MeshStandardMaterial({
        color: 0x090a0c,
        roughness: 0.88,
        metalness: 0.05
      });

      // 4. Polished Dark-Contrast Chrome
      this.matMirrorChrome = new PhysicalMat({
        color: 0xcbd5e1,
        roughness: 0.12,
        metalness: 0.92,
        clearcoat: 0.5,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.35
      });

      // 5. Antique Brushed Brass / Gold
      this.matPolishedBrass = new PhysicalMat({
        color: 0xd97706,
        roughness: 0.22,
        metalness: 0.88,
        clearcoat: 0.35,
        envMapIntensity: 1.25
      });

      // 6. Glossy Deep Ruby Bakelite Lever Ball
      this.matLeverKnob = new PhysicalMat({
        color: 0x991b1b,
        emissive: 0x2a0404,
        emissiveIntensity: 0.25,
        roughness: 0.10,
        metalness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        envMapIntensity: 1.3
      });

      // 7. Crystal Clear Glass Globe (Clean transparency without cloudy grey fill)
      this.matGlassOuter = new PhysicalMat({
        color: 0xe0f2fe,
        roughness: 0.04,
        metalness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        transparent: true,
        opacity: 0.13,
        envMapIntensity: 1.4,
        depthWrite: false,
        side: THREE.FrontSide
      });

      // 8. Dark Velvet Chute Interior
      this.matDarkCavity = new THREE.MeshStandardMaterial({
        color: 0x090406,
        roughness: 0.92,
        metalness: 0.05
      });
    }

    buildMachineMesh() {
      this.machineGroup = new THREE.Group();
      this.machineGroup.position.set(0, -0.36, 0);
      this.scene.add(this.machineGroup);

      // ======================================================================
      // A. HEAVY STEPPED CAST-IRON & CHROME PEDESTAL BASE (y: -2.38 to -1.92)
      // ======================================================================
      const rubberPad = new THREE.Mesh(
        new THREE.CylinderGeometry(1.48, 1.54, 0.10, 64),
        this.matRubberGasket
      );
      rubberPad.position.y = -2.35;
      rubberPad.receiveShadow = true;
      this.machineGroup.add(rubberPad);

      const castBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.32, 1.46, 0.28, 64),
        this.matCastIronBase
      );
      castBase.position.y = -2.17;
      castBase.castShadow = true;
      castBase.receiveShadow = true;
      this.machineGroup.add(castBase);

      const baseChromeRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.31, 0.05, 20, 64),
        this.matMirrorChrome
      );
      baseChromeRing.rotation.x = Math.PI / 2;
      baseChromeRing.position.y = -2.02;
      this.machineGroup.add(baseChromeRing);

      // ======================================================================
      // B. CONTOURED CRIMSON CAST-IRON BODY (Radius kept <= 0.98 at waist so
      //    it NEVER pokes through the front chute housing at z = 1.06!)
      // ======================================================================
      const lathePoints = [
        new THREE.Vector2(1.30, -2.02),
        new THREE.Vector2(1.18, -1.72),
        new THREE.Vector2(0.96, -1.25),
        new THREE.Vector2(0.92, -0.65),
        new THREE.Vector2(0.98, -0.10),
        new THREE.Vector2(1.14, 0.18),
        new THREE.Vector2(1.22, 0.28)
      ];
      const bodyGeo = new THREE.LatheGeometry(lathePoints, 64);
      const bodyMesh = new THREE.Mesh(bodyGeo, this.matCrimsonEnamel);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      this.machineGroup.add(bodyMesh);

      // Sleek horizontal brass belt molding around the waist (r = 0.935)
      const waistBrassBelt = new THREE.Mesh(
        new THREE.TorusGeometry(0.935, 0.028, 16, 64),
        this.matPolishedBrass
      );
      waistBrassBelt.rotation.x = Math.PI / 2;
      waistBrassBelt.position.y = -0.82;
      this.machineGroup.add(waistBrassBelt);

      // ======================================================================
      // C. CHROME NECK COLLAR, RUBBER GASKET & INTERNAL FUNNEL FLOOR
      // ======================================================================
      const collarMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.24, 1.20, 0.22, 64),
        this.matMirrorChrome
      );
      collarMesh.position.y = 0.34;
      collarMesh.castShadow = true;
      this.machineGroup.add(collarMesh);

      const globeGasket = new THREE.Mesh(
        new THREE.TorusGeometry(1.20, 0.042, 16, 64),
        this.matRubberGasket
      );
      globeGasket.rotation.x = Math.PI / 2;
      globeGasket.position.y = 0.45;
      this.machineGroup.add(globeGasket);

      // Internal Sloped Brass Funnel Floor at bottom of glass globe
      const funnelFloor = new THREE.Mesh(
        new THREE.CylinderGeometry(1.14, 0.88, 0.10, 48),
        this.matPolishedBrass
      );
      funnelFloor.position.y = 0.48;
      this.machineGroup.add(funnelFloor);

      // Real Dark Circular Drop Aperture at front-bottom of globe (x=0, z=0.54)
      const dropApertureHole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.29, 0.27, 0.14, 32),
        this.matDarkCavity
      );
      dropApertureHole.position.set(0, 0.49, 0.54);
      this.machineGroup.add(dropApertureHole);

      // ======================================================================
      // D. UNIFIED FRONT CHROME ESCUTCHEON, VISIBLE GLASS CHUTE & OUTLET
      //    (Positioned cleanly at z = 1.05..1.30, 100% outside the crimson waist!)
      // ======================================================================
      const frontAssembly = new THREE.Group();
      this.machineGroup.add(frontAssembly);

      // Solid Chrome Outer Housing Column spanning from y = +0.18 down to y = -1.96
      // Left Wall, Right Wall, Top Header, Bottom Sill, and Recessed Dark Back Wall
      const housingBackWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.74, 2.12, 0.18),
        this.matDarkCavity
      );
      housingBackWall.position.set(0, -0.89, 1.03);
      frontAssembly.add(housingBackWall);

      [-0.40, 0.40].forEach(xSide => {
        const sidePillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, 2.14, 0.30),
          this.matMirrorChrome
        );
        sidePillar.position.set(xSide, -0.89, 1.12);
        sidePillar.castShadow = true;
        frontAssembly.add(sidePillar);
      });

      // Upper Price Escutcheon Plate ("100 𝄞") seated cleanly below the neck collar
      const topHeaderBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.89, 0.44, 0.30),
        this.matMirrorChrome
      );
      topHeaderBlock.position.set(0, -0.04, 1.13);
      topHeaderBlock.castShadow = true;
      frontAssembly.add(topHeaderBlock);

      const coinPlateTex = this.createCoinPlateTexture();
      const coinPlateFace = new THREE.Mesh(
        new THREE.PlaneGeometry(0.78, 0.36),
        new THREE.MeshStandardMaterial({
          map: coinPlateTex,
          roughness: 0.24,
          metalness: 0.75
        })
      );
      coinPlateFace.position.set(0, -0.04, 1.285);
      frontAssembly.add(coinPlateFace);

      // Middle Glass Inspection Window (y = -0.26 down to -1.32) where you watch the ball drop!
      const chuteWindowGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(0.70, 1.06),
        this.matGlassOuter
      );
      chuteWindowGlass.position.set(0, -0.79, 1.24);
      frontAssembly.add(chuteWindowGlass);

      // Brass horizontal divider bar between inspection window and lower outlet door
      const chuteDividerBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 0.07, 0.31),
        this.matPolishedBrass
      );
      chuteDividerBar.position.set(0, -1.34, 1.13);
      frontAssembly.add(chuteDividerBar);

      // Lower Dispenser Alcove & Symmetrical Recessed Tray Floor (y = -1.38 down to -1.96)
      const bottomTraySill = new THREE.Mesh(
        new THREE.BoxGeometry(0.90, 0.12, 0.44),
        this.matMirrorChrome
      );
      bottomTraySill.position.set(0, -1.90, 1.20);
      bottomTraySill.castShadow = true;
      frontAssembly.add(bottomTraySill);

      const bottomBrassLip = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.06, 0.08),
        this.matPolishedBrass
      );
      bottomBrassLip.position.set(0, -1.85, 1.40);
      frontAssembly.add(bottomBrassLip);

      // Hinged Swinging Chrome Flap Door inside the lower dispenser opening
      this.flapPivot = new THREE.Group();
      this.flapPivot.position.set(0, -1.37, 1.24);
      frontAssembly.add(this.flapPivot);

      const flapDoorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.44, 0.035),
        this.matMirrorChrome
      );
      flapDoorMesh.position.set(0, -0.22, 0);
      this.flapPivot.add(flapDoorMesh);

      // ======================================================================
      // E. CLEAN PROPORTIONAL 3D MECHANICAL LEVER ("PALANCA") ON THE RIGHT
      //    (No shaft poking out the bottom, no knob overlapping the globe!)
      // ======================================================================
      this.leverMountGroup = new THREE.Group();
      this.leverMountGroup.position.set(0.96, -0.62, 0.52);
      this.leverMountGroup.rotation.y = -0.22;
      this.machineGroup.add(this.leverMountGroup);

      // Chrome Gearbox Cylinder attached flush to the crimson body
      const gearboxHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.28, 0.34, 32),
        this.matMirrorChrome
      );
      gearboxHousing.rotation.z = Math.PI / 2;
      gearboxHousing.castShadow = true;
      this.leverMountGroup.add(gearboxHousing);

      const gearboxBrassCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.38, 24),
        this.matPolishedBrass
      );
      gearboxBrassCap.rotation.z = Math.PI / 2;
      this.leverMountGroup.add(gearboxBrassCap);

      // Rotating Lever Pivot
      this.leverPivot = new THREE.Group();
      this.leverPivot.position.set(0.18, 0, 0);
      this.leverRestAngle = -0.22;
      this.leverPivot.rotation.x = this.leverRestAngle;
      this.leverMountGroup.add(this.leverPivot);

      // Rounded Chrome Hub Joint so the shaft starts cleanly at the center of the gearbox!
      const leverHubJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 20, 20),
        this.matMirrorChrome
      );
      this.leverPivot.add(leverHubJoint);

      // Forged Chrome Lever Arm extending strictly UPWARD from the hub (0 to +0.76)
      const armLen = 0.76;
      const leverShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.068, armLen, 24),
        this.matMirrorChrome
      );
      // Offset by +armLen/2 so bottom of cylinder sits at (0,0,0) inside leverHubJoint!
      leverShaft.position.set(0, armLen * 0.5, 0.08);
      leverShaft.rotation.x = 0.20;
      leverShaft.castShadow = true;
      this.leverPivot.add(leverShaft);

      // Brass Neck Collar under the Grip Ball
      const knobCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.082, 0.055, 0.09, 24),
        this.matPolishedBrass
      );
      knobCollar.position.set(0, 0.77, 0.16);
      knobCollar.rotation.x = 0.20;
      this.leverPivot.add(knobCollar);

      // Glossy Spherical Grip Knob (sits cleanly at y ≈ +0.28 world space, well below the globe!)
      this.leverKnobMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 32, 32),
        this.matLeverKnob
      );
      this.leverKnobMesh.position.set(0, 0.92, 0.19);
      this.leverKnobMesh.castShadow = true;
      this.leverPivot.add(this.leverKnobMesh);

      const knobGoldRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.192, 0.018, 14, 32),
        this.matPolishedBrass
      );
      knobGoldRing.position.copy(this.leverKnobMesh.position);
      knobGoldRing.rotation.x = Math.PI / 2;
      this.leverPivot.add(knobGoldRing);

      // Invisible Raycast Hit Targets for effortless touch/click on the lever
      const leverHitBox = new THREE.Mesh(
        new THREE.SphereGeometry(0.68, 12, 12),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      leverHitBox.position.set(0, 0.55, 0.15);
      this.leverPivot.add(leverHitBox);

      const frontPlateHitBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.8, 0.5),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      frontPlateHitBox.position.set(0, -0.05, 1.25);
      this.machineGroup.add(frontPlateHitBox);

      this.leverInteractables = [
        this.leverKnobMesh,
        leverShaft,
        knobCollar,
        gearboxHousing,
        leverHitBox,
        frontPlateHitBox,
        coinPlateFace
      ];

      // ======================================================================
      // F. CRYSTAL GLASS GLOBE & AGITATOR WHEEL
      // ======================================================================
      // Central Chrome Rod spanning strictly from funnel floor (y=0.48) to lid cap (y=2.62)
      const rodHeight = 2.16;
      const centerRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.036, rodHeight, 20),
        this.matMirrorChrome
      );
      centerRod.position.set(0, 0.48 + rodHeight * 0.5, 0);
      this.machineGroup.add(centerRod);

      // Internal Rotating Agitator Wheel at bottom of globe
      this.agitatorGroup = new THREE.Group();
      this.agitatorGroup.position.set(0, 0.53, 0);
      this.machineGroup.add(this.agitatorGroup);

      for (let i = 0; i < 4; i++) {
        const paddle = new THREE.Mesh(
          new THREE.BoxGeometry(0.72, 0.07, 0.04),
          this.matMirrorChrome
        );
        const a = (i / 4) * Math.PI * 2;
        paddle.rotation.y = a;
        paddle.position.set(Math.cos(a) * 0.34, 0.03, Math.sin(a) * 0.34);
        this.agitatorGroup.add(paddle);
      }

      // Outer Optical Crystal Glass Globe
      this.glassGlobeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(this.domeRadius, 56, 40),
        this.matGlassOuter
      );
      this.glassGlobeMesh.position.copy(this.domeCenter);
      this.glassGlobeMesh.renderOrder = 2;
      this.machineGroup.add(this.glassGlobeMesh);

      // Crisp Curved Specular Studio Highlight on Left-Front of Glass Globe
      const highlightGeo = new THREE.SphereGeometry(
        this.domeRadius * 1.002,
        36,
        28,
        -Math.PI * 0.35,
        Math.PI * 0.16,
        Math.PI * 0.22,
        Math.PI * 0.46
      );
      const glassHighlight = new THREE.Mesh(
        highlightGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.18,
          side: THREE.FrontSide,
          depthWrite: false
        })
      );
      glassHighlight.position.copy(this.domeCenter);
      glassHighlight.renderOrder = 3;
      this.machineGroup.add(glassHighlight);

      // ======================================================================
      // G. FLUSH-FITTED CRIMSON & CHROME DOME LID CAP (Seated at y = 2.58,
      //    matching the exact sphere radius 0.73 at that height!)
      // ======================================================================
      const crownGroup = new THREE.Group();
      crownGroup.position.set(0, 2.58, 0);
      this.machineGroup.add(crownGroup);

      const lidGasket = new THREE.Mesh(
        new THREE.TorusGeometry(0.73, 0.036, 16, 48),
        this.matRubberGasket
      );
      lidGasket.rotation.x = Math.PI / 2;
      crownGroup.add(lidGasket);

      const lidChromeRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.74, 0.044, 16, 48),
        this.matMirrorChrome
      );
      lidChromeRim.rotation.x = Math.PI / 2;
      lidChromeRim.position.y = 0.03;
      crownGroup.add(lidChromeRim);

      // Spherical-cap style lid dome that follows the top curve of the globe
      const lidDome = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.74, 0.24, 48),
        this.matCrimsonEnamel
      );
      lidDome.position.y = 0.15;
      crownGroup.add(lidDome);

      const lockNutBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.28, 0.09, 32),
        this.matPolishedBrass
      );
      lockNutBase.position.y = 0.31;
      crownGroup.add(lockNutBase);

      const finialKnob = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 24, 24),
        this.matPolishedBrass
      );
      finialKnob.position.y = 0.42;
      crownGroup.add(finialKnob);
    }

    createCapsuleMesh(rarityKey, radius = this.ballRadius) {
      const tier = RARITY_TIERS[rarityKey] || RARITY_TIERS.rare;
      const group = new THREE.Group();
      const PhysicalMat = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;

      // 1. Bottom Jewel-Toned Metallic Hemisphere
      const bottomMat = new PhysicalMat({
        color: tier.colorHex,
        roughness: 0.16,
        metalness: 0.38,
        clearcoat: 0.9,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.15
      });
      const bottomGeo = new THREE.SphereGeometry(radius, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      const bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
      group.add(bottomMesh);

      // 2. Equatorial Gold Seam Ring
      const seamMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        roughness: 0.22,
        metalness: 0.85
      });
      const seamMesh = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.995, radius * 0.035, 10, 28),
        seamMat
      );
      seamMesh.rotation.x = Math.PI / 2;
      group.add(seamMesh);

      // 3. Top Translucent Tinted Hemisphere
      const topMat = new PhysicalMat({
        color: tier.secondaryHex,
        roughness: 0.08,
        metalness: 0.08,
        clearcoat: 0.9,
        transparent: true,
        opacity: 0.78,
        envMapIntensity: 1.25
      });
      const topGeo = new THREE.SphereGeometry(radius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const topMesh = new THREE.Mesh(topGeo, topMat);
      group.add(topMesh);

      // 4. Inner Core Gem
      const coreMat = new THREE.MeshStandardMaterial({
        color: tier.secondaryHex,
        emissive: tier.colorHex,
        emissiveIntensity: 0.45,
        roughness: 0.15,
        metalness: 0.7
      });
      const coreMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(radius * 0.38, 0),
        coreMat
      );
      group.add(coreMesh);

      group.userData = {
        rarityKey,
        bottomMat,
        topMat,
        coreMat
      };

      return group;
    }

    populateCapsules(count = 28) {
      const rarityKeys = ['legendary', 'epic', 'rare', 'classic', 'rare', 'epic'];
      this.balls = [];

      for (let i = 0; i < count; i++) {
        const rKey = rarityKeys[i % rarityKeys.length];
        const mesh = this.createCapsuleMesh(rKey, this.ballRadius);

        const layer = Math.floor(i / 7);
        const angle = (i % 7) * ((Math.PI * 2) / 7) + layer * 0.45;
        const dist = 0.28 + (i % 3) * 0.27;
        const bx = Math.cos(angle) * dist;
        const bz = Math.sin(angle) * dist;
        const by = 0.72 + layer * 0.32;

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
          rarityKey: rKey,
          isDropping: false
        });
      }
    }

    preSettleBalls() {
      // Run 90 silent physics steps on initialization so balls rest in a stable equilibrium pile,
      // then freeze velocities so they NEVER vibrate in IDLE!
      for (let step = 0; step < 90; step++) {
        this.stepPhysicsInternal(0.016, false);
      }
      for (let i = 0; i < this.balls.length; i++) {
        this.balls[i].vel.set(0, 0, 0);
      }
    }

    buildHeroOpenAssembly() {
      this.heroGroup = new THREE.Group();
      this.heroGroup.visible = false;
      this.scene.add(this.heroGroup);

      const r = 0.38;
      const PhysicalMat = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;

      this.heroBottomMat = new PhysicalMat({
        color: 0xd97706,
        roughness: 0.14,
        metalness: 0.45,
        clearcoat: 0.9,
        envMapIntensity: 1.3
      });
      this.heroBottomHalf = new THREE.Mesh(
        new THREE.SphereGeometry(r, 36, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        this.heroBottomMat
      );
      this.heroGroup.add(this.heroBottomHalf);

      const innerRim = new THREE.Mesh(
        new THREE.TorusGeometry(r * 0.98, r * 0.042, 14, 36),
        this.matPolishedBrass
      );
      innerRim.rotation.x = Math.PI / 2;
      this.heroBottomHalf.add(innerRim);

      this.heroTopMat = new PhysicalMat({
        color: 0x38bdf8,
        roughness: 0.06,
        metalness: 0.10,
        clearcoat: 0.9,
        transparent: true,
        opacity: 0.80,
        envMapIntensity: 1.4
      });
      this.heroTopHalf = new THREE.Mesh(
        new THREE.SphereGeometry(r, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2),
        this.heroTopMat
      );
      this.heroGroup.add(this.heroTopHalf);

      this.heroPrizeTotem = new THREE.Group();
      this.heroGroup.add(this.heroPrizeTotem);

      this.totemCoreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfbbf24,
        emissiveIntensity: 0.95,
        roughness: 0.1,
        metalness: 0.85
      });
      this.totemGem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.22, 1),
        this.totemCoreMat
      );
      this.heroPrizeTotem.add(this.totemGem);

      this.totemHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.31, 0.02, 12, 40),
        this.matPolishedBrass
      );
      this.heroPrizeTotem.add(this.totemHalo);

      this.shockwaveMat = new THREE.MeshBasicMaterial({
        color: 0xfde68a,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      this.shockwaveRing = new THREE.Mesh(
        new THREE.RingGeometry(0.32, 0.44, 48),
        this.shockwaveMat
      );
      this.heroGroup.add(this.shockwaveRing);
    }

    spawnBurstParticles(colorHex, secondaryHex) {
      this.burstParticles.forEach(p => this.scene.remove(p.mesh));
      this.burstParticles = [];

      const geo = new THREE.OctahedronGeometry(0.05, 0);
      const colors = [colorHex, secondaryHex, 0xffffff, 0xfde047];

      for (let i = 0; i < 56; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: colors[i % colors.length],
          transparent: true,
          opacity: 1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(this.heroGroup.position);

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.5 + Math.random() * 3.4;

        const vel = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed + 0.7,
          Math.cos(phi) * speed * 0.6
        );

        this.scene.add(mesh);
        this.burstParticles.push({
          mesh,
          vel,
          rotSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 9,
            (Math.random() - 0.5) * 9,
            (Math.random() - 0.5) * 9
          ),
          life: 1.0,
          decay: 0.60 + Math.random() * 0.40
        });
      }
    }

    shakeGlobe(strength = 0.5) {
      this.sfx.playBallRollClack(0.6 * strength);
      this.physicsSettlingTimer = 0.65;
      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];
        if (b.isDropping) continue;
        b.vel.x += (Math.random() - 0.5) * 2.4 * strength;
        b.vel.z += (Math.random() - 0.5) * 2.4 * strength;
      }
    }

    startVendingSequence(rewardObj) {
      if (this.state !== 'IDLE' && this.state !== 'CAPSULE_BURST_OPEN') return false;

      if (this.droppingBall) {
        this.droppingBall.isDropping = false;
        this.droppingBall.mesh.visible = true;
        this.droppingBall.mesh.scale.set(1, 1, 1);
        this.droppingBall.pos.set((Math.random() - 0.5) * 0.35, 1.38, (Math.random() - 0.5) * 0.35);
        this.droppingBall.vel.set(0, 0, 0);
        this.droppingBall = null;
      }

      this.heroGroup.visible = false;
      this.flapPivot.rotation.x = 0;
      this.pendingReward = rewardObj;

      const tier = RARITY_TIERS[rewardObj.rarity] || RARITY_TIERS.rare;
      this.heroBottomMat.color.setHex(tier.colorHex);
      this.heroTopMat.color.setHex(tier.secondaryHex);
      this.totemCoreMat.emissive.setHex(tier.colorHex);
      this.shockwaveMat.color.setHex(tier.colorHex);

      // Select the ball closest to the front-bottom funnel hole (0, 0.68, 0.54)
      let bestBall = this.balls[0];
      let bestDist = Infinity;
      const holeTarget = new THREE.Vector3(0, 0.68, 0.54);
      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];
        const d = b.pos.distanceToSquared(holeTarget);
        if (d < bestDist) {
          bestDist = d;
          bestBall = b;
        }
      }

      this.droppingBall = bestBall;
      if (this.droppingBall) {
        const ud = this.droppingBall.mesh.userData;
        if (ud && ud.bottomMat && ud.topMat && ud.coreMat) {
          ud.bottomMat.color.setHex(tier.colorHex);
          ud.topMat.color.setHex(tier.secondaryHex);
          ud.coreMat.emissive.setHex(tier.colorHex);
        }
      }

      this.state = 'LEVER_PULL_AND_TUMBLE';
      this.stateTimer = 0;
      this.lastRatchetStep = -1;
      this.physicsSettlingTimer = 1.8;
      this.sfx.playCoinAndLeverStart();

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
      if (this.droppingBall) {
        this.droppingBall.isDropping = false;
        this.droppingBall.mesh.visible = true;
        this.droppingBall.mesh.scale.set(1, 1, 1);
        this.droppingBall.pos.set((Math.random() - 0.5) * 0.30, 1.35, (Math.random() - 0.5) * 0.30);
        this.droppingBall.vel.set(0, 0, 0);
        this.droppingBall = null;
        this.preSettleBalls();
      }
      this.state = 'IDLE';
      this.stateTimer = 0;
      this.physicsSettlingTimer = 0;
      this.heroGroup.visible = false;
      this.heroLight.intensity = 0;
      this.flapPivot.rotation.x = 0;
      this.leverPivot.rotation.x = this.leverRestAngle;
      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange('IDLE', null);
      }
    }

    updatePhysics(dt) {
      const isTumbling = (this.state === 'LEVER_PULL_AND_TUMBLE');
      if (!isTumbling && this.physicsSettlingTimer <= 0) {
        // 100% ASLEEP IN IDLE — ZERO VIBRATION OR JITTER!
        return;
      }

      if (!isTumbling && this.physicsSettlingTimer > 0) {
        this.physicsSettlingTimer = Math.max(0, this.physicsSettlingTimer - dt);
      }

      this.stepPhysicsInternal(dt, isTumbling);

      // When settling timer finishes, zero out any residual micro-velocities
      if (!isTumbling && this.physicsSettlingTimer <= 0) {
        for (let i = 0; i < this.balls.length; i++) {
          this.balls[i].vel.set(0, 0, 0);
        }
      }
    }

    stepPhysicsInternal(dt, isTumbling) {
      const gravity = -22.0;
      const maxAllowableR = this.domeRadius - this.ballRadius - 0.04;
      const rodMinR = 0.045 + this.ballRadius;
      const settleFactor = isTumbling ? 1.0 : Math.min(1.0, this.physicsSettlingTimer / 0.4);

      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];
        if (b.isDropping) continue;

        b.vel.y += gravity * dt;

        if (isTumbling) {
          const dx = b.pos.x;
          const dz = b.pos.z;
          const distXZ = Math.sqrt(dx * dx + dz * dz) || 0.001;
          const tangX = -dz / distXZ;
          const tangZ = dx / distXZ;

          const heightFactor = Math.max(0.15, 1.0 - Math.max(0, b.pos.y - 0.65) * 0.7);
          b.vel.x += tangX * 8.2 * heightFactor * dt;
          b.vel.z += tangZ * 8.2 * heightFactor * dt;

          if (b === this.droppingBall) {
            b.vel.x += (0 - b.pos.x) * 14.0 * dt;
            b.vel.z += (0.54 - b.pos.z) * 14.0 * dt;
          }
        }

        const damp = isTumbling ? 0.94 : (0.82 * settleFactor);
        b.vel.x *= damp;
        b.vel.z *= damp;
        b.vel.y *= 0.90;

        if (b.vel.y > 1.2) b.vel.y = 1.2;

        b.pos.addScaledVector(b.vel, dt);

        // Only rotate ball mesh when actively rolling above threshold (prevents micro-jitter!)
        const horizSpeedSq = b.vel.x * b.vel.x + b.vel.z * b.vel.z;
        if (horizSpeedSq > 0.04) {
          b.mesh.rotation.x += b.vel.z * 2.8 * dt;
          b.mesh.rotation.z -= b.vel.x * 2.8 * dt;
        }

        // Central axis rod collision
        const rXZ = Math.sqrt(b.pos.x * b.pos.x + b.pos.z * b.pos.z);
        if (rXZ < rodMinR && rXZ > 0.0001) {
          const nx = b.pos.x / rXZ;
          const nz = b.pos.z / rXZ;
          b.pos.x = nx * rodMinR;
          b.pos.z = nz * rodMinR;
          const vn = b.vel.x * nx + b.vel.z * nz;
          if (vn < 0) {
            b.vel.x -= 1.1 * vn * nx;
            b.vel.z -= 1.1 * vn * nz;
          }
        }

        // Flat floor inside globe (y = 0.68) so balls rest without sliding endlessly down a slope
        const floorY = 0.68;
        if (b.pos.y < floorY) {
          b.pos.y = floorY;
          if (b.vel.y < 0) b.vel.y = 0;
        }

        // Spherical Glass Dome Boundary Constraint
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
            b.vel.x -= 1.1 * vn * nx;
            b.vel.y -= 1.1 * vn * ny;
            b.vel.z -= 1.1 * vn * nz;
          }
        }
      }

      // Pairwise Sphere-to-Sphere Collisions
      const minDist = this.ballRadius * 2.0;
      const minDistSq = minDist * minDist;

      for (let iter = 0; iter < 3; iter++) {
        for (let i = 0; i < this.balls.length; i++) {
          const b1 = this.balls[i];
          if (b1.isDropping) continue;
          for (let j = i + 1; j < this.balls.length; j++) {
            const b2 = this.balls[j];
            if (b2.isDropping) continue;

            const dx = b2.pos.x - b1.pos.x;
            const dy = b2.pos.y - b1.pos.y;
            const dz = b2.pos.z - b1.pos.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < minDistSq && distSq > 0.00001) {
              const dist = Math.sqrt(distSq);
              const overlap = (minDist - dist) * 0.48;
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
                  const impulse = -(1 + 0.15) * velAlongNormal * 0.5;
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
        if (!this.isPullingLeverDrag) {
          this.leverPivot.rotation.x = this.leverRestAngle;
        }

        const baseZ = this.defaultCamPos.z;
        const targetX = Math.sin(this.userYaw) * baseZ;
        const targetZ = Math.cos(this.userYaw) * baseZ;
        const targetY = this.defaultCamPos.y + this.userPitch * 2.0;
        this.currentCamPos.lerp(new THREE.Vector3(targetX, targetY, targetZ), Math.min(1, dt * 6));
        this.currentLookAt.lerp(this.defaultLookAt, Math.min(1, dt * 6));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);
        return;
      }

      // ======================================================================
      // STAGE 1: 3D LEVER PULL DOWN + HEAVY BALL TUMBLE AT BOTTOM OF GLOBE
      // ======================================================================
      if (this.state === 'LEVER_PULL_AND_TUMBLE') {
        const duration = 1.05;
        const t = Math.min(1, this.stateTimer / duration);

        let leverAngle = this.leverRestAngle;
        if (t < 0.68) {
          const p = t / 0.68;
          const easeInOut = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          leverAngle = this.leverRestAngle + easeInOut * 1.38;
        } else {
          const p = (t - 0.68) / 0.32;
          const springBack = 1 - Math.exp(-p * 6) * Math.cos(p * 12);
          leverAngle = (this.leverRestAngle + 1.38) - springBack * 1.38;
        }
        this.leverPivot.rotation.x = leverAngle;

        this.agitatorGroup.rotation.y += dt * 7.5;

        const ratchetStep = Math.floor(t * 7);
        if (ratchetStep > this.lastRatchetStep && ratchetStep <= 6) {
          this.lastRatchetStep = ratchetStep;
          this.sfx.playRatchetClick(0.92 + ratchetStep * 0.03);
          this.sfx.playBallRollClack(0.65);
        }

        this.userYaw *= 0.88;
        this.currentCamPos.lerp(new THREE.Vector3(0, 0.32, this.defaultCamPos.z - 0.5), Math.min(1, dt * 5));
        this.currentLookAt.lerp(new THREE.Vector3(0, 0.12, 0), Math.min(1, dt * 5));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);

        if (this.stateTimer >= duration) {
          this.state = 'BALL_VISIBLE_FALL';
          this.stateTimer = 0;
          this.physicsSettlingTimer = 0.55;
          this.leverPivot.rotation.x = this.leverRestAngle;

          if (this.droppingBall) {
            this.droppingBall.isDropping = true;
            this.droppingBall.pos.set(0, 0.54, 0.58);
            this.droppingBall.vel.set(0, -1.2, 0.65);
          }
        }
        return;
      }

      // ======================================================================
      // STAGE 2: CONTINUOUS VISIBLE BALL DROP FROM GLOBE -> CHUTE -> TRAY
      // ======================================================================
      if (this.state === 'BALL_VISIBLE_FALL') {
        const duration = 0.96;
        const t = Math.min(1, this.stateTimer / duration);

        if (this.droppingBall) {
          const b = this.droppingBall;

          if (t < 0.58) {
            const fallP = t / 0.58;
            const accelP = fallP * fallP;
            b.pos.x = 0;
            b.pos.y = 0.54 - accelP * 2.16; // Drops from y = +0.54 down to y = -1.62 inside the glass chute
            b.pos.z = 0.58 + fallP * 0.54; // Moves cleanly into the front chute channel (z = 1.12)
            b.mesh.rotation.x += dt * 10.5;
            b.mesh.rotation.z += dt * 3.2;
          } else {
            if (!this._playedDoorSound) {
              this._playedDoorSound = true;
              this.sfx.playChuteBounceAndDoor();
            }
            const outP = (t - 0.58) / 0.42;
            const bounce = Math.abs(Math.sin(outP * Math.PI * 1.5)) * (1 - outP) * 0.18;
            b.pos.x = 0;
            b.pos.y = -1.62 + bounce;
            b.pos.z = 1.12 + outP * 0.24; // Rests on the lower tray sill (z = 1.36)
            b.mesh.rotation.x += dt * 8.0 * (1 - outP * 0.5);
          }
        }

        if (t >= 0.50) {
          const doorT = (t - 0.50) / 0.50;
          const flapAngle = doorT < 0.45
            ? -Math.sin((doorT / 0.45) * (Math.PI / 2)) * 1.30
            : -1.30 * Math.exp(-(doorT - 0.45) * 4.0) * Math.cos((doorT - 0.45) * 12);
          this.flapPivot.rotation.x = Math.min(0, flapAngle);
        }

        this.currentCamPos.lerp(new THREE.Vector3(0, -0.25, this.defaultCamPos.z - 0.85), Math.min(1, dt * 6));
        this.currentLookAt.lerp(new THREE.Vector3(0, -1.05, 0.85), Math.min(1, dt * 6));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);

        if (this.stateTimer >= duration) {
          this._playedDoorSound = false;
          this.state = 'HERO_PRESENTATION';
          this.stateTimer = 0;

          const worldStartPos = new THREE.Vector3(0, -1.62 + this.machineGroup.position.y, 1.36);
          if (this.droppingBall) {
            this.droppingBall.mesh.getWorldPosition(worldStartPos);
            this.droppingBall.mesh.visible = false;
          }

          this.heroGroup.visible = true;
          this.heroGroup.position.copy(worldStartPos);
          this.heroGroup.scale.set(0.62, 0.62, 0.62);
          this.heroBottomHalf.position.set(0, 0, 0);
          this.heroBottomHalf.rotation.set(0, 0, 0);
          this.heroTopHalf.position.set(0, 0, 0);
          this.heroTopHalf.rotation.set(0, 0, 0);
          this.heroPrizeTotem.scale.set(0.5, 0.5, 0.5);
          this.shockwaveMat.opacity = 0;

          if (this.callbacks.onStateChange) {
            this.callbacks.onStateChange(this.state, this.pendingReward);
          }
        }
        return;
      }

      // ======================================================================
      // STAGE 3: BALL RISES FROM TRAY & OPENS ITS TWO HEMISPHERES
      // ======================================================================
      if (this.state === 'HERO_PRESENTATION') {
        const flyDuration = 0.62;
        const t = Math.min(1, this.stateTimer / flyDuration);
        const easeOut = 1 - Math.pow(1 - t, 3);

        const targetPos = new THREE.Vector3(0, 0.36, 4.15);
        this.heroGroup.position.lerp(targetPos, Math.min(1, dt * 9.0));
        const sc = 0.62 + 0.46 * easeOut;
        this.heroGroup.scale.set(sc, sc, sc);

        const vib = Math.min(1, this.stateTimer / 0.6) * 0.025;
        this.heroGroup.position.x = Math.sin(this.stateTimer * 55) * vib;
        this.heroGroup.rotation.y += dt * (4.2 + this.stateTimer * 5.5);

        const seamGap = Math.min(0.06, this.stateTimer * 0.06);
        this.heroTopHalf.position.y = seamGap;
        this.heroBottomHalf.position.y = -seamGap;
        this.heroLight.intensity = Math.min(2.2, this.stateTimer * 3.5);

        this.currentCamPos.lerp(new THREE.Vector3(0, 0.38, this.defaultCamPos.z - 0.55), Math.min(1, dt * 6));
        this.currentLookAt.lerp(new THREE.Vector3(0, 0.22, 2.2), Math.min(1, dt * 6));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);

        if (this.stateTimer >= 0.72) {
          this.triggerCapsuleBurstNow();
        }
        return;
      }

      if (this.state === 'CAPSULE_BURST_OPEN') {
        const t = Math.min(1, this.stateTimer / 0.70);
        const easeOut = 1 - Math.pow(1 - t, 3);

        this.heroGroup.position.lerp(new THREE.Vector3(0, 0.62, 4.20), Math.min(1, dt * 7));
        this.heroGroup.rotation.set(0, 0, 0);

        this.heroTopHalf.position.set(-easeOut * 0.48, 0.38 + easeOut * 0.42, -easeOut * 0.20);
        this.heroTopHalf.rotation.set(-easeOut * 0.82, this.stateTimer * 1.6, easeOut * 0.60);

        this.heroBottomHalf.position.set(easeOut * 0.48, -0.38 - easeOut * 0.35, -easeOut * 0.20);
        this.heroBottomHalf.rotation.set(easeOut * 0.72, -this.stateTimer * 1.5, -easeOut * 0.50);

        const totemScale = 0.55 + easeOut * 0.72 + Math.sin(this.stateTimer * 4) * 0.04;
        this.heroPrizeTotem.scale.set(totemScale, totemScale, totemScale);
        this.totemGem.rotation.y += dt * 2.4;
        this.totemGem.rotation.x = Math.sin(this.stateTimer * 2.2) * 0.22;
        this.totemHalo.rotation.x = Math.PI / 3 + Math.sin(this.stateTimer * 1.7) * 0.28;
        this.totemHalo.rotation.y -= dt * 1.9;

        if (this.stateTimer < 0.52) {
          const swT = this.stateTimer / 0.52;
          const swScale = 1 + swT * 5.0;
          this.shockwaveRing.scale.set(swScale, swScale, 1);
          this.shockwaveMat.opacity = (1 - swT) * 0.88;
        } else {
          this.shockwaveMat.opacity = 0;
        }
      }
    }

    checkLeverIntersection(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      this.pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointerNDC, this.camera);
      const hits = this.raycaster.intersectObjects(this.leverInteractables, true);
      return hits.length > 0;
    }

    bindInteraction() {
      const onDown = (clientX, clientY) => {
        this.dragStartX = clientX;
        this.dragStartY = clientY;
        this.downTime = performance.now();

        if (this.state === 'HERO_PRESENTATION') {
          this.triggerCapsuleBurstNow();
          return;
        }

        if ((this.state === 'IDLE' || this.state === 'CAPSULE_BURST_OPEN') && this.checkLeverIntersection(clientX, clientY)) {
          this.isPullingLeverDrag = true;
          this.leverPullProgress = 0;
          return;
        }

        this.isDraggingOrbit = true;
      };

      const onMove = (clientX, clientY) => {
        if (this.isPullingLeverDrag) {
          const dy = Math.max(0, clientY - this.dragStartY);
          this.leverPullProgress = Math.min(1, dy / 70);
          this.leverPivot.rotation.x = this.leverRestAngle + this.leverPullProgress * 1.25;
          if (this.leverPullProgress >= 0.65) {
            this.isPullingLeverDrag = false;
            if (this.callbacks.onLeverPulled) {
              this.callbacks.onLeverPulled();
            }
          }
          return;
        }

        if (!this.isDraggingOrbit) return;
        const dx = clientX - this.dragStartX;
        const dy = clientY - this.dragStartY;
        this.dragStartX = clientX;
        this.dragStartY = clientY;

        this.userYaw = Math.max(-0.55, Math.min(0.55, this.userYaw - dx * 0.006));
        this.userPitch = Math.max(-0.20, Math.min(0.28, this.userPitch + dy * 0.004));
      };

      const onUp = () => {
        if (this.isPullingLeverDrag) {
          this.isPullingLeverDrag = false;
          this.leverPivot.rotation.x = this.leverRestAngle;
          if (this.callbacks.onLeverPulled) {
            this.callbacks.onLeverPulled();
          }
          return;
        }

        if (!this.isDraggingOrbit) return;
        this.isDraggingOrbit = false;
      };

      this.canvas.addEventListener('mousedown', e => {
        e.preventDefault();
        onDown(e.clientX, e.clientY);
      });
      window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
      window.addEventListener('mouseup', () => onUp());

      this.canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
          onDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      this.canvas.addEventListener('touchmove', e => {
        if ((this.isDraggingOrbit || this.isPullingLeverDrag) && e.touches.length === 1) {
          if (e.cancelable) e.preventDefault();
          onMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: false });

      this.canvas.addEventListener('touchend', () => {
        onUp();
      }, { passive: true });

      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      if (!this.canvas || !this.renderer || !this.camera) return;
      const w = this.canvas.clientWidth || window.innerWidth || 380;
      const h = this.canvas.clientHeight || window.innerHeight || 680;
      const aspect = w / Math.max(1, h);
      this.camera.fov = aspect < 0.65 ? 45 : 38;
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
      this.defaultCamPos.z = aspect < 0.65 ? 8.55 : 7.65;
      this.renderer.setSize(w, h, false);
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.lastTime = performance.now();
      this.resize();

      const loop = (now) => {
        if (!this.isRunning) return;
        const dt = Math.min(0.04, Math.max(0.001, (now - this.lastTime) / 1000));
        this.lastTime = now;

        this.updatePhysics(dt);
        this.updateStateMachine(dt);
        this.renderer.render(this.scene, this.camera);

        this.rafId = requestAnimationFrame(loop);
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
})();
