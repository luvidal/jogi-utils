'use strict';

var jose = require('jose');

// src/jwt.ts
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
    return new jose.SignJWT({ sub: userId, email }).setProtectedHeader({ alg: "HS256" }).setIssuer(issuer).setIssuedAt().setExpirationTime(`${maxAge}s`).sign(getSecretKey());
  }
  async function verifyToken(token) {
    try {
      const { payload } = await jose.jwtVerify(token, getSecretKey(), { issuer });
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

exports.createJwtAuth = createJwtAuth;
//# sourceMappingURL=jwt.js.map
//# sourceMappingURL=jwt.js.map