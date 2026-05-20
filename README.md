# Order Processing System

Microservices e-commerce backend with Node.js, MongoDB, RabbitMQ, Redis, and Docker. Includes Auth, Products, Orders, and Notifications services behind an API Gateway.

## Architecture

```
Client → Nginx:80 → API Gateway:8080 → [Auth:4001 | Product:4002 | Order:4003 | Notification:4004]
                                           ↓
                                  [MongoDB, Redis, RabbitMQ]
```

**Services:**
- **api-gateway** (port 8080) — Routes requests, rate-limiting, circuit breakers
- **auth-service** (port 4001) — JWT authentication
- **product-service** (port 4002) — Product catalog & stock management
- **order-service** (port 4003) — Order processing & orchestration
- **notification-service** (port 4004) — Event-driven notifications
## Getting Started

**Requirements:**
- Docker Desktop 4.x
- Node.js 20 LTS (optional, for local testing)
- 3GB free RAM

**Quick Start:**
```bash
git clone <repo-url>
cd order-processing-system
docker compose up --build
```

All containers should be healthy within 30 seconds.

**Access Points:**
- http://localhost — Nginx frontend
- http://localhost:8080 — API Gateway
- http://localhost:8080/health — Service health
- http://localhost:15672 — RabbitMQ UI (guest/guest)
## Configuration

Each service loads `.env.example` as the default development environment.

**Key Variables:**
| Variable | Example |
| --- | --- |
| `PORT` | `4001` |
| `NODE_ENV` | `development` |
| `MONGO_URI` | `mongodb://mongo:27017/auth_db` |
| `REDIS_URL` | `redis://redis:6379` |
| `RABBITMQ_URL` | `amqp://guest:guest@rabbitmq:5672` |
| `JWT_ACCESS_SECRET` | (min 32 chars) |
| `RATE_LIMIT_IP_PER_MIN` | `100` |

> Never commit real secrets. Use k8s Secrets in production (see `k8s/` folder).
## API Endpoints

Full endpoint collection available in [postman/order-processing.postman_collection.json](./postman/order-processing.postman_collection.json)

**Auth** (`/api/auth/*`)
- `POST /register` — Register new user
- `POST /login` — Login (returns JWT)
- `POST /refresh` — Refresh access token
- `GET /me` — Current user (requires auth)

**Products** (`/api/products/*`)
- `GET /` — List all products (cached 5 min)
- `GET /:id` — Get product (cached)
- `POST /` — Create (admin only)
- `PATCH /:id` — Update (admin only)

**Orders** (`/api/orders/*`)
- `POST /` — Create order (requires `Idempotency-Key` header)
- `GET /` — List my orders
- `GET /:id` — Get order details
- `PATCH /:id/status` — Update status (admin only)

**Notifications** (`/api/notifications/*`)
- `GET ?orderId=<id>` — Get notifications (admin only)

**Health** (all services)
- `GET /health/live` — Service is running
- `GET /health/ready` — Service is ready (DB/Redis/RabbitMQ connected)
- `GET /health` — Gateway aggregated health
- `GET /metrics` — Circuit breaker stats
## Troubleshooting

| Issue | Fix |
| --- | --- |
| Containers won't start | Check Docker logs: `docker compose logs <service>` |
| Port 6379 already in use | Kill old Redis container: `docker rm redis-5` |
| Services timeout waiting for DB | Increase Docker memory (may need 4GB+) |
| 503 Upstream Unavailable | A service is down; check `/api/metrics` or service logs |
| `Idempotency-Key required` | Add header to POST `/api/orders` |
| RabbitMQ connection errors | Wait for RabbitMQ to boot or restart: `docker compose restart` |

**View Logs:**
```bash
docker compose logs -f order-service    # Single service
docker compose logs                     # All services
```

---

## 7. Layout

```
.
├── docker-compose.yml          # full stack
├── nginx/nginx.conf            # edge proxy (SSL + gzip + upstream)
├── shared/                     # logger, errors, tracing, broker, redis, http-client
├── services/
│   ├── api-gateway/            # routing, rate-limit, breakers, health agg
│   ├── auth-service/           # JWT + refresh, RBAC
│   ├── product-service/        # catalog + atomic stock reservation
│   ├── order-service/          # saga orchestrator (choreography), idempotency
│   └── notification-service/   # async consumer of order events
├── postman/                    # importable collection
├── k8s/                        # order-service Deployment + HPA + Service + ConfigMap + Secret
└── .github/workflows/ci.yml    # lint → test → build → docker-push on PR
```
## Project Structure

```
.
├── docker-compose.yml              # Full stack definition
├── nginx/                          # Reverse proxy configuration
├── shared/                         # Shared utilities (logging, errors, redis, broker)
├── services/
│   ├── api-gateway/                # Request routing & circuit breakers
│   ├── auth-service/               # JWT authentication
│   ├── product-service/            # Product catalog & stock
│   ├── order-service/              # Order processing
│   └── notification-service/       # Event-driven notifications
├── postman/                        # API collection for testing
├── k8s/                            # Kubernetes manifests
└── README.md                       # This file
```

UNLICENSED — interview project.
