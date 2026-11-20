const STORAGE_KEY = "cursor-usage-locale";

const STRINGS = {
  zh: {
    "doc.title": "Cursor 用量花费估算",
    "app.title": "Cursor 用量花费估算",
    "app.subtitle": "解析 usage-events CSV，按官方价表估算理论花费（$/1M tokens）。",
    "policy.toggle": "计费说明",
    "policy.body": "用量分「第一方模型」与「API」两个用量池，额度互不共用。本页为价表估算，非官方账单；团队方案第三方另收 Cursor Token 费率（$0.25/1M tokens），本页未计入。价表来源：",
    "policy.linkPricing": "模型与价格",
    "policy.asOf": "（2026-10-27）",
    "action.replaceCsv": "更换 CSV",
    "action.downloadCsv": "下载近 30 天 CSV",
    "action.parsing": "解析中…",
    "action.exportReport": "导出图片报告",
    "action.exporting": "导出中…",
    "export.error.failed": "导出图片失败，请重试。",
    "export.error.tooLarge": "报告过长，无法生成高清图片，请缩短日期范围后重试。",
    "export.footer.title": "Cursor 用量花费估算",
    "export.footer.disclaimer": "价表估算，非官方账单",
    "export.footer.linkLabel": "github.com/creekmoon/cursor-usage-analysis",
    "upload.aria": "上传 CSV",
    "upload.title": "把 CSV 拖入此框",
    "upload.hint": "下载完成后，拖入或点击此框",
    "upload.guideToggle": "尚未登录？点此去 Cursor 登录",
    "upload.step1": "打开",
    "upload.step2.before": "时间范围选择",
    "upload.step3.before": "点击",
    "upload.step3.after": "，再将文件拖入此处",
    "lang.aria": "语言",
    "lang.zh": "中文",
    "lang.en": "English",

    "metric.total": "估算总花费",
    "metric.poolFp": "第一方模型用量池",
    "metric.poolFpHint": "Auto / Composer / Grok",
    "metric.poolApi": "API 用量池",
    "metric.poolApiHint": "按模型 API 价格计费",
    "metric.dailyAvg": "日均花费",
    "metric.eventAvg": "单次均价",
    "metric.cacheShare": "缓存读取花费占比",
    "metric.cacheShareHint": "缓存读取花费 / 估算总花费",
    "metric.maxShare": "Max Mode 花费占比",
    "metric.maxShareHint": "Max Mode 事件的估算花费",

    "usage.heading": "模型用量与花费",
    "usage.note": "同一批模型同时看花费与 Token",
    "usage.chartCompare": "模型对照",
    "usage.chartMix": "Token 类型构成",
    "usage.empty": "暂无计费用量",
    "usage.noData": "暂无模型用量数据",
    "usage.anchor.total": "总 Token {tokens}",
    "usage.anchor.avg": "单次均 {tokens}",
    "usage.anchor.cache": "缓存命中 {pct}",
    "usage.anchor.unit": "均 Token 单价 {price} / 1M",
    "usage.compare.note": "按估算花费降序",
    "usage.compare.col.model": "价表模型",
    "usage.compare.col.cost": "花费份额",
    "usage.compare.col.token": "Token 份额",
    "usage.compare.col.side": "事件 · 均价 · 池",
    "usage.compare.costTitle": "花费 {cost} · {pct}",
    "usage.compare.tokenTitle": "Token {tokens} · {pct}",
    "usage.pool.fp": "第一方",
    "usage.pool.api": "API",
    "usage.pool.unknown": "未知",

    "trend.heading": "花费趋势",
    "trend.metric.cost": "花费",
    "trend.metric.events": "事件",
    "trend.metric.tokens": "Token 数",
    "trend.metric.aria": "趋势指标",
    "trend.legend.fp": "第一方模型",
    "trend.legend.api": "API",
    "trend.clear": "清除",
    "trend.cumulative": "累计趋势",
    "trend.daily": "按日花费",
    "trend.stage.aria": "花费趋势图表",
    "trend.note": "按本地时区聚合日期；悬停或点击日期查看明细",
    "trend.empty": "无按日数据",
    "trend.aria.cumulative": "累计趋势",
    "trend.aria.daily": "按日趋势",

    "composition.heading": "花费构成（按 token 类型）",
    "composition.note": "四类花费之和等于估算总花费",
    "composition.empty": "暂无构成数据",
    "composition.noData": "暂无数据",

    "models.heading": "计算过程",
    "models.collapsedHint": "{n} 个模型 · 审计明细",
    "models.note.calc": "单位 $/1M tokens · 分项之和等于该模型估算花费",
    "models.meta.provider": "提供商 {provider}",
    "models.meta.matchPrefix": "匹配",
    "models.meta.pool": "用量池 {pool}",
    "models.meta.events": "事件 {n}",
    "models.meta.tokensPerEvent": "Token/事件 {tokens}",
    "models.empty": "没有可汇总的计费事件",
    "models.th.provider": "提供商",
    "models.th.model": "价表模型",
    "models.th.match": "匹配方式",
    "models.th.pool": "用量池",
    "models.th.events": "事件",
    "models.th.cost": "估算花费",
    "models.th.costShare": "花费占比",
    "models.th.avgCost": "单次均价",
    "models.th.type": "类型",
    "models.th.usage": "用量",
    "models.th.unitPrice": "单价 $/1M",
    "models.th.partCost": "分项花费",
    "models.th.total": "合计",
    "models.priceSameAsInput": "同 Input",
    "models.footnote.unmatched": "无价表 · 估算 $0",
    "models.footnote.auto": "Auto：Input 与 Cache Write 合并按 Input 价",
    "models.line.input": "输入",
    "models.line.cacheWrite": "缓存写入",
    "models.line.cacheRead": "缓存读取",
    "models.line.output": "输出",
    "models.line.inputPlusCw": "输入+缓存写",

    "unmatched.heading": "未匹配模型",
    "unmatched.note": "已计入事件，估算花费记为 $0",
    "unmatched.th.csvModel": "CSV 模型",
    "unmatched.th.events": "事件",
    "unmatched.th.input": "输入",
    "unmatched.th.cacheWrite": "缓存写入",
    "unmatched.th.cacheRead": "缓存读取",
    "unmatched.th.output": "输出",

    "token.input": "输入",
    "token.cacheWrite": "缓存写入",
    "token.cacheRead": "缓存读取",
    "token.output": "输出",
    "token.other": "其他",
    "token.emptyModel": "(空模型)",

    "badge.exact": "精确匹配",
    "badge.fuzzy": "模糊匹配",
    "badge.miss": "未匹配",
    "badge.poolFp": "第一方模型",
    "badge.poolApi": "API",
    "badge.poolUnknown": "未知",

    "meta.billable": "计费事件 {n}",
    "meta.excluded": "已排除 {n}",
    "meta.exactRate": "精确匹配率 {pct}",
    "meta.unmatched": "未匹配 {n}",
    "meta.range": "{start} 至 {end} · 本地时区",
    "meta.noDate": "无日期",

    "insight.none": "暂无计费数据",
    "insight.poolApi": "API 用量池",
    "insight.poolFp": "第一方模型用量池",
    "insight.poolShare": "{pool}占 {pct}",
    "insight.topModel": "主因模型 {name} {pct}",
    "insight.topComposition": "花费主因 {label} {pct}",
    "insight.peakDay": "峰值日 {date} {cost}",
    "insight.totalCost": "估算总花费 {cost}",
    "insight.fuzzy": "模糊匹配 {n} 条 · 花费 {cost}",
    "insight.unmatched": "未匹配 {n} 条",

    "usageInsight.mismatch": "常用 {eventsModel}，Token 消耗主因 {tokensModel}",
    "usageInsight.costTokenMismatch": "花费主因 {costModel} {costPct} · Token 主因 {tokensModel} {tokensPct}",
    "usageInsight.topCost": "花费主因 {name} {pct}",
    "usageInsight.topTokens": "Token 主因 {name} {pct}",
    "usageInsight.topStructure": "结构主因 {label} {pct}",
    "usageInsight.peakDay": "峰值日 {date} {tokens}",
    "usageInsight.total": "总 Token {tokens}",

    "tip.dayCost": "当日 {cost} · 第一方 {fp} · API {api}",
    "tip.cumCost": "累计至当日 {value}（占区间 {pct}）",
    "tip.dayEvents": "当日 {n} 事件",
    "tip.cumEvents": "累计至当日 {n} 事件（占区间 {pct}）",
    "tip.dayTokens": "当日 {n} tokens",
    "tip.cumTokens": "累计至当日 {n} tokens（占区间 {pct}）",
    "tip.shortRange": "区间过短，趋势参考有限",
    "tip.fuzzyMatch": "由 CSV「{csv}」模糊匹配到「{price}」",
    "tip.fuzzyMatchMulti": "由 CSV「{csv}」模糊匹配到「{price}」",
    "tip.fuzzyMatchMore": "由 CSV「{csv}」等 {n} 种模糊匹配到「{price}」",

    "bento.pools": "两个用量池",
    "bento.poolsNote": "额度互不共用",
    "bento.anatomy": "钱花在哪种 Token",
    "bento.hit": "缓存命中率",
    "bento.trend": "花费走势",
    "bento.daily": "按日",
    "bento.cumulative": "累计",
    "bento.metric.cost": "花费",
    "bento.metric.tokens": "Token",
    "bento.metric.events": "次数",
    "bento.tab.models": "模型",
    "bento.tab.audit": "计费明细",
    "bento.tab.unmatched": "未匹配",
    "bento.fp": "第一方池",
    "bento.api": "API 池",
    "bento.fpHint": "Composer · Auto · Grok",
    "bento.apiHint": "Claude · Gemini",
    "bento.clear": "返回全局",
    "bento.inspect": "点击任意模型或日期柱查看明细",
    "bento.days": "{n} 天",
    "bento.calls": "{n} 次",
    "bento.empty": "这个范围里没有用量。换一段日期，或选全部。",
    "bento.peak": "峰值日 {date} · {cost}",
    "bento.dayChip": "{date} · {cost}",
    "bento.verdict.mismatch": "{tokenName} 跑了 {tokenPct} 的 Token，但 {costName} 仅 {calls} 次就吃掉 {costPct} 花费。",
    "bento.verdict.lead": "{pool}占 {poolPct}；{name} 居首（{pct}），峰值在 {date}。",
    "bento.preset.d7": "近 7 天",
    "bento.preset.d30": "近 30 天",
    "bento.preset.month": "本月",
    "bento.preset.all": "全部",
    "bento.preset.d90": "近 90 天",
    "bento.auditNote": "单位 $/1M tokens · 分项之和等于该模型估算花费",
    "bento.unmatchedNote": "这些 CSV 模型未在公开价表中找到，计入事件，花费记为 $0。",
    "bento.max": "Max {pct}",
    "entry.kicker1": "01 · 选区间导出",
    "entry.title1": "选好区间，直接从 Cursor 下载 CSV",
    "entry.sub1": "下载链接已按你选的日期自动拼好 UTC 时间范围",
    "entry.download": "下载这段时间的 CSV",
    "entry.login": "还没登录 Cursor？去官网用量页手动导出",
    "entry.kicker2": "02 · 拖入即算",
    "entry.title2": "把 CSV 拖进来，本地秒算",
    "entry.sub2": "纯浏览器计算，文件不会离开你的电脑",
    "entry.drop": "拖拽 usage-events.csv 到这里，或点击选择文件",
    "entry.back": "返回分析",
    "range.pick": "先点开始日期，再点结束日期",
    "range.end": "再点结束日期",
    "range.days": "{n} 天",
    "range.prev": "上个月",
    "range.next": "下个月",

    "error.noRows": "CSV 没有数据行。请确认是 Cursor usage-events 导出文件。",
    "error.missingCols": "缺少必要列：{cols}",
    "error.emptyFile": "文件为空，请重新选择。",
    "error.emptyContent": "文件内容为空。",
    "error.parseFailed": "无法解析 CSV，请确认是 Cursor usage-events 导出文件。",
    "error.readFailed": "读取文件失败，请重试。"
  },
  en: {
    "doc.title": "Cursor Usage Cost Estimator",
    "app.title": "Cursor Usage Cost Estimator",
    "app.subtitle": "Parse usage-events CSV and estimate theoretical cost from the official price sheet ($/1M tokens).",
    "policy.toggle": "Billing notes",
    "policy.body": "Usage is split into First-Party and API pools with separate allowances. This page provides price-sheet estimates, not an official invoice. Team plans may incur an additional Cursor Token fee for third-party models ($0.25/1M tokens), which is not included here. Price sources:",
    "policy.linkPricing": "Models & Pricing",
    "policy.asOf": "(as of 2026-10-27)",
    "action.replaceCsv": "Replace CSV",
    "action.downloadCsv": "Download last 30 days CSV",
    "action.parsing": "Parsing…",
    "action.exportReport": "Export image report",
    "action.exporting": "Exporting…",
    "export.error.failed": "Failed to export the image. Please try again.",
    "export.error.tooLarge": "The report is too long to render. Try a shorter date range.",
    "export.footer.title": "Cursor Usage Cost Estimator",
    "export.footer.disclaimer": "Price-sheet estimate, not an official invoice",
    "export.footer.linkLabel": "github.com/creekmoon/cursor-usage-analysis",
    "upload.aria": "Upload CSV",
    "upload.title": "Drop the CSV into this box",
    "upload.hint": "After it downloads, drop it here or click this box",
    "upload.guideToggle": "Not signed in? Click to sign in to Cursor",
    "upload.step1": "Open",
    "upload.step2.before": "Set the range to",
    "upload.step3.before": "Click",
    "upload.step3.after": ", then drop the file here",
    "lang.aria": "Language",
    "lang.zh": "中文",
    "lang.en": "English",

    "metric.total": "Estimated total cost",
    "metric.poolFp": "First-party pool",
    "metric.poolFpHint": "Auto / Composer / Grok",
    "metric.poolApi": "API pool",
    "metric.poolApiHint": "Billed at each model’s API rates",
    "metric.dailyAvg": "Avg. daily cost",
    "metric.eventAvg": "Avg. cost / event",
    "metric.cacheShare": "Cache-read cost share",
    "metric.cacheShareHint": "Cache-read cost / estimated total",
    "metric.maxShare": "Max Mode cost share",
    "metric.maxShareHint": "Estimated cost of Max Mode events",

    "usage.heading": "Model usage & cost",
    "usage.note": "Cost and tokens for the same models, side by side",
    "usage.chartCompare": "Model comparison",
    "usage.chartMix": "Token type mix",
    "usage.empty": "No billable usage",
    "usage.noData": "No model usage data",
    "usage.anchor.total": "Total tokens {tokens}",
    "usage.anchor.avg": "Avg. / event {tokens}",
    "usage.anchor.cache": "Cache hit {pct}",
    "usage.anchor.unit": "Avg. token price {price} / 1M",
    "usage.compare.note": "Sorted by estimated cost (desc)",
    "usage.compare.col.model": "Priced model",
    "usage.compare.col.cost": "Cost share",
    "usage.compare.col.token": "Token share",
    "usage.compare.col.side": "Events · Avg. · Pool",
    "usage.compare.costTitle": "Cost {cost} · {pct}",
    "usage.compare.tokenTitle": "Tokens {tokens} · {pct}",
    "usage.pool.fp": "First-party",
    "usage.pool.api": "API",
    "usage.pool.unknown": "Unknown",

    "trend.heading": "Cost trend",
    "trend.metric.cost": "Cost",
    "trend.metric.events": "Events",
    "trend.metric.tokens": "Tokens",
    "trend.metric.aria": "Trend metric",
    "trend.legend.fp": "First-party",
    "trend.legend.api": "API",
    "trend.clear": "Clear",
    "trend.cumulative": "Cumulative",
    "trend.daily": "Daily cost",
    "trend.stage.aria": "Cost trend charts",
    "trend.note": "Dates aggregated in local time; hover or click a day for details",
    "trend.empty": "No daily data",
    "trend.aria.cumulative": "Cumulative trend",
    "trend.aria.daily": "Daily trend",

    "composition.heading": "Cost breakdown (by token type)",
    "composition.note": "The four categories sum to estimated total cost",
    "composition.empty": "No breakdown data",
    "composition.noData": "No data",

    "models.heading": "Calculation",
    "models.collapsedHint": "{n} models · audit breakdown",
    "models.note.calc": "Unit: $/1M tokens · line items sum to the model’s estimated cost",
    "models.meta.provider": "Provider {provider}",
    "models.meta.matchPrefix": "Match",
    "models.meta.pool": "Pool {pool}",
    "models.meta.events": "Events {n}",
    "models.meta.tokensPerEvent": "Tokens / event {tokens}",
    "models.empty": "No billable events to summarize",
    "models.th.provider": "Provider",
    "models.th.model": "Priced model",
    "models.th.match": "Match",
    "models.th.pool": "Pool",
    "models.th.events": "Events",
    "models.th.cost": "Est. cost",
    "models.th.costShare": "Cost share",
    "models.th.avgCost": "Avg. / event",
    "models.th.type": "Type",
    "models.th.usage": "Usage",
    "models.th.unitPrice": "Unit $/1M",
    "models.th.partCost": "Line cost",
    "models.th.total": "Total",
    "models.priceSameAsInput": "same as Input",
    "models.footnote.unmatched": "No price sheet · est. $0",
    "models.footnote.auto": "Auto: Input + Cache Write billed at Input rate",
    "models.line.input": "Input",
    "models.line.cacheWrite": "Cache write",
    "models.line.cacheRead": "Cache read",
    "models.line.output": "Output",
    "models.line.inputPlusCw": "Input + cache write",

    "unmatched.heading": "Unmatched models",
    "unmatched.note": "Counted in events; estimated cost recorded as $0",
    "unmatched.th.csvModel": "CSV model",
    "unmatched.th.events": "Events",
    "unmatched.th.input": "Input",
    "unmatched.th.cacheWrite": "Cache write",
    "unmatched.th.cacheRead": "Cache read",
    "unmatched.th.output": "Output",

    "token.input": "Input",
    "token.cacheWrite": "Cache write",
    "token.cacheRead": "Cache read",
    "token.output": "Output",
    "token.other": "Other",
    "token.emptyModel": "(empty model)",

    "badge.exact": "Exact",
    "badge.fuzzy": "Fuzzy",
    "badge.miss": "Unmatched",
    "badge.poolFp": "First-party",
    "badge.poolApi": "API",
    "badge.poolUnknown": "Unknown",

    "meta.billable": "Billable events {n}",
    "meta.excluded": "Excluded {n}",
    "meta.exactRate": "Exact match rate {pct}",
    "meta.unmatched": "Unmatched {n}",
    "meta.range": "{start} – {end} · local time",
    "meta.noDate": "No dates",

    "insight.none": "No billable data",
    "insight.poolApi": "API pool",
    "insight.poolFp": "First-party pool",
    "insight.poolShare": "{pool} accounts for {pct}",
    "insight.topModel": "Top model {name} {pct}",
    "insight.topComposition": "Top cost driver {label} {pct}",
    "insight.peakDay": "Peak day {date} {cost}",
    "insight.totalCost": "Estimated total {cost}",
    "insight.fuzzy": "Fuzzy matches {n} · cost {cost}",
    "insight.unmatched": "Unmatched {n}",

    "usageInsight.mismatch": "Most used: {eventsModel}; token-heavy: {tokensModel}",
    "usageInsight.costTokenMismatch": "Top by cost {costModel} {costPct} · top by tokens {tokensModel} {tokensPct}",
    "usageInsight.topCost": "Top by cost {name} {pct}",
    "usageInsight.topTokens": "Top by tokens {name} {pct}",
    "usageInsight.topStructure": "Top structure {label} {pct}",
    "usageInsight.peakDay": "Peak day {date} {tokens}",
    "usageInsight.total": "Total tokens {tokens}",

    "tip.dayCost": "Day {cost} · First-party {fp} · API {api}",
    "tip.cumCost": "Cumulative {value} ({pct} of range)",
    "tip.dayEvents": "Day {n} events",
    "tip.cumEvents": "Cumulative {n} events ({pct} of range)",
    "tip.dayTokens": "Day {n} tokens",
    "tip.cumTokens": "Cumulative {n} tokens ({pct} of range)",
    "tip.shortRange": "Range too short for a reliable trend",
    "tip.fuzzyMatch": "Fuzzy-matched CSV \"{csv}\" → \"{price}\"",
    "tip.fuzzyMatchMulti": "Fuzzy-matched CSV \"{csv}\" → \"{price}\"",
    "tip.fuzzyMatchMore": "Fuzzy-matched {n} CSV names (e.g. \"{csv}\") → \"{price}\"",

    "bento.pools": "Two pools",
    "bento.poolsNote": "Separate allowances",
    "bento.anatomy": "Spend by token type",
    "bento.hit": "Cache hit rate",
    "bento.trend": "Spend trend",
    "bento.daily": "Daily",
    "bento.cumulative": "Cumulative",
    "bento.metric.cost": "Spend",
    "bento.metric.tokens": "Tokens",
    "bento.metric.events": "Calls",
    "bento.tab.models": "Models",
    "bento.tab.audit": "Breakdown",
    "bento.tab.unmatched": "Unmatched",
    "bento.fp": "First-party",
    "bento.api": "API",
    "bento.fpHint": "Composer · Auto · Grok",
    "bento.apiHint": "Claude · Gemini",
    "bento.clear": "All models",
    "bento.inspect": "Click a model or a day bar to inspect",
    "bento.days": "{n} days",
    "bento.calls": "{n} calls",
    "bento.empty": "No usage in this range. Try another window, or All.",
    "bento.peak": "Peak {date} · {cost}",
    "bento.dayChip": "{date} · {cost}",
    "bento.verdict.mismatch": "{tokenName} drove {tokenPct} of tokens, while {costName} took {costPct} of spend in {calls} calls.",
    "bento.verdict.lead": "{pool} is {poolPct}; {name} leads ({pct}), peaking on {date}.",
    "bento.preset.d7": "7 days",
    "bento.preset.d30": "30 days",
    "bento.preset.month": "This month",
    "bento.preset.all": "All",
    "bento.preset.d90": "90 days",
    "bento.auditNote": "Unit $/1M tokens · line items sum to the model total",
    "bento.unmatchedNote": "These CSV models are missing from the public price table. Counted as events at $0.",
    "bento.max": "Max {pct}",
    "entry.kicker1": "01 · Pick a range",
    "entry.title1": "Choose dates, then download the CSV from Cursor",
    "entry.sub1": "The download link encodes your UTC start and end",
    "entry.download": "Download CSV for this range",
    "entry.login": "Not signed in? Open the Cursor usage page",
    "entry.kicker2": "02 · Drop the file",
    "entry.title2": "Drop the CSV to estimate locally",
    "entry.sub2": "Calculated in the browser. The file never leaves this machine.",
    "entry.drop": "Drop usage-events.csv here, or click to choose a file",
    "entry.back": "Back to analysis",
    "range.pick": "Click a start date, then an end date",
    "range.end": "Now click the end date",
    "range.days": "{n} days",
    "range.prev": "Previous month",
    "range.next": "Next month",

    "error.noRows": "CSV has no data rows. Confirm this is a Cursor usage-events export.",
    "error.missingCols": "Missing required columns: {cols}",
    "error.emptyFile": "The file is empty. Please choose another file.",
    "error.emptyContent": "The file content is empty.",
    "error.parseFailed": "Could not parse the CSV. Confirm this is a Cursor usage-events export.",
    "error.readFailed": "Failed to read the file. Please try again."
  }
};

let locale = "zh";
const listeners = new Set();

function detectLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "zh" || saved === "en") return saved;
  } catch (_) { /* ignore */ }
  const nav = (navigator.language || "").toLowerCase();
  return nav.startsWith("zh") ? "zh" : "en";
}

export function getLocale() {
  return locale;
}

export function t(key, vars) {
  const table = STRINGS[locale] || STRINGS.zh;
  let text = table[key] ?? STRINGS.zh[key] ?? key;
  if (vars) {
    text = text.replace(/\{(\w+)\}/g, (_, name) => (
      vars[name] != null ? String(vars[name]) : ""
    ));
  }
  return text;
}

export function tokenLabel(key) {
  return t("token." + key);
}

export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function applyStaticI18n(root) {
  const scope = root || (typeof document !== "undefined" ? document : null);
  if (!scope || !scope.querySelectorAll) return;
  scope.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    el.textContent = t(key);
  });
  scope.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (!key) return;
    el.innerHTML = t(key);
  });
  scope.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (!key) return;
    el.setAttribute("aria-label", t(key));
  });
  scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (!key) return;
    el.setAttribute("title", t(key));
  });
  if (typeof document !== "undefined") {
    if (document.documentElement) {
      document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    }
    if (document.title !== undefined) {
      document.title = t("doc.title");
    }
    const pricingLink = document.querySelector('a[data-i18n="policy.linkPricing"]');
    if (pricingLink) {
      pricingLink.href = locale === "zh"
        ? "https://cursor.com/cn/docs/models-and-pricing"
        : "https://cursor.com/docs/models-and-pricing";
    }
  }
  syncLangToggle();
}

function syncLangToggle() {
  const group = document.getElementById("langToggle");
  if (!group) return;
  group.querySelectorAll("button[data-lang]").forEach((btn) => {
    const active = btn.getAttribute("data-lang") === locale;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

export function setLocale(next) {
  if (next !== "zh" && next !== "en") return;
  if (next === locale) {
    applyStaticI18n();
    return;
  }
  locale = next;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch (_) { /* ignore */ }
  applyStaticI18n();
  listeners.forEach((fn) => {
    try { fn(locale); } catch (_) { /* ignore */ }
  });
}

export function initI18n() {
  locale = detectLocale();
  applyStaticI18n();
}
