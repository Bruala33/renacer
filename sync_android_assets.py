import os
import shutil

EXCLUDED_NAMES = {"downloads", "preview.mp4"}
EXCLUDED_EXTS = {".apk", ".mp4", ".zip", ".osz", ".bin"}

def sync_assets():
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
