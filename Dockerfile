# syntax=docker/dockerfile:1
# ===================== Create base stage =====================
ARG NODE_VERSION=lts
ARG ALPINE_VERSION=3.16
ARG WORK_DIR=/app
FROM node:${NODE_VERSION}-slim AS base

ARG WORK_DIR
ARG APP_ENV=production

ARG PORT=3000
ENV WORK_DIR=${WORK_DIR}
ENV NODE_ENV=${APP_ENV}
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR ${WORK_DIR}

# ==== App specific variables

ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=${NEXT_PUBLIC_RECAPTCHA_SITE_KEY}

ARG NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_GTM_ID=${NEXT_PUBLIC_GTM_ID}

ARG NEXT_PUBLIC_ORY_SDK_URL
ENV NEXT_PUBLIC_ORY_SDK_URL=${NEXT_PUBLIC_ORY_SDK_URL}

ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

ARG SENTRY_ORG
ENV SENTRY_ORG=${SENTRY_ORG}

ARG SENTRY_PROJECT
ENV SENTRY_PROJECT=${SENTRY_PROJECT}

# Install corepack and set pnpm as default package manager
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ===================== Install Deps =====================
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
# By caching the content-addressable store we stop downloading the same packages again and again
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# ===================== Build Stage =====================
# Rebuild the source code only when needed
FROM base AS build

COPY --from=deps ${WORK_DIR}/node_modules ./node_modules
COPY . .

COPY . ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN --mount=type=secret,id=AWS_EXPORTS_JSON,target=./src/aws-exports.js \
    pnpm run build

# ===================== App Runner Stage =====================
FROM base AS runner

RUN addgroup --gid 1001 --system nodejs && \
    adduser --system --no-create-home --uid 1001 nextjs

# Copy all necessary files
COPY --from=build ${WORK_DIR}/public ./public

# Automatically leverage output traces to reduce image size 
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=build --chown=nextjs:nodejs ${WORK_DIR}/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs ${WORK_DIR}/.next/static ./.next/static

USER nextjs

EXPOSE ${PORT}

ENV PORT ${PORT}
ENV HOSTNAME 0.0.0.0

HEALTHCHECK CMD wget -q localhost:3000

CMD ["node", "server.js"]
