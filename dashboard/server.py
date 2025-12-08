#!/usr/bin/env python3
"""
PiNetBeacon dashboard server

This tiny HTTP server does two things:

1. Serves the static dashboard files (index.html, app.js, styles.css).
2. Exposes a couple of JSON endpoints so the frontend can read log data.

- /              -> serves index.html
- /app.js        -> serves the JS bundle
- /styles.css    -> serves the CSS
- /api/logs/latest -> returns recent log entries as JSON
- /api/health    -> returns a small status object (mostly useful for debugging)

You can start it with:

    cd dashboard
    python3 server.py

Then visit http://<your-pi-ip>:8080/ in a browser on the same network.
"""

import json
import os
from http.server import SimpleHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import List, Dict
from datetime import datetime, timezone

CONFIG_LAST_LOADED = datetime.now(timezone.utc).isoformat()

# Root directory for the dashboard files (this folder)
ROOT_DIR = Path(__file__).parent

# Log file location relative to the repo root
LOG_FILE = ROOT_DIR.parent / "data" / "logs" / "pinetbeacon.log.jsonl"

# How many recent entries to return from /api/logs/latest
MAX_ENTRIES = 200


def load_recent_entries() -> List[Dict]:
    """Load the last N entries from the JSONL log file.

    Each line in the file is expected to be a single JSON object.
    """
    if not LOG_FILE.exists():
        return []

    lines: List[str] = []
    with open(LOG_FILE, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                lines.append(line)

    # Only keep the last MAX_ENTRIES lines
    lines = lines[-MAX_ENTRIES:]

    entries: List[Dict] = []
    for line in lines:
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            # If a bad line sneaks in, skip it instead of crashing the dashboard
            continue
    return entries


class PiNetBeaconHandler(SimpleHTTPRequestHandler):
    """
    Custom request handler that:

    - Handles /api/* endpoints for JSON data
    - Falls back to SimpleHTTPRequestHandler for static files
    """

    def do_GET(self):
        # API endpoints first
        if self.path.startswith("/api/logs/latest"):
            self.handle_latest_logs()
        elif self.path.startswith("/api/health"):
            self.handle_health()
        else:
            # For everything else, serve normal static files from ROOT_DIR
            return super().do_GET()

    def handle_latest_logs(self):
        """Return a JSON payload with recent log entries."""
        entries = load_recent_entries()

        body = json.dumps({"entries": entries}, indent=2).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_health(self):
        """Return a simple health object so you can sanity-check the server."""
        exists = LOG_FILE.exists()
        entries = load_recent_entries() if exists else []

        now_utc = datetime.now(timezone.utc).isoformat()
        now_local = datetime.now().isoformat()

        info = {
            "log_file_exists": exists,
            "log_file_path": str(LOG_FILE),
            "entries_count": len(entries),
            "server_utc": now_utc,
            "server_local": now_local,

            # New: when config was last loaded (placeholder for now)
            "config_last_loaded": CONFIG_LAST_LOADED,
        }

        body = json.dumps(info, indent=2).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run(port: int = 8080):
    # Serve files from the dashboard directory by default
    os.chdir(ROOT_DIR)

    server_address = ("", port)
    httpd = HTTPServer(server_address, PiNetBeaconHandler)

    print(f"PiNetBeacon dashboard running on http://0.0.0.0:{port}/")
    print(f"Serving logs from: {LOG_FILE}")
    print("Press Ctrl+C to stop.\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    run()

