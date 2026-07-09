export const PRICING_TABLE = [
  { provider: "Anthropic", name: "Claude 4 Sonnet", input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude 4 Sonnet 1M", input: 6, cacheWrite: 7.5, cacheRead: 0.6, output: 22.5, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude 4.5 Haiku", input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude 4.5 Opus", input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude 4.5 Sonnet", input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude 4.6 Opus", input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude 4.6 Sonnet", input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude 4.7 Opus", input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude Fable 5", input: 10, cacheWrite: 12.5, cacheRead: 1, output: 50, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude Opus 4.7 (fast mode)", input: 30, cacheWrite: 37.5, cacheRead: 3, output: 150, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude Opus 4.8", input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude Sonnet 5", input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15, isAuto: false, pool: "api" },
  { provider: "Cursor", name: "Composer 1", input: 1.25, cacheWrite: null, cacheRead: 0.125, output: 10, isAuto: false, pool: "firstParty" },
  { provider: "Cursor", name: "Composer 2.5", input: 0.5, cacheWrite: null, cacheRead: 0.2, output: 2.5, isAuto: false, pool: "firstParty" },
  { provider: "Cursor", name: "Composer 2.5 Fast", input: 3, cacheWrite: null, cacheRead: 0.5, output: 15, isAuto: false, pool: "firstParty", aliases: ["composer-2.5-fast", "Composer 2.5 (Fast)"] },
  { provider: "Google", name: "Gemini 2.5 Flash", input: 0.3, cacheWrite: null, cacheRead: 0.03, output: 2.5, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3 Flash", input: 0.5, cacheWrite: null, cacheRead: 0.05, output: 3, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3 Pro", input: 2, cacheWrite: null, cacheRead: 0.2, output: 12, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3 Pro Image Preview", input: 2, cacheWrite: null, cacheRead: 0.2, output: 12, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3.1 Pro", input: 2, cacheWrite: null, cacheRead: 0.2, output: 12, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3.5 Flash", input: 1.5, cacheWrite: null, cacheRead: 0.15, output: 9, isAuto: false, pool: "api" },
  { provider: "Z.ai", name: "GLM 5.2", input: 1.4, cacheWrite: null, cacheRead: 0.26, output: 4.4, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5", input: 1.25, cacheWrite: null, cacheRead: 0.125, output: 10, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5 Fast", input: 2.5, cacheWrite: null, cacheRead: 0.25, output: 20, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5 Mini", input: 0.25, cacheWrite: null, cacheRead: 0.025, output: 2, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5-Codex", input: 1.25, cacheWrite: null, cacheRead: 0.125, output: 10, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.1 Codex", input: 1.25, cacheWrite: null, cacheRead: 0.125, output: 10, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.1 Codex Max", input: 1.25, cacheWrite: null, cacheRead: 0.125, output: 10, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.1 Codex Mini", input: 0.25, cacheWrite: null, cacheRead: 0.025, output: 2, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.2", input: 1.75, cacheWrite: null, cacheRead: 0.175, output: 14, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.2 Codex", input: 1.75, cacheWrite: null, cacheRead: 0.175, output: 14, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.3 Codex", input: 1.75, cacheWrite: null, cacheRead: 0.175, output: 14, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.4", input: 2.5, cacheWrite: null, cacheRead: 0.25, output: 15, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.4 Mini", input: 0.75, cacheWrite: null, cacheRead: 0.075, output: 4.5, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.4 Nano", input: 0.2, cacheWrite: null, cacheRead: 0.02, output: 1.25, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.5", input: 5, cacheWrite: null, cacheRead: 0.5, output: 30, isAuto: false, pool: "api" },
  { provider: "Cursor", name: "Grok 4.5", input: 2, cacheWrite: null, cacheRead: 0.5, output: 6, isAuto: false, pool: "firstParty" },
  { provider: "Cursor", name: "Grok 4.5 Fast", input: 4, cacheWrite: null, cacheRead: 1, output: 18, isAuto: false, pool: "firstParty", aliases: ["grok-4.5-fast", "Grok 4.5 (Fast)"] },
  { provider: "Moonshot", name: "Kimi K2.7 Code", input: 0.95, cacheWrite: null, cacheRead: 0.19, output: 4, isAuto: false, pool: "api" },
  { provider: "Cursor", name: "Auto", input: 1.25, cacheWrite: null, cacheRead: 0.25, output: 6, isAuto: true, pool: "firstParty" }
];

export const EFFORT_SUFFIXES = ["xhigh", "high", "medium", "low", "max", "thinking"];
// fast 是价档（如 Composer/Grok Fast），不是思考档位；匹配时单独处理
export const THINK_SUFFIXES = [...EFFORT_SUFFIXES, "fast"];

export const REQUIRED_COLUMNS = [
  "Model",
  "Kind",
  "Input (w/ Cache Write)",
  "Input (w/o Cache Write)",
  "Cache Read",
  "Output Tokens"
];

export const COMPOSITION_META = [
  { key: "input", tone: "" },
  { key: "cacheWrite", tone: "t2" },
  { key: "cacheRead", tone: "t3" },
  { key: "output", tone: "t4" }
];
