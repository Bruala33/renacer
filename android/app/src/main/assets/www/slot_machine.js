/**
 * GRAN FORTUNA 1977 - Mechanical Arcade Slot Machine
 * Recreacion mecanica ultra-fiel de la Gran Fortuna 1977
 * Incluye:
 * - Modo "Apostar" (Claves reales del usuario, pagos de casino 1977, lluvia balistica de Claves de Sol 𝄞 segun premio)
 * - Modo "Canciones Destacadas" (Tirada gratis, 3 rodillos cilindricos girando canciones con boton interactivo [ ▶ JUGAR ] directo en el tambor)
 * - Sonidos reales MP3 por nivel de premio (slot_win_1.mp3 a slot_win_5.mp3)
 * - Musica de casino ambiental con ciclo de vida blindado (sin solapamiento con menu al loopear o minimizar)
 * - Simbolos arcade 1977 hiperrealistas (Siete 7 rubi profundo con relieve oro cromo)
 * - Integracion con pantalla de carga de cancion (apertura automatica y aviso de lista)
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

  function playSyntheticWinSound(isJackpot) {
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
  // 2. CASINO MP3 WIN SOUNDS (TIERS 1 - 5) & CASINO BGM
  // ============================================================
  const winAudioCache = {};

  function soundWin(multOrIsJackpot) {
    if (isSoundMuted) return;
    let mult = typeof multOrIsJackpot === 'number' ? multOrIsJackpot : (multOrIsJackpot ? 25 : 5);
    let tier = 1;
    if (mult >= 25) tier = 5;      // Mega Jackpot 777 (11.59s)
    else if (mult >= 15) tier = 4; // 3x Diamante (3.09s)
    else if (mult >= 10) tier = 3; // 3x Campana (2.96s)
    else if (mult >= 5) tier = 2;  // 3x BAR (2.47s)
    else tier = 1;                 // Premios pequeños (1x, 2x, 3x cereza/limón/naranja/uvas) (1.71s)

    try {
      const src = `assets/slot_win_${tier}.mp3`;
      if (!winAudioCache[src]) {
        winAudioCache[src] = new Audio(src);
      }
      const audio = winAudioCache[src];
      audio.currentTime = 0;
      audio.volume = 0.90;
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {
          playSyntheticWinSound(tier >= 4);
        });
      }
    } catch (_) {
      playSyntheticWinSound(tier >= 4);
    }
  }

  let casinoBgmAudio = null;

  function playCasinoMusic() {
    window.isCasinoActive = true;
    if (typeof window.pauseMenuAmbientMusic === 'function') {
      window.pauseMenuAmbientMusic();
    }
    if (!casinoBgmAudio) {
      casinoBgmAudio = new Audio('assets/casino_music.mp3');
      casinoBgmAudio.loop = true;
      // Prevenir estrictamente que el término o loop del track dispare la música de menú
      casinoBgmAudio.addEventListener('ended', () => {
        if (window.isCasinoActive) {
          casinoBgmAudio.currentTime = 0;
          casinoBgmAudio.play().catch(() => {});
        }
      });
    }
    casinoBgmAudio.volume = 0.55;
    try {
      const p = casinoBgmAudio.play();
      if (p !== undefined) p.catch(() => {});
    } catch (_) {}
  }

  function pauseCasinoMusic() {
    if (casinoBgmAudio) {
      try {
        casinoBgmAudio.pause();
      } catch (_) {}
    }
  }

  function resumeCasinoMusic() {
    if (window.isCasinoActive && casinoBgmAudio) {
      try {
        const p = casinoBgmAudio.play();
        if (p !== undefined) p.catch(() => {});
      } catch (_) {}
    }
  }

  function stopCasinoMusic() {
    window.isCasinoActive = false;
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

  window.playCasinoMusic = playCasinoMusic;
  window.pauseCasinoMusic = pauseCasinoMusic;
  window.resumeCasinoMusic = resumeCasinoMusic;
  window.stopCasinoMusic = stopCasinoMusic;

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

    // 1. Sombra pesada de relieve profundo 3D
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.moveTo(-36, -42);
    ctx.lineTo(44, -42);
    ctx.lineTo(44, -22);
    ctx.lineTo(8, 62);
    ctx.lineTo(-20, 62);
    ctx.lineTo(16, -22);
    ctx.lineTo(-36, -22);
    ctx.closePath();
    ctx.fill();

    // 2. Marco exterior de bisel oro pulido (Cromo dorado 1977 Las Vegas)
    const goldGradOuter = ctx.createLinearGradient(-40, -50, 40, 50);
    goldGradOuter.addColorStop(0.0, '#fff4b8');
    goldGradOuter.addColorStop(0.22, '#ffd700');
    goldGradOuter.addColorStop(0.50, '#d4af37');
    goldGradOuter.addColorStop(0.78, '#855f1a');
    goldGradOuter.addColorStop(1.0, '#ffd700');

    ctx.lineWidth = 14;
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 3;
    ctx.strokeStyle = goldGradOuter;

    ctx.beginPath();
    ctx.moveTo(-38, -48);
    ctx.lineTo(40, -48);
    ctx.lineTo(40, -26);
    ctx.lineTo(4, 54);
    ctx.lineTo(-24, 54);
    ctx.lineTo(12, -26);
    ctx.lineTo(-38, -26);
    ctx.closePath();
    ctx.stroke();

    // 3. Bisel interior dorado brillante fino
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fff8d6';
    ctx.stroke();

    // 4. Núcleo de esmalte Rubí Profundo con multicapa de degradados (Auténtico 7 de casino 1977)
    const rubyGrad = ctx.createLinearGradient(-25, -45, 25, 45);
    rubyGrad.addColorStop(0.0, '#ff4d4d');
    rubyGrad.addColorStop(0.20, '#d61111');
    rubyGrad.addColorStop(0.55, '#8c0303');
    rubyGrad.addColorStop(0.85, '#4f0000');
    rubyGrad.addColorStop(1.0, '#220000');

    ctx.fillStyle = rubyGrad;
    ctx.fill();

    // 5. Reflejo especular superior brillante (cristal biselado)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-32, -42);
    ctx.lineTo(32, -42);
    ctx.stroke();

    // 6. Resplandor secundario a lo largo de la pata diagonal del 7
    const diagGrad = ctx.createLinearGradient(12, -24, -10, 48);
    diagGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.8)');
    diagGrad.addColorStop(0.5, 'rgba(255, 140, 140, 0.45)');
    diagGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.strokeStyle = diagGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(30, -22);
    ctx.lineTo(-6, 48);
    ctx.stroke();

    ctx.restore();
  }

  function drawDiamond(ctx) {
    ctx.save();
    ctx.translate(100, 100);

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(3, -47); ctx.lineTo(47, 3); ctx.lineTo(3, 53); ctx.lineTo(-41, 3);
    ctx.closePath(); ctx.fill();

    // Borde platino
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
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
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
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
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
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
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-52, -26, 110, 58, 8);
    else ctx.rect(-52, -26, 110, 58);
    ctx.fill();

    // Borde cromo 3D
    const barBorder = ctx.createLinearGradient(-55, -30, 55, 30);
    barBorder.addColorStop(0, '#ffffff');
    barBorder.addColorStop(0.3, '#d4d4d4');
    barBorder.addColorStop(0.7, '#6e6e6e');
    barBorder.addColorStop(1, '#1e1e1e');
    ctx.strokeStyle = barBorder;
    ctx.lineWidth = 7;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-55, -30, 110, 60, 8);
    else ctx.rect(-55, -30, 110, 60);
    ctx.stroke();

    // Fondo oscuro esmaltado
    const barBg = ctx.createLinearGradient(0, -28, 0, 28);
    barBg.addColorStop(0, '#222222');
    barBg.addColorStop(0.5, '#0c0c0c');
    barBg.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = barBg;
    ctx.fill();

    // Texto BAR en relieve dorado
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
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
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
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.arc(16, 13, 4, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function drawOrange(ctx) {
    ctx.save();
    ctx.translate(100, 100);

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(3, 5, 38, 0, Math.PI * 2); ctx.fill();

    // Naranja
    const oGrad = ctx.createRadialGradient(-12, -12, 5, 0, 0, 42);
    oGrad.addColorStop(0, '#ffc04d');
    oGrad.addColorStop(0.4, '#ff8c00');
    oGrad.addColorStop(0.8, '#d95300');
    oGrad.addColorStop(1, '#802600');
    ctx.fillStyle = oGrad;
    ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#662200'; ctx.lineWidth = 2.5; ctx.stroke();

    // Textura de poros
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(-10, -10, 8, 0, Math.PI * 2); ctx.fill();

    // Tallo y hoja
    ctx.strokeStyle = '#4d3319'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(4, -45); ctx.stroke();

    ctx.fillStyle = '#408010';
    ctx.beginPath();
    ctx.moveTo(2, -40); ctx.quadraticCurveTo(18, -46, 22, -36); ctx.quadraticCurveTo(10, -33, 2, -40);
    ctx.fill();

    ctx.restore();
  }

  function drawLemon(ctx) {
    ctx.save();
    ctx.translate(100, 100);
    ctx.rotate(-0.35);

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(3, 4, 44, 30, 0, 0, Math.PI * 2); ctx.fill();

    // Limon eliptico
    const lGrad = ctx.createRadialGradient(-10, -10, 6, 0, 0, 46);
    lGrad.addColorStop(0, '#ffff80');
    lGrad.addColorStop(0.4, '#ffd900');
    lGrad.addColorStop(0.8, '#cca300');
    lGrad.addColorStop(1, '#806600');
    ctx.fillStyle = lGrad;

    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#665200'; ctx.lineWidth = 2.5; ctx.stroke();

    // Extremos puntiagudos del limon
    ctx.beginPath(); ctx.arc(-42, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(42, 0, 3, 0, Math.PI * 2); ctx.fill();

    // Brillo
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.ellipse(-12, -8, 12, 5, -0.2, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function drawGrapes(ctx) {
    ctx.save();
    ctx.translate(100, 95);

    // Tallo
    ctx.strokeStyle = '#593817'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -34); ctx.quadraticCurveTo(6, -44, 16, -42); ctx.stroke();

    // Uvas individuales en racimo piramidal
    const grapeCoords = [
      [-16, -18], [0, -20], [16, -18],
      [-22, -4], [-8, -6], [8, -6], [22, -4],
      [-14, 8], [0, 8], [14, 8],
      [-7, 22], [7, 22],
      [0, 34]
    ];

    grapeCoords.forEach(([gx, gy]) => {
      ctx.save();
      const gGrad = ctx.createRadialGradient(gx - 3, gy - 3, 2, gx, gy, 12);
      gGrad.addColorStop(0, '#c77dff');
      gGrad.addColorStop(0.4, '#7b2cbf');
      gGrad.addColorStop(0.8, '#3c096c');
      gGrad.addColorStop(1, '#10002b');
      ctx.fillStyle = gGrad;
      ctx.beginPath(); ctx.arc(gx, gy, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1a052e'; ctx.lineWidth = 1.2; ctx.stroke();

      // Brillo en uva
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(gx - 3, gy - 3, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  function initSymbolArt() {
    const symbols = {
      seven: drawSeven,
      diamond: drawDiamond,
      bell: drawBell,
      bar: drawBar,
      cherry: drawCherry,
      orange: drawOrange,
      lemon: drawLemon,
      grapes: drawGrapes
    };

    Object.entries(symbols).forEach(([id, drawFn]) => {
      const c = document.createElement('canvas');
      c.width = 200;
      c.height = 200;
      const ctx = c.getContext('2d');
      drawFn(ctx);
      symbolCanvases[id] = c;
    });
  }

  // ============================================================
  // 4. LED 777 MATRIX & MARQUEE HEADER
  // ============================================================
  function render777LedMatrix() {
    const svg = document.getElementById('led777Svg');
    if (!svg) return;

    const matrix7 = [
      [1, 1, 1, 1, 1],
      [0, 0, 0, 0, 1],
      [0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 1, 0, 0, 0]
    ];

    let dots = '';
    const offsetX = [12, 64, 116];

    offsetX.forEach(ox => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 5; c++) {
          const isLit = matrix7[r][c] === 1;
          const x = ox + c * 8;
          const y = 5 + r * 4.5;
          const color = isLit ? '#ffd700' : '#2b2100';
          const glow = isLit ? 'filter="url(#glowFilter)"' : '';
          dots += `<circle cx="${x}" cy="${y}" r="2.2" fill="${color}" ${glow} />`;
        }
      }
    });

    svg.innerHTML = `
      <defs>
        <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      ${dots}
    `;
  }

  // ============================================================
  // 5. CYLINDRICAL REELS RENDERING & PHYSICS ENGINE
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

  // Pool de canciones para los rodillos cilíndricos en Modo "Canciones Destacadas"
  let featuredSongsReelPool = [
    { id: 'comm_renacer', title: 'Renacer', artist: 'Beatstar Official', stars: 5.0, difficulty_name: 'Difícil', is_community: true },
    { id: 'custom_fur_elise', title: 'Für Elise (Arcade Mix)', artist: 'Beethoven', stars: 3.5, difficulty_name: 'Media', is_community: false },
    { id: 'custom_canon_d', title: 'Canon in D Rock', artist: 'Pachelbel', stars: 4.5, difficulty_name: 'Normal', is_community: false },
    { id: 'custom_moonlight', title: 'Moonlight Sonata', artist: 'Beethoven', stars: 6.0, difficulty_name: 'Extrema', is_community: false },
    { id: 'custom_turkish', title: 'Rondo Alla Turca', artist: 'Mozart', stars: 4.0, difficulty_name: 'Normal', is_community: false },
    { id: 'comm_sara_perche', title: 'Sarà Perché Ti Amo', artist: 'Tommy Johansson', stars: 3.5, difficulty_name: 'Hard', is_community: true },
    { id: 'custom_the_pretender', title: 'The Pretender', artist: 'Foo Fighters', stars: 5.5, difficulty_name: 'Difícil', is_community: false },
    { id: 'custom_swan_lake', title: 'Swan Lake Theme', artist: 'Tchaikovsky', stars: 3.0, difficulty_name: 'Fácil', is_community: false }
  ];
  const TOTAL_SONG_SLOTS = 6;
  const SONG_STEP = (Math.PI * 2) / TOTAL_SONG_SLOTS;

  const songCoverCache = {};
  function getSongCoverImage(src) {
    if (!src) return null;
    if (!songCoverCache[src]) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => {
        if (slotMachineMode === 'featured') drawCylindricalReels();
      };
      songCoverCache[src] = img;
    }
    return songCoverCache[src];
  }

  function wrapSongTitle(text, maxChars = 13, maxLines = 3) {
    if (!text) return ['Canción'];
    const words = String(text).trim().split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + (cur ? ' ' : '') + w).length <= maxChars) {
        cur += (cur ? ' ' : '') + w;
      } else {
        if (cur) lines.push(cur);
        cur = w;
        if (lines.length >= maxLines - 1) break;
      }
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    if (lines.length === 0) lines.push(String(text).slice(0, maxChars));
    return lines;
  }

  async function refreshFeaturedSongsPool() {
    try {
      let pool = [];
      if (Array.isArray(window.dailyFeaturedSongsList) && window.dailyFeaturedSongsList.length > 0) {
        pool = [...window.dailyFeaturedSongsList];
      } else if (Array.isArray(window.searchResultsCache) && window.searchResultsCache.length > 0) {
        pool = window.searchResultsCache.slice(0, 12);
      }
      if (pool.length >= 3) {
        featuredSongsReelPool = pool;
      }
    } catch (_) {}
  }

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

      // Fondo de tambor marfil vintage
      const baseGrad = ctxReels.createLinearGradient(leftX, 0, leftX + reelWidth, 0);
      baseGrad.addColorStop(0, '#e5dcc7');
      baseGrad.addColorStop(0.12, '#faf7ee');
      baseGrad.addColorStop(0.88, '#fcfaf2');
      baseGrad.addColorStop(1, '#ded3be');
      ctxReels.fillStyle = baseGrad;
      ctxReels.fillRect(leftX, 0, reelWidth, canvasH);

      // Curvatura cilíndrica sombreada
      const cylinderGrad = ctxReels.createLinearGradient(0, 0, 0, canvasH);
      cylinderGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
      cylinderGrad.addColorStop(0.25, 'rgba(0, 0, 0, 0.12)');
      cylinderGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      cylinderGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.15)');
      cylinderGrad.addColorStop(1, 'rgba(0, 0, 0, 0.80)');

      // DIBUJAR CONTENIDO DE RODILLO SEGÚN MODO
      if (slotMachineMode === 'featured') {
        // ==========================================
        // MODO CANCIONES DESTACADAS (RODILLOS GIRAN CANCIONES)
        // ==========================================
        const poolLen = featuredSongsReelPool.length;

        for (let s = 0; s < TOTAL_SONG_SLOTS; s++) {
          const songIdx = ((s + i * 3) % poolLen + poolLen) % poolLen;
          const song = featuredSongsReelPool[songIdx] || { title: 'Canción', artist: 'Artista', stars: 3.5 };

          let angleDiff = (s * SONG_STEP - reel.angle) % (Math.PI * 2);
          if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          if (Math.abs(angleDiff) > Math.PI / 2.05) continue;

          const yPos = centerY + Math.sin(angleDiff) * radius;
          const scaleY = Math.max(0.15, Math.cos(angleDiff));
          const scaleX = 0.94 * Math.cos(angleDiff * 0.35);

          const cardW = reelWidth * 0.94 * scaleX;
          const cardH = 138 * scaleY;
          const isCentered = Math.abs(angleDiff) < 0.22 && !reel.isSpinning;

          ctxReels.save();
          ctxReels.translate(centerX, yPos);

          // Sombra de tarjeta
          ctxReels.fillStyle = 'rgba(0, 0, 0, 0.40)';
          if (ctxReels.roundRect) ctxReels.roundRect(-cardW / 2 + 2, -cardH / 2 + 2, cardW, cardH, 8 * scaleY);
          else ctxReels.rect(-cardW / 2 + 2, -cardH / 2 + 2, cardW, cardH);
          ctxReels.fill();

          // Fondo pergamino dorado / marfil de la tarjeta
          const cardGrad = ctxReels.createLinearGradient(0, -cardH / 2, 0, cardH / 2);
          if (isCentered) {
            cardGrad.addColorStop(0.0, '#fffef5');
            cardGrad.addColorStop(0.5, '#fef6d8');
            cardGrad.addColorStop(1.0, '#fae19c');
          } else {
            cardGrad.addColorStop(0.0, '#f7f2e8');
            cardGrad.addColorStop(1.0, '#dfd2be');
          }
          ctxReels.fillStyle = cardGrad;
          if (ctxReels.roundRect) ctxReels.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 8 * scaleY);
          else ctxReels.rect(-cardW / 2, -cardH / 2, cardW, cardH);
          ctxReels.fill();

          // Borde metálico biselado
          ctxReels.strokeStyle = isCentered ? '#d4af37' : 'rgba(120, 90, 50, 0.45)';
          ctxReels.lineWidth = isCentered ? 2.5 : 1.2;
          if (ctxReels.roundRect) ctxReels.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 8 * scaleY);
          else ctxReels.rect(-cardW / 2, -cardH / 2, cardW, cardH);
          ctxReels.stroke();

          // 1. MINIATURA DE PORTADA O VINILO (Parte Superior)
          const thumbSize = Math.min(cardW * 0.44, 40 * scaleY);
          const thumbY = -cardH / 2 + 8 * scaleY + thumbSize / 2;
          const coverSrc = song.cover_url || song.cover || song.album_art || song.image || './app_logo.png';
          const coverImg = getSongCoverImage(coverSrc);

          if (coverImg && coverImg.complete && coverImg.naturalWidth > 0) {
            ctxReels.save();
            ctxReels.beginPath();
            if (ctxReels.roundRect) ctxReels.roundRect(-thumbSize / 2, thumbY - thumbSize / 2, thumbSize, thumbSize, 6 * scaleY);
            else ctxReels.rect(-thumbSize / 2, thumbY - thumbSize / 2, thumbSize, thumbSize);
            ctxReels.clip();
            ctxReels.drawImage(coverImg, -thumbSize / 2, thumbY - thumbSize / 2, thumbSize, thumbSize);
            ctxReels.restore();

            ctxReels.strokeStyle = '#d4af37';
            ctxReels.lineWidth = 1.2;
            if (ctxReels.roundRect) ctxReels.roundRect(-thumbSize / 2, thumbY - thumbSize / 2, thumbSize, thumbSize, 6 * scaleY);
            else ctxReels.rect(-thumbSize / 2, thumbY - thumbSize / 2, thumbSize, thumbSize);
            ctxReels.stroke();
          } else {
            // Vinilo arcade con clave de sol dorada
            const vinylR = thumbSize / 2;
            ctxReels.fillStyle = '#111111';
            ctxReels.beginPath();
            ctxReels.arc(0, thumbY, vinylR, 0, Math.PI * 2);
            ctxReels.fill();

            ctxReels.strokeStyle = '#d4af37';
            ctxReels.lineWidth = 1;
            ctxReels.stroke();

            ctxReels.fillStyle = '#ffd700';
            ctxReels.font = `bold ${Math.max(6, Math.round(11 * scaleY))}px sans-serif`;
            ctxReels.textAlign = 'center';
            ctxReels.textBaseline = 'middle';
            ctxReels.fillText('𝄞', 0, thumbY);
          }

          // Badge de Estrellas
          const starsVal = Number(song.stars || 3.5).toFixed(1);
          const starsY = thumbY + thumbSize / 2 + 7 * scaleY;
          ctxReels.fillStyle = '#b8860b';
          ctxReels.font = `bold ${Math.max(6, Math.round(7.5 * scaleY))}px "Montserrat", sans-serif`;
          ctxReels.textAlign = 'center';
          ctxReels.fillText(`★ ${starsVal}`, 0, starsY);

          // 2. TÍTULO MULTILÍNEA (Hasta 3 líneas legibles sin encogerse)
          const titleLines = wrapSongTitle(song.title, 13, 3);
          const lineH = Math.max(7, Math.round(9.5 * scaleY));
          let textY = starsY + 9 * scaleY;

          ctxReels.fillStyle = '#1a1005';
          ctxReels.font = `900 ${Math.max(6.5, Math.round(8.5 * scaleY))}px "Montserrat", sans-serif`;
          ctxReels.textAlign = 'center';
          for (let l = 0; l < titleLines.length; l++) {
            ctxReels.fillText(titleLines[l], 0, textY);
            textY += lineH;
          }

          // 3. ARTISTA (1 Línea sutil)
          ctxReels.fillStyle = '#6e4f2b';
          ctxReels.font = `bold ${Math.max(5.5, Math.round(7 * scaleY))}px "Montserrat", sans-serif`;
          const artistStr = (song.artist || 'Artista').slice(0, 14);
          ctxReels.fillText(artistStr, 0, textY + 1 * scaleY);

          // 4. BOTÓN DIRECTO [ ▶ JUGAR ] VISIBLE EN LA TARJETA
          if (isCentered || !reel.isSpinning) {
            const btnW = Math.min(cardW * 0.88, 76 * scaleX);
            const btnH = Math.max(14, 20 * scaleY);
            const btnY = cardH / 2 - btnH / 2 - 4 * scaleY;

            const btnGrad = ctxReels.createLinearGradient(0, btnY - btnH / 2, 0, btnY + btnH / 2);
            btnGrad.addColorStop(0.0, '#34d399');
            btnGrad.addColorStop(0.5, '#10b981');
            btnGrad.addColorStop(1.0, '#047857');
            ctxReels.fillStyle = btnGrad;

            if (ctxReels.roundRect) ctxReels.roundRect(-btnW / 2, btnY - btnH / 2, btnW, btnH, 6 * scaleY);
            else ctxReels.rect(-btnW / 2, btnY - btnH / 2, btnW, btnH);
            ctxReels.fill();

            ctxReels.strokeStyle = '#ffffff';
            ctxReels.lineWidth = 1;
            ctxReels.stroke();

            ctxReels.fillStyle = '#ffffff';
            ctxReels.textAlign = 'center';
            ctxReels.font = `900 ${Math.max(6, Math.round(8.5 * scaleY))}px "Montserrat", sans-serif`;
            ctxReels.fillText('▶ JUGAR', 0, btnY + 1 * scaleY);
          }

          ctxReels.restore();
        }

      } else {
        // ==========================================
        // MODO APOSTAR (RODILLOS GIRAN SÍMBOLOS CLÁSICOS)
        // ==========================================
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
      }

      ctxReels.fillStyle = cylinderGrad;
      ctxReels.fillRect(leftX, 0, reelWidth, canvasH);

      // Separador cromado entre tambores
      ctxReels.strokeStyle = 'rgba(60, 45, 30, 0.65)';
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

            const stepAngle = slotMachineMode === 'featured' ? SONG_STEP : SLOT_STEP;
            const currentSlot = Math.floor(reel.angle / stepAngle);
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

  function t(key, def) {
    if (typeof window.t === 'function') {
      const val = window.t(key);
      if (val && val !== key) return val;
    }
    return def;
  }

  function getPlayerClefs() {
    if (typeof window.userClefs !== 'undefined' && Number.isFinite(window.userClefs)) {
      return window.userClefs;
    }
    return parseInt(localStorage.getItem('beatstar_clefs') || '100', 10);
  }

  function updateScoreboards() {
    const credEl = document.getElementById('creditsDisplay');
    const betEl = document.getElementById('betDisplay');
    const winEl = document.getElementById('winDisplay');

    const clefs = getPlayerClefs();
    if (credEl) credEl.textContent = String(clefs).padStart(4, '0');
    if (betEl) betEl.textContent = String(currentBet).padStart(4, '0');
    if (winEl) winEl.textContent = String(lastWin).padStart(4, '0');
  }

  function calculateOutcome() {
    // 50% probabilidad de tirada premiada en modo apuesta
    const isWin = Math.random() < 0.50;

    if (isWin) {
      const roll = Math.random();
      if (roll < 0.004) {
        const idx = SYMBOL_LIST.indexOf('seven');
        return { indices: [idx, idx, idx], mult: 25, label: '3x SIETE ORO (JACKPOT)' };
      } else if (roll < 0.02) {
        const idx = SYMBOL_LIST.indexOf('diamond');
        return { indices: [idx, idx, idx], mult: 15, label: '3x DIAMANTE' };
      } else if (roll < 0.06) {
        const idx = SYMBOL_LIST.indexOf('bell');
        return { indices: [idx, idx, idx], mult: 10, label: '3x CAMPANA' };
      } else if (roll < 0.12) {
        const idx = SYMBOL_LIST.indexOf('bar');
        return { indices: [idx, idx, idx], mult: 6, label: '3x BAR' };
      } else if (roll < 0.22) {
        const idx = SYMBOL_LIST.indexOf('cherry');
        return { indices: [idx, idx, idx], mult: 4, label: '3x CEREZAS' };
      } else if (roll < 0.38) {
        const fruit = ['grapes', 'orange', 'lemon'][Math.floor(Math.random() * 3)];
        const idx = SYMBOL_LIST.indexOf(fruit);
        return { indices: [idx, idx, idx], mult: 3, label: `3x ${fruit.toUpperCase()}` };
      } else if (roll < 0.58) {
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
  // 7. SPIN TRIGGER & EXECUTION
  // ============================================================
  async function triggerSpin() {
    if (isMachineActive) return;
    initSlotAudio();

    const statusMsg = document.getElementById('statusMsg');

    if (slotMachineMode === 'bet') {
      const clefs = getPlayerClefs();
      if (clefs < currentBet) {
        if (statusMsg) statusMsg.textContent = t('slot_no_clefs', '¡SIN CLAVES SUFICIENTES!');
        return;
      }
      if (typeof window.addClefs === 'function') {
        window.addClefs(-currentBet);
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

    if (slotMachineMode === 'featured') {
      await refreshFeaturedSongsPool();
      outcome = {
        indices: [
          Math.floor(Math.random() * TOTAL_SONG_SLOTS),
          Math.floor(Math.random() * TOTAL_SONG_SLOTS),
          Math.floor(Math.random() * TOTAL_SONG_SLOTS)
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
    const stepAngle = slotMachineMode === 'featured' ? SONG_STEP : SLOT_STEP;

    for (let i = 0; i < 3; i++) {
      const reel = reels[i];
      const symTargetIndex = outcome.indices[i];
      const targetExactAngle = symTargetIndex * stepAngle;

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
        if (statusMsg) statusMsg.textContent = '★ ¡TOCA UNA CANCIÓN EN EL RODILLO PARA JUGAR! ★';
        soundWin(5); // Tier 2 win melody
      } else {
        const prize = currentBet * outcome.mult;
        if (prize > 0) {
          if (typeof window.addClefs === 'function') {
            window.addClefs(prize);
          }
          lastWin = prize;
          updateScoreboards();
          if (statusMsg) statusMsg.textContent = `+${prize} (${outcome.label})`;
          soundWin(outcome.mult);
          spawnChuteCoins(prize);
        } else {
          if (statusMsg) statusMsg.textContent = '0000';
        }
      }
    }, durations[2] + 80);
  }

  // ============================================================
  // 8. 360° ROTATING CRANK LEVER
  // ============================================================
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
  // 10. CLAVES DE SOL (𝄞) BALLISTIC SHOWER PHYSICS
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

  let clefSpriteCanvas = null;
  function getClefSprite() {
    if (clefSpriteCanvas) return clefSpriteCanvas;
    clefSpriteCanvas = document.createElement('canvas');
    clefSpriteCanvas.width = 64;
    clefSpriteCanvas.height = 64;
    const sCtx = clefSpriteCanvas.getContext('2d');
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';

    sCtx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    sCtx.shadowBlur = 4;
    sCtx.shadowOffsetY = 2;

    const goldGrad = sCtx.createLinearGradient(16, 8, 48, 56);
    goldGrad.addColorStop(0.0, '#fff9cc');
    goldGrad.addColorStop(0.3, '#ffd700');
    goldGrad.addColorStop(0.7, '#d4af37');
    goldGrad.addColorStop(1.0, '#7a5200');

    sCtx.font = 'bold 44px "Outfit", "Montserrat", serif, sans-serif';
    sCtx.fillStyle = goldGrad;
    sCtx.fillText('𝄞', 32, 32);

    sCtx.shadowColor = 'transparent';
    sCtx.strokeStyle = '#fff0a6';
    sCtx.lineWidth = 1.0;
    sCtx.strokeText('𝄞', 32, 32);
    return clefSpriteCanvas;
  }

  class BallisticClef {
    constructor(startX, startY) {
      this.x = startX;
      this.y = startY;
      const angle = -Math.PI / 2 + (Math.random() * 1.3 - 0.65);
      const speed = Math.random() * 14 + 9;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.gravity = 0.60;
      this.size = Math.random() * 8 + 22; // 22px to 30px
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.35;
      this.scaleX = 1.0;
      this.flipSpeed = Math.random() * 0.15 + 0.08;
      this.bounces = 0;
      this.maxBounces = 3;
      this.clinkPlayed = false;
    }

    update() {
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed;
      this.scaleX = Math.cos(performance.now() * 0.005 * this.flipSpeed);

      const bottom = window.innerHeight - 25;
      if (this.y + this.size / 2 > bottom) {
        this.y = bottom - this.size / 2;
        this.vy = -this.vy * 0.54;
        this.vx *= 0.75;
        this.bounces++;
        if (!this.clinkPlayed) {
          soundCoinClink();
          this.clinkPlayed = true;
        }
      }
      return this.bounces < this.maxBounces && this.x > -60 && this.x < window.innerWidth + 60;
    }

    draw() {
      if (!ctxCoins) return;
      const sprite = getClefSprite();
      ctxCoins.save();
      ctxCoins.translate(this.x, this.y);
      ctxCoins.rotate(this.rotation * 0.25);
      ctxCoins.scale(Math.abs(this.scaleX) * 0.85 + 0.15, 1);
      const s = this.size;
      ctxCoins.drawImage(sprite, -s / 2, -s / 2, s, s);
      ctxCoins.restore();
    }
  }

  function spawnChuteCoins(prizeCount) {
    const chute = document.getElementById('coinHopperChute');
    if (!chute) return;
    const rect = chute.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    // Conteo optimizado a 24-28 partículas de alto impacto a 120 FPS sin ralentizaciones
    const actualCount = Math.max(10, Math.min(26, parseInt(prizeCount) || 16));
    const delayStep = Math.max(18, Math.min(45, 650 / actualCount));

    for (let i = 0; i < actualCount; i++) {
      setTimeout(() => {
        coins.push(new BallisticClef(originX + (Math.random() * 24 - 12), originY));
        if (!isCoinLoopRunning) {
          isCoinLoopRunning = true;
          requestAnimationFrame(renderCoinLoop);
        }
      }, i * delayStep);
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
      if (tabBetBtn) tabBetBtn.className = 'btn-vegas-led opacity-75 px-2.5 py-1 text-[10px]';
      if (tabFeatBtn) tabFeatBtn.className = 'btn-vegas-led btn-vegas-led-active px-2.5 py-1 text-[10px]';
      if (betControls) betControls.style.opacity = '0.35';
      refreshFeaturedSongsPool().then(() => drawCylindricalReels());
    } else {
      if (modalRibbon) modalRibbon.textContent = 'LAS VEGAS 1977';
      if (tabBetBtn) tabBetBtn.className = 'btn-vegas-led btn-vegas-led-active px-2.5 py-1 text-[10px]';
      if (tabFeatBtn) tabFeatBtn.className = 'btn-vegas-led opacity-75 px-2.5 py-1 text-[10px]';
      if (betControls) betControls.style.opacity = '1';
      drawCylindricalReels();
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

    // Si estabamos en la pestaña discover, volver a search
    if (typeof window.currentActiveTab !== 'undefined' && window.currentActiveTab === 'discover') {
      if (typeof window.switchMainTab === 'function') {
        window.switchMainTab('search');
      }
    }

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
    const overlay = document.getElementById('globalLoadingOverlay');
    if (overlay) overlay.classList.remove('active');
    closeGranFortuna();
  }

  function togglePaperFeed() {
    const feed = document.getElementById('printedPaperFeed');
    if (!feed) return;
    initSlotAudio();
    soundPrinterFeed();
    isPaperOut = !isPaperOut;
    if (isPaperOut) {
      feed.classList.add('feed-out');
      const statusMsg = document.getElementById('statusMsg');
      if (statusMsg) statusMsg.textContent = 'TABLA DE PAGOS E INSTRUCCIONES';
    } else {
      feed.classList.remove('feed-out');
    }
  }

  function notifySongReadyInSlot() {
    const btnReady = document.getElementById('btnSlotReadyNotification');
    if (btnReady) {
      btnReady.classList.remove('hidden');
      btnReady.style.display = 'inline-flex';
    }
    const statusMsg = document.getElementById('statusMsg');
    if (statusMsg) {
      statusMsg.textContent = t('slot_ready_btn', '✨ ¡Canción lista! Jugar ahora');
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

    // Palanca 360°
    const crankBase = document.getElementById('crankBase');
    if (crankBase) {
      crankBase.addEventListener('click', turnCrank360);
    }

    // Botón eyector de papel / instrucciones
    const paperBtn = document.getElementById('paperEjectButton');
    if (paperBtn) {
      paperBtn.addEventListener('click', togglePaperFeed);
    }

    // Clic directo en el tambor interactivo (Modo Canciones Destacadas)
    if (reelsCanvas) {
      reelsCanvas.addEventListener('click', (e) => {
        if (slotMachineMode !== 'featured' || isMachineActive) return;
        const rect = reelsCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const reelW = rect.width / 3;
        const reelIdx = Math.max(0, Math.min(2, Math.floor(clickX / reelW)));

        const reel = reels[reelIdx];
        const poolLen = featuredSongsReelPool.length;
        const currentSlot = Math.round(reel.angle / SONG_STEP);
        const songIdx = ((currentSlot + reelIdx * 3) % poolLen + poolLen) % poolLen;
        const song = featuredSongsReelPool[songIdx];

        if (song && song.id) {
          soundCoinClink();
          launchSongFromSlot(song.id, !!song.is_community);
        }
      });

      reelsCanvas.addEventListener('mousemove', () => {
        if (slotMachineMode === 'featured' && !isMachineActive) {
          reelsCanvas.style.cursor = 'pointer';
        } else {
          reelsCanvas.style.cursor = 'default';
        }
      });
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
        const clefs = getPlayerClefs();
        currentBet = Math.min(50, Math.max(1, clefs));
        soundReelTick();
        updateScoreboards();
      });
    }

    // Boton de sonido mute
    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        isSoundMuted = !isSoundMuted;
        const icon = document.getElementById('slotSoundIcon');
        if (icon) {
          icon.textContent = isSoundMuted ? '🔇' : '🔊';
        }
        if (casinoBgmAudio) {
          casinoBgmAudio.muted = isSoundMuted;
        }
      });
    }

    window.addEventListener('resize', () => {
      resizeReelsCanvas();
      resizeCoinCanvas();
    });
  }

  // Exportar metodos globales
  window.openGranFortuna = openGranFortuna;
  window.closeGranFortuna = closeGranFortuna;
  window.setSlotMode = setSlotMode;
  window.turnCrank360 = turnCrank360;
  window.proceedToGameFromSlot = proceedToGameFromSlot;
  window.notifySongReadyInSlot = notifySongReadyInSlot;
  window.launchSongFromSlot = launchSongFromSlot;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGranFortuna);
  } else {
    initGranFortuna();
  }

})();
