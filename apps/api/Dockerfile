FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
RUN pnpm install -g turbo
COPY . .
RUN turbo prune api --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
# Generate prisma client and build api
RUN pnpm --filter api exec prisma generate
RUN pnpm turbo run build --filter=api...

FROM base AS runner
WORKDIR /app
COPY --from=installer /app .
ENV NODE_ENV=production

# Create upload directories so they exist as mount points
RUN mkdir -p /app/apps/api/storage/uploads/avatars \
             /app/apps/api/storage/uploads/domain \
             /app/apps/api/storage/uploads/comments \
             /app/apps/api/uploads/task-attachments \
             /app/apps/api/uploads/project-documents \
             /app/apps/api/uploads/deal-files

EXPOSE 8080
CMD ["sh", "-c", "pnpm --filter api exec prisma migrate deploy && pnpm --filter api start"]
