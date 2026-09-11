# CodeKshetra AI — LeetCode-Like Coding Platform

A modern, full-stack LeetCode clone with an **AI tutor**, built using the MERN stack. Features a robust code-execution engine, an interactive problem-solving workspace, video editorials, a gamified point system, and a **production-grade observability stack** (OpenTelemetry, Prometheus, Loki, Grafana).

---

## Tech Stack

**Frontend:**
- **Framework:** React 19 + Vite
- **Styling:** TailwindCSS + DaisyUI
- **State Management:** Redux Toolkit
- **Code Editor:** Monaco Editor (`@monaco-editor/react`)
- **Syntax Highlighting:** `react-syntax-highlighter`

**Backend:**
- **Runtime:** Node.js + Express.js 5
- **Database:** MongoDB (Mongoose) + Redis (caching & rate-limiting)
- **Authentication:** JWT (JSON Web Tokens) + bcrypt
- **AI Integration:** Google Gemini API (`@google/genai`)
- **Video Storage:** Cloudinary
- **Metrics:** Prometheus (`prom-client`) — HTTP request count, latency histograms, status-code counters
- **Logging:** Winston + Loki (structured JSON logs with `trace_id` / `span_id` correlation)
- **Tracing:** OpenTelemetry SDK → OTel Collector (auto-instruments HTTP, Express, Mongoose)

**Infrastructure (Docker Compose):**
- **Grafana** — Dashboards & visualization (`localhost:3001`)
- **Loki** — Log aggregation (`localhost:3100`)
- **Prometheus** — Metrics scraping (`localhost:9090`)
- **OpenTelemetry Collector** — Trace ingestion (`localhost:4317` / `4318`)

---

## Architecture

```
┌──────────┐     HTTP      ┌───────────────────────────────────────────────┐
│ React UI │─────────────▶│             Express.js Backend                │
│ (Vite)   │◀─────────────│  requestId → requestLogger → routes          │
└──────────┘               │                                               │
                           │  ┌─────────┐  ┌───────┐  ┌───────────────┐   │
                           │  │ MongoDB  │  │ Redis │  │  Judge0 API   │   │
                           │  └─────────┘  └───────┘  └───────────────┘   │
                           │                                               │
                           │  /metrics ──▶ Prometheus ──▶ Grafana          │
                           │  Winston  ──▶ Loki       ──▶ Grafana          │
                           │  OTel SDK ──▶ OTel Collector                  │
                           └───────────────────────────────────────────────┘
```

---

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
2. **MongoDB** (running locally or a MongoDB Atlas URI)
3. **Redis** (running locally on default port `6379`)
4. **Docker & Docker Compose** (for the observability stack)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd CodeKshetra-AI
```

### 2. Start the Observability Stack

Spin up Grafana, Loki, Prometheus, and the OTel Collector in the background:

```bash
docker compose up -d
```

Verify all services are running:

```bash
docker compose ps
```

| Service | URL | Purpose |
|---------|-----|---------|
| Grafana | http://localhost:3001 | Dashboards (admin / admin) |
| Loki | http://localhost:3100 | Log aggregation |
| Prometheus | http://localhost:9090 | Metrics |
| OTel Collector | localhost:4317 / 4318 | Trace ingestion |

### 3. Backend Setup

```bash
cd Backend
npm install
```

**Environment Variables:**
Create a `.env` file inside the `Backend` folder:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/leetcode_clone
JWT_KEY=your_super_secret_jwt_key
GEMINI_KEY=your_google_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Optional — defaults are fine for local development
# OTEL_ENDPOINT=http://localhost:4318/v1/traces
# OTEL_SERVICE_NAME=codekshetra-backend
# LOKI_HOST=http://localhost:3100
```

**Start the Backend:**

> Make sure MongoDB, Redis, and the Docker observability stack are running first.

```bash
npm start
# Server starts on http://localhost:3000
```

### 4. Frontend Setup

Open a **new terminal**:

```bash
cd Frontend
npm install
npm run dev
# React app starts on http://localhost:5173
```

---

## Observability

The project ships with a full observability stack. See [OBSERVABILITY.md](./OBSERVABILITY.md) for detailed setup, Grafana dashboard configuration, and LogQL / PromQL query examples.

### Quick Verification

| Check | Command / URL |
|-------|---------------|
| Backend health | `curl http://localhost:3000/` |
| Prometheus metrics | `curl http://localhost:3000/metrics` |
| Loki readiness | `curl http://localhost:3100/ready` |
| Prometheus targets | http://localhost:9090/targets |
| Grafana dashboards | http://localhost:3001 (admin / admin) |
| OTel collector logs | `docker compose logs otel-collector --tail=20` |

### What Gets Instrumented

- **Metrics** (`prom-client`): HTTP request count, latency histograms, response status-code distribution — exposed at `/metrics`
- **Logs** (Winston → Loki): Structured JSON logs with `trace_id`, `span_id`, `request_id`, method, path, status, and response time
- **Traces** (OpenTelemetry): Auto-instrumented HTTP, Express, and Mongoose/MongoDB spans exported via OTLP to the OTel Collector

---

## Key Features

- **Interactive Code Editor** — Embedded Monaco editor supporting C++, Java, and JavaScript
- **AI Tutor** — Integrated Gemini AI to help users debug code without giving away the complete answer
- **Admin Dashboard** — Secure portal to create, edit, and manage problems, invisible test cases, and video editorials
- **Gamified Scoring** — Earn points (Easy: 2, Medium: 4, Hard: 8) upon solving problems for the first time
- **Video Editorials** — Secure Cloudinary video streaming for problem walkthroughs
- **Role-Based Authentication** — Secure JWT cookies with User and Admin roles
- **Rate Limiting** — Redis-backed rate limiter to prevent abuse
- **Request Tracing** — Every request gets a unique `x-request-id` header for end-to-end tracing
- **Production-Grade Observability** — Logs, metrics, and traces with Grafana dashboards

---

## Project Structure

```
CodeKshetra-AI/
├── Backend/
│   ├── src/
│   │   ├── config/          # DB, Redis, Logger, Metrics setup
│   │   ├── controllers/     # Route handlers (auth, problems, AI, submissions)
│   │   ├── middleware/       # Auth, rate-limiter, request-id, request-logger
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── utils/           # Helpers
│   │   ├── index.js         # App entry point
│   │   └── tracing.js       # OpenTelemetry SDK init (loaded first)
│   └── package.json
├── Frontend/                # React + Vite app
├── docker-compose.yml       # Grafana, Loki, Prometheus, OTel Collector
├── otel-collector-config.yaml
├── prometheus.yml
├── OBSERVABILITY.md         # Detailed observability guide
└── README.md
```

---

## License

ISC
