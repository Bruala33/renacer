import os
import ssl
import asyncio
import urllib.request
import urllib.parse
import logging
from typing import Dict, Any, List

from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse, Response, RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.services.community_aggregator import CommunityAggregator
from app.api.endpoints.playlists import router as playlists_router
from app.api.endpoints.community import router as community_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("beatstar_api")

app = FastAPI(
    title="Beatstar Multi-Source Rhythm Engine",
    version="3.0.0",
    description="Motor rítmico web fijo a 3 carriles con agregador multifuente de mapas comunitarios (osu! Mania, Clone Hero)."
)

app.include_router(playlists_router, prefix="/api/v1/playlists", tags=["Playlists"])
app.include_router(community_router, prefix="/api/v1/community", tags=["Community"])

# 1. Compresión GZip automática (Ahorro de hasta 80% de ancho de banda)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 2. CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Servidor de estáticos con cabeceras de caché agresivas para navegadores (evita re-descargas)
class CachedStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        if response.status_code == 200:
            if path.endswith((".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".webp", ".ico", ".woff2")):
                response.headers["Cache-Control"] = "public, max-age=604800, stale-while-revalidate=86400"
            elif path.endswith((".html", ".htm")):
                response.headers["Cache-Control"] = "public, max-age=3600, must-revalidate"
        return response

# Setup static directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", CachedStaticFiles(directory=static_dir), name="static")

# SSL context for outbound proxy requests
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def serve_root_index():
    """
    Sirve directamente la aplicación web index.html en la raíz con cero latencia y sin caché.
    """
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read(), status_code=200, headers={"Cache-Control": "no-cache"})
    raise HTTPException(status_code=404, detail="index.html no encontrado.")


@app.get("/ping", tags=["Health"], include_in_schema=False)
async def ping_keep_alive():
    """
    Endpoint ultraligero (2 bytes) para keep-alive automático con consumo de ancho de banda cero.
    """
    return Response(content="OK", media_type="text/plain", status_code=200)


@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
async def health_check() -> Dict[str, Any]:
    """
    Verifica el estado del servidor y los parámetros de configuración.
    """
    return {
        "status": "healthy",
        "service": "Beatstar Community Rhythm Engine",
        "version": "3.0.0",
        "num_lanes": 3,
        "sources": ["osu! Mania", "Clone Hero"]
    }


@app.get("/api/v1/version", tags=["App"], summary="Obtener versión actual de la aplicación")
@app.get("/api/version", tags=["App"], summary="Obtener versión actual de la aplicación")
async def get_app_version():
    """
    Retorna la versión oficial más reciente del juego y del APK para comprobación de actualizaciones in-app.
    """
    return {
        "version_code": 3,
        "version_name": "1.2.0",
        "release_notes": "Auto-descarga de canciones destacadas, sincronización global de valoraciones multi-dispositivo y leaderboards unificados.",
        "download_url": "/download/apk"
    }


@app.get("/api/search", tags=["Search"], summary="Búsqueda unificada comunitaria")
@app.get("/api/v1/search", tags=["Search"], summary="Búsqueda unificada comunitaria")
@app.get("/api/v1/search/community", tags=["Search"], summary="Búsqueda unificada en osu! Mania y Clone Hero")
async def search_community_beatmaps(q: str = Query(..., min_length=1)):
    """
    Consulta en paralelo las bases de datos de mapas comunitarios:
    - osu! Mania (Catboy / Nerinyan / Sayobot)
    - Clone Hero (Chorus Encore / Google Drive)
    """
    if not q or not q.strip():
        return []
    try:
        results = await CommunityAggregator.aggregate_search(query=q.strip())
        return results
    except Exception as e:
        logger.exception(f"Error executing community search: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al buscar mapas comunitarios: {str(e)}"
        )


# Setup Google Drive Download Cache
GDRIVE_CACHE_DIR = os.path.join(os.path.dirname(__file__), "gdrive_cache")
os.makedirs(GDRIVE_CACHE_DIR, exist_ok=True)


def download_gdrive_as_zip(drive_id: str) -> bytes:
    """
    Descarga archivos o carpetas completas de Google Drive y los empaqueta al vuelo
    en un archivo .ZIP estándar en memoria, con caché local en disco para máxima velocidad.
    """
    import io
    import zipfile
    import tempfile
    import warnings
    from bs4 import XMLParsedAsHTMLWarning
    import gdown

    warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

    cache_file = os.path.join(GDRIVE_CACHE_DIR, f"{drive_id}.zip")
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 1000:
        logger.info(f"Serving Google Drive {drive_id} from disk cache")
        with open(cache_file, "rb") as f:
            return f.read()

    with tempfile.TemporaryDirectory() as tmpdir:
        folder_out = os.path.join(tmpdir, "chart")
        os.makedirs(folder_out, exist_ok=True)

        # 1. Intentar descarga como carpeta
        try:
            gdown.download_folder(id=drive_id, output=folder_out, quiet=True)
        except Exception as e:
            logger.warning(f"gdown download_folder fallback for {drive_id}: {e}")

        # 2. Recopilar archivos descargados
        file_list = []
        for root, dirs, files in os.walk(folder_out):
            for fn in files:
                file_list.append(os.path.join(root, fn))

        # 3. Si la carpeta no contenía ficheros, intentar descarga directa como archivo único
        if not file_list:
            single_out = os.path.join(tmpdir, "archive.bin")
            try:
                gdown.download(id=drive_id, output=single_out, quiet=True)
                if os.path.exists(single_out) and os.path.getsize(single_out) > 500:
                    with open(single_out, "rb") as f:
                        data = f.read()
                        with open(cache_file, "wb") as cf:
                            cf.write(data)
                        return data
            except Exception as e:
                logger.warning(f"gdown single file error for {drive_id}: {e}")

        if not file_list:
            raise Exception("No se pudieron descargar los archivos del mapa desde Google Drive.")

        # 4. Empaquetar en un ZIP estándar (omitiendo vídeos pesados innecesarios para el juego)
        VIDEO_EXTS = {".mp4", ".mkv", ".avi", ".webm", ".mov", ".flv", ".wmv", ".m4v"}
        mem_zip = io.BytesIO()
        with zipfile.ZipFile(mem_zip, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            for file_path in file_list:
                _, ext = os.path.splitext(file_path)
                if ext.lower() in VIDEO_EXTS:
                    logger.info(f"Skipping video file {os.path.basename(file_path)} to optimize zip size")
                    continue
                zf.write(file_path, os.path.basename(file_path))

        mem_zip.seek(0)
        zip_bytes = mem_zip.getvalue()

        # Guardar en caché
        try:
            with open(cache_file, "wb") as cf:
                cf.write(zip_bytes)
        except Exception as ce:
            logger.debug(f"Cache write error: {ce}")

        return zip_bytes


@app.get("/api/v1/download/gdrive/{drive_id}", tags=["Download Proxy"], summary="Descargar y empaquetar mapa de Google Drive en ZIP")
async def download_gdrive_endpoint(drive_id: str):
    """
    Descarga cualquier archivo o carpeta de Google Drive (Clone Hero) y lo devuelve como .ZIP estándar.
    """
    try:
        data = await asyncio.to_thread(download_gdrive_as_zip, drive_id)
        return Response(
            content=data,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="clonehero_{drive_id}.zip"',
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400"
            }
        )
    except Exception as e:
        logger.error(f"Error serving Google Drive map {drive_id}: {e}")
        raise HTTPException(status_code=502, detail=f"Error descargando mapa de Google Drive: {str(e)}")


@app.get("/api/proxy", tags=["Download Proxy"])
@app.post("/api/proxy", tags=["Download Proxy"])
@app.get("/api/v1/download/proxy", tags=["Download Proxy"], summary="Proxy de descarga para evitar problemas de CORS")
async def proxy_download(url: str = Query(..., description="URL directa del archivo a descargar (.osz, .zip, .sng)")):
    """
    Descarga y retransmite paquetes de beatmaps de forma 100% asíncrona y no bloqueante.
    """
    target_url = urllib.parse.unquote(url).strip()
    if not target_url or not target_url.startswith("http"):
        raise HTTPException(status_code=400, detail="URL de descarga inválida.")

    # Manejo especializado de Google Drive (Archivos y Carpetas)
    if "drive.google.com" in target_url or "drive.usercontent.google.com" in target_url or "folders/" in target_url:
        drive_id = ""
        if "id=" in target_url:
            drive_id = target_url.split("id=")[-1].split("&")[0]
        elif "/d/" in target_url:
            drive_id = target_url.split("/d/")[-1].split("/")[0]
        elif "/folders/" in target_url:
            drive_id = target_url.split("/folders/")[-1].split("/")[0].split("?")[0]

        if drive_id:
            try:
                zip_data = await asyncio.to_thread(download_gdrive_as_zip, drive_id)
                return Response(
                    content=zip_data,
                    media_type="application/zip",
                    headers={
                        "Content-Disposition": f'attachment; filename="clonehero_{drive_id}.zip"',
                        "Access-Control-Allow-Origin": "*",
                        "Cache-Control": "public, max-age=86400"
                    }
                )
            except Exception as e:
                logger.error(f"Error packing Google Drive {drive_id}: {e}")

    # List of fallback domains
    fallback_urls = []
    if "catboy.best/d/" in target_url:
        set_id = target_url.split("catboy.best/d/")[-1].split("?")[0]
        fallback_urls = [
            target_url,
            f"https://osu.direct/d/{set_id}",
            f"https://api.nerinyan.moe/d/{set_id}",
            f"https://beatconnect.io/b/{set_id}"
        ]
    elif "api.nerinyan.moe/d/" in target_url:
        set_id = target_url.split("api.nerinyan.moe/d/")[-1].split("?")[0]
        fallback_urls = [
            target_url,
            f"https://catboy.best/d/{set_id}",
            f"https://osu.direct/d/{set_id}",
            f"https://beatconnect.io/b/{set_id}"
        ]
    else:
        fallback_urls = [target_url]

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
    }

    def fetch_sync(fetch_url: str):
        req = urllib.request.Request(fetch_url, headers=headers)
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=12) as resp:
            content_type = resp.headers.get("Content-Type", "application/octet-stream")
            data = resp.read()
            return resp.status, content_type, data

    last_error = None
    for try_url in fallback_urls:
        try:
            status_code, content_type, data = await asyncio.to_thread(fetch_sync, try_url)

            if len(data) > 50 and status_code == 200:
                filename = "beatmap.zip"
                if ".osz" in try_url or "osu" in content_type:
                    filename = "beatmap.osz"
                elif ".qp" in try_url:
                    filename = "beatmap.qp"
                elif ".sng" in try_url:
                    filename = "beatmap.sng"

                return Response(
                    content=data,
                    media_type=content_type or "application/octet-stream",
                    headers={
                        "Content-Disposition": f'attachment; filename="{filename}"',
                        "Access-Control-Allow-Origin": "*",
                        "Cache-Control": "public, max-age=86400"
                    }
                )
        except Exception as e:
            last_error = e
            continue

    raise HTTPException(
        status_code=502,
        detail=f"No se pudo descargar el paquete desde el servidor remoto: {str(last_error)}"
    )


@app.get("/download/apk", tags=["Android App"], summary="Descargar APK para Android")
@app.get("/api/v1/app/download_apk", tags=["Android App"], summary="Descargar APK para Android")
async def download_android_apk():
    """
    Descarga directamente el archivo .apk generado para instalar en dispositivos móviles Android.
    Soporta redirección externa (APK_EXTERNAL_URL) para ahorrar 100% de ancho de banda en Render.
    """
    from fastapi.responses import FileResponse, RedirectResponse

    external_url = os.environ.get("APK_EXTERNAL_URL", "").strip()
    if external_url and (external_url.startswith("http://") or external_url.startswith("https://")):
        return RedirectResponse(url=external_url, status_code=302)

    apk_paths = [
        os.path.join(static_dir, "PianoCommunity.apk"),
        os.path.join(static_dir, "downloads", "PianoCommunity.apk"),
        os.path.join(static_dir, "downloads", "beatstar.apk"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk")
    ]

    for p in apk_paths:
        if os.path.exists(p):
            return FileResponse(
                path=p,
                filename="PianoCommunity.apk",
                media_type="application/vnd.android.package-archive",
                headers={
                    "Content-Disposition": 'attachment; filename="PianoCommunity.apk"',
                    "Cache-Control": "public, max-age=86400"
                }
            )

    raise HTTPException(
        status_code=404,
        detail="El archivo APK aún no ha sido compilado. Ejecuta 'build_android.bat' para generarlo."
    )


# Mount static directory at /static and at root / with aggressive browser caching
if os.path.exists(static_dir):
    app.mount("/", CachedStaticFiles(directory=static_dir, html=True), name="root_static")


