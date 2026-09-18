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
        if (window.gameInstance && window.gameInstance.synth && window.gameInstance.synth.audioCtx) {
          slotAudioCtx = window.gameInstance.synth.audioCtx;
        } else {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) slotAudioCtx = new AudioCtx();
        }
      }
      if (slotAudioCtx && slotAudioCtx.state === 'suspended') {
        slotAudioCtx.resume().catch(() => {});
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

  function playSyntheticWinSound(isBig) {
    if (isSoundMuted) return;
    initSlotAudio();
    if (!slotAudioCtx) return;
    try {
      const now = slotAudioCtx.currentTime;
      const notes = isBig 
        ? [523.25, 659.25, 783.99, 1046.50, 1318.51] 
        : [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = slotAudioCtx.createOscillator();
        const gain = slotAudioCtx.createGain();
        osc.type = isBig ? 'sawtooth' : 'triangle';
        osc.frequency.value = freq;
        const t = now + idx * 0.08;
        gain.gain.setValueAtTime(0.20, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (isBig ? 0.35 : 0.22));
        osc.connect(gain);
        gain.connect(slotAudioCtx.destination);
        osc.start(t);
        osc.stop(t + (isBig ? 0.35 : 0.22));
      });
      setTimeout(() => soundCoinClink(), 100);
    } catch (_) {}
  }

  function unlockAllSlotAudio() {
    initSlotAudio();
    try {
      [1, 2, 3, 4, 5].forEach(tier => {
        const src = `./assets/slot_win_${tier}.mp3`;
        if (!winAudioCache[src]) {
          const a = new Audio(src);
          a.load();
          winAudioCache[src] = a;
        }
      });
      if (!casinoBgmAudio) {
        casinoBgmAudio = new Audio('./assets/casino_music.mp3');
        casinoBgmAudio.loop = true;
        casinoBgmAudio.load();
      }
    } catch (_) {}
  }

  function playSingleCherryChime() {
    if (isSoundMuted) return;
    initSlotAudio();
    if (!slotAudioCtx) return;
    try {
      const now = slotAudioCtx.currentTime;
      [659.25, 880.0].forEach((freq, i) => {
        const osc = slotAudioCtx.createOscillator();
        const gain = slotAudioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = now + i * 0.12;
        gain.gain.setValueAtTime(0.24, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(slotAudioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
      soundCoinClink();
    } catch (_) {}
  }

  function playTwoFruitsChime() {
    if (isSoundMuted) return;
    initSlotAudio();
    if (!slotAudioCtx) return;
    try {
      const now = slotAudioCtx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = slotAudioCtx.createOscillator();
        const gain = slotAudioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const t = now + i * 0.11;
        gain.gain.setValueAtTime(0.26, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(slotAudioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      });
      setTimeout(() => soundCoinClink(), 160);
    } catch (_) {}
  }

  function soundWin(multOrIsJackpot) {
    if (isSoundMuted) return;
    let mult = typeof multOrIsJackpot === 'number' ? multOrIsJackpot : (multOrIsJackpot ? 25 : 5);

    // 1 Cereza solitaria (1x)
    if (mult === 1) {
      playSingleCherryChime();
      return;
    }
    // 2 Frutas (2x)
    if (mult === 2) {
      playTwoFruitsChime();
      return;
    }

    // 3 Frutas o más (3x frutas en adelante)
    let tier = 1;
    if (mult >= 25) tier = 5;      // Mega Jackpot 777 (11.59s)
    else if (mult >= 15) tier = 4; // 3x Diamante (3.09s)
    else if (mult >= 10) tier = 3; // 3x Campana (2.96s)
    else if (mult >= 5) tier = 2;  // 3x BAR (2.47s)
    else tier = 1;                 // 3x Frutas (limón, naranja, uvas, cerezas) (1.71s)

    try {
      const src = `./assets/slot_win_${tier}.mp3`;
      if (!winAudioCache[src]) {
        winAudioCache[src] = new Audio(src);
      }
      const audio = winAudioCache[src];
      audio.currentTime = 0;
      audio.volume = 0.90;
      const p = audio.play();
      if (p !== undefined && typeof p.catch === 'function') {
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
    initSlotAudio();
    if (!casinoBgmAudio) {
      casinoBgmAudio = new Audio('./assets/casino_music.mp3');
      casinoBgmAudio.loop = true;
      casinoBgmAudio.addEventListener('ended', () => {
        if (window.isCasinoActive && casinoBgmAudio) {
          casinoBgmAudio.currentTime = 0;
          casinoBgmAudio.play().catch(() => {});
        }
      });
    }
    casinoBgmAudio.volume = 0.55;
    try {
      const p = casinoBgmAudio.play();
      if (p !== undefined && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('[Casino Audio] Autoplay bloqueado inicialmente, esperando interacción:', err);
          const modal = document.getElementById('granFortunaModal');
          if (modal) {
            const unlockHandler = () => {
              if (window.isCasinoActive && casinoBgmAudio) {
                casinoBgmAudio.play().catch(() => {});
              }
              modal.removeEventListener('click', unlockHandler);
              modal.removeEventListener('touchstart', unlockHandler);
            };
            modal.addEventListener('click', unlockHandler, { once: true });
            modal.addEventListener('touchstart', unlockHandler, { once: true });
          }
        });
      }
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
    { id: 'top_juanes_a_dios_le_pido', title: 'A Dios le pido', artist: 'Juanes', stars: 4.5, difficulty_name: 'Difícil', is_top_song: true },
    { id: 'top_luis_miguel_ahora_te_puedes_marchar', title: 'Ahora te puedes marchar', artist: 'Luis Miguel', stars: 4.0, difficulty_name: 'Media', is_top_song: true },
    { id: 'comm_camilo_sesto', title: '¿Quieres ser mi amante?', artist: 'Camilo Sesto', stars: 4.0, difficulty_name: 'Media', is_community: true, thumbnail: './covers/camilo_sesto.jpg' },
    { id: 'top_juan_gabriel_abrzame_muy_fuerte', title: 'Abrázame muy fuerte', artist: 'Juan Gabriel', stars: 4.5, difficulty_name: 'Difícil', is_top_song: true },
    { id: 'comm_renacer', title: 'Renacer', artist: 'Beatstar Official', stars: 5.0, difficulty_name: 'Difícil', is_community: true }
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
      let songs = [];
      if (window.TOP_SONGS_CATALOG && Array.isArray(window.TOP_SONGS_CATALOG) && window.TOP_SONGS_CATALOG.length > 0) {
        const c = window.TOP_SONGS_CATALOG;
        const now = new Date();
        const daySeed = now.getDate() + (now.getMonth() * 31);
        const idx1 = daySeed % c.length;
        const idx2 = (daySeed + 13) % c.length;
        const idx3 = (daySeed + 29) % c.length;
        songs = [c[idx1], c[idx2], c[idx3]].filter(Boolean).map(s => ({
          ...s,
          id: s.id.startsWith('top_') ? s.id : `top_${s.id}`,
          is_top_song: true,
          stars: s.stars || 4.0,
          cover_url: s.cover_url || s.thumbnail || './app_logo.png',
          thumbnail: s.cover_url || s.thumbnail || './app_logo.png'
        }));
      }
      if (songs.length > 0) {
        featuredSongsReelPool = songs;
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

        const isSpinAvailable = isFeaturedDailySpinAvailable();

        for (let s = 0; s < TOTAL_SONG_SLOTS; s++) {
          let angleDiff = (s * SONG_STEP - reel.angle) % (Math.PI * 2);
          if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          if (Math.abs(angleDiff) > Math.PI / 2.05) continue;

          const yPos = centerY + Math.sin(angleDiff) * radius;
          const scaleY = Math.max(0.18, Math.cos(angleDiff));
          const scaleX = 0.95 * Math.cos(angleDiff * 0.35);

          const cardW = reelWidth * 0.94 * scaleX;
          const cardH = 144 * scaleY;
          const isCentered = Math.abs(angleDiff) < 0.22 && !reel.isSpinning;

          ctxReels.save();
          ctxReels.translate(centerX, yPos);

          // Sombra de tarjeta
          ctxReels.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctxReels.beginPath();
          if (ctxReels.roundRect) ctxReels.roundRect(-cardW / 2 + 2, -cardH / 2 + 2, cardW, cardH, 8 * scaleY);
          else ctxReels.rect(-cardW / 2 + 2, -cardH / 2 + 2, cardW, cardH);
          ctxReels.fill();

          // Fondo pergamino dorado / marfil de la tarjeta
          const cardGrad = ctxReels.createLinearGradient(0, -cardH / 2, 0, cardH / 2);
          cardGrad.addColorStop(0.0, '#fffef8');
          cardGrad.addColorStop(0.35, '#fef6de');
          cardGrad.addColorStop(1.0, '#f9df94');
          ctxReels.fillStyle = cardGrad;
          ctxReels.beginPath();
          if (ctxReels.roundRect) ctxReels.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 8 * scaleY);
          else ctxReels.rect(-cardW / 2, -cardH / 2, cardW, cardH);
          ctxReels.fill();

          // Borde metálico biselado
          ctxReels.strokeStyle = isCentered ? '#d4af37' : 'rgba(120, 90, 50, 0.45)';
          ctxReels.lineWidth = isCentered ? 2.5 : 1.2;
          ctxReels.stroke();

          if (isSpinAvailable) {
            // ==========================================
            // TARJETA MISTERIOSA CON INTERROGANTE DE TINTA (ANTES DE GIRAR)
            // ==========================================
            // Borde interior de sello mecanográfico
            ctxReels.strokeStyle = 'rgba(74, 38, 14, 0.4)';
            ctxReels.lineWidth = 1;
            ctxReels.beginPath();
            if (ctxReels.roundRect) ctxReels.roundRect(-cardW / 2 + 4 * scaleX, -cardH / 2 + 4 * scaleY, cardW - 8 * scaleX, cardH - 8 * scaleY, 5 * scaleY);
            else ctxReels.rect(-cardW / 2 + 4 * scaleX, -cardH / 2 + 4 * scaleY, cardW - 8 * scaleX, cardH - 8 * scaleY);
            ctxReels.stroke();

            // Texto superior con sello de tinta
            ctxReels.fillStyle = '#78350f';
            ctxReels.font = `900 ${Math.max(7, Math.round(8.5 * scaleY))}px "Georgia", serif`;
            ctxReels.textAlign = 'center';
            ctxReels.textBaseline = 'middle';
            ctxReels.fillText('★ ¿DESTACADA? ★', 0, -cardH / 2 + 16 * scaleY);

            // Sello circular de tinta de agua
            const sealR = Math.min(cardW * 0.36, 32 * scaleY);
            ctxReels.strokeStyle = 'rgba(120, 53, 15, 0.35)';
            ctxReels.lineWidth = 1.5;
            ctxReels.beginPath();
            ctxReels.arc(0, 0, sealR, 0, Math.PI * 2);
            ctxReels.stroke();

            // GRAN SIGNO DE INTERROGACIÓN ESCRITO CON TINTA VINTAGE
            ctxReels.save();
            ctxReels.fillStyle = '#1c0f08';
            ctxReels.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctxReels.shadowBlur = 3;
            ctxReels.font = `bold ${Math.max(28, Math.round(52 * scaleY))}px "Georgia", "Times New Roman", serif`;
            ctxReels.textAlign = 'center';
            ctxReels.textBaseline = 'middle';
            ctxReels.fillText('?', 0, 1 * scaleY);
            ctxReels.restore();

            // Texto inferior con sello de recompensa
            ctxReels.fillStyle = '#b45309';
            ctxReels.font = `bold ${Math.max(7, Math.round(8.5 * scaleY))}px "Georgia", serif`;
            ctxReels.textAlign = 'center';
            ctxReels.textBaseline = 'middle';
            ctxReels.fillText('★ 2X CLAVES ★', 0, cardH / 2 - 16 * scaleY);

          } else {
            // ==========================================
            // TARJETA REVELADA (CANCIÓN DESTACADA CON BOTÓN [ ▶ JUGAR ])
            // ==========================================
            const songIdx = (s === 0) ? (i % poolLen) : ((s + i) % poolLen);
            const song = featuredSongsReelPool[songIdx] || { title: 'Canción', artist: 'Artista', stars: 3.5 };

            // 1. MINIATURA CUADRADA CON ESQUINAS REDONDEADAS
            const thumbSize = Math.min(cardW * 0.48, 34 * scaleY);
            const thumbY = -cardH / 2 + 7 * scaleY + thumbSize / 2;
            const coverSrc = song.cover_url || song.cover || song.album_art || song.image || './app_logo.png';
            const coverImg = getSongCoverImage(coverSrc);

            ctxReels.save();
            ctxReels.beginPath();
            if (ctxReels.roundRect) ctxReels.roundRect(-thumbSize / 2, thumbY - thumbSize / 2, thumbSize, thumbSize, 6 * scaleY);
            else ctxReels.rect(-thumbSize / 2, thumbY - thumbSize / 2, thumbSize, thumbSize);
            ctxReels.clip();

            if (coverImg && coverImg.complete && coverImg.naturalWidth > 0) {
              ctxReels.drawImage(coverImg, -thumbSize / 2, thumbY - thumbSize / 2, thumbSize, thumbSize);
            } else {
              const discGrad = ctxReels.createLinearGradient(-thumbSize / 2, thumbY - thumbSize / 2, thumbSize / 2, thumbY + thumbSize / 2);
              discGrad.addColorStop(0.0, '#2d1f12');
              discGrad.addColorStop(0.5, '#18120b');
              discGrad.addColorStop(1.0, '#0a0806');
              ctxReels.fillStyle = discGrad;
              ctxReels.fillRect(-thumbSize / 2, thumbY - thumbSize / 2, thumbSize, thumbSize);

              ctxReels.fillStyle = '#fbbf24';
              ctxReels.font = `bold ${Math.max(12, Math.round(15 * scaleY))}px sans-serif`;
              ctxReels.textAlign = 'center';
              ctxReels.textBaseline = 'middle';
              ctxReels.fillText('♫', 0, thumbY);
            }
            ctxReels.restore();

            // Marco dorado de la miniatura
            ctxReels.strokeStyle = '#d4af37';
            ctxReels.lineWidth = 1.4;
            ctxReels.beginPath();
            if (ctxReels.roundRect) ctxReels.roundRect(-thumbSize / 2, thumbY - thumbSize / 2, thumbSize, thumbSize, 6 * scaleY);
            else ctxReels.rect(-thumbSize / 2, thumbY - thumbSize / 2, thumbSize, thumbSize);
            ctxReels.stroke();

            // 2. INDICADOR DE ESTRELLAS Y RECOMPENSA (debajo de la miniatura)
            const starsVal = Number(song.stars || 3.5).toFixed(1);
            const starsTop = thumbY + thumbSize / 2 + 4 * scaleY;
            ctxReels.fillStyle = '#b45309';
            ctxReels.font = `bold ${Math.max(7, Math.round(8 * scaleY))}px sans-serif`;
            ctxReels.textAlign = 'center';
            ctxReels.textBaseline = 'top';
            ctxReels.fillText(`★ ${starsVal} • 2X CLAVES`, 0, starsTop);

            // 3. TÍTULO MULTILÍNEA
            const titleLines = wrapSongTitle(song.title, 13, 2);
            const titleLineH = Math.max(8.5, Math.round(10 * scaleY));
            const titleTop = starsTop + 10 * scaleY;

            ctxReels.fillStyle = '#140c04';
            ctxReels.font = `bold ${Math.max(7.5, Math.round(9 * scaleY))}px sans-serif`;
            ctxReels.textAlign = 'center';
            ctxReels.textBaseline = 'top';
            for (let l = 0; l < titleLines.length; l++) {
              ctxReels.fillText(titleLines[l], 0, titleTop + l * titleLineH);
            }

            // 4. ARTISTA
            const artistTop = titleTop + (titleLines.length * titleLineH) + 1.5 * scaleY;
            ctxReels.fillStyle = '#78552a';
            ctxReels.font = `normal ${Math.max(6, Math.round(7.5 * scaleY))}px sans-serif`;
            ctxReels.textAlign = 'center';
            ctxReels.textBaseline = 'top';
            const artistStr = (song.artist || 'Artista').slice(0, 15);
            ctxReels.fillText(artistStr, 0, artistTop);

            // 5. BOTÓN DIRECTO [ ▶ JUGAR ] ULTRA LUMINOSO, VERDE VIBRANTE Y 100% VISIBLE
            const btnW = Math.min(cardW * 0.88, 80 * scaleX);
            const btnH = Math.max(22, Math.round(24 * scaleY));
            const btnY = cardH / 2 - btnH / 2 - 8 * scaleY;

            ctxReels.save();
            const btnGrad = ctxReels.createLinearGradient(0, btnY - btnH / 2, 0, btnY + btnH / 2);
            btnGrad.addColorStop(0.0, '#22c55e');
            btnGrad.addColorStop(1.0, '#15803d');
            ctxReels.fillStyle = btnGrad;
            ctxReels.beginPath();
            if (ctxReels.roundRect) ctxReels.roundRect(-btnW / 2, btnY - btnH / 2, btnW, btnH, 6 * scaleY);
            else ctxReels.rect(-btnW / 2, btnY - btnH / 2, btnW, btnH);
            ctxReels.fill();

            // Borde blanco nítido
            ctxReels.strokeStyle = '#ffffff';
            ctxReels.lineWidth = 1.8;
            ctxReels.stroke();

            // Triángulo de Play blanco dibujado por código vectorial (nunca falla ni se borra)
            const triSize = Math.max(6, Math.round(7.5 * scaleY));
            const triX = -btnW / 2 + 15 * scaleX;
            ctxReels.fillStyle = '#ffffff';
            ctxReels.beginPath();
            ctxReels.moveTo(triX - triSize * 0.45, btnY - triSize * 0.55);
            ctxReels.lineTo(triX + triSize * 0.65, btnY);
            ctxReels.lineTo(triX - triSize * 0.45, btnY + triSize * 0.55);
            ctxReels.closePath();
            ctxReels.fill();

            // Texto blanco JUGAR con sombra negra
            ctxReels.fillStyle = '#ffffff';
            ctxReels.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctxReels.shadowBlur = 3;
            ctxReels.textAlign = 'center';
            ctxReels.textBaseline = 'middle';
            ctxReels.font = `bold ${Math.max(9.5, Math.round(11 * scaleY))}px sans-serif`;
            ctxReels.fillText('JUGAR', 5 * scaleX, btnY);
            ctxReels.restore();
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

      if (slotMachineMode === 'featured') {
        // En modo canciones destacadas CERO sombras oscuras para que el botón ▶ JUGAR brille con total claridad
      } else {
        ctxReels.fillStyle = cylinderGrad;
        ctxReels.fillRect(leftX, 0, reelWidth, canvasH);
      }

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

    try {
      const currentNow = now || performance.now();
      let anyReelSpinning = false;

      for (let i = 0; i < 3; i++) {
        const reel = reels[i];
        if (reel.isSpinning) {
          anyReelSpinning = true;
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

      if (anyReelSpinning) {
        requestAnimationFrame(loopReelPhysics);
      } else {
        isReelLoopActive = false;
      }
    } catch (_) {
      isReelLoopActive = false;
    }
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

  function isFeaturedDailySpinAvailable() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastSpin = localStorage.getItem('beatstar_last_featured_spin');
    return lastSpin !== todayStr;
  }
  function isFeaturedFreeSpinAvailable() {
    return isFeaturedDailySpinAvailable();
  }

  function getTimeUntilNextFreeSpin() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const diffMs = Math.max(0, tomorrow.getTime() - now.getTime());
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }

  function updateScoreboards() {
    const credEl = document.getElementById('creditsDisplay');
    const betEl = document.getElementById('betDisplay');
    const winEl = document.getElementById('winDisplay');
    const featCredEl = document.getElementById('featuredCreditsDisplay');
    const featCostEl = document.getElementById('featuredSpinCostDisplay');
    const featBtn = document.getElementById('featuredSpinBtn');
    const neonMain = document.getElementById('featuredNeonMainText');
    const neonSub = document.getElementById('featuredNeonSubText');

    const clefs = getPlayerClefs();
    if (credEl) credEl.textContent = String(clefs).padStart(4, '0');
    if (betEl) betEl.textContent = String(currentBet).padStart(4, '0');
    if (winEl) winEl.textContent = String(lastWin).padStart(4, '0');

    if (featCredEl) featCredEl.textContent = `${clefs.toLocaleString()} 𝄞`;
    const isSpinAvailable = isFeaturedDailySpinAvailable();
    if (featCostEl) featCostEl.textContent = isSpinAvailable ? 'GRATIS' : 'AGOTADA';

    if (isSpinAvailable) {
      if (neonMain) {
        neonMain.className = 'text-xs font-black uppercase tracking-widest text-emerald-300 animate-pulse drop-shadow-[0_0_10px_rgba(52,211,153,0.9)]';
        neonMain.textContent = '✨ ¡TIRADA DIARIA DISPONIBLE! ✨';
      }
      if (neonSub) {
        neonSub.innerHTML = '<span>Gira la máquina para descubrir las 3 canciones de hoy (2X Claves)</span>';
      }
      if (featBtn) {
        featBtn.textContent = '🎰 GIRAR TRAGAPERRAS (1 AL DÍA)';
        featBtn.disabled = false;
        featBtn.style.opacity = '1';
        featBtn.style.pointerEvents = 'auto';
        featBtn.className = 'flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-xs rounded-xl shadow-lg border border-emerald-300 active:scale-95 cursor-pointer text-center font-sans tracking-wide';
      }
    } else {
      const countdownStr = getTimeUntilNextFreeSpin();
      if (neonMain) {
        neonMain.className = 'text-xs font-black uppercase tracking-widest text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]';
        neonMain.textContent = '✨ TIRADA DIARIA COMPLETADA ✨';
      }
      if (neonSub) {
        neonSub.innerHTML = `<span>⏱️ Próxima tirada en: <strong class="font-mono text-amber-300">${countdownStr}</strong></span>`;
      }
      if (featBtn) {
        featBtn.textContent = `⏱️ VUELVE EN ${countdownStr}`;
        featBtn.disabled = true;
        featBtn.style.opacity = '0.6';
        featBtn.style.pointerEvents = 'none';
        featBtn.className = 'flex-1 py-2.5 px-3 bg-stone-800 text-stone-400 font-bold text-xs rounded-xl shadow border border-stone-600 text-center font-sans tracking-wide cursor-not-allowed';
      }
    }
  }

  function getSymbolIndices(symName) {
    const list = [];
    for (let i = 0; i < SYMBOL_LIST.length; i++) {
      if (SYMBOL_LIST[i] === symName) list.push(i);
    }
    return list;
  }

  function evaluateSymbols(s1, s2, s3) {
    if (s1 === 'seven' && s2 === 'seven' && s3 === 'seven') return { mult: 25, label: '3x SIETE ORO (JACKPOT)' };
    if (s1 === 'diamond' && s2 === 'diamond' && s3 === 'diamond') return { mult: 15, label: '3x DIAMANTE' };
    if (s1 === 'bell' && s2 === 'bell' && s3 === 'bell') return { mult: 10, label: '3x CAMPANA' };
    if (s1 === 'bar' && s2 === 'bar' && s3 === 'bar') return { mult: 6, label: '3x BAR' };
    if (s1 === 'cherry' && s2 === 'cherry' && s3 === 'cherry') return { mult: 4, label: '3x CEREZAS' };
    if (s1 === s2 && s2 === s3 && ['lemon', 'orange', 'grapes'].includes(s1)) return { mult: 3, label: `3x ${s1.toUpperCase()}` };
    const fruits = ['lemon', 'orange', 'grapes'];
    if ((s1 === s2 && fruits.includes(s1)) || (s2 === s3 && fruits.includes(s2)) || (s1 === s3 && fruits.includes(s1))) {
      return { mult: 2, label: '2x FRUTAS' };
    }
    if (s1 === 'cherry' || s2 === 'cherry' || s3 === 'cherry') return { mult: 1, label: '1x CEREZA' };
    return { mult: 0, label: '' };
  }

  function calculateOutcome() {
    // RTP Matemático EXACTO 100.0000% y alta frecuencia de aciertos (44.70% hit rate):
    // 0.004 * 25 = 0.1000 (3x 777 Jackpot)
    // 0.008 * 15 = 0.1200 (3x Diamante)
    // 0.010 * 10 = 0.1000 (3x Campana)
    // 0.015 * 6  = 0.0900 (3x BAR)
    // 0.020 * 4  = 0.0800 (3x Cerezas)
    // 0.030 * 3  = 0.0900 (3x Frutas: limón/naranja/uvas)
    // 0.060 * 2  = 0.1200 (2x Frutas)
    // 0.300 * 1  = 0.3000 (1x Cereza solitaria)
    // 0.553 * 0  = 0.0000 (Pérdida orgánica)
    // EV Total = 1.000000 (100.0000% exacto). P(Acierto) = 44.70%, P(Pérdida) = 55.30%
    const roll = Math.random();
    const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

    if (roll < 0.004) {
      const idxs = getSymbolIndices('seven');
      return { indices: [pickRandom(idxs), pickRandom(idxs), pickRandom(idxs)], mult: 25, label: '3x SIETE ORO (JACKPOT)' };
    } else if (roll < 0.012) {
      const idxs = getSymbolIndices('diamond');
      return { indices: [pickRandom(idxs), pickRandom(idxs), pickRandom(idxs)], mult: 15, label: '3x DIAMANTE' };
    } else if (roll < 0.022) {
      const idxs = getSymbolIndices('bell');
      return { indices: [pickRandom(idxs), pickRandom(idxs), pickRandom(idxs)], mult: 10, label: '3x CAMPANA' };
    } else if (roll < 0.037) {
      const idxs = getSymbolIndices('bar');
      return { indices: [pickRandom(idxs), pickRandom(idxs), pickRandom(idxs)], mult: 6, label: '3x BAR' };
    } else if (roll < 0.057) {
      const idxs = getSymbolIndices('cherry');
      return { indices: [pickRandom(idxs), pickRandom(idxs), pickRandom(idxs)], mult: 4, label: '3x CEREZAS' };
    } else if (roll < 0.087) {
      const fruit = pickRandom(['lemon', 'orange', 'grapes']);
      const idxs = getSymbolIndices(fruit);
      return { indices: [pickRandom(idxs), pickRandom(idxs), pickRandom(idxs)], mult: 3, label: `3x ${fruit.toUpperCase()}` };
    } else if (roll < 0.147) {
      // 2x Frutas: posición de par y tercer símbolo completamente aleatorios
      const fruit = pickRandom(['lemon', 'orange', 'grapes']);
      const fIdxs = getSymbolIndices(fruit);
      const otherSyms = ['bar', 'bell', 'diamond', 'seven', ...['lemon', 'orange', 'grapes'].filter(f => f !== fruit)];
      const otherIdxs = getSymbolIndices(pickRandom(otherSyms));
      const pairPositions = pickRandom([[0, 1, 2], [1, 2, 0], [0, 2, 1]]);
      const res = [0, 0, 0];
      res[pairPositions[0]] = pickRandom(fIdxs);
      res[pairPositions[1]] = pickRandom(fIdxs);
      res[pairPositions[2]] = pickRandom(otherIdxs);
      return { indices: res, mult: 2, label: `2x ${fruit.toUpperCase()}` };
    } else if (roll < 0.447) {
      // 1x Cereza: posición aleatoria (rodillo 0, 1 o 2) y acompañantes orgánicos sin patrones fijos
      const cIdxs = getSymbolIndices('cherry');
      const cherryPos = Math.floor(Math.random() * 3);
      const otherPositions = [0, 1, 2].filter(p => p !== cherryPos);
      const res = [0, 0, 0];
      res[cherryPos] = pickRandom(cIdxs);

      let attempts = 0;
      while (attempts++ < 50) {
        const nonC1 = pickRandom(SYMBOL_LIST.filter(s => s !== 'cherry'));
        const nonC2 = pickRandom(SYMBOL_LIST.filter(s => s !== 'cherry'));
        const isFruitPair = (nonC1 === nonC2) && ['lemon', 'orange', 'grapes'].includes(nonC1);
        if (!isFruitPair) {
          res[otherPositions[0]] = pickRandom(getSymbolIndices(nonC1));
          res[otherPositions[1]] = pickRandom(getSymbolIndices(nonC2));
          break;
        }
      }
      return { indices: res, mult: 1, label: '1x CEREZA' };
    } else {
      // Pérdida orgánica (55.3%): seleccionada dinámicamente de entre 1.452 combinaciones reales sin patrones fijos
      let attempts = 0;
      while (attempts++ < 100) {
        const i = Math.floor(Math.random() * SYMBOL_LIST.length);
        const j = Math.floor(Math.random() * SYMBOL_LIST.length);
        const k = Math.floor(Math.random() * SYMBOL_LIST.length);
        const evalRes = evaluateSymbols(SYMBOL_LIST[i], SYMBOL_LIST[j], SYMBOL_LIST[k]);
        if (evalRes.mult === 0) {
          return { indices: [i, j, k], mult: 0, label: '' };
        }
      }
      return { indices: [0, 1, 2], mult: 0, label: '' };
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
    } else if (slotMachineMode === 'featured') {
      if (!isFeaturedDailySpinAvailable()) {
        const countdownStr = getTimeUntilNextFreeSpin();
        if (statusMsg) statusMsg.textContent = `⏱️ ¡YA HAS TIRADO HOY! VUELVE EN ${countdownStr}`;
        soundReelTick();
        return;
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem('beatstar_last_featured_spin', todayStr);
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
        indices: [0, 0, 0],
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

    if (!isReelLoopActive) {
      isReelLoopActive = true;
      requestAnimationFrame(loopReelPhysics);
    }

    setTimeout(() => {
      isMachineActive = false;

      if (slotMachineMode === 'featured') {
        if (statusMsg) statusMsg.textContent = '★ ¡TOCA UNA CANCIÓN EN EL RODILLO PARA JUGAR! ★';
        soundWin(5); // Tier 2 win melody
        drawCylindricalReels();
        updateScoreboards();
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

    if (slotMachineMode === 'featured') {
      if (!isFeaturedDailySpinAvailable()) {
        const statusMsg = document.getElementById('statusMsg');
        if (statusMsg) statusMsg.textContent = `⏱️ ¡VUELVE MAÑANA! (${getTimeUntilNextFreeSpin()})`;
        soundReelTick();
        return;
      }
    }

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
  
  function renderSlotFeaturedCards() {
    const container = document.getElementById('slotFeaturedSongsCardsContainer');
    if (container) container.style.display = 'none';
  }

  function setSlotMode(mode) {
    slotMachineMode = mode === 'featured' ? 'featured' : 'bet';

    const modalRibbon = document.getElementById('slotRibbonText');
    const modePillText = document.getElementById('slotModePillText');
    const betControls = document.getElementById('slotBetControlsGroup');
    const maxBtn = document.getElementById('maxBetBtn');
    const featBtn = document.getElementById('featuredSpinBtn');
    const betMeters = document.getElementById('slotBetMetersRow');
    const featMeters = document.getElementById('slotFeaturedMetersRow');

    const glassOverlay = document.getElementById('slotGlassOverlay');
    const centerPayline = document.getElementById('slotCenterPayline');
    const cardsCont = document.getElementById('slotFeaturedSongsCardsContainer');
    if (cardsCont) cardsCont.style.display = 'none';

    if (slotMachineMode === 'featured') {
      if (modalRibbon) modalRibbon.textContent = 'CANCIONES DESTACADAS (CLAVES X2)';
      if (modePillText) modePillText.textContent = '★ CANCIONES DESTACADAS (CLAVES X2)';
      if (betControls) betControls.style.display = 'none';
      if (maxBtn) maxBtn.style.display = 'none';
      if (featBtn) featBtn.style.display = 'block';
      if (betMeters) betMeters.style.display = 'none';
      if (featMeters) featMeters.style.display = 'grid';

      // EN MODO CANCIONES DESTACADAS: Ocultar línea roja de pago y sombreado negro de cristal
      if (glassOverlay) glassOverlay.style.display = 'none';
      if (centerPayline) centerPayline.style.display = 'none';

      refreshFeaturedSongsPool().then(() => {
        reels.forEach(r => { r.angle = 0; r.isSpinning = false; });
        const statusMsg = document.getElementById('statusMsg');
        if (isFeaturedDailySpinAvailable()) {
          if (statusMsg) statusMsg.textContent = '★ ¡TIRA DE LA PALANCA O PULSA EL BOTÓN PARA REVELAR! ★';
        } else {
          if (statusMsg) statusMsg.textContent = '★ ¡TOCA UNA CANCIÓN EN EL RODILLO PARA JUGAR! ★';
        }
        drawCylindricalReels();
        updateScoreboards();
      });
    } else {
      if (modalRibbon) modalRibbon.textContent = 'LAS VEGAS 1977';
      if (modePillText) modePillText.textContent = '🎰 GRAN FORTUNA 1977';
      if (betControls) betControls.style.display = 'flex';
      if (maxBtn) maxBtn.style.display = 'block';
      if (featBtn) featBtn.style.display = 'none';
      if (betMeters) betMeters.style.display = 'grid';
      if (featMeters) featMeters.style.display = 'none';

      // EN MODO APOSTAR: Mostrar línea roja de pago y reflejo de cristal
      if (glassOverlay) glassOverlay.style.display = 'block';
      if (centerPayline) centerPayline.style.display = 'flex';

      drawCylindricalReels();
    }
    updateScoreboards();
  }

  async function triggerFeaturedDailySpin() {
    if (isMachineActive) return;
    if (!isFeaturedDailySpinAvailable()) {
      const statusMsg = document.getElementById('statusMsg');
      if (statusMsg) statusMsg.textContent = `⏱️ ¡YA HAS TIRADO HOY! (${getTimeUntilNextFreeSpin()})`;
      soundReelTick();
      return;
    }
    initSlotAudio();
    isMachineActive = true;
    const statusMsg = document.getElementById('statusMsg');
    if (statusMsg) statusMsg.textContent = '★ REVELANDO DESTACADAS DEL DÍA...';

    await refreshFeaturedSongsPool();
    const todayStr = new Date().toISOString().slice(0, 10);
    localStorage.setItem('beatstar_last_featured_spin', todayStr);

    const now = performance.now();
    const durations = [1800, 2300, 2800];
    const fullSpins = [4, 6, 8];

    for (let i = 0; i < 3; i++) {
      const reel = reels[i];
      reel.startTime = now;
      reel.duration = durations[i];
      reel.startAngle = reel.angle;
      reel.targetAngle = reel.startAngle + (fullSpins[i] * Math.PI * 2);
      reel.isSpinning = true;
    }

    if (!isReelLoopActive) {
      isReelLoopActive = true;
      requestAnimationFrame(loopReelPhysics);
    }

    setTimeout(() => {
      isMachineActive = false;
      reels.forEach(r => { r.angle = 0; r.isSpinning = false; });
      if (statusMsg) statusMsg.textContent = '★ ¡TOCA UNA CANCIÓN EN EL RODILLO PARA JUGAR (CLAVES X2)! ★';
      soundWin(5);
      drawCylindricalReels();
      updateScoreboards();
    }, 2850);
  }

  let slotCountdownTimerInterval = null;

  function openGranFortuna(mode = 'bet', fromLoading = false) {
    unlockAllSlotAudio();
    window.isSlotActiveDuringLoad = !!fromLoading;

    const btnReady = document.getElementById('btnSlotReadyNotification');
    if (btnReady) {
      if (!fromLoading) {
        btnReady.classList.add('hidden');
        btnReady.style.display = 'none';
        window.pendingGameToStart = null;
      }
    }

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

    if (!slotCountdownTimerInterval) {
      slotCountdownTimerInterval = setInterval(() => {
        if (slotMachineMode === 'featured' && modal && !modal.classList.contains('hidden')) {
          updateScoreboards();
        }
      }, 1000);
    }

    setTimeout(() => {
      resizeReelsCanvas();
      resizeCoinCanvas();
      updateScoreboards();
    }, 40);
  }

  function closeGranFortuna() {
    isReelLoopActive = false;
    if (slotCountdownTimerInterval) {
      clearInterval(slotCountdownTimerInterval);
      slotCountdownTimerInterval = null;
    }

    const modal = document.getElementById('granFortunaModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }

    const btnReady = document.getElementById('btnSlotReadyNotification');
    if (btnReady) {
      btnReady.classList.add('hidden');
      btnReady.style.display = 'none';
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
    isReelLoopActive = false;
    window.isCasinoActive = false;
    window.isSlotActiveDuringLoad = false;
    window.pendingGameToStart = null;
    window.currentFeaturedSongX2 = true;

    // Cerrar completamente el modal de la tragaperras y silenciar audio de casino
    const modal = document.getElementById('granFortunaModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    stopCasinoMusic();
    if (typeof window.pauseMenuAmbientMusic === 'function') {
      window.pauseMenuAmbientMusic();
    }

    console.log('[SlotMachine] Iniciando canción destacada x2 desde tragaperras:', songId);

    // 1. Si es canción Top (o empieza por top_), iniciar vía playTopSong
    const strId = String(songId);
    const isTop = strId.startsWith('top_') || (window.TOP_SONGS_CATALOG && window.TOP_SONGS_CATALOG.some(s => s.id === strId));
    if (isTop && typeof window.playTopSong === 'function') {
      window.playTopSong(songId);
      return;
    }

    // 2. Si es comunitaria o Camilo / Renacer
    if ((isCommunity || strId.startsWith('comm_')) && typeof window.playCommunitySong === 'function') {
      window.playCommunitySong(songId, true);
      return;
    }

    // 3. Fallbacks
    if (typeof window.playFeaturedSong === 'function') {
      window.playFeaturedSong(songId, true);
    } else if (typeof window.downloadAndPlaySong === 'function') {
      window.downloadAndPlaySong(songId, 'diff_standard', 'Normal');
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

    // Botón de tirada en modo canciones destacadas
    const featSpinBtn = document.getElementById('featuredSpinBtn');
    if (featSpinBtn) {
      featSpinBtn.addEventListener('click', () => {
        unlockAllSlotAudio();
        triggerSpin();
      });
    }

    // Clic directo en el tambor interactivo (Modo Canciones Destacadas)
    if (reelsCanvas) {
      reelsCanvas.addEventListener('click', (e) => {
        if (slotMachineMode !== 'featured' || isMachineActive) return;

        // Si la tirada del día aún no se ha realizado, pulsar en los tambores misteriosos inicia la tirada
        if (isFeaturedDailySpinAvailable()) {
          unlockAllSlotAudio();
          triggerSpin();
          return;
        }

        const rect = reelsCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const reelW = rect.width / 3;
        const reelIdx = Math.max(0, Math.min(2, Math.floor(clickX / reelW)));

        const poolLen = featuredSongsReelPool.length;
        const songIdx = reelIdx % poolLen;
        const song = featuredSongsReelPool[songIdx];

        if (song && song.id) {
          soundCoinClink();
          window.currentFeaturedSongX2 = true;
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

    ['click', 'touchstart', 'keydown'].forEach(evt => {
      document.addEventListener(evt, () => {
        initSlotAudio();
        if (window.isCasinoActive && casinoBgmAudio && casinoBgmAudio.paused && !isSoundMuted) {
          casinoBgmAudio.play().catch(() => {});
        }
      }, { passive: true });
    });

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
