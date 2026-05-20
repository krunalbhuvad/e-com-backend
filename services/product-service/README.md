# product-service

Owns `product_db`. Catalog CRUD, atomic stock reservation/release, cache-aside reads.

## Endpoints

| Method | Path                | Auth   | Notes                                       |
| ------ | ------------------- | ------ | ------------------------------------------- |
| GET    | `/products`         | none   | Cache-aside (5-min TTL)                     |
| GET    | `/products/:id`     | none   | Cache-aside                                 |
| POST   | `/products`         | admin  |                                             |
| PATCH  | `/products/:id`     | admin  | Invalidates cache + publishes `product.updated` |
| POST   | `/products/reserve` | bearer | Internal — atomic stock decrement          |
| POST   | `/products/release` | bearer | Internal — atomic stock increment          |
| GET    | `/health/live`      | none   |                                             |
| GET    | `/health/ready`     | none   | DB + Redis + RabbitMQ                       |

## Saga participation

Consumes `stock.release.requested` (routing key in `stock.events` exchange) and releases the reservation. This is the compensating step when order-service fails to persist after reserving stock.
