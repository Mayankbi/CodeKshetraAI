/**
 * Request ID Middleware
 *
 * Generates a unique UUID for each incoming HTTP request.
 * Attaches it to req.requestId and sets the X-Request-Id response header.
 * This enables log correlation across the request lifecycle.
 */

const crypto = require('crypto');

const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

module.exports = requestIdMiddleware;
