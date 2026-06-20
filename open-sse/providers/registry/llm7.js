export default {
  id: "llm7",
  priority: 30,
  hasFree: true,
  alias: "llm7",
  display: {
    name: "LLM7 (Free)",
    icon: "auto_awesome",
    color: "#10B981",
    textIcon: "L7",
    website: "https://llm7.io",
    notice: {
      text: "Free tier: 4.3M tokens/month. GPT-4o-mini, DeepSeek, Qwen models.",
      apiKeyUrl: "https://llm7.io",
    },
  },
  category: "freeTier",
  transport: {
    baseUrl: "https://api.llm7.io/v1/chat/completions",
    format: "openai",
    authType: "apikey",
    authHeader: "bearer",
  },
  models: [
    { id: "gpt-4o-mini-2024-07-18", name: "GPT-4o mini (LLM7)" },
    { id: "gpt-4.1-nano-2025-04-14", name: "GPT-4.1 nano (LLM7)" },
    { id: "deepseek-r1-0528", name: "DeepSeek R1 (LLM7)", supportsReasoning: true },
    { id: "qwen2.5-coder-32b-instruct", name: "Qwen2.5 Coder 32B (LLM7)" },
  ],
};
