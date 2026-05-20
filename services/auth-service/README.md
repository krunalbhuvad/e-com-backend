# auth-service

Owns `auth_db`. JWT issuance + refresh + role-based access.

## Endpoints

| Method | Path             | Auth   | Body                                  |
| ------ | ---------------- | ------ | ------------------------------------- |
| POST   | `/auth/register` | none   | `{ email, password, name, role? }`    |
| POST   | `/auth/login`    | none   | `{ email, password }`                 |
| POST   | `/auth/refresh`  | none   | `{ refreshToken }`                    |
| POST   | `/auth/logout`   | none   | `{ refreshToken }`                    |
| GET    | `/auth/me`       | bearer | —                                     |
| GET    | `/health/live`   | none   | —                                     |
| GET    | `/health/ready`  | none   | —                                     |

## Notes

- Passwords: bcrypt cost 12 (configurable via `BCRYPT_COST`).
- Refresh tokens: 256-bit random, stored as SHA-256 hash. Rotation on every refresh.
- Algorithm allowlist: HS256 only (alg-confusion-attack defence). Switch path to RS256 documented in [ARCHITECTURE.md §3](../../ARCHITECTURE.md#3-authentication-hs256-today-rs256--rotation-in-production).
- User enumeration: identical error messages for wrong-email and wrong-password.
