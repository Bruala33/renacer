import os
import shutil

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(ROOT_DIR, 'app', 'static')
ANDROID_WWW = os.path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'assets', 'www')

os.makedirs(ANDROID_WWW, exist_ok=True)

IGNORE_EXTS = {'.apk', '.mp4'}
IGNORE_DIRS = {'downloads'}

def sync_assets():
    print(f'Syncing assets from {STATIC_DIR} to {ANDROID_WWW}...')
    copied_count = 0
    for item in os.listdir(STATIC_DIR):
        if item in IGNORE_DIRS:
            continue
        ext = os.path.splitext(item)[1].lower()
        if ext in IGNORE_EXTS:
            continue
        src_path = os.path.join(STATIC_DIR, item)
        dst_path = os.path.join(ANDROID_WWW, item)
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
    src_game_html = os.path.join(STATIC_DIR, 'game.html')
    if os.path.exists(src_game_html):
        shutil.copy2(src_game_html, os.path.join(ANDROID_WWW, 'index.html'))
        shutil.copy2(src_game_html, os.path.join(ANDROID_WWW, 'game.html'))
    print(f'[SUCCESS] Successfully synced {copied_count} assets to Android assets/www!')

if __name__ == '__main__':
    sync_assets()
