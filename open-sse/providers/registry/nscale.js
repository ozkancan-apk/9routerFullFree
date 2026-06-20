export default {
  id: "nscale",
  priority: 30,
  hasFree: true,
  alias: "nscale",
  display: {
    name: "NScale (Free)",
    icon: "cloud_queue",
    color: "#6366F1",
    textIcon: "NS",
    website: "https://nscale.com",
    notice: {
      text: "Free tier available. Sign up for API key.",
      apiKeyUrl: "https://inference.api.nscale.com",
    },
  },
  category: "freeTier",
  transport: {
    baseUrl: "https://inference.api.nscale.com/v1/chat/completions",
    format: "openai",
    authType: "apikey",
    authHeader: "bearer",
  },
  models: [
    { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Llama 3.3 70B" },
    { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1", supportsReasoning: true },
    { id: "deepseek-ai/DeepSeek-V3", name: "DeepSeek V3" },
    { id: "Qwen/Qwen3-32B", name: "Qwen3 32B" },
  ],
};
