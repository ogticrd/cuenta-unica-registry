# Ambientes de despliegue

Este proyecto usa tres ambientes persistentes de GitHub:

- `development`: se despliega desde la rama `develop`.
- `staging`: se despliega desde la rama `staging`.
- `Production`: se despliega solo desde releases publicados cuyo commit de tag
  esté contenido en `master`.

La rama `master` es la fuente de verdad de producción. La rama `staging` debe
reflejar producción hasta que se promueva un release candidate. La rama
`develop` contiene el desarrollo activo de v2.

## Variables públicas

Configurar estos valores en **Settings -> Environments -> <ambiente> ->
Environment variables** de GitHub.

| Nombre | development | staging | Production |
| --- | --- | --- | --- |
| `APP_NAME` | `cuenta-unica-registry-dev` | `cuenta-unica-registry` | `cuenta-unica-registry` |
| `CLOUD_RUN_SERVICE` | `cuenta-unica-registry-dev` | `cuenta-unica-registry` | `cuenta-unica-registry` |
| `IMAGE_NAME` | `cuenta-unica-registry-dev` | `cuenta-unica-registry` | `cuenta-unica-registry` |
| `GOOGLE_ARTIFACT_REGISTRY` | `us-docker.pkg.dev/auth-do/auth-frontend/auth-registry-frontend` | registro del proyecto | registro del proyecto |
| `GOOGLE_PROJECT_ID` | `auth-do` | proyecto GCP de staging | proyecto GCP de producción |
| `GOOGLE_CLOUD_REGION` | `us-east1` | región de Cloud Run | región de Cloud Run |
| `ORY_SDK_URL` | `https://focused-gagarin-ywepc2q5bu.projects.oryapis.com` | URL Ory de staging | URL Ory de producción |
| `CITIZENS_API_BASE_URL` | `https://api.devs.digital.gob.do` | URL compartida de APIs ciudadanas | URL productiva de APIs ciudadanas |
| `AWS_REGION` | `us-east-1` | región de Rekognition | región de Rekognition |
| `AWS_ROLE_ARN` | rol IAM federado para Rekognition | rol IAM federado para Rekognition | rol IAM federado para Rekognition |
| `AWS_WEB_IDENTITY_TOKEN_AUDIENCE` | `sts.amazonaws.com` | `sts.amazonaws.com` | `sts.amazonaws.com` |
| `AWS_ROLE_SESSION_NAME` | `cuenta-unica-registry` | `cuenta-unica-registry` | `cuenta-unica-registry` |
| `NEXT_PUBLIC_AWS_REGION` | `us-east-1` | región de Amplify | región de Amplify |
| `NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID` | `us-east-1:b1b2e698-23f3-4b5e-945c-ce2a5bc92fc2` | identity pool de Cognito | identity pool de Cognito |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `us-east-1_4R9AQlkpf` | user pool de Cognito | user pool de Cognito |
| `NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID` | `6lkb58rrpita167ncvqmnkq1gl` | app client de Cognito | app client de Cognito |
| `LIVENESS_CONFIDENCE_THRESHOLD` | `85` | `85` | `85`, alineado con v1 |
| `FACE_SIMILARITY_THRESHOLD` | `95` | `95` | `95`, alineado con v1 |
| `REGISTRATION_ALLOWED_RETURN_ORIGINS` | orígenes confiables separados por coma | orígenes confiables separados por coma | orígenes confiables separados por coma |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | clave pública de Enterprise | clave pública del ambiente | clave pública del ambiente |
| `NEXT_PUBLIC_WHATSAPP_SUPPORT_PHONE` | `18097181459` | número de soporte | número de soporte |
| `NEXT_PUBLIC_LUHN_EXCEPTION_HASHES` | hashes separados por coma, opcional | opcional | opcional |
| `CEDULA_VALIDATION_API` | `https://api.digital.gob.do/v3/cedulas` | API aprobada | API aprobada |
| `RECAPTCHA_PROJECT_ID` | proyecto reCAPTCHA Enterprise | proyecto del ambiente | proyecto del ambiente |
| `RECAPTCHA_SCORE_THRESHOLD` | `0.3` | valor aprobado | valor aprobado |
| `FEEDBACK_API_URL` | opcional hasta disponer de API | API receptora de sugerencias | API receptora de sugerencias |
| `LOG_LEVEL` | `info` en Cloud Run; `debug` local | `info` | `info` |
| `BIOMETRIC_MAX_ATTEMPTS` | `3` | `3` | `3` |
| `BIOMETRIC_COOLDOWN_SECONDS` | `900` | `900` | `900` |
| `BIOMETRIC_STATE_TTL_SECONDS` | `1800` | `1800` | `1800` |
| `ANALYTICS_ALLOW_DIRECT_CLIENT_ID` | `false` salvo desarrollo aprobado | `false` | `false` |
| `BUZON_API_BASE_URL` | `https://buzon-ciudadano-staging-i42qq4zxeq-ue.a.run.app` | URL de Buzón Ciudadano | URL de Buzón Ciudadano |
| `GEOIP_API_URL` | `https://reallyfreegeoip.org/json/` | proveedor GeoIP aprobado | proveedor GeoIP aprobado |
| `ANALYTICS_INGRESS_URL` | endpoint de analítica | endpoint de analítica | endpoint de analítica |
| `ANALYTICS_INGRESS_API_KEY_HEADER` | `Authorization` | encabezado de API key | encabezado de API key |
| `ANALYTICS_ENVIRONMENT` | `dev` | `staging` | `production` |

`CLOUD_RUN_SERVICE` e `IMAGE_NAME` son opcionales para el workflow, pero deben
estar definidos en `development` para impedir que un despliegue dev sobrescriba
por accidente el servicio de staging o producción.

`ORY_SDK_URL` es el endpoint del lado servidor de Ory. Las peticiones del navegador
self-service deben usar el origen de la aplicación y el proxy same-origin de
Next.js; la app deriva ese origen desde `x-forwarded-host` /
`x-forwarded-proto` por request y lo inyecta en Ory Elements como `sdk.url`.
No se debe hornear una URL de Cloud Run en el bundle con
`NEXT_PUBLIC_ORY_SDK_URL`: development puede ser accesible por más de un host
generado por Cloud Run y una URL estática provoca submits cross-origin.

`REGISTRATION_ALLOWED_RETURN_ORIGINS` debe incluir solo orígenes confiables que
puedan recibir al ciudadano después de activar la cuenta. La API de registro
siempre permite el origen actual de la petición y descarta cualquier
`return_url` no autorizado antes de guardarlo en la sesión firmada.

## Headers de seguridad

La app aplica headers base desde `next.config.mjs` en todas las rutas:

- `Content-Security-Policy: frame-ancestors 'none'`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` deshabilita capacidades no usadas y mantiene
  `camera=(self)` para Rekognition liveness.

No remover el permiso de cámara; la prueba de vida depende de él.

## Sugerencias, soporte y configuración local

El build valida 85 para liveness y 95 para similitud facial antes de construir
la imagen. Si un ambiente de GitHub conserva 90/80 u otros valores, hay que
actualizar esas variables; el workflow rechaza el despliegue con la política anterior.

Login y registro comparten el botón flotante de sugerencias. El modal ofrece un
enlace de ayuda por WhatsApp con número y mensaje localizados; solo se envía a
WhatsApp un saludo genérico, sin copiar los campos del formulario.

`FEEDBACK_API_URL` debe apuntar a una API que acepte por POST JSON los campos
`cedula`, `email`, `name` y `comments`. Solo una respuesta HTTP exitosa del
destino permite confirmar el envío. Sin esa variable, el endpoint devuelve
HTTP 503 con `NOT_CONFIGURED` y la pantalla informa que el servicio no está
disponible. V1 enviaba sugerencias a Sentry; no define una URL de API reutilizable.

Los valores `NEXT_PUBLIC_*` se pasan al construir Docker y quedan incluidos en
el código del navegador. Cambiarlos requiere construir una imagen nueva; cambiar
solo la variable de ejecución no actualiza ese código. Las listas de orígenes y
hashes se entrecomillan en el workflow para conservar sus comas.

`.env.example` contiene los nombres sin valores. `.env` mantiene los valores
locales reales; las opciones sin uso quedan comentadas, sin credenciales ficticias.
Las claves estáticas AWS son exclusivamente una alternativa local y no se
inyectan al contenedor de Cloud Run. Las credenciales E2E se dejan comentadas
hasta disponer de una cuenta de pruebas aprobada.

## Secretos

Configurar estos valores en **Settings -> Environments -> <ambiente> ->
Environment secrets** de GitHub. GitHub no expone valores existentes, por lo que deben
cargarse desde la fuente aprobada de secretos.

- `GAR_JSON_KEY`
- `ORY_SDK_TOKEN`
- `RECAPTCHA_API_KEY`
- `REGISTRATION_SESSION_SECRET`
- `CITIZENS_INFO_API_KEY`
- `CITIZENS_PHOTO_API_KEY`
- `BUZON_PORTAL_API_KEY`
- `ANALYTICS_CONTEXT_SECRET`
- `ANALYTICS_INGRESS_API_KEY`
- `ANALYTICS_PROJECT_ID`

Rekognition en Cloud Run debe usar federación OIDC con `AWS_ROLE_ARN`. En
desarrollo local, usar la cadena de credenciales por defecto del AWS SDK
(`aws configure sso`, `aws sso login`, `AWS_PROFILE` o credenciales locales
temporales aprobadas). Ver `docs/local-aws-credentials.md` para el flujo local
con IAM users y `docs/cloud-run-aws-oidc-credentials.md` para el flujo de
credenciales temporales en Cloud Run.

El trust policy del rol AWS debe confiar en Google como proveedor federado y
restringir el acceso al `uniqueId` de la service account de Cloud Run. Para
tokens de Google, AWS usa `accounts.google.com:oaud` para comparar el audience
original solicitado por la aplicación:

```json
{
  "Effect": "Allow",
  "Principal": {
    "Federated": "accounts.google.com"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "accounts.google.com:sub": "116627675441303459366",
      "accounts.google.com:aud": "116627675441303459366",
      "accounts.google.com:oaud": "sts.amazonaws.com"
    }
  }
}
```

## Comandos de configuración con CLI

Ejecutar estos comandos desde la raíz del repositorio después de autenticarse
con una cuenta con permisos de administración del repositorio.

```bash
gh variable set ORY_SDK_URL \
  --env development \
  --repo ogticrd/cuenta-unica-registry \
  --body "https://focused-gagarin-ywepc2q5bu.projects.oryapis.com"

gh variable set ORY_API_URL \
  --env development \
  --repo ogticrd/cuenta-unica-registry \
  --body "https://focused-gagarin-ywepc2q5bu.projects.oryapis.com"
```

Los secretos deben cargarse de forma interactiva para evitar que queden en el
historial del shell:

```bash
gh secret set ORY_SDK_TOKEN --env development --repo ogticrd/cuenta-unica-registry
gh secret set REGISTRATION_SESSION_SECRET --env development --repo ogticrd/cuenta-unica-registry
gh secret set CITIZENS_INFO_API_KEY --env development --repo ogticrd/cuenta-unica-registry
gh secret set CITIZENS_PHOTO_API_KEY --env development --repo ogticrd/cuenta-unica-registry
gh secret set BUZON_PORTAL_API_KEY --env development --repo ogticrd/cuenta-unica-registry
gh secret set ANALYTICS_CONTEXT_SECRET --env development --repo ogticrd/cuenta-unica-registry
gh secret set ANALYTICS_INGRESS_API_KEY --env development --repo ogticrd/cuenta-unica-registry
gh secret set ANALYTICS_PROJECT_ID --env development --repo ogticrd/cuenta-unica-registry
```

## Validación

Después de configurar el ambiente, un push a `develop` debe construir la
imagen, desplegar Cloud Run usando el environment `development`, enrutar el
tráfico a la última revisión, conceder acceso público y pasar el health check.
