import os
import shutil

def sync_assets():
    source_dir = os.path.join(os.path.dirname(__file__), "app", "static")
    target_dir = os.path.join(os.path.dirname(__file__), "android", "app", "src", "main", "assets", "www")

    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    os.makedirs(target_dir, exist_ok=True)

    for item in os.listdir(source_dir):
        s = os.path.join(source_dir, item)
        d = os.path.join(target_dir, item)
        if os.path.isdir(s):
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)

    print(f"[OK] All frontend assets successfully synced from {source_dir} to {target_dir}")

if __name__ == "__main__":
    sync_assets()
