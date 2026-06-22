import { claudeToOpenAIRequest } from "../translator/request/claude-to-openai.js";
import { openaiToClaudeRequest } from "../translator/request/openai-to-claude.js";

const DEFAULT_TIMEOUT_MS = 3000;

function setDiagnostic(diagnostics, reason) {
  if (diagnostics && !diagnostics.reason) diagnostics.reason = reason;
}

function describeFetchError(error) {
  const cause = error?.cause;
  const code = cause?.code || error?.code;
  const message = cause?.message || error?.message || String(error);
  return code ? `${code}: ${message}` : message;
}

// POST messages to Headroom /v1/compress; returns compressed messages + stats or null.
async function callCompress(url, messages, model, timeoutMs, compressUserMessages, diagnostics) {
  const endpoint = `${String(url).replace(/\/$/, "")}/v1/compress`;
  diagnostics.endpoint = endpoint;
  const payload = { messages, model };
  if (compressUserMessages) payload.config = { compress_user_messages: true };
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    setDiagnostic(diagnostics, `request failed: ${describeFetchError(error)}`);
    return null;
  }
  if (!res.ok) {
    setDiagnostic(diagnostics, `proxy returned HTTP ${res.status}`);
    return null;
  }
  const data = await res.json();
  if (!Array.isArray(data?.messages)) {
    setDiagnostic(diagnostics, "proxy response missing messages[]");
    return null;
  }
  return data;
}

// Compress request body via Headroom proxy. Fail-open: returns null on any error.
// /v1/compress only understands OpenAI shape, so Claude bodies are translated
// to OpenAI, compressed, then translated back using 9Router's own translators.
export async function compressWithHeadroom(body, { enabled, url, model, format, compressUserMessages, timeoutMs = DEFAULT_TIMEOUT_MS, diagnostics = null } = {}) {
  if (!enabled) {
    setDiagnostic(diagnostics, "disabled");
    return null;
  }
  if (!url) {
    setDiagnostic(diagnostics, "missing proxy URL");
    return null;
  }
  if (!body) {
    setDiagnostic(diagnostics, "missing request body");
    return null;
  }

  try {
    // Claude shape: translate → OpenAI → compress → translate back.
    if (format === "claude") {
      const oai = claudeToOpenAIRequest(model, body, false);
      if (!Array.isArray(oai?.messages)) {
        setDiagnostic(diagnostics, "Claude request did not translate to messages[]");
        return null;
      }
      const data = await callCompress(url, oai.messages, model, timeoutMs, compressUserMessages, diagnostics || {});
      if (!data) return null;
      const claudeBody = openaiToClaudeRequest(model, { ...oai, messages: data.messages }, false);
      if (Array.isArray(claudeBody?.messages)) body.messages = claudeBody.messages;
      if (claudeBody?.system !== undefined) body.system = claudeBody.system;
      return data;
    }

    // OpenAI shape: messages/input go straight to the proxy.
    const key = Array.isArray(body.messages) ? "messages"
      : Array.isArray(body.input) ? "input"
      : null;
    if (!key) {
      setDiagnostic(diagnostics, `unsupported ${format || "unknown"} request shape`);
      return null;
    }
    const data = await callCompress(url, body[key], model, timeoutMs, compressUserMessages, diagnostics || {});
    if (!data) return null;
    body[key] = data.messages;
    return data;
  } catch (error) {
    setDiagnostic(diagnostics, `unexpected error: ${error?.message || String(error)}`);
    return null;
  }
}

export function formatHeadroomLog(stats) {
  if (!stats) return null;
  const before = stats.tokens_before || 0;
  const after = stats.tokens_after || 0;
  const saved = stats.tokens_saved || 0;
  const pct = before > 0 ? ((saved / before) * 100).toFixed(1) : "0";
  return `saved ${saved} tokens / ${before} (${pct}%) ${after ? `after=${after}` : ""}`.trim();
}
