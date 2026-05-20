# Order Processing System

Production-grade microservices backend for an e-commerce **Order Processing System**, built with Node.js, Express, MongoDB (Mongoose), RabbitMQ, Redis, and Docker. Five services behind an Express API Gateway behind Nginx.

> Companion docs:
> - **[ARCHITECTURE.md](./ARCHITECTURE.md)** — design decisions, the 5 mandatory architecture-question deep-dives, saga choreography, DB-per-service rationale.
> - **[VIVA_CHEATSHEET.md](./VIVA_CHEATSHEET.md)** — one-page summary of every tradeoff for last-minute revision.

---

## 1. Architecture diagram

```
              ┌────────────┐
   client ───►│   Nginx    │  SSL termination, gzip, upstream LB
              │   :80      │
              └─────┬──────┘
                    │
              ┌─────▼──────┐
              │ API Gateway│  routing, rate-limit, X-Request-ID,
              │   :8080    │  opossum circuit breakers, /health
              └─────┬──────┘
       ┌────────────┼────────────┬──────────────┐
       │            │            │              │
┌──────▼─────┐ ┌────▼─────┐ ┌────▼─────┐  ┌─────▼────────┐
│   Auth     │ │ Product  │ │  Order   │  │ Notification │
│  :4001     │ │  :4002   │ │  :4003   │  │   :4004      │
│ auth_db    │ │product_db│ │ order_db │  │notification_ │
└──────┬─────┘ └────┬─────┘ └────┬─────┘  │     db       │
       │            │            │        └──────▲───────┘
       │            │   sync REST│               │
       │            │◄───────────┤               │
       │            │            │               │
       │     ┌──────▼────────────▼───────────────┴──┐
       │     │             RabbitMQ                 │
       │     │  exchanges: orders.events,           │
       │     │             stock.events             │
       │     │  events:    order.created,           │
       │     │             stock.release.requested  │
       │     │  queues w/ DLQ:                      │
       │     │             notification.order-created.q
       │     │             product.stock-release.q  │
       │     └──────────────────────────────────────┘
       │
       └─── shared Redis: rate-limit counters, product cache-aside, idempotency keys
```

| Service              | Port | Owns                | Public path prefix |
| -------------------- | ---- | ------------------- | ------------------ |
| api-gateway          | 8080 | —                   | `/api/*`           |
| auth-service         | 4001 | `auth_db`           | `/api/auth/*`      |
| product-service      | 4002 | `product_db`        | `/api/products/*`  |
| order-service        | 4003 | `order_db`          | `/api/orders/*`    |
| notification-service | 4004 | `notification_db`   | `/api/notifications/*` |

---

## 2. Prerequisites

- **Docker Desktop** 4.x (or Docker Engine 24+) with `docker compose` v2.
- **Node.js 20 LTS** locally (for running unit tests outside containers, optional).
- ~3 GB free RAM for the full stack.

---

## 3. Setup

```bash
# 1. Clone
git clone <repo-url> order-processing-system
cd order-processing-system

# 2. (Optional) edit per-service .env.example files if you want different secrets
#    The .env.example files are loaded directly by docker-compose — fine for dev.

# 3. Bring the whole stack up
docker compose up --build

# 4. Tail logs of one service
docker compose logs -f order-service
```

When healthy you should see all 9 containers (`mongo`, `redis`, `rabbitmq`, 5 services, `nginx`) reporting status `(healthy)` or `Up`.

| URL                                | What it is                            |
| ---------------------------------- | ------------------------------------- |
| http://localhost                   | Nginx → API Gateway                   |
| http://localhost:8080              | API Gateway (direct)                  |
| http://localhost:8080/health       | Aggregated health of all services     |
| http://localhost:8080/metrics      | Circuit breaker stats                 |
| http://localhost:15672             | RabbitMQ UI (guest / guest)           |

---

## 4. Environment variables

Each service ships an `.env.example` that doubles as the dev `.env`. Boot-time validation (`shared/env.js` + Joi) refuses to start a service whose env is malformed.

| Var                    | Used by               | Example                              |
| ---------------------- | --------------------- | ------------------------------------ |
| `PORT`                 | every service         | `4001`                               |
| `NODE_ENV`             | every service         | `development` / `production`         |
| `LOG_LEVEL`            | every service         | `info`                               |
| `MONGO_URI`            | auth/product/order/notification | `mongodb://mongo:27017/auth_db` |
| `REDIS_URL`            | gateway/product/order | `redis://redis:6379`                 |
| `RABBITMQ_URL`         | product/order/notification | `amqp://guest:guest@rabbitmq:5672` |
| `JWT_ACCESS_SECRET`    | auth + every service that verifies | min 32 chars               |
| `JWT_ACCESS_TTL`       | auth                  | `15m`                                |
| `JWT_REFRESH_TTL`      | auth                  | `7d`                                 |
| `BCRYPT_COST`          | auth                  | `12`                                 |
| `CORS_ALLOWLIST`       | gateway               | `http://localhost:3000` (comma-sep)  |
| `RATE_LIMIT_IP_PER_MIN`| gateway               | `100`                                |
| `RATE_LIMIT_USER_PER_MIN` | gateway            | `1000`                               |
| `PRODUCT_SERVICE_URL`  | gateway, order        | `http://product-service:4002`        |

> **Never** commit real secrets. The `.env.example` values are dev placeholders. Production uses k8s Secrets (see `k8s/order-service-secret.yaml`).

---

## 5. API endpoints

A Postman collection is committed at [`postman/order-processing.postman_collection.json`](./postman/order-processing.postman_collection.json) with all working examples below.

### Auth

| Method | Path                 | Auth   | Body                                                  |
| ------ | -------------------- | ------ | ----------------------------------------------------- |
| POST   | `/api/auth/register` | none   | `{ email, password, name, role? }`                    |
| POST   | `/api/auth/login`    | none   | `{ email, password }`                                 |
| POST   | `/api/auth/refresh`  | none   | `{ refreshToken }`                                    |
| POST   | `/api/auth/logout`   | bearer | `{ refreshToken }`                                    |
| GET    | `/api/auth/me`       | bearer | —                                                     |

### Products

| Method | Path                       | Auth   | Notes                                                   |
| ------ | -------------------------- | ------ | ------------------------------------------------------- |
| GET    | `/api/products`            | any    | Cache-aside, 5-min TTL                                  |
| GET    | `/api/products/:id`        | any    | Cache-aside                                             |
| POST   | `/api/products`            | admin  | Create                                                  |
| PATCH  | `/api/products/:id`        | admin  | Update + invalidates cache via event                    |
| POST   | `/api/products/reserve`    | service | Internal — atomic stock decrement, returns reservation |

### Orders

| Method | Path                  | Auth   | Headers                          |
| ------ | --------------------- | ------ | -------------------------------- |
| POST   | `/api/orders`         | bearer | `Idempotency-Key: <uuid>` (required) |
| GET    | `/api/orders/:id`     | bearer | —                                |
| GET    | `/api/orders`         | bearer | List the caller's orders         |
| PATCH  | `/api/orders/:id/status` | admin | `{ status: "SHIPPED" }` etc.    |

### Notifications

| Method | Path                                   | Auth  |
| ------ | -------------------------------------- | ----- |
| GET    | `/api/notifications?orderId=<id>`      | admin |

### Health

| Method | Path             | Notes                                              |
| ------ | ---------------- | -------------------------------------------------- |
| GET    | `/health/live`   | Every service. 200 once the process is up.         |
| GET    | `/health/ready`  | Every service. 503 if DB/broker/redis unreachable. |
| GET    | `/health`        | Gateway-only. Aggregates all 4 downstream `/ready`.|
| GET    | `/metrics`       | Gateway + order — circuit-breaker stats (JSON).    |

---

## 6. Troubleshooting

| Symptom                                                     | Likely cause / fix                                                                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `service depends on mongo: container_started` hangs         | Mongo healthcheck failing; check `docker logs ops-mongo`. On low-RAM hosts the Mongo daemon OOMs.        |
| `EAI_AGAIN ... redis` from a service                        | Redis container not ready yet — services back off and retry. If it persists, restart Redis only.        |
| `Idempotency-Key required` on POST `/api/orders`            | Add the header. Spec mandates it.                                                                       |
| Place-order returns 503 with `code: "UPSTREAM_UNAVAILABLE"` | Product Service down / breaker open. Hit `/metrics` on the gateway to confirm `open` state.             |
| `ECONNREFUSED 5672`                                         | RabbitMQ slow to boot — services exit after the boot timeout. `docker compose restart <service>`.       |
| `helmet` blocks an embedded UI                              | Adjust CORS allowlist via `CORS_ALLOWLIST` — never set `*` in prod.                                     |

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

---

## 8. License

UNLICENSED — interview project.
