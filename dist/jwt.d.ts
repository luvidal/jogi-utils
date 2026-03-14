import { NextApiResponse, NextApiRequest } from 'next';

interface JwtAuthConfig {
    /** Cookie name (e.g. 'my_token') */
    cookieName: string;
    /** JWT issuer claim */
    issuer: string;
    /** Max age in seconds (default: 43200 = 12h) */
    maxAge?: number;
    /** JWT secret string or getter function. Must be at least 32 characters. Validated lazily on first use. */
    secret: string | (() => string);
}
interface JwtAuth {
    signToken: (userId: string, email: string) => Promise<string>;
    verifyToken: (token: string) => Promise<{
        userId: string;
        email: string;
    } | null>;
    setTokenCookie: (res: NextApiResponse, token: string) => void;
    clearTokenCookie: (res: NextApiResponse) => void;
    getAuthUserId: (req: NextApiRequest) => Promise<string>;
}
declare function createJwtAuth(config: JwtAuthConfig): JwtAuth;

export { type JwtAuth, type JwtAuthConfig, createJwtAuth };
