# ==========================================
# Multi-Stage Dockerfile for NestJS + Prisma
# Optimized for Render & Production Deployments
# ==========================================

# 1. Base image with pnpm support
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# 2. Dependencies stage (installs all deps for build)
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# 3. Builder stage (compiles TypeScript & generates Prisma Client)
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build NestJS production bundle
RUN pnpm build

# Prune devDependencies to keep image lean
RUN pnpm prune --prod

# 4. Production Runner stage (lean runtime image)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy production dependencies and built application
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]
