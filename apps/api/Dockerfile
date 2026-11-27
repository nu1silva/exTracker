# syntax=docker/dockerfile:1
# Build from the repository root: docker build -f apps/api/Dockerfile .

FROM node:26-alpine AS build
RUN npm install --global pnpm@12.23.0 && npm cache clean --force
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @extracker/api...
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @extracker/api build \
 && pnpm --filter @extracker/api deploy --prod /out

FROM node:26-alpine AS release
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
USER node

# One-shot: applies pending migrations, then exits.
FROM release AS migrate
CMD ["node", "dist/migrate.js"]

FROM release AS api
EXPOSE 3000
CMD ["node", "dist/server.js"]
