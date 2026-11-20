import { getLocale, t } from "./i18n.js";

export function utcTodayISO(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

export function shiftISO(iso, delta) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

export function inclusiveDays(start, end) {
  if (!start || !end) return 0;
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  return Math.round((Date.UTC(ye, me - 1, de) - Date.UTC(ys, ms - 1, ds)) / 86400000) + 1;
}

function clampRange(range, bounds) {
  let start = range.start < bounds.start ? bounds.start : range.start;
  let end = range.end > bounds.end ? bounds.end : range.end;
  if (start > end) start = bounds.start;
  if (start > end) end = start;
  return { start, end };
}

export function presetWithin(id, bounds) {
  if (!bounds?.start || !bounds?.end) return { start: bounds?.start || "", end: bounds?.end || "" };
  const end = bounds.end;
  if (id === "all") return { start: bounds.start, end };
  if (id === "d7") return clampRange({ start: shiftISO(end, -6), end }, bounds);
  if (id === "d30") return clampRange({ start: shiftISO(end, -29), end }, bounds);
  if (id === "d90") return clampRange({ start: shiftISO(end, -89), end }, bounds);
  if (id === "month") return clampRange({ start: end.slice(0, 8) + "01", end }, bounds);
  return { start: bounds.start, end };
}

export function downloadBounds(now = new Date()) {
  const end = utcTodayISO(now);
  return { start: shiftISO(end, -364), end };
}

export function sameRange(a, b) {
  return Boolean(a && b && a.start === b.start && a.end === b.end);
}

function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function monthCells(y, m) {
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= count; d += 1) {
    cells.push(y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0"));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

let openState = null;

export function closeCalendar() {
  if (!openState) return;
  openState.pop.remove();
  document.removeEventListener("pointerdown", openState.onDoc, true);
  document.removeEventListener("keydown", openState.onKey);
  openState = null;
}

export function openCalendar({ anchor, range, bounds, presetIds, onChange }) {
  closeCalendar();
  const lang = getLocale();
  const weekdays = lang === "zh"
    ? ["一", "二", "三", "四", "五", "六", "日"]
    : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  let view = parseISO(range.end || bounds.end);
  let draft = null;
  let hover = null;

  const pop = document.createElement("div");
  pop.className = "dx-pop";
  pop.setAttribute("role", "dialog");
  anchor.appendChild(pop);

  function paint() {
    const active = presetIds.find((id) => sameRange(presetWithin(id, bounds), range) && !draft);
    let lo = range.start;
    let hi = range.end;
    if (draft) {
      lo = draft;
      hi = hover || draft;
      if (hi < lo) {
        const swap = lo;
        lo = hi;
        hi = swap;
      }
    }
    const min = parseISO(bounds.start);
    const max = parseISO(bounds.end);
    const atMin = view.y === min.y && view.m === min.m;
    const atMax = view.y === max.y && view.m === max.m;
    const cells = monthCells(view.y, view.m);
    const title = lang === "zh" ? view.y + "年" + view.m + "月" : view.y + "-" + String(view.m).padStart(2, "0");

    pop.innerHTML = `
      <div class="dx-pop-presets">
        ${presetIds.map((id) => `<button type="button" class="dx-pop-preset${active === id ? " is-on" : ""}" data-preset="${id}">${t("bento.preset." + id)}</button>`).join("")}
      </div>
      <div class="dx-pop-cal">
        <div class="dx-pop-head">
          <button type="button" class="dx-pop-nav" data-shift="-1" ${atMin ? "disabled" : ""} aria-label="${t("range.prev")}">‹</button>
          <span>${title}</span>
          <button type="button" class="dx-pop-nav" data-shift="1" ${atMax ? "disabled" : ""} aria-label="${t("range.next")}">›</button>
        </div>
        <div class="dx-pop-week">${weekdays.map((w) => `<span>${w}</span>`).join("")}</div>
        <div class="dx-pop-grid">
          ${cells.map((iso) => {
            if (!iso) return "<span></span>";
            const disabled = iso < bounds.start || iso > bounds.end;
            const cls = [
              "dx-day",
              iso >= lo && iso <= hi ? "is-in" : "",
              iso === lo ? "is-start" : "",
              iso === hi ? "is-end" : "",
              iso === bounds.end ? "is-today" : ""
            ].filter(Boolean).join(" ");
            return `<button type="button" class="${cls}" data-day="${iso}" ${disabled ? "disabled" : ""}>${Number(iso.slice(8))}</button>`;
          }).join("")}
        </div>
        <div class="dx-pop-foot">
          <span>${draft ? t("range.end") : t("range.pick")}</span>
          <b>${t("range.days", { n: inclusiveDays(lo, hi) })}</b>
        </div>
      </div>
    `;
  }

  pop.addEventListener("click", (event) => {
    const preset = event.target.closest("[data-preset]");
    if (preset) {
      onChange(presetWithin(preset.getAttribute("data-preset"), bounds));
      closeCalendar();
      return;
    }
    const shift = event.target.closest("[data-shift]");
    if (shift && !shift.disabled) {
      let y = view.y;
      let m = view.m + Number(shift.getAttribute("data-shift"));
      if (m < 1) { y -= 1; m = 12; }
      if (m > 12) { y += 1; m = 1; }
      view = { y, m, d: 1 };
      paint();
      return;
    }
    const day = event.target.closest("[data-day]");
    if (!day || day.disabled) return;
    const iso = day.getAttribute("data-day");
    if (!draft) {
      draft = iso;
      hover = null;
      paint();
      return;
    }
    let start = draft;
    let end = iso;
    if (end < start) {
      const swap = start;
      start = end;
      end = swap;
    }
    onChange({ start, end });
    closeCalendar();
  });

  pop.addEventListener("mouseover", (event) => {
    const day = event.target.closest("[data-day]");
    if (!draft || !day || day.disabled) return;
    const iso = day.getAttribute("data-day");
    if (iso === hover) return;
    hover = iso;
    paint();
  });

  function onDoc(event) {
    if (anchor.contains(event.target)) return;
    closeCalendar();
  }
  function onKey(event) {
    if (event.key === "Escape") closeCalendar();
  }
  document.addEventListener("pointerdown", onDoc, true);
  document.addEventListener("keydown", onKey);
  openState = { pop, onDoc, onKey };
  paint();
}
