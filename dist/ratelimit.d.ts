import { NextApiRequest } from 'next';

declare function rateLimit(key: string, limit: number, windowMs: number): {
    ok: boolean;
    remaining: number;
};
declare function getClientIp(req: NextApiRequest): string;
declare function checkRateLimit(req: NextApiRequest, limit: number, windowMs?: number, message?: Record<string, string>): {
    response: {
        error: string;
    } | Record<string, string>;
    ok: boolean;
    remaining: number;
};

export { checkRateLimit, getClientIp, rateLimit };
