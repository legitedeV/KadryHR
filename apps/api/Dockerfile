FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl1.1-compat
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --filter @kadryhr/api... --frozen-lockfile || pnpm install --filter @kadryhr/api...

FROM base AS build
COPY package.json pnpm-workspace.yaml ./
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/api apps/api
COPY packages/ui packages/ui
COPY packages/config packages/config
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
RUN pnpm --filter @kadryhr/api prisma:generate
RUN pnpm --filter @kadryhr/api build

FROM base AS runner
WORKDIR /app/apps/api
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/main.js"]
