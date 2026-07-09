import {
  formatUsd,
  formatInt,
  formatPct,
  formatPrice,
  formatShortDate,
  strengthBadge,
  poolBadge,
  escapeHtml
} from "./format.js";
import { calcCostParts } from "./aggregate.js";

let modelView = "summary";

export function getModelView() {
  return modelView;
}

export function setModelView(value) {
  modelView = value === "calc" ? "calc" : "summary";
}

const TH_BASE = "sticky top-0 z-[1] px-3 py-2.5 border-b border-border whitespace-nowrap align-middle text-secondary text-xs font-medium bg-muted";
const TH_NUM = TH_BASE + " text-right tabular-nums";

function renderModelThead(view) {
  const thead = document.getElementById("modelThead");
  if (!thead) return;

  if (view === "calc") {
    thead.innerHTML = `
      <tr>
        <th class="${TH_BASE} text-left">提供商</th>
        <th class="${TH_BASE} text-left">价表模型</th>
        <th class="${TH_BASE} text-left">类型</th>
        <th class="${TH_NUM}">用量</th>
        <th class="${TH_NUM}">单价 $/1M</th>
        <th class="${TH_NUM}">分项花费</th>
        <th class="${TH_NUM}">合计</th>
      </tr>`;
  } else {
    thead.innerHTML = `
      <tr>
        <th class="${TH_BASE} text-left">提供商</th>
        <th class="${TH_BASE} text-left">价表模型</th>
        <th class="${TH_BASE} text-left">匹配方式</th>
        <th class="${TH_BASE} text-left">用量池</th>
        <th class="${TH_NUM}">事件</th>
        <th class="${TH_NUM}">估算花费</th>
        <th class="${TH_NUM}">花费占比</th>
        <th class="${TH_NUM}">单次均价</th>
      </tr>`;
  }
}

function priceCell(price, sameAsInput) {
  if (price == null) return "—";
  const base = formatPrice(price);
  if (sameAsInput) {
    return base + ' <span class="price-hint">同 Input</span>';
  }
  return base;
}

function calcDataRow(cells, opts) {
  const rowClass = [
    opts.unmatched ? "unmatched" : "",
    opts.groupEnd ? "calc-group-end" : ""
  ].filter(Boolean).join(" ");
  return "<tr" + (rowClass ? ' class="' + rowClass + '"' : "") + ">" + cells.join("") + "</tr>";
}

function calcCell(content, cls) {
  return '<td class="' + cls + '">' + content + "</td>";
}

function buildCalcGroupHtml(m, isUnmatched) {
  const provider = escapeHtml(isUnmatched ? "—" : m.provider);
  const name = escapeHtml(m.name);
  const title = escapeHtml(m.sampleCsv || m.name);
  const total = isUnmatched ? 0 : m.cost;
  const tokens = {
    input: m.input,
    cacheWrite: m.cacheWrite,
    cacheRead: m.cacheRead,
    output: m.output
  };

  let lineDefs = [];
  let footnote = null;

  if (isUnmatched) {
    lineDefs = [
      { label: "输入", usage: m.input },
      { label: "缓存写入", usage: m.cacheWrite },
      { label: "缓存读取", usage: m.cacheRead },
      { label: "输出", usage: m.output }
    ];
    footnote = "无价表 · 估算 $0";
  } else {
    const parts = calcCostParts(tokens, m.price);
    const price = m.price;

    if (price.isAuto) {
      lineDefs = [
        {
          label: "输入+缓存写",
          usage: m.input + m.cacheWrite,
          unitPrice: price.input,
          partCost: parts.input,
          sameAsInput: false
        },
        {
          label: "缓存读取",
          usage: m.cacheRead,
          unitPrice: price.cacheRead,
          partCost: parts.cacheRead,
          sameAsInput: false
        },
        {
          label: "输出",
          usage: m.output,
          unitPrice: price.output,
          partCost: parts.output,
          sameAsInput: false
        }
      ];
      footnote = "Auto：Input 与 Cache Write 合并按 Input 价";
    } else {
      const cwSame = price.cacheWrite == null;
      lineDefs = [
        {
          label: "输入",
          usage: m.input,
          unitPrice: price.input,
          partCost: parts.input,
          sameAsInput: false
        },
        {
          label: "缓存写入",
          usage: m.cacheWrite,
          unitPrice: cwSame ? price.input : price.cacheWrite,
          partCost: parts.cacheWrite,
          sameAsInput: cwSame
        },
        {
          label: "缓存读取",
          usage: m.cacheRead,
          unitPrice: price.cacheRead,
          partCost: parts.cacheRead,
          sameAsInput: false
        },
        {
          label: "输出",
          usage: m.output,
          unitPrice: price.output,
          partCost: parts.output,
          sameAsInput: false
        }
      ];
    }
  }

  const rows = [];
  lineDefs.forEach((line, i) => {
    const isFirst = i === 0;
    const isLast = i === lineDefs.length - 1;
    const identity = isFirst
      ? calcCell(provider, "") + calcCell('<span class="model-name" title="' + title + '">' + name + "</span>", "model-name")
      : calcCell("", "") + calcCell("", "");
    const typeCell = calcCell(escapeHtml(line.label), "calc-type");
    const usageCell = calcCell(formatInt(line.usage), "num");
    const priceContent = isUnmatched
      ? "—"
      : priceCell(line.unitPrice, line.sameAsInput);
    const partContent = isUnmatched ? "—" : formatUsd(line.partCost);
    const totalCell = isFirst
      ? calcCell('<span class="cost">' + formatUsd(total) + "</span>", "num cost")
      : calcCell("", "num");

    rows.push(calcDataRow([
      identity,
      typeCell,
      usageCell,
      calcCell(priceContent, "num"),
      calcCell(partContent, "num"),
      totalCell
    ], {
      unmatched: isUnmatched,
      groupEnd: isLast && !footnote
    }));
  });

  if (footnote) {
    rows.push(
      '<tr class="calc-note"><td colspan="7">' + escapeHtml(footnote) + "</td></tr>"
    );
  }

  return rows.join("");
}

function renderSummaryBody(summary) {
  if (summary.models.length === 0 && summary.unmatched.length === 0) {
    return '<tr><td colspan="8"><p class="empty-note">没有可汇总的计费事件</p></td></tr>';
  }
  return summary.models.map((m) => `
      <tr>
        <td>${escapeHtml(m.provider)}</td>
        <td class="model-name" title="${escapeHtml(m.sampleCsv || m.name)}">${escapeHtml(m.name)}</td>
        <td>${strengthBadge(m.strength)}</td>
        <td>${poolBadge(m.pool)}</td>
        <td class="num">${formatInt(m.events)}</td>
        <td class="num cost">${formatUsd(m.cost)}</td>
        <td class="num">${formatPct(m.costShare)}</td>
        <td class="num">${formatUsd(m.avgCost)}</td>
      </tr>
    `).join("");
}

function renderCalcBody(summary) {
  const groups = summary.models.map((m) => buildCalcGroupHtml(m, false));
  const unmatchedGroups = summary.unmatched.map((m) => buildCalcGroupHtml(m, true));
  const all = groups.concat(unmatchedGroups);
  if (all.length === 0) {
    return '<tr><td colspan="7"><p class="empty-note">没有可汇总的计费事件</p></td></tr>';
  }
  return all.join("");
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function withTableFade(updateFn) {
  const wrap = document.getElementById("modelTableWrap");
  if (!wrap || prefersReducedMotion()) {
    updateFn();
    return;
  }
  wrap.classList.add("is-fading");
  requestAnimationFrame(() => {
    updateFn();
    requestAnimationFrame(() => {
      wrap.classList.remove("is-fading");
    });
  });
}

export function syncModelViewUi(summary) {
  const modelViewEl = document.getElementById("modelView");
  const note = document.getElementById("modelViewNote");
  const unmatchedBlock = document.getElementById("unmatchedBlock");

  if (modelViewEl) {
    modelViewEl.querySelectorAll("button[data-model-view]").forEach((btn) => {
      const active = btn.getAttribute("data-model-view") === modelView;
      btn.classList.toggle("is-active", active);
    });
  }

  if (note) {
    note.textContent = modelView === "calc"
      ? "单位 $/1M tokens · 分项之和等于该模型估算花费"
      : "按估算花费降序";
  }

  if (unmatchedBlock) {
    const hasUnmatched = summary && summary.unmatched.length > 0;
    if (modelView === "calc") {
      unmatchedBlock.classList.remove("is-visible");
    } else if (hasUnmatched) {
      unmatchedBlock.classList.add("is-visible");
    } else {
      unmatchedBlock.classList.remove("is-visible");
    }
  }
}

export function setUploadCompact(compact) {
  const zone = document.getElementById("uploadZone");
  const actions = document.getElementById("topbarActions");
  if (compact) {
    zone.classList.add("is-compact");
    actions.classList.add("is-visible");
  } else {
    zone.classList.remove("is-compact");
    actions.classList.remove("is-visible");
  }
}

export function renderInsight(summary) {
  const el = document.getElementById("insight");
  let html = escapeHtml(summary.insight || "");
  const muted = [];
  if (summary.billableEvents > 0 && summary.fuzzyEvents > 0) {
    muted.push(
      "模糊匹配 " + formatInt(summary.fuzzyEvents) + " 条 · 花费 "
      + formatUsd(summary.fuzzyCost)
    );
  }
  if (summary.billableEvents > 0 && summary.unmatchedEvents > 0) {
    muted.push("未匹配 " + formatInt(summary.unmatchedEvents) + " 条");
  }
  if (muted.length > 0) {
    html += '<span class="muted"> · ' + escapeHtml(muted.join(" · ")) + "</span>";
  }
  el.innerHTML = html;
}

export function renderMetrics(summary) {
  document.getElementById("metricTotal").textContent = formatUsd(summary.totalCost);
  document.getElementById("metricPoolFp").textContent = formatUsd(summary.firstPartyCost);
  document.getElementById("metricPoolFpShare").textContent = formatPct(summary.firstPartyShare);
  document.getElementById("metricPoolApi").textContent = formatUsd(summary.apiCost);
  document.getElementById("metricPoolApiShare").textContent = formatPct(summary.apiShare);
  document.getElementById("metricDailyAvg").textContent = formatUsd(summary.avgDailyCost);
  document.getElementById("metricEventAvg").textContent = formatUsd(summary.avgCostPerEvent);
  document.getElementById("metricCacheShare").textContent = formatPct(summary.cacheReadCostShare);
  document.getElementById("metricMaxShare").textContent = formatPct(summary.maxModeCostShare);

  const range = summary.dateRange.start && summary.dateRange.end
    ? (formatShortDate(summary.dateRange.start) + " 至 " + formatShortDate(summary.dateRange.end) + " · 本地时区")
    : "无日期";
  document.getElementById("metaRow").textContent = [
    "计费事件 " + formatInt(summary.billableEvents),
    "已排除 " + formatInt(summary.excludedEvents),
    "精确匹配率 " + formatPct(summary.exactMatchRate),
    "未匹配 " + formatInt(summary.unmatchedEvents),
    range
  ].join(" · ");
}

export function renderDailyChart(summary, metric) {
  const host = document.getElementById("chartHost");
  const legend = document.getElementById("chartLegend");
  const daily = summary.daily || [];
  if (daily.length === 0) {
    host.innerHTML = '<p class="chart-empty">无按日数据</p>';
    legend.classList.add("is-hidden");
    return;
  }

  const stacked = metric === "cost";
  if (stacked) legend.classList.remove("is-hidden");
  else legend.classList.add("is-hidden");

  const values = daily.map((d) => {
    if (metric === "events") return d.events;
    if (metric === "tokens") return d.tokens;
    return d.cost;
  });
  const maxVal = Math.max.apply(null, values.concat([0]));
  const peakIdx = values.indexOf(maxVal);

  const width = 1000;
  const height = 180;
  const padL = 48;
  const padR = 12;
  const padT = 20;
  const padB = 36;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const n = daily.length;
  const gap = n > 20 ? 2 : 4;
  const barW = Math.max(4, (plotW - gap * (n - 1)) / n);

  function yScale(v) {
    if (maxVal <= 0) return padT + plotH;
    return padT + plotH - (v / maxVal) * plotH;
  }

  function formatAxis(v) {
    if (metric === "cost") return formatUsd(v);
    if (metric === "tokens") {
      if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
      if (v >= 1e3) return (v / 1e3).toFixed(0) + "k";
      return String(Math.round(v));
    }
    return formatInt(v);
  }

  const ticks = [0, 0.5, 1].map((t) => maxVal * t);
  const grid = ticks.map((t) => {
    const y = yScale(t);
    return '<line x1="' + padL + '" y1="' + y + '" x2="' + (width - padR) + '" y2="' + y + '" stroke="#E4E7EC" stroke-width="1" />'
      + '<text x="' + (padL - 8) + '" y="' + (y + 4) + '" text-anchor="end" fill="#8B95A5" font-size="11" font-variant-numeric="tabular-nums">'
      + escapeHtml(formatAxis(t)) + "</text>";
  }).join("");

  const bars = daily.map((d, i) => {
    const x = padL + i * (barW + gap);
    const label = formatShortDate(d.date);
    const showLabel = n <= 14 || i % Math.ceil(n / 10) === 0 || i === n - 1;
    const labelText = showLabel
      ? '<text x="' + (x + barW / 2) + '" y="' + (height - 12) + '" text-anchor="middle" fill="#8B95A5" font-size="11">'
        + escapeHtml(label) + "</text>"
      : "";

    if (stacked) {
      const fp = d.firstPartyCost || 0;
      const api = d.apiCost || 0;
      const total = fp + api;
      const yBase = padT + plotH;
      const tip = label + " · 合计 " + formatUsd(total)
        + " · 第一方模型 " + formatUsd(fp)
        + " · API " + formatUsd(api);

      let rects = "";
      if (api > 0 && maxVal > 0) {
        const hApi = Math.max(2, (api / maxVal) * plotH);
        const yApi = yBase - hApi;
        rects += '<rect x="' + x + '" y="' + yApi + '" width="' + barW + '" height="' + hApi + '" fill="#64748B" rx="2">'
          + "<title>" + escapeHtml(tip) + "</title></rect>";
      }
      if (fp > 0 && maxVal > 0) {
        const hFp = Math.max(2, (fp / maxVal) * plotH);
        const hApi = api > 0 ? Math.max(2, (api / maxVal) * plotH) : 0;
        const yFp = yBase - hApi - hFp;
        rects += '<rect x="' + x + '" y="' + yFp + '" width="' + barW + '" height="' + hFp + '" fill="#0F766E" rx="2">'
          + "<title>" + escapeHtml(tip) + "</title></rect>";
      }
      if (total <= 0) {
        rects = '<rect x="' + x + '" y="' + yBase + '" width="' + barW + '" height="0" fill="#0F766E">'
          + "<title>" + escapeHtml(tip) + "</title></rect>";
      }
      return "<g>" + rects + labelText + "</g>";
    }

    const v = values[i];
    const y = yScale(v);
    const h = Math.max(v > 0 ? 2 : 0, padT + plotH - y);
    const isPeak = i === peakIdx && maxVal > 0;
    const fill = isPeak ? "#115E59" : "#0F766E";
    const tip = label + " · "
      + (metric === "events" ? (formatInt(d.events) + " 事件") : (formatInt(d.tokens) + " tokens"));
    return "<g>"
      + '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + h + '" fill="' + fill + '" rx="2">'
      + "<title>" + escapeHtml(tip) + "</title></rect>"
      + labelText
      + "</g>";
  }).join("");

  host.innerHTML = '<svg class="chart-svg" viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="按日趋势">'
    + grid + bars + "</svg>";
}

export function renderComposition(summary) {
  const host = document.getElementById("compositionBars");
  host.innerHTML = summary.composition.map((row) => {
    const widthPct = Math.max(0, Math.min(100, row.share * 100));
    return '<div class="bar-row">'
      + '<div class="bar-label">' + escapeHtml(row.label) + "</div>"
      + '<div class="bar-track"><div class="bar-fill ' + row.tone + '" style="width:' + widthPct + '%"></div></div>'
      + '<div class="num">' + formatUsd(row.cost) + "</div>"
      + '<div class="num share">' + formatPct(row.share) + "</div>"
      + "</div>";
  }).join("");
}

export function renderModels(summary, options = {}) {
  const modelBody = document.getElementById("modelBody");
  const unmatchedBlock = document.getElementById("unmatchedBlock");
  const unmatchedBody = document.getElementById("unmatchedBody");

  const paint = () => {
    renderModelThead(modelView);
    if (modelView === "calc") {
      modelBody.innerHTML = renderCalcBody(summary);
    } else {
      modelBody.innerHTML = renderSummaryBody(summary);
    }
  };

  if (options.animate) {
    withTableFade(paint);
  } else {
    paint();
  }

  syncModelViewUi(summary);

  if (modelView !== "calc" && summary.unmatched.length > 0) {
    unmatchedBlock.classList.add("is-visible");
    unmatchedBody.innerHTML = summary.unmatched.map((m) => `
      <tr class="unmatched">
        <td>${escapeHtml(m.name)}</td>
        <td class="num">${formatInt(m.events)}</td>
        <td class="num">${formatInt(m.input)}</td>
        <td class="num">${formatInt(m.cacheWrite)}</td>
        <td class="num">${formatInt(m.cacheRead)}</td>
        <td class="num">${formatInt(m.output)}</td>
      </tr>
    `).join("");
  } else if (modelView !== "calc") {
    unmatchedBlock.classList.remove("is-visible");
    unmatchedBody.innerHTML = "";
  }
}

export function render(summary, chartMetric) {
  renderInsight(summary);
  renderMetrics(summary);
  renderDailyChart(summary, chartMetric);
  renderComposition(summary);
  renderModels(summary);
  document.getElementById("results").classList.add("is-visible");
  setUploadCompact(true);
}
