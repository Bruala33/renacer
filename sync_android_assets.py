import os
import shutil

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(ROOT_DIR, 'app', 'static')
UPLOADS_COMM_DIR = os.path.join(ROOT_DIR, 'app', 'uploads', 'community')

# Original Antigravity structure + AI Studio root structure compatibility
ANDROID_WWW_TARGETS = [
    os.path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'assets', 'www'),
    os.path.join(ROOT_DIR, 'app', 'src', 'main', 'assets', 'www'),
]

IGNORE_EXTS = {'.apk', '.mp4'}
IGNORE_DIRS = {'downloads'}

def sync_to_target(android_www):
    os.makedirs(android_www, exist_ok=True)
    print(f'Syncing assets from {STATIC_DIR} to {android_www}...')
    copied_count = 0
    for item in os.listdir(STATIC_DIR):
        if item in IGNORE_DIRS:
            continue
        ext = os.path.splitext(item)[1].lower()
        if ext in IGNORE_EXTS:
            continue
        src_path = os.path.join(STATIC_DIR, item)
        dst_path = os.path.join(android_www, item)
        if os.path.isdir(src_path):
            if os.path.exists(dst_path):
                shutil.rmtree(dst_path)
            shutil.copytree(src_path, dst_path)
            copied_count += 1
            print(f'  [DIR] {item}/')
        else:
            shutil.copy2(src_path, dst_path)
            copied_count += 1
            print(f'  [FILE] {item} ({os.path.getsize(dst_path)} bytes)')

    # Also sync audio files from app/uploads/community into songs/
    if os.path.exists(UPLOADS_COMM_DIR):
        camilo_audio = os.path.join(UPLOADS_COMM_DIR, 'comm_camilo_sesto', 'audio.mp3')
        dst_camilo = os.path.join(android_www, 'songs', 'comm_camilo_sesto', 'audio.mp3')
        if os.path.exists(camilo_audio):
            os.makedirs(os.path.dirname(dst_camilo), exist_ok=True)
            shutil.copy2(camilo_audio, dst_camilo)

        renacer_audio = os.path.join(UPLOADS_COMM_DIR, 'comm_renacer', 'audio.mp3')
        dst_renacer = os.path.join(android_www, 'songs', 'renacer', 'audio.mp3')
        if os.path.exists(renacer_audio):
            os.makedirs(os.path.dirname(dst_renacer), exist_ok=True)
            shutil.copy2(renacer_audio, dst_renacer)

    src_index_html = os.path.join(STATIC_DIR, 'index.html')
    if os.path.exists(src_index_html):
        shutil.copy2(src_index_html, os.path.join(STATIC_DIR, 'game.html'))
        shutil.copy2(src_index_html, os.path.join(android_www, 'index.html'))
        shutil.copy2(src_index_html, os.path.join(android_www, 'game.html'))
    print(f'[SUCCESS] Successfully synced {copied_count} assets to {android_www}!')

def sync_assets():
    for target in ANDROID_WWW_TARGETS:
        sync_to_target(target)

    # Keep MainActivity.kt and Android resources synced in android/app/src/main
    root_main = os.path.join(ROOT_DIR, 'app', 'src', 'main')
    android_main = os.path.join(ROOT_DIR, 'android', 'app', 'src', 'main')
    if os.path.exists(root_main):
        for sub in ['java', 'res', 'AndroidManifest.xml']:
            s = os.path.join(root_main, sub)
            d = os.path.join(android_main, sub)
            if os.path.exists(s):
                if os.path.isdir(s):
                    if os.path.exists(d):
                        shutil.rmtree(d)
                    shutil.copytree(s, d)
                else:
                    os.makedirs(os.path.dirname(d), exist_ok=True)
                    shutil.copy2(s, d)

def sync_built_apk():
    import subprocess
    built_candidates = [
        os.path.join(ROOT_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
        os.path.join(ROOT_DIR, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
        os.path.join(ROOT_DIR, '.build-outputs', 'app-debug.apk'),
        os.path.join(ROOT_DIR, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    ]
    existing = [p for p in built_candidates if os.path.isfile(p) and os.path.getsize(p) > 100000]
    if not existing:
        return
    newest_apk = max(existing, key=lambda p: os.path.getmtime(p))
    keystore_path = os.path.join(ROOT_DIR, 'debug.keystore')
    apksigner_candidates = [
        '/opt/android/sdk/build-tools/36.0.0/apksigner',
        '/opt/android/sdk/build-tools/35.0.0/apksigner',
        '/opt/android/sdk/build-tools/34.0.0/apksigner',
    ]
    apksigner_bin = next((b for b in apksigner_candidates if os.path.isfile(b)), None)
    if apksigner_bin and os.path.isfile(keystore_path):
        try:
            subprocess.run([
                apksigner_bin, 'sign',
                '--ks', keystore_path,
                '--ks-key-alias', 'androiddebugkey',
                '--ks-pass', 'pass:android',
                '--key-pass', 'pass:android',
                '--v1-signing-enabled', 'true',
                '--v2-signing-enabled', 'true',
                '--v3-signing-enabled', 'true',
                newest_apk
            ], check=True)
            print(f'[APK SIGN] Signed {newest_apk} with v1+v2+v3 schemes.')
        except Exception as e:
            print(f'[APK SIGN WARNING] {e}')

    apk_destinations = [
        os.path.join(ROOT_DIR, 'PianoCommunity.apk'),
        os.path.join(STATIC_DIR, 'PianoCommunity.apk'),
        os.path.join(STATIC_DIR, 'downloads', 'PianoCommunity.apk'),
    ]
    for dst in apk_destinations:
        try:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if os.path.abspath(newest_apk) != os.path.abspath(dst):
                shutil.copy2(newest_apk, dst)
                print(f'[APK SYNC] Updated {dst} from {newest_apk} ({os.path.getsize(dst)} bytes)')
        except Exception as e:
            print(f'[APK SYNC WARNING] {dst}: {e}')

if __name__ == '__main__':
    sync_assets()
    sync_built_apk()
