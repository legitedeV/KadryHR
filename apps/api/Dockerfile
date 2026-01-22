FROM node:20-alpine AS base
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/api/package.json apps/api/tsconfig.json apps/api/drizzle.config.ts apps/api/vitest.config.ts ./apps/api/
COPY apps/web/package.json apps/web/tsconfig.json apps/web/tsconfig.node.json apps/web/vite.config.ts ./apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS build
# WAŻNE: kopiujemy CAŁY /repo z deps (zawiera też apps/*/node_modules symlinki pnpm)
COPY --from=deps /repo/ /repo/
# a teraz dokładamy kod z repo (node_modules i tak jest wykluczony przez .dockerignore)
COPY . .
RUN pnpm --filter @kadryhr/api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# najprościej: bierzemy gotowe node_modules z build (działa, choć większy obraz)
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/apps/api/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
