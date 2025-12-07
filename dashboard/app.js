// PiNetBeacon dashboard frontend logic
//
// This file fetches data from the small HTTP API exposed by server.py:
//   - /api/logs/latest  -> recent log entries
//   - /api/health       -> basic health information
//
// It then updates the summary cards, table, and health box on the page.

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

// Format timestamps in a way that's easy to skim
function formatTimestamp(ts) {
  if (!ts) return "–";
  try {
    const d = new Date(ts);
    return d.toISOString().replace("T", " ").replace("Z", " UTC");
  } catch {
    return ts;
  }
}

// Compute simple summary stats from the list of entries
function computeSummary(entries) {
  if (!entries.length) {
    return {
      lastStatus: "no data",
      lastTimestamp: null,
      avgLatency: null,
      availability: null,
      dnsHealthPct: null,
      dnsAvgLatency: null,
    };
  }

  const last = entries[entries.length - 1];

  // ping summary
  const latencies = entries
    .map((e) => e.avg_latency_ms)
    .filter((v) => typeof v === "number");

  const upCount = entries.filter((e) => e.status === "up").length;

  const avgLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((sum, v) => sum + v, 0) / latencies.length)
      : null;

  const availability =
    entries.length > 0 ? Math.round((upCount / entries.length) * 100) : null;

  // --- DNS summary (clean + robust) ---
  const dnsEntries = entries.filter(
    (e) => typeof e.dns_status === "string" && e.dns_status.length > 0
  );

  const dnsOkCount = dnsEntries.filter((e) => e.dns_status === "ok").length;

  const dnsHealthPct = dnsEntries.length
    ? (dnsOkCount / dnsEntries.length) * 100
    : null;

  const dnsLatencySamples = entries.filter(
    (e) => typeof e.dns_latency_ms === "number"
  );
  const dnsAvgLatency = dnsLatencySamples.length
    ? dnsLatencySamples.reduce((sum, e) => sum + e.dns_latency_ms, 0) /
      dnsLatencySamples.length
    : null;

  return {
    lastStatus: last.status || "unknown",
    lastTimestamp: last.timestamp || null,
    avgLatency,
    availability,
    dnsHealthPct,
    dnsAvgLatency,
  };
}

// ------- Sorting state & helper -------

let currentEntries = [];
let sortState = {
  column: null,   // e.g. "latency"
  direction: "asc",
};

function sortEntries(entries) {
  // Default: same as before, newest first
  if (!sortState.column) {
    return entries.slice().reverse();
  }

  if (sortState.column === "latency") {
    const dir = sortState.direction === "desc" ? -1 : 1;
    return entries.slice().sort((a, b) => {
      const av =
        typeof a.avg_latency_ms === "number" ? a.avg_latency_ms : Infinity;
      const bv =
        typeof b.avg_latency_ms === "number" ? b.avg_latency_ms : Infinity;
      return (av - bv) * dir;
    });
  }

  // Fallback: no special sort, but keep newest at top
  return entries.slice().reverse();
}

function renderSummary(summary) {
  const lastStatusEl = document.getElementById("last-status-value");
  const lastStatusTimeEl = document.getElementById("last-status-time");
  const avgLatencyEl = document.getElementById("avg-latency");
  const availabilityEl = document.getElementById("availability");

  if (!lastStatusEl || !lastStatusTimeEl || !avgLatencyEl || !availabilityEl) {
    console.error("One or more summary elements are missing from the DOM.");
    return;
  }

  // ----- Last status card -----
  lastStatusEl.textContent = summary.lastStatus;

  // Reset classes first
  lastStatusEl.className = "";

  if (summary.lastStatus === "up") {
    lastStatusEl.className = "pb-status-badge pb-status-badge--up";
  } else if (summary.lastStatus === "down") {
    lastStatusEl.className = "pb-status-badge pb-status-badge--down";
  }

  lastStatusTimeEl.textContent = summary.lastTimestamp
    ? formatTimestamp(summary.lastTimestamp)
    : "";

  avgLatencyEl.textContent =
    typeof summary.avgLatency === "number"
      ? summary.avgLatency.toString()
      : "–";

  let availNumeric = null;
  if (typeof summary.availability === "number") {
    availNumeric = summary.availability;
    availabilityEl.textContent = summary.availability.toString() + "%";
  } else {
    availabilityEl.textContent = "–";
  }

  updateAvailabilityBar(availNumeric);

  // ----- DNS summary card -----
  const dnsStatusEl = document.getElementById("dns-status-value");
  const dnsLatencySummaryEl = document.getElementById("dns-latency-summary");

  if (dnsStatusEl && dnsLatencySummaryEl) {
    if (summary.dnsHealthPct === null) {
      dnsStatusEl.textContent = "—";
      dnsStatusEl.className = ""; // no badge when we have no data yet
      dnsLatencySummaryEl.textContent = "No DNS data yet";
    } else {
      const pct = summary.dnsHealthPct.toFixed(1);

      // Base badge class: reuse the same pill style as Last status
      dnsStatusEl.className = "pb-status-badge";

      dnsStatusEl.textContent = pct === "100.0" ? "ok" : `${pct}% ok`;

      // Color tiers (you already have --up and --down in CSS)
      if (summary.dnsHealthPct >= 99) {
        dnsStatusEl.classList.add("pb-status-badge--up");
      } else if (summary.dnsHealthPct >= 80) {
        dnsStatusEl.classList.add("pb-status-badge--warn");
      } else {
        dnsStatusEl.classList.add("pb-status-badge--down");
      }

      if (typeof summary.dnsAvgLatency === "number") {
        dnsLatencySummaryEl.textContent = `Avg DNS latency: ${summary.dnsAvgLatency.toFixed(
          2
        )} ms`;
      } else {
        dnsLatencySummaryEl.textContent = "No DNS latency samples yet";
      }
    }
  }
}

// Availability bar updater
function updateAvailabilityBar(availPercent) {
  const barFillEl = document.getElementById("availability-bar-fill");
  if (!barFillEl) return;

  // Reset classes
  barFillEl.classList.remove("ok", "warn", "crit");

  if (typeof availPercent !== "number" || !Number.isFinite(availPercent)) {
    barFillEl.style.width = "0%";
    return;
  }

  const pct = Math.max(0, Math.min(100, availPercent));
  barFillEl.style.width = `${pct}%`;

  if (pct >= 99.9) {
    barFillEl.classList.add("ok");
  } else if (pct >= 95) {
    barFillEl.classList.add("warn");
  } else {
    barFillEl.classList.add("crit");
  }
}

function renderTable(entries) {
  const tbody = document.getElementById("checks-tbody");
  if (!tbody) {
    console.error("Table body element #checks-tbody not found.");
    return;
  }

  tbody.innerHTML = "";

  if (!entries.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 8; // matches the 8 columns in the table header
    td.textContent =
      "No log entries found yet. Try running pinetbeacon_check.py.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  // Order entries (newest first by default, or sorted by column)
  const ordered = sortEntries(entries);

  for (const entry of ordered) {
    const tr = document.createElement("tr");

    // Color the row based on DNS status
    const dnsStatus = entry.dns_status;
    if (dnsStatus === "ok") {
      tr.classList.add("pb-row-dns-ok");
    } else if (
      dnsStatus === "fail" ||
      dnsStatus === "error" ||
      dnsStatus === "timeout" ||
      dnsStatus === "down"
    ) {
      tr.classList.add("pb-row-dns-bad");
    } else if (typeof dnsStatus === "string" && dnsStatus.length > 0) {
      // anything that's not clearly ok/bad but still a string
      tr.classList.add("pb-row-dns-warn");
    }

    const tdTime = document.createElement("td");
    tdTime.textContent = formatTimestamp(entry.timestamp);
    tr.appendChild(tdTime);

    const tdTarget = document.createElement("td");
    tdTarget.textContent = entry.target_host || "–";
    tr.appendChild(tdTarget);

    const tdStatus = document.createElement("td");
    const badge = document.createElement("span");
    badge.textContent = entry.status || "unknown";
    badge.className = "pb-status-badge";
    if (entry.status === "up") {
      badge.classList.add("pb-status-badge--up");
    } else if (entry.status === "down") {
      badge.classList.add("pb-status-badge--down");
    }
    tdStatus.appendChild(badge);
    tr.appendChild(tdStatus);

    const tdLatency = document.createElement("td");
    tdLatency.textContent =
      typeof entry.avg_latency_ms === "number"
        ? entry.avg_latency_ms.toFixed(1)
        : "–";
    tr.appendChild(tdLatency);

    const tdLoss = document.createElement("td");
    tdLoss.textContent =
      typeof entry.packet_loss_percent === "number"
        ? entry.packet_loss_percent.toFixed(1)
        : "–";
    tr.appendChild(tdLoss);

    // DNS status badge (same style family as Last status)
    const tdDnsStatus = document.createElement("td");
    const dnsBadge = document.createElement("span");
    const dnsStatusText = entry.dns_status || "—";

    dnsBadge.textContent = dnsStatusText;
    dnsBadge.className = "pb-status-badge";

    if (dnsStatusText === "ok") {
      dnsBadge.classList.add("pb-status-badge--up");
    } else if (
      dnsStatusText === "fail" ||
      dnsStatusText === "error" ||
      dnsStatusText === "timeout" ||
      dnsStatusText === "down"
    ) {
      dnsBadge.classList.add("pb-status-badge--down");
    }
    // any other string just stays neutral

    tdDnsStatus.appendChild(dnsBadge);
    tr.appendChild(tdDnsStatus);

    // DNS latency
    const tdDnsLatency = document.createElement("td");
    tdDnsLatency.textContent =
      typeof entry.dns_latency_ms === "number"
        ? entry.dns_latency_ms.toFixed(2)
        : "–";
    tr.appendChild(tdDnsLatency);

    const tdNotes = document.createElement("td");
    tdNotes.textContent = entry.notes || "";
    tr.appendChild(tdNotes);

    tbody.appendChild(tr);
  }
}

async function updateDashboard() {
  const healthEl = document.getElementById("health-json");

  try {
    const [logs, health] = await Promise.all([
      fetchJson("/api/logs/latest"),
      fetchJson("/api/health"),
    ]);

    const entries = logs.entries || [];
    currentEntries = entries; // save for re-sorting

    const summary = computeSummary(entries);

    renderSummary(summary);
    renderTable(entries);

    if (healthEl) {
      healthEl.textContent = JSON.stringify(health, null, 2);
    }
  } catch (err) {
    console.error(err);
    if (healthEl) {
      healthEl.textContent =
        "Error loading data from server. Check that server.py is running and that logs exist.\n\n" +
        String(err);
    }

    const tbody = document.getElementById("checks-tbody");
    if (tbody) {
      tbody.innerHTML = "";
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 8; // keep in sync with table header
      td.textContent = "Error loading data. See the debug section below.";
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
  }
}

function setupLatencySorting() {
  const latencyHeader = document.querySelector(
    '#checks-table th[data-sort="latency"]'
  );
  if (!latencyHeader) return;

  latencyHeader.classList.add("pb-sortable");

  latencyHeader.addEventListener("click", () => {
    if (sortState.column === "latency") {
      // toggle direction
      sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
    } else {
      sortState.column = "latency";
      sortState.direction = "asc";
    }

    // Update visual indicator on this header
    latencyHeader.classList.toggle("pb-sort-asc", sortState.direction === "asc");
    latencyHeader.classList.toggle("pb-sort-desc", sortState.direction === "desc");

    // Re-render table with new sort
    renderTable(currentEntries);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupLatencySorting();

  // Initial load
  updateDashboard();

  const refreshButton = document.getElementById("refresh-btn");
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      updateDashboard();
    });
  }

  // Auto-refresh every 30 seconds
  setInterval(updateDashboard, 30000);
});

