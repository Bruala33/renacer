import os
import shutil
import json
import base64
import urllib.request
import sqlite3

EXCLUDED_NAMES = {"downloads", "preview.mp4", "preview.png"}
EXCLUDED_EXTS = {".apk", ".mp4", ".zip", ".osz", ".bin"}

def pull_live_community_charts():
    """
    Intenta descargar las pistas comunitarias activas de la nube (Render)
    para consolidarlas en el respaldo local versionado antes de empaquetar o sincronizar.
    """
    try:
        url = "https://renacer.onrender.com/api/v1/community/charts/search"
        req = urllib.request.Request(url, headers={"User-Agent": "BeatstarSync/1.0"})
        with urllib.request.urlopen(req, timeout=6) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                if isinstance(data, list) and len(data) > 0:
                    base_dir = os.path.dirname(__file__)
                    backup_file = os.path.join(base_dir, "app", "data", "community", "community_backup.json")
                    db_path = os.path.join(base_dir, "app", "data", "community", "community.db")
                    uploads_dir = os.path.join(base_dir, "app", "uploads", "community")
                    os.makedirs(os.path.dirname(backup_file), exist_ok=True)
                    os.makedirs(uploads_dir, exist_ok=True)

                    backup_data = {"version": 1, "community_charts": [], "creators": []}
                    if os.path.exists(backup_file):
                        try:
                            with open(backup_file, "r", encoding="utf-8") as f:
                                backup_data = json.load(f)
                        except Exception:
                            pass

                    chart_map = {c["id"]: c for c in backup_data.get("community_charts", []) if "id" in c}

                    conn = sqlite3.connect(db_path) if os.path.exists(os.path.dirname(db_path)) else None

                    for ch in data:
                        cid = ch.get("id")
                        if not cid:
                            continue
                        chart_folder = os.path.join(uploads_dir, cid)
                        os.makedirs(chart_folder, exist_ok=True)
                        chart_json_path = os.path.join(chart_folder, "chart.json")
                        audio_path = os.path.join(chart_folder, "audio.mp3")

                        chart_content = ""
                        if not os.path.exists(chart_json_path) or os.path.getsize(chart_json_path) == 0:
                            try:
                                with urllib.request.urlopen(f"https://renacer.onrender.com/api/v1/community/charts/{cid}/chart", timeout=8) as cres:
                                    chart_bytes = cres.read()
                                    with open(chart_json_path, "wb") as f:
                                        f.write(chart_bytes)
                                    chart_content = chart_bytes.decode('utf-8', errors='ignore')
                            except Exception:
                                pass
                        else:
                            with open(chart_json_path, "r", encoding="utf-8") as f:
                                chart_content = f.read()

                        audio_b64 = ""
                        if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
                            try:
                                with urllib.request.urlopen(f"https://renacer.onrender.com/api/v1/community/charts/{cid}/audio", timeout=12) as ares:
                                    audio_bytes = ares.read()
                                    with open(audio_path, "wb") as f:
                                        f.write(audio_bytes)
                                    audio_b64 = base64.b64encode(audio_bytes).decode('ascii')
                            except Exception:
                                pass
                        elif os.path.exists(audio_path):
                            try:
                                with open(audio_path, "rb") as f:
                                    audio_b64 = base64.b64encode(f.read()).decode('ascii')
                            except Exception:
                                pass

                        entry = {
                            "id": cid,
                            "title": ch.get("title"),
                            "artist": ch.get("artist"),
                            "creator_id": ch.get("creator_id"),
                            "creator_name": ch.get("creator_name"),
                            "bpm": ch.get("bpm", 120.0),
                            "offset_ms": ch.get("offset_ms", 0),
                            "difficulty_name": ch.get("difficulty_name", "Media"),
                            "stars": ch.get("stars", 3.5),
                            "scroll_duration_ms": ch.get("scroll_duration_ms", 1400),
                            "notes_count": ch.get("notes_count", 0),
                            "audio_filename": "audio.mp3",
                            "chart_filename": "chart.json",
                            "rating_avg": ch.get("rating_avg", 5.0),
                            "votes_count": ch.get("votes_count", 1),
                            "sync_avg": ch.get("sync_avg", 100.0),
                            "sync_votes_count": ch.get("sync_votes_count", 1),
                            "created_at": ch.get("created_at"),
                            "chart_json": chart_content or chart_map.get(cid, {}).get("chart_json", ""),
                            "audio_base64": audio_b64 or chart_map.get(cid, {}).get("audio_base64", "")
                        }
                        chart_map[cid] = entry

                    backup_data["community_charts"] = list(chart_map.values())
                    with open(backup_file, "w", encoding="utf-8") as f:
                        json.dump(backup_data, f, ensure_ascii=False, indent=2)

                    if conn:
                        try:
                            cur = conn.cursor()
                            for ch in backup_data["community_charts"]:
                                cur.execute("""
                                    INSERT OR REPLACE INTO community_charts (
                                        id, title, artist, creator_id, creator_name, bpm, offset_ms,
                                        difficulty_name, stars, scroll_duration_ms, notes_count,
                                        audio_filename, chart_filename, rating_avg, votes_count,
                                        sync_avg, sync_votes_count, created_at, chart_json, audio_base64
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                """, (
                                    ch["id"], ch["title"], ch["artist"], ch["creator_id"], ch["creator_name"],
                                    ch["bpm"], ch["offset_ms"], ch["difficulty_name"], ch["stars"],
                                    ch["scroll_duration_ms"], ch["notes_count"], ch["audio_filename"],
                                    ch["chart_filename"], ch["rating_avg"], ch["votes_count"],
                                    ch["sync_avg"], ch["sync_votes_count"], ch["created_at"],
                                    ch["chart_json"], ch["audio_base64"]
                                ))
                            conn.commit()
                            conn.close()
                        except Exception:
                            pass
                    print(f"[OK] Sincronizadas y respaldadas {len(chart_map)} pistas comunitarias desde la nube.")
    except Exception as e:
        print(f"[INFO] Cloud pull omitido ({e}). Se usarán los respaldos comunitarios locales.")

def sync_assets():
    pull_live_community_charts()
    source_dir = os.path.join(os.path.dirname(__file__), "app", "static")
    target_dir = os.path.join(os.path.dirname(__file__), "android", "app", "src", "main", "assets", "www")

    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    os.makedirs(target_dir, exist_ok=True)

    copied_count = 0
    total_bytes = 0

    for item in os.listdir(source_dir):
        if item in EXCLUDED_NAMES:
            print(f"[SKIP] Excluding heavy directory/file: {item}")
            continue

        ext = os.path.splitext(item)[1].lower()
        if ext in EXCLUDED_EXTS:
            print(f"[SKIP] Excluding binary file: {item}")
            continue

        s = os.path.join(source_dir, item)
        d = os.path.join(target_dir, item)

        if os.path.isdir(s):
            shutil.copytree(s, d)
            copied_count += 1
        else:
            shutil.copy2(s, d)
            copied_count += 1
            total_bytes += os.path.getsize(s)

    game_html_dest = os.path.join(target_dir, "game.html")
    index_html_dest = os.path.join(target_dir, "index.html")
    if os.path.exists(game_html_dest):
        shutil.copy2(game_html_dest, index_html_dest)
        print("[OK] Mirrored game.html -> index.html for universal WebView compatibility")

    print(f"[OK] Frontend assets synced cleanly ({copied_count} items, ~{total_bytes/1024/1024:.2f} MB)")

if __name__ == "__main__":
    sync_assets()
