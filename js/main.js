import { PRICING_TABLE, REQUIRED_COLUMNS } from "./pricing.js";
import { buildPricingIndex } from "./match.js";
import { parseCsv } from "./csv.js";
import { aggregate } from "./aggregate.js";
import {
  render,
  renderDailyChart,
  renderModels,
  syncModelViewUi,
  setUploadCompact,
  getModelView,
  setModelView
} from "./render.js";

let currentSummary = null;
let currentChartMetric = "cost";

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
    throw new Error("CSV 没有数据行。请确认是 Cursor usage-events 导出文件。");
  }
  const missing = validateHeaders(parsed.headers);
  if (missing.length > 0) {
    throw new Error("缺少必要列：" + missing.join(", "));
  }
  const pricingIndex = buildPricingIndex(PRICING_TABLE);
  return aggregate(parsed.records, pricingIndex);
}

function setLoading(loading) {
  const pickBtn = document.getElementById("pickBtn");
  const replaceBtn = document.getElementById("replaceBtn");
  const label = loading ? "解析中…" : "选择 CSV";
  const replaceLabel = loading ? "解析中…" : "更换 CSV";
  pickBtn.disabled = loading;
  replaceBtn.disabled = loading;
  pickBtn.textContent = label;
  replaceBtn.textContent = replaceLabel;
}

function handleFile(file) {
  if (!file) return;
  clearError();
  setLoading(true);

  if (!file.size) {
    setLoading(false);
    showError("文件为空，请重新选择。");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      if (!text.trim()) {
        throw new Error("文件内容为空。");
      }
      const summary = processText(text);
      currentSummary = summary;
      render(summary, currentChartMetric);
    } catch (err) {
      document.getElementById("results").classList.remove("is-visible");
      setUploadCompact(false);
      currentSummary = null;
      showError(err.message || "无法解析 CSV，请确认是 Cursor usage-events 导出文件。");
    } finally {
      setLoading(false);
    }
  };
  reader.onerror = () => {
    setLoading(false);
    showError("读取文件失败，请重试。");
  };
  reader.readAsText(file, "UTF-8");
}

function bindUi() {
  const zone = document.getElementById("uploadZone");
  const input = document.getElementById("fileInput");
  const pickBtn = document.getElementById("pickBtn");
  const replaceBtn = document.getElementById("replaceBtn");
  const chartMetric = document.getElementById("chartMetric");

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

  // 结果态也可拖到页面顶部更换
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
    currentChartMetric = btn.getAttribute("data-metric");
    chartMetric.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });
    renderDailyChart(currentSummary, currentChartMetric);
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
    if (currentSummary) renderModels(currentSummary, { animate: true });
    else syncModelViewUi(null);
  });
}

bindUi();
