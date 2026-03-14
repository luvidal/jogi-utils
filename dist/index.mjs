import { EventEmitter } from 'events';
import { SignJWT, jwtVerify } from 'jose';

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
var SSEEmitter = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.clients = /* @__PURE__ */ new Map();
    this.sweepTimer = null;
    this.maxClients = options.maxClientsPerUser ?? 5;
    this.onError = options.onError;
    const sweepInterval = options.sweepInterval ?? 6e4;
    this.sweepTimer = setInterval(() => this.sweepStale(), sweepInterval);
    if (this.sweepTimer.unref) this.sweepTimer.unref();
  }
  sweepStale() {
    this.clients.forEach((clientList, userId) => {
      const alive = clientList.filter((client) => {
        try {
          const socket = client.res?.socket;
          return socket && !socket.destroyed;
        } catch {
          return false;
        }
      });
      if (alive.length !== clientList.length) {
        if (alive.length > 0) {
          this.clients.set(userId, alive);
        } else {
          this.clients.delete(userId);
        }
      }
    });
  }
  addClient(userId, res) {
    let clientList = this.clients.get(userId) || [];
    while (clientList.length >= this.maxClients) {
      const evicted = clientList.shift();
      if (evicted) {
        try {
          evicted.res.end();
        } catch {
        }
      }
    }
    clientList.push({ userId, res });
    this.clients.set(userId, clientList);
  }
  removeClient(userId, res) {
    const clientList = this.clients.get(userId) || [];
    const filtered = clientList.filter((client) => client.res !== res);
    if (filtered.length > 0) {
      this.clients.set(userId, filtered);
    } else {
      this.clients.delete(userId);
    }
  }
  /** Send a JSON payload to all clients for a given user */
  notify(userId, data) {
    const clientList = this.clients.get(userId) || [];
    if (clientList.length === 0) return;
    clientList.forEach((client) => {
      try {
        client.res.write(`data: ${JSON.stringify(data)}

`);
        if (client.res.flush) client.res.flush();
      } catch (error) {
        this.onError?.(error, { userId, action: "sse-write" });
        this.removeClient(userId, client.res);
      }
    });
  }
  getClientCount(userId) {
    return (this.clients.get(userId) || []).length;
  }
  getTotalClients() {
    let total = 0;
    this.clients.forEach((list) => total += list.length);
    return total;
  }
  destroy() {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
    this.clients.forEach((clientList) => {
      clientList.forEach((client) => {
        try {
          client.res.end();
        } catch {
        }
      });
    });
    this.clients.clear();
  }
};
function createJwtAuth(config) {
  const { cookieName, issuer } = config;
  const maxAge = config.maxAge ?? 43200;
  let _secretKey = null;
  function getSecretKey() {
    if (_secretKey) return _secretKey;
    const secret = typeof config.secret === "function" ? config.secret() : config.secret;
    if (!secret || secret.length < 32) {
      throw new Error("JWT secret must be at least 32 characters");
    }
    _secretKey = new TextEncoder().encode(secret);
    return _secretKey;
  }
  async function signToken(userId, email) {
    return new SignJWT({ sub: userId, email }).setProtectedHeader({ alg: "HS256" }).setIssuer(issuer).setIssuedAt().setExpirationTime(`${maxAge}s`).sign(getSecretKey());
  }
  async function verifyToken(token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey(), { issuer });
      const userId = payload.sub;
      const email = payload.email;
      if (!userId) return null;
      return { userId, email };
    } catch {
      return null;
    }
  }
  function setTokenCookie(res, token) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `${cookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`);
  }
  function clearTokenCookie(res) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
  }
  async function getAuthUserId(req) {
    const token = req.cookies?.[cookieName];
    if (!token) return "";
    const result = await verifyToken(token);
    return result?.userId || "";
  }
  return { signToken, verifyToken, setTokenCookie, clearTokenCookie, getAuthUserId };
}

export { SSEEmitter, checkRateLimit, createJwtAuth, getClientIp, rateLimit };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map