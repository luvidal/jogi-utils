'use strict';

// src/apihandler.ts
function createApiHandler(defaults) {
  return function apiHandler(routes) {
    return async function handler(req, res) {
      const method = req.method;
      const fn = routes[method];
      if (!fn) {
        return res.status(405).json({ msg: "Method Not Allowed" });
      }
      let userid = "";
      if (!routes.public) {
        userid = await defaults.auth(req);
        if (!userid) {
          return res.status(401).json({ msg: "Unauthorized" });
        }
      }
      try {
        return await fn(req, res, userid);
      } catch (error) {
        if (defaults.onError) {
          defaults.onError(error, req);
        }
        return res.status(500).json({ msg: "Internal server error" });
      }
    };
  };
}

exports.createApiHandler = createApiHandler;
//# sourceMappingURL=apihandler.js.map
//# sourceMappingURL=apihandler.js.map