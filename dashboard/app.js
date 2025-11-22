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
    };
  }

  const last = entries[entries.length - 1];

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

  return {
    lastStatus: last.status || "unknown",
    lastTimestamp: last.timestamp || null,
    avgLatency,
    availability,
  };
}

function renderSummary(summary) {
  // 🔁 Updated IDs to match your HTML
  const lastStatusEl = document.getElementById("last-status-value");
  const lastStatusTimeEl = document.getElementById("last-status-time");
  const avgLatencyEl = document.getElementById("avg-latency");
  const availabilityEl = document.getElementById("availability");

  if (!lastStatusEl || !lastStatusTimeEl || !avgLatencyEl || !availabilityEl) {
    console.error("One or more summary elements are missing from the DOM.");
    return;
  }

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

  availabilityEl.textContent =
    typeof summary.availability === "number"
      ? summary.availability.toString() + "%"
      : "–";
}

function renderTable(entries) {
  // 🔁 Updated ID to match your HTML
  const tbody = document.getElementById("checks-tbody");
  if (!tbody) {
    console.error("Table body element #checks-tbody not found.");
    return;
  }

  tbody.innerHTML = "";

  if (!entries.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent =
      "No log entries found yet. Try running pinetbeacon_check.py.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  // Show most recent entries at the top
  const reversed = entries.slice().reverse();

  for (const entry of reversed) {
    const tr = document.createElement("tr");

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

    const tdNotes = document.createElement("td");
    tdNotes.textContent = entry.notes || "";
    tr.appendChild(tdNotes);

    tbody.appendChild(tr);
  }
}

async function updateDashboard() {
  // 🔁 Updated ID to match your HTML
  const healthEl = document.getElementById("health-json");

  try {
    const [logs, health] = await Promise.all([
      fetchJson("/api/logs/latest"),
      fetchJson("/api/health"),
    ]);

    const entries = logs.entries || [];
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
      td.colSpan = 6;
      td.textContent = "Error loading data. See the debug section below.";
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initial load
  updateDashboard();

  // 🔁 Updated refresh button ID to match your HTML
  const refreshButton = document.getElementById("refresh-btn");
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      updateDashboard();
    });
  }

  // Auto-refresh every 30 seconds
  setInterval(updateDashboard, 30000);
});
