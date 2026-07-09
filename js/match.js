import { EFFORT_SUFFIXES, THINK_SUFFIXES } from "./pricing.js";

export function normalizeKey(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function buildPricingIndex(table) {
  const index = Object.create(null);
  function register(key, entry) {
    if (!key) return;
    if (index[key] === entry) return;
    if (index[key]) {
      console.warn("定价表归一化冲突，保留先写入项:", key, entry.name);
      return;
    }
    index[key] = entry;
  }
  for (const entry of table) {
    register(normalizeKey(entry.name), entry);
    if (Array.isArray(entry.aliases)) {
      for (const alias of entry.aliases) {
        register(normalizeKey(alias), entry);
      }
    }
  }
  return index;
}

export function matchModel(csvModel, index) {
  const raw = String(csvModel || "").trim();
  const key = normalizeKey(raw);

  if (!key) {
    return { entry: null, matchedKey: "", strength: "unmatched" };
  }

  if (key === "auto" && index.auto) {
    return { entry: index.auto, matchedKey: "auto", strength: "exact" };
  }

  if (index[key]) {
    return { entry: index[key], matchedKey: key, strength: "exact" };
  }

  const segments = raw.toLowerCase().split(/[-_./\s]+/).filter(Boolean);
  const effortSet = new Set(EFFORT_SUFFIXES);

  // 先去掉思考档位（保留 fast 价档），例如 gpt-5-high-fast → gpt-5-fast
  const withoutEffort = segments.filter((s) => !effortSet.has(s));
  if (withoutEffort.length !== segments.length) {
    const candidate = normalizeKey(withoutEffort.join(""));
    if (candidate && index[candidate]) {
      return { entry: index[candidate], matchedKey: candidate, strength: "fuzzy" };
    }
  }

  // 再逐步从末尾剥后缀（含 fast），每剥一层查一次
  let current = key;
  let peeling = true;
  while (peeling) {
    peeling = false;
    for (const suffix of THINK_SUFFIXES) {
      if (current.length > suffix.length && current.endsWith(suffix)) {
        current = current.slice(0, -suffix.length);
        if (index[current]) {
          return { entry: index[current], matchedKey: current, strength: "fuzzy" };
        }
        peeling = true;
        break;
      }
    }
  }

  for (let drop = 1; drop < segments.length; drop += 1) {
    const candidate = normalizeKey(segments.slice(0, segments.length - drop).join(""));
    if (candidate && index[candidate]) {
      return { entry: index[candidate], matchedKey: candidate, strength: "fuzzy" };
    }
  }

  return { entry: null, matchedKey: key, strength: "unmatched" };
}
