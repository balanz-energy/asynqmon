# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Asynqmon is a web UI for monitoring and administering [Asynq](https://github.com/hibiken/asynq) task queues. It deploys either as a standalone binary/Docker container or as an embeddable Go library (`net/http`, gorilla/mux, echo).

## Commands

### Build

```bash
make assets   # Build frontend only (yarn install + yarn build in ui/)
make api      # Build Go binary without rebuilding frontend (fast iteration)
make build    # Full release build: frontend + backend
make docker   # Build Docker image and run with defaults
```

### Backend (Go)

```bash
go test ./...                        # Run all tests
go test ./cmd/asynqmon/...           # Run binary/CLI tests only
go run ./cmd/asynqmon/ --port 8080   # Run dev server (requires pre-built frontend or use make assets first)
```

### Frontend (in `ui/`)

```bash
yarn install    # Install dependencies
yarn start      # Dev server at localhost:3000 (proxies /api to localhost:8080)
yarn build      # Production build to ui/build/ (embedded in Go binary)
yarn test       # Run frontend tests
```

## Architecture

### Frontend–Backend Split

The Go binary embeds the compiled React SPA (`ui/build/`) via `//go:embed ui/build/*` in `static.go`. The frontend communicates with the backend via REST API at `/api/`.

- **Backend entry point**: `cmd/asynqmon/main.go` — parses CLI flags, sets up Redis connection, starts HTTP server
- **Library entry point**: `handler.go` — exports `HTTPHandler` and `Options` for embedding use cases
- **Router setup**: `handler.go:muxRouter()` registers all API routes using gorilla/mux
- **SPA serving**: `static.go` — serves embedded assets; injects `RootPath` and Prometheus config into `index.html` using `[[ ]]` template delimiters (not `{{ }}`)

### Request Flow

```
Browser → Go HTTP server
  ├── /api/* → handler functions (task_handlers.go, queue_handlers.go, etc.)
  └── /* → static.go (SPA fallback to index.html)
```

Read-only mode (flag `--read-only`) blocks all non-GET requests via middleware in `cmd/asynqmon/middlewares.go`.

### Key Backend Files

| File | Responsibility |
|---|---|
| `handler.go` | HTTPHandler type, Options config, router wiring |
| `task_handlers.go` | Task CRUD for all 6 states (active, pending, scheduled, retry, archived, completed) |
| `queue_handlers.go` | Pause, resume, delete queue |
| `group_handlers.go` | Aggregating task groups |
| `metrics_handler.go` | Prometheus metrics proxy |
| `redis_info_handlers.go` | Redis server info |
| `scheduler_entry_handlers.go` | Asynq scheduler entries |
| `conversion_helpers.go` | Internal Asynq types → JSON response structs |
| `static.go` | Embedded SPA asset serving with template injection |

### Frontend Structure (`ui/src/`)

- **`api.ts`**: All HTTP calls via axios; defines request/response types
- **`store.ts`**: Redux store with 11 slices
- **`views/`**: Page-level components (one per route)
- **`components/`**: Reusable UI (task tables, charts, dialogs)
- **`actions/` + `reducers/`**: Redux state management per feature
- **`theme.tsx`**: Material-UI light/dark theme

### Redis Backend Support

Connection mode is inferred from flags at startup:
- Single node: `--redis-addr`
- Cluster: `--redis-cluster-nodes`
- Sentinel: `--redis-sentinel-*` flags

### Prometheus Integration

Optional. Enabled by passing `--prometheus-addr`. When set, a "Metrics" tab appears in the UI. The backend proxies metric queries to the Prometheus server — the frontend never calls Prometheus directly.
