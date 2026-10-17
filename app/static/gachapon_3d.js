/**
 * ============================================================================
 * HYPER-REALISTIC 3D VINTAGE GUMBALL MACHINE (THREE.JS PBR)
 * Full-Screen Interactive 3D Machine with Direct 3D Lever Pull (100 Claves),
 * Heavy Gravity Ball Physics (Zero Flying), Visible Funnel-to-Tray Ball Drop,
 * and 3D Capsule Hemisphere Opening Animation
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
      badgeText: '#1c1002'
    },
    epic: {
      id: 'epic',
      label: '◆ ÉPICO ◆',
      colorHex: 0xe11d48,
      secondaryHex: 0xc084fc,
      cssColor: '#f43f5e',
      glowCss: 'rgba(244, 63, 94, 0.55)',
      badgeBg: 'linear-gradient(135deg, #be123c 0%, #f43f5e 50%, #9333ea 100%)',
      badgeText: '#ffffff'
    },
    rare: {
      id: 'rare',
      label: '● RARO ●',
      colorHex: 0x10b981,
      secondaryHex: 0x34d399,
      cssColor: '#34d399',
      glowCss: 'rgba(52, 211, 153, 0.50)',
      badgeBg: 'linear-gradient(135deg, #047857 0%, #10b981 50%, #0d9488 100%)',
      badgeText: '#ffffff'
    },
    classic: {
      id: 'classic',
      label: '✦ CLÁSICO ✦',
      colorHex: 0x38bdf8,
      secondaryHex: 0xe2e8f0,
      cssColor: '#7dd3fc',
      glowCss: 'rgba(56, 189, 248, 0.45)',
      badgeBg: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 50%, #475569 100%)',
      badgeText: '#ffffff'
    }
  };

  // Synthesized Mechanical & Musical Sound Engine (Web Audio API)
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

      // Heavy hollow impact as the ball hits the metal tray
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

      // Chrome flap door clack
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
      this.dropPathPhase = 0;
      this.domeCenter = new THREE.Vector3(0, 1.56, 0);
      this.domeRadius = 1.42;
      this.ballRadius = 0.245;

      // 3D Burst particles
      this.burstParticles = [];

      this.initScene();
      this.buildMaterials();
      this.buildMachineMesh();
      this.populateCapsules(32);
      this.buildHeroOpenAssembly();
      this.bindInteraction();
    }

    initScene() {
      const w = this.canvas.clientWidth || window.innerWidth || 380;
      const h = this.canvas.clientHeight || window.innerHeight || 680;

      this.scene = new THREE.Scene();

      const aspect = w / Math.max(1, h);
      const fov = aspect < 0.65 ? 44 : 38;
      this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 50);
      this.defaultCamPos = new THREE.Vector3(0, 0.45, aspect < 0.65 ? 8.35 : 7.55);
      this.defaultLookAt = new THREE.Vector3(0, 0.22, 0);
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
        this.renderer.toneMappingExposure = 1.22;
      }
      if (THREE.sRGBEncoding !== undefined) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }

      this.createStudioEnvironment();

      // Studio Lighting
      const ambient = new THREE.AmbientLight(0xfff4e0, 0.62);
      this.scene.add(ambient);

      this.keyLight = new THREE.DirectionalLight(0xfff8eb, 2.0);
      this.keyLight.position.set(4.8, 8.2, 6.5);
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.width = 1024;
      this.keyLight.shadow.mapSize.height = 1024;
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 22;
      const d = 3.8;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0012;
      this.scene.add(this.keyLight);

      // Warm Golden Rim Light from Left
      this.rimLight = new THREE.PointLight(0xfbbf24, 1.75, 16);
      this.rimLight.position.set(-4.6, 3.4, -2.2);
      this.scene.add(this.rimLight);

      // Cool Studio Specular Fill from Right
      this.fillLight = new THREE.PointLight(0x7dd3fc, 1.25, 16);
      this.fillLight.position.set(4.8, 1.8, 3.6);
      this.scene.add(this.fillLight);

      // Internal Globe Warm Illumination
      this.domeInnerLight = new THREE.PointLight(0xffe4b5, 1.4, 5.0);
      this.domeInnerLight.position.set(0, 2.6, 0.2);
      this.scene.add(this.domeInnerLight);

      // Chute Interior Accent Light (makes the falling ball clearly visible inside the chute!)
      this.chuteLight = new THREE.PointLight(0xffedd5, 1.25, 3.2);
      this.chuteLight.position.set(0, -0.55, 1.45);
      this.scene.add(this.chuteLight);

      // Hero Reveal Light
      this.heroLight = new THREE.PointLight(0xffffff, 0, 9);
      this.heroLight.position.set(0, 1.0, 4.8);
      this.scene.add(this.heroLight);
    }

    createStudioEnvironment() {
      try {
        if (!THREE.PMREMGenerator) return;
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileCubemapShader();

        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color(0x0f070a);

        // Overhead studio softbox
        const topBox = new THREE.Mesh(
          new THREE.PlaneGeometry(14, 14),
          new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        );
        topBox.position.set(0, 7.5, 0);
        topBox.rotation.x = Math.PI / 2;
        envScene.add(topBox);

        // Left warm gold reflector strip
        const leftStrip = new THREE.Mesh(
          new THREE.PlaneGeometry(4.5, 11),
          new THREE.MeshBasicMaterial({ color: 0xfde68a, side: THREE.DoubleSide })
        );
        leftStrip.position.set(-6.5, 2.0, 2.5);
        leftStrip.lookAt(0, 0, 0);
        envScene.add(leftStrip);

        // Right cool white reflector strip
        const rightStrip = new THREE.Mesh(
          new THREE.PlaneGeometry(4.0, 11),
          new THREE.MeshBasicMaterial({ color: 0xe0f2fe, side: THREE.DoubleSide })
        );
        rightStrip.position.set(6.5, 2.5, 3.0);
        rightStrip.lookAt(0, 0, 0);
        envScene.add(rightStrip);

        // Front curved studio window highlight for realistic glass reflection
        const frontWindow = new THREE.Mesh(
          new THREE.RingGeometry(1.9, 2.5, 40),
          new THREE.MeshBasicMaterial({ color: 0xfffbeb, side: THREE.DoubleSide })
        );
        frontWindow.position.set(0, 2.1, 7.2);
        envScene.add(frontWindow);

        const envRT = pmremGenerator.fromScene(envScene, 0.03);
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

      for (let i = 0; i < 600; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = 2 + Math.random() * 6;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const shade = Math.random() > 0.5 ? 148 : 112;
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

      // Brushed metallic dark bronze-chrome background
      const grad = ctx.createLinearGradient(0, 0, 512, 256);
      grad.addColorStop(0, '#1e1610');
      grad.addColorStop(0.5, '#332417');
      grad.addColorStop(1, '#17100b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      // Double embossed chrome/brass frame
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 10;
      ctx.strokeRect(12, 12, 488, 232);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 4;
      ctx.strokeRect(26, 26, 460, 204);

      // Price badge: 100 Claves
      ctx.fillStyle = '#fde047';
      ctx.font = '900 78px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('100 𝄞', 256, 112);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('TIRA DE LA PALANCA ➔', 256, 188);

      return new THREE.CanvasTexture(c);
    }

    buildMaterials() {
      const bumpTex = this.createCastIronMicroBump();
      const PhysicalMat = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;

      // 1. Hyper-Realistic Clearcoat Crimson Enamel (Body & Lid)
      this.matCrimsonEnamel = new PhysicalMat({
        color: 0xa30e1b,
        roughness: 0.14,
        metalness: 0.22,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        bumpMap: bumpTex,
        bumpScale: 0.006,
        envMapIntensity: 1.85
      });

      // 2. Heavy Cast-Iron Matte Charcoal Pedestal Base
      this.matCastIronBase = new THREE.MeshStandardMaterial({
        color: 0x16181d,
        roughness: 0.42,
        metalness: 0.72,
        bumpMap: bumpTex,
        bumpScale: 0.012,
        envMapIntensity: 1.25
      });

      // 3. Black Vulcanized Rubber Gasket
      this.matRubberGasket = new THREE.MeshStandardMaterial({
        color: 0x0b0c0e,
        roughness: 0.85,
        metalness: 0.08
      });

      // 4. Mirror Chrome (Collar, Escutcheon, Chute Frame, Flap Door, Lever Arm)
      this.matMirrorChrome = new PhysicalMat({
        color: 0xf8fafc,
        roughness: 0.05,
        metalness: 0.98,
        clearcoat: 0.6,
        clearcoatRoughness: 0.04,
        envMapIntensity: 2.3
      });

      // 5. Brushed Royal Brass (Accents, Finial, Funnel Floor, Lever Trim)
      this.matPolishedBrass = new PhysicalMat({
        color: 0xf59e0b,
        roughness: 0.15,
        metalness: 0.92,
        clearcoat: 0.4,
        envMapIntensity: 1.95
      });

      // 6. Glossy Bakelite Lever Knob (Glowing Crimson-Gold Grip)
      this.matLeverKnob = new PhysicalMat({
        color: 0xdc2626,
        emissive: 0x450a0a,
        emissiveIntensity: 0.35,
        roughness: 0.08,
        metalness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        envMapIntensity: 2.2
      });

      // 7. Optical Crystal Glass Globe
      this.matGlassOuter = new PhysicalMat({
        color: 0xf0f9ff,
        roughness: 0.02,
        metalness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.01,
        transparent: true,
        opacity: 0.22,
        envMapIntensity: 2.6,
        depthWrite: false,
        side: THREE.FrontSide
      });

      this.matGlassRim = new THREE.MeshStandardMaterial({
        color: 0xfffbeb,
        roughness: 0.06,
        metalness: 0.25,
        transparent: true,
        opacity: 0.12,
        envMapIntensity: 2.0,
        depthWrite: false,
        side: THREE.BackSide
      });

      // 8. Dark Velvet Chute Interior
      this.matDarkCavity = new THREE.MeshStandardMaterial({
        color: 0x120609,
        roughness: 0.85,
        metalness: 0.1
      });
    }

    buildMachineMesh() {
      this.machineGroup = new THREE.Group();
      this.machineGroup.position.set(0, -0.32, 0);
      this.scene.add(this.machineGroup);

      // ======================================================================
      // A. HEAVY STEPPED CAST-IRON & CHROME PEDESTAL BASE (y: -2.42 to -1.85)
      // ======================================================================
      // Bottom rubber pad
      const rubberPad = new THREE.Mesh(
        new THREE.CylinderGeometry(1.56, 1.62, 0.10, 64),
        this.matRubberGasket
      );
      rubberPad.position.y = -2.40;
      rubberPad.receiveShadow = true;
      this.machineGroup.add(rubberPad);

      // Cast-iron stepped pedestal base
      const castBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.40, 1.55, 0.28, 64),
        this.matCastIronBase
      );
      castBase.position.y = -2.22;
      castBase.castShadow = true;
      castBase.receiveShadow = true;
      this.machineGroup.add(castBase);

      // Polished chrome base molding ring
      const baseChromeRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.39, 0.055, 20, 64),
        this.matMirrorChrome
      );
      baseChromeRing.rotation.x = Math.PI / 2;
      baseChromeRing.position.y = -2.07;
      this.machineGroup.add(baseChromeRing);

      // ======================================================================
      // B. CONTOURED AUTOMOTIVE-LACQUER CRIMSON BODY (NO RANDOM GOLD BARS!)
      // ======================================================================
      const lathePoints = [
        new THREE.Vector2(1.38, -2.07),
        new THREE.Vector2(1.35, -1.75),
        new THREE.Vector2(1.16, -1.20),
        new THREE.Vector2(1.08, -0.62),
        new THREE.Vector2(1.14, -0.15),
        new THREE.Vector2(1.28, 0.16),
        new THREE.Vector2(1.34, 0.26)
      ];
      const bodyGeo = new THREE.LatheGeometry(lathePoints, 64);
      const bodyMesh = new THREE.Mesh(bodyGeo, this.matCrimsonEnamel);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      this.machineGroup.add(bodyMesh);

      // Sleek horizontal chrome waist trim ring (authentic 1950s detail)
      const waistChromeTrim = new THREE.Mesh(
        new THREE.TorusGeometry(1.105, 0.032, 16, 64),
        this.matMirrorChrome
      );
      waistChromeTrim.rotation.x = Math.PI / 2;
      waistChromeTrim.position.y = -0.78;
      this.machineGroup.add(waistChromeTrim);

      // ======================================================================
      // C. CHROME NECK COLLAR, RUBBER GASKET & INTERNAL FUNNEL WITH DROP HOLE
      // ======================================================================
      const collarMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.38, 1.32, 0.22, 64),
        this.matMirrorChrome
      );
      collarMesh.position.y = 0.30;
      collarMesh.castShadow = true;
      this.machineGroup.add(collarMesh);

      // Black rubber globe-seating gasket
      const globeGasket = new THREE.Mesh(
        new THREE.TorusGeometry(1.34, 0.045, 16, 64),
        this.matRubberGasket
      );
      globeGasket.rotation.x = Math.PI / 2;
      globeGasket.position.y = 0.41;
      this.machineGroup.add(globeGasket);

      // Internal Sloped Brass Funnel Floor at bottom of glass globe
      const funnelFloor = new THREE.Mesh(
        new THREE.CylinderGeometry(1.26, 0.95, 0.12, 48),
        this.matPolishedBrass
      );
      funnelFloor.position.y = 0.44;
      this.machineGroup.add(funnelFloor);

      // Real Dark Circular Drop Hole / Aperture at front-bottom of globe (x=0, z=0.58)
      const dropApertureHole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.30, 0.16, 32),
        this.matDarkCavity
      );
      dropApertureHole.position.set(0, 0.45, 0.58);
      this.machineGroup.add(dropApertureHole);

      const dropHoleRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.03, 14, 32),
        this.matMirrorChrome
      );
      dropHoleRim.rotation.x = Math.PI / 2;
      dropHoleRim.position.set(0, 0.51, 0.58);
      this.machineGroup.add(dropHoleRim);

      // ======================================================================
      // D. VISIBLE FRONT GLASS DROP CHUTE & LOWER DISPENSER TRAY
      //    (Allows the user to clearly see the ball fall from the globe to the tray!)
      // ======================================================================
      const chuteChannelGroup = new THREE.Group();
      this.machineGroup.add(chuteChannelGroup);

      // Recessed dark velvet vertical chute interior (from y=+0.35 down to y=-1.65)
      const verticalChuteBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 1.95, 0.24),
        this.matDarkCavity
      );
      verticalChuteBack.position.set(0, -0.68, 1.04);
      chuteChannelGroup.add(verticalChuteBack);

      // Left & Right Chrome Chute Rails framing the visible drop window
      [-0.34, 0.34].forEach(xSide => {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 1.96, 0.28),
          this.matMirrorChrome
        );
        rail.position.set(xSide, -0.68, 1.08);
        rail.castShadow = true;
        chuteChannelGroup.add(rail);
      });

      // Transparent protective glass window over the upper drop chute so you see the ball fall inside!
      const chuteGlassWindow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.60, 1.25),
        this.matGlassOuter
      );
      chuteGlassWindow.position.set(0, -0.35, 1.21);
      chuteChannelGroup.add(chuteGlassWindow);

      // Compact Embossed Price Escutcheon Plate above the lower outlet ("100 𝄞")
      const coinPlateTex = this.createCoinPlateTexture();
      const coinPlateMat = new THREE.MeshStandardMaterial({
        map: coinPlateTex,
        roughness: 0.22,
        metalness: 0.75
      });
      const coinPlateFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.42, 0.08),
        this.matMirrorChrome
      );
      coinPlateFrame.position.set(0, 0.12, 1.24);
      chuteChannelGroup.add(coinPlateFrame);

      const coinPlateFace = new THREE.Mesh(
        new THREE.PlaneGeometry(0.84, 0.35),
        coinPlateMat
      );
      coinPlateFace.position.set(0, 0.12, 1.285);
      chuteChannelGroup.add(coinPlateFace);

      // Lower Dispenser Outlet Housing & Curved Chrome Collection Tray (y: -1.68)
      const outletGroup = new THREE.Group();
      outletGroup.position.set(0, -1.65, 1.18);
      this.machineGroup.add(outletGroup);

      const outletFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 0.64, 0.28),
        this.matMirrorChrome
      );
      outletFrame.castShadow = true;
      outletGroup.add(outletFrame);

      const outletCavity = new THREE.Mesh(
        new THREE.BoxGeometry(0.70, 0.50, 0.26),
        this.matDarkCavity
      );
      outletCavity.position.set(0, -0.02, 0.03);
      outletGroup.add(outletCavity);

      // Protruding Curved Chrome & Brass Collection Tray Lip
      const trayLip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.40, 0.14, 32, 1, false, 0, Math.PI),
        this.matMirrorChrome
      );
      trayLip.position.set(0, -0.28, 0.12);
      outletGroup.add(trayLip);

      // Hinged Swinging Chrome Flap Door (kicked open when the falling ball hits it!)
      this.flapPivot = new THREE.Group();
      this.flapPivot.position.set(0, 0.21, 0.13);
      outletGroup.add(this.flapPivot);

      const flapDoorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.64, 0.42, 0.035),
        this.matMirrorChrome
      );
      flapDoorMesh.position.set(0, -0.21, 0);
      this.flapPivot.add(flapDoorMesh);

      // ======================================================================
      // E. INTERACTIVE 3D MECHANICAL PULL LEVER ("PALANCA") ON THE MACHINE
      //    (The ONLY way to draw a ball — no external UI buttons!)
      // ======================================================================
      this.leverMountGroup = new THREE.Group();
      // Mounted prominently on the right-front side of the machine body
      this.leverMountGroup.position.set(1.08, -0.52, 0.55);
      this.leverMountGroup.rotation.y = -0.32;
      this.machineGroup.add(this.leverMountGroup);

      // Heavy Chrome Gearbox Housing attached to the crimson body
      const gearboxHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.30, 0.34, 0.36, 32),
        this.matMirrorChrome
      );
      gearboxHousing.rotation.z = Math.PI / 2;
      gearboxHousing.castShadow = true;
      this.leverMountGroup.add(gearboxHousing);

      const gearboxBrassCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.40, 24),
        this.matPolishedBrass
      );
      gearboxBrassCap.rotation.z = Math.PI / 2;
      this.leverMountGroup.add(gearboxBrassCap);

      // Rotating Lever Pivot (rotates forward/down around X axis when pulled!)
      this.leverPivot = new THREE.Group();
      this.leverPivot.position.set(0.18, 0, 0);
      // Rest angle tilted slightly backward/upward (+0.32 rad)
      this.leverRestAngle = -0.28;
      this.leverPivot.rotation.x = this.leverRestAngle;
      this.leverMountGroup.add(this.leverPivot);

      // Forged Chrome Lever Arm Shaft
      const leverShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.075, 1.35, 24),
        this.matMirrorChrome
      );
      leverShaft.position.set(0.06, 0.65, 0.12);
      leverShaft.rotation.x = 0.18;
      leverShaft.castShadow = true;
      this.leverPivot.add(leverShaft);

      // Brass Collar below the Knob
      const knobCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.095, 0.065, 0.12, 24),
        this.matPolishedBrass
      );
      knobCollar.position.set(0.06, 1.28, 0.24);
      knobCollar.rotation.x = 0.18;
      this.leverPivot.add(knobCollar);

      // Prominent Glossy Spherical Grip Ball ("Bola de la Palanca")
      this.leverKnobMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 32, 32),
        this.matLeverKnob
      );
      this.leverKnobMesh.position.set(0.06, 1.48, 0.28);
      this.leverKnobMesh.castShadow = true;
      this.leverPivot.add(this.leverKnobMesh);

      // Golden Equatorial Ring around the Lever Knob
      const knobGoldRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.242, 0.022, 14, 32),
        this.matPolishedBrass
      );
      knobGoldRing.position.copy(this.leverKnobMesh.position);
      knobGoldRing.rotation.x = Math.PI / 2;
      this.leverPivot.add(knobGoldRing);

      // Generous Invisible Raycast Hit Target around the entire Lever & Front Plate so tapping/dragging is effortless
      const leverHitBox = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 12, 12),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      leverHitBox.position.set(0.0, 0.95, 0.25);
      this.leverPivot.add(leverHitBox);

      const frontPlateHitBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.9, 0.6),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      frontPlateHitBox.position.set(0, -0.1, 1.25);
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
      // F. CRYSTAL GLASS GLOBE & AGITATOR WHEEL (NO EXTERNAL GOLD BARS!)
      // ======================================================================
      // Thin Central Chrome Rod holding the lid (authentic gumball center axis)
      const centerRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.042, 2.75, 20),
        this.matMirrorChrome
      );
      centerRod.position.copy(this.domeCenter);
      this.machineGroup.add(centerRod);

      // Internal Rotating Agitator Wheel at bottom of globe
      this.agitatorGroup = new THREE.Group();
      this.agitatorGroup.position.set(0, 0.50, 0);
      this.machineGroup.add(this.agitatorGroup);

      for (let i = 0; i < 4; i++) {
        const paddle = new THREE.Mesh(
          new THREE.BoxGeometry(0.78, 0.09, 0.045),
          this.matMirrorChrome
        );
        const a = (i / 4) * Math.PI * 2;
        paddle.rotation.y = a;
        paddle.position.set(Math.cos(a) * 0.36, 0.04, Math.sin(a) * 0.36);
        this.agitatorGroup.add(paddle);
      }

      // Inner Glass Back-Face Rim
      const glassBackMesh = new THREE.Mesh(
        new THREE.SphereGeometry(this.domeRadius * 0.992, 56, 40),
        this.matGlassRim
      );
      glassBackMesh.position.copy(this.domeCenter);
      this.machineGroup.add(glassBackMesh);

      // Outer Optical Crystal Glass Globe
      this.glassGlobeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(this.domeRadius, 56, 40),
        this.matGlassOuter
      );
      this.glassGlobeMesh.position.copy(this.domeCenter);
      this.glassGlobeMesh.renderOrder = 2;
      this.machineGroup.add(this.glassGlobeMesh);

      // Studio Specular Reflection Arc on Glass Globe
      const highlightGeo = new THREE.SphereGeometry(
        this.domeRadius * 1.002,
        36,
        28,
        -Math.PI * 0.36,
        Math.PI * 0.20,
        Math.PI * 0.16,
        Math.PI * 0.52
      );
      const glassHighlight = new THREE.Mesh(
        highlightGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.20,
          side: THREE.FrontSide,
          depthWrite: false
        })
      );
      glassHighlight.position.copy(this.domeCenter);
      glassHighlight.renderOrder = 3;
      this.machineGroup.add(glassHighlight);

      // ======================================================================
      // G. AUTHENTIC CRIMSON & CHROME DOME LID CAP (y: +2.80 to +3.42)
      // ======================================================================
      const crownGroup = new THREE.Group();
      crownGroup.position.set(0, 2.80, 0);
      this.machineGroup.add(crownGroup);

      const lidGasket = new THREE.Mesh(
        new THREE.TorusGeometry(0.88, 0.042, 16, 48),
        this.matRubberGasket
      );
      lidGasket.rotation.x = Math.PI / 2;
      crownGroup.add(lidGasket);

      const lidChromeRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.90, 0.052, 16, 48),
        this.matMirrorChrome
      );
      lidChromeRim.rotation.x = Math.PI / 2;
      lidChromeRim.position.y = 0.04;
      crownGroup.add(lidChromeRim);

      const lidDome = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.89, 0.30, 48),
        this.matCrimsonEnamel
      );
      lidDome.position.y = 0.18;
      crownGroup.add(lidDome);

      // Knurled Chrome Lock-Nut Finial on top of the lid
      const lockNutBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.36, 0.12, 32),
        this.matMirrorChrome
      );
      lockNutBase.position.y = 0.38;
      crownGroup.add(lockNutBase);

      const finialKnob = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 24, 24),
        this.matMirrorChrome
      );
      finialKnob.position.y = 0.52;
      crownGroup.add(finialKnob);
    }

    createCapsuleMesh(rarityKey, radius = this.ballRadius) {
      const tier = RARITY_TIERS[rarityKey] || RARITY_TIERS.rare;
      const group = new THREE.Group();
      const PhysicalMat = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;

      // 1. Bottom Pearlescent/Metallic Hemisphere
      const bottomMat = new PhysicalMat({
        color: tier.colorHex,
        roughness: 0.12,
        metalness: 0.45,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        envMapIntensity: 1.9
      });
      const bottomGeo = new THREE.SphereGeometry(radius, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      const bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
      group.add(bottomMesh);

      // 2. Equatorial Seam Ring
      const seamMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.15,
        metalness: 0.92
      });
      const seamMesh = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.995, radius * 0.038, 10, 28),
        seamMat
      );
      seamMesh.rotation.x = Math.PI / 2;
      group.add(seamMesh);

      // 3. Top Translucent Glossy Hemisphere
      const topMat = new PhysicalMat({
        color: tier.secondaryHex,
        roughness: 0.06,
        metalness: 0.10,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.82,
        envMapIntensity: 2.1
      });
      const topGeo = new THREE.SphereGeometry(radius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const topMesh = new THREE.Mesh(topGeo, topMat);
      group.add(topMesh);

      // 4. Inner Glowing Core
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: tier.colorHex,
        emissiveIntensity: 0.85,
        roughness: 0.1,
        metalness: 0.8
      });
      const coreMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(radius * 0.40, 0),
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

    populateCapsules(count = 32) {
      const rarityKeys = ['legendary', 'epic', 'rare', 'classic', 'rare', 'epic'];
      this.balls = [];

      for (let i = 0; i < count; i++) {
        const rKey = rarityKeys[i % rarityKeys.length];
        const mesh = this.createCapsuleMesh(rKey, this.ballRadius);

        const layer = Math.floor(i / 8);
        const angle = (i % 8) * ((Math.PI * 2) / 8) + layer * 0.42;
        const dist = 0.32 + (i % 3) * 0.30;
        const bx = Math.cos(angle) * dist;
        const bz = Math.sin(angle) * dist;
        const by = 0.72 + layer * 0.34 + (Math.random() - 0.5) * 0.05;

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
          angVel: new THREE.Vector3(0, 0, 0),
          rarityKey: rKey,
          isDropping: false
        });
      }
    }

    buildHeroOpenAssembly() {
      // Used seamlessly at the exact position of the dropped ball when it opens its two hemispheres!
      this.heroGroup = new THREE.Group();
      this.heroGroup.visible = false;
      this.scene.add(this.heroGroup);

      const r = 0.40;
      const PhysicalMat = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;

      this.heroBottomMat = new PhysicalMat({
        color: 0xfbbf24,
        roughness: 0.12,
        metalness: 0.55,
        clearcoat: 1.0,
        envMapIntensity: 2.1
      });
      this.heroBottomHalf = new THREE.Mesh(
        new THREE.SphereGeometry(r, 36, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        this.heroBottomMat
      );
      this.heroGroup.add(this.heroBottomHalf);

      const innerRim = new THREE.Mesh(
        new THREE.TorusGeometry(r * 0.98, r * 0.045, 14, 36),
        this.matMirrorChrome
      );
      innerRim.rotation.x = Math.PI / 2;
      this.heroBottomHalf.add(innerRim);

      this.heroTopMat = new PhysicalMat({
        color: 0x38bdf8,
        roughness: 0.05,
        metalness: 0.12,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.84,
        envMapIntensity: 2.3
      });
      this.heroTopHalf = new THREE.Mesh(
        new THREE.SphereGeometry(r, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2),
        this.heroTopMat
      );
      this.heroGroup.add(this.heroTopHalf);

      // Glowing 3D Prize Totem inside the Capsule
      this.heroPrizeTotem = new THREE.Group();
      this.heroGroup.add(this.heroPrizeTotem);

      this.totemCoreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfbbf24,
        emissiveIntensity: 1.15,
        roughness: 0.08,
        metalness: 0.9
      });
      this.totemGem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.23, 1),
        this.totemCoreMat
      );
      this.heroPrizeTotem.add(this.totemGem);

      this.totemHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.33, 0.02, 12, 40),
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
        new THREE.RingGeometry(0.34, 0.46, 48),
        this.shockwaveMat
      );
      this.heroGroup.add(this.shockwaveRing);
    }

    spawnBurstParticles(colorHex, secondaryHex) {
      this.burstParticles.forEach(p => this.scene.remove(p.mesh));
      this.burstParticles = [];

      const geo = new THREE.OctahedronGeometry(0.052, 0);
      const colors = [colorHex, secondaryHex, 0xffffff, 0xfde047];

      for (let i = 0; i < 60; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: colors[i % colors.length],
          transparent: true,
          opacity: 1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(this.heroGroup.position);

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.5 + Math.random() * 3.5;

        const vel = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed + 0.75,
          Math.cos(phi) * speed * 0.65
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
          decay: 0.58 + Math.random() * 0.42
        });
      }
    }

    shakeGlobe(strength = 0.6) {
      this.sfx.playBallRollClack(0.65 * strength);
      // Horizontal jostle only — never launch balls up into the air!
      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];
        if (b.isDropping) continue;
        b.vel.x += (Math.random() - 0.5) * 3.2 * strength;
        b.vel.z += (Math.random() - 0.5) * 3.2 * strength;
      }
    }

    startVendingSequence(rewardObj) {
      if (this.state !== 'IDLE' && this.state !== 'CAPSULE_BURST_OPEN') return false;

      // Return any previously dropped ball to the top of the pile inside the globe
      if (this.droppingBall) {
        this.droppingBall.isDropping = false;
        this.droppingBall.mesh.visible = true;
        this.droppingBall.mesh.scale.set(1, 1, 1);
        this.droppingBall.pos.set((Math.random() - 0.5) * 0.4, 1.55, (Math.random() - 0.5) * 0.4);
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

      // Pick the actual ball closest to the front-bottom funnel hole (0, 0.65, 0.55) so WE SEE IT FALL!
      let bestBall = this.balls[0];
      let bestDist = Infinity;
      const holeTarget = new THREE.Vector3(0, 0.68, 0.56);
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
        // Color the actual ball in the globe with the winning rarity so it's the exact same ball that drops!
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
        this.droppingBall.pos.set((Math.random() - 0.5) * 0.35, 1.50, (Math.random() - 0.5) * 0.35);
        this.droppingBall.vel.set(0, 0, 0);
        this.droppingBall = null;
      }
      this.state = 'IDLE';
      this.stateTimer = 0;
      this.heroGroup.visible = false;
      this.heroLight.intensity = 0;
      this.flapPivot.rotation.x = 0;
      this.leverPivot.rotation.x = this.leverRestAngle;
      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange('IDLE', null);
      }
    }

    updatePhysics(dt) {
      // Strong realistic downward gravity — balls NEVER fly up into the air!
      const gravity = -24.0;
      const maxAllowableR = this.domeRadius - this.ballRadius - 0.04;
      const rodMinR = 0.05 + this.ballRadius;
      const isTumbling = (this.state === 'LEVER_PULL_AND_TUMBLE');

      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];
        if (b.isDropping) continue;

        // Apply downward gravity
        b.vel.y += gravity * dt;

        if (isTumbling) {
          // Purely horizontal rotational stirring from the bottom agitator wheel (NO upward fountain velocity!)
          const dx = b.pos.x;
          const dz = b.pos.z;
          const distXZ = Math.sqrt(dx * dx + dz * dz) || 0.001;
          const tangX = -dz / distXZ;
          const tangZ = dx / distXZ;

          // Only stir balls resting near the bottom/middle of the globe
          const heightFactor = Math.max(0.15, 1.0 - Math.max(0, b.pos.y - 0.65) * 0.7);
          b.vel.x += tangX * 9.5 * heightFactor * dt;
          b.vel.z += tangZ * 9.5 * heightFactor * dt;

          // Guide the chosen droppingBall smoothly into the front funnel aperture (0, 0.62, 0.58)
          if (b === this.droppingBall) {
            b.vel.x += (0 - b.pos.x) * 14.0 * dt;
            b.vel.z += (0.58 - b.pos.z) * 14.0 * dt;
          }
        }

        // Heavy friction/damping so balls roll like solid glass/resin spheres
        b.vel.x *= isTumbling ? 0.96 : 0.91;
        b.vel.z *= isTumbling ? 0.96 : 0.91;
        b.vel.y *= 0.95;

        // Clamp vertical velocity so no collision can ever pop a ball into the upper dome
        if (b.vel.y > 1.8) b.vel.y = 1.8;

        b.pos.addScaledVector(b.vel, dt);

        // Realistic rolling rotation proportional to horizontal travel
        b.mesh.rotation.x += b.vel.z * 3.2 * dt;
        b.mesh.rotation.z -= b.vel.x * 3.2 * dt;

        // Central axis rod collision
        const rXZ = Math.sqrt(b.pos.x * b.pos.x + b.pos.z * b.pos.z);
        if (rXZ < rodMinR && rXZ > 0.0001) {
          const nx = b.pos.x / rXZ;
          const nz = b.pos.z / rXZ;
          b.pos.x = nx * rodMinR;
          b.pos.z = nz * rodMinR;
          const vn = b.vel.x * nx + b.vel.z * nz;
          if (vn < 0) {
            b.vel.x -= 1.2 * vn * nx;
            b.vel.z -= 1.2 * vn * nz;
          }
        }

        // Sloped funnel floor inside globe (y = 0.66 + slight slope toward center)
        const floorY = 0.66 + rXZ * 0.08;
        if (b.pos.y < floorY) {
          b.pos.y = floorY;
          if (b.vel.y < 0) b.vel.y = -b.vel.y * 0.22;
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
            b.vel.x -= 1.25 * vn * nx;
            b.vel.y -= 1.25 * vn * ny;
            b.vel.z -= 1.25 * vn * nz;
          }
        }
      }

      // Pairwise Sphere-to-Sphere Collisions (3 iterations for rock-solid resting stack)
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
              const overlap = (minDist - dist) * 0.5;
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
                  const impulse = -(1 + 0.25) * velAlongNormal * 0.5;
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

      // Update 3D burst particles
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
        // Subtle breathing gleam on the 3D Lever so user knows to pull it
        if (!this.isPullingLeverDrag) {
          const idleBob = Math.sin(performance.now() * 0.0035) * 0.045;
          this.leverPivot.rotation.x = this.leverRestAngle + idleBob;
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

        // Pull lever down from -0.28 rad to +1.15 rad in first 65%, then spring back up!
        let leverAngle = this.leverRestAngle;
        if (t < 0.68) {
          const p = t / 0.68;
          const easeInOut = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          leverAngle = this.leverRestAngle + easeInOut * 1.42;
        } else {
          const p = (t - 0.68) / 0.32;
          const springBack = 1 - Math.exp(-p * 6) * Math.cos(p * 12);
          leverAngle = (this.leverRestAngle + 1.42) - springBack * 1.42;
        }
        this.leverPivot.rotation.x = leverAngle;

        // Rotate internal agitator wheel smoothly
        this.agitatorGroup.rotation.y += dt * 7.5;

        const ratchetStep = Math.floor(t * 7);
        if (ratchetStep > this.lastRatchetStep && ratchetStep <= 6) {
          this.lastRatchetStep = ratchetStep;
          this.sfx.playRatchetClick(0.92 + ratchetStep * 0.03);
          this.sfx.playBallRollClack(0.65);
        }

        // Center camera cleanly on the machine
        this.userYaw *= 0.88;
        this.currentCamPos.lerp(new THREE.Vector3(0, 0.35, this.defaultCamPos.z - 0.55), Math.min(1, dt * 5));
        this.currentLookAt.lerp(new THREE.Vector3(0, 0.15, 0), Math.min(1, dt * 5));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);

        if (this.stateTimer >= duration) {
          this.state = 'BALL_VISIBLE_FALL';
          this.stateTimer = 0;
          this.leverPivot.rotation.x = this.leverRestAngle;

          // Detach the chosen ball from the dome constraint so it physically drops down the visible front chute!
          if (this.droppingBall) {
            this.droppingBall.isDropping = true;
            // Start right at the bottom-front funnel aperture where it rolled!
            this.droppingBall.pos.set(0, 0.56, 0.62);
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
            // Phase A (0.0 -> 0.58): Ball accelerates downward under gravity inside the glass-windowed front chute
            const fallP = t / 0.58;
            const accelP = fallP * fallP;
            b.pos.x = 0;
            b.pos.y = 0.56 - accelP * 2.18; // Drops from y = +0.56 down to y = -1.62
            b.pos.z = 0.62 + fallP * 0.46; // Moves into the front chute channel (z = 1.08)
            b.mesh.rotation.x += dt * 11.0;
            b.mesh.rotation.z += dt * 3.5;
          } else {
            // Phase B (0.58 -> 1.0): Ball kicks open the chrome flap door and bounces onto the curved front tray!
            if (!this._playedDoorSound) {
              this._playedDoorSound = true;
              this.sfx.playChuteBounceAndDoor();
            }
            const outP = (t - 0.58) / 0.42;
            // Bounce arc on the lower tray
            const bounce = Math.abs(Math.sin(outP * Math.PI * 1.5)) * (1 - outP) * 0.22;
            b.pos.x = 0;
            b.pos.y = -1.62 - outP * 0.16 + bounce;
            b.pos.z = 1.08 + outP * 0.44; // Rolls out to z = 1.52 on the tray lip
            b.mesh.rotation.x += dt * 9.0 * (1 - outP * 0.5);
          }
        }

        // Flap door swings open when the falling ball reaches y = -1.45 (t >= 0.52)
        if (t >= 0.50) {
          const doorT = (t - 0.50) / 0.50;
          const flapAngle = doorT < 0.45
            ? -Math.sin((doorT / 0.45) * (Math.PI / 2)) * 1.32
            : -1.32 * Math.exp(-(doorT - 0.45) * 4.0) * Math.cos((doorT - 0.45) * 12);
          this.flapPivot.rotation.x = Math.min(0, flapAngle);
        }

        // Camera follows the falling ball down to the lower collection tray
        this.currentCamPos.lerp(new THREE.Vector3(0, -0.25, this.defaultCamPos.z - 0.9), Math.min(1, dt * 6));
        this.currentLookAt.lerp(new THREE.Vector3(0, -1.05, 0.85), Math.min(1, dt * 6));
        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);

        if (this.stateTimer >= duration) {
          this._playedDoorSound = false;
          this.state = 'HERO_PRESENTATION';
          this.stateTimer = 0;

          // Seamlessly hand off the dropped ball's exact world position to the split-able Hero Capsule!
          const worldStartPos = new THREE.Vector3(0, -1.78 + this.machineGroup.position.y, 1.52);
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

        const targetPos = new THREE.Vector3(0, 0.38, 4.15);
        this.heroGroup.position.lerp(targetPos, Math.min(1, dt * 9.0));
        const sc = 0.62 + 0.46 * easeOut;
        this.heroGroup.scale.set(sc, sc, sc);

        const vib = Math.min(1, this.stateTimer / 0.6) * 0.028;
        this.heroGroup.position.x = Math.sin(this.stateTimer * 55) * vib;
        this.heroGroup.rotation.y += dt * (4.2 + this.stateTimer * 5.5);

        const seamGap = Math.min(0.06, this.stateTimer * 0.06);
        this.heroTopHalf.position.y = seamGap;
        this.heroBottomHalf.position.y = -seamGap;
        this.heroLight.intensity = Math.min(2.5, this.stateTimer * 4.0);

        this.currentCamPos.lerp(new THREE.Vector3(0, 0.42, this.defaultCamPos.z - 0.6), Math.min(1, dt * 6));
        this.currentLookAt.lerp(new THREE.Vector3(0, 0.25, 2.2), Math.min(1, dt * 6));
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

        this.heroGroup.position.lerp(new THREE.Vector3(0, 0.65, 4.20), Math.min(1, dt * 7));
        this.heroGroup.rotation.set(0, 0, 0);

        // Two capsule halves split open cleanly
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

        // Check if user touched/clicked the 3D Lever on the machine!
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
          // Either a tap on the lever or a partial pull triggers the lever draw!
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
      this.camera.fov = aspect < 0.65 ? 44 : 38;
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
      this.defaultCamPos.z = aspect < 0.65 ? 8.35 : 7.55;
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
