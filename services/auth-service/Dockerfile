FROM node:20-alpine AS deps
WORKDIR /workspace

RUN apk add --no-cache --virtual .build-deps build-base python3

COPY shared/ ./shared/
COPY services/auth-service/package.json ./services/auth-service/

WORKDIR /workspace/shared
RUN npm install --omit=dev

WORKDIR /workspace/services/auth-service
RUN npm install --omit=dev && apk del .build-deps

FROM node:20-alpine AS runtime
ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --chown=app:app --from=deps /workspace/shared ./shared
COPY --chown=app:app --from=deps /workspace/services/auth-service/node_modules ./services/auth-service/node_modules
COPY --chown=app:app services/auth-service ./services/auth-service

USER app
WORKDIR /app/services/auth-service
EXPOSE 4001
CMD ["node", "src/server.js"]
