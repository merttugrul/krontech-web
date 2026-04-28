# ─── Multi-stage Dockerfile (development friendly) ───
# Bu Dockerfile development modunda çalışır (hot-reload).
# Production build için ileride ek stage eklenecek.

FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY prisma ./prisma
RUN npx prisma generate

# ─── Development runtime ───
FROM node:20-alpine AS development

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat curl

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy 2>/dev/null || true && npm run start:dev"]
