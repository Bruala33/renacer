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

// Mapas permanentes para acumuladores de puntos
const playerGlobalAccumulator = new Map();
const playerWeeklyAccumulator = new Map();

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

  return {
    songs: songsObj,
    global: globalList,
    weekly: {
      week_id: currentWeek,
      players: weeklyList
    }
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
      rating_avg: 5.0,
      votes_count: 142,
      sync_avg: 100.0,
      sync_votes_count: 142,
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
      rating_avg: 5.0,
      votes_count: 48,
      sync_avg: 100.0,
      sync_votes_count: 48,
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
      rating_avg: 4.9,
      votes_count: 35,
      sync_avg: 98.0,
      sync_votes_count: 35,
      created_at: '2026-01-05 15:30:00',
    },
    {
      id: 'comm_cyber_frenzy',
      folder: 'comm_cyber_frenzy',
      title: 'Cyber Frenzy',
      artist: 'SynthRider',
      creator_id: 'creator_synth',
      creator_name: 'SynthRider',
      bpm: 140.0,
      offset_ms: 0,
      difficulty_name: 'Experto',
      stars: 6.0,
      scroll_duration_ms: 1200,
      notes_count: 120,
      rating_avg: 4.8,
      votes_count: 28,
      sync_avg: 99.0,
      sync_votes_count: 28,
      created_at: '2026-01-10 18:00:00',
    },
    {
      id: 'comm_galaxy_anthem',
      folder: 'comm_galaxy_anthem',
      title: 'Galaxy Anthem',
      artist: 'Kowalski',
      creator_id: 'creator_kowalski',
      creator_name: 'Kowalski',
      bpm: 128.0,
      offset_ms: 0,
      difficulty_name: 'Difícil',
      stars: 4.5,
      scroll_duration_ms: 1400,
      notes_count: 120,
      rating_avg: 4.7,
      votes_count: 22,
      sync_avg: 97.0,
      sync_votes_count: 22,
      created_at: '2026-01-12 20:00:00',
    },
    {
      id: 'comm_moonlight_flow',
      folder: 'comm_moonlight_flow',
      title: 'Moonlight Flow',
      artist: 'Nocturne',
      creator_id: 'creator_nocturne',
      creator_name: 'Nocturne',
      bpm: 110.0,
      offset_ms: 0,
      difficulty_name: 'Fácil',
      stars: 2.5,
      scroll_duration_ms: 1600,
      notes_count: 95,
      rating_avg: 4.8,
      votes_count: 18,
      sync_avg: 99.0,
      sync_votes_count: 18,
      created_at: '2026-01-15 10:00:00',
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

    // Initial sample leaderboard
    chartScores.set(item.id, [
      {
        rank: 1,
        player_name: 'killer',
        score: 121983,
        max_combo: item.notes_count,
        stars: item.stars,
        accuracy_pct: 96.8,
        medal_tier: 'diamond',
        created_at: '2026-02-01 10:00:00',
      },
      {
        rank: 2,
        player_name: 'Fernando',
        score: 954032,
        max_combo: Math.floor(item.notes_count * 0.9),
        stars: item.stars,
        accuracy_pct: 88.2,
        medal_tier: 'platinum',
        created_at: '2026-02-02 11:30:00',
      },
      {
        rank: 3,
        player_name: 'Lidia',
        score: 9122233,
        max_combo: Math.floor(item.notes_count * 0.85),
        stars: item.stars,
        accuracy_pct: 96.5,
        medal_tier: 'gold',
        created_at: '2026-02-03 14:00:00',
      },
    ]);
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
              rating_avg: 5.0,
              votes_count: 5,
              sync_avg: 100.0,
              sync_votes_count: 5,
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
    version_code: 6,
    version_name: '1.3.2',
    release_notes: 'Piano Community Web & Offline Player. Sincronización comunitaria y soporte osu! Mania / Clone Hero.',
    download_url: '/download/apk',
  });
});

app.all(['/download/apk', '/api/v1/app/download_apk'], (req, res) => {
  const apkCandidates = [
    path.join(__dirname, 'PianoCommunity.apk'),
    path.join(__dirname, 'downloads', 'PianoCommunity.apk'),
    path.join(STATIC_DIR, 'PianoCommunity.apk'),
    path.join(STATIC_DIR, 'downloads', 'PianoCommunity.apk'),
    path.join(__dirname, 'beatstar.apk'),
    path.join(STATIC_DIR, 'beatstar.apk'),
    path.join(__dirname, 'downloads', 'beatstar.apk'),
    path.join(STATIC_DIR, 'downloads', 'beatstar.apk'),
    path.join(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
    path.join(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
  ];
  for (const apkPath of apkCandidates) {
    if (fs.existsSync(apkPath)) {
      if (req.method === 'HEAD') {
        const stat = fs.statSync(apkPath);
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Length', stat.size);
        return res.status(200).end();
      }
      return res.download(apkPath, 'PianoCommunity.apk');
    }
  }

  if (req.method === 'HEAD') {
    return res.status(404).end();
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(404).json({
      available: false,
      error: 'APK aún no generado en este servidor web.',
      info: 'Instala la app como PWA o compila localmente con build_android.bat'
    });
  }

  // Página web amigable si se abre en el navegador directamente
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Descarga APK - Piano Community</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #07050a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background: #16111d; border: 1px solid #3d324c; border-radius: 18px; padding: 28px 24px; max-width: 440px; text-align: center; box-shadow: 0 16px 40px rgba(0,0,0,0.8); }
        h1 { color: #f5dc8c; font-size: 20px; margin: 0 0 12px; }
        p { color: #c4b9d0; font-size: 13.5px; line-height: 1.6; margin: 0 0 18px; }
        .btn { display: inline-block; width: 100%; box-sizing: border-box; padding: 14px; margin-bottom: 10px; border-radius: 12px; font-weight: bold; font-size: 14px; text-decoration: none; cursor: pointer; transition: 0.15s; }
        .btn-gold { background: linear-gradient(180deg, #f5dc8c, #c4942e); color: #171004; }
        .btn-secondary { background: rgba(255,255,255,0.08); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.15); }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🎹 Piano Community Android</h1>
        <p>El archivo APK nativo aún no ha sido subido o compilado en esta instancia de hosting. ¡Puedes jugar ahora mismo a pantalla completa de 2 maneras:</p>
        <a class="btn btn-gold" href="/">Jugar en la Web / Instalar PWA</a>
        <a class="btn btn-secondary" href="https://github.com/Bruala33/renacer" target="_blank" rel="noopener">Ver Repositorio & Código</a>
        <p style="font-size: 11px; color: #8a7c9d; margin-top: 14px; margin-bottom: 0;">Para compilar el APK nativo: clona el repositorio y ejecuta <code>build_android.bat</code> en Windows.</p>
      </div>
    </body>
    </html>
  `);
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
// Featured daily tracks - Filtradas por valoraciones de las últimas 48h
app.get('/api/v1/community/featured', (req, res) => {
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const chartsWithStats = Array.from(communityCharts.values()).map(chart => {
    const ratings = chartRatings.get(chart.id) || [];
    const recentRatings = ratings.filter(r => (now - (r.timestamp || 0)) <= TWENTY_FOUR_HOURS_MS);

    if (recentRatings.length > 0) {
      const totalStars = recentRatings.reduce((sum, r) => sum + (r.rating || 5), 0);
      const avgStars = Math.round((totalStars / recentRatings.length) * 10) / 10;
      return {
        ...chart,
        rating_avg: avgStars,
        votes_count: recentRatings.length,
        has_recent_votes: true
      };
    }
    return {
      ...chart,
      has_recent_votes: false
    };
  });

  // Priorizar estrictamente canciones con votos en las últimas 24h; si hay menos de 3, complementar con las mejor valoradas en general
  chartsWithStats.sort((a, b) => {
    if (a.has_recent_votes && !b.has_recent_votes) return -1;
    if (!a.has_recent_votes && b.has_recent_votes) return 1;
    return (b.rating_avg || 0) - (a.rating_avg || 0) || (b.votes_count || 0) - (a.votes_count || 0);
  });

  res.json(chartsWithStats.slice(0, 6));
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
// 4b. Proxies de Descarga Robusta (osu! y Clone Hero)
// ==========================================
app.get(['/api/v1/download/osu/:setId', '/api/v1/osu/download/:setId'], async (req, res) => {
  const rawId = (req.params.setId || '').toString().replace(/^osu_/, '').trim();
  if (!rawId || !/^\d+$/.test(rawId)) {
    return res.status(400).json({ error: 'ID de beatmap de osu! inválido' });
  }

  const mirrors = [
    `https://api.nerinyan.moe/d/${rawId}?noVideo=true`,
    `https://dl.nerinyan.moe/v2/d/${rawId}?noVideo=true`,
    `https://txy1.sayobot.cn/beatmaps/download/mini/${rawId}`,
    `https://dl.sayobot.cn/beatmaps/download/mini/${rawId}`
  ];

  for (const mirrorUrl of mirrors) {
    try {
      const resp = await fetch(mirrorUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(22000)
      });

      if (resp.ok) {
        const ct = resp.headers.get('content-type') || 'application/x-osu-beatmap-archive';
        const cl = resp.headers.get('content-length');
        res.setHeader('Content-Type', ct);
        if (cl) res.setHeader('Content-Length', cl);
        res.setHeader('Content-Disposition', `attachment; filename="${rawId}.osz"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');

        const { Readable } = await import('stream');
        Readable.fromWeb(resp.body).pipe(res);
        return;
      }
    } catch (err) {
      console.warn(`[Proxy Download] Mirror ${mirrorUrl} falló:`, err.message);
    }
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
  const weekMap = playerWeeklyAccumulator.get(currentWeek) || new Map();
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

  res.json({
    success: true,
    weekly_leaderboard: weeklyScores,
    leaderboard: weeklyScores,
    week_id: currentWeek,
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

  // 2. Query osu! Mania (Catboy)
  try {
    const encoded = encodeURIComponent(q);
    const catboyResp = await fetch(`https://catboy.best/api/v2/search?q=${encoded}&m=3`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4000),
    });

    if (catboyResp.ok) {
      const data = await catboyResp.json();
      const items = Array.isArray(data) ? data : data?.data || [];
      for (const item of items.slice(0, 10)) {
        const setId = item.id;
        if (!setId) continue;

        const title = item.title || 'Sin título';
        const artist = item.artist || 'Desconocido';
        const creator = item.creator || item.user?.username || 'osu! Mapper';
        const covers = item.covers || {};
        const thumbnail = covers.card || covers.cover || `https://assets.ppy.sh/beatmaps/${setId}/covers/card.jpg`;

        const diffs = (item.beatmaps || []).map((b) => ({
          id: b.id,
          name: b.version || 'Mania',
          stars: Math.round((b.difficulty_rating || 3.5) * 10) / 10,
          notes_count: (b.count_circles || 0) + (b.count_sliders || 0) || 100,
          bpm: b.bpm || item.bpm || 120,
        }));

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
          source_name: 'osu! Mania',
          download_url: `/api/v1/download/osu/${setId}`,
          direct_download_url: `https://api.nerinyan.moe/d/${setId}?noVideo=true`,
          fallback_download_url: `https://dl.nerinyan.moe/v2/d/${setId}?noVideo=true`,
          difficulties: diffs,
        });
      }
    }
  } catch (err) {
    // Non-blocking fallback
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
// Serve / and /game.html directly with no-cache headers
app.get(['/', '/game.html', '/index.html'], (req, res) => {
  const indexPath = path.join(STATIC_DIR, 'game.html');
  const fallbackPath = path.join(STATIC_DIR, 'index.html');
  const fileToServe = fs.existsSync(indexPath) ? indexPath : fallbackPath;

  if (fs.existsSync(fileToServe)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(fileToServe);
  }
  res.status(404).send('game.html no encontrado.');
});

// Static assets mounted at /static
app.use(
  '/static',
  express.static(STATIC_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css') || filePath.endsWith('.js') || filePath.endsWith('.html')) {
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
      if (filePath.endsWith('.css') || filePath.endsWith('.js') || filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  })
);

// 404 fallback to game.html for client-side routing
app.use((req, res) => {
  const indexPath = path.join(STATIC_DIR, 'game.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(indexPath);
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
