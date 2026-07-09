import { PRICING_TABLE, REQUIRED_COLUMNS } from "./pricing.js";
import { buildPricingIndex } from "./match.js";
import { parseCsv } from "./csv.js";
import { aggregate } from "./aggregate.js";
import {
  render,
  renderTrendCharts,
  syncModelViewUi,
  setUploadCompact,
  getModelView,
  setModelView,
  bindTrendChartEvents
} from "./render.js";
import { initI18n, setLocale, getLocale, t, onLocaleChange } from "./i18n.js";

let currentSummary = null;
let trendState = {
  metric: "cost",
  selectedDate: null
};
let isLoading = false;

function showError(message) {
  const bar = document.getElementById("errorBar");
  bar.textContent = message;
  bar.classList.add("is-visible");
}

function clearError() {
  const bar = document.getElementById("errorBar");
  bar.textContent = "";
  bar.classList.remove("is-visible");
}

function validateHeaders(headers) {
  return REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
}

function processText(text) {
  const parsed = parseCsv(text);
  if (!parsed.records || parsed.records.length === 0) {
    throw new Error(t("error.noRows"));
  }
  const missing = validateHeaders(parsed.headers);
  if (missing.length > 0) {
    throw new Error(t("error.missingCols", { cols: missing.join(", ") }));
  }
  const pricingIndex = buildPricingIndex(PRICING_TABLE);
  return aggregate(parsed.records, pricingIndex);
}

function setLoading(loading) {
  isLoading = loading;
  const pickBtn = document.getElementById("pickBtn");
  const replaceBtn = document.getElementById("replaceBtn");
  pickBtn.disabled = loading;
  replaceBtn.disabled = loading;
  pickBtn.textContent = loading ? t("action.parsing") : t("action.pickCsv");
  replaceBtn.textContent = loading ? t("action.parsing") : t("action.replaceCsv");
}

function refreshTrendView() {
  if (!currentSummary) return;
  renderTrendCharts(currentSummary, {
    metric: trendState.metric,
    selectedDate: trendState.selectedDate
  });
}

function refreshAfterLocaleChange() {
  clearError();
  setLoading(isLoading);
  if (currentSummary) {
    render(currentSummary, trendState.metric, trendState);
  } else {
    syncModelViewUi(null);
  }
}

function handleFile(file) {
  if (!file) return;
  clearError();
  setLoading(true);

  if (!file.size) {
    setLoading(false);
    showError(t("error.emptyFile"));
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      if (!text.trim()) {
        throw new Error(t("error.emptyContent"));
      }
      const summary = processText(text);
      currentSummary = summary;
      trendState.selectedDate = null;
      render(summary, trendState.metric, trendState);
    } catch (err) {
      document.getElementById("results").classList.remove("is-visible");
      setUploadCompact(false);
      currentSummary = null;
      showError(err.message || t("error.parseFailed"));
    } finally {
      setLoading(false);
    }
  };
  reader.onerror = () => {
    setLoading(false);
    showError(t("error.readFailed"));
  };
  reader.readAsText(file, "UTF-8");
}

function bindUi() {
  const zone = document.getElementById("uploadZone");
  const input = document.getElementById("fileInput");
  const pickBtn = document.getElementById("pickBtn");
  const replaceBtn = document.getElementById("replaceBtn");
  const chartMetric = document.getElementById("chartMetric");
  const langToggle = document.getElementById("langToggle");

  function openPicker() { input.click(); }
  pickBtn.addEventListener("click", openPicker);
  replaceBtn.addEventListener("click", openPicker);

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    handleFile(file);
    input.value = "";
  });

  ["dragenter", "dragover"].forEach((evt) => {
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((evt) => {
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (evt === "dragleave") zone.classList.remove("is-dragover");
    });
  });

  zone.addEventListener("drop", (e) => {
    zone.classList.remove("is-dragover");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  });

  document.addEventListener("dragover", (e) => {
    if (!currentSummary) return;
    e.preventDefault();
  });
  document.addEventListener("drop", (e) => {
    if (!currentSummary) return;
    if (e.target && zone.contains(e.target)) return;
    e.preventDefault();
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  chartMetric.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-metric]");
    if (!btn || !currentSummary) return;
    trendState.metric = btn.getAttribute("data-metric");
    chartMetric.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });
    refreshTrendView();
  });

  bindTrendChartEvents((opts) => {
    trendState.selectedDate = opts.selectedDate;
  });

  const policyToggle = document.getElementById("policyToggle");
  const policyPanel = document.getElementById("policyPanel");
  policyToggle.addEventListener("click", () => {
    const open = policyToggle.getAttribute("aria-expanded") === "true";
    const next = !open;
    policyToggle.setAttribute("aria-expanded", next ? "true" : "false");
    policyPanel.classList.toggle("is-open", next);
    if (next) policyPanel.removeAttribute("hidden");
    else policyPanel.setAttribute("hidden", "");
  });

  const modelViewEl = document.getElementById("modelView");
  modelViewEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-model-view]");
    if (!btn) return;
    const next = btn.getAttribute("data-model-view");
    if (next === getModelView()) return;
    setModelView(next);
    modelViewEl.querySelectorAll("button[data-model-view]").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });
    if (currentSummary) {
      render(currentSummary, trendState.metric, trendState, { animateModels: true });
    } else {
      syncModelViewUi(null);
    }
  });

  if (langToggle) {
    langToggle.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-lang]");
      if (!btn) return;
      const next = btn.getAttribute("data-lang");
      if (next === getLocale()) return;
      setLocale(next);
    });
  }

  onLocaleChange(() => {
    refreshAfterLocaleChange();
  });
}

initI18n();
bindUi();
