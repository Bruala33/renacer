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

// In-memory data store for community charts, ratings, and leaderboards
const communityCharts = new Map();
const chartScores = new Map();
const chartRatings = new Map();
const followedCreators = new Set();
const players = new Map();

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
        player_name: 'MasterPianist',
        score: 100000,
        max_combo: item.notes_count,
        stars: item.stars,
        accuracy_pct: 99.8,
        medal_tier: 'diamond',
        created_at: '2026-02-01 10:00:00',
      },
      {
        rank: 2,
        player_name: 'RhythmHero',
        score: 95400,
        max_combo: Math.floor(item.notes_count * 0.9),
        stars: item.stars,
        accuracy_pct: 98.2,
        medal_tier: 'platinum',
        created_at: '2026-02-02 11:30:00',
      },
      {
        rank: 3,
        player_name: 'BeatMaster',
        score: 91200,
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

// Search community tracks
app.get('/api/v1/community/charts/search', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase().trim();
  const difficulty = (req.query.difficulty || '').toString().toLowerCase().trim();
  const sort = (req.query.sort || 'rating').toString().toLowerCase().trim();
  const creator_id = (req.query.creator_id || '').toString().trim();

  let results = Array.from(communityCharts.values());

  if (q) {
    results = results.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.artist?.toLowerCase().includes(q) ||
        c.creator_name?.toLowerCase().includes(q)
    );
  }

  if (difficulty && difficulty !== 'todas') {
    results = results.filter((c) => c.difficulty_name?.toLowerCase() === difficulty);
  }

  if (creator_id) {
    results = results.filter((c) => c.creator_id === creator_id);
  }

  if (sort === 'newest') {
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

  chartScores.set(id, currentScores.slice(0, 50));
  saveScoresToDisk();

  res.json({
    success: true,
    rank: newEntry.rank,
    is_new_record: newEntry.rank === 1,
    total_players: currentScores.length,
    entry: newEntry
  });
});

// Chart Leaderboard (Compatible tanto con .leaderboard como array directo)
app.get(['/api/v1/community/charts/:id/leaderboard', '/api/v1/community/charts/:id/leaderboards'], (req, res) => {
  const id = req.params.id;
  const scores = chartScores.get(id) || [];
  res.json({
    success: true,
    leaderboard: scores,
    scores: scores,
    total: scores.length
  });
});

// Global Leaderboard (Compatible con /leaderboard/global y /leaderboards/global)
app.get(['/api/v1/community/leaderboard/global', '/api/v1/community/leaderboards/global'], (req, res) => {
  const playerMap = new Map();
  chartScores.forEach((scores) => {
    scores.forEach((s) => {
      const pKey = (s.player_name || 'Jugador').trim().toLowerCase();
      if (!playerMap.has(pKey) || (s.score || 0) > (playerMap.get(pKey).score || 0)) {
        playerMap.set(pKey, s);
      }
    });
  });
  const allScores = Array.from(playerMap.values());
  allScores.sort((a, b) => b.score - a.score);
  allScores.forEach((s, idx) => (s.rank = idx + 1));
  const topScores = allScores.slice(0, 50);

  res.json({
    success: true,
    global_leaderboard: topScores,
    leaderboard: topScores,
    total: allScores.length
  });
});

// Weekly Leaderboard (Torneo Semanal: Lunes 00:00:00 a Domingo 23:59:59 UTC)
app.get(['/api/v1/community/leaderboard/weekly', '/api/v1/community/leaderboards/weekly'], (req, res) => {
  const now = new Date();
  const day = now.getUTCDay(); // 0 es Domingo, 1 es Lunes
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);

  const sundayEnd = new Date(monday);
  sundayEnd.setUTCDate(monday.getUTCDate() + 6);
  sundayEnd.setUTCHours(23, 59, 59, 999);

  const mondayMs = monday.getTime();
  const sundayMs = sundayEnd.getTime();

  const playerWeeklyMap = new Map();
  chartScores.forEach((scores, cId) => {
    scores.forEach(s => {
      const sTime = s.timestamp || (s.created_at ? new Date(s.created_at).getTime() : 0);
      if (sTime >= mondayMs && sTime <= sundayMs) {
        const pKey = (s.player_name || 'Jugador').trim().toLowerCase();
        if (!playerWeeklyMap.has(pKey) || (s.score || 0) > (playerWeeklyMap.get(pKey).score || 0)) {
          playerWeeklyMap.set(pKey, { ...s, chart_id: s.chart_id || cId });
        }
      }
    });
  });

  const weeklyScores = Array.from(playerWeeklyMap.values());
  weeklyScores.sort((a, b) => b.score - a.score);
  weeklyScores.forEach((s, idx) => (s.rank = idx + 1));
  const topWeekly = weeklyScores.slice(0, 50);

  res.json({
    success: true,
    weekly_leaderboard: topWeekly,
    leaderboard: topWeekly,
    week_start: monday.toISOString(),
    week_end: sundayEnd.toISOString(),
    current_time: now.toISOString(),
    time_remaining_ms: Math.max(0, sundayMs - now.getTime()),
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
    if (
      c.title?.toLowerCase().includes(qLower) ||
      c.artist?.toLowerCase().includes(qLower) ||
      c.creator_name?.toLowerCase().includes(qLower)
    ) {
      results.push(c);
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
