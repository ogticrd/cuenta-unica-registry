# syntax=docker/dockerfile:1
# ===================== Create base stage =====================
ARG NODE_VERSION=lts
ARG WORK_DIR=/app
FROM node:${NODE_VERSION}-slim AS base

ARG WORK_DIR
ARG APP_ENV=production

ARG PORT=3000
ENV WORK_DIR=${WORK_DIR}
ENV NODE_ENV=${APP_ENV}
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR ${WORK_DIR}

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

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

ARG SENTRY_ORG
ENV SENTRY_ORG=${SENTRY_ORG}

ARG SENTRY_PROJECT
ENV SENTRY_PROJECT=${SENTRY_PROJECT}

# Install corepack y pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@latest corepack@latest \
    && corepack enable

# ===================== Install Deps =====================
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ===================== Build Stage =====================
FROM base AS build

RUN apt-get update \
    && apt-get install -y ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps ${WORK_DIR}/node_modules ./node_modules
COPY . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=type=cache,id=nextjs,target=/app/.next/cache \
    pnpm run build

ARG AWS_EXPORTS_JSON
RUN echo $AWS_EXPORTS_JSON | base64 -d > src/amplifyconfiguration.json

# ===================== App Runner Stage =====================
FROM base AS runner

RUN addgroup --gid 1001 --system nodejs \
    && adduser --system --no-create-home --uid 1001 nextjs

COPY --from=build ${WORK_DIR}/public ./public
COPY --from=build --chown=nextjs:nodejs ${WORK_DIR}/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs ${WORK_DIR}/.next/static ./.next/static

USER nextjs

EXPOSE ${PORT}
ENV PORT=${PORT}
ENV HOSTNAME=0.0.0.0

HEALTHCHECK CMD wget -q localhost:${PORT}

CMD ["node", "server.js"]
