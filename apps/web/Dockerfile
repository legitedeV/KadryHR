FROM node:20-alpine AS base
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/tsconfig.node.json apps/web/vite.config.ts ./apps/web/
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /repo/ /repo/
COPY . .
RUN pnpm --filter @kadryhr/web build

FROM nginx:alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
