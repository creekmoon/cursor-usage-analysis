---
description: 核对 Cursor 官网模型价，并更新 js/pricing.js 的单价与长上下文计费
triggers: 核对价格, 更新价表, 更新计算公式, models-and-pricing, pricing.js, 长上下文, Fast
---

# 官网价表核对

改 `js/pricing.js` 的单价或长上下文之前，按本文件重新拉官网。文中的数字是 2026-11-17 那次核对的例子，用来记住坑，不能当成当前价。

价格只来自 Cursor 文档。总表、模型专页、专页里的 HTML 表，三者不一致时以专页 HTML 表为准；专页没有这行时，才采用专页正文里写明的倍率。

## 拉取顺序

1. 读 [总表 Markdown](https://cursor.com/docs/models-and-pricing.md)。它包含默认折叠的模型。页面上直接看到的 HTML 表只有展开前的几行。
2. 读 [llms.txt](https://cursor.com/llms.txt) 里 `models-and-pricing` 下面的模型专页链接。
3. 总表备注里出现 Fast、long context、higher rates、introductory、promotional，而总表没有单独一行时，打开对应专页的 **HTML**（`https://cursor.com/docs/models/<slug>`），抽出 `<table>` 的每一行。专页的 `.md` 和转成 Markdown 的抓取会丢掉价表，只留下 “rates below” 这种空话。
4. 专页 slug 不在 llms.txt 里时，用备注中的模型 id 拼 URL，例如 `gpt-5.5` → `/docs/models/gpt-5-5`。页面不存在就停在总表，并在注释里写明缺的是哪一档。

HTML 里的价格常被拆成 `$<!-- -->12.5`。解析时去掉标签再读数字。

## 对照再改

逐行对照现有 `PRICING_TABLE`。只改官网变了的行，只补官网有而表里没有的模型。不要把一组不规则的公布价收成一个统一倍率。

2026-11-17 的反例：总表写 GPT-5.5 “Fast mode is available at higher rates”，若按其他 GPT 习惯收成 2 倍，会错。专页表是 $12.5 / - / $1.25 / $75，即标准价的 2.5 倍。

## 写入价表

- 单位是美元 / 百万 token，四列：`input`、`cacheWrite`、`cacheRead`、`output`。
- 官网 Cache write 为 `-` 时，`cacheWrite` 写 `null`。`calcCostParts` 会按输入价计。这表示没有单独的写入加价，那些 token 仍要收费。不要写成 0。
- 第三方模型 `pool: "api"`。Grok 与 Composer 2.5 是 `pool: "firstParty"`。
- `aliases` 写 CSV 里的 slug，点号和连字符各留一条，如 `claude-fable-5.2` 与 `claude-fable-5-2`。思考档（high、xhigh、max 等）靠 `js/match.js` 剥掉，不要为每个档位加一行。`fast` 是价档，要有自己的行和 alias，精确匹配会先命中它。
- 促销价用官网当前列出的数字，注释写截止日期。不要在代码里按日期自动切换。2026-11-17 的例子：GPT-5.6 Sol 促销到 2026-11-21；Gemini 4 Carbon 引入价到 2026-11-30，之后是输入 $4、缓存读取 $0.20、输出 $20。

## 长上下文

门槛在 `applyLongContext`：输入长度 `<= above` 仍用原行，超过才换成 `to` 那一行。输入长度 = 未缓存输入 + 缓存写入 + 缓存读取。输出不改变档位。官网 “input length only / exceeds N” 指的是这条门槛；缓存读取算进输入长度，因为上下文窗口包含已缓存 token。

长上下文写成价表里的另一行，由原行的 `longContext: { above, to }` 指向它。目标行必须在 `PRICING_TABLE` 里，且自己不能再带 `longContext`。

```js
{ name: "GPT-5.6 Sol", input: 4, cacheWrite: 5, cacheRead: 0.4, output: 20, longContext: { above: 272000, to: "GPT-5.6 Sol (>272k)" } },
{ name: "GPT-5.6 Sol (>272k)", input: 8, cacheWrite: 10, cacheRead: 0.8, output: 30 }
```

倍率以专页表为准，各列可以不同：

- GPT-5.6：输入、缓存写入、缓存读取 2 倍，输出 1.5 倍。Fast 也有单独的长上下文行，倍率乘在 Fast 价上。
- GPT-5.4、GPT-5.5：标准档同样是输入侧 2 倍、输出 1.5 倍。专页没有 “Fast + 长上下文” 行，Fast 超过门槛时保持 Fast 价，不要自己乘出来。
- Grok 4.7：标准档长上下文是标准价的 2 倍（输出也 2 倍）。Fast 的 500k 行是标准价的 3 倍，不是 Fast 价的 2 倍。
- Haiku 5.5：输入长度超过 100k 时四列都是 5 倍。

刚好等于门槛（272000、256000、100000）留在原档。

## 不要补进公式的费用

CSV 区分不了这些条件，沿用现有估算范围：

- 团队方案的 Cursor Token Rate（$0.25 / 百万 token），个人方案不收。
- 旧请求制方案的 Max Mode +20%。当前按 token 计费的方案不加这笔。
- 区域或美国节点大约 +10%。
- 图像输出的另一套单价（如 Gemini 图像输出）。CSV 的 Output Tokens 不区分文本和图像。

## 价表里消失的模型

官网删掉的模型先留着，供旧 CSV 继续计价，并在回复里说明。2026-11-17 仍保留 Composer 1，以及 Auto 的 $1.25 / $0.25 / $6。Auto 已不在价表上：Cost 模式按实际路由到的模型计费，CSV 若只写 Auto，没有可替换的单价。不要把这些行改成 0，也不要新编一个 Auto 单价。

## 改完要跑的检查

用一次 node 脚本 import `js/pricing.js`、`js/match.js`、`js/aggregate.js`，跑完即删，不提交：

- 显示名不重复；每个 `longContext.to` 都能找到目标行。
- slug 能匹配到预期行，带 `-high` 的名字仍落到同一价档。
- 输入长度刚好等于 `above` 时留在原行；多 1 token 时换到长上下文行。
- 未缓存输入低于门槛，但加上缓存写入和缓存读取后超过门槛，要换档。只有输出超过门槛时不换档。
- 四列各 100 万 token 的费用 = 输入价 +（缓存写入价，`null` 时用输入价）+ 缓存读取价 + 输出价。
