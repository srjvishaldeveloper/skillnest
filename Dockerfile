# ===== Stage 1: Install deps + generate Prisma client =====
FROM node:18-alpine AS deps
RUN apk add --no-cache openssl ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma/
RUN npx prisma generate

# ===== Stage 2: Build Next.js application =====
FROM node:18-alpine AS builder
RUN apk add --no-cache openssl ffmpeg
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy env vars required by next build's static page collection (overridden at runtime)
ENV AUTH_SECRET=build-time-placeholder-secret-min-32-chars-ok
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production-safe migration check (no dev server, no --name flag)
RUN npx prisma migrate deploy || true
RUN npm run build

# ===== Stage 3: Production runtime =====
FROM node:18-alpine AS runner
RUN apk add --no-cache openssl ffmpeg
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
