/**
 * GRAN FORTUNA 1977 - Mechanical Arcade Slot Machine
 * Recreacion mecanica ultra-fiel de la Gran Fortuna 1977
 * Incluye:
 * - Modo "Apostar" (Claves reales del usuario, pagos de casino 1977)
 * - Modo "Canciones Destacadas" (Tirada gratis, impresion matricial de 3 canciones con boton directo de jugar)
 * - Sonidos mecanicos sintetizados con WebAudio nativo (100% offline, cero dependencias)
 * - Musica de casino ambiental
 * - Integracion con pantalla de carga de cancion (pausa y reanudacion)
 * - Soporte bilingue ES / EN
 */

(function () {
  'use strict';

  // ============================================================
  // 1. WEBAUDIO SOUND SYNTHESIZER (NATIVO & 100% OFFLINE)
  // ============================================================
  let slotAudioCtx = null;
  let isSoundMuted = false;

  function initSlotAudio() {
    try {
      if (!slotAudioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) slotAudioCtx = new AudioCtx();
      }
      if (slotAudioCtx && slotAudioCtx.state === 'suspended') {
        slotAudioCtx.resume();
      }
    } catch (_) {}
  }

  function soundCrank(step) {
    if (isSoundMuted || !slotAudioCtx) return;
    try {
      const freqs = [196, 246.9, 293.6, 392, 493.8, 587.3, 784];
      const osc = slotAudioCtx.createOscillator();
      const gain = slotAudioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freqs[step % freqs.length];
      const now = slotAudioCtx.currentTime;
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(slotAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch (_) {}
  }

  function soundReelTick() {
    if (isSoundMuted || !slotAudioCtx) return;
    try {
      const now = slotAudioCtx.currentTime;
      const osc = slotAudioCtx.createOscillator();
      const gain = slotAudioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.015);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      osc.connect(gain);
      gain.connect(slotAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.015);
    } catch (_) {}
  }

  function soundReelStop(idx) {
    if (isSoundMuted || !slotAudioCtx) return;
    try {
      const now = slotAudioCtx.currentTime;
      const osc = slotAudioCtx.createOscillator();
      const gain = slotAudioCtx.createGain();
      const pitches = [98, 130.8, 164.8];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitches[idx] || 130.8, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(slotAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (_) {}
  }

  function soundCoinClink() {
    if (isSoundMuted || !slotAudioCtx) return;
    try {
      const now = slotAudioCtx.currentTime;
      const osc = slotAudioCtx.createOscillator();
      const gain = slotAudioCtx.createGain();
      const freqs = [1174.6, 1479.9, 1760, 2349.3];
      osc.type = 'sine';
      osc.frequency.value = freqs[Math.floor(Math.random() * freqs.length)];
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(slotAudioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (_) {}
  }

  function soundPrinterFeed() {
    if (isSoundMuted || !slotAudioCtx) return;
    try {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          if (!slotAudioCtx) return;
          const now = slotAudioCtx.currentTime;
          const osc = slotAudioCtx.createOscillator();
          const gain = slotAudioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320 + (i % 3) * 60, now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
          osc.connect(gain);
          gain.connect(slotAudioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.025);
        }, i * 45);
      }
    } catch (_) {}
  }

  function soundWin(isJackpot) {
    if (isSoundMuted || !slotAudioCtx) return;
    try {
      const notes = isJackpot
        ? [261.6, 329.6, 392.0, 523.25, 392.0, 523.25, 659.25, 784.0]
        : [392.0, 493.8, 587.3, 523.25, 659.25, 784.0];
      const now = slotAudioCtx.currentTime;
      notes.forEach((freq, i) => {
        const osc = slotAudioCtx.createOscillator();
        const gain = slotAudioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const t = now + i * 0.11;
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(slotAudioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    } catch (_) {}
  }

  // ============================================================
  // 2. CASINO BACKGROUND MUSIC MANAGER
  // ============================================================
  let casinoBgmAudio = null;

  function playCasinoMusic() {
    if (typeof window.pauseMenuAmbientMusic === 'function') {
      window.pauseMenuAmbientMusic();
    }
    if (!casinoBgmAudio) {
      casinoBgmAudio = new Audio('assets/casino_music.mp3');
      casinoBgmAudio.loop = true;
    }
    casinoBgmAudio.volume = 0.55;
    try {
      const p = casinoBgmAudio.play();
      if (p !== undefined) p.catch(() => {});
    } catch (_) {}
  }

  function stopCasinoMusic() {
    if (casinoBgmAudio) {
      try {
        casinoBgmAudio.pause();
        casinoBgmAudio.currentTime = 0;
      } catch (_) {}
    }
    if (typeof window.isGameCurrentlyActive === 'function' && !window.isGameCurrentlyActive()) {
      if (typeof window.resumeMenuAmbientMusic === 'function') {
        window.resumeMenuAmbientMusic();
      }
    }
  }

  // ============================================================
  // 3. VECTOR SYMBOLS DRAWING (CANVAS 200x200 CACHED)
  // ============================================================
  const SYMBOL_LIST = [
    'cherry', 'lemon', 'orange', 'grapes', 'bar', 'lemon', 'cherry', 'bell',
    'orange', 'grapes', 'diamond', 'lemon', 'cherry', 'orange', 'seven', 'bar'
  ];
  const TOTAL_SYMBOLS = SYMBOL_LIST.length; // 16
  const SLOT_STEP = (Math.PI * 2) / TOTAL_SYMBOLS; // 22.5 deg
  const symbolCanvases = {};

  function drawSeven(ctx) {
    ctx.save();
    ctx.translate(100, 100);

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.moveTo(-32, -46); ctx.lineTo(38, -46); ctx.lineTo(38, -28);
    ctx.lineTo(2, 52); ctx.lineTo(-24, 52); ctx.lineTo(12, -28); ctx.lineTo(-32, -28);
    ctx.closePath();
    ctx.fill();

    // Borde oro
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    const goldGrad = ctx.createLinearGradient(-35, -50, 35, 50);
    goldGrad.addColorStop(0, '#fff4b8');
    goldGrad.addColorStop(0.3, '#d4af37');
    goldGrad.addColorStop(0.7, '#805912');
    goldGrad.addColorStop(1, '#ffd700');
    ctx.strokeStyle = goldGrad;

    ctx.beginPath();
    ctx.moveTo(-35, -50); ctx.lineTo(35, -50); ctx.lineTo(35, -30);
    ctx.lineTo(0, 48); ctx.lineTo(-24, 48); ctx.lineTo(10, -30); ctx.lineTo(-35, -30);
    ctx.closePath();
    ctx.stroke();

    // Rubi
    const rubyGrad = ctx.createLinearGradient(-20, -40, 20, 40);
    rubyGrad.addColorStop(0, '#ff3b3b');
    rubyGrad.addColorStop(0.4, '#c61111');
    rubyGrad.addColorStop(0.8, '#820505');
    rubyGrad.addColorStop(1, '#4a0000');
    ctx.fillStyle = rubyGrad;
    ctx.fill();

    // Brillo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-26, -44); ctx.lineTo(26, -44);
    ctx.stroke();

    ctx.restore();
  }

  function drawDiamond(ctx) {
    ctx.save();
    ctx.translate(100, 100);

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.moveTo(3, -47); ctx.lineTo(47, 3); ctx.lineTo(3, 53); ctx.lineTo(-41, 3);
    ctx.closePath(); ctx.fill();

    // Borde oro blanco / platino
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    const borderGrad = ctx.createLinearGradient(-45, -45, 45, 45);
    borderGrad.addColorStop(0, '#ffffff');
    borderGrad.addColorStop(0.5, '#7faec9');
    borderGrad.addColorStop(1, '#1b3447');
    ctx.strokeStyle = borderGrad;

    ctx.beginPath();
    ctx.moveTo(0, -45); ctx.lineTo(45, 0); ctx.lineTo(0, 50); ctx.lineTo(-45, 0);
    ctx.closePath(); ctx.stroke();

    // Cuerpo diamante cian
    const diaGrad = ctx.createRadialGradient(-5, -10, 5, 0, 0, 50);
    diaGrad.addColorStop(0, '#e0ffff');
    diaGrad.addColorStop(0.3, '#38d9f5');
    diaGrad.addColorStop(0.7, '#087fa8');
    diaGrad.addColorStop(1, '#043547');
    ctx.fillStyle = diaGrad; ctx.fill();

    // Facetas talladas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -45); ctx.lineTo(0, 50);
    ctx.moveTo(-45, 0); ctx.lineTo(45, 0);
    ctx.moveTo(-22, -22); ctx.lineTo(22, 25);
    ctx.moveTo(22, -22); ctx.lineTo(-22, 25);
    ctx.stroke();

    ctx.restore();
  }

  function drawBell(ctx) {
    ctx.save();
    ctx.translate(100, 95);

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(3, 40, 14, 0, Math.PI * 2);
    ctx.fill();

    // Badajo campana
    ctx.fillStyle = '#4a3407';
    ctx.beginPath();
    ctx.arc(0, 36, 12, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo campana bronce / oro pulido
    const bellGrad = ctx.createLinearGradient(-40, -40, 40, 40);
    bellGrad.addColorStop(0, '#fff4b8');
    bellGrad.addColorStop(0.2, '#ffd700');
    bellGrad.addColorStop(0.6, '#b8860b');
    bellGrad.addColorStop(0.9, '#634503');
    bellGrad.addColorStop(1, '#3b2801');
    ctx.fillStyle = bellGrad;

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#291b00';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.bezierCurveTo(15, -38, 32, -15, 36, 18);
    ctx.lineTo(44, 28);
    ctx.bezierCurveTo(30, 34, -30, 34, -44, 28);
    ctx.lineTo(-36, 18);
    ctx.bezierCurveTo(-32, -15, -15, -38, 0, -38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Anilla superior
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#8a6207';
    ctx.beginPath();
    ctx.arc(0, -42, 8, 0, Math.PI, true);
    ctx.stroke();

    // Brillo curvo
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.bezierCurveTo(-10, -25, -22, -5, -24, 15);
    ctx.stroke();

    ctx.restore();
  }

  function drawBar(ctx) {
    ctx.save();
    ctx.translate(100, 100);

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(-52, -26, 110, 58, 8);
    ctx.fill();

    // Borde cromo
    const barBorder = ctx.createLinearGradient(-55, -30, 55, 30);
    barBorder.addColorStop(0, '#ffffff');
    barBorder.addColorStop(0.5, '#7a7a7a');
    barBorder.addColorStop(1, '#242424');
    ctx.strokeStyle = barBorder;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(-55, -30, 110, 60, 8);
    ctx.stroke();

    // Fondo oscuro esmaltado
    const barBg = ctx.createLinearGradient(0, -28, 0, 28);
    barBg.addColorStop(0, '#1c1c1c');
    barBg.addColorStop(0.5, '#0a0a0a');
    barBg.addColorStop(1, '#242424');
    ctx.fillStyle = barBg;
    ctx.fill();

    // Texto BAR en relieve
    ctx.font = '900 28px "Montserrat", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#000000';
    ctx.fillText('BAR', 2, 3);

    const txtGrad = ctx.createLinearGradient(0, -15, 0, 15);
    txtGrad.addColorStop(0, '#ffffff');
    txtGrad.addColorStop(0.3, '#f5d77f');
    txtGrad.addColorStop(0.7, '#c29019');
    txtGrad.addColorStop(1, '#664903');
    ctx.fillStyle = txtGrad;
    ctx.fillText('BAR', 0, 1);

    ctx.restore();
  }

  function drawCherry(ctx) {
    ctx.save();
    ctx.translate(100, 100);

    // Tallos
    ctx.strokeStyle = '#437c17';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -42); ctx.quadraticCurveTo(-8, -15, -22, 10);
    ctx.moveTo(0, -42); ctx.quadraticCurveTo(12, -15, 22, 12);
    ctx.stroke();

    // Hoja
    ctx.fillStyle = '#599e1a';
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.quadraticCurveTo(18, -48, 24, -36);
    ctx.quadraticCurveTo(10, -32, 0, -42);
    ctx.closePath();
    ctx.fill();

    // Cereza Izquierda
    const c1 = ctx.createRadialGradient(-28, 12, 3, -22, 18, 24);
    c1.addColorStop(0, '#ff6b6b');
    c1.addColorStop(0.4, '#d60000');
    c1.addColorStop(0.8, '#700000');
    c1.addColorStop(1, '#330000');
    ctx.fillStyle = c1;
    ctx.beginPath(); ctx.arc(-22, 18, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#290000'; ctx.lineWidth = 2; ctx.stroke();

    // Brillo Cereza 1
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(-28, 11, 4, 0, Math.PI * 2); ctx.fill();

    // Cereza Derecha
    const c2 = ctx.createRadialGradient(16, 15, 3, 22, 20, 24);
    c2.addColorStop(0, '#ff6b6b');
    c2.addColorStop(0.4, '#d60000');
    c2.addColorStop(0.8, '#700000');
    c2.addColorStop(1, '#330000');
    ctx.fillStyle = c2;
    ctx.beginPath(); ctx.arc(22, 20, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#290000'; ctx.lineWidth = 2; ctx.stroke();

    // Brillo Cereza 2
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(16, 13, 4, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function drawOrange(ctx) {
    ctx.save();
    ctx.translate(100, 100);

    // Tallo y hoja
    ctx.strokeStyle = '#3d6313'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(0, -28); ctx.stroke();
    ctx.fillStyle = '#4c8213';
    ctx.beginPath();
    ctx.moveTo(0, -35); ctx.quadraticCurveTo(16, -42, 20, -30);
    ctx.quadraticCurveTo(8, -26, 0, -35);
    ctx.fill();

    // Cuerpo naranja
    const oGrad = ctx.createRadialGradient(-10, -10, 5, 0, 0, 36);
    oGrad.addColorStop(0, '#ffe17d');
    oGrad.addColorStop(0.3, '#ff9900');
    oGrad.addColorStop(0.8, '#d45d00');
    oGrad.addColorStop(1, '#662600');
    ctx.fillStyle = oGrad;
    ctx.beginPath(); ctx.arc(0, 4, 35, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#471c03'; ctx.lineWidth = 3; ctx.stroke();

    // Brillo
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(-12, -8, 6, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function drawLemon(ctx) {
    ctx.save();
    ctx.translate(100, 100);

    ctx.rotate(0.35);

    const lGrad = ctx.createRadialGradient(-10, -10, 5, 0, 0, 38);
    lGrad.addColorStop(0, '#ffffcc');
    lGrad.addColorStop(0.3, '#ffee33');
    lGrad.addColorStop(0.7, '#ccaa00');
    lGrad.addColorStop(1, '#5e4e00');

    ctx.beginPath();
    ctx.moveTo(-38, 4);
    ctx.quadraticCurveTo(-26, -28, 0, -28);
    ctx.quadraticCurveTo(26, -28, 38, 4);
    ctx.quadraticCurveTo(26, 34, 0, 34);
    ctx.quadraticCurveTo(-26, 34, -38, 4);
    ctx.closePath();
    ctx.fillStyle = lGrad;
    ctx.fill();
    ctx.strokeStyle = '#362600';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  function drawGrapes(ctx) {
    ctx.save();
    ctx.translate(100, 100);

    ctx.strokeStyle = '#553612'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -42); ctx.lineTo(0, -20); ctx.stroke();
    ctx.fillStyle = '#437c17';
    ctx.beginPath();
    ctx.moveTo(0, -32); ctx.quadraticCurveTo(-18, -36, -20, -24);
    ctx.quadraticCurveTo(-8, -20, 0, -32); ctx.fill();

    const grapeCoords = [
      [-18, -12], [0, -14], [18, -12],
      [-22, 6], [-8, 6], [8, 6], [22, 6],
      [-12, 24], [4, 24],
      [-4, 40]
    ];

    grapeCoords.forEach(([gx, gy]) => {
      const gGrad = ctx.createRadialGradient(gx - 3, gy - 3, 2, gx, gy, 12);
      gGrad.addColorStop(0, '#d1a3ff');
      gGrad.addColorStop(0.3, '#8e35e6');
      gGrad.addColorStop(0.8, '#460882');
      gGrad.addColorStop(1, '#1b0036');
      ctx.fillStyle = gGrad;
      ctx.beginPath(); ctx.arc(gx, gy, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#18002e'; ctx.lineWidth = 1.5; ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(gx - 3, gy - 3, 2.5, 0, Math.PI * 2); ctx.fill();
    });

    ctx.restore();
  }

  function initSymbolArt() {
    const distinct = ['seven', 'diamond', 'bell', 'bar', 'cherry', 'orange', 'lemon', 'grapes'];
    const drawer = {
      seven: drawSeven,
      diamond: drawDiamond,
      bell: drawBell,
      bar: drawBar,
      cherry: drawCherry,
      orange: drawOrange,
      lemon: drawLemon,
      grapes: drawGrapes
    };

    distinct.forEach(id => {
      const can = document.createElement('canvas');
      can.width = 200;
      can.height = 200;
      drawer[id](can.getContext('2d'));
      symbolCanvases[id] = can;
    });
  }

  // ============================================================
  // 4. LED 777 MATRIX RENDERER
  // ============================================================
  function render777LedMatrix() {
    const svg = document.getElementById('led777Svg');
    if (!svg || svg.children.length > 0) return;

    const sevenPattern = [
      [1, 1, 1, 1, 1],
      [0, 0, 0, 0, 1],
      [0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 1, 0, 0, 0]
    ];
    const digitOffsets = [10, 60, 110];

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <radialGradient id="bulbOnGrad" cx="35%" cy="35%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="30%" stop-color="#fff59d"/>
        <stop offset="65%" stop-color="#ffb300"/>
        <stop offset="100%" stop-color="#e65100"/>
      </radialGradient>
      <radialGradient id="bulbOffGrad" cx="40%" cy="40%">
        <stop offset="0%" stop-color="#2c1d12"/>
        <stop offset="80%" stop-color="#120c08"/>
        <stop offset="100%" stop-color="#050302"/>
      </radialGradient>
      <filter id="glowGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    `;
    svg.appendChild(defs);

    digitOffsets.forEach((startX) => {
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          const cx = startX + col * 9 + 4;
          const cy = row * 5.2 + 3.5;
          const isOn = sevenPattern[row][col] === 1;

          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', cx);
          circle.setAttribute('cy', cy);
          circle.setAttribute('r', isOn ? '3.6' : '2.8');
          circle.setAttribute('fill', isOn ? 'url(#bulbOnGrad)' : 'url(#bulbOffGrad)');
          if (isOn) circle.setAttribute('filter', 'url(#glowGlow)');
          svg.appendChild(circle);
        }
      }
    });
  }

  // ============================================================
  // 5. REEL CANVAS & CYLINDRICAL PERSPECTIVE PHYSICS
  // ============================================================
  let reelsCanvas = null;
  let ctxReels = null;
  let canvasW = 320;
  let canvasH = 215;

  const reels = [
    { angle: 0, startAngle: 0, targetAngle: 0, startTime: 0, duration: 0, isSpinning: false, lastSlot: 0, lastTickTime: 0 },
    { angle: 0, startAngle: 0, targetAngle: 0, startTime: 0, duration: 0, isSpinning: false, lastSlot: 0, lastTickTime: 0 },
    { angle: 0, startAngle: 0, targetAngle: 0, startTime: 0, duration: 0, isSpinning: false, lastSlot: 0, lastTickTime: 0 }
  ];

  function resizeReelsCanvas() {
    if (!reelsCanvas) reelsCanvas = document.getElementById('reelsCanvas');
    if (!reelsCanvas) return;
    ctxReels = reelsCanvas.getContext('2d');

    const container = document.getElementById('reelFrameContainer');
    const rect = container ? container.getBoundingClientRect() : reelsCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvasW = Math.max(260, rect.width || 320);
    canvasH = Math.max(180, rect.height || 215);

    reelsCanvas.width = canvasW * dpr;
    reelsCanvas.height = canvasH * dpr;
    ctxReels.resetTransform();
    ctxReels.scale(dpr, dpr);
    drawCylindricalReels();
  }

  function drawCylindricalReels() {
    if (!ctxReels) return;

    ctxReels.clearRect(0, 0, canvasW, canvasH);
    const reelWidth = canvasW / 3;
    const centerY = canvasH / 2;
    const radius = canvasH * 0.95;

    for (let i = 0; i < 3; i++) {
      const reel = reels[i];
      const leftX = i * reelWidth;
      const centerX = leftX + reelWidth / 2;

      ctxReels.save();
      ctxReels.beginPath();
      ctxReels.rect(leftX, 0, reelWidth, canvasH);
      ctxReels.clip();

      // Fondo marfil
      const baseGrad = ctxReels.createLinearGradient(leftX, 0, leftX + reelWidth, 0);
      baseGrad.addColorStop(0, '#e5dcc7');
      baseGrad.addColorStop(0.12, '#faf7ee');
      baseGrad.addColorStop(0.88, '#fcfaf2');
      baseGrad.addColorStop(1, '#ded3be');
      ctxReels.fillStyle = baseGrad;
      ctxReels.fillRect(leftX, 0, reelWidth, canvasH);

      // Curvatura cilindrica sombreada
      const cylinderGrad = ctxReels.createLinearGradient(0, 0, 0, canvasH);
      cylinderGrad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
      cylinderGrad.addColorStop(0.25, 'rgba(0, 0, 0, 0.15)');
      cylinderGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      cylinderGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.2)');
      cylinderGrad.addColorStop(1, 'rgba(0, 0, 0, 0.82)');

      // Dibujar simbolos
      for (let s = 0; s < TOTAL_SYMBOLS; s++) {
        const symId = SYMBOL_LIST[s];
        const art = symbolCanvases[symId];
        if (!art) continue;

        let angleDiff = (s * SLOT_STEP - reel.angle) % (Math.PI * 2);
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) > Math.PI / 2.1) continue;

        const yPos = centerY + Math.sin(angleDiff) * radius;
        const scaleY = Math.max(0.1, Math.cos(angleDiff));
        const scaleX = 0.82 * Math.cos(angleDiff * 0.4);

        const targetW = reelWidth * 0.76 * scaleX;
        const targetH = 68 * scaleY;

        ctxReels.drawImage(art, centerX - targetW / 2, yPos - targetH / 2, targetW, targetH);
      }

      ctxReels.fillStyle = cylinderGrad;
      ctxReels.fillRect(leftX, 0, reelWidth, canvasH);

      // Separador cromado
      ctxReels.strokeStyle = 'rgba(60, 45, 30, 0.6)';
      ctxReels.lineWidth = 2;
      ctxReels.strokeRect(leftX, 0, reelWidth, canvasH);

      ctxReels.restore();
    }
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  let isReelLoopActive = false;
  function loopReelPhysics(now) {
    if (!isReelLoopActive) return;
    requestAnimationFrame(loopReelPhysics);

    try {
      const currentNow = now || performance.now();

      for (let i = 0; i < 3; i++) {
        const reel = reels[i];
        if (reel.isSpinning) {
          const elapsed = Math.max(0, currentNow - reel.startTime);

          if (elapsed >= reel.duration) {
            reel.angle = reel.targetAngle;
            reel.isSpinning = false;
            soundReelStop(i);
          } else {
            const progress = elapsed / reel.duration;
            const eased = easeOutCubic(progress);
            reel.angle = reel.startAngle + (reel.targetAngle - reel.startAngle) * eased;

            const currentSlot = Math.floor(reel.angle / SLOT_STEP);
            if (currentSlot !== reel.lastSlot && currentNow - reel.lastTickTime > 40) {
              soundReelTick();
              reel.lastSlot = currentSlot;
              reel.lastTickTime = currentNow;
            }
          }
        }
      }

      drawCylindricalReels();
    } catch (_) {}
  }

  // ============================================================
  // 6. STATE, BETTING & OUTCOME LOGIC
  // ============================================================
  let slotMachineMode = 'bet'; // 'bet' | 'featured'
  let currentBet = 5;
  let lastWin = 0;
  let isMachineActive = false;
  let isPaperOut = false;

  function t(key, fallback) {
    if (typeof window.t === 'function') return window.t(key, fallback);
    return fallback;
  }

  function getPlayerClefs() {
    if (typeof window.userClefs !== 'undefined' && !isNaN(window.userClefs)) {
      return window.userClefs;
    }
    const val = parseInt(localStorage.getItem('game_claves_de_sol') || localStorage.getItem('beatstar_clefs') || '100', 10);
    return isNaN(val) ? 100 : val;
  }

  function updateScoreboards() {
    const creditsEl = document.getElementById('creditsDisplay');
    const betEl = document.getElementById('betDisplay');
    const winEl = document.getElementById('winDisplay');
    const playerClefs = getPlayerClefs();

    if (creditsEl) {
      creditsEl.textContent = String(playerClefs).padStart(4, '0');
    }
    if (betEl) {
      betEl.textContent = slotMachineMode === 'featured' ? 'FREE' : String(currentBet).padStart(4, '0');
    }
    if (winEl) {
      winEl.textContent = String(lastWin).padStart(4, '0');
    }
  }

  function calculateOutcome() {
    // 50% probabilidad de tirada premiada en modo apuesta
    const isWin = Math.random() < 0.50;

    if (isWin) {
      const roll = Math.random();
      if (roll < 0.003) {
        const idx = SYMBOL_LIST.indexOf('seven');
        return { indices: [idx, idx, idx], mult: 25, label: '3x SIETE ORO' };
      } else if (roll < 0.015) {
        const idx = SYMBOL_LIST.indexOf('diamond');
        return { indices: [idx, idx, idx], mult: 15, label: '3x DIAMANTE' };
      } else if (roll < 0.04) {
        const idx = SYMBOL_LIST.indexOf('bell');
        return { indices: [idx, idx, idx], mult: 10, label: '3x CAMPANA' };
      } else if (roll < 0.09) {
        const idx = SYMBOL_LIST.indexOf('bar');
        return { indices: [idx, idx, idx], mult: 6, label: '3x BAR' };
      } else if (roll < 0.16) {
        const idx = SYMBOL_LIST.indexOf('cherry');
        return { indices: [idx, idx, idx], mult: 4, label: '3x CEREZAS' };
      } else if (roll < 0.28) {
        const fruit = ['grapes', 'orange', 'lemon'][Math.floor(Math.random() * 3)];
        const idx = SYMBOL_LIST.indexOf(fruit);
        return { indices: [idx, idx, idx], mult: 3, label: `3x ${fruit.toUpperCase()}` };
      } else if (roll < 0.48) {
        const fruit = ['orange', 'lemon', 'grapes'][Math.floor(Math.random() * 3)];
        const fIdx = SYMBOL_LIST.indexOf(fruit);
        const other = SYMBOL_LIST.indexOf('bell');
        return { indices: [fIdx, fIdx, other], mult: 2, label: `2x ${fruit.toUpperCase()}` };
      } else {
        const cIdx = SYMBOL_LIST.indexOf('cherry');
        const o1 = SYMBOL_LIST.indexOf('lemon');
        const o2 = SYMBOL_LIST.indexOf('grapes');
        return { indices: [cIdx, o1, o2], mult: 1, label: '1x CEREZA' };
      }
    } else {
      const nonWins = [
        ['bar', 'lemon', 'orange'],
        ['lemon', 'grapes', 'diamond'],
        ['orange', 'bell', 'lemon'],
        ['grapes', 'bar', 'seven'],
        ['bell', 'orange', 'lemon'],
        ['diamond', 'orange', 'bar']
      ];
      const chosen = nonWins[Math.floor(Math.random() * nonWins.length)];
      return {
        indices: [
          Math.max(0, SYMBOL_LIST.indexOf(chosen[0])),
          Math.max(0, SYMBOL_LIST.indexOf(chosen[1])),
          Math.max(0, SYMBOL_LIST.indexOf(chosen[2]))
        ],
        mult: 0,
        label: ''
      };
    }
  }

  // ============================================================
  // 7. FEATURED SONGS FOR SLOT MACHINE
  // ============================================================
  async function getFeaturedSongsForSlot() {
    let list = [];
    if (Array.isArray(window.dailyFeaturedSongsList) && window.dailyFeaturedSongsList.length > 0) {
      list = [...window.dailyFeaturedSongsList];
    }

    if (list.length < 3) {
      try {
        const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
        if (baseUrl) {
          const res = await fetch(`${baseUrl}/api/v1/community/featured`);
          if (res.ok) {
            const data = await res.json();
            const arr = Array.isArray(data) ? data : (data.featured || []);
            if (arr.length > 0) list = arr;
          }
        }
      } catch (_) {}
    }

    // Fallbacks locales de alta calidad si no hay red
    if (list.length === 0) {
      list = [
        { id: 'comm_renacer', title: 'Renacer', artist: 'Beatstar Official', stars: 5.0, difficulty_name: 'Dificil', is_community: true },
        { id: 'custom_fur_elise', title: 'Fur Elise (Arcade Mix)', artist: 'Beethoven', stars: 3.5, difficulty_name: 'Media', is_community: false },
        { id: 'custom_canon_d', title: 'Canon in D Rock', artist: 'Pachelbel', stars: 4.5, difficulty_name: 'Normal', is_community: false }
      ];
    }

    // Barajar y tomar 3
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  function printFeaturedSongsToPaper(songs) {
    const feed = document.getElementById('printedPaperFeed');
    if (!feed) return;

    let itemsHtml = '';
    songs.forEach((s, idx) => {
      const diffStars = Number(s.stars) || 3.5;
      const titleEsc = escapeHtml(s.title || 'Cancion');
      const artistEsc = escapeHtml(s.artist || 'Artista');
      const diffLabel = escapeHtml(s.difficulty_name || 'Normal');
      itemsHtml += `
        <div class="p-1.5 bg-stone-100 border border-stone-300 rounded shadow-sm">
          <div class="flex items-center justify-between">
            <span class="font-bold text-red-800">#${idx + 1} ${titleEsc}</span>
            <span class="text-[9px] text-amber-700 font-bold">${diffStars.toFixed(1)}★</span>
          </div>
          <p class="text-[9px] text-stone-600 truncate">${artistEsc} (${diffLabel})</p>
          <button onclick="window.launchSongFromSlot('${s.id}', ${!!s.is_community})" class="mt-1 w-full py-1 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 text-white font-bold text-[10px] rounded shadow active:scale-95 flex items-center justify-center gap-1 cursor-pointer">
            <span>▶</span> <span data-i18n="play">${t('play', 'Jugar')}</span>
          </button>
        </div>
      `;
    });

    feed.innerHTML = `
      <div class="border-b-2 border-dashed border-stone-400 pb-1.5 mb-2 flex justify-between items-center text-[10px] text-purple-950 font-bold font-mono">
        <span>★ GRAN FORTUNA 1977 ★</span>
        <span>OFICIAL</span>
      </div>
      <div class="text-[10px] font-mono text-center font-bold text-amber-900 bg-amber-200/70 rounded py-0.5 mb-2 border border-amber-400">
        ${t('slot_featured_printed_header', '3 CANCIONES DESTACADAS')}
      </div>
      <div class="space-y-1.5 text-[11px] font-mono leading-tight">
        ${itemsHtml}
      </div>
    `;

    feed.classList.add('feed-out');
    isPaperOut = true;
    soundPrinterFeed();
  }

  function printPayoutTableToPaper() {
    const feed = document.getElementById('printedPaperFeed');
    if (!feed) return;

    feed.innerHTML = `
      <div class="border-b border-dashed border-stone-400 pb-1 mb-2 flex justify-between items-center text-[10px] text-purple-900 font-bold">
        <span>GRAN FORTUNA 1977</span>
        <span>OFICIAL</span>
      </div>
      <div class="text-[10px] font-mono text-center font-bold text-stone-800 bg-amber-100 rounded py-0.5 mb-1.5 border border-amber-300">
        ${t('slot_payout_paper_header', 'TABLA DE PAGOS OFICIAL')}
      </div>
      <div class="space-y-1 text-[11px] font-mono leading-tight">
        <div class="flex justify-between font-bold text-red-700"><span>3x SIETE ORO/RUBI</span><span>x25</span></div>
        <div class="flex justify-between font-bold text-cyan-800"><span>3x DIAMANTE AZUL</span><span>x15</span></div>
        <div class="flex justify-between font-bold text-amber-900"><span>3x CAMPANA LATON</span><span>x10</span></div>
        <div class="flex justify-between font-bold text-stone-900"><span>3x LINGOTE BAR</span><span>x6</span></div>
        <div class="flex justify-between font-bold text-rose-800"><span>3x CEREZAS RUBI</span><span>x4</span></div>
        <div class="flex justify-between"><span>3x UVAS / NARANJA / LIMON</span><span>x3</span></div>
        <div class="border-t border-dashed border-stone-400 pt-1 text-[10px] text-stone-600">
          <div class="flex justify-between"><span>2x Frutas</span><span>x2</span></div>
          <div class="flex justify-between"><span>1x Cereza solitaria</span><span>x1</span></div>
        </div>
      </div>
    `;
    feed.classList.add('feed-out');
    isPaperOut = true;
    soundPrinterFeed();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ============================================================
  // 8. SPIN TRIGGER & CRANK 360 INTERACTION
  // ============================================================
  async function triggerSpin() {
    if (isMachineActive) return;

    const statusMsg = document.getElementById('statusMsg');
    const playerClefs = getPlayerClefs();

    if (slotMachineMode === 'bet') {
      if (playerClefs < currentBet) {
        if (statusMsg) statusMsg.textContent = '¡SIN CLAVES!';
        return;
      }
      if (typeof window.deductClefs === 'function') {
        window.deductClefs(currentBet);
      }
    }

    isMachineActive = true;
    lastWin = 0;
    updateScoreboards();
    if (statusMsg) statusMsg.textContent = slotMachineMode === 'featured' ? '★ BUSCANDO...' : '...';

    // Cerrar papel si estaba extendido
    const feed = document.getElementById('printedPaperFeed');
    if (feed && isPaperOut) {
      feed.classList.remove('feed-out');
      isPaperOut = false;
    }

    let outcome;
    let featuredSongs = [];

    if (slotMachineMode === 'featured') {
      featuredSongs = await getFeaturedSongsForSlot();
      // En modo destacado, se detienen en una combinacion llamativa
      outcome = {
        indices: [
          SYMBOL_LIST.indexOf('seven'),
          SYMBOL_LIST.indexOf('diamond'),
          SYMBOL_LIST.indexOf('bell')
        ],
        mult: 0,
        label: 'CANCIONES DESTACADAS'
      };
    } else {
      outcome = calculateOutcome();
    }

    const now = performance.now();
    const durations = [1800, 2300, 2900];
    const fullSpins = [5, 7, 9];

    for (let i = 0; i < 3; i++) {
      const reel = reels[i];
      const symTargetIndex = outcome.indices[i];
      const targetExactAngle = symTargetIndex * SLOT_STEP;

      reel.startTime = now;
      reel.duration = durations[i];
      reel.startAngle = reel.angle;

      const delta = (targetExactAngle - (reel.startAngle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
      reel.targetAngle = reel.startAngle + (fullSpins[i] * Math.PI * 2) + delta;
      reel.isSpinning = true;
    }

    setTimeout(() => {
      isMachineActive = false;

      if (slotMachineMode === 'featured') {
        if (statusMsg) statusMsg.textContent = '★ ¡3 RECOMENDACIONES LISTAS! ★';
        soundWin(true);
        printFeaturedSongsToPaper(featuredSongs);
      } else {
        const prize = currentBet * outcome.mult;
        if (prize > 0) {
          if (typeof window.addClefs === 'function') {
            window.addClefs(prize);
          }
          lastWin = prize;
          updateScoreboards();
          if (statusMsg) statusMsg.textContent = `+${prize} (${outcome.label})`;
          const isJackpot = outcome.mult >= 15;
          soundWin(isJackpot);
          spawnChuteCoins(isJackpot ? 45 : 18);
        } else {
          if (statusMsg) statusMsg.textContent = '0000';
        }
      }
    }, 3000);
  }

  let isCrankRotating = false;
  function turnCrank360() {
    if (isMachineActive || isCrankRotating) return;
    initSlotAudio();

    if (slotMachineMode === 'bet' && getPlayerClefs() < currentBet) {
      const statusMsg = document.getElementById('statusMsg');
      if (statusMsg) statusMsg.textContent = '¡SIN CLAVES!';
      return;
    }

    isCrankRotating = true;
    const crankArmGroup = document.getElementById('crankArmGroup');
    const duration = 500;
    const startT = performance.now();
    let lastStep = 0;

    function crankAnim(now) {
      const elapsed = now - startT;
      const progress = Math.min(1, elapsed / duration);
      const angle = progress * 360;

      if (crankArmGroup) {
        crankArmGroup.style.transform = `rotate(${angle}deg)`;
      }

      const currentStep = Math.floor(progress * 14);
      if (currentStep !== lastStep) {
        soundCrank(currentStep);
        lastStep = currentStep;
      }

      if (progress >= 0.5 && !isMachineActive) {
        triggerSpin();
      }

      if (progress < 1) {
        requestAnimationFrame(crankAnim);
      } else {
        if (crankArmGroup) crankArmGroup.style.transform = 'rotate(0deg)';
        isCrankRotating = false;
      }
    }

    requestAnimationFrame(crankAnim);
  }

  // ============================================================
  // 9. PERIMETER BULBS ANIMATION
  // ============================================================
  function setupPerimeterBulbs() {
    const tEl = document.getElementById('lightsTop');
    const bEl = document.getElementById('lightsBottom');
    const lEl = document.getElementById('lightsLeft');
    const rEl = document.getElementById('lightsRight');

    if (!tEl || tEl.children.length > 0) return;

    const bulbs = [];
    for (let i = 0; i < 11; i++) {
      const d = document.createElement('div');
      d.className = 'perimeter-bulb';
      tEl.appendChild(d); bulbs.push(d);
    }
    for (let i = 0; i < 7; i++) {
      const d = document.createElement('div');
      d.className = 'perimeter-bulb';
      rEl.appendChild(d); bulbs.push(d);
    }
    for (let i = 0; i < 11; i++) {
      const d = document.createElement('div');
      d.className = 'perimeter-bulb';
      bEl.appendChild(d); bulbs.push(d);
    }
    for (let i = 0; i < 7; i++) {
      const d = document.createElement('div');
      d.className = 'perimeter-bulb';
      lEl.appendChild(d); bulbs.push(d);
    }

    let step = 0;
    setInterval(() => {
      step = (step + 1) % 3;
      bulbs.forEach((bulb, idx) => {
        bulb.className = 'perimeter-bulb';
        if ((idx + step) % 3 === 0) bulb.classList.add('glow-amber');
        else if ((idx + step) % 3 === 1) bulb.classList.add('glow-red');
        else bulb.classList.add('glow-cyan');
      });
    }, 180);
  }

  // ============================================================
  // 10. COIN SHOWER CANVAS PHYSICS
  // ============================================================
  let coinCanvas = null;
  let ctxCoins = null;
  let coins = [];
  let isCoinLoopRunning = false;

  function resizeCoinCanvas() {
    if (!coinCanvas) coinCanvas = document.getElementById('coinCanvas');
    if (!coinCanvas) return;
    ctxCoins = coinCanvas.getContext('2d');
    coinCanvas.width = window.innerWidth;
    coinCanvas.height = window.innerHeight;
  }

  class BallisticCoin {
    constructor(startX, startY) {
      this.x = startX;
      this.y = startY;
      const angle = -Math.PI / 2 + (Math.random() * 1.2 - 0.6);
      const speed = Math.random() * 12 + 8;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.gravity = 0.58;
      this.radius = Math.random() * 5 + 7;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.45;
      this.bounces = 0;
      this.maxBounces = 3;
      this.clinkPlayed = false;
    }

    update() {
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed;

      const bottom = window.innerHeight - 20;
      if (this.y + this.radius > bottom) {
        this.y = bottom - this.radius;
        this.vy = -this.vy * 0.52;
        this.vx *= 0.72;
        this.bounces++;
        if (!this.clinkPlayed) {
          soundCoinClink();
          this.clinkPlayed = true;
        }
      }
      return this.bounces < this.maxBounces && this.x > -50 && this.x < window.innerWidth + 50;
    }

    draw() {
      if (!ctxCoins) return;
      ctxCoins.save();
      ctxCoins.translate(this.x, this.y);
      ctxCoins.scale(1, Math.abs(Math.cos(this.rotation)) + 0.15);

      const grad = ctxCoins.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
      grad.addColorStop(0, '#fff4a3');
      grad.addColorStop(0.4, '#ffd700');
      grad.addColorStop(0.8, '#b8860b');
      grad.addColorStop(1, '#523d00');

      ctxCoins.beginPath();
      ctxCoins.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctxCoins.fillStyle = grad;
      ctxCoins.shadowColor = 'rgba(0,0,0,0.5)';
      ctxCoins.shadowBlur = 4;
      ctxCoins.fill();

      ctxCoins.beginPath();
      ctxCoins.arc(0, 0, this.radius * 0.75, 0, Math.PI * 2);
      ctxCoins.strokeStyle = 'rgba(0,0,0,0.3)';
      ctxCoins.lineWidth = 1.2;
      ctxCoins.stroke();

      ctxCoins.restore();
    }
  }

  function spawnChuteCoins(count) {
    const chute = document.getElementById('coinHopperChute');
    if (!chute) return;
    const rect = chute.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        coins.push(new BallisticCoin(originX + (Math.random() * 20 - 10), originY));
        if (!isCoinLoopRunning) {
          isCoinLoopRunning = true;
          requestAnimationFrame(renderCoinLoop);
        }
      }, i * 45);
    }
  }

  function renderCoinLoop() {
    if (!ctxCoins) return;
    ctxCoins.clearRect(0, 0, window.innerWidth, window.innerHeight);

    coins = coins.filter(c => c.update());
    coins.forEach(c => c.draw());

    if (coins.length > 0) {
      requestAnimationFrame(renderCoinLoop);
    } else {
      isCoinLoopRunning = false;
      ctxCoins.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  // ============================================================
  // 11. PUBLIC INTERACTION METHODS & LIFECYCLE
  // ============================================================
  function setSlotMode(mode) {
    slotMachineMode = mode === 'featured' ? 'featured' : 'bet';

    const modalRibbon = document.getElementById('slotRibbonText');
    const tabBetBtn = document.getElementById('slotTabBetBtn');
    const tabFeatBtn = document.getElementById('slotTabFeaturedBtn');
    const betControls = document.getElementById('slotBetControlsGroup');

    if (slotMachineMode === 'featured') {
      if (modalRibbon) modalRibbon.textContent = t('slot_btn_featured', 'CANCIONES DESTACADAS');
      if (tabBetBtn) tabBetBtn.className = 'btn-vegas-led opacity-75';
      if (tabFeatBtn) tabFeatBtn.className = 'btn-vegas-led btn-vegas-led-active';
      if (betControls) betControls.style.opacity = '0.4';
    } else {
      if (modalRibbon) modalRibbon.textContent = 'LAS VEGAS 1977';
      if (tabBetBtn) tabBetBtn.className = 'btn-vegas-led btn-vegas-led-active';
      if (tabFeatBtn) tabFeatBtn.className = 'btn-vegas-led opacity-75';
      if (betControls) betControls.style.opacity = '1';
    }
    updateScoreboards();
  }

  function openGranFortuna(mode = 'bet', fromLoading = false) {
    initSlotAudio();
    window.isSlotActiveDuringLoad = !!fromLoading;

    const modal = document.getElementById('granFortunaModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // Conmutar musica a casino
    playCasinoMusic();

    setSlotMode(mode);

    // Activar bucle de fisica de rodillos
    if (!isReelLoopActive) {
      isReelLoopActive = true;
      requestAnimationFrame(loopReelPhysics);
    }

    setTimeout(() => {
      resizeReelsCanvas();
      resizeCoinCanvas();
      updateScoreboards();
    }, 40);
  }

  function closeGranFortuna() {
    const modal = document.getElementById('granFortunaModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }

    // Detener musica de casino y restaurar menu
    stopCasinoMusic();

    // Si habia una cancion cargada en espera, continuar directamente al juego
    if (window.pendingGameToStart) {
      const pending = window.pendingGameToStart;
      window.pendingGameToStart = null;
      window.isSlotActiveDuringLoad = false;
      if (typeof window.startGame === 'function') {
        window.startGame(pending.beatmapData, pending.audioBlob, pending.diffLabel);
      }
    } else {
      window.isSlotActiveDuringLoad = false;
    }
  }

  function proceedToGameFromSlot() {
    closeGranFortuna();
  }

  function notifySongReadyInSlot() {
    const btnReady = document.getElementById('btnSlotReadyNotification');
    if (btnReady) {
      btnReady.classList.remove('hidden');
      btnReady.style.display = 'inline-flex';
    }
    const statusMsg = document.getElementById('statusMsg');
    if (statusMsg) {
      statusMsg.textContent = t('slot_ready_btn', '✨ ¡Canción lista! Continuar al juego');
    }
  }

  function launchSongFromSlot(songId, isCommunity) {
    closeGranFortuna();
    if (typeof window.playFeaturedSong === 'function') {
      window.playFeaturedSong(songId, isCommunity);
    }
  }

  // ============================================================
  // 12. INITIALIZATION ON DOM READY
  // ============================================================
  function initGranFortuna() {
    initSymbolArt();
    render777LedMatrix();
    setupPerimeterBulbs();
    resizeReelsCanvas();
    resizeCoinCanvas();

    // Alineacion inicial estetica
    reels[0].angle = SYMBOL_LIST.indexOf('seven') * SLOT_STEP;
    reels[1].angle = SYMBOL_LIST.indexOf('bell') * SLOT_STEP;
    reels[2].angle = SYMBOL_LIST.indexOf('bar') * SLOT_STEP;
    drawCylindricalReels();

    updateScoreboards();

    // Palanca
    const crankBase = document.getElementById('crankBase');
    if (crankBase) {
      crankBase.addEventListener('click', turnCrank360);
    }

    // Botones de apuesta
    const betUpBtn = document.getElementById('betUpBtn');
    if (betUpBtn) {
      betUpBtn.addEventListener('click', () => {
        initSlotAudio();
        if (isMachineActive) return;
        if (currentBet < 50) {
          currentBet += 5;
          soundReelTick();
          updateScoreboards();
        }
      });
    }

    const betDownBtn = document.getElementById('betDownBtn');
    if (betDownBtn) {
      betDownBtn.addEventListener('click', () => {
        initSlotAudio();
        if (isMachineActive) return;
        if (currentBet > 1) {
          currentBet = Math.max(1, currentBet - 5);
          soundReelTick();
          updateScoreboards();
        }
      });
    }

    const maxBetBtn = document.getElementById('maxBetBtn');
    if (maxBetBtn) {
      maxBetBtn.addEventListener('click', () => {
        initSlotAudio();
        if (isMachineActive) return;
        const playerClefs = getPlayerClefs();
        currentBet = Math.min(50, Math.max(1, playerClefs));
        soundCoinClink();
        updateScoreboards();
      });
    }

    // Boton de expulsar papel / ticket oficial
    const paperEjectButton = document.getElementById('paperEjectButton');
    if (paperEjectButton) {
      paperEjectButton.addEventListener('click', () => {
        initSlotAudio();
        if (isPaperOut) {
          const feed = document.getElementById('printedPaperFeed');
          if (feed) feed.classList.remove('feed-out');
          isPaperOut = false;
        } else {
          if (slotMachineMode === 'featured') {
            getFeaturedSongsForSlot().then(songs => printFeaturedSongsToPaper(songs));
          } else {
            printPayoutTableToPaper();
          }
        }
      });
    }

    // Boton de sonido
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        isSoundMuted = !isSoundMuted;
        const icon = document.getElementById('slotSoundIcon');
        if (icon) icon.textContent = isSoundMuted ? '🔇' : '🔊';
        if (casinoBgmAudio) {
          casinoBgmAudio.muted = isSoundMuted;
        }
      });
    }

    // Desbloqueo de audio seguro
    const unlock = () => {
      initSlotAudio();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);

    window.addEventListener('resize', () => {
      resizeReelsCanvas();
      resizeCoinCanvas();
    });
  }

  // Exponer API global
  window.openGranFortuna = openGranFortuna;
  window.closeGranFortuna = closeGranFortuna;
  window.setSlotMode = setSlotMode;
  window.proceedToGameFromSlot = proceedToGameFromSlot;
  window.notifySongReadyInSlot = notifySongReadyInSlot;
  window.launchSongFromSlot = launchSongFromSlot;
  window.turnCrank360 = turnCrank360;
  window.playCasinoMusic = playCasinoMusic;
  window.stopCasinoMusic = stopCasinoMusic;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGranFortuna);
  } else {
    initGranFortuna();
  }
})();
