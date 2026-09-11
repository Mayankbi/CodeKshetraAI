/**
 * OpenTelemetry Tracing Initialization — CodeKshetra AI Backend
 *
 * This file MUST be loaded before the Express app and all other modules.
 * It patches Node.js modules at load time to enable automatic instrumentation.
 *
 * Loading options:
 *   1. require('./tracing') at the very top of index.js  (recommended)
 *   2. node --require ./src/tracing.js src/index.js      (alternative -r flag)
 *
 * Hardcoded defaults with .env override support:
 *   - OTEL_ENDPOINT  → defaults to http://localhost:4318/v1/traces
 *   - OTEL_SERVICE_NAME → defaults to codekshetra-backend
 */

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');

// ── Hardcoded defaults (move to process.env once .env file is added) ─────
// To use .env: const OTEL_ENDPOINT = process.env.OTEL_ENDPOINT || 'http://localhost:4318/v1/traces';
const OTEL_ENDPOINT = process.env.OTEL_ENDPOINT || 'http://localhost:4318/v1/traces';

// To use .env: const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'codekshetra-backend';
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'codekshetra-backend';

const traceExporter = new OTLPTraceExporter({
  url: OTEL_ENDPOINT,
});

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Auto-instrument HTTP, Express, and Mongoose/MongoDB calls
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-mongoose': { enabled: true },
      '@opentelemetry/instrumentation-mongodb': { enabled: true },
      // Disable file system instrumentation (too noisy)
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

// Start the SDK
sdk.start();
console.log(`[OTel] Tracing initialized — exporting to ${OTEL_ENDPOINT}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('[OTel] Tracing terminated'))
    .catch((err) => console.error('[OTel] Error shutting down tracing', err))
    .finally(() => process.exit(0));
});
