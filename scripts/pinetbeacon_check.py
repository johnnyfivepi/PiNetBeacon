#!/usr/bin/env python3
"""
PiNetBeacon: simple network check script.

- Reads config from scripts/config.json
- Pings a target host
- Resolves a DNS hostname
- Writes one JSON line per check to data/logs/pinetbeacon.log.jsonl
"""

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
import socket          
import time            

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
        return None, 100.0, "ping reported host unreachable or timed out"

    avg_latency = None
    packet_loss_percent = None

    for line in result.stdout.splitlines():
        if "packet loss" in line:
            try:
                loss_part = line.split(",")[2].strip()
                packet_loss_percent = float(loss_part.split("%")[0])
            except Exception:  # noqa: BLE001
                packet_loss_percent = None

        if "rtt min/avg/max" in line or "round-trip min/avg/max" in line:
            parts = line.split("=")[1].strip().split("/")
            avg_latency = float(parts[1])

    return avg_latency, packet_loss_percent, None


# -------------------------------------------------------
# NEW: DNS resolution helper
# -------------------------------------------------------
def run_dns_check(hostname: str, timeout: float):
    """
    Resolve a hostname and measure how long it takes.
    Returns (dns_status, dns_latency_ms, dns_error).
    """
    if not hostname:
        return "skipped", None, None

    old_timeout = socket.getdefaulttimeout()
    socket.setdefaulttimeout(timeout)
    start = time.monotonic()

    try:
        socket.getaddrinfo(hostname, 80)
        elapsed_ms = (time.monotonic() - start) * 1000.0
        return "ok", round(elapsed_ms, 3), None
    except Exception as e:
        return "error", None, str(e)
    finally:
        socket.setdefaulttimeout(old_timeout)


def log_result(entry: dict) -> None:
    """Append one JSON line to the log file."""
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")


def main() -> None:
    cfg = load_config()

    # Existing ping config
    target_host = cfg.get("target_host", "1.1.1.1")
    ping_count = cfg.get("ping_count", 3)
    ping_timeout = cfg.get("ping_timeout", 2)

    # NEW DNS config
    dns_hostname = cfg.get("dns_hostname", "")
    dns_timeout = cfg.get("dns_timeout", 2)

    timestamp = datetime.now(timezone.utc).isoformat()

    # ----------------------------
    # Run PING
    # ----------------------------
    avg_latency_ms, packet_loss_percent, error = run_ping(
        target_host,
        count=ping_count,
        timeout=ping_timeout,
    )

    # ----------------------------
    # Determine ping status
    # ----------------------------
    if error:
        status = "down"
        notes = error
    else:
        if packet_loss_percent is None or packet_loss_percent > 50.0:
            status = "down"
        else:
            status = "up"
        notes = "ok"

    # ----------------------------
    # NEW: Run DNS
    # ----------------------------
    dns_status, dns_latency_ms, dns_error = run_dns_check(
        dns_hostname,
        dns_timeout,
    )

    # Optional: degrade status if DNS fails but ping is fine
    if dns_status == "error" and status == "up":
        status = "degraded"
        if notes == "ok":
            notes = "DNS check failed"
        else:
            notes = f"{notes}; DNS check failed"

    # ----------------------------
    # Build log entry
    # ----------------------------
    entry = {
        "timestamp": timestamp,
        "target_host": target_host,
        "avg_latency_ms": avg_latency_ms,
        "packet_loss_percent": packet_loss_percent,
        "status": status,
        "notes": notes,

        # NEW DNS FIELDS
        "dns_hostname": dns_hostname,
        "dns_status": dns_status,
        "dns_latency_ms": dns_latency_ms,
        "dns_error": dns_error,
    }

    print(entry)
    log_result(entry)


if __name__ == "__main__":
    main()
