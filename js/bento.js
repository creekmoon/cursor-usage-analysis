import { calcCostParts } from "./aggregate.js";
import { formatInt, formatPct, formatTokens, formatUsd } from "./format.js";
import { getLocale, t, tokenLabel } from "./i18n.js";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[ch]));
}

function monthDay(iso) {
  if (!iso) return "—";
  const [, m, d] = iso.split("-");
  if (getLocale() === "en") {
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return names[Number(m) - 1] + " " + Number(d);
  }
  return Number(m) + "月" + Number(d) + "日";
}

export function slashDate(iso) {
  if (!iso) return "—";
  const [, m, d] = iso.split("-");
  return Number(m) + "/" + Number(d);
}

function modelTokens(model) {
  if (Number.isFinite(model.tokens)) return model.tokens;
  return (model.input || 0) + (model.cacheWrite || 0) + (model.cacheRead || 0) + (model.output || 0);
}

function padDaily(summary, range) {
  const byDate = new Map((summary.daily || []).map((day) => [day.date, day]));
  if (!range?.start || !range?.end) return summary.daily || [];
  const days = [];
  const [ys, ms, ds] = range.start.split("-").map(Number);
  const cursor = new Date(Date.UTC(ys, ms - 1, ds));
  const end = range.end;
  while (cursor.toISOString().slice(0, 10) <= end && days.length < 400) {
    const iso = cursor.toISOString().slice(0, 10);
    days.push(byDate.get(iso) || {
      date: iso,
      cost: 0,
      firstPartyCost: 0,
      apiCost: 0,
      events: 0,
      tokens: 0,
      models: []
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function dayModel(day, name) {
  return (day.models || []).find((model) => model.name === name) || null;
}

function verdict(summary) {
  const cost = summary.favorites?.byCost;
  const tokens = summary.favorites?.byTokens;
  if (summary.favorites?.costTokenMismatch && cost?.name && tokens?.name) {
    const calls = summary.models.find((model) => model.name === cost.name)?.events || 0;
    return t("bento.verdict.mismatch", {
      tokenName: tokens.name,
      tokenPct: formatPct(tokens.share),
      costName: cost.name,
      calls: formatInt(calls),
      costPct: formatPct(cost.share)
    });
  }
  if (cost?.name && summary.peakDay?.date) {
    const pool = summary.dominantPoolKey === "api" ? t("bento.api") : t("bento.fp");
    return t("bento.verdict.lead", {
      pool,
      poolPct: formatPct(summary.dominantPoolShare),
      name: cost.name,
      pct: formatPct(cost.share),
      date: monthDay(summary.peakDay.date)
    });
  }
  return "";
}

function poolEvents(summary, pool) {
  return summary.models
    .filter((model) => model.pool === pool)
    .reduce((sum, model) => sum + model.events, 0);
}

const PART_ORDER = ["cacheRead", "output", "input", "cacheWrite"];

function svgNode(name, attrs) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.keys(attrs).forEach((key) => node.setAttribute(key, attrs[key]));
  return node;
}

function shortDay(iso) {
  return Number(iso.slice(5, 7)) + "/" + Number(iso.slice(8));
}

function drawChart(host, summary, state) {
  const days = padDaily(summary, state.range);
  host.replaceChildren();
  if (!days.length) return;

  const width = 640;
  const height = 232;
  const padL = 46;
  const padR = 10;
  const padT = 14;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const slot = innerW / days.length;
  const barW = Math.max(3, Math.min(18, slot * 0.62));
  const name = state.selectedModel;
  const fpColor = "#14161A";
  const apiColor = "#DC4A25";

  function valueOf(day, pool) {
    if (name) {
      const model = dayModel(day, name);
      if (!model) return 0;
      if (state.metric === "events") return model.events || 0;
      if (state.metric === "tokens") return modelTokens(model);
      return model.cost || 0;
    }
    if (state.metric === "events") return day.events || 0;
    if (state.metric === "tokens") return day.tokens || 0;
    if (pool === "fp") return day.firstPartyCost || 0;
    if (pool === "api") return day.apiCost || 0;
    return day.cost || 0;
  }

  const series = days.map((day) => valueOf(day, "all"));
  let run = 0;
  const cumulative = series.map((value) => {
    run += value;
    return run;
  });
  const maxY = Math.max(1e-9, state.chartMode === "cumulative" ? cumulative[cumulative.length - 1] : Math.max(...series));

  function xAt(index) {
    return padL + index * slot + slot / 2;
  }
  function yAt(value) {
    return padT + innerH - (value / maxY) * innerH;
  }
  function axisLabel(value) {
    if (state.metric === "events") return formatInt(value);
    if (state.metric === "tokens") return formatTokens(value);
    if (value >= 100) return "$" + Math.round(value);
    return "$" + (Math.round(value * 10) / 10);
  }
  function tipLabel(value) {
    if (state.metric === "events") return t("bento.calls", { n: formatInt(value) });
    if (state.metric === "tokens") return formatTokens(value);
    return formatUsd(value);
  }

  const svg = svgNode("svg", {
    viewBox: "0 0 " + width + " " + height,
    class: "dx-chart",
    role: "img"
  });
  const base = padT + innerH;
  [maxY, maxY / 2, 0].forEach((tick) => {
    const y = yAt(tick);
    svg.appendChild(svgNode("line", {
      x1: padL, x2: width - padR, y1: y, y2: y,
      stroke: "#EBEDF0", "stroke-width": "1"
    }));
    const label = svgNode("text", {
      x: padL - 8, y: y + 3, "text-anchor": "end",
      fill: "#8A909B", "font-size": "11"
    });
    label.textContent = axisLabel(tick);
    svg.appendChild(label);
  });

  if (state.chartMode === "cumulative") {
    const line = cumulative.map((value, index) => (index ? "L" : "M") + xAt(index).toFixed(1) + " " + yAt(value).toFixed(1)).join(" ");
    svg.appendChild(svgNode("path", {
      d: line + " L" + xAt(days.length - 1).toFixed(1) + " " + base + " L" + xAt(0).toFixed(1) + " " + base + " Z",
      fill: "rgba(20, 22, 26, 0.08)"
    }));
    svg.appendChild(svgNode("path", {
      d: line, fill: "none", stroke: fpColor, "stroke-width": "2", "stroke-linejoin": "round"
    }));
  } else {
    days.forEach((day, index) => {
      const x = padL + index * slot + (slot - barW) / 2;
      const selected = state.selectedDate === day.date;
      if (selected) {
        svg.appendChild(svgNode("rect", {
          x: padL + index * slot + 1,
          y: padT,
          width: Math.max(slot - 2, barW),
          height: innerH,
          rx: "4",
          fill: "rgba(220, 74, 37, 0.08)"
        }));
      }
      const segments = (name || state.metric !== "cost")
        ? [[valueOf(day, "all"), name ? apiColor : fpColor]]
        : [[valueOf(day, "fp"), fpColor], [valueOf(day, "api"), apiColor]];
      let stacked = 0;
      segments.forEach(([value, color]) => {
        const h = (value / maxY) * innerH;
        if (h < 0.8) return;
        svg.appendChild(svgNode("rect", {
          x: x.toFixed(2),
          y: (base - stacked - h).toFixed(2),
          width: barW.toFixed(2),
          height: h.toFixed(2),
          rx: Math.min(2, barW / 2).toFixed(2),
          fill: color
        }));
        stacked += h;
      });
    });
  }

  const labelIndexes = days.length < 3 ? days.map((_, index) => index) : [0, days.length - 1];
  labelIndexes.forEach((index, pos) => {
    const label = svgNode("text", {
      x: pos === 0 ? padL : width - padR,
      y: height - 8,
      "text-anchor": pos === 0 ? "start" : "end",
      fill: "#8A909B",
      "font-size": "12"
    });
    label.textContent = shortDay(days[index].date);
    svg.appendChild(label);
  });
  host.appendChild(svg);

  const tip = document.createElement("div");
  tip.className = "dx-tip";
  tip.hidden = true;
  host.appendChild(tip);

  function indexAt(event) {
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    return Math.max(0, Math.min(days.length - 1, Math.floor((x - padL) / slot)));
  }

  svg.addEventListener("mousemove", (event) => {
    const index = indexAt(event);
    const day = days[index];
    const shown = state.chartMode === "cumulative" ? cumulative[index] : valueOf(day, "all");
    tip.hidden = false;
    tip.innerHTML = `<b>${esc(monthDay(day.date))}</b><span>${esc(tipLabel(shown))}</span>`;
    const left = Math.min(82, Math.max(12, (xAt(index) / width) * 100));
    tip.style.left = left + "%";
  });
  svg.addEventListener("mouseleave", () => {
    tip.hidden = true;
  });
  svg.addEventListener("click", (event) => {
    const index = indexAt(event);
    state.onSelectDate(days[index].date);
  });
}

export function renderBento(summary, state) {
  const hero = document.getElementById("heroBlock");
  const pools = document.getElementById("poolsBlock");
  const anatomy = document.getElementById("anatomyBlock");
  const chartHead = document.getElementById("chartHead");
  const chartHost = document.getElementById("chartHost");
  const side = document.getElementById("sideBlock");
  if (!hero) return;

  const empty = summary.empty || ((summary.billableEvents || 0) === 0 && (summary.unmatchedEvents || 0) === 0);
  const windowDays = state.range?.start ? padDaily(summary, state.range).length : (summary.daily?.length || 0);

  hero.innerHTML = `
    <div class="dx-tile-head">
      <span class="dx-k">${esc(t("metric.total"))}</span>
      <span class="dx-tag">${esc(t("bento.days", { n: windowDays }))}</span>
    </div>
    <p class="dx-total">${esc(formatUsd(summary.totalCost || 0))}</p>
    <p class="dx-verdict">${empty ? esc(t("bento.empty")) : esc(verdict(summary))}</p>
    <div class="dx-hero-foot">
      <span>${esc(t("metric.dailyAvg"))} <b>${esc(formatUsd(summary.avgDailyCost || 0))}</b></span>
      <span>${esc(t("metric.eventAvg"))} <b>${esc(formatUsd(summary.avgCostPerEvent || 0))}</b></span>
      <span><b>${esc(formatInt(summary.billableEvents || 0))}</b> ${esc(getLocale() === "zh" ? "次" : "calls")}</span>
    </div>
  `;

  const fpEvents = poolEvents(summary, "firstParty");
  const apiEvents = poolEvents(summary, "api");
  pools.innerHTML = `
    <div class="dx-tile-head">
      <span class="dx-k">${esc(t("bento.pools"))}</span>
      <span class="dx-muted">${esc(t("bento.poolsNote"))}</span>
    </div>
    <div class="dx-pool">
      <div class="dx-pc-top"><span><i class="dx-dot is-fp"></i>${esc(t("bento.fp"))}</span><b>${esc(formatPct(summary.firstPartyShare || 0))}</b></div>
      <p class="dx-pc-val">${esc(formatUsd(summary.firstPartyCost || 0))}</p>
      <div class="dx-track"><span class="is-fp" style="width:${(summary.firstPartyShare || 0) * 100}%"></span></div>
      <p class="dx-pc-sub">${esc(formatInt(fpEvents))} ${esc(getLocale() === "zh" ? "次" : "calls")} · ${esc(t("bento.fpHint"))}</p>
    </div>
    <div class="dx-pool">
      <div class="dx-pc-top"><span><i class="dx-dot is-api"></i>${esc(t("bento.api"))}</span><b class="is-hot">${esc(formatPct(summary.apiShare || 0))}</b></div>
      <p class="dx-pc-val">${esc(formatUsd(summary.apiCost || 0))}</p>
      <div class="dx-track"><span class="is-api" style="width:${(summary.apiShare || 0) * 100}%"></span></div>
      <p class="dx-pc-sub">${esc(formatInt(apiEvents))} ${esc(getLocale() === "zh" ? "次" : "calls")} · ${esc(t("bento.apiHint"))}</p>
    </div>
  `;

  const composition = PART_ORDER
    .map((key) => (summary.composition || []).find((row) => row.key === key))
    .filter(Boolean);
  anatomy.innerHTML = `
    <div class="dx-tile-head">
      <span class="dx-k">${esc(t("bento.anatomy"))}</span>
      <span class="dx-max">${esc(t("bento.max", { pct: formatPct(summary.maxModeCostShare || 0) }))}</span>
    </div>
    <div class="dx-anat">${composition.map((row) => `<span class="is-${row.key}" style="width:${Math.max(row.share * 100, row.share > 0 ? 1 : 0)}%"></span>`).join("")}</div>
    <div class="dx-anat-list">
      ${composition.map((row) => `<div><span><i class="is-${row.key}"></i>${esc(tokenLabel(row.key))}</span><b>${esc(formatPct(row.share))}</b></div>`).join("")}
    </div>
    <p class="dx-anat-foot">${esc(t("bento.hit"))} <b>${esc(formatPct(summary.cacheHitRate || 0))}</b></p>
  `;

  const day = state.selectedDate ? (summary.daily || []).find((item) => item.date === state.selectedDate) : null;
  const topOnDay = day?.models?.[0];
  chartHead.innerHTML = `
    <div class="dx-chart-title">
      <span class="dx-k">${esc(state.selectedModel ? state.selectedModel + " · " + t("bento.trend") : t("bento.trend"))}</span>
      ${state.selectedModel ? `<button type="button" class="dx-chip" data-clear-model="1">${esc(t("bento.clear"))}</button>` : ""}
      ${day && !state.selectedModel ? `<button type="button" class="dx-chip is-day" data-clear-day="1">${esc(t("bento.dayChip", { date: monthDay(day.date), cost: formatUsd(day.cost) }))}${topOnDay ? " · " + esc(topOnDay.name) : ""}</button>` : ""}
      ${!state.selectedModel && !day && summary.peakDay?.date ? `<span class="dx-muted">${esc(t("bento.peak", { date: monthDay(summary.peakDay.date), cost: formatUsd(summary.peakDay.cost) }))}</span>` : ""}
    </div>
  `;
  drawChart(chartHost, empty ? { ...summary, daily: [] } : summary, state);
  const legend = document.getElementById("chartLegend");
  if (legend) legend.hidden = Boolean(state.selectedModel) || state.metric !== "cost" || state.chartMode !== "daily";

  const maxShare = Math.max(0.01, ...(summary.models || []).map((model) => model.costShare || 0));
  const tabs = ["models", "audit", "unmatched"].map((id) => {
    const label = t("bento.tab." + id) + (id === "unmatched" ? ` (${summary.unmatchedEvents || 0})` : "");
    return `<button type="button" class="${state.tab === id ? "is-on" : ""}" data-tab="${id}">${esc(label)}</button>`;
  }).join("");

  let body = "";
  if (state.tab === "models") {
    body = `<div class="dx-models">${(summary.models || []).map((model) => {
      const width = Math.max(3, ((model.costShare || 0) / maxShare) * 100);
      const active = state.selectedModel === model.name ? " is-on" : "";
      return `<button type="button" class="dx-model${active}" data-model="${esc(model.name)}">
        <span class="dx-model-top"><span><i class="dx-dot ${model.pool === "api" ? "is-api" : "is-fp"}"></i>${esc(model.name)}</span><b>${esc(formatUsd(model.cost))}<em>${esc(formatPct(model.costShare))}</em></b></span>
        <span class="dx-model-bot"><span class="dx-track"><span class="${model.pool === "api" ? "is-api" : "is-fp"}" style="width:${width}%"></span></span><span>${esc(formatInt(model.events))} ${esc(getLocale() === "zh" ? "次" : "calls")} · ${esc(formatTokens(modelTokens(model)))}</span></span>
      </button>`;
    }).join("")}</div>`;
  } else if (state.tab === "audit") {
    body = `<p class="dx-note">${esc(t("bento.auditNote"))}</p><div class="dx-table-wrap"><table class="dx-table"><thead><tr><th>${esc(t("bento.tab.models"))}</th><th>${esc(tokenLabel("cacheRead"))}</th><th>${esc(tokenLabel("output"))}</th><th>${esc(t("bento.metric.cost"))}</th></tr></thead><tbody>
      ${(summary.models || []).map((model) => {
        const parts = calcCostParts({
          input: model.input,
          cacheWrite: model.cacheWrite,
          cacheRead: model.cacheRead,
          output: model.output
        }, model.price);
        return `<tr><td>${esc(model.name)}</td><td>${esc(formatUsd(parts.cacheRead))}</td><td>${esc(formatUsd(parts.output))}</td><td><b>${esc(formatUsd(model.cost))}</b></td></tr>`;
      }).join("")}
    </tbody></table></div>`;
  } else {
    body = `<p class="dx-note">${esc(t("bento.unmatchedNote"))}</p>${(summary.unmatched || []).map((row) => `<div class="dx-unmatched"><b>${esc(row.name || t("token.emptyModel"))}</b><span>${esc(formatInt(row.events))} ${esc(getLocale() === "zh" ? "次" : "calls")} · ${esc(formatTokens(modelTokens(row)))} · $0.00</span></div>`).join("")}<p class="dx-note">${esc(t("policy.body"))}</p>`;
  }

  side.innerHTML = `<div class="dx-tabs" data-export-hide="1">${tabs}</div>${body}`;
}
