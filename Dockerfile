# OPUS web (Next.js standalone). Build context = repository root.
# ISO 27001 A.8.2 / A.10.1.1: Never bake secrets into the image; inject at runtime via env/orchestrator.
# KO: 이미지에 .env·시크릿을 넣지 말고 런타임 주입한다.
# JA: シークレットはイメージに焼かずランタイムで注入する。
# EN: Never bake secrets into the image; inject at runtime.

FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo@2.8.20 prune @opus/web --docker

FROM base AS builder
WORKDIR /app
# Keep Node heap well under t4g.micro RAM+swap so builds don't OOM.
ENV NODE_OPTIONS="--max-old-space-size=768"
ENV NEXT_TELEMETRY_DISABLED=1
# flat node_modules (pnpm 가상 스토어 대신) → 디스크·레이어 사용량 감소, arm64 overlayfs 안정성↑
ENV NPM_CONFIG_NODE_LINKER=hoisted
ENV NPM_CONFIG_PREFER_FROZEN_LOCKFILE=true
ENV NPM_CONFIG_CHILD_CONCURRENCY=1
ENV NPM_CONFIG_NETWORK_CONCURRENCY=4
RUN printf 'node-linker=hoisted\nprefer-frozen-lockfile=true\nchild-concurrency=1\nnetwork-concurrency=4\n' > /app/.npmrc
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install \
      --frozen-lockfile \
      --prefer-offline \
      --config.node-linker=hoisted \
      --child-concurrency=1 \
      --network-concurrency=4
COPY --from=pruner /app/out/full/ .
# ISO 27001 A.14.2.8 (§8): Prisma client must be generated before Next build so API routes can resolve the engine.
# KO: 빌드 전에 Prisma 클라이언트를 생성해야 API 라우트가 엔진을 올바르게 로드한다.
# JA: Next ビルド前に Prisma クライアントを生成し、API ルートがエンジンを解決できるようにする。
# EN: Generate the Prisma client before the Next build so runtime API routes can load the engine.
RUN pnpm --filter @opus/web exec prisma generate
RUN pnpm exec turbo run build --filter=@opus/web --concurrency=1

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
# Prisma CLI (used by `migrate deploy` on boot) has a long transitive-dependency tail
# (@prisma/config → effect, @prisma/internals, @prisma/engines …). Tracing which ones are
# strictly needed is brittle, so carry the whole hoisted node_modules tree. Next standalone
# keeps its own trimmed copy under apps/web/.next/standalone/node_modules, so this extra
# copy only increases image size — it does not change runtime resolution for the server.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma ./apps/web/prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
