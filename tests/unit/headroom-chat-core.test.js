import { describe, it, expect, vi, beforeEach } from "vitest";

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
}));

vi.mock("../../open-sse/executors/index.js", () => ({
  getExecutor: () => ({
    noAuth: true,
    execute: executeMock,
  }),
}));

vi.mock("../../open-sse/utils/requestLogger.js", () => ({
  createRequestLogger: async () => ({
    logClientRawRequest: vi.fn(),
    logRawRequest: vi.fn(),
    logTargetRequest: vi.fn(),
    logProviderResponse: vi.fn(),
    logConvertedResponse: vi.fn(),
    logError: vi.fn(),
  }),
}));

vi.mock("../../open-sse/utils/stream.js", () => ({
  COLORS: { red: "", reset: "" },
}));

vi.mock("@/lib/usageDb.js", () => ({
  trackPendingRequest: vi.fn(),
  appendRequestLog: vi.fn(async () => {}),
  saveRequestDetail: vi.fn(async () => {}),
}));

const { handleChatCore } = await import("../../open-sse/handlers/chatCore.js");

describe("handleChatCore Headroom diagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes("/v1/compress")) {
        throw Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:8787"), { code: "ECONNREFUSED" });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    executeMock.mockResolvedValue({
      response: new Response(JSON.stringify({
        id: "chatcmpl-test",
        object: "chat.completion",
        choices: [{ message: { role: "assistant", content: "ok" }, finish_reason: "stop", index: 0 }],
      }), { status: 200, headers: { "content-type": "application/json" } }),
      url: "https://api.openai.com/v1/chat/completions",
      headers: {},
      transformedBody: null,
    });
  });

  it("logs why Headroom was skipped on chat completions", async () => {
    const log = { debug: vi.fn(), info: vi.fn(), warn: vi.fn() };

    await handleChatCore({
      body: { model: "gpt-4o", stream: false, messages: [{ role: "user", content: "hello" }] },
      modelInfo: { provider: "openai", model: "gpt-4o" },
      credentials: { apiKey: "test-key", providerSpecificData: {} },
      log,
      connectionId: "test-conn",
      headroomEnabled: true,
      headroomUrl: "http://localhost:8787",
      headroomCompressUserMessages: false,
      rtkEnabled: false,
      cavemanEnabled: false,
      ponytailEnabled: false,
      clientRawRequest: {
        endpoint: "/v1/chat/completions",
        body: {},
        headers: { accept: "application/json" },
      },
    });

    expect(log.warn).toHaveBeenCalledWith(
      "HEADROOM",
      expect.stringContaining("skipped: request failed")
    );
    expect(log.warn).toHaveBeenCalledWith(
      "HEADROOM",
      expect.stringContaining("ECONNREFUSED")
    );
    expect(log.warn).toHaveBeenCalledWith(
      "HEADROOM",
      expect.stringContaining("http://localhost:8787/v1/compress")
    );
  });
});
