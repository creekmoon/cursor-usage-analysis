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
  // Notes: cache read is $0.25/M, 75% below Fable 5
  { provider: "Anthropic", name: "Claude Fable 5.1", input: 10, cacheWrite: 12.5, cacheRead: 0.25, output: 50, isAuto: false, pool: "api", aliases: ["claude-fable-5.1", "claude-fable-5-1"] },
  // Notes: prompt above 100k tokens bills at 5x. Prompt = uncached input + cache write + cache read.
  { provider: "Anthropic", name: "Claude Haiku 5.5", input: 0.1, cacheWrite: 0.125, cacheRead: 0.01, output: 0.5, isAuto: false, pool: "api", aliases: ["claude-haiku-5.5", "claude-haiku-5-5"], longContext: { above: 100000, to: "Claude Haiku 5.5 (>100k)" } },
  { provider: "Anthropic", name: "Claude Haiku 5.5 (>100k)", input: 0.5, cacheWrite: 0.625, cacheRead: 0.05, output: 2.5, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude Opus 4.7 (fast mode)", input: 30, cacheWrite: 37.5, cacheRead: 3, output: 150, isAuto: false, pool: "api", aliases: ["claude-opus-4-7-fast", "claude-opus-4.7-fast"] },
  { provider: "Anthropic", name: "Claude Opus 4.8", input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25, isAuto: false, pool: "api" },
  // Notes: Fast mode is 3x lower per-token than Opus 4.7 fast mode
  { provider: "Anthropic", name: "Claude Opus 4.8 Fast", input: 10, cacheWrite: 12.5, cacheRead: 1, output: 50, isAuto: false, pool: "api", aliases: ["claude-opus-4-8-fast", "claude-opus-4.8-fast"] },
  { provider: "Anthropic", name: "Claude Opus 5", input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25, isAuto: false, pool: "api" },
  { provider: "Anthropic", name: "Claude Opus 5 Fast", input: 10, cacheWrite: 12.5, cacheRead: 1, output: 50, isAuto: false, pool: "api", aliases: ["claude-opus-5-fast"] },
  { provider: "Anthropic", name: "Claude Opus 5.5", input: 4, cacheWrite: 5, cacheRead: 0.2, output: 20, isAuto: false, pool: "api", aliases: ["claude-opus-5.5", "claude-opus-5-5"] },
  // Notes: Fast mode is $8/M input and $40/M output; cache write stays 1.25x input, cache read stays 0.05x input
  { provider: "Anthropic", name: "Claude Opus 5.5 Fast", input: 8, cacheWrite: 10, cacheRead: 0.4, output: 40, isAuto: false, pool: "api", aliases: ["claude-opus-5-5-fast", "claude-opus-5.5-fast"] },
  { provider: "Anthropic", name: "Claude Sonnet 5", input: 2, cacheWrite: 2.5, cacheRead: 0.2, output: 10, isAuto: false, pool: "api" },
  // Notes: same input/output as Sonnet 5; cache read is $0.10/M
  { provider: "Anthropic", name: "Claude Sonnet 5.5", input: 2, cacheWrite: 2.5, cacheRead: 0.1, output: 10, isAuto: false, pool: "api", aliases: ["claude-sonnet-5.5", "claude-sonnet-5-5"] },
  { provider: "Cursor", name: "Composer 1", input: 1.25, cacheWrite: null, cacheRead: 0.125, output: 10, isAuto: false, pool: "api" },
  { provider: "Cursor", name: "Composer 2.5", input: 0.5, cacheWrite: null, cacheRead: 0.2, output: 2.5, isAuto: false, pool: "firstParty" },
  { provider: "Cursor", name: "Composer 2.5 Fast", input: 3, cacheWrite: null, cacheRead: 0.5, output: 15, isAuto: false, pool: "firstParty", aliases: ["composer-2.5-fast", "Composer 2.5 (Fast)"] },
  { provider: "DeepSeek", name: "DeepSeek V4.1 Flash 1017", input: 0.3, cacheWrite: null, cacheRead: 0.006, output: 1.2, isAuto: false, pool: "api", aliases: ["deepseek-v4.1-flash-1017", "deepseek-v4-1-flash-1017", "deepseek-v4.1-flash", "deepseek-v4-1-flash"] },
  { provider: "Google", name: "Gemini 2.5 Flash", input: 0.3, cacheWrite: null, cacheRead: 0.03, output: 2.5, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3 Flash", input: 0.5, cacheWrite: null, cacheRead: 0.05, output: 3, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3 Pro", input: 2, cacheWrite: null, cacheRead: 0.2, output: 12, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3 Pro Image Preview", input: 2, cacheWrite: null, cacheRead: 0.2, output: 12, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3.1 Pro", input: 2, cacheWrite: null, cacheRead: 0.2, output: 12, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3.5 Flash", input: 1.5, cacheWrite: null, cacheRead: 0.15, output: 9, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3.5 Flash Lite", input: 0.3, cacheWrite: null, cacheRead: 0.03, output: 2.5, isAuto: false, pool: "api", aliases: ["gemini-3.5-flash-lite", "gemini-3-5-flash-lite"] },
  { provider: "Google", name: "Gemini 3.6 Flash", input: 1.5, cacheWrite: null, cacheRead: 0.15, output: 7.5, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3.7 Flash", input: 0.75, cacheWrite: null, cacheRead: 0.075, output: 3.75, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 3.8 Flash", input: 0.75, cacheWrite: null, cacheRead: 0.075, output: 3.75, isAuto: false, pool: "api" },
  { provider: "Google", name: "Gemini 4 Argon", input: 2, cacheWrite: null, cacheRead: 0.1, output: 10, isAuto: false, pool: "api", aliases: ["gemini-4-argon"] },
  { provider: "Z.ai", name: "GLM 5.2", input: 1.4, cacheWrite: null, cacheRead: 0.26, output: 4.4, isAuto: false, pool: "api" },
  { provider: "Z.ai", name: "GLM 5.3", input: 1.4, cacheWrite: null, cacheRead: 0.26, output: 4.4, isAuto: false, pool: "api", aliases: ["glm-5.3", "glm-5p3", "glm-5-3"] },
  { provider: "Z.ai", name: "GLM 5.3 Flash", input: 0.15, cacheWrite: null, cacheRead: 0.029, output: 0.5, isAuto: false, pool: "api", aliases: ["glm-5.3-flash", "glm-5p3-flash", "glm-5-3-flash"] },
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
  // Notes: Fast mode is 2x pricing
  { provider: "OpenAI", name: "GPT-5.4 Fast", input: 5, cacheWrite: null, cacheRead: 0.5, output: 30, isAuto: false, pool: "api", aliases: ["gpt-5.4-fast", "gpt-5-4-fast"] },
  { provider: "OpenAI", name: "GPT-5.4 Mini", input: 0.75, cacheWrite: null, cacheRead: 0.075, output: 4.5, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.4 Nano", input: 0.2, cacheWrite: null, cacheRead: 0.02, output: 1.25, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.5", input: 5, cacheWrite: null, cacheRead: 0.5, output: 30, isAuto: false, pool: "api" },
  { provider: "OpenAI", name: "GPT-5.5 Fast", input: 10, cacheWrite: null, cacheRead: 1, output: 60, isAuto: false, pool: "api", aliases: ["gpt-5.5-fast", "gpt-5-5-fast"] },
  { provider: "OpenAI", name: "GPT-5.6 Luna", input: 0.2, cacheWrite: 0.25, cacheRead: 0.02, output: 1.2, isAuto: false, pool: "api", aliases: ["gpt-5.6-luna", "gpt-5-6-luna"] },
  // Notes: Fast mode is 2x pricing
  { provider: "OpenAI", name: "GPT-5.6 Luna Fast", input: 0.4, cacheWrite: 0.5, cacheRead: 0.04, output: 2.4, isAuto: false, pool: "api", aliases: ["gpt-5.6-luna-fast", "gpt-5-6-luna-fast"] },
  // Notes: promotional pricing through November 21, 2026; Fast mode is 2x
  { provider: "OpenAI", name: "GPT-5.6 Sol", input: 4, cacheWrite: 5, cacheRead: 0.4, output: 20, isAuto: false, pool: "api", aliases: ["gpt-5.6-sol", "gpt-5-6-sol"] },
  { provider: "OpenAI", name: "GPT-5.6 Sol Fast", input: 8, cacheWrite: 10, cacheRead: 0.8, output: 40, isAuto: false, pool: "api", aliases: ["gpt-5.6-sol-fast", "gpt-5-6-sol-fast"] },
  { provider: "OpenAI", name: "GPT-5.6 Terra", input: 2, cacheWrite: 2.5, cacheRead: 0.2, output: 12, isAuto: false, pool: "api", aliases: ["gpt-5.6-terra", "gpt-5-6-terra"] },
  { provider: "OpenAI", name: "GPT-5.6 Terra Fast", input: 4, cacheWrite: 5, cacheRead: 0.4, output: 24, isAuto: false, pool: "api", aliases: ["gpt-5.6-terra-fast", "gpt-5-6-terra-fast"] },
  // Notes: prompt above 256k uses the 500k rows (2x standard, Fast at 3x standard). Prompt = uncached input + cache write + cache read.
  { provider: "Cursor", name: "Grok 4.7", input: 2, cacheWrite: null, cacheRead: 0.5, output: 6, isAuto: false, pool: "firstParty", aliases: ["grok-4.7", "grok-4-7"], longContext: { above: 256000, to: "Grok 4.7 500k" } },
  { provider: "Cursor", name: "Grok 4.7 Fast", input: 4, cacheWrite: null, cacheRead: 1, output: 12, isAuto: false, pool: "firstParty", aliases: ["grok-4.7-fast", "grok-4-7-fast", "Grok 4.7 (Fast)"], longContext: { above: 256000, to: "Grok 4.7 500k Fast" } },
  { provider: "Cursor", name: "Grok 4.7 500k", input: 4, cacheWrite: null, cacheRead: 1, output: 12, isAuto: false, pool: "firstParty", aliases: ["grok-4.7-500k", "grok-4-7-500k"] },
  { provider: "Cursor", name: "Grok 4.7 500k Fast", input: 6, cacheWrite: null, cacheRead: 1.5, output: 18, isAuto: false, pool: "firstParty", aliases: ["grok-4.7-500k-fast", "grok-4-7-500k-fast", "Grok 4.7 500k (Fast)"] },
  { provider: "Cursor", name: "Grok 4.6", input: 2, cacheWrite: null, cacheRead: 0.5, output: 6, isAuto: false, pool: "firstParty" },
  { provider: "Cursor", name: "Grok 4.6 Fast", input: 4, cacheWrite: null, cacheRead: 1, output: 12, isAuto: false, pool: "firstParty", aliases: ["grok-4.6-fast", "Grok 4.6 (Fast)"] },
  { provider: "Cursor", name: "Grok 4.5", input: 2, cacheWrite: null, cacheRead: 0.5, output: 6, isAuto: false, pool: "firstParty" },
  { provider: "Cursor", name: "Grok 4.5 Fast", input: 4, cacheWrite: null, cacheRead: 1, output: 18, isAuto: false, pool: "firstParty", aliases: ["grok-4.5-fast", "Grok 4.5 (Fast)"] },
  { provider: "Moonshot", name: "Kimi K2.7 Code", input: 0.95, cacheWrite: null, cacheRead: 0.19, output: 4, isAuto: false, pool: "api" },
  { provider: "Moonshot", name: "Kimi K3", input: 3, cacheWrite: null, cacheRead: 0.3, output: 15, isAuto: false, pool: "api" },
  { provider: "Meta", name: "Muse Spark 1.3", input: 1.25, cacheWrite: null, cacheRead: 0.15, output: 4.25, isAuto: false, pool: "api", aliases: ["muse-spark-1.3", "muse-spark-1-3"] },
  { provider: "Meta", name: "Muse Wonder", input: 4, cacheWrite: null, cacheRead: 0.2, output: 20, isAuto: false, pool: "api", aliases: ["muse-wonder", "muse-wonder-1.0", "muse-wonder-1"] },
  { provider: "Cursor", name: "Auto", input: 1.25, cacheWrite: null, cacheRead: 0.25, output: 6, isAuto: true, pool: "firstParty" }
];

const ENTRY_BY_NAME = new Map(PRICING_TABLE.map((entry) => [entry.name, entry]));

export function applyLongContext(entry, tokens) {
  const rule = entry && entry.longContext;
  if (!rule) return entry;
  const prompt = tokens.input + tokens.cacheWrite + tokens.cacheRead;
  if (prompt <= rule.above) return entry;
  return ENTRY_BY_NAME.get(rule.to) || entry;
}

export const EFFORT_SUFFIXES = ["xhigh", "high", "medium", "low", "max", "thinking", "minimal"];
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
