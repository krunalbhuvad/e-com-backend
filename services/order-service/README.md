# order-service

Owns `order_db`. Order placement (saga choreography), status lifecycle.

## Endpoints

| Method | Path                    | Auth   | Notes                                          |
| ------ | ----------------------- | ------ | ---------------------------------------------- |
| POST   | `/orders`               | bearer | `Idempotency-Key` header required              |
| GET    | `/orders`               | bearer | List the caller's orders                       |
| GET    | `/orders/:id`           | bearer | Owner or admin only                            |
| PATCH  | `/orders/:id/status`    | admin  | State-machine enforced                         |
| GET    | `/health/live`          | none   |                                                |
| GET    | `/health/ready`         | none   | DB + Redis + RabbitMQ                          |
| GET    | `/metrics`              | none   | Circuit-breaker stats                          |

## Saga

`POST /orders` orchestrates a choreography-style saga:

1. Atomic idempotency claim in Redis (`SETNX`, 60 s reservation TTL).
2. Sync REST to product-service `POST /products/reserve` (circuit-broken via opossum).
3. Persist order doc as `PENDING`. **If this fails**, publish `stock.release.requested` for the compensating product reservation release.
4. Publish `order.created` to `orders.events` exchange — notification-service consumes asynchronously.
5. Store the response in Redis under the idempotency key (TTL 24 h) for replays.

See [ARCHITECTURE.md §4](../../ARCHITECTURE.md#4-saga-choreography-for-the-order-flow) for the full diagram and reasoning.
