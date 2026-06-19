# Deployment environments

This project uses three long-lived GitHub environments:

- `development`: deployed from the `develop` branch.
- `staging`: deployed from the `staging` branch.
- `Production`: deployed only from published releases whose tag commit is contained in `master`.

The `master` branch is production source of truth. The `staging` branch should mirror production until a release candidate is promoted into it. The `develop` branch carries active v2 development.

## Public variables

Set these values under **Settings -> Environments -> <environment> -> Environment variables**.

| Name | development | staging | Production |
| --- | --- | --- | --- |
| `APP_NAME` | `cuenta-unica-registry-dev` | `cuenta-unica-registry` | `cuenta-unica-registry` |
| `CLOUD_RUN_SERVICE` | `cuenta-unica-registry-dev` | `cuenta-unica-registry` | `cuenta-unica-registry` |
| `IMAGE_NAME` | `cuenta-unica-registry-dev` | `cuenta-unica-registry` | `cuenta-unica-registry` |
| `GOOGLE_ARTIFACT_REGISTRY` | `us-docker.pkg.dev/auth-do/auth-frontend/auth-registry-frontend` | project registry | project registry |
| `GOOGLE_PROJECT_ID` | `auth-do` | staging GCP project | production GCP project |
| `GOOGLE_CLOUD_REGION` | `us-east1` | Cloud Run region | Cloud Run region |
| `ORY_SDK_URL` | `https://focused-gagarin-ywepc2q5bu.projects.oryapis.com` | staging Ory URL | production Ory URL |
| `NEXT_PUBLIC_ORY_SDK_URL` | `https://cuenta-unica-registry-dev-x6fzoay5ua-ue.a.run.app` | staging app URL | production app URL |
| `CITIZENS_API_BASE_URL` | `https://api.devs.digital.gob.do` | shared citizens API URL | production citizens API URL |
| `AWS_REGION` | `us-east-1` | Rekognition region | Rekognition region |
| `NEXT_PUBLIC_AWS_REGION` | `us-east-1` | Amplify region | Amplify region |
| `NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID` | `us-east-1:b1b2e698-23f3-4b5e-945c-ce2a5bc92fc2` | Cognito identity pool ID | Cognito identity pool ID |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `us-east-1_4R9AQlkpf` | Cognito user pool ID | Cognito user pool ID |
| `NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID` | `6lkb58rrpita167ncvqmnkq1gl` | Cognito app client ID | Cognito app client ID |
| `LIVENESS_CONFIDENCE_THRESHOLD` | `90` | `90` unless changed by operations | production threshold |
| `FACE_SIMILARITY_THRESHOLD` | `80` | `80` unless changed by operations | production threshold |
| `BUZON_API_BASE_URL` | `https://buzon-ciudadano-staging-i42qq4zxeq-ue.a.run.app` | Buzon service URL | Buzon service URL |

`CLOUD_RUN_SERVICE` and `IMAGE_NAME` are optional in the workflow, but they should be set for `development` so dev deploys cannot overwrite the staging or production Cloud Run service.

`ORY_SDK_URL` is the server-side Ory endpoint. `NEXT_PUBLIC_ORY_SDK_URL` is baked into the frontend bundle and must point to the deployed app origin so browser self-service requests use the same-origin proxy instead of calling Ory cross-origin.

## Secrets

Set these values under **Settings -> Environments -> <environment> -> Environment secrets**. GitHub does not expose existing secret values, so they must be loaded from the approved secrets source.

- `GAR_JSON_KEY`
- `ORY_SDK_TOKEN`
- `REGISTRATION_SESSION_SECRET`
- `CITIZENS_INFO_API_KEY`
- `CITIZENS_PHOTO_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `BUZON_PORTAL_API_KEY`

## CLI setup commands

Run these commands from the repository root after authenticating with an account that has repository admin access.

```bash
gh variable set ORY_SDK_URL \
  --env development \
  --repo ogticrd/cuenta-unica-registry \
  --body "https://focused-gagarin-ywepc2q5bu.projects.oryapis.com"

gh variable set NEXT_PUBLIC_ORY_SDK_URL \
  --env development \
  --repo ogticrd/cuenta-unica-registry \
  --body "https://cuenta-unica-registry-dev-x6fzoay5ua-ue.a.run.app"

gh variable set ORY_API_URL \
  --env development \
  --repo ogticrd/cuenta-unica-registry \
  --body "https://focused-gagarin-ywepc2q5bu.projects.oryapis.com"
```

Secrets should be loaded interactively so they are not written to shell history:

```bash
gh secret set ORY_SDK_TOKEN --env development --repo ogticrd/cuenta-unica-registry
gh secret set REGISTRATION_SESSION_SECRET --env development --repo ogticrd/cuenta-unica-registry
gh secret set CITIZENS_INFO_API_KEY --env development --repo ogticrd/cuenta-unica-registry
gh secret set CITIZENS_PHOTO_API_KEY --env development --repo ogticrd/cuenta-unica-registry
gh secret set AWS_ACCESS_KEY_ID --env development --repo ogticrd/cuenta-unica-registry
gh secret set AWS_SECRET_ACCESS_KEY --env development --repo ogticrd/cuenta-unica-registry
gh secret set BUZON_PORTAL_API_KEY --env development --repo ogticrd/cuenta-unica-registry
```

## Verification

After the environment is configured, a push to `develop` should build the image, deploy Cloud Run using the `development` environment, grant public access, and pass the health check.
