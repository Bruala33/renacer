/**
 * PIANO COMMUNITY — EVOLUCIÓN DESCUBRIR (HOME)
 * Estética Retro-Analógica de Lujo: Chopin & Co 1928 / Steinway & Sons Las Vegas 1977
 *
 * Incluye los 7 Módulos Integrados:
 *  - Módulo 1: Navegación Home = Descubrir + Buscador + Conservación Total
 *  - Módulo 2: "Crate Digger" — Swipe Deck Táctil & Vista Compacta (Vinilo 1928 + Casete 1977)
 *  - Módulo 3: Motor de Audio "Dual-Stream" (Preview <100ms + Fade-in 300ms + Precarga HD + Crossfade + Buffer Reuse)
 *  - Módulo 4: Algoritmo Híbrido Real "Analog DNA Engine" (ExternalMusicGraphService + Vector 8D + Similitud de Coseno + UCB1 + 4 Diales de Válvulas + Session Bloom Filter 100)
 *  - Módulo 5: Reproductor Completo Estilo Spotify (Mini-Player Persistente + Tocadiscos Pantalla Completa con Aguja Interactiva + MediaSession Lock Screen)
 *  - Módulo 6: Feed Inferior Tipo Spotify (Mi Mix Diario + Carruseles Inteligentes + Colecciones de YouTube con 🎧 Reproducir Playlist y 🎹 Jugar)
 *  - Módulo 7: Rendimiento, Persistencia (localStorage + IndexedDB + Servidor) y Fade-out 200ms al Jugar
 */

(function () {
  'use strict';

  const STORAGE_KEY_DNA = 'piano_user_music_dna_v1';
  const STORAGE_KEY_GRAPH_CACHE = 'piano_music_graph_cache_v1';
  const STORAGE_KEY_PLAYER_STATE = 'piano_continuous_player_state_v1';

  // =========================================================================
  // 1. SESSION BLOOM FILTER & ANTI-FATIGUE ENGINE (100 CANCIONES + MAX 2 ARTISTA)
  // =========================================================================
  class SessionBloomFilter {
    constructor(maxHistory = 100) {
      this.maxHistory = maxHistory;
      this.recentIds = [];
      this.recentArtists = [];
      this.bitSet = new Uint32Array(64); // 2048 bits
    }

    _hash1(str) {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return Math.abs(h) % 2048;
    }

    _hash2(str) {
      let h = 5381;
      for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h) ^ str.charCodeAt(i);
      }
      return Math.abs(h) % 2048;
    }

    _setBit(bitIdx) {
      const word = (bitIdx / 32) | 0;
      const mask = 1 << (bitIdx % 32);
      this.bitSet[word] |= mask;
    }

    _rebuildBitSet() {
      this.bitSet.fill(0);
      for (const id of this.recentIds) {
        this._setBit(this._hash1(id));
        this._setBit(this._hash2(id));
      }
    }

    loadFromIds(idsArray) {
      if (!Array.isArray(idsArray)) return;
      this.recentIds = idsArray.map(x => String(x || '').trim()).filter(Boolean).slice(-this.maxHistory);
      this._rebuildBitSet();
    }

    markSeen(trackId, artistName = '') {
      const cleanId = String(trackId || '').trim();
      if (cleanId) {
        const existingIdx = this.recentIds.indexOf(cleanId);
        if (existingIdx !== -1) this.recentIds.splice(existingIdx, 1);
        this.recentIds.push(cleanId);
        if (this.recentIds.length > this.maxHistory) {
          this.recentIds.shift();
          this._rebuildBitSet();
        } else {
          this._setBit(this._hash1(cleanId));
          this._setBit(this._hash2(cleanId));
        }
      }
      const normArtist = String(artistName || '').trim().toLowerCase();
      if (normArtist) {
        this.recentArtists.push(normArtist);
        if (this.recentArtists.length > 10) this.recentArtists.shift();
      }
    }

    hasSeenRecently(trackId) {
      const cleanId = String(trackId || '').trim();
      if (!cleanId) return false;
      const b1 = this._hash1(cleanId);
      const b2 = this._hash2(cleanId);
      const hit1 = (this.bitSet[(b1 / 32) | 0] & (1 << (b1 % 32))) !== 0;
      const hit2 = (this.bitSet[(b2 / 32) | 0] & (1 << (b2 % 32))) !== 0;
      if (!hit1 || !hit2) return false;
      return this.recentIds.includes(cleanId);
    }

    wouldViolateArtistCap(artistName, tailArtists = null) {
      const norm = String(artistName || '').trim().toLowerCase();
      if (!norm || norm === 'artista' || norm === 'youtube') return false;
      const list = Array.isArray(tailArtists) ? tailArtists : this.recentArtists;
      if (list.length < 2) return false;
      const a1 = String(list[list.length - 1] || '').trim().toLowerCase();
      const a2 = String(list[list.length - 2] || '').trim().toLowerCase();
      return a1 === norm && a2 === norm;
    }

    exportIds() {
      return [...this.recentIds];
    }
  }

  // =========================================================================
  // 2. EXTERNAL MUSIC GRAPH SERVICE (iTunes, Deezer, MusicBrainz/ListenBrainz, Last.fm)
  // =========================================================================
  class ExternalMusicGraphService {
    constructor() {
      this.metaCache = new Map();
      this.similarCache = new Map();
      this.inflightMeta = new Map();
      this._loadPersistedCache();
    }

    _loadPersistedCache() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_GRAPH_CACHE);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const entries = Object.entries(parsed).slice(-250);
          for (const [k, v] of entries) {
            if (v && (v.previewUrl || v.artworkUrl600)) {
              this.metaCache.set(k, v);
            }
          }
        }
      } catch (_) {}
    }

    _savePersistedCache() {
      try {
        const obj = {};
        const entries = Array.from(this.metaCache.entries()).slice(-180);
        for (const [k, v] of entries) {
          obj[k] = v;
        }
        localStorage.setItem(STORAGE_KEY_GRAPH_CACHE, JSON.stringify(obj));
      } catch (_) {}
    }

    _normKey(title, artist) {
      const t = String(title || '').toLowerCase().replace(/[^a-z0-9áéíóúñü]+/gi, ' ').trim();
      const a = String(artist || '').toLowerCase().replace(/[^a-z0-9áéíóúñü]+/gi, ' ').trim();
      return `${t}__${a}`;
    }

    getCachedTrackMeta(title, artist) {
      return this.metaCache.get(this._normKey(title, artist)) || null;
    }

    /**
     * Enriquesce una canción en vivo conectando con iTunes Search API (600x600 + previewUrl + género + década)
     * y Deezer Public API (vía servidor + proxy) en paralelo.
     */
    async enrichTrackMetadata(track) {
      if (!track) return null;
      const rawTitle = String(track.title || '').trim();
      const rawArtist = String(track.artist || '').replace(/^YouTube$/i, '').trim();
      if (!rawTitle) return null;

      const key = this._normKey(rawTitle, rawArtist);
      if (this.metaCache.has(key)) {
        const hit = this.metaCache.get(key);
        this._applyEnrichedToTrack(track, hit);
        return hit;
      }

      if (this.inflightMeta.has(key)) {
        const res = await this.inflightMeta.get(key);
        if (res) this._applyEnrichedToTrack(track, res);
        return res;
      }

      const promise = (async () => {
        const searchQ = `${rawTitle} ${rawArtist}`.trim();
        const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';

        // Tarea 1: iTunes Search API directa desde cliente (600x600bb + previewUrl + primaryGenreName + releaseDate)
        const itunesClientTask = (async () => {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 1600);
          try {
            const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQ)}&media=music&entity=song&limit=5&country=ES`;
            const resp = await fetch(url, { signal: ctrl.signal });
            clearTimeout(tid);
            if (!resp.ok) throw new Error('itunes_http');
            const data = await resp.json();
            const results = Array.isArray(data?.results) ? data.results : [];
            for (const item of results) {
              if (!item || !item.previewUrl) continue;
              const art600 = item.artworkUrl100
                ? item.artworkUrl100.replace('100x100bb', '600x600bb')
                : '';
              const relYear = item.releaseDate ? parseInt(String(item.releaseDate).slice(0, 4), 10) : null;
              return {
                previewUrl: item.previewUrl,
                artworkUrl600: art600,
                genre: item.primaryGenreName || '',
                releaseYear: Number.isFinite(relYear) ? relYear : null,
                album: item.collectionName || '',
                durationSec: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 180,
                source: 'itunes_api'
              };
            }
          } catch (_) {
            clearTimeout(tid);
          }
          throw new Error('no_itunes');
        })();

        // Tarea 2: Servidor (/api/v1/audio/instant_preview que cruza Deezer Public API + iTunes API)
        const serverDeezerItunesTask = (async () => {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 1800);
          try {
            const vidParam = track.videoId ? `&videoId=${encodeURIComponent(track.videoId)}` : '';
            const resp = await fetch(`${baseUrl}/api/v1/audio/instant_preview?title=${encodeURIComponent(rawTitle)}&artist=${encodeURIComponent(rawArtist)}${vidParam}`, {
              signal: ctrl.signal
            });
            clearTimeout(tid);
            if (!resp.ok) throw new Error('srv_http');
            const data = await resp.json();
            if (data && (data.previewUrl || data.artworkUrl600 || data.artworkUrl)) {
              const resolvedPrev = data.previewUrl && data.previewUrl.startsWith('/')
                ? `${baseUrl}${data.previewUrl}`
                : (data.previewUrl || '');
              const art600 = data.artworkUrl600 || (data.artworkUrl ? data.artworkUrl.replace('300x300bb', '600x600bb').replace('100x100bb', '600x600bb') : '');
              return {
                previewUrl: resolvedPrev,
                artworkUrl600: art600,
                genre: data.genre || '',
                releaseYear: data.releaseYear || null,
                album: data.album || '',
                durationSec: data.durationSec || 180,
                source: data.source || 'deezer_api'
              };
            }
          } catch (_) {
            clearTimeout(tid);
          }
          throw new Error('no_srv');
        })();

        try {
          const winner = await Promise.any([itunesClientTask, serverDeezerItunesTask]);
          if (winner) {
            this.metaCache.set(key, winner);
            if (this.metaCache.size % 10 === 0) this._savePersistedCache();
            this._applyEnrichedToTrack(track, winner);
            if (window._resolvedSongArtworkMap && winner.artworkUrl600) {
              const normTA = typeof window.normalizeSearchText === 'function'
                ? `${window.normalizeSearchText(rawTitle)}__${window.normalizeSearchText(rawArtist)}`
                : key;
              window._resolvedSongArtworkMap.set(normTA, winner.artworkUrl600);
            }
            return winner;
          }
        } catch (_) {}

        return null;
      })();

      this.inflightMeta.set(key, promise);
      try {
        return await promise;
      } finally {
        this.inflightMeta.delete(key);
      }
    }

    _applyEnrichedToTrack(track, meta) {
      if (!track || !meta) return;
      if (meta.previewUrl && (!track.previewUrl || String(track.previewUrl).startsWith('yt_full://'))) {
        track.previewUrl = meta.previewUrl;
        track.preview_url = meta.previewUrl;
      }
      if (meta.artworkUrl600) {
        const curThumb = String(track.thumbnail || track.cover_url || '');
        if (!curThumb || curThumb === './app_logo.png' || curThumb.startsWith('data:image/svg+xml') || curThumb.includes('300x300bb') || curThumb.includes('100x100bb')) {
          track.thumbnail = meta.artworkUrl600;
          track.cover_url = meta.artworkUrl600;
        }
        track.artworkUrl600 = meta.artworkUrl600;
      }
      if (meta.genre && !track.genre) track.genre = meta.genre;
      if (meta.releaseYear && !track.releaseYear) track.releaseYear = meta.releaseYear;
      if (meta.album && !track.album) track.album = meta.album;
      if (meta.durationSec && (!track.durationSec || track.durationSec === 180)) {
        track.durationSec = meta.durationSec;
      }
    }

    /**
     * Consulta ListenBrainz / MusicBrainz, Last.fm (track.getSimilar / artist.getSimilar) y Deezer Related
     * y los cruza con nuestro catálogo y con YouTube.
     */
    async fetchSimilarTracksFromGraph(seedTrack) {
      if (!seedTrack) return [];
      const title = String(seedTrack.title || '').trim();
      const artist = String(seedTrack.artist || '').replace(/^YouTube$/i, '').trim();
      const key = this._normKey(title, artist);

      if (this.similarCache.has(key)) {
        return this.similarCache.get(key);
      }

      const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
      const externalTracks = [];
      const seen = new Set();

      const addExt = (item) => {
        if (!item || !item.title) return;
        const k = this._normKey(item.title, item.artist || '');
        if (seen.has(k) || k === key) return;
        seen.add(k);
        externalTracks.push(item);
      };

      // 1. Endpoint unificado del servidor (/api/v1/music-graph/similar: Deezer Related + MusicBrainz + Last.fm)
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 3200);
        const resp = await fetch(`${baseUrl}/api/v1/music-graph/similar?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`, {
          signal: ctrl.signal
        });
        clearTimeout(tid);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data?.similarTracks)) {
            for (const st of data.similarTracks) addExt(st);
          }
        }
      } catch (_) {}

      // 2. Consulta directa desde cliente a iTunes por artista y género relacionado si necesitamos más pistas
      if (externalTracks.length < 8 && artist) {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 1800);
          const itResp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&media=music&entity=song&limit=10&country=ES`, {
            signal: ctrl.signal
          });
          clearTimeout(tid);
          if (itResp.ok) {
            const itData = await itResp.json();
            for (const item of (itData?.results || [])) {
              if (!item || !item.previewUrl) continue;
              addExt({
                title: item.trackName,
                artist: item.artistName,
                previewUrl: item.previewUrl,
                artworkUrl600: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
                genre: item.primaryGenreName || '',
                releaseYear: item.releaseDate ? parseInt(String(item.releaseDate).slice(0, 4), 10) : null,
                durationSec: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 180,
                source: 'itunes_artist_graph'
              });
            }
          }
        } catch (_) {}
      }

      this.similarCache.set(key, externalTracks);
      return externalTracks;
    }
  }

  // =========================================================================
  // 3. ANALOG DNA ENGINE (VECTOR 8D + SIMILITUD DE COSENO + UCB1 BANDIT + 4 DIALES)
  // =========================================================================
  /**
   * Dimensiones del Vector 8D:
   *  [0] BPM_Norm                  (0.0 = 60 BPM lento -> 1.0 = 180+ BPM rápido)
   *  [1] Energy                    (0.0 = Calma/Nocturno -> 1.0 = Alta Tensión/Frenético)
   *  [2] Era_Decade                (0.0 = Clásico/1920s-60s -> 0.5 = 80s -> 1.0 = 2020s)
   *  [3] Vocal_Weight              (0.0 = 100% Instrumental/Piano Solo -> 1.0 = 100% Vocal)
   *  [4] Rock_Affinity             (0.0 -> 1.0)
   *  [5] Electronic_Affinity       (0.0 -> 1.0)
   *  [6] Pop_Latin_Affinity        (0.0 -> 1.0)
   *  [7] Classical_Piano_Affinity  (0.0 -> 1.0)
   */
  class AnalogDNAEngine {
    constructor(graphService) {
      this.graphService = graphService;
      this.bloomFilter = new SessionBloomFilter(100);

      // Perfil por defecto equilibrado con toque de lujo Steinway/Vegas
      this.userVector = [0.55, 0.60, 0.62, 0.65, 0.52, 0.45, 0.58, 0.58];
      this.sessionPenaltyVector = [0, 0, 0, 0, 0, 0, 0, 0];

      // 4 Preferencias Musicales (0 a 100) + Opciones "No me importa" (dontCare)
      this.dials = {
        discovery: 35, // 0 = Mis gustos seguros, 100 = Sorpréndeme (UCB1 exploration)
        energy: 60,    // 0 = Calma/Adagio, 100 = Alta Energía/Presto
        era: 55,       // 0 = Vintage 1928-1977, 50 = 80s-90s, 100 = Actual 2000s-2026
        vocal: 55      // 0 = Instrumental/Piano Solo, 100 = Vocal/Himnos
      };

      this.dontCare = {
        era: false,
        energy: false,
        vocal: false,
        discovery: false
      };

      this.likes = new Set();
      this.dislikes = new Set();
      this.longListens = new Set();
      this.highAccuracyPlays = new Set();
      this.lastLikedTrack = null;
      this.totalSwipes = 0;

      // Multi-Armed Bandit (UCB1) brazos por clúster estilístico
      this.banditArms = {
        rock: { pulls: 2, rewardSum: 1.3 },
        electronic: { pulls: 2, rewardSum: 1.2 },
        pop_latin: { pulls: 2, rewardSum: 1.4 },
        classical_piano: { pulls: 2, rewardSum: 1.4 },
        retro_vegas: { pulls: 2, rewardSum: 1.35 },
        virtuoso_mania: { pulls: 2, rewardSum: 1.2 }
      };

      this.loadFromStorage();
    }

    loadFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_DNA);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return;
        if (Array.isArray(data.vector) && data.vector.length === 8) {
          this.userVector = data.vector.map(v => Math.max(0.05, Math.min(0.98, Number(v) || 0.5)));
        }
        if (data.dials && typeof data.dials === 'object') {
          this.dials.discovery = Math.max(0, Math.min(100, Number(data.dials.discovery ?? 35)));
          this.dials.energy = Math.max(0, Math.min(100, Number(data.dials.energy ?? 60)));
          this.dials.era = Math.max(0, Math.min(100, Number(data.dials.era ?? 55)));
          this.dials.vocal = Math.max(0, Math.min(100, Number(data.dials.vocal ?? 55)));
        }
        if (data.dontCare && typeof data.dontCare === 'object') {
          this.dontCare.era = Boolean(data.dontCare.era);
          this.dontCare.energy = Boolean(data.dontCare.energy);
          this.dontCare.vocal = Boolean(data.dontCare.vocal);
          this.dontCare.discovery = Boolean(data.dontCare.discovery);
        }
        if (Array.isArray(data.likes)) this.likes = new Set(data.likes);
        if (Array.isArray(data.dislikes)) this.dislikes = new Set(data.dislikes);
        if (Array.isArray(data.session_bloom_ids)) {
          this.bloomFilter.loadFromIds(data.session_bloom_ids);
        }
        if (data.bandit_arms && typeof data.bandit_arms === 'object') {
          for (const [k, v] of Object.entries(data.bandit_arms)) {
            if (this.banditArms[k] && v && typeof v === 'object') {
              this.banditArms[k].pulls = Math.max(1, Number(v.pulls) || 2);
              this.banditArms[k].rewardSum = Math.max(0, Number(v.rewardSum) || 1.0);
            }
          }
        }
        if (data.last_liked_track && typeof data.last_liked_track === 'object') {
          this.lastLikedTrack = data.last_liked_track;
        }
        this.totalSwipes = Math.max(0, Number(data.total_swipes) || 0);
      } catch (_) {}
    }

    saveToStorage(syncCloud = true) {
      const payload = this.exportSnapshot();
      try {
        localStorage.setItem(STORAGE_KEY_DNA, JSON.stringify(payload));
      } catch (_) {}
      if (syncCloud && typeof window.scheduleCloudProfileSync === 'function') {
        window.scheduleCloudProfileSync();
      }
    }

    exportSnapshot() {
      return {
        vector: this.userVector.map(v => +Number(v).toFixed(4)),
        dials: { ...this.dials },
        dontCare: { ...this.dontCare },
        likes: Array.from(this.likes).slice(-300),
        dislikes: Array.from(this.dislikes).slice(-200),
        session_bloom_ids: this.bloomFilter.exportIds(),
        total_swipes: this.totalSwipes,
        bandit_arms: this.banditArms,
        last_liked_track: this.lastLikedTrack,
        updated_at: new Date().toISOString()
      };
    }

    importFromCloudProfile(musicDnaObj) {
      if (!musicDnaObj || typeof musicDnaObj !== 'object') return;
      if (Array.isArray(musicDnaObj.vector) && musicDnaObj.vector.length === 8) {
        this.userVector = musicDnaObj.vector.map(v => Math.max(0.05, Math.min(0.98, Number(v) || 0.5)));
      }
      if (musicDnaObj.dials && typeof musicDnaObj.dials === 'object') {
        this.dials = {
          discovery: Math.max(0, Math.min(100, Number(musicDnaObj.dials.discovery ?? this.dials.discovery))),
          energy: Math.max(0, Math.min(100, Number(musicDnaObj.dials.energy ?? this.dials.energy))),
          era: Math.max(0, Math.min(100, Number(musicDnaObj.dials.era ?? this.dials.era))),
          vocal: Math.max(0, Math.min(100, Number(musicDnaObj.dials.vocal ?? this.dials.vocal)))
        };
      }
      if (musicDnaObj.dontCare && typeof musicDnaObj.dontCare === 'object') {
        this.dontCare = {
          era: Boolean(musicDnaObj.dontCare.era ?? this.dontCare.era),
          energy: Boolean(musicDnaObj.dontCare.energy ?? this.dontCare.energy),
          vocal: Boolean(musicDnaObj.dontCare.vocal ?? this.dontCare.vocal),
          discovery: Boolean(musicDnaObj.dontCare.discovery ?? this.dontCare.discovery)
        };
      }
      if (Array.isArray(musicDnaObj.likes)) {
        for (const l of musicDnaObj.likes) this.likes.add(String(l));
      }
      if (Array.isArray(musicDnaObj.dislikes)) {
        for (const d of musicDnaObj.dislikes) this.dislikes.add(String(d));
      }
      if (Array.isArray(musicDnaObj.session_bloom_ids)) {
        this.bloomFilter.loadFromIds(musicDnaObj.session_bloom_ids);
      }
      if (musicDnaObj.last_liked_track) {
        this.lastLikedTrack = musicDnaObj.last_liked_track;
      }
      this.saveToStorage(false);
    }

    encodeTrackVector(track) {
      if (track && Array.isArray(track._dnaVector8D) && track._dnaVector8D.length === 8) {
        return track._dnaVector8D;
      }
      const title = String(track?.title || '').toLowerCase();
      const artist = String(track?.artist || '').toLowerCase();
      const genre = String(track?.genre || track?.category || '').toLowerCase();
      const combined = `${title} ${artist} ${genre}`;

      let rawBpm = Number(track?.bpm) || 120;
      while (rawBpm > 205) rawBpm *= 0.5;
      while (rawBpm < 58) rawBpm *= 2.0;
      const bpmNorm = Math.max(0.08, Math.min(0.98, (rawBpm - 60) / 135));

      let rockAff = 0.15;
      let elecAff = 0.12;
      let popLatinAff = 0.20;
      let classicalPianoAff = 0.18;

      if (/\b(rock|metal|ac\/dc|queen|metallica|nirvana|linkin park|guns n|bon jovi|system of a down|evanescence|green day|red hot|offspring|slipknot|avenged|foo fighters|europe|beatles|rolling stones|blink|soundgarden|verve|heroes del silencio|soda stereo|extremoduro|platero|fito|mago de oz|rata blanca|attaque|dragonforce)\b/i.test(combined)) {
        rockAff = 0.92;
      }
      if (/\b(electronic|edm|phonk|dance|kordhell|dvrst|alan walker|avicii|skrillex|thefatrat|martin garrix|marshmello|vicetone|dj snake|deadmau5|zedd|gabry ponte|camellia|kobaryo|usao|t\+pazolite|laur|lapix|xi|kurokotei|synth|techno|dubstep|dnb)\b/i.test(combined)) {
        elecAff = 0.94;
      }
      if (/\b(pop|latin|español|balada|dua lipa|weeknd|bad bunny|billie eilish|bizarrap|quevedo|harry styles|olivia rodrigo|bruno mars|rauw|rosalia|shakira|lady gaga|taylor swift|ed sheeran|post malone|maroon 5|adele|katy perry|britney|juanes|alejandro sanz|luis miguel|camilo sesto|nino bravo|juan gabriel|bustamante|mecano|mana|calamaro|laura pausini|chayanne|bisbal|melendi|estopa|canto del loco|oreja de van gogh|reik|camila|cristian castro|mon laferte|abel pintos)\b/i.test(combined)) {
        popLatinAff = 0.90;
      }
      if (/\b(piano|chopin|beethoven|debussy|liszt|mozart|rachmaninoff|satie|pachelbel|yiruma|einaudi|nocturne|sonata|clair de lune|campanella|rhapsody|prelude|waltz|gymnopedie|sinatra|billy joel|elton john|ray charles|nina simone|brubeck|louis armstrong|elvis|jazz|lounge|classical|clasica)\b/i.test(combined)) {
        classicalPianoAff = 0.95;
      }

      let vocalWeight = 0.78;
      if (classicalPianoAff >= 0.85 && !/\b(sinatra|billy joel|elton john|elvis|queen|ray charles|nina simone)\b/i.test(combined)) {
        vocalWeight = 0.08;
      } else if (/\b(instrumental|nocturne|sonata|symphony|ost|megalovania|bfg division|sweden|sealed vessel|camellia|kobaryo|freedom dive|galaxy collapse)\b/i.test(combined)) {
        vocalWeight = 0.14;
      } else if (elecAff >= 0.85 && !/\b(avicii|alan walker|zedd|marshmello)\b/i.test(combined)) {
        vocalWeight = 0.30;
      }

      let eraDecade = 0.65;
      const year = Number(track?.releaseYear) || 0;
      if (year > 1900) {
        eraDecade = Math.max(0.05, Math.min(0.98, (year - 1955) / 70));
      } else if (/\b(chopin|beethoven|mozart|liszt|debussy|rachmaninoff|satie|pachelbel)\b/i.test(combined)) {
        eraDecade = 0.08;
      } else if (/\b(sinatra|elvis|beatles|rolling stones|louis armstrong|ray charles|nina simone|brubeck|camilo sesto|nino bravo|queen|billy joel|elton john)\b/i.test(combined)) {
        eraDecade = 0.32;
      } else if (/\b(ac\/dc|bon jovi|guns n|metallica|nirvana|mecano|heroes del silencio|soda stereo|luis miguel|europe|toto)\b/i.test(combined)) {
        eraDecade = 0.52;
      } else if (/\b(dua lipa|weeknd|bad bunny|billie eilish|bizarrap|quevedo|olivia rodrigo|rosalia|kordhell|dvrst|taylor swift)\b/i.test(combined)) {
        eraDecade = 0.92;
      }

      let energy = (bpmNorm * 0.45) + (rockAff * 0.25) + (elecAff * 0.25) + 0.15;
      if (/\b(nocturne|clair de lune|gymnopedie|lullaby|balada|wonderful world|can't help falling|my way|river flows|nuvole bianche|abrazame)\b/i.test(combined)) {
        energy = Math.min(energy, 0.32);
      } else if (/\b(metal|phonk|hardcore|through the fire|master of puppets|duality|bangarang|bfg division|camellia|thunder|back in black)\b/i.test(combined)) {
        energy = Math.max(energy, 0.90);
      }
      energy = Math.max(0.10, Math.min(0.98, energy));

      const vec = [
        +bpmNorm.toFixed(3),
        +energy.toFixed(3),
        +eraDecade.toFixed(3),
        +vocalWeight.toFixed(3),
        +rockAff.toFixed(3),
        +elecAff.toFixed(3),
        +popLatinAff.toFixed(3),
        +classicalPianoAff.toFixed(3)
      ];
      if (track && typeof track === 'object') {
        track._dnaVector8D = vec;
        track._dnaCluster = this._inferClusterFromVector(vec, combined);
      }
      return vec;
    }

    _inferClusterFromVector(vec, combinedStr = '') {
      if (vec[7] >= 0.75) return vec[2] <= 0.4 ? 'classical_piano' : 'retro_vegas';
      if (vec[5] >= 0.75) return vec[1] >= 0.85 ? 'virtuoso_mania' : 'electronic';
      if (vec[4] >= 0.75) return 'rock';
      if (vec[6] >= 0.70) return 'pop_latin';
      if (/\b(vegas|sinatra|elvis|jazz|lounge)\b/i.test(combinedStr)) return 'retro_vegas';
      return 'pop_latin';
    }

    getEffectiveTargetVector() {
      const u = [...this.userVector];
      const energyDialNorm = this.dials.energy / 100;
      const eraDialNorm = this.dials.era / 100;
      const vocalDialNorm = this.dials.vocal / 100;

      if (!this.dontCare.energy) {
        u[0] = Math.max(0.05, Math.min(0.98, u[0] * 0.45 + energyDialNorm * 0.55));
        u[1] = Math.max(0.05, Math.min(0.98, u[1] * 0.40 + energyDialNorm * 0.60));
      }
      if (!this.dontCare.era) {
        u[2] = Math.max(0.05, Math.min(0.98, u[2] * 0.40 + eraDialNorm * 0.60));
      }
      if (!this.dontCare.vocal) {
        u[3] = Math.max(0.05, Math.min(0.98, u[3] * 0.35 + vocalDialNorm * 0.65));
        if (vocalDialNorm < 0.35) {
          u[7] = Math.min(0.98, u[7] + (0.35 - vocalDialNorm) * 0.85);
        }
      }

      for (let i = 0; i < 8; i++) {
        u[i] = Math.max(0.05, Math.min(0.98, u[i] - (this.sessionPenaltyVector[i] || 0)));
      }
      return u;
    }

    /**
     * Calcula el vector centroide 8D de todas las canciones de una playlist
     */
    computePlaylistCentroidVector(tracks = [], playlistTitle = '') {
      if (!Array.isArray(tracks) || tracks.length === 0) {
        if (playlistTitle) {
          return this.encodeTrackVector({ title: playlistTitle, artist: '', genre: playlistTitle });
        }
        return this.getEffectiveTargetVector();
      }
      const sum = [0, 0, 0, 0, 0, 0, 0, 0];
      let validCount = 0;
      for (const tr of tracks) {
        if (!tr) continue;
        const v = this.encodeTrackVector(tr);
        for (let i = 0; i < 8; i++) {
          sum[i] += Number(v[i]) || 0.5;
        }
        validCount++;
      }
      if (validCount === 0) return this.getEffectiveTargetVector();
      return sum.map(val => +(val / validCount).toFixed(3));
    }

    /**
     * Puntúa una canción específicamente para una Playlist X basándose en todas las canciones de esa playlist
     */
    scoreTrackForPlaylist(track, playlistObj, centroidVec = null) {
      if (!track) return 0;
      const plTracks = Array.isArray(playlistObj?.tracks) ? playlistObj.tracks : [];
      const effCentroid = centroidVec || this.computePlaylistCentroidVector(plTracks, playlistObj?.title || '');
      const trackVec = this.encodeTrackVector(track);
      const cosSim = this.cosineSimilarity(effCentroid, trackVec, true);

      let artistBonus = 0;
      const trackArtist = String(track.artist || '').toLowerCase().trim();
      if (trackArtist && plTracks.length > 0) {
        const sameArtist = plTracks.some(pt => {
          const pa = String(pt?.artist || '').toLowerCase().trim();
          return pa && (pa.includes(trackArtist) || trackArtist.includes(pa));
        });
        if (sameArtist) artistBonus = 0.16;
      }

      let penalty = 0;
      if (this.dislikes.has(String(track.id))) penalty = 0.35;

      return cosSim + artistBonus - penalty;
    }

    cosineSimilarity(vecA, vecB, ignoreDontCare = false) {
      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < 8; i++) {
        if (!ignoreDontCare) {
          if (this.dontCare.energy && (i === 0 || i === 1)) continue;
          if (this.dontCare.era && i === 2) continue;
          if (this.dontCare.vocal && i === 3) continue;
        }
        const a = Number(vecA[i]) || 0;
        const b = Number(vecB[i]) || 0;
        dot += a * b;
        normA += a * a;
        normB += b * b;
      }
      if (normA <= 1e-9 || normB <= 1e-9) return 0.5;
      return Math.max(0, Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB))));
    }

    scoreTrackForRecommendation(track, targetVec = null) {
      const effUserVec = targetVec || this.getEffectiveTargetVector();
      const trackVec = this.encodeTrackVector(track);
      const cosSim = this.cosineSimilarity(effUserVec, trackVec, false);

      const cluster = track._dnaCluster || 'pop_latin';
      const arm = this.banditArms[cluster] || { pulls: 2, rewardSum: 1.2 };
      const totalPulls = Object.values(this.banditArms).reduce((acc, a) => acc + (a.pulls || 1), 0);

      const discoveryRatio = this.dontCare.discovery ? 0.55 : (this.dials.discovery / 100);
      const c = 0.15 + discoveryRatio * 1.45;
      const meanReward = arm.rewardSum / Math.max(1, arm.pulls);
      const ucbBonus = Math.min(1.25, meanReward + c * Math.sqrt((2 * Math.log(totalPulls + 1)) / Math.max(1, arm.pulls)));

      const exploitWeight = 1 - (discoveryRatio * 0.48);
      const exploreWeight = discoveryRatio * 0.48;
      let finalScore = (cosSim * exploitWeight) + ((ucbBonus / 1.25) * exploreWeight);

      if (this.dislikes.has(String(track.id))) {
        finalScore -= 0.35;
      }

      const matchPct = Math.round(Math.max(58, Math.min(99, cosSim * 100)));
      track._dnaMatchPct = matchPct;
      track._ucbScore = finalScore;
      return finalScore;
    }

    _reinforceVector(track, learningRate, banditReward) {
      const vec = this.encodeTrackVector(track);
      for (let i = 0; i < 8; i++) {
        this.userVector[i] = Math.max(0.05, Math.min(0.98, this.userVector[i] * (1 - learningRate) + vec[i] * learningRate));
        this.sessionPenaltyVector[i] = Math.max(0, (this.sessionPenaltyVector[i] || 0) * 0.65);
      }
      const cluster = track._dnaCluster || 'pop_latin';
      if (!this.banditArms[cluster]) {
        this.banditArms[cluster] = { pulls: 1, rewardSum: 0.5 };
      }
      this.banditArms[cluster].pulls += 1;
      this.banditArms[cluster].rewardSum += Math.max(0, Math.min(1.5, banditReward));
    }

    recordLike(track) {
      if (!track) return;
      const id = String(track.id || '');
      if (id) {
        this.likes.add(id);
        this.dislikes.delete(id);
      }
      this.totalSwipes += 1;
      this.lastLikedTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail || track.cover_url || './app_logo.png'
      };
      this._reinforceVector(track, 0.18, 1.0);
      this.saveToStorage(true);
    }

    recordPass(track) {
      if (!track) return;
      const id = String(track.id || '');
      if (id && !this.likes.has(id)) {
        this.dislikes.add(id);
      }
      this.totalSwipes += 1;
      const vec = this.encodeTrackVector(track);
      for (let i = 0; i < 8; i++) {
        if (vec[i] > 0.65) {
          this.sessionPenaltyVector[i] = Math.min(0.32, (this.sessionPenaltyVector[i] || 0) + 0.06);
        }
      }
      const cluster = track._dnaCluster || 'pop_latin';
      if (this.banditArms[cluster]) {
        this.banditArms[cluster].pulls += 1;
        this.banditArms[cluster].rewardSum += 0.1;
      }
      this.saveToStorage(true);
    }

    recordLongListen(track) {
      if (!track || !track.id) return;
      const id = String(track.id);
      if (this.longListens.has(id)) return;
      this.longListens.add(id);
      this._reinforceVector(track, 0.14, 0.85);
      this.saveToStorage(true);
    }

    recordHighAccuracyPlay(track, accuracyPct = 90) {
      if (!track) return;
      const id = String(track.id || track.communityChartId || '');
      if (id) this.highAccuracyPlays.add(id);
      const weight = accuracyPct >= 95 ? 0.24 : 0.18;
      this._reinforceVector(track, weight, 1.15);
      if (!this.lastLikedTrack && track.title) {
        this.lastLikedTrack = {
          id: id || `play_${Date.now()}`,
          title: track.title,
          artist: track.artist || 'Artista',
          thumbnail: track.thumbnail || track.cover_url || './app_logo.png'
        };
      }
      this.saveToStorage(true);
    }

    setDial(dialName, value) {
      if (!(dialName in this.dials)) return;
      this.dials[dialName] = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
      if (dialName in this.dontCare) {
        this.dontCare[dialName] = false;
      }
      this.saveToStorage(true);
    }

    setDontCare(dimKey, isDontCare) {
      if (!(dimKey in this.dontCare)) return;
      this.dontCare[dimKey] = Boolean(isDontCare);
      this.saveToStorage(true);
    }
  }

  // =========================================================================
  // 3B. KARAOKE LYRICS SERVICE (SINCRONIZACIÓN EN TIEMPO REAL ESTILO KARAOKE)
  // =========================================================================
  class KaraokeLyricsService {
    constructor() {
      this.cache = new Map();
      this.candidatesCache = new Map();
      this.inflight = new Map();
      this.currentLyrics = [];
      this.currentTrackKey = '';
      this.activeLineIndex = -1;
      this.timeOffsetSec = 0;
    }

    _makeKey(track) {
      const t = String(track?.title || '').toLowerCase().trim();
      const a = String(track?.artist || '').toLowerCase().trim();
      return `${t}__${a}`;
    }

    _cleanSearchTerm(str) {
      return String(str || '')
        .replace(/\(.*?\)|\[.*?\]/g, '')
        .replace(/\b(official|oficial|video|music video|audio|remastered|remaster|live|hd|4k|lyrics|letra|videoclip)\b/gi, '')
        .replace(/\b(feat\.?|ft\.?|con|with)\b.*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    _extractPrimaryArtist(str) {
      const cleaned = this._cleanSearchTerm(str)
        .replace(/ - Topic$/i, '')
        .replace(/VEVO$/i, '')
        .trim();
      const parts = cleaned.split(/\s*(?:,|&|\/|;| x | and | y )\s*/i);
      return (parts[0] || cleaned).trim();
    }

    _normMatch(str) {
      return String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    parseLrc(lrcText) {
      const lines = String(lrcText || '').split(/\r?\n/);
      const parsed = [];
      let headerOffsetSec = 0;
      const offsetMatch = String(lrcText || '').match(/\[offset:\s*([+-]?\d+)\s*\]/i);
      if (offsetMatch) {
        headerOffsetSec = (parseInt(offsetMatch[1], 10) || 0) / 1000;
      }

      const timeExp = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
      for (const rawLine of lines) {
        const matches = [...rawLine.matchAll(timeExp)];
        if (matches.length === 0) continue;
        const text = rawLine.replace(timeExp, '').trim();
        if (!text) continue;
        for (const m of matches) {
          const min = parseInt(m[1], 10) || 0;
          const sec = parseInt(m[2], 10) || 0;
          const msStr = (m[3] || '0').padEnd(3, '0').slice(0, 3);
          const ms = parseInt(msStr, 10) || 0;
          const tSec = Math.max(0, min * 60 + sec + ms / 1000 - headerOffsetSec);
          parsed.push({
            timeSec: +tSec.toFixed(2),
            text
          });
        }
      }
      parsed.sort((a, b) => a.timeSec - b.timeSec);
      return parsed;
    }

    buildFallbackSyncedLines(plainText, totalDurationSec = 195, track = null) {
      const rawLines = String(plainText || '')
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);

      if (rawLines.length > 0) {
        const startOffset = Math.min(12, Math.max(4, totalDurationSec * 0.05));
        const usableSpan = Math.max(40, totalDurationSec - startOffset - 10);
        const step = usableSpan / Math.max(1, rawLines.length);
        return rawLines.map((text, idx) => ({
          timeSec: +(startOffset + idx * step).toFixed(2),
          text
        }));
      }

      const title = track?.title || 'Canción';
      const artist = track?.artist || 'Artista';
      const chorusSec = Math.round(Math.max(30, Math.min(62, totalDurationSec * 0.28)));
      return [
        { timeSec: 0, text: `♪ ${title} — ${artist} ♪` },
        { timeSec: 8, text: 'Introducción instrumental · Siente el pulso del piano' },
        { timeSec: Math.max(16, Math.round(chorusSec * 0.55)), text: 'Desarrollo melódico · Preparando entrada principal' },
        { timeSec: chorusSec, text: `★ Sección Principal — ${title} ★` },
        { timeSec: chorusSec + 18, text: 'Sección rítmica central · Mantén la cadencia' },
        { timeSec: Math.round(totalDurationSec * 0.58), text: 'Puente armónico · Variación de intensidad' },
        { timeSec: Math.round(totalDurationSec * 0.72), text: `★ Clímax Final — ${title} ★` },
        { timeSec: Math.round(totalDurationSec * 0.88), text: 'Coda final y resolución' }
      ];
    }

    _pickBestCandidateLines(candidates, targetDurationSec = 195, track = null, detectedIntroSec = null) {
      if (!Array.isArray(candidates) || candidates.length === 0) {
        return this.buildFallbackSyncedLines('', targetDurationSec, track);
      }

      const cleanTitleNorm = this._normMatch(this._cleanSearchTerm(track?.title || ''));
      const primaryArtistNorm = this._normMatch(this._extractPrimaryArtist(track?.artist || ''));

      const syncedList = [];
      for (const item of candidates) {
        if (!item || !item.syncedLyrics || !item.syncedLyrics.includes('[')) continue;
        const parsed = this.parseLrc(item.syncedLyrics);
        if (parsed.length < 3) continue;

        const itemTitleNorm = this._normMatch(item.trackName || item.name || '');
        const itemArtistNorm = this._normMatch(item.artistName || '');
        let score = 0;

        if (cleanTitleNorm && itemTitleNorm) {
          if (itemTitleNorm === cleanTitleNorm) score += 50;
          else if (itemTitleNorm.includes(cleanTitleNorm) || cleanTitleNorm.includes(itemTitleNorm)) score += 30;
        }
        if (primaryArtistNorm && itemArtistNorm) {
          if (itemArtistNorm.includes(primaryArtistNorm) || primaryArtistNorm.includes(itemArtistNorm)) {
            score += 45;
          } else {
            score -= 30;
          }
        }

        const itemDur = Number(item.duration) || (parsed[parsed.length - 1].timeSec + 8);
        const durDiff = Math.abs(itemDur - targetDurationSec);
        // Penalizar diferencias de duración para elegir la versión exacta (álbum vs vídeo vs radio edit)
        const durScore = Math.max(-40, 40 - durDiff * 1.4);
        score += durScore;

        syncedList.push({
          item,
          parsed,
          itemDur,
          durDiff,
          score
        });
      }

      if (syncedList.length > 0) {
        syncedList.sort((a, b) => b.score - a.score);
        const best = syncedList[0];
        let lines = best.parsed.map(l => ({ ...l }));

        // Si el audio cargado es más largo que el LRC (p.ej. vídeo oficial con intro hablada/cinemática como "Loco" 4:08 vs 3:13),
        // calibrar el desfase de entrada para que la letra vaya clavada con la voz
        const rawDurationDiff = targetDurationSec - best.itemDur;
        if (Number.isFinite(detectedIntroSec) && detectedIntroSec !== null) {
          const firstLyricTime = lines[0]?.timeSec || 0;
          const shift = detectedIntroSec - firstLyricTime;
          if (Math.abs(shift) >= 2.0 && Math.abs(shift) <= 75) {
            lines = lines.map(l => ({
              timeSec: +Math.max(0, l.timeSec + shift).toFixed(2),
              text: l.text
            }));
          }
        } else if (rawDurationDiff > 8 && rawDurationDiff < 85) {
          // Estimación conservadora mientras se analiza el audio si hay gran diferencia de duración
          const estShift = Math.round(rawDurationDiff * 0.62 * 10) / 10;
          lines = lines.map(l => ({
            timeSec: +Math.max(0, l.timeSec + estShift).toFixed(2),
            text: l.text
          }));
        }
        return lines;
      }

      const withPlain = candidates.find(item => item && item.plainLyrics);
      if (withPlain && withPlain.plainLyrics) {
        return this.buildFallbackSyncedLines(withPlain.plainLyrics, targetDurationSec, track);
      }

      return this.buildFallbackSyncedLines('', targetDurationSec, track);
    }

    async fetchLyricsForTrack(track, totalDurationSec = 195) {
      if (!track) return [];
      const key = this._makeKey(track);
      if (this.candidatesCache.has(key)) {
        const cands = this.candidatesCache.get(key);
        const lines = this._pickBestCandidateLines(cands, totalDurationSec, track);
        this.cache.set(key, lines);
        return lines;
      }
      if (this.inflight.has(key)) return this.inflight.get(key);

      const task = (async () => {
        const cleanTitle = this._cleanSearchTerm(track.title);
        const primaryArtist = this._extractPrimaryArtist(track.artist);
        const fullArtist = this._cleanSearchTerm(track.artist);

        const urlsToTry = [
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(primaryArtist)}`,
          `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${primaryArtist}`.trim())}`
        ];
        if (fullArtist && fullArtist.toLowerCase() !== primaryArtist.toLowerCase()) {
          urlsToTry.push(`https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(fullArtist)}`);
        }

        const collected = [];
        const seenIds = new Set();

        for (const qUrl of urlsToTry) {
          try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 3200);
            const resp = await fetch(qUrl, { signal: ctrl.signal });
            clearTimeout(tid);
            if (resp.ok) {
              const arr = await resp.json();
              if (Array.isArray(arr)) {
                for (const item of arr) {
                  if (item && !seenIds.has(item.id)) {
                    seenIds.add(item.id);
                    collected.push(item);
                  }
                }
              }
              if (collected.some(it => it && it.syncedLyrics && it.syncedLyrics.includes('['))) {
                break;
              }
            }
          } catch (_) {}
        }

        if (collected.length > 0) {
          this.candidatesCache.set(key, collected);
        }
        const bestLines = this._pickBestCandidateLines(collected, totalDurationSec, track);
        this.cache.set(key, bestLines);
        return bestLines;
      })();

      this.inflight.set(key, task);
      try {
        return await task;
      } finally {
        this.inflight.delete(key);
      }
    }

    /**
     * Cuando se conoce la duración real del archivo de audio completo (`fullAudio.duration`),
     * re-selecciona la versión LRC exacta de LRCLib y, si el audio proviene de un videoclip con intro
     * más larga que el LRC de estudio, detecta el inicio musical real para sincronizar la letra.
     */
    async recalibrateForActualAudio(track, actualDurationSec, audioBlob = null) {
      if (!track || !Number.isFinite(actualDurationSec) || actualDurationSec < 35) return;
      const key = this._makeKey(track);
      const cands = this.candidatesCache.get(key);
      if (!cands || cands.length === 0) return;

      let detectedIntroSec = null;
      const bestSynced = cands.filter(c => c && c.syncedLyrics && c.syncedLyrics.includes('['));
      const closestDurDiff = bestSynced.reduce((minDiff, c) => {
        const d = Math.abs((Number(c.duration) || actualDurationSec) - actualDurationSec);
        return Math.min(minDiff, d);
      }, 999);

      if (closestDurDiff > 6 && audioBlob && audioBlob.size >= 80000) {
        detectedIntroSec = await this._detectMusicalOnsetFromBlob(audioBlob, actualDurationSec).catch(() => null);
      }

      const recalibrated = this._pickBestCandidateLines(cands, actualDurationSec, track, detectedIntroSec);
      this.cache.set(key, recalibrated);
      if (this.currentTrackKey === key) {
        this.currentLyrics = recalibrated;
        this.activeLineIndex = -1;
        this.renderLinesToDom();
      }
    }

    async _detectMusicalOnsetFromBlob(blob, actualDurationSec) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        if (!window._lyricsAnalysisAudioCtx) {
          window._lyricsAnalysisAudioCtx = new AudioCtx();
        }
        const ctx = window._lyricsAnalysisAudioCtx;
        const ab = await blob.slice(0, Math.min(blob.size, 2500000)).arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(ab);
        const ch = audioBuf.getChannelData(0);
        const sr = audioBuf.sampleRate;
        const winSamples = Math.floor(sr * 0.25);
        const maxScanSec = Math.min(75, Math.floor(actualDurationSec * 0.35));
        const totalWindows = Math.min(Math.floor(ch.length / winSamples), maxScanSec * 4);
        if (totalWindows < 16) return null;

        const rmsArr = new Float32Array(totalWindows);
        let peakRms = 0;
        for (let w = 0; w < totalWindows; w++) {
          let sum = 0;
          const base = w * winSamples;
          for (let i = 0; i < winSamples; i += 4) {
            const s = ch[base + i] || 0;
            sum += s * s;
          }
          const rms = Math.sqrt(sum / (winSamples / 4));
          rmsArr[w] = rms;
          if (rms > peakRms) peakRms = rms;
        }
        if (peakRms < 0.01) return null;

        // Buscar el punto donde la energía musical sostenida supera el 32% del pico durante al menos 1.5s
        const thresh = peakRms * 0.32;
        for (let w = 4; w < totalWindows - 6; w++) {
          if (
            rmsArr[w] >= thresh &&
            rmsArr[w + 1] >= thresh * 0.85 &&
            rmsArr[w + 2] >= thresh * 0.85 &&
            rmsArr[w + 3] >= thresh * 0.85
          ) {
            return +(w * 0.25).toFixed(2);
          }
        }
      } catch (_) {}
      return null;
    }

    async loadAndRenderTrackLyrics(track, totalDurationSec = 195) {
      if (!track) return;
      const key = this._makeKey(track);
      this.currentTrackKey = key;
      this.activeLineIndex = -1;

      const box = document.getElementById('npKaraokeScrollBox');
      if (box && !this.cache.has(key)) {
        box.innerHTML = `<p class="np-karaoke-placeholder">Sincronizando letra karaoke...</p>`;
      }

      const lines = await this.fetchLyricsForTrack(track, totalDurationSec);
      if (this.currentTrackKey !== key) return;
      this.currentLyrics = lines;
      this.renderLinesToDom();
    }

    renderLinesToDom() {
      const box = document.getElementById('npKaraokeScrollBox');
      if (!box) return;
      if (!Array.isArray(this.currentLyrics) || this.currentLyrics.length === 0) {
        box.innerHTML = `<p class="np-karaoke-placeholder">Letra no disponible para esta pista.</p>`;
        return;
      }

      box.innerHTML = this.currentLyrics.map((line, idx) => `
        <div id="karaokeLine_${idx}" class="np-karaoke-line" onclick="window.DiscoverHomeApp.seekToKaraokeLine(${idx})">
          ${escapeHtmlSafe(line.text)}
        </div>
      `).join('');
    }

    syncTime(currentSec) {
      if (!Array.isArray(this.currentLyrics) || this.currentLyrics.length === 0) return;
      const adjSec = Math.max(0, Number(currentSec || 0) + (this.timeOffsetSec || 0));
      let activeIdx = 0;
      for (let i = 0; i < this.currentLyrics.length; i++) {
        if (adjSec + 0.15 >= this.currentLyrics[i].timeSec) {
          activeIdx = i;
        } else {
          break;
        }
      }
      if (activeIdx === this.activeLineIndex) return;
      this.activeLineIndex = activeIdx;

      const box = document.getElementById('npKaraokeScrollBox');
      if (!box) return;

      for (let i = 0; i < this.currentLyrics.length; i++) {
        const el = document.getElementById(`karaokeLine_${i}`);
        if (!el) continue;
        el.classList.toggle('active', i === activeIdx);
        el.classList.toggle('past', i < activeIdx);
      }

      const activeEl = document.getElementById(`karaokeLine_${activeIdx}`);
      if (activeEl && box.offsetParent !== null) {
        const targetScroll = activeEl.offsetTop - (box.clientHeight / 2) + (activeEl.clientHeight / 2);
        box.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    }
  }


  // =========================================================================
  // 4. DUAL-STREAM AUDIO ENGINE (BARRA COMPLETA DESDE SEGUNDO 0 + SINCRONIZACIÓN KARAOKE)
  // =========================================================================
  class DualStreamAudioEngine {
    constructor(graphService, dnaEngine, karaokeService) {
      this.graphService = graphService;
      this.dnaEngine = dnaEngine;
      this.karaokeService = karaokeService;

      this.previewAudio = new Audio();
      this.previewAudio.preload = 'auto';
      this.previewAudio.crossOrigin = 'anonymous';

      this.fullAudio = new Audio();
      this.fullAudio.preload = 'auto';

      this.activeSourceType = 'none'; // 'preview' | 'full'
      this.currentTrack = null;
      this.isPlayingFlag = false;
      this.isLoadingTrack = false;
      this.isCrossfading = false;
      this.fullTrackReady = false;
      this.fullTrackBlob = null;
      this.fullTrackObjectUrl = null;

      this.previewBaseOffsetSec = 0;
      this.pendingUserSeekSec = null;

      this.queue = [];
      this.queueIndex = -1;
      this.smartShuffleEnabled = false;
      this.wasPlayingBeforeGame = false;

      // Pre-fetch cache para las siguientes tarjetas del mazo (0ms swipe como TikTok)
      this.prewarmedPreviewMap = new Map();
      this.fullTrackInflightMap = new Map();

      this.listenTimerInterval = null;
      this.karaokeSyncInterval = null;
      this.listenedSecondsOnCurrent = 0;
      this._playRequestId = 0;

      this._bindAudioEvents();
      this._initMediaSession();
      this._initMiniPlayerSwipeDownGesture();
    }

    _getMasterVolume() {
      const isMuted = localStorage.getItem('beatstar_master_muted') === 'true';
      if (isMuted) return 0;
      const raw = parseFloat(localStorage.getItem('beatstar_master_volume'));
      return Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : 0.88;
    }

    isPlaying() {
      return Boolean(
        this.isPlayingFlag &&
        ((this.activeSourceType === 'preview' && !this.previewAudio.paused) ||
         (this.activeSourceType === 'full' && !this.fullAudio.paused))
      );
    }

    getActiveAudioElement() {
      return this.activeSourceType === 'full' ? this.fullAudio : this.previewAudio;
    }

    /**
     * Devuelve SIEMPRE la duración de la canción entera (nunca 30s) para que la barra completa
     * esté disponible desde el segundo 0.
     */
    getTrackFullDurationSec(track = this.currentTrack) {
      if (this.fullTrackReady && Number.isFinite(this.fullAudio.duration) && this.fullAudio.duration > 38) {
        return this.fullAudio.duration;
      }
      if (this.activeSourceType === 'full' && Number.isFinite(this.fullAudio.duration) && this.fullAudio.duration > 38) {
        return this.fullAudio.duration;
      }
      const explicitDur = Number(track?.durationSec || track?.duration || 0);
      if (explicitDur > 38) return explicitDur;
      const hash = String(track?.id || track?.title || 'song').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return 185 + (hash % 45);
    }

    getChorusOffsetSec(track = this.currentTrack, fullDur = null) {
      const dur = fullDur || this.getTrackFullDurationSec(track);
      if (Number.isFinite(track?.chorusSec) && track.chorusSec > 10 && track.chorusSec < dur - 25) {
        return track.chorusSec;
      }
      return Math.round(Math.max(28, Math.min(62, dur * 0.27)));
    }

    getCurrentSongTimeSec() {
      if (this.pendingUserSeekSec !== null && !this.fullTrackReady && this.activeSourceType !== 'full') {
        return this.pendingUserSeekSec;
      }
      if (this.activeSourceType === 'full') {
        return Number(this.fullAudio.currentTime) || 0;
      }
      if (this.activeSourceType === 'preview') {
        const fullDur = this.getTrackFullDurationSec(this.currentTrack);
        return Math.min(fullDur - 1, this.previewBaseOffsetSec + (Number(this.previewAudio.currentTime) || 0));
      }
      return this.previewBaseOffsetSec || 0;
    }

    _bindAudioEvents() {
      const onTimeUpdate = () => {
        if (!this.currentTrack) return;
        if (typeof window.pauseMenuAmbientMusic === 'function') {
          window.pauseMenuAmbientMusic();
        }
        const fullDur = this.getTrackFullDurationSec(this.currentTrack);
        const curSongSec = this.getCurrentSongTimeSec();

        // Si el audio completo ya está descargado mientras suena el preview, hacer handoff inmediato
        if (this.activeSourceType === 'preview' && this.fullTrackReady && !this.isCrossfading) {
          const targetSec = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : 0;
          this.pendingUserSeekSec = null;
          this._performTransparentHandoffToFullTrack(targetSec);
        }

        this._updatePlayerProgressUI(curSongSec, fullDur);
        this._updateMediaSessionPosition(curSongSec, fullDur);
        if (this.karaokeService) {
          this.karaokeService.syncTime(curSongSec);
        }
      };

      this.previewAudio.addEventListener('timeupdate', () => {
        if (this.activeSourceType === 'preview') onTimeUpdate();
      });
      this.fullAudio.addEventListener('timeupdate', () => {
        if (this.activeSourceType === 'full') onTimeUpdate();
      });

      // En cuanto fullAudio conoce su duración real, recalibrar la letra LRC para que vaya 100% sincronizada
      this.fullAudio.addEventListener('loadedmetadata', () => {
        if (!this.currentTrack) return;
        const realDur = Number(this.fullAudio.duration);
        if (Number.isFinite(realDur) && realDur > 38) {
          this.currentTrack.durationSec = realDur;
          this._updatePlayerProgressUI(this.getCurrentSongTimeSec(), realDur);
          if (this.karaokeService) {
            this.karaokeService.recalibrateForActualAudio(this.currentTrack, realDur, this.fullTrackBlob).catch(() => {});
          }
        }
      });

      // Ticker de alta precisión (100ms) para que el resaltado de sílabas/líneas de Karaoke no tenga retraso
      if (this.karaokeSyncInterval) clearInterval(this.karaokeSyncInterval);
      this.karaokeSyncInterval = setInterval(() => {
        if (!this.isPlaying() || !this.currentTrack || !this.karaokeService) return;
        this.karaokeService.syncTime(this.getCurrentSongTimeSec());
      }, 100);

      this.previewAudio.addEventListener('ended', () => {
        if (this.activeSourceType !== 'preview') return;
        if (this.fullTrackReady) {
          const targetSec = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : 0;
          this.pendingUserSeekSec = null;
          this._performTransparentHandoffToFullTrack(targetSec);
        } else {
          try {
            this.previewAudio.currentTime = 0;
            this.previewAudio.play().catch(() => {});
          } catch (_) {}
        }
      });

      this.fullAudio.addEventListener('ended', () => {
        if (this.activeSourceType === 'full') {
          this.nextTrack();
        }
      });
    }

    _startListenTracker() {
      if (this.listenTimerInterval) clearInterval(this.listenTimerInterval);
      this.listenedSecondsOnCurrent = 0;
      this.listenTimerInterval = setInterval(() => {
        if (!this.isPlaying() || !this.currentTrack) return;
        this.listenedSecondsOnCurrent += 1;
        if (this.listenedSecondsOnCurrent === 25 && this.dnaEngine) {
          this.dnaEngine.recordLongListen(this.currentTrack);
        }
      }, 1000);
    }

    /**
     * Obtiene la URL directa de streaming completo para pistas del catálogo Top (90 canciones CDN)
     * o Comunidad, permitiendo arrancar el audio completo desde 0:00 al instante y 100% sincronizado con LRC.
     */
    _getDirectFullStreamUrl(track) {
      if (!track) return '';
      if (track.audio_url || String(track.id || '').startsWith('top_') || track.is_top_song) {
        const rawId = String(track.raw_id || track.id || '').replace(/^top_/, '');
        const audioFilename = track.audio_url || `${rawId}.mp3`;
        const cUrl = `https://github.com/Bruala33/renacer/releases/download/8/${audioFilename}`;
        return `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(cUrl)}`;
      }
      if (String(track.id || '').startsWith('comm_')) {
        const folder = String(track.id).replace(/^comm_/, '');
        const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
        return `${baseUrl}/songs/${folder}/audio.mp3`;
      }
      return '';
    }

    /**
     * Reproduce una canción mostrando desde el segundo 0 la barra de duración entera,
     * sincronizando exactamente con las letras de Karaoke y silenciando de inmediato la música del menú.
     */
    async playTrack(track, options = {}) {
      if (!track) return false;
      const reqId = ++this._playRequestId;
      this.isLoadingTrack = true;
      this.currentTrack = track;
      this.fullTrackReady = false;
      this.fullTrackBlob = null;
      this.isCrossfading = false;
      this.pendingUserSeekSec = null;

      // Silenciar de forma inmediata y estricta cualquier música del menú
      if (typeof window.pauseMenuAmbientMusic === 'function') {
        window.pauseMenuAmbientMusic();
      }
      if (typeof window.stopPreviewCandidateAudio === 'function') {
        window.stopPreviewCandidateAudio(false);
      }

      this._stopBothChannelsImmediate();

      if (options.syncQueue !== false) {
        const idxInQ = this.queue.findIndex(t => t && String(t.id) === String(track.id));
        if (idxInQ !== -1) {
          this.queueIndex = idxInQ;
        } else {
          this.queue.unshift(track);
          this.queueIndex = 0;
        }
      }

      const fullDur = this.getTrackFullDurationSec(track);
      const desiredStartSec = typeof options.startOffsetSec === 'number'
        ? options.startOffsetSec
        : 0;

      this.previewBaseOffsetSec = desiredStartSec;

      this._updatePlayerMetadataUI(track);
      this._updatePlayerProgressUI(desiredStartSec, fullDur);
      this._updateMediaSessionMetadata(track);

      if (this.karaokeService) {
        this.karaokeService.loadAndRenderTrackLyrics(track, fullDur).catch(() => {});
      }

      // 1. Si ya tenemos el Blob completo en caché, reproducir directamente el audio completo desde 0:00
      const cachedFullBlob = this._getCachedFullBlobForTrack(track);
      if (cachedFullBlob && cachedFullBlob.size >= 80000) {
        this.fullTrackBlob = cachedFullBlob;
        this.fullTrackReady = true;
        this._setLoadingHintVisible(false);
        const startedFull = await this._startChannelWithFadeIn(this.fullAudio, cachedFullBlob, 'full', reqId, desiredStartSec, 240);
        this.isLoadingTrack = false;
        if (startedFull) {
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          return true;
        }
      }

      // 2. Si es una canción Top o de Comunidad con URL de streaming directo, reproducir el archivo completo
      // directamente desde 0:00 (100% sincronizado con Karaoke desde el primer segundo, sin desfase de preview de 30s)
      const directStreamUrl = this._getDirectFullStreamUrl(track);
      if (directStreamUrl) {
        this._setLoadingHintVisible(false);
        const startedDirectFull = await this._startChannelWithFadeIn(this.fullAudio, directStreamUrl, 'full', reqId, desiredStartSec, 240);
        if (startedDirectFull) {
          this.fullTrackReady = true;
          this.isLoadingTrack = false;
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          // Pre-cargar también el Blob en segundo plano para que al pulsar "Jugar al Piano" sea instantáneo
          this.preloadFullTrackInBackground(track).then((blob) => {
            if (reqId === this._playRequestId && blob && blob.size >= 60000) {
              this.fullTrackBlob = blob;
            }
          }).catch(() => {});
          return true;
        }
      }

      // 3. Para canciones externas (YouTube / iTunes): enriquecer duración de estudio oficial primero
      let previewUrl = track.previewUrl || track.preview_url || '';
      const prewarmed = this.prewarmedPreviewMap.get(String(track.id));
      if (prewarmed && prewarmed.previewUrl) {
        previewUrl = prewarmed.previewUrl;
      }

      if (!previewUrl || String(previewUrl).startsWith('yt_full://') || !track.durationSec) {
        const enriched = await this.graphService.enrichTrackMetadata(track).catch(() => null);
        if (reqId !== this._playRequestId) return false;
        if (enriched && enriched.previewUrl && !previewUrl) {
          previewUrl = enriched.previewUrl;
        }
        if (enriched && enriched.durationSec && enriched.durationSec > 40) {
          track.durationSec = enriched.durationSec;
          this._updatePlayerProgressUI(desiredStartSec, enriched.durationSec);
        }
      }

      let previewStarted = false;
      if (previewUrl && /^https?:\/\//i.test(previewUrl)) {
        previewStarted = await this._startChannelWithFadeIn(this.previewAudio, previewUrl, 'preview', reqId, 0, 220);
        if (previewStarted) {
          this.isLoadingTrack = false;
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
        }
      }

      // 4. Descargar en paralelo el archivo completo de estudio y hacer handoff al audio completo sincronizado
      this.preloadFullTrackInBackground(track).then(async (blob) => {
        if (reqId !== this._playRequestId || !blob || blob.size < 60000) {
          if (reqId === this._playRequestId) {
            this.isLoadingTrack = false;
            this._setLoadingHintVisible(false);
          }
          return;
        }
        this.fullTrackBlob = blob;
        this.fullTrackReady = true;

        if (this.fullTrackObjectUrl) {
          try { URL.revokeObjectURL(this.fullTrackObjectUrl); } catch (_) {}
        }
        this.fullTrackObjectUrl = URL.createObjectURL(blob);
        this.fullAudio.src = this.fullTrackObjectUrl;
        this.fullAudio.load();

        this._setLoadingHintVisible(false);
        this._updatePlayerMetadataUI(track);

        if (this.isPlayingFlag && this.activeSourceType === 'preview') {
          const targetSec = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : 0;
          this.pendingUserSeekSec = null;
          await this._performTransparentHandoffToFullTrack(targetSec);
        } else if (!this.isPlayingFlag || this.activeSourceType === 'none') {
          const targetSec = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : desiredStartSec;
          this.pendingUserSeekSec = null;
          const ok = await this._startChannelWithFadeIn(this.fullAudio, blob, 'full', reqId, targetSec, 240);
          this.isLoadingTrack = false;
          if (ok) {
            this._updatePlayerMetadataUI(track);
            this._startListenTracker();
          }
        }
      }).catch(() => {
        if (reqId === this._playRequestId) {
          this.isLoadingTrack = false;
          this._setLoadingHintVisible(false);
        }
      });

      return previewStarted;
    }

    async _startChannelWithFadeIn(audioEl, srcOrBlob, channelType, reqId, startSec = 0, fadeInMs = 260) {
      if (reqId !== this._playRequestId) return false;
      try {
        if (typeof window.pauseMenuAmbientMusic === 'function') {
          window.pauseMenuAmbientMusic();
        }
        if (srcOrBlob instanceof Blob) {
          if (this.fullTrackObjectUrl) {
            try { URL.revokeObjectURL(this.fullTrackObjectUrl); } catch (_) {}
          }
          this.fullTrackObjectUrl = URL.createObjectURL(srcOrBlob);
          audioEl.src = this.fullTrackObjectUrl;
        } else if (audioEl.src !== srcOrBlob) {
          audioEl.src = srcOrBlob;
        }

        const targetVol = this._getMasterVolume();
        audioEl.volume = 0.01;

        if (startSec > 0) {
          const applySeek = () => {
            try {
              const maxDur = Number(audioEl.duration) || 9999;
              audioEl.currentTime = Math.min(startSec, Math.max(0, maxDur - 2));
            } catch (_) {}
          };
          if (audioEl.readyState >= 1) {
            applySeek();
          } else {
            audioEl.addEventListener('loadedmetadata', applySeek, { once: true });
          }
        } else {
          try { audioEl.currentTime = 0; } catch (_) {}
        }

        await audioEl.play();
        if (reqId !== this._playRequestId) {
          audioEl.pause();
          return false;
        }

        if (typeof window.pauseMenuAmbientMusic === 'function') {
          window.pauseMenuAmbientMusic();
        }

        this.activeSourceType = channelType;
        this.isPlayingFlag = true;
        this._syncPlayPauseIcons(true);

        const steps = 10;
        const stepMs = Math.max(15, Math.round(fadeInMs / steps));
        let curStep = 0;
        const fadeTimer = setInterval(() => {
          curStep++;
          if (reqId !== this._playRequestId || audioEl.paused) {
            clearInterval(fadeTimer);
            return;
          }
          const ratio = Math.min(1, curStep / steps);
          audioEl.volume = Math.min(1, targetVol * ratio);
          if (curStep >= steps) clearInterval(fadeTimer);
        }, stepMs);

        return true;
      } catch (_) {
        return false;
      }
    }

    async _performTransparentHandoffToFullTrack(targetPositionSec = 0) {
      if (this.isCrossfading || !this.fullTrackReady || !this.fullAudio.src) return;
      this.isCrossfading = true;
      const reqId = this._playRequestId;
      const masterVol = this._getMasterVolume();

      try {
        if (typeof window.pauseMenuAmbientMusic === 'function') {
          window.pauseMenuAmbientMusic();
        }
        const fullDur = this.getTrackFullDurationSec(this.currentTrack);
        const safeSeek = Math.min(Math.max(0, targetPositionSec), Math.max(0, fullDur - 4));
        const applyFullSeek = () => {
          try { this.fullAudio.currentTime = safeSeek; } catch (_) {}
        };
        if (this.fullAudio.readyState >= 1) {
          applyFullSeek();
        } else {
          this.fullAudio.addEventListener('loadedmetadata', applyFullSeek, { once: true });
        }

        this.fullAudio.volume = 0.01;
        await this.fullAudio.play();

        const steps = 12;
        const stepMs = 30;
        let step = 0;
        const xfTimer = setInterval(() => {
          step++;
          if (reqId !== this._playRequestId) {
            clearInterval(xfTimer);
            return;
          }
          const t = Math.min(1, step / steps);
          const angle = t * (Math.PI / 2);
          const gainPreview = Math.cos(angle) * masterVol;
          const gainFull = Math.sin(angle) * masterVol;

          try { this.previewAudio.volume = Math.max(0, Math.min(1, gainPreview)); } catch (_) {}
          try { this.fullAudio.volume = Math.max(0, Math.min(1, gainFull)); } catch (_) {}

          if (step >= steps) {
            clearInterval(xfTimer);
            try { this.previewAudio.pause(); } catch (_) {}
            this.activeSourceType = 'full';
            this.isCrossfading = false;
            this._setLoadingHintVisible(false);
            if (this.currentTrack) {
              this._updatePlayerMetadataUI(this.currentTrack);
            }
          }
        }, stepMs);
      } catch (_) {
        this.isCrossfading = false;
      }
    }

    _getCachedFullBlobForTrack(track) {
      if (!track || !window._fullTrackBlobCache) return null;
      const id = String(track.id || '');
      const vid = track.videoId ? `yt_${track.videoId}` : '';
      const normKey = typeof window.normalizeSearchText === 'function'
        ? `${window.normalizeSearchText(track.title)}__${window.normalizeSearchText(track.artist)}`
        : '';
      return (
        (id && window._fullTrackBlobCache.get(id)) ||
        (vid && window._fullTrackBlobCache.get(vid)) ||
        (normKey && window._fullTrackBlobCache.get(normKey)) ||
        null
      );
    }

    _storeFullBlobInGlobalCache(track, blob) {
      if (!track || !blob || blob.size < 60000) return;
      if (!window._fullTrackBlobCache) window._fullTrackBlobCache = new Map();
      const id = String(track.id || '');
      if (id) window._fullTrackBlobCache.set(id, blob);
      if (track.raw_id) window._fullTrackBlobCache.set(`top_${track.raw_id}`, blob);
      if (track.videoId) window._fullTrackBlobCache.set(`yt_${track.videoId}`, blob);
      if (typeof window.normalizeSearchText === 'function') {
        const normKey = `${window.normalizeSearchText(track.title)}__${window.normalizeSearchText(track.artist)}`;
        window._fullTrackBlobCache.set(normKey, blob);
      }
    }

    async preloadFullTrackInBackground(track) {
      if (!track) return null;
      const existing = this._getCachedFullBlobForTrack(track);
      if (existing && existing.size >= 80000) return existing;

      const trackKey = String(track.id || `${track.title}_${track.artist}`);
      if (this.fullTrackInflightMap.has(trackKey)) {
        return this.fullTrackInflightMap.get(trackKey);
      }

      const task = (async () => {
        try {
          if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getChart === 'function') {
            const rawId = String(track.id || '').replace(/^top_/, '');
            const cachedChart = await window.IndexedDBStorage.getChart(track.id).catch(() => null) ||
                                await window.IndexedDBStorage.getChart(`top_${rawId}`).catch(() => null);
            if (cachedChart && cachedChart.audioBlob && cachedChart.audioBlob.size >= 80000) {
              this._storeFullBlobInGlobalCache(track, cachedChart.audioBlob);
              return cachedChart.audioBlob;
            }
          }

          const isTop = Boolean(track.audio_url || String(track.id || '').startsWith('top_') || track.is_top_song);
          if (isTop) {
            const rawId = String(track.raw_id || track.id || '').replace(/^top_/, '');
            const audioFilename = track.audio_url || `${rawId}.mp3`;
            const myWorker = (u) => `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(u)}`;
            const preferredTags = ['8', '3'];
            for (const tag of preferredTags) {
              const cUrl = `https://github.com/Bruala33/renacer/releases/download/${tag}/${audioFilename}`;
              try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 3500);
                const resp = await fetch(myWorker(cUrl), { signal: ctrl.signal });
                clearTimeout(tid);
                if (resp.ok) {
                  const blob = await resp.blob();
                  if (blob && blob.size >= 60000) {
                    this._storeFullBlobInGlobalCache(track, blob);
                    return blob;
                  }
                }
              } catch (_) {}
            }
          }

          if (String(track.id || '').startsWith('comm_')) {
            const folder = String(track.id).replace(/^comm_/, '');
            const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
            for (const path of [`${baseUrl}/songs/${folder}/audio.mp3`, `./songs/comm_${folder}/audio.mp3`, `./songs/${folder}/audio.mp3`]) {
              try {
                const resp = await fetch(path);
                if (resp.ok) {
                  const blob = await resp.blob();
                  if (blob && blob.size >= 60000) {
                    this._storeFullBlobInGlobalCache(track, blob);
                    return blob;
                  }
                }
              } catch (_) {}
            }
          }

          if (typeof window.extractSongAudioMultiSource === 'function') {
            // Si tenemos la duración de estudio vía iTunes, priorizar el audio oficial ("Topic" / "Audio") frente a videoclips largos con intro actuada
            const expectedStudioDur = Number(track.durationSec) || 0;
            const preferredCand = {
              title: track.title,
              artist: track.artist,
              thumbnail: track.thumbnail || '',
              durationSec: expectedStudioDur,
              videoId: expectedStudioDur > 40 ? '' : (track.videoId || '')
            };
            const extracted = await window.extractSongAudioMultiSource(track.title, track.artist, track.thumbnail || '', null, preferredCand);
            if (extracted && extracted.blob && extracted.blob.size >= 30000) {
              this._storeFullBlobInGlobalCache(track, extracted.blob);
              return extracted.blob;
            }
          }
        } catch (_) {}
        return null;
      })();

      this.fullTrackInflightMap.set(trackKey, task);
      try {
        return await task;
      } finally {
        this.fullTrackInflightMap.delete(trackKey);
      }
    }

    /**
     * Pre-carga agresivamente las próximas 4 canciones (portada HD, preview, audio completo y letra karaoke)
     * para que el paso entre tarjetas y la barra entera vayan instantáneos.
     */
    async prewarmUpcomingCards(tracksSlice = []) {
      if (!Array.isArray(tracksSlice) || tracksSlice.length === 0) return;
      const nextCards = tracksSlice.slice(0, 4);

      for (let i = 0; i < nextCards.length; i++) {
        const tr = nextCards[i];
        if (!tr || !tr.id) continue;
        const idStr = String(tr.id);

        this.graphService.enrichTrackMetadata(tr).then((meta) => {
          const artUrl = (meta && meta.artworkUrl600) || tr.artworkUrl600 || tr.thumbnail || tr.cover_url;
          if (artUrl && /^https?:\/\//i.test(artUrl)) {
            tr.artworkUrl600 = artUrl;
            tr.thumbnail = artUrl;
            tr.cover_url = artUrl;
            const img = new Image();
            img.src = artUrl;
            const nextImgEl = document.getElementById('crateNextCoverImg');
            if (nextImgEl && window.DiscoverHomeApp && window.DiscoverHomeApp.deck[window.DiscoverHomeApp.deckIndex + 1]?.id === tr.id) {
              nextImgEl.src = artUrl;
            }
          }
          const prevUrl = (meta && meta.previewUrl) || tr.previewUrl || tr.preview_url;
          if (prevUrl && /^https?:\/\//i.test(prevUrl) && !this.prewarmedPreviewMap.has(idStr)) {
            if (this.prewarmedPreviewMap.size >= 12) {
              const oldest = this.prewarmedPreviewMap.keys().next().value;
              if (oldest) this.prewarmedPreviewMap.delete(oldest);
            }
            const preAudio = new Audio();
            preAudio.preload = 'auto';
            preAudio.src = prevUrl;
            preAudio.load();
            this.prewarmedPreviewMap.set(idStr, {
              audioEl: preAudio,
              previewUrl: prevUrl,
              artworkUrl600: artUrl
            });
          }
        }).catch(() => {});

        // Pre-cargar también el audio completo de las próximas 2 tarjetas y sus letras
        if (i <= 1) {
          setTimeout(() => {
            if (!window.isGameLoadingOrActive) {
              this.preloadFullTrackInBackground(tr).catch(() => {});
              if (this.karaokeService) {
                this.karaokeService.fetchLyricsForTrack(tr, this.getTrackFullDurationSec(tr)).catch(() => {});
              }
            }
          }, 150 + i * 350);
        }
      }
    }

    togglePlayPause() {
      if (!this.currentTrack) {
        if (this.queue.length > 0) {
          this.playTrack(this.queue[0]);
        }
        return;
      }
      const activeEl = this.getActiveAudioElement();
      if (!activeEl) return;

      if (this.isPlaying()) {
        activeEl.pause();
        this.isPlayingFlag = false;
        this._syncPlayPauseIcons(false);
      } else {
        if (typeof window.pauseMenuAmbientMusic === 'function') {
          window.pauseMenuAmbientMusic();
        }
        activeEl.volume = this._getMasterVolume();
        activeEl.play().then(() => {
          this.isPlayingFlag = true;
          this._syncPlayPauseIcons(true);
        }).catch(() => {});
      }
    }

    /**
     * Permite moverse por TODA la barra de la canción desde el segundo 0.
     * Si el audio completo ya está cargado, salta al instante. Si aún está terminando de cargar,
     * posiciona la barra ahí, muestra "Cargando..." y salta en cuanto termina el buffer.
     */
    async seekToRatio(ratio) {
      const clamped = Math.max(0, Math.min(0.995, Number(ratio) || 0));
      const fullDur = this.getTrackFullDurationSec(this.currentTrack);
      const targetSec = clamped * fullDur;
      await this.seekToSeconds(targetSec);
    }

    async seekToSeconds(targetSec) {
      const fullDur = this.getTrackFullDurationSec(this.currentTrack);
      const safeTarget = Math.max(0, Math.min(fullDur - 1, Number(targetSec) || 0));

      this._updatePlayerProgressUI(safeTarget, fullDur);
      if (this.karaokeService) {
        this.karaokeService.syncTime(safeTarget);
      }

      if (this.activeSourceType === 'full' && this.fullAudio.src) {
        try {
          this.fullAudio.currentTime = safeTarget;
        } catch (_) {}
        return;
      }

      if (this.fullTrackReady && this.fullAudio.src) {
        this.pendingUserSeekSec = null;
        await this._performTransparentHandoffToFullTrack(safeTarget);
        return;
      }

      // Si el usuario mueve la barra completa mientras aún se está descargando el audio entero:
      this.pendingUserSeekSec = safeTarget;
      this.previewBaseOffsetSec = safeTarget;
      this._setLoadingHintVisible(true);

      // Si el punto elegido cae cerca del estribillo que tiene el preview, ajustar también el preview mientras termina de cargar
      const chorusSec = this.getChorusOffsetSec(this.currentTrack, fullDur);
      const diffFromChorus = safeTarget - chorusSec;
      if (this.activeSourceType === 'preview' && diffFromChorus >= -4 && diffFromChorus <= 24) {
        try {
          this.previewAudio.currentTime = Math.max(0, Math.min(28, 3.5 + diffFromChorus));
        } catch (_) {}
      }
    }

    _setLoadingHintVisible(visible) {
      const hint = document.getElementById('miniPlayerLoadingHint');
      if (hint) {
        hint.classList.toggle('hidden', !visible);
      }
    }

    _updateChorusMarkersUI(chorusSec, fullDur) {
      const pct = Math.max(8, Math.min(85, (chorusSec / Math.max(1, fullDur)) * 100)).toFixed(1) + '%';
      const miniMarker = document.getElementById('miniPlayerChorusMarker');
      if (miniMarker) miniMarker.style.left = pct;
      const npMarker = document.getElementById('npChorusMarkerTick');
      if (npMarker) npMarker.style.left = pct;
    }

    /**
     * Cierra el mini-reproductor al deslizarlo hacia abajo y detiene la reproducción
     */
    closeMiniPlayerAndStop() {
      this._stopBothChannelsImmediate();
      this.isLoadingTrack = false;
      this.pendingUserSeekSec = null;
      this._setLoadingHintVisible(false);
      const miniEl = document.getElementById('spotifyMiniPlayer');
      if (miniEl) {
        miniEl.style.transform = '';
        miniEl.classList.add('hidden-player');
      }
      const modalEl = document.getElementById('nowPlayingTurntableModal');
      if (modalEl) modalEl.classList.remove('open');
    }

    _initMiniPlayerSwipeDownGesture() {
      const attach = () => {
        const miniEl = document.getElementById('spotifyMiniPlayer');
        if (!miniEl || miniEl._swipeDownBound) return;
        miniEl._swipeDownBound = true;

        let startY = 0;
        let startX = 0;
        let deltaY = 0;
        let tracking = false;

        miniEl.addEventListener('pointerdown', (e) => {
          if (e.target.closest('input[type="range"]') || e.target.closest('button')) return;
          tracking = true;
          startY = e.clientY ?? 0;
          startX = e.clientX ?? 0;
          deltaY = 0;
          miniEl.classList.add('swiping-down');
        });

        window.addEventListener('pointermove', (e) => {
          if (!tracking) return;
          const dy = (e.clientY ?? startY) - startY;
          const dx = Math.abs((e.clientX ?? startX) - startX);
          if (dy > 4 && dy > dx) {
            deltaY = dy;
            miniEl.style.transform = `translate3d(0, ${Math.min(110, dy).toFixed(0)}px, 0)`;
          }
        }, { passive: true });

        const finishSwipe = () => {
          if (!tracking) return;
          tracking = false;
          miniEl.classList.remove('swiping-down');
          if (deltaY > 38) {
            this.closeMiniPlayerAndStop();
          } else {
            miniEl.style.transform = '';
          }
          deltaY = 0;
        };

        window.addEventListener('pointerup', finishSwipe);
        window.addEventListener('pointercancel', finishSwipe);
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attach);
      } else {
        setTimeout(attach, 50);
      }
    }

    nextTrack() {
      if (this.queue.length === 0) return;
      if (this.smartShuffleEnabled && this.queue.length > 2) {
        const candidates = this.queue.filter((_, idx) => idx !== this.queueIndex);
        candidates.sort((a, b) => this.dnaEngine.scoreTrackForRecommendation(b) - this.dnaEngine.scoreTrackForRecommendation(a));
        const picked = candidates[0] || this.queue[(this.queueIndex + 1) % this.queue.length];
        this.queueIndex = this.queue.indexOf(picked);
      } else {
        this.queueIndex = (this.queueIndex + 1) % this.queue.length;
      }
      const next = this.queue[this.queueIndex];
      if (next) {
        this.playTrack(next, { syncQueue: false });
        this._renderQueueListInModal();
      }
    }

    prevTrack() {
      if (this.queue.length === 0) return;
      if (this.getCurrentSongTimeSec() > 6) {
        this.seekToSeconds(0);
        return;
      }
      this.queueIndex = (this.queueIndex - 1 + this.queue.length) % this.queue.length;
      const prev = this.queue[this.queueIndex];
      if (prev) {
        this.playTrack(prev, { syncQueue: false });
        this._renderQueueListInModal();
      }
    }

    enqueueTrack(track, playImmediately = false) {
      if (!track) return;
      const existsIdx = this.queue.findIndex(t => t && String(t.id) === String(track.id));
      if (existsIdx === -1) {
        this.queue.push(track);
      }
      if (playImmediately || !this.currentTrack) {
        this.queueIndex = existsIdx !== -1 ? existsIdx : this.queue.length - 1;
        this.playTrack(track, { syncQueue: false });
      }
      this._renderQueueListInModal();
    }

    loadQueueAndPlay(tracksArray, startIndex = 0, contextLabel = '') {
      if (!Array.isArray(tracksArray) || tracksArray.length === 0) return;
      this.queue = [...tracksArray];
      this.queueIndex = Math.max(0, Math.min(tracksArray.length - 1, startIndex));
      const first = this.queue[this.queueIndex];
      this.playTrack(first, { syncQueue: false });
      this.prewarmUpcomingCards(this.queue.slice(this.queueIndex + 1, this.queueIndex + 5));
      this._renderQueueListInModal();
      if (contextLabel && typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(`Reproduciendo: ${contextLabel}`);
      }
    }

    pauseForGameplayWithFade(fadeOutMs = 200) {
      this.wasPlayingBeforeGame = this.isPlaying();
      const miniEl = document.getElementById('spotifyMiniPlayer');
      if (miniEl) miniEl.classList.add('hidden-player');
      const modalEl = document.getElementById('nowPlayingTurntableModal');
      if (modalEl) modalEl.classList.remove('open');

      const activeEl = this.getActiveAudioElement();
      if (!activeEl || activeEl.paused) {
        this._stopBothChannelsImmediate();
        return;
      }

      const startVol = activeEl.volume || 0.8;
      const steps = 8;
      const stepTime = Math.max(15, Math.round(fadeOutMs / steps));
      let s = 0;
      const timer = setInterval(() => {
        s++;
        const ratio = Math.max(0, 1 - s / steps);
        try { activeEl.volume = startVol * ratio; } catch (_) {}
        if (s >= steps) {
          clearInterval(timer);
          try { this.previewAudio.pause(); } catch (_) {}
          try { this.fullAudio.pause(); } catch (_) {}
          this.isPlayingFlag = false;
          this._syncPlayPauseIcons(false);
        }
      }, stepTime);
    }

    restoreAfterGameplay() {
      if (!this.currentTrack) return;
      const miniEl = document.getElementById('spotifyMiniPlayer');
      if (miniEl) miniEl.classList.remove('hidden-player');

      if (this.wasPlayingBeforeGame && !window.isEditorTabOpen && !window.isCasinoActive) {
        this.wasPlayingBeforeGame = false;
        const activeEl = this.getActiveAudioElement();
        if (activeEl) {
          if (typeof window.pauseMenuAmbientMusic === 'function') {
            window.pauseMenuAmbientMusic();
          }
          const targetVol = this._getMasterVolume();
          activeEl.volume = 0.02;
          activeEl.play().then(() => {
            this.isPlayingFlag = true;
            this._syncPlayPauseIcons(true);
            let step = 0;
            const t = setInterval(() => {
              step++;
              activeEl.volume = Math.min(1, targetVol * (step / 10));
              if (step >= 10) clearInterval(t);
            }, 30);
          }).catch(() => {});
        }
      }
    }

    _stopBothChannelsImmediate() {
      try { this.previewAudio.pause(); } catch (_) {}
      try { this.fullAudio.pause(); } catch (_) {}
      this.isPlayingFlag = false;
      this._syncPlayPauseIcons(false);
    }

    _initMediaSession() {
      if (!('mediaSession' in navigator)) return;
      try {
        navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
        navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.prevTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details && Number.isFinite(details.seekTime)) {
            this.seekToSeconds(details.seekTime);
          }
        });
      } catch (_) {}
    }

    _updateMediaSessionMetadata(track) {
      if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined' || !track) return;
      try {
        const cover = getBestTrackCover(track);
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title || 'Piano Community',
          artist: track.artist || 'Piano Community',
          album: track.album || 'Piano Community',
          artwork: [
            { src: cover, sizes: '300x300', type: 'image/jpeg' },
            { src: cover, sizes: '600x600', type: 'image/jpeg' }
          ]
        });
      } catch (_) {}
    }

    _updateMediaSessionPosition(cur, dur) {
      if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
      if (!Number.isFinite(dur) || dur <= 0) return;
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(1, dur),
          playbackRate: 1.0,
          position: Math.max(0, Math.min(dur, cur))
        });
      } catch (_) {}
    }

    _formatTime(sec) {
      const s = Math.max(0, Math.floor(Number(sec) || 0));
      const m = Math.floor(s / 60);
      const r = String(s % 60).padStart(2, '0');
      return `${m}:${r}`;
    }

    _updatePlayerMetadataUI(track) {
      if (!track) return;
      const miniEl = document.getElementById('spotifyMiniPlayer');
      if (miniEl && !window.isGameLoadingOrActive) {
        miniEl.style.transform = '';
        miniEl.classList.remove('hidden-player');
      }

      const cover = getBestTrackCover(track);
      const isFav = (typeof window.favoriteIdsSet !== 'undefined' && window.favoriteIdsSet.has(track.id)) ||
                    this.dnaEngine.likes.has(String(track.id));

      const miniCover = document.getElementById('miniPlayerCoverImg');
      if (miniCover) miniCover.src = cover;
      const miniTitle = document.getElementById('miniPlayerTitle');
      if (miniTitle) miniTitle.textContent = track.title || 'Canción';
      const miniArtist = document.getElementById('miniPlayerArtist');
      if (miniArtist) miniArtist.textContent = track.artist || 'Artista';
      const miniLikeBtn = document.getElementById('miniPlayerLikeBtn');
      if (miniLikeBtn) {
        miniLikeBtn.innerHTML = isFav ? SVG_ICONS.heartFilled : SVG_ICONS.heartOutline;
        miniLikeBtn.classList.toggle('liked', isFav);
      }

      const npCover = document.getElementById('npTurntableCoverImg');
      if (npCover) npCover.src = cover;
      const npTitle = document.getElementById('npTrackTitle') || document.getElementById('npTurntableTitle');
      if (npTitle) npTitle.textContent = track.title || 'Canción';
      const npArtist = document.getElementById('npTrackArtist') || document.getElementById('npTurntableArtist');
      if (npArtist) npArtist.textContent = track.artist || 'Artista';
      const npLikeBtn = document.getElementById('npLikeBtn');
      if (npLikeBtn) {
        npLikeBtn.innerHTML = isFav ? SVG_ICONS.heartFilled : SVG_ICONS.heartOutline;
        npLikeBtn.classList.toggle('liked', isFav);
      }
    }

    _updatePlayerProgressUI(curSec, durSec) {
      const safeDur = Math.max(1, Number(durSec) || 195);
      const ratio = Math.max(0, Math.min(1, curSec / safeDur));
      const pct = (ratio * 100).toFixed(1) + '%';

      const miniFill = document.getElementById('miniPlayerProgressFill');
      if (miniFill) miniFill.style.width = pct;
      const miniSlider = document.getElementById('miniPlayerScrubSlider');
      if (miniSlider && !miniSlider._isDragging) miniSlider.value = String((ratio * 100).toFixed(1));
      const miniCur = document.getElementById('miniPlayerCurTime');
      if (miniCur) miniCur.textContent = this._formatTime(curSec);
      const miniTot = document.getElementById('miniPlayerTotTime');
      if (miniTot) miniTot.textContent = this._formatTime(safeDur);

      const npFill = document.getElementById('npTurntableProgressFill');
      if (npFill) npFill.style.width = pct;
      const npSlider = document.getElementById('npTurntableScrubSlider');
      if (npSlider && !npSlider._isDragging) npSlider.value = String((ratio * 100).toFixed(1));
      const npCur = document.getElementById('npCurrentTimeText') || document.getElementById('npTurntableCurTime');
      if (npCur) npCur.textContent = this._formatTime(curSec);
      const npDur = document.getElementById('npDurationTimeText') || document.getElementById('npTurntableTotTime');
      if (npDur) npDur.textContent = this._formatTime(safeDur);
    }

    _syncPlayPauseIcons(playing) {
      const npVinyl = document.getElementById('npTurntableVinylDisc');
      if (npVinyl) npVinyl.classList.toggle('spinning', playing);
      const crateVinyl = document.getElementById('crateMainVinylDisc');
      if (crateVinyl) crateVinyl.classList.toggle('spinning', playing);

      const miniBtn = document.getElementById('miniPlayerPlayPauseBtn');
      if (miniBtn) miniBtn.innerHTML = playing ? SVG_ICONS.pause : SVG_ICONS.play;

      const npBtn = document.getElementById('npPlayPauseMainBtn') || document.getElementById('npTurntablePlayPauseBtn');
      if (npBtn) npBtn.innerHTML = playing ? SVG_ICONS.pauseLarge : SVG_ICONS.playLarge;
    }

    _renderQueueListInModal() {
      const cont = document.getElementById('npQueueListContainer');
      const countBadge = document.getElementById('npQueueCountBadge');
      if (countBadge) countBadge.textContent = String(this.queue.length);
      if (!cont) return;

      if (this.queue.length === 0) {
        cont.innerHTML = `<div class="p-3 text-center text-xs text-gray-400">La cola está vacía.</div>`;
        return;
      }

      cont.innerHTML = this.queue.slice(0, 40).map((tr, idx) => {
        const isCurrent = idx === this.queueIndex;
        const thumb = getBestTrackCover(tr);
        return `
          <div onclick="window.DiscoverHomeApp.playQueueIndex(${idx})" class="flex items-center justify-between gap-2.5 p-2 rounded-xl border ${isCurrent ? 'bg-[#d4af37]/15 border-[#d4af37]/60' : 'bg-white/5 border-white/5 hover:bg-white/10'} cursor-pointer transition">
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <img src="${thumb}" onerror="this.src='./app_logo.png'" class="w-9 h-9 rounded-lg object-cover flex-shrink-0" alt="">
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-white truncate">${escapeHtmlSafe(tr.title || 'Canción')}</p>
                <p class="text-[11px] text-gray-400 truncate">${escapeHtmlSafe(tr.artist || 'Artista')}</p>
              </div>
            </div>
            <button type="button" onclick="event.stopPropagation(); window.DiscoverHomeApp.removeTrackFromQueue(${idx})" class="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white cursor-pointer" title="Quitar de la cola">
              ${SVG_ICONS.closeSmall}
            </button>
          </div>
        `;
      }).join('');
    }
  }

  // =========================================================================
  // ICONOS SVG ESTILIZADOS (CERO EMOJIS EN TODA LA INTERFAZ)
  // =========================================================================
  const SVG_ICONS = {
    close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    closeSmall: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    piano: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2.5"/><line x1="8" y1="4" x2="8" y2="14"/><line x1="12" y1="4" x2="12" y2="14"/><line x1="16" y1="4" x2="16" y2="14"/><line x1="6" y1="14" x2="6" y2="20"/><line x1="10" y1="14" x2="10" y2="20"/><line x1="14" y1="14" x2="14" y2="20"/><line x1="18" y1="14" x2="18" y2="20"/></svg>`,
    pianoSmall: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2.5"/><line x1="8" y1="4" x2="8" y2="14"/><line x1="12" y1="4" x2="12" y2="14"/><line x1="16" y1="4" x2="16" y2="14"/><line x1="6" y1="14" x2="6" y2="20"/><line x1="10" y1="14" x2="10" y2="20"/><line x1="14" y1="14" x2="14" y2="20"/><line x1="18" y1="14" x2="18" y2="20"/></svg>`,
    heartOutline: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    heartFilled: `<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    plus: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    check: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    sparkles: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/></svg>`,
    play: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>`,
    pause: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    playLarge: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>`,
    pauseLarge: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`
  };

  function hasRealHttpCover(track) {
    if (!track) return false;
    const raw = String(track.artworkUrl600 || track.cover_url || track.thumbnail || '').trim();
    return /^https?:\/\//i.test(raw);
  }

  function getBestTrackCover(track) {
    if (!track) return './app_logo.png';
    for (const candidate of [track.artworkUrl600, track.cover_url, track.thumbnail]) {
      const s = String(candidate || '').trim();
      if (/^https?:\/\//i.test(s)) {
        return s.replace(/100x100bb/g, '600x600bb').replace(/300x300bb/g, '600x600bb');
      }
    }
    return './app_logo.png';
  }

  function escapeHtmlSafe(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function playVinylNeedleScratchSound() {
    try {
      const isMuted = localStorage.getItem('beatstar_master_muted') === 'true';
      if (isMuted) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._crateScratchAudioCtx) {
        window._crateScratchAudioCtx = new AudioCtx();
      }
      const ctx = window._crateScratchAudioCtx;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const duration = 0.12;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * env * 0.22;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1650, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + duration);
      filter.Q.value = 3.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (_) {}
  }

  function triggerGoldenVinylFlyAnimation(coverUrl) {
    try {
      const cardEl = document.getElementById('crateActiveSwipeCard');
      const libTabEl = document.getElementById('tabLibraryBtn');
      if (!cardEl || !libTabEl) return;

      const startRect = cardEl.getBoundingClientRect();
      const endRect = libTabEl.getBoundingClientRect();

      const flyer = document.createElement('div');
      flyer.className = 'flying-golden-vinyl';
      flyer.style.left = `${startRect.left + startRect.width / 2 - 28}px`;
      flyer.style.top = `${startRect.top + 80}px`;
      flyer.style.backgroundImage = `url('${(coverUrl || './app_logo.png').replace(/'/g, "\\'")}')`;
      document.body.appendChild(flyer);

      requestAnimationFrame(() => {
        const dx = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2);
        const dy = (endRect.top + endRect.height / 2) - (startRect.top + 80);
        flyer.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(0.25) rotate(540deg)`;
        flyer.style.opacity = '0.15';
      });

      setTimeout(() => {
        if (flyer.parentNode) flyer.parentNode.removeChild(flyer);
        libTabEl.classList.add('ring-2', 'ring-amber-300');
        setTimeout(() => libTabEl.classList.remove('ring-2', 'ring-amber-300'), 420);
      }, 700);
    } catch (_) {}
  }

  // =========================================================================
  // CONTROLADOR PRINCIPAL DE DESCUBRIR (HOME): SWIPE DECK + CARRUSELES + PLAYER
  // =========================================================================
  const graphService = new ExternalMusicGraphService();
  const dnaEngine = new AnalogDNAEngine(graphService);
  const karaokeService = new KaraokeLyricsService();
  const dualStreamEngine = new DualStreamAudioEngine(graphService, dnaEngine, karaokeService);

  window.ExternalMusicGraphService = graphService;
  window.AnalogDNAEngine = dnaEngine;
  window.UserMusicDNA = dnaEngine;
  window.KaraokeLyricsService = karaokeService;
  window.DualStreamAudioEngine = dualStreamEngine;
  window.dualStreamEngine = dualStreamEngine;

  const DiscoverHomeApp = {
    deck: [],
    deckIndex: 0,
    viewMode: 'cards',
    mediumMode: 'vinyl',
    isInitialized: false,
    autoPlayCrateOnSwipe: true,
    targetPlaylistId: null,
    targetPlaylistObj: null,
    _cleanupCardGestureListeners: null,
    _openedSheetTracks: [],
    _openedSheetTitle: '',
    _openedSheetPlaylistId: null,
    _dynamicPlaylistCarouselsMap: {},

    init() {
      if (this.isInitialized) {
        this.refreshCarousels();
        return;
      }
      this.isInitialized = true;
      this._syncDialsUI();
      this.rebuildCrateDeck(false);
      this.refreshCarousels();
    },

    getAllCandidatePool() {
      const pool = [];
      const seen = new Set();

      const addTrack = (item) => {
        if (!item || !item.title) return;
        const id = String(item.id || '');
        if (!id || seen.has(id)) return;
        seen.add(id);
        if (hasRealHttpCover(item)) {
          const best = getBestTrackCover(item);
          item.artworkUrl600 = best;
          item.thumbnail = best;
          item.cover_url = best;
        }
        dnaEngine.encodeTrackVector(item);
        pool.push(item);
      };

      if (typeof window.getFormattedTopSongsCatalog === 'function') {
        const topList = window.getFormattedTopSongsCatalog() || [];
        for (const s of topList) addTrack({ ...s });
      }

      if (typeof CURATED_PLAYLIST_DATABASE === 'object' && CURATED_PLAYLIST_DATABASE) {
        for (const [, plData] of Object.entries(CURATED_PLAYLIST_DATABASE)) {
          for (const tr of (plData.tracks || [])) {
            addTrack({
              id: `magic_yt_${tr.id}`,
              videoId: tr.id,
              title: tr.title,
              artist: tr.artist,
              genre: plData.title,
              source: 'magic_youtube',
              source_name: plData.title,
              _isMagicKey: true,
              stars: 4.2,
              thumbnail: `https://i.ytimg.com/vi/${tr.id}/hqdefault.jpg`,
              cover_url: `https://i.ytimg.com/vi/${tr.id}/hqdefault.jpg`
            });
          }
        }
      }

      return pool;
    },

    rebuildCrateDeck(autoPlayFirst = false) {
      const pool = this.getAllCandidatePool();
      const targetVec = dnaEngine.getEffectiveTargetVector();

      // Si hay una Playlist X activa en el modo Swipe ("Buscar para playlist X"),
      // excluir canciones que ya están en esa playlist y recomendar según todas las canciones de la playlist
      const existingPlaylistIds = new Set();
      let plCentroid = null;
      if (this.targetPlaylistObj && Array.isArray(this.targetPlaylistObj.tracks)) {
        for (const pt of this.targetPlaylistObj.tracks) {
          if (pt && pt.id) existingPlaylistIds.add(String(pt.id));
        }
        plCentroid = dnaEngine.computePlaylistCentroidVector(this.targetPlaylistObj.tracks, this.targetPlaylistObj.title || '');
      }

      const scored = pool
        .filter(tr => !existingPlaylistIds.has(String(tr.id)))
        .map(tr => {
          const baseScore = this.targetPlaylistObj
            ? dnaEngine.scoreTrackForPlaylist(tr, this.targetPlaylistObj, plCentroid)
            : dnaEngine.scoreTrackForRecommendation(tr, targetVec);
          const coverBoost = hasRealHttpCover(tr) ? 0.35 : 0;
          const jitter = (Math.random() - 0.5) * 0.08;
          return { track: tr, score: baseScore + coverBoost + jitter };
        });

      scored.sort((a, b) => b.score - a.score);

      const finalDeck = [];
      const tailArtists = [...dnaEngine.bloomFilter.recentArtists];

      for (const entry of scored) {
        const tr = entry.track;
        if (dnaEngine.bloomFilter.hasSeenRecently(tr.id)) continue;
        if (dnaEngine.bloomFilter.wouldViolateArtistCap(tr.artist, tailArtists)) continue;
        finalDeck.push(tr);
        tailArtists.push(String(tr.artist || '').toLowerCase());
        if (finalDeck.length >= 60) break;
      }

      if (finalDeck.length < 15) {
        for (const entry of scored) {
          if (!finalDeck.includes(entry.track)) {
            finalDeck.push(entry.track);
            if (finalDeck.length >= 40) break;
          }
        }
      }

      this.deck = finalDeck;
      this.deckIndex = 0;
      this.renderCrateDigger();

      const active = this.getActiveCrateTrack();
      if (active) {
        dnaEngine.bloomFilter.markSeen(active.id, active.artist);
        dualStreamEngine.prewarmUpcomingCards(this.deck.slice(0, 5));
        if (!dualStreamEngine.currentTrack) {
          dualStreamEngine.currentTrack = active;
          dualStreamEngine.queue = [...this.deck];
          dualStreamEngine.queueIndex = 0;
          dualStreamEngine._updatePlayerMetadataUI(active);
          const fullDur = dualStreamEngine.getTrackFullDurationSec(active);
          dualStreamEngine._updatePlayerProgressUI(0, fullDur);
        }
        if (autoPlayFirst) {
          dualStreamEngine.playTrack(active);
        } else {
          this._ensureRealCoverForTrack(active, 'crateMainCoverImg');
          const next = this.deck[this.deckIndex + 1];
          if (next) this._ensureRealCoverForTrack(next, 'crateNextCoverImg');
          dualStreamEngine.preloadFullTrackInBackground(active).catch(() => {});
        }
      }
    },

    _ensureRealCoverForTrack(track, domImgId) {
      if (!track) return;
      if (hasRealHttpCover(track)) return;
      graphService.enrichTrackMetadata(track).then((meta) => {
        if (meta && meta.artworkUrl600) {
          track.artworkUrl600 = meta.artworkUrl600;
          track.thumbnail = meta.artworkUrl600;
          track.cover_url = meta.artworkUrl600;
          if (domImgId) {
            const imgEl = document.getElementById(domImgId);
            if (imgEl) imgEl.src = meta.artworkUrl600;
          }
          if (dualStreamEngine.currentTrack && dualStreamEngine.currentTrack.id === track.id) {
            dualStreamEngine._updatePlayerMetadataUI(track);
          }
        }
      }).catch(() => {});
    },

    getActiveCrateTrack() {
      return this.deck[this.deckIndex] || null;
    },

    setViewMode() {},
    setMediumMode() {},

    toggleTubeAmpPanel(forceState) {
      const panel = document.getElementById('analogDnaTunerPanel');
      if (!panel) return;
      if (typeof forceState === 'boolean') {
        panel.classList.toggle('open', forceState);
      } else {
        panel.classList.toggle('open');
      }
      this._syncDialsUI();
    },

    toggleAlgorithmTunerPanel() {
      this.toggleTubeAmpPanel();
    },

    onDialChange(dialName, rawVal) {
      this.onDialInput(dialName, rawVal);
      if (this._dialDebounceTimer) clearTimeout(this._dialDebounceTimer);
      this._dialDebounceTimer = setTimeout(() => {
        this.rebuildCrateDeck(false);
        this.refreshCarousels();
      }, 220);
    },

    onDialInput(dialName, rawVal) {
      dnaEngine.setDial(dialName, rawVal);
      this._syncDialsUI();
    },

    toggleDontCare(dimKey) {
      if (!(dimKey in dnaEngine.dontCare)) return;
      const nextState = !dnaEngine.dontCare[dimKey];
      dnaEngine.setDontCare(dimKey, nextState);
      this._syncDialsUI();
      this.rebuildCrateDeck(false);
      this.refreshCarousels();
    },

    setAllDontCare(flag = true) {
      for (const k of ['era', 'energy', 'vocal', 'discovery']) {
        dnaEngine.dontCare[k] = Boolean(flag);
      }
      dnaEngine.saveToStorage(true);
      this._syncDialsUI();
      this.rebuildCrateDeck(false);
      this.refreshCarousels();
      if (flag && typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('Preferencias abiertas: recomendando de todas las épocas y estilos');
      }
    },

    applyPreferencePreset(presetName) {
      if (presetName === 'any') {
        this.setAllDontCare(true);
        return;
      }
      for (const k of ['era', 'energy', 'vocal', 'discovery']) {
        dnaEngine.dontCare[k] = false;
      }
      if (presetName === 'piano_relax') {
        dnaEngine.dials.era = 20;
        dnaEngine.dials.energy = 25;
        dnaEngine.dials.vocal = 12;
        dnaEngine.dials.discovery = 40;
      } else if (presetName === 'rock_anthems') {
        dnaEngine.dials.era = 48;
        dnaEngine.dials.energy = 85;
        dnaEngine.dials.vocal = 80;
        dnaEngine.dials.discovery = 35;
      } else if (presetName === 'modern_hits') {
        dnaEngine.dials.era = 92;
        dnaEngine.dials.energy = 72;
        dnaEngine.dials.vocal = 85;
        dnaEngine.dials.discovery = 50;
      }
      dnaEngine.saveToStorage(true);
      this._syncDialsUI();
      this.rebuildCrateDeck(true);
      this.refreshCarousels();
    },

    applyDialsAndRefreshDeck() {
      this.rebuildCrateDeck(true);
      this.refreshCarousels();
    },

    syncDialsUIFromState() {
      this._syncDialsUI();
    },

    _syncDialsUI() {
      const d = dnaEngine.dials;
      const dc = dnaEngine.dontCare;
      const map = [
        {
          key: 'discovery',
          sliders: ['dialInput_discovery', 'dialSliderDiscovery'],
          vals: ['dialVal_discovery', 'dialValDiscovery'],
          fmt: v => dc.discovery ? 'No me importa (Cualquier novedad)' : (v < 35 ? `Mis favoritos (${v}%)` : (v > 70 ? `Sorpréndeme (${v}%)` : `Equilibrado (${v}%)`))
        },
        {
          key: 'energy',
          sliders: ['dialInput_energy', 'dialSliderEnergy'],
          vals: ['dialVal_energy', 'dialValEnergy'],
          fmt: v => dc.energy ? 'No me importa (Cualquier ritmo)' : (v < 35 ? `Calma · ${Math.round(65 + v * 1.1)} BPM` : (v > 70 ? `Intenso · ${Math.round(65 + v * 1.1)} BPM` : `Medio · ${Math.round(65 + v * 1.1)} BPM`))
        },
        {
          key: 'era',
          sliders: ['dialInput_era', 'dialSliderEra'],
          vals: ['dialVal_era', 'dialValEra'],
          fmt: v => dc.era ? 'No me importa (Todas las épocas)' : (v < 30 ? 'Clásicos / 60s-70s' : (v < 68 ? '80s & 90s' : 'Actuales 2000s-Hoy'))
        },
        {
          key: 'vocal',
          sliders: ['dialInput_vocal', 'dialSliderVocal'],
          vals: ['dialVal_vocal', 'dialValVocal'],
          fmt: v => dc.vocal ? 'No me importa (Voz o Instrumental)' : (v < 30 ? `Piano Solo (${v}%)` : (v > 70 ? `Con Voz (${v}%)` : `Mixto (${v}%)`))
        }
      ];

      for (const item of map) {
        const val = d[item.key] ?? 50;
        const isIgnored = Boolean(dc[item.key]);
        for (const sId of item.sliders) {
          const sl = document.getElementById(sId);
          if (sl) sl.value = String(val);
        }
        for (const vId of item.vals) {
          const vl = document.getElementById(vId);
          if (vl) vl.textContent = item.fmt(val);
        }
        const dcBtn = document.getElementById(`dontCareBtn_${item.key}`);
        if (dcBtn) dcBtn.classList.toggle('active', isIgnored);
        const cardEl = document.getElementById(`prefCard_${item.key}`);
        if (cardEl) cardEl.classList.toggle('dont-care-mode', isIgnored);
      }
    },

    _buildSwipeCardInnerHtml(track, isTopCard) {
      const cover = getBestTrackCover(track);
      const isPlayingThis = isTopCard && dualStreamEngine.isPlaying() && dualStreamEngine.currentTrack?.id === track.id;
      const isFav = (typeof window.favoriteIdsSet !== 'undefined' && window.favoriteIdsSet.has(track.id)) ||
                    dnaEngine.likes.has(String(track.id));
      const coverImgId = isTopCard ? 'crateMainCoverImg' : 'crateNextCoverImg';
      const vinylDiscId = isTopCard ? 'crateMainVinylDisc' : 'crateNextVinylDisc';
      const isPlaylistMode = Boolean(this.targetPlaylistObj);
      const rightStampText = isPlaylistMode
        ? `+ ${(this.targetPlaylistObj.title || 'PLAYLIST').toUpperCase().slice(0, 16)}`
        : 'ME GUSTA';

      return `
        ${isTopCard ? `
          <div id="crateStampLike" class="crate-stamp-badge crate-stamp-like">${escapeHtmlSafe(rightStampText)}</div>
          <div id="crateStampPass" class="crate-stamp-badge crate-stamp-pass">PASAR</div>
          <div id="crateStampPlay" class="crate-stamp-badge crate-stamp-play">JUGAR</div>
        ` : ''}

        ${isPlaylistMode ? `
          <div class="mb-2 flex items-center justify-center">
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold tracking-wide">
              Desliza a la derecha para añadir a ${escapeHtmlSafe(this.targetPlaylistObj.title || 'Playlist')}
            </span>
          </div>
        ` : ''}

        <!-- Carátula cuadrada grande centrada con el disco de vinilo asomando sutilmente por detrás -->
        <div class="crate-cover-vinyl-wrap" ${isTopCard ? `onclick="window.DiscoverHomeApp.togglePreviewCurrentCrateCard()"` : ''}>
          <div id="${vinylDiscId}" class="crate-peeking-vinyl ${isPlayingThis ? 'spinning' : ''}">
            <div class="crate-peeking-vinyl-grooves"></div>
            <div class="crate-peeking-vinyl-center"></div>
          </div>
          <div class="crate-square-cover-frame">
            <img id="${coverImgId}" src="${cover}" onerror="this.onerror=null; this.src='./app_logo.png';" alt="" class="crate-square-cover-img">
          </div>
        </div>

        <!-- Título en grande y Artista en gris suave centrados -->
        <div class="crate-track-info">
          <h3 class="crate-song-title">${escapeHtmlSafe(track.title)}</h3>
          <p class="crate-song-artist">${escapeHtmlSafe(track.artist)}</p>
        </div>

        <!-- Fila inferior única con 4 botones modernos centrados -->
        <div class="crate-clean-actions-row">
          <button type="button" ${isTopCard ? `onclick="window.DiscoverHomeApp.swipeLeftPass()"` : ''} class="btn-swipe-circle pass" title="Pasar canción">
            ${SVG_ICONS.close}
          </button>
          <button type="button" ${isTopCard ? `onclick="window.DiscoverHomeApp.swipeUpPlayPiano()"` : ''} class="btn-swipe-play-gold" title="Jugar al piano">
            ${SVG_ICONS.piano}
            <span>Jugar</span>
          </button>
          <button type="button" ${isTopCard ? `onclick="window.DiscoverHomeApp.swipeRightLike()"` : ''} class="btn-swipe-circle like ${isFav || isPlaylistMode ? 'liked' : ''}" title="${isPlaylistMode ? 'Añadir a la playlist seleccionada' : 'Me gusta'}">
            ${isPlaylistMode ? SVG_ICONS.plus : (isFav ? SVG_ICONS.heartFilled : SVG_ICONS.heartOutline)}
          </button>
          <button type="button" ${isTopCard ? `onclick="window.DiscoverHomeApp.openPlaylistOrQueueForCurrent()"` : ''} class="btn-swipe-circle add" title="Elegir playlist o cola">
            ${SVG_ICONS.sparkles}
          </button>
        </div>
      `;
    },

    renderCrateDigger() {
      const stage = document.getElementById('crateDiggerStageContainer');
      if (!stage) return;

      const track = this.getActiveCrateTrack();
      if (!track) {
        stage.innerHTML = `<div class="p-6 text-center text-xs text-gray-400">Cargando canciones...</div>`;
        return;
      }

      const nextTrack = this.deck[this.deckIndex + 1] || this.deck[0] || null;

      stage.innerHTML = `
        <div class="crate-deck-stage">
          ${nextTrack && nextTrack.id !== track.id ? `
            <div id="crateNextSwipeCard" class="crate-swipe-card crate-next-underlay" aria-hidden="true">
              ${this._buildSwipeCardInnerHtml(nextTrack, false)}
            </div>
          ` : ''}

          <div id="crateActiveSwipeCard" class="crate-swipe-card z-10">
            ${this._buildSwipeCardInnerHtml(track, true)}
          </div>
        </div>
      `;

      this._ensureRealCoverForTrack(track, 'crateMainCoverImg');
      if (nextTrack) this._ensureRealCoverForTrack(nextTrack, 'crateNextCoverImg');
      this._attachCardSwipeGestures();
    },

    /**
     * Gestos de swipe blindados contra bugs en móvil:
     * - Limpia listeners previos de window para evitar duplicados.
     * - Captura pointercancel / touchcancel / blur para que la tarjeta NUNCA se quede bloqueada a mitad de arrastre.
     * - Si el usuario desliza hacia abajo para hacer scroll vertical en la página, aborta el drag de la tarjeta inmediatamente.
     */
    _attachCardSwipeGestures() {
      if (typeof this._cleanupCardGestureListeners === 'function') {
        try { this._cleanupCardGestureListeners(); } catch (_) {}
        this._cleanupCardGestureListeners = null;
      }

      const card = document.getElementById('crateActiveSwipeCard');
      const nextCard = document.getElementById('crateNextSwipeCard');
      if (!card) return;

      let startX = 0;
      let startY = 0;
      let currentX = 0;
      let currentY = 0;
      let isDragging = false;

      const stampLike = document.getElementById('crateStampLike');
      const stampPass = document.getElementById('crateStampPass');
      const stampPlay = document.getElementById('crateStampPlay');

      const resetCardPosition = () => {
        isDragging = false;
        currentX = 0;
        currentY = 0;
        card.classList.remove('dragging');
        card.style.transform = '';
        card.style.opacity = '';
        if (nextCard) {
          nextCard.style.transform = '';
          nextCard.style.opacity = '';
        }
        if (stampLike) stampLike.style.opacity = '0';
        if (stampPass) stampPass.style.opacity = '0';
        if (stampPlay) stampPlay.style.opacity = '0';
      };

      const onPointerDown = (e) => {
        if (e.target.closest('button')) return;
        isDragging = true;
        startX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
        startY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
        currentX = 0;
        currentY = 0;
        card.classList.add('dragging');
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const cx = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? startX;
        const cy = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? startY;
        const dx = cx - startX;
        const dy = cy - startY;

        // Si el usuario arrastra hacia abajo para hacer scroll en la página, soltar la tarjeta de inmediato
        if (dy > 14 && Math.abs(dy) > Math.abs(dx) * 1.15) {
          resetCardPosition();
          return;
        }

        currentX = dx;
        currentY = Math.min(28, dy);

        const rot = currentX * 0.05;
        card.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg)`;

        if (nextCard) {
          const progress = Math.min(1, Math.hypot(currentX, currentY) / 110);
          const scale = 0.96 + progress * 0.04;
          const opacity = 0.72 + progress * 0.28;
          nextCard.style.transform = `scale(${scale.toFixed(3)}) translateY(${(6 * (1 - progress)).toFixed(1)}px)`;
          nextCard.style.opacity = String(opacity.toFixed(2));
        }

        if (stampLike) stampLike.style.opacity = currentX > 35 ? String(Math.min(1, (currentX - 35) / 60)) : '0';
        if (stampPass) stampPass.style.opacity = currentX < -35 ? String(Math.min(1, (-currentX - 35) / 60)) : '0';
        if (stampPlay) stampPlay.style.opacity = (currentY < -45 && Math.abs(currentX) < 60) ? String(Math.min(1, (-currentY - 45) / 55)) : '0';
      };

      const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        card.classList.remove('dragging');

        if (currentY < -75 && Math.abs(currentX) < 75) {
          this.swipeUpPlayPiano();
        } else if (currentX > 75) {
          this.swipeRightLike();
        } else if (currentX < -75) {
          this.swipeLeftPass();
        } else {
          resetCardPosition();
        }
      };

      const onPointerCancel = () => {
        if (!isDragging) return;
        resetCardPosition();
      };

      card.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
      window.addEventListener('touchcancel', onPointerCancel);
      window.addEventListener('blur', onPointerCancel);

      this._cleanupCardGestureListeners = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        window.removeEventListener('touchcancel', onPointerCancel);
        window.removeEventListener('blur', onPointerCancel);
      };
    },

    togglePreviewCurrentCrateCard() {
      const track = this.getActiveCrateTrack();
      if (!track) return;
      if (dualStreamEngine.currentTrack?.id === track.id) {
        dualStreamEngine.togglePlayPause();
      } else {
        dualStreamEngine.playTrack(track);
      }
    },

    /**
     * Al deslizar a la derecha:
     * - Si estamos en modo "Buscar canciones para la playlist X", añade la canción directamente a esa playlist X.
     * - Si estamos en modo general, la guarda en Tus Me Gusta.
     */
    async swipeRightLike() {
      const track = this.getActiveCrateTrack();
      if (!track) return;

      const cover = getBestTrackCover(track);
      triggerGoldenVinylFlyAnimation(cover);
      dnaEngine.recordLike(track);

      if (this.targetPlaylistObj && typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getPlaylist === 'function') {
        try {
          const freshPl = await window.IndexedDBStorage.getPlaylist(this.targetPlaylistObj.id).catch(() => null) || this.targetPlaylistObj;
          if (!Array.isArray(freshPl.tracks)) freshPl.tracks = [];
          const alreadyIn = freshPl.tracks.some(t => t && String(t.id) === String(track.id));
          if (!alreadyIn) {
            freshPl.tracks.push({
              id: track.id,
              videoId: track.videoId || '',
              title: track.title,
              artist: track.artist || 'Artista',
              thumbnail: cover,
              cover_url: cover,
              addedAt: Date.now()
            });
            await window.IndexedDBStorage.putPlaylist(freshPl);
          }
          this.targetPlaylistObj = freshPl;
          if (typeof window.showSuccessToast === 'function') {
            window.showSuccessToast(`Añadida a "${freshPl.title}": ${track.title}`);
          }
        } catch (_) {}
      } else {
        if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.putFavoriteRecord === 'function') {
          try {
            await window.IndexedDBStorage.putFavoriteRecord({
              ...track,
              addedAt: Date.now()
            });
            if (typeof window.favoriteIdsSet !== 'undefined') {
              window.favoriteIdsSet.add(track.id);
            }
            if (typeof window.updateLibraryVaultBadges === 'function') {
              window.updateLibraryVaultBadges();
            }
          } catch (_) {}
        }
        if (typeof window.showSuccessToast === 'function') {
          window.showSuccessToast(`Guardada en Tus Me Gusta: ${track.title}`);
        }
      }

      const card = document.getElementById('crateActiveSwipeCard');
      const nextCard = document.getElementById('crateNextSwipeCard');
      if (card) {
        card.style.transform = 'translate3d(115%, -8px, 0) rotate(14deg)';
        card.style.opacity = '0';
      }
      if (nextCard) {
        nextCard.style.transform = 'scale(1) translateY(0)';
        nextCard.style.opacity = '1';
      }
      setTimeout(() => {
        this._advanceToNextCard(true);
        this.refreshCarousels();
      }, 150);
    },

    swipeLeftPass() {
      const track = this.getActiveCrateTrack();
      if (!track) return;

      playVinylNeedleScratchSound();
      dnaEngine.recordPass(track);

      const card = document.getElementById('crateActiveSwipeCard');
      const nextCard = document.getElementById('crateNextSwipeCard');
      if (card) {
        card.style.transform = 'translate3d(-115%, 8px, 0) rotate(-14deg)';
        card.style.opacity = '0';
      }
      if (nextCard) {
        nextCard.style.transform = 'scale(1) translateY(0)';
        nextCard.style.opacity = '1';
      }
      setTimeout(() => {
        this._advanceToNextCard(true);
      }, 150);
    },

    swipeUpPlayPiano() {
      const track = this.getActiveCrateTrack();
      if (!track) return;
      this.launchPianoGameForTrack(track);
    },

    _advanceToNextCard(autoPlay = true) {
      this.deckIndex += 1;
      if (this.deckIndex >= this.deck.length) {
        this.rebuildCrateDeck(autoPlay);
        return;
      }
      const nextTrack = this.getActiveCrateTrack();
      if (nextTrack) {
        dnaEngine.bloomFilter.markSeen(nextTrack.id, nextTrack.artist);
        dnaEngine.saveToStorage(false);
      }
      this.renderCrateDigger();

      if (nextTrack) {
        dualStreamEngine.prewarmUpcomingCards(this.deck.slice(this.deckIndex + 1, this.deckIndex + 5));
        if (autoPlay) {
          dualStreamEngine.playTrack(nextTrack);
        }
      }
    },

    async launchPianoGameForTrack(track) {
      if (!track) return;
      dualStreamEngine.pauseForGameplayWithFade(200);

      if (dualStreamEngine.currentTrack?.id === track.id && dualStreamEngine.fullTrackBlob) {
        dualStreamEngine._storeFullBlobInGlobalCache(track, dualStreamEngine.fullTrackBlob);
      }

      const id = String(track.id || '');
      if (track.is_top_song || id.startsWith('top_')) {
        if (typeof window.playTopSong === 'function') {
          window.playTopSong(id, 'Normal', track);
          return;
        }
      }
      if (id.startsWith('comm_') && typeof window.playCommunitySong === 'function') {
        window.playCommunitySong(id, false, 'Media');
        return;
      }
      if (typeof window.autoExtractAndPlaySong === 'function') {
        const thumb = getBestTrackCover(track);
        window.autoExtractAndPlaySong(track.title, track.artist || '', thumb, 'hard', id, false);
        return;
      }
      if (typeof window.playSong === 'function') {
        window.playSong(id);
      }
    },

    launchPianoForCurrentPlayerTrack() {
      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (tr) this.launchPianoGameForTrack(tr);
    },

    launchPianoForTrackIndex(idx) {
      const tr = this.deck[idx];
      if (tr) this.launchPianoGameForTrack(tr);
    },

    async openPlaylistOrQueueForTrack(track) {
      if (!track) return;
      window._pendingCrateTrackForPlaylist = track;
      if (typeof window.openAddToPlaylistModal === 'function') {
        if (Array.isArray(window.searchResultsCache) && !window.searchResultsCache.some(s => s && String(s.id) === String(track.id))) {
          window.searchResultsCache.unshift(track);
        }
        await window.openAddToPlaylistModal(track.id);
        const listCont = document.getElementById('availablePlaylistsList');
        if (listCont && !document.getElementById('btnQuickAddQueueModal')) {
          const qBtn = document.createElement('div');
          qBtn.id = 'btnQuickAddQueueModal';
          qBtn.className = 'p-2.5 mb-2 bg-white/5 hover:bg-white/10 rounded-xl border border-[#d4af37]/40 flex items-center justify-between cursor-pointer transition';
          qBtn.innerHTML = `
            <span class="text-xs font-bold text-white flex items-center gap-2">${SVG_ICONS.plus}<span>Añadir a la Cola de Reproducción</span></span>
            <span class="text-[10px] font-bold text-[#d4af37]">COLA</span>
          `;
          qBtn.onclick = () => {
            dualStreamEngine.enqueueTrack(track, false);
            if (typeof window.closeAddToPlaylistModal === 'function') window.closeAddToPlaylistModal();
            if (typeof window.showSuccessToast === 'function') {
              window.showSuccessToast(`Añadida a la cola: ${track.title}`);
            }
          };
          listCont.prepend(qBtn);
        }
      }
    },

    openPlaylistOrQueueForCurrent() {
      this.openPlaylistOrQueueForTrack(this.getActiveCrateTrack());
    },

    openPlaylistOrQueueForPlayerTrack() {
      this.openPlaylistOrQueueForTrack(dualStreamEngine.currentTrack || this.getActiveCrateTrack());
    },

    openPlaylistOrQueueForTrackIndex(idx) {
      this.openPlaylistOrQueueForTrack(this.deck[idx]);
    },

    async startRadioFromTrack(seedTrack) {
      if (!seedTrack) return;
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(`Iniciando Radio: ${seedTrack.title}`);
      }

      const seedVec = dnaEngine.encodeTrackVector(seedTrack);
      const pool = this.getAllCandidatePool();

      const byCosine = pool
        .filter(t => String(t.id) !== String(seedTrack.id))
        .map(t => ({
          track: t,
          sim: dnaEngine.cosineSimilarity(seedVec, dnaEngine.encodeTrackVector(t))
        }))
        .sort((a, b) => b.sim - a.sim)
        .slice(0, 18)
        .map(x => x.track);

      const extSimilar = await graphService.fetchSimilarTracksFromGraph(seedTrack).catch(() => []);
      const mappedExt = extSimilar.slice(0, 8).map((et, i) => ({
        id: `radio_ext_${Date.now()}_${i}`,
        title: et.title,
        artist: et.artist || seedTrack.artist,
        previewUrl: et.previewUrl || '',
        artworkUrl600: et.artworkUrl600 || '',
        thumbnail: et.artworkUrl600 || './app_logo.png',
        durationSec: et.durationSec || 180,
        source: 'magic_youtube',
        _isMagicKey: true
      }));

      const radioQueue = [seedTrack, ...mappedExt.slice(0, 4), ...byCosine];
      dualStreamEngine.loadQueueAndPlay(radioQueue, 0, `Radio ${seedTrack.title}`);
    },

    startRadioFromCurrent() {
      this.startRadioFromTrack(this.getActiveCrateTrack());
    },

    startRadioFromPlayerTrack() {
      this.startRadioFromTrack(dualStreamEngine.currentTrack || this.getActiveCrateTrack());
    },

    playDailyMix() {
      const pool = this.getAllCandidatePool();
      const targetVec = dnaEngine.getEffectiveTargetVector();
      const mix = pool
        .map(t => ({ t, sc: dnaEngine.scoreTrackForRecommendation(t, targetVec) + (hasRealHttpCover(t) ? 0.25 : 0) + (Math.random() * 0.06) }))
        .sort((a, b) => b.sc - a.sc)
        .slice(0, 25)
        .map(x => x.t);

      if (mix.length > 0) {
        dualStreamEngine.loadQueueAndPlay(mix, 0, 'Mi Mix Diario');
      }
    },

    // =========================================================================
    // CARRUSELES LIMPIOS ESTILO SPOTIFY + RECOMENDACIONES BASADAS EN PLAYLISTS
    // =========================================================================
    async refreshCarousels() {
      this._renderBecauseYouLikedCarousel();
      this._renderWeeklyDiscoveryCarousel();
      this._renderPianoVirtuosoCarousel();
      this._renderHighEnergyCarousel();
      this._renderHiddenGemsCarousel();
      await this._renderUserPlaylistsCarousel();
    },

    _renderBecauseYouLikedCarousel() {
      const titleEl = document.getElementById('becauseYouLikedHeaderTitle');
      const cont = document.getElementById('carouselBecauseYouLiked');
      if (!cont) return;

      const pool = this.getAllCandidatePool();
      const seed = dnaEngine.lastLikedTrack ||
                   pool.find(t => dnaEngine.likes.has(String(t.id))) ||
                   pool.find(t => /bohemian rhapsody|nocturne|blinding lights|vivir asi/i.test(t.title)) ||
                   pool[0];

      if (!seed) return;
      if (titleEl) {
        titleEl.textContent = `Porque te gustó ${seed.title}`;
      }

      const seedVec = dnaEngine.encodeTrackVector(seed);
      const related = pool
        .filter(t => String(t.id) !== String(seed.id))
        .map(t => {
          const sim = dnaEngine.cosineSimilarity(seedVec, dnaEngine.encodeTrackVector(t)) + (hasRealHttpCover(t) ? 0.25 : 0);
          return { t, sim };
        })
        .sort((a, b) => b.sim - a.sim)
        .slice(0, 12)
        .map(x => x.t);

      this._becauseLikedList = related;
      cont.innerHTML = related.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, 'because')).join('');
      this._enrichCarouselCoversAsync(related, 'because');
    },

    _renderWeeklyDiscoveryCarousel() {
      const cont = document.getElementById('carouselWeeklyDiscovery');
      if (!cont) return;

      const pool = this.getAllCandidatePool();
      const highScoresObj = (typeof highscores === 'object' && highscores) ? highscores : {};

      const weekly = pool
        .filter(t => !highScoresObj[t.id])
        .map(t => ({ t, sc: dnaEngine.scoreTrackForRecommendation(t) + (hasRealHttpCover(t) ? 0.25 : 0) }))
        .sort((a, b) => b.sc - a.sc)
        .slice(0, 12)
        .map(x => x.t);

      this._weeklyDiscoveryList = weekly;
      cont.innerHTML = weekly.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, 'weekly')).join('');
      this._enrichCarouselCoversAsync(weekly, 'weekly');
    },

    _renderPianoVirtuosoCarousel() {
      const cont = document.getElementById('carouselPianoVirtuoso');
      if (!cont) return;
      const pool = this.getAllCandidatePool();
      const list = pool
        .map(t => {
          const v = dnaEngine.encodeTrackVector(t);
          const sc = v[7] * 0.75 + (1 - v[3]) * 0.35 + (hasRealHttpCover(t) ? 0.2 : 0);
          return { t, sc };
        })
        .sort((a, b) => b.sc - a.sc)
        .slice(0, 12)
        .map(x => x.t);

      this._pianoVirtuosoList = list;
      cont.innerHTML = list.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, 'piano')).join('');
      this._enrichCarouselCoversAsync(list, 'piano');
    },

    _renderHighEnergyCarousel() {
      const cont = document.getElementById('carouselHighEnergy');
      if (!cont) return;
      const pool = this.getAllCandidatePool();
      const list = pool
        .map(t => {
          const v = dnaEngine.encodeTrackVector(t);
          const sc = v[1] * 0.55 + Math.max(v[4], v[5]) * 0.45 + (hasRealHttpCover(t) ? 0.2 : 0);
          return { t, sc };
        })
        .sort((a, b) => b.sc - a.sc)
        .slice(0, 12)
        .map(x => x.t);

      this._highEnergyList = list;
      cont.innerHTML = list.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, 'energy')).join('');
      this._enrichCarouselCoversAsync(list, 'energy');
    },

    _renderHiddenGemsCarousel() {
      const cont = document.getElementById('carouselHiddenGems');
      if (!cont) return;
      const pool = this.getAllCandidatePool();
      const list = pool
        .filter(t => !dnaEngine.likes.has(String(t.id)))
        .map(t => {
          const v = dnaEngine.encodeTrackVector(t);
          const novelty = Math.abs(v[2] - 0.45) * 0.3 + (hasRealHttpCover(t) ? 0.25 : 0) + ((String(t.id).charCodeAt(0) % 17) * 0.015);
          return { t, sc: novelty + dnaEngine.scoreTrackForRecommendation(t) * 0.6 };
        })
        .sort((a, b) => b.sc - a.sc)
        .slice(10, 22)
        .map(x => x.t);

      this._hiddenGemsList = list;
      cont.innerHTML = list.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, 'gems')).join('');
      this._enrichCarouselCoversAsync(list, 'gems');
    },

    _enrichCarouselCoversAsync(list, listType) {
      if (!Array.isArray(list)) return;
      list.forEach((tr, idx) => {
        if (!hasRealHttpCover(tr)) {
          this._ensureRealCoverForTrack(tr, `carouselCover_${listType}_${idx}`);
        }
      });
    },

    /**
     * Renderiza Tus Playlists y Favoritos + Filas de recomendaciones dinámicas basadas en cada Playlist
     * con el botón "Descubrir canciones para esta playlist" (modo TikTok/Tinder).
     */
    async _renderUserPlaylistsCarousel() {
      const cont = document.getElementById('carouselUserPlaylists');
      if (!cont) return;

      let playlists = [];
      if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getAllPlaylists === 'function') {
        playlists = await window.IndexedDBStorage.getAllPlaylists().catch(() => []) || [];
      }

      let favsFromDb = [];
      if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getAllFavorites === 'function') {
        favsFromDb = await window.IndexedDBStorage.getAllFavorites().catch(() => []) || [];
      }
      const favCount = Math.max(dnaEngine.likes.size, favsFromDb.length, (typeof window.favoriteIdsSet !== 'undefined' ? window.favoriteIdsSet.size : 0));
      const cardsHtml = [];

      // Tarjeta 1: Tus Me Gusta -> Abre todas las canciones para elegir una (NO reproduce una aleatoria sola)
      cardsHtml.push(`
        <div class="spotify-carousel-card" onclick="window.DiscoverHomeApp.openLikedSongsSheetModal()">
          <div class="spotify-carousel-cover-wrap liked-gradient-cover">
            <div class="liked-cover-heart-icon">${SVG_ICONS.heartFilled}</div>
            <button type="button" onclick="event.stopPropagation(); window.DiscoverHomeApp.openLikedSongsSheetModal();" class="spotify-floating-piano-btn" title="Ver canciones de Tus Me Gusta">
              ${SVG_ICONS.pianoSmall}
            </button>
          </div>
          <h4 class="spotify-carousel-title">Tus Me Gusta</h4>
          <p class="spotify-carousel-artist">${favCount} canciones · Elegir pista</p>
        </div>
      `);

      for (const pl of playlists) {
        if (!pl) continue;
        const firstTrack = Array.isArray(pl.tracks) && pl.tracks[0] ? pl.tracks[0] : null;
        const cover = firstTrack ? getBestTrackCover(firstTrack) : './app_logo.png';
        const safeId = String(pl.id || '').replace(/'/g, "\\'");
        cardsHtml.push(`
          <div class="spotify-carousel-card" onclick="window.DiscoverHomeApp.openUserPlaylistSheetModal('${safeId}')">
            <div class="spotify-carousel-cover-wrap">
              <img src="${cover}" onerror="this.onerror=null; this.src='./app_logo.png';" class="spotify-carousel-cover-img" alt="" loading="lazy">
              <button type="button" onclick="event.stopPropagation(); window.DiscoverHomeApp.startPlaylistDiscoverySwipeMode('${safeId}');" class="spotify-floating-piano-btn" title="Descubrir canciones para esta playlist en modo Swipe">
                ${SVG_ICONS.sparkles}
              </button>
            </div>
            <h4 class="spotify-carousel-title">${escapeHtmlSafe(pl.title || 'Playlist')}</h4>
            <p class="spotify-carousel-artist">${(pl.tracks || []).length} canciones · Abrir</p>
          </div>
        `);
      }

      cardsHtml.push(`
        <div class="spotify-carousel-card" onclick="switchMainTab('library'); switchLibrarySubtab('playlists'); createNewEmptyPlaylistPrompt();">
          <div class="spotify-carousel-cover-wrap new-playlist-cover">
            <div class="new-playlist-plus-icon">${SVG_ICONS.plus}</div>
          </div>
          <h4 class="spotify-carousel-title">Crear playlist</h4>
          <p class="spotify-carousel-artist">Nueva colección</p>
        </div>
      `);

      cont.innerHTML = cardsHtml.join('');
      this._renderDynamicPlaylistRecCarousels(playlists);
    },

    /**
     * Genera filas tipo Spotify basadas en las playlists del usuario con el botón
     * "Descubrir canciones para esta playlist" que lanza el modo TikTok/Tinder para esa playlist.
     */
    _renderDynamicPlaylistRecCarousels(playlists = []) {
      const dynCont = document.getElementById('dynamicPlaylistRecsContainer');
      if (!dynCont) return;

      this._dynamicPlaylistCarouselsMap = {};
      const pool = this.getAllCandidatePool();
      const validPlaylists = playlists.filter(p => p && p.id && p.title).slice(0, 4);

      if (validPlaylists.length === 0) {
        dynCont.innerHTML = '';
        return;
      }

      const sectionsHtml = validPlaylists.map((pl, pIdx) => {
        const safeId = String(pl.id).replace(/'/g, "\\'");
        const listKey = `plrec_${pIdx}`;
        const existingIds = new Set((pl.tracks || []).map(t => String(t?.id || '')));
        const centroid = dnaEngine.computePlaylistCentroidVector(pl.tracks || [], pl.title || '');

        const recs = pool
          .filter(t => !existingIds.has(String(t.id)))
          .map(t => ({
            t,
            sc: dnaEngine.scoreTrackForPlaylist(t, pl, centroid) + (hasRealHttpCover(t) ? 0.25 : 0)
          }))
          .sort((a, b) => b.sc - a.sc)
          .slice(0, 12)
          .map(x => x.t);

        this._dynamicPlaylistCarouselsMap[listKey] = recs;
        setTimeout(() => this._enrichCarouselCoversAsync(recs, listKey), 30);

        return `
          <div class="discover-carousel-section">
            <div class="discover-carousel-header">
              <div class="min-w-0 flex-1 pr-2">
                <h3 class="discover-carousel-title truncate">Para "${escapeHtmlSafe(pl.title)}"</h3>
                <p class="text-[11px] text-gray-400 truncate">Basadas en las ${(pl.tracks || []).length} canciones de tu playlist</p>
              </div>
              <button type="button" onclick="window.DiscoverHomeApp.startPlaylistDiscoverySwipeMode('${safeId}')" class="discover-playlist-swipe-cta cursor-pointer">
                ${SVG_ICONS.sparkles}
                <span>Descubrir</span>
              </button>
            </div>
            <div class="discover-carousel-scroll">
              ${recs.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, listKey)).join('')}
            </div>
          </div>
        `;
      });

      dynCont.innerHTML = sectionsHtml.join('');
    },

    _buildSmartCarouselCardHtml(tr, idx, listType) {
      const cover = getBestTrackCover(tr);
      return `
        <div class="spotify-carousel-card" onclick="window.DiscoverHomeApp.playFromCarousel('${listType}', ${idx})">
          <div class="spotify-carousel-cover-wrap">
            <img id="carouselCover_${listType}_${idx}" src="${cover}" onerror="this.onerror=null; this.src='./app_logo.png';" class="spotify-carousel-cover-img" alt="" loading="lazy">
            <button type="button" onclick="event.stopPropagation(); window.DiscoverHomeApp.launchPianoFromCarousel('${listType}', ${idx})" class="spotify-floating-piano-btn" title="Jugar al piano">
              ${SVG_ICONS.pianoSmall}
            </button>
          </div>
          <h4 class="spotify-carousel-title">${escapeHtmlSafe(tr.title)}</h4>
          <p class="spotify-carousel-artist">${escapeHtmlSafe(tr.artist)}</p>
        </div>
      `;
    },

    _getCarouselArrayByType(listType) {
      if (listType === 'because') return this._becauseLikedList;
      if (listType === 'weekly') return this._weeklyDiscoveryList;
      if (listType === 'piano') return this._pianoVirtuosoList;
      if (listType === 'energy') return this._highEnergyList;
      if (listType === 'gems') return this._hiddenGemsList;
      if (this._dynamicPlaylistCarouselsMap && this._dynamicPlaylistCarouselsMap[listType]) {
        return this._dynamicPlaylistCarouselsMap[listType];
      }
      return [];
    },

    playFromCarousel(listType, idx) {
      const arr = this._getCarouselArrayByType(listType);
      if (!Array.isArray(arr) || !arr[idx]) return;
      dualStreamEngine.loadQueueAndPlay(arr, idx, '');
    },

    launchPianoFromCarousel(listType, idx) {
      const arr = this._getCarouselArrayByType(listType);
      if (!Array.isArray(arr) || !arr[idx]) return;
      this.launchPianoGameForTrack(arr[idx]);
    },

    // =========================================================================
    // MODAL DE TODAS LAS CANCIONES DE FAVORITOS / PLAYLIST (ELEGIR UNA SIN SONAR ALEATORIA)
    // =========================================================================
    async openLikedSongsSheetModal() {
      const pool = this.getAllCandidatePool();
      let favTracks = pool.filter(t => dnaEngine.likes.has(String(t.id)) || (typeof window.favoriteIdsSet !== 'undefined' && window.favoriteIdsSet.has(t.id)));
      if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getAllFavorites === 'function') {
        const dbFavs = await window.IndexedDBStorage.getAllFavorites().catch(() => []) || [];
        const seen = new Set(favTracks.map(t => String(t.id)));
        for (const f of dbFavs) {
          if (f && f.id && !seen.has(String(f.id))) {
            seen.add(String(f.id));
            favTracks.push(f);
          }
        }
      }
      this._openTracksSheetModal({
        title: 'Tus Me Gusta',
        subtitle: `${favTracks.length} canciones guardadas · Elige cuál escuchar o tocar`,
        tracks: favTracks,
        playlistId: null
      });
    },

    async openUserPlaylistSheetModal(playlistId) {
      if (typeof window.IndexedDBStorage === 'undefined' || typeof window.IndexedDBStorage.getPlaylist !== 'function') return;
      const pl = await window.IndexedDBStorage.getPlaylist(playlistId).catch(() => null);
      if (!pl) return;
      const mapped = (pl.tracks || []).map(t => ({
        ...t,
        id: t.id || `pl_tr_${Date.now()}`,
        videoId: /^[a-zA-Z0-9_-]{11}$/.test(String(t.id || '')) ? t.id : (t.videoId || ''),
        thumbnail: t.thumbnail || t.cover_url || './app_logo.png'
      }));
      this._openTracksSheetModal({
        title: pl.title || 'Playlist',
        subtitle: `${mapped.length} canciones · Elige una canción o descubre nuevas`,
        tracks: mapped,
        playlistId: pl.id
      });
    },

    _openTracksSheetModal({ title, subtitle, tracks, playlistId }) {
      this._openedSheetTracks = Array.isArray(tracks) ? tracks : [];
      this._openedSheetTitle = title || 'Colección';
      this._openedSheetPlaylistId = playlistId || null;

      const modal = document.getElementById('spotifyPlaylistSheetModal');
      const titleEl = document.getElementById('plSheetTitle');
      const subEl = document.getElementById('plSheetSubtitle');
      const coverEl = document.getElementById('plSheetCoverImg');
      const discoverBtn = document.getElementById('plSheetDiscoverBtn');
      const listCont = document.getElementById('plSheetTracksList') || document.getElementById('plSheetTracksContainer');
      if (!modal || !listCont) return;

      if (titleEl) titleEl.textContent = this._openedSheetTitle;
      if (subEl) subEl.textContent = subtitle || `${this._openedSheetTracks.length} canciones`;
      if (coverEl) {
        coverEl.src = this._openedSheetTracks[0] ? getBestTrackCover(this._openedSheetTracks[0]) : './app_logo.png';
      }
      if (discoverBtn) {
        discoverBtn.classList.toggle('hidden', !playlistId);
      }

      if (this._openedSheetTracks.length === 0) {
        listCont.innerHTML = `
          <div class="p-6 text-center text-xs text-gray-400">
            Aún no hay canciones en esta lista. Pulsa <b>Descubrir canciones para esta playlist</b> para añadir temas deslizando a la derecha.
          </div>
        `;
      } else {
        listCont.innerHTML = this._openedSheetTracks.map((tr, idx) => {
          const thumb = getBestTrackCover(tr);
          return `
            <div onclick="window.DiscoverHomeApp.playSongFromOpenedSheet(${idx})" class="spotify-sheet-track-item">
              <span class="text-[11px] font-bold text-gray-500 w-5 text-center">${idx + 1}</span>
              <img src="${thumb}" onerror="this.onerror=null; this.src='./app_logo.png';" class="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-white/10" alt="">
              <div class="min-w-0 flex-1">
                <p class="text-xs font-extrabold text-white truncate">${escapeHtmlSafe(tr.title || 'Canción')}</p>
                <p class="text-[11px] text-gray-400 truncate">${escapeHtmlSafe(tr.artist || 'Artista')}</p>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <button type="button" onclick="event.stopPropagation(); window.DiscoverHomeApp.playSongFromOpenedSheet(${idx});" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer" title="Escuchar esta canción">
                  ${SVG_ICONS.play}
                </button>
                <button type="button" onclick="event.stopPropagation(); window.DiscoverHomeApp.playPianoFromOpenedSheet(${idx});" class="w-8 h-8 rounded-full bg-[#d4af37] text-black flex items-center justify-center cursor-pointer shadow" title="Jugar al piano">
                  ${SVG_ICONS.pianoSmall}
                </button>
              </div>
            </div>
          `;
        }).join('');
      }

      modal.classList.add('open');
    },

    closePlaylistTracksModal() {
      const modal = document.getElementById('spotifyPlaylistSheetModal');
      if (modal) modal.classList.remove('open');
    },

    playSongFromOpenedSheet(idx) {
      if (!Array.isArray(this._openedSheetTracks) || !this._openedSheetTracks[idx]) return;
      dualStreamEngine.loadQueueAndPlay(this._openedSheetTracks, idx, this._openedSheetTitle);
    },

    playPianoFromOpenedSheet(idx) {
      if (!Array.isArray(this._openedSheetTracks) || !this._openedSheetTracks[idx]) return;
      this.closePlaylistTracksModal();
      this.launchPianoGameForTrack(this._openedSheetTracks[idx]);
    },

    playAllFromOpenedSheet() {
      if (!Array.isArray(this._openedSheetTracks) || this._openedSheetTracks.length === 0) return;
      dualStreamEngine.loadQueueAndPlay(this._openedSheetTracks, 0, this._openedSheetTitle);
    },

    launchSwipeDiscoveryForOpenedSheet() {
      const plId = this._openedSheetPlaylistId;
      this.closePlaylistTracksModal();
      if (plId) {
        this.startPlaylistDiscoverySwipeMode(plId);
      } else {
        this.openSwipeTargetPlaylistModal();
      }
    },

    // Compatibilidad con llamadas antiguas: ahora abren todas las canciones para elegir una
    async playLikedSongsPlaylist() {
      await this.openLikedSongsSheetModal();
    },

    async playSavedUserPlaylist(playlistId) {
      await this.openUserPlaylistSheetModal(playlistId);
    },

    // =========================================================================
    // MODO TIKTOK/TINDER PARA PLAYLIST X ("BUSCAR CANCIONES PARA LA PLAYLIST X")
    // =========================================================================
    async openSwipeTargetPlaylistModal() {
      const modal = document.getElementById('cratePlaylistSelectorModal');
      const listCont = document.getElementById('cratePlaylistSelectorList');
      if (!modal || !listCont) return;

      let playlists = [];
      if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getAllPlaylists === 'function') {
        playlists = await window.IndexedDBStorage.getAllPlaylists().catch(() => []) || [];
      }

      if (playlists.length === 0) {
        listCont.innerHTML = `
          <div class="p-4 text-center text-xs text-gray-400">
            No tienes playlists creadas todavía. Crea una abajo para empezar a descubrir canciones deslizando a la derecha.
          </div>
        `;
      } else {
        listCont.innerHTML = playlists.map(pl => {
          const isSelected = this.targetPlaylistObj && String(this.targetPlaylistObj.id) === String(pl.id);
          const firstTrack = Array.isArray(pl.tracks) && pl.tracks[0] ? pl.tracks[0] : null;
          const cover = firstTrack ? getBestTrackCover(firstTrack) : './app_logo.png';
          const safeId = String(pl.id).replace(/'/g, "\\'");
          return `
            <div onclick="window.DiscoverHomeApp.startPlaylistDiscoverySwipeMode('${safeId}')" class="spotify-sheet-track-item ${isSelected ? 'border-[#10b981]/60 bg-[#10b981]/10' : ''}">
              <img src="${cover}" onerror="this.onerror=null; this.src='./app_logo.png';" class="w-11 h-11 rounded-lg object-cover flex-shrink-0" alt="">
              <div class="min-w-0 flex-1">
                <p class="text-xs font-extrabold text-white truncate">${escapeHtmlSafe(pl.title || 'Playlist')}</p>
                <p class="text-[11px] text-gray-400 truncate">${(pl.tracks || []).length} canciones · Recomendación inteligente</p>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3e5ab] text-[10px] font-extrabold">
                Elegir
              </span>
            </div>
          `;
        }).join('');
      }

      modal.classList.add('open');
    },

    closeSwipeTargetPlaylistModal() {
      const modal = document.getElementById('cratePlaylistSelectorModal');
      if (modal) modal.classList.remove('open');
    },

    async createQuickPlaylistForSwipeMode() {
      const name = prompt('Nombre de la nueva playlist para buscarle canciones en modo Swipe:');
      if (!name || !name.trim()) return;
      if (typeof window.IndexedDBStorage === 'undefined' || typeof window.IndexedDBStorage.putPlaylist !== 'function') return;
      const newPl = {
        id: 'pl_' + Date.now(),
        title: name.trim(),
        createdAt: Date.now(),
        tracks: []
      };
      await window.IndexedDBStorage.putPlaylist(newPl);
      this.closeSwipeTargetPlaylistModal();
      await this.startPlaylistDiscoverySwipeMode(newPl.id);
      this.refreshCarousels();
    },

    async startPlaylistDiscoverySwipeMode(playlistId) {
      if (!playlistId) return;
      this.closeSwipeTargetPlaylistModal();
      this.closePlaylistTracksModal();

      if (typeof window.switchMainTab === 'function') {
        window.switchMainTab('discover');
      }

      let pl = null;
      if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getPlaylist === 'function') {
        pl = await window.IndexedDBStorage.getPlaylist(playlistId).catch(() => null);
      }
      if (!pl) return;

      this.targetPlaylistId = pl.id;
      this.targetPlaylistObj = pl;
      this._syncTargetPlaylistHeaderUI();

      // Reconstruir el mazo basándose en todas las canciones de la playlist X y reproducir
      this.rebuildCrateDeck(true);

      const shell = document.querySelector('.crate-digger-shell');
      if (shell && typeof shell.scrollIntoView === 'function') {
        shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(`Modo Swipe para "${pl.title}": desliza a la derecha para añadir canciones`);
      }
    },

    clearSwipeTargetPlaylist() {
      this.targetPlaylistId = null;
      this.targetPlaylistObj = null;
      this._syncTargetPlaylistHeaderUI();
      this.rebuildCrateDeck(false);
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('Modo Descubrir general restaurado');
      }
    },

    _syncTargetPlaylistHeaderUI() {
      const btn = document.getElementById('cratePlaylistTargetBtn');
      const label = document.getElementById('cratePlaylistTargetLabel');
      const exitBtn = document.getElementById('crateExitPlaylistModeBtn');
      const hasTarget = Boolean(this.targetPlaylistObj);

      if (btn) btn.classList.toggle('active-target', hasTarget);
      if (label) {
        label.textContent = hasTarget
          ? `Añadiendo a: ${this.targetPlaylistObj.title}`
          : 'Buscar para playlist';
      }
      if (exitBtn) {
        exitBtn.classList.toggle('hidden', !hasTarget);
      }
    },

    async playYouTubeCollectionContinuous(playlistId, title = 'Colección') {
      try {
        if (typeof window.parseYouTubePlaylistClient === 'function') {
          const parsed = await window.parseYouTubePlaylistClient(playlistId);
          if (parsed && Array.isArray(parsed.tracks) && parsed.tracks.length > 0) {
            const tracks = parsed.tracks.map(t => ({
              id: `magic_yt_${t.id}`,
              videoId: t.id,
              title: t.title,
              artist: t.artist || 'Artista',
              thumbnail: t.thumbnail || `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`,
              source: 'magic_youtube',
              _isMagicKey: true
            }));
            this._openTracksSheetModal({
              title: parsed.title || title,
              subtitle: `${tracks.length} canciones · Elige una canción o pulsa Reproducir todo`,
              tracks,
              playlistId: null
            });
            return;
          }
        }
      } catch (_) {
        if (typeof window.showErrorToast === 'function') {
          window.showErrorToast('No se pudo cargar la colección.');
        }
      }
    },

    // =========================================================================
    // REPRODUCTOR COMPLETO + KARAOKE EN TIEMPO REAL + SALTO AL ESTRIBILLO
    // =========================================================================
    openNowPlayingModal(defaultTab = null) {
      const modal = document.getElementById('nowPlayingTurntableModal');
      if (!modal) return;
      modal.classList.add('open');
      if (defaultTab) {
        this.switchNowPlayingTab(defaultTab);
      }
      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (tr) {
        karaokeService.loadAndRenderTrackLyrics(tr, dualStreamEngine.getTrackFullDurationSec(tr)).catch(() => {});
      }
      dualStreamEngine._renderQueueListInModal();
    },

    closeNowPlayingModal() {
      const modal = document.getElementById('nowPlayingTurntableModal');
      if (modal) modal.classList.remove('open');
    },

    switchNowPlayingTab(tab = 'vinyl') {
      const isKaraoke = tab === 'karaoke';
      const vinylStage = document.getElementById('npTurntablePlatterInteractive') || document.getElementById('npVinylStageContainer');
      const karaokeStage = document.getElementById('npKaraokeStageContainer');
      const tabVinylBtn = document.getElementById('npTabVinylBtn');
      const tabKaraokeBtn = document.getElementById('npTabKaraokeBtn');

      if (vinylStage) vinylStage.classList.toggle('hidden', isKaraoke);
      if (karaokeStage) karaokeStage.classList.toggle('hidden', !isKaraoke);
      if (tabVinylBtn) tabVinylBtn.classList.toggle('active', !isKaraoke);
      if (tabKaraokeBtn) tabKaraokeBtn.classList.toggle('active', isKaraoke);

      if (isKaraoke) {
        const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
        if (tr) {
          karaokeService.loadAndRenderTrackLyrics(tr, dualStreamEngine.getTrackFullDurationSec(tr)).then(() => {
            karaokeService.syncTime(dualStreamEngine.getCurrentSongTimeSec());
          }).catch(() => {});
        }
      }
    },

    openKaraokeForCurrent() {
      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (tr && !dualStreamEngine.isPlaying()) {
        dualStreamEngine.playTrack(tr);
      }
      this.openNowPlayingModal('karaoke');
    },

    openKaraokeFromMiniPlayer(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      this.openNowPlayingModal('karaoke');
    },

    seekToKaraokeLine(lineIdx) {
      const line = karaokeService.currentLyrics?.[lineIdx];
      if (!line) return;
      dualStreamEngine.seekToSeconds(line.timeSec);
    },

    jumpToChorus() {
      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (!tr) return;
      const chorusSec = dualStreamEngine.getChorusOffsetSec(tr);
      dualStreamEngine.seekToSeconds(chorusSec);
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('Saltando al estribillo principal');
      }
    },

    toggleSmartShuffle() {
      dualStreamEngine.smartShuffleEnabled = !dualStreamEngine.smartShuffleEnabled;
      const btn = document.getElementById('npSmartShuffleBtn');
      if (btn) {
        btn.classList.toggle('active', dualStreamEngine.smartShuffleEnabled);
      }
    },

    toggleQueueDrawerInModal() {
      const drawer = document.getElementById('npQueueDrawerSection');
      if (!drawer) return;
      drawer.classList.toggle('hidden');
      dualStreamEngine._renderQueueListInModal();
    },

    playQueueIndex(idx) {
      if (!dualStreamEngine.queue[idx]) return;
      dualStreamEngine.queueIndex = idx;
      dualStreamEngine.playTrack(dualStreamEngine.queue[idx], { syncQueue: false });
      dualStreamEngine._renderQueueListInModal();
    },

    removeTrackFromQueue(idx) {
      if (idx < 0 || idx >= dualStreamEngine.queue.length) return;
      dualStreamEngine.queue.splice(idx, 1);
      if (dualStreamEngine.queueIndex >= dualStreamEngine.queue.length) {
        dualStreamEngine.queueIndex = Math.max(0, dualStreamEngine.queue.length - 1);
      }
      dualStreamEngine._renderQueueListInModal();
    },

    toggleLikeCurrentPlayerTrack() {
      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (!tr) return;
      dnaEngine.recordLike(tr);
      if (typeof window.toggleFavoriteSong === 'function') {
        window.toggleFavoriteSong(tr.id, tr);
      }
      dualStreamEngine._updatePlayerMetadataUI(tr);
      this.refreshCarousels();
    },

    renderCarousels() {
      return this.refreshCarousels();
    },

    toggleLikeCurrentPlaying(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      this.toggleLikeCurrentPlayerTrack();
    },

    togglePlayPauseMini(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (!dualStreamEngine.currentTrack) {
        const top = this.getActiveCrateTrack();
        if (top) {
          dualStreamEngine.playTrack(top, { autoPlay: true, isCratePreview: true, syncQueue: false });
          return;
        }
      }
      dualStreamEngine.togglePlayPause();
    },

    nextTrackMini(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (dualStreamEngine.queue.length > 0) {
        dualStreamEngine.nextTrack();
      } else {
        this.swipeLeftPass();
      }
    },

    prevTrackModal(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      dualStreamEngine.prevTrack();
    },

    playPianoFromNowPlaying(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      this.launchPianoForCurrentPlayerTrack();
    },

    createRadioFromNowPlaying() {
      this.startRadioFromPlayerTrack();
    },

    openAddToPlaylistFromNowPlaying() {
      this.openPlaylistOrQueueForPlayerTrack();
    },

    toggleNowPlayingQueueDrawer() {
      this.toggleQueueDrawerInModal();
    },

    onNowPlayingScrub(val) {
      const pct = Math.max(0, Math.min(100, Number(val) || 0));
      dualStreamEngine.seekToRatio(pct / 100);
    },

    onTurntablePlatterScratch(e) {
      this.togglePlayPauseMini(e);
    }
  };

  window.DiscoverHomeApp = DiscoverHomeApp;
})();


