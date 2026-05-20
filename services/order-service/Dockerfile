FROM node:20-alpine AS deps
WORKDIR /workspace
RUN apk add --no-cache --virtual .build-deps build-base python3

COPY shared/ ./shared/
COPY services/order-service/package.json ./services/order-service/

WORKDIR /workspace/shared
RUN npm install --omit=dev

WORKDIR /workspace/services/order-service
RUN npm install --omit=dev && apk del .build-deps

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --chown=app:app --from=deps /workspace/shared ./shared
COPY --chown=app:app --from=deps /workspace/services/order-service/node_modules ./services/order-service/node_modules
COPY --chown=app:app services/order-service ./services/order-service
USER app
WORKDIR /app/services/order-service
EXPOSE 4003
CMD ["node", "src/server.js"]
