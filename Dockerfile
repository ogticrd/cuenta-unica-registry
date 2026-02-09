# syntax=docker/dockerfile:1.7

# ===================== Base stage =====================
FROM oven/bun:1 AS base

ARG WORK_DIR
ARG APP_ENV=production
ARG PORT=3000

ENV WORK_DIR=${WORK_DIR}
ENV NODE_ENV=${APP_ENV}
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR ${WORK_DIR}

# Install system dependencies (adduser, wget)
RUN apt-get update \
    && apt-get install -y --no-install-recommends adduser wget \
    && rm -rf /var/lib/apt/lists/*

# ==== App specific variables (igual que antes) ====
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=${NEXT_PUBLIC_RECAPTCHA_SITE_KEY}

ARG NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_GTM_ID=${NEXT_PUBLIC_GTM_ID}

ARG NEXT_PUBLIC_ORY_SDK_URL
ENV NEXT_PUBLIC_ORY_SDK_URL=${NEXT_PUBLIC_ORY_SDK_URL}

ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}

ARG NEXT_PUBLIC_SENTRY_ENV
ENV NEXT_PUBLIC_SENTRY_ENV=${NEXT_PUBLIC_SENTRY_ENV}

ARG NEXT_PUBLIC_LIVENESS_TIMEOUT_SECONDS
ENV NEXT_PUBLIC_LIVENESS_TIMEOUT_SECONDS=${NEXT_PUBLIC_LIVENESS_TIMEOUT_SECONDS}

ARG NEXT_PUBLIC_LUHN_EXCEPTION_HASHES
ENV NEXT_PUBLIC_LUHN_EXCEPTION_HASHES=${NEXT_PUBLIC_LUHN_EXCEPTION_HASHES}

# ---- Private build envs ----
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

ARG SENTRY_ORG
ENV SENTRY_ORG=${SENTRY_ORG}

ARG SENTRY_PROJECT
ENV SENTRY_PROJECT=${SENTRY_PROJECT}

# ===================== Dependencies stage =====================
FROM base AS deps

COPY package.json bun.lock ./

RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# ===================== Build stage =====================
FROM base AS build

# Only needed for HTTPS calls during build (e.g. Sentry uploads)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps ${WORK_DIR}/node_modules ./node_modules
COPY . .

# Inject Amplify config (kept late to minimize cache busting)
ARG AWS_EXPORTS_JSON
RUN echo "$AWS_EXPORTS_JSON" | base64 -d > src/amplifyconfiguration.json

# Build with persistent caches
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    --mount=type=cache,id=nextjs,target=/app/.next/cache \
    bun run build

# ===================== Runtime stage =====================
FROM base AS runner

ARG WORK_DIR
ARG PORT=3000

ENV NODE_ENV=production
ENV WORK_DIR=${WORK_DIR}

WORKDIR ${WORK_DIR}

# Non-root user
RUN addgroup --gid 1001 --system nodejs \
    && adduser  --uid 1001 --system --no-create-home nextjs

# Copy minimal runtime output
COPY --from=build ${WORK_DIR}/public ./public
COPY --from=build --chown=nextjs:nodejs ${WORK_DIR}/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs ${WORK_DIR}/.next/static ./.next/static

USER nextjs

EXPOSE ${PORT}
ENV PORT=${PORT}
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -qO- http://localhost:${PORT} || exit 1

CMD ["bun", "server.js"]
