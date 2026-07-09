import { COMPOSITION_META } from "./pricing.js";
import { matchModel } from "./match.js";
import { formatUsd, formatPct, formatShortDate } from "./format.js";

export function isMaxMode(row) {
  const v = String(row["Max Mode"] || "").trim().toLowerCase();
  return v === "yes" || v === "true" || v === "1" || v === "y";
}

export function toNumber(value) {
  if (value == null) return 0;
  const s = String(value).trim();
  if (!s || s === "-" || s.toLowerCase() === "free") return 0;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function isBillable(row) {
  const kind = String(row.Kind || "");
  if (/errored/i.test(kind)) return false;
  if (/no\s*charge/i.test(kind)) return false;
  return true;
}

export function calcCostParts(tokens, price) {
  const zero = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0, total: 0 };
  if (!price) return zero;
  const { input, cacheWrite, cacheRead, output } = tokens;
  let parts;
  if (price.isAuto) {
    // Auto：官方「Input + Cache Write」合并按 input 价
    parts = {
      input: ((cacheWrite + input) / 1e6) * price.input,
      cacheWrite: 0,
      cacheRead: (cacheRead / 1e6) * price.cacheRead,
      output: (output / 1e6) * price.output
    };
  } else {
    // 官方 Cache Write 为 "-" 时，按与 Input 同价计费
    const cwPrice = price.cacheWrite == null ? price.input : price.cacheWrite;
    parts = {
      input: (input / 1e6) * price.input,
      cacheWrite: (cacheWrite / 1e6) * cwPrice,
      cacheRead: (cacheRead / 1e6) * price.cacheRead,
      output: (output / 1e6) * price.output
    };
  }
  parts.total = parts.input + parts.cacheWrite + parts.cacheRead + parts.output;
  return parts;
}

export function calcCost(tokens, price) {
  return calcCostParts(tokens, price).total;
}

function priceSnapshot(entry) {
  return {
    input: entry.input,
    cacheWrite: entry.cacheWrite,
    cacheRead: entry.cacheRead,
    output: entry.output,
    isAuto: Boolean(entry.isAuto)
  };
}

function emptyBucket(seed) {
  return {
    provider: seed.provider || "—",
    name: seed.name,
    sampleCsv: seed.sampleCsv || "",
    strength: seed.strength || "unmatched",
    pool: seed.pool || "unknown",
    price: seed.price || null,
    events: 0,
    input: 0,
    cacheWrite: 0,
    cacheRead: 0,
    output: 0,
    cost: 0,
    matched: Boolean(seed.matched)
  };
}

function localDateKey(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function eachDateInclusive(startKey, endKey) {
  const out = [];
  if (!startKey || !endKey) return out;
  const cur = new Date(startKey + "T00:00:00");
  const end = new Date(endKey + "T00:00:00");
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const day = String(cur.getDate()).padStart(2, "0");
    out.push(y + "-" + m + "-" + day);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function aggregate(records, pricingIndex) {
  const matchedMap = new Map();
  const unmatchedMap = new Map();
  const dailyMap = new Map();
  const csvSamples = new Map();

  let billableEvents = 0;
  let excludedEvents = 0;
  let unmatchedEvents = 0;
  let exactEvents = 0;
  let fuzzyEvents = 0;
  let fuzzyCost = 0;
  let totalCost = 0;
  let firstPartyCost = 0;
  let apiCost = 0;
  let maxModeCost = 0;
  let maxModeEvents = 0;
  let totalInput = 0;
  let totalCacheWrite = 0;
  let totalCacheRead = 0;
  let totalOutput = 0;
  let composition = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };

  for (const row of records) {
    if (!isBillable(row)) {
      excludedEvents += 1;
      continue;
    }

    billableEvents += 1;
    const tokens = {
      cacheWrite: toNumber(row["Input (w/ Cache Write)"]),
      input: toNumber(row["Input (w/o Cache Write)"]),
      cacheRead: toNumber(row["Cache Read"]),
      output: toNumber(row["Output Tokens"])
    };
    const tokenSum = tokens.input + tokens.cacheWrite + tokens.cacheRead + tokens.output;
    totalInput += tokens.input;
    totalCacheWrite += tokens.cacheWrite;
    totalCacheRead += tokens.cacheRead;
    totalOutput += tokens.output;

    const csvModel = row.Model || "(空模型)";
    const match = matchModel(csvModel, pricingIndex);
    const dayKey = localDateKey(row.Date);
    const parts = match.entry ? calcCostParts(tokens, match.entry) : {
      input: 0, cacheWrite: 0, cacheRead: 0, output: 0, total: 0
    };
    const cost = parts.total;
    const pool = match.entry
      ? (match.entry.pool === "firstParty" ? "firstParty" : "api")
      : "unknown";
    const maxMode = isMaxMode(row);

    if (dayKey) {
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, {
          date: dayKey,
          cost: 0,
          firstPartyCost: 0,
          apiCost: 0,
          events: 0,
          tokens: 0
        });
      }
      const day = dailyMap.get(dayKey);
      day.events += 1;
      day.tokens += tokenSum;
      day.cost += cost;
      if (pool === "firstParty") day.firstPartyCost += cost;
      else if (pool === "api") day.apiCost += cost;
    }

    if (!match.entry) {
      unmatchedEvents += 1;
      if (!unmatchedMap.has(csvModel)) {
        unmatchedMap.set(csvModel, emptyBucket({
          name: csvModel,
          sampleCsv: csvModel,
          strength: "unmatched",
          pool: "unknown",
          matched: false
        }));
      }
      const bucket = unmatchedMap.get(csvModel);
      bucket.events += 1;
      bucket.input += tokens.input;
      bucket.cacheWrite += tokens.cacheWrite;
      bucket.cacheRead += tokens.cacheRead;
      bucket.output += tokens.output;
      continue;
    }

    if (match.strength === "exact") exactEvents += 1;
    else {
      fuzzyEvents += 1;
      fuzzyCost += cost;
    }

    if (maxMode) {
      maxModeEvents += 1;
      maxModeCost += cost;
    }

    composition.input += parts.input;
    composition.cacheWrite += parts.cacheWrite;
    composition.cacheRead += parts.cacheRead;
    composition.output += parts.output;
    totalCost += cost;

    if (pool === "firstParty") firstPartyCost += cost;
    else apiCost += cost;

    const priceName = match.entry.name;
    if (!matchedMap.has(priceName)) {
      matchedMap.set(priceName, emptyBucket({
        provider: match.entry.provider,
        name: priceName,
        sampleCsv: csvModel,
        strength: match.strength,
        pool: pool,
        price: priceSnapshot(match.entry),
        matched: true
      }));
    }
    const bucket = matchedMap.get(priceName);
    bucket.events += 1;
    bucket.input += tokens.input;
    bucket.cacheWrite += tokens.cacheWrite;
    bucket.cacheRead += tokens.cacheRead;
    bucket.output += tokens.output;
    bucket.cost += cost;
    if (match.strength === "exact") bucket.strength = "exact";

    if (!csvSamples.has(priceName)) csvSamples.set(priceName, new Set());
    csvSamples.get(priceName).add(csvModel);
  }

  for (const [name, bucket] of matchedMap) {
    const set = csvSamples.get(name);
    if (set) bucket.sampleCsv = Array.from(set).join(", ");
    const tokenAll = bucket.input + bucket.cacheWrite + bucket.cacheRead + bucket.output;
    bucket.costShare = totalCost > 0 ? bucket.cost / totalCost : 0;
    bucket.avgCost = bucket.events > 0 ? bucket.cost / bucket.events : 0;
    bucket.cacheRatio = tokenAll > 0 ? bucket.cacheRead / tokenAll : 0;
    bucket.outputRatio = tokenAll > 0 ? bucket.output / tokenAll : 0;
  }

  const models = Array.from(matchedMap.values()).sort((a, b) => b.cost - a.cost);
  const unmatched = Array.from(unmatchedMap.values()).sort((a, b) => b.events - a.events);

  const dayKeys = Array.from(dailyMap.keys()).sort();
  const start = dayKeys[0] || null;
  const end = dayKeys[dayKeys.length - 1] || null;
  const filledDays = eachDateInclusive(start, end).map((date) => {
    return dailyMap.get(date) || {
      date,
      cost: 0,
      firstPartyCost: 0,
      apiCost: 0,
      events: 0,
      tokens: 0
    };
  });
  const activeDayCount = filledDays.filter((d) => d.events > 0).length || 1;

  let peakDay = { date: null, cost: 0 };
  for (const d of filledDays) {
    if (d.cost > peakDay.cost) peakDay = { date: d.date, cost: d.cost };
  }

  const topModel = models[0]
    ? { name: models[0].name, share: models[0].costShare, pool: models[0].pool }
    : { name: null, share: 0, pool: null };

  const firstPartyShare = totalCost > 0 ? firstPartyCost / totalCost : 0;
  const apiShare = totalCost > 0 ? apiCost / totalCost : 0;
  const cacheReadCostShare = totalCost > 0 ? composition.cacheRead / totalCost : 0;
  const maxModeCostShare = totalCost > 0 ? maxModeCost / totalCost : 0;
  const matchedEvents = exactEvents + fuzzyEvents;
  const exactMatchRate = matchedEvents > 0 ? exactEvents / matchedEvents : 0;
  const avgDailyCost = totalCost / activeDayCount;
  const avgCostPerEvent = billableEvents > 0 ? totalCost / billableEvents : 0;

  const compositionRows = COMPOSITION_META.map((meta) => {
    const cost = composition[meta.key];
    return {
      key: meta.key,
      label: meta.label,
      tone: meta.tone,
      cost,
      share: totalCost > 0 ? cost / totalCost : 0
    };
  });

  const topComposition = compositionRows.slice().sort((a, b) => b.cost - a.cost)[0];

  let insight = "暂无计费数据";
  if (billableEvents > 0) {
    const dominantPool = apiCost >= firstPartyCost
      ? { label: "API 用量池", share: apiShare }
      : { label: "第一方模型用量池", share: firstPartyShare };
    const parts = [];
    if (totalCost > 0 && dominantPool.share >= 0.5) {
      parts.push(dominantPool.label + "占 " + formatPct(dominantPool.share));
    }
    if (topModel.name) {
      parts.push("主因模型 " + topModel.name + " " + formatPct(topModel.share));
    }
    if (topComposition && topComposition.share >= 0.4) {
      parts.push("花费主因 " + topComposition.label + " " + formatPct(topComposition.share));
    }
    if (peakDay.date) {
      parts.push("峰值日 " + formatShortDate(peakDay.date) + " " + formatUsd(peakDay.cost));
    }
    insight = parts.length > 0 ? parts.join(" · ") : ("估算总花费 " + formatUsd(totalCost));
  }

  return {
    totalCost,
    firstPartyCost,
    apiCost,
    firstPartyShare,
    apiShare,
    billableEvents,
    excludedEvents,
    unmatchedEvents,
    exactEvents,
    fuzzyEvents,
    fuzzyCost,
    exactMatchRate,
    maxModeEvents,
    maxModeCost,
    maxModeCostShare,
    dateRange: { start, end },
    avgDailyCost,
    avgCostPerEvent,
    cacheReadCostShare,
    peakDay,
    topModel,
    insight,
    daily: filledDays,
    composition: compositionRows,
    models,
    unmatched
  };
}
