import urllib.request
import urllib.parse
import json
import ssl
import asyncio
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("community_aggregator")

# SSL context for external requests
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json"
}

class CommunityAggregator:
    """
    Agregador multifuente de mapas de ritmo comunitarios humanos:
    - osu! Mania (Catboy / Nerinyan / Sayobot)
    - Clone Hero (Chorus Encore / Google Drive / SNG)
    """

    @staticmethod
    def _fetch_sync(url: str, method: str = "GET", body: Optional[Dict[str, Any]] = None, timeout: int = 6) -> Optional[Any]:
        try:
            headers = DEFAULT_HEADERS.copy()
            data_bytes = None
            if body is not None:
                headers["Content-Type"] = "application/json"
                data_bytes = json.dumps(body).encode("utf-8")

            req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=timeout) as resp:
                if resp.status in (200, 201):
                    raw = resp.read().decode("utf-8", errors="ignore")
                    return json.loads(raw)
        except Exception as e:
            logger.debug(f"Error fetching {url}: {str(e)}")
            return None

    @classmethod
    async def search_osu_mania(cls, query: str) -> List[Dict[str, Any]]:
        """
        Consulta la API de osu! Mania (Catboy / Nerinyan / Sayobot) filtrada a modo Mania (mode=3).
        """
        encoded = urllib.parse.quote(query)
        urls = [
            f"https://catboy.best/api/v2/search?q={encoded}&m=3",
            f"https://api.sayobot.cn/beatmaplist?0=20&1=0&2=4&m=3&cmd=search&keyword={encoded}"
        ]
        
        results = []
        seen_ids = set()

        for u in urls:
            data = await asyncio.to_thread(cls._fetch_sync, u)
            if not data:
                continue

            # Case 1: Catboy list / data dict
            if isinstance(data, list) or (isinstance(data, dict) and "data" in data and not u.startswith("https://api.sayobot")):
                items = data if isinstance(data, list) else (data.get("data") or [])
                for item in items[:15]:
                    try:
                        set_id = item.get("id")
                        if not set_id or set_id in seen_ids:
                            continue
                        seen_ids.add(set_id)

                        title = item.get("title") or "Sin título"
                        artist = item.get("artist") or "Desconocido"
                        creator = item.get("creator") or (item.get("user", {}).get("username") if isinstance(item.get("user"), dict) else "osu! Mapper")
                        
                        covers = item.get("covers") or {}
                        thumbnail = covers.get("card") or covers.get("cover") or f"https://assets.ppy.sh/beatmaps/{set_id}/covers/card.jpg"

                        diffs = []
                        beatmaps = item.get("beatmaps") or []
                        for b in beatmaps:
                            if b.get("mode") == 3 or b.get("mode_int") == 3 or str(b.get("mode")) == "mania":
                                rating = round(float(b.get("difficulty_rating") or 0.0), 1)
                                diff_name = b.get("version") or f"Key {b.get('cs', 4)}"
                                keys = int(b.get("cs") or 4)
                                diffs.append({
                                    "id": str(b.get("id")),
                                    "name": diff_name,
                                    "stars": rating,
                                    "keys": keys,
                                    "label": f"{diff_name} ({rating}★)"
                                })

                        if not diffs and beatmaps:
                            for b in beatmaps:
                                rating = round(float(b.get("difficulty_rating") or 0.0), 1)
                                diff_name = b.get("version") or "Normal"
                                keys = int(b.get("cs") or 4)
                                diffs.append({
                                    "id": str(b.get("id")),
                                    "name": diff_name,
                                    "stars": rating,
                                    "keys": keys,
                                    "label": f"{diff_name} ({rating}★)"
                                })

                        diffs.sort(key=lambda d: d["stars"])

                        if diffs:
                            results.append({
                                "id": f"osu_{set_id}",
                                "source": "osu",
                                "source_name": "osu!",
                                "source_badge": "[osu!]",
                                "source_color": "#ff007f",
                                "title": title,
                                "artist": artist,
                                "creator": creator,
                                "thumbnail": thumbnail,
                                "download_url": f"/api/v1/download/proxy?url={urllib.parse.quote(f'https://catboy.best/d/{set_id}', safe='')}",
                                "direct_download_url": f"https://catboy.best/d/{set_id}",
                                "fallback_download_url": f"https://api.nerinyan.moe/d/{set_id}",
                                "bpm": item.get("bpm") or 120,
                                "difficulties": diffs
                            })
                    except Exception as ex:
                        logger.debug(f"Error parsing osu item: {ex}")
                        continue

            # Case 2: Sayobot format
            elif isinstance(data, dict) and "data" in data:
                items = data.get("data") or []
                for item in items[:15]:
                    try:
                        set_id = item.get("sid")
                        if not set_id or set_id in seen_ids:
                            continue
                        seen_ids.add(set_id)

                        title = item.get("title") or item.get("titleU") or "Sin título"
                        artist = item.get("artist") or item.get("artistU") or "Desconocido"
                        creator = item.get("creator") or "osu! Mapper"
                        thumbnail = f"https://assets.ppy.sh/beatmaps/{set_id}/covers/card.jpg"

                        bid_data = item.get("bid_data") or []
                        diffs = []
                        for b in bid_data:
                            stars = round(float(b.get("star") or 0.0), 1)
                            diff_name = b.get("version") or "Key 4"
                            diffs.append({
                                "id": str(b.get("bid")),
                                "name": diff_name,
                                "stars": stars,
                                "keys": 4,
                                "label": f"{diff_name} ({stars}★)"
                            })

                        diffs.sort(key=lambda d: d["stars"])

                        if diffs:
                            results.append({
                                "id": f"osu_{set_id}",
                                "source": "osu",
                                "source_name": "osu!",
                                "source_badge": "[osu!]",
                                "source_color": "#ff007f",
                                "title": title,
                                "artist": artist,
                                "creator": creator,
                                "thumbnail": thumbnail,
                                "download_url": f"/api/v1/download/proxy?url={urllib.parse.quote(f'https://catboy.best/d/{set_id}', safe='')}",
                                "direct_download_url": f"https://catboy.best/d/{set_id}",
                                "fallback_download_url": f"https://txy1.sayobot.cn/beatmaps/download/mini/{set_id}",
                                "bpm": item.get("bpm") or 120,
                                "difficulties": diffs
                            })
                    except Exception as ex:
                        logger.debug(f"Error parsing sayobot item: {ex}")
                        continue

        return results

    @classmethod
    async def search_clone_hero(cls, query: str) -> List[Dict[str, Any]]:
        """
        Consulta la API de Chorus Encore para mapas de Clone Hero (.sng / .chart / .mid / .zip / Google Drive).
        """
        url = "https://api.enchor.us/search"
        body = {
            "search": query,
            "page": 1,
            "source": "website"
        }
        data = await asyncio.to_thread(cls._fetch_sync, url, "POST", body)

        if not data or not isinstance(data, dict):
            return []

        items = data.get("data") or data.get("songs") or []
        results = []

        for idx, item in enumerate(items[:20]):
            try:
                chart_id = item.get("chartId") or item.get("songId") or item.get("id") or f"ch_{idx}"
                name = item.get("name") or item.get("title") or "Sin título"
                artist = item.get("artist") or "Desconocido"
                charter = item.get("charter") or item.get("charterName") or "Clone Hero Charter"
                bpm = item.get("bpm") or 120
                drive_id = item.get("driveFileId") or item.get("parentFolderId")

                direct_dl = item.get("download_url") or item.get("directDownloadUrl") or item.get("downloadUrl") or item.get("sngDownloadUrl") or ""
                if not direct_dl and drive_id:
                    direct_dl = f"/api/v1/download/gdrive/{drive_id}"
                if not direct_dl and item.get("md5"):
                    direct_dl = f"https://api.enchor.us/download/{item.get('md5')}"

                if not direct_dl:
                    continue

                diffs = []
                diff_guitar = item.get("diff_guitar")
                if diff_guitar is not None and diff_guitar >= 0:
                    diffs.append({
                        "id": "ExpertSingle",
                        "name": "Expert Single",
                        "stars": float(diff_guitar) if diff_guitar > 0 else 4.5,
                        "keys": 5,
                        "label": f"Expert Single ({diff_guitar}★)" if diff_guitar > 0 else "Expert Single (4.5★)"
                    })
                
                notes_data = item.get("notesData") or {}
                note_counts = notes_data.get("noteCounts") or []
                for nc in note_counts:
                    d_name = nc.get("difficulty") or "Expert"
                    diff_key = f"{d_name.capitalize()}Single"
                    if not any(d["name"].lower() == d_name.lower() for d in diffs):
                        diffs.append({
                            "id": diff_key,
                            "name": f"{d_name.capitalize()} Single",
                            "stars": 3.5,
                            "keys": 5,
                            "label": f"{d_name.capitalize()} Single"
                        })

                if not diffs:
                    diffs.append({
                        "id": "ExpertSingle",
                        "name": "Expert Single",
                        "stars": 4.5,
                        "keys": 5,
                        "label": "Expert Single (4.5★)"
                    })

                thumbnail = "https://i.ytimg.com/vi/placeholder/hqdefault.jpg"
                if item.get("albumArtMd5"):
                    thumbnail = f"https://api.enchor.us/albumart/{item.get('albumArtMd5')}"
                elif item.get("thumbnail"):
                    thumbnail = item.get("thumbnail")

                download_endpoint = f"/api/v1/download/gdrive/{drive_id}" if drive_id else (
                    f"/api/proxy?url={urllib.parse.quote(direct_dl, safe='')}" if direct_dl.startswith("http") else direct_dl
                )

                results.append({
                    "id": f"clonehero_{chart_id}",
                    "source": "clonehero",
                    "source_name": "Clone Hero",
                    "source_badge": "[Clone Hero]",
                    "source_color": "#b142ff",
                    "title": name,
                    "artist": artist,
                    "creator": charter,
                    "thumbnail": thumbnail,
                    "download_url": download_endpoint,
                    "direct_download_url": download_endpoint,
                    "drive_id": drive_id,
                    "bpm": int(bpm),
                    "difficulties": diffs
                })
            except Exception as ex:
                logger.debug(f"Error parsing clone hero item: {ex}")
                continue

        # Sort .sng first
        results.sort(key=lambda r: 1 if ".sng" in r.get("direct_download_url", "").lower() else 0, reverse=True)
        return results

    @classmethod
    async def aggregate_search(cls, query: str) -> List[Dict[str, Any]]:
        """
        Ejecuta búsquedas paralelas cruzadas en osu! Mania y Clone Hero.
        """
        clean_q = query.strip()
        if not clean_q:
            return []

        osu_task = asyncio.create_task(cls.search_osu_mania(clean_q))
        ch_task = asyncio.create_task(cls.search_clone_hero(clean_q))

        osu_res, ch_res = await asyncio.gather(
            osu_task, ch_task, return_exceptions=True
        )

        all_results = []
        if isinstance(osu_res, list):
            all_results.extend(osu_res)
        if isinstance(ch_res, list):
            all_results.extend(ch_res)

        return all_results
