/**
 * Prometheus Metrics Configuration — CodeKshetra AI Backend
 *
 * Configures prom-client, registers default metrics, and defines custom metrics
 * to monitor HTTP request count, latency, and status codes.
 */

const client = require('prom-client');

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, Memory usage, event loop lag, etc.)
client.collectDefaultMetrics({ register });

// Define custom metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // detailed buckets for latency tracking
});

// Register custom metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);

/**
 * Middleware to measure HTTP request count and latency
 */
const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    // Get duration in seconds
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;

    // Use req.route.path if matched, fallback to req.path/req.originalUrl
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route: route || 'unknown_route',
      status_code: res.statusCode.toString(),
    };

    // Record metrics (exclude requests to /metrics to avoid noise)
    if (req.path !== '/metrics') {
      httpRequestsTotal.inc(labels);
      httpRequestDurationSeconds.observe(labels, duration);
    }
  });

  next();
};

/**
 * Expose registry metrics
 */
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
};

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  register,
};
