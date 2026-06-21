export default {
  id: "freeaiapikey",
  priority: 30,
  hasFree: true,
  alias: "faik",
  display: {
    name: "FreeAIAPIKey (Free)",
    icon: "vpn_key",
    color: "#10B981",
    textIcon: "FK",
    website: "https://freeaiapikey.com",
    notice: {
      text: "Free API key provider. GPT-5, Claude Opus/Sonnet, Qwen models. Get key at freeaiapikey.com.",
      apiKeyUrl: "https://freeaiapikey.com",
    },
  },
  category: "freeTier",
  transport: {
    baseUrl: "https://freeaiapikey.com/v1/chat/completions",
    format: "openai",
    authType: "apikey",
    authHeader: "bearer",
  },
  models: [
    { id: "openai/gpt-5", name: "GPT-5", contextLength: 400000 },
    { id: "openai/gpt-4o", name: "GPT-4o" },
    { id: "openai/gpt-5.2-codex", name: "GPT-5.2 Codex" },
    { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6", contextLength: 1000000 },
    { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", contextLength: 1000000 },
    { id: "Alibaba/qwen3.5", name: "Qwen 3.5", contextLength: 128000 },
    { id: "Alibaba/qwen3-vl:235b", name: "Qwen 3 VL 235B", contextLength: 128000 },
  ],
};
