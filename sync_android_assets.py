#!/usr/bin/env python3
import glob
import os
import shutil
import subprocess

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(ROOT_DIR, "app", "static")
ANDROID_WWW_DIR = os.path.join(ROOT_DIR, "app", "src", "main", "assets", "www")
LEGACY_DUP_WWW_DIR = os.path.join(ROOT_DIR, "android", "app", "src", "main", "assets", "www")

EXCLUDE_NAMES = {"PianoCommunity.apk", "downloads", "__pycache__", "game.html"}


def sync_web_to_android_assets():
    # Preserve root leaderboard.json into app/static/leaderboard.json if present
    root_lb = os.path.join(ROOT_DIR, "leaderboard.json")
    static_lb = os.path.join(STATIC_DIR, "leaderboard.json")
    if os.path.exists(root_lb):
        shutil.copy2(root_lb, static_lb)

    # Ensure game.html and index.html in app/static are identical for the web server
    idx_html = os.path.join(STATIC_DIR, "index.html")
    game_html = os.path.join(STATIC_DIR, "game.html")
    if os.path.exists(idx_html):
        shutil.copy2(idx_html, game_html)

    # Remove legacy duplicate android/app/src/main/assets/www directory to keep repo lightweight
    if os.path.exists(LEGACY_DUP_WWW_DIR):
        shutil.rmtree(LEGACY_DUP_WWW_DIR, ignore_errors=True)

    os.makedirs(ANDROID_WWW_DIR, exist_ok=True)
    # Remove any stale game.html inside ANDROID_WWW_DIR (MainActivity maps game.html -> index.html)
    stale_game_html = os.path.join(ANDROID_WWW_DIR, "game.html")
    if os.path.exists(stale_game_html):
        os.remove(stale_game_html)

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
    print(f"Synced app/static -> {os.path.relpath(ANDROID_WWW_DIR, ROOT_DIR)}")


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
    release_apk = os.path.join(ROOT_DIR, "app", "build", "outputs", "apk", "release", "app-release.apk")
    debug_apk = os.path.join(ROOT_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk")
    candidates = [release_apk, debug_apk]
    existing = [c for c in candidates if os.path.exists(c)]
    if not existing:
        print("No built APK found yet")
        return False

    # Prefer release APK when both exist and are within 120 seconds of each other (smaller, compressed DEX)
    if os.path.exists(release_apk) and os.path.exists(debug_apk):
        if abs(os.path.getmtime(release_apk) - os.path.getmtime(debug_apk)) <= 120:
            built_apk = release_apk
        else:
            existing.sort(key=lambda p: os.path.getmtime(p), reverse=True)
            built_apk = existing[0]
    else:
        existing.sort(key=lambda p: os.path.getmtime(p), reverse=True)
        built_apk = existing[0]

    # Keep ONLY ONE canonical APK at app/static/PianoCommunity.apk so GitHub exports never exceed payload limits
    # IMPORTANT: Never modify built_apk in-place because AI Studio Emulator requires app-debug.apk to keep debug.keystore signature
    canonical_dst = os.path.join(STATIC_DIR, "PianoCommunity.apk")
    os.makedirs(os.path.dirname(canonical_dst), exist_ok=True)
    shutil.copy2(built_apk, canonical_dst)
    _ensure_signed_with_shared_key(canonical_dst)

    duplicate_apks = [
        os.path.join(ROOT_DIR, "PianoCommunity.apk"),
        os.path.join(STATIC_DIR, "downloads", "PianoCommunity.apk"),
        os.path.join(ROOT_DIR, "downloads", "PianoCommunity.apk"),
    ]
    for dup in duplicate_apks:
        if os.path.exists(dup):
            try:
                os.remove(dup)
            except OSError:
                pass

    size_bytes = os.path.getsize(canonical_dst)
    print(f"Synced newest built APK ({os.path.relpath(built_apk, ROOT_DIR)}, {size_bytes} bytes) -> app/static/PianoCommunity.apk")
    return True


if __name__ == "__main__":
    sync_web_to_android_assets()
    sync_built_apk()
