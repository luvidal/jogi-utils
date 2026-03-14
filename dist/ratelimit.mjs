// src/ratelimit.ts
var store = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of store) {
    const valid = timestamps.filter((t) => now - t < 12e4);
    if (valid.length === 0) store.delete(key);
    else store.set(key, valid);
  }
}, 6e4).unref?.();
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const timestamps = (store.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    store.set(key, timestamps);
    return { ok: false, remaining: 0 };
  }
  timestamps.push(now);
  store.set(key, timestamps);
  return { ok: true, remaining: limit - timestamps.length };
}
function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}
var DEFAULT_MSG = { error: "Too many requests. Please try again later." };
function checkRateLimit(req, limit, windowMs = 6e4, message) {
  const ip = getClientIp(req);
  const key = `${ip}:${req.url}`;
  const result = rateLimit(key, limit, windowMs);
  return { ...result, response: message ?? DEFAULT_MSG };
}

export { checkRateLimit, getClientIp, rateLimit };
//# sourceMappingURL=ratelimit.mjs.map
//# sourceMappingURL=ratelimit.mjs.map