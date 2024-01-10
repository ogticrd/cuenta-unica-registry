# How to run on Docker

If you're trying to run this project on a local machine with Docker, follow this steps.

## Load all the environment variables from the .env file

```sh
export $(grep -v '^#' .env | xargs)
```

## Build the image

```sh
docker build \
  --secret id=AWS_EXPORTS_JSON,src=$AWS_EXPORTS_PATH \
  --build-arg SENTRY_ORG=$SENTRY_ORG \
  --build-arg SENTRY_PROJECT=$SENTRY_PROJECT \
  --build-arg SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
  --build-arg NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
  --build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY \
  -t $IMAGE_NAME .
```

## Run the image

```sh
docker run \
  --env-file=./.env \
  -p 3000:3000 \
  $IMAGE_NAME
```
