FROM node:lts-alpine as build
WORKDIR /app
COPY package.json yarn.lock ./
# install dependencies
RUN yarn install --frozen-lockfile
COPY . .
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