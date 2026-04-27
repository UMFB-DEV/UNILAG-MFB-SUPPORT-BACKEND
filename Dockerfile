# Build stage
FROM node:20-bullseye AS builder

WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src

RUN npm run build


# Runtime stage
FROM node:20-bullseye-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy & node dist/server.js"]
