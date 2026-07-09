import { t } from "./i18n.js";

export function formatUsd(n) {
  if (!Number.isFinite(n)) return "$0.00";
  const abs = Math.abs(n);
  let digits = 2;
  if (abs > 0 && abs < 0.01) digits = 4;
  else if (abs < 1) digits = 3;
  return "$" + n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

export function formatInt(n) {
  return Math.round(n).toLocaleString("en-US");
}

export function formatTokens(n) {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (abs >= 1e4) return (n / 1e3).toFixed(1).replace(/\.?0+$/, "") + "k";
  if (abs >= 1e3) return (n / 1e3).toFixed(2).replace(/\.?0+$/, "") + "k";
  return Math.round(n).toLocaleString("en-US");
}

export function formatPct(n) {
  if (!Number.isFinite(n)) return "0%";
  const pct = n * 100;
  const digits = pct > 0 && pct < 1 ? 2 : 1;
  return pct.toFixed(digits) + "%";
}

export function formatShortDate(key) {
  if (!key) return "—";
  const parts = key.split("-");
  return parts[1] + "-" + parts[2];
}

export function formatPrice(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return "$" + n.toFixed(2);
}

function buildFuzzyTip(sampleCsv, priceName) {
  const samples = String(sampleCsv || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const price = String(priceName || "").trim();
  if (!samples.length || !price) return "";

  const maxShow = 3;
  const shown = samples.slice(0, maxShow).join(", ");
  if (samples.length === 1) {
    return t("tip.fuzzyMatch", { csv: samples[0], price });
  }
  if (samples.length <= maxShow) {
    return t("tip.fuzzyMatchMulti", { csv: shown, price });
  }
  return t("tip.fuzzyMatchMore", { csv: shown, n: samples.length, price });
}

export function strengthBadge(strength, options = {}) {
  if (strength === "exact") return '<span class="badge exact">' + t("badge.exact") + "</span>";
  if (strength === "fuzzy") {
    const tip = buildFuzzyTip(options.sampleCsv, options.priceName);
    const titleAttr = tip ? ' title="' + escapeHtml(tip) + '"' : "";
    return '<span class="badge fuzzy"' + titleAttr + ">" + t("badge.fuzzy") + "</span>";
  }
  return '<span class="badge miss">' + t("badge.miss") + "</span>";
}

export function poolBadge(pool) {
  if (pool === "firstParty") return '<span class="badge pool-fp">' + t("badge.poolFp") + "</span>";
  if (pool === "api") return '<span class="badge pool-api">' + t("badge.poolApi") + "</span>";
  return '<span class="badge pool-unknown">' + t("badge.poolUnknown") + "</span>";
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
