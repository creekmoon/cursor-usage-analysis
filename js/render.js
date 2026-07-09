import {
  formatUsd,
  formatInt,
  formatPct,
  formatPrice,
  formatShortDate,
  formatTokens,
  strengthBadge,
  poolBadge,
  escapeHtml
} from "./format.js";
import { calcCostParts } from "./aggregate.js";

const CHART_WIDTH = 1000;
const PAD_L = 48;
const PAD_R = 12;
const CUM_HEIGHT = 200;
const CUM_PAD_T = 16;
const CUM_PAD_B = 8;
const DAILY_HEIGHT = 140;
const DAILY_PAD_T = 8;
const DAILY_PAD_B = 32;
const COLOR_FP = "#0F766E";
const COLOR_API = "#64748B";
const COLOR_PEAK = "#115E59";

let modelView = "summary";
let trendGeometry = null;
let trendSummary = null;
let trendOptions = {
  metric: "cost",
  selectedDate: null,
  hoverIndex: null
};
let trendEventsBound = false;

export function getModelView() {
  return modelView;
}

export function setModelView(value) {
  modelView = value === "calc" ? "calc" : "summary";
}

const TH_BASE = "th-base";
const TH_NUM = "num th-base";

function renderModelThead(view) {
  const thead = document.getElementById("modelThead");
  const table = document.getElementById("modelTable");
  if (!thead) return;

  let colgroup = table && table.querySelector("colgroup");
  if (view === "calc") {
    if (!colgroup && table) {
      colgroup = document.createElement("colgroup");
      table.insertBefore(colgroup, thead);
    }
    if (colgroup) {
      colgroup.innerHTML = [
        '<col class="col-provider" />',
        '<col class="col-model" />',
        '<col class="col-type" />',
        '<col class="col-usage" />',
        '<col class="col-price" />',
        '<col class="col-part" />',
        '<col class="col-total" />'
      ].join("");
    }
    thead.innerHTML = `
      <tr>
        <th class="${TH_BASE}">提供商</th>
        <th class="${TH_BASE}">价表模型</th>
        <th class="${TH_BASE}">类型</th>
        <th class="${TH_NUM}">用量</th>
        <th class="${TH_NUM}">单价 $/1M</th>
        <th class="${TH_NUM}">分项花费</th>
        <th class="${TH_NUM}">合计</th>
      </tr>`;
  } else {
    if (colgroup) colgroup.remove();
    thead.innerHTML = `
      <tr>
        <th class="${TH_BASE}">提供商</th>
        <th class="${TH_BASE}">价表模型</th>
        <th class="${TH_BASE}">匹配方式</th>
        <th class="${TH_BASE}">用量池</th>
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

function calcCell(content, cls, attrs) {
  const attrStr = attrs
    ? Object.keys(attrs).map((k) => " " + k + '="' + attrs[k] + '"').join("")
    : "";
  return '<td class="' + (cls || "") + '"' + attrStr + ">" + content + "</td>";
}

function buildCalcGroupHtml(m, isUnmatched, groupIndex) {
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
  const alt = groupIndex % 2 === 1;

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

  const span = lineDefs.length;
  const rows = [];

  lineDefs.forEach((line, i) => {
    const isFirst = i === 0;
    const isLast = i === lineDefs.length - 1;
    const rowClass = [
      "calc-row",
      isFirst ? "calc-group-start" : "",
      isLast && !footnote ? "calc-group-end" : "",
      alt ? "calc-alt" : "",
      isUnmatched ? "unmatched" : ""
    ].filter(Boolean).join(" ");

    const cells = [];
    if (isFirst) {
      cells.push(calcCell(provider, "calc-provider", { rowspan: span }));
      cells.push(calcCell(
        '<span class="model-name" title="' + title + '">' + name + "</span>",
        "calc-model model-name",
        { rowspan: span }
      ));
    }

    cells.push(calcCell(escapeHtml(line.label), "calc-type"));
    cells.push(calcCell(formatInt(line.usage), "num"));

    const priceContent = isUnmatched
      ? "—"
      : priceCell(line.unitPrice, line.sameAsInput);
    cells.push(calcCell(priceContent, "num"));

    const partZero = !isUnmatched && line.partCost === 0;
    const partContent = isUnmatched ? "—" : formatUsd(line.partCost);
    cells.push(calcCell(partContent, "num" + (partZero ? " calc-zero" : "")));

    if (isFirst) {
      cells.push(calcCell(
        formatUsd(total),
        "num cost calc-total",
        { rowspan: span }
      ));
    }

    rows.push("<tr class=\"" + rowClass + "\">" + cells.join("") + "</tr>");
  });

  if (footnote) {
    const noteClass = [
      "calc-note",
      "calc-group-end",
      alt ? "calc-alt" : "",
      isUnmatched ? "unmatched" : ""
    ].filter(Boolean).join(" ");
    rows.push(
      '<tr class="' + noteClass + '"><td colspan="7">' + escapeHtml(footnote) + "</td></tr>"
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
  const matched = summary.models.map((m, i) => buildCalcGroupHtml(m, false, i));
  const unmatched = summary.unmatched.map((m, i) =>
    buildCalcGroupHtml(m, true, summary.models.length + i)
  );
  const all = matched.concat(unmatched);
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

function dayMetricValue(d, metric) {
  if (metric === "events") return d.events;
  if (metric === "tokens") return d.tokens;
  return d.cost;
}

function buildCumulativeSeries(daily, metric, poolField) {
  let sum = 0;
  return daily.map((d) => {
    const v = poolField ? (d[poolField] || 0) : dayMetricValue(d, metric);
    sum += v;
    return sum;
  });
}

function formatAxisValue(v, metric) {
  if (metric === "cost") return formatUsd(v);
  if (metric === "tokens") {
    if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(0) + "k";
    return String(Math.round(v));
  }
  return formatInt(v);
}

function syncClearButton(selectedDate) {
  const btn = document.getElementById("clearSelection");
  if (btn) btn.classList.toggle("is-hidden", !selectedDate);
}

function syncLegendVisibility(metric) {
  const legend = document.getElementById("chartLegend");
  if (legend) legend.classList.toggle("is-hidden", metric !== "cost");
}

function buildGrid(maxVal, yScale, width, padL, padR, metric) {
  const ticks = [0, 0.5, 1].map((t) => maxVal * t);
  return ticks.map((t) => {
    const y = yScale(t);
    return '<line x1="' + padL + '" y1="' + y + '" x2="' + (width - padR) + '" y2="' + y
      + '" stroke="#E4E7EC" stroke-width="1" />'
      + '<text x="' + (padL - 8) + '" y="' + (y + 4) + '" text-anchor="end" fill="#8B95A5" font-size="11" font-variant-numeric="tabular-nums">'
      + escapeHtml(formatAxisValue(t, metric)) + "</text>";
  }).join("");
}

function renderCumulativeSvg(daily, options, layout) {
  const { metric, selectedDate, hoverIndex } = options;
  const { width, padL, padR, plotH, height, padT, barW, gap, n } = layout;
  const plotBottom = padT + plotH;

  const totalCum = buildCumulativeSeries(daily, metric);
  const maxVal = Math.max(0, ...totalCum);

  function yScale(v) {
    if (maxVal <= 0) return plotBottom;
    return padT + plotH - (v / maxVal) * plotH;
  }

  function xCenter(i) {
    return padL + i * (barW + gap) + barW / 2;
  }

  const grid = buildGrid(maxVal, yScale, width, padL, PAD_R, metric);
  let series = "";

  if (maxVal > 0 && totalCum.length > 0) {
    const areaPts = totalCum.map((v, i) => xCenter(i) + "," + yScale(v)).join(" L ");
    const area = "M" + xCenter(0) + "," + plotBottom + " L" + areaPts + " L" + xCenter(n - 1) + "," + plotBottom + " Z";
    series += '<path d="' + area + '" fill="rgba(15, 118, 110, 0.1)" />';
    series += '<polyline fill="none" stroke="' + COLOR_FP + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' + areaPts + '" />';
  }

  const focusIdx = hoverIndex != null ? hoverIndex : (selectedDate ? daily.findIndex((d) => d.date === selectedDate) : -1);
  if (focusIdx >= 0 && maxVal > 0) {
    const focusVal = totalCum[focusIdx];
    series += '<circle cx="' + xCenter(focusIdx) + '" cy="' + yScale(focusVal) + '" r="4" fill="' + COLOR_FP + '" stroke="#FFFFFF" stroke-width="1.5" />';
  }

  if (maxVal > 0 && totalCum.length > 0) {
    const endVal = totalCum[totalCum.length - 1];
    const ex = xCenter(n - 1);
    const ey = yScale(endVal);
    series += '<circle cx="' + ex + '" cy="' + ey + '" r="3" fill="' + COLOR_FP + '" />';
    series += '<text x="' + (ex + 6) + '" y="' + (ey + 4) + '" fill="#4A5568" font-size="11" font-variant-numeric="tabular-nums">'
      + escapeHtml(formatAxisValue(endVal, metric)) + "</text>";
  }

  return {
    svg: '<svg class="chart-svg chart-svg-cumulative" viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="累计趋势">'
      + grid + series + "</svg>",
    totalCum,
    xCenter
  };
}

function renderDailySvg(daily, options, layout) {
  const { metric, selectedDate, hoverIndex } = options;
  const { width, padL, padR, plotH, height, padT, padB, barW, gap, n } = layout;
  const stacked = metric === "cost";
  const values = daily.map((d) => dayMetricValue(d, metric));
  const maxVal = Math.max.apply(null, values.concat([0]));
  const peakIdx = values.indexOf(maxVal);

  function yScale(v) {
    if (maxVal <= 0) return padT + plotH;
    return padT + plotH - (v / maxVal) * plotH;
  }

  const grid = buildGrid(maxVal, yScale, width, padL, padR, metric);
  const selectedIdx = selectedDate ? daily.findIndex((d) => d.date === selectedDate) : -1;

  const bars = daily.map((d, i) => {
    const x = padL + i * (barW + gap);
    const label = formatShortDate(d.date);
    const showLabel = n <= 14 || i % Math.ceil(n / 10) === 0 || i === n - 1;
    const labelText = showLabel
      ? '<text x="' + (x + barW / 2) + '" y="' + (height - 10) + '" text-anchor="middle" fill="#8B95A5" font-size="11">'
        + escapeHtml(label) + "</text>"
      : "";
    const isSelected = i === selectedIdx;
    const isHover = i === hoverIndex;
    const stateCls = (isSelected ? " is-selected" : "") + (isHover ? " is-hover" : "");

    if (stacked) {
      const fp = d.firstPartyCost || 0;
      const api = d.apiCost || 0;
      const yBase = padT + plotH;
      let rects = "";
      if (api > 0 && maxVal > 0) {
        const hApi = Math.max(2, (api / maxVal) * plotH);
        rects += '<rect class="chart-bar' + stateCls + '" data-index="' + i + '" x="' + x + '" y="' + (yBase - hApi)
          + '" width="' + barW + '" height="' + hApi + '" fill="' + COLOR_API + '" rx="2" />';
      }
      if (fp > 0 && maxVal > 0) {
        const hFp = Math.max(2, (fp / maxVal) * plotH);
        const hApi = api > 0 ? Math.max(2, (api / maxVal) * plotH) : 0;
        rects += '<rect class="chart-bar' + stateCls + '" data-index="' + i + '" x="' + x + '" y="' + (yBase - hApi - hFp)
          + '" width="' + barW + '" height="' + hFp + '" fill="' + COLOR_FP + '" rx="2" />';
      }
      if (fp + api <= 0) {
        rects = '<rect class="chart-bar chart-bar-zero' + stateCls + '" data-index="' + i + '" x="' + x + '" y="' + yBase
          + '" width="' + barW + '" height="' + Math.max(barW, 8) + '" fill="transparent" />';
      }
      return "<g>" + rects + labelText + "</g>";
    }

    const v = values[i];
    const y = yScale(v);
    const h = Math.max(v > 0 ? 2 : 0, padT + plotH - y);
    const isPeak = i === peakIdx && maxVal > 0;
    const fill = isPeak ? COLOR_PEAK : COLOR_FP;
    return "<g>"
      + '<rect class="chart-bar' + stateCls + '" data-index="' + i + '" x="' + x + '" y="' + y
      + '" width="' + barW + '" height="' + h + '" fill="' + fill + '" rx="2" />'
      + labelText
      + "</g>";
  }).join("");

  let avgLine = "";
  if (metric === "cost" && maxVal > 0 && trendSummary && trendSummary.avgDailyCost > 0) {
    const y = yScale(trendSummary.avgDailyCost);
    avgLine = '<line x1="' + padL + '" y1="' + y + '" x2="' + (width - padR) + '" y2="' + y
      + '" stroke="#8B95A5" stroke-width="1" stroke-dasharray="4 4" opacity="0.7" />';
  }

  const hits = daily.map((d, i) => {
    const x = padL + i * (barW + gap);
    const yBase = padT + plotH;
    return '<rect class="chart-hit" data-index="' + i + '" x="' + x + '" y="' + padT
      + '" width="' + barW + '" height="' + plotH + '" />';
  }).join("");

  return '<svg class="chart-svg chart-svg-daily" viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="按日趋势">'
    + grid + avgLine + bars + hits + "</svg>";
}

function buildTipHtml(daily, index, options, cumMeta) {
  const d = daily[index];
  if (!d) return "";
  const { metric } = options;
  const label = formatShortDate(d.date);
  const totalCum = cumMeta.totalCum[index] || 0;
  const periodTotal = cumMeta.totalCum[cumMeta.totalCum.length - 1] || 0;
  const sharePct = periodTotal > 0 ? totalCum / periodTotal : 0;

  let rows = [];
  if (metric === "cost") {
    rows.push("当日 " + formatUsd(d.cost) + " · 第一方 " + formatUsd(d.firstPartyCost || 0) + " · API " + formatUsd(d.apiCost || 0));
    rows.push("累计至当日 " + formatUsd(totalCum) + "（占区间 " + formatPct(sharePct) + "）");
  } else if (metric === "events") {
    rows.push("当日 " + formatInt(d.events) + " 事件");
    rows.push("累计至当日 " + formatInt(totalCum) + " 事件（占区间 " + formatPct(sharePct) + "）");
  } else {
    rows.push("当日 " + formatInt(d.tokens) + " tokens");
    rows.push("累计至当日 " + formatInt(totalCum) + " tokens（占区间 " + formatPct(sharePct) + "）");
  }

  let foot = "";
  if (daily.length === 1) {
    foot = "区间过短，趋势参考有限";
  }

  return '<div class="chart-tip-date">' + escapeHtml(label) + "</div>"
    + rows.map((r) => '<div class="chart-tip-row">' + escapeHtml(r) + "</div>").join("")
    + (foot ? '<div class="chart-tip-foot">' + escapeHtml(foot) + "</div>" : "");
}

function updateCrosshairAndTip(index) {
  const crosshair = document.getElementById("chartCrosshair");
  const tip = document.getElementById("chartTip");
  const stage = document.getElementById("trendStage");
  if (!crosshair || !tip || !stage || !trendGeometry || index == null || index < 0) {
    if (crosshair) crosshair.classList.add("is-hidden");
    if (tip) tip.classList.add("is-hidden");
    return;
  }

  const stageRect = stage.getBoundingClientRect();
  const dailySvg = stage.querySelector(".chart-svg-daily");
  if (!dailySvg) return;

  const svgRect = dailySvg.getBoundingClientRect();
  const { xCenter, cumMeta } = trendGeometry;
  const xSvg = xCenter(index);
  const xPx = svgRect.left - stageRect.left + (xSvg / CHART_WIDTH) * svgRect.width;

  crosshair.style.left = xPx + "px";
  crosshair.classList.remove("is-hidden");

  tip.innerHTML = buildTipHtml(trendGeometry.daily, index, trendOptions, cumMeta);
  tip.classList.remove("is-hidden");

  const tipW = tip.offsetWidth || 180;
  let tipLeft = xPx + 12;
  if (tipLeft + tipW > stageRect.width - 8) tipLeft = xPx - tipW - 12;
  tipLeft = Math.max(8, tipLeft);
  tip.style.left = tipLeft + "px";
  tip.style.top = "24px";
}

function indexFromClientX(clientX) {
  if (!trendGeometry) return null;
  const stage = document.getElementById("trendStage");
  const dailySvg = stage && stage.querySelector(".chart-svg-daily");
  if (!dailySvg) return null;

  const svgRect = dailySvg.getBoundingClientRect();
  const { padL, padR, barW, gap, n } = trendGeometry;
  const plotW = CHART_WIDTH - padL - padR;
  const relX = ((clientX - svgRect.left) / svgRect.width) * CHART_WIDTH;
  if (relX < padL || relX > CHART_WIDTH - padR) return null;

  const idx = Math.floor((relX - padL) / (barW + gap));
  if (idx < 0 || idx >= n) return null;
  return idx;
}

export function getTrendOptions() {
  return { ...trendOptions };
}

export function setTrendOptions(partial) {
  trendOptions = { ...trendOptions, ...partial };
}

export function clearTrendSelection() {
  trendOptions.selectedDate = null;
  trendOptions.hoverIndex = null;
  syncClearButton(null);
  if (trendSummary) renderTrendCharts(trendSummary, trendOptions);
}

export function renderTrendCharts(summary, options) {
  trendSummary = summary;
  trendOptions = { ...trendOptions, ...options };

  const cumHost = document.getElementById("cumulativeChartHost");
  const dailyHost = document.getElementById("dailyChartHost");
  const daily = summary.daily || [];

  syncLegendVisibility(trendOptions.metric);
  syncClearButton(trendOptions.selectedDate);

  if (!cumHost || !dailyHost) return;

  if (daily.length === 0) {
    cumHost.innerHTML = "";
    dailyHost.innerHTML = '<p class="chart-empty">无按日数据</p>';
    trendGeometry = null;
    updateCrosshairAndTip(null);
    return;
  }

  const n = daily.length;
  const gap = n > 20 ? 2 : 4;
  const plotW = CHART_WIDTH - PAD_L - PAD_R;
  const barW = Math.max(4, (plotW - gap * (n - 1)) / n);

  const layout = {
    width: CHART_WIDTH,
    padL: PAD_L,
    padR: PAD_R,
    plotW,
    barW,
    gap,
    n,
    height: CUM_HEIGHT,
    padT: CUM_PAD_T,
    padB: CUM_PAD_B,
    plotH: CUM_HEIGHT - CUM_PAD_T - CUM_PAD_B
  };

  const cumResult = renderCumulativeSvg(daily, trendOptions, layout);
  cumHost.innerHTML = cumResult.svg;

  const dailyLayout = {
    ...layout,
    height: DAILY_HEIGHT,
    padT: DAILY_PAD_T,
    padB: DAILY_PAD_B,
    plotH: DAILY_HEIGHT - DAILY_PAD_T - DAILY_PAD_B
  };
  dailyHost.innerHTML = renderDailySvg(daily, trendOptions, dailyLayout);

  trendGeometry = {
    daily,
    n,
    padL: PAD_L,
    padR: PAD_R,
    barW,
    gap,
    xCenter: cumResult.xCenter,
    cumMeta: { totalCum: cumResult.totalCum }
  };

  const focusIdx = trendOptions.hoverIndex != null
    ? trendOptions.hoverIndex
    : (trendOptions.selectedDate ? daily.findIndex((d) => d.date === trendOptions.selectedDate) : null);
  if (focusIdx != null && focusIdx >= 0) {
    updateCrosshairAndTip(focusIdx);
  } else {
    updateCrosshairAndTip(null);
  }
}

export function bindTrendChartEvents(onChange) {
  if (trendEventsBound) return;
  trendEventsBound = true;

  const stage = document.getElementById("trendStage");
  if (!stage) return;

  function emitChange() {
    if (typeof onChange === "function") onChange(getTrendOptions());
  }

  function setHover(index) {
    trendOptions.hoverIndex = index;
    updateCrosshairAndTip(index);
  }

  function selectIndex(index) {
    if (!trendGeometry || index == null || index < 0) return;
    const day = trendGeometry.daily[index];
    trendOptions.selectedDate = day ? day.date : null;
    trendOptions.hoverIndex = index;
    syncClearButton(trendOptions.selectedDate);
    if (trendSummary) renderTrendCharts(trendSummary, trendOptions);
    emitChange();
  }

  stage.addEventListener("mousemove", (e) => {
    const idx = indexFromClientX(e.clientX);
    if (idx == null) {
      if (!trendOptions.selectedDate) {
        trendOptions.hoverIndex = null;
        updateCrosshairAndTip(null);
      }
      return;
    }
    setHover(idx);
  });

  stage.addEventListener("mouseleave", () => {
    if (trendOptions.selectedDate) {
      const idx = trendGeometry && trendGeometry.daily.findIndex((d) => d.date === trendOptions.selectedDate);
      trendOptions.hoverIndex = null;
      updateCrosshairAndTip(idx >= 0 ? idx : null);
      if (trendSummary) renderTrendCharts(trendSummary, trendOptions);
      return;
    }
    trendOptions.hoverIndex = null;
    updateCrosshairAndTip(null);
  });

  stage.addEventListener("click", (e) => {
    const hit = e.target.closest(".chart-hit, .chart-bar");
    const idx = hit ? Number(hit.getAttribute("data-index")) : indexFromClientX(e.clientX);
    if (idx == null || Number.isNaN(idx)) {
      if (trendOptions.selectedDate) {
        trendOptions.selectedDate = null;
        trendOptions.hoverIndex = null;
        syncClearButton(null);
        if (trendSummary) renderTrendCharts(trendSummary, trendOptions);
        emitChange();
      }
      return;
    }
    if (trendOptions.selectedDate === trendGeometry.daily[idx].date) {
      trendOptions.selectedDate = null;
      trendOptions.hoverIndex = null;
      syncClearButton(null);
      if (trendSummary) renderTrendCharts(trendSummary, trendOptions);
      emitChange();
      return;
    }
    selectIndex(idx);
  });

  stage.addEventListener("keydown", (e) => {
    if (!trendGeometry) return;
    const { daily } = trendGeometry;
    let idx = trendOptions.selectedDate
      ? daily.findIndex((d) => d.date === trendOptions.selectedDate)
      : (trendOptions.hoverIndex != null ? trendOptions.hoverIndex : 0);

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      idx = Math.max(0, idx - 1);
      selectIndex(idx);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      idx = Math.min(daily.length - 1, idx + 1);
      selectIndex(idx);
    } else if (e.key === "Escape") {
      e.preventDefault();
      clearTrendSelection();
      emitChange();
    }
  });

  const clearBtn = document.getElementById("clearSelection");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearTrendSelection();
      emitChange();
    });
  }
}

/** @deprecated use renderTrendCharts */
export function renderDailyChart(summary, metric) {
  renderTrendCharts(summary, { ...getTrendOptions(), metric });
}

function withSectionFade(host, updateFn) {
  if (!host || prefersReducedMotion()) {
    updateFn();
    return;
  }
  host.classList.add("is-fading");
  requestAnimationFrame(() => {
    updateFn();
    requestAnimationFrame(() => {
      host.classList.remove("is-fading");
    });
  });
}

function renderCompositionRows(rows, options = {}) {
  const host = document.getElementById("compositionBars");
  if (!host) return;

  const paint = () => {
    if (options.empty) {
      host.innerHTML = '<p class="empty-note">' + escapeHtml(options.emptyMessage || "暂无数据") + "</p>";
      return;
    }
    if (!rows || rows.length === 0) {
      host.innerHTML = '<p class="empty-note">暂无构成数据</p>';
      return;
    }
    host.innerHTML = rows.map((row) => {
      const widthPct = Math.max(0, Math.min(100, row.share * 100));
      return '<div class="bar-row">'
        + '<div class="bar-label">' + escapeHtml(row.label) + "</div>"
        + '<div class="bar-track"><div class="bar-fill ' + row.tone + '" style="width:' + widthPct + '%"></div></div>'
        + '<div class="num">' + formatUsd(row.cost) + "</div>"
        + '<div class="num share">' + formatPct(row.share) + "</div>"
        + "</div>";
    }).join("");
  };

  if (options.animate) withSectionFade(host, paint);
  else paint();
}

export function renderComposition(summary) {
  renderCompositionRows(summary.composition);
}

export function renderModels(summary, options = {}) {
  const modelBody = document.getElementById("modelBody");
  const unmatchedBlock = document.getElementById("unmatchedBlock");
  const unmatchedBody = document.getElementById("unmatchedBody");
  const emptyMessage = options.emptyMessage || null;

  const paint = () => {
    const table = document.getElementById("modelTable");
    if (table) table.classList.toggle("view-calc", modelView === "calc");
    renderModelThead(modelView);
    if (emptyMessage) {
      const cols = modelView === "calc" ? 7 : 8;
      modelBody.innerHTML = '<tr><td colspan="' + cols + '"><p class="empty-note">' + escapeHtml(emptyMessage) + "</p></td></tr>";
    } else if (modelView === "calc") {
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

function usageEmptyNote(message) {
  return '<p class="usage-empty">' + escapeHtml(message || "暂无计费用量") + "</p>";
}

function renderModelTokenChart(rows) {
  if (!rows || rows.length === 0) return usageEmptyNote();
  const maxShare = Math.max(...rows.map((r) => r.tokenShare), 0.001);
  return rows.map((row) => {
    const widthPct = Math.max(0, Math.min(100, (row.tokenShare / maxShare) * 100));
    const title = row.name + " · " + formatTokens(row.tokens) + " tokens · " + formatPct(row.tokenShare);
    return '<div class="usage-hbar" title="' + escapeHtml(title) + '">'
      + '<span class="usage-hbar-label" title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + "</span>"
      + '<div class="usage-hbar-track" aria-hidden="true">'
      + '<div class="usage-hbar-fill" style="width:' + widthPct.toFixed(2) + '%"></div>'
      + "</div>"
      + '<span class="usage-hbar-pct num">' + formatPct(row.tokenShare) + "</span>"
      + '<span class="usage-hbar-val num">' + formatTokens(row.tokens) + "</span>"
      + "</div>";
  }).join("");
}

function renderTokenMixChart(rows) {
  if (!rows || rows.length === 0) return usageEmptyNote();
  const total = rows.reduce((s, r) => s + r.tokens, 0);
  if (total <= 0) return usageEmptyNote();

  const segments = rows.filter((r) => r.tokens > 0).map((row) => {
    const widthPct = Math.max(0, Math.min(100, row.share * 100));
    const tone = row.tone ? " " + row.tone : "";
    const title = row.label + " · " + formatTokens(row.tokens) + " · " + formatPct(row.share);
    return '<div class="usage-stack-seg' + tone + '" style="width:' + widthPct.toFixed(4)
      + '%" title="' + escapeHtml(title) + '" aria-label="' + escapeHtml(title) + '"></div>';
  }).join("");

  const legend = rows.map((row) => {
    return '<span class="usage-stack-legend-item">'
      + '<span class="usage-stack-swatch' + (row.tone ? " " + row.tone : "") + '" aria-hidden="true"></span>'
      + '<span class="usage-stack-legend-label">' + escapeHtml(row.label) + "</span>"
      + '<span class="usage-stack-legend-val num">' + formatTokens(row.tokens) + "</span>"
      + '<span class="usage-stack-legend-pct num">' + formatPct(row.share) + "</span>"
      + "</span>";
  }).join("");

  return '<div class="usage-stack" role="presentation">' + segments + "</div>"
    + '<div class="usage-stack-legend">' + legend + "</div>";
}

function renderPrefCompareChart(rows) {
  if (!rows || rows.length === 0) return usageEmptyNote();
  const maxShare = Math.max(
    ...rows.flatMap((r) => [r.eventShare, r.tokenShare]),
    0.001
  );

  return rows.map((row) => {
    const eventW = Math.max(0, Math.min(100, (row.eventShare / maxShare) * 100));
    const tokenW = Math.max(0, Math.min(100, (row.tokenShare / maxShare) * 100));
    return '<div class="usage-pref-row">'
      + '<span class="usage-pref-name" title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + "</span>"
      + '<div class="usage-pref-tracks">'
      + '<div class="usage-pref-track" title="事件 ' + formatInt(row.events) + ' · ' + formatPct(row.eventShare) + '">'
      + '<span class="usage-pref-track-label">事件</span>'
      + '<div class="usage-pref-track-bar" aria-hidden="true">'
      + '<div class="usage-pref-fill event" style="width:' + eventW.toFixed(2) + '%"></div>'
      + "</div>"
      + '<span class="usage-pref-pct num">' + formatPct(row.eventShare) + "</span>"
      + "</div>"
      + '<div class="usage-pref-track" title="Token ' + formatTokens(row.tokens) + ' · ' + formatPct(row.tokenShare) + '">'
      + '<span class="usage-pref-track-label">Token</span>'
      + '<div class="usage-pref-track-bar" aria-hidden="true">'
      + '<div class="usage-pref-fill token" style="width:' + tokenW.toFixed(2) + '%"></div>'
      + "</div>"
      + '<span class="usage-pref-pct num">' + formatPct(row.tokenShare) + "</span>"
      + "</div>"
      + "</div>"
      + "</div>";
  }).join("");
}

export function renderUsage(summary) {
  const insightEl = document.getElementById("usageInsight");
  const anchorsEl = document.getElementById("usageAnchors");
  const modelHost = document.getElementById("modelTokenChartHost");
  const mixHost = document.getElementById("tokenMixChartHost");
  const prefHost = document.getElementById("prefCompareChartHost");
  if (!insightEl || !anchorsEl || !modelHost || !mixHost || !prefHost) return;

  const hasUsage = summary.billableEvents > 0 && summary.totalTokens > 0;
  insightEl.textContent = summary.usageInsight || "暂无 Token 用量数据";

  if (!hasUsage) {
    anchorsEl.textContent = "";
    modelHost.innerHTML = usageEmptyNote();
    mixHost.innerHTML = usageEmptyNote();
    prefHost.innerHTML = usageEmptyNote();
    return;
  }

  anchorsEl.textContent = [
    "总 Token " + formatTokens(summary.totalTokens),
    "单次均 " + formatTokens(summary.avgTokensPerEvent),
    "缓存命中 " + formatPct(summary.cacheHitRate)
  ].join(" · ");

  modelHost.innerHTML = renderModelTokenChart(summary.modelsByTokens || []);
  mixHost.innerHTML = renderTokenMixChart(summary.tokenComposition || []);
  prefHost.innerHTML = renderPrefCompareChart(summary.prefCompare || []);
}

export function render(summary, chartMetric, trendState = {}, renderOptions = {}) {
  trendOptions = {
    metric: chartMetric || "cost",
    selectedDate: trendState.selectedDate || null,
    hoverIndex: null
  };

  renderInsight(summary);
  renderMetrics(summary);
  renderUsage(summary);
  renderTrendCharts(summary, trendOptions);
  renderComposition(summary);
  renderModels(summary, { animate: Boolean(renderOptions.animateModels) });

  document.getElementById("results").classList.add("is-visible");
  setUploadCompact(true);
}
