// PiNetBeacon dashboard frontend logic
//
// This file fetches data from the small HTTP API exposed by server.py:
//   - /api/logs/latest  -> recent log entries
//   - /api/health       -> basic health information
//
// It then updates the summary cards, table, and health box on the page.

// --- Theme handling (light / dark) ---
const PB_THEME_KEY = "pinetbeacon-theme";

function setTheme(theme) {
  const body = document.body;
  const btn = document.getElementById("theme-toggle");

  // Always set an explicit value so CSS can match [data-theme="light"/"dark"]
  body.dataset.theme = theme;

  if (btn) {
    btn.textContent = theme === "dark" ? "☀ Light" : "☾ Dark";
  }

  try {
    localStorage.setItem(PB_THEME_KEY, theme);
  } catch {
    // ignore storage errors (e.g., private mode)
  }
}

function initTheme() {
  const btn = document.getElementById("theme-toggle");

  let initial = "light";

  try {
    const stored = localStorage.getItem(PB_THEME_KEY);
    if (stored === "light" || stored === "dark") {
      initial = stored;
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      initial = "dark";
    }
  } catch {
    // ignore any localStorage issues
  }

  setTheme(initial);

  if (btn) {
    btn.addEventListener("click", () => {
      const next = document.body.dataset.theme === "dark" ? "light" : "dark";
      setTheme(next);
    });
  }
}

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

function formatNumber(value, decimals, fallback = "–") {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return value.toFixed(decimals);
}

function formatPercent(value, decimals = 1, fallback = "–") {
  return formatNumber(value, decimals, fallback);
}

function formatDnsResultsTooltip(dnsResults) {
  if (!Array.isArray(dnsResults) || dnsResults.length === 0) return "";

  return dnsResults
    .map((r) => {
      const server = r.server || "unknown";
      const status = r.status || "—";
      const ms =
        typeof r.latency_ms === "number"
          ? `${r.latency_ms.toFixed(1)}ms`
          : "–";
      const err = r.error ? ` (${r.error})` : "";
      return `• ${server}: ${status} · ${ms}${err}`;
    })
    .join("\n");
}

// Format Pi local time in a friendlier way
function formatLocalPiTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const date = d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return `${date} ${time}`;
  } catch {
    // Fall back to the raw string if parsing fails
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

  // DNS summary (clean + robust)
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

// Sorting state & helper
let currentEntries = [];
let sortState = {
  column: null, // "time", "latency", etc.
  direction: "asc",
};

// Filter state
let filterState = "all"; // "all" | "problems" | "dns"

// --- Filter counts (for badges in the buttons) ---
function computeFilterCounts(entries) {
  const total = entries.length;

  let problems = 0;
  let dnsIssues = 0;

  for (const e of entries) {
    const hasDnsIssue =
      e.dns_status &&
      e.dns_status !== "ok" &&
      e.dns_status !== "healthy";

    const isDown = e.status && e.status !== "up";

    if (isDown || hasDnsIssue) {
      problems += 1;
    }

    if (hasDnsIssue) {
      dnsIssues += 1;
    }
  }

  return { total, problems, dnsIssues };
}

function updateFilterCounts(entries) {
  const bar = document.getElementById("filter-bar");
  if (!bar) return;

  const buttons = bar.querySelectorAll(".pb-filter-btn");
  if (!buttons.length) return;

  const counts = computeFilterCounts(entries);

  buttons.forEach((btn) => {
    const filter = btn.getAttribute("data-filter");
    const baseLabel =
      btn.getAttribute("data-label") ||
      btn.textContent.replace(/\s*\(\d+\)$/u, ""); // safety fallback

    let count = null;

    if (filter === "all") {
      count = counts.total;
    } else if (filter === "problems") {
      count = counts.problems;
    } else if (filter === "dns") {
      count = counts.dnsIssues;
    }

    if (count === null) {
      btn.textContent = baseLabel;
    } else {
      btn.textContent = `${baseLabel} (${count})`;
    }
  });
}

// ---- Pi time state ----
let lastPiTimeDisplay = null; // pretty formatted local time
let lastPiFetchClientMs = null; // when we last fetched health (in ms)
let lastDriftSeconds = null; // clock drift between Pi and browser

function getSortLabel(column, direction) {
  const dirWord = direction === "desc" ? "▼" : "▲";

  switch (column) {
    case "time":
      return `Sorted by: Time (UTC) ${
        direction === "asc" ? "oldest first" : "newest first"
      } ${dirWord}`;
    case "target":
      return `Sorted by: Target ${dirWord}`;
    case "status":
      return `Sorted by: Status ${dirWord}`;
    case "latency":
      return `Sorted by: Latency (ms) ${dirWord}`;
    case "packet_loss":
      return `Sorted by: Packet loss (%) ${dirWord}`;
    case "dns_status":
      return `Sorted by: DNS status ${dirWord}`;
    case "dns_latency":
      return `Sorted by: DNS latency (ms) ${dirWord}`;
    default:
      return "";
  }
}

function updateSortStatus() {
  const bar = document.getElementById("sort-status");
  const labelEl = document.getElementById("sort-status-label");
  const resetBtn = document.getElementById("sort-reset-btn");

  if (!bar || !labelEl || !resetBtn) return;

  const hasSort = !!sortState.column;
  const label = hasSort
    ? getSortLabel(sortState.column, sortState.direction)
    : "";

  if (!hasSort || !label) {
    bar.classList.remove("pb-sort-status--visible");
    labelEl.textContent = "";

    // Optional: makes it feel less “clickable” when empty
    labelEl.disabled = true;
  } else {
    labelEl.textContent = label;
    bar.classList.add("pb-sort-status--visible");

    labelEl.disabled = false;
  }

  function resetSorting() {
    sortState.column = null;
    sortState.direction = "asc";

    const headers = document.querySelectorAll("#checks-table th[data-sort]");
    headers.forEach((h) => h.classList.remove("pb-sort-asc", "pb-sort-desc"));

    updateSortStatus();
    renderTable(currentEntries);
  }

  if (!resetBtn.dataset.pbResetHooked) {
    resetBtn.addEventListener("click", resetSorting);
    resetBtn.dataset.pbResetHooked = "true";
  }

  if (!labelEl.dataset.pbLabelHooked) {
    labelEl.addEventListener("click", () => {
      if (!sortState.column) return;
      resetSorting();
    });
    labelEl.dataset.pbLabelHooked = "true";
  }
}

function sortEntries(entries) {
  // Default: newest first by timestamp (reverse log order)
  if (!sortState.column) {
    return entries.slice().reverse();
  }

  const dir = sortState.direction === "desc" ? -1 : 1;

  // Latency (ms) — numeric, missing values go to bottom
  if (sortState.column === "latency") {
    return entries.slice().sort((a, b) => {
      const av =
        typeof a.avg_latency_ms === "number" ? a.avg_latency_ms : Infinity;
      const bv =
        typeof b.avg_latency_ms === "number" ? b.avg_latency_ms : Infinity;
      return (av - bv) * dir;
    });
  }

  // Time (UTC) — by timestamp
  if (sortState.column === "time") {
    return entries.slice().sort((a, b) => {
      const at = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bt = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return (at - bt) * dir; // asc = oldest→newest, desc = newest→oldest
    });
  }

  // Target — string (target_host)
  if (sortState.column === "target") {
    return entries.slice().sort((a, b) => {
      const at = (a.target_host || "").toString().toLowerCase();
      const bt = (b.target_host || "").toString().toLowerCase();
      if (at < bt) return -1 * dir;
      if (at > bt) return 1 * dir;
      return 0;
    });
  }

  // Status — string ("up"/"down")
  if (sortState.column === "status") {
    return entries.slice().sort((a, b) => {
      const at = (a.status || "").toString().toLowerCase();
      const bt = (b.status || "").toString().toLowerCase();
      if (at < bt) return -1 * dir;
      if (at > bt) return 1 * dir;
      return 0;
    });
  }

  // Packet loss (%) — numeric
  if (sortState.column === "packet_loss") {
    return entries.slice().sort((a, b) => {
      const av =
        typeof a.packet_loss_percent === "number"
          ? a.packet_loss_percent
          : Infinity;
      const bv =
        typeof b.packet_loss_percent === "number"
          ? b.packet_loss_percent
          : Infinity;
      return (av - bv) * dir;
    });
  }

  // DNS status — string
  if (sortState.column === "dns_status") {
    return entries.slice().sort((a, b) => {
      const at = (a.dns_status || "").toString().toLowerCase();
      const bt = (b.dns_status || "").toString().toLowerCase();
      if (at < bt) return -1 * dir;
      if (at > bt) return 1 * dir;
      return 0;
    });
  }

  // DNS latency (ms) — numeric
  if (sortState.column === "dns_latency") {
    return entries.slice().sort((a, b) => {
      const av =
        typeof a.dns_latency_ms === "number" ? a.dns_latency_ms : Infinity;
      const bv =
        typeof b.dns_latency_ms === "number" ? b.dns_latency_ms : Infinity;
      return (av - bv) * dir;
    });
  }

  // Fallback: default "newest first"
  return entries.slice().reverse();
}

function formatAge(diffSec) {
  if (diffSec <= 1) return "updated just now";
  if (diffSec < 60) return `updated ${diffSec}s ago`;

  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `updated ${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  return `updated ${hrs}h ago`;
}

function updatePiTimeLabel() {
  const piTimeEl = document.getElementById("pi-time");
  if (!piTimeEl || !lastPiTimeDisplay || lastPiFetchClientMs === null) return;

  const diffMs = Date.now() - lastPiFetchClientMs;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  const ageLabel = formatAge(diffSec);

  let driftText = "";
  let warn = false;

  if (typeof lastDriftSeconds === "number") {
    const driftRounded = Math.round(Math.abs(lastDriftSeconds));
    if (driftRounded > 3) {
      warn = true;
      driftText = ` · ⚠️ clock differs by ~${driftRounded}s`;
    }
  }

  piTimeEl.dataset.pbWarn = warn ? "true" : "false";

  piTimeEl.innerHTML = `<span class="pb-emoji">🕒</span> Pi local time: ${lastPiTimeDisplay} · ${ageLabel}${driftText}`;
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

  // Last status card
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

      // Color tiers
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

// Build a small history of numeric metric values for a given target_host
function buildMetricHistory(allEntries, targetHost, metricKey, maxPoints) {
  if (!targetHost) return [];

  const filtered = allEntries
    .filter(
      (e) =>
        e.target_host === targetHost &&
        typeof e[metricKey] === "number" &&
        e.timestamp
    )
    .slice();

  if (!filtered.length) return [];

  // Sort by timestamp ascending to get a proper time series
  filtered.sort((a, b) => {
    const at = new Date(a.timestamp).getTime() || 0;
    const bt = new Date(b.timestamp).getTime() || 0;
    return at - bt;
  });

  const tail = filtered.slice(-maxPoints);
  return tail.map((e) => e[metricKey]);
}

// Create a tiny SVG sparkline for a list of numeric values
function createSparklineSvg(values, extraClass) {
  if (!values.length) return null;

  const svgNS = "http://www.w3.org/2000/svg";
  const width = 60;
  const height = 20;

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.classList.add("pb-sparkline");
  if (extraClass) {
    svg.classList.add(extraClass);
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1; // avoid divide by zero

  const points = values
    .map((v, idx) => {
      const x =
        values.length === 1 ? width / 2 : (idx / (values.length - 1)) * width;

      const norm = (v - min) / span;
      const y = height - norm * (height - 2) - 1; // 1px padding top/bottom

      return `${x},${y}`;
    })
    .join(" ");

  const polyline = document.createElementNS(svgNS, "polyline");
  polyline.setAttribute("points", points);
  svg.appendChild(polyline);

  return svg;
}

// Build a one-line summary for sparkline tooltips
function buildSparklineSummary(values, unitsLabel) {
  if (!values.length) return "";
  const last = values[values.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  return `Last ${formatNumber(last, 1)} ${unitsLabel} · range ${formatNumber(min, 1)}–${formatNumber(max, 1)} ${unitsLabel}`;
}

// Copy a single log entry as pretty JSON to the clipboard
async function copyEntryAsJson(entry, button) {
  if (!entry) return;

  const json = JSON.stringify(entry, null, 2);
  let success = false;

  // Modern clipboard API (may require secure context)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(json);
      success = true;
    } catch (err) {
      console.warn("Clipboard write failed, falling back:", err);
    }
  }

  // Fallback for older / non-secure contexts
  if (!success) {
    const textarea = document.createElement("textarea");
    textarea.value = json;
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      success = true;
    } catch (err) {
      console.warn("execCommand copy failed:", err);
    } finally {
      document.body.removeChild(textarea);
    }
  }

  // Tiny visual confirmation on the button
  if (success && button) {
    const originalText = button.textContent;
    button.textContent = "Copied";
    button.disabled = true;

    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 900);
  }
}

function renderTable(entries) {
  const tbody = document.getElementById("checks-tbody");
  if (!tbody) {
    console.error("Table body element #checks-tbody not found.");
    return;
  }

  tbody.innerHTML = "";

  // No log entries at all
  if (!entries.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 10;
    td.className = "pb-empty-cell";

    const box = document.createElement("div");
    box.className = "pb-empty-state";

    const left = document.createElement("div");
    const h = document.createElement("h3");
    h.textContent = "No checks yet";
    const p = document.createElement("p");
    p.textContent =
      "PiNetBeacon hasn’t recorded any log entries yet. Run a check once, then refresh this page.";

    left.appendChild(h);
    left.appendChild(p);

    const actions = document.createElement("div");
    actions.className = "pb-empty-actions";

    const runHint = document.createElement("button");
    runHint.type = "button";
    runHint.className = "pb-empty-btn";
    runHint.textContent = "How do I run a check?";
    runHint.addEventListener("click", () => {
      alert("On the Pi: python3 scripts/pinetbeacon_check.py\n\nThen refresh this page.");
    });

    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "pb-empty-btn pb-empty-btn--primary";
    refresh.textContent = "Refresh";
    refresh.addEventListener("click", () => {
      updateDashboard();
    });

    actions.appendChild(runHint);
    actions.appendChild(refresh);

    box.appendChild(left);
    box.appendChild(actions);

    td.appendChild(box);
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  // 1) Order entries (newest first by default, or sorted by column)
  const ordered = sortEntries(entries);

  // 2) Apply filter on top of sorting
  const filtered = ordered.filter((entry) => {
    if (filterState === "problems") {
      const isDown = entry.status && entry.status !== "up";
      const hasDnsIssue =
        entry.dns_status &&
        entry.dns_status !== "ok" &&
        entry.dns_status !== "healthy";
      return isDown || hasDnsIssue;
    }

    if (filterState === "dns") {
      return entry.dns_status && entry.dns_status !== "ok";
    }

    // default: "all"
    return true;
  });

  // 3) Final rows to render
  const rowsToRender = filtered;

  // If we have entries overall, but none match this filter
  if (!rowsToRender.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 10;
    td.className = "pb-empty-cell";

    const box = document.createElement("div");
    box.className = "pb-empty-state";

    const left = document.createElement("div");
    const h = document.createElement("h3");
    h.textContent = "Nothing to show";
    const p = document.createElement("p");
    p.textContent =
      "No checks match this view right now. Try resetting the view to see all checks again.";

    left.appendChild(h);
    left.appendChild(p);

    const actions = document.createElement("div");
    actions.className = "pb-empty-actions";

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "pb-empty-btn pb-empty-btn--primary";
    reset.textContent = "Reset view";
    reset.addEventListener("click", () => {
      resetView();
    });

    actions.appendChild(reset);

    box.appendChild(left);
    box.appendChild(actions);

    td.appendChild(box);
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  // 4) Build table rows
  for (const entry of rowsToRender) {
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

    // Time
    const tdTime = document.createElement("td");
    tdTime.textContent = formatTimestamp(entry.timestamp);
    tr.appendChild(tdTime);

    // Target
    const tdTarget = document.createElement("td");
    tdTarget.textContent = entry.target_host || "–";
    tr.appendChild(tdTarget);

    // Status
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

    // Latency (numeric)
    const tdLatency = document.createElement("td");
    tdLatency.textContent = formatNumber(entry.avg_latency_ms, 1);
    tr.appendChild(tdLatency);

    // Latency trend (sparkline)
    const tdLatencySpark = document.createElement("td");
    tdLatencySpark.className = "pb-spark-cell";

    const latencyHistory = buildMetricHistory(
      entries,
      entry.target_host,
      "avg_latency_ms",
      20
    );

    if (latencyHistory.length >= 2) {
      const svg = createSparklineSvg(latencyHistory, null);
      if (svg) {
        const wrapper = document.createElement("div");
        wrapper.className = "pb-sparkline-wrapper";

        const tooltip = document.createElement("div");
        tooltip.className = "pb-sparkline-tooltip";

        wrapper.addEventListener("mouseenter", () => {
          const headRow = document.querySelector(".pb-table thead tr");
          if (!headRow) return;

          const headBottom = headRow.getBoundingClientRect().bottom;

          // Flip based on where the tooltip would land
          const tipTop = tooltip.getBoundingClientRect().top;

          wrapper.classList.toggle("pb-tooltip-below", tipTop < headBottom + 6);
        });

        wrapper.addEventListener("mouseleave", () => {
          wrapper.classList.remove("pb-tooltip-below");
        });

        const summaryText = buildSparklineSummary(latencyHistory, "ms");
        tooltip.textContent = summaryText;

        wrapper.appendChild(svg);
        wrapper.appendChild(tooltip);
        tdLatencySpark.appendChild(wrapper);
      }
    } else {
      tdLatencySpark.textContent = "—";
    }
    tr.appendChild(tdLatencySpark);

    // Packet loss
    const tdLoss = document.createElement("td");
    tdLoss.textContent = formatNumber(entry.packet_loss_percent, 1);
    tr.appendChild(tdLoss);

    // DNS status badge (same style family as Last status)
    const tdDnsStatus = document.createElement("td");

    // Wrapper so we can show our custom tooltip
    const wrap = document.createElement("span");
    wrap.className = "pb-tooltip-parent";

    // Badge
    const dnsBadge = document.createElement("span");
    dnsBadge.className = "pb-status-badge";

    const dnsStatusText = (entry.dns_status || "—").toString().toLowerCase();
    dnsBadge.textContent = dnsStatusText;

    // Badge colors
    if (dnsStatusText === "ok") {
      dnsBadge.classList.add("pb-status-badge--up");
    } else if (dnsStatusText === "partial") {
      dnsBadge.classList.add("pb-status-badge--warn");
    } else if (
      dnsStatusText === "fail" ||
      dnsStatusText === "error" ||
      dnsStatusText === "timeout" ||
      dnsStatusText === "down"
    ) {
      dnsBadge.classList.add("pb-status-badge--down");
    }

    // Optional small count under the badge (prevents giant pill)
    const ok = typeof entry.dns_ok === "number" ? entry.dns_ok : null;
    const total = typeof entry.dns_total === "number" ? entry.dns_total : null;

    let countEl = null;
    if (ok !== null && total !== null) {
      countEl = document.createElement("div");
      countEl.className = "pb-dns-count";
      countEl.textContent = `${ok}/${total}`;
    }

    // Tooltip content (per-server) 
      const tooltipText = formatDnsResultsTooltip(entry.dns_results); 
    
      // Build DOM
      wrap.appendChild(dnsBadge); 
      
      if (countEl) { 
        wrap.appendChild(countEl); 
      } 
      
      if (tooltipText) {
        // IMPORTANT: don't use native title tooltip
        dnsBadge.removeAttribute("title");

        const tip = document.createElement("div");
        tip.className = "pb-tooltip pb-tooltip--fixed";
        tip.textContent = tooltipText; // uses pre-line styling
        wrap.appendChild(tip);

        // ✅ Position fixed tooltip so it doesn't get clipped by the scroll container
        wrap.addEventListener("mouseenter", () => {
          const r = wrap.getBoundingClientRect();

          // Put tooltip BELOW the badge, centered
          tip.style.left = `${r.left + r.width / 2}px`;
          tip.style.top = `${r.bottom + 8}px`;
          tip.style.transform = "translateX(-50%)";
          tip.style.opacity = "1";
        });

        wrap.addEventListener("mouseleave", () => {
          tip.style.opacity = "0";
          // park it offscreen so it can't accidentally overlap stuff
          tip.style.transform = "translate(-9999px, -9999px)";
        });
      }
      
      tdDnsStatus.appendChild(wrap);
      tr.appendChild(tdDnsStatus); 
      
      // DNS latency (numeric) 
      const tdDnsLatency = document.createElement("td");
      tdDnsLatency.textContent = formatNumber(entry.dns_latency_ms, 2);
      tr.appendChild(tdDnsLatency);
      
      // DNS latency trend (sparkline) 
      const tdDnsSpark = document.createElement("td");
      tdDnsSpark.className = "pb-spark-cell"; 
      
      const dnsLatencyHistory = buildMetricHistory( 
        entries, 
        entry.target_host, 
        "dns_latency_ms", 20 
      ); 
      
      if (dnsLatencyHistory.length >= 2) { 
        const svgDns = createSparklineSvg(dnsLatencyHistory, "pb-sparkline--dns"); 
        if (svgDns) { 
          const wrapperDns = document.createElement("div"); 
          wrapperDns.className = "pb-sparkline-wrapper"; 
          
          const tooltipDns = document.createElement("div"); 
          tooltipDns.className = "pb-sparkline-tooltip"; 
          
          const summaryTextDns = buildSparklineSummary(dnsLatencyHistory, "ms DNS"); 
          tooltipDns.textContent = summaryTextDns; 
          
          // Flip tooltip below sticky header when needed (same idea as latency sparkline) 
          wrapperDns.addEventListener("mouseenter", () => { const headRow = document.querySelector(".pb-table thead tr"); 
            if (!headRow) return; 
            
            const headBottom = headRow.getBoundingClientRect().bottom; 
            
            // NOTE: tooltip must be in DOM before measuring, so we append first below. 
            // We'll measure after append using requestAnimationFrame. 
            requestAnimationFrame(() => { 
              const tipTop = tooltipDns.getBoundingClientRect().top; 
              wrapperDns.classList.toggle("pb-tooltip-below", tipTop < headBottom + 6); 
            }); 
          }); 
          
          wrapperDns.addEventListener("mouseleave", () => { 
            wrapperDns.classList.remove("pb-tooltip-below"); 
          }); 
          
          wrapperDns.appendChild(svgDns); 
          wrapperDns.appendChild(tooltipDns); 
          tdDnsSpark.appendChild(wrapperDns); 
          } 
        } else { 
          tdDnsSpark.textContent = "—"; } 
          tr.appendChild(tdDnsSpark); 
          
          // Notes + "copy as JSON" action 
          const tdNotes = document.createElement("td"); 
          
          const copyBtn = document.createElement("button"); 
          copyBtn.type = "button"; 
          copyBtn.className = "pb-copy-btn"; 
          copyBtn.textContent = "📋"; 
          copyBtn.title = "Copy this row as JSON"; 
          
          copyBtn.addEventListener("click", () => { 
            copyEntryAsJson(entry, copyBtn); 
          }); 
          
          tdNotes.appendChild(copyBtn); 
          
          if (entry.notes) { 
            const notesSpan = document.createElement("span"); 
            notesSpan.className = "pb-notes-text"; 
            notesSpan.textContent = entry.notes; 
            tdNotes.appendChild(notesSpan); 
          } 
          
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

    console.log("PB entries sample:", entries.slice(0, 3));

    // Update filter counts whenever new data comes in
    updateFilterCounts(entries);

    if (!sortState.column) {
      updateSortStatus(); // keeps bar hidden until you sort
    }

    const summary = computeSummary(entries);
    renderSummary(summary);
    renderTable(entries);

    // Show raw health JSON in the debug box
    if (healthEl) {
      healthEl.textContent = JSON.stringify(health, null, 2);
    }

    // ----- Pi local time + tooltip -----
    const piTimeEl = document.getElementById("pi-time");
    const piTimeTooltipEl = document.getElementById("pi-time-tooltip");

    if (piTimeEl && health && health.server_local) {
      const formatted = formatLocalPiTime(health.server_local);

      lastPiTimeDisplay = formatted;
      lastPiFetchClientMs = Date.now();

      // Compute drift vs client clock using server_utc if available
      lastDriftSeconds = null;
      if (health.server_utc) {
        const serverMs = Date.parse(health.server_utc);
        if (!Number.isNaN(serverMs)) {
          lastDriftSeconds = (serverMs - Date.now()) / 1000;
        }
      }

      // Remove native tooltip and feed our custom bubble
      piTimeEl.removeAttribute("title");
      if (piTimeTooltipEl) {
        piTimeTooltipEl.textContent =
          `Raw Pi local: ${health.server_local}\n` +
          `Raw Pi UTC: ${health.server_utc || "n/a"}`;
      }

      // Immediately render a nice label; the 1-second timer will keep it fresh
      updatePiTimeLabel();
    }

    // ----- Config autoload indicator + tooltip -----
    const configEl = document.getElementById("config-status");
    const configTooltipEl = document.getElementById("config-tooltip");

    if (configEl && health && health.config_last_loaded) {
      const loadedTs = health.config_last_loaded;

      const loadedDate = new Date(loadedTs);
      const now = Date.now();
      const diffSec = Math.floor((now - loadedDate.getTime()) / 1000);

      let ageLabel;
      if (diffSec < 1) {
        ageLabel = "just now";
      } else if (diffSec < 60) {
        ageLabel = `${diffSec}s ago`;
      } else {
        const mins = Math.floor(diffSec / 60);
        ageLabel = `${mins}m ago`;
      }

      configEl.innerHTML = `<span class="pb-emoji">🔄</span> Config loaded ${ageLabel}`;

      // Remove native tooltip and feed our custom bubble
      configEl.removeAttribute("title");
      if (configTooltipEl) {
        configTooltipEl.textContent = `Raw timestamp: ${loadedTs}`;
      }
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
      td.colSpan = 10; // keep in sync with table header
      td.textContent = "Error loading data. See the debug section below.";
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
  }
}

function setupSorting() {
  const headers = document.querySelectorAll("#checks-table th[data-sort]");
  if (!headers.length) return;

  headers.forEach((th) => {
    th.classList.add("pb-sortable");

    // Make headers keyboard-focusable
    th.setAttribute("tabindex", "0");
    th.setAttribute("role", "button");

    const label = (th.textContent || "column").trim();
    th.setAttribute("aria-label", `Sort by ${label}`);

    // Keyboard activation (Enter / Space) — guard already present
    if (!th.dataset.pbKeyHooked) {
      th.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          th.click();
        }
      });
      th.dataset.pbKeyHooked = "true";
    }

    if (!th.dataset.pbClickHooked) {
      th.addEventListener("click", () => {
        const column = th.getAttribute("data-sort");
        if (!column) return;

        if (sortState.column === column) {
          sortState.direction =
            sortState.direction === "asc" ? "desc" : "asc";
        } else {
          sortState.column = column;
          sortState.direction = "asc";
        }

        // Clear arrows from all sortable headers
        headers.forEach((h) =>
          h.classList.remove("pb-sort-asc", "pb-sort-desc")
        );

        // Add arrow to the active header
        th.classList.add(
          sortState.direction === "asc" ? "pb-sort-asc" : "pb-sort-desc"
        );

        renderTable(currentEntries);
        updateSortStatus();
      });

      th.dataset.pbClickHooked = "true";
    }
    // ⬆️⬆️⬆️ END NEW GUARD ⬆️⬆️⬆️
  });
}

function scrollToTableTop() {
  const sectionHeader = document.querySelector(".pb-section-header h2");
  if (sectionHeader && sectionHeader.scrollIntoView) {
    sectionHeader.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function resetView(options = {}) {
  const { scroll = false } = options;

  // Reset sort
  sortState.column = null;
  sortState.direction = "asc";

  const headers = document.querySelectorAll("#checks-table th[data-sort]");
  headers.forEach((h) => {
    h.classList.remove("pb-sort-asc", "pb-sort-desc");
  });

  // Reset filter
  filterState = "all";

  const bar = document.getElementById("filter-bar");
  if (bar) {
    const buttons = bar.querySelectorAll(".pb-filter-btn");
    buttons.forEach((btn) => {
      const value = btn.getAttribute("data-filter");
      btn.classList.toggle(
        "pb-filter-btn--active",
        value === "all"
      );
    });
  }

  // Update UI
  updateSortStatus();
  renderTable(currentEntries);

  // only scroll if we asked for it
  if (scroll) {
    scrollToTableTop();
  }
}

function setupFilterBar() {
  const bar = document.getElementById("filter-bar");
  if (!bar) return;

  const buttons = bar.querySelectorAll(".pb-filter-btn");
  if (!buttons.length) return;

  // Wire filter pills
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.getAttribute("data-filter");
      if (!value) return;

      filterState = value;

      // Update active styling
      buttons.forEach((b) =>
        b.classList.toggle("pb-filter-btn--active", b === btn)
      );

      // Re-render using current entries + sort
      renderTable(currentEntries);
    });
  });

  const resetBtn = document.getElementById("reset-view-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetView(); // no scroll
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupSorting();
  setupFilterBar();

  // Initial load
  updateDashboard();

  // Keep the “updated Xs ago” label fresh
  setInterval(updatePiTimeLabel, 1000);

  const refreshButton = document.getElementById("refresh-btn");
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      updateDashboard();
    });
  }

  // Periodic refresh
  setInterval(updateDashboard, 30000);
});

