import { EventEmitter } from 'events';
import { NextApiResponse } from 'next';

interface SSEEmitterOptions {
    /** Max concurrent connections per user (default: 5) */
    maxClientsPerUser?: number;
    /** Interval in ms to sweep stale connections (default: 60000) */
    sweepInterval?: number;
    /** Error handler for write failures */
    onError?: (error: unknown, context: {
        userId: string;
        action: string;
    }) => void;
}
declare class SSEEmitter extends EventEmitter {
    private clients;
    private sweepTimer;
    private maxClients;
    private onError?;
    constructor(options?: SSEEmitterOptions);
    private sweepStale;
    addClient(userId: string, res: NextApiResponse): void;
    removeClient(userId: string, res: NextApiResponse): void;
    /** Send a JSON payload to all clients for a given user */
    notify(userId: string, data: Record<string, any>): void;
    getClientCount(userId: string): number;
    getTotalClients(): number;
    destroy(): void;
}

export { SSEEmitter, type SSEEmitterOptions };
