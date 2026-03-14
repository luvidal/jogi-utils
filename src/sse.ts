import { EventEmitter } from 'events'
import type { NextApiResponse } from 'next'

interface SSEClient {
  userId: string
  res: NextApiResponse
}

export interface SSEEmitterOptions {
  /** Max concurrent connections per user (default: 5) */
  maxClientsPerUser?: number
  /** Interval in ms to sweep stale connections (default: 60000) */
  sweepInterval?: number
  /** Error handler for write failures */
  onError?: (error: unknown, context: { userId: string; action: string }) => void
}

export class SSEEmitter extends EventEmitter {
  private clients: Map<string, SSEClient[]> = new Map()
  private sweepTimer: ReturnType<typeof setInterval> | null = null
  private maxClients: number
  private onError?: SSEEmitterOptions['onError']

  constructor(options: SSEEmitterOptions = {}) {
    super()
    this.maxClients = options.maxClientsPerUser ?? 5
    this.onError = options.onError

    const sweepInterval = options.sweepInterval ?? 60_000
    this.sweepTimer = setInterval(() => this.sweepStale(), sweepInterval)
    if (this.sweepTimer.unref) this.sweepTimer.unref()
  }

  private sweepStale() {
    this.clients.forEach((clientList, userId) => {
      const alive = clientList.filter(client => {
        try {
          const socket = (client.res as any)?.socket
          return socket && !socket.destroyed
        } catch {
          return false
        }
      })
      if (alive.length !== clientList.length) {
        if (alive.length > 0) {
          this.clients.set(userId, alive)
        } else {
          this.clients.delete(userId)
        }
      }
    })
  }

  addClient(userId: string, res: NextApiResponse) {
    let clientList = this.clients.get(userId) || []
    // Evict oldest connections if over limit
    while (clientList.length >= this.maxClients) {
      const evicted = clientList.shift()
      if (evicted) {
        try { evicted.res.end() } catch { /* already closed */ }
      }
    }
    clientList.push({ userId, res })
    this.clients.set(userId, clientList)
  }

  removeClient(userId: string, res: NextApiResponse) {
    const clientList = this.clients.get(userId) || []
    const filtered = clientList.filter(client => client.res !== res)

    if (filtered.length > 0) {
      this.clients.set(userId, filtered)
    } else {
      this.clients.delete(userId)
    }
  }

  /** Send a JSON payload to all clients for a given user */
  notify(userId: string, data: Record<string, any>) {
    const clientList = this.clients.get(userId) || []
    if (clientList.length === 0) return

    clientList.forEach(client => {
      try {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`)
        // @ts-ignore - flush exists on the underlying socket
        if (client.res.flush) client.res.flush()
      } catch (error) {
        this.onError?.(error, { userId, action: 'sse-write' })
        this.removeClient(userId, client.res)
      }
    })
  }

  getClientCount(userId: string): number {
    return (this.clients.get(userId) || []).length
  }

  getTotalClients(): number {
    let total = 0
    this.clients.forEach(list => total += list.length)
    return total
  }

  destroy() {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer)
      this.sweepTimer = null
    }
    this.clients.forEach(clientList => {
      clientList.forEach(client => {
        try { client.res.end() } catch { /* already closed */ }
      })
    })
    this.clients.clear()
  }
}
