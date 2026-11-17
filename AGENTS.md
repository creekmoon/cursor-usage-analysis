# AGENTS.md

本仓是本地的 Cursor 用量花费估算器。单价在 `js/pricing.js`，模型名匹配在 `js/match.js`，花费计算在 `js/aggregate.js`。

## 任务开始前

列出 `rules/` 下的规则文件，按文件名和文首 `description` / `triggers` 对照当前任务。对上了就先读完那份规则，再改代码。

核对官网价格、更新价表或计算公式时，先读 `rules/官网价表核对_rule.md`。

## 规则文件清单

- `rules/官网价表核对_rule.md`：从 Cursor 官网总表和模型专页核对单价、Fast 与长上下文，再改 `js/pricing.js`。规则里的示例数字会过期，当前价以重新拉到的官网为准。
