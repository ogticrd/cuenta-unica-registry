#!/bin/sh

IMAGE_NAME=cuc-registry:latest
AWS_EXPORTS_PATH=./src/amplifyconfiguration.json

# to use the variables, run this in your terminal
#   export $(grep -v '^#' .env | xargs)
 
docker build \
  --secret id=AWS_EXPORTS_JSON,src=$AWS_EXPORTS_PATH \
  --build-arg SENTRY_ORG=$SENTRY_ORG \
  --build-arg SENTRY_PROJECT=$SENTRY_PROJECT \
  --build-arg SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
  --build-arg NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
  --build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY \
  --build-arg NEXT_PUBLIC_SENTRY_ENV=$NEXT_PUBLIC_SENTRY_ENV \
  -t $IMAGE_NAME .

unset IMAGE_NAME
