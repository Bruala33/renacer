
    let engine = null;
    let currentActiveBeatmap = null;
    let currentActiveChartItem = null;
    let currentActiveAudioBlob = null;
    let toastTimeout = null;
    let currentActiveTab = 'search';
    let currentLibrarySubtab = 'downloads';
    let highscores = {};
    let searchResultsCache = [];
    let activeCountdownInterval = null;
    let songPendingAddToPlaylist = null;
    let favoriteIdsSet = new Set();

    const GENERIC_THUMBNAIL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 120' width='160' height='120'><defs><linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23140628'/><stop offset='50%' stop-color='%232c0c4a'/><stop offset='100%' stop-color='%235c1782'/></linearGradient></defs><rect width='160' height='120' fill='url(%23bg)'/><circle cx='80' cy='60' r='32' fill='%23000' opacity='0.5'/><circle cx='80' cy='60' r='14' fill='%23ff007f' opacity='0.9'/><circle cx='80' cy='60' r='4' fill='%23fff'/><path d='M75 44v22.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V51h14V44h-12z' fill='%2300f2fe'/></svg>";

    // Key FX Effects Catalog (Acoustic 3D & Pure Black Visual FX)
    const KEY_EFFECTS = [
      {
        id: 'royal_brass',
        name: 'Latón Real y Destello Áureo',
        nameKey: 'effect_royal_brass_name',
        desc: 'Chispas incandescentes de latón pulido y una majestuosa onda expansiva dorada.',
        descKey: 'effect_royal_brass_desc',
        costClefs: 0,
        costSilver: 0,
        costGold: 0,
        costPlatinum: 0,
        exclusive3D: true
      },
      {
        id: 'acoustic_resonance',
        name: 'Resonancia Acústica Armónica',
        nameKey: 'effect_acoustic_resonance_name',
        desc: 'Doble halo acústico de ondas armónicas que resuenan como cuerdas de piano.',
        descKey: 'effect_acoustic_resonance_desc',
        costClefs: 100,
        costSilver: 2,
        costGold: 1,
        costPlatinum: 0,
        exclusive3D: true
      },
      {
        id: 'crimson_royale',
        name: 'Fieltro Carmesí Real',
        nameKey: 'effect_crimson_royale_name',
        desc: 'Brasas de fieltro rojo carmesí y oro ascendentes inspiradas en apagadores de concierto.',
        descKey: 'effect_crimson_royale_desc',
        costClefs: 120,
        costSilver: 3,
        costGold: 2,
        costPlatinum: 1,
        exclusive3D: true
      },
      {
        id: 'luminous_ivory',
        name: 'Marfil Luminoso y Cénit',
        nameKey: 'effect_luminous_ivory_name',
        desc: 'Destello de marfil puro pulido con estallido radial celestial al pulsar.',
        descKey: 'effect_luminous_ivory_desc',
        costClefs: 150,
        costSilver: 4,
        costGold: 3,
        costPlatinum: 2,
        exclusive3D: true
      },
      {
        id: 'default_neon',
        name: 'Estándar Minimal',
        desc: 'Fondo negro puro con efectos táctiles limpios y máxima claridad visual.',
        costClefs: 0,
        costSilver: 0,
        costGold: 0,
        costPlatinum: 0
      },
      {
        id: 'paint_splash',
        name: 'Chorros de Pintura Neón',
        desc: 'Dispara una ráfaga radial de gotas y salpicaduras de pintura multicolor (magenta, cian, lima y amarillo) de rápida disipación.',
        costClefs: 100,
        costSilver: 3,
        costGold: 2,
        costPlatinum: 1
      },
      {
        id: 'fire_inferno',
        name: 'Modo Fuego e Infierno',
        desc: 'Llamaradas y chispas ardientes ascendentes con resplandor ígneo en los bordes, manteniendo 100% de visibilidad.',
        costClefs: 100,
        costSilver: 3,
        costGold: 2,
        costPlatinum: 1
      },
      {
        id: 'color_burst',
        name: 'Explosiones de Color Neón',
        desc: 'Ondas expansivas y explosiones de nebulosa en el fondo al pulsar cada tecla, sin tapar las notas.',
        costClefs: 100,
        costSilver: 3,
        costGold: 2,
        costPlatinum: 1
      },
      {
        id: 'full_focus_base',
        name: 'Full Focus',
        desc: 'Destello ambiental perimetral en los bordes de la pantalla con el color del juicio obtenido. Inmersivo y limpio.',
        costClefs: 100,
        costSilver: 3,
        costGold: 2,
        costPlatinum: 1
      },
      {
        id: 'full_focus_fireworks',
        name: 'Full Focus: Fuegos Artificiales',
        desc: 'Detonación de chispas tipo fuegos artificiales con física de gravedad adaptada al color de la puntuación.',
        costClefs: 120,
        costSilver: 3,
        costGold: 2,
        costPlatinum: 1
      },
      {
        id: 'full_focus_electric',
        name: 'Full Focus: Aros Eléctricos',
        desc: 'Ondas radiales de energía eléctrica expansiva ultrarrápida del color del impacto desde la línea de pulsación.',
        costClefs: 120,
        costSilver: 3,
        costGold: 2,
        costPlatinum: 1
      }
    ];

    let unlockedEffects = JSON.parse(localStorage.getItem('beatstar_unlocked_effects') || '["default_neon", "royal_brass"]');
    unlockedEffects = unlockedEffects.filter(e => e !== 'spotlight_reveal');
    if (!unlockedEffects.includes('royal_brass')) unlockedEffects.push('royal_brass');
    let activeEffectId = localStorage.getItem('beatstar_active_effect') || 'royal_brass';
    if (activeEffectId === 'spotlight_reveal') {
      activeEffectId = 'royal_brass';
      localStorage.setItem('beatstar_active_effect', 'royal_brass');
    }

    // Player Currency & Medals State (defaults 0 for new users, persists for returning users)
    let userClefs = parseInt(localStorage.getItem('game_claves_de_sol') ?? localStorage.getItem('beatstar_clefs') ?? '0', 10);
    if (isNaN(userClefs)) userClefs = 0;

    let userSilvers = parseInt(localStorage.getItem('game_platas') ?? localStorage.getItem('beatstar_silvers') ?? '0', 10);
    if (isNaN(userSilvers)) userSilvers = 0;
    let userGolds = parseInt(localStorage.getItem('game_oros') ?? localStorage.getItem('beatstar_golds') ?? '0', 10);
    if (isNaN(userGolds)) userGolds = 0;
    let userPlatinums = parseInt(localStorage.getItem('game_diamantes') ?? localStorage.getItem('beatstar_platinums') ?? '0', 10);
    if (isNaN(userPlatinums)) userPlatinums = 0;

    let currentPenaltyCost = 1;
    let shopDemoAnimId = null;

    function updateUserWalletDisplay() {
      const mainClef = document.getElementById('mainClefCount');
      const hudClef = document.getElementById('hudClefCount');
      const shopClef = document.getElementById('shopClefsDisplay');
      const shopSilv = document.getElementById('shopSilversDisplay');
      const shopGold = document.getElementById('shopGoldsDisplay');
      const shopPlat = document.getElementById('shopPlatinumsDisplay');

      if (mainClef) mainClef.innerText = userClefs.toLocaleString();
      if (hudClef) hudClef.innerText = userClefs.toLocaleString();
      if (shopClef) shopClef.innerText = userClefs.toLocaleString();
      if (shopSilv) shopSilv.innerText = userSilvers.toLocaleString();
      if (shopGold) shopGold.innerText = userGolds.toLocaleString();
      if (shopPlat) shopPlat.innerText = userPlatinums.toLocaleString();

      // Persist to canonical keys (new) and legacy keys (for backwards-compat)
      localStorage.setItem('game_claves_de_sol', userClefs.toString());
      localStorage.setItem('game_platas', userSilvers.toString());
      localStorage.setItem('game_oros', userGolds.toString());
      localStorage.setItem('game_diamantes', userPlatinums.toString());
      localStorage.setItem('beatstar_clefs', userClefs.toString());
      localStorage.setItem('beatstar_silvers', userSilvers.toString());
      localStorage.setItem('beatstar_golds', userGolds.toString());
      localStorage.setItem('beatstar_platinums', userPlatinums.toString());
    }

    function addClefs(amount) {
      userClefs += amount;
      updateUserWalletDisplay();
    }

    function addMedals(silvers = 0, golds = 0, platinums = 0) {
      userSilvers += silvers;
      userGolds += golds;
      userPlatinums += platinums;
      updateUserWalletDisplay();
    }

    function deductClefs(amount) {
      if (userClefs < amount) return false;
      userClefs -= amount;
      updateUserWalletDisplay();
      return true;
    }

    function loadHighscores() {
      try {
        highscores = JSON.parse(localStorage.getItem('beatstar_highscores') || '{}');
      } catch (e) {
        highscores = {};
      }
    }

    async function loadFavoritesSet() {
      try {
        const favs = await IndexedDBStorage.getAllFavorites();
        favoriteIdsSet = new Set(favs.map(f => f.id));
      } catch (e) {
        favoriteIdsSet = new Set();
      }
    }

    function saveHighscore(songId, score, stars, maxCombo, medalTier = null, accuracyPct = 0) {
      const current = highscores[songId];
      let isNewRecord = false;
      if (!current || score > current.score) {
        highscores[songId] = { score, stars, maxCombo, medalTier, accuracyPct };
        localStorage.setItem('beatstar_highscores', JSON.stringify(highscores));
        isNewRecord = true;
      }

      // Enviar record a la clasificacion online si hay servidor configurado
      try {
        const baseUrl = getApiBaseUrl();
        if (baseUrl) {
          const playerName = localStorage.getItem('beatstar_player_nickname') || 'Jugador';
          fetch(`${baseUrl}/api/v1/community/charts/${encodeURIComponent(songId)}/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              player_name: playerName,
              score: score,
              max_combo: maxCombo,
              stars: stars,
              accuracy_pct: accuracyPct,
              medal_tier: medalTier
            })
          }).catch(() => {});
        }
      } catch (e) {}

      return isNewRecord;
    }

    // Modal Control Functions
    window.openSettingsModal = function() {
      const modal = document.getElementById('settingsModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
      }
      syncVolumeUI();
      // Sync color pickers with current judgeColors
      const jc = engine && engine.judgeColors ? engine.judgeColors : {};
      const savedJC = (() => { try { return JSON.parse(localStorage.getItem('beatstar_judge_colors') || 'null'); } catch(e) { return null; } })() || {};
      const defaults = { perfectPlus: '#ffffff', perfect: '#e5b869', great: '#e08238', good: '#9e7b66' };
      const colors = Object.assign({}, defaults, savedJC);
      const pp = document.getElementById('colorPerfectPlus'); if (pp) pp.value = colors.perfectPlus;
      const pf = document.getElementById('colorPerfect');     if (pf) pf.value = colors.perfect;
      const gr = document.getElementById('colorGreat');       if (gr) gr.value = colors.great;
      const go = document.getElementById('colorGood');        if (go) go.value = colors.good;
      if (typeof syncPCKeybindsUI === 'function') syncPCKeybindsUI();
    };

    window.syncVolumeUI = function() {
      const vol = parseFloat(localStorage.getItem('beatstar_master_volume') ?? '1.0');
      const isMuted = localStorage.getItem('beatstar_master_muted') === 'true';
      const slider = document.getElementById('settingsVolumeSlider');
      const valDisplay = document.getElementById('settingsVolumeVal');
      const muteBtn = document.getElementById('btnMuteToggle');
      const muteText = document.getElementById('muteToggleText');
      if (slider) slider.value = isNaN(vol) ? 1.0 : vol;
      if (valDisplay) valDisplay.innerText = isMuted ? 'Silenciado' : `${Math.round((isNaN(vol) ? 1.0 : vol) * 100)}%`;
      if (muteText) muteText.innerText = isMuted ? 'Activar Sonido' : 'Silenciar';
      if (muteBtn) {
        if (isMuted) {
          muteBtn.className = 'px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-500/40 bg-red-500/20 text-red-300 transition flex items-center gap-1 cursor-pointer flex-shrink-0';
        } else {
          muteBtn.className = 'px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/15 bg-white/10 hover:bg-white/20 text-gray-200 transition flex items-center gap-1 cursor-pointer flex-shrink-0';
        }
      }
    };

    window.setGameMasterVolume = function(val) {
      const v = Math.max(0, Math.min(1, parseFloat(val) || 0));
      localStorage.setItem('beatstar_master_volume', v.toString());
      if (typeof updateMenuAudioVolume === 'function') updateMenuAudioVolume();
      syncVolumeUI();
    };

    window.toggleGameMasterMute = function() {
      const currentMuted = localStorage.getItem('beatstar_master_muted') === 'true';
      const newMuted = !currentMuted;
      localStorage.setItem('beatstar_master_muted', newMuted.toString());
      if (typeof updateMenuAudioVolume === 'function') updateMenuAudioVolume();
      syncVolumeUI();
      if (newMuted) {
        showSuccessToast('Música del menú silenciada');
      } else {
        showSuccessToast('Música del menú activada');
      }
    };

    window.applyJudgeColor = function(grade, hex) {
      if (engine && engine.setJudgeColors) engine.setJudgeColors({ [grade]: hex });
      else {
        const saved = (() => { try { return JSON.parse(localStorage.getItem('beatstar_judge_colors') || '{}'); } catch(e) { return {}; } })();
        saved[grade] = hex;
        localStorage.setItem('beatstar_judge_colors', JSON.stringify(saved));
      }
    };

    window.resetJudgeColors = function() {
      const defaults = { perfectPlus: '#ffffff', perfect: '#e5b869', great: '#e08238', good: '#9e7b66' };
      if (engine && engine.setJudgeColors) engine.setJudgeColors(defaults);
      localStorage.setItem('beatstar_judge_colors', JSON.stringify(defaults));
      const pp = document.getElementById('colorPerfectPlus'); if (pp) pp.value = defaults.perfectPlus;
      const pf = document.getElementById('colorPerfect');     if (pf) pf.value = defaults.perfect;
      const gr = document.getElementById('colorGreat');       if (gr) gr.value = defaults.great;
      const go = document.getElementById('colorGood');        if (go) go.value = defaults.good;
      showSuccessToast('Colores nobles de juicio restaurados.');
    };

    window.closeSettingsModal = function() {
      const modal = document.getElementById('settingsModal');
      if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
      }
    };


    window.openFXShopModal = function() {
      updateUserWalletDisplay();
      renderFXShopItems();
      const modal = document.getElementById('fxShopModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
      }
      startShopDemoLoop();
    };

    window.closeFXShopModal = function() {
      stopShopDemoLoop();
      const modal = document.getElementById('fxShopModal');
      if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
      }
    };

    window.applyVisualDimensionTheme = function(dim) {
      const mode = dim || localStorage.getItem('beatstar_visual_dimension') || '3d';
      localStorage.setItem('beatstar_visual_dimension', mode);
      const is3D = (mode === '3d');
      
      const docEl = document.documentElement;
      const bodyEl = document.body;

      if (is3D) {
        docEl.classList.add('theme-vintage-3d');
        bodyEl.classList.add('theme-vintage-3d');
        docEl.classList.remove('theme-neon-2d');
        bodyEl.classList.remove('theme-neon-2d');
      } else {
        docEl.classList.add('theme-neon-2d');
        bodyEl.classList.add('theme-neon-2d');
        docEl.classList.remove('theme-vintage-3d');
        bodyEl.classList.remove('theme-vintage-3d');
      }

      const activeEngine = (typeof engine !== 'undefined' && engine) || window.engine;
      if (activeEngine && typeof activeEngine.setVisualDimension === 'function') {
        activeEngine.setVisualDimension(mode);
      }
    };

    window.setVisualDimensionMode = function(dim) {
      localStorage.setItem('beatstar_visual_dimension', dim);
      applyVisualDimensionTheme(dim);
      const activeEngine = (typeof engine !== 'undefined' && engine) || window.engine;
      if (activeEngine && typeof activeEngine.setVisualDimension === 'function') {
        activeEngine.setVisualDimension(dim);
      }
      renderFXShopItems();
      showSuccessToast(dim === '3d' ? t('toast_3d_mode', 'Modo 3D Gran Piano activado.') : t('toast_2d_mode', 'Modo 2D Neón Clásico activado.'));
    };

    window.setPianoKeyStyle = function(style) {
      localStorage.setItem('beatstar_key_style', style);
      const activeEngine = (typeof engine !== 'undefined' && engine) || window.engine;
      if (activeEngine && typeof activeEngine.setKeyStyle === 'function') {
        activeEngine.setKeyStyle(style);
      }
      renderFXShopItems();
      showSuccessToast(style === 'beatstar_large' ? t('toast_keys_large', 'Teclas grandes tradicionales activadas.') : t('toast_keys_compact', 'Teclas compactas activadas.'));
    };

    function renderFXShopItems() {
      const container = document.getElementById('fxShopCardsContainer');
      if (!container) return;

      const currentDim = localStorage.getItem('beatstar_visual_dimension') || '3d';
      const is3D = currentDim === '3d';
      const currentKeyStyle = localStorage.getItem('beatstar_key_style') || 'beatstar_large';
      const isLargeKeys = currentKeyStyle === 'beatstar_large';

      // 1. Dimensión Visual (Primera opción de la tienda de efectos)
      const dimensionCardHtml = `
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#18121f] to-amber-900/10 border border-amber-500/35 space-y-2.5 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-300"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>
              <div>
                <p class="text-xs font-black text-amber-200 uppercase tracking-wide font-serif">${t('shop_dimension_title', 'Dimensión Visual del Juego')}</p>
                <p class="text-[10px] text-gray-300 leading-tight mt-0.5">${t('shop_dimension_desc', 'Elige entre la perspectiva pseudo-3D gran piano y el clásico neón 2D plano.')}</p>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-0.5">
            <button onclick="setVisualDimensionMode('3d')" class="py-2.5 px-2 rounded-xl text-xs font-black transition flex flex-col items-center gap-1 cursor-pointer border ${is3D ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-lg shadow-amber-500/25' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 4v9"/><path d="M10 4v9"/><path d="M14 4v9"/><path d="M18 4v9"/></svg>
              <span class="font-serif font-bold text-center">${t('shop_mode_3d', '3D Gran Piano')}</span>
              <span class="text-[8px] font-black text-amber-400/90 tracking-tight">${t('shop_mode_3d_tag', '★ RECOMENDADO')}</span>
            </button>
            <button onclick="setVisualDimensionMode('2d')" class="py-2.5 px-2 rounded-xl text-xs font-black transition flex flex-col items-center gap-1 cursor-pointer border ${!is3D ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-lg shadow-cyan-500/25' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span class="font-bold text-center">${t('shop_mode_2d', '2D Neón Clásico')}</span>
              <span class="text-[8px] font-black text-cyan-400/90 tracking-tight">${t('shop_mode_2d_tag', 'VERSIÓN ANTERIOR')}</span>
            </button>
          </div>
        </div>
      `;

      // 2. Estilo de Teclas de Piano (Beatstar Grandes vs Compactas)
      const keyStyleCardHtml = `
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-[#140f1a] to-white/5 border border-white/15 space-y-2.5 shadow-md">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 4v9"/><path d="M10 4v9"/><path d="M14 4v9"/><path d="M18 4v9"/></svg>
              <div>
                <p class="text-xs font-black text-white uppercase tracking-wide">${t('shop_keystyle_title', 'Estilo de Teclas de Piano')}</p>
                <p class="text-[10px] text-gray-300 leading-tight mt-0.5">${t('shop_keystyle_desc', 'Forma y tamaño de las teclas en pista (aplica en 2D y 3D).')}</p>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-0.5">
            <button onclick="setPianoKeyStyle('beatstar_large')" class="py-2.5 px-2 rounded-xl text-xs font-black transition flex flex-col items-center gap-1 cursor-pointer border ${isLargeKeys ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-lg shadow-amber-500/25' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              <span class="font-serif font-bold text-center">${t('shop_keys_beatstar', 'Teclas Grandes')}</span>
              <span class="text-[8px] font-black text-amber-400/90 tracking-tight">${t('shop_keys_beatstar_tag', 'ANCHO COMPLETO')}</span>
            </button>
            <button onclick="setPianoKeyStyle('compact')" class="py-2.5 px-2 rounded-xl text-xs font-black transition flex flex-col items-center gap-1 cursor-pointer border ${!isLargeKeys ? 'bg-purple-500/25 text-purple-300 border-purple-400 shadow-lg shadow-purple-500/25' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 4v9"/><path d="M10 4v9"/><path d="M14 4v9"/><path d="M18 4v9"/></svg>
              <span class="font-bold text-center">${t('shop_keys_compact', 'Teclas Compactas')}</span>
              <span class="text-[8px] font-black text-gray-400 tracking-tight">${t('shop_keys_compact_tag', 'ORIGINALES')}</span>
            </button>
          </div>
        </div>
      `;

      // 3. Catálogo de Efectos de Impacto
      const effectsHeaderHtml = `
        <div class="pt-2 flex items-center justify-between">
          <p class="text-[11px] font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5 font-serif">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline text-amber-300"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg> ${t('shop_effects_header', 'Efectos de Impacto y Luces')}
          </p>
          <span class="text-[9px] text-gray-400 font-mono">${KEY_EFFECTS.length} estilos</span>
        </div>
      `;

      const effectsCardsHtml = KEY_EFFECTS.map(effect => {
        const isUnlocked = unlockedEffects.includes(effect.id);
        const isActive = activeEffectId === effect.id;
        const effectName = effect.nameKey ? t(effect.nameKey, effect.name) : effect.name;
        const effectDesc = effect.descKey ? t(effect.descKey, effect.desc) : effect.desc;

        let actionBtnHtml = '';
        if (isActive) {
          actionBtnHtml = `
            <button disabled class="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40 opacity-90 cursor-default flex items-center gap-1">
              <span>✓</span> Equipado
            </button>
          `;
        } else if (isUnlocked) {
          actionBtnHtml = `
            <button onclick="equipKeyEffect('${effect.id}')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-black font-black text-xs transition active:scale-95 cursor-pointer shadow-md shadow-amber-500/25">
              Equipar
            </button>
          `;
        } else {
          actionBtnHtml = `
            <button onclick="buyKeyEffect('${effect.id}')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-black font-black text-xs transition active:scale-95 cursor-pointer shadow-md shadow-amber-500/30 flex items-center gap-1">
              <span>Comprar</span>
            </button>
          `;
        }

        const priceBadgeHtml = (!isUnlocked && effect.costClefs > 0) ? `
          <div class="flex items-center gap-1 flex-wrap pt-0.5">
            <span class="price-pill text-amber-300 border-amber-400/30">${effect.costClefs} 𝄞</span>
            <span class="price-pill text-gray-300 border-white/20 flex items-center gap-0.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="#cbd5e1" stroke="#cbd5e1" stroke-width="1.5" class="inline"><circle cx="12" cy="12" r="7"/></svg> ${effect.costSilver}</span>
            <span class="price-pill text-amber-300 border-amber-400/30 flex items-center gap-0.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="#fcd34d" stroke="#fcd34d" stroke-width="1.5" class="inline"><circle cx="12" cy="12" r="7"/></svg> ${effect.costGold}</span>
            <span class="price-pill text-cyan-300 border-cyan-400/30 flex items-center gap-0.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" stroke-width="2" class="inline"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/></svg> ${effect.costPlatinum}</span>
          </div>
        ` : (isUnlocked ? '<span class="text-[9px] font-bold text-emerald-400">✓ Desbloqueado</span>' : '<span class="text-[9px] font-bold text-gray-400">Gratuito</span>');

        const exclusiveTagHtml = effect.exclusive3D ? `
          <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/35 text-[8px] font-black tracking-wider uppercase">${t('shop_exclusive_3d', 'EXCLUSIVO 3D')}</span>
        ` : '';

        return `
          <div class="fx-shop-card ${isActive ? 'active-theme' : ''}">
            <div class="space-y-2">
              <div>
                <div class="flex items-center justify-between gap-1 flex-wrap">
                  <p class="text-xs font-black text-white flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline text-amber-300 mr-1"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>${effectName}
                  </p>
                  <div class="flex items-center gap-1">
                    ${exclusiveTagHtml}
                    ${isActive ? '<span class="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 text-[9px] font-black border border-amber-400/40">EQUIPADO</span>' : ''}
                  </div>
                </div>
                <p class="text-[10px] text-gray-300 leading-tight mt-1">${effectDesc}</p>
              </div>
              
              <div class="flex items-center justify-between pt-1.5 border-t border-white/10 gap-2">
                <div class="flex-1">
                  ${priceBadgeHtml}
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <button onclick="launchEffectDemo('${effect.id}')" class="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-black text-xs border border-cyan-400/40 transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm shadow-cyan-500/20">
                    <span>▶</span> Probar
                  </button>
                  ${actionBtnHtml}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = dimensionCardHtml + keyStyleCardHtml + effectsHeaderHtml + effectsCardsHtml;
    }

    window.switchFXShopSubtab = function(tab) {
      const btnEffects = document.getElementById('tabBtnShopEffects');
      const btnBg = document.getElementById('tabBtnShopBackground');
      const contentEffects = document.getElementById('shopEffectsSubtabContent');
      const contentBg = document.getElementById('shopBackgroundSubtabContent');

      if (tab === 'background') {
        if (btnEffects) {
          btnEffects.className = 'flex-1 py-1.5 rounded-lg transition text-center cursor-pointer text-gray-400 hover:text-white border border-transparent';
        }
        if (btnBg) {
          btnBg.className = 'flex-1 py-1.5 rounded-lg transition text-center cursor-pointer bg-pink-500/30 text-pink-300 border border-pink-400/40';
        }
        if (contentEffects) contentEffects.classList.add('hidden');
        if (contentBg) {
          contentBg.classList.remove('hidden');
          renderFXShopBackgroundPanel();
        }
      } else {
        if (btnEffects) {
          btnEffects.className = 'flex-1 py-1.5 rounded-lg transition text-center cursor-pointer bg-pink-500/30 text-pink-300 border border-pink-400/40';
        }
        if (btnBg) {
          btnBg.className = 'flex-1 py-1.5 rounded-lg transition text-center cursor-pointer text-gray-400 hover:text-white border border-transparent';
        }
        if (contentBg) contentBg.classList.add('hidden');
        if (contentEffects) contentEffects.classList.remove('hidden');
        renderFXShopItems();
      }
    };

    window.customBgMediaBlobUrl = null;
    window.customBgMediaType = null;

    window.setGameBgFit = function(fit) {
      localStorage.setItem('beatstar_bg_fit', fit);
      if (engine && engine.setCustomBgTransform) {
        engine.setCustomBgTransform(
          parseFloat(localStorage.getItem('beatstar_bg_crop_x') || '0.5'),
          parseFloat(localStorage.getItem('beatstar_bg_crop_y') || '0.5'),
          parseFloat(localStorage.getItem('beatstar_bg_crop_zoom') || '1.0'),
          fit
        );
      }
      renderFXShopBackgroundPanel();
      showSuccessToast(fit === 'contain' ? 'Ajuste: Imagen/Vídeo completo' : 'Ajuste: Cubrir toda la pantalla');
    };

    window.updateGameBgCrop = function(cropX, cropY, zoom) {
      const curFit = localStorage.getItem('beatstar_bg_fit') || 'cover';
      const x = cropX !== undefined ? parseFloat(cropX) : parseFloat(localStorage.getItem('beatstar_bg_crop_x') || '0.5');
      const y = cropY !== undefined ? parseFloat(cropY) : parseFloat(localStorage.getItem('beatstar_bg_crop_y') || '0.5');
      const z = zoom !== undefined ? parseFloat(zoom) : parseFloat(localStorage.getItem('beatstar_bg_crop_zoom') || '1.0');

      localStorage.setItem('beatstar_bg_crop_x', x.toString());
      localStorage.setItem('beatstar_bg_crop_y', y.toString());
      localStorage.setItem('beatstar_bg_crop_zoom', z.toString());

      if (engine && engine.setCustomBgTransform) {
        engine.setCustomBgTransform(x, y, z, curFit);
      }

      const zoomTxt = document.getElementById('bgZoomValueText');
      if (zoomTxt) zoomTxt.innerText = Math.round(z * 100) + '%';
      const prevMedia = document.getElementById('shopBgPreviewMedia');
      if (prevMedia) {
        prevMedia.style.objectPosition = `${Math.round(x * 100)}% ${Math.round(y * 100)}%`;
        prevMedia.style.transform = `scale(${z})`;
      }
    };

    window.resetGameBgCrop = function() {
      window.updateGameBgCrop(0.5, 0.5, 1.0);
      const slX = document.getElementById('bgCropXSlider'); if (slX) slX.value = 50;
      const slY = document.getElementById('bgCropYSlider'); if (slY) slY.value = 50;
      const slZ = document.getElementById('bgZoomSlider'); if (slZ) slZ.value = 100;
      showSuccessToast('Encuadre centrado al 100%.');
    };

    window.initShopBgPreviewDrag = function(previewEl) {
      if (!previewEl || previewEl._dragInitialized) return;
      previewEl._dragInitialized = true;
      let isDragging = false;
      let startX = 0, startY = 0;
      let startCropX = 0.5, startCropY = 0.5;

      const onStart = (clientX, clientY) => {
        isDragging = true;
        startX = clientX;
        startY = clientY;
        startCropX = parseFloat(localStorage.getItem('beatstar_bg_crop_x') || '0.5');
        startCropY = parseFloat(localStorage.getItem('beatstar_bg_crop_y') || '0.5');
      };

      const onMove = (clientX, clientY) => {
        if (!isDragging) return;
        const rect = previewEl.getBoundingClientRect();
        const deltaX = (startX - clientX) / (rect.width || 150);
        const deltaY = (startY - clientY) / (rect.height || 260);
        const newX = Math.max(0, Math.min(1, startCropX + deltaX));
        const newY = Math.max(0, Math.min(1, startCropY + deltaY));
        window.updateGameBgCrop(newX, newY, undefined);
        const slX = document.getElementById('bgCropXSlider'); if (slX) slX.value = Math.round(newX * 100);
        const slY = document.getElementById('bgCropYSlider'); if (slY) slY.value = Math.round(newY * 100);
      };

      const onEnd = () => { isDragging = false; };

      previewEl.addEventListener('mousedown', e => { e.preventDefault(); onStart(e.clientX, e.clientY); });
      window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
      window.addEventListener('mouseup', onEnd);

      previewEl.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
          onStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
      window.addEventListener('touchmove', e => {
        if (isDragging && e.touches.length === 1) {
          if (e.cancelable) e.preventDefault();
          onMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: false });
      window.addEventListener('touchend', onEnd);
      window.addEventListener('touchcancel', onEnd);
    };

    window.renderFXShopBackgroundPanel = function() {
      const container = document.getElementById('customBgControlsContainer');
      if (!container) return;

      const currentMode = localStorage.getItem('beatstar_bg_mode') || 'black';
      const currentOpacity = parseFloat(localStorage.getItem('beatstar_bg_opacity') || '0.40') || 0.40;
      const currentFit = localStorage.getItem('beatstar_bg_fit') || 'cover';
      const currentCropX = parseFloat(localStorage.getItem('beatstar_bg_crop_x') || '0.5');
      const currentCropY = parseFloat(localStorage.getItem('beatstar_bg_crop_y') || '0.5');
      const currentZoom = parseFloat(localStorage.getItem('beatstar_bg_crop_zoom') || '1.0');

      const mediaUrl = window.customBgMediaBlobUrl || localStorage.getItem('beatstar_custom_bg_data') || './preview.png';
      const isVideo = window.customBgMediaType === 'video' || (typeof mediaUrl === 'string' && (mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.startsWith('data:video')));

      container.innerHTML = `
        <!-- Vista previa interactiva del fondo (Encuadre exacto vertical 9:16 de pantalla de móvil) -->
        <div class="flex flex-col items-center justify-center py-1">
          <div id="shopBgPreviewFrame" class="relative w-36 max-w-[155px] rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl bg-black flex items-center justify-center select-none cursor-grab active:cursor-grabbing ring-4 ring-black/50" style="aspect-ratio: 9 / 16;">
            ${isVideo ? `
              <video id="shopBgPreviewMedia" src="${mediaUrl}" autoplay muted loop playsinline class="absolute inset-0 w-full h-full transition-all duration-75 pointer-events-none" style="object-fit: ${currentFit}; object-position: ${Math.round(currentCropX * 100)}% ${Math.round(currentCropY * 100)}%; transform: scale(${currentZoom}); opacity: ${currentMode === 'black' ? 0.05 : (currentMode === 'reactive' ? 0.75 : currentOpacity)};"></video>
            ` : `
              <img id="shopBgPreviewMedia" src="${mediaUrl}" class="absolute inset-0 w-full h-full transition-all duration-75 pointer-events-none" style="object-fit: ${currentFit}; object-position: ${Math.round(currentCropX * 100)}% ${Math.round(currentCropY * 100)}%; transform: scale(${currentZoom}); opacity: ${currentMode === 'black' ? 0.05 : (currentMode === 'reactive' ? 0.75 : currentOpacity)};">
            `}
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>

            <!-- Notch de teléfono móvil superior -->
            <div class="absolute top-1.5 w-8 h-1 bg-white/30 rounded-full pointer-events-none shadow-sm"></div>

            <!-- Guía de 3 carriles rítmicos exactos del juego -->
            <div class="absolute inset-x-2 top-4 bottom-8 border border-white/10 rounded-md pointer-events-none flex opacity-30">
              <div class="flex-1 border-r border-dashed border-white/20"></div>
              <div class="flex-1 border-r border-dashed border-white/20"></div>
              <div class="flex-1"></div>
            </div>

            <!-- Línea de impacto perfecta abajo -->
            <div class="absolute bottom-6 inset-x-2.5 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none opacity-80 shadow-sm shadow-cyan-400"></div>

            <!-- Badge de modo activo -->
            <div class="absolute bottom-1 inset-x-0 text-center px-1 pointer-events-none">
              <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${currentMode === 'reactive' ? 'bg-cyan-500/40 text-cyan-200 border border-cyan-400/50' : (currentMode === 'static' ? 'bg-purple-500/40 text-purple-200 border border-purple-400/50' : 'bg-gray-900/80 text-gray-300 border border-white/15')}">
                ${currentMode === 'reactive' ? 'Reactivo' : (currentMode === 'static' ? 'Estático' : 'Negro')}
              </span>
            </div>
          </div>
          <p class="text-[9px] text-gray-400 font-semibold text-center mt-1.5 flex items-center justify-center gap-1">
            Ratio 9:16 Pantalla • <span class="text-cyan-300">Arrastra para encuadrar</span>
          </p>
        </div>

        <!-- Selector de Modo de Fondo -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-bold text-gray-200 flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Modo de Fondo:
          </label>
          <div class="grid grid-cols-3 gap-1.5">
            <button onclick="setGameBgMode('black')" class="p-2 rounded-xl border text-center transition cursor-pointer ${currentMode === 'black' ? 'bg-pink-500/25 border-pink-400 text-pink-200 shadow-sm shadow-pink-500/20 font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}">
              <span class="block text-xs font-mono font-black text-gray-400">[BLK]</span>
              <span class="text-[9px] block leading-tight mt-0.5">Negro Clásico</span>
            </button>
            <button onclick="setGameBgMode('reactive')" class="p-2 rounded-xl border text-center transition cursor-pointer ${currentMode === 'reactive' ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20 font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mx-auto text-cyan-300"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span class="text-[9px] block leading-tight mt-0.5">Fondo Reactivo</span>
            </button>
            <button onclick="setGameBgMode('static')" class="p-2 rounded-xl border text-center transition cursor-pointer ${currentMode === 'static' ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-sm shadow-purple-500/20 font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mx-auto text-purple-300"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span class="text-[9px] block leading-tight mt-0.5">Fondo Estático</span>
            </button>
          </div>
        </div>

        <!-- Slider de Opacidad para Fondo Estático -->
        ${currentMode === 'static' ? `
        <div class="p-2.5 bg-black/60 rounded-xl border border-white/10 space-y-1.5">
          <div class="flex items-center justify-between text-[10px] text-gray-300 font-semibold">
            <span>Opacidad del fondo:</span>
            <span id="bgOpacityValueText" class="text-cyan-300 font-mono">${Math.round(currentOpacity * 100)}%</span>
          </div>
          <input type="range" min="0.10" max="0.80" step="0.05" value="${currentOpacity}" oninput="setGameBgOpacity(this.value)" class="w-full accent-cyan-400 cursor-pointer h-1.5 bg-gray-700 rounded-lg">
        </div>
        ` : ''}

        <!-- Panel de Recorte, Encuadre y Zoom -->
        <div class="p-3 bg-black/60 rounded-xl border border-white/10 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-gray-200 flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg> Recorte y Encuadre:
            </span>
            <div class="flex gap-1">
              <button onclick="setGameBgFit('cover')" class="px-2 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${currentFit === 'cover' ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/10 text-gray-400'}">
                Cubrir
              </button>
              <button onclick="setGameBgFit('contain')" class="px-2 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${currentFit === 'contain' ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/10 text-gray-400'}">
                Completo
              </button>
            </div>
          </div>

          <!-- Slider Zoom -->
          <div class="space-y-1">
            <div class="flex items-center justify-between text-[10px] text-gray-300 font-semibold">
              <span>Zoom / Escala:</span>
              <span id="bgZoomValueText" class="text-cyan-300 font-mono">${Math.round(currentZoom * 100)}%</span>
            </div>
            <input type="range" id="bgZoomSlider" min="100" max="250" step="5" value="${Math.round(currentZoom * 100)}" oninput="updateGameBgCrop(undefined, undefined, this.value / 100)" class="w-full accent-cyan-400 cursor-pointer h-1.5 bg-gray-700 rounded-lg">
          </div>

          <!-- Slider Vertical (Pan Y) -->
          <div class="space-y-1">
            <div class="flex items-center justify-between text-[10px] text-gray-300 font-semibold">
              <span>Posición Vertical:</span>
              <span class="text-gray-400 text-[9px]">Arriba ↔ Abajo</span>
            </div>
            <input type="range" id="bgCropYSlider" min="0" max="100" step="1" value="${Math.round(currentCropY * 100)}" oninput="updateGameBgCrop(undefined, this.value / 100, undefined)" class="w-full accent-cyan-400 cursor-pointer h-1.5 bg-gray-700 rounded-lg">
          </div>

          <!-- Slider Horizontal (Pan X) -->
          <div class="space-y-1">
            <div class="flex items-center justify-between text-[10px] text-gray-300 font-semibold">
              <span>Posición Horizontal:</span>
              <span class="text-gray-400 text-[9px]">Izq ↔ Der</span>
            </div>
            <input type="range" id="bgCropXSlider" min="0" max="100" step="1" value="${Math.round(currentCropX * 100)}" oninput="updateGameBgCrop(this.value / 100, undefined, undefined)" class="w-full accent-cyan-400 cursor-pointer h-1.5 bg-gray-700 rounded-lg">
          </div>

          <div class="flex justify-between items-center pt-1 text-[9px] text-gray-400">
            <span>Arrastra la vista previa para mover</span>
            <button onclick="resetGameBgCrop()" class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-cyan-300 font-bold border border-cyan-400/30 transition cursor-pointer">
              ↺ Centrar
            </button>
          </div>
        </div>

        <!-- Botones de Carga Dedicados (Foto / Vídeo) -->
        <div class="space-y-2 pt-1">
          <input type="file" id="customBgImgInput" accept="image/*" onchange="handleCustomBgUpload(event, 'image')" class="hidden">
          <input type="file" id="customBgVidInput" accept="video/mp4,video/webm,video/*" onchange="handleCustomBgUpload(event, 'video')" class="hidden">

          <div class="grid grid-cols-2 gap-2">
            <button onclick="document.getElementById('customBgImgInput').click()" class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Subir Imagen
            </button>
            <button onclick="document.getElementById('customBgVidInput').click()" class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> Subir Vídeo
            </button>
          </div>
        </div>

        <!-- Botón Restablecer -->
        <button onclick="resetCustomBgToDefault()" class="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] font-bold transition cursor-pointer text-center">
          Restablecer a Negro Clásico
        </button>
      `;

      const frameEl = document.getElementById('shopBgPreviewFrame');
      if (frameEl) initShopBgPreviewDrag(frameEl);
    };

    window.setGameBgMode = function(mode) {
      localStorage.setItem('beatstar_bg_mode', mode);
      if (engine) {
        engine.setCustomBackground(undefined, undefined, mode, undefined);
      }
      renderFXShopBackgroundPanel();
      showSuccessToast(mode === 'reactive' ? '¡Fondo reactivo iluminado activado!' : (mode === 'static' ? 'Fondo estático activado' : 'Fondo negro clásico activado'));
    };

    window.setGameBgOpacity = function(val) {
      const op = parseFloat(val) || 0.40;
      localStorage.setItem('beatstar_bg_opacity', op.toString());
      const txt = document.getElementById('bgOpacityValueText');
      if (txt) txt.innerText = Math.round(op * 100) + '%';
      const prev = document.getElementById('shopBgPreviewMedia');
      if (prev) prev.style.opacity = op;
      if (engine) {
        engine.setCustomBackground(undefined, undefined, undefined, op);
      }
    };

    window.resetCustomBgToDefault = function() {
      localStorage.removeItem('beatstar_custom_bg_data');
      localStorage.setItem('beatstar_bg_mode', 'black');
      localStorage.removeItem('beatstar_bg_crop_x');
      localStorage.removeItem('beatstar_bg_crop_y');
      localStorage.removeItem('beatstar_bg_crop_zoom');
      localStorage.removeItem('beatstar_bg_fit');
      window.customBgMediaBlobUrl = null;
      window.customBgMediaType = null;
      if (typeof IndexedDBStorage !== 'undefined') {
        IndexedDBStorage.deleteCustomMedia().catch(() => {});
      }
      if (engine) {
        engine.setCustomBackground('none', 'image', 'black', 0.40);
        engine.setCustomBgTransform(0.5, 0.5, 1.0, 'cover');
      }
      renderFXShopBackgroundPanel();
      showSuccessToast('Fondo restablecido a negro clásico.');
    };

    window.handleCustomBgUpload = async function(event, forcedType) {
      const file = event.target?.files?.[0];
      if (!file) return;

      const isVideo = (forcedType === 'video') || (file.type && file.type.startsWith('video/')) || /\.(mp4|webm|mkv|mov)$/i.test(file.name);
      const mediaType = isVideo ? 'video' : 'image';

      // 1. Convertir imagen a dataUrl para fallback síncrono en localStorage
      if (!isVideo && file.size < 4 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            localStorage.setItem('beatstar_custom_bg_data', e.target.result);
          } catch (err) {
            console.warn('Fondo temporal en memoria:', err);
          }
        };
        reader.readAsDataURL(file);
      }

      // 2. Guardar en IndexedDB
      try {
        if (typeof IndexedDBStorage !== 'undefined') {
          await IndexedDBStorage.saveCustomMedia(file, mediaType);
        }
      } catch (idbErr) {
        console.warn('Error guardando medio en IndexedDB:', idbErr);
      }

      const mediaUrl = URL.createObjectURL(file);
      window.customBgMediaBlobUrl = mediaUrl;
      window.customBgMediaType = mediaType;

      const curMode = localStorage.getItem('beatstar_bg_mode') || 'black';
      const nextMode = curMode === 'black' ? 'reactive' : curMode;

      if (engine) {
        engine.setCustomBackground(mediaUrl, mediaType, nextMode, undefined);
      }
      if (nextMode !== curMode) {
        setGameBgMode(nextMode);
      } else {
        renderFXShopBackgroundPanel();
      }

      showSuccessToast(isVideo ? '¡Vídeo de fondo cargado exitosamente!' : '¡Imagen de fondo cargada exitosamente!');
    };

    window.syncPCKeybindsUI = function() {
      const kb = (engine && engine.pcKeybinds) || JSON.parse(localStorage.getItem('beatstar_pc_keybinds') || '{"0":"d","1":"f","2":"j"}');
      const b0 = document.getElementById('btnKeybindLane0'); if (b0) b0.innerText = (kb[0] || 'd').toUpperCase();
      const b1 = document.getElementById('btnKeybindLane1'); if (b1) b1.innerText = (kb[1] || 'f').toUpperCase();
      const b2 = document.getElementById('btnKeybindLane2'); if (b2) b2.innerText = (kb[2] || 'j').toUpperCase();
    };

    window.startRebindKey = function(lane) {
      const btn = document.getElementById(`btnKeybindLane${lane}`);
      if (btn) {
        btn.innerText = '...';
        btn.classList.add('animate-pulse', 'border-pink-500', 'text-pink-400');
      }
      const onKey = function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.removeEventListener('keydown', onKey, true);
        if (btn) btn.classList.remove('animate-pulse', 'border-pink-500', 'text-pink-400');
        if (e.key === 'Escape') {
          syncPCKeybindsUI();
          return;
        }
        const key = e.key.toLowerCase();
        if (engine && engine.setPCKeybind) {
          engine.setPCKeybind(lane, key);
        } else {
          const kb = JSON.parse(localStorage.getItem('beatstar_pc_keybinds') || '{"0":"d","1":"f","2":"j"}');
          kb[lane] = key;
          localStorage.setItem('beatstar_pc_keybinds', JSON.stringify(kb));
        }
        syncPCKeybindsUI();
        showSuccessToast(`Carril ${lane + 1} asignado a tecla [ ${key.toUpperCase()} ]`);
      };
      window.addEventListener('keydown', onKey, true);
    };

    window.resetPCKeybinds = function() {
      const def = { 0: 'd', 1: 'f', 2: 'j' };
      localStorage.setItem('beatstar_pc_keybinds', JSON.stringify(def));
      if (engine) {
        engine.pcKeybinds = def;
      }
      syncPCKeybindsUI();
      showSuccessToast('Teclas de carril restablecidas a D, F, J.');
    };

    let previousEquippedEffectId = null;

    window.launchEffectDemo = function(effectId) {
      const effect = KEY_EFFECTS.find(e => e.id === effectId);
      if (!effect) return;

      previousEquippedEffectId = activeEffectId;
      if (engine) engine.setActiveEffect(effectId);

      // Close Shop Modal
      closeFXShopModal();

      // Switch to Game Screen
      const searchScreen = document.getElementById('searchScreen');
      if (searchScreen) {
        searchScreen.classList.add('hidden');
        searchScreen.style.display = 'none';
      }

      // Show floating Demo Banner
      let banner = document.getElementById('effectDemoBanner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'effectDemoBanner';
        banner.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/90 backdrop-blur-md border border-cyan-400/40 shadow-2xl';
        document.body.appendChild(banner);
      }
      banner.innerHTML = `
        <div class="flex items-center gap-2 text-xs font-black text-white">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>PROBANDO:</span>
          <span class="text-cyan-300">${effect.name}</span>
        </div>
        <button onclick="exitEffectDemo()" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white text-xs font-black transition cursor-pointer shadow-lg shadow-pink-600/30">
          ✕ Volver a la Tienda
        </button>
      `;
      banner.style.display = 'flex';

      // Start Real Interactive Calibration Session with the effect active
      if (engine) {
        engine.startNativeCalibration();
      }
    };

    window.exitEffectDemo = function() {
      const banner = document.getElementById('effectDemoBanner');
      if (banner) banner.style.display = 'none';

      if (engine) {
        engine.stopNativeCalibration();
        if (previousEquippedEffectId) {
          engine.setActiveEffect(previousEquippedEffectId);
        }
      }

      const searchScreen = document.getElementById('searchScreen');
      if (searchScreen) {
        searchScreen.classList.remove('hidden');
        searchScreen.style.display = 'flex';
      }

      openFXShopModal();
    };

    function startShopDemoLoop() {
      // Kept for backward compatibility
    }

    function stopShopDemoLoop() {
      if (shopDemoAnimId) {
        cancelAnimationFrame(shopDemoAnimId);
        shopDemoAnimId = null;
      }
    }

    window.equipKeyEffect = function(effectId) {
      activeEffectId = effectId;
      localStorage.setItem('beatstar_active_effect', effectId);
      if (engine) engine.setActiveEffect(effectId);
      showSuccessToast('Efecto de tecla equipado.');
      renderFXShopItems();
    };

    window.buyKeyEffect = function(effectId) {
      const effect = KEY_EFFECTS.find(e => e.id === effectId);
      if (!effect) return;

      if (userClefs < effect.costClefs || userSilvers < effect.costSilver || userGolds < effect.costGold || userPlatinums < effect.costPlatinum) {
        showErrorToast(`Requisitos: ${effect.costClefs} Claves, ${effect.costSilver} Plata, ${effect.costGold} Oro, ${effect.costPlatinum} Platino.`);
        return;
      }

      userClefs -= effect.costClefs;
      userSilvers -= effect.costSilver;
      userGolds -= effect.costGold;
      userPlatinums -= effect.costPlatinum;
      updateUserWalletDisplay();

      unlockedEffects.push(effectId);
      localStorage.setItem('beatstar_unlocked_effects', JSON.stringify(unlockedEffects));
      equipKeyEffect(effectId);
      showSuccessToast(`¡Efecto "${effect.name}" desbloqueado y equipado!`);
    };

    window.updateMapDensity = function(val) {
      const mode = ['easy', 'medium', 'hard'].includes(val) ? val : 'hard';
      localStorage.setItem('beatstar_map_density', mode);
      const valEl = document.getElementById('settingsMapDensityVal');
      if (valEl) {
        valEl.innerText = mode === 'easy' ? 'Fácil' : (mode === 'medium' ? 'Medio' : 'Difícil');
        valEl.className = `font-mono font-bold ${mode === 'easy' ? 'text-emerald-400' : (mode === 'medium' ? 'text-amber-400' : 'text-cyan-400')}`;
      }
      const selectEl = document.getElementById('settingsMapDensitySelect');
      if (selectEl) selectEl.value = mode;
      showSuccessToast(`Dificultad de mapa: ${mode === 'easy' ? 'Fácil (Principiante)' : (mode === 'medium' ? 'Medio (Intermedio)' : 'Difícil (Actual)')}`);
    };

    window.updateNoteSpeed = function(val) {
      const mult = parseFloat(val) || 1.0;
      localStorage.setItem('beatstar_note_speed', mult.toString());
      if (engine) engine.setNoteSpeedMultiplier(mult);
      const valEl = document.getElementById('settingsNoteSpeedVal');
      if (valEl) valEl.innerText = `${mult}x`;
      showSuccessToast(`${t('toast_speed_updated')}${mult}x`);
    };

    window.openNativeCalibration = function() {
      if (typeof pauseMenuAmbientMusic === 'function') pauseMenuAmbientMusic();
      closeSettingsModal();
      document.getElementById('searchScreen').classList.add('hidden');
      document.getElementById('fixedTopHud').classList.add('hidden');
      
      const calibBackdrop = document.getElementById('calibrationBackdrop');
      if (calibBackdrop) {
        calibBackdrop.classList.add('active');
        calibBackdrop.style.display = 'block';
      }
      
      const calibScreen = document.getElementById('calibrationScreen');
      if (calibScreen) {
        calibScreen.classList.add('open');
        calibScreen.style.display = 'flex';
      }

      if (engine) engine.startNativeCalibration();
    };

    window.saveAndExitCalibration = function() {
      if (engine) engine.stopNativeCalibration();
      
      const calibBackdrop = document.getElementById('calibrationBackdrop');
      if (calibBackdrop) {
        calibBackdrop.classList.remove('active');
        calibBackdrop.style.display = 'none';
      }
      
      const calibScreen = document.getElementById('calibrationScreen');
      if (calibScreen) {
        calibScreen.classList.remove('open');
        calibScreen.style.display = 'none';
      }
      
      const searchScreen = document.getElementById('searchScreen');
      if (searchScreen) {
        searchScreen.classList.remove('hidden');
        searchScreen.style.display = 'flex';
      }
      showSuccessToast('Offset de latencia guardado.');
      if (typeof resumeMenuAmbientMusic === 'function') resumeMenuAmbientMusic();
    };

    window.openYTMusicModal = function() {
      closeSettingsModal();
      const modal = document.getElementById('ytMusicModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
      }
    };

    window.closeYTMusicModal = function() {
      const modal = document.getElementById('ytMusicModal');
      if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
      }
    };

    window.openPauseModal = function() {
      if (typeof pauseMenuAmbientMusic === 'function') pauseMenuAmbientMusic();
      const activeMap = currentActiveBeatmap || (engine && engine.beatmapData);
      if (!activeMap && !engine) return;
      if (engine) engine.pause();

      const pauseSongTitle = document.getElementById('pauseSongTitle');
      if (pauseSongTitle) {
        pauseSongTitle.innerText = activeMap?.metadata?.title || activeMap?.title || t('pause_title', 'Juego en Pausa');
      }

      const exitBtn = document.getElementById('btnExitGame');
      if (exitBtn) {
        exitBtn.innerHTML = window.isPlaytestingFromEditor 
          ? t('ed_return', 'VOLVER AL EDITOR') 
          : '<svg width="16" height="16" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg> ' + t('exit_menu', 'SALIR AL MENÚ');
      }

      const modal = document.getElementById('pauseModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
      }

      const currentRate = (engine && engine.songPlaybackRate) ? engine.songPlaybackRate : 1.0;
      const pSpeed = document.getElementById('pauseSongSpeedVal');
      if (pSpeed) pSpeed.innerText = `${currentRate.toFixed(2)}x`;
      const pSlider = document.getElementById('pauseSongSpeedSlider');
      if (pSlider) pSlider.value = currentRate;

      const offsetVal = document.getElementById('pauseOffsetVal');
      const offsetSlider = document.getElementById('pauseOffsetSlider');
      const currentOffset = parseInt(localStorage.getItem('beatstar_offset') || '0', 10) || 0;
      if (offsetVal) {
        const sign = currentOffset > 0 ? '+' : '';
        offsetVal.innerText = `${sign}${currentOffset} ms`;
      }
      if (offsetSlider) offsetSlider.value = currentOffset;
    };

    window.onPauseSongSpeedChange = function(val) {
      const s = Math.max(0.5, Math.min(2.0, Math.round(parseFloat(val) * 20) / 20));
      const songId = currentActiveBeatmap?.metadata?.id || currentActiveBeatmap?.id;
      if (songId) {
        setSongSpeed(songId, s);
      } else {
        localStorage.setItem('beatstar_active_song_speed', s.toFixed(2));
      }
      if (engine) {
        engine.setSongPlaybackSpeed(s);
      }
      const valEl = document.getElementById('pauseSongSpeedVal');
      if (valEl) valEl.innerText = `${s.toFixed(2)}x`;
      const sliderEl = document.getElementById('pauseSongSpeedSlider');
      if (sliderEl) sliderEl.value = s;
    };

    window.resumeGame = function() {
      const modals = ['pauseModal', 'reviveModal', 'resultsModal'];
      modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove('open');
          el.style.display = 'none';
        }
      });
      const countdownOverlay = document.getElementById('startCountdownOverlay');
      if (countdownOverlay) {
        countdownOverlay.classList.remove('show', 'fading');
      }
      const curtain = document.getElementById('gameCurtain');
      if (curtain) curtain.classList.add('revealed');

      if (engine) engine.resume();
    };

    window.restartGame = function() {
      const modals = ['pauseModal', 'reviveModal', 'resultsModal'];
      modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove('open');
          el.style.display = 'none';
        }
      });
      const countdownOverlay = document.getElementById('startCountdownOverlay');
      if (countdownOverlay) {
        countdownOverlay.classList.remove('show', 'fading');
      }
      const curtain = document.getElementById('gameCurtain');
      if (curtain) curtain.classList.add('revealed');

      if (engine) engine.restart();
    };

    window.restartFromPenalty = function() {
      const reviveModal = document.getElementById('reviveModal');
      if (reviveModal) {
        reviveModal.classList.remove('open');
        reviveModal.style.display = 'none';
      }
      clearDeathTypewriterSequences();
      const countdownOverlay = document.getElementById('startCountdownOverlay');
      if (countdownOverlay) {
        countdownOverlay.classList.remove('show', 'fading');
      }
      const curtain = document.getElementById('gameCurtain');
      if (curtain) curtain.classList.add('revealed');

      if (engine) engine.restart();
    };

    // =========================================================================
    // MÁQUINA DE ESCRIBIR VINTAGE (CHOPIN & CO. 1928) - SINTETIZADOR Y SECUENCIADOR
    // =========================================================================
    let typewriterAudioCtx = null;
    function getTypewriterAudioContext() {
      try {
        if (!typewriterAudioCtx) {
          const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
          if (AudioCtxClass) {
            typewriterAudioCtx = new AudioCtxClass({ latencyHint: 'interactive' });
          }
        }
        if (typewriterAudioCtx && typewriterAudioCtx.state === 'suspended') {
          typewriterAudioCtx.resume().catch(() => {});
        }
      } catch (e) {
        console.warn('Typewriter audio context warning:', e);
      }
      return typewriterAudioCtx;
    }

    function playTypewriterKeyStrike(isSpace = false) {
      try {
        const ctx = getTypewriterAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // 1. Martilleo metálico afinado
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = isSpace ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(isSpace ? 180 : 380 + Math.random() * 140, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.045);
        oscGain.gain.setValueAtTime(0.35, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);

        // 2. Ruido filtrado de impacto de cinta y caucho
        const bufferSize = Math.floor(ctx.sampleRate * 0.035);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isSpace ? 850 : 2100 + (Math.random() * 400 - 200), now);
        filter.Q.setValueAtTime(3.2, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(isSpace ? 0.22 : 0.42, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);

        // 3. Clic mecánico del trinquete de escape
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'sawtooth';
        clickOsc.frequency.setValueAtTime(1400, now + 0.006);
        clickGain.gain.setValueAtTime(0.12, now + 0.006);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(now + 0.006);
        clickOsc.stop(now + 0.02);
      } catch (err) {
        // Fallback silencioso si audio no disponible
      }
    }

    function playPaperFeedSound() {
      try {
        const ctx = getTypewriterAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        for (let i = 0; i < 6; i++) {
          const t = now + i * 0.045;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(260 + (i % 2) * 60, t);
          g.gain.setValueAtTime(0.09, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.022);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.025);
        }
      } catch (e) {}
    }

    function playCarriageBellChime() {
      try {
        const ctx = getTypewriterAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(2240, now);
        osc2.frequency.setValueAtTime(4480, now);
        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.8);
        osc2.stop(now + 0.8);
      } catch (e) {}
    }

    function playCarriageReturnSound() {
      try {
        const ctx = getTypewriterAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const bufferSize = Math.floor(ctx.sampleRate * 0.16);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.linearRampToValueAtTime(400, now + 0.16);
        filter.Q.setValueAtTime(1.8, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } catch (e) {}
    }

    function playStampThud() {
      try {
        const ctx = getTypewriterAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.14);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } catch (e) {}
    }

    // Secuencias animadas para Pantalla de Muerte
    let activeTypewriterDeathTimeouts = [];
    function clearDeathTypewriterSequences() {
      activeTypewriterDeathTimeouts.forEach(t => clearTimeout(t));
      activeTypewriterDeathTimeouts = [];
    }

    window.triggerVintageDeathScreen = triggerVintageDeathScreen;
    function triggerVintageDeathScreen(score, penaltyCost) {
      clearDeathTypewriterSequences();
      try { getTypewriterAudioContext(); } catch(_) {}

      const deathUserBalance = document.getElementById('deathUserBalance');
      if (deathUserBalance) deathUserBalance.innerText = (typeof userClefs !== 'undefined' ? userClefs : 0);

      const deathReviveBadgeCost = document.getElementById('deathReviveBadgeCost');
      if (deathReviveBadgeCost) deathReviveBadgeCost.innerText = penaltyCost;

      const scoreStr = Number(score || 0).toLocaleString();
      const scoreLetters = document.getElementById('deathScoreLetters');
      if (scoreLetters) {
        scoreLetters.innerHTML = '';
        const spanInit = document.createElement('span');
        spanInit.className = 'typed-letter';
        spanInit.innerText = scoreStr;
        scoreLetters.appendChild(spanInit);
      }

      const costLetters = document.getElementById('deathCostLetters');
      if (costLetters) {
        costLetters.innerHTML = '';
        const spanCost = document.createElement('span');
        spanCost.className = 'typed-letter red-ink font-bold';
        spanCost.innerText = `${penaltyCost} 𝄞`;
        costLetters.appendChild(spanCost);
      }

      const scoreCursor = document.getElementById('deathScoreCursor');
      if (scoreCursor) scoreCursor.style.display = 'none';
      const costCursor = document.getElementById('deathCostCursor');
      if (costCursor) costCursor.style.display = 'none';

      const ribbonDot = document.getElementById('deathRibbonDot');
      if (ribbonDot) ribbonDot.classList.add('red-active');

      const stampApproved = document.getElementById('deathStampApproved');
      if (stampApproved) stampApproved.classList.remove('stamped');

      const parchment = document.getElementById('deathParchmentSheet');
      if (parchment) parchment.classList.add('ejected');

      const knobL = document.getElementById('deathKnobLeft');
      const knobR = document.getElementById('deathKnobRight');
      if (knobL) knobL.classList.remove('rolling');
      if (knobR) knobR.classList.remove('rolling');

      const btnRevive = document.getElementById('btnDeathRevive');
      if (btnRevive) {
        btnRevive.disabled = false;
        btnRevive.style.opacity = '1';
        btnRevive.style.pointerEvents = 'auto';
      }

      // Iniciar sonido analógico
      try { playPaperFeedSound(); } catch(_) {}
      activeTypewriterDeathTimeouts.push(setTimeout(() => {
        try { playTypewriterKeyStrike(false); } catch(_) {}
      }, 120));

      // 2. Mecanografiar puntuación alcanzada
      let delay = 1050;

      for (let i = 0; i < scoreStr.length; i++) {
        const char = scoreStr[i];
        activeTypewriterDeathTimeouts.push(setTimeout(() => {
          const fork = document.getElementById('deathRibbonFork');
          if (fork) {
            fork.classList.add('kick');
            setTimeout(() => fork.classList.remove('kick'), 50);
          }
          playTypewriterKeyStrike(char === ' ' || char === ',');
          if (scoreLetters) {
            const span = document.createElement('span');
            span.className = 'typed-letter';
            span.innerText = char;
            const slightAngle = (Math.random() * 1.6 - 0.8).toFixed(2);
            const slightY = (Math.random() * 1.2 - 0.6).toFixed(2);
            span.style.transform = `rotate(${slightAngle}deg) translateY(${slightY}px)`;
            scoreLetters.appendChild(span);
          }
        }, delay));
        delay += 95 + Math.floor(Math.random() * 45);
      }

      // 3. Campana de final de línea y retorno de carro
      delay += 140;
      activeTypewriterDeathTimeouts.push(setTimeout(() => {
        playCarriageBellChime();
        const arm = document.getElementById('deathCarriageArm');
        if (arm) {
          arm.classList.add('pulled');
          setTimeout(() => {
            arm.classList.remove('pulled');
            playCarriageReturnSound();
          }, 260);
        }
        if (scoreCursor) scoreCursor.style.display = 'none';
      }, delay));

      // 4. Cambiar selector a cinta roja
      delay += 380;
      activeTypewriterDeathTimeouts.push(setTimeout(() => {
        if (ribbonDot) ribbonDot.classList.add('red-active');
        playTypewriterKeyStrike(true);
        if (costCursor) costCursor.style.display = 'inline-block';
      }, delay));

      // 5. Teclear coste de penalización en rojo
      delay += 240;
      const costStr = String(penaltyCost);
      for (let i = 0; i < costStr.length; i++) {
        const c = costStr[i];
        activeTypewriterDeathTimeouts.push(setTimeout(() => {
          const fork = document.getElementById('deathRibbonFork');
          if (fork) {
            fork.classList.add('kick');
            setTimeout(() => fork.classList.remove('kick'), 50);
          }
          playTypewriterKeyStrike(false);
          if (costLetters) {
            const span = document.createElement('span');
            span.className = 'cost-typed-char';
            span.innerText = c;
            costLetters.appendChild(span);
          }
        }, delay));
        delay += 100;
      }

      // Clave de sol mecanografiada
      delay += 100;
      activeTypewriterDeathTimeouts.push(setTimeout(() => {
        playTypewriterKeyStrike(false);
        if (costLetters) {
          const clefSpan = document.createElement('span');
          clefSpan.className = 'cost-clef-char';
          clefSpan.innerText = '𝄞';
          costLetters.appendChild(clefSpan);
        }
      }, delay));
    };

    window.handleVintageReviveClick = function(event) {
      if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
      }
      const btn = document.getElementById('btnDeathRevive');
      if (btn) btn.disabled = true;

      if (deductClefs(currentPenaltyCost)) {
        playStampThud();
        setTimeout(() => playCarriageBellChime(), 90);
        const stamp = document.getElementById('deathStampApproved');
        if (stamp) stamp.classList.add('stamped');

        setTimeout(() => {
          clearDeathTypewriterSequences();
          const reviveModal = document.getElementById('reviveModal');
          if (reviveModal) {
            reviveModal.classList.remove('open');
            reviveModal.style.display = 'none';
          }
          showSuccessToast(`¡Reanudando! (-${currentPenaltyCost} 𝄞)`);
          if (engine) engine.reviveAndResume();
        }, 450);
      } else {
        const toast = document.getElementById('deathToastNotice');
        if (toast) {
          toast.innerText = '¡Saldo insuficiente de Claves de Sol (𝄞)!';
          toast.classList.add('active');
          playTypewriterKeyStrike(true);
          setTimeout(() => toast.classList.remove('active'), 2600);
        } else {
          showErrorToast('No tienes suficientes Claves de Sol (𝄞).');
        }
        if (btn) btn.disabled = false;
      }
    };

    // Secuencias animadas para Pantalla de Resultados
    let activeTypewriterResultsTimeouts = [];
    function clearResultsTypewriterSequences() {
      activeTypewriterResultsTimeouts.forEach(t => clearTimeout(t));
      activeTypewriterResultsTimeouts = [];
    }

    window.triggerVintageResultsScreen = triggerVintageResultsScreen;
    function triggerVintageResultsScreen(score, maxCombo, stars, stats, earnedClefs, isNewRecord, finalMedal, scorePct) {
      clearResultsTypewriterSequences();
      try { getTypewriterAudioContext(); } catch(_) {}

      const resUserBalance = document.getElementById('resUserBalance');
      if (resUserBalance) resUserBalance.innerText = (typeof userClefs !== 'undefined' ? userClefs : 0);

      const scoreLetters = document.getElementById('resScoreLetters');
      const scoreStr = Number(score || 0).toLocaleString();
      if (scoreLetters) {
        scoreLetters.innerHTML = '';
        const spanInit = document.createElement('span');
        spanInit.className = 'typed-letter';
        spanInit.innerText = scoreStr;
        scoreLetters.appendChild(spanInit);
      }

      const rewardLetters = document.getElementById('resRewardLetters');
      if (rewardLetters) {
        rewardLetters.innerHTML = '';
        const spanRew = document.createElement('span');
        spanRew.className = 'typed-letter red-ink font-bold';
        spanRew.innerText = `+${earnedClefs} 𝄞`;
        rewardLetters.appendChild(spanRew);
      }

      const scoreCursor = document.getElementById('resScoreCursor');
      if (scoreCursor) scoreCursor.style.display = 'none';
      const rewardCursor = document.getElementById('resRewardCursor');
      if (rewardCursor) rewardCursor.style.display = 'none';

      const ribbonDot = document.getElementById('resRibbonDot');
      if (ribbonDot) ribbonDot.classList.add('red-active');

      const stampApproved = document.getElementById('resStampApproved');
      if (stampApproved) {
        stampApproved.classList.add('stamped');
        stampApproved.innerText = isNewRecord ? '¡NUEVO RÉCORD!' : '¡COMPLETADO!';
      }

      const stampBadge = document.getElementById('resStampBadge');
      if (stampBadge) stampBadge.innerText = isNewRecord ? 'RÉCORD' : 'FIN';

      const parchment = document.getElementById('resParchmentSheet');
      if (parchment) parchment.classList.add('ejected');

      const songCaption = document.getElementById('resSongInfoCaption');
      if (songCaption) {
        const title = currentActiveBeatmap?.metadata?.title || 'PIEZA';
        songCaption.innerText = `• OPUS: ${title.toUpperCase().slice(0, 24)}`;
      }

      const displayScorePct = Math.min(100.0, Math.max(0.0, scorePct));
      const accEl = document.getElementById('resParchmentAccuracy');
      if (accEl) accEl.innerText = `${displayScorePct.toFixed(1)}%`;

      const comboEl = document.getElementById('resParchmentCombo');
      if (comboEl) comboEl.innerText = maxCombo;

      const ppEl = document.getElementById('resParchmentPPlus');
      if (ppEl) ppEl.innerText = stats?.perfectPlus ?? 0;
      const pEl = document.getElementById('resParchmentP');
      if (pEl) pEl.innerText = stats?.perfect ?? 0;
      const gEl = document.getElementById('resParchmentG');
      if (gEl) gEl.innerText = stats?.great ?? 0;
      const mEl = document.getElementById('resParchmentM');
      if (mEl) mEl.innerText = stats?.miss ?? 0;

      const starsContainer = document.getElementById('resParchmentStars');
      if (starsContainer) {
        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
          if (i < stars) {
            starsHtml += `<span style="color:#b8860b; text-shadow:0 0 1px #5a3d00; transform:scale(1.15);">★</span>`;
          } else {
            starsHtml += `<span style="color:rgba(90, 72, 53, 0.28);">★</span>`;
          }
        }
        starsContainer.innerHTML = starsHtml;
      }

      const knobL = document.getElementById('resKnobLeft');
      const knobR = document.getElementById('resKnobRight');
      if (knobL) knobL.classList.remove('rolling');
      if (knobR) knobR.classList.remove('rolling');

      // 1. Rodillo y sonido de alimentación
      activeTypewriterResultsTimeouts.push(setTimeout(() => {
        if (knobL) knobL.classList.add('rolling');
        if (knobR) knobR.classList.add('rolling');
        playPaperFeedSound();
        if (parchment) parchment.classList.add('ejected');
      }, 100));

      // 2. Tecleo de puntuación
      let delay = 1000;

      for (let i = 0; i < scoreStr.length; i++) {
        const char = scoreStr[i];
        activeTypewriterResultsTimeouts.push(setTimeout(() => {
          const fork = document.getElementById('resRibbonFork');
          if (fork) {
            fork.classList.add('kick');
            setTimeout(() => fork.classList.remove('kick'), 50);
          }
          playTypewriterKeyStrike(char === ' ' || char === ',');
          if (scoreLetters) {
            const span = document.createElement('span');
            span.className = 'typed-letter';
            span.innerText = char;
            const slightAngle = (Math.random() * 1.6 - 0.8).toFixed(2);
            const slightY = (Math.random() * 1.2 - 0.6).toFixed(2);
            span.style.transform = `rotate(${slightAngle}deg) translateY(${slightY}px)`;
            scoreLetters.appendChild(span);
          }
        }, delay));
        delay += 90 + Math.floor(Math.random() * 40);
      }

      // 3. Campana y palanca
      delay += 140;
      activeTypewriterResultsTimeouts.push(setTimeout(() => {
        playCarriageBellChime();
        const arm = document.getElementById('resCarriageArm');
        if (arm) {
          arm.classList.add('pulled');
          setTimeout(() => {
            arm.classList.remove('pulled');
            playCarriageReturnSound();
          }, 260);
        }
        if (scoreCursor) scoreCursor.style.display = 'none';
      }, delay));

      // 4. Cinta roja
      delay += 380;
      activeTypewriterResultsTimeouts.push(setTimeout(() => {
        if (ribbonDot) ribbonDot.classList.add('red-active');
        playTypewriterKeyStrike(true);
        if (rewardCursor) rewardCursor.style.display = 'inline-block';
      }, delay));

      // 5. Recompensa en rojo
      delay += 240;
      const rewardStr = `+${earnedClefs}`;
      for (let i = 0; i < rewardStr.length; i++) {
        const c = rewardStr[i];
        activeTypewriterResultsTimeouts.push(setTimeout(() => {
          const fork = document.getElementById('resRibbonFork');
          if (fork) {
            fork.classList.add('kick');
            setTimeout(() => fork.classList.remove('kick'), 50);
          }
          playTypewriterKeyStrike(false);
          if (rewardLetters) {
            const span = document.createElement('span');
            span.className = 'cost-typed-char';
            span.innerText = c;
            rewardLetters.appendChild(span);
          }
        }, delay));
        delay += 95;
      }

      // Clave de sol
      delay += 100;
      activeTypewriterResultsTimeouts.push(setTimeout(() => {
        playTypewriterKeyStrike(false);
        if (rewardLetters) {
          const clefSpan = document.createElement('span');
          clefSpan.className = 'cost-clef-char';
          clefSpan.innerText = '𝄞';
          rewardLetters.appendChild(clefSpan);
        }
      }, delay));

      // 6. Sello final con golpe
      delay += 340;
      activeTypewriterResultsTimeouts.push(setTimeout(() => {
        playStampThud();
        if (stampApproved) stampApproved.classList.add('stamped');
      }, delay));
    };

    window.toggleResultsExtraDrawer = function() {
      const drawer = document.getElementById('resultsExtraDrawer');
      const btnLabel = document.getElementById('btnToggleExtraResultsLabel');
      if (!drawer) return;
      const isHidden = drawer.classList.contains('hidden');
      if (isHidden) {
        drawer.classList.remove('hidden');
        if (btnLabel) btnLabel.innerText = '▲ OCULTAR EXTRA';
      } else {
        drawer.classList.add('hidden');
        if (btnLabel) btnLabel.innerText = '★ RATING / TOP';
      }
    };

    // ==========================================
    // INSTALACIÓN APK Y PWA ANDROID
    // ==========================================
    let deferredPwaPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPwaPrompt = e;
      const tip = document.getElementById('pwaManualTip');
      if (tip) tip.style.display = 'none';
    });

    window.openApkInstallModal = function() {};
    window.closeApkInstallModal = function() {};

    window.triggerDirectPwaInstall = async function() {
      if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        const { outcome } = await deferredPwaPrompt.userChoice;
        if (outcome === 'accepted') {
          showSuccessToast('¡Gracias por instalar Piano Community!');
        }
        deferredPwaPrompt = null;
      }
    };

    window.handleApkDownloadClick = function(event) {
      // Descarga directa sin intermediarios ni nuevas pestañas
      return true;
    };

    window.payReviveAndResume = function(event) {
      handleVintageReviveClick(event);
    };

    window.exitToSearch = function() {
      clearDeathTypewriterSequences();
      clearResultsTypewriterSequences();
      if (activeCountdownInterval) {
        clearInterval(activeCountdownInterval);
        activeCountdownInterval = null;
      }
      const countdownOverlay = document.getElementById('startCountdownOverlay');
      if (countdownOverlay) {
        countdownOverlay.classList.remove('show', 'fading');
      }

      const modals = ['pauseModal', 'reviveModal', 'resultsModal', 'calibrationScreen', 'settingsModal', 'ytMusicModal', 'addToPlaylistModal', 'fxShopModal', 'leaderboardModal'];
      modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove('open');
          el.style.display = 'none';
        }
      });

      const calibBackdrop = document.getElementById('calibrationBackdrop');
      if (calibBackdrop) {
        calibBackdrop.classList.remove('active');
        calibBackdrop.style.display = 'none';
      }

      const curtain = document.getElementById('gameCurtain');
      if (curtain) {
        curtain.classList.add('revealed');
      }

      // Guardar puntuación alcanzada al salir (como si se hubiera terminado la canción)
      if (engine && currentActiveBeatmap && (engine.score > 0 || (engine.stats && (engine.stats.perfectPlus || engine.stats.perfect || engine.stats.great || engine.stats.good)))) {
        try {
          const songId = currentActiveBeatmap?.communityChartId || currentActiveBeatmap?.metadata?.id || currentActiveBeatmap?.id || 'song';
          const maxScore = Math.max(1, engine.maxPossibleScore || 1);
          const scorePct = Math.min(100.0, (engine.score / maxScore) * 100);
          const totalJudged = (engine.stats?.perfectPlus || 0) + (engine.stats?.perfect || 0) + (engine.stats?.great || 0) + (engine.stats?.good || 0) + (engine.stats?.miss || 0);
          const accuracyPct = totalJudged > 0
            ? Math.min(100.0, Math.max(0.0, (((engine.stats.perfectPlus * 100) + (engine.stats.perfect * 80) + (engine.stats.great * 50) + ((engine.stats.good || 0) * 25)) / (totalJudged * 100)) * 100))
            : 100.0;
          
          const isNewRecord = saveHighscore(songId, engine.score, engine.stars || 0, engine.maxCombo || 0, engine.currentMedalTier || null, scorePct);

          // Otorgar claves de sol por estrellas conseguidas hasta ese momento
          const earnedClefs = Math.min(15, (engine.stars || 0) * 3);
          if (earnedClefs > 0 && typeof addClefs === 'function') {
            addClefs(earnedClefs);
          }
          if (isNewRecord && typeof showSuccessToast === 'function') {
            showSuccessToast(`¡Puntuación guardada: ${engine.score.toLocaleString()} pts!`);
          }
        } catch (saveErr) {
          console.error('Error guardando puntuación al salir:', saveErr);
        }
      }

      if (engine) {
        try { engine.stop(); } catch (e) { console.error('Error stopping engine:', e); }
      }
      window.isGameLoadingOrActive = false;
      window.currentActiveBeatmap = null;
      currentActiveBeatmap = null;

      document.getElementById('fixedTopHud').classList.add('hidden');

      // Restaurar SIEMPRE el contenedor principal searchScreen
      const searchScreen = document.getElementById('searchScreen');
      if (searchScreen) {
        searchScreen.classList.remove('hidden');
        searchScreen.style.display = 'flex';
      }

      // Si se estaba probando una pista desde el editor, regresar directamente al editor sin crasheos
      if (window.isPlaytestingFromEditor) {
        window.isPlaytestingFromEditor = false;
        switchMainTab('editor');
        if (typeof ChartEditor !== 'undefined' && ChartEditor.canvas) {
          try {
            ChartEditor.resizeCanvas();
            ChartEditor.draw();
          } catch (e) {}
        }
        return;
      }

      renderCurrentLibrarySubtab();
      if (typeof resumeMenuAmbientMusic === 'function') resumeMenuAmbientMusic();
    };

    const DEFAULT_CLOUD_SERVER = 'https://renacer.onrender.com';

    function getApiBaseUrl() {
      const custom = localStorage.getItem('beatstar_api_server');
      if (custom !== null && custom !== undefined) {
        if (custom.trim().length > 0) return custom.trim().replace(/\/$/, '');
      }
      const host = window.location.hostname || '';
      const isStaticHost = host.includes('itch.io') ||
                           host.includes('hwcdn.net') ||
                           host.includes('github.io') ||
                           host.includes('netlify.app') ||
                           host.includes('vercel.app') ||
                           host === 'appassets.androidplatform.net' ||
                           window.location.protocol === 'file:';

      if (!isStaticHost && host.length > 0 && typeof window.location.origin === 'string' && window.location.origin.startsWith('http')) {
        return window.location.origin;
      }
      return DEFAULT_CLOUD_SERVER;
    }

    // Código de versión local: si es el APK anterior (sin getAppVersionCode) es versión 1
    const CURRENT_APP_VERSION_CODE = (window.AndroidNative && typeof window.AndroidNative.getAppVersionCode === 'function')
      ? window.AndroidNative.getAppVersionCode()
      : (window.AndroidNative ? 1 : 3);
    let appUpdateDownloadUrl = '/download/apk';

    async function checkForAppUpdates() {
      try {
        const baseUrl = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
        if (!baseUrl) return;
        const res = await fetch(`${baseUrl}/api/v1/version`);
        if (!res.ok) return;
        const data = await res.json();

        if (data && data.version_code) {
          const remoteCode = parseInt(data.version_code, 10);
          if (remoteCode > CURRENT_APP_VERSION_CODE) {
            const dismissedVer = localStorage.getItem('dismissed_update_version');
            if (dismissedVer === String(remoteCode)) return;

            appUpdateDownloadUrl = data.download_url || '/download/apk';
            const titleEl = document.getElementById('appUpdateTitle');
            const notesEl = document.getElementById('appUpdateNotes');
            if (titleEl) titleEl.innerText = `Piano Community v${data.version_name || data.version_code}`;
            if (notesEl && data.release_notes) notesEl.innerText = data.release_notes;

            const modal = document.getElementById('appUpdateModal');
            if (modal) {
              modal.classList.add('open');
              modal.style.display = 'flex';
            }
          }
        }
      } catch (e) {
        console.warn('Comprobación de versión omitida:', e);
      }
    }

    function closeAppUpdateModal() {
      const modal = document.getElementById('appUpdateModal');
      if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
      }
    }

    function performAppUpdate() {
      const baseUrl = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
      let targetUrl = appUpdateDownloadUrl;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = baseUrl + (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl);
      }

      if (window.AndroidNative && typeof window.AndroidNative.openBrowser === 'function') {
        window.AndroidNative.openBrowser(targetUrl);
      } else {
        window.open(targetUrl, '_blank');
      }
      closeAppUpdateModal();
    }

    document.addEventListener('DOMContentLoaded', async () => {
      const activeLang = getLanguage();
      setLanguage(activeLang, false);
      applyVisualDimensionTheme();
      loadHighscores();
      if (typeof syncPlayerAndScoresWithServer === 'function') {
        syncPlayerAndScoresWithServer();
      }
      await loadFavoritesSet();
      updateUserWalletDisplay();
      checkForAppUpdates();

      // Inicialización y onboarding de Nickname
      const savedNickname = localStorage.getItem('beatstar_player_nickname') || '';
      const nicknameInput = document.getElementById('settingsNicknameInput');
      if (nicknameInput) nicknameInput.value = savedNickname;

      if (!savedNickname || savedNickname.trim() === '') {
        const nickModal = document.getElementById('nicknameModal');
        if (nickModal) {
          nickModal.classList.remove('hidden');
          nickModal.classList.add('open');
          nickModal.style.display = 'flex';
        }
      }

      // Cargar desafíos diarios comunitarios
      loadDailyFeaturedSongs();

      const savedSpeed = localStorage.getItem('beatstar_note_speed') || '1.0';
      const speedSelect = document.getElementById('settingsNoteSpeedSelect');
      const speedVal = document.getElementById('settingsNoteSpeedVal');
      if (speedSelect) speedSelect.value = savedSpeed;
      if (speedVal) speedVal.innerText = `${savedSpeed}x`;

      const savedDensity = localStorage.getItem('beatstar_map_density') || 'hard';
      updateMapDensity(savedDensity);

      const canvas = document.getElementById('gameCanvas');
      engine = new BeatstarEngine(canvas, {
        onScoreUpdate: (score, combo, stars, multiplier, medalTier, pct) => {
          // Number ticker is updated continuously in requestAnimationFrame inside engine,
          // but ensure target score reflects accurately
          const fillEl = document.getElementById('hudProgressFill');
          if (fillEl) {
            const clampedPct = Math.min(100, Math.max(0, pct || 0));
            fillEl.style.width = clampedPct + '%';
            if (clampedPct >= 90.0 || stars >= 5) {
              fillEl.classList.add('platinum-phase');
              const platNode = document.getElementById('hudPlatinumNode');
              if (platNode) platNode.classList.remove('hidden');
            } else {
              fillEl.classList.remove('platinum-phase');
              const platNode = document.getElementById('hudPlatinumNode');
              if (platNode) platNode.classList.add('hidden');
            }
          }

          // Update metallic star nodes (1-5)
          document.querySelectorAll('.star-node').forEach(node => {
            const sNum = parseInt(node.dataset.star, 10);
            if (sNum <= stars) {
              node.classList.add('unlocked');
            } else {
              node.classList.remove('unlocked');
            }
          });

          // Live Medal Pill
          const pill = document.getElementById('hudMedalPill');
          const medalName = document.getElementById('hudMedalName');
          if (pill && medalName) {
            if (pct >= 90.0 || stars >= 5 || medalTier === 'platinum') {
              pill.className = 'hud-medal-pill platinum mt-1';
              medalName.innerText = 'PLATINO';
            } else if (pct >= 75.0 || stars >= 4 || medalTier === 'gold') {
              pill.className = 'hud-medal-pill gold mt-1';
              medalName.innerText = 'ORO';
            } else {
              pill.className = 'hud-medal-pill hidden mt-1';
            }
          }

          // Animacion fisica del marcador mecanico de rodillos (7 digitos, hasta 9,999,999)
          const scoreStr = String(Math.min(9999999, Math.max(0, Math.floor(score)))).padStart(7, "0");
          for (let d = 0; d < 7; d++) {
            const strip = document.getElementById(`rollerDigit${6 - d}`);
            if (strip) {
              const digitVal = parseInt(scoreStr[d], 10) || 0;
              strip.style.transform = `translateY(-${digitVal * 24}px)`;
            }
          }
          const scoreEl = document.getElementById("hudScore");
          if (scoreEl) scoreEl.innerText = Math.floor(score).toLocaleString();

          // Marcador de multiplicador / combo tipo tragaperras
          const gasMultVal = document.getElementById("hudGasMultiplierVal");
          if (gasMultVal) gasMultVal.innerText = multiplier || 1;
          const gasBadge = document.getElementById("hudSlotComboBadge");
          if (gasBadge) {
            gasBadge.className = `hud-gas-combo-badge ${multiplier >= 4 ? 'max-mult' : (multiplier >= 3 ? 'high-mult' : (multiplier >= 2 ? 'med-mult' : ''))}`;
          }

          const comboEl = document.getElementById("hudCombo");
          if (comboEl) comboEl.innerText = `COMBO ${combo}`;

          const comboContainer = document.getElementById("hudComboContainer");
          if (comboContainer && combo > 0) {
            comboContainer.classList.remove("combo-beat-pulse");
            requestAnimationFrame(() => {
              comboContainer.classList.add("combo-beat-pulse");
            });
          }

          const multEl = document.getElementById("hudMultiplier");
          if (multEl) {
            multEl.innerText = `${multiplier}x`;
            multEl.className = `multiplier-badge ${multiplier >= 2 ? "x" + multiplier : ""}`;
          }
        },
        onStarUnlocked: (starNum, isPlatinum) => {
          const node = document.querySelector(`.star-node[data-star="${starNum}"]`);
          if (node) {
            node.classList.add('unlocked');
            const sw = document.createElement('div');
            sw.className = 'star-shockwave';
            node.appendChild(sw);
            setTimeout(() => {
              if (sw && sw.parentNode) sw.parentNode.removeChild(sw);
            }, 380);
          }
        },
        onHitBeatPulse: (combo) => {
          const box = document.getElementById('hudComboContainer');
          if (box) {
            box.classList.remove('beat-pulse');
            requestAnimationFrame(() => {
              box.classList.add('beat-pulse');
            });
            box.classList.remove('streak-25', 'streak-50', 'streak-100');
            if (combo >= 100) box.classList.add('streak-100');
            else if (combo >= 50) box.classList.add('streak-50');
            else if (combo >= 25) box.classList.add('streak-25');
          }
        },
        onSongLoaded: (meta, palette) => {
          const hudSongTitleEl = document.getElementById('hudSongTitle');
          if (hudSongTitleEl) hudSongTitleEl.innerText = meta.title || 'Canción Desconocida';
          const pauseSongTitleEl = document.getElementById('pauseSongTitle');
          if (pauseSongTitleEl) pauseSongTitleEl.innerText = meta.title || 'Canción Desconocida';
          const coverEl = document.getElementById('hudPortalCover');
          if (coverEl) {
            coverEl.src = meta.cover_url || meta.cover || meta.album_art || meta.image || './app_logo.png';
          }
          if (typeof pauseMenuAmbientMusic === 'function') pauseMenuAmbientMusic();
          if (typeof updateUserWalletDisplay === 'function') updateUserWalletDisplay();
        },
        onTogglePause: () => {
          openPauseModal();
        },
        onResume: () => {
          resumeGame();
        },
        onShowRewindBadge: () => {
          const badge = document.getElementById('rewindBadgeOverlay');
          if (badge) {
            badge.classList.add('show');
            setTimeout(() => {
              badge.classList.remove('show');
            }, 600);
          }
        },
        onStartCountdown: (durationMs) => {
          if (activeCountdownInterval) {
            clearInterval(activeCountdownInterval);
            activeCountdownInterval = null;
          }

          const overlay = document.getElementById('startCountdownOverlay');
          const numEl = document.getElementById('startCountdownNumber');
          const curtain = document.getElementById('gameCurtain');
          if (curtain) curtain.classList.add('revealed');

          if (!overlay || !numEl) return;

          overlay.classList.remove('fading');
          overlay.classList.add('show');
          const stepMs = (durationMs || 1200) / 3;
          let count = 3;
          numEl.innerText = count;
          numEl.style.animation = 'none';
          void numEl.offsetHeight;
          numEl.style.animation = null;

          activeCountdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
              numEl.innerText = count;
              numEl.style.animation = 'none';
              void numEl.offsetHeight;
              numEl.style.animation = null;
            } else if (count === 0) {
              numEl.innerText = '\u00a1YA!';
              numEl.style.animation = 'none';
              void numEl.offsetHeight;
              numEl.style.animation = null;
              clearInterval(activeCountdownInterval);
              activeCountdownInterval = null;
              // Fade out the overlay after a short moment
              setTimeout(() => {
                overlay.classList.remove('show');
                overlay.classList.add('fading');
                setTimeout(() => overlay.classList.remove('fading'), 250);
              }, stepMs * 0.7);
            }
          }, stepMs);
        },
        onMissPenalty: (penaltyCost, missCount, score) => {
          if (typeof pauseMenuAmbientMusic === 'function') pauseMenuAmbientMusic();
          currentPenaltyCost = penaltyCost;
          const currentScore = score !== undefined ? score : (window.engine ? window.engine.score : 0);
          const costVal = document.getElementById('reviveCostVal');
          if (costVal) costVal.innerText = penaltyCost;
          const btnCost = document.getElementById('btnPayReviveCost');
          if (btnCost) btnCost.innerText = penaltyCost;
          const scoreVal = document.getElementById('reviveScoreVal');
          if (scoreVal) scoreVal.innerText = currentScore.toLocaleString();
          const reviveModal = document.getElementById('reviveModal');
          if (reviveModal) {
            reviveModal.style.display = 'flex';
            reviveModal.classList.add('open');
          }

          // Desencadenar animación analógica y sonido de máquina de escribir vintage
          triggerVintageDeathScreen(currentScore, penaltyCost);
        },
        onMetronomeBeat: () => {
          const el = document.getElementById('metronomeIndicator');
          if (el) {
            el.classList.add('beat');
            setTimeout(() => el.classList.remove('beat'), 130);
          }
        },
        onGameEnd: (score, maxCombo, stars, stats, earnedClefs, finalMedal, scorePct, earnedMedals, totalNotes = 0, accuracyPct = 100.0) => {
          if (typeof pauseMenuAmbientMusic === 'function') pauseMenuAmbientMusic();
          addClefs(earnedClefs);
          if (earnedMedals) {
            addMedals(earnedMedals.silver || 0, earnedMedals.gold || 0, earnedMedals.platinum || 0);
          }
          const songId = currentActiveBeatmap?.communityChartId || currentActiveBeatmap?.metadata?.id || currentActiveBeatmap?.id || 'song';
          const isNewRecord = saveHighscore(songId, score, stars, maxCombo, finalMedal, scorePct);
          showResults(score, maxCombo, stars, stats, earnedClefs, isNewRecord, finalMedal, scorePct, earnedMedals, totalNotes, accuracyPct);
        }
      });
      window.engine = engine;

      function bindBtn(id, fn) {
        const el = document.getElementById(id);
        if (el) el.onclick = (e) => { if (e) e.preventDefault(); fn(); };
      }

      bindBtn('btnOpenSettings', openSettingsModal);
      bindBtn('btnCloseSettings', closeSettingsModal);
      bindBtn('btnSettingsOpenCalib', openNativeCalibration);
      bindBtn('btnSettingsOpenImport', openYTMusicModal);
      bindBtn('btnExitCalib', saveAndExitCalibration);
      bindBtn('btnCloseYTMModal', closeYTMusicModal);
      bindBtn('btnPauseGame', openPauseModal);
      bindBtn('btnResumeGame', resumeGame);
      bindBtn('btnRestartGame', restartGame);
      bindBtn('btnExitGame', exitToSearch);

      const savedOffset = localStorage.getItem('beatstar_offset') || '0';
      updateOffset(savedOffset);

      // Recuperar medio de fondo personalizado guardado en IndexedDB (vídeo o imagen)
      if (typeof IndexedDBStorage !== 'undefined') {
        IndexedDBStorage.getCustomMedia().then(record => {
          if (record && record.blob && engine) {
            const url = URL.createObjectURL(record.blob);
            window.customBgMediaBlobUrl = url;
            window.customBgMediaType = record.mediaType || 'image';
            const bgMode = localStorage.getItem('beatstar_bg_mode') || 'black';
            const bgOpacity = parseFloat(localStorage.getItem('beatstar_bg_opacity') || '0.40') || 0.40;
            engine.setCustomBackground(url, record.mediaType || 'image', bgMode, bgOpacity);
            const cropX = parseFloat(localStorage.getItem('beatstar_bg_crop_x') || '0.5');
            const cropY = parseFloat(localStorage.getItem('beatstar_bg_crop_y') || '0.5');
            const zoom = parseFloat(localStorage.getItem('beatstar_bg_crop_zoom') || '1.0');
            const fit = localStorage.getItem('beatstar_bg_fit') || 'cover';
            engine.setCustomBgTransform(cropX, cropY, zoom, fit);
            if (typeof renderFXShopBackgroundPanel === 'function') {
              renderFXShopBackgroundPanel();
            }
          }
        }).catch(err => console.warn('Error loading custom media from IndexedDB:', err));
      }

      executeSearch();
      renderCurrentLibrarySubtab();
      loadDailyFeaturedSongs();
    });


    function switchLibrarySubtab(subtab) {
      currentLibrarySubtab = subtab;
      
      const subtabDownloadsBtn = document.getElementById('subtabDownloadsBtn');
      const subtabFavoritesBtn = document.getElementById('subtabFavoritesBtn');
      const subtabPlaylistsBtn = document.getElementById('subtabPlaylistsBtn');

      const downloadsCont = document.getElementById('subtabDownloadsContainer');
      const favoritesCont = document.getElementById('subtabFavoritesContainer');
      const playlistsCont = document.getElementById('subtabPlaylistsContainer');

      [subtabDownloadsBtn, subtabFavoritesBtn, subtabPlaylistsBtn].forEach(b => b.classList.remove('active'));
      [downloadsCont, favoritesCont, playlistsCont].forEach(c => c.classList.add('hidden'));

      if (subtab === 'downloads') {
        subtabDownloadsBtn.classList.add('active');
        downloadsCont.classList.remove('hidden');
        renderDownloadsSubtab();
      } else if (subtab === 'favorites') {
        subtabFavoritesBtn.classList.add('active');
        favoritesCont.classList.remove('hidden');
        renderFavoritesSubtab();
      } else if (subtab === 'playlists') {
        subtabPlaylistsBtn.classList.add('active');
        playlistsCont.classList.remove('hidden');
        renderPlaylistsSubtab();
      }
    }

    function renderCurrentLibrarySubtab() {
      switchLibrarySubtab(currentLibrarySubtab);
    }

    function showErrorToast(msg) {
      const toast = document.getElementById('errorToast');
      document.getElementById('errorToastIcon').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      document.getElementById('errorToastMsg').innerText = msg;
      toast.classList.remove('success-toast');
      toast.classList.add('show');

      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => hideErrorToast(), 5000);
    }

    function showSuccessToast(msg) {
      const toast = document.getElementById('errorToast');
      document.getElementById('errorToastIcon').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>';
      document.getElementById('errorToastMsg').innerText = msg;
      toast.classList.add('success-toast', 'show');

      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => hideErrorToast(), 4000);
    }

    function hideErrorToast() {
      document.getElementById('errorToast').classList.remove('show');
    }

    function updateOffset(val) {
      const num = parseInt(val, 10) || 0;
      const formatted = `${num > 0 ? '+' : ''}${num} ms`;
      
      const calibSlider = document.getElementById('calibOffsetSlider');
      const calibVal = document.getElementById('calibOffsetVal');
      const pauseSlider = document.getElementById('pauseOffsetSlider');
      const pauseVal = document.getElementById('pauseOffsetVal');

      if (calibSlider) calibSlider.value = num;
      if (calibVal) calibVal.innerText = formatted;
      if (pauseSlider) pauseSlider.value = num;
      if (pauseVal) pauseVal.innerText = formatted;

      if (engine) engine.setLatencyOffset(num);
    }

    function nudgeOffset(delta) {
      const current = parseInt(localStorage.getItem('beatstar_offset') || '0', 10);
      const next = Math.max(-1000, Math.min(1000, current + delta));
      updateOffset(next);
    }

function switchMainTab(tab) {
  currentActiveTab = tab;
  const searchTabBtn = document.getElementById('tabSearchBtn');
  const discoverTabBtn = document.getElementById('tabDiscoverBtn');
  const libraryTabBtn = document.getElementById('tabLibraryBtn');
  const editorTabBtn = document.getElementById('tabEditorBtn');

  const searchSection = document.getElementById('tabSearchSection');
  const discoverSection = document.getElementById('tabDiscoverSection');
  const librarySection = document.getElementById('tabLibrarySection');
  const editorSection = document.getElementById('tabEditorSection');

  [searchTabBtn, discoverTabBtn, libraryTabBtn, editorTabBtn].forEach(b => b && b.classList.remove('active'));
  [searchSection, discoverSection, librarySection, editorSection].forEach(s => {
    if (s) {
      s.classList.add('hidden');
      s.style.display = 'none';
    }
  });

  if (tab === 'search') {
    if (searchTabBtn) searchTabBtn.classList.add('active');
    if (searchSection) {
      searchSection.classList.remove('hidden');
      searchSection.style.display = 'block';
    }
  } else if (tab === 'discover') {
    if (discoverTabBtn) discoverTabBtn.classList.add('active');
    if (discoverSection) {
      discoverSection.classList.remove('hidden');
      discoverSection.style.display = 'block';
    }
  } else if (tab === 'library') {
    if (libraryTabBtn) libraryTabBtn.classList.add('active');
    if (librarySection) {
      librarySection.classList.remove('hidden');
      librarySection.style.display = 'block';
    }
    renderCurrentLibrarySubtab();
  } else if (tab === 'editor') {
    if (editorTabBtn) editorTabBtn.classList.add('active');
    if (editorSection) {
      editorSection.classList.remove('hidden');
      editorSection.style.display = 'block';
    }
    requestAnimationFrame(() => {
      try {
        if (typeof ChartEditor !== 'undefined') {
          ChartEditor.init();
          ChartEditor.resizeCanvas();
          ChartEditor.draw();
        }
      } catch (err) {
        console.error('Error inicializando ChartEditor:', err);
      }
    });
  }

  if (tab === 'discover' || tab === 'editor' || tab === 'library') {
    if (typeof checkCreatorNotifications === 'function') {
      checkCreatorNotifications();
    }
  }
}

    // ==========================================
    // FAVORITES & PLAYLIST MODAL ACTIONS
    // ==========================================

    async function toggleFavoriteSong(songId, songObj = null) {
      let targetObj = songObj;
      if (!targetObj) {
        targetObj = searchResultsCache.find(s => s.id === songId);
      }
      if (!targetObj) {
        targetObj = await IndexedDBStorage.getChart(songId);
      }
      if (!targetObj) return;

      const isFav = await IndexedDBStorage.toggleFavorite(targetObj);
      if (isFav) {
        favoriteIdsSet.add(songId);
        showSuccessToast(`Añadida a favoritos: ${targetObj.title}`);
      } else {
        favoriteIdsSet.delete(songId);
        showSuccessToast(`Eliminada de favoritos: ${targetObj.title}`);
      }

      document.querySelectorAll(`.heart-btn[data-id="${songId}"]`).forEach(btn => {
        if (isFav) {
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#e5b869" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';
          btn.classList.add('active');
        } else {
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';
          btn.classList.remove('active');
        }
      });

      if (currentLibrarySubtab === 'favorites') {
        renderFavoritesSubtab();
      }
    }

    async function openAddToPlaylistModal(songId) {
      let song = searchResultsCache.find(s => s.id === songId);
      if (!song) {
        song = await IndexedDBStorage.getChart(songId);
      }
      if (!song) {
        const favs = await IndexedDBStorage.getAllFavorites();
        song = favs.find(f => f.id === songId);
      }
      if (!song) return;

      songPendingAddToPlaylist = song;
      document.getElementById('addToPlaylistSongTitle').innerText = `${song.title} - ${song.artist}`;

      const playlists = await IndexedDBStorage.getAllPlaylists();
      const listCont = document.getElementById('availablePlaylistsList');

      if (!playlists || playlists.length === 0) {
        listCont.innerHTML = `<p class="text-[10px] text-gray-400 text-center py-2">No tienes playlists creadas todavía.</p>`;
      } else {
        listCont.innerHTML = playlists.map(pl => {
          return `
            <div onclick="addPendingSongToPlaylist('${pl.id}')" class="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-between cursor-pointer transition">
              <span class="text-xs font-bold text-white truncate max-w-[200px] flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> ${pl.title}</span>
              <span class="text-[9px] font-mono text-cyan-300 font-bold">${pl.tracks ? pl.tracks.length : 0} temas</span>
            </div>
          `;
        }).join('');
      }

      const modal = document.getElementById('addToPlaylistModal');
      modal.style.display = 'flex';
      modal.classList.add('open');
    }

    function closeAddToPlaylistModal() {
      const modal = document.getElementById('addToPlaylistModal');
      modal.classList.remove('open');
      modal.style.display = 'none';
      songPendingAddToPlaylist = null;
    }

    async function addPendingSongToPlaylist(playlistId) {
      if (!songPendingAddToPlaylist) return;
      try {
        await IndexedDBStorage.addTrackToPlaylist(playlistId, songPendingAddToPlaylist);
        showSuccessToast(`Añadida a la playlist.`);
        closeAddToPlaylistModal();
        if (currentLibrarySubtab === 'playlists') {
          renderPlaylistsSubtab();
        }
      } catch (err) {
        showErrorToast(err.message);
      }
    }

    async function createPlaylistAndAddCurrentSong() {
      const input = document.getElementById('newPlaylistNameInput');
      const name = input.value.trim();
      if (!name) {
        showErrorToast('Por favor escribe un nombre para la playlist.');
        return;
      }

      const newPl = {
        id: 'pl_' + Date.now(),
        title: name,
        item_count: songPendingAddToPlaylist ? 1 : 0,
        tracks: songPendingAddToPlaylist ? [songPendingAddToPlaylist] : [],
        createdAt: Date.now()
      };

      await IndexedDBStorage.savePlaylist(newPl);
      input.value = '';
      showSuccessToast(`Playlist "${name}" creada.`);
      closeAddToPlaylistModal();

      if (currentLibrarySubtab === 'playlists') {
        renderPlaylistsSubtab();
      }
    }

    // ==========================================
    // MULTI-TIER CORS FETCH HELPER & SEARCH ENGINE
    // ==========================================

    async function fetchWithCorsFallback(url, options = {}, timeoutMs = 8000) {
      const fetchWithTimeout = async (targetUrl, customHeaders = {}) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const headers = { ...options.headers, ...customHeaders };
          const resp = await fetch(targetUrl, { ...options, headers, signal: controller.signal });
          clearTimeout(id);
          if (!resp.ok) throw new Error(`HTTP ${resp.status} (${resp.statusText})`);
          return resp;
        } catch (err) {
          clearTimeout(id);
          throw err;
        }
      };

      const errors = [];

      // Si es URL relativa o del backend local
      if (url.startsWith('/')) {
        try {
          const resp = await fetchWithTimeout(url);
          return await resp.json();
        } catch (err) {
          errors.push(`Local: ${err.message}`);
        }
      }

      // 1. Intento Directo (ultra rápido si la API soporta CORS como catboy o nerinyan)
      if (url.startsWith('http')) {
        try {
          const resp = await fetchWithTimeout(url);
          return await resp.json();
        } catch (err) {
          errors.push(`Directo: ${err.message}`);
        }
      }

      // 2. Intento vía Cloudflare Worker dedicado (Infalible y sin límites)
      if (url.startsWith('http')) {
        try {
          const workerUrl = `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(url)}`;
          const resp = await fetchWithTimeout(workerUrl);
          return await resp.json();
        } catch (err) {
          errors.push(`Worker: ${err.message}`);
        }
      }

      // 3. Intento vía Proxy Backend Local (si FastAPI está disponible)
      if (url.startsWith('http')) {
        const baseUrl = getApiBaseUrl();
        const localProxyUrl = baseUrl ? `${baseUrl}/api/proxy?url=${encodeURIComponent(url)}` : `/api/proxy?url=${encodeURIComponent(url)}`;
        try {
          const resp = await fetchWithTimeout(localProxyUrl);
          return await resp.json();
        } catch (err) {
          errors.push(`Proxy local: ${err.message}`);
        }
      }

      throw new Error(errors[errors.length - 1] || 'No se pudo conectar con el servidor');
    }

    async function searchOsuMania(query) {
      const results = [];
      const seenSetIds = new Set();
      const myWorker = (u) => `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(u)}`;

      // Helper resiliente: Consulta directa primero y fallback a través del Worker
      const fetchJsonWithWorker = async (targetUrl, timeoutMs = 5000) => {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), timeoutMs);
          const r = await fetch(targetUrl, { signal: ctrl.signal });
          clearTimeout(tid);
          if (r.ok) return await r.json();
        } catch (e) {}

        try {
          const ctrl2 = new AbortController();
          const tid2 = setTimeout(() => ctrl2.abort(), timeoutMs + 2500);
          const r2 = await fetch(myWorker(targetUrl), { signal: ctrl2.signal });
          clearTimeout(tid2);
          if (r2.ok) return await r2.json();
        } catch (e) {}
        return null;
      };

      // 1. SERVIDOR PRIMARIO: Catboy v2 (Ultra rápido y enfocado a mania)
      try {
        const catboyV2Url = `https://catboy.best/api/v2/search?q=${encodeURIComponent(query)}&m=3`;
        const catboyData = await fetchJsonWithWorker(catboyV2Url, 4500);
        const catboyItems = Array.isArray(catboyData) ? catboyData : (catboyData?.data || []);

        for (const item of catboyItems.slice(0, 20)) {
          try {
            const setId = item.id;
            if (!setId || seenSetIds.has(setId)) continue;
            seenSetIds.add(setId);

            const title = item.title || 'Sin título';
            const artist = item.artist || 'Desconocido';
            const creator = item.creator || (item.user && item.user.username) || 'osu! Mapper';
            const thumbnail = item.covers?.card || item.covers?.cover || `https://assets.ppy.sh/beatmaps/${setId}/covers/card.jpg`;

            const beatmaps = item.beatmaps || [];
            let diffs = beatmaps
              .filter(b => b.mode === 3 || b.mode_int === 3 || String(b.mode) === 'mania' || beatmaps.length <= 2)
              .map(b => {
                const stars = Math.round(parseFloat(b.difficulty_rating || 0.0) * 10) / 10;
                const name = b.version || `Key ${b.cs || 4}`;
                return {
                  id: String(b.id),
                  name: name,
                  stars: stars,
                  keys: parseInt(b.cs || 4, 10),
                  label: `${name} (${stars.toFixed(1)}★)`
                };
              });

            if (diffs.length === 0 && beatmaps.length > 0) {
              diffs = beatmaps.map(b => {
                const stars = Math.round(parseFloat(b.difficulty_rating || 0.0) * 10) / 10;
                const name = b.version || 'Normal';
                return {
                  id: String(b.id),
                  name: name,
                  stars: stars,
                  keys: parseInt(b.cs || 4, 10),
                  label: `${name} (${stars.toFixed(1)}★)`
                };
              });
            }

            diffs.sort((a, b) => a.stars - b.stars);

            if (diffs.length > 0) {
              results.push({
                id: `osu_${setId}`,
                source: 'osu',
                source_name: 'osu!',
                source_badge: '[osu!]',
                source_color: '#ff007f',
                title: title,
                artist: artist,
                creator: creator,
                thumbnail: thumbnail,
                download_url: `/api/v1/download/osu/${setId}`,
                direct_download_url: `https://api.nerinyan.moe/d/${setId}?noVideo=true`,
                fallback_download_url: `https://dl.nerinyan.moe/v2/d/${setId}?noVideo=true`,
                bpm: item.bpm || 120,
                difficulties: diffs
              });
            }
          } catch (ex) {
            console.debug('Error parseando item catboy v2:', ex);
          }
        }
      } catch (catErr) {
        console.warn('Catboy v2 search error:', catErr);
      }

      // 2. SERVIDOR SECUNDARIO (Fallback inmediato): Sayobot
      try {
        const sayoUrl = `https://api.sayobot.cn/beatmaplist?0=20&1=0&2=4&m=3&cmd=search&keyword=${encodeURIComponent(query)}`;
        const sayoData = await fetchJsonWithWorker(sayoUrl, 5000);
        const sayoItems = sayoData?.data || (Array.isArray(sayoData) ? sayoData : []);

        for (const item of sayoItems.slice(0, 15)) {
          try {
            const setId = item.sid;
            if (!setId || seenSetIds.has(setId)) continue;
            seenSetIds.add(setId);

            const title = item.title || item.titleU || 'Sin título';
            const artist = item.artist || item.artistU || 'Desconocido';
            const creator = item.creator || 'osu! Mapper';
            const thumbnail = `https://assets.ppy.sh/beatmaps/${setId}/covers/card.jpg`;

            const bidData = item.bid_data || [];
            const diffs = bidData.map(b => {
              const stars = Math.round(parseFloat(b.star || 0.0) * 10) / 10;
              const name = b.version || `Key ${b.mode === 3 ? 4 : 4}`;
              return {
                id: String(b.bid),
                name: name,
                stars: stars,
                keys: 4,
                label: `${name} (${stars.toFixed(1)}★)`
              };
            });

            diffs.sort((a, b) => a.stars - b.stars);

            if (diffs.length > 0) {
              results.push({
                id: `osu_${setId}`,
                source: 'osu',
                source_name: 'osu!',
                source_badge: '[osu!]',
                source_color: '#ff007f',
                title: title,
                artist: artist,
                creator: creator,
                thumbnail: thumbnail,
                download_url: `/api/v1/download/osu/${setId}`,
                direct_download_url: `https://api.nerinyan.moe/d/${setId}?noVideo=true`,
                fallback_download_url: `https://dl.nerinyan.moe/v2/d/${setId}?noVideo=true`,
                bpm: item.bpm || 120,
                difficulties: diffs
              });
            }
          } catch (ex) {
            console.debug('Error parseando sayobot:', ex);
          }
        }
      } catch (sayoErr) {
        console.debug('Sayobot search fallback:', sayoErr);
      }

      // 3. SERVIDOR TERCIARIO: Mino / Catboy v1
      if (results.length < 5) {
        try {
          const minoUrl = `https://catboy.best/api/search?q=${encodeURIComponent(query)}&m=3`;
          const minoData = await fetchJsonWithWorker(minoUrl, 5000);
          const minoItems = Array.isArray(minoData) ? minoData : (minoData?.data || []);

          for (const item of minoItems.slice(0, 15)) {
            try {
              const setId = item.id || item.SetId;
              if (!setId || seenSetIds.has(setId)) continue;
              seenSetIds.add(setId);

              const title = item.title || item.Title || 'Sin título';
              const artist = item.artist || item.Artist || 'Desconocido';
              const creator = item.creator || item.Creator || 'osu! Mapper';
              const thumbnail = item.covers?.card || `https://assets.ppy.sh/beatmaps/${setId}/covers/card.jpg`;

              const beatmaps = item.beatmaps || item.ChildrenBeatmaps || [];
              const diffs = beatmaps.map(b => {
                const stars = Math.round(parseFloat(b.difficulty_rating || b.DifficultyRating || b.DiffStarRating || 0.0) * 10) / 10;
                const name = b.version || b.DiffName || 'Mania';
                return {
                  id: String(b.id || b.BeatmapId),
                  name: name,
                  stars: stars,
                  keys: parseInt(b.cs || b.CS || 4, 10),
                  label: `${name} (${stars.toFixed(1)}★)`
                };
              });

              diffs.sort((a, b) => a.stars - b.stars);

              if (diffs.length > 0) {
                results.push({
                  id: `osu_${setId}`,
                  source: 'osu',
                  source_name: 'osu!',
                  source_badge: '[osu!]',
                  source_color: '#ff007f',
                  title: title,
                  artist: artist,
                  creator: creator,
                  thumbnail: thumbnail,
                  download_url: `/api/v1/download/osu/${setId}`,
                  direct_download_url: `https://api.nerinyan.moe/d/${setId}?noVideo=true`,
                  fallback_download_url: `https://dl.nerinyan.moe/v2/d/${setId}?noVideo=true`,
                  bpm: item.bpm || item.BPM || 120,
                  difficulties: diffs
                });
              }
            } catch (ex) {
              console.debug('Error parseando mino:', ex);
            }
          }
        } catch (minoErr) {
          console.debug('Mino search fallback:', minoErr);
        }
      }

      console.log(`[Search] osu! Mania entregó ${results.length} resultados válidos.`);
      return results;
    }

    async function searchCloneHero(query) {
      const candidates = [
        () => {
          const c = new AbortController();
          const tid = setTimeout(() => c.abort(), 6000);
          return fetch('https://api.enchor.us/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search: query, page: 1, source: 'website' }),
            signal: c.signal
          }).then(r => { clearTimeout(tid); if (r.ok) return r.json(); throw new Error('HTTP ' + r.status); });
        },
        () => {
          const c = new AbortController();
          const tid = setTimeout(() => c.abort(), 6000);
          return fetch(`https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(`https://api.enchor.us/search`)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ search: query, page: 1, source: 'website' }), signal: c.signal }).then(r => { clearTimeout(tid); if (r.ok) return r.json(); throw new Error('HTTP ' + r.status); });
        }
      ];

      let data = null;
      try {
        data = await Promise.any(candidates.map(fn => fn()));
      } catch (err) {
        console.warn('Clone Hero search candidates failed:', err);
        console.log('[Search] Clone Hero entregó 0 resultados válidos.');
        return [];
      }

      const items = data.data || data.songs || (Array.isArray(data) ? data : []);
      const results = [];

      for (const [idx, item] of items.slice(0, 20).entries()) {
        try {
          const chartId = item.chartId || item.songId || item.id || `ch_${idx}_${Date.now()}`;
          const name = item.name || item.title || 'Sin título';
          const artist = item.artist || 'Desconocido';
          const charter = item.charter || item.charterName || 'Clone Hero Charter';
          const bpm = item.bpm || 120;
          const driveFileId = item.driveFileId || null;
          const parentFolderId = item.parentFolderId || null;

          // Extraer URL de descarga directa: Prioridad 1 CDN Enchor (.sng)
          const sngUrl = item.md5 ? `https://files.enchor.us/${item.md5}.sng` : '';
          let directDl = sngUrl || item.download_url || item.directDownloadUrl || item.downloadUrl || item.sngDownloadUrl || item.sngUrl || '';

          if (!directDl && driveFileId) {
            directDl = `https://drive.google.com/uc?export=download&id=${driveFileId}&confirm=t`;
          }

          if (!directDl && !driveFileId && !item.md5) continue;

          // Extraer dificultades
          const diffs = [];
          if (item.diff_guitar !== undefined && item.diff_guitar !== null && item.diff_guitar >= 0) {
            const starVal = parseFloat(item.diff_guitar) > 0 ? parseFloat(item.diff_guitar) : 4.5;
            diffs.push({
              id: 'ExpertSingle',
              name: 'Expert Single',
              stars: starVal,
              keys: 5,
              label: `Expert Single (${starVal.toFixed(1)}★)`
            });
          }

          if (item.notesData && item.notesData.noteCounts && Array.isArray(item.notesData.noteCounts)) {
            for (const nc of item.notesData.noteCounts) {
              const dName = nc.difficulty || 'Expert';
              const diffKey = `${dName.charAt(0).toUpperCase() + dName.slice(1)}Single`;
              if (!diffs.some(d => d.id === diffKey || d.name.toLowerCase() === dName.toLowerCase())) {
                diffs.push({
                  id: diffKey,
                  name: `${dName.charAt(0).toUpperCase() + dName.slice(1)} Single`,
                  stars: dName.toLowerCase().includes('hard') ? 3.5 : (dName.toLowerCase().includes('medium') ? 2.5 : (dName.toLowerCase().includes('easy') ? 1.5 : 4.5)),
                  keys: 5,
                  label: `${dName.charAt(0).toUpperCase() + dName.slice(1)}`
                });
              }
            }
          }

          if (diffs.length === 0) {
            diffs.push({
              id: 'ExpertSingle',
              name: 'Expert Single',
              stars: 4.5,
              keys: 5,
              label: 'Expert Single (4.5★)'
            });
            diffs.push({
              id: 'HardSingle',
              name: 'Hard Single',
              stars: 3.5,
              keys: 5,
              label: 'Hard Single (3.5★)'
            });
          }

          let thumbnail = GENERIC_THUMBNAIL;
          if (item.albumArtMd5) {
            thumbnail = `https://api.enchor.us/albumart/${item.albumArtMd5}`;
          } else if (item.thumbnail) {
            thumbnail = item.thumbnail;
          }

          const downloadEndpoint = sngUrl || directDl || (driveFileId ? `/api/v1/download/gdrive/${driveFileId}` : '');

          results.push({
            id: `clonehero_${chartId}`,
            source: 'clonehero',
            source_name: 'Clone Hero',
            source_badge: '[Clone Hero]',
            source_color: '#b142ff',
            title: name,
            artist: artist,
            creator: charter,
            thumbnail: thumbnail,
            download_url: downloadEndpoint,
            direct_download_url: downloadEndpoint,
            fallback_download_url: sngUrl || `/api/proxy?url=${encodeURIComponent(directDl)}`,
            drive_id: driveFileId,
            parent_folder_id: parentFolderId,
            md5: item.md5 || '',
            sng_url: sngUrl,
            bpm: Math.round(bpm),
            difficulties: diffs
          });
        } catch (ex) {
          console.debug('Error parsing Clone Hero item:', ex);
        }
      }

      console.log(`[Search] Clone Hero entregó ${results.length} resultados válidos.`);
      return results;
    }

    let currentTargetDifficulty = 'all';

    function setTargetDifficulty(val) {
      currentTargetDifficulty = val === 'all' ? 'all' : parseFloat(val);

      const sel = document.getElementById('targetDiffSelect');
      if (sel && sel.value !== String(val)) {
        sel.value = String(val);
      }

      const diffMap = { '2': 'Fácil', '3': 'Media', '5': 'Difícil', '7': 'Extrema', 'all': 'Todas' };
      if (typeof communityDiffFilter !== 'undefined') {
        communityDiffFilter = diffMap[String(val)] || 'Todas';
      }

      const isCommunityOnly = Boolean(document.getElementById('filterOnlyCommunity')?.checked);
      if (isCommunityOnly) {
        executeSearch();
        return;
      }

      // Re-sort and render results immediately if cache exists
      if (searchResultsCache && searchResultsCache.length > 0) {
        const sorted = sortItemsByTargetDifficulty(searchResultsCache, currentTargetDifficulty);
        renderSearchResults(sorted, []);
      }
    }

    function toggleSearchFilterDropdown(event) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      const dd = document.getElementById('searchFilterDropdown');
      if (dd) dd.classList.toggle('show');
    }

    function onFilterCommunityChange(isCommunityOnly) {
      const badge = document.getElementById('activeFilterBadge');
      const commSort = document.getElementById('commSortButtons');
      if (badge) {
        badge.innerText = isCommunityOnly ? 'Comunidad' : 'Global';
      }
      if (commSort) {
        if (isCommunityOnly) {
          commSort.classList.remove('hidden');
          commSort.classList.add('flex');
        } else {
          commSort.classList.add('hidden');
          commSort.classList.remove('flex');
        }
      }
      executeSearch();
    }

    document.addEventListener('click', (e) => {
      const dd = document.getElementById('searchFilterDropdown');
      const btn = document.getElementById('btnToggleSearchFilter');
      if (dd && dd.classList.contains('show')) {
        if (!dd.contains(e.target) && !btn?.contains(e.target)) {
          dd.classList.remove('show');
        }
      }
    });

    function sortItemsByTargetDifficulty(items, target) {
      if (!items || items.length === 0) return [];
      if (target === 'all') return [...items];

      const targetNum = parseFloat(target);
      return [...items].sort((a, b) => {
        const diffsA = (a.difficulties || []).map(d => d.stars || 3.0);
        const minDistA = diffsA.length > 0 ? Math.min(...diffsA.map(s => Math.abs(s - targetNum))) : 99;

        const diffsB = (b.difficulties || []).map(d => d.stars || 3.0);
        const minDistB = diffsB.length > 0 ? Math.min(...diffsB.map(s => Math.abs(s - targetNum))) : 99;

        if (Math.abs(minDistA - minDistB) > 0.05) {
          return minDistA - minDistB;
        }
        return 0;
      });
    }

    function withTimeout(promise, ms = 12000, name = 'Servicio') {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${name}: tiempo de espera agotado`)), ms))
      ]);
    }

    
    // ==========================================
    //  MENU BACKGROUND MUSIC (AUTHENTIC USER AUDIO FILE)
    // ==========================================
    let menuBgmAudio = null;
    let menuBgmUnlocked = false;
    window.isGameLoadingOrActive = false;

    function getMenuBgmAudio() {
      if (!menuBgmAudio) {
        menuBgmAudio = new Audio('./songs/renacer/audio.mp3');
        menuBgmAudio.loop = true;
        menuBgmAudio.preload = 'auto';
      }
      return menuBgmAudio;
    }

    function updateMenuAudioVolume() {
      if (!menuBgmAudio) return;
      const isMuted = localStorage.getItem('beatstar_master_muted') === 'true';
      const savedVol = parseFloat(localStorage.getItem('beatstar_master_volume') ?? '1.0');
      menuBgmAudio.volume = isMuted ? 0 : Math.max(0, Math.min(1, savedVol));
    }

    function isGameCurrentlyActive() {
      if (window.isGameLoadingOrActive) return true;
      if (window.engine && (window.engine.isRunning || window.engine.isCountingDown)) return true;
      if (typeof currentActiveBeatmap !== 'undefined' && currentActiveBeatmap !== null) return true;
      if (typeof window.currentActiveBeatmap !== 'undefined' && window.currentActiveBeatmap !== null) return true;
      const searchScreen = document.getElementById('searchScreen');
      if (searchScreen && (searchScreen.classList.contains('hidden') || searchScreen.style.display === 'none')) {
        return true;
      }
      return false;
    }

    function playMenuAmbientMusic() {
      // Si el juego está activo, en carga o en progreso, NUNCA reproducir la música ambiental de menú
      if (isGameCurrentlyActive()) {
        pauseMenuAmbientMusic();
        return;
      }
      const audio = getMenuBgmAudio();
      updateMenuAudioVolume();
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    }

    function pauseMenuAmbientMusic() {
      if (menuBgmAudio) {
        try {
          menuBgmAudio.pause();
          menuBgmAudio.currentTime = 0;
        } catch (_) {}
      }
    }

    function resumeMenuAmbientMusic() {
      // Si el juego o la pantalla de juego están activos, NUNCA reanudar música de menú
      if (isGameCurrentlyActive()) {
        pauseMenuAmbientMusic();
        return;
      }
      const pauseModal = document.getElementById('pauseModal');
      if (pauseModal && (pauseModal.classList.contains('open') || pauseModal.style.display === 'flex' || pauseModal.style.display === 'block')) {
        return;
      }
      const reviveModal = document.getElementById('reviveModal');
      if (reviveModal && (reviveModal.classList.contains('open') || reviveModal.style.display === 'flex' || reviveModal.style.display === 'block')) {
        return;
      }
      const resultsModal = document.getElementById('resultsModal');
      if (resultsModal && (resultsModal.classList.contains('open') || resultsModal.style.display === 'flex' || resultsModal.style.display === 'block')) {
        return;
      }
      playMenuAmbientMusic();
    }

    function initMenuAmbientMusic() {
      if (isGameCurrentlyActive()) return;
      const audio = getMenuBgmAudio();
      updateMenuAudioVolume();
      playMenuAmbientMusic();
    }

    window.pauseMenuAmbientMusic = pauseMenuAmbientMusic;
    window.resumeMenuAmbientMusic = resumeMenuAmbientMusic;
    window.playMenuAmbientMusic = playMenuAmbientMusic;
    window.isGameCurrentlyActive = isGameCurrentlyActive;

    // Inicializar al primer gesto del usuario en la pantalla
    const onFirstUserGesture = () => {
      if (!menuBgmUnlocked) {
        menuBgmUnlocked = true;
        if (!isGameCurrentlyActive()) {
          initMenuAmbientMusic();
        }
      }
      document.removeEventListener('pointerdown', onFirstUserGesture);
      document.removeEventListener('keydown', onFirstUserGesture);
    };
    document.addEventListener('pointerdown', onFirstUserGesture, { once: true });
    document.addEventListener('keydown', onFirstUserGesture, { once: true });


    // ==========================================
    //  PIISTAS HISTÓRICAS COMUNITARIAS (100% REALES Y JUGABLES)
    // ==========================================
    const GLOBAL_COMMUNITY_FALLBACKS = [
      { id: 'comm_renacer', title: 'Renacer', artist: 'Piano Community', creator_id: 'creator_piano_comm', creator_name: 'Piano Community', bpm: 100, difficulty_name: 'Normal', stars: 3.5, notes_count: 203, rating_avg: 5.0, votes_count: 184, sync_avg: 100.0, is_community: true, source: 'community', source_name: 'Piano Community', thumbnail: './app_logo.png' },
      { id: 'comm_galaxy_anthem', title: 'Galaxy Anthem (Community 3K)', artist: 'Kowalski', creator_id: 'cr_master', creator_name: 'PianoMaster', bpm: 128, difficulty_name: 'Difícil', stars: 4.5, notes_count: 320, rating_avg: 4.8, votes_count: 5, sync_avg: 100.0, is_community: true, source: 'community', thumbnail: './app_logo.png' },
      { id: 'comm_cyber_frenzy', title: 'Cyber Frenzy', artist: 'SynthRider', creator_id: 'cr_neon', creator_name: 'NeonCharter', bpm: 140, difficulty_name: 'Experto', stars: 6.0, notes_count: 450, rating_avg: 4.9, votes_count: 8, sync_avg: 100.0, is_community: true, source: 'community', thumbnail: './app_logo.png' },
      { id: 'comm_moonlight_flow', title: 'Moonlight Groove', artist: 'Aethel', creator_id: 'cr_chopin', creator_name: 'ChopinGamer', bpm: 115, difficulty_name: 'Normal', stars: 3.0, notes_count: 210, rating_avg: 4.7, votes_count: 4, sync_avg: 100.0, is_community: true, source: 'community', thumbnail: './app_logo.png' },
      { id: 'comm_impuestos', title: 'Impuestos', artist: 'Perro Sánxe', creator_id: 'cr_599315', creator_name: 'Rocky', bpm: 160, difficulty_name: 'Difícil', stars: 5.5, notes_count: 144, rating_avg: 5.0, votes_count: 1, sync_avg: 100.0, is_community: true, source: 'community', thumbnail: './app_logo.png' },
      { id: 'comm_1788769406_7797', title: 'Pikete espacial', artist: 'cecilioge', creator_id: 'cr_191176', creator_name: 'Creador', bpm: 120, difficulty_name: 'Media', stars: 3.5, notes_count: 705, rating_avg: 5.0, votes_count: 1, sync_avg: 100.0, is_community: true, source: 'community', thumbnail: './app_logo.png' },
      { id: 'comm_1789044866_4266', title: 'Flight of the Bumblebee - Rimsky-Korsakov (arr. Rachmaninoff)', artist: 'Comunidad', creator_id: 'cr_4266', creator_name: 'Comunidad', bpm: 144, difficulty_name: 'Difícil', stars: 4.5, notes_count: 269, rating_avg: 5.0, votes_count: 1, sync_avg: 100.0, is_community: true, source: 'community', thumbnail: './app_logo.png' },
      { id: 'comm_1789044857_213', title: 'Impuestos (Perreo Sanxe - El secreto de las ayudas)', artist: 'Perro Sánxe', creator_id: 'cr_599315', creator_name: 'Rocky', bpm: 160, difficulty_name: 'Difícil', stars: 5.5, notes_count: 144, rating_avg: 5.0, votes_count: 1, sync_avg: 100.0, is_community: true, source: 'community', thumbnail: './app_logo.png' },
      { id: 'comm_1788622108_2296', title: 'Unit Test Song', artist: 'Tester', creator_id: 'cr_573828', creator_name: 'TestCharter', bpm: 120, difficulty_name: 'Media', stars: 3.5, notes_count: 150, rating_avg: 5.0, votes_count: 1, sync_avg: 100.0, is_community: true, source: 'community', thumbnail: './app_logo.png' }
    ];

    function fisherYatesShuffle(array) {
      const arr = array.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    let catalogPage = 0;
    let catalogRandomOffset = Math.floor(Math.random() * 80);
    const catalogSeenIds = new Set();
    let catalogIsLoading = false;
    let catalogHasEnded = false;
    let infiniteScrollInitialized = false;

    async function loadInfiniteRandomCatalog(isAppend = false) {
      if (catalogIsLoading || (isAppend && catalogHasEnded)) return;
      catalogIsLoading = true;

      const container = document.getElementById('resultsList');

      if (!isAppend) {
        catalogPage = 0;
        catalogRandomOffset = Math.floor(Math.random() * 80);
        catalogSeenIds.clear();
        catalogHasEnded = false;
        if (container) {
          container.innerHTML = `
            <div class="p-8 text-center text-xs text-amber-300/80 glass-card animate-pulse flex flex-col items-center justify-center gap-2.5">
              <svg class="animate-spin h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
              <span>Explorando canciones aleatorias de la comunidad global...</span>
            </div>
          `;
        }
      } else {
        const loaderEl = document.getElementById('infiniteScrollLoader');
        if (loaderEl) loaderEl.classList.remove('hidden');
      }

      let fetchedSongs = [];
      const myWorker = (u) => `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(u)}`;

      // 1. Consulta al catálogo masivo global de osu! Mania (Catboy v2 con offset aleatorio)
      try {
        const currentOffset = catalogRandomOffset + (catalogPage * 25);
        const catboyUrl = `https://catboy.best/api/v2/search?m=3&s=1&offset=${currentOffset}`;
        let catboyData = null;

        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 4500);
          const r = await fetch(catboyUrl, { signal: ctrl.signal });
          clearTimeout(tid);
          if (r.ok) catboyData = await r.json();
        } catch (e) {}

        if (!catboyData) {
          try {
            const ctrl2 = new AbortController();
            const tid2 = setTimeout(() => ctrl2.abort(), 6000);
            const r2 = await fetch(myWorker(catboyUrl), { signal: ctrl2.signal });
            clearTimeout(tid2);
            if (r2.ok) catboyData = await r2.json();
          } catch (e) {}
        }

        const items = Array.isArray(catboyData) ? catboyData : (catboyData?.data || []);
        if (Array.isArray(items) && items.length > 0) {
          for (const item of items.slice(0, 25)) {
            const setId = item.id;
            if (!setId) continue;
            const songId = `osu_${setId}`;
            if (catalogSeenIds.has(songId)) continue;
            catalogSeenIds.add(songId);

            const title = item.title || 'Sin título';
            const artist = item.artist || 'Desconocido';
            const creator = item.creator || (item.user && item.user.username) || 'osu! Mapper';
            const thumbnail = item.covers?.card || item.covers?.cover || `https://assets.ppy.sh/beatmaps/${setId}/covers/card.jpg`;

            const beatmaps = item.beatmaps || [];
            let diffs = beatmaps
              .filter(b => b.mode === 3 || b.mode_int === 3 || String(b.mode) === 'mania' || beatmaps.length <= 2)
              .map(b => {
                const stars = Math.round(parseFloat(b.difficulty_rating || 0.0) * 10) / 10;
                const name = b.version || `Key ${b.cs || 4}`;
                return {
                  id: String(b.id),
                  name: name,
                  stars: stars,
                  keys: parseInt(b.cs || 4, 10),
                  label: `${name} (${stars.toFixed(1)}★)`
                };
              });

            if (diffs.length === 0 && beatmaps.length > 0) {
              diffs = beatmaps.map(b => {
                const stars = Math.round(parseFloat(b.difficulty_rating || 0.0) * 10) / 10;
                const name = b.version || 'Normal';
                return {
                  id: String(b.id),
                  name: name,
                  stars: stars,
                  keys: parseInt(b.cs || 4, 10),
                  label: `${name} (${stars.toFixed(1)}★)`
                };
              });
            }

            diffs.sort((a, b) => a.stars - b.stars);

            if (diffs.length > 0) {
              fetchedSongs.push({
                id: songId,
                source: 'osu',
                source_name: 'osu!',
                source_badge: '[osu!]',
                source_color: '#ff007f',
                title: title,
                artist: artist,
                creator: creator,
                thumbnail: thumbnail,
                download_url: `/api/v1/download/osu/${setId}`,
                direct_download_url: `https://api.nerinyan.moe/d/${setId}?noVideo=true`,
                fallback_download_url: `https://dl.nerinyan.moe/v2/d/${setId}?noVideo=true`,
                bpm: item.bpm || 120,
                difficulties: diffs
              });
            }
          }
        }
      } catch (catErr) {
        console.warn('Infinite catalog Catboy notice:', catErr);
      }

      // 2. En la primera carga (!isAppend), si falló la red o para poblar de inmediato, combinar canciones locales y comunitarias
      if (!isAppend && fetchedSongs.length === 0) {
        for (const fb of GLOBAL_COMMUNITY_FALLBACKS) {
          if (fb && fb.id && !catalogSeenIds.has(fb.id)) {
            catalogSeenIds.add(fb.id);
            fetchedSongs.push(fb);
          }
        }

        try {
          const cached = JSON.parse(localStorage.getItem('beatstar_community_cache') || '[]');
          if (Array.isArray(cached)) {
            for (const s of cached) {
              if (s && s.id && !catalogSeenIds.has(s.id)) {
                catalogSeenIds.add(s.id);
                fetchedSongs.push(s);
              }
            }
          }
        } catch (e) {}

        if (typeof IndexedDBStorage !== 'undefined' && IndexedDBStorage.getAllCharts) {
          try {
            const localCharts = await IndexedDBStorage.getAllCharts();
            if (Array.isArray(localCharts)) {
              for (const ch of localCharts) {
                const chId = ch.id || ch.song_id;
                if (chId && !catalogSeenIds.has(chId)) {
                  catalogSeenIds.add(chId);
                  fetchedSongs.push({
                    id: chId,
                    title: ch.title || ch.metadata?.title || 'Canción Local',
                    artist: ch.artist || ch.metadata?.artist || 'Artista',
                    stars: ch.stars || ch.metadata?.stars || 3.5,
                    difficulties: ch.difficulties || [{ id: 'saved', name: 'Guardada', stars: 3.5 }],
                    is_community: Boolean(ch.is_community || ch.source === 'community'),
                    source: ch.source || 'community'
                  });
                }
              }
            }
          } catch (e) {}
        }
      }

      // Aleatorizar el lote obtenido con Fisher-Yates
      const shuffledBatch = fisherYatesShuffle(fetchedSongs);

      if (!isAppend) {
        searchResultsCache = shuffledBatch;
        renderSearchResults(shuffledBatch, []);
      } else {
        if (shuffledBatch.length > 0) {
          searchResultsCache.push(...shuffledBatch);
          appendSearchResults(shuffledBatch);
        } else {
          catalogHasEnded = true;
          const loaderEl = document.getElementById('infiniteScrollLoader');
          if (loaderEl) loaderEl.innerHTML = `<span class="text-[10px] text-gray-500">Has llegado al final del catálogo</span>`;
        }
      }

      const loaderEl = document.getElementById('infiniteScrollLoader');
      if (loaderEl && !catalogHasEnded) loaderEl.classList.add('hidden');

      catalogPage++;
      catalogIsLoading = false;

      // Iniciar listener de scroll infinito si no está registrado aún
      if (!infiniteScrollInitialized) {
        initInfiniteScroll();
      }
    }

    function initInfiniteScroll() {
      const screen = document.getElementById('searchScreen');
      if (!screen || infiniteScrollInitialized) return;
      infiniteScrollInitialized = true;

      screen.addEventListener('scroll', () => {
        const q = (document.getElementById('searchInput')?.value || '').trim();
        const isComm = Boolean(document.getElementById('filterOnlyCommunity')?.checked);
        // Solo activar scroll infinito si estamos en el modo explorar por defecto (sin búsqueda activa de texto)
        if (q || isComm) return;

        const scrollPos = screen.scrollTop + screen.clientHeight;
        const scrollThreshold = screen.scrollHeight - 350;
        if (scrollPos >= scrollThreshold && !catalogIsLoading && !catalogHasEnded) {
          loadInfiniteRandomCatalog(true);
        }
      }, { passive: true });
    }

    // Compatibilidad retroactiva
    async function loadInitialShuffledCatalog() {
      await loadInfiniteRandomCatalog(false);
    }

    // Delegador seguro para compatibilidad
    window.playSong = function(chartId, diffId = null) {
      pauseMenuAmbientMusic();
      if (typeof playCommunitySong === 'function' && (chartId.startsWith('comm_') || chartId.startsWith('custom_'))) {
        playCommunitySong(chartId);
      } else if (typeof downloadAndPlaySong === 'function') {
        downloadAndPlaySong(chartId, diffId || 'default', 'Normal');
      }
    };

    async function executeSearch() {
      const q = document.getElementById('searchInput').value.trim();
      const isCommunityOnly = Boolean(document.getElementById('filterOnlyCommunity')?.checked);
      if (!q && !isCommunityOnly) {
        await loadInitialShuffledCatalog();
        return;
      }

      const btnText = document.getElementById('searchBtnText');
      const spinner = document.getElementById('searchSpinner');
      const resultsList = document.getElementById('resultsList');

      if (btnText) btnText.innerText = '...';
      if (spinner) spinner.classList.remove('hidden');

      // Si "Solo Comunidad" está marcado en el menú de 3 rayas, buscar en la nube comunitaria
      if (isCommunityOnly) {
        console.log(`[Search] Búsqueda en Nube Comunitaria para "${q}"...`);
        try {
          const baseUrl = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
          const params = new URLSearchParams();
          if (q) params.set('q', q);
          if (typeof communityDiffFilter !== 'undefined' && communityDiffFilter && communityDiffFilter !== 'Todas') {
            params.set('difficulty', communityDiffFilter);
          }
          if (typeof communitySort !== 'undefined' && communitySort) {
            params.set('sort', communitySort);
          }
          const res = await fetch(`${baseUrl}/api/v1/community/charts/search?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              searchResultsCache = data;
              renderSearchResults(data, []);
              if (btnText) btnText.innerText = 'Buscar';
              if (spinner) spinner.classList.add('hidden');
              return;
            }
          }
        } catch (err) {
          console.warn('[Search] Fallo consultando comunidad en línea:', err);
        }

        try {
          const cached = JSON.parse(localStorage.getItem('beatstar_community_cache') || '[]');
          const filtered = q ? cached.filter(s => (s.title + ' ' + s.artist + ' ' + (s.creator_name || '')).toLowerCase().includes(q.toLowerCase())) : cached;
          searchResultsCache = filtered.length > 0 ? filtered : cached;
          renderSearchResults(searchResultsCache, []);
        } catch (e) {}

        if (btnText) btnText.innerText = 'Buscar';
        if (spinner) spinner.classList.add('hidden');
        return;
      }

      console.log(`[Search] Iniciando búsqueda para "${q}" (osu! Mania + Clone Hero)...`);

      // 1. Intento principal: Búsqueda agregada ultrarrápida del backend
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 6000);
        const backendResp = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        clearTimeout(tid);
        if (backendResp.ok) {
          const data = await backendResp.json();
          if (Array.isArray(data) && data.length > 0) {
            console.log(`[Search] Servidor backend entregó ${data.length} canciones.`);
            const sortedItems = sortItemsByTargetDifficulty(data, currentTargetDifficulty);
            searchResultsCache = sortedItems;
            renderSearchResults(sortedItems, []);
            if (btnText) btnText.innerText = 'Buscar';
            if (spinner) spinner.classList.add('hidden');
            return;
          }
        }
      } catch (backendErr) {
        console.debug('Backend search fallback to client APIs:', backendErr);
      }

      // 2. Fallback de cliente: Consulta en paralelo a osu! Mania y Clone Hero
      try {
        const [osuRes, chRes] = await Promise.allSettled([
          withTimeout(searchOsuMania(q), 10000, 'osu! Mania'),
          withTimeout(searchCloneHero(q), 12000, 'Clone Hero')
        ]);

        const allItems = [];
        const failedApis = [];

        if (osuRes.status === 'fulfilled' && Array.isArray(osuRes.value)) {
          allItems.push(...osuRes.value);
        } else {
          failedApis.push({ name: 'osu! Mania', error: osuRes.reason?.message || 'Sin respuesta' });
        }

        if (chRes.status === 'fulfilled' && Array.isArray(chRes.value)) {
          allItems.push(...chRes.value);
        } else {
          failedApis.push({ name: 'Clone Hero', error: chRes.reason?.message || 'Sin respuesta' });
        }

        console.log(`[Search] Total unificado: ${allItems.length} canciones encontradas.`);

        const sortedItems = sortItemsByTargetDifficulty(allItems, currentTargetDifficulty);
        searchResultsCache = sortedItems;
        renderSearchResults(sortedItems, failedApis);

      } catch (err) {
        resultsList.innerHTML = `<div class="p-5 text-center text-xs text-red-400 glass-card">Error general en la búsqueda: ${err.message}</div>`;
      } finally {
        if (btnText) btnText.innerText = 'Buscar';
        if (spinner) spinner.classList.add('hidden');
      }
    }

    function buildSongCardHtml(item, idx, targetNum = null) {
      const hs = highscores[item.id];
      const isFav = favoriteIdsSet.has(item.id);
      const sId = safeSongId(item.id);
      const isComm = Boolean((item.is_community || item.source === 'community') && item.source !== 'osu' && item.source !== 'clonehero' && item.source !== 'catboy' && !String(item.id).startsWith('osu_') && !item.sng_url && !item.download_url);
      const cStars = typeof item.stars === 'number' ? item.stars : (parseFloat(item.stars) || 3.5);

      // Find primary difficulty (closest to target filter or balanced 3.5★)
      let primaryDiff = null;
      if (isComm) {
        primaryDiff = { id: 'community', name: item.difficulty_name || 'Normal', stars: cStars };
      } else if (item.difficulties && item.difficulties.length > 0) {
        if (targetNum !== null) {
          let minDiff = Infinity;
          for (const d of item.difficulties) {
            const dist = Math.abs((d.stars || 3.0) - targetNum);
            if (dist < minDiff) {
              minDiff = dist;
              primaryDiff = d;
            }
          }
        } else {
          let minDiff = Infinity;
          for (const d of item.difficulties) {
            const dist = Math.abs((d.stars || 3.5) - 3.5);
            if (dist < minDiff) {
              minDiff = dist;
              primaryDiff = d;
            }
          }
        }
        if (!primaryDiff) primaryDiff = item.difficulties[0];
      } else {
        primaryDiff = { id: 'default', name: 'Normal', stars: 3.5 };
      }

      const primaryStarsText = primaryDiff.stars ? `${primaryDiff.stars.toFixed(1)}★` : '';
      const hasMultipleDiffs = Array.isArray(item.difficulties) && item.difficulties.length > 1;

      const diffChipsHtml = (item.difficulties || []).map(diff => {
        const cleanName = (diff.name || 'Normal').replace(/\[\d+K\]\s*/gi, '').replace(/^\[[^\]]+\]\s*/, '').trim() || 'Normal';
        const starsText = diff.stars ? `${diff.stars.toFixed(1)}★` : '';
        const isPrimary = diff.id === primaryDiff.id;
        const chipClass = isPrimary ? 'piano-diff-chip active' : 'piano-diff-chip';

        return `
          <button 
            onclick="downloadAndPlaySong('${item.id}', '${diff.id}', '${cleanName.replace(/'/g, "\\'")}', ${idx})" 
            class="${chipClass}" 
            title="Jugar dificultad ${cleanName}"
          >
            <span>${cleanName}</span>
            ${starsText ? `<span class="font-mono text-[9.5px] opacity-90">${starsText}</span>` : ''}
          </button>
        `;
      }).join('');

      return `
        <div class="piano-key-row flex flex-col">
          <div class="flex items-stretch w-full max-w-full overflow-hidden">
            <!-- White Ivory Key Body (Opens Accordion) -->
            <div onclick="togglePianoAccordion('${sId}')" class="piano-white-key flex-1 min-w-0 overflow-hidden" title="Ver opciones y tempo">
              <div class="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                <!-- Round Inlaid Medallion Artwork -->
                <div class="piano-key-thumb relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[#c5a059] shadow-sm flex items-center justify-center bg-stone-900">
                  <img src="${item.thumbnail || GENERIC_THUMBNAIL}" alt="" class="w-full h-full object-cover rounded-full" loading="lazy" onerror="this.onerror=null; this.src=GENERIC_THUMBNAIL;">
                </div>
                <!-- Track Metadata -->
                <div class="min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
                  <div class="flex items-center gap-1.5 truncate">
                    <h3 class="text-xs font-black text-[#17131d] truncate font-serif leading-tight">${escapeHtml(item.title || t('unknown_song', 'Canción'))}</h3>
                    ${hs ? `<span class="text-[8px] font-mono font-bold text-amber-800 flex-shrink-0 flex items-center gap-0.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="text-amber-700 inline"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/><path d="M6 9a6 6 0 0 0 12 0"/><path d="M12 15v5"/><path d="M8 20h8"/></svg> ${hs.score.toLocaleString()}</span>` : ''}
                  </div>
                  <p class="text-[10px] text-[#5a422d] font-semibold truncate leading-tight mt-0.5">${escapeHtml(item.artist || t('unknown_artist', 'Artista'))}${isComm ? ` • <span class="text-[#2b1f13]">${escapeHtml(item.creator_name || 'Comunidad')}</span>` : ''}</p>
                </div>
              </div>
              <!-- Single Star Metric & Accordion Arrow -->
              <div class="flex items-center gap-1.5 flex-shrink-0 ml-1.5">
                <span class="text-[11px] font-black text-[#9c7329] font-mono whitespace-nowrap">★ ${(primaryDiff.stars || 3.5).toFixed(1)}</span>
                <span id="accordionArrow_${sId}" class="text-[9px] text-[#8e755a] transition-transform duration-200">▼</span>
              </div>
            </div>

            <!-- Fixed 3D Ebony Black Play Key (INDESTRUCTIBLE & ALWAYS VISIBLE) -->
            <div 
              onclick="${isComm ? `playCommunitySong('${item.id}')` : `downloadAndPlaySong('${item.id}', '${primaryDiff.id}', '${primaryDiff.name.replace(/'/g, "\\'")}', ${idx})`}" 
              class="piano-black-play-key flex-shrink-0 w-12 min-w-[48px]" 
              title="${isComm ? t('play') : `Jugar ${primaryDiff.name} (${primaryStarsText})`}"
            >
              <span class="play-arrow-gold">▶</span>
            </div>
          </div>

          <!-- Soundboard Accordion ("Caja de Resonancia") -->
          <div id="pianoAccordion_${sId}" class="piano-soundboard-accordion">
            <div class="p-2.5 space-y-2">
              ${isComm ? `
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[9px] font-bold text-[#c5a059] uppercase tracking-wider">Creador:</span>
                    <span class="text-[9.5px] text-amber-300 font-bold">${escapeHtml(item.creator_name || 'Comunidad')}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[9px] font-bold text-[#c5a059] uppercase tracking-wider">Dificultad:</span>
                    <span class="piano-diff-chip active">${item.difficulty_name || 'Normal'} ${cStars.toFixed(1)}★</span>
                  </div>
                </div>
              ` : `
                <div>
                  <span class="text-[9px] font-bold text-[#c5a059] uppercase tracking-wider block mb-1">Dificultades Disponibles</span>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    ${diffChipsHtml}
                  </div>
                </div>
              `}

              <div class="flex items-center justify-between gap-2 pt-1.5 border-t border-white/5 text-[11px]">
                <div class="flex items-center gap-2">
                  <span class="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Tempo:</span>
                  ${renderSongSpeedHtml(item.id).btn}
                </div>
                <div class="flex items-center gap-2">
                  ${isComm ? `
                    <button onclick="openRateSongModal('${item.id}', '${escapeHtml(item.title).replace(/'/g, "\\'")}', '${escapeHtml(item.artist).replace(/'/g, "\\'")}', '${item.difficulty_name || 'Normal'}', ${cStars}, true)" class="text-[10px] text-amber-400 hover:scale-105 transition flex items-center gap-1 cursor-pointer font-bold" title="Calificar">
                      ★ Calificar
                    </button>
                  ` : ''}
                  <button onclick="toggleFavoriteSong('${item.id}')" data-id="${item.id}" class="piano-card-action-btn heart-btn ${isFav ? 'active' : ''}" title="Favorito">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFav ? '#e5b869' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  </button>
                  <button onclick="openAddToPlaylistModal('${item.id}')" class="piano-card-action-btn" title="Añadir a playlist">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function appendSearchResults(newItems) {
      const container = document.getElementById('resultsList');
      if (!container) return;
      const bed = container.querySelector('.piano-keyboard-bed');
      if (!bed) {
        renderSearchResults(searchResultsCache, []);
        return;
      }
      const targetNum = currentTargetDifficulty !== 'all' ? parseFloat(currentTargetDifficulty) : null;
      const startIndex = searchResultsCache.length - newItems.length;
      const newHtml = newItems.map((item, idx) => buildSongCardHtml(item, startIndex + idx, targetNum)).join('');
      bed.insertAdjacentHTML('beforeend', newHtml);
    }

    function renderSearchResults(items, failedApis = []) {
      const container = document.getElementById('resultsList');

      // 1. All APIs failed completely
      if ((!items || items.length === 0) && failedApis.length >= 2) {
        container.innerHTML = `
          <div class="p-6 text-center text-xs text-red-300 glass-card space-y-3">
            <div class="w-10 h-10 mx-auto rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-lg font-black">✕</div>
            <div>
              <p class="font-black text-sm text-white">${t('cat_error_connect', 'No se pudo conectar con los servidores comunitarios')}</p>
              <p class="text-[10px] text-gray-400 mt-0.5">Diagnóstico detallado de servicios:</p>
            </div>
            <div class="space-y-1.5 text-left bg-black/50 p-2.5 rounded-xl text-[11px] border border-white/5 font-mono">
              ${failedApis.map(f => `
                <div class="flex items-start gap-1.5">
                  <span class="text-red-400 font-bold">• ${f.name}:</span>
                  <span class="text-gray-300 truncate">${f.error}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
        return;
      }

      // 2. No songs found although APIs responded OK
      if (!items || items.length === 0) {
        let partialWarnHtml = '';
        if (failedApis.length > 0) {
          partialWarnHtml = `
            <div class="p-2.5 mb-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2 text-left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-400 inline flex-shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <p class="text-[11px]">No se pudo conectar con: <b>${failedApis.map(f => f.name).join(', ')}</b></p>
            </div>
          `;
        }

        container.innerHTML = `
          ${partialWarnHtml}
          <div class="p-8 text-center text-xs text-gray-400 glass-card space-y-1">
            <p class="font-bold text-sm text-gray-300">${t('cat_empty_title', 'No se encontraron canciones para esta búsqueda')}</p>
            <p class="text-[10px] text-gray-500">${t('cat_empty_sub', 'Prueba con palabras clave en inglés, nombre de artista o títulos populares.')}</p>
          </div>
        `;
        return;
      }

      const targetNum = currentTargetDifficulty !== 'all' ? parseFloat(currentTargetDifficulty) : null;
      const cardsHtml = items.map((item, idx) => buildSongCardHtml(item, idx, targetNum)).join('');

      container.innerHTML = `
        <div class="piano-keyboard-bed">
          <div class="piano-felt-top-strip"></div>
          ${cardsHtml}
        </div>
        <div id="infiniteScrollLoader" class="hidden py-4 text-center">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-[#c5a059]/40 text-[#e2b963] text-xs font-bold animate-pulse">
            <svg class="animate-spin h-3.5 w-3.5 text-[#e2b963]" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            <span>Cargando más canciones...</span>
          </div>
        </div>
      `;
    }

    // ==========================================
    // VISUAL DIAGNOSTIC TERMINAL & LOGGER
    // ==========================================

    const VisualLogger = {
      startTime: 0,
      logs: [],
      init() {
        this.startTime = performance.now();
        this.logs = [];
        const term = document.getElementById('diagnosticTerminal');
        const logsEl = document.getElementById('diagnosticLogs');
        const errBox = document.getElementById('diagnosticErrorBox');
        if (term) term.classList.add('hidden');
        if (logsEl) logsEl.innerHTML = '';
        if (errBox) errBox.classList.add('hidden');
        this.updateTimer();
      },
      updateTimer() {
        const timerEl = document.getElementById('diagnosticTimer');
        if (timerEl) {
          const elapsed = ((performance.now() - this.startTime) / 1000).toFixed(1);
          timerEl.innerText = `${elapsed}s`;
        }
      },
      step(stepNum, title, detail = '', status = 'info') {
        this.updateTimer();
        const elapsed = ((performance.now() - this.startTime) / 1000).toFixed(1);
        const logsEl = document.getElementById('diagnosticLogs');
        const entry = { stepNum, title, detail, status, time: elapsed };
        this.logs.push(entry);

        let badgeColor = 'text-cyan-400';
        let icon = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
        if (status === 'success') { badgeColor = 'text-emerald-400'; icon = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'; }
        if (status === 'warn') { badgeColor = 'text-amber-400'; icon = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>'; }
        if (status === 'error') { badgeColor = 'text-rose-400'; icon = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'; }

        if (logsEl) {
          const div = document.createElement('div');
          div.className = 'flex items-start gap-1.5 leading-tight py-0.5 border-b border-white/5';
          div.innerHTML = `
            <span class="flex-shrink-0 text-[9px] mt-0.5">${icon}</span>
            <div class="flex-1 min-w-0">
              <p class="${badgeColor} font-bold text-[10px]">[Paso ${stepNum}] ${title}</p>
              ${detail ? `<p class="text-gray-300 text-[9px] break-all leading-tight mt-0.5">${detail}</p>` : ''}
            </div>
            <span class="text-[8px] text-gray-500 flex-shrink-0 font-mono">${elapsed}s</span>
          `;
          logsEl.appendChild(div);
          logsEl.scrollTop = logsEl.scrollHeight;
        }
        console.log(`[Diagnostic P${stepNum}] ${title}: ${detail}`);
      },
      error(err, stepNum = '!') {
        this.updateTimer();
        const errBox = document.getElementById('diagnosticErrorBox');
        const msgEl = document.getElementById('diagnosticErrorMsg');
        const stackEl = document.getElementById('diagnosticErrorStack');
        
        const msg = err?.message || String(err);
        const stack = err?.stack || '(Sin stack trace disponible)';

        this.step(stepNum, 'Fallo detectado en el proceso', msg, 'error');

        if (errBox) {
          errBox.classList.remove('hidden');
          if (msgEl) msgEl.innerText = msg;
          if (stackEl) stackEl.innerText = stack;
        }
      }
    };

    window.VisualLogger = VisualLogger;

    function closeLoadingOverlay() {
      const overlay = document.getElementById('globalLoadingOverlay');
      const curtain = document.getElementById('gameCurtain');
      if (overlay) overlay.classList.remove('active');
      if (curtain) curtain.classList.add('revealed');
    }

    function copyDiagnosticLogs() {
      const logsText = VisualLogger.logs.map(l => `[Paso ${l.stepNum}][+${l.time}s] ${l.title}: ${l.detail}`).join('\n');
      const errBox = document.getElementById('diagnosticErrorBox');
      const errMsg = document.getElementById('diagnosticErrorMsg')?.innerText || '';
      const errStack = document.getElementById('diagnosticErrorStack')?.innerText || '';
      
      const fullReport = `=== BEATSTAR DIAGNÓSTICO EN VIVO ===\n${logsText}\n\n=== EXCEPCIÓN ===\n${errMsg}\n\nStack:\n${errStack}`;
      
      navigator.clipboard.writeText(fullReport).then(() => {
        showSuccessToast('Diagnóstico copiado al portapapeles');
      }).catch(() => {
        showErrorToast('Informe generado (copia manual desde la pantalla)');
      });
    }

    async function downloadAndPlaySong(chartId, diffId, diffName, itemIndex = null) {
      window.isGameLoadingOrActive = true;
      if (typeof pauseMenuAmbientMusic === 'function') pauseMenuAmbientMusic();
      if (engine && engine.sync) {
        engine.sync.unlockAudio();
      }
      if (chartId === 'comm_renacer') {
        playCommunitySong('comm_renacer');
        return;
      }
      let chartItem = null;
      if (searchResultsCache && chartId) {
        chartItem = searchResultsCache.find(c => String(c.id) === String(chartId));
      }
      if (!chartItem && itemIndex !== null && searchResultsCache && searchResultsCache[itemIndex]) {
        chartItem = searchResultsCache[itemIndex];
      }

      if (!chartItem) {
        chartItem = await IndexedDBStorage.getChart(chartId);
      }

      if (!chartItem) {
        showErrorToast('No se encontró información de la canción seleccionada.');
        return;
      }

      const overlay = document.getElementById('globalLoadingOverlay');
      const loadTitle = document.getElementById('globalLoadTitle');
      const loadArtist = document.getElementById('globalLoadArtist');
      const loadStatus = document.getElementById('globalLoadStatus');
      const curtain = document.getElementById('gameCurtain');

      if (curtain) curtain.classList.remove('revealed');

      loadTitle.innerText = chartItem.title;
      loadArtist.innerText = `${chartItem.artist} (${chartItem.source_name || 'Comunidad'})`;
      loadStatus.innerText = 'Preparando canción...';
      overlay.classList.add('active');

      // Inicializar logger visual de diagnóstico
      VisualLogger.init();

      try {
        let cached = await IndexedDBStorage.getChart(chartId);
        if (cached && cached.audioBlob) {
          loadStatus.innerText = 'Cargando mapa desde memoria local...';

          // Extraer estrellas de la dificultad seleccionada
          let selectedStars = null;
          if (chartItem && Array.isArray(chartItem.difficulties)) {
            const match = chartItem.difficulties.find(d => d.id === diffId || d.name === diffName);
            if (match && Number.isFinite(match.stars)) {
              selectedStars = match.stars;
            }
          }
          if (selectedStars === null && diffName) {
            const sm = String(diffName).match(/([0-9]+(?:\.[0-9]+)?)\s*★/);
            if (sm) selectedStars = parseFloat(sm[1]);
          }

          if (selectedStars !== null) {
            cached.stars = selectedStars;
            cached.selectedStars = selectedStars;
            if (!cached.metadata) cached.metadata = {};
            cached.metadata.stars = selectedStars;
          }
          if (diffName) {
            if (!cached.metadata) cached.metadata = {};
            cached.metadata.difficulty_name = diffName;
          }

          setTimeout(() => {
            overlay.classList.remove('active');
            startGame(cached, cached.audioBlob, diffName);
          }, 200);
          return;
        }

        // ==========================================
        // 1. FLUJO BLINDADO PARA OSU! MANIA (CANALIZADO VIA CLOUDFLARE WORKER)
        // ==========================================
        const isOsuTrack = chartItem.source === 'osu' || chartItem.source === 'catboy' || (chartItem.id && String(chartItem.id).startsWith('osu_'));
        if (isOsuTrack) {
          const term = document.getElementById('diagnosticTerminal');
          if (term) term.classList.add('hidden');
          loadStatus.innerText = 'Descargando beatmap de osu!...';

          const osuSetId = (chartItem.id || '').replace('osu_', '');
          const myWorker = (u) => `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(u)}`;

          // 1º Intento: Proxy del servidor local (Rápido y sin CORS)
          // 2º Intento: Nerinyan directo
          // 3º Intento: Nerinyan v2 directo
          // 4º Intento: Nerinyan vía Worker
          // 5º Intento: Sayobot mini
          // 6º Intento: Sayobot dl
          const osuCandidates = [
            `/api/v1/download/osu/${osuSetId}`,
            `https://api.nerinyan.moe/d/${osuSetId}?noVideo=true`,
            `https://dl.nerinyan.moe/v2/d/${osuSetId}?noVideo=true`,
            myWorker(`https://api.nerinyan.moe/d/${osuSetId}?noVideo=true`),
            `https://txy1.sayobot.cn/beatmaps/download/mini/${osuSetId}`,
            `https://dl.sayobot.cn/beatmaps/download/mini/${osuSetId}`
          ];

          const tryOsuFetch = async (url) => {
            const c = new AbortController();
            const tid = setTimeout(() => c.abort(), 14000);
            try {
              const r = await fetch(url, { signal: c.signal });
              clearTimeout(tid);
              if (!r.ok) throw new Error('HTTP ' + r.status);

              const b = await r.arrayBuffer();
              if (!b || b.byteLength < 500) throw new Error('Buffer vacío o corrupto');

              // Leer únicamente los primeros 30 bytes del buffer recibido
              const firstBytes = new Uint8Array(b.slice(0, 30));
              const firstStr = String.fromCharCode(...firstBytes).toLowerCase();
              if (firstStr.includes('<!doc') || firstStr.includes('<html') || firstStr.includes('{"error"') || firstStr.includes('{"status":40')) {
                throw new Error(`Respuesta HTML / error inválido: "${firstStr.slice(0, 20)}..."`);
              }

              return b;
            } catch (e) {
              clearTimeout(tid);
              throw e;
            }
          };

          let arrayBuffer = null;
          let lastOsuErr = null;
          for (const u of osuCandidates) {
            try {
              arrayBuffer = await tryOsuFetch(u);
              if (arrayBuffer && arrayBuffer.byteLength > 500) break;
            } catch (e) {
              lastOsuErr = e;
              console.warn(`Mirror osu! fallido (${u}): ${e.message}`);
            }
          }

          if (!arrayBuffer) {
            throw new Error(`No se pudo descargar el beatmap de osu! (${lastOsuErr ? lastOsuErr.message : 'Mirrors caídos'}).`);
          }

          loadStatus.innerText = 'Parseando notas a 3 carriles...';
          const unpackedData = await PackageUnpacker.unpack(arrayBuffer, 'osz', diffId);
          currentActiveAudioBlob = unpackedData.audioBlob;
          unpackedData.id = chartItem.id;
          if (!unpackedData.metadata) unpackedData.metadata = {};
          unpackedData.metadata.id = chartItem.id;
          unpackedData.metadata.title = chartItem.title || unpackedData.metadata.title;
          unpackedData.metadata.artist = chartItem.artist || unpackedData.metadata.artist;
          unpackedData.metadata.difficulty_name = diffName || chartItem.difficulty_name || unpackedData.metadata.difficulty_name;
          const targetDiff = (chartItem.difficulties || []).find(d => d.id === diffId || d.name === diffName);
          const selectedStars = (targetDiff && Number.isFinite(targetDiff.stars))
            ? targetDiff.stars
            : (Number.isFinite(chartItem.stars) ? chartItem.stars : ((chartItem.difficulties && chartItem.difficulties[0]?.stars) || 3.5));
          unpackedData.metadata.stars = selectedStars;
          unpackedData.communityChartId = chartItem.id;
          unpackedData.source = chartItem.source || 'osu';
          unpackedData.source_name = chartItem.source_name || 'osu!';
          unpackedData.download_url = chartItem.download_url || chartItem.direct_download_url || '';
          unpackedData.diff_id = diffId || '';
          if (chartItem.is_daily_featured) unpackedData.is_daily_featured = true;

          loadStatus.innerText = 'Guardando en biblioteca offline...';
          await IndexedDBStorage.saveChart(chartItem, unpackedData, unpackedData.audioBlob);

          setTimeout(() => {
            overlay.classList.remove('active');
            startGame(unpackedData, unpackedData.audioBlob, diffName);
          }, 150);
          return;
        }

        // ==========================================
        // 2. FLUJO CLONE HERO (CONECTADO A CDN ENCHOR + CLOUDFLARE WORKER)
        // ==========================================
        VisualLogger.init();

        const myWorker = (u) => `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(u)}`;

        let rawTargetUrl = chartItem.sng_url || chartItem.direct_download_url || chartItem.download_url || '';
        VisualLogger.step(1, 'URL de mapa obtenida', rawTargetUrl || '(Sin URL directa)', 'info');

        // Auto-resolución de hash MD5 si faltaba en metadatos
        if (!chartItem.md5 && chartItem.title) {
          try {
            const searchResp = await fetch('https://api.enchor.us/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ search: `${chartItem.title} ${chartItem.artist || ''}`.trim(), page: 1, source: 'website' })
            }).then(r => r.ok ? r.json() : null);
            const foundSongs = searchResp?.data || searchResp?.songs || [];
            if (foundSongs.length > 0 && foundSongs[0].md5) {
              chartItem.md5 = foundSongs[0].md5;
            }
          } catch (_) {}
        }

        const downloadCandidates = [];

        // Prioridad 1 (Infalible): Si el tema dispone de hash md5, descargar el .sng directamente de files.enchor.us (CORS nativo)
        if (chartItem.md5) {
          VisualLogger.step(2, 'MD5 Enchor Detectado', `Hash: ${chartItem.md5} -> Prioridad 1 CDN / Proxy Local`, 'info');
          downloadCandidates.push(`/api/v1/download/clonehero/${chartItem.md5}`);
          downloadCandidates.push(`https://files.enchor.us/${chartItem.md5}.sng`);
          downloadCandidates.push(myWorker(`https://files.enchor.us/${chartItem.md5}.sng`));
          downloadCandidates.push(myWorker(`https://files.enchor.us/${chartItem.md5}`));
        }

        // Prioridad 2: Enlace directo que no sea de Google Drive
        if (rawTargetUrl && !rawTargetUrl.includes('drive.google') && !rawTargetUrl.includes('docs.google') && !downloadCandidates.includes(rawTargetUrl)) {
          downloadCandidates.push(rawTargetUrl);
          downloadCandidates.push(myWorker(rawTargetUrl));
        }

        // Prioridad 3: Archivo individual de Google Drive (SOLO si no es carpeta)
        let driveFileId = chartItem.drive_id || '';
        if (!driveFileId && rawTargetUrl && (rawTargetUrl.includes('id=') || rawTargetUrl.includes('/d/'))) {
          if (rawTargetUrl.includes('id=')) {
            driveFileId = rawTargetUrl.split('id=')[1].split('&')[0];
          } else if (rawTargetUrl.includes('/d/')) {
            driveFileId = rawTargetUrl.split('/d/')[1].split('/')[0];
          }
        }

        if (driveFileId && driveFileId !== chartItem.parent_folder_id) {
          VisualLogger.step(2, 'Google Drive detectado', `File ID: ${driveFileId} -> Conectando via Worker`, 'info');
          const driveDirect1 = `https://drive.usercontent.google.com/download?id=${driveFileId}&export=download&authuser=0&confirm=t`;
          const driveDirect2 = `https://drive.google.com/uc?id=${driveFileId}&export=download&confirm=t`;
          downloadCandidates.push(myWorker(driveDirect1));
          downloadCandidates.push(myWorker(driveDirect2));
        }

        if (downloadCandidates.length === 0) {
          throw new Error('La canción no dispone de enlace de descarga válido.');
        }

        loadStatus.innerText = 'Descargando paquete de canción...';
        let httpResponseInfo = '';

        const tryFetchBuffer = async (dlUrl) => {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 25000);
          try {
            const resp = await fetch(dlUrl, { signal: controller.signal });
            clearTimeout(tid);
            httpResponseInfo = `Status: ${resp.status} ${resp.statusText || ''}`;
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const buf = await resp.arrayBuffer();
            if (!buf || buf.byteLength < 500) throw new Error('Buffer vacío o menor a 500 bytes');

            // Lee únicamente los primeros 30 bytes del buffer recibido
            const firstBytes = new Uint8Array(buf.slice(0, 30));
            const firstStr = String.fromCharCode(...firstBytes).toLowerCase();
            if (firstStr.includes('<!doc') || firstStr.includes('<html') || firstStr.includes('{"status":401') || firstStr.includes('{"error"')) {
              throw new Error(`Aviso HTML / Cuota de Google Drive: "${firstStr.slice(0, 15)}..."`);
            }
            return { buf, url: dlUrl };
          } catch (e) {
            clearTimeout(tid);
            throw e;
          }
        };

        // Descarga en cascada secuencial por orden de prioridad
        let downloadResult = null;
        let lastErr = null;
        for (const candidateUrl of downloadCandidates) {
          try {
            downloadResult = await tryFetchBuffer(candidateUrl);
            if (downloadResult && downloadResult.buf && downloadResult.buf.byteLength >= 500) {
              break;
            }
          } catch (errCand) {
            lastErr = errCand;
            VisualLogger.step(3, 'Espejo descartado', `${errCand.message} -> Probando siguiente espejo...`, 'warning');
          }
        }

        if (!downloadResult || !downloadResult.buf) {
          VisualLogger.step(3, 'Fallo en descarga HTTP', `Respuesta: ${httpResponseInfo || (lastErr && lastErr.message) || 'Timeout'}`, 'error');
          throw new Error(`No se pudo descargar la canción (${httpResponseInfo || (lastErr && lastErr.message)}).`);
        }

        const arrayBuffer = downloadResult.buf;
        const sizeMb = (arrayBuffer.byteLength / 1024 / 1024).toFixed(2);
        VisualLogger.step(3, 'Descarga exitosa vía Cloudflare', `Tamaño: ${sizeMb} MB`, 'success');
        // [Paso 4] Carga de WebAssembly / JSZip / SNG
        loadStatus.innerText = 'Descomprimiendo y parseando a 3 carriles...';
        let fileExt = 'zip';
        
        if (typeof SngUnpacker !== 'undefined' && SngUnpacker.isSng && SngUnpacker.isSng(arrayBuffer)) {
          fileExt = 'sng';
          VisualLogger.step(4, 'Formato binario SNG detectado', 'Magic bytes: SNGPKG -> Desempaquetando con SngUnpacker', 'info');
        } else if (typeof ArchiveHelper !== 'undefined' && ArchiveHelper.is7zOrRar && ArchiveHelper.is7zOrRar(arrayBuffer)) {
          fileExt = '7z';
          const firstBytes = Array.from(new Uint8Array(arrayBuffer.slice(0, 4))).map(b => b.toString(16).padStart(2, '0')).join(' ');
          VisualLogger.step(4, 'Formato 7-Zip / RAR detectado', `Magic bytes: [${firstBytes}] -> Cargando libarchive.wasm & Web Worker...`, 'info');
        } else {
          VisualLogger.step(4, 'Formato ZIP estándar detectado', 'Magic bytes: PK\\x03\\x04 -> Descomprimiendo con JSZip...', 'info');
        }

        // [Paso 5] Parseo de notas y audio
        const unpackedData = await PackageUnpacker.unpack(arrayBuffer, fileExt, diffId, (step, t, d, s) => VisualLogger.step(step, t, d, s));
        currentActiveAudioBlob = unpackedData.audioBlob;
        unpackedData.id = chartItem.id;
        if (!unpackedData.metadata) unpackedData.metadata = {};
        unpackedData.metadata.id = chartItem.id;
        unpackedData.metadata.title = chartItem.title || unpackedData.metadata.title;
        unpackedData.metadata.artist = chartItem.artist || unpackedData.metadata.artist;
        unpackedData.metadata.difficulty_name = diffName || chartItem.difficulty_name || unpackedData.metadata.difficulty_name;
        const targetDiff = (chartItem.difficulties || []).find(d => d.id === diffId || d.name === diffName);
          const selectedStars = (targetDiff && Number.isFinite(targetDiff.stars))
            ? targetDiff.stars
            : (Number.isFinite(chartItem.stars) ? chartItem.stars : ((chartItem.difficulties && chartItem.difficulties[0]?.stars) || 3.5));
          unpackedData.metadata.stars = selectedStars;
        unpackedData.communityChartId = chartItem.id;
        unpackedData.source = chartItem.source || 'clonehero';
        unpackedData.source_name = chartItem.source_name || 'Clone Hero';
        unpackedData.download_url = chartItem.download_url || chartItem.direct_download_url || '';
        unpackedData.md5 = chartItem.md5 || '';
        unpackedData.diff_id = diffId || '';
        if (chartItem.is_daily_featured) unpackedData.is_daily_featured = true;

        VisualLogger.step(5, 'Parseo completado con éxito', `${unpackedData.notes.length} notas mapeadas a 3 carriles. Audio listo.`, 'success');

        loadStatus.innerText = 'Guardando en biblioteca offline...';
        await IndexedDBStorage.saveChart(chartItem, unpackedData, unpackedData.audioBlob);

        setTimeout(() => {
          overlay.classList.remove('active');
          startGame(unpackedData, unpackedData.audioBlob, diffName);
        }, 150);

      } catch (err) {
        window.isGameLoadingOrActive = false;
        if (isOsuTrack) {
          overlay.classList.remove('active');
          if (curtain) curtain.classList.add('revealed');
          showErrorToast(`Error al cargar osu!: ${err.message}`);
        } else {
          VisualLogger.error(err, 5);
          if (curtain) curtain.classList.add('revealed');
          showErrorToast(`Error en Clone Hero: ${err.message}`);
        }
        console.error(err);
      }
    }
function startGame(beatmapData, audioBlob, diffLabel = '') {
      if (typeof pauseMenuAmbientMusic === 'function') pauseMenuAmbientMusic();
      if (!beatmapData) {
        showErrorToast('Error: Datos de canción no válidos.');
        return;
      }

      // 1. Extracción profunda de notas
      let rawNotes = [];
      if (Array.isArray(beatmapData.notes)) {
        rawNotes = beatmapData.notes;
      } else if (beatmapData.unpackedData && Array.isArray(beatmapData.unpackedData.notes)) {
        rawNotes = beatmapData.unpackedData.notes;
      } else if (Array.isArray(beatmapData.difficulties)) {
        for (const diff of beatmapData.difficulties) {
          if (Array.isArray(diff.notes) && diff.notes.length > 0) {
            rawNotes = diff.notes;
            break;
          }
        }
      }

      // 2. Blindaje numérico estricto (Evita valores NaN o infinitos que rompen el motor)
      const resolvedNotes = rawNotes.map((n, idx) => {
        let rawT = n.timestamp_ms !== undefined ? n.timestamp_ms : (n.timeMs !== undefined ? n.timeMs : (n.timestamp !== undefined ? n.timestamp : (n.time !== undefined ? n.time : 0)));
        let t = Number(rawT);
        if (!Number.isFinite(t)) t = idx * 500;
        // Si el tiempo viene en segundos (ej. 2.5 en lugar de 2500ms), convertir a ms
        if (t > 0 && t < 100 && (n.time !== undefined || n.timeSec !== undefined)) {
          t = Math.round(t * 1000);
        }
        t = Math.round(t);

        let rawDur = n.duration_ms !== undefined ? n.duration_ms : (n.holdDuration !== undefined ? n.holdDuration : (n.duration !== undefined ? n.duration : 0));
        let dur = Number(rawDur);
        if (!Number.isFinite(dur) || dur < 0) dur = 0;
        if (dur > 0 && dur < 50 && (n.duration !== undefined || n.holdDuration !== undefined)) {
          dur = Math.round(dur * 1000);
        }
        dur = Math.round(dur);

        const laneVal = Math.max(0, Math.min(2, parseInt(n.lane !== undefined ? n.lane : (n.column !== undefined ? n.column : (n.track !== undefined ? n.track : 0)), 10) || 0));
        const isHold = n.type === 'hold' || n.type === 'long' || dur > 0;
        const typeStr = isHold ? 'hold' : ((n.type === 'swipe' || n.type === 'slide') ? 'swipe' : 'tap');
        const dirStr = n.direction || n.swipeDirection || 'up';

        return {
          id: idx,
          lane: laneVal,
          column: laneVal,
          track: laneVal,
          time: t / 1000,
          timeSec: t / 1000,
          timeMs: t,
          timestamp: t,
          timestamp_ms: t,
          type: typeStr,
          duration: dur / 1000,
          duration_ms: dur,
          holdDuration: dur / 1000,
          end_timestamp_ms: isHold ? (t + Math.max(150, dur)) : null,
          direction: dirStr,
          swipeDirection: dirStr,
          hit: false,
          holding: false,
          holdCompleted: false,
          missed: false,
          processed: false
        };
      });

      resolvedNotes.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

      const resolvedAudioBlob = audioBlob || beatmapData.audioBlob || (beatmapData.unpackedData && beatmapData.unpackedData.audioBlob);

      // 3. Estructura robusta para game.js con velocidad personalizada de música y estrellas
      let resolvedStars = null;
      if (diffLabel) {
        const sm = String(diffLabel).match(/([0-9]+(?:\.[0-9]+)?)\s*★/);
        if (sm) resolvedStars = parseFloat(sm[1]);
      }
      if (resolvedStars === null && Array.isArray(beatmapData.difficulties)) {
        const mDiff = beatmapData.difficulties.find(d => d.id === diffLabel || d.name === diffLabel);
        if (mDiff && Number.isFinite(mDiff.stars)) resolvedStars = mDiff.stars;
      }
      if (resolvedStars === null) {
        if (Number.isFinite(beatmapData.selectedStars)) resolvedStars = beatmapData.selectedStars;
        else if (Number.isFinite(beatmapData.stars) && beatmapData.stars !== 3.5) resolvedStars = beatmapData.stars;
        else if (Number.isFinite(beatmapData.metadata?.stars) && beatmapData.metadata.stars !== 3.5) resolvedStars = beatmapData.metadata.stars;
        else if (Number.isFinite(beatmapData.difficulties?.[0]?.stars)) resolvedStars = beatmapData.difficulties[0].stars;
        else if (Number.isFinite(beatmapData.stars)) resolvedStars = beatmapData.stars;
        else if (Number.isFinite(beatmapData.metadata?.stars)) resolvedStars = beatmapData.metadata.stars;
      }
      if (resolvedStars === null) {
        const dName = ((diffLabel || beatmapData.metadata?.difficulty_name || beatmapData.difficulty_name || '') + '').toLowerCase();
        if (dName.includes('fácil') || dName.includes('easy') || dName.includes('beginner')) resolvedStars = 1.5;
        else if (dName.includes('media') || dName.includes('medium') || dName.includes('normal')) resolvedStars = 3.5;
        else if (dName.includes('difícil') || dName.includes('hard')) resolvedStars = 5.5;
        else if (dName.includes('extrema') || dName.includes('extreme') || dName.includes('expert')) resolvedStars = 7.5;
        else if (dName.includes('insana') || dName.includes('insane') || dName.includes('master')) resolvedStars = 9.5;
        else resolvedStars = 3.5;
      }

      const songSpeedVal = getSongSpeed(beatmapData.id || (beatmapData.metadata && beatmapData.metadata.id) || beatmapData.communityChartId);
      const finalBeatmap = {
        songPlaybackSpeed: songSpeedVal,
        stars: resolvedStars,
        selectedStars: resolvedStars,
        metadata: {
          ...(beatmapData.metadata || {}),
          id: beatmapData.id || beatmapData.metadata?.id || 'custom_' + Date.now(),
          title: beatmapData.title || beatmapData.metadata?.title || 'Canción Creada',
          artist: beatmapData.artist || beatmapData.metadata?.artist || 'Comunidad',
          difficulty_name: diffLabel || beatmapData.metadata?.difficulty_name || 'Normal',
          stars: resolvedStars
        },
        bpm: Number(beatmapData.bpm) || 120,
        offset: Number(beatmapData.offset) || 0,
        startMarkerMs: Number(beatmapData.startMarkerMs) || (beatmapData.metadata && Number(beatmapData.metadata.startMarkerMs)) || 0,
        endMarkerMs: (Number.isFinite(beatmapData.endMarkerMs) && beatmapData.endMarkerMs > 0) ? beatmapData.endMarkerMs : ((beatmapData.metadata && Number.isFinite(beatmapData.metadata.endMarkerMs) && beatmapData.metadata.endMarkerMs > 0) ? beatmapData.metadata.endMarkerMs : null),
        endTimestampMs: (Number.isFinite(beatmapData.endTimestampMs) && beatmapData.endTimestampMs > 0) ? beatmapData.endTimestampMs : ((beatmapData.metadata && Number.isFinite(beatmapData.metadata.endTimestampMs) && beatmapData.metadata.endTimestampMs > 0) ? beatmapData.metadata.endTimestampMs : null),
        scrollDurationMs: Number(beatmapData.scrollDurationMs) || (beatmapData.metadata && Number(beatmapData.metadata.scrollDurationMs)) || 1400,
        is_daily_featured: !!beatmapData.is_daily_featured,
        is_community: !!beatmapData.is_community,
        communityChartId: beatmapData.communityChartId || beatmapData.id || (beatmapData.metadata && beatmapData.metadata.id) || null,
        source: beatmapData.source || 'catalog',
        source_name: beatmapData.source_name || 'Catálogo',
        download_url: beatmapData.download_url || '',
        md5: beatmapData.md5 || '',
        diff_id: beatmapData.diff_id || '',
        notes: resolvedNotes,
        difficulties: [{
          id: 'diff_standard',
          name: diffLabel || 'Normal',
          stars: resolvedStars,
          keys: 3,
          notes: resolvedNotes
        }]
      };

      currentActiveBeatmap = finalBeatmap;
      window.currentActiveBeatmap = finalBeatmap;
      window.isGameLoadingOrActive = true;
      currentActiveAudioBlob = resolvedAudioBlob;

      // 4. Ocultar menús y abrir interfaz de juego
      const searchScreen = document.getElementById('searchScreen');
      if (searchScreen) {
        searchScreen.classList.add('hidden');
        searchScreen.style.display = 'none';
      }

      const topHud = document.getElementById('fixedTopHud');
      if (topHud) topHud.classList.remove('hidden');

      const curtain = document.getElementById('gameCurtain');
      if (curtain) curtain.classList.add('revealed');

      const overlay = document.getElementById('globalLoadingOverlay');
      if (overlay) overlay.classList.remove('active');

      const modals = ['resultsModal', 'pauseModal', 'reviveModal', 'calibrationScreen', 'addToPlaylistModal', 'fxShopModal'];
      modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove('open');
          el.style.display = 'none';
        }
      });

      const hudScore = document.getElementById('hudScore');
      if (hudScore) hudScore.innerText = '0';
      const hudCombo = document.getElementById('hudCombo');
      if (hudCombo) hudCombo.innerText = 'COMBO 0';
      const hudComboBox = document.getElementById('hudComboContainer');
      if (hudComboBox) {
        hudComboBox.className = 'hud-combo-box';
      }
      const hudMult = document.getElementById('hudMultiplier');
      if (hudMult) {
        hudMult.innerText = '1x';
        hudMult.className = 'multiplier-badge';
      }
      const fillEl = document.getElementById('hudProgressFill');
      if (fillEl) {
        fillEl.style.width = '0%';
        fillEl.classList.remove('platinum-phase');
      }
      const platNode = document.getElementById('hudPlatinumNode');
      if (platNode) platNode.classList.add('hidden');
      const medalPill = document.getElementById('hudMedalPill');
      if (medalPill) medalPill.className = 'hud-medal-pill hidden mt-1';
      document.querySelectorAll('.star-node').forEach(el => {
        el.classList.remove('unlocked');
        el.querySelectorAll('.star-shockwave').forEach(sw => sw.remove());
      });

      // 5. Cargar en el motor de juego de forma segura
      try {
        if (engine && engine.sync) {
          engine.sync.unlockAudio();
          engine.sync.setVolume(1.0, false);
        }
        engine.loadBeatmap(finalBeatmap, resolvedAudioBlob);
      } catch (e) {
        console.error("Error al cargar beatmap en engine:", e);
        showErrorToast("Error iniciando la partida: " + e.message);
      }
    }
   
    function showResults(score, maxCombo, stars, stats, earnedClefs = 0, isNewRecord = false, finalMedal = null, scorePct = 0, earnedMedals = null, totalNotes = 0, accuracyPct = 100.0) {
      const resSongTitleEl = document.getElementById('resSongTitle');
      if (resSongTitleEl) resSongTitleEl.innerText = currentActiveBeatmap?.metadata?.title || 'Canción';
      const resDiffNameEl = document.getElementById('resDiffName');
      if (resDiffNameEl) resDiffNameEl.innerText = currentActiveBeatmap?.metadata?.difficulty_name || 'Dificultad';
      const resFinalScoreEl = document.getElementById('resFinalScore');
      if (resFinalScoreEl) resFinalScoreEl.innerText = score.toLocaleString();
      const resMaxComboEl = document.getElementById('resMaxCombo');
      if (resMaxComboEl) resMaxComboEl.innerText = maxCombo;
      
      // Recompensas de Claves de Sol (con multiplicador x2 si es Canción Destacada Diaria)
      let finalEarnedClefs = earnedClefs;
      const resEarnedClefsEl = document.getElementById('resEarnedClefs');
      if (currentActiveBeatmap?.is_daily_featured) {
        finalEarnedClefs = earnedClefs * 2;
        if (resEarnedClefsEl) resEarnedClefsEl.innerText = `${finalEarnedClefs} (¡x2 Diario!)`;
      } else {
        if (resEarnedClefsEl) resEarnedClefsEl.innerText = finalEarnedClefs;
      }
      userClefs += (finalEarnedClefs - earnedClefs); // Sumar el bonus extra si aplica
      updateUserWalletDisplay();

      // Porcentaje de puntuación real alcanzado sobre la máxima teórica (rige estrellas y medallas):
      const displayScorePct = Math.min(100.0, Math.max(0.0, scorePct));
      const resAccuracyPctEl = document.getElementById('resAccuracyPct');
      if (resAccuracyPctEl) resAccuracyPctEl.innerText = `${displayScorePct.toFixed(1)}%`;

      const badgeStatus = document.getElementById('resBadgeStatus');
      if (badgeStatus) {
        if (isNewRecord) {
          badgeStatus.innerHTML = '<span class="inline-flex items-center gap-1.5 font-bold"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/><path d="M6 9a6 6 0 0 0 12 0"/><path d="M12 15v5"/><path d="M8 20h8"/></svg> ¡NUEVO RÉCORD PERSONAL!</span>';
          badgeStatus.className = 'inline-block px-3 py-0.5 rounded-full bg-amber-500/30 text-amber-300 text-xs font-black tracking-wider uppercase border border-amber-400/50 shadow-md';
        } else {
          badgeStatus.innerText = '¡Pista Completada!';
          badgeStatus.className = 'inline-block px-3 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-xs font-black tracking-wider uppercase';
        }
      }

      // Medal Tier Badge (Plata >= 92%, Oro >= 94%, Platino >= 96%, Mínimo 100 notas)
      const medalTierBadge = document.getElementById('resMedalTierBadge');
      if (medalTierBadge) {
        if (finalMedal === 'platinum') {
          medalTierBadge.innerHTML = '<span class="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/></svg> MAESTRÍA PLATINO (96%+)</span>';
          medalTierBadge.className = 'mt-1 inline-block px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-lg shadow-cyan-500/30';
          medalTierBadge.style.display = 'inline-block';
        } else if (finalMedal === 'gold') {
          medalTierBadge.innerHTML = '<span class="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="#fcd34d" stroke="#fcd34d" stroke-width="1.5"><circle cx="12" cy="12" r="7"/></svg> MAESTRÍA ORO (94%+)</span>';
          medalTierBadge.className = 'mt-1 inline-block px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-lg shadow-amber-500/30';
          medalTierBadge.style.display = 'inline-block';
        } else if (finalMedal === 'silver') {
          medalTierBadge.innerHTML = '<span class="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="#cbd5e1" stroke="#cbd5e1" stroke-width="1.5"><circle cx="12" cy="12" r="7"/></svg> MAESTRÍA PLATA (92%+)</span>';
          medalTierBadge.className = 'mt-1 inline-block px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase bg-slate-500/20 text-slate-200 border border-slate-300/50 shadow-lg';
          medalTierBadge.style.display = 'inline-block';
        } else if (totalNotes > 0 && totalNotes < 100 && displayScorePct >= 92.0) {
          medalTierBadge.innerText = 'ℹ️ MÍNIMO 100 NOTAS PARA MEDALLAS';
          medalTierBadge.className = 'mt-1 inline-block px-3 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-md';
          medalTierBadge.style.display = 'inline-block';
        } else {
          medalTierBadge.style.display = 'none';
        }
      }

      // Stars rendering with silver / gold / platinum states
      const resStarsEl = document.getElementById('resStars');
      if (resStarsEl) {
        resStarsEl.className = `relative z-30 flex justify-center items-center gap-2 my-2.5 text-2xl ${finalMedal || ''}`;
        const starEls = resStarsEl.querySelectorAll('.star-icon');
        starEls.forEach((el, idx) => {
          el.className = 'star-icon';
          if (idx < stars) {
            el.classList.add('active');
            if (finalMedal) el.classList.add(finalMedal);
          }
        });
      }

      // Earned Medals Badges
      const earnedMedalsEl = document.getElementById('resEarnedMedalsBadges');
      if (earnedMedalsEl) {
        let badgesHtml = '';
        if (earnedMedals) {
          if (earnedMedals.platinum) badgesHtml += '<span class="medal-badge medal-badge-platinum inline-flex items-center gap-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/></svg> +1</span>';
          if (earnedMedals.gold) badgesHtml += '<span class="medal-badge medal-badge-gold inline-flex items-center gap-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="#fcd34d" stroke="#fcd34d" stroke-width="1.5"><circle cx="12" cy="12" r="7"/></svg> +1</span>';
          if (earnedMedals.silver) badgesHtml += '<span class="medal-badge medal-badge-silver inline-flex items-center gap-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="#cbd5e1" stroke="#cbd5e1" stroke-width="1.5"><circle cx="12" cy="12" r="7"/></svg> +1</span>';
        }
        earnedMedalsEl.innerHTML = badgesHtml;
      }

      const resPPlusEl = document.getElementById('resPPlus');
      if (resPPlusEl) resPPlusEl.innerText = stats.perfectPlus;
      const resPEl = document.getElementById('resP');
      if (resPEl) resPEl.innerText = stats.perfect;
      const resGEl = document.getElementById('resG');
      if (resGEl) resGEl.innerText = stats.great;
      const resMEl = document.getElementById('resM');
      if (resMEl) resMEl.innerText = stats.miss;

      // Módulo de valoración disponible para TODAS las canciones (solo estrellas 1-5, sin sincronización)
      const commRatingSec = document.getElementById('resCommunityRatingSection');
      if (commRatingSec) {
        commRatingSec.classList.remove('hidden');
        commRatingSec.style.display = 'block';
        postGameCurrentRating = 5;
        postGameCurrentSync = 100;
        commRatingSec.innerHTML = `
          <div class="flex items-center justify-between px-1">
            <span class="text-[10px] font-bold text-pink-300 flex items-center gap-1">
              <span>★</span> Calificar Canción:
            </span>
            <span id="postGameRatingVal" class="text-[10px] font-black text-amber-400">5 / 5 Estrellas</span>
          </div>
          <div class="flex justify-center items-center gap-2 text-2xl py-0.5" id="communityRatingStars">
            <span class="cursor-pointer transition hover:scale-125 select-none text-amber-400" onclick="setPostGameRating(1)">★</span>
            <span class="cursor-pointer transition hover:scale-125 select-none text-amber-400" onclick="setPostGameRating(2)">★</span>
            <span class="cursor-pointer transition hover:scale-125 select-none text-amber-400" onclick="setPostGameRating(3)">★</span>
            <span class="cursor-pointer transition hover:scale-125 select-none text-amber-400" onclick="setPostGameRating(4)">★</span>
            <span class="cursor-pointer transition hover:scale-125 select-none text-amber-400" onclick="setPostGameRating(5)">★</span>
          </div>
          <button id="btnSubmitPostRating" onclick="submitPostGameRating()" class="w-full py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 rounded-xl text-xs font-black text-white shadow-md cursor-pointer transition active:scale-95">
            Enviar Valoración
          </button>
        `;
        updatePostGameRatingUI();
      }

      // Cargar clasificación directamente en pantalla de resultados
      const currentChartId = currentActiveBeatmap?.communityChartId || currentActiveBeatmap?.metadata?.id || currentActiveBeatmap?.id || 'song';
      currentInlineLeaderboardChartId = currentChartId;
      switchInlineLeaderboard('song');

      const exitResultsBtn = document.querySelector('#resultsModal button[onclick="exitToSearch()"]');
      if (exitResultsBtn) {
        exitResultsBtn.innerText = window.isPlaytestingFromEditor ? 'Volver al Editor' : 'Explorar Más';
      }
      const btnResPrimaryLabel = document.getElementById('btnResPrimaryLabel');
      if (btnResPrimaryLabel) {
        btnResPrimaryLabel.innerText = window.isPlaytestingFromEditor ? 'VOLVER AL EDITOR' : 'EXPLORAR CATÁLOGO';
      }

      const modal = document.getElementById('resultsModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
      }

      // Desencadenar animación analógica y sonido de máquina de escribir vintage
      triggerVintageResultsScreen(score, maxCombo, stars, stats, finalEarnedClefs, isNewRecord, finalMedal, scorePct);
    }

    function restartCurrentSong() {
      clearResultsTypewriterSequences();
      const modal = document.getElementById('resultsModal');
      if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
      }
      if (engine && engine.beatmapData) {
        engine.restart();
      } else if (currentActiveBeatmap && currentActiveAudioBlob) {
        startGame(currentActiveBeatmap, currentActiveAudioBlob, currentActiveBeatmap.metadata?.difficulty_name);
      }
    }

    // ==========================================
    // LIBRARY SUBTABS RENDERING (Downloads, Favorites, Playlists)
    // ==========================================

    async function renderDownloadsSubtab() {
      const container = document.getElementById('libraryTracksList');
      if (!container) return;

      try {
        const savedCharts = await IndexedDBStorage.getAllCharts();
        if (!savedCharts || savedCharts.length === 0) {
          container.innerHTML = `
            <div class="p-8 text-center text-xs text-gray-400 glass-card space-y-1.5">
              <p class="font-bold text-sm text-gray-300">${t('lib_downloads_empty_title', 'Sin descargas offline')}</p>
              <p class="text-[10px] text-gray-500">${t('lib_downloads_empty_sub', 'Juega canciones en el buscador para guardarlas aquí automáticamente.')}</p>
            </div>
          `;
          return;
        }

        const cardsHtml = savedCharts.map(item => {
          const hs = highscores[item.id];
          const isFav = favoriteIdsSet.has(item.id);
          const sId = safeSongId(item.id);

          const diffName = item.metadata?.difficulty_name || item.difficulty_name || 'Normal';
          const starsVal = Number.isFinite(item.metadata?.stars) ? item.metadata.stars : (Number.isFinite(item.stars) ? item.stars : 3.5);
          const safeTitle = (item.title || t('unknown_song', 'Canción')).replace(/'/g, "\\'");
          const safeArtist = (item.artist || t('unknown_artist', 'Artista')).replace(/'/g, "\\'");

          return `
            <div class="piano-key-row flex flex-col">
              <div class="flex items-stretch w-full max-w-full overflow-hidden">
                <!-- White Ivory Key Body (Opens Accordion) -->
                <div onclick="togglePianoAccordion('${sId}')" class="piano-white-key flex-1 min-w-0 overflow-hidden" title="Ver opciones y tempo">
                  <div class="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                    <!-- Round Inlaid Medallion Artwork -->
                    <div class="piano-key-thumb relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[#c5a059] shadow-sm flex items-center justify-center bg-stone-900">
                      <img src="${item.thumbnail || GENERIC_THUMBNAIL}" alt="" class="w-full h-full object-cover rounded-full" loading="lazy" onerror="this.onerror=null; this.src=GENERIC_THUMBNAIL;">
                    </div>
                    <!-- Track Metadata -->
                    <div class="min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
                      <div class="flex items-center gap-1.5 truncate">
                        <h3 class="text-xs font-black text-[#17131d] truncate font-serif leading-tight">${escapeHtml(item.title || t('unknown_song', 'Canción'))}</h3>
                        ${hs ? `<span class="text-[8px] font-mono font-bold text-amber-800 flex-shrink-0 flex items-center gap-0.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="text-amber-700 inline"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/><path d="M6 9a6 6 0 0 0 12 0"/><path d="M12 15v5"/><path d="M8 20h8"/></svg> ${hs.score.toLocaleString()}</span>` : ''}
                      </div>
                      <p class="text-[10px] text-[#5a422d] font-semibold truncate leading-tight mt-0.5">${escapeHtml(item.artist || t('unknown_artist', 'Artista'))} • <span class="text-[#2b1f13]">${diffName}</span></p>
                    </div>
                  </div>
                  <!-- Single Star Metric -->
                  <div class="flex items-center gap-1.5 flex-shrink-0 ml-1.5">
                    <span class="text-[11px] font-black text-[#9c7329] font-mono whitespace-nowrap">★ ${starsVal.toFixed(1)}</span>
                    <span id="accordionArrow_${sId}" class="text-[9px] text-[#8e755a] transition-transform duration-200">▼</span>
                  </div>
                </div>

                <!-- Fixed 3D Ebony Black Play Key (INDESTRUCTIBLE & ALWAYS VISIBLE) -->
                <div 
                  onclick="playSavedLibraryChart('${item.id}')" 
                  class="piano-black-play-key flex-shrink-0 w-12 min-w-[48px]" 
                  title="${t('play')}"
                >
                  <span class="play-arrow-gold">▶</span>
                </div>
              </div>

              <!-- Soundboard Accordion ("Caja de Resonancia") -->
              <div id="pianoAccordion_${sId}" class="piano-soundboard-accordion">
                <div class="p-2.5 space-y-2">
                  <div class="flex items-center justify-between gap-2 pt-1 text-[11px]">
                    <div class="flex items-center gap-2">
                      <span class="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Tempo:</span>
                      ${renderSongSpeedHtml(item.id).btn}
                    </div>
                    <div class="flex items-center gap-2">
                      <button onclick="toggleFavoriteSong('${item.id}')" data-id="${item.id}" class="piano-card-action-btn heart-btn ${isFav ? 'active' : ''}" title="${t('add_fav')}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFav ? '#e5b869' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                      </button>
                      <button onclick="openRateSongModal('${item.id}', '${safeTitle}', '${safeArtist}', '${diffName}', ${starsVal}, ${!!(item.is_community || item.source === 'community')})" class="text-[10px] text-amber-400 hover:scale-105 transition font-bold" title="${t('rate_song', 'Calificar')}">
                        ★ Calificar
                      </button>
                      <button onclick="deleteSavedLibraryChart('${item.id}')" class="text-[10px] text-rose-400 hover:text-rose-300 transition" title="${t('delete_offline', 'Eliminar')}">
                        ✕ Borrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');

        container.innerHTML = `
          <div class="piano-keyboard-bed">
            <div class="piano-felt-top-strip"></div>
            ${cardsHtml}
          </div>
        `;
      } catch (e) {
        container.innerHTML = `<div class="p-4 text-xs text-red-400">Error: ${e.message}</div>`;
      }
    }

    async function renderFavoritesSubtab() {
      const container = document.getElementById('favoritesTracksList');
      if (!container) return;

      try {
        const favs = await IndexedDBStorage.getAllFavorites();
        if (!favs || favs.length === 0) {
          container.innerHTML = `
            <div class="p-8 text-center text-xs text-gray-400 glass-card space-y-1.5">
              <p class="font-bold text-sm text-gray-300">${t('lib_empty_fav_title', 'No tienes favoritos aún')}</p>
              <p class="text-[10px] text-gray-500">${t('lib_empty_fav_sub', 'Pulsa el corazón en cualquier canción para tenerla a mano.')}</p>
            </div>
          `;
          return;
        }

        const cardsHtml = favs.map(item => {
          const hs = highscores[item.id];
          const hasDiffs = Array.isArray(item.difficulties) && item.difficulties.length > 0;
          const sId = safeSongId(item.id);
          const primaryDiff = hasDiffs ? item.difficulties[0] : null;
          const starsNum = primaryDiff?.stars || item.stars || 3.5;

          const defaultPlayAction = hasDiffs
            ? `downloadAndPlaySong('${item.id}', '${item.difficulties[0].id}', '${(item.difficulties[0].name || 'Normal').replace(/'/g, "\\'")}')`
            : `playSavedLibraryChart('${item.id}')`;

          const diffChipsHtml = hasDiffs ? item.difficulties.map(diff => {
            const cleanName = (diff.name || 'Normal').replace(/\[\d+K\]\s*/gi, '').replace(/^\[[^\]]+\]\s*/, '').trim() || 'Normal';
            const starsText = diff.stars ? `${diff.stars.toFixed(1)}★` : '';
            return `
              <button onclick="downloadAndPlaySong('${item.id}', '${diff.id}', '${cleanName.replace(/'/g, "\\'")}')" class="piano-diff-chip active" title="Jugar dificultad ${cleanName}">
                <span>${cleanName}</span>
                ${starsText ? `<span class="font-mono text-[9.5px] opacity-90">${starsText}</span>` : ''}
              </button>
            `;
          }).join('') : '';

          return `
            <div class="piano-key-row flex flex-col">
              <div class="flex items-stretch w-full max-w-full overflow-hidden">
                <!-- White Ivory Key Body (Opens Accordion) -->
                <div onclick="togglePianoAccordion('${sId}')" class="piano-white-key flex-1 min-w-0 overflow-hidden" title="Ver opciones y dificultades">
                  <div class="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                    <!-- Round Inlaid Medallion -->
                    <div class="piano-key-thumb relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[#c5a059] shadow-sm flex items-center justify-center bg-stone-900">
                      <img src="${item.thumbnail || GENERIC_THUMBNAIL}" alt="" class="w-full h-full object-cover rounded-full" loading="lazy" onerror="this.onerror=null; this.src=GENERIC_THUMBNAIL;">
                    </div>
                    <!-- Track Metadata -->
                    <div class="min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
                      <div class="flex items-center gap-1.5 truncate">
                        <h3 class="text-xs font-black text-[#17131d] truncate font-serif leading-tight">${escapeHtml(item.title || t('unknown_song', 'Canción'))}</h3>
                        ${hs ? `<span class="text-[8px] font-mono font-bold text-amber-800 flex-shrink-0 flex items-center gap-0.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="text-amber-700 inline"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/><path d="M6 9a6 6 0 0 0 12 0"/><path d="M12 15v5"/><path d="M8 20h8"/></svg> ${hs.score.toLocaleString()}</span>` : ''}
                      </div>
                      <p class="text-[10px] text-[#5a422d] font-semibold truncate leading-tight mt-0.5">${escapeHtml(item.artist || t('unknown_artist', 'Artista'))}</p>
                    </div>
                  </div>
                  <!-- Single Star Metric -->
                  <div class="flex items-center gap-1.5 flex-shrink-0 ml-1.5">
                    <span class="text-[11px] font-black text-[#9c7329] font-mono whitespace-nowrap">★ ${starsNum.toFixed(1)}</span>
                    <span id="accordionArrow_${sId}" class="text-[9px] text-[#8e755a] transition-transform duration-200">▼</span>
                  </div>
                </div>

                <!-- Fixed 3D Ebony Black Play Key (INDESTRUCTIBLE & ALWAYS VISIBLE) -->
                <div 
                  onclick="${defaultPlayAction}" 
                  class="piano-black-play-key flex-shrink-0 w-12 min-w-[48px]" 
                  title="${t('play')}"
                >
                  <span class="play-arrow-gold">▶</span>
                </div>
              </div>

              <!-- Soundboard Accordion ("Caja de Resonancia") -->
              <div id="pianoAccordion_${sId}" class="piano-soundboard-accordion">
                <div class="p-2.5 space-y-2">
                  ${hasDiffs && item.difficulties.length > 1 ? `
                    <div>
                      <span class="text-[9px] font-bold text-[#c5a059] uppercase tracking-wider block mb-1">Dificultades Disponibles</span>
                      <div class="flex items-center gap-1.5 flex-wrap">
                        ${diffChipsHtml}
                      </div>
                    </div>
                  ` : ''}
                  <div class="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px]">
                    <div class="flex items-center gap-2">
                      <span class="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Tempo:</span>
                      ${renderSongSpeedHtml(item.id).btn}
                    </div>
                    <div class="flex items-center gap-2">
                      <button onclick="toggleFavoriteSong('${item.id}')" data-id="${item.id}" class="piano-card-action-btn heart-btn active" title="${t('add_fav')}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#e5b869" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                      </button>
                      <button onclick="openAddToPlaylistModal('${item.id}')" class="piano-card-action-btn" title="${t('add_playlist')}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');

        container.innerHTML = `
          <div class="piano-keyboard-bed">
            <div class="piano-felt-top-strip"></div>
            ${cardsHtml}
          </div>
        `;
      } catch (e) {
        container.innerHTML = `<div class="p-4 text-xs text-red-400">Error: ${e.message}</div>`;
      }
    }

    async function renderPlaylistsSubtab() {
      const container = document.getElementById('playlistsList');
      if (!container) return;

      try {
        const playlists = await IndexedDBStorage.getAllPlaylists();
        if (!playlists || playlists.length === 0) {
          container.innerHTML = `
            <div class="p-8 text-center text-xs text-gray-400 glass-card space-y-1.5">
              <p class="font-bold text-sm text-gray-300">${t('lib_pl_empty_title', 'No hay playlists guardadas aún')}</p>
              <p class="text-[10px] text-gray-500">${t('lib_pl_empty_sub', 'Importa una playlist de YouTube o crea una pulsando + en cualquier canción.')}</p>
            </div>
          `;
          return;
        }

        container.innerHTML = playlists.map(pl => {
          const trackCount = pl.tracks ? pl.tracks.length : 0;
          return `
            <div class="result-card justify-between p-3">
              <div onclick="openPlaylistDetailView('${pl.id}')" class="flex-1 flex items-center gap-2.5 min-w-0 cursor-pointer">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600/40 to-pink-600/40 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-md text-amber-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-white truncate">${pl.title}</p>
                  <p class="text-[10px] text-cyan-300 font-semibold">${trackCount} ${t('disc_tracks', 'canciones')}</p>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <button onclick="openPlaylistDetailView('${pl.id}')" class="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs font-bold transition cursor-pointer">
                  ${t('view_playlist', 'Ver')}
                </button>
                <button onclick="deletePlaylistConfirm('${pl.id}')" class="text-gray-500 hover:text-red-400 p-1.5 text-xs cursor-pointer" title="Eliminar Playlist">✕</button>
              </div>
            </div>
          `;
        }).join('');
      } catch (e) {
        container.innerHTML = `<div class="p-4 text-xs text-red-400">Error: ${e.message}</div>`;
      }
    }

    async function openPlaylistDetailView(playlistId) {
      const pl = await IndexedDBStorage.getPlaylist(playlistId);
      if (!pl) return;

      document.getElementById('playlistsList').classList.add('hidden');
      const detailView = document.getElementById('selectedPlaylistView');
      detailView.classList.remove('hidden');
      document.getElementById('selectedPlaylistTitle').innerText = pl.title;

      const tracksCont = document.getElementById('playlistTracksContainer');
      const tracks = pl.tracks || [];

      if (tracks.length === 0) {
        tracksCont.innerHTML = `<p class="text-xs text-gray-400 text-center py-4">Esta playlist no tiene canciones añadidas.</p>`;
        return;
      }

      tracksCont.innerHTML = tracks.map(tr => {
        const searchTitle = tr.title.replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim();
        return `
          <div class="result-card p-2.5 justify-between">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div class="relative w-12 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-black/50 border border-white/10">
                <img src="${tr.thumbnail || GENERIC_THUMBNAIL}" alt="" class="w-full h-full object-cover" onerror="this.onerror=null; this.src=GENERIC_THUMBNAIL;">
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-white truncate">${tr.title}</p>
                <p class="text-[9px] text-gray-400 truncate">${Array.isArray(tr.artists) ? tr.artists.join(', ') : (tr.artist || 'YouTube')}</p>
              </div>
            </div>

            <!-- Action: Search and Play Beatmap -->
            <div class="flex items-center gap-1.5">
              <button onclick="searchAndPlayFromPlaylistTrack('${searchTitle.replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer hover:from-pink-400 flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Jugar
              </button>
              <button onclick="removeTrackFromPlaylistAction('${pl.id}', '${tr.id}')" class="text-gray-500 hover:text-red-400 p-1 text-xs cursor-pointer" title="Quitar de playlist">
                ✕
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function closePlaylistDetailView() {
      document.getElementById('selectedPlaylistView').classList.add('hidden');
      document.getElementById('playlistsList').classList.remove('hidden');
    }

    async function deletePlaylistConfirm(playlistId) {
      if (confirm('¿Eliminar esta playlist?')) {
        await IndexedDBStorage.deletePlaylist(playlistId);
        showSuccessToast('Playlist eliminada.');
        renderPlaylistsSubtab();
      }
    }

    async function removeTrackFromPlaylistAction(playlistId, trackId) {
      await IndexedDBStorage.removeTrackFromPlaylist(playlistId, trackId);
      showSuccessToast('Canción quitada de la playlist.');
      openPlaylistDetailView(playlistId);
    }

    function searchAndPlayFromPlaylistTrack(songTitle) {
      document.getElementById('searchInput').value = songTitle;
      switchMainTab('search');
      executeSearch();
    }

    async function playSavedLibraryChart(chartId) {
      try {
        const item = await IndexedDBStorage.getChart(chartId);
        if (!item || !item.audioBlob) {
          showErrorToast('Canción no encontrada en almacenamiento.');
          return;
        }
        currentActiveChartItem = item;
        currentActiveAudioBlob = item.audioBlob;
        startGame(item, item.audioBlob, item.metadata?.difficulty_name);
      } catch (err) {
        showErrorToast('Error cargando canción: ' + err.message);
      }
    }

    async function deleteSavedLibraryChart(chartId) {
      if (confirm('¿Eliminar esta canción del almacenamiento local?')) {
        await IndexedDBStorage.deleteChart(chartId);
        showSuccessToast('Canción eliminada de la biblioteca.');
        renderDownloadsSubtab();
      }
    }

    window.promptClearAllStorage = async function() {
      if (confirm('¿Estás seguro de que deseas eliminar permanentemente todas las canciones descargadas de la memoria local?\n\nTu progreso, récords, divisas y ajustes se mantendrán.')) {
        // Snapshot economy & progress keys before any clear
        const PROTECTED_KEYS = [
          'game_claves_de_sol', 'game_platas', 'game_oros', 'game_diamantes',
          'beatstar_clefs', 'beatstar_silvers', 'beatstar_golds', 'beatstar_platinums',
          'beatstar_highscores', 'beatstar_active_effect', 'beatstar_unlocked_effects',
          'beatstar_note_speed', 'beatstar_map_density', 'beatstar_continue_mode',
          'beatstar_offset', 'beatstar_judge_colors', 'beatstar_api_server'
        ];
        const snapshot = {};
        PROTECTED_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v !== null) snapshot[k] = v; });

        const ok = await IndexedDBStorage.clearAllDownloadedData();
        if (ok) {
          // Restore protected keys in case clearAllDownloadedData touched localStorage
          PROTECTED_KEYS.forEach(k => { if (snapshot[k] !== undefined) localStorage.setItem(k, snapshot[k]); });
          showSuccessToast('Biblioteca local liberada con éxito. Divisas y récords conservados.');
          if (currentLibrarySubtab === 'downloads') {
            renderDownloadsSubtab();
          }
        } else {
          showErrorToast('Error al intentar liberar el almacenamiento local.');
        }
      }
    };

    window.discoverCategory = function(catName, query) {
      const input = document.getElementById('searchInput');
      if (input) input.value = query;
      executeSearch();
      showSuccessToast(`Explorando: ${catName}`);
    };

    window.discoverTrending = async function() {
      const btnText = document.getElementById('searchBtnText');
      const spinner = document.getElementById('searchSpinner');
      const resultsList = document.getElementById('resultsList');
      const input = document.getElementById('searchInput');
      if (input) input.value = 'Tendencias Populares';

      if (btnText) btnText.innerText = 'Cargando...';
      if (spinner) spinner.classList.remove('hidden');
      resultsList.innerHTML = `<div class="p-8 text-center text-xs text-gray-400 glass-card">Cargando mapas populares de la comunidad...</div>`;

      try {
        const resp = await fetch('https://api.nerinyan.moe/search?m=3&s=ranked&sort=plays&p=1');
        if (!resp.ok) throw new Error('No se pudo conectar con el servidor de tendencias.');
        const data = await resp.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('No se encontraron canciones.');

        const mapped = data.map(set => {
          const maniaDiffs = (set.beatmaps || []).filter(b => b.mode === 3 || b.mode === 'mania' || b.cs === 3 || b.cs === 4 || b.cs === 7);
          return {
            id: `osu_${set.id}`,
            title: set.title || 'Canción Popular',
            artist: set.artist || 'Artista Popular',
            creator: set.creator || 'osu!',
            source: 'osu_mania',
            source_name: 'osu! Mania (Popular)',
            thumbnail: `https://assets.ppy.sh/beatmaps/${set.id}/covers/card.jpg`,
            download_url: `/api/v1/download/osu/${set.id}`,
            direct_download_url: `https://api.nerinyan.moe/d/${set.id}?noVideo=true`,
            fallback_download_url: `/api/v1/download/osu/${set.id}`,
            difficulties: (maniaDiffs.length > 0 ? maniaDiffs : (set.beatmaps || [])).map(b => ({
              id: b.id.toString(),
              name: b.version || 'Mania',
              stars: b.difficulty_rating || 3.0,
              label: `${b.version || 'Mania'} (${(b.difficulty_rating || 3.0).toFixed(1)}★)`
            }))
          };
        });

        searchResultsCache = mapped;
        renderSearchResults(sortItemsByTargetDifficulty(mapped, currentTargetDifficulty), []);
        showSuccessToast('Mapas más jugados de la comunidad cargados.');
      } catch (err) {
        console.warn('Nerinyan trending error, fallback to search:', err);
        executeSearch();
      } finally {
        if (btnText) btnText.innerText = 'Buscar';
        if (spinner) spinner.classList.add('hidden');
      }
    };

    async function playRandomLibraryTrack() {
      const charts = await IndexedDBStorage.getAllCharts();
      if (!charts || charts.length === 0) {
        showErrorToast('No hay canciones descargadas en la biblioteca.');
        return;
      }
      const rand = charts[Math.floor(Math.random() * charts.length)];
      playSavedLibraryChart(rand.id);
    }

    // ==========================================
    // YOUTUBE PLAYLIST IMPORT (CURATED DATABASE + FAIL-PROOF ENGINE)
    // ==========================================

    const CURATED_PLAYLIST_DATABASE = {
      'PLMC9KNkIncKtPzgY-5fP50P4GvB_b4_0d': {
        title: 'Rock Clásico & Heavy Metal',
        tracks: [
          { id: 'v2AC41dglnM', title: 'Back In Black', artist: 'AC/DC' },
          { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen' },
          { id: 'CD-E-LDc384', title: 'Enter Sandman', artist: 'Metallica' },
          { id: 'hTWKbfoikeg', title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
          { id: 'eVTXPUF4Oz4', title: 'In The End', artist: 'Linkin Park' },
          { id: '1w7OgIMMRc4', title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
          { id: 'lDK9QqIzhwk', title: "Livin' On A Prayer", artist: 'Bon Jovi' },
          { id: 'CSvFpBOe8eY', title: 'Chop Suey!', artist: 'System Of A Down' },
          { id: '3YxaaGgTQYM', title: 'Bring Me To Life', artist: 'Evanescence' },
          { id: 'Soa3gO7tL-c', title: 'Boulevard of Broken Dreams', artist: 'Green Day' },
          { id: 'YlUKcNNmywk', title: 'Californication', artist: 'Red Hot Chili Peppers' },
          { id: 'VrZ4sMRYimw', title: "The Kids Aren't Alright", artist: 'The Offspring' },
          { id: '6fVE8kSM43I', title: 'Duality', artist: 'Slipknot' },
          { id: 'DelhLppPSxY', title: 'Hail to the King', artist: 'Avenged Sevenfold' },
          { id: 'SBjQ9tuuTJQ', title: 'The Pretender', artist: 'Foo Fighters' },
          { id: 'kXYiU_JCYtU', title: 'Numb', artist: 'Linkin Park' },
          { id: 'A_J7dg4AMyw', title: 'Toxicity', artist: 'System Of A Down' },
          { id: 'qfZVu0alU0o', title: 'Highway to Hell', artist: 'AC/DC' },
          { id: 'rMbATaj7Il8', title: 'Master of Puppets', artist: 'Metallica' },
          { id: 'w9TGj2CrJcw', title: 'The Final Countdown', artist: 'Europe' }
        ]
      },
      'PLDIoUOhQQPlXr6373oT_gM_n3V7kE9e6b': {
        title: 'Electrónica, EDM & Phonk',
        tracks: [
          { id: 'w-sQRS-Mt9k', title: 'Murder In My Mind', artist: 'Kordhell' },
          { id: '1-xGerv5FOk', title: 'Close Eyes', artist: 'DVRST' },
          { id: '60ItHLz5WEA', title: 'Faded', artist: 'Alan Walker' },
          { id: 'UtF6Jej8yb4', title: 'The Nights', artist: 'Avicii' },
          { id: 'YJVmu6yttiw', title: 'Bangarang', artist: 'Skrillex' },
          { id: 'n8X9_MgEdCg', title: 'Unity', artist: 'TheFatRat' },
          { id: 'gCYcHz2k5x0', title: 'Animals', artist: 'Martin Garrix' },
          { id: 'ALZHF5UqnU4', title: 'Alone', artist: 'Marshmello' },
          { id: 'iLBBRuVDOo4', title: 'Astronomia', artist: 'Vicetone & Tony Igy' },
          { id: 'HMUDVMiITOU', title: 'Turn Down for What', artist: 'DJ Snake' },
          { id: 'tKi9Z-f6qX4', title: 'Strobe', artist: 'Deadmau5' },
          { id: 'IxxstCcJlsc', title: 'Clarity', artist: 'Zedd' },
          { id: 'G6GIdGhXYHw', title: 'Monody', artist: 'TheFatRat' },
          { id: 'jofNR_WkoCE', title: 'Spectre', artist: 'Alan Walker' },
          { id: 'K4DyBUG242c', title: 'Wake Me Up', artist: 'Avicii' },
          { id: 'fKopy74weus', title: 'Thunder', artist: 'Gabry Ponte & LUM!X' },
          { id: 'x_7d7qV9M-U', title: 'Scary Monsters and Nice Sprites', artist: 'Skrillex' },
          { id: 'ebXbLfLAC34', title: 'Tremor', artist: 'Dimitri Vegas & Like Mike' },
          { id: 'vQ3XgMKAgxc', title: 'Nevada', artist: 'Vicetone' },
          { id: 'p7ZsBPK656s', title: 'Fly Away', artist: 'TheFatRat' }
        ]
      },
      'PLrEnWoR732-Dbg4wY_wU601EaTz2v4c5d': {
        title: 'Top Éxitos Globales & Pop Latino',
        tracks: [
          { id: 'TUVcZfQe-Kw', title: 'Levitating', artist: 'Dua Lipa' },
          { id: '4NRXx6U8ABQ', title: 'Blinding Lights', artist: 'The Weeknd' },
          { id: 'cr46L6sK3vA', title: 'Tití Me Preguntó', artist: 'Bad Bunny' },
          { id: 'DyDfgMOUjCI', title: 'bad guy', artist: 'Billie Eilish' },
          { id: 'A_g3lMcUWy0', title: 'Quevedo: Bzrp Music Sessions, Vol. 52', artist: 'Bizarrap & Quevedo' },
          { id: 'H5v3kku4y6Q', title: 'As It Was', artist: 'Harry Styles' },
          { id: 'gNi_6U5Pm_o', title: 'good 4 u', artist: 'Olivia Rodrigo' },
          { id: 'UqyT8IEBbiY', title: '24K Magic', artist: 'Bruno Mars' },
          { id: 'T2mQBKFz2_k', title: 'Todo De Ti', artist: 'Rauw Alejandro' },
          { id: '7b_vE7S5Rlg', title: 'DESPECHÁ', artist: 'ROSALÍA' },
          { id: 'CocEMWJyvEU', title: 'Shakira: Bzrp Music Sessions, Vol. 53', artist: 'Bizarrap & Shakira' },
          { id: 'bESGLojNYSo', title: 'Poker Face', artist: 'Lady Gaga' },
          { id: 'ic8j13piAhQ', title: 'Cruel Summer', artist: 'Taylor Swift' },
          { id: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran' },
          { id: 'wXhTHyIgQ_U', title: 'Circles', artist: 'Post Malone' },
          { id: 'fKopy74weus', title: 'Starboy', artist: 'The Weeknd' },
          { id: '09R8_2nJtjg', title: 'Sugar', artist: 'Maroon 5' },
          { id: 'YQHsXMglC9A', title: 'Hello', artist: 'Adele' },
          { id: 'CevxZvSJLk8', title: 'Roar', artist: 'Katy Perry' },
          { id: 'e-ORhEE9VVg', title: 'Blank Space', artist: 'Taylor Swift' }
        ]
      },
      'PLFPg_IUxqnZN3mQy8bQ8k8kL7eZ9w6kL7': {
        title: 'Gaming & Anime Soundtracks',
        tracks: [
          { id: 'CwkzK-F0Y00', title: 'Gurenge (Demon Slayer)', artist: 'LiSA' },
          { id: 'aJReX349qls', title: 'Blue Bird (Naruto Shippuden)', artist: 'Ikimonogakari' },
          { id: 'wDGhu8-4N-4', title: 'MEGALOVANIA', artist: 'Toby Fox' },
          { id: 'QHRuTYtSbJQ', title: 'BFG Division', artist: 'Mick Gordon' },
          { id: 'UOxkGD8qRB4', title: 'POP/STARS', artist: 'K/DA' },
          { id: '7aMOurgDB-o', title: 'Unravel (Tokyo Ghoul)', artist: 'TK from Ling Tosite Sigure' },
          { id: '1tk1pqwrOys', title: 'Kaikai Kitan (Jujutsu Kaisen)', artist: 'Eve' },
          { id: '8ZtGDSZie5I', title: 'Sign (Naruto Shippuden)', artist: 'FLOW' },
          { id: 'CID-sYQNCew', title: 'Guren no Yumiya (Attack on Titan)', artist: 'Linked Horizon' },
          { id: 'aBkTkxKDduc', title: 'Sweden (Minecraft)', artist: 'C418' },
          { id: 'Egn_VNVKzI4', title: 'Weight of the World', artist: 'Keiichi Okabe' },
          { id: '0Hkn-LSh7es', title: 'Sealed Vessel', artist: 'Christopher Larkin' },
          { id: 'eFVj0Z6ahcI', title: 'Last Surprise (Persona 5)', artist: 'Shoji Meguro' },
          { id: 'pVIxP_6D2vU', title: 'Silhouette (Naruto Shippuden)', artist: 'KANA-BOON' },
          { id: 'v7BddPYY4fo', title: 'Again (Fullmetal Alchemist)', artist: 'YUI' },
          { id: 'Bw-5Lka7gPE', title: 'Crossing Field (Sword Art Online)', artist: 'LiSA' },
          { id: 'vGrcF_z2WdQ', title: 'Bury the Light (Devil May Cry 5)', artist: 'Casey Edwards' },
          { id: 'L_LUpnjgPso', title: 'The Only Thing They Fear Is You', artist: 'Mick Gordon' },
          { id: '8Z9zXpD7nFU', title: 'Henshin (Chainsaw Man Kick Back)', artist: 'Kenshi Yonezu' },
          { id: 'p6Ya0hG4j4g', title: 'Godish', artist: 'PinocchioP' }
        ]
      },
      'PLrEnWoR732-DN60m_18p_k_XoJ6Z3d3vH': {
        title: 'Speed & Hardcore Beats (Pro Mania)',
        tracks: [
          { id: 'C_q3g3c0Rrg', title: 'GHOST', artist: 'Camellia' },
          { id: '7y_2i7h4T9k', title: 'Crystallized', artist: 'Camellia' },
          { id: 'a5q3j2c7X9A', title: 'Bookmaker', artist: 'Kobaryo' },
          { id: '0jgrCKhxE1s', title: 'Through the Fire and Flames', artist: 'DragonForce' },
          { id: '6vY_G4w5ZqE', title: 'Dynamite', artist: 'USAO' },
          { id: '8X9zXpD7nFU', title: 'cheatreal', artist: 't+pazolite' },
          { id: '7y_2i7h4T9M', title: 'Sound Chimera', artist: 'Laur' },
          { id: 'CwkzK-F0Y00', title: 'Next Level', artist: 'lapix' },
          { id: 'wDGhu8-4N-4', title: 'C18H27NO3', artist: 'Team Grimoire' },
          { id: 'QHRuTYtSbJQ', title: 'Aleph-0', artist: 'LeaF' },
          { id: '1tk1pqwrOys', title: 'FREEDOM DiVE', artist: 'xi' },
          { id: 'CID-sYQNCew', title: 'MEGALOVANIA (Camellia Remix)', artist: 'BlackY & Camellia' },
          { id: 'aBkTkxKDduc', title: 'Galaxy Collapse', artist: 'Kurokotei' },
          { id: 'UOxkGD8qRB4', title: 'Quaoar', artist: 'Camellia' },
          { id: '6fVE8kSM43I', title: 'Exit This Earth\'s Atomosphere', artist: 'Camellia' }
        ]
      }
    };

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
      
     window.executeDiscoverPlaylistSearch = async function() {
      const input = document.getElementById('discoverPlaylistSearchInput');
      const q = input ? input.value.trim() : '';
      if (!q) {
        showErrorToast('Por favor escribe un término de búsqueda (ej. Rock, Phonk, Anime, Pop).');
        return;
      }

      const btnText = document.getElementById('discoverSearchBtnText');
      const spinner = document.getElementById('discoverSearchSpinner');
      const container = document.getElementById('discoverSearchResultsContainer');
      const grid = document.getElementById('discoverSearchResultsGrid');

      if (btnText) btnText.innerText = '...';
      if (spinner) spinner.classList.remove('hidden');

      const myWorker = (u) => `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(u)}`;
      let foundPlaylists = [];

      // Extractor recursivo universal de listas de reproducción
      function extractPlaylists(obj, results = [], depth = 0) {
        if (!obj || depth > 12) return results;

        if (obj.playlistRenderer && obj.playlistRenderer.playlistId) {
          const pl = obj.playlistRenderer;
          const title = pl.title?.simpleText || pl.title?.runs?.[0]?.text || 'Playlist';
          const author = pl.shortBylineText?.runs?.[0]?.text || pl.longBylineText?.runs?.[0]?.text || 'YouTube';
          const count = pl.videoCount || pl.itemCount || (pl.videoCountText?.runs?.[0]?.text) || 'Playlist';
          const firstVid = pl.navigationEndpoint?.watchEndpoint?.videoId || '';
          const thumb = (pl.thumbnails && pl.thumbnails[0]?.thumbnails?.[0]?.url) || (firstVid ? `https://i.ytimg.com/vi/${firstVid}/hqdefault.jpg` : 'https://i.ytimg.com/vi/hqdefault.jpg');
          results.push({ playlistId: pl.playlistId, title, author, videoCount: count, thumbnail: thumb });
        } else if (obj.lockupViewModel && obj.lockupViewModel.contentId && (obj.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST' || String(obj.lockupViewModel.contentId).startsWith('PL') || String(obj.lockupViewModel.contentId).startsWith('RD') || String(obj.lockupViewModel.contentId).startsWith('VL'))) {
          const vm = obj.lockupViewModel;
          const title = vm.metadata?.lockupMetadataViewModel?.title?.content || 'Playlist';
          const author = vm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts?.[0]?.text?.content || 'YouTube';
          const count = vm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[1]?.metadataParts?.[0]?.text?.content || 'Playlist';
          const thumb = vm.image?.thumbnailViewModel?.image?.sources?.[0]?.url || 'https://i.ytimg.com/vi/hqdefault.jpg';
          results.push({ playlistId: String(vm.contentId).replace(/^VL/, ''), title, author, videoCount: count, thumbnail: thumb });
        } else if (obj.url && String(obj.url).includes('list=') && (obj.name || obj.title)) {
          const plId = (obj.url.split('list=')[1] || '').split('&')[0];
          if (plId) {
            results.push({
              playlistId: plId,
              title: obj.name || obj.title || 'Playlist',
              author: obj.uploaderName || obj.author || 'YouTube',
              videoCount: obj.videos || obj.videoCount || 'Playlist',
              thumbnail: obj.thumbnail || `https://i.ytimg.com/vi/hqdefault.jpg`
            });
          }
        }

        if (Array.isArray(obj)) {
          for (const item of obj) extractPlaylists(item, results, depth + 1);
        } else if (typeof obj === 'object') {
          for (const k of Object.keys(obj)) {
            if (k !== 'trackingParams' && k !== 'clickTrackingParams') {
              extractPlaylists(obj[k], results, depth + 1);
            }
          }
        }
        return results;
      }

      // 1. Método Principal: API Oficial Innertube de YouTube vía Worker (Devuelve JSON puro sin bloqueos)
      try {
        const innertubeUrl = myWorker('https://www.youtube.com/youtubei/v1/search');
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 8000);
        const resp = await fetch(innertubeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: {
              client: { clientName: 'WEB', clientVersion: '2.20240101.00.00', hl: 'es', gl: 'ES' }
            },
            query: q,
            params: 'EgIQAw%3D%3D'
          }),
          signal: ctrl.signal
        });
        clearTimeout(tid);

        if (resp.ok) {
          const data = await resp.json();
          foundPlaylists = extractPlaylists(data);
        }
      } catch (err) {
        console.warn('[Search] Innertube API falló, activando servidores de respaldo:', err.message);
      }

      // 2. Método Secundario: Instancias públicas Piped e Invidious
      if (foundPlaylists.length === 0) {
        const fallbackEndpoints = [
          `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=playlists`,
          `https://api.piped.private.coffee/search?q=${encodeURIComponent(q)}&filter=playlists`,
          `https://invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(q)}&type=playlist`,
          `https://inv.tux.pizza/api/v1/search?q=${encodeURIComponent(q)}&type=playlist`
        ];

        for (const endpoint of fallbackEndpoints) {
          try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 4000);
            const res = await fetch(myWorker(endpoint), { signal: ctrl.signal });
            clearTimeout(tid);
            if (res.ok) {
              const data = await res.json();
              const items = Array.isArray(data) ? data : (data.items || []);
              foundPlaylists = extractPlaylists(items);
              if (foundPlaylists.length > 0) break;
            }
          } catch (e) {
            console.debug('[Search] Respaldo falló, probando siguiente...');
          }
        }
      }

      // 3. Método Terciario: Búsqueda difusa en base local de Playlists
      if (foundPlaylists.length === 0) {
        const qTerms = q.toLowerCase().split(' ').filter(Boolean);
        for (const [plId, data] of Object.entries(CURATED_PLAYLIST_DATABASE)) {
          const haystack = `${data.title} ${data.tracks.map(t => `${t.title} ${t.artist}`).join(' ')}`.toLowerCase();
          if (qTerms.some(term => haystack.includes(term))) {
            foundPlaylists.push({
              playlistId: plId,
              title: data.title,
              author: 'Comunidad Beatstar',
              videoCount: `${data.tracks.length} temas`,
              thumbnail: data.tracks[0]?.id ? `https://i.ytimg.com/vi/${data.tracks[0].id}/hqdefault.jpg` : 'https://i.ytimg.com/vi/hqdefault.jpg'
            });
          }
        }
      }

      // 4. Renderizado en pantalla
      try {
        if (!foundPlaylists || foundPlaylists.length === 0) {
          if (container) container.classList.remove('hidden');
          if (grid) {
            grid.innerHTML = `
              <div class="p-4 text-center text-xs text-gray-400 bg-white/5 rounded-xl border border-white/10">
                No se encontraron playlists para "${escapeHtml(q)}". Prueba con otro término (ej. Rock, Phonk, Anime, Pop).
              </div>
            `;
          }
          return;
        }

        const seen = new Set();
        const uniquePlaylists = foundPlaylists.filter(p => {
          if (!p.playlistId || seen.has(p.playlistId)) return false;
          seen.add(p.playlistId);
          return true;
        });

        if (container) container.classList.remove('hidden');
        if (grid) {
          grid.innerHTML = uniquePlaylists.slice(0, 20).map(pl => `
            <div class="result-card p-3 flex-col items-stretch space-y-2.5 border-pink-500/30 hover:border-pink-500/60 bg-gradient-to-br from-black/80 to-purple-950/40">
              <div class="flex items-center gap-3">
                <img 
                  src="${pl.thumbnail}" 
                  class="w-14 h-14 rounded-xl object-cover border border-white/10 flex-shrink-0"
                  onerror="this.src='https://i.ytimg.com/vi/hqdefault.jpg'"
                  alt="Playlist"
                >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 uppercase">YouTube Music</span>
                    <span class="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-300">${pl.videoCount}</span>
                  </div>
                  <h3 class="text-xs font-black text-white truncate mt-0.5" title="${escapeHtml(pl.title)}">${escapeHtml(pl.title)}</h3>
                  <p class="text-[10px] text-gray-400 truncate">${escapeHtml(pl.author)}</p>
                </div>
              </div>
              <button onclick="importCuratedPlaylist('${escapeHtml(pl.playlistId)}', '${escapeHtml(pl.title.replace(/'/g, ''))}')" class="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer">
                <span>▶</span> Importar Playlist y Jugar
              </button>
            </div>
          `).join('');
        }
      } catch (err) {
        showErrorToast('Error procesando playlists: ' + err.message);
      } finally {
        if (btnText) btnText.innerText = 'Buscar';
        if (spinner) spinner.classList.add('hidden');
      }
    };

      window.clearDiscoverSearchResults = function() {
      const container = document.getElementById('discoverSearchResultsContainer');
      const input = document.getElementById('discoverPlaylistSearchInput');
      if (container) container.classList.add('hidden');
      if (input) input.value = '';
    };

    async function parseYouTubePlaylistClient(playlistInput, onProgress) {
      if (onProgress) onProgress(15, 'Analizando identificador de playlist...');
      const listMatch = playlistInput.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      const cleanId = listMatch ? listMatch[1] : (playlistInput.startsWith('PL') || playlistInput.startsWith('RD') || playlistInput.startsWith('RDCLAK') || playlistInput.startsWith('VL') ? playlistInput : playlistInput.trim());

      if (!cleanId) throw new Error('ID de playlist de YouTube no válido.');

      const myWorker = (u) => `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(u)}`;
      let playlistTitle = 'Playlist de YouTube';

      // 1. Base curada instantánea
      if (CURATED_PLAYLIST_DATABASE[cleanId]) {
        const item = CURATED_PLAYLIST_DATABASE[cleanId];
        const tracks = item.tracks.map((t, idx) => ({
          id: t.id || `yt_${cleanId}_${idx}`,
          title: t.title,
          artist: t.artist || 'Artista',
          thumbnail: t.id ? `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg` : '',
          duration_seconds: 0
        }));
        if (onProgress) onProgress(100, `Lista precargada: "${item.title}"`);
        return { id: cleanId, title: item.title, tracks };
      }

      // Helper para consultar endpoints con multi-proxy (Worker + Directo + CORS Proxies)
      async function tryFetchJson(url, timeoutMs = 6000) {
        const endpoints = [
          myWorker(url),
          
          url
        ];
        for (const ep of endpoints) {
          try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), timeoutMs);
            const res = await fetch(ep, { signal: ctrl.signal });
            clearTimeout(tid);
            if (res.ok) {
              const data = await res.json();
              if (data) return data;
            }
          } catch (e) {}
        }
        throw new Error('Servidor inaccesible');
      }

      // 2. Método 1: Búsqueda rápida en paralelo sobre instancias Invidious & Piped
      const apiSources = [
        {
          url: `https://invidious.nerdvpn.de/api/v1/playlists/${cleanId}`,
          parse: (d) => {
            const vids = d.videos || d.items || [];
            return {
              title: d.title || playlistTitle,
              tracks: vids.map((v, i) => ({
                id: v.videoId || (v.url || '').replace('/watch?v=', '') || `yt_${cleanId}_${i}`,
                title: v.title || `Pista #${i + 1}`,
                artist: v.author || 'YouTube',
                thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                duration_seconds: v.lengthSeconds || 0
              }))
            };
          }
        },
        {
          url: `https://inv.nadeko.net/api/v1/playlists/${cleanId}`,
          parse: (d) => {
            const vids = d.videos || d.items || [];
            return {
              title: d.title || playlistTitle,
              tracks: vids.map((v, i) => ({
                id: v.videoId || (v.url || '').replace('/watch?v=', '') || `yt_${cleanId}_${i}`,
                title: v.title || `Pista #${i + 1}`,
                artist: v.author || 'YouTube',
                thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                duration_seconds: v.lengthSeconds || 0
              }))
            };
          }
        },
        {
          url: `https://api.piped.privacydev.net/playlists/${cleanId}`,
          parse: (d) => {
            const vids = d.relatedStreams || d.videos || [];
            return {
              title: d.name || playlistTitle,
              tracks: vids.map((v, i) => ({
                id: (v.url || '').replace('/watch?v=', '') || `yt_${cleanId}_${i}`,
                title: v.title || `Pista #${i + 1}`,
                artist: v.uploaderName || 'YouTube',
                thumbnail: v.thumbnail || '',
                duration_seconds: v.duration || 0
              }))
            };
          }
        },
        {
          url: `https://pipedapi.kavin.rocks/playlists/${cleanId}`,
          parse: (d) => {
            const vids = d.relatedStreams || d.videos || [];
            return {
              title: d.name || playlistTitle,
              tracks: vids.map((v, i) => ({
                id: (v.url || '').replace('/watch?v=', '') || `yt_${cleanId}_${i}`,
                title: v.title || `Pista #${i + 1}`,
                artist: v.uploaderName || 'YouTube',
                thumbnail: v.thumbnail || '',
                duration_seconds: v.duration || 0
              }))
            };
          }
        }
      ];

      if (onProgress) onProgress(35, 'Consultando catálogo completo (100+ temas)...');

      for (let i = 0; i < apiSources.length; i++) {
        const src = apiSources[i];
        try {
          if (onProgress) onProgress(35 + (i * 12), `Consultando servidor ${i + 1}/${apiSources.length}...`);
          const data = await tryFetchJson(src.url, 5000);
          const result = src.parse(data);
          if (result.tracks && result.tracks.length > 15) {
            if (onProgress) onProgress(90, `¡${result.tracks.length} canciones extraídas!`);
            return { id: cleanId, title: result.title, tracks: result.tracks.slice(0, 500) };
          }
        } catch (e) {}
      }

      // 3. Método 2: Scraping HTML de YouTube con Regex universal
      try {
        if (onProgress) onProgress(75, 'Extrayendo pistas directo de YouTube...');
        const ytUrl = myWorker(`https://www.youtube.com/playlist?list=${cleanId}&hl=es`);
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 8000);
        const resp = await fetch(ytUrl, { signal: ctrl.signal });
        clearTimeout(tid);

        if (resp.ok) {
          const html = await resp.text();
          const tracks = [];
          const seen = new Set();

          const tMatch = html.match(/<title>(.*?)(?: - YouTube)?<\/title>/i);
          if (tMatch && tMatch[1]) playlistTitle = tMatch[1].replace(' - YouTube', '').trim();

          const regex = /"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}\]|"simpleText":"(.*?)"\}/g;
          let m;
          while ((m = regex.exec(html)) !== null) {
            const id = m[1];
            if (!seen.has(id)) {
              seen.add(id);
              const songTitle = (m[2] || m[3] || 'Sin título').replace(/\\u0026/g, '&').replace(/\\"/g, '"');
              tracks.push({
                id: id,
                title: songTitle,
                artist: 'YouTube',
                thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                duration_seconds: 0
              });
            }
          }

          if (tracks.length > 0) {
            if (onProgress) onProgress(90, `¡${tracks.length} canciones extraídas de YouTube!`);
            return { id: cleanId, title: playlistTitle, tracks };
          }
        }
      } catch (e) {}

      // 4. Método 3 de emergencia: Feed XML (Solo si ningún otro servidor respondió)
      try {
        if (onProgress) onProgress(85, 'Consultando canal XML de respaldo...');
        const feedUrl = myWorker(`https://www.youtube.com/feeds/videos.xml?playlist_id=${cleanId}`);
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 6000);
        const resp = await fetch(feedUrl, { signal: ctrl.signal });
        clearTimeout(tid);

        if (resp.ok) {
          const xmlText = await resp.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
          const entries = xmlDoc.getElementsByTagName('entry');

          if (entries && entries.length > 0) {
            const plTitle = xmlDoc.getElementsByTagName('title')[0]?.textContent || playlistTitle;
            const fallbackTracks = [];
            for (let i = 0; i < entries.length; i++) {
              const entry = entries[i];
              const videoId = entry.getElementsByTagName('yt:videoId')[0]?.textContent || entry.getElementsByTagName('videoId')[0]?.textContent || '';
              const title = entry.getElementsByTagName('title')[0]?.textContent || 'Sin título';
              const author = entry.getElementsByTagName('author')[0]?.getElementsByTagName('name')[0]?.textContent || 'YouTube';
              if (videoId) {
                fallbackTracks.push({
                  id: videoId,
                  title: title,
                  artist: author,
                  thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                  duration_seconds: 0
                });
              }
            }
            if (fallbackTracks.length > 0) {
              return { id: cleanId, title: plTitle, tracks: fallbackTracks };
            }
          }
        }
      } catch (xmlErr) {}

      throw new Error('No se pudo extraer la playlist. Asegúrate de que sea pública.');
    }

    window.importCuratedPlaylist = async function(playlistId, defaultTitle) {
      closeYTMusicModal();

      const overlay = document.getElementById('globalLoadingOverlay');
      const loadTitle = document.getElementById('globalLoadTitle');
      const loadArtist = document.getElementById('globalLoadArtist');
      const loadStatus = document.getElementById('globalLoadStatus');
      const curtain = document.getElementById('gameCurtain');

      if (curtain) curtain.classList.remove('revealed');
      if (loadTitle) loadTitle.innerText = defaultTitle || 'Playlist de YouTube';
      if (loadArtist) loadArtist.innerText = 'Importando canciones...';
      if (loadStatus) loadStatus.innerText = 'Conectando con YouTube...';
      if (overlay) overlay.classList.add('active');

      VisualLogger.init();
      VisualLogger.step(1, 'Iniciando importación', `ID: ${playlistId}`, 'info');

      try {
        const updateUI = (pct, msg) => {
          if (loadStatus) loadStatus.innerText = msg;
          VisualLogger.step(2, 'Progreso', msg, 'info');
        };

        const parsed = await parseYouTubePlaylistClient(playlistId, updateUI);

        VisualLogger.step(3, 'Canciones obtenidas', `Total: ${parsed.tracks.length} temas`, 'success');
        if (loadStatus) loadStatus.innerText = `Guardando ${parsed.tracks.length} temas en tu biblioteca...`;

        const plRecord = {
          id: 'yt_' + (parsed.id || Date.now()),
          title: parsed.title || defaultTitle || 'Playlist de YouTube',
          item_count: parsed.tracks.length,
          tracks: parsed.tracks,
          source: 'youtube',
          createdAt: Date.now()
        };

        await IndexedDBStorage.savePlaylist(plRecord);
        VisualLogger.step(4, 'Guardado completado', 'Playlist guardada en IndexedDB', 'success');

        setTimeout(() => {
          if (overlay) overlay.classList.remove('active');
          if (curtain) curtain.classList.add('revealed');
          showSuccessToast(`Playlist "${plRecord.title}" importada (${plRecord.item_count} temas).`);
          switchMainTab('library');
          switchLibrarySubtab('playlists');
          openPlaylistDetailView(plRecord.id);
        }, 400);

      } catch (err) {
        if (overlay) overlay.classList.remove('active');
        if (curtain) curtain.classList.add('revealed');
        VisualLogger.error(err, 5);
        showErrorToast('Error importando playlist: ' + err.message);
      }
    };

    async function importDirectPlaylistUrl() {
      const input = document.getElementById('directPlaylistUrlInput');
      const url = input.value.trim();
      if (!url) {
        showErrorToast('Por favor pega la URL o ID de la playlist.');
        return;
      }

      // Secret developer code
      if (url.toLowerCase() === 'culomono3') {
        userClefs += 1000;
        userSilvers += 100;
        userGolds += 100;
        userPlatinums += 100;
        updateUserWalletDisplay();
        input.value = '';
        closeYTMusicModal();
        showSuccessToast('¡Código de desarrollador activado! +1000 Claves +100 Plata +100 Oro +100 Platino');
        return;
      }

      const btn = document.getElementById('btnImportDirectUrl');
      btn.innerText = '...';

      try {
        closeYTMusicModal();
        await importCuratedPlaylist(url, 'Playlist de YouTube');
        input.value = '';
      } catch (err) {
        showErrorToast(err.message);
      } finally {
        btn.innerText = 'Importar';
      }
    }

    // ==========================================
    // GESTIÓN DE NICKNAME DEL JUGADOR
    // ==========================================
    function saveOnboardingNickname() {
      const input = document.getElementById('onboardingNicknameInput');
      const val = input ? input.value.trim() : '';
      if (!val) {
        showErrorToast('Por favor escribe un nickname para continuar.');
        return;
      }
      localStorage.setItem('beatstar_player_nickname', val);
      const settingsInput = document.getElementById('settingsNicknameInput');
      if (settingsInput) settingsInput.value = val;

      const nickModal = document.getElementById('nicknameModal');
      if (nickModal) {
        nickModal.classList.remove('open');
        nickModal.classList.add('hidden');
        nickModal.style.display = 'none';
      }
      showSuccessToast(`¡Bienvenido/a, ${val}!`);
      if (typeof syncPlayerAndScoresWithServer === 'function') {
        syncPlayerAndScoresWithServer();
      }
    }

    function updatePlayerNickname(val) {
      const trimmed = (val || '').trim();
      if (!trimmed) return;
      localStorage.setItem('beatstar_player_nickname', trimmed);
      if (typeof syncPlayerAndScoresWithServer === 'function') {
        syncPlayerAndScoresWithServer();
      }
    }

    // ==========================================
    // INFRAESTRUCTURA COMUNITARIA Y SOCIAL
    // ==========================================
    let dailyFeaturedSongsList = [];
    let currentExploreSubTab = 'global';
    let communitySort = 'rating';
    let communityDiffFilter = '';
    let postGameCurrentRating = 5;
    let postGameCurrentSync = 100;
    let isSubmittingRating = false;

    async function playFeaturedSong(songId, isCommunity = false) {
      const song = (dailyFeaturedSongsList || []).find(s => s.id === songId) || null;
      const isComm = isCommunity || (song && song.is_community);

      if (isComm) {
        playCommunitySong(songId, true);
        return;
      }

      // 1. Si existe en descargas locales de IndexedDB, iniciarla directamente
      if (typeof IndexedDBStorage !== 'undefined') {
        try {
          const item = await IndexedDBStorage.getChart(songId);
          if (item && item.audioBlob) {
            item.is_daily_featured = true;
            if (song && Number.isFinite(song.stars)) {
              item.stars = song.stars;
              item.selectedStars = song.stars;
              if (!item.metadata) item.metadata = {};
              item.metadata.stars = song.stars;
            }
            startGame(item, item.audioBlob, item.metadata?.difficulty_name || song?.difficulty_name || 'Normal');
            return;
          }
        } catch (e) {}
      }

      // 2. Si no está en almacenamiento local, AUTO-DESCARGAR de la fuente
      const targetTitle = song?.title || 'Canción Destacada';
      const targetArtist = song?.artist || 'Artista';
      const targetSource = song?.source || (songId.startsWith('osu_') ? 'osu' : 'clonehero');
      const targetDiffName = song?.difficulty_name || 'Normal';
      const targetStars = song?.stars || 3.5;

      const chartItem = {
        id: songId,
        title: targetTitle,
        artist: targetArtist,
        source: targetSource,
        source_name: song?.source_name || (targetSource === 'osu' ? 'osu!' : 'Clone Hero'),
        download_url: song?.download_url || (targetSource === 'osu' ? `/api/v1/download/osu/${songId.replace('osu_', '')}` : ''),
        md5: song?.md5 || '',
        diff_id: song?.diff_id || 'diff_standard',
        is_daily_featured: true,
        difficulties: [{
          id: song?.diff_id || 'diff_standard',
          name: targetDiffName,
          stars: targetStars,
          keys: targetSource === 'osu' ? 4 : 5
        }]
      };

      // Registrar en searchResultsCache para que downloadAndPlaySong disponga de los metadatos completos
      if (!searchResultsCache) searchResultsCache = [];
      const existingIdx = searchResultsCache.findIndex(c => c.id === songId);
      if (existingIdx >= 0) {
        searchResultsCache[existingIdx] = { ...searchResultsCache[existingIdx], ...chartItem };
      } else {
        searchResultsCache.push(chartItem);
      }

      // Lanzar el flujo blindado de descarga y ejecución
      downloadAndPlaySong(songId, chartItem.difficulties[0].id, targetDiffName);
    }

    async function loadDailyFeaturedSongs() {
      let candidateSongs = [];

      // 1. Cargar todas las canciones calificadas localmente (sean comunitarias o no)
      try {
        const ratingsStore = JSON.parse(localStorage.getItem('beatstar_song_ratings') || '{}');
        // Purgar semillas ficticias legacy
        ['comm_galaxy_anthem', 'comm_cyber_frenzy', 'comm_moonlight_flow', 'comm_moonlight_drill'].forEach(k => {
          if (ratingsStore[k]) delete ratingsStore[k];
        });
        localStorage.setItem('beatstar_song_ratings', JSON.stringify(ratingsStore));

        for (const [id, r] of Object.entries(ratingsStore)) {
          if (r && r.count > 0 && !id.startsWith('comm_galaxy') && !id.startsWith('comm_cyber') && !id.startsWith('comm_moonlight')) {
            candidateSongs.push({
              id: r.id || id,
              title: r.title || 'Canción',
              artist: r.artist || 'Artista',
              difficulty_name: r.difficulty_name || 'Normal',
              stars: r.stars || 3.5,
              rating_avg: r.avgStars || 5.0,
              votes_count: r.count || 1,
              sync_avg: r.avgSync || 100,
              is_community: !!r.is_community,
              source: r.source || (r.is_community ? 'community' : (id.startsWith('osu_') ? 'osu' : 'catalog')),
              source_name: r.source_name || (r.is_community ? 'Comunidad' : (id.startsWith('osu_') ? 'osu!' : 'Catálogo')),
              download_url: r.download_url || '',
              md5: r.md5 || '',
              diff_id: r.diff_id || ''
            });
          }
        }
      } catch (e) {}

      // 2. Si hay servidor online configurado, mezclar con pistas mejor calificadas de la nube
      try {
        const baseUrl = getApiBaseUrl();
        if (baseUrl) {
          let cloudData = null;
          try {
            const res = await fetch(`${baseUrl}/api/v1/community/featured`);
            if (res.ok) {
              const resJson = await res.json();
              cloudData = Array.isArray(resJson) ? resJson : (resJson.featured || (resJson.id ? [resJson] : []));
            }
          } catch (_) {}

          // Fallback a búsqueda por rating si /featured no respondiera
          if (!cloudData || cloudData.length === 0) {
            const fallbackRes = await fetch(`${baseUrl}/api/v1/community/charts/search?sort=rating&limit=6`);
            if (fallbackRes.ok) {
              cloudData = await fallbackRes.json();
            }
          }

          if (Array.isArray(cloudData)) {
            for (const cs of cloudData) {
              if (cs && cs.votes_count > 0 && !cs.id.startsWith('comm_galaxy') && !cs.id.startsWith('comm_cyber')) {
                const existingIdx = candidateSongs.findIndex(s => s.id === cs.id);
                const songObj = {
                  ...cs,
                  is_community: !!cs.is_community,
                  source: cs.source || (cs.is_community ? 'community' : (cs.id.startsWith('osu_') ? 'osu' : 'catalog')),
                  source_name: cs.source_name || (cs.is_community ? 'Comunidad' : (cs.id.startsWith('osu_') ? 'osu!' : 'Catálogo')),
                  rating_avg: cs.rating_avg || 5.0,
                  votes_count: cs.votes_count || 1
                };
                if (existingIdx >= 0) {
                  candidateSongs[existingIdx] = { ...candidateSongs[existingIdx], ...songObj };
                } else {
                  candidateSongs.push(songObj);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Conexión con servidor para destacados omitida:', err);
      }

      // 3. Filtrar estrictamente solo aquellas canciones con votos reales (> 0) y ordenar por mejor valoración
      const ratedOnly = candidateSongs.filter(s => (s.votes_count > 0));
      ratedOnly.sort((a, b) => {
        if (b.rating_avg !== a.rating_avg) {
          return b.rating_avg - a.rating_avg; // Mejor media primero (ej: 5.0 > 4.8)
        }
        return (b.votes_count || 0) - (a.votes_count || 0); // Más votos desempata
      });

      const topRated = ratedOnly.slice(0, 3);
      dailyFeaturedSongsList = topRated;
      renderDailyFeaturedCards(topRated);
    }

    function renderDailyFeaturedCards(songs) {
      const container = document.getElementById('dailyFeaturedListContainer');
      if (!container) return;

      // Si no hay ninguna canción valorada, mostrar mensaje claro hasta que haya alguna
      if (!songs || songs.length === 0) {
        container.innerHTML = `
          <div class="p-4 text-center text-gray-400 bg-black/40 border border-white/5 rounded-xl space-y-1">
            <p class="text-xs font-bold text-gray-300">⭐ ${t('disc_no_featured_title', 'Sin canciones destacadas aún')}</p>
            <p class="text-[10px] text-gray-500">${t('disc_no_featured_sub', 'Juega y califica cualquier canción para que aparezca aquí como la mejor valorada.')}</p>
          </div>
        `;
        return;
      }

      const diffBadgeColors = {
        'Fácil': 'text-emerald-300',
        'Media': 'text-pink-300',
        'Difícil': 'text-cyan-300',
        'Extrema': 'text-amber-300',
        'Insana': 'text-rose-300'
      };

      let html = '';
      songs.forEach((song, idx) => {
        const diffColor = diffBadgeColors[song.difficulty_name] || 'text-cyan-300';
        html += `
          <div class="p-2.5 bg-black/60 border border-white/10 rounded-xl flex items-center justify-between gap-2.5 transition hover:border-amber-400/40">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-bold uppercase tracking-wider">Top #${idx + 1}</span>
                <span class="text-[9px] ${diffColor} font-bold">${escapeHtml(song.difficulty_name || 'Normal')} ${song.stars || 3.5}★</span>
                ${song.is_community ? `<span class="text-[8px] bg-cyan-500/20 text-cyan-300 px-1 rounded">${t('badge_community', 'Comunidad')}</span>` : `<span class="text-[8px] bg-purple-500/20 text-purple-300 px-1 rounded">${t('badge_catalog', 'Catálogo')}</span>`}
              </div>
              <h4 class="text-xs font-black text-white truncate mt-0.5">${escapeHtml(song.title)}</h4>
              <p class="text-[10px] text-gray-300 truncate">${escapeHtml(song.artist || t('unknown_artist', 'Artista'))}</p>
              <div class="flex items-center gap-2 text-[9px] text-amber-300 font-semibold mt-0.5">
                <span>⭐ ${song.rating_avg || 5.0} (${song.votes_count || 1} ${t('votes', 'votos')})</span>
              </div>
            </div>
            <button onclick="playFeaturedSong('${song.id}', ${!!song.is_community})" class="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-pink-500 hover:from-amber-300 text-black font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1 cursor-pointer flex-shrink-0">
              <span>▶</span> ${t('play', 'Jugar')}
            </button>
          </div>
        `;
      });
      container.innerHTML = html;
    }

    async function playDailyFeaturedSong() {
      if (dailyFeaturedSongsList && dailyFeaturedSongsList.length > 0) {
        const topSong = dailyFeaturedSongsList[0];
        playFeaturedSong(topSong.id, !!topSong.is_community);
      } else {
        showErrorToast('Aún no hay canciones destacadas valoradas.');
      }
    }

    window.togglePianoAccordion = function(sId) {
      const acc = document.getElementById(`pianoAccordion_${sId}`);
      const arrow = document.getElementById(`accordionArrow_${sId}`);
      if (!acc) return;
      const isOpen = acc.classList.contains('open');
      if (isOpen) {
        acc.classList.remove('open');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
      } else {
        acc.classList.add('open');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
      }
    };

    window.playFeaturedSongOfTheDay = function() {
      if (engine && engine.sync) {
        engine.sync.unlockAudio();
      }
      showSuccessToast('Cargando "Renacer" - Canción Oficial...');
      playCommunitySong('comm_renacer', true);
    };


    function switchExploreSubTab(subTab) {
      currentExploreSubTab = subTab;
      const globalBtn = document.getElementById('subTabGlobalBtn');
      const commBtn = document.getElementById('subTabCommunityBtn');
      const globalCont = document.getElementById('exploreGlobalContainer');
      const commCont = document.getElementById('exploreCommunityContainer');

      if (subTab === 'community') {
        if (globalBtn) globalBtn.classList.remove('active');
        if (commBtn) commBtn.classList.add('active');
        if (globalCont) globalCont.classList.add('hidden');
        if (commCont) commCont.classList.remove('hidden');
        loadCommunityCharts();
      } else {
        if (globalBtn) globalBtn.classList.add('active');
        if (commBtn) commBtn.classList.remove('active');
        if (globalCont) globalCont.classList.remove('hidden');
        if (commCont) commCont.classList.add('hidden');
      }
    }

    function getFollowedCreators() {
      try {
        const raw = localStorage.getItem('beatstar_followed_creators');
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function saveFollowedCreators(list) {
      try {
        localStorage.setItem('beatstar_followed_creators', JSON.stringify(list));
      } catch (e) {}
    }

    function setCommunitySort(sortType) {
      communitySort = sortType;
      document.querySelectorAll('#commSortButtons .comm-sort-btn').forEach(btn => {
        if (btn.dataset.sort === sortType) {
          btn.className = 'comm-sort-btn active py-1 rounded-lg text-[9px] font-bold border border-cyan-400/40 bg-cyan-500/20 text-cyan-300 cursor-pointer shadow-sm';
        } else {
          btn.className = 'comm-sort-btn py-1 rounded-lg text-[9px] font-bold border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 cursor-pointer';
        }
      });

      const display = document.getElementById('commActiveFilterDisplay');
      if (display) {
        const labels = {
          'rating': t('comm_filter_rating', 'Mejor Valorados'),
          'following': t('comm_filter_following', 'Siguiendo'),
          'trending': t('comm_filter_trending', 'Populares'),
          'newest': t('comm_filter_newest', 'Nuevos')
        };
        display.innerText = labels[sortType] || sortType;
      }

      loadCommunityCharts();
    }

    function setCommunityDiff(diffVal) {
      communityDiffFilter = diffVal;
      const sel = document.getElementById('commDiffSelect');
      if (sel && sel.value !== diffVal) {
        sel.value = diffVal;
      }
      loadCommunityCharts();
    }

    function executeCommunitySearch() {
      loadCommunityCharts();
    }

    async function autoSyncChartToServerIfMissing(ls) {
      try {
        const baseUrl = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
        if (!baseUrl || !ls || !ls.id) return;
        if (!window._syncingCharts) window._syncingCharts = {};
        if (window._syncingCharts[ls.id]) return;
        window._syncingCharts[ls.id] = true;

        if (typeof IndexedDBStorage !== 'undefined') {
          let stored = await IndexedDBStorage.getChart(ls.id);
          if (!stored) {
            const allSaved = await IndexedDBStorage.getAllCharts();
            stored = (allSaved || []).find(c => c.id === ls.id || (c.title && ls.title && c.title.trim().toLowerCase() === ls.title.trim().toLowerCase() && c.artist && ls.artist && c.artist.trim().toLowerCase() === ls.artist.trim().toLowerCase()));
          }
          const cData = stored?.unpackedData || stored?.chartData || ls.chartData || ls.unpackedData;
          const audioBlob = stored?.audioBlob || ls.audioBlob;
          if (cData) {
            const formData = new FormData();
            formData.append('title', ls.title || 'Pista Comunitaria');
            formData.append('artist', ls.artist || 'Comunidad');
            formData.append('creator_name', ls.creator_name || ls.creator || 'Creador');
            formData.append('creator_id', ls.creator_id || '');
            formData.append('bpm', ls.bpm || 120);
            formData.append('offset_ms', ls.offset_ms || 0);
            formData.append('difficulty_name', ls.difficulty_name || 'Media');
            formData.append('stars', ls.stars || 3.5);
            formData.append('scroll_duration_ms', ls.scroll_duration_ms || 1400);
            formData.append('chart_json', JSON.stringify(cData));
            if (audioBlob) {
              formData.append('audio_file', audioBlob, 'audio.mp3');
            }
            const res = await fetch(`${baseUrl}/api/v1/community/charts/publish`, {
              method: 'POST',
              body: formData
            });
            if (res.ok) {
              const pubData = await res.json();
              const newId = pubData?.chart_id;
              console.log(`[AutoSync] Pista comunitaria ${ls.title} restaurada en servidor como ${newId}.`);

              if (newId) {
                try {
                  let myVault = JSON.parse(localStorage.getItem('beatstar_my_published_charts') || '[]');
                  myVault = myVault.map(v => (v.id === ls.id || (v.title === ls.title && v.artist === ls.artist)) ? { ...v, id: newId } : v);
                  localStorage.setItem('beatstar_my_published_charts', JSON.stringify(myVault));
                } catch (e) {}

                try {
                  let localCommunity = JSON.parse(localStorage.getItem('beatstar_community_local_charts') || '[]');
                  localCommunity = localCommunity.filter(c => c.id !== ls.id && !(c.title === ls.title && c.artist === ls.artist));
                  localStorage.setItem('beatstar_community_local_charts', JSON.stringify(localCommunity));
                } catch (e) {}

                if (newId !== ls.id) {
                  await IndexedDBStorage.deleteChart(ls.id).catch(() => {});
                  await IndexedDBStorage.saveChart({
                    id: newId,
                    title: ls.title,
                    artist: ls.artist,
                    creator: ls.creator_name || ls.creator,
                    creator_name: ls.creator_name || ls.creator,
                    difficulty_name: ls.difficulty_name,
                    stars: ls.stars,
                    bpm: ls.bpm,
                    source: 'community',
                    source_name: 'Comunidad',
                    is_community: true,
                    unpackedData: cData,
                    chartData: cData,
                    audioBlob: audioBlob
                  }, cData, audioBlob).catch(() => {});
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('[AutoSync] Error restaurando pista en el servidor:', err);
      }
    }

    async function loadCommunityCharts() {
      const container = document.getElementById('communityResultsList');
      if (!container) return;

      container.innerHTML = `
        <div class="p-6 text-center text-gray-400 space-y-2">
          <svg class="animate-spin w-6 h-6 mx-auto text-cyan-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
          <p class="text-xs">Buscando en la nube comunitaria...</p>
        </div>
      `;

      const q = document.getElementById('communitySearchInput')?.value.trim() || '';
      const followed = getFollowedCreators().join(',');

      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (communityDiffFilter && communityDiffFilter !== 'Todas') params.set('difficulty', communityDiffFilter);
      if (communitySort) params.set('sort', communitySort);
      if (followed) params.set('followed_creators', followed);

      let songs = [];
      try {
        const baseUrl = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
        if (baseUrl) {
          const res = await fetch(`${baseUrl}/api/v1/community/charts/search?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              songs = data;
              if (songs.length > 0 && !q && (!communityDiffFilter || communityDiffFilter === 'Todas')) {
                try {
                  localStorage.setItem('beatstar_community_cache', JSON.stringify(songs));
                } catch (e) {}
              }
            }
          }
        }
      } catch (err) {
        console.warn('Conexión con nube comunitaria no disponible:', err);
      }

      // 1. Si el backend está en frío, reiniciando o sin conexión, usar caché comunitaria
      if ((!songs || songs.length === 0) && !q && (!communityDiffFilter || communityDiffFilter === 'Todas')) {
        try {
          const cached = JSON.parse(localStorage.getItem('beatstar_community_cache') || '[]');
          if (Array.isArray(cached) && cached.length > 0) {
            songs = cached;
          }
        } catch (e) {}
      }

      // Pistas históricas recuperadas de versiones anteriores y nube
      const HISTORICAL_COMMUNITY_FALLBACKS = typeof GLOBAL_COMMUNITY_FALLBACKS !== 'undefined' ? GLOBAL_COMMUNITY_FALLBACKS : [
        { id: 'comm_renacer', title: 'Renacer', artist: 'Piano Community', creator_id: 'creator_piano_comm', creator_name: 'Piano Community', bpm: 100, difficulty_name: 'Normal', stars: 3.5, notes_count: 203, rating_avg: 5.0, votes_count: 184, sync_avg: 100.0, is_community: true, source: 'community', source_name: 'Piano Community', thumbnail: './app_logo.png' }
      ];

      for (const fb of HISTORICAL_COMMUNITY_FALLBACKS) {
        if (!songs.some(s => s.id === fb.id || (s.title && fb.title && s.title.toLowerCase() === fb.title.toLowerCase()))) {
          const matchesQ = !q || fb.title.toLowerCase().includes(q.toLowerCase()) || fb.artist.toLowerCase().includes(q.toLowerCase());
          const matchesDiff = !communityDiffFilter || communityDiffFilter === 'Todas' || fb.difficulty_name === communityDiffFilter;
          if (matchesQ && matchesDiff) {
            songs.push(fb);
          }
        }
      }

      // 2. Recopilar candidatos de canciones comunitarias creadas localmente por el usuario
      const localCandidates = [];
      try {
        const myVault = JSON.parse(localStorage.getItem('beatstar_my_published_charts') || '[]');
        if (Array.isArray(myVault)) {
          for (const item of myVault) {
            if (item && item.title) localCandidates.push(item);
          }
        }
      } catch (e) {}

      try {
        const localComm = JSON.parse(localStorage.getItem('beatstar_community_local_charts') || '[]');
        if (Array.isArray(localComm)) {
          for (const item of localComm) {
            if (item && item.title && !localCandidates.some(c => c.id === item.id || (c.title === item.title && c.artist === item.artist))) {
              localCandidates.push(item);
            }
          }
        }
      } catch (e) {}

      // Rescatar cualquier pista comunitaria del usuario almacenada en IndexedDB
      if (typeof IndexedDBStorage !== 'undefined') {
        try {
          const dbCharts = await IndexedDBStorage.getAllCharts();
          for (const item of (dbCharts || [])) {
            if (item && (item.is_community || item.source === 'community' || (item.id && item.id.startsWith('comm_')))) {
              if (!localCandidates.some(c => c.id === item.id || (c.title === item.title && c.artist === item.artist))) {
                localCandidates.push(item);
              }
            }
          }
        } catch (e) {}
      }

      // 3. Comprobar pistas locales: si faltan en la nube, mostrarlas y sincronizarlas de inmediato
      for (const lc of localCandidates) {
        if (!lc || !lc.title) continue;
        const alreadyInCloud = songs.some(s =>
          s.id === lc.id ||
          (s.title && lc.title && s.title.trim().toLowerCase() === lc.title.trim().toLowerCase() &&
           s.artist && lc.artist && s.artist.trim().toLowerCase() === lc.artist.trim().toLowerCase())
        );

        if (alreadyInCloud) {
          if (lc.id && lc.id.startsWith('custom_') && typeof IndexedDBStorage !== 'undefined') {
            IndexedDBStorage.deleteChart(lc.id).catch(() => {});
          }
        } else {
          const matchesQ = !q || (lc.title && lc.title.toLowerCase().includes(q.toLowerCase())) || (lc.artist && lc.artist.toLowerCase().includes(q.toLowerCase()));
          const matchesDiff = !communityDiffFilter || communityDiffFilter === 'Todas' || lc.difficulty_name === communityDiffFilter;
          if (matchesQ && matchesDiff) {
            songs.unshift(lc);
          }
          autoSyncChartToServerIfMissing(lc);
        }
      }

      // 4. Deduplicación estricta: NUNCA mostrar 2 canciones con el mismo título y artista
      const uniqueMap = new Map();
      for (const s of songs) {
        if (!s || !s.title) continue;
        const key = `${(s.title || '').trim().toLowerCase()}|${(s.artist || '').trim().toLowerCase()}`;
        const existing = uniqueMap.get(key);
        if (!existing) {
          uniqueMap.set(key, s);
        } else {
          if (s.id && s.id.startsWith('comm_') && (!existing.id || !existing.id.startsWith('comm_'))) {
            uniqueMap.set(key, s);
          } else if ((s.votes_count || 0) > (existing.votes_count || 0)) {
            uniqueMap.set(key, s);
          }
        }
      }
      songs = Array.from(uniqueMap.values());

      renderCommunitySongs(songs);
    }

    function renderCommunitySongs(songs) {
      const container = document.getElementById('communityResultsList');
      if (!container) return;

      if (!songs || songs.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center bg-black/40 border border-white/10 rounded-2xl space-y-2">
            <svg class="w-8 h-8 mx-auto text-[#c5a059] opacity-70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <p class="text-xs text-gray-300 font-bold">${t('comm_empty_title')}</p>
            <p class="text-[10px] text-gray-500">${t('comm_empty_desc')}</p>
          </div>
        `;
        return;
      }

      const followedList = getFollowedCreators();

      let cardsHtml = '';
      for (const song of songs) {
        const isFollowed = followedList.includes(song.creator_id);
        const sId = safeSongId(song.id);
        const diffBadgeColors = {
          'Fácil': 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
          'Media': 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
          'Difícil': 'border-pink-500/40 bg-pink-500/15 text-pink-300',
          'Extrema': 'border-amber-500/40 bg-amber-500/15 text-amber-300',
          'Insana': 'border-rose-500/40 bg-rose-500/15 text-rose-300'
        };
        const diffClass = diffBadgeColors[song.difficulty_name] || 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300';
        const starsNum = typeof song.stars === 'number' ? song.stars : (parseFloat(song.stars) || 3.5);

        cardsHtml += `
          <div class="piano-key-row flex flex-col">
            <div class="flex items-stretch w-full max-w-full overflow-hidden">
              <!-- White Ivory Key Body (Opens Soundboard Accordion) -->
              <div onclick="togglePianoAccordion('${sId}')" class="piano-white-key flex-1 min-w-0 overflow-hidden" title="Ver detalles del creador y opciones">
                <div class="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                  <!-- Round Inlaid Brass Medallion -->
                  <div class="piano-key-thumb relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[#c5a059] shadow-sm flex items-center justify-center bg-stone-900">
                    <svg class="w-4 h-4 text-[#c5a059]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                  </div>
                  <!-- Track Metadata -->
                  <div class="min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
                    <div class="flex items-center gap-1.5 truncate">
                      <h3 class="text-xs font-black text-[#17131d] truncate font-serif leading-tight">${escapeHtml(song.title)}</h3>
                    </div>
                    <p class="text-[10px] text-[#5a422d] font-semibold truncate leading-tight mt-0.5">${escapeHtml(song.artist)} • <span class="text-[#2b1f13]">${escapeHtml(song.creator_name || 'Anónimo')}</span></p>
                  </div>
                </div>
                <!-- Single Star Metric (eg ★ 4.5) -->
                <div class="flex items-center gap-1.5 flex-shrink-0 ml-1.5">
                  <span class="text-[11px] font-black text-[#9c7329] font-mono whitespace-nowrap">★ ${starsNum.toFixed(1)}</span>
                  <span id="accordionArrow_${sId}" class="text-[9px] text-[#8e755a] transition-transform duration-200">▼</span>
                </div>
              </div>

              <!-- Fixed 3D Ebony Black Play Key (INDESTRUCTIBLE & ALWAYS VISIBLE) -->
              <div 
                onclick="playCommunitySong('${song.id}')" 
                class="piano-black-play-key flex-shrink-0 w-12 min-w-[48px]" 
                title="${t('play')}"
              >
                <span class="play-arrow-gold">▶</span>
              </div>
            </div>

            <!-- Soundboard Accordion ("Caja de Resonancia") -->
            <div id="pianoAccordion_${sId}" class="piano-soundboard-accordion">
              <div class="p-2.5 space-y-2">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[9px] font-bold text-[#c5a059] uppercase tracking-wider">Dificultad:</span>
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold border ${diffClass}">
                      ${song.difficulty_name || 'Normal'} ${starsNum.toFixed(1)}★
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[9px] text-gray-400">Creador:</span>
                    <span class="text-[9.5px] text-amber-300 font-bold">${escapeHtml(song.creator_name || 'Anónimo')}</span>
                    <button onclick="toggleFollowCreator('${song.creator_id}', this)" class="follow-btn px-2 py-0.5 rounded text-[8.5px] font-bold border transition ${isFollowed ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' : 'bg-white/10 text-gray-300 border-white/15 hover:bg-white/20'}">
                      ${isFollowed ? t('following') : t('follow')}
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-between gap-2 pt-1.5 border-t border-white/5 text-[11px]">
                  <div class="flex items-center gap-2">
                    <span class="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Tempo:</span>
                    ${renderSongSpeedHtml(song.id).btn}
                  </div>
                  <div class="flex items-center gap-2">
                    <button onclick="openRateSongModal('${song.id}', '${escapeHtml(song.title).replace(/'/g, "\\'")}', '${escapeHtml(song.artist).replace(/'/g, "\\'")}', '${song.difficulty_name || 'Normal'}', ${starsNum}, true)" class="text-[10px] text-amber-400 hover:scale-105 transition flex items-center gap-1 cursor-pointer font-bold" title="Calificar">
                      ★ Calificar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="piano-keyboard-bed">
          <div class="piano-felt-top-strip"></div>
          ${cardsHtml}
        </div>
      `;
    }

    async function toggleFollowCreator(creatorId, btnEl) {
      if (!creatorId) return;
      const userAnonId = localStorage.getItem('beatstar_player_id') || ('user_' + Math.floor(Math.random() * 1000000));
      localStorage.setItem('beatstar_player_id', userAnonId);

      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/v1/community/creators/${creatorId}/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userAnonId, action: 'toggle' })
        });
        if (!res.ok) throw new Error('Error en el servidor');
        const data = await res.json();

        const followed = getFollowedCreators();
        if (data.is_following) {
          if (!followed.includes(creatorId)) followed.push(creatorId);
          if (btnEl) {
            btnEl.innerText = t('following');
            btnEl.className = 'follow-btn px-2 py-0.5 rounded-lg text-[9px] font-bold border transition active:scale-95 cursor-pointer bg-cyan-500/20 text-cyan-300 border-cyan-400/40';
          }
          showSuccessToast(t('toast_follow_ok'));
        } else {
          const idx = followed.indexOf(creatorId);
          if (idx !== -1) followed.splice(idx, 1);
          if (btnEl) {
            btnEl.innerText = t('follow');
            btnEl.className = 'follow-btn px-2 py-0.5 rounded-lg text-[9px] font-bold border transition active:scale-95 cursor-pointer bg-white/10 text-gray-300 border-white/15 hover:bg-white/20';
          }
          showSuccessToast(t('toast_unfollow_ok'));
        }
        saveFollowedCreators(followed);
      } catch (err) {
        showErrorToast('Error al actualizar seguimiento: ' + err.message);
      }
    }

    async function playCommunitySong(chartId, isDailyFeatured = false) {
      window.isGameLoadingOrActive = true;
      if (typeof pauseMenuAmbientMusic === 'function') pauseMenuAmbientMusic();
      const overlay = document.getElementById('globalLoadingOverlay');
      const loadTitle = document.getElementById('loadingOverlayTitle');
      const loadStatus = document.getElementById('loadingOverlayStatus');

      if (overlay) overlay.classList.add('active');
      if (loadTitle) loadTitle.innerText = 'Cargando Pista Comunitaria';
      if (loadStatus) loadStatus.innerText = 'Obteniendo audio y notas...';

      try {
        if (engine && engine.sync) {
          engine.sync.unlockAudio();
        }

        if (chartId === 'comm_renacer') {
          try {
            let cData = null;
            let aBlob = null;
            const baseUrl = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';

            // Intentar cargar mapa desde múltiples rutas candidatas
            const chartCandidates = [
              './songs/renacer/chart.json',
              '/songs/renacer/chart.json',
              '/static/songs/renacer/chart.json',
              `${baseUrl}/api/v1/community/charts/comm_renacer/chart`
            ];
            for (const cUrl of chartCandidates) {
              try {
                const res = await fetch(cUrl);
                if (res.ok) {
                  const data = await res.json();
                  if (data && (data.notes || data.difficulties)) {
                    cData = data;
                    break;
                  }
                }
              } catch (_) {}
            }

            // Intentar cargar audio desde múltiples rutas candidatas
            const audioCandidates = [
              './songs/renacer/audio.mp3',
              '/songs/renacer/audio.mp3',
              '/static/songs/renacer/audio.mp3',
              `${baseUrl}/api/v1/community/charts/comm_renacer/audio`
            ];
            for (const aUrl of audioCandidates) {
              try {
                const aRes = await fetch(aUrl);
                if (aRes.ok) {
                  const b = await aRes.blob();
                  if (b && b.size > 20000) {
                    aBlob = b;
                    break;
                  }
                }
              } catch (_) {}
            }

            if (cData && aBlob) {
              cData.is_community = true;
              cData.is_daily_featured = isDailyFeatured;
              cData.source = 'community';
              cData.source_name = 'Piano Community';
              cData.communityChartId = 'comm_renacer';
              if (overlay) overlay.classList.remove('active');
              startGame(cData, aBlob, cData.metadata?.difficulty_name || 'Normal');
              return;
            }
          } catch (offlineErr) {
            console.warn('[Renacer] Error cargando ruta multi-candidata:', offlineErr);
          }
        }

        // 1. Si la canción existe localmente en IndexedDB, cargar al instante offline
        if (typeof IndexedDBStorage !== 'undefined') {
          try {
            let localItem = await IndexedDBStorage.getChart(chartId);
            if (!localItem) {
              const allSaved = await IndexedDBStorage.getAllCharts();
              localItem = (allSaved || []).find(c => c.id === chartId || c.communityChartId === chartId || (c.unpackedData && c.unpackedData.id === chartId));
            }
            if (localItem && localItem.audioBlob && (localItem.chartData || localItem.unpackedData)) {
              const cData = localItem.chartData || localItem.unpackedData;
              cData.is_community = true;
              cData.is_daily_featured = isDailyFeatured;
              cData.source = 'community';
              cData.communityChartId = chartId;
              if (overlay) overlay.classList.remove('active');
              startGame(cData, localItem.audioBlob, cData.metadata?.difficulty_name || 'Normal');
              return;
            }
          } catch (e) {}
        }

        // 1b. Si está en la bóveda de creaciones del usuario o pistas comunitarias locales
        try {
          const myVault = JSON.parse(localStorage.getItem('beatstar_my_published_charts') || '[]');
          const localComm = JSON.parse(localStorage.getItem('beatstar_community_local_charts') || '[]');
          const allLocalVault = [...myVault, ...localComm];
          const found = allLocalVault.find(c => c && (c.id === chartId || c.communityChartId === chartId));
          if (found && (found.chartData || found.unpackedData) && found.audioBlob) {
            const cData = found.chartData || found.unpackedData;
            cData.is_community = true;
            cData.is_daily_featured = isDailyFeatured;
            cData.source = 'community';
            cData.communityChartId = chartId;
            if (overlay) overlay.classList.remove('active');
            startGame(cData, found.audioBlob, cData.metadata?.difficulty_name || 'Normal');
            return;
          }
        } catch (e) {}

        const baseUrl = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
        
        // Función de descarga con fallback multinivel (Origen local -> Servidor en la nube -> Rutas estáticas)
        async function fetchEndpointWithFallback(endpointPath, isBlob = false) {
          const candidateUrls = [];
          if (baseUrl) candidateUrls.push(`${baseUrl}${endpointPath}`);
          if (typeof window.location.origin === 'string' && window.location.origin.startsWith('http')) {
            const localUrl = `${window.location.origin}${endpointPath}`;
            if (!candidateUrls.includes(localUrl)) candidateUrls.push(localUrl);
          }
          if (baseUrl !== DEFAULT_CLOUD_SERVER && DEFAULT_CLOUD_SERVER) {
            const cloudUrl = `${DEFAULT_CLOUD_SERVER}${endpointPath}`;
            if (!candidateUrls.includes(cloudUrl)) candidateUrls.push(cloudUrl);
          }
          if (!candidateUrls.includes(endpointPath)) candidateUrls.push(endpointPath);

          let lastRes = null;
          let lastErr = null;
          for (const url of candidateUrls) {
            try {
              const res = await fetch(url);
              if (res.ok) {
                return isBlob ? await res.blob() : await res.json();
              }
              lastRes = res;
            } catch (e) {
              lastErr = e;
            }
          }
          const status = lastRes ? lastRes.status : 'desconectado';
          throw new Error(`No se pudo cargar el ${isBlob ? 'audio' : 'mapa'} (${status})`);
        }

        // Descargar el JSON del chart y el Audio en paralelo con respaldo automático
        const [chartData, audioBlob] = await Promise.all([
          fetchEndpointWithFallback(`/api/v1/community/charts/${encodeURIComponent(chartId)}/chart`, false),
          fetchEndpointWithFallback(`/api/v1/community/charts/${encodeURIComponent(chartId)}/audio`, true)
        ]);

        chartData.is_community = true;
        chartData.is_daily_featured = isDailyFeatured;
        chartData.source = 'community';
        chartData.communityChartId = chartId;

        // Guardar copia local en IndexedDB para disponibilidad offline y fluidez
        if (typeof IndexedDBStorage !== 'undefined') {
          IndexedDBStorage.saveChart({
            id: chartId,
            title: chartData.metadata?.title || 'Pista Comunitaria',
            artist: chartData.metadata?.artist || 'Comunidad',
            source: 'community',
            source_name: 'Comunidad',
            is_community: true,
            chartData: chartData,
            unpackedData: chartData,
            audioBlob: audioBlob
          }, chartData, audioBlob).catch(() => {});
        }

        if (overlay) overlay.classList.remove('active');
        startGame(chartData, audioBlob, chartData.metadata?.difficulty_name || 'Normal');
      } catch (err) {
        window.isGameLoadingOrActive = false;
        console.error('Error al iniciar pista comunitaria:', err);
        if (overlay) overlay.classList.remove('active');
        const isNetworkErr = err.name === 'TypeError' || (err.message && err.message.toLowerCase().includes('fetch'));
        if (isNetworkErr) {
          showErrorToast('El servidor comunitario en la nube está iniciándose. Por favor reintenta en unos segundos.');
        } else {
          showErrorToast('Error cargando pista comunitaria: ' + err.message);
        }
      }
    }

    function setPostGameRating(stars) {

      postGameCurrentRating = Math.max(1, Math.min(5, parseInt(stars, 10) || 5));

      updatePostGameRatingUI();

    }



    function setPostGameSync(pct) {

      postGameCurrentSync = parseFloat(pct) || 100;

    }



    function updatePostGameRatingUI() {

      const chartId = currentActiveBeatmap?.communityChartId || currentActiveBeatmap?.metadata?.id || currentActiveBeatmap?.id || 'song';

      const userRatings = JSON.parse(localStorage.getItem('beatstar_user_ratings_map') || '{}');

      const existingVote = (userRatings[chartId] !== undefined && userRatings[chartId] !== null)

        ? userRatings[chartId]

        : (JSON.parse(localStorage.getItem('beatstar_song_ratings') || '{}')[chartId]?.my_vote ?? null);

      const isEditingVote = (existingVote !== null && existingVote !== undefined);



      const valDisplay = document.getElementById('postGameRatingVal');

      if (valDisplay) valDisplay.innerText = `${postGameCurrentRating} / 5 Estrellas`;



      const starEls = document.querySelectorAll('#communityRatingStars span');

      starEls.forEach((el, idx) => {

        if (idx < postGameCurrentRating) {

          el.className = 'cursor-pointer transition hover:scale-125 select-none text-amber-400';

        } else {

          el.className = 'cursor-pointer transition hover:scale-125 select-none text-gray-600';

        }

      });



      const btn = document.getElementById('btnSubmitPostRating');

      if (btn && !isSubmittingRating) {

        btn.innerText = isEditingVote ? 'Actualizar Valoración' : 'Enviar Valoración';

      }

    }



    async function submitPostGameRating() {

      if (isSubmittingRating) return;

      const chartId = currentActiveBeatmap?.communityChartId || currentActiveBeatmap?.metadata?.id || currentActiveBeatmap?.id || ('song_' + Date.now());



      const userRatings = JSON.parse(localStorage.getItem('beatstar_user_ratings_map') || '{}');

      const oldRating = (userRatings[chartId] !== undefined && userRatings[chartId] !== null) ? Number(userRatings[chartId]) : null;

      const isEditing = (oldRating !== null && !isNaN(oldRating));



      const btn = document.getElementById('btnSubmitPostRating');

      if (btn) {

        btn.disabled = true;

        btn.innerText = isEditing ? 'Actualizando...' : 'Enviando...';

      }

      isSubmittingRating = true;



      const userAnonId = localStorage.getItem('beatstar_player_id') || ('user_' + Math.floor(Math.random() * 1000000));

      localStorage.setItem('beatstar_player_id', userAnonId);



      const songTitle = currentActiveBeatmap?.metadata?.title || currentActiveBeatmap?.title || 'Canción';

      const songArtist = currentActiveBeatmap?.metadata?.artist || currentActiveBeatmap?.artist || 'Artista';

      const songDiff = currentActiveBeatmap?.metadata?.difficulty_name || currentActiveBeatmap?.difficulty_name || 'Normal';

      const songStars = currentActiveBeatmap?.metadata?.stars || currentActiveBeatmap?.stars || 3.5;

      const isComm = !!(currentActiveBeatmap?.is_community || currentActiveBeatmap?.source === 'community');



      // 1. Guardar SIEMPRE en base de datos local (permite valorar canciones comunitarias y no comunitarias)

      let localAvg = postGameCurrentRating;

      let localVotes = 1;

      let localSyncAvg = postGameCurrentSync;

      try {

        const songSource = currentActiveBeatmap?.source || (isComm ? 'community' : (chartId.startsWith('osu_') ? 'osu' : 'catalog'));

        const songSourceName = currentActiveBeatmap?.source_name || (isComm ? 'Comunidad' : (chartId.startsWith('osu_') ? 'osu!' : 'Catálogo'));

        const songDlUrl = currentActiveBeatmap?.download_url || '';

        const songMd5 = currentActiveBeatmap?.md5 || '';

        const songDiffId = currentActiveBeatmap?.diff_id || '';



        const ratingsStore = JSON.parse(localStorage.getItem('beatstar_song_ratings') || '{}');

        const prev = ratingsStore[chartId] || {

          id: chartId,

          title: songTitle,

          artist: songArtist,

          difficulty_name: songDiff,

          stars: songStars,

          is_community: isComm,

          source: songSource,

          source_name: songSourceName,

          download_url: songDlUrl,

          md5: songMd5,

          diff_id: songDiffId,

          count: 0,

          totalStars: 0,

          totalSync: 0

        };



        if (isEditing) {

          // Solo editar la valoración existente: no sumar otro voto a la cuenta total

          prev.totalStars = Math.max(0, (prev.totalStars || 0) - oldRating + postGameCurrentRating);

          if (!prev.count || prev.count < 1) prev.count = 1;

        } else {

          // Primer voto del usuario para esta canción

          prev.count = (prev.count || 0) + 1;

          prev.totalStars = (prev.totalStars || 0) + postGameCurrentRating;

        }



        prev.totalSync = (prev.totalSync || 0) + postGameCurrentSync;

        prev.avgStars = parseFloat((prev.totalStars / prev.count).toFixed(1));

        prev.avgSync = Math.round(prev.totalSync / prev.count);

        prev.my_vote = postGameCurrentRating;

        prev.lastRated = Date.now();

        prev.title = songTitle;

        prev.artist = songArtist;

        prev.difficulty_name = songDiff;

        prev.stars = songStars;

        prev.is_community = isComm;

        prev.source = songSource;

        prev.source_name = songSourceName;

        prev.download_url = songDlUrl;

        prev.md5 = songMd5;

        prev.diff_id = songDiffId;



        // Registrar voto en mapa de usuario

        userRatings[chartId] = postGameCurrentRating;

        localStorage.setItem('beatstar_user_ratings_map', JSON.stringify(userRatings));



        // Si la pista comunitaria recibe 2 o más votos y su media es inferior a 2 estrellas,

        // se elimina de la lista de canciones y se notifica al creador

        if (prev.count >= 2 && prev.avgStars < 2.0 && prev.is_community) {

          delete ratingsStore[chartId];

          localStorage.setItem('beatstar_song_ratings', JSON.stringify(ratingsStore));

          if (typeof IndexedDBStorage !== 'undefined') {

            IndexedDBStorage.deleteChart(chartId).catch(() => {});

          }



          const localNotifs = JSON.parse(localStorage.getItem('beatstar_creator_notifications') || '[]');

          localNotifs.push({

            chart_id: chartId,

            chart_title: songTitle,

            message: `Tu pista '${songTitle}' ha sido retirada de la comunidad automáticamente al recibir una valoración media de ${prev.avgStars}★ tras ${prev.count} valoraciones (mínimo requerido: 2.0★).`,

            is_read: false,

            created_at: new Date().toISOString()

          });

          localStorage.setItem('beatstar_creator_notifications', JSON.stringify(localNotifs));

        } else {

          ratingsStore[chartId] = prev;

          localStorage.setItem('beatstar_song_ratings', JSON.stringify(ratingsStore));

        }



        localAvg = prev.avgStars;

        localVotes = prev.count;

        localSyncAvg = prev.avgSync;

      } catch (e) {

        console.warn('Error guardando rating local:', e);

      }



      // 2. Intentar enviar a la nube si hay backend conectado

      let wasDeletedFromCloud = false;

      try {

        const baseUrl = getApiBaseUrl();

        if (baseUrl) {

          const res = await fetch(`${baseUrl}/api/v1/community/charts/${encodeURIComponent(chartId)}/rate`, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({

              rating: postGameCurrentRating,

              sync_pct: postGameCurrentSync,

              user_id: userAnonId,

              title: songTitle,

              artist: songArtist,

              difficulty_name: songDiff,

              stars: songStars,

              source: currentActiveBeatmap?.source || (isComm ? 'community' : (chartId.startsWith('osu_') ? 'osu' : 'catalog')),

              source_name: currentActiveBeatmap?.source_name || (isComm ? 'Comunidad' : (chartId.startsWith('osu_') ? 'osu!' : 'Catálogo')),

              download_url: currentActiveBeatmap?.download_url || '',

              md5: currentActiveBeatmap?.md5 || '',

              diff_id: currentActiveBeatmap?.diff_id || ''

            })

          });

          if (res.ok) {

            const data = await res.json();

            if (data.deleted) {

              wasDeletedFromCloud = true;

              localAvg = data.rating_avg;

              localVotes = data.votes_count;

              if (typeof IndexedDBStorage !== 'undefined') {

                IndexedDBStorage.deleteChart(chartId).catch(() => {});

              }

            } else {

              if (data.rating_avg) localAvg = data.rating_avg;

              if (data.votes_count) localVotes = data.votes_count;

            }

          }

        }

      } catch (err) {

        console.warn('Subida cloud no disponible (calificación guardada en local):', err);

      } finally {

        isSubmittingRating = false;

      }



      const ratingSec = document.getElementById('resCommunityRatingSection');

      if (wasDeletedFromCloud || (localVotes >= 2 && localAvg < 2.0)) {

        showErrorToast('La pista ha sido retirada de la comunidad por baja puntuación media (< 2★).');

        if (ratingSec) {

          ratingSec.innerHTML = `

            <div class="p-2.5 text-center text-rose-400 text-xs font-bold space-y-1 bg-rose-500/10 rounded-xl border border-rose-500/30">

              <span class="inline-flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Pista retirada de la comunidad</span>

              <p class="text-[10px] text-gray-300">Ha sido eliminada de la lista pública al promediar ${localAvg}★ (menos de 2★) tras ${localVotes} valoraciones.</p>

            </div>

          `;

        }

        checkCreatorNotifications();

      } else {

        showSuccessToast(isEditing ? '¡Valoración actualizada con éxito!' : '¡Gracias por calificar!');

        if (ratingSec) {

          ratingSec.innerHTML = `

            <div class="p-2 text-center text-emerald-400 text-xs font-bold space-y-1.5">

              <div class="flex items-center justify-center gap-1">

                <span>✓</span>

                <span>${isEditing ? '¡Valoración actualizada con éxito!' : '¡Valoración registrada con éxito!'}</span>

              </div>

              <p class="text-[10px] text-gray-300">Tu voto: <span class="text-amber-400 font-black">⭐ ${postGameCurrentRating}/5</span> • Media: ⭐ ${localAvg} (${localVotes} ${localVotes === 1 ? 'voto' : 'votos'})</p>

              <button onclick="window.reopenPostGameRating('${escapeHtml(chartId)}')" class="mt-1 px-3 py-1 rounded-lg text-[10px] font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 hover:bg-cyan-500/30 transition cursor-pointer">

                <span class="inline-flex items-center gap-1"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Cambiar mi valoración</span>

              </button>

            </div>

          `;

        }

      }



      // Actualizar inmediatamente las canciones destacadas en la pestaña Descubrir

      loadDailyFeaturedSongs();

    }



    window.reopenPostGameRating = function(chartId) {

      const commRatingSec = document.getElementById('resCommunityRatingSection');

      if (!commRatingSec) return;

      const userRatings = JSON.parse(localStorage.getItem('beatstar_user_ratings_map') || '{}');

      const existingVote = (userRatings[chartId] !== undefined && userRatings[chartId] !== null)

        ? Number(userRatings[chartId])

        : (JSON.parse(localStorage.getItem('beatstar_song_ratings') || '{}')[chartId]?.my_vote ?? 5);



      postGameCurrentRating = existingVote || 5;

      commRatingSec.innerHTML = `

        <div class="flex items-center justify-between px-1">

          <span class="text-[10px] font-bold text-cyan-300 flex items-center gap-1">

            <span class="inline-flex items-center gap-1"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Tu Valoración (Editar):</span>

          </span>

          <span id="postGameRatingVal" class="text-[10px] font-black text-amber-400">${postGameCurrentRating} / 5 Estrellas</span>

        </div>

        <div class="flex justify-center items-center gap-2 text-2xl py-0.5" id="communityRatingStars">

          <span class="cursor-pointer transition hover:scale-125 select-none text-amber-400" onclick="setPostGameRating(1)">★</span>

          <span class="cursor-pointer transition hover:scale-125 select-none text-amber-400" onclick="setPostGameRating(2)">★</span>

          <span class="cursor-pointer transition hover:scale-125 select-none text-amber-400" onclick="setPostGameRating(3)">★</span>

          <span class="cursor-pointer transition hover:scale-125 select-none text-amber-400" onclick="setPostGameRating(4)">★</span>

          <span class="cursor-pointer transition hover:scale-125 select-none text-amber-400" onclick="setPostGameRating(5)">★</span>

        </div>

        <button id="btnSubmitPostRating" onclick="submitPostGameRating()" class="w-full py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl text-xs font-black text-white shadow-md cursor-pointer transition active:scale-95">

          Actualizar Valoración

        </button>

      `;

      updatePostGameRatingUI();

    };

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('PWA Service Worker registered:', reg.scope))
          .catch(err => console.log('Service Worker registration failed:', err));
      });
    }
  