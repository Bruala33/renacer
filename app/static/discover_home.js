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

      this._updatePlayerMetadataUI(track);
      this._updateMediaSessionMetadata(track);

      // Comprobar si ya tenemos el Blob completo en caché de memoria (_fullTrackBlobCache)
      const cachedFullBlob = this._getCachedFullBlobForTrack(track);
      if (cachedFullBlob && cachedFullBlob.size >= 100000) {
        this.fullTrackBlob = cachedFullBlob;
        this.fullTrackReady = true;
        const startedFull = await this._startChannelWithFadeIn(this.fullAudio, cachedFullBlob, 'full', reqId, options.startOffsetSec || 0, 300);
        if (startedFull) {
          this._updatePlayerMetadataUI(track);
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
          this._updatePlayerMetadataUI(track);
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

        this._updatePlayerMetadataUI(track);

        // Si el preview no había podido arrancar (ej. tema exclusivo de YouTube sin preview en iTunes), arrancar el fullAudio inmediatamente
        if (!this.isPlayingFlag || this.activeSourceType === 'none') {
          const ok = await this._startChannelWithFadeIn(this.fullAudio, blob, 'full', reqId, 0, 300);
          if (ok) {
            this._updatePlayerMetadataUI(track);
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

          // 2. Si es una canción del catálogo Top con audio_url explícito en Releases CDN
          const isTop = Boolean(track.audio_url);
          if (isTop) {
            const rawId = String(track.raw_id || track.id || '').replace(/^top_/, '');
            const audioFilename = track.audio_url || `${rawId}.mp3`;
            const myWorker = (u) => `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(u)}`;
            const preferredTags = ['8', '3'];
            for (const tag of preferredTags) {
              const cUrl = `https://github.com/Bruala33/renacer/releases/download/${tag}/${audioFilename}`;
              try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 2200);
                const resp = await fetch(myWorker(cUrl), { signal: ctrl.signal });
                clearTimeout(tid);
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
     * Cola de Pre-Fetch Inteligente:
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
        miniEl.classList.remove('hidden-player');
      }

      const cover = getBestTrackCover(track);
      const isFav = (typeof window.favoriteIdsSet !== 'undefined' && window.favoriteIdsSet.has(track.id)) ||
                    this.dnaEngine.likes.has(String(track.id));

      // Mini-Player DOM (1 sola línea limpia)
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

      // Now Playing Modal DOM
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
      const safeDur = Math.max(1, Number(durSec) || 30);
      const ratio = Math.max(0, Math.min(1, curSec / safeDur));
      const pct = (ratio * 100).toFixed(1) + '%';

      const miniFill = document.getElementById('miniPlayerProgressFill');
      if (miniFill) miniFill.style.width = pct;

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

    _startVuMeterLoop() {
      // Mantenido como no-op silencioso por compatibilidad
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
  const dualStreamEngine = new DualStreamAudioEngine(graphService, dnaEngine);

  window.ExternalMusicGraphService = graphService;
  window.AnalogDNAEngine = dnaEngine;
  window.UserMusicDNA = dnaEngine;
  window.DualStreamAudioEngine = dualStreamEngine;
  window.dualStreamEngine = dualStreamEngine;

  const DiscoverHomeApp = {
    deck: [],
    deckIndex: 0,
    viewMode: 'cards',
    mediumMode: 'vinyl',
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

      // Priorizar canciones con portada oficial real para evitar cajas vacías
      const scored = pool.map(tr => {
        const baseScore = dnaEngine.scoreTrackForRecommendation(tr, targetVec);
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
        dualStreamEngine.prewarmUpcomingCards(this.deck.slice(0, 4));
        if (!dualStreamEngine.currentTrack) {
          dualStreamEngine.currentTrack = active;
          dualStreamEngine.queue = [...this.deck];
          dualStreamEngine.queueIndex = 0;
          dualStreamEngine._updatePlayerMetadataUI(active);
        }
        if (autoPlayFirst) {
          dualStreamEngine.playTrack(active);
        } else {
          this._ensureRealCoverForTrack(active, 'crateMainCoverImg');
          const next = this.deck[this.deckIndex + 1];
          if (next) this._ensureRealCoverForTrack(next, 'crateNextCoverImg');
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

    applyDialsAndRefreshDeck() {
      this.rebuildCrateDeck(true);
      this.refreshCarousels();
    },

    syncDialsUIFromState() {
      this._syncDialsUI();
    },

    _syncDialsUI() {
      const d = dnaEngine.dials;
      const map = [
        { key: 'discovery', sliders: ['dialInput_discovery', 'dialSliderDiscovery'], vals: ['dialVal_discovery', 'dialValDiscovery'], knobs: ['knobIndicator_discovery', 'dialKnobDiscovery'], fmt: v => v < 35 ? `Mis favoritos (${v}%)` : (v > 70 ? `Nuevos estilos (${v}%)` : `Equilibrado (${v}%)`) },
        { key: 'energy', sliders: ['dialInput_energy', 'dialSliderEnergy'], vals: ['dialVal_energy', 'dialValEnergy'], knobs: ['knobIndicator_energy', 'dialKnobEnergy'], fmt: v => `${v}% · ${Math.round(65 + (v * 1.15))} BPM` },
        { key: 'era', sliders: ['dialInput_era', 'dialSliderEra'], vals: ['dialVal_era', 'dialValEra'], knobs: ['knobIndicator_era', 'dialKnobEra'], fmt: v => v < 30 ? 'Clásicos' : (v < 68 ? '80s / 90s' : 'Actuales') },
        { key: 'vocal', sliders: ['dialInput_vocal', 'dialSliderVocal'], vals: ['dialVal_vocal', 'dialValVocal'], knobs: ['knobIndicator_vocal', 'dialKnobVocal'], fmt: v => v < 30 ? `Instrumental (${v}%)` : (v > 70 ? `Con voz (${v}%)` : `Híbrido (${v}%)`) }
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
          { name: 'Rock', val: u[4] },
          { name: 'Electrónica', val: u[5] },
          { name: 'Pop & Latino', val: u[6] },
          { name: 'Clásico & Piano', val: u[7] }
        ].sort((a, b) => b.val - a.val);
        summaryEl.textContent = `Estilo favorito: ${genres[0].name}`;
      }
    },

    _buildSwipeCardInnerHtml(track, isTopCard) {
      const cover = getBestTrackCover(track);
      const isPlayingThis = isTopCard && dualStreamEngine.isPlaying() && dualStreamEngine.currentTrack?.id === track.id;
      const isFav = (typeof window.favoriteIdsSet !== 'undefined' && window.favoriteIdsSet.has(track.id)) ||
                    dnaEngine.likes.has(String(track.id));
      const coverImgId = isTopCard ? 'crateMainCoverImg' : 'crateNextCoverImg';
      const vinylDiscId = isTopCard ? 'crateMainVinylDisc' : 'crateNextVinylDisc';

      return `
        ${isTopCard ? `
          <div id="crateStampLike" class="crate-stamp-badge crate-stamp-like">ME GUSTA</div>
          <div id="crateStampPass" class="crate-stamp-badge crate-stamp-pass">PASAR</div>
          <div id="crateStampPlay" class="crate-stamp-badge crate-stamp-play">JUGAR</div>
        ` : ''}

        <!-- Carátula cuadrada grande con el disco de vinilo asomando sutilmente por detrás -->
        <div class="crate-cover-vinyl-wrap" ${isTopCard ? `onclick="window.DiscoverHomeApp.togglePreviewCurrentCrateCard()"` : ''}>
          <div id="${vinylDiscId}" class="crate-peeking-vinyl ${isPlayingThis ? 'spinning' : ''}">
            <div class="crate-peeking-vinyl-grooves"></div>
            <div class="crate-peeking-vinyl-center"></div>
          </div>
          <div class="crate-square-cover-frame">
            <img id="${coverImgId}" src="${cover}" onerror="this.onerror=null; this.src='./app_logo.png';" alt="" class="crate-square-cover-img">
          </div>
        </div>

        <!-- Título en grande y Artista en gris suave -->
        <div class="crate-track-info">
          <h3 class="crate-song-title">${escapeHtmlSafe(track.title)}</h3>
          <p class="crate-song-artist">${escapeHtmlSafe(track.artist)}</p>
        </div>

        <!-- Fila inferior única con 4 botones modernos (SVGs estilizados) -->
        <div class="crate-clean-actions-row">
          <button type="button" ${isTopCard ? `onclick="window.DiscoverHomeApp.swipeLeftPass()"` : ''} class="btn-swipe-circle pass" title="Pasar canción">
            ${SVG_ICONS.close}
          </button>
          <button type="button" ${isTopCard ? `onclick="window.DiscoverHomeApp.swipeUpPlayPiano()"` : ''} class="btn-swipe-play-gold" title="Jugar al piano">
            ${SVG_ICONS.piano}
            <span>Jugar</span>
          </button>
          <button type="button" ${isTopCard ? `onclick="window.DiscoverHomeApp.swipeRightLike()"` : ''} class="btn-swipe-circle like ${isFav ? 'liked' : ''}" title="Me gusta">
            ${isFav ? SVG_ICONS.heartFilled : SVG_ICONS.heartOutline}
          </button>
          <button type="button" ${isTopCard ? `onclick="window.DiscoverHomeApp.openPlaylistOrQueueForCurrent()"` : ''} class="btn-swipe-circle add" title="Añadir a playlist">
            ${SVG_ICONS.plus}
          </button>
        </div>
      `;
    },

    /**
     * Renderiza la tarjeta de descubrimiento limpia estilo Spotify Clips / Tinder Minimalista,
     * con la siguiente tarjeta ya pre-renderizada debajo del mazo para que el swipe sea instantáneo.
     */
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

    _attachCardSwipeGestures() {
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
        } else if (currentX > 80) {
          this.swipeRightLike();
        } else if (currentX < -80) {
          this.swipeLeftPass();
        } else {
          card.style.transform = '';
          if (nextCard) {
            nextCard.style.transform = '';
            nextCard.style.opacity = '';
          }
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

    async swipeRightLike() {
      const track = this.getActiveCrateTrack();
      if (!track) return;

      const cover = getBestTrackCover(track);
      triggerGoldenVinylFlyAnimation(cover);

      dnaEngine.recordLike(track);

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
      }, 160);
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
        dualStreamEngine.prewarmUpcomingCards(this.deck.slice(this.deckIndex + 1, this.deckIndex + 4));
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
    // CARRUSELES LIMPIOS ESTILO SPOTIFY (140x140PX, SIN CAJAS NI BOTONES DOBLES)
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

    _enrichCarouselCoversAsync(list, listType) {
      if (!Array.isArray(list)) return;
      list.forEach((tr, idx) => {
        if (!hasRealHttpCover(tr)) {
          this._ensureRealCoverForTrack(tr, `carouselCover_${listType}_${idx}`);
        }
      });
    },

    async _renderUserPlaylistsCarousel() {
      const cont = document.getElementById('carouselUserPlaylists');
      if (!cont) return;

      let playlists = [];
      if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getAllPlaylists === 'function') {
        playlists = await window.IndexedDBStorage.getAllPlaylists().catch(() => []) || [];
      }

      const favCount = Math.max(dnaEngine.likes.size, (typeof window.favoriteIdsSet !== 'undefined' ? window.favoriteIdsSet.size : 0));
      const cardsHtml = [];

      // Tarjeta 1: Tus Me Gusta (140x140px estilo Spotify)
      cardsHtml.push(`
        <div class="spotify-carousel-card" onclick="window.DiscoverHomeApp.playLikedSongsPlaylist()">
          <div class="spotify-carousel-cover-wrap liked-gradient-cover">
            <div class="liked-cover-heart-icon">${SVG_ICONS.heartFilled}</div>
            <button type="button" onclick="event.stopPropagation(); switchMainTab('library'); switchLibrarySubtab('favorites');" class="spotify-floating-piano-btn" title="Abrir Tus Me Gusta">
              ${SVG_ICONS.pianoSmall}
            </button>
          </div>
          <h4 class="spotify-carousel-title">Tus Me Gusta</h4>
          <p class="spotify-carousel-artist">${favCount} canciones</p>
        </div>
      `);

      for (const pl of playlists) {
        if (!pl) continue;
        const firstTrack = Array.isArray(pl.tracks) && pl.tracks[0] ? pl.tracks[0] : null;
        const cover = firstTrack ? getBestTrackCover(firstTrack) : './app_logo.png';
        const safeId = String(pl.id || '').replace(/'/g, "\\'");
        cardsHtml.push(`
          <div class="spotify-carousel-card" onclick="window.DiscoverHomeApp.playSavedUserPlaylist('${safeId}')">
            <div class="spotify-carousel-cover-wrap">
              <img src="${cover}" onerror="this.onerror=null; this.src='./app_logo.png';" class="spotify-carousel-cover-img" alt="" loading="lazy">
              <button type="button" onclick="event.stopPropagation(); switchMainTab('library'); switchLibrarySubtab('playlists'); openPlaylistDetailView('${safeId}');" class="spotify-floating-piano-btn" title="Jugar playlist">
                ${SVG_ICONS.pianoSmall}
              </button>
            </div>
            <h4 class="spotify-carousel-title">${escapeHtmlSafe(pl.title || 'Playlist')}</h4>
            <p class="spotify-carousel-artist">${(pl.tracks || []).length} canciones</p>
          </div>
        `);
      }

      // Tarjeta para crear nueva playlist (140x140px limpia)
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

    playFromCarousel(listType, idx) {
      const arr = listType === 'because' ? this._becauseLikedList : this._weeklyDiscoveryList;
      if (!Array.isArray(arr) || !arr[idx]) return;
      dualStreamEngine.loadQueueAndPlay(arr, idx, '');
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
          window.showErrorToast('Pulsa el corazón en cualquier canción para añadirla a Tus Me Gusta.');
        }
        return;
      }
      dualStreamEngine.loadQueueAndPlay(favTracks, 0, 'Tus Me Gusta');
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


