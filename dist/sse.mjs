import { EventEmitter } from 'events';

// src/sse.ts
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

export { SSEEmitter };
//# sourceMappingURL=sse.mjs.map
//# sourceMappingURL=sse.mjs.map