import {
  formatUsd,
  formatInt,
  formatPct,
  formatPrice,
  formatShortDate,
  formatTokens,
  strengthBadge,
  escapeHtml
} from "./format.js";
import { t, tokenLabel } from "./i18n.js";
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

let trendGeometry = null;
let trendSummary = null;
let trendOptions = {
  metric: "cost",
  selectedDate: null,
  hoverIndex: null
};
let trendEventsBound = false;

const TH_BASE = "th-base";
const TH_NUM = "num th-base";

function renderModelThead() {
  const thead = document.getElementById("modelThead");
  const table = document.getElementById("modelTable");
  if (!thead) return;

  let colgroup = table && table.querySelector("colgroup");
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
        <th class="${TH_BASE}">${t("models.th.provider")}</th>
        <th class="${TH_BASE}">${t("models.th.model")}</th>
        <th class="${TH_BASE}">${t("models.th.type")}</th>
        <th class="${TH_NUM}">${t("models.th.usage")}</th>
        <th class="${TH_NUM}">${t("models.th.unitPrice")}</th>
        <th class="${TH_NUM}">${t("models.th.partCost")}</th>
        <th class="${TH_NUM}">${t("models.th.total")}</th>
      </tr>`;
}

function priceCell(price, sameAsInput) {
  if (price == null) return "—";
  const base = formatPrice(price);
  if (sameAsInput) {
    return base + ' <span class="price-hint">' + t("models.priceSameAsInput") + "</span>";
  }
  return base;
}

function calcCell(content, cls, attrs) {
  const attrStr = attrs
    ? Object.keys(attrs).map((k) => " " + k + '="' + attrs[k] + '"').join("")
    : "";
  return '<td class="' + (cls || "") + '"' + attrStr + ">" + content + "</td>";
}

function displayModelName(name) {
  if (!name) return t("token.emptyModel");
  if (name === "__other__") return t("token.other");
  return name;
}

function poolShortLabel(pool) {
  if (pool === "firstParty") return t("usage.pool.fp");
  if (pool === "api") return t("usage.pool.api");
  return t("usage.pool.unknown");
}

function buildCalcMetaHtml(m, isUnmatched, alt) {
  const displayName = displayModelName(m.name);
  const tokenAll = (m.tokens != null)
    ? m.tokens
    : (m.input + m.cacheWrite + m.cacheRead + m.output);
  const tokensPerEvent = m.events > 0 ? tokenAll / m.events : 0;
  const parts = [
    "<span>" + escapeHtml(t("models.meta.provider", {
      provider: isUnmatched ? "—" : (m.provider || "—")
    })) + "</span>",
    "<span>" + escapeHtml(t("models.meta.matchPrefix")) + " "
      + strengthBadge(m.strength, {
        sampleCsv: m.sampleCsv,
        priceName: displayName
      })
      + "</span>",
    "<span>" + escapeHtml(t("models.meta.pool", {
      pool: poolShortLabel(m.pool)
    })) + "</span>",
    "<span>" + escapeHtml(t("models.meta.events", {
      n: formatInt(m.events)
    })) + "</span>",
    "<span>" + escapeHtml(t("models.meta.tokensPerEvent", {
      tokens: formatTokens(tokensPerEvent)
    })) + "</span>"
  ];
  const rowClass = [
    "calc-meta",
    "calc-group-start",
    alt ? "calc-alt" : "",
    isUnmatched ? "unmatched" : ""
  ].filter(Boolean).join(" ");
  return '<tr class="' + rowClass + '"><td colspan="7"><div class="calc-meta-inner">'
    + parts.join("")
    + "</div></td></tr>";
}

function buildCalcGroupHtml(m, isUnmatched, groupIndex) {
  const provider = escapeHtml(isUnmatched ? "—" : m.provider);
  const name = escapeHtml(displayModelName(m.name));
  const title = escapeHtml(m.sampleCsv || displayModelName(m.name));
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
      { label: t("models.line.input"), usage: m.input },
      { label: t("models.line.cacheWrite"), usage: m.cacheWrite },
      { label: t("models.line.cacheRead"), usage: m.cacheRead },
      { label: t("models.line.output"), usage: m.output }
    ];
    footnote = t("models.footnote.unmatched");
  } else {
    const parts = calcCostParts(tokens, m.price);
    const price = m.price;

    if (price.isAuto) {
      lineDefs = [
        {
          label: t("models.line.inputPlusCw"),
          usage: m.input + m.cacheWrite,
          unitPrice: price.input,
          partCost: parts.input,
          sameAsInput: false
        },
        {
          label: t("models.line.cacheRead"),
          usage: m.cacheRead,
          unitPrice: price.cacheRead,
          partCost: parts.cacheRead,
          sameAsInput: false
        },
        {
          label: t("models.line.output"),
          usage: m.output,
          unitPrice: price.output,
          partCost: parts.output,
          sameAsInput: false
        }
      ];
      footnote = t("models.footnote.auto");
    } else {
      const cwSame = price.cacheWrite == null;
      lineDefs = [
        {
          label: t("models.line.input"),
          usage: m.input,
          unitPrice: price.input,
          partCost: parts.input,
          sameAsInput: false
        },
        {
          label: t("models.line.cacheWrite"),
          usage: m.cacheWrite,
          unitPrice: cwSame ? price.input : price.cacheWrite,
          partCost: parts.cacheWrite,
          sameAsInput: cwSame
        },
        {
          label: t("models.line.cacheRead"),
          usage: m.cacheRead,
          unitPrice: price.cacheRead,
          partCost: parts.cacheRead,
          sameAsInput: false
        },
        {
          label: t("models.line.output"),
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
  rows.push(buildCalcMetaHtml(m, isUnmatched, alt));

  lineDefs.forEach((line, i) => {
    const isFirst = i === 0;
    const isLast = i === lineDefs.length - 1;
    const rowClass = [
      "calc-row",
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

function renderCalcBody(summary) {
  const matched = summary.models.map((m, i) => buildCalcGroupHtml(m, false, i));
  const unmatched = summary.unmatched.map((m, i) =>
    buildCalcGroupHtml(m, true, summary.models.length + i)
  );
  const all = matched.concat(unmatched);
  if (all.length === 0) {
    return '<tr><td colspan="7"><p class="empty-note">' + t("models.empty") + "</p></td></tr>";
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

export function syncUnmatchedBlock(summary) {
  const unmatchedBlock = document.getElementById("unmatchedBlock");
  if (!unmatchedBlock) return;
  // 未匹配已并入计算过程表；独立区块仅在需要时保留隐藏态
  unmatchedBlock.classList.remove("is-visible");
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
  let html = "";

  if (summary.billableEvents <= 0) {
    html = escapeHtml(t("insight.none"));
  } else {
    const parts = [];
    if (summary.totalCost > 0 && summary.dominantPoolShare >= 0.5) {
      const pool = summary.dominantPoolKey === "api"
        ? t("insight.poolApi")
        : t("insight.poolFp");
      parts.push(t("insight.poolShare", {
        pool,
        pct: formatPct(summary.dominantPoolShare)
      }));
    }
    if (summary.topModel && summary.topModel.name) {
      parts.push(t("insight.topModel", {
        name: summary.topModel.name,
        pct: formatPct(summary.topModel.share)
      }));
    }
    if (summary.topComposition && summary.topComposition.share >= 0.4) {
      parts.push(t("insight.topComposition", {
        label: tokenLabel(summary.topComposition.key),
        pct: formatPct(summary.topComposition.share)
      }));
    }
    if (summary.peakDay && summary.peakDay.date) {
      parts.push(t("insight.peakDay", {
        date: formatShortDate(summary.peakDay.date),
        cost: formatUsd(summary.peakDay.cost)
      }));
    }
    html = escapeHtml(
      parts.length > 0
        ? parts.join(" · ")
        : t("insight.totalCost", { cost: formatUsd(summary.totalCost) })
    );
  }

  const muted = [];
  if (summary.billableEvents > 0 && summary.fuzzyEvents > 0) {
    muted.push(t("insight.fuzzy", {
      n: formatInt(summary.fuzzyEvents),
      cost: formatUsd(summary.fuzzyCost)
    }));
  }
  if (summary.billableEvents > 0 && summary.unmatchedEvents > 0) {
    muted.push(t("insight.unmatched", { n: formatInt(summary.unmatchedEvents) }));
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
    ? t("meta.range", {
      start: formatShortDate(summary.dateRange.start),
      end: formatShortDate(summary.dateRange.end)
    })
    : t("meta.noDate");
  document.getElementById("metaRow").textContent = [
    t("meta.billable", { n: formatInt(summary.billableEvents) }),
    t("meta.excluded", { n: formatInt(summary.excludedEvents) }),
    t("meta.exactRate", { pct: formatPct(summary.exactMatchRate) }),
    t("meta.unmatched", { n: formatInt(summary.unmatchedEvents) }),
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
    svg: '<svg class="chart-svg chart-svg-cumulative" viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="' + escapeHtml(t("trend.aria.cumulative")) + '">'
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

  return '<svg class="chart-svg chart-svg-daily" viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="' + escapeHtml(t("trend.aria.daily")) + '">'
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
    rows.push(t("tip.dayCost", {
      cost: formatUsd(d.cost),
      fp: formatUsd(d.firstPartyCost || 0),
      api: formatUsd(d.apiCost || 0)
    }));
    rows.push(t("tip.cumCost", {
      value: formatUsd(totalCum),
      pct: formatPct(sharePct)
    }));
  } else if (metric === "events") {
    rows.push(t("tip.dayEvents", { n: formatInt(d.events) }));
    rows.push(t("tip.cumEvents", {
      n: formatInt(totalCum),
      pct: formatPct(sharePct)
    }));
  } else {
    rows.push(t("tip.dayTokens", { n: formatInt(d.tokens) }));
    rows.push(t("tip.cumTokens", {
      n: formatInt(totalCum),
      pct: formatPct(sharePct)
    }));
  }

  let foot = "";
  if (daily.length === 1) {
    foot = t("tip.shortRange");
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
    dailyHost.innerHTML = '<p class="chart-empty">' + t("trend.empty") + "</p>";
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
      host.innerHTML = '<p class="empty-note">' + escapeHtml(options.emptyMessage || t("composition.noData")) + "</p>";
      return;
    }
    if (!rows || rows.length === 0) {
      host.innerHTML = '<p class="empty-note">' + t("composition.empty") + "</p>";
      return;
    }
    host.innerHTML = rows.map((row) => {
      const widthPct = Math.max(0, Math.min(100, row.share * 100));
      const label = row.label || tokenLabel(row.key);
      return '<div class="bar-row">'
        + '<div class="bar-label">' + escapeHtml(label) + "</div>"
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
  const emptyMessage = options.emptyMessage || null;

  const paint = () => {
    const table = document.getElementById("modelTable");
    if (table) table.classList.add("view-calc");
    renderModelThead();
    if (emptyMessage) {
      modelBody.innerHTML = '<tr><td colspan="7"><p class="empty-note">' + escapeHtml(emptyMessage) + "</p></td></tr>";
    } else {
      modelBody.innerHTML = renderCalcBody(summary);
    }
  };

  if (options.animate) {
    withTableFade(paint);
  } else {
    paint();
  }

  const calcHint = document.getElementById("calcHint");
  const modelCount = summary.models.length + summary.unmatched.length;
  calcHint.textContent = t("models.collapsedHint", { n: formatInt(modelCount) });

  syncUnmatchedBlock(summary);
}

function usageEmptyNote(message) {
  return '<p class="usage-empty">' + escapeHtml(message || t("usage.empty")) + "</p>";
}

function barWidthPct(share, maxShare) {
  if (!(maxShare > 0)) return 0;
  return Math.max(2, Math.min(100, (share / maxShare) * 100));
}

function renderTokenMixChart(rows) {
  if (!rows || rows.length === 0) return usageEmptyNote();
  const total = rows.reduce((s, r) => s + r.tokens, 0);
  if (total <= 0) return usageEmptyNote();

  const segments = rows.filter((r) => r.tokens > 0).map((row) => {
    const label = row.label || tokenLabel(row.key);
    const widthPct = Math.max(0, Math.min(100, row.share * 100));
    const tone = row.tone ? " " + row.tone : "";
    const title = label + " · " + formatTokens(row.tokens) + " · " + formatPct(row.share);
    return '<div class="usage-stack-seg' + tone + '" style="width:' + widthPct.toFixed(4)
      + '%" title="' + escapeHtml(title) + '" aria-label="' + escapeHtml(title) + '"></div>';
  }).join("");

  const legend = rows.map((row) => {
    const label = row.label || tokenLabel(row.key);
    return '<span class="usage-stack-legend-item">'
      + '<span class="usage-stack-swatch' + (row.tone ? " " + row.tone : "") + '" aria-hidden="true"></span>'
      + '<span class="usage-stack-legend-label">' + escapeHtml(label) + "</span>"
      + '<span class="usage-stack-legend-val num">' + formatTokens(row.tokens) + "</span>"
      + '<span class="usage-stack-legend-pct num">' + formatPct(row.share) + "</span>"
      + "</span>";
  }).join("");

  return '<div class="usage-stack" role="presentation">' + segments + "</div>"
    + '<div class="usage-stack-legend">' + legend + "</div>";
}

function renderModelCompareList(models) {
  if (!models || models.length === 0) return usageEmptyNote();

  const maxShare = Math.max(
    ...models.flatMap((m) => [m.costShare || 0, m.tokenShare || 0]),
    0.001
  );

  return models.map((m) => {
    const displayName = displayModelName(m.name);
    const costW = barWidthPct(m.costShare || 0, maxShare);
    const tokenW = barWidthPct(m.tokenShare || 0, maxShare);
    const costTitle = t("usage.compare.costTitle", {
      cost: formatUsd(m.cost),
      pct: formatPct(m.costShare)
    });
    const tokenTitle = t("usage.compare.tokenTitle", {
      tokens: formatTokens(m.tokens),
      pct: formatPct(m.tokenShare)
    });

    return '<div class="model-compare-row" role="listitem">'
      + '<div class="model-compare-grid">'
      + '<div class="model-compare-name" title="' + escapeHtml(m.sampleCsv || displayName) + '">'
      + escapeHtml(displayName)
      + '<div class="model-compare-name-sub num">'
      + formatUsd(m.cost) + " · " + formatTokens(m.tokens)
      + "</div>"
      + "</div>"
      + '<div class="model-compare-metric" title="' + escapeHtml(costTitle) + '">'
      + '<div class="model-compare-track" aria-hidden="true">'
      + '<div class="model-compare-fill cost" style="width:' + costW.toFixed(2) + '%"></div>'
      + "</div>"
      + '<div class="model-compare-fig num">'
      + "<b>" + formatUsd(m.cost) + "</b>"
      + '<span class="model-compare-pct">' + formatPct(m.costShare) + "</span>"
      + "</div>"
      + "</div>"
      + '<div class="model-compare-metric" title="' + escapeHtml(tokenTitle) + '">'
      + '<div class="model-compare-track" aria-hidden="true">'
      + '<div class="model-compare-fill token" style="width:' + tokenW.toFixed(2) + '%"></div>'
      + "</div>"
      + '<div class="model-compare-fig num">'
      + "<b>" + formatTokens(m.tokens) + "</b>"
      + '<span class="model-compare-pct">' + formatPct(m.tokenShare) + "</span>"
      + "</div>"
      + "</div>"
      + '<div class="model-compare-side num">'
      + '<b>' + formatInt(m.events) + "</b>"
      + "<span> · " + formatUsd(m.avgCost) + " · </span>"
      + '<span class="model-compare-pool">' + escapeHtml(poolShortLabel(m.pool)) + "</span>"
      + "</div>"
      + "</div>"
      + "</div>";
  }).join("");
}

function buildUsageInsight(summary) {
  if (!(summary.billableEvents > 0 && (summary.totalTokens > 0 || summary.totalCost > 0))) {
    return t("usage.noData");
  }
  const favorites = summary.favorites || {};
  const parts = [];

  if (favorites.costTokenMismatch && favorites.byCost?.name && favorites.byTokens?.name) {
    parts.push(t("usageInsight.costTokenMismatch", {
      costModel: favorites.byCost.name,
      costPct: formatPct(favorites.byCost.share),
      tokensModel: favorites.byTokens.name,
      tokensPct: formatPct(favorites.byTokens.share)
    }));
  } else {
    if (favorites.byCost?.name) {
      parts.push(t("usageInsight.topCost", {
        name: favorites.byCost.name,
        pct: formatPct(favorites.byCost.share)
      }));
    }
    if (favorites.byTokens?.name) {
      parts.push(t("usageInsight.topTokens", {
        name: favorites.byTokens.name,
        pct: formatPct(favorites.byTokens.share)
      }));
    }
  }

  if (
    favorites.mismatch
    && favorites.byEvents?.name
    && favorites.byTokens?.name
    && !(favorites.costTokenMismatch && favorites.byEvents.name === favorites.byCost?.name)
  ) {
    parts.push(t("usageInsight.mismatch", {
      eventsModel: favorites.byEvents.name,
      tokensModel: favorites.byTokens.name
    }));
  }

  if (summary.topTokenComposition && summary.topTokenComposition.share >= 0.35) {
    parts.push(t("usageInsight.topStructure", {
      label: tokenLabel(summary.topTokenComposition.key),
      pct: formatPct(summary.topTokenComposition.share)
    }));
  }
  if (summary.peakTokenDay && summary.peakTokenDay.date) {
    parts.push(t("usageInsight.peakDay", {
      date: formatShortDate(summary.peakTokenDay.date),
      tokens: formatTokens(summary.peakTokenDay.tokens)
    }));
  }
  return parts.length > 0
    ? parts.join(" · ")
    : t("usageInsight.total", { tokens: formatTokens(summary.totalTokens) });
}

export function renderUsage(summary) {
  const insightEl = document.getElementById("usageInsight");
  const anchorsEl = document.getElementById("usageAnchors");
  const compareHost = document.getElementById("modelCompareHost");
  const mixHost = document.getElementById("tokenMixChartHost");
  if (!insightEl || !anchorsEl || !compareHost || !mixHost) return;

  const hasUsage = summary.billableEvents > 0 && (summary.totalTokens > 0 || summary.models.length > 0);
  insightEl.textContent = buildUsageInsight(summary);

  if (!hasUsage) {
    anchorsEl.textContent = "";
    compareHost.innerHTML = usageEmptyNote();
    mixHost.innerHTML = usageEmptyNote();
    return;
  }

  const anchors = [
    t("usage.anchor.total", { tokens: formatTokens(summary.totalTokens) }),
    t("usage.anchor.avg", { tokens: formatTokens(summary.avgTokensPerEvent) }),
    t("usage.anchor.cache", { pct: formatPct(summary.cacheHitRate) })
  ];
  if (summary.totalTokens > 0) {
    anchors.push(t("usage.anchor.unit", {
      price: formatUsd(summary.avgCostPerMillionTokens || 0)
    }));
  }
  anchorsEl.textContent = anchors.join(" · ");

  compareHost.innerHTML = renderModelCompareList(summary.models || []);
  mixHost.innerHTML = renderTokenMixChart(summary.tokenComposition || []);
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
