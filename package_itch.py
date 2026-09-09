import os
import shutil
import zipfile

def package_for_itch():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    source_dir = os.path.join(base_dir, "app", "static")
    dist_dir = os.path.join(base_dir, "dist_itch")
    zip_path = os.path.join(base_dir, "pianocommunity-web.zip")

    print("[*] Iniciando empaquetado para itch.io...")
    print(f"    Directorio origen: {source_dir}")
    print(f"    Carpeta exportación: {dist_dir}")
    print(f"    Archivo ZIP final: {zip_path}")

    # 1. Limpiar y recrear dist_itch
    if os.path.exists(dist_dir):
        print("[-] Limpiando carpeta dist_itch previa...")
        shutil.rmtree(dist_dir)
    os.makedirs(dist_dir, exist_ok=True)

    # 2. Copiar archivos y directorios
    copied_files = []
    skipped_files = []

    for root, dirs, files in os.walk(source_dir):
        rel_root = os.path.relpath(root, source_dir)
        target_root = os.path.join(dist_dir, rel_root) if rel_root != "." else dist_dir

        os.makedirs(target_root, exist_ok=True)

        for file in files:
            file_lower = file.lower()
            src_file = os.path.join(root, file)

            # Excluir archivos .apk
            if file_lower.endswith(".apk"):
                skipped_files.append((src_file, "Archivo APK de Android"))
                continue

            # Excluir la landing original index.html (página de descarga APK)
            if rel_root == "." and file_lower == "index.html":
                skipped_files.append((src_file, "Landing de descarga original de app/static"))
                continue

            # Para game.html: copiar como index.html (requerido por itch.io) y game.html
            if rel_root == "." and file_lower == "game.html":
                dest_index = os.path.join(dist_dir, "index.html")
                shutil.copy2(src_file, dest_index)
                copied_files.append("index.html (renombrado de game.html)")

                dest_game = os.path.join(dist_dir, "game.html")
                shutil.copy2(src_file, dest_game)
                copied_files.append("game.html")
                continue

            dest_file = os.path.join(target_root, file)
            shutil.copy2(src_file, dest_file)
            rel_dest = os.path.relpath(dest_file, dist_dir)
            copied_files.append(rel_dest)

    # Ensure downloads directory exists even if empty
    downloads_dir = os.path.join(dist_dir, "downloads")
    os.makedirs(downloads_dir, exist_ok=True)
    with open(os.path.join(downloads_dir, ".gitkeep"), "w") as f:
        pass
    copied_files.append("downloads/.gitkeep")

    print(f"\n[+] Archivos copiados a dist_itch ({len(copied_files)} archivos):")
    for f in sorted(copied_files):
        print(f"    + {f}")

    if skipped_files:
        print(f"\n[!] Archivos excluidos ({len(skipped_files)} archivos):")
        for f, reason in skipped_files:
            print(f"    - {os.path.basename(f)} ({reason})")

    # 3. Crear pianocommunity-web.zip
    if os.path.exists(zip_path):
        os.remove(zip_path)

    print(f"\n[*] Comprimiendo a ZIP: {zip_path}...")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(dist_dir):
            for file in files:
                abs_file = os.path.join(root, file)
                rel_file = os.path.relpath(abs_file, dist_dir)
                zipf.write(abs_file, rel_file.replace(os.sep, "/"))

    zip_size_bytes = os.path.getsize(zip_path)
    zip_size_mb = zip_size_bytes / (1024 * 1024)
    print(f"[OK] Archivo ZIP creado con exito: {zip_size_mb:.2f} MB ({zip_size_bytes} bytes)")

    # 4. Verificación de integridad
    print("\n[*] Verificando estructura del ZIP generado:")
    with zipfile.ZipFile(zip_path, "r") as zipf:
        zip_namelist = zipf.namelist()

        # Comprobar index.html
        if "index.html" in zip_namelist:
            print("    [PASS] 'index.html' esta en la raiz del ZIP.")
        else:
            print("    [FAIL] 'index.html' NO esta en la raiz del ZIP!")

        # Comprobar ausencia de APK
        apks = [name for name in zip_namelist if name.lower().endswith(".apk")]
        if not apks:
            print("    [PASS] Ningun archivo .apk incluido en el ZIP.")
        else:
            print(f"    [FAIL] Se encontraron archivos .apk: {apks}")

        # Comprobar modulos principales
        checks = [
            "index.html",
            "game.js",
            "editor.js",
            "parsers.js",
            "style.css",
            "manifest.json",
            "sw.js",
            "assets/skins/fire.jpg",
            "assets/vendor/libarchive/libarchive.wasm"
        ]
        for item in checks:
            if item in zip_namelist:
                print(f"    [PASS] Elemento verificado: {item}")
            else:
                print(f"    [WARN] No se encontro: {item}")

if __name__ == "__main__":
    package_for_itch()
