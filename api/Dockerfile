# Stage 1: Build & compile
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-timeout 600000

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit
RUN npx prisma generate

COPY tsconfig*.json ./
COPY src ./src/

RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=4000
ENV PATH="/app/node_modules/.bin:${PATH}"

COPY package*.json ./
COPY prisma ./prisma/

# Copy all node_modules and compiled application from builder (zero network re-downloads)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
# Fix CRLF to LF in case written on Windows
RUN sed -i 's/\r$//' docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]
