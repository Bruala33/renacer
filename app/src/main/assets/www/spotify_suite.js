/**
 * Piano Community — Spotify-Grade Suite (Audio Studio EQ/Crossfade/Speed,
 * Sleep Timer, Listening History & Sound Capsule Stats, Artist Profile Sheet,
 * and Visual Shareable Song/Lyric Card Generator).
 */
(function () {
  const RECENT_STORAGE_KEY = 'piano_community_recent_tracks_v1';
  const STATS_STORAGE_KEY = 'piano_community_listening_stats_v1';

  const EQ_PRESETS = {
    flat: { label: 'Plano', bands: [0, 0, 0, 0, 0] },
    bass: { label: 'Bass Boost', bands: [7, 4.5, 0.5, 0, 1.5] },
    vocal: { label: 'Vocal', bands: [-2, 1.5, 4.5, 3.5, 1] },
    piano: { label: 'Piano', bands: [1.5, 2.5, 1.5, 3, 4] },
    pop: { label: 'Pop', bands: [2.5, 1, 2.5, 3.5, 2] },
    rock: { label: 'Rock', bands: [5, 2.5, -1, 3.5, 5] },
    electronic: { label: 'Electrónica', bands: [6, 3, 0, 2.5, 5.5] },
    night: { label: 'Noche', bands: [-3, -1, 1.5, -1.5, -4] }
  };

  const SHARE_THEMES = {
    gold: {
      name: 'Oro Studio',
      bgTop: '#241b0c',
      bgMid: '#121014',
      bgBot: '#070709',
      accent: '#f3d791',
      accentSoft: 'rgba(212, 175, 55, 0.28)',
      textMain: '#ffffff',
      textSub: '#d4c39a',
      cardBg: 'rgba(255, 255, 255, 0.05)'
    },
    midnight: {
      name: 'Medianoche',
      bgTop: '#0f1c36',
      bgMid: '#0d1324',
      bgBot: '#06080f',
      accent: '#38bdf8',
      accentSoft: 'rgba(56, 189, 248, 0.25)',
      textMain: '#f8fafc',
      textSub: '#94a3b8',
      cardBg: 'rgba(255, 255, 255, 0.06)'
    },
    crimson: {
      name: 'Carmesí',
      bgTop: '#3b0c1c',
      bgMid: '#1d0b14',
      bgBot: '#090609',
      accent: '#fb7185',
      accentSoft: 'rgba(251, 113, 133, 0.28)',
      textMain: '#fff1f2',
      textSub: '#fda4af',
      cardBg: 'rgba(255, 255, 255, 0.06)'
    },
    ivory: {
      name: 'Editorial',
      bgTop: '#f5efe2',
      bgMid: '#ebe1cc',
      bgBot: '#dfd1b4',
      accent: '#8a5a10',
      accentSoft: 'rgba(138, 90, 16, 0.18)',
      textMain: '#18130c',
      textSub: '#5c4b32',
      cardBg: 'rgba(24, 19, 12, 0.06)'
    }
  };

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normText(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getApp() {
    return window.DiscoverHomeApp || null;
  }

  function getEngine() {
    const app = getApp();
    return app && typeof app.getAudioEngine === 'function' ? app.getAudioEngine() : null;
  }

  function getBestCover(track) {
    const app = getApp();
    if (app && typeof app.getBestTrackCover === 'function') {
      return app.getBestTrackCover(track);
    }
    return (track && (track.artworkUrl600 || track.thumbnail || track.cover_url)) || './app_logo.png';
  }

  function formatRelativeTime(ts) {
    const diffSec = Math.max(0, Math.floor((Date.now() - (Number(ts) || Date.now())) / 1000));
    if (diffSec < 60) return 'Ahora';
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `Hace ${min} min`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `Hace ${hrs} h`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
  }

  function formatMmSs(totalSec) {
    const s = Math.max(0, Math.floor(Number(totalSec) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  const SpotifySuite = {
    _initialized: false,
    _recentTracks: [],
    _stats: {
      totalSeconds: 0,
      totalPlays: 0,
      trackCounts: {},
      artistCounts: {},
      activeDays: []
    },
    _lastRecordedPlayId: '',
    _lastRecordedPlayAt: 0,
    _statsDirtyTick: 0,

    // Sleep Timer state
    _sleepMode: 'off', // 'off' | 'countdown' | 'end_of_track'
    _sleepEndWallMs: 0,
    _sleepInterval: null,
    _sleepFading: false,

    // Artist Profile state
    _activeArtistName: '',
    _activeArtistTracks: [],

    // Share Card state
    _shareTrack: null,
    _shareTheme: 'gold',
    _shareQuote: '',
    _shareLyricsList: [],

    init() {
      if (this._initialized) {
        this.renderRecentlyPlayedCarousel();
        this.syncNowPlayingBadges();
        return;
      }
      this._initialized = true;
      this._loadHistoryAndStats();
      this.renderRecentlyPlayedCarousel();
      this.syncNowPlayingBadges();
    },

    handleBackPress() {
      if (window.EarArcade && typeof window.EarArcade.handleBackPress === 'function' && window.EarArcade.handleBackPress()) {
        return true;
      }
      const sheetClosers = [
        ['shareCardModal', () => this.closeShareCard()],
        ['sleepTimerModal', () => this.closeSleepTimer()],
        ['audioStudioModal', () => this.closeAudioStudio()],
        ['artistProfileModal', () => this.closeArtistProfile()],
        ['listeningStatsModal', () => this.closeListeningStats()]
      ];
      for (const [id, closeFn] of sheetClosers) {
        const el = document.getElementById(id);
        if (el && el.classList.contains('open')) {
          closeFn();
          return true;
        }
      }
      const optSheet = document.getElementById('spotifyTrackOptionsSheet');
      if (optSheet && optSheet.classList.contains('open') && window.DiscoverHomeApp) {
        window.DiscoverHomeApp.closeTrackOptionsSheet();
        return true;
      }
      const npModal = document.getElementById('nowPlayingTurntableModal');
      if (npModal && npModal.classList.contains('open') && window.DiscoverHomeApp) {
        window.DiscoverHomeApp.closeNowPlayingModal();
        return true;
      }
      return false;
    },

    // =========================================================================
    // 1. HISTORIAL DE ESCUCHA Y ESTADÍSTICAS ("TU RESUMEN MUSICAL")
    // =========================================================================
    _loadHistoryAndStats() {
      try {
        const rawRecent = localStorage.getItem(RECENT_STORAGE_KEY);
        if (rawRecent) {
          const parsed = JSON.parse(rawRecent);
          if (Array.isArray(parsed)) this._recentTracks = parsed.slice(0, 30);
        }
      } catch (_) {
        this._recentTracks = [];
      }
      try {
        const rawStats = localStorage.getItem(STATS_STORAGE_KEY);
        if (rawStats) {
          const parsed = JSON.parse(rawStats);
          if (parsed && typeof parsed === 'object') {
            this._stats = {
              totalSeconds: Math.max(0, Number(parsed.totalSeconds) || 0),
              totalPlays: Math.max(0, Number(parsed.totalPlays) || 0),
              trackCounts: parsed.trackCounts && typeof parsed.trackCounts === 'object' ? parsed.trackCounts : {},
              artistCounts: parsed.artistCounts && typeof parsed.artistCounts === 'object' ? parsed.artistCounts : {},
              activeDays: Array.isArray(parsed.activeDays) ? parsed.activeDays.slice(-60) : []
            };
          }
        }
      } catch (_) {}
    },

    _saveHistory() {
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(this._recentTracks.slice(0, 30)));
      } catch (_) {}
    },

    _saveStats() {
      try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(this._stats));
      } catch (_) {}
    },

    getRecentTracks() {
      return Array.isArray(this._recentTracks) ? this._recentTracks : [];
    },

    recordTrackStarted(track) {
      if (!track || !track.title) return;
      const now = Date.now();
      const tid = String(track.id || `${track.title}__${track.artist || ''}`);
      if (tid === this._lastRecordedPlayId && (now - this._lastRecordedPlayAt) < 12000) {
        return;
      }
      this._lastRecordedPlayId = tid;
      this._lastRecordedPlayAt = now;

      const clean = {
        id: track.id || tid,
        videoId: track.videoId || '',
        title: String(track.title || 'Canción').trim(),
        artist: String(track.artist || 'Artista').trim(),
        album: track.album || '',
        artworkUrl600: track.artworkUrl600 || '',
        thumbnail: track.thumbnail || track.cover_url || getBestCover(track),
        durationSec: Number(track.durationSec || track.duration || 195),
        previewUrl: track.previewUrl || '',
        audio_url: track.audio_url || '',
        playedAt: now
      };

      const sigKey = `${normText(clean.title)}__${normText(clean.artist)}`;
      this._recentTracks = this._recentTracks.filter(item => {
        const k = `${normText(item.title)}__${normText(item.artist)}`;
        return String(item.id) !== String(clean.id) && k !== sigKey;
      });
      this._recentTracks.unshift(clean);
      if (this._recentTracks.length > 30) this._recentTracks.length = 30;
      this._saveHistory();

      // Actualizar estadísticas
      this._stats.totalPlays = (this._stats.totalPlays || 0) + 1;
      const dayKey = new Date().toISOString().slice(0, 10);
      if (!this._stats.activeDays.includes(dayKey)) {
        this._stats.activeDays.push(dayKey);
        if (this._stats.activeDays.length > 60) this._stats.activeDays.shift();
      }

      const prevT = this._stats.trackCounts[sigKey] || {
        id: clean.id,
        title: clean.title,
        artist: clean.artist,
        thumbnail: clean.thumbnail,
        videoId: clean.videoId,
        plays: 0,
        seconds: 0
      };
      prevT.plays += 1;
      prevT.lastPlayedAt = now;
      if (clean.thumbnail && clean.thumbnail !== './app_logo.png') prevT.thumbnail = clean.thumbnail;
      this._stats.trackCounts[sigKey] = prevT;

      const primaryArtist = clean.artist.split(/\b(?:feat\.?|ft\.?|&|,|x)\b/i)[0].trim() || clean.artist;
      const aKey = normText(primaryArtist);
      if (aKey && aKey !== 'artista' && aKey !== 'youtube') {
        const prevA = this._stats.artistCounts[aKey] || {
          name: primaryArtist,
          plays: 0,
          seconds: 0,
          cover: clean.thumbnail
        };
        prevA.plays += 1;
        if (clean.thumbnail && clean.thumbnail !== './app_logo.png') prevA.cover = clean.thumbnail;
        this._stats.artistCounts[aKey] = prevA;
      }

      this._saveStats();
      this.renderRecentlyPlayedCarousel();
    },

    recordListenSecond(track) {
      if (!track || !track.title) return;
      this._stats.totalSeconds = (this._stats.totalSeconds || 0) + 1;
      const sigKey = `${normText(track.title)}__${normText(track.artist || '')}`;
      if (this._stats.trackCounts[sigKey]) {
        this._stats.trackCounts[sigKey].seconds = (this._stats.trackCounts[sigKey].seconds || 0) + 1;
      }
      const primaryArtist = String(track.artist || '').split(/\b(?:feat\.?|ft\.?|&|,|x)\b/i)[0].trim();
      const aKey = normText(primaryArtist);
      if (aKey && this._stats.artistCounts[aKey]) {
        this._stats.artistCounts[aKey].seconds = (this._stats.artistCounts[aKey].seconds || 0) + 1;
      }
      this._statsDirtyTick++;
      if (this._statsDirtyTick % 5 === 0) {
        this._saveStats();
      }
    },

    renderRecentlyPlayedCarousel() {
      const section = document.getElementById('recentlyPlayedSection');
      const cont = document.getElementById('carouselRecentlyPlayed');
      if (!section || !cont) return;

      const list = this._recentTracks || [];
      if (list.length === 0) {
        section.classList.add('hidden');
        return;
      }
      section.classList.remove('hidden');

      const app = getApp();
      if (app && typeof app._buildSmartCarouselCardHtml === 'function') {
        cont.innerHTML = list.slice(0, 14).map((tr, idx) => app._buildSmartCarouselCardHtml(tr, idx, 'recent')).join('');
      }
    },

    openListeningStats() {
      const modal = document.getElementById('listeningStatsModal');
      if (!modal) return;
      this._renderListeningStatsBody();
      modal.classList.remove('hidden');
      modal.classList.add('open');
      modal.style.display = 'flex';
    },

    closeListeningStats() {
      const modal = document.getElementById('listeningStatsModal');
      if (!modal) return;
      modal.classList.remove('open');
      modal.classList.add('hidden');
      modal.style.display = 'none';
    },

    clearListeningHistory() {
      this._recentTracks = [];
      this._stats = { totalSeconds: 0, totalPlays: 0, trackCounts: {}, artistCounts: {}, activeDays: [] };
      this._saveHistory();
      this._saveStats();
      this.renderRecentlyPlayedCarousel();
      this._renderListeningStatsBody();
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('Historial y estadísticas reiniciados');
      }
    },

    _renderListeningStatsBody() {
      const body = document.getElementById('listeningStatsBody');
      if (!body) return;

      const mins = Math.max(0, Math.round((this._stats.totalSeconds || 0) / 60));
      const plays = this._stats.totalPlays || 0;
      const topArtists = Object.values(this._stats.artistCounts || {})
        .sort((a, b) => (b.plays * 30 + b.seconds) - (a.plays * 30 + a.seconds))
        .slice(0, 5);
      const topTracks = Object.values(this._stats.trackCounts || {})
        .sort((a, b) => (b.plays * 30 + b.seconds) - (a.plays * 30 + a.seconds))
        .slice(0, 5);
      const uniqueArtistsCount = Object.keys(this._stats.artistCounts || {}).length;
      const streakDays = (this._stats.activeDays || []).length;

      // Extraer ADN Musical del motor actual
      const app = getApp();
      const dna = app && typeof app.getDnaEngine === 'function' ? app.getDnaEngine() : null;
      const vec = dna && typeof dna.getEffectiveTargetVector === 'function'
        ? dna.getEffectiveTargetVector()
        : { energy: 0.55, era: 0.55, vocal: 0.55, melody: 0.65 };

      const dnaItems = [
        { label: 'Energía y Ritmo', pct: Math.round(Math.max(8, Math.min(100, (vec.energy ?? 0.55) * 100))), color: '#f59e0b' },
        { label: 'Sonido Moderno', pct: Math.round(Math.max(8, Math.min(100, (vec.era ?? 0.55) * 100))), color: '#38bdf8' },
        { label: 'Presencia Vocal', pct: Math.round(Math.max(8, Math.min(100, (vec.vocal ?? 0.55) * 100))), color: '#ec4899' },
        { label: 'Afinidad Melódica', pct: Math.round(Math.max(8, Math.min(100, (vec.melody ?? vec.piano ?? 0.65) * 100))), color: '#34d399' }
      ];

      const emptyStateHtml = plays === 0
        ? `<div class="stats-empty-banner">Escucha tus primeras canciones para desbloquear tu Cápsula Sonora personal con tus artistas y temas más escuchados.</div>`
        : '';

      const topArtistsHtml = topArtists.length > 0
        ? topArtists.map((art, i) => `
          <button type="button" onclick="window.SpotifySuite.closeListeningStats(); window.DiscoverHomeApp.openArtistProfile('${escHtml(art.name).replace(/'/g, "\\'")}');" class="stats-rank-row">
            <span class="stats-rank-num">${i + 1}</span>
            <img src="${escHtml(art.cover || './app_logo.png')}" onerror="this.src='./app_logo.png'" class="stats-rank-avatar rounded-full" alt="">
            <div class="min-w-0 flex-1 text-left">
              <div class="text-xs font-extrabold text-white truncate">${escHtml(art.name)}</div>
              <div class="text-[10.5px] text-zinc-400">${art.plays} ${art.plays === 1 ? 'reproducción' : 'reproducciones'}${art.seconds >= 60 ? ` · ${Math.round(art.seconds / 60)} min` : ''}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="text-zinc-500"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        `).join('')
        : `<p class="text-xs text-zinc-500 py-2">Aún no hay artistas destacados.</p>`;

      const topTracksHtml = topTracks.length > 0
        ? topTracks.map((tr, i) => `
          <button type="button" onclick="window.SpotifySuite.playStatsTrack(${i})" class="stats-rank-row">
            <span class="stats-rank-num">${i + 1}</span>
            <img src="${escHtml(tr.thumbnail || './app_logo.png')}" onerror="this.src='./app_logo.png'" class="stats-rank-avatar rounded-lg" alt="">
            <div class="min-w-0 flex-1 text-left">
              <div class="text-xs font-extrabold text-white truncate">${escHtml(tr.title)}</div>
              <div class="text-[10.5px] text-zinc-400 truncate">${escHtml(tr.artist)} · ${tr.plays}×</div>
            </div>
            <span class="stats-play-chip">▶</span>
          </button>
        `).join('')
        : `<p class="text-xs text-zinc-500 py-2">Reproduce música para ver tu Top 5.</p>`;

      this._topTracksCache = topTracks;

      const recentHtml = this._recentTracks.length > 0
        ? this._recentTracks.slice(0, 12).map((tr, idx) => `
          <div onclick="window.SpotifySuite.playRecentIndex(${idx})" class="stats-rank-row cursor-pointer">
            <img src="${escHtml(tr.thumbnail || './app_logo.png')}" onerror="this.src='./app_logo.png'" class="stats-rank-avatar rounded-lg" alt="">
            <div class="min-w-0 flex-1 text-left">
              <div class="text-xs font-bold text-white truncate">${escHtml(tr.title)}</div>
              <div class="text-[10.5px] text-zinc-400 truncate">${escHtml(tr.artist)}</div>
            </div>
            <span class="text-[10px] font-mono text-zinc-500 flex-shrink-0">${formatRelativeTime(tr.playedAt)}</span>
          </div>
        `).join('')
        : `<p class="text-xs text-zinc-500 py-2">Tu historial reciente está vacío.</p>`;

      body.innerHTML = `
        ${emptyStateHtml}
        <div class="stats-hero-grid">
          <div class="stats-kpi-card">
            <span class="stats-kpi-val">${mins}</span>
            <span class="stats-kpi-lbl">Minutos</span>
          </div>
          <div class="stats-kpi-card">
            <span class="stats-kpi-val">${plays}</span>
            <span class="stats-kpi-lbl">Reproducciones</span>
          </div>
          <div class="stats-kpi-card">
            <span class="stats-kpi-val">${uniqueArtistsCount}</span>
            <span class="stats-kpi-lbl">Artistas</span>
          </div>
          <div class="stats-kpi-card">
            <span class="stats-kpi-val">${streakDays}</span>
            <span class="stats-kpi-lbl">Días activos</span>
          </div>
        </div>

        <div class="stats-section-card">
          <div class="stats-section-head">
            <span>Tu Perfil Sonoro (ADN)</span>
            <span class="text-[10px] text-[#f3d791] font-mono uppercase">En vivo</span>
          </div>
          <div class="space-y-2.5 mt-2">
            ${dnaItems.map(item => `
              <div>
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="text-zinc-300 font-semibold">${item.label}</span>
                  <span class="font-mono font-bold text-white">${item.pct}%</span>
                </div>
                <div class="stats-dna-track">
                  <div class="stats-dna-bar" style="width:${item.pct}%; background:${item.color};"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="stats-section-card">
          <div class="stats-section-head"><span>Tus Artistas Top</span></div>
          <div class="space-y-1.5 mt-2">${topArtistsHtml}</div>
        </div>

        <div class="stats-section-card">
          <div class="stats-section-head"><span>Tus Canciones Más Escuchadas</span></div>
          <div class="space-y-1.5 mt-2">${topTracksHtml}</div>
        </div>

        <div class="stats-section-card">
          <div class="stats-section-head">
            <span>Historial Reciente</span>
            ${this._recentTracks.length > 0 ? `<button type="button" onclick="window.SpotifySuite.clearListeningHistory()" class="text-[10.5px] font-bold text-rose-400 hover:text-rose-300 cursor-pointer">Limpiar</button>` : ''}
          </div>
          <div class="space-y-1.5 mt-2">${recentHtml}</div>
        </div>
      `;
    },

    playStatsTrack(idx) {
      const list = this._topTracksCache || [];
      const item = list[idx];
      const engine = getEngine();
      if (!item || !engine) return;
      this.closeListeningStats();
      engine.playTrack(item);
    },

    playRecentIndex(idx) {
      const list = this._recentTracks || [];
      const engine = getEngine();
      if (!list[idx] || !engine) return;
      this.closeListeningStats();
      engine.loadQueueAndPlay(list, idx, 'Escuchado recientemente');
    },

    // =========================================================================
    // 2. AUDIO STUDIO: ECUALIZADOR 5 BANDAS + VELOCIDAD + CROSSFADE + AUTOPLAY
    // =========================================================================
    openAudioStudio() {
      const modal = document.getElementById('audioStudioModal');
      if (!modal) return;
      this._syncAudioStudioUI();
      modal.classList.remove('hidden');
      modal.classList.add('open');
      modal.style.display = 'flex';
    },

    closeAudioStudio() {
      const modal = document.getElementById('audioStudioModal');
      if (!modal) return;
      modal.classList.remove('open');
      modal.classList.add('hidden');
      modal.style.display = 'none';
    },

    _syncAudioStudioUI() {
      const engine = getEngine();
      if (!engine) return;

      const eqToggle = document.getElementById('audioStudioEqToggle');
      if (eqToggle) eqToggle.checked = Boolean(engine.eqEnabled);

      const eqSection = document.getElementById('audioStudioEqControlsWrap');
      if (eqSection) eqSection.classList.toggle('is-disabled', !engine.eqEnabled);

      const statusPill = document.getElementById('audioStudioEqStatusPill');
      if (statusPill) {
        if (!engine.eqEnabled) {
          statusPill.textContent = 'Desactivado';
          statusPill.className = 'audio-studio-status-pill';
        } else if (engine._masterFxBus) {
          statusPill.textContent = 'Activo en vivo';
          statusPill.className = 'audio-studio-status-pill active';
        } else {
          statusPill.textContent = 'Listo · Audio maestro';
          statusPill.className = 'audio-studio-status-pill warm';
        }
      }

      // Preset chips
      document.querySelectorAll('.eq-preset-chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === engine.eqPreset);
      });

      // Sliders & labels
      const bands = engine.eqBands || [0, 0, 0, 0, 0];
      for (let i = 0; i < 5; i++) {
        const sl = document.getElementById(`eqBandSlider_${i}`);
        const valEl = document.getElementById(`eqBandVal_${i}`);
        const db = Number(bands[i]) || 0;
        if (sl) sl.value = String(db);
        if (valEl) valEl.textContent = `${db > 0 ? '+' : ''}${db.toFixed(db % 1 === 0 ? 0 : 1)} dB`;
      }
      this._renderEqCurveSvg(bands, engine.eqEnabled);

      // Playback Speed buttons
      const rate = Number(engine.playbackRate) || 1.0;
      document.querySelectorAll('.speed-pill-btn').forEach(btn => {
        const bRate = Number(btn.dataset.rate) || 1.0;
        btn.classList.toggle('active', Math.abs(bRate - rate) < 0.02);
      });

      // Crossfade slider
      const cfSec = Number(engine.crossfadeSec) || 0;
      const cfSl = document.getElementById('audioStudioCrossfadeSlider');
      const cfLbl = document.getElementById('audioStudioCrossfadeVal');
      if (cfSl) cfSl.value = String(cfSec);
      if (cfLbl) cfLbl.textContent = cfSec === 0 ? 'Desactivado' : `${cfSec} seg`;

      // Autoplay toggle
      const apToggle = document.getElementById('audioStudioAutoplayToggle');
      if (apToggle) apToggle.checked = Boolean(engine.autoplayEnabled);

      this.syncNowPlayingBadges();
    },

    _renderEqCurveSvg(bands = [0, 0, 0, 0, 0], enabled = true) {
      const pathEl = document.getElementById('eqCurveStrokePath');
      const fillEl = document.getElementById('eqCurveFillPath');
      const dotsEl = document.getElementById('eqCurveDotsGroup');
      if (!pathEl || !fillEl) return;

      const W = 320;
      const H = 88;
      const padX = 22;
      const midY = H / 2;
      const scaleY = (H / 2 - 10) / 12;
      const stepX = (W - padX * 2) / 4;

      const pts = bands.map((db, idx) => ({
        x: padX + idx * stepX,
        y: midY - (enabled ? (Number(db) || 0) : 0) * scaleY
      }));

      let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cx = ((p0.x + p1.x) / 2).toFixed(1);
        d += ` C ${cx} ${p0.y.toFixed(1)}, ${cx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
      pathEl.setAttribute('d', d);
      fillEl.setAttribute('d', `${d} L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${pts[0].x.toFixed(1)} ${H} Z`);

      if (dotsEl) {
        dotsEl.innerHTML = pts.map(p =>
          `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.2" fill="${enabled ? '#f3d791' : '#71717a'}" stroke="#09090b" stroke-width="2" />`
        ).join('');
      }
    },

    toggleEqEnabled(checked) {
      const engine = getEngine();
      if (!engine) return;
      engine.applyEqualizerSettings({ enabled: Boolean(checked) }).then(() => {
        this._syncAudioStudioUI();
      });
    },

    applyEqPreset(presetKey) {
      const engine = getEngine();
      const preset = EQ_PRESETS[presetKey];
      if (!engine || !preset) return;
      engine.applyEqualizerSettings({
        enabled: presetKey !== 'flat' ? true : engine.eqEnabled,
        preset: presetKey,
        bands: [...preset.bands]
      }).then(() => {
        this._syncAudioStudioUI();
      });
    },

    onEqBandInput(bandIdx, rawVal) {
      const engine = getEngine();
      if (!engine) return;
      const nextBands = [...(engine.eqBands || [0, 0, 0, 0, 0])];
      nextBands[bandIdx] = Math.max(-12, Math.min(12, Number(rawVal) || 0));
      engine.applyEqualizerSettings({
        enabled: true,
        preset: 'custom',
        bands: nextBands
      }).then(() => {
        this._syncAudioStudioUI();
      });
    },

    setPlaybackRate(rate) {
      const engine = getEngine();
      if (!engine) return;
      engine.setPlaybackRate(rate);
      this._syncAudioStudioUI();
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(`Velocidad: ${Number(rate).toFixed(rate % 1 === 0 ? 1 : 2)}x`);
      }
    },

    onCrossfadeInput(rawSec) {
      const engine = getEngine();
      if (!engine) return;
      engine.setCrossfadeSec(Number(rawSec) || 0);
      this._syncAudioStudioUI();
    },

    toggleAutoplay(checked) {
      const engine = getEngine();
      if (!engine) return;
      engine.setAutoplayEnabled(Boolean(checked));
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(checked ? 'Autoplay infinito activado' : 'Autoplay desactivado');
      }
    },

    // =========================================================================
    // 3. TEMPORIZADOR DE SUEÑO (SLEEP TIMER CON FADE-OUT SUAVE)
    // =========================================================================
    openSleepTimer() {
      const modal = document.getElementById('sleepTimerModal');
      if (!modal) return;
      this._syncSleepTimerUI();
      modal.classList.remove('hidden');
      modal.classList.add('open');
      modal.style.display = 'flex';
    },

    closeSleepTimer() {
      const modal = document.getElementById('sleepTimerModal');
      if (!modal) return;
      modal.classList.remove('open');
      modal.classList.add('hidden');
      modal.style.display = 'none';
    },

    setSleepTimerMinutes(minutes) {
      this.cancelSleepTimer(false);
      const mins = Math.max(1, Number(minutes) || 15);
      this._sleepMode = 'countdown';
      this._sleepEndWallMs = Date.now() + mins * 60 * 1000;
      this._sleepFading = false;

      this._sleepInterval = setInterval(() => this._tickSleepTimer(), 500);
      this._syncSleepTimerUI();
      this.syncNowPlayingBadges();
      this.closeSleepTimer();
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(`Temporizador activado: ${mins} min`);
      }
    },

    setSleepTimerEndOfTrack() {
      this.cancelSleepTimer(false);
      this._sleepMode = 'end_of_track';
      this._sleepEndWallMs = 0;
      this._sleepFading = false;
      this._syncSleepTimerUI();
      this.syncNowPlayingBadges();
      this.closeSleepTimer();
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('La música se pausará al terminar esta canción');
      }
    },

    cancelSleepTimer(showToast = true) {
      if (this._sleepInterval) {
        clearInterval(this._sleepInterval);
        this._sleepInterval = null;
      }
      this._sleepMode = 'off';
      this._sleepEndWallMs = 0;
      this._sleepFading = false;
      this._syncSleepTimerUI();
      this.syncNowPlayingBadges();
      if (showToast && typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('Temporizador de sueño desactivado');
      }
    },

    consumeEndOfTrackSleepTimer() {
      if (this._sleepMode === 'end_of_track') {
        this.cancelSleepTimer(false);
        if (typeof window.showSuccessToast === 'function') {
          window.showSuccessToast('Temporizador finalizado · Buenas noches');
        }
        return true;
      }
      return false;
    },

    _tickSleepTimer() {
      if (this._sleepMode !== 'countdown') return;
      const remainingMs = this._sleepEndWallMs - Date.now();
      const engine = getEngine();

      // Fade-out suave en los últimos 3 segundos
      if (remainingMs <= 3000 && remainingMs > 0 && engine && engine.isPlaying()) {
        const el = engine.getActiveAudioElement();
        if (el) {
          const baseVol = engine._getMasterVolume();
          el.volume = Math.max(0.02, baseVol * (remainingMs / 3000));
        }
      }

      if (remainingMs <= 0) {
        this.cancelSleepTimer(false);
        if (engine) {
          engine._stopBothChannelsImmediate({ stopNativeService: true });
          const el = engine.getActiveAudioElement();
          if (el) el.volume = engine._getMasterVolume();
        }
        if (typeof window.showSuccessToast === 'function') {
          window.showSuccessToast('Temporizador finalizado · Buenas noches');
        }
        return;
      }

      this._syncSleepTimerUI();
      this.syncNowPlayingBadges();
    },

    _syncSleepTimerUI() {
      const statusBox = document.getElementById('sleepTimerActiveBanner');
      const statusText = document.getElementById('sleepTimerActiveCountdown');
      const cancelBtn = document.getElementById('sleepTimerCancelBtn');
      const isActive = this._sleepMode !== 'off';

      if (statusBox) statusBox.classList.toggle('hidden', !isActive);
      if (cancelBtn) cancelBtn.classList.toggle('hidden', !isActive);
      if (statusText && isActive) {
        if (this._sleepMode === 'end_of_track') {
          statusText.textContent = 'Al terminar la canción actual';
        } else {
          const remSec = Math.max(0, Math.ceil((this._sleepEndWallMs - Date.now()) / 1000));
          statusText.textContent = formatMmSs(remSec);
        }
      }
    },

    syncNowPlayingBadges() {
      const engine = getEngine();
      // Audio Studio badge (EQ / Speed / Crossfade)
      const audioBtn = document.getElementById('npDockAudioBtn');
      const audioLbl = document.getElementById('npDockAudioLabel');
      if (engine && audioBtn && audioLbl) {
        const hasSpeed = Math.abs((engine.playbackRate || 1.0) - 1.0) > 0.02;
        const hasEq = Boolean(engine.eqEnabled && engine.eqBands.some(v => Math.abs(v) >= 0.25));
        const hasCf = (engine.crossfadeSec || 0) > 0;
        const active = hasSpeed || hasEq || hasCf;
        audioBtn.classList.toggle('active', active);
        if (hasSpeed) {
          audioLbl.textContent = `${engine.playbackRate.toFixed(engine.playbackRate % 1 === 0 ? 1 : 2)}x`;
        } else if (hasEq) {
          audioLbl.textContent = 'EQ ON';
        } else if (hasCf) {
          audioLbl.textContent = `Fade ${engine.crossfadeSec}s`;
        } else {
          audioLbl.textContent = 'Sonido';
        }
      }

      // Sleep timer badge
      const sleepBtn = document.getElementById('npDockSleepBtn');
      const sleepLbl = document.getElementById('npDockSleepLabel');
      if (sleepBtn && sleepLbl) {
        const isActive = this._sleepMode !== 'off';
        sleepBtn.classList.toggle('active', isActive);
        if (!isActive) {
          sleepLbl.textContent = 'Dormir';
        } else if (this._sleepMode === 'end_of_track') {
          sleepLbl.textContent = 'Fin pista';
        } else {
          const remSec = Math.max(0, Math.ceil((this._sleepEndWallMs - Date.now()) / 1000));
          sleepLbl.textContent = formatMmSs(remSec);
        }
      }
    },

    // =========================================================================
    // 4. PERFIL DE ARTISTA ("IR AL ARTISTA")
    // =========================================================================
    async openArtistProfile(artistName, seedTrack = null) {
      const cleanName = String(artistName || (seedTrack && seedTrack.artist) || '').trim();
      if (!cleanName) return;
      const primaryName = cleanName.split(/\b(?:feat\.?|ft\.?|&|,)\b/i)[0].trim() || cleanName;
      this._activeArtistName = primaryName;

      const modal = document.getElementById('artistProfileModal');
      if (!modal) return;

      const nameEl = document.getElementById('artistSheetName');
      const subEl = document.getElementById('artistSheetSub');
      const heroImg = document.getElementById('artistSheetHeroImg');
      const heroBg = document.getElementById('artistSheetHeroBg');
      const listEl = document.getElementById('artistSheetTracksList');

      if (nameEl) nameEl.textContent = primaryName;
      if (subEl) subEl.textContent = 'Buscando catálogo del artista...';
      const initialCover = seedTrack ? getBestCover(seedTrack) : './app_logo.png';
      if (heroImg) heroImg.src = initialCover;
      if (heroBg) heroBg.style.backgroundImage = `url("${String(initialCover).replace(/"/g, '\\"')}")`;

      modal.classList.remove('hidden');
      modal.classList.add('open');
      modal.style.display = 'flex';

      const targetNorm = normText(primaryName);
      const seenSigs = new Set();
      const tracks = [];
      const addTrack = (t) => {
        if (!t || !t.title) return;
        const sig = `${normText(t.title)}__${normText(t.artist || primaryName)}`;
        if (seenSigs.has(sig)) return;
        seenSigs.add(sig);
        tracks.push(t);
      };

      if (seedTrack && normText(seedTrack.artist || '').includes(targetNorm)) {
        addTrack(seedTrack);
      }

      const app = getApp();
      const pool = app && typeof app.getAllCandidatePool === 'function' ? app.getAllCandidatePool() : [];
      for (const item of pool) {
        const aNorm = normText(item?.artist || '');
        if (aNorm && (aNorm === targetNorm || aNorm.includes(targetNorm))) {
          addTrack(item);
        }
      }

      this._activeArtistTracks = tracks;
      this._renderArtistTracksList(listEl, subEl, heroImg, heroBg, false);

      // Enriquecer desde iTunes si tenemos menos de 10 pistas locales
      if (tracks.length < 10) {
        try {
          const resp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(primaryName)}&media=music&entity=song&limit=18&country=ES`);
          if (resp.ok) {
            const data = await resp.json();
            const results = Array.isArray(data?.results) ? data.results : [];
            for (const item of results) {
              const aNorm = normText(item.artistName || '');
              if (!aNorm.includes(targetNorm)) continue;
              const cover600 = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '';
              addTrack({
                id: `itunes_${item.trackId}`,
                title: item.trackName,
                artist: item.artistName,
                album: item.collectionName || '',
                artworkUrl600: cover600,
                thumbnail: cover600 || './app_logo.png',
                previewUrl: item.previewUrl || '',
                durationSec: Math.round((Number(item.trackTimeMillis) || 195000) / 1000)
              });
            }
          }
        } catch (_) {}
        if (this._activeArtistName === primaryName) {
          this._activeArtistTracks = tracks;
          this._renderArtistTracksList(listEl, subEl, heroImg, heroBg, true);
        }
      }
    },

    _renderArtistTracksList(listEl, subEl, heroImg, heroBg, finishedSearch) {
      const tracks = this._activeArtistTracks || [];
      if (subEl) {
        subEl.textContent = tracks.length > 0
          ? `${tracks.length} ${tracks.length === 1 ? 'canción disponible' : 'canciones disponibles'}`
          : (finishedSearch ? 'No se encontraron más canciones' : 'Cargando canciones...');
      }
      if (tracks[0]) {
        const bestCov = getBestCover(tracks[0]);
        if (bestCov && bestCov !== './app_logo.png') {
          if (heroImg) heroImg.src = bestCov;
          if (heroBg) heroBg.style.backgroundImage = `url("${String(bestCov).replace(/"/g, '\\"')}")`;
        }
      }
      if (!listEl) return;
      if (tracks.length === 0) {
        listEl.innerHTML = `<div class="p-6 text-center text-xs text-zinc-400">Buscando las canciones más populares de ${escHtml(this._activeArtistName)}...</div>`;
        return;
      }

      listEl.innerHTML = tracks.map((tr, idx) => {
        const thumb = getBestCover(tr);
        const dur = formatMmSs(tr.durationSec || tr.duration || 195);
        return `
          <div onclick="window.SpotifySuite.playArtistTrack(${idx})" class="artist-track-row">
            <span class="artist-track-num">${idx + 1}</span>
            <img src="${escHtml(thumb)}" onerror="this.src='./app_logo.png'" class="w-11 h-11 rounded-lg object-cover flex-shrink-0" alt="">
            <div class="min-w-0 flex-1">
              <div class="text-[13px] font-bold text-white truncate">${escHtml(tr.title)}</div>
              <div class="text-[11px] text-zinc-400 truncate">${escHtml(tr.album || tr.artist)} · ${dur}</div>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0" onclick="event.stopPropagation();">
              <button type="button" onclick="window.SpotifySuite.playPianoArtistTrack(${idx})" class="artist-row-action gold" title="Jugar al Piano">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><rect x="2" y="4" width="20" height="16" rx="2.5"/><line x1="8" y1="4" x2="8" y2="14"/><line x1="12" y1="4" x2="12" y2="14"/><line x1="16" y1="4" x2="16" y2="14"/><line x1="6" y1="14" x2="6" y2="20"/><line x1="10" y1="14" x2="10" y2="20"/><line x1="14" y1="14" x2="14" y2="20"/><line x1="18" y1="14" x2="18" y2="20"/></svg>
              </button>
              <button type="button" onclick="window.SpotifySuite.openOptionsArtistTrack(${idx})" class="artist-row-action" title="Más opciones">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </button>
            </div>
          </div>
        `;
      }).join('');
    },

    closeArtistProfile() {
      const modal = document.getElementById('artistProfileModal');
      if (!modal) return;
      modal.classList.remove('open');
      modal.classList.add('hidden');
      modal.style.display = 'none';
    },

    playAllArtistTracks(shuffle = false) {
      const engine = getEngine();
      if (!engine || !this._activeArtistTracks.length) return;
      const list = [...this._activeArtistTracks];
      if (shuffle) {
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
      }
      engine.loadQueueAndPlay(list, 0, this._activeArtistName);
      this.closeArtistProfile();
    },

    startArtistRadio() {
      const app = getApp();
      const seed = this._activeArtistTracks[0];
      if (!app || !seed) return;
      this.closeArtistProfile();
      app.startRadioFromTrack(seed);
    },

    playArtistTrack(idx) {
      const engine = getEngine();
      if (!engine || !this._activeArtistTracks[idx]) return;
      engine.loadQueueAndPlay(this._activeArtistTracks, idx, this._activeArtistName);
    },

    playPianoArtistTrack(idx) {
      const app = getApp();
      const tr = this._activeArtistTracks[idx];
      if (!app || !tr) return;
      this.closeArtistProfile();
      app.closeNowPlayingModal();
      app.launchPianoGameForTrack(tr);
    },

    openOptionsArtistTrack(idx) {
      const app = getApp();
      const tr = this._activeArtistTracks[idx];
      if (!app || !tr) return;
      app.openTrackOptionsSheet(tr, { source: 'artist_profile' });
    },

    // =========================================================================
    // 5. TARJETA VISUAL PARA COMPARTIR (CANCIÓN / LETRA ESTILO SPOTIFY)
    // =========================================================================
    openShareCard(track) {
      const engine = getEngine();
      const tr = track || (engine && engine.currentTrack);
      if (!tr) {
        if (typeof window.showSuccessToast === 'function') {
          window.showSuccessToast('Reproduce una canción primero para crear su tarjeta');
        }
        return;
      }
      this._shareTrack = tr;
      this._shareQuote = '';
      this._shareLyricsList = [];

      // Cargar frases de karaoke si coinciden con la canción actual
      const app = getApp();
      const kar = app && typeof app.getKaraokeService === 'function' ? app.getKaraokeService() : null;
      if (kar && Array.isArray(kar.currentLines) && kar.currentLines.length > 0) {
        const curKey = kar._makeKey(tr);
        if (kar.currentTrackKey === curKey) {
          this._shareLyricsList = kar.currentLines
            .map(l => String(l?.text || '').trim())
            .filter(txt => txt.length >= 6 && txt.length <= 130 && !txt.startsWith('('));
          const activeIdx = Math.max(0, Number(kar.activeLineIdx) || 0);
          const activeText = String(kar.currentLines[activeIdx]?.text || '').trim();
          if (activeText && !activeText.startsWith('(')) {
            this._shareQuote = activeText;
          }
        }
      }

      const quoteInput = document.getElementById('shareCardQuoteInput');
      if (quoteInput) quoteInput.value = this._shareQuote;

      this._renderShareLyricPills();
      this._syncShareThemePills();

      const modal = document.getElementById('shareCardModal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('open');
        modal.style.display = 'flex';
      }
      this._renderShareCardCanvas();
    },

    closeShareCard() {
      const modal = document.getElementById('shareCardModal');
      if (!modal) return;
      modal.classList.remove('open');
      modal.classList.add('hidden');
      modal.style.display = 'none';
    },

    selectShareTheme(themeKey) {
      if (!SHARE_THEMES[themeKey]) return;
      this._shareTheme = themeKey;
      this._syncShareThemePills();
      this._renderShareCardCanvas();
    },

    onShareQuoteInput(val) {
      this._shareQuote = String(val || '').slice(0, 140);
      this._renderShareCardCanvas();
    },

    pickShareLyricLine(idx) {
      const txt = this._shareLyricsList[idx] || '';
      this._shareQuote = txt;
      const quoteInput = document.getElementById('shareCardQuoteInput');
      if (quoteInput) quoteInput.value = txt;
      this._renderShareCardCanvas();
    },

    _syncShareThemePills() {
      document.querySelectorAll('.share-theme-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === this._shareTheme);
      });
    },

    _renderShareLyricPills() {
      const wrap = document.getElementById('shareCardLyricsPicker');
      if (!wrap) return;
      if (!this._shareLyricsList.length) {
        wrap.classList.add('hidden');
        return;
      }
      wrap.classList.remove('hidden');
      wrap.innerHTML = `
        <button type="button" onclick="window.SpotifySuite.onShareQuoteInput(''); const el=document.getElementById('shareCardQuoteInput'); if(el) el.value='';" class="share-lyric-chip">Sin cita</button>
        ${this._shareLyricsList.slice(0, 10).map((line, i) => `
          <button type="button" onclick="window.SpotifySuite.pickShareLyricLine(${i})" class="share-lyric-chip">${escHtml(line.length > 36 ? line.slice(0, 34) + '…' : line)}</button>
        `).join('')}
      `;
    },

    _loadImageForCanvas(url) {
      return new Promise((resolve) => {
        if (!url) { resolve(null); return; }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => resolve(null), 2600);
        img.onload = () => { clearTimeout(timer); resolve(img); };
        img.onerror = () => { clearTimeout(timer); resolve(null); };
        img.src = url;
      });
    },

    _wrapCanvasText(ctx, text, maxWidth, maxLines = 4) {
      const words = String(text || '').trim().split(/\s+/);
      const lines = [];
      let cur = '';
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (ctx.measureText(test).width > maxWidth && cur) {
          lines.push(cur);
          cur = w;
          if (lines.length >= maxLines - 1) break;
        } else {
          cur = test;
        }
      }
      if (cur && lines.length < maxLines) lines.push(cur);
      return lines;
    },

    async _renderShareCardCanvas() {
      const canvas = document.getElementById('shareCardPreviewCanvas');
      const tr = this._shareTrack;
      if (!canvas || !tr) return;
      const ctx = canvas.getContext('2d');
      const W = 720;
      const H = 900;
      canvas.width = W;
      canvas.height = H;

      const theme = SHARE_THEMES[this._shareTheme] || SHARE_THEMES.gold;

      // 1. Fondo degradado editorial
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, theme.bgTop);
      grad.addColorStop(0.55, theme.bgMid);
      grad.addColorStop(1, theme.bgBot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Halo atmosférico superior
      const rad = ctx.createRadialGradient(W * 0.5, H * 0.28, 20, W * 0.5, H * 0.28, 380);
      rad.addColorStop(0, theme.accentSoft);
      rad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, W, H);

      // Marco fino de estudio
      ctx.strokeStyle = theme.accentSoft;
      ctx.lineWidth = 2;
      this._roundRect(ctx, 26, 26, W - 52, H - 52, 34);
      ctx.stroke();

      // 2. Portada del álbum o vinilo dorado fallback
      const coverUrl = getBestCover(tr);
      const img = await this._loadImageForCanvas(coverUrl);
      const hasQuote = Boolean(this._shareQuote && this._shareQuote.trim());
      const covSize = hasQuote ? 270 : 380;
      const covX = (W - covSize) / 2;
      const covY = hasQuote ? 86 : 112;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 42;
      ctx.shadowOffsetY = 18;
      this._roundRect(ctx, covX, covY, covSize, covSize, 26);
      ctx.clip();
      if (img) {
        ctx.drawImage(img, covX, covY, covSize, covSize);
      } else {
        // Fallback elegante de vinilo de estudio
        ctx.fillStyle = '#18181b';
        ctx.fillRect(covX, covY, covSize, covSize);
        ctx.beginPath();
        ctx.arc(W / 2, covY + covSize / 2, covSize * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#09090b';
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = theme.accent;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(W / 2, covY + covSize / 2, covSize * 0.13, 0, Math.PI * 2);
        ctx.fillStyle = theme.accent;
        ctx.fill();
      }
      ctx.restore();

      // Borde sutil sobre la portada
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 2;
      this._roundRect(ctx, covX, covY, covSize, covSize, 26);
      ctx.stroke();

      // 3. Cita de letra (opcional)
      let cursorY = covY + covSize + 52;
      if (hasQuote) {
        ctx.fillStyle = theme.cardBg;
        this._roundRect(ctx, 56, cursorY - 26, W - 112, 186, 22);
        ctx.fill();

        ctx.fillStyle = theme.accent;
        ctx.font = '800 38px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText('“', 78, cursorY + 18);

        ctx.fillStyle = theme.textMain;
        ctx.font = '700 28px system-ui, -apple-system, sans-serif';
        const qLines = this._wrapCanvasText(ctx, this._shareQuote.trim(), W - 180, 3);
        qLines.forEach((line, i) => {
          ctx.fillText(line, 110, cursorY + 26 + i * 38);
        });
        cursorY += 206;
      }

      // 4. Título y Artista
      ctx.textAlign = 'center';
      ctx.fillStyle = theme.textMain;
      ctx.font = '900 36px system-ui, -apple-system, sans-serif';
      const titleLines = this._wrapCanvasText(ctx, tr.title || 'Canción', W - 120, 2);
      titleLines.forEach((line, i) => {
        ctx.fillText(line, W / 2, cursorY + i * 44);
      });
      cursorY += titleLines.length * 44 + 8;

      ctx.fillStyle = theme.textSub;
      ctx.font = '600 24px system-ui, -apple-system, sans-serif';
      ctx.fillText(String(tr.artist || 'Artista').slice(0, 46), W / 2, cursorY);

      // 5. Ondas decorativas + firma inferior
      const waveY = H - 116;
      const barCount = 29;
      const barW = 6;
      const gap = 8;
      const totalW = barCount * (barW + gap) - gap;
      const startX = (W - totalW) / 2;
      ctx.fillStyle = theme.accent;
      for (let i = 0; i < barCount; i++) {
        const h = 8 + Math.abs(Math.sin(i * 0.72 + (tr.title || '').length)) * 26;
        ctx.globalAlpha = 0.45 + 0.5 * Math.sin((i / barCount) * Math.PI);
        this._roundRect(ctx, startX + i * (barW + gap), waveY - h / 2, barW, h, 3);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = theme.textSub;
      ctx.font = '800 16px system-ui, -apple-system, sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('PIANO COMMUNITY · STUDIO', W / 2, H - 58);
    },

    _roundRect(ctx, x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    },

    async shareOrDownloadCard(forceDownload = false) {
      const canvas = document.getElementById('shareCardPreviewCanvas');
      const tr = this._shareTrack;
      if (!canvas || !tr) return;

      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.96));
        if (!blob) throw new Error('no_blob');
        const safeName = `${String(tr.title || 'cancion').replace(/[^a-z0-9]+/gi, '_').slice(0, 32)}.png`;

        if (!forceDownload && navigator.canShare && typeof File !== 'undefined') {
          const file = new File([blob], safeName, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${tr.title} — ${tr.artist}`,
              text: this._shareQuote ? `“${this._shareQuote}” — ${tr.title}` : `Escuchando ${tr.title} de ${tr.artist}`,
              files: [file]
            });
            return;
          }
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        if (typeof window.showSuccessToast === 'function') {
          window.showSuccessToast('Tarjeta guardada como imagen PNG');
        }
      } catch (_) {
        const shareText = `${tr.title} - ${tr.artist}${this._shareQuote ? `\n“${this._shareQuote}”` : ''}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareText).catch(() => {});
        }
        if (typeof window.showSuccessToast === 'function') {
          window.showSuccessToast('Texto de la tarjeta copiado al portapapeles');
        }
      }
    }
  };

  window.SpotifySuite = SpotifySuite;
})();
