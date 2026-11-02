#!/usr/bin/env python3
import glob
import os
import shutil
import subprocess

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(ROOT_DIR, "app", "static")
ANDROID_WWW_DIRS = [
    os.path.join(ROOT_DIR, "app", "src", "main", "assets", "www"),
    os.path.join(ROOT_DIR, "android", "app", "src", "main", "assets", "www"),
]

EXCLUDE_NAMES = {"PianoCommunity.apk", "downloads", "__pycache__"}

def sync_web_to_android_assets():
    # Preserve root leaderboard.json into app/static/leaderboard.json if present
    root_lb = os.path.join(ROOT_DIR, "leaderboard.json")
    static_lb = os.path.join(STATIC_DIR, "leaderboard.json")
    if os.path.exists(root_lb):
        shutil.copy2(root_lb, static_lb)

    # Ensure game.html and index.html in app/static are identical first
    idx_html = os.path.join(STATIC_DIR, "index.html")
    game_html = os.path.join(STATIC_DIR, "game.html")
    if os.path.exists(idx_html):
        shutil.copy2(idx_html, game_html)

    for www_dir in ANDROID_WWW_DIRS:
        os.makedirs(www_dir, exist_ok=True)
        for item in os.listdir(STATIC_DIR):
            if item in EXCLUDE_NAMES:
                continue
            src_path = os.path.join(STATIC_DIR, item)
            dst_path = os.path.join(www_dir, item)
            if os.path.isdir(src_path):
                if os.path.exists(dst_path):
                    shutil.rmtree(dst_path)
                shutil.copytree(src_path, dst_path)
            else:
                shutil.copy2(src_path, dst_path)
        print(f"Synced app/static -> {os.path.relpath(www_dir, ROOT_DIR)}")

def _find_apksigner():
    sdk_roots = [
        os.environ.get("ANDROID_HOME", ""),
        os.environ.get("ANDROID_SDK_ROOT", ""),
        os.path.expandvars(r"%LOCALAPPDATA%\Android\Sdk"),
        "/opt/android/sdk",
        "/usr/lib/android-sdk",
    ]
    for sdk in sdk_roots:
        if not sdk or not os.path.isdir(sdk):
            continue
        for pat in ["build-tools/*/apksigner.bat", "build-tools/*/apksigner"]:
            matches = sorted(glob.glob(os.path.join(sdk, pat)), reverse=True)
            if matches:
                return matches[0]
    return shutil.which("apksigner.bat") or shutil.which("apksigner")

def _ensure_signed_with_shared_key(apk_path: str):
    shared_ks = os.path.join(ROOT_DIR, "app-signing.keystore")
    apksigner = _find_apksigner()
    if not os.path.exists(shared_ks) or not apksigner:
        return
    try:
        subprocess.run([
            apksigner, "sign",
            "--ks", shared_ks,
            "--ks-pass", "pass:android",
            "--key-pass", "pass:android",
            "--ks-key-alias", "androiddebugkey",
            "--v2-signing-enabled", "true",
            "--v3-signing-enabled", "true",
            apk_path,
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"Signed {os.path.relpath(apk_path, ROOT_DIR)} with unified app-signing.keystore")
    except Exception as exc:
        print(f"Note: apksigner step skipped ({exc})")

def sync_built_apk():
    candidates = [
        os.path.join(ROOT_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
        os.path.join(ROOT_DIR, "app", "build", "outputs", "apk", "release", "app-release.apk"),
        os.path.join(ROOT_DIR, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
        os.path.join(ROOT_DIR, "android", "app", "build", "outputs", "apk", "release", "app-release.apk"),
    ]
    existing = [c for c in candidates if os.path.exists(c)]
    if not existing:
        print("No built APK found yet")
        return False

    # Pick the most recently built APK
    existing.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    built_apk = existing[0]
    _ensure_signed_with_shared_key(built_apk)

    destinations = [
        os.path.join(ROOT_DIR, "PianoCommunity.apk"),
        os.path.join(STATIC_DIR, "PianoCommunity.apk"),
        os.path.join(STATIC_DIR, "downloads", "PianoCommunity.apk"),
        os.path.join(ROOT_DIR, "downloads", "PianoCommunity.apk"),
    ]
    for dst in destinations:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(built_apk, dst)

    size_bytes = os.path.getsize(built_apk)
    print(f"Synced newest built APK ({os.path.relpath(built_apk, ROOT_DIR)}, {size_bytes} bytes) -> {len(destinations)} destinations")
    return True

if __name__ == "__main__":
    sync_web_to_android_assets()
    sync_built_apk()
