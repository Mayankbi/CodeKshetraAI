/**
 * Structured Logger — Winston + Loki Transport
 *
 * Pushes structured JSON logs to both the console and Grafana Loki.
 * Each log entry includes: timestamp, level, message, and any extra metadata.
 *
 * Hardcoded defaults (move to process.env once .env file is added):
 *   - LOKI_HOST → defaults to http://localhost:3100
 *
 * Usage:
 *   const logger = require('./config/logger');
 *   logger.info('User registered', { userId: '123', route: '/user/register' });
 */

const winston = require('winston');
const LokiTransport = require('winston-loki');

// ── Hardcoded defaults (move to process.env once .env file is added) ─────
// To use .env: const LOKI_HOST = process.env.LOKI_HOST || 'http://localhost:3100';
const LOKI_HOST = process.env.LOKI_HOST || 'http://localhost:3100';

const SERVICE_NAME = 'codekshetra-backend';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: SERVICE_NAME },
  transports: [
    // ── Console transport: colorized for local development ───────────
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
        })
      ),
    }),

    // ── Loki transport: push logs to Grafana Loki ────────────────────
    new LokiTransport({
      host: LOKI_HOST,
      labels: { job: SERVICE_NAME, service: SERVICE_NAME },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => {
        console.error('[Logger] Loki connection error:', err.message || err);
      },
    }),
  ],
});

module.exports = logger;
