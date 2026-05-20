# api-gateway

Single public entry point for the platform. No business logic, no DB.

## Responsibilities

- Routing `/api/auth/*`, `/api/products/*`, `/api/orders/*`, `/api/notifications/*` → respective service.
- Rate limiting (Redis-backed, sliding window, IP and user keyed).
- `X-Request-ID` generation and propagation.
- Circuit breakers (opossum) per downstream — fail-fast with `502 UPSTREAM_UNAVAILABLE`.
- Aggregated `/health` endpoint that fans out to every downstream's `/health/ready`.
- `/metrics` endpoint with breaker stats (JSON).

## Run

```bash
# from monorepo root
docker compose up --build api-gateway
```

Local-only (with `.env` copied from `.env.example` and downstreams already running):

```bash
npm install
npm start
```
