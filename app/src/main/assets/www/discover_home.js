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
  const STORAGE_KEY_LYRIC_OFFSETS = 'piano_karaoke_user_offsets_v1';
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
      .replace(/José[eéÉ]+/g, 'José')
      .replace(/Bosé[eéÉ]+/g, 'Bosé')
      .replace(/café[eéÉ]+/gi, 'café')
      .replace(/\bDON\s+José/gi, 'Don José');
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

  const CANONICAL_YT_VIDEO_OWNERS = {
    v2AC41dglnM: 'back in black',
    fJ9rUzIMcZQ: 'bohemian rhapsody',
    'CD-E-LDc384': 'enter sandman',
    hTWKbfoikeg: 'smells like teen spirit',
    eVTXPUF4Oz4: 'in the end',
    CSvFpBOe8eY: 'chop suey',
    '3YxaaGgTQYM': 'bring me to life',
    'Soa3gO7tL-c': 'boulevard of broken dreams',
    YlUKcNNmywk: 'californication',
    '6fVE8kSM43I': 'duality',
    DelhLppPSxY: 'hail to the king',
    SBjQ9tuuTJQ: 'the pretender',
    kXYiU_JCYtU: 'numb',
    'TUVcZfQe-Kw': 'levitating',
    '4NRXx6U8ABQ': 'blinding lights',
    '09R8_2nJtjg': 'sugar',
    'CwkzK-F0Y00': 'gurenge',
    'wDGhu8-4N-4': 'megalovania',
    QHRuTYtSbJQ: 'bfg division',
    UOxkGD8qRB4: 'pop stars',
    '1tk1pqwrOys': 'kaikai kitan',
    'CID-sYQNCew': 'guren no yumiya',
    aBkTkxKDduc: 'sweden'
  };

  let _curatedCanonicalCache = null;
  let _curatedCanonicalKeyCount = 0;

  function resolveCuratedTrackMeta(rawVid, title, artist) {
    const vid = String(rawVid || '').replace(/^magic_yt_|^yt_/, '').trim();
    const db = (typeof window !== 'undefined' && window.CURATED_PLAYLIST_DATABASE) ||
               (typeof CURATED_PLAYLIST_DATABASE !== 'undefined' ? CURATED_PLAYLIST_DATABASE : null);
    if (db && (!_curatedCanonicalCache || Object.keys(db).length !== _curatedCanonicalKeyCount)) {
      _curatedCanonicalCache = new Map();
      _curatedCanonicalKeyCount = Object.keys(db).length;
      for (const plData of Object.values(db)) {
        for (const tr of (plData?.tracks || [])) {
          if (!tr || !tr.id) continue;
          if (!_curatedCanonicalCache.has(tr.id)) {
            _curatedCanonicalCache.set(tr.id, {
              normTitle: normalizeSongPart(tr.title, false),
              normArtist: normalizeSongPart(tr.artist, true)
            });
          }
        }
      }
    }

    const normTitle = normalizeSongPart(title, false);
    const normArtist = normalizeSongPart(artist, true);
    const slug = `${normArtist || 'art'}_${normTitle || 'song'}`.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 64) || 'track';

    if (!/^[A-Za-z0-9_-]{11}$/.test(vid)) {
      return {
        id: `magic_cand_${slug}`,
        videoId: '',
        thumbnail: './app_logo.png',
        isPlaceholder: !vid ? false : true
      };
    }

    const ownerFromDb = _curatedCanonicalCache ? _curatedCanonicalCache.get(vid) : null;
    const ownerHint = ownerFromDb?.normTitle || CANONICAL_YT_VIDEO_OWNERS[vid] || '';
    let isPlaceholder = false;
    if (ownerHint && normTitle) {
      const hintNorm = normalizeSongPart(ownerHint, false);
      if (hintNorm && !normTitle.includes(hintNorm) && !hintNorm.includes(normTitle)) {
        isPlaceholder = true;
      }
    }

    if (isPlaceholder) {
      return {
        id: `magic_cand_${slug}`,
        videoId: '',
        thumbnail: './app_logo.png',
        isPlaceholder: true
      };
    }
    return {
      id: `magic_yt_${vid}`,
      videoId: vid,
      thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
      isPlaceholder: false
    };
  }
  if (typeof window !== 'undefined') {
    window.resolveCuratedTrackMeta = resolveCuratedTrackMeta;
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
          this.lastLikedTrack = {
            ...data.last_liked_track,
            title: repairSpanishBrokenAccents(data.last_liked_track.title || ''),
            artist: repairSpanishBrokenAccents(data.last_liked_track.artist || '')
          };
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
        this.lastLikedTrack = {
          ...musicDnaObj.last_liked_track,
          title: repairSpanishBrokenAccents(musicDnaObj.last_liked_track.title || ''),
          artist: repairSpanishBrokenAccents(musicDnaObj.last_liked_track.artist || '')
        };
      }
      this.saveToStorage(false);
    }

    _stableHash01(str) {
      const s = String(str || '');
      let h = 2166136261;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return ((h >>> 0) % 10000) / 10000;
    }

    encodeTrackVector(track) {
      if (track && Array.isArray(track._dnaVector8D) && track._dnaVector8D.length === 8) {
        return track._dnaVector8D;
      }
      const title = repairSpanishBrokenAccents(String(track?.title || '')).toLowerCase();
      const artist = repairSpanishBrokenAccents(String(track?.artist || '')).toLowerCase();
      const genre = String(track?.genre || track?.category || track?.source_name || '').toLowerCase();
      const combined = `${title} ${artist} ${genre}`;
      const sigHash = this._stableHash01(`${artist}||${title}`);
      const notesNorm = Math.max(0, Math.min(1, ((Number(track?.total_notes) || 320) - 140) / 520));

      let rawBpm = Number(track?.bpm) || (98 + Math.round(sigHash * 54));
      if (rawBpm === 120) {
        rawBpm = 104 + Math.round(sigHash * 38);
      }
      while (rawBpm > 205) rawBpm *= 0.5;
      while (rawBpm < 58) rawBpm *= 2.0;
      const bpmNorm = Math.max(0.08, Math.min(0.98, (rawBpm - 60) / 135));

      let rockAff = 0.14 + (sigHash * 0.06);
      let elecAff = 0.11 + (((sigHash * 7) % 1) * 0.06);
      let popLatinAff = 0.18 + (((sigHash * 13) % 1) * 0.07);
      let classicalPianoAff = 0.16 + (notesNorm * 0.08);

      if (/\b(rock|metal|punk|grunge|indie|ac\/dc|queen|metallica|nirvana|linkin park|guns n|bon jovi|system of a down|evanescence|green day|red hot|offspring|slipknot|avenged|foo fighters|europe|beatles|rolling stones|blink|soundgarden|verve|heroes del silencio|héroes del silencio|soda stereo|extremoduro|platero|fito|mago de oz|mägo de oz|rata blanca|attaque|dragonforce|sober|sôber|marea|barricada|loquillo|hombres g|enanitos verdes|la fuga|pereza|celtas cortos|dover|muse|coldplay|u2|oasis|blur|radiohead|the cure|the killers|arctic monkeys|rammstein|iron maiden|scorpions|deep purple|led zeppelin|aerosmith)\b/i.test(combined)) {
        rockAff = 0.84 + (notesNorm * 0.10) + (sigHash * 0.05);
      }
      if (/\b(electronic|edm|phonk|dance|house|trance|techno|dubstep|dnb|synth|disco|kordhell|dvrst|alan walker|avicii|skrillex|thefatrat|martin garrix|marshmello|vicetone|dj snake|deadmau5|zedd|gabry ponte|camellia|kobaryo|usao|t\+pazolite|laur|lapix|xi|kurokotei|david guetta|calvin harris|daft punk|tiesto|armin|swedish house|kygo|galantis|clean bandit|eiffel 65|gala|corona|cascada|basshunter|boney m|abba|modern talking|depeche mode|pet shop boys|new order)\b/i.test(combined)) {
        elecAff = 0.86 + (bpmNorm * 0.08) + (sigHash * 0.05);
      }
      if (/\b(pop|latin|español|balada|rumba|flamenco|reggaeton|urbano|bachata|salsa|cumbia|dua lipa|weeknd|bad bunny|billie eilish|bizarrap|quevedo|harry styles|olivia rodrigo|bruno mars|rauw|rosalia|rosalía|shakira|lady gaga|taylor swift|ed sheeran|post malone|maroon 5|adele|katy perry|britney|juanes|alejandro sanz|alejandro fernández|luis miguel|camilo sesto|nino bravo|juan gabriel|bustamante|mecano|mana|maná|calamaro|laura pausini|chayanne|bisbal|melendi|estopa|canto del loco|oreja de van gogh|reik|camila|cristian castro|mon laferte|abel pintos|pablo alboran|pablo alborán|aitana|lola indigo|sebastián yatra|morat|manuel turizo|karol g|maluma|j balvin|ozuna|daddy yankee|don omar|wisin|yandel|romeo santos|marc anthony|juan luis guerra|rocío|raphael|julio iglesias|josé luis perales|miguel bosé|alaska|amaral|jarabe de palo|efectos|sin bandera|jesse|ha\*ash|carlos vives|enrique iglesias|ricky martin|thalía|paulina rubio|gloria trevi|natalia lafourcade|julieta venegas)\b/i.test(combined)) {
        popLatinAff = 0.84 + ((1 - Math.abs(bpmNorm - 0.45)) * 0.08) + (sigHash * 0.06);
      }
      if (/\b(piano|chopin|beethoven|debussy|liszt|mozart|rachmaninoff|satie|pachelbel|yiruma|einaudi|nocturne|sonata|clair de lune|campanella|rhapsody|prelude|waltz|gymnopedie|sinatra|billy joel|elton john|ray charles|nina simone|brubeck|louis armstrong|elvis|jazz|lounge|classical|clasica|clásica|balada|soundtrack|el rey león|aladdín|la sirenita|vaiana|tarzán|bocelli|céline dion|whitney houston|mariah carey)\b/i.test(combined)) {
        classicalPianoAff = 0.85 + (notesNorm * 0.08) + (sigHash * 0.05);
      }

      let vocalWeight = 0.76 + (sigHash * 0.06);
      if (classicalPianoAff >= 0.85 && !/\b(sinatra|billy joel|elton john|elvis|queen|ray charles|nina simone|bocelli|céline|whitney|mariah|rey león|aladdín|sirenita|vaiana|tarzán)\b/i.test(combined)) {
        vocalWeight = 0.08 + (sigHash * 0.04);
      } else if (/\b(instrumental|nocturne|sonata|symphony|ost|megalovania|bfg division|sweden|sealed vessel|camellia|kobaryo|freedom dive|galaxy collapse)\b/i.test(combined)) {
        vocalWeight = 0.12 + (sigHash * 0.05);
      } else if (elecAff >= 0.85 && !/\b(avicii|alan walker|zedd|marshmello|david guetta|calvin harris|daft punk|abba|boney m)\b/i.test(combined)) {
        vocalWeight = 0.30 + (sigHash * 0.06);
      }

      let eraDecade = 0.58 + (sigHash * 0.16);
      const year = Number(track?.releaseYear) || 0;
      if (year > 1900) {
        eraDecade = Math.max(0.05, Math.min(0.98, (year - 1955) / 70));
      } else if (/\b(chopin|beethoven|mozart|liszt|debussy|rachmaninoff|satie|pachelbel)\b/i.test(combined)) {
        eraDecade = 0.08;
      } else if (/\b(sinatra|elvis|beatles|rolling stones|louis armstrong|ray charles|nina simone|brubeck|camilo sesto|nino bravo|raphael|julio iglesias|mocedades|dúo dinámico|marisol|rocío)\b/i.test(combined)) {
        eraDecade = 0.28 + (sigHash * 0.08);
      } else if (/\b(ac\/dc|bon jovi|guns n|metallica|nirvana|mecano|heroes del silencio|héroes del silencio|soda stereo|luis miguel|europe|toto|hombres g|alaska|loquillo|enanitos verdes|queen|michael jackson|madonna|a-ha|depeche mode)\b/i.test(combined)) {
        eraDecade = 0.48 + (sigHash * 0.10);
      } else if (/\b(dua lipa|weeknd|bad bunny|billie eilish|bizarrap|quevedo|olivia rodrigo|rosalia|rosalía|kordhell|dvrst|taylor swift|aitana|lola indigo|rauw|karol g|sebastián yatra|morat)\b/i.test(combined)) {
        eraDecade = 0.88 + (sigHash * 0.08);
      }

      let energy = (bpmNorm * 0.38) + (rockAff * 0.22) + (elecAff * 0.22) + (notesNorm * 0.12) + 0.12;
      if (/\b(nocturne|clair de lune|gymnopedie|lullaby|balada|wonderful world|can't help falling|my way|river flows|nuvole bianche|abrázame|dediqué)\b/i.test(combined)) {
        energy = Math.min(energy, 0.34);
      } else if (/\b(metal|phonk|hardcore|through the fire|master of puppets|duality|bangarang|bfg division|camellia|thunder|back in black|fiesta pagana|molinos de viento)\b/i.test(combined)) {
        energy = Math.max(energy, 0.88);
      }
      energy = Math.max(0.10, Math.min(0.98, energy));

      const vec = [
        +Math.min(0.98, bpmNorm).toFixed(4),
        +Math.min(0.98, energy).toFixed(4),
        +Math.min(0.98, eraDecade).toFixed(4),
        +Math.min(0.98, vocalWeight).toFixed(4),
        +Math.min(0.98, rockAff).toFixed(4),
        +Math.min(0.98, elecAff).toFixed(4),
        +Math.min(0.98, popLatinAff).toFixed(4),
        +Math.min(0.98, classicalPianoAff).toFixed(4)
      ];
      if (track && typeof track === 'object') {
        track._dnaVector8D = vec;
        track._dnaCluster = this._inferClusterFromVector(vec, combined);
      }
      return vec;
    }

    _inferClusterFromVector(vec, combinedStr = '') {
      if (vec[7] >= 0.78 && vec[4] < 0.70 && vec[5] < 0.70) return vec[2] <= 0.4 ? 'classical_piano' : 'retro_vegas';
      if (vec[5] >= 0.78) return vec[1] >= 0.85 ? 'virtuoso_mania' : 'electronic';
      if (vec[4] >= 0.78) return 'rock';
      if (vec[6] >= 0.72) return 'pop_latin';
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
    },
    {
      videoId: 'xo6Fhf4vOoE',
      videoIds: ['xo6Fhf4vOoE', 'VRFrDddoOZc', '5zCbMA9kU9k'],
      keys: [
        'abrahammateo12anosyrosariofloresnodudaria',
        'abrahammateoyrosariofloresnodudaria',
        'abrahammateo12anosrosariofloresnodudaria',
        'nodudariaabrahammateo'
      ],
      trackName: 'Abraham Mateo (12 años) y Rosario Flores - NO DUDARÍA',
      artistName: 'Abraham Mateo y Rosario Flores',
      duration: 308.0,
      syncedLyrics: `[00:02.00] Con esa guitarra vamos a hacer un poquito de compás
[00:10.00] El tema del inolvidable hermano de Rosario, de Antonio: No dudaría
[00:18.50] (Introducción de guitarra flamenca y palmas)
[00:42.00] Si pudiera olvidar todo aquello que fui
[00:47.00] Si pudiera borrar todo aquello que vi
[00:52.00] No dudaría, no dudaría en volver a reír
[01:02.50] Si pudiera explicar las vidas que quité
[01:07.80] Si pudiera quemar las armas que usé
[01:13.00] No dudaría, no dudaría en volver a reír
[01:23.00] Prometo ver la alegría, escarmentar de la experiencia
[01:33.50] Pero nunca, nunca más usar la violencia
[01:44.00] Prometo ver la alegría, escarmentar de la experiencia
[01:54.50] Pero nunca, nunca más usar la violencia
[02:04.50] Na-na-ra-na-na, na-na-ra-na-na-na
[02:27.50] Si pudiera sembrar los campos que arrasé
[02:32.80] Si pudiera devolver la paz que quité
[02:38.00] No dudaría, no dudaría en volver a reír
[02:48.00] Si pudiera olvidar aquel llanto que oí
[02:53.00] Si pudiera lograr apartarlo de mí
[02:58.50] No dudaría, no dudaría en volver a reír
[03:08.50] Prometo ver la alegría, escarmentar de la experiencia
[03:19.00] Pero nunca, nunca más usar la violencia
[03:29.50] Prometo ver la alegría, escarmentar de la experiencia
[03:40.00] Pero nunca, nunca más usar la violencia
[03:50.00] Na-na-ra-na-na, na-na-ra-na-na-na
[04:10.00] Na-na-ra-na-na, no dudaría en volver a reír`
    }
  ];

  // =========================================================================
  // 3B. KARAOKE LYRICS SERVICE (SISTEMA INFALIBLE DE SINCRONIZACIÓN Y SEEK)
  // =========================================================================
  class KaraokeLyricsService {
    constructor() {
      this.cache = new Map();
      this.candidatesCache = new Map();
      this.translationCache = new Map();
      this.knownAudioDurations = new Map();
      this.knownLeadingSilenceMap = new Map();
      this.studioReferenceMap = new Map();
      this.audioWaveformProfiles = new Map();
      this.topVocalOnsetsMap = new Map();
      this.inflight = new Map();
      this.trackCalibrationState = new Map();
      this.dspEnvelopeCache = typeof WeakMap !== 'undefined' ? new WeakMap() : new Map();
      this.previewEnvCache = new Map();
      this.currentLyrics = [];
      this.currentTrack = null;
      this.currentTrackKey = '';
      this.activeLineIndex = -1;
      this.timeOffsetSec = 0;
      this.autoLeadingSilenceSec = 0;
      this.userOffsetsMap = this._loadUserOffsets();
      this._isUserManualScrolling = false;
      this._userManualScrollUntil = 0;
      this._userScrollingUntil = 0;
      this._programmaticScrolling = false;
      this._programmaticScrollTimer = null;
      this._lastRenderedTrackKey = '';
      this._lastSyncAudioSec = 0;
      this.showTranslation = localStorage.getItem('piano_karaoke_translate') === 'true';
    }

    _loadUserOffsets() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_LYRIC_OFFSETS);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object') ? parsed : {};
      } catch (_) {
        return {};
      }
    }

    _saveUserOffsets() {
      try {
        const entries = Object.entries(this.userOffsetsMap || {}).slice(-200);
        const compact = {};
        for (const [k, v] of entries) {
          if (Number.isFinite(v) && Math.abs(v) > 0.01) compact[k] = +v.toFixed(2);
        }
        this.userOffsetsMap = compact;
        localStorage.setItem(STORAGE_KEY_LYRIC_OFFSETS, JSON.stringify(compact));
      } catch (_) {}
    }

    getUserOffsetSec(trackKey = this.currentTrackKey) {
      if (!trackKey) return 0;
      const val = Number(this.userOffsetsMap?.[trackKey]);
      return Number.isFinite(val) ? Math.max(-30, Math.min(30, val)) : 0;
    }

    setUserOffsetSec(trackKey, offsetSec) {
      if (!trackKey) return 0;
      const clamped = Math.max(-30, Math.min(30, +(Number(offsetSec) || 0).toFixed(2)));
      if (Math.abs(clamped) < 0.05) {
        delete this.userOffsetsMap[trackKey];
      } else {
        this.userOffsetsMap[trackKey] = clamped;
      }
      this._saveUserOffsets();
      if (trackKey === this.currentTrackKey) {
        this.timeOffsetSec = Math.abs(clamped) < 0.05 ? 0 : clamped;
        this._userScrollingUntil = 0;
        this._userManualScrollUntil = 0;
        this._syncToolbarUI();
        if (Array.isArray(this.currentLyrics) && this.currentLyrics.length > 0) {
          this.renderLinesToDom();
        }
        const curSec = (typeof dualStreamEngine !== 'undefined' && dualStreamEngine)
          ? dualStreamEngine.getCurrentSongTimeSec()
          : (this._lastSyncAudioSec || 0);
        this.activeLineIndex = -1;
        this.syncTime(curSec, { forceScroll: true });
      }
      return this.timeOffsetSec;
    }

    adjustOffset(deltaSec = 0) {
      if (!this.currentTrackKey) return 0;
      const cur = this.getUserOffsetSec(this.currentTrackKey);
      return this.setUserOffsetSec(this.currentTrackKey, cur + (Number(deltaSec) || 0));
    }

    nudgeOffset(deltaSec = 0) {
      return this.adjustOffset(deltaSec);
    }

    resetOffset() {
      if (!this.currentTrackKey) return 0;
      return this.setUserOffsetSec(this.currentTrackKey, 0);
    }

    resetUserOffset() {
      return this.resetOffset();
    }

    _makeKey(track) {
      const idPart = String(track?.id || '').trim().toLowerCase();
      const t = String(track?.title || '').toLowerCase().trim();
      const a = String(track?.artist || '').toLowerCase().trim();
      if (t || a) return `${t}__${a}`;
      return idPart || 'unknown';
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
      const off = this.currentTrackKey
        ? this.getUserOffsetSec(this.currentTrackKey)
        : Number(this.timeOffsetSec || 0);

      const badge = document.getElementById('npKaraokeOffsetBadge');
      if (badge) {
        if (Math.abs(off) < 0.05) {
          badge.textContent = '0.0s';
          badge.classList.remove('active');
        } else {
          const sign = off > 0 ? '+' : '';
          badge.textContent = `${sign}${off.toFixed(1)}s`;
          badge.classList.add('active');
        }
      }
      const compatBadge = document.getElementById('npKaraokeSyncOffsetBadge');
      if (compatBadge) {
        if (Math.abs(off) < 0.05) {
          compatBadge.textContent = 'Sincro Auto';
          compatBadge.classList.remove('adjusted');
        } else {
          compatBadge.textContent = `Sincro ${off > 0 ? '+' : ''}${off.toFixed(1)}s`;
          compatBadge.classList.add('adjusted');
        }
      }
    }

    _syncTranslateBtnUI() {
      this._syncToolbarUI();
    }

    _renderSyncControlsUI() {
      this._syncToolbarUI();
    }

    syncLineToCurrentAudio(lineIdx) {
      if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.seekToKaraokeLine === 'function') {
        return window.DiscoverHomeApp.seekToKaraokeLine(lineIdx);
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
      this.activeLineIndex = -1;
      if (typeof dualStreamEngine !== 'undefined' && dualStreamEngine) {
        this.syncTime(dualStreamEngine.getCurrentSongTimeSec(), { forceScroll: true });
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
      if (!cleaned) return '';
      if (/\b(fito\s+y\s+fitipaldis|jesse\s*(?:&|y)\s*joy|andy\s*(?:&|y)\s*lucas|wisin\s*(?:&|y)\s*yandel|cali\s+y\s+el\s+dandee|chino\s*(?:&|y)\s*nacho|zion\s*(?:&|y)\s*lennox|platero\s+y\s+t[uú]|alaska\s+y\s+dinarama|alaska\s+y\s+los\s+pegamoides|mau\s+y\s+ricky|v[ií]ctor\s+y\s+leo|simon\s*(?:&|and)\s*garfunkel|hall\s*(?:&|and)\s*oates|earth\s*,\s*wind\s*(?:&|and)\s*fire|guns\s+n'?\s*roses|ac\/dc)\b/i.test(cleaned)) {
        return cleaned;
      }
      const parts = cleaned.split(/\s*(?:,|&|\/|;| x | and | y | con | feat\.? | ft\.? )\s*/i);
      return (parts[0] || cleaned).trim();
    }

    _isSoundtrackOrGenericArtist(artistStr) {
      const norm = this._normMatch(artistStr);
      if (!norm || norm.length < 2) return true;
      return /^(el rey leon|aladdin|tarzan|vaiana|moana|la sirenita|el libro de la selva|blancanieves|31 minutos|dragon ball|digimon|villancicos|glee|violetta|artista|todos|varios|bso|soundtrack|disney)$/.test(norm);
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

    _formatMmSs(sec) {
      const s = Math.max(0, Math.floor(Number(sec) || 0));
      const m = Math.floor(s / 60);
      const r = String(s % 60).padStart(2, '0');
      return `${m}:${r}`;
    }

    _isCreditOrMetadataLine(cleanText, timeSec = 0, track = null) {
      const s = String(cleanText || '').trim();
      if (!s) return true;
      if (/^[\s♪♫▲●•*~_\-—–.=+()\[\]{}\/\\|:]+$/.test(s)) return true;
      if (/^(?:instrumental|music|interlude|intro|outro|solo)$/i.test(s.replace(/[\[\]\(\)~*\s]/g, ''))) return true;
      if (/^(?:作[词詞曲]|编曲|編曲|制作人|製作人|监制|監製|混音|母带|母帶|出品|发行|發行|词[：:\s]|曲[：:\s]|唱[：:\s]|和[声聲]|吉他|贝斯|鼓[手:]|钢琴|鋼琴|录音|錄音|统筹|統籌)/.test(s)) {
        return true;
      }
      if (/^(?:lyrics?|words?|music|composed|arranged|produced|mixed|mastered|recorded|letra|m[uú]sica|compositor|producci[oó]n|synced|lrc|editor|by|offset|al|ar|ti|au|length)\s*(?:by|de|por)?\s*[:：\-]/i.test(s)) {
        return true;
      }
      if (/\b(?:synced by|lrc by|timed by|provided by|qq\s*music|netease)\b/i.test(s)) return true;
      if (/\bhttps?:\/\/|\bwww\.[a-z0-9.-]+\.[a-z]{2,}\b/i.test(s)) return true;

      if (timeSec < 7.0 && track && (s.includes(' - ') || s.includes(' — '))) {
        const nLine = this._normMatch(s);
        const nTitle = this._normMatch(this._cleanSearchTerm(track.title || ''));
        const nArtist = this._normMatch(this._extractPrimaryArtist(track.artist || ''));
        if (nTitle && nLine.includes(nTitle) && (!nArtist || nLine.includes(nArtist))) {
          return true;
        }
      }
      return false;
    }

    parseLrc(lrcText, options = {}) {
      const track = options.track || null;
      const rawStr = String(lrcText || '');
      const lines = rawStr.split(/\r?\n/);
      const parsed = [];
      let headerOffsetSec = 0;
      const offsetMatch = rawStr.match(/\[offset:\s*([+-]?\d+)\s*\]/i);
      if (offsetMatch) {
        const rawMs = parseInt(offsetMatch[1], 10) || 0;
        headerOffsetSec = Math.max(-30, Math.min(30, rawMs / 1000));
      }
      let lrcDeclaredLengthSec = 0;
      const lenMatch = rawStr.match(/\[length:\s*(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\s*\]/i);
      if (lenMatch) {
        lrcDeclaredLengthSec = (parseInt(lenMatch[1], 10) || 0) * 60 + (parseInt(lenMatch[2], 10) || 0);
      }

      const lineTimeRe = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
      const wordTimeRe = /<(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?>/g;

      for (const rawLine of lines) {
        const matches = [...rawLine.matchAll(lineTimeRe)];
        if (matches.length === 0) continue;
        const afterLineTags = rawLine.replace(lineTimeRe, '').trim();
        if (!afterLineTags) continue;

        wordTimeRe.lastIndex = 0;
        const wordTagMatches = [...afterLineTags.matchAll(wordTimeRe)];
        const cleanText = repairSpanishBrokenAccents(
          afterLineTags.replace(wordTimeRe, '').replace(/\s+/g, ' ').trim()
        );
        if (!cleanText || cleanText.includes('\ufffd') || /[\u0080-\u009f]/.test(cleanText)) continue;

        let parsedWordsTemplate = null;
        if (wordTagMatches.length >= 1) {
          parsedWordsTemplate = [];
          for (let wi = 0; wi < wordTagMatches.length; wi++) {
            const wm = wordTagMatches[wi];
            const wMin = parseInt(wm[1], 10) || 0;
            const wSec = parseInt(wm[2], 10) || 0;
            const wFrac = String(wm[3] || '0').padEnd(3, '0').slice(0, 3);
            const wMs = parseInt(wFrac, 10) || 0;
            const wTSec = Math.max(0, wMin * 60 + wSec + wMs / 1000 - headerOffsetSec);
            const tokStart = wm.index + wm[0].length;
            const tokEnd = (wi + 1 < wordTagMatches.length) ? wordTagMatches[wi + 1].index : afterLineTags.length;
            const segText = repairSpanishBrokenAccents(afterLineTags.slice(tokStart, tokEnd));
            if (segText.trim() && !segText.includes('\ufffd') && !/[\u0080-\u009f]/.test(segText)) {
              parsedWordsTemplate.push({
                timeSec: +wTSec.toFixed(3),
                text: segText
              });
            }
          }
          if (parsedWordsTemplate.length === 0) parsedWordsTemplate = null;
        }

        for (const m of matches) {
          const min = parseInt(m[1], 10) || 0;
          const sec = parseInt(m[2], 10) || 0;
          const fracStr = String(m[3] || '0').padEnd(3, '0').slice(0, 3);
          const ms = parseInt(fracStr, 10) || 0;
          const tSec = Math.max(0, min * 60 + sec + ms / 1000 - headerOffsetSec);
          if (this._isCreditOrMetadataLine(cleanText, tSec, track)) continue;

          const entry = {
            timeSec: +tSec.toFixed(2),
            text: cleanText
          };
          if (parsedWordsTemplate && matches.length === 1) {
            entry.words = parsedWordsTemplate.map(w => ({ ...w }));
          }
          parsed.push(entry);
        }
      }

      parsed.sort((a, b) => a.timeSec - b.timeSec);
      const deduped = [];
      for (const item of parsed) {
        const prev = deduped[deduped.length - 1];
        if (prev && Math.abs(item.timeSec - prev.timeSec) < 0.08 && item.text === prev.text) continue;
        deduped.push(item);
      }
      for (let i = 0; i < deduped.length; i++) {
        const nextT = (i + 1 < deduped.length) ? deduped[i + 1].timeSec : (deduped[i].timeSec + 4.2);
        deduped[i].endTimeSec = +Math.max(deduped[i].timeSec + 0.5, Math.min(deduped[i].timeSec + 6.5, nextT - 0.08)).toFixed(2);
      }
      if (lrcDeclaredLengthSec > 0) {
        deduped._lrcLengthSec = lrcDeclaredLengthSec;
      }
      return deduped;
    }

    convertNativeLyricsArrayToLines(nativeLyrics) {
      if (!Array.isArray(nativeLyrics) || nativeLyrics.length === 0) return [];
      const rawJsonCheck = JSON.stringify(nativeLyrics);
      if (rawJsonCheck.includes('\ufffd') || /[\u0080-\u009f]/.test(rawJsonCheck)) return [];

      const lines = [];
      for (const verse of nativeLyrics) {
        if (!Array.isArray(verse) || verse.length === 0) continue;
        let lineText = '';
        let firstTimeSec = null;
        let lastEndSec = 0;
        const words = [];

        for (const syl of verse) {
          if (!syl) continue;
          const rawSec = Number.isFinite(Number(syl.time)) ? Number(syl.time) : 0;
          const tSec = Math.max(0, rawSec / 1000);
          const durSec = Math.max(0.12, (Number(syl.dur) || 260) / 1000);
          const rawT = repairSpanishBrokenAccents(String(syl.text !== undefined && syl.text !== null ? syl.text : ''));
          const cleanToken = rawT.replace(/~/g, '');
          if (!cleanToken.trim()) continue;
          if (firstTimeSec === null) firstTimeSec = tSec;
          lastEndSec = Math.max(lastEndSec, tSec + durSec);
          words.push({ timeSec: +tSec.toFixed(3), text: cleanToken });
          lineText += cleanToken;
        }
        const finalTxt = repairSpanishBrokenAccents(lineText.replace(/\s+/g, ' ').trim());
        if (firstTimeSec !== null && finalTxt && !/^[\s♪♫▲*~.\-]+$/.test(finalTxt)) {
          lines.push({
            timeSec: +firstTimeSec.toFixed(2),
            endTimeSec: +Math.max(firstTimeSec + 0.5, lastEndSec).toFixed(2),
            text: finalTxt,
            words: words.length > 1 ? words : undefined,
            elasticOffsetSec: 0
          });
        }
      }
      lines.sort((a, b) => a.timeSec - b.timeSec);
      for (let i = 0; i < lines.length; i++) {
        if (i + 1 < lines.length) {
          lines[i].endTimeSec = +Math.min(lines[i].endTimeSec, Math.max(lines[i].timeSec + 0.4, lines[i + 1].timeSec - 0.08)).toFixed(2);
        }
      }
      return lines;
    }

    async _tryLoadNativeChartLyrics(track) {
      if (!track) return null;
      if (Array.isArray(track.notes) && track.notes.some(n => {
        const s = String(n?.lyric || n?.text || n?.syllable || '');
        return s.includes('\ufffd') || /[\u0080-\u009f]/.test(s);
      })) {
        return null;
      }

      const rawId = String(track.id || '').replace(/^top_/, '').replace(/^comm_/, '');
      let rawLyrics = (Array.isArray(track.lyrics) && track.lyrics.length > 0)
        ? track.lyrics
        : (track.chartData && Array.isArray(track.chartData.lyrics) && track.chartData.lyrics.length > 0 ? track.chartData.lyrics : null);

      if (!rawLyrics && typeof window.IndexedDBStorage !== 'undefined' && typeof window.IndexedDBStorage.getChart === 'function') {
        try {
          const cached = await window.IndexedDBStorage.getChart(track.id).catch(() => null) ||
                         await window.IndexedDBStorage.getChart(`top_${rawId}`).catch(() => null) ||
                         await window.IndexedDBStorage.getChart(rawId).catch(() => null);
          if (cached && Array.isArray(cached.lyrics) && cached.lyrics.length > 0) {
            rawLyrics = cached.lyrics;
          }
        } catch (_) {}
      }

      if (!rawLyrics) {
        const bundledTopCharts = new Set(['david_bustamante_abrazame_muy_fuerte.json']);
        const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
        if (track.chart_url && bundledTopCharts.has(track.chart_url)) {
          try {
            const resp = await fetch(`./songs/${track.chart_url}`);
            if (resp.ok) {
              const j = await resp.json();
              if (j && Array.isArray(j.lyrics) && j.lyrics.length > 0) rawLyrics = j.lyrics;
            }
          } catch (_) {}
        } else if (String(track.id || '').startsWith('comm_') && rawId) {
          try {
            const resp = await fetch(`${baseUrl}/songs/${encodeURIComponent(rawId)}/chart.json`);
            if (resp.ok) {
              const j = await resp.json();
              if (j && Array.isArray(j.lyrics) && j.lyrics.length > 0) rawLyrics = j.lyrics;
            }
          } catch (_) {}
        }
      }

      if (rawLyrics) {
        const converted = this.convertNativeLyricsArrayToLines(rawLyrics);
        if (converted.length >= 4) {
          return converted;
        }
      }
      return null;
    }

    _estimateChorusSecFromLyrics(lines, totalDurationSec = 195) {
      if (Array.isArray(lines) && lines.length >= 6) {
        const counts = new Map();
        for (const l of lines) {
          const norm = this._normMatch(l.text);
          if (norm.split(' ').length < 2) continue;
          counts.set(norm, (counts.get(norm) || 0) + 1);
        }
        const firstChorusLine = lines.find(l => {
          const norm = this._normMatch(l.text);
          return l.timeSec >= 18 && l.timeSec <= Math.min(totalDurationSec * 0.65, 110) && (counts.get(norm) || 0) >= 2;
        });
        if (firstChorusLine) {
          return +Math.max(15, firstChorusLine.timeSec).toFixed(1);
        }
      }
      return Math.round(Math.max(26, Math.min(62, totalDurationSec * 0.27)));
    }

    buildFallbackSyncedLines(plainText, totalDurationSec = 195, track = null) {
      const rawLines = String(plainText || '')
        .split(/\r?\n/)
        .map(l => repairSpanishBrokenAccents(l.trim()))
        .filter(l => l && !l.includes('\ufffd') && !/[\u0080-\u009f]/.test(l));

      if (rawLines.length > 0) {
        const startOffset = Math.min(12, Math.max(4, totalDurationSec * 0.05));
        const usableSpan = Math.max(40, totalDurationSec - startOffset - 10);
        const step = usableSpan / Math.max(1, rawLines.length);
        return rawLines.map((text, idx) => ({
          timeSec: +(startOffset + idx * step).toFixed(2),
          endTimeSec: +(startOffset + (idx + 1) * step - 0.1).toFixed(2),
          text
        }));
      }

      const title = repairSpanishBrokenAccents(track?.title || 'Canción');
      const artist = repairSpanishBrokenAccents(track?.artist || 'Artista');
      const chorusSec = Math.round(Math.max(30, Math.min(62, totalDurationSec * 0.28)));
      return [
        { timeSec: 0, endTimeSec: 8, text: `${title} — ${artist}`, _isFallbackPlaceholder: true },
        { timeSec: 8, endTimeSec: Math.max(15, Math.round(chorusSec * 0.55)), text: 'Introducción instrumental · Siente el pulso del piano', _isFallbackPlaceholder: true },
        { timeSec: Math.max(16, Math.round(chorusSec * 0.55)), endTimeSec: chorusSec, text: 'Desarrollo melódico · Preparando entrada principal', _isFallbackPlaceholder: true },
        { timeSec: chorusSec, endTimeSec: chorusSec + 18, text: `Sección Principal — ${title}`, _isFallbackPlaceholder: true },
        { timeSec: chorusSec + 18, endTimeSec: Math.round(totalDurationSec * 0.58), text: 'Sección rítmica central · Mantén la cadencia', _isFallbackPlaceholder: true },
        { timeSec: Math.round(totalDurationSec * 0.58), endTimeSec: Math.round(totalDurationSec * 0.72), text: 'Puente armónico · Variación de intensidad', _isFallbackPlaceholder: true },
        { timeSec: Math.round(totalDurationSec * 0.72), endTimeSec: Math.round(totalDurationSec * 0.88), text: `Clímax Final — ${title}`, _isFallbackPlaceholder: true },
        { timeSec: Math.round(totalDurationSec * 0.88), endTimeSec: totalDurationSec, text: 'Coda final y resolución', _isFallbackPlaceholder: true }
      ];
    }

    _extractVocalPhrasesFromLines(parsedLines, maxPhrases = 80) {
      if (!Array.isArray(parsedLines) || parsedLines.length === 0) return [];
      const phrases = [];
      let prevTimeSec = 0;
      for (let i = 0; i < parsedLines.length; i++) {
        if (phrases.length >= maxPhrases) break;
        const line = parsedLines[i];
        const txt = String(line?.text || '').trim();
        if (txt.length < 2 || /^[\(\[♪♫]/.test(txt)) continue;
        const t = Number(line.timeSec) || 0;
        let tNext = null;
        for (let k = i + 1; k < parsedLines.length; k++) {
          const nxtTxt = String(parsedLines[k]?.text || '').trim();
          if (nxtTxt.length >= 2 && !/^[\(\[♪♫]/.test(nxtTxt)) {
            tNext = Number(parsedLines[k].timeSec) || null;
            break;
          }
        }
        const estLen = Math.min(4.2, Math.max(1.5, txt.length * 0.085));
        const tEnd = tNext !== null ? Math.min(t + estLen, Math.max(t + 0.8, tNext - 0.15)) : (t + estLen);
        const gapPrev = phrases.length > 0 ? Math.max(0, t - prevTimeSec) : t;
        prevTimeSec = t;
        phrases.push({ lineIdx: i, ps: t, pe: tEnd, pnext: tNext, gapPrev });
      }
      return phrases;
    }

    _scoreCandidateItem(item, parsed, targetDurationSec = 195, track = null) {
      if (!parsed || parsed.length < 3) return { score: -999, titleMatched: false, artistMatched: false };

      const repTitle = repairSpanishBrokenAccents(track?.title || '');
      const repArtist = repairSpanishBrokenAccents(track?.artist || '');
      const rawTrackTitleLower = repTitle.toLowerCase();
      const qCombinedNorm = this._normMatch(`${repTitle} ${repArtist}`);
      const cleanTitleNorm = this._normMatch(this._cleanSearchTerm(repTitle));
      const primaryArtistNorm = this._normMatch(this._extractPrimaryArtist(repArtist));
      const fullArtistNorm = this._normMatch(this._cleanSearchTerm(repArtist));
      const isSoundtrackArtist = this._isSoundtrackOrGenericArtist(repArtist);

      const rawCandTitle = repairSpanishBrokenAccents(item.trackName || item.name || '');
      const rawCandAlbum = repairSpanishBrokenAccents(item.albumName || '');
      const candMetaLower = `${rawCandTitle} ${rawCandAlbum}`.toLowerCase();
      const itemTitleNorm = this._normMatch(rawCandTitle);
      const cleanCandTitleNorm = this._normMatch(this._cleanSearchTerm(rawCandTitle));
      const itemArtistNorm = this._normMatch(repairSpanishBrokenAccents(item.artistName || ''));
      const itemPrimaryArtistNorm = this._normMatch(this._extractPrimaryArtist(item.artistName || ''));
      const itemAlbumNorm = this._normMatch(rawCandAlbum);

      let score = item._isBuiltInCustom ? 220 : 0;
      let titleMatched = Boolean(item._isBuiltInCustom);
      let artistMatched = Boolean(item._isBuiltInCustom);

      const titleStop = new Set(['the', 'and', 'for', 'with', 'los', 'las', 'del', 'una', 'por', 'con', 'para', 'de', 'la', 'el', 'en', 'un', 'al', 'lo']);
      const titleWords = cleanTitleNorm.split(' ').filter(w => w.length >= 2 && !titleStop.has(w));
      if (!item._isBuiltInCustom && cleanTitleNorm && itemTitleNorm) {
        if (itemTitleNorm === cleanTitleNorm || cleanCandTitleNorm === cleanTitleNorm) {
          score += 80;
          titleMatched = true;
        } else if (itemTitleNorm.includes(cleanTitleNorm) || cleanTitleNorm.includes(itemTitleNorm) || (cleanCandTitleNorm && (cleanCandTitleNorm.includes(cleanTitleNorm) || cleanTitleNorm.includes(cleanCandTitleNorm)))) {
          score += 56;
          titleMatched = true;
        } else if (titleWords.length > 0) {
          let matchedWords = 0;
          for (const tw of titleWords) {
            if (itemTitleNorm.includes(tw) || (tw.length >= 5 && itemTitleNorm.split(' ').some(iw => Math.abs(iw.length - tw.length) <= 1 && (iw.startsWith(tw.slice(0, 4)) || tw.startsWith(iw.slice(0, 4)))))) {
              matchedWords++;
            }
          }
          if (matchedWords > 0) {
            score += Math.round((matchedWords / titleWords.length) * 42);
            if (matchedWords / titleWords.length >= 0.5) titleMatched = true;
          } else {
            if (!primaryArtistNorm || !itemArtistNorm.includes(primaryArtistNorm)) {
              return { score: -999, titleMatched: false, artistMatched: false };
            }
            score -= 55;
          }
        }
      }

      if (!item._isBuiltInCustom) {
        if (isSoundtrackArtist) {
          if (primaryArtistNorm && (itemAlbumNorm.includes(primaryArtistNorm) || itemArtistNorm.includes(primaryArtistNorm) || itemTitleNorm.includes(primaryArtistNorm))) {
            score += 45;
            artistMatched = true;
          } else if (titleMatched) {
            score += 20;
            artistMatched = true;
          }
        } else if (primaryArtistNorm && itemArtistNorm) {
          const reqTokens = primaryArtistNorm.split(' ').filter(Boolean);
          const candTokens = (itemPrimaryArtistNorm || itemArtistNorm).split(' ').filter(Boolean);
          const firstReq = reqTokens[0] || '';
          const firstCand = candTokens[0] || '';

          if (
            itemArtistNorm === primaryArtistNorm ||
            itemPrimaryArtistNorm === primaryArtistNorm ||
            itemArtistNorm.includes(primaryArtistNorm) ||
            primaryArtistNorm.includes(itemArtistNorm) ||
            (fullArtistNorm && (itemArtistNorm.includes(fullArtistNorm) || fullArtistNorm.includes(itemArtistNorm))) ||
            (firstReq.length >= 4 && firstReq === firstCand && (reqTokens.length === 1 || candTokens.length === 1))
          ) {
            score += 65;
            artistMatched = true;
          } else if (firstReq.length >= 3 && firstCand.length >= 3 && firstReq !== firstCand && reqTokens.length >= 2 && candTokens.length >= 2 && reqTokens[reqTokens.length - 1] === candTokens[candTokens.length - 1]) {
            score -= 95;
            artistMatched = false;
          } else {
            const artistTokens = fullArtistNorm.split(' ').filter(w => w.length >= 4);
            const sharedFirstToken = firstReq.length >= 4 && itemArtistNorm.includes(firstReq);
            const sharedToken = artistTokens.some(tok => itemArtistNorm.includes(tok));
            if (sharedFirstToken) {
              score += 42;
              artistMatched = true;
            } else if (sharedToken && reqTokens.length === 1) {
              score += 28;
              artistMatched = true;
            } else {
              score -= 45;
            }
          }
        }
      }

      const badVersionRe = /\b(remake|remix|rmx|live|en\s*vivo|en\s*directo|ao\s*vivo|cover|karaoke|tribute|parody|sped\s*up|slowed|nightcore|acustico|acoustic|instrumental)\b/i;
      if (badVersionRe.test(candMetaLower) && !badVersionRe.test(rawTrackTitleLower) && !badVersionRe.test(qCombinedNorm)) {
        score -= 160;
      }
      const liveBanterRe = /\b(con nosotros familia|palmas arriba|todo el mundo cantando|en vivo desde|estadio river|muchas gracias buenas noches|como dice|fuerte el aplauso)\b/i;
      if (liveBanterRe.test(item.syncedLyrics) && !badVersionRe.test(rawTrackTitleLower)) {
        score -= 140;
      }

      const hasRealDur = Number.isFinite(targetDurationSec) && targetDurationSec > 38;
      const itemDur = Number(item.duration) || Number(parsed._lrcLengthSec) || (parsed[parsed.length - 1].timeSec + 8);
      if (hasRealDur && Number.isFinite(itemDur) && itemDur > 38) {
        const durDiff = Math.abs(itemDur - targetDurationSec);
        if (durDiff <= 1.5) score += 140;
        else if (durDiff <= 3.0) score += 105;
        else if (durDiff <= 6.0) score += 55;
        else if (durDiff <= 12.0) score += 10;
        else if (durDiff > 15.0) score -= Math.min(220, Math.round(durDiff * 8));
      }

      if (parsed.length >= 15) score += 6;
      if (parsed.some(p => Array.isArray(p.words) && p.words.length > 1)) score += 10;

      return { score, titleMatched, artistMatched };
    }

    _computeEnvelopeFromAudioBuffer(audioBuf) {
      if (!audioBuf) return null;
      const sr = Number(audioBuf.sampleRate) || 44100;
      const ch0 = audioBuf.getChannelData(0);
      const ch1 = (audioBuf.numberOfChannels > 1) ? audioBuf.getChannelData(1) : null;
      const dur = Number(audioBuf.duration) || (ch0.length / sr);
      if (!ch0 || ch0.length < sr * 2 || !Number.isFinite(dur) || dur < 2) return null;

      const FRAME_HZ = 10;
      const nFrames = Math.max(20, Math.floor(dur * FRAME_HZ));
      const step = Math.max(1, Math.floor(sr / 11025));
      const srEff = sr / step;

      // Filtro paso banda vocal (300 Hz - 2600 Hz) en canal central (L+R)/2
      const dt = 1 / srEff;
      const rcHp = 1 / (2 * Math.PI * 300);
      const aHp = rcHp / (rcHp + dt);
      const rcLp = 1 / (2 * Math.PI * 2600);
      const aLp = dt / (rcLp + dt);

      let prevIn = 0;
      let hpOut = 0;
      let lpOut = 0;

      const rawTotal = new Float32Array(nFrames);
      const rawVoice = new Float32Array(nFrames);
      const nonZeroTotal = [];
      const nonZeroVoice = [];

      for (let f = 0; f < nFrames; f++) {
        const sStart = Math.floor((f / FRAME_HZ) * sr);
        const sEnd = Math.min(ch0.length, Math.floor(((f + 1) / FRAME_HZ) * sr));
        let sumTotal = 0;
        let sumVoice = 0;
        let cnt = 0;
        for (let s = sStart; s < sEnd; s += step) {
          const mono = ch1 ? 0.5 * (ch0[s] + ch1[s]) : ch0[s];
          sumTotal += mono * mono;
          hpOut = aHp * (hpOut + mono - prevIn);
          prevIn = mono;
          lpOut = lpOut + aLp * (hpOut - lpOut);
          sumVoice += lpOut * lpOut;
          cnt++;
        }
        const rmsT = cnt > 0 ? Math.sqrt(sumTotal / cnt) : 0;
        const rmsV = cnt > 0 ? Math.sqrt(sumVoice / cnt) : 0;
        rawTotal[f] = rmsT;
        rawVoice[f] = rmsV;
        if (rmsT > 0.0005) nonZeroTotal.push(rmsT);
        if (rmsV > 0.0003) nonZeroVoice.push(rmsV);
      }

      if (nonZeroTotal.length < 10) return null;
      nonZeroTotal.sort((a, b) => a - b);
      nonZeroVoice.sort((a, b) => a - b);
      const p90T = nonZeroTotal[Math.min(nonZeroTotal.length - 1, Math.floor(nonZeroTotal.length * 0.90))] || 0.1;
      const p90V = nonZeroVoice[Math.min(nonZeroVoice.length - 1, Math.floor(nonZeroVoice.length * 0.90))] || p90T * 0.5;

      const envTotal = new Float32Array(nFrames);
      const envVoice = new Float32Array(nFrames);
      for (let f = 0; f < nFrames; f++) {
        const lT = Math.min(1.5, rawTotal[Math.max(0, f - 1)] / p90T);
        const cT = Math.min(1.5, rawTotal[f] / p90T);
        const rT = Math.min(1.5, rawTotal[Math.min(nFrames - 1, f + 1)] / p90T);
        envTotal[f] = 0.25 * lT + 0.5 * cT + 0.25 * rT;

        const lV = Math.min(1.5, rawVoice[Math.max(0, f - 1)] / Math.max(1e-5, p90V));
        const cV = Math.min(1.5, rawVoice[f] / Math.max(1e-5, p90V));
        const rV = Math.min(1.5, rawVoice[Math.min(nFrames - 1, f + 1)] / Math.max(1e-5, p90V));
        envVoice[f] = 0.25 * lV + 0.5 * cV + 0.25 * rV;
      }

      let leadSilenceSec = 0;
      for (let f = 0; f < nFrames - 3; f++) {
        if (envTotal[f] >= 0.07 && envTotal[f + 1] >= 0.07 && envTotal[f + 2] >= 0.07) {
          leadSilenceSec = +(f / FRAME_HZ).toFixed(2);
          break;
        }
      }

      let musicStartSec = leadSilenceSec;
      for (let f = 0; f < nFrames - 15; f++) {
        let avg = 0;
        for (let k = 0; k < 15; k++) avg += envTotal[f + k];
        if (avg / 15 >= 0.16) {
          musicStartSec = +(f / FRAME_HZ).toFixed(2);
          break;
        }
      }

      let musicEndSec = +dur.toFixed(2);
      for (let f = nFrames - 1; f >= 15; f--) {
        let avg = 0;
        for (let k = 0; k < 15; k++) avg += envTotal[f - k];
        if (avg / 15 >= 0.12) {
          musicEndSec = +((f + 1) / FRAME_HZ).toFixed(2);
          break;
        }
      }

      return {
        frameHz: FRAME_HZ,
        actualDur: +dur.toFixed(2),
        envTotal,
        envVoice,
        leadSilenceSec,
        musicStartSec,
        musicEndSec: Math.max(musicStartSec + 10, musicEndSec),
        activeSpanSec: Math.max(10, +(musicEndSec - musicStartSec).toFixed(2))
      };
    }

    async _extractDspEnvelope(blob) {
      if (!blob || blob.size < 40000 || blob.size > 24 * 1024 * 1024) return null;
      if (this.dspEnvelopeCache.has(blob)) {
        return this.dspEnvelopeCache.get(blob);
      }
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        if (!window._lyricsAnalysisAudioCtx) {
          window._lyricsAnalysisAudioCtx = new AudioCtx();
        }
        const ctx = window._lyricsAnalysisAudioCtx;
        const ab = await blob.slice(0).arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(ab.slice(0));
        const env = this._computeEnvelopeFromAudioBuffer(audioBuf);
        if (env) this.dspEnvelopeCache.set(blob, env);
        return env;
      } catch (_) {
        return null;
      }
    }

    _scoreAlignmentOnEnvelope(lines, env, shiftSec, scale = 1.0) {
      if (!Array.isArray(lines) || lines.length === 0 || !env) return -999;
      const { frameHz, envTotal, envVoice, musicStartSec, musicEndSec, actualDur } = env;
      const maxFrame = envTotal.length - 1;

      const sampleWindow = (arr, tStartSec, tEndSec) => {
        const f0 = Math.max(0, Math.min(maxFrame, Math.floor(tStartSec * frameHz)));
        const f1 = Math.max(f0, Math.min(maxFrame, Math.ceil(tEndSec * frameHz)));
        let sum = 0;
        let cnt = 0;
        for (let f = f0; f <= f1; f++) {
          sum += arr[f];
          cnt++;
        }
        return cnt > 0 ? (sum / cnt) : 0;
      };

      const step = Math.max(1, Math.floor(lines.length / 65));
      let sungVoiceSum = 0;
      let onsetSum = 0;
      let onsetCount = 0;
      let checked = 0;
      let outOfBounds = 0;
      let deadAir = 0;

      for (let i = 0; i < lines.length; i += step) {
        const l = lines[i];
        const t = l.timeSec * scale + shiftSec;
        const tEnd = Math.min(actualDur - 0.1, t + 1.4);
        checked++;

        if (t < musicStartSec - 0.8 || t > musicEndSec + 0.5) {
          outOfBounds++;
        }
        if (t >= 0 && t < actualDur) {
          const eTot = sampleWindow(envTotal, t, tEnd);
          const eVoc = sampleWindow(envVoice, t, tEnd);
          const blended = 0.72 * eVoc + 0.28 * eTot;
          sungVoiceSum += blended;
          if (eTot < 0.055) deadAir++;
          const prevGapSec = i === 0 ? 1.5 : ((l.timeSec - (lines[i - 1].endTimeSec || lines[i - 1].timeSec)) * scale);
          if (prevGapSec >= 0.7 && t >= 0.8) {
            const eBefore = sampleWindow(envVoice, t - 0.75, t - 0.15);
            onsetSum += (eVoc - eBefore);
            onsetCount++;
          }
        } else {
          outOfBounds++;
          deadAir++;
        }
      }

      let gapVoiceSum = 0;
      let gapCount = 0;
      for (let i = 0; i < lines.length - 1; i++) {
        const endCur = Number(lines[i].endTimeSec || (lines[i].timeSec + 3.0));
        const gap = (lines[i + 1].timeSec - endCur) * scale;
        if (gap >= 5.0) {
          const mid = ((endCur + lines[i + 1].timeSec) * 0.5) * scale + shiftSec;
          if (mid >= musicStartSec && mid <= musicEndSec - 1) {
            gapVoiceSum += sampleWindow(envVoice, mid - 1.0, mid + 1.0);
            gapCount++;
          }
        }
      }

      const sungAvg = checked > 0 ? (sungVoiceSum / checked) : 0;
      const onsetAvg = onsetCount > 0 ? (onsetSum / onsetCount) : 0;
      const gapAvg = gapCount > 0 ? (gapVoiceSum / gapCount) : (sungAvg * 0.5);
      const oobFrac = checked > 0 ? (outOfBounds / checked) : 0;
      const deadFrac = checked > 0 ? (deadAir / checked) : 0;
      const shiftPrior = Math.abs(shiftSec) < 0.75 ? 0 : Math.min(0.14, Math.abs(shiftSec) * 0.0014);

      return sungAvg + 0.35 * onsetAvg - 0.35 * gapAvg - 2.4 * oobFrac - 1.2 * deadFrac - shiftPrior;
    }

    _computeDspAlignment(parsedLines, declaredDur, env) {
      if (!Array.isArray(parsedLines) || parsedLines.length < 3 || !env) {
        return { shiftSec: 0, scale: 1.0, score: 0, lines: parsedLines };
      }

      const firstVocalSec = parsedLines[0].timeSec;
      const lastVocalSec = parsedLines[parsedLines.length - 1].timeSec;
      const lrcDur = Number(declaredDur) || (lastVocalSec + 8);
      const durDiff = env.actualDur - lrcDur;
      const activeSpanDiff = Math.abs(env.activeSpanSec - lrcDur);

      const objZero = this._scoreAlignmentOnEnvelope(parsedLines, env, 0, 1.0);

      const isCleanMatch = Math.abs(durDiff) <= 4.5 && env.leadSilenceSec < 1.0 && env.musicStartSec <= Math.max(6, firstVocalSec + 2.5);
      const isTrailingOutroCut = durDiff > 6 && env.musicStartSec < Math.max(4.0, firstVocalSec + 2.0) && activeSpanDiff <= 7.0;

      const minShift = -Math.min(10, Math.max(2.5, firstVocalSec * 0.75));
      const maxShift = isCleanMatch
        ? 3.0
        : (isTrailingOutroCut ? 6.0 : Math.max(12, Math.min(95, env.actualDur - firstVocalSec - 15)));

      let bestShift = 0;
      let bestScale = 1.0;
      let bestScore = objZero;

      const peaks = [{ shift: 0, score: objZero }];
      const coarseStep = isCleanMatch ? 0.15 : 0.25;
      for (let s = minShift; s <= maxShift; s += coarseStep) {
        const sc = this._scoreAlignmentOnEnvelope(parsedLines, env, s, 1.0);
        if (sc > peaks[peaks.length - 1]?.score || peaks.length < 4) {
          peaks.push({ shift: s, score: sc });
          peaks.sort((a, b) => b.score - a.score);
          if (peaks.length > 4) peaks.length = 4;
        }
      }

      for (const pk of peaks.slice(0, 3)) {
        for (let ds = -0.6; ds <= 0.6; ds += 0.05) {
          const candS = +(pk.shift + ds).toFixed(2);
          if (candS < minShift || candS > maxShift) continue;
          const sc = this._scoreAlignmentOnEnvelope(parsedLines, env, candS, 1.0);
          if (sc > bestScore) {
            bestScore = sc;
            bestShift = candS;
          }
        }
      }

      const durRatio = env.actualDur / Math.max(30, lrcDur);
      const spanRatio = env.activeSpanSec / Math.max(30, lrcDur);
      const hasDurScaleCue = Math.abs(durRatio - 1.0) >= 0.015 && durRatio >= 0.92 && durRatio <= 1.08;
      const hasSpanScaleCue = Math.abs(spanRatio - 1.0) >= 0.015 && spanRatio >= 0.92 && spanRatio <= 1.08 && !isTrailingOutroCut;
      if ((hasDurScaleCue || hasSpanScaleCue) && parsedLines.length >= 8) {
        let bestTempoScore = bestScore;
        let chosenTempoScale = 1.0;
        let chosenTempoShift = bestShift;
        const shiftAnchors = [0];
        if (env.leadSilenceSec >= 0.4) shiftAnchors.push(+env.leadSilenceSec.toFixed(2));
        if (Math.abs(bestShift) >= 1.2) shiftAnchors.push(bestShift);
        const tryShifts = [];
        for (const anchor of shiftAnchors) {
          for (let ds = -1.2; ds <= 1.2; ds += 0.4) {
            const sVal = +(anchor + ds).toFixed(2);
            if (!tryShifts.some(x => Math.abs(x - sVal) < 0.15)) tryShifts.push(sVal);
          }
        }
        for (let scRate = 0.95; scRate <= 1.05; scRate += 0.005) {
          if (Math.abs(scRate - 1.0) < 0.014) continue;
          for (const tryShift of tryShifts) {
            const tSc = this._scoreAlignmentOnEnvelope(parsedLines, env, tryShift, scRate);
            if (tSc > bestTempoScore) {
              bestTempoScore = tSc;
              chosenTempoScale = +scRate.toFixed(3);
              chosenTempoShift = tryShift;
            }
          }
        }
        if (bestTempoScore > bestScore + 0.045 && Math.abs(chosenTempoScale - 1.0) >= 0.014) {
          bestScore = bestTempoScore;
          bestScale = chosenTempoScale;
          bestShift = chosenTempoShift;
        }
      }

      if (isCleanMatch || isTrailingOutroCut) {
        const margin = env.leadSilenceSec >= 1.2 ? 0.05 : 0.14;
        if (bestShift !== 0 && bestScore < objZero + margin) {
          bestShift = 0;
          bestScale = 1.0;
          bestScore = objZero;
        }
      } else if (Math.abs(bestShift) < 0.35 && Math.abs(bestScale - 1.0) < 0.01) {
        bestShift = 0;
        bestScale = 1.0;
      }

      if (bestShift === 0 && bestScale === 1.0) {
        return { shiftSec: 0, scale: 1.0, score: objZero, lines: parsedLines.map(l => ({ ...l, elasticOffsetSec: 0 })) };
      }

      const aligned = parsedLines.map(l => {
        const newT = Math.max(0, +(l.timeSec * bestScale + bestShift).toFixed(2));
        const newEnd = Math.max(newT + 0.4, +(Number(l.endTimeSec || (l.timeSec + 3.5)) * bestScale + bestShift).toFixed(2));
        const out = { timeSec: newT, endTimeSec: newEnd, text: l.text, elasticOffsetSec: 0 };
        if (Array.isArray(l.words)) {
          out.words = l.words.map(w => ({
            timeSec: Math.max(0, +(w.timeSec * bestScale + bestShift).toFixed(3)),
            text: w.text
          }));
        }
        return out;
      });
      return { shiftSec: bestShift, scale: bestScale, score: bestScore, lines: aligned };
    }

    async _precomputePreviewEnvelope(previewUrl) {
      if (!previewUrl || !/^https?:\/\//i.test(previewUrl)) return null;
      if (this.previewEnvCache.has(previewUrl)) return this.previewEnvCache.get(previewUrl);
      const task = (async () => {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 3500);
          const resp = await fetch(previewUrl, { mode: 'cors', signal: ctrl.signal });
          clearTimeout(tid);
          if (!resp.ok) return null;
          const ab = await resp.arrayBuffer();
          if (!ab || ab.byteLength < 10000) return null;
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return null;
          if (!window._lyricsAnalysisAudioCtx) window._lyricsAnalysisAudioCtx = new AudioCtx();
          const audioBuf = await window._lyricsAnalysisAudioCtx.decodeAudioData(ab.slice(0));
          return this._computeEnvelopeFromAudioBuffer(audioBuf);
        } catch (_) {
          return null;
        }
      })();
      this.previewEnvCache.set(previewUrl, task);
      const res = await task;
      if (!res) this.previewEnvCache.delete(previewUrl);
      return res;
    }

    _correlatePreviewEnvelopes(prevEnv, fullEnv) {
      if (!prevEnv || !fullEnv || !prevEnv.envTotal || !fullEnv.envTotal) return null;
      const P_all = prevEnv.envTotal;
      const F = fullEnv.envTotal;
      const trimStart = Math.min(8, Math.floor(P_all.length * 0.1));
      const trimEnd = Math.max(trimStart + 30, P_all.length - 8);
      const M = Math.min(200, trimEnd - trimStart);
      if (M < 30 || F.length <= M + 5) return null;

      let sumP = 0;
      for (let i = 0; i < M; i++) sumP += P_all[trimStart + i];
      const meanP = sumP / M;
      let normP = 0;
      const P = new Float32Array(M);
      for (let i = 0; i < M; i++) {
        const d = P_all[trimStart + i] - meanP;
        P[i] = d;
        normP += d * d;
      }
      if (normP < 1e-4) return null;
      const sqrtNormP = Math.sqrt(normP);

      const corrAt = (startIdx) => {
        let sumF = 0;
        for (let i = 0; i < M; i++) sumF += F[startIdx + i];
        const meanF = sumF / M;
        let dot = 0;
        let normF = 0;
        for (let i = 0; i < M; i++) {
          const d = F[startIdx + i] - meanF;
          dot += d * P[i];
          normF += d * d;
        }
        if (normF < 1e-4) return -1;
        return dot / (sqrtNormP * Math.sqrt(normF));
      };

      const maxStart = F.length - M - 1;
      let bestFrame = 0;
      let bestR = -1;
      const scores = new Float32Array(maxStart + 1);
      for (let f = 0; f <= maxStart; f += 2) {
        const r = corrAt(f);
        scores[f] = r;
        if (r > bestR) {
          bestR = r;
          bestFrame = f;
        }
      }
      for (let df = -3; df <= 3; df++) {
        const f = bestFrame + df;
        if (f >= 0 && f <= maxStart) {
          const r = corrAt(f);
          scores[f] = r;
          if (r > bestR) {
            bestR = r;
            bestFrame = f;
          }
        }
      }

      let secondR = -1;
      for (let f = 0; f <= maxStart; f += 2) {
        if (Math.abs(f - bestFrame) >= 25 && scores[f] > secondR) {
          secondR = scores[f];
        }
      }

      const minGap = bestR >= 0.88 ? 0.015 : (bestR >= 0.72 ? 0.04 : 0.06);
      if (bestR >= 0.48 && ((bestR - secondR) >= minGap || bestR >= 0.90)) {
        let chosenFrame = bestFrame;
        if (bestR >= 0.90 && (bestR - secondR) < minGap) {
          for (let f = 0; f <= maxStart; f += 2) {
            if (scores[f] >= bestR - 0.015) {
              chosenFrame = f;
              break;
            }
          }
        }
        const matchedTrimSec = chosenFrame / fullEnv.frameHz;
        const previewStartSec = Math.max(0, +(matchedTrimSec - (trimStart / prevEnv.frameHz)).toFixed(2));
        return { previewStartSec, confidence: +bestR.toFixed(3) };
      }
      return null;
    }

    async _correlatePreviewOffsetSec(previewUrl, fullTrackBlob) {
      if (!previewUrl || !fullTrackBlob) return null;
      const [prevEnv, fullEnv] = await Promise.all([
        this._precomputePreviewEnvelope(previewUrl),
        this._extractDspEnvelope(fullTrackBlob)
      ]);
      if (!prevEnv || !fullEnv) return null;
      return this._correlatePreviewEnvelopes(prevEnv, fullEnv);
    }

    _pickBestCandidateLines(candidates, targetDurationSec = 0, track = null, dspEnvelope = null) {
      const hasRealDur = Number.isFinite(targetDurationSec) && targetDurationSec > 38;
      if (!hasRealDur) targetDurationSec = 195;
      if (!Array.isArray(candidates) || candidates.length === 0) {
        return this.buildFallbackSyncedLines('', targetDurationSec, track);
      }

      const key = track ? this._makeKey(track) : '';
      const scoredPool = [];
      for (const item of candidates) {
        if (!item || !item.syncedLyrics || !String(item.syncedLyrics).includes('[')) continue;
        const parsed = this.parseLrc(item.syncedLyrics, { track });
        if (parsed.length < 3) continue;
        const meta = this._scoreCandidateItem(item, parsed, targetDurationSec, track);
        if (meta.score <= -500) continue;
        const firstVocalLine = parsed.find(l => l.text && !/^[\(\[♪♫]/.test(l.text.trim())) || parsed[0];
        const firstLineTimeSec = firstVocalLine ? firstVocalLine.timeSec : parsed[0].timeSec;
        const itemDur = Number(item.duration) || Number(parsed._lrcLengthSec) || (parsed[parsed.length - 1].timeSec + 8);
        scoredPool.push({
          item,
          parsed,
          itemDur,
          firstLineTimeSec,
          titleMatched: meta.titleMatched,
          artistMatched: meta.artistMatched,
          textScore: meta.score,
          isBuiltInCustom: Boolean(item._isBuiltInCustom)
        });
      }

      if (scoredPool.length === 0) {
        const withPlain = candidates.find(item => item && item.plainLyrics);
        if (withPlain && withPlain.plainLyrics) {
          return this.buildFallbackSyncedLines(withPlain.plainLyrics, targetDurationSec, track);
        }
        return this.buildFallbackSyncedLines('', targetDurationSec, track);
      }

      const bothMatched = scoredPool.filter(c => c.titleMatched && c.artistMatched && c.textScore >= 40);
      const pool = bothMatched.length > 0 ? bothMatched : scoredPool;
      pool.sort((a, b) => (b.textScore + Math.min(18, b.parsed.length * 0.35)) - (a.textScore + Math.min(18, a.parsed.length * 0.35)));

      let outLines = null;
      let chosenBest = pool[0];
      let chosenDur = pool[0].itemDur;

      if (dspEnvelope) {
        let champion = null;
        for (const cand of pool.slice(0, 6)) {
          const aligned = this._computeDspAlignment(cand.parsed, cand.itemDur, dspEnvelope);
          const combinedQuality = (cand.textScore * 0.45) + (aligned.score * 100);
          if (!champion || combinedQuality > champion.combinedQuality) {
            champion = { ...aligned, cand, combinedQuality };
          }
        }
        if (champion && Array.isArray(champion.lines) && champion.lines.length >= 3) {
          outLines = champion.lines;
          chosenBest = champion.cand;
          chosenDur = dspEnvelope.actualDur || champion.cand.itemDur;
        }
      }

      if (!outLines) {
        let bestCluster = [];
        let bestClusterScore = -999999;
        for (const cand of pool) {
          const cluster = pool.filter(o => Math.abs(o.firstLineTimeSec - cand.firstLineTimeSec) <= 1.5 && Math.abs(o.itemDur - cand.itemDur) <= 4.0);
          const avgMetaScore = cluster.reduce((acc, x) => acc + x.textScore, 0) / cluster.length;
          const clusterRank = (cluster.length * 36) + avgMetaScore + Math.min(20, cand.parsed.length * 0.4);
          if (clusterRank > bestClusterScore) {
            bestClusterScore = clusterRank;
            bestCluster = cluster;
          }
        }
        const chosenPool = bestCluster.length > 0 ? bestCluster : pool;
        chosenPool.sort((a, b) => (b.textScore + Math.min(18, b.parsed.length * 0.35)) - (a.textScore + Math.min(18, a.parsed.length * 0.35)));
        chosenBest = chosenPool[0];
        const durs = chosenPool.map(c => c.itemDur).filter(d => Number.isFinite(d) && d > 40).sort((a, b) => a - b);
        chosenDur = durs.length > 0 ? durs[Math.floor(durs.length / 2)] : chosenBest.itemDur;
        outLines = chosenBest.parsed.map(l => ({ ...l, elasticOffsetSec: 0 }));
      }

      if (key && Array.isArray(outLines) && outLines.length >= 3) {
        this.studioReferenceMap.set(key, {
          studioDur: chosenDur,
          t0: outLines[0].timeSec,
          phrases: this._extractVocalPhrasesFromLines(outLines, 80),
          parsedLines: outLines,
          isBuiltInCustom: Boolean(chosenBest.isBuiltInCustom)
        });
        this.knownLeadingSilenceMap.set(key, 0);
        if (this.currentTrackKey === key) this.autoLeadingSilenceSec = 0;
      }

      return outLines;
    }

    _alignLinesToUltraStarVocalOnsets(lines, vocalOnsetsSec) {
      return false;
    }

    async _fetchTopCatalogChartLyricsOrOnsets(track, key) {
      if (!track) return null;
      if (!this.topVocalOnsetsMap) this.topVocalOnsetsMap = new Map();
      window._topChartJsonMemoryCache = window._topChartJsonMemoryCache || new Map();

      if (!window.RELEASE_TAGS_MAP && typeof window.loadReleaseTagsMap === 'function') {
        await window.loadReleaseTagsMap().catch(() => {});
      }

      let audioFilename = '';
      let preferredTag = '';
      if (typeof dualStreamEngine !== 'undefined' && dualStreamEngine && typeof dualStreamEngine._resolveTopAudio === 'function') {
        const topMatch = dualStreamEngine._resolveTopAudio(track);
        if (topMatch && topMatch.filename) {
          audioFilename = topMatch.filename;
          preferredTag = topMatch.tag || '';
        }
      }
      if (!audioFilename && Array.isArray(window.TOP_SONGS_CATALOG)) {
        const norm = (s) => repairSpanishBrokenAccents(String(s || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
        const tNorm = norm(track.title);
        const aNorm = norm(track.artist);
        if (tNorm) {
          const found = window.TOP_SONGS_CATALOG.find(item => {
            const itT = norm(item.title);
            const itA = norm(item.artist);
            return itT === tNorm && (!aNorm || !itA || itA.includes(aNorm) || aNorm.includes(itA));
          });
          if (found) {
            const rawId = String(found.raw_id || found.id || '').replace(/^top_/, '');
            audioFilename = found.audio_url || (rawId ? `${rawId}.mp3` : '');
          }
        }
      }
      if (!audioFilename) return null;

      const chartFilename = String(audioFilename).replace(/\.mp3$/i, '.json');
      const rawMapEntry = window.RELEASE_TAGS_MAP && window.RELEASE_TAGS_MAP[chartFilename];
      const mapTag = rawMapEntry ? String(Array.isArray(rawMapEntry) ? rawMapEntry[0] : rawMapEntry) : null;
      const exactTag = (typeof window.getReleaseTagForFile === 'function' ? window.getReleaseTagForFile(chartFilename) : null) ||
                       mapTag ||
                       preferredTag ||
                       null;
      const searchTags = exactTag
        ? [exactTag, '9', '8', '3', '4', '5', '6', '7', '10', '11', '12', '13', '14', '15'].filter((v, i, a) => v && a.indexOf(v) === i)
        : ['9', '8', '3', '4', '5', '6', '7', '10', '11', '12', '13', '14', '15'];

      try {
        let chartData = window._topChartJsonMemoryCache.get(chartFilename);
        if (!chartData) {
          for (const tag of searchTags) {
            const rawUrl = `https://github.com/Bruala33/renacer/releases/download/${tag}/${chartFilename}`;
            const proxyUrl = `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(rawUrl)}`;
            try {
              const ctrl = new AbortController();
              const tid = setTimeout(() => ctrl.abort(), 3200);
              const resp = await fetch(proxyUrl, { signal: ctrl.signal });
              clearTimeout(tid);
              if (resp.ok) {
                chartData = await resp.json();
                if (chartData) {
                  window._topChartJsonMemoryCache.set(chartFilename, chartData);
                  break;
                }
              }
            } catch (_) {}
          }
        }
        if (!chartData) return null;

        const rawChartLyrics = Array.isArray(chartData.lyrics) ? chartData.lyrics : (chartData.metadata && Array.isArray(chartData.metadata.lyrics) ? chartData.metadata.lyrics : null);
        if (Array.isArray(rawChartLyrics) && rawChartLyrics.length >= 4) {
          const lines = this.convertNativeLyricsArrayToLines(rawChartLyrics);
          if (lines.length >= 4) {
            return { type: 'lyrics', lines, duration: Number(chartData.duration) || 195 };
          }
        }
      } catch (_) {}
      return null;
    }

    _scorePhraseSetAgainstAudioProfile() {
      return { bestShiftSec: 0, bestSlope: 0, bestScore: 0 };
    }

    _recomputeAudioAlignmentShift(track, key, explicitLines = null) {
      if (!key) return 0;
      this.knownLeadingSilenceMap.set(key, 0);
      if (this.currentTrackKey === key) {
        this.autoLeadingSilenceSec = 0;
      }
      const zeroOut = (arr) => {
        if (!Array.isArray(arr)) return;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i]) arr[i].elasticOffsetSec = 0;
        }
      };
      if (explicitLines) zeroOut(explicitLines);
      if (Array.isArray(this.currentLyrics) && this.currentTrackKey === key) {
        zeroOut(this.currentLyrics);
      }
      return 0;
    }

    _splitWordIntoNaturalPhoneticSyllables(word) {
      const clean = String(word || '').trim();
      if (!clean) return [];
      if (clean.length <= 3) return [clean];

      // Separar puntuación final para pegarla a la última sílaba
      const mPunct = clean.match(/^(.+?)([,.;:?!…)"'\]]*)$/);
      const core = mPunct ? mPunct[1] : clean;
      const tailPunct = mPunct ? mPunct[2] : '';
      if (core.length <= 3) return [clean];

      const isVowel = (ch) => /[aeiouáéíóúüAEIOUÁÉÍÓÚÜyY]/.test(ch);
      const isWeakAccented = (ch) => /[íúÍÚ]/.test(ch);
      const isStrongVowel = (ch) => /[aeoáéóAEOÁÉÓ]/.test(ch);
      const isLiquidCluster = (c1, c2) => {
        const pair = (c1 + c2).toLowerCase();
        return /^(?:bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|tr|ch|ll|rr|qu|gu|sh|th|ph)$/.test(pair);
      };

      // Identificar núcleos vocálicos respetando diptongos y rompiendo hiatos acentuados (ej. "a-hí", "ko-ra-zón", "re-fle-jo")
      const nuclei = [];
      let i = 0;
      while (i < core.length) {
        if (isVowel(core[i])) {
          let start = i;
          let end = i;
          while (end + 1 < core.length) {
            const curV = core[end];
            const nextCh = core[end + 1];
            // H intercalada en hiato (ej. "ahí", "ahora")
            if ((nextCh === 'h' || nextCh === 'H') && end + 2 < core.length && isVowel(core[end + 2])) {
              if (isWeakAccented(core[end + 2]) || isWeakAccented(curV) || (isStrongVowel(curV) && isStrongVowel(core[end + 2]))) {
                break;
              }
              end += 2;
              continue;
            }
            if (!isVowel(nextCh)) break;
            // Romper hiato si hay vocal débil tónica (í, ú) o dos vocales fuertes (a, e, o)
            if (isWeakAccented(curV) || isWeakAccented(nextCh) || (isStrongVowel(curV) && isStrongVowel(nextCh))) {
              break;
            }
            end++;
          }
          nuclei.push({ start, end });
          i = end + 1;
        } else {
          i++;
        }
      }

      if (nuclei.length <= 1) return [clean];

      const syllables = [];
      let sylStart = 0;
      for (let n = 0; n < nuclei.length - 1; n++) {
        const v1End = nuclei[n].end;
        const v2Start = nuclei[n + 1].start;
        const consCount = v2Start - v1End - 1;
        let splitIdx = v1End + 1;

        if (consCount <= 0) {
          splitIdx = v2Start;
        } else if (consCount === 1) {
          splitIdx = v1End + 1; // V-CV
        } else if (consCount === 2) {
          const c1 = core[v1End + 1];
          const c2 = core[v1End + 2];
          splitIdx = isLiquidCluster(c1, c2) ? (v1End + 1) : (v1End + 2);
        } else {
          const cPenult = core[v2Start - 2];
          const cLast = core[v2Start - 1];
          splitIdx = isLiquidCluster(cPenult, cLast) ? (v2Start - 2) : (v2Start - 1);
        }

        syllables.push(core.slice(sylStart, splitIdx));
        sylStart = splitIdx;
      }
      syllables.push(core.slice(sylStart) + tailPunct);
      return syllables.filter(Boolean);
    }

    tokenizePhraseIntoNaturalSyllables(text, targetDurationMs = 2200) {
      const words = String(text || '').trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) return [];

      // 1. Dividir todas las palabras en sílabas fonéticas reales
      const rawSyls = [];
      for (let wIdx = 0; wIdx < words.length; wIdx++) {
        const w = words[wIdx];
        const parts = this._splitWordIntoNaturalPhoneticSyllables(w);
        for (let p = 0; p < parts.length; p++) {
          const isLastInWord = (p === parts.length - 1);
          const sText = parts[p];
          const hasAccent = /[áéíóúÁÉÍÓÚ]/.test(sText);
          const hasPunct = /[,.;:?!…]/.test(sText);
          const isStressed = hasAccent || (parts.length > 1 && p === parts.length - 2 && /[aeiounsAEIOUNS]$/.test(w)) || (parts.length > 1 && isLastInWord && !/[aeiounsAEIOUNS]$/.test(w));

          let weight = 1.0;
          if (sText.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, '').length <= 2 && !hasAccent) weight = 0.82;
          if (isStressed) weight *= 1.24;
          if (isLastInWord) weight *= 1.12;
          if (hasPunct) weight *= 1.42;

          rawSyls.push({
            rawText: sText,
            isWordEnd: isLastInWord,
            weight
          });
        }
      }

      // 2. Fusionar sinalefas / monosílabos átonos ultracortos ("en el", "de la", "a tu") o cuando la frase es rápida,
      //    garantizando que cada unidad rítmica tenga al menos >= 190ms de espacio vital y NUNCA salgan apelotonadas.
      const spanMs = Math.max(520, Number(targetDurationMs) || 2200);
      const maxComfortableTokens = Math.max(2, Math.min(11, Math.floor(spanMs / 195)));

      let tokens = rawSyls.map(s => ({ ...s }));

      // Paso A: sinalefa natural de preposiciones/artículos de 1-2 letras sin acento con la sílaba siguiente si hay margen
      if (tokens.length > 3) {
        const mergedSynalepha = [];
        let k = 0;
        while (k < tokens.length) {
          const cur = tokens[k];
          const cleanCur = cur.rawText.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, '').toLowerCase();
          if (k + 1 < tokens.length && cur.isWordEnd && /^(?:a|y|o|u|e|de|el|la|en|mi|tu|su|un|al|me|te|se|lo|no|ni|si)$/.test(cleanCur) && tokens.length > maxComfortableTokens) {
            const nxt = tokens[k + 1];
            mergedSynalepha.push({
              rawText: cur.rawText + ' ' + nxt.rawText,
              isWordEnd: nxt.isWordEnd,
              weight: cur.weight * 0.55 + nxt.weight
            });
            k += 2;
          } else {
            mergedSynalepha.push(cur);
            k++;
          }
        }
        tokens = mergedSynalepha;
      }

      // Paso B: si aún supera maxComfortableTokens, agrupar sílabas de una misma palabra empezando por las más cortas
      while (tokens.length > maxComfortableTokens && tokens.length > 2) {
        let bestMergeIdx = -1;
        let minCombinedWeight = 1e9;
        for (let i = 0; i < tokens.length - 1; i++) {
          // Preferir unir sílabas dentro de la misma palabra (!tokens[i].isWordEnd)
          const sameWordBonus = !tokens[i].isWordEnd ? -2.0 : 0.0;
          const score = tokens[i].weight + tokens[i + 1].weight + sameWordBonus;
          if (score < minCombinedWeight) {
            minCombinedWeight = score;
            bestMergeIdx = i;
          }
        }
        if (bestMergeIdx === -1) break;
        const a = tokens[bestMergeIdx];
        const b = tokens[bestMergeIdx + 1];
        const joinedText = a.isWordEnd ? (a.rawText + ' ' + b.rawText) : (a.rawText + b.rawText);
        tokens.splice(bestMergeIdx, 2, {
          rawText: joinedText,
          isWordEnd: b.isWordEnd,
          weight: a.weight * 0.72 + b.weight
        });
      }

      if (tokens.length > 0) {
        tokens[tokens.length - 1].weight *= 1.32;
      }

      return tokens.map(t => ({
        text: t.rawText + (t.isWordEnd ? ' ' : '-'),
        displayText: t.rawText + (t.isWordEnd ? ' ' : ''),
        isWordEnd: t.isWordEnd,
        weight: t.weight
      }));
    }

    _computeAcousticSyllablesForLines(key, linesArr) {
      if (!Array.isArray(linesArr) || linesArr.length === 0) return;
      const profile = key ? this.audioWaveformProfiles.get(key) : null;
      const hasAudioProfile = Boolean(profile && profile.vocCurve && profile.vocCurve.length >= 80);
      const hopSec = hasAudioProfile ? (profile.hopSec || 0.025) : 0.025;
      const vocCurve = hasAudioProfile ? profile.vocCurve : null;
      const vocMidDb = hasAudioProfile ? profile.vocMidDb : null;
      const sylOnset = hasAudioProfile ? (profile.sylOnset || profile.vocAttack) : null;
      const thVoc = hasAudioProfile && Number.isFinite(profile.thVoc) ? profile.thVoc : -39.0;
      const maxProfileSec = hasAudioProfile ? (vocCurve.length * hopSec) : 0;

      let prevPhraseEndMs = 0;

      for (let i = 0; i < linesArr.length; i++) {
        const line = linesArr[i];
        if (!line || line.isIntroCard || line.isMetadata || line.isCue) continue;
        const cleanText = repairSpanishBrokenAccents(String(line.text || '').trim());
        if (!cleanText) continue;

        const nextLine = (i + 1 < linesArr.length) ? linesArr[i + 1] : null;
        const offSec = Number.isFinite(line.elasticOffsetSec) ? line.elasticOffsetSec : (this.knownLeadingSilenceMap.get(key) || 0);
        const nextOffSec = nextLine
          ? (Number.isFinite(nextLine.elasticOffsetSec) ? nextLine.elasticOffsetSec : offSec)
          : offSec;

        let baseStartSec = Math.max(0.05, (Number(line.timeSec) || 0) + offSec);
        let nextStartSec = nextLine
          ? Math.max(baseStartSec + 0.55, (Number(nextLine.timeSec) || 0) + nextOffSec)
          : (baseStartSec + 3.4);

        if (prevPhraseEndMs > 0 && baseStartSec * 1000 < prevPhraseEndMs + 90) {
          baseStartSec = (prevPhraseEndMs + 90) / 1000.0;
        }

        const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
        const naturalPhraseDurSec = Math.max(0.85, Math.min(4.5, wordCount * 0.44 + 0.35));

        let vocalStartSec = baseStartSec;
        let vocalEndSec = Math.min(nextStartSec - 0.08, baseStartSec + naturalPhraseDurSec);

        // 1. Si tenemos el perfil acústico de 25ms de la canción, escuchar la entrada y salida real de la voz en esta frase
        if (hasAudioProfile && baseStartSec + 0.5 < maxProfileSec) {
          const searchStartF = Math.max(
            Math.ceil((prevPhraseEndMs + 70) / (hopSec * 1000)),
            Math.floor((baseStartSec - 0.30) / hopSec)
          );
          const searchEndF = Math.min(
            vocCurve.length - 4,
            Math.ceil(Math.min(nextStartSec - 0.40, baseStartSec + 0.65) / hopSec)
          );
          const baseF = Math.min(vocCurve.length - 1, Math.max(0, Math.round(baseStartSec / hopSec)));

          // Si en baseStartSec todavía hay silencio vocal (el cantante aún está cogiendo aire), avanzar al frame exacto de ataque vocal
          if (vocMidDb && vocMidDb[baseF] < thVoc - 1.5 && searchEndF > baseF) {
            for (let f = baseF; f <= searchEndF; f++) {
              if (vocMidDb[f] >= thVoc && vocMidDb[Math.min(vocCurve.length - 1, f + 1)] >= thVoc - 1.0) {
                vocalStartSec = +(f * hopSec).toFixed(3);
                break;
              }
            }
          } else if (sylOnset && searchStartF < searchEndF) {
            // Buscar el pico de ataque vocal más nítido cerca de baseStartSec (±225ms)
            let bestEntryF = baseF;
            let bestEntryScore = -1e9;
            const winLo = Math.max(searchStartF, baseF - Math.round(0.20 / hopSec));
            const winHi = Math.min(searchEndF, baseF + Math.round(0.25 / hopSec));
            for (let f = winLo; f <= winHi; f++) {
              if (vocMidDb[f] < thVoc - 2.5) continue;
              const distSec = (f - baseF) * hopSec;
              const sc = (sylOnset[f] * 1.8) + (vocCurve[f] - thVoc) * 0.25 - (distSec * distSec) * 18.0;
              if (sc > bestEntryScore) {
                bestEntryScore = sc;
                bestEntryF = f;
              }
            }
            vocalStartSec = +(bestEntryF * hopSec).toFixed(3);
          }

          // Detectar dónde termina realmente el cantante de cantar la frase (antes de la pausa de respiración hacia la siguiente frase)
          const minEndSec = vocalStartSec + Math.max(0.55, Math.min(1.6, wordCount * 0.22));
          const maxEndSec = Math.min(nextStartSec - 0.08, vocalStartSec + naturalPhraseDurSec + 0.70, maxProfileSec - 0.05);
          if (maxEndSec > minEndSec && vocMidDb) {
            const fMinEnd = Math.max(0, Math.round(minEndSec / hopSec));
            const fMaxEnd = Math.min(vocMidDb.length - 1, Math.round(maxEndSec / hopSec));
            const breathFramesRequired = Math.max(4, Math.round(0.125 / hopSec)); // >= 125ms de pausa vocal
            let foundBreathEndSec = null;

            for (let f = fMinEnd; f + breathFramesRequired <= fMaxEnd; f++) {
              let silentCnt = 0;
              for (let b = 0; b < breathFramesRequired; b++) {
                if (vocMidDb[f + b] < thVoc - 1.2) silentCnt++;
              }
              if (silentCnt >= breathFramesRequired) {
                foundBreathEndSec = +(f * hopSec).toFixed(3);
                break;
              }
            }
            vocalEndSec = foundBreathEndSec !== null ? foundBreathEndSec : maxEndSec;
          }
        }

        const vocalStartMs = Math.round(vocalStartSec * 1000);
        const vocalEndMs = Math.max(vocalStartMs + 480, Math.round(vocalEndSec * 1000));
        const phraseSpanMs = Math.max(480, vocalEndMs - vocalStartMs);

        // 2. Tokenizar la frase en sílabas fonéticas naturales adaptadas a la duración vocal real
        const tokens = this.tokenizePhraseIntoNaturalSyllables(cleanText, phraseSpanMs);
        const K = tokens.length;
        if (K === 0) continue;

        const minStepMs = Math.max(165, Math.min(235, Math.floor(phraseSpanMs / Math.max(1.25, K * 1.28))));
        const totalWeight = tokens.reduce((acc, t) => acc + t.weight, 0) || K;

        // Calcular posiciones esperadas (prior fonético ponderado por vocales abiertas, acentos y pausas)
        const priorTimesMs = new Array(K);
        let cumW = 0;
        const effectiveSpanMs = Math.max(K * minStepMs, phraseSpanMs - Math.round(phraseSpanMs / (K + 1.5)) * 0.45);
        for (let k = 0; k < K; k++) {
          priorTimesMs[k] = Math.round(vocalStartMs + (cumW / totalWeight) * effectiveSpanMs);
          cumW += tokens[k].weight;
        }

        // 3. Alineación Dinámica Monótona (Viterbi 25ms) de cada sílaba con los picos reales de articulación vocal (sylOnset)
        const finalTimesMs = new Array(K);
        if (hasAudioProfile && sylOnset && (vocalEndSec <= maxProfileSec)) {
          const stepMs = Math.round(hopSec * 1000); // 25ms
          const minStepFrames = Math.max(5, Math.round(minStepMs / stepMs));
          const f0 = Math.max(0, Math.round(vocalStartMs / stepMs));
          const f1 = Math.min(sylOnset.length - 1, Math.max(f0 + K * 2, Math.round(vocalEndMs / stepMs)));
          const nGrid = f1 - f0 + 1;

          if (nGrid >= K + 2 && K >= 2) {
            const dp = Array.from({ length: K }, () => new Float32Array(nGrid).fill(-1e9));
            const back = Array.from({ length: K }, () => new Int32Array(nGrid).fill(0));

            for (let g = 0; g < nGrid; g++) {
              const f = f0 + g;
              const tMs = f * stepMs;
              const dist0 = (tMs - priorTimesMs[0]) / 180.0;
              if (Math.abs(tMs - priorTimesMs[0]) <= 220) {
                const onsetBonus = (sylOnset[f] * 2.2) + Math.max(-2, (vocCurve[f] - thVoc) * 0.25);
                dp[0][g] = onsetBonus - 3.2 * (dist0 * dist0);
              }
            }

            for (let k = 1; k < K; k++) {
              const expGapMs = Math.max(minStepMs, priorTimesMs[k] - priorTimesMs[k - 1]);
              for (let g = k * minStepFrames; g < nGrid; g++) {
                const f = f0 + g;
                const tMs = f * stepMs;
                if (Math.abs(tMs - priorTimesMs[k]) > 420) continue;

                const onsetBonus = (sylOnset[f] * 2.4) + Math.max(-2, (vocCurve[f] - thVoc) * 0.22);
                const priorDiff = (tMs - priorTimesMs[k]) / 260.0;
                const emit = onsetBonus - 1.8 * (priorDiff * priorDiff);

                const maxPrevG = g - minStepFrames;
                const minPrevG = Math.max(0, g - Math.ceil(950 / stepMs));
                let bestPrevVal = -1e9;
                let bestPrevG = -1;

                for (let gp = minPrevG; gp <= maxPrevG; gp++) {
                  if (dp[k - 1][gp] <= -1e8) continue;
                  const gapMs = (g - gp) * stepMs;
                  const gapErr = (gapMs - expGapMs) / 210.0;
                  const cand = dp[k - 1][gp] - 2.6 * (gapErr * gapErr);
                  if (cand > bestPrevVal) {
                    bestPrevVal = cand;
                    bestPrevG = gp;
                  }
                }

                if (bestPrevG !== -1) {
                  dp[k][g] = bestPrevVal + emit;
                  back[k][g] = bestPrevG;
                }
              }
            }

            let bestLastG = -1;
            let bestLastScore = -1e9;
            for (let g = 0; g < nGrid; g++) {
              if (dp[K - 1][g] > bestLastScore) {
                bestLastScore = dp[K - 1][g];
                bestLastG = g;
              }
            }

            if (bestLastG !== -1 && bestLastScore > -1e7) {
              let curG = bestLastG;
              for (let k = K - 1; k >= 0; k--) {
                finalTimesMs[k] = (f0 + curG) * stepMs;
                curG = back[k][curG];
              }
            }
          }
        }

        // Fallback o garantía estricta de separación mínima para que NUNCA se apelotonen las sílabas
        for (let k = 0; k < K; k++) {
          if (!Number.isFinite(finalTimesMs[k])) {
            finalTimesMs[k] = priorTimesMs[k];
          }
          if (k > 0 && finalTimesMs[k] < finalTimesMs[k - 1] + minStepMs) {
            finalTimesMs[k] = finalTimesMs[k - 1] + minStepMs;
          }
        }

        const acousticSyllables = [];
        for (let k = 0; k < K; k++) {
          const tMs = finalTimesMs[k];
          const nextT = (k + 1 < K) ? finalTimesMs[k + 1] : Math.max(tMs + 300, vocalEndMs);
          const durMs = Math.max(135, Math.min(900, nextT - tMs - 15));
          acousticSyllables.push({
            time: tMs,
            dur: durMs,
            text: tokens[k].displayText
          });
        }

        line.vocalStartMs = finalTimesMs[0];
        line.vocalEndMs = Math.max(finalTimesMs[K - 1] + 280, vocalEndMs);
        line.acousticSyllables = acousticSyllables;
        prevPhraseEndMs = line.vocalEndMs;
      }
    }

    async ensureAudioAlignedLyricsForGameplay(track, audioBlob = null, totalDurationSec = 0) {
      if (!track) return [];
      const key = this._makeKey(track);
      const hasBlob = (audioBlob instanceof Blob) && audioBlob.size >= 40000;

      const decodeProfileTask = (async () => {
        const existingProfile = this.audioWaveformProfiles.get(key);
        if ((!existingProfile || !existingProfile.isFullPass || (existingProfile.hopSec && existingProfile.hopSec > 0.03)) &&
            hasBlob &&
            typeof dualStreamEngine !== 'undefined' &&
            dualStreamEngine &&
            typeof dualStreamEngine._decodeAndStoreWaveformProfile === 'function') {
          try {
            const maxBytes = Math.min(audioBlob.size, 4718592);
            const buf = await audioBlob.slice(0, maxBytes).arrayBuffer();
            await dualStreamEngine._decodeAndStoreWaveformProfile(track, key, buf, 250, true, true);
          } catch (_) {}
        }
      })();

      const [calibratedLines] = await Promise.all([
        this.fetchAndCalibrateLyricsForBlob(track, hasBlob ? audioBlob : null, totalDurationSec),
        decodeProfileTask
      ]);

      if (!Array.isArray(calibratedLines) || calibratedLines.length === 0) return [];
      const finalLines = calibratedLines.map(l => ({
        ...l,
        elasticOffsetSec: 0,
        words: Array.isArray(l.words) ? l.words.map(w => ({ ...w })) : undefined
      }));
      this._recomputeAudioAlignmentShift(track, key, finalLines);
      this._computeAcousticSyllablesForLines(key, finalLines);
      return finalLines;
    }

    async refineReconstructedKaraokeLinesWithAudio(track, reconstructedLines, audioBlob = null, totalDurationSec = 0) {
      if (!Array.isArray(reconstructedLines) || reconstructedLines.length === 0) return reconstructedLines;
      const key = track ? this._makeKey(track) : '';
      if (key && (audioBlob instanceof Blob) && audioBlob.size >= 40000) {
        const existingProfile = this.audioWaveformProfiles.get(key);
        if ((!existingProfile || !existingProfile.isFullPass || (existingProfile.hopSec && existingProfile.hopSec > 0.03)) &&
            typeof dualStreamEngine !== 'undefined' &&
            dualStreamEngine &&
            typeof dualStreamEngine._decodeAndStoreWaveformProfile === 'function') {
          try {
            const maxBytes = Math.min(audioBlob.size, 4718592);
            const buf = await audioBlob.slice(0, maxBytes).arrayBuffer();
            await dualStreamEngine._decodeAndStoreWaveformProfile(track, key, buf, 250, true, true);
          } catch (_) {}
        }
      }

      const profile = key ? this.audioWaveformProfiles.get(key) : null;
      const hasProfile = Boolean(profile && profile.vocCurve && profile.vocCurve.length >= 80);
      const hopSec = hasProfile ? (profile.hopSec || 0.025) : 0.025;
      const stepMs = Math.round(hopSec * 1000);
      const sylOnset = hasProfile ? (profile.sylOnset || profile.vocAttack) : null;
      const vocMidDb = hasProfile ? profile.vocMidDb : null;
      const thVoc = hasProfile && Number.isFinite(profile.thVoc) ? profile.thVoc : -39.0;

      for (let i = 0; i < reconstructedLines.length; i++) {
        const line = reconstructedLines[i];
        if (!line) continue;
        const nextLine = (i + 1 < reconstructedLines.length) ? reconstructedLines[i + 1] : null;
        let verso = line.verso || line.syllables || [];

        // Comprobar si la línea carece de sílabas o si tiene sílabas apelotonadas (< 155ms entre sílabas consecutivas)
        let hasBunchedSyllables = false;
        let nonMelismaCount = 0;
        for (let s = 0; s < verso.length; s++) {
          if (String(verso[s]?.text || '').trim() === '~') continue;
          nonMelismaCount++;
          if (s > 0 && (Number(verso[s].time) - Number(verso[s - 1].time)) < 155) {
            hasBunchedSyllables = true;
          }
        }

        const lineText = repairSpanishBrokenAccents(String(line.text || (Array.isArray(line.words) ? line.words.join(' ') : '')).trim());
        const wordCount = lineText.split(/\s+/).filter(Boolean).length;
        const needsRetokenization = !Array.isArray(verso) || verso.length === 0 || hasBunchedSyllables || (wordCount >= 3 && nonMelismaCount <= wordCount);

        if (needsRetokenization && lineText) {
          const startMs = Number(line.timeMs) || (verso[0] && Number(verso[0].time)) || 0;
          const nextStartMs = nextLine ? (Number(nextLine.timeMs) || (nextLine.verso?.[0]?.time) || (startMs + 2800)) : (startMs + 3200);
          const tempLineObj = {
            timeSec: startMs / 1000.0,
            elasticOffsetSec: 0,
            text: lineText
          };
          const tempNextObj = {
            timeSec: Math.max((startMs + 600) / 1000.0, nextStartMs / 1000.0),
            elasticOffsetSec: 0,
            text: 'next'
          };
          this._computeAcousticSyllablesForLines(key, [tempLineObj, tempNextObj]);
          if (Array.isArray(tempLineObj.acousticSyllables) && tempLineObj.acousticSyllables.length > 0) {
            line.verso = tempLineObj.acousticSyllables;
            line.syllables = tempLineObj.acousticSyllables;
            line.timeMs = tempLineObj.acousticSyllables[0].time;
            const lastS = tempLineObj.acousticSyllables[tempLineObj.acousticSyllables.length - 1];
            line.endTimeMs = lastS.time + (lastS.dur || 300);
          }
        } else if (hasProfile && sylOnset && Array.isArray(verso) && verso.length > 0) {
          // Si ya es un chart UltraStar bien espaciado, micro-ajustar cada sílaba (±95ms) al pico exacto de ataque vocal del audio
          for (let s = 0; s < verso.length; s++) {
            const syl = verso[s];
            if (!syl || String(syl.text || '').trim() === '~') continue;
            const origT = Number(syl.time) || 0;
            const minAllowedT = (s > 0) ? (Number(verso[s - 1].time) + 155) : Math.max(0, origT - 95);
            const maxAllowedT = (s + 1 < verso.length) ? Math.max(minAllowedT, Number(verso[s + 1].time) - 155) : (origT + 95);
            const fCenter = Math.round(origT / stepMs);
            const fLo = Math.max(0, Math.ceil(Math.max(origT - 95, minAllowedT) / stepMs));
            const fHi = Math.min(sylOnset.length - 1, Math.floor(Math.min(origT + 95, maxAllowedT) / stepMs));
            let bestF = fCenter;
            let bestPeak = -1e9;
            for (let f = fLo; f <= fHi; f++) {
              if (vocMidDb && vocMidDb[f] < thVoc - 3.5) continue;
              const distPenalty = Math.abs(f - fCenter) * 0.18;
              const val = sylOnset[f] - distPenalty;
              if (val > bestPeak) {
                bestPeak = val;
                bestF = f;
              }
            }
            if (bestPeak > 0.6 && bestF >= fLo && bestF <= fHi) {
              syl.time = bestF * stepMs;
            } else if (s > 0 && syl.time < minAllowedT) {
              syl.time = minAllowedT;
            }
          }
        }
      }
      return reconstructedLines;
    }

    _findBuiltInCustomSyncedLyrics(track, trackVid = '') {
      if (!track && !trackVid) return null;
      const vid = String(trackVid || '').trim();
      const rawT = repairSpanishBrokenAccents(String(track?.title || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      const rawA = repairSpanishBrokenAccents(String(track?.artist || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      const combined = `${rawA}${rawT}`;
      for (const entry of CLIENT_CUSTOM_SYNCED_LYRICS_DB) {
        if (vid && (entry.videoId === vid || (Array.isArray(entry.videoIds) && entry.videoIds.includes(vid)))) {
          return { ...entry, _isBuiltInCustom: true };
        }
        if (rawT && entry.keys.some(k => rawT === k || combined === k || combined.includes(k) || (rawT.length >= 12 && rawT.includes(k)))) {
          return { ...entry, _isBuiltInCustom: true };
        }
      }
      return null;
    }

    async _fetchCandidatesMultiProvider(track, totalDurationSec = 195, vidQueryParam = '') {
      let rawTitleForSearch = repairSpanishBrokenAccents(String(track?.title || ''));
      let rawArtistForSearch = repairSpanishBrokenAccents(String(track?.artist || ''));
      if (/^ultimoscruzados$/i.test(rawArtistForSearch) && rawTitleForSearch.includes(' - ')) {
        const parts = rawTitleForSearch.split(' - ');
        rawArtistForSearch = parts[0].trim();
        rawTitleForSearch = parts.slice(1).join(' - ').trim();
      }
      const cleanTitle = this._cleanSearchTerm(rawTitleForSearch);
      const primaryArtist = this._extractPrimaryArtist(rawArtistForSearch);
      const fullArtist = this._cleanSearchTerm(rawArtistForSearch);
      const isSoundtrackArtist = this._isSoundtrackOrGenericArtist(rawArtistForSearch);
      const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
      const durParam = (Number.isFinite(totalDurationSec) && totalDurationSec > 35) ? Math.round(totalDurationSec) : 0;

      const urlsToTry = [];
      if (!isSoundtrackArtist && primaryArtist && cleanTitle) {
        urlsToTry.push(
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(primaryArtist)}`
        );
      }
      if (cleanTitle || primaryArtist) {
        urlsToTry.push(
          `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${primaryArtist}`.trim())}`
        );
      }
      if (cleanTitle) {
        urlsToTry.push(
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}`
        );
      }
      if (durParam > 35 && cleanTitle && primaryArtist && !isSoundtrackArtist) {
        urlsToTry.push(
          `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(primaryArtist)}&duration=${durParam}`
        );
      }
      if (fullArtist && fullArtist.toLowerCase() !== primaryArtist.toLowerCase() && !isSoundtrackArtist) {
        urlsToTry.push(
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(fullArtist)}`,
          `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${fullArtist}`.trim())}`
        );
      }
      if (baseUrl || typeof window.getApiBaseUrl === 'function') {
        urlsToTry.push(
          `${baseUrl}/api/v1/lyrics?title=${encodeURIComponent(cleanTitle || track?.title || '')}&artist=${encodeURIComponent(primaryArtist || track?.artist || '')}&duration=${durParam}${vidQueryParam}`,
          `${baseUrl}/api/v1/lyrics?q=${encodeURIComponent(`${cleanTitle} ${primaryArtist}`.trim())}&duration=${durParam}${vidQueryParam}`
        );
      }

      const collected = [];
      const seenSig = new Set();

      const results = await Promise.allSettled(urlsToTry.map(async (qUrl) => {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 3500);
        try {
          const resp = await fetch(qUrl, { signal: ctrl.signal });
          if (!resp || !resp.ok) return [];
          const data = await resp.json();
          if (Array.isArray(data)) return data;
          if (data && (data.syncedLyrics || data.plainLyrics)) return [data];
          return [];
        } catch (_) {
          return [];
        } finally {
          clearTimeout(tid);
        }
      }));

      for (const r of results) {
        if (r.status !== 'fulfilled' || !Array.isArray(r.value)) continue;
        for (const item of r.value) {
          if (!item) continue;
          const s = String(item.syncedLyrics || '').trim();
          const p = String(item.plainLyrics || '').trim();
          if (!s && !p) continue;
          const sig = `${Math.round(Number(item.duration) || 0)}|${s.slice(0, 64)}|${s.length}`;
          if (seenSig.has(sig)) continue;
          seenSig.add(sig);
          collected.push(item);
        }
      }
      return collected;
    }

    _getOrInitTrackState(track) {
      const key = this._makeKey(track);
      let st = this.trackCalibrationState.get(key);
      if (!st) {
        while (this.trackCalibrationState.size > 60) {
          const oldestKey = this.trackCalibrationState.keys().next().value;
          if (!oldestKey || oldestKey === key || oldestKey === this.currentTrackKey) break;
          this.trackCalibrationState.delete(oldestKey);
        }
        st = {
          key,
          track,
          expectedDur: Number(track?.durationSec || 0) || 195,
          actualDur: null,
          audioBlob: null,
          dspEnvelope: null,
          nativeLyrics: null,
          nativeChecked: false,
          candidates: null,
          candidatesPromise: null,
          isFallbackOnly: false
        };
        this.trackCalibrationState.set(key, st);
      } else {
        st.track = track || st.track;
      }
      return st;
    }

    async fetchLyricsForTrack(track, totalDurationSec = 0) {
      if (!track) return [];
      track.title = repairSpanishBrokenAccents(track.title || '');
      track.artist = repairSpanishBrokenAccents(track.artist || '');
      const key = this._makeKey(track);
      const st = this._getOrInitTrackState(track);
      if (Number.isFinite(Number(totalDurationSec)) && Number(totalDurationSec) > 35) {
        st.expectedDur = Number(totalDurationSec);
      }

      if (this.cache.has(key) && !st.isFallbackOnly && !st.dspEnvelope) {
        return this.cache.get(key).map(l => ({ ...l }));
      }
      if (this.inflight.has(key)) return this.inflight.get(key);

      const task = (async () => {
        let trackVid = '';
        if (!track._isPlaceholderVid) {
          const rawVid = String(track.videoId || '').replace(/^magic_yt_|^yt_/, '').trim();
          if (/^[A-Za-z0-9_-]{11}$/.test(rawVid)) {
            trackVid = rawVid;
          } else {
            const rawId = String(track.id || '').replace(/^magic_yt_|^yt_/, '').trim();
            if (/^[A-Za-z0-9_-]{11}$/.test(rawId)) trackVid = rawId;
            else {
              const mThumb = String(track.thumbnail || track.cover_url || '').match(/(?:\/vi\/|\/vi_webp\/)([A-Za-z0-9_-]{11})(?:\/|$)/);
              if (mThumb && mThumb[1]) trackVid = mThumb[1];
            }
          }
        }

        // Si existe letra curada integrada, añadirla como candidata prioritaria (no como nativeLyrics rígido)
        // para que el motor DSP pueda re-desplazarla automáticamente si el audio proviene de un videoclip o versión alterna.
        const builtIn = this._findBuiltInCustomSyncedLyrics(track, trackVid);
        if (builtIn && builtIn.syncedLyrics) {
          const baseList = Array.isArray(st.candidates) ? st.candidates : [];
          if (!baseList.some(c => c && c._isBuiltInCustom)) {
            st.candidates = [builtIn, ...baseList];
          }
          this.candidatesCache.set(key, st.candidates);
          if (!st.dspEnvelope) {
            const builtInLines = this._pickBestCandidateLines(
              st.candidates,
              st.actualDur || Number(builtIn.duration) || st.expectedDur || 195,
              track,
              null
            );
            st.isFallbackOnly = false;
            this.cache.set(key, builtInLines);
            return builtInLines.map(l => ({ ...l }));
          }
        }

        if (!st.nativeChecked) {
          st.nativeChecked = true;
          let nativeLines = await this._tryLoadNativeChartLyrics(track).catch(() => null);
          if ((!Array.isArray(nativeLines) || nativeLines.length < 4)) {
            const topChartInfo = await this._fetchTopCatalogChartLyricsOrOnsets(track, key).catch(() => null);
            if (topChartInfo && topChartInfo.type === 'lyrics' && Array.isArray(topChartInfo.lines) && topChartInfo.lines.length >= 4) {
              nativeLines = topChartInfo.lines;
              this.studioReferenceMap.set(key, {
                studioDur: Number(topChartInfo.duration) || 195,
                t0: nativeLines[0].timeSec,
                phrases: this._extractVocalPhrasesFromLines(nativeLines, 80),
                parsedLines: nativeLines,
                isBuiltInCustom: true
              });
              this.knownLeadingSilenceMap.set(key, 0);
            }
          }
          st.nativeLyrics = nativeLines;
        }
        if (Array.isArray(st.nativeLyrics) && st.nativeLyrics.length >= 4) {
          st.isFallbackOnly = false;
          this.cache.set(key, st.nativeLyrics);
          return st.nativeLyrics.map(l => ({ ...l }));
        }

        const vidQueryParam = (trackVid && !track._isPlaceholderVid) ? `&videoId=${encodeURIComponent(trackVid)}` : '';
        if (!st.candidates && !st.candidatesPromise) {
          const queryDur = st.actualDur ||
                           this.knownAudioDurations.get(key) ||
                           (typeof dualStreamEngine !== 'undefined' && dualStreamEngine ? dualStreamEngine.getRealDurationSec(track) : 0) ||
                           st.expectedDur;
          st.candidatesPromise = this._fetchCandidatesMultiProvider(track, queryDur, vidQueryParam)
            .then((list) => {
              if (Array.isArray(list) && list.length > 0) {
                st.candidates = builtIn && builtIn.syncedLyrics ? [builtIn, ...list] : list;
                this.candidatesCache.set(key, st.candidates);
              }
              return st.candidates || [];
            })
            .finally(() => {
              st.candidatesPromise = null;
            });
        }

        const cands = st.candidates || (st.candidatesPromise ? await st.candidatesPromise : []);
        const effDur = st.actualDur ||
                       this.knownAudioDurations.get(key) ||
                       (typeof dualStreamEngine !== 'undefined' && dualStreamEngine ? dualStreamEngine.getRealDurationSec(track) : 0) ||
                       st.expectedDur ||
                       195;

        const hasSynced = Array.isArray(cands) && cands.some(c => c && c.syncedLyrics && String(c.syncedLyrics).includes('['));
        const bestLines = this._pickBestCandidateLines(cands, effDur, track, st.dspEnvelope);
        const newFallbackOnly = !hasSynced || Boolean(bestLines[0] && bestLines[0]._isFallbackPlaceholder);
        if (newFallbackOnly && this.cache.has(key) && !st.isFallbackOnly) {
          return this.cache.get(key).map(l => ({ ...l }));
        }
        st.isFallbackOnly = newFallbackOnly;
        this.cache.set(key, bestLines);
        return bestLines.map(l => ({ ...l }));
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
      const st = this.trackCalibrationState.get(key);
      const cands = (st && Array.isArray(st.candidates) && st.candidates.length > 0)
        ? st.candidates
        : this.candidatesCache.get(key);
      if (!cands || cands.length === 0) return;
      const dur = durationSec ||
                  (st && st.actualDur) ||
                  this.knownAudioDurations.get(key) ||
                  (typeof dualStreamEngine !== 'undefined' && dualStreamEngine ? dualStreamEngine.getRealDurationSec(track) : 0);
      const lines = this._pickBestCandidateLines(cands, dur, track, st ? st.dspEnvelope : null);
      this.cache.set(key, lines);
      const old = this.currentLyrics || [];
      const same = old.length === lines.length && old.every((l, i) => l.text === lines[i].text && Math.abs((l.timeSec || 0) - (lines[i].timeSec || 0)) < 0.03);
      if (same) return;
      this.currentLyrics = lines.map(l => ({ ...l }));
      this.activeLineIndex = -1;
      this.renderLinesToDom();
      const curSec = (typeof dualStreamEngine !== 'undefined' && dualStreamEngine)
        ? dualStreamEngine.getCurrentSongTimeSec()
        : (this._lastSyncAudioSec || 0);
      this.syncTime(curSec, { forceScroll: !this._isUserManualScrolling && Date.now() >= Math.max(this._userScrollingUntil || 0, this._userManualScrollUntil || 0) });
      if (this.showTranslation) {
        this.ensureTranslationsForCurrent(track).then(() => {
          if (this.currentTrackKey === key) this.renderLinesToDom();
        }).catch(() => {});
      }
    }

    async recalibrateForActualAudio(track, actualDurationSec = 0, audioBlob = null) {
      if (!track) return null;
      const key = this._makeKey(track);
      const st = this._getOrInitTrackState(track);
      if (Number.isFinite(actualDurationSec) && actualDurationSec >= 35) {
        st.actualDur = actualDurationSec;
        this.knownAudioDurations.set(key, actualDurationSec);
      }
      if (audioBlob instanceof Blob && audioBlob.size >= 40000) {
        st.audioBlob = audioBlob;
        if (!st.dspEnvelope) {
          st.dspEnvelope = await this._extractDspEnvelope(audioBlob).catch(() => null);
          if (st.dspEnvelope && st.dspEnvelope.actualDur > 35) {
            st.actualDur = st.dspEnvelope.actualDur;
            this.knownAudioDurations.set(key, st.dspEnvelope.actualDur);
          }
        }
      }

      if (this.inflight.has(key)) {
        try { await this.inflight.get(key); } catch (_) {}
      }

      if (!st.nativeChecked) {
        st.nativeChecked = true;
        let nativeLines = await this._tryLoadNativeChartLyrics(track).catch(() => null);
        if ((!Array.isArray(nativeLines) || nativeLines.length < 4)) {
          const topChartInfo = await this._fetchTopCatalogChartLyricsOrOnsets(track, key).catch(() => null);
          if (topChartInfo && topChartInfo.type === 'lyrics' && Array.isArray(topChartInfo.lines) && topChartInfo.lines.length >= 4) {
            nativeLines = topChartInfo.lines;
          }
        }
        st.nativeLyrics = nativeLines;
      }

      if (Array.isArray(st.nativeLyrics) && st.nativeLyrics.length >= 4) {
        this.cache.set(key, st.nativeLyrics);
        if (this.currentTrackKey === key) {
          const old = this.currentLyrics || [];
          const same = old.length === st.nativeLyrics.length && old.every((l, i) => l.text === st.nativeLyrics[i].text && Math.abs((l.timeSec || 0) - (st.nativeLyrics[i].timeSec || 0)) < 0.03);
          if (!same) {
            this.currentLyrics = st.nativeLyrics.map(l => ({ ...l }));
            this.activeLineIndex = -1;
            this.renderLinesToDom();
            const curSec = (typeof dualStreamEngine !== 'undefined' && dualStreamEngine)
              ? dualStreamEngine.getCurrentSongTimeSec()
              : (this._lastSyncAudioSec || 0);
            this.syncTime(curSec, { forceScroll: !this._isUserManualScrolling && Date.now() >= Math.max(this._userScrollingUntil || 0, this._userManualScrollUntil || 0) });
          }
        }
        return st.nativeLyrics;
      }

      if (!st.candidates) {
        if (st.candidatesPromise) {
          await st.candidatesPromise;
        } else {
          await this.fetchLyricsForTrack(track, st.actualDur || st.expectedDur || 195);
        }
      }

      const cands = st.candidates || this.candidatesCache.get(key);
      if (!Array.isArray(cands) || cands.length === 0) return null;

      const recalibrated = this._pickBestCandidateLines(
        cands,
        st.actualDur || st.expectedDur || 195,
        track,
        st.dspEnvelope
      );
      this.cache.set(key, recalibrated);
      this._refreshCurrentLyrics(track, key, st.actualDur || actualDurationSec);
      return recalibrated;
    }

    async fetchAndCalibrateLyricsForBlob(track, audioBlob = null, expectedDurSec = 195) {
      if (!track) return [];
      const key = this._makeKey(track);
      const st = this._getOrInitTrackState(track);
      if (Number(expectedDurSec) > 35) st.expectedDur = Number(expectedDurSec);
      if (audioBlob instanceof Blob && audioBlob.size >= 40000) {
        st.audioBlob = audioBlob;
      }

      const [lines, env] = await Promise.all([
        this.fetchLyricsForTrack(track, expectedDurSec),
        (audioBlob instanceof Blob && audioBlob.size >= 40000 && !st.dspEnvelope)
          ? this._extractDspEnvelope(audioBlob).catch(() => null)
          : Promise.resolve(st.dspEnvelope)
      ]);
      if (env) {
        st.dspEnvelope = env;
        if (env.actualDur > 35) {
          st.actualDur = env.actualDur;
          this.knownAudioDurations.set(key, env.actualDur);
        }
      }

      let finalLines = Array.isArray(lines) ? lines : [];
      if ((!st.nativeLyrics || st.nativeLyrics.length < 4) && Array.isArray(st.candidates) && st.candidates.length > 0 && st.dspEnvelope) {
        finalLines = this._pickBestCandidateLines(st.candidates, st.actualDur || expectedDurSec, track, st.dspEnvelope);
        this.cache.set(key, finalLines);
      }

      // Aplicar micro-ajuste del usuario SOLO sobre una copia para el gameplay (sin contaminar this.cache)
      const uOff = this.getUserOffsetSec(key);
      if (uOff !== 0 && Array.isArray(finalLines) && finalLines.length > 0) {
        return finalLines.map(l => ({
          ...l,
          timeSec: Math.max(0, +(Number(l.timeSec || 0) - uOff).toFixed(2)),
          endTimeSec: Math.max(0.4, +((Number(l.endTimeSec) || (Number(l.timeSec || 0) + 3.5)) - uOff).toFixed(2)),
          words: Array.isArray(l.words)
            ? l.words.map(w => ({ ...w, timeSec: Math.max(0, +(Number(w.timeSec || 0) - uOff).toFixed(3)) }))
            : undefined
        }));
      }
      return finalLines.map(l => ({
        ...l,
        words: Array.isArray(l.words) ? l.words.map(w => ({ ...w })) : undefined
      }));
    }

    getKnownLeadingSilenceForTrack(track) {
      if (!track) return 0;
      const key = this._makeKey(track);
      return this.knownLeadingSilenceMap.get(key) || 0;
    }

    async loadAndRenderTrackLyrics(track, totalDurationSec = 0) {
      if (!track) return;
      const key = this._makeKey(track);
      const isNewTrack = this.currentTrackKey !== key;
      this.currentTrack = track;
      this.currentTrackKey = key;
      this.timeOffsetSec = this.getUserOffsetSec(key);
      if (isNewTrack) {
        this._isUserManualScrolling = false;
        this._userManualScrollUntil = 0;
        this._userScrollingUntil = 0;
        this._lastRenderedTrackKey = '';
      }
      this.autoLeadingSilenceSec = 0;
      this.activeLineIndex = -1;
      this._syncToolbarUI();

      const box = document.getElementById('npKaraokeScrollBox');
      if (box) {
        this._bindKaraokeScrollInteraction(box);
        if (this.cache.has(key)) {
          this.currentLyrics = this.cache.get(key).map(l => ({ ...l, elasticOffsetSec: 0 }));
          this.renderLinesToDom();
        } else {
          box.innerHTML = `<p class="np-karaoke-placeholder">Sincronizando letra karaoke...</p>`;
        }
      }

      const lines = await this.fetchLyricsForTrack(track, totalDurationSec);
      if (this.currentTrackKey !== key) return;
      this.currentLyrics = lines.map(l => ({ ...l, elasticOffsetSec: 0 }));
      this.renderLinesToDom();
      const curSec = (typeof dualStreamEngine !== 'undefined' && dualStreamEngine)
        ? dualStreamEngine.getCurrentSongTimeSec()
        : (this._lastSyncAudioSec || 0);
      this.syncTime(curSec, { forceScroll: isNewTrack });
      if (this.showTranslation) {
        this.ensureTranslationsForCurrent(track).then(() => {
          if (this.currentTrackKey === key) this.renderLinesToDom();
        }).catch(() => {});
      }
    }

    _bindKaraokeScrollInteraction(box) {
      if (!box || box._karaokeDelegationBound) return;
      box._karaokeDelegationBound = true;
      box._manualScrollSyncBound = true;

      const markUserScroll = () => {
        if (!this._programmaticScrolling) {
          this._userScrollingUntil = Date.now() + 3600;
          this._userManualScrollUntil = this._userScrollingUntil;
        }
      };

      box.addEventListener('wheel', markUserScroll, { passive: true });
      box.addEventListener('touchstart', markUserScroll, { passive: true });
      box.addEventListener('scroll', () => {
        if (!this._programmaticScrolling) {
          this._userScrollingUntil = Date.now() + 3200;
          this._userManualScrollUntil = this._userScrollingUntil;
        }
      }, { passive: true });

      let downX = 0;
      let downY = 0;
      let pointerTracked = false;

      box.addEventListener('pointerdown', (e) => {
        downX = e.clientX ?? 0;
        downY = e.clientY ?? 0;
        pointerTracked = true;
        markUserScroll();
      }, { passive: true });

      box.addEventListener('click', (e) => {
        const lineEl = e.target && typeof e.target.closest === 'function'
          ? e.target.closest('.np-karaoke-line[data-line-idx]')
          : null;
        if (!lineEl) return;
        if (pointerTracked) {
          const dx = (e.clientX ?? downX) - downX;
          const dy = (e.clientY ?? downY) - downY;
          pointerTracked = false;
          if (Math.hypot(dx, dy) > 12) return;
        }
        const idx = parseInt(lineEl.getAttribute('data-line-idx'), 10);
        if (Number.isFinite(idx) && window.DiscoverHomeApp && typeof window.DiscoverHomeApp.seekToKaraokeLine === 'function') {
          window.DiscoverHomeApp.seekToKaraokeLine(idx);
        }
      });
    }

    _bindManualScrollSync(box) {
      return this._bindKaraokeScrollInteraction(box);
    }

    renderLinesToDom() {
      const box = document.getElementById('npKaraokeScrollBox');
      if (!box) return;
      this._bindKaraokeScrollInteraction(box);
      this._syncToolbarUI();
      if (!Array.isArray(this.currentLyrics) || this.currentLyrics.length === 0) {
        box.innerHTML = `<p class="np-karaoke-placeholder">Letra no disponible para esta pista.</p>`;
        return;
      }

      const userOff = Number(this.timeOffsetSec || 0);
      this._lastRenderedTrackKey = this.currentTrackKey;
      box.innerHTML = this.currentLyrics.map((line, idx) => {
        const effLineSec = Math.max(0, (Number(line.timeSec) || 0) - userOff);
        let contentHtml = '';
        if (Array.isArray(line.words) && line.words.length > 1) {
          contentHtml = line.words.map((w, wi) =>
            `<span class="np-karaoke-word" data-word-time="${w.timeSec}" data-widx="${wi}">${escapeHtmlSafe(w.text)}</span>`
          ).join('');
        } else {
          contentHtml = `<span class="np-karaoke-line-text">${escapeHtmlSafe(line.text)}</span>`;
        }
        const origNorm = String(line.text || '').trim().toLowerCase();
        const transNorm = String(line.translatedText || '').trim().toLowerCase();
        const showSub = Boolean(this.showTranslation && line.translatedText && transNorm && transNorm !== origNorm);
        return `
          <div id="karaokeLine_${idx}" class="np-karaoke-line" data-line-idx="${idx}" title="Toca para saltar a ${this._formatMmSs(effLineSec)}">
            <div class="np-karaoke-main-row">${contentHtml}<span class="np-karaoke-line-time">${this._formatMmSs(effLineSec)}</span></div>
            ${showSub ? `<span class="np-karaoke-subline">${escapeHtmlSafe(line.translatedText)}</span>` : ''}
          </div>
        `;
      }).join('');
    }

    syncTime(currentSec, options = {}) {
      const opts = (typeof options === 'boolean')
        ? { forceScroll: options }
        : (options && typeof options === 'object' ? options : {});
      const forceScroll = Boolean(opts.forceScroll);
      const immediateLineIdx = opts.immediateLineIdx;

      this._lastSyncAudioSec = Math.max(0, Number(currentSec || 0));
      if (!Array.isArray(this.currentLyrics) || this.currentLyrics.length === 0) return;

      const box = document.getElementById('npKaraokeScrollBox');
      if (box && this._lastRenderedTrackKey !== this.currentTrackKey) {
        this.renderLinesToDom();
      }

      const cur = this._lastSyncAudioSec;
      const userOff = Number(this.timeOffsetSec || 0);
      const adjSec = Math.max(0, cur + userOff);

      let activeIdx = -1;
      if (Number.isFinite(immediateLineIdx) && immediateLineIdx >= 0 && immediateLineIdx < this.currentLyrics.length) {
        activeIdx = immediateLineIdx;
      } else {
        for (let i = 0; i < this.currentLyrics.length; i++) {
          const line = this.currentLyrics[i];
          const effLineSec = Math.max(0, Number(line.timeSec || 0) - userOff);
          if (cur + 0.16 >= effLineSec) {
            activeIdx = i;
          } else {
            break;
          }
        }
      }

      const prevActiveIdx = this.activeLineIndex;
      if (prevActiveIdx >= 0 && prevActiveIdx !== activeIdx) {
        const prevEl = document.getElementById(`karaokeLine_${prevActiveIdx}`);
        if (prevEl && typeof prevEl.querySelectorAll === 'function') {
          const prevWords = prevEl.querySelectorAll('.np-karaoke-word.sung');
          for (const pw of prevWords) pw.classList.remove('sung');
        }
      }

      if (activeIdx >= 0) {
        const activeElNow = document.getElementById(`karaokeLine_${activeIdx}`);
        if (activeElNow && typeof activeElNow.querySelectorAll === 'function') {
          const wordNodes = activeElNow.querySelectorAll('.np-karaoke-word[data-word-time]');
          if (wordNodes && wordNodes.length > 0) {
            for (const wn of wordNodes) {
              const wt = parseFloat(wn.getAttribute('data-word-time')) || 0;
              wn.classList.toggle('sung', adjSec + 0.08 >= wt);
            }
          }
        }
      }

      if (!forceScroll && activeIdx === prevActiveIdx) return;
      this.activeLineIndex = activeIdx;

      if (!box) return;

      for (let i = 0; i < this.currentLyrics.length; i++) {
        const el = document.getElementById(`karaokeLine_${i}`);
        if (!el) continue;
        el.classList.toggle('active', i === activeIdx);
        el.classList.toggle('past', activeIdx >= 0 && i < activeIdx);
      }

      const canAutoScroll = forceScroll || (!this._isUserManualScrolling && Date.now() >= Math.max(this._userScrollingUntil || 0, this._userManualScrollUntil || 0));
      if (!canAutoScroll || box.offsetParent === null) return;

      this._programmaticScrolling = true;
      if (this._programmaticScrollTimer) clearTimeout(this._programmaticScrollTimer);
      if (activeIdx >= 0) {
        const activeEl = document.getElementById(`karaokeLine_${activeIdx}`);
        if (activeEl) {
          const targetScroll = activeEl.offsetTop - (box.clientHeight / 2) + (activeEl.clientHeight / 2);
          box.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
        }
      } else {
        box.scrollTo({ top: 0, behavior: 'smooth' });
      }
      this._programmaticScrollTimer = setTimeout(() => {
        this._programmaticScrolling = false;
      }, 420);
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
      this._fullAudioIsLocalBlob = false;
      this._currentFullAudioTrackId = '';

      this._ytBridgeVideoId = '';
      this._ytBridgeStartWallMs = 0;
      this._ytBridgeBaseSec = 0;
      this._ytBridgePaused = true;
      this._ytApiPlayer = null;
      this._ytApiReady = false;
      this._ytPendingCue = null;

      this.previewBaseOffsetSec = 0;
      this._correlatedPreviewStartSec = null;
      this.pendingUserSeekSec = null;
      this._seekGuard = null; // { targetSec, untilMs }
      this._lastSeekWallMs = 0;
      this._lastGameplaySeekWallMs = 0;

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
      this._initPersistentYtBridgePlayer();
    }

    _getMasterVolume() {
      // El volumen de la música ambiental del menú (beatstar_master_volume / beatstar_master_muted)
      // solo afecta a la música de fondo del menú y NUNCA debe bajar ni silenciar las canciones o previews.
      return 0.92;
    }

    _extractTrackYoutubeId(track) {
      if (!track || track._isPlaceholderVid) return '';
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

    _initPersistentYtBridgePlayer() {
      this._ytBridgePlayerState = -1;
      this._ytBridgeListenTimer = null;
      if (this._ytMessageBound) return;
      this._ytMessageBound = true;
      window.addEventListener('message', (ev) => {
        if (!ev || typeof ev.data !== 'string') return;
        const ifr = document.getElementById('ytInstantAudioBridgeIframe');
        if (!ifr || ev.source !== ifr.contentWindow) return;
        let msg = null;
        try { msg = JSON.parse(ev.data); } catch (_) { return; }
        if (!msg) return;

        if (msg.event === 'onReady') {
          this._sendYtBridgeCommand('unMute', []);
          this._sendYtBridgeCommand('setVolume', [95]);
          if (this.activeSourceType === 'yt_bridge' && !this._ytBridgePaused) {
            this._sendYtBridgeCommand('playVideo', []);
          } else if (this._ytGameplayActive && !this._ytGameplayPaused) {
            this._sendYtBridgeCommand('playVideo', []);
          }
        } else if (msg.event === 'onStateChange' && typeof msg.info === 'number') {
          this._ytBridgePlayerState = msg.info;
          if (msg.info === 1) {
            this._ytBridgeStartWallMs = performance.now();
            this._ytGameplayStartWallMs = performance.now();
          } else if (msg.info === 0 && this.activeSourceType === 'yt_bridge') {
            if (!this._lastSeekWallMs || (performance.now() - this._lastSeekWallMs) > 2000) {
              this.nextTrack();
            }
          }
        } else if (msg.event === 'infoDelivery' && msg.info && typeof msg.info === 'object') {
          const info = msg.info;
          if (typeof info.playerState === 'number') {
            this._ytBridgePlayerState = info.playerState;
            if (info.playerState === 0 && this.activeSourceType === 'yt_bridge') {
              if (!this._lastSeekWallMs || (performance.now() - this._lastSeekWallMs) > 2000) {
                this.nextTrack();
              }
              return;
            }
          }
          if (typeof info.currentTime === 'number' && Number.isFinite(info.currentTime) && info.currentTime >= 0) {
            if (this.activeSourceType === 'yt_bridge') {
              const recentlySeeked = this._lastSeekWallMs && (performance.now() - this._lastSeekWallMs) < 1800;
              const isStaleTick = recentlySeeked && Math.abs(info.currentTime - (this._ytBridgeBaseSec || 0)) > 2.5;
              if (!isStaleTick) {
                this._ytBridgeBaseSec = info.currentTime;
                this._ytBridgeStartWallMs = performance.now();
              }
            }
            if (this._ytGameplayActive) {
              const recentlyGameplaySeeked = this._lastGameplaySeekWallMs && (performance.now() - this._lastGameplaySeekWallMs) < 1800;
              const isStaleGameplayTick = recentlyGameplaySeeked && Math.abs(info.currentTime - (this._ytGameplayBaseSec || 0)) > 2.5;
              if (!isStaleGameplayTick) {
                this._ytGameplayBaseSec = info.currentTime;
                this._ytGameplayStartWallMs = performance.now();
              }
            }
          }
          if (typeof info.duration === 'number' && Number.isFinite(info.duration) && info.duration > 35 && this.currentTrack && this.activeSourceType === 'yt_bridge') {
            const prevDur = Number(this.currentTrack.durationSec || 0);
            if (Math.abs(info.duration - prevDur) > 1.0) {
              this.currentTrack.durationSec = info.duration;
              this._updatePlayerProgressUI(this.getCurrentSongTimeSec(), info.duration);
              if (this.karaokeService) {
                this.karaokeService.recalibrateForActualAudio(this.currentTrack, info.duration).catch(() => {});
              }
            }
          }
        }
      });
    }

    _sendYtBridgeCommand(func, args = []) {
      try {
        const fallbackIfr = document.getElementById('ytInstantAudioBridgeIframe');
        if (fallbackIfr && fallbackIfr.contentWindow) {
          fallbackIfr.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args, id: 'ytInstantAudioBridgeIframe', channel: 'widget' }), '*');
        }
      } catch (_) {}
    }

    _sendYtBridgeListeningHandshake() {
      try {
        const fallbackIfr = document.getElementById('ytInstantAudioBridgeIframe');
        if (fallbackIfr && fallbackIfr.contentWindow) {
          fallbackIfr.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'ytInstantAudioBridgeIframe', channel: 'widget' }), '*');
        }
      } catch (_) {}
    }

    _stopYtAudioBridge() {
      this._ytBridgePaused = true;
      this._ytBridgePlayerState = -1;
      this._ytBridgeVideoId = '';
      this._ytPendingCue = null;
      if (this._ytBridgeListenTimer) {
        clearInterval(this._ytBridgeListenTimer);
        this._ytBridgeListenTimer = null;
      }
      try {
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
        this._ytBridgePlayerState = -1;
        this._ytBridgePaused = false;
        this.activeSourceType = 'yt_bridge';
        this.isPlayingFlag = true;
        this.isLoadingTrack = false;
        this._setLoadingHintVisible(false);
        this._syncPlayPauseIcons(true);

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
        if (this._ytBridgeListenTimer) clearInterval(this._ytBridgeListenTimer);
        let handshakeTicks = 0;
        this._ytBridgeListenTimer = setInterval(() => {
          handshakeTicks++;
          if (reqId !== this._playRequestId || (this.activeSourceType !== 'yt_bridge' && !this._ytGameplayActive) || handshakeTicks > 40) {
            clearInterval(this._ytBridgeListenTimer);
            this._ytBridgeListenTimer = null;
            return;
          }
          this._sendYtBridgeListeningHandshake();
          if (this._ytBridgePlayerState === 1 && handshakeTicks > 8) {
            clearInterval(this._ytBridgeListenTimer);
            this._ytBridgeListenTimer = null;
          }
        }, 250);
        if (ifr) {
          ifr.addEventListener('load', () => {
            if (reqId !== this._playRequestId || this.activeSourceType !== 'yt_bridge') return;
            this._sendYtBridgeListeningHandshake();
            this._sendYtBridgeCommand('addEventListener', ['onReady']);
            this._sendYtBridgeCommand('addEventListener', ['onStateChange']);
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
      this._lastGameplaySeekWallMs = performance.now();
      this._ytGameplayBaseSec = safe;
      this._ytGameplayStartWallMs = performance.now();
      this._sendYtBridgeCommand('seekTo', [+safe.toFixed(2), true]);
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
      if (Number.isFinite(this._correlatedPreviewStartSec) && this._correlatedPreviewStartSec > 5 && this._correlatedPreviewStartSec < dur - 22) {
        return this._correlatedPreviewStartSec;
      }
      if (Number.isFinite(track?.chorusSec) && track.chorusSec > 10 && track.chorusSec < dur - 25) {
        return track.chorusSec;
      }
      if (this.karaokeService && track) {
        const key = this.karaokeService._makeKey(track);
        const lines = this.karaokeService.cache.get(key);
        if (Array.isArray(lines) && lines.length >= 6 && typeof this.karaokeService._estimateChorusSecFromLyrics === 'function') {
          return this.karaokeService._estimateChorusSecFromLyrics(lines, dur);
        }
      }
      return Math.round(Math.max(26, Math.min(62, dur * 0.27)));
    }

    getCurrentSongTimeSec() {
      if (this._seekGuard && Date.now() < this._seekGuard.untilMs) {
        let rawCur = 0;
        if (this.activeSourceType === 'full') {
          rawCur = Number(this.fullAudio.currentTime) || 0;
        } else if (this.activeSourceType === 'yt_bridge') {
          if (this._ytBridgePaused || this._ytBridgePlayerState !== 1) {
            rawCur = this._ytBridgeBaseSec || 0;
          } else {
            const elapsed = Math.max(0, Math.min(1.2, (performance.now() - this._ytBridgeStartWallMs) / 1000));
            rawCur = (this._ytBridgeBaseSec || 0) + elapsed;
          }
        } else if (this.activeSourceType === 'preview') {
          const base = Number.isFinite(this._correlatedPreviewStartSec)
            ? this._correlatedPreviewStartSec
            : (this.previewBaseOffsetSec || 0);
          rawCur = base + (Number(this.previewAudio.currentTime) || 0);
        } else {
          rawCur = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : (this.previewBaseOffsetSec || 0);
        }
        if (Math.abs(rawCur - this._seekGuard.targetSec) <= 2.6) {
          this._seekGuard = null;
          return rawCur;
        }
        return this._seekGuard.targetSec;
      }
      if (this.pendingUserSeekSec !== null && !this.fullTrackReady && this.activeSourceType !== 'full' && this.activeSourceType !== 'yt_bridge') {
        return this.pendingUserSeekSec;
      }
      if (this.isCrossfading && this.fullAudio && !this.fullAudio.paused && Number.isFinite(this.fullAudio.currentTime)) {
        return Number(this.fullAudio.currentTime) || 0;
      }
      if (this.activeSourceType === 'full') {
        return Number(this.fullAudio.currentTime) || 0;
      }
      if (this.activeSourceType === 'yt_bridge') {
        if (this._ytBridgePaused) return this._ytBridgeBaseSec || 0;
        if (this._ytBridgePlayerState !== 1) {
          return this._ytBridgeBaseSec || 0;
        }
        const elapsed = Math.max(0, Math.min(1.2, (performance.now() - this._ytBridgeStartWallMs) / 1000));
        const fullDur = this.getTrackFullDurationSec(this.currentTrack);
        return Math.min(fullDur, (this._ytBridgeBaseSec || 0) + elapsed);
      }
      if (this.activeSourceType === 'preview') {
        const fullDur = this.getTrackFullDurationSec(this.currentTrack);
        const base = Number.isFinite(this._correlatedPreviewStartSec)
          ? this._correlatedPreviewStartSec
          : (this.previewBaseOffsetSec || 0);
        return Math.min(fullDur - 0.5, base + (Number(this.previewAudio.currentTime) || 0));
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

        // Si el audio completo ya está descargado mientras suena el preview, hacer handoff inmediato correlacionado
        if (this.activeSourceType === 'preview' && this.fullTrackReady && !this.isCrossfading) {
          this._handoffFromPreviewOrPending(this._playRequestId);
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

      this.fullAudio.addEventListener('seeked', () => {
        if (this.activeSourceType !== 'full' || !this._seekGuard) return;
        const guard = this._seekGuard;
        const actual = Number(this.fullAudio.currentTime) || 0;
        if (Math.abs(actual - guard.targetSec) <= 3.0) {
          this._seekGuard = null;
          this._setLoadingHintVisible(false);
          return;
        }
        // Si un stream HTTP remoto truncó o devolvió currentTime a 0 por falta de Range, descargar Blob completo y saltar exacto
        if (!this._fullAudioIsLocalBlob && this.currentTrack && Date.now() < guard.untilMs) {
          this.pendingUserSeekSec = guard.targetSec;
          this._setLoadingHintVisible(true);
          this._ensureFullBlobUpgradeAndSeek(this.currentTrack, guard.targetSec, this._playRequestId);
        }
      });

      // En cuanto fullAudio conoce su duración real, recalibrar la letra LRC para que vaya 100% sincronizada
      let lastRecalDur = 0;
      const isPlausibleAudioDuration = (trackObj, candidateDur) => {
        if (!Number.isFinite(candidateDur) || candidateDur <= 38 || candidateDur > 1200) return false;
        const knownDur = Number(trackObj?.durationSec || trackObj?.duration || 0);
        if (knownDur >= 45 && knownDur <= 420 && candidateDur > knownDur * 1.35) {
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

      // Ticker de alta precisión (80ms) para que el resaltado de sílabas/líneas de Karaoke, yt_bridge y el Videoclip no tengan retraso
      if (this.karaokeSyncInterval) clearInterval(this.karaokeSyncInterval);
      let ytBridgeTickCounter = 0;
      this.karaokeSyncInterval = setInterval(() => {
        if (!this.currentTrack) return;
        if (window.isGameLoadingOrActive || (window.engine && (window.engine.isRunning || window.engine.isCountingDown))) return;
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
          const fullDur = this.getTrackFullDurationSec(this.currentTrack);
          this._updatePlayerProgressUI(curSec, fullDur);
          if (ytBridgeTickCounter % 5 === 0) {
            this._updateMediaSessionPosition(curSec, fullDur);
          }
          if (curSec >= fullDur - 0.5 && (!this._lastSeekWallMs || (performance.now() - this._lastSeekWallMs) > 2000)) {
            this.nextTrack();
          }
        }
      }, 80);

      this.previewAudio.addEventListener('ended', () => {
        if (this.activeSourceType !== 'preview') return;
        if (this.fullTrackReady && (this.fullTrackBlob || this.fullAudio.src)) {
          this._handoffFromPreviewOrPending(this._playRequestId);
          return;
        }
        if (!this._fullUpgradeExhausted && (this._previewLoopCount || 0) < 1) {
          this._previewLoopCount = (this._previewLoopCount || 0) + 1;
          if (!this._activeUpgradePromise && this.currentTrack) {
            this._upgradeActivePreviewToFullTrackInBackground(this.currentTrack, this._playRequestId);
          }
          try {
            this.previewAudio.currentTime = 0;
            this.previewAudio.play().catch(() => {});
          } catch (_) {}
          return;
        }
        this.isPlayingFlag = false;
        this._syncPlayPauseIcons(false);
        this._setLoadingHintVisible(false);
        if (this.queue.length > 1 && (!this._lastSeekWallMs || (performance.now() - this._lastSeekWallMs) > 2000)) {
          this.nextTrack();
        }
      });

      this.fullAudio.addEventListener('ended', () => {
        if (this.activeSourceType === 'full' && (!this._lastSeekWallMs || (performance.now() - this._lastSeekWallMs) > 2000)) {
          this.nextTrack();
        }
      });
    }

    async _ensureFullBlobUpgradeAndSeek(track, targetSec, reqId) {
      if (!track || reqId !== this._playRequestId) return;
      try {
        const blob = (this.fullTrackBlob && this.fullTrackBlob.size >= 60000)
          ? this.fullTrackBlob
          : await this.preloadFullTrackInBackground(track);
        if (reqId !== this._playRequestId || !blob || blob.size < 60000) return;
        this.fullTrackBlob = blob;
        if (this.karaokeService) {
          this.karaokeService.recalibrateForActualAudio(track, this.getTrackFullDurationSec(track), blob).catch(() => {});
        }
        await this._upgradeFullAudioToLocalBlob(blob, targetSec, true, reqId);
      } catch (_) {}
    }

    async _upgradeFullAudioToLocalBlob(blob, seekTargetSec = null, resumeIfPlaying = true, reqId = this._playRequestId) {
      if (!blob || blob.size < 60000 || reqId !== this._playRequestId) return false;
      if (this._fullAudioIsLocalBlob && this.fullTrackBlob === blob) return true;
      const wasPlaying = resumeIfPlaying || this.isPlaying();
      const preserveSec = (seekTargetSec !== null && Number.isFinite(seekTargetSec))
        ? Math.max(0, seekTargetSec)
        : (this.activeSourceType === 'full' ? (Number(this.fullAudio.currentTime) || 0) : 0);

      if (this.fullTrackObjectUrl) {
        try { URL.revokeObjectURL(this.fullTrackObjectUrl); } catch (_) {}
      }
      this.fullTrackObjectUrl = URL.createObjectURL(blob);
      this.fullTrackBlob = blob;
      this._fullAudioIsLocalBlob = true;
      this.fullTrackReady = true;
      this._currentFullAudioTrackId = String(this.currentTrack?.id || '');
      this._seekGuard = { targetSec: preserveSec, untilMs: Date.now() + 2500 };

      this.fullAudio.src = this.fullTrackObjectUrl;
      const applyAtMeta = () => {
        if (reqId !== this._playRequestId) return;
        const dur = Number(this.fullAudio.duration) || 9999;
        const safePos = Math.max(0, Math.min(dur - 0.5, preserveSec));
        try { this.fullAudio.currentTime = safePos; } catch (_) {}
        if (wasPlaying) {
          this.fullAudio.volume = this._getMasterVolume();
          this.fullAudio.play().then(() => {
            if (reqId !== this._playRequestId) return;
            this.activeSourceType = 'full';
            this.isPlayingFlag = true;
            this._syncPlayPauseIcons(true);
            this._setLoadingHintVisible(false);
          }).catch(() => {});
        }
      };

      if (this.fullAudio.readyState >= 1) {
        applyAtMeta();
      } else {
        this.fullAudio.addEventListener('loadedmetadata', applyAtMeta, { once: true });
      }
      this.pendingUserSeekSec = null;
      return true;
    }

    async _handoffFromPreviewOrPending(reqId) {
      if (this.isCrossfading || !this.fullTrackReady || !this.fullAudio.src || reqId !== this._playRequestId) return;
      if (this.pendingUserSeekSec !== null) {
        const target = this.pendingUserSeekSec;
        this.pendingUserSeekSec = null;
        await this._performTransparentHandoffToFullTrack(target);
        return;
      }

      const prevElapsed = Number(this.previewAudio.currentTime) || 0;
      let targetSec = 0;

      // Correlacionar acústicamente la preview con el audio completo para seguir justo en el estribillo sin saltos
      const prevUrl = this.previewAudio.src || this.currentTrack?.previewUrl || '';
      if (this.fullTrackBlob && prevUrl && /^https?:\/\//i.test(prevUrl) && this.karaokeService && prevElapsed >= 0.4 &&
          typeof this.karaokeService._correlatePreviewOffsetSec === 'function') {
        try {
          const match = await Promise.race([
            this.karaokeService._correlatePreviewOffsetSec(prevUrl, this.fullTrackBlob),
            new Promise(r => setTimeout(() => r(null), 680))
          ]);
          if (reqId !== this._playRequestId || this.isCrossfading) return;
          if (match && Number.isFinite(match.previewStartSec)) {
            this._correlatedPreviewStartSec = match.previewStartSec;
            this.previewBaseOffsetSec = match.previewStartSec;
            const livePrev = Number(this.previewAudio.currentTime) || prevElapsed;
            targetSec = Math.max(0, match.previewStartSec + livePrev);
          }
        } catch (_) {}
      }
      if (reqId !== this._playRequestId) return;
      await this._performTransparentHandoffToFullTrack(targetSec);
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
        let file = direct.audio_url || `${rawId}.mp3`;
        if (file === 'artista_starboy.mp3' || rawId === 'artista_starboy') {
          file = 'the_weeknd_ft_daft_punk_starboy.mp3';
        }
        return { filename: file, tag: tagOf(file) || (file === 'the_weeknd_ft_daft_punk_starboy.mp3' ? '9' : null) };
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

    async _resolveFastStudioPreviewUrl(track) {
      if (!track) return '';
      const existing = String(track.previewUrl || track.preview_url || '').trim();
      if (/^https?:\/\//i.test(existing)) return existing;
      const repTitle = repairSpanishBrokenAccents(track.title || '').replace(/\(.*?\)|\[.*?\]/g, '').trim();
      const repArtist = repairSpanishBrokenAccents(track.artist || '').replace(/\s*-\s*topic$/i, '').replace(/vevo$/i, '').trim();
      const q = `${repTitle} ${repArtist}`.trim();
      if (!q) return '';
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 1800);
        const resp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=5`, { signal: ctrl.signal });
        clearTimeout(tid);
        if (resp.ok) {
          const data = await resp.json();
          const results = Array.isArray(data?.results) ? data.results : [];
          const hit = results.find(r => r && r.previewUrl && /^https?:\/\//i.test(r.previewUrl));
          if (hit) {
            track.previewUrl = hit.previewUrl;
            track.preview_url = hit.previewUrl;
            if (!track.artworkUrl600 && hit.artworkUrl100) {
              track.artworkUrl600 = String(hit.artworkUrl100).replace(/100x100bb/g, '600x600bb');
            }
            if ((!track.durationSec || track.durationSec < 45) && Number(hit.trackTimeMillis) > 45000) {
              track.durationSec = Math.round(Number(hit.trackTimeMillis) / 1000);
            }
            return hit.previewUrl;
          }
        }
      } catch (_) {}
      return '';
    }

    /**
     * Reproduce SIEMPRE mediante HTML5 <audio> real (nunca iframes ocultos de YouTube que fallan con Error 150 en VEVO/Pepas),
     * arrancando en <200ms y escalando transparentemente a la pista de estudio completa con calibración DSP y upgrade a Blob local.
     */
    async playTrack(track, options = {}) {
      if (!track) return false;
      const reqId = ++this._playRequestId;
      this.isLoadingTrack = true;
      this._extractTrackYoutubeId(track);
      this.currentTrack = track;
      this.fullTrackReady = false;
      this.fullTrackBlob = null;
      this._fullAudioIsLocalBlob = false;
      this._currentFullAudioTrackId = '';
      this.isCrossfading = false;
      this.pendingUserSeekSec = null;
      this._seekGuard = null;
      this._correlatedPreviewStartSec = null;
      this._previewLoopCount = 0;
      this._fullUpgradeExhausted = false;
      this._activeUpgradePromise = null;

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

      const idxInQ = this.queue.findIndex(t => t && String(t.id) === String(track.id));
      if (idxInQ !== -1) {
        this.queueIndex = idxInQ;
        this.queue[idxInQ] = track;
      } else {
        this.queue.unshift(track);
        this.queueIndex = 0;
      }

      const fullDur = this.getTrackFullDurationSec(track);
      const desiredStartSec = typeof options.startOffsetSec === 'number'
        ? Math.max(0, options.startOffsetSec)
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
            if (this.karaokeService) {
              this.karaokeService.recalibrateForActualAudio(track, enriched.durationSec).catch(() => {});
            }
          }
          if (enriched.artworkUrl600) {
            this._updatePlayerMetadataUI(track);
          }
        }).catch(() => {});
      }

      let lyricsPromise = null;
      if (this.karaokeService) {
        lyricsPromise = this.karaokeService.loadAndRenderTrackLyrics(track, this.getRealDurationSec(track)).catch(() => {});
      }

      if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncVideoclipIfActive === 'function') {
        window.DiscoverHomeApp.syncVideoclipIfActive(track);
      }

      const attachBackgroundDspAndBlobUpgrade = (audioUrlUsed) => {
        this.preloadFullTrackInBackground(track).then(async (blob) => {
          if (reqId !== this._playRequestId || !blob || blob.size < 60000) return;
          this.fullTrackBlob = blob;
          if (this.karaokeService) {
            this.karaokeService.recalibrateForActualAudio(track, this.getTrackFullDurationSec(track), blob).catch(() => {});
          }
          // Actualizar silenciosamente a Blob local para que cualquier clic futuro en frases sea <5ms sin cortes Range
          const curPlaying = this.isPlaying();
          const curSeek = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : (Number(this.fullAudio.currentTime) || 0);
          if (!this._seekGuard || this.pendingUserSeekSec !== null) {
            await this._upgradeFullAudioToLocalBlob(blob, curSeek, curPlaying, reqId);
          }
        }).catch(() => {});
      };

      // 1. Si ya tenemos el Blob completo en caché de memoria, reproducir al instante (0ms) con seek sample-accurate
      const cachedFullBlob = this._getCachedFullBlobForTrack(track);
      if (cachedFullBlob && cachedFullBlob.size >= 80000) {
        this.fullTrackBlob = cachedFullBlob;
        this.fullTrackReady = true;
        this._fullAudioIsLocalBlob = true;
        this._setLoadingHintVisible(false);
        this._currentFullAudioTrackId = String(track.id || '');
        const startedFull = await this._startChannelWithFadeIn(this.fullAudio, cachedFullBlob, 'full', reqId, desiredStartSec, 120);
        this.isLoadingTrack = false;
        if (startedFull) {
          if (this.karaokeService) {
            this.karaokeService.recalibrateForActualAudio(track, this.getTrackFullDurationSec(track), cachedFullBlob).catch(() => {});
          }
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          return true;
        }
      }

      // 2. Si es pista de Comunidad local, reproducir del archivo local del servidor de inmediato + recalibración DSP
      const isCommTrack = String(track.id || '').startsWith('comm_');
      if (isCommTrack) {
        const commUrl = this._getDirectFullStreamUrl(track, '3');
        if (commUrl) {
          this._currentFullAudioTrackId = String(track.id || '');
          const startedComm = await this._startChannelWithFadeIn(this.fullAudio, commUrl, 'full', reqId, desiredStartSec, 120);
          if (startedComm) {
            this.fullTrackReady = true;
            this._fullAudioIsLocalBlob = false;
            this.isLoadingTrack = false;
            this._setLoadingHintVisible(false);
            this._updatePlayerMetadataUI(track);
            this._startListenTracker();
            attachBackgroundDspAndBlobUpgrade(commUrl);
            return true;
          }
        }
      }

      if (!window.RELEASE_TAGS_MAP && typeof window.loadReleaseTagsMap === 'function') {
        await window.loadReleaseTagsMap().catch(() => {});
        if (reqId !== this._playRequestId) return false;
      }

      const directStreamUrl = (!isCommTrack) ? this._getDirectFullStreamUrl(track) : '';
      let fastHttpPreviewUrl = (track.previewUrl || track.preview_url || (this.prewarmedPreviewMap.get(String(track.id))?.previewUrl) || '').trim();

      // 3A. Si tiene URL directa en GitHub Releases (Catálogo Top), reproducir el MP3 de estudio al instante + Blob upgrade silencioso
      if (directStreamUrl) {
        this._setLoadingHintVisible(true);
        this._currentFullAudioTrackId = String(track.id || '');
        let usedUrl = directStreamUrl;
        let startedDirect = await this._startChannelWithFadeIn(this.fullAudio, directStreamUrl, 'full', reqId, desiredStartSec, 110);
        if (!startedDirect && reqId === this._playRequestId) {
          for (const fbTag of ['9', '8', '3']) {
            const fbUrl = this._getDirectFullStreamUrl(track, fbTag);
            if (fbUrl && fbUrl !== directStreamUrl) {
              startedDirect = await this._startChannelWithFadeIn(this.fullAudio, fbUrl, 'full', reqId, desiredStartSec, 110);
              if (startedDirect) {
                usedUrl = fbUrl;
                break;
              }
            }
          }
        }
        if (reqId !== this._playRequestId) return false;
        if (startedDirect) {
          this.fullTrackReady = true;
          this._fullAudioIsLocalBlob = false;
          this.isLoadingTrack = false;
          this._setLoadingHintVisible(false);
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          attachBackgroundDspAndBlobUpgrade(usedUrl);
          if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
            window.DiscoverHomeApp.syncActiveVideoclipPlayback('play');
          }
          return true;
        }
      }

      // 3B. Si tiene previewUrl HTTP (osu!, BeatSaver, iTunes, Deezer) y arranca desde 0, reproducir en <100ms mientras se descarga el track completo en segundo plano
      if (/^https?:\/\//i.test(fastHttpPreviewUrl) && desiredStartSec === 0) {
        if (this.karaokeService && typeof this.karaokeService._precomputePreviewEnvelope === 'function') {
          this.karaokeService._precomputePreviewEnvelope(fastHttpPreviewUrl).catch(() => {});
        }
        this.previewBaseOffsetSec = this.getChorusOffsetSec(track, this.getTrackFullDurationSec(track));
        const previewStarted = await this._startChannelWithFadeIn(this.previewAudio, fastHttpPreviewUrl, 'preview', reqId, 0, 95);
        if (reqId !== this._playRequestId) return false;
        if (previewStarted) {
          this.isLoadingTrack = false;
          this._setLoadingHintVisible(false);
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          if (lyricsPromise) {
            lyricsPromise.then(() => {
              if (reqId !== this._playRequestId || this.activeSourceType !== 'preview' || this._correlatedPreviewStartSec !== null) return;
              if (this.pendingUserSeekSec === null) {
                this.previewBaseOffsetSec = this.getChorusOffsetSec(track, this.getTrackFullDurationSec(track));
              }
            }).catch(() => {});
          }
          this._upgradeActivePreviewToFullTrackInBackground(track, reqId);
          return true;
        }
      }

      // 4. Para cualquier canción de Búsqueda / Magic Key / Descubrir (ej. "Pepas") sin previewUrl previo:
      //    Resolver preview oficial de estudio (~180ms en iTunes) para sonido inmediato + lanzar extracción de pista completa en paralelo
      this._setLoadingHintVisible(true);
      if (desiredStartSec === 0) {
        const resolvedPrevUrl = await this._resolveFastStudioPreviewUrl(track);
        if (reqId !== this._playRequestId) return false;
        if (/^https?:\/\//i.test(resolvedPrevUrl)) {
          fastHttpPreviewUrl = resolvedPrevUrl;
          if (this.karaokeService && typeof this.karaokeService._precomputePreviewEnvelope === 'function') {
            this.karaokeService._precomputePreviewEnvelope(resolvedPrevUrl).catch(() => {});
          }
          this.previewBaseOffsetSec = this.getChorusOffsetSec(track, this.getTrackFullDurationSec(track));
          const previewStarted = await this._startChannelWithFadeIn(this.previewAudio, resolvedPrevUrl, 'preview', reqId, 0, 95);
          if (reqId !== this._playRequestId) return false;
          if (previewStarted) {
            this.isLoadingTrack = false;
            this._setLoadingHintVisible(false);
            this._updatePlayerMetadataUI(track);
            this._startListenTracker();
            if (lyricsPromise) {
              lyricsPromise.then(() => {
                if (reqId !== this._playRequestId || this.activeSourceType !== 'preview' || this._correlatedPreviewStartSec !== null) return;
                if (this.pendingUserSeekSec === null) {
                  this.previewBaseOffsetSec = this.getChorusOffsetSec(track, this.getTrackFullDurationSec(track));
                }
              }).catch(() => {});
            }
            this._upgradeActivePreviewToFullTrackInBackground(track, reqId);
            return true;
          }
        }
      }

      if (desiredStartSec > 0 && !this.fullTrackReady) {
        this.pendingUserSeekSec = desiredStartSec;
      }

      // 5. Descarga / stream de pista completa multi-fuente (SoundCloud / Notube / Servidor)
      const fullBlob = await this.preloadFullTrackInBackground(track);
      if (reqId !== this._playRequestId) return false;
      if (fullBlob && fullBlob.size >= 80000) {
        this.fullTrackBlob = fullBlob;
        this._fullAudioIsLocalBlob = true;
        this.fullTrackReady = true;
        this._currentFullAudioTrackId = String(track.id || '');
        if (this.karaokeService) {
          this.karaokeService.recalibrateForActualAudio(track, this.getTrackFullDurationSec(track), fullBlob).catch(() => {});
        }
        const effectiveStart = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : desiredStartSec;
        this.pendingUserSeekSec = null;
        const startedBlob = await this._startChannelWithFadeIn(this.fullAudio, fullBlob, 'full', reqId, effectiveStart, 110);
        if (reqId !== this._playRequestId) return false;
        if (startedBlob) {
          this.isLoadingTrack = false;
          this._setLoadingHintVisible(false);
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          return true;
        }
      }

      // 6. Respaldo por stream directo del servidor (/api/v1/audio/extract)
      const progressiveExtractUrl = this._buildServerExtractStreamUrl(track);
      this._currentFullAudioTrackId = String(track.id || '');
      this._fullAudioIsLocalBlob = false;
      const effectiveProgStart = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : desiredStartSec;
      this.pendingUserSeekSec = null;
      const startedProg = await this._startChannelWithFadeIn(this.fullAudio, progressiveExtractUrl, 'full', reqId, effectiveProgStart, 110);
      if (reqId !== this._playRequestId) return false;
      if (startedProg) {
        this.fullTrackReady = true;
        this.isLoadingTrack = false;
        this._setLoadingHintVisible(false);
        this._updatePlayerMetadataUI(track);
        this._startListenTracker();
        return true;
      }

      if (fastHttpPreviewUrl && /^https?:\/\//i.test(fastHttpPreviewUrl)) {
        const previewStarted = await this._startChannelWithFadeIn(this.previewAudio, fastHttpPreviewUrl, 'preview', reqId, 0, 120);
        this.isLoadingTrack = false;
        this._setLoadingHintVisible(false);
        if (previewStarted) {
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          return true;
        }
      }

      this.isLoadingTrack = false;
      this._setLoadingHintVisible(false);
      return false;
    }

    /**
     * Analizador acústico de onda y presencia vocal (420-2800 Hz Mid/Side) libre de preflight CORS:
     * Detecta el inicio real de la música y correlaciona frases y pausas de respiración
     * con la letra de estudio consensuada para calcular el desplazamiento exacto al milisegundo.
     */
    async _decodeAndStoreWaveformProfile(track, key, arrayBuf, maxSeconds = 62, isFullPass = false, allowDuringGamePrep = false) {
      if (!arrayBuf || arrayBuf.byteLength < 24576) return false;
      const isActivelyPlayingPiano = Boolean(window.engine && (window.engine.isRunning || window.engine.isCountingDown));
      if (isActivelyPlayingPiano || (!allowDuringGamePrep && window.isGameLoadingOrActive)) return false;
      const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OfflineCtx) return false;
      const offCtx = new OfflineCtx(1, 44100 * 2, 44100);
      const decoded = await offCtx.decodeAudioData(arrayBuf.slice(0));
      const decDur = decoded ? (decoded.duration || (decoded.length / (decoded.sampleRate || 44100))) : 0;
      if (!decoded || decDur < 8) return false;

      const sr = decoded.sampleRate || 44100;
      const maxAnalyzeSamples = Math.min(decoded.length, Math.floor(sr * maxSeconds));
      const ch0 = decoded.getChannelData(0);
      const ch1 = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : ch0;

      const hopSec = 0.025;
      const hopSamples = Math.max(1, Math.round(sr * hopSec));
      const nFrames = Math.floor(maxAnalyzeSamples / hopSamples);
      if (nFrames < 160) return false;

      // Filtro pasa-banda formante vocal (420 Hz - 2800 Hz) + banda consonántica/sibilante (2800 Hz+) + separación Mid/Side estéreo a 25ms (40 fps)
      const dt = 1.0 / sr;
      const rcHp = 1.0 / (2.0 * Math.PI * 420.0);
      const aHp = rcHp / (rcHp + dt);
      const rcLp = 1.0 / (2.0 * Math.PI * 2800.0);
      const aLp = dt / (rcLp + dt);

      let hpL = 0, prevInL = 0, lpL = 0;
      let hpR = 0, prevInR = 0, lpR = 0;

      const fullDb = new Float32Array(nFrames);
      const vocMidDb = new Float32Array(nFrames);
      const vocCurve = new Float32Array(nFrames);
      const sibDb = new Float32Array(nFrames);

      for (let f = 0; f < nFrames; f++) {
        if (f > 0 && (f % 1400) === 0) {
          const activeNow = Boolean(window.engine && (window.engine.isRunning || window.engine.isCountingDown));
          if (activeNow || (!allowDuringGamePrep && window.isGameLoadingOrActive)) return false;
          await new Promise(r => setTimeout(r, 0));
        }
        const base = f * hopSamples;
        let sumFull = 0;
        let sumMid = 0;
        let sumSide = 0;
        let sumSib = 0;

        for (let j = 0; j < hopSamples; j++) {
          const xL = ch0[base + j];
          const xR = ch1[base + j];
          const mFull = 0.5 * (xL + xR);
          sumFull += mFull * mFull;

          hpL = aHp * (hpL + xL - prevInL);
          prevInL = xL;
          lpL = lpL + aLp * (hpL - lpL);

          hpR = aHp * (hpR + xR - prevInR);
          prevInR = xR;
          lpR = lpR + aLp * (hpR - lpR);

          const mVoc = 0.5 * (lpL + lpR);
          const sVoc = 0.5 * (lpL - lpR);
          const mSib = 0.5 * ((hpL - lpL) + (hpR - lpR));
          sumMid += mVoc * mVoc;
          sumSide += sVoc * sVoc;
          sumSib += mSib * mSib;
        }

        const rmsFull = Math.sqrt(sumFull / hopSamples + 1e-12);
        const rmsMid = Math.sqrt(sumMid / hopSamples + 1e-12);
        const rmsSide = Math.sqrt(sumSide / hopSamples + 1e-12);
        const rmsSib = Math.sqrt(Math.abs(sumSib) / hopSamples + 1e-12);

        const dbf = 20.0 * Math.log10(rmsFull);
        const dbm = 20.0 * Math.log10(rmsMid);
        const dbs = 20.0 * Math.log10(rmsSib);
        const msRatio = Math.max(0.6, Math.min(4.5, rmsMid / (rmsSide + 0.0005)));

        fullDb[f] = dbf;
        vocMidDb[f] = dbm;
        vocCurve[f] = dbm + 4.5 * Math.log2(msRatio);
        sibDb[f] = dbs;
      }

      const sortedFull = Array.from(fullDb).sort((a, b) => a - b);
      const sortedVoc = Array.from(vocMidDb).sort((a, b) => a - b);
      const p90Full = sortedFull[Math.floor(sortedFull.length * 0.90)] || -18;
      const p90Voc = sortedVoc[Math.floor(sortedVoc.length * 0.90)] || -22;
      const thFull = Math.max(-41.5, p90Full - 25.0);
      const thVoc = Math.max(-46.5, p90Voc - 23.0);

      const vocAttack = new Float32Array(nFrames);
      const sylOnset = new Float32Array(nFrames);
      for (let f = 6; f + 4 < nFrames; f++) {
        if (vocMidDb[f] < thVoc - 3.5 && vocMidDb[f + 1] < thVoc - 3.5) continue;
        const preMean = (vocCurve[f - 6] + vocCurve[f - 5] + vocCurve[f - 4] + vocCurve[f - 3] + vocCurve[f - 2] + vocCurve[f - 1]) / 6.0;
        const postMean = (vocCurve[f] + vocCurve[f + 1] + vocCurve[f + 2] + vocCurve[f + 3]) * 0.25;
        const jump = postMean - preMean;
        if (jump > 0 && vocMidDb[f] >= thVoc) vocAttack[f] = jump;

        const dipBefore = Math.min(vocCurve[f - 2], vocCurve[f - 1]);
        const peakAfter = Math.max(vocCurve[f], vocCurve[f + 1]);
        const vowelRise = Math.max(0, peakAfter - dipBefore);
        const consTransition = Math.max(0, (sibDb[f - 1] - vocMidDb[f - 1]) + 11.0) * 0.26;
        const localPeakBonus = (vocCurve[f] >= vocCurve[f - 1] && vocCurve[f] >= vocCurve[f + 1]) ? 1.10 : 0;
        sylOnset[f] = vowelRise + consTransition + localPeakBonus;
      }

      const winFrames = Math.max(1, Math.round(0.60 / hopSec));
      let musicStartSec = 0;
      for (let i = 0; i + winFrames < nFrames; i++) {
        let activeCnt = 0;
        for (let k = 0; k < winFrames; k++) {
          if (fullDb[i + k] >= thFull && vocMidDb[i + k] >= thVoc) activeCnt++;
        }
        if (activeCnt >= Math.ceil(winFrames * 0.80)) {
          musicStartSec = +(i * hopSec).toFixed(2);
          break;
        }
      }

      this.karaokeService.audioWaveformProfiles.set(key, {
        hopSec,
        fullDb,
        vocMidDb,
        vocCurve,
        sibDb,
        vocAttack,
        sylOnset,
        thVoc,
        musicStartSec,
        isFullPass: Boolean(isFullPass || decDur <= maxSeconds + 2)
      });

      return true;
    }

    async _analyzeAndAlignTrackAudioWithLyrics(track, srcOrBlob, reqId) {
      return;
    }

    async _upgradeActivePreviewToFullTrackInBackground(track, reqId) {
      if (!track || reqId !== this._playRequestId) return;
      if (this._activeUpgradePromise) return this._activeUpgradePromise;
      const task = (async () => {
        try {
          const blob = await this.preloadFullTrackInBackground(track);
          if (reqId !== this._playRequestId || !this.currentTrack || this.currentTrack.id !== track.id) return;
          if (blob && blob.size >= 80000) {
            this.fullTrackBlob = blob;
            this._fullAudioIsLocalBlob = true;
            this.fullTrackReady = true;
            this._currentFullAudioTrackId = String(track.id || '');
            if (this.fullTrackObjectUrl) {
              try { URL.revokeObjectURL(this.fullTrackObjectUrl); } catch (_) {}
            }
            this.fullTrackObjectUrl = URL.createObjectURL(blob);
            this.fullAudio.src = this.fullTrackObjectUrl;
            try { this.fullAudio.load(); } catch (_) {}

            if (this.karaokeService) {
              await this.karaokeService.recalibrateForActualAudio(track, this.getTrackFullDurationSec(track), blob).catch(() => {});
            }
            if (reqId !== this._playRequestId || !this.currentTrack || this.currentTrack.id !== track.id) return;

            this._updatePlayerMetadataUI(track);
            if (this.activeSourceType === 'preview') {
              if (this.isPlaying()) {
                await this._handoffFromPreviewOrPending(reqId);
                this._setLoadingHintVisible(false);
              } else {
                const targetPos = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : 0;
                this.pendingUserSeekSec = null;
                try { this.previewAudio.pause(); this.previewAudio.src = ''; } catch (_) {}
                this.fullAudio.volume = this._getMasterVolume();
                this.activeSourceType = 'full';
                this.isPlayingFlag = false;
                this._syncPlayPauseIcons(false);
                this._setLoadingHintVisible(false);
                this._updatePlayerProgressUI(targetPos, this.getTrackFullDurationSec(track));
                const applyPausedSeek = () => {
                  if (reqId !== this._playRequestId) return;
                  try { this.fullAudio.currentTime = targetPos; } catch (_) {}
                };
                if (this.fullAudio.readyState >= 1) applyPausedSeek();
                else this.fullAudio.addEventListener('loadedmetadata', applyPausedSeek, { once: true });
              }
            }
          } else {
            this._fullUpgradeExhausted = true;
            this._setLoadingHintVisible(false);
          }
        } catch (_) {
          this._fullUpgradeExhausted = true;
          this._setLoadingHintVisible(false);
        } finally {
          if (this._activeUpgradePromise === task) {
            this._activeUpgradePromise = null;
          }
        }
      })();
      this._activeUpgradePromise = task;
      return task;
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
        if (channelType === 'full') {
          this._fullAudioIsLocalBlob = (srcOrBlob instanceof Blob) || String(audioEl.src || '').startsWith('blob:');
        }

        const targetVol = this._getMasterVolume();
        audioEl.volume = 0.01;
        if (startSec > 0) {
          this._seekGuard = { targetSec: startSec, untilMs: Date.now() + 2400 };
        }

        const applySeek = () => {
          if (reqId !== this._playRequestId) return;
          try {
            if (startSec > 0) {
              const maxDur = Number(audioEl.duration) || 9999;
              audioEl.currentTime = Math.min(startSec, Math.max(0, maxDur - 0.8));
            } else {
              audioEl.currentTime = 0;
            }
          } catch (_) {}
        };
        if (audioEl.readyState >= 1) {
          applySeek();
        } else {
          audioEl.addEventListener('loadedmetadata', applySeek, { once: true });
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

    async _performTransparentHandoffToFullTrack(targetPositionSec = 0, options = {}) {
      if (this.isCrossfading || !this.currentTrack) return;
      this.isCrossfading = true;
      const reqId = this._playRequestId;
      let fadeIntervalActive = false;
      try {
        const fullDur = this.getTrackFullDurationSec(this.currentTrack);
        const safeSeek = Math.min(Math.max(0, targetPositionSec), Math.max(0, fullDur - 1.5));
        this._seekGuard = { targetSec: safeSeek, untilMs: Date.now() + 2600 };

        const cachedBlob = (this.fullTrackBlob && this.fullTrackBlob.size >= 80000)
          ? this.fullTrackBlob
          : this._getCachedFullBlobForTrack(this.currentTrack);
        if (cachedBlob && cachedBlob.size >= 80000) {
          try { this.previewAudio.pause(); } catch (_) {}
          this._fullAudioIsLocalBlob = true;
          this._currentFullAudioTrackId = String(this.currentTrack.id || '');
          await this._startChannelWithFadeIn(this.fullAudio, cachedBlob, 'full', reqId, safeSeek, options.instant ? 80 : 150);
          this.fullTrackReady = true;
          this.pendingUserSeekSec = null;
          this._setLoadingHintVisible(false);
          if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
            window.DiscoverHomeApp.syncActiveVideoclipPlayback('seek', safeSeek);
          }
          return;
        }

        // Si fullAudio ya contiene una URL blob:/local lista (por ejemplo en _upgradeActivePreviewToFullTrackInBackground o tests)
        if ((this._fullAudioIsLocalBlob || String(this.fullAudio.src || '').startsWith('blob:')) && this.fullAudio.src) {
          this._currentFullAudioTrackId = String(this.currentTrack.id || '');
          if (this.fullAudio.readyState < 1) {
            await new Promise((resolve) => {
              const tid = setTimeout(resolve, 1500);
              this.fullAudio.addEventListener('loadedmetadata', () => { clearTimeout(tid); resolve(); }, { once: true });
            });
          }
          if (reqId !== this._playRequestId) return;

          try { this.fullAudio.currentTime = safeSeek; } catch (_) {}
          this.fullAudio.volume = 0.01;
          await this.fullAudio.play();
          if (reqId !== this._playRequestId) {
            try { this.fullAudio.pause(); } catch (_) {}
            return;
          }

          this.activeSourceType = 'full';
          this.fullTrackReady = true;
          this.pendingUserSeekSec = null;
          this.isPlayingFlag = true;
          this._syncPlayPauseIcons(true);
          this._setLoadingHintVisible(false);

          const prevStartVol = Number(this.previewAudio.volume) || 0.85;
          const targetVol = this._getMasterVolume();
          const steps = options.instant ? 4 : 10;
          const stepMs = options.instant ? 18 : 26;
          let step = 0;
          fadeIntervalActive = true;
          const xfTimer = setInterval(() => {
            step++;
            if (reqId !== this._playRequestId) {
              clearInterval(xfTimer);
              this.isCrossfading = false;
              return;
            }
            const t = Math.min(1, step / steps);
            this.fullAudio.volume = Math.min(1, targetVol * t);
            try { this.previewAudio.volume = Math.max(0, prevStartVol * (1 - t)); } catch (_) {}
            if (step >= steps) {
              clearInterval(xfTimer);
              try { this.previewAudio.pause(); } catch (_) {}
              this.isCrossfading = false;
            }
          }, stepMs);

          if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
            window.DiscoverHomeApp.syncActiveVideoclipPlayback('seek', safeSeek);
          }
          return;
        }

        if (!this.fullAudio.src || this.activeSourceType !== 'full') {
          const directUrl3 = this._getDirectFullStreamUrl(this.currentTrack, '3');
          const streamUrl = directUrl3 || this._buildServerExtractStreamUrl(this.currentTrack);
          this._currentFullAudioTrackId = String(this.currentTrack.id || '');
          try { this.previewAudio.pause(); } catch (_) {}
          let ok = await this._startChannelWithFadeIn(this.fullAudio, streamUrl, 'full', reqId, safeSeek, 150);
          if (!ok && directUrl3 && reqId === this._playRequestId) {
            const directUrl8 = this._getDirectFullStreamUrl(this.currentTrack, '8');
            if (directUrl8) {
              ok = await this._startChannelWithFadeIn(this.fullAudio, directUrl8, 'full', reqId, safeSeek, 150);
            }
          }
          if (!ok && reqId === this._playRequestId) {
            const blob = await this.preloadFullTrackInBackground(this.currentTrack);
            if (blob && reqId === this._playRequestId) {
              this._fullAudioIsLocalBlob = true;
              await this._startChannelWithFadeIn(this.fullAudio, blob, 'full', reqId, safeSeek, 150);
            }
          }
          this.fullTrackReady = true;
          this.pendingUserSeekSec = null;
          this._setLoadingHintVisible(false);
          return;
        }
        try {
          this.fullAudio.currentTime = safeSeek;
        } catch (_) {}
        this.pendingUserSeekSec = null;
        this._setLoadingHintVisible(false);
      } finally {
        if (!fadeIntervalActive) {
          this.isCrossfading = false;
        }
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

          const rawT = repairSpanishBrokenAccents(track.title || '');
          const rawA = repairSpanishBrokenAccents(track.artist || '');
          const parsedMeta = (typeof window.parseYouTubeMetadataSmart === 'function')
            ? window.parseYouTubeMetadataSmart(rawT, rawA)
            : { coreTitle: rawT, coreArtist: rawA };
          const cleanTitle = repairSpanishBrokenAccents(parsedMeta.coreTitle || rawT);
          const cleanArtist = repairSpanishBrokenAccents(
            (parsedMeta.coreArtist && parsedMeta.coreArtist.toLowerCase() !== 'youtube')
              ? parsedMeta.coreArtist
              : rawA.replace(/^youtube$/i, '').trim()
          );

          // 1. Rama Servidor (/api/v1/audio/extract) con timeout ágil (2500ms) para no bloquear en caso de 503
          const serverRaceTask = (async () => {
            const extractUrl = this._buildServerExtractStreamUrl(track);
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 2500);
            let resp = null;
            try {
              resp = await fetch(extractUrl, { signal: ctrl.signal });
            } finally {
              clearTimeout(tid);
            }
            if (!resp || !resp.ok) throw new Error('Server extract HTTP ' + (resp ? resp.status : 'err'));
            const cType = String(resp.headers.get('content-type') || '').toLowerCase();
            if (!cType.startsWith('audio/') && !cType.includes('octet-stream')) {
              throw new Error('Invalid audio content-type: ' + cType);
            }
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
              const tid = setTimeout(() => ctrl.abort(), 5000);
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
              for (const fbTag of ['9', '8', '3']) {
                const fbUrl = this._getDirectFullStreamUrl(track, fbTag);
                if (fbUrl && fbUrl !== directUrl) {
                  const fbCtrl = new AbortController();
                  const fbTid = setTimeout(() => fbCtrl.abort(), 3500);
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
          if (!directUrl && typeof window.searchSoundCloudFullClient === 'function' && typeof window.downloadSoundCloudFullTrackClient === 'function') {
            const clientScTask = (async () => {
              const scList = await window.searchSoundCloudFullClient(cleanTitle, cleanArtist, 12);
              if (!Array.isArray(scList) || scList.length === 0) throw new Error('No SC candidates');
              for (const cand of scList.slice(0, 3)) {
                if ((cand.authenticityScore || 0) < 62) break;
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

          // 4. Rama YouTube Cliente directo vía Notube (~2.5-5s por Worker CORS)
          if (!directUrl && typeof window.extractYouTubeFullAudioViaNotubeClient === 'function') {
            const clientYtTask = (async () => {
              const vidsToTry = [];
              const initialVid = this._extractTrackYoutubeId(track);
              if (initialVid) vidsToTry.push(initialVid);
              if (typeof window.searchYouTubeOfficialClient === 'function') {
                const ytCands = await window.searchYouTubeOfficialClient(
                  cleanTitle,
                  cleanArtist,
                  Number(track.durationSec) || 0
                ).catch(() => []);
                if (Array.isArray(ytCands)) {
                  for (const c of ytCands.slice(0, 3)) {
                    if (c && c.videoId && !vidsToTry.includes(c.videoId)) {
                      vidsToTry.push(c.videoId);
                      if (!track.videoId) track.videoId = c.videoId;
                      if (c.durationSec > 45 && (!track.durationSec || track.durationSec < 45)) {
                        track.durationSec = c.durationSec;
                      }
                    }
                  }
                }
              }
              for (const vid of vidsToTry.slice(0, 2)) {
                const ytRes = await window.extractYouTubeFullAudioViaNotubeClient(vid);
                if (ytRes && ytRes.blob && ytRes.blob.size >= 80000) {
                  return ytRes.blob;
                }
              }
              throw new Error('YT Notube client failed');
            })();
            raceCompetitors.push(clientYtTask);
          }

          // 5. Rama Audius Cliente directo (pista completa >= 50s)
          if (!directUrl && typeof window.searchAndDownloadAudiusFullClient === 'function') {
            const clientAudiusTask = (async () => {
              const auRes = await window.searchAndDownloadAudiusFullClient(cleanTitle, cleanArtist);
              if (auRes && auRes.blob && auRes.blob.size >= 140000) {
                if (auRes.durationSec && auRes.durationSec > 45 && (!track.durationSec || track.durationSec < 45)) {
                  track.durationSec = auRes.durationSec;
                }
                return auRes.blob;
              }
              throw new Error('Audius failed');
            })();
            raceCompetitors.push(clientAudiusTask);
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
     * de las próximas tarjetas del mazo Para Ti para que al deslizar arranquen en 0ms.
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

    /**
     * Seek Infalible:
     *  - Resiste rebote a 0:00 durante buffering o Range requests fallidos (_seekGuard + auto-upgrade a Blob local).
     *  - Bloquea ticks antiguos de yt_bridge durante 1.8s y soporta precisión decimal.
     *  - Reanuda reproducción automáticamente si `options.ensurePlay` es true (al tocar una frase del Karaoke).
     *  - Funciona aunque fullAudio aún esté descargando en segundo plano o esté en modo preview.
     */
    async seekToSeconds(targetSec, options = {}) {
      if (!this.currentTrack) return;
      const opts = (options && typeof options === 'object') ? options : {};
      const ensurePlay = Boolean(opts.ensurePlay);
      this._lastSeekWallMs = performance.now();
      const fullDur = this.getTrackFullDurationSec(this.currentTrack);
      const safeTarget = Math.max(0, Math.min(fullDur - 0.5, Number(targetSec) || 0));

      this._seekGuard = { targetSec: safeTarget, untilMs: Date.now() + 2600 };
      this._updatePlayerProgressUI(safeTarget, fullDur);
      if (this.karaokeService) {
        this.karaokeService.syncTime(safeTarget, { forceScroll: true, immediateLineIdx: opts.lineIdx });
      }

      if (ensurePlay && typeof window.pauseMenuAmbientMusic === 'function') {
        window.pauseMenuAmbientMusic();
      }

      if (this.activeSourceType === 'yt_bridge') {
        this._ytBridgeBaseSec = safeTarget;
        this._ytBridgeStartWallMs = performance.now();
        this._sendYtBridgeCommand('seekTo', [+safeTarget.toFixed(2), true]);
        if (ensurePlay || this._ytBridgePaused) {
          this._ytBridgePaused = false;
          this.isPlayingFlag = true;
          this._syncPlayPauseIcons(true);
          this._sendYtBridgeCommand('playVideo', []);
        }
        if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
          window.DiscoverHomeApp.syncActiveVideoclipPlayback('seek', safeTarget);
        }
        return;
      }

      if (
        this.activeSourceType === 'full' &&
        this.fullAudio.src &&
        (!this._currentFullAudioTrackId || this._currentFullAudioTrackId === String(this.currentTrack.id || ''))
      ) {
        const applyFull = () => {
          try {
            const realD = Number(this.fullAudio.duration) || fullDur;
            const bounded = Math.max(0, Math.min(realD - 0.4, safeTarget));
            this.fullAudio.currentTime = bounded;
            if (ensurePlay && this.fullAudio.paused) {
              this.fullAudio.volume = this._getMasterVolume();
              this.fullAudio.play().then(() => {
                this.isPlayingFlag = true;
                this._syncPlayPauseIcons(true);
              }).catch(() => {});
            }
          } catch (_) {}
        };
        if (this.fullAudio.readyState >= 1) {
          applyFull();
        } else {
          this.fullAudio.addEventListener('loadedmetadata', applyFull, { once: true });
        }
        if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
          window.DiscoverHomeApp.syncActiveVideoclipPlayback('seek', safeTarget);
        }
        return;
      }

      if (this.fullTrackReady && this.fullAudio.src) {
        this.pendingUserSeekSec = null;
        if (this.isCrossfading) {
          try {
            const realD = Number(this.fullAudio.duration) || fullDur;
            this.fullAudio.currentTime = Math.max(0, Math.min(realD - 0.4, safeTarget));
          } catch (_) {}
          if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
            window.DiscoverHomeApp.syncActiveVideoclipPlayback('seek', safeTarget);
          }
          return;
        }
        await this._performTransparentHandoffToFullTrack(safeTarget, { instant: true });
        return;
      }

      if (this.activeSourceType === 'preview' && this.previewAudio.src) {
        // Aún descargando pista completa -> encolar seek y asegurar extracción en curso
        this.pendingUserSeekSec = safeTarget;
        this.previewBaseOffsetSec = safeTarget;
        this._setLoadingHintVisible(true);
        this.preloadFullTrackInBackground(this.currentTrack).catch(() => {});

        const knownWinStart = Number.isFinite(this._correlatedPreviewStartSec)
          ? this._correlatedPreviewStartSec
          : this.getChorusOffsetSec(this.currentTrack, fullDur);
        const diffFromWin = safeTarget - knownWinStart;
        if (diffFromWin >= 0 && diffFromWin <= 28.5) {
          try {
            this.previewAudio.currentTime = Math.max(0, Math.min(28.8, diffFromWin));
            this.previewBaseOffsetSec = knownWinStart;
            if (ensurePlay && this.previewAudio.paused) {
              this.previewAudio.volume = this._getMasterVolume();
              this.previewAudio.play().then(() => {
                this.isPlayingFlag = true;
                this._syncPlayPauseIcons(true);
              }).catch(() => {});
            }
          } catch (_) {}
        }
        if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
          window.DiscoverHomeApp.syncActiveVideoclipPlayback('seek', safeTarget);
        }
        return;
      }

      // Si no estaba activo ningún canal aún para esta pista, iniciar la pista actual en el segundo elegido
      await this.playTrack(this.currentTrack, { startOffsetSec: safeTarget, syncQueue: false });
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
      this._seekGuard = null;
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

    pauseForGameplayWithFade() {
      this.wasPlayingBeforeGame = this.isPlaying();
      const miniEl = document.getElementById('spotifyMiniPlayer');
      if (miniEl) miniEl.classList.add('hidden-player');
      const modalEl = document.getElementById('nowPlayingTurntableModal');
      if (modalEl) modalEl.classList.remove('open');
      this._stopBothChannelsImmediate();
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
  window.UniversalKaraokeService = karaokeService;
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
        item.title = repairSpanishBrokenAccents(item.title);
        item.artist = repairSpanishBrokenAccents(item.artist || 'Artista');
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
            const meta = resolveCuratedTrackMeta(tr.id, tr.title, tr.artist);
            addTrack({
              id: meta.id,
              videoId: meta.videoId,
              _isPlaceholderVid: meta.isPlaceholder,
              title: tr.title,
              artist: tr.artist,
              genre: plData.title,
              source: meta.isPlaceholder ? 'magic_candidate' : 'magic_youtube',
              source_name: plData.title,
              _isMagicKey: true,
              stars: 4.2,
              thumbnail: meta.thumbnail,
              cover_url: meta.thumbnail
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

      // 2. Búsqueda directa de YouTube en el cliente (~300ms vía YouTubei Worker) sin depender de Render
      if (!resolvedVid && typeof window.searchYouTubeOfficialClient === 'function') {
        try {
          const ytList = await window.searchYouTubeOfficialClient(
            repairSpanishBrokenAccents(track.title || ''),
            repairSpanishBrokenAccents(track.artist || ''),
            Number(track.durationSec) || 0
          );
          if (Array.isArray(ytList) && ytList.length > 0 && ytList[0].videoId) {
            resolvedVid = String(ytList[0].videoId);
            track.videoId = resolvedVid;
            if (ytList[0].durationSec && ytList[0].durationSec > 45 && (!track.durationSec || track.durationSec < 45)) {
              track.durationSec = ytList[0].durationSec;
              if (dualStreamEngine && dualStreamEngine.currentTrack && dualStreamEngine.currentTrack.id === track.id) {
                dualStreamEngine._updatePlayerProgressUI(dualStreamEngine.getCurrentSongTimeSec(), ytList[0].durationSec);
              }
              if (karaokeService) {
                karaokeService.recalibrateForActualAudio(track, ytList[0].durationSec).catch(() => {});
              }
            }
          }
        } catch (_) {}
      }

      // 3. Consulta de respaldo al endpoint del servidor /api/v1/video/resolve si aún falta stream o videoId
      if (!videoStreamUrl && !resolvedVid) {
        try {
          const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 2200);
          const resp = await fetch(
            `${baseUrl}/api/v1/video/resolve?title=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(cleanArtist)}&q=${encodeURIComponent(lookupTerm)}`,
            { signal: ctrl.signal }
          );
          clearTimeout(tid);
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

        if (!playing || eventType === 'pause') {
          if (eventType === 'seek') {
            this._sendVideoclipYtCommand('seekTo', [Math.max(0, Math.floor(targetSec)), true]);
          }
          if (eventType === 'pause' || !this._videoclipForcedPaused) {
            this._sendVideoclipYtCommand('pauseVideo', []);
            this._videoclipForcedPaused = true;
          }
          this._lastVideoclipSyncMs = now;
          this._lastVideoclipSyncedAudioSec = targetSec;
          return;
        }

        if (eventType === 'seek') {
          this._videoclipForcedPaused = false;
          this._lastVideoclipSyncMs = now;
          this._lastVideoclipSyncedAudioSec = targetSec;
          this._sendVideoclipYtCommand('seekTo', [Math.max(0, Math.floor(targetSec)), true]);
          this._sendVideoclipYtCommand('playVideo', []);
          return;
        }

        if (eventType === 'play' || this._videoclipForcedPaused) {
          this._videoclipForcedPaused = false;
          this._lastVideoclipSyncMs = now;
          this._lastVideoclipSyncedAudioSec = targetSec;
          this._sendVideoclipYtCommand('seekTo', [Math.max(0, Math.floor(targetSec)), true]);
          this._sendVideoclipYtCommand('playVideo', []);
          return;
        }

        if (!this._lastVideoclipSyncMs) {
          this._lastVideoclipSyncMs = now;
          this._lastVideoclipSyncedAudioSec = targetSec;
        } else {
          const wallElapsed = (now - this._lastVideoclipSyncMs) / 1000;
          const expectedVideoSec = (this._lastVideoclipSyncedAudioSec || 0) + wallElapsed;
          if (Math.abs(targetSec - expectedVideoSec) > 1.15) {
            this._lastVideoclipSyncMs = now;
            this._lastVideoclipSyncedAudioSec = targetSec;
            this._sendVideoclipYtCommand('seekTo', [Math.max(0, Math.floor(targetSec)), true]);
            this._sendVideoclipYtCommand('playVideo', []);
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

      if (clipData.videoId) {
        cont.setAttribute('data-vid-key', trackKey);
        const startSec = Math.max(0, Math.floor(dualStreamEngine.getCurrentSongTimeSec() || 0));
        this._lastVideoclipSyncMs = performance.now();
        this._lastVideoclipSyncedAudioSec = startSec;
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
          const resyncAfterLoad = () => {
            if (mountReqId !== this._videoclipMountReqId) return;
            const liveSec = Math.max(0, Math.floor(dualStreamEngine.getCurrentSongTimeSec() || 0));
            this._lastVideoclipSyncMs = performance.now();
            this._lastVideoclipSyncedAudioSec = liveSec;
            this._sendVideoclipYtCommand('mute', []);
            this._sendVideoclipYtCommand('seekTo', [liveSec, true]);
            this._sendVideoclipYtCommand(dualStreamEngine.isPlaying() ? 'playVideo' : 'pauseVideo', []);
          };
          ifr.addEventListener('load', () => {
            resyncAfterLoad();
            setTimeout(resyncAfterLoad, 350);
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

      if (explicitDifficulty && typeof window.syncDifficultyToGameModal === 'function') {
        window.syncDifficultyToGameModal(explicitDifficulty);
      }

      if (track.is_top_song || id.startsWith('top_')) {
        if (typeof window.playTopSong === 'function') {
          window.playTopSong(id, explicitDifficulty || window._selectedModalDifficulty || 'Normal', track);
          return;
        }
      }
      if (id.startsWith('comm_') && typeof window.playCommunitySong === 'function') {
        window.playCommunitySong(id, false, explicitDifficulty || window._selectedModalDifficulty || 'Media');
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
            explicitDifficulty || window._selectedModalDifficulty || 'hard',
            null,
            track,
            false
          ).catch(() => null);
          window._inflightPianoPreExtract = { id, promise: preExtractPromise };
        }

        if (!window._modeAlreadyChosenForThisLaunch && typeof window.openGameModeSelectModal === 'function') {
          const chosenMode = await window.openGameModeSelectModal(track.title || 'PISTA', track.artist || '', false);
          if (!chosenMode) return;
          if (typeof window.applySelectedGameMode === 'function') {
            window.applySelectedGameMode(chosenMode);
          }
          window._modeAlreadyChosenForThisLaunch = true;
        }
        const chosenDensity = window._selectedModalDifficulty || explicitDifficulty || 'hard';
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
              ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
              : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`}
          </span>
          <span class="sp-opt-label ${isSongDownloaded ? 'text-[#f3d791] font-extrabold' : ''}">${isSongDownloaded ? 'Ya descargada' : 'Descargar canción (Guardar en Descargas)'}</span>
        </button>

        ${hasBulkDownload ? `
          <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('download_collection')">
            <span class="sp-opt-icon gold">
              ${isCollectionDownloaded
                ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
                : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>`}
            </span>
            <span class="sp-opt-label ${isCollectionDownloaded ? 'text-[#f3d791] font-extrabold' : ''}">${escapeHtmlSafe(bulkLabel)}</span>
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
        karaokeService.showTranslation = true;
        try { localStorage.setItem('piano_karaoke_translate', 'true'); } catch (_) {}
        karaokeService._syncToolbarUI();
        this.openNowPlayingModal('karaoke');
        karaokeService.ensureTranslationsForCurrent(tr).then(() => {
          if (karaokeService.currentTrackKey === karaokeService._makeKey(tr)) {
            karaokeService.renderLinesToDom();
          }
        }).catch(() => {});
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
    // CARRUSELES LIMPIOS ESTILO SPOTIFY + RECOMENDACIONES DIVERSIFICADAS SIN DUPLICADOS
    // =========================================================================
    _getTrackCanonSig(tr) {
      if (!tr) return '';
      return getCanonicalSongSignature(tr.title, tr.artist, tr) || String(tr.id || '');
    },

    _getTrackNormArtist(tr) {
      if (!tr) return '';
      return tr._normArtist !== undefined ? tr._normArtist : normalizeSongPart(tr.artist || '', true);
    },

    _getUserAffinityContext(pool) {
      const highScoresObj = (typeof highscores === 'object' && highscores) ? highscores : {};
      const favSet = (typeof window.favoriteIdsSet !== 'undefined' && window.favoriteIdsSet) ? window.favoriteIdsSet : new Set();
      const likedIds = new Set([...dnaEngine.likes, ...favSet, ...Object.keys(highScoresObj)]);
      const likedArtists = new Set();
      const likedTracks = [];

      if (dnaEngine.lastLikedTrack) {
        dnaEngine.lastLikedTrack.title = repairSpanishBrokenAccents(dnaEngine.lastLikedTrack.title || '');
        dnaEngine.lastLikedTrack.artist = repairSpanishBrokenAccents(dnaEngine.lastLikedTrack.artist || '');
        const na = this._getTrackNormArtist(dnaEngine.lastLikedTrack);
        if (na) likedArtists.add(na);
        likedTracks.push(dnaEngine.lastLikedTrack);
      }

      for (const tr of pool) {
        if (likedIds.has(String(tr.id))) {
          const na = this._getTrackNormArtist(tr);
          if (na) likedArtists.add(na);
          likedTracks.push(tr);
        }
      }

      return { highScoresObj, likedIds, likedArtists, likedTracks };
    },

    _pickDiverseTracks(scoredItems, count, usedSigs, maxPerArtist = 1, globalArtistCounts = null) {
      const selected = [];
      const localArtistCounts = new Map();

      // Primera pasada: máximo maxPerArtist por artista y no repetido en ningún otro carrusel
      for (const item of scoredItems) {
        if (selected.length >= count) break;
        const tr = item.t;
        if (!tr) continue;
        const sig = this._getTrackCanonSig(tr);
        if (sig && usedSigs && usedSigs.has(sig)) continue;
        const art = this._getTrackNormArtist(tr) || `unknown_${tr.id}`;
        const curArtCount = localArtistCounts.get(art) || 0;
        const globCount = globalArtistCounts ? (globalArtistCounts.get(art) || 0) : 0;
        if (curArtCount >= maxPerArtist || globCount >= 2) continue;

        selected.push(tr);
        localArtistCounts.set(art, curArtCount + 1);
        if (globalArtistCounts) globalArtistCounts.set(art, globCount + 1);
        if (sig && usedSigs) usedSigs.add(sig);
      }

      // Segunda pasada de respaldo si faltan pistas para completar el carrusel
      if (selected.length < count) {
        for (const item of scoredItems) {
          if (selected.length >= count) break;
          const tr = item.t;
          if (!tr || selected.includes(tr)) continue;
          const sig = this._getTrackCanonSig(tr);
          if (sig && usedSigs && usedSigs.has(sig)) continue;
          const art = this._getTrackNormArtist(tr) || `unknown_${tr.id}`;
          const curArtCount = localArtistCounts.get(art) || 0;
          if (curArtCount >= maxPerArtist + 1) continue;

          selected.push(tr);
          localArtistCounts.set(art, curArtCount + 1);
          if (sig && usedSigs) usedSigs.add(sig);
        }
      }

      return selected;
    },

    async refreshCarousels() {
      this._usedCarouselSigs = new Set();
      this._globalCarouselArtistCounts = new Map();
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
      const { likedIds, likedArtists, likedTracks } = this._getUserAffinityContext(pool);
      const dayKey = new Date().toISOString().slice(0, 10);

      // Si el usuario tiene canciones con Me Gusta / jugadas, calculamos un centroide real de su gusto
      const personalCentroid = likedTracks.length > 0
        ? dnaEngine.computePlaylistCentroidVector(likedTracks.slice(-18), 'Mi Mix Diario')
        : targetVec;

      const scored = pool
        .filter(t => !dnaEngine.isTrackOnCooldown(t) && !dnaEngine.dislikes.has(String(t.id)))
        .map(t => {
          const vec = dnaEngine.encodeTrackVector(t);
          const simTarget = dnaEngine.cosineSimilarity(targetVec, vec, false);
          const simPersonal = dnaEngine.cosineSimilarity(personalCentroid, vec, true);
          const normArt = this._getTrackNormArtist(t);
          const artistAffinity = (normArt && likedArtists.has(normArt)) ? 0.14 : 0;
          const isLiked = likedIds.has(String(t.id)) ? 0.08 : 0;
          const coverBoost = hasRealHttpCover(t) ? 0.16 : 0;
          const dailyVar = dnaEngine._stableHash01(`daily_${dayKey}_${t.id}`) * 0.11;
          const sc = (simTarget * 0.48) + (simPersonal * 0.42) + artistAffinity + isLiked + coverBoost + dailyVar;
          return { t, sc };
        })
        .sort((a, b) => b.sc - a.sc);

      const dailyList = this._pickDiverseTracks(scored, 14, this._usedCarouselSigs, 1, this._globalCarouselArtistCounts);
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
                   pool.find(t => /bohemian rhapsody|me dediqué a perderte|vivir así es morir de amor|blinding lights/i.test(t.title)) ||
                   pool[0];

      if (!seed) return;
      seed.title = repairSpanishBrokenAccents(seed.title || '');
      seed.artist = repairSpanishBrokenAccents(seed.artist || '');
      if (titleEl) {
        titleEl.textContent = `Porque te gustó ${seed.title}`;
      }

      const seedSig = this._getTrackCanonSig(seed);
      if (seedSig && this._usedCarouselSigs) this._usedCarouselSigs.add(seedSig);

      const seedVec = dnaEngine.encodeTrackVector(seed);
      const seedNormArtist = this._getTrackNormArtist(seed);
      const seedCluster = seed._dnaCluster || 'pop_latin';

      const scored = pool
        .filter(t => String(t.id) !== String(seed.id) && !dnaEngine.dislikes.has(String(t.id)))
        .map(t => {
          const tVec = dnaEngine.encodeTrackVector(t);
          const cosSim = dnaEngine.cosineSimilarity(seedVec, tVec, true);
          const sameCluster = (t._dnaCluster === seedCluster) ? 0.10 : 0;
          const sameArtist = (seedNormArtist && this._getTrackNormArtist(t) === seedNormArtist) ? 0.18 : 0;
          const eraCloseness = Math.max(0, 0.09 - Math.abs((seedVec[2] || 0.5) - (tVec[2] || 0.5)) * 0.15);
          const coverBoost = hasRealHttpCover(t) ? 0.16 : 0;
          const tieBreak = dnaEngine._stableHash01(`because_${seed.id}_${t.id}`) * 0.08;
          return { t, sc: cosSim + sameCluster + sameArtist + eraCloseness + coverBoost + tieBreak };
        })
        .sort((a, b) => b.sc - a.sc);

      const related = this._pickDiverseTracks(scored, 12, this._usedCarouselSigs, 1, this._globalCarouselArtistCounts);
      this._becauseLikedList = related;
      cont.innerHTML = related.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, 'because')).join('');
      this._enrichCarouselCoversAsync(related, 'because');
    },

    _renderWeeklyDiscoveryCarousel() {
      const cont = document.getElementById('carouselWeeklyDiscovery');
      if (!cont) return;

      const pool = this.getAllCandidatePool();
      const targetVec = dnaEngine.getEffectiveTargetVector();
      const { highScoresObj, likedIds, likedArtists } = this._getUserAffinityContext(pool);
      const weekSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));

      // Descubrimiento Semanal: Prioriza canciones que el usuario AÚN NO ha jugado ni guardado en favoritos
      // y artistas nuevos con alta compatibilidad musical (punto óptimo de descubrimiento 0.72–0.92)
      const scored = pool
        .filter(t => !highScoresObj[t.id] && !likedIds.has(String(t.id)) && !dnaEngine.dislikes.has(String(t.id)))
        .map(t => {
          const vec = dnaEngine.encodeTrackVector(t);
          const cosSim = dnaEngine.cosineSimilarity(targetVec, vec, false);
          // Curva campana centrada en 0.83 de afinidad para descubrir joyas afines pero frescas
          const sweetSpotDiscovery = 1 - Math.min(0.6, Math.abs(cosSim - 0.83) * 1.4);
          const normArt = this._getTrackNormArtist(t);
          const freshArtistBonus = (normArt && !likedArtists.has(normArt)) ? 0.16 : -0.05;
          const coverBoost = hasRealHttpCover(t) ? 0.18 : 0;
          const weeklyHash = dnaEngine._stableHash01(`weekly_${weekSeed}_${t.id}`) * 0.18;
          const sc = (sweetSpotDiscovery * 0.55) + (dnaEngine.scoreTrackForRecommendation(t, targetVec) * 0.35) + freshArtistBonus + coverBoost + weeklyHash;
          return { t, sc };
        })
        .sort((a, b) => b.sc - a.sc);

      const weekly = this._pickDiverseTracks(scored, 12, this._usedCarouselSigs, 1, this._globalCarouselArtistCounts);
      this._weeklyDiscoveryList = weekly;
      cont.innerHTML = weekly.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, 'weekly')).join('');
      this._enrichCarouselCoversAsync(weekly, 'weekly');
    },

    _renderPianoVirtuosoCarousel() {
      const cont = document.getElementById('carouselPianoVirtuoso');
      if (!cont) return;
      const pool = this.getAllCandidatePool();
      const scored = pool
        .map(t => {
          const v = dnaEngine.encodeTrackVector(t);
          const notesScore = Math.min(0.22, ((Number(t.total_notes) || 320) / 1800));
          const tieBreak = dnaEngine._stableHash01(`piano_${t.id}`) * 0.09;
          const sc = v[7] * 0.68 + (1 - v[3]) * 0.28 + notesScore + (hasRealHttpCover(t) ? 0.16 : 0) + tieBreak;
          return { t, sc };
        })
        .sort((a, b) => b.sc - a.sc);

      const list = this._pickDiverseTracks(scored, 12, this._usedCarouselSigs, 1, this._globalCarouselArtistCounts);
      this._pianoVirtuosoList = list;
      cont.innerHTML = list.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, 'piano')).join('');
      this._enrichCarouselCoversAsync(list, 'piano');
    },

    _renderHighEnergyCarousel() {
      const cont = document.getElementById('carouselHighEnergy');
      if (!cont) return;
      const pool = this.getAllCandidatePool();
      const scored = pool
        .map(t => {
          const v = dnaEngine.encodeTrackVector(t);
          const tieBreak = dnaEngine._stableHash01(`energy_${t.id}`) * 0.10;
          const sc = v[1] * 0.52 + Math.max(v[4], v[5]) * 0.42 + (hasRealHttpCover(t) ? 0.16 : 0) + tieBreak;
          return { t, sc };
        })
        .sort((a, b) => b.sc - a.sc);

      const list = this._pickDiverseTracks(scored, 12, this._usedCarouselSigs, 1, this._globalCarouselArtistCounts);
      this._highEnergyList = list;
      cont.innerHTML = list.map((tr, idx) => this._buildSmartCarouselCardHtml(tr, idx, 'energy')).join('');
      this._enrichCarouselCoversAsync(list, 'energy');
    },

    _renderHiddenGemsCarousel() {
      const cont = document.getElementById('carouselHiddenGems');
      if (!cont) return;
      const pool = this.getAllCandidatePool();
      const scored = pool
        .filter(t => !dnaEngine.likes.has(String(t.id)))
        .map(t => {
          const v = dnaEngine.encodeTrackVector(t);
          const gemHash = dnaEngine._stableHash01(`gems_${t.id}`);
          const novelty = Math.abs(v[2] - 0.42) * 0.25 + (hasRealHttpCover(t) ? 0.18 : 0) + (gemHash * 0.24);
          return { t, sc: novelty + dnaEngine.scoreTrackForRecommendation(t) * 0.48 };
        })
        .sort((a, b) => b.sc - a.sc);

      const list = this._pickDiverseTracks(scored, 12, this._usedCarouselSigs, 1, this._globalCarouselArtistCounts);
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

        const scored = pool
          .filter(t => !this.isTrackAlreadyInList(t, plTracks) && !dnaEngine.isTrackOnCooldown(t))
          .map(t => ({
            t,
            sc: dnaEngine.scoreTrackForPlaylist(t, pl, centroid) + (hasRealHttpCover(t) ? 0.18 : 0) + (dnaEngine._stableHash01(`pl_${pl.id}_${t.id}`) * 0.08)
          }))
          .sort((a, b) => b.sc - a.sc);

        const recs = this._pickDiverseTracks(scored, 12, this._usedCarouselSigs, 1, this._globalCarouselArtistCounts);

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
      const mapped = (pl.tracks || []).map((t, i) => {
        const cleanCandVid = String(t.videoId || '').replace(/^magic_yt_|^yt_/, '').trim() ||
          (/^(magic_yt_|yt_)?[A-Za-z0-9_-]{11}$/.test(String(t.id || '').trim()) ? String(t.id || '').replace(/^magic_yt_|^yt_/, '').trim() : '');
        const meta = cleanCandVid ? resolveCuratedTrackMeta(cleanCandVid, t.title, t.artist || 'Artista') : null;
        return {
          ...t,
          id: (meta && meta.isPlaceholder) ? meta.id : (t.id || `pl_tr_${Date.now()}_${i}`),
          videoId: (meta && meta.isPlaceholder) ? '' : (meta ? meta.videoId : (t.videoId || '')),
          _isPlaceholderVid: Boolean(meta && meta.isPlaceholder),
          thumbnail: (meta && meta.isPlaceholder) ? './app_logo.png' : (t.thumbnail || t.cover_url || (meta && meta.thumbnail) || './app_logo.png')
        };
      });
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
            const tracks = parsed.tracks.map(t => {
              const meta = resolveCuratedTrackMeta(t.id, t.title, t.artist);
              return {
                id: meta.id,
                videoId: meta.videoId,
                _isPlaceholderVid: meta.isPlaceholder,
                title: t.title,
                artist: t.artist || 'Artista',
                thumbnail: meta.isPlaceholder ? (t.thumbnail && !/ytimg\.com/.test(t.thumbnail) ? t.thumbnail : './app_logo.png') : (t.thumbnail || meta.thumbnail),
                source: meta.isPlaceholder ? 'magic_candidate' : 'magic_youtube',
                _isMagicKey: true
              };
            });
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

    async seekToKaraokeLine(lineIdx) {
      if (!karaokeService || !Array.isArray(karaokeService.currentLyrics)) return;
      const line = karaokeService.currentLyrics[lineIdx];
      if (!line || !Number.isFinite(line.timeSec)) return;

      const offsetSec = Number(karaokeService.timeOffsetSec || 0);
      const targetAudioSec = Math.max(0, +(Number(line.timeSec) - offsetSec - 0.15).toFixed(2));
      karaokeService._userScrollingUntil = 0;
      karaokeService._userManualScrollUntil = 0;
      karaokeService.activeLineIndex = -1;

      if (!dualStreamEngine.currentTrack) {
        const active = this.getActiveCrateTrack();
        if (!active) return;
        karaokeService.syncTime(targetAudioSec, { forceScroll: true, immediateLineIdx: lineIdx });
        await dualStreamEngine.playTrack(active, { autoPlay: true, startOffsetSec: targetAudioSec });
        return;
      }

      await dualStreamEngine.seekToSeconds(targetAudioSec, { ensurePlay: true, lineIdx });
    },

    adjustKaraokeOffset(deltaSec = 0) {
      if (karaokeService && typeof karaokeService.adjustOffset === 'function') {
        karaokeService.adjustOffset(deltaSec);
      }
    },

    nudgeKaraokeOffset(deltaSec = 0) {
      if (karaokeService && typeof karaokeService.nudgeOffset === 'function') {
        karaokeService.nudgeOffset(deltaSec);
      }
    },

    resetKaraokeOffset() {
      if (karaokeService && typeof karaokeService.resetOffset === 'function') {
        karaokeService.resetOffset();
      }
    },

    jumpToChorus() {
      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (!tr) return;
      const chorusSec = dualStreamEngine.getChorusOffsetSec(tr);
      dualStreamEngine.seekToSeconds(chorusSec, { ensurePlay: true });
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


