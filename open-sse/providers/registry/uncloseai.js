export default {
  id: "uncloseai",
  priority: 35,
  hasFree: true,
  alias: "uncl",
  uiAlias: "uncl",
  display: {
    name: "UncloseAI (Free)",
    icon: "lock_open",
    color: "#8B5CF6",
    textIcon: "UA",
    website: "https://hermes.ai.unturf.com",
    notice: {
      text: "Free keyless provider. Hermes 3 8B, Qwen3 Coder 27B, Gemma4 31B. No API key needed.",
    },
  },
  category: "free",
  noAuth: true,
  transport: {
    baseUrl: "https://hermes.ai.unturf.com/v1/chat/completions",
    format: "openai",
    noAuth: true,
  },
  models: [
    { id: "adamo1139/Hermes-3-Llama-3.1-8B-FP8-Dynamic", name: "Hermes 3 8B" },
  ],
  modelsFetcher: { url: "https://hermes.ai.unturf.com/v1/models", type: "openai" },
  passthroughModels: true,
};
