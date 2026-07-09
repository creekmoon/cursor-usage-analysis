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

export function strengthBadge(strength) {
  if (strength === "exact") return '<span class="badge exact">精确匹配</span>';
  if (strength === "fuzzy") return '<span class="badge fuzzy">模糊匹配</span>';
  return '<span class="badge miss">未匹配</span>';
}

export function poolBadge(pool) {
  if (pool === "firstParty") return '<span class="badge pool-fp">第一方模型</span>';
  if (pool === "api") return '<span class="badge pool-api">API</span>';
  return '<span class="badge pool-unknown">未知</span>';
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
