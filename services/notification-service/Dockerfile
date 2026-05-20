FROM node:20-alpine AS deps
WORKDIR /workspace
RUN apk add --no-cache --virtual .build-deps build-base python3

COPY shared/ ./shared/
COPY services/notification-service/package.json ./services/notification-service/

WORKDIR /workspace/shared
RUN npm install --omit=dev

WORKDIR /workspace/services/notification-service
RUN npm install --omit=dev && apk del .build-deps

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --chown=app:app --from=deps /workspace/shared ./shared
COPY --chown=app:app --from=deps /workspace/services/notification-service/node_modules ./services/notification-service/node_modules
COPY --chown=app:app services/notification-service ./services/notification-service
USER app
WORKDIR /app/services/notification-service
EXPOSE 4004
CMD ["node", "src/server.js"]
