/**
 * ============================================================================
 * HYPER-REALISTIC 3D VINTAGE GUMBALL MACHINE (THREE.JS PBR)
 * - Concentric Curved Escutcheon & Spherical Top Cap (Zero Mesh Clipping)
 * - Side-Mounted Outward Lever at X=1.72 (Zero Collision with Machine)
 * - Pre-Settled Opaque High-Gloss Two-Tone Capsules & Center-Rod Collider
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
    0xdc2626, // Ruby Red
    0x2563eb, // Royal Blue
    0x059669, // Emerald Green
    0xd97706, // Amber Gold
    0x9333ea, // Amethyst Purple
    0xdb2777, // Cerise Pink
    0x0891b2  // Cyan Teal
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
      this._wakeTimer = 0;
      this.pendingReward = null;

      this.globeCenter = typeof THREE !== 'undefined' ? new THREE.Vector3(0, 1.55, 0) : null;
      this.globeRadius = 1.48;
      this.capsuleRadius = 0.245;
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
      this.baseCamPos = new THREE.Vector3(0.12, 0.26, 9.6);
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
      this.renderer.toneMappingExposure = 1.02;

      // Dramatic 3-Point Studio Lighting for Rich 3D Cylindrical Contrast
      const ambient = new THREE.AmbientLight(0xfff1e6, 0.44);
      this.scene.add(ambient);

      const hemi = new THREE.HemisphereLight(0xffffff, 0x18090d, 0.48);
      hemi.position.set(0, 8, 0);
      this.scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.55);
      keyLight.position.set(4.5, 6.8, 6.5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      this.scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.38);
      fillLight.position.set(-5.5, 2.0, 3.2);
      this.scene.add(fillLight);

      const rimLight = new THREE.SpotLight(0xfbbf24, 1.25, 18, Math.PI * 0.35, 0.5);
      rimLight.position.set(0, 5.8, -5.2);
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
      g.addColorStop(0.0, '#f8fafc');
      g.addColorStop(0.20, '#94a3b8');
      g.addColorStop(0.48, '#1e293b');
      g.addColorStop(0.55, '#090d16');
      g.addColorStop(0.82, '#d97706');
      g.addColorStop(1.0, '#451a03');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 128);

      // Studio softbox reflection strips
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillRect(34, 14, 46, 24);
      ctx.fillRect(164, 18, 52, 20);

      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      return tex;
    }

    _createGlassGlobeReflectionTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d');

      // Ultra-clear center with subtle rim & two studio window specular highlights
      ctx.fillStyle = 'rgba(224, 242, 254, 0.14)';
      ctx.fillRect(0, 0, 512, 256);

      // Left curved studio reflection ribbon
      const hl1 = ctx.createLinearGradient(180, 20, 235, 220);
      hl1.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
      hl1.addColorStop(0.35, 'rgba(255, 255, 255, 0.85)');
      hl1.addColorStop(0.65, 'rgba(224, 242, 254, 0.65)');
      hl1.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = hl1;
      ctx.beginPath();
      ctx.ellipse(208, 112, 16, 78, -0.18, 0, Math.PI * 2);
      ctx.fill();

      // Right secondary reflection highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.ellipse(312, 145, 9, 44, 0.15, 0, Math.PI * 2);
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

      const bg = ctx.createLinearGradient(0, 0, 512, 256);
      bg.addColorStop(0.0, '#78350f');
      bg.addColorStop(0.28, '#d97706');
      bg.addColorStop(0.5, '#fde047');
      bg.addColorStop(0.72, '#b45309');
      bg.addColorStop(1.0, '#451a03');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 10;
      ctx.strokeRect(14, 14, 484, 228);

      ctx.fillStyle = '#240c02';
      ctx.fillRect(26, 26, 460, 204);

      // Corner brass rivets
      const rivets = [
        [44, 44],
        [468, 44],
        [44, 212],
        [468, 212]
      ];
      ctx.fillStyle = '#fde047';
      rivets.forEach(([rx, ry]) => {
        ctx.beginPath();
        ctx.arc(rx, ry, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 74px "Cinzel", Georgia, serif';
      ctx.fillText('100 𝄞', 256, 104);

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TIRA DE LA PALANCA', 256, 180);

      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    _buildMaterials() {
      const envMap = this._createEnvTexture();
      this.envMap = envMap;

      // Rich Vintage Candy-Apple Crimson Enamel (Deep 3D Contrast)
      this.crimsonMat = new THREE.MeshPhysicalMaterial({
        color: 0x991b1b,
        emissive: 0x1f0303,
        emissiveIntensity: 0.35,
        metalness: 0.16,
        roughness: 0.20,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        envMap,
        envMapIntensity: 0.65
      });

      // Polished Mirror Chrome
      this.chromeMat = new THREE.MeshPhysicalMaterial({
        color: 0xe2e8f0,
        metalness: 0.90,
        roughness: 0.10,
        clearcoat: 0.6,
        envMap,
        envMapIntensity: 1.25
      });

      // Warm Vintage Gold / Brass
      this.brassMat = new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        emissive: 0x451a03,
        emissiveIntensity: 0.20,
        metalness: 0.84,
        roughness: 0.16,
        clearcoat: 0.5,
        envMap,
        envMapIntensity: 1.15
      });

      // Dark Cast Iron Base
      this.castIronMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.72,
        roughness: 0.34,
        envMap,
        envMapIntensity: 0.55
      });

      // Crystal-Clear Blown Glass Globe with Studio Window Reflection Highlights
      const globeTex = this._createGlassGlobeReflectionTexture();
      this.glassGlobeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: globeTex,
        transparent: true,
        opacity: 0.22,
        roughness: 0.03,
        metalness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMap,
        envMapIntensity: 1.4,
        depthWrite: false
      });

      // Opaque High-Gloss Pearl Ivory Top Shell for Capsules (Zero WebGL Z-Sorting Glitches)
      this.capsulePearlTopMat = new THREE.MeshPhysicalMaterial({
        color: 0xfffbeb,
        metalness: 0.08,
        roughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMap,
        envMapIntensity: 1.0
      });
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
        new THREE.TorusGeometry(2.30, 0.042, 16, 64),
        this.brassMat
      );
      stageBrassTrim.rotation.x = Math.PI / 2;
      stageBrassTrim.position.y = -2.16;
      this.machineRoot.add(stageBrassTrim);

      // 2. LOWER CAST-IRON FOOT & FLARED CRIMSON SKIRT
      const ironFoot = new THREE.Mesh(
        new THREE.CylinderGeometry(1.42, 1.64, 0.32, 48),
        this.castIronMat
      );
      ironFoot.position.y = -1.98;
      this.machineRoot.add(ironFoot);

      // Lower crimson skirt from y = -1.84 (r=1.42) up to waist at y = -1.00 (r=1.10)
      const lowerSkirt = new THREE.Mesh(
        new THREE.CylinderGeometry(1.10, 1.42, 0.84, 48),
        this.crimsonMat
      );
      lowerSkirt.position.y = -1.42;
      this.machineRoot.add(lowerSkirt);

      // Brass Waist Ring at y = -1.00 (above the dispenser hood so it never intersects!)
      const waistBelt = new THREE.Mesh(
        new THREE.TorusGeometry(1.11, 0.05, 18, 48),
        this.brassMat
      );
      waistBelt.rotation.x = Math.PI / 2;
      waistBelt.position.y = -1.00;
      this.machineRoot.add(waistBelt);

      // 3. UPPER TAPERED CRIMSON HOPPER BODY (from y = -1.00, r=1.10 to y = +0.26, r=1.32)
      const upperBody = new THREE.Mesh(
        new THREE.CylinderGeometry(1.32, 1.10, 1.26, 48),
        this.crimsonMat
      );
      upperBody.position.y = -0.37;
      this.machineRoot.add(upperBody);

      // 4. CHROME COLLAR RING CRADLING THE GLOBE
      const collarCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(1.36, 1.32, 0.24, 48),
        this.chromeMat
      );
      collarCyl.position.y = 0.28;
      this.machineRoot.add(collarCyl);

      const collarRim = new THREE.Mesh(
        new THREE.TorusGeometry(1.36, 0.055, 18, 48),
        this.chromeMat
      );
      collarRim.rotation.x = Math.PI / 2;
      collarRim.position.y = 0.38;
      this.machineRoot.add(collarRim);

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
        new THREE.CylinderGeometry(0.05, 0.05, 2.52, 20),
        this.chromeMat
      );
      centerPost.position.set(0, 1.68, 0);
      this.machineRoot.add(centerPost);

      // 6. SPHERICAL GLASS GLOBE + CONCENTRIC SPHERICAL TOP CROWN LID
      this.globeGroup = new THREE.Group();
      this.globeGroup.position.copy(this.globeCenter);
      this.machineRoot.add(this.globeGroup);

      const glassSphere = new THREE.Mesh(
        new THREE.SphereGeometry(this.globeRadius, 48, 36),
        this.glassGlobeMat
      );
      glassSphere.renderOrder = 3;
      this.globeGroup.add(glassSphere);

      // 7. CONCENTRIC SPHERICAL TOP CROWN CAP (Hugs the glass globe with 0 gap!)
      // Polar angle 0 to 0.52 rad on radius 1.50 matches globe curvature 100%!
      const crownCapMesh = new THREE.Mesh(
        new THREE.SphereGeometry(this.globeRadius + 0.02, 48, 20, 0, Math.PI * 2, 0, 0.52),
        this.crimsonMat
      );
      crownCapMesh.renderOrder = 4;
      this.globeGroup.add(crownCapMesh);

      const crownRimRadius = (this.globeRadius + 0.02) * Math.sin(0.52);
      const crownRimY = (this.globeRadius + 0.02) * Math.cos(0.52);
      const crownRim = new THREE.Mesh(
        new THREE.TorusGeometry(crownRimRadius, 0.048, 16, 48),
        this.chromeMat
      );
      crownRim.rotation.x = Math.PI / 2;
      crownRim.position.y = crownRimY;
      this.globeGroup.add(crownRim);

      const finialBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.22, 0.10, 24),
        this.chromeMat
      );
      finialBase.position.y = this.globeRadius + 0.04;
      this.globeGroup.add(finialBase);

      const finialKnob = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 24, 24),
        this.brassMat
      );
      finialKnob.position.y = this.globeRadius + 0.17;
      this.globeGroup.add(finialKnob);

      // 8. CONCENTRIC CURVED FRONT ESCUTCHEON PLATE ("100 𝄞 TIRA DE LA PALANCA")
      // Wrapped concentrically around upperBody so the cylinder NEVER pokes through!
      // At y = -0.37 (height 0.54, from y = -0.10 to y = -0.64):
      // upperBody radius at y=-0.10 is 1.273, and at y=-0.64 is 1.179.
      const bezelShell = new THREE.Mesh(
        new THREE.CylinderGeometry(1.273 + 0.03, 1.179 + 0.03, 0.56, 36, 1, true, -0.38, 0.76),
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
        new THREE.CylinderGeometry(1.273 + 0.045, 1.179 + 0.045, 0.48, 36, 1, true, -0.34, 0.68),
        curvedPlateMat
      );
      curvedPlateMesh.position.set(0, -0.37, 0);
      this.machineRoot.add(curvedPlateMesh);

      // 9. COHESIVE 3D CHROME DISPENSER ALCOVE & FLAP DOOR (Below Waist Belt y=-1.00)
      const chuteGroup = new THREE.Group();
      chuteGroup.position.set(0, -1.42, 1.28);
      this.machineRoot.add(chuteGroup);

      // Solid chrome outer dispenser housing protruding cleanly from lowerSkirt
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

      // Deep dark interior recess placed at z = 0.13 (z_world = 1.41, well outside lowerSkirt!)
      const chuteDarkRecess = new THREE.Mesh(
        new THREE.BoxGeometry(0.50, 0.46, 0.06),
        this.castIronMat
      );
      chuteDarkRecess.position.set(0, -0.02, 0.12);
      chuteGroup.add(chuteDarkRecess);

      // Hinged Chrome Chute Flap Door inside the chrome housing
      this.chuteFlapPivot = new THREE.Group();
      this.chuteFlapPivot.position.set(0, -1.24, 1.44);
      this.machineRoot.add(this.chuteFlapPivot);

      const chuteFlap = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.36, 0.04),
        this.chromeMat
      );
      chuteFlap.position.set(0, -0.18, 0);
      this.chuteFlapPivot.add(chuteFlap);

      // Curved Chrome & Brass Collection Tray below the flap
      const trayGroup = new THREE.Group();
      trayGroup.position.set(0, -1.74, 1.46);
      this.machineRoot.add(trayGroup);

      const trayFloor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.44, 0.38, 0.12, 32),
        this.chromeMat
      );
      trayGroup.add(trayFloor);

      const trayLip = new THREE.Mesh(
        new THREE.TorusGeometry(0.43, 0.05, 16, 32, Math.PI * 1.15),
        this.brassMat
      );
      trayLip.rotation.x = Math.PI / 2;
      trayLip.rotation.z = -Math.PI * 0.075;
      trayLip.position.y = 0.06;
      trayGroup.add(trayLip);

      // ====================================================================
      // 10. SIDE-MOUNTED 3D LEVER WITH OUTWARD AXLE (ZERO MACHINE COLLISION!)
      // ====================================================================
      this.leverGroup = new THREE.Group();
      this.leverGroup.position.set(1.16, -0.44, 0.08);
      this.leverGroup.rotation.set(0, 0, 0);
      this.machineRoot.add(this.leverGroup);

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
        new THREE.CylinderGeometry(0.14, 0.14, 0.16, 24),
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
        envMapIntensity: 1.2
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

      // Opaque High-Gloss Colored Bottom Hemisphere
      const bottomMat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        metalness: 0.14,
        roughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMap: this.envMap,
        envMapIntensity: 1.05
      });

      const bottomHemisphere = new THREE.Mesh(
        new THREE.SphereGeometry(r, 24, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        bottomMat
      );
      group.add(bottomHemisphere);

      // Opaque High-Gloss Pearl Ivory Top Hemisphere (Zero transparency Z-fighting!)
      const topHemisphere = new THREE.Mesh(
        new THREE.SphereGeometry(r, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        this.capsulePearlTopMat
      );
      group.add(topHemisphere);

      // Crisp Gold Equatorial Ring
      const seamBand = new THREE.Mesh(
        new THREE.TorusGeometry(r * 0.995, 0.016, 10, 24),
        this.brassMat
      );
      seamBand.rotation.x = Math.PI / 2;
      group.add(seamBand);

      return group;
    }

    _populateCapsules(count = 28) {
      this.capsules.forEach((c) => this.scene.remove(c.mesh));
      this.capsules = [];

      for (let i = 0; i < count; i++) {
        const colorHex = CAPSULE_PALETTE[i % CAPSULE_PALETTE.length];
        const mesh = this._createSingleCapsuleMesh(colorHex);

        const layer = Math.floor(i / 9);
        const idxInLayer = i % 9;
        const angle = idxInLayer * ((Math.PI * 2) / 9) + layer * 0.55;
        // Start outside the center post (rad >= 0.42) in the lower half of the globe
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

      // Run 220 silent physics steps so every capsule settles firmly at the bottom of the globe
      for (let step = 0; step < 220; step++) {
        this._stepCapsulePhysics(1 / 60, false, true);
      }

      // Lock in the settled resting positions so no ball can ever float in mid-air
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
        metalness: 0.25,
        roughness: 0.12,
        clearcoat: 1.0,
        envMap: this.envMap,
        envMapIntensity: 1.3
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
        this.capsulePearlTopMat
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
      this._wakeTimer = 0.65;
      for (let i = 0; i < this.capsules.length; i++) {
        const c = this.capsules[i];
        c.vel.x += (Math.random() - 0.5) * 4.2 * intensity;
        c.vel.y += (0.4 + Math.random() * 1.5) * intensity;
        c.vel.z += (Math.random() - 0.5) * 4.2 * intensity;
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
        if (this.dispensedPoolCapsule.restPos) {
          this.dispensedPoolCapsule.pos.copy(this.dispensedPoolCapsule.restPos);
        }
        this.dispensedPoolCapsule.vel.set(0, 0, 0);
        this.dispensedPoolCapsule.mesh.position.copy(this.dispensedPoolCapsule.pos);
        this.dispensedPoolCapsule = null;
      }

      // Run 50 silent settle steps so all capsules sit peacefully at the bottom of the globe
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
      // Sleep in IDLE unless silent pre-settling or explicitly woken
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
          const heightFactor = Math.max(0, 1.0 - (c.pos.y - floorY) / 1.10);
          const swirlStrength = 10.2 * heightFactor;

          c.vel.x += (-dz / distXZ) * swirlStrength * safeDt;
          c.vel.z += (dx / distXZ) * swirlStrength * safeDt;
          c.vel.y += (1.1 + Math.sin(this.stateTimer * 16 + i) * 1.2) * heightFactor * safeDt;

          if (!silent && Math.random() < 0.05) {
            this.sfx.playCapsuleumble();
          }
        }

        const damping = agitate ? 0.93 : 0.78;
        c.vel.multiplyScalar(damping);
        c.pos.addScaledVector(c.vel, safeDt);

        // Floor containment
        if (c.pos.y < floorY) {
          c.pos.y = floorY;
          if (c.vel.y < 0) c.vel.y *= -0.12;
          c.vel.x *= 0.80;
          c.vel.z *= 0.80;
        }

        // Strict Upper Cap inside Globe so no ball can EVER float into the upper half!
        const maxAllowedY = agitate ? (this.globeCenter.y + 0.18) : (this.globeCenter.y - 0.05);
        if (c.pos.y > maxAllowedY) {
          c.pos.y = maxAllowedY;
          if (c.vel.y > 0) c.vel.y = 0;
        }

        // Central Chrome Rod Collider (x=0, z=0) so no ball ever touches the vertical rod!
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

        // Spherical Globe Wall Containment
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

      // Pairwise Sphere-Sphere Collision Resolution
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

        // Re-enforce floor and rod clearance after pairwise resolution
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
        this._stepCapsulePhysics(dt, false, false);
      }

      // PHASE 1: LEVER PULLS FORWARD ON THE SIDE & AGITATES GLOBE
      else if (this.state === 'LEVER_PULL') {
        this.stateTimer += dt;
        const p = Math.min(1.0, this.stateTimer / 0.85);

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

        this._stepCapsulePhysics(dt, true, false);

        if (p >= 1.0) {
          this.leverPivot.rotation.x = 0;
          this.machineRoot.rotation.z = 0;

          if (this.dispensedPoolCapsule) {
            this.dispensedPoolCapsule.mesh.visible = false;
          }
          this.activeCapsuleRig.visible = true;
          this.activeCapsuleRig.scale.set(1, 1, 1);
          this.activeCapsuleRig.position.set(0, -1.25, 1.32);
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

      // PHASE 2: BALL VISIBLY PUSHES OPEN CHROME FLAP DOOR & DROPS INTO TRAY
      else if (this.state === 'BALL_DROP_CHUTE') {
        this.stateTimer += dt;
        this._stepCapsulePhysics(dt, false, true);

        const p = Math.min(1.0, this.stateTimer / 0.72);
        let yPos = -1.25;
        let zPos = 1.32;
        let flapAngle = 0;

        if (p < 0.45) {
          const t = p / 0.45;
          const easeIn = t * t;
          yPos = -1.25 + (-1.56 - -1.25) * easeIn;
          zPos = 1.32 + (1.46 - 1.32) * t;
          flapAngle = -Math.sin(t * Math.PI * 0.5) * 1.05;
        } else if (p < 0.78) {
          const t = (p - 0.45) / 0.33;
          yPos = -1.56 + (-1.62 - -1.56) * t + Math.sin(t * Math.PI) * 0.14;
          zPos = 1.46 + (1.52 - 1.46) * t;
          flapAngle = -1.05 * (1 - t * 0.75);
        } else {
          const t = (p - 0.78) / 0.22;
          yPos = -1.62 + Math.sin(t * Math.PI) * 0.05;
          zPos = 1.52;
          flapAngle = -0.26 * (1 - t);
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
          -1.62 + (0.05 - -1.62) * ease,
          1.52 + (3.20 - 1.52) * ease
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

        this.activeTopHalf.position.set(0, easeOut * 0.78, 0);
        this.activeTopHalf.rotation.x = -easeOut * 0.52;

        this.activeBottomHalf.position.set(0, -easeOut * 0.78, 0);
        this.activeBottomHalf.rotation.x = easeOut * 0.42;

        this.prizeLight.intensity = 2.4 + Math.sin(this.stateTimer * 6.0) * 0.5;
      }

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
