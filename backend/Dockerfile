# ---- Stage 1: Builder ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

# Remove dev dependencies, then forcibly remove the Prisma CLI bloat that
# survives pruning because @prisma/client declares `prisma` as a peerOptional dep.
# The running app needs @prisma/client and .prisma/client — NOT the prisma CLI.
RUN npm prune --omit=dev \
    && rm -rf node_modules/prisma node_modules/effect node_modules/fast-check node_modules/typescript

# ---- Stage 2: Runner ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./

# Copy the cleaned node_modules from the builder (production deps + Prisma client,
# with the CLI bloat already removed in the builder stage)
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/index.js"]