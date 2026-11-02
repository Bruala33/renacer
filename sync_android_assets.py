#!/usr/bin/env python3
import os
import shutil

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(ROOT_DIR, "app", "static")
ANDROID_WWW_DIR = os.path.join(ROOT_DIR, "app", "src", "main", "assets", "www")
ANDROID_ROOT_WWW_DIR = os.path.join(ROOT_DIR, "android", "app", "src", "main", "assets", "www")

EXCLUDE_NAMES = {"PianoCommunity.apk", "downloads", "__pycache__"}

def copy_assets_to_dir(target_dir):
    os.makedirs(target_dir, exist_ok=True)
    root_lb = os.path.join(ROOT_DIR, "leaderboard.json")
    static_lb = os.path.join(STATIC_DIR, "leaderboard.json")
    if os.path.exists(root_lb):
        shutil.copy2(root_lb, static_lb)

    for item in os.listdir(STATIC_DIR):
        if item in EXCLUDE_NAMES:
            continue
        src_path = os.path.join(STATIC_DIR, item)
        dst_path = os.path.join(target_dir, item)
        if os.path.isdir(src_path):
            if os.path.exists(dst_path):
                shutil.rmtree(dst_path)
            shutil.copytree(src_path, dst_path)
        else:
            shutil.copy2(src_path, dst_path)

    idx_html = os.path.join(STATIC_DIR, "index.html")
    game_html = os.path.join(STATIC_DIR, "game.html")
    if os.path.exists(idx_html):
        shutil.copy2(idx_html, game_html)
        shutil.copy2(idx_html, os.path.join(target_dir, "index.html"))
        shutil.copy2(idx_html, os.path.join(target_dir, "game.html"))

def sync_web_to_android_assets():
    copy_assets_to_dir(ANDROID_WWW_DIR)
    if os.path.exists(os.path.join(ROOT_DIR, "android")):
        copy_assets_to_dir(ANDROID_ROOT_WWW_DIR)
    print("Synced app/static -> app/src/main/assets/www and android/app/src/main/assets/www")

def sync_built_apk():
    candidates = [
        os.path.join(ROOT_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
        os.path.join(ROOT_DIR, "app", "build", "outputs", "apk", "release", "app-release.apk"),
        os.path.join(ROOT_DIR, ".build-outputs", "app-debug.apk"),
        os.path.join(ROOT_DIR, "android", "app", "build", "outputs", "apk", "release", "app-release.apk"),
        os.path.join(ROOT_DIR, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
    ]
    built_apk = None
    for c in candidates:
        if os.path.exists(c) and os.path.getsize(c) > 5000000:
            built_apk = c
            break
    if not built_apk:
        print("No built APK found yet")
        return False

    downloads_dir = os.path.join(STATIC_DIR, "downloads")
    root_downloads_dir = os.path.join(ROOT_DIR, "downloads")
    os.makedirs(downloads_dir, exist_ok=True)
    os.makedirs(root_downloads_dir, exist_ok=True)

    # Re-sign with unified app-signing.keystore if available
    keystore = os.path.join(ROOT_DIR, "app-signing.keystore")
    apksigner_bin = "/opt/android/sdk/build-tools/36.0.0/apksigner"
    working_apk = os.path.join(ROOT_DIR, "PianoCommunity.apk")
    shutil.copy2(built_apk, working_apk)

    if os.path.exists(keystore) and os.path.exists(apksigner_bin):
        import subprocess
        try:
            cmd = [
                apksigner_bin, "sign",
                "--ks", keystore,
                "--ks-pass", "pass:android",
                "--ks-key-alias", "androiddebugkey",
                "--key-pass", "pass:android",
                working_apk
            ]
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0:
                print("Successfully re-signed PianoCommunity.apk with app-signing.keystore")
            else:
                print(f"Warning: apksigner failed ({res.stderr}), using original signature")
        except Exception as e:
            print(f"Signing exception: {e}")

    destinations = [
        os.path.join(STATIC_DIR, "PianoCommunity.apk"),
        os.path.join(downloads_dir, "PianoCommunity.apk"),
        os.path.join(root_downloads_dir, "PianoCommunity.apk"),
        os.path.join(ROOT_DIR, ".build-outputs", "app-debug.apk"),
    ]

    for dst in destinations:
        shutil.copy2(working_apk, dst)
        print(f"Synced APK ({os.path.getsize(working_apk)} bytes) -> {dst}")
    return True

if __name__ == "__main__":
    sync_web_to_android_assets()
    sync_built_apk()
