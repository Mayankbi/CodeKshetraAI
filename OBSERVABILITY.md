# 🔭 Observability Stack — Setup Guide

Full observability for CodeKshetra AI with **Grafana** (dashboards), **Loki** (log aggregation), **Prometheus** (metrics), and **OpenTelemetry** (distributed tracing).

---

## Architecture Overview

```
┌─────────────────┐     OTLP/HTTP      ┌─────────────────────┐
│  Express Backend │ ──────────────────▶│  OTel Collector     │
│  (Node.js)       │                    │  :4317 (gRPC)       │
│                  │                    │  :4318 (HTTP)       │
│  Winston Logger  │                    └─────────┬───────────┘
│       │          │                              │
│       ▼          │                    ┌─────────▼───────────┐
│  winston-loki ───│──── HTTP Push ───▶│  Loki :3100         │
│       │          │                    └─────────┬───────────┘
│       ▼          │                              │
│  prom-client     │                    ┌─────────▼───────────┐
│  :3000/metrics   │◀─── Scraped By ────│  Prometheus :9090   │
└──────────────────┘                    └─────────┬───────────┘
                                                  │
                                        ┌─────────▼───────────┐
                                        │  Grafana :3001      │
                                        │  (Dashboards)       │
                                        └─────────────────────┘
```

---

## Quick Start

### Step 1: Start Infrastructure (Docker Compose)

```bash
# From project root
docker compose up -d
```

Wait for all services to be healthy:

```bash
docker compose ps
```

Expected output — all four services should show healthy:

```
NAME                          STATUS
codekshetra-grafana           Up (healthy)
codekshetra-loki              Up (healthy)
codekshetra-otel-collector    Up
codekshetra-prometheus        Up
```

### Step 2: Install Backend Dependencies

```bash
cd Backend
npm install
```

This installs the observability packages:
- `@opentelemetry/sdk-node`
- `@opentelemetry/auto-instrumentations-node`
- `@opentelemetry/exporter-trace-otlp-http`
- `@opentelemetry/resources`
- `@opentelemetry/semantic-conventions`
- `winston`
- `winston-loki`
- `prom-client`

### Step 3: Start the Backend

```bash
# Option 1: Tracing & Metrics loaded automatically in index.js (recommended)
npm start

# Option 2: Tracing loaded via -r flag (alternative)
npm run start:traced
```

You should see:
```
[OTel] Tracing initialized — exporting to http://localhost:4318/v1/traces
[codekshetra-backend] info: DB & RedisDb Connected
[codekshetra-backend] info: Server listening at port number: ...
```

### Step 4: Verify Traces Are Being Received

```bash
docker compose logs otel-collector --tail=20
```

Look for trace payloads indicating received telemetry batches.

### Step 5: Verify Logs in Loki

```bash
curl -s "http://localhost:3100/loki/api/v1/query?query={service=\"codekshetra-backend\"}" | python3 -m json.tool | head -30
```

### Step 6: Verify Metrics endpoint

```bash
curl -s "http://localhost:3000/metrics" | head -n 15
```

---

## Grafana Setup

### Adding Loki as a Data Source

1. Open **Grafana** at [http://localhost:3001](http://localhost:3001)
2. Default login: `admin` / `admin` (skip password change if prompted)
3. Go to **☰ Menu → Connections → Data sources**
4. Click **"Add data source"**
5. Search for and select **Loki**
6. Set the URL to: `http://loki:3100`
   > ⚠️ Use `loki` (the Docker service name), NOT `localhost` — Grafana runs inside Docker and resolves service names via the `observability` network.
7. Click **"Save & test"** — should show ✅ "Data source successfully connected"

### Adding Prometheus as a Data Source

1. Open **Grafana** at [http://localhost:3001](http://localhost:3001)
2. Go to **☰ Menu → Connections → Data sources**
3. Click **"Add data source"**
4. Search for and select **Prometheus**
5. Set the URL to: `http://prometheus:9090`
   > ⚠️ Use `prometheus` (the Docker service name), NOT `localhost`.
6. Click **"Save & test"** — should show ✅ "Data source is working"

### Adding Tempo as a Data Source (Future)

When you add a Tempo service to `docker-compose.yml`:

1. Go to **Data sources → Add data source → Tempo**
2. Set URL to: `http://tempo:3200`
3. In the OTel collector config (`otel-collector-config.yaml`), uncomment the `otlp/tempo` exporter and update the traces pipeline
4. Save & test

---

## Building a Sample Dashboard

### Panel: Request Logs by Service Name

1. Go to **☰ Menu → Dashboards → New → New Dashboard**
2. Click **"Add visualization"**
3. Select **Loki** as the data source
4. Switch to **Code** mode (toggle in the query editor)
5. Enter this LogQL query:

```logql
{service="codekshetra-backend"} | json
```

6. Click **"Run query"** to preview results
7. In the panel settings (right sidebar):
   - **Title**: `Backend Request Logs`
   - **Visualization**: Select `Logs`
8. Click **"Apply"**

### Panel: HTTP Request Throughput (Prometheus)

1. Add a visualization to your dashboard.
2. Select **Prometheus** as the data source.
3. Enter this PromQL query:
```promql
sum(rate(http_requests_total[5m])) by (method, route, status_code)
```
4. In the panel settings (right sidebar):
   - **Title**: `HTTP Requests Rate`
   - **Visualization**: `Time series`
5. Click **"Apply"**

### Panel: HTTP Latency Heatmap (Prometheus)

1. Add a visualization to your dashboard.
2. Select **Prometheus** as the data source.
3. Enter this PromQL query:
```promql
sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
```
4. In the panel settings (right sidebar):
   - **Title**: `HTTP Request Latency`
   - **Visualization**: `Heatmap`
5. Click **"Apply"**

### Panel: Node.js Memory Usage (Prometheus)

1. Add a visualization to your dashboard.
2. Select **Prometheus** as the data source.
3. Enter this PromQL query:
```promql
nodejs_heap_size_used_bytes
```
4. In the panel settings (right sidebar):
   - **Title**: `Heap Size Used`
   - **Visualization**: `Time series`
5. Click **"Apply"**

9. Click **💾 Save dashboard** → name it "CodeKshetra Backend Observability"

---

## Moving to .env (When Ready)

When you create a `.env` file, replace the hardcoded constants:

### Backend/src/tracing.js
```diff
- const OTEL_ENDPOINT = process.env.OTEL_ENDPOINT || 'http://localhost:4318/v1/traces';
+ const OTEL_ENDPOINT = process.env.OTEL_ENDPOINT || 'http://localhost:4318/v1/traces';
```

### Backend/src/config/logger.js
```diff
- const LOKI_HOST = process.env.LOKI_HOST || 'http://localhost:3100';
+ const LOKI_HOST = process.env.LOKI_HOST || 'http://localhost:3100';
```

### Example .env file
```env
# Observability endpoints
LOKI_HOST=http://localhost:3100
OTEL_ENDPOINT=http://localhost:4318/v1/traces
OTEL_SERVICE_NAME=codekshetra-backend
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all observability services |
| `docker compose ps` | Check service health status |
| `docker compose logs loki` | View Loki container logs |
| `docker compose logs prometheus` | View Prometheus container logs |
| `docker compose logs otel-collector` | View OTel traces in console |
| `docker compose logs grafana` | View Grafana container logs |
| `docker compose down` | Stop all services |
| `docker compose down -v` | Stop all services and remove volumes |

---

## Ports Reference

| Service | Host Port | Container Port | URL |
|---------|-----------|---------------|-----|
| Grafana | 3001 | 3000 | http://localhost:3001 |
| Loki | 3100 | 3100 | http://localhost:3100 |
| Prometheus | 9090 | 9090 | http://localhost:9090 |
| OTel Collector (gRPC) | 4317 | 4317 | — |
| OTel Collector (HTTP) | 4318 | 4318 | http://localhost:4318 |
