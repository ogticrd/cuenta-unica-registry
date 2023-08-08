# syntax=docker/dockerfile:1
# ===================== Create base stage =====================
ARG NODE_VERSION=lts
ARG ALPINE_VERSION=3.16
ARG WORK_DIR=/app
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base

ARG WORK_DIR
ARG APP_ENV=production

ENV PORT=3000
ENV WORK_DIR=${WORK_DIR}
ENV NODE_ENV=${APP_ENV}
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR ${WORK_DIR}

# ==== App specific variables

ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=${NEXT_PUBLIC_RECAPTCHA_SITE_KEY}

ARG NEXT_PUBLIC_GOOGLE_ANALYTICS
ENV NEXT_PUBLIC_GOOGLE_ANALYTICS=${NEXT_PUBLIC_GOOGLE_ANALYTICS}

# ===================== Install Deps =====================
FROM base as deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

COPY package.json yarn.lock ./
RUN yarn install --production=true --frozen-lockfile --non-interactive

# ===================== Build Stage =====================
# Rebuild the source code only when needed
FROM base as build

COPY --from=deps ${WORK_DIR}/node_modules ./node_modules
COPY . .

RUN --mount=type=secret,id=AWS_EXPORTS_JSON,target=./src/aws-exports.js \
    ls -la src/ && \
    yarn build

# ===================== App Runner Stage =====================
FROM base as runner

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy all necessary files
COPY --from=build ${WORK_DIR}/public ./public

# Automatically leverage output traces to reduce image size 
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=build --chown=nextjs:nodejs ${WORK_DIR}/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs ${WORK_DIR}/.next/static ./.next/static

USER nextjs

EXPOSE ${PORT}

CMD ["node", "server.js"]
