# syntax=docker/dockerfile:1

# ===================== Base =====================
FROM oven/bun:1-slim AS base

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars must be present at build time (baked into the JS bundle).
ARG NEXT_PUBLIC_ORY_SDK_URL
ARG NEXT_PUBLIC_AWS_REGION
ARG NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID
ARG NEXT_PUBLIC_COGNITO_USER_POOL_ID
ARG NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID

ENV NEXT_PUBLIC_ORY_SDK_URL=${NEXT_PUBLIC_ORY_SDK_URL}
ENV NEXT_PUBLIC_AWS_REGION=${NEXT_PUBLIC_AWS_REGION}
ENV NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=${NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID}
ENV NEXT_PUBLIC_COGNITO_USER_POOL_ID=${NEXT_PUBLIC_COGNITO_USER_POOL_ID}
ENV NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=${NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID}

# ===================== Install dependencies =====================
FROM base AS deps

COPY package.json bun.lock bunfig.toml ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# ===================== Build =====================
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN --mount=type=cache,target=/root/.bun/install/cache \
    --mount=type=cache,target=/app/.next/cache \
    bun run build

# ===================== Runner =====================
FROM base AS runner

RUN groupadd --gid 1001 --system nodejs \
    && useradd --system --no-create-home --uid 1001 --gid nodejs nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ARG PORT=3000
EXPOSE ${PORT}
ENV PORT=${PORT}
ENV HOSTNAME=0.0.0.0

HEALTHCHECK CMD wget -qO- http://localhost:${PORT}/ || exit 1

CMD ["bun", "run", "server.js"]
