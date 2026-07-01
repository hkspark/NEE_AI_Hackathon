/* Insight Engine dashboard — renders KPIs, charts, and a filterable table
   from window.FEEDBACK_DATA (generated from data/feedback.csv). */
(function () {
  "use strict";

  const ALL = (window.FEEDBACK_DATA || []).map((r) => ({
    ...r,
    Rating: Number(r.Rating),
  }));

  const COLORS = {
    Positive: "#34d399",
    Negative: "#f87171",
    Mixed: "#fbbf24",
    accent: "#5b8cff",
    palette: ["#5b8cff", "#8b5cff", "#34d399", "#fbbf24", "#f87171", "#22d3ee", "#f472b6", "#a3e635"],
  };

  const state = { training: "", bu: "", sentiment: "", search: "", sortKey: null, sortDir: 1 };
  const charts = {};

  // ---- helpers ----
  const uniq = (key) => [...new Set(ALL.map((r) => r[key]).filter(Boolean))].sort();
  const $ = (id) => document.getElementById(id);

  function applyFilters() {
    return ALL.filter((r) =>
      (!state.training || r.TrainingName === state.training) &&
      (!state.bu || r.BusinessUnit === state.bu) &&
      (!state.sentiment || r.Sentiment === state.sentiment)
    );
  }

  function countBy(rows, key) {
    const m = new Map();
    rows.forEach((r) => m.set(r[key], (m.get(r[key]) || 0) + 1));
    return m;
  }

  function avgRatingBy(rows, key) {
    const sum = new Map(), cnt = new Map();
    rows.forEach((r) => {
      sum.set(r[key], (sum.get(r[key]) || 0) + r.Rating);
      cnt.set(r[key], (cnt.get(r[key]) || 0) + 1);
    });
    const out = new Map();
    sum.forEach((v, k) => out.set(k, v / cnt.get(k)));
    return out;
  }

  // ---- KPIs ----
  function renderKpis(rows) {
    const n = rows.length;
    const avg = n ? rows.reduce((a, r) => a + r.Rating, 0) / n : 0;
    const sent = countBy(rows, "Sentiment");
    const pos = sent.get("Positive") || 0;
    const neg = sent.get("Negative") || 0;
    const topTheme = [...countBy(rows, "Theme").entries()].sort((a, b) => b[1] - a[1])[0];
    const pct = (x) => (n ? Math.round((x / n) * 100) : 0);

    const cards = [
      { label: "Responses", value: n },
      { label: "Avg Rating", value: avg.toFixed(2), small: "/ 5" },
      { label: "Positive", value: pct(pos) + "%", small: `${pos}` },
      { label: "Negative", value: pct(neg) + "%", small: `${neg}` },
      { label: "Top Theme", value: topTheme ? topTheme[0] : "—", small: topTheme ? `${topTheme[1]}` : "" },
    ];
    $("kpis").innerHTML = cards
      .map(
        (c) =>
          `<div class="kpi"><div class="label">${c.label}</div>
           <div class="value">${c.value}${c.small ? ` <small>${c.small}</small>` : ""}</div></div>`
      )
      .join("");
  }

  // ---- charts ----
  function makeOrUpdate(id, config) {
    if (charts[id]) {
      charts[id].data = config.data;
      charts[id].options = config.options;
      charts[id].update();
    } else {
      charts[id] = new Chart($(id).getContext("2d"), config);
    }
  }

  const gridColor = "rgba(255,255,255,.06)";
  const tickColor = "#9aa6bf";
  const baseScales = {
    x: { ticks: { color: tickColor }, grid: { color: gridColor } },
    y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true },
  };
  const legendBottom = { legend: { labels: { color: "#e8ecf5" }, position: "bottom" } };

  function renderCharts(rows) {
    // Avg rating by training (horizontal bar)
    const art = avgRatingBy(rows, "TrainingName");
    makeOrUpdate("chart-rating-training", {
      type: "bar",
      data: {
        labels: [...art.keys()],
        datasets: [{ data: [...art.values()].map((v) => +v.toFixed(2)), backgroundColor: COLORS.accent, borderRadius: 6 }],
      },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { ...baseScales.y, max: 5 }, y: baseScales.x },
      },
    });

    // Sentiment doughnut
    const sent = countBy(rows, "Sentiment");
    makeOrUpdate("chart-sentiment", {
      type: "doughnut",
      data: {
        labels: [...sent.keys()],
        datasets: [{ data: [...sent.values()], backgroundColor: [...sent.keys()].map((k) => COLORS[k] || COLORS.accent) }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: legendBottom },
    });

    // Themes (horizontal bar, sorted desc)
    const themes = [...countBy(rows, "Theme").entries()].sort((a, b) => b[1] - a[1]);
    makeOrUpdate("chart-themes", {
      type: "bar",
      data: {
        labels: themes.map((t) => t[0]),
        datasets: [{ data: themes.map((t) => t[1]), backgroundColor: "#8b5cff", borderRadius: 6 }],
      },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } }, scales: baseScales,
      },
    });

    // Rating distribution 1..5 (as % of responses)
    const rdCounts = [1, 2, 3, 4, 5].map((s) => rows.filter((r) => r.Rating === s).length);
    const rdTotal = rdCounts.reduce((a, c) => a + c, 0);
    const rd = rdCounts.map((c) => (rdTotal ? +((c / rdTotal) * 100).toFixed(1) : 0));
    makeOrUpdate("chart-rating-dist", {
      type: "bar",
      data: {
        labels: ["1", "2", "3", "4", "5"],
        datasets: [{ data: rd, backgroundColor: ["#f87171", "#fb923c", "#fbbf24", "#a3e635", "#34d399"], borderRadius: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y}% (${rdCounts[ctx.dataIndex]} responses)`,
            },
          },
        },
        scales: {
          x: baseScales.x,
          y: { ...baseScales.y, max: 100, ticks: { ...baseScales.y.ticks, callback: (v) => v + "%" } },
        },
      },
    });

    // Sentiment by business unit (stacked)
    const bus = uniq("BusinessUnit").filter((b) => rows.some((r) => r.BusinessUnit === b));
    const sentiments = ["Positive", "Mixed", "Negative"];
    makeOrUpdate("chart-bu-sentiment", {
      type: "bar",
      data: {
        labels: bus,
        datasets: sentiments.map((s) => ({
          label: s,
          data: bus.map((b) => rows.filter((r) => r.BusinessUnit === b && r.Sentiment === s).length),
          backgroundColor: COLORS[s],
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false, plugins: legendBottom,
        scales: { x: { ...baseScales.x, stacked: true }, y: { ...baseScales.y, stacked: true } },
      },
    });

    // Delivery format (pie)
    const fmt = countBy(rows, "TrainingType");
    makeOrUpdate("chart-format", {
      type: "pie",
      data: {
        labels: [...fmt.keys()],
        datasets: [{ data: [...fmt.values()], backgroundColor: COLORS.palette }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: legendBottom },
    });
  }

  // ---- table ----
  function renderTable(rows) {
    let view = rows;
    if (state.search) {
      const q = state.search.toLowerCase();
      view = view.filter((r) =>
        [r.ResponseID, r.TrainingName, r.TrainingType, r.BusinessUnit, r.Role, r.Sentiment, r.Theme, r.FeedbackText, r.SuggestedAction]
          .join(" ").toLowerCase().includes(q)
      );
    }
    if (state.sortKey) {
      const k = state.sortKey, dir = state.sortDir;
      view = [...view].sort((a, b) => {
        let x = a[k], y = b[k];
        if (k === "Rating") { x = +x; y = +y; }
        return x < y ? -dir : x > y ? dir : 0;
      });
    }
    const tbody = $("response-table").querySelector("tbody");
    tbody.innerHTML = view
      .map(
        (r) => `<tr>
          <td>${r.ResponseID}</td>
          <td>${r.TrainingName}</td>
          <td>${r.TrainingType}</td>
          <td>${r.BusinessUnit}</td>
          <td>${r.Role}</td>
          <td>${r.Rating}</td>
          <td><span class="pill ${r.Sentiment}">${r.Sentiment}</span></td>
          <td>${r.Theme}</td>
          <td class="fb">${esc(r.FeedbackText)}</td>
          <td class="action">${esc(r.SuggestedAction)}</td>
        </tr>`
      )
      .join("");
    $("table-count").textContent = `Showing ${view.length} of ${ALL.length} responses`;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  // ---- wiring ----
  function renderAll() {
    const rows = applyFilters();
    renderKpis(rows);
    renderCharts(rows);
    renderTable(rows);
  }

  function fillSelect(id, key) {
    const sel = $(id);
    uniq(key).forEach((v) => {
      const o = document.createElement("option");
      o.value = v; o.textContent = v; sel.appendChild(o);
    });
  }

  function init() {
    fillSelect("filter-training", "TrainingName");
    fillSelect("filter-bu", "BusinessUnit");
    fillSelect("filter-sentiment", "Sentiment");

    $("filter-training").addEventListener("change", (e) => { state.training = e.target.value; renderAll(); });
    $("filter-bu").addEventListener("change", (e) => { state.bu = e.target.value; renderAll(); });
    $("filter-sentiment").addEventListener("change", (e) => { state.sentiment = e.target.value; renderAll(); });
    $("table-search").addEventListener("input", (e) => { state.search = e.target.value; renderTable(applyFilters()); });
    $("reset-filters").addEventListener("click", () => {
      state.training = state.bu = state.sentiment = state.search = "";
      state.sortKey = null; state.sortDir = 1;
      $("filter-training").value = ""; $("filter-bu").value = "";
      $("filter-sentiment").value = ""; $("table-search").value = "";
      renderAll();
    });

    const cols = ["ResponseID", "TrainingName", "TrainingType", "BusinessUnit", "Role", "Rating", "Sentiment", "Theme", "FeedbackText", "SuggestedAction"];
    $("response-table").querySelectorAll("thead th").forEach((th, i) => {
      th.addEventListener("click", () => {
        const key = cols[i];
        state.sortDir = state.sortKey === key ? -state.sortDir : 1;
        state.sortKey = key;
        renderTable(applyFilters());
      });
    });

    $("footer-meta").textContent = `${ALL.length} responses loaded`;
    renderAll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
