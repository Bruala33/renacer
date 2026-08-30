import os
import re
import json
import asyncio
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import yt_dlp

from app.services.downloader import AudioDownloader

logger = logging.getLogger("beatstar_api.playlists")

try:
    from ytmusicapi import YTMusic
    YTMUSIC_AVAILABLE = True
except ImportError:
    YTMUSIC_AVAILABLE = False

router = APIRouter()

_ytm_client: Optional[Any] = None

def get_ytmusic():
    global _ytm_client
    if not YTMUSIC_AVAILABLE:
        return None
    if _ytm_client is None:
        try:
            _ytm_client = YTMusic()
        except Exception as e:
            logger.warning(f"Failed to initialize YTMusic: {e}")
            _ytm_client = None
    return _ytm_client

class ImportUrlRequest(BaseModel):
    url: str

@router.get("/ytmusic/status")
async def get_ytmusic_status():
    return {
        "available": YTMUSIC_AVAILABLE,
        "mode": "public"
    }

@router.get("/ytmusic/search")
async def search_ytmusic_playlists(q: str = Query(..., min_length=1)):
    """
    Busca playlists públicas en YouTube / YouTube Music por palabras clave.
    """
    q_str = q.strip()
    if not q_str:
        return []

    yt = get_ytmusic()
    playlists = []

    if yt:
        try:
            def do_search():
                return yt.search(query=q_str, filter="playlists", limit=15)
            
            raw_items = await asyncio.to_thread(do_search)
            for item in raw_items:
                browse_id = item.get("browseId") or item.get("playlistId")
                if not browse_id:
                    continue
                clean_id = browse_id.replace("VL", "")
                
                # Get best thumbnail
                thumbs = item.get("thumbnails", [])
                thumb_url = thumbs[-1]["url"] if thumbs else f"https://i.ytimg.com/vi/hqdefault.jpg"
                
                # Author
                artists = item.get("artists", [])
                author = item.get("author") or (artists[0]["name"] if artists else "YouTube")
                
                count = item.get("itemCount") or item.get("count") or "Varios"
                if isinstance(count, str) and not count.endswith("temas") and not count.endswith("canciones"):
                    count_label = f"{count} temas"
                else:
                    count_label = f"{count}" if count else "Playlist"

                playlists.append({
                    "id": clean_id,
                    "title": item.get("title") or "Playlist",
                    "author": author,
                    "item_count": count_label,
                    "thumbnail": thumb_url,
                    "url": f"https://www.youtube.com/playlist?list={clean_id}"
                })
        except Exception as e:
            logger.warning(f"Error searching playlists with ytmusic: {e}")

    # Fallback to yt-dlp search if empty
    if not playlists:
        try:
            ydl_opts = {
                'extract_flat': True,
                'skip_download': True,
                'quiet': True
            }
            def do_ydl_search():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    return ydl.extract_info(f"ytsearch10:{q_str}", download=False)
            
            search_info = await asyncio.to_thread(do_ydl_search)
            for entry in search_info.get('entries', [])[:10]:
                if entry and entry.get('id'):
                    playlists.append({
                        "id": entry.get('id'),
                        "title": entry.get('title') or "Canción / Mix",
                        "author": entry.get('uploader') or "YouTube",
                        "item_count": "1 tema",
                        "thumbnail": f"https://i.ytimg.com/vi/{entry.get('id')}/hqdefault.jpg",
                        "url": f"https://www.youtube.com/watch?v={entry.get('id')}"
                    })
        except Exception as e:
            logger.warning(f"Error searching with yt-dlp fallback: {e}")

    return playlists

@router.post("/ytmusic/import_url")
async def import_playlist_by_url(req: ImportUrlRequest):
    """
    Extrae hasta 500 pistas reales con títulos, artistas y miniaturas desde cualquier enlace o ID de YouTube / YouTube Music.
    """
    url_or_id = req.url.strip()
    if not url_or_id:
        raise HTTPException(status_code=400, detail="Por favor proporciona una URL o ID de playlist.")

    playlist_id_match = re.search(r"[?&]list=([a-zA-Z0-9_-]+)", url_or_id)
    playlist_id = playlist_id_match.group(1) if playlist_id_match else url_or_id
    clean_id = playlist_id.replace("VL", "")

    tracks = []
    title = "Playlist de YouTube"

    # 1. Primary extraction with ytmusicapi
    yt = get_ytmusic()
    if yt:
        try:
            def fetch_ytm():
                try:
                    return yt.get_playlist(clean_id, limit=500)
                except Exception:
                    return yt.get_watch_playlist(playlistId=clean_id, limit=500)

            data = await asyncio.to_thread(fetch_ytm)
            if data:
                title = data.get("title") or title
                raw_tracks = data.get("tracks", [])
                for t in raw_tracks:
                    vid = t.get("videoId")
                    if not vid:
                        continue
                    t_title = t.get("title") or "Sin título"
                    artists = [a.get("name") for a in t.get("artists", []) if a.get("name")]
                    artist_str = ", ".join(artists) if artists else "YouTube"
                    dur = int(t.get("duration_seconds") or 0)
                    
                    # Thumbnail
                    thumbs = t.get("thumbnails", [])
                    thumb_url = thumbs[-1]["url"] if thumbs else f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"

                    tracks.append({
                        "id": vid,
                        "title": t_title,
                        "artist": artist_str,
                        "artists": [artist_str],
                        "duration_seconds": dur,
                        "thumbnail": thumb_url
                    })
        except Exception as e:
            logger.warning(f"ytmusic extraction failed for {clean_id}: {e}")

    # 2. Fallback extraction with yt-dlp
    if not tracks:
        target_url = f"https://www.youtube.com/playlist?list={clean_id}" if not url_or_id.startswith("http") else url_or_id
        ydl_opts = AudioDownloader.get_base_ydl_opts()
        ydl_opts.update({
            'noplaylist': False,
            'extract_flat': 'in_playlist',
            'skip_download': True,
            'playlistend': 500,
            'ignoreerrors': True,
        })
        try:
            def fetch_ydl():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    return ydl.extract_info(target_url, download=False)

            info = await asyncio.to_thread(fetch_ydl)
            if info:
                title = info.get('title') or title
                for entry in info.get('entries', []):
                    if not entry:
                        continue
                    vid_id = entry.get('id')
                    if not vid_id:
                        continue
                    tracks.append({
                        "id": vid_id,
                        "title": entry.get('title') or "Sin título",
                        "artist": entry.get('uploader') or entry.get('channel') or "YouTube",
                        "artists": [entry.get('uploader') or entry.get('channel') or "YouTube"],
                        "duration_seconds": int(entry.get('duration') or 0),
                        "thumbnail": f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg"
                    })
        except Exception as e:
            logger.warning(f"yt-dlp extraction failed for {target_url}: {e}")

    if not tracks:
        raise HTTPException(status_code=404, detail="No se pudieron extraer canciones de la playlist. Asegúrate de que el enlace sea público.")

    return {
        "id": clean_id,
        "title": title,
        "item_count": len(tracks),
        "tracks": tracks
    }

@router.get("/ytmusic/{playlist_id}")
async def get_ytmusic_playlist_tracks(playlist_id: str):
    """
    Retrieve tracks from a playlist ID.
    """
    return await import_playlist_by_url(ImportUrlRequest(url=playlist_id))
