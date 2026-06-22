export default {
  id: "api-airforce",
  priority: 30,
  hasFree: true,
  alias: "af",
  display: {
    name: "API Airforce (Free)",
    icon: "bolt",
    color: "#FF6B35",
    textIcon: "AF",
    website: "https://api.airforce",
    notice: {
      text: "Free tier: 24M tokens/month. Grok, Claude, Gemini, DeepSeek models available.",
      apiKeyUrl: "https://api.airforce",
    },
  },
  category: "freeTier",
  transport: {
    baseUrl: "https://api.airforce/v1/chat/completions",
    format: "openai",
    authType: "apikey",
    authHeader: "bearer",
    headers: {
      "HTTP-Referer": "https://endpoint-proxy.local",
      "X-Title": "Endpoint Proxy",
    },
  },
  models: [
    { id: "gpt-4o-mini", name: "GPT-4o Mini (Free)", contextLength: 128000 },
    { id: "deepseek-v3.2-free", name: "DeepSeek V3.2 (Free)", contextLength: 262144 },
  ],
};
