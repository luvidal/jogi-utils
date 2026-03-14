import { SignJWT, jwtVerify } from 'jose'
import type { NextApiRequest, NextApiResponse } from 'next'

export interface JwtAuthConfig {
  /** Cookie name (e.g. 'my_token') */
  cookieName: string
  /** JWT issuer claim */
  issuer: string
  /** Max age in seconds (default: 43200 = 12h) */
  maxAge?: number
  /** JWT secret string or getter function. Must be at least 32 characters. Validated lazily on first use. */
  secret: string | (() => string)
}

export interface JwtAuth {
  signToken: (userId: string, email: string) => Promise<string>
  verifyToken: (token: string) => Promise<{ userId: string; email: string } | null>
  setTokenCookie: (res: NextApiResponse, token: string) => void
  clearTokenCookie: (res: NextApiResponse) => void
  getAuthUserId: (req: NextApiRequest) => Promise<string>
}

export function createJwtAuth(config: JwtAuthConfig): JwtAuth {
  const { cookieName, issuer } = config
  const maxAge = config.maxAge ?? 43200

  let _secretKey: Uint8Array | null = null

  function getSecretKey(): Uint8Array {
    if (_secretKey) return _secretKey
    const secret = typeof config.secret === 'function' ? config.secret() : config.secret
    if (!secret || secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters')
    }
    _secretKey = new TextEncoder().encode(secret)
    return _secretKey
  }

  async function signToken(userId: string, email: string): Promise<string> {
    return new SignJWT({ sub: userId, email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(issuer)
      .setIssuedAt()
      .setExpirationTime(`${maxAge}s`)
      .sign(getSecretKey())
  }

  async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
    try {
      const { payload } = await jwtVerify(token, getSecretKey(), { issuer })
      const userId = payload.sub
      const email = payload.email as string
      if (!userId) return null
      return { userId, email }
    } catch {
      return null
    }
  }

  function setTokenCookie(res: NextApiResponse, token: string) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    res.setHeader('Set-Cookie', `${cookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`)
  }

  function clearTokenCookie(res: NextApiResponse) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`)
  }

  async function getAuthUserId(req: NextApiRequest): Promise<string> {
    const token = req.cookies?.[cookieName]
    if (!token) return ''
    const result = await verifyToken(token)
    return result?.userId || ''
  }

  return { signToken, verifyToken, setTokenCookie, clearTokenCookie, getAuthUserId }
}
