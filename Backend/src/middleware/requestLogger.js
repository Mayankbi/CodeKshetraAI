/**
 * Request Logger Middleware
 *
 * Logs every HTTP request with structured metadata:
 *   - requestId, method, url, route, statusCode, responseTime (ms)
 *
 * Must be mounted AFTER requestIdMiddleware (which sets req.requestId).
 */

const logger = require('../config/logger');

const requestLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Log when the response finishes
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      route: req.route ? req.route.path : req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
    };

    // Log at different levels based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

module.exports = requestLoggerMiddleware;
