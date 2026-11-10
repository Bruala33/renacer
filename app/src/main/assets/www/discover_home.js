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
  const THREE_MONTHS_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

  const _NORM_TITLE_CACHE = new Map();
  const _NORM_ARTIST_CACHE = new Map();

  function normalizeSongPart(str, isArtist = false) {
    const raw = String(str || '');
    if (!raw) return '';
    const cache = isArtist ? _NORM_ARTIST_CACHE : _NORM_TITLE_CACHE;
    const hit = cache.get(raw);
    if (hit !== undefined) return hit;

    let s = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    s = s
      .replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, ' ')
      .replace(/\b(official|oficial|music|video|videoclip|audio|lyric|lyrics|letra|remastered|remaster|remasterizado|live|en vivo|directo|version|edit|radio edit|extended|mix|hd|4k|hq|topic|vevo|visualizer|acustico|acoustic|session|sessions|ost|soundtrack)\b/gi, ' ')
      .replace(/\b(19\d{2}|20\d{2})\b/g, ' ')
      .replace(/\b(feat\.?|ft\.?|con|with|prod\.?)\b.*$/i, ' ');
    if (isArtist) {
      const firstPart = s.split(/\s*(?:,|&|\/|;| x | and | y | vs\.? )\s*/i)[0];
      if (firstPart && firstPart.trim().length >= 2) s = firstPart;
    } else if (s.includes(' - ')) {
      const parts = s.split(' - ').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) s = parts[parts.length - 1];
    }
    const res = s.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (cache.size > 6000) cache.clear();
    cache.set(raw, res);
    return res;
  }

  function repairSpanishBrokenAccents(str) {
    if (typeof window.repairSpanishBrokenAccents === 'function') {
      return window.repairSpanishBrokenAccents(str);
    }
    if (!str) return '';
    return String(str)
      .replace(/\bcorazn\b/gi, 'corazón')
      .replace(/\bvivirs\b/gi, 'vivirás')
      .replace(/\btarzn\b/gi, 'tarzán')
      .replace(/\bfernndez\b/gi, 'fernández')
      .replace(/\baerolneas\b/gi, 'aerolíneas')
      .replace(/\bmsica\b/gi, 'música')
      .replace(/\bcancin\b/gi, 'canción')
      .replace(/\bpasin\b/gi, 'pasión')
      .replace(/\bilusin\b/gi, 'ilusión')
      .replace(/\brazn\b/gi, 'razón')
      .replace(/\bperdname\b/gi, 'perdóname')
      .replace(/\bbulera\b/gi, 'Bulería')
      .replace(/\bjardn\b/gi, 'jardín')
      .replace(/\bdespecha\b/gi, 'despechá')
      .replace(/\bmorenama\b/gi, 'morenamía')
      .replace(/\blobohombre\b/gi, 'lobo-hombre')
      .replace(/\bpars\b/gi, 'París')
      .replace(/\bjos\b/gi, 'José')
      .replace(/\bdel ro\b/gi, 'del Río')
      .replace(/\bdestruccin\b/gi, 'destrucción')
      .replace(/\bautnticos\b/gi, 'auténticos')
      .replace(/\bfantstica\b/gi, 'fantástica')
      .replace(/\bintntalo\b/gi, 'inténtalo')
      .replace(/\bslvame\b/gi, 'sálvame')
      .replace(/\babrzame\b/gi, 'abrázame')
      .replace(/\batrvete\b/gi, 'atrévete')
      .replace(/\bparchs\b/gi, 'Parchís')
      .replace(/\bcafe\b/gi, 'café')
      .replace(/\bbose\b/gi, 'Bosé');
  }

  function getCanonicalSongSignature(title, artist, trackObj = null) {
    if (trackObj && typeof trackObj === 'object' && trackObj._canonSig !== undefined) {
      return trackObj._canonSig;
    }
    let cleanTitle = normalizeSongPart(title, false);
    const cleanArtist = normalizeSongPart(artist, true);
    if (cleanArtist && cleanTitle.startsWith(cleanArtist + ' ')) {
      cleanTitle = cleanTitle.slice(cleanArtist.length).trim();
    }
    const sig = cleanTitle ? `${cleanTitle}__${cleanArtist || 'any'}` : '';
    if (trackObj && typeof trackObj === 'object') {
      trackObj._normTitle = cleanTitle;
      trackObj._normArtist = cleanArtist;
      trackObj._canonSig = sig;
    }
    return sig;
  }

  function areSameCanonicalSong(trackA, trackB) {
    if (!trackA || !trackB) return false;
    if (trackA === trackB) return true;
    const idA = String(trackA.id || '').trim();
    const idB = String(trackB.id || '').trim();
    if (idA && idB && idA === idB) return true;
    const vidA = String(trackA.videoId || '').trim();
    const vidB = String(trackB.videoId || '').trim();
    if (vidA && vidB && vidA === vidB) return true;

    const sigA = getCanonicalSongSignature(trackA.title, trackA.artist, trackA);
    const sigB = getCanonicalSongSignature(trackB.title, trackB.artist, trackB);
    if (sigA && sigB && sigA === sigB) return true;

    const tA = trackA._normTitle !== undefined ? trackA._normTitle : normalizeSongPart(trackA.title, false);
    const tB = trackB._normTitle !== undefined ? trackB._normTitle : normalizeSongPart(trackB.title, false);
    if (!tA || !tB) return false;

    const aA = trackA._normArtist !== undefined ? trackA._normArtist : normalizeSongPart(trackA.artist, true);
    const aB = trackB._normArtist !== undefined ? trackB._normArtist : normalizeSongPart(trackB.artist, true);
    const artistMatch = (!aA || !aB || aA === 'youtube' || aB === 'youtube' || aA === 'artista' || aB === 'artista')
      ? true
      : (aA === aB || aA.includes(aB) || aB.includes(aA));

    if (!artistMatch) return false;
    if (tA === tB) return true;
    if (tA.length >= 5 && tB.length >= 5 && (tA.includes(tB) || tB.includes(tA))) {
      return true;
    }
    return false;
  }

  function buildTrackListLookupIndex(list) {
    if (!Array.isArray(list)) {
      return { ids: new Set(), vids: new Set(), sigs: new Set(), titles: new Set(), artists: new Set() };
    }
    const firstId = list.length > 0 ? String(list[0]?.id || '') : '';
    const lastId = list.length > 0 ? String(list[list.length - 1]?.id || '') : '';
    const cacheStamp = `${list.length}:${firstId}:${lastId}`;
    if (list._fastLookupIndex && list._fastLookupStamp === cacheStamp) {
      return list._fastLookupIndex;
    }
    const ids = new Set();
    const vids = new Set();
    const sigs = new Set();
    const titles = new Set();
    const artists = new Set();
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!item) continue;
      const id = String(item.id || '').trim();
      if (id) ids.add(id);
      const vid = String(item.videoId || '').trim();
      if (vid) vids.add(vid);
      const sig = getCanonicalSongSignature(item.title, item.artist, item);
      if (sig) sigs.add(sig);
      const nt = item._normTitle || normalizeSongPart(item.title, false);
      if (nt) titles.add(nt);
      const na = item._normArtist || normalizeSongPart(item.artist, true);
      if (na && na.length >= 2) artists.add(na);
    }
    const idxObj = { ids, vids, sigs, titles, artists };
    try {
      Object.defineProperty(list, '_fastLookupIndex', { value: idxObj, writable: true, configurable: true });
      Object.defineProperty(list, '_fastLookupStamp', { value: cacheStamp, writable: true, configurable: true });
    } catch (_) {}
    return idxObj;
  }

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
        if (!curThumb || curThumb === './app_logo.png' || curThumb.startsWith('data:image/svg+xml') || curThumb.includes('300x300bb') || curThumb.includes('100x100bb') || /i\.ytimg\.com/i.test(curThumb)) {
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
      this.cooldownMap = new Map(); // { key -> timestampMs } para no repetir canciones durante 3 meses (90 días)
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

    _pruneCooldownMap() {
      const now = Date.now();
      for (const [k, ts] of this.cooldownMap.entries()) {
        if (!ts || (now - Number(ts)) > THREE_MONTHS_COOLDOWN_MS) {
          this.cooldownMap.delete(k);
        }
      }
    }

    putTrackOnCooldown(track) {
      if (!track) return;
      const now = Date.now();
      const id = String(track.id || '').trim();
      if (id) this.cooldownMap.set(`id:${id}`, now);
      if (track.videoId) this.cooldownMap.set(`vid:${String(track.videoId).trim()}`, now);
      const sig = getCanonicalSongSignature(track.title, track.artist, track);
      if (sig) this.cooldownMap.set(`sig:${sig}`, now);
    }

    isTrackOnCooldown(track) {
      if (!track) return false;
      if (this.cooldownMap.size === 0) return false;
      const now = Date.now();
      const checkKey = (k) => {
        if (!k || !this.cooldownMap.has(k)) return false;
        const ts = Number(this.cooldownMap.get(k)) || 0;
        if (now - ts <= THREE_MONTHS_COOLDOWN_MS) return true;
        this.cooldownMap.delete(k);
        return false;
      };
      const id = String(track.id || '').trim();
      if (id && checkKey(`id:${id}`)) return true;
      if (track.videoId && checkKey(`vid:${String(track.videoId).trim()}`)) return true;
      const sig = getCanonicalSongSignature(track.title, track.artist, track);
      if (sig && checkKey(`sig:${sig}`)) return true;
      return false;
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
        if (data.cooldown_entries && typeof data.cooldown_entries === 'object') {
          for (const [k, ts] of Object.entries(data.cooldown_entries)) {
            this.cooldownMap.set(k, Number(ts) || 0);
          }
          this._pruneCooldownMap();
        }
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
      this._pruneCooldownMap();
      const cooldownObj = {};
      for (const [k, ts] of Array.from(this.cooldownMap.entries()).slice(-800)) {
        cooldownObj[k] = ts;
      }
      return {
        vector: this.userVector.map(v => +Number(v).toFixed(4)),
        dials: { ...this.dials },
        dontCare: { ...this.dontCare },
        likes: Array.from(this.likes).slice(-300),
        dislikes: Array.from(this.dislikes).slice(-200),
        cooldown_entries: cooldownObj,
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
      if (plTracks.length > 0) {
        const idxObj = buildTrackListLookupIndex(plTracks);
        const normArt = track._normArtist !== undefined ? track._normArtist : normalizeSongPart(track.artist, true);
        if (normArt && idxObj.artists.has(normArt)) {
          artistBonus = 0.16;
        }
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
      this.putTrackOnCooldown(track);
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
      this.putTrackOnCooldown(track);
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

  const CLIENT_CUSTOM_SYNCED_LYRICS_DB = [
    {
      videoId: 'F8oXB7zLwxk',
      keys: ['adiosatubarrio', 'perreosanxeadiosatubarrio', 'adiosatubarriomanofirme'],
      trackName: 'Adiós a tu barrio [MANO FIRME]',
      artistName: 'Perreo Sanxe',
      duration: 212,
      syncedLyrics: `[00:00.50] (Introducción instrumental — Adiós a tu barrio)
[00:13.80] En la tierra hay un gran motor
[00:19.80] Y la gasolina es la inmigración
[00:27.50] Normalmente gana quien da más
[00:34.00] Como dicen en la agenda de Klaus Schwab
[00:41.50] Me olvidaré de pagarte la pensión si el morenito necesita ayuda
[00:48.50] Hoy voy a darle a un cuarto de millón par de motivos para una aventura
[00:55.50] Te quejas pero tú sabes
[00:59.00] Que lo han pagao tus impuestos
[01:02.20] Me la pela si te cabreas, yo estoy viviendo como Dios
[01:09.20] Ha sido la ultraderecha la que ha jodido la nación
[01:16.20] Hacemos negocios con armas, voy a cambiarme de avión
[01:23.00] Y somos como la Yolanda, no soy la casta, soy mejor
[01:29.80] Un decreto de ley, por favor, para el retrasado de Puigdemont
[01:36.80] Mira, se desangra y adiós a tu barrio
[01:46.50] Hoy los menas, como La Razón
[01:52.80] Saben quién da la puta subvención
[02:00.20] Solo piensa, podría ser peor
[02:06.80] Tú analiza que tu rey es el Borbón
[02:14.20] Me olvidaré de prestar declaración porque tú sabes que todo me suda
[02:21.20] Hoy voy a darle a tu hija la menor par de motivos para una clausura
[02:28.20] Yo solo traigo animales
[02:31.80] Vosotros cargáis el muerto
[02:34.80] Me la pela si te cabreas, yo estoy viviendo como Dios
[02:41.80] Ha sido la ultraderecha la que ha jodido la nación
[02:48.80] Hacemos negocios con armas, voy a cambiarme de avión
[02:55.60] Y somos como la Yolanda, no soy la casta, soy mejor
[03:02.50] Un decreto de ley, por favor, para el retrasado de Puigdemont
[03:09.50] Mira, España se desangra y adiós a tu barrio
[03:16.20] Y tu influencer ya se ha comprado el nuevo coche y una casa
[03:19.80] Y tú con cuarenta y pico compartes piso
[03:21.80] Mejor pedirme una pensión y tú sacándote la ESO pa mil y poco, sí, eso, vaya chiste
[03:25.20] Y ahora te digo que vivo como un señor y tú dejándote el riñón y por favor llórame en Twitter
[03:28.80] Que te crees un templario, to el día en tu cuarto llorando`
    },
    {
      videoId: 'l3zCFXb4xSg',
      keys: ['quiensoy', 'quiensoymanofirme', 'perreosanxequiensoy'],
      trackName: '¿QUIÉN SOY? [MANO FIRME]',
      artistName: 'Perreo Sanxe ft. Big-Laska',
      duration: 192,
      syncedLyrics: `[00:01.00] Yo, yo, yo... Dime lo que tienes, eh, que me lo quedo
[00:11.00] Tengo tratos con Marruecos muy tensos
[00:14.20] Subo impuestos, traigo negros
[00:17.20] ¿Quién soy? (Pedro) ¿Quién soy? (Pedro) ¿Quién soy? (Pedro) ¿Quién soy?
[00:22.80] Tengo tratos con Marruecos muy tensos
[00:26.00] Subo impuestos, traigo negros
[00:29.00] ¿Quién soy? (Pedro) ¿Quién soy? (Pedro) ¿Quién soy?
[00:34.50] Noticias reales sin atrezo, todos presos
[00:38.20] Mi mandato sobre huesos
[00:40.50] Soy el hombre perfecto, no tengo ni un fracaso
[00:43.50] Si me echo pa la calle las charos me tiran besos
[00:46.50] Easy, haciendo negocios con la crisis
[00:49.50] Y si fuese uno más dentro del ISIS
[00:52.50] Vuelo y bebo whisky, putas, coca y business
[00:55.50] Tú buscas mi frisbee como un pekinés
[00:58.50] Esclavo de mi amado, pero me llaman vendido
[01:01.50] Si hablo con abogados, estáis bien jodidos
[01:04.50] Veo sobres que vuelan de arriba a abajo de amigos cercanos
[01:07.80] Huelen blanco y cuentan fajos, to cocido
[01:10.50] Callo pero no otorgo, si hablo sube el pan
[01:13.50] All the guys dicen "oh fuck", con Marlaska dan
[01:16.50] Alquitrán y fango
[01:18.50] Noches enteras eliminando pruebas que pudieran hablar, porque
[01:22.20] Tengo tratos con Marruecos muy tensos
[01:25.20] Subo impuestos, traigo negros
[01:28.20] ¿Quién soy? (Pedro) ¿Quién soy? (Pedro) ¿Quién soy? (Pedro) ¿Quién soy?
[01:33.80] Tengo tratos con Marruecos muy tensos
[01:37.00] Subo impuestos, traigo negros
[01:40.00] ¿Quién soy? (Pedro) ¿Quién soy? (Pedro) ¿Quién soy?
[01:45.80] Soy el capo en las sombras, barro bajo la alfombra
[01:48.80] Aquí a Big-Laska tu vasca cachonda
[01:51.80] Luz en rotondas y lanchas de ronda
[01:54.80] Muevo en Ferraris y piso en Honda
[01:57.80] Llevo un estilo que es la bomba, por mis cojones mantengo esta vida loca
[02:01.50] Ahora muevo millones porque a mí me toca
[02:04.20] Siempre entran toneladas de hachís y coca
[02:07.00] Vergüenza poca, hechos reales y tú eres un bocas
[02:09.80] Controlo medios e intercambios en mis puntos
[02:12.80] Soy el que arregla las cosas cuando se ponen chulos
[02:15.80] Y si te hablara de ciertos asuntos
[02:18.80] Soy un cabrón, un tiburón del Estado profundo
[02:21.80] Son mis mansiones las que veo en mi postal
[02:24.80] Recortando la lana de camino al Escorial
[02:27.80] Me da igual, Guardia Civil o Nacional, subnormal
[02:30.80] Porque yo soy la ley, porque tú no eres na, por eso
[02:33.50] Tengo tratos con Marruecos muy tensos
[02:36.50] Subo impuestos, traigo negros
[02:39.50] ¿Quién soy? (Pedro) ¿Quién soy? (Pedro) ¿Quién soy? (Pedro) ¿Quién soy?
[02:45.20] Tengo tratos con Marruecos muy tensos
[02:48.20] Subo impuestos, traigo negros
[02:51.20] ¿Quién soy? (Pedro) ¿Quién soy? (Pedro) ¿Quién soy?`
    },
    {
      videoId: 'IYoKjx_sR3c',
      keys: ['politika', 'politikamanofirme', 'perreosanxepolitika', 'asieslapolitica'],
      trackName: 'Polítika [MANO FIRME]',
      artistName: 'Perreo Sanxe',
      duration: 132,
      syncedLyrics: `[00:00.50] (Introducción de guitarra punk-rock — Polítika)
[00:18.80] Ni soy tonto ni soy nuevo, soy muy guapo y con dinero
[00:22.20] Hago todo lo que debo para ganar puntos
[00:25.20] Cada vez me importáis menos, españoles sois veneno
[00:28.50] Soy un moro de Pozuelo un poco más chungo
[00:31.50] Miento a mi alternativa, jodo vidas, subo el IVA
[00:36.20] Así es la política
[00:39.20] Mientras pagues yo te quiero, no te pases, no eres negro
[00:42.50] O te mando al agujero con tos tus difuntos
[00:45.50] Se gobierna con el miedo, me lo dijo Zapatero
[00:48.80] Y me paso por los huevos todos tus insultos
[00:51.80] Miento a mi alternativa, jodo vidas, subo el IVA
[00:56.50] Así es la política
[00:59.20] La mitad de lo que ganas, primo, me lo he metido
[01:04.20] En medio de un fiestón, qué colocón
[01:07.20] Koldo se ha venido y se ha traído un kilo o dos
[01:12.00] La mitad de lo que ganas, primo, me lo he metido
[01:17.00] En medio de un fiestón, qué colocón
[01:20.00] Koldo se ha venido y se ha traído un kilo o dos
[01:38.00] Mi país está en la ruina y yo gozándome la vida
[01:43.00] Así es la política
[01:45.80] La mitad de lo que ganas, primo, es pa mi equipo
[01:50.50] Y el tonto de Feijóo y tu pensión la he malvertido
[01:55.50] Y se ha perdido en mi asesor
[01:58.50] La mitad aún no ha entendido, solo divido
[02:03.50] Al pueblo español, fue mi mentor quien me lo dijo`
    },
    {
      videoId: 'jMgOWiuVQ0s',
      keys: ['mascarillas', 'mascarillasmanofirme', 'perreosanxemascarillas'],
      trackName: 'Mascarillas [MANO FIRME]',
      artistName: 'Perreo Sanxe',
      duration: 147,
      syncedLyrics: `[00:00.50] (Introducción de guitarra — Mascarillas)
[00:05.50] Estoy cansado, vaya donde vaya está siempre petao de gente
[00:09.20] Voy conspirando, voy a bajarme a estos putos tontos de veinte en veinte
[00:13.20] Acojonados, todos juntitos en casa presos, bien obedientes
[00:17.20] Son demasiados, hay que acabar con todos dice el sapo de mi mente
[00:21.20] Alucinando de que me tiren tanto fango y claro que mienten
[00:25.20] Me suda el rabo, me siento un puto rockstar pudiendo ser presidente
[00:29.20] Vas a entrar al restaurante con mascarilla, no vas a ver a tu familiar
[00:34.20] Y todos mejor calladitos, así que ponte bien el bozal
[00:38.20] Tengo comprada a la policía y vas a saber lo que es libertad
[00:42.20] Pero a ver, mírame, ¿tú eres tonto o no ves las noticias? Vacúnate ya
[00:48.50] Estoy muy harto, que todo está en pelis, pillo si os toca comprar
[00:52.50] De cuatro en cuatro, no quiero veros juntos nunca ni aunque sea Navidad
[00:56.50] Y lo he cerrado, te pongo aforo limitado y multas pa rematar
[01:00.50] Y mucho cuidado o te reforma la casa la Policía Nacional
[01:04.50] Vas a entrar al restaurante con mascarilla, no vas a ver a tu familiar
[01:09.50] Y todos mejor calladitos, así que ponte bien el bozal
[01:13.50] Tengo comprada a la policía y vas a saber lo que es libertad
[01:17.50] Pero a ver, mírame, ¿tú eres tonto o no ves las noticias? Vacúnate ya
[01:36.20] Te has acercao al Lidl pero a ti te corresponde el Mercadona
[01:40.20] Y como salgas de tu pueblo te llevas una receta de recuerdo
[01:44.50] Vas a entrar al restaurante con mascarilla, no vas a ver a tu familiar
[01:49.50] Estoy cansado de ser un don nadie, trátame de Su Majestad
[01:53.50] La gente muerta no contamina, por eso esto es un deber moral
[01:57.50] Pero a ver, ¿tú eres tonto o qué? Es por la culpa del cambio, quiero más
[02:01.50] Quiero más mascarillas, yo me merezco vida de zar
[02:05.50] Estoy cansado de pagar pensiones, así que porfa muérete ya
[02:09.50] Me alegra tanto que defiendan vidas de gente que no entiende de na
[02:13.50] Pero a ver, mírame y coge sitio que eres bienvenido a la mafia estatal`
    },
    {
      videoId: 'a4YfyblzE7g',
      keys: ['mienteme', 'donfrijolmienteme', 'donfrijolftperreosanxemienteme', 'perreosanxemienteme'],
      trackName: 'Don Frijol ft. Perreo Sanxe - MIÉNTEME',
      artistName: 'Ultimoscruzados',
      duration: 206,
      syncedLyrics: `[00:01.00] Me viste robando, yo lo sé, te descubrí
[00:05.50] Pedro, miénteme, dime que tú cuentas conmigo
[00:11.00] Tú dime y te pongo votos del PP
[00:15.50] Y tú dices que eres mi amigo, mi amigo
[00:20.50] Pedro, miénteme, dime que tú cuentas conmigo
[00:26.00] Tú dime y te pongo votos del PP
[00:30.50] Y tú dices que eres mi amigo, mi amigo
[00:35.50] ¿Quién dijo amigos? Si sabes que yo soy más de separatistas
[00:40.50] También de terroristas, pero contigo
[00:45.00] Aunque tú eres mi putita favorita y sé que necesitas
[00:50.00] Y si a Bego la imputaran, tan, tan, tan
[00:54.50] Sabes que no digo nada, pa' ti na', na', na'
[00:59.00] Estoy un poco celoso de tu orangután
[01:03.50] Porque cuando estáis solitos mucho mua, mua, mua
[01:08.50] Y si a Bego la imputaran, tan, tan, tan
[01:13.00] Tengo comprados los medios de mi na', na', na'
[01:17.50] Y si por si acaso luego quisieras pactar
[01:22.00] Te voy a llevar primero para vacunar
[01:26.50] Pedro, Pedro, Pedro, mua, Pedro, no está bien
[01:31.50] Eres un cabrón retorcido
[01:35.50] Dime que esta noche yo soy tu Leire
[01:40.00] Y mañana me haces el lío, el lío
[01:45.00] Pedro, miénteme, dime que tú cuentas conmigo
[01:50.50] Tú dime y te pongo votos del PP
[01:55.00] Y mañana te hago un cocido, cocido
[02:00.00] Qué importa, si me ganas en las urnas qué importa
[02:05.00] Tú y yo sabemos quién por detrás lo corta
[02:09.50] Tú y yo estamos solo aquí de momento, qué nos importa
[02:15.00] Si te gano en las urnas qué importa
[02:19.50] Tú y yo sabemos quién por detrás lo corta
[02:24.00] Tú y yo estamos solo aquí de momento, qué nos importa, Pedro
[02:32.00] Miénteme, me tienes para el sillón`
    },
    {
      videoId: 'RYYnXrTBFq4',
      keys: ['elsecretodelasayudas', 'perreosanxeelsecretodelasayudas'],
      trackName: 'Perreo Sanxe - El secreto de las ayudas',
      artistName: 'Ultimoscruzados',
      duration: 236,
      syncedLyrics: `[00:18.50] Mira, mira cómo dice
[00:20.50] Se firmaron sin quererlo los papeles que pediste para Air Europa
[00:26.50] Donde estaba el pasaporte, las paguitas y el acceso pa'l hotel
[00:32.50] Y ahora estamos camino de Venezuela disfrutando toditos que pocos quedan
[00:39.00] Ahora tengo que ir a José pa' cogerle porque Óscar vino ayer
[00:45.00] Y necesito una ayudita con impuestos, subvenciono a Mediaset
[00:51.50] Y el Broncano es gilipollas y os cuesta más de un millón al mes
[00:57.50] Camino de la frontera disfrutando toditos la vida buena
[01:04.00] Cómo no voy a mojarme si en Valencia nunca para de llover
[01:10.00] Y si esto pasa otra vez
[01:14.00] Y si seguimos con el plan establecido
[01:18.50] Os aseguro que lo vais a disfrutar
[01:22.50] Probablemente encontremos enemigos
[01:27.00] Pero nos sobran maletines en Ferraz
[01:42.00] Si quieres ahogarte en el Turia, madre mía, agárrate
[01:48.50] Y las puertas de esa presa no se abren si no lo hago yo querer
[01:55.00] Y mira cómo llegan camino de la frontera, pobrecitos cansados con la patera
[02:02.00] Cómo no voy a acogerlos y pagarles y meterles a un hotel
[02:08.00] Y si se llama Mohamed
[02:12.00] Improvisemos un guion definitivo
[02:16.50] No tengamos más remedio que aprobar
[02:21.00] Porque soy hijo de Estrellas, el elegido
[02:25.50] Para que España no se vuelva a levantar
[02:30.00] Y suena bien, parece que les gusta a los judíos
[02:34.50] Solo tenemos que vender mediocridad
[02:39.00] Hace ya tiempo que no estamos divididos
[02:43.50] Porque las Charos han salido a pregonar
[02:56.00] Es que se ve que eres un deficiente y que tu culo pertenece al presidente
[03:06.00] Y hemos sobrevivido al precio del poder
[03:12.50] Y es que andábamos siempre al filo, pero el Covid salió bien
[03:19.00] La pandemia y el control del miedo, tu vida a plazos, siempre al sendero
[03:25.50] Llena de mojas hasta Teruel, rezando danbi, danbi, dan
[03:32.00] De tres en tres a todo el mundo entero, pienso imponerme con jueces o por mis huevos
[03:38.50] Ya me dices tú tu número de Visa, que por ahí llegan los Sopranos socialistas
[03:45.00] Nadie sube el camino sin suerte, que los judíos son los que detrás invierten
[03:51.50] Existe un sendero oscuro y vacío, así que abróchate amigo que hay curvas que tomar
[03:58.00] Siempre será mejor esconderte, que el socialismo os va quedando ya de muerte
[04:04.50] Guarda mucho dinero en el maletero, no me hagas esperar`
    },
    {
      videoId: 'QGR1FMta87c',
      keys: ['impuestos', 'perreosanxeimpuestos'],
      trackName: 'Perreo Sanxe - Impuestos',
      artistName: 'Ultimoscruzados',
      duration: 143,
      syncedLyrics: `[00:05.00] No entiendo por qué has salido a la calle tú tan fresco
[00:10.50] Y dime por qué, si nos hemos quedado con tu sueldo
[00:16.00] Y ahora hay impuestos que pagar
[00:20.50] Pa' poner las calles y de mientras vamos a estafar con la Seguridad Social
[00:28.00] Ya lo bueno y lo que importa son impuestos
[00:32.50] Y eso es lo que quiero, impuestos
[00:36.50] Que todas las mañanas os cobren impuestos
[00:41.00] Y sea por la tarde y siga habiendo impuestos
[00:45.50] Y sea por la noche y os pongan impuestos pa' cenar
[00:51.00] Y dime por qué cuando veo a Broncano estoy revuelto
[00:56.00] Y cógete un tren, que llegas andando o ardiendo
[01:01.50] Tienes que empezar por entender
[01:06.00] Quién te cuenta cuentos y de mientras tienes que pagar y ya no da para alquiler
[01:13.50] Hay mucho homosexual que paga impuestos
[01:18.00] Y eso es lo que quiero, impuestos
[01:22.00] Que todas las mañanas os cobren impuestos
[01:26.50] Y sea por la tarde y siga habiendo impuestos
[01:31.00] Y sea por la noche y os pongan impuestos pa' cenar
[01:52.00] Y eso es lo que quiero, impuestos
[01:56.50] Que todas las mañanas os cobren impuestos
[02:01.00] Y sea por la tarde y siga habiendo impuestos
[02:05.50] Y sea por la noche y os pongan impuestos pa' cenar
[02:11.00] Y párate a ver que yo no voy a irme del Congreso
[02:16.50] Que yo y mi mujer nos vamos en caja o igual presos`
    },
    {
      videoId: 'XL4GeI4K1Xs',
      keys: ['jodertebienlavida', 'perreosanxejodertebienlavida'],
      trackName: 'Perreo Sanxe - Joderte bien la vida',
      artistName: 'Ultimoscruzados',
      duration: 204,
      syncedLyrics: `[00:06.00] Huele a aire de Venezuela, he tomado todo el control
[00:15.00] Nuevo impuesto para carreteras y otro más para educación
[00:24.00] Y es que no habrá querella que a mí me haga temblar
[00:33.00] Porque está todo planeado, esto acaba de empezar
[00:41.50] Voy a joderte bien la vida y lo tapa el Grupo Prisa
[00:46.50] Tú procura estar contento y siempre con una sonrisa
[00:51.50] Tus complejos inferiores por no decir los colores
[00:56.50] Y te callas ante la ruina de todos los españoles
[01:02.50] Ay, si es que no tenéis cojones, ay
[01:10.00] Y es que el Uno a mí me llaman cuando escribo en WhatsApp Web
[01:19.00] Me cago en Víctor de Aldama, solo se le ocurre a él
[01:28.00] Y este año le pido al cielo otro Covid por favor
[01:37.00] Nos hace falta dinero, está cara la invasión
[01:45.50] Voy a joderte bien la vida y lo tapa el Grupo Prisa
[01:50.50] Tú procura estar contento y siempre con una sonrisa
[01:55.50] Tus complejos inferiores por no decir los colores
[02:00.50] Y te callas ante la ruina de todos los españoles
[02:06.50] Ay, si es que no tenéis cojones, ay
[02:12.00] Y no des lecciones, viejo resentido, tienes tres casas y has vendido una de ellas por tres millones
[02:21.00] Tonto los cojones, dices que toda su generación tiene Netflix, también el Amazon, venga no te jode
[02:30.00] Y es que son unos pobres busca-vidas, siempre con una sonrisa
[02:36.00] Si ellos no pagan impuestos, viejo, te va a dar la risa
[02:41.00] No les damos soluciones, solo tocáis los cojones
[02:46.00] Y te callas ante la ruina de todos los españoles
[02:52.00] Ay, de jóvenes españoles, ay
[02:57.00] Y es que España ya es de pobres, solo hay cuatro vividores
[03:02.00] El sistema está montado pa' que no cambie aunque votes
[03:07.00] Siempre son los españoles aunque el Turia te ahogue
[03:12.00] No vas a ver ni pasta porque está con los morones
[03:17.00] Aunque el Turia te ahogue, te jodes, te jodes`
    },
    {
      videoId: 'mmELyTiDEAw',
      keys: ['empresas', 'empresasmanofirme', 'perreosanxeempresas', 'perreosanxeftdonjoseempresas'],
      trackName: 'Perreo Sanxe ft. DON JOSÉ - EMPRESAS [MANO FIRME]',
      artistName: 'Ultimoscruzados',
      duration: 215.5,
      syncedLyrics: `[00:10.87] Sigo buscando y voy con prisa con mi gente a un lugar
[00:14.42] Una llamada de alguien que me pueda colocar
[00:18.13] Una aventura como los kayaks de Senegal
[00:25.24] Cambiar tu no me creo nada por traer mi verdad
[00:29.14] Si veo disidencia vas directo al gulag
[00:32.51] Recuerda tú no eres nada tonto y nadie me puede parar
[00:39.96] Sentirme como una mochila y con los trenes explotar
[00:43.98] Me cuelgo de tu sueldo como el bigote de Aznar
[00:47.14] Mira qué bien ponen el culo, es digno de admirar
[00:50.86] Te doy una paga si lloras
[00:53.55] Quiero volver a hablar, mis empresas facturan
[00:59.73] La vida es fenomenal, tengo tres alta gama
[01:07.08] Y las Charos son mis putas fans
[01:18.16] Paro y fango, no hay paro, España sigue genial
[01:21.77] Hago negocios con Petróleos y me apoya Sumar
[01:25.50] Mira qué musical, soy mejor que Abascal
[01:32.77] Sigo flipando cómo aguantan y su afán de tragar
[01:36.34] Últimamente veo mucho mi cara en Telegram
[01:40.11] A veces pienso que una ardilla anda detrás
[01:47.17] Ser algún socialista no es que sea un ser social
[01:51.25] Me siento como Sheldon pero un poco más letal
[01:54.52] Mira qué culebrón, como cine, me están poniendo mal
[01:58.21] España ya es Gomorra
[02:00.86] Quiero volver a hablar, mis empresas facturan
[02:06.98] La vida es fenomenal, tengo tres alta gama y las Charos
[02:17.29] Quiero volver a hablar, mis empresas facturan
[02:23.28] La vida es fenomenal, tengo tres alta gama
[02:30.83] Y las Charos son mis putas fans
[02:38.11] Sigo buscando un presidente como el gran Nicolás
[02:41.82] Donde los sueños de las ratas se hacen realidad
[02:45.58] Un país rico como este para expoliar
[02:50.61] Empresas que reventar y vidas que destrozar
[02:57.95] Tú los ves, nos aclaman, está claro
[03:04.65] Quiero volver a gastar en empresas que facturan
[03:10.63] Dales Netflix y un sofá, no saldrán de su casa
[03:18.04] Está claro que he ganado ya`
    },
    {
      videoId: 'kU-Z94uTPuo',
      keys: ['porlabocamuereelrey', 'porlabocamuereelreymanofirme', 'perreosanxeporlabocamuereelrey'],
      trackName: 'Perreo Sanxe - Por la boca muere el rey [MANO FIRME]',
      artistName: 'Ultimoscruzados',
      duration: 264.4,
      syncedLyrics: `[00:12.80] Llega Air Europa sin vales y todo ya está dentro
[00:19.70] Y ahora a ver quién los pare, huele mal desde hace tiempo
[00:25.80] Yo estoy de puta madre, están conmigo
[00:31.80] Sabes, podrías alegrarte un poquito más por lo que decido
[00:38.80] Sabes que robaré, está escrito, ese es mi destino
[00:44.80] Sabes que quiero más, no sé cómo pagar a tantos amigos
[00:51.80] Y votar hace ya tiempo que perdió el sentido
[01:04.70] No eres nadie ni el Rey pa' decirme qué es la ley
[01:10.80] Con mi puta locura llega la censura por todo Internet
[01:16.80] Alguien dijo en una red que Begoña tiene nuez
[01:23.70] Y yo lo estoy sufriendo, yo lo estoy sufriendo otra vez
[01:43.70] Dime por qué preguntas si me sudas los huevos
[01:49.80] Y en la declaración le añado a la juez: mira qué talento
[01:56.20] No puedes engañarme, soy el que controla
[02:02.90] Quiero a negros y rojos y hacer de esto un Ciudad Angola
[02:08.90] Sabes que robaré, está escrito, ese es mi destino
[02:15.20] Sabes que quiero más, no sé cómo pagar a tantos amigos
[02:22.50] Y votar hace ya tiempo que perdió el sentido
[02:35.10] Y si te digo que esto ha sido Franco, te la he metido hasta el ombligo
[02:41.50] Porque yo digo qué es fango, porque pago todo lo que digo
[02:47.80] Me he dado cuenta cada vez que canto, hablo de temas que tengo prohibidos
[02:54.00] Zapatero es un masón de alto rango que ha conspirado pa' acabar con todo
[03:00.80] Hay una guerra que empezó hace rato, elige un bando, no seas un tibio
[03:06.80] Por lo que queda del hombre blanco voy a ofreceros como sacrificio`
    },
    {
      videoId: '8i2peB3MEpA',
      keys: ['porculpadevo', 'porculpadevox', 'perreosanxeporculpadevox'],
      trackName: 'Perreo Sanxe - Por culpa de Vox',
      artistName: 'Ultimoscruzados',
      duration: 224.1,
      syncedLyrics: `[00:11.50] Como Nico y Chávez en Venezuela
[00:17.00] Veo caer la nieve en la mesa
[00:22.50] Una nación que llevo a la ruina directa
[00:32.00] Como Nico y Chávez en Venezuela
[00:37.50] Soy el infierno hecho carne en la tierra
[00:43.00] Un Christian Grey sin patria y mi cara por bandera
[00:53.00] Será Garzón o Marlaska los que tapen toda la inmigración
[01:02.50] Será el poder de ser quien soy
[01:08.00] Pero esta mierda es por culpa de Vox
[01:19.00] Como Nico y Chávez en Venezuela
[01:24.50] Soy Lamborghini contra tu bicicleta
[01:30.00] Es un misterio el conservar aún la cabeza
[01:40.00] Como Nico y Chávez en Venezuela
[01:45.50] Vamos mi niño a morirnos de ELA
[01:51.00] Pero lo parte La 1, la nueva revuelta
[02:01.00] No es Feijóo, yo soy mejor, te subo cinco pavos la pensión
[02:10.50] Será gracias al Baby Boom
[02:16.00] Pero esta mierda es por culpa de Vox
[02:23.00] Soy la verdad, soy el control, yo me río en tu cara desde mi mansión
[02:32.50] Es noche de cena con el masón
[02:38.00] Pero esta mierda es por culpa de Vox
[03:03.00] En mi sillón cuento el millón y tú con frío en la manifestación
[03:12.50] Será la manipulación, pero esta noche os mataría a tos
[03:22.00] Y es la verdad, eres español y España trajo el mensaje de Dios
[03:31.50] Por eso odiamos a esta nación, pero esta mierda es por culpa de Vox`
    },
    {
      videoId: 'YeWmWUjIZKg',
      keys: ['socialismo', 'socialismomanofirme', 'perreosanxesocialismo'],
      trackName: 'Perreo Sanxe - SOCIALISMO [MANO FIRME]',
      artistName: 'Ultimoscruzados',
      duration: 241.4,
      syncedLyrics: `[00:02.50] ¿Hola? ¿Pedro? Hola José, cuéntame, ya sé cómo podemos hacerlo
[00:08.70] Tengo un plan. Soy todo oídos
[00:18.70] José me llamó porque había una forma para vaciar todas las arcas españolas
[00:27.00] Porque él también lo vio de junto al señor Chávez: el dinero se acabó, ahora viviréis del aire
[00:35.50] Me preguntan que dónde estará, si en Singapur o en Suiza o en las Islas Caimán
[00:44.00] Begoña Gómez es mi mujer, trabajaba en un burdel, su padre tiene saunas repartidas por el centro
[00:52.50] A los autónomos y pymes me los pongo a cuatro, una ardilla rebelde que se me ha descontrolado
[01:01.00] Soy el señor de la corrupción y gracias a tus impuestos tienes educación
[01:09.50] Oh, es socialismo, cinco cosas que dejamos sin tocar
[01:18.00] Oh, es socialismo, por encima de todas las cosas
[01:30.50] Ábalos cayó y yo sigo en el poder, me cargué muchos trabajos y aún me tratan bien
[01:39.00] No pido ni disculpas por lo que os he inoculado, cuando salgo a la calle soy el sueño de las Charos
[01:47.50] Le di a un rato un familiar el honor de ver a España sometida al Islam
[01:56.00] Oh, es socialismo, tus impuestos nos financian la coca
[02:04.50] Oh, es socialismo, pero mira qué progre Barcelona
[02:13.00] Es socialismo
[02:27.50] Triste en Argentina y su historia, y Hugo se sacó toda la polla
[02:37.00] Felices sus hijos y tras Nico en su país no queda ni el sol
[02:46.00] Oh, es socialismo, la fiesta me la pagan tus horas
[02:54.50] Todos somos los mismos, en el curro comemos gambas rojas
[03:03.00] Oh, es socialismo, el dinero antes que las personas
[03:11.50] Oh, es socialismo, debes saber si te lloran, es socialismo`
    },
    {
      videoId: '7J0xFQqAMHI',
      keys: ['estrelladelislam', 'estrelladelislammanofirme', 'perreosanxeestrelladelislam'],
      trackName: 'Perreo Sanxe - Estrella del Islam [MANO FIRME]',
      artistName: 'Ultimoscruzados',
      duration: 148,
      syncedLyrics: `[00:12.50] He creado un socio marroquí que a veces hace chantaje con lo de mi mujer
[00:19.00] Está donde la luz que dicen que hay, donde termina el Estrecho y empieza el mar
[00:25.50] Donde no tienes derechos ni libertad, donde te cortan la mano si robas pan
[00:32.00] He creado un socio marroquí, yo siempre le hablo bonito por si está escuchando mi iPhone
[00:39.00] Con el Mossad te lleno todo de menas y vienen más
[00:44.00] A veces tengo que hacer como que fue un error, a veces tengo que huir porque no puedo más
[00:50.00] Mi estrella del Islam, mi dulce Mohamed, te entregaría mi vida y mi país
[00:57.00] Mi estrella del Islam, mi bombón de licor, porque estar lejos me roba el corazón
[01:04.00] Dime quién vendrá a enseñar el Corán, porque en España ya no quedan hombres
[01:12.00] No puedo más, no puedo estar así Mohamed, entiéndeme, esta tensión me está matando
[01:23.50] Donde no tienes derechos ni libertad, donde termina el Estrecho de Gibraltar
[01:30.50] Mi estrella del Islam, mi estrella del Islam, mi dulce Mohamed, te entregaría mi vida y mi país
[01:38.50] Mi estrella del Islam, mi bombón de licor, porque estar lejos me roba el corazón
[01:45.50] Dime quién vendrá a enseñar el Corán, porque en España ya no quedan hombres
[01:52.50] Y ahora de verdad, ¿cuándo despertaréis? Si temes por tu vida en tu país
[01:59.50] ¿No ves que nos da igual que eres español? Y si han violado a tu hija la menor
[02:06.50] Y tú estás en un mejor lugar y tú ahora sientes un dolor sin nombre
[02:18.00] Quiero irme con él`
    },
    {
      videoId: 'hUxt4QhapJc',
      keys: ['contigoahorasiquierogobernar', 'lostanpanchos', 'losmorancoscontigoahorasiquierogobernar'],
      trackName: '"CONTIGO AHORA SÍ QUIERO GOBERNAR" - LOS TAN PANCHOS / Los Morancos (Parodia)',
      artistName: 'Los Morancos',
      duration: 158,
      syncedLyrics: `[00:02.00] Con todos ustedes, Pedro Sánchez y Pablo Iglesias: Los Panchos... perdón, Los Tan Panchos
[00:10.00] Pedrito y Pablo queremos gobernar, pero parece que no entiende la gente
[00:15.50] Que nos queramos así de repente y hoy tranquilamente lo vamos a explicar
[00:21.50] En realidad no nos podemos ni ver y nos odiamos los dos profundamente
[00:27.00] Pero es que Vox ha subido de repente y forzosamente lo tengo que querer
[00:33.00] Quiero tres ministerios (Te los doy), la vicepresidencia (Te la doy)
[00:38.50] Un cuarto en la Moncloa (Te lo doy), dos kilos de langostinos de Sanlúcar
[00:44.00] Quiero tu avión privado (¿Mi avión privado?) No, no, que no, mi avión privado que no, que ahí vuelo yo
[00:52.50] ¿Que no? (Que no) Pues entonces me voy con los de Vox (No, no)
[00:57.50] Me voy con los de Vox (Que no, que no, me voy con los de Vox)
[01:02.50] Que con Coletas yo no pienso pactar, yo lo que quiero son nuevas elecciones
[01:08.00] Con cada una gano más sillones, estas peleítas me vienen genial
[01:14.00] Aunque te dije un día por televisión que si pactábamos no dormiría tranquilo
[01:19.50] Fue una bromita que hice entre amigos y con Dormidina se me pasó
[01:25.50] Yo quiero diez ministros (Toma veinte), la vicepresidencia (Más las dietas)
[01:31.00] Dos cuartos en Moncloa (Y con baño), seis kilos de langostinos (Te los pelo)
[01:36.50] Quiero tu avión privado (¿Mi avión privado?) No, no, que no, en todo caso en el privado vamos los dos
[01:44.50] ¡Ay, qué bien! Que los de izquierda nos vamos a entender
[01:49.50] No, no, el avión pa' los dos, qué ven mis ojos, el avión pa' los dos
[01:55.00] Mandan los rojos, el avión pa' los dos, ay mi Españita, el avión pa' los dos
[02:01.00] Pablo, brindemos por nuestro pacto. ¿Y con qué brindamos, Pedro? Pues con Rivera
[02:13.00] Quiero tres ministerios (Te los doy), la vicepresidencia (Te la doy)
[02:18.50] Un cuarto en la Moncloa (Te lo doy), dos kilos de langostinos de Sanlúcar`
    }
  ];

  // =========================================================================
  // 3B. KARAOKE LYRICS SERVICE (SINCRONIZACIÓN EN TIEMPO REAL ESTILO KARAOKE)
  // =========================================================================
  class KaraokeLyricsService {
    constructor() {
      this.cache = new Map();
      this.candidatesCache = new Map();
      this.translationCache = new Map();
      this.knownAudioDurations = new Map();
      this.inflight = new Map();
      this.currentLyrics = [];
      this.currentTrack = null;
      this.currentTrackKey = '';
      this.activeLineIndex = -1;
      this.timeOffsetSec = 0;
      this.showTranslation = localStorage.getItem('piano_karaoke_translate') === 'true';
    }

    _makeKey(track) {
      const t = String(track?.title || '').toLowerCase().trim();
      const a = String(track?.artist || '').toLowerCase().trim();
      return `${t}__${a}`;
    }

    getTargetAppLang() {
      try {
        if (typeof window.getLanguage === 'function') {
          const l = String(window.getLanguage() || 'es').toLowerCase();
          return l.startsWith('en') ? 'en' : 'es';
        }
        const saved = String(localStorage.getItem('piano_lang') || localStorage.getItem('beatstar_lang') || 'es').toLowerCase();
        return saved.startsWith('en') ? 'en' : 'es';
      } catch (_) {
        return 'es';
      }
    }

    _syncToolbarUI() {
      const btn = document.getElementById('npKaraokeTranslateBtn');
      const label = document.getElementById('npKaraokeTranslateLabel');
      const lang = this.getTargetAppLang();
      if (btn) btn.classList.toggle('active', Boolean(this.showTranslation));
      if (label) {
        label.textContent = this.showTranslation
          ? (lang === 'en' ? 'Traducción (EN)' : 'Traducción (ES)')
          : 'Traducir letra';
      }
    }

    async toggleTranslation() {
      this.showTranslation = !this.showTranslation;
      try { localStorage.setItem('piano_karaoke_translate', this.showTranslation ? 'true' : 'false'); } catch (_) {}
      this._syncToolbarUI();
      if (this.showTranslation && this.currentTrack && this.currentLyrics.length > 0) {
        await this.ensureTranslationsForCurrent(this.currentTrack);
      }
      this.renderLinesToDom();
      const curIdx = this.activeLineIndex;
      this.activeLineIndex = -1;
      if (curIdx >= 0 && this.currentLyrics[curIdx]) {
        this.syncTime(this.currentLyrics[curIdx].timeSec - (this.timeOffsetSec || 0));
      }
    }

    async ensureTranslationsForCurrent(track) {
      if (!track || !Array.isArray(this.currentLyrics) || this.currentLyrics.length === 0) return;
      const targetLang = this.getTargetAppLang();
      const tKey = `${this._makeKey(track)}__${targetLang}`;
      if (this.translationCache.has(tKey)) {
        const cachedArr = this.translationCache.get(tKey);
        this.currentLyrics.forEach((line, i) => {
          if (cachedArr[i]) line.translatedText = cachedArr[i];
        });
        return;
      }

      const rawLines = this.currentLyrics.map(l => String(l.text || '').trim());
      let translatedArr = null;
      const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';

      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 4200);
        const resp = await fetch(`${baseUrl}/api/v1/lyrics/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines: rawLines, targetLang }),
          signal: ctrl.signal
        });
        clearTimeout(tid);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data?.translatedLines) && data.translatedLines.length > 0) {
            translatedArr = data.translatedLines;
          }
        }
      } catch (_) {}

      if (!translatedArr) {
        try {
          const joined = rawLines.join('\n');
          const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(joined)}`;
          const r = await fetch(gUrl);
          if (r.ok) {
            const d = await r.json();
            let fullTrans = '';
            if (Array.isArray(d?.[0])) {
              for (const seg of d[0]) {
                if (seg && seg[0]) fullTrans += seg[0];
              }
            }
            if (fullTrans) {
              translatedArr = fullTrans.split('\n').map(s => s.trim());
            }
          }
        } catch (_) {}
      }

      if (Array.isArray(translatedArr) && translatedArr.length > 0) {
        this.translationCache.set(tKey, translatedArr);
        this.currentLyrics.forEach((line, i) => {
          if (translatedArr[i]) line.translatedText = translatedArr[i];
        });
      }
    }

    _cleanSearchTerm(str) {
      const rep = repairSpanishBrokenAccents(str || '');
      return rep
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
        { timeSec: 0, text: `${title} — ${artist}` },
        { timeSec: 8, text: 'Introducción instrumental · Siente el pulso del piano' },
        { timeSec: Math.max(16, Math.round(chorusSec * 0.55)), text: 'Desarrollo melódico · Preparando entrada principal' },
        { timeSec: chorusSec, text: `★ Sección Principal — ${title} ★` },
        { timeSec: chorusSec + 18, text: 'Sección rítmica central · Mantén la cadencia' },
        { timeSec: Math.round(totalDurationSec * 0.58), text: 'Puente armónico · Variación de intensidad' },
        { timeSec: Math.round(totalDurationSec * 0.72), text: `★ Clímax Final — ${title} ★` },
        { timeSec: Math.round(totalDurationSec * 0.88), text: 'Coda final y resolución' }
      ];
    }

    _pickBestCandidateLines(candidates, targetDurationSec = 0, track = null) {
      const hasRealDur = Number.isFinite(targetDurationSec) && targetDurationSec > 38;
      if (!hasRealDur) targetDurationSec = 195;
      if (!Array.isArray(candidates) || candidates.length === 0) {
        return this.buildFallbackSyncedLines('', targetDurationSec, track);
      }

      const repTitle = repairSpanishBrokenAccents(track?.title || '');
      const cleanTitleNorm = this._normMatch(this._cleanSearchTerm(repTitle));
      const repArtist = repairSpanishBrokenAccents(track?.artist || '');
      const primaryArtistNorm = this._normMatch(this._extractPrimaryArtist(repArtist));
      const rawTrackTitleLower = repTitle.toLowerCase();
      const titleWords = cleanTitleNorm.split(' ').filter(w => w.length >= 3);

      const syncedList = [];
      for (const item of candidates) {
        if (!item || !item.syncedLyrics || !item.syncedLyrics.includes('[')) continue;
        const parsed = this.parseLrc(item.syncedLyrics);
        if (parsed.length < 3) continue;

        const rawCandTitle = repairSpanishBrokenAccents(item.trackName || item.name || '');
        const rawCandAlbum = repairSpanishBrokenAccents(item.albumName || '');
        const candMetaLower = `${rawCandTitle} ${rawCandAlbum}`.toLowerCase();
        const itemTitleNorm = this._normMatch(rawCandTitle);
        const itemArtistNorm = this._normMatch(item.artistName || '');
        let score = 0;
        let titleMatched = false;

        if (cleanTitleNorm && itemTitleNorm) {
          if (itemTitleNorm === cleanTitleNorm) {
            score += 75;
            titleMatched = true;
          } else if (itemTitleNorm.includes(cleanTitleNorm) || cleanTitleNorm.includes(itemTitleNorm)) {
            score += 48;
            titleMatched = true;
          } else {
            let matchedWords = 0;
            for (const tw of titleWords) {
              if (itemTitleNorm.includes(tw) || (tw.length >= 5 && itemTitleNorm.split(' ').some(iw => Math.abs(iw.length - tw.length) <= 1 && (iw.startsWith(tw.slice(0, 4)) || tw.startsWith(iw.slice(0, 4)))))) {
                matchedWords++;
              }
            }
            if (matchedWords > 0) {
              score += Math.round((matchedWords / titleWords.length) * 40);
              if (matchedWords / titleWords.length >= 0.5) titleMatched = true;
            } else {
              score -= 45;
            }
          }
        }

        let artistMatched = false;
        if (primaryArtistNorm && itemArtistNorm) {
          if (itemArtistNorm.includes(primaryArtistNorm) || primaryArtistNorm.includes(itemArtistNorm)) {
            score += 50;
            artistMatched = true;
          } else {
            score -= 35;
          }
        }

        const firstVocalLine = parsed.find(l => l.text && !/^[\(\[♪♫]/.test(l.text.trim())) || parsed[0];
        const firstLineTimeSec = firstVocalLine ? firstVocalLine.timeSec : parsed[0].timeSec;
        const itemDur = Number(item.duration) || (parsed[parsed.length - 1].timeSec + 8);
        const durDiff = hasRealDur ? Math.abs(itemDur - targetDurationSec) : 0;

        // Solo penalizar versiones de videoclip si NO conocemos la duración real o si la duración de este LRC no coincide con el audio real
        const badVersionRe = /\b(official\s*video|music\s*video|videoclip|video\s*oficial|remake|remix|rmx|live|en\s*vivo|en\s*directo|ao\s*vivo|cover|karaoke|tribute|parody|sped\s*up|slowed|nightcore)\b/i;
        if (badVersionRe.test(candMetaLower) && !badVersionRe.test(rawTrackTitleLower) && (!hasRealDur || durDiff > 2.5)) {
          score -= 95;
        }

        if (hasRealDur) {
          if (durDiff <= 1.5) score += 135;
          else if (durDiff <= 3) score += 105 - durDiff * 6;
          else if (durDiff <= 6) score += 60 - durDiff * 5;
          else score += Math.max(-90, 25 - durDiff * 4);
        }

        syncedList.push({
          item,
          parsed,
          itemDur,
          durDiff,
          firstLineTimeSec,
          titleMatched,
          artistMatched,
          score
        });
      }

      if (syncedList.length > 0) {
        // Consenso de primera línea vocal y duración de estudio:
        // Solo penaliza intros largos de videoclip cuando NO coinciden con la duración real del audio que está sonando
        const relevant = syncedList.filter(c => c.titleMatched && (c.artistMatched || syncedList.length <= 2));
        if (relevant.length >= 2) {
          const sortedFirstTimes = relevant.map(c => c.firstLineTimeSec).sort((a, b) => a - b);
          const studioFirstTimeRef = sortedFirstTimes[Math.floor((sortedFirstTimes.length - 1) * 0.25)];
          const sortedDurs = relevant.map(c => c.itemDur).filter(d => d > 45).sort((a, b) => a - b);
          const medianStudioDur = sortedDurs.length > 0 ? sortedDurs[Math.floor((sortedDurs.length - 1) * 0.35)] : 0;

          for (const cand of syncedList) {
            if (hasRealDur && cand.durDiff <= 3.0) continue;
            if (cand.firstLineTimeSec - studioFirstTimeRef > 14 && studioFirstTimeRef < 22) {
              cand.score -= 125;
            }
            if (medianStudioDur > 60 && cand.itemDur - medianStudioDur > 22) {
              cand.score -= 80;
            }
          }
        }

        syncedList.sort((a, b) => b.score - a.score);
        const best = syncedList[0];
        return best.parsed.map(l => ({ ...l }));
      }

      const withPlain = candidates.find(item => item && item.plainLyrics);
      if (withPlain && withPlain.plainLyrics) {
        return this.buildFallbackSyncedLines(withPlain.plainLyrics, targetDurationSec, track);
      }

      return this.buildFallbackSyncedLines('', targetDurationSec, track);
    }

    _findBuiltInCustomSyncedLyrics(track, trackVid = '') {
      if (!track && !trackVid) return null;
      const vid = String(trackVid || '').trim();
      const rawT = String(track?.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      const rawA = String(track?.artist || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      const combined = `${rawA}${rawT}`;
      for (const entry of CLIENT_CUSTOM_SYNCED_LYRICS_DB) {
        if (vid && entry.videoId === vid) return entry;
        if (rawT && entry.keys.some(k => rawT === k || combined.includes(k) || (rawT.length >= 7 && (rawT.includes(k) || k.includes(rawT))))) {
          return entry;
        }
      }
      return null;
    }

    async fetchLyricsForTrack(track, totalDurationSec = 0) {
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
        let rawTitleForSearch = String(track.title || '');
        let rawArtistForSearch = String(track.artist || '');
        if (/^ultimoscruzados$/i.test(rawArtistForSearch) && rawTitleForSearch.includes(' - ')) {
          const parts = rawTitleForSearch.split(' - ');
          rawArtistForSearch = parts[0].trim();
          rawTitleForSearch = parts.slice(1).join(' - ').trim();
        }
        const cleanTitle = this._cleanSearchTerm(rawTitleForSearch);
        const primaryArtist = this._extractPrimaryArtist(rawArtistForSearch);
        const fullArtist = this._cleanSearchTerm(rawArtistForSearch);
        const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';

        let trackVid = String(track.videoId || '').replace(/^magic_yt_|^yt_/, '').trim();
        if (!/^[A-Za-z0-9_-]{11}$/.test(trackVid)) {
          const rawId = String(track.id || '').replace(/^magic_yt_|^yt_/, '').trim();
          if (/^[A-Za-z0-9_-]{11}$/.test(rawId)) trackVid = rawId;
          else {
            const mThumb = String(track.thumbnail || track.cover_url || '').match(/(?:\/vi\/|\/vi_webp\/)([A-Za-z0-9_-]{11})(?:\/|$)/);
            if (mThumb && mThumb[1]) trackVid = mThumb[1];
          }
        }

        const builtIn = this._findBuiltInCustomSyncedLyrics(track, trackVid);
        if (builtIn && builtIn.syncedLyrics) {
          const parsedBuiltIn = this.parseLrc(builtIn.syncedLyrics);
          if (parsedBuiltIn.length >= 3) {
            this.candidatesCache.set(key, [builtIn]);
            this.cache.set(key, parsedBuiltIn);
            return parsedBuiltIn.map(l => ({ ...l }));
          }
        }

        const vidQueryParam = trackVid ? `&videoId=${encodeURIComponent(trackVid)}` : '';

        const urlsToTry = [];
        if (baseUrl) {
          urlsToTry.push(`${baseUrl}/api/v1/lyrics?title=${encodeURIComponent(cleanTitle || track.title || '')}&artist=${encodeURIComponent(primaryArtist || track.artist || '')}${vidQueryParam}`);
        }
        urlsToTry.push(
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(primaryArtist)}`,
          `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${primaryArtist}`.trim())}`
        );
        if (fullArtist && fullArtist.toLowerCase() !== primaryArtist.toLowerCase()) {
          urlsToTry.push(`https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(fullArtist)}`);
        }
        if (baseUrl) {
          urlsToTry.push(`${baseUrl}/api/v1/lyrics?q=${encodeURIComponent(`${cleanTitle} ${primaryArtist}`.trim())}${vidQueryParam}`);
        }

        const collected = [];
        const seenIds = new Set();

        const queryTasks = urlsToTry.map(async (qUrl) => {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 2800);
          try {
            const resp = await fetch(qUrl, { signal: ctrl.signal });
            clearTimeout(tid);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const arr = await resp.json();
            if (!Array.isArray(arr) || arr.length === 0) throw new Error('Empty');
            let foundSynced = false;
            for (const item of arr) {
              const itemId = item.id || `${item.trackName}_${item.artistName}_${item.duration || 0}`;
              if (item && !seenIds.has(itemId)) {
                seenIds.add(itemId);
                collected.push(item);
                if (item.syncedLyrics && item.syncedLyrics.includes('[')) {
                  foundSynced = true;
                }
              }
            }
            if (collected.length > 0) {
              this.candidatesCache.set(key, collected);
            }
            if (!foundSynced) throw new Error('No synced in batch');
            return true;
          } catch (err) {
            clearTimeout(tid);
            throw err;
          }
        });

        try {
          await Promise.any(queryTasks);
        } catch (_) {
          await Promise.allSettled(queryTasks);
        }

        Promise.allSettled(queryTasks).then(() => {
          if (collected.length > 0) {
            this.candidatesCache.set(key, collected);
            this._refreshCurrentLyrics(track, key);
          }
        }).catch(() => {});

        if (collected.length > 0) {
          this.candidatesCache.set(key, collected);
        }
        const effectiveDur = this.knownAudioDurations.get(key) ||
                             (window.dualStreamEngine ? window.dualStreamEngine.getRealDurationSec(track) : 0) ||
                             totalDurationSec;
        const bestLines = this._pickBestCandidateLines(collected, effectiveDur, track);
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

    _refreshCurrentLyrics(track, key, durationSec = 0) {
      if (this.currentTrackKey !== key) return;
      const cands = this.candidatesCache.get(key);
      if (!cands || cands.length === 0) return;
      const dur = durationSec ||
                  this.knownAudioDurations.get(key) ||
                  (window.dualStreamEngine ? window.dualStreamEngine.getRealDurationSec(track) : 0);
      const lines = this._pickBestCandidateLines(cands, dur, track);
      this.cache.set(key, lines);
      const old = this.currentLyrics || [];
      const same = old.length === lines.length && old.every((l, i) => l.text === lines[i].text && Math.abs(l.timeSec - lines[i].timeSec) < 0.01);
      if (same) return;
      this.currentLyrics = lines.map(l => ({ ...l }));
      this.activeLineIndex = -1;
      this.renderLinesToDom();
      if (this.showTranslation) {
        this.ensureTranslationsForCurrent(track).then(() => {
          if (this.currentTrackKey === key) this.renderLinesToDom();
        }).catch(() => {});
      }
    }

    async recalibrateForActualAudio(track, actualDurationSec) {
      if (!track || !Number.isFinite(actualDurationSec) || actualDurationSec < 35) return;
      const key = this._makeKey(track);
      this.knownAudioDurations.set(key, actualDurationSec);
      if (this.inflight.has(key)) {
        try { await this.inflight.get(key); } catch (_) {}
      }
      if (!this.candidatesCache.get(key)) return;
      this._refreshCurrentLyrics(track, key, actualDurationSec);
    }

    async loadAndRenderTrackLyrics(track, totalDurationSec = 0) {
      if (!track) return;
      const key = this._makeKey(track);
      if (this.currentTrackKey !== key) {
        this.timeOffsetSec = 0;
      }
      this.currentTrack = track;
      this.currentTrackKey = key;
      this.activeLineIndex = -1;
      this._syncToolbarUI();

      const box = document.getElementById('npKaraokeScrollBox');
      if (box && !this.cache.has(key)) {
        box.innerHTML = `<p class="np-karaoke-placeholder">Sincronizando letra karaoke...</p>`;
      }

      const lines = await this.fetchLyricsForTrack(track, totalDurationSec);
      if (this.currentTrackKey !== key) return;
      this.currentLyrics = lines.map(l => ({ ...l }));
      // Renderizar inmediatamente la letra sincronizada sin bloquear por la traducción
      this.renderLinesToDom();
      if (this.showTranslation) {
        this.ensureTranslationsForCurrent(track).then(() => {
          if (this.currentTrackKey === key) this.renderLinesToDom();
        }).catch(() => {});
      }
    }

    renderLinesToDom() {
      const box = document.getElementById('npKaraokeScrollBox');
      if (!box) return;
      this._syncToolbarUI();
      if (!Array.isArray(this.currentLyrics) || this.currentLyrics.length === 0) {
        box.innerHTML = `<p class="np-karaoke-placeholder">Letra no disponible para esta pista.</p>`;
        return;
      }

      box.innerHTML = this.currentLyrics.map((line, idx) => {
        const origNorm = String(line.text || '').trim().toLowerCase();
        const transNorm = String(line.translatedText || '').trim().toLowerCase();
        const showSub = Boolean(this.showTranslation && line.translatedText && transNorm && transNorm !== origNorm);
        return `
          <div id="karaokeLine_${idx}" class="np-karaoke-line" onclick="window.DiscoverHomeApp.seekToKaraokeLine(${idx})">
            <div>${escapeHtmlSafe(line.text)}</div>
            ${showSub ? `<span class="np-karaoke-subline">${escapeHtmlSafe(line.translatedText)}</span>` : ''}
          </div>
        `;
      }).join('');
    }

    syncTime(currentSec) {
      if (!Array.isArray(this.currentLyrics) || this.currentLyrics.length === 0) return;
      const adjSec = Math.max(0, Number(currentSec || 0) + (this.timeOffsetSec || 0));
      let activeIdx = -1;
      for (let i = 0; i < this.currentLyrics.length; i++) {
        if (adjSec + 0.12 >= this.currentLyrics[i].timeSec) {
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
        el.classList.toggle('past', activeIdx >= 0 && i < activeIdx);
      }

      if (activeIdx >= 0) {
        const activeEl = document.getElementById(`karaokeLine_${activeIdx}`);
        if (activeEl && box.offsetParent !== null) {
          const targetScroll = activeEl.offsetTop - (box.clientHeight / 2) + (activeEl.clientHeight / 2);
          box.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
        }
      } else {
        box.scrollTo({ top: 0, behavior: 'smooth' });
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

      this.activeSourceType = 'none'; // 'preview' | 'full' | 'yt_bridge'
      this.currentTrack = null;
      this.isPlayingFlag = false;
      this.isLoadingTrack = false;
      this.isCrossfading = false;
      this.fullTrackReady = false;
      this.fullTrackBlob = null;
      this.fullTrackObjectUrl = null;

      this._ytBridgeVideoId = '';
      this._ytBridgeStartWallMs = 0;
      this._ytBridgeBaseSec = 0;
      this._ytBridgePaused = true;
      this._ytApiPlayer = null;
      this._ytApiReady = false;
      this._ytPendingCue = null;

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
      this._bindYouTubePostMessageTelemetry();
      this._initPersistentYtBridgePlayer();
    }

    _getMasterVolume() {
      // El volumen de la música ambiental del menú (beatstar_master_volume / beatstar_master_muted)
      // solo afecta a la música de fondo del menú y NUNCA debe bajar ni silenciar las canciones o previews.
      return 0.92;
    }

    _extractTrackYoutubeId(track) {
      if (!track) return '';
      const v0 = String(track.videoId || '').replace(/^magic_yt_|^yt_/, '').trim();
      if (/^[A-Za-z0-9_-]{11}$/.test(v0)) {
        track.videoId = v0;
        return v0;
      }
      const id0 = String(track.id || '').replace(/^magic_yt_|^yt_/, '').trim();
      if (/^[A-Za-z0-9_-]{11}$/.test(id0)) {
        track.videoId = id0;
        return id0;
      }
      const thumb = String(track.thumbnail || track.cover_url || track.artworkUrl600 || '');
      const m = thumb.match(/(?:\/vi\/|\/vi_webp\/)([A-Za-z0-9_-]{11})(?:\/|$)/);
      if (m && m[1]) {
        track.videoId = m[1];
        return m[1];
      }
      return '';
    }

    isPlaying() {
      return Boolean(
        this.isPlayingFlag &&
        ((this.activeSourceType === 'preview' && !this.previewAudio.paused) ||
         (this.activeSourceType === 'full' && !this.fullAudio.paused) ||
         (this.activeSourceType === 'yt_bridge' && !this._ytBridgePaused))
      );
    }

    getActiveAudioElement() {
      return this.activeSourceType === 'full' ? this.fullAudio : this.previewAudio;
    }

    _bindYouTubePostMessageTelemetry() {
      if (this._ytTelemetryBound) return;
      this._ytTelemetryBound = true;
      window.addEventListener('message', (ev) => {
        if (!ev || typeof ev.data !== 'string') return;
        if (!ev.data.includes('infoDelivery') && !ev.data.includes('onStateChange')) return;
        try {
          const msg = JSON.parse(ev.data);
          if (!msg) return;
          const info = msg.info || {};
          const senderId = String(msg.id || '');
          const isVideoclipMsg = senderId === 'npActiveYtVideoclipIframe' ||
            (document.getElementById('npActiveYtVideoclipIframe') && ev.source === document.getElementById('npActiveYtVideoclipIframe').contentWindow);

          if (isVideoclipMsg) {
            if (window.DiscoverHomeApp) {
              window.DiscoverHomeApp._videoclipTelemetryReady = true;
              if (typeof info.playerState === 'number') {
                window.DiscoverHomeApp._videoclipRealState = info.playerState;
              } else if (msg.event === 'onStateChange' && typeof msg.info === 'number') {
                window.DiscoverHomeApp._videoclipRealState = msg.info;
              }
              if (Number.isFinite(info.currentTime) && info.currentTime >= 0) {
                window.DiscoverHomeApp._videoclipRealTimeSec = Number(info.currentTime);
                window.DiscoverHomeApp._videoclipRealTimeWallMs = performance.now();
              }
            }
            return;
          }

          // Telemetría en tiempo real del puente de audio de YouTube (yt_bridge)
          const isAudioBridgeMsg = senderId === 'ytInstantAudioBridgeIframe' ||
            senderId === 'ytPersistentBridgeMount' ||
            (document.getElementById('ytInstantAudioBridgeIframe') && ev.source === document.getElementById('ytInstantAudioBridgeIframe').contentWindow);

          if (isAudioBridgeMsg || this.activeSourceType === 'yt_bridge') {
            this._ytBridgeTelemetryActive = true;
            if (typeof info.playerState === 'number') {
              this._ytBridgeRealState = info.playerState;
              if (info.playerState === 0 && this.activeSourceType === 'yt_bridge') {
                this.nextTrack();
                return;
              }
            }
            if (Number.isFinite(info.currentTime) && info.currentTime >= 0) {
              this._ytBridgeBaseSec = Number(info.currentTime);
              this._ytBridgeStartWallMs = performance.now();
              if (this._ytGameplayActive) {
                this._ytGameplayBaseSec = Number(info.currentTime);
                this._ytGameplayStartWallMs = performance.now();
              }
            }
            if (Number.isFinite(info.duration) && info.duration > 38 && this.currentTrack) {
              const d = Number(info.duration);
              if (Math.abs(d - (this._lastYtRecalDur || 0)) > 0.5) {
                this._lastYtRecalDur = d;
                this.currentTrack.durationSec = d;
                if (this.karaokeService) {
                  this.karaokeService.recalibrateForActualAudio(this.currentTrack, d).catch(() => {});
                }
              }
            }
          }
        } catch (_) {}
      });
    }

    _initPersistentYtBridgePlayer() {
      const setup = () => {
        if (document.getElementById('ytPersistentBridgeHost')) return;
        const host = document.createElement('div');
        host.id = 'ytPersistentBridgeHost';
        host.style.cssText = 'position:fixed;width:2px;height:2px;bottom:0;left:0;opacity:0.01;pointer-events:none;z-index:-1;overflow:hidden;';
        const inner = document.createElement('div');
        inner.id = 'ytPersistentBridgeMount';
        host.appendChild(inner);
        document.body.appendChild(host);

        const createPlayer = () => {
          if (this._ytApiPlayer || !window.YT || !window.YT.Player) return;
          try {
            this._ytApiPlayer = new window.YT.Player('ytPersistentBridgeMount', {
              width: '200',
              height: '112',
              videoId: 'kU-Z94uTPuo',
              playerVars: {
                autoplay: 0,
                mute: 1,
                controls: 0,
                playsinline: 1,
                enablejsapi: 1,
                rel: 0,
                origin: window.location.origin || 'https://renacer.onrender.com'
              },
              events: {
                onReady: (ev) => {
                  this._ytApiReady = true;
                  try {
                    ev.target.pauseVideo();
                    ev.target.unMute();
                    ev.target.setVolume(95);
                  } catch (_) {}
                  if (this._ytPendingCue && this.activeSourceType === 'yt_bridge') {
                    const { videoId, startSec } = this._ytPendingCue;
                    this._ytPendingCue = null;
                    try {
                      const fallbackIfr = document.getElementById('ytInstantAudioBridgeIframe');
                      if (!fallbackIfr) {
                        ev.target.loadVideoById({ videoId, startSeconds: startSec });
                        ev.target.unMute();
                        ev.target.setVolume(95);
                        ev.target.playVideo();
                      }
                    } catch (_) {}
                  }
                },
                onStateChange: (ev) => {
                  if (this.activeSourceType !== 'yt_bridge') return;
                  this._ytBridgeRealState = ev.data;
                  if (ev.data === 1) {
                    this._ytBridgePaused = false;
                    this.isPlayingFlag = true;
                    this.isLoadingTrack = false;
                    this._setLoadingHintVisible(false);
                    this._syncPlayPauseIcons(true);
                    try {
                      const d = Number(ev.target.getDuration());
                      if (Number.isFinite(d) && d > 38 && this.currentTrack) {
                        this._lastYtRecalDur = d;
                        this.currentTrack.durationSec = d;
                        if (this.karaokeService) {
                          this.karaokeService.recalibrateForActualAudio(this.currentTrack, d).catch(() => {});
                        }
                      }
                    } catch (_) {}
                  } else if (ev.data === 0) {
                    this.nextTrack();
                  }
                }
              }
            });
          } catch (_) {}
        };

        if (window.YT && window.YT.Player) {
          createPlayer();
        } else {
          const prevCb = window.onYouTubeIframeAPIReady;
          window.onYouTubeIframeAPIReady = () => {
            if (typeof prevCb === 'function') {
              try { prevCb(); } catch (_) {}
            }
            createPlayer();
          };
          if (!document.getElementById('ytIframeApiScript')) {
            const tag = document.createElement('script');
            tag.id = 'ytIframeApiScript';
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
          }
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
      } else {
        setup();
      }
    }

    _sendYtBridgeCommand(func, args = []) {
      try {
        const fallbackIfr = document.getElementById('ytInstantAudioBridgeIframe');
        if (fallbackIfr && fallbackIfr.contentWindow && fallbackIfr.src && fallbackIfr.src !== 'about:blank') {
          fallbackIfr.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
        }
        if (this._ytApiReady && this._ytApiPlayer && typeof this._ytApiPlayer[func] === 'function') {
          this._ytApiPlayer[func](...args);
          return;
        }
        const persistIfr = document.querySelector('#ytPersistentBridgeHost iframe');
        if (persistIfr && persistIfr.contentWindow) {
          persistIfr.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
        }
      } catch (_) {}
    }

    _stopYtAudioBridge() {
      this._ytBridgePaused = true;
      this._ytBridgeVideoId = '';
      this._ytBridgeRealState = -1;
      this._ytBridgeTelemetryActive = false;
      this._ytPendingCue = null;
      if (this._ytBridgeHandshakeTimer) {
        clearInterval(this._ytBridgeHandshakeTimer);
        this._ytBridgeHandshakeTimer = null;
      }
      try {
        if (this._ytApiReady && this._ytApiPlayer && typeof this._ytApiPlayer.pauseVideo === 'function') {
          this._ytApiPlayer.pauseVideo();
        }
        const ifr = document.getElementById('ytInstantAudioBridgeIframe');
        if (ifr) {
          this._sendYtBridgeCommand('pauseVideo', []);
          ifr.src = 'about:blank';
        }
      } catch (_) {}
    }

    _startYtAudioBridge(videoId, startSec, reqId) {
      if (!videoId || reqId !== this._playRequestId) return false;
      try {
        if (typeof window.pauseMenuAmbientMusic === 'function') {
          window.pauseMenuAmbientMusic();
        }
        const safeStart = Math.max(0, Math.floor(Number(startSec) || 0));
        this._ytBridgeVideoId = videoId;
        this._ytBridgeBaseSec = safeStart;
        this._ytBridgeStartWallMs = performance.now();
        this._ytBridgePaused = false;
        this._ytBridgeRealState = -1;
        this._ytBridgeTelemetryActive = false;
        this._lastYtRecalDur = 0;
        this.activeSourceType = 'yt_bridge';
        this.isPlayingFlag = true;
        this.isLoadingTrack = false;
        this._setLoadingHintVisible(false);
        this._syncPlayPauseIcons(true);

        if (this._ytApiReady && this._ytApiPlayer && typeof this._ytApiPlayer.loadVideoById === 'function') {
          const oldFallback = document.getElementById('ytInstantAudioBridgeIframe');
          if (oldFallback) oldFallback.src = 'about:blank';
          this._ytApiPlayer.loadVideoById({ videoId, startSeconds: safeStart });
          this._ytApiPlayer.unMute();
          this._ytApiPlayer.setVolume(95);
          this._ytApiPlayer.playVideo();
          return true;
        }

        this._ytPendingCue = { videoId, startSec: safeStart };
        let host = document.getElementById('ytInstantAudioBridgeHost');
        if (!host) {
          host = document.createElement('div');
          host.id = 'ytInstantAudioBridgeHost';
          host.style.cssText = 'position:fixed;width:2px;height:2px;bottom:0;left:0;opacity:0.01;pointer-events:none;z-index:-1;overflow:hidden;';
          document.body.appendChild(host);
        }
        const origin = encodeURIComponent(window.location.origin || 'https://renacer.onrender.com');
        host.innerHTML = `<iframe id="ytInstantAudioBridgeIframe" width="200" height="112" src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=0&controls=0&playsinline=1&enablejsapi=1&start=${safeStart}&origin=${origin}" allow="autoplay; encrypted-media"></iframe>`;
        const ifr = document.getElementById('ytInstantAudioBridgeIframe');
        if (ifr) {
          const sendListeningHandshake = () => {
            if (reqId !== this._playRequestId || this.activeSourceType !== 'yt_bridge') return;
            try {
              if (ifr.contentWindow) {
                ifr.contentWindow.postMessage(JSON.stringify({
                  event: 'listening',
                  id: 'ytInstantAudioBridgeIframe',
                  channel: 'widget'
                }), '*');
              }
            } catch (_) {}
          };
          if (this._ytBridgeHandshakeTimer) clearInterval(this._ytBridgeHandshakeTimer);
          let attempts = 0;
          this._ytBridgeHandshakeTimer = setInterval(() => {
            attempts++;
            if (this._ytBridgeTelemetryActive || attempts > 16 || reqId !== this._playRequestId) {
              clearInterval(this._ytBridgeHandshakeTimer);
              this._ytBridgeHandshakeTimer = null;
              return;
            }
            sendListeningHandshake();
          }, 250);

          ifr.addEventListener('load', () => {
            if (reqId !== this._playRequestId || this.activeSourceType !== 'yt_bridge') return;
            this._ytBridgeStartWallMs = performance.now();
            sendListeningHandshake();
            this._sendYtBridgeCommand('unMute', []);
            this._sendYtBridgeCommand('setVolume', [95]);
            this._sendYtBridgeCommand('playVideo', []);
          }, { once: true });
        }
        return true;
      } catch (_) {
        return false;
      }
    }

    prepareYtBridgeForGameplay(videoId) {
      if (!videoId) return false;
      try {
        this._ytGameplayActive = true;
        this._ytGameplayVideoId = videoId;
        this._ytGameplayBaseSec = 0;
        this._ytGameplayStartWallMs = performance.now();
        this._ytGameplayPaused = true;
        this._ytGameplayRate = 1.0;
        if (this._ytApiReady && this._ytApiPlayer && typeof this._ytApiPlayer.cueVideoById === 'function') {
          this._ytApiPlayer.cueVideoById({ videoId, startSeconds: 0 });
          this._ytApiPlayer.unMute();
          this._ytApiPlayer.setVolume(95);
          return true;
        }
        return true;
      } catch (_) {
        return false;
      }
    }

    playYtBridgeForGameplay(videoId, startSec = 0, vol = 0.9, rate = 1.0) {
      if (!videoId) return false;
      try {
        if (typeof window.pauseMenuAmbientMusic === 'function') {
          window.pauseMenuAmbientMusic();
        }
        const safeStart = Math.max(0, Number(startSec) || 0);
        const volPct = Math.max(5, Math.min(100, Math.round((Number(vol) || 0.9) * 100)));
        this._ytGameplayActive = true;
        this._ytGameplayVideoId = videoId;
        this._ytGameplayBaseSec = safeStart;
        this._ytGameplayStartWallMs = performance.now();
        this._ytGameplayPaused = false;
        this._ytGameplayRate = Number(rate) || 1.0;

        if (this._ytApiReady && this._ytApiPlayer && typeof this._ytApiPlayer.loadVideoById === 'function') {
          if (this._ytBridgeVideoId !== videoId) {
            this._ytBridgeVideoId = videoId;
            this._ytApiPlayer.loadVideoById({ videoId, startSeconds: Math.floor(safeStart) });
          } else {
            this._ytApiPlayer.seekTo(safeStart, true);
          }
          this._ytApiPlayer.unMute();
          this._ytApiPlayer.setVolume(volPct);
          if (typeof this._ytApiPlayer.setPlaybackRate === 'function') {
            this._ytApiPlayer.setPlaybackRate(this._ytGameplayRate);
          }
          this._ytApiPlayer.playVideo();
          return true;
        }

        let host = document.getElementById('ytInstantAudioBridgeHost');
        if (!host) {
          host = document.createElement('div');
          host.id = 'ytInstantAudioBridgeHost';
          host.style.cssText = 'position:fixed;width:2px;height:2px;bottom:0;left:0;opacity:0.01;pointer-events:none;z-index:-1;overflow:hidden;';
          document.body.appendChild(host);
        }
        const origin = encodeURIComponent(window.location.origin || 'https://renacer.onrender.com');
        host.innerHTML = `<iframe id="ytInstantAudioBridgeIframe" width="200" height="112" src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=0&controls=0&playsinline=1&enablejsapi=1&start=${Math.floor(safeStart)}&origin=${origin}" allow="autoplay; encrypted-media"></iframe>`;
        const ifr = document.getElementById('ytInstantAudioBridgeIframe');
        if (ifr) {
          ifr.addEventListener('load', () => {
            if (!this._ytGameplayActive) return;
            this._ytGameplayStartWallMs = performance.now();
            this._sendYtBridgeCommand('unMute', []);
            this._sendYtBridgeCommand('setVolume', [volPct]);
            this._sendYtBridgeCommand('playVideo', []);
          }, { once: true });
        }
        return true;
      } catch (_) {
        return false;
      }
    }

    pauseYtBridgeForGameplay() {
      this._ytGameplayBaseSec = this.getYtBridgeGameplayTimeSec();
      this._ytGameplayPaused = true;
      this._sendYtBridgeCommand('pauseVideo', []);
    }

    seekYtBridgeForGameplay(sec = 0) {
      const safe = Math.max(0, Number(sec) || 0);
      this._ytGameplayBaseSec = safe;
      this._ytGameplayStartWallMs = performance.now();
      this._sendYtBridgeCommand('seekTo', [Math.floor(safe), true]);
    }

    setYtBridgeGameplayVolume(vol = 0.9) {
      const volPct = Math.max(0, Math.min(100, Math.round((Number(vol) || 0) * 100)));
      this._sendYtBridgeCommand('setVolume', [volPct]);
    }

    setYtBridgeGameplayRate(rate = 1.0) {
      this._ytGameplayBaseSec = this.getYtBridgeGameplayTimeSec();
      this._ytGameplayStartWallMs = performance.now();
      this._ytGameplayRate = Math.max(0.5, Math.min(2.0, Number(rate) || 1.0));
      this._sendYtBridgeCommand('setPlaybackRate', [this._ytGameplayRate]);
    }

    getYtBridgeGameplayTimeSec() {
      if (!this._ytGameplayActive) return 0;
      if (this._ytApiReady && this._ytApiPlayer && typeof this._ytApiPlayer.getCurrentTime === 'function') {
        try {
          const cur = Number(this._ytApiPlayer.getCurrentTime());
          if (Number.isFinite(cur) && cur >= 0) {
            this._ytGameplayBaseSec = cur;
            this._ytGameplayStartWallMs = performance.now();
            return cur;
          }
        } catch (_) {}
      }
      if (this._ytGameplayPaused) return this._ytGameplayBaseSec || 0;
      const elapsed = Math.max(0, (performance.now() - (this._ytGameplayStartWallMs || performance.now())) / 1000) * (this._ytGameplayRate || 1.0);
      return (this._ytGameplayBaseSec || 0) + elapsed;
    }

    stopYtBridgeForGameplay() {
      this._ytGameplayActive = false;
      this._ytGameplayPaused = true;
      this._ytGameplayVideoId = '';
      this._sendYtBridgeCommand('pauseVideo', []);
    }

    /**
     * Devuelve SIEMPRE la duración de la canción entera (nunca 30s) para que la barra completa
     * esté disponible desde el segundo 0.
     */
    getTrackFullDurationSec(track = this.currentTrack) {
      const explicitDur = Number(track?.durationSec || track?.duration || 0);
      if (this.fullTrackReady && Number.isFinite(this.fullAudio.duration) && this.fullAudio.duration > 38) {
        if (explicitDur >= 45 && explicitDur <= 420 && this.fullAudio.duration > explicitDur * 1.16) {
          return explicitDur;
        }
        return this.fullAudio.duration;
      }
      if (this.activeSourceType === 'full' && Number.isFinite(this.fullAudio.duration) && this.fullAudio.duration > 38) {
        if (explicitDur >= 45 && explicitDur <= 420 && this.fullAudio.duration > explicitDur * 1.16) {
          return explicitDur;
        }
        return this.fullAudio.duration;
      }
      if (explicitDur > 38) return explicitDur;
      if (track && this.karaokeService) {
        const builtIn = this.karaokeService._findBuiltInCustomSyncedLyrics(track, this._extractTrackYoutubeId(track));
        if (builtIn && builtIn.duration > 40) {
          track.durationSec = builtIn.duration;
          return builtIn.duration;
        }
      }
      const hash = String(track?.id || track?.title || 'song').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return 185 + (hash % 45);
    }

    /** Duración fiable (audio cargado o metadato explícito); 0 si solo hay una estimación. */
    getRealDurationSec(track = this.currentTrack) {
      const explicit = Number(track?.durationSec || track?.duration || 0);
      const d = Number(this.fullAudio.duration);
      if (this.currentTrack && track && this.currentTrack.id === track.id && Number.isFinite(d) && d > 38 &&
          (this.fullTrackReady || this.activeSourceType === 'full')) {
        if (explicit >= 45 && explicit <= 420 && d > explicit * 1.16) {
          return explicit;
        }
        return d;
      }
      if (explicit > 38) return explicit;
      if (track && this.karaokeService) {
        const builtIn = this.karaokeService._findBuiltInCustomSyncedLyrics(track, this._extractTrackYoutubeId(track));
        if (builtIn && builtIn.duration > 40) return builtIn.duration;
      }
      return 0;
    }

    /**
     * Pide al servidor que extraiga y cachee el audio de estas pistas con antelación,
     * para que al pulsar play ya esté listo (agrupa y deduplica las peticiones).
     */
    warmTracks(tracks) {
      // Desactivado el pre-calentamiento pesado en servidor para ahorrar 100% de ancho de banda en Render
      // y evitar colas innecesarias; el cliente resuelve en directo por CDN / SoundCloud / YouTube Bridge.
      return;
    }

    getChorusOffsetSec(track = this.currentTrack, fullDur = null) {
      const dur = fullDur || this.getTrackFullDurationSec(track);
      if (Number.isFinite(track?.chorusSec) && track.chorusSec > 10 && track.chorusSec < dur - 25) {
        return track.chorusSec;
      }
      return Math.round(Math.max(28, Math.min(62, dur * 0.27)));
    }

    getCurrentSongTimeSec() {
      if (this.pendingUserSeekSec !== null && !this.fullTrackReady && this.activeSourceType !== 'full' && this.activeSourceType !== 'yt_bridge') {
        return this.pendingUserSeekSec;
      }
      if (this.activeSourceType === 'full') {
        return Number(this.fullAudio.currentTime) || 0;
      }
      if (this.activeSourceType === 'yt_bridge') {
        const fallbackIfr = document.getElementById('ytInstantAudioBridgeIframe');
        const usingPersistentApi = Boolean(
          this._ytApiReady &&
          this._ytApiPlayer &&
          typeof this._ytApiPlayer.getCurrentTime === 'function' &&
          (!fallbackIfr || !fallbackIfr.src || fallbackIfr.src === 'about:blank')
        );
        if (usingPersistentApi) {
          try {
            const apiCur = Number(this._ytApiPlayer.getCurrentTime());
            if (Number.isFinite(apiCur) && apiCur >= 0) {
              this._ytBridgeBaseSec = apiCur;
              this._ytBridgeStartWallMs = performance.now();
              return apiCur;
            }
          } catch (_) {}
        }
        if (this._ytBridgePaused || this._ytBridgeRealState === 2 || this._ytBridgeRealState === 3 || this._ytBridgeRealState === -1) {
          return this._ytBridgeBaseSec || 0;
        }
        const rawElapsed = Math.max(0, (performance.now() - this._ytBridgeStartWallMs) / 1000);
        const elapsed = this._ytBridgeTelemetryActive ? Math.min(0.45, rawElapsed) : rawElapsed;
        const fullDur = this.getTrackFullDurationSec(this.currentTrack);
        return Math.min(fullDur, (this._ytBridgeBaseSec || 0) + elapsed);
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
        if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
          window.DiscoverHomeApp.syncActiveVideoclipPlayback('tick');
        }
      };

      this.previewAudio.addEventListener('timeupdate', () => {
        if (this.activeSourceType === 'preview') onTimeUpdate();
      });
      this.fullAudio.addEventListener('timeupdate', () => {
        if (this.activeSourceType === 'full') onTimeUpdate();
      });

      // En cuanto fullAudio conoce su duración real, recalibrar la letra LRC para que vaya 100% sincronizada
      let lastRecalDur = 0;
      const isPlausibleAudioDuration = (trackObj, candidateDur) => {
        if (!Number.isFinite(candidateDur) || candidateDur <= 38 || candidateDur > 1200) return false;
        const knownDur = Number(trackObj?.durationSec || trackObj?.duration || 0);
        if (knownDur >= 45 && knownDur <= 420 && candidateDur > knownDur * 1.16) {
          return false;
        }
        return true;
      };
      const onDurationKnown = () => {
        if (!this.currentTrack) return;
        const realDur = Number(this.fullAudio.duration);
        if (!isPlausibleAudioDuration(this.currentTrack, realDur) || Math.abs(realDur - lastRecalDur) < 0.5) return;
        lastRecalDur = realDur;
        if (this.karaokeService) {
          this.karaokeService.recalibrateForActualAudio(this.currentTrack, realDur).catch(() => {});
        }
      };
      this.fullAudio.addEventListener('durationchange', onDurationKnown);
      this.fullAudio.addEventListener('loadedmetadata', () => {
        if (!this.currentTrack) return;
        const realDur = Number(this.fullAudio.duration);
        if (isPlausibleAudioDuration(this.currentTrack, realDur)) {
          this.currentTrack.durationSec = realDur;
          this._updatePlayerProgressUI(this.getCurrentSongTimeSec(), realDur);
          if (this.karaokeService) {
            this.karaokeService.recalibrateForActualAudio(this.currentTrack, realDur).catch(() => {});
          }
        }
      });

      // Ticker de alta precisión (100ms) para que el resaltado de sílabas/líneas de Karaoke, yt_bridge y el Videoclip no tengan retraso
      if (this.karaokeSyncInterval) clearInterval(this.karaokeSyncInterval);
      let ytBridgeTickCounter = 0;
      this.karaokeSyncInterval = setInterval(() => {
        if (!this.currentTrack) return;
        ytBridgeTickCounter++;
        if (ytBridgeTickCounter % 2 === 0 && window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
          window.DiscoverHomeApp.syncActiveVideoclipPlayback('tick');
        }
        if (!this.isPlaying()) return;
        const curSec = this.getCurrentSongTimeSec();
        if (this.karaokeService) {
          this.karaokeService.syncTime(curSec);
        }
        if (this.activeSourceType === 'yt_bridge') {
          if (ytBridgeTickCounter % 5 === 0 && this._ytApiReady && this._ytApiPlayer && typeof this._ytApiPlayer.getDuration === 'function') {
            try {
              const d = Number(this._ytApiPlayer.getDuration());
              if (Number.isFinite(d) && d > 38 && Math.abs(d - (this._lastYtRecalDur || 0)) > 0.5) {
                this._lastYtRecalDur = d;
                this.currentTrack.durationSec = d;
                if (this.karaokeService) {
                  this.karaokeService.recalibrateForActualAudio(this.currentTrack, d).catch(() => {});
                }
              }
            } catch (_) {}
          }
          const fullDur = this.getTrackFullDurationSec(this.currentTrack);
          this._updatePlayerProgressUI(curSec, fullDur);
          if (ytBridgeTickCounter % 5 === 0) {
            this._updateMediaSessionPosition(curSec, fullDur);
          }
          if (curSec >= fullDur - 0.5) {
            this.nextTrack();
          }
        }
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
    _findMatchingTopCatalogSong(track) {
      if (!track) return null;
      if (track._matchedTopCatalogSong !== undefined) return track._matchedTopCatalogSong;
      if (typeof window.getFormattedTopSongsCatalog !== 'function') return null;
      const topList = window.getFormattedTopSongsCatalog() || [];
      if (!Array.isArray(topList) || topList.length === 0) return null;

      if (!window._topCatalogSigLookupMap || window._topCatalogSigLookupSize !== topList.length) {
        const map = new Map();
        for (const s of topList) {
          if (!s) continue;
          const id = String(s.id || '').trim();
          const rawId = String(s.raw_id || id.replace(/^top_/, '')).trim();
          if (id) map.set(`id:${id}`, s);
          if (rawId) map.set(`raw:${rawId}`, s);
          const sig = getCanonicalSongSignature(s.title, s.artist, s);
          if (sig && !map.has(`sig:${sig}`)) map.set(`sig:${sig}`, s);
        }
        window._topCatalogSigLookupMap = map;
        window._topCatalogSigLookupSize = topList.length;
      }

      const id = String(track.id || '').trim();
      const rawId = String(track.raw_id || id.replace(/^top_/, '')).trim();
      const sig = getCanonicalSongSignature(track.title, track.artist, track);
      const matched =
        (id && window._topCatalogSigLookupMap.get(`id:${id}`)) ||
        (rawId && window._topCatalogSigLookupMap.get(`raw:${rawId}`)) ||
        (sig && window._topCatalogSigLookupMap.get(`sig:${sig}`)) ||
        null;

      if (matched) track._matchedTopCatalogSong = matched;
      return matched;
    }

    /**
     * Resuelve el MP3 de estudio de los GitHub Releases para CUALQUIER pista (catálogo Top o no),
     * mediante el mapa exacto de ficheros y el slug artista_titulo (con y sin tildes).
     */
    _resolveTopAudio(track) {
      if (!track) return null;
      const map = window.RELEASE_TAGS_MAP || null;
      const tagOf = (f) => {
        const e = map && map[f];
        return e ? String(Array.isArray(e) ? e[0] : e) : null;
      };
      const direct = (track.audio_url || String(track.id || '').startsWith('top_') || track.is_top_song)
        ? track
        : this._findMatchingTopCatalogSong(track);
      if (direct) {
        const rawId = String(direct.raw_id || direct.id || '').replace(/^top_/, '');
        const file = direct.audio_url || `${rawId}.mp3`;
        return { filename: file, tag: tagOf(file) };
      }
      if (!map) return null;
      if (track._slugTopAudio !== undefined) return track._slugTopAudio;
      const drop = s => String(s || '').toLowerCase().replace(/[^a-z0-9\s_]/g, '').replace(/\s/g, '_');
      const nfd = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s_]/g, '').replace(/\s/g, '_');
      const artist0 = repairSpanishBrokenAccents(String(track.artist || '')).replace(/\s*-\s*topic$/i, '').replace(/vevo$/i, '').trim();
      const primary = artist0.split(/\s*(?:,|&|\/|;|\sx\s|\sfeat\.?\s|\sft\.?\s|\sfeaturing\s)\s*/i)[0] || artist0;
      const title0 = String(track.title || '');
      const titles = [...new Set([title0, repairSpanishBrokenAccents(title0), title0.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').trim()])].filter(Boolean);
      const artists = [...new Set([artist0, primary, String(track.artist || '')])].filter(Boolean);
      for (const a of artists) for (const t of titles) for (const fn of [drop, nfd]) {
        const key = `${fn(a)}_${fn(t)}.mp3`;
        if (map[key]) {
          track._slugTopAudio = { filename: key, tag: tagOf(key) };
          return track._slugTopAudio;
        }
      }
      track._slugTopAudio = null;
      return null;
    }

    /**
     * Obtiene la URL directa de streaming completo para pistas del catálogo Top (Release Packs 3 al 9 CDN)
     * o Comunidad, permitiendo arrancar el audio completo desde 0:00 al instante y 100% sincronizado con LRC.
     */
    _getDirectFullStreamUrl(track, preferReleaseTag = null) {
      if (!track) return '';
      const top = this._resolveTopAudio(track);
      if (top && top.filename) {
        const tag = preferReleaseTag || top.tag || '3';
        const apiBase = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
        if (apiBase && (!preferReleaseTag || String(preferReleaseTag) === String(top.tag))) {
          // El servidor resuelve la URL firmada del CDN en ~0.4s (github.com/releases/download tarda ~11s)
          return `${apiBase}/api/v1/cdn/release/${encodeURIComponent(top.filename)}`;
        }
        const cUrl = `https://github.com/Bruala33/renacer/releases/download/${tag}/${top.filename}`;
        return `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(cUrl)}`;
      }
      if (String(track.id || '').startsWith('comm_')) {
        const folder = String(track.id).replace(/^comm_/, '');
        const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
        return `${baseUrl}/songs/${folder}/audio.mp3`;
      }
      return '';
    }

    _buildServerExtractStreamUrl(track) {
      if (!track) return '';
      const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
      const repTitle = repairSpanishBrokenAccents(track.title || '');
      const repArtist = repairSpanishBrokenAccents(track.artist || '');
      const expectedStudioDur = Number(track.durationSec) || 0;
      const vid = this._extractTrackYoutubeId(track);
      const vidParam = vid ? `&videoId=${encodeURIComponent(vid)}` : '';
      const durParam = expectedStudioDur > 45 ? `&durationSec=${Math.round(expectedStudioDur)}` : '';
      return `${baseUrl}/api/v1/audio/extract?title=${encodeURIComponent(repTitle)}&artist=${encodeURIComponent(repArtist)}${vidParam}${durParam}`;
    }

    /**
     * Reproduce SIEMPRE la canción completa desde 0:00 (o desde startOffsetSec),
     * sin pasar por previews de 30s que provocan cortes ni desincronización con las letras de Karaoke.
     */
    async playTrack(track, options = {}) {
      if (!track) return false;
      const reqId = ++this._playRequestId;
      this.isLoadingTrack = true;
      this._extractTrackYoutubeId(track);
      this.currentTrack = track;
      this.fullTrackReady = false;
      this.fullTrackBlob = null;
      this.isCrossfading = false;
      this.pendingUserSeekSec = null;

      if (typeof window.pauseMenuAmbientMusic === 'function') {
        window.pauseMenuAmbientMusic();
      }
      if (typeof window.stopPreviewCandidateAudio === 'function' && !options.fromThumbnailPreview) {
        window.stopPreviewCandidateAudio(false);
      }

      this._stopBothChannelsImmediate();

      const miniEl = document.getElementById('spotifyMiniPlayer');
      if (miniEl) {
        miniEl.style.transform = '';
        miniEl.classList.remove('hidden-player');
      }

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

      // Enriquecer portada/duración en segundo plano sin bloquear el arranque de audio
      if (!track.artworkUrl600 || !track.durationSec || track.durationSec < 45) {
        this.graphService.enrichTrackMetadata(track).then((enriched) => {
          if (reqId !== this._playRequestId || !enriched) return;
          if (enriched.durationSec && enriched.durationSec > 40 && !this.fullTrackReady) {
            track.durationSec = enriched.durationSec;
            this._updatePlayerProgressUI(this.getCurrentSongTimeSec(), enriched.durationSec);
          }
          if (enriched.artworkUrl600) {
            this._updatePlayerMetadataUI(track);
          }
        }).catch(() => {});
      }

      if (this.karaokeService) {
        this.karaokeService.loadAndRenderTrackLyrics(track, this.getRealDurationSec(track)).catch(() => {});
      }

      if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncVideoclipIfActive === 'function') {
        window.DiscoverHomeApp.syncVideoclipIfActive(track);
      }

      // 1. Si ya tenemos el Blob completo en caché de memoria, reproducir al instante (0ms)
      const cachedFullBlob = this._getCachedFullBlobForTrack(track);
      if (cachedFullBlob && cachedFullBlob.size >= 80000) {
        this.fullTrackBlob = cachedFullBlob;
        this.fullTrackReady = true;
        this._setLoadingHintVisible(false);
        const startedFull = await this._startChannelWithFadeIn(this.fullAudio, cachedFullBlob, 'full', reqId, desiredStartSec, 120);
        this.isLoadingTrack = false;
        if (startedFull) {
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          this.warmTracks(this.queue.slice(this.queueIndex + 1, this.queueIndex + 6));
          return true;
        }
      }

      // 2. Si es pista de Comunidad local, reproducir del archivo local del servidor de inmediato
      const isCommTrack = String(track.id || '').startsWith('comm_');
      if (isCommTrack) {
        const commUrl = this._getDirectFullStreamUrl(track, '3');
        if (commUrl) {
          const startedComm = await this._startChannelWithFadeIn(this.fullAudio, commUrl, 'full', reqId, desiredStartSec, 120);
          if (startedComm) {
            this.fullTrackReady = true;
            this.isLoadingTrack = false;
            this._updatePlayerMetadataUI(track);
            this._startListenTracker();
            return true;
          }
        }
      }

      // 3. Reproducción instantánea:
      //    - Si tiene URL maestra directa en GitHub Releases (Catálogo Top), arrancar directo (~0.25s).
      //    - Si es una canción de YouTube / Playlist sin CDN directo, arrancar SÍNCRONAMENTE (0ms) el puente YT.Player
      //      aprovechando el gesto táctil del usuario y, en paralelo, descargar el MP3 completo (SoundCloud ~0.25s / Servidor)
      //      para hacer el handoff transparente sin que el usuario espere jamás a 0 KB/s.
      const progressiveExtractUrl = this._buildServerExtractStreamUrl(track);
      const directStreamUrl = (!isCommTrack) ? this._getDirectFullStreamUrl(track) : '';
      const ytVid = this._extractTrackYoutubeId(track);

      if (ytVid && !directStreamUrl) {
        this._startYtAudioBridge(ytVid, desiredStartSec, reqId);
        this._updatePlayerMetadataUI(track);
        this._startListenTracker();
        this.warmTracks(this.queue.slice(this.queueIndex + 1, this.queueIndex + 3));
        if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
          window.DiscoverHomeApp.syncActiveVideoclipPlayback('play');
        }

        // Pre-cargar silenciosamente el Blob en segundo plano para que al pulsar "Jugar al Piano" esté en caché,
        // pero SIN interrumpir el puente yt_bridge que ya está sonando sincronizado con la letra y el videoclip.
        this.preloadFullTrackInBackground(track).then((blob) => {
          if (reqId !== this._playRequestId || !blob || blob.size < 80000) return;
          this.fullTrackBlob = blob;
          this.fullTrackReady = true;
        }).catch(() => {});
        return true;
      }

      this._setLoadingHintVisible(true);
      const streamUrlToPlay = directStreamUrl || progressiveExtractUrl;

      const startedStream = await this._startChannelWithFadeIn(this.fullAudio, streamUrlToPlay, 'full', reqId, desiredStartSec, 110);
      if (reqId !== this._playRequestId) return false;

      if (startedStream) {
        if (this._ytBridgeVideoId) {
          const bridgePos = this.getCurrentSongTimeSec();
          this._stopYtAudioBridge();
          if (bridgePos > desiredStartSec + 0.4) {
            try { this.fullAudio.currentTime = bridgePos; } catch (_) {}
          }
        }
        this.fullTrackReady = true;
        this.isLoadingTrack = false;
        this._setLoadingHintVisible(false);
        this._updatePlayerMetadataUI(track);
        this._startListenTracker();
        this.warmTracks(this.queue.slice(this.queueIndex + 1, this.queueIndex + 3));
        if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
          window.DiscoverHomeApp.syncActiveVideoclipPlayback('play');
        }
        return true;
      }

      // Reintento inmediato con progressive extract url si falló el CDN directo
      if (streamUrlToPlay !== progressiveExtractUrl) {
        const startedFallback = await this._startChannelWithFadeIn(this.fullAudio, progressiveExtractUrl, 'full', reqId, desiredStartSec, 110);
        if (reqId !== this._playRequestId) return false;
        if (startedFallback) {
          this.fullTrackReady = true;
          this.isLoadingTrack = false;
          this._setLoadingHintVisible(false);
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          this.warmTracks(this.queue.slice(this.queueIndex + 1, this.queueIndex + 3));
          return true;
        }
      }

      if (ytVid) {
        this._startYtAudioBridge(ytVid, desiredStartSec, reqId);
        this._updatePlayerMetadataUI(track);
        this._startListenTracker();
        return true;
      }

      // Último recurso: preload por Blob
      const fullBlob = await this.preloadFullTrackInBackground(track);
      if (reqId !== this._playRequestId) return false;
      if (fullBlob && fullBlob.size >= 80000) {
        this.fullTrackBlob = fullBlob;
        this.fullTrackReady = true;
        this._setLoadingHintVisible(false);
        const startedFromBlob = await this._startChannelWithFadeIn(this.fullAudio, fullBlob, 'full', reqId, desiredStartSec, 110);
        this.isLoadingTrack = false;
        if (startedFromBlob) {
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          return true;
        }
      }

      const fallbackPreviewUrl = track.previewUrl || track.preview_url || (this.prewarmedPreviewMap.get(String(track.id))?.previewUrl) || '';
      if (fallbackPreviewUrl && /^https?:\/\//i.test(fallbackPreviewUrl)) {
        const previewStarted = await this._startChannelWithFadeIn(this.previewAudio, fallbackPreviewUrl, 'preview', reqId, 0, 120);
        if (previewStarted) {
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          return true;
        }
      }

      return false;
    }

    async _upgradeActivePreviewToFullTrackInBackground(track, reqId) {
      if (!track || reqId !== this._playRequestId) return;
      try {
        const blob = await this.preloadFullTrackInBackground(track);
        if (reqId !== this._playRequestId || !this.currentTrack || this.currentTrack.id !== track.id) return;
        if (blob && blob.size >= 80000) {
          this.fullTrackBlob = blob;
          this.fullTrackReady = true;
          if (this.activeSourceType === 'preview' && this.isPlaying()) {
            const targetPos = this.pendingUserSeekSec !== null
              ? this.pendingUserSeekSec
              : (Number(this.previewAudio.currentTime) || 0);
            this.pendingUserSeekSec = null;
            try { this.previewAudio.pause(); } catch (_) {}
            await this._startChannelWithFadeIn(this.fullAudio, blob, 'full', reqId, targetPos, 150);
            this._setLoadingHintVisible(false);
          }
        }
      } catch (_) {}
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

        const steps = 8;
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
      if (this.isCrossfading || !this.currentTrack) return;
      const reqId = this._playRequestId;
      this.pendingUserSeekSec = targetPositionSec;

      const cachedBlob = this._getCachedFullBlobForTrack(this.currentTrack);
      if (cachedBlob && cachedBlob.size >= 80000) {
        try { this.previewAudio.pause(); } catch (_) {}
        await this._startChannelWithFadeIn(this.fullAudio, cachedBlob, 'full', reqId, targetPositionSec, 150);
        this.fullTrackReady = true;
        this.pendingUserSeekSec = null;
        this._setLoadingHintVisible(false);
        return;
      }

      if (!this.fullAudio.src || this.activeSourceType !== 'full') {
        const directUrl3 = this._getDirectFullStreamUrl(this.currentTrack, '3');
        const streamUrl = directUrl3 || this._buildServerExtractStreamUrl(this.currentTrack);
        try { this.previewAudio.pause(); } catch (_) {}
        let ok = await this._startChannelWithFadeIn(this.fullAudio, streamUrl, 'full', reqId, targetPositionSec, 150);
        if (!ok && directUrl3 && reqId === this._playRequestId) {
          const directUrl8 = this._getDirectFullStreamUrl(this.currentTrack, '8');
          if (directUrl8) {
            ok = await this._startChannelWithFadeIn(this.fullAudio, directUrl8, 'full', reqId, targetPositionSec, 150);
          }
        }
        if (!ok && reqId === this._playRequestId) {
          const blob = await this.preloadFullTrackInBackground(this.currentTrack);
          if (blob && reqId === this._playRequestId) {
            await this._startChannelWithFadeIn(this.fullAudio, blob, 'full', reqId, targetPositionSec, 150);
          }
        }
        this.fullTrackReady = true;
        this.pendingUserSeekSec = null;
        this._setLoadingHintVisible(false);
        return;
      }
      try {
        this.fullAudio.currentTime = Math.max(0, targetPositionSec);
      } catch (_) {}
      this._setLoadingHintVisible(false);
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
      while (window._fullTrackBlobCache.size > 18) {
        const firstKey = window._fullTrackBlobCache.keys().next().value;
        if (firstKey) window._fullTrackBlobCache.delete(firstKey);
      }
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

      if (!this._inflightFullPreloads) this._inflightFullPreloads = new Map();
      const key = String(track.id || `${track.title}__${track.artist}`);
      if (this._inflightFullPreloads.has(key)) {
        return this._inflightFullPreloads.get(key);
      }

      const promise = (async () => {
        try {
          const raceCompetitors = [];

          // 1. Rama Servidor (/api/v1/audio/extract) con buffer y streaming ultra-rápido
          const serverRaceTask = (async () => {
            const extractUrl = this._buildServerExtractStreamUrl(track);
            const resp = await fetch(extractUrl);
            if (!resp.ok) throw new Error('Server extract HTTP ' + resp.status);
            const matchedVid = resp.headers.get('X-Video-Id');
            if (matchedVid && !track.videoId) {
              track.videoId = decodeURIComponent(matchedVid);
            }
            const durHdr = Number(resp.headers.get('X-Audio-Duration')) || 0;
            if (durHdr > 45) {
              track.durationSec = durHdr;
            }
            const blob = await resp.blob();
            if (!blob || blob.size < 80000) throw new Error('Blob too small');
            return blob;
          })();
          raceCompetitors.push(serverRaceTask);

          // 2. Rama CDN Directo con resolución exacta de Release Tag (3 al 9)
          const directUrl = this._getDirectFullStreamUrl(track);
          if (directUrl) {
            const directRaceTask = (async () => {
              const ctrl = new AbortController();
              const tid = setTimeout(() => ctrl.abort(), 2800);
              try {
                const r = await fetch(directUrl, { signal: ctrl.signal });
                clearTimeout(tid);
                if (r.ok) {
                  const b = await r.blob();
                  if (b && b.size >= 80000) return b;
                }
              } catch (_) {
                clearTimeout(tid);
              }
              // Fallback opcional a tags universales 3 y 8 si falló el tag principal
              for (const fbTag of ['3', '8']) {
                const fbUrl = this._getDirectFullStreamUrl(track, fbTag);
                if (fbUrl && fbUrl !== directUrl) {
                  const fbCtrl = new AbortController();
                  const fbTid = setTimeout(() => fbCtrl.abort(), 2000);
                  try {
                    const fbRes = await fetch(fbUrl, { signal: fbCtrl.signal });
                    clearTimeout(fbTid);
                    if (fbRes.ok) {
                      const fbBlob = await fbRes.blob();
                      if (fbBlob && fbBlob.size >= 80000) return fbBlob;
                    }
                  } catch (_) {
                    clearTimeout(fbTid);
                  }
                }
              }
              throw new Error('Direct CDN failed');
            })();
            raceCompetitors.push(directRaceTask);
          }

          // 3. Rama SoundCloud Cliente directo (~200ms desde CDN progresivo):
          //    Compite en paralelo incluso cuando la pista viene de una playlist de YouTube (exigiendo alta coincidencia >= 74 si tiene videoId)
          if (!directUrl && typeof window.searchSoundCloudFullClient === 'function' && typeof window.downloadSoundCloudFullTrackClient === 'function') {
            const clientScTask = (async () => {
              const repTitle = repairSpanishBrokenAccents(track.title || '');
              const repArtist = repairSpanishBrokenAccents(track.artist || '');
              const hasYtId = Boolean(this._extractTrackYoutubeId(track));
              const minReqScore = hasYtId ? 74 : 68;
              const scList = await window.searchSoundCloudFullClient(repTitle, repArtist, 12);
              if (!Array.isArray(scList) || scList.length === 0) throw new Error('No SC candidates');
              for (const cand of scList.slice(0, 2)) {
                if ((cand.authenticityScore || 0) < minReqScore) break;
                const scDl = await window.downloadSoundCloudFullTrackClient(cand._scRawTrack || cand.scTrackId);
                if (scDl && scDl.blob && scDl.blob.size >= 100000) {
                  if (scDl.durationSec && scDl.durationSec > 45 && (!track.durationSec || track.durationSec < 45)) {
                    track.durationSec = scDl.durationSec;
                  }
                  return scDl.blob;
                }
              }
              throw new Error('SC download failed');
            })();
            raceCompetitors.push(clientScTask);
          }

          const winnerBlob = await Promise.any(raceCompetitors);
          if (winnerBlob && winnerBlob.size >= 80000) {
            this._storeFullBlobInGlobalCache(track, winnerBlob);
            return winnerBlob;
          }
        } catch (_) {}
        return null;
      })();

      this._inflightFullPreloads.set(key, promise);
      try {
        return await promise;
      } finally {
        this._inflightFullPreloads.delete(key);
      }
    }

    /**
     * Pre-calienta los metadatos, las letras sincronizadas de Karaoke y el audio completo
     * de las próximas 2 tarjetas del mazo Para Ti para que al deslizar arranquen en 0ms.
     */
    async prewarmUpcomingCards(tracksSlice = []) {
      if (!Array.isArray(tracksSlice) || tracksSlice.length === 0) return;
      const nextCards = tracksSlice.slice(0, 4);

      for (let i = 0; i < nextCards.length; i++) {
        const tr = nextCards[i];
        if (!tr || !tr.id) continue;
        const idStr = String(tr.id);

        if (this.karaokeService) {
          this.karaokeService.fetchLyricsForTrack(tr, this.getRealDurationSec(tr)).catch(() => {});
        }

        // Pre-cargar el audio completo de la siguiente tarjeta en segundo plano para arranque en 0ms al hacer swipe
        if (i <= 1) {
          this.preloadFullTrackInBackground(tr).catch(() => {});
        } else {
          setTimeout(() => {
            this.preloadFullTrackInBackground(tr).catch(() => {});
          }, 400 * i);
        }

        this.graphService.enrichTrackMetadata(tr).then((meta) => {
          const artUrl = (meta && meta.artworkUrl600) || tr.artworkUrl600 || tr.thumbnail || tr.cover_url;
          if (artUrl && /^https?:\/\//i.test(artUrl)) {
            tr.artworkUrl600 = artUrl;
            tr.thumbnail = artUrl;
            tr.cover_url = artUrl;
            const nextImgEl = document.getElementById('crateNextCoverImg');
            if (nextImgEl && window.DiscoverHomeApp && window.DiscoverHomeApp.deck[window.DiscoverHomeApp.deckIndex + 1]?.id === tr.id) {
              nextImgEl.src = artUrl;
            }
          }
          const prevUrl = (meta && meta.previewUrl) || tr.previewUrl || tr.preview_url;
          if (prevUrl && /^https?:\/\//i.test(prevUrl) && !this.prewarmedPreviewMap.has(idStr)) {
            if (this.prewarmedPreviewMap.size >= 16) {
              const oldest = this.prewarmedPreviewMap.keys().next().value;
              if (oldest) this.prewarmedPreviewMap.delete(oldest);
            }
            this.prewarmedPreviewMap.set(idStr, {
              previewUrl: prevUrl,
              artworkUrl600: artUrl
            });
          }
        }).catch(() => {});
      }
    }

    togglePlayPause() {
      if (!this.currentTrack) {
        if (this.queue.length > 0) {
          this.playTrack(this.queue[0]);
        }
        return;
      }
      if (this.activeSourceType === 'yt_bridge') {
        if (!this._ytBridgePaused) {
          this._ytBridgePaused = true;
          this._ytBridgeBaseSec = this.getCurrentSongTimeSec();
          this._sendYtBridgeCommand('pauseVideo', []);
          this.isPlayingFlag = false;
          this._syncPlayPauseIcons(false);
        } else {
          if (typeof window.pauseMenuAmbientMusic === 'function') {
            window.pauseMenuAmbientMusic();
          }
          this._ytBridgeStartWallMs = performance.now();
          this._ytBridgePaused = false;
          this._sendYtBridgeCommand('playVideo', []);
          this.isPlayingFlag = true;
          this._syncPlayPauseIcons(true);
        }
        if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
          window.DiscoverHomeApp.syncActiveVideoclipPlayback(this.isPlayingFlag ? 'play' : 'pause');
        }
        return;
      }
      if (this.activeSourceType === 'none' || (!this.fullAudio.src && !this.previewAudio.src)) {
        this.playTrack(this.currentTrack);
        return;
      }
      const activeEl = this.getActiveAudioElement();
      if (!activeEl) {
        this.playTrack(this.currentTrack);
        return;
      }

      if (this.isPlaying()) {
        activeEl.pause();
        this.isPlayingFlag = false;
        this._syncPlayPauseIcons(false);
        if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
          window.DiscoverHomeApp.syncActiveVideoclipPlayback('pause');
        }
      } else {
        if (typeof window.pauseMenuAmbientMusic === 'function') {
          window.pauseMenuAmbientMusic();
        }
        activeEl.volume = this._getMasterVolume();
        activeEl.play().then(() => {
          this.isPlayingFlag = true;
          this._syncPlayPauseIcons(true);
          if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
            window.DiscoverHomeApp.syncActiveVideoclipPlayback('play');
          }
        }).catch(() => {});
      }
    }

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

      if (this.activeSourceType === 'yt_bridge') {
        this._ytBridgeBaseSec = safeTarget;
        this._ytBridgeStartWallMs = performance.now();
        this._sendYtBridgeCommand('seekTo', [Math.floor(safeTarget), true]);
        if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
          window.DiscoverHomeApp.syncActiveVideoclipPlayback('seek', safeTarget);
        }
        return;
      }

      if (this.activeSourceType === 'full' && this.fullAudio.src) {
        try {
          this.fullAudio.currentTime = safeTarget;
        } catch (_) {}
        if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
          window.DiscoverHomeApp.syncActiveVideoclipPlayback('seek', safeTarget);
        }
        return;
      }

      // Si estaba en preview de 30s y el usuario mueve la barra, si cae dentro de la ventana de 30s del preview ajustar al instante
      const diffFromOffset = safeTarget - (this.previewBaseOffsetSec || 30);
      if (this.activeSourceType === 'preview' && diffFromOffset >= 0 && diffFromOffset <= 27) {
        try {
          this.previewAudio.currentTime = diffFromOffset;
        } catch (_) {}
        return;
      }

      // Si salta fuera del preview, cambiar al stream completo en el segundo elegido
      this._setLoadingHintVisible(true);
      await this._performTransparentHandoffToFullTrack(safeTarget);
      if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
        window.DiscoverHomeApp.syncActiveVideoclipPlayback('seek', safeTarget);
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
        if (miniEl && !miniEl._swipeDownBound) {
          miniEl._swipeDownBound = true;

          let startY = 0;
          let startX = 0;
          let deltaY = 0;
          let tracking = false;
          let startedOnHandle = false;

          miniEl.addEventListener('pointerdown', (e) => {
            const onHandle = Boolean(e.target.closest('.mini-player-swipe-handle'));
            if (!onHandle && (e.target.closest('input[type="range"]') || e.target.closest('button'))) return;
            tracking = true;
            startedOnHandle = onHandle;
            startY = e.clientY ?? 0;
            startX = e.clientX ?? 0;
            deltaY = 0;
            miniEl.classList.add('swiping-down');
          });

          window.addEventListener('pointermove', (e) => {
            if (!tracking) return;
            const dy = (e.clientY ?? startY) - startY;
            const dx = Math.abs((e.clientX ?? startX) - startX);
            if (Math.abs(dy) > 4 && Math.abs(dy) > dx) {
              deltaY = dy;
              const clampedY = Math.max(-75, Math.min(110, dy));
              miniEl.style.transform = `translate3d(-50%, ${clampedY.toFixed(0)}px, 0)`;
            }
          }, { passive: true });

          const finishSwipe = () => {
            if (!tracking) return;
            tracking = false;
            miniEl.classList.remove('swiping-down');
            if (deltaY > 32) {
              this.closeMiniPlayerAndStop();
            } else if (deltaY < -20 || (startedOnHandle && Math.abs(deltaY) < 6)) {
              miniEl.style.transform = '';
              if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.openNowPlayingModal === 'function') {
                window.DiscoverHomeApp.openNowPlayingModal('vinyl');
              }
            } else {
              miniEl.style.transform = '';
            }
            deltaY = 0;
            startedOnHandle = false;
          };

          window.addEventListener('pointerup', finishSwipe);
          window.addEventListener('pointercancel', finishSwipe);
        }

        // Gestos de deslizar en la barrita blanca del desplegable de Opciones (#spotifyTrackOptionsSheet)
        const optModal = document.getElementById('spotifyTrackOptionsSheet');
        const optCard = optModal ? optModal.querySelector('.sp-options-sheet-card') : null;
        if (optModal && optCard && !optCard._swipeSheetBound) {
          optCard._swipeSheetBound = true;
          let oStartY = 0;
          let oDeltaY = 0;
          let oTracking = false;
          let oStartedOnHandle = false;

          optCard.addEventListener('pointerdown', (e) => {
            const onHandle = Boolean(e.target.closest('.sp-options-sheet-handle') || e.target.closest('.sp-options-sheet-header'));
            const actionsList = document.getElementById('spOptSheetActionsList');
            const atTop = !actionsList || actionsList.scrollTop <= 2;
            if (!onHandle && !atTop) return;
            if (!onHandle && e.target.closest('button')) return;
            oTracking = true;
            oStartedOnHandle = onHandle;
            oStartY = e.clientY ?? 0;
            oDeltaY = 0;
            optCard.style.transition = 'none';
          });

          window.addEventListener('pointermove', (e) => {
            if (!oTracking) return;
            const dy = (e.clientY ?? oStartY) - oStartY;
            if (dy > 4) {
              oDeltaY = dy;
              optCard.style.transform = `translate3d(0, ${Math.min(360, dy).toFixed(0)}px, 0)`;
            }
          }, { passive: true });

          const finishOptSwipe = () => {
            if (!oTracking) return;
            oTracking = false;
            optCard.style.transition = 'transform 0.22s ease';
            if (oDeltaY > 36 || (oStartedOnHandle && Math.abs(oDeltaY) < 6)) {
              optCard.style.transform = '';
              if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.closeTrackOptionsSheet === 'function') {
                window.DiscoverHomeApp.closeTrackOptionsSheet();
              }
            } else {
              optCard.style.transform = '';
            }
            oDeltaY = 0;
            oStartedOnHandle = false;
          };

          window.addEventListener('pointerup', finishOptSwipe);
          window.addEventListener('pointercancel', finishOptSwipe);
        }

        // Gestos de deslizar hacia abajo en el reproductor grande (#nowPlayingTurntableModal)
        const npModal = document.getElementById('nowPlayingTurntableModal');
        const npHeader = npModal ? npModal.querySelector('.now-playing-header') : null;
        if (npModal && npHeader && !npHeader._swipeCloseBound) {
          npHeader._swipeCloseBound = true;
          let npStartY = 0;
          let npDeltaY = 0;
          let npTracking = false;

          npHeader.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button')) return;
            npTracking = true;
            npStartY = e.clientY ?? 0;
            npDeltaY = 0;
            npModal.style.transition = 'none';
          });

          window.addEventListener('pointermove', (e) => {
            if (!npTracking) return;
            const dy = (e.clientY ?? npStartY) - npStartY;
            if (dy > 5) {
              npDeltaY = dy;
              npModal.style.transform = `translate3d(0, ${Math.min(400, dy).toFixed(0)}px, 0)`;
            }
          }, { passive: true });

          const finishNpSwipe = () => {
            if (!npTracking) return;
            npTracking = false;
            npModal.style.transition = '';
            npModal.style.transform = '';
            if (npDeltaY > 42 && window.DiscoverHomeApp && typeof window.DiscoverHomeApp.closeNowPlayingModal === 'function') {
              window.DiscoverHomeApp.closeNowPlayingModal();
            }
            npDeltaY = 0;
          };

          window.addEventListener('pointerup', finishNpSwipe);
          window.addEventListener('pointercancel', finishNpSwipe);
        }
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
      this.warmTracks(this.queue.slice(this.queueIndex + 1, this.queueIndex + 9));
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
      this._stopYtAudioBridge();
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
    pauseLarge: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    radio: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>`
  };

  function hasRealHttpCover(track) {
    if (!track) return false;
    const raw = String(track.artworkUrl600 || track.cover_url || track.thumbnail || '').trim();
    if (!/^https?:\/\//i.test(raw)) return false;
    // Las miniaturas de YouTube (i.ytimg.com) pueden ser placeholders grises 120x90 o recortes 16:9;
    // devolvemos false si aún no tiene artworkUrl600 oficial de iTunes/Deezer para que se enriquezca automáticamente.
    if (/i\.ytimg\.com/i.test(raw) && !track.artworkUrl600) return false;
    return true;
  }

  function getBestTrackCover(track) {
    if (!track) return './app_logo.png';
    for (const candidate of [track.artworkUrl600, track.cover_url, track.thumbnail]) {
      const s = String(candidate || '').trim();
      if (/^https?:\/\//i.test(s)) {
        return s.replace(/100x100bb/g, '600x600bb').replace(/300x300bb/g, '600x600bb');
      }
    }
    if (typeof window.getSongCoverFallback === 'function') {
      return window.getSongCoverFallback(track.title, track.artist);
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
    crateVideoclipMode: false,
    targetPlaylistId: null,
    targetPlaylistObj: null,
    _cleanupCardGestureListeners: null,
    _openedSheetTracks: [],
    _openedSheetTitle: '',
    _openedSheetPlaylistId: null,
    _dynamicPlaylistCarouselsMap: {},
    _cachedCandidatePool: null,
    _cachedPoolTimestamp: 0,
    _videoIdCache: new Map(),
    _activeOptionsTrack: null,
    _activeOptionsContext: null,

    init() {
      if (this.isInitialized) {
        this.refreshCarousels();
        const input = document.getElementById('discoverPlaylistSearchInput');
        if (!input || !input.value.trim()) {
          this.renderLiveTopPlaylistsGrid();
        }
        return;
      }
      this.isInitialized = true;
      this._syncDialsUI();
      this.rebuildCrateDeck(false);
      // Pre-calentar todas las canciones de las playlists guardadas del usuario en segundo plano
      setTimeout(async () => {
        try {
          if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getAllPlaylists === 'function') {
            const pls = await window.IndexedDBStorage.getAllPlaylists().catch(() => []) || [];
            const allPlTracks = [];
            for (const p of pls) {
              if (Array.isArray(p?.tracks)) allPlTracks.push(...p.tracks);
            }
            if (allPlTracks.length > 0) {
              dualStreamEngine.warmTracks(allPlTracks.slice(0, 30));
            }
          }
        } catch (_) {}
      }, 600);
      // Diferir carruseles secundarios un frame para que la entrada a Descubrir sea instantánea
      requestAnimationFrame(() => {
        this.refreshCarousels();
        this.renderLiveTopPlaylistsGrid();
      });
    },

    isTrackAlreadyInList(candidateTrack, list = []) {
      if (!candidateTrack || !Array.isArray(list) || list.length === 0) return false;
      const idxObj = buildTrackListLookupIndex(list);
      const id = String(candidateTrack.id || '').trim();
      if (id && idxObj.ids.has(id)) return true;
      const vid = String(candidateTrack.videoId || '').trim();
      if (vid && idxObj.vids.has(vid)) return true;
      const sig = getCanonicalSongSignature(candidateTrack.title, candidateTrack.artist, candidateTrack);
      if (sig && idxObj.sigs.has(sig)) return true;
      const nt = candidateTrack._normTitle !== undefined ? candidateTrack._normTitle : normalizeSongPart(candidateTrack.title, false);
      const na = candidateTrack._normArtist !== undefined ? candidateTrack._normArtist : normalizeSongPart(candidateTrack.artist, true);
      if (nt && idxObj.titles.has(nt) && (!na || idxObj.artists.has(na))) return true;
      return false;
    },

    getAllCandidatePool(forceRefresh = false) {
      const now = Date.now();
      if (!forceRefresh && Array.isArray(this._cachedCandidatePool) && this._cachedCandidatePool.length > 0 && (now - this._cachedPoolTimestamp < 60000)) {
        return this._cachedCandidatePool;
      }

      const pool = [];
      const seenIds = new Set();
      const seenCanonical = new Set();

      const addTrack = (item) => {
        if (!item || !item.title) return;
        const id = String(item.id || '');
        if (!id || seenIds.has(id)) return;
        const sig = getCanonicalSongSignature(item.title, item.artist);
        if (sig && seenCanonical.has(sig)) return;
        seenIds.add(id);
        if (sig) seenCanonical.add(sig);
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

      this._cachedCandidatePool = pool;
      this._cachedPoolTimestamp = now;
      return pool;
    },

    rebuildCrateDeck(autoPlayFirst = false) {
      const pool = this.getAllCandidatePool();
      const targetVec = dnaEngine.getEffectiveTargetVector();

      const plTracks = (this.targetPlaylistObj && Array.isArray(this.targetPlaylistObj.tracks))
        ? this.targetPlaylistObj.tracks
        : [];
      let plCentroid = null;
      if (this.targetPlaylistObj) {
        plCentroid = dnaEngine.computePlaylistCentroidVector(plTracks, this.targetPlaylistObj.title || '');
      }

      const eligiblePool = pool.filter(tr => {
        if (plTracks.length > 0 && this.isTrackAlreadyInList(tr, plTracks)) return false;
        if (dnaEngine.isTrackOnCooldown(tr)) return false;
        return true;
      });

      const activePool = eligiblePool.length >= 8
        ? eligiblePool
        : pool.filter(tr => !(plTracks.length > 0 && this.isTrackAlreadyInList(tr, plTracks)));

      const scored = activePool.map(tr => {
        const baseScore = this.targetPlaylistObj
          ? dnaEngine.scoreTrackForPlaylist(tr, this.targetPlaylistObj, plCentroid)
          : dnaEngine.scoreTrackForRecommendation(tr, targetVec);
        const coverBoost = hasRealHttpCover(tr) ? 0.25 : 0;
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
        dualStreamEngine.preloadFullTrackInBackground(active).catch(() => {});
        dualStreamEngine.warmTracks([active]);
        dualStreamEngine.prewarmUpcomingCards(this.deck.slice(0, 3));
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
        }
      }
    },

    handleBrokenYtThumb(imgEl, title = '', artist = '') {
      if (!imgEl || imgEl._ytFixed) return;
      imgEl._ytFixed = true;
      const fallback = (typeof window.getSongCoverFallback === 'function' && title)
        ? window.getSongCoverFallback(title, artist)
        : './app_logo.png';
      imgEl.src = fallback;
      if (title) {
        const dummy = { title, artist };
        graphService.enrichTrackMetadata(dummy).then((meta) => {
          if (meta && meta.artworkUrl600) {
            imgEl.src = meta.artworkUrl600;
          }
        }).catch(() => {});
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

    // =========================================================================
    // RESOLUCIÓN Y RENDERIZADO DEL VIDEOCLIP OFICIAL DE YOUTUBE ADAPTADO A LA APP
    // =========================================================================
    _getVideoclipTrackKey(track) {
      if (!track) return '';
      const vid = dualStreamEngine._extractTrackYoutubeId(track);
      const idPart = String(track.id || vid || '').trim();
      const titlePart = String(track.title || '').toLowerCase().trim();
      const artistPart = String(track.artist || '').toLowerCase().trim();
      return `${idPart}__${titlePart}__${artistPart}`;
    },

    async resolveTrackVideoclipData(track) {
      if (!track) return { videoStreamUrl: '', videoId: '' };
      if (!this._videoclipDataCache) this._videoclipDataCache = new Map();

      const existingVid = dualStreamEngine._extractTrackYoutubeId(track);
      const key = `${existingVid}__${track.title || ''}__${track.artist || ''}`.toLowerCase().trim();
      if (key && this._videoclipDataCache.has(key)) {
        return this._videoclipDataCache.get(key);
      }

      const cleanTitle = String(track.title || '').replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim();
      const cleanArtist = String(track.artist || '').replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim();
      const lookupTerm = `${cleanArtist} ${cleanTitle}`.trim();

      let videoStreamUrl = '';
      let resolvedVid = existingVid;

      // 1. Consulta directa a iTunes Music Video API exigiendo coincidencia real de título Y artista
      if (!existingVid || !/^ultimoscruzados$/i.test(cleanArtist)) {
        try {
          const itunesMvResp = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(lookupTerm)}&entity=musicVideo&limit=6`
          );
          if (itunesMvResp.ok) {
            const itunesData = await itunesMvResp.json();
            const mvList = Array.isArray(itunesData?.results)
              ? itunesData.results.filter(r => r && r.previewUrl && /\.(m4v|mp4)/i.test(r.previewUrl))
              : [];
            if (mvList.length > 0) {
              const normStr = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
              const normArt = normStr(cleanArtist);
              const normTit = normStr(cleanTitle);
              const bestMv = mvList.find(r => {
                const rArt = normStr(r.artistName);
                const rTit = normStr(r.trackName);
                const artOk = !normArt || rArt.includes(normArt) || normArt.includes(rArt);
                const titOk = normTit && rTit && (rTit === normTit || rTit.includes(normTit) || normTit.includes(rTit));
                return artOk && titOk;
              });
              if (bestMv && bestMv.previewUrl) {
                videoStreamUrl = bestMv.previewUrl;
              }
            }
          }
        } catch (_) {}
      }

      // 2. Consulta al endpoint del servidor /api/v1/video/resolve para obtener el videoId de YouTube y/o stream de respaldo
      if (!videoStreamUrl || !resolvedVid) {
        try {
          const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
          const resp = await fetch(
            `${baseUrl}/api/v1/video/resolve?title=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(cleanArtist)}&q=${encodeURIComponent(lookupTerm)}`
          );
          if (resp.ok) {
            const data = await resp.json();
            if (!videoStreamUrl && data && data.videoStreamUrl) {
              videoStreamUrl = data.videoStreamUrl;
            }
            if (!resolvedVid && data && /^[a-zA-Z0-9_-]{11}$/.test(String(data.videoId || ''))) {
              resolvedVid = String(data.videoId);
              track.videoId = resolvedVid;
            }
          }
        } catch (_) {}
      }

      const result = { videoStreamUrl: videoStreamUrl || '', videoId: resolvedVid || '' };
      if (key && (result.videoStreamUrl || result.videoId)) {
        this._videoclipDataCache.set(key, result);
      }
      return result;
    },

    async resolveTrackYouTubeVideoId(track) {
      const data = await this.resolveTrackVideoclipData(track);
      return data.videoId || '';
    },

    toggleCrateVideoclipMode(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      this.crateVideoclipMode = !this.crateVideoclipMode;
      const btn = document.getElementById('crateVideoclipToggleBtn');
      if (btn) btn.classList.toggle('active', this.crateVideoclipMode);
      const active = this.getActiveCrateTrack();
      if (this.crateVideoclipMode && active) {
        if (!dualStreamEngine.isPlaying() || dualStreamEngine.currentTrack?.id !== active.id) {
          dualStreamEngine.playTrack(active);
        }
        this._mountCrateVideoclipForTrack(active);
      } else {
        const wrap = document.getElementById('crateMainVideoclipWrap');
        if (wrap) {
          wrap.innerHTML = '';
          wrap.classList.add('hidden');
        }
      }
    },

    async _mountCrateVideoclipForTrack(track) {
      const wrap = document.getElementById('crateMainVideoclipWrap');
      if (!wrap || !this.crateVideoclipMode || !track) return;
      wrap.classList.remove('hidden');
      wrap.innerHTML = `<div class="crate-videoclip-loading">Cargando videoclip oficial...</div>`;
      const reqKey = this._getVideoclipTrackKey(track);
      const clipData = await this.resolveTrackVideoclipData(track);
      if (!this.crateVideoclipMode || this._getVideoclipTrackKey(this.getActiveCrateTrack()) !== reqKey) return;

      if (clipData.videoStreamUrl) {
        wrap.innerHTML = `
          <video
            class="w-full h-full object-cover"
            src="${clipData.videoStreamUrl}"
            autoplay
            muted
            loop
            playsinline
          ></video>
        `;
        const vEl = wrap.querySelector('video');
        if (vEl) vEl.play().catch(() => {});
        return;
      }

      if (clipData.videoId) {
        const startSec = Math.max(15, Math.round(dualStreamEngine.getChorusOffsetSec(track) || 35));
        wrap.innerHTML = `
          <iframe
            class="crate-videoclip-iframe"
            src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(clipData.videoId)}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&start=${startSec}&loop=1&playlist=${encodeURIComponent(clipData.videoId)}"
            title="Videoclip"
            frameborder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
          ></iframe>
        `;
        return;
      }

      wrap.innerHTML = `<div class="crate-videoclip-loading">Videoclip no disponible</div>`;
    },

    syncVideoclipIfActive(track) {
      try {
        const cont = document.getElementById('npVideoclipIframeBox');
        if (!cont || !track) return;
        const baseKey = this._getVideoclipTrackKey(track);
        const curAttr = cont.getAttribute('data-vid-key') || '';
        if (curAttr && (curAttr === `${baseKey}__auto` || curAttr === `${baseKey}__yt`)) return;

        // Detener inmediatamente cualquier vídeo o iframe de la canción anterior
        const oldVid = cont.querySelector('video');
        if (oldVid) {
          try { oldVid.pause(); oldVid.removeAttribute('src'); oldVid.load(); } catch (_) {}
        }
        const oldIframe = cont.querySelector('iframe');
        if (oldIframe) {
          try { oldIframe.src = 'about:blank'; } catch (_) {}
        }
        cont.removeAttribute('data-vid-key');
        cont.innerHTML = '';

        const stage = document.getElementById('npVideoclipStageContainer');
        const tabBtn = document.getElementById('npTabVideoclipBtn');
        const isVideoclipTabActive = (stage && !stage.classList.contains('hidden')) || (tabBtn && tabBtn.classList.contains('active'));
        if (isVideoclipTabActive) {
          this._mountNowPlayingVideoclipForTrack(track);
        }
      } catch (_) {}
    },

    _sendVideoclipYtCommand(func, args = []) {
      try {
        const ifr = document.getElementById('npActiveYtVideoclipIframe');
        if (ifr && ifr.contentWindow) {
          ifr.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
        }
      } catch (_) {}
    },

    syncActiveVideoclipPlayback(eventType = 'tick', explicitSec = null) {
      try {
        const cont = document.getElementById('npVideoclipIframeBox');
        const stage = document.getElementById('npVideoclipStageContainer');
        if (!cont || !stage || stage.classList.contains('hidden')) return;

        const targetSec = explicitSec !== null
          ? Number(explicitSec)
          : (Number(dualStreamEngine.getCurrentSongTimeSec()) || 0);
        const playing = dualStreamEngine.isPlaying();
        const now = performance.now();

        const vidEl = cont.querySelector('#npActiveVideoclipVideoEl');
        if (vidEl) {
          vidEl.muted = true;
          if (!playing || eventType === 'pause') {
            if (!vidEl.paused) vidEl.pause();
            if (eventType === 'seek') {
              try { vidEl.currentTime = targetSec; } catch (_) {}
            }
            return;
          }
          if (vidEl.paused) vidEl.play().catch(() => {});
          if (eventType === 'seek' || (Number.isFinite(vidEl.duration) && vidEl.duration > 45 && Math.abs((vidEl.currentTime || 0) - targetSec) > 0.4)) {
            try { vidEl.currentTime = targetSec; } catch (_) {}
          }
          return;
        }

        const ifr = cont.querySelector('#npActiveYtVideoclipIframe');
        if (!ifr) return;
        this._sendVideoclipYtCommand('mute', []);

        // Si la canción está en PAUSA, pausar el videoclip de inmediato y mantenerlo en pausa
        if (!playing || eventType === 'pause') {
          if (eventType === 'seek') {
            this._sendVideoclipYtCommand('seekTo', [Math.max(0, Number(targetSec.toFixed(2))), true]);
            this._videoclipRealTimeSec = targetSec;
            this._videoclipRealTimeWallMs = now;
          }
          if (eventType === 'pause' || !this._videoclipForcedPaused || this._videoclipRealState === 1 || this._videoclipRealState === 3) {
            this._sendVideoclipYtCommand('pauseVideo', []);
            this._videoclipForcedPaused = true;
          }
          this._lastVideoclipSyncMs = now;
          this._lastVideoclipSyncedAudioSec = targetSec;
          return;
        }

        // La canción está REPRODUCIÉNDOSE
        this._videoclipForcedPaused = false;

        if (eventType === 'seek') {
          this._lastVideoclipSyncMs = now;
          this._lastVideoclipSyncedAudioSec = targetSec;
          this._videoclipRealTimeSec = targetSec;
          this._videoclipRealTimeWallMs = now;
          this._lastVideoclipSeekCommandMs = now;
          this._sendVideoclipYtCommand('seekTo', [Math.max(0, Number(targetSec.toFixed(2))), true]);
          this._sendVideoclipYtCommand('playVideo', []);
          return;
        }

        if (eventType === 'play') {
          this._lastVideoclipSyncMs = now;
          this._lastVideoclipSyncedAudioSec = targetSec;
          if (!this._videoclipTelemetryReady || !Number.isFinite(this._videoclipRealTimeSec) || Math.abs(targetSec - this._videoclipRealTimeSec) > 0.45) {
            this._sendVideoclipYtCommand('seekTo', [Math.max(0, Number(targetSec.toFixed(2))), true]);
            this._lastVideoclipSeekCommandMs = now;
          }
          this._sendVideoclipYtCommand('playVideo', []);
          return;
        }

        // En tick continuo (cada 200ms): usar la telemetría real reportada por el reproductor de YouTube
        if (this._videoclipRealState === 2 || this._videoclipRealState === 5 || this._videoclipRealState === -1) {
          this._sendVideoclipYtCommand('playVideo', []);
        }

        if (this._videoclipTelemetryReady && Number.isFinite(this._videoclipRealTimeSec) && this._videoclipRealState === 1) {
          const interpVideoSec = this._videoclipRealTimeSec + Math.min(0.35, Math.max(0, (now - (this._videoclipRealTimeWallMs || now)) / 1000));
          const realDrift = Math.abs(targetSec - interpVideoSec);
          if (realDrift > 0.45 && (now - (this._lastVideoclipSeekCommandMs || 0)) > 1100) {
            this._sendVideoclipYtCommand('seekTo', [Math.max(0, Number(targetSec.toFixed(2))), true]);
            this._sendVideoclipYtCommand('playVideo', []);
            this._videoclipRealTimeSec = targetSec;
            this._videoclipRealTimeWallMs = now;
            this._lastVideoclipSeekCommandMs = now;
            this._lastVideoclipSyncMs = now;
            this._lastVideoclipSyncedAudioSec = targetSec;
          }
        } else {
          if (!this._lastVideoclipSyncMs) {
            this._lastVideoclipSyncMs = now;
            this._lastVideoclipSyncedAudioSec = targetSec;
          } else {
            const wallElapsed = (now - this._lastVideoclipSyncMs) / 1000;
            const expectedVideoSec = (this._lastVideoclipSyncedAudioSec || 0) + wallElapsed;
            if (Math.abs(targetSec - expectedVideoSec) > 1.35 && (now - (this._lastVideoclipSeekCommandMs || 0)) > 1500) {
              this._lastVideoclipSyncMs = now;
              this._lastVideoclipSyncedAudioSec = targetSec;
              this._lastVideoclipSeekCommandMs = now;
              this._sendVideoclipYtCommand('seekTo', [Math.max(0, Math.floor(targetSec)), true]);
              this._sendVideoclipYtCommand('playVideo', []);
            }
          }
        }
      } catch (_) {}
    },

    async _mountNowPlayingVideoclipForTrack(track, forceYoutubeIframe = false) {
      const cont = document.getElementById('npVideoclipIframeBox');
      if (!cont || !track) return;
      const baseKey = this._getVideoclipTrackKey(track);
      const trackKey = `${baseKey}__${forceYoutubeIframe ? 'yt' : 'auto'}`;
      if (cont.getAttribute('data-vid-key') === trackKey && (cont.querySelector('video') || cont.querySelector('iframe'))) {
        this.syncActiveVideoclipPlayback(dualStreamEngine.isPlaying() ? 'play' : 'pause');
        return;
      }

      const mountReqId = (this._videoclipMountReqId = (this._videoclipMountReqId || 0) + 1);
      if (this._videoclipHandshakeTimer) {
        clearInterval(this._videoclipHandshakeTimer);
        this._videoclipHandshakeTimer = null;
      }
      this._videoclipTelemetryReady = false;
      this._videoclipRealState = -1;
      this._videoclipRealTimeSec = 0;
      this._videoclipForcedPaused = !dualStreamEngine.isPlaying();

      const cover = getBestTrackCover(track);
      cont.removeAttribute('data-vid-key');
      cont.innerHTML = `
        <div class="relative w-full h-full rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center">
          <img src="${cover}" onerror="this.onerror=null; this.src='./app_logo.png';" class="w-full h-full object-cover opacity-40 blur-[2px]" alt="">
          <div class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div class="text-xs font-bold text-amber-200">Sincronizando videoclip oficial...</div>
          </div>
        </div>
      `;

      const clipData = await this.resolveTrackVideoclipData(track);
      const currentActiveTrack = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (mountReqId !== this._videoclipMountReqId || (currentActiveTrack && this._getVideoclipTrackKey(currentActiveTrack) !== baseKey)) {
        return;
      }

      // Priorizar SIEMPRE el videoclip completo de YouTube (clipData.videoId) para que vaya 100% coordinado
      // desde 0:00 con la canción entera (los .m4v de iTunes son recortes de 30s de mitad de canción).
      if (clipData.videoId) {
        cont.setAttribute('data-vid-key', trackKey);
        const startSec = Math.max(0, Math.floor(dualStreamEngine.getCurrentSongTimeSec() || 0));
        this._lastVideoclipSyncMs = performance.now();
        this._lastVideoclipSyncedAudioSec = startSec;
        this._videoclipRealTimeSec = startSec;
        this._videoclipRealTimeWallMs = performance.now();
        const origin = encodeURIComponent(window.location.origin || 'https://renacer.onrender.com');
        cont.innerHTML = `
          <iframe
            id="npActiveYtVideoclipIframe"
            class="w-full h-full rounded-2xl pointer-events-auto"
            src="https://www.youtube.com/embed/${encodeURIComponent(clipData.videoId)}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&start=${startSec}&loop=1&playlist=${encodeURIComponent(clipData.videoId)}&origin=${origin}"
            title="Videoclip Oficial Sincronizado"
            frameborder="0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          ></iframe>
        `;
        const ifr = cont.querySelector('#npActiveYtVideoclipIframe');
        if (ifr) {
          const sendVideoclipListening = () => {
            if (mountReqId !== this._videoclipMountReqId) return;
            try {
              if (ifr.contentWindow) {
                ifr.contentWindow.postMessage(JSON.stringify({
                  event: 'listening',
                  id: 'npActiveYtVideoclipIframe',
                  channel: 'widget'
                }), '*');
              }
            } catch (_) {}
          };
          const resyncAfterLoad = () => {
            if (mountReqId !== this._videoclipMountReqId) return;
            sendVideoclipListening();
            const liveSec = Math.max(0, Number((dualStreamEngine.getCurrentSongTimeSec() || 0).toFixed(2)));
            this._lastVideoclipSyncMs = performance.now();
            this._lastVideoclipSyncedAudioSec = liveSec;
            this._sendVideoclipYtCommand('mute', []);
            this._sendVideoclipYtCommand('seekTo', [liveSec, true]);
            this._sendVideoclipYtCommand(dualStreamEngine.isPlaying() ? 'playVideo' : 'pauseVideo', []);
          };
          let hsCount = 0;
          this._videoclipHandshakeTimer = setInterval(() => {
            hsCount++;
            if (mountReqId !== this._videoclipMountReqId || hsCount > 18) {
              clearInterval(this._videoclipHandshakeTimer);
              this._videoclipHandshakeTimer = null;
              return;
            }
            sendVideoclipListening();
            if (!dualStreamEngine.isPlaying()) {
              this._sendVideoclipYtCommand('pauseVideo', []);
            }
          }, 260);

          ifr.addEventListener('load', () => {
            resyncAfterLoad();
            setTimeout(resyncAfterLoad, 320);
            setTimeout(resyncAfterLoad, 950);
          }, { once: true });
        }
        return;
      }

      if (clipData.videoStreamUrl) {
        cont.setAttribute('data-vid-key', trackKey);
        cont.innerHTML = `
          <div class="relative w-full h-full rounded-2xl overflow-hidden bg-black">
            <video
              id="npActiveVideoclipVideoEl"
              class="w-full h-full object-cover"
              src="${clipData.videoStreamUrl}"
              poster="${cover}"
              autoplay
              muted
              loop
              playsinline
            ></video>
          </div>
        `;
        const vidEl = cont.querySelector('#npActiveVideoclipVideoEl');
        if (vidEl) {
          vidEl.play().catch(() => {});
        }
        return;
      }

      cont.setAttribute('data-vid-key', trackKey);
      cont.innerHTML = `
        <div class="relative w-full h-full rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center">
          <img src="${cover}" onerror="this.onerror=null; this.src='./app_logo.png';" class="w-full h-full object-cover opacity-55 blur-[1px]" alt="">
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/70 flex flex-col items-center justify-center p-4 text-center">
            <img src="${cover}" onerror="this.onerror=null; this.src='./app_logo.png';" class="w-24 h-24 rounded-xl object-cover shadow-2xl border border-white/20 mb-2" alt="">
            <div class="text-xs font-extrabold text-white">${escapeHtmlSafe(track.title || '')}</div>
            <div class="text-[11px] text-amber-300/90 font-semibold">${escapeHtmlSafe(track.artist || '')}</div>
          </div>
        </div>
      `;
    },

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

        <!-- Carátula cuadrada grande centrada con videoclip opcional y disco de vinilo asomando -->
        <div class="crate-cover-vinyl-wrap" ${isTopCard ? `onclick="window.DiscoverHomeApp.togglePreviewCurrentCrateCard()"` : ''}>
          <div id="${vinylDiscId}" class="crate-peeking-vinyl ${isPlayingThis ? 'spinning' : ''}">
            <div class="crate-peeking-vinyl-grooves"></div>
            <div class="crate-peeking-vinyl-center"></div>
          </div>
          <div class="crate-square-cover-frame">
            <img id="${coverImgId}" src="${cover}" onload="if(this.naturalWidth>0 && this.naturalWidth<=120){ window.DiscoverHomeApp && window.DiscoverHomeApp.handleBrokenYtThumb(this, '${escapeHtmlSafe(track.title).replace(/'/g, "\\'")}', '${escapeHtmlSafe(track.artist).replace(/'/g, "\\'")}'); }" onerror="this.onerror=null; this.src='./app_logo.png';" alt="" class="crate-square-cover-img">
            ${isTopCard ? `
              <div id="crateMainVideoclipWrap" class="crate-videoclip-iframe-wrap ${this.crateVideoclipMode ? '' : 'hidden'}"></div>
              <button type="button" id="crateVideoclipToggleBtn" onclick="window.DiscoverHomeApp.toggleCrateVideoclipMode(event)" class="crate-videoclip-pill-btn ${this.crateVideoclipMode ? 'active' : ''}" title="Alternar Portada / Videoclip de YouTube">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                <span>Videoclip</span>
              </button>
              <button type="button" onclick="event.stopPropagation(); window.DiscoverHomeApp.openTrackOptionsSheetForCurrent();" class="crate-card-more-dots-btn" title="Más opciones de la canción">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </button>
            ` : ''}
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
          <button type="button" ${isTopCard ? `onclick="window.DiscoverHomeApp.openTrackOptionsSheetForCurrent()"` : ''} class="btn-swipe-circle add" title="Opciones, playlist, descargar o cola">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
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
      if (this.crateVideoclipMode) {
        this._mountCrateVideoclipForTrack(track);
      }
      this._attachCardSwipeGestures();
    },

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
        if (e.target.closest('button') || e.target.closest('iframe')) return;
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
      if (dualStreamEngine.currentTrack?.id === track.id &&
          dualStreamEngine.activeSourceType !== 'none' &&
          (dualStreamEngine.fullAudio.src || dualStreamEngine.previewAudio.src)) {
        dualStreamEngine.togglePlayPause();
      } else {
        dualStreamEngine.playTrack(track);
      }
    },

    // =========================================================================
    // GUARDADO GARANTIZADO EN FAVORITOS Y PLAYLISTS DESDE "PARA TI" Y OPCIONES
    // =========================================================================
    _normalizeTrackForVaultStorage(track) {
      if (!track) return null;
      const cover = getBestTrackCover(track);
      const id = String(track.id || `magic_yt_${track.videoId || Date.now()}`);
      const isTop = Boolean(track.is_top_song || id.startsWith('top_'));
      return {
        ...track,
        id,
        videoId: track.videoId || (/^[a-zA-Z0-9_-]{11}$/.test(id.replace(/^magic_yt_/, '')) ? id.replace(/^magic_yt_/, '') : ''),
        title: track.title || 'Canción',
        artist: track.artist || 'Artista',
        thumbnail: cover,
        cover_url: cover,
        artworkUrl600: cover,
        previewUrl: track.previewUrl || track.preview_url || '',
        preview_url: track.preview_url || track.previewUrl || '',
        is_top_song: isTop,
        source: track.source || (isTop ? 'top_catalog' : 'magic_youtube'),
        source_name: track.source_name || (isTop ? 'Hit Oficial' : 'Auto-Piano IA'),
        _isMagicKey: Boolean(track._isMagicKey || !isTop),
        difficulties: Array.isArray(track.difficulties) && track.difficulties.length > 0
          ? track.difficulties
          : ['Fácil', 'Media', 'Difícil', 'Extrema'],
        addedAt: Date.now()
      };
    },

    async saveTrackToFavoritesNormalized(track, showToast = true) {
      const norm = this._normalizeTrackForVaultStorage(track);
      if (!norm) return false;
      dnaEngine.recordLike(norm);

      if (typeof window.favoriteIdsSet !== 'undefined') {
        window.favoriteIdsSet.add(norm.id);
      }
      if (Array.isArray(window.searchResultsCache) && !window.searchResultsCache.some(s => s && String(s.id) === norm.id)) {
        window.searchResultsCache.unshift(norm);
      }

      if (typeof window.IndexedDBStorage !== 'undefined') {
        try {
          if (typeof window.IndexedDBStorage.putFavoriteRecord === 'function') {
            await window.IndexedDBStorage.putFavoriteRecord(norm);
          } else if (typeof window.IndexedDBStorage.saveFavorite === 'function') {
            await window.IndexedDBStorage.saveFavorite(norm);
          }
        } catch (err) {
          console.warn('Error guardando favorito en IndexedDB:', err);
        }
      }

      if (typeof window.updateLibraryVaultBadges === 'function') {
        window.updateLibraryVaultBadges();
      }
      if (window.currentActiveTab === 'library' && typeof window.renderFavoritesSubtab === 'function') {
        window.renderFavoritesSubtab();
      }
      if (typeof window.scheduleCloudProfileSync === 'function') {
        window.scheduleCloudProfileSync();
      }
      if (showToast && typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(`Guardada en Tus Me Gusta: ${norm.title}`);
      }
      return true;
    },

    async saveTrackToPlaylistNormalized(track, playlistId, showToast = true) {
      const norm = this._normalizeTrackForVaultStorage(track);
      if (!norm || !playlistId) return false;
      dnaEngine.recordLike(norm);

      if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getPlaylist === 'function') {
        try {
          const freshPl = await window.IndexedDBStorage.getPlaylist(playlistId).catch(() => null) ||
            (this.targetPlaylistObj && String(this.targetPlaylistObj.id) === String(playlistId) ? this.targetPlaylistObj : null);
          if (!freshPl) return false;
          if (!Array.isArray(freshPl.tracks)) freshPl.tracks = [];
          const alreadyIn = this.isTrackAlreadyInList(norm, freshPl.tracks);
          if (!alreadyIn) {
            freshPl.tracks.push({
              id: norm.id,
              videoId: norm.videoId || '',
              title: norm.title,
              artist: norm.artist,
              thumbnail: norm.thumbnail,
              cover_url: norm.cover_url,
              previewUrl: norm.previewUrl || '',
              source: norm.source,
              _isMagicKey: norm._isMagicKey,
              is_top_song: norm.is_top_song,
              addedAt: Date.now()
            });
            freshPl.item_count = freshPl.tracks.length;
            if (typeof window.IndexedDBStorage.putPlaylist === 'function') {
              await window.IndexedDBStorage.putPlaylist(freshPl);
            } else if (typeof window.IndexedDBStorage.savePlaylist === 'function') {
              await window.IndexedDBStorage.savePlaylist(freshPl);
            }
          }
          if (this.targetPlaylistObj && String(this.targetPlaylistObj.id) === String(playlistId)) {
            this.targetPlaylistObj = freshPl;
          }
          if (typeof window.updateLibraryVaultBadges === 'function') {
            window.updateLibraryVaultBadges();
          }
          if (window.currentActiveTab === 'library' && typeof window.renderPlaylistsSubtab === 'function') {
            window.renderPlaylistsSubtab();
          }
          if (typeof window.scheduleCloudProfileSync === 'function') {
            window.scheduleCloudProfileSync();
          }
          if (showToast && typeof window.showSuccessToast === 'function') {
            window.showSuccessToast(alreadyIn ? `Ya estaba en "${freshPl.title}"` : `Añadida a "${freshPl.title}": ${norm.title}`);
          }
          return true;
        } catch (err) {
          console.warn('Error guardando canción en playlist:', err);
        }
      }
      return false;
    },

    async swipeRightLike() {
      const track = this.getActiveCrateTrack();
      if (!track) return;

      const cover = getBestTrackCover(track);
      triggerGoldenVinylFlyAnimation(cover);

      if (this.targetPlaylistObj && this.targetPlaylistObj.id) {
        this.saveTrackToPlaylistNormalized(track, this.targetPlaylistObj.id, true);
      } else {
        this.saveTrackToFavoritesNormalized(track, true);
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
        this._renderUserPlaylistsCarousel();
      }, 140);
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
      }, 140);
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

    async launchPianoGameForTrack(track, explicitDifficulty = null) {
      if (!track) return;
      // CRÍTICO: Desbloquear el motor de audio del juego dentro del gesto táctil directo del usuario
      if (window.engine && window.engine.sync && typeof window.engine.sync.unlockAudio === 'function') {
        window.engine.sync.unlockAudio();
      }
      dualStreamEngine.pauseForGameplayWithFade(160);

      if (dualStreamEngine.currentTrack?.id === track.id && dualStreamEngine.fullTrackBlob) {
        dualStreamEngine._storeFullBlobInGlobalCache(track, dualStreamEngine.fullTrackBlob);
      }

      const vid = dualStreamEngine._extractTrackYoutubeId(track);
      if (vid) {
        dualStreamEngine.prepareYtBridgeForGameplay(vid);
      }

      const id = String(track.id || (vid ? `magic_yt_${vid}` : `track_${Date.now()}`));
      track.id = id;
      if (!window._selectedMagicAudioCandidate) window._selectedMagicAudioCandidate = {};
      window._selectedMagicAudioCandidate[id] = track;

      if (track.is_top_song || id.startsWith('top_')) {
        if (typeof window.playTopSong === 'function') {
          window.playTopSong(id, explicitDifficulty || 'Normal', track);
          return;
        }
      }
      if (id.startsWith('comm_') && typeof window.playCommunitySong === 'function') {
        window.playCommunitySong(id, false, explicitDifficulty || 'Media');
        return;
      }
      if (typeof window.autoExtractAndPlaySong === 'function') {
        const thumb = getBestTrackCover(track);
        // Pre-iniciar la extracción en segundo plano MIENTRAS el usuario elige modo de juego (ahorra 100% de espera)
        let preExtractPromise = null;
        if (typeof window.buildAndSaveAutoExtractedSong === 'function') {
          preExtractPromise = window.buildAndSaveAutoExtractedSong(
            track.title,
            track.artist || '',
            thumb,
            explicitDifficulty || 'hard',
            id,
            null
          ).catch(() => null);
          window._inflightPianoPreExtract = { id, promise: preExtractPromise };
        }

        if (!window._modeAlreadyChosenForThisLaunch && typeof window.openGameModeSelectModal === 'function') {
          const chosenMode = await window.openGameModeSelectModal(track.title || 'PISTA', track.artist || '', true);
          if (!chosenMode) return;
          if (typeof window.applySelectedGameMode === 'function') {
            window.applySelectedGameMode(chosenMode);
          }
          window._modeAlreadyChosenForThisLaunch = true;
        }
        const chosenDensity = explicitDifficulty || window._selectedModalDifficulty || 'hard';
        window.autoExtractAndPlaySong(track.title, track.artist || '', thumb, chosenDensity, id, false);
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

    // =========================================================================
    // DESPLEGABLE DE OPCIONES ESTILO SPOTIFY (#spotifyTrackOptionsSheet)
    // =========================================================================
    openTrackOptionsSheetForCurrent() {
      const tr = this.getActiveCrateTrack() || dualStreamEngine.currentTrack;
      if (tr) this.openTrackOptionsSheet(tr, { source: 'crate' });
    },

    openTrackOptionsSheetForPlayer() {
      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (tr) this.openTrackOptionsSheet(tr, { source: 'player' });
    },

    openTrackOptionsSheetFromOpenedPlaylist(dispIdx, e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      const list = Array.isArray(this._displayedSheetTracks) ? this._displayedSheetTracks : this._openedSheetTracks;
      const tr = list?.[dispIdx];
      if (!tr) return;
      this.openTrackOptionsSheet(tr, {
        source: 'playlist_sheet',
        playlistId: this._openedSheetPlaylistId,
        playlistTitle: this._openedSheetTitle,
        origIdx: typeof tr._sheetOrigIdx === 'number' ? tr._sheetOrigIdx : dispIdx
      });
    },

    openCurrentOpenedSheetMenu(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      const first = (this._openedSheetTracks && this._openedSheetTracks[0]) || this.getActiveCrateTrack();
      this.openTrackOptionsSheet(first || {
        id: 'playlist_header',
        title: this._openedSheetTitle || 'Playlist',
        artist: `${(this._openedSheetTracks || []).length} canciones`
      }, {
        source: 'playlist_header',
        playlistId: this._openedSheetPlaylistId,
        playlistTitle: this._openedSheetTitle
      });
    },

    openTrackOptionsSheet(track, context = {}) {
      if (!track) return;
      const norm = this._normalizeTrackForVaultStorage(track);
      this._activeOptionsTrack = norm;
      this._activeOptionsContext = context || {};

      const modal = document.getElementById('spotifyTrackOptionsSheet');
      const coverEl = document.getElementById('spOptSheetCover');
      const titleEl = document.getElementById('spOptSheetTitle');
      const artistEl = document.getElementById('spOptSheetArtist');
      const listEl = document.getElementById('spOptSheetActionsList');
      if (!modal || !listEl) return;

      if (coverEl) coverEl.src = getBestTrackCover(norm);
      if (titleEl) titleEl.textContent = norm.title || 'Canción';
      if (artistEl) artistEl.textContent = norm.artist || 'Artista';

      const isFav = (typeof window.favoriteIdsSet !== 'undefined' && window.favoriteIdsSet.has(norm.id)) ||
                    dnaEngine.likes.has(String(norm.id));
      const isSongDownloaded = typeof window.isTrackDownloadedOffline === 'function' && window.isTrackDownloadedOffline(norm);
      const plId = context?.playlistId || null;
      const collectionTracksForCheck = Array.isArray(context?.collectionTracks)
        ? context.collectionTracks
        : (Array.isArray(window.currentOpenedPlaylistTracks) && window.currentOpenedPlaylistTracks.length > 0 && context?.source?.startsWith('playlist')
            ? window.currentOpenedPlaylistTracks
            : (Array.isArray(this._openedSheetTracks) && this._openedSheetTracks.length > 0 ? this._openedSheetTracks : []));
      const hasBulkDownload = Boolean(plId || (collectionTracksForCheck.length > 0 && context?.source?.startsWith('playlist')) || context?.collectionTracks);
      const isCollectionDownloaded = hasBulkDownload && typeof window.isCollectionFullyDownloadedOffline === 'function' && window.isCollectionFullyDownloadedOffline(collectionTracksForCheck);
      const bulkLabel = isCollectionDownloaded
        ? (plId === '__favorites__' ? 'Descargado · Todos Tus Me Gusta están en Descargas' : 'Descargado · Toda la lista está en Descargas')
        : (plId === '__favorites__'
            ? 'Descargar todos Tus Me Gusta (Offline)'
            : (context?.playlistTitle ? `Descargar toda la lista "${context.playlistTitle}"` : 'Descargar toda la lista (Offline)'));

      const canRemoveFromThisList = Boolean(plId && typeof context?.origIdx === 'number');

      listEl.innerHTML = `
        <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('play_piano')">
          <span class="sp-opt-icon gold">${SVG_ICONS.piano}</span>
          <span class="sp-opt-label font-extrabold text-[#f3e5ab]">Jugar canción al Piano</span>
        </button>

        <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('share')">
          <span class="sp-opt-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </span>
          <span class="sp-opt-label">Compartir</span>
        </button>

        <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('karaoke_es')">
          <span class="sp-opt-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="15" x2="11" y2="15"/><line x1="13" y1="15" x2="17" y2="15"/><line x1="7" y1="11" x2="17" y2="11"/></svg>
          </span>
          <span class="sp-opt-label">Letra · Español (Karaoke Sincronizado)</span>
        </button>

        <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('videoclip')">
          <span class="sp-opt-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </span>
          <span class="sp-opt-label">Ver videoclip oficial (YouTube)</span>
        </button>

        <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('toggle_fav')">
          <span class="sp-opt-icon ${isFav ? 'liked-heart-box' : ''}">
            ${isFav ? SVG_ICONS.heartFilled : SVG_ICONS.heartOutline}
          </span>
          <span class="sp-opt-label">${isFav ? 'Guardada en Canciones que te gustan' : 'Añadir a Canciones que te gustan'}</span>
        </button>

        <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('add_to_playlist')">
          <span class="sp-opt-icon">${SVG_ICONS.plus}</span>
          <span class="sp-opt-label">Añadir a lista</span>
        </button>

        <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('download_song')">
          <span class="sp-opt-icon ${isSongDownloaded ? 'gold' : ''}">
            ${isSongDownloaded
              ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
              : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`}
          </span>
          <span class="sp-opt-label ${isSongDownloaded ? 'text-emerald-300 font-bold' : ''}">${isSongDownloaded ? 'Canción ya descargada (En tu Biblioteca)' : 'Descargar canción (Guardar en Descargas)'}</span>
        </button>

        ${hasBulkDownload ? `
          <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('download_collection')">
            <span class="sp-opt-icon gold">
              ${isCollectionDownloaded
                ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
                : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>`}
            </span>
            <span class="sp-opt-label ${isCollectionDownloaded ? 'text-emerald-300 font-bold' : ''}">${escapeHtmlSafe(bulkLabel)}</span>
          </button>
        ` : ''}

        ${canRemoveFromThisList ? `
          <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('remove_from_this_list')">
            <span class="sp-opt-icon">${SVG_ICONS.close}</span>
            <span class="sp-opt-label">Quitar de esta lista</span>
          </button>
        ` : ''}

        <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('add_to_queue')">
          <span class="sp-opt-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </span>
          <span class="sp-opt-label">Añadir a la cola</span>
        </button>

        <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('go_to_queue')">
          <span class="sp-opt-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/></svg>
          </span>
          <span class="sp-opt-label">Ir a la cola</span>
        </button>

        <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('start_radio')">
          <span class="sp-opt-icon">${SVG_ICONS.radio}</span>
          <span class="sp-opt-label">Iniciar Radio de la canción</span>
        </button>

        <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('exclude_taste')">
          <span class="sp-opt-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </span>
          <span class="sp-opt-label">Excluir canción de tu perfil de gustos</span>
        </button>
      `;

      modal.classList.remove('hidden');
      modal.classList.add('open');
      modal.style.display = 'flex';
    },

    closeTrackOptionsSheet() {
      const modal = document.getElementById('spotifyTrackOptionsSheet');
      if (modal) {
        modal.classList.remove('open');
        modal.classList.add('hidden');
        modal.style.display = 'none';
      }
    },

    async handleTrackOptionAction(action) {
      const tr = this._activeOptionsTrack;
      const ctx = this._activeOptionsContext || {};
      this.closeTrackOptionsSheet();
      if (!tr) return;

      if (action === 'play_piano') {
        this.closePlaylistTracksModal();
        this.launchPianoGameForTrack(tr);
      } else if (action === 'share') {
        const shareText = `${tr.title} - ${tr.artist}`;
        if (navigator.share) {
          navigator.share({ title: tr.title, text: `Escucha y toca "${shareText}" en Piano`, url: window.location.href }).catch(() => {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(shareText).catch(() => {});
          if (typeof window.showSuccessToast === 'function') window.showSuccessToast(`Copiado: ${shareText}`);
        }
      } else if (action === 'karaoke_es') {
        if (!dualStreamEngine.currentTrack || dualStreamEngine.currentTrack.id !== tr.id) {
          dualStreamEngine.playTrack(tr);
        }
        karaokeService.translationEnabled = true;
        karaokeService._syncTranslateBtnUI();
        this.openNowPlayingModal('karaoke');
      } else if (action === 'videoclip') {
        if (!dualStreamEngine.currentTrack || dualStreamEngine.currentTrack.id !== tr.id) {
          dualStreamEngine.playTrack(tr);
        }
        this.openNowPlayingModal('videoclip');
      } else if (action === 'toggle_fav') {
        const isAlreadyFav = (typeof window.favoriteIdsSet !== 'undefined' && window.favoriteIdsSet.has(tr.id)) ||
                             dnaEngine.likes.has(String(tr.id));
        if (isAlreadyFav) {
          dnaEngine.likes.delete(String(tr.id));
          dnaEngine.saveToStorage(true);
          if (typeof window.favoriteIdsSet !== 'undefined') window.favoriteIdsSet.delete(tr.id);
          if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.deleteFavorite === 'function') {
            await window.IndexedDBStorage.deleteFavorite(tr.id).catch(() => {});
          }
          if (typeof window.updateLibraryVaultBadges === 'function') window.updateLibraryVaultBadges();
          if (typeof window.renderFavoritesSubtab === 'function') window.renderFavoritesSubtab();
          if (typeof window.showSuccessToast === 'function') window.showSuccessToast(`Quitada de Tus Me Gusta: ${tr.title}`);
        } else {
          await this.saveTrackToFavoritesNormalized(tr, true);
        }
        this.renderCrateDigger();
        this.refreshCarousels();
      } else if (action === 'add_to_playlist') {
        this.openPlaylistOrQueueForTrack(tr);
      } else if (action === 'download_song') {
        if (typeof window.downloadSongToOfflineLibrary === 'function') {
          await window.downloadSongToOfflineLibrary(tr);
        }
      } else if (action === 'download_collection') {
        if (typeof window.downloadPlaylistOrFavoritesOffline === 'function') {
          const tracksToDownload = Array.isArray(ctx.collectionTracks)
            ? ctx.collectionTracks
            : (Array.isArray(this._openedSheetTracks) && this._openedSheetTracks.length > 0 ? this._openedSheetTracks : [tr]);
          await window.downloadPlaylistOrFavoritesOffline(tracksToDownload, ctx.playlistTitle || this._openedSheetTitle || 'Colección');
        }
      } else if (action === 'remove_from_this_list') {
        if (typeof ctx.origIdx === 'number') {
          await this.removeTrackFromOpenedSheet(ctx.origIdx);
        }
      } else if (action === 'add_to_queue') {
        dualStreamEngine.enqueueTrack(tr, false);
        if (typeof window.showSuccessToast === 'function') {
          window.showSuccessToast(`Añadida a la cola: ${tr.title}`);
        }
      } else if (action === 'go_to_queue') {
        this.openNowPlayingModal('vinyl');
        const drawer = document.getElementById('npQueueDrawerSection');
        if (drawer && drawer.classList.contains('hidden')) {
          this.toggleQueueDrawerInModal();
        }
      } else if (action === 'start_radio') {
        this.startRadioFromTrack(tr);
      } else if (action === 'exclude_taste') {
        dnaEngine.recordPass(tr);
        dnaEngine.putTrackOnCooldown(tr);
        dnaEngine.saveToStorage(true);
        if (typeof window.showSuccessToast === 'function') {
          window.showSuccessToast(`Excluida de tus recomendaciones por 90 días: ${tr.title}`);
        }
        if (this.getActiveCrateTrack()?.id === tr.id) {
          this._advanceToNextCard(true);
        }
        this.refreshCarousels();
      }
    },

    async openPlaylistOrQueueForTrack(track) {
      if (!track) return;
      const norm = this._normalizeTrackForVaultStorage(track);
      window._pendingCrateTrackForPlaylist = norm;
      if (typeof window.openAddToPlaylistModal === 'function') {
        if (Array.isArray(window.searchResultsCache) && !window.searchResultsCache.some(s => s && String(s.id) === String(norm.id))) {
          window.searchResultsCache.unshift(norm);
        }
        await window.openAddToPlaylistModal(norm.id);
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
            dualStreamEngine.enqueueTrack(norm, false);
            if (typeof window.closeAddToPlaylistModal === 'function') window.closeAddToPlaylistModal();
            if (typeof window.showSuccessToast === 'function') {
              window.showSuccessToast(`Añadida a la cola: ${norm.title}`);
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
      this._renderDailyMixCarousel();
      this._renderBecauseYouLikedCarousel();
      this._renderWeeklyDiscoveryCarousel();
      this._renderPianoVirtuosoCarousel();
      this._renderHighEnergyCarousel();
      this._renderHiddenGemsCarousel();
      await this._renderUserPlaylistsCarousel();
    },

    _renderDailyMixCarousel() {
      const cont = document.getElementById('carouselDailyMix');
      if (!cont) return;
      const pool = this.getAllCandidatePool();
      const targetVec = dnaEngine.getEffectiveTargetVector();
      const dailyList = pool
        .filter(t => !dnaEngine.isTrackOnCooldown(t))
        .map(t => ({
          t,
          sc: dnaEngine.scoreTrackForRecommendation(t, targetVec) + (hasRealHttpCover(t) ? 0.22 : 0)
        }))
        .sort((a, b) => b.sc - a.sc)
        .slice(0, 14)
        .map(x => x.t);

      this._dailyMixList = dailyList.length > 0 ? dailyList : pool.slice(0, 12);
      cont.innerHTML = this._dailyMixList.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, 'dailymix')).join('');
      this._enrichCarouselCoversAsync(this._dailyMixList, 'dailymix');
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
      list.slice(0, 6).forEach((tr, idx) => {
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

      let favsFromDb = [];
      if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getAllFavorites === 'function') {
        favsFromDb = await window.IndexedDBStorage.getAllFavorites().catch(() => []) || [];
      }
      const favCount = Math.max(dnaEngine.likes.size, favsFromDb.length, (typeof window.favoriteIdsSet !== 'undefined' ? window.favoriteIdsSet.size : 0));
      const cardsHtml = [];

      cardsHtml.push(`
        <div class="spotify-carousel-card" onclick="window.DiscoverHomeApp.openLikedSongsSheetModal()">
          <div class="spotify-carousel-cover-wrap liked-gradient-cover">
            <div class="liked-cover-heart-icon">${SVG_ICONS.heartFilled}</div>
            <button type="button" onclick="event.stopPropagation(); window.DiscoverHomeApp.openLikedSongsSheetModal();" class="spotify-floating-piano-btn" title="Ver canciones de Tus Me Gusta">
              ${SVG_ICONS.pianoSmall}
            </button>
          </div>
          <h4 class="spotify-carousel-title">Tus Me Gusta</h4>
          <p class="spotify-carousel-artist">${favCount} canciones · Teclas de piano</p>
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
        const plTracks = Array.isArray(pl.tracks) ? pl.tracks : [];
        const centroid = dnaEngine.computePlaylistCentroidVector(plTracks, pl.title || '');

        const recs = pool
          .filter(t => !this.isTrackAlreadyInList(t, plTracks) && !dnaEngine.isTrackOnCooldown(t))
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
                <p class="text-[11px] text-gray-400 truncate">Basadas en las ${plTracks.length} canciones de tu playlist</p>
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
      if (idx < 4) dualStreamEngine.warmTracks([tr]);
      const cover = getBestTrackCover(tr);
      const safeTitleAttr = escapeHtmlSafe(tr.title).replace(/'/g, "\\'");
      const safeArtistAttr = escapeHtmlSafe(tr.artist).replace(/'/g, "\\'");
      return `
        <div class="spotify-carousel-card" onclick="window.DiscoverHomeApp.playFromCarousel('${listType}', ${idx})">
          <div class="spotify-carousel-cover-wrap">
            <img id="carouselCover_${listType}_${idx}" src="${cover}" onload="if(this.naturalWidth>0 && this.naturalWidth<=120){ window.DiscoverHomeApp && window.DiscoverHomeApp.handleBrokenYtThumb(this, '${safeTitleAttr}', '${safeArtistAttr}'); }" onerror="this.onerror=null; this.src='./app_logo.png';" class="spotify-carousel-cover-img" alt="" loading="lazy">
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
      if (listType === 'dailymix') return this._dailyMixList;
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
    // CUADRÍCULA LIMPIA DE TOPS 100 OFICIALES EN VIVO (SIN TEXTO DUPLICADO)
    // =========================================================================
    _liveChartsCatalogCache: null,

    async renderLiveTopPlaylistsGrid() {
      const grid = document.getElementById('discoverSearchResultsGrid');
      if (!grid) return;
      grid.className = 'spotify-top-charts-grid';

      const defaultCharts = [
        { id: 'top_100_es', title: 'Top 50 España', gradient: 'linear-gradient(135deg, #b91c1c 0%, #d97706 55%, #111827 100%)' },
        { id: 'top_100_global', title: 'Top 50 Global', gradient: 'linear-gradient(135deg, #047857 0%, #0ea5e9 55%, #0f172a 100%)' },
        { id: 'top_pop_hits', title: 'Éxitos Pop Hoy', gradient: 'linear-gradient(135deg, #be185d 0%, #8b5cf6 55%, #0f172a 100%)' },
        { id: 'top_latin_urban', title: 'Urbano & Latino', gradient: 'linear-gradient(135deg, #ea580c 0%, #eab308 55%, #111827 100%)' },
        { id: 'top_rock_alt', title: 'Rock & Alternativo', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #374151 55%, #090a0f 100%)' },
        { id: 'top_dance_electronic', title: 'Dance & Club', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 55%, #090a0f 100%)' },
        { id: 'top_hiphop_rnb', title: 'Hip-Hop & R&B', gradient: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 55%, #090a0f 100%)' },
        { id: 'top_classical_piano', title: 'Piano & Clásica', gradient: 'linear-gradient(135deg, #92400e 0%, #d4af37 55%, #090a0f 100%)' }
      ];

      const renderCards = (chartsList) => {
        grid.className = 'spotify-top-charts-grid';
        grid.innerHTML = chartsList.map(ch => {
          const safeId = String(ch.id || '').replace(/'/g, "\\'");
          const safeTitle = String(ch.title || 'Top Oficial').replace(/'/g, "\\'");
          const coverImg = ch.coverUrl
            ? `<img src="${escapeHtmlSafe(ch.coverUrl)}" onerror="this.style.display='none'" class="spotify-chart-card-bg-img" alt="" loading="lazy">`
            : '';
          return `
            <div onclick="window.DiscoverHomeApp.openLiveChartPlaylist('${safeId}', '${safeTitle}')" class="spotify-chart-card" style="background: ${ch.gradient || 'linear-gradient(135deg, #1f2937, #090a0f)'};">
              ${coverImg}
              <div class="spotify-chart-card-top" style="justify-content:flex-end;">
                <div class="spotify-chart-play-circle">
                  ${SVG_ICONS.play}
                </div>
              </div>
              <div class="spotify-chart-card-bottom">
                <h4 class="spotify-chart-title">${escapeHtmlSafe(ch.title)}</h4>
              </div>
            </div>
          `;
        }).join('');
      };

      if (this._liveChartsCatalogCache && this._liveChartsCatalogCache.length > 0) {
        renderCards(this._liveChartsCatalogCache);
        return;
      }

      renderCards(defaultCharts);

      try {
        const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
        const resp = await fetch(`${baseUrl}/api/v1/charts/top-playlists`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data?.playlists) && data.playlists.length > 0) {
            this._liveChartsCatalogCache = data.playlists;
            const input = document.getElementById('discoverPlaylistSearchInput');
            if (!input || !input.value.trim()) {
              renderCards(data.playlists);
            }
          }
        }
      } catch (_) {}
    },

    async openLiveChartPlaylist(chartId, chartTitle = 'Top 50') {
      const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(`Cargando ${chartTitle} en directo...`);
      }

      let tracks = [];
      let resolvedTitle = chartTitle;

      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 4500);
        const resp = await fetch(`${baseUrl}/api/v1/charts/top-playlist-tracks?id=${encodeURIComponent(chartId)}`, {
          signal: ctrl.signal
        });
        clearTimeout(tid);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data?.tracks) && data.tracks.length > 0) {
            tracks = data.tracks;
            if (data.title) resolvedTitle = data.title;
          }
        }
      } catch (_) {}

      // Fallback directo en cliente (0 bytes de Render) vía Apple Music RSS / iTunes Search cuando el backend no responde
      if (tracks.length === 0) {
        try {
          const country = chartId.includes('es') ? 'es' : 'us';
          const rssUrl = `https://itunes.apple.com/${country}/rss/topsongs/limit=50/json`;
          const r = await fetch(rssUrl);
          if (r.ok) {
            const d = await r.json();
            const entries = d?.feed?.entry || [];
            tracks = entries.map((e, i) => {
              const title = e?.['im:name']?.label || 'Canción';
              const artist = e?.['im:artist']?.label || 'Artista';
              const imgs = e?.['im:image'] || [];
              const rawImg = imgs[imgs.length - 1]?.label || '';
              const cover = rawImg ? rawImg.replace(/\d+x\d+bb/g, '600x600bb') : './app_logo.png';
              return {
                id: `itunes_chart_${chartId}_${i}`,
                title,
                artist,
                thumbnail: cover,
                cover_url: cover,
                artworkUrl600: cover,
                durationSec: 195,
                source: 'live_chart'
              };
            });
          }
        } catch (_) {}
      }

      if (tracks.length === 0) {
        const pool = this.getAllCandidatePool();
        tracks = pool.slice(0, 50);
      }

      const previewPlObj = {
        id: `live_chart_${chartId}`,
        title: resolvedTitle,
        item_count: tracks.length,
        tracks: tracks.map((t, i) => ({
          ...t,
          id: t.id || t.videoId || `chart_${chartId}_${i}`,
          videoId: t.videoId || (/^[a-zA-Z0-9_-]{11}$/.test(String(t.id || '').replace(/^magic_yt_|^yt_/, '')) ? String(t.id || '').replace(/^magic_yt_|^yt_/, '') : ''),
          thumbnail: t.thumbnail || t.cover_url || t.artworkUrl600 || './app_logo.png'
        })),
        source: 'live_chart',
        createdAt: Date.now(),
        _isUnsavedPreview: true
      };

      if (typeof window.openPlaylistDetailView === 'function') {
        await window.openPlaylistDetailView(previewPlObj.id, previewPlObj);
        return;
      }

      this._openTracksSheetModal({
        title: resolvedTitle,
        subtitle: `${tracks.length} canciones`,
        tracks,
        playlistId: null,
        kicker: 'RANKING OFICIAL'
      });
    },

    // =========================================================================
    // MODAL DE PLAYLIST Y FAVORITOS CON TECLAS DE PIANO REALES (.piano-key-row)
    // =========================================================================
    _sheetFilterQuery: '',
    _sheetSortMode: 'custom',
    _sheetEditMode: false,

    async openLikedSongsSheetModal() {
      if (typeof window.switchMainTab === 'function' && typeof window.switchLibrarySubtab === 'function') {
        window.switchMainTab('library');
        window.switchLibrarySubtab('favorites');
        return;
      }
      const pool = this.getAllCandidatePool();
      let favTracks = pool.filter(t => dnaEngine.likes.has(String(t.id)) || (typeof window.favoriteIdsSet !== 'undefined' && window.favoriteIdsSet.has(t.id)));
      if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getAllFavorites === 'function') {
        const dbFavs = await window.IndexedDBStorage.getAllFavorites().catch(() => []) || [];
        for (const f of dbFavs) {
          if (f && f.title && !this.isTrackAlreadyInList(f, favTracks)) {
            favTracks.unshift(f);
          }
        }
      }
      this._openTracksSheetModal({
        title: 'Tus Me Gusta',
        subtitle: `${favTracks.length} canciones`,
        tracks: favTracks,
        playlistId: '__favorites__',
        kicker: 'FAVORITOS'
      });
    },

    async openUserPlaylistTracksModal(playlistId) {
      return this.openUserPlaylistSheetModal(playlistId);
    },

    async openUserPlaylistSheetModal(playlistId) {
      if (typeof window.openPlaylistDetailView === 'function') {
        await window.openPlaylistDetailView(playlistId);
        return;
      }
      if (typeof window.IndexedDBStorage === 'undefined' || typeof window.IndexedDBStorage.getPlaylist !== 'function') return;
      const pl = await window.IndexedDBStorage.getPlaylist(playlistId).catch(() => null);
      if (!pl) return;
      const mapped = (pl.tracks || []).map((t, i) => ({
        ...t,
        id: t.id || `pl_tr_${Date.now()}_${i}`,
        videoId: /^[a-zA-Z0-9_-]{11}$/.test(String(t.id || '').replace(/^magic_yt_/, '')) ? String(t.id || '').replace(/^magic_yt_/, '') : (t.videoId || ''),
        thumbnail: t.thumbnail || t.cover_url || './app_logo.png'
      }));
      this._openTracksSheetModal({
        title: pl.title || 'Playlist',
        subtitle: `${mapped.length} canciones`,
        tracks: mapped,
        playlistId: pl.id,
        kicker: 'PLAYLIST'
      });
    },

    _openTracksSheetModal({ title, subtitle, tracks, playlistId, kicker = 'PLAYLIST' }) {
      this._openedSheetTracks = Array.isArray(tracks) ? tracks.map((t, i) => ({ ...t, _sheetOrigIdx: i })) : [];
      this._openedSheetTitle = title || 'Playlist';
      this._openedSheetPlaylistId = playlistId || null;
      this._sheetFilterQuery = '';
      this._sheetSortMode = 'custom';
      this._sheetEditMode = false;

      const modal = document.getElementById('spotifyPlaylistSheetModal');
      const titleEl = document.getElementById('plSheetTitle');
      const subEl = document.getElementById('plSheetSubtitle');
      const kickerEl = document.getElementById('plSheetTypeKicker');
      const coverEl = document.getElementById('plSheetCoverImg');
      const discoverBtn = document.getElementById('plSheetDiscoverBtn');
      const editBtn = document.getElementById('plSheetEditBtn');
      const editBtnLabel = document.getElementById('plSheetEditBtnLabel');
      const renameBtn = document.getElementById('plSheetRenameBtn');
      const deletePlBtn = document.getElementById('plSheetDeletePlBtn');
      const searchInp = document.getElementById('plSheetSearchInput');
      const sortSel = document.getElementById('plSheetSortSelect');
      if (!modal) return;

      const isUserPlaylist = Boolean(playlistId && playlistId !== '__favorites__');
      const isEditable = Boolean(playlistId);

      if (titleEl) titleEl.textContent = this._openedSheetTitle;
      if (subEl) subEl.textContent = subtitle || `${this._openedSheetTracks.length} canciones`;
      if (kickerEl) kickerEl.textContent = kicker;
      if (coverEl) {
        coverEl.src = this._openedSheetTracks[0] ? getBestTrackCover(this._openedSheetTracks[0]) : './app_logo.png';
      }
      if (searchInp) searchInp.value = '';
      if (sortSel) sortSel.value = 'custom';
      if (discoverBtn) discoverBtn.classList.toggle('hidden', !isUserPlaylist);
      if (editBtn) {
        editBtn.classList.toggle('hidden', !isEditable);
        editBtn.classList.remove('active-edit');
      }
      if (editBtnLabel) editBtnLabel.textContent = 'Editar';
      if (renameBtn) renameBtn.classList.toggle('hidden', !isUserPlaylist);
      if (deletePlBtn) deletePlBtn.classList.toggle('hidden', !isUserPlaylist);

      this.renderOpenedSheetTracksList();
      modal.classList.add('open');
    },

    onPlaylistSheetFilterInput(val) {
      this._sheetFilterQuery = String(val || '').trim();
      this.renderOpenedSheetTracksList();
    },

    onPlaylistSheetSortChange(sortMode) {
      this._sheetSortMode = sortMode || 'custom';
      this.renderOpenedSheetTracksList();
    },

    togglePlaylistSheetEditMode() {
      this._sheetEditMode = !this._sheetEditMode;
      const editBtn = document.getElementById('plSheetEditBtn');
      const editBtnLabel = document.getElementById('plSheetEditBtnLabel');
      if (editBtn) editBtn.classList.toggle('active-edit', this._sheetEditMode);
      if (editBtnLabel) editBtnLabel.textContent = this._sheetEditMode ? 'Listo' : 'Editar';
      this.renderOpenedSheetTracksList();
    },

    getFilteredAndSortedSheetTracks() {
      let arr = [...(this._openedSheetTracks || [])];
      const q = this._sheetFilterQuery.toLowerCase();
      if (q) {
        arr = arr.filter(t => `${t.title || ''} ${t.artist || ''}`.toLowerCase().includes(q));
      }
      if (this._sheetSortMode === 'title') {
        arr.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
      } else if (this._sheetSortMode === 'artist') {
        arr.sort((a, b) => String(a.artist || '').localeCompare(String(b.artist || '')));
      } else if (this._sheetSortMode === 'recent') {
        arr.sort((a, b) => (Number(b.addedAt) || b._sheetOrigIdx || 0) - (Number(a.addedAt) || a._sheetOrigIdx || 0));
      }
      return arr;
    },

    renderOpenedSheetTracksList() {
      const listCont = document.getElementById('plSheetTracksList') || document.getElementById('plSheetTracksContainer');
      const subEl = document.getElementById('plSheetSubtitle');
      if (!listCont) return;

      if (subEl) {
        subEl.textContent = `${this._openedSheetTracks.length} canciones`;
      }

      if (this._openedSheetTracks.length === 0) {
        listCont.innerHTML = `
          <div class="p-6 text-center text-xs text-gray-400">
            Esta lista está vacía. Pulsa <b>Añadir más</b> arriba para descubrir canciones deslizando a la derecha.
          </div>
        `;
        return;
      }

      const displayed = this.getFilteredAndSortedSheetTracks();
      this._displayedSheetTracks = displayed;
      dualStreamEngine.warmTracks(displayed.slice(0, 32));

      if (displayed.length === 0) {
        listCont.innerHTML = `<div class="p-6 text-center text-xs text-gray-400">Ninguna canción coincide con tu búsqueda.</div>`;
        return;
      }

      if (Array.isArray(window.searchResultsCache)) {
        for (const tr of displayed) {
          if (tr && tr.id && !window.searchResultsCache.some(s => s && String(s.id) === String(tr.id))) {
            window.searchResultsCache.push(tr);
          }
        }
      }

      const isUserPl = Boolean(this._openedSheetPlaylistId && this._openedSheetPlaylistId !== '__favorites__');
      const diffs = [
        { label: 'Fácil', key: 'easy', stars: '★' },
        { label: 'Media', key: 'medium', stars: '★★' },
        { label: 'Difícil', key: 'hard', stars: '★★★' },
        { label: 'Extrema', key: 'extreme', stars: '★★★★' }
      ];

      listCont.className = 'spotify-sheet-tracks-scroll piano-keyboard-bed px-2 py-2 space-y-1.5';
      listCont.innerHTML = displayed.map((tr, dispIdx) => {
        const origIdx = typeof tr._sheetOrigIdx === 'number' ? tr._sheetOrigIdx : dispIdx;
        const thumb = getBestTrackCover(tr);
        const isCurrent = Boolean(dualStreamEngine.currentTrack && areSameCanonicalSong(dualStreamEngine.currentTrack, tr));
        const safeTitleAttr = escapeHtmlSafe(tr.title || '').replace(/'/g, "\\'");
        const safeArtistAttr = escapeHtmlSafe(tr.artist || '').replace(/'/g, "\\'");
        const accordionId = `plSheetPianoAcc_${dispIdx}`;

        return `
          <div class="piano-key-row flex flex-col mb-1.5" id="plSheetKeyRow_${dispIdx}">
            <div class="relative flex items-stretch w-full">
              <!-- TECLA BLANCA DE MARFIL IDÉNTICA A MI BIBLIOTECA -> PLAYLISTS -->
              <div onclick="window.DiscoverHomeApp.toggleSheetPianoKeyAccordion(${dispIdx})" class="piano-white-key flex-1 flex items-center gap-2.5 cursor-pointer select-none min-w-0 ${isCurrent ? 'ring-2 ring-[#d4af37]' : ''}">
                <!-- Portada 60x60 a la izquierda con botón de escuchar canción -->
                <div onclick="event.stopPropagation(); window.DiscoverHomeApp.playSongFromOpenedSheet(${dispIdx});" class="piano-key-thumb song-thumb-preview-wrap relative flex-shrink-0 cursor-pointer" title="Escuchar canción">
                  <img id="plSheetTrackCover_${dispIdx}" src="${thumb}" onload="if(this.naturalWidth>0 && this.naturalWidth<=120){ window.DiscoverHomeApp && window.DiscoverHomeApp.handleBrokenYtThumb(this, '${safeTitleAttr}', '${safeArtistAttr}'); }" onerror="this.onerror=null; this.src='./app_logo.png';" class="w-full h-full object-cover" alt="" loading="lazy">
                  <div class="song-thumb-preview-overlay">
                    <span class="thumb-preview-icon text-white text-xs font-bold">${isCurrent && dualStreamEngine.isPlaying() ? '❚❚' : '▶'}</span>
                  </div>
                </div>

                <!-- Título y Artista sobre el marfil con tipografía oscura de alto contraste -->
                <div class="flex-1 min-w-0 py-1.5 pr-1">
                  <div class="flex items-center gap-1.5">
                    <span class="px-1.5 py-0.5 rounded bg-[#2a1f18] text-[#f3e5ab] text-[8px] font-extrabold uppercase tracking-wider flex-shrink-0">#${dispIdx + 1}</span>
                    <h4 class="font-serif font-bold text-[#17131d] text-[13px] leading-tight truncate">${escapeHtmlSafe(tr.title || 'Canción')}</h4>
                  </div>
                  <p class="text-[11px] font-semibold text-[#5a422d] truncate mt-0.5">${escapeHtmlSafe(tr.artist || 'Artista')}</p>
                </div>

                <!-- Botón ••• o Controles de Edición a la derecha dentro de la tecla blanca -->
                <div class="flex items-center gap-1 pr-1 flex-shrink-0" onclick="event.stopPropagation();">
                  ${this._sheetEditMode ? `
                    ${isUserPl && this._sheetSortMode === 'custom' && !this._sheetFilterQuery ? `
                      <button type="button" onclick="window.DiscoverHomeApp.moveTrackInOpenedSheet(${origIdx}, -1)" class="w-6 h-6 rounded bg-stone-800/80 text-[#f3e5ab] text-[10px] font-bold flex items-center justify-center" title="Subir">▲</button>
                      <button type="button" onclick="window.DiscoverHomeApp.moveTrackInOpenedSheet(${origIdx}, 1)" class="w-6 h-6 rounded bg-stone-800/80 text-[#f3e5ab] text-[10px] font-bold flex items-center justify-center" title="Bajar">▼</button>
                    ` : ''}
                    <button type="button" onclick="window.DiscoverHomeApp.removeTrackFromOpenedSheet(${origIdx})" class="w-6 h-6 rounded bg-red-700 text-white text-[10px] font-bold flex items-center justify-center" title="Quitar">✕</button>
                  ` : `
                    <button type="button" onclick="window.DiscoverHomeApp.openTrackOptionsSheetFromOpenedPlaylist(${dispIdx}, event)" class="w-7 h-7 rounded-full bg-stone-900/10 hover:bg-stone-900/20 flex items-center justify-center text-[#2c1d12] flex-shrink-0 cursor-pointer" title="Opciones / Descargar">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                    </button>
                  `}
                </div>
              </div>

              <!-- TECLA NEGRA DE ÉBANO A LA DERECHA (48px, ▶ JUGAR AL PIANO) -->
              <button type="button" onclick="event.stopPropagation(); window.DiscoverHomeApp.playPianoFromOpenedSheet(${dispIdx});" class="piano-black-play-key" title="Jugar al piano">
                <span class="play-arrow-gold">▶</span>
              </button>
            </div>

            <!-- ACORDEÓN DE MADERA CON LAS 4 DIFICULTADES EN UNA FILA -->
            <div id="${accordionId}" class="piano-soundboard-accordion px-3">
              <div class="pt-2.5 pb-2.5">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[9px] uppercase tracking-widest text-[#d4af37] font-bold">Selecciona Dificultad para Jugar</span>
                  <button type="button" onclick="event.stopPropagation(); window.DiscoverHomeApp.openTrackOptionsSheetFromOpenedPlaylist(${dispIdx}, event)" class="text-[10px] text-amber-200 hover:text-white font-bold underline">Opciones / Descargar</button>
                </div>
                <div style="display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:6px;">
                  ${diffs.map(d => `
                    <button type="button" onclick="event.stopPropagation(); window.DiscoverHomeApp.playPianoFromOpenedSheet(${dispIdx}, '${d.key}')" class="py-1.5 px-1 rounded-lg bg-white/5 hover:bg-[#d4af37]/25 border border-[#d4af37]/35 text-center transition cursor-pointer">
                      <div class="text-[9px] text-[#f3e5ab] font-black">${d.stars}</div>
                      <div class="text-[10px] text-white font-bold truncate">${d.label}</div>
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      displayed.slice(0, 14).forEach((tr, i) => {
        if (!hasRealHttpCover(tr)) {
          this._ensureRealCoverForTrack(tr, `plSheetTrackCover_${i}`);
        }
      });
    },

    toggleSheetPianoKeyAccordion(dispIdx) {
      const acc = document.getElementById(`plSheetPianoAcc_${dispIdx}`);
      if (!acc) return;
      const wasOpen = acc.classList.contains('open');
      document.querySelectorAll('[id^="plSheetPianoAcc_"]').forEach(el => {
        el.classList.remove('open');
        el.style.maxHeight = '0px';
      });
      if (!wasOpen) {
        acc.classList.add('open');
        acc.style.maxHeight = '160px';
      }
    },

    async moveTrackInOpenedSheet(origIdx, delta) {
      if (!this._openedSheetPlaylistId || this._openedSheetPlaylistId === '__favorites__') return;
      const targetIdx = origIdx + delta;
      if (targetIdx < 0 || targetIdx >= this._openedSheetTracks.length) return;
      const temp = this._openedSheetTracks[origIdx];
      this._openedSheetTracks[origIdx] = this._openedSheetTracks[targetIdx];
      this._openedSheetTracks[targetIdx] = temp;
      this._openedSheetTracks.forEach((t, i) => { t._sheetOrigIdx = i; });
      await this._persistOpenedSheetPlaylistTracks();
      this.renderOpenedSheetTracksList();
    },

    async removeTrackFromOpenedSheet(origIdx) {
      const removed = this._openedSheetTracks[origIdx];
      if (!removed) return;
      this._openedSheetTracks.splice(origIdx, 1);
      this._openedSheetTracks.forEach((t, i) => { t._sheetOrigIdx = i; });

      if (this._openedSheetPlaylistId === '__favorites__') {
        dnaEngine.likes.delete(String(removed.id));
        dnaEngine.saveToStorage(true);
        if (typeof window.favoriteIdsSet !== 'undefined') window.favoriteIdsSet.delete(removed.id);
        if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.deleteFavorite === 'function') {
          await window.IndexedDBStorage.deleteFavorite(removed.id).catch(() => {});
        }
        if (typeof window.updateLibraryVaultBadges === 'function') window.updateLibraryVaultBadges();
        if (typeof window.renderFavoritesSubtab === 'function') window.renderFavoritesSubtab();
      } else if (this._openedSheetPlaylistId) {
        await this._persistOpenedSheetPlaylistTracks();
      }
      this.renderOpenedSheetTracksList();
      this.refreshCarousels();
    },

    async _persistOpenedSheetPlaylistTracks() {
      if (!this._openedSheetPlaylistId || this._openedSheetPlaylistId === '__favorites__') return;
      if (typeof window.IndexedDBStorage === 'undefined' || typeof window.IndexedDBStorage.getPlaylist !== 'function') return;
      try {
        const pl = await window.IndexedDBStorage.getPlaylist(this._openedSheetPlaylistId);
        if (!pl) return;
        pl.tracks = this._openedSheetTracks.map(t => {
          const copy = { ...t };
          delete copy._sheetOrigIdx;
          return copy;
        });
        pl.item_count = pl.tracks.length;
        await window.IndexedDBStorage.putPlaylist(pl);
        if (this.targetPlaylistObj && String(this.targetPlaylistObj.id) === String(pl.id)) {
          this.targetPlaylistObj = pl;
        }
        if (typeof window.renderPlaylistsSubtab === 'function') {
          window.renderPlaylistsSubtab();
        }
      } catch (_) {}
    },

    async renameOpenedSheetPlaylist() {
      if (!this._openedSheetPlaylistId || this._openedSheetPlaylistId === '__favorites__') return;
      const nextName = prompt('Nuevo nombre para la playlist:', this._openedSheetTitle);
      if (!nextName || !nextName.trim()) return;
      this._openedSheetTitle = nextName.trim();
      const titleEl = document.getElementById('plSheetTitle');
      if (titleEl) titleEl.textContent = this._openedSheetTitle;
      try {
        const pl = await window.IndexedDBStorage.getPlaylist(this._openedSheetPlaylistId);
        if (pl) {
          pl.title = this._openedSheetTitle;
          await window.IndexedDBStorage.putPlaylist(pl);
          this.refreshCarousels();
          if (typeof window.renderPlaylistsSubtab === 'function') window.renderPlaylistsSubtab();
        }
      } catch (_) {}
    },

    async deleteOpenedSheetPlaylist() {
      if (!this._openedSheetPlaylistId || this._openedSheetPlaylistId === '__favorites__') return;
      if (!confirm(`¿Eliminar la playlist "${this._openedSheetTitle}"?`)) return;
      try {
        if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.deletePlaylist === 'function') {
          await window.IndexedDBStorage.deletePlaylist(this._openedSheetPlaylistId);
        }
        if (this.targetPlaylistId === this._openedSheetPlaylistId) {
          this.clearSwipeTargetPlaylist();
        }
        this.closePlaylistTracksModal();
        this.refreshCarousels();
        if (typeof window.renderPlaylistsSubtab === 'function') window.renderPlaylistsSubtab();
        if (typeof window.showSuccessToast === 'function') {
          window.showSuccessToast('Playlist eliminada');
        }
      } catch (_) {}
    },

    closePlaylistTracksModal() {
      const modal = document.getElementById('spotifyPlaylistSheetModal');
      if (modal) modal.classList.remove('open');
    },

    playSongFromOpenedSheet(dispIdx) {
      const list = Array.isArray(this._displayedSheetTracks) ? this._displayedSheetTracks : this._openedSheetTracks;
      if (!Array.isArray(list) || !list[dispIdx]) return;
      if (dualStreamEngine.currentTrack &&
          areSameCanonicalSong(dualStreamEngine.currentTrack, list[dispIdx]) &&
          dualStreamEngine.activeSourceType !== 'none' &&
          (dualStreamEngine.fullAudio.src || dualStreamEngine.previewAudio.src)) {
        dualStreamEngine.togglePlayPause();
      } else {
        dualStreamEngine.loadQueueAndPlay(list, dispIdx, this._openedSheetTitle);
      }
      this.renderOpenedSheetTracksList();
    },

    playPianoFromOpenedSheet(dispIdx, explicitDifficulty = null) {
      const list = Array.isArray(this._displayedSheetTracks) ? this._displayedSheetTracks : this._openedSheetTracks;
      if (!Array.isArray(list) || !list[dispIdx]) return;
      if (explicitDifficulty) {
        window._selectedModalDifficulty = explicitDifficulty;
      }
      this.closePlaylistTracksModal();
      this.launchPianoGameForTrack(list[dispIdx], explicitDifficulty);
    },

    playAllFromOpenedSheet(shuffle = false) {
      const baseList = Array.isArray(this._displayedSheetTracks) && this._displayedSheetTracks.length > 0
        ? [...this._displayedSheetTracks]
        : [...(this._openedSheetTracks || [])];
      if (baseList.length === 0) return;
      if (shuffle) {
        for (let i = baseList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = baseList[i];
          baseList[i] = baseList[j];
          baseList[j] = tmp;
        }
      }
      dualStreamEngine.loadQueueAndPlay(baseList, 0, this._openedSheetTitle);
      this.renderOpenedSheetTracksList();
    },

    launchSwipeDiscoveryForOpenedSheet() {
      const plId = (this._openedSheetPlaylistId && this._openedSheetPlaylistId !== '__favorites__')
        ? this._openedSheetPlaylistId
        : null;
      this.closePlaylistTracksModal();
      if (plId) {
        this.startPlaylistDiscoverySwipeMode(plId);
      } else {
        this.openSwipeTargetPlaylistModal();
      }
    },

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

      const generalOptionHtml = this.targetPlaylistObj ? `
        <div onclick="window.DiscoverHomeApp.clearSwipeTargetPlaylist(); window.DiscoverHomeApp.closeSwipeTargetPlaylistModal();" class="spotify-sheet-track-item border border-amber-400/40 bg-amber-500/10 mb-2">
          <div class="w-10 h-10 rounded-lg bg-amber-400/20 flex items-center justify-center text-[#f3d791] flex-shrink-0">
            ${SVG_ICONS.sparkles}
          </div>
          <div class="spotify-track-meta">
            <p class="spotify-track-title">Volver a Para ti (General)</p>
            <p class="spotify-track-artist">Guardar canciones en Tus Me Gusta al deslizar</p>
          </div>
        </div>
      ` : '';

      if (playlists.length === 0) {
        listCont.innerHTML = generalOptionHtml + `
          <div class="p-4 text-center text-xs text-gray-400">
            No tienes playlists creadas todavía. Crea una abajo para empezar a descubrir canciones deslizando a la derecha.
          </div>
        `;
      } else {
        listCont.innerHTML = generalOptionHtml + playlists.map(pl => {
          const isSelected = this.targetPlaylistObj && String(this.targetPlaylistObj.id) === String(pl.id);
          const firstTrack = Array.isArray(pl.tracks) && pl.tracks[0] ? pl.tracks[0] : null;
          const cover = firstTrack ? getBestTrackCover(firstTrack) : './app_logo.png';
          const safeId = String(pl.id).replace(/'/g, "\\'");
          return `
            <div onclick="window.DiscoverHomeApp.startPlaylistDiscoverySwipeMode('${safeId}')" class="spotify-sheet-track-item ${isSelected ? 'playing-now' : ''}">
              <img src="${cover}" onerror="this.onerror=null; this.src='./app_logo.png';" class="spotify-track-cover" alt="">
              <div class="spotify-track-meta">
                <p class="spotify-track-title">${escapeHtmlSafe(pl.title || 'Playlist')}</p>
                <p class="spotify-track-artist">${(pl.tracks || []).length} canciones · Recomendación inteligente</p>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3e5ab] text-[10px] font-extrabold">
                ${isSelected ? 'Activa' : 'Elegir'}
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

      this.rebuildCrateDeck(true);

      const shell = document.getElementById('crateDiggerSection');
      if (shell && typeof shell.scrollIntoView === 'function') {
        shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(`Añadiendo a "${pl.title}": desliza a la derecha para guardar`);
      }
    },

    clearSwipeTargetPlaylist() {
      this.targetPlaylistId = null;
      this.targetPlaylistObj = null;
      this._syncTargetPlaylistHeaderUI();
      this.rebuildCrateDeck(false);
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('Modo Para ti general activado');
      }
    },

    _syncTargetPlaylistHeaderUI() {
      const btn = document.getElementById('cratePlaylistTargetBtn');
      const label = document.getElementById('cratePlaylistTargetLabel');
      const hasTarget = Boolean(this.targetPlaylistObj);

      if (btn) btn.classList.toggle('active-target', hasTarget);
      if (label) {
        label.textContent = hasTarget
          ? `Añadiendo a: ${this.targetPlaylistObj.title}`
          : 'Buscar para playlist';
      }
    },

    async playYouTubeCollectionContinuous(playlistId, title = 'Colección') {
      try {
        if (typeof window.importCuratedPlaylist === 'function') {
          await window.importCuratedPlaylist(playlistId, title, false);
          return;
        }
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
            const previewPl = {
              id: `yt_${parsed.id || playlistId}`,
              title: parsed.title || title,
              item_count: tracks.length,
              tracks,
              source: 'youtube',
              createdAt: Date.now(),
              _isUnsavedPreview: true
            };
            if (typeof window.openPlaylistDetailView === 'function') {
              await window.openPlaylistDetailView(previewPl.id, previewPl);
              return;
            }
          }
        }
      } catch (_) {
        if (typeof window.showErrorToast === 'function') {
          window.showErrorToast('No se pudo cargar la colección.');
        }
      }
    },

    // =========================================================================
    // REPRODUCTOR COMPLETO + VIDEOCLIP + KARAOKE EN TIEMPO REAL
    // =========================================================================
    toggleKaraokeTranslation() {
      return karaokeService.toggleTranslation();
    },

    openNowPlayingModal(defaultTab = null) {
      const modal = document.getElementById('nowPlayingTurntableModal');
      if (!modal) return;
      modal.classList.add('open');
      if (defaultTab) {
        this.switchNowPlayingTab(defaultTab);
      }
      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (tr) {
        karaokeService.loadAndRenderTrackLyrics(tr, dualStreamEngine.getRealDurationSec(tr)).catch(() => {});
      }
      dualStreamEngine._renderQueueListInModal();
    },

    closeNowPlayingModal() {
      const modal = document.getElementById('nowPlayingTurntableModal');
      if (modal) modal.classList.remove('open');
    },

    switchNowPlayingTab(tab = 'vinyl') {
      const isKaraoke = tab === 'karaoke';
      const isVideoclip = tab === 'videoclip';
      const isVinyl = !isKaraoke && !isVideoclip;

      const vinylStage = document.getElementById('npTurntablePlatterInteractive') || document.getElementById('npVinylStageContainer');
      const karaokeStage = document.getElementById('npKaraokeStageContainer');
      const videoclipStage = document.getElementById('npVideoclipStageContainer');

      const tabVinylBtn = document.getElementById('npTabVinylBtn');
      const tabVideoclipBtn = document.getElementById('npTabVideoclipBtn');
      const tabKaraokeBtn = document.getElementById('npTabKaraokeBtn');

      if (vinylStage) vinylStage.classList.toggle('hidden', !isVinyl);
      if (karaokeStage) karaokeStage.classList.toggle('hidden', !isKaraoke);
      if (videoclipStage) videoclipStage.classList.toggle('hidden', !isVideoclip);

      if (tabVinylBtn) tabVinylBtn.classList.toggle('active', isVinyl);
      if (tabVideoclipBtn) tabVideoclipBtn.classList.toggle('active', isVideoclip);
      if (tabKaraokeBtn) tabKaraokeBtn.classList.toggle('active', isKaraoke);

      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (isVideoclip && tr) {
        this._mountNowPlayingVideoclipForTrack(tr);
      } else if (isKaraoke && tr) {
        karaokeService.loadAndRenderTrackLyrics(tr, dualStreamEngine.getRealDurationSec(tr)).then(() => {
          karaokeService.syncTime(dualStreamEngine.getCurrentSongTimeSec());
        }).catch(() => {});
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

    async toggleLikeCurrentPlayerTrack() {
      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (!tr) return;
      const isAlreadyFav = (typeof window.favoriteIdsSet !== 'undefined' && window.favoriteIdsSet.has(tr.id)) ||
                           dnaEngine.likes.has(String(tr.id));
      if (isAlreadyFav) {
        dnaEngine.likes.delete(String(tr.id));
        dnaEngine.saveToStorage(true);
        if (typeof window.favoriteIdsSet !== 'undefined') window.favoriteIdsSet.delete(tr.id);
        if (typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.deleteFavorite === 'function') {
          await window.IndexedDBStorage.deleteFavorite(tr.id).catch(() => {});
        }
      } else {
        await this.saveTrackToFavoritesNormalized(tr, true);
      }
      dualStreamEngine._updatePlayerMetadataUI(tr);
      this.refreshCarousels();
    },

    getAudioEngine() {
      return dualStreamEngine;
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
      if (dualStreamEngine.activeSourceType === 'none' || (!dualStreamEngine.fullAudio.src && !dualStreamEngine.previewAudio.src)) {
        if (dualStreamEngine.currentTrack) {
          dualStreamEngine.playTrack(dualStreamEngine.currentTrack);
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


