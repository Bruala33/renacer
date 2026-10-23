import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const STATIC_DIR = path.join(__dirname, 'app', 'static');
const COMMUNITY_DIR = path.join(__dirname, 'app', 'uploads', 'community');
const SONGS_DIR = path.join(STATIC_DIR, 'songs');
const SCORES_FILE = path.join(__dirname, 'app', 'uploads', 'leaderboard_scores.json');
const RATINGS_FILE = path.join(__dirname, 'app', 'uploads', 'chart_ratings.json');
const GITHUB_LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

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

  // 1. Global: Ranking acumulativo por puntos totales conseguidos
  const globalList = Array.from(playerGlobalAccumulator.values())
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 50);

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

  return {
    songs: songsObj,
    global: globalList,
    weekly: {
      week_id: currentWeek,
      players: weeklyList
    },
    referrals: referralsObj
  };
}

async function syncLeaderboardToGithub() {
  const consolidated = buildConsolidatedLeaderboardJson();
  const jsonStr = JSON.stringify(consolidated, null, 2);

  // Always save locally to leaderboard.json
  try {
    fs.writeFileSync(GITHUB_LEADERBOARD_FILE, jsonStr, 'utf-8');
  } catch (e) {
    console.warn('[Server] Could not write local leaderboard.json:', e.message);
  }

  if (!GITHUB_TOKEN) return;
  if (isSyncingToGithub) {
    pendingGithubSync = true;
    return;
  }

  isSyncingToGithub = true;
  try {
    const base64Content = Buffer.from(jsonStr).toString('base64');
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/leaderboard.json`;
    const payload = {
      message: `Update online leaderboards [skip ci]`,
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
      console.log('[Server] Online leaderboard successfully persisted to GitHub.');
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
      syncLeaderboardToGithub().catch(() => {});
    }
  }
}

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
      const formatted = list.map((item, idx) => ({
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
      existing.forEach(e => mergedMap.set((e.player_name || '').trim().toLowerCase(), e));
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
      if (key) playerGlobalAccumulator.set(key, { name: p.name, total_score: p.total_score || 0, clefs: p.clefs || 0 });
    });
  }

  // Restaurar acumulador Semanal
  if (data.weekly && data.weekly.week_id && Array.isArray(data.weekly.players)) {
    const weekMap = new Map();
    data.weekly.players.forEach(p => {
      const key = (p.name || '').trim().toLowerCase();
      if (key) weekMap.set(key, { name: p.name, score: p.score || 0 });
    });
    playerWeeklyAccumulator.set(data.weekly.week_id, weekMap);
  }

  // Restaurar referidos verificados por enlace
  if (data.referrals && typeof data.referrals === 'object') {
    for (const [refKey, friendList] of Object.entries(data.referrals)) {
      if (Array.isArray(friendList)) {
        friendList.forEach(fName => registerReferralHelper(refKey, fName));
      }
    }
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
        chartScores.set(id, scores);
      }
      console.log(`[Server] Loaded persistent scores for ${chartScores.size} charts.`);
    }
  } catch (err) {
    console.warn('[Server] Could not load scores from disk:', err.message);
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
    version: '3.0.0',
    num_lanes: 3,
    sources: ['osu! Mania', 'Clone Hero'],
  });
});

app.get(['/api/version', '/api/v1/version'], (req, res) => {
  res.json({
    version_code: 21,
    version_name: '2.8.0',
    release_notes: 'Piano Community v2.8: Buscador real de canciones y playlists de YouTube en Descubrir, paginación completa para playlists grandes (200+ canciones), corrección visual de pestañas en móvil y rotación real de canciones destacadas en la Tragaperras.',
    download_url: '/download/apk?v=21.0',
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

app.all(['/download/apk', '/api/v1/app/download_apk', '/PianoCommunity.apk', '/downloads/PianoCommunity.apk', '/HyperRhythm.apk'], (req, res) => {
  const apkCandidates = [
    path.join(__dirname, 'PianoCommunity.apk'),
    path.join(STATIC_DIR, 'downloads', 'PianoCommunity.apk'),
    path.join(STATIC_DIR, 'PianoCommunity.apk'),
    path.join(__dirname, '.build-outputs', 'app-debug.apk'),
    path.join(__dirname, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
    path.join(__dirname, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
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
    validApks.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
    const { apkPath, stat } = validApks[0];
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="PianoCommunity.apk"');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }
    return fs.createReadStream(apkPath).pipe(res);
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
const OSU_OSZ_LRU_MAX = 12;

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
  const parsedScore = parseInt(score, 10) || 0;
  newEntry.player_name = cleanName;
  newEntry.score = parsedScore;

  const existingIdx = currentScores.findIndex(
    s => (s.player_name || '').trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (existingIdx >= 0) {
    if (parsedScore >= (currentScores[existingIdx].score || 0)) {
      currentScores[existingIdx] = newEntry;
    }
  } else {
    currentScores.push(newEntry);
  }

  currentScores.sort((a, b) => b.score - a.score);
  currentScores.forEach((s, idx) => (s.rank = idx + 1));

  const isRecord = newEntry.rank === 1;
  chartScores.set(id, currentScores.slice(0, 50));

  // 1. Sumar puntuación al acumulador Global
  const pKey = cleanName.toLowerCase();
  const globalData = playerGlobalAccumulator.get(pKey) || { name: cleanName, total_score: 0, clefs: 0 };
  globalData.total_score += parsedScore;
  globalData.clefs += Math.floor(parsedScore * 0.00001);
  playerGlobalAccumulator.set(pKey, globalData);

  // 2. Sumar puntuación al torneo Semanal
  const curWeek = getIsoWeekId();
  if (!playerWeeklyAccumulator.has(curWeek)) {
    playerWeeklyAccumulator.set(curWeek, new Map());
  }
  const weekMap = playerWeeklyAccumulator.get(curWeek);
  const weeklyData = weekMap.get(pKey) || { name: cleanName, score: 0 };
  weeklyData.score += parsedScore;
  weekMap.set(pKey, weeklyData);

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
  const requestedWeek = (req.query && req.query.week_id) ? String(req.query.week_id) : currentWeek;
  let weekMap = playerWeeklyAccumulator.get(requestedWeek);
  if ((!weekMap || weekMap.size === 0) && playerWeeklyAccumulator.size > 0) {
    // Si la semana recién empieza o se solicita la última con actividad, usar la semana registrada más reciente
    const allWeeks = Array.from(playerWeeklyAccumulator.keys()).sort();
    const fallbackWeek = allWeeks[allWeeks.length - 1];
    if (requestedWeek !== currentWeek || (weekMap === undefined)) {
      weekMap = playerWeeklyAccumulator.get(fallbackWeek);
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
  res.json({ success: true, message: 'Sincronización completada' });
});

// ==========================================
// 4. Unified Community Search (osu! & Clone Hero)
// ==========================================
app.get(['/api/search', '/api/v1/search', '/api/v1/search/community'], async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.json([]);

  const results = [];
  const qLower = q.toLowerCase();

  // 1. Search local community charts
  for (const c of communityCharts.values()) {
    const score = computeSongRelevanceScore(q, c.title, c.artist, c.creator_name || '');
    if (score >= 35) {
      results.push({ ...c, relevanceScore: score });
    }
  }

  // 2. Query osu! (Todos los modos: Standard, Taiko y Mania) y BeatSaver en paralelo
  const encoded = encodeURIComponent(q);
  const [catboyRes, bsRes] = await Promise.allSettled([
    fetch(`https://catboy.best/api/v2/search?q=${encoded}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4200),
    }).then(r => r.ok ? r.json() : null),
    fetch(`https://api.beatsaver.com/search/text/0?q=${encoded}&sortOrder=Relevance`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4200),
    }).then(r => r.ok ? r.json() : null)
  ]);

  if (catboyRes.status === 'fulfilled' && catboyRes.value) {
    try {
      const data = catboyRes.value;
      const items = Array.isArray(data) ? data : data?.data || [];
      for (const item of items.slice(0, 14)) {
        const setId = item.id;
        if (!setId) continue;

        const title = item.title || 'Sin título';
        const artist = item.artist || 'Desconocido';
        const creator = item.creator || item.user?.username || 'osu! Mapper';
        const covers = item.covers || {};
        const thumbnail = covers.card || covers.cover || `https://assets.ppy.sh/beatmaps/${setId}/covers/card.jpg`;

        const diffs = (item.beatmaps || []).map((b) => {
          const modeNum = b.mode_int ?? b.mode ?? 0;
          const modeTag = (modeNum === 3 || modeNum === 'mania') ? 'Mania' : ((modeNum === 1 || modeNum === 'taiko') ? 'Taiko' : 'Std');
          const baseName = b.version || 'Normal';
          return {
            id: String(b.id),
            name: `${baseName} [${modeTag}]`,
            stars: Math.round((b.difficulty_rating || 3.5) * 10) / 10,
            notes_count: (b.count_circles || 0) + (b.count_sliders || 0) || 100,
            bpm: b.bpm || item.bpm || 120,
          };
        });

        results.push({
          id: `osu_${setId}`,
          title,
          artist,
          creator_name: creator,
          bpm: item.bpm || 120,
          difficulty_name: diffs[0]?.name || 'Normal',
          stars: diffs[0]?.stars || 3.5,
          notes_count: diffs[0]?.notes_count || 100,
          thumbnail,
          source: 'osu',
          source_name: 'osu!',
          source_badge: '[osu!]',
          source_color: '#ff007f',
          download_url: `/api/v1/download/osu/${setId}`,
          direct_download_url: `https://api.nerinyan.moe/d/${setId}?noVideo=true`,
          fallback_download_url: `https://dl.nerinyan.moe/v2/d/${setId}?noVideo=true`,
          difficulties: diffs,
        });
      }
    } catch (_) {}
  }

  if (bsRes.status === 'fulfilled' && bsRes.value) {
    try {
      const docs = Array.isArray(bsRes.value?.docs) ? bsRes.value.docs : [];
      for (const doc of docs.slice(0, 12)) {
        const bsId = doc.id;
        const latestVer = Array.isArray(doc.versions) && doc.versions.length > 0 ? doc.versions[0] : null;
        if (!bsId || !latestVer) continue;
        const hash = String(latestVer.hash || '').toLowerCase();
        const directZipUrl = latestVer.downloadURL || (hash ? `https://cdn.beatsaver.com/${hash}.zip` : '');
        if (!directZipUrl) continue;

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
    } catch (_) {}
  }

  for (const item of results) {
    if (typeof item.relevanceScore !== 'number') {
      item.relevanceScore = computeSongRelevanceScore(q, item.title, item.artist, item.creator_name || '');
    }
  }
  results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  res.json(results);
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
      } else if (file.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      }
      res.setHeader('Cache-Control', 'public, max-age=86400');
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

// Serve / and /game.html directly with no-cache headers
app.get(['/', '/game.html', '/index.html'], (req, res) => {
  const fileToServe = resolveLatestGameHtmlPath();

  if (fs.existsSync(fileToServe)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(fileToServe);
  }
  res.status(404).send('index.html no encontrado.');
});

// Static assets mounted at /static
app.use(
  '/static',
  express.static(STATIC_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css') || filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.apk')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  })
);

// Root fallback static file serving (for /style.css, /game.js, /favicon.ico, etc.)
app.use(
  express.static(STATIC_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css') || filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.apk')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  })
);

// 404 fallback to index.html for client-side routing
app.use((req, res) => {
  const fileToServe = resolveLatestGameHtmlPath();
  if (fs.existsSync(fileToServe)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(fileToServe);
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
async function syncCommunityChartsToGithub() {
  if (!GITHUB_TOKEN) return;
  try {
    const list = Array.from(communityCharts.values()).filter(c => !c.id.startsWith('comm_camilo') && !c.id.startsWith('comm_renacer'));
    const jsonStr = JSON.stringify(list, null, 2);
    const base64Content = Buffer.from(jsonStr).toString('base64');
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/community_charts.json`;
    
    const payload = {
      message: `Update community charts [skip ci]`,
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
