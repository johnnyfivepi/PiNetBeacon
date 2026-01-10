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
def run_dns_check(hostname: str, timeout: float, servers=None):
    """
    Resolve a hostname using one or more specific DNS servers and measure latency.

    Returns:
      (dns_status, dns_latency_ms, dns_error, dns_results, dns_ok, dns_total)

    dns_status:
      - "ok"      = all servers succeeded
      - "partial" = some succeeded
      - "error"   = none succeeded

    dns_latency_ms:
      - worst (max) latency among successful servers, or None if none succeeded
    """
    if not hostname:
        return "skipped", None, None, [], 0, 0

    servers = servers or []
    results = []

    # If no servers are provided, fall back to system resolver once
    if not servers:
        resolver = dns.resolver.Resolver()
        resolver.lifetime = float(timeout)
        resolver.timeout = float(timeout)

        start = time.monotonic()
        try:
            resolver.resolve(hostname, "A")
            elapsed_ms = (time.monotonic() - start) * 1000.0
            results.append({"server": "system", "status": "ok", "latency_ms": round(elapsed_ms, 3), "error": None})
        except Exception as e:
            results.append({"server": "system", "status": "error", "latency_ms": None, "error": str(e)})
    else:
        for server in servers:
            resolver = dns.resolver.Resolver(configure=False)
            resolver.nameservers = [server]
            resolver.lifetime = float(timeout)
            resolver.timeout = float(timeout)

            start = time.monotonic()
            try:
                resolver.resolve(hostname, "A")
                elapsed_ms = (time.monotonic() - start) * 1000.0
                results.append({"server": server, "status": "ok", "latency_ms": round(elapsed_ms, 3), "error": None})
            except Exception as e:
                results.append({"server": server, "status": "error", "latency_ms": None, "error": str(e)})

    dns_total = len(results)
    ok_latencies = [
        r["latency_ms"] for r in results
        if r.get("status") == "ok" and isinstance(r.get("latency_ms"), (int, float))
    ]
    dns_ok = len(ok_latencies)

    if dns_total == 0:
        return "skipped", None, None, [], 0, 0

    if dns_ok == 0:
        return "error", None, "All DNS servers failed", results, dns_ok, dns_total

    # worst successful latency (max)
    dns_latency_ms = max(ok_latencies)

    if dns_ok == dns_total:
        return "ok", dns_latency_ms, None, results, dns_ok, dns_total

    return "partial", dns_latency_ms, "Some DNS servers failed", results, dns_ok, dns_total

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
    dns_status, dns_latency_ms, dns_error, dns_results, dns_ok, dns_total = run_dns_check(
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
        "dns_ok": dns_ok,
        "dns_total": dns_total,
    }

    print(entry)
    log_result(entry)


if __name__ == "__main__":
    main()
