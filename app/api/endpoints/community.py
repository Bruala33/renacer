import os
import json
import time
import math
import sqlite3
import shutil
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Response, status
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field

logger = logging.getLogger("beatstar_api.community")
router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
COMMUNITY_DATA_DIR = os.path.join(BASE_DIR, "data", "community")
COMMUNITY_UPLOADS_DIR = os.path.join(BASE_DIR, "uploads", "community")
DB_PATH = os.path.join(COMMUNITY_DATA_DIR, "community.db")

os.makedirs(COMMUNITY_DATA_DIR, exist_ok=True)
os.makedirs(COMMUNITY_UPLOADS_DIR, exist_ok=True)


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS creators (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE,
                followers_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS community_charts (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                creator_id TEXT NOT NULL,
                creator_name TEXT NOT NULL,
                bpm REAL DEFAULT 120.0,
                offset_ms INTEGER DEFAULT 0,
                difficulty_name TEXT DEFAULT 'Normal',
                stars REAL DEFAULT 3.5,
                scroll_duration_ms INTEGER DEFAULT 1400,
                notes_count INTEGER DEFAULT 0,
                audio_filename TEXT,
                chart_filename TEXT,
                rating_avg REAL DEFAULT 0.0,
                votes_count INTEGER DEFAULT 0,
                sync_avg REAL DEFAULT 100.0,
                sync_votes_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chart_ratings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chart_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                rating INTEGER NOT NULL,
                sync_pct REAL DEFAULT 100.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(chart_id, user_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS creator_follows (
                creator_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (creator_id, user_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS song_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chart_id TEXT NOT NULL,
                player_name TEXT NOT NULL,
                score INTEGER NOT NULL,
                max_combo INTEGER DEFAULT 0,
                stars INTEGER DEFAULT 0,
                accuracy_pct REAL DEFAULT 100.0,
                medal_tier TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_song_scores_chart ON song_scores(chart_id, score DESC)
        """)

        # Check if we should seed default charts
        cursor.execute("SELECT COUNT(*) as cnt FROM community_charts")
        count = cursor.fetchone()["cnt"]
        if count == 0:
            seed_initial_community_data(cursor)
        conn.commit()


def seed_initial_community_data(cursor):
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    creators = [
        ("cr_master", "PianoMaster", 328, now),
        ("cr_neon", "NeonCharter", 195, now),
        ("cr_chopin", "ChopinGamer", 142, now),
    ]
    cursor.executemany(
        "INSERT OR IGNORE INTO creators (id, name, followers_count, created_at) VALUES (?, ?, ?, ?)",
        creators
    )

    charts = [
        (
            "comm_galaxy_anthem",
            "Galaxy Anthem (Community 3K)",
            "Kowalski",
            "cr_master",
            "PianoMaster",
            128.0,
            0,
            "Media",
            3.5,
            1400,
            140,
            "galaxy_anthem.mp3",
            "galaxy_anthem.json",
            4.85,
            42,
            98.5,
            42,
            now
        ),
        (
            "comm_cyber_frenzy",
            "Cyber Frenzy",
            "SynthRider",
            "cr_neon",
            "NeonCharter",
            150.0,
            -15,
            "Difícil",
            5.5,
            1100,
            210,
            "cyber_frenzy.mp3",
            "cyber_frenzy.json",
            4.92,
            64,
            97.0,
            64,
            now
        ),
        (
            "comm_moonlight_flow",
            "Moonlight Groove",
            "Aethel",
            "cr_chopin",
            "ChopinGamer",
            108.0,
            10,
            "Fácil",
            2.0,
            1750,
            88,
            "moonlight_groove.mp3",
            "moonlight_groove.json",
            4.70,
            28,
            99.0,
            28,
            now
        ),
    ]

    cursor.executemany("""
        INSERT INTO community_charts (
            id, title, artist, creator_id, creator_name, bpm, offset_ms,
            difficulty_name, stars, scroll_duration_ms, notes_count,
            audio_filename, chart_filename, rating_avg, votes_count,
            sync_avg, sync_votes_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, charts)


init_db()


class RateChartRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Valoración de la pista de 1 a 5 estrellas")
    sync_pct: Optional[float] = Field(100.0, ge=0.0, le=100.0, description="Porcentaje o calidad de sincronización")
    user_id: Optional[str] = Field("anon_player", description="Identificador anónimo del jugador")


class FollowCreatorRequest(BaseModel):
    user_id: str = Field(..., description="ID del usuario seguidor")
    action: Optional[str] = Field("toggle", description="'follow', 'unfollow', o 'toggle'")


@router.post("/charts/publish")
async def publish_community_chart(
    title: str = Form(...),
    artist: str = Form(...),
    creator_name: str = Form(...),
    creator_id: Optional[str] = Form(None),
    bpm: float = Form(120.0),
    offset_ms: int = Form(0),
    difficulty_name: str = Form("Media"),
    stars: float = Form(3.5),
    scroll_duration_ms: int = Form(1400),
    audio_file: Optional[UploadFile] = File(None),
    chart_file: Optional[UploadFile] = File(None),
    chart_json: Optional[str] = Form(None),
):
    """
    Publica una pista rítmica en la nube de la comunidad.
    Recibe metadatos, audio y estructura de notas en JSON.
    """
    title_clean = title.strip() or "Pista Comunitaria"
    artist_clean = artist.strip() or "Autor Desconocido"
    creator_name_clean = creator_name.strip() or "Anónimo"

    # Generar o reutilizar ID de creador
    cid = creator_id.strip() if (creator_id and creator_id.strip()) else f"cr_{abs(hash(creator_name_clean)) % 1000000}"

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT OR IGNORE INTO creators (id, name, followers_count) VALUES (?, ?, 0)",
            (cid, creator_name_clean)
        )
        conn.commit()

    chart_id = f"comm_{int(time.time())}_{abs(hash(title_clean)) % 10000}"
    chart_dir = os.path.join(COMMUNITY_UPLOADS_DIR, chart_id)
    os.makedirs(chart_dir, exist_ok=True)

    # 1. Guardar archivo de audio
    audio_filename = "audio.mp3"
    if audio_file and audio_file.filename:
        ext = os.path.splitext(audio_file.filename)[1].lower() or ".mp3"
        audio_filename = f"audio{ext}"
        dest_audio = os.path.join(chart_dir, audio_filename)
        with open(dest_audio, "wb") as f:
            shutil.copyfileobj(audio_file.file, f)
    else:
        # Fallback si no subieron audio nuevo
        dest_audio = os.path.join(chart_dir, audio_filename)
        with open(dest_audio, "wb") as f:
            f.write(b"")

    # 2. Guardar archivo del chart
    notes_count = 0
    chart_filename = "chart.json"
    chart_data = None

    if chart_json and chart_json.strip():
        try:
            chart_data = json.loads(chart_json)
        except Exception:
            chart_data = None

    if not chart_data and chart_file and chart_file.filename:
        try:
            content = await chart_file.read()
            chart_data = json.loads(content.decode("utf-8"))
        except Exception:
            chart_data = None

    if chart_data:
        raw_notes = chart_data.get("notes", [])
        notes_count = len(raw_notes)
        dest_chart = os.path.join(chart_dir, chart_filename)
        with open(dest_chart, "w", encoding="utf-8") as f:
            json.dump(chart_data, f, ensure_ascii=False, indent=2)

    # 3. Guardar registro en base de datos
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO community_charts (
                id, title, artist, creator_id, creator_name, bpm, offset_ms,
                difficulty_name, stars, scroll_duration_ms, notes_count,
                audio_filename, chart_filename, rating_avg, votes_count,
                sync_avg, sync_votes_count, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 1, 100.0, 1, ?)
        """, (
            chart_id, title_clean, artist_clean, cid, creator_name_clean,
            float(bpm), int(offset_ms), str(difficulty_name), float(stars),
            int(scroll_duration_ms), notes_count, audio_filename, chart_filename, now_str
        ))
        # Registrar voto inicial del propio creador
        cur.execute("""
            INSERT OR REPLACE INTO chart_ratings (chart_id, user_id, rating, sync_pct, created_at)
            VALUES (?, ?, 5, 100.0, ?)
        """, (chart_id, cid, now_str))
        conn.commit()

    return {
        "status": "success",
        "chart_id": chart_id,
        "message": f"¡Pista '{title_clean}' publicada exitosamente en la comunidad!",
        "creator": {
            "id": cid,
            "name": creator_name_clean
        }
    }


@router.get("/charts/search")
async def search_community_charts(
    q: Optional[str] = Query("", description="Texto para buscar por título, artista o creador"),
    difficulty: Optional[str] = Query("", description="Filtro de dificultad (Fácil, Media, Difícil, Extrema, Insana)"),
    sort: Optional[str] = Query("rating", description="Orden: rating, trending, newest, following"),
    creator_id: Optional[str] = Query("", description="Filtrar por ID de creador"),
    followed_creators: Optional[str] = Query("", description="Lista de IDs de creadores seguidos separados por coma"),
):
    """
    Búsqueda y exploración de canciones subidas por la comunidad.
    """
    conditions = []
    params = []

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        conditions.append("(LOWER(title) LIKE ? OR LOWER(artist) LIKE ? OR LOWER(creator_name) LIKE ?)")
        params.extend([term, term, term])

    if difficulty and difficulty.strip() and difficulty.lower() != "todas":
        conditions.append("LOWER(difficulty_name) = ?")
        params.append(difficulty.strip().lower())

    if creator_id and creator_id.strip():
        conditions.append("creator_id = ?")
        params.append(creator_id.strip())

    if sort == "following" and followed_creators and followed_creators.strip():
        f_list = [c.strip() for c in followed_creators.split(",") if c.strip()]
        if f_list:
            placeholders = ",".join(["?"] * len(f_list))
            conditions.append(f"creator_id IN ({placeholders})")
            params.extend(f_list)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    if sort == "newest":
        order_clause = "ORDER BY created_at DESC"
    elif sort == "trending":
        order_clause = "ORDER BY votes_count DESC, rating_avg DESC"
    else:  # 'rating' default
        order_clause = "ORDER BY rating_avg DESC, votes_count DESC"

    query = f"""
        SELECT id, title, artist, creator_id, creator_name, bpm, offset_ms,
               difficulty_name, stars, scroll_duration_ms, notes_count,
               audio_filename, chart_filename, rating_avg, votes_count,
               sync_avg, sync_votes_count, created_at
        FROM community_charts
        {where_clause}
        {order_clause}
        LIMIT 100
    """

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, params)
        rows = cur.fetchall()

    results = []
    for r in rows:
        cid = r["id"]
        results.append({
            "id": cid,
            "title": r["title"],
            "artist": r["artist"],
            "creator_id": r["creator_id"],
            "creator_name": r["creator_name"],
            "bpm": r["bpm"],
            "offset_ms": r["offset_ms"],
            "difficulty_name": r["difficulty_name"],
            "stars": r["stars"],
            "scroll_duration_ms": r["scroll_duration_ms"],
            "notes_count": r["notes_count"],
            "rating_avg": round(float(r["rating_avg"] or 0.0), 1),
            "votes_count": int(r["votes_count"] or 0),
            "sync_avg": round(float(r["sync_avg"] or 100.0), 1),
            "sync_votes_count": int(r["sync_votes_count"] or 0),
            "created_at": r["created_at"],
            "audio_url": f"/api/v1/community/charts/{cid}/audio",
            "chart_url": f"/api/v1/community/charts/{cid}/chart",
            "source": "community",
            "source_name": "🌍 Comunidad"
        })

    return results


@router.get("/charts/{chart_id}")
async def get_community_chart_details(chart_id: str):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM community_charts WHERE id = ?", (chart_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Canción comunitaria no encontrada.")
        
        return {
            "id": r["id"],
            "title": r["title"],
            "artist": r["artist"],
            "creator_id": r["creator_id"],
            "creator_name": r["creator_name"],
            "bpm": r["bpm"],
            "offset_ms": r["offset_ms"],
            "difficulty_name": r["difficulty_name"],
            "stars": r["stars"],
            "scroll_duration_ms": r["scroll_duration_ms"],
            "notes_count": r["notes_count"],
            "rating_avg": round(float(r["rating_avg"] or 0.0), 1),
            "votes_count": int(r["votes_count"] or 0),
            "sync_avg": round(float(r["sync_avg"] or 100.0), 1),
            "audio_url": f"/api/v1/community/charts/{chart_id}/audio",
            "chart_url": f"/api/v1/community/charts/{chart_id}/chart",
            "created_at": r["created_at"]
        }


@router.get("/charts/{chart_id}/audio")
async def get_community_chart_audio(chart_id: str):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT audio_filename FROM community_charts WHERE id = ?", (chart_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Pista no encontrada.")

    audio_fn = r["audio_filename"] or "audio.mp3"
    file_path = os.path.join(COMMUNITY_UPLOADS_DIR, chart_id, audio_fn)

    # Si no existe archivo propio, fallback al audio de muestra
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        sample_paths = [
            os.path.join(BASE_DIR, "app", "static", "assets", "demo.mp3"),
            os.path.join(BASE_DIR, "app", "static", "assets", "sample.mp3"),
        ]
        for sp in sample_paths:
            if os.path.exists(sp):
                file_path = sp
                break

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo de audio no disponible.")

    content_type = "audio/mpeg"
    if file_path.endswith(".ogg"):
        content_type = "audio/ogg"
    elif file_path.endswith(".wav"):
        content_type = "audio/wav"

    return FileResponse(
        path=file_path,
        media_type=content_type,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400"
        }
    )


@router.get("/charts/{chart_id}/chart")
async def get_community_chart_json(chart_id: str):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM community_charts WHERE id = ?", (chart_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Pista no encontrada.")

    chart_fn = r["chart_filename"] or "chart.json"
    file_path = os.path.join(COMMUNITY_UPLOADS_DIR, chart_id, chart_fn)

    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return JSONResponse(content=data, headers={"Access-Control-Allow-Origin": "*"})
        except Exception as e:
            logger.warning(f"Error reading chart json for {chart_id}: {e}")

    # Estructura de chart sintetizada si es de los mapas semilla o fallback
    bpm = float(r["bpm"] or 120.0)
    stars = float(r["stars"] or 3.5)
    scroll_dur = int(r["scroll_duration_ms"] or 1400)
    diff_name = r["difficulty_name"] or "Media"

    # Generar notas rítmicas coherentes para prueba si el JSON físico no estaba
    sample_notes = []
    beat_ms = (60.0 / bpm) * 1000.0
    for i in range(r["notes_count"] or 60):
        t = round(1600 + i * beat_ms)
        lane = i % 3
        ntype = "tap"
        dur = 0
        direction = "up"
        if i % 8 == 7:
            ntype = "swipe"
            direction = ["up", "down", "left", "right"][i % 4]
        elif i % 5 == 4:
            ntype = "hold"
            dur = round(beat_ms * 1.5)
        
        sample_notes.append({
            "id": i,
            "lane": lane,
            "column": lane,
            "time": t / 1000.0,
            "timestamp_ms": t,
            "type": ntype,
            "duration": dur / 1000.0,
            "duration_ms": dur,
            "direction": direction
        })

    synthesized_package = {
        "id": chart_id,
        "metadata": {
            "id": chart_id,
            "title": r["title"],
            "artist": r["artist"],
            "difficulty_name": diff_name,
            "bpm": bpm,
            "stars": stars
        },
        "bpm": bpm,
        "offset": r["offset_ms"] or 0,
        "scrollDurationMs": scroll_dur,
        "notes": sample_notes,
        "difficulties": [{
            "id": "diff_std",
            "name": diff_name,
            "stars": stars,
            "keys": 3,
            "notes": sample_notes
        }]
    }
    return JSONResponse(content=synthesized_package, headers={"Access-Control-Allow-Origin": "*"})


@router.post("/charts/{chart_id}/rate")
async def rate_community_chart(chart_id: str, req: RateChartRequest):
    """
    Envía una valoración de 1 a 5 estrellas y feedback de sincronización para un mapa comunitario.
    """
    user_id = req.user_id or f"user_{int(time.time())}"
    rating = max(1, min(5, req.rating))
    sync_pct = max(0.0, min(100.0, float(req.sync_pct)))

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM community_charts WHERE id = ?", (chart_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="La pista no existe.")

        # Insertar o actualizar voto del usuario
        cur.execute("""
            INSERT OR REPLACE INTO chart_ratings (chart_id, user_id, rating, sync_pct, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (chart_id, user_id, rating, sync_pct, now_str))

        # Recalcular métricas agregadas
        cur.execute("""
            SELECT COUNT(*) as total_votes,
                   AVG(rating) as avg_rating,
                   AVG(sync_pct) as avg_sync
            FROM chart_ratings
            WHERE chart_id = ?
        """, (chart_id,))
        agg = cur.fetchone()

        new_votes = agg["total_votes"]
        new_rating_avg = round(float(agg["avg_rating"] or rating), 2)
        new_sync_avg = round(float(agg["avg_sync"] or sync_pct), 1)

        cur.execute("""
            UPDATE community_charts
            SET rating_avg = ?, votes_count = ?, sync_avg = ?, sync_votes_count = ?
            WHERE id = ?
        """, (new_rating_avg, new_votes, new_sync_avg, new_votes, chart_id))

        conn.commit()

    return {
        "status": "success",
        "chart_id": chart_id,
        "rating_avg": new_rating_avg,
        "votes_count": new_votes,
        "sync_avg": new_sync_avg,
        "message": f"¡Gracias por calificar la pista con {rating}★ y {new_sync_avg}% de sincronización!"
    }


@router.get("/featured-daily")
async def get_featured_daily_chart():
    """
    Calcula las 3 Canciones Destacadas de Hoy (Desafíos Diarios con 𝄞 x2 Claves):
    - Selecciona las 3 pistas comunitarias con mayor valoración y votos.
    - Fallback: 3 pistas de muestra de alta calidad con bonificación x2.
    """
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM community_charts
            ORDER BY rating_avg DESC, votes_count DESC
            LIMIT 3
        """)
        rows = cur.fetchall()

    featured_list = []
    for r in rows:
        cid = r["id"]
        featured_list.append({
            "id": cid,
            "title": r["title"],
            "artist": r["artist"],
            "creator_id": r["creator_id"],
            "creator_name": r["creator_name"],
            "bpm": r["bpm"],
            "offset_ms": r["offset_ms"],
            "difficulty_name": r["difficulty_name"],
            "stars": r["stars"],
            "scroll_duration_ms": r["scroll_duration_ms"],
            "notes_count": r["notes_count"],
            "rating_avg": round(float(r["rating_avg"] or 0.0), 1),
            "votes_count": int(r["votes_count"] or 0),
            "sync_avg": round(float(r["sync_avg"] or 100.0), 1),
            "audio_url": f"/api/v1/community/charts/{cid}/audio",
            "chart_url": f"/api/v1/community/charts/{cid}/chart",
            "bonus_clefs_multiplier": 2,
            "is_daily_featured": True,
            "source": "community"
        })

    # Si hay menos de 3, rellenar con semillas estáticas de alta calidad
    default_seeds = [
        {
            "id": "comm_galaxy_anthem",
            "title": "Galaxy Anthem (Community 3K)",
            "artist": "Kowalski",
            "creator_id": "cr_master",
            "creator_name": "PianoMaster",
            "difficulty_name": "Media",
            "stars": 3.5,
            "bpm": 128,
            "rating_avg": 4.9,
            "votes_count": 42,
            "sync_avg": 98.5,
            "audio_url": "/api/v1/community/charts/comm_galaxy_anthem/audio",
            "chart_url": "/api/v1/community/charts/comm_galaxy_anthem/chart",
            "bonus_clefs_multiplier": 2,
            "is_daily_featured": True,
            "source": "community"
        },
        {
            "id": "comm_cyber_frenzy",
            "title": "Cyber Frenzy",
            "artist": "SynthRider",
            "creator_id": "cr_neon",
            "creator_name": "NeonCharter",
            "difficulty_name": "Difícil",
            "stars": 5.5,
            "bpm": 150,
            "rating_avg": 4.9,
            "votes_count": 64,
            "sync_avg": 97.0,
            "audio_url": "/api/v1/community/charts/comm_cyber_frenzy/audio",
            "chart_url": "/api/v1/community/charts/comm_cyber_frenzy/chart",
            "bonus_clefs_multiplier": 2,
            "is_daily_featured": True,
            "source": "community"
        },
        {
            "id": "comm_moonlight_flow",
            "title": "Moonlight Groove",
            "artist": "Aethel",
            "creator_id": "cr_chopin",
            "creator_name": "ChopinGamer",
            "difficulty_name": "Fácil",
            "stars": 2.0,
            "bpm": 108,
            "rating_avg": 4.7,
            "votes_count": 28,
            "sync_avg": 99.0,
            "audio_url": "/api/v1/community/charts/comm_moonlight_flow/audio",
            "chart_url": "/api/v1/community/charts/comm_moonlight_flow/chart",
            "bonus_clefs_multiplier": 2,
            "is_daily_featured": True,
            "source": "community"
        }
    ]

    existing_ids = {s["id"] for s in featured_list}
    for seed in default_seeds:
        if len(featured_list) >= 3:
            break
        if seed["id"] not in existing_ids:
            featured_list.append(seed)
            existing_ids.add(seed["id"])

    primary = featured_list[0] if featured_list else default_seeds[0]
    res_dict = dict(primary)
    res_dict["featured"] = featured_list
    return res_dict


@router.get("/creators/{creator_id}")
async def get_creator_profile(creator_id: str):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM creators WHERE id = ? OR name = ?", (creator_id, creator_id))
        creator = cur.fetchone()
        if not creator:
            raise HTTPException(status_code=404, detail="Perfil de creador no encontrado.")

        cur.execute("SELECT COUNT(*) as pub_cnt FROM community_charts WHERE creator_id = ?", (creator["id"],))
        pub_cnt = cur.fetchone()["pub_cnt"]

        return {
            "creator_id": creator["id"],
            "creator_name": creator["name"],
            "followers_count": creator["followers_count"],
            "published_count": pub_cnt,
            "created_at": creator["created_at"]
        }


@router.post("/creators/{creator_id}/follow")
async def follow_creator(creator_id: str, req: FollowCreatorRequest):
    """
    Seguir o dejar de seguir a un creador de pistas comunitarias.
    """
    user_id = req.user_id.strip()
    action = (req.action or "toggle").lower()

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM creators WHERE id = ?", (creator_id,))
        c = cur.fetchone()
        if not c:
            raise HTTPException(status_code=404, detail="Creador no encontrado.")

        cur.execute(
            "SELECT 1 FROM creator_follows WHERE creator_id = ? AND user_id = ?",
            (creator_id, user_id)
        )
        is_following = cur.fetchone() is not None

        if action == "toggle":
            new_following = not is_following
        elif action == "follow":
            new_following = True
        else:
            new_following = False

        if new_following and not is_following:
            cur.execute(
                "INSERT OR IGNORE INTO creator_follows (creator_id, user_id) VALUES (?, ?)",
                (creator_id, user_id)
            )
            cur.execute(
                "UPDATE creators SET followers_count = followers_count + 1 WHERE id = ?",
                (creator_id,)
            )
        elif not new_following and is_following:
            cur.execute(
                "DELETE FROM creator_follows WHERE creator_id = ? AND user_id = ?",
                (creator_id, user_id)
            )
            cur.execute(
                "UPDATE creators SET followers_count = MAX(0, followers_count - 1) WHERE id = ?",
                (creator_id,)
            )

        cur.execute("SELECT followers_count FROM creators WHERE id = ?", (creator_id,))
        updated_count = cur.fetchone()["followers_count"]
        conn.commit()

    return {
        "status": "success",
        "creator_id": creator_id,
        "is_following": new_following,
        "followers_count": updated_count
    }

class SubmitScoreRequest(BaseModel):
    player_name: str
    score: int
    max_combo: int = 0
    stars: int = 0
    accuracy_pct: float = 100.0
    medal_tier: Optional[str] = None


@router.post("/charts/{chart_id}/score")
async def submit_chart_score(chart_id: str, data: SubmitScoreRequest):
    """
    Registra una puntuación online de un jugador para una canción determinada.
    """
    clean_name = data.player_name.strip() or "Jugador"
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO song_scores (chart_id, player_name, score, max_combo, stars, accuracy_pct, medal_tier)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (chart_id, clean_name, data.score, data.max_combo, data.stars, data.accuracy_pct, data.medal_tier))
        conn.commit()

        cur.execute("""
            SELECT COUNT(*) as rank FROM song_scores WHERE chart_id = ? AND score >= ?
        """, (chart_id, data.score))
        rank = cur.fetchone()["rank"]

    return {
        "status": "success",
        "chart_id": chart_id,
        "player_name": clean_name,
        "score": data.score,
        "rank": rank
    }


@router.get("/charts/{chart_id}/leaderboard")
async def get_chart_leaderboard(chart_id: str, limit: int = Query(20, ge=1, le=100)):
    """
    Obtiene las mejores puntuaciones registradas para una pista específica.
    """
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT player_name, score, max_combo, stars, accuracy_pct, medal_tier, created_at
            FROM song_scores
            WHERE chart_id = ?
            ORDER BY score DESC
            LIMIT ?
        """, (chart_id, limit))
        rows = [dict(r) for r in cur.fetchall()]

    return {
        "chart_id": chart_id,
        "leaderboard": rows
    }


@router.get("/leaderboards/global")
async def get_global_leaderboard(limit: int = Query(25, ge=1, le=100)):
    """
    Tabla de clasificación global de jugadores con mayor puntuación acumulada.
    """
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT player_name, SUM(score) as total_score, COUNT(*) as songs_played, MAX(score) as best_score
            FROM song_scores
            GROUP BY player_name
            ORDER BY total_score DESC
            LIMIT ?
        """, (limit,))
        rows = [dict(r) for r in cur.fetchall()]

    return {
        "global_leaderboard": rows
    }

