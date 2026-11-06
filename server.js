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
const MAX_COMPRESSED_CACHE_ENTRIES = 32;

function getMimeTypeForStatic(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml; charset=utf-8';
  return 'application/octet-stream';
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
      const gzipBuf = zlib.gzipSync(rawBuf, { level: 6 });
      let brBuf = null;
      try {
        brBuf = zlib.brotliCompressSync(rawBuf, {
          params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 }
        });
      } catch (_) {}
      entry = { mtimeMs: stat.mtimeMs, size: stat.size, rawBuf, gzipBuf, brBuf };
      if (STATIC_COMPRESSED_CACHE.size >= MAX_COMPRESSED_CACHE_ENTRIES) {
        const oldestKey = STATIC_COMPRESSED_CACHE.keys().next().value;
        STATIC_COMPRESSED_CACHE.delete(oldestKey);
      }
      STATIC_COMPRESSED_CACHE.set(filePath, entry);
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

// Proxy con caché en memoria para letras sincronizadas LRC (LRCLIB)
const lyricsMemoryCache = new Map();
app.get('/api/v1/lyrics', async (req, res) => {
  try {
    const q = String(req.query.q || `${req.query.title || ''} ${req.query.artist || ''}`).trim();
    if (!q || q.length < 2) return res.json([]);
    const cacheKey = q.toLowerCase();
    if (lyricsMemoryCache.has(cacheKey)) {
      return res.json(lyricsMemoryCache.get(cacheKey));
    }
    const resp = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'PianoCommunity/5.5 (https://github.com/atomasv/piano_renacer)' },
      signal: AbortSignal.timeout(3500)
    });
    if (!resp.ok) return res.json([]);
    const data = await resp.json();
    const list = Array.isArray(data) ? data.slice(0, 5) : [];
    if (lyricsMemoryCache.size > 300) {
      const oldestKey = lyricsMemoryCache.keys().next().value;
      if (oldestKey) lyricsMemoryCache.delete(oldestKey);
    }
    lyricsMemoryCache.set(cacheKey, list);
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

  const nQuery = norm(searchQuery || `${rawTitle} ${rawArtist}`);
  const nTitle = norm(rawTitle || searchQuery);
  const nArtist = norm(rawArtist);
  const cTitle = norm(candTitle);
  const cArtist = norm(candArtist);
  const cAlbum = norm(candAlbum);
  const cExtra = norm(extraChannel);
  const cFull = `${cTitle} ${cArtist} ${cAlbum} ${cExtra}`.trim();

  if (!cTitle) return 0;

  // Base relevance score
  let score = computeSongRelevanceScore(searchQuery || `${rawTitle} ${rawArtist}`, candTitle || '', candArtist || '');

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

  // Anti-Strange-Version penalties (Nightcore, Slowed, Sped Up, Remix, DJ Mix, Medley/Popurri, Live, Cover, Demo)
  const strangeMarkers = [
    'nightcore', 'daycore', 'slowed', 'sped up', 'reverb', '8d audio', 'bass boosted',
    'chopped', 'screwed', 'remix', 'rmx', 'dj mix', 'classic mix', 'bootleg', 'mashup',
    'megamix', 'extended mix', 'club mix', 'vip mix', 'eurodance', 'fiestero', 'popurri',
    'medley', 'dubos', 'chelito', 'kye remix', 'sarapura', 'por claudio', 'hermanos cuero',
    'cover', 'live at', 'live in', 'live from', 'en vivo', 'ao vivo', 'en directo',
    'concierto', 'acoustic version', 'unplugged', 'demo', 'tv size', 'short ver', 'cut ver'
  ];
  for (const m of strangeMarkers) {
    if (cFull.includes(m) && !nQuery.includes(m)) {
      score -= 55;
    }
  }
  if (/\b(live|dj|edit)\b/.test(cTitle) && !/\b(live|dj|edit)\b/.test(nQuery)) {
    score -= 40;
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
      queries.push(`${cleanQ} canciones audio`);
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
        signal: AbortSignal.timeout(3800)
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
          // Descartar livestreams sin duración, fragmentos cortos (< 42s) o sesiones largas (> 15 min)
          if (!durSec || durSec < 42 || durSec > 900) return;
          if (!lenText && v.badges && JSON.stringify(v.badges).includes('LIVE')) return;

          const thumbs = v.thumbnail?.thumbnails || [];
          const thumb = thumbs.length ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
          if (vid && title) {
            seenIds.add(vid);
            rankIdx++;
            const cleanArt = author.replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim();
            let authScore = Math.max(48, 98 - (qIdx * 6) - Math.min(35, rankIdx * 1.4));
            if (/ - Topic$/i.test(author) || /official\s*audio|audio\s*oficial|provided to youtube/i.test(title)) {
              authScore += 14;
            }
            if (expectedDurationSec > 55 && durSec > 55) {
              const diffDur = Math.abs(durSec - expectedDurationSec);
              if (diffDur <= 12) authScore += 16;
              else if (diffDur <= 28) authScore += 8;
            }
            found.push({
              videoId: vid,
              title,
              artist: cleanArt || rawArtist || 'YouTube Music',
              channel: author,
              durationSec: durSec || expectedDurationSec || 180,
              thumbnail: thumb,
              authScore: Math.min(115, Math.round(authScore))
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

const YOUTUBE_FULL_MP3_LRU = new Map();
const YOUTUBE_FULL_MP3_LRU_MAX = 24;
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

async function resolveSignedNotubeDownloadUrlServer(videoId, apiHost, webHost, ua) {
  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const myWorker = (u) => `https://drive-proxi.jocomomolobruno.workers.dev/?url=${encodeURIComponent(u)}`;

  const body1 = new URLSearchParams({ url: ytUrl, format: 'mp3', lang: 'es', subscribed: 'false' });
  let d1 = null;
  try {
    const r1 = await fetch(`${apiHost}/recover_weight.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': ua,
        'Origin': webHost,
        'Referer': `${webHost}/`
      },
      body: body1.toString(),
      signal: AbortSignal.timeout(4500)
    });
    if (r1.ok) {
      const txt1 = await r1.text();
      if (txt1 && txt1.trim().startsWith('{')) d1 = JSON.parse(txt1);
    }
  } catch (_) {}

  if (!d1 || !d1.token) {
    const r1w = await fetch(myWorker(`${apiHost}/recover_weight.php`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body1.toString(),
      signal: AbortSignal.timeout(5000)
    });
    if (!r1w.ok) return null;
    d1 = await r1w.json();
  }
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

  let finalToken = d1.token;
  let gotValidR2 = false;
  try {
    const r2w = await fetch(myWorker(`${apiHost}/recover_file.php`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body2.toString(),
      signal: AbortSignal.timeout(6500)
    });
    if (r2w.ok) {
      const txt2 = await r2w.text();
      if (txt2 && txt2.trim().startsWith('{')) {
        const d2 = JSON.parse(txt2);
        if (d2 && d2.token) {
          finalToken = d2.token;
          gotValidR2 = true;
        }
      }
    }
  } catch (_) {}

  if (!gotValidR2) {
    try {
      const r2 = await fetch(`${apiHost}/recover_file.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': ua,
          'Origin': webHost,
          'Referer': `${webHost}/`
        },
        body: body2.toString(),
        signal: AbortSignal.timeout(6000)
      });
      if (r2.ok) {
        const txt2 = await r2.text();
        if (txt2 && txt2.trim().startsWith('{')) {
          const d2 = JSON.parse(txt2);
          if (d2 && d2.token) finalToken = d2.token;
        }
      }
    } catch (_) {}
  }

  let dlUrl = '';
  const downloadPageUrl = `${webHost}/es/download?token=${encodeURIComponent(finalToken)}`;
  try {
    const pageRes = await fetch(downloadPageUrl, {
      headers: { 'User-Agent': ua, 'Referer': `${webHost}/` },
      signal: AbortSignal.timeout(4500)
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
        signal: AbortSignal.timeout(5000)
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
    const nodeCandidates = [
      NOTUBE_SERVER_NODES[startIdx],
      NOTUBE_SERVER_NODES[(startIdx + 7) % NOTUBE_SERVER_NODES.length],
      NOTUBE_SERVER_NODES[(startIdx + 15) % NOTUBE_SERVER_NODES.length]
    ];

    for (const node of nodeCandidates) {
      const apiHost = `https://${node}.notube.im`;
      const webHost = 'https://notube.im';
      try {
        const resolved = await resolveSignedNotubeDownloadUrlServer(videoId, apiHost, webHost, ua);
        if (!resolved || !resolved.dlUrl) continue;

        const dlRes = await fetch(resolved.dlUrl, {
          headers: { 'User-Agent': ua, 'Referer': `${webHost}/` },
          redirect: 'follow',
          signal: AbortSignal.timeout(24000)
        });
        if (!dlRes.ok) continue;
        const ct = String(dlRes.headers.get('content-type') || '').toLowerCase();
        if (ct.includes('text/html') || ct.includes('application/json')) continue;

        streamState.chunks = [];
        streamState.totalBytes = 0;

        if (dlRes.body && typeof dlRes.body.getReader === 'function') {
          const reader = dlRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value && value.byteLength > 0) {
              const b = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
              streamState.chunks.push(b);
              streamState.totalBytes += b.length;
              notifyListeners(b, false, false);
            }
          }
        } else {
          const ab = await dlRes.arrayBuffer();
          if (ab && ab.byteLength > 0) {
            const b = Buffer.from(ab);
            streamState.chunks.push(b);
            streamState.totalBytes += b.length;
            notifyListeners(b, false, false);
          }
        }

        if (streamState.totalBytes >= 120000) {
          const fullBuf = Buffer.concat(streamState.chunks, streamState.totalBytes);
          let cleanTitle = resolved.title || '';
          try { cleanTitle = decodeURIComponent(cleanTitle); } catch (_) {}
          const resultObj = {
            buffer: fullBuf,
            contentType: 'audio/mpeg',
            title: cleanTitle,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            source: 'YouTube Studio Master MP3'
          };
          if (YOUTUBE_FULL_MP3_LRU.size >= YOUTUBE_FULL_MP3_LRU_MAX) {
            const oldest = YOUTUBE_FULL_MP3_LRU.keys().next().value;
            if (oldest) YOUTUBE_FULL_MP3_LRU.delete(oldest);
          }
          YOUTUBE_FULL_MP3_LRU.set(videoId, resultObj);
          streamState.done = true;
          notifyListeners(null, true, false);
          return resultObj;
        }
      } catch (_) {}
    }

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

async function getSoundCloudClientIdServer() {
  if (_cachedSoundCloudClientId && (Date.now() - _cachedSoundCloudClientIdTs) < 3600000) {
    return _cachedSoundCloudClientId;
  }
  try {
    const homeRes = await fetch('https://soundcloud.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(4500)
    });
    if (!homeRes.ok) return _cachedSoundCloudClientId || '';
    const html = await homeRes.text();
    const scripts = [...html.matchAll(/src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g)].map(m => m[1]);
    for (const sUrl of scripts.slice(-4).reverse()) {
      try {
        const jsRes = await fetch(sUrl, { signal: AbortSignal.timeout(3500) });
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
}

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
    'tribute', 'cover', 'parody', 'ringtone', '8 bit', 'lullaby', 'instrumental version'
  ];
  for (const marker of forbidden) {
    if (nc.includes(marker) && !nq.includes(marker)) return true;
  }
  if (/\b(dj|edit|live)\b/.test(nc) && !/\b(dj|edit|live)\b/.test(nq)) return true;
  return false;
}

async function searchSoundCloudFullCandidatesServer(searchQuery, rawTitle = '', rawArtist = '') {
  const clientId = await getSoundCloudClientIdServer();
  if (!clientId) return { clientId: '', candidates: [], studioRefs: [] };

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const baseQ = String(searchQuery || `${rawTitle} ${rawArtist}`).trim();

  // Consultar Apple Music y Deezer en paralelo para obtener las canciones oficiales exactas y variedad real
  let studioRefs = [];
  const [itRes, dzRes] = await Promise.allSettled([
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(baseQ)}&media=music&entity=song&limit=15`, {
      signal: AbortSignal.timeout(3200)
    }).then(r => r.ok ? r.json() : null),
    fetch(`https://api.deezer.com/search?q=${encodeURIComponent(baseQ)}&limit=15`, {
      signal: AbortSignal.timeout(3200)
    }).then(r => r.ok ? r.json() : null)
  ]);

  if (itRes.status === 'fulfilled' && Array.isArray(itRes.value?.results)) {
    for (const r of itRes.value.results) {
      if (!r || !r.trackName || !r.artistName) continue;
      const durSec = Math.round(Number(r.trackTimeMillis || 180000) / 1000);
      if (durSec < 52 || durSec > 600) continue;
      if (isUnrequestedRemixOrStrangeTrackServer(baseQ, `${r.trackName} ${r.artistName} ${r.collectionName || ''}`)) continue;
      studioRefs.push({
        title: r.trackName,
        artist: r.artistName,
        album: r.collectionName || 'Estudio Original',
        durationSec: durSec,
        thumbnail: (r.artworkUrl100 || '').replace('100x100bb', '600x600bb')
      });
    }
  }

  if (dzRes.status === 'fulfilled' && Array.isArray(dzRes.value?.data)) {
    for (const t of dzRes.value.data) {
      if (!t || !t.title || !t.artist?.name) continue;
      const durSec = Number(t.duration || 180);
      if (durSec < 52 || durSec > 600) continue;
      if (isUnrequestedRemixOrStrangeTrackServer(baseQ, `${t.title} ${t.artist.name} ${t.album?.title || ''}`)) continue;
      studioRefs.push({
        title: t.title,
        artist: t.artist.name,
        album: t.album?.title || 'Estudio Original',
        durationSec: durSec,
        thumbnail: t.album?.cover_big || t.album?.cover_medium || ''
      });
    }
  }

  const topStudio = studioRefs[0] || null;
  const effectiveTitle = rawTitle || (topStudio ? topStudio.title : baseQ);
  const effectiveArtist = rawArtist || (topStudio ? topStudio.artist : '');

  const studioPrimaryQ = topStudio ? `${topStudio.artist} ${topStudio.title}`.trim() : '';
  const queries = Array.from(new Set(
    [studioPrimaryQ, baseQ]
      .map(s => String(s || '').trim())
      .filter(s => s.length >= 2)
  ));

  const allTracks = [];
  const seenIds = new Set();

  await Promise.allSettled(queries.slice(0, 2).map(async (q) => {
    try {
      const scRes = await fetch(
        `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&client_id=${encodeURIComponent(clientId)}&limit=24`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(4000)
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

        // Descartar remixes/DJ mixes/covers/versiones extrañas no pedidas
        if (isUnrequestedRemixOrStrangeTrackServer(baseQ, `${tr.title || ''} ${tr.user?.username || ''}`)) continue;

        const parsedMeta = parseSoundCloudTrackMetaServer(tr, effectiveTitle, effectiveArtist);
        const sc = scoreStudioAudioAuthenticityServer(baseQ, effectiveTitle, effectiveArtist, parsedMeta.title, parsedMeta.artist, '', tr.title || '');
        // Exigir puntuación alta real (coincidencia de título + artista) para nunca colar otra canción distinta
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
  }));

  allTracks.sort((a, b) => b.score - a.score);
  return { clientId, candidates: allTracks, studioRefs };
}

async function extractSoundCloudFullTrackServer(searchQuery, rawTitle = '', rawArtist = '', specificScTrackId = '') {
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
    if (cand.score < 68) break;
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

async function tryExtractYouTubeStream(videoId) {
  if (!videoId) return null;

  // 1. Prioridad #1: Extractor Notube MP3 Completo (con polling para vídeos recién convertidos y soporte de canciones de 1.5 a 6 min)
  try {
    const notubeMp3 = await extractYouTubeFullAudioViaNotubeServer(videoId);
    if (notubeMp3 && notubeMp3.buffer && notubeMp3.buffer.length >= 120000) {
      return notubeMp3;
    }
  } catch (_) {}

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

  // 2. Probar instancias Piped en paralelo
  try {
    const streamInfo = await Promise.any(pipedInstances.map(async (apiUrl) => {
      const r = await fetch(apiUrl, { signal: AbortSignal.timeout(4200) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      const streams = Array.isArray(j?.audioStreams) ? j.audioStreams : [];
      const sorted = streams
        .filter(s => s && s.url && (!s.mimeType || s.mimeType.includes('audio')))
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      if (!sorted.length) throw new Error('No audioStreams');
      const dl = await fetchAudioBufferSafe(sorted[0].url, 7500);
      if (!dl || !dl.buffer || dl.buffer.length < 120000) throw new Error('Audio stream too short');
      return {
        ...dl,
        title: j.title || '',
        artist: (j.uploader || '').replace(/ - Topic$/i, '').trim(),
        thumbnail: j.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        source: 'YouTube Audio Stream'
      };
    }));
    if (streamInfo && streamInfo.buffer) return streamInfo;
  } catch (_) {}

  // 3. Probar instancias Invidious en paralelo
  try {
    const invInfo = await Promise.any(invidiousInstances.map(async (apiUrl) => {
      const r = await fetch(apiUrl, { signal: AbortSignal.timeout(4200) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      const adaptive = Array.isArray(j?.adaptiveFormats) ? j.adaptiveFormats : [];
      const audioFmts = adaptive
        .filter(f => f && f.url && String(f.type || '').startsWith('audio/'))
        .sort((a, b) => (parseInt(b.bitrate, 10) || 0) - (parseInt(a.bitrate, 10) || 0));
      if (!audioFmts.length) throw new Error('No adaptive audio');
      const dl = await fetchAudioBufferSafe(audioFmts[0].url, 7500);
      if (!dl || !dl.buffer || dl.buffer.length < 120000) throw new Error('Adaptive audio too short');
      return {
        ...dl,
        title: j.title || '',
        artist: (j.author || '').replace(/ - Topic$/i, '').trim(),
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        source: 'YouTube Direct Audio'
      };
    }));
    if (invInfo && invInfo.buffer) return invInfo;
  } catch (_) {}

  return null;
}

const instantPreviewMemoryCache = new Map();

function repairStrippedSpanishText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\bcorazn\b/gi, 'corazon')
    .replace(/\bvivirs\b/gi, 'viviras')
    .replace(/\btarzn\b/gi, 'tarzan')
    .replace(/\bfernndez\b/gi, 'fernandez')
    .replace(/\baerolneas\b/gi, 'aerolineas')
    .replace(/\bmsica\b/gi, 'musica')
    .replace(/\bcancin\b/gi, 'cancion')
    .replace(/\bpasin\b/gi, 'pasion')
    .replace(/\bilusin\b/gi, 'ilusion')
    .replace(/\brazn\b/gi, 'razon')
    .replace(/\bperdname\b/gi, 'perdoname')
    .replace(/\bslo\b/gi, 'solo')
    .replace(/\bms\b/gi, 'mas')
    .replace(/\bqu\b/gi, 'que')
    .replace(/\bt\b/gi, 'tu')
    .replace(/\bm\b/gi, 'mi');
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
      if (state.totalBytes < 36000 && !state.done) return;
      if (state.error || (state.done && state.totalBytes < 36000)) {
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
          best = {
            previewUrl: item.preview,
            artworkUrl: (item.album && (item.album.cover_medium || item.album.cover_big || item.album.cover)) || null,
            title: item.title_short || item.title || cleanTitle,
            artist: (item.artist && item.artist.name) || cleanArtist,
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
          best = {
            previewUrl: item.previewUrl,
            artworkUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : null,
            title: item.trackName || cleanTitle,
            artist: item.artistName || cleanArtist,
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
    const result = dzFull || itFull;
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

const audioCandidatesMemoryCache = new Map();
app.get('/api/v1/audio/candidates', async (req, res) => {
  const rawTitle = String(req.query.title || '').trim();
  const rawArtist = String(req.query.artist || '').trim();
  const rawQ = String(req.query.q || `${rawTitle} ${rawArtist}`).trim();
  if (!rawQ) return res.json({ candidates: [] });

  const cKey = rawQ.toLowerCase();
  const cachedCands = audioCandidatesMemoryCache.get(cKey);
  if (cachedCands && (Date.now() - cachedCands.ts) < 15 * 60 * 1000) {
    return res.json({ candidates: cachedCands.data });
  }

  try {
    const ytCands = await searchYouTubeCandidatesServer(rawQ, rawTitle, rawArtist);
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

app.get('/api/v1/audio/extract', async (req, res) => {
  const rawQ = String(req.query.q || '').trim();
  const rawTitle = String(req.query.title || '').trim();
  const rawArtist = String(req.query.artist || '').trim();
  const rawVideoId = String(req.query.videoId || '').trim();
  const scTrackId = String(req.query.scTrackId || '').trim();
  const directAudioUrl = String(req.query.directUrl || '').trim();
  const expectedDur = parseInt(String(req.query.durationSec || '0'), 10) || 0;
  const searchQuery = rawQ || `${rawTitle} ${rawArtist}`.trim();

  if (!searchQuery && !rawVideoId && !directAudioUrl && !scTrackId) {
    return res.status(400).json({ error: 'Falta parámetro de búsqueda q, videoId, scTrackId o directUrl' });
  }

  let resolvedMeta = {
    title: rawTitle || rawQ || 'Canción Extraída',
    artist: rawArtist || 'Artista',
    thumbnail: String(req.query.cover || '').trim(),
    videoId: rawVideoId || ''
  };

  try {
    // Etapa 0A: Si se solicitó un videoId específico de YouTube, extraer su MP3 completo de estudio directamente
    if (resolvedMeta.videoId) {
      const ytDirect = await tryExtractYouTubeStream(resolvedMeta.videoId);
      if (ytDirect && ytDirect.buffer && ytDirect.buffer.length >= 120000) {
        res.setHeader('Content-Type', ytDirect.contentType || 'audio/mpeg');
        res.setHeader('Access-Control-Expose-Headers', 'X-Song-Title, X-Song-Artist, X-Song-Cover, X-Audio-Source, X-Video-Id');
        res.setHeader('X-Song-Title', encodeURIComponent(rawTitle || ytDirect.title || resolvedMeta.title));
        res.setHeader('X-Song-Artist', encodeURIComponent(rawArtist || ytDirect.artist || resolvedMeta.artist));
        res.setHeader('X-Song-Cover', encodeURIComponent(resolvedMeta.thumbnail || ytDirect.thumbnail || ''));
        res.setHeader('X-Audio-Source', encodeURIComponent(ytDirect.source || 'YouTube Studio Master MP3'));
        res.setHeader('X-Video-Id', encodeURIComponent(resolvedMeta.videoId));
        return res.send(ytDirect.buffer);
      }
    }

    // Etapa 0B: Si se solicitó un trackId específico de SoundCloud completo, descargarlo directamente
    if (scTrackId) {
      const scDirect = await extractSoundCloudFullTrackServer(searchQuery, rawTitle, rawArtist, scTrackId);
      if (scDirect && scDirect.buffer && scDirect.buffer.length >= 120000) {
        res.setHeader('Content-Type', scDirect.contentType || 'audio/mpeg');
        res.setHeader('Access-Control-Expose-Headers', 'X-Song-Title, X-Song-Artist, X-Song-Cover, X-Audio-Source, X-Audio-Duration');
        res.setHeader('X-Song-Title', encodeURIComponent(rawTitle || scDirect.title || resolvedMeta.title));
        res.setHeader('X-Song-Artist', encodeURIComponent(rawArtist || scDirect.artist || resolvedMeta.artist));
        res.setHeader('X-Song-Cover', encodeURIComponent(resolvedMeta.thumbnail || scDirect.thumbnail || ''));
        res.setHeader('X-Audio-Source', encodeURIComponent(scDirect.source || 'SoundCloud Full Audio'));
        res.setHeader('X-Audio-Duration', String(scDirect.durationSec || 180));
        return res.send(scDirect.buffer);
      }
    }

    // Etapa 0C: Si el usuario eligió una URL directa que NO sea un preview corto de 30s de iTunes/Deezer, descargarla
    const isShortPreviewCdn = /(mzstatic\.com|itunes\.apple\.com|cdns-preview|dzcdn\.net)/i.test(directAudioUrl);
    if (directAudioUrl && /^https?:\/\//i.test(directAudioUrl) && !isShortPreviewCdn) {
      try {
        const dl = await fetchAudioBufferSafe(directAudioUrl, 7500);
        if (dl && dl.buffer && dl.buffer.length >= 120000) {
          res.setHeader('Content-Type', dl.contentType || 'audio/mpeg');
          res.setHeader('Access-Control-Expose-Headers', 'X-Song-Title, X-Song-Artist, X-Song-Cover, X-Audio-Source');
          res.setHeader('X-Song-Title', encodeURIComponent(resolvedMeta.title));
          res.setHeader('X-Song-Artist', encodeURIComponent(resolvedMeta.artist));
          res.setHeader('X-Song-Cover', encodeURIComponent(resolvedMeta.thumbnail));
          res.setHeader('X-Audio-Source', encodeURIComponent('Grabación Completa'));
          return res.send(dl.buffer);
        }
      } catch (_) {}
    }

    // Etapa 1: Resolver la grabación oficial en YouTube y extraer el MP3 completo
    if (searchQuery) {
      const ytList = await searchYouTubeCandidatesServer(
        rawArtist && rawTitle ? `${rawArtist} ${rawTitle}` : searchQuery,
        rawTitle,
        rawArtist,
        expectedDur
      );
      for (const ytCand of ytList.slice(0, 3)) {
        if (!ytCand.videoId || ytCand.videoId === resolvedMeta.videoId) continue;
        if (ytCand.authScore < 35) continue;
        const ytAudio = await tryExtractYouTubeStream(ytCand.videoId);
        if (ytAudio && ytAudio.buffer && ytAudio.buffer.length >= 120000) {
          res.setHeader('Content-Type', ytAudio.contentType || 'audio/mpeg');
          res.setHeader('Access-Control-Expose-Headers', 'X-Song-Title, X-Song-Artist, X-Song-Cover, X-Audio-Source, X-Video-Id');
          res.setHeader('X-Song-Title', encodeURIComponent(rawTitle || ytCand.title || resolvedMeta.title));
          res.setHeader('X-Song-Artist', encodeURIComponent(rawArtist || ytCand.artist || resolvedMeta.artist));
          res.setHeader('X-Song-Cover', encodeURIComponent(resolvedMeta.thumbnail || ytCand.thumbnail || ''));
          res.setHeader('X-Audio-Source', encodeURIComponent(ytAudio.source || 'YouTube Studio Master MP3'));
          res.setHeader('X-Video-Id', encodeURIComponent(ytCand.videoId));
          return res.send(ytAudio.buffer);
        }
      }
    }

    // Etapa 2: Respaldo de SoundCloud Full Audio estrictamente verificado (solo si título + artista coinciden de verdad y sin remixes)
    if (searchQuery) {
      const scFull = await extractSoundCloudFullTrackServer(searchQuery, rawTitle, rawArtist);
      if (scFull && scFull.buffer && scFull.buffer.length >= 350000) {
        res.setHeader('Content-Type', scFull.contentType || 'audio/mpeg');
        res.setHeader('Access-Control-Expose-Headers', 'X-Song-Title, X-Song-Artist, X-Song-Cover, X-Audio-Source, X-Audio-Duration');
        res.setHeader('X-Song-Title', encodeURIComponent(rawTitle || scFull.title || resolvedMeta.title));
        res.setHeader('X-Song-Artist', encodeURIComponent(rawArtist || scFull.artist || resolvedMeta.artist));
        res.setHeader('X-Song-Cover', encodeURIComponent(resolvedMeta.thumbnail || scFull.thumbnail || ''));
        res.setHeader('X-Audio-Source', encodeURIComponent(scFull.source || 'SoundCloud Full Audio'));
        res.setHeader('X-Audio-Duration', String(scFull.durationSec || 180));
        return res.send(scFull.buffer);
      }
    }

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
                res.setHeader('Content-Type', dl.contentType || 'audio/mpeg');
                res.setHeader('Access-Control-Expose-Headers', 'X-Song-Title, X-Song-Artist, X-Song-Cover, X-Audio-Source');
                res.setHeader('X-Song-Title', encodeURIComponent(tr.title || resolvedMeta.title));
                res.setHeader('X-Song-Artist', encodeURIComponent(tr.user?.name || resolvedMeta.artist));
                res.setHeader('X-Song-Cover', encodeURIComponent(art || ''));
                res.setHeader('X-Audio-Source', encodeURIComponent('Audius Full Audio'));
                return res.send(dl.buffer);
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
    if (candidate.startsWith(STATIC_DIR) && serveCompressedTextFile(req, res, candidate, 'public, max-age=0, must-revalidate')) {
      return;
    }
  }
  next();
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
