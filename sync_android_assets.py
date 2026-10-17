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

if __name__ == '__main__':
    sync_assets()
