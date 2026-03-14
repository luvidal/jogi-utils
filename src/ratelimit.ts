import type { NextApiRequest } from 'next'

const store = new Map<string, number[]>()

// Cleanup expired entries every 60s
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of store) {
    const valid = timestamps.filter(t => now - t < 120_000)
    if (valid.length === 0) store.delete(key)
    else store.set(key, valid)
  }
}, 60_000).unref?.()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now()
  const timestamps = (store.get(key) || []).filter(t => now - t < windowMs)
  if (timestamps.length >= limit) {
    store.set(key, timestamps)
    return { ok: false, remaining: 0 }
  }
  timestamps.push(now)
  store.set(key, timestamps)
  return { ok: true, remaining: limit - timestamps.length }
}

export function getClientIp(req: NextApiRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

const DEFAULT_MSG = { error: 'Too many requests. Please try again later.' }

export function checkRateLimit(
  req: NextApiRequest,
  limit: number,
  windowMs: number = 60_000,
  message?: Record<string, string>
) {
  const ip = getClientIp(req)
  const key = `${ip}:${req.url}`
  const result = rateLimit(key, limit, windowMs)
  return { ...result, response: message ?? DEFAULT_MSG }
}
