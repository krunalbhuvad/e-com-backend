FROM node:20-alpine AS deps
WORKDIR /workspace
RUN apk add --no-cache --virtual .build-deps build-base python3

COPY shared/ ./shared/
COPY services/product-service/package.json ./services/product-service/

WORKDIR /workspace/shared
RUN npm install --omit=dev

WORKDIR /workspace/services/product-service
RUN npm install --omit=dev && apk del .build-deps

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --chown=app:app --from=deps /workspace/shared ./shared
COPY --chown=app:app --from=deps /workspace/services/product-service/node_modules ./services/product-service/node_modules
COPY --chown=app:app services/product-service ./services/product-service
USER app
WORKDIR /app/services/product-service
EXPOSE 4002
CMD ["node", "src/server.js"]
