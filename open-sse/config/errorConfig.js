// OpenAI-compatible error types mapping (client-facing)
export const ERROR_TYPES = {
  400: { type: "invalid_request_error", code: "bad_request" },
  401: { type: "authentication_error", code: "invalid_api_key" },
  402: { type: "billing_error", code: "payment_required" },
  403: { type: "permission_error", code: "insufficient_quota" },
  404: { type: "invalid_request_error", code: "model_not_found" },
  406: { type: "invalid_request_error", code: "model_not_supported" },
  429: { type: "rate_limit_error", code: "rate_limit_exceeded" },
  500: { type: "server_error", code: "internal_server_error" },
};

// Cooldown durations
const COOLDOWN = { short: 15_000, long: 30_000 };
export const TRANSIENT_COOLDOWN_MS = 2_000;

/**
 * Error handling config.
 * Both text and status rules are evaluated in order (higher first).
 * Return { shouldFallback: true, cooldownMs } for combo to skip the model.
 *
 * Fields per rule:
 *   - text: error message substring match
 *   - status: HTTP status code match
 *   - cooldownMs: fixed cooldown duration
 *   - backoff: true = use exponential backoff (rate limit)
 */
export const ERROR_RULES = [
  // --- Text-based rules (checked first, order = priority) ---
  { text: "no credentials",               cooldownMs: COOLDOWN.long },
  { text: "request not allowed",          cooldownMs: COOLDOWN.short },
  { text: "improperly formed request",   cooldownMs: COOLDOWN.long },
  { text: "end of life",                 cooldownMs: COOLDOWN.long },
  { text: "no longer available",          cooldownMs: COOLDOWN.long },
  { text: "deprecated",                  cooldownMs: COOLDOWN.long },
  { text: "model_not_found",             cooldownMs: COOLDOWN.long },
  { text: "too many messages",           cooldownMs: COOLDOWN.long },
  { text: "maximum is",                  cooldownMs: COOLDOWN.long },
  { text: "rate limit",                  backoff: true },
  { text: "too many requests",           backoff: true },
  { text: "quota exceeded",              backoff: true },
  { text: "capacity",                    backoff: true },
  { text: "overloaded",                  backoff: true },

  // --- Status-based rules (fallback when text doesn't match) ---
  { status: 400, cooldownMs: COOLDOWN.long },
  { status: 401, cooldownMs: COOLDOWN.long },
  { status: 402, cooldownMs: COOLDOWN.long },
  { status: 403, cooldownMs: COOLDOWN.long },
  { status: 404, cooldownMs: COOLDOWN.long },
  { status: 406, cooldownMs: COOLDOWN.long },
  { status: 408, cooldownMs: COOLDOWN.short },
  { status: 410, cooldownMs: COOLDOWN.long },
  { status: 429, backoff: true },
  { status: 500, cooldownMs: COOLDOWN.short },
  { status: 502, cooldownMs: COOLDOWN.short },
  { status: 503, cooldownMs: COOLDOWN.short },
  { status: 504, cooldownMs: COOLDOWN.short },
];

// Backward compat: COOLDOWN_MS object (used by index.js re-export)
export const COOLDOWN_MS = {
  unauthorized: COOLDOWN.long,
  paymentRequired: COOLDOWN.long,
  notFound: COOLDOWN.long,
  transient: TRANSIENT_COOLDOWN_MS,
  requestNotAllowed: COOLDOWN.short,
};

// Exponential backoff config for rate limits
export const BACKOFF_CONFIG = {
  base: 2000,
  max: 5 * 60 * 1000,
  maxLevel: 15
};
