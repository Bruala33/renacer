/**
 * ============================================================================
 * HYPER-REALISTIC 3D VINTAGE GUMBALL MACHINE (THREE.JS PBR)
 * - Side-Mounted Outward Lever (Zero Collision / Clipping with Machine)
 * - Rock-Steady Sleeping Physics in IDLE (Zero Ball Vibration)
 * - Clean Capsule Split-Open Animation Framing the Live Visual Prize
 * ============================================================================
 */

(function () {
  'use strict';

  const RARITY_TIERS = {
    classic: {
      id: 'classic',
      label: '★ CLÁSICO ★',
      shellHex: 0x0284c7,
      glowHex: 0x38bdf8,
      cssColor: '#38bdf8',
      badgeBg: 'linear-gradient(135deg, #0284c7, #38bdf8)',
      badgeText: '#ffffff'
    },
    rare: {
      id: 'rare',
      label: '★★ RARO ★★',
      shellHex: 0x059669,
      glowHex: 0x34d399,
      cssColor: '#34d399',
      badgeBg: 'linear-gradient(135deg, #059669, #34d399)',
      badgeText: '#022c22'
    },
    epic: {
      id: 'epic',
      label: '★★★ ÉPICO ★★★',
      shellHex: 0x9333ea,
      glowHex: 0xe879f9,
      cssColor: '#e879f9',
      badgeBg: 'linear-gradient(135deg, #7e22ce, #ec4899)',
      badgeText: '#ffffff'
    },
    legendary: {
      id: 'legendary',
      label: '♛ LEGENDARIO ♛',
      shellHex: 0xd97706,
      glowHex: 0xfde047,
      cssColor: '#fde047',
      badgeBg: 'linear-gradient(135deg, #f59e0b, #fef08a, #d97706)',
      badgeText: '#1c1917'
    }
  };

  const CAPSULE_PALETTE = [
    0xef4444, // Cherry Red
    0x3b82f6, // Cobalt Blue
    0x10b981, // Emerald Green
    0xf59e0b, // Amber Gold
    0xa855f7, // Amethyst Purple
    0xec4899, // Rose Pink
    0x06b6d4  // Turquoise Cyan
  ];

  // ==========================================================================
  // PROCEDURAL WEB AUDIO MECHANICAL & PRIZE SYNTHESIZER
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

    playLeverPull() {
      const ctx = this._ensureCtx();
      const vol = this.getVol();
      if (!ctx || vol <= 0) return;

      // Ratchet clicks as the side lever pulls down and returns
      const clicks = [0, 0.055, 0.11, 0.17, 0.24, 0.32, 0.42];
      clicks.forEach((delay, idx) => {
        const t = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(190 + idx * 24, t);
        osc.frequency.exponentialRampToValueAtTime(68, t + 0.04);
        gain.gain.setValueAtTime(0.24 * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
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
      osc.frequency.setValueAtTime(520 + Math.random() * 240, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.032);
      gain.gain.setValueAtTime(0.11 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    }

    playChuteDropBounce() {
      const ctx = this._ensureCtx();
      const vol = this.getVol();
      if (!ctx || vol <= 0) return;

      const hits = [
        { d: 0.0, f: 340, a: 0.28 },
        { d: 0.16, f: 420, a: 0.22 },
        { d: 0.31, f: 280, a: 0.32 }
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

    playCapsuleOpenFanfare(rarity = 'classic') {
      const ctx = this._ensureCtx();
      const vol = this.getVol();
      if (!ctx || vol <= 0) return;
      const now = ctx.currentTime;

      // Crisp pop sound of the plastic capsule shell snapping open
      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(320, now);
      popOsc.frequency.exponentialRampToValueAtTime(1180, now + 0.065);
      popGain.gain.setValueAtTime(0.32 * vol, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      popOsc.connect(popGain);
      popGain.connect(ctx.destination);
      popOsc.start(now);
      popOsc.stop(now + 0.08);

      const chords = {
        classic: [523.25, 659.25, 783.99, 1046.50],
        rare: [587.33, 739.99, 880.00, 1174.66, 1479.98],
        epic: [523.25, 659.25, 783.99, 987.77, 1318.51, 1567.98],
        legendary: [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]
      };
      const notes = chords[rarity] || chords.classic;
      notes.forEach((freq, i) => {
        const t = now + 0.05 + i * 0.055;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.20 * vol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.68);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.72);
      });
    }
  }

  // ==========================================================================
  // MAIN 3D VINTAGE GUMBALL MACHINE ENGINE
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
      this.pendingReward = null;

      this.globeCenter = typeof THREE !== 'undefined' ? new THREE.Vector3(0, 1.55, 0) : null;
      this.globeRadius = 1.48;
      this.capsuleRadius = 0.25;
      this.capsules = [];

      // Drag/Tap interaction state for the 3D lever
      this.isDraggingLever = false;
      this.dragStartY = 0;
      this.leverPullProgress = 0;

      if (typeof THREE !== 'undefined') {
        this._initThreeScene();
        this._buildMaterials();
        this._buildMachineGeometry();
        this._populateCapsules(28);
        this._buildDispensingCapsuleRig();
        this._buildBurstParticles();
        this._bindPointerInteraction();
      }
    }

    _initThreeScene() {
      this.scene = new THREE.Scene();

      const w = this.canvas.clientWidth || window.innerWidth || 380;
      const h = this.canvas.clientHeight || window.innerHeight || 680;

      this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
      this.baseCamPos = new THREE.Vector3(0.10, 0.28, 9.6);
      this.baseLookAt = new THREE.Vector3(0.08, 0.12, 0);
      this.currentCamPos = this.baseCamPos.clone();
      this.currentLookAt = this.baseLookAt.clone();
      this.targetCamPos = this.baseCamPos.clone();
      this.targetLookAt = this.baseLookAt.clone();

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
      if ('outputColorSpace' in this.renderer) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      } else if ('outputEncoding' in this.renderer) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;

      // Balanced Studio Lighting
      const ambient = new THREE.AmbientLight(0xfff5ea, 0.72);
      this.scene.add(ambient);

      const hemi = new THREE.HemisphereLight(0xffffff, 0x241018, 0.65);
      hemi.position.set(0, 8, 0);
      this.scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.45);
      keyLight.position.set(4.2, 7.2, 6.2);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      this.scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.60);
      fillLight.position.set(-5.0, 2.5, 4.0);
      this.scene.add(fillLight);

      const rimLight = new THREE.SpotLight(0xfbbf24, 1.15, 18, Math.PI * 0.35, 0.5);
      rimLight.position.set(0, 5.5, -5.0);
      this.scene.add(rimLight);

      this.prizeLight = new THREE.PointLight(0xfde047, 0, 5.5);
      this.prizeLight.position.set(0, -0.15, 3.6);
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
      g.addColorStop(0.0, '#ffffff');
      g.addColorStop(0.22, '#dbeafe');
      g.addColorStop(0.48, '#334155');
      g.addColorStop(0.52, '#0f172a');
      g.addColorStop(0.80, '#fde68a');
      g.addColorStop(1.0, '#78350f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 128);

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(28, 14, 52, 22);
      ctx.fillRect(156, 18, 60, 20);

      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      return tex;
    }

    _createBrassPlateTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d');

      const bg = ctx.createLinearGradient(0, 0, 512, 256);
      bg.addColorStop(0.0, '#78350f');
      bg.addColorStop(0.3, '#d97706');
      bg.addColorStop(0.5, '#fde047');
      bg.addColorStop(0.7, '#b45309');
      bg.addColorStop(1.0, '#451a03');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 8;
      ctx.strokeRect(14, 14, 484, 228);

      ctx.fillStyle = '#290f02';
      ctx.fillRect(26, 26, 460, 204);

      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 72px "Cinzel", Georgia, serif';
      ctx.fillText('100 𝄞', 256, 108);

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TIRA DE LA PALANCA', 256, 182);

      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    _buildMaterials() {
      const envMap = this._createEnvTexture();

      // Deep Vintage Crimson Enamel
      this.crimsonMat = new THREE.MeshPhysicalMaterial({
        color: 0xb91c1c,
        metalness: 0.25,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        envMap,
        envMapIntensity: 1.1
      });

      // Polished Mirror Chrome
      this.chromeMat = new THREE.MeshPhysicalMaterial({
        color: 0xf1f5f9,
        metalness: 0.92,
        roughness: 0.08,
        clearcoat: 0.6,
        envMap,
        envMapIntensity: 1.4
      });

      // Warm Vintage Gold / Brass
      this.brassMat = new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.16,
        clearcoat: 0.5,
        envMap,
        envMapIntensity: 1.25
      });

      // Dark Cast Iron Base
      this.castIronMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.70,
        roughness: 0.38,
        envMap,
        envMapIntensity: 0.6
      });

      // Crystal-Clear Glass Globe
      this.glassGlobeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        roughness: 0.04,
        metalness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMap,
        envMapIntensity: 1.5,
        depthWrite: false
      });

      // Clear Acrylic Front Chute
      this.chuteGlassMat = new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.28,
        roughness: 0.06,
        metalness: 0.05,
        clearcoat: 1.0,
        envMap,
        envMapIntensity: 1.2,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      // Translucent Capsule Top Dome
      this.capsuleTopMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.46,
        roughness: 0.08,
        metalness: 0.05,
        clearcoat: 1.0,
        envMap,
        envMapIntensity: 1.2
      });

      this.envMap = envMap;
    }

    _buildMachineGeometry() {
      // 1. CIRCULAR STAGE PEDESTAL
      const stageBase = new THREE.Mesh(
        new THREE.CylinderGeometry(2.25, 2.45, 0.24, 48),
        this.castIronMat
      );
      stageBase.position.y = -2.28;
      stageBase.receiveShadow = true;
      this.machineRoot.add(stageBase);

      const stageBrassTrim = new THREE.Mesh(
        new THREE.TorusGeometry(2.30, 0.04, 16, 64),
        this.brassMat
      );
      stageBrassTrim.rotation.x = Math.PI / 2;
      stageBrassTrim.position.y = -2.16;
      this.machineRoot.add(stageBrassTrim);

      // 2. LOWER CAST-IRON FOOT & CRIMSON SKIRT
      const ironFoot = new THREE.Mesh(
        new THREE.CylinderGeometry(1.38, 1.62, 0.34, 48),
        this.castIronMat
      );
      ironFoot.position.y = -1.98;
      this.machineRoot.add(ironFoot);

      const lowerSkirt = new THREE.Mesh(
        new THREE.CylinderGeometry(1.06, 1.44, 0.56, 48),
        this.crimsonMat
      );
      lowerSkirt.position.y = -1.58;
      this.machineRoot.add(lowerSkirt);

      const waistBelt = new THREE.Mesh(
        new THREE.TorusGeometry(1.08, 0.055, 18, 48),
        this.brassMat
      );
      waistBelt.rotation.x = Math.PI / 2;
      waistBelt.position.y = -1.28;
      this.machineRoot.add(waistBelt);

      // 3. UPPER TAPERED CRIMSON BODY
      const upperBody = new THREE.Mesh(
        new THREE.CylinderGeometry(1.32, 1.06, 1.50, 48),
        this.crimsonMat
      );
      upperBody.position.y = -0.52;
      this.machineRoot.add(upperBody);

      // 4. CHROME COLLAR RING CRADLING THE GLOBE
      const collarCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(1.36, 1.32, 0.24, 48),
        this.chromeMat
      );
      collarCyl.position.y = 0.26;
      this.machineRoot.add(collarCyl);

      const collarRim = new THREE.Mesh(
        new THREE.TorusGeometry(1.36, 0.06, 18, 48),
        this.chromeMat
      );
      collarRim.rotation.x = Math.PI / 2;
      collarRim.position.y = 0.35;
      this.machineRoot.add(collarRim);

      // Internal funnel deck inside globe base
      const funnelFloor = new THREE.Mesh(
        new THREE.CylinderGeometry(1.24, 0.92, 0.14, 40),
        this.chromeMat
      );
      funnelFloor.position.y = 0.32;
      this.machineRoot.add(funnelFloor);

      // 5. AGITATOR PADDLE WHEEL & CENTER ROD INSIDE GLOBE
      this.agitatorGroup = new THREE.Group();
      this.agitatorGroup.position.set(0, 0.42, 0);
      this.machineRoot.add(this.agitatorGroup);

      const agitatorHub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.36, 0.14, 24),
        this.brassMat
      );
      this.agitatorGroup.add(agitatorHub);

      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(1.52, 0.07, 0.09),
          this.brassMat
        );
        blade.rotation.y = (i * Math.PI) / 2;
        blade.position.y = 0.04;
        this.agitatorGroup.add(blade);
      }

      const centerPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 2.55, 20),
        this.chromeMat
      );
      centerPost.position.set(0, 1.65, 0);
      this.machineRoot.add(centerPost);

      // 6. SPHERICAL GLASS GLOBE + SPECULAR RIM
      this.globeGroup = new THREE.Group();
      this.globeGroup.position.copy(this.globeCenter);
      this.machineRoot.add(this.globeGroup);

      const glassSphere = new THREE.Mesh(
        new THREE.SphereGeometry(this.globeRadius, 48, 36),
        this.glassGlobeMat
      );
      glassSphere.renderOrder = 3;
      this.globeGroup.add(glassSphere);

      // 7. FLUSH VINTAGE TOP CROWN LID
      this.topCrownGroup = new THREE.Group();
      this.topCrownGroup.position.set(0, 2.94, 0);
      this.machineRoot.add(this.topCrownGroup);

      const crownRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.68, 0.05, 16, 40),
        this.chromeMat
      );
      crownRim.rotation.x = Math.PI / 2;
      crownRim.position.y = -0.02;
      this.topCrownGroup.add(crownRim);

      const crownDome = new THREE.Mesh(
        new THREE.ConeGeometry(0.70, 0.34, 40),
        this.crimsonMat
      );
      crownDome.position.y = 0.15;
      this.topCrownGroup.add(crownDome);

      const finialKnob = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 24, 24),
        this.brassMat
      );
      finialKnob.position.y = 0.36;
      this.topCrownGroup.add(finialKnob);

      // 8. FRONT ESCUTCHEON PLATE ("100 𝄞 TIRA DE LA PALANCA")
      const plateFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.98, 0.56, 0.10),
        this.chromeMat
      );
      plateFrame.position.set(0, -0.34, 1.16);
      plateFrame.rotation.x = -0.14;
      this.machineRoot.add(plateFrame);

      const badgePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.86, 0.44),
        new THREE.MeshBasicMaterial({ map: this._createBrassPlateTexture() })
      );
      badgePlane.position.set(0, -0.34, 1.22);
      badgePlane.rotation.x = -0.14;
      this.machineRoot.add(badgePlane);

      // 9. TRANSPARENT FRONT CHUTE & COLLECTION TRAY
      const chuteBackWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 0.92, 0.12),
        this.castIronMat
      );
      chuteBackWall.position.set(0, -1.12, 1.05);
      chuteBackWall.rotation.x = 0.14;
      this.machineRoot.add(chuteBackWall);

      const chuteTunnel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.30, 0.88, 24, 1, true, -Math.PI * 0.48, Math.PI * 0.96),
        this.chuteGlassMat
      );
      chuteTunnel.position.set(0, -1.10, 1.14);
      chuteTunnel.rotation.x = 0.22;
      chuteTunnel.renderOrder = 4;
      this.machineRoot.add(chuteTunnel);

      this.chuteFlapPivot = new THREE.Group();
      this.chuteFlapPivot.position.set(0, -1.40, 1.28);
      this.machineRoot.add(this.chuteFlapPivot);

      const chuteFlap = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.32, 0.04),
        this.chromeMat
      );
      chuteFlap.position.set(0, -0.14, 0);
      this.chuteFlapPivot.add(chuteFlap);

      // Collection Tray
      const trayGroup = new THREE.Group();
      trayGroup.position.set(0, -1.78, 1.44);
      this.machineRoot.add(trayGroup);

      const trayFloor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.40, 0.14, 32),
        this.chromeMat
      );
      trayGroup.add(trayFloor);

      const trayLip = new THREE.Mesh(
        new THREE.TorusGeometry(0.44, 0.055, 16, 32, Math.PI * 1.15),
        this.brassMat
      );
      trayLip.rotation.x = Math.PI / 2;
      trayLip.rotation.z = -Math.PI * 0.075;
      trayLip.position.y = 0.07;
      trayGroup.add(trayLip);

      // ====================================================================
      // 10. SIDE-MOUNTED 3D LEVER WITH OUTWARD AXLE (ZERO MACHINE COLLISION!)
      // ====================================================================
      // Placed on the pure right side (+X), with a horizontal axle extending out
      // to X = 1.72, completely clear of the crimson body (r=1.32) and globe (r=1.48)!
      this.leverGroup = new THREE.Group();
      this.leverGroup.position.set(1.16, -0.48, 0.08);
      this.leverGroup.rotation.set(0, 0, 0);
      this.machineRoot.add(this.leverGroup);

      // Side gearbox mount bolted onto the right wall of the crimson body
      const leverMountBox = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.28, 0.34, 24),
        this.chromeMat
      );
      leverMountBox.rotation.z = Math.PI / 2;
      leverMountBox.position.set(0.08, 0, 0);
      this.leverGroup.add(leverMountBox);

      const leverBrassRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.035, 14, 24),
        this.brassMat
      );
      leverBrassRing.rotation.y = Math.PI / 2;
      leverBrassRing.position.set(0.25, 0, 0);
      this.leverGroup.add(leverBrassRing);

      // Horizontal chrome axle shaft extending outward to X = 1.16 + 0.54 = 1.70
      const outwardAxle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.56, 20),
        this.chromeMat
      );
      outwardAxle.rotation.z = Math.PI / 2;
      outwardAxle.position.set(0.36, 0, 0);
      this.leverGroup.add(outwardAxle);

      // Pivot hub at X = 1.16 + 0.56 = 1.72 (well outside the 1.48 globe radius!)
      this.leverPivot = new THREE.Group();
      this.leverPivot.position.set(0.56, 0, 0);
      this.leverGroup.add(this.leverPivot);

      const outerHub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.16, 24),
        this.brassMat
      );
      outerHub.rotation.z = Math.PI / 2;
      this.leverPivot.add(outerHub);

      // Lever Arm + Knob moving strictly in the vertical Y-Z plane at X = 1.72
      const leverArmGroup = new THREE.Group();
      // Slight outward cant (+Z forward and +X clear) so it never approaches the machine
      leverArmGroup.rotation.z = -0.05;
      this.leverPivot.add(leverArmGroup);

      const leverShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.075, 1.12, 20),
        this.chromeMat
      );
      leverShaft.position.set(0, 0.54, 0);
      leverArmGroup.add(leverShaft);

      const knobCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10, 0.065, 0.12, 20),
        this.brassMat
      );
      knobCollar.position.set(0, 1.08, 0);
      leverArmGroup.add(knobCollar);

      this.leverKnobMat = new THREE.MeshPhysicalMaterial({
        color: 0xdc2626,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.35,
        metalness: 0.15,
        roughness: 0.10,
        clearcoat: 1.0,
        envMap: this.envMap,
        envMapIntensity: 1.4
      });

      this.leverKnobMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 32, 32),
        this.leverKnobMat
      );
      this.leverKnobMesh.position.set(0, 1.26, 0);
      leverArmGroup.add(this.leverKnobMesh);

      this.leverInteractables = [
        this.leverKnobMesh,
        leverShaft,
        knobCollar,
        outerHub,
        outwardAxle,
        leverMountBox
      ];
    }

    _createSingleCapsuleMesh(colorHex) {
      const group = new THREE.Group();
      const r = this.capsuleRadius;

      const bottomMat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        metalness: 0.18,
        roughness: 0.14,
        clearcoat: 1.0,
        envMap: this.envMap,
        envMapIntensity: 1.15
      });

      const bottomHemisphere = new THREE.Mesh(
        new THREE.SphereGeometry(r, 24, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        bottomMat
      );
      group.add(bottomHemisphere);

      const topHemisphere = new THREE.Mesh(
        new THREE.SphereGeometry(r, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        this.capsuleTopMat
      );
      group.add(topHemisphere);

      const seamBand = new THREE.Mesh(
        new THREE.TorusGeometry(r * 0.99, 0.015, 8, 24),
        this.brassMat
      );
      seamBand.rotation.x = Math.PI / 2;
      group.add(seamBand);

      const coreGem = new THREE.Mesh(
        new THREE.OctahedronGeometry(r * 0.40, 0),
        new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: 0.55,
          roughness: 0.18,
          metalness: 0.75
        })
      );
      group.add(coreGem);

      return group;
    }

    _populateCapsules(count = 28) {
      this.capsules.forEach((c) => this.scene.remove(c.mesh));
      this.capsules = [];

      for (let i = 0; i < count; i++) {
        const colorHex = CAPSULE_PALETTE[i % CAPSULE_PALETTE.length];
        const mesh = this._createSingleCapsuleMesh(colorHex);

        const layer = Math.floor(i / 8);
        const angle = (i % 8) * ((Math.PI * 2) / 8) + layer * 0.45;
        const rad = 0.26 + (i % 3) * 0.28;

        const pos = new THREE.Vector3(
          Math.cos(angle) * rad,
          this.globeCenter.y - 0.62 + layer * 0.36,
          Math.sin(angle) * rad
        );

        mesh.position.copy(pos);
        mesh.rotation.set(i * 0.7, i * 1.1, i * 0.5);
        this.scene.add(mesh);

        this.capsules.push({
          mesh,
          colorHex,
          pos,
          vel: new THREE.Vector3(0, 0, 0),
          angVel: new THREE.Vector3(0, 0, 0)
        });
      }

      // Pre-settle in silence so balls start 100% motionless
      for (let step = 0; step < 160; step++) {
        this._stepCapsulePhysics(1 / 60, false, true);
      }
      for (let i = 0; i < this.capsules.length; i++) {
        this.capsules[i].vel.set(0, 0, 0);
        this.capsules[i].angVel.set(0, 0, 0);
        this.capsules[i].mesh.position.copy(this.capsules[i].pos);
      }
    }

    _buildDispensingCapsuleRig() {
      this.activeCapsuleRig = new THREE.Group();
      this.activeCapsuleRig.visible = false;
      this.scene.add(this.activeCapsuleRig);

      const r = this.capsuleRadius * 1.15;

      this.activeBottomMat = new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        metalness: 0.30,
        roughness: 0.12,
        clearcoat: 1.0,
        envMap: this.envMap,
        envMapIntensity: 1.4
      });

      this.activeTopMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.52,
        roughness: 0.05,
        metalness: 0.05,
        clearcoat: 1.0,
        envMap: this.envMap,
        envMapIntensity: 1.5
      });

      this.activeBottomHalf = new THREE.Group();
      const botShell = new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        this.activeBottomMat
      );
      const botRim = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.024, 12, 32),
        this.brassMat
      );
      botRim.rotation.x = Math.PI / 2;
      this.activeBottomHalf.add(botShell, botRim);
      this.activeCapsuleRig.add(this.activeBottomHalf);

      this.activeTopHalf = new THREE.Group();
      const topShell = new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2),
        this.activeTopMat
      );
      const topRim = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.022, 12, 32),
        this.chromeMat
      );
      topRim.rotation.x = Math.PI / 2;
      this.activeTopHalf.add(topShell, topRim);
      this.activeCapsuleRig.add(this.activeTopHalf);
    }

    _buildBurstParticles() {
      this.burstParticles = [];
      const geo = new THREE.OctahedronGeometry(0.055, 0);
      for (let i = 0; i < 42; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        this.scene.add(mesh);
        this.burstParticles.push({
          mesh,
          vel: new THREE.Vector3(),
          life: 0,
          maxLife: 1.0
        });
      }
    }

    _triggerBurstParticles(origin, colorHex) {
      for (let i = 0; i < this.burstParticles.length; i++) {
        const p = this.burstParticles[i];
        p.mesh.visible = true;
        p.mesh.position.copy(origin);
        p.mesh.material.color.setHex(i % 3 === 0 ? 0xffffff : colorHex);
        p.mesh.material.opacity = 1.0;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.6 + Math.random() * 3.4;
        p.vel.set(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed + 0.8,
          Math.cos(phi) * speed
        );
        p.life = 0;
        p.maxLife = 0.65 + Math.random() * 0.55;
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

      const checkHitsLeverOrMachine = () => {
        this.raycaster.setFromCamera(this.pointerNDC, this.camera);
        const hits = this.raycaster.intersectObjects(this.leverInteractables, true);
        if (hits.length > 0) return 'lever';
        // Generous screen-space hitbox around the right-side lever
        if (this.pointerNDC.x > 0.12 && this.pointerNDC.y > -0.60 && this.pointerNDC.y < 0.35) {
          return 'lever';
        }
        return null;
      };

      this._onPointerDown = (e) => {
        if (this.state !== 'IDLE') return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        updateNDC(clientX, clientY);

        const target = checkHitsLeverOrMachine();
        if (target === 'lever') {
          this.isDraggingLever = true;
          this.dragStartY = clientY;
          this.leverPullProgress = 0.15;
        }
      };

      this._onPointerMove = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (this.isDraggingLever && this.state === 'IDLE') {
          const dy = clientY - this.dragStartY;
          this.leverPullProgress = Math.max(0.1, Math.min(1.0, 0.15 + dy / 90));
          // Pull lever forward around X-axis at X=1.72 (0 collision with machine!)
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
          const target = checkHitsLeverOrMachine();
          this.canvas.style.cursor = target === 'lever' ? 'grab' : 'default';
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

    shakeGlobe(intensity = 0.5) {
      if (this.state !== 'IDLE') return;
      this.sfx.playCapsuleumble();
      this._wakeTimer = 0.55;
      for (let i = 0; i < this.capsules.length; i++) {
        const c = this.capsules[i];
        c.vel.x += (Math.random() - 0.5) * 4.5 * intensity;
        c.vel.y += (0.5 + Math.random() * 1.8) * intensity;
        c.vel.z += (Math.random() - 0.5) * 4.5 * intensity;
      }
    }

    startVendingSequence(rewardData) {
      if (this.state !== 'IDLE' && this.state !== 'CAPSULE_BURST_OPEN') return;

      this.resetToIdle();
      this.pendingReward = rewardData || {
        rarity: 'classic',
        title: '+80 𝄞 Claves de Sol',
        desc: 'Premio directo de la máquina expendedora.'
      };

      const tier = RARITY_TIERS[this.pendingReward.rarity] || RARITY_TIERS.classic;
      this.activeBottomMat.color.setHex(tier.shellHex);
      this.prizeLight.color.setHex(tier.glowHex);

      // Select lowest front capsule to drop down the chute
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
      this.activeCapsuleRig.visible = false;
      this.activeCapsuleRig.scale.set(1, 1, 1);
      this.activeTopHalf.position.set(0, 0, 0);
      this.activeTopHalf.rotation.set(0, 0, 0);
      this.activeBottomHalf.position.set(0, 0, 0);
      this.activeBottomHalf.rotation.set(0, 0, 0);
      this.leverPivot.rotation.set(0, 0, 0);
      this.chuteFlapPivot.rotation.set(0, 0, 0);
      this.prizeLight.intensity = 0;

      if (this.dispensedPoolCapsule) {
        this.dispensedPoolCapsule.mesh.visible = true;
        this.dispensedPoolCapsule.pos.set(
          (Math.random() - 0.5) * 0.45,
          this.globeCenter.y + 0.55,
          (Math.random() - 0.5) * 0.45
        );
        this.dispensedPoolCapsule.vel.set(0, 0, 0);
        this.dispensedPoolCapsule.mesh.position.copy(this.dispensedPoolCapsule.pos);
        this.dispensedPoolCapsule = null;
      }

      for (let i = 0; i < this.capsules.length; i++) {
        this.capsules[i].vel.set(0, 0, 0);
        this.capsules[i].angVel.set(0, 0, 0);
      }

      this.targetCamPos.copy(this.baseCamPos);
      this.targetLookAt.copy(this.baseLookAt);

      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange('IDLE');
      }
    }

    _stepCapsulePhysics(dt, agitate = false, silent = false) {
      // ROCK-STEADY SLEEPING PHYSICS IN IDLE: zero vibration when idle!
      if (this.state === 'IDLE' && !agitate && (!this._wakeTimer || this._wakeTimer <= 0)) {
        return;
      }
      if (this._wakeTimer > 0) {
        this._wakeTimer = Math.max(0, this._wakeTimer - dt);
      }

      const safeDt = Math.min(dt, 0.025);
      const gravity = -26.0;
      const maxContainR = this.globeRadius - this.capsuleRadius - 0.08;
      const minDist = this.capsuleRadius * 2.0;
      const floorY = this.globeCenter.y - 1.00;

      for (let i = 0; i < this.capsules.length; i++) {
        const c = this.capsules[i];
        if (c === this.dispensedPoolCapsule && !c.mesh.visible) continue;

        c.vel.y += gravity * safeDt;

        if (agitate) {
          const dx = c.pos.x;
          const dz = c.pos.z;
          const distXZ = Math.hypot(dx, dz) || 0.001;
          const heightFactor = Math.max(0, 1.0 - (c.pos.y - floorY) / 1.15);
          const swirlStrength = 10.5 * heightFactor;

          c.vel.x += (-dz / distXZ) * swirlStrength * safeDt;
          c.vel.z += (dx / distXZ) * swirlStrength * safeDt;
          c.vel.y += (1.2 + Math.sin(this.stateTimer * 16 + i) * 1.4) * heightFactor * safeDt;

          if (!silent && Math.random() < 0.05) {
            this.sfx.playCapsuleumble();
          }
        }

        const damping = agitate ? 0.94 : 0.80;
        c.vel.multiplyScalar(damping);
        c.pos.addScaledVector(c.vel, safeDt);

        if (c.pos.y < floorY) {
          c.pos.y = floorY;
          if (c.vel.y < 0) c.vel.y *= -0.15;
          c.vel.x *= 0.82;
          c.vel.z *= 0.82;
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

      for (let iter = 0; iter < 3; iter++) {
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
                const imp = -0.52 * vn;
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

        const speed = c.vel.length();
        if (!agitate && speed < 0.08) {
          c.vel.set(0, 0, 0);
        } else {
          c.mesh.position.copy(c.pos);
          c.mesh.rotation.x += c.vel.z * safeDt * 1.4;
          c.mesh.rotation.z -= c.vel.x * safeDt * 1.4;
        }
      }
    }

    _updateAnimationState(dt) {
      const now = performance.now() * 0.001;

      if (this.state === 'IDLE') {
        this.machineRoot.rotation.y = Math.sin(now * 0.45) * 0.035;
        if (!this.isDraggingLever) {
          this.leverPivot.rotation.x += (0 - this.leverPivot.rotation.x) * Math.min(1, dt * 10);
        }
        this.leverKnobMat.emissiveIntensity = 0.28 + 0.22 * Math.sin(now * 3.2);
        this._stepCapsulePhysics(dt, false);
      }

      // PHASE 1: LEVER PULLS FORWARD ON THE SIDE & AGITATES GLOBE
      else if (this.state === 'LEVER_PULL') {
        this.stateTimer += dt;
        const p = Math.min(1.0, this.stateTimer / 0.85);

        // Smooth pull down to +1.10 rad around X at X=1.72, then spring back
        let leverAngle = 0;
        if (p < 0.55) {
          const t = p / 0.55;
          leverAngle = Math.sin(t * Math.PI * 0.5) * 1.10;
        } else {
          const t = (p - 0.55) / 0.45;
          leverAngle = (1 - t) * 1.10 * Math.cos(t * Math.PI * 0.5);
        }
        this.leverPivot.rotation.x = leverAngle;

        this.agitatorGroup.rotation.y += dt * 9.5 * Math.sin(p * Math.PI);
        this.machineRoot.rotation.z = Math.sin(this.stateTimer * 32) * 0.008 * Math.sin(p * Math.PI);

        this._stepCapsulePhysics(dt, true);

        if (p >= 1.0) {
          this.leverPivot.rotation.x = 0;
          this.machineRoot.rotation.z = 0;

          if (this.dispensedPoolCapsule) {
            this.dispensedPoolCapsule.mesh.visible = false;
          }
          this.activeCapsuleRig.visible = true;
          this.activeCapsuleRig.scale.set(1, 1, 1);
          this.activeCapsuleRig.position.set(0, 0.18, 0.92);
          this.activeTopHalf.position.set(0, 0, 0);
          this.activeTopHalf.rotation.set(0, 0, 0);
          this.activeBottomHalf.position.set(0, 0, 0);
          this.activeBottomHalf.rotation.set(0, 0, 0);

          this.state = 'BALL_DROP_CHUTE';
          this.stateTimer = 0;
          this.sfx.playChuteDropBounce();

          this.targetCamPos.set(0.05, -0.45, 7.8);
          this.targetLookAt.set(0, -0.85, 0.8);

          if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
        }
      }

      // PHASE 2: BALL VISIBLY DROPS DOWN TRANSPARENT CHUTE INTO TRAY
      else if (this.state === 'BALL_DROP_CHUTE') {
        this.stateTimer += dt;
        this._stepCapsulePhysics(dt, false);

        const p = Math.min(1.0, this.stateTimer / 0.78);
        let yPos = 0.18;
        let zPos = 0.92;
        let flapAngle = 0;

        if (p < 0.48) {
          const t = p / 0.48;
          const easeIn = t * t;
          yPos = 0.18 + (-1.42 - 0.18) * easeIn;
          zPos = 0.92 + (1.22 - 0.92) * t;
          if (t > 0.65) {
            flapAngle = -((t - 0.65) / 0.35) * 0.95;
          }
        } else if (p < 0.76) {
          const t = (p - 0.48) / 0.28;
          yPos = -1.42 + (-1.68 - -1.42) * t + Math.sin(t * Math.PI) * 0.12;
          zPos = 1.22 + (1.46 - 1.22) * t;
          flapAngle = -0.95 * (1 - t * 0.65);
        } else {
          const t = (p - 0.76) / 0.24;
          yPos = -1.68 + Math.sin(t * Math.PI) * 0.05;
          zPos = 1.46;
          flapAngle = -0.30 * (1 - t);
        }

        this.chuteFlapPivot.rotation.x = flapAngle;
        this.activeCapsuleRig.position.set(0, yPos, zPos);
        this.activeCapsuleRig.rotation.x += dt * 11.0;

        if (p >= 1.0) {
          this.chuteFlapPivot.rotation.x = 0;
          this.state = 'CAPSULE_PRESENT';
          this.stateTimer = 0;

          this.targetCamPos.set(0, -0.05, 6.8);
          this.targetLookAt.set(0, -0.10, 1.8);

          if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
        }
      }

      // PHASE 3: CAPSULE RISES TO CENTER FOREGROUND & SHAKES BEFORE SPLITTING
      else if (this.state === 'CAPSULE_PRESENT') {
        this.stateTimer += dt;
        const p = Math.min(1.0, this.stateTimer / 0.62);
        const ease = 1 - Math.pow(1 - p, 3);

        this.activeCapsuleRig.position.set(
          Math.sin(p * Math.PI * 10) * 0.03 * p,
          -1.68 + (0.05 - -1.68) * ease,
          1.46 + (3.20 - 1.46) * ease
        );
        const sc = 1.0 + 0.55 * ease;
        this.activeCapsuleRig.scale.set(sc, sc, sc);
        this.activeCapsuleRig.rotation.x = (1 - ease) * 0.5;
        this.activeCapsuleRig.rotation.y = ease * Math.PI * 2;

        this.prizeLight.intensity = ease * 2.2;

        if (p >= 1.0) {
          this.state = 'CAPSULE_BURST_OPEN';
          this.stateTimer = 0;

          const rarity = (this.pendingReward && this.pendingReward.rarity) || 'classic';
          const tier = RARITY_TIERS[rarity] || RARITY_TIERS.classic;
          this.sfx.playCapsuleOpenFanfare(rarity);
          this._triggerBurstParticles(this.activeCapsuleRig.position, tier.glowHex);

          if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
          if (this.callbacks.onRewardRevealed) {
            this.callbacks.onRewardRevealed(this.pendingReward);
          }
        }
      }

      // PHASE 4: CAPSULE SPLITS OPEN CLEANLY ABOVE & BELOW THE PRIZE SHOWCASE
      else if (this.state === 'CAPSULE_BURST_OPEN') {
        this.stateTimer += dt;
        const openT = Math.min(1.0, this.stateTimer / 0.45);
        const easeOut = 1 - Math.pow(1 - openT, 3);

        // Keep top half & bottom half neatly framing the opened capsule center
        this.activeTopHalf.position.set(0, easeOut * 0.78, 0);
        this.activeTopHalf.rotation.x = -easeOut * 0.52;

        this.activeBottomHalf.position.set(0, -easeOut * 0.78, 0);
        this.activeBottomHalf.rotation.x = easeOut * 0.42;

        this.prizeLight.intensity = 2.4 + Math.sin(this.stateTimer * 6.0) * 0.5;
      }

      // Update 3D burst particles
      for (let i = 0; i < this.burstParticles.length; i++) {
        const p = this.burstParticles[i];
        if (!p.mesh.visible) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.mesh.visible = false;
          continue;
        }
        p.vel.y -= 4.2 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.rotation.x += 6 * dt;
        p.mesh.rotation.y += 8 * dt;
        p.mesh.material.opacity = Math.max(0, 1 - p.life / p.maxLife);
      }

      // Smooth camera interpolation
      const camLerp = Math.min(1.0, dt * 5.0);
      this.currentCamPos.lerp(this.targetCamPos, camLerp);
      this.currentLookAt.lerp(this.targetLookAt, camLerp);
      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);
    }

    resize() {
      if (!this.canvas || !this.renderer || !this.camera) return;
      const w = this.canvas.clientWidth || window.innerWidth || 380;
      const h = this.canvas.clientHeight || window.innerHeight || 680;
      const aspect = w / Math.max(1, h);

      this.camera.aspect = aspect;
      // Frame the machine + right-side lever (X=1.72) comfortably on all portrait screens
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
  }

  window.VintageGachapon3D = VintageGachapon3D;
  window.GACHAPON_RARITY_TIERS = RARITY_TIERS;
})();
