import { NextApiRequest, NextApiResponse } from 'next';

type Handler = (req: NextApiRequest, res: NextApiResponse, userid: string) => Promise<any> | any;
interface RouteConfig {
    GET?: Handler;
    POST?: Handler;
    PATCH?: Handler;
    PUT?: Handler;
    DELETE?: Handler;
    /** Skip auth check for this route */
    public?: boolean;
}
interface ApiHandlerDefaults {
    /** Returns userid or empty string. Called before each handler unless public. */
    auth: (req: NextApiRequest) => Promise<string>;
    /** Called on unhandled errors. Receives (error, req). */
    onError?: (error: unknown, req: NextApiRequest) => void;
}
/**
 * Factory that creates an apiHandler function pre-configured with auth and error handling.
 *
 * Usage:
 *   const apiHandler = createApiHandler({ auth: getAuthUserId, onError: captureApiError })
 *
 *   export default apiHandler({
 *     GET: async (req, res, userid) => { ... },
 *     POST: async (req, res, userid) => { ... },
 *   })
 */
declare function createApiHandler(defaults: ApiHandlerDefaults): (routes: RouteConfig) => (req: NextApiRequest, res: NextApiResponse) => Promise<any>;

export { createApiHandler };
