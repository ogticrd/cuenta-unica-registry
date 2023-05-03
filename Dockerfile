FROM node:lts-alpine as build

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

# defining environment variables
ARG REACT_APP_SOCKET_FACIAL_URL
ENV REACT_APP_SOCKET_FACIAL_URL=${REACT_APP_SOCKET_FACIAL_URL}

ARG NEXT_PUBLIC_IAM_API
ENV NEXT_PUBLIC_IAM_API=${NEXT_PUBLIC_IAM_API}

ARG NEXT_PUBLIC_CEDULA_API
ENV NEXT_PUBLIC_CEDULA_API=${NEXT_PUBLIC_CEDULA_API}

ARG NEXT_PUBLIC_CEDULA_API_KEY
ENV NEXT_PUBLIC_CEDULA_API_KEY=${NEXT_PUBLIC_CEDULA_API_KEY}

ARG NEXT_PUBLIC_SITE_KEY
ENV NEXT_PUBLIC_SITE_KEY=${NEXT_PUBLIC_SITE_KEY}

# build
RUN yarn build
# remove dev dependencies
RUN npm prune --production

FROM node:lts-alpine as release
WORKDIR /app
# copy from build image
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

ENV PORT 8080
ENV HOST 0.0.0.0

EXPOSE ${PORT}

CMD ["yarn", "start"]