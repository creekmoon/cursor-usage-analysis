import { clearTrendSelection } from "./render.js";
import { t } from "./i18n.js";

export const PROJECT_URL = "https://github.com/creekmoon/cursor-usage-analysis";

const HTML2CANVAS_SRC = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
const CAPTURE_WIDTH = 1180;

let html2canvasPromise = null;

function loadHtml2Canvas() {
  if (typeof window.html2canvas === "function") {
    return Promise.resolve(window.html2canvas);
  }
  if (html2canvasPromise) return html2canvasPromise;

  html2canvasPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${HTML2CANVAS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => {
        if (typeof window.html2canvas === "function") resolve(window.html2canvas);
        else reject(new Error(t("export.error.failed")));
      });
      existing.addEventListener("error", () => reject(new Error(t("export.error.failed"))));
      return;
    }
    const script = document.createElement("script");
    script.src = HTML2CANVAS_SRC;
    script.async = true;
    script.onload = () => {
      if (typeof window.html2canvas === "function") resolve(window.html2canvas);
      else reject(new Error(t("export.error.failed")));
    };
    script.onerror = () => {
      html2canvasPromise = null;
      reject(new Error(t("export.error.failed")));
    };
    document.head.appendChild(script);
  });

  return html2canvasPromise;
}

function buildFooter(summary) {
  const footer = document.createElement("footer");
  footer.className = "export-footer";

  const title = document.createElement("p");
  title.className = "export-footer-title";
  title.textContent = t("export.footer.title");

  const meta = document.createElement("p");
  meta.className = "export-footer-meta";
  const range = summary?.dateRange;
  const rangeText = range?.start && range?.end
    ? `${range.start} → ${range.end}`
    : "";
  const parts = [t("export.footer.disclaimer")];
  if (rangeText) parts.push(rangeText);
  meta.textContent = parts.join(" · ");

  const link = document.createElement("a");
  link.className = "export-footer-link";
  link.href = PROJECT_URL;
  link.textContent = t("export.footer.linkLabel");
  link.setAttribute("rel", "noopener noreferrer");

  footer.appendChild(title);
  footer.appendChild(meta);
  footer.appendChild(link);
  return footer;
}

function prepareExportClone(root) {
  root.querySelectorAll(".segmented").forEach((el) => {
    el.style.display = "none";
  });

  for (const id of ["chartCrosshair", "chartTip", "clearSelection"]) {
    const el = root.querySelector(`#${id}`);
    if (el) el.style.display = "none";
  }

  // html2canvas 对 overflow:hidden 的文本常会裁掉首尾字形
  root.querySelectorAll(
    ".table-wrap, .usage-pref-name, .usage-hbar-label, .usage-chart-host, .usage-panel"
  ).forEach((el) => {
    el.style.overflow = "visible";
  });

  root.querySelectorAll(".usage-pref-name, .usage-hbar-label").forEach((el) => {
    el.style.textOverflow = "clip";
    el.style.whiteSpace = "normal";
    el.style.wordBreak = "break-word";
    el.style.overflow = "visible";
    el.style.paddingLeft = "2px";
  });

  root.querySelectorAll(".usage-pref-row").forEach((el) => {
    el.style.gridTemplateColumns = "minmax(168px, 240px) 1fr";
  });

  root.querySelectorAll(".usage-hbar").forEach((el) => {
    el.style.gridTemplateColumns = "minmax(168px, 240px) 1fr 52px 64px";
  });

  root.querySelectorAll("[id]").forEach((el) => {
    el.removeAttribute("id");
  });

  if (root.classList.contains("results")) {
    root.classList.add("is-visible");
    root.style.display = "block";
    root.style.width = "100%";
  }

  root.querySelectorAll(".results").forEach((el) => {
    el.classList.add("is-visible");
    el.style.display = "block";
    el.style.width = "100%";
  });
}

function createCaptureRoot(resultsEl, summary) {
  const root = document.createElement("div");
  root.id = "exportCaptureRoot";
  root.className = "export-capture-root";
  root.setAttribute("aria-hidden", "true");

  const panel = document.createElement("div");
  panel.className = "export-capture-panel";

  const clone = resultsEl.cloneNode(true);
  prepareExportClone(clone);
  panel.appendChild(clone);
  panel.appendChild(buildFooter(summary));
  root.appendChild(panel);
  document.body.appendChild(root);
  return root;
}

function buildFileName(summary) {
  const range = summary?.dateRange;
  if (range?.start && range?.end) {
    return `cursor-usage-report_${range.start}_${range.end}.png`;
  }
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `cursor-usage-report_${stamp}.png`;
}

function downloadCanvas(canvas, fileName) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(t("export.error.failed")));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}

async function renderToCanvas(html2canvas, target, scale) {
  const width = Math.max(CAPTURE_WIDTH, Math.ceil(target.scrollWidth || CAPTURE_WIDTH));
  return html2canvas(target, {
    backgroundColor: "#F4F6F8",
    scale,
    useCORS: true,
    logging: false,
    width,
    windowWidth: width,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
    // html2canvas 会再克隆一层 DOM，须在这里再次放开 overflow
    onclone(_doc, cloned) {
      prepareExportClone(cloned);
    }
  });
}

export async function exportReportImage({ summary }) {
  const resultsEl = document.getElementById("results");
  if (!resultsEl || !summary) {
    throw new Error(t("export.error.failed"));
  }

  clearTrendSelection();

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore font readiness failures */
    }
  }

  const html2canvas = await loadHtml2Canvas();
  const root = createCaptureRoot(resultsEl, summary);
  const target = root.querySelector(".export-capture-panel");

  try {
    // 给浏览器一帧布局时间，避免克隆后尺寸为 0
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    let canvas;
    try {
      canvas = await renderToCanvas(html2canvas, target, 2);
    } catch (err) {
      const msg = String(err?.message || err || "");
      if (/canvas|size|memory|height|width/i.test(msg)) {
        try {
          canvas = await renderToCanvas(html2canvas, target, 1);
        } catch {
          throw new Error(t("export.error.tooLarge"));
        }
      } else {
        throw new Error(t("export.error.failed"));
      }
    }

    await downloadCanvas(canvas, buildFileName(summary));
  } finally {
    root.remove();
  }
}
