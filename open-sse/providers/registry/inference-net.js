export default {
  id: "inference-net",
  priority: 30,
  hasFree: true,
  alias: "inet",
  display: {
    name: "Inference.net (Free)",
    icon: "dns",
    color: "#059669",
    textIcon: "IN",
    website: "https://inference.net",
    notice: {
      text: "Free tier available. Sign up for API key.",
      apiKeyUrl: "https://inference.net",
    },
  },
  category: "freeTier",
  transport: {
    baseUrl: "https://api.inference.net/v1/chat/completions",
    format: "openai",
    authType: "apikey",
    authHeader: "bearer",
  },
  models: [
    { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Llama 3.3 70B" },
    { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1", supportsReasoning: true },
    { id: "Qwen/Qwen3-32B", name: "Qwen3 32B" },
  ],
};
