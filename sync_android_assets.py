#!/usr/bin/env python3
import os
import shutil

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(ROOT_DIR, "app", "static")
ANDROID_WWW_DIR = os.path.join(ROOT_DIR, "app", "src", "main", "assets", "www")

EXCLUDE_NAMES = {"PianoCommunity.apk", "downloads", "__pycache__"}

def sync_web_to_android_assets():
    os.makedirs(ANDROID_WWW_DIR, exist_ok=True)
    # Preserve root leaderboard.json into app/static/leaderboard.json if newer/present
    root_lb = os.path.join(ROOT_DIR, "leaderboard.json")
    static_lb = os.path.join(STATIC_DIR, "leaderboard.json")
    if os.path.exists(root_lb):
        shutil.copy2(root_lb, static_lb)

    for item in os.listdir(STATIC_DIR):
        if item in EXCLUDE_NAMES:
            continue
        src_path = os.path.join(STATIC_DIR, item)
        dst_path = os.path.join(ANDROID_WWW_DIR, item)
        if os.path.isdir(src_path):
            if os.path.exists(dst_path):
                shutil.rmtree(dst_path)
            shutil.copytree(src_path, dst_path)
        else:
            shutil.copy2(src_path, dst_path)

    # Ensure game.html and index.html are identical
    idx_html = os.path.join(STATIC_DIR, "index.html")
    game_html = os.path.join(STATIC_DIR, "game.html")
    if os.path.exists(idx_html):
        shutil.copy2(idx_html, game_html)
        shutil.copy2(idx_html, os.path.join(ANDROID_WWW_DIR, "index.html"))
        shutil.copy2(idx_html, os.path.join(ANDROID_WWW_DIR, "game.html"))

    print("Synced app/static -> app/src/main/assets/www")

def sync_built_apk():
    candidates = [
        os.path.join(ROOT_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
        os.path.join(ROOT_DIR, "app", "build", "outputs", "apk", "release", "app-release.apk"),
    ]
    built_apk = None
    for c in candidates:
        if os.path.exists(c):
            built_apk = c
            break
    if not built_apk:
        print("No built APK found yet")
        return False

    dst1 = os.path.join(STATIC_DIR, "PianoCommunity.apk")
    downloads_dir = os.path.join(STATIC_DIR, "downloads")
    os.makedirs(downloads_dir, exist_ok=True)
    dst2 = os.path.join(downloads_dir, "PianoCommunity.apk")

    shutil.copy2(built_apk, dst1)
    shutil.copy2(built_apk, dst2)
    print(f"Synced built APK ({os.path.getsize(built_apk)} bytes) -> {dst1} and {dst2}")
    return True

if __name__ == "__main__":
    sync_web_to_android_assets()
    sync_built_apk()
