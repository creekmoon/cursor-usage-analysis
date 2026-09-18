/**
 * 按 Cursor Usage 页 30d 口径拼接 usage-events CSV 导出地址
 * 用传入时刻的 UTC 年/月/日，含当天共 30 天，strategy 固定 tokens
 *
 * @param now 用于取 UTC 日历日的时刻
 * @return 完整导出 URL
 */
export function buildExportUsageEventsCsvUrl(now) {
  /* Cursor 30d 含当天共 30 个 UTC 日历日，起点是当天减 29 日的 00:00:00.000Z */
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const startDate = Date.UTC(y, m, d - 29, 0, 0, 0, 0);
  const endDate = Date.UTC(y, m, d, 23, 59, 59, 999);

  /* 拼 Cursor 导出地址 */
  const url = new URL("https://cursor.com/api/dashboard/export-usage-events-csv");
  url.searchParams.set("startDate", String(startDate));
  url.searchParams.set("endDate", String(endDate));
  url.searchParams.set("strategy", "tokens");
  return url.toString();
}
