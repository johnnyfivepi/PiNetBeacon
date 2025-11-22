#!/usr/bin/env python3
"""
PiNetBeacon: simple network check script.

- Reads config from scripts/config.json
- Pings a target host
- Writes one JSON line per check to data/logs/pinetbeacon.log.jsonl
"""

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

# Paths are relative to this file so the script works wherever you call it from.
CONFIG_PATH = Path(__file__).parent / "config.json"
LOG_DIR = Path(__file__).parent.parent / "data" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "pinetbeacon.log.jsonl"


def load_config() -> dict:
    """Load settings from config.json."""
    with open(CONFIG_PATH) as f:
        return json.load(f)


def run_ping(host: str, count: int = 3, timeout: int = 2):
    """
    Run a simple ping and return:

    - avg_latency_ms (float or None)
    - packet_loss_percent (float or None)
    - error_message (str or None)
    """
    try:
        # On Linux, ping uses:
        #   -c for count, -W for timeout (seconds)
        result = subprocess.run(
            ["ping", "-c", str(count), "-W", str(timeout), host],
            capture_output=True,
            text=True,
            check=False,
        )
    except Exception as e:  # noqa: BLE001
        return None, 100.0, f"ping command failed: {e}"

    if result.returncode != 0:
        # Non-zero exit often means 100% packet loss or unreachable host
        return None, 100.0, "ping reported host unreachable or timed out"

    avg_latency = None
    packet_loss_percent = None

    for line in result.stdout.splitlines():
        if "packet loss" in line:
            # Example: "3 packets transmitted, 3 received, 0% packet loss"
            try:
                loss_part = line.split(",")[2].strip()
                packet_loss_percent = float(loss_part.split("%")[0])
            except Exception:  # noqa: BLE001
                packet_loss_percent = None

        if "rtt min/avg/max" in line or "round-trip min/avg/max" in line:
            # Example: "rtt min/avg/max/mdev = 18.123/23.456/30.789/4.321 ms"
            parts = line.split("=")[1].strip().split("/")
            avg_latency = float(parts[1])

    return avg_latency, packet_loss_percent, None


def log_result(entry: dict) -> None:
    """Append one JSON line to the log file."""
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")


def main() -> None:
    cfg = load_config()
    target_host = cfg.get("target_host", "1.1.1.1")
    ping_count = cfg.get("ping_count", 3)
    ping_timeout = cfg.get("ping_timeout", 2)

    timestamp = datetime.now(timezone.utc).isoformat()

    avg_latency_ms, packet_loss_percent, error = run_ping(
        target_host,
        count=ping_count,
        timeout=ping_timeout,
    )

    if error:
        status = "down"
        notes = error
    else:
        if packet_loss_percent is None or packet_loss_percent > 50.0:
            status = "down"
        else:
            status = "up"
        notes = "ok"

    entry = {
        "timestamp": timestamp,
        "target_host": target_host,
        "avg_latency_ms": avg_latency_ms,
        "packet_loss_percent": packet_loss_percent,
        "status": status,
        "notes": notes,
    }

    print(entry)
    log_result(entry)


if __name__ == "__main__":
    main()
