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

      // 4 Diales del Amplificador de Válvulas (0 a 100)
      this.dials = {
        discovery: 35, // 0 = Mis gustos seguros, 100 = Sorpréndeme (UCB1 exploration)
        energy: 60,    // 0 = Calma/Adagio, 100 = Alta Energía/Presto
        era: 55,       // 0 = Vintage 1928-1977, 50 = 80s-90s, 100 = Actual 2000s-2026
        vocal: 55      // 0 = Instrumental/Piano Solo, 100 = Vocal/Himnos
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

    /**
     * Codifica cualquier canción en el Vector Normalizado de 8 Dimensiones:
     * [BPM_Norm, Energy, Era_Decade, Vocal_Weight, Rock_Affinity, Electronic_Affinity, Pop_Latin_Affinity, Classical_Piano_Affinity]
     */
    encodeTrackVector(track) {
      if (track && Array.isArray(track._dnaVector8D) && track._dnaVector8D.length === 8) {
        return track._dnaVector8D;
      }
      const title = String(track?.title || '').toLowerCase();
      const artist = String(track?.artist || '').toLowerCase();
      const genre = String(track?.genre || track?.category || '').toLowerCase();
      const combined = `${title} ${artist} ${genre}`;

      // 1. BPM Normalizado (corrigiendo BPMs doblados de UltraStar como 280-400 -> 90-180)
      let rawBpm = Number(track?.bpm) || 120;
      while (rawBpm > 205) rawBpm *= 0.5;
      while (rawBpm < 58) rawBpm *= 2.0;
      const bpmNorm = Math.max(0.08, Math.min(0.98, (rawBpm - 60) / 135));

      // 2. Afinidades de Género (Dimensiones 4, 5, 6, 7)
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

      // 3. Peso Vocal vs Instrumental (Dimensión 3)
      let vocalWeight = 0.78;
      if (classicalPianoAff >= 0.85 && !/\b(sinatra|billy joel|elton john|elvis|queen|ray charles|nina simone)\b/i.test(combined)) {
        vocalWeight = 0.08;
      } else if (/\b(instrumental|nocturne|sonata|symphony|ost|megalovania|bfg division|sweden|sealed vessel|camellia|kobaryo|freedom dive|galaxy collapse)\b/i.test(combined)) {
        vocalWeight = 0.14;
      } else if (elecAff >= 0.85 && !/\b(avicii|alan walker|zedd|marshmello)\b/i.test(combined)) {
        vocalWeight = 0.30;
      }

      // 4. Década / Época (Dimensión 2: 0.0 = Clásico/Pre-1970, 0.35 = 1970s, 0.55 = 1980s-90s, 0.88 = 2010s-2020s)
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

      // 5. Energía (Dimensión 1)
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

    /**
     * Calcula el Vector Objetivo Efectivo combinando el UserMusicDNA aprendido
     * con los 4 Diales del Amplificador de Válvulas.
     */
    getEffectiveTargetVector() {
      const u = [...this.userVector];
      const energyDialNorm = this.dials.energy / 100; // 0..1
      const eraDialNorm = this.dials.era / 100;       // 0..1
      const vocalDialNorm = this.dials.vocal / 100;   // 0..1

      // Modular dimensiones con los diales activos (peso 55% dial + 45% ADN histórico)
      u[0] = Math.max(0.05, Math.min(0.98, u[0] * 0.45 + energyDialNorm * 0.55));
      u[1] = Math.max(0.05, Math.min(0.98, u[1] * 0.40 + energyDialNorm * 0.60));
      u[2] = Math.max(0.05, Math.min(0.98, u[2] * 0.40 + eraDialNorm * 0.60));
      u[3] = Math.max(0.05, Math.min(0.98, u[3] * 0.35 + vocalDialNorm * 0.65));

      // Si el dial Vocal se gira hacia Instrumental (< 35%), potenciar Classical_Piano_Affinity
      if (vocalDialNorm < 0.35) {
        u[7] = Math.min(0.98, u[7] + (0.35 - vocalDialNorm) * 0.85);
      }

      // Restar penalización de sesión para sub-estilos descartados recientemente
      for (let i = 0; i < 8; i++) {
        u[i] = Math.max(0.05, Math.min(0.98, u[i] - (this.sessionPenaltyVector[i] || 0)));
      }
      return u;
    }

    /**
     * Similitud de Coseno Real en 8 Dimensiones:
     * cos(theta) = (A · B) / (||A|| * ||B||)
     */
    cosineSimilarity(vecA, vecB) {
      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < 8; i++) {
        const a = Number(vecA[i]) || 0;
        const b = Number(vecB[i]) || 0;
        dot += a * b;
        normA += a * a;
        normB += b * b;
      }
      if (normA <= 1e-9 || normB <= 1e-9) return 0.5;
      return Math.max(0, Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB))));
    }

    /**
     * Puntúa una canción combinando Similitud de Coseno 8D + Algoritmo Multi-Armed Bandit (UCB1)
     */
    scoreTrackForRecommendation(track, targetVec = null) {
      const effUserVec = targetVec || this.getEffectiveTargetVector();
      const trackVec = this.encodeTrackVector(track);
      const cosSim = this.cosineSimilarity(effUserVec, trackVec);

      const cluster = track._dnaCluster || 'pop_latin';
      const arm = this.banditArms[cluster] || { pulls: 2, rewardSum: 1.2 };
      const totalPulls = Object.values(this.banditArms).reduce((acc, a) => acc + (a.pulls || 1), 0);

      // Coeficiente de exploración c controlado por el Dial 1 (Nivel de Descubrimiento: 0 = Seguro, 100 = Sorpréndeme)
      const discoveryRatio = this.dials.discovery / 100;
      const c = 0.15 + discoveryRatio * 1.45;
      const meanReward = arm.rewardSum / Math.max(1, arm.pulls);
      const ucbBonus = Math.min(1.25, meanReward + c * Math.sqrt((2 * Math.log(totalPulls + 1)) / Math.max(1, arm.pulls)));

      // Ponderación híbrida entre explotación (Coseno) y exploración (UCB1)
      const exploitWeight = 1 - (discoveryRatio * 0.48);
      const exploreWeight = discoveryRatio * 0.48;
      let finalScore = (cosSim * exploitWeight) + ((ucbBonus / 1.25) * exploreWeight);

      // Penalizar si fue descartada explícitamente
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
        // Relajar penalización de sesión en dimensiones reforzadas positivamente
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
      this.saveToStorage(true);
    }
  }

  // =========================================================================
  // 4. DUAL-STREAM AUDIO ENGINE (PREVIEW <100ms + PRECARGA HD + CROSSFADE + MEDIA SESSION)
  // =========================================================================
  class DualStreamAudioEngine {
    constructor(graphService, dnaEngine) {
      this.graphService = graphService;
      this.dnaEngine = dnaEngine;

      // Dos canales de reproducción para Handoff / Crossfade sin cortes
      this.previewAudio = new Audio();
      this.previewAudio.preload = 'auto';
      this.previewAudio.crossOrigin = 'anonymous';

      this.fullAudio = new Audio();
      this.fullAudio.preload = 'auto';

      this.activeSourceType = 'none'; // 'preview' | 'full'
      this.currentTrack = null;
      this.isPlayingFlag = false;
      this.isCrossfading = false;
      this.fullTrackReady = false;
      this.fullTrackBlob = null;
      this.fullTrackObjectUrl = null;

      this.queue = [];
      this.queueIndex = -1;
      this.smartShuffleEnabled = false;
      this.wasPlayingBeforeGame = false;

      // Pre-fetch cache para las siguientes tarjetas del mazo (0ms swipe como TikTok)
      this.prewarmedPreviewMap = new Map(); // trackId -> { audioEl, previewUrl, artworkUrl600 }
      this.fullTrackInflightMap = new Map(); // trackId -> Promise<Blob>

      this.listenTimerInterval = null;
      this.listenedSecondsOnCurrent = 0;
      this.vuAnimFrameId = null;
      this._playRequestId = 0;

      this._bindAudioEvents();
      this._initMediaSession();
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

    _bindAudioEvents() {
      const onTimeUpdate = () => {
        const activeEl = this.getActiveAudioElement();
        if (!activeEl || !this.currentTrack) return;
        const cur = Number(activeEl.currentTime) || 0;
        const dur = Number(activeEl.duration) || (this.activeSourceType === 'preview' ? 30 : (this.currentTrack.durationSec || 180));

        // Si estamos en preview, el audio completo ya está listo (canplaythrough) y el preview va por >= 26s,
        // hacer handoff/crossfade transparente hacia la pista completa sin corte
        if (this.activeSourceType === 'preview' && this.fullTrackReady && !this.isCrossfading && cur >= Math.max(12, dur - 3.2)) {
          this._performTransparentHandoffToFullTrack(cur);
        }

        this._updatePlayerProgressUI(cur, dur);
        this._updateMediaSessionPosition(cur, dur);
      };

      this.previewAudio.addEventListener('timeupdate', () => {
        if (this.activeSourceType === 'preview') onTimeUpdate();
      });
      this.fullAudio.addEventListener('timeupdate', () => {
        if (this.activeSourceType === 'full') onTimeUpdate();
      });

      this.previewAudio.addEventListener('ended', () => {
        if (this.activeSourceType !== 'preview') return;
        if (this.fullTrackReady) {
          this._performTransparentHandoffToFullTrack(30);
        } else {
          this.nextTrack();
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
     * Fase 1 (<100ms) + Fase 2 (Background Full Buffer) + Fase 3 (Transparent Crossfade)
     */
    async playTrack(track, options = {}) {
      if (!track) return false;
      const reqId = ++this._playRequestId;
      this.currentTrack = track;
      this.fullTrackReady = false;
      this.fullTrackBlob = null;
      this.isCrossfading = false;

      // Silenciar siempre la música de ambiente del menú para evitar solapamientos
      if (typeof window.pauseMenuAmbientMusic === 'function') {
        window.pauseMenuAmbientMusic();
      }
      if (typeof window.stopPreviewCandidateAudio === 'function') {
        window.stopPreviewCandidateAudio(false);
      }

      this._stopBothChannelsImmediate();

      // Si no está en la cola actual y se reproduce individualmente, asegurar que tenga contexto en la cola
      if (options.syncQueue !== false) {
        const idxInQ = this.queue.findIndex(t => t && String(t.id) === String(track.id));
        if (idxInQ !== -1) {
          this.queueIndex = idxInQ;
        } else {
          this.queue.unshift(track);
          this.queueIndex = 0;
        }
      }

      this._updatePlayerMetadataUI(track, 'CARGANDO STREAM...');
      this._updateMediaSessionMetadata(track);

      // Comprobar si ya tenemos el Blob completo en caché de memoria (_fullTrackBlobCache)
      const cachedFullBlob = this._getCachedFullBlobForTrack(track);
      if (cachedFullBlob && cachedFullBlob.size >= 100000) {
        this.fullTrackBlob = cachedFullBlob;
        this.fullTrackReady = true;
        const startedFull = await this._startChannelWithFadeIn(this.fullAudio, cachedFullBlob, 'full', reqId, options.startOffsetSec || 0, 300);
        if (startedFull) {
          this._updatePlayerMetadataUI(track, 'HD COMPLETA · SIN CORTES');
          this._startListenTracker();
          this._startVuMeterLoop();
          return true;
        }
      }

      // FASE 1: Arranque instantáneo (<100ms) del previewUrl con fade-in suave de 300ms
      let previewUrl = track.previewUrl || track.preview_url || '';
      const prewarmed = this.prewarmedPreviewMap.get(String(track.id));
      if (prewarmed && prewarmed.previewUrl) {
        previewUrl = prewarmed.previewUrl;
      }

      if (!previewUrl || String(previewUrl).startsWith('yt_full://')) {
        const enriched = await this.graphService.enrichTrackMetadata(track).catch(() => null);
        if (reqId !== this._playRequestId) return false;
        if (enriched && enriched.previewUrl) {
          previewUrl = enriched.previewUrl;
        }
      }

      let previewStarted = false;
      if (previewUrl && /^https?:\/\//i.test(previewUrl)) {
        previewStarted = await this._startChannelWithFadeIn(this.previewAudio, previewUrl, 'preview', reqId, 0, 300);
        if (previewStarted) {
          this._updatePlayerMetadataUI(track, 'DUAL-STREAM · PREVIEW 30s');
          this._startListenTracker();
          this._startVuMeterLoop();
        }
      }

      // FASE 2: En el mismo milisegundo, iniciar en segundo plano la descarga del audio completo HD
      this.preloadFullTrackInBackground(track).then(async (blob) => {
        if (reqId !== this._playRequestId || !blob || blob.size < 80000) return;
        this.fullTrackBlob = blob;
        this.fullTrackReady = true;

        // Preparar fullAudio en memoria para cuando llegue el handoff
        if (this.fullTrackObjectUrl) {
          try { URL.revokeObjectURL(this.fullTrackObjectUrl); } catch (_) {}
        }
        this.fullTrackObjectUrl = URL.createObjectURL(blob);
        this.fullAudio.src = this.fullTrackObjectUrl;
        this.fullAudio.load();

        // Actualizar indicador de estado HD listo
        this._updatePlayerMetadataUI(track, 'HD COMPLETA LISTA');

        // Si el preview no había podido arrancar (ej. tema exclusivo de YouTube sin preview en iTunes), arrancar el fullAudio inmediatamente
        if (!this.isPlayingFlag || this.activeSourceType === 'none') {
          const ok = await this._startChannelWithFadeIn(this.fullAudio, blob, 'full', reqId, 0, 300);
          if (ok) {
            this._updatePlayerMetadataUI(track, 'HD COMPLETA · ACTIVA');
            this._startListenTracker();
            this._startVuMeterLoop();
          }
        }
      }).catch(() => {});

      return previewStarted;
    }

    async _startChannelWithFadeIn(audioEl, srcOrBlob, channelType, reqId, startSec = 0, fadeInMs = 300) {
      if (reqId !== this._playRequestId) return false;
      try {
        if (srcOrBlob instanceof Blob) {
          if (this.fullTrackObjectUrl) {
            try { URL.revokeObjectURL(this.fullTrackObjectUrl); } catch (_) {}
          }
          this.fullTrackObjectUrl = URL.createObjectURL(srcOrBlob);
          audioEl.src = this.fullTrackObjectUrl;
        } else {
          if (audioEl.src !== srcOrBlob) {
            audioEl.src = srcOrBlob;
          }
        }

        const targetVol = this._getMasterVolume();
        audioEl.volume = 0.01;
        if (startSec > 0) {
          try { audioEl.currentTime = startSec; } catch (_) {}
        }

        await audioEl.play();
        if (reqId !== this._playRequestId) {
          audioEl.pause();
          return false;
        }

        this.activeSourceType = channelType;
        this.isPlayingFlag = true;
        this._syncPlayPauseIcons(true);

        // Fade-in suave de 300ms
        const steps = 12;
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
      } catch (err) {
        return false;
      }
    }

    /**
     * FASE 3: Handoff / Crossfade de potencia constante entre el preview y la canción completa HD
     */
    async _performTransparentHandoffToFullTrack(targetPositionSec = 30) {
      if (this.isCrossfading || !this.fullTrackReady || !this.fullAudio.src) return;
      this.isCrossfading = true;
      const reqId = this._playRequestId;
      const masterVol = this._getMasterVolume();

      try {
        const fullDur = Number(this.fullAudio.duration) || 180;
        const safeSeek = Math.min(Math.max(0, targetPositionSec), Math.max(0, fullDur - 10));
        try {
          this.fullAudio.currentTime = safeSeek;
        } catch (_) {}
        this.fullAudio.volume = 0.01;
        await this.fullAudio.play();

        const steps = 16;
        const stepMs = 35; // ~560ms crossfade de potencia constante (sin/cos)
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
            if (this.currentTrack) {
              this._updatePlayerMetadataUI(this.currentTrack, 'HD COMPLETA · ACTIVA');
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
      if (!track || !blob || blob.size < 80000) return;
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

    /**
     * Descarga en segundo plano el archivo de audio completo de alta fidelidad (CDN Oficial o Stream YouTube)
     * para Handoff continuo y para saltar la pantalla de espera al pulsar ¡JUGAR AL PIANO!
     */
    async preloadFullTrackInBackground(track) {
      if (!track) return null;
      const existing = this._getCachedFullBlobForTrack(track);
      if (existing && existing.size >= 100000) return existing;

      const trackKey = String(track.id || `${track.title}_${track.artist}`);
      if (this.fullTrackInflightMap.has(trackKey)) {
        return this.fullTrackInflightMap.get(trackKey);
      }

      const task = (async () => {
        try {
          // 1. Comprobar IndexedDBStorage primero
          if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getChart === 'function') {
            const rawId = String(track.id || '').replace(/^top_/, '');
            const cachedChart = await window.IndexedDBStorage.getChart(track.id).catch(() => null) ||
                                await window.IndexedDBStorage.getChart(`top_${rawId}`).catch(() => null);
            if (cachedChart && cachedChart.audioBlob && cachedChart.audioBlob.size >= 100000) {
              this._storeFullBlobInGlobalCache(track, cachedChart.audioBlob);
              return cachedChart.audioBlob;
            }
          }

          // 2. Si es una canción del catálogo Top (alojada en nuestros Releases CDN de GitHub)
          const isTop = Boolean(track.is_top_song || String(track.id || '').startsWith('top_') || track.audio_url);
          if (isTop) {
            const rawId = String(track.raw_id || track.id || '').replace(/^top_/, '');
            const audioFilename = track.audio_url || `${rawId}.mp3`;
            const myWorker = (u) => `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(u)}`;
            const preferredTags = ['8', '3', '4', '5', '6', '7', '9', '10', '11', '12', '13', '14', '15'];
            for (const tag of preferredTags) {
              const cUrl = `https://github.com/Bruala33/renacer/releases/download/${tag}/${audioFilename}`;
              try {
                const resp = await fetch(myWorker(cUrl));
                if (resp.ok) {
                  const blob = await resp.blob();
                  if (blob && blob.size >= 80000) {
                    this._storeFullBlobInGlobalCache(track, blob);
                    return blob;
                  }
                }
              } catch (_) {}
            }
          }

          // 3. Si es canción comunitaria local (/songs/<id>/audio.mp3)
          if (String(track.id || '').startsWith('comm_')) {
            const folder = String(track.id).replace(/^comm_/, '');
            const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
            for (const path of [`${baseUrl}/songs/${folder}/audio.mp3`, `./songs/comm_${folder}/audio.mp3`, `./songs/${folder}/audio.mp3`]) {
              try {
                const resp = await fetch(path);
                if (resp.ok) {
                  const blob = await resp.blob();
                  if (blob && blob.size >= 80000) {
                    this._storeFullBlobInGlobalCache(track, blob);
                    return blob;
                  }
                }
              } catch (_) {}
            }
          }

          // 4. Extracción multi-fuente / YouTube en segundo plano si está disponible
          if (typeof window.extractSongAudioMultiSource === 'function') {
            const extracted = await window.extractSongAudioMultiSource(track.title, track.artist, track.thumbnail || '');
            if (extracted && extracted.blob && extracted.blob.size >= 80000) {
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
     * Cola de Pre-Fetch Inteligente (Estilo TikTok):
     * Mantiene pre-cargados en memoria los previews, las carátulas 600x600 y el buffer de las siguientes tarjetas.
     */
    async prewarmUpcomingCards(tracksSlice = []) {
      if (!Array.isArray(tracksSlice) || tracksSlice.length === 0) return;
      const nextCards = tracksSlice.slice(0, 3);

      for (let i = 0; i < nextCards.length; i++) {
        const tr = nextCards[i];
        if (!tr || !tr.id) continue;
        const idStr = String(tr.id);

        this.graphService.enrichTrackMetadata(tr).then((meta) => {
          const artUrl = (meta && meta.artworkUrl600) || tr.thumbnail || tr.cover_url;
          if (artUrl && !artUrl.startsWith('data:')) {
            const img = new Image();
            img.src = artUrl;
          }
          const prevUrl = (meta && meta.previewUrl) || tr.previewUrl || tr.preview_url;
          if (prevUrl && /^https?:\/\//i.test(prevUrl) && !this.prewarmedPreviewMap.has(idStr)) {
            if (this.prewarmedPreviewMap.size >= 8) {
              const oldest = this.prewarmedPreviewMap.keys().next().value;
              if (oldest) this.prewarmedPreviewMap.delete(oldest);
            }
            const preAudio = new Audio();
            preAudio.preload = 'auto';
            preAudio.src = prevUrl;
            this.prewarmedPreviewMap.set(idStr, {
              audioEl: preAudio,
              previewUrl: prevUrl,
              artworkUrl600: artUrl
            });
          }
        }).catch(() => {});

        // Pre-bufferizar también el audio completo de la siguiente tarjeta inmediata (#0)
        if (i === 0) {
          setTimeout(() => {
            if (!window.isGameLoadingOrActive) {
              this.preloadFullTrackInBackground(tr).catch(() => {});
            }
          }, 350);
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

    async seekToRatio(ratio) {
      const clamped = Math.max(0, Math.min(0.995, Number(ratio) || 0));
      // Si el usuario mueve la aguja más allá de los 30s (o en cualquier punto) y el audio completo está listo, pasar a fullAudio
      if (this.activeSourceType === 'preview' && this.fullTrackReady && this.fullAudio.src) {
        const fullDur = Number(this.fullAudio.duration) || (this.currentTrack?.durationSec || 180);
        const targetSec = clamped * fullDur;
        await this._performTransparentHandoffToFullTrack(targetSec);
        return;
      }
      const activeEl = this.getActiveAudioElement();
      if (!activeEl) return;
      const dur = Number(activeEl.duration) || 30;
      try {
        activeEl.currentTime = clamped * dur;
      } catch (_) {}
      this._updatePlayerProgressUI(activeEl.currentTime || 0, dur);
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
      const activeEl = this.getActiveAudioElement();
      if (activeEl && activeEl.currentTime > 4) {
        activeEl.currentTime = 0;
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
      this.prewarmUpcomingCards(this.queue.slice(this.queueIndex + 1, this.queueIndex + 4));
      this._renderQueueListInModal();
      if (contextLabel && typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(`🎧 Reproduciendo: ${contextLabel} (${tracksArray.length} pistas)`);
      }
    }

    /**
     * MÓDULO 7: Silencia y pausa automáticamente el reproductor musical con un fade-out limpio de 200ms
     * cuando arranque una partida de piano, restaurando su estado al volver al menú.
     */
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

    // =========================================================================
    // MEDIA SESSION API (CONTROLES DE PANTALLA BLOQUEADA Y SEGUNDO PLANO)
    // =========================================================================
    _initMediaSession() {
      if (!('mediaSession' in navigator)) return;
      try {
        navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
        navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.prevTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          const activeEl = this.getActiveAudioElement();
          if (activeEl && details && Number.isFinite(details.seekTime)) {
            activeEl.currentTime = details.seekTime;
          }
        });
      } catch (_) {}
    }

    _updateMediaSessionMetadata(track) {
      if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined' || !track) return;
      try {
        const cover = track.artworkUrl600 || track.thumbnail || track.cover_url || './app_logo.png';
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title || 'Piano Community',
          artist: track.artist || 'Chopin & Co 1928',
          album: track.album || 'Piano Community · Las Vegas 1977',
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

    // =========================================================================
    // ACTUALIZACIÓN VISUAL DE MINI-PLAYER, TOCADISCOS Y VÚMETROS ANALÓGICOS
    // =========================================================================
    _formatTime(sec) {
      const s = Math.max(0, Math.floor(Number(sec) || 0));
      const m = Math.floor(s / 60);
      const r = String(s % 60).padStart(2, '0');
      return `${m}:${r}`;
    }

    _updatePlayerMetadataUI(track, statusLabel = 'DUAL-STREAM') {
      if (!track) return;
      const miniEl = document.getElementById('spotifyMiniPlayer');
      if (miniEl && !window.isGameLoadingOrActive) {
        miniEl.classList.remove('hidden-player');
      }

      const cover = track.artworkUrl600 || track.thumbnail || track.cover_url || './app_logo.png';
      const isFav = (typeof window.favoriteIdsSet !== 'undefined' && window.favoriteIdsSet.has(track.id)) ||
                    this.dnaEngine.likes.has(String(track.id));

      // Mini-Player DOM
      const miniCover = document.getElementById('miniPlayerCoverImg');
      if (miniCover) miniCover.src = cover;
      const miniTitle = document.getElementById('miniPlayerTitle');
      if (miniTitle) miniTitle.textContent = track.title || 'Canción';
      const miniArtist = document.getElementById('miniPlayerArtist');
      if (miniArtist) miniArtist.textContent = track.artist || 'Artista';
      const miniBadge = document.getElementById('miniPlayerStreamBadge');
      if (miniBadge) miniBadge.textContent = statusLabel;
      const miniLikeBtn = document.getElementById('miniPlayerLikeBtn');
      if (miniLikeBtn) {
        miniLikeBtn.style.color = isFav ? '#34d399' : '#cbb894';
      }

      // Now Playing Full-Screen Turntable DOM
      const npCover = document.getElementById('npTurntableCoverImg');
      if (npCover) npCover.src = cover;
      const npTitle = document.getElementById('npTrackTitle') || document.getElementById('npTurntableTitle');
      if (npTitle) npTitle.textContent = track.title || 'Canción';
      const npArtist = document.getElementById('npTrackArtist') || document.getElementById('npTurntableArtist');
      if (npArtist) npArtist.textContent = track.artist || 'Artista';
      const npBadge = document.getElementById('npHeaderPhaseBadge') || document.getElementById('npTurntableStreamBadge');
      if (npBadge) npBadge.textContent = statusLabel;
      const npMeta = document.getElementById('npTrackMetaTags') || document.getElementById('npTurntableDnaMatch');
      if (npMeta) {
        const bpm = Math.round(Number(track.bpm) || 120);
        const stars = (Number(track.stars) || 3.8).toFixed(1);
        npMeta.textContent = `🧬 ${track._dnaMatchPct || 94}% ADN · ${bpm} BPM · ★ ${stars}`;
      }
      const npLikeBtn = document.getElementById('npLikeBtn');
      if (npLikeBtn) {
        npLikeBtn.textContent = isFav ? '♥' : '♡';
        npLikeBtn.style.color = isFav ? '#34d399' : '#f3d791';
      }
      if (miniLikeBtn) {
        miniLikeBtn.textContent = isFav ? '♥' : '♡';
      }

      // Crate Digger badge si la canción actual es la tarjeta superior
      const crateStreamBadge = document.getElementById('crateActiveStreamStatus');
      if (crateStreamBadge && window.DiscoverHomeApp && window.DiscoverHomeApp.getActiveCrateTrack()?.id === track.id) {
        crateStreamBadge.textContent = statusLabel;
      }
    }

    _updatePlayerProgressUI(curSec, durSec) {
      const safeDur = Math.max(1, Number(durSec) || 30);
      const ratio = Math.max(0, Math.min(1, curSec / safeDur));
      const pct = (ratio * 100).toFixed(1) + '%';

      const miniFill = document.getElementById('miniPlayerProgressFill');
      if (miniFill) miniFill.style.width = pct;
      const miniTime = document.getElementById('miniPlayerTimeText');
      if (miniTime) miniTime.textContent = `${this._formatTime(curSec)} / ${this._formatTime(safeDur)}`;

      const npFill = document.getElementById('npTurntableProgressFill');
      if (npFill) npFill.style.width = pct;
      const npSlider = document.getElementById('npTurntableScrubSlider');
      if (npSlider && !npSlider._isDragging) npSlider.value = String((ratio * 100).toFixed(1));
      const npCur = document.getElementById('npCurrentTimeText') || document.getElementById('npTurntableCurTime');
      if (npCur) npCur.textContent = this._formatTime(curSec);
      const npDur = document.getElementById('npDurationTimeText') || document.getElementById('npTurntableTotTime');
      if (npDur) npDur.textContent = this._formatTime(safeDur);

      // Mover el ángulo físico de la aguja del tocadiscos según el compás actual (de 16deg borde exterior a 40deg surco interior)
      const npArm = document.getElementById('npTurntableTonearmRod');
      if (npArm) {
        const angle = this.isPlaying() ? (16 + ratio * 24) : 2;
        npArm.style.transform = `rotate(${angle.toFixed(1)}deg)`;
      }
    }

    _syncPlayPauseIcons(playing) {
      const miniVinyl = document.getElementById('miniPlayerVinylDisc');
      if (miniVinyl) miniVinyl.classList.toggle('spinning', playing);
      const npVinyl = document.getElementById('npTurntableVinylDisc');
      if (npVinyl) npVinyl.classList.toggle('spinning', playing);
      const crateVinyl = document.getElementById('crateMainVinylDisc');
      if (crateVinyl) crateVinyl.classList.toggle('spinning', playing);
      const crateArm = document.getElementById('crateMainTonearmRod');
      if (crateArm) crateArm.classList.toggle('engaged', playing);
      document.querySelectorAll('.cassette-reel').forEach(r => r.classList.toggle('spinning', playing));

      const iconHtml = playing
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>';

      const miniBtn = document.getElementById('miniPlayerPlayPauseBtn');
      if (miniBtn) miniBtn.innerHTML = iconHtml;
      const npBtn = document.getElementById('npPlayPauseMainBtn') || document.getElementById('npTurntablePlayPauseBtn');
      if (npBtn) npBtn.innerHTML = iconHtml;
      const cratePlayPreviewBtn = document.getElementById('cratePreviewToggleBtn');
      if (cratePlayPreviewBtn) cratePlayPreviewBtn.innerHTML = playing ? '⏸ PAUSAR ESCUCHA' : '▶ ESCUCHAR PISTA';
    }

    _startVuMeterLoop() {
      if (this.vuAnimFrameId) cancelAnimationFrame(this.vuAnimFrameId);
      const tick = () => {
        const playing = this.isPlaying();
        const t = performance.now() * 0.008;
        const leftDeg = playing ? (-18 + Math.sin(t * 1.7) * 18 + Math.cos(t * 3.1) * 9) : -32;
        const rightDeg = playing ? (-16 + Math.cos(t * 1.9) * 17 + Math.sin(t * 2.7) * 10) : -32;

        const vuL = document.getElementById('crateVuNeedleL');
        const vuR = document.getElementById('crateVuNeedleR');
        if (vuL) vuL.style.transform = `rotate(${leftDeg.toFixed(1)}deg)`;
        if (vuR) vuR.style.transform = `rotate(${rightDeg.toFixed(1)}deg)`;

        const npVuL = document.getElementById('npVuNeedleL');
        const npVuR = document.getElementById('npVuNeedleR');
        if (npVuL) npVuL.style.transform = `rotate(${leftDeg.toFixed(1)}deg)`;
        if (npVuR) npVuR.style.transform = `rotate(${rightDeg.toFixed(1)}deg)`;

        if (playing) {
          this.vuAnimFrameId = requestAnimationFrame(tick);
        }
      };
      this.vuAnimFrameId = requestAnimationFrame(tick);
    }

    _renderQueueListInModal() {
      const cont = document.getElementById('npQueueListContainer');
      const countBadge = document.getElementById('npQueueCountBadge');
      if (countBadge) countBadge.textContent = String(this.queue.length);
      if (!cont) return;

      if (this.queue.length === 0) {
        cont.innerHTML = `<div class="p-3 text-center text-[10px] text-[#cbb894]">La cola está vacía. Usa "+ Cola" o "Crear Radio" en cualquier vinilo.</div>`;
        return;
      }

      cont.innerHTML = this.queue.slice(0, 40).map((tr, idx) => {
        const isCurrent = idx === this.queueIndex;
        const thumb = tr.artworkUrl600 || tr.thumbnail || tr.cover_url || './app_logo.png';
        return `
          <div onclick="window.DiscoverHomeApp.playQueueIndex(${idx})" class="flex items-center justify-between gap-2 p-2 rounded-xl border ${isCurrent ? 'bg-[#d4af37]/20 border-[#f3d791]' : 'bg-black/45 border-white/10 hover:bg-white/10'} cursor-pointer transition">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="text-[9.5px] font-mono font-bold ${isCurrent ? 'text-amber-300' : 'text-gray-400'} w-4">${isCurrent ? '▶' : (idx + 1)}</span>
              <img src="${thumb}" onerror="this.src='./app_logo.png'" class="w-8 h-8 rounded-lg object-cover border border-amber-500/30 flex-shrink-0" alt="">
              <div class="min-w-0 flex-1">
                <p class="text-[11px] font-bold text-[#fff6d6] truncate">${escapeHtmlSafe(tr.title || 'Canción')}</p>
                <p class="text-[9.5px] text-[#cbb894] truncate">${escapeHtmlSafe(tr.artist || 'Artista')}</p>
              </div>
            </div>
            <button type="button" onclick="event.stopPropagation(); window.DiscoverHomeApp.removeTrackFromQueue(${idx})" class="px-2 py-1 text-[10px] text-gray-400 hover:text-red-400 cursor-pointer" title="Quitar de la cola">✕</button>
          </div>
        `;
      }).join('');
    }
  }

  function escapeHtmlSafe(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // 5. SINTETIZADOR ANALÓGICO DE AGUJA DE VINILO (SWIPE LEFT SCRATCH SOUND)
  // =========================================================================
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

      const duration = 0.14;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * env * 0.28;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1650, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + duration);
      filter.Q.value = 3.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
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
  // 6. CONTROLADOR PRINCIPAL DE DESCUBRIR (HOME): CRATE DIGGER + CARRUSELES + PLAYER
  // =========================================================================
  const graphService = new ExternalMusicGraphService();
  const dnaEngine = new AnalogDNAEngine(graphService);
  const dualStreamEngine = new DualStreamAudioEngine(graphService, dnaEngine);

  window.ExternalMusicGraphService = graphService;
  window.AnalogDNAEngine = dnaEngine;
  window.UserMusicDNA = dnaEngine;
  window.DualStreamAudioEngine = dualStreamEngine;
  window.dualStreamEngine = dualStreamEngine;

  const DiscoverHomeApp = {
    deck: [],
    deckIndex: 0,
    viewMode: 'cards',     // 'cards' (Swipe Deck Táctil) | 'compact' (Vista Feed Compacto)
    mediumMode: 'vinyl',   // 'vinyl' (Disco de Vinilo 1928) | 'cassette' (Radiocasete 1977)
    isInitialized: false,
    autoPlayCrateOnSwipe: true,

    init() {
      if (this.isInitialized) {
        this.refreshCarousels();
        return;
      }
      this.isInitialized = true;
      this._syncDialsUI();
      this.rebuildCrateDeck(false);
      this.refreshCarousels();
      this._initNowPlayingTurntableDrag();
    },

    /**
     * Construye el universo de pistas candidatas unificando el catálogo Top CDN,
     * las pistas comunitarias y las colecciones curadas de YouTube.
     */
    getAllCandidatePool() {
      const pool = [];
      const seen = new Set();

      const addTrack = (item) => {
        if (!item || !item.title) return;
        const id = String(item.id || '');
        if (!id || seen.has(id)) return;
        seen.add(id);
        this.dnaEngine ? this.dnaEngine.encodeTrackVector(item) : dnaEngine.encodeTrackVector(item);
        pool.push(item);
      };

      // 1. Catálogo Oficial de Canciones Top
      if (typeof window.getFormattedTopSongsCatalog === 'function') {
        const topList = window.getFormattedTopSongsCatalog() || [];
        for (const s of topList) addTrack({ ...s });
      }

      // 2. Colecciones Curadas de YouTube (Rock, EDM/Phonk, Pop, Anime, Vegas Lounge 1977, Chopin/Piano, Baladas)
      if (typeof CURATED_PLAYLIST_DATABASE === 'object' && CURATED_PLAYLIST_DATABASE) {
        for (const [plId, plData] of Object.entries(CURATED_PLAYLIST_DATABASE)) {
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

    /**
     * Ordena y filtra el mazo usando Similitud de Coseno 8D + Multi-Armed Bandit (UCB1)
     * + SessionBloomFilter (100 últimas vistas + máx 2 seguidas del mismo artista).
     */
    rebuildCrateDeck(autoPlayFirst = false) {
      const pool = this.getAllCandidatePool();
      const targetVec = dnaEngine.getEffectiveTargetVector();

      // Puntuar cada pista con Coseno 8D + UCB1 + ligero jitter estocástico
      const scored = pool.map(tr => {
        const baseScore = dnaEngine.scoreTrackForRecommendation(tr, targetVec);
        const jitter = (Math.random() - 0.5) * 0.08;
        return { track: tr, score: baseScore + jitter };
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

      // Si el filtro Bloom de 100 canciones dejó pocas pistas, rellenar respetando la regla de artista
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
        dualStreamEngine.prewarmUpcomingCards(this.deck.slice(0, 3));
        if (!dualStreamEngine.currentTrack) {
          dualStreamEngine.currentTrack = active;
          dualStreamEngine.queue = [...this.deck];
          dualStreamEngine.queueIndex = 0;
          dualStreamEngine._updatePlayerMetadataUI(active, '⚡ LISTO (<100ms)');
        }
        if (autoPlayFirst) {
          dualStreamEngine.playTrack(active);
        } else {
          // Enriquecer carátula 600x600 de la primera tarjeta al instante
          graphService.enrichTrackMetadata(active).then((meta) => {
            if (meta && meta.artworkUrl600) {
              const imgEl = document.getElementById('crateMainCoverImg');
              if (imgEl) imgEl.src = meta.artworkUrl600;
              if (dualStreamEngine.currentTrack && dualStreamEngine.currentTrack.id === active.id) {
                dualStreamEngine._updatePlayerMetadataUI(active, dualStreamEngine.isPlaying() ? 'DUAL-STREAM · ACTIVO' : '⚡ LISTO (<100ms)');
              }
            }
          }).catch(() => {});
        }
      }
    },

    getActiveCrateTrack() {
      return this.deck[this.deckIndex] || null;
    },

    setViewMode(mode) {
      this.viewMode = mode === 'compact' ? 'compact' : 'cards';
      const btnCards = document.getElementById('btnCrateViewCards');
      const btnCompact = document.getElementById('btnCrateViewCompact');
      if (btnCards) btnCards.classList.toggle('active', this.viewMode === 'cards');
      if (btnCompact) btnCompact.classList.toggle('active', this.viewMode === 'compact');
      this.renderCrateDigger();
    },

    setMediumMode(medium) {
      this.mediumMode = medium === 'cassette' ? 'cassette' : 'vinyl';
      const btnVinyl = document.getElementById('btnCrateMediumVinyl');
      const btnCassette = document.getElementById('btnCrateMediumCassette');
      if (btnVinyl) btnVinyl.classList.toggle('active', this.mediumMode === 'vinyl');
      if (btnCassette) btnCassette.classList.toggle('active', this.mediumMode === 'cassette');
      this.renderCrateDigger();
    },

    toggleTubeAmpPanel() {
      this.toggleAlgorithmTunerPanel();
    },

    toggleAlgorithmTunerPanel() {
      const panel = document.getElementById('analogDnaTunerPanel');
      if (!panel) return;
      panel.classList.toggle('open');
      this._syncDialsUI();
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

    applyDialsAndRefreshDeck() {
      this.rebuildCrateDeck(true);
      this.refreshCarousels();
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('🎛️ Válvulas y Vector 8D recalibrados en vivo');
      }
    },

    syncDialsUIFromState() {
      this._syncDialsUI();
    },

    _syncDialsUI() {
      const d = dnaEngine.dials;
      const map = [
        { key: 'discovery', sliders: ['dialInput_discovery', 'dialSliderDiscovery'], vals: ['dialVal_discovery', 'dialValDiscovery'], knobs: ['knobIndicator_discovery', 'dialKnobDiscovery'], fmt: v => v < 35 ? `Seguro (${v}%)` : (v > 70 ? `Sorpréndeme (${v}%)` : `Equilibrado (${v}%)`) },
        { key: 'energy', sliders: ['dialInput_energy', 'dialSliderEnergy'], vals: ['dialVal_energy', 'dialValEnergy'], knobs: ['knobIndicator_energy', 'dialKnobEnergy'], fmt: v => `${v}% · ${Math.round(65 + (v * 1.15))} BPM` },
        { key: 'era', sliders: ['dialInput_era', 'dialSliderEra'], vals: ['dialVal_era', 'dialValEra'], knobs: ['knobIndicator_era', 'dialKnobEra'], fmt: v => v < 30 ? '1928–1977' : (v < 68 ? '80s / 90s Vintage' : '2000s–Actual') },
        { key: 'vocal', sliders: ['dialInput_vocal', 'dialSliderVocal'], vals: ['dialVal_vocal', 'dialValVocal'], knobs: ['knobIndicator_vocal', 'dialKnobVocal'], fmt: v => v < 30 ? `Piano Solo (${v}%)` : (v > 70 ? `Vocal (${v}%)` : `Híbrido (${v}%)`) }
      ];
      for (const item of map) {
        const val = d[item.key] ?? 50;
        for (const sId of item.sliders) {
          const sl = document.getElementById(sId);
          if (sl) sl.value = String(val);
        }
        for (const vId of item.vals) {
          const vl = document.getElementById(vId);
          if (vl) vl.textContent = item.fmt(val);
        }
        for (const kId of item.knobs) {
          const kn = document.getElementById(kId);
          if (kn) {
            const deg = -130 + (val / 100) * 260;
            kn.style.transform = `rotate(${deg.toFixed(0)}deg)`;
          }
        }
      }
      const summaryEl = document.getElementById('dnaProfileVectorSummary');
      if (summaryEl) {
        const u = dnaEngine.userVector;
        const genres = [
          { name: 'Rock & Metal', val: u[4] },
          { name: 'Electrónica & Phonk', val: u[5] },
          { name: 'Pop & Latino', val: u[6] },
          { name: 'Clásico & Piano', val: u[7] }
        ].sort((a, b) => b.val - a.val);
        summaryEl.textContent = `Afinidad Principal: ${genres[0].name} · ${dnaEngine.totalSwipes || 0} swipes`;
      }
    },

    /**
     * Renderiza el Crate Digger en modo Tarjetas Táctiles (Vinilo 1928 o Radiocasete 1977)
     * o en modo Feed Compacto.
     */
    renderCrateDigger() {
      const stage = document.getElementById('crateDiggerStageContainer');
      if (!stage) return;

      if (this.viewMode === 'compact') {
        this._renderCompactCrateFeed(stage);
        return;
      }

      const track = this.getActiveCrateTrack();
      if (!track) {
        stage.innerHTML = `<div class="p-6 text-center text-xs text-[#cbb894]">Recargando mazo de vinilos...</div>`;
        return;
      }

      const vec = dnaEngine.encodeTrackVector(track);
      const matchPct = track._dnaMatchPct || Math.round(dnaEngine.cosineSimilarity(dnaEngine.getEffectiveTargetVector(), vec) * 100);
      const cover = track.artworkUrl600 || track.thumbnail || track.cover_url || './app_logo.png';
      const isPlayingThis = dualStreamEngine.isPlaying() && dualStreamEngine.currentTrack?.id === track.id;
      const bpmDisplay = Math.round(60 + vec[0] * 135);
      const decadeLabel = track.releaseYear || (vec[2] < 0.25 ? 'Clásico 1928' : (vec[2] < 0.45 ? 'Vegas 1977' : (vec[2] < 0.7 ? '80s / 90s' : ' Contemporáneo')));

      const mediumGraphicHtml = this.mediumMode === 'cassette'
        ? `
          <div class="crate-cassette-shell">
            <div class="crate-cassette-label">
              <div class="flex items-center justify-between text-[8.5px] font-mono font-black uppercase tracking-wider text-[#785316]">
                <span>STEINWAY VEGAS 1977 · CrO2</span>
                <span>SIDE A · ${bpmDisplay} BPM</span>
              </div>
              <p class="text-xs font-black truncate text-[#140b02] font-serif mt-0.5">${escapeHtmlSafe(track.title)}</p>
              <p class="text-[10px] font-bold truncate text-[#4a3010]">${escapeHtmlSafe(track.artist)}</p>
            </div>
            <div class="crate-cassette-window">
              <div class="cassette-reel ${isPlayingThis ? 'spinning' : ''}"></div>
              <div class="w-11 h-11 rounded-lg overflow-hidden border border-[#d4af37] shadow-md flex-shrink-0">
                <img id="crateMainCoverImg" src="${cover}" onerror="this.src='./app_logo.png'" class="w-full h-full object-cover" alt="">
              </div>
              <div class="cassette-reel ${isPlayingThis ? 'spinning' : ''}"></div>
            </div>
            <div class="flex items-center justify-between text-[8.5px] font-mono text-[#e5c158] px-1">
              <span>DOLBY NR · HIGH BIAS</span>
              <span id="crateActiveStreamStatus" class="text-amber-300 font-bold">${isPlayingThis ? 'DUAL-STREAM ACTIVO' : 'LISTO (<100ms)'}</span>
            </div>
          </div>
        `
        : `
          <div class="flex items-center justify-center gap-3 relative py-1">
            <!-- Vúmetros Analógicos L / R -->
            <div class="crate-vu-meter-panel">
              <div class="crate-vu-box">
                <div class="crate-vu-scale"><span>-20</span><span>0</span><span class="text-red-400">+3</span></div>
                <div id="crateVuNeedleL" class="crate-vu-needle"></div>
                <span class="absolute bottom-0.5 left-1.5 text-[6.5px] font-mono text-[#cbb894] font-bold">VU L</span>
              </div>
              <div class="crate-vu-box">
                <div class="crate-vu-scale"><span>-20</span><span>0</span><span class="text-red-400">+3</span></div>
                <div id="crateVuNeedleR" class="crate-vu-needle"></div>
                <span class="absolute bottom-0.5 left-1.5 text-[6.5px] font-mono text-[#cbb894] font-bold">VU R</span>
              </div>
            </div>

            <!-- Plato Giradiscos 1928 con Vinilo y Brazo Móvil -->
            <div class="crate-turntable-well" onclick="window.DiscoverHomeApp.togglePreviewCurrentCrateCard()" title="Tocar/Pausar Vinilo">
              <div id="crateMainVinylDisc" class="crate-vinyl-disc ${isPlayingThis ? 'spinning' : ''}">
                <div class="crate-vinyl-label">
                  <img id="crateMainCoverImg" src="${cover}" onerror="this.src='./app_logo.png'" alt="Cover">
                  <div class="crate-vinyl-spindle"></div>
                </div>
              </div>
              <div class="crate-tonearm-assembly">
                <div class="crate-tonearm-pivot"></div>
                <div id="crateMainTonearmRod" class="crate-tonearm-rod ${isPlayingThis ? 'engaged' : ''}">
                  <div class="crate-tonearm-headshell"></div>
                </div>
              </div>
            </div>
          </div>
        `;

      stage.innerHTML = `
        <div class="crate-deck-stage">
          <div class="crate-back-card-2"></div>
          <div class="crate-back-card-1"></div>

          <div id="crateActiveSwipeCard" class="crate-swipe-card z-10">
            <!-- Sellos de Gesto Táctil -->
            <div id="crateStampLike" class="crate-stamp-badge crate-stamp-like">♥ ME GUSTA</div>
            <div id="crateStampPass" class="crate-stamp-badge crate-stamp-pass">✕ PASAR</div>
            <div id="crateStampPlay" class="crate-stamp-badge crate-stamp-play">🎹 ¡JUGAR AL PIANO!</div>

            <!-- Cabecera de metadatos y afinidad ADN -->
            <div class="flex items-center justify-between gap-1.5 mb-2">
              <span class="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[9px] font-mono font-black text-amber-300">
                🧬 ${matchPct}% AFINIDAD ADN
              </span>
              <div class="flex items-center gap-1">
                <span class="px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-[8.5px] font-mono text-[#cbb894]">
                  ${escapeHtmlSafe(String(decadeLabel))} · ${bpmDisplay} BPM
                </span>
                <span class="px-2 py-0.5 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/50 text-[8.5px] font-mono font-bold text-[#f3d791]">
                  ${(Number(track.stars) || 3.8).toFixed(1)}★
                </span>
              </div>
            </div>

            ${mediumGraphicHtml}

            <!-- Información de la Canción y Botón de Escucha Rápida -->
            <div class="text-center mt-2 space-y-0.5">
              <h3 class="text-sm font-black text-[#fff6d6] font-serif truncate px-2">${escapeHtmlSafe(track.title)}</h3>
              <p class="text-[11px] font-semibold text-[#d4af37] truncate px-2">${escapeHtmlSafe(track.artist)}</p>
              <div class="flex items-center justify-center gap-2 pt-1">
                <button id="cratePreviewToggleBtn" type="button" onclick="window.DiscoverHomeApp.togglePreviewCurrentCrateCard()" class="px-2.5 py-0.5 rounded-full bg-black/65 border border-[#c5a059]/55 text-[9px] font-mono font-bold text-[#f3d791] cursor-pointer hover:bg-[#c5a059]/20 transition">
                  ${isPlayingThis ? '⏸ PAUSAR ESCUCHA' : '▶ ESCUCHAR PISTA'}
                </button>
                <span id="crateActiveStreamStatus" class="text-[8.5px] font-mono text-emerald-300/90">
                  ${dualStreamEngine.fullTrackReady && dualStreamEngine.currentTrack?.id === track.id ? '✨ HD COMPLETA EN BUFFER' : '⚡ PRE-FETCH ACTIVO'}
                </span>
              </div>
            </div>

            <!-- Barra de Acciones Secundarias: + Playlist / Cola y Crear Radio -->
            <div class="flex items-center justify-center gap-2 mt-2.5 pt-2 border-t border-white/10">
              <button type="button" onclick="window.DiscoverHomeApp.openPlaylistOrQueueForCurrent()" class="btn-crate-aux" title="Guardar en Playlist o Añadir a la Cola">
                <span>+ PLAYLIST / COLA</span>
              </button>
              <button type="button" onclick="window.DiscoverHomeApp.startRadioFromCurrent()" class="btn-crate-aux" title="Generar Radio Infinita basada en esta pista">
                <span>📻 CREAR RADIO</span>
              </button>
            </div>

            <!-- Barra Principal de Swipe / Juego: [ ✕ PASAR | 🎹 ¡JUGAR AL PIANO! | ♥ ME GUSTA ] -->
            <div class="crate-action-bar">
              <button type="button" onclick="window.DiscoverHomeApp.swipeLeftPass()" class="btn-crate-round btn-crate-pass" title="Swipe Izquierda: Pasar (✕)">
                <span class="text-sm font-black">✕</span>
              </button>
              <button type="button" onclick="window.DiscoverHomeApp.swipeUpPlayPiano()" class="btn-crate-play-hero" title="Swipe Arriba: ¡Jugar al Piano con buffer precargado!">
                <span>🎹</span>
                <span>¡JUGAR AL PIANO!</span>
              </button>
              <button type="button" onclick="window.DiscoverHomeApp.swipeRightLike()" class="btn-crate-round btn-crate-like" title="Swipe Derecha: Me Gusta (♥)">
                <span class="text-sm font-black">♥</span>
              </button>
            </div>
          </div>
        </div>
      `;

      this._attachCardSwipeGestures();
    },

    _renderCompactCrateFeed(stage) {
      const slice = this.deck.slice(this.deckIndex, this.deckIndex + 8);
      if (slice.length === 0) {
        this.rebuildCrateDeck(false);
        return;
      }

      stage.innerHTML = `
        <div class="space-y-1.5">
          ${slice.map((tr, i) => {
            const realIdx = this.deckIndex + i;
            const vec = dnaEngine.encodeTrackVector(tr);
            const matchPct = tr._dnaMatchPct || Math.round(dnaEngine.cosineSimilarity(dnaEngine.getEffectiveTargetVector(), vec) * 100);
            const cover = tr.artworkUrl600 || tr.thumbnail || tr.cover_url || './app_logo.png';
            const isPlayingThis = dualStreamEngine.isPlaying() && dualStreamEngine.currentTrack?.id === tr.id;
            return `
              <div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/65 border border-[#c5a059]/45 hover:border-[#f3d791] transition">
                <div onclick="window.DiscoverHomeApp.playCompactTrackAt(${realIdx})" class="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
                  <div class="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#d4af37] flex-shrink-0 ${isPlayingThis ? 'animate-spin' : ''}" style="animation-duration:5s;">
                    <img src="${cover}" onerror="this.src='./app_logo.png'" class="w-full h-full object-cover" alt="">
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[8.5px] font-mono font-black text-amber-300">${matchPct}% ADN</span>
                      <h4 class="text-xs font-black text-[#fff6d6] truncate font-serif">${escapeHtmlSafe(tr.title)}</h4>
                    </div>
                    <p class="text-[10px] text-[#cbb894] truncate">${escapeHtmlSafe(tr.artist)}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onclick="window.DiscoverHomeApp.likeCompactTrackAt(${realIdx})" class="w-7 h-7 rounded-lg bg-emerald-950/70 border border-emerald-400/50 text-emerald-300 text-xs font-bold cursor-pointer" title="Me Gusta">♥</button>
                  <button type="button" onclick="window.DiscoverHomeApp.openPlaylistOrQueueForTrackIndex(${realIdx})" class="w-7 h-7 rounded-lg bg-white/5 border border-[#c5a059]/40 text-[#f3d791] text-xs font-bold cursor-pointer" title="+ Playlist / Cola">+</button>
                  <button type="button" onclick="window.DiscoverHomeApp.launchPianoForTrackIndex(${realIdx})" class="px-2.5 py-1.5 rounded-lg bg-gradient-to-b from-[#f3d791] to-[#9b6f23] text-[#140b02] font-black text-[10px] cursor-pointer" title="Jugar al Piano">🎹 Jugar</button>
                </div>
              </div>
            `;
          }).join('')}
          <div class="pt-1 text-center">
            <button type="button" onclick="window.DiscoverHomeApp.advanceCompactBatch()" class="px-4 py-1.5 rounded-xl bg-[#1b1209] border border-[#c5a059]/60 text-[#f3d791] text-[10px] font-black uppercase tracking-wider cursor-pointer">
              🔄 Siguientes Vinilos del Mazo
            </button>
          </div>
        </div>
      `;
    },

    _attachCardSwipeGestures() {
      const card = document.getElementById('crateActiveSwipeCard');
      if (!card) return;

      let startX = 0;
      let startY = 0;
      let currentX = 0;
      let currentY = 0;
      let isDragging = false;

      const stampLike = document.getElementById('crateStampLike');
      const stampPass = document.getElementById('crateStampPass');
      const stampPlay = document.getElementById('crateStampPlay');

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
        currentX = cx - startX;
        currentY = cy - startY;

        const rot = currentX * 0.06;
        card.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg)`;

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
        } else if (currentX > 80) {
          this.swipeRightLike();
        } else if (currentX < -80) {
          this.swipeLeftPass();
        } else {
          card.style.transform = '';
          if (stampLike) stampLike.style.opacity = '0';
          if (stampPass) stampPass.style.opacity = '0';
          if (stampPlay) stampPlay.style.opacity = '0';
        }
      };

      card.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp);
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
     * SWIPE DERECHA (♥ ME GUSTA):
     * Guarda en Tus Me Gusta, anima el vinilo entrando en la biblioteca dorada y alimenta el vector 8D.
     */
    async swipeRightLike() {
      const track = this.getActiveCrateTrack();
      if (!track) return;

      const cover = track.artworkUrl600 || track.thumbnail || track.cover_url || './app_logo.png';
      triggerGoldenVinylFlyAnimation(cover);

      dnaEngine.recordLike(track);

      // Guardar también en IndexedDBStorage favoritos para Mi Biblioteca
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
        window.showSuccessToast(`♥ Guardada en Tus Me Gusta: ${track.title}`);
      }

      const card = document.getElementById('crateActiveSwipeCard');
      if (card) {
        card.style.transform = 'translate3d(120%, -12px, 0) rotate(18deg)';
        card.style.opacity = '0';
      }
      setTimeout(() => {
        this._advanceToNextCard(true);
        this.refreshCarousels();
      }, 170);
    },

    /**
     * SWIPE IZQUIERDA (✕ PASAR):
     * Sonido sutil de aguja de vinilo, penaliza sub-estilo en la sesión actual y salta al instante (<100ms).
     */
    swipeLeftPass() {
      const track = this.getActiveCrateTrack();
      if (!track) return;

      playVinylNeedleScratchSound();
      dnaEngine.recordPass(track);

      const card = document.getElementById('crateActiveSwipeCard');
      if (card) {
        card.style.transform = 'translate3d(-120%, 10px, 0) rotate(-18deg)';
        card.style.opacity = '0';
      }
      setTimeout(() => {
        this._advanceToNextCard(true);
      }, 150);
    },

    /**
     * SWIPE ARRIBA (🎹 ¡JUGAR AL PIANO!):
     * Lanza directamente la partida de piano reutilizando el buffer del audio completo ya descargado.
     */
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
        dualStreamEngine.prewarmUpcomingCards(this.deck.slice(this.deckIndex + 1, this.deckIndex + 4));
        if (autoPlay) {
          dualStreamEngine.playTrack(nextTrack);
        }
      }
    },

    playCompactTrackAt(idx) {
      const tr = this.deck[idx];
      if (!tr) return;
      dualStreamEngine.playTrack(tr);
      this.renderCrateDigger();
    },

    likeCompactTrackAt(idx) {
      const tr = this.deck[idx];
      if (!tr) return;
      dnaEngine.recordLike(tr);
      if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.putFavoriteRecord === 'function') {
        window.IndexedDBStorage.putFavoriteRecord({ ...tr, addedAt: Date.now() }).catch(() => {});
      }
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(`♥ Añadida a Tus Me Gusta: ${tr.title}`);
      }
      this.refreshCarousels();
    },

    advanceCompactBatch() {
      this.deckIndex += 6;
      if (this.deckIndex >= this.deck.length) {
        this.rebuildCrateDeck(false);
      } else {
        this.renderCrateDigger();
      }
    },

    /**
     * Lanza la partida de piano para cualquier canción inyectando el buffer completo si ya está descargado.
     */
    async launchPianoGameForTrack(track) {
      if (!track) return;
      // Silenciar y pausar el reproductor continuo con fade-out limpio de 200ms (Módulo 7)
      dualStreamEngine.pauseForGameplayWithFade(200);

      // Si DualStreamAudioEngine ya descargó el audio completo de esta pista, inyectarlo en _fullTrackBlobCache
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
        const thumb = track.artworkUrl600 || track.thumbnail || track.cover_url || './app_logo.png';
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

    /**
     * Abre el modal de Añadir a Playlist / Cola para cualquier canción
     */
    async openPlaylistOrQueueForTrack(track) {
      if (!track) return;
      window._pendingCrateTrackForPlaylist = track;
      if (typeof window.openAddToPlaylistModal === 'function') {
        // Asegurar que la canción esté accesible en searchResultsCache para openAddToPlaylistModal
        if (Array.isArray(window.searchResultsCache) && !window.searchResultsCache.some(s => s && String(s.id) === String(track.id))) {
          window.searchResultsCache.unshift(track);
        }
        await window.openAddToPlaylistModal(track.id);
        // Añadir botón rápido de "+ Añadir a la Cola de Reproducción Actual" en el modal
        const listCont = document.getElementById('availablePlaylistsList');
        if (listCont && !document.getElementById('btnQuickAddQueueModal')) {
          const qBtn = document.createElement('div');
          qBtn.id = 'btnQuickAddQueueModal';
          qBtn.className = 'p-2.5 mb-2 bg-gradient-to-r from-amber-500/25 to-yellow-600/20 hover:from-amber-500/35 rounded-xl border border-amber-400/60 flex items-center justify-between cursor-pointer transition';
          qBtn.innerHTML = `
            <span class="text-xs font-black text-[#fff6d6] flex items-center gap-1.5">🎧 Añadir a la Cola de Reproducción</span>
            <span class="text-[9px] font-mono text-amber-300 font-bold">+ COLA</span>
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

    /**
     * 📻 CREAR RADIO: Genera una cola infinita basada en la pista semilla
     * cruzando ExternalMusicGraphService (Last.fm / MusicBrainz / Deezer) + Similitud de Coseno 8D.
     */
    async startRadioFromTrack(seedTrack) {
      if (!seedTrack) return;
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(`📻 Sintonizando Radio Analógica: ${seedTrack.title}...`);
      }

      const seedVec = dnaEngine.encodeTrackVector(seedTrack);
      const pool = this.getAllCandidatePool();

      // Ordenar el catálogo por Similitud de Coseno respecto a la canción semilla
      const byCosine = pool
        .filter(t => String(t.id) !== String(seedTrack.id))
        .map(t => ({
          track: t,
          sim: dnaEngine.cosineSimilarity(seedVec, dnaEngine.encodeTrackVector(t))
        }))
        .sort((a, b) => b.sim - a.sim)
        .slice(0, 18)
        .map(x => x.track);

      // Consultar también el grafo musical externo en paralelo
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

    /**
     * 📻 MI MIX DIARIO (Módulo 6):
     * Acceso directo superior junto a Tragaperras y Canción del Día.
     */
    playDailyMix() {
      const pool = this.getAllCandidatePool();
      const targetVec = dnaEngine.getEffectiveTargetVector();
      const mix = pool
        .map(t => ({ t, sc: dnaEngine.scoreTrackForRecommendation(t, targetVec) + (Math.random() * 0.06) }))
        .sort((a, b) => b.sc - a.sc)
        .slice(0, 25)
        .map(x => x.t);

      if (mix.length > 0) {
        dualStreamEngine.loadQueueAndPlay(mix, 0, 'Mi Mix Diario ADN');
      }
    },

    // =========================================================================
    // MÓDULO 6: CARRUSELES HORIZONTALES ESTILO SPOTIFY ("Porque te gustó", "Descubrimiento Semanal", "Tus Playlists")
    // =========================================================================
    async refreshCarousels() {
      this._renderBecauseYouLikedCarousel();
      this._renderWeeklyDiscoveryCarousel();
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
        titleEl.textContent = `Porque te gustó "${seed.title}"`;
      }

      const seedVec = dnaEngine.encodeTrackVector(seed);
      const related = pool
        .filter(t => String(t.id) !== String(seed.id))
        .map(t => {
          const sim = dnaEngine.cosineSimilarity(seedVec, dnaEngine.encodeTrackVector(t));
          t._dnaMatchPct = Math.round(Math.max(68, Math.min(99, sim * 100)));
          return { t, sim };
        })
        .sort((a, b) => b.sim - a.sim)
        .slice(0, 12)
        .map(x => x.t);

      this._becauseLikedList = related;
      cont.innerHTML = related.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, 'because')).join('');
    },

    _renderWeeklyDiscoveryCarousel() {
      const cont = document.getElementById('carouselWeeklyDiscovery');
      if (!cont) return;

      const pool = this.getAllCandidatePool();
      const highScoresObj = (typeof highscores === 'object' && highscores) ? highscores : {};

      // Priorizar pistas no jugadas aún con alta puntuación UCB1
      const weekly = pool
        .filter(t => !highScoresObj[t.id])
        .map(t => ({ t, sc: dnaEngine.scoreTrackForRecommendation(t) }))
        .sort((a, b) => b.sc - a.sc)
        .slice(0, 12)
        .map(x => x.t);

      this._weeklyDiscoveryList = weekly;
      cont.innerHTML = weekly.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, 'weekly')).join('');
    },

    async _renderUserPlaylistsCarousel() {
      const cont = document.getElementById('carouselUserPlaylists');
      if (!cont) return;

      let playlists = [];
      if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getAllPlaylists === 'function') {
        playlists = await window.IndexedDBStorage.getAllPlaylists().catch(() => []) || [];
      }

      // Incluir tarjeta inteligente de "Tus Me Gusta ♥" al inicio
      const favCount = Math.max(dnaEngine.likes.size, (typeof window.favoriteIdsSet !== 'undefined' ? window.favoriteIdsSet.size : 0));
      const cardsHtml = [];

      cardsHtml.push(`
        <div class="discover-smart-card">
          <div class="relative w-full h-24 rounded-xl overflow-hidden border border-amber-400/50 bg-gradient-to-br from-[#3b1d0b] via-[#1c0d06] to-black flex flex-col items-center justify-center p-2 text-center">
            <span class="text-2xl">♥</span>
            <span class="text-[10px] font-black text-[#f3d791] uppercase tracking-wider mt-0.5">Biblioteca Dorada</span>
            <span class="text-[8.5px] font-mono text-amber-300">${favCount} temas</span>
          </div>
          <div>
            <h4 class="text-xs font-black text-[#fff6d6] truncate font-serif">Tus Me Gusta</h4>
            <p class="text-[9.5px] text-[#cbb894] truncate">Colección ADN Personal</p>
          </div>
          <div class="grid grid-cols-2 gap-1 pt-0.5">
            <button type="button" onclick="window.DiscoverHomeApp.playLikedSongsPlaylist()" class="py-1 px-1.5 rounded-lg bg-[#24170b] border border-[#c5a059]/60 text-[#f3d791] text-[9.5px] font-bold cursor-pointer">🎧 Escuchar</button>
            <button type="button" onclick="switchMainTab('library'); switchLibrarySubtab('favorites');" class="py-1 px-1.5 rounded-lg bg-gradient-to-b from-[#f3d791] to-[#9b6f23] text-[#140b02] text-[9.5px] font-black cursor-pointer">🎹 Jugar</button>
          </div>
        </div>
      `);

      for (const pl of playlists) {
        if (!pl) continue;
        const firstTrack = Array.isArray(pl.tracks) && pl.tracks[0] ? pl.tracks[0] : null;
        const cover = (firstTrack && (firstTrack.thumbnail || firstTrack.cover_url)) || './app_logo.png';
        const safeId = String(pl.id || '').replace(/'/g, "\\'");
        cardsHtml.push(`
          <div class="discover-smart-card">
            <div class="relative w-full h-24 rounded-xl overflow-hidden border border-[#c5a059]/40 bg-black">
              <img src="${cover}" onerror="this.src='./app_logo.png'" class="w-full h-full object-cover" alt="">
              <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 border border-amber-400/40 text-[8px] font-mono font-bold text-amber-300">${(pl.tracks || []).length} pistas</span>
            </div>
            <div>
              <h4 class="text-xs font-black text-[#fff6d6] truncate font-serif">${escapeHtmlSafe(pl.title || 'Playlist')}</h4>
              <p class="text-[9.5px] text-[#cbb894] truncate">Playlist Personal</p>
            </div>
            <div class="grid grid-cols-2 gap-1 pt-0.5">
              <button type="button" onclick="window.DiscoverHomeApp.playSavedUserPlaylist('${safeId}')" class="py-1 px-1.5 rounded-lg bg-[#24170b] border border-[#c5a059]/60 text-[#f3d791] text-[9.5px] font-bold cursor-pointer">🎧 Reproducir</button>
              <button type="button" onclick="switchMainTab('library'); switchLibrarySubtab('playlists'); openPlaylistDetailView('${safeId}');" class="py-1 px-1.5 rounded-lg bg-gradient-to-b from-[#f3d791] to-[#9b6f23] text-[#140b02] text-[9.5px] font-black cursor-pointer">🎹 Jugar</button>
            </div>
          </div>
        `);
      }

      // Tarjeta para crear o importar una nueva playlist
      cardsHtml.push(`
        <div onclick="switchMainTab('library'); switchLibrarySubtab('playlists'); createNewEmptyPlaylistPrompt();" class="discover-smart-card items-center justify-center text-center cursor-pointer hover:border-[#f3d791] transition">
          <div class="w-12 h-12 rounded-full bg-[#c5a059]/15 border border-dashed border-[#f3d791] flex items-center justify-center text-xl text-[#f3d791]">+</div>
          <p class="text-xs font-black text-[#f3d791] font-serif">Crear Nueva Playlist</p>
          <p class="text-[9.5px] text-[#cbb894]">Guarda tus vinilos favoritos</p>
        </div>
      `);

      cont.innerHTML = cardsHtml.join('');
    },

    _buildSmartCarouselCardHtml(tr, idx, listType) {
      const cover = tr.artworkUrl600 || tr.thumbnail || tr.cover_url || './app_logo.png';
      const matchPct = tr._dnaMatchPct || 92;
      return `
        <div class="discover-smart-card">
          <div onclick="window.DiscoverHomeApp.playFromCarousel('${listType}', ${idx})" class="relative w-full h-24 rounded-xl overflow-hidden border border-[#c5a059]/45 bg-black cursor-pointer group">
            <img src="${cover}" onerror="this.src='./app_logo.png'" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="" loading="lazy">
            <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 border border-amber-400/50 text-[8px] font-mono font-black text-amber-300">${matchPct}% ADN</span>
          </div>
          <div>
            <h4 class="text-xs font-black text-[#fff6d6] truncate font-serif">${escapeHtmlSafe(tr.title)}</h4>
            <p class="text-[9.5px] text-[#cbb894] truncate">${escapeHtmlSafe(tr.artist)}</p>
          </div>
          <div class="grid grid-cols-2 gap-1 pt-0.5">
            <button type="button" onclick="window.DiscoverHomeApp.playFromCarousel('${listType}', ${idx})" class="py-1 px-1.5 rounded-lg bg-[#24170b] hover:bg-[#332110] border border-[#c5a059]/60 text-[#f3d791] text-[9.5px] font-bold cursor-pointer">🎧 Escuchar</button>
            <button type="button" onclick="window.DiscoverHomeApp.launchPianoFromCarousel('${listType}', ${idx})" class="py-1 px-1.5 rounded-lg bg-gradient-to-b from-[#f3d791] to-[#9b6f23] text-[#140b02] text-[9.5px] font-black cursor-pointer">🎹 Jugar</button>
          </div>
        </div>
      `;
    },

    playFromCarousel(listType, idx) {
      const arr = listType === 'because' ? this._becauseLikedList : this._weeklyDiscoveryList;
      if (!Array.isArray(arr) || !arr[idx]) return;
      dualStreamEngine.loadQueueAndPlay(arr, idx, listType === 'because' ? 'Similares a tus gustos' : 'Descubrimiento Semanal');
    },

    launchPianoFromCarousel(listType, idx) {
      const arr = listType === 'because' ? this._becauseLikedList : this._weeklyDiscoveryList;
      if (!Array.isArray(arr) || !arr[idx]) return;
      this.launchPianoGameForTrack(arr[idx]);
    },

    async playLikedSongsPlaylist() {
      const pool = this.getAllCandidatePool();
      let favTracks = pool.filter(t => dnaEngine.likes.has(String(t.id)) || (typeof window.favoriteIdsSet !== 'undefined' && window.favoriteIdsSet.has(t.id)));
      if (favTracks.length === 0 && typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getAllFavorites === 'function') {
        favTracks = await window.IndexedDBStorage.getAllFavorites().catch(() => []) || [];
      }
      if (favTracks.length === 0) {
        if (typeof window.showErrorToast === 'function') {
          window.showErrorToast('Desliza vinilos a la derecha (♥) para añadir canciones a Tus Me Gusta.');
        }
        return;
      }
      dualStreamEngine.loadQueueAndPlay(favTracks, 0, 'Tus Me Gusta ♥');
    },

    async playSavedUserPlaylist(playlistId) {
      if (typeof window.IndexedDBStorage === 'undefined' || typeof window.IndexedDBStorage.getPlaylist !== 'function') return;
      const pl = await window.IndexedDBStorage.getPlaylist(playlistId).catch(() => null);
      if (!pl || !Array.isArray(pl.tracks) || pl.tracks.length === 0) {
        if (typeof window.showErrorToast === 'function') {
          window.showErrorToast('Esta playlist aún no tiene pistas.');
        }
        return;
      }
      const mapped = pl.tracks.map(t => ({
        ...t,
        id: t.id || `pl_tr_${Date.now()}`,
        videoId: /^[a-zA-Z0-9_-]{11}$/.test(String(t.id || '')) ? t.id : (t.videoId || ''),
        thumbnail: t.thumbnail || './app_logo.png'
      }));
      dualStreamEngine.loadQueueAndPlay(mapped, 0, pl.title || 'Playlist');
    },

    /**
     * MÓDULO 6: Botón "🎧 Reproducir Playlist" en todas las Colecciones de YouTube:
     * Envía la colección entera al reproductor continuo estilo Spotify.
     */
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
            dualStreamEngine.loadQueueAndPlay(tracks, 0, parsed.title || title);
            return;
          }
        }
      } catch (err) {
        if (typeof window.showErrorToast === 'function') {
          window.showErrorToast('No se pudo cargar la colección en el reproductor.');
        }
      }
    },

    // =========================================================================
    // MÓDULO 5: CONTROLES DE LA VISTA AMPLIADA "NOW PLAYING" (TOCADISCOS PANTALLA COMPLETA)
    // =========================================================================
    openNowPlayingModal() {
      const modal = document.getElementById('nowPlayingTurntableModal');
      if (!modal) return;
      modal.classList.add('open');
      dualStreamEngine._renderQueueListInModal();
    },

    closeNowPlayingModal() {
      const modal = document.getElementById('nowPlayingTurntableModal');
      if (modal) modal.classList.remove('open');
    },

    toggleSmartShuffle() {
      dualStreamEngine.smartShuffleEnabled = !dualStreamEngine.smartShuffleEnabled;
      const btn = document.getElementById('npSmartShuffleBtn');
      if (btn) {
        btn.classList.toggle('bg-amber-400/25', dualStreamEngine.smartShuffleEnabled);
        btn.classList.toggle('border-amber-300', dualStreamEngine.smartShuffleEnabled);
        btn.classList.toggle('text-amber-300', dualStreamEngine.smartShuffleEnabled);
      }
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(dualStreamEngine.smartShuffleEnabled
          ? '🔀 Smart Shuffle ADN Activado'
          : 'Smart Shuffle Desactivado');
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
      dualStreamEngine._updatePlayerMetadataUI(tr, document.getElementById('miniPlayerStreamBadge')?.textContent || 'DUAL-STREAM');
      this.refreshCarousels();
    },

    // Aliases para los eventos onclick / oninput de index.html
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
      const platter = document.getElementById('npTurntablePlatterInteractive');
      if (!platter || !e) return;
      const rect = platter.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const maxR = rect.width / 2;
      const minR = 34;
      if (dist <= minR) {
        this.togglePlayPauseMini(e);
        return;
      }
      const ratio = 1 - Math.max(0, Math.min(1, (dist - minR) / Math.max(1, maxR - minR)));
      dualStreamEngine.seekToRatio(ratio);
    },

    _initNowPlayingTurntableDrag() {
      // El evento onclick en #npTurntablePlatterInteractive ya delega en onTurntablePlatterScratch(event)
    }
  };

  window.DiscoverHomeApp = DiscoverHomeApp;
})();

