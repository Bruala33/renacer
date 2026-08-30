import os
import uvicorn

try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception:
    pass

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=False
    )
