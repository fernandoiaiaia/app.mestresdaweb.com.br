FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
RUN pnpm install -g turbo
COPY . .
RUN turbo prune web-cliente --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm turbo run build --filter=web-cliente...

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=1300

# Copy standalone output + static assets + public
COPY --from=installer /app/apps/Web\ Cliente/.next/standalone ./
COPY --from=installer /app/apps/Web\ Cliente/.next/static ./apps/Web\ Cliente/.next/static
COPY --from=installer /app/apps/Web\ Cliente/public ./apps/Web\ Cliente/public

EXPOSE 1300
CMD ["node", "apps/Web Cliente/server.js"]
