export default {
  id: "venice",
  priority: 30,
  hasFree: true,
  alias: "venice",
  display: {
    name: "Venice AI (Free)",
    icon: "palette",
    color: "#E87040",
    textIcon: "VN",
    website: "https://venice.ai",
    notice: {
      text: "Free tier available. Sign up for API key.",
      apiKeyUrl: "https://venice.ai/api-keys",
    },
  },
  category: "freeTier",
  transport: {
    baseUrl: "https://api.venice.ai/api/v1/chat/completions",
    format: "openai",
    authType: "apikey",
    authHeader: "bearer",
  },
  models: [
    { id: "default", name: "Venice Default" },
    { id: "dolphin-llama", name: "Dolphin Llama" },
    { id: "llama-3.1-405b", name: "Llama 3.1 405B" },
    { id: "qwen-2.5-coder-32b", name: "Qwen 2.5 Coder 32B" },
    { id: "deepseek-r1-0528", name: "DeepSeek R1", supportsReasoning: true },
  ],
};
