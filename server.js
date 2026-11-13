import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================================================
// RENDER BANDWIDTH SAVER: NATIVE BROTLI / GZIP COMPRESSION + ETAG 304 CACHE
// Reduces HTML/JS/CSS/JSON outbound transfer by ~85% and 100% on 304 hits
// ============================================================================
const STATIC_COMPRESSED_CACHE = new Map();
const MAX_COMPRESSED_CACHE_ENTRIES = 48;

function getMimeTypeForStatic(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml; charset=utf-8';
  return 'application/octet-stream';
}

function upgradeCompressedEntryAsync(filePath, entry) {
  if (!entry || entry._upgrading) return;
  entry._upgrading = true;
  zlib.gzip(entry.rawBuf, { level: 6 }, (gzErr, gzOut) => {
    if (!gzErr && gzOut) entry.gzipBuf = gzOut;
    zlib.brotliCompress(entry.rawBuf, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 }
    }, (brErr, brOut) => {
      if (!brErr && brOut) entry.brBuf = brOut;
      entry._upgrading = false;
    });
  });
}

function serveCompressedTextFile(req, res, filePath, cacheControl = 'public, max-age=0, must-revalidate') {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;

    const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', cacheControl);
    res.setHeader('Vary', 'Accept-Encoding');

    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch.includes(etag))) {
      res.status(304).end();
      return true;
    }

    const contentType = getMimeTypeForStatic(filePath);
    res.setHeader('Content-Type', contentType);

    if (req.method === 'HEAD') {
      res.status(200).end();
      return true;
    }

    let entry = STATIC_COMPRESSED_CACHE.get(filePath);
    if (!entry || entry.mtimeMs !== stat.mtimeMs || entry.size !== stat.size) {
      const rawBuf = fs.readFileSync(filePath);
      // Compresión ultra-rápida nivel 1 (< 4ms) en el hilo principal para no bloquear el arranque
      const gzipBuf = zlib.gzipSync(rawBuf, { level: 1 });
      entry = { mtimeMs: stat.mtimeMs, size: stat.size, rawBuf, gzipBuf, brBuf: null, _upgrading: false };
      if (STATIC_COMPRESSED_CACHE.size >= MAX_COMPRESSED_CACHE_ENTRIES) {
        const oldestKey = STATIC_COMPRESSED_CACHE.keys().next().value;
        STATIC_COMPRESSED_CACHE.delete(oldestKey);
      }
      STATIC_COMPRESSED_CACHE.set(filePath, entry);
      upgradeCompressedEntryAsync(filePath, entry);
    }

    const acceptEnc = String(req.headers['accept-encoding'] || '').toLowerCase();
    if (entry.brBuf && acceptEnc.includes('br')) {
      res.setHeader('Content-Encoding', 'br');
      res.setHeader('Content-Length', String(entry.brBuf.byteLength));
      res.status(200).end(entry.brBuf);
      return true;
    }
    if (entry.gzipBuf && acceptEnc.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Length', String(entry.gzipBuf.byteLength));
      res.status(200).end(entry.gzipBuf);
      return true;
    }

    res.setHeader('Content-Length', String(entry.rawBuf.byteLength));
    res.status(200).end(entry.rawBuf);
    return true;
  } catch (_) {
    return false;
  }
}

// Automatically compress JSON API responses larger than 1 KB
app.use((req, res, next) => {
  const origJson = res.json.bind(res);
  res.json = function (body) {
    try {
      const jsonStr = JSON.stringify(body);
      const rawLen = Buffer.byteLength(jsonStr, 'utf-8');
      if (rawLen > 1024 && !res.getHeader('Content-Encoding')) {
        const acceptEnc = String(req.headers['accept-encoding'] || '').toLowerCase();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Vary', 'Accept-Encoding');
        if (acceptEnc.includes('br')) {
          const compressed = zlib.brotliCompressSync(Buffer.from(jsonStr, 'utf-8'), {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 }
          });
          res.setHeader('Content-Encoding', 'br');
          res.setHeader('Content-Length', String(compressed.byteLength));
          return res.end(compressed);
        }
        if (acceptEnc.includes('gzip')) {
          const compressed = zlib.gzipSync(Buffer.from(jsonStr, 'utf-8'), { level: 6 });
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Content-Length', String(compressed.byteLength));
          return res.end(compressed);
        }
      }
    } catch (_) {}
    return origJson(body);
  };
  next();
});

const STATIC_DIR = path.join(__dirname, 'app', 'static');
const COMMUNITY_DIR = path.join(__dirname, 'app', 'uploads', 'community');
const SONGS_DIR = path.join(STATIC_DIR, 'songs');
const SCORES_FILE = path.join(__dirname, 'app', 'uploads', 'leaderboard_scores.json');
const RATINGS_FILE = path.join(__dirname, 'app', 'uploads', 'chart_ratings.json');
const GITHUB_LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');
const DAILY_POKER_STATE_FILE = path.join(__dirname, 'app', 'uploads', 'daily_poker_state.json');
const PLAYER_PROFILES_FILE = path.join(__dirname, 'app', 'uploads', 'player_profiles.json');

// GitHub API Persistence Configuration
const GITHUB_REPO = process.env.GITHUB_REPOSITORY || 'Bruala33/renacer';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'version-estable';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_COMMUNITY_FILE = path.join(__dirname, 'community_charts.json');
let githubLeaderboardSha = null;
let githubCommunitySha = null;
let isSyncingToGithub = false;
let pendingGithubSync = false;

// In-memory data store for community charts, ratings, and leaderboards
const communityCharts = new Map();
const chartScores = new Map();
const chartRatings = new Map();
const followedCreators = new Set();
const players = new Map();
const dailyPokerStateByDay = new Map();
const playerProfilesByCode = new Map(); // recoveryCode -> profileObj
const playerProfileCodeByName = new Map(); // lowerNickname -> recoveryCode

function normalizeRecoveryCodeServer(raw) {
  const cleaned = String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return '';
  const body = cleaned.startsWith('RNC') ? cleaned.slice(3) : cleaned;
  if (body.length < 4 || body.length > 16) return '';
  return `RNC-${body}`;
}

function hashProfilePinServer(pinRaw) {
  const clean = String(pinRaw || '').trim();
  if (!clean) return '';
  return crypto.createHash('sha256').update(`renacer_pin_v1:${clean}`).digest('hex').slice(0, 32);
}

function computeProfileRichnessServer(prof) {
  if (!prof || typeof prof !== 'object') return 0;
  const w = prof.wallet || {};
  const clefsBonus = Math.max(0, (Number(w.clefs) || 0) - 100);
  const medalsBonus = ((Number(w.silvers) || 0) * 80) + ((Number(w.golds) || 0) * 180) + ((Number(w.platinums) || 0) * 350);
  const freeModes = new Set(['normal', 'osu_hybrid', 'locura']);
  let paidModes = 0;
  if (prof.unlocked_modes && typeof prof.unlocked_modes === 'object') {
    for (const [m, val] of Object.entries(prof.unlocked_modes)) {
      if (val && !freeModes.has(m)) paidModes++;
    }
  }
  const effectsCount = Array.isArray(prof.unlocked_effects)
    ? prof.unlocked_effects.filter(e => e && e !== 'solar_inferno').length
    : 0;
  const hsCount = (prof.highscores && typeof prof.highscores === 'object')
    ? Object.keys(prof.highscores).length
    : 0;
  const favCount = Array.isArray(prof.favorites) ? prof.favorites.length : 0;
  const favRecCount = Array.isArray(prof.favorite_records) ? prof.favorite_records.length : 0;
  const plCount = Array.isArray(prof.playlists) ? prof.playlists.length : 0;
  return clefsBonus + medalsBonus + (paidModes * 1500) + (effectsCount * 600) + (hsCount * 350) + (Math.max(favCount, favRecCount) * 60) + (plCount * 200);
}

function buildProfileSummaryServer(prof) {
  if (!prof) return null;
  const w = prof.wallet || {};
  const freeModes = new Set(['normal', 'osu_hybrid', 'locura']);
  const unlockedModesList = prof.unlocked_modes && typeof prof.unlocked_modes === 'object'
    ? Object.keys(prof.unlocked_modes).filter(k => prof.unlocked_modes[k] && !freeModes.has(k))
    : [];
  const hsCount = prof.highscores && typeof prof.highscores === 'object'
    ? Object.keys(prof.highscores).length
    : 0;
  const favCount = Math.max(
    Array.isArray(prof.favorites) ? prof.favorites.length : 0,
    Array.isArray(prof.favorite_records) ? prof.favorite_records.length : 0
  );
  const plCount = Array.isArray(prof.playlists) ? prof.playlists.length : 0;
  return {
    player_name: prof.player_name || 'Jugador',
    recovery_code: prof.recovery_code || '',
    has_password: Boolean(prof.pin_hash || prof.password_hash),
    clefs: Math.max(0, Number(w.clefs) || 0),
    silvers: Math.max(0, Number(w.silvers) || 0),
    golds: Math.max(0, Number(w.golds) || 0),
    platinums: Math.max(0, Number(w.platinums) || 0),
    unlocked_modes: unlockedModesList,
    unlocked_modes_count: unlockedModesList.length,
    songs_count: hsCount,
    effects_count: Array.isArray(prof.unlocked_effects) ? prof.unlocked_effects.length : 1,
    favorites_count: favCount,
    playlists_count: plCount,
    updated_at: prof.updated_at || null
  };
}

function sanitizeAndMergeProfileServer(existing, incoming, isOwnerVerified = true) {
  const base = existing && typeof existing === 'object' ? existing : {};
  const inc = incoming && typeof incoming === 'object' ? incoming : {};

  const existingRichness = computeProfileRichnessServer(base);
  const incomingRichness = computeProfileRichnessServer(inc);
  const incomingLooksBlankReset = (existingRichness > 0 && incomingRichness === 0);

  const bw = base.wallet || {};
  const iw = inc.wallet || {};
  const wallet = {
    clefs: (!isOwnerVerified || incomingLooksBlankReset)
      ? Math.max(Number(bw.clefs) || 100, Number(iw.clefs) || 100)
      : Math.max(0, Math.min(99999999, Math.round(Number(iw.clefs ?? bw.clefs ?? 100) || 0))),
    silvers: Math.max(Number(bw.silvers) || 0, Number(iw.silvers) || 0),
    golds: Math.max(Number(bw.golds) || 0, Number(iw.golds) || 0),
    platinums: Math.max(Number(bw.platinums) || 0, Number(iw.platinums) || 0)
  };

  // Unión permanente de modos desbloqueados (incluyendo 'split', 'cruce', 'echo', etc.)
  const unlocked_modes = { normal: true, osu_hybrid: true, locura: true };
  for (const srcModes of [base.unlocked_modes, inc.unlocked_modes]) {
    if (srcModes && typeof srcModes === 'object') {
      for (const [k, v] of Object.entries(srcModes)) {
        if (v && k.length <= 32) unlocked_modes[k] = true;
      }
    }
  }

  // Unión permanente de efectos desbloqueados
  const effSet = new Set(['solar_inferno']);
  for (const list of [base.unlocked_effects, inc.unlocked_effects]) {
    if (Array.isArray(list)) {
      for (const item of list.slice(0, 120)) {
        if (typeof item === 'string' && item.trim() && item.length <= 48) {
          effSet.add(item.trim());
        }
      }
    }
  }

  // Fusión de récords por canción conservando siempre la puntuación y estrellas más altas
  const highscores = {};
  for (const srcHs of [base.highscores, inc.highscores]) {
    if (srcHs && typeof srcHs === 'object') {
      for (const [songId, rec] of Object.entries(srcHs)) {
        if (!songId || songId.length > 140 || !rec || typeof rec !== 'object') continue;
        const sc = Math.max(0, Math.round(Number(rec.score) || 0));
        if (sc <= 0) continue;
        const prev = highscores[songId];
        if (!prev || sc >= prev.score) {
          highscores[songId] = {
            score: Math.max(sc, prev?.score || 0),
            stars: Math.max(Number(rec.stars) || 0, prev?.stars || 0),
            maxCombo: Math.max(Math.round(Number(rec.maxCombo) || 0), prev?.maxCombo || 0),
            medalTier: rec.medalTier || prev?.medalTier || null,
            accuracyPct: Math.max(Number(rec.accuracyPct) || 0, prev?.accuracyPct || 0)
          };
        }
      }
    }
  }
  const hsKeys = Object.keys(highscores);
  if (hsKeys.length > 600) {
    hsKeys.sort((a, b) => (highscores[b].score || 0) - (highscores[a].score || 0));
    for (let i = 600; i < hsKeys.length; i++) delete highscores[hsKeys[i]];
  }

  // Unión de favoritos (IDs + registros completos de canciones favoritas para restaurarlas en cualquier dispositivo)
  const favSet = new Set();
  const favSources = (isOwnerVerified && inc.favorites_authoritative === true && Array.isArray(inc.favorites))
    ? [inc.favorites]
    : [base.favorites, inc.favorites];
  for (const fList of favSources) {
    if (Array.isArray(fList)) {
      for (const fId of fList.slice(0, 300)) {
        if (typeof fId === 'string' && fId.trim() && fId.length <= 140) favSet.add(fId.trim());
      }
    }
  }

  const favRecordsMap = new Map();
  const favRecSources = (isOwnerVerified && inc.favorites_authoritative === true && Array.isArray(inc.favorite_records))
    ? [base.favorite_records, inc.favorite_records]
    : [base.favorite_records, inc.favorite_records];
  for (const rList of favRecSources) {
    if (Array.isArray(rList)) {
      for (const rec of rList.slice(0, 300)) {
        if (!rec || typeof rec !== 'object' || !rec.id) continue;
        const cleanId = String(rec.id).trim().slice(0, 140);
        if (!cleanId) continue;
        if (isOwnerVerified && inc.favorites_authoritative === true && !favSet.has(cleanId)) continue;
        favSet.add(cleanId);
        favRecordsMap.set(cleanId, {
          id: cleanId,
          title: String(rec.title || 'Canción Favorita').slice(0, 140),
          artist: String(rec.artist || 'Artista').slice(0, 140),
          creator: String(rec.creator || 'Catálogo').slice(0, 80),
          source: String(rec.source || 'official').slice(0, 40),
          source_name: String(rec.source_name || '').slice(0, 60),
          thumbnail: String(rec.thumbnail || '').slice(0, 400),
          download_url: String(rec.download_url || '').slice(0, 400),
          direct_download_url: String(rec.direct_download_url || '').slice(0, 400),
          fallback_download_url: String(rec.fallback_download_url || '').slice(0, 400),
          difficulties: Array.isArray(rec.difficulties) ? rec.difficulties.slice(0, 12).map(d => ({
            id: String(d?.id || 'default').slice(0, 60),
            name: String(d?.name || 'Normal').slice(0, 60),
            stars: Number(d?.stars) || 3.5,
            label: String(d?.label || '').slice(0, 80)
          })) : [],
          is_community: Boolean(rec.is_community),
          audio_url: String(rec.audio_url || '').slice(0, 400),
          addedAt: Number(rec.addedAt) || Date.now()
        });
      }
    }
  }

  // Fusión de Playlists creadas o importadas por el usuario
  const playlistsMap = new Map();
  const plSources = (isOwnerVerified && inc.playlists_authoritative === true && Array.isArray(inc.playlists))
    ? [inc.playlists]
    : [base.playlists, inc.playlists];
  for (const pList of plSources) {
    if (Array.isArray(pList)) {
      for (const pl of pList.slice(0, 80)) {
        if (!pl || typeof pl !== 'object') continue;
        const plId = String(pl.id || '').trim().slice(0, 100);
        const plTitle = String(pl.title || 'Playlist').trim().slice(0, 120);
        if (!plId && !plTitle) continue;
        const mapKey = plId || `title:${plTitle.toLowerCase()}`;
        const prevPl = playlistsMap.get(mapKey);
        const rawTracks = Array.isArray(pl.tracks) ? pl.tracks : [];
        const mergedTracksMap = new Map();
        if (prevPl && Array.isArray(prevPl.tracks)) {
          for (const t of prevPl.tracks) {
            if (t && (t.id || t.title)) mergedTracksMap.set(String(t.id || t.title), t);
          }
        }
        for (const t of rawTracks.slice(0, 250)) {
          if (!t || typeof t !== 'object') continue;
          const tId = String(t.id || '').trim().slice(0, 120);
          const tTitle = String(t.title || 'Pista').trim().slice(0, 160);
          if (!tId && !tTitle) continue;
          mergedTracksMap.set(tId || tTitle, {
            id: tId || `tr_${mergedTracksMap.size}`,
            title: tTitle,
            artist: String(t.artist || (Array.isArray(t.artists) ? t.artists.join(', ') : 'Artista')).slice(0, 140),
            thumbnail: String(t.thumbnail || '').slice(0, 400),
            source: String(t.source || '').slice(0, 40),
            download_url: String(t.download_url || '').slice(0, 400),
            direct_download_url: String(t.direct_download_url || '').slice(0, 400),
            duration_seconds: Number(t.duration_seconds) || 0
          });
        }
        const finalTracks = Array.from(mergedTracksMap.values()).slice(0, 250);
        playlistsMap.set(mapKey, {
          id: plId || prevPl?.id || `pl_${Date.now()}_${playlistsMap.size}`,
          title: plTitle || prevPl?.title || 'Playlist',
          item_count: finalTracks.length,
          tracks: finalTracks,
          source: String(pl.source || prevPl?.source || 'custom').slice(0, 40),
          createdAt: Number(pl.createdAt || prevPl?.createdAt) || Date.now()
        });
      }
    }
  }

  // Historial semanal (máximo por semana)
  const weekly_history = {};
  for (const wSrc of [base.weekly_history, inc.weekly_history]) {
    if (wSrc && typeof wSrc === 'object') {
      for (const [wKey, wVal] of Object.entries(wSrc)) {
        if (!wKey || wKey.length > 20 || !wVal || typeof wVal !== 'object') continue;
        const prevW = weekly_history[wKey];
        const nextScore = Math.max(Number(prevW?.score) || 0, Number(wVal.score) || 0);
        weekly_history[wKey] = {
          score: nextScore,
          songsPlayed: Math.max(Number(prevW?.songsPlayed) || 0, Number(wVal.songsPlayed) || 0),
          maxCombo: Math.max(Number(prevW?.maxCombo) || 0, Number(wVal.maxCombo) || 0),
          stars: Math.max(Number(prevW?.stars) || 0, Number(wVal.stars) || 0),
          accuracyPct: Math.max(Number(prevW?.accuracyPct) || 0, Number(wVal.accuracyPct) || 0),
          medalTier: wVal.medalTier || prevW?.medalTier || null,
          v2Clean: true
        };
      }
    }
  }

  // Ajustes y progreso auxiliar (ruleta diaria, pity gachapón, amigos promocionales reclamados, colores, velocidad)
  const bs = (base.settings && typeof base.settings === 'object') ? base.settings : {};
  const is = (inc.settings && typeof inc.settings === 'object') ? inc.settings : {};
  const claimedFriendsSet = new Set([
    ...(Array.isArray(bs.claimed_promo_friends) ? bs.claimed_promo_friends : []),
    ...(Array.isArray(is.claimed_promo_friends) ? is.claimed_promo_friends : [])
  ].filter(x => typeof x === 'string' && x.length <= 40).slice(0, 100));

  const settings = incomingLooksBlankReset
    ? { ...is, ...bs, claimed_promo_friends: Array.from(claimedFriendsSet) }
    : {
        ...bs,
        ...is,
        vegas_streak: Math.max(Number(bs.vegas_streak) || 0, Number(is.vegas_streak) || 0),
        gacha_pity: Number.isFinite(Number(is.gacha_pity)) ? Number(is.gacha_pity) : (Number(bs.gacha_pity) || 0),
        claimed_promo_friends: Array.from(claimedFriendsSet)
      };

  const activeEffect = (!incomingLooksBlankReset && typeof inc.active_effect === 'string' && inc.active_effect.trim())
    ? inc.active_effect.trim().slice(0, 48)
    : (base.active_effect || 'solar_inferno');

  // Fusión de UserMusicDNA (Vector 8D, likes, dislikes, 4 diales del algoritmo y filtro anti-fatiga)
  const baseDna = (base.music_dna && typeof base.music_dna === 'object') ? base.music_dna : {};
  const incDna = (inc.music_dna && typeof inc.music_dna === 'object') ? inc.music_dna : {};
  const rawVec = Array.isArray(incDna.vector) && incDna.vector.length === 8
    ? incDna.vector
    : (Array.isArray(baseDna.vector) && baseDna.vector.length === 8 ? baseDna.vector : [0.55, 0.60, 0.65, 0.65, 0.50, 0.45, 0.55, 0.55]);
  const cleanVector = rawVec.slice(0, 8).map(v => Math.max(0, Math.min(1, Number(v) || 0.5)));

  const rawDials = (incDna.dials && typeof incDna.dials === 'object')
    ? { ...(baseDna.dials || {}), ...incDna.dials }
    : (baseDna.dials || {});
  const cleanDials = {
    discovery: Math.max(0, Math.min(100, Number(rawDials.discovery ?? 35))),
    energy: Math.max(0, Math.min(100, Number(rawDials.energy ?? 60))),
    era: Math.max(0, Math.min(100, Number(rawDials.era ?? 55))),
    vocal: Math.max(0, Math.min(100, Number(rawDials.vocal ?? 50)))
  };

  const likesSet = new Set([
    ...(Array.isArray(baseDna.likes) ? baseDna.likes : []),
    ...(Array.isArray(incDna.likes) ? incDna.likes : []),
    ...Array.from(favSet)
  ].filter(x => typeof x === 'string' && x.length <= 140).slice(-300));

  const dislikesSet = new Set([
    ...(Array.isArray(baseDna.dislikes) ? baseDna.dislikes : []),
    ...(Array.isArray(incDna.dislikes) ? incDna.dislikes : [])
  ].filter(x => typeof x === 'string' && x.length <= 140 && !likesSet.has(x)).slice(-200));

  const sessionBloomIds = Array.from(new Set([
    ...(Array.isArray(baseDna.session_bloom_ids) ? baseDna.session_bloom_ids : []),
    ...(Array.isArray(incDna.session_bloom_ids) ? incDna.session_bloom_ids : [])
  ].filter(x => typeof x === 'string' && x.length <= 140))).slice(-100);

  const music_dna = {
    vector: cleanVector,
    dials: cleanDials,
    likes: Array.from(likesSet),
    dislikes: Array.from(dislikesSet),
    session_bloom_ids: sessionBloomIds,
    total_swipes: Math.max(Number(baseDna.total_swipes) || 0, Number(incDna.total_swipes) || 0),
    bandit_arms: (incDna.bandit_arms && typeof incDna.bandit_arms === 'object')
      ? incDna.bandit_arms
      : (baseDna.bandit_arms || {}),
    last_liked_track: incDna.last_liked_track || baseDna.last_liked_track || null,
    updated_at: new Date().toISOString()
  };

  const resolvedPinHash = base.pin_hash || base.password_hash || inc.pin_hash || inc.password_hash || '';
  const resolvedAccountToken = String(base.account_token || inc.account_token || '').trim().slice(0, 80);
  return {
    player_name: String(inc.player_name || base.player_name || 'Jugador').trim().slice(0, 24),
    recovery_code: base.recovery_code || inc.recovery_code || '',
    account_token: resolvedAccountToken,
    has_password: Boolean(resolvedPinHash),
    pin_hash: resolvedPinHash,
    password_hash: resolvedPinHash,
    wallet,
    unlocked_modes,
    unlocked_effects: Array.from(effSet),
    active_effect: activeEffect,
    highscores,
    favorites: Array.from(favSet),
    favorite_records: Array.from(favRecordsMap.values()),
    playlists: Array.from(playlistsMap.values()),
    weekly_history,
    music_dna,
    settings,
    updated_at: new Date().toISOString()
  };
}

function registerOrMergeCanonicalProfileServer(rawKeyOrCode, incomingProf) {
  if (!incomingProf || typeof incomingProf !== 'object') return null;
  const displayName = String(incomingProf.player_name || rawKeyOrCode || '').trim().slice(0, 24);
  const nmLower = displayName.toLowerCase();
  if (!nmLower || nmLower === 'jugador' || nmLower === 'jugador anónimo' || nmLower === 'jugador anonimo') {
    return null;
  }

  let canonicalCode = playerProfileCodeByName.get(nmLower) || '';
  if (!canonicalCode) {
    const digest = crypto.createHash('md5').update(`rnc_user:${nmLower}`).digest('hex').toUpperCase().slice(0, 6);
    canonicalCode = `RNC-${digest}`;
  }

  const prevProf = playerProfilesByCode.get(canonicalCode) || null;
  const merged = sanitizeAndMergeProfileServer(prevProf, {
    ...incomingProf,
    player_name: displayName,
    recovery_code: canonicalCode
  }, true);
  merged.player_name = displayName;
  merged.recovery_code = canonicalCode;
  const pHash = prevProf?.pin_hash || prevProf?.password_hash || incomingProf.pin_hash || incomingProf.password_hash || '';
  if (pHash) {
    merged.pin_hash = pHash;
    merged.password_hash = pHash;
    merged.has_password = true;
  }
  if (prevProf?.account_token || incomingProf.account_token) {
    merged.account_token = String(prevProf?.account_token || incomingProf.account_token || '').trim().slice(0, 80);
  }

  playerProfilesByCode.set(canonicalCode, merged);
  playerProfileCodeByName.set(nmLower, canonicalCode);
  return merged;
}

function savePlayerProfilesToDisk() {
  try {
    fs.mkdirSync(path.dirname(PLAYER_PROFILES_FILE), { recursive: true });
    const out = {};
    for (const [, prof] of playerProfilesByCode.entries()) {
      const keyName = String(prof?.player_name || prof?.recovery_code || '').trim();
      if (!keyName) continue;
      out[keyName] = prof;
    }
    fs.writeFileSync(PLAYER_PROFILES_FILE, JSON.stringify(out, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Server] Could not write player_profiles.json:', err.message);
  }
}

function loadPlayerProfilesFromDisk() {
  try {
    if (!fs.existsSync(PLAYER_PROFILES_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(PLAYER_PROFILES_FILE, 'utf-8'));
    if (!raw || typeof raw !== 'object') return;
    for (const [rawKey, prof] of Object.entries(raw)) {
      if (!prof || typeof prof !== 'object') continue;
      registerOrMergeCanonicalProfileServer(rawKey, prof);
    }
  } catch (err) {
    console.warn('[Server] Could not load player_profiles.json:', err.message);
  }
}

// Helper to compute ISO Week ID (AAAA-WSS)
function getIsoWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// Mapas permanentes para acumuladores de puntos y referidos verificados por enlace
const playerGlobalAccumulator = new Map();
const playerWeeklyAccumulator = new Map();
const completedReferralsMap = new Map(); // referrerKey -> Set<friendName>
const pendingReferralClicksByIp = new Map(); // ip -> { referrer, refCode, ts }

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    return String(xff).split(',')[0].trim();
  }
  return String(req.socket?.remoteAddress || req.ip || 'unknown').trim();
}

function registerReferralHelper(refKeyRaw, friendNameRaw) {
  const rKey = String(refKeyRaw || '').trim().toLowerCase();
  const fName = String(friendNameRaw || '').trim();
  if (!rKey || !fName || rKey === fName.toLowerCase()) return;
  const set = completedReferralsMap.get(rKey) || new Set();
  set.add(fName);
  completedReferralsMap.set(rKey, set);
}

function buildConsolidatedLeaderboardJson() {
  const songsObj = {};
  for (const [id, scores] of chartScores.entries()) {
    songsObj[id] = (scores || []).slice(0, 20).map(s => ({
      name: s.player_name || 'Jugador Anónimo',
      score: s.score || 0,
      stars: s.stars || 0,
      combo: s.max_combo || 0,
      accuracy: s.accuracy_pct || 100,
      date: s.created_at || new Date().toISOString()
    }));
  }

  // Asegurar que todos los jugadores del ranking global y canciones tengan su perfil consolidado con su nombre de usuario y récords
  for (const [pKey, gEntry] of playerGlobalAccumulator.entries()) {
    const displayName = String(gEntry?.name || gEntry?.player_name || pKey).trim();
    if (!displayName || displayName.toLowerCase() === 'jugador') continue;
    const reconstructedHs = {};
    for (const [chartId, list] of chartScores.entries()) {
      if (!Array.isArray(list)) continue;
      const hit = list.find(s => String(s.player_name || s.name || '').trim().toLowerCase() === pKey);
      if (hit && hit.score > 0) {
        reconstructedHs[chartId] = {
          score: hit.score || 0,
          stars: hit.stars || 3,
          maxCombo: hit.max_combo || hit.combo || 0,
          medalTier: hit.medal_tier || null,
          accuracyPct: hit.accuracy_pct || hit.accuracy || 100
        };
      }
    }
    const existingCode = playerProfileCodeByName.get(pKey);
    const existingProf = existingCode ? playerProfilesByCode.get(existingCode) : null;
    registerOrMergeCanonicalProfileServer(displayName, {
      player_name: existingProf?.player_name || displayName,
      recovery_code: existingProf?.recovery_code || '',
      wallet: {
        clefs: Math.max(Number(existingProf?.wallet?.clefs) || 100, Number(gEntry?.clefs) || 100),
        silvers: Number(existingProf?.wallet?.silvers) || 0,
        golds: Number(existingProf?.wallet?.golds) || 0,
        platinums: Number(existingProf?.wallet?.platinums) || 0
      },
      highscores: reconstructedHs
    });
  }

  // 1. Global: Ranking acumulativo por puntos totales conseguidos + resumen completo del progreso de cada usuario
  const globalList = Array.from(playerGlobalAccumulator.values())
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 50)
    .map(g => {
      const pKey = String(g.name || g.player_name || '').trim().toLowerCase();
      const profCode = playerProfileCodeByName.get(pKey);
      const prof = profCode ? playerProfilesByCode.get(profCode) : null;
      const w = prof?.wallet || {};
      const freeModes = new Set(['normal', 'osu_hybrid', 'locura']);
      const paidModes = prof?.unlocked_modes && typeof prof.unlocked_modes === 'object'
        ? Object.keys(prof.unlocked_modes).filter(m => prof.unlocked_modes[m] && !freeModes.has(m))
        : [];
      const songsCount = prof?.highscores && typeof prof.highscores === 'object'
        ? Object.keys(prof.highscores).length
        : 0;
      return {
        name: prof?.player_name || g.name || 'Jugador',
        player_name: prof?.player_name || g.name || 'Jugador',
        total_score: g.total_score || 0,
        clefs: Math.max(Number(w.clefs) || 0, Number(g.clefs) || 0),
        medals: {
          silvers: Number(w.silvers) || 0,
          golds: Number(w.golds) || 0,
          platinums: Number(w.platinums) || 0
        },
        songs_count: songsCount,
        unlocked_modes: paidModes,
        effects_count: Array.isArray(prof?.unlocked_effects) ? prof.unlocked_effects.length : 1,
        has_password: Boolean(prof?.pin_hash || prof?.password_hash)
      };
    });

  // 2. Semanal: Ranking acumulativo por puntos conseguidos esta semana
  const currentWeek = getIsoWeekId();
  const currentWeekData = playerWeeklyAccumulator.get(currentWeek) || new Map();
  const weeklyList = Array.from(currentWeekData.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  // 3. Referidos verificados por enlace (?ref=...)
  const referralsObj = {};
  for (const [refKey, friendsSet] of completedReferralsMap.entries()) {
    if (friendsSet && friendsSet.size > 0) {
      referralsObj[refKey] = Array.from(friendsSet);
    }
  }

  // 4. Canción del Día (Video Poker): Conservar los últimos 7 días con bote y clasificación verificada
  const dailyPokerObj = {};
  const recentDayKeys = Array.from(dailyPokerStateByDay.keys()).sort().slice(-7);
  for (const dKey of recentDayKeys) {
    const st = dailyPokerStateByDay.get(dKey);
    if (st && typeof st === 'object') {
      dailyPokerObj[dKey] = {
        dayKey: st.dayKey || dKey,
        potClefs: Math.max(150, Number(st.potClefs) || 150),
        wageredPlayers: Array.isArray(st.wageredPlayers) ? st.wageredPlayers.slice(0, 200) : [],
        rankings: (Array.isArray(st.rankings) ? st.rankings : []).slice(0, 50)
      };
    }
  }

  // 5. Historial de semanas anteriores del Torneo Semanal (últimas 6 semanas para entrega exacta de premios)
  const weeklyHistoryObj = {};
  const recentWeekIds = Array.from(playerWeeklyAccumulator.keys()).sort().slice(-6);
  for (const wId of recentWeekIds) {
    if (wId === currentWeek) continue;
    const wMap = playerWeeklyAccumulator.get(wId);
    if (wMap && wMap.size > 0) {
      weeklyHistoryObj[wId] = Array.from(wMap.values())
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 100)
        .map(p => ({ name: p.name || p.player_name || 'Jugador', score: p.score || 0 }));
    }
  }

  // 6. Perfiles en la nube indexados directamente por el Nombre de Usuario (player_name)
  const profilesObj = {};
  const uniqueByName = new Map();
  for (const [, prof] of playerProfilesByCode.entries()) {
    const pName = String(prof?.player_name || '').trim();
    const nmLower = pName.toLowerCase();
    if (!nmLower || nmLower === 'jugador' || nmLower === 'jugador anónimo' || nmLower === 'jugador anonimo') continue;
    const existing = uniqueByName.get(nmLower);
    if (!existing || computeProfileRichnessServer(prof) >= computeProfileRichnessServer(existing)) {
      uniqueByName.set(nmLower, prof);
    }
  }
  const sortedProfiles = Array.from(uniqueByName.values())
    .sort((a, b) => computeProfileRichnessServer(b) - computeProfileRichnessServer(a))
    .slice(0, 1500);
  for (const prof of sortedProfiles) {
    const keyName = String(prof.player_name || prof.recovery_code).trim();
    profilesObj[keyName] = prof;
  }

  return {
    songs: songsObj,
    global: globalList,
    weekly: {
      week_id: currentWeek,
      clean_v2: true,
      players: weeklyList
    },
    weekly_history: weeklyHistoryObj,
    daily_poker: dailyPokerObj,
    referrals: referralsObj,
    player_profiles: profilesObj
  };
}

// Límite anti-rate-limit para evitar superar los 100 deployments/día de Vercel:
// La memoria RAM y el archivo local leaderboard.json se actualizan al instante (0ms),
// pero el commit remoto a GitHub se agrupa como máximo 1 vez cada 3 horas (máx 8 commits/día)
// o al apagarse el servidor (SIGTERM/SIGINT).
const GITHUB_SYNC_MIN_INTERVAL_MS = parseInt(process.env.GITHUB_SYNC_INTERVAL_MS || String(3 * 60 * 60 * 1000), 10);
let lastGithubLeaderboardSyncTime = 0;
let lastSyncedGithubLeaderboardJson = '';
let scheduledGithubSyncTimer = null;

async function syncLeaderboardToGithub(forceImmediate = false) {
  const consolidated = buildConsolidatedLeaderboardJson();
  const jsonStr = JSON.stringify(consolidated, null, 2);

  // Always save locally to leaderboard.json immediately
  try {
    fs.writeFileSync(GITHUB_LEADERBOARD_FILE, jsonStr, 'utf-8');
  } catch (e) {
    console.warn('[Server] Could not write local leaderboard.json:', e.message);
  }

  if (!GITHUB_TOKEN) return;

  // Si el contenido no ha cambiado respecto al último commit en GitHub, no hacer commit
  if (jsonStr === lastSyncedGithubLeaderboardJson) {
    return;
  }

  const now = Date.now();
  const elapsed = now - lastGithubLeaderboardSyncTime;

  if (!forceImmediate && lastGithubLeaderboardSyncTime > 0 && elapsed < GITHUB_SYNC_MIN_INTERVAL_MS) {
    if (!scheduledGithubSyncTimer) {
      const remainingMs = Math.max(10000, GITHUB_SYNC_MIN_INTERVAL_MS - elapsed);
      scheduledGithubSyncTimer = setTimeout(() => {
        scheduledGithubSyncTimer = null;
        syncLeaderboardToGithub(true).catch(() => {});
      }, remainingMs);
      if (typeof scheduledGithubSyncTimer.unref === 'function') {
        scheduledGithubSyncTimer.unref();
      }
      console.log(`[Server] GitHub leaderboard commit batched (next commit in ${Math.round(remainingMs / 60000)} min to prevent Vercel deployment limit).`);
    }
    return;
  }

  if (isSyncingToGithub) {
    pendingGithubSync = true;
    return;
  }

  if (scheduledGithubSyncTimer) {
    clearTimeout(scheduledGithubSyncTimer);
    scheduledGithubSyncTimer = null;
  }

  isSyncingToGithub = true;
  try {
    const base64Content = Buffer.from(jsonStr).toString('base64');
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/leaderboard.json`;
    const payload = {
      message: `Update online leaderboards [skip ci] [vercel skip]`,
      content: base64Content,
      branch: GITHUB_BRANCH
    };
    if (githubLeaderboardSha) {
      payload.sha = githubLeaderboardSha;
    }

    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Renacer-Leaderboard-Service',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      githubLeaderboardSha = data?.content?.sha || githubLeaderboardSha;
      lastGithubLeaderboardSyncTime = Date.now();
      lastSyncedGithubLeaderboardJson = jsonStr;
      console.log('[Server] Online leaderboard successfully persisted to GitHub (batched).');
    } else {
      const errTxt = await res.text();
      console.warn('[Server] GitHub leaderboard commit returned:', res.status, errTxt);
    }
  } catch (err) {
    console.warn('[Server] GitHub leaderboard commit failed:', err.message);
  } finally {
    isSyncingToGithub = false;
    if (pendingGithubSync) {
      pendingGithubSync = false;
      syncLeaderboardToGithub(false).catch(() => {});
    }
  }
}

// Volcar cualquier cambio pendiente de leaderboard a GitHub antes de apagar el contenedor
['SIGTERM', 'SIGINT'].forEach(sig => {
  process.on(sig, () => {
    if (scheduledGithubSyncTimer) {
      clearTimeout(scheduledGithubSyncTimer);
      scheduledGithubSyncTimer = null;
      syncLeaderboardToGithub(true).finally(() => process.exit(0));
    } else {
      process.exit(0);
    }
  });
});

async function loadLeaderboardFromGithub() {
  if (GITHUB_TOKEN) {
    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/leaderboard.json?ref=${GITHUB_BRANCH}`;
      const res = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Renacer-Leaderboard-Service'
        }
      });
      if (res.ok) {
        const data = await res.json();
        githubLeaderboardSha = data.sha;
        if (data.content) {
          const raw = Buffer.from(data.content, 'base64').toString('utf-8');
          fs.writeFileSync(GITHUB_LEADERBOARD_FILE, raw, 'utf-8');
          lastSyncedGithubLeaderboardJson = raw;
          lastGithubLeaderboardSyncTime = Date.now();
          applyLeaderboardJson(JSON.parse(raw));
          console.log('[Server] Loaded leaderboard.json directly from GitHub API.');
          return;
        }
      }
    } catch (err) {
      console.warn('[Server] Could not load leaderboard from GitHub API:', err.message);
    }
  }

  // Fallback to local leaderboard.json if present
  try {
    if (fs.existsSync(GITHUB_LEADERBOARD_FILE)) {
      const raw = fs.readFileSync(GITHUB_LEADERBOARD_FILE, 'utf-8');
      applyLeaderboardJson(JSON.parse(raw));
      console.log('[Server] Loaded leaderboard from local leaderboard.json.');
    }
  } catch (err) {
    console.warn('[Server] Could not load local leaderboard.json:', err.message);
  }
}

function applyLeaderboardJson(data) {
  if (!data || typeof data !== 'object') return;
  if (data.songs && typeof data.songs === 'object') {
    for (const [id, list] of Object.entries(data.songs)) {
      if (!Array.isArray(list)) continue;
      const formatted = list
        .filter(item => {
          const nm = (item.name || item.player_name || '').trim().toLowerCase();
          return nm && nm !== 'test' && nm !== 'tester' && nm !== 'prueba' && nm !== 'dummy' && nm !== 'test user';
        })
        .map((item, idx) => ({
          rank: idx + 1,
          chart_id: id,
          player_name: item.name || item.player_name || 'Jugador',
          score: parseInt(item.score, 10) || 0,
          max_combo: parseInt(item.combo || item.max_combo, 10) || 0,
          stars: parseFloat(item.stars) || 3.5,
          accuracy_pct: parseFloat(item.accuracy || item.accuracy_pct) || 100.0,
          created_at: item.date || item.created_at || new Date().toISOString()
        }));
      const existing = chartScores.get(id) || [];
      const mergedMap = new Map();
      existing.forEach(e => {
        const k = (e.player_name || '').trim().toLowerCase();
        if (k && k !== 'test' && k !== 'tester' && k !== 'prueba' && k !== 'dummy') {
          mergedMap.set(k, e);
        }
      });
      formatted.forEach(f => {
        const key = (f.player_name || '').trim().toLowerCase();
        if (!mergedMap.has(key) || f.score > (mergedMap.get(key).score || 0)) {
          mergedMap.set(key, f);
        }
      });
      const combined = Array.from(mergedMap.values()).sort((a, b) => b.score - a.score);
      combined.forEach((c, i) => (c.rank = i + 1));
      chartScores.set(id, combined.slice(0, 50));
    }
  }
  // Restaurar acumulador Global
  if (Array.isArray(data.global)) {
    data.global.forEach(p => {
      const key = (p.name || '').trim().toLowerCase();
      if (key && key !== 'test' && key !== 'tester' && key !== 'prueba' && key !== 'dummy') {
        playerGlobalAccumulator.set(key, { name: p.name, total_score: p.total_score || 0, clefs: p.clefs || 0 });
      }
    });
  }

  // Restaurar historial de semanas anteriores (permite verificar el puesto real al reclamar premios de la semana terminada)
  if (data.weekly_history && typeof data.weekly_history === 'object') {
    for (const [rawWId, list] of Object.entries(data.weekly_history)) {
      if (!Array.isArray(list)) continue;
      const normWId = String(rawWId).replace('_', '-');
      const wMap = new Map();
      list.forEach(p => {
        const key = (p.name || p.player_name || '').trim().toLowerCase();
        if (key && key !== 'test' && key !== 'tester' && key !== 'prueba' && key !== 'dummy') {
          wMap.set(key, { name: p.name || p.player_name, score: p.score || 0 });
        }
      });
      if (wMap.size > 0) {
        playerWeeklyAccumulator.set(normWId, wMap);
      }
    }
  }

  // Restaurar acumulador Semanal (descartar puntos de 2026-W44 previos al parche clean_v2 que arrastraban bestScore antiguo y doble guardado)
  if (data.weekly && data.weekly.week_id && Array.isArray(data.weekly.players)) {
    const normWeekId = String(data.weekly.week_id).replace('_', '-');
    const isCorruptedPreFixW44 = (normWeekId === '2026-W44' && !data.weekly.clean_v2);
    if (!isCorruptedPreFixW44) {
      const weekMap = new Map();
      data.weekly.players.forEach(p => {
        const key = (p.name || '').trim().toLowerCase();
        if (key && key !== 'test' && key !== 'tester' && key !== 'prueba' && key !== 'dummy') {
          weekMap.set(key, { name: p.name, score: p.score || 0 });
        }
      });
      playerWeeklyAccumulator.set(normWeekId, weekMap);
    } else {
      playerWeeklyAccumulator.set('2026-W44', new Map());
      setTimeout(() => { syncLeaderboardToGithub(true).catch(() => {}); }, 1500);
    }
  }

  // Restaurar referidos verificados por enlace
  if (data.referrals && typeof data.referrals === 'object') {
    for (const [refKey, friendList] of Object.entries(data.referrals)) {
      if (Array.isArray(friendList)) {
        friendList.forEach(fName => registerReferralHelper(refKey, fName));
      }
    }
  }

  // Restaurar estado persistente de Canción del Día (Video Poker)
  if (data.daily_poker && typeof data.daily_poker === 'object') {
    for (const [dKey, savedDay] of Object.entries(data.daily_poker)) {
      if (!savedDay || typeof savedDay !== 'object') continue;
      const existing = dailyPokerStateByDay.get(dKey);
      const incomingRankings = (Array.isArray(savedDay.rankings) ? savedDay.rankings : []).filter(r => {
        const nm = String(r.player_name || '').trim().toLowerCase();
        return nm && nm !== 'test' && nm !== 'tester' && nm !== 'prueba' && nm !== 'dummy';
      });
      if (existing) {
        existing.potClefs = Math.max(150, Number(existing.potClefs) || 150, Number(savedDay.potClefs) || 150);
        const wSet = new Set([...(existing.wageredPlayers || []), ...(savedDay.wageredPlayers || [])]);
        existing.wageredPlayers = Array.from(wSet);
        const rMap = new Map();
        for (const r of [...(existing.rankings || []), ...incomingRankings]) {
          const pKey = String(r.player_id || r.player_name || '').trim().toLowerCase();
          if (!pKey) continue;
          const prev = rMap.get(pKey);
          if (!prev || (Number(r.score) || 0) > (Number(prev.score) || 0)) {
            rMap.set(pKey, r);
          }
        }
        existing.rankings = Array.from(rMap.values()).sort((a, b) => (b.score || 0) - (a.score || 0));
      } else {
        dailyPokerStateByDay.set(dKey, {
          dayKey: dKey,
          potClefs: Math.max(150, Number(savedDay.potClefs) || 150),
          wageredPlayers: Array.isArray(savedDay.wageredPlayers) ? savedDay.wageredPlayers : [],
          rankings: incomingRankings.sort((a, b) => (b.score || 0) - (a.score || 0)),
          _needsHydration: true
        });
      }
    }
  }

  // Restaurar perfiles completos de jugadores guardados en GitHub (indexados por Nombre de Usuario o por Código RNC)
  if (data.player_profiles && typeof data.player_profiles === 'object') {
    for (const [rawKey, savedProf] of Object.entries(data.player_profiles)) {
      if (!savedProf || typeof savedProf !== 'object') continue;
      registerOrMergeCanonicalProfileServer(rawKey, savedProf);
    }
    savePlayerProfilesToDisk();
  }
}

function saveScoresToDisk() {
  try {
    fs.mkdirSync(path.dirname(SCORES_FILE), { recursive: true });
    const obj = {};
    for (const [id, scores] of chartScores.entries()) {
      obj[id] = scores;
    }
    fs.writeFileSync(SCORES_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Server] Could not save scores to disk:', err.message);
  }
}

function loadScoresFromDisk() {
  try {
    if (fs.existsSync(SCORES_FILE)) {
      const raw = fs.readFileSync(SCORES_FILE, 'utf-8');
      const obj = JSON.parse(raw);
      for (const [id, scores] of Object.entries(obj)) {
        const cleaned = (scores || []).filter(s => {
          const nm = String(s.player_name || s.name || '').trim().toLowerCase();
          return nm && nm !== 'test' && nm !== 'tester' && nm !== 'prueba' && nm !== 'dummy';
        });
        chartScores.set(id, cleaned);
      }
      console.log(`[Server] Loaded persistent scores for ${chartScores.size} charts.`);
    }
  } catch (err) {
    console.warn('[Server] Could not load scores from disk:', err.message);
  }
}

function saveDailyPokerStateToDisk() {
  try {
    fs.mkdirSync(path.dirname(DAILY_POKER_STATE_FILE), { recursive: true });
    const obj = {};
    for (const [k, v] of dailyPokerStateByDay.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(DAILY_POKER_STATE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Server] Could not save daily poker state to disk:', err.message);
  }
}

function loadDailyPokerStateFromDisk() {
  try {
    if (fs.existsSync(DAILY_POKER_STATE_FILE)) {
      const raw = fs.readFileSync(DAILY_POKER_STATE_FILE, 'utf-8');
      const obj = JSON.parse(raw);
      for (const [k, v] of Object.entries(obj)) {
        if (v && Array.isArray(v.rankings)) {
          v.rankings = v.rankings.filter(r => {
            const nm = String(r.player_name || '').trim().toLowerCase();
            return nm && nm !== 'test' && nm !== 'tester' && nm !== 'prueba' && nm !== 'dummy';
          });
        }
        dailyPokerStateByDay.set(k, v);
      }
      console.log(`[Server] Loaded persistent daily poker state for ${dailyPokerStateByDay.size} days.`);
    }
  } catch (err) {
    console.warn('[Server] Could not load daily poker state from disk:', err.message);
  }
}

function saveRatingsToDisk() {
  try {
    fs.mkdirSync(path.dirname(RATINGS_FILE), { recursive: true });
    const obj = {};
    for (const [id, ratings] of chartRatings.entries()) {
      obj[id] = ratings;
    }
    fs.writeFileSync(RATINGS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Server] Could not save ratings to disk:', err.message);
  }
}

function loadRatingsFromDisk() {
  try {
    if (fs.existsSync(RATINGS_FILE)) {
      const raw = fs.readFileSync(RATINGS_FILE, 'utf-8');
      const obj = JSON.parse(raw);
      for (const [id, ratings] of Object.entries(obj)) {
        chartRatings.set(id, ratings);
      }
      console.log(`[Server] Loaded persistent ratings for ${chartRatings.size} charts.`);
    }
  } catch (err) {
    console.warn('[Server] Could not load ratings from disk:', err.message);
  }
}

function isTestOrDummyChart(title, artist, id) {
  const t = String(title || '').trim().toLowerCase();
  const a = String(artist || '').trim().toLowerCase();
  const i = String(id || '').trim().toLowerCase();
  if (i === 'comm_cyber_frenzy' || i === 'comm_galaxy_anthem' || i === 'comm_moonlight_flow' || i === 'comm_1788622108_2296' || i === 'comm_1789045500_1819') return true;
  if (t === 'unit test song' || t === 'test' || t === 'test miniatura' || t === 'nueva pista' || a === 'tester') return true;
  return false;
}

// Helper to seed community charts from disk
function seedCommunityCharts() {
  const seedItems = [
    {
      id: 'comm_camilo_sesto',
      folder: 'comm_camilo_sesto',
      title: '¿Quieres ser mi amante?',
      artist: 'Camilo Sesto',
      creator_id: 'creator_javar61',
      creator_name: 'JaVar61',
      bpm: 76.17,
      offset_ms: 18122,
      difficulty_name: 'Media',
      stars: 4.0,
      scroll_duration_ms: 1550,
      notes_count: 404,
      rating_avg: 0,
      votes_count: 0,
      sync_avg: 100.0,
      sync_votes_count: 0,
      created_at: '2026-03-01 10:00:00',
    },
    {
      id: 'comm_renacer',
      folder: 'comm_renacer',
      title: 'Renacer',
      artist: 'Piano Community',
      creator_id: 'creator_piano',
      creator_name: 'Piano Community',
      bpm: 100.0,
      offset_ms: 0,
      difficulty_name: 'Media',
      stars: 3.5,
      scroll_duration_ms: 1600,
      notes_count: 130,
      rating_avg: 0,
      votes_count: 0,
      sync_avg: 100.0,
      sync_votes_count: 0,
      created_at: '2026-01-01 12:00:00',
    },
    {
      id: 'comm_impuestos',
      folder: 'comm_impuestos',
      title: 'Impuestos',
      artist: 'Perro Sánxe',
      creator_id: 'creator_sanxe',
      creator_name: 'Perro Sánxe',
      bpm: 160.0,
      offset_ms: 0,
      difficulty_name: 'Difícil',
      stars: 5.5,
      scroll_duration_ms: 1300,
      notes_count: 250,
      rating_avg: 0,
      votes_count: 0,
      sync_avg: 100.0,
      sync_votes_count: 0,
      created_at: '2026-01-05 15:30:00',
    },
  ];

  for (const item of seedItems) {
    const chartData = {
      ...item,
      source: 'community',
      source_name: '🌍 Comunidad',
      audio_url: `/api/v1/community/charts/${item.id}/audio`,
      chart_url: `/api/v1/community/charts/${item.id}/chart`,
      audio_filename: 'audio.mp3',
      chart_filename: 'chart.json',
    };
    communityCharts.set(item.id, chartData);
  }

  // Also scan community directory for any user-uploaded songs
  try {
    if (fs.existsSync(COMMUNITY_DIR)) {
      const folders = fs.readdirSync(COMMUNITY_DIR);
      for (const folder of folders) {
        if (folder.startsWith('.') || communityCharts.has(folder)) continue;
        const chartJsonPath = path.join(COMMUNITY_DIR, folder, 'chart.json');
        if (fs.existsSync(chartJsonPath)) {
          try {
            const raw = fs.readFileSync(chartJsonPath, 'utf-8');
            const data = JSON.parse(raw);
            const title = data.title || data.metadata?.title || folder.replace(/^comm_/, '');
            const artist = data.artist || data.metadata?.artist || 'Comunidad';
            if (isTestOrDummyChart(title, artist, folder)) continue;

            const bpm = parseFloat(data.bpm || data.metadata?.bpm || 120);
            const stars = parseFloat(data.stars || data.metadata?.stars || 3.5);
            const difficulty_name = data.difficulty_name || data.metadata?.difficulty || 'Normal';

            communityCharts.set(folder, {
              id: folder,
              title,
              artist,
              creator_id: 'creator_community',
              creator_name: 'Comunidad',
              bpm,
              offset_ms: data.offset || 0,
              difficulty_name,
              stars,
              scroll_duration_ms: data.scrollDurationMs || 1400,
              notes_count: data.notes?.length || 100,
              rating_avg: 0,
              votes_count: 0,
              sync_avg: 100.0,
              sync_votes_count: 0,
              created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
              source: 'community',
              source_name: '🌍 Comunidad',
              audio_url: `/api/v1/community/charts/${folder}/audio`,
              chart_url: `/api/v1/community/charts/${folder}/chart`,
              audio_filename: 'audio.mp3',
              chart_filename: 'chart.json',
            });
          } catch (e) {
            // ignore malformed charts
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not scan community directory:', err);
  }
}

seedCommunityCharts();
loadScoresFromDisk();
loadRatingsFromDisk();
loadDailyPokerStateFromDisk();
loadPlayerProfilesFromDisk();
loadLeaderboardFromGithub().catch(() => {});

// ==========================================
// 1. Health & Status Endpoints
// ==========================================
app.get('/ping', (req, res) => {
  res.type('text/plain').send('OK');
});

app.get(['/health', '/api/v1/health', '/healthz'], (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Piano Community Rhythm Engine',
    version: '3.1.2',
    num_lanes: 3,
    sources: ['osu! Mania', 'Clone Hero'],
  });
});

app.get(['/api/version', '/api/v1/version'], (req, res) => {
  res.json({
    version_code: 54,
    version_name: '5.4.0',
    release_notes: 'Piano Community v5.4.0: Seleccion de formas de hold en Modo Pulso escalada por duracion (lineas y curvas simples en holds cortos; infinitos, espirales y loopings en holds largos) y transicion corregida al terminar el Haz de Luz en Modo Cruce y Locura.',
    download_url: '/download/apk?v=54.0',
  });
});

const YT_CLIENT_VERSION = '2.20261022.01.00';

app.get(['/api/v1/youtube/search_playlists', '/api/youtube/search_playlists'], async (req, res) => {
  const q = String(req.query.q || req.query.query || '').trim();
  if (!q) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  const results = [];
  const seen = new Set();

  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 7500);
    const ytRes = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        context: {
          client: { clientName: 'WEB', clientVersion: YT_CLIENT_VERSION, hl: 'es', gl: 'ES' },
        },
        query: q,
        params: 'EgIQAw%3D%3D',
      }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);

    if (ytRes.ok) {
      const data = await ytRes.json();
      function walkSearch(node, depth = 0) {
        if (!node || depth > 24) return;
        if (node.lockupViewModel && node.lockupViewModel.contentId) {
          const vm = node.lockupViewModel;
          const id = String(vm.contentId).replace(/^VL/, '');
          if (
            (vm.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST' || id.startsWith('PL') || id.startsWith('OLAK5uy_')) &&
            !seen.has(id)
          ) {
            seen.add(id);
            const title = vm.metadata?.lockupMetadataViewModel?.title?.content || 'Playlist';
            const rows = vm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
            const author = rows[0]?.metadataParts?.[0]?.text?.content || 'YouTube';
            const thumbSources =
              vm.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.image?.sources ||
              vm.contentImage?.thumbnailViewModel?.image?.sources ||
              [];
            const thumb = thumbSources[thumbSources.length - 1]?.url || thumbSources[0]?.url || './app_logo.png';
            const badgeText =
              vm.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.overlays?.[0]
                ?.thumbnailOverlayBadgeViewModel?.thumbnailBadges?.[0]?.thumbnailBadgeViewModel?.text || 'Playlist';
            results.push({
              playlistId: id,
              title,
              author,
              videoCount: badgeText,
              thumbnail: thumb,
            });
          }
        } else if (node.playlistRenderer && node.playlistRenderer.playlistId) {
          const pl = node.playlistRenderer;
          const id = pl.playlistId;
          if (!seen.has(id)) {
            seen.add(id);
            const title = pl.title?.simpleText || pl.title?.runs?.[0]?.text || 'Playlist';
            const author = pl.shortBylineText?.runs?.[0]?.text || pl.longBylineText?.runs?.[0]?.text || 'YouTube';
            const count = pl.videoCount || pl.itemCount || pl.videoCountText?.runs?.[0]?.text || 'Playlist';
            const firstVid = pl.navigationEndpoint?.watchEndpoint?.videoId || '';
            const thumb =
              pl.thumbnails?.[0]?.thumbnails?.[0]?.url ||
              (firstVid ? `https://i.ytimg.com/vi/${firstVid}/hqdefault.jpg` : './app_logo.png');
            results.push({ playlistId: id, title, author, videoCount: `${count} temas`, thumbnail: thumb });
          }
        }
        if (Array.isArray(node)) {
          for (const c of node) walkSearch(c, depth + 1);
        } else if (typeof node === 'object') {
          for (const k of Object.keys(node)) {
            if (k !== 'trackingParams' && k !== 'responseContext') walkSearch(node[k], depth + 1);
          }
        }
      }
      walkSearch(data);
    }
  } catch (e) {}

  const sliced = results.slice(0, 24);
  return res.json({ query: q, results: sliced, playlists: sliced });
});

app.get(['/api/v1/youtube/playlist', '/api/youtube/playlist'], async (req, res) => {
  const rawId = String(req.query.id || req.query.list || '').trim();
  const listMatch = rawId.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  const cleanId = listMatch ? listMatch[1] : rawId.replace(/^VL/, '').split('&')[0].trim();
  if (!cleanId) {
    return res.status(400).json({ error: 'Missing playlist id' });
  }

  let playlistTitle = 'Playlist de YouTube';
  const tracks = [];
  const seen = new Set();

  function parseBrowsePage(data) {
    let nextToken = null;
    const hdrTitle =
      data?.header?.pageHeaderRenderer?.pageTitle ||
      data?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel?.title?.dynamicTextViewModel?.text?.content ||
      data?.header?.playlistHeaderRenderer?.title?.simpleText ||
      data?.header?.playlistHeaderRenderer?.title?.runs?.[0]?.text ||
      data?.metadata?.playlistMetadataRenderer?.title ||
      data?.microformat?.microformatDataRenderer?.title;
    if (hdrTitle && playlistTitle === 'Playlist de YouTube') {
      playlistTitle = String(hdrTitle).replace(/ - YouTube$/, '').trim();
    }

    function walkNode(node, depth = 0) {
      if (!node || depth > 26) return;
      if (
        node.lockupViewModel &&
        node.lockupViewModel.contentId &&
        (node.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' ||
          String(node.lockupViewModel.contentId).length === 11)
      ) {
        const vm = node.lockupViewModel;
        const vid = String(vm.contentId);
        if (!seen.has(vid)) {
          seen.add(vid);
          const title = vm.metadata?.lockupMetadataViewModel?.title?.content || `Pista #${tracks.length + 1}`;
          const artist =
            vm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]
              ?.metadataParts?.[0]?.text?.content || 'YouTube';
          tracks.push({
            id: vid,
            title,
            artist,
            thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
            duration_seconds: 0,
          });
        }
      } else if (node.playlistVideoRenderer && node.playlistVideoRenderer.videoId) {
        const v = node.playlistVideoRenderer;
        const vid = v.videoId;
        if (!seen.has(vid)) {
          seen.add(vid);
          tracks.push({
            id: vid,
            title: v.title?.runs?.[0]?.text || v.title?.simpleText || `Pista #${tracks.length + 1}`,
            artist: v.shortBylineText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || 'YouTube',
            thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
            duration_seconds: Number(v.lengthSeconds) || 0,
          });
        }
      }
      if (node.continuationItemViewModel) {
        const t = node.continuationItemViewModel?.continuationCommand?.innertubeCommand?.continuationCommand?.token;
        if (t && !nextToken) nextToken = t;
      }
      if (node.continuationItemRenderer) {
        const t =
          node.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token ||
          node.continuationItemRenderer?.continuationEndpoint?.commandExecutorCommand?.commands?.find(
            c => c.continuationCommand
          )?.continuationCommand?.token;
        if (t && !nextToken) nextToken = t;
      }
      if (Array.isArray(node)) {
        for (const c of node) walkNode(c, depth + 1);
      } else if (typeof node === 'object') {
        for (const k of Object.keys(node)) {
          if (k !== 'trackingParams' && k !== 'responseContext') walkNode(node[k], depth + 1);
        }
      }
    }
    walkNode(data);
    return nextToken;
  }

  // 1. Try YouTube Official Innertube browse API with multi-page continuation (supports 200-500+ songs)
  try {
    const browseId = cleanId.startsWith('VL') ? cleanId : `VL${cleanId}`;
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 7500);
    const ytRes = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        context: {
          client: { clientName: 'WEB', clientVersion: YT_CLIENT_VERSION, hl: 'es', gl: 'ES' },
        },
        browseId,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);

    if (ytRes.ok) {
      const data = await ytRes.json();
      let continuationToken = parseBrowsePage(data);
      let page = 1;
      while (continuationToken && page < 5 && tracks.length < 500) {
        page++;
        try {
          const cCtrl = new AbortController();
          const cTid = setTimeout(() => cCtrl.abort(), 6000);
          const contRes = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            },
            body: JSON.stringify({
              context: {
                client: { clientName: 'WEB', clientVersion: YT_CLIENT_VERSION, hl: 'es', gl: 'ES' },
              },
              continuation: continuationToken,
            }),
            signal: cCtrl.signal,
          });
          clearTimeout(cTid);
          if (!contRes.ok) break;
          const contData = await contRes.json();
          continuationToken = parseBrowsePage(contData);
        } catch (_) {
          break;
        }
      }
    }
  } catch (e) {}

  // 2. Fallback to YouTube XML RSS feed only if Innertube returned empty
  if (tracks.length === 0) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 5000);
      const xmlRes = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(cleanId)}`, {
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      if (xmlRes.ok) {
        const xml = await xmlRes.text();
        const titleMatch = xml.match(/<title>([^<]+)<\/title>/);
        if (titleMatch && titleMatch[1]) playlistTitle = titleMatch[1];
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let m;
        while ((m = entryRegex.exec(xml)) !== null) {
          const block = m[1];
          const vid = (block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
          const t = (block.match(/<title>([^<]+)<\/title>/) || [])[1] || 'Pista';
          const a = (block.match(/<name>([^<]+)<\/name>/) || [])[1] || 'YouTube';
          if (vid && !seen.has(vid)) {
            seen.add(vid);
            tracks.push({
              id: vid,
              title: t,
              artist: a,
              thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
              duration_seconds: 0,
            });
          }
        }
      }
    } catch (e) {}
  }

  return res.json({
    id: cleanId,
    title: playlistTitle,
    item_count: tracks.length,
    tracks,
  });
});

function isCompleteZipApk(filePath, fileSize) {
  try {
    if (!fileSize || fileSize < 1000000) return false;
    const readSize = Math.min(65558, fileSize);
    const buf = Buffer.alloc(readSize);
    const fd = fs.openSync(filePath, 'r');
    try {
      fs.readSync(fd, buf, 0, readSize, fileSize - readSize);
    } finally {
      fs.closeSync(fd);
    }
    for (let i = buf.length - 22; i >= 0; i--) {
      if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
        return true;
      }
    }
    return false;
  } catch (_) {
    return false;
  }
}

let cachedGithubApkProbe = { checkedAt: 0, validUrl: null, remoteSize: 0 };

async function getVerifiedGithubCdnApkUrl(expectedLocalSize) {
  const now = Date.now();
  if (now - cachedGithubApkProbe.checkedAt < 300000) {
    if (cachedGithubApkProbe.validUrl && Math.abs(cachedGithubApkProbe.remoteSize - expectedLocalSize) < 512000) {
      return cachedGithubApkProbe.validUrl;
    }
    return null;
  }
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/PianoCommunity.apk`;
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2200);
    const headRes = await fetch(rawUrl, { method: 'HEAD', signal: ctrl.signal });
    clearTimeout(tid);
    const cl = parseInt(headRes.headers.get('content-length') || '0', 10);
    if (headRes.ok && cl > 10000000 && Math.abs(cl - expectedLocalSize) < 512000) {
      cachedGithubApkProbe = { checkedAt: now, validUrl: rawUrl, remoteSize: cl };
      return rawUrl;
    }
  } catch (_) {}
  cachedGithubApkProbe = { checkedAt: now, validUrl: null, remoteSize: 0 };
  return null;
}

app.all(['/download/apk', '/api/v1/app/download_apk', '/PianoCommunity.apk', '/static/PianoCommunity.apk', '/downloads/PianoCommunity.apk', '/HyperRhythm.apk'], async (req, res) => {
  // En Render (plan gratuito de 5 GB/mes), redirigir las descargas del APK (60 MB) directamente a GitHub Releases CDN (0 bytes de gasto en Render)
  if (process.env.RENDER && !req.query.local) {
    return res.redirect(302, 'https://github.com/Bruala33/renacer/releases/latest/download/PianoCommunity.apk');
  }
  const apkCandidates = [
    path.join(STATIC_DIR, 'PianoCommunity.apk'),
    path.join(__dirname, 'PianoCommunity.apk'),
    path.join(STATIC_DIR, 'downloads', 'PianoCommunity.apk'),
    path.join(__dirname, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
    path.join(__dirname, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    path.join(__dirname, '.build-outputs', 'app-debug.apk'),
    path.join(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
    path.join(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    path.join(__dirname, 'downloads', 'PianoCommunity.apk'),
  ];
  const validApks = [];
  for (const apkPath of apkCandidates) {
    try {
      if (fs.existsSync(apkPath)) {
        const stat = fs.statSync(apkPath);
        if (stat.isFile() && isCompleteZipApk(apkPath, stat.size)) {
          validApks.push({ apkPath, stat });
        }
      }
    } catch (_) {}
  }

  if (validApks.length > 0) {
    validApks.sort((a, b) => {
      if (Math.abs(b.stat.mtimeMs - a.stat.mtimeMs) > 1000) {
        return b.stat.mtimeMs - a.stat.mtimeMs;
      }
      return b.stat.size - a.stat.size;
    });
    const { apkPath, stat } = validApks[0];
    const etag = `"apk-${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="PianoCommunity.apk"');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('ETag', etag);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Accept-Ranges, ETag');
    if (req.method === 'HEAD') {
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.status(200).end();
    }
    return res.sendFile(apkPath, {
      maxAge: 0,
      lastModified: true,
      etag: true,
      acceptRanges: true,
      cacheControl: false,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="PianoCommunity.apk"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  return res.status(404).json({
    available: false,
    error: 'El archivo APK se está preparando. Inténtalo de nuevo en unos segundos.'
  });
});

// ==========================================
// 2. High-Performance CORS Download Proxy
// ==========================================
app.all(['/api/proxy', '/api/v1/download/proxy'], async (req, res) => {
  const targetUrl = req.query.url || req.body?.url;
  if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'URL de descarga inválida o faltante.' });
  }

  try {
    const decodedUrl = decodeURIComponent(targetUrl);
    const method = req.method === 'POST' ? 'POST' : 'GET';
    const forwardHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*',
    };

    if (req.headers['content-type']) {
      forwardHeaders['Content-Type'] = req.headers['content-type'];
    }

    const fetchOptions = {
      method,
      headers: forwardHeaders,
      redirect: 'follow',
    };

    if (method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetchOptions.signal = controller.signal;

    const response = await fetch(decodedUrl, fetchOptions);
    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition);
    }

    const arrayBuffer = await response.arrayBuffer();
    return res.status(response.status).send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(502).json({ error: `Proxy falló: ${err.message}` });
  }
});

// ==========================================
// 3. Community Endpoints
// ==========================================
// Featured daily tracks - Rotación diaria real y valoraciones verificadas (sin votos falsos)
app.get('/api/v1/community/featured', (req, res) => {
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const validCharts = Array.from(communityCharts.values()).filter(
    c => !isTestOrDummyChart(c.title, c.artist, c.id)
  );

  const chartsWithStats = validCharts.map(chart => {
    const ratings = chartRatings.get(chart.id) || [];
    const recentRatings = ratings.filter(r => (now - (r.timestamp || 0)) <= TWENTY_FOUR_HOURS_MS);

    if (recentRatings.length > 0) {
      const totalStars = recentRatings.reduce((sum, r) => sum + (r.rating || 5), 0);
      const avgStars = Math.round((totalStars / recentRatings.length) * 10) / 10;
      return {
        ...chart,
        rating_avg: avgStars,
        votes_count: recentRatings.length,
        has_recent_votes: true,
      };
    }
    const allStars = ratings.reduce((sum, r) => sum + (r.rating || 5), 0);
    const allAvg = ratings.length > 0 ? Math.round((allStars / ratings.length) * 10) / 10 : 0;
    return {
      ...chart,
      rating_avg: allAvg,
      votes_count: ratings.length,
      has_recent_votes: false,
    };
  });

  // Load real catalog_top.json to rotate daily across 100+ songs
  let catalogSongs = [];
  try {
    const catPath = path.join(STATIC_DIR, 'songs', 'catalog_top.json');
    if (fs.existsSync(catPath)) {
      const rawCat = JSON.parse(fs.readFileSync(catPath, 'utf-8'));
      if (Array.isArray(rawCat)) {
        catalogSongs = rawCat.map(s => {
          const fullId = String(s.id).startsWith('top_') ? s.id : `top_${s.id}`;
          const rList = chartRatings.get(fullId) || [];
          const tot = rList.reduce((acc, r) => acc + (r.rating || 5), 0);
          return {
            id: fullId,
            title: s.title,
            artist: s.artist,
            difficulty_name: s.difficulty_name || 'Media',
            stars: s.stars || 4.0,
            is_top_song: true,
            is_community: false,
            source: 'catalog',
            source_name: 'Catálogo Oficial',
            cover_url: s.cover_url || s.thumbnail || './app_logo.png',
            thumbnail: s.cover_url || s.thumbnail || './app_logo.png',
            rating_avg: rList.length > 0 ? Math.round((tot / rList.length) * 10) / 10 : 0,
            votes_count: rList.length,
            has_recent_votes: rList.some(r => (now - (r.timestamp || 0)) <= TWENTY_FOUR_HOURS_MS),
          };
        });
      }
    }
  } catch (_) {}

  const allPool = [...chartsWithStats, ...catalogSongs];
  const ratedRecent = allPool
    .filter(s => s.has_recent_votes && s.votes_count > 0)
    .sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0) || (b.votes_count || 0) - (a.votes_count || 0));

  const d = new Date();
  const daySeed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
  const rotatedPool = allPool.filter(s => !ratedRecent.some(r => r.id === s.id));
  const selected = [...ratedRecent];

  if (rotatedPool.length > 0) {
    const step = Math.max(1, Math.floor(rotatedPool.length / 6));
    for (let i = 0; i < 6 && selected.length < 6; i++) {
      const idx = (daySeed * 7 + i * step + i * 13) % rotatedPool.length;
      const pick = rotatedPool[idx];
      if (pick && !selected.some(ex => ex.id === pick.id)) {
        selected.push(pick);
      }
    }
  }

  res.json(selected.slice(0, 6));
});

// ==========================================
// 3B. DAILY VIDEO POKER ("CANCIÓN DEL DÍA" - LAS VEGAS CASINO)
// Canción fija + Modo fijo + Dificultad fija para todo el mundo + Bote común real de Claves apostadas
// ==========================================
const DAILY_POKER_BASE_POT = 150;

const DAILY_POKER_MODES = [
  { id: 'mirror', label: 'OJEPSƎ', short: 'OJEPSƎ', icon: '🪞', color: '#00f2fe' },
  { id: 'echo', label: 'ECO', short: 'ECO', icon: '((•))', color: '#10b981' },
  { id: 'river', label: 'RÍO', short: 'RÍO', icon: '🌊', color: '#38bdf8' },
  { id: 'mushrooms', label: 'SETAS', short: 'SETAS', icon: '🍄', color: '#e879f9' },
  { id: 'minesweeper', label: 'MINAS', short: 'MINAS', icon: '💣', color: '#ef4444' },
  { id: 'storm', label: 'TORMENTA', short: 'TORMENTA', icon: '⚡', color: '#a855f7' },
  { id: 'annoying_dog', label: 'PERRO', short: 'PERRO', icon: '🐶', color: '#fbbf24' },
  { id: 'classic', label: 'CLÁSICO', short: 'CLÁSICO', icon: '🎹', color: '#f59e0b' }
];

// Tabla de pagos del Bote Acumulado: Tier 0 (0𝄞 cortesía -> 15%), Tier 1 (10𝄞 -> 30%), Tier 2 (25𝄞 -> 65%), Tier 3 (50𝄞 MÁX -> 100%)
const DAILY_POKER_BETS = [10, 25, 50];
const DAILY_POKER_TIER_FACTORS = { 0: 0.15, 1: 0.30, 2: 0.65, 3: 1.00 };
const DAILY_POKER_TIER_WAGERS = { 0: 0, 1: 10, 2: 25, 3: 50 };
const DAILY_POKER_PAYTABLE = [
  { rank: 1, hand: 'ESCALERA REAL', badge: '👑 #1', baseShare: 0.50 },
  { rank: 2, hand: 'POKER', badge: '🥈 #2', baseShare: 0.25 },
  { rank: 3, hand: 'FULL HOUSE', badge: '🥉 #3', baseShare: 0.15 },
  { rank: 4, hand: 'COLOR', badge: '♠️ #4', baseShare: 0.06 },
  { rank: 5, hand: 'ESCALERA', badge: '♥️ #5', baseShare: 0.04 }
];

function normalizeValidDayKey(rawDay) {
  if (typeof rawDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDay.trim())) {
    return rawDay.trim();
  }
  return new Date().toISOString().slice(0, 10);
}

function computeDaySeedFromKey(dayKey) {
  const parts = dayKey.split('-').map(n => parseInt(n, 10));
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return parts[0] * 372 + parts[1] * 31 + parts[2];
  }
  const now = new Date();
  return now.getUTCFullYear() * 372 + (now.getUTCMonth() + 1) * 31 + now.getUTCDate();
}

function getOrCreateDailyPokerState(requestedDayKey) {
  const dayKey = normalizeValidDayKey(requestedDayKey);
  const existing = dailyPokerStateByDay.get(dayKey);
  if (existing && !existing._needsHydration && existing.song && existing.mode) {
    return existing;
  }

  const daySeed = computeDaySeedFromKey(dayKey);
  let catalogSongs = [];
  try {
    const catPath = path.join(STATIC_DIR, 'songs', 'catalog_top.json');
    if (fs.existsSync(catPath)) {
      const rawCat = JSON.parse(fs.readFileSync(catPath, 'utf-8'));
      if (Array.isArray(rawCat) && rawCat.length > 0) {
        catalogSongs = rawCat;
      }
    }
  } catch (_) {}

  const rawSong = catalogSongs.length > 0
    ? catalogSongs[(daySeed * 19 + 7) % catalogSongs.length]
    : {
        id: 'david_bustamante_abrazame_muy_fuerte',
        title: 'Abrázame Muy Fuerte',
        artist: 'David Bustamante',
        bpm: 126,
        total_notes: 420,
        cover_url: './app_logo.png'
      };

  const cleanRawId = String(rawSong.id || 'david_bustamante_abrazame_muy_fuerte').replace(/^top_/, '');
  const fullSongId = `top_${cleanRawId}`;
  const modeObj = DAILY_POKER_MODES[(daySeed * 11 + 3) % DAILY_POKER_MODES.length];
  const difficulty = (daySeed % 2 === 0) ? 'Difícil' : 'Normal';
  const totalNotes = Number(rawSong.total_notes) || 380;
  const stars = difficulty === 'Difícil'
    ? Math.min(5, Math.max(4, Math.round(3.8 + (totalNotes / 180))))
    : Math.min(3, Math.max(2, Math.round(1.8 + (totalNotes / 260))));

  const state = {
    dayKey,
    daySeed,
    song: {
      id: fullSongId,
      raw_id: cleanRawId,
      title: rawSong.title || cleanRawId,
      artist: rawSong.artist || 'Artista',
      bpm: Number(rawSong.bpm) || 120,
      total_notes: totalNotes,
      stars,
      cover_url: rawSong.cover_url || rawSong.thumbnail || './app_logo.png',
      chart_url: rawSong.chart_url || `${cleanRawId}.json`,
      audio_url: rawSong.audio_url || `${cleanRawId}.mp3`
    },
    mode: modeObj,
    difficulty,
    potClefs: existing ? Math.max(DAILY_POKER_BASE_POT, Number(existing.potClefs) || DAILY_POKER_BASE_POT) : DAILY_POKER_BASE_POT,
    wageredPlayers: existing && Array.isArray(existing.wageredPlayers) ? existing.wageredPlayers : [],
    rankings: existing && Array.isArray(existing.rankings) ? existing.rankings : []
  };

  dailyPokerStateByDay.set(dayKey, state);
  saveDailyPokerStateToDisk();
  return state;
}

function isDummyPokerPlayerName(name) {
  const nm = String(name || '').trim().toLowerCase();
  return !nm || nm === 'test' || nm === 'tester' || nm === 'prueba' || nm === 'dummy';
}

app.get('/api/v1/daily-poker', (req, res) => {
  const requestedDay = req.query?.day ? String(req.query.day) : undefined;
  const state = getOrCreateDailyPokerState(requestedDay);
  state.rankings = (state.rankings || []).filter(r => !isDummyPokerPlayerName(r.player_name));
  state.rankings.sort((a, b) => (b.score || 0) - (a.score || 0) || (a.timestamp || 0) - (b.timestamp || 0));
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({
    success: true,
    dayKey: state.dayKey,
    song: state.song,
    mode: state.mode,
    difficulty: state.difficulty,
    potClefs: Math.max(DAILY_POKER_BASE_POT, Number(state.potClefs) || DAILY_POKER_BASE_POT),
    bets: DAILY_POKER_BETS,
    paytable: DAILY_POKER_PAYTABLE,
    rankings: state.rankings.slice(0, 50).map((r, i) => ({ ...r, rank: i + 1 }))
  });
});

app.post('/api/v1/daily-poker/wager', (req, res) => {
  const state = getOrCreateDailyPokerState(req.body?.day_key || req.body?.dayKey);
  const rawTier = Number(req.body?.bet_tier);
  const betTier = Number.isFinite(rawTier) ? Math.max(0, Math.min(3, Math.round(rawTier))) : 3;
  const wagerClefs = DAILY_POKER_TIER_WAGERS[betTier] ?? 50;

  const rawPlayerId = String(req.body?.player_id || '').trim().slice(0, 48);
  const rawName = String(req.body?.player_name || req.body?.username || 'Jugador').trim().slice(0, 28) || 'Jugador';
  const playerWagerKey = (rawPlayerId || rawName).toLowerCase();

  if (!Array.isArray(state.wageredPlayers)) state.wageredPlayers = [];
  const alreadyWagered = Boolean(playerWagerKey && state.wageredPlayers.includes(playerWagerKey));

  if (!alreadyWagered && !isDummyPokerPlayerName(rawName)) {
    if (playerWagerKey) state.wageredPlayers.push(playerWagerKey);
    state.potClefs = Math.max(DAILY_POKER_BASE_POT, (Number(state.potClefs) || DAILY_POKER_BASE_POT) + wagerClefs);
    saveDailyPokerStateToDisk();
    syncLeaderboardToGithub().catch(() => {});
  }

  res.json({
    success: true,
    dayKey: state.dayKey,
    bet_tier: betTier,
    wagerClefs,
    alreadyWagered,
    potClefs: Math.max(DAILY_POKER_BASE_POT, Number(state.potClefs) || DAILY_POKER_BASE_POT)
  });
});

app.post('/api/v1/daily-poker/submit', (req, res) => {
  const state = getOrCreateDailyPokerState(req.body?.day_key || req.body?.dayKey);
  const rawPlayerId = String(req.body?.player_id || '').trim().slice(0, 48);
  const rawName = String(req.body?.player_name || req.body?.username || req.body?.nickname || 'Jugador').trim().slice(0, 28) || 'Jugador';
  const avatarUrl = req.body?.avatar_url || null;
  const score = Math.max(0, Math.round(Number(req.body?.score) || 0));
  const accuracy = Math.max(0, Math.min(100, Number(req.body?.accuracy) || 100));
  const rawTier = Number(req.body?.bet_tier);
  const betTier = Number.isFinite(rawTier) ? Math.max(0, Math.min(3, Math.round(rawTier))) : 3;
  const wagerClefs = DAILY_POKER_TIER_WAGERS[betTier] ?? 50;

  if (!isDummyPokerPlayerName(rawName)) {
    // Garantizar que la apuesta del jugador esté sumada al bote (por si /wager falló en arranque en frío u offline)
    const playerWagerKey = (rawPlayerId || rawName).toLowerCase();
    if (!Array.isArray(state.wageredPlayers)) state.wageredPlayers = [];
    if (playerWagerKey && !state.wageredPlayers.includes(playerWagerKey)) {
      state.wageredPlayers.push(playerWagerKey);
      state.potClefs = Math.max(DAILY_POKER_BASE_POT, (Number(state.potClefs) || DAILY_POKER_BASE_POT) + wagerClefs);
    }

    if (!Array.isArray(state.rankings)) state.rankings = [];
    const existingIdx = state.rankings.findIndex(r => {
      if (rawPlayerId && r.player_id && r.player_id === rawPlayerId) return true;
      return String(r.player_name || '').trim().toLowerCase() === rawName.toLowerCase();
    });

    if (existingIdx >= 0) {
      const prev = state.rankings[existingIdx];
      prev.player_name = rawName;
      if (rawPlayerId) prev.player_id = rawPlayerId;
      if (score >= (Number(prev.score) || 0)) {
        prev.score = score;
        prev.accuracy = accuracy;
        prev.bet_tier = betTier;
        prev.wager = wagerClefs;
        prev.avatar_url = avatarUrl || prev.avatar_url || null;
        prev.timestamp = prev.timestamp || Date.now();
      }
    } else {
      state.rankings.push({
        player_id: rawPlayerId || undefined,
        player_name: rawName,
        avatar_url: avatarUrl,
        score,
        accuracy,
        bet_tier: betTier,
        wager: wagerClefs,
        timestamp: Date.now()
      });
    }
  }

  // Purge any test accounts and sort descending by score (tie-break: earlier timestamp)
  state.rankings = (state.rankings || []).filter(r => !isDummyPokerPlayerName(r.player_name));
  state.rankings.sort((a, b) => (b.score || 0) - (a.score || 0) || (a.timestamp || 0) - (b.timestamp || 0));

  const achievedIdx = state.rankings.findIndex(r => {
    if (rawPlayerId && r.player_id && r.player_id === rawPlayerId) return true;
    return String(r.player_name || '').trim().toLowerCase() === rawName.toLowerCase();
  });
  const rank = achievedIdx >= 0 ? (achievedIdx + 1) : (state.rankings.length + 1);

  let matchedRow = null;
  if (rank >= 1 && rank <= 5) {
    matchedRow = DAILY_POKER_PAYTABLE[rank - 1];
  }

  let potWin = 0;
  let handName = 'FUERA DEL TOP 5';
  if (matchedRow) {
    handName = matchedRow.hand;
    const tierFactor = DAILY_POKER_TIER_FACTORS[betTier] ?? 0.30;
    potWin = Math.max(5, Math.round(state.potClefs * matchedRow.baseShare * tierFactor));
  }

  saveDailyPokerStateToDisk();
  syncLeaderboardToGithub().catch(() => {});

  res.json({
    success: true,
    dayKey: state.dayKey,
    rank,
    handName,
    bet_tier: betTier,
    wager: wagerClefs,
    fixedWin: 0,
    potWin,
    totalWin: potWin,
    potClefs: Math.max(DAILY_POKER_BASE_POT, Number(state.potClefs) || DAILY_POKER_BASE_POT),
    rankings: state.rankings.slice(0, 50).map((r, i) => ({ ...r, rank: i + 1 }))
  });
});

function normalizeSearchText(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDist(s1, s2) {
  const m = s1.length, n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

function wordSimilarity(w1, w2) {
  if (w1 === w2) return 1.0;
  if (!w1 || !w2) return 0;
  if (w1.length >= 3 && (w2.startsWith(w1) || w1.startsWith(w2))) {
    return (Math.min(w1.length, w2.length) / Math.max(w1.length, w2.length)) * 0.95;
  }
  if (w1.length >= 3 && (w2.includes(w1) || w1.includes(w2))) {
    return (Math.min(w1.length, w2.length) / Math.max(w1.length, w2.length)) * 0.90;
  }
  const maxLen = Math.max(w1.length, w2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDist(w1, w2);
  return Math.max(0, 1.0 - (dist / maxLen));
}

function computeSongRelevanceScore(query, title, artist, extra = '') {
  const nq = normalizeSearchText(query);
  if (!nq) return 100;
  const nt = normalizeSearchText(title);
  const na = normalizeSearchText(artist);
  const ne = normalizeSearchText(extra);

  if (nt === nq || na === nq) return 100;

  if (nt.includes(nq)) {
    return (' ' + nt + ' ').includes(' ' + nq + ' ') ? 98 : 94;
  }
  if (na.includes(nq)) {
    return (' ' + na + ' ').includes(' ' + nq + ' ') ? 96 : 92;
  }

  const qWords = nq.split(' ').filter(Boolean);
  if (!qWords.length) return 0;

  const tWords = nt.split(' ').filter(Boolean);
  const aWords = na.split(' ').filter(Boolean);
  const primaryWords = [...tWords, ...aWords];

  let primaryScore = 0;
  if (primaryWords.length > 0) {
    let sumSim = 0;
    for (const qw of qWords) {
      let best = 0;
      for (const pw of primaryWords) {
        const sim = wordSimilarity(qw, pw);
        if (sim > best) best = sim;
      }
      sumSim += best;
    }
    primaryScore = Math.round((sumSim / qWords.length) * 100);
  }

  if (primaryScore >= 50) {
    return Math.min(100, primaryScore);
  }

  if (ne) {
    if (ne.includes(nq)) {
      return (' ' + ne + ' ').includes(' ' + nq + ' ') ? 75 : 68;
    }
    const eWords = ne.split(' ').filter(Boolean);
    if (eWords.length > 0) {
      let sumSim = 0;
      for (const qw of qWords) {
        let best = 0;
        for (const ew of eWords) {
          const sim = wordSimilarity(qw, ew);
          if (sim > best) best = sim;
        }
        sumSim += best;
      }
      const extraScore = Math.round((sumSim / qWords.length) * 70);
      if (extraScore >= 40) return Math.min(75, Math.max(primaryScore, extraScore));
    }
  }

  return Math.max(0, primaryScore);
}

// Search community tracks
app.get('/api/v1/community/charts/search', (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const difficulty = (req.query.difficulty || '').toString().toLowerCase().trim();
  const sort = (req.query.sort || 'rating').toString().toLowerCase().trim();
  const creator_id = (req.query.creator_id || '').toString().trim();

  let results = Array.from(communityCharts.values());

  if (q) {
    results = results
      .map((c) => ({
        ...c,
        relevanceScore: computeSongRelevanceScore(q, c.title, c.artist, c.creator_name || ''),
      }))
      .filter((c) => c.relevanceScore >= 35);
  }

  if (difficulty && difficulty !== 'todas') {
    results = results.filter((c) => c.difficulty_name?.toLowerCase() === difficulty);
  }

  if (creator_id) {
    results = results.filter((c) => c.creator_id === creator_id);
  }

  if (q && sort !== 'newest') {
    results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  } else if (sort === 'newest') {
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sort === 'trending') {
    results.sort((a, b) => b.votes_count - a.votes_count || b.rating_avg - a.rating_avg);
  } else {
    results.sort((a, b) => b.rating_avg - a.rating_avg || b.votes_count - a.votes_count);
  }

  res.json(results);
});

// Publish track
app.post('/api/v1/community/charts/publish', (req, res) => {
  try {
    const rawBody = req.body || {};
    const title = (rawBody.title || rawBody.title_name || '').trim();
    const artist = (rawBody.artist || rawBody.artist_name || '').trim();
    const creator_name = (rawBody.creator_name || rawBody.creator || '').trim();
    const bpm = rawBody.bpm;
    const stars = rawBody.stars;
    const difficulty = rawBody.difficulty || rawBody.difficulty_name;
    const chart_data = rawBody.chart_data || rawBody.chart_json;
    const audio_data = rawBody.audio_data || rawBody.audio_file || rawBody.audioBlob;
    const newId = `comm_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const folderPath = path.join(COMMUNITY_DIR, newId);
    fs.mkdirSync(folderPath, { recursive: true });

    if (chart_data) {
      const content = typeof chart_data === 'string' ? chart_data : JSON.stringify(chart_data, null, 2);
      fs.writeFileSync(path.join(folderPath, 'chart.json'), content, 'utf-8');
    }

    if (audio_data && typeof audio_data === 'string') {
      const base64Data = audio_data.replace(/^data:audio\/\w+;base64,/, '');
      fs.writeFileSync(path.join(folderPath, 'audio.mp3'), Buffer.from(base64Data, 'base64'));
    }

    const newChart = {
      id: newId,
      title: title || 'Nueva Pista',
      artist: artist || 'Comunidad',
      creator_id: `creator_${Date.now()}`,
      creator_name: creator_name || 'Charter',
      bpm: parseFloat(bpm) || 120.0,
      offset_ms: 0,
      difficulty_name: difficulty || 'Media',
      stars: parseFloat(stars) || 3.5,
      scroll_duration_ms: 1400,
      notes_count: 100,
      rating_avg: 5.0,
      votes_count: 1,
      sync_avg: 100.0,
      sync_votes_count: 1,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      source: 'community',
      source_name: '🌍 Comunidad',
      audio_url: `/api/v1/community/charts/${newId}/audio`,
      chart_url: `/api/v1/community/charts/${newId}/chart`,
      audio_filename: 'audio.mp3',
      chart_filename: 'chart.json',
    };

    communityCharts.set(newId, newChart);
    syncCommunityChartsToGithub().catch(() => {});
    res.json({ success: true, chart_id: newId, chart: newChart });
  } catch (err) {
    res.status(500).json({ error: `Error publicando pista: ${err.message}` });
  }
});

// Chart details
app.get('/api/v1/community/charts/:id/details', (req, res) => {
  const id = req.params.id;
  const chart = communityCharts.get(id);
  if (chart) {
    return res.json(chart);
  }
  res.status(404).json({ error: 'Pista no encontrada' });
});

// Serve Chart JSON
app.get('/api/v1/community/charts/:id/chart', (req, res) => {
  const id = req.params.id;
  const candidates = [
    path.join(COMMUNITY_DIR, id, 'chart.json'),
    path.join(COMMUNITY_DIR, `comm_${id}`, 'chart.json'),
    path.join(COMMUNITY_DIR, id.replace(/^comm_/, ''), 'chart.json'),
    path.join(STATIC_DIR, 'uploads', 'community', id, 'chart.json'),
    path.join(SONGS_DIR, id, 'chart.json'),
    path.join(SONGS_DIR, id.replace(/^comm_/, ''), 'chart.json'),
  ];
  if (id === 'comm_renacer' || id === 'renacer') {
    candidates.push(
      path.join(SONGS_DIR, 'renacer', 'chart.json'),
      path.join(COMMUNITY_DIR, 'comm_renacer', 'chart.json')
    );
  }

  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(p);
    }
  }

  // Fallback: If chart metadata is in communityCharts, generate valid chart JSON
  const chartMeta = communityCharts.get(id) || communityCharts.get(`comm_${id}`);
  if (chartMeta) {
    const fallbackChart = {
      version: '3.0.0',
      metadata: {
        title: chartMeta.title || 'Pista Comunitaria',
        artist: chartMeta.artist || 'Comunidad',
        creator: chartMeta.creator_name || 'Comunidad',
        bpm: chartMeta.bpm || 120,
        difficulty: chartMeta.difficulty_name || 'Normal',
        stars: chartMeta.stars || 3.5,
      },
      bpm: chartMeta.bpm || 120,
      offset: chartMeta.offset_ms || 0,
      scrollDurationMs: chartMeta.scroll_duration_ms || 1400,
      notes: []
    };
    res.setHeader('Content-Type', 'application/json');
    return res.json(fallbackChart);
  }

  res.status(404).json({ error: 'Archivo chart.json no encontrado' });
});

// Serve Audio with Range Support
app.get('/api/v1/community/charts/:id/audio', (req, res) => {
  const id = req.params.id;
  const candidates = [
    path.join(COMMUNITY_DIR, id, 'audio.mp3'),
    path.join(COMMUNITY_DIR, `comm_${id}`, 'audio.mp3'),
    path.join(COMMUNITY_DIR, id.replace(/^comm_/, ''), 'audio.mp3'),
    path.join(STATIC_DIR, 'uploads', 'community', id, 'audio.mp3'),
    path.join(SONGS_DIR, id, 'audio.mp3'),
    path.join(SONGS_DIR, id.replace(/^comm_/, ''), 'audio.mp3'),
  ];
  if (id === 'comm_renacer' || id === 'renacer') {
    candidates.push(
      path.join(SONGS_DIR, 'renacer', 'audio.mp3'),
      path.join(COMMUNITY_DIR, 'comm_renacer', 'audio.mp3')
    );
  }

  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(p);
    }
  }

  res.status(404).json({ error: 'Archivo audio.mp3 no encontrado' });
});

// ==========================================
// 4b. Proxies de Descarga Robusta Ultrarrápida (osu! y Clone Hero)
// ==========================================
const OSU_OSZ_LRU_CACHE = new Map();
const OSU_OSZ_LRU_MAX = 4;

app.get(['/api/v1/download/osu/:setId', '/api/v1/osu/download/:setId'], async (req, res) => {
  const rawId = (req.params.setId || '').toString().replace(/^osu_/, '').trim();
  if (!rawId || !/^\d+$/.test(rawId)) {
    return res.status(400).json({ error: 'ID de beatmap de osu! inválido' });
  }

  // 0. Servir al instante si está en la caché LRU en memoria del servidor
  if (OSU_OSZ_LRU_CACHE.has(rawId)) {
    const cachedBuf = OSU_OSZ_LRU_CACHE.get(rawId);
    res.setHeader('Content-Type', 'application/x-osu-beatmap-archive');
    res.setHeader('Content-Length', String(cachedBuf.byteLength));
    res.setHeader('Content-Disposition', `attachment; filename="${rawId}.osz"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(cachedBuf);
  }

  const fastMirrors = [
    `https://catboy.best/d/${rawId}n`,
    `https://api.nerinyan.moe/d/${rawId}?noVideo=true`,
    `https://osu.direct/api/d/${rawId}?noVideo=1`,
    `https://txy1.sayobot.cn/beatmaps/download/mini/${rawId}`
  ];

  const fallbackMirrors = [
    `https://dl.nerinyan.moe/v2/d/${rawId}?noVideo=true`,
    `https://catboy.best/d/${rawId}`,
    `https://dl.sayobot.cn/beatmaps/download/mini/${rawId}`
  ];

  const raceMirrorGroup = async (urls, timeoutMs = 10000) => {
    const controllers = urls.map(() => new AbortController());
    const timer = setTimeout(() => {
      controllers.forEach(c => { try { c.abort(); } catch (_) {} });
    }, timeoutMs);

    try {
      const winnerBuf = await Promise.any(urls.map(async (mirrorUrl, idx) => {
        const resp = await fetch(mirrorUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': '*/*'
          },
          redirect: 'follow',
          signal: controllers[idx].signal
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const ab = await resp.arrayBuffer();
        if (!ab || ab.byteLength < 15000) throw new Error('Archivo .osz incompleto');
        const u8 = new Uint8Array(ab, 0, 4);
        // Verificar firma ZIP ('PK\x03\x04') para descartar páginas HTML de error
        if (u8[0] !== 0x50 || u8[1] !== 0x4B) throw new Error('Respuesta no es un ZIP/OSZ válido');
        // Abortar inmediatamente el resto de mirrors en curso
        controllers.forEach((c, i) => { if (i !== idx) { try { c.abort(); } catch (_) {} } });
        return Buffer.from(ab);
      }));
      clearTimeout(timer);
      return winnerBuf;
    } catch (err) {
      clearTimeout(timer);
      return null;
    }
  };

  let oszBuffer = await raceMirrorGroup(fastMirrors, 9500);
  if (!oszBuffer) {
    oszBuffer = await raceMirrorGroup(fallbackMirrors, 12000);
  }

  if (oszBuffer) {
    if (OSU_OSZ_LRU_CACHE.size >= OSU_OSZ_LRU_MAX) {
      const oldestKey = OSU_OSZ_LRU_CACHE.keys().next().value;
      OSU_OSZ_LRU_CACHE.delete(oldestKey);
    }
    OSU_OSZ_LRU_CACHE.set(rawId, oszBuffer);

    res.setHeader('Content-Type', 'application/x-osu-beatmap-archive');
    res.setHeader('Content-Length', String(oszBuffer.byteLength));
    res.setHeader('Content-Disposition', `attachment; filename="${rawId}.osz"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(oszBuffer);
  }

  res.status(502).json({ error: 'No se pudo descargar el paquete desde ningún mirror de osu!' });
});

app.get(['/api/v1/download/clonehero/:md5', '/api/v1/clonehero/download/:md5'], async (req, res) => {
  const md5 = (req.params.md5 || '').toString().trim();
  if (!md5 || !/^[a-fA-F0-9]{32}$/.test(md5)) {
    return res.status(400).json({ error: 'MD5 de Clone Hero inválido' });
  }

  const enchorUrl = `https://files.enchor.us/${md5}.sng`;
  try {
    const resp = await fetch(enchorUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': '*/*'
      },
      signal: AbortSignal.timeout(25000)
    });

    if (resp.ok) {
      const ct = resp.headers.get('content-type') || 'application/octet-stream';
      const cl = resp.headers.get('content-length');
      res.setHeader('Content-Type', ct);
      if (cl) res.setHeader('Content-Length', cl);
      res.setHeader('Content-Disposition', `attachment; filename="${md5}.sng"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const { Readable } = await import('stream');
      Readable.fromWeb(resp.body).pipe(res);
      return;
    }
  } catch (err) {
    console.warn(`[Proxy Download] Enchor SNG ${md5} falló:`, err.message);
  }

  res.status(502).json({ error: 'No se pudo descargar la canción de Clone Hero' });
});

app.get(['/api/v1/download/beatsaver/:hash', '/api/v1/beatsaver/download/:hash'], async (req, res) => {
  const hash = (req.params.hash || '').toString().toLowerCase().trim();
  if (!hash || !/^[a-f0-9]{32,64}$/.test(hash)) {
    return res.status(400).json({ error: 'Hash de BeatSaver inválido' });
  }

  const bsUrl = `https://cdn.beatsaver.com/${hash}.zip`;
  try {
    const resp = await fetch(bsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': '*/*'
      },
      signal: AbortSignal.timeout(20000)
    });

    if (resp.ok) {
      const ct = resp.headers.get('content-type') || 'application/zip';
      const cl = resp.headers.get('content-length');
      res.setHeader('Content-Type', ct);
      if (cl) res.setHeader('Content-Length', cl);
      res.setHeader('Content-Disposition', `attachment; filename="${hash}.zip"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const { Readable } = await import('stream');
      Readable.fromWeb(resp.body).pipe(res);
      return;
    }
  } catch (err) {
    console.warn(`[Proxy Download] BeatSaver ZIP ${hash} falló:`, err.message);
  }

  res.status(502).json({ error: 'No se pudo descargar el mapa de BeatSaver' });
});

// Rate track
app.post('/api/v1/community/charts/:id/rate', (req, res) => {
  const id = req.params.id;
  const { rating, sync_pct, comment } = req.body;
  const numRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
  const numSync = Math.max(0, Math.min(100, parseFloat(sync_pct) || 100));

  const chart = communityCharts.get(id);
  if (chart) {
    const currentVotes = chart.votes_count || 0;
    const currentRatingTotal = (chart.rating_avg || 5.0) * currentVotes;
    const newVotes = currentVotes + 1;
    chart.rating_avg = Math.round(((currentRatingTotal + numRating) / newVotes) * 10) / 10;
    chart.votes_count = newVotes;

    const currentSyncVotes = chart.sync_votes_count || 0;
    const currentSyncTotal = (chart.sync_avg || 100.0) * currentSyncVotes;
    const newSyncVotes = currentSyncVotes + 1;
    chart.sync_avg = Math.round(((currentSyncTotal + numSync) / newSyncVotes) * 10) / 10;
    chart.sync_votes_count = newSyncVotes;

    communityCharts.set(id, chart);

    // Guardar en el histórico detallado con timestamp para la ventana de 48h
    const existingRatings = chartRatings.get(id) || [];
    existingRatings.push({
      rating: numRating,
      sync_pct: numSync,
      comment: comment || '',
      timestamp: Date.now(),
      created_at: new Date().toISOString()
    });
    chartRatings.set(id, existingRatings);
    saveRatingsToDisk();

    return res.json({
      success: true,
      new_rating_avg: chart.rating_avg,
      votes_count: chart.votes_count,
      sync_avg: chart.sync_avg,
    });
  }

  res.json({ success: true, message: 'Calificación registrada' });
});

// Submit score
app.post('/api/v1/community/charts/:id/score', (req, res) => {
  const id = req.params.id;
  const { score, max_combo, stars, accuracy_pct, medal_tier, player_name } = req.body;

  const currentScores = chartScores.get(id) || [];
  const now = Date.now();
  const newEntry = {
    rank: 1,
    chart_id: id,
    player_name: player_name || 'Jugador Anónimo',
    score: parseInt(score, 10) || 0,
    max_combo: parseInt(max_combo, 10) || 0,
    stars: parseFloat(stars) || 3.5,
    accuracy_pct: parseFloat(accuracy_pct) || 100.0,
    medal_tier: medal_tier || 'gold',
    timestamp: now,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  const cleanName = (player_name || 'Jugador Anónimo').trim();
  const parsedBestScore = parseInt(score, 10) || 0;
  const parsedSessionScore = (req.body.session_score !== undefined && req.body.session_score !== null)
    ? Math.max(0, parseInt(req.body.session_score, 10) || 0)
    : parsedBestScore;
  newEntry.player_name = cleanName;
  newEntry.score = parsedBestScore;

  const existingIdx = currentScores.findIndex(
    s => (s.player_name || '').trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (existingIdx >= 0) {
    if (parsedBestScore > (currentScores[existingIdx].score || 0)) {
      currentScores[existingIdx] = newEntry;
    }
  } else if (parsedBestScore > 0) {
    currentScores.push(newEntry);
  }

  currentScores.sort((a, b) => b.score - a.score);
  currentScores.forEach((s, idx) => (s.rank = idx + 1));

  const isRecord = newEntry.rank === 1;
  chartScores.set(id, currentScores.slice(0, 50));

  const pKey = cleanName.toLowerCase();
  if (parsedSessionScore > 0) {
    // 1. Sumar únicamente la puntuación real de esta partida al acumulador Global
    const globalData = playerGlobalAccumulator.get(pKey) || { name: cleanName, total_score: 0, clefs: 0 };
    globalData.total_score += parsedSessionScore;
    globalData.clefs += Math.floor(parsedSessionScore * 0.00001);
    playerGlobalAccumulator.set(pKey, globalData);

    // 2. Sumar únicamente la puntuación real de esta partida al torneo Semanal activo
    const curWeek = getIsoWeekId();
    if (!playerWeeklyAccumulator.has(curWeek)) {
      playerWeeklyAccumulator.set(curWeek, new Map());
    }
    const weekMap = playerWeeklyAccumulator.get(curWeek);
    const weeklyData = weekMap.get(pKey) || { name: cleanName, score: 0 };
    weeklyData.score += parsedSessionScore;
    weekMap.set(pKey, weeklyData);
  }

  // 3. Registrar referido únicamente si el jugador entró con el enlace de invitación (?ref=... o ?code=...)
  const referredBy = String(req.body.referred_by || '').trim().toLowerCase();
  const referredCode = String(req.body.referred_code || '').trim().toLowerCase();
  const clientIp = getClientIp(req);
  const ipPending = pendingReferralClicksByIp.get(clientIp);
  const ipPendingValid = ipPending && (Date.now() - ipPending.ts < 24 * 60 * 60 * 1000);

  const effectiveReferrer = referredBy || (ipPendingValid ? ipPending.referrer : '');
  const effectiveRefCode = referredCode || (ipPendingValid ? ipPending.refCode : '');

  if (effectiveReferrer && effectiveReferrer !== pKey) {
    registerReferralHelper(effectiveReferrer, cleanName);
  }
  if (effectiveRefCode && effectiveRefCode !== pKey) {
    registerReferralHelper(effectiveRefCode, cleanName);
  }

  // Actualizar también el perfil consolidado del usuario con el nuevo récord de canción y progreso
  if (pKey && pKey !== 'jugador' && pKey !== 'jugador anónimo' && pKey !== 'jugador anonimo') {
    const existingCode = playerProfileCodeByName.get(pKey);
    const existingProf = existingCode ? playerProfilesByCode.get(existingCode) : null;
    const incomingWallet = (req.body.wallet && typeof req.body.wallet === 'object') ? req.body.wallet : null;
    registerOrMergeCanonicalProfileServer(cleanName, {
      player_name: cleanName,
      recovery_code: existingProf?.recovery_code || req.body.recovery_code || '',
      wallet: incomingWallet || {
        clefs: Math.max(Number(existingProf?.wallet?.clefs) || 100, Number(playerGlobalAccumulator.get(pKey)?.clefs) || 100),
        silvers: Number(existingProf?.wallet?.silvers) || 0,
        golds: Number(existingProf?.wallet?.golds) || 0,
        platinums: Number(existingProf?.wallet?.platinums) || 0
      },
      unlocked_modes: (req.body.unlocked_modes && typeof req.body.unlocked_modes === 'object') ? req.body.unlocked_modes : undefined,
      unlocked_effects: Array.isArray(req.body.unlocked_effects) ? req.body.unlocked_effects : undefined,
      active_effect: typeof req.body.active_effect === 'string' ? req.body.active_effect : undefined,
      highscores: {
        [id]: {
          score: parsedBestScore,
          stars: Number(req.body.stars) || 0,
          maxCombo: Number(req.body.max_combo) || 0,
          medalTier: req.body.medal_tier || null,
          accuracyPct: Number(req.body.accuracy_pct) || 0
        }
      }
    });
    savePlayerProfilesToDisk();
  }

  saveScoresToDisk();
  syncLeaderboardToGithub().catch(() => {});

  res.json({
    success: true,
    rank: newEntry.rank,
    is_new_record: isRecord,
    total_players: currentScores.length,
    entry: newEntry
  });
});

// Sincronización en lote de puntuaciones de canciones del jugador
app.post('/api/v1/community/sync_scores', (req, res) => {
  try {
    const cleanName = String(req.body?.player_name || '').trim().slice(0, 24);
    const scores = Array.isArray(req.body?.scores) ? req.body.scores : [];
    const pKey = cleanName.toLowerCase();
    if (!cleanName || !pKey || pKey === 'jugador' || pKey === 'test' || pKey === 'tester') {
      return res.json({ success: true, synced: 0 });
    }
    const hsMap = {};
    let syncedCount = 0;
    for (const item of scores.slice(0, 400)) {
      const chartId = String(item?.chart_id || '').trim();
      const sc = Math.max(0, Math.round(Number(item?.score) || 0));
      if (!chartId || sc <= 0) continue;
      hsMap[chartId] = {
        score: sc,
        stars: Number(item?.stars) || 0,
        maxCombo: Number(item?.max_combo) || 0,
        medalTier: item?.medal_tier || null,
        accuracyPct: Number(item?.accuracy_pct) || 100
      };
      const list = chartScores.get(chartId) || [];
      const idx = list.findIndex(s => String(s.player_name || '').trim().toLowerCase() === pKey);
      if (idx === -1) {
        list.push({
          rank: list.length + 1,
          chart_id: chartId,
          player_name: cleanName,
          score: sc,
          max_combo: Number(item?.max_combo) || 0,
          stars: Number(item?.stars) || 0,
          accuracy_pct: Number(item?.accuracy_pct) || 100,
          created_at: new Date().toISOString()
        });
        syncedCount++;
      } else if (sc > (list[idx].score || 0)) {
        list[idx].score = sc;
        list[idx].max_combo = Math.max(list[idx].max_combo || 0, Number(item?.max_combo) || 0);
        list[idx].stars = Math.max(list[idx].stars || 0, Number(item?.stars) || 0);
        list[idx].accuracy_pct = Math.max(list[idx].accuracy_pct || 0, Number(item?.accuracy_pct) || 100);
        syncedCount++;
      }
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
      list.forEach((entry, rIdx) => { entry.rank = rIdx + 1; });
      chartScores.set(chartId, list.slice(0, 50));
    }
    registerOrMergeCanonicalProfileServer(cleanName, {
      player_name: cleanName,
      highscores: hsMap
    });
    savePlayerProfilesToDisk();
    if (syncedCount > 0) {
      saveScoresToDisk();
      syncLeaderboardToGithub(false).catch(() => {});
    }
    return res.json({ success: true, synced: syncedCount });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Registrar visita al abrir el enlace de invitación (?ref=...&code=...) para vincular también si descarga el APK desde ese móvil
app.post('/api/v1/community/referral-click', (req, res) => {
  const referrer = String(req.body?.referrer || '').trim().toLowerCase();
  const refCode = String(req.body?.ref_code || '').trim().toLowerCase();
  if (referrer || refCode) {
    const clientIp = getClientIp(req);
    pendingReferralClicksByIp.set(clientIp, {
      referrer,
      refCode,
      ts: Date.now()
    });
  }
  res.json({ success: true });
});

// Verificar ESTRICTAMENTE si el amigo invitado entró por el enlace del jugador y jugó al menos 1 partida
app.get('/api/v1/community/verify-friend', (req, res) => {
  const friendRaw = String(req.query.friend || '').trim();
  const referrerRaw = String(req.query.referrer || '').trim().toLowerCase();
  const refCodeRaw = String(req.query.ref_code || '').trim().toLowerCase();
  const friendKey = friendRaw.toLowerCase();

  if (!friendKey) {
    return res.json({ verified: false, message: 'Escribe el nickname con el que tu amigo jugó su partida.' });
  }
  if ((referrerRaw && friendKey === referrerRaw) || (refCodeRaw && friendKey === refCodeRaw)) {
    return res.json({ verified: false, message: 'No puedes validar tu propio nickname. Debe ser el de tu amigo invitado.' });
  }

  // Buscar el conjunto de amigos que realmente abrieron el enlace de este jugador (por nickname o por código único)
  const allowedSets = [];
  if (referrerRaw && completedReferralsMap.has(referrerRaw)) {
    allowedSets.push(completedReferralsMap.get(referrerRaw));
  }
  if (refCodeRaw && completedReferralsMap.has(refCodeRaw)) {
    allowedSets.push(completedReferralsMap.get(refCodeRaw));
  }

  for (const fSet of allowedSets) {
    if (!fSet) continue;
    for (const recordedName of fSet) {
      if (String(recordedName).trim().toLowerCase() === friendKey) {
        return res.json({
          verified: true,
          friend_name: recordedName,
          method: 'referral_link'
        });
      }
    }
  }

  // Si el nombre existe en la clasificación pero NO entró con el enlace de este jugador, rechazarlo explícitamente
  const existsInLeaderboard = playerGlobalAccumulator.has(friendKey);
  if (existsInLeaderboard) {
    return res.json({
      verified: false,
      message: 'Ese jugador no entró con tu enlace personal. Solo se valida al amigo al que le envíes tu enlace y juegue 1 partida.'
    });
  }

  return res.json({
    verified: false,
    message: 'Tu amigo aún no ha abierto tu enlace de invitación ni jugado su primera partida.'
  });
});

// Chart Leaderboard (Compatible tanto con .leaderboard como array directo)
app.get([
  '/api/v1/community/charts/:id/leaderboard',
  '/api/v1/community/charts/:id/leaderboards',
  '/api/v1/charts/:id/leaderboard'
], (req, res) => {
  const id = req.params.id;
  const scores = chartScores.get(id) || [];
  res.json({
    success: true,
    leaderboard: scores,
    scores: scores,
    total: scores.length
  });
});

// Global Leaderboard (Suma acumulada de todos los tiempos)
app.get([
  '/api/v1/leaderboard/global',
  '/api/v1/leaderboards/global',
  '/api/v1/community/leaderboard/global',
  '/api/v1/community/leaderboards/global'
], (req, res) => {
  const globalScores = Array.from(playerGlobalAccumulator.values())
    .sort((a, b) => (b.total_score || b.score || 0) - (a.total_score || a.score || 0))
    .slice(0, 50)
    .map((s, idx) => ({
      rank: idx + 1,
      player_name: s.player_name || s.name || 'Jugador',
      name: s.player_name || s.name || 'Jugador',
      score: s.total_score || s.score || 0,
      total_score: s.total_score || s.score || 0,
      clefs: s.clefs || Math.floor((s.total_score || s.score || 0) * 0.00001)
    }));

  res.json({
    success: true,
    global_leaderboard: globalScores,
    leaderboard: globalScores,
    total: globalScores.length
  });
});

// Weekly Leaderboard (Suma acumulada del torneo semanal)
app.get([
  '/api/v1/leaderboard/weekly',
  '/api/v1/leaderboards/weekly',
  '/api/v1/community/leaderboard/weekly',
  '/api/v1/community/leaderboards/weekly'
], (req, res) => {
  const currentWeek = getIsoWeekId();
  const requestedWeek = (req.query && req.query.week_id)
    ? String(req.query.week_id).replace('_', '-')
    : currentWeek;
  let weekMap = playerWeeklyAccumulator.get(requestedWeek);
  // Cuando se consulta la semana en curso (requestedWeek === currentWeek), jamás arrastrar puntos de semanas anteriores.
  if (requestedWeek !== currentWeek && (!weekMap || weekMap.size === 0) && playerWeeklyAccumulator.size > 0) {
    const pastWeeks = Array.from(playerWeeklyAccumulator.keys()).filter(w => w !== currentWeek).sort();
    if (pastWeeks.length > 0) {
      weekMap = playerWeeklyAccumulator.get(pastWeeks[pastWeeks.length - 1]);
    }
  }
  weekMap = weekMap || new Map();
  const weeklyScores = Array.from(weekMap.values())
    .sort((a, b) => (b.score || b.total_score || 0) - (a.score || a.total_score || 0))
    .slice(0, 50)
    .map((s, idx) => ({
      rank: idx + 1,
      player_name: s.player_name || s.name || 'Jugador',
      name: s.player_name || s.name || 'Jugador',
      score: s.score || s.total_score || 0,
      total_score: s.score || s.total_score || 0,
      clefs: s.clefs || Math.floor((s.score || s.total_score || 0) * 0.00001)
    }));

  // Calcular tiempo restante hasta el Domingo 23:59:59 UTC
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Domingo, 1 = Lunes, ...
  const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);
  const endOfWeekUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilSunday,
    23, 59, 59, 999
  );
  const timeRemainingMs = Math.max(0, endOfWeekUtc - now.getTime());

  res.json({
    success: true,
    weekly_leaderboard: weeklyScores,
    leaderboard: weeklyScores,
    week_id: requestedWeek,
    current_week_id: currentWeek,
    time_remaining_ms: timeRemainingMs,
    total_participants: weeklyScores.length
  });
});
// Creator profile & follow
app.get('/api/v1/community/creators/:id', (req, res) => {
  const creator_id = req.params.id;
  const charts = Array.from(communityCharts.values()).filter((c) => c.creator_id === creator_id);
  const name = charts[0]?.creator_name || 'Creador de la Comunidad';
  const is_following = followedCreators.has(creator_id);

  res.json({
    id: creator_id,
    name,
    followers_count: is_following ? 12 : 11,
    is_following,
    charts,
  });
});

app.post('/api/v1/community/creators/:id/follow', (req, res) => {
  const creator_id = req.params.id;
  let is_following = false;
  if (followedCreators.has(creator_id)) {
    followedCreators.delete(creator_id);
    is_following = false;
  } else {
    followedCreators.add(creator_id);
    is_following = true;
  }
  res.json({
    success: true,
    is_following,
    followers_count: is_following ? 12 : 11,
  });
});

// Player profile
app.post('/api/v1/community/players/register', (req, res) => {
  const { player_name } = req.body;
  const id = `pl_${Date.now()}`;
  players.set(id, { id, player_name, total_score: 0, songs_played: 0 });
  res.json({ success: true, id, player_name });
});

app.post('/api/v1/community/players/sync', (req, res) => {
  try {
    const body = req.body || {};
    const playerName = String(body.player_name || body.profile?.player_name || '').trim().slice(0, 24);
    const nameKey = playerName.toLowerCase();
    if (!nameKey || nameKey === 'jugador' || nameKey === 'jugador anónimo' || nameKey === 'jugador anonimo') {
      return res.json({ success: false, synced: false, error: 'Elige un Nombre de Usuario válido.' });
    }

    const digest = crypto.createHash('md5').update(`rnc_user:${nameKey}`).digest('hex').toUpperCase().slice(0, 6);
    const canonicalCode = `RNC-${digest}`;

    const existingCodeForName = playerProfileCodeByName.get(nameKey) || null;
    let existingAccount = existingCodeForName ? (playerProfilesByCode.get(existingCodeForName) || null) : null;

    const rawPassword = String(body.password ?? body.pin ?? '').trim();
    const rawNewPassword = (typeof body.new_password === 'string')
      ? body.new_password.trim()
      : ((typeof body.new_pin === 'string') ? body.new_pin.trim() : null);
    const providedPassHash = rawPassword ? hashProfilePinServer(rawPassword) : '';
    const clientToken = String(body.account_token || body.profile?.account_token || '').trim().slice(0, 80);

    // Soporte para cambio de Nickname verificando que el nuevo nombre NO esté ocupado por otro jugador
    const prevPlayerName = String(body.previous_player_name || '').trim().slice(0, 24);
    const prevNameKey = prevPlayerName.toLowerCase();
    if (prevNameKey && prevNameKey !== nameKey) {
      if (existingAccount) {
        const storedPassOnTarget = existingAccount.pin_hash || existingAccount.password_hash || '';
        const storedTokenOnTarget = String(existingAccount.account_token || '').trim();
        const ownsTarget = (storedPassOnTarget && providedPassHash && providedPassHash === storedPassOnTarget) ||
          (!storedPassOnTarget && storedTokenOnTarget && clientToken && clientToken === storedTokenOnTarget);
        if (!ownsTarget) {
          return res.status(409).json({
            success: false,
            synced: false,
            nickname_taken: true,
            found_existing_account: true,
            requires_password: Boolean(storedPassOnTarget),
            error: `El nombre "${existingAccount.player_name || playerName}" ya está en uso por otro jugador. Elige un nombre único.`
          });
        }
      }
      // Migrar la cuenta propia desde prevNameKey al nuevo nameKey si el cliente es dueño de prevNameKey
      const prevCode = playerProfileCodeByName.get(prevNameKey);
      const prevProf = prevCode ? playerProfilesByCode.get(prevCode) : null;
      if (prevProf && !existingAccount) {
        const prevPass = prevProf.pin_hash || prevProf.password_hash || '';
        const prevTok = String(prevProf.account_token || '').trim();
        const ownsPrev = (!prevPass && (!prevTok || prevTok === clientToken)) ||
          (prevPass && providedPassHash === prevPass) ||
          (prevTok && clientToken && prevTok === clientToken);
        if (ownsPrev) {
          existingAccount = prevProf;
          playerProfilesByCode.delete(prevCode);
          playerProfileCodeByName.delete(prevNameKey);
          const prevGlobal = playerGlobalAccumulator.get(prevNameKey);
          if (prevGlobal) {
            playerGlobalAccumulator.delete(prevNameKey);
            prevGlobal.name = playerName;
            playerGlobalAccumulator.set(nameKey, prevGlobal);
          }
        }
      }
    }

    const storedPassHash = existingAccount ? (existingAccount.pin_hash || existingAccount.password_hash || '') : '';
    const storedToken = existingAccount ? String(existingAccount.account_token || '').trim() : '';

    // Verificación estricta de propiedad de la cuenta y prohibición de Nicknames duplicados
    if (existingAccount) {
      const passwordMatches = Boolean(storedPassHash && providedPassHash && providedPassHash === storedPassHash);
      const tokenMatches = Boolean(storedToken && clientToken && storedToken === clientToken);

      if (body.is_new_registration || body.is_nickname_change) {
        if (!passwordMatches && !tokenMatches) {
          return res.status(409).json({
            success: false,
            synced: false,
            nickname_taken: true,
            found_existing_account: true,
            requires_pin: Boolean(storedPassHash),
            requires_password: Boolean(storedPassHash),
            error: storedPassHash
              ? `El Nombre de Usuario "${existingAccount.player_name || playerName}" ya está registrado. Si es tu cuenta, recupérala con su contraseña; si eres nuevo, elige otro Nickname.`
              : `El Nombre de Usuario "${existingAccount.player_name || playerName}" ya está en uso. No se permiten nicknames duplicados.`
          });
        }
      }

      // Si la cuenta tiene contraseña configurada, JAMÁS permitir sincronizar ni cambiar su contraseña si la contraseña enviada no coincide
      if (storedPassHash && !passwordMatches && !tokenMatches) {
        return res.status(403).json({
          success: false,
          synced: false,
          nickname_taken: true,
          found_existing_account: true,
          requires_pin: true,
          requires_password: true,
          error: `El Nombre de Usuario "${existingAccount.player_name || playerName}" pertenece a una cuenta protegida con contraseña.`,
          summary: buildProfileSummaryServer(existingAccount)
        });
      }

      // Si no tenía contraseña pero ya tenía un token de dispositivo distinto, impedir que otro dispositivo duplique el nickname
      if (!storedPassHash && storedToken && clientToken && storedToken !== clientToken) {
        return res.status(409).json({
          success: false,
          synced: false,
          nickname_taken: true,
          found_existing_account: true,
          error: `El Nombre de Usuario "${existingAccount.player_name || playerName}" ya está en uso por otro jugador.`
        });
      }
    }

    const incomingProfile = (body.profile && typeof body.profile === 'object') ? body.profile : {};
    incomingProfile.player_name = playerName;
    incomingProfile.recovery_code = canonicalCode;
    if (clientToken) incomingProfile.account_token = clientToken;

    const incomingRichness = computeProfileRichnessServer(incomingProfile);
    const existingRichness = existingAccount ? computeProfileRichnessServer(existingAccount) : 0;

    // Si el propietario entra desde una instalación limpia con la contraseña correcta de su cuenta existente, devolver su perfil íntegro
    if (existingAccount && existingRichness > 0 && incomingRichness === 0 && !body.force_new_account) {
      const passwordMatches = Boolean(storedPassHash && providedPassHash && providedPassHash === storedPassHash);
      const tokenMatches = Boolean(storedToken && clientToken && storedToken === clientToken);
      if (passwordMatches || tokenMatches) {
        return res.json({
          success: true,
          synced: false,
          found_existing_account: true,
          requires_pin: false,
          requires_password: false,
          recovery_code: canonicalCode,
          profile: existingAccount,
          summary: buildProfileSummaryServer(existingAccount)
        });
      }
      return res.status(403).json({
        success: false,
        synced: false,
        nickname_taken: true,
        found_existing_account: true,
        requires_pin: true,
        requires_password: true,
        error: `El usuario "${existingAccount.player_name || playerName}" ya existe. Introduce su contraseña para recuperar la cuenta o elige otro Nickname.`,
        summary: buildProfileSummaryServer(existingAccount)
      });
    }

    const isOwnerVerified = !existingAccount ||
      (storedPassHash && providedPassHash === storedPassHash) ||
      (storedToken && clientToken && storedToken === clientToken) ||
      (!storedPassHash && !storedToken);

    const merged = sanitizeAndMergeProfileServer(existingAccount, incomingProfile, isOwnerVerified);
    merged.recovery_code = canonicalCode;
    merged.player_name = playerName;
    if (clientToken && (!merged.account_token || isOwnerVerified)) {
      merged.account_token = clientToken;
    }

    if (rawNewPassword !== null && isOwnerVerified) {
      const nextHash = rawNewPassword ? hashProfilePinServer(rawNewPassword) : '';
      if (nextHash) {
        merged.pin_hash = nextHash;
        merged.password_hash = nextHash;
        merged.has_password = true;
      }
    } else if (!merged.pin_hash && providedPassHash && isOwnerVerified) {
      merged.pin_hash = providedPassHash;
      merged.password_hash = providedPassHash;
      merged.has_password = true;
    }

    playerProfilesByCode.set(canonicalCode, merged);
    playerProfileCodeByName.set(nameKey, canonicalCode);

    // Sincronizar también en playerGlobalAccumulator para que leaderboard.json -> global refleje siempre sus claves y puntos
    let totalFromHs = 0;
    if (merged.highscores && typeof merged.highscores === 'object' && playerName) {
      for (const [chartId, rec] of Object.entries(merged.highscores)) {
        if (!rec || !(rec.score > 0)) continue;
        totalFromHs += Number(rec.score) || 0;
        const list = chartScores.get(chartId) || [];
        const idx = list.findIndex(item => String(item.player_name || '').trim().toLowerCase() === nameKey);
        if (idx === -1) {
          list.push({
            rank: list.length + 1,
            chart_id: chartId,
            player_name: playerName,
            score: rec.score,
            max_combo: rec.maxCombo || 0,
            stars: rec.stars || 0,
            accuracy_pct: rec.accuracyPct || 100,
            created_at: new Date().toISOString()
          });
        } else if (rec.score > (list[idx].score || 0)) {
          list[idx].score = rec.score;
          list[idx].max_combo = Math.max(list[idx].max_combo || 0, rec.maxCombo || 0);
          list[idx].stars = Math.max(list[idx].stars || 0, rec.stars || 0);
          list[idx].accuracy_pct = Math.max(list[idx].accuracy_pct || 0, rec.accuracyPct || 100);
        }
        list.sort((a, b) => (b.score || 0) - (a.score || 0));
        list.forEach((entry, rIdx) => { entry.rank = rIdx + 1; });
        chartScores.set(chartId, list.slice(0, 50));
      }
    }
    const prevGlobal = playerGlobalAccumulator.get(nameKey) || { name: playerName, total_score: 0, clefs: 0 };
    prevGlobal.name = playerName;
    prevGlobal.total_score = Math.max(Number(prevGlobal.total_score) || 0, totalFromHs);
    prevGlobal.clefs = Math.max(0, Number(merged.wallet?.clefs) || Number(prevGlobal.clefs) || 100);
    playerGlobalAccumulator.set(nameKey, prevGlobal);

    savePlayerProfilesToDisk();
    syncLeaderboardToGithub(false).catch(() => {});

    return res.json({
      success: true,
      synced: true,
      recovery_code: canonicalCode,
      has_pin: Boolean(merged.pin_hash),
      has_password: Boolean(merged.pin_hash),
      summary: buildProfileSummaryServer(merged)
    });
  } catch (err) {
    console.warn('[Server] Error in /api/v1/community/players/sync:', err.message);
    return res.status(500).json({ success: false, error: 'Error al sincronizar el perfil.' });
  }
});

app.post('/api/v1/community/players/restore', (req, res) => {
  try {
    const body = req.body || {};
    const rawQuery = String(body.query || body.player_name || '').trim();
    const rawPassword = String(body.password ?? body.pin ?? '').trim();
    if (!rawQuery) {
      return res.status(400).json({ success: false, error: 'Escribe el Nombre de Usuario de la cuenta que deseas recuperar.' });
    }
    if (!rawPassword) {
      return res.status(403).json({
        success: false,
        requires_pin: true,
        requires_password: true,
        error: 'Escribe la contraseña de esa cuenta para poder recuperarla.'
      });
    }

    const nameKey = rawQuery.toLowerCase();
    const mappedCode = playerProfileCodeByName.get(nameKey);
    const prof = (mappedCode && playerProfilesByCode.has(mappedCode)) ? playerProfilesByCode.get(mappedCode) : null;

    if (!prof) {
      return res.status(404).json({
        success: false,
        error: `No existe ninguna cuenta registrada con el Nombre de Usuario "${rawQuery}".`
      });
    }

    const storedHash = prof.pin_hash || prof.password_hash || '';
    if (!storedHash) {
      return res.status(403).json({
        success: false,
        requires_pin: true,
        requires_password: true,
        error: `La cuenta "${prof.player_name}" no tiene contraseña de recuperación configurada. Solo se puede acceder a cuentas con su contraseña.`
      });
    }

    const incomingHash = hashProfilePinServer(rawPassword);
    if (incomingHash !== storedHash) {
      return res.status(403).json({
        success: false,
        requires_pin: true,
        requires_password: true,
        error: `Contraseña incorrecta para la cuenta "${prof.player_name}". Cada cuenta solo se desbloquea con su propia contraseña.`
      });
    }

    return res.json({
      success: true,
      restored_by: 'nickname_password',
      recovery_code: prof.recovery_code,
      profile: prof,
      summary: buildProfileSummaryServer(prof)
    });
  } catch (err) {
    console.warn('[Server] Error in /api/v1/community/players/restore:', err.message);
    return res.status(500).json({ success: false, error: 'Error al restaurar el progreso.' });
  }
});

// ==========================================
// 4. Unified Community Search (osu! & Clone Hero)
// ==========================================
const unifiedSearchMemoryCache = new Map();
app.get(['/api/search', '/api/v1/search', '/api/v1/search/community'], async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.json([]);

  const cacheKey = q.toLowerCase();
  const cachedEntry = unifiedSearchMemoryCache.get(cacheKey);
  if (cachedEntry && (Date.now() - cachedEntry.ts) < 10 * 60 * 1000) {
    return res.json(cachedEntry.data);
  }

  const results = [];
  const qLower = q.toLowerCase();

  // 1. Search local community charts
  for (const c of communityCharts.values()) {
    const score = computeSongRelevanceScore(q, c.title, c.artist, c.creator_name || '');
    if (score >= 35) {
      results.push({ ...c, relevanceScore: score });
    }
  }

  // 2. Consultar Catboy, osu.direct, Sayobot, Nerinyan, BeatSaver y Clone Hero en paralelo con timeout ágil (1850ms)
  const encoded = encodeURIComponent(q);
  const [catboyRes, osuDirectRes, sayoRes, nerinyanRes, bsRes, enchorRes, itunesHintRes] = await Promise.allSettled([
    fetch(`https://catboy.best/api/v2/search?q=${encoded}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(1850),
    }).then(r => r.ok ? r.json() : null),
    fetch(`https://osu.direct/api/v2/search?q=${encoded}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(1850),
    }).then(r => r.ok ? r.json() : null),
    fetch(`https://api.sayobot.cn/beatmaplist?0=25&1=0&2=4&cmd=search&keyword=${encoded}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(1850),
    }).then(r => r.ok ? r.json() : null),
    fetch(`https://api.nerinyan.moe/search?q=${encoded}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(1850),
    }).then(r => r.ok ? r.json() : null),
    fetch(`https://api.beatsaver.com/search/text/0?q=${encoded}&sortOrder=Relevance`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(1850),
    }).then(r => r.ok ? r.json() : null),
    fetch('https://api.enchor.us/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ search: q, page: 1 }),
      signal: AbortSignal.timeout(1850),
    }).then(r => r.ok ? r.json() : null),
    fetch(`https://itunes.apple.com/search?term=${encoded}&media=music&entity=song&limit=3`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(1400),
    }).then(r => r.ok ? r.json() : null)
  ]);

  const seenOsuSetIds = new Set();
  const processOsuItems = (items) => {
    if (!Array.isArray(items)) return;
    for (const item of items.slice(0, 30)) {
      const setId = item.id || item.beatmapset_id || item.sid;
      if (!setId || seenOsuSetIds.has(setId)) continue;
      seenOsuSetIds.add(setId);

      const title = item.title || item.titleU || 'Sin título';
      const artist = item.artist || item.artistU || 'Desconocido';
      const creator = item.creator || item.user?.username || 'osu! Mapper';
      const covers = item.covers || {};
      const thumbnail = covers.card || covers.cover || `https://assets.ppy.sh/beatmaps/${setId}/covers/card.jpg`;

      const rawBeatmaps = item.beatmaps || item.bid_data || [];
      const diffs = rawBeatmaps.map((b) => {
        const modeNum = b.mode_int ?? b.mode ?? 0;
        const modeTag = (modeNum === 3 || modeNum === 'mania') ? 'Mania' : ((modeNum === 1 || modeNum === 'taiko') ? 'Taiko' : 'Std');
        const baseName = b.version || 'Normal';
        return {
          id: String(b.id || b.bid || '0'),
          name: `${baseName} [${modeTag}]`,
          stars: Math.round((parseFloat(b.difficulty_rating ?? b.star ?? 3.5) || 3.5) * 10) / 10,
          notes_count: (b.count_circles || 0) + (b.count_sliders || 0) || 120,
          bpm: b.bpm || item.bpm || 120,
        };
      });

      if (diffs.length === 0) continue;
      diffs.sort((a, b) => a.stars - b.stars);

      results.push({
        id: `osu_${setId}`,
        title,
        artist,
        creator_name: creator,
        bpm: item.bpm || 120,
        difficulty_name: diffs[Math.floor(diffs.length / 2)]?.name || 'Normal',
        stars: diffs[Math.floor(diffs.length / 2)]?.stars || 3.5,
        notes_count: diffs[Math.floor(diffs.length / 2)]?.notes_count || 120,
        thumbnail,
        source: 'osu',
        source_name: 'osu!',
        source_badge: '[osu!]',
        source_color: '#ff007f',
        download_url: `/api/v1/download/osu/${setId}`,
        direct_download_url: `https://api.nerinyan.moe/d/${setId}?noVideo=true`,
        fallback_download_url: `https://dl.nerinyan.moe/v2/d/${setId}?noVideo=true`,
        preview_url: `https://b.ppy.sh/preview/${setId}.mp3`,
        difficulties: diffs,
      });
    }
  };

  if (catboyRes.status === 'fulfilled' && catboyRes.value) {
    try {
      const data = catboyRes.value;
      processOsuItems(Array.isArray(data) ? data : data?.data || []);
    } catch (_) {}
  }

  if (osuDirectRes.status === 'fulfilled' && osuDirectRes.value) {
    try {
      const data = osuDirectRes.value;
      processOsuItems(Array.isArray(data) ? data : data?.data || []);
    } catch (_) {}
  }

  if (sayoRes.status === 'fulfilled' && sayoRes.value) {
    try {
      const data = sayoRes.value;
      processOsuItems(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (_) {}
  }

  if (nerinyanRes.status === 'fulfilled' && nerinyanRes.value) {
    try {
      const data = nerinyanRes.value;
      processOsuItems(Array.isArray(data) ? data : data?.data || []);
    } catch (_) {}
  }

  const seenBsIds = new Set();
  const processBeatSaverDocs = (docs) => {
    if (!Array.isArray(docs)) return;
    for (const doc of docs.slice(0, 22)) {
      const bsId = doc.id;
      const latestVer = Array.isArray(doc.versions) && doc.versions.length > 0 ? doc.versions[0] : null;
      if (!bsId || !latestVer || seenBsIds.has(bsId)) continue;
      const hash = String(latestVer.hash || '').toLowerCase();
      const directZipUrl = latestVer.downloadURL || (hash ? `https://cdn.beatsaver.com/${hash}.zip` : '');
      if (!directZipUrl) continue;
      seenBsIds.add(bsId);

      const meta = doc.metadata || {};
      const title = meta.songName || doc.name || 'Sin título';
      const artist = meta.songAuthorName || 'Artista BeatSaver';
      const creator = meta.levelAuthorName || doc.uploader?.name || 'BeatSaver Mapper';
      const bpm = Math.round(parseFloat(meta.bpm || 120) || 120);
      const thumbnail = latestVer.coverURL || (hash ? `https://cdn.beatsaver.com/${hash}.jpg` : '');

      const rawDiffs = Array.isArray(latestVer.diffs) ? latestVer.diffs : [];
      const diffs = rawDiffs
        .filter(d => !d.characteristic || d.characteristic === 'Standard' || rawDiffs.length <= 2)
        .map(d => {
          const nps = parseFloat(d.nps || 2.5) || 2.5;
          const stars = d.stars
            ? Math.round(parseFloat(d.stars) * 10) / 10
            : Math.max(1.2, Math.min(9.5, Math.round((1.2 + nps * 0.85) * 10) / 10));
          const dName = d.difficulty || 'Normal';
          return {
            id: dName,
            name: dName,
            stars: stars,
            notes_count: d.notes || 150,
            bpm: bpm,
            label: `${dName} (${stars.toFixed(1)}★)`
          };
        });

      if (diffs.length > 0) {
        diffs.sort((a, b) => a.stars - b.stars);
        results.push({
          id: `bs_${bsId}`,
          bs_hash: hash,
          title,
          artist,
          creator_name: creator,
          bpm,
          difficulty_name: diffs[Math.floor(diffs.length / 2)]?.name || 'Normal',
          stars: diffs[Math.floor(diffs.length / 2)]?.stars || 3.5,
          notes_count: diffs[Math.floor(diffs.length / 2)]?.notes_count || 150,
          thumbnail,
          source: 'beatsaver',
          source_name: 'BeatSaver',
          source_badge: '[BeatSaver]',
          source_color: '#00d2ff',
          download_url: hash ? `/api/v1/download/beatsaver/${hash}` : directZipUrl,
          direct_download_url: directZipUrl,
          difficulties: diffs,
        });
      }
    }
  };

  if (bsRes.status === 'fulfilled' && bsRes.value) {
    try {
      processBeatSaverDocs(bsRes.value?.docs || []);
    } catch (_) {}
  }

  const seenMd5 = new Set();
  const processEnchorTracks = (chTracks) => {
    if (!Array.isArray(chTracks)) return;
    for (const item of chTracks.slice(0, 18)) {
      const md5 = item.md5 || item.chartHash;
      if (!md5 || seenMd5.has(md5)) continue;
      seenMd5.add(md5);
      const rawIntensity = typeof item.diff_guitar === 'number' && item.diff_guitar >= 0 ? item.diff_guitar : 3;
      const stars = Math.max(1.5, Math.min(9.0, Math.round((1.5 + rawIntensity * 0.9) * 10) / 10));
      const albumArt = item.albumArtMd5 ? `https://files.enchor.us/${item.albumArtMd5}.jpg` : '';
      results.push({
        id: `ch_${md5}`,
        md5,
        title: item.name || 'Clone Hero Track',
        artist: item.artist || 'Artista',
        creator_name: item.charter || 'Clone Hero Charter',
        bpm: 120,
        difficulty_name: 'ExpertSingle',
        stars,
        notes_count: 250,
        thumbnail: albumArt,
        source: 'clonehero',
        source_name: 'Clone Hero',
        source_badge: '[CH]',
        source_color: '#10b981',
        download_url: `/api/v1/download/clonehero/${md5}`,
        sng_url: `https://files.enchor.us/${md5}.sng`,
        direct_download_url: `https://files.enchor.us/${md5}.sng`,
        difficulties: [
          { id: 'EasySingle', name: 'Fácil', stars: Math.max(1.2, +(stars * 0.45).toFixed(1)) },
          { id: 'MediumSingle', name: 'Media', stars: Math.max(2.0, +(stars * 0.68).toFixed(1)) },
          { id: 'HardSingle', name: 'Difícil', stars: Math.max(3.0, +(stars * 0.85).toFixed(1)) },
          { id: 'ExpertSingle', name: 'Extrema', stars }
        ]
      });
    }
  };

  if (enchorRes.status === 'fulfilled' && enchorRes.value) {
    try {
      processEnchorTracks(enchorRes.value?.data || []);
    } catch (_) {}
  }

  // Si la búsqueda tenía solo el título (ej. "vivir así es morir de amor") y hay pocos mapas reales, expandir buscando también por el artista original de Apple Music
  let hintArtist = '';
  if (itunesHintRes.status === 'fulfilled' && Array.isArray(itunesHintRes.value?.results) && itunesHintRes.value.results[0]?.artistName) {
    hintArtist = String(itunesHintRes.value.results[0].artistName).trim();
  }
  if (results.length < 6 && hintArtist && !normalizeSearchText(q).includes(normalizeSearchText(hintArtist))) {
    try {
      const encArtist = encodeURIComponent(hintArtist);
      const [extraCb, extraBs, extraCh] = await Promise.allSettled([
        fetch(`https://catboy.best/api/v2/search?q=${encArtist}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(950) }).then(r => r.ok ? r.json() : null),
        fetch(`https://api.beatsaver.com/search/text/0?q=${encArtist}&sortOrder=Relevance`, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(950) }).then(r => r.ok ? r.json() : null),
        fetch('https://api.enchor.us/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          body: JSON.stringify({ search: hintArtist, page: 1 }),
          signal: AbortSignal.timeout(950),
        }).then(r => r.ok ? r.json() : null)
      ]);
      if (extraCb.status === 'fulfilled' && extraCb.value) processOsuItems(Array.isArray(extraCb.value) ? extraCb.value : extraCb.value?.data || []);
      if (extraBs.status === 'fulfilled' && extraBs.value) processBeatSaverDocs(extraBs.value?.docs || []);
      if (extraCh.status === 'fulfilled' && extraCh.value) processEnchorTracks(extraCh.value?.data || []);
    } catch (_) {}
  }

  for (const item of results) {
    if (typeof item.relevanceScore !== 'number') {
      const baseRel = computeSongRelevanceScore(q, item.title, item.artist, item.creator_name || '');
      const artistRel = hintArtist ? computeSongRelevanceScore(hintArtist, item.title, item.artist, '') : 0;
      item.relevanceScore = Math.max(baseRel, Math.min(82, Math.round(artistRel * 0.85)));
    }
    if (/\b(cut\s*ver|short\s*ver|tv\s*size)\b/i.test(String(item.title || ''))) {
      item.relevanceScore -= 45;
    }
  }
  results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  if (results.length > 0) {
    if (unifiedSearchMemoryCache.size > 200) {
      const oldest = unifiedSearchMemoryCache.keys().next().value;
      if (oldest) unifiedSearchMemoryCache.delete(oldest);
    }
    unifiedSearchMemoryCache.set(cacheKey, { ts: Date.now(), data: results });
  }

  res.json(results);
});

// Proxy con caché en memoria para letras sincronizadas LRC (LRCLIB + NetEase + Kugou + YouTube Captions + Catálogo Sincronizado)
const lyricsMemoryCache = new Map();

function lyricsAsciiKey(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}
function lyricsAsciiDropKey(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
function lyricsTitleMatches(a, b) {
  const x = lyricsAsciiKey(a), y = lyricsAsciiKey(b);
  if (x && x === y) return true;
  if (x && y && (x.length >= 6 && y.length >= 6) && (x.includes(y) || y.includes(x))) return true;
  const dx = lyricsAsciiDropKey(a), dy = lyricsAsciiDropKey(b);
  return Boolean(dx && dx === dy) || Boolean(x && y && (x === lyricsAsciiDropKey(b) || y === lyricsAsciiDropKey(a)));
}

const CUSTOM_SYNCED_LYRICS_DB = [
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

function findCustomSyncedLyrics(rawTitle, rawArtist, rawQ, videoId = '') {
  const cleanVid = String(videoId || '').replace(/^magic_yt_|^yt_/, '').trim();
  if (cleanVid) {
    const byVid = CUSTOM_SYNCED_LYRICS_DB.find(item => item.videoId === cleanVid);
    if (byVid) return [byVid];
  }
  const kTitle = lyricsAsciiKey(String(rawTitle || '').replace(/\[[^\]]*\]|\([^)]*\)/g, ''));
  const kFull = lyricsAsciiKey(`${rawTitle} ${rawArtist} ${rawQ}`);
  if (!kTitle && !kFull) return [];
  const hits = CUSTOM_SYNCED_LYRICS_DB.filter(item =>
    item.keys.some(k => (kTitle && (kTitle.includes(k) || k.includes(kTitle))) || (kFull && kFull.includes(k)))
  );
  return hits;
}

function convertVttOrSrtToLrc(subText) {
  if (!subText || typeof subText !== 'string') return '';
  const lines = subText.replace(/\r/g, '').split('\n');
  const out = [];
  const timeRe = /(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{2,3})\s*-->/;
  let currentTag = '';
  let bufferText = [];
  const flush = () => {
    if (currentTag && bufferText.length > 0) {
      const clean = bufferText.join(' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (clean && clean !== '[Música]' && clean !== '[Music]') {
        out.push(`${currentTag} ${clean}`);
      }
    }
    bufferText = [];
  };
  for (const rawLine of lines) {
    const l = rawLine.trim();
    if (!l || l === 'WEBVTT' || /^\d+$/.test(l)) {
      if (!l) flush();
      continue;
    }
    const m = l.match(timeRe);
    if (m) {
      flush();
      const hrs = parseInt(m[1] || '0', 10);
      const mins = hrs * 60 + parseInt(m[2] || '0', 10);
      const secs = parseInt(m[3] || '0', 10);
      const cs = String(m[4] || '00').slice(0, 2).padEnd(2, '0');
      currentTag = `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${cs}]`;
    } else if (currentTag && !l.startsWith('NOTE') && !l.startsWith('Kind:') && !l.startsWith('Language:')) {
      bufferText.push(l);
    }
  }
  flush();
  return out.length >= 5 ? out.join('\n') : '';
}

// Fuentes adicionales de letra SINCRONIZADA: título canónico (iTunes, tolera tildes perdidas) + NetEase + Kugou + Subtítulos YouTube
async function fetchExtraSyncedLyrics(rawTitle, rawArtist, videoId = '') {
  const out = [];
  const ua = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' };
  const term = `${rawTitle} ${rawArtist}`.trim();
  const tasks = [];

  tasks.push((async () => {
    const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=4`, { signal: AbortSignal.timeout(2500) });
    const j = await r.json();
    const hit = (j.results || []).find(x => lyricsTitleMatches(x.trackName, rawTitle)) || null;
    if (!hit) return;
    const lr = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(hit.trackName)}&artist_name=${encodeURIComponent(hit.artistName)}`, { headers: ua, signal: AbortSignal.timeout(3000) });
    const arr = await lr.json();
    if (Array.isArray(arr)) for (const it of arr) if (it && it.syncedLyrics) out.push(it);
  })().catch(() => {}));

  tasks.push((async () => {
    const hdr = { ...ua, Referer: 'https://music.163.com' };
    const sr = await fetch(`https://music.163.com/api/search/get?s=${encodeURIComponent(term)}&type=1&limit=6`, { headers: hdr, signal: AbortSignal.timeout(3000) });
    const sj = await sr.json();
    const songs = (sj && sj.result && sj.result.songs) || [];
    const pick = songs.filter(s => lyricsTitleMatches(s.name, rawTitle)).slice(0, 2);
    for (const s of pick) {
      const lr = await fetch(`https://music.163.com/api/song/lyric?id=${s.id}&lv=1&kv=1&tv=-1`, { headers: hdr, signal: AbortSignal.timeout(3000) });
      const lj = await lr.json();
      const lrc = lj && lj.lrc && lj.lrc.lyric;
      if (lrc && /\[\d{1,2}:\d{2}/.test(lrc)) {
        out.push({
          id: `ne_${s.id}`,
          trackName: s.name,
          artistName: (s.artists && s.artists[0] && s.artists[0].name) || rawArtist,
          duration: (Number(s.duration) || 0) / 1000,
          syncedLyrics: lrc
        });
      }
    }
  })().catch(() => {}));

  // Kugou Synced LRC Database
  tasks.push((async () => {
    const kgSearch = await fetch(`http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=${encodeURIComponent(term)}&duration=&hash=`, {
      headers: ua,
      signal: AbortSignal.timeout(2600)
    });
    if (!kgSearch.ok) return;
    const kgJson = await kgSearch.json();
    const candidates = (kgJson && Array.isArray(kgJson.candidates)) ? kgJson.candidates : [];
    const matched = candidates.filter(c => c && c.id && c.accesskey && lyricsTitleMatches(c.song || '', rawTitle)).slice(0, 2);
    for (const c of matched) {
      const dlRes = await fetch(`http://lyrics.kugou.com/download?ver=1&client=pc&id=${encodeURIComponent(c.id)}&accesskey=${encodeURIComponent(c.accesskey)}&fmt=lrc&charset=utf8`, {
        headers: ua,
        signal: AbortSignal.timeout(2400)
      });
      if (!dlRes.ok) continue;
      const dlJson = await dlRes.json();
      if (dlJson && dlJson.content) {
        const decoded = Buffer.from(String(dlJson.content), 'base64').toString('utf8');
        if (decoded && /\[\d{1,2}:\d{2}/.test(decoded)) {
          out.push({
            id: `kg_${c.id}`,
            trackName: c.song || rawTitle,
            artistName: c.singer || rawArtist,
            duration: Math.round((Number(c.duration) || 0) / 1000),
            syncedLyrics: decoded
          });
        }
      }
    }
  })().catch(() => {}));

  // YouTube Subtitles / Closed Captions to LRC (if videoId is available)
  const cleanVid = String(videoId || '').replace(/^magic_yt_|^yt_/, '').trim();
  if (cleanVid && /^[A-Za-z0-9_-]{11}$/.test(cleanVid)) {
    tasks.push((async () => {
      let addedYtSub = false;
      try {
        const pipedRes = await fetch(`https://pipedapi.kavin.rocks/streams/${encodeURIComponent(cleanVid)}`, {
          signal: AbortSignal.timeout(2500)
        });
        if (pipedRes.ok) {
          const pj = await pipedRes.json();
          const subs = Array.isArray(pj?.subtitles) ? pj.subtitles : [];
          const bestSub = subs.find(s => s && s.url && !s.autoGenerated && /es|en/i.test(s.code || '')) || subs.find(s => s && s.url);
          if (bestSub && bestSub.url) {
            const subRes = await fetch(bestSub.url, { signal: AbortSignal.timeout(2400) });
            if (subRes.ok) {
              const vtt = await subRes.text();
              const lrc = convertVttOrSrtToLrc(vtt);
              if (lrc) {
                addedYtSub = true;
                out.push({
                  id: `yt_sub_${cleanVid}`,
                  trackName: pj.title || rawTitle,
                  artistName: pj.uploader || rawArtist,
                  duration: Number(pj.duration) || 0,
                  syncedLyrics: lrc,
                  provider: 'yt_captions'
                });
              }
            }
          }
        }
      } catch (_) {}

      // Respaldo directo vía YouTube watch captionTracks (si Piped no devolvió subtítulos)
      if (!addedYtSub) {
        try {
          const watchRes = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(cleanVid)}&hl=es`, {
            headers: ua,
            signal: AbortSignal.timeout(2600)
          });
          if (watchRes.ok) {
            const html = await watchRes.text();
            const capMatch = html.match(/"captionTracks"\s*:\s*(\[[\s\S]*?\])\s*,\s*"audioTracks"/);
            if (capMatch && capMatch[1]) {
              const capTracks = JSON.parse(capMatch[1]);
              if (Array.isArray(capTracks) && capTracks.length > 0) {
                const chosen = capTracks.find(c => c && c.baseUrl && c.kind !== 'asr' && /^(?:es|en)/i.test(c.languageCode || ''))
                  || capTracks.find(c => c && c.baseUrl && c.kind !== 'asr')
                  || capTracks.find(c => c && c.baseUrl);
                if (chosen && chosen.baseUrl) {
                  const vttUrl = chosen.baseUrl.includes('fmt=') ? chosen.baseUrl : `${chosen.baseUrl}&fmt=vtt`;
                  const tRes = await fetch(vttUrl, { headers: ua, signal: AbortSignal.timeout(2200) });
                  if (tRes.ok) {
                    const vttText = await tRes.text();
                    const lrc = convertVttOrSrtToLrc(vttText);
                    if (lrc) {
                      out.push({
                        id: `yt_cap_${cleanVid}`,
                        trackName: rawTitle,
                        artistName: rawArtist,
                        duration: 0,
                        syncedLyrics: lrc,
                        provider: 'yt_captions'
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (_) {}
      }
    })().catch(() => {}));
  }

  await Promise.all(tasks);
  return out;
}

app.get('/api/v1/lyrics', async (req, res) => {
  try {
    const rawVideoId = String(req.query.videoId || '').replace(/^magic_yt_|^yt_/, '').trim();
    let rawTitleOrig = repairStrippedSpanishText(String(req.query.title || '')).trim();
    let rawArtistOrig = String(req.query.artist || '').replace(/\s*-\s*topic$/i, '').replace(/vevo$/i, '').trim();
    if (rawTitleOrig.includes(' - ')) {
      const dashParts = rawTitleOrig.split(' - ');
      const left = dashParts[0].trim();
      const right = dashParts.slice(1).join(' - ').trim();
      const rightIsTag = /^(?:official|oficial|video|videoclip|audio|lyric|lyrics|letra|hd|4k|live|en vivo|remaster|visualizer)/i.test(right);
      const artGenericOrMatch = !rawArtistOrig ||
        /^(?:youtube|ultimoscruzados|unknown|artista|music|varios|various)$/i.test(rawArtistOrig) ||
        rawArtistOrig.toLowerCase().includes(left.toLowerCase()) ||
        left.toLowerCase().includes(rawArtistOrig.toLowerCase());
      if (left && right && !rightIsTag && artGenericOrMatch) {
        rawArtistOrig = left;
        rawTitleOrig = right;
      }
    }
    const rawTitle = rawTitleOrig
      .replace(/^perreo\s+sanxe\s*(?:ft\.?\s*[^-]+)?\s*-\s*/i, '')
      .replace(/\s*\[[^\]]*\]/g, '')
      .replace(/\s*[\(\[][^\)\]]*(?:official|video|audio|lyric|letra|videoclip|hd|4k|remaster|live|en vivo|tv size|ver\.|version|feat\.|ft\.|parodia)[^\)\]]*[\)\]]/gi, '')
      .trim();
    const rawArtist = /^ultimoscruzados$/i.test(rawArtistOrig) && /perreo\s+sanxe/i.test(rawTitleOrig)
      ? 'Perreo Sanxe'
      : rawArtistOrig;
    const rawQ = String(req.query.q || `${rawTitle} ${rawArtist}`).replace(/\s*[\(\[][^\)\]]*(?:official|video|audio|lyric|letra|videoclip|hd|4k|remaster|live|en vivo|tv size|ver\.|version)[^\)\]]*[\)\]]/gi, '').trim();
    const expectedDur = Math.round(parseFloat(String(req.query.duration || req.query.durationSec || '0')) || 0);

    const customMatches = findCustomSyncedLyrics(rawTitleOrig || rawTitle, rawArtist, rawQ, rawVideoId);
    if (customMatches.length > 0) {
      return res.json(customMatches);
    }

    if (!rawQ || rawQ.length < 2) return res.json([]);
    const cacheKey = `${rawVideoId}|${rawTitle.toLowerCase()}|${rawArtist.toLowerCase()}|${rawQ.toLowerCase()}|${expectedDur > 35 ? expectedDur : 0}`;
    if (lyricsMemoryCache.has(cacheKey)) {
      return res.json(lyricsMemoryCache.get(cacheKey));
    }

    const headers = { 'User-Agent': 'PianoCommunity/8.0 (https://github.com/atomasv/piano_renacer)' };
    const tasks = [];

    // 1. Coincidencia exacta en LRCLIB cuando conocemos la duración real del audio
    if (rawTitle && rawArtist && expectedDur > 35) {
      tasks.push(
        fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(rawTitle)}&artist_name=${encodeURIComponent(rawArtist)}&duration=${expectedDur}`, {
          headers,
          signal: AbortSignal.timeout(3000)
        }).then(r => r.ok ? r.json() : null).then(obj => (obj && (obj.syncedLyrics || obj.plainLyrics)) ? [{ ...obj, provider: 'lrclib_exact' }] : []).catch(() => [])
      );
    }

    // 2. Búsqueda estructurada track_name + artist_name en LRCLIB
    if (rawTitle && rawArtist) {
      tasks.push(
        fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(rawTitle)}&artist_name=${encodeURIComponent(rawArtist)}`, {
          headers,
          signal: AbortSignal.timeout(3400)
        }).then(r => r.ok ? r.json() : []).then(arr => Array.isArray(arr) ? arr.map(x => ({ ...x, provider: 'lrclib' })) : []).catch(() => [])
      );
    }

    // 3. Búsqueda amplia q en LRCLIB en paralelo (captura versiones MV/álbum/radio)
    tasks.push(
      fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(rawQ)}`, {
        headers,
        signal: AbortSignal.timeout(3500)
      }).then(r => r.ok ? r.json() : []).then(arr => Array.isArray(arr) ? arr.map(x => ({ ...x, provider: 'lrclib' })) : []).catch(() => [])
    );

    // 4. Multi-fuente paralela: iTunes canónico + NetEase + Kugou + Subtítulos YouTube
    if (rawTitle || rawVideoId) {
      tasks.push(fetchExtraSyncedLyrics(rawTitle || rawQ, rawArtist, rawVideoId).catch(() => []));
    }

    const settled = await Promise.allSettled(tasks);
    const merged = [];
    const seenKeys = new Set();

    for (const r of settled) {
      if (r.status !== 'fulfilled' || !Array.isArray(r.value)) continue;
      for (const item of r.value) {
        if (!item) continue;
        const syncStr = String(item.syncedLyrics || '').trim();
        const plainStr = String(item.plainLyrics || '').trim();
        if (!syncStr && !plainStr) continue;
        const sig = `${String(item.id || '')}|${Math.round(Number(item.duration) || 0)}|${syncStr.slice(0, 64)}|${syncStr.length}`;
        if (seenKeys.has(sig)) continue;
        seenKeys.add(sig);
        merged.push(item);
      }
    }

    merged.sort((a, b) => {
      const aHas = a && a.syncedLyrics && String(a.syncedLyrics).includes('[') ? 1 : 0;
      const bHas = b && b.syncedLyrics && String(b.syncedLyrics).includes('[') ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      if (expectedDur > 35) {
        const aDiff = Math.abs((Number(a.duration) || expectedDur) - expectedDur);
        const bDiff = Math.abs((Number(b.duration) || expectedDur) - expectedDur);
        if (Math.abs(aDiff - bDiff) > 2) return aDiff - bDiff;
      }
      return 0;
    });

    const list = merged.slice(0, 28);
    if (lyricsMemoryCache.size > 450) {
      const oldestKey = lyricsMemoryCache.keys().next().value;
      if (oldestKey) lyricsMemoryCache.delete(oldestKey);
    }
    if (list.length > 0) {
      lyricsMemoryCache.set(cacheKey, list);
    }
    return res.json(list);
  } catch (_) {
    return res.json([]);
  }
});

// ==========================================
// 4B. Multi-Engine Audio Extractor (/api/v1/audio/extract)
// ==========================================
async function fetchAudioBufferSafe(url, timeoutMs = 7500, extraHeaders = {}) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'audio/*,*/*;q=0.8',
      ...extraHeaders
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const cType = String(resp.headers.get('content-type') || '').toLowerCase();
  if (cType.includes('text/html') || cType.includes('application/json')) {
    throw new Error(`Invalid audio content-type: ${cType}`);
  }
  const ab = await resp.arrayBuffer();
  if (!ab || ab.byteLength < 12000) {
    throw new Error('Audio buffer too small');
  }
  return {
    buffer: Buffer.from(ab),
    contentType: cType.startsWith('audio/') || cType.includes('mp4') || cType.includes('octet-stream')
      ? (cType.includes('octet-stream') ? 'audio/mpeg' : cType.split(';')[0])
      : 'audio/mpeg'
  };
}

function scoreStudioAudioAuthenticityServer(searchQuery, rawTitle, rawArtist, candTitle, candArtist, candAlbum = '', extraChannel = '') {
  const norm = (s) => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const repQuery = repairStrippedSpanishText(searchQuery);
  const repTitle = repairStrippedSpanishText(rawTitle);
  const repArtist = repairStrippedSpanishText(rawArtist);
  const repCandTitle = repairStrippedSpanishText(candTitle);
  const repCandArtist = repairStrippedSpanishText(candArtist);
  const nQuery = norm(repQuery || `${repTitle} ${repArtist}`);
  const nTitle = norm(repTitle || repQuery);
  const nArtist = norm(repArtist);
  const cTitle = norm(repCandTitle);
  const cArtist = norm(repCandArtist);
  const cAlbum = norm(candAlbum);
  const cExtra = norm(extraChannel);
  const cFull = `${cTitle} ${cArtist} ${cAlbum} ${cExtra}`.trim();

  if (!cTitle) return 0;

  // Base relevance score
  let score = computeSongRelevanceScore(repQuery || `${repTitle} ${repArtist}`, candTitle || '', candArtist || '');

  // Require real title word overlap so we never pick a different song just because the artist matched
  const stopWords = new Set(['the', 'and', 'for', 'with', 'los', 'las', 'del', 'una', 'por', 'con', 'para', 'de', 'la', 'el', 'en', 'un', 'al', 'lo', 'official', 'audio', 'video', 'lyrics', 'letra']);
  const titleWords = (nTitle || nQuery).split(' ').filter(w => w.length >= 3 && !stopWords.has(w));
  const artistWords = new Set(nArtist ? nArtist.split(' ').filter(w => w.length >= 3) : []);
  const pureTitleWords = titleWords.filter(w => !artistWords.has(w));
  const checkWords = pureTitleWords.length > 0 ? pureTitleWords : titleWords;

  if (checkWords.length > 0) {
    let matchedTitleWords = 0;
    for (const w of checkWords) {
      if ((' ' + cTitle + ' ').includes(' ' + w + ' ') || (w.length >= 4 && cTitle.includes(w))) {
        matchedTitleWords++;
      } else if (w.length >= 5 && cTitle.split(' ').some(cw => Math.abs(cw.length - w.length) <= 1 && (cw.startsWith(w.slice(0, 4)) || w.startsWith(cw.slice(0, 4))))) {
        matchedTitleWords++;
      }
    }
    if (matchedTitleWords === 0) {
      // Candidate title doesn't match the requested song title at all
      return Math.min(25, score);
    }
    score += Math.round((matchedTitleWords / checkWords.length) * 30);
  }

  // Exact title / artist bonuses (also award artist bonus if artist is inside candTitle)
  if (nTitle && cTitle === nTitle) score += 35;
  else if (nTitle && cTitle.startsWith(nTitle)) score += 18;
  if (nArtist) {
    if (cArtist && (cArtist === nArtist || cArtist.includes(nArtist) || nArtist.includes(cArtist))) {
      score += 35;
    } else if (cTitle.includes(nArtist)) {
      score += 30;
    }
  }

  // Official YouTube Topic / VEVO bonus
  if (/topic\b|vevo\b|official/i.test(String(extraChannel || '') + ' ' + String(candArtist || ''))) {
    score += 20;
  }

  // Anti-Karaoke / Tribute / Fake version penalties (unless requested in query)
  const heavyFakeMarkers = [
    'karaoke', 'tribute', 'made famous', 'originally performed', 'in the style of',
    '8 bit', '8bit', 'lullaby', 'music box', 'ringtone', 'parody', 'backing track',
    'hit crew', 'countdown singers', 'party tyme', 'sunfly', 'ameritz', 'prosource',
    'done again', 'starlight singers', 'sing king', 'piano cover', 'guitar cover', 'instrumental version'
  ];
  for (const m of heavyFakeMarkers) {
    if (cFull.includes(m) && !nQuery.includes(m)) {
      score -= 90;
    }
  }

  // Anti-Strange-Version penalties (Nightcore, Slowed, Sped Up, Remix, DJ Mix, Medley/Popurri, Live, Cover, Demo, Remake)
  const strangeMarkers = [
    'nightcore', 'daycore', 'slowed', 'sped up', 'reverb', '8d audio', 'bass boosted',
    'chopped', 'screwed', 'remix', 'rmx', 'dj mix', 'classic mix', 'bootleg', 'mashup',
    'megamix', 'extended mix', 'club mix', 'vip mix', 'eurodance', 'fiestero', 'popurri',
    'medley', 'dubos', 'chelito', 'kye remix', 'sarapura', 'por claudio', 'hermanos cuero',
    'cover', 'live at', 'live in', 'live from', 'en vivo', 'ao vivo', 'en directo',
    'concierto', 'acoustic version', 'unplugged', 'demo', 'tv size', 'short ver', 'cut ver',
    'remake', 'premio lo nuestro', 'filtrado', 'karu edit', 'ai cover'
  ];
  for (const m of strangeMarkers) {
    if (cFull.includes(m) && !nQuery.includes(m)) {
      score -= 65;
    }
  }
  if (/\b(live|dj|edit|remake)\b/.test(cTitle) && !/\b(live|dj|edit|remake)\b/.test(nQuery)) {
    score -= 45;
  }

  return score;
}

function parseDurationStrToSecondsServer(lenStr) {
  if (!lenStr || typeof lenStr !== 'string') return 0;
  const parts = lenStr.trim().split(':').map(n => parseInt(n, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

async function searchYouTubeCandidatesServer(query, rawTitle = '', rawArtist = '', expectedDurationSec = 0) {
  try {
    const cleanQ = String(query || `${rawTitle} ${rawArtist}`).trim();
    if (!cleanQ) return [];
    const queries = [cleanQ];
    if (!/\b(audio|official|oficial|topic|canciones)\b/i.test(cleanQ)) {
      queries.push(`${cleanQ} official audio`);
    }

    const found = [];
    const seenIds = new Set();

    await Promise.allSettled(queries.map(async (ytQuery, qIdx) => {
      const ytRes = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({
          context: {
            client: { clientName: 'WEB', clientVersion: '2.20240726.00.00', hl: 'es', gl: 'ES' }
          },
          query: ytQuery
        }),
        signal: AbortSignal.timeout(3400)
      });
      if (!ytRes.ok) return;
      const data = await ytRes.json();
      let rankIdx = 0;

      const walk = (node) => {
        if (!node || typeof node !== 'object' || found.length >= 34) return;
        if (node.videoRenderer && node.videoRenderer.videoId) {
          const v = node.videoRenderer;
          const vid = v.videoId;
          if (seenIds.has(vid)) return;
          const title = v.title?.runs?.[0]?.text || v.title?.simpleText || '';
          const author = v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || '';
          const lenText = v.lengthText?.simpleText || v.lengthText?.runs?.[0]?.text || '';
          const durSec = parseDurationStrToSecondsServer(lenText);
          if (!durSec || durSec < 42 || durSec > 900) return;
          if (!lenText && v.badges && JSON.stringify(v.badges).includes('LIVE')) return;

          const thumbs = v.thumbnail?.thumbnails || [];
          const thumb = thumbs.length ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
          if (vid && title) {
            seenIds.add(vid);
            rankIdx++;
            const cleanArt = author.replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim();
            let authScore = Math.max(48, 98 - (qIdx * 4) - Math.min(35, rankIdx * 1.4));
            const isTopicOrAudio = / - Topic$/i.test(author) || /\b(official\s*audio|audio\s*oficial|provided to youtube|lyric|letra)\b/i.test(title);
            const isMusicVideo = /\b(official\s*video|video\s*oficial|videoclip|music\s*video)\b/i.test(title);
            if (isTopicOrAudio) {
              authScore += 22;
            }
            if (expectedDurationSec > 55 && durSec > 55) {
              const diffDur = Math.abs(durSec - expectedDurationSec);
              if (diffDur <= 3) authScore += 36;
              else if (diffDur <= 7) authScore += 24;
              else if (diffDur <= 12) authScore += 12;
              else if (diffDur >= 18) authScore -= 28;
            } else if (isMusicVideo && !isTopicOrAudio) {
              authScore -= 8;
            }
            found.push({
              videoId: vid,
              title,
              artist: cleanArt || rawArtist || 'YouTube Music',
              channel: author,
              durationSec: durSec || expectedDurationSec || 180,
              thumbnail: thumb,
              authScore: Math.min(135, Math.round(authScore))
            });
          }
        }
        for (const k of Object.keys(node)) {
          const child = node[k];
          if (Array.isArray(child)) child.forEach(walk);
          else if (child && typeof child === 'object') walk(child);
        }
      };
      walk(data);
    }));

    found.sort((a, b) => (b.authScore || 0) - (a.authScore || 0));
    return found.slice(0, 30);
  } catch (_) {
    return [];
  }
}

async function searchYouTubeBestVideo(query, rawTitle = '', rawArtist = '', expectedDurationSec = 0) {
  const list = await searchYouTubeCandidatesServer(query, rawTitle, rawArtist, expectedDurationSec);
  return list[0] || null;
}

async function searchYouTubeVideoclipCandidatesServer(query, rawTitle = '', rawArtist = '', expectedDurationSec = 0) {
  try {
    const cleanTitle = String(rawTitle || '').replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim();
    const cleanArtist = String(rawArtist || '').replace(/\s*-\s*topic$/i, '').replace(/vevo$/i, '').trim();
    const cleanQ = String(query || `${cleanArtist} ${cleanTitle}`).trim();
    if (!cleanQ) return [];

    const baseClean = cleanQ
      .replace(/\b(official\s*(?:music\s*)?video|videoclip\s*oficial|official\s*audio|lyric(?:s)?|letra)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim() || cleanQ;
    const queries = [
      `${baseClean} official music video`,
      `${baseClean} videoclip oficial`
    ];

    const normTit = normalizeSearchText(cleanTitle || baseClean);
    const titleWords = normTit.split(' ').filter(w => w.length >= 2);
    const normArt = normalizeSearchText(cleanArtist);
    const artPrimary = normArt.split(' ')[0] || '';

    const found = [];
    const seenIds = new Set();

    await Promise.allSettled(queries.map(async (ytQuery, qIdx) => {
      const ytRes = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({
          context: {
            client: { clientName: 'WEB', clientVersion: '2.20240726.00.00', hl: 'es', gl: 'ES' }
          },
          query: ytQuery
        }),
        signal: AbortSignal.timeout(3400)
      });
      if (!ytRes.ok) return;
      const data = await ytRes.json();
      let rankIdx = 0;

      const walk = (node) => {
        if (!node || typeof node !== 'object' || found.length >= 34) return;
        if (node.videoRenderer && node.videoRenderer.videoId) {
          const v = node.videoRenderer;
          const vid = v.videoId;
          if (seenIds.has(vid)) return;
          const title = v.title?.runs?.[0]?.text || v.title?.simpleText || '';
          const author = v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || '';
          const lenText = v.lengthText?.simpleText || v.lengthText?.runs?.[0]?.text || '';
          const durSec = parseDurationStrToSecondsServer(lenText);
          if (!durSec || durSec < 45 || durSec > 900) return;
          if (!lenText && v.badges && JSON.stringify(v.badges).includes('LIVE')) return;

          const thumbs = v.thumbnail?.thumbnails || [];
          const thumb = thumbs.length ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
          if (vid && title) {
            seenIds.add(vid);
            const myRank = rankIdx++;
            const nVTitle = normalizeSearchText(title);
            const nAuthor = normalizeSearchText(author);
            const cleanArt = author.replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim();

            let mvScore = 50 - (qIdx * 3) - Math.min(30, myRank * 1.5);
            if (titleWords.length > 0) {
              let matchedW = 0;
              for (const w of titleWords) {
                if (nVTitle.includes(w)) matchedW++;
              }
              if (matchedW === 0) mvScore -= 120;
              else mvScore += Math.round((matchedW / titleWords.length) * 35);
            }
            if (normArt && (nVTitle.includes(normArt) || nAuthor.includes(normArt) || (artPrimary.length >= 3 && (nVTitle.includes(artPrimary) || nAuthor.includes(artPrimary))))) {
              mvScore += 25;
            }

            const isTopicChannel = / - Topic$/i.test(author) || /\b(provided\s+to\s+youtube|auto-?generated)\b/i.test(`${title} ${author}`);
            const isExplicitMv = /\b(official\s*(?:music\s*)?video|music\s*video|videoclip\s*oficial|video\s*(?:musical\s*)?oficial|video\s*clip\s*oficial|official\s*mv)\b/i.test(title);
            const isBroadMv = !isExplicitMv && /\b(videoclip|video\s*oficial|official\s*clip)\b/i.test(title);
            const isLyricOrNonMv = /\b(lyric\s*video|lyrics?|con\s+letra|letra\s*oficial|\bletra\b|subtitulad[oa]|sub\.\s*espa[ñn]ol|traducid[oa])\b/i.test(title);
            const isAudioOnlyOrAlt = /\b(official\s*audio|audio\s*oficial|audio\s*only|solo\s*audio|visualizer|visualizador|karaoke|instrumental|cover|nightcore|sped\s*up|slowed|8d\s*audio|reaction|en\s*vivo|live\s+at|live\s+in|concierto)\b/i.test(title) && !/\b(karaoke|cover|live|en vivo)\b/i.test(cleanTitle);

            if (isExplicitMv) mvScore += 95;
            else if (isBroadMv) mvScore += 65;
            if (!isTopicChannel && (/vevo$/i.test(author) || (normArt && (nAuthor.includes(normArt) || (artPrimary.length >= 3 && nAuthor.includes(artPrimary)))))) {
              mvScore += 42;
            }
            if (isTopicChannel) mvScore -= 170;
            if (isLyricOrNonMv) mvScore -= 150;
            if (isAudioOnlyOrAlt) mvScore -= 115;

            if (expectedDurationSec > 55 && durSec > 55) {
              const diffDur = durSec - expectedDurationSec;
              if (Math.abs(diffDur) <= 8) mvScore += 20;
              else if (diffDur > 8 && diffDur <= 45) mvScore += 10;
              else if (Math.abs(diffDur) > 85) mvScore -= 25;
            }

            found.push({
              videoId: vid,
              title,
              artist: cleanArt || rawArtist || 'YouTube',
              channel: author,
              durationSec: durSec || expectedDurationSec || 180,
              thumbnail: thumb,
              authScore: Math.round(mvScore),
              isMusicVideoCandidate: !isTopicChannel && !isLyricOrNonMv && !isAudioOnlyOrAlt
            });
          }
        }
        for (const k of Object.keys(node)) {
          const child = node[k];
          if (Array.isArray(child)) child.forEach(walk);
          else if (child && typeof child === 'object') walk(child);
        }
      };
      walk(data);
    }));

    found.sort((a, b) => (b.authScore || 0) - (a.authScore || 0));
    return found.slice(0, 30);
  } catch (_) {
    return [];
  }
}

const YOUTUBE_FULL_MP3_LRU = new Map();
const YOUTUBE_FULL_MP3_LRU_MAX = 80;
const YOUTUBE_INFLIGHT_EXTRACTIONS = new Map();
const YOUTUBE_STREAM_STATES = new Map();
const NOTUBE_SERVER_NODES = [
  's40', 's41', 's42', 's43', 's44', 's45', 's46', 's47', 's48', 's49',
  's50', 's51', 's52', 's53', 's54', 's55', 's56', 's57', 's58', 's59',
  's60', 's61', 's62', 's63', 's64', 's65', 's66', 's67', 's68', 's69',
  's70', 's71', 's72', 's73', 's74', 's75', 's76'
];
let _notubeServerNodeCursor = 0;

function sliceMp3AtChorusServer(fullBuf, ratio = 0.28) {
  if (!Buffer.isBuffer(fullBuf) || fullBuf.length < 320000) return fullBuf;
  let startOff = Math.floor(fullBuf.length * ratio);
  const searchEnd = Math.min(fullBuf.length - 4, startOff + 8192);
  for (let i = startOff; i < searchEnd; i++) {
    if (fullBuf[i] === 0xFF && (fullBuf[i + 1] & 0xE0) === 0xE0 && (fullBuf[i + 1] & 0x18) !== 0x08 && (fullBuf[i + 2] & 0xF0) !== 0xF0) {
      startOff = i;
      break;
    }
  }
  return fullBuf.slice(startOff);
}

const YT_PERSISTENT_CACHE_DIR = '/tmp/renacer_yt_mp3_cache';
try { fs.mkdirSync(YT_PERSISTENT_CACHE_DIR, { recursive: true }); } catch (_) {}

function readPersistentYtMp3Cache(videoId) {
  try {
    const mp3Path = path.join(YT_PERSISTENT_CACHE_DIR, `${videoId}.mp3`);
    if (!fs.existsSync(mp3Path)) return null;
    const buf = fs.readFileSync(mp3Path);
    if (!buf || buf.length < 120000) return null;
    let meta = {};
    try {
      const metaPath = path.join(YT_PERSISTENT_CACHE_DIR, `${videoId}.json`);
      if (fs.existsSync(metaPath)) meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (_) {}
    return {
      buffer: buf,
      contentType: 'audio/mpeg',
      title: meta.title || '',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      source: 'YouTube Studio Master MP3'
    };
  } catch (_) {
    return null;
  }
}

function writePersistentYtMp3Cache(videoId, resultObj) {
  try {
    if (!videoId || !resultObj || !resultObj.buffer || resultObj.buffer.length < 120000) return;
    const mp3Path = path.join(YT_PERSISTENT_CACHE_DIR, `${videoId}.mp3`);
    const metaPath = path.join(YT_PERSISTENT_CACHE_DIR, `${videoId}.json`);
    fs.writeFileSync(mp3Path, resultObj.buffer);
    fs.writeFileSync(metaPath, JSON.stringify({ title: resultObj.title || '', ts: Date.now() }));
  } catch (_) {}
}

async function resolveSignedNotubeDownloadUrlServer(videoId, apiHost, webHost, ua) {
  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const myWorker = (u) => `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(u)}`;

  const body1 = new URLSearchParams({ url: ytUrl, format: 'mp3', lang: 'es', subscribed: 'false' });
  let d1 = null;
  try {
    const directP = fetch(`${apiHost}/recover_weight.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': ua,
        'Origin': webHost,
        'Referer': `${webHost}/`
      },
      body: body1.toString(),
      signal: AbortSignal.timeout(12000)
    }).then(async (r1) => {
      if (!r1.ok) throw new Error('r1_http');
      const txt1 = await r1.text();
      if (!txt1 || !txt1.trim().startsWith('{')) throw new Error('r1_json');
      const parsed = JSON.parse(txt1);
      if (!parsed || !parsed.token) throw new Error('r1_tok');
      return parsed;
    });

    const workerP = fetch(myWorker(`${apiHost}/recover_weight.php`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body1.toString(),
      signal: AbortSignal.timeout(12000)
    }).then(async (r1w) => {
      if (!r1w.ok) throw new Error('r1w_http');
      const parsed = await r1w.json();
      if (!parsed || !parsed.token) throw new Error('r1w_tok');
      return parsed;
    });

    d1 = await Promise.any([directP, workerP]);
  } catch (_) {}
  if (!d1 || !d1.token) return null;

  const body2 = new URLSearchParams({
    url: ytUrl,
    format: 'mp3',
    name_mp4: d1.name_mp4 || '',
    lang: 'es',
    token: d1.token,
    subscribed: 'false',
    playlist: 'false',
    adblock: 'false'
  });

  let finalToken = '';
  const parseR2Json = async (resp) => {
    if (!resp || !resp.ok) throw new Error('r2_not_ok');
    const txt2 = await resp.text();
    if (!txt2 || !txt2.trim().startsWith('{')) throw new Error('r2_not_json');
    const d2 = JSON.parse(txt2);
    if (!d2 || !d2.token) throw new Error('r2_no_token');
    return d2.token;
  };
  try {
    // Llamada directa a través del worker para evitar el bloqueo Cloudflare Turnstile en recover_file.php
    finalToken = await fetch(myWorker(`${apiHost}/recover_file.php`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body2.toString(),
      signal: AbortSignal.timeout(5000)
    }).then(parseR2Json);
  } catch (_) {}
  if (!finalToken) finalToken = d1.token;

  let dlUrl = '';
  const downloadPageUrl = `${webHost}/es/download?token=${encodeURIComponent(finalToken)}`;
  try {
    const pageRes = await fetch(downloadPageUrl, {
      headers: { 'User-Agent': ua, 'Referer': `${webHost}/` },
      signal: AbortSignal.timeout(3500)
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const keyMatch = html.match(/https:\/\/s\d+\.notube\.(?:im|net)\/download\.php\?token=[^"'\s>]+&key=[A-Za-z0-9]+/);
      if (keyMatch && keyMatch[0]) dlUrl = keyMatch[0];
    }
  } catch (_) {}

  if (!dlUrl) {
    try {
      const pageResW = await fetch(myWorker(downloadPageUrl), {
        signal: AbortSignal.timeout(4000)
      });
      if (pageResW.ok) {
        const html = await pageResW.text();
        const keyMatch = html.match(/https:\/\/s\d+\.notube\.(?:im|net)\/download\.php\?token=[^"'\s>]+&key=[A-Za-z0-9]+/);
        if (keyMatch && keyMatch[0]) dlUrl = keyMatch[0];
      }
    } catch (_) {}
  }

  if (!dlUrl) return null;
  return {
    dlUrl,
    title: (d1.titulo_mp4 || d1.titre_mp4 || '').replace(/\+/g, ' ').replace(/\.mp4$/i, '').replace(/_/g, ' ').trim()
  };
}

async function extractYouTubeFullAudioViaNotubeServer(videoId) {
  if (!videoId || !/^[A-Za-z0-9_-]{8,15}$/.test(videoId)) return null;
  if (YOUTUBE_FULL_MP3_LRU.has(videoId)) {
    return YOUTUBE_FULL_MP3_LRU.get(videoId);
  }
  const diskHit = readPersistentYtMp3Cache(videoId);
  if (diskHit) {
    if (YOUTUBE_FULL_MP3_LRU.size >= YOUTUBE_FULL_MP3_LRU_MAX) {
      const oldest = YOUTUBE_FULL_MP3_LRU.keys().next().value;
      if (oldest) YOUTUBE_FULL_MP3_LRU.delete(oldest);
    }
    YOUTUBE_FULL_MP3_LRU.set(videoId, diskHit);
    return diskHit;
  }
  if (YOUTUBE_INFLIGHT_EXTRACTIONS.has(videoId)) {
    return YOUTUBE_INFLIGHT_EXTRACTIONS.get(videoId);
  }

  const streamState = {
    chunks: [],
    totalBytes: 0,
    done: false,
    error: false,
    listeners: new Set()
  };
  YOUTUBE_STREAM_STATES.set(videoId, streamState);

  const notifyListeners = (chunk, isDone, isError = false) => {
    for (const fn of streamState.listeners) {
      try { fn(chunk, isDone, isError); } catch (_) {}
    }
  };

  const taskPromise = (async () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    const startIdx = (_notubeServerNodeCursor++) % NOTUBE_SERVER_NODES.length;
    const webHost = 'https://notube.im';
    const primaryNodes = [
      NOTUBE_SERVER_NODES[startIdx],
      NOTUBE_SERVER_NODES[(startIdx + 9) % NOTUBE_SERVER_NODES.length]
    ];

    let streamingStarted = false;
    const tryNodeDownload = async (node) => {
      const apiHost = `https://${node}.notube.im`;
      const resolved = await resolveSignedNotubeDownloadUrlServer(videoId, apiHost, webHost, ua);
      if (!resolved || !resolved.dlUrl) throw new Error('resolve_failed');

      const dlRes = await fetch(resolved.dlUrl, {
        headers: { 'User-Agent': ua, 'Referer': `${webHost}/` },
        redirect: 'follow',
        signal: AbortSignal.timeout(22000)
      });
      if (!dlRes.ok) throw new Error('dl_not_ok');
      const ct = String(dlRes.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('text/html') || ct.includes('application/json')) throw new Error('dl_bad_ct');

      const localChunks = [];
      let localTotal = 0;
      const isPrimaryStreamer = !streamingStarted;
      if (isPrimaryStreamer) {
        streamingStarted = true;
        streamState.chunks = [];
        streamState.totalBytes = 0;
      }

      if (dlRes.body && typeof dlRes.body.getReader === 'function') {
        const reader = dlRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value && value.byteLength > 0) {
            const b = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
            localChunks.push(b);
            localTotal += b.length;
            if (isPrimaryStreamer) {
              streamState.chunks.push(b);
              streamState.totalBytes += b.length;
              notifyListeners(b, false, false);
            }
          }
        }
      } else {
        const ab = await dlRes.arrayBuffer();
        if (ab && ab.byteLength > 0) {
          const b = Buffer.from(ab);
          localChunks.push(b);
          localTotal += b.length;
          if (isPrimaryStreamer) {
            streamState.chunks.push(b);
            streamState.totalBytes += b.length;
            notifyListeners(b, false, false);
          }
        }
      }

      if (localTotal < 120000) throw new Error('dl_too_small');
      const fullBuf = Buffer.concat(localChunks, localTotal);
      let cleanTitle = resolved.title || '';
      try { cleanTitle = decodeURIComponent(cleanTitle); } catch (_) {}
      return {
        buffer: fullBuf,
        contentType: 'audio/mpeg',
        title: cleanTitle,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        source: 'YouTube Studio Master MP3'
      };
    };

    try {
      const winnerObj = await Promise.any(primaryNodes.map(n => tryNodeDownload(n)));
      if (winnerObj && winnerObj.buffer) {
        if (YOUTUBE_FULL_MP3_LRU.size >= YOUTUBE_FULL_MP3_LRU_MAX) {
          const oldest = YOUTUBE_FULL_MP3_LRU.keys().next().value;
          if (oldest) YOUTUBE_FULL_MP3_LRU.delete(oldest);
        }
        YOUTUBE_FULL_MP3_LRU.set(videoId, winnerObj);
        writePersistentYtMp3Cache(videoId, winnerObj);
        if (streamState.totalBytes < winnerObj.buffer.length) {
          streamState.chunks = [winnerObj.buffer];
          streamState.totalBytes = winnerObj.buffer.length;
        }
        streamState.done = true;
        notifyListeners(null, true, false);
        return winnerObj;
      }
    } catch (_) {}

    streamState.error = true;
    streamState.done = true;
    notifyListeners(null, true, true);
    return null;
  })();

  YOUTUBE_INFLIGHT_EXTRACTIONS.set(videoId, taskPromise);
  try {
    return await taskPromise;
  } finally {
    YOUTUBE_INFLIGHT_EXTRACTIONS.delete(videoId);
    setTimeout(() => {
      YOUTUBE_STREAM_STATES.delete(videoId);
    }, 5000);
  }
}

let _cachedSoundCloudClientId = '';
let _cachedSoundCloudClientIdTs = 0;
let _inflightSoundCloudClientIdPromise = null;

async function getSoundCloudClientIdServer() {
  if (_cachedSoundCloudClientId && (Date.now() - _cachedSoundCloudClientIdTs) < 3600000) {
    return _cachedSoundCloudClientId;
  }
  if (_inflightSoundCloudClientIdPromise) {
    return _inflightSoundCloudClientIdPromise;
  }
  _inflightSoundCloudClientIdPromise = (async () => {
    try {
      const homeRes = await fetch('https://soundcloud.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(4000)
      });
      if (!homeRes.ok) return _cachedSoundCloudClientId || '';
      const html = await homeRes.text();
      const scripts = [...html.matchAll(/src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g)].map(m => m[1]);
      for (const sUrl of scripts.slice(-4).reverse()) {
        try {
          const jsRes = await fetch(sUrl, { signal: AbortSignal.timeout(3000) });
          if (!jsRes.ok) continue;
          const jsText = await jsRes.text();
          const m = jsText.match(/client_id\s*:\s*"([a-zA-Z0-9]{32})"/) || jsText.match(/client_id="([a-zA-Z0-9]{32})"/);
          if (m && m[1]) {
            _cachedSoundCloudClientId = m[1];
            _cachedSoundCloudClientIdTs = Date.now();
            return _cachedSoundCloudClientId;
          }
        } catch (_) {}
      }
    } catch (_) {}
    return _cachedSoundCloudClientId || '';
  })();
  try {
    return await _inflightSoundCloudClientIdPromise;
  } finally {
    _inflightSoundCloudClientIdPromise = null;
  }
}
// Pre-calentar el client_id de SoundCloud al arrancar el servidor para ahorrar 450ms en la primera canción
setTimeout(() => { getSoundCloudClientIdServer().catch(() => {}); }, 50);

function convertFmp4ToAdtsAacServer(fullBuffer) {
  const buf = Buffer.isBuffer(fullBuffer) ? fullBuffer : Buffer.from(fullBuffer);
  let profile = 1;
  let freqIdx = 4;
  let chanCfg = 2;

  const limit = Math.min(buf.length - 16, 4096);
  for (let i = 0; i < limit; i++) {
    if (buf[i] === 0x65 && buf[i + 1] === 0x73 && buf[i + 2] === 0x64 && buf[i + 3] === 0x73) {
      const esdsEnd = Math.min(buf.length - 4, i + 128);
      for (let j = i + 8; j < esdsEnd; j++) {
        if (buf[j] === 0x05) {
          let k = j + 1;
          while (k < esdsEnd && (buf[k] & 0x80)) k++;
          const dsiLen = buf[k++];
          if (dsiLen >= 2 && k + 2 <= buf.length) {
            const b0 = buf[k];
            const b1 = buf[k + 1];
            const audioObjectType = (b0 >> 3) & 0x1F;
            const samplingFreqIndex = ((b0 & 0x07) << 1) | ((b1 >> 7) & 0x01);
            const channelConfig = (b1 >> 3) & 0x0F;
            if (audioObjectType >= 1 && audioObjectType <= 5 && samplingFreqIndex <= 12 && channelConfig >= 1 && channelConfig <= 7) {
              profile = 1;
              freqIdx = samplingFreqIndex;
              chanCfg = channelConfig;
              break;
            }
          }
        }
      }
      break;
    }
  }

  const adtsChunks = [];
  let pendingSampleSizes = [];

  function parseMoofForTrunSizes(moofStart, moofEnd) {
    const sizes = [];
    let p = moofStart;
    while (p + 8 <= moofEnd) {
      const sz = buf.readUInt32BE(p);
      const tp = buf.slice(p + 4, p + 8).toString('ascii');
      if (sz < 8 || p + sz > moofEnd) break;
      if (tp === 'traf') {
        sizes.push(...parseMoofForTrunSizes(p + 8, p + sz));
      } else if (tp === 'trun') {
        const flags = buf.readUInt32BE(p + 8) & 0xFFFFFF;
        const sampleCount = buf.readUInt32BE(p + 12);
        let cursor = p + 16;
        if (flags & 0x001) cursor += 4;
        if (flags & 0x004) cursor += 4;
        for (let s = 0; s < sampleCount; s++) {
          let sSize = 0;
          if (flags & 0x100) cursor += 4;
          if (flags & 0x200) { sSize = buf.readUInt32BE(cursor); cursor += 4; }
          if (flags & 0x400) cursor += 4;
          if (flags & 0x800) cursor += 4;
          if (sSize > 0) sizes.push(sSize);
        }
      }
      p += sz;
    }
    return sizes;
  }

  let off = 0;
  while (off + 8 <= buf.length) {
    const size = buf.readUInt32BE(off);
    const type = buf.slice(off + 4, off + 8).toString('ascii');
    if (size < 8 || off + size > buf.length) break;
    if (type === 'moof') {
      pendingSampleSizes = parseMoofForTrunSizes(off + 8, off + size);
    } else if (type === 'mdat' && pendingSampleSizes.length > 0) {
      let dataCursor = off + 8;
      const mdatEnd = off + size;
      for (const frameLen of pendingSampleSizes) {
        if (dataCursor + frameLen > mdatEnd) break;
        const adtsLen = frameLen + 7;
        const header = Buffer.alloc(7);
        header[0] = 0xFF;
        header[1] = 0xF1;
        header[2] = ((profile & 0x03) << 6) | ((freqIdx & 0x0F) << 2) | ((chanCfg >> 2) & 0x01);
        header[3] = ((chanCfg & 0x03) << 6) | ((adtsLen >> 11) & 0x03);
        header[4] = (adtsLen >> 3) & 0xFF;
        header[5] = ((adtsLen & 0x07) << 5) | 0x1F;
        header[6] = 0xFC;
        adtsChunks.push(header, buf.slice(dataCursor, dataCursor + frameLen));
        dataCursor += frameLen;
      }
      pendingSampleSizes = [];
    }
    off += size;
  }

  return adtsChunks.length > 0 ? Buffer.concat(adtsChunks) : fullBuffer;
}

async function downloadSoundCloudTrackBufferServer(tr, clientId) {
  if (!tr || !clientId) return null;
  const transcodings = Array.isArray(tr?.media?.transcodings) ? tr.media.transcodings : [];
  if (!transcodings.length) return null;

  // Preferir: 1) progressive audio/mpeg (MP3 directo), 2) hls audio/mpeg (MP3 HLS), 3) hls audio/mp4 (convertido a ADTS AAC)
  const sortedTrans = transcodings
    .filter(t => {
      if (!t || !t.url || t.snipped) return false;
      const proto = String(t?.format?.protocol || '');
      const mime = String(t?.format?.mime_type || '');
      if (proto !== 'progressive' && proto !== 'hls') return false;
      if (mime.includes('mpegurl')) return false;
      if (String(t.preset || '').includes('cbc') || proto.includes('encrypted')) return false;
      return true;
    })
    .sort((a, b) => {
      const rank = (x) => {
        const proto = String(x?.format?.protocol || '');
        const mime = String(x?.format?.mime_type || '');
        if (proto === 'progressive' && mime.includes('mpeg')) return 10;
        if (proto === 'progressive') return 9;
        if (proto === 'hls' && mime.includes('mpeg')) return 8;
        if (proto === 'hls' && mime.includes('mp4')) return 7;
        if (proto === 'hls' && mime.includes('ogg')) return 6;
        return 1;
      };
      return rank(b) - rank(a);
    });

  for (const trans of sortedTrans) {
    try {
      const proto = String(trans?.format?.protocol || '');
      const mime = String(trans?.format?.mime_type || 'audio/mpeg').split(';')[0].trim() || 'audio/mpeg';
      const sep = trans.url.includes('?') ? '&' : '?';
      const resolveUrl = `${trans.url}${sep}client_id=${encodeURIComponent(clientId)}&track_authorization=${encodeURIComponent(tr.track_authorization || '')}`;
      const r = await fetch(resolveUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(4000)
      });
      if (!r.ok) continue;
      const streamObj = await r.json();
      if (!streamObj || !streamObj.url) continue;

      if (proto === 'progressive') {
        const dl = await fetchAudioBufferSafe(streamObj.url, 8000);
        if (dl && dl.buffer && dl.buffer.length >= 350000) {
          return { buffer: dl.buffer, contentType: 'audio/mpeg' };
        }
      } else if (proto === 'hls') {
        const m3u8Res = await fetch(streamObj.url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(4000)
        });
        if (!m3u8Res.ok) continue;
        const m3u8Text = await m3u8Res.text();
        if (m3u8Text.includes('#EXT-X-KEY')) continue;

        const urlsToDownload = [];
        const mapMatch = m3u8Text.match(/#EXT-X-MAP:URI="([^"]+)"/);
        if (mapMatch && mapMatch[1]) {
          urlsToDownload.push(mapMatch[1]);
        }
        const segLines = m3u8Text
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(l => l.startsWith('http://') || l.startsWith('https://'));
        urlsToDownload.push(...segLines);

        if (urlsToDownload.length === 0 || urlsToDownload.length > 85) continue;

        const segBuffers = await Promise.all(urlsToDownload.map(async (u) => {
          const sr = await fetch(u, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(6500)
          });
          if (!sr.ok) throw new Error(`Segment HTTP ${sr.status}`);
          return Buffer.from(await sr.arrayBuffer());
        }));

        const fullBuf = Buffer.concat(segBuffers);
        if (fullBuf.length >= 350000) {
          if (mime.includes('mp4')) {
            const adtsBuf = convertFmp4ToAdtsAacServer(fullBuf);
            return { buffer: adtsBuf, contentType: 'audio/aac' };
          }
          return { buffer: fullBuf, contentType: mime };
        }
      }
    } catch (_) {}
  }
  return null;
}

function parseSoundCloudTrackMetaServer(tr, fallbackTitle = '', fallbackArtist = '') {
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  let t = String(tr?.title || fallbackTitle || '').trim();
  const username = String(tr?.user?.username || '').trim();
  let a = String(tr?.publisher_metadata?.artist || '').trim();
  const badTag = /remix|mix|rmx|live|directo|vivo|cover|karaoke|version|edit|audio|official|video|letra|lyrics|hd|hq|lost\s*version/i;

  if (t.includes(' - ')) {
    const parts = t.split(' - ');
    const left = parts[0].trim();
    const right = parts.slice(1).join(' - ').trim();
    if (left && right && (!a || norm(a) === norm(username))) {
      a = left;
      t = right;
    }
  }
  const parenMatch = t.match(/^(.*?)\s*[\(\[]([^)\]]+)[\)\]]\s*$/);
  if (parenMatch) {
    const baseT = parenMatch[1].trim();
    const inside = parenMatch[2].trim();
    if (baseT && inside && !badTag.test(inside) && inside.length <= 34) {
      if (!a || norm(a) === norm(username)) {
        a = inside;
      }
      t = baseT;
    }
  }
  t = t.replace(/\s*[\(\[]\s*lost\s*version\s*[\)\]]\s*$/i, '').trim();
  return {
    title: t || fallbackTitle || 'Canción',
    artist: a || username || fallbackArtist || 'Artista'
  };
}

function isUnrequestedRemixOrStrangeTrackServer(rawQuery, candidateText) {
  const nq = normalizeSearchText(rawQuery || '');
  const nc = normalizeSearchText(candidateText || '');
  const forbidden = [
    'remix', 'rmx', 'dj mix', 'classic mix', 'extended mix', 'club mix', 'vip mix',
    'hardstyle', 'bootleg', 'mashup', 'megamix', 'popurri', 'medley', 'nightcore',
    'daycore', 'slowed', 'sped up', 'reverb', '8d audio', 'bass boosted', 'karaoke',
    'tribute', 'cover', 'parody', 'ringtone', '8 bit', 'lullaby', 'instrumental version',
    'remake', 'premio lo nuestro', 'filtrado', 'karu edit', 'ai cover'
  ];
  for (const marker of forbidden) {
    if (nc.includes(marker) && !nq.includes(marker)) return true;
  }
  if (/\b(dj|edit|live|remake)\b/.test(nc) && !/\b(dj|edit|live|remake)\b/.test(nq)) return true;
  return false;
}

async function searchSoundCloudFullCandidatesServer(searchQuery, rawTitle = '', rawArtist = '') {
  const clientId = await getSoundCloudClientIdServer();
  if (!clientId) return { clientId: '', candidates: [], studioRefs: [] };

  const baseQ = String(searchQuery || `${rawTitle} ${rawArtist}`).trim();
  const effectiveTitle = String(rawTitle || baseQ).trim();
  const effectiveArtist = String(rawArtist || '').trim();
  const directPrimaryQ = (effectiveArtist && effectiveTitle && !effectiveTitle.toLowerCase().includes(effectiveArtist.toLowerCase()))
    ? `${effectiveArtist} ${effectiveTitle}`.trim()
    : baseQ;

  const allTracks = [];
  const seenIds = new Set();

  const runScSearch = async (q) => {
    try {
      const scRes = await fetch(
        `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&client_id=${encodeURIComponent(clientId)}&limit=18`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(2600)
        }
      );
      if (!scRes.ok) return;
      const scJson = await scRes.json();
      const collection = Array.isArray(scJson?.collection) ? scJson.collection : [];
      for (const tr of collection) {
        if (!tr || !tr.id || seenIds.has(tr.id)) continue;
        const durMs = Number(tr.duration || 0);
        const fullDurMs = Number(tr.full_duration || durMs);
        if (durMs < 52000 || durMs > 560000) continue;
        if (fullDurMs > 45000 && durMs <= 35000) continue;
        if (String(tr.policy || '').toUpperCase() === 'SNIP') continue;

        const validTrans = (tr?.media?.transcodings || []).filter(t =>
          t && t.url && !t.snipped &&
          (t.format?.protocol === 'progressive' || t.format?.protocol === 'hls') &&
          !String(t.format?.mime_type || '').includes('mpegurl') &&
          !String(t.preset || '').includes('cbc') &&
          !String(t.format?.protocol || '').includes('encrypted')
        );
        if (validTrans.length === 0) continue;

        if (isUnrequestedRemixOrStrangeTrackServer(baseQ, `${tr.title || ''} ${tr.user?.username || ''}`)) continue;

        const parsedMeta = parseSoundCloudTrackMetaServer(tr, effectiveTitle, effectiveArtist);
        const sc = scoreStudioAudioAuthenticityServer(baseQ, effectiveTitle, effectiveArtist, parsedMeta.title, parsedMeta.artist, '', tr.title || '');
        if (sc < 62) continue;

        seenIds.add(tr.id);
        allTracks.push({
          tr,
          score: sc,
          title: parsedMeta.title,
          artist: parsedMeta.artist,
          album: tr.publisher_metadata?.album_title || 'Pista Completa',
          durationSec: Math.round(durMs / 1000),
          thumbnail: (tr.artwork_url || tr.user?.avatar_url || '').replace('-large', '-t500x500')
        });
      }
    } catch (_) {}
  };

  // Paso directo de baja latencia (~250ms): consultar SoundCloud directamente sin esperar 3s a iTunes/Deezer
  const repairedQ = repairStrippedSpanishText(directPrimaryQ);
  await runScSearch(repairedQ);
  if (allTracks.length === 0 && directPrimaryQ !== repairedQ) {
    await runScSearch(directPrimaryQ);
  }
  if (allTracks.length === 0 && baseQ && baseQ !== directPrimaryQ) {
    await runScSearch(repairStrippedSpanishText(baseQ));
  }

  allTracks.sort((a, b) => b.score - a.score);
  return { clientId, candidates: allTracks, studioRefs: [] };
}

async function extractSoundCloudFullTrackServer(searchQuery, rawTitle = '', rawArtist = '', specificScTrackId = '', minScore = 68) {
  const clientId = await getSoundCloudClientIdServer();
  if (!clientId) return null;

  if (specificScTrackId && /^\d+$/.test(String(specificScTrackId))) {
    try {
      const trRes = await fetch(`https://api-v2.soundcloud.com/tracks/${encodeURIComponent(specificScTrackId)}?client_id=${encodeURIComponent(clientId)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(4000)
      });
      if (trRes.ok) {
        const tr = await trRes.json();
        const dl = await downloadSoundCloudTrackBufferServer(tr, clientId);
        if (dl && dl.buffer) {
          const parsedMeta = parseSoundCloudTrackMetaServer(tr, rawTitle, rawArtist);
          return {
            buffer: dl.buffer,
            contentType: dl.contentType,
            title: parsedMeta.title,
            artist: parsedMeta.artist,
            thumbnail: (tr.artwork_url || '').replace('-large', '-t500x500'),
            durationSec: Math.round(Number(tr.duration || 180000) / 1000),
            source: 'SoundCloud Full Track'
          };
        }
      }
    } catch (_) {}
  }

  const { candidates } = await searchSoundCloudFullCandidatesServer(searchQuery, rawTitle, rawArtist);
  for (const cand of candidates.slice(0, 3)) {
    if (cand.score < minScore) break;
    const dl = await downloadSoundCloudTrackBufferServer(cand.tr, clientId);
    if (dl && dl.buffer) {
      return {
        buffer: dl.buffer,
        contentType: dl.contentType,
        title: cand.title,
        artist: cand.artist,
        thumbnail: cand.thumbnail,
        durationSec: cand.durationSec,
        source: 'SoundCloud Full Audio'
      };
    }
  }
  return null;
}

async function resolveSoundCloudProgressiveStreamServer(searchQuery, rawTitle = '', rawArtist = '', specificScTrackId = '', minScore = 68) {
  const clientId = await getSoundCloudClientIdServer();
  if (!clientId) return null;

  const tryPickProgressiveUrl = async (tr, fallbackMeta = {}) => {
    const transcodings = Array.isArray(tr?.media?.transcodings) ? tr.media.transcodings : [];
    const progList = transcodings.filter(t => {
      if (!t || !t.url || t.snipped) return false;
      const proto = String(t?.format?.protocol || '');
      const mime = String(t?.format?.mime_type || '');
      if (proto !== 'progressive' || mime.includes('mpegurl')) return false;
      if (String(t.preset || '').includes('cbc') || proto.includes('encrypted')) return false;
      return true;
    }).sort((a, b) => {
      const aMpeg = String(a?.format?.mime_type || '').includes('mpeg') ? 1 : 0;
      const bMpeg = String(b?.format?.mime_type || '').includes('mpeg') ? 1 : 0;
      return bMpeg - aMpeg;
    });
    for (const trans of progList) {
      try {
        const mime = String(trans?.format?.mime_type || 'audio/mpeg').split(';')[0].trim() || 'audio/mpeg';
        const sep = trans.url.includes('?') ? '&' : '?';
        const resolveUrl = `${trans.url}${sep}client_id=${encodeURIComponent(clientId)}&track_authorization=${encodeURIComponent(tr.track_authorization || '')}`;
        const r = await fetch(resolveUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3500) });
        if (!r.ok) continue;
        const streamObj = await r.json();
        if (streamObj && streamObj.url && /^https?:\/\//i.test(streamObj.url)) {
          const parsedMeta = parseSoundCloudTrackMetaServer(tr, rawTitle, rawArtist);
          return {
            streamUrl: streamObj.url,
            contentType: mime,
            title: fallbackMeta.title || parsedMeta.title,
            artist: fallbackMeta.artist || parsedMeta.artist,
            thumbnail: fallbackMeta.thumbnail || (tr.artwork_url || tr.user?.avatar_url || '').replace('-large', '-t500x500'),
            durationSec: fallbackMeta.durationSec || Math.round(Number(tr.duration || 180000) / 1000),
            source: 'SoundCloud Live Stream'
          };
        }
      } catch (_) {}
    }
    return null;
  };

  if (specificScTrackId && /^\d+$/.test(String(specificScTrackId))) {
    try {
      const trRes = await fetch(`https://api-v2.soundcloud.com/tracks/${encodeURIComponent(specificScTrackId)}?client_id=${encodeURIComponent(clientId)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3500)
      });
      if (trRes.ok) {
        const tr = await trRes.json();
        const prog = await tryPickProgressiveUrl(tr);
        if (prog) return prog;
      }
    } catch (_) {}
  }

  const { candidates } = await searchSoundCloudFullCandidatesServer(searchQuery, rawTitle, rawArtist);
  for (const cand of candidates.slice(0, 3)) {
    if (cand.score < minScore) break;
    const prog = await tryPickProgressiveUrl(cand.tr, cand);
    if (prog) return prog;
  }
  return null;
}

async function tryExtractYouTubeStream(videoId) {
  if (!videoId) return null;

  if (YOUTUBE_FULL_MP3_LRU.has(videoId)) {
    const cached = YOUTUBE_FULL_MP3_LRU.get(videoId);
    if (cached && cached.buffer && cached.buffer.length >= 120000) return cached;
  }

  const pipedInstances = [
    `https://pipedapi.kavin.rocks/streams/${encodeURIComponent(videoId)}`,
    `https://api.piped.private.coffee/streams/${encodeURIComponent(videoId)}`,
    `https://pipedapi.ducks.party/streams/${encodeURIComponent(videoId)}`,
    `https://pipedapi.smnz.de/streams/${encodeURIComponent(videoId)}`,
    `https://pipedapi.adminforge.de/streams/${encodeURIComponent(videoId)}`
  ];
  const invidiousInstances = [
    `https://inv.tux.pizza/api/v1/videos/${encodeURIComponent(videoId)}`,
    `https://invidious.nerdvpn.de/api/v1/videos/${encodeURIComponent(videoId)}`,
    `https://yewtu.be/api/v1/videos/${encodeURIComponent(videoId)}`,
    `https://inv.nadeko.net/api/v1/videos/${encodeURIComponent(videoId)}`,
    `https://invidious.privacyredirect.com/api/v1/videos/${encodeURIComponent(videoId)}`
  ];

  const notubePromise = (async () => {
    const notubeMp3 = await extractYouTubeFullAudioViaNotubeServer(videoId);
    if (notubeMp3 && notubeMp3.buffer && notubeMp3.buffer.length >= 120000) return notubeMp3;
    throw new Error('Notube empty');
  })();

  const pipedPromise = Promise.any(pipedInstances.map(async (apiUrl) => {
    const r = await fetch(apiUrl, { signal: AbortSignal.timeout(3800) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const streams = Array.isArray(j?.audioStreams) ? j.audioStreams : [];
    const sorted = streams
      .filter(s => s && s.url && (!s.mimeType || s.mimeType.includes('audio')))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    if (!sorted.length) throw new Error('No audioStreams');
    const dl = await fetchAudioBufferSafe(sorted[0].url, 6500);
    if (!dl || !dl.buffer || dl.buffer.length < 120000) throw new Error('Audio stream too short');
    return {
      ...dl,
      title: j.title || '',
      artist: (j.uploader || '').replace(/ - Topic$/i, '').trim(),
      durationSec: Number(j.duration) || 0,
      thumbnail: j.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      source: 'YouTube Audio Stream'
    };
  }));

  const invidiousPromise = Promise.any(invidiousInstances.map(async (apiUrl) => {
    const r = await fetch(apiUrl, { signal: AbortSignal.timeout(3800) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const adaptive = Array.isArray(j?.adaptiveFormats) ? j.adaptiveFormats : [];
    const audioFmts = adaptive
      .filter(f => f && f.url && String(f.type || '').startsWith('audio/'))
      .sort((a, b) => (parseInt(b.bitrate, 10) || 0) - (parseInt(a.bitrate, 10) || 0));
    if (!audioFmts.length) throw new Error('No adaptive audio');
    const dl = await fetchAudioBufferSafe(audioFmts[0].url, 6500);
    if (!dl || !dl.buffer || dl.buffer.length < 120000) throw new Error('Adaptive audio too short');
    return {
      ...dl,
      title: j.title || '',
      artist: (j.author || '').replace(/ - Topic$/i, '').trim(),
      durationSec: Number(j.lengthSeconds) || 0,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      source: 'YouTube Direct Audio'
    };
  }));

  try {
    const winner = await Promise.any([notubePromise, pipedPromise, invidiousPromise]);
    if (winner && winner.buffer) {
      if (!YOUTUBE_FULL_MP3_LRU.has(videoId)) {
        if (YOUTUBE_FULL_MP3_LRU.size >= YOUTUBE_FULL_MP3_LRU_MAX) {
          const oldest = YOUTUBE_FULL_MP3_LRU.keys().next().value;
          if (oldest) YOUTUBE_FULL_MP3_LRU.delete(oldest);
        }
        YOUTUBE_FULL_MP3_LRU.set(videoId, winner);
      }
      return winner;
    }
  } catch (_) {}

  return null;
}

const instantPreviewMemoryCache = new Map();

function repairStrippedSpanishText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\bcorazn\b/gi, 'corazón')
    .replace(/\bvivirs\b/gi, 'vivirás')
    .replace(/\btarzn\b/gi, 'tarzán')
    .replace(/\bfernndez\b/gi, 'fernández')
    .replace(/\baerolneas\b/gi, 'aerolíneas')
    .replace(/\bhernndez\b/gi, 'hernández')
    .replace(/\bgmez\b/gi, 'gómez')
    .replace(/\blpez\b/gi, 'lópez')
    .replace(/\bmartnez\b/gi, 'martínez')
    .replace(/\brodrguez\b/gi, 'rodríguez')
    .replace(/\bgonzlez\b/gi, 'gonzález')
    .replace(/\bprez\b/gi, 'pérez')
    .replace(/\bsnchez\b/gi, 'sánchez')
    .replace(/\bramrez\b/gi, 'ramírez')
    .replace(/\bmsica\b/gi, 'música')
    .replace(/\bcancin\b/gi, 'canción')
    .replace(/\bpasin\b/gi, 'pasión')
    .replace(/\bilusin\b/gi, 'ilusión')
    .replace(/\brazn\b/gi, 'razón')
    .replace(/\bperdname\b/gi, 'perdóname')
    .replace(/\bslo\b/gi, 'solo')
    .replace(/\bms\b/gi, 'más')
    .replace(/\bqu\b/gi, 'que')
    .replace(/\bt\b/gi, 'tú')
    .replace(/\bm\b/gi, 'mí')
    .replace(/\bbulera\b/gi, 'bulería')
    .replace(/\bjardn\b/gi, 'jardín')
    .replace(/\bdespecha\b/gi, 'despechá')
    .replace(/\bmorenama\b/gi, 'morenamía')
    .replace(/\blobohombre\b/gi, 'lobo-hombre')
    .replace(/\bpars\b/gi, 'parís')
    .replace(/\bjos\b/gi, 'josé')
    .replace(/\bdel ro\b/gi, 'del río')
    .replace(/\bdestruccin\b/gi, 'destrucción')
    .replace(/\bautnticos\b/gi, 'auténticos')
    .replace(/\bfantstica\b/gi, 'fantástica')
    .replace(/\bintntalo\b/gi, 'inténtalo')
    .replace(/\bslvame\b/gi, 'sálvame')
    .replace(/\babrzame\b/gi, 'abrázame')
    .replace(/\batrvete\b/gi, 'atrévete')
    .replace(/\bparchs\b/gi, 'parchís')
    .replace(/\bcafe\b/gi, 'café')
    .replace(/\bbose\b/gi, 'bosé');
}

app.get('/api/v1/audio/notube_dl', async (req, res) => {
  const targetUrl = String(req.query.url || '').trim();
  if (!/^https:\/\/s\d+\.notube\.(?:im|net)\/download\.php\?token=[^"'\s>]+&key=[A-Za-z0-9]+$/i.test(targetUrl)) {
    return res.status(400).end();
  }
  try {
    const dlRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://notube.im/'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(24000)
    });
    if (!dlRes.ok) return res.status(502).end();
    const ct = String(dlRes.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html') || ct.includes('application/json')) {
      return res.status(404).end();
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    if (dlRes.body && typeof dlRes.body.getReader === 'function') {
      const reader = dlRes.body.getReader();
      req.on('close', () => { try { reader.cancel(); } catch (_) {} });
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.byteLength > 0) {
          res.write(Buffer.from(value.buffer, value.byteOffset, value.byteLength));
        }
      }
      return res.end();
    } else {
      const ab = await dlRes.arrayBuffer();
      return res.send(Buffer.from(ab));
    }
  } catch (_) {
    if (!res.headersSent) return res.status(502).end();
    try { res.end(); } catch (__) {}
  }
});

app.get('/api/v1/audio/stream_preview', async (req, res) => {
  const videoId = String(req.query.videoId || '').trim();
  if (!videoId || !/^[A-Za-z0-9_-]{8,15}$/.test(videoId)) {
    return res.status(400).end();
  }

  // 1. Si ya está en la caché RAM del servidor, servir directamente desde el estribillo (~28% del MP3) en < 5ms
  if (YOUTUBE_FULL_MP3_LRU.has(videoId)) {
    const cached = YOUTUBE_FULL_MP3_LRU.get(videoId);
    if (cached && cached.buffer && cached.buffer.length >= 120000) {
      const sliced = sliceMp3AtChorusServer(cached.buffer, 0.28);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', String(sliced.length));
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(sliced);
    }
  }

  // 2. Iniciar o unirse a la extracción en curso y retransmitir los fragmentos MP3 en vivo en cuanto haya >= 36 KB
  extractYouTubeFullAudioViaNotubeServer(videoId).catch(() => {});
  const state = YOUTUBE_STREAM_STATES.get(videoId);
  if (!state) {
    return res.status(502).end();
  }

  let headersFlushed = false;
  let closed = false;

  const flushInitialAndWrite = (newChunk) => {
    if (closed) return;
    if (!headersFlushed) {
      if (state.totalBytes < 20480 && !state.done) return;
      if (state.error || (state.done && state.totalBytes < 20480)) {
        closed = true;
        if (!res.headersSent) res.status(502).end();
        return;
      }
      headersFlushed = true;
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-store');
      for (const existing of state.chunks) {
        try { res.write(existing); } catch (_) {}
      }
      if (state.done) {
        closed = true;
        try { res.end(); } catch (_) {}
      }
      return;
    }
    if (newChunk && newChunk.length > 0) {
      try { res.write(newChunk); } catch (_) {}
    }
  };

  const listener = (chunk, isDone, isError) => {
    if (closed) return;
    if (isError && !headersFlushed) {
      closed = true;
      state.listeners.delete(listener);
      if (!res.headersSent) res.status(502).end();
      return;
    }
    flushInitialAndWrite(chunk);
    if (isDone && !closed) {
      closed = true;
      state.listeners.delete(listener);
      try { res.end(); } catch (_) {}
    }
  };

  state.listeners.add(listener);
  req.on('close', () => {
    closed = true;
    state.listeners.delete(listener);
  });

  if (state.totalBytes >= 36000 || state.done) {
    listener(null, state.done, state.error);
  }
});

app.get('/api/v1/audio/instant_preview', async (req, res) => {
  const rawTitle = String(req.query.title || '').trim();
  const rawArtist = String(req.query.artist || '').trim();
  const rawVideoId = String(req.query.videoId || '').trim();
  const isPrewarm = String(req.query.prewarm || '') === '1';

  if (rawVideoId && YOUTUBE_FULL_MP3_LRU.has(rawVideoId)) {
    return res.json({
      previewUrl: `/api/v1/audio/stream_preview?videoId=${encodeURIComponent(rawVideoId)}`,
      artworkUrl: `https://i.ytimg.com/vi/${rawVideoId}/hqdefault.jpg`,
      source: 'youtube_ram_cache'
    });
  }

  if (!rawTitle && !rawArtist) return res.json({ previewUrl: null, artworkUrl: null, noCdn: true });

  const cleanTitle = repairStrippedSpanishText(
    rawTitle
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\([^)]*(?:official|video|audio|lyric|live|cover|remix|karaoke|hd|4k|en directo|directo)[^)]*\)/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
  const cleanArtist = repairStrippedSpanishText(
    rawArtist
      .replace(/\b(YouTube|Custom|VEVO|Topic|Auto-generated|Charts|Chart|UltraStar)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );

  const cacheKey = `${cleanTitle.toLowerCase()}|${cleanArtist.toLowerCase()}`;
  const cached = instantPreviewMemoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < 30 * 60 * 1000) {
    if (cached.data && cached.data.noCdn && rawVideoId) {
      if (isPrewarm) extractYouTubeFullAudioViaNotubeServer(rawVideoId).catch(() => {});
      return res.json({
        ...cached.data,
        streamPreviewUrl: `/api/v1/audio/stream_preview?videoId=${encodeURIComponent(rawVideoId)}`
      });
    }
    return res.json(cached.data);
  }

  const STOPWORDS = new Set(['del', 'las', 'los', 'una', 'uno', 'unos', 'unas', 'por', 'con', 'para', 'sin', 'the', 'and', 'for']);
  const normWords = (s) => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  const titleWords = normWords(cleanTitle);
  const sigTitleWords = titleWords.filter(w => !STOPWORDS.has(w));
  const effTitleWords = sigTitleWords.length > 0 ? sigTitleWords : titleWords;
  const artistWords = normWords(cleanArtist).filter(w => !STOPWORDS.has(w));

  const scoreCandidate = (candTitle, candArtist) => {
    const tNormWords = normWords(candTitle);
    const aNormWords = normWords(candArtist);
    const tNorm = tNormWords.join(' ');
    const aNorm = aNormWords.join(' ');

    let tHits = 0;
    for (const w of effTitleWords) {
      if (tNormWords.includes(w) || (w.length >= 5 && tNorm.includes(w))) tHits++;
    }
    const minRequiredTitleHits = effTitleWords.length >= 2 ? Math.ceil(effTitleWords.length * 0.65) : 1;
    if (effTitleWords.length > 0 && tHits < minRequiredTitleHits) return -1;

    let aHits = 0;
    for (const w of artistWords) {
      if (aNormWords.includes(w) || tNormWords.includes(w) || (w.length >= 5 && aNorm.includes(w))) aHits++;
    }
    if (artistWords.length > 0 && aHits === 0) return -1;

    let score = tHits * 30 + aHits * 25;
    if (/\b(karaoke|tribute|8-bit|ringtone|instrumental)\b/i.test(`${candTitle} ${candArtist}`)) score -= 45;
    return score;
  };

  const fetchDeezer = async (queryStr) => {
    try {
      const resp = await axios.get(`https://api.deezer.com/search?q=${encodeURIComponent(queryStr)}&limit=6`, {
        timeout: 1350,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const list = (resp.data && Array.isArray(resp.data.data)) ? resp.data.data : [];
      let best = null;
      let bestScore = 35;
      for (const item of list) {
        if (!item || !item.preview) continue;
        const sc = scoreCandidate(item.title || item.title_short || '', (item.artist && item.artist.name) || '');
        if (sc > bestScore) {
          bestScore = sc;
          const cover600 = (item.album && (item.album.cover_big || item.album.cover_xl || item.album.cover_medium || item.album.cover)) || null;
          best = {
            previewUrl: item.preview,
            artworkUrl: cover600,
            artworkUrl600: cover600,
            title: item.title_short || item.title || cleanTitle,
            artist: (item.artist && item.artist.name) || cleanArtist,
            artistId: item.artist && item.artist.id ? item.artist.id : null,
            album: (item.album && item.album.title) || '',
            durationSec: Number(item.duration) || 180,
            source: 'deezer'
          };
        }
      }
      return best;
    } catch (_) {
      return null;
    }
  };

  const fetchItunes = async (queryStr) => {
    try {
      const resp = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(queryStr)}&media=music&entity=song&limit=6`, {
        timeout: 1350,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const list = (resp.data && Array.isArray(resp.data.results)) ? resp.data.results : [];
      let best = null;
      let bestScore = 35;
      for (const item of list) {
        if (!item || !item.previewUrl) continue;
        const sc = scoreCandidate(item.trackName || '', item.artistName || '');
        if (sc > bestScore) {
          bestScore = sc;
          const art600 = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : null;
          const relYear = item.releaseDate ? parseInt(String(item.releaseDate).slice(0, 4), 10) : null;
          best = {
            previewUrl: item.previewUrl,
            artworkUrl: art600,
            artworkUrl600: art600,
            title: item.trackName || cleanTitle,
            artist: item.artistName || cleanArtist,
            album: item.collectionName || '',
            genre: item.primaryGenreName || '',
            releaseDate: item.releaseDate || '',
            releaseYear: Number.isFinite(relYear) ? relYear : null,
            durationSec: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 180,
            source: 'itunes'
          };
        }
      }
      return best;
    } catch (_) {
      return null;
    }
  };

  try {
    const fullQ = `${cleanTitle} ${cleanArtist}`.trim();
    const [dzFull, itFull] = await Promise.all([
      fetchDeezer(fullQ),
      fetchItunes(fullQ)
    ]);
    const result = (itFull && dzFull)
      ? {
          ...dzFull,
          ...itFull,
          previewUrl: itFull.previewUrl || dzFull.previewUrl,
          artworkUrl: itFull.artworkUrl600 || dzFull.artworkUrl600 || itFull.artworkUrl || dzFull.artworkUrl,
          artworkUrl600: itFull.artworkUrl600 || dzFull.artworkUrl600,
          artistId: dzFull.artistId || null
        }
      : (itFull || dzFull);
    if (result && result.previewUrl) {
      instantPreviewMemoryCache.set(cacheKey, { ts: Date.now(), data: result });
      return res.json(result);
    }

    const negPayload = {
      previewUrl: null,
      artworkUrl: null,
      noCdn: true,
      streamPreviewUrl: rawVideoId ? `/api/v1/audio/stream_preview?videoId=${encodeURIComponent(rawVideoId)}` : null
    };
    instantPreviewMemoryCache.set(cacheKey, { ts: Date.now(), data: { previewUrl: null, artworkUrl: null, noCdn: true } });

    if (rawVideoId && isPrewarm) {
      extractYouTubeFullAudioViaNotubeServer(rawVideoId).catch(() => {});
    }
    return res.json(negPayload);
  } catch (_) {
    return res.json({
      previewUrl: null,
      artworkUrl: null,
      noCdn: true,
      streamPreviewUrl: rawVideoId ? `/api/v1/audio/stream_preview?videoId=${encodeURIComponent(rawVideoId)}` : null
    });
  }
});

// ==========================================
// EXTERNAL MUSIC GRAPH SERVICE (iTunes, Deezer, MusicBrainz / ListenBrainz, Last.fm)
// ==========================================
const musicGraphSimilarCache = new Map();

app.get('/api/v1/music-graph/similar', async (req, res) => {
  const rawTitle = String(req.query.title || '').trim();
  const rawArtist = String(req.query.artist || '').trim();
  if (!rawTitle && !rawArtist) return res.json({ similarTracks: [], similarArtists: [] });

  const cacheKey = `${rawTitle.toLowerCase()}__${rawArtist.toLowerCase()}`;
  const cached = musicGraphSimilarCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < 30 * 60 * 1000) {
    return res.json(cached.data);
  }

  const similarTracks = [];
  const similarArtists = [];
  const seenTracks = new Set();

  const pushTrack = (tr) => {
    if (!tr || !tr.title) return;
    const k = `${String(tr.title).toLowerCase()}__${String(tr.artist || '').toLowerCase()}`;
    if (seenTracks.has(k)) return;
    seenTracks.add(k);
    similarTracks.push(tr);
  };

  try {
    // 1. Deezer Search -> Artist Related -> Top Tracks with 600x600 covers & instant 30s previews
    const dzTask = (async () => {
      try {
        const q = `${rawTitle} ${rawArtist}`.trim();
        const sResp = await axios.get(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5`, { timeout: 2200 });
        const hits = (sResp.data && Array.isArray(sResp.data.data)) ? sResp.data.data : [];
        const primaryArtistId = hits[0]?.artist?.id;
        if (primaryArtistId) {
          const [relResp, topResp] = await Promise.allSettled([
            axios.get(`https://api.deezer.com/artist/${primaryArtistId}/related?limit=8`, { timeout: 2000 }),
            axios.get(`https://api.deezer.com/artist/${primaryArtistId}/top?limit=6`, { timeout: 2000 })
          ]);
          if (topResp.status === 'fulfilled' && Array.isArray(topResp.value.data?.data)) {
            for (const t of topResp.value.data.data) {
              pushTrack({
                title: t.title_short || t.title,
                artist: t.artist?.name || rawArtist,
                previewUrl: t.preview || '',
                artworkUrl600: t.album?.cover_big || t.album?.cover_xl || t.album?.cover_medium || '',
                durationSec: Number(t.duration) || 180,
                source: 'deezer_artist_top'
              });
            }
          }
          if (relResp.status === 'fulfilled' && Array.isArray(relResp.value.data?.data)) {
            const relArtists = relResp.value.data.data.slice(0, 6);
            for (const ra of relArtists) {
              if (ra && ra.name) similarArtists.push({ name: ra.name, picture: ra.picture_big || ra.picture_medium || '' });
            }
            const relTopPromises = relArtists.slice(0, 3).map(ra =>
              axios.get(`https://api.deezer.com/artist/${ra.id}/top?limit=3`, { timeout: 1800 }).catch(() => null)
            );
            const relTopResults = await Promise.all(relTopPromises);
            for (const rtr of relTopResults) {
              const arr = rtr?.data?.data;
              if (Array.isArray(arr)) {
                for (const t of arr) {
                  pushTrack({
                    title: t.title_short || t.title,
                    artist: t.artist?.name || '',
                    previewUrl: t.preview || '',
                    artworkUrl600: t.album?.cover_big || t.album?.cover_xl || t.album?.cover_medium || '',
                    durationSec: Number(t.duration) || 180,
                    source: 'deezer_related_graph'
                  });
                }
              }
            }
          }
        }
      } catch (_) {}
    })();

    // 2. MusicBrainz / ListenBrainz Recording & Tag Graph
    const mbTask = (async () => {
      try {
        const mbQuery = rawArtist
          ? `recording:"${rawTitle}" AND artist:"${rawArtist}"`
          : `recording:"${rawTitle}"`;
        const mbResp = await axios.get(`https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(mbQuery)}&limit=4&fmt=json`, {
          timeout: 2200,
          headers: { 'User-Agent': 'PianoCommunity/5.5 (https://github.com/Bruala33/renacer)' }
        });
        const recs = mbResp.data?.recordings || [];
        const tags = [];
        for (const r of recs) {
          if (Array.isArray(r.tags)) {
            for (const tg of r.tags) {
              if (tg && tg.name && !tags.includes(tg.name)) tags.push(tg.name);
            }
          }
        }
        if (tags.length > 0) {
          const itTagResp = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(tags[0] + ' ' + (rawArtist || ''))}&media=music&entity=song&limit=8`, { timeout: 1800 });
          const itList = itTagResp.data?.results || [];
          for (const item of itList) {
            if (!item || !item.previewUrl) continue;
            pushTrack({
              title: item.trackName,
              artist: item.artistName,
              previewUrl: item.previewUrl,
              artworkUrl600: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
              genre: item.primaryGenreName || tags[0] || '',
              releaseYear: item.releaseDate ? parseInt(String(item.releaseDate).slice(0, 4), 10) : null,
              durationSec: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 180,
              source: 'musicbrainz_itunes_graph'
            });
          }
        }
      } catch (_) {}
    })();

    // 3. Last.fm Public Audioscrobbler Graph (if LASTFM_API_KEY configured or public fallback)
    const lfmTask = (async () => {
      try {
        const lfmKey = process.env.LASTFM_API_KEY || 'b25b959554ed76058ac220b7b2e0a026';
        const lfmUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${encodeURIComponent(rawArtist)}&track=${encodeURIComponent(rawTitle)}&api_key=${lfmKey}&format=json&limit=10`;
        const lfmResp = await axios.get(lfmUrl, { timeout: 2000 });
        const lfmTracks = lfmResp.data?.similartracks?.track;
        if (Array.isArray(lfmTracks)) {
          for (const lt of lfmTracks.slice(0, 8)) {
            if (!lt || !lt.name) continue;
            pushTrack({
              title: lt.name,
              artist: lt.artist?.name || rawArtist,
              previewUrl: '',
              artworkUrl600: '',
              matchScore: Number(lt.match) || 0.8,
              source: 'lastfm_similar'
            });
          }
        }
      } catch (_) {}
    })();

    await Promise.allSettled([dzTask, mbTask, lfmTask]);

    const payload = {
      similarTracks: similarTracks.slice(0, 24),
      similarArtists: similarArtists.slice(0, 12)
    };
    if (similarTracks.length > 0) {
      musicGraphSimilarCache.set(cacheKey, { ts: Date.now(), data: payload });
    }
    return res.json(payload);
  } catch (err) {
    return res.json({ similarTracks: [], similarArtists: [] });
  }
});

const audioCandidatesMemoryCache = new Map();
app.get('/api/v1/audio/candidates', async (req, res) => {
  const rawTitle = String(req.query.title || '').trim();
  const rawArtist = String(req.query.artist || '').trim();
  const rawQ = String(req.query.q || `${rawTitle} ${rawArtist}`).trim();
  const expectedDur = Math.round(parseFloat(String(req.query.duration || req.query.durationSec || '0')) || 0);
  if (!rawQ) return res.json({ candidates: [] });

  const cKey = `${rawQ.toLowerCase()}|${expectedDur > 35 ? expectedDur : 0}`;
  const cachedCands = audioCandidatesMemoryCache.get(cKey);
  if (cachedCands && (Date.now() - cachedCands.ts) < 15 * 60 * 1000) {
    return res.json({ candidates: cachedCands.data });
  }

  try {
    const ytCands = await searchYouTubeCandidatesServer(rawQ, rawTitle, rawArtist, expectedDur);
    const combined = [];
    const seenVideoIds = new Set();

    for (const y of ytCands.slice(0, 30)) {
      if (!y.videoId || seenVideoIds.has(y.videoId)) continue;
      seenVideoIds.add(y.videoId);

      const durSec = y.durationSec || 180;
      const durMin = Math.floor(durSec / 60);
      const durRem = String(durSec % 60).padStart(2, '0');
      const extractPath = `/api/v1/audio/extract?videoId=${encodeURIComponent(y.videoId)}&title=${encodeURIComponent(y.title)}&artist=${encodeURIComponent(y.artist)}`;

      combined.push({
        uid: `yt_${y.videoId}`,
        videoId: y.videoId,
        scTrackId: '',
        title: y.title,
        artist: y.artist,
        album: `YouTube (${durMin}:${durRem})`,
        durationSec: durSec,
        isFullTrack: true,
        isPreviewOnly: false,
        previewUrl: `yt_full://${y.videoId}`,
        directFetchUrl: extractPath,
        mimeType: 'audio/mpeg',
        thumbnail: y.thumbnail || `https://i.ytimg.com/vi/${y.videoId}/hqdefault.jpg`,
        sourceName: 'YouTube Completo',
        authenticityScore: y.authScore || 85
      });
    }

    const finalList = combined.slice(0, 30);
    if (finalList.length > 0) {
      if (audioCandidatesMemoryCache.size > 200) {
        const oldest = audioCandidatesMemoryCache.keys().next().value;
        if (oldest) audioCandidatesMemoryCache.delete(oldest);
      }
      audioCandidatesMemoryCache.set(cKey, { ts: Date.now(), data: finalList });
    }
    return res.json({ candidates: finalList });
  } catch (_) {
    return res.json({ candidates: [] });
  }
});

const EXTRACTED_AUDIO_BUFFER_CACHE = new Map();
const MAX_EXTRACTED_BUFFER_CACHE = 40;

function sendAudioBufferWithRange(req, res, cacheKey, buffer, contentType = 'audio/mpeg', extraHeaders = {}) {
  if (cacheKey && buffer && buffer.length >= 60000) {
    if (EXTRACTED_AUDIO_BUFFER_CACHE.has(cacheKey)) {
      EXTRACTED_AUDIO_BUFFER_CACHE.delete(cacheKey);
    }
    EXTRACTED_AUDIO_BUFFER_CACHE.set(cacheKey, {
      buffer,
      contentType: contentType || 'audio/mpeg',
      extraHeaders: extraHeaders || {}
    });
    while (EXTRACTED_AUDIO_BUFFER_CACHE.size > MAX_EXTRACTED_BUFFER_CACHE) {
      const oldestKey = EXTRACTED_AUDIO_BUFFER_CACHE.keys().next().value;
      if (oldestKey) EXTRACTED_AUDIO_BUFFER_CACHE.delete(oldestKey);
    }
  }

  const total = buffer.length;
  res.setHeader('Content-Type', contentType || 'audio/mpeg');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Access-Control-Expose-Headers', 'X-Song-Title, X-Song-Artist, X-Song-Cover, X-Audio-Source, X-Video-Id, X-Audio-Duration, Content-Range, Accept-Ranges');
  Object.entries(extraHeaders || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) res.setHeader(k, String(v));
  });

  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    const parts = String(rangeHeader).replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? Math.min(parseInt(parts[1], 10), total - 1) : total - 1;
    if (!Number.isNaN(start) && start >= 0 && start < total && end >= start) {
      const chunkSize = (end - start) + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', String(chunkSize));
      return res.send(buffer.subarray(start, end + 1));
    }
  }

  res.status(200);
  res.setHeader('Content-Length', String(total));
  return res.send(buffer);
}

app.get('/api/v1/search/youtube', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const title = String(req.query.title || '').trim();
    const artist = String(req.query.artist || '').trim();
    const queryStr = q || `${artist} ${title}`.trim();
    if (!queryStr) return res.json({ results: [] });

    const ytList = await searchYouTubeCandidatesServer(queryStr, title, artist, 0).catch(() => []);
    const results = (ytList || []).map(c => ({
      id: c.videoId,
      videoId: c.videoId,
      title: c.title || title || queryStr,
      artist: c.artist || artist || '',
      duration: c.durationSec || 0,
      cover: c.thumbnail || (c.videoId ? `https://i.ytimg.com/vi/${c.videoId}/hqdefault.jpg` : '')
    }));
    return res.json({ results });
  } catch (_) {
    return res.json({ results: [] });
  }
});

app.get('/api/v1/video/resolve', async (req, res) => {
  try {
    let title = repairStrippedSpanishText(String(req.query.title || '').trim());
    let artist = repairStrippedSpanishText(String(req.query.artist || '').replace(/\s*-\s*topic$/i, '').replace(/vevo$/i, '').trim());
    if (title.includes(' - ')) {
      const dashParts = title.split(' - ');
      const left = dashParts[0].trim();
      const right = dashParts.slice(1).join(' - ').trim();
      const rightIsTag = /^(?:official|oficial|video|videoclip|audio|lyric|lyrics|letra|hd|4k|live|en vivo|remaster|visualizer)/i.test(right);
      const artGenericOrMatch = !artist ||
        /^(?:youtube|ultimoscruzados|unknown|artista|music)$/i.test(artist) ||
        artist.toLowerCase().includes(left.toLowerCase()) ||
        left.toLowerCase().includes(artist.toLowerCase());
      if (left && right && !rightIsTag && artGenericOrMatch) {
        artist = left;
        title = right;
      }
    }
    const q = repairStrippedSpanishText(String(req.query.q || `${artist} ${title}`).trim());
    const expectedDur = parseInt(String(req.query.durationSec || req.query.duration || '0'), 10) || 0;
    if (!q) return res.json({ ok: false });

    const cleanTitle = title.replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim() || title;
    const cleanArtist = artist.replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim() || artist;
    const lookupTerm = `${cleanArtist} ${cleanTitle}`.trim() || q;

    const [itunesVideoRes, ytList] = await Promise.all([
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(lookupTerm)}&entity=musicVideo&limit=6`, {
        signal: AbortSignal.timeout(4500)
      }).then(r => (r.ok ? r.json() : null)).catch(() => null),
      searchYouTubeVideoclipCandidatesServer(lookupTerm, cleanTitle, cleanArtist, expectedDur).catch(() => [])
    ]);

    let videoStreamUrl = '';
    let artworkUrl = '';
    if (itunesVideoRes && Array.isArray(itunesVideoRes.results)) {
      const mvList = itunesVideoRes.results.filter(r => r && r.previewUrl && /\.(m4v|mp4)/i.test(r.previewUrl));
      if (mvList.length > 0) {
        const normArt = cleanArtist.toLowerCase();
        const normTit = cleanTitle.toLowerCase();
        const bestMv = mvList.find(r => {
          const rArt = String(r.artistName || '').toLowerCase();
          const rTit = String(r.trackName || '').toLowerCase();
          return (!normArt || rArt.includes(normArt) || normArt.includes(rArt)) &&
                 (!normTit || rTit.includes(normTit) || normTit.includes(rTit));
        }) || mvList.find(r => !normArt || String(r.artistName || '').toLowerCase().includes(normArt)) || mvList[0];

        if (bestMv) {
          videoStreamUrl = bestMv.previewUrl;
          artworkUrl = String(bestMv.artworkUrl100 || '').replace('100x100bb', '600x600bb');
        }
      }
    }

    const topYt = (Array.isArray(ytList) && ytList.length > 0)
      ? (ytList.find(c => c && c.isMusicVideoCandidate) || ytList[0])
      : null;
    return res.json({
      ok: Boolean(videoStreamUrl || (topYt && topYt.videoId)),
      videoStreamUrl: videoStreamUrl || '',
      videoId: topYt ? topYt.videoId : '',
      isMusicVideo: Boolean(topYt && topYt.isMusicVideoCandidate),
      bestScore: topYt ? Number(topYt.authScore || 0) : 0,
      artworkUrl: artworkUrl || (topYt && topYt.videoId ? `https://i.ytimg.com/vi/${topYt.videoId}/hqdefault.jpg` : ''),
      candidates: (ytList || []).map(c => c.videoId).filter(Boolean)
    });
  } catch (_) {
    return res.json({ ok: false });
  }
});

const INFLIGHT_EXTRACT_REQUESTS = new Map();

// ==========================================
// 4B-bis. STREAMING EN VIVO: el servidor reenvía el audio al cliente MIENTRAS lo descarga de la fuente
// (el cliente empieza a sonar con los primeros bytes) y lo guarda en caché al terminar.
// ==========================================
const LIVE_AUDIO_STREAMS = new Map();
const LIVE_START_PROMISES = new Map();
const LIVE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function resolveYouTubeDirectAudioUrl(videoId) {
  if (!videoId) return null;
  const id = encodeURIComponent(videoId);
  const piped = [
    `https://pipedapi.kavin.rocks/streams/${id}`,
    `https://api.piped.private.coffee/streams/${id}`,
    `https://pipedapi.ducks.party/streams/${id}`,
    `https://pipedapi.smnz.de/streams/${id}`,
    `https://pipedapi.adminforge.de/streams/${id}`
  ].map(async (apiUrl) => {
    const r = await fetch(apiUrl, { signal: AbortSignal.timeout(3500) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const streams = (Array.isArray(j?.audioStreams) ? j.audioStreams : [])
      .filter(x => x && x.url && (!x.mimeType || x.mimeType.includes('audio')))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    if (!streams.length) throw new Error('No audioStreams');
    return { url: streams[0].url, contentType: streams[0].mimeType || 'audio/webm', durationSec: Number(j.duration) || 0, title: j.title || '' };
  });
  const invidious = [
    `https://inv.tux.pizza/api/v1/videos/${id}`,
    `https://invidious.nerdvpn.de/api/v1/videos/${id}`,
    `https://yewtu.be/api/v1/videos/${id}`,
    `https://inv.nadeko.net/api/v1/videos/${id}`,
    `https://invidious.privacyredirect.com/api/v1/videos/${id}`
  ].map(async (apiUrl) => {
    const r = await fetch(apiUrl, { signal: AbortSignal.timeout(3500) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const fmts = (Array.isArray(j?.adaptiveFormats) ? j.adaptiveFormats : [])
      .filter(f => f && f.url && String(f.type || '').startsWith('audio/'))
      .sort((a, b) => (parseInt(b.bitrate, 10) || 0) - (parseInt(a.bitrate, 10) || 0));
    if (!fmts.length) throw new Error('No adaptive audio');
    return { url: fmts[0].url, contentType: String(fmts[0].type || 'audio/webm').split(';')[0], durationSec: Number(j.lengthSeconds) || 0, title: j.title || '' };
  });
  try {
    return await Promise.any([...piped, ...invidious]);
  } catch (_) {
    return null;
  }
}

function createBufferedLiveStream(cacheKey, contentType = 'audio/mpeg', contentLength = 0, extraHeaders = {}, initialChunks = [], onCancel = null) {
  const chunks = [];
  let total = 0;
  for (const c of initialChunks) {
    if (c && c.length > 0) {
      chunks.push(c);
      total += c.length;
    }
  }
  let resolveDone = null;
  const donePromise = new Promise((resolve) => { resolveDone = resolve; });
  const live = {
    cacheKey,
    chunks,
    total,
    done: false,
    failed: false,
    listeners: new Set(),
    contentType: contentType || 'audio/mpeg',
    contentLength: Number(contentLength) || 0,
    extraHeaders: extraHeaders || {},
    donePromise,
    cancel: () => {
      if (live.done) return;
      try { if (typeof onCancel === 'function') onCancel(); } catch (_) {}
      finish(true);
    }
  };
  const notify = () => {
    for (const fn of [...live.listeners]) {
      try { fn(); } catch (_) {}
    }
  };
  const pushChunk = (c) => {
    if (live.done || !c || !c.length) return;
    live.chunks.push(c);
    live.total += c.length;
    notify();
  };
  const finish = (failed = false) => {
    if (live.done) return;
    live.failed = Boolean(failed);
    live.done = true;
    if (!live.failed && live.total >= 60000) {
      const buffer = Buffer.concat(live.chunks.map(c => Buffer.isBuffer(c) ? c : Buffer.from(c.buffer, c.byteOffset, c.byteLength)));
      EXTRACTED_AUDIO_BUFFER_CACHE.delete(cacheKey);
      EXTRACTED_AUDIO_BUFFER_CACHE.set(cacheKey, {
        buffer,
        contentType: live.contentType,
        extraHeaders: live.extraHeaders
      });
      while (EXTRACTED_AUDIO_BUFFER_CACHE.size > MAX_EXTRACTED_BUFFER_CACHE) {
        const oldestKey = EXTRACTED_AUDIO_BUFFER_CACHE.keys().next().value;
        if (oldestKey) EXTRACTED_AUDIO_BUFFER_CACHE.delete(oldestKey);
      }
      const encVid = String(live.extraHeaders?.['X-Video-Id'] || '');
      let decVid = '';
      try { decVid = decodeURIComponent(encVid); } catch (_) { decVid = encVid; }
      let srcName = '';
      try { srcName = decodeURIComponent(String(live.extraHeaders?.['X-Audio-Source'] || '')); } catch (_) {}
      if (decVid && /^[A-Za-z0-9_-]{11}$/.test(decVid) &&
          live.contentType.includes('mpeg') &&
          !srcName.includes('SoundCloud') &&
          !YOUTUBE_FULL_MP3_LRU.has(decVid)) {
        if (YOUTUBE_FULL_MP3_LRU.size >= YOUTUBE_FULL_MP3_LRU_MAX) {
          const oldest = YOUTUBE_FULL_MP3_LRU.keys().next().value;
          if (oldest) YOUTUBE_FULL_MP3_LRU.delete(oldest);
        }
        let decTitle = '';
        try { decTitle = decodeURIComponent(String(live.extraHeaders?.['X-Song-Title'] || '')); } catch (_) {}
        YOUTUBE_FULL_MP3_LRU.set(decVid, {
          buffer,
          contentType: live.contentType,
          title: decTitle,
          thumbnail: `https://i.ytimg.com/vi/${decVid}/hqdefault.jpg`,
          durationSec: parseInt(String(live.extraHeaders?.['X-Audio-Duration'] || '0'), 10) || 0,
          source: 'YouTube Studio Master MP3'
        });
      }
    }
    if (LIVE_AUDIO_STREAMS.get(cacheKey) === live) {
      LIVE_AUDIO_STREAMS.delete(cacheKey);
    }
    notify();
    if (resolveDone) resolveDone();
  };
  return { live, pushChunk, finish };
}

async function startRemoteLiveAudioStream(cacheKey, streamUrl, contentTypeHint = 'audio/mpeg', extraHeaders = {}, timeoutMs = 95000, requestHeaders = {}, connectTimeoutMs = 7500) {
  if (!streamUrl || !/^https?:\/\//i.test(streamUrl)) return null;
  const abortCtrl = new AbortController();
  const totalTid = setTimeout(() => abortCtrl.abort(), timeoutMs);
  const connectTid = setTimeout(() => abortCtrl.abort(), connectTimeoutMs);
  let reader = null;
  try {
    const upstream = await fetch(streamUrl, {
      headers: { 'User-Agent': LIVE_UA, 'Accept': 'audio/*,*/*;q=0.8', ...(requestHeaders || {}) },
      redirect: 'follow',
      signal: abortCtrl.signal
    });
    if (!upstream || !upstream.ok || !upstream.body) {
      clearTimeout(connectTid);
      clearTimeout(totalTid);
      return null;
    }
    const cType = String(upstream.headers.get('content-type') || '').toLowerCase();
    if (cType.includes('text/html') || cType.includes('application/json') || cType.includes('mpegurl')) {
      clearTimeout(connectTid);
      clearTimeout(totalTid);
      return null;
    }
    const lenHdr = parseInt(upstream.headers.get('content-length') || '0', 10) || 0;
    if (lenHdr > 0 && lenHdr < 60000) {
      clearTimeout(connectTid);
      clearTimeout(totalTid);
      return null;
    }
    reader = upstream.body.getReader();
    const initChunks = [];
    let initTotal = 0;
    let streamDone = false;
    while (initTotal < 16384) {
      const { done, value } = await reader.read();
      if (done) {
        streamDone = true;
        break;
      }
      if (value && value.length > 0) {
        initChunks.push(value);
        initTotal += value.length;
      }
    }
    clearTimeout(connectTid);
    if (initTotal === 0 || (streamDone && initTotal < 60000)) {
      clearTimeout(totalTid);
      try { await reader.cancel(); } catch (_) {}
      return null;
    }
    const headStr = Buffer.concat(initChunks.slice(0, 2).map(c => Buffer.from(c.buffer, c.byteOffset, Math.min(c.byteLength, 256)))).toString('utf8', 0, 128).trim().toLowerCase();
    if (headStr.startsWith('<!doctype') || headStr.startsWith('<html') || headStr.startsWith('{"error')) {
      clearTimeout(totalTid);
      try { await reader.cancel(); } catch (_) {}
      return null;
    }

    const contentType = (cType && !cType.includes('octet-stream')) ? cType.split(';')[0].trim() : (contentTypeHint || 'audio/mpeg');
    const contentLength = (!upstream.headers.get('content-encoding') && lenHdr >= 60000) ? lenHdr : 0;
    const { live, pushChunk, finish } = createBufferedLiveStream(
      cacheKey,
      contentType,
      contentLength,
      extraHeaders,
      initChunks,
      () => {
        clearTimeout(totalTid);
        try { if (reader) reader.cancel().catch(() => {}); } catch (_) {}
        try { abortCtrl.abort(); } catch (_) {}
      }
    );

    if (streamDone) {
      clearTimeout(totalTid);
      finish(false);
      return live;
    }

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (live.done) {
            try { await reader.cancel(); } catch (_) {}
            break;
          }
          if (value && value.length > 0) {
            pushChunk(value);
          }
        }
        finish(false);
      } catch (_) {
        finish(true);
      } finally {
        clearTimeout(totalTid);
      }
    })();

    return live;
  } catch (_) {
    clearTimeout(connectTid);
    clearTimeout(totalTid);
    try { if (reader) reader.cancel().catch(() => {}); } catch (_) {}
    return null;
  }
}

async function startNotubeLiveStream(cacheKey, videoId, customMeta = {}, expectedDur = 0) {
  if (!videoId || !/^[A-Za-z0-9_-]{8,15}$/.test(videoId)) return null;
  const extraHeaders = {
    'X-Song-Title': encodeURIComponent(customMeta.title || ''),
    'X-Song-Artist': encodeURIComponent(customMeta.artist || ''),
    'X-Song-Cover': encodeURIComponent(customMeta.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`),
    'X-Audio-Source': encodeURIComponent('YouTube Live Stream MP3'),
    'X-Video-Id': encodeURIComponent(videoId),
    'X-Audio-Duration': String(customMeta.durationSec || expectedDur || 180)
  };
  const donePromise = extractYouTubeFullAudioViaNotubeServer(videoId).catch(() => null);
  const state = YOUTUBE_STREAM_STATES.get(videoId);
  if (!state) {
    const doneObj = await donePromise;
    if (!doneObj || !doneObj.buffer || doneObj.buffer.length < 60000) return null;
    const { live, finish } = createBufferedLiveStream(cacheKey, 'audio/mpeg', doneObj.buffer.length, extraHeaders, [doneObj.buffer]);
    finish(false);
    return live;
  }

  return new Promise((resolve) => {
    let settled = false;
    let buffered = null;
    let detached = false;
    const cleanup = () => {
      if (detached) return;
      detached = true;
      state.listeners.delete(onStateEvent);
      clearTimeout(waitTid);
    };
    const waitTid = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(null);
      }
    }, 13500);

    const onStateEvent = (chunk, isDone, isError) => {
      if (!buffered) {
        if (state.error || (isError && state.totalBytes < 16384) || (state.done && state.totalBytes < 60000)) {
          if (!settled) {
            settled = true;
            cleanup();
            resolve(null);
          }
          return;
        }
        if (state.totalBytes >= 16384 || state.done) {
          clearTimeout(waitTid);
          buffered = createBufferedLiveStream(
            cacheKey,
            'audio/mpeg',
            0,
            extraHeaders,
            [...state.chunks],
            () => cleanup()
          );
          if (state.done) {
            cleanup();
            buffered.finish(Boolean(state.error || state.totalBytes < 60000));
          }
          if (!settled) {
            settled = true;
            resolve(buffered.live);
          }
        }
        return;
      }

      if (chunk && chunk.length > 0) {
        buffered.pushChunk(chunk);
      }
      if (isDone || state.done) {
        cleanup();
        buffered.finish(Boolean(isError || state.error || buffered.live.total < 60000));
      }
    };

    state.listeners.add(onStateEvent);
    if (state.totalBytes >= 16384 || state.done || state.error) {
      onStateEvent(null, state.done, state.error);
    }
  });
}

async function startLiveYouTubeStream(cacheKey, p) {
  let videoId = p.rawVideoId;
  let durationSec = p.expectedDur || 0;
  let resolvedTitle = p.rawTitle || '';
  if (!videoId && p.searchQuery) {
    const ytList = await searchYouTubeCandidatesServer(
      p.rawArtist && p.rawTitle ? `${p.rawArtist} ${p.rawTitle}` : p.searchQuery,
      p.rawTitle, p.rawArtist, p.expectedDur
    );
    const top = ytList.find(c => c && c.videoId && (c.authScore || 0) >= 35);
    if (!top) return null;
    videoId = top.videoId;
    durationSec = top.durationSec || durationSec;
    resolvedTitle = resolvedTitle || top.title || '';
  }
  if (!videoId) return null;

  const src = await resolveYouTubeDirectAudioUrl(videoId);
  if (!src || !src.url) return null;
  durationSec = src.durationSec || durationSec;
  return startRemoteLiveAudioStream(
    cacheKey,
    src.url,
    src.contentType || 'audio/webm',
    {
      'X-Song-Title': encodeURIComponent(p.rawTitle || src.title || resolvedTitle || 'Canción'),
      'X-Song-Artist': encodeURIComponent(p.rawArtist || 'Artista'),
      'X-Song-Cover': encodeURIComponent(p.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`),
      'X-Audio-Source': encodeURIComponent('YouTube Live Stream'),
      'X-Video-Id': encodeURIComponent(videoId),
      'X-Audio-Duration': String(durationSec || 0)
    },
    95000,
    {},
    7500
  );
}

function getOrStartLiveStream(cacheKey, params, maxWaitMs = 8000) {
  if (LIVE_AUDIO_STREAMS.has(cacheKey)) return Promise.resolve(LIVE_AUDIO_STREAMS.get(cacheKey));
  let p = LIVE_START_PROMISES.get(cacheKey);
  if (!p) {
    p = startLiveYouTubeStream(cacheKey, params).catch(() => null).finally(() => LIVE_START_PROMISES.delete(cacheKey));
    LIVE_START_PROMISES.set(cacheKey, p);
  }
  return Promise.race([p, new Promise(resolve => setTimeout(() => resolve(null), maxWaitMs))]);
}

function attachToLiveStream(req, res, live) {
  const m = req.headers.range ? /bytes=(\d+)-/.exec(String(req.headers.range)) : null;
  if (m && parseInt(m[1], 10) > 0) {
    // Seek a mitad de pista: esperar a que termine la descarga y servir con soporte Range desde caché
    live.donePromise.then(() => {
      const c = EXTRACTED_AUDIO_BUFFER_CACHE.get(live.cacheKey);
      if (c) return sendAudioBufferWithRange(req, res, live.cacheKey, c.buffer, c.contentType, c.extraHeaders);
      if (!res.headersSent) return res.status(503).end();
    }).catch(() => {
      if (!res.headersSent) res.status(503).end();
    });
    return;
  }
  res.status(200);
  res.setHeader('Content-Type', live.contentType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Expose-Headers', 'X-Song-Title, X-Song-Artist, X-Song-Cover, X-Audio-Source, X-Video-Id, X-Audio-Duration, Content-Range, Accept-Ranges');
  Object.entries(live.extraHeaders || {}).forEach(([k, v]) => res.setHeader(k, String(v)));
  if (live.contentLength > 0) res.setHeader('Content-Length', String(live.contentLength));
  let idx = 0;
  let waiting = false;
  let closed = false;
  const pump = () => {
    if (closed || waiting) return;
    while (idx < live.chunks.length) {
      let ok = true;
      try {
        ok = res.write(live.chunks[idx++]);
      } catch (_) {
        closed = true;
        live.listeners.delete(pump);
        return;
      }
      if (!ok) {
        waiting = true;
        res.once('drain', () => { waiting = false; pump(); });
        return;
      }
    }
    if (live.done) {
      live.listeners.delete(pump);
      try { res.end(); } catch (_) {}
    }
  };
  live.listeners.add(pump);
  res.on('close', () => { closed = true; live.listeners.delete(pump); });
  pump();
}

function resolveTopReleaseFile(title, artist) {
  const map = getReleaseTagsMap();
  if (!map || !title) return null;
  const drop = s => String(s || '').toLowerCase().replace(/[^a-z0-9\s_]/g, '').replace(/\s/g, '_');
  const nfd = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s_]/g, '').replace(/\s/g, '_');
  const cleanArtist = String(artist || '').replace(/\s*-\s*topic$/i, '').replace(/vevo$/i, '').trim();
  const primaryArtist = cleanArtist.split(/\s*(?:,|&|\/|;|\sx\s|\sfeat\.?\s|\sft\.?\s|\sfeaturing\s)\s*/i)[0] || cleanArtist;
  const titles = [...new Set([String(title), String(title).replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').trim()])].filter(Boolean);
  const artists = [...new Set([cleanArtist, primaryArtist])].filter(Boolean);
  for (const a of artists) {
    for (const t of titles) {
      for (const fn of [drop, nfd]) {
        const key = `${fn(a)}_${fn(t)}.mp3`;
        if (map[key]) return key;
      }
    }
  }
  return null;
}

app.get('/api/v1/top-resolve', (req, res) => {
  const file = resolveTopReleaseFile(String(req.query.title || ''), String(req.query.artist || ''));
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (!file) return res.json({ found: false });
  const entry = getReleaseTagsMap()[file];
  res.json({ found: true, audio_url: file, chart_url: file.replace(/\.mp3$/, '.json'), tag: Array.isArray(entry) ? entry[0] : String(entry) });
});

app.get('/api/v1/audio/extract', async (req, res) => {
  const rawQ = repairStrippedSpanishText(String(req.query.q || '').trim());
  const rawTitle = repairStrippedSpanishText(String(req.query.title || '').trim());
  const rawArtist = repairStrippedSpanishText(String(req.query.artist || '').trim());

  // Atajo instantáneo: si existe la grabación de estudio en los releases de GitHub, redirigir (sin extraer de YouTube)
  {
    const topFile = resolveTopReleaseFile(String(req.query.title || '').trim(), String(req.query.artist || '').trim())
      || resolveTopReleaseFile(rawTitle, rawArtist);
    if (topFile) {
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(302, `/api/v1/cdn/release/${encodeURIComponent(topFile)}`);
    }
  }

  let rawVideoId = String(req.query.videoId || '').replace(/^magic_yt_|^yt_/, '').trim();
  if (!rawVideoId) {
    const coverStr = String(req.query.cover || '');
    const mCover = coverStr.match(/(?:\/vi\/|\/vi_webp\/)([A-Za-z0-9_-]{11})(?:\/|$)/);
    if (mCover && mCover[1]) rawVideoId = mCover[1];
  }
  if (!rawVideoId && /^(?:magic_yt_|yt_)?([A-Za-z0-9_-]{11})$/.test(rawQ)) {
    rawVideoId = rawQ.replace(/^magic_yt_|^yt_/, '');
  }

  const scTrackId = String(req.query.scTrackId || '').trim();
  const directAudioUrl = String(req.query.directUrl || '').trim();
  const expectedDur = parseInt(String(req.query.durationSec || req.query.duration || '0'), 10) || 0;
  const searchQuery = rawQ || `${rawTitle} ${rawArtist}`.trim();
  const isPrewarmReq = String(req.query.prewarm || '') === '1';

  if (!searchQuery && !rawVideoId && !directAudioUrl && !scTrackId) {
    return res.status(400).json({ error: 'Falta parámetro de búsqueda q, videoId, scTrackId o directUrl' });
  }

  // 0. Si el videoId ya está en YOUTUBE_FULL_MP3_LRU, servir en 0ms sin importar cómo venga el título/artista
  if (rawVideoId && YOUTUBE_FULL_MP3_LRU.has(rawVideoId)) {
    const ytCached = YOUTUBE_FULL_MP3_LRU.get(rawVideoId);
    if (ytCached && ytCached.buffer && ytCached.buffer.length >= 120000) {
      const cacheKeyVid = `${rawVideoId}|${scTrackId}|${rawTitle.toLowerCase()}|${rawArtist.toLowerCase()}|${searchQuery.toLowerCase()}`;
      return sendAudioBufferWithRange(req, res, cacheKeyVid, ytCached.buffer, ytCached.contentType || 'audio/mpeg', {
        'X-Song-Title': encodeURIComponent(rawTitle || ytCached.title || 'Canción'),
        'X-Song-Artist': encodeURIComponent(rawArtist || ytCached.artist || 'Artista'),
        'X-Song-Cover': encodeURIComponent(String(req.query.cover || ytCached.thumbnail || '')),
        'X-Audio-Source': encodeURIComponent(ytCached.source || 'YouTube Studio Master MP3'),
        'X-Video-Id': encodeURIComponent(rawVideoId),
        'X-Audio-Duration': String(ytCached.durationSec || expectedDur || 180)
      });
    }
  }

  const cacheKey = `${rawVideoId}|${scTrackId}|${rawTitle.toLowerCase()}|${rawArtist.toLowerCase()}|${searchQuery.toLowerCase()}`;
  if (EXTRACTED_AUDIO_BUFFER_CACHE.has(cacheKey)) {
    const cached = EXTRACTED_AUDIO_BUFFER_CACHE.get(cacheKey);
    return sendAudioBufferWithRange(req, res, cacheKey, cached.buffer, cached.contentType, cached.extraHeaders);
  }

  let resolvedMeta = {
    title: rawTitle || rawQ || 'Canción Extraída',
    artist: rawArtist || 'Artista',
    thumbnail: String(req.query.cover || '').trim(),
    videoId: rawVideoId || '',
    durationSec: expectedDur || 0
  };

  const rangeHdr = String(req.headers.range || '');
  const rangeMatch = rangeHdr ? /bytes=(\d+)-/.exec(rangeHdr) : null;
  const rangeStart = rangeMatch ? parseInt(rangeMatch[1], 10) : 0;

  // Si ya existe un live stream activo para esta canción, acoplarse inmediatamente sin duplicar descarga
  if (LIVE_AUDIO_STREAMS.has(cacheKey) && !isPrewarmReq) {
    return attachToLiveStream(req, res, LIVE_AUDIO_STREAMS.get(cacheKey));
  }

  // En arranque en frío desde el principio (rangeStart === 0), lanzar streaming por chunks progresivos
  // en cuanto lleguen los primeros 16 KB (evita bloquear al oyente hasta descargar el archivo entero)
  if (!isPrewarmReq && rangeStart === 0) {
    let claimed = false;
    const liveBranches = [];
    const tryClaimLive = (candidateLive) => {
      if (!candidateLive || claimed) {
        try { if (candidateLive && candidateLive.cancel) candidateLive.cancel(); } catch (_) {}
        return null;
      }
      claimed = true;
      if (!candidateLive.done && !LIVE_AUDIO_STREAMS.has(cacheKey)) {
        LIVE_AUDIO_STREAMS.set(cacheKey, candidateLive);
      }
      return candidateLive;
    };

    const isShortPreviewCdn = /(mzstatic\.com|itunes\.apple\.com|cdns-preview|dzcdn\.net)/i.test(directAudioUrl);
    if (directAudioUrl && /^https?:\/\//i.test(directAudioUrl) && !isShortPreviewCdn) {
      liveBranches.push((async () => {
        const l = await startRemoteLiveAudioStream(cacheKey, directAudioUrl, 'audio/mpeg', {
          'X-Song-Title': encodeURIComponent(resolvedMeta.title),
          'X-Song-Artist': encodeURIComponent(resolvedMeta.artist),
          'X-Song-Cover': encodeURIComponent(resolvedMeta.thumbnail),
          'X-Audio-Source': encodeURIComponent('Grabación Completa')
        });
        const won = tryClaimLive(l);
        if (!won) throw new Error('direct_live_failed');
        return won;
      })());
    }

    if (scTrackId || searchQuery) {
      liveBranches.push((async () => {
        const minScScore = resolvedMeta.videoId ? 74 : 68;
        const scProg = await resolveSoundCloudProgressiveStreamServer(searchQuery, rawTitle, rawArtist, scTrackId, minScScore);
        if (!scProg || !scProg.streamUrl) throw new Error('sc_prog_none');
        const l = await startRemoteLiveAudioStream(cacheKey, scProg.streamUrl, scProg.contentType || 'audio/mpeg', {
          'X-Song-Title': encodeURIComponent(rawTitle || scProg.title || resolvedMeta.title),
          'X-Song-Artist': encodeURIComponent(rawArtist || scProg.artist || resolvedMeta.artist),
          'X-Song-Cover': encodeURIComponent(resolvedMeta.thumbnail || scProg.thumbnail || ''),
          'X-Audio-Source': encodeURIComponent(scProg.source || 'SoundCloud Live Stream'),
          'X-Video-Id': encodeURIComponent(resolvedMeta.videoId || ''),
          'X-Audio-Duration': String(scProg.durationSec || expectedDur || 180)
        });
        const won = tryClaimLive(l);
        if (!won) throw new Error('sc_live_failed');
        return won;
      })());
    }

    if (resolvedMeta.videoId || searchQuery) {
      liveBranches.push((async () => {
        const l = await getOrStartLiveStream(cacheKey, {
          rawVideoId: resolvedMeta.videoId,
          searchQuery,
          rawTitle: resolvedMeta.title,
          rawArtist: resolvedMeta.artist,
          thumbnail: resolvedMeta.thumbnail,
          expectedDur
        }, 7000);
        const won = tryClaimLive(l);
        if (!won) throw new Error('yt_piped_live_failed');
        return won;
      })());
    }

    if (resolvedMeta.videoId && !scTrackId && !directAudioUrl) {
      liveBranches.push((async () => {
        const l = await startNotubeLiveStream(cacheKey, resolvedMeta.videoId, resolvedMeta, expectedDur);
        const won = tryClaimLive(l);
        if (!won) throw new Error('notube_live_failed');
        return won;
      })());
    }

    if (liveBranches.length > 0) {
      try {
        const winnerLive = await Promise.any(liveBranches);
        if (winnerLive && !res.headersSent) {
          return attachToLiveStream(req, res, winnerLive);
        }
      } catch (_) {
        claimed = true;
      }
    }
  }

  if (INFLIGHT_EXTRACT_REQUESTS.has(cacheKey)) {
    try {
      const shared = await INFLIGHT_EXTRACT_REQUESTS.get(cacheKey);
      if (shared && shared.buffer) {
        return sendAudioBufferWithRange(req, res, cacheKey, shared.buffer, shared.contentType, shared.extraHeaders);
      }
    } catch (_) {}
  }

  const resolveTask = (async () => {
    // 1. Si hay URL directa no-preview o scTrackId específico, resolver primero
    const isShortPreviewCdn = /(mzstatic\.com|itunes\.apple\.com|cdns-preview|dzcdn\.net)/i.test(directAudioUrl);
    if (directAudioUrl && /^https?:\/\//i.test(directAudioUrl) && !isShortPreviewCdn) {
      try {
        const dl = await fetchAudioBufferSafe(directAudioUrl, 6000);
        if (dl && dl.buffer && dl.buffer.length >= 120000) {
          return {
            buffer: dl.buffer,
            contentType: dl.contentType || 'audio/mpeg',
            extraHeaders: {
              'X-Song-Title': encodeURIComponent(resolvedMeta.title),
              'X-Song-Artist': encodeURIComponent(resolvedMeta.artist),
              'X-Song-Cover': encodeURIComponent(resolvedMeta.thumbnail),
              'X-Audio-Source': encodeURIComponent('Grabación Completa')
            }
          };
        }
      } catch (_) {}
    }

    if (scTrackId) {
      const scDirect = await extractSoundCloudFullTrackServer(searchQuery, rawTitle, rawArtist, scTrackId);
      if (scDirect && scDirect.buffer && scDirect.buffer.length >= 120000) {
        return {
          buffer: scDirect.buffer,
          contentType: scDirect.contentType || 'audio/mpeg',
          extraHeaders: {
            'X-Song-Title': encodeURIComponent(rawTitle || scDirect.title || resolvedMeta.title),
            'X-Song-Artist': encodeURIComponent(rawArtist || scDirect.artist || resolvedMeta.artist),
            'X-Song-Cover': encodeURIComponent(resolvedMeta.thumbnail || scDirect.thumbnail || ''),
            'X-Audio-Source': encodeURIComponent(scDirect.source || 'SoundCloud Full Audio'),
            'X-Audio-Duration': String(scDirect.durationSec || 180)
          }
        };
      }
    }

    // 2. CARRERA PARALELA DE ALTA VELOCIDAD (SoundCloud ~0.25s + YouTube/Notube en paralelo):
    const fastRaceBranches = [];

    if (searchQuery) {
      const minScScore = resolvedMeta.videoId ? 74 : 68;
      fastRaceBranches.push((async () => {
        const scFull = await extractSoundCloudFullTrackServer(searchQuery, rawTitle, rawArtist, '', minScScore);
        if (scFull && scFull.buffer && scFull.buffer.length >= 250000) {
          return {
            buffer: scFull.buffer,
            contentType: scFull.contentType || 'audio/mpeg',
            extraHeaders: {
              'X-Song-Title': encodeURIComponent(rawTitle || scFull.title || resolvedMeta.title),
              'X-Song-Artist': encodeURIComponent(rawArtist || scFull.artist || resolvedMeta.artist),
              'X-Song-Cover': encodeURIComponent(resolvedMeta.thumbnail || scFull.thumbnail || ''),
              'X-Audio-Source': encodeURIComponent(scFull.source || 'SoundCloud Full Audio'),
              'X-Video-Id': encodeURIComponent(resolvedMeta.videoId || ''),
              'X-Audio-Duration': String(scFull.durationSec || expectedDur || 180)
            }
          };
        }
        throw new Error('sc_no_match');
      })());
    }

    if (resolvedMeta.videoId) {
      fastRaceBranches.push((async () => {
        const ytDirect = await tryExtractYouTubeStream(resolvedMeta.videoId);
        if (ytDirect && ytDirect.buffer && ytDirect.buffer.length >= 120000) {
          return {
            buffer: ytDirect.buffer,
            contentType: ytDirect.contentType || 'audio/mpeg',
            extraHeaders: {
              'X-Song-Title': encodeURIComponent(rawTitle || ytDirect.title || resolvedMeta.title),
              'X-Song-Artist': encodeURIComponent(rawArtist || ytDirect.artist || resolvedMeta.artist),
              'X-Song-Cover': encodeURIComponent(resolvedMeta.thumbnail || ytDirect.thumbnail || ''),
              'X-Audio-Source': encodeURIComponent(ytDirect.source || 'YouTube Studio Master MP3'),
              'X-Video-Id': encodeURIComponent(resolvedMeta.videoId),
              'X-Audio-Duration': String(ytDirect.durationSec || expectedDur || 180)
            }
          };
        }
        throw new Error('yt_direct_failed');
      })());
    } else if (searchQuery) {
      fastRaceBranches.push((async () => {
        const ytList = await searchYouTubeCandidatesServer(
          rawArtist && rawTitle ? `${rawArtist} ${rawTitle}` : searchQuery,
          rawTitle,
          rawArtist,
          expectedDur
        );
        const topCand = ytList.find(c => c && c.videoId && (c.authScore || 0) >= 35);
        if (!topCand || !topCand.videoId) throw new Error('yt_search_empty');
        if (YOUTUBE_FULL_MP3_LRU.has(topCand.videoId)) {
          const ytCached = YOUTUBE_FULL_MP3_LRU.get(topCand.videoId);
          if (ytCached && ytCached.buffer) {
            return {
              buffer: ytCached.buffer,
              contentType: 'audio/mpeg',
              extraHeaders: {
                'X-Song-Title': encodeURIComponent(rawTitle || ytCached.title || topCand.title || resolvedMeta.title),
                'X-Song-Artist': encodeURIComponent(rawArtist || ytCached.artist || topCand.artist || resolvedMeta.artist),
                'X-Song-Cover': encodeURIComponent(resolvedMeta.thumbnail || topCand.thumbnail || ''),
                'X-Audio-Source': encodeURIComponent('YouTube Studio Master MP3'),
                'X-Video-Id': encodeURIComponent(topCand.videoId),
                'X-Audio-Duration': String(topCand.durationSec || ytCached.durationSec || expectedDur || 180)
              }
            };
          }
        }
        const ytAudio = await tryExtractYouTubeStream(topCand.videoId);
        if (ytAudio && ytAudio.buffer && ytAudio.buffer.length >= 120000) {
          return {
            buffer: ytAudio.buffer,
            contentType: ytAudio.contentType || 'audio/mpeg',
            extraHeaders: {
              'X-Song-Title': encodeURIComponent(rawTitle || ytAudio.title || topCand.title || resolvedMeta.title),
              'X-Song-Artist': encodeURIComponent(rawArtist || ytAudio.artist || topCand.artist || resolvedMeta.artist),
              'X-Song-Cover': encodeURIComponent(resolvedMeta.thumbnail || topCand.thumbnail || ''),
              'X-Audio-Source': encodeURIComponent(ytAudio.source || 'YouTube Studio Master MP3'),
              'X-Video-Id': encodeURIComponent(topCand.videoId),
              'X-Audio-Duration': String(topCand.durationSec || ytAudio.durationSec || expectedDur || 180)
            }
          };
        }
        throw new Error('yt_cand_failed');
      })());
    }

    if (fastRaceBranches.length > 0) {
      try {
        const winner = await Promise.any(fastRaceBranches);
        if (winner && winner.buffer) return winner;
      } catch (_) {}
    }

    return null;
  })();

  INFLIGHT_EXTRACT_REQUESTS.set(cacheKey, resolveTask);
  try {
    const fastWinner = await resolveTask;
    if (fastWinner && fastWinner.buffer) {
      return sendAudioBufferWithRange(req, res, cacheKey, fastWinner.buffer, fastWinner.contentType, fastWinner.extraHeaders);
    }
  } finally {
    INFLIGHT_EXTRACT_REQUESTS.delete(cacheKey);
  }

  try {

    // Etapa 3: Red Descentralizada Audius (Pistas completas >= 55s)
    if (searchQuery) {
      try {
        const audiusRes = await fetch(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(searchQuery)}&app_name=PianoCommunity`, {
          signal: AbortSignal.timeout(3500)
        });
        if (audiusRes.ok) {
          const audiusJson = await audiusRes.json();
          const tracks = Array.isArray(audiusJson?.data) ? audiusJson.data : [];
          const scored = tracks
            .filter(tr => tr && tr.id && (!tr.duration || Number(tr.duration) >= 52))
            .map(tr => ({
              tr,
              sc: scoreStudioAudioAuthenticityServer(searchQuery, rawTitle, rawArtist, tr.title || '', tr.user?.name || '', '', 'Audius')
            }))
            .sort((a, b) => b.sc - a.sc);

          for (const { tr, sc } of scored.slice(0, 2)) {
            if (sc >= 65) {
              const streamUrl = `https://discoveryprovider.audius.co/v1/tracks/${encodeURIComponent(tr.id)}/stream?app_name=PianoCommunity`;
              const dl = await fetchAudioBufferSafe(streamUrl, 6500);
              if (dl && dl.buffer && dl.buffer.length >= 350000) {
                const art = tr.artwork?.['480x480'] || tr.artwork?.['150x150'] || resolvedMeta.thumbnail;
                return sendAudioBufferWithRange(req, res, cacheKey, dl.buffer, dl.contentType || 'audio/mpeg', {
                  'X-Song-Title': encodeURIComponent(tr.title || resolvedMeta.title),
                  'X-Song-Artist': encodeURIComponent(tr.user?.name || resolvedMeta.artist),
                  'X-Song-Cover': encodeURIComponent(art || ''),
                  'X-Audio-Source': encodeURIComponent('Audius Full Audio')
                });
              }
            }
          }
        }
      } catch (_) {}
    }

    // Etapa 4: Internet Archive Audio (Pistas MP3 completas)
    if (searchQuery) {
      try {
        const iaSearch = await fetch(
          `https://archive.org/advancedsearch.php?q=${encodeURIComponent(searchQuery)}+AND+mediatype:audio&fl[]=identifier,title,creator&rows=3&output=json`,
          { signal: AbortSignal.timeout(3500) }
        );
        if (iaSearch.ok) {
          const iaJson = await iaSearch.json();
          const docs = Array.isArray(iaJson?.response?.docs) ? iaJson.response.docs : [];
          for (const doc of docs) {
            if (!doc || !doc.identifier) continue;
            const metaRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}`, {
              signal: AbortSignal.timeout(3000)
            });
            if (!metaRes.ok) continue;
            const metaJson = await metaRes.json();
            const files = Array.isArray(metaJson?.files) ? metaJson.files : [];
            const mp3File = files.find(f => f && f.name && /\.mp3$/i.test(f.name) && (!f.size || (parseInt(f.size, 10) > 800000 && parseInt(f.size, 10) < 22000000)));
            if (mp3File) {
              const mp3Url = `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodeURIComponent(mp3File.name)}`;
              const dl = await fetchAudioBufferSafe(mp3Url, 6500);
              if (dl && dl.buffer && dl.buffer.length >= 350000) {
                res.setHeader('Content-Type', 'audio/mpeg');
                res.setHeader('Access-Control-Expose-Headers', 'X-Song-Title, X-Song-Artist, X-Song-Cover, X-Audio-Source');
                res.setHeader('X-Song-Title', encodeURIComponent(doc.title || resolvedMeta.title));
                res.setHeader('X-Song-Artist', encodeURIComponent(Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || resolvedMeta.artist)));
                res.setHeader('X-Song-Cover', encodeURIComponent(resolvedMeta.thumbnail || ''));
                res.setHeader('X-Audio-Source', encodeURIComponent('Internet Archive Audio'));
                return res.send(dl.buffer);
              }
            }
          }
        }
      } catch (_) {}
    }

    return res.status(404).json({ error: 'No se pudo extraer el flujo de audio completo desde ninguna fuente.' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error en extractor de audio' });
  }
});

// ==========================================
// 4C-bis. PRE-CALENTAMIENTO DE AUDIO (el servidor extrae y cachea antes de que el usuario pulse play)
// ==========================================
const AUDIO_WARM_QUEUE = [];
const AUDIO_WARM_SEEN = new Map();
let audioWarmActive = 0;
const AUDIO_WARM_CONCURRENCY = 1;

function buildAudioWarmCacheKey(t) {
  const title = String(t.title || '').trim();
  const artist = String(t.artist || '').trim();
  const vid = String(t.videoId || '').trim();
  return `${vid}||${title.toLowerCase()}|${artist.toLowerCase()}|${`${title} ${artist}`.trim().toLowerCase()}`;
}

async function pumpAudioWarmQueue() {
  if (INFLIGHT_EXTRACT_REQUESTS.size > 0) {
    setTimeout(pumpAudioWarmQueue, 1500);
    return;
  }
  while (audioWarmActive < AUDIO_WARM_CONCURRENCY && AUDIO_WARM_QUEUE.length > 0) {
    if (INFLIGHT_EXTRACT_REQUESTS.size > 0) break;
    const t = AUDIO_WARM_QUEUE.shift();
    audioWarmActive++;
    (async () => {
      try {
        const key = buildAudioWarmCacheKey(t);
        if (EXTRACTED_AUDIO_BUFFER_CACHE.has(key) || INFLIGHT_EXTRACT_REQUESTS.has(key)) return;
        const qs = new URLSearchParams({ title: t.title || '', artist: t.artist || '', prewarm: '1' });
        if (t.videoId) qs.set('videoId', t.videoId);
        if (t.durationSec > 45) qs.set('durationSec', String(Math.round(t.durationSec)));
        const r = await fetch(`http://127.0.0.1:${PORT}/api/v1/audio/extract?${qs.toString()}`, { signal: AbortSignal.timeout(25000) });
        try { await r.body.cancel(); } catch (_) {}
      } catch (_) {
      } finally {
        audioWarmActive--;
        setTimeout(pumpAudioWarmQueue, 400);
      }
    })();
  }
}

app.post('/api/v1/audio/warm', (req, res) => {
  res.status(202).json({ queued: 0, mode: 'client_direct' });
});

// ==========================================
// 4D. TRADUCCIÓN DE LETRAS DE KARAOKE EN TIEMPO REAL
// ==========================================
const lyricsTranslationMemoryCache = new Map();

app.post('/api/v1/lyrics/translate', async (req, res) => {
  try {
    const lines = Array.isArray(req.body?.lines) ? req.body.lines.map(l => String(l || '').trim()) : [];
    const targetLang = String(req.body?.targetLang || 'es').toLowerCase().slice(0, 2);
    if (!lines.length) return res.json({ translations: [] });

    const cacheKey = `${targetLang}__${lines.join('|').slice(0, 480)}`;
    const cached = lyricsTranslationMemoryCache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < 6 * 3600 * 1000) {
      return res.json({ translations: cached.data });
    }

    // Batch translate using Google GTX separator-preserving strategy
    const joined = lines.map(l => l || ' ').join('\n');
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(joined)}`;
    const gRes = await fetch(gtxUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4500)
    });
    if (gRes.ok) {
      const gJson = await gRes.json();
      const segments = Array.isArray(gJson?.[0]) ? gJson[0] : [];
      const fullTranslated = segments.map(seg => (Array.isArray(seg) && seg[0]) ? String(seg[0]) : '').join('');
      const translatedLines = fullTranslated.split('\n').map(s => s.trim());
      const out = lines.map((orig, idx) => {
        const tr = translatedLines[idx] || '';
        if (!orig || orig.toLowerCase() === tr.toLowerCase()) return '';
        return tr;
      });
      if (lyricsTranslationMemoryCache.size > 300) {
        const firstKey = lyricsTranslationMemoryCache.keys().next().value;
        if (firstKey) lyricsTranslationMemoryCache.delete(firstKey);
      }
      lyricsTranslationMemoryCache.set(cacheKey, { ts: Date.now(), data: out });
      return res.json({ translations: out });
    }
    return res.json({ translations: lines.map(() => '') });
  } catch (_) {
    return res.json({ translations: [] });
  }
});

// ==========================================
// 4E. PLAYLISTS OFICIALES EN VIVO (TOP 100 ESPAÑA, TOP 100 MUNDO Y GÉNEROS ACTUALES)
// ==========================================
const LIVE_CHART_PLAYLIST_DEFS = [
  {
    id: 'top_100_es',
    aliases: ['live_chart_es_top100', 'top_100_es'],
    title: 'Top 100 España',
    subtitle: '100 canciones',
    gradient: 'linear-gradient(135deg, #991b1b 0%, #d97706 100%)',
    accent: '#fbbf24',
    appleRssUrl: 'https://rss.applemarketingtools.com/api/v2/es/music/most-played/100/songs.json',
    deezerChartUrl: 'https://api.deezer.com/playlist/1109890291/tracks?limit=100',
    itunesRssUrl: 'https://itunes.apple.com/es/rss/topsongs/limit=100/json'
  },
  {
    id: 'top_100_global',
    aliases: ['live_chart_global_top100', 'top_100_global'],
    title: 'Top 100 Global',
    subtitle: '100 canciones',
    gradient: 'linear-gradient(135deg, #065f46 0%, #0284c7 100%)',
    accent: '#34d399',
    appleRssUrl: 'https://rss.applemarketingtools.com/api/v2/us/music/most-played/100/songs.json',
    deezerChartUrl: 'https://api.deezer.com/playlist/3155776842/tracks?limit=100',
    itunesRssUrl: 'https://itunes.apple.com/us/rss/topsongs/limit=100/json'
  },
  {
    id: 'top_pop_hits',
    aliases: ['live_chart_pop_hits', 'top_pop_hits'],
    title: 'Éxitos Pop',
    subtitle: '100 canciones',
    gradient: 'linear-gradient(135deg, #9d174d 0%, #7c3aed 100%)',
    accent: '#f472b6',
    deezerChartUrl: 'https://api.deezer.com/chart/132/tracks?limit=100',
    itunesRssUrl: 'https://itunes.apple.com/us/rss/topsongs/limit=100/genre=14/json'
  },
  {
    id: 'top_latin_urban',
    aliases: ['live_chart_urbano_latino', 'top_latin_urban'],
    title: 'Urbano & Latino',
    subtitle: '100 canciones',
    gradient: 'linear-gradient(135deg, #c2410c 0%, #ca8a04 100%)',
    accent: '#fb923c',
    deezerChartUrl: 'https://api.deezer.com/chart/197/tracks?limit=100',
    itunesRssUrl: 'https://itunes.apple.com/es/rss/topsongs/limit=100/genre=12/json'
  },
  {
    id: 'top_rock_alt',
    aliases: ['live_chart_rock_legends', 'top_rock_alt'],
    title: 'Rock & Alternativo',
    subtitle: '100 canciones',
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #1f2937 100%)',
    accent: '#f87171',
    deezerChartUrl: 'https://api.deezer.com/chart/152/tracks?limit=100',
    itunesRssUrl: 'https://itunes.apple.com/us/rss/topsongs/limit=100/genre=21/json'
  },
  {
    id: 'top_dance_electronic',
    aliases: ['live_chart_dance_electro', 'top_dance_electronic'],
    title: 'Electrónica & Club',
    subtitle: '100 canciones',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)',
    accent: '#38bdf8',
    deezerChartUrl: 'https://api.deezer.com/chart/106/tracks?limit=100',
    itunesRssUrl: 'https://itunes.apple.com/es/rss/topsongs/limit=100/genre=7/json'
  },
  {
    id: 'top_hiphop_rnb',
    aliases: ['live_chart_hiphop_rnb', 'top_hiphop_rnb'],
    title: 'Hip-Hop & R&B',
    subtitle: '100 canciones',
    gradient: 'linear-gradient(135deg, #581c87 0%, #3730a3 100%)',
    accent: '#fbbf24',
    deezerChartUrl: 'https://api.deezer.com/chart/116/tracks?limit=100',
    itunesRssUrl: 'https://itunes.apple.com/us/rss/topsongs/limit=100/genre=18/json'
  },
  {
    id: 'top_classical_piano',
    aliases: ['live_chart_piano_classical', 'top_classical_piano'],
    title: 'Piano & BSO',
    subtitle: '100 canciones',
    gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
    accent: '#fcd34d',
    deezerChartUrl: 'https://api.deezer.com/chart/98/tracks?limit=100',
    itunesRssUrl: 'https://itunes.apple.com/es/rss/topsongs/limit=100/genre=5/json'
  }
];

const liveChartTracksCache = new Map();

async function fetchLiveChartTracksById(chartId) {
  const def = LIVE_CHART_PLAYLIST_DEFS.find(d => d.id === chartId || (d.aliases && d.aliases.includes(chartId))) || LIVE_CHART_PLAYLIST_DEFS[0];
  const cached = liveChartTracksCache.get(def.id);
  if (cached && (Date.now() - cached.ts) < 45 * 60 * 1000 && cached.tracks.length > 0) {
    return { def, tracks: cached.tracks };
  }

  const tracks = [];
  const seenKeys = new Set();

  const pushUniqueTrack = (tr) => {
    if (!tr || !tr.title || !tr.artist) return;
    const normKey = `${normalizeSearchText(tr.title)}__${normalizeSearchText(tr.artist)}`;
    if (!normKey || seenKeys.has(normKey)) return;
    seenKeys.add(normKey);
    const cover = tr.thumbnail || './app_logo.png';
    tracks.push({
      id: tr.id || `chart_${def.id}_${tracks.length + 1}`,
      title: String(tr.title).trim(),
      artist: String(tr.artist).trim(),
      thumbnail: cover,
      cover_url: cover,
      artworkUrl600: cover,
      previewUrl: tr.previewUrl || '',
      preview_url: tr.previewUrl || '',
      duration_seconds: Number(tr.duration_seconds) || 195,
      durationSec: Number(tr.duration_seconds) || 195,
      rank: tracks.length + 1,
      source: 'live_chart',
      _isMagicKey: true
    });
  };

  // 1. Prioridad 1: Deezer Official Top Playlists / Genre Charts (Streaming real actual + Previews MP3 instantáneos + Portadas HD)
  if (def.deezerChartUrl) {
    try {
      const r = await fetch(def.deezerChartUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3500)
      });
      if (r.ok) {
        const j = await r.json();
        const list = Array.isArray(j?.data) ? j.data : (Array.isArray(j?.tracks?.data) ? j.tracks.data : []);
        for (const item of list) {
          if (!item || !item.title) continue;
          pushUniqueTrack({
            id: item.id ? `dz_${item.id}` : '',
            title: item.title_short || item.title,
            artist: item.artist?.name || 'Artista',
            thumbnail: item.album?.cover_big || item.album?.cover_xl || item.album?.cover_medium || '',
            previewUrl: item.preview || '',
            duration_seconds: Number(item.duration) || 195
          });
        }
      }
    } catch (_) {}
  }

  // 2. Prioridad 2: Apple Music Most-Played Streaming API (Streaming oficial del país)
  if (tracks.length < 80 && def.appleRssUrl) {
    try {
      const r = await fetch(def.appleRssUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3500)
      });
      if (r.ok) {
        const j = await r.json();
        const results = Array.isArray(j?.feed?.results) ? j.feed.results : [];
        for (const item of results) {
          if (!item || !item.name) continue;
          const cover = (item.artworkUrl100 || '').replace(/\d+x\d+bb/i, '600x600bb');
          pushUniqueTrack({
            id: item.id ? `am_${item.id}` : '',
            title: item.name,
            artist: item.artistName || 'Artista',
            thumbnail: cover,
            previewUrl: '',
            duration_seconds: 195
          });
        }
      }
    } catch (_) {}
  }

  // 3. Prioridad 3: iTunes RSS JSON como complemento si faltan pistas para llegar a 100
  if (tracks.length < 60 && def.itunesRssUrl) {
    try {
      const r = await fetch(def.itunesRssUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3500)
      });
      if (r.ok) {
        const j = await r.json();
        const entries = Array.isArray(j?.feed?.entry) ? j.feed.entry : [];
        for (const e of entries) {
          const title = e?.['im:name']?.label || '';
          const artist = e?.['im:artist']?.label || '';
          const imgs = Array.isArray(e?.['im:image']) ? e['im:image'] : [];
          const rawImg = imgs.length ? (imgs[imgs.length - 1]?.label || '') : '';
          const cover600 = rawImg ? rawImg.replace(/\d+x\d+bb/i, '600x600bb') : '';
          const links = Array.isArray(e?.link) ? e.link : [];
          const prevObj = links.find(l => l?.attributes?.type?.includes('audio') || l?.attributes?.['im:assetType'] === 'preview');
          const previewUrl = prevObj?.attributes?.href || '';
          const durMs = Number(e?.link?.[1]?.['im:duration']?.label || 0);
          const itemId = e?.id?.attributes?.['im:id'] || '';
          pushUniqueTrack({
            id: itemId ? `it_${itemId}` : '',
            title,
            artist,
            thumbnail: cover600,
            previewUrl,
            duration_seconds: durMs > 1000 ? Math.round(durMs / 1000) : 195
          });
          if (tracks.length >= 100) break;
        }
      }
    } catch (_) {}
  }

  if (tracks.length > 0) {
    liveChartTracksCache.set(def.id, { ts: Date.now(), tracks });
  }
  return { def, tracks };
}

// Pre-warm charts and ALL user playlist YouTube tracks asynchronously in the background without blocking any request
setTimeout(() => {
  LIVE_CHART_PLAYLIST_DEFS.slice(0, 4).forEach((def, idx) => {
    setTimeout(() => { fetchLiveChartTracksById(def.id).catch(() => {}); }, idx * 900);
  });
  try {
    const ytIdsToWarm = new Set([
      'a4YfyblzE7g', 'RYYnXrTBFq4', 'QGR1FMta87c', 'XL4GeI4K1Xs',
      'mmELyTiDEAw', 'kU-Z94uTPuo', '8i2peB3MEpA', 'F8oXB7zLwxk',
      'IYoKjx_sR3c', 'YeWmWUjIZKg', '7J0xFQqAMHI', 'jMgOWiuVQ0s',
      'hUxt4QhapJc', 'l3zCFXb4xSg'
    ]);
    const profiles = (typeof playerProfilesByCode !== 'undefined' && playerProfilesByCode instanceof Map)
      ? Array.from(playerProfilesByCode.values())
      : [];
    for (const prof of profiles) {
      const lists = Array.isArray(prof?.playlists) ? prof.playlists : [];
      for (const pl of lists) {
        const trs = Array.isArray(pl?.tracks) ? pl.tracks : [];
        for (const t of trs) {
          const rawId = String(t?.videoId || t?.id || '').replace(/^magic_yt_|^yt_/, '').trim();
          if (/^[A-Za-z0-9_-]{11}$/.test(rawId)) {
            ytIdsToWarm.add(rawId);
          } else {
            const mThumb = String(t?.thumbnail || '').match(/(?:\/vi\/|\/vi_webp\/)([A-Za-z0-9_-]{11})(?:\/|$)/);
            if (mThumb && mThumb[1]) ytIdsToWarm.add(mThumb[1]);
          }
        }
      }
    }
    const allVids = Array.from(ytIdsToWarm).slice(0, 32);
    allVids.forEach((vid, idx) => {
      const batchDelay = 400 + Math.floor(idx / 4) * 2800 + (idx % 4) * 250;
      setTimeout(() => {
        extractYouTubeFullAudioViaNotubeServer(vid).catch(() => {});
      }, batchDelay);
    });
  } catch (_) {}
}, 800);

app.get('/api/v1/charts/top-playlists', (req, res) => {
  try {
    const cards = LIVE_CHART_PLAYLIST_DEFS.map((def) => {
      const cached = liveChartTracksCache.get(def.id);
      const sampleTracks = cached ? cached.tracks.slice(0, 4) : [];
      if (!cached) {
        fetchLiveChartTracksById(def.id).catch(() => {});
      }
      return {
        id: def.id,
        title: def.title,
        subtitle: def.subtitle,
        gradient: def.gradient,
        accent: def.accent,
        item_count: cached?.tracks?.length || 100,
        coverUrl: sampleTracks[0]?.thumbnail || '',
        thumbnail: sampleTracks[0]?.thumbnail || './app_logo.png',
        mosaic_covers: sampleTracks.map(t => t.thumbnail).filter(Boolean).slice(0, 4)
      };
    });
    res.json({ playlists: cards });
  } catch (err) {
    res.json({ playlists: LIVE_CHART_PLAYLIST_DEFS });
  }
});

app.get('/api/v1/charts/top-playlist-tracks', async (req, res) => {
  const id = String(req.query.id || '').trim();
  try {
    const { def, tracks } = await fetchLiveChartTracksById(id);
    res.json({
      id: def.id,
      title: def.title,
      subtitle: `${tracks.length} canciones`,
      item_count: tracks.length,
      tracks
    });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo cargar el Top actual' });
  }
});

// ==========================================
// 5. Song Files Serving (Audio & Chart)
// ==========================================
app.get('/songs/:folder/:file(*)', (req, res) => {
  const { folder, file } = req.params;
  const candidates = [
    path.join(SONGS_DIR, folder, file),
    path.join(COMMUNITY_DIR, folder, file),
    path.join(COMMUNITY_DIR, `comm_${folder}`, file),
  ];
  if (folder === 'renacer' || folder === 'comm_renacer') {
    candidates.push(
      path.join(SONGS_DIR, 'renacer', file),
      path.join(COMMUNITY_DIR, 'comm_renacer', file)
    );
  }

  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      if (file.endsWith('.mp3')) {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        return res.sendFile(p);
      } else if (file.endsWith('.json') || file.endsWith('.js')) {
        if (serveCompressedTextFile(req, res, p, 'public, max-age=3600, must-revalidate')) return;
      }
      res.setHeader('Cache-Control', 'public, max-age=604800');
      return res.sendFile(p);
    }
  }

  res.status(404).json({ error: `Pista ${folder}/${file} no encontrada` });
});

// ==========================================
// 5.5. GitHub Releases CDN Proxy & Tag Map
// ==========================================
let RELEASE_TAGS_MAP_DATA = null;
function getReleaseTagsMap() {
  if (!RELEASE_TAGS_MAP_DATA) {
    const p = path.join(__dirname, 'data', 'release_tags_map.json');
    if (fs.existsSync(p)) {
      try {
        RELEASE_TAGS_MAP_DATA = JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (_) {}
    }
  }
  return RELEASE_TAGS_MAP_DATA || {};
}

app.get('/api/v1/release-tags-map', (req, res) => {
  const mapPath = path.join(__dirname, 'data', 'release_tags_map.json');
  if (serveCompressedTextFile(req, res, mapPath, 'public, max-age=86400, must-revalidate')) return;
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.json(getReleaseTagsMap());
});

const RELEASE_ASSET_LOC_CACHE = new Map();
async function resolveReleaseAssetLocation(assetId) {
  const hit = RELEASE_ASSET_LOC_CACHE.get(assetId);
  if (hit && Date.now() - hit.at < 3 * 60 * 1000) return hit.loc;
  const ghToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const headers = { Accept: 'application/octet-stream', 'User-Agent': 'renacer-cdn' };
  if (ghToken) headers.Authorization = `Bearer ${ghToken}`;
  const apiRes = await fetch(`https://api.github.com/repos/Bruala33/renacer/releases/assets/${assetId}`, {
    headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(4000)
  });
  const loc = apiRes.headers.get('location');
  try { apiRes.body && apiRes.body.cancel(); } catch (_) {}
  if (!loc) return null;
  RELEASE_ASSET_LOC_CACHE.set(assetId, { at: Date.now(), loc });
  if (RELEASE_ASSET_LOC_CACHE.size > 500) RELEASE_ASSET_LOC_CACHE.delete(RELEASE_ASSET_LOC_CACHE.keys().next().value);
  return loc;
}

app.get('/api/v1/cdn/release/:filename(*)', async (req, res) => {
  const { filename } = req.params;
  const map = getReleaseTagsMap();
  const entry = map[filename];
  const tag = Array.isArray(entry) ? entry[0] : (typeof entry === 'string' ? entry : '3');
  const assetId = Array.isArray(entry) ? entry[1] : null;

  const directUrl = `https://github.com/Bruala33/renacer/releases/download/${tag}/${filename}`;

  // El endpoint de la API entrega la URL firmada del CDN en ~0.4s; github.com/releases/download tarda ~11s.
  if (assetId) {
    try {
      const loc = await resolveReleaseAssetLocation(assetId);
      if (loc) {
        res.setHeader('Cache-Control', 'public, max-age=120');
        return res.redirect(302, loc);
      }
    } catch (_) {}
    // Sin token / límite del servidor: que el propio cliente resuelva con su cuota de API
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, `https://api.github.com/repos/Bruala33/renacer/releases/assets/${assetId}`);
  }

  // Redirect to direct public GitHub release URL
  res.redirect(302, directUrl);
});


// ==========================================
// 6. Static HTML and Web Game Entry Points
// ==========================================
function resolveLatestGameHtmlPath() {
  const indexHtmlPath = path.join(STATIC_DIR, 'index.html');
  const gameHtmlPath = path.join(STATIC_DIR, 'game.html');
  try {
    if (fs.existsSync(indexHtmlPath)) {
      const idxStat = fs.statSync(indexHtmlPath);
      const gameStat = fs.existsSync(gameHtmlPath) ? fs.statSync(gameHtmlPath) : null;
      if (!gameStat || idxStat.mtimeMs >= gameStat.mtimeMs || idxStat.size !== gameStat.size) {
        fs.copyFileSync(indexHtmlPath, gameHtmlPath);
      }
      return indexHtmlPath;
    }
  } catch (_) {}
  return fs.existsSync(indexHtmlPath) ? indexHtmlPath : gameHtmlPath;
}

// Sincronizar game.html con index.html al iniciar el servidor (evita desajustes en Render)
resolveLatestGameHtmlPath();

// Serve /, /game.html, /index.html with Brotli/Gzip + ETag 304 Not Modified
app.get(['/', '/game.html', '/index.html'], (req, res) => {
  const fileToServe = resolveLatestGameHtmlPath();
  if (serveCompressedTextFile(req, res, fileToServe, 'public, max-age=0, must-revalidate')) {
    return;
  }
  res.status(404).send('index.html no encontrado.');
});

// Intercept compressible text assets (.js, .css, .html, .json, .svg) before express.static
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const cleanPath = req.path.replace(/^\/static\//, '/');
  const ext = path.extname(cleanPath).toLowerCase();
  if (ext === '.js' || ext === '.css' || ext === '.html' || ext === '.json' || ext === '.svg') {
    const candidate = path.join(STATIC_DIR, cleanPath);
    const hasVersionQuery = Boolean(req.query && req.query.v);
    const isVendorAsset = cleanPath.startsWith('/assets/vendor/');
    const cachePolicy = (ext !== '.html' && (hasVersionQuery || isVendorAsset))
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate';
    if (candidate.startsWith(STATIC_DIR) && serveCompressedTextFile(req, res, candidate, cachePolicy)) {
      return;
    }
  }
  next();
});

// Pre-warm static compression cache in background on server startup
setImmediate(() => {
  const coreAssets = [
    'index.html',
    'style.css',
    'parsers.js',
    'game.js',
    'discover_home.js',
    'songs/catalog_top.js',
    'slot_machine.js',
    'gachapon_3d.js',
    'assets/vendor/tailwind.min.js',
    'assets/vendor/jszip.min.js',
    'assets/vendor/three.min.js'
  ];
  for (const rel of coreAssets) {
    try {
      const fp = path.join(STATIC_DIR, rel);
      if (!fs.existsSync(fp)) continue;
      const stat = fs.statSync(fp);
      if (!stat.isFile()) continue;
      const rawBuf = fs.readFileSync(fp);
      const gzipBuf = zlib.gzipSync(rawBuf, { level: 1 });
      const entry = { mtimeMs: stat.mtimeMs, size: stat.size, rawBuf, gzipBuf, brBuf: null, _upgrading: false };
      STATIC_COMPRESSED_CACHE.set(fp, entry);
      upgradeCompressedEntryAsync(fp, entry);
    } catch (_) {}
  }
});

const staticCacheHeaders = (res, filePath) => {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.css') || lower.endsWith('.js') || lower.endsWith('.html')) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  } else if (lower.endsWith('.mp3') || lower.endsWith('.ogg') || lower.endsWith('.wav') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.woff2') || lower.endsWith('.ttf')) {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
};

// Static assets mounted at /static
app.use('/static', express.static(STATIC_DIR, { etag: true, lastModified: true, setHeaders: staticCacheHeaders }));

// Root fallback static file serving (for /style.css, /game.js, /favicon.ico, etc.)
app.use(express.static(STATIC_DIR, { etag: true, lastModified: true, setHeaders: staticCacheHeaders }));

// 404 fallback to index.html for client-side routing
app.use((req, res) => {
  const fileToServe = resolveLatestGameHtmlPath();
  if (serveCompressedTextFile(req, res, fileToServe, 'public, max-age=0, must-revalidate')) {
    return;
  }
  res.status(404).send('Not Found');
});

// Start Server
app.listen(PORT, HOST, () => {
  console.log(`Piano Community Rhythm Engine server running at http://${HOST}:${PORT}`);
});

// =======================================================
// PERSISTENCIA DE CANCIONES COMUNITARIAS EN GITHUB
// =======================================================
let lastSyncedCommunityChartsJson = '';

async function syncCommunityChartsToGithub() {
  if (!GITHUB_TOKEN) return;
  try {
    const list = Array.from(communityCharts.values()).filter(c => !c.id.startsWith('comm_camilo') && !c.id.startsWith('comm_renacer'));
    const jsonStr = JSON.stringify(list, null, 2);
    if (jsonStr === lastSyncedCommunityChartsJson) return;
    const base64Content = Buffer.from(jsonStr).toString('base64');
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/community_charts.json`;
    
    const payload = {
      message: `Update community charts [skip ci] [vercel skip]`,
      content: base64Content,
      branch: GITHUB_BRANCH
    };
    if (githubCommunitySha) payload.sha = githubCommunitySha;

    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Renacer-Leaderboard-Service',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      githubCommunitySha = data?.content?.sha || githubCommunitySha;
      lastSyncedCommunityChartsJson = jsonStr;
      console.log('[Server] Community charts persisted to GitHub.');
    }
  } catch (err) {
    console.warn('[Server] Error saving community charts to GitHub:', err.message);
  }
}

async function loadCommunityChartsFromGithub() {
  if (!GITHUB_TOKEN) return;
  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/community_charts.json?ref=${GITHUB_BRANCH}`;
    const res = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Renacer-Leaderboard-Service'
      }
    });
    if (res.ok) {
      const data = await res.json();
      githubCommunitySha = data.sha;
      if (data.content) {
        const raw = Buffer.from(data.content, 'base64').toString('utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(c => communityCharts.set(c.id, c));
          console.log(`[Server] Loaded ${list.length} community charts from GitHub.`);
        }
      }
    }
  } catch (err) {
    console.warn('[Server] Could not load community charts from GitHub:', err.message);
  }
}

// Cargar canciones comunitarias al arrancar
loadCommunityChartsFromGithub().catch(() => {});
