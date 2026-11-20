import { aggregate, eventDateKey } from "./aggregate.js";
import { renderBento, slashDate } from "./bento.js";
import { closeCalendar, downloadBounds, inclusiveDays, openCalendar, presetWithin, sameRange } from "./calendar.js";
import { parseCsv } from "./csv.js";
import { buildExportUsageEventsCsvUrlForRange } from "./export-usage-events-csv.js";
import { exportReportImage } from "./export-report.js";
import { getLocale, initI18n, onLocaleChange, setLocale, t } from "./i18n.js";
import { buildPricingIndex } from "./match.js";
import { PRICING_TABLE, REQUIRED_COLUMNS } from "./pricing.js";

const VIEW_PRESETS = ["d7", "d30", "month", "all"];
const DOWNLOAD_PRESETS = ["d7", "d30", "month", "d90"];

let records = null;
let viewRange = null;
let fileBounds = null;
let downloadRange = presetWithin("d30", downloadBounds());
let selectedModel = null;
let selectedDate = null;
let chartMode = "daily";
let metric = "cost";
let tab = "models";
let mode = "entry";
let busy = false;

const pricingIndex = buildPricingIndex(PRICING_TABLE);

function showError(message) {
  const bar = document.getElementById("errorBar");
  bar.hidden = !message;
  bar.textContent = message || "";
}

function fileBoundsOf(rows) {
  let start = null;
  let end = null;
  rows.forEach((row) => {
    const key = eventDateKey(row.Date);
    if (!key) return;
    if (!start || key < start) start = key;
    if (!end || key > end) end = key;
  });
  return start && end ? { start, end } : null;
}

function currentSummary() {
  if (!records || !viewRange) return null;
  const filtered = records.filter((row) => {
    const key = eventDateKey(row.Date);
    return key && key >= viewRange.start && key <= viewRange.end;
  });
  if (!filtered.length) {
    return {
      empty: true,
      totalCost: 0,
      firstPartyCost: 0,
      apiCost: 0,
      firstPartyShare: 0,
      apiShare: 0,
      billableEvents: 0,
      unmatchedEvents: 0,
      maxModeCostShare: 0,
      cacheHitRate: 0,
      avgDailyCost: 0,
      avgCostPerEvent: 0,
      dateRange: { ...viewRange },
      daily: [],
      models: [],
      unmatched: [],
      composition: [],
      favorites: { byCost: {}, byTokens: {}, costTokenMismatch: false },
      peakDay: null,
      dominantPoolKey: "firstParty",
      dominantPoolShare: 0
    };
  }
  return aggregate(filtered, pricingIndex);
}

function paint() {
  const summary = mode === "analysis" ? currentSummary() : null;
  if (summary && selectedModel && !summary.models.some((model) => model.name === selectedModel)) {
    selectedModel = null;
  }
  if (summary && selectedDate && !(summary.daily || []).some((day) => day.date === selectedDate)) {
    selectedDate = null;
  }
  const entry = document.getElementById("entry");
  const bento = document.getElementById("bento");
  const picker = document.getElementById("viewPicker");
  const back = document.getElementById("backBtn");
  entry.hidden = mode !== "entry";
  bento.hidden = mode !== "analysis";
  picker.hidden = mode !== "analysis";
  back.hidden = mode !== "entry" || !records;
  if (summary) {
    renderBento(summary, {
      selectedModel,
      selectedDate,
      chartMode,
      metric,
      tab,
      range: viewRange,
      onSelectDate: (date) => {
        selectedModel = null;
        selectedDate = selectedDate === date ? null : date;
        paint();
      }
    });
  }
  syncChrome();
  const download = document.getElementById("downloadCsv");
  download.href = buildExportUsageEventsCsvUrlForRange(downloadRange.start, downloadRange.end);
}

function syncChrome() {
  document.querySelectorAll("#viewPicker [data-preset]").forEach((button) => {
    const id = button.getAttribute("data-preset");
    button.textContent = t("bento.preset." + id);
    button.classList.toggle("is-on", fileBounds && sameRange(viewRange, presetWithin(id, fileBounds)));
  });
  document.querySelectorAll("#downloadPicker [data-preset]").forEach((button) => {
    const id = button.getAttribute("data-preset");
    button.textContent = t("bento.preset." + id);
    button.classList.toggle("is-on", sameRange(downloadRange, presetWithin(id, downloadBounds())));
  });
  const viewLabel = document.getElementById("viewRangeLabel");
  if (viewRange) viewLabel.textContent = slashDate(viewRange.start) + " – " + slashDate(viewRange.end);
  const downloadLabel = document.getElementById("downloadRangeLabel");
  downloadLabel.textContent = slashDate(downloadRange.start) + " – " + slashDate(downloadRange.end);
  document.getElementById("downloadDays").textContent = t("range.days", { n: inclusiveDays(downloadRange.start, downloadRange.end) });
  document.getElementById("langBtn").textContent = getLocale() === "zh" ? "EN" : "中";
  const replaceBtn = document.getElementById("replaceBtn");
  const exportBtn = document.getElementById("exportBtn");
  replaceBtn.hidden = mode !== "analysis";
  exportBtn.hidden = mode !== "analysis";
  replaceBtn.textContent = busy ? t("action.parsing") : t("action.replaceCsv");
  exportBtn.textContent = busy ? t("action.exporting") : t("action.exportReport");
  replaceBtn.disabled = busy;
  exportBtn.disabled = busy;
  document.querySelectorAll("[data-chart-mode]").forEach((button) => {
    button.classList.toggle("is-on", button.getAttribute("data-chart-mode") === chartMode);
  });
  document.querySelectorAll("#bento [data-metric]").forEach((button) => {
    button.classList.toggle("is-on", button.getAttribute("data-metric") === metric);
  });
}

function setViewRange(next) {
  viewRange = next;
  selectedDate = null;
  closeCalendar();
  paint();
}

function handleFile(file) {
  if (!file || busy) return;
  showError("");
  if (!file.size) {
    showError(t("error.emptyFile"));
    return;
  }
  busy = true;
  syncChrome();
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      if (!text.trim()) throw new Error(t("error.emptyContent"));
      const parsed = parseCsv(text);
      if (!parsed.records || !parsed.records.length) throw new Error(t("error.noRows"));
      const missing = REQUIRED_COLUMNS.filter((col) => !parsed.headers.includes(col));
      if (missing.length) throw new Error(t("error.missingCols", { cols: missing.join(", ") }));
      const bounds = fileBoundsOf(parsed.records);
      if (!bounds) throw new Error(t("error.parseFailed"));
      records = parsed.records;
      fileBounds = bounds;
      viewRange = { ...bounds };
      selectedModel = null;
      selectedDate = null;
      tab = "models";
      mode = "analysis";
      paint();
    } catch (err) {
      showError(err.message || t("error.parseFailed"));
    } finally {
      busy = false;
      syncChrome();
    }
  };
  reader.onerror = () => {
    busy = false;
    showError(t("error.readFailed"));
    syncChrome();
  };
  reader.readAsText(file, "UTF-8");
}

function bindUi() {
  const input = document.getElementById("fileInput");
  const drop = document.getElementById("dropZone");
  const viewPicker = document.getElementById("viewPicker");
  const downloadPicker = document.getElementById("downloadPicker");

  drop.addEventListener("click", () => input.click());
  drop.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    input.click();
  });
  input.addEventListener("change", () => {
    handleFile(input.files && input.files[0]);
    input.value = "";
  });
  ["dragenter", "dragover"].forEach((name) => {
    drop.addEventListener(name, (event) => {
      event.preventDefault();
      drop.classList.add("is-over");
    });
  });
  ["dragleave", "drop"].forEach((name) => {
    drop.addEventListener(name, (event) => {
      event.preventDefault();
      if (name === "dragleave") drop.classList.remove("is-over");
    });
  });
  drop.addEventListener("drop", (event) => {
    drop.classList.remove("is-over");
    handleFile(event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]);
  });

  document.getElementById("replaceBtn").addEventListener("click", () => {
    mode = "entry";
    closeCalendar();
    paint();
  });
  document.getElementById("backBtn").addEventListener("click", () => {
    if (!records) return;
    mode = "analysis";
    closeCalendar();
    paint();
  });
  document.getElementById("exportBtn").addEventListener("click", async () => {
    const summary = currentSummary();
    if (!summary || summary.empty || busy) return;
    busy = true;
    syncChrome();
    try {
      await exportReportImage({ summary });
    } catch (err) {
      showError(err.message || t("export.error.failed"));
    } finally {
      busy = false;
      syncChrome();
    }
  });
  document.getElementById("langBtn").addEventListener("click", () => {
    setLocale(getLocale() === "zh" ? "en" : "zh");
  });

  viewPicker.addEventListener("click", (event) => {
    const preset = event.target.closest("[data-preset]");
    if (preset && fileBounds) {
      setViewRange(presetWithin(preset.getAttribute("data-preset"), fileBounds));
      return;
    }
    if (event.target.closest("#viewCalBtn") && fileBounds) {
      openCalendar({
        anchor: viewPicker,
        range: viewRange,
        bounds: fileBounds,
        presetIds: VIEW_PRESETS,
        onChange: setViewRange
      });
    }
  });

  downloadPicker.addEventListener("click", (event) => {
    const preset = event.target.closest("[data-preset]");
    if (preset) {
      downloadRange = presetWithin(preset.getAttribute("data-preset"), downloadBounds());
      closeCalendar();
      paint();
      return;
    }
    if (event.target.closest("#downloadCalBtn")) {
      openCalendar({
        anchor: downloadPicker,
        range: downloadRange,
        bounds: downloadBounds(),
        presetIds: DOWNLOAD_PRESETS,
        onChange: (next) => {
          downloadRange = next;
          paint();
        }
      });
    }
  });

  document.getElementById("bento").addEventListener("click", (event) => {
    const tabBtn = event.target.closest("[data-tab]");
    if (tabBtn) {
      tab = tabBtn.getAttribute("data-tab");
      paint();
      return;
    }
    if (event.target.closest("[data-clear-model]")) {
      selectedModel = null;
      paint();
      return;
    }
    if (event.target.closest("[data-clear-day]")) {
      selectedDate = null;
      paint();
      return;
    }
    const modeBtn = event.target.closest("[data-chart-mode]");
    if (modeBtn) {
      chartMode = modeBtn.getAttribute("data-chart-mode");
      paint();
      return;
    }
    const metricBtn = event.target.closest("[data-metric]");
    if (metricBtn) {
      metric = metricBtn.getAttribute("data-metric");
      paint();
      return;
    }
    const modelBtn = event.target.closest("[data-model]");
    if (modelBtn) {
      const name = modelBtn.getAttribute("data-model");
      selectedDate = null;
      selectedModel = selectedModel === name ? null : name;
      paint();
    }
  });

  onLocaleChange(() => paint());
}

initI18n();
bindUi();
paint();
