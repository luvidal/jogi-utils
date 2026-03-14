import type { NextApiRequest, NextApiResponse } from 'next'

type Handler = (req: NextApiRequest, res: NextApiResponse, userid: string) => Promise<any> | any
type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface RouteConfig {
  GET?: Handler
  POST?: Handler
  PATCH?: Handler
  PUT?: Handler
  DELETE?: Handler
  /** Skip auth check for this route */
  public?: boolean
}

interface ApiHandlerDefaults {
  /** Returns userid or empty string. Called before each handler unless public. */
  auth: (req: NextApiRequest) => Promise<string>
  /** Called on unhandled errors. Receives (error, req). */
  onError?: (error: unknown, req: NextApiRequest) => void
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
export function createApiHandler(defaults: ApiHandlerDefaults) {
  return function apiHandler(routes: RouteConfig) {
    return async function handler(req: NextApiRequest, res: NextApiResponse) {
      const method = req.method as Method
      const fn = routes[method]

      if (!fn) {
        return res.status(405).json({ msg: 'Method Not Allowed' })
      }

      let userid = ''
      if (!routes.public) {
        userid = await defaults.auth(req)
        if (!userid) {
          return res.status(401).json({ msg: 'Unauthorized' })
        }
      }

      try {
        return await fn(req, res, userid)
      } catch (error) {
        if (defaults.onError) {
          defaults.onError(error, req)
        }
        return res.status(500).json({ msg: 'Internal server error' })
      }
    }
  }
}
