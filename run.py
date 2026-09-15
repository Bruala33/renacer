#!/usr/bin/env python3
"""
Launcher script for Render.com when configured as a Python service.
Runs the primary Node.js server (server.js).
"""
import os
import sys
import subprocess
import shutil

print("[Run.py] Initializing Piano Community server...", flush=True)

port = os.environ.get("PORT", "3000")
os.environ["PORT"] = str(port)
if "NODE_ENV" not in os.environ:
    os.environ["NODE_ENV"] = "production"

# Find node executable
node_bin = shutil.which("node")
if not node_bin:
    # Common paths on Linux / Render
    candidates = [
        "/usr/local/bin/node",
        "/usr/bin/node",
        "/opt/render/project/.nvm/versions/node/current/bin/node"
    ]
    for c in candidates:
        if os.path.exists(c) and os.access(c, os.X_OK):
            node_bin = c
            break

if not node_bin:
    node_bin = "node"

cmd = [node_bin, "server.js"]
print(f"[Run.py] Starting Node server on port {port}: {' '.join(cmd)}", flush=True)

try:
    proc = subprocess.run(cmd)
    sys.exit(proc.returncode)
except Exception as err:
    print(f"[Run.py] Error launching Node server: {err}", file=sys.stderr, flush=True)
    sys.exit(1)
