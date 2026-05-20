# notification-service

Owns `notification_db`. Async consumer of `order.created` events; admin-debug HTTP for reading the log.

## Endpoints

| Method | Path                              | Auth  | Notes                              |
| ------ | --------------------------------- | ----- | ---------------------------------- |
| GET    | `/notifications?orderId=<id>`     | admin |                                    |
| GET    | `/health/live`                    | none  |                                    |
| GET    | `/health/ready`                   | none  | DB + RabbitMQ                      |

## Async behaviour

Consumes `order.created` from `orders.events` exchange via queue `notification.order-created.q`, declared with DLX `orders.events.dlx`. The handler is idempotent — repeated delivery for the same `orderId` skips re-insert.

The Postman collection includes a "simulate notification failure" request that publishes a message with header `x-simulate-failure: true`. The consumer throws → message is nacked to the DLQ — visible at http://localhost:15672 (guest/guest).
