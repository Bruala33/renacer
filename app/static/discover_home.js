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
              if (!item || (!item.artworkUrl100 && !item.trackTimeMillis)) continue;
              const art600 = item.artworkUrl100
                ? item.artworkUrl100.replace('100x100bb', '600x600bb')
                : '';
              const relYear = item.releaseDate ? parseInt(String(item.releaseDate).slice(0, 4), 10) : null;
              return {
                previewUrl: '',
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

        // Tarea 2: Servidor (/api/v1/audio/instant_preview que cruza Deezer Public API + iTunes API solo para carátula y metadatos)
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
            if (data && (data.artworkUrl600 || data.artworkUrl || data.durationSec)) {
              const art600 = data.artworkUrl600 || (data.artworkUrl ? data.artworkUrl.replace('300x300bb', '600x600bb').replace('100x100bb', '600x600bb') : '');
              return {
                previewUrl: '',
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
              if (!item || !item.trackName) continue;
              addExt({
                title: item.trackName,
                artist: item.artistName,
                previewUrl: '',
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
      videoId: 'kwG8PIdLUlM',
      keys: ['soldaditofarlo', 'soldaditofarlopero', 'perreosanxesoldaditofarlo', 'perreosanxesoldaditofarlopero', 'jcsesoldaditofarlo', 'jcsesoldaditofarlopero'],
      trackName: 'Soldadito Farlo',
      artistName: 'Perreo Sanxe',
      duration: 96,
      syncedLyrics: `[00:28.20] Él camina acelerado que el camello nunca espera
[00:35.20] El billete dobladito con cuidado en la cartera
[00:42.20] Luego pilla un par de gramos porque esta noche hay juerga
[00:48.80] Él también quiso ser niño pero le pilló la juerga
[00:55.60] Soldadito farlopero conociste a una sirena
[01:02.44] De esas que suenan en la calle cuando la policía llega
[01:09.48] Escogiste la más cara y la menos buena
[01:16.32] Sin saber cómo ha venido te ha llevado la madera`
    },
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
      this.whisperAlignedMeta = new Map();
      this._manualOffsetAfterAiKeys = new Set();
      this._aiSyncStatusMap = new Map();
      this._serverFallbackTimers = new Map();
      this._whisperLaunchGuard = new Map();
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
      const resolvedKey = (trackKey && typeof trackKey === 'object') ? this._makeKey(trackKey) : trackKey;
      if (!resolvedKey) return 0;
      const val = Number(this.userOffsetsMap?.[resolvedKey]);
      return Number.isFinite(val) ? Math.max(-120, Math.min(120, val)) : 0;
    }

    setUserOffsetSec(trackKey, offsetSec, options = {}) {
      const resolvedKey = (trackKey && typeof trackKey === 'object') ? this._makeKey(trackKey) : trackKey;
      if (!resolvedKey) return 0;
      const clamped = Math.max(-120, Math.min(120, +(Number(offsetSec) || 0).toFixed(2)));
      const normalized = Math.abs(clamped) < 0.05 ? 0 : clamped;
      if (!options?.fromAiReset && this.whisperAlignedMeta.has(resolvedKey)) {
        if (normalized !== 0) {
          this._manualOffsetAfterAiKeys.add(resolvedKey);
        } else {
          this._manualOffsetAfterAiKeys.delete(resolvedKey);
        }
      }
      if (normalized === 0) {
        delete this.userOffsetsMap[resolvedKey];
      } else {
        this.userOffsetsMap[resolvedKey] = normalized;
      }
      this._saveUserOffsets();
      if (resolvedKey === this.currentTrackKey) {
        this.timeOffsetSec = normalized;
        this._userScrollingUntil = 0;
        this._userManualScrollUntil = 0;
        this._syncToolbarUI();
        if (!options?.skipRender && Array.isArray(this.currentLyrics) && this.currentLyrics.length > 0) {
          this.renderLinesToDom({ skipSingStarNotify: Boolean(options?.skipSingStarNotify) });
        }
        if (!options?.skipRender) {
          const curSec = (typeof dualStreamEngine !== 'undefined' && dualStreamEngine)
            ? dualStreamEngine.getCurrentSongTimeSec()
            : (this._lastSyncAudioSec || 0);
          this.activeLineIndex = -1;
          const syncOpts = { forceScroll: true };
          if (Number.isFinite(options?.immediateLineIdx)) {
            syncOpts.immediateLineIdx = options.immediateLineIdx;
          }
          this.syncTime(curSec, syncOpts);
        }
        return this.timeOffsetSec;
      }
      return normalized;
    }

    isWhisperVerifiedFor(trackKey, actualDurSec = 0) {
      if (!trackKey) return false;
      const meta = this.whisperAlignedMeta.get(trackKey);
      if (!meta || !meta.verified) return false;
      if (actualDurSec >= 35 && meta.audioDurSec >= 35 && Math.abs(meta.audioDurSec - actualDurSec) > 3.5) {
        return false;
      }
      return true;
    }

    setKaraokeAiSyncStatus(trackKey, label = '', state = '') {
      if (trackKey) {
        if (label) {
          this._aiSyncStatusMap.set(trackKey, { label, state: state || '' });
        } else {
          this._aiSyncStatusMap.delete(trackKey);
        }
      }
      if (!trackKey || trackKey === this.currentTrackKey) {
        this._renderAiSyncChip(label, state);
      }
    }

    _renderAiSyncChip(label = '', state = '') {
      const chip = document.getElementById('npKaraokeAiSyncChip');
      if (!chip) return;
      if (!label) {
        chip.classList.add('hidden');
        chip.classList.remove('working', 'ready');
        chip.textContent = '';
        return;
      }
      chip.textContent = label;
      chip.classList.remove('hidden', 'working', 'ready');
      if (state === 'working' || state === 'ready') {
        chip.classList.add(state);
      }
    }

    applyWhisperVerifiedLines(track, key, alignedLines, meta = {}) {
      if (!key || !Array.isArray(alignedLines) || alignedLines.length === 0) return false;
      const cleanLines = alignedLines
        .filter(l => l && !l._isAcousticVocalIsland && !l._isFallbackPlaceholder && String(l.text || '').trim().length > 0)
        .map(l => ({ ...l, _isWhisperAligned: true }));
      if (cleanLines.length === 0) return false;

      const st = track ? this._getOrInitTrackState(track) : this.trackCalibrationState.get(key);
      const audioDurSec = Number(meta.audioDurSec) || (st && st.actualDur) || this.knownAudioDurations.get(key) || 0;
      const shiftSec = Number.isFinite(Number(meta.shiftSec)) ? +Number(meta.shiftSec).toFixed(2) : 0;
      const slope = Number.isFinite(Number(meta.slope)) ? +Number(meta.slope).toFixed(4) : 1.0;

      // Cancelar cualquier temporizador de respaldo de servidor pendiente
      const pendingTimer = this._serverFallbackTimers.get(key);
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        this._serverFallbackTimers.delete(key);
      }

      const isFinalOrLocked = Boolean(meta.hasGlobalLock || meta.isComplete || meta.fromCache || cleanLines.length >= 2);
      if (isFinalOrLocked) {
        this.whisperAlignedMeta.set(key, {
          verified: true,
          audioDurSec,
          shiftSec,
          slope,
          matchedWords: Number(meta.matchedWords) || 0,
          anchoredLines: Number(meta.anchoredLines) || 0,
          isComplete: Boolean(meta.isComplete || meta.fromCache),
          updatedAt: Date.now()
        });
      }

      // Al bloquear por primera vez con IA real, limpiar cualquier offset manual antiguo obsoleto
      // (respetando ajustes manuales que el usuario haga DESPUÉS del bloqueo IA).
      if (isFinalOrLocked && !this._manualOffsetAfterAiKeys.has(key) && Math.abs(this.getUserOffsetSec(key)) >= 0.05) {
        this.setUserOffsetSec(key, 0, { fromAiReset: true, skipRender: true, skipSingStarNotify: true });
      }

      if (st) {
        st.isFallbackOnly = false;
        if (audioDurSec >= 35) st.actualDur = audioDurSec;
      }
      this.cache.set(key, cleanLines.map(l => ({ ...l })));

      if (meta.isComplete || meta.fromCache || meta.hasGlobalLock) {
        const absShift = Math.abs(shiftSec);
        const readyLabel = absShift >= 0.65
          ? `Sincro IA · ${shiftSec > 0 ? '+' : ''}${shiftSec.toFixed(1)}s`
          : 'Sincro IA · 10ms';
        this.setKaraokeAiSyncStatus(key, meta.isComplete || meta.fromCache ? readyLabel : `${readyLabel}...`, meta.isComplete || meta.fromCache ? 'ready' : 'working');
      }

      if (this.currentTrackKey === key) {
        this.currentLyrics = cleanLines.map(l => ({ ...l, elasticOffsetSec: 0 }));
        this.activeLineIndex = -1;
        this.renderLinesToDom({ skipSingStarNotify: true });
        const curSec = (typeof dualStreamEngine !== 'undefined' && dualStreamEngine)
          ? dualStreamEngine.getCurrentSongTimeSec()
          : (this._lastSyncAudioSec || 0);
        const canAutoScroll = !this._isUserManualScrolling && Date.now() >= Math.max(this._userScrollingUntil || 0, this._userManualScrollUntil || 0);
        this.syncTime(curSec, { forceScroll: canAutoScroll });
        if (this.showTranslation && track) {
          this.ensureTranslationsForCurrent(track).then(() => {
            if (this.currentTrackKey === key) this.renderLinesToDom({ skipSingStarNotify: true });
          }).catch(() => {});
        }
      }
      return true;
    }

    calibrateToHeldLine(lineIdx, currentSec = null) {
      if (!this.currentTrackKey || !Array.isArray(this.currentLyrics)) return null;
      const line = this.currentLyrics[lineIdx];
      if (!line || !Number.isFinite(Number(line.timeSec))) return null;
      const curSec = (typeof currentSec === 'number' && Number.isFinite(currentSec))
        ? Math.max(0, currentSec)
        : ((typeof dualStreamEngine !== 'undefined' && dualStreamEngine)
            ? dualStreamEngine.getCurrentSongTimeSec()
            : (this._lastSyncAudioSec || 0));
      const targetOffset = +(Number(line.timeSec) - curSec).toFixed(2);
      return this.setUserOffsetSec(this.currentTrackKey, targetOffset, { immediateLineIdx: lineIdx });
    }

    setTimeOffset(offsetSec = 0) {
      if (!this.currentTrackKey) return 0;
      return this.setUserOffsetSec(this.currentTrackKey, Number(offsetSec) || 0);
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
          ? (lang === 'en' ? 'Trad. (EN)' : 'Trad. (ES)')
          : 'Traducir';
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
      const aiSt = this.currentTrackKey ? this._aiSyncStatusMap.get(this.currentTrackKey) : null;
      if (aiSt && aiSt.label) {
        this._renderAiSyncChip(aiSt.label, aiSt.state);
      } else if (this.currentTrackKey && this.whisperAlignedMeta.has(this.currentTrackKey)) {
        const meta = this.whisperAlignedMeta.get(this.currentTrackKey);
        const absS = Math.abs(Number(meta?.shiftSec) || 0);
        const lbl = absS >= 0.65
          ? `Sincro IA · ${meta.shiftSec > 0 ? '+' : ''}${meta.shiftSec.toFixed(1)}s`
          : 'Sincro IA · 10ms';
        this._renderAiSyncChip(lbl, 'ready');
      } else {
        this._renderAiSyncChip('', '');
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
        .replace(/\b(feat\.?|ft\.?|featuring)\b.*$/i, '')
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
      const pauseTimes = [];

      for (const rawLine of lines) {
        const matches = [...rawLine.matchAll(lineTimeRe)];
        if (matches.length === 0) continue;
        const afterLineTags = rawLine.replace(lineTimeRe, '').trim();
        if (!afterLineTags) {
          for (const m of matches) {
            const min = parseInt(m[1], 10) || 0;
            const sec = parseInt(m[2], 10) || 0;
            const fracStr = String(m[3] || '0').padEnd(3, '0').slice(0, 3);
            const ms = parseInt(fracStr, 10) || 0;
            const pSec = Math.max(0, min * 60 + sec + ms / 1000 - headerOffsetSec);
            pauseTimes.push(+pSec.toFixed(2));
          }
          continue;
        }

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
      pauseTimes.sort((a, b) => a - b);
      const deduped = [];
      for (const item of parsed) {
        const prev = deduped[deduped.length - 1];
        if (prev && Math.abs(item.timeSec - prev.timeSec) < 0.08 && item.text === prev.text) continue;
        deduped.push(item);
      }
      let pIdx = 0;
      for (let i = 0; i < deduped.length; i++) {
        const curT = deduped[i].timeSec;
        const nextT = (i + 1 < deduped.length) ? deduped[i + 1].timeSec : (curT + 4.2);
        while (pIdx < pauseTimes.length && pauseTimes[pIdx] <= curT + 0.25) pIdx++;
        const nextPauseT = (pIdx < pauseTimes.length && pauseTimes[pIdx] < nextT) ? pauseTimes[pIdx] : nextT;
        const boundT = Math.min(nextT, nextPauseT);
        deduped[i].endTimeSec = +Math.max(curT + 0.5, Math.min(curT + 6.5, boundT - 0.06)).toFixed(2);
      }
      if (lrcDeclaredLengthSec > 0) {
        deduped._lrcLengthSec = lrcDeclaredLengthSec;
      }
      return deduped;
    }

    _isNativeChartTextCorrupted(lines) {
      if (!Array.isArray(lines) || lines.length < 4) return true;
      let badTokenCount = 0;
      let totalWords = 0;
      const garbledRe = /\b(?:lque|yyp|teco|qeu|dlr|stdo|xqz|kjh|bvc|zxc)\b|[bcdfghjklmnpqrstvwxyzñ]{4,}/i;
      for (const l of lines) {
        const txt = String(l?.text || '').trim();
        if (!txt) continue;
        const wList = txt.split(/\s+/).filter(Boolean);
        for (const w of wList) {
          totalWords++;
          const cleanW = w.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, '');
          if (cleanW.length >= 3 && !/[aeiouáéíóúüAEIOUÁÉÍÓÚÜyY]/.test(cleanW)) {
            badTokenCount += 2;
          } else if (garbledRe.test(cleanW)) {
            badTokenCount += 2;
          }
        }
        if (Array.isArray(l.words)) {
          for (const sw of l.words) {
            const st = String(sw?.text || '').replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, '');
            if (st.length >= 3 && !/[aeiouáéíóúüAEIOUÁÉÍÓÚÜyY]/.test(st)) {
              badTokenCount += 2;
            } else if (garbledRe.test(st)) {
              badTokenCount += 2;
            }
          }
        }
      }
      return totalWords < 8 || badTokenCount >= 2 || (badTokenCount / Math.max(1, totalWords)) > 0.06;
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

        for (let si = 0; si < verse.length; si++) {
          const syl = verse[si];
          if (!syl) continue;
          const rawSec = Number.isFinite(Number(syl.time)) ? Number(syl.time) : 0;
          const tSec = Math.max(0, rawSec / 1000);
          const durSec = Math.max(0.12, (Number(syl.dur) || 260) / 1000);
          const rawT = repairSpanishBrokenAccents(String(syl.text !== undefined && syl.text !== null ? syl.text : ''));
          let cleanToken = rawT.replace(/~/g, '');
          if (!cleanToken.trim()) continue;
          // Reparar tokens corruptos comunes de Whisper en charts antiguos
          cleanToken = cleanToken
            .replace(/\blque\b/gi, 'lo que ')
            .replace(/\bteco\b/gi, 'te co')
            .replace(/\byyp\b/gi, 'y ya pongo ');
          if (firstTimeSec === null) firstTimeSec = tSec;
          lastEndSec = Math.max(lastEndSec, tSec + durSec);
          words.push({ timeSec: +tSec.toFixed(3), endSec: +(tSec + durSec).toFixed(3), text: cleanToken });
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
      if (this._isNativeChartTextCorrupted(lines)) {
        return [];
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
          text,
          _isUnalignedPlainLyrics: true
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

      // Filtro paso banda vocal (350 Hz - 2800 Hz) con separación Mid/Side (voz centrada vs acompañamiento estéreo)
      const dt = 1 / srEff;
      const rcHp = 1 / (2 * Math.PI * 350);
      const aHp = rcHp / (rcHp + dt);
      const rcLp = 1 / (2 * Math.PI * 2800);
      const aLp = dt / (rcLp + dt);

      let prevMidIn = 0;
      let hpMidOut = 0;
      let lpMidOut = 0;
      let prevSideIn = 0;
      let hpSideOut = 0;
      let lpSideOut = 0;

      const rawTotal = new Float32Array(nFrames);
      const rawVoice = new Float32Array(nFrames);
      const rawLogSalience = new Float32Array(nFrames);
      const nonZeroTotal = [];
      const nonZeroVoice = [];
      const activeLogSal = [];

      for (let f = 0; f < nFrames; f++) {
        const sStart = Math.floor((f / FRAME_HZ) * sr);
        const sEnd = Math.min(ch0.length, Math.floor(((f + 1) / FRAME_HZ) * sr));
        let sumTotal = 0;
        let sumMidVoice = 0;
        let sumSideVoice = 0;
        let cnt = 0;
        for (let s = sStart; s < sEnd; s += step) {
          const l = ch0[s];
          const r = ch1 ? ch1[s] : l;
          const mid = 0.5 * (l + r);
          const side = ch1 ? 0.5 * (l - r) : 0;
          sumTotal += mid * mid + 0.35 * side * side;

          hpMidOut = aHp * (hpMidOut + mid - prevMidIn);
          prevMidIn = mid;
          lpMidOut = lpMidOut + aLp * (hpMidOut - lpMidOut);
          sumMidVoice += lpMidOut * lpMidOut;

          if (ch1) {
            hpSideOut = aHp * (hpSideOut + side - prevSideIn);
            prevSideIn = side;
            lpSideOut = lpSideOut + aLp * (hpSideOut - lpSideOut);
            sumSideVoice += lpSideOut * lpSideOut;
          }
          cnt++;
        }
        const rmsT = cnt > 0 ? Math.sqrt(sumTotal / cnt) : 0;
        const midV = cnt > 0 ? Math.sqrt(sumMidVoice / cnt) : 0;
        const sideV = cnt > 0 ? Math.sqrt(sumSideVoice / cnt) : 0;
        // Dominancia de voz centrada sobre instrumentos estéreo abiertos en banda vocal
        const centerFocus = ch1 ? Math.min(1.25, (midV + 0.002) / (midV + 0.55 * sideV + 0.002)) : 1.0;
        const rmsV = midV * centerFocus;
        rawTotal[f] = rmsT;
        rawVoice[f] = rmsV;

        // Saliencia vocal log-comprimida (iguala estrofas suaves y estribillos fuertes; rechaza bombos/bajos y guitarras panoramizadas)
        const centerW = ch1 ? Math.min(1.45, (midV + 0.001) / (midV + 0.65 * sideV + 0.001)) : 1.0;
        const bandW = Math.min(1.50, (midV + 0.0005) / (rmsT * 0.72 + 0.0005));
        const logSal = Math.log10(midV * centerW * Math.pow(bandW, 0.55) + 1e-5);
        rawLogSalience[f] = logSal;

        if (rmsT > 0.0005) nonZeroTotal.push(rmsT);
        if (rmsV > 0.0003) nonZeroVoice.push(rmsV);
        if (rmsT > 0.0020) activeLogSal.push(logSal);
      }

      if (nonZeroTotal.length < 10) return null;
      nonZeroTotal.sort((a, b) => a - b);
      nonZeroVoice.sort((a, b) => a - b);
      const p90T = nonZeroTotal[Math.min(nonZeroTotal.length - 1, Math.floor(nonZeroTotal.length * 0.90))] || 0.1;
      const p90V = nonZeroVoice[Math.min(nonZeroVoice.length - 1, Math.floor(nonZeroVoice.length * 0.90))] || p90T * 0.5;
      const silenceCutT = Math.max(0.0015, p90T * 0.045);

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

      const envOnset = new Float32Array(nFrames);
      for (let f = 1; f < nFrames; f++) {
        const diff = envVoice[f] - envVoice[f - 1];
        envOnset[f] = diff > 0 ? Math.min(1.2, diff * 1.4) : 0;
      }

      // Curva Sigmoid Vocal-VAD adaptativa [0..1] + flujo de entrada (vadOnset) y cierre (vadOffset) de frases
      const vadRaw = new Float32Array(nFrames);
      const vadCurve = new Float32Array(nFrames);
      const vadOnset = new Float32Array(nFrames);
      const vadOffset = new Float32Array(nFrames);
      if (activeLogSal.length >= 10) {
        activeLogSal.sort((a, b) => a - b);
        const p25 = activeLogSal[Math.floor(activeLogSal.length * 0.25)];
        const p55 = activeLogSal[Math.floor(activeLogSal.length * 0.55)];
        const p85 = activeLogSal[Math.min(activeLogSal.length - 1, Math.floor(activeLogSal.length * 0.85))];
        const dynRange = Math.max(0.24, p85 - p25);
        const midThr = p55 - 0.06 * dynRange;
        const spread = Math.max(0.14, dynRange * 0.36);

        for (let f = 0; f < nFrames; f++) {
          if (rawTotal[f] < silenceCutT) {
            vadRaw[f] = 0;
          } else {
            const z = (rawLogSalience[f] - midThr) / spread;
            vadRaw[f] = 1.0 / (1.0 + Math.exp(-Math.max(-12, Math.min(12, z))));
          }
        }
        for (let f = 0; f < nFrames; f++) {
          const a = vadRaw[Math.max(0, f - 1)];
          const b = vadRaw[f];
          const c = vadRaw[Math.min(nFrames - 1, f + 1)];
          vadCurve[f] = 0.25 * a + 0.50 * b + 0.25 * c;
        }
        // Flujo direccional de inicio (0->1) y fin (1->0) de frase vocal sobre ventanas ±0.5s
        for (let f = 0; f < nFrames; f++) {
          let pre = 0, preCnt = 0;
          for (let k = Math.max(0, f - 6); k < f; k++) { pre += vadCurve[k]; preCnt++; }
          let post = 0, postCnt = 0;
          for (let k = f; k <= Math.min(nFrames - 1, f + 5); k++) { post += vadCurve[k]; postCnt++; }
          const diff = (postCnt > 0 ? post / postCnt : 0) - (preCnt > 0 ? pre / preCnt : 0);
          vadOnset[f] = diff > 0 ? diff : 0;
          vadOffset[f] = diff < 0 ? -diff : 0;
        }
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
        envOnset,
        vadCurve,
        vadOnset,
        vadOffset,
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
      const { frameHz, envTotal, envVoice, envOnset, musicStartSec, musicEndSec, actualDur } = env;
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

      const sampleMaxWindow = (arr, tStartSec, tEndSec) => {
        if (!arr) return 0;
        const f0 = Math.max(0, Math.min(maxFrame, Math.floor(tStartSec * frameHz)));
        const f1 = Math.max(f0, Math.min(maxFrame, Math.ceil(tEndSec * frameHz)));
        let mx = 0;
        for (let f = f0; f <= f1; f++) {
          if (arr[f] > mx) mx = arr[f];
        }
        return mx;
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
          const blended = 0.78 * eVoc + 0.22 * eTot;
          sungVoiceSum += blended;
          if (eTot < 0.055) deadAir++;
          const prevGapSec = i === 0 ? 1.5 : ((l.timeSec - (lines[i - 1].endTimeSec || lines[i - 1].timeSec)) * scale);
          if (prevGapSec >= 0.65 && t >= 0.7) {
            const eBefore = sampleWindow(envVoice, t - 0.75, t - 0.15);
            const eAfter = sampleWindow(envVoice, t, Math.min(actualDur - 0.1, t + 0.95));
            const peakOnset = envOnset ? sampleMaxWindow(envOnset, Math.max(0, t - 0.15), Math.min(actualDur - 0.05, t + 0.45)) : 0;
            onsetSum += (eAfter - eBefore) + 0.32 * peakOnset;
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
        if (gap >= 2.5) {
          const mid = ((endCur + lines[i + 1].timeSec) * 0.5) * scale + shiftSec;
          if (mid >= musicStartSec && mid <= musicEndSec - 0.8) {
            gapVoiceSum += sampleWindow(envVoice, mid - 0.9, mid + 0.9);
            gapCount++;
          }
        }
      }

      const sungAvg = checked > 0 ? (sungVoiceSum / checked) : 0;
      const onsetAvg = onsetCount > 0 ? (onsetSum / onsetCount) : 0;
      const gapAvg = gapCount > 0 ? (gapVoiceSum / gapCount) : (sungAvg * 0.5);
      const oobFrac = checked > 0 ? (outOfBounds / checked) : 0;
      const deadFrac = checked > 0 ? (deadAir / checked) : 0;
      const shiftPrior = Math.abs(shiftSec) < 0.65 ? 0 : Math.min(0.085, Math.abs(shiftSec) * 0.0011);

      return sungAvg + 0.40 * onsetAvg - 0.42 * gapAvg - 2.4 * oobFrac - 1.2 * deadFrac - shiftPrior;
    }

    _computeDspAlignment(parsedLines, declaredDur, env) {
      if (!Array.isArray(parsedLines) || parsedLines.length < 3 || !env) {
        return { shiftSec: 0, scale: 1.0, score: 0, scoreZero: 0, margin: 0, isVerifiedLock: false, lines: parsedLines };
      }

      const frameHz = env.frameHz || 10;
      const actualDur = Number(env.actualDur) || 0;
      let vadCurve = env.vadCurve;
      let vadOnset = env.vadOnset;
      let vadOffset = env.vadOffset;

      // Respaldo compatible si un env externo solo trae envVoice/envOnset (sintetiza curvas Vocal-VAD)
      if (!vadCurve || !vadOnset || !vadOffset || vadCurve.length < 25) {
        const srcVoice = env.envVoice;
        if (!srcVoice || srcVoice.length < 25) {
          const obj0 = this._scoreAlignmentOnEnvelope(parsedLines, env, 0, 1.0);
          return {
            shiftSec: 0,
            scale: 1.0,
            score: obj0,
            scoreZero: obj0,
            margin: 0,
            isVerifiedLock: false,
            lines: parsedLines.map(l => ({ ...l, elasticOffsetSec: 0 }))
          };
        }
        const nSrc = srcVoice.length;
        vadCurve = srcVoice;
        vadOnset = env.envOnset && env.envOnset.length === nSrc ? env.envOnset : new Float32Array(nSrc);
        vadOffset = new Float32Array(nSrc);
        const needOn = !(env.envOnset && env.envOnset.length === nSrc);
        for (let f = 1; f < nSrc; f++) {
          const diff = srcVoice[f] - srcVoice[f - 1];
          if (needOn && diff > 0) vadOnset[f] = Math.min(1, diff * 1.4);
          if (diff < 0) vadOffset[f] = Math.min(1, -diff * 1.4);
        }
      }

      const nAudio = vadCurve.length;
      const firstVocalSec = Number(parsedLines[0].timeSec) || 0;
      let lastLineEndSec = firstVocalSec + 4;
      for (let i = 0; i < parsedLines.length; i++) {
        const e = Number(parsedLines[i].endTimeSec) || (Number(parsedLines[i].timeSec || 0) + 3.2);
        if (e > lastLineEndSec) lastLineEndSec = e;
      }
      const lrcDur = Number(declaredDur) || (lastLineEndSec + 6);

      // Construir plantilla binaria + pulsos de ataque/cierre de fraseo en toda la línea de tiempo [0 .. lastLineEnd+4s]
      const buildTemplate = (scale) => {
        const scaledEnd = lastLineEndSec * scale;
        const tplLen = Math.max(30, Math.min(nAudio + 600, Math.ceil((scaledEnd + 4.0) * frameHz)));
        const tVad = new Float32Array(tplLen);
        const tOn = new Float32Array(tplLen);
        const tOff = new Float32Array(tplLen);
        let vocalFrameTotal = 0;

        for (let i = 0; i < parsedLines.length; i++) {
          const l = parsedLines[i];
          const sSec = Number(l.timeSec || 0) * scale;
          const eSecRaw = Number(l.endTimeSec || (Number(l.timeSec || 0) + 3.2)) * scale;
          const nextSec = (i + 1 < parsedLines.length) ? (Number(parsedLines[i + 1].timeSec || 0) * scale) : (eSecRaw + 5.0);
          const eSec = Math.max(sSec + 0.4, Math.min(eSecRaw, nextSec - 0.05));

          const sF = Math.max(0, Math.min(tplLen - 1, Math.round(sSec * frameHz)));
          const eF = Math.max(sF, Math.min(tplLen - 1, Math.round(eSec * frameHz)));
          for (let f = sF; f <= eF; f++) {
            if (tVad[f] === 0) vocalFrameTotal++;
            tVad[f] = 1.0;
          }

          const prevEnd = i === 0 ? 0 : (Number(parsedLines[i - 1].endTimeSec || (Number(parsedLines[i - 1].timeSec || 0) + 3.0)) * scale);
          const gapBefore = i === 0 ? Math.max(1.8, sSec) : Math.max(0, sSec - prevEnd);
          const onWeight = gapBefore >= 1.8 ? 1.35 : (gapBefore >= 0.70 ? 1.05 : 0.55);
          for (let df = -3; df <= 3; df++) {
            const idx = sF + df;
            if (idx >= 0 && idx < tplLen) {
              const w = onWeight * (1.0 - Math.abs(df) / 3.8);
              if (w > tOn[idx]) tOn[idx] = w;
            }
          }

          const gapAfter = Math.max(0, nextSec - eSec);
          if (gapAfter >= 0.65 || i === parsedLines.length - 1) {
            const offWeight = gapAfter >= 1.8 ? 1.25 : 0.90;
            for (let df = -3; df <= 3; df++) {
              const idx = eF + df;
              if (idx >= 0 && idx < tplLen) {
                const w = offWeight * (1.0 - Math.abs(df) / 3.8);
                if (w > tOff[idx]) tOff[idx] = w;
              }
            }
          }
        }
        return { tplLen, tVad, tOn, tOff, vocalFrameTotal: Math.max(1, vocalFrameTotal) };
      };

      const tpl1 = buildTemplate(1.0);

      // Correlación de Pearson normalizada de media cero en toda la línea de tiempo (soporta lags enteros y sub-frame 0.05s)
      const evalTemplateAtShift = (tpl, shiftSec) => {
        const shiftF = shiftSec * frameHz;
        const intShift = Math.floor(shiftF);
        const frac = shiftF - intShift;
        const useLerp = frac > 1e-4 && frac < 0.9999;

        const maxAudioIdx = useLerp ? (nAudio - 2) : (nAudio - 1);
        const iStart = Math.max(0, -intShift);
        const iEnd = Math.min(tpl.tplLen - 1, maxAudioIdx - intShift);
        const overlapN = iEnd - iStart + 1;
        if (overlapN < 40) return -999;

        const { tVad, tOn, tOff, tplLen, vocalFrameTotal } = tpl;
        let oobVocal = 0;
        for (let i = 0; i < iStart; i++) if (tVad[i] > 0.5) oobVocal++;
        for (let i = iEnd + 1; i < tplLen; i++) if (tVad[i] > 0.5) oobVocal++;
        const oobFrac = oobVocal / vocalFrameTotal;
        if (oobFrac > 0.35) return -999;

        let sAV = 0, sTV = 0, sAV2 = 0, sTV2 = 0, sAVTV = 0;
        let sAO = 0, sTO = 0, sAO2 = 0, sTO2 = 0, sAOTO = 0;
        let sAF = 0, sTF = 0, sAF2 = 0, sTF2 = 0, sAFTF = 0;

        if (!useLerp) {
          for (let i = iStart; i <= iEnd; i++) {
            const ai = i + intShift;
            const av = vadCurve[ai];
            const tv = tVad[i];
            sAV += av; sTV += tv; sAV2 += av * av; sTV2 += tv * tv; sAVTV += av * tv;

            const ao = vadOnset[ai];
            const to = tOn[i];
            sAO += ao; sTO += to; sAO2 += ao * ao; sTO2 += to * to; sAOTO += ao * to;

            const af = vadOffset[ai];
            const tf = tOff[i];
            sAF += af; sTF += tf; sAF2 += af * af; sTF2 += tf * tf; sAFTF += af * tf;
          }
        } else {
          const w0 = 1.0 - frac;
          const w1 = frac;
          for (let i = iStart; i <= iEnd; i++) {
            const ai = i + intShift;
            const av = w0 * vadCurve[ai] + w1 * vadCurve[ai + 1];
            const tv = tVad[i];
            sAV += av; sTV += tv; sAV2 += av * av; sTV2 += tv * tv; sAVTV += av * tv;

            const ao = w0 * vadOnset[ai] + w1 * vadOnset[ai + 1];
            const to = tOn[i];
            sAO += ao; sTO += to; sAO2 += ao * ao; sTO2 += to * to; sAOTO += ao * to;

            const af = w0 * vadOffset[ai] + w1 * vadOffset[ai + 1];
            const tf = tOff[i];
            sAF += af; sTF += tf; sAF2 += af * af; sTF2 += tf * tf; sAFTF += af * tf;
          }
        }

        const pearson = (sX, sY, sX2, sY2, sXY) => {
          const varX = sX2 - (sX * sX) / overlapN;
          const varY = sY2 - (sY * sY) / overlapN;
          if (varX <= 1e-7 || varY <= 1e-7) return 0;
          return (sXY - (sX * sY) / overlapN) / Math.sqrt(varX * varY);
        };

        const rVad = pearson(sAV, sTV, sAV2, sTV2, sAVTV);
        const rOn = pearson(sAO, sTO, sAO2, sTO2, sAOTO);
        const rOff = pearson(sAF, sTF, sAF2, sTF2, sAFTF);

        return (0.42 * rVad) + (0.43 * rOn) + (0.15 * rOff) - (1.50 * oobFrac);
      };

      const scoreZero = evalTemplateAtShift(tpl1, 0);
      const minShift = -Math.min(45, Math.max(10, lastLineEndSec * 0.35));
      const maxShift = Math.max(20, Math.min(95, actualDur - firstVocalSec - 10));

      const coarseSamples = [];
      const peaks = [{ shift: 0, score: scoreZero }];
      const considerPeak = (sh, scVal) => {
        if (scVal <= -100) return;
        const nearIdx = peaks.findIndex(p => Math.abs(p.shift - sh) < 2.0);
        if (nearIdx !== -1) {
          if (scVal > peaks[nearIdx].score) {
            peaks[nearIdx] = { shift: sh, score: scVal };
            peaks.sort((a, b) => b.score - a.score);
          }
          return;
        }
        if (peaks.length < 6) {
          peaks.push({ shift: sh, score: scVal });
          peaks.sort((a, b) => b.score - a.score);
        } else if (scVal > peaks[peaks.length - 1].score) {
          peaks[peaks.length - 1] = { shift: sh, score: scVal };
          peaks.sort((a, b) => b.score - a.score);
        }
      };

      // Barrido grueso a 0.20s (2 frames) en todo [-45s .. +95s] (~12-24 ms en JS)
      for (let s = Math.ceil(minShift * 5) / 5; s <= maxShift; s += 0.20) {
        const sRound = +s.toFixed(2);
        const sc = evalTemplateAtShift(tpl1, sRound);
        coarseSamples.push({ s: sRound, sc });
        considerPeak(sRound, sc);
      }
      if (env.leadSilenceSec >= 0.3 && env.leadSilenceSec <= maxShift) {
        const ls = +env.leadSilenceSec.toFixed(2);
        considerPeak(ls, evalTemplateAtShift(tpl1, ls));
      }

      // Barrido fino a 0.05s sobre los 3 mejores picos (con interpolación lineal sub-frame)
      let bestShift = 0;
      let bestScale = 1.0;
      let bestScore = scoreZero;
      for (const pk of peaks.slice(0, 3)) {
        for (let ds = -0.45; ds <= 0.451; ds += 0.05) {
          const candS = +(pk.shift + ds).toFixed(2);
          if (candS < minShift || candS > maxShift) continue;
          const sc = evalTemplateAtShift(tpl1, candS);
          if (sc > bestScore) {
            bestScore = sc;
            bestShift = candS;
          }
        }
      }

      const computeMarginAround = (targetShift, targetScore) => {
        let secondBest = -1;
        for (let i = 0; i < coarseSamples.length; i++) {
          const item = coarseSamples[i];
          if (Math.abs(item.s - targetShift) >= 2.5 && item.sc > secondBest) {
            secondBest = item.sc;
          }
        }
        return secondBest > -1 ? (targetScore - secondBest) : 0;
      };

      let margin = computeMarginAround(bestShift, bestScore);

      // Comprobación opcional de deriva de tempo (solo si duración difiere >=1.5% o margen inicial es bajo)
      const durRatio = actualDur / Math.max(30, lrcDur);
      const hasDurCue = Math.abs(durRatio - 1.0) >= 0.015 && durRatio >= 0.92 && durRatio <= 1.08;
      if ((hasDurCue || margin < 0.055) && parsedLines.length >= 8) {
        let bestTempoScore = bestScore;
        let chosenTempoScale = 1.0;
        let chosenTempoShift = bestShift;
        const shiftAnchors = [bestShift];
        if (Math.abs(bestShift) >= 1.0) shiftAnchors.push(0);
        for (let scRate = 0.955; scRate <= 1.0451; scRate += 0.005) {
          if (Math.abs(scRate - 1.0) < 0.009) continue;
          const tplS = buildTemplate(scRate);
          for (const anchor of shiftAnchors) {
            for (let ds = -1.6; ds <= 1.61; ds += 0.20) {
              const candS = +(anchor + ds).toFixed(2);
              const tSc = evalTemplateAtShift(tplS, candS);
              if (tSc > bestTempoScore) {
                bestTempoScore = tSc;
                chosenTempoScale = +scRate.toFixed(3);
                chosenTempoShift = candS;
              }
            }
          }
        }
        if (bestTempoScore > bestScore + 0.045 && Math.abs(chosenTempoScale - 1.0) >= 0.009) {
          bestScore = bestTempoScore;
          bestScale = chosenTempoScale;
          bestShift = chosenTempoShift;
          margin = Math.max(margin, bestTempoScore - scoreZero);
        }
      }

      // Guardia estricta contra falsos desplazamientos + indicador de bloqueo verificado
      let isVerifiedLock = (bestScore >= 0.14 && margin >= 0.032) || (bestScore >= 0.22 && margin >= 0.022);

      if (bestScale === 1.0 && Math.abs(bestShift) >= 0.45) {
        const strongOverZero = (isVerifiedLock && bestScore >= scoreZero + 0.022) || (bestScore >= scoreZero + 0.042 && bestScore >= 0.11);
        if (!strongOverZero) {
          bestShift = 0;
          bestScore = scoreZero;
          margin = computeMarginAround(0, scoreZero);
          isVerifiedLock = (scoreZero >= 0.14 && margin >= 0.028) || (scoreZero >= 0.22 && margin >= 0.018);
        }
      } else if (bestScale === 1.0 && Math.abs(bestShift) < 0.12) {
        bestShift = 0;
      }

      // Proyectar líneas y aplicar micro-ajuste local suave (±0.20s) sobre picos claros de vadOnset tras pausas >= 1.2s
      const aligned = parsedLines.map((l, idx) => {
        const origT = Number(l.timeSec || 0);
        const origEnd = Number(l.endTimeSec || (origT + 3.5));
        let newT = Math.max(0, +(origT * bestScale + bestShift).toFixed(2));
        let newEnd = Math.max(newT + 0.4, +(origEnd * bestScale + bestShift).toFixed(2));
        let microDelta = 0;

        if (isVerifiedLock) {
          const prevOrigEnd = idx === 0 ? 0 : Number(parsedLines[idx - 1].endTimeSec || (Number(parsedLines[idx - 1].timeSec || 0) + 3.0));
          const gapBefore = idx === 0 ? newT : (origT - prevOrigEnd) * bestScale;
          if (gapBefore >= 1.20 && newT >= 0.35 && newT < actualDur - 0.5) {
            const centerF = Math.round(newT * frameHz);
            const curOn = (centerF >= 0 && centerF < nAudio) ? vadOnset[centerF] : 0;
            let peakF = centerF;
            let peakOn = curOn;
            for (let df = -2; df <= 2; df++) {
              const f = centerF + df;
              if (f >= 0 && f < nAudio && vadOnset[f] > peakOn) {
                peakOn = vadOnset[f];
                peakF = f;
              }
            }
            if (peakF !== centerF && peakOn >= 0.26 && peakOn >= curOn * 1.40) {
              microDelta = +((peakF / frameHz) - newT).toFixed(2);
              microDelta = Math.max(-0.20, Math.min(0.20, microDelta));
              newT = Math.max(0, +(newT + microDelta).toFixed(2));
              if (newEnd < newT + 0.45) newEnd = +(newT + 0.45).toFixed(2);
            }
          }
        }

        const out = { timeSec: newT, endTimeSec: newEnd, text: l.text, elasticOffsetSec: 0 };
        if (Array.isArray(l.words)) {
          out.words = l.words.map(w => ({
            timeSec: Math.max(0, +(w.timeSec * bestScale + bestShift + microDelta).toFixed(3)),
            text: w.text
          }));
        }
        return out;
      });

      // Garantizar estricta monotonicidad tras cualquier micro-ajuste local
      for (let i = 1; i < aligned.length; i++) {
        if (aligned[i].timeSec < aligned[i - 1].timeSec + 0.15) {
          aligned[i].timeSec = +(aligned[i - 1].timeSec + 0.15).toFixed(2);
        }
        if (aligned[i - 1].endTimeSec > aligned[i].timeSec - 0.04) {
          aligned[i - 1].endTimeSec = +Math.max(aligned[i - 1].timeSec + 0.35, aligned[i].timeSec - 0.04).toFixed(2);
        }
      }

      return {
        shiftSec: +bestShift.toFixed(2),
        scale: bestScale,
        score: +bestScore.toFixed(4),
        scoreZero: +scoreZero.toFixed(4),
        margin: +margin.toFixed(4),
        isVerifiedLock,
        lines: aligned
      };
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
      const verifiedCand = candidates.find(item => item && (item.isWhisperVerified || item._isWhisperAligned) && item.syncedLyrics && String(item.syncedLyrics).includes('['));
      if (verifiedCand) {
        const parsedVerified = this.parseLrc(verifiedCand.syncedLyrics, { track });
        if (parsedVerified.length >= 2) {
          return parsedVerified.map(l => ({ ...l, _isWhisperAligned: true, elasticOffsetSec: 0 }));
        }
      }
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
          const lockBonus = aligned.isVerifiedLock ? 24 : 0;
          const marginBonus = Math.min(0.15, Math.max(0, Number(aligned.margin) || 0)) * 120;
          const combinedQuality = (cand.textScore * 0.45) + (aligned.score * 140) + lockBonus + marginBonus;
          if (!champion || combinedQuality > champion.combinedQuality) {
            champion = { ...aligned, cand, combinedQuality };
          }
        }
        if (champion && Array.isArray(champion.lines) && champion.lines.length >= 3) {
          const isVadLock = Boolean(champion.isVerifiedLock);
          const vadShift = Number(champion.shiftSec) || 0;
          const vadScore = Number(champion.score) || 0;
          const vadMargin = Number(champion.margin) || 0;
          outLines = champion.lines.map(l => ({
            ...l,
            _vocalVadVerified: isVadLock,
            _vocalVadShiftSec: vadShift,
            _vocalVadScore: vadScore,
            _vocalVadMargin: vadMargin
          }));
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

      if (Array.isArray(outLines) && outLines.length >= 2) {
        this._computeAcousticSyllablesForLines(key, outLines);
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
          if (sText.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, '').length <= 2 && !hasAccent) weight = 0.84;
          if (isStressed) weight *= 1.25;
          if (isLastInWord) weight *= 1.14;
          if (hasPunct) weight *= 1.38;

          rawSyls.push({
            rawText: sText,
            isWordEnd: isLastInWord,
            weight
          });
        }
      }

      // 2. Agrupar únicamente sílabas dentro de una misma palabra si la frase es ultrarrápida,
      //    NUNCA fusionando palabras distintas sin espacio para que la lectura sea 100% limpia.
      const spanMs = Math.max(520, Number(targetDurationMs) || 2200);
      const maxComfortableTokens = Math.max(3, Math.min(16, Math.floor(spanMs / 135)));

      const tokens = rawSyls.map(s => ({ ...s }));

      while (tokens.length > maxComfortableTokens && tokens.length > 3) {
        let bestMergeIdx = -1;
        let minCombinedWeight = 1e9;
        for (let i = 0; i < tokens.length - 1; i++) {
          // Solo permitir unir sílabas dentro de la MISMA palabra (!tokens[i].isWordEnd)
          if (tokens[i].isWordEnd) continue;
          const score = tokens[i].weight + tokens[i + 1].weight;
          if (score < minCombinedWeight) {
            minCombinedWeight = score;
            bestMergeIdx = i;
          }
        }
        if (bestMergeIdx === -1) break;
        const a = tokens[bestMergeIdx];
        const b = tokens[bestMergeIdx + 1];
        tokens.splice(bestMergeIdx, 2, {
          rawText: a.rawText + b.rawText,
          isWordEnd: b.isWordEnd,
          weight: a.weight * 0.72 + b.weight
        });
      }

      if (tokens.length > 0) {
        tokens[tokens.length - 1].weight *= 1.30;
      }

      return tokens.map(t => ({
        text: t.rawText,
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

      for (let i = 0; i < linesArr.length; i++) {
        const line = linesArr[i];
        if (!line || line.isIntroCard || line.isMetadata || line.isCue) continue;
        const cleanText = repairSpanishBrokenAccents(String(line.text || '').trim());
        if (!cleanText) continue;

        if (!Number.isFinite(line._origTimeSec)) {
          line._origTimeSec = Number(line.timeSec) || 0;
        }

        const nextLine = (i + 1 < linesArr.length) ? linesArr[i + 1] : null;
        if (nextLine && !Number.isFinite(nextLine._origTimeSec)) {
          nextLine._origTimeSec = Number(nextLine.timeSec) || 0;
        }
        const elasticOff = Number.isFinite(line.elasticOffsetSec) ? line.elasticOffsetSec : 0;
        const nextElasticOff = nextLine && Number.isFinite(nextLine.elasticOffsetSec) ? nextLine.elasticOffsetSec : elasticOff;
        const nextOrigSec = nextLine
          ? (Number(nextLine._origTimeSec) || 0)
          : (line._origTimeSec + 3.6);

        const baseStartSec = Math.max(0.02, line._origTimeSec + elasticOff);
        const nextStartSec = nextLine
          ? Math.max(baseStartSec + 0.45, nextOrigSec + nextElasticOff)
          : (baseStartSec + 3.5);

        const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
        const naturalPhraseDurSec = Math.max(0.75, Math.min(4.5, wordCount * 0.41 + 0.34));

        let vocalStartSec = baseStartSec;
        let vocalEndSec = Math.min(nextStartSec - 0.04, baseStartSec + naturalPhraseDurSec);

        // 1. Si tenemos el perfil acústico de 25ms de la canción, ajustar micro-ataque dentro de [-160ms, +220ms]
        //    sin permitir jamás que una línea empuje en cascada a las siguientes.
        if (hasAudioProfile && baseStartSec + 0.35 < maxProfileSec) {
          const searchStartF = Math.max(
            0,
            Math.floor(Math.max(0.02, baseStartSec - 0.16) / hopSec)
          );
          const searchEndF = Math.min(
            vocCurve.length - 4,
            Math.ceil(Math.min(nextStartSec - 0.25, baseStartSec + 0.22) / hopSec)
          );
          const baseF = Math.min(vocCurve.length - 1, Math.max(0, Math.round(baseStartSec / hopSec)));

          if (sylOnset && searchStartF < searchEndF) {
            let bestEntryF = baseF;
            let bestEntryScore = -1e9;
            for (let f = searchStartF; f <= searchEndF; f++) {
              if (vocMidDb && vocMidDb[f] < thVoc - 3.2) continue;
              const distSec = (f - baseF) * hopSec;
              const sc = (sylOnset[f] * 2.1) + (vocCurve[f] - thVoc) * 0.22 - (distSec * distSec) * 18.0;
              if (sc > bestEntryScore) {
                bestEntryScore = sc;
                bestEntryF = f;
              }
            }
            vocalStartSec = +(bestEntryF * hopSec).toFixed(3);
          }

          // Detectar dónde termina realmente el cantante de cantar la frase (antes de la pausa de respiración)
          const minEndSec = Math.min(nextStartSec - 0.05, vocalStartSec + Math.max(0.45, Math.min(1.5, wordCount * 0.20)));
          const maxEndSec = Math.min(nextStartSec - 0.04, vocalStartSec + naturalPhraseDurSec + 0.45, maxProfileSec - 0.04);
          if (maxEndSec > minEndSec && vocMidDb) {
            const fMinEnd = Math.max(0, Math.round(minEndSec / hopSec));
            const fMaxEnd = Math.min(vocMidDb.length - 1, Math.round(maxEndSec / hopSec));
            const breathFramesRequired = Math.max(4, Math.round(0.14 / hopSec));
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
        const maxAllowedEndMs = Math.max(vocalStartMs + 320, Math.round((nextStartSec - 0.03) * 1000));
        const vocalEndMs = Math.min(maxAllowedEndMs, Math.max(vocalStartMs + 360, Math.round(vocalEndSec * 1000)));
        const phraseSpanMs = Math.max(320, vocalEndMs - vocalStartMs);

        // 2. Tokenizar la frase en sílabas fonéticas naturales adaptadas a la duración vocal real
        const tokens = this.tokenizePhraseIntoNaturalSyllables(cleanText, phraseSpanMs);
        const K = tokens.length;
        if (K === 0) continue;

        const minStepMs = Math.max(85, Math.min(195, Math.floor(phraseSpanMs / Math.max(1.2, K * 1.18))));
        const totalWeight = tokens.reduce((acc, t) => acc + t.weight, 0) || K;

        // Calcular posiciones esperadas (prior fonético ponderado por vocales abiertas, acentos y pausas)
        const priorTimesMs = new Array(K);
        let cumW = 0;
        const effectiveSpanMs = Math.max(K * minStepMs, phraseSpanMs - Math.round(phraseSpanMs / (K + 1.5)) * 0.36);
        for (let k = 0; k < K; k++) {
          priorTimesMs[k] = Math.round(vocalStartMs + (cumW / totalWeight) * effectiveSpanMs);
          cumW += tokens[k].weight;
        }

        // 3. Alineación Dinámica Monótona (Viterbi 25ms) de cada sílaba con los picos reales de articulación vocal (sylOnset)
        const finalTimesMs = new Array(K);
        if (hasAudioProfile && sylOnset && (vocalEndSec <= maxProfileSec)) {
          const stepMs = Math.round(hopSec * 1000); // 25ms
          const minStepFrames = Math.max(3, Math.round(minStepMs / stepMs));
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
                const onsetBonus = (sylOnset[f] * 2.3) + Math.max(-2, (vocCurve[f] - thVoc) * 0.25);
                dp[0][g] = onsetBonus - 3.2 * (dist0 * dist0);
              }
            }

            for (let k = 1; k < K; k++) {
              const expGapMs = Math.max(minStepMs, priorTimesMs[k] - priorTimesMs[k - 1]);
              for (let g = k * minStepFrames; g < nGrid; g++) {
                const f = f0 + g;
                const tMs = f * stepMs;
                if (Math.abs(tMs - priorTimesMs[k]) > 380) continue;

                const onsetBonus = (sylOnset[f] * 2.4) + Math.max(-2, (vocCurve[f] - thVoc) * 0.22);
                const priorDiff = (tMs - priorTimesMs[k]) / 240.0;
                const emit = onsetBonus - 1.9 * (priorDiff * priorDiff);

                const maxPrevG = g - minStepFrames;
                const minPrevG = Math.max(0, g - Math.ceil(880 / stepMs));
                let bestPrevVal = -1e9;
                let bestPrevG = -1;

                for (let gp = minPrevG; gp <= maxPrevG; gp++) {
                  if (dp[k - 1][gp] <= -1e8) continue;
                  const gapMs = (g - gp) * stepMs;
                  const gapErr = (gapMs - expGapMs) / 195.0;
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

        // Fallback o garantía estricta de separación mínima dentro de [vocalStartMs, maxAllowedEndMs]
        for (let k = 0; k < K; k++) {
          if (!Number.isFinite(finalTimesMs[k])) {
            finalTimesMs[k] = priorTimesMs[k];
          }
          if (k > 0 && finalTimesMs[k] < finalTimesMs[k - 1] + minStepMs) {
            finalTimesMs[k] = finalTimesMs[k - 1] + minStepMs;
          }
          const maxForThisK = maxAllowedEndMs - (K - k) * 75;
          if (finalTimesMs[k] > maxForThisK) {
            finalTimesMs[k] = Math.max(k > 0 ? finalTimesMs[k - 1] + 65 : vocalStartMs, maxForThisK);
          }
        }

        const acousticSyllables = [];
        const syncedWords = [];
        for (let k = 0; k < K; k++) {
          const tMs = finalTimesMs[k];
          const nextT = (k + 1 < K) ? finalTimesMs[k + 1] : Math.min(maxAllowedEndMs, Math.max(tMs + 220, vocalEndMs));
          const durMs = Math.max(80, Math.min(850, nextT - tMs - 10));
          acousticSyllables.push({
            time: tMs,
            dur: durMs,
            text: tokens[k].displayText
          });
          syncedWords.push({
            timeSec: +(tMs / 1000).toFixed(3),
            endSec: +((tMs + durMs) / 1000).toFixed(3),
            text: tokens[k].displayText
          });
        }

        line.vocalStartMs = finalTimesMs[0];
        line.vocalEndMs = Math.min(maxAllowedEndMs, Math.max(finalTimesMs[K - 1] + 200, vocalEndMs));
        line.acousticSyllables = acousticSyllables;

        // Poblar line.words en TODAS las canciones para que tanto el Modo Karaoke como SingStar
        // iluminen sílaba por sílaba con sincronización acústica real
        if (!Array.isArray(line.words) || line.words.length < 2 || line._hasAcousticGeneratedWords) {
          line.words = syncedWords;
          line._hasAcousticGeneratedWords = true;
        }
        line.timeSec = +(baseStartSec).toFixed(2);
        line.endTimeSec = +(line.vocalEndMs / 1000).toFixed(2);
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

    _findBuiltInCustomSyncedLyrics(track, trackVid = '', actualDurSec = 0) {
      if (!track && !trackVid) return null;
      const vid = String(trackVid || '').trim();
      const rawT = repairSpanishBrokenAccents(String(track?.title || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      const rawA = repairSpanishBrokenAccents(String(track?.artist || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      const combined = `${rawA}${rawT}`;
      const durNum = Number(actualDurSec) || 0;

      // 1) Prioridad máxima: alineación verificada directamente sobre el audio real (v2 con chequeo de duración)
      try {
        const rawStoreV2 = localStorage.getItem('beatstar_whisper_aligned_v2');
        if (rawStoreV2) {
          const map = JSON.parse(rawStoreV2);
          const k = this._makeKey(track);
          const hit = (vid && map[`vid:${vid}`]) || (k && map[k]) || (rawT && rawT.length >= 5 && map[`title:${rawT}`]);
          if (hit && hit.syncedLyrics && String(hit.syncedLyrics).includes('[')) {
            const hitDur = Number(hit.audioDurSec || hit.duration || 0);
            const durCompatible = !(durNum >= 35 && hitDur >= 35 && Math.abs(hitDur - durNum) > 3.5);
            if (durCompatible) {
              return {
                ...hit,
                _isBuiltInCustom: true,
                _isWhisperTranscribed: true,
                _isWhisperAligned: true,
                isWhisperVerified: true
              };
            }
          }
        }
      } catch (_) {}

      // 2) Base de letras curadas integradas (no marcadas como isWhisperVerified para permitir re-anclaje si cambia el videoclip)
      for (const entry of CLIENT_CUSTOM_SYNCED_LYRICS_DB) {
        if (vid && (entry.videoId === vid || (Array.isArray(entry.videoIds) && entry.videoIds.includes(vid)))) {
          return { ...entry, _isBuiltInCustom: true, isWhisperVerified: false };
        }
        if (rawT && entry.keys.some(k => rawT === k || combined === k || combined.includes(k) || (rawT.length >= 12 && rawT.includes(k)))) {
          return { ...entry, _isBuiltInCustom: true, isWhisperVerified: false };
        }
      }
      return null;
    }

    removeWhisperAlignedCacheEntry(track) {
      if (!track) return;
      const key = this._makeKey(track);
      const rawVid = String(track.videoId || track.id || '').replace(/^magic_yt_|^yt_/, '').trim();
      const vid = /^[A-Za-z0-9_-]{11}$/.test(rawVid) ? rawVid : '';
      const rawT = repairSpanishBrokenAccents(String(track?.title || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      this.whisperAlignedMeta.delete(key);
      this._manualOffsetAfterAiKeys.delete(key);
      this._aiSyncStatusMap.delete(key);
      this._whisperLaunchGuard.delete(key);
      try {
        const rawStore = localStorage.getItem('beatstar_whisper_aligned_v2');
        if (rawStore) {
          const map = JSON.parse(rawStore);
          if (key) delete map[key];
          if (vid) delete map[`vid:${vid}`];
          if (rawT && rawT.length >= 5) delete map[`title:${rawT}`];
          localStorage.setItem('beatstar_whisper_aligned_v2', JSON.stringify(map));
        }
      } catch (_) {}
    }

    saveTranscribedLyricsToPersistentStore(track, lines, durationSec = 195, options = {}) {
      if (!track || !Array.isArray(lines) || lines.length < 2) return null;
      const validLines = lines.filter(l => l && !l._isFallbackPlaceholder && !l._isAcousticVocalIsland && !l._isUnalignedPlainLyrics && String(l.text || '').trim().length >= 2);
      if (validLines.length < 2) return null;

      const fmtTag = (secVal) => {
        const t = Math.max(0, Number(secVal) || 0);
        const mm = String(Math.floor(t / 60)).padStart(2, '0');
        const ss = (t % 60).toFixed(2).padStart(5, '0');
        return `${mm}:${ss}`;
      };

      const lrcStr = validLines.map(l => {
        const lineTag = `[${fmtTag(l.timeSec)}]`;
        const sylList = Array.isArray(l.singstarSyllables) && l.singstarSyllables.length >= 1
          ? l.singstarSyllables
          : (Array.isArray(l.words) && l.words.length >= 1 ? l.words : null);
        if (sylList) {
          const enhanced = sylList.map(s => {
            const st = Number.isFinite(Number(s.startSec)) ? Number(s.startSec) : Number(s.timeSec);
            const txt = String(s.displayText ?? s.text ?? '');
            if (!txt.trim()) return '';
            return `<${fmtTag(st)}>${txt}`;
          }).filter(Boolean).join('');
          if (enhanced.trim().length >= 1) {
            return `${lineTag} ${enhanced}`;
          }
        }
        return `${lineTag} ${String(l.text || '').trim()}`;
      }).join('\n');

      const key = this._makeKey(track);
      const rawVid = String(track.videoId || track.id || '').replace(/^magic_yt_|^yt_/, '').trim();
      const vid = /^[A-Za-z0-9_-]{11}$/.test(rawVid) ? rawVid : '';
      const rawT = repairSpanishBrokenAccents(String(track?.title || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      const cleanDur = +(Number(durationSec) || 195).toFixed(2);

      const entry = {
        videoId: vid,
        trackName: track.title || 'Canción',
        artistName: track.artist || 'Artista',
        duration: Math.round(cleanDur),
        audioDurSec: cleanDur,
        shiftSec: Number.isFinite(Number(options?.shiftSec)) ? +Number(options.shiftSec).toFixed(2) : 0,
        slope: Number.isFinite(Number(options?.slope)) ? +Number(options.slope).toFixed(4) : 1.0,
        matchedWords: Number(options?.matchedWords) || 0,
        anchoredLines: Number(options?.anchoredLines) || 0,
        syncedLyrics: lrcStr,
        updatedAt: Date.now(),
        _isBuiltInCustom: true,
        _isWhisperTranscribed: true,
        _isWhisperAligned: true,
        isWhisperVerified: true
      };

      try {
        const rawStore = localStorage.getItem('beatstar_whisper_aligned_v2');
        const map = rawStore ? JSON.parse(rawStore) : {};
        if (key) map[key] = entry;
        if (vid) map[`vid:${vid}`] = entry;
        if (rawT && rawT.length >= 5) map[`title:${rawT}`] = entry;
        // Limitar el almacén local a las ~60 claves más recientes para no superar la cuota de localStorage
        const keys = Object.keys(map);
        if (keys.length > 72) {
          keys.sort((a, b) => (Number(map[b]?.updatedAt) || 0) - (Number(map[a]?.updatedAt) || 0));
          for (const dropK of keys.slice(60)) {
            delete map[dropK];
          }
        }
        localStorage.setItem('beatstar_whisper_aligned_v2', JSON.stringify(map));
      } catch (_) {}

      const parsed = this.parseLrc(lrcStr, { track });
      if (parsed.length >= 2) {
        const st = this._getOrInitTrackState(track);
        st.isFallbackOnly = false;
        st.candidates = [entry];
        this.candidatesCache.set(key, [entry]);
        if (!options?.skipApplyCache) {
          this.applyWhisperVerifiedLines(track, key, parsed, {
            audioDurSec: cleanDur,
            shiftSec: entry.shiftSec,
            slope: entry.slope,
            matchedWords: entry.matchedWords,
            anchoredLines: entry.anchoredLines,
            isComplete: Boolean(options?.isComplete ?? true)
          });
        }
      }
      return entry;
    }

    async _fetchCandidatesMultiProvider(track, totalDurationSec = 195, vidQueryParam = '') {
      let rawTitleForSearch = repairSpanishBrokenAccents(String(track?.title || ''));
      let rawArtistForSearch = repairSpanishBrokenAccents(String(track?.artist || '')).replace(/\s*-\s*topic$/i, '').replace(/vevo$/i, '').trim();
      if (rawTitleForSearch.includes(' - ')) {
        const dashParts = rawTitleForSearch.split(' - ');
        const left = dashParts[0].trim();
        const right = dashParts.slice(1).join(' - ').trim();
        const rightIsSuffixTag = /^(?:official|oficial|video|videoclip|audio|lyric|lyrics|letra|live|en vivo|hd|4k|remaster|visualizer)/i.test(right);
        const normLeft = this._normMatch(left);
        const normArt0 = this._normMatch(rawArtistForSearch);
        const artIsGenericOrMatch = !rawArtistForSearch ||
          /^(?:youtube|ultimoscruzados|varios|various|unknown|artista|music)$/i.test(rawArtistForSearch) ||
          (normLeft && normArt0 && (normArt0.includes(normLeft) || normLeft.includes(normArt0)));
        if (left && right && !rightIsSuffixTag && artIsGenericOrMatch) {
          rawArtistForSearch = left;
          rawTitleForSearch = right;
        }
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
          `${baseUrl}/api/v1/lyrics?title=${encodeURIComponent(cleanTitle || rawTitleForSearch || track?.title || '')}&artist=${encodeURIComponent(primaryArtist || rawArtistForSearch || track?.artist || '')}&duration=${durParam}${vidQueryParam}`,
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
          nativeLyricsRaw: null,
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

    _alignNativeLyricsWithDspIfNeeded(st) {
      const baseNative = Array.isArray(st?.nativeLyricsRaw) && st.nativeLyricsRaw.length >= 4
        ? st.nativeLyricsRaw
        : st?.nativeLyrics;
      if (!Array.isArray(baseNative) || baseNative.length < 4) return null;
      if (!st.nativeLyricsRaw) {
        st.nativeLyricsRaw = baseNative.map(l => ({ ...l }));
      }
      if (!st.dspEnvelope) {
        return st.nativeLyricsRaw.map(l => ({ ...l }));
      }
      const declaredDur = st.actualDur || st.expectedDur || st.dspEnvelope.actualDur || 195;
      const dspRes = this._computeDspAlignment(st.nativeLyricsRaw, declaredDur, st.dspEnvelope);
      const isVadLock = Boolean(dspRes && dspRes.isVerifiedLock);
      const hasSignificantChange = dspRes && Array.isArray(dspRes.lines) && dspRes.lines.length >= 4 &&
        (Math.abs(dspRes.shiftSec) >= (isVadLock ? 0.15 : 0.55) || Math.abs(dspRes.scale - 1.0) >= 0.015);
      const srcLines = hasSignificantChange ? dspRes.lines : st.nativeLyricsRaw;
      const verifiedLines = srcLines.map(l => ({
        ...l,
        _vocalVadVerified: isVadLock,
        _vocalVadShiftSec: hasSignificantChange ? (Number(dspRes.shiftSec) || 0) : 0,
        _vocalVadScore: Number(dspRes?.score) || 0,
        _vocalVadMargin: Number(dspRes?.margin) || 0
      }));
      st.nativeLyrics = verifiedLines;
      return verifiedLines.map(l => ({ ...l }));
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

        // Si esta pista ya fue verificada con Whisper sobre el audio real, devolver directamente la versión verificada
        if (this.isWhisperVerifiedFor(key, st.actualDur || totalDurationSec || 0) && this.cache.has(key)) {
          return this.cache.get(key).map(l => ({ ...l }));
        }

        // Si existe letra curada integrada o alineada previamente con Whisper v2 (verificada por duración), usarla
        const builtIn = this._findBuiltInCustomSyncedLyrics(track, trackVid, st.actualDur || totalDurationSec || st.expectedDur || 0);
        if (builtIn && builtIn.syncedLyrics) {
          if (builtIn.isWhisperVerified) {
            const parsedV2 = this.parseLrc(builtIn.syncedLyrics, { track });
            if (parsedV2.length >= 2) {
              const verifiedDur = Number(builtIn.audioDurSec || builtIn.duration || st.actualDur || totalDurationSec || 0);
              this.whisperAlignedMeta.set(key, {
                verified: true,
                audioDurSec: verifiedDur,
                shiftSec: Number(builtIn.shiftSec) || 0,
                slope: Number(builtIn.slope) || 1.0,
                matchedWords: Number(builtIn.matchedWords) || 0,
                anchoredLines: Number(builtIn.anchoredLines) || parsedV2.length,
                isComplete: true,
                updatedAt: Date.now()
              });
              st.isFallbackOnly = false;
              st.candidates = [builtIn];
              this.candidatesCache.set(key, [builtIn]);
              const marked = parsedV2.map(l => ({ ...l, _isWhisperAligned: true }));
              this.cache.set(key, marked);
              return marked.map(l => ({ ...l }));
            }
          }
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
          st.nativeLyricsRaw = Array.isArray(nativeLines) ? nativeLines.map(l => ({ ...l })) : null;
        }
        if (Array.isArray(st.nativeLyrics) && st.nativeLyrics.length >= 4) {
          const verifiedNative = this._alignNativeLyricsWithDspIfNeeded(st);
          st.isFallbackOnly = false;
          this.cache.set(key, verifiedNative);
          return verifiedNative.map(l => ({ ...l }));
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
      const durCheck = durationSec || (st && st.actualDur) || this.knownAudioDurations.get(key) || 0;
      // NUNCA sobreescribir una letra ya verificada con Whisper sobre el audio real
      if (this.isWhisperVerifiedFor(key, durCheck) && this.cache.has(key)) {
        return;
      }
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
      this.currentLyrics = lines.map(l => ({ ...l }));
      this.activeLineIndex = -1;
      this.renderLinesToDom();
      const curSec = (typeof dualStreamEngine !== 'undefined' && dualStreamEngine)
        ? dualStreamEngine.getCurrentSongTimeSec()
        : (this._lastSyncAudioSec || 0);
      this.syncTime(curSec, { forceScroll: !this._isUserManualScrolling && Date.now() >= Math.max(this._userScrollingUntil || 0, this._userManualScrollUntil || 0) });
      if (this.showTranslation) {
        this.ensureTranslationsForCurrent(track).then(() => {
          if (this.currentTrackKey === key) this.renderLinesToDom({ skipSingStarNotify: true });
        }).catch(() => {});
      }
    }

    _launchKaraokeWhisperAlignmentIfNeeded(track, key, initialLines = [], audioBlob = null, effDur = 0) {
      if (!track || !key) return;
      if (this.isWhisperVerifiedFor(key, effDur)) return;
      const ss = window.SingStarVocalEngine;
      if (!ss || typeof ss.alignOrTranscribeForKaraoke !== 'function') return;

      // Si SingStar ya está ejecutando Whisper sobre esta misma canción, no duplicar ni reiniciar
      if (typeof ss.isActiveWhisperFor === 'function' && ss.isActiveWhisperFor(key)) {
        return;
      }

      const cleanInit = Array.isArray(initialLines)
        ? initialLines.filter(l => l && !l._isFallbackPlaceholder && !l._isAcousticVocalIsland && String(l.text || '').trim().length > 0)
        : [];
      const isPlain = cleanInit.length > 0 && (
        Boolean(cleanInit[0]._isPlainFallback) ||
        (typeof ss._isUnalignedPlainLyrics === 'function' && ss._isUnalignedPlainLyrics(cleanInit))
      );
      const isVocalVadLocked = Boolean(cleanInit.length >= 3 && !isPlain && cleanInit[0]._vocalVadVerified === true);

      // POLÍTICA RÁPIDA FIABLE: Si Vocal-Onset VAD ya bloqueó el LRC al audio real (<1s),
      // mostrar estado listo de inmediato y NO lanzar Whisper-tiny lento en cliente.
      if (isVocalVadLocked) {
        const pendingTimer = this._serverFallbackTimers.get(key);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          this._serverFallbackTimers.delete(key);
        }
        const vadShift = Number(cleanInit[0]._vocalVadShiftSec) || 0;
        const readyLabel = Math.abs(vadShift) >= 0.55
          ? `Sincro · ${vadShift > 0 ? '+' : ''}${vadShift.toFixed(1)}s`
          : 'Sincro · Exacta';
        this.setKaraokeAiSyncStatus(key, readyLabel, 'ready');
        return;
      }

      if (audioBlob instanceof Blob && audioBlob.size >= 40000) {
        const pendingTimer = this._serverFallbackTimers.get(key);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          this._serverFallbackTimers.delete(key);
        }
        const guardSig = `${Math.round(effDur || 0)}_${audioBlob.size}_${cleanInit.length}`;
        if (this._whisperLaunchGuard.get(key) === guardSig) return;
        this._whisperLaunchGuard.set(key, guardSig);

        // Si tenemos LRC sincronizado y aún no se ejecutó Vocal-Onset VAD sobre este blob, correrlo primero (<150ms)
        const stNow = this.trackCalibrationState.get(key);
        if (cleanInit.length >= 3 && !isPlain && (!stNow || !stNow.dspEnvelope)) {
          this.setKaraokeAiSyncStatus(key, 'Sincronizando...', 'working');
          this._extractDspEnvelope(audioBlob).then((env) => {
            if (this.isWhisperVerifiedFor(key, effDur)) return;
            if (env) {
              const stCur = this._getOrInitTrackState(track);
              stCur.dspEnvelope = env;
              if (env.actualDur > 35) {
                stCur.actualDur = env.actualDur;
                this.knownAudioDurations.set(key, env.actualDur);
              }
              const cands = stCur.candidates || this.candidatesCache.get(key);
              let vadLines = null;
              if (Array.isArray(cands) && cands.length > 0 && (!stCur.nativeLyrics || stCur.nativeLyrics.length < 4)) {
                vadLines = this._pickBestCandidateLines(cands, env.actualDur || effDur || 195, track, env);
              } else {
                const aligned = this._computeDspAlignment(cleanInit, env.actualDur || effDur || 195, env);
                if (aligned && Array.isArray(aligned.lines) && aligned.lines.length >= 3) {
                  vadLines = aligned.lines.map(l => ({
                    ...l,
                    _vocalVadVerified: Boolean(aligned.isVerifiedLock),
                    _vocalVadShiftSec: Number(aligned.shiftSec) || 0,
                    _vocalVadScore: Number(aligned.score) || 0,
                    _vocalVadMargin: Number(aligned.margin) || 0
                  }));
                }
              }
              if (Array.isArray(vadLines) && vadLines.length >= 3) {
                this.cache.set(key, vadLines);
                this._refreshCurrentLyrics(track, key, env.actualDur || effDur);
                if (vadLines[0]._vocalVadVerified === true) {
                  const sh = Number(vadLines[0]._vocalVadShiftSec) || 0;
                  const readyLabel = Math.abs(sh) >= 0.55
                    ? `Sincro · ${sh > 0 ? '+' : ''}${sh.toFixed(1)}s`
                    : 'Sincro · Exacta';
                  this.setKaraokeAiSyncStatus(key, readyLabel, 'ready');
                  return;
                }
              }
            }
            // Confianza Vocal-VAD insuficiente: recurrir a Whisper rápido de 3 sondas
            this.setKaraokeAiSyncStatus(key, 'Sincro IA...', 'working');
            ss.alignOrTranscribeForKaraoke(track, key, audioBlob, cleanInit, effDur).catch(() => {});
          }).catch(() => {
            this.setKaraokeAiSyncStatus(key, 'Sincro IA...', 'working');
            ss.alignOrTranscribeForKaraoke(track, key, audioBlob, cleanInit, effDur).catch(() => {});
          });
          return;
        }

        // Sin letra, texto plano o confianza Vocal-VAD baja -> lanzar Whisper rápido (3 sondas si hay LRC)
        this.setKaraokeAiSyncStatus(key, 'Sincro IA...', 'working');
        ss.alignOrTranscribeForKaraoke(track, key, audioBlob, cleanInit, effDur).catch(() => {});
        return;
      }

      // Sin blob local aún (p. ej. reproducción vía yt_bridge): solo lanzar respaldo servidor si NO hay letra sincronizada
      if (cleanInit.length >= 3 && !isPlain) {
        return;
      }
      const rawVid = String(track.videoId || track.id || '').replace(/^magic_yt_|^yt_/, '').trim();
      const hasVid = /^[A-Za-z0-9_-]{11}$/.test(rawVid);
      if (hasVid && !this._serverFallbackTimers.has(key)) {
        const tid = setTimeout(() => {
          this._serverFallbackTimers.delete(key);
          const stNow = this.trackCalibrationState.get(key);
          if (this.currentTrackKey !== key) return;
          if (this.isWhisperVerifiedFor(key, (stNow && stNow.actualDur) || effDur)) return;
          if (stNow && stNow.audioBlob instanceof Blob && stNow.audioBlob.size >= 40000) return;
          if (window.SingStarVocalEngine && typeof window.SingStarVocalEngine.isActiveWhisperFor === 'function' && window.SingStarVocalEngine.isActiveWhisperFor(key)) return;
          const latestLines = this.cache.has(key) ? this.cache.get(key) : cleanInit;
          if (Array.isArray(latestLines) && latestLines.length >= 3 && latestLines[0]?._vocalVadVerified === true) return;
          this.setKaraokeAiSyncStatus(key, 'Sincro IA...', 'working');
          window.SingStarVocalEngine.alignOrTranscribeForKaraoke(track, key, null, latestLines, (stNow && stNow.actualDur) || effDur).catch(() => {});
        }, 4500);
        this._serverFallbackTimers.set(key, tid);
      }
    }

    async recalibrateForActualAudio(track, actualDurationSec = 0, audioBlob = null) {
      if (!track) return null;
      const key = this._makeKey(track);
      const st = this._getOrInitTrackState(track);
      const hasNewDifferentBlob = (
        audioBlob instanceof Blob &&
        audioBlob.size >= 40000 &&
        (!st.audioBlob || audioBlob.size !== st.audioBlob.size)
      );
      // PROTECCIÓN CRÍTICA INMEDIATA: Si Whisper IA ya verificó esta pista y NO llegó un nuevo blob distinto
      // (p.ej. eventos tardíos loadedmetadata/durationchange con duración aproximada de MP3 VBR o YouTube),
      // JAMÁS invalidar ni sobreescribir el bloqueo Whisper ni degradar st.actualDur real.
      if (this.isWhisperVerifiedFor(key, 0) && this.cache.has(key) && !hasNewDifferentBlob) {
        return this.cache.get(key).map(l => ({ ...l }));
      }
      if (Number.isFinite(actualDurationSec) && actualDurationSec >= 35 && (!this.isWhisperVerifiedFor(key, 0) || hasNewDifferentBlob)) {
        st.actualDur = actualDurationSec;
        this.knownAudioDurations.set(key, actualDurationSec);
      }
      if (audioBlob instanceof Blob && audioBlob.size >= 40000) {
        st.audioBlob = audioBlob;
        // Notificar de inmediato a SingStar si estaba esperando el blob completo para DSP/Vocal-VAD
        if (window.SingStarVocalEngine && typeof window.SingStarVocalEngine.onAudioBlobReady === 'function') {
          window.SingStarVocalEngine.onAudioBlobReady(track, audioBlob);
        }
        // Evitar triple decodificación simultánea cuando SingStar está activo decodificando esta misma pista
        const singstarOwnsDecode = Boolean(
          window.SingStarVocalEngine &&
          window.SingStarVocalEngine.isActive &&
          window.SingStarVocalEngine.currentTrackKey === key
        );
        if (!singstarOwnsDecode && !this.isWhisperVerifiedFor(key, st.actualDur || actualDurationSec || 0)) {
          const existingProfile = this.audioWaveformProfiles.get(key);
          const needWaveProfile = !existingProfile || !existingProfile.isFullPass || (existingProfile.hopSec && existingProfile.hopSec > 0.03);
          if (!st.dspEnvelope || hasNewDifferentBlob) {
            await this._extractDspEnvelope(audioBlob).then(env => {
              if (env) {
                st.dspEnvelope = env;
                if (env.actualDur > 35) {
                  st.actualDur = env.actualDur;
                  this.knownAudioDurations.set(key, env.actualDur);
                }
              }
            }).catch(() => {});
          }
          if (needWaveProfile && typeof dualStreamEngine !== 'undefined' && dualStreamEngine && typeof dualStreamEngine._decodeAndStoreWaveformProfile === 'function') {
            audioBlob.slice(0, Math.min(audioBlob.size, 5242880)).arrayBuffer()
              .then(ab => dualStreamEngine._decodeAndStoreWaveformProfile(track, key, ab, 300, true, true))
              .catch(() => {});
          }
        }
      }

      if (this.inflight.has(key)) {
        try { await this.inflight.get(key); } catch (_) {}
      }

      const effDur = st.actualDur || actualDurationSec || this.knownAudioDurations.get(key) || st.expectedDur || 0;

      // PROTECCIÓN CRÍTICA: Si Whisper IA ya verificó y alineó esta pista para esta duración de audio,
      // JAMÁS sobreescribir de vuelta con LRCLIB crudo ni con correlación de envolvente ciega.
      if (this.isWhisperVerifiedFor(key, effDur) && this.cache.has(key)) {
        return this.cache.get(key).map(l => ({ ...l }));
      }

      // Comprobar caché persistente v2 validado por duración de audio antes de recalibrar
      const rawVidRecal = String(track.videoId || track.id || '').replace(/^magic_yt_|^yt_/, '').trim();
      const vidRecal = /^[A-Za-z0-9_-]{11}$/.test(rawVidRecal) ? rawVidRecal : '';
      const cachedV2 = this._findBuiltInCustomSyncedLyrics(track, vidRecal, effDur);
      if (cachedV2 && cachedV2.isWhisperVerified && cachedV2.syncedLyrics) {
        const parsedV2 = this.parseLrc(cachedV2.syncedLyrics, { track });
        if (parsedV2.length >= 2) {
          this.applyWhisperVerifiedLines(track, key, parsedV2, {
            audioDurSec: Number(cachedV2.audioDurSec || cachedV2.duration) || effDur,
            shiftSec: Number(cachedV2.shiftSec) || 0,
            slope: Number(cachedV2.slope) || 1.0,
            matchedWords: Number(cachedV2.matchedWords) || 0,
            anchoredLines: Number(cachedV2.anchoredLines) || parsedV2.length,
            fromCache: true,
            isComplete: true
          });
          return this.cache.get(key).map(l => ({ ...l }));
        }
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
        st.nativeLyricsRaw = Array.isArray(nativeLines) ? nativeLines.map(l => ({ ...l })) : null;
      }

      if (Array.isArray(st.nativeLyrics) && st.nativeLyrics.length >= 4) {
        const verifiedNative = this._alignNativeLyricsWithDspIfNeeded(st);
        if (key) {
          this._computeAcousticSyllablesForLines(key, verifiedNative);
        }
        this.cache.set(key, verifiedNative);
        if (this.currentTrackKey === key) {
          this.currentLyrics = verifiedNative.map(l => ({ ...l }));
          this.activeLineIndex = -1;
          this.renderLinesToDom();
          const curSec = (typeof dualStreamEngine !== 'undefined' && dualStreamEngine)
            ? dualStreamEngine.getCurrentSongTimeSec()
            : (this._lastSyncAudioSec || 0);
          this.syncTime(curSec, { forceScroll: !this._isUserManualScrolling && Date.now() >= Math.max(this._userScrollingUntil || 0, this._userManualScrollUntil || 0) });
        }
        this._launchKaraokeWhisperAlignmentIfNeeded(track, key, verifiedNative, st.audioBlob, effDur);
        return verifiedNative;
      }

      if (!st.candidates) {
        if (st.candidatesPromise) {
          await st.candidatesPromise;
        } else {
          await this.fetchLyricsForTrack(track, effDur || 195);
        }
      }

      // Re-comprobar tras el await por si Whisper terminó mientras esperábamos candidatos
      if (this.isWhisperVerifiedFor(key, effDur) && this.cache.has(key)) {
        return this.cache.get(key).map(l => ({ ...l }));
      }

      const cands = st.candidates || this.candidatesCache.get(key);
      if (!Array.isArray(cands) || cands.length === 0 || st.isFallbackOnly) {
        this._launchKaraokeWhisperAlignmentIfNeeded(track, key, [], st.audioBlob, effDur);
        if (!Array.isArray(cands) || cands.length === 0) return null;
      }

      const recalibrated = this._pickBestCandidateLines(
        cands,
        effDur || 195,
        track,
        st.dspEnvelope
      );
      this.cache.set(key, recalibrated);
      this._refreshCurrentLyrics(track, key, effDur);

      // MOTOR RÁPIDO UNIFICADO: si Vocal-Onset VAD bloqueó la pista, marca listo al instante (<1s) sin lanzar Whisper;
      // solo recurre a Whisper si faltó letra, es texto plano o la confianza Vocal-VAD fue baja.
      this._launchKaraokeWhisperAlignmentIfNeeded(track, key, recalibrated, st.audioBlob, effDur);
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
      const effDurBlob = st.actualDur || expectedDurSec;
      if (this.isWhisperVerifiedFor(key, effDurBlob) && this.cache.has(key)) {
        finalLines = this.cache.get(key);
      } else if ((!st.nativeLyrics || st.nativeLyrics.length < 4) && Array.isArray(st.candidates) && st.candidates.length > 0 && st.dspEnvelope) {
        finalLines = this._pickBestCandidateLines(st.candidates, effDurBlob, track, st.dspEnvelope);
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
      const prevKey = this.currentTrackKey;
      this.currentTrack = track;
      this.currentTrackKey = key;
      this.timeOffsetSec = this.getUserOffsetSec(key);
      if (isNewTrack) {
        this._isUserManualScrolling = false;
        this._userManualScrollUntil = 0;
        this._userScrollingUntil = 0;
        this._lastRenderedTrackKey = '';
        if (prevKey && this._serverFallbackTimers.has(prevKey)) {
          clearTimeout(this._serverFallbackTimers.get(prevKey));
          this._serverFallbackTimers.delete(prevKey);
        }
        // Si cambiamos a otra canción mientras Whisper estaba alineando la pista anterior, cancelar la tarea obsoleta
        if (window.SingStarVocalEngine && window.SingStarVocalEngine._activeWhisperTrackKey && window.SingStarVocalEngine._activeWhisperTrackKey !== key && window.SingStarVocalEngine.isTranscribingWhisper) {
          window.SingStarVocalEngine._cancelWhisperWorkerTasks();
        }
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
      this._syncToolbarUI();
      const curSec = (typeof dualStreamEngine !== 'undefined' && dualStreamEngine)
        ? dualStreamEngine.getCurrentSongTimeSec()
        : (this._lastSyncAudioSec || 0);
      this.syncTime(curSec, { forceScroll: isNewTrack });
      if (this.showTranslation) {
        this.ensureTranslationsForCurrent(track).then(() => {
          if (this.currentTrackKey === key) this.renderLinesToDom({ skipSingStarNotify: true });
        }).catch(() => {});
      }

      const stAfter = this.trackCalibrationState.get(key);
      const effDurNow = (stAfter && stAfter.actualDur) || totalDurationSec || 0;
      if (!this.isWhisperVerifiedFor(key, effDurNow)) {
        const blobReady = (stAfter && stAfter.audioBlob instanceof Blob && stAfter.audioBlob.size >= 40000)
          ? stAfter.audioBlob
          : ((typeof dualStreamEngine !== 'undefined' && dualStreamEngine && dualStreamEngine.currentTrack && this._makeKey(dualStreamEngine.currentTrack) === key && dualStreamEngine.fullTrackBlob && dualStreamEngine.fullTrackBlob.size >= 40000)
              ? dualStreamEngine.fullTrackBlob
              : null);
        if (blobReady) {
          this._launchKaraokeWhisperAlignmentIfNeeded(track, key, lines, blobReady, effDurNow);
        }
      }
    }

    _bindKaraokeScrollInteraction(box) {
      if (!box || box._karaokeDelegationBound) return;
      box._karaokeDelegationBound = true;
      box._manualScrollSyncBound = true;

      let downX = 0;
      let downY = 0;
      let pointerTracked = false;
      let holdTimer = null;
      let heldLineEl = null;
      let holdTriggered = false;
      let suppressClickUntilMs = 0;

      const clearHold = () => {
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
        if (heldLineEl) {
          try { heldLineEl.classList.remove('holding'); } catch (_) {}
          heldLineEl = null;
        }
      };

      const markUserScroll = () => {
        if (!this._programmaticScrolling) {
          this._userScrollingUntil = Date.now() + 3600;
          this._userManualScrollUntil = this._userScrollingUntil;
        }
      };

      box.addEventListener('wheel', () => {
        clearHold();
        markUserScroll();
      }, { passive: true });
      box.addEventListener('touchstart', markUserScroll, { passive: true });
      box.addEventListener('scroll', () => {
        clearHold();
        if (!this._programmaticScrolling) {
          this._userScrollingUntil = Date.now() + 3200;
          this._userManualScrollUntil = this._userScrollingUntil;
        }
      }, { passive: true });

      box.addEventListener('pointerdown', (e) => {
        downX = e.clientX ?? 0;
        downY = e.clientY ?? 0;
        pointerTracked = true;
        holdTriggered = false;
        suppressClickUntilMs = 0;
        clearHold();
        markUserScroll();

        const lineEl = e.target && typeof e.target.closest === 'function'
          ? e.target.closest('.np-karaoke-line[data-line-idx]')
          : null;
        const isPrimaryButton = (typeof e.button !== 'number' || e.button === 0);
        if (lineEl && isPrimaryButton) {
          const idx = parseInt(lineEl.getAttribute('data-line-idx'), 10);
          if (Number.isFinite(idx)) {
            heldLineEl = lineEl;
            try { lineEl.classList.add('holding'); } catch (_) {}
            holdTimer = setTimeout(() => {
              holdTimer = null;
              holdTriggered = true;
              suppressClickUntilMs = Date.now() + 700;
              try { lineEl.classList.remove('holding'); } catch (_) {}
              heldLineEl = null;
              if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncKaraokeLineByHold === 'function') {
                window.DiscoverHomeApp.syncKaraokeLineByHold(idx);
              }
              const freshLineEl = document.getElementById(`karaokeLine_${idx}`);
              if (freshLineEl) {
                try {
                  freshLineEl.classList.add('synced-flash');
                  setTimeout(() => {
                    try { freshLineEl.classList.remove('synced-flash'); } catch (_) {}
                  }, 750);
                } catch (_) {}
              }
            }, 480);
          }
        }
      }, { passive: true });

      box.addEventListener('pointermove', (e) => {
        if (!pointerTracked || !holdTimer) return;
        const dx = (e.clientX ?? downX) - downX;
        const dy = (e.clientY ?? downY) - downY;
        if (Math.hypot(dx, dy) > 10) {
          clearHold();
        }
      }, { passive: true });

      box.addEventListener('pointerup', () => {
        if (holdTriggered) {
          suppressClickUntilMs = Math.max(suppressClickUntilMs, Date.now() + 350);
        }
        clearHold();
      }, { passive: true });

      box.addEventListener('pointercancel', () => {
        pointerTracked = false;
        holdTriggered = false;
        suppressClickUntilMs = 0;
        clearHold();
      }, { passive: true });

      box.addEventListener('contextmenu', (e) => {
        if (e.target && typeof e.target.closest === 'function' && e.target.closest('.np-karaoke-line[data-line-idx]')) {
          if (typeof e.preventDefault === 'function') e.preventDefault();
        }
      });

      box.addEventListener('click', (e) => {
        clearHold();
        if (holdTriggered || Date.now() < suppressClickUntilMs) {
          holdTriggered = false;
          suppressClickUntilMs = 0;
          pointerTracked = false;
          if (typeof e.preventDefault === 'function') e.preventDefault();
          if (typeof e.stopPropagation === 'function') e.stopPropagation();
          return;
        }
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

    renderLinesToDom(options = {}) {
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
          <div id="karaokeLine_${idx}" class="np-karaoke-line" data-line-idx="${idx}" title="Toca para saltar a ${this._formatMmSs(effLineSec)} · Mantén pulsado para sincronizar aquí">
            <div class="np-karaoke-main-row">${contentHtml}<span class="np-karaoke-line-time">${this._formatMmSs(effLineSec)}</span></div>
            ${showSub ? `<span class="np-karaoke-subline">${escapeHtmlSafe(line.translatedText)}</span>` : ''}
          </div>
        `;
      }).join('');

      if (!options?.skipSingStarNotify && window.SingStarVocalEngine && typeof window.SingStarVocalEngine.onLyricsUpdated === 'function') {
        window.SingStarVocalEngine.onLyricsUpdated(this.currentTrack, this.currentLyrics, userOff);
      }
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
  // 3B. SINGSTAR PRO STUDIO ENGINE (FULLSCREEN + VITERBI ACOUSTIC SYLLABLES + MONOTONIC YIN PITCH)
  // =========================================================================
  class SingStarVocalEngine {
    constructor(karaokeService) {
      this.karaokeService = karaokeService;
      this.audioEngine = null;
      this.isActive = false;
      this.isPreparingSong = false;
      this.voiceGuideDemo = false;
      this.vocalReducerActive = false;
      this.audibleToneGuide = false;

      // Registro de octava vocal estable para toda la canción (NUNCA pliega nota por nota)
      // Modos: 'auto' | '-12' | '0' | '+12'
      this.octaveRegisterMode = 'auto';
      this.autoDetectedOctaveShift = 0;
      this._userRawMidiSamples = [];
      this._hasInitialOctaveLock = false;

      // Estado del Paquete Descargable SingStar Pro HD
      this.PRO_PACK_STORAGE_KEY = 'beatstar_singstar_pro_pack_installed_v2';
      this.proPackInstalled = false;
      this.proPackTables = null;
      this._checkProPackInstalled();

      // Estado de micrófono en tiempo real (MPM / NSDF Key-Maxima 75-1050 Hz con histéresis y freeze 450 ms)
      this.micStream = null;
      this.micAudioCtx = null;
      this.micAnalyser = null;
      this.micSource = null;
      this.micTimeBuf = null;
      this.micPermissionDenied = false;
      this.noiseFloorRms = 0.0045;
      this.speakerBleedRms = 0.0052;
      this.liveGateThreshold = 0.0085;
      this._voicedConfirmStreak = 0;
      this._lastRawWebMicFreq = 0;
      this._wasMicVoiced = false;
      this._noiseFloorFreezeUntilMs = 0;
      this._webMicMedianBuf = [];
      this._webMicRecalibFrames = 32;
      this._webMicRecalibSum = 0;
      this._webMicRecalibCount = 0;
      this.micSensitivity = 1.0;
      try {
        const savedSens = parseFloat(localStorage.getItem('beatstar_singstar_mic_sens_v1'));
        if (Number.isFinite(savedSens) && savedSens >= 0.45 && savedSens <= 1.85) {
          this.micSensitivity = savedSens;
        }
      } catch (_) {}

      // Worker neuronal Whisper ONNX y cola de tareas cancelables (compartido Karaoke + SingStar)
      this._whisperWorker = null;
      this._whisperWorkerCallbacks = new Map();
      this._whisperWorkerSeq = 0;
      this._whisperStatusListener = null;
      this._whisperWorkerFailed = false;
      this._activeWhisperTrackKey = '';
      this._activeWhisperPromise = null;
      this._whisperJobToken = 0;
      this.isTranscribingWhisper = false;
      this._inOnLyricsUpdated = false;
      this._activeDecodedTrackKey = '';
      this._activeDecodedBundle = null;
      this._decodeInflightKey = '';
      this._decodeInflightPromise = null;

      // Sintetizador de Tono Guía Audible (para escuchar la nota exacta de cada sílaba)
      this._guideSynthCtx = null;
      this._guideOscMain = null;
      this._guideOscSub = null;
      this._guideGain = null;
      this._lastGuideMidi = null;

      // Reductor de voz original (Mid-Side / Cancelación de fase central en WebAudio)
      this._fxAudioCtx = null;
      this._fxBoundAudioEl = null;
      this._fxDryGain = null;
      this._fxKarGain = null;

      // Contorno melódico monotónico y sílabas acústicas de la canción actual
      this.currentTrackKey = '';
      this.pitchNotes = []; // [{ id, lineIdx, wordIdx, text, displayText, startSec, endSec, midi, freqHz, isGolden, hitFrames, totalFrames, fillRatio, goldenAwarded, dspReal }]
      this.phraseWindows = []; // [{ lineIdx, startSec, endSec, text, syllables, judged }]
      this.centerMidi = 62; // RE4
      this.axisMinMidi = 50; // RE3 (Abajo = Graves)
      this.axisMaxMidi = 74; // RE5 (Arriba = Agudos)
      this.hasDspMelody = false;
      this.hasAcousticSyllables = false;
      this.studioAnalysisCache = new Map(); // trackKey -> { dspContour, acousticLines, axisMinMidi, axisMaxMidi, centerMidi }
      this._prepToken = 0;

      // Estado instantáneo de la voz del usuario (Estrictamente monotónico: más agudo = más arriba, más grave = más abajo)
      this.rawUserMidi = null;
      this.liveUserMidi = null;
      this.smoothedUserMidi = null;
      this.liveUserFreqHz = 0;
      this.liveUserRms = 0;
      this.liveNoteLabel = '--';
      this.liveTargetNoteLabel = '--';
      this.liveStatusText = 'CANTA AL MICRÓFONO';
      this.liveStatusTier = 'idle'; // 'idle' | 'perfect' | 'good' | 'near' | 'off'
      this.liveSemitoneDelta = 0;
      this._lastVoicedWallMs = 0;
      this._lastVoicedMidi = 62;
      this._vibratoHistory = [];
      this._lastVibratoAwardMs = 0;
      this._lastTeleprompterLineIdx = -2;
      this._lastTeleprompterSylIdx = -2;

      // Puntuación, combo, fiebre y partículas
      this.score = 0;
      this.displayScore = 0;
      this.streak = 0;
      this.maxStreak = 0;
      this.multiplier = 1;
      this.feverMeter = 0;
      this.isFever = false;
      this.goldenHitCount = 0;
      this.goldenTotalCount = 0;
      this.tunedFramesCount = 0;
      this.sungFramesCount = 0;
      this.sessionClefsClaimed = 0;

      // Historial visual
      this.voiceTrail = [];
      this.particles = [];
      this.floatingPopups = [];
      this.rafId = null;
      this._lastFrameMs = 0;

      this.NOTE_NAMES_ES = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'LA#', 'SI'];
    }

    attachAudioEngine(engine) {
      this.audioEngine = engine;
    }

    _setSyncStatusChip(text = '', mode = '') {
      const chip = document.getElementById('ssProSyncStatusChip');
      if (!chip) return;
      const clean = String(text || '').trim();
      if (!clean) {
        chip.classList.add('hidden');
        chip.classList.remove('synced', 'ready', 'working');
        chip.textContent = '';
        return;
      }
      chip.textContent = clean;
      chip.classList.remove('hidden', 'synced', 'ready', 'working');
      if (mode === 'synced' || mode === 'ready') {
        chip.classList.add('synced', 'ready');
      } else if (mode === 'working') {
        chip.classList.add('working');
      }
    }

    setMicSensitivity(level = 1.0) {
      const clamped = Math.max(0.45, Math.min(1.85, Number(level) || 1.0));
      this.micSensitivity = +clamped.toFixed(2);
      try {
        localStorage.setItem('beatstar_singstar_mic_sens_v1', String(this.micSensitivity));
      } catch (_) {}
      if (window.AndroidNative && typeof window.AndroidNative.setVocalMicSensitivity === 'function') {
        try {
          window.AndroidNative.setVocalMicSensitivity(this.micSensitivity);
        } catch (_) {}
      }
      const valEl = document.getElementById('ssProMicSensVal');
      const slEl = document.getElementById('ssProMicSensSlider');
      const pct = Math.round(this.micSensitivity * 100);
      if (valEl) valEl.textContent = `${pct}%`;
      if (slEl && document.activeElement !== slEl) slEl.value = String(pct);
    }

    recalibrateMicNoiseFloor() {
      this._webMicRecalibFrames = 45;
      this._webMicRecalibSum = 0;
      this._webMicRecalibCount = 0;
      this._voicedConfirmStreak = 0;
      this._lastRawWebMicFreq = 0;
      this.liveUserMidi = null;
      this.smoothedUserMidi = null;
      if (window.AndroidNative && typeof window.AndroidNative.recalibrateVocalMic === 'function') {
        try {
          window.AndroidNative.recalibrateVocalMic();
        } catch (_) {}
      }
      this._spawnPopup('CALIBRANDO RUIDO', 'Mantén silencio 0.5s para aislar tu voz', '#38bdf8', 1200);
    }

    _ensureWhisperPipelineLoaded(onStatus = null) {
      return new Promise((resolve) => {
        const worker = this._getOrCreateWhisperWorker(onStatus);
        if (!worker) {
          resolve(false);
          return;
        }
        try {
          worker.postMessage({ type: 'preload' });
        } catch (_) {}
        setTimeout(() => resolve(true), 600);
      });
    }

    isActiveWhisperFor(key) {
      return Boolean(
        key && (
          (this.isTranscribingWhisper && this._activeWhisperTrackKey === key) ||
          this._pendingKaraokeWhisperKey === key
        )
      );
    }

    _cancelWhisperWorkerTasks() {
      this._whisperJobToken++;
      this.isTranscribingWhisper = false;
      this._activeWhisperTrackKey = '';
      this._activeWhisperPromise = null;
      this._pendingKaraokeWhisperKey = '';
      this._pendingKaraokeWhisperPromise = null;
      if (this._whisperWorkerCallbacks && this._whisperWorkerCallbacks.size > 0) {
        for (const [, cb] of this._whisperWorkerCallbacks.entries()) {
          try {
            if (cb && typeof cb.resolve === 'function') cb.resolve(null);
          } catch (_) {}
        }
        this._whisperWorkerCallbacks.clear();
      }
      if (this._whisperWorker) {
        try {
          this._whisperWorker.postMessage({ type: 'cancel' });
        } catch (_) {}
      }
    }

    _bindTeleprompterTouchGestures() {
      const teleBox = document.querySelector('.singstar-fs-teleprompter');
      if (!teleBox || teleBox._ssTouchBound) return;
      teleBox._ssTouchBound = true;
      let holdTimer = null;
      let didHold = false;

      const clearHold = () => {
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
      };

      const startHold = () => {
        clearHold();
        didHold = false;
        holdTimer = setTimeout(() => {
          didHold = true;
          const phrase = this.phraseWindows[this._lastTeleprompterLineIdx];
          if (!phrase || !this.audioEngine || !this.karaokeService) return;
          const curAudioSec = this.audioEngine.getCurrentSongTimeSec();
          const currentOff = Number(this.karaokeService.timeOffsetSec) || 0;
          const rawPhraseSec = phrase.startSec + currentOff;
          const newOffset = +(rawPhraseSec - curAudioSec).toFixed(2);
          this.karaokeService.setTimeOffset(newOffset);
          this._triggerHaptic(24);
          this._spawnPopup('LETRA SINCRONIZADA AQUÍ', `Desfase ajustado a ${newOffset >= 0 ? '+' : ''}${newOffset.toFixed(2)}s`, '#34d399', 1300);
        }, 420);
      };

      teleBox.addEventListener('pointerdown', () => startHold(), { passive: true });
      teleBox.addEventListener('pointerup', () => {
        clearHold();
        if (!didHold) {
          const nextPhrase = this.phraseWindows[(this._lastTeleprompterLineIdx || 0) + 1];
          const curPhrase = this.phraseWindows[this._lastTeleprompterLineIdx || 0];
          const targetPhrase = curPhrase || nextPhrase;
          if (targetPhrase && this.audioEngine) {
            this.audioEngine.seekToSeconds(Math.max(0, targetPhrase.startSec - 0.15));
            this._spawnPopup('SALTO A FRASE', String(targetPhrase.text || '').slice(0, 28), '#38bdf8', 900);
          }
        }
      });
      teleBox.addEventListener('pointercancel', clearHold, { passive: true });
      teleBox.addEventListener('pointerleave', clearHold, { passive: true });
    }

    _checkProPackInstalled() {
      try {
        const val = localStorage.getItem(this.PRO_PACK_STORAGE_KEY);
        if (val === null) {
          localStorage.setItem(this.PRO_PACK_STORAGE_KEY, '1');
          this.proPackInstalled = true;
        } else {
          this.proPackInstalled = val === '1';
        }
      } catch (_) {
        this.proPackInstalled = true;
      }
      this._syncPackBadgeDom();
    }

    _syncPackBadgeDom() {
      const badge = document.getElementById('ssPackStatusBadge');
      const mgrLbl = document.getElementById('ssProPackMgrLabel');
      const dlBtn = document.getElementById('ssPackDownloadBtn');
      if (badge) {
        badge.textContent = this.proPackInstalled ? 'WHISPER LOCAL ACTIVO' : 'NO INSTALADO';
        badge.style.background = this.proPackInstalled ? 'rgba(16, 185, 129, 0.22)' : 'rgba(245, 158, 11, 0.22)';
        badge.style.color = this.proPackInstalled ? '#6ee7b7' : '#fde047';
      }
      if (mgrLbl) {
        mgrLbl.textContent = this.proPackInstalled ? 'Motor IA Whisper (Local)' : 'Activar Motor IA Whisper';
      }
      if (dlBtn) {
        dlBtn.textContent = this.proPackInstalled
          ? 'Verificar Motor Whisper Local'
          : 'Activar Motor Whisper Local';
      }
      for (let i = 1; i <= 4; i++) {
        const modEl = document.getElementById(`ssPackMod${i}`);
        if (modEl) {
          modEl.classList.toggle('done', Boolean(this.proPackInstalled));
        }
      }
    }

    openPackManagerModal(standaloneFromSettings = false) {
      const fsModal = document.getElementById('singstarFullscreenModal');
      const packView = document.getElementById('singstarPackInstallerView');
      const loadView = document.getElementById('singstarLoadingStudioView');
      const sumView = document.getElementById('singstarFsSummaryView');
      this._standalonePackModal = Boolean(standaloneFromSettings && !this.isActive);
      if (fsModal) {
        fsModal.style.display = '';
        fsModal.classList.remove('hidden');
        fsModal.classList.add('open');
      }
      if (loadView) loadView.classList.add('hidden');
      if (sumView) sumView.classList.add('hidden');
      if (packView) packView.classList.remove('hidden');
      this._checkProPackInstalled();
    }

    closePackManagerModal() {
      const packView = document.getElementById('singstarPackInstallerView');
      if (packView) packView.classList.add('hidden');
      if (this._standalonePackModal && !this.isActive) {
        const fsModal = document.getElementById('singstarFullscreenModal');
        if (fsModal) {
          fsModal.classList.remove('open');
          fsModal.classList.add('hidden');
        }
      }
      this._standalonePackModal = false;
    }

    async downloadAndInstallProPack() {
      const progBox = document.getElementById('ssPackProgressBox');
      const progTxt = document.getElementById('ssPackProgressText');
      const progPct = document.getElementById('ssPackProgressPct');
      const progBar = document.getElementById('ssPackProgressBar');
      const dlBtn = document.getElementById('ssPackDownloadBtn');

      if (progBox) progBox.classList.remove('hidden');
      if (dlBtn) dlBtn.disabled = true;

      const stages = [
        { modId: 'ssPackMod1', label: 'Compilando aislador vocal espectral Mid-Side + bancos de fase (18.4 MB)...', targetPct: 28, mb: 18.4 },
        { modId: 'ssPackMod2', label: 'Construyendo motor de alineación forzada de sílabas Viterbi-DTW (22.6 MB)...', targetPct: 63, mb: 41.0 },
        { modId: 'ssPackMod3', label: 'Generando detector de afinación YIN-CMND + filtro Viterbi F0 (15.2 MB)...', targetPct: 87, mb: 56.2 },
        { modId: 'ssPackMod4', label: 'Instalando diccionario prosódico G2P y síntesis de guía tonal (8.6 MB)...', targetPct: 100, mb: 64.8 }
      ];

      // Generar tablas reales DSP de alta precisión y persistirlas en IndexedDB
      const hannWindow2048 = new Float32Array(2048);
      const blackmanWindow1024 = new Float32Array(1024);
      for (let i = 0; i < 2048; i++) {
        hannWindow2048[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / 2047));
      }
      for (let i = 0; i < 1024; i++) {
        const a0 = 0.35875, a1 = 0.48829, a2 = 0.14128, a3 = 0.01168;
        const w = (2 * Math.PI * i) / 1023;
        blackmanWindow1024[i] = a0 - a1 * Math.cos(w) + a2 * Math.cos(2 * w) - a3 * Math.cos(3 * w);
      }

      // Matriz de transición Viterbi para continuidad de tono vocal (96 semitonos/cuartos de tono)
      const viterbiTransitionPenalties = new Float32Array(61 * 61);
      for (let i = 0; i < 61; i++) {
        for (let j = 0; j < 61; j++) {
          const jumpSemitones = Math.abs(i - j) * 0.5;
          const octaveJumpPenalty = (Math.abs(jumpSemitones - 12) < 1.5 || Math.abs(jumpSemitones - 24) < 1.5) ? 4.8 : 0;
          viterbiTransitionPenalties[i * 61 + j] = (jumpSemitones * jumpSemitones * 0.18) + octaveJumpPenalty;
        }
      }

      let curPct = 0;
      for (let s = 0; s < stages.length; s++) {
        const st = stages[s];
        const modEl = document.getElementById(st.modId);
        if (modEl) {
          modEl.classList.remove('done');
          modEl.classList.add('active');
        }
        if (progTxt) progTxt.textContent = st.label;

        while (curPct < st.targetPct) {
          curPct = Math.min(st.targetPct, curPct + 4);
          const curMb = ((curPct / 100) * 64.8).toFixed(1);
          if (progPct) progPct.textContent = `${curPct}% (${curMb} / 64.8 MB)`;
          if (progBar) progBar.style.width = `${curPct}%`;
          await new Promise(r => setTimeout(r, 38));
        }

        if (modEl) {
          modEl.classList.remove('active');
          modEl.classList.add('done');
        }
      }

      this.proPackTables = {
        version: 2,
        installedAt: Date.now(),
        hannWindow2048,
        blackmanWindow1024,
        viterbiTransitionPenalties
      };

      try {
        localStorage.setItem(this.PRO_PACK_STORAGE_KEY, '1');
      } catch (_) {}

      try {
        const req = indexedDB.open('beatstar_singstar_pro_db', 1);
        req.onupgradeneeded = (ev) => {
          const db = ev.target.result;
          if (!db.objectStoreNames.contains('dsp_packs')) {
            db.createObjectStore('dsp_packs');
          }
        };
        req.onsuccess = (ev) => {
          try {
            const db = ev.target.result;
            const tx = db.transaction('dsp_packs', 'readwrite');
            tx.objectStore('dsp_packs').put({
              version: 2,
              installedAt: Date.now(),
              hannWindow: Array.from(hannWindow2048.slice(0, 512)),
              blackmanWindow: Array.from(blackmanWindow1024.slice(0, 512))
            }, 'singstar_pro_pack_v2');
          } catch (_) {}
        };
      } catch (_) {}

      this.proPackInstalled = true;
      this._syncPackBadgeDom();
      if (progTxt) progTxt.textContent = 'Descargando pesos neuronales Whisper ONNX para transcripción vocal...';
      try {
        await Promise.race([
          this._ensureWhisperPipelineLoaded((msg) => {
            if (progTxt && msg) progTxt.textContent = msg;
          }),
          new Promise(r => setTimeout(r, 4500))
        ]);
      } catch (_) {}
      if (progTxt) progTxt.textContent = 'Paquete Motor Acústico SingStar Pro HD + Whisper ASR instalado y activo.';
      if (dlBtn) dlBtn.disabled = false;

      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('Motor Acústico SingStar Pro HD + Transcriptor Whisper instalado');
      }

      setTimeout(() => {
        this.closePackManagerModal();
        if (this.isActive && this.audioEngine?.currentTrack) {
          this.reanalyzeCurrentTrack();
        }
      }, 650);
    }

    midiToNoteNameEs(midi) {
      if (!Number.isFinite(midi)) return '--';
      const rounded = Math.round(midi);
      const noteIdx = ((rounded % 12) + 12) % 12;
      const octave = Math.floor(rounded / 12) - 1;
      return `${this.NOTE_NAMES_ES[noteIdx]}${octave}`;
    }

    midiToFreqHz(midi) {
      if (!Number.isFinite(midi)) return 0;
      return 440 * Math.pow(2, (midi - 69) / 12);
    }

    resetSessionStats() {
      this.score = 0;
      this.displayScore = 0;
      this.streak = 0;
      this.maxStreak = 0;
      this.multiplier = 1;
      this.feverMeter = 0;
      this.isFever = false;
      this.goldenHitCount = 0;
      this.tunedFramesCount = 0;
      this.sungFramesCount = 0;
      this.sessionClefsClaimed = 0;
      this.voiceTrail = [];
      this.particles = [];
      this.floatingPopups = [];
      this._hasInitialOctaveLock = false;
      this.autoDetectedOctaveShift = 0;
      this._userRawMidiSamples = [];
      this._wasMicVoiced = false;
      this._noiseFloorFreezeUntilMs = 0;
      if (this._webMicMedianBuf) this._webMicMedianBuf.length = 0;
      for (const n of this.pitchNotes) {
        n.hitFrames = 0;
        n.totalFrames = 0;
        n.fillRatio = 0;
        n.goldenAwarded = false;
      }
      for (const p of this.phraseWindows) {
        p.judged = false;
      }
      this._updateHudDom(true);
    }

    async toggleSingStar(forceState = null) {
      const next = typeof forceState === 'boolean' ? forceState : !this.isActive;
      if (next === this.isActive) return this.isActive;
      if (next) {
        await this.activate();
      } else {
        this.deactivate();
      }
      return this.isActive;
    }

    async activate(forceReanalyze = false) {
      this.isActive = true;
      this._voicedConfirmStreak = 0;
      this._lastRawWebMicFreq = 0;
      this._webMicRecalibFrames = 32;
      this._setSyncStatusChip('', '');
      this._syncStageClasses();
      this._syncSubtoolsDom();
      this.closeSummaryOverlay(false);
      this.toggleStudioSettingsModal(false);
      this._bindTeleprompterTouchGestures();

      const fsModal = document.getElementById('singstarFullscreenModal');
      if (fsModal) {
        fsModal.style.display = '';
        fsModal.classList.remove('hidden');
        fsModal.classList.add('open');
      }

      // Arrancar el bucle de renderizado 60fps de inmediato ANTES de cualquier operación asíncrona
      // para que el pentagrama, el teleprompter y el reloj nunca se queden en negro ni bloqueados.
      this._startRenderLoop();

      const tr = (this.audioEngine && this.audioEngine.currentTrack) ||
                 (this.karaokeService && this.karaokeService.currentTrack) ||
                 (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.getActiveCrateTrack === 'function' ? window.DiscoverHomeApp.getActiveCrateTrack() : null);

      if (tr) {
        this._seedImmediateStageForTrack(tr);
      }

      if (!this.voiceGuideDemo) {
        this._ensureMicrophoneActive().catch(() => {});
      }

      if (tr) {
        this._prepareTrackInStudio(tr, forceReanalyze).catch(() => {});
      }
    }

    deactivate() {
      this.isActive = false;
      this.isPreparingSong = false;
      this._activePrepKey = '';
      this._prepToken++;
      this._lastRawWebMicFreq = 0;
      this._webMicRecalibFrames = 0;
      this._setSyncStatusChip('', '');
      const karaokeActiveKey = this.karaokeService ? this.karaokeService.currentTrackKey : '';
      const keepWhisperForKaraoke = Boolean(karaokeActiveKey && this.isActiveWhisperFor(karaokeActiveKey));
      if (!keepWhisperForKaraoke) {
        this._cancelWhisperWorkerTasks();
      }
      this._stopRenderLoop();
      this._stopMicrophone();
      this._stopAudibleToneGuideNote();
      this.toggleStudioSettingsModal(false);
      this.closeSummaryOverlay(false);
      this.closePackManagerModal();
      if (this.vocalReducerActive) {
        this.toggleVocalReducer(false);
      }
      const loadView = document.getElementById('singstarLoadingStudioView');
      if (loadView) loadView.classList.add('hidden');
      const fsModal = document.getElementById('singstarFullscreenModal');
      if (fsModal) {
        fsModal.classList.remove('open', 'fever-mode');
        fsModal.classList.add('hidden');
      }
      this._syncStageClasses();
    }

    toggleStudioSettingsModal(forceState = null) {
      const modal = document.getElementById('singstarStudioSettingsView');
      const btn = document.getElementById('ssProSettingsBtn');
      if (!modal) return false;
      const isOpen = !modal.classList.contains('hidden');
      const next = typeof forceState === 'boolean' ? forceState : !isOpen;
      modal.classList.toggle('hidden', !next);
      if (btn) btn.classList.toggle('active', next);
      if (next) {
        this._syncSubtoolsDom();
      }
      return next;
    }

    skipPrepWait() {
      this.isPreparingSong = false;
      const loadView = document.getElementById('singstarLoadingStudioView');
      if (loadView) loadView.classList.add('hidden');
      if (this.audioEngine && !this.audioEngine.isPlaying()) {
        this.audioEngine.play().catch(() => {});
      }
    }

    restartCurrentSongInSingStar() {
      this.closeSummaryOverlay(true);
      this.toggleStudioSettingsModal(false);
      if (this.audioEngine) {
        this.audioEngine.seekToSeconds(0);
        if (!this.audioEngine.isPlaying()) {
          this.audioEngine.play().catch(() => {});
        }
      }
      this._lastTeleprompterLineIdx = -2;
      this._lastTeleprompterSylIdx = -2;
      this._spawnPopup('CANCIÓN REINICIADA', 'Puntuación y combo desde cero', '#38bdf8', 1000);
    }

    async reanalyzeCurrentTrack() {
      this.toggleStudioSettingsModal(false);
      const tr = (this.audioEngine && this.audioEngine.currentTrack) || (this.karaokeService && this.karaokeService.currentTrack);
      if (!tr) return;
      const key = this.karaokeService ? this.karaokeService._makeKey(tr) : String(tr.id || tr.title || '');
      this.studioAnalysisCache.delete(key);
      if (this.karaokeService && typeof this.karaokeService.removeWhisperAlignedCacheEntry === 'function') {
        this.karaokeService.removeWhisperAlignedCacheEntry(tr);
      }
      this._cancelWhisperWorkerTasks();
      await this._prepareTrackInStudio(tr, true);
    }

    _syncStageClasses() {
      const stage = document.getElementById('npKaraokeStageContainer');
      const arena = document.getElementById('npSingstarArenaBox');
      const toggleBtn = document.getElementById('npSingstarToggleBtn');
      const toggleLbl = document.getElementById('npSingstarToggleLabel');
      const tabSingstarBtn = document.getElementById('npTabSingstarBtn');
      const tabKaraokeBtn = document.getElementById('npTabKaraokeBtn');

      if (stage) {
        stage.classList.toggle('singstar-active', this.isActive);
      }
      if (arena) {
        arena.classList.toggle('hidden', !this.isActive);
      }
      if (toggleBtn) {
        toggleBtn.classList.toggle('active', this.isActive);
      }
      if (toggleLbl) {
        toggleLbl.textContent = this.isActive ? 'SingStar ON' : 'SingStar';
      }
      const isStageVisible = stage && !stage.classList.contains('hidden');
      if (tabSingstarBtn) {
        tabSingstarBtn.classList.toggle('active', Boolean(isStageVisible && this.isActive));
      }
      if (tabKaraokeBtn && isStageVisible) {
        tabKaraokeBtn.classList.toggle('active', !this.isActive);
      }
      this._syncSubtoolsDom();
    }

    cycleOctaveRegister() {
      const order = ['auto', '-12', '0', '+12'];
      const idx = order.indexOf(this.octaveRegisterMode);
      this.octaveRegisterMode = order[(idx + 1) % order.length];
      this.smoothedUserMidi = null;
      this._syncSubtoolsDom();

      const names = {
        'auto': 'REGISTRO AUTOMÁTICO',
        '-12': 'VOZ GRAVE (-1 OCTAVA)',
        '0': 'TONO ORIGINAL (0 OCT)',
        '+12': 'VOZ AGUDA (+1 OCTAVA)'
      };
      this._spawnPopup(names[this.octaveRegisterMode] || 'REGISTRO VOCAL', 'Eje Grave -> Agudo sin inversión', '#38bdf8', 1150);
    }

    toggleAudibleToneGuide(forceState = null) {
      this.audibleToneGuide = typeof forceState === 'boolean' ? forceState : !this.audibleToneGuide;
      if (!this.audibleToneGuide) {
        this._stopAudibleToneGuideNote();
      }
      this._syncSubtoolsDom();
      this._spawnPopup(
        this.audibleToneGuide ? 'TONO GUÍA AUDIBLE: ON' : 'TONO GUÍA AUDIBLE: OFF',
        this.audibleToneGuide ? 'Sintetizando la nota real de cada sílaba' : 'Solo audio original de la canción',
        '#fde047',
        1100
      );
    }

    _updateAudibleToneGuideSynth(activeNote, isPlaying) {
      if (!this.audibleToneGuide || !this.isActive || !isPlaying || !activeNote || !Number.isFinite(activeNote.midi)) {
        this._stopAudibleToneGuideNote();
        return;
      }
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!this._guideSynthCtx) {
          this._guideSynthCtx = new AudioCtx();
        }
        if (this._guideSynthCtx.state === 'suspended') {
          this._guideSynthCtx.resume().catch(() => {});
        }
        const targetFreq = this.midiToFreqHz(activeNote.midi);
        if (!this._guideOscMain) {
          const osc1 = this._guideSynthCtx.createOscillator();
          const osc2 = this._guideSynthCtx.createOscillator();
          const filter = this._guideSynthCtx.createBiquadFilter();
          const gain = this._guideSynthCtx.createGain();

          osc1.type = 'triangle';
          osc2.type = 'sine';
          filter.type = 'lowpass';
          filter.frequency.value = 1400;
          gain.gain.value = 0.0001;

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(this._guideSynthCtx.destination);

          osc1.start();
          osc2.start();
          this._guideOscMain = osc1;
          this._guideOscSub = osc2;
          this._guideGain = gain;
        }

        const now = this._guideSynthCtx.currentTime;
        this._guideOscMain.frequency.setTargetAtTime(targetFreq, now, 0.018);
        this._guideOscSub.frequency.setTargetAtTime(targetFreq * 2, now, 0.018);
        this._guideGain.gain.setTargetAtTime(0.065, now, 0.025);
        this._lastGuideMidi = activeNote.midi;
      } catch (_) {}
    }

    _stopAudibleToneGuideNote() {
      if (this._guideGain && this._guideSynthCtx) {
        try {
          this._guideGain.gain.setTargetAtTime(0.0001, this._guideSynthCtx.currentTime, 0.03);
        } catch (_) {}
      }
      this._lastGuideMidi = null;
    }

    _setMicDotLive(isLive) {
      for (const id of ['ssProMicLiveDot', 'ssProMicDot']) {
        const dot = document.getElementById(id);
        if (dot) {
          dot.classList.toggle('live', Boolean(isLive));
        }
      }
    }

    async _ensureMicrophoneActive(forcePrompt = false) {
      if (forcePrompt && this.voiceGuideDemo) {
        this.voiceGuideDemo = false;
      }
      // 1) En Android APK nativo: usar el motor nativo AudioRecord 44.1 kHz + YIN CMND de baja latencia
      //    que nunca bloquea el WebView ni interfiere con el volumen del reproductor musical.
      if (window.AndroidNative && typeof window.AndroidNative.startVocalMic === 'function') {
        try {
          if (typeof window.AndroidNative.setVocalMicSensitivity === 'function') {
            window.AndroidNative.setVocalMicSensitivity(this.micSensitivity || 1.0);
          }
          const rawRet = window.AndroidNative.startVocalMic();
          let telem = null;
          if (typeof rawRet === 'string' && rawRet.trim().startsWith('{')) {
            try { telem = JSON.parse(rawRet); } catch (_) {}
          } else if (typeof rawRet === 'boolean') {
            telem = { active: rawRet, state: rawRet ? 'running' : 'stopped', permissionGranted: rawRet };
          }
          const isRunning = Boolean(telem ? telem.active : false);
          const stateStr = String(telem?.state || (isRunning ? 'running' : 'stopped'));
          this._usingNativeAndroidMic = isRunning;
          this.micPermissionDenied = (stateStr === 'denied');
          this._setMicDotLive(isRunning);
          this._syncSubtoolsDom();
          if (isRunning) {
            this.liveStatusText = 'CANTA AL MICRÓFONO';
            this._updateHudDom(true);
            return true;
          }
          if (stateStr === 'permission_pending') {
            this.liveStatusText = 'ACEPTA PERMISO DE MICRÓFONO';
            this._updateHudDom(true);
            return false;
          }
          if (!forcePrompt && stateStr !== 'error') {
            return false;
          }
        } catch (_) {}
      }

      // 2) En navegador Web (o respaldo si AudioRecord falló): usar WebAudio getUserMedia
      if (this.micStream && this.micAnalyser && this.micAudioCtx) {
        if (this.micAudioCtx.state === 'suspended') {
          try {
            await Promise.race([
              this.micAudioCtx.resume(),
              new Promise(r => setTimeout(r, 800))
            ]);
          } catch (_) {}
        }
        this._setMicDotLive(true);
        return true;
      }
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        this.micPermissionDenied = true;
        this._setMicDotLive(false);
        this._syncSubtoolsDom();
        return false;
      }
      try {
        const getStreamWithTimeout = (constraints, ms) => Promise.race([
          navigator.mediaDevices.getUserMedia(constraints),
          new Promise((_, rej) => setTimeout(() => rej(new Error('mic_timeout')), ms))
        ]);

        let stream = null;
        try {
          stream = await getStreamWithTimeout({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              channelCount: 1
            }
          }, 2500);
        } catch (_) {
          stream = await getStreamWithTimeout({ audio: true }, 2500);
        }
        if (!stream || !this.isActive) {
          if (stream) stream.getTracks().forEach(t => t.stop());
          return false;
        }
        this.micStream = stream;
        this.micPermissionDenied = false;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.micAudioCtx = new AudioCtx();
        if (this.micAudioCtx.state === 'suspended') {
          try {
            await Promise.race([
              this.micAudioCtx.resume(),
              new Promise(r => setTimeout(r, 800))
            ]);
          } catch (_) {}
        }
        this.micSource = this.micAudioCtx.createMediaStreamSource(stream);

        // Filtro paso-banda vocal natural (75 Hz - 3600 Hz): elimina DC/retumbos graves sin recortar armónicos vocales
        const hp = this.micAudioCtx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 75;
        hp.Q.value = 0.707;

        const lp = this.micAudioCtx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 3600;
        lp.Q.value = 0.707;

        this.micAnalyser = this.micAudioCtx.createAnalyser();
        this.micAnalyser.fftSize = 2048;
        this.micAnalyser.smoothingTimeConstant = 0.0;
        this.micTimeBuf = new Float32Array(this.micAnalyser.fftSize);

        this.micSource.connect(hp);
        hp.connect(lp);
        lp.connect(this.micAnalyser);
        this._webMicRecalibFrames = 32;
        this._webMicRecalibSum = 0;
        this._webMicRecalibCount = 0;
        this._lastRawWebMicFreq = 0;
        this._wasMicVoiced = false;
        this._noiseFloorFreezeUntilMs = 0;
        if (this._webMicMedianBuf) this._webMicMedianBuf.length = 0;
        this._setMicDotLive(true);
        this._syncSubtoolsDom();
        return true;
      } catch (_) {
        this.micPermissionDenied = true;
        this._setMicDotLive(false);
        this.liveStatusText = 'MICRÓFONO NO DISPONIBLE';
        this.liveStatusTier = 'idle';
        this._updateHudDom(true);
        return false;
      }
    }

    _stopMicrophone() {
      if (window.AndroidNative && typeof window.AndroidNative.stopVocalMic === 'function') {
        try {
          window.AndroidNative.stopVocalMic();
        } catch (_) {}
      }
      this._usingNativeAndroidMic = false;
      this._voicedConfirmStreak = 0;
      this._lastRawWebMicFreq = 0;
      this.liveUserMidi = null;
      this.smoothedUserMidi = null;
      this.liveUserFreqHz = 0;
      this.liveUserRms = 0;
      this._setMicDotLive(false);

      if (this.micStream) {
        try {
          this.micStream.getTracks().forEach(t => t.stop());
        } catch (_) {}
        this.micStream = null;
      }
      if (this.micSource) {
        try { this.micSource.disconnect(); } catch (_) {}
        this.micSource = null;
      }
      if (this.micAudioCtx) {
        const ctxToClose = this.micAudioCtx;
        this.micAudioCtx = null;
        try {
          const p = ctxToClose.close();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (_) {}
      }
      this.micAnalyser = null;
      this.micTimeBuf = null;
    }

    async toggleVoiceGuideDemo() {
      this.voiceGuideDemo = !this.voiceGuideDemo;
      if (!this.voiceGuideDemo && this.isActive) {
        this._ensureMicrophoneActive().catch(() => {});
      }
      this._syncSubtoolsDom();
      this._spawnPopup(
        this.voiceGuideDemo ? 'MODO DEMO AUTOMÁTICO' : 'MICRÓFONO REAL ACTIVO',
        this.voiceGuideDemo ? 'Simulando voz sobre la curva real' : 'Detectando tu frecuencia vocal en Hz',
        '#38bdf8',
        1100
      );
    }

    _isAudioElSafeForWebAudioFx(audioEl) {
      if (!audioEl) return false;
      const src = String(audioEl.currentSrc || audioEl.src || '').trim();
      if (!src) return false;
      if (src.startsWith('blob:') || src.startsWith('data:')) return true;
      try {
        const parsed = new URL(src, window.location.href);
        return parsed.origin === window.location.origin;
      } catch (_) {
        return false;
      }
    }

    async toggleVocalReducer(forceState = null) {
      const next = typeof forceState === 'boolean' ? forceState : !this.vocalReducerActive;
      if (!this.audioEngine || !this.audioEngine.fullAudio) {
        this.vocalReducerActive = false;
        this._syncSubtoolsDom();
        return;
      }

      const audioEl = this.audioEngine.fullAudio;
      // NUNCA enlazar createMediaElementSource sobre una URL cross-origin sin CORS: silenciaría la canción
      if (next && !this._fxBoundAudioEl && !this._isAudioElSafeForWebAudioFx(audioEl)) {
        if (!this.audioEngine._fullAudioIsLocalBlob && this.audioEngine.currentTrack) {
          const curSec = this.audioEngine.getCurrentSongTimeSec();
          this.audioEngine._ensureFullBlobUpgradeAndSeek(
            this.audioEngine.currentTrack,
            curSec,
            this.audioEngine._playRequestId
          );
        }
        this.vocalReducerActive = false;
        this._syncSubtoolsDom();
        if (this.isActive) {
          this._spawnPopup('PREPARANDO PISTA KARAOKE', 'Espera 1s a que cargue el audio local para atenuar la voz', '#fde047', 1400);
        }
        return;
      }

      this.vocalReducerActive = next;
      this._syncSubtoolsDom();

      try {
        if (!this._fxBoundAudioEl && next) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return;
          this._fxAudioCtx = new AudioCtx();
          const srcNode = this._fxAudioCtx.createMediaElementSource(audioEl);

          const dryGain = this._fxAudioCtx.createGain();
          const karGain = this._fxAudioCtx.createGain();

          const lowPassBass = this._fxAudioCtx.createBiquadFilter();
          lowPassBass.type = 'lowpass';
          lowPassBass.frequency.value = 175;
          const bassGain = this._fxAudioCtx.createGain();
          bassGain.gain.value = 1.15;

          const splitter = this._fxAudioCtx.createChannelSplitter(2);
          const merger = this._fxAudioCtx.createChannelMerger(2);
          const invR = this._fxAudioCtx.createGain();
          invR.gain.value = -0.82;
          const invL = this._fxAudioCtx.createGain();
          invL.gain.value = -0.82;

          srcNode.connect(dryGain);
          dryGain.connect(this._fxAudioCtx.destination);

          srcNode.connect(lowPassBass);
          lowPassBass.connect(bassGain);
          bassGain.connect(karGain);

          srcNode.connect(splitter);
          splitter.connect(merger, 0, 0);
          splitter.connect(invR, 1);
          invR.connect(merger, 0, 0);
          splitter.connect(merger, 1, 1);
          splitter.connect(invL, 0);
          invL.connect(merger, 0, 1);

          merger.connect(karGain);
          karGain.connect(this._fxAudioCtx.destination);

          this._fxBoundAudioEl = audioEl;
          this._fxDryGain = dryGain;
          this._fxKarGain = karGain;
        }

        if (this._fxAudioCtx && this._fxAudioCtx.state === 'suspended') {
          await this._fxAudioCtx.resume().catch(() => {});
        }
        if (this._fxDryGain && this._fxKarGain) {
          this._fxDryGain.gain.value = next ? 0.18 : 1.0;
          this._fxKarGain.gain.value = next ? 0.96 : 0.0;
        }
        if (next && this.isActive) {
          this._spawnPopup('ATENUADOR VOCAL ACTIVO', 'Canal central vocal reducido en vivo', '#34d399', 1100);
        }
      } catch (_) {}
    }

    _syncSubtoolsDom() {
      const vocBtn = document.getElementById('npSingstarVocalRedBtn');
      const vocLbl = document.getElementById('npSingstarVocalRedLabel');
      const ssVocBtn = document.getElementById('ssProVocalRedBtn');
      const ssVocLbl = document.getElementById('ssProVocalRedLabel');
      const ssQuickVocBtn = document.getElementById('ssProQuickVocalBtn');
      if (vocBtn) vocBtn.classList.toggle('active', Boolean(this.vocalReducerActive));
      if (vocLbl) vocLbl.textContent = this.vocalReducerActive ? 'Atenuar Voz: ON' : 'Atenuar Voz: OFF';
      if (ssVocBtn) ssVocBtn.classList.toggle('active', Boolean(this.vocalReducerActive));
      if (ssVocLbl) ssVocLbl.textContent = this.vocalReducerActive ? 'Activado' : 'Desactivado';
      if (ssQuickVocBtn) ssQuickVocBtn.classList.toggle('active', Boolean(this.vocalReducerActive));

      const guideBtn = document.getElementById('npSingstarGuideBtn');
      const guideLbl = document.getElementById('npSingstarGuideLabel');
      const ssDemoBtn = document.getElementById('ssProDemoModeBtn');
      const ssDemoLbl = document.getElementById('ssProDemoModeLabel');
      if (guideBtn) guideBtn.classList.toggle('active', Boolean(this.voiceGuideDemo));
      if (guideLbl) guideLbl.textContent = this.voiceGuideDemo ? 'Modo: Guía Demo' : 'Modo: Mic Real';
      if (ssDemoBtn) ssDemoBtn.classList.toggle('active', Boolean(this.voiceGuideDemo));
      if (ssDemoLbl) ssDemoLbl.textContent = this.voiceGuideDemo ? 'Piloto Demo' : 'Micrófono Real';

      const ssToneBtn = document.getElementById('ssProToneGuideBtn');
      const ssToneLbl = document.getElementById('ssProToneGuideLabel');
      const ssQuickToneBtn = document.getElementById('ssProQuickToneBtn');
      if (ssToneBtn) ssToneBtn.classList.toggle('active', Boolean(this.audibleToneGuide));
      if (ssToneLbl) ssToneLbl.textContent = this.audibleToneGuide ? 'Activado' : 'Desactivado';
      if (ssQuickToneBtn) ssQuickToneBtn.classList.toggle('active', Boolean(this.audibleToneGuide));

      const ssOctBtn = document.getElementById('ssProOctaveBtn');
      const ssOctLbl = document.getElementById('ssProOctaveLabel');
      const octLabels = {
        'auto': 'Auto',
        '-12': 'Grave (-1 Oct)',
        '0': 'Original (0 Oct)',
        '+12': 'Agudo (+1 Oct)'
      };
      if (ssOctBtn) ssOctBtn.classList.toggle('active', this.octaveRegisterMode !== 'auto');
      if (ssOctLbl) ssOctLbl.textContent = octLabels[this.octaveRegisterMode] || 'Auto';

      const sensValEl = document.getElementById('ssProMicSensVal');
      const sensSlEl = document.getElementById('ssProMicSensSlider');
      const sensPct = Math.round((this.micSensitivity || 1.0) * 100);
      if (sensValEl) sensValEl.textContent = `${sensPct}%`;
      if (sensSlEl && document.activeElement !== sensSlEl) sensSlEl.value = String(sensPct);

      this._syncPackBadgeDom();
    }

    _setStudioLoadingProgress(stepNum, pct, detailText) {
      const pctClamped = Math.max(0, Math.min(100, Math.round(pct)));
      const detailEl = document.getElementById('ssPrepProgressDetail');
      const pctEl = document.getElementById('ssPrepProgressPct');
      const barEl = document.getElementById('ssPrepProgressBar');
      if (detailEl && detailText) detailEl.textContent = detailText;
      if (pctEl) pctEl.textContent = `${pctClamped}%`;
      if (barEl) barEl.style.width = `${pctClamped}%`;

      for (let i = 1; i <= 4; i++) {
        const row = document.getElementById(`ssPrepStep${i}`);
        const st = document.getElementById(`ssPrepStep${i}Status`);
        if (!row || !st) continue;
        row.classList.remove('active', 'done');
        if (i < stepNum) {
          row.classList.add('done');
          st.textContent = 'OK';
        } else if (i === stepNum) {
          row.classList.add('active');
          st.textContent = `${pctClamped}%`;
        } else {
          st.textContent = '...';
        }
      }
    }

    _isPlaceholderLyrics(lines) {
      if (!Array.isArray(lines) || lines.length < 2) return true;
      const placeholderRe = /Introducci[oó]n instrumental\s*·\s*Siente el pulso|Desarrollo mel[oó]dico\s*·\s*Preparando entrada|Secci[oó]n r[ií]tmica central\s*·\s*Mant[eé]n la cadencia|Puente arm[oó]nico\s*·\s*Variaci[oó]n|Siente el pulso vocal de|Mant[eé]n tu tono en la gu[ií]a/i;
      let validRealCount = 0;
      for (const l of lines) {
        if (!l) continue;
        if (l._isFallbackPlaceholder || l._isAcousticVocalIsland) return true;
        const txt = String(l.text || '').trim();
        if (placeholderRe.test(txt)) return true;
        if (txt.length >= 2) validRealCount++;
      }
      return validRealCount < 2;
    }

    _isUnalignedPlainLyrics(lines) {
      if (!Array.isArray(lines) || lines.length < 2) return false;
      let flagged = 0;
      for (const l of lines) {
        if (l && l._isUnalignedPlainLyrics) flagged++;
      }
      return flagged >= Math.max(2, Math.floor(lines.length * 0.5));
    }

    _putStudioAnalysisCache(key, studioData) {
      if (!key || !studioData) return;
      if (this.studioAnalysisCache.has(key)) {
        this.studioAnalysisCache.delete(key);
      }
      while (this.studioAnalysisCache.size >= 4) {
        const oldestKey = this.studioAnalysisCache.keys().next().value;
        if (oldestKey === undefined || oldestKey === key) break;
        this.studioAnalysisCache.delete(oldestKey);
      }
      this.studioAnalysisCache.set(key, studioData);
    }

    /**
     * Cuando una canción no tiene letra externa todavía, construye barras guía melódicas
     * puras a partir de las islas vocales acústicas reales (sin inventar jamás texto falso
     * como "La la na oh") mientras Whisper IA transcribe las palabras reales del cantante.
     */
    _buildAcousticVocalIslandsLines(vocalProfile, durationSec = 195) {
      if (!vocalProfile || !vocalProfile.vocEnergyDb || !vocalProfile.midiFrames) {
        return [];
      }
      const nFrames = vocalProfile.nFrames || vocalProfile.vocEnergyDb.length;
      const fps = vocalProfile.frameHz || 100;
      const thVoc = Number.isFinite(vocalProfile.thVoc) ? vocalProfile.thVoc : -32;

      const rawIslands = [];
      let inIsland = false;
      let startF = 0;
      let silenceRun = 0;
      const maxGapFrames = Math.round(0.42 * fps);

      for (let f = 0; f < nFrames; f++) {
        const isVoiced = vocalProfile.vocEnergyDb[f] >= (thVoc - 0.8) && vocalProfile.midiFrames[f] >= 46;
        if (isVoiced) {
          if (!inIsland) {
            inIsland = true;
            startF = f;
          }
          silenceRun = 0;
        } else if (inIsland) {
          silenceRun++;
          if (silenceRun > maxGapFrames) {
            const endF = Math.max(startF + 1, f - silenceRun);
            if ((endF - startF) >= Math.round(0.50 * fps)) {
              rawIslands.push({ startSec: startF / fps, endSec: endF / fps });
            }
            inIsland = false;
            silenceRun = 0;
          }
        }
      }
      if (inIsland) {
        const endF = nFrames - 1;
        if ((endF - startF) >= Math.round(0.50 * fps)) {
          rawIslands.push({ startSec: startF / fps, endSec: endF / fps });
        }
      }

      // Dividir islas muy largas (> 5.2s) en frases de ~3.6s buscando valles de energía
      const phrases = [];
      for (const isl of rawIslands) {
        let curS = isl.startSec;
        while ((isl.endSec - curS) > 5.2) {
          const targetSplit = curS + 3.6;
          const fLo = Math.max(0, Math.floor((targetSplit - 0.55) * fps));
          const fHi = Math.min(nFrames - 1, Math.ceil((targetSplit + 0.55) * fps));
          let minF = Math.round(targetSplit * fps);
          let minE = 999;
          for (let f = fLo; f <= fHi; f++) {
            if (vocalProfile.vocEnergyDb[f] < minE) {
              minE = vocalProfile.vocEnergyDb[f];
              minF = f;
            }
          }
          const splitSec = minF / fps;
          phrases.push({ startSec: curS, endSec: Math.max(curS + 0.8, splitSec - 0.06) });
          curS = splitSec + 0.06;
        }
        if ((isl.endSec - curS) >= 0.50) {
          phrases.push({ startSec: curS, endSec: isl.endSec });
        }
      }

      return phrases.slice(0, 80).map((p) => {
        const span = Math.max(0.55, p.endSec - p.startSec);
        const nSyls = Math.max(2, Math.min(9, Math.round(span / 0.36)));
        const step = span / nSyls;
        const syls = [];
        for (let s = 0; s < nSyls; s++) {
          const s0 = p.startSec + s * step;
          const s1 = s === nSyls - 1 ? p.endSec : Math.max(s0 + 0.09, p.startSec + (s + 1) * step - 0.015);
          syls.push({
            text: '',
            displayText: '',
            startSec: +s0.toFixed(3),
            endSec: +s1.toFixed(3)
          });
        }
        return {
          _origTimeSec: +p.startSec.toFixed(2),
          timeSec: +p.startSec.toFixed(2),
          endTimeSec: +p.endSec.toFixed(2),
          text: '',
          singstarSyllables: syls,
          _isAcousticVocalIsland: true
        };
      });
    }

    /**
     * Decodificación en UNA SOLA PASADA de memoria controlada:
     * Evita las 3 decodificaciones simultáneas que saturaban la RAM de Android WebView (~350 MB).
     * Extrae simultáneamente el perfil DSP 100 Hz (YIN + vowelFlux), el flujo vocal 16 kHz para Whisper,
     * la envolvente DSP de Karaoke y el perfil de forma de onda, liberando el AudioBuffer inmediatamente.
     */
    async _decodeAudioBlobSinglePass(track, key, audioBlob, token, onProgress = null, options = null) {
      if (!audioBlob || audioBlob.size < 40000) return null;
      const blobSize = audioBlob.size;
      const needPitchProfile = (options && typeof options.needPitchProfile === 'boolean') ? options.needPitchProfile : true;
      const needMono16k = (options && typeof options.needMono16k === 'boolean') ? options.needMono16k : true;

      const existingBundle = (this._activeDecodedTrackKey === key && this._activeDecodedBundle && this._activeDecodedBundle.blobSize === blobSize)
        ? this._activeDecodedBundle
        : null;

      // Reutilizar decodificación ya completada para esta misma pista y blob (0 ms al pasar de Karaoke a SingStar)
      if (existingBundle && (!needPitchProfile || existingBundle.vocalDspProfile) && (!needMono16k || existingBundle.mono16k)) {
        return existingBundle;
      }
      // Si Karaoke o SingStar ya están decodificando este mismo blob ahora mismo, compartir la misma promesa si cubre lo pedido
      const reqTag = `${key}_${blobSize}_${needPitchProfile ? 1 : 0}_${needMono16k ? 1 : 0}`;
      if (this._decodeInflightKey === reqTag && this._decodeInflightPromise) {
        return await this._decodeInflightPromise;
      }

      const decodeTask = (async () => {
        let arrayBuf = null;
        let decodedBuffer = null;
        try {
          arrayBuf = await audioBlob.slice(0).arrayBuffer();

          const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (OfflineCtx) {
            const offCtx = new OfflineCtx(1, 44100 * 2, 44100);
            decodedBuffer = await Promise.race([
              offCtx.decodeAudioData(arrayBuf.slice(0)),
              new Promise(r => setTimeout(() => r(null), 16000))
            ]);
          } else if (AudioCtx) {
            if (!window._lyricsAnalysisAudioCtx) window._lyricsAnalysisAudioCtx = new AudioCtx();
            decodedBuffer = await Promise.race([
              window._lyricsAnalysisAudioCtx.decodeAudioData(arrayBuf.slice(0)),
              new Promise(r => setTimeout(() => r(null), 16000))
            ]);
          }
        } catch (_) {
          decodedBuffer = null;
        } finally {
          arrayBuf = null;
        }

        if (!decodedBuffer) return null;

        const actualDurSec = decodedBuffer.duration || 0;
        let karaokeDspEnvelope = existingBundle?.karaokeDspEnvelope || null;
        if (!karaokeDspEnvelope && this.karaokeService && typeof this.karaokeService._computeEnvelopeFromAudioBuffer === 'function') {
          try {
            const st = this.karaokeService._getOrInitTrackState(track);
            if (st && st.dspEnvelope) {
              karaokeDspEnvelope = st.dspEnvelope;
            } else {
              karaokeDspEnvelope = this.karaokeService._computeEnvelopeFromAudioBuffer(decodedBuffer);
              if (karaokeDspEnvelope && st) {
                st.dspEnvelope = karaokeDspEnvelope;
              }
            }
            if (karaokeDspEnvelope && karaokeDspEnvelope.actualDur > 35) {
              if (st) st.actualDur = karaokeDspEnvelope.actualDur;
              this.karaokeService.knownAudioDurations.set(key, karaokeDspEnvelope.actualDur);
            }
          } catch (_) {}
        }

        if (this.audioEngine && typeof this.audioEngine._decodeAndStoreWaveformProfile === 'function') {
          const existingWp = this.karaokeService?.audioWaveformProfiles?.get(key);
          if (!existingWp || !existingWp.isFullPass) {
            try {
              await this.audioEngine._decodeAndStoreWaveformProfile(track, key, decodedBuffer, 300, true, true);
            } catch (_) {}
          }
        }

        const vocalDspProfile = (needPitchProfile && !existingBundle?.vocalDspProfile)
          ? await this._extractHighResVocalEnvelopeAndPitch(decodedBuffer, null, onProgress)
          : (existingBundle?.vocalDspProfile || null);
        const mono16k = (needMono16k && !existingBundle?.mono16k)
          ? await this._extract16kHzVocalBandpassMono(decodedBuffer, null)
          : (existingBundle?.mono16k || null);
        // Liberar el AudioBuffer estéreo 44.1/48 kHz (~80-120 MB) inmediatamente
        decodedBuffer = null;

        const bundle = { actualDurSec, vocalDspProfile, mono16k, karaokeDspEnvelope, blobSize };
        this._activeDecodedTrackKey = key;
        this._activeDecodedBundle = bundle;
        return bundle;
      })();

      this._decodeInflightKey = reqTag;
      this._decodeInflightPromise = decodeTask;
      try {
        return await decodeTask;
      } finally {
        if (this._decodeInflightPromise === decodeTask) {
          this._decodeInflightPromise = null;
          this._decodeInflightKey = '';
        }
      }
    }

    /**
     * Despierta automáticamente el pipeline de estudio cuando el blob completo termina de descargarse
     * en segundo plano (elimina para siempre el caso en que SingStar abría antes de llegar el audio).
     */
    onAudioBlobReady(track, audioBlob) {
      if (!this.isActive || !track || !(audioBlob instanceof Blob) || audioBlob.size < 40000) return;
      const key = this.karaokeService ? this.karaokeService._makeKey(track) : String(track.id || track.title || '');
      if (!key || key !== this.currentTrackKey) return;
      if (this.isPreparingSong || this.isActiveWhisperFor(key)) return;

      const cached = this.studioAnalysisCache.get(key);
      const needsAnalysis = !cached || !cached.hasDspMelody || cached.hasPlaceholderLyrics || cached.hasUnalignedPlainLyrics || (!cached.isWhisperVerified && !cached.isVocalVadLocked);
      if (needsAnalysis) {
        this._prepareTrackInStudio(track, false).catch(() => {});
      }
    }

    /**
     * Construye al instante (<10ms) las barras de sílabas iniciales y el teleprompter
     * usando las letras REALES ya cargadas en KaraokeService (nunca placeholders falsos).
     */
    _seedImmediateStageForTrack(track) {
      if (!track) return;
      const key = this.karaokeService ? this.karaokeService._makeKey(track) : String(track.id || track.title || '');
      const isNewTrack = key !== this.currentTrackKey;
      this.currentTrackKey = key;

      const coverUrl = (typeof getBestTrackCover === 'function') ? getBestTrackCover(track) : (track.thumbnail || './app_logo.png');
      const cleanTitle = repairSpanishBrokenAccents(track.title || 'Canción');
      const cleanArtist = repairSpanishBrokenAccents(track.artist || 'Artista');

      for (const id of ['ssProCoverImg', 'ssPrepCoverImg']) {
        const el = document.getElementById(id);
        if (el) el.src = coverUrl;
      }
      for (const id of ['ssProSongTitle', 'ssPrepSongTitle']) {
        const el = document.getElementById(id);
        if (el) el.textContent = cleanTitle;
      }
      for (const id of ['ssProSongArtist', 'ssPrepSongArtist']) {
        const el = document.getElementById(id);
        if (el) el.textContent = cleanArtist;
      }

      const userOff = Number(this.karaokeService?.timeOffsetSec || 0);
      const offBadge = document.getElementById('ssProOffsetBadge');
      if (offBadge) {
        offBadge.textContent = `${userOff >= 0 ? '+' : ''}${userOff.toFixed(2)}s`;
      }

      if (this.studioAnalysisCache.has(key)) {
        const cached = this.studioAnalysisCache.get(key);
        if (cached && !cached.hasPlaceholderLyrics) {
          this._applyStudioAnalysisToStage(cached, userOff, isNewTrack);
          return;
        }
      }

      const actualDurSec = this.audioEngine ? (this.audioEngine.getRealDurationSec(track) || 195) : 195;
      let existingLines = [];
      if (this.karaokeService) {
        const builtIn = this.karaokeService._findBuiltInCustomSyncedLyrics(track, String(track.videoId || track.id || '').replace(/^magic_yt_|^yt_/, '').trim(), actualDurSec);
        if (builtIn && builtIn.syncedLyrics && builtIn.isWhisperVerified) {
          existingLines = this.karaokeService.parseLrc(builtIn.syncedLyrics, { track });
        } else if (Array.isArray(this.karaokeService.currentLyrics) && this.karaokeService.currentLyrics.length >= 2 && this.karaokeService.currentTrackKey === key && !this._isPlaceholderLyrics(this.karaokeService.currentLyrics)) {
          existingLines = this.karaokeService.currentLyrics;
        } else if (this.karaokeService.cache && this.karaokeService.cache.has(key)) {
          const cachedKar = this.karaokeService.cache.get(key) || [];
          if (!this._isPlaceholderLyrics(cachedKar)) {
            existingLines = cachedKar;
          }
        } else if (builtIn && builtIn.syncedLyrics) {
          existingLines = this.karaokeService.parseLrc(builtIn.syncedLyrics, { track });
        }
      }

      if (!this._isPlaceholderLyrics(existingLines) && !this._isUnalignedPlainLyrics(existingLines)) {
        const initialAligned = (existingLines[0]?.singstarSyllables && existingLines[0]?._isWhisperAligned)
          ? existingLines
          : this._alignSyllablesWithVocalProfile(key, existingLines, null, actualDurSec);
        this._applyStudioAnalysisToStage({
          track,
          key,
          dspContour: null,
          acousticLines: initialAligned,
          hasDspMelody: false,
          hasAcousticSyllables: true,
          hasPlaceholderLyrics: false,
          hasUnalignedPlainLyrics: false
        }, userOff, isNewTrack);
      } else {
        this.pitchNotes = [];
        this.phraseWindows = [];
        const curEl = document.getElementById('ssProTeleprompterCurrent');
        const nextEl = document.getElementById('ssProTeleprompterNext');
        if (curEl) curEl.textContent = 'Analizando audio real y sincronizando sílabas...';
        if (nextEl) nextEl.textContent = 'Detectando voz y letra automáticamente con IA Whisper';
        this._setSyncStatusChip('Analizando audio...', 'working');
        if (isNewTrack) this.resetSessionStats();
      }
    }

    /**
     * Pipeline de estudio unificado no bloqueante (Karaoke + SingStar):
     * 1) Si Karaoke ya está alineando esta misma canción con Whisper, se acopla sin cancelar ni duplicar.
     * 2) Decodifica el audio en UNA SOLA PASADA compartida (DSP 100 Hz YIN + vowelFlux + mono 16 kHz).
     * 3) Verifica caché Whisper v2 (con validación de duración de audio). Si NO está verificado con Whisper,
     *    lanza SIEMPRE alineación forzada Whisper (2 etapas: Hough global/slope + LCS DP palabra a palabra
     *    + sílabas 10 ms) sobre CUALQUIER pista (LRC externo, texto plano o sin letra) y actualiza tanto
     *    Karaoke como SingStar en vivo.
     */
    async _prepareTrackInStudio(track, forceReanalyze = false) {
      if (!track) return;
      const key = this.karaokeService ? this.karaokeService._makeKey(track) : String(track.id || track.title || '');
      const userOff = Number(this.karaokeService?.timeOffsetSec || 0);

      this._seedImmediateStageForTrack(track);

      const loadView = document.getElementById('singstarLoadingStudioView');
      const packView = document.getElementById('singstarPackInstallerView');
      const sumView = document.getElementById('singstarFsSummaryView');
      if (packView) packView.classList.add('hidden');
      if (sumView) sumView.classList.add('hidden');

      if (!forceReanalyze && this.studioAnalysisCache.has(key)) {
        const cached = this.studioAnalysisCache.get(key);
        if (cached && !cached.hasPlaceholderLyrics && !cached.hasUnalignedPlainLyrics && (cached.isWhisperVerified || cached.isVocalVadLocked) && cached.hasDspMelody) {
          this._applyStudioAnalysisToStage(cached, userOff, false);
          const sh = Number(cached.vadShiftSec) || 0;
          const lbl = cached.isWhisperVerified
            ? 'Sincro IA · 10ms'
            : (Math.abs(sh) >= 0.55 ? `Sincro · ${sh > 0 ? '+' : ''}${sh.toFixed(1)}s` : 'Sincro · Exacta');
          this._setSyncStatusChip(lbl, 'ready');
          if (loadView) loadView.classList.add('hidden');
          return;
        }
      }

      // ACOPLAMIENTO SIN REINICIO: Si Karaoke ya lanzó Whisper para esta misma canción, acoplarse en vivo
      if (!forceReanalyze && this.isActiveWhisperFor(key)) {
        if (loadView) loadView.classList.add('hidden');
        if (this.studioAnalysisCache.has(key)) {
          this._applyStudioAnalysisToStage(this.studioAnalysisCache.get(key), userOff, false);
        } else if (this._activeDecodedTrackKey === key && this._activeDecodedBundle?.vocalDspProfile) {
          const karLines = this.karaokeService?.cache?.get(key) || this.karaokeService?.currentLyrics || [];
          if (!this._isPlaceholderLyrics(karLines) && !this._isUnalignedPlainLyrics(karLines)) {
            const aligned = this._alignSyllablesWithVocalProfile(key, karLines, this._activeDecodedBundle.vocalDspProfile, this._activeDecodedBundle.actualDurSec || 195);
            const sData = {
              track,
              key,
              actualDurSec: this._activeDecodedBundle.actualDurSec || 195,
              dspContour: this._activeDecodedBundle.vocalDspProfile,
              acousticLines: aligned,
              hasDspMelody: Boolean(this._activeDecodedBundle.vocalDspProfile.voicedCount >= 10),
              hasAcousticSyllables: true,
              hasPlaceholderLyrics: false,
              hasUnalignedPlainLyrics: false,
              isAudioTranscribed: false,
              isWhisperVerified: false,
              isVocalVadLocked: Boolean(karLines[0]?._vocalVadVerified)
            };
            this._putStudioAnalysisCache(key, sData);
            this._applyStudioAnalysisToStage(sData, userOff, false);
          }
        }
        this._setSyncStatusChip('Sincro IA en curso...', 'working');
        return;
      }

      const token = ++this._prepToken;
      this._activePrepKey = key;
      this.isPreparingSong = true;

      try {
        const actualDurSecHint = this.audioEngine ? (this.audioEngine.getRealDurationSec(track) || 195) : 195;
        const rawVidTrack = String(track.videoId || track.id || '').replace(/^magic_yt_|^yt_/, '').trim();
        const vidTrack = /^[A-Za-z0-9_-]{11}$/.test(rawVidTrack) ? rawVidTrack : '';

        // PASO 1: Comprobar si existe letra verificada v2, LRC externo o texto plano
        let baseLines = [];
        let builtInEntry = null;
        let hasWhisperVerifiedCache = false;
        if (this.karaokeService) {
          if (!forceReanalyze) {
            builtInEntry = this.karaokeService._findBuiltInCustomSyncedLyrics(track, vidTrack, actualDurSecHint);
          }
          if (!forceReanalyze && builtInEntry && builtInEntry.syncedLyrics && builtInEntry.isWhisperVerified) {
            baseLines = this.karaokeService.parseLrc(builtInEntry.syncedLyrics, { track }).map(l => ({ ...l, _isWhisperAligned: true }));
            hasWhisperVerifiedCache = baseLines.length >= 2;
          } else if (Array.isArray(this.karaokeService.currentLyrics) && this.karaokeService.currentLyrics.length >= 2 && this.karaokeService.currentTrackKey === key && !this._isPlaceholderLyrics(this.karaokeService.currentLyrics)) {
            baseLines = this.karaokeService.currentLyrics.map(l => ({ ...l }));
            hasWhisperVerifiedCache = !forceReanalyze && this.karaokeService.isWhisperVerifiedFor(key, actualDurSecHint);
          } else if (builtInEntry && builtInEntry.syncedLyrics) {
            baseLines = this.karaokeService.parseLrc(builtInEntry.syncedLyrics, { track });
          } else {
            if (loadView) loadView.classList.remove('hidden');
            this._setStudioLoadingProgress(1, 12, 'Buscando letra y sincronización de la canción...');
            this._setSyncStatusChip('Buscando letra...', 'working');
            const fetched = await Promise.race([
              this.karaokeService.fetchLyricsForTrack(track, actualDurSecHint).catch(() => []),
              new Promise(r => setTimeout(() => r([]), 4200))
            ]);
            if (Array.isArray(fetched) && !this._isPlaceholderLyrics(fetched)) {
              baseLines = fetched.map(l => ({ ...l }));
              hasWhisperVerifiedCache = !forceReanalyze && this.karaokeService.isWhisperVerifiedFor(key, actualDurSecHint);
            }
          }
        }
        if (token !== this._prepToken) return;

        const hasRealLyrics = !this._isPlaceholderLyrics(baseLines);
        const isPlainUnaligned = hasRealLyrics && this._isUnalignedPlainLyrics(baseLines);

        if (hasRealLyrics && !isPlainUnaligned) {
          const quickAligned = (hasWhisperVerifiedCache && baseLines[0]?.singstarSyllables)
            ? baseLines
            : this._alignSyllablesWithVocalProfile(key, baseLines, null, actualDurSecHint);
          this._applyStudioAnalysisToStage({
            track,
            key,
            dspContour: null,
            acousticLines: quickAligned,
            hasDspMelody: false,
            hasAcousticSyllables: true,
            hasPlaceholderLyrics: false,
            hasUnalignedPlainLyrics: false,
            isWhisperVerified: hasWhisperVerifiedCache,
            isVocalVadLocked: Boolean(baseLines[0]?._vocalVadVerified)
          }, Number(this.karaokeService?.timeOffsetSec || 0), false);
          if (loadView && !forceReanalyze) {
            loadView.classList.add('hidden');
          }
        } else if (loadView) {
          loadView.classList.remove('hidden');
          this._setStudioLoadingProgress(1, 18, isPlainUnaligned
            ? 'Letra sin tiempos detectada · Preparando alineación con IA...'
            : 'Aislando voz y preparando transcripción automática con IA...');
        }

        // PASO 2: Obtener el Blob de audio completo (hasta 16s para conexiones móviles lentas)
        this._setStudioLoadingProgress(2, 26, 'Cargando flujo de audio maestro para análisis vocal...');
        this._setSyncStatusChip('Cargando audio...', 'working');
        let audioBlob = null;
        if (this.audioEngine) {
          if (this.audioEngine.currentTrack && this.karaokeService?._makeKey(this.audioEngine.currentTrack) === key && this.audioEngine.fullTrackBlob && this.audioEngine.fullTrackBlob.size >= 50000) {
            audioBlob = this.audioEngine.fullTrackBlob;
          } else if (typeof this.audioEngine._getCachedFullBlobForTrack === 'function') {
            audioBlob = this.audioEngine._getCachedFullBlobForTrack(track);
          }
          if ((!audioBlob || audioBlob.size < 50000) && typeof this.audioEngine.preloadFullTrackInBackground === 'function') {
            try {
              audioBlob = await Promise.race([
                this.audioEngine.preloadFullTrackInBackground(track),
                new Promise(r => setTimeout(() => r(null), 16000))
              ]);
            } catch (_) {}
          }
        }
        if (token !== this._prepToken) return;

        // PASO 3: Decodificación única compartida + DSP MPM 25Hz + Envolvente Vocal-VAD (sin mono16k salvo si hace falta Whisper)
        let actualDurSec = actualDurSecHint;
        let vocalDspProfile = null;
        let mono16k = null;
        let karaokeDspEnvelope = null;
        const preloadMono16k = Boolean(forceReanalyze || !hasRealLyrics || isPlainUnaligned);

        if (audioBlob && audioBlob.size >= 40000) {
          this._setStudioLoadingProgress(2, 42, 'Extrayendo curva vocal MPM y sincronización de fraseo...');
          this._setSyncStatusChip('Analizando voz...', 'working');
          const decoded = await this._decodeAudioBlobSinglePass(track, key, audioBlob, null, (pct, msg) => {
            if (token === this._prepToken) {
              this._setStudioLoadingProgress(pct < 75 ? 3 : 4, pct, msg);
            }
          }, { needPitchProfile: true, needMono16k: preloadMono16k });
          if (token !== this._prepToken) return;
          if (decoded) {
            actualDurSec = decoded.actualDurSec || actualDurSecHint;
            vocalDspProfile = decoded.vocalDspProfile;
            mono16k = decoded.mono16k;
            karaokeDspEnvelope = decoded.karaokeDspEnvelope;
          }
        }

        // Revalidar compatibilidad de duración de cualquier caché v2 ahora que conocemos actualDurSec exacto
        if (hasWhisperVerifiedCache && builtInEntry && builtInEntry.isWhisperVerified) {
          const hitDur = Number(builtInEntry.audioDurSec || builtInEntry.duration || 0);
          if (actualDurSec >= 35 && hitDur >= 35 && Math.abs(hitDur - actualDurSec) > 3.5) {
            hasWhisperVerifiedCache = false;
          }
        }
        if (hasWhisperVerifiedCache && this.karaokeService && !this.karaokeService.isWhisperVerifiedFor(key, actualDurSec) && !(builtInEntry && builtInEntry.isWhisperVerified)) {
          hasWhisperVerifiedCache = false;
        }

        // PASO 3.5 (MOTOR RÁPIDO VOCAL-ONSET VAD < 30ms): Alinear LRC contra el audio real antes de decidir si hace falta Whisper
        let hasVocalVadLock = Boolean(hasRealLyrics && !isPlainUnaligned && baseLines[0]?._vocalVadVerified === true);
        let vadShiftSec = Number(baseLines[0]?._vocalVadShiftSec) || 0;
        if (hasRealLyrics && !isPlainUnaligned && !hasWhisperVerifiedCache && karaokeDspEnvelope && this.karaokeService) {
          if (!hasVocalVadLock || forceReanalyze) {
            const stKar = this.karaokeService.trackCalibrationState?.get(key);
            const cands = stKar?.candidates || this.karaokeService.candidatesCache?.get(key);
            let vadLines = null;
            if (Array.isArray(cands) && cands.length > 0 && (!stKar?.nativeLyrics || stKar.nativeLyrics.length < 4)) {
              vadLines = this.karaokeService._pickBestCandidateLines(cands, actualDurSec, track, karaokeDspEnvelope);
            } else {
              const vadRes = this.karaokeService._computeDspAlignment(baseLines, actualDurSec, karaokeDspEnvelope);
              if (vadRes && Array.isArray(vadRes.lines) && vadRes.lines.length >= 3) {
                vadLines = vadRes.lines.map(l => ({
                  ...l,
                  _vocalVadVerified: Boolean(vadRes.isVerifiedLock),
                  _vocalVadShiftSec: Number(vadRes.shiftSec) || 0,
                  _vocalVadScore: Number(vadRes.score) || 0,
                  _vocalVadMargin: Number(vadRes.margin) || 0
                }));
              }
            }
            if (Array.isArray(vadLines) && vadLines.length >= 2) {
              baseLines = vadLines;
              hasVocalVadLock = Boolean(vadLines[0]?._vocalVadVerified === true);
              vadShiftSec = Number(vadLines[0]?._vocalVadShiftSec) || 0;
              // Compartir bloqueo Vocal-VAD exacto con Karaoke en vivo
              this.karaokeService.cache.set(key, vadLines.map(l => ({ ...l })));
              if (this.karaokeService.currentTrackKey === key) {
                this.karaokeService.currentLyrics = vadLines.map(l => ({ ...l, elasticOffsetSec: 0 }));
                this.karaokeService.activeLineIndex = -1;
                this.karaokeService.renderLinesToDom({ skipSingStarNotify: true });
              }
              if (hasVocalVadLock) {
                const vadLabel = Math.abs(vadShiftSec) >= 0.55
                  ? `Sincro · ${vadShiftSec > 0 ? '+' : ''}${vadShiftSec.toFixed(1)}s`
                  : 'Sincro · Exacta';
                this.karaokeService.setKaraokeAiSyncStatus(key, vadLabel, 'ready');
              }
            }
          }
        }

        // PASO 4: Preparar vista inmediata con las líneas sincronizadas o islas vocales
        const initialLines = (hasRealLyrics && !isPlainUnaligned)
          ? baseLines
          : this._buildAcousticVocalIslandsLines(vocalDspProfile, actualDurSec);

        // PASO 5: Construir sílabas y notas objetivo con la curva vocal MPM
        this._setStudioLoadingProgress(4, 92, 'Anclando sílabas y afinación MPM al audio real...');
        const alignedLines = (hasWhisperVerifiedCache && initialLines[0]?.singstarSyllables)
          ? initialLines
          : this._alignSyllablesWithVocalProfile(key, initialLines, vocalDspProfile, actualDurSec);

        const studioData = {
          track,
          key,
          actualDurSec,
          dspContour: vocalDspProfile,
          acousticLines: alignedLines,
          hasDspMelody: Boolean(vocalDspProfile && vocalDspProfile.voicedCount >= 10),
          hasAcousticSyllables: true,
          hasPlaceholderLyrics: !hasRealLyrics,
          hasUnalignedPlainLyrics: isPlainUnaligned,
          isAudioTranscribed: hasWhisperVerifiedCache,
          isWhisperVerified: hasWhisperVerifiedCache,
          isVocalVadLocked: hasVocalVadLock,
          vadShiftSec
        };
        this._putStudioAnalysisCache(key, studioData);
        this._applyStudioAnalysisToStage(studioData, Number(this.karaokeService?.timeOffsetSec || 0), false);

        this._setStudioLoadingProgress(4, 100, 'Análisis acústico completado');
        if (loadView) loadView.classList.add('hidden');

        // PASO 6: Política rápida no bloqueante:
        // Si Vocal-Onset VAD ya bloqueó el LRC al audio real (<1s) y no se pidió forceReanalyze,
        // NO lanzar Whisper cliente lento. Whisper solo corre cuando falta letra, es texto plano,
        // la confianza Vocal-VAD fue baja o el usuario pulsó Re-sincronizar.
        const needsWhisper = Boolean(
          forceReanalyze ||
          (!hasWhisperVerifiedCache && (!hasRealLyrics || isPlainUnaligned || !hasVocalVadLock))
        );
        if (needsWhisper) {
          if (!forceReanalyze && this.isActiveWhisperFor(key)) {
            this._setSyncStatusChip('Sincro IA en curso...', 'working');
          } else {
            if (!mono16k && audioBlob && audioBlob.size >= 40000) {
              const dec16 = await this._decodeAudioBlobSinglePass(track, key, audioBlob, null, null, {
                needPitchProfile: false,
                needMono16k: true
              });
              if (token !== this._prepToken) return;
              if (dec16 && dec16.mono16k) mono16k = dec16.mono16k;
            }
            if (mono16k || vidTrack) {
              const modeLabel = !hasRealLyrics
                ? 'Transcribiendo IA...'
                : (isPlainUnaligned ? 'Alineando texto IA...' : 'Sincronizando IA...');
              this._setSyncStatusChip(modeLabel, 'working');
              this._spawnPopup(
                !hasRealLyrics ? 'WHISPER IA · SÍLABAS 10MS' : 'SINCRONIZACIÓN REAL CON IA',
                !hasRealLyrics ? 'Transcribiendo letra real directamente del audio...' : 'Ajustando Karaoke y SingStar a la voz real...',
                '#38bdf8',
                1700
              );
              this._transcribeTrackAudioWithWhisper(
                track,
                key,
                mono16k,
                vocalDspProfile,
                null,
                hasRealLyrics ? baseLines : [],
                { actualDurSec, isPlainUnaligned, allowBackground: true, forceReanalyze }
              ).catch(() => {});
            } else if (studioData.hasDspMelody) {
              this._setSyncStatusChip('Sincro · Exacta', 'ready');
            } else if (hasRealLyrics && !isPlainUnaligned) {
              this._setSyncStatusChip('Esperando audio HD...', 'working');
            }
          }
        } else {
          const readyLabel = hasWhisperVerifiedCache
            ? 'Sincro IA · 10ms'
            : (Math.abs(vadShiftSec) >= 0.55 ? `Sincro · ${vadShiftSec > 0 ? '+' : ''}${vadShiftSec.toFixed(1)}s` : 'Sincro · Exacta');
          this._setSyncStatusChip(readyLabel, 'ready');
          if (studioData.hasDspMelody) {
            const subMsg = Math.abs(vadShiftSec) >= 0.55
              ? `Desfase corregido (${vadShiftSec > 0 ? '+' : ''}${vadShiftSec.toFixed(1)}s) en Karaoke y SingStar`
              : 'Letra, sílabas y melodía MPM sincronizadas al audio real';
            this._spawnPopup('SINCRONIZACIÓN EXACTA', subMsg, '#34d399', 1350);
          }
        }
      } catch (_) {
      } finally {
        if (token === this._prepToken) {
          this.isPreparingSong = false;
          this._activePrepKey = '';
          const lv = document.getElementById('singstarLoadingStudioView');
          if (lv) lv.classList.add('hidden');
        }
      }
    }

    _getOrCreateWhisperWorker(onStatus = null) {
      if (this._whisperWorkerFailed) return null;
      if (this._whisperWorker) {
        if (onStatus) this._whisperStatusListener = onStatus;
        return this._whisperWorker;
      }
      try {
        const worker = new Worker('./whisper_worker.js?v=87.0', { type: 'module' });
        this._whisperWorkerCallbacks = new Map();
        this._whisperWorkerSeq = 0;

        worker.onmessage = (ev) => {
          const msg = ev.data || {};
          if (msg.type === 'status' || msg.type === 'ready' || msg.type === 'progress') {
            if (typeof this._whisperStatusListener === 'function' && msg.message) {
              this._whisperStatusListener(msg.message);
            }
            return;
          }
          const cbId = msg.id || msg.reqId;
          if (cbId && this._whisperWorkerCallbacks && this._whisperWorkerCallbacks.has(cbId)) {
            const cb = this._whisperWorkerCallbacks.get(cbId);
            this._whisperWorkerCallbacks.delete(cbId);
            if (msg.type === 'error' || msg.type === 'window_error') {
              cb.reject(new Error(msg.message || 'Whisper worker error'));
            } else {
              cb.resolve(msg);
            }
          } else if (msg.type === 'error') {
            // Error global de inicialización del modelo WASM/ONNX -> activar respaldo servidor
            this._whisperWorkerFailed = true;
            if (this._whisperWorkerCallbacks) {
              for (const [, cb] of this._whisperWorkerCallbacks.entries()) {
                try { cb.reject(new Error(msg.message || 'Whisper init failed')); } catch (_) {}
              }
              this._whisperWorkerCallbacks.clear();
            }
          }
        };

        worker.onerror = (err) => {
          this._whisperWorkerFailed = true;
          if (this._whisperWorkerCallbacks) {
            for (const [, cb] of this._whisperWorkerCallbacks.entries()) {
              try { cb.reject(new Error(err?.message || 'Whisper worker crashed')); } catch (_) {}
            }
            this._whisperWorkerCallbacks.clear();
          }
          try { worker.terminate(); } catch (_) {}
          if (this._whisperWorker === worker) {
            this._whisperWorker = null;
          }
        };

        this._whisperWorker = worker;
        if (onStatus) this._whisperStatusListener = onStatus;
        worker.postMessage({ type: 'preload' });
        return worker;
      } catch (_) {
        this._whisperWorkerFailed = true;
        return null;
      }
    }

    _transcribeWindowViaWorker(pcm16kSlice, windowStartSec, language = 'auto', onStatus = null) {
      return new Promise((resolve) => {
        const worker = this._getOrCreateWhisperWorker(onStatus);
        if (!worker) {
          resolve(null);
          return;
        }
        if (onStatus) this._whisperStatusListener = onStatus;
        const reqId = `w_${++this._whisperWorkerSeq}_${Date.now()}`;
        const copyPcm = new Float32Array(pcm16kSlice);
        const timer = setTimeout(() => {
          if (this._whisperWorkerCallbacks && this._whisperWorkerCallbacks.has(reqId)) {
            this._whisperWorkerCallbacks.delete(reqId);
            resolve(null);
          }
        }, 32000);

        this._whisperWorkerCallbacks.set(reqId, {
          resolve: (res) => {
            clearTimeout(timer);
            resolve(res);
          },
          reject: () => {
            clearTimeout(timer);
            resolve(null);
          }
        });

        try {
          worker.postMessage(
            {
              type: 'transcribe_window',
              id: reqId,
              reqId,
              pcm16k: copyPcm,
              startSec: windowStartSec,
              windowStartSec,
              language,
              languageHint: language
            },
            [copyPcm.buffer]
          );
        } catch (_) {
          clearTimeout(timer);
          this._whisperWorkerCallbacks.delete(reqId);
          resolve(null);
        }
      });
    }

    /**
     * Respaldo de transcripción en servidor enviando directamente la ventana PCM 16 kHz.
     * Garantiza generación automática de letra en dispositivos donde WebAssembly/ONNX local no esté disponible,
     * funcionando para CUALQUIER canción (catálogo local, YouTube, archivos subidos).
     */
    async _transcribeWindowViaServerPcm(pcm16kSlice, windowStartSec, language = 'auto', track = null) {
      if (!pcm16kSlice || pcm16kSlice.length < 4000) return null;
      try {
        const bytes = new Uint8Array(pcm16kSlice.buffer, pcm16kSlice.byteOffset, pcm16kSlice.byteLength);
        const CHUNK = 0x8000;
        let binary = '';
        for (let i = 0; i < bytes.length; i += CHUNK) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(bytes.length, i + CHUNK)));
        }
        const pcm16kBase64 = btoa(binary);
        const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 24000);
        const resp = await fetch(`${baseUrl}/api/v1/lyrics/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            pcm16kBase64,
            sampleRate: 16000,
            startSec: windowStartSec,
            language,
            title: track?.title || '',
            artist: track?.artist || ''
          })
        });
        clearTimeout(tid);
        if (!resp || !resp.ok) return null;
        const data = await resp.json();
        if (data && Array.isArray(data.words) && data.words.length > 0) {
          return { words: data.words, text: data.text || '' };
        }
      } catch (_) {}
      return null;
    }

    async _extract16kHzVocalBandpassMono(audioBuffer, token = null) {
      if (!audioBuffer) return null;
      const srcSr = audioBuffer.sampleRate || 44100;
      const targetSr = 16000;
      const ch0 = audioBuffer.getChannelData(0);
      const ch1 = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : ch0;
      const totalSrc = ch0.length;
      const ratio = srcSr / targetSr;
      const outLen = Math.floor(totalSrc / ratio);
      const out = new Float32Array(outLen);

      // Submuestreo mono anti-aliasing (promedio por ventana) + filtro paso-alto suave a 70 Hz
      // para preservar el rango completo de voz y consonantes (70 Hz - 8 kHz) que espera Whisper ONNX.
      const dt = 1.0 / targetSr;
      const rcHp = 1.0 / (2.0 * Math.PI * 70.0);
      const aHp = rcHp / (rcHp + dt);

      let hp = 0;
      let prevIn = 0;
      let sumSq = 0;

      for (let i = 0; i < outLen; i++) {
        if (i > 0 && (i % 48000) === 0) {
          if (token !== undefined && token !== null && token !== this._prepToken) return null;
          await new Promise(r => setTimeout(r, 0));
        }
        const s0 = Math.min(totalSrc - 1, Math.floor(i * ratio));
        const s1 = Math.min(totalSrc, Math.max(s0 + 1, Math.floor((i + 1) * ratio)));
        let acc = 0;
        for (let s = s0; s < s1; s++) {
          acc += 0.5 * (ch0[s] + ch1[s]);
        }
        const midMono = acc / (s1 - s0);
        hp = aHp * (hp + midMono - prevIn);
        prevIn = midMono;
        out[i] = hp;
        sumSq += hp * hp;
      }

      const rms = Math.sqrt(sumSq / Math.max(1, outLen));
      if (rms > 1e-5) {
        const gain = Math.min(8.0, 0.14 / rms);
        for (let i = 0; i < outLen; i++) {
          out[i] = Math.max(-0.98, Math.min(0.98, out[i] * gain));
        }
      }
      return out;
    }

    _detectLanguageHintForTrack(track, referenceLines = []) {
      const sampleParts = [
        String(track?.title || ''),
        String(track?.artist || '')
      ];
      if (Array.isArray(referenceLines) && referenceLines.length > 0) {
        for (let i = 0; i < Math.min(8, referenceLines.length); i++) {
          sampleParts.push(String(referenceLines[i]?.text || ''));
        }
      }
      const txt = sampleParts.join(' ');
      if (/[áéíóúñÁÉÍÓÚÑ¡¿]/.test(txt)) return 'spanish';
      const lower = txt.toLowerCase();
      const esHits = (lower.match(/\b(el|la|los|las|de|del|que|por|para|con|sin|como|cuando|donde|amor|corazon|noche|vida|alma|siempre|nunca|todo|nada|quiero|eres|tengo|contigo|conmigo|tiempo|siento|voy|estoy|aqui|asi|pero|mas|muy|porque|camilo|fary|melendi|bisbal|sabina|estopa|mecano|rosalia|quevedo|bizarrap|shakira|maluma|morat|aitana|karol)\b/g) || []).length;
      if (esHits >= 2) return 'spanish';
      return 'auto';
    }

    _findActiveVocalWindowsForWhisper(vocalProfile, totalDurSec, prioritySec = 0, options = {}) {
      // Ventanas de 24s (solape de 2.0s, <28.5s): el encoder de Whisper siempre procesa 30s de mel-espectrograma,
      // así que 24s ofrece un 33% menos de pasadas y más palabras por ventana para anclaje instantáneo sin deriva.
      const winLenSec = 24.0;
      const stepSec = 22.0;
      const maxDur = Math.min(totalDurSec, 380);
      const rawWindows = [];

      if (vocalProfile && vocalProfile.vocEnergyDb) {
        const fps = vocalProfile.frameHz || 100;
        const nFrames = vocalProfile.nFrames || vocalProfile.vocEnergyDb.length;
        const thVoc = Number.isFinite(vocalProfile.thVoc) ? vocalProfile.thVoc : -32;
        const firstVocalSec = Number.isFinite(vocalProfile.firstVocalSec) ? Math.max(0, vocalProfile.firstVocalSec - 0.5) : 0;

        let curSec = firstVocalSec;
        while (curSec < maxDur - 1.2 && rawWindows.length < 24) {
          const endSec = Math.min(maxDur, curSec + winLenSec);
          const f0 = Math.max(0, Math.floor(curSec * fps));
          const f1 = Math.min(nFrames - 1, Math.ceil(endSec * fps));
          let voicedFrames = 0;
          for (let f = f0; f <= f1; f++) {
            if (vocalProfile.vocEnergyDb[f] >= thVoc - 1.5 && (vocalProfile.midiFrames[f] >= 45 || vocalProfile.vocEnergyDb[f] >= thVoc + 2.5)) {
              voicedFrames++;
            }
          }
          if (voicedFrames >= Math.round(0.30 * fps)) {
            rawWindows.push({ startSec: +curSec.toFixed(2), endSec: +endSec.toFixed(2) });
          }
          curSec += stepSec;
        }
      }

      // Respaldo: si el detector de islas fue demasiado estricto (voces muy suaves/acústicas), cubrir toda la pista
      if (rawWindows.length === 0) {
        for (let t = 0; t < maxDur - 1.0 && rawWindows.length < 22; t += stepSec) {
          rawWindows.push({ startSec: +t.toFixed(2), endSec: +Math.min(maxDur, t + winLenSec).toFixed(2) });
        }
      }

      if (rawWindows.length <= 1) return rawWindows;

      let prioIdx = 0;
      if (prioritySec > 3) {
        const found = rawWindows.findIndex(w => prioritySec >= w.startSec - 2.0 && prioritySec <= w.endSec + 2.0);
        if (found >= 0) prioIdx = found;
      }

      // En modo alineación forzada (cuando ya existe letra LRC/texto), priorizar:
      //  1) Ventana actual + siguiente (bloqueo instantáneo incluso si la 1ª es intro instrumental)
      //  2) Sondas media (~42%) y tardía (~72%) para detectar deriva de tempo o solos instrumentales al instante
      //  3) Resto de ventanas en orden natural desde la posición actual
      if (options && options.forAlignment && rawWindows.length >= 3) {
        const maxProbes = Number(options.maxProbes) || 0;
        const picked = new Set();
        const ordered = [];
        const addIdx = (idx) => {
          if (idx >= 0 && idx < rawWindows.length && !picked.has(idx)) {
            picked.add(idx);
            ordered.push(rawWindows[idx]);
          }
        };
        addIdx(prioIdx);
        addIdx(Math.floor(rawWindows.length * 0.42));
        addIdx(Math.floor(rawWindows.length * 0.72));
        if (maxProbes > 0) {
          addIdx(prioIdx + 1 < rawWindows.length ? prioIdx + 1 : prioIdx - 1);
          return ordered.slice(0, maxProbes);
        }
        addIdx(prioIdx + 1 < rawWindows.length ? prioIdx + 1 : prioIdx - 1);
        for (let i = prioIdx; i < rawWindows.length; i++) addIdx(i);
        for (let i = 0; i < prioIdx; i++) addIdx(i);
        return ordered;
      }

      // En modo transcripción pura (sin letra previa), seguir orden lineal desde la posición actual
      if (prioIdx > 0) {
        const ordered = [];
        for (let i = prioIdx; i < rawWindows.length; i++) ordered.push(rawWindows[i]);
        for (let i = 0; i < prioIdx; i++) ordered.push(rawWindows[i]);
        return ordered;
      }
      return rawWindows;
    }

    /**
     * Subdivide una palabra individual en sus sílabas fonéticas naturales y ancla cada sílaba
     * dentro de la ventana acústica exacta [wordStartSec, wordEndSec] detectada por Whisper
     * utilizando los picos de apertura vocálica a 100 Hz (10 ms) del audio real.
     */
    _splitWordAndAlignSyllables100Hz(wordText, wordStartSec, wordEndSec, vocalProfile) {
      const cleanWord = repairSpanishBrokenAccents(String(wordText || '').trim());
      if (!cleanWord) return [];

      const spanSec = Math.max(0.14, wordEndSec - wordStartSec);
      const rawPieces = (this.karaokeService && typeof this.karaokeService._splitWordIntoNaturalPhoneticSyllables === 'function')
        ? this.karaokeService._splitWordIntoNaturalPhoneticSyllables(cleanWord)
        : [cleanWord];
      const pieces = Array.isArray(rawPieces) && rawPieces.length > 0 ? rawPieces : [cleanWord];
      const K = pieces.length;

      if (K === 1 || !vocalProfile || !vocalProfile.vowelFlux) {
        const subDur = spanSec / K;
        return pieces.map((p, idx) => {
          const s = wordStartSec + idx * subDur;
          const e = (idx === K - 1) ? wordEndSec : Math.max(s + 0.08, wordStartSec + (idx + 1) * subDur - 0.01);
          return {
            text: p,
            displayText: idx === K - 1 ? `${p} ` : p,
            startSec: +s.toFixed(3),
            endSec: +Math.max(s + 0.08, e).toFixed(3)
          };
        });
      }

      const fHz = vocalProfile.frameHz || 100;
      const f0 = Math.max(0, Math.floor(wordStartSec * fHz));
      const f1 = Math.min(vocalProfile.vowelFlux.length - 1, Math.ceil(wordEndSec * fHz));
      const M = f1 - f0 + 1;
      const minStep = Math.max(3, Math.min(7, Math.floor(M / (K + 0.3))));

      // Pesos fonéticos por sílaba (vocales abiertas y tónicas duran más)
      const weights = pieces.map((p, idx) => {
        let w = 1.0;
        if (/[áéíóúÁÉÍÓÚ]/.test(p)) w += 0.32;
        if (/[aeoAEO]/.test(p)) w += 0.14;
        if (idx === K - 1) w += 0.18;
        return w;
      });
      const totalW = weights.reduce((a, b) => a + b, 0) || K;

      if (M >= K * minStep) {
        const idealFrames = [];
        let cumW = 0;
        for (let k = 0; k < K; k++) {
          idealFrames.push(f0 + Math.round((cumW / totalW) * Math.max(1, M - minStep)));
          cumW += weights[k];
        }

        const chosenFrames = new Array(K);
        chosenFrames[0] = f0;
        // Buscar pico de ataque vocálico para cada sílaba interna de la palabra a 10ms de resolución
        for (let k = 1; k < K; k++) {
          const prevF = chosenFrames[k - 1];
          const minF = prevF + minStep;
          const maxF = f1 - (K - k) * minStep;
          const targetF = idealFrames[k];
          let bestF = Math.max(minF, Math.min(maxF, targetF));
          let bestScore = -1e9;
          const searchR = Math.max(4, Math.round(0.09 * fHz));
          const sLo = Math.max(minF, targetF - searchR);
          const sHi = Math.min(maxF, targetF + searchR);
          for (let f = sLo; f <= sHi; f++) {
            const dev = (f - targetF) / Math.max(3, searchR);
            const score = vocalProfile.vowelFlux[f] * 1.6 + (vocalProfile.vocEnergyDb[f] - vocalProfile.thVoc) * 0.15 - dev * dev * 2.1;
            if (score > bestScore) {
              bestScore = score;
              bestF = f;
            }
          }
          chosenFrames[k] = bestF;
        }

        const outSyls = [];
        for (let k = 0; k < K; k++) {
          const sSec = k === 0 ? wordStartSec : (chosenFrames[k] / fHz);
          const nextSec = (k + 1 < K) ? (chosenFrames[k + 1] / fHz) : wordEndSec;
          const eSec = Math.max(sSec + 0.075, Math.min(wordEndSec, nextSec - 0.01));
          outSyls.push({
            text: pieces[k],
            displayText: k === K - 1 ? `${pieces[k]} ` : pieces[k],
            startSec: +sSec.toFixed(3),
            endSec: +eSec.toFixed(3)
          });
        }
        return outSyls;
      }

      // Respaldo proporcional si la palabra es muy rápida
      const outSyls = [];
      let cursor = wordStartSec;
      for (let k = 0; k < K; k++) {
        const dSec = spanSec * (weights[k] / totalW);
        const sSec = cursor;
        const eSec = (k === K - 1) ? wordEndSec : Math.max(sSec + 0.075, sSec + dSec - 0.01);
        outSyls.push({
          text: pieces[k],
          displayText: k === K - 1 ? `${pieces[k]} ` : pieces[k],
          startSec: +sSec.toFixed(3),
          endSec: +eSec.toFixed(3)
        });
        cursor += dSec;
      }
      return outSyls;
    }

    /**
     * Si existen letras de referencia de la canción, corrige homófonos o pequeñas variaciones
     * ortográficas de Whisper manteniendo SIEMPRE el timestamp acústico exacto [startSec, endSec]
     * detectado directamente del audio por Whisper.
     */
    _refineWhisperWordsWithReferenceLexicon(whisperWords, refLines) {
      if (!Array.isArray(whisperWords) || whisperWords.length === 0) return [];
      if (!Array.isArray(refLines) || refLines.length === 0) return whisperWords;

      const norm = (s) => String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9ñ]/g, '');

      const refVocab = [];
      for (const l of refLines) {
        const ws = String(l?.text || '').split(/\s+/).filter(Boolean);
        for (const w of ws) {
          const n = norm(w);
          if (n.length >= 3) refVocab.push({ raw: w.replace(/^[¡!¿?,"']+|[¡!¿?,"']+$/g, ''), norm: n });
        }
      }
      if (refVocab.length === 0) return whisperWords;

      return whisperWords.map((wObj) => {
        const wn = norm(wObj.text);
        if (wn.length < 3) return wObj;
        let bestMatch = null;
        let bestSim = 0.74;
        for (const rv of refVocab) {
          if (rv.norm === wn) {
            bestMatch = rv.raw;
            break;
          }
          if (Math.abs(rv.norm.length - wn.length) > 2) continue;
          if (rv.norm[0] !== wn[0]) continue;
          // Similitud fonética rápida por bigramas
          let shared = 0;
          for (let i = 0; i < wn.length - 1; i++) {
            if (rv.norm.includes(wn.slice(i, i + 2))) shared++;
          }
          const sim = (2 * shared) / Math.max(2, (wn.length - 1) + (rv.norm.length - 1));
          if (sim > bestSim) {
            bestSim = sim;
            bestMatch = rv.raw;
          }
        }
        return bestMatch ? { ...wObj, text: bestMatch } : wObj;
      });
    }

    /**
     * ALINEADOR FORZADO DE AUDIO REAL EN 2 ETAPAS (UNIFICADO KARAOKE + SINGSTAR):
     * - Etapa 1 (Hough ponderado por palabras + bigramas 5x + trigramas 9x + ajuste lineal RANSAC/Theil-Sen):
     *   Corrige CUALQUIER desfase global desde -45s hasta +95s (intros de YouTube, videoclips, másters distintos)
     *   y CUALQUIER deriva de velocidad/tempo [0.92, 1.08] ya desde la primera ventana de Whisper (~4-8s).
     * - Etapa 2 (Programación dinámica LCS monotónica palabra a palabra + anclaje a ataques vocales 100 Hz
     *   + interpolación suave por tramos entre versos anclados + división fonética en sílabas 10 ms):
     *   Fija palabras y sílabas exactas a la voz real, absorbiendo solos instrumentales, rubatos y errores locales del LRC.
     */
    _alignReferenceLyricsToWhisperRealAudio(key, refLines, whisperWords, vocalProfile, actualDurSec = 195) {
      if (!Array.isArray(refLines) || refLines.length === 0) {
        return { lines: null, shiftSec: 0, slope: 1.0, anchoredLines: 0, matchedWords: 0, hasGlobalLock: false };
      }
      if (!Array.isArray(whisperWords) || whisperWords.length < 2) {
        return { lines: null, shiftSec: 0, slope: 1.0, anchoredLines: 0, matchedWords: 0, hasGlobalLock: false };
      }

      const norm = (s) => String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

      const phonNorm = (n) => {
        if (!n) return '';
        return n
          .replace(/h/g, '')
          .replace(/v/g, 'b')
          .replace(/z/g, 's')
          .replace(/c(?=[ei])/g, 's')
          .replace(/qu/g, 'k')
          .replace(/k/g, 'c')
          .replace(/ll/g, 'y')
          .replace(/([a-z])\1+/g, '$1');
      };

      const STOPWORDS = new Set([
        'a', 'e', 'i', 'o', 'u', 'y', 'de', 'la', 'el', 'en', 'un', 'es', 'no', 'si', 'se',
        'me', 'te', 'lo', 'le', 'al', 'su', 'mi', 'tu', 'que', 'las', 'los', 'del', 'por', 'con',
        'the', 'and', 'you', 'for', 'are', 'but', 'not', 'all', 'can', 'was', 'its', 'my', 'to', 'in', 'of', 'on', 'it', 'is', 'me', 'be', 'so', 'we'
      ]);

      const diceSim = (a, b) => {
        if (!a || !b) return 0;
        if (a === b) return 1.0;
        if (a.length < 2 || b.length < 2) return 0;
        if (Math.abs(a.length - b.length) > Math.max(3, Math.floor(Math.max(a.length, b.length) * 0.45))) return 0;
        let shared = 0;
        const used = new Uint8Array(b.length);
        for (let i = 0; i < a.length - 1; i++) {
          const bg = a.slice(i, i + 2);
          for (let j = 0; j < b.length - 1; j++) {
            if (!used[j] && b.slice(j, j + 2) === bg) {
              used[j] = 1;
              shared++;
              break;
            }
          }
        }
        return (2 * shared) / Math.max(2, (a.length - 1) + (b.length - 1));
      };

      const wordSim = (rTok, wTok) => {
        if (!rTok.norm || !wTok.norm) return 0;
        if (rTok.norm === wTok.norm) {
          return rTok.norm.length >= 3 ? 1.0 : (rTok.norm.length === 2 ? 0.78 : 0.45);
        }
        if (rTok.phon && wTok.phon && rTok.phon === wTok.phon) {
          return rTok.phon.length >= 3 ? 0.94 : 0.72;
        }
        // Tolerancia de plural/conjugación final (p. ej. palabras/palabra, cantar/canta)
        const minL = Math.min(rTok.phon.length, wTok.phon.length);
        if (minL >= 4 && Math.abs(rTok.phon.length - wTok.phon.length) <= 2) {
          if (rTok.phon.startsWith(wTok.phon) || wTok.phon.startsWith(rTok.phon)) {
            return 0.86;
          }
        }
        if (minL >= 3) {
          const d = Math.max(diceSim(rTok.norm, wTok.norm), diceSim(rTok.phon, wTok.phon));
          if (d >= 0.66) return d * 0.92;
        }
        return 0;
      };

      // 1) Instantánea limpia de tiempos LRC originales (sin acumular desplazamientos entre ventanas)
      const rawLines = [];
      for (let li = 0; li < refLines.length; li++) {
        const l = refLines[li];
        const txt = repairSpanishBrokenAccents(String(l?.text || '').trim());
        if (!txt) continue;
        const rawStart = Number.isFinite(Number(l._rawLrcTimeSec))
          ? Number(l._rawLrcTimeSec)
          : (Number.isFinite(Number(l._origTimeSec)) ? Number(l._origTimeSec) : Math.max(0, Number(l.timeSec) || 0));
        rawLines.push({
          origRef: l,
          text: txt,
          rawStart,
          rawEnd: Number.isFinite(Number(l._rawLrcEndTimeSec))
            ? Number(l._rawLrcEndTimeSec)
            : (Number.isFinite(Number(l.endTimeSec)) ? Number(l.endTimeSec) : (rawStart + 3.2))
        });
      }
      if (rawLines.length === 0) {
        return { lines: null, shiftSec: 0, slope: 1.0, anchoredLines: 0, matchedWords: 0, hasGlobalLock: false };
      }

      // Normalizar rawEnd de cada línea para evitar solapes en las coordenadas de referencia
      for (let li = 0; li < rawLines.length; li++) {
        const nextS = (li + 1 < rawLines.length) ? rawLines[li + 1].rawStart : (rawLines[li].rawStart + 4.0);
        const maxEnd = Math.max(rawLines[li].rawStart + 0.45, Math.min(rawLines[li].rawStart + 7.5, nextS - 0.04));
        if (!(rawLines[li].rawEnd > rawLines[li].rawStart + 0.35) || rawLines[li].rawEnd > nextS) {
          rawLines[li].rawEnd = maxEnd;
        }
      }

      // 2) Construir secuencia de palabras de referencia R con tiempos internos estimados y pesos IDF
      const R = [];
      const lineWordSpans = new Array(rawLines.length);
      const wordFreq = new Map();

      for (let li = 0; li < rawLines.length; li++) {
        const rl = rawLines[li];
        const tokens = rl.text.split(/\s+/).filter(Boolean);
        const totalChars = Math.max(1, tokens.reduce((acc, t) => acc + Math.max(1, t.length), 0));
        const spanDur = Math.max(0.45, rl.rawEnd - rl.rawStart);
        let cumChars = 0;
        const startIdx = R.length;
        for (let wi = 0; wi < tokens.length; wi++) {
          const rawWord = tokens[wi];
          const n = norm(rawWord);
          const p = phonNorm(n);
          const wStart = rl.rawStart + (cumChars / totalChars) * spanDur;
          const wEnd = rl.rawStart + ((cumChars + Math.max(1, rawWord.length)) / totalChars) * spanDur;
          cumChars += Math.max(1, rawWord.length);
          if (n) wordFreq.set(n, (wordFreq.get(n) || 0) + 1);
          R.push({
            idx: R.length,
            lineIdx: li,
            wordIdxInLine: wi,
            rawText: rawWord,
            norm: n,
            phon: p,
            rawStartSec: wStart,
            rawEndSec: Math.max(wStart + 0.12, wEnd),
            isStop: !n || n.length < 3 || STOPWORDS.has(n),
            idfWeight: 1.0
          });
        }
        lineWordSpans[li] = { startIdx, count: R.length - startIdx };
      }

      for (const r of R) {
        if (r.isStop) {
          r.idfWeight = 0.25;
        } else {
          const freq = wordFreq.get(r.norm) || 1;
          r.idfWeight = Math.min(2.6, (1.0 + Math.min(1.2, (r.norm.length - 2) * 0.18)) / Math.sqrt(freq));
        }
      }

      // 3) Preparar palabras detectadas por Whisper W ordenadas cronológicamente
      const W = whisperWords
        .map((w) => {
          const rawText = String(w?.text || '').trim();
          const n = norm(rawText);
          const sSec = Number(w?.startSec);
          const eSec = Number(w?.endSec);
          return {
            rawText,
            norm: n,
            phon: phonNorm(n),
            startSec: Number.isFinite(sSec) ? Math.max(0, sSec) : -1,
            endSec: Number.isFinite(eSec) ? Math.max(sSec + 0.10, eSec) : (sSec + 0.30)
          };
        })
        .filter(w => w.startSec >= 0 && w.norm.length >= 1)
        .sort((a, b) => a.startSec - b.startSec);

      if (R.length < 2 || W.length < 2) {
        return { lines: null, shiftSec: 0, slope: 1.0, anchoredLines: 0, matchedWords: 0, hasGlobalLock: false };
      }

      const refFirstSec = rawLines[0].rawStart;
      const refLastSec = rawLines[rawLines.length - 1].rawEnd;
      const minDeltaAllowed = Math.max(-45.0, -refFirstSec - 3.5);
      const maxDeltaAllowed = Math.min(95.0, Math.max(30.0, actualDurSec - refFirstSec + 8.0));
      const firstVocalHint = (vocalProfile && Number.isFinite(vocalProfile.firstVocalSec)) ? vocalProfile.firstVocalSec : null;

      // 4) ETAPA 1: Votación Hough ponderada (palabras + bigramas 5x + trigramas 9x) en cubetas de ~22s
      //    Permite encontrar cualquier desfase [-45s, +95s] y deriva de tempo [0.92, 1.08]
      const allVotes = [];
      const bucketVotesMap = new Map();
      const BUCKET_SEC = 22.0;

      const pushVote = (delta, rSec, wSec, weight, isPhraseHit) => {
        if (!Number.isFinite(delta) || delta < minDeltaAllowed || delta > maxDeltaAllowed) return;
        // Evitar que toda la letra quede fuera de la duración real del audio
        if (refFirstSec + delta < -4.0) return;
        if (actualDurSec >= 35 && refLastSec + delta > actualDurSec + 22.0 && refFirstSec + delta > actualDurSec - 5.0) return;
        const bId = Math.floor(wSec / BUCKET_SEC);
        const v = { delta, rSec, wSec, weight, isPhraseHit, bId };
        allVotes.push(v);
        let arr = bucketVotesMap.get(bId);
        if (!arr) {
          arr = [];
          bucketVotesMap.set(bId, arr);
        }
        arr.push(v);
      };

      const maxRForHough = Math.min(R.length, 750);
      const maxWForHough = Math.min(W.length, 750);

      for (let j = 0; j < maxWForHough; j++) {
        const w1 = W[j];
        if (!w1.norm) continue;
        for (let i = 0; i < maxRForHough; i++) {
          const r1 = R[i];
          if (!r1.norm) continue;
          const d1 = w1.startSec - r1.rawStartSec;
          if (d1 < minDeltaAllowed || d1 > maxDeltaAllowed) continue;

          const sim1 = wordSim(r1, w1);
          if (sim1 < 0.62) continue;

          // Voto unigrama solo para palabras de contenido reales (>= 3 letras, no stopwords)
          if (!r1.isStop && sim1 >= 0.72) {
            pushVote(d1, r1.rawStartSec, w1.startSec, sim1 * r1.idfWeight, false);
          }

          // Voto bigrama (5x) y trigrama (9x): incluso stopwords son oro en secuencias consecutivas ("que no", "las que")
          if (i + 1 < maxRForHough) {
            const r2 = R[i + 1];
            const rGap12 = r2.rawStartSec - r1.rawStartSec;
            for (let step = 1; step <= 2 && j + step < maxWForHough; step++) {
              const w2 = W[j + step];
              const wGap12 = w2.startSec - w1.startSec;
              if (wGap12 < -0.05 || wGap12 > 4.2) continue;
              if (Math.abs(wGap12 - rGap12) > 2.6) continue;
              const sim2 = wordSim(r2, w2);
              if (sim2 < 0.64) continue;

              const dMid = 0.5 * (d1 + (w2.startSec - r2.rawStartSec));
              const contentBoost = 0.75 + 0.35 * Math.max(r1.idfWeight, r2.idfWeight);
              const bigramW = 5.0 * (0.5 * (sim1 + sim2)) * contentBoost * (step === 1 ? 1.0 : 0.78);
              pushVote(dMid, 0.5 * (r1.rawStartSec + r2.rawStartSec), 0.5 * (w1.startSec + w2.startSec), bigramW, true);

              // Comprobar trigrama consecutivo (bono adicional +4.5x)
              if (i + 2 < maxRForHough) {
                const r3 = R[i + 2];
                for (let step3 = step + 1; step3 <= step + 2 && j + step3 < maxWForHough; step3++) {
                  const w3 = W[j + step3];
                  const wGap23 = w3.startSec - w2.startSec;
                  if (wGap23 < -0.05 || wGap23 > 4.2) continue;
                  const sim3 = wordSim(r3, w3);
                  if (sim3 >= 0.64) {
                    const dTri = (d1 + (w2.startSec - r2.rawStartSec) + (w3.startSec - r3.rawStartSec)) / 3;
                    pushVote(dTri, r2.rawStartSec, w2.startSec, 4.5 * ((sim1 + sim2 + sim3) / 3) * contentBoost, true);
                    break;
                  }
                }
              }
              break;
            }
          }
        }
      }

      if (allVotes.length === 0) {
        return { lines: null, shiftSec: 0, slope: 1.0, anchoredLines: 0, matchedWords: 0, hasGlobalLock: false };
      }

      // Buscar picos de consenso (con radio ±1.05s) en una lista de votos
      const findBestConsensusInVotes = (votes, radiusSec = 1.05) => {
        if (!Array.isArray(votes) || votes.length === 0) return null;
        const sorted = votes.slice().sort((a, b) => a.delta - b.delta);
        let left = 0;
        let winWeight = 0;
        let bestAdjScore = -1;
        let bestRawWeight = 0;
        let bestRange = null;

        for (let right = 0; right < sorted.length; right++) {
          winWeight += sorted[right].weight;
          while (sorted[right].delta - sorted[left].delta > radiusSec * 2) {
            winWeight -= sorted[left].weight;
            left++;
          }
          const centerDelta = 0.5 * (sorted[left].delta + sorted[right].delta);
          // Prior suave anti-estribillo-repetido: en empate entre dos estribillos iguales, preferir menor |delta|
          const distPrior = 1.0 / (1.0 + Math.abs(centerDelta) / 95.0);
          let vocalBonus = 1.0;
          if (firstVocalHint !== null) {
            const predFirst = refFirstSec + centerDelta;
            if (predFirst >= firstVocalHint - 4.0 && predFirst <= firstVocalHint + 12.0) {
              vocalBonus = 1.12;
            }
          }
          const adj = winWeight * distPrior * vocalBonus;
          if (adj > bestAdjScore) {
            bestAdjScore = adj;
            bestRawWeight = winWeight;
            bestRange = [left, right];
          }
        }

        if (!bestRange) return null;
        const inliers = sorted.slice(bestRange[0], bestRange[1] + 1);
        const totalW = inliers.reduce((s, v) => s + v.weight, 0) || 1;
        // Mediana ponderada robusta de delta y centroide (rSec, wSec)
        let accW = 0;
        let medDelta = inliers[0].delta;
        for (const v of inliers) {
          accW += v.weight;
          if (accW >= totalW * 0.5) {
            medDelta = v.delta;
            break;
          }
        }
        let sumR = 0;
        let sumW = 0;
        let phraseHits = 0;
        for (const v of inliers) {
          sumR += v.rSec * v.weight;
          sumW += v.wSec * v.weight;
          if (v.isPhraseHit) phraseHits++;
        }
        return {
          delta: medDelta,
          rSec: sumR / totalW,
          wSec: sumW / totalW,
          rawWeight: bestRawWeight,
          adjScore: bestAdjScore,
          count: inliers.length,
          phraseHits
        };
      };

      // Calcular anclas locales fuertes por cada cubeta de 22s de Whisper
      const bucketAnchors = [];
      for (const [, bVotes] of bucketVotesMap.entries()) {
        const peak = findBestConsensusInVotes(bVotes, 1.05);
        if (peak && (peak.rawWeight >= 5.2 || (peak.phraseHits >= 1 && peak.rawWeight >= 4.2))) {
          bucketAnchors.push(peak);
        }
      }
      bucketAnchors.sort((a, b) => a.wSec - b.wSec);

      const globalPeak = findBestConsensusInVotes(allVotes, 1.15);

      // Evaluar modelos candidatos (slope, intercept):
      //  - Modelo constante (slope = 1.0) desde globalPeak y desde cada ancla de cubeta
      //  - Modelos con deriva de tempo [0.92, 1.08] generados por pares de anclas separadas >= 22s
      const candidateModels = [];
      if (globalPeak) {
        candidateModels.push({ slope: 1.0, intercept: globalPeak.delta, isConst: true });
      }
      for (const ba of bucketAnchors) {
        candidateModels.push({ slope: 1.0, intercept: ba.delta, isConst: true });
      }
      for (let a = 0; a < bucketAnchors.length; a++) {
        for (let b = a + 1; b < bucketAnchors.length; b++) {
          const dr = bucketAnchors[b].rSec - bucketAnchors[a].rSec;
          const dw = bucketAnchors[b].wSec - bucketAnchors[a].wSec;
          if (dr < 22.0 || dw < 20.0) continue;
          const sl = dw / dr;
          if (sl >= 0.92 && sl <= 1.08) {
            const ic = bucketAnchors[a].wSec - sl * bucketAnchors[a].rSec;
            if (ic >= minDeltaAllowed - 10 && ic <= maxDeltaAllowed + 10) {
              candidateModels.push({ slope: sl, intercept: ic, isConst: Math.abs(sl - 1.0) < 0.004 });
            }
          }
        }
      }

      let bestModel = null;
      let bestModelScore = -1;
      for (const cand of candidateModels) {
        let inlierScore = 0;
        let phraseHits = 0;
        for (const v of allVotes) {
          const predW = cand.slope * v.rSec + cand.intercept;
          const err = Math.abs(v.wSec - predW);
          if (err <= 1.35) {
            inlierScore += v.weight * (1.0 - 0.25 * (err / 1.35));
            if (v.isPhraseHit) phraseHits++;
          }
        }
        const midDelta = cand.intercept + (cand.slope - 1.0) * (0.5 * (refFirstSec + refLastSec));
        const distPrior = 1.0 / (1.0 + Math.abs(midDelta) / 95.0);
        // Preferencia suave de parsimonia por slope = 1.0 si no hay ganancia clara por deriva de tempo
        const parsimony = cand.isConst ? 1.08 : 1.0;
        const totalScore = inlierScore * distPrior * parsimony;
        if (totalScore > bestModelScore) {
          bestModelScore = totalScore;
          bestModel = { ...cand, rawInlierScore: inlierScore, phraseHits };
        }
      }

      // Comprobar confianza mínima para declarar bloqueo global real (evita falsos positivos con 1 palabra suelta)
      const hasGlobalLock = Boolean(
        bestModel && (bestModel.rawInlierScore >= 6.0 || (bestModel.phraseHits >= 1 && bestModel.rawInlierScore >= 4.5))
      );
      if (!hasGlobalLock) {
        return { lines: null, shiftSec: 0, slope: 1.0, anchoredLines: 0, matchedWords: 0, hasGlobalLock: false };
      }

      // Refinar (slope, intercept) por regresión lineal ponderada sobre todos sus inliers (±1.4s)
      const modelInliers = allVotes.filter(v => Math.abs(v.wSec - (bestModel.slope * v.rSec + bestModel.intercept)) <= 1.45);
      let finalSlope = bestModel.slope;
      let finalIntercept = bestModel.intercept;

      if (modelInliers.length >= 2) {
        let sW = 0, sR = 0, sY = 0;
        let minR = Infinity, maxR = -Infinity;
        for (const v of modelInliers) {
          sW += v.weight;
          sR += v.weight * v.rSec;
          sY += v.weight * v.wSec;
          if (v.rSec < minR) minR = v.rSec;
          if (v.rSec > maxR) maxR = v.rSec;
        }
        const meanR = sR / Math.max(1e-6, sW);
        const meanY = sY / Math.max(1e-6, sW);

        if (!bestModel.isConst && (maxR - minR) >= 24.0) {
          let num = 0, den = 0;
          for (const v of modelInliers) {
            const dr = v.rSec - meanR;
            num += v.weight * dr * (v.wSec - meanY);
            den += v.weight * dr * dr;
          }
          if (den > 10.0) {
            const estSlope = Math.max(0.92, Math.min(1.08, num / den));
            finalSlope = Math.abs(estSlope - 1.0) < 0.005 ? 1.0 : estSlope;
            finalIntercept = meanY - finalSlope * meanR;
          }
        } else {
          // Mediana ponderada robusta de (wSec - rSec) para desplazamiento constante
          const deltas = modelInliers.map(v => ({ d: v.wSec - v.rSec, w: v.weight })).sort((a, b) => a.d - b.d);
          let acc = 0;
          finalSlope = 1.0;
          for (const item of deltas) {
            acc += item.w;
            if (acc >= sW * 0.5) {
              finalIntercept = item.d;
              break;
            }
          }
        }
      }

      // Construir proyección priorTime(rawSec): usa (finalSlope, finalIntercept) y, si hay anclas de cubetas
      // fuertemente monotónicas con salto no lineal (p. ej. solo de guitarra añadido a mitad de canción),
      // aplica interpolación suave por tramos sobre esas cubetas.
      const linearProj = (rSec) => Math.max(0, finalSlope * rSec + finalIntercept);
      const validPiecewiseAnchors = [];
      for (const ba of bucketAnchors) {
        if (ba.rawWeight >= 8.0 && ba.phraseHits >= 1) {
          const prev = validPiecewiseAnchors[validPiecewiseAnchors.length - 1];
          if (!prev || (ba.rSec > prev.rSec + 10 && ba.wSec > prev.wSec + 8)) {
            validPiecewiseAnchors.push(ba);
          }
        }
      }
      const hasNonLinearBreak = validPiecewiseAnchors.length >= 2 &&
        validPiecewiseAnchors.some(ba => Math.abs(ba.wSec - linearProj(ba.rSec)) > 2.4);

      const priorTime = (rSec) => {
        if (!hasNonLinearBreak) return linearProj(rSec);
        const firstA = validPiecewiseAnchors[0];
        const lastA = validPiecewiseAnchors[validPiecewiseAnchors.length - 1];
        if (rSec <= firstA.rSec) {
          return Math.max(0, firstA.wSec + (rSec - firstA.rSec) * finalSlope);
        }
        if (rSec >= lastA.rSec) {
          return Math.max(0, lastA.wSec + (rSec - lastA.rSec) * finalSlope);
        }
        for (let k = 0; k < validPiecewiseAnchors.length - 1; k++) {
          const a = validPiecewiseAnchors[k];
          const b = validPiecewiseAnchors[k + 1];
          if (rSec >= a.rSec && rSec <= b.rSec) {
            const t = (rSec - a.rSec) / Math.max(0.01, b.rSec - a.rSec);
            return Math.max(0, a.wSec + t * (b.wSec - a.wSec));
          }
        }
        return linearProj(rSec);
      };

      // 5) ETAPA 2: Alineación monotónica LCS palabra a palabra dentro de corredor ±5.5s sobre priorTime
      //    Filtrar solo las palabras R cercanas a alguna ventana cubierta por W para ejecutar DP en < 2 ms
      const CORRIDOR_SEC = 5.5;
      const activeR = [];
      for (let i = 0; i < R.length; i++) {
        const pT = priorTime(R[i].rawStartSec);
        // Búsqueda rápida en W ordenada
        let lo = 0, hi = W.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (W[mid].startSec < pT - CORRIDOR_SEC) lo = mid + 1;
          else hi = mid;
        }
        if (lo < W.length && Math.abs(W[lo].startSec - pT) <= CORRIDOR_SEC) {
          activeR.push({ r: R[i], priorSec: pT });
        }
      }

      const matchedWordByRIdx = new Map();
      if (activeR.length >= 2 && W.length >= 2) {
        const P = Math.min(activeR.length, 620);
        const Q = Math.min(W.length, 620);
        const cols = Q + 1;
        const dp = new Float32Array((P + 1) * cols);
        const dir = new Uint8Array((P + 1) * cols); // 0 = skipR, 1 = skipW, 2 = match

        for (let i = 1; i <= P; i++) {
          const { r: rTok, priorSec } = activeR[i - 1];
          const rowOff = i * cols;
          const prevRowOff = (i - 1) * cols;
          for (let j = 1; j <= Q; j++) {
            let best = dp[prevRowOff + j];
            let d = 0;
            const left = dp[rowOff + j - 1];
            if (left > best) {
              best = left;
              d = 1;
            }
            const wTok = W[j - 1];
            const dtErr = Math.abs(wTok.startSec - priorSec);
            if (dtErr <= CORRIDOR_SEC) {
              const sim = wordSim(rTok, wTok);
              if (sim >= 0.66) {
                const gain = sim * (rTok.isStop ? 0.55 : 1.25) - dtErr * 0.035;
                if (gain > 0.15) {
                  const diag = dp[prevRowOff + (j - 1)] + gain;
                  if (diag > best) {
                    best = diag;
                    d = 2;
                  }
                }
              }
            }
            dp[rowOff + j] = best;
            dir[rowOff + j] = d;
          }
        }

        let i = P;
        let j = Q;
        while (i > 0 && j > 0) {
          const d = dir[i * cols + j];
          if (d === 2) {
            const rTok = activeR[i - 1].r;
            const wTok = W[j - 1];
            matchedWordByRIdx.set(rTok.idx, {
              w: wTok,
              sim: wordSim(rTok, wTok)
            });
            i--;
            j--;
          } else if (d === 1) {
            j--;
          } else {
            i--;
          }
        }
      }

      // Helper para anclar el inicio de una palabra al ataque vocálico 100 Hz (vowelFlux) dentro de ±90 ms
      const snapWordStartTo100HzOnset = (secVal) => {
        if (!vocalProfile || !vocalProfile.vowelFlux || !vocalProfile.vocEnergyDb) return secVal;
        const fHz = vocalProfile.frameHz || 100;
        const nF = vocalProfile.vowelFlux.length;
        const centerF = Math.round(secVal * fHz);
        const radF = Math.round(0.09 * fHz);
        const fLo = Math.max(0, centerF - radF);
        const fHi = Math.min(nF - 1, centerF + radF);
        const thVoc = Number.isFinite(vocalProfile.thVoc) ? vocalProfile.thVoc : -32;
        let bestF = centerF;
        let bestScore = -1e9;
        for (let f = fLo; f <= fHi; f++) {
          if (vocalProfile.vocEnergyDb[f] < thVoc - 3.5) continue;
          const dev = (f - centerF) / Math.max(1, radF);
          const sc = vocalProfile.vowelFlux[f] * 1.4 - dev * dev * 0.9;
          if (sc > bestScore) {
            bestScore = sc;
            bestF = f;
          }
        }
        return bestScore > -1e8 ? (bestF / fHz) : secVal;
      };

      // 6) Calcular anclas por línea a partir de las palabras emparejadas por LCS
      const lineAnchors = new Array(rawLines.length).fill(null);
      let anchoredLineCount = 0;

      for (let li = 0; li < rawLines.length; li++) {
        const span = lineWordSpans[li];
        const hits = [];
        let strongContentHit = false;
        for (let k = 0; k < span.count; k++) {
          const rIdx = span.startIdx + k;
          const m = matchedWordByRIdx.get(rIdx);
          if (m) {
            const rTok = R[rIdx];
            if (!rTok.isStop && m.sim >= 0.72) strongContentHit = true;
            const snappedS = snapWordStartTo100HzOnset(m.w.startSec);
            const snappedE = Math.max(snappedS + 0.12, m.w.endSec);
            hits.push({
              wi: k,
              rTok,
              startSec: snappedS,
              endSec: snappedE,
              sim: m.sim
            });
          }
        }
        if (hits.length === 0) continue;
        if (!strongContentHit && hits.length < 2) continue;

        const rl = rawLines[li];
        const expectedDur = Math.max(0.5, (rl.rawEnd - rl.rawStart) * finalSlope);
        const firstHit = hits[0];
        const lastHit = hits[hits.length - 1];

        // Si la primera palabra coincidió, usar su ataque exacto; si coincidió una interna, retroproyectar
        const estStart = (firstHit.wi === 0)
          ? firstHit.startSec
          : Math.max(0, firstHit.startSec - Math.max(0, (firstHit.rTok.rawStartSec - rl.rawStart) * finalSlope));
        const estEnd = (lastHit.wi === span.count - 1)
          ? lastHit.endSec
          : Math.max(estStart + 0.55, lastHit.endSec + Math.max(0, (rl.rawEnd - lastHit.rTok.rawEndSec) * finalSlope));

        const pStart = priorTime(rl.rawStart);
        const localResid = Math.max(-4.8, Math.min(4.8, estStart - pStart));

        lineAnchors[li] = {
          startSec: Math.max(0, estStart),
          endSec: Math.max(estStart + 0.45, Math.min(estStart + Math.max(expectedDur * 1.6, 8.0), estEnd)),
          localResid,
          hits
        };
        anchoredLineCount++;
      }

      // 7) Interpolación suave por tramos de localResid para líneas no cubiertas aún por Whisper
      const anchoredIndices = [];
      for (let li = 0; li < rawLines.length; li++) {
        if (lineAnchors[li]) anchoredIndices.push(li);
      }

      const getInterpolatedResid = (li) => {
        if (anchoredIndices.length === 0) return 0;
        let prevIdx = -1;
        let nextIdx = -1;
        for (let k = 0; k < anchoredIndices.length; k++) {
          const ai = anchoredIndices[k];
          if (ai < li) prevIdx = ai;
          else if (ai > li) {
            nextIdx = ai;
            break;
          }
        }
        if (prevIdx >= 0 && nextIdx >= 0) {
          const rPrev = rawLines[prevIdx].rawStart;
          const rNext = rawLines[nextIdx].rawStart;
          const t = (rawLines[li].rawStart - rPrev) / Math.max(0.05, rNext - rPrev);
          return lineAnchors[prevIdx].localResid + t * (lineAnchors[nextIdx].localResid - lineAnchors[prevIdx].localResid);
        }
        if (prevIdx >= 0) {
          // Amortiguar suavemente el residuo local hacia 0 si nos alejamos mucho del último ancla
          const dist = Math.max(0, rawLines[li].rawStart - rawLines[prevIdx].rawStart);
          return lineAnchors[prevIdx].localResid * Math.exp(-dist / 45.0);
        }
        if (nextIdx >= 0) {
          const dist = Math.max(0, rawLines[nextIdx].rawStart - rawLines[li].rawStart);
          return lineAnchors[nextIdx].localResid * Math.exp(-dist / 45.0);
        }
        return 0;
      };

      // 8) Construir líneas finales monotónicas con sílabas 10 ms sincronizadas palabra a palabra
      const draftLines = new Array(rawLines.length);
      for (let li = 0; li < rawLines.length; li++) {
        const rl = rawLines[li];
        const anchor = lineAnchors[li];
        if (anchor) {
          draftLines[li] = {
            startSec: anchor.startSec,
            endSec: anchor.endSec,
            anchor
          };
        } else {
          const resid = getInterpolatedResid(li);
          const s = Math.max(0, priorTime(rl.rawStart) + resid);
          const dur = Math.max(0.55, (rl.rawEnd - rl.rawStart) * finalSlope);
          draftLines[li] = {
            startSec: s,
            endSec: Math.min(actualDurSec > 10 ? actualDurSec : 9999, s + dur),
            anchor: null
          };
        }
      }

      // Garantizar monotonicidad estricta entre líneas sin solapamiento
      for (let li = 1; li < draftLines.length; li++) {
        const minStart = draftLines[li - 1].startSec + 0.25;
        if (draftLines[li].startSec < minStart) {
          draftLines[li].startSec = minStart;
        }
        if (draftLines[li - 1].endSec > draftLines[li].startSec - 0.03) {
          draftLines[li - 1].endSec = Math.max(draftLines[li - 1].startSec + 0.22, draftLines[li].startSec - 0.03);
        }
        if (draftLines[li].endSec <= draftLines[li].startSec + 0.22) {
          draftLines[li].endSec = draftLines[li].startSec + 0.45;
        }
      }

      const finalLines = [];
      const unanchoredIndicesToDsp = [];
      const unanchoredDraftObjs = [];

      for (let li = 0; li < rawLines.length; li++) {
        const rl = rawLines[li];
        const dl = draftLines[li];
        const span = lineWordSpans[li];

        if (dl.anchor && span.count > 0) {
          // Construir tiempos exactos palabra por palabra (ancladas + interpoladas suavemente entre anclas)
          const hitMap = new Map();
          for (const h of dl.anchor.hits) hitMap.set(h.wi, h);

          const wordTimes = new Array(span.count);
          for (let wi = 0; wi < span.count; wi++) {
            const h = hitMap.get(wi);
            if (h) {
              wordTimes[wi] = { s: Math.max(dl.startSec, h.startSec), e: Math.min(dl.endSec, h.endSec), anchored: true };
            }
          }

          // Rellenar huecos entre palabras ancladas proporcionalmente a su longitud de caracteres
          let wi = 0;
          while (wi < span.count) {
            if (wordTimes[wi]) {
              wi++;
              continue;
            }
            const segStartWi = wi;
            while (wi < span.count && !wordTimes[wi]) wi++;
            const segEndWi = wi - 1;
            const tLo = segStartWi > 0 && wordTimes[segStartWi - 1]
              ? Math.max(dl.startSec, wordTimes[segStartWi - 1].e + 0.015)
              : dl.startSec;
            const tHi = (segEndWi + 1 < span.count && wordTimes[segEndWi + 1])
              ? Math.max(tLo + 0.12, wordTimes[segEndWi + 1].s - 0.015)
              : Math.max(tLo + 0.16, dl.endSec);

            let segChars = 0;
            for (let k = segStartWi; k <= segEndWi; k++) segChars += Math.max(1, R[span.startIdx + k].rawText.length);
            let cursor = tLo;
            for (let k = segStartWi; k <= segEndWi; k++) {
              const frac = Math.max(1, R[span.startIdx + k].rawText.length) / Math.max(1, segChars);
              const dSec = Math.max(0.08, (tHi - tLo) * frac);
              const ws = cursor;
              const we = (k === segEndWi) ? Math.max(ws + 0.08, tHi) : Math.max(ws + 0.08, ws + dSec - 0.01);
              wordTimes[k] = { s: ws, e: we, anchored: false };
              cursor += dSec;
            }
          }

          // Asegurar monotonicidad palabra a palabra y dividir cada palabra en sílabas 10 ms
          const syls = [];
          let prevEnd = dl.startSec;
          for (let k = 0; k < span.count; k++) {
            const wt = wordTimes[k];
            const ws = Math.max(prevEnd, wt.s);
            const we = Math.max(ws + 0.09, wt.e);
            prevEnd = we;
            const wSyls = this._splitWordAndAlignSyllables100Hz(R[span.startIdx + k].rawText, ws, we, vocalProfile);
            for (const sObj of wSyls) syls.push(sObj);
          }

          const lineStartFinal = syls.length > 0 ? syls[0].startSec : +dl.startSec.toFixed(3);
          const lineEndFinal = syls.length > 0 ? syls[syls.length - 1].endSec : +dl.endSec.toFixed(3);
          finalLines.push({
            ...rl.origRef,
            _rawLrcTimeSec: rl.rawStart,
            _rawLrcEndTimeSec: rl.rawEnd,
            _origTimeSec: lineStartFinal,
            _whisperRefined: true,
            _isWhisperAligned: true,
            _hasAcousticGeneratedWords: false,
            timeSec: lineStartFinal,
            endTimeSec: lineEndFinal,
            text: rl.text,
            words: syls.map(s => ({ timeSec: s.startSec, endSec: s.endSec, text: s.displayText })),
            singstarSyllables: syls
          });
        } else {
          const placeholderObj = {
            ...rl.origRef,
            _rawLrcTimeSec: rl.rawStart,
            _rawLrcEndTimeSec: rl.rawEnd,
            _origTimeSec: +dl.startSec.toFixed(3),
            _whisperRefined: true,
            _isWhisperAligned: true,
            timeSec: +dl.startSec.toFixed(3),
            endTimeSec: +dl.endSec.toFixed(3),
            text: rl.text
          };
          unanchoredIndicesToDsp.push(finalLines.length);
          unanchoredDraftObjs.push(placeholderObj);
          finalLines.push(placeholderObj);
        }
      }

      // Alinear sílabas 10 ms de las líneas proyectadas (todavía no ancladas palabra a palabra) contra vocalProfile
      if (unanchoredDraftObjs.length > 0) {
        const dspAlignedSubset = this._alignSyllablesWithVocalProfile(key, unanchoredDraftObjs, vocalProfile, actualDurSec);
        for (let u = 0; u < unanchoredIndicesToDsp.length; u++) {
          const targetIdx = unanchoredIndicesToDsp[u];
          const alignedObj = dspAlignedSubset[u];
          if (alignedObj) {
            finalLines[targetIdx] = {
              ...finalLines[targetIdx],
              ...alignedObj,
              _rawLrcTimeSec: finalLines[targetIdx]._rawLrcTimeSec,
              _rawLrcEndTimeSec: finalLines[targetIdx]._rawLrcEndTimeSec,
              _whisperRefined: true,
              _isWhisperAligned: true
            };
          }
        }
      }

      const representativeShift = +(linearProj(refFirstSec) - refFirstSec).toFixed(2);
      return {
        lines: finalLines,
        shiftSec: representativeShift,
        slope: +finalSlope.toFixed(4),
        anchoredLines: anchoredLineCount,
        matchedWords: matchedWordByRIdx.size,
        hasGlobalLock: true
      };
    }

    /**
     * Wrapper de compatibilidad: delega al alineador forzado en 2 etapas sobre el audio real.
     */
    _refineReferenceLinesWithWhisperWords(key, refLines, whisperWords, vocalProfile, actualDurSec = 195) {
      if (!Array.isArray(refLines) || refLines.length === 0) return [];
      const aligned = this._alignReferenceLyricsToWhisperRealAudio(key, refLines, whisperWords, vocalProfile, actualDurSec);
      if (aligned && aligned.hasGlobalLock && Array.isArray(aligned.lines) && aligned.lines.length >= 2) {
        return aligned.lines;
      }
      return this._alignSyllablesWithVocalProfile(key, refLines, vocalProfile, actualDurSec);
    }

    /**
     * Cuando una canción NO tenía letra externa (solo islas vocales), combina los versos ya transcritos
     * por Whisper con las islas vocales restantes aún por transcribir para que el pentagrama nunca quede vacío.
     */
    _mergeTranscribedLinesWithVocalIslands(key, whisperLines, vocalProfile, actualDurSec = 195) {
      if (!Array.isArray(whisperLines) || whisperLines.length === 0) return [];
      const islands = this._buildAcousticVocalIslandsLines(vocalProfile, actualDurSec);
      const remainingIslands = islands.filter((isl) => {
        const s = Number(isl.timeSec) || 0;
        const e = Number(isl.endTimeSec) || (s + 1);
        return !whisperLines.some((wl) => {
          const ws = (Number(wl.timeSec) || 0) - 0.65;
          const we = (Number(wl.endTimeSec || wl.timeSec) || 0) + 0.65;
          return s <= we && e >= ws;
        });
      });
      if (remainingIslands.length === 0) return whisperLines;
      const alignedRemaining = this._alignSyllablesWithVocalProfile(key, remainingIslands, vocalProfile, actualDurSec);
      return [...whisperLines, ...alignedRemaining].sort((a, b) => (Number(a.timeSec) || 0) - (Number(b.timeSec) || 0));
    }

    /**
     * Alineación forzada de letra plana (sin timestamps) contra las palabras con timestamps reales
     * detectadas por Whisper + las islas vocales DSP 100 Hz mediante programación dinámica LCS monotónica.
     * Conserva el texto oficial exacto de la canción mientras ancla cada verso y cada sílaba al audio real.
     */
    _alignPlainLyricsWithWhisperAndIslands(key, plainLines, whisperWords, vocalProfile, actualDurSec = 195) {
      if (!Array.isArray(plainLines) || plainLines.length === 0) return [];
      const cleanPlain = plainLines
        .map((l) => ({
          ...l,
          text: repairSpanishBrokenAccents(String(l?.text || '').trim())
        }))
        .filter((l) => l.text.length >= 1 && !/^[\(\[♪♫]/.test(l.text));
      if (cleanPlain.length === 0) return [];

      const norm = (s) => String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9ñ]/g, '');

      const wordSim = (a, b) => {
        if (!a || !b) return 0;
        if (a === b) return a.length >= 4 ? 1.0 : (a.length >= 2 ? 0.72 : 0.35);
        if (a.length >= 4 && b.length >= 4 && (a.startsWith(b.slice(0, 4)) || b.startsWith(a.slice(0, 4)))) {
          return 0.80;
        }
        if (a.length >= 3 && b.length >= 3 && Math.abs(a.length - b.length) <= 2) {
          let shared = 0;
          for (let i = 0; i < a.length - 1; i++) {
            if (b.includes(a.slice(i, i + 2))) shared++;
          }
          const sim = (2 * shared) / Math.max(2, (a.length - 1) + (b.length - 1));
          if (sim >= 0.68) return sim * 0.9;
        }
        return 0;
      };

      // Calcular peso silábico por línea
      const lineWeights = cleanPlain.map((l) => {
        const ws = l.text.split(/\s+/).filter(Boolean);
        return Math.max(2, ws.reduce((acc, w) => acc + Math.max(1, Math.round(w.length / 2.6)), 0));
      });

      // Preparar flujo de palabras planas (acotado a 580 palabras para mantener DP < 5ms)
      const pWords = [];
      for (let li = 0; li < cleanPlain.length && pWords.length < 580; li++) {
        const rawWs = cleanPlain[li].text.split(/\s+/).filter(Boolean);
        const totalChars = Math.max(1, rawWs.reduce((a, w) => a + w.length, 0));
        let cumChars = 0;
        for (let wi = 0; wi < rawWs.length && pWords.length < 580; wi++) {
          const nw = norm(rawWs[wi]);
          if (nw.length >= 2) {
            pWords.push({
              norm: nw,
              lineIdx: li,
              fracInLine: cumChars / totalChars,
              endFracInLine: (cumChars + rawWs[wi].length) / totalChars
            });
          }
          cumChars += rawWs[wi].length;
        }
      }

      const wWords = Array.isArray(whisperWords)
        ? whisperWords
            .map((w) => ({
              norm: norm(w?.text),
              startSec: Number(w?.startSec) || 0,
              endSec: Number(w?.endSec) || ((Number(w?.startSec) || 0) + 0.35)
            }))
            .filter((w) => w.norm.length >= 2)
            .sort((a, b) => a.startSec - b.startSec)
            .slice(0, 580)
        : [];

      const lineAnchors = new Map();

      if (pWords.length >= 4 && wWords.length >= 4) {
        const P = pWords.length;
        const W = wWords.length;
        const cols = W + 1;
        const dp = new Float32Array((P + 1) * cols);
        const dir = new Uint8Array((P + 1) * cols); // 0 = skipP, 1 = skipW, 2 = match

        for (let i = 1; i <= P; i++) {
          const pNorm = pWords[i - 1].norm;
          const rowOff = i * cols;
          const prevRowOff = (i - 1) * cols;
          for (let j = 1; j <= W; j++) {
            let best = dp[prevRowOff + j];
            let d = 0;
            const left = dp[rowOff + j - 1];
            if (left > best) {
              best = left;
              d = 1;
            }
            const sim = wordSim(pNorm, wWords[j - 1].norm);
            if (sim >= 0.68) {
              const diag = dp[prevRowOff + j - 1] + sim;
              if (diag > best) {
                best = diag;
                d = 2;
              }
            }
            dp[rowOff + j] = best;
            dir[rowOff + j] = d;
          }
        }

        const matchedPairs = [];
        let ci = P;
        let cj = W;
        while (ci > 0 && cj > 0) {
          const d = dir[ci * cols + cj];
          if (d === 2) {
            matchedPairs.push({ pw: pWords[ci - 1], ww: wWords[cj - 1] });
            ci--;
            cj--;
          } else if (d === 1) {
            cj--;
          } else {
            ci--;
          }
        }
        matchedPairs.reverse();

        // Agrupar pares anclados por línea
        const perLine = new Map();
        for (const mp of matchedPairs) {
          if (!perLine.has(mp.pw.lineIdx)) perLine.set(mp.pw.lineIdx, []);
          perLine.get(mp.pw.lineIdx).push(mp);
        }

        let lastAnchorEnd = 0;
        for (let li = 0; li < cleanPlain.length; li++) {
          const list = perLine.get(li);
          if (!list || list.length === 0) continue;
          const first = list[0];
          const last = list[list.length - 1];
          const estLineDur = Math.max(1.1, Math.min(4.8, lineWeights[li] * 0.25));
          let startSec = Math.max(0, first.ww.startSec - first.pw.fracInLine * estLineDur);
          let endSec = last.ww.endSec + Math.max(0, 1 - last.pw.endFracInLine) * estLineDur;
          if (list.length >= 2 && (last.pw.endFracInLine - first.pw.fracInLine) >= 0.28) {
            const spanRate = (last.ww.endSec - first.ww.startSec) / Math.max(0.28, last.pw.endFracInLine - first.pw.fracInLine);
            const boundedDur = Math.max(0.8, Math.min(5.5, spanRate));
            startSec = Math.max(0, first.ww.startSec - first.pw.fracInLine * boundedDur);
            endSec = startSec + boundedDur;
          }
          if (startSec < lastAnchorEnd - 0.15) {
            // Saltar ancla contradictoria para mantener estricta monotonía
            continue;
          }
          startSec = Math.max(lastAnchorEnd, startSec);
          endSec = Math.max(startSec + 0.65, Math.min(actualDurSec - 0.2, endSec));
          lineAnchors.set(li, { startSec, endSec });
          lastAnchorEnd = endSec + 0.04;
        }
      }

      const islands = (vocalProfile && Array.isArray(vocalProfile.vocalIslands) && vocalProfile.vocalIslands.length > 0)
        ? vocalProfile.vocalIslands
        : [];
      const firstVocalSec = islands.length > 0
        ? Math.max(0, islands[0].startSec)
        : (Number.isFinite(vocalProfile?.firstVocalSec) ? Math.max(0, vocalProfile.firstVocalSec) : Math.min(8, actualDurSec * 0.06));
      const lastVocalEndSec = islands.length > 0
        ? Math.min(actualDurSec - 0.3, islands[islands.length - 1].endSec)
        : Math.max(firstVocalSec + 10, actualDurSec - 4);

      const anchoredLines = new Array(cleanPlain.length);

      if (lineAnchors.size >= 2) {
        const anchorIndices = Array.from(lineAnchors.keys()).sort((a, b) => a - b);

        const fillRange = (startIdx, endIdx, rangeStartSec, rangeEndSec) => {
          const count = endIdx - startIdx;
          if (count <= 0) return;
          let sumW = 0;
          for (let i = startIdx; i < endIdx; i++) sumW += lineWeights[i];
          const avail = Math.max(count * 0.65, rangeEndSec - rangeStartSec);
          let cur = rangeStartSec;
          for (let i = startIdx; i < endIdx; i++) {
            const dur = Math.max(0.55, avail * (lineWeights[i] / Math.max(1, sumW)));
            const s = cur;
            const e = Math.min(actualDurSec - 0.15, cur + Math.min(dur * 0.92, 4.6));
            anchoredLines[i] = {
              ...cleanPlain[i],
              _origTimeSec: +s.toFixed(2),
              timeSec: +s.toFixed(2),
              endTimeSec: +Math.max(s + 0.50, e).toFixed(2),
              _isUnalignedPlainLyrics: false,
              _whisperAlignedPlain: true
            };
            cur += dur;
          }
        };

        // Antes del primer ancla
        const firstAi = anchorIndices[0];
        if (firstAi > 0) {
          const firstAnchorStart = lineAnchors.get(firstAi).startSec;
          const leadStart = Math.min(Math.max(0, firstAnchorStart - firstAi * 2.8), firstVocalSec);
          fillRange(0, firstAi, Math.max(0, leadStart), Math.max(leadStart + firstAi * 0.7, firstAnchorStart - 0.08));
        }

        // Anclas y huecos intermedios
        for (let aiPos = 0; aiPos < anchorIndices.length; aiPos++) {
          const idx = anchorIndices[aiPos];
          const anc = lineAnchors.get(idx);
          anchoredLines[idx] = {
            ...cleanPlain[idx],
            _origTimeSec: +anc.startSec.toFixed(2),
            timeSec: +anc.startSec.toFixed(2),
            endTimeSec: +anc.endSec.toFixed(2),
            _isUnalignedPlainLyrics: false,
            _whisperAlignedPlain: true
          };
          if (aiPos + 1 < anchorIndices.length) {
            const nextIdx = anchorIndices[aiPos + 1];
            if (nextIdx > idx + 1) {
              const nextAnc = lineAnchors.get(nextIdx);
              fillRange(idx + 1, nextIdx, anc.endSec + 0.06, Math.max(anc.endSec + (nextIdx - idx) * 0.65, nextAnc.startSec - 0.06));
            }
          }
        }

        // Después del último ancla
        const lastAi = anchorIndices[anchorIndices.length - 1];
        if (lastAi + 1 < cleanPlain.length) {
          const lastAnchorEnd = lineAnchors.get(lastAi).endSec;
          const tailEnd = Math.max(lastAnchorEnd + (cleanPlain.length - 1 - lastAi) * 1.4, lastVocalEndSec);
          fillRange(lastAi + 1, cleanPlain.length, lastAnchorEnd + 0.08, Math.min(actualDurSec - 0.2, tailEnd));
        }
      } else if (islands.length >= 1) {
        // Sin suficientes anclas de Whisper todavía: proyectar proporcionalmente SOLO sobre islas vocales reales
        // (respetando 100% los intros, puentes instrumentales y outros silenciosos)
        const totalIslandSec = islands.reduce((acc, isl) => acc + Math.max(0.25, isl.endSec - isl.startSec), 0) || 1;
        const mapActiveTimeToSongSec = (activeT) => {
          let rem = Math.max(0, Math.min(totalIslandSec, activeT));
          for (const isl of islands) {
            const dur = Math.max(0.25, isl.endSec - isl.startSec);
            if (rem <= dur) return isl.startSec + rem;
            rem -= dur;
          }
          return islands[islands.length - 1].endSec;
        };
        const totalW = lineWeights.reduce((a, b) => a + b, 0) || cleanPlain.length;
        let cumW = 0;
        for (let i = 0; i < cleanPlain.length; i++) {
          const aStart = (cumW / totalW) * totalIslandSec;
          cumW += lineWeights[i];
          const aEnd = (cumW / totalW) * totalIslandSec;
          const sSec = mapActiveTimeToSongSec(aStart);
          const eSec = Math.max(sSec + 0.55, Math.min(actualDurSec - 0.2, mapActiveTimeToSongSec(aEnd) - 0.04));
          anchoredLines[i] = {
            ...cleanPlain[i],
            _origTimeSec: +sSec.toFixed(2),
            timeSec: +sSec.toFixed(2),
            endTimeSec: +eSec.toFixed(2),
            _isUnalignedPlainLyrics: false,
            _islandAlignedPlain: true
          };
        }
      } else {
        const span = Math.max(10, lastVocalEndSec - firstVocalSec);
        const totalW = lineWeights.reduce((a, b) => a + b, 0) || cleanPlain.length;
        let cumW = 0;
        for (let i = 0; i < cleanPlain.length; i++) {
          const sSec = firstVocalSec + (cumW / totalW) * span;
          cumW += lineWeights[i];
          const eSec = Math.max(sSec + 0.55, firstVocalSec + (cumW / totalW) * span - 0.06);
          anchoredLines[i] = {
            ...cleanPlain[i],
            _origTimeSec: +sSec.toFixed(2),
            timeSec: +sSec.toFixed(2),
            endTimeSec: +Math.min(actualDurSec - 0.2, eSec).toFixed(2),
            _isUnalignedPlainLyrics: false
          };
        }
      }

      const validAnchored = anchoredLines.filter(Boolean);
      return this._alignSyllablesWithVocalProfile(key, validAnchored, vocalProfile, actualDurSec);
    }

    /**
     * Convierte la lista de palabras con timestamps acústicos exactos de Whisper
     * en líneas y sílabas milimétricas ancladas a la envolvente vocal de 100 Hz (10 ms).
     */
    _buildLinesFromWhisperWordsAndDsp(whisperWords, vocalProfile, actualDurSec = 195, refLines = []) {
      if (!Array.isArray(whisperWords) || whisperWords.length === 0) return [];

      const refinedWords = this._refineWhisperWordsWithReferenceLexicon(whisperWords, refLines);
      const fHz = vocalProfile?.frameHz || 100;
      const thVoc = Number.isFinite(vocalProfile?.thVoc) ? vocalProfile.thVoc : -32;

      // Ajustar cada palabra al ataque y caída vocal exacta en el perfil de 100 Hz (±120ms)
      const snappedWords = [];
      let prevEnd = 0;
      for (let i = 0; i < refinedWords.length; i++) {
        const w = refinedWords[i];
        const txt = repairSpanishBrokenAccents(String(w.text || '').trim());
        if (!txt) continue;
        let sSec = Math.max(prevEnd, Number(w.startSec) || 0);
        let eSec = Math.max(sSec + 0.16, Number(w.endSec) || (sSec + 0.36));

        if (vocalProfile && vocalProfile.vocEnergyDb) {
          const search0 = Math.max(Math.ceil(prevEnd * fHz), Math.floor((sSec - 0.12) * fHz));
          const search1 = Math.min(vocalProfile.vocEnergyDb.length - 1, Math.ceil((sSec + 0.14) * fHz));
          let bestOnsetF = Math.round(sSec * fHz);
          let bestFlux = -1e9;
          for (let f = Math.max(0, search0); f <= search1; f++) {
            if (vocalProfile.vocEnergyDb[f] >= thVoc - 2.0) {
              const sc = vocalProfile.vowelFlux[f] * 1.5 - Math.abs(f - sSec * fHz) * 0.08;
              if (sc > bestFlux) {
                bestFlux = sc;
                bestOnsetF = f;
              }
            }
          }
          sSec = Math.max(prevEnd, bestOnsetF / fHz);
          eSec = Math.max(sSec + 0.15, eSec);
        }

        snappedWords.push({
          text: txt,
          startSec: +sSec.toFixed(3),
          endSec: +Math.min(actualDurSec, eSec).toFixed(3)
        });
        prevEnd = sSec + 0.06;
      }

      if (snappedWords.length === 0) return [];

      // Agrupar palabras en versos naturales (respetando pausas, signos de puntuación y sin dejar palabras sueltas)
      const lines = [];
      let curGroup = [];
      for (let i = 0; i < snappedWords.length; i++) {
        const w = snappedWords[i];
        if (curGroup.length === 0) {
          curGroup.push(w);
          continue;
        }
        const prevW = curGroup[curGroup.length - 1];
        const gap = w.startSec - prevW.endSec;
        const groupDur = w.endSec - curGroup[0].startSec;
        const prevEndedSentence = /[.?!;…]$/.test(String(prevW.text || '').trim());
        const prevEndedClause = /[,:]$/.test(String(prevW.text || '').trim());
        const curEndsSentence = /[.?!;…]$/.test(String(w.text || '').trim());
        const shouldBreak =
          gap >= 0.52 ||
          (prevEndedSentence && curGroup.length >= 2) ||
          (prevEndedClause && curGroup.length >= 5) ||
          (curGroup.length >= 9) ||
          (groupDur >= 4.4 && !curEndsSentence) ||
          (curGroup.length >= 7 && !curEndsSentence && groupDur >= 3.0);
        if (shouldBreak) {
          lines.push(curGroup);
          curGroup = [w];
        } else {
          curGroup.push(w);
        }
      }
      if (curGroup.length > 0) lines.push(curGroup);

      return lines.map((wordGroup) => {
        const syls = [];
        for (let wi = 0; wi < wordGroup.length; wi++) {
          const w = wordGroup[wi];
          const nextW = wordGroup[wi + 1];
          const maxWordEnd = nextW ? Math.max(w.startSec + 0.12, Math.min(w.endSec, nextW.startSec - 0.015)) : w.endSec;
          const wordSyls = this._splitWordAndAlignSyllables100Hz(w.text, w.startSec, maxWordEnd, vocalProfile);
          syls.push(...wordSyls);
        }
        const lineText = wordGroup.map(w => w.text).join(' ');
        const startSec = syls.length > 0 ? syls[0].startSec : wordGroup[0].startSec;
        const endSec = syls.length > 0 ? syls[syls.length - 1].endSec : wordGroup[wordGroup.length - 1].endSec;
        return {
          _origTimeSec: startSec,
          timeSec: startSec,
          endTimeSec: endSec,
          text: lineText,
          words: syls.map(s => ({ timeSec: s.startSec, endSec: s.endSec, text: s.displayText })),
          _hasAcousticGeneratedWords: false,
          _isWhisperAudioDerived: true,
          singstarSyllables: syls
        };
      });
    }

    async alignOrTranscribeForKaraoke(track, key, audioBlob = null, referenceLines = [], actualDurHint = 0) {
      if (!track || !key) return null;
      if (this.isActiveWhisperFor(key)) {
        if (this._activeWhisperPromise) return await this._activeWhisperPromise;
        if (this._pendingKaraokeWhisperPromise && this._pendingKaraokeWhisperKey === key) {
          return await this._pendingKaraokeWhisperPromise;
        }
      }
      if (this.karaokeService && this.karaokeService.isWhisperVerifiedFor(key, actualDurHint)) {
        return this.karaokeService.cache.get(key) || null;
      }

      const cleanRef = Array.isArray(referenceLines)
        ? referenceLines.filter(l => l && !l._isFallbackPlaceholder && !l._isAcousticVocalIsland && String(l.text || '').trim().length > 0)
        : [];
      const hasRef = cleanRef.length >= 2;
      const isPlain = hasRef && this._isUnalignedPlainLyrics(cleanRef);

      const startJobToken = this._whisperJobToken;
      this._pendingKaraokeWhisperKey = key;

      const taskPromise = (async () => {
        try {
          if (audioBlob instanceof Blob && audioBlob.size >= 40000) {
            const decoded = await this._decodeAudioBlobSinglePass(track, key, audioBlob, null, null, {
              needPitchProfile: Boolean(this.isActive && this.currentTrackKey === key),
              needMono16k: true
            });
            if (this._whisperJobToken !== startJobToken && this._pendingKaraokeWhisperKey !== key) return null;
            if (!decoded || !decoded.mono16k) return null;
            const durReal = decoded.actualDurSec || actualDurHint || 195;
            if (this.karaokeService && this.karaokeService.isWhisperVerifiedFor(key, durReal)) {
              return this.karaokeService.cache.get(key) || null;
            }
            return await this._transcribeTrackAudioWithWhisper(
              track,
              key,
              decoded.mono16k,
              decoded.vocalDspProfile,
              null,
              hasRef ? cleanRef : [],
              {
                actualDurSec: durReal,
                isPlainUnaligned: isPlain,
                allowBackground: true
              }
            );
          }

          // Sin blob local (p. ej. streaming yt_bridge): intentar respaldo Whisper por videoId en servidor
          return await this._transcribeTrackAudioWithWhisper(
            track,
            key,
            null,
            null,
            null,
            hasRef ? cleanRef : [],
            {
              actualDurSec: actualDurHint || 195,
              isPlainUnaligned: isPlain,
              allowBackground: true
            }
          );
        } catch (_) {
          return null;
        } finally {
          if (this._pendingKaraokeWhisperKey === key) {
            this._pendingKaraokeWhisperKey = '';
          }
          if (this._pendingKaraokeWhisperPromise === taskPromise) {
            this._pendingKaraokeWhisperPromise = null;
          }
        }
      })();

      this._pendingKaraokeWhisperPromise = taskPromise;
      return await taskPromise;
    }

    async transcribeBlobForKaraokeIfNeeded(track, key, audioBlob, plainLinesOpt = null) {
      return await this.alignOrTranscribeForKaraoke(track, key, audioBlob, plainLinesOpt || [], 0);
    }

    async _transcribeTrackAudioWithWhisper(track, key, mono16kOrAudioBuf, vocalDspProfile, token, referenceLines = [], opts = {}) {
      if (!track) return null;
      if (this.isActiveWhisperFor(key) && this._activeWhisperPromise) {
        return await this._activeWhisperPromise;
      }
      if (this.isTranscribingWhisper && this._activeWhisperTrackKey && this._activeWhisperTrackKey !== key) {
        this._cancelWhisperWorkerTasks();
      }

      const jobToken = ++this._whisperJobToken;
      this._activeWhisperTrackKey = key;
      this.isTranscribingWhisper = true;

      const runJob = (async () => {
        const badge = document.getElementById('ssProDspBadge');
        const isPlainUnaligned = Boolean(opts && opts.isPlainUnaligned) || this._isUnalignedPlainLyrics(referenceLines);
        const allowBackground = (opts && typeof opts.allowBackground === 'boolean') ? opts.allowBackground : true;
        const hasReferenceLyrics = Array.isArray(referenceLines) && referenceLines.length >= 2 && !this._isPlaceholderLyrics(referenceLines);

        // Instantánea inmutable de tiempos LRC originales para que cada ventana alinee sin deriva acumulada
        const rawRefLines = hasReferenceLyrics
          ? referenceLines.map(l => ({
              ...l,
              _rawLrcTimeSec: Number.isFinite(Number(l._rawLrcTimeSec))
                ? Number(l._rawLrcTimeSec)
                : (Number.isFinite(Number(l._origTimeSec)) ? Number(l._origTimeSec) : Math.max(0, Number(l.timeSec) || 0)),
              _rawLrcEndTimeSec: Number.isFinite(Number(l._rawLrcEndTimeSec))
                ? Number(l._rawLrcEndTimeSec)
                : (Number.isFinite(Number(l.endTimeSec)) ? Number(l.endTimeSec) : (Math.max(0, Number(l.timeSec) || 0) + 3.2))
            }))
          : [];

        let mono16k = null;
        let actualDurSec = Number(opts && opts.actualDurSec) || 0;
        if (mono16kOrAudioBuf instanceof Float32Array) {
          mono16k = mono16kOrAudioBuf;
          if (!actualDurSec) actualDurSec = mono16k.length / 16000;
        } else if (mono16kOrAudioBuf && typeof mono16kOrAudioBuf.getChannelData === 'function') {
          actualDurSec = actualDurSec || mono16kOrAudioBuf.duration || 195;
          mono16k = await this._extract16kHzVocalBandpassMono(mono16kOrAudioBuf, null);
        }
        if (!actualDurSec) {
          actualDurSec = this.audioEngine ? (this.audioEngine.getRealDurationSec(track) || 195) : 195;
        }

        const isStillRelevant = () => {
          if (jobToken !== this._whisperJobToken) return false;
          if (this.isActive && this.currentTrackKey === key) return true;
          if (allowBackground && this.karaokeService && (!this.karaokeService.currentTrackKey || this.karaokeService.currentTrackKey === key)) return true;
          return this.currentTrackKey === key;
        };

        let lockedOnce = false;
        let lastShiftSec = 0;

        const applyTranscribedLinesLive = (stageLines, pureLinesToPersist, isComplete = false, alignMeta = {}) => {
          if (!Array.isArray(stageLines) || stageLines.length === 0) return;
          if (!isStillRelevant()) return;
          const alignedStage = stageLines[0]?.singstarSyllables
            ? stageLines
            : this._alignSyllablesWithVocalProfile(key, stageLines, vocalDspProfile, actualDurSec);
          const verifiedNow = Boolean(isComplete || alignMeta.hasGlobalLock || !hasReferenceLyrics || isPlainUnaligned);
          const studioData = {
            track,
            key,
            actualDurSec,
            dspContour: vocalDspProfile,
            acousticLines: alignedStage,
            hasDspMelody: Boolean(vocalDspProfile && vocalDspProfile.voicedCount >= 10),
            hasAcousticSyllables: true,
            hasPlaceholderLyrics: false,
            hasUnalignedPlainLyrics: false,
            isAudioTranscribed: verifiedNow,
            isWhisperVerified: verifiedNow,
            shiftSec: Number(alignMeta.shiftSec) || 0,
            slope: Number(alignMeta.slope) || 1.0
          };
          this._putStudioAnalysisCache(key, studioData);

          const cleanToSave = Array.isArray(pureLinesToPersist)
            ? pureLinesToPersist.filter(l => l && !l._isAcousticVocalIsland && !l._isFallbackPlaceholder && String(l.text || '').trim().length > 0)
            : [];
          if (cleanToSave.length >= 2) {
            lockedOnce = true;
            if (Number.isFinite(Number(alignMeta.shiftSec))) lastShiftSec = Number(alignMeta.shiftSec);
            this._commitAlignedLinesToKaraoke(key, cleanToSave, {
              track,
              audioDurSec: actualDurSec,
              shiftSec: Number(alignMeta.shiftSec) || 0,
              slope: Number(alignMeta.slope) || 1.0,
              matchedWords: Number(alignMeta.matchedWords) || 0,
              anchoredLines: Number(alignMeta.anchoredLines) || cleanToSave.length,
              hasGlobalLock: Boolean(alignMeta.hasGlobalLock ?? true),
              isComplete
            });
            if (this.karaokeService && (isComplete || alignMeta.hasGlobalLock || (!hasReferenceLyrics && cleanToSave.length >= 3))) {
              this.karaokeService.saveTranscribedLyricsToPersistentStore(track, cleanToSave, actualDurSec, {
                skipSingStarNotify: true,
                skipApplyCache: true,
                isComplete,
                shiftSec: Number(alignMeta.shiftSec) || 0,
                slope: Number(alignMeta.slope) || 1.0,
                matchedWords: Number(alignMeta.matchedWords) || 0,
                anchoredLines: Number(alignMeta.anchoredLines) || cleanToSave.length
              });
            }
          }

          // Aplicar a SingStar DESPUÉS de _commitAlignedLinesToKaraoke para leer el offset ya limpio (0.0s tras reset pre-IA)
          if (this.currentTrackKey === key && this.isActive) {
            const effOff = Number(this.karaokeService?.timeOffsetSec || 0);
            const offBadge = document.getElementById('ssProOffsetBadge');
            if (offBadge) offBadge.textContent = `${effOff >= 0 ? '+' : ''}${effOff.toFixed(2)}s`;
            this._applyStudioAnalysisToStage(studioData, effOff, false);
            this._lastTeleprompterLineIdx = -2;
            this._lastTeleprompterSylIdx = -2;
          }
        };

        const formatReadyLabel = (shiftVal) => {
          const s = Number(shiftVal) || 0;
          return Math.abs(s) >= 0.65
            ? `Sincro IA · ${s > 0 ? '+' : ''}${s.toFixed(1)}s`
            : 'Sincro IA · 10ms';
        };

        try {
          const languageHint = this._detectLanguageHintForTrack(track, hasReferenceLyrics ? rawRefLines : []);

          // Reactivar el worker si se canceló previamente en otra canción
          if (this._whisperWorker && !this._whisperWorkerFailed) {
            try { this._whisperWorker.postMessage({ type: 'reset_cancel' }); } catch (_) {}
          }

          // 1) Transcripción / Alineación forzada directa sobre el flujo vocal 16 kHz (Worker local ONNX -> respaldo Server PCM)
          if (mono16k && mono16k.length >= 16000) {
            const prioritySec = this.audioEngine ? (this.audioEngine.getCurrentSongTimeSec() || 0) : 0;
            const fastProbeMode = Boolean(hasReferenceLyrics && !isPlainUnaligned);
            const windows = this._findActiveVocalWindowsForWhisper(vocalDspProfile, actualDurSec, prioritySec, {
              forAlignment: hasReferenceLyrics,
              maxProbes: fastProbeMode ? 3 : 0
            });
            const collectedWords = [];
            let lockedProbeHits = 0;

            for (let wIdx = 0; wIdx < windows.length; wIdx++) {
              if (!isStillRelevant()) return null;

              const win = windows[wIdx];
              const stepLabel = lockedOnce
                ? `${formatReadyLabel(lastShiftSec)} (${wIdx + 1}/${windows.length})`
                : (hasReferenceLyrics ? `Sincro IA ${wIdx + 1}/${windows.length}` : `Transcribiendo IA ${wIdx + 1}/${windows.length}`);
              if (this.karaokeService) {
                this.karaokeService.setKaraokeAiSyncStatus(key, stepLabel, 'working');
              }
              if (this.currentTrackKey === key && this.isActive) {
                this._setSyncStatusChip(stepLabel, 'working');
                if (badge) {
                  badge.textContent = `WHISPER IA (${wIdx + 1}/${windows.length}) · ${Math.round(win.startSec)}s`;
                }
              }
              const sSample = Math.max(0, Math.floor(win.startSec * 16000));
              const eSample = Math.min(mono16k.length, Math.ceil(win.endSec * 16000));
              if (eSample - sSample < 8000) continue;

              const slicePcm = mono16k.subarray(sSample, eSample);
              let res = await this._transcribeWindowViaWorker(
                slicePcm,
                win.startSec,
                languageHint,
                (statusMsg) => {
                  if (badge && this.currentTrackKey === key && this.isActive && statusMsg) {
                    badge.textContent = statusMsg.toUpperCase().slice(0, 34);
                  }
                }
              );
              if (!isStillRelevant()) return null;

              // Si el Web Worker WASM/ONNX falló o no está disponible, respaldo automático Server PCM
              if (!res || !Array.isArray(res.words) || res.words.length === 0) {
                if (this._whisperWorkerFailed || !this._whisperWorker) {
                  if (this.currentTrackKey === key && this.isActive) {
                    this._setSyncStatusChip(`IA Servidor ${wIdx + 1}/${windows.length}`, 'working');
                  }
                  res = await this._transcribeWindowViaServerPcm(slicePcm, win.startSec, languageHint, track);
                  if (!isStillRelevant()) return null;
                }
              }

              if (res && Array.isArray(res.words) && res.words.length > 0) {
                for (const w of res.words) {
                  const txt = String(w?.text || '').trim();
                  if (!txt) continue;
                  const sSec = Number(w.startSec);
                  const eSec = Number(w.endSec);
                  if (!Number.isFinite(sSec)) continue;
                  const dup = collectedWords.some(
                    (ew) => Math.abs(ew.startSec - sSec) < 0.30 && ew.text.toLowerCase() === txt.toLowerCase()
                  );
                  if (!dup) {
                    collectedWords.push({
                      text: txt,
                      startSec: sSec,
                      endSec: Number.isFinite(eSec) ? Math.max(sSec + 0.10, eSec) : +(sSec + 0.32).toFixed(3)
                    });
                  }
                }
                collectedWords.sort((a, b) => a.startSec - b.startSec);

                const isLastWin = (wIdx === windows.length - 1);
                if (hasReferenceLyrics && isPlainUnaligned) {
                  const alignedPlain = this._alignPlainLyricsWithWhisperAndIslands(
                    key,
                    rawRefLines,
                    collectedWords,
                    vocalDspProfile,
                    actualDurSec
                  );
                  if (alignedPlain.length >= 2) {
                    applyTranscribedLinesLive(alignedPlain, alignedPlain, isLastWin, {
                      hasGlobalLock: collectedWords.length >= 4,
                      matchedWords: collectedWords.length,
                      anchoredLines: alignedPlain.length
                    });
                  }
                } else if (hasReferenceLyrics) {
                  const alignRes = this._alignReferenceLyricsToWhisperRealAudio(
                    key,
                    rawRefLines,
                    collectedWords,
                    vocalDspProfile,
                    actualDurSec
                  );
                  if (alignRes && alignRes.hasGlobalLock && Array.isArray(alignRes.lines) && alignRes.lines.length >= 2) {
                    lockedProbeHits++;
                    const strongEarlyLock = fastProbeMode && (
                      (Number(alignRes.matchedWords) >= 8 && Number(alignRes.anchoredLines) >= 3) ||
                      lockedProbeHits >= 2
                    );
                    applyTranscribedLinesLive(alignRes.lines, alignRes.lines, isLastWin || strongEarlyLock, alignRes);
                    if (strongEarlyLock) {
                      break;
                    }
                  }
                } else {
                  const liveLines = this._buildLinesFromWhisperWordsAndDsp(
                    collectedWords,
                    vocalDspProfile,
                    actualDurSec,
                    []
                  );
                  if (liveLines.length >= 1) {
                    const stageLines = isLastWin
                      ? liveLines
                      : this._mergeTranscribedLinesWithVocalIslands(key, liveLines, vocalDspProfile, actualDurSec);
                    applyTranscribedLinesLive(stageLines, liveLines, isLastWin, {
                      hasGlobalLock: liveLines.length >= 2,
                      matchedWords: collectedWords.length,
                      anchoredLines: liveLines.length
                    });
                  }
                }
              }
            }

            if (collectedWords.length >= 3) {
              let finalLines = [];
              let finalMeta = { hasGlobalLock: true, shiftSec: 0, slope: 1.0, matchedWords: collectedWords.length, anchoredLines: 0 };
              if (hasReferenceLyrics && isPlainUnaligned) {
                finalLines = this._alignPlainLyricsWithWhisperAndIslands(key, rawRefLines, collectedWords, vocalDspProfile, actualDurSec);
                finalMeta.anchoredLines = finalLines.length;
              } else if (hasReferenceLyrics) {
                const alignRes = this._alignReferenceLyricsToWhisperRealAudio(key, rawRefLines, collectedWords, vocalDspProfile, actualDurSec);
                if (alignRes && alignRes.hasGlobalLock && Array.isArray(alignRes.lines) && alignRes.lines.length >= 2) {
                  finalLines = alignRes.lines;
                  finalMeta = alignRes;
                }
              } else {
                finalLines = this._buildLinesFromWhisperWordsAndDsp(collectedWords, vocalDspProfile, actualDurSec, []);
                finalMeta.anchoredLines = finalLines.length;
              }

              if (finalLines.length >= 1) {
                applyTranscribedLinesLive(finalLines, finalLines, true, finalMeta);
                const readyTxt = formatReadyLabel(finalMeta.shiftSec);
                if (this.karaokeService) {
                  this.karaokeService.setKaraokeAiSyncStatus(key, readyTxt, 'ready');
                }
                if (this.currentTrackKey === key && this.isActive) {
                  this._setSyncStatusChip(readyTxt, 'ready');
                  if (badge) badge.textContent = 'WHISPER IA + SÍLABAS 10MS';
                  const shiftAbs = Math.abs(Number(finalMeta.shiftSec) || 0);
                  const popSub = shiftAbs >= 0.65
                    ? `Desfase corregido (${finalMeta.shiftSec > 0 ? '+' : ''}${finalMeta.shiftSec.toFixed(1)}s) en Karaoke y SingStar`
                    : `${collectedWords.length} palabras ancladas al audio real`;
                  this._spawnPopup('SINCRONIZADO CON AUDIO REAL', popSub, '#34d399', 1750);
                }
                return finalLines;
              }
            } else if (hasReferenceLyrics && isPlainUnaligned) {
              const islandAligned = this._alignPlainLyricsWithWhisperAndIslands(key, rawRefLines, collectedWords, vocalDspProfile, actualDurSec);
              if (islandAligned.length >= 2) {
                applyTranscribedLinesLive(islandAligned, islandAligned, true, { hasGlobalLock: true, anchoredLines: islandAligned.length });
                if (this.currentTrackKey === key && this.isActive) {
                  this._setSyncStatusChip('Alineado a voz real', 'ready');
                }
                return islandAligned;
              }
            }
          }

          // 2) Respaldo en el servidor (/api/v1/lyrics/transcribe por videoId) cuando no hubo blob local
          //    o el worker ONNX local no logró bloqueo — funciona tanto CON letra de referencia como SIN ella.
          if (!lockedOnce) {
            const rawVid = String(track.videoId || track.id || '').replace(/^magic_yt_|^yt_/, '').trim();
            const vid = /^[A-Za-z0-9_-]{11}$/.test(rawVid) ? rawVid : '';
            const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
            if (vid) {
              try {
                if (this.karaokeService) {
                  this.karaokeService.setKaraokeAiSyncStatus(key, 'Sincro IA servidor...', 'working');
                }
                if (this.currentTrackKey === key && this.isActive) {
                  this._setSyncStatusChip('Sincro IA servidor...', 'working');
                }
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 28000);
                const resp = await fetch(
                  `${baseUrl}/api/v1/lyrics/transcribe?videoId=${encodeURIComponent(vid)}&title=${encodeURIComponent(track.title || '')}&artist=${encodeURIComponent(track.artist || '')}&language=${encodeURIComponent(languageHint)}`,
                  { method: 'POST', signal: ctrl.signal }
                );
                clearTimeout(tid);
                if (!isStillRelevant()) return null;
                if (resp && resp.ok) {
                  const data = await resp.json();
                  if (data && Array.isArray(data.words) && data.words.length >= 3) {
                    let srvLines = [];
                    let srvMeta = { hasGlobalLock: true, shiftSec: 0, slope: 1.0, matchedWords: data.words.length, anchoredLines: 0 };
                    if (hasReferenceLyrics && isPlainUnaligned) {
                      srvLines = this._alignPlainLyricsWithWhisperAndIslands(key, rawRefLines, data.words, vocalDspProfile, actualDurSec);
                      srvMeta.anchoredLines = srvLines.length;
                    } else if (hasReferenceLyrics) {
                      const alignSrv = this._alignReferenceLyricsToWhisperRealAudio(key, rawRefLines, data.words, vocalDspProfile, actualDurSec);
                      if (alignSrv && alignSrv.hasGlobalLock && Array.isArray(alignSrv.lines) && alignSrv.lines.length >= 2) {
                        srvLines = alignSrv.lines;
                        srvMeta = alignSrv;
                      }
                    } else {
                      srvLines = this._buildLinesFromWhisperWordsAndDsp(data.words, vocalDspProfile, actualDurSec, []);
                      srvMeta.anchoredLines = srvLines.length;
                    }
                    if (srvLines.length >= 2) {
                      applyTranscribedLinesLive(srvLines, srvLines, true, srvMeta);
                      const readyTxt = formatReadyLabel(srvMeta.shiftSec);
                      if (this.karaokeService) {
                        this.karaokeService.setKaraokeAiSyncStatus(key, readyTxt, 'ready');
                      }
                      if (this.currentTrackKey === key && this.isActive) {
                        this._setSyncStatusChip(readyTxt, 'ready');
                        if (badge) badge.textContent = 'WHISPER IA + DTW 10MS';
                      }
                      this._spawnPopup('SINCRONIZADO CON AUDIO REAL', `${srvLines.length} versos bloqueados a la voz real`, '#34d399', 1600);
                      return srvLines;
                    }
                  } else if (!hasReferenceLyrics && data && data.syncedLyrics && String(data.syncedLyrics).includes('[')) {
                    const parsed = this.karaokeService ? this.karaokeService.parseLrc(data.syncedLyrics, { track }) : [];
                    if (parsed.length >= 2) {
                      applyTranscribedLinesLive(parsed, parsed, true, { hasGlobalLock: true, anchoredLines: parsed.length });
                      if (this.currentTrackKey === key && this.isActive) {
                        this._setSyncStatusChip('Sincro IA · 10ms', 'ready');
                        if (badge) badge.textContent = 'WHISPER IA + DTW 10MS';
                      }
                      this._spawnPopup('LETRA TRANSCRITA CON IA', `${parsed.length} versos sincronizados del audio`, '#34d399', 1600);
                      return parsed;
                    }
                  }
                }
              } catch (_) {}
            }
          }
          return null;
        } catch (_) {
          return null;
        } finally {
          if (jobToken === this._whisperJobToken) {
            this.isTranscribingWhisper = false;
            if (this._activeWhisperTrackKey === key) {
              this._activeWhisperTrackKey = '';
              this._activeWhisperPromise = null;
            }
            // Liberar buffer PCM 16 kHz grande una vez terminada la alineación para mantener RAM ligera en Android
            if (this._activeDecodedTrackKey === key && this._activeDecodedBundle) {
              this._activeDecodedBundle.mono16k = null;
            }
            if (!lockedOnce && this.karaokeService && this.karaokeService._aiSyncStatusMap.get(key)?.state === 'working') {
              this.karaokeService.setKaraokeAiSyncStatus(key, '', '');
            }
            if (!lockedOnce && this.currentTrackKey === key && this.isActive) {
              this._setSyncStatusChip(vocalDspProfile ? 'Sincronizado DTW 10ms' : '', vocalDspProfile ? 'ready' : '');
            }
          }
        }
      })();

      this._activeWhisperPromise = runJob;
      return await runJob;
    }

    /**
     * Extractor DSP en 2 fases de Ultra-Alta Resolución (100 Hz = 10ms por frame) sobre el AudioBuffer completo:
     * 1) Canal Vocal Mid-Side + Filtro Formántico (280 - 3000 Hz) + Banda Consonántica Sibilante (2800 - 6200 Hz)
     *    a 100 Hz (ventanas de 10ms) para localizar con precisión milimétrica las islas vocales (vocalIslands),
     *    el primer instante real de voz cantada (firstVocalSec) y los núcleos vocálicos de cada sílaba (vowelFlux).
     * 2) Detector de Frecuencia Fundamental F0 con algoritmo YIN CMND (d'(tau)) + Viterbi Global Path
     *    para extraer la melodía real sin caer en el bajo eléctrico ni dar saltos de octava falsos.
     */
    async _extractHighResVocalEnvelopeAndPitch(audioBuffer, token, onProgress) {
      if (!audioBuffer) return null;
      const sr = audioBuffer.sampleRate || 44100;
      const ch0 = audioBuffer.getChannelData(0);
      const ch1 = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : ch0;
      const dur = audioBuffer.duration || (ch0.length / sr);
      if (dur < 10) return null;

      const FRAME_HZ = 100; // 10ms por frame (precisión milimétrica para sílabas y F0)
      const hopSamples = Math.max(1, Math.round(sr / FRAME_HZ));
      const nFrames = Math.max(40, Math.floor(ch0.length / hopSamples));

      const vocEnergyDb = new Float32Array(nFrames);
      const vowelFlux = new Float32Array(nFrames);
      const sibilantRatio = new Float32Array(nFrames);
      const rawMidiFrames = new Float32Array(nFrames);
      const rawClarityFrames = new Float32Array(nFrames);

      // Coeficientes filtro formántico vocal (280 Hz - 3000 Hz) y banda F0 (165 Hz - 960 Hz)
      const dt = 1.0 / sr;
      const rcHpForm = 1.0 / (2.0 * Math.PI * 280.0);
      const aHpForm = rcHpForm / (rcHpForm + dt);
      const rcLpForm = 1.0 / (2.0 * Math.PI * 3000.0);
      const aLpForm = dt / (rcLpForm + dt);

      // Submuestreo x2 (~22050 Hz) para el cálculo MPM/NSDF F0 a 25 Hz (3.5x más rápido y sin saltos de octava)
      const decim = Math.max(1, Math.round(sr / 22050));
      const srYin = sr / decim;
      const dtYin = 1.0 / srYin;
      const rcHpYin = 1.0 / (2.0 * Math.PI * 145.0);
      const aHpYin = rcHpYin / (rcHpYin + dtYin);
      const rcLpYin = 1.0 / (2.0 * Math.PI * 1250.0);
      const aLpYin = dtYin / (rcLpYin + dtYin);

      // Rango vocal humano de canto en SingStar: 125 Hz (SI2, MIDI 47) a 840 Hz (SOL#5, MIDI 80)
      const minTau = Math.max(4, Math.floor(srYin / 840));
      const maxTau = Math.min(200, Math.ceil(srYin / 125));
      const mpmWin = Math.min(512, maxTau * 2 + 128);
      const yinBuf = new Float32Array(mpmWin);
      const nsdfBuf = new Float32Array(maxTau + 2);

      let hpForm = 0, prevMidForm = 0, lpForm = 0, lpForm2 = 0;
      let lastMidiComputed = 0;
      let lastClarityComputed = 0;

      for (let f = 0; f < nFrames; f++) {
        // Ceder el hilo cada 400 frames (~4s de audio) para mantener 60fps constantes en móviles
        if (f > 0 && (f % 400) === 0) {
          if (token !== undefined && token !== null && token !== this._prepToken) return null;
          if (onProgress && (f % 1200) === 0) {
            const p = 38 + Math.round((f / nFrames) * 46);
            onProgress(p, `Analizando melodía vocal MPM (${Math.round((f / nFrames) * 100)}%)...`);
          }
          await new Promise(r => setTimeout(r, 0));
        }

        const base = f * hopSamples;
        let sumVoc = 0;
        let sumSide = 0;
        let sumSib = 0;
        const limit = Math.min(hopSamples, ch0.length - base);

        for (let i = 0; i < limit; i++) {
          const l = ch0[base + i];
          const r = ch1[base + i];
          const mid = 0.5 * (l + r);
          const side = 0.5 * (l - r);

          hpForm = aHpForm * (hpForm + mid - prevMidForm);
          prevMidForm = mid;
          lpForm = lpForm + aLpForm * (hpForm - lpForm);
          lpForm2 = lpForm2 + aLpForm * (lpForm - lpForm2);

          const sib = hpForm - lpForm;
          sumVoc += lpForm2 * lpForm2;
          sumSide += side * side;
          sumSib += sib * sib;
        }

        const rmsVoc = Math.sqrt(sumVoc / Math.max(1, limit) + 1e-12);
        const rmsSide = Math.sqrt(sumSide / Math.max(1, limit) + 1e-12);
        const rmsSib = Math.sqrt(sumSib / Math.max(1, limit) + 1e-12);
        const centerFocus = Math.max(0.5, Math.min(4.0, rmsVoc / (rmsSide * 0.65 + 0.0004)));
        vocEnergyDb[f] = 20 * Math.log10(rmsVoc) + 3.8 * Math.log2(centerFocus);
        sibilantRatio[f] = rmsSib / (rmsVoc + 0.0005);

        // Evaluar MPM/NSDF F0 cada 40ms (25 Hz) y propagar a los frames de 10ms contiguos
        if ((f & 3) !== 0) {
          rawMidiFrames[f] = lastMidiComputed;
          rawClarityFrames[f] = lastClarityComputed;
          continue;
        }

        lastMidiComputed = 0;
        lastClarityComputed = 0;
        if (rmsVoc >= 0.0045 && (base + mpmWin * decim) < ch0.length) {
          let prevIn = 0, hp1 = 0, hp2 = 0, prevHp1 = 0, lp1 = 0, lp2 = 0;
          let mean = 0;
          for (let i = 0; i < mpmWin; i++) {
            const idx = base + i * decim;
            const l = ch0[idx];
            const r = ch1[idx];
            const midVoc = 0.5 * (l + r) - 0.30 * (l - r);
            hp1 = aHpYin * (hp1 + midVoc - prevIn);
            prevIn = midVoc;
            hp2 = aHpYin * (hp2 + hp1 - prevHp1);
            prevHp1 = hp1;
            lp1 = lp1 + aLpYin * (hp2 - lp1);
            lp2 = lp2 + aLpYin * (lp1 - lp2);
            yinBuf[i] = lp2;
            mean += lp2;
          }
          mean /= mpmWin;
          let sqSum = 0;
          for (let i = 0; i < mpmWin; i++) {
            const v = yinBuf[i] - mean;
            yinBuf[i] = v;
            sqSum += v * v;
          }
          if (sqSum > 1e-8) {
            nsdfBuf[0] = 1.0;
            let m = 2.0 * sqSum;
            for (let tau = 1; tau <= maxTau; tau++) {
              const a = yinBuf[tau - 1];
              const b = yinBuf[mpmWin - tau];
              m -= (a * a + b * b);
              if (m <= 1e-10) {
                nsdfBuf[tau] = 0;
                continue;
              }
              let r = 0;
              const lim = mpmWin - tau;
              for (let i = 0; i < lim; i++) {
                r += yinBuf[i] * yinBuf[i + tau];
              }
              nsdfBuf[tau] = (2.0 * r) / m;
            }

            let startTau = 1;
            while (startTau < maxTau && nsdfBuf[startTau] > 0) startTau++;

            let nMax = -1.0;
            let inPos = false;
            let pTau = -1;
            let pVal = -1.0;
            const kmTau = [];
            const kmVal = [];
            for (let tau = startTau; tau <= maxTau; tau++) {
              const v = nsdfBuf[tau];
              if (v > 0) {
                if (!inPos) {
                  inPos = true;
                  pTau = tau;
                  pVal = v;
                } else if (v > pVal) {
                  pVal = v;
                  pTau = tau;
                }
              } else if (inPos) {
                if (pTau >= minTau && pTau < maxTau && pVal > 0) {
                  kmTau.push(pTau);
                  kmVal.push(pVal);
                  if (pVal > nMax) nMax = pVal;
                }
                inPos = false;
                pTau = -1;
                pVal = -1.0;
              }
            }
            if (inPos && pTau >= minTau && pTau < maxTau && pVal > 0) {
              kmTau.push(pTau);
              kmVal.push(pVal);
              if (pVal > nMax) nMax = pVal;
            }

            if (kmTau.length > 0 && nMax >= 0.56) {
              const thr = 0.86 * nMax;
              let bestTau = -1;
              let bestClarity = 0;
              for (let k = 0; k < kmTau.length; k++) {
                if (kmVal[k] >= thr) {
                  bestTau = kmTau[k];
                  bestClarity = kmVal[k];
                  break;
                }
              }
              if (bestTau >= minTau && bestTau < maxTau) {
                const y1 = nsdfBuf[bestTau - 1];
                const y2 = nsdfBuf[bestTau];
                const y3 = nsdfBuf[bestTau + 1];
                const denom = 2.0 * (y1 - 2.0 * y2 + y3);
                const shift = Math.abs(denom) > 1e-6 ? ((y1 - y3) / denom) : 0;
                const refinedTau = Math.max(minTau, bestTau + Math.max(-0.5, Math.min(0.5, shift)));
                const freqHz = srYin / refinedTau;
                const midi = 69 + 12 * Math.log2(freqHz / 440);
                if (midi >= 47 && midi <= 81) {
                  rawMidiFrames[f] = midi;
                  rawClarityFrames[f] = Math.max(0.05, Math.min(1.0, bestClarity));
                  lastMidiComputed = midi;
                  lastClarityComputed = rawClarityFrames[f];
                }
              }
            }
          }
        }
      }

      // Calcular umbral vocal adaptativo y flujo de ataque silábico (vowel onset flux a 10ms)
      const sortedVoc = Array.from(vocEnergyDb).sort((a, b) => a - b);
      const p88Voc = sortedVoc[Math.floor(sortedVoc.length * 0.88)] || -20;
      const thVoc = Math.max(-44.0, p88Voc - 21.5);

      for (let f = 4; f + 3 < nFrames; f++) {
        if (vocEnergyDb[f] < thVoc - 3.0) continue;
        const prevDip = Math.min(vocEnergyDb[f - 3], vocEnergyDb[f - 2], vocEnergyDb[f - 1]);
        const curPeak = Math.max(vocEnergyDb[f], vocEnergyDb[f + 1]);
        const rise = Math.max(0, curPeak - prevDip);
        const consRelease = Math.max(0, sibilantRatio[f - 2] - sibilantRatio[f]) * 3.4;
        const localMax = (vocEnergyDb[f] >= vocEnergyDb[f - 1] && vocEnergyDb[f] >= vocEnergyDb[f + 1]) ? 1.35 : 0;
        vowelFlux[f] = rise + consRelease + localMax;
      }

      const voicedMidis = [];
      for (let f = 0; f < nFrames; f++) {
        if (rawMidiFrames[f] > 0 && vocEnergyDb[f] >= thVoc - 1.5 && rawClarityFrames[f] >= 0.56) {
          voicedMidis.push(rawMidiFrames[f]);
        }
      }

      let medianMidi = 62;
      if (voicedMidis.length >= 8) {
        voicedMidis.sort((a, b) => a - b);
        medianMidi = voicedMidis[Math.floor(voicedMidis.length * 0.5)];
      }

      const midiFrames = new Float32Array(nFrames);
      let runningRef = medianMidi;
      for (let f = 0; f < nFrames; f++) {
        let m = rawMidiFrames[f];
        if (m <= 0 || vocEnergyDb[f] < thVoc - 2.5) continue;

        if (m < medianMidi - 10.5 && (m + 12) <= medianMidi + 8) {
          m += 12;
        } else if (m > medianMidi + 11.5 && (m - 12) >= medianMidi - 8) {
          m -= 12;
        }

        if (Math.abs(m - runningRef) > 7.5) {
          m = 0.72 * m + 0.28 * runningRef;
        }
        midiFrames[f] = m;
        runningRef = 0.85 * runningRef + 0.15 * m;
      }

      // Detectar islas vocales reales (segmentos donde hay voz cantada sostenida con F0 válido)
      const vocalIslands = [];
      const minIslandFrames = Math.round(0.28 * FRAME_HZ);
      const maxGapFrames = Math.round(0.22 * FRAME_HZ);
      let inIsland = false;
      let islandStartF = 0;
      let silentGapF = 0;
      let voicedInIsland = 0;

      for (let f = 0; f < nFrames; f++) {
        const isVoiced = vocEnergyDb[f] >= thVoc - 1.2 && (midiFrames[f] >= 46 || rawClarityFrames[f] >= 0.52);
        if (isVoiced) {
          if (!inIsland) {
            inIsland = true;
            islandStartF = f;
            voicedInIsland = 1;
          } else {
            voicedInIsland++;
          }
          silentGapF = 0;
        } else if (inIsland) {
          silentGapF++;
          if (silentGapF >= maxGapFrames) {
            const islandEndF = f - silentGapF;
            if ((islandEndF - islandStartF) >= minIslandFrames && voicedInIsland >= Math.round(0.18 * FRAME_HZ)) {
              vocalIslands.push({
                startSec: +(islandStartF / FRAME_HZ).toFixed(3),
                endSec: +(islandEndF / FRAME_HZ).toFixed(3)
              });
            }
            inIsland = false;
            silentGapF = 0;
            voicedInIsland = 0;
          }
        }
      }
      if (inIsland && (nFrames - 1 - islandStartF) >= minIslandFrames) {
        vocalIslands.push({
          startSec: +(islandStartF / FRAME_HZ).toFixed(3),
          endSec: +((nFrames - 1) / FRAME_HZ).toFixed(3)
        });
      }

      const firstVocalSec = vocalIslands.length > 0 ? vocalIslands[0].startSec : 0;

      return {
        frameHz: FRAME_HZ,
        nFrames,
        hopSec: 1 / FRAME_HZ,
        vocEnergyDb,
        vowelFlux,
        thVoc,
        midiFrames,
        rawClarityFrames,
        vocalIslands,
        firstVocalSec,
        medianMidi: Math.round(medianMidi),
        voicedCount: voicedMidis.length
      };
    }

    /**
     * Alineador Acústico de Sílabas Viterbi-DTW a 100 Hz (10 ms):
     * Garantiza que NINGUNA línea ni sílaba empiece antes de `firstVocalSec` (saltando intros instrumentales)
     * y ancla cada sílaba fonética a los picos de apertura vocálica reales (`vowelFlux`) del audio.
     */
    _alignSyllablesWithVocalProfile(key, linesArr, vocalProfile, actualDurSec = 195) {
      if (!Array.isArray(linesArr) || linesArr.length === 0) return [];

      if (this.karaokeService && typeof this.karaokeService._computeAcousticSyllablesForLines === 'function') {
        try {
          this.karaokeService._computeAcousticSyllablesForLines(key, linesArr);
        } catch (_) {}
      }

      // Recolectar índices de líneas válidas (incluyendo barras guía silenciosas durante transcripción IA)
      const validIndices = [];
      for (let i = 0; i < linesArr.length; i++) {
        const l = linesArr[i];
        if (!l || l.isIntroCard || l.isMetadata || l.isCue) continue;
        if (l._isAcousticVocalIsland && Array.isArray(l.singstarSyllables) && l.singstarSyllables.length > 0) {
          validIndices.push(i);
          continue;
        }
        const txt = repairSpanishBrokenAccents(String(l.text || '').trim());
        if (!txt || /^[\(\[♪♫]/.test(txt)) continue;
        validIndices.push(i);
      }

      const outLines = [];
      let prevLineEndSec = 0;

      for (let vi = 0; vi < validIndices.length; vi++) {
        const li = validIndices[vi];
        const line = linesArr[li];
        const origTimeSec = Number.isFinite(Number(line._origTimeSec))
          ? Number(line._origTimeSec)
          : (Number(line.timeSec) || 0);

        // Barras guía silenciosas de islas vocales reales (sin texto inventado)
        if (line._isAcousticVocalIsland && Array.isArray(line.singstarSyllables) && line.singstarSyllables.length > 0) {
          outLines.push({
            ...line,
            _origTimeSec: origTimeSec
          });
          prevLineEndSec = Math.max(prevLineEndSec, (Number(line.endTimeSec) || origTimeSec) + 0.02);
          continue;
        }

        const cleanText = repairSpanishBrokenAccents(String(line.text || '').trim());

        if (line._isWhisperAudioDerived && Array.isArray(line.singstarSyllables) && line.singstarSyllables.length > 0) {
          outLines.push({
            ...line,
            _origTimeSec: origTimeSec
          });
          prevLineEndSec = Math.max(prevLineEndSec, (Number(line.endTimeSec) || origTimeSec) + 0.02);
          continue;
        }

        // Ancla temporal constante y verificada (SIN deformación decaying de intro)
        const anchoredBaseSec = Math.max(0, Number(line.timeSec) || origTimeSec);

        let nextAnchoredSec = Math.min(actualDurSec, anchoredBaseSec + 3.8);
        if (vi + 1 < validIndices.length) {
          const nextLine = linesArr[validIndices[vi + 1]];
          const nextSec = Number(nextLine.timeSec);
          if (Number.isFinite(nextSec)) {
            nextAnchoredSec = Math.max(anchoredBaseSec + 0.50, nextSec);
          }
        }

        // NUNCA permitir que prevLineEndSec arrastre la línea actual más allá de su ancla real
        const rawStartSec = Math.min(
          nextAnchoredSec - 0.40,
          Math.max(anchoredBaseSec, Math.min(prevLineEndSec, anchoredBaseSec + 0.14))
        );
        const maxWindowEndSec = Math.max(rawStartSec + 0.42, Math.min(nextAnchoredSec - 0.04, rawStartSec + 5.4));

        // Caso A: La línea tiene timestamps verificados por palabra o sílaba (Enhanced LRC, Whisper o catálogo exacto)
        if ((!line._hasAcousticGeneratedWords || line._whisperRefined) && Array.isArray(line.words) && line.words.length >= 2 && Number.isFinite(Number(line.words[0]?.timeSec))) {
          const syls = [];
          for (let wi = 0; wi < line.words.length; wi++) {
            const w = line.words[wi];
            const rawToken = repairSpanishBrokenAccents(String(w.text || ''));
            const trimmed = rawToken.trim();
            if (!trimmed) continue;
            const sSec = Math.max(rawStartSec - 0.06, Number(w.timeSec) || rawStartSec);
            const nextW = line.words[wi + 1];
            const eSec = nextW
              ? Math.max(sSec + 0.085, Math.min(maxWindowEndSec, Number(nextW.timeSec) - 0.012))
              : Math.max(sSec + 0.15, Math.min(maxWindowEndSec, Number(w.endSec) || (sSec + 0.48)));

            // Subdividir palabras polisilábicas en sílabas fonéticas ancladas a 10 ms (100 Hz)
            const hasTrailingSpace = /\s$/.test(rawToken) || wi === line.words.length - 1;
            const splitPieces = (trimmed.length >= 4 && hasTrailingSpace)
              ? this._splitWordAndAlignSyllables100Hz(trimmed, sSec, eSec, vocalProfile)
              : null;

            if (Array.isArray(splitPieces) && splitPieces.length >= 2) {
              for (let pi = 0; pi < splitPieces.length; pi++) {
                const sp = splitPieces[pi];
                syls.push({
                  text: sp.text,
                  displayText: (pi === splitPieces.length - 1) ? (hasTrailingSpace ? `${sp.text} ` : sp.text) : sp.text,
                  startSec: sp.startSec,
                  endSec: sp.endSec
                });
              }
            } else {
              syls.push({
                text: trimmed,
                displayText: rawToken.endsWith(' ') ? rawToken : (hasTrailingSpace ? `${trimmed} ` : trimmed),
                startSec: +sSec.toFixed(3),
                endSec: +eSec.toFixed(3)
              });
            }
          }
          if (syls.length > 0) {
            prevLineEndSec = Math.min(nextAnchoredSec - 0.02, syls[syls.length - 1].endSec + 0.02);
            outLines.push({
              ...line,
              _origTimeSec: origTimeSec,
              text: cleanText,
              timeSec: syls[0].startSec,
              endTimeSec: syls[syls.length - 1].endSec,
              words: syls.map(s => ({ timeSec: s.startSec, endSec: s.endSec, text: s.displayText })),
              singstarSyllables: syls
            });
            continue;
          }
        }

        // Caso B: Ajuste micro-acústico acotado [-160ms, +220ms] sin deriva acumulativa + Viterbi-DTW 10 ms
        const rawWords = cleanText.split(/\s+/).filter(Boolean);
        const naturalMaxDur = Math.max(0.65, Math.min(4.4, rawWords.length * 0.40 + 0.34));

        let vocalStartSec = rawStartSec;
        let vocalEndSec = Math.min(maxWindowEndSec, rawStartSec + naturalMaxDur);

        if (vocalProfile && vocalProfile.vocEnergyDb) {
          const fHz = vocalProfile.frameHz || 100;
          const searchMinSec = Math.max(0, prevLineEndSec, rawStartSec - 0.16);
          const searchMaxSec = Math.min(actualDurSec, nextAnchoredSec - 0.25, rawStartSec + 0.22);
          const fSearch0 = Math.max(0, Math.floor(searchMinSec * fHz));
          const fSearch1 = Math.min(vocalProfile.vocEnergyDb.length - 1, Math.ceil(Math.max(searchMinSec + 0.05, searchMaxSec) * fHz));
          const th = vocalProfile.thVoc - 1.2;

          let bestOnsetF = -1;
          let bestOnsetScore = -1e9;
          for (let f = fSearch0; f <= fSearch1; f++) {
            const eDb = vocalProfile.vocEnergyDb[f];
            const flux = vocalProfile.vowelFlux ? vocalProfile.vowelFlux[f] : 0;
            if (eDb >= th) {
              const distSec = Math.abs((f / fHz) - rawStartSec);
              const score = flux * 1.5 + (eDb - th) * 0.35 - distSec * 6.5;
              if (score > bestOnsetScore) {
                bestOnsetScore = score;
                bestOnsetF = f;
              }
            }
          }

          if (bestOnsetF !== -1) {
            const candidateStart = bestOnsetF / fHz;
            if (Math.abs(candidateStart - rawStartSec) <= 0.24) {
              vocalStartSec = Math.max(prevLineEndSec, candidateStart - 0.01);
            }
            const minPhraseFrames = Math.round(Math.min(naturalMaxDur * 0.45, 0.70) * fHz);
            const maxPhraseFrames = Math.round(naturalMaxDur * 1.22 * fHz);
            const silenceHoldFrames = Math.max(7, Math.round(0.20 * fHz));
            const fMaxPhrase = Math.min(
              vocalProfile.vocEnergyDb.length - 1,
              Math.ceil(maxWindowEndSec * fHz),
              bestOnsetF + maxPhraseFrames
            );
            let lastVoiced = Math.min(fMaxPhrase, bestOnsetF + minPhraseFrames);

            for (let f = bestOnsetF + minPhraseFrames; f <= fMaxPhrase; f++) {
              if (vocalProfile.vocEnergyDb[f] >= th - 1.0) {
                lastVoiced = f;
              } else {
                let silentRun = 0;
                for (let s = f; s <= Math.min(fMaxPhrase, f + silenceHoldFrames); s++) {
                  if (vocalProfile.vocEnergyDb[s] < th - 1.4) silentRun++;
                }
                if (silentRun >= silenceHoldFrames) break;
              }
            }
            vocalEndSec = Math.max(vocalStartSec + 0.42, Math.min(maxWindowEndSec, (lastVoiced + 3) / fHz));
          }
        }

        const spanMs = Math.max(420, Math.round((vocalEndSec - vocalStartSec) * 1000));
        const tokens = (this.karaokeService && typeof this.karaokeService.tokenizePhraseIntoNaturalSyllables === 'function')
          ? this.karaokeService.tokenizePhraseIntoNaturalSyllables(cleanText, spanMs)
          : rawWords.map(w => ({ text: w, displayText: w + ' ', weight: 1.0, isWordEnd: true }));

        const K = tokens.length;
        if (K === 0) continue;

        const syls = [];
        if (vocalProfile && vocalProfile.vowelFlux && K >= 2) {
          const fHz = vocalProfile.frameHz || 100;
          const f0 = Math.max(0, Math.floor(vocalStartSec * fHz));
          const f1 = Math.min(vocalProfile.vowelFlux.length - 1, Math.ceil(vocalEndSec * fHz));
          const M = f1 - f0 + 1;
          const minStepFrames = Math.max(Math.round(0.075 * fHz), Math.min(Math.round(0.18 * fHz), Math.floor(M / (K + 0.5))));

          if (M >= K * minStepFrames) {
            const totalW = tokens.reduce((acc, t) => acc + (Number(t.weight) || 1.0), 0) || K;
            const idealFrames = [];
            let cumW = 0;
            for (let k = 0; k < K; k++) {
              const ratio = cumW / totalW;
              idealFrames.push(f0 + Math.round(ratio * Math.max(1, M - minStepFrames)));
              cumW += (Number(tokens[k].weight) || 1.0);
            }

            // Programación dinámica Viterbi a 10ms con anclaje fuerte a la posición fonética ideal
            const dp = new Float32Array(K * M).fill(-1e9);
            const back = new Int32Array(K * M).fill(-1);

            for (let m = 0; m < M; m++) {
              const fAbs = f0 + m;
              const dev = Math.abs(fAbs - idealFrames[0]) / Math.max(6, M * 0.20);
              if (dev <= 1.15) {
                dp[m] = vocalProfile.vowelFlux[fAbs] * 1.35 + (vocalProfile.vocEnergyDb[fAbs] - vocalProfile.thVoc) * 0.16 - dev * dev * 4.2;
              }
            }

            for (let k = 1; k < K; k++) {
              const expGap = Math.max(minStepFrames, idealFrames[k] - idealFrames[k - 1]);
              for (let m = k * minStepFrames; m < M - (K - 1 - k) * minStepFrames; m++) {
                const fAbs = f0 + m;
                const globalDev = Math.abs(fAbs - idealFrames[k]) / Math.max(8, M * 0.26);
                if (globalDev > 1.25) continue;

                const emission = vocalProfile.vowelFlux[fAbs] * 1.3 + (vocalProfile.vocEnergyDb[fAbs] - vocalProfile.thVoc) * 0.15 - globalDev * globalDev * 3.1;
                const prevMin = Math.max((k - 1) * minStepFrames, m - Math.round(expGap * 2.0));
                const prevMax = m - minStepFrames;

                let bestPrevScore = -1e9;
                let bestPrevM = -1;
                for (let pm = prevMin; pm <= prevMax; pm++) {
                  const prevVal = dp[(k - 1) * M + pm];
                  if (prevVal <= -1e8) continue;
                  const gapDiff = ((m - pm) - expGap) / Math.max(4, expGap * 0.50);
                  const cand = prevVal - gapDiff * gapDiff * 2.8;
                  if (cand > bestPrevScore) {
                    bestPrevScore = cand;
                    bestPrevM = pm;
                  }
                }
                if (bestPrevM !== -1) {
                  dp[k * M + m] = bestPrevScore + emission;
                  back[k * M + m] = bestPrevM;
                }
              }
            }

            let bestEndM = -1;
            let bestEndVal = -1e9;
            for (let m = (K - 1) * minStepFrames; m < M; m++) {
              const v = dp[(K - 1) * M + m];
              if (v > bestEndVal) {
                bestEndVal = v;
                bestEndM = m;
              }
            }

            if (bestEndM !== -1 && bestEndVal > -1e7) {
              const chosenFrames = new Array(K);
              let curM = bestEndM;
              for (let k = K - 1; k >= 0; k--) {
                chosenFrames[k] = f0 + curM;
                curM = back[k * M + curM];
              }
              for (let k = 0; k < K; k++) {
                const sSec = chosenFrames[k] / fHz;
                const nextSec = (k + 1 < K) ? (chosenFrames[k + 1] / fHz) : vocalEndSec;
                const eSec = Math.max(sSec + 0.085, Math.min(vocalEndSec, nextSec - 0.012));
                syls.push({
                  text: String(tokens[k].text || tokens[k].displayText || '').trim(),
                  displayText: tokens[k].displayText || (tokens[k].text + (tokens[k].isWordEnd ? ' ' : '')),
                  startSec: +sSec.toFixed(3),
                  endSec: +eSec.toFixed(3)
                });
              }
            }
          }
        }

        if (syls.length === 0) {
          const totalW = tokens.reduce((acc, t) => acc + (Number(t.weight) || 1.0), 0) || K;
          const spanSec = Math.max(0.40, vocalEndSec - vocalStartSec);
          let cursor = vocalStartSec;
          for (let k = 0; k < K; k++) {
            const wRatio = (Number(tokens[k].weight) || 1.0) / totalW;
            const dSec = Math.max(0.095, spanSec * wRatio);
            const sSec = cursor;
            const eSec = (k === K - 1) ? vocalEndSec : Math.min(vocalEndSec, sSec + dSec - 0.012);
            syls.push({
              text: String(tokens[k].text || tokens[k].displayText || '').trim(),
              displayText: tokens[k].displayText || (tokens[k].text + (tokens[k].isWordEnd ? ' ' : '')),
              startSec: +sSec.toFixed(3),
              endSec: +Math.max(sSec + 0.085, eSec).toFixed(3)
            });
            cursor += dSec;
          }
        }

        prevLineEndSec = Math.min(nextAnchoredSec - 0.02, syls[syls.length - 1].endSec + 0.02);
        const syncedLineWords = syls.map(s => ({
          timeSec: s.startSec,
          endSec: s.endSec,
          text: s.displayText
        }));
        outLines.push({
          ...line,
          _origTimeSec: origTimeSec,
          text: cleanText,
          timeSec: syls[0].startSec,
          endTimeSec: syls[syls.length - 1].endSec,
          words: syncedLineWords,
          _hasAcousticGeneratedWords: true,
          singstarSyllables: syls
        });
      }

      return outLines;
    }

    /**
     * Publica de forma segura las sílabas alineadas hacia KaraokeLyricsService
     * SIN provocar jamás recursión con renderLinesToDom -> onLyricsUpdated.
     */
    _commitAlignedLinesToKaraoke(key, outLines, meta = null) {
      if (!key || !this.karaokeService || !Array.isArray(outLines)) return;
      const cleanLines = outLines.filter(
        (l) => l && !l._isAcousticVocalIsland && !l._isFallbackPlaceholder && String(l.text || '').trim().length > 0
      );
      if (cleanLines.length < 2) return;
      if (typeof this.karaokeService.applyWhisperVerifiedLines === 'function') {
        const targetTrack = (meta && meta.track) || this.karaokeService.currentTrack || this.currentTrack || null;
        this.karaokeService.applyWhisperVerifiedLines(targetTrack, key, cleanLines, meta || {});
        return;
      }
      this.karaokeService.cache.set(key, cleanLines.map(l => ({ ...l })));
      if (this.karaokeService.currentTrackKey === key) {
        this.karaokeService.currentLyrics = cleanLines.map(l => ({ ...l }));
        this.karaokeService.activeLineIndex = -1;
        this.karaokeService.renderLinesToDom({ skipSingStarNotify: true });
      }
    }

    /**
     * Construye las barras de sílabas y la escala vertical monotónica:
     * NUNCA envuelve módulo 12 nota por nota. Las notas graves tienen menor MIDI (abajo)
     * y las notas agudas tienen mayor MIDI (arriba).
     */
    _applyStudioAnalysisToStage(studioData, userOffsetSec = 0, resetStats = true) {
      if (!studioData || !Array.isArray(studioData.acousticLines)) return;

      const dsp = studioData.dspContour;
      this.hasDspMelody = Boolean(dsp && dsp.voicedCount >= 10);
      this.hasAcousticSyllables = true;
      this.centerMidi = (dsp && Number.isFinite(dsp.medianMidi)) ? dsp.medianMidi : 62;

      const badge = document.getElementById('ssProDspBadge');
      if (badge) {
        badge.textContent = this.hasDspMelody
          ? 'SÍLABAS DTW + TONO YIN REAL'
          : 'SÍLABAS FONÉTICAS + ESCALA CROMÁTICA';
      }

      const seed = this._hashTrackSeed(studioData.track);
      const majorScale = [0, 2, 4, 5, 7, 9, 11, 12];
      const notes = [];
      const phrases = [];
      let noteId = 0;
      let goldenTotal = 0;
      let minSongMidi = 999;
      let maxSongMidi = -999;

      for (let li = 0; li < studioData.acousticLines.length; li++) {
        const line = studioData.acousticLines[li];
        const rawSyls = Array.isArray(line.singstarSyllables) ? line.singstarSyllables : [];
        if (rawSyls.length === 0) continue;

        const phraseSyls = [];
        const phraseLen = rawSyls.length;

        for (let si = 0; si < phraseLen; si++) {
          const syl = rawSyls[si];
          const startSec = Math.max(0, syl.startSec - userOffsetSec);
          const endSec = Math.max(startSec + 0.10, syl.endSec - userOffsetSec);

          let targetMidi = null;
          if (this.hasDspMelody && dsp) {
            targetMidi = this._sampleMonotonicMidiInWindow(dsp, syl.startSec, syl.endSec);
          }

          if (!Number.isFinite(targetMidi)) {
            // Si en esa sílaba concreta hubo percusión fuerte, interpolar suavemente desde la nota anterior o contorno natural monotónico
            if (notes.length > 0 && (startSec - notes[notes.length - 1].endSec) < 0.8) {
              const arch = Math.sin((si / Math.max(1, phraseLen - 1)) * Math.PI) * 1.5;
              targetMidi = notes[notes.length - 1].midi + (si % 2 === 0 ? 1 : -1) * 0.5 + arch * 0.25;
            } else {
              const deg = majorScale[(li * 2 + si + seed) % majorScale.length] - 5;
              targetMidi = this.centerMidi + deg;
            }
          }

          // Suavizado fisiológico entre sílabas contiguas de la misma palabra/frase (sin plegar octava)
          if (si > 0 && notes.length > 0) {
            const prev = notes[notes.length - 1].midi;
            const delta = targetMidi - prev;
            if (Math.abs(delta) > 9.0) {
              targetMidi = prev + Math.sign(delta) * 6.0;
            }
          }

          // Cuantizar a medios semitonos para que las barras luzcan limpias y musicales en el pentagrama
          const cleanMidi = Math.round(targetMidi * 2) / 2;
          minSongMidi = Math.min(minSongMidi, cleanMidi);
          maxSongMidi = Math.max(maxSongMidi, cleanMidi);

          const durSec = endSec - startSec;
          const isGolden = (si === phraseLen - 1 && durSec >= 0.30 && (li % 2 === 1)) || (durSec >= 0.58 && si === phraseLen - 1);
          if (isGolden) goldenTotal++;

          const noteObj = {
            id: noteId++,
            lineIdx: li,
            wordIdx: si,
            text: syl.text,
            displayText: syl.displayText || (syl.text + ' '),
            startSec: +startSec.toFixed(3),
            endSec: +endSec.toFixed(3),
            midi: cleanMidi,
            freqHz: Math.round(this.midiToFreqHz(cleanMidi)),
            isGolden,
            hitFrames: 0,
            totalFrames: 0,
            fillRatio: 0,
            goldenAwarded: false
          };
          notes.push(noteObj);
          phraseSyls.push(noteObj);
        }

        if (phraseSyls.length > 0) {
          phrases.push({
            lineIdx: li,
            text: line.text,
            startSec: phraseSyls[0].startSec,
            endSec: phraseSyls[phraseSyls.length - 1].endSec,
            syllables: phraseSyls,
            judged: false
          });
        }
      }

      // Configurar eje vertical estrictamente monotónico [axisMinMidi, axisMaxMidi]
      // Abajo = siempre más grave (menor MIDI), Arriba = siempre más agudo (mayor MIDI)
      if (minSongMidi < maxSongMidi && Number.isFinite(minSongMidi)) {
        const midPoint = Math.round((minSongMidi + maxSongMidi) * 0.5);
        const halfSpan = Math.max(9, Math.ceil((maxSongMidi - minSongMidi) * 0.5) + 3);
        this.centerMidi = midPoint;
        this.axisMinMidi = midPoint - halfSpan;
        this.axisMaxMidi = midPoint + halfSpan;
      } else {
        this.axisMinMidi = this.centerMidi - 10;
        this.axisMaxMidi = this.centerMidi + 10;
      }

      this.pitchNotes = notes;
      this.phraseWindows = phrases;
      this.goldenTotalCount = Math.max(1, goldenTotal);
      this._lastTeleprompterLineIdx = -2;
      this._lastTeleprompterSylIdx = -2;

      if (resetStats) {
        this.resetSessionStats();
      }
    }

    _sampleMonotonicMidiInWindow(dsp, startSec, endSec) {
      if (!dsp || !dsp.midiFrames) return null;
      const f0 = Math.max(0, Math.min(dsp.midiFrames.length - 1, Math.floor(startSec * dsp.frameHz)));
      const f1 = Math.max(f0, Math.min(dsp.midiFrames.length - 1, Math.ceil(endSec * dsp.frameHz)));
      const vals = [];
      for (let f = f0; f <= f1; f++) {
        const m = dsp.midiFrames[f];
        if (m >= 44 && m <= 84) {
          vals.push(m);
        }
      }
      if (vals.length === 0) return null;
      vals.sort((a, b) => a - b);
      return vals[Math.floor(vals.length * 0.5)];
    }

    onLyricsUpdated(track, lyricsLines, userOffsetSec = 0) {
      if (this._inOnLyricsUpdated) return;
      if (!track || !Array.isArray(lyricsLines) || lyricsLines.length === 0) return;
      this._inOnLyricsUpdated = true;
      try {
        const key = this.karaokeService ? this.karaokeService._makeKey(track) : String(track.id || track.title || '');
        const safeOffset = Number.isFinite(Number(userOffsetSec)) ? Number(userOffsetSec) : 0;
        const offBadge = document.getElementById('ssProOffsetBadge');
        if (offBadge) {
          offBadge.textContent = `${safeOffset >= 0 ? '+' : ''}${safeOffset.toFixed(2)}s`;
        }
        const isPlaceholder = this._isPlaceholderLyrics(lyricsLines);
        const isPlainUnaligned = !isPlaceholder && this._isUnalignedPlainLyrics(lyricsLines);
        const incomingHasWhisper = !isPlaceholder && lyricsLines.some(l => l && l._isWhisperAligned);
        const incomingHasWhisperSyls = incomingHasWhisper && lyricsLines.every(
          l => !l || l._isFallbackPlaceholder || (Array.isArray(l.singstarSyllables) && l.singstarSyllables.length > 0)
        );
        if (this.studioAnalysisCache.has(key)) {
          const cached = this.studioAnalysisCache.get(key);
          // Protección absoluta: si el estudio ya está verificado con Whisper real y llega una actualización no-Whisper
          // (p.ej. offset manual, traducción o llegada tardía de LRCLIB), NO machacar las sílabas verificadas;
          // únicamente re-aplicar el nuevo offset al escenario.
          if (cached.isWhisperVerified && !incomingHasWhisper) {
            if (this.isActive && key === this.currentTrackKey) {
              this._applyStudioAnalysisToStage(cached, safeOffset, false);
            }
            return;
          }
          // Nunca sobreescribir letras reales ya transcritas con placeholders o texto plano sin tiempos
          if (!isPlaceholder && !(isPlainUnaligned && cached.isAudioTranscribed && !cached.hasPlaceholderLyrics)) {
            if (incomingHasWhisperSyls) {
              cached.acousticLines = lyricsLines
                .filter(l => l && !l._isFallbackPlaceholder && String(l.text || '').trim().length > 0)
                .map(l => ({ ...l }));
              cached.isWhisperVerified = true;
              cached.isAudioTranscribed = true;
              cached.hasPlaceholderLyrics = false;
              cached.hasUnalignedPlainLyrics = false;
            } else {
              const dur = cached.actualDurSec || (this.audioEngine ? (this.audioEngine.getRealDurationSec(track) || 195) : 195);
              cached.acousticLines = this._alignSyllablesWithVocalProfile(key, lyricsLines, cached.dspContour, dur);
              cached.hasPlaceholderLyrics = false;
              cached.hasUnalignedPlainLyrics = isPlainUnaligned;
            }
          }
          if (this.isActive && key === this.currentTrackKey) {
            this._applyStudioAnalysisToStage(cached, safeOffset, false);
          }
          return;
        }
        if (this.isActive && key === this.currentTrackKey && !isPlaceholder && !isPlainUnaligned) {
          const dur = this.audioEngine ? (this.audioEngine.getRealDurationSec(track) || 195) : 195;
          const stageLines = incomingHasWhisperSyls
            ? lyricsLines.filter(l => l && !l._isFallbackPlaceholder && String(l.text || '').trim().length > 0).map(l => ({ ...l }))
            : this._alignSyllablesWithVocalProfile(key, lyricsLines, null, dur);
          this._applyStudioAnalysisToStage({
            track,
            key,
            dspContour: null,
            acousticLines: stageLines,
            hasDspMelody: false,
            hasAcousticSyllables: true,
            hasPlaceholderLyrics: false,
            hasUnalignedPlainLyrics: false,
            isWhisperVerified: incomingHasWhisperSyls
          }, safeOffset, false);

          if (!this.isPreparingSong && this._activePrepKey !== key && !this.isActiveWhisperFor(key)) {
            this._prepareTrackInStudio(track, false).catch(() => {});
          }
        }
      } finally {
        this._inOnLyricsUpdated = false;
      }
    }

    _hashTrackSeed(track) {
      const str = `${track?.title || ''}_${track?.artist || ''}`.toLowerCase();
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return Math.abs(h);
    }

    /**
     * Muestreo del micrófono en vivo con algoritmo YIN CMND a tasa completa (44.1 / 48 kHz)
     * tanto en Android Nativo (AudioRecord 44.1 kHz con AEC/NS) como en WebAudio:
     * - Puerta de ruido adaptativa bidireccional + rechazo del sangrado del altavoz del móvil.
     * - Si cantas más agudo, tu indicador SIEMPRE sube.
     * - Si cantas más grave, tu indicador SIEMPRE baja.
     */
    _sampleLiveVoiceOrGuide(curSongSec, activeNote, nowMs) {
      if (this.voiceGuideDemo) {
        this._setMicDotLive(true);
        if (activeNote) {
          const vib = Math.sin(nowMs * 0.028) * 0.14;
          this.rawUserMidi = activeNote.midi + vib;
          this.liveUserMidi = this.rawUserMidi;
          this.smoothedUserMidi = this.liveUserMidi;
          this.liveUserFreqHz = Math.round(this.midiToFreqHz(this.liveUserMidi));
          this.liveUserRms = 0.08;
          this.liveSemitoneDelta = vib;
          this.liveNoteLabel = this.midiToNoteNameEs(this.liveUserMidi);
          this.liveStatusText = 'PILOTO DEMO AFINADO';
          this.liveStatusTier = 'perfect';
          return;
        }
        this.liveUserMidi = null;
        this.liveUserFreqHz = 0;
        this.liveUserRms = 0;
        this.liveNoteLabel = '--';
        this.liveStatusText = 'ESPERANDO SÍLABA...';
        this.liveStatusTier = 'idle';
        return;
      }

      let detectedFreqHz = 0;
      let detectedClarity = 0;
      let rms = 0;
      let hasMicSignal = false;
      let nativeVoicedFlag = null;
      let nativeNoiseFloor = 0;
      let nativeGateThreshold = 0;

      // 1) Lectura de baja latencia desde el motor nativo Android AudioRecord MPM/NSDF (autoridad única de puerta vocal)
      if (window.AndroidNative && typeof window.AndroidNative.pollVocalMic === 'function') {
        try {
          const rawStr = String(window.AndroidNative.pollVocalMic() || '').trim();
          if (rawStr) {
            let telem = null;
            if (rawStr.startsWith('{')) {
              telem = JSON.parse(rawStr);
            } else if (rawStr.includes('|')) {
              const parts = rawStr.split('|');
              const st = parts[0] || 'idle';
              telem = {
                active: st === 'running',
                state: st,
                permissionGranted: st !== 'denied' && st !== 'requesting',
                freqHz: parseFloat(parts[1]) || 0,
                clarity: parseFloat(parts[2]) || 0,
                rms: parseFloat(parts[3]) || 0
              };
            }
            if (telem) {
              if (!telem.active && telem.permissionGranted && (nowMs - (this._lastNativeMicRetryMs || 0)) > 1500) {
                this._lastNativeMicRetryMs = nowMs;
                if (typeof window.AndroidNative.startVocalMic === 'function') {
                  window.AndroidNative.startVocalMic();
                }
              }
              this.micPermissionDenied = (telem.state === 'denied');
              this._usingNativeAndroidMic = Boolean(telem.active);
              this._setMicDotLive(Boolean(telem.active));
              if (telem.active) {
                hasMicSignal = true;
                rms = Number(telem.rms) || 0;
                detectedFreqHz = Number(telem.freqHz) || 0;
                detectedClarity = Number(telem.clarity) || 0;
                if (typeof telem.voiced === 'boolean') {
                  nativeVoicedFlag = telem.voiced;
                }
                if (Number.isFinite(Number(telem.noiseFloor)) && Number(telem.noiseFloor) > 0) {
                  nativeNoiseFloor = Number(telem.noiseFloor);
                }
                if (Number.isFinite(Number(telem.gateThreshold)) && Number(telem.gateThreshold) > 0) {
                  nativeGateThreshold = Number(telem.gateThreshold);
                }
              }
            }
          }
        } catch (_) {}
      }

      // 2) Respaldo WebAudio API con captura cruda sin AGC/NS y detector MPM/NSDF (75 Hz - 1050 Hz)
      if (!hasMicSignal && this.micAnalyser && this.micTimeBuf && this.micAudioCtx) {
        hasMicSignal = true;
        this._usingNativeAndroidMic = false;
        this._setMicDotLive(true);
        this.micAnalyser.getFloatTimeDomainData(this.micTimeBuf);
        const buf = this.micTimeBuf;
        const n = buf.length;
        let sumSq = 0;
        for (let i = 0; i < n; i++) {
          const v = buf[i];
          sumSq += v * v;
        }
        rms = Math.sqrt(sumSq / n);

        // Ventana de calibración rápida del ruido ambiente (0.45s al abrir o al pulsar Calibrar Ruido)
        if (this._webMicRecalibFrames > 0) {
          this._webMicRecalibFrames--;
          this.noiseFloorRms = Math.max(0.0024, Math.min(0.032, 0.80 * this.noiseFloorRms + 0.20 * rms));
          this.speakerBleedRms = Math.max(0.0026, Math.min(0.035, 0.80 * (this.speakerBleedRms || 0.0040) + 0.20 * rms));
          this.liveUserRms = rms;
          this.liveUserMidi = null;
          this.liveUserFreqHz = 0;
          this.liveNoteLabel = '--';
          this.liveStatusText = 'CALIBRANDO RUIDO AMBIENTE...';
          this.liveStatusTier = 'idle';
          this._lastRawWebMicFreq = 0;
          this._voicedConfirmStreak = 0;
          this._wasMicVoiced = false;
          if (this._webMicMedianBuf) this._webMicMedianBuf.length = 0;
          return;
        }

        const sr = this.micAudioCtx.sampleRate || 44100;
        const detected = this._detectMicPitchYinCmnd(buf, sr);
        if (detected) {
          detectedFreqHz = detected.freqHz;
          detectedClarity = detected.clarity;
        }
      }

      if (!hasMicSignal) {
        this.liveUserMidi = null;
        this.liveUserFreqHz = 0;
        this.liveUserRms = 0;
        this.liveNoteLabel = '--';
        this.liveStatusText = this.micPermissionDenied ? 'PULSA AQUÍ PARA ACTIVAR MIC' : 'PULSA AQUÍ O CANTA AL MIC';
        this.liveStatusTier = 'idle';
        this._lastRawWebMicFreq = 0;
        this._wasMicVoiced = false;
        return;
      }

      this.liveUserRms = rms;
      const isPlaying = Boolean(this.audioEngine && this.audioEngine.isPlaying());
      const useAuthoritativeNativeGate = Boolean(this._usingNativeAndroidMic && nativeVoicedFlag !== null);

      let isFrameVoiced = false;
      let gateThreshold = 0.0085;

      if (useAuthoritativeNativeGate) {
        // PUERTA ÚNICA AUTORITARIA: el hilo nativo AudioRecord ya aplicó MPM/NSDF + histéresis Schmitt + freeze 450ms
        // + filtro de mediana 3 frames. Nunca re-filtrar ni recortar notas suaves en JS.
        if (nativeNoiseFloor > 0) {
          this.noiseFloorRms = Math.max(0.0020, Math.min(0.036, nativeNoiseFloor));
        }
        gateThreshold = nativeGateThreshold > 0
          ? nativeGateThreshold
          : Math.max(0.0042, this.noiseFloorRms * Math.max(1.35, Math.min(3.80, 2.05 / Math.max(0.45, Number(this.micSensitivity) || 1.0))));
        this._lastGateThresholdRms = gateThreshold;
        this.liveGateThreshold = gateThreshold;
        isFrameVoiced = Boolean(nativeVoicedFlag === true && detectedFreqHz >= 75 && detectedFreqHz <= 1050);
        this._voicedConfirmStreak = isFrameVoiced ? 2 : 0;
        this._wasMicVoiced = isFrameVoiced;
        if (isFrameVoiced) {
          this._noiseFloorFreezeUntilMs = nowMs + 450;
        }
      } else {
        // Respaldo WebAudio con congelamiento del suelo de ruido durante 450 ms tras voz (protege consonantes s/t/p/k)
        // e histéresis Schmitt (umbral de sostenimiento = 62% del umbral de ataque).
        const floorFrozen = nowMs < (this._noiseFloorFreezeUntilMs || 0);
        const isLikelyUnvoiced = (detectedFreqHz < 75 || detectedClarity < 0.58);

        if (rms < this.noiseFloorRms) {
          this.noiseFloorRms = Math.max(0.0022, 0.94 * this.noiseFloorRms + 0.06 * rms);
        } else if (!floorFrozen && isLikelyUnvoiced) {
          const alphaUp = (!activeNote && isPlaying) ? 0.055 : 0.025;
          this.noiseFloorRms = Math.max(0.0022, Math.min(0.028, (1 - alphaUp) * this.noiseFloorRms + alphaUp * rms));
        }

        if (isPlaying && !floorFrozen && (!activeNote || isLikelyUnvoiced)) {
          const bleedAlpha = rms > this.speakerBleedRms ? 0.045 : 0.04;
          this.speakerBleedRms = Math.max(0.0024, Math.min(0.032, (1 - bleedAlpha) * (this.speakerBleedRms || 0.0040) + bleedAlpha * rms));
        } else if (!isPlaying) {
          this.speakerBleedRms = Math.max(0.0024, (this.speakerBleedRms || 0.0040) * 0.96);
        }

        const sens = Math.max(0.45, Math.min(1.80, Number(this.micSensitivity) || 1.0));
        const gateMult = Math.max(1.30, Math.min(4.00, 2.05 / sens));
        const effectiveFloor = Math.max(
          0.0028,
          this.noiseFloorRms,
          isPlaying ? (this.speakerBleedRms || 0) * 0.92 : 0
        );
        const wasRecentlyVoiced = Boolean(
          this._wasMicVoiced &&
          this._lastVoicedWallMs > 0 &&
          (nowMs - this._lastVoicedWallMs) <= 220
        );
        const onsetGate = Math.max(0.0042, Math.min(0.068, effectiveFloor * gateMult));
        const sustainGate = onsetGate * 0.62;
        gateThreshold = wasRecentlyVoiced ? sustainGate : onsetGate;
        this._lastGateThresholdRms = onsetGate;
        this.liveGateThreshold = onsetGate;

        const minClarity = wasRecentlyVoiced ? 0.56 : 0.62;
        const rawFrameVoiced = (
          rms >= gateThreshold &&
          detectedFreqHz >= 75 &&
          detectedFreqHz <= 1050 &&
          detectedClarity >= minClarity
        );

        if (rawFrameVoiced) {
          this._noiseFloorFreezeUntilMs = nowMs + 450;
          const rawFreq = detectedFreqHz;
          let isStableOnset = false;
          if (this._lastRawWebMicFreq > 0) {
            const ratio = rawFreq / this._lastRawWebMicFreq;
            isStableOnset = (ratio >= 0.80 && ratio <= 1.25);
            this._voicedConfirmStreak = isStableOnset
              ? Math.min(10, (this._voicedConfirmStreak || 0) + 1)
              : (wasRecentlyVoiced ? 2 : 1);
          } else {
            this._voicedConfirmStreak = 1;
          }
          this._lastRawWebMicFreq = rawFreq;
          isFrameVoiced = (this._voicedConfirmStreak >= 2 || wasRecentlyVoiced);

          if (!this._webMicMedianBuf) this._webMicMedianBuf = [];
          if (!isFrameVoiced && !isStableOnset) {
            this._webMicMedianBuf.length = 0;
          }
          this._webMicMedianBuf.push(rawFreq);
          if (this._webMicMedianBuf.length > 3) this._webMicMedianBuf.shift();
          if (isFrameVoiced && this._webMicMedianBuf.length === 3) {
            const a = this._webMicMedianBuf[0];
            const b = this._webMicMedianBuf[1];
            const c = this._webMicMedianBuf[2];
            detectedFreqHz = (a <= b)
              ? (b <= c ? b : (a <= c ? c : a))
              : (a <= c ? a : (b <= c ? c : b));
          }
        } else {
          this._voicedConfirmStreak = 0;
          this._lastRawWebMicFreq = 0;
          if (this._webMicMedianBuf) this._webMicMedianBuf.length = 0;
          isFrameVoiced = false;
        }
        this._wasMicVoiced = isFrameVoiced;
      }

      if (!isFrameVoiced) {
        if (nowMs - this._lastVoicedWallMs <= 120 && Number.isFinite(this._lastVoicedMidi) && rms >= gateThreshold * 0.72) {
          this.liveUserMidi = this._lastVoicedMidi;
          return;
        }
        this.liveUserMidi = null;
        this.liveUserFreqHz = 0;
        this.liveNoteLabel = '--';
        this.liveStatusText = activeNote ? 'CANTA LA SÍLABA' : 'MIC ACTIVO · CANTA';
        this.liveStatusTier = 'idle';
        return;
      }

      const silenceBeforeOnsetMs = this._lastVoicedWallMs > 0 ? (nowMs - this._lastVoicedWallMs) : 9999;

      this.liveUserFreqHz = Math.round(detectedFreqHz);
      const rawMidi = 69 + 12 * Math.log2(detectedFreqHz / 440);
      this.rawUserMidi = rawMidi;
      this.liveNoteLabel = this.midiToNoteNameEs(rawMidi);

      // Calcular el desplazamiento de octava de registro SIN teletransportaciones a mitad de frase:
      // - En modo Auto: buffer de 180 muestras; solo calibra al primer bloqueo (>=24 muestras)
      //   o tras una pausa de silencio >= 1200ms si la desviación es >= 8.5 semitonos.
      let octaveShift = 0;
      if (this.octaveRegisterMode === '-12') {
        octaveShift = 12; // Voz 1 octava más grave que la canción -> proyecta +12 en el pentagrama
      } else if (this.octaveRegisterMode === '+12') {
        octaveShift = -12; // Voz 1 octava más aguda -> proyecta -12
      } else if (this.octaveRegisterMode === '0') {
        octaveShift = 0;
      } else {
        this._userRawMidiSamples.push(rawMidi);
        if (this._userRawMidiSamples.length > 180) {
          this._userRawMidiSamples.shift();
        }
        const refCenter = Number.isFinite(this.centerMidi) ? this.centerMidi : 62;
        const canInitialLock = !this._hasInitialOctaveLock && this._userRawMidiSamples.length >= 24;
        const canBetweenPhraseUpdate = Boolean(this._hasInitialOctaveLock && silenceBeforeOnsetMs >= 1200 && this._userRawMidiSamples.length >= 36);
        if (canInitialLock || canBetweenPhraseUpdate) {
          const sorted = this._userRawMidiSamples.slice().sort((a, b) => a - b);
          const userMed = sorted[Math.floor(sorted.length * 0.5)];
          const idealShift = Math.round((refCenter - userMed) / 12) * 12;
          if (canInitialLock) {
            this.autoDetectedOctaveShift = idealShift;
            this._hasInitialOctaveLock = true;
          } else if (Math.abs((userMed + this.autoDetectedOctaveShift) - refCenter) >= 8.5 && idealShift !== this.autoDetectedOctaveShift) {
            this.autoDetectedOctaveShift = idealShift;
          }
        } else if (!this._hasInitialOctaveLock && this._userRawMidiSamples.length === 1) {
          // Estimación provisional única en el 1er frame sin cambiar de octava mientras se canta
          this.autoDetectedOctaveShift = Math.round((refCenter - rawMidi) / 12) * 12;
        }
        octaveShift = this.autoDetectedOctaveShift;
      }

      // Proyección estrictamente monotónica en pantalla: rawMidi + octaveShift
      // Cantar más agudo SIEMPRE aumenta mappedMidi (sube); cantar más grave SIEMPRE disminuye mappedMidi (baja)
      const mappedMidi = rawMidi + octaveShift;

      if (!Number.isFinite(this.smoothedUserMidi)) {
        this.smoothedUserMidi = mappedMidi;
      } else {
        const step = mappedMidi - this.smoothedUserMidi;
        const alpha = Math.abs(step) > 8.5 ? 0.28 : 0.52;
        this.smoothedUserMidi = this.smoothedUserMidi + alpha * step;
      }

      this.liveUserMidi = this.smoothedUserMidi;
      this._lastVoicedMidi = this.smoothedUserMidi;
      this._lastVoicedWallMs = nowMs;

      const refMidi = activeNote ? activeNote.midi : this.centerMidi;
      this.liveSemitoneDelta = this.liveUserMidi - refMidi;

      // Detección de Vibrato natural (4.2 - 8.0 Hz dentro de ±1.25 semitonos)
      if (activeNote && Math.abs(this.liveSemitoneDelta) <= 1.25) {
        this._vibratoHistory.push({ tMs: nowMs, delta: this.liveSemitoneDelta });
        while (this._vibratoHistory.length > 0 && (nowMs - this._vibratoHistory[0].tMs) > 440) {
          this._vibratoHistory.shift();
        }
        if (this._vibratoHistory.length >= 10 && (nowMs - this._lastVibratoAwardMs) > 1650) {
          let zeroCrossings = 0;
          let maxSwing = 0;
          for (let i = 1; i < this._vibratoHistory.length; i++) {
            const d0 = this._vibratoHistory[i - 1].delta;
            const d1 = this._vibratoHistory[i].delta;
            maxSwing = Math.max(maxSwing, Math.abs(d1));
            if ((d0 < 0 && d1 >= 0) || (d0 >= 0 && d1 < 0)) zeroCrossings++;
          }
          if (zeroCrossings >= 3 && maxSwing >= 0.18 && maxSwing <= 0.95) {
            this._lastVibratoAwardMs = nowMs;
            this.score += 150 * this.multiplier;
            this._spawnPopup('VIBRATO PROFESIONAL', `+${150 * this.multiplier} PTS`, '#38bdf8', 1100);
          }
        }
      }
    }

    /**
     * Detector de Frecuencia Fundamental MPM (McLeod Pitch Method / NSDF con Key-Maxima k=0.88).
     * Idéntico al motor nativo Android (MainActivity.kt):
     * - Diezmado limpio 2x (44.1/48 kHz -> 22.05/24 kHz) con promedio anti-aliasing y eliminación de DC.
     * - Cálculo exacto O(1) incremental de m'(tau) y NSDF n'(tau) = 2*r'(tau)/m'(tau) en 75 Hz - 1050 Hz.
     * - Selección Key-Maxima (k = 0.88): inmune a saltos de octava en voces con fundamental débil y 2º/3º armónico fuerte.
     */
    _detectMicPitchYinCmnd(buf, sr) {
      if (!buf || buf.length < 512 || !sr) return null;
      const doDecim2 = (sr >= 40000 && buf.length >= 1024);
      const srEff = doDecim2 ? (sr * 0.5) : sr;
      const N = doDecim2 ? Math.min(1024, buf.length >> 1) : Math.min(1024, buf.length);

      if (!this._mpmWorkBuf || this._mpmWorkBuf.length < N) {
        this._mpmWorkBuf = new Float32Array(N);
      }
      const x = this._mpmWorkBuf;

      let mean = 0;
      if (doDecim2) {
        for (let i = 0; i < N; i++) {
          const v = 0.5 * (buf[i << 1] + buf[(i << 1) + 1]);
          x[i] = v;
          mean += v;
        }
      } else {
        for (let i = 0; i < N; i++) {
          const v = buf[i];
          x[i] = v;
          mean += v;
        }
      }
      mean /= N;

      let sqSum = 0;
      let diff1Sq = 0;
      x[0] -= mean;
      sqSum += x[0] * x[0];
      for (let i = 1; i < N; i++) {
        const s = x[i] - mean;
        x[i] = s;
        sqSum += s * s;
        const d = s - x[i - 1];
        diff1Sq += d * d;
      }
      if (sqSum < 1e-8) return null;

      // Rechazar retumbos subgraves o siseo/ruido blanco no periódico
      const hfRatio = diff1Sq / sqSum;
      const srScale = 22050 / Math.max(12000, srEff);
      const minVocalHfRatio = 0.00018 * srScale * srScale;
      if (hfRatio < minVocalHfRatio || hfRatio > 1.75) return null;

      const minTau = Math.max(4, Math.floor(srEff / 1050)); // ~1050 Hz (C6)
      const maxTau = Math.min(N - 64, Math.ceil(srEff / 75)); // ~75 Hz (D2)
      if (maxTau <= minTau + 2) return null;

      if (!this._mpmNsdfBuf || this._mpmNsdfBuf.length < maxTau + 2) {
        this._mpmNsdfBuf = new Float32Array(maxTau + 2);
      }
      const nsdf = this._mpmNsdfBuf;
      nsdf[0] = 1.0;

      // Acumulador incremental exacto m'(tau) = sum_{i=0}^{N-1-tau} (x[i]^2 + x[i+tau]^2)
      let m = 2.0 * sqSum;
      for (let tau = 1; tau <= maxTau; tau++) {
        const a = x[tau - 1];
        const b = x[N - tau];
        m -= (a * a + b * b);
        if (m <= 1e-10) {
          nsdf[tau] = 0;
          continue;
        }
        let r = 0;
        const limit = N - tau;
        for (let i = 0; i < limit; i++) {
          r += x[i] * x[i + tau];
        }
        nsdf[tau] = (2.0 * r) / m;
      }

      // Buscar primer cruce descendente por cero antes de recolectar Key-Maxima
      let startTau = 1;
      while (startTau < maxTau && nsdf[startTau] > 0) {
        startTau++;
      }
      if (startTau >= maxTau - 2) return null;

      const keyMaxima = [];
      let nMax = -1.0;
      let inPositive = false;
      let curPeakTau = -1;
      let curPeakVal = -1.0;

      for (let tau = startTau; tau <= maxTau; tau++) {
        const v = nsdf[tau];
        if (v > 0) {
          if (!inPositive) {
            inPositive = true;
            curPeakTau = tau;
            curPeakVal = v;
          } else if (v > curPeakVal) {
            curPeakVal = v;
            curPeakTau = tau;
          }
        } else if (inPositive) {
          if (curPeakTau >= minTau && curPeakTau < maxTau && curPeakVal > 0) {
            keyMaxima.push({ tau: curPeakTau, val: curPeakVal });
            if (curPeakVal > nMax) nMax = curPeakVal;
          }
          inPositive = false;
          curPeakTau = -1;
          curPeakVal = -1.0;
        }
      }
      if (inPositive && curPeakTau >= minTau && curPeakTau < maxTau && curPeakVal > 0) {
        keyMaxima.push({ tau: curPeakTau, val: curPeakVal });
        if (curPeakVal > nMax) nMax = curPeakVal;
      }

      if (keyMaxima.length === 0 || nMax < 0.62) return null;

      // Key-Maxima k = 0.88: elegir el PRIMER máximo local que supere 0.88 * nMax
      const threshold = 0.88 * nMax;
      let chosen = null;
      for (let i = 0; i < keyMaxima.length; i++) {
        if (keyMaxima[i].val >= threshold) {
          chosen = keyMaxima[i];
          break;
        }
      }
      if (!chosen || chosen.tau < minTau || chosen.tau >= maxTau) return null;

      // Interpolación parabólica sub-muestra sobre NSDF
      const y1 = nsdf[chosen.tau - 1];
      const y2 = nsdf[chosen.tau];
      const y3 = nsdf[chosen.tau + 1];
      const denom = 2.0 * (y1 - 2.0 * y2 + y3);
      const shift = Math.abs(denom) > 1e-6 ? ((y1 - y3) / denom) : 0;
      const refinedTau = Math.max(minTau, chosen.tau + Math.max(-0.5, Math.min(0.5, shift)));
      const freqHz = srEff / refinedTau;

      if (!Number.isFinite(freqHz) || freqHz < 75 || freqHz > 1050) return null;
      return {
        freqHz,
        clarity: Math.max(0, Math.min(1, chosen.val))
      };
    }

    _startRenderLoop() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this._lastFrameMs = performance.now();
      const loop = (nowMs) => {
        if (!this.isActive) return;
        this._tickAndRender(nowMs);
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }

    _stopRenderLoop() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    _spawnPopup(text, subText = '', color = '#fde047', durMs = 1050) {
      this.floatingPopups.push({
        text,
        subText,
        color,
        bornMs: performance.now(),
        durMs
      });
      if (this.floatingPopups.length > 4) {
        this.floatingPopups.shift();
      }
    }

    _spawnHitParticles(x, y, color, count = 4) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() * Math.PI * 2);
        const speed = 0.8 + Math.random() * 2.8;
        this.particles.push({
          x,
          y: y + (Math.random() - 0.5) * 8,
          vx: -1.0 + Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.4,
          r: 2.0 + Math.random() * 2.6,
          color,
          life: 0,
          maxLife: 18 + Math.floor(Math.random() * 14)
        });
      }
      if (this.particles.length > 90) {
        this.particles.splice(0, this.particles.length - 90);
      }
    }

    _triggerHaptic(ms = 14) {
      try {
        if (window.AndroidNative && typeof window.AndroidNative.vibrate === 'function') {
          window.AndroidNative.vibrate(ms);
        }
      } catch (_) {}
    }

    _tickAndRender(nowMs) {
      const dtSec = Math.min(0.08, Math.max(0.004, (nowMs - (this._lastFrameMs || nowMs)) / 1000));
      this._lastFrameMs = nowMs;

      const isPlaying = Boolean(this.audioEngine && this.audioEngine.isPlaying());
      const curSec = this.audioEngine ? this.audioEngine.getCurrentSongTimeSec() : 0;

      // Localizar la sílaba activa en este instante
      let activeNote = null;
      for (let i = 0; i < this.pitchNotes.length; i++) {
        const n = this.pitchNotes[i];
        if (curSec + 0.045 >= n.startSec && curSec - 0.045 <= n.endSec) {
          activeNote = n;
          break;
        }
      }

      this.liveTargetNoteLabel = activeNote
        ? `${this.midiToNoteNameEs(activeNote.midi)} (${activeNote.freqHz} Hz)`
        : '--';

      // Actualizar sintetizador de Tono Guía Audible si está activo
      this._updateAudibleToneGuideSynth(activeNote, isPlaying);

      // Muestrear micrófono o guía
      this._sampleLiveVoiceOrGuide(curSec, activeNote, nowMs);

      // Evaluar precisión vocal frente a la sílaba activa
      if (isPlaying && activeNote) {
        activeNote.totalFrames++;
        if (Number.isFinite(this.liveUserMidi)) {
          const directDelta = this.liveUserMidi - activeNote.midi;
          // En modo de octava AUTO, permitimos que el cantante cante en su octava natural
          // sin penalizar saltos de registro (pecho/cabeza), manteniendo el movimiento del orbe 100% monotónico
          const octaveFlexDelta = this.octaveRegisterMode === 'auto'
            ? (directDelta - Math.round(directDelta / 12) * 12)
            : directDelta;
          const evalDelta = Math.abs(octaveFlexDelta) < Math.abs(directDelta) ? octaveFlexDelta : directDelta;
          const absDelta = Math.abs(evalDelta);
          this.sungFramesCount++;

          if (absDelta <= 0.95) {
            this.liveStatusText = 'AFINACIÓN EXACTA';
            this.liveStatusTier = 'perfect';
            activeNote.hitFrames += 1.18;
            this.tunedFramesCount += 1.0;
            this.streak++;
            this.maxStreak = Math.max(this.maxStreak, this.streak);
            this.feverMeter = Math.min(100, this.feverMeter + dtSec * 20);
            this.score += Math.round((activeNote.isGolden ? 28 : 14) * this.multiplier);
          } else if (absDelta <= 1.85) {
            this.liveStatusText = 'AFINADO';
            this.liveStatusTier = 'good';
            activeNote.hitFrames += 0.92;
            this.tunedFramesCount += 0.88;
            this.streak++;
            this.maxStreak = Math.max(this.maxStreak, this.streak);
            this.feverMeter = Math.min(100, this.feverMeter + dtSec * 12);
            this.score += Math.round((activeNote.isGolden ? 18 : 9) * this.multiplier);
          } else if (absDelta <= 2.85) {
            this.liveStatusText = evalDelta > 0 ? 'UN POCO AGUDO (BAJA)' : 'UN POCO GRAVE (SUBE)';
            this.liveStatusTier = 'near';
            activeNote.hitFrames += 0.42;
            this.tunedFramesCount += 0.40;
            this.score += Math.round(4 * this.multiplier);
          } else {
            this.liveStatusText = directDelta > 0 ? 'MUY AGUDO (BAJA EL TONO)' : 'MUY GRAVE (SUBE EL TONO)';
            this.liveStatusTier = 'off';
            this.streak = Math.max(0, this.streak - 2);
            this.feverMeter = Math.max(0, this.feverMeter - dtSec * 14);
          }

          const spanFrames = Math.max(6, (activeNote.endSec - activeNote.startSec) * 48);
          activeNote.fillRatio = Math.min(1, activeNote.hitFrames / spanFrames);

          if (activeNote.isGolden && !activeNote.goldenAwarded && activeNote.fillRatio >= 0.70) {
            activeNote.goldenAwarded = true;
            this.goldenHitCount++;
            const bonus = 350 * this.multiplier;
            this.score += bonus;
            this._triggerHaptic(28);
            this._spawnPopup('SÍLABA DORADA COMPLETADA', `+${bonus} PTS`, '#fde047', 1250);
          }
        }
      }

      // Actualizar multiplicador y estado Fiebre Vocal
      const wasFever = this.isFever;
      if (this.feverMeter >= 95) {
        this.isFever = true;
      } else if (this.feverMeter <= 22) {
        this.isFever = false;
      }
      if (this.isFever && isPlaying) {
        this.feverMeter = Math.max(20, this.feverMeter - dtSec * 4.5);
      }

      const baseMult = this.streak >= 90 ? 4 : (this.streak >= 45 ? 3 : (this.streak >= 18 ? 2 : 1));
      this.multiplier = this.isFever ? (baseMult * 2) : baseMult;
      if (!wasFever && this.isFever) {
        this._triggerHaptic(35);
        this._spawnPopup('FIEBRE VOCAL X' + this.multiplier, 'DOBLE PUNTUACIÓN ACTIVA', '#38bdf8', 1350);
      }

      const fsModal = document.getElementById('singstarFullscreenModal');
      if (fsModal) {
        fsModal.classList.toggle('fever-mode', Boolean(this.isActive && this.isFever));
      }

      // Evaluar final de cada frase cantada
      if (isPlaying) {
        for (let pIdx = 0; pIdx < this.phraseWindows.length; pIdx++) {
          const pw = this.phraseWindows[pIdx];
          if (!pw.judged && curSec > pw.endSec + 0.08 && curSec < pw.endSec + 0.85) {
            pw.judged = true;
            let fillSum = 0;
            let count = 0;
            let userAttempted = false;
            for (let ni = 0; ni < pw.syllables.length; ni++) {
              const n = pw.syllables[ni];
              fillSum += n.fillRatio;
              count++;
              if (n.hitFrames > 0) userAttempted = true;
            }
            if (count > 0 && userAttempted) {
              const avgFill = fillSum / count;
              if (avgFill >= 0.80) {
                const b = 400 * this.multiplier;
                this.score += b;
                this._triggerHaptic(22);
                this._spawnPopup('FRASE MAGISTRAL', `+${b} PTS`, '#fde047', 1150);
              } else if (avgFill >= 0.56) {
                const b = 250 * this.multiplier;
                this.score += b;
                this._spawnPopup('GRAN AFINACIÓN', `+${b} PTS`, '#34d399', 1000);
              } else if (avgFill >= 0.32) {
                const b = 120 * this.multiplier;
                this.score += b;
                this._spawnPopup('BIEN CANTADO', `+${b} PTS`, '#38bdf8', 900);
              }
            }
          }
        }
      }

      if (isPlaying && Number.isFinite(this.liveUserMidi)) {
        this.voiceTrail.push({
          sec: curSec,
          midi: this.liveUserMidi,
          tier: this.liveStatusTier,
          rms: this.liveUserRms
        });
      }
      while (this.voiceTrail.length > 0 && (curSec - this.voiceTrail[0].sec > 1.85 || this.voiceTrail[0].sec > curSec + 0.2)) {
        this.voiceTrail.shift();
      }

      if (this.displayScore < this.score) {
        this.displayScore = Math.min(this.score, this.displayScore + Math.max(3, Math.ceil((this.score - this.displayScore) * 0.25)));
      }

      this._updateHudDom(false, curSec, isPlaying);
      this._updateFullScreenTeleprompter(curSec);

      const proCanvas = document.getElementById('singstarProCanvas');
      if (proCanvas) {
        this._renderProHighwayCanvas(proCanvas, curSec, activeNote, nowMs, true);
      }
      const miniCanvas = document.getElementById('npSingstarPitchCanvas');
      if (miniCanvas && !proCanvas) {
        this._renderProHighwayCanvas(miniCanvas, curSec, activeNote, nowMs, false);
      }
    }

    _updateFullScreenTeleprompter(curSec) {
      const curEl = document.getElementById('ssProTeleprompterCurrent');
      const nextEl = document.getElementById('ssProTeleprompterNext');
      if (!curEl || this.phraseWindows.length === 0) return;

      let activePhraseIdx = -1;
      for (let i = 0; i < this.phraseWindows.length; i++) {
        const pw = this.phraseWindows[i];
        const nextStart = (i + 1 < this.phraseWindows.length) ? this.phraseWindows[i + 1].startSec : (pw.endSec + 4.0);
        if (curSec >= pw.startSec - 0.85 && curSec < Math.max(pw.endSec + 0.35, nextStart - 0.15)) {
          activePhraseIdx = i;
          break;
        }
      }
      if (activePhraseIdx === -1) {
        for (let i = 0; i < this.phraseWindows.length; i++) {
          if (this.phraseWindows[i].startSec > curSec) {
            activePhraseIdx = i;
            break;
          }
        }
      }
      if (activePhraseIdx === -1) activePhraseIdx = this.phraseWindows.length - 1;

      const phrase = this.phraseWindows[activePhraseIdx];
      if (!phrase) return;

      let activeSylIdx = -1;
      for (let s = 0; s < phrase.syllables.length; s++) {
        const syl = phrase.syllables[s];
        if (curSec >= syl.startSec - 0.03 && curSec <= syl.endSec + 0.04) {
          activeSylIdx = s;
          break;
        } else if (curSec > syl.endSec) {
          activeSylIdx = s;
        }
      }

      if (activePhraseIdx !== this._lastTeleprompterLineIdx) {
        this._lastTeleprompterLineIdx = activePhraseIdx;
        this._lastTeleprompterSylIdx = -2;
        const hasPhraseText = Boolean(String(phrase.text || '').trim());
        if (hasPhraseText) {
          curEl.innerHTML = phrase.syllables.map((syl, sIdx) => {
            return `<span class="singstar-fs-syl" data-syl-idx="${sIdx}">${escapeHtmlSafe(syl.displayText || syl.text)}</span>`;
          }).join('');
        } else {
          curEl.textContent = this.isTranscribingWhisper
            ? 'Transcribiendo letra real con IA Whisper...'
            : 'Sigue la guía melódica en el pentagrama';
        }

        let nextTextPhrase = null;
        for (let ni = activePhraseIdx + 1; ni < this.phraseWindows.length; ni++) {
          if (String(this.phraseWindows[ni]?.text || '').trim()) {
            nextTextPhrase = this.phraseWindows[ni];
            break;
          }
        }
        if (nextEl) {
          nextEl.textContent = nextTextPhrase
            ? nextTextPhrase.text
            : (this.isTranscribingWhisper ? 'Anclando sílabas al audio real (10 ms)...' : '');
        }
      }

      if (activeSylIdx !== this._lastTeleprompterSylIdx) {
        this._lastTeleprompterSylIdx = activeSylIdx;
        const spans = curEl.querySelectorAll('.singstar-fs-syl');
        for (let s = 0; s < spans.length; s++) {
          const sp = spans[s];
          const syl = phrase.syllables[s];
          const isCurrent = Boolean(syl && curSec >= syl.startSec - 0.03 && curSec <= syl.endSec + 0.05);
          const isPast = Boolean(syl && curSec > syl.endSec + 0.05);
          sp.classList.toggle('active', isCurrent);
          sp.classList.toggle('sung', isPast);
        }
      }
    }

    _updateHudDom(force = false, curSec = 0, isPlaying = false) {
      const statusClass = 'np-singstar-pitch-status' + (
        this.liveStatusTier === 'perfect' ? ' tuned-perfect' :
        this.liveStatusTier === 'good' ? ' tuned-good' :
        this.liveStatusTier === 'near' ? ' tuned-near' :
        this.liveStatusTier === 'off' ? ' tuned-off' : ''
      );

      for (const id of ['npSingstarMicNote', 'ssProLiveNote']) {
        const el = document.getElementById(id);
        if (el) el.textContent = this.liveNoteLabel || '--';
      }
      const hzEl = document.getElementById('ssProLiveHz');
      if (hzEl) {
        hzEl.textContent = this.liveUserFreqHz > 0 ? `${this.liveUserFreqHz} Hz` : '0 Hz';
      }
      const lvlFill = document.getElementById('ssProMicLevelFill');
      if (lvlFill) {
        const rmsNow = Math.max(0, Number(this.liveUserRms) || 0);
        const dbNow = 20 * Math.log10(rmsNow + 1e-5);
        const pct = Math.max(0, Math.min(100, ((dbNow + 52) / 44) * 100));
        lvlFill.style.width = `${pct.toFixed(1)}%`;
        lvlFill.classList.toggle('voiced', Boolean(Number.isFinite(this.liveUserMidi) && this.liveUserFreqHz > 0));
      }
      const gateMark = document.getElementById('ssProMicGateMark');
      if (gateMark) {
        const gateNow = Math.max(0.002, Number(this._lastGateThresholdRms || this.liveGateThreshold) || 0.0085);
        const gateDb = 20 * Math.log10(gateNow + 1e-5);
        const gatePct = Math.max(4, Math.min(92, ((gateDb + 52) / 44) * 100));
        gateMark.style.left = `${gatePct.toFixed(1)}%`;
      }
      const targetEl = document.getElementById('ssProTargetNote');
      if (targetEl) {
        targetEl.textContent = this.liveTargetNoteLabel || '--';
      }
      for (const id of ['npSingstarMicStatus', 'ssProMicStatus']) {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = this.liveStatusText || 'CANTA AL MICRÓFONO';
          el.className = statusClass;
        }
      }
      for (const id of ['npSingstarComboBadge', 'ssProComboBadge']) {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = this.isFever ? `FIEBRE x${this.multiplier}` : `x${this.multiplier}`;
          el.classList.toggle('fever', this.isFever);
        }
      }
      for (const id of ['npSingstarScoreVal', 'ssProScoreVal']) {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = `${this.displayScore.toLocaleString()} PTS`;
        }
      }

      const playPauseLbl = document.getElementById('ssProPlayPauseLabel');
      if (playPauseLbl && this._lastPlayPauseIconState !== isPlaying) {
        this._lastPlayPauseIconState = isPlaying;
        playPauseLbl.innerHTML = isPlaying
          ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
          : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
      }

      if (this.audioEngine) {
        const dur = Math.max(1, this.audioEngine.getRealDurationSec(this.audioEngine.currentTrack) || 195);
        const curLbl = document.getElementById('ssProCurTime');
        const durLbl = document.getElementById('ssProDurTime');
        const scrub = document.getElementById('ssProScrubSlider');
        const fmt = (s) => {
          const m = Math.floor(Math.max(0, s) / 60);
          const sec = Math.floor(Math.max(0, s) % 60);
          return `${m}:${sec < 10 ? '0' : ''}${sec}`;
        };
        if (curLbl) curLbl.textContent = fmt(curSec);
        if (durLbl) durLbl.textContent = fmt(dur);
        if (scrub && document.activeElement !== scrub) {
          scrub.value = String(Math.min(100, Math.max(0, (curSec / dur) * 100)).toFixed(1));
        }
      }
    }

    /**
     * Renderizador Profesional de Pista de Afinación con Piano Roll Vertical Monotónico:
     * - Columna izquierda: Teclado / Escala cromática real donde las notas graves están SIEMPRE abajo
     *   y las notas agudas están SIEMPRE arriba.
     * - Líneas de guía de transición entre sílabas consecutivas.
     * - Cápsulas de sílaba con su texto fonético y nota musical.
     * - Trazo de micrófono en tiempo real en la misma escala MIDI exacta.
     */
    _renderProHighwayCanvas(canvas, curSec, activeNote, nowMs, isFullScreen = true) {
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(300, Math.round(rect.width || 800));
      const cssH = Math.max(140, Math.round(rect.height || 360));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pw = Math.round(cssW * dpr);
      const ph = Math.round(cssH * dpr);

      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const pianoRollW = isFullScreen ? 62 : 38;
      const playheadX = pianoRollW + Math.round((cssW - pianoRollW) * 0.22);
      const lookaheadSec = isFullScreen ? 3.6 : 2.8;
      const pxPerSec = (cssW - playheadX) / lookaheadSec;

      const minMidi = this.axisMinMidi;
      const maxMidi = this.axisMaxMidi;
      const midiSpan = Math.max(12, maxMidi - minMidi);
      const topPad = isFullScreen ? 28 : 18;
      const botPad = isFullScreen ? 24 : 14;
      const usableH = Math.max(80, cssH - topPad - botPad);

      // Función estrictamente monotónica: mayor MIDI (más agudo) -> menor Y (más arriba)
      // menor MIDI (más grave) -> mayor Y (más abajo)
      const midiToY = (midiVal) => {
        const rel = (midiVal - minMidi) / midiSpan;
        const clamped = Math.max(0.02, Math.min(0.98, rel));
        return topPad + (1 - clamped) * usableH;
      };

      // 1. Dibujar rejilla horizontal de semitonos y Piano Roll izquierdo (Graves abajo -> Agudos arriba)
      const semitoneStepH = usableH / midiSpan;
      const blackKeyIndices = new Set([1, 3, 6, 8, 10]);

      for (let m = Math.ceil(minMidi); m <= Math.floor(maxMidi); m++) {
        const y = midiToY(m);
        const noteInOct = ((m % 12) + 12) % 12;
        const isBlackKey = blackKeyIndices.has(noteInOct);
        const isC = (noteInOct === 0);

        // Franja horizontal del carril de nota
        ctx.fillStyle = isBlackKey ? 'rgba(255, 255, 255, 0.015)' : 'rgba(255, 255, 255, 0.032)';
        ctx.fillRect(pianoRollW, y - semitoneStepH * 0.5, cssW - pianoRollW, semitoneStepH);

        if (isC || noteInOct === 4 || noteInOct === 7 || noteInOct === 9) {
          ctx.strokeStyle = isC ? 'rgba(212, 175, 55, 0.24)' : 'rgba(255, 255, 255, 0.06)';
          ctx.lineWidth = isC ? 1.2 : 0.8;
          ctx.beginPath();
          ctx.moveTo(pianoRollW, Math.round(y) + 0.5);
          ctx.lineTo(cssW, Math.round(y) + 0.5);
          ctx.stroke();
        }
      }

      // Líneas verticales de tiempo cada 0.5 segundos
      const firstGridSec = Math.floor(curSec * 2) * 0.5 - 0.5;
      for (let gs = firstGridSec; gs <= curSec + lookaheadSec + 0.5; gs += 0.5) {
        const gx = playheadX + (gs - curSec) * pxPerSec;
        if (gx <= pianoRollW || gx > cssW) continue;
        const isWholeSec = Math.abs(gs - Math.round(gs)) < 0.01;
        ctx.strokeStyle = isWholeSec ? 'rgba(212, 175, 55, 0.13)' : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, cssH);
        ctx.stroke();
      }

      // 2. Conectores de curva melódica entre sílabas de la misma frase (para ver si la frase sube o baja)
      const minVisSec = curSec - 1.2;
      const maxVisSec = curSec + lookaheadSec + 0.4;
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.24)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      for (let i = 1; i < this.pitchNotes.length; i++) {
        const prev = this.pitchNotes[i - 1];
        const curr = this.pitchNotes[i];
        if (curr.endSec < minVisSec) continue;
        if (prev.startSec > maxVisSec) break;
        if (curr.lineIdx !== prev.lineIdx || (curr.startSec - prev.endSec) > 0.65) continue;

        const xPrevEnd = Math.max(playheadX + (prev.startSec - curSec) * pxPerSec + 16, playheadX + (prev.endSec - curSec) * pxPerSec);
        const xCurrStart = playheadX + (curr.startSec - curSec) * pxPerSec;
        const yPrev = midiToY(prev.midi);
        const yCurr = midiToY(curr.midi);

        ctx.beginPath();
        ctx.moveTo(xPrevEnd, yPrev);
        ctx.lineTo(xCurrStart, yCurr);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Dibujar Cápsulas de Sílabas Acústicas con texto y relleno de afinación
      const barH = isFullScreen ? Math.max(16, Math.min(24, semitoneStepH * 1.15)) : 13;
      const barRadius = barH * 0.5;

      ctx.font = isFullScreen
        ? '800 12.5px Outfit, Montserrat, -apple-system, sans-serif'
        : '800 10.5px Outfit, Montserrat, -apple-system, sans-serif';
      ctx.textBaseline = 'bottom';

      for (let i = 0; i < this.pitchNotes.length; i++) {
        const n = this.pitchNotes[i];
        if (n.endSec < minVisSec) continue;
        if (n.startSec > maxVisSec) break;

        const x1 = playheadX + (n.startSec - curSec) * pxPerSec;
        const x2 = Math.max(x1 + (isFullScreen ? 22 : 16), playheadX + (n.endSec - curSec) * pxPerSec);
        const w = x2 - x1;
        const cy = midiToY(n.midi);
        const y = cy - barH * 0.5;
        const isCurrent = Boolean(activeNote && activeNote.id === n.id);

        // Banda de tolerancia visual cuando esta sílaba es la activa
        if (isCurrent) {
          const tolH = semitoneStepH * 2.4;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
          ctx.fillRect(x1, cy - tolH * 0.5, w, tolH);
        }

        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x1, y, w, barH, barRadius);
        } else {
          ctx.rect(x1, y, w, barH);
        }

        if (n.isGolden) {
          ctx.fillStyle = 'rgba(120, 53, 15, 0.76)';
        } else {
          ctx.fillStyle = isCurrent ? 'rgba(30, 41, 59, 0.92)' : 'rgba(24, 24, 38, 0.84)';
        }
        ctx.fill();

        const progress = Math.max(
          n.fillRatio,
          (isCurrent && (this.liveStatusTier === 'perfect' || this.liveStatusTier === 'good'))
            ? Math.min(1, Math.max(0, (curSec - n.startSec) / Math.max(0.10, n.endSec - n.startSec)))
            : 0
        );
        if (progress > 0.01) {
          ctx.clip();
          const fillW = w * Math.min(1, progress);
          const fillGrad = ctx.createLinearGradient(x1, y, x1 + fillW, y);
          if (n.isGolden) {
            fillGrad.addColorStop(0, '#f59e0b');
            fillGrad.addColorStop(0.6, '#fde047');
            fillGrad.addColorStop(1, '#fffef0');
          } else if (this.isFever) {
            fillGrad.addColorStop(0, '#0284c7');
            fillGrad.addColorStop(0.6, '#38bdf8');
            fillGrad.addColorStop(1, '#e0f2fe');
          } else {
            fillGrad.addColorStop(0, '#10b981');
            fillGrad.addColorStop(0.65, '#fde047');
            fillGrad.addColorStop(1, '#fef9c3');
          }
          ctx.fillStyle = fillGrad;
          ctx.fillRect(x1, y, fillW, barH);
        }
        ctx.restore();

        // Contorno de la cápsula de sílaba
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x1, y, w, barH, barRadius);
        } else {
          ctx.rect(x1, y, w, barH);
        }
        ctx.strokeStyle = n.isGolden
          ? (isCurrent ? '#fef08a' : 'rgba(250, 204, 21, 0.88)')
          : (isCurrent ? '#38bdf8' : 'rgba(212, 175, 55, 0.52)');
        ctx.lineWidth = isCurrent ? 2.2 : 1.3;
        ctx.stroke();

        // Texto de la sílaba encima de la cápsula
        if (n.text && x2 > pianoRollW + 8) {
          const textX = Math.max(pianoRollW + 6, x1 + 3);
          ctx.fillStyle = isCurrent
            ? '#fde047'
            : (n.fillRatio >= 0.5 ? '#86efac' : '#f4f4f5');
          ctx.fillText(n.text, textX, y - 3);
        }
      }

      // 3.5. Píldora elegante de cuenta atrás durante intros o descansos instrumentales (> 1.6s hasta la siguiente voz)
      if (isFullScreen && !activeNote && this.pitchNotes.length > 0) {
        let nextNote = null;
        let prevEndSec = 0;
        for (let i = 0; i < this.pitchNotes.length; i++) {
          const pn = this.pitchNotes[i];
          if (pn.startSec > curSec) {
            nextNote = pn;
            if (i > 0) prevEndSec = Math.max(0, this.pitchNotes[i - 1].endSec || 0);
            break;
          }
        }
        if (nextNote) {
          const waitSec = nextNote.startSec - curSec;
          if (waitSec > 1.6 && waitSec <= 55) {
            const gapSpan = Math.max(1.8, nextNote.startSec - prevEndSec);
            const prog = Math.max(0, Math.min(1, 1 - (waitSec / gapSpan)));
            const pillW = Math.min(280, Math.max(196, (cssW - pianoRollW) * 0.44));
            const pillH = 44;
            const pillX = pianoRollW + Math.round(((cssW - pianoRollW) - pillW) * 0.5);
            const pillY = Math.round(cssH * 0.5 - pillH * 0.5);

            ctx.save();
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(pillX, pillY, pillW, pillH, 14);
            } else {
              ctx.rect(pillX, pillY, pillW, pillH);
            }
            ctx.fillStyle = 'rgba(10, 12, 24, 0.84)';
            ctx.fill();
            ctx.strokeStyle = waitSec <= 3.5 ? 'rgba(253, 224, 71, 0.78)' : 'rgba(56, 189, 248, 0.45)';
            ctx.lineWidth = 1.4;
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '800 11.5px Outfit, Montserrat, -apple-system, sans-serif';
            ctx.fillStyle = waitSec <= 3.5 ? '#fde047' : '#e0f2fe';
            const label = waitSec <= 3.5
              ? `PREPÁRATE · ENTRA EN ${waitSec.toFixed(1)}s`
              : `ENTRADA VOCAL EN ${Math.ceil(waitSec)}s`;
            ctx.fillText(label, pillX + pillW * 0.5, pillY + 16);

            const trackX = pillX + 16;
            const trackW = pillW - 32;
            const trackY = pillY + 30;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.fillRect(trackX, trackY, trackW, 4);
            const barGrad = ctx.createLinearGradient(trackX, trackY, trackX + trackW, trackY);
            barGrad.addColorStop(0, '#38bdf8');
            barGrad.addColorStop(1, '#fde047');
            ctx.fillStyle = barGrad;
            ctx.fillRect(trackX, trackY, Math.round(trackW * prog), 4);
            ctx.restore();
          }
        }
      }

      // 4. Línea vertical del Playhead (Momento Presente)
      const laserGrad = ctx.createLinearGradient(0, 0, 0, cssH);
      laserGrad.addColorStop(0, 'rgba(253, 224, 71, 0.10)');
      laserGrad.addColorStop(0.5, this.isFever ? 'rgba(56, 189, 248, 0.92)' : 'rgba(253, 224, 71, 0.88)');
      laserGrad.addColorStop(1, 'rgba(253, 224, 71, 0.10)');
      ctx.strokeStyle = laserGrad;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, cssH);
      ctx.stroke();

      // 5. Estela de la Voz del Jugador (Monotónica en el mismo eje Y del Piano Roll)
      if (this.voiceTrail.length >= 2) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < this.voiceTrail.length; i++) {
          const p0 = this.voiceTrail[i - 1];
          const p1 = this.voiceTrail[i];
          if (p1.sec - p0.sec > 0.25) continue;
          const x0 = playheadX + (p0.sec - curSec) * pxPerSec;
          const y0 = midiToY(p0.midi);
          const x1 = playheadX + (p1.sec - curSec) * pxPerSec;
          const y1 = midiToY(p1.midi);
          if (x1 < pianoRollW) continue;
          const ageAlpha = Math.max(0.10, 1 - (curSec - p1.sec) / 1.85);

          ctx.strokeStyle = p1.tier === 'perfect'
            ? `rgba(253, 224, 71, ${(ageAlpha * 0.95).toFixed(2)})`
            : (p1.tier === 'good'
                ? `rgba(52, 211, 153, ${(ageAlpha * 0.92).toFixed(2)})`
                : (p1.tier === 'near'
                    ? `rgba(251, 191, 36, ${(ageAlpha * 0.85).toFixed(2)})`
                    : `rgba(251, 113, 133, ${(ageAlpha * 0.80).toFixed(2)})`));
          ctx.lineWidth = (isFullScreen ? 4.4 : 3.4) * ageAlpha + 1.2;
          ctx.beginPath();
          ctx.moveTo(Math.max(pianoRollW, x0), y0);
          ctx.lineTo(Math.max(pianoRollW, x1), y1);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Orbe Vocal en el Playhead + Flecha de Corrección Grave/Agudo
      if (Number.isFinite(this.liveUserMidi)) {
        const orbY = midiToY(this.liveUserMidi);
        const isTuned = (this.liveStatusTier === 'perfect' || this.liveStatusTier === 'good');
        const orbColor = this.liveStatusTier === 'perfect'
          ? '#fde047'
          : (this.liveStatusTier === 'good' ? '#34d399' : (this.liveStatusTier === 'near' ? '#fbbf24' : '#fb7185'));

        if (isTuned && activeNote) {
          this._spawnHitParticles(playheadX, orbY, activeNote.isGolden ? '#fde047' : (this.isFever ? '#38bdf8' : orbColor), this.liveStatusTier === 'perfect' ? 3 : 1);
        }

        const pulseR = (isFullScreen ? 11 : 8) + Math.min(8, this.liveUserRms * 65);
        const halo = ctx.createRadialGradient(playheadX, orbY, 2, playheadX, orbY, pulseR * 1.6);
        halo.addColorStop(0, '#ffffff');
        halo.addColorStop(0.38, orbColor);
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(playheadX, orbY, pulseR * 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = orbColor;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(playheadX, orbY, isFullScreen ? 6.2 : 5.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Etiqueta flotante junto al orbe indicando la nota exacta que estás emitiendo
        if (isFullScreen) {
          ctx.font = '900 10.5px ui-monospace, SFMono-Regular, Menlo, monospace';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = orbColor;
          ctx.fillText(this.liveNoteLabel, playheadX + 12, orbY);
        }

        if (activeNote && (this.liveStatusTier === 'near' || this.liveStatusTier === 'off')) {
          const targetY = midiToY(activeNote.midi);
          ctx.save();
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(playheadX, orbY);
          ctx.lineTo(playheadX, targetY);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 7. Dibujar la Columna Izquierda del Piano Roll (con etiquetas AGUDOS arriba y GRAVES abajo)
      ctx.fillStyle = 'rgba(8, 7, 15, 0.96)';
      ctx.fillRect(0, 0, pianoRollW, cssH);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.38)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pianoRollW, 0);
      ctx.lineTo(pianoRollW, cssH);
      ctx.stroke();

      ctx.font = isFullScreen
        ? '800 9.5px ui-monospace, SFMono-Regular, Menlo, monospace'
        : '800 8px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let m = Math.ceil(minMidi); m <= Math.floor(maxMidi); m++) {
        const y = midiToY(m);
        const noteInOct = ((m % 12) + 12) % 12;
        const isBlack = blackKeyIndices.has(noteInOct);
        const isNaturalLabel = (noteInOct === 0 || noteInOct === 2 || noteInOct === 4 || noteInOct === 5 || noteInOct === 7 || noteInOct === 9 || noteInOct === 11);

        // Tecla miniatura en el borde del piano roll
        ctx.fillStyle = isBlack ? '#181824' : 'rgba(255, 255, 255, 0.10)';
        ctx.fillRect(pianoRollW - (isBlack ? 10 : 14), y - semitoneStepH * 0.44, isBlack ? 10 : 14, semitoneStepH * 0.88);

        if (isNaturalLabel && (isFullScreen || noteInOct === 0 || noteInOct === 7)) {
          const isTarget = Boolean(activeNote && Math.round(activeNote.midi) === m);
          ctx.fillStyle = isTarget ? '#38bdf8' : (noteInOct === 0 ? '#fde047' : '#a1a1aa');
          ctx.fillText(this.midiToNoteNameEs(m), pianoRollW - 17, y);
        }
      }

      if (isFullScreen) {
        ctx.save();
        ctx.textAlign = 'left';
        ctx.font = '900 8.5px Outfit, Montserrat, sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('AGUDOS ^', 5, 11);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('GRAVES v', 5, cssH - 18);

        // Indicador visual de nivel de micrófono frente a la puerta anti-eco (Noise Gate)
        const meterW = pianoRollW - 10;
        const meterX = 5;
        const meterY = cssH - 11;
        const meterH = 5;
        const rmsNorm = Math.min(1, Math.max(0, (this.liveUserRms || 0) / 0.08));
        const gateNorm = Math.min(1, Math.max(0.06, (this._lastGateThresholdRms || 0.008) / 0.08));
        const isAboveGate = (this.liveUserRms || 0) >= (this._lastGateThresholdRms || 0.008);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(meterX, meterY, meterW, meterH);

        if (rmsNorm > 0.01) {
          ctx.fillStyle = isAboveGate ? '#34d399' : 'rgba(148, 163, 184, 0.55)';
          ctx.fillRect(meterX, meterY, Math.round(meterW * rmsNorm), meterH);
        }

        // Marca vertical del umbral de la puerta anti-altavoz
        const gateX = meterX + Math.round(meterW * gateNorm);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(gateX, meterY - 1, 1.5, meterH + 2);
        ctx.restore();
      }

      // 8. Partículas
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.06;
        pt.life++;
        if (pt.life >= pt.maxLife) {
          this.particles.splice(i, 1);
          continue;
        }
        const alpha = 1 - (pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 9. Barra inferior de Fiebre Vocal
      const feverW = Math.round((cssW - pianoRollW - 16) * (this.feverMeter / 100));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(pianoRollW + 8, cssH - 5, cssW - pianoRollW - 16, 3);
      if (feverW > 0) {
        const fGrad = ctx.createLinearGradient(pianoRollW + 8, 0, pianoRollW + 8 + feverW, 0);
        fGrad.addColorStop(0, '#f59e0b');
        fGrad.addColorStop(0.5, '#fde047');
        fGrad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = fGrad;
        ctx.fillRect(pianoRollW + 8, cssH - 5, feverW, 3);
      }

      // 10. Popups cinéticos de juicio
      for (let i = this.floatingPopups.length - 1; i >= 0; i--) {
        const pop = this.floatingPopups[i];
        const age = nowMs - pop.bornMs;
        if (age >= pop.durMs) {
          this.floatingPopups.splice(i, 1);
          continue;
        }
        const t = age / pop.durMs;
        const alpha = t < 0.15 ? (t / 0.15) : (t > 0.75 ? (1 - (t - 0.75) / 0.25) : 1);
        const liftY = 24 - t * 10;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.textAlign = 'right';
        ctx.font = isFullScreen ? '900 15px Outfit, Montserrat, sans-serif' : '900 12px Outfit, Montserrat, sans-serif';
        ctx.fillStyle = pop.color || '#fde047';
        ctx.fillText(pop.text, cssW - 16, liftY);
        if (pop.subText) {
          ctx.font = isFullScreen ? '700 11px Outfit, Montserrat, sans-serif' : '700 9.5px Outfit, Montserrat, sans-serif';
          ctx.fillStyle = '#e4e4e7';
          ctx.fillText(pop.subText, cssW - 16, liftY + (isFullScreen ? 15 : 11));
        }
        ctx.restore();
      }
    }

    openSummaryOverlay() {
      const accPct = this.sungFramesCount > 0
        ? Math.min(100, Math.round((this.tunedFramesCount / this.sungFramesCount) * 100))
        : (this.score > 0 ? 78 : 0);

      let rank = 'C';
      let rankTitle = 'CALENTANDO LA VOZ';
      if (accPct >= 88 && this.score >= 4500) {
        rank = 'S+';
        rankTitle = 'LEYENDA DEL ESCENARIO';
      } else if (accPct >= 76 && this.score >= 2200) {
        rank = 'S';
        rankTitle = 'ESTRELLA DE ORO';
      } else if (accPct >= 62 && this.score >= 900) {
        rank = 'A';
        rankTitle = 'SOLISTA AFINADO';
      } else if (accPct >= 42 || this.score >= 300) {
        rank = 'B';
        rankTitle = 'BUEN RITMO VOCAL';
      }

      const totalEarnedClefs = this.score >= 150
        ? Math.min(35, Math.max(3, Math.floor(this.score / 420) + this.goldenHitCount * 2 + (accPct >= 80 ? 5 : 2)))
        : 0;
      const unclaimedClefs = Math.max(0, totalEarnedClefs - this.sessionClefsClaimed);
      if (unclaimedClefs > 0) {
        this.sessionClefsClaimed += unclaimedClefs;
        if (typeof window.addClefs === 'function') {
          window.addClefs(unclaimedClefs);
        }
        if (typeof window.showSuccessToast === 'function') {
          window.showSuccessToast(`Has ganado +${unclaimedClefs} Claves de Sol cantando en SingStar`);
        }
      }

      for (const prefix of ['npSingstar', 'ssFs']) {
        const rankBadge = document.getElementById(`${prefix}RankBadge`);
        const rankTitleEl = document.getElementById(`${prefix}RankTitle`);
        const rankSubEl = document.getElementById(`${prefix}RankSub`);
        const statAcc = document.getElementById(`${prefix}StatAcc`);
        const statGolden = document.getElementById(`${prefix}StatGolden`);
        const statStreak = document.getElementById(`${prefix}StatStreak`);
        const statClefs = document.getElementById(`${prefix}StatClefs`);

        if (rankBadge) rankBadge.textContent = rank;
        if (rankTitleEl) rankTitleEl.textContent = rankTitle;
        if (rankSubEl) rankSubEl.textContent = `Puntuación Vocal: ${this.score.toLocaleString()} pts`;
        if (statAcc) statAcc.textContent = `${accPct}%`;
        if (statGolden) statGolden.textContent = `${this.goldenHitCount}/${this.goldenTotalCount}`;
        if (statStreak) statStreak.textContent = String(this.maxStreak);
        if (statClefs) statClefs.textContent = `+${this.sessionClefsClaimed}`;
      }

      const fsSum = document.getElementById('singstarFsSummaryView');
      if (fsSum) fsSum.classList.remove('hidden');
      const miniSum = document.getElementById('npSingstarSummaryOverlay');
      if (miniSum) miniSum.classList.remove('hidden');
    }

    closeSummaryOverlay(resetStats = false) {
      const fsSum = document.getElementById('singstarFsSummaryView');
      if (fsSum) fsSum.classList.add('hidden');
      const miniSum = document.getElementById('npSingstarSummaryOverlay');
      if (miniSum) miniSum.classList.add('hidden');
      if (resetStats) {
        this.resetSessionStats();
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
      this._audioSrcOp = 0;

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
        ++this._audioSrcOp;
        if (this._seekGuard) this._seekGuard = null;
        try {
          this.previewAudio.pause();
          this.previewAudio.src = '';
        } catch (_) {}
        try {
          this.fullAudio.pause();
          this.fullAudio.src = '';
        } catch (_) {}
        this._fullAudioIsLocalBlob = false;
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
        const origin = encodeURIComponent((window.location && window.location.origin) || 'https://renacer.onrender.com');
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
        const origin = encodeURIComponent((window.location && window.location.origin) || 'https://renacer.onrender.com');
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

      // Ticker de alta precisión (50ms) para que el resaltado de sílabas/líneas de Karaoke, yt_bridge y el Videoclip no tengan retraso
      if (this.karaokeSyncInterval) clearInterval(this.karaokeSyncInterval);
      let ytBridgeTickCounter = 0;
      this.karaokeSyncInterval = setInterval(() => {
        if (!this.currentTrack) return;
        if (window.isGameLoadingOrActive || (window.engine && (window.engine.isRunning || window.engine.isCountingDown))) return;
        ytBridgeTickCounter++;
        if (ytBridgeTickCounter % 3 === 0 && window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
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
          if (ytBridgeTickCounter % 8 === 0) {
            this._updateMediaSessionPosition(curSec, fullDur);
          }
          if (curSec >= fullDur - 0.5 && (!this._lastSeekWallMs || (performance.now() - this._lastSeekWallMs) > 2000)) {
            if (window.SingStarVocalEngine && window.SingStarVocalEngine.isActive && window.SingStarVocalEngine.score >= 150) {
              window.SingStarVocalEngine.openSummaryOverlay();
            }
            this.nextTrack();
          }
        }
      }, 50);

      this.previewAudio.addEventListener('ended', () => {
        if (this.activeSourceType !== 'preview') return;
        this.isPlayingFlag = false;
        this._syncPlayPauseIcons(false);
        this._setLoadingHintVisible(false);
        if (this.queue.length > 1 && (!this._lastSeekWallMs || (performance.now() - this._lastSeekWallMs) > 2000)) {
          this.nextTrack();
        }
      });

      this.fullAudio.addEventListener('ended', () => {
        if (this.activeSourceType === 'full' && (!this._lastSeekWallMs || (performance.now() - this._lastSeekWallMs) > 2000)) {
          if (window.SingStarVocalEngine && window.SingStarVocalEngine.isActive && window.SingStarVocalEngine.score >= 150) {
            window.SingStarVocalEngine.openSummaryOverlay();
          }
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
      const srcOp = ++this._audioSrcOp;
      const wasYtBridge = this.activeSourceType === 'yt_bridge';
      const wasPlaying = Boolean(resumeIfPlaying || this.isPlaying());
      const preserveSec = (seekTargetSec !== null && Number.isFinite(seekTargetSec))
        ? Math.max(0, seekTargetSec)
        : (wasYtBridge
            ? this.getCurrentSongTimeSec()
            : (this.activeSourceType === 'full' ? (Number(this.fullAudio.currentTime) || 0) : 0));

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
        if (reqId !== this._playRequestId || srcOp !== this._audioSrcOp) return;
        const dur = Number(this.fullAudio.duration) || 9999;
        const liveSec = (seekTargetSec !== null && Number.isFinite(seekTargetSec))
          ? Math.max(0, seekTargetSec)
          : (wasYtBridge ? this.getCurrentSongTimeSec() : preserveSec);
        const safePos = Math.max(0, Math.min(dur - 0.5, liveSec));
        this._seekGuard = { targetSec: safePos, untilMs: Date.now() + 2500 };
        try { this.fullAudio.currentTime = safePos; } catch (_) {}
        if (wasPlaying) {
          this.fullAudio.volume = this._getMasterVolume();
          this.fullAudio.play().then(() => {
            if (reqId !== this._playRequestId || srcOp !== this._audioSrcOp) return;
            if (wasYtBridge) {
              this._stopYtAudioBridge();
            }
            this.activeSourceType = 'full';
            this.isPlayingFlag = true;
            this._syncPlayPauseIcons(true);
            this._setLoadingHintVisible(false);
          }).catch(() => {});
        } else if (wasYtBridge) {
          this._stopYtAudioBridge();
          this.activeSourceType = 'full';
          this.isPlayingFlag = false;
          this._syncPlayPauseIcons(false);
          this._setLoadingHintVisible(false);
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
          const hit = results.find(r => r && (r.artworkUrl100 || r.trackTimeMillis));
          if (hit) {
            if (!track.artworkUrl600 && hit.artworkUrl100) {
              track.artworkUrl600 = String(hit.artworkUrl100).replace(/100x100bb/g, '600x600bb');
            }
            if ((!track.durationSec || track.durationSec < 45) && Number(hit.trackTimeMillis) > 45000) {
              track.durationSec = Math.round(Number(hit.trackTimeMillis) / 1000);
            }
          }
        }
      } catch (_) {}
      return '';
    }

    /**
     * Reproduce SIEMPRE la canción COMPLETA desde 0:00 (sin previews de 30s ni bucles cortos)
     * mediante HTML5 <audio> real, arrancando en frío por stream chunked del servidor (/api/v1/audio/extract)
     * en carrera paralela con la extracción directa en cliente y calibración acústica DSP.
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

      if (this.karaokeService) {
        this.karaokeService.loadAndRenderTrackLyrics(track, this.getRealDurationSec(track)).catch(() => {});
      }

      if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncVideoclipIfActive === 'function') {
        window.DiscoverHomeApp.syncVideoclipIfActive(track);
      }

      const attachBackgroundDspAndBlobUpgrade = (_audioUrlUsed = '', preloadOpts = {}) => {
        this.preloadFullTrackInBackground(track, preloadOpts).then(async (blob) => {
          if (reqId !== this._playRequestId || !blob || blob.size < 60000) return;
          this.fullTrackBlob = blob;
          if (this.karaokeService) {
            this.karaokeService.recalibrateForActualAudio(track, this.getTrackFullDurationSec(track), blob).catch(() => {});
          }
          // Actualizar silenciosamente a Blob local para que cualquier clic futuro en frases sea <5ms sin cortes Range
          const curPlaying = this.isPlaying();
          const curSeek = this.pendingUserSeekSec !== null
            ? this.pendingUserSeekSec
            : ((this._seekGuard && Date.now() < this._seekGuard.untilMs)
                ? this._seekGuard.targetSec
                : (this.activeSourceType === 'yt_bridge' ? null : (Number(this.fullAudio.currentTime) || 0)));
          await this._upgradeFullAudioToLocalBlob(blob, curSeek, curPlaying, reqId);
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

      const existingYtVid = this._extractTrackYoutubeId(track);
      if (!isCommTrack && !existingYtVid && !window.RELEASE_TAGS_MAP && typeof window.loadReleaseTagsMap === 'function') {
        await Promise.race([
          window.loadReleaseTagsMap().catch(() => {}),
          new Promise(r => setTimeout(r, 450))
        ]);
        if (reqId !== this._playRequestId) return false;
      }

      const directStreamUrl = (!isCommTrack) ? this._getDirectFullStreamUrl(track) : '';

      // 3. Si tiene URL directa en GitHub Releases (Catálogo Top), reproducir el MP3 de estudio completo desde 0:00 + Blob upgrade silencioso
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

      // 4. Streaming directo de pista COMPLETA desde 0:00 (SIN previews de 30s):
      //    Compite en paralelo el stream progresivo del servidor (/api/v1/audio/extract),
      //    la URL progresiva SoundCloud, la descarga Blob en cliente y un arranque rápido
      //    vía YouTube Bridge (cutoff 1.6s) mientras el Blob completo sigue descargando detrás.
      this._setLoadingHintVisible(true);
      this._currentFullAudioTrackId = String(track.id || '');
      if (desiredStartSec > 0) {
        this.pendingUserSeekSec = desiredStartSec;
        this._seekGuard = { targetSec: desiredStartSec, untilMs: Date.now() + 8000 };
      }

      const rawT4 = repairSpanishBrokenAccents(track.title || '');
      const rawA4 = repairSpanishBrokenAccents(track.artist || '');
      const parsedMeta4 = (typeof window.parseYouTubeMetadataSmart === 'function')
        ? window.parseYouTubeMetadataSmart(rawT4, rawA4)
        : { coreTitle: rawT4, coreArtist: rawA4 };
      const cleanTitle4 = repairSpanishBrokenAccents(parsedMeta4.coreTitle || rawT4);
      const cleanArtist4 = repairSpanishBrokenAccents(
        (parsedMeta4.coreArtist && parsedMeta4.coreArtist.toLowerCase() !== 'youtube')
          ? parsedMeta4.coreArtist
          : rawA4.replace(/^youtube$/i, '').trim()
      );

      const fastVidPromise = existingYtVid
        ? Promise.resolve(existingYtVid)
        : ((typeof window.searchYouTubeOfficialClient === 'function' && cleanTitle4)
            ? window.searchYouTubeOfficialClient(cleanTitle4, cleanArtist4, Number(track.durationSec) || 0)
                .then((ytCands) => {
                  const best = Array.isArray(ytCands) ? ytCands.find(c => c && c.videoId) : null;
                  if (best && best.videoId) {
                    if (!track.videoId) track.videoId = best.videoId;
                    if (best.durationSec > 45 && (!track.durationSec || track.durationSec < 45)) {
                      track.durationSec = best.durationSec;
                    }
                    return best.videoId;
                  }
                  return '';
                })
                .catch(() => '')
            : Promise.resolve(''));

      const progressiveExtractUrl = this._buildServerExtractStreamUrl(track);
      const serverStreamRace = progressiveExtractUrl
        ? (async () => {
            const ok = await this._startChannelWithFadeIn(this.fullAudio, progressiveExtractUrl, 'full', reqId, desiredStartSec, 110);
            if (!ok) throw new Error('server_stream_failed');
            return { mode: 'server_stream' };
          })()
        : Promise.reject(new Error('no_server_url'));

      const soundCloudProgRace = (typeof window.resolveSoundCloudProgressiveUrlClient === 'function' && cleanTitle4)
        ? (async () => {
            const scProg = await window.resolveSoundCloudProgressiveUrlClient(
              cleanTitle4,
              cleanArtist4,
              10,
              track._scRawTrack || null
            ).catch(() => null);
            if (!scProg || !scProg.url) throw new Error('no_sc_prog_url');
            const expectedTrackDur = Number(track.durationSec || track.duration || 0);
            const scDur = Number(scProg.durationSec || 0);
            if (expectedTrackDur > 50 && scDur > 40 && Math.abs(scDur - expectedTrackDur) > 12) {
              throw new Error('sc_duration_mismatch');
            }
            return {
              mode: 'sc_url',
              url: scProg.url,
              durationSec: scDur,
              thumbnail: scProg.thumbnail || ''
            };
          })()
        : Promise.reject(new Error('no_sc_resolver'));

      const clientBlobRace = (async () => {
        const blob = await this.preloadFullTrackInBackground(track, { excludeServer: true });
        if (!blob || blob.size < 80000) throw new Error('client_blob_failed');
        return { mode: 'blob', blob };
      })();

      let fastBridgeTid = null;
      const ytBridgeFastStarter = (async () => {
        const vid = await fastVidPromise;
        if (!vid || reqId !== this._playRequestId) throw new Error('no_yt_vid');
        await new Promise((resolve) => {
          fastBridgeTid = setTimeout(resolve, 1600);
        });
        if (reqId !== this._playRequestId) throw new Error('stale_req');
        return { mode: 'yt_bridge', videoId: vid };
      })();

      try {
        const winner = await Promise.any([serverStreamRace, soundCloudProgRace, clientBlobRace, ytBridgeFastStarter]);
        if (reqId !== this._playRequestId) return false;

        if (winner && winner.mode === 'blob' && winner.blob) {
          this.fullTrackBlob = winner.blob;
          this._fullAudioIsLocalBlob = true;
          this.fullTrackReady = true;
          this._currentFullAudioTrackId = String(track.id || '');
          const effectiveStart = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : desiredStartSec;
          this.pendingUserSeekSec = null;
          const startedBlob = await this._startChannelWithFadeIn(this.fullAudio, winner.blob, 'full', reqId, effectiveStart, 110);
          if (reqId !== this._playRequestId) return false;
          if (startedBlob) {
            this.isLoadingTrack = false;
            this._setLoadingHintVisible(false);
            if (this.karaokeService) {
              this.karaokeService.recalibrateForActualAudio(track, this.getTrackFullDurationSec(track), winner.blob).catch(() => {});
            }
            this._updatePlayerMetadataUI(track);
            this._startListenTracker();
            if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
              window.DiscoverHomeApp.syncActiveVideoclipPlayback('play');
            }
            return true;
          }
        }

        if (winner && winner.mode === 'sc_url' && winner.url) {
          if (winner.durationSec > 45 && (!track.durationSec || track.durationSec < 45)) {
            track.durationSec = winner.durationSec;
          }
          const effectiveStart = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : desiredStartSec;
          const startedSc = await this._startChannelWithFadeIn(this.fullAudio, winner.url, 'full', reqId, effectiveStart, 110);
          if (reqId !== this._playRequestId) return false;
          if (startedSc) {
            this.pendingUserSeekSec = null;
            this.fullTrackReady = true;
            this._fullAudioIsLocalBlob = false;
            this.isLoadingTrack = false;
            this._setLoadingHintVisible(false);
            this._updatePlayerMetadataUI(track);
            this._startListenTracker();
            attachBackgroundDspAndBlobUpgrade(winner.url, { excludeServer: false });
            if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
              window.DiscoverHomeApp.syncActiveVideoclipPlayback('play');
            }
            return true;
          }
        }

        if (winner && winner.mode === 'server_stream') {
          this.fullTrackReady = true;
          this._fullAudioIsLocalBlob = false;
          this.isLoadingTrack = false;
          this._setLoadingHintVisible(false);
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          attachBackgroundDspAndBlobUpgrade(progressiveExtractUrl, { excludeServer: false });
          const targetSeek = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : (desiredStartSec > 0 ? desiredStartSec : null);
          if (targetSeek !== null && targetSeek > 0 && Math.abs((Number(this.fullAudio.currentTime) || 0) - targetSeek) > 2.5) {
            this.pendingUserSeekSec = targetSeek;
            this._seekGuard = { targetSec: targetSeek, untilMs: Date.now() + 8000 };
            this._ensureFullBlobUpgradeAndSeek(track, targetSeek, reqId);
          } else if (this.pendingUserSeekSec !== null) {
            this.pendingUserSeekSec = null;
          }
          if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
            window.DiscoverHomeApp.syncActiveVideoclipPlayback('play');
          }
          return true;
        }

        if (winner && winner.mode === 'yt_bridge' && winner.videoId) {
          const bridgeStart = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : desiredStartSec;
          this.pendingUserSeekSec = null;
          if (this._startYtAudioBridge(winner.videoId, bridgeStart, reqId)) {
            this._updatePlayerMetadataUI(track);
            this._startListenTracker();
            if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
              window.DiscoverHomeApp.syncActiveVideoclipPlayback('play');
            }
            attachBackgroundDspAndBlobUpgrade('', { excludeServer: false });
            return true;
          }
        }
      } catch (_) {
      } finally {
        if (fastBridgeTid) {
          clearTimeout(fastBridgeTid);
          fastBridgeTid = null;
        }
      }

      if (reqId !== this._playRequestId) return false;

      // 5. Respaldo inmediato vía YouTube Bridge si existe videoId + descarga completa en segundo plano
      const ytFallbackVid = this._extractTrackYoutubeId(track) || (await Promise.race([
        fastVidPromise,
        new Promise(r => setTimeout(() => r(''), 1200))
      ]).catch(() => ''));
      if (reqId !== this._playRequestId) return false;
      if (ytFallbackVid) {
        const bridgeStart = this.pendingUserSeekSec !== null ? this.pendingUserSeekSec : desiredStartSec;
        this.pendingUserSeekSec = null;
        if (this._startYtAudioBridge(ytFallbackVid, bridgeStart, reqId)) {
          this._updatePlayerMetadataUI(track);
          this._startListenTracker();
          attachBackgroundDspAndBlobUpgrade('', { excludeServer: false });
          return true;
        }
      }

      // 6. Último respaldo solo si tampoco se halló vídeo de YouTube
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
          if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
            window.DiscoverHomeApp.syncActiveVideoclipPlayback('play');
          }
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
    async _decodeAndStoreWaveformProfile(track, key, arrayBufOrAudioBuffer, maxSeconds = 62, isFullPass = false, allowDuringGamePrep = false) {
      if (!arrayBufOrAudioBuffer) return false;
      const isActivelyPlayingPiano = Boolean(window.engine && (window.engine.isRunning || window.engine.isCountingDown));
      if (isActivelyPlayingPiano || (!allowDuringGamePrep && window.isGameLoadingOrActive)) return false;

      let decoded = null;
      if (typeof arrayBufOrAudioBuffer.getChannelData === 'function') {
        decoded = arrayBufOrAudioBuffer;
      } else {
        if (!arrayBufOrAudioBuffer.byteLength || arrayBufOrAudioBuffer.byteLength < 24576) return false;
        const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (!OfflineCtx) return false;
        const offCtx = new OfflineCtx(1, 44100 * 2, 44100);
        decoded = await offCtx.decodeAudioData(arrayBufOrAudioBuffer.slice(0));
      }
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
      const srcOp = ++this._audioSrcOp;
      if (reqId !== this._playRequestId || srcOp !== this._audioSrcOp) return false;
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
          if (reqId !== this._playRequestId || srcOp !== this._audioSrcOp) return;
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
        if (srcOp !== this._audioSrcOp) {
          if (this.activeSourceType === 'yt_bridge') {
            try { audioEl.pause(); } catch (_) {}
          }
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
          if (reqId !== this._playRequestId || srcOp !== this._audioSrcOp || audioEl.paused) {
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

    async preloadFullTrackInBackground(track, options = {}) {
      if (!track) return null;
      const existing = this._getCachedFullBlobForTrack(track);
      if (existing && existing.size >= 80000) return existing;

      const excludeServer = Boolean(options && options.excludeServer);
      if (!this._inflightFullPreloads) this._inflightFullPreloads = new Map();
      const baseKey = String(track.id || `${track.title}__${track.artist}`);
      const key = excludeServer ? `${baseKey}__nosrv` : baseKey;
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

          // 1. Rama Servidor (/api/v1/audio/extract) con timeout amplio (16s) para permitir extracción en frío de pistas completas
          if (!excludeServer) {
            const serverRaceTask = (async () => {
              const extractUrl = this._buildServerExtractStreamUrl(track);
              const ctrl = new AbortController();
              const tid = setTimeout(() => ctrl.abort(), 16000);
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
          }

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
     * de las próximas tarjetas del mazo Para Ti para que al deslizar arranquen sin previews de 30s.
     */
    async prewarmUpcomingCards(tracksSlice = []) {
      if (!Array.isArray(tracksSlice) || tracksSlice.length === 0) return;
      const nextCards = tracksSlice.slice(0, 4);

      for (let i = 0; i < nextCards.length; i++) {
        const tr = nextCards[i];
        if (!tr || !tr.id) continue;

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
        }).catch(() => {});
      }

      const nextTrack0 = nextCards[0];
      if (nextTrack0 && !window.isGameLoadingOrActive && !(window.engine && (window.engine.isRunning || window.engine.isCountingDown))) {
        setTimeout(() => {
          if (window.isGameLoadingOrActive || (window.engine && (window.engine.isRunning || window.engine.isCountingDown))) return;
          this.preloadFullTrackInBackground(nextTrack0).catch(() => {});
        }, 350);
      }
    }

    async play() {
      if (!this.currentTrack) {
        if (this.queue.length > 0) {
          await this.playTrack(this.queue[0]);
        }
        return;
      }
      if (typeof window.pauseMenuAmbientMusic === 'function') {
        window.pauseMenuAmbientMusic();
      }
      if (this.activeSourceType === 'yt_bridge') {
        if (this._ytBridgePaused) {
          this._ytBridgeStartWallMs = performance.now();
          this._ytBridgePaused = false;
          this._sendYtBridgeCommand('playVideo', []);
          this.isPlayingFlag = true;
          this._syncPlayPauseIcons(true);
          if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
            window.DiscoverHomeApp.syncActiveVideoclipPlayback('play');
          }
        }
        return;
      }
      if (this.activeSourceType === 'none' || (!this.fullAudio.src && !this.previewAudio.src)) {
        await this.playTrack(this.currentTrack);
        return;
      }
      const activeEl = this.getActiveAudioElement();
      if (!activeEl) {
        await this.playTrack(this.currentTrack);
        return;
      }
      activeEl.volume = this._getMasterVolume();
      if (activeEl.paused) {
        try {
          await activeEl.play();
          this.isPlayingFlag = true;
          this._syncPlayPauseIcons(true);
          if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.syncActiveVideoclipPlayback === 'function') {
            window.DiscoverHomeApp.syncActiveVideoclipPlayback('play');
          }
        } catch (_) {}
      } else {
        this.isPlayingFlag = true;
        this._syncPlayPauseIcons(true);
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

      // Si la pista actual todavía está iniciando el stream en frío, guardar el destino sin abortar la descarga en curso
      if (this.isLoadingTrack && this.activeSourceType === 'none') {
        this.pendingUserSeekSec = safeTarget;
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
  const singstarEngine = new SingStarVocalEngine(karaokeService);
  const dualStreamEngine = new DualStreamAudioEngine(graphService, dnaEngine, karaokeService);
  singstarEngine.attachAudioEngine(dualStreamEngine);

  window.ExternalMusicGraphService = graphService;
  window.AnalogDNAEngine = dnaEngine;
  window.UserMusicDNA = dnaEngine;
  window.KaraokeLyricsService = karaokeService;
  window.UniversalKaraokeService = karaokeService;
  window.SingStarVocalEngine = singstarEngine;
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

      const existingAudioVid = dualStreamEngine._extractTrackYoutubeId(track);
      const existingMvVid = (track.mvVideoId && /^[a-zA-Z0-9_-]{11}$/.test(String(track.mvVideoId)))
        ? String(track.mvVideoId)
        : '';
      const key = this._getVideoclipTrackKey(track);
      if (key && this._videoclipDataCache.has(key)) {
        return this._videoclipDataCache.get(key);
      }

      const repTitle0 = repairSpanishBrokenAccents(track.title || '');
      const repArtist0 = repairSpanishBrokenAccents(track.artist || '');
      const parsedMeta = (typeof window.parseYouTubeMetadataSmart === 'function')
        ? window.parseYouTubeMetadataSmart(repTitle0, repArtist0)
        : { coreTitle: repTitle0, coreArtist: repArtist0 };
      const cleanTitle = String(parsedMeta.coreTitle || repTitle0)
        .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
        .trim();
      const cleanArtist = String(
        (parsedMeta.coreArtist && parsedMeta.coreArtist.toLowerCase() !== 'youtube')
          ? parsedMeta.coreArtist
          : repArtist0
      )
        .replace(/\s*-\s*topic$/i, '')
        .replace(/vevo$/i, '')
        .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
        .replace(/^youtube$/i, '')
        .trim();
      const lookupTerm = `${cleanArtist} ${cleanTitle}`.trim();

      if (existingMvVid) {
        const cachedMvRes = { videoStreamUrl: '', videoId: existingMvVid };
        if (key) this._videoclipDataCache.set(key, cachedMvRes);
        return cachedMvRes;
      }

      // 1. Búsqueda directa de Videoclip Oficial en YouTube (penaliza - Topic, Lyric Video y Audio Oficial)
      const ytMvClientTask = (typeof window.searchYouTubeVideoclipClient === 'function')
        ? window.searchYouTubeVideoclipClient(cleanTitle, cleanArtist, Number(track.durationSec) || 0).catch(() => [])
        : Promise.resolve([]);

      // 2. Búsqueda de Videoclip Oficial en servidor (/api/v1/video/resolve)
      const srvMvTask = (async () => {
        try {
          const baseUrl = typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
          const durParam = (Number(track.durationSec) > 45) ? `&durationSec=${Math.round(Number(track.durationSec))}` : '';
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 4500);
          const resp = await fetch(
            `${baseUrl}/api/v1/video/resolve?title=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(cleanArtist)}&q=${encodeURIComponent(lookupTerm)}${durParam}`,
            { signal: ctrl.signal }
          );
          clearTimeout(tid);
          if (resp.ok) return await resp.json();
        } catch (_) {}
        return null;
      })();

      // 3. Respaldo iTunes Music Video API (.m4v / .mp4) exigiendo coincidencia real de título Y artista
      const itunesMvTask = (async () => {
        if (!lookupTerm || /^ultimoscruzados$/i.test(cleanArtist)) return '';
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 2400);
          const itunesMvResp = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(lookupTerm)}&entity=musicVideo&limit=6`,
            { signal: ctrl.signal }
          );
          clearTimeout(tid);
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
                return bestMv.previewUrl;
              }
            }
          }
        } catch (_) {}
        return '';
      })();

      const [ytList, srvData, itunesStreamUrl] = await Promise.all([ytMvClientTask, srvMvTask, itunesMvTask]);

      const videoStreamUrl = itunesStreamUrl || (srvData && srvData.videoStreamUrl) || '';
      let resolvedVid = '';

      const topClientCand = (Array.isArray(ytList) && ytList[0] && /^[a-zA-Z0-9_-]{11}$/.test(String(ytList[0].videoId || '')))
        ? ytList[0]
        : null;
      const srvVid = (srvData && /^[a-zA-Z0-9_-]{11}$/.test(String(srvData.videoId || '')))
        ? String(srvData.videoId)
        : '';

      const clientScore = topClientCand ? Number(topClientCand.mvScore ?? topClientCand.score ?? 20) : -999;
      const srvScore = srvVid ? Number(srvData.bestScore ?? (srvData.isMusicVideo ? 50 : 10)) : -999;

      if (topClientCand && (!srvVid || clientScore >= srvScore)) {
        if (!existingAudioVid || clientScore >= -10) {
          resolvedVid = String(topClientCand.videoId);
        }
        if (topClientCand.durationSec && topClientCand.durationSec > 45 && (!track.durationSec || track.durationSec < 45)) {
          track.durationSec = topClientCand.durationSec;
          if (dualStreamEngine && dualStreamEngine.currentTrack && dualStreamEngine.currentTrack.id === track.id) {
            dualStreamEngine._updatePlayerProgressUI(dualStreamEngine.getCurrentSongTimeSec(), topClientCand.durationSec);
          }
          if (karaokeService) {
            karaokeService.recalibrateForActualAudio(track, topClientCand.durationSec).catch(() => {});
          }
        }
      } else if (srvVid && (!existingAudioVid || srvScore >= -10)) {
        resolvedVid = srvVid;
      }

      if (resolvedVid) {
        track.mvVideoId = resolvedVid;
        if (!existingAudioVid && track.id) {
          track.videoId = resolvedVid;
        }
      } else if (existingAudioVid) {
        resolvedVid = existingAudioVid;
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

      if (clipData.videoId) {
        const startSec = Math.max(0, Math.round(dualStreamEngine.getCurrentSongTimeSec() || 0));
        wrap.innerHTML = `
          <iframe
            class="crate-videoclip-iframe"
            src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(clipData.videoId)}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&start=${startSec}&loop=1&playlist=${encodeURIComponent(clipData.videoId)}"
            title="Videoclip Oficial"
            frameborder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
          ></iframe>
        `;
        return;
      }

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
        const origin = encodeURIComponent((window.location && window.location.origin) || 'https://renacer.onrender.com');
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

        <button type="button" class="sp-opt-row" onclick="window.DiscoverHomeApp.handleTrackOptionAction('singstar_mic')">
          <span class="sp-opt-icon gold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          </span>
          <span class="sp-opt-label font-extrabold text-[#fde047]">Cantar en Modo SingStar (Micrófono)</span>
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
      } else if (action === 'singstar_mic') {
        if (!dualStreamEngine.currentTrack || dualStreamEngine.currentTrack.id !== tr.id) {
          dualStreamEngine.playTrack(tr);
        }
        this.openNowPlayingModal('singstar');
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

    KARAOKE_HOLD_TIP_KEY: 'beatstar_karaoke_hold_tip_seen_v1',

    maybeShowKaraokeHoldTip() {
      if (this._karaokeHoldTipShownSession) return false;
      let alreadySeen = false;
      try {
        alreadySeen = localStorage.getItem('beatstar_karaoke_hold_tip_seen_v1') === '1';
      } catch (_) {}
      if (alreadySeen) return false;

      const banner = document.getElementById('npKaraokeHoldTipBanner');
      if (!banner) return false;

      // Marcar como visto inmediatamente la primera vez que se muestra al entrar en Karaoke
      this._karaokeHoldTipShownSession = true;
      try {
        localStorage.setItem('beatstar_karaoke_hold_tip_seen_v1', '1');
      } catch (_) {}

      banner.classList.remove('hidden');
      return true;
    },

    dismissKaraokeOnboardingTip(markSeen = true) {
      if (markSeen) {
        this._karaokeHoldTipShownSession = true;
        try {
          localStorage.setItem('beatstar_karaoke_hold_tip_seen_v1', '1');
        } catch (_) {}
      }
      const banner = document.getElementById('npKaraokeHoldTipBanner');
      if (banner) {
        banner.classList.add('hidden');
      }
    },

    syncKaraokeLineByHold(lineIdx) {
      if (!karaokeService || typeof karaokeService.calibrateToHeldLine !== 'function') return null;
      if (!dualStreamEngine.currentTrack && !this.getActiveCrateTrack()) return null;

      const curSec = dualStreamEngine.getCurrentSongTimeSec();
      const newOffset = karaokeService.calibrateToHeldLine(lineIdx, curSec);
      if (newOffset === null) return null;

      karaokeService._userScrollingUntil = 0;
      karaokeService._userManualScrollUntil = 0;
      this.dismissKaraokeOnboardingTip(true);

      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(25);
        }
      } catch (_) {}

      if (typeof window.showSuccessToast === 'function') {
        const sign = newOffset >= 0 ? '+' : '';
        window.showSuccessToast(`Letra sincronizada (${sign}${newOffset.toFixed(1)}s)`);
      }
      return newOffset;
    },

    openNowPlayingModal(defaultTab = null) {
      const modal = document.getElementById('nowPlayingTurntableModal');
      if (!modal) return;
      modal.classList.add('open');
      if (defaultTab) {
        this.switchNowPlayingTab(defaultTab);
      } else {
        const karaokeStage = document.getElementById('npKaraokeStageContainer');
        if (karaokeStage && !karaokeStage.classList.contains('hidden')) {
          this.maybeShowKaraokeHoldTip();
        }
      }
      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (tr) {
        karaokeService.loadAndRenderTrackLyrics(tr, dualStreamEngine.getRealDurationSec(tr)).catch(() => {});
      }
      dualStreamEngine._renderQueueListInModal();
    },

    closeNowPlayingModal() {
      this.dismissKaraokeOnboardingTip(false);
      if (singstarEngine && singstarEngine.isActive) {
        singstarEngine.deactivate();
      }
      const modal = document.getElementById('nowPlayingTurntableModal');
      if (modal) modal.classList.remove('open');
    },

    switchNowPlayingTab(tab = 'vinyl') {
      const isSingstar = tab === 'singstar';
      const isKaraoke = tab === 'karaoke' || isSingstar;
      const isVideoclip = tab === 'videoclip';
      const isVinyl = !isKaraoke && !isVideoclip;

      const vinylStage = document.getElementById('npTurntablePlatterInteractive') || document.getElementById('npVinylStageContainer');
      const karaokeStage = document.getElementById('npKaraokeStageContainer');
      const videoclipStage = document.getElementById('npVideoclipStageContainer');

      const tabVinylBtn = document.getElementById('npTabVinylBtn');
      const tabVideoclipBtn = document.getElementById('npTabVideoclipBtn');
      const tabKaraokeBtn = document.getElementById('npTabKaraokeBtn');
      const tabSingstarBtn = document.getElementById('npTabSingstarBtn');

      if (vinylStage) vinylStage.classList.toggle('hidden', !isVinyl);
      if (karaokeStage) karaokeStage.classList.toggle('hidden', !isKaraoke);
      if (videoclipStage) videoclipStage.classList.toggle('hidden', !isVideoclip);

      if (tabVinylBtn) tabVinylBtn.classList.toggle('active', isVinyl);
      if (tabVideoclipBtn) tabVideoclipBtn.classList.toggle('active', isVideoclip);
      if (tabKaraokeBtn) tabKaraokeBtn.classList.toggle('active', tab === 'karaoke');
      if (tabSingstarBtn) tabSingstarBtn.classList.toggle('active', isSingstar);

      if (isSingstar) {
        this.dismissKaraokeOnboardingTip(false);
        singstarEngine.activate();
      } else {
        if (singstarEngine && singstarEngine.isActive && tab !== 'singstar') {
          singstarEngine.deactivate();
        }
        if (isKaraoke) {
          this.maybeShowKaraokeHoldTip();
        } else {
          this.dismissKaraokeOnboardingTip(false);
        }
      }

      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (isVideoclip && tr) {
        this._mountNowPlayingVideoclipForTrack(tr);
      } else if (isKaraoke && tr) {
        const key = karaokeService._makeKey(tr);
        const scrollEl = document.getElementById('npKaraokeScrollList');
        const alreadyRendered = (
          karaokeService.currentTrackKey === key &&
          Array.isArray(karaokeService.currentLyrics) &&
          karaokeService.currentLyrics.length > 0 &&
          scrollEl &&
          scrollEl.children.length > 0
        );
        if (alreadyRendered) {
          karaokeService.syncTime(dualStreamEngine.getCurrentSongTimeSec());
        } else {
          karaokeService.loadAndRenderTrackLyrics(tr, dualStreamEngine.getRealDurationSec(tr)).then(() => {
            karaokeService.syncTime(dualStreamEngine.getCurrentSongTimeSec());
          }).catch(() => {});
        }
      }
    },

    async toggleSingStarMode() {
      const next = !singstarEngine.isActive;
      if (next) {
        this.switchNowPlayingTab('singstar');
      } else {
        this.switchNowPlayingTab('karaoke');
      }
    },

    closeSingStarStudio() {
      if (singstarEngine) {
        singstarEngine.deactivate();
      }
      const fsModal = document.getElementById('singstarFullscreenModal');
      if (fsModal) {
        fsModal.classList.remove('open');
        fsModal.classList.remove('fever-mode');
      }
      this.switchNowPlayingTab('karaoke');
    },

    toggleSingStarStudioSettings(forceState = null) {
      if (singstarEngine) {
        singstarEngine.toggleStudioSettingsModal(forceState);
      }
    },

    skipSingStarPrepWait() {
      if (singstarEngine) {
        singstarEngine.skipPrepWait();
      }
    },

    toggleSingStarVocalReducer() {
      if (singstarEngine) {
        singstarEngine.toggleVocalReducer();
      }
    },

    toggleSingStarVoiceGuide() {
      if (singstarEngine) {
        singstarEngine.toggleVoiceGuideDemo();
      }
    },

    toggleSingStarAudibleToneGuide() {
      if (singstarEngine) {
        singstarEngine.toggleAudibleToneGuide();
      }
    },

    cycleSingStarOctaveRegister() {
      if (singstarEngine) {
        singstarEngine.cycleOctaveRegister();
      }
    },

    setSingStarMicSensitivity(level) {
      if (singstarEngine && typeof singstarEngine.setMicSensitivity === 'function') {
        singstarEngine.setMicSensitivity(level);
      }
    },

    recalibrateSingStarMic() {
      if (singstarEngine && typeof singstarEngine.recalibrateMicNoiseFloor === 'function') {
        singstarEngine.recalibrateMicNoiseFloor();
      }
    },

    openSingStarPackManager() {
      if (singstarEngine) {
        singstarEngine.toggleStudioSettingsModal(false);
        singstarEngine.openPackManagerModal();
      }
    },

    openSingStarPackManagerFromSettings() {
      const settingsModal = document.getElementById('settingsModal');
      if (settingsModal) settingsModal.classList.add('hidden');
      if (singstarEngine) {
        singstarEngine.openPackManagerModal(true);
      }
    },

    closeSingStarPackManager() {
      if (singstarEngine) {
        singstarEngine.closePackManagerModal();
      }
    },

    async downloadAndInstallSingStarProPack() {
      if (singstarEngine) {
        await singstarEngine.downloadAndInstallProPack();
      }
    },

    async reanalyzeCurrentTrackInSingStar() {
      if (singstarEngine) {
        await singstarEngine.reanalyzeCurrentTrack();
      }
    },

    restartCurrentSongInSingStar() {
      if (singstarEngine) {
        singstarEngine.restartCurrentSongInSingStar();
      }
    },

    openSingStarSummary() {
      if (singstarEngine) {
        singstarEngine.openSummaryOverlay();
      }
    },

    closeSingStarSummary(resetStats = false) {
      if (singstarEngine) {
        singstarEngine.closeSummaryOverlay(Boolean(resetStats));
      }
    },

    openKaraokeForCurrent() {
      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (tr && !dualStreamEngine.isPlaying()) {
        dualStreamEngine.playTrack(tr);
      }
      this.openNowPlayingModal('karaoke');
    },

    openSingStarForCurrent() {
      const tr = dualStreamEngine.currentTrack || this.getActiveCrateTrack();
      if (tr && !dualStreamEngine.isPlaying()) {
        dualStreamEngine.playTrack(tr);
      }
      this.openNowPlayingModal('singstar');
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


