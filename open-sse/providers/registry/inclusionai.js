export default {
  id: "inclusionai",
  priority: 30,
  hasFree: true,
  alias: "inclusionai",
  display: {
    name: "Inclusion AI (Free)",
    icon: "workspaces",
    color: "#F59E0B",
    textIcon: "IA",
    website: "https://inclusionai.tech",
    notice: {
      text: "Free tier: 15M tokens/month.",
      apiKeyUrl: "https://inclusionai.tech",
    },
  },
  category: "freeTier",
  transport: {
    baseUrl: "https://api.inclusionai.tech/v1/chat/completions",
    format: "openai",
    authType: "apikey",
    authHeader: "bearer",
  },
  models: [
    { id: "inclusion-model", name: "Inclusion Model" },
  ],
};
