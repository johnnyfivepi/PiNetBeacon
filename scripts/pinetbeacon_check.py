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
import time 
import dns.resolver             # type: ignore[import]

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
def run_dns_check(hostname: str, timeout: float, dns_servers=None):
    """
    Resolve `hostname` using one or more specific DNS servers and measure latency.

    Returns:
      (overall_status, overall_latency_ms, overall_error, per_server_results)

    - overall_status: "ok" if at least ONE server succeeds, else "error"
    - overall_latency_ms: fastest successful latency (ms) or None
    - overall_error: summary string or None
    - per_server_results: list of dicts: [{server, status, latency_ms, error}, ...]
    """
    if not hostname:
        return "skipped", None, None, []

    # Normalize dns_servers into a list
    if not dns_servers:
        dns_servers = []
    if isinstance(dns_servers, str):
        dns_servers = [dns_servers]

    per_server_results = []

    # If user didn't provide servers, let dnspython use system defaults once
    servers_to_try = dns_servers if dns_servers else [None]

    for server in servers_to_try:
        resolver = dns.resolver.Resolver()
        resolver.lifetime = float(timeout)  # total time allowed
        resolver.timeout = float(timeout)   # per-try timeout

        if server:
            resolver.nameservers = [server]

        start = time.monotonic()
        try:
            resolver.resolve(hostname, "A")
            elapsed_ms = (time.monotonic() - start) * 1000.0
            per_server_results.append(
                {
                    "server": server or "system",
                    "status": "ok",
                    "latency_ms": round(elapsed_ms, 3),
                    "error": None,
                }
            )
        except Exception as e:
            per_server_results.append(
                {
                    "server": server or "system",
                    "status": "error",
                    "latency_ms": None,
                    "error": str(e),
                }
            )

    # Roll up results
    successes = [r for r in per_server_results if r["status"] == "ok"]

    if successes:
        fastest = min(r["latency_ms"] for r in successes if r["latency_ms"] is not None)
        return "ok", fastest, None, per_server_results

    # No successes
    # Make a short readable summary error (use first error as the headline)
    first_err = per_server_results[0]["error"] if per_server_results else "unknown error"
    return "error", None, first_err, per_server_results

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
    dns_servers = cfg.get("dns_servers", [])

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
    dns_status, dns_latency_ms, dns_error, dns_results = run_dns_check(
        dns_hostname,
        dns_timeout,
        dns_servers,
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
        "dns_results": dns_results,
    }

    print(entry)
    log_result(entry)


if __name__ == "__main__":
    main()
