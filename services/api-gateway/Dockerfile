FROM node:20-alpine AS deps
WORKDIR /workspace

COPY shared/ ./shared/
COPY services/api-gateway/package.json ./services/api-gateway/

WORKDIR /workspace/shared
RUN npm install --omit=dev

WORKDIR /workspace/services/api-gateway
RUN npm install --omit=dev

FROM node:20-alpine AS runtime
ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --chown=app:app --from=deps /workspace/shared ./shared
COPY --chown=app:app --from=deps /workspace/services/api-gateway/node_modules ./services/api-gateway/node_modules
COPY --chown=app:app services/api-gateway ./services/api-gateway

USER app
WORKDIR /app/services/api-gateway
EXPOSE 8080

CMD ["node", "src/server.js"]
