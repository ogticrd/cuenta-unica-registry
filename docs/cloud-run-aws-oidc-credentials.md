# Credenciales temporales AWS en Cloud Run

Esta guia explica como Cloud Run obtiene credenciales temporales de AWS para
usar Rekognition sin guardar access keys permanentes en Google Cloud, GitHub ni
el contenedor.

## Resumen

En Cloud Run, la aplicacion usa federacion OIDC entre Google Cloud y AWS:

```text
Cloud Run service
  -> Google metadata server
  -> Google identity token de la service account
  -> AWS STS AssumeRoleWithWebIdentity
  -> Credenciales temporales del rol AWS
  -> AWS Rekognition
```

La aplicacion solo necesita estas variables:

```env
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::<aws-account-id>:role/<role-name>
AWS_WEB_IDENTITY_TOKEN_AUDIENCE=sts.amazonaws.com
AWS_ROLE_SESSION_NAME=cuenta-unica-registry
```

`AWS_WEB_IDENTITY_TOKEN_AUDIENCE` y `AWS_ROLE_SESSION_NAME` tienen valores por
defecto en el codigo, pero se configuran explicitamente para que el ambiente sea
auditable.

## Como funciona en runtime

Cuando el backend necesita llamar a Rekognition, `getRekognitionClient()` crea
un `RekognitionClient` con `AWS_REGION`.

Si `AWS_ROLE_ARN` esta configurado, el cliente no usa la cadena local de
credenciales del AWS SDK. En su lugar usa un proveedor de credenciales propio:

1. Solicita un identity token al metadata server de Google:

   ```text
   http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity
   ```

2. La solicitud incluye:

   - header `Metadata-Flavor: Google`
   - `audience=sts.amazonaws.com`, o el valor de
     `AWS_WEB_IDENTITY_TOKEN_AUDIENCE`
   - `format=full`

3. Google devuelve un token OIDC firmado para la service account que ejecuta el
   servicio de Cloud Run.

4. La aplicacion llama a AWS STS:

   ```text
   POST https://sts.amazonaws.com/
   Action=AssumeRoleWithWebIdentity
   RoleArn=<AWS_ROLE_ARN>
   RoleSessionName=<AWS_ROLE_SESSION_NAME>
   WebIdentityToken=<google-identity-token>
   ```

5. AWS valida el token contra el trust policy del rol.

6. Si el token es valido, AWS STS devuelve credenciales temporales:

   - `AccessKeyId`
   - `SecretAccessKey`
   - `SessionToken`
   - `Expiration`

7. La aplicacion usa esas credenciales temporales para las llamadas a
   Rekognition.

8. Las credenciales se cachean en memoria y se renuevan automaticamente cuando
   faltan menos de cinco minutos para expirar.

## Trust policy del rol AWS

El rol AWS debe confiar en Google como proveedor federado y limitar el acceso a
la service account de Cloud Run. Para este proyecto, la configuracion probada
usa el `uniqueId` de la service account:

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

Para tokens de Google, AWS interpreta:

- `accounts.google.com:sub`: identificador unico de la service account.
- `accounts.google.com:aud`: tambien corresponde al `sub` del token emitido por
  Google para este flujo.
- `accounts.google.com:oaud`: audience original solicitado por la aplicacion,
  en este caso `sts.amazonaws.com`.

## Permisos del rol AWS

El rol asumido por Cloud Run debe tener solo los permisos necesarios para el
flujo biometrico:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:CreateFaceLivenessSession",
        "rekognition:GetFaceLivenessSessionResults",
        "rekognition:CompareFaces"
      ],
      "Resource": "*"
    }
  ]
}
```

## Configuracion en Google Cloud Run

El servicio de Cloud Run debe ejecutarse con la service account autorizada en el
trust policy de AWS.

Ejemplo en PowerShell:

```powershell
$PROJECT_ID = "auth-do"
$REGION = "us-east1"
$CLOUD_RUN_SERVICE = "cuenta-unica-registry-dev"
$GCP_SA_EMAIL = "1024407356432-compute@developer.gserviceaccount.com"

gcloud run services update $CLOUD_RUN_SERVICE `
  --project $PROJECT_ID `
  --region $REGION `
  --service-account $GCP_SA_EMAIL
```

Validar la service account activa del servicio:

```powershell
gcloud run services describe $CLOUD_RUN_SERVICE `
  --project $PROJECT_ID `
  --region $REGION `
  --format "value(spec.template.spec.serviceAccountName)"
```

## Configuracion en GitHub Environments

Para cada ambiente que despliega a Cloud Run, configurar estas variables como
**Environment variables**:

```text
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::<aws-account-id>:role/<role-name>
AWS_WEB_IDENTITY_TOKEN_AUDIENCE=sts.amazonaws.com
AWS_ROLE_SESSION_NAME=cuenta-unica-registry
```

No configurar access keys permanentes para Rekognition en los environments de
Cloud Run.

## Diferencia con desarrollo local

Cloud Run usa `AWS_ROLE_ARN` y federacion OIDC con Google.

Desarrollo local no tiene metadata server de Cloud Run. Por eso local usa la
cadena de credenciales por defecto del AWS SDK con `AWS_PROFILE`. El flujo local
esta documentado en `docs/local-aws-credentials.md`.

## Renovacion y duracion

Las credenciales que devuelve AWS STS son temporales. La respuesta incluye una
fecha de expiracion.

La aplicacion guarda esas credenciales solo en memoria del proceso. Antes de
reutilizarlas valida que les queden mas de cinco minutos de vida. Si estan cerca
de expirar, pide un nuevo identity token a Google y vuelve a llamar
`AssumeRoleWithWebIdentity`.

Si una instancia de Cloud Run reinicia, el cache en memoria desaparece y la
siguiente llamada a Rekognition solicita credenciales temporales nuevas.

## Beneficios de seguridad

- No hay access keys permanentes de AWS en Cloud Run.
- No hay secretos AWS en GitHub Actions para Rekognition.
- AWS puede revocar acceso removiendo el trust policy o los permisos del rol.
- Google puede revocar acceso cambiando la service account del servicio o sus
  permisos.
- Cada token esta limitado por tiempo y por las condiciones del trust policy.

## Validacion operativa

Despues de desplegar, validar el flujo de registro hasta la creacion de la
sesion de liveness. Si Cloud Run puede asumir el rol, el endpoint:

```text
POST /api/registration/verification/liveness-session
```

debe devolver `success: true` y un `sessionId`.

Errores comunes:

- `Failed to fetch Google identity token`: el contenedor no esta corriendo en
  Cloud Run o no tiene acceso al metadata server.
- `Failed to assume AWS role with Google identity`: el trust policy no coincide
  con la service account o el audience.
- `AWS STS response did not include complete temporary credentials`: AWS STS no
  devolvio una respuesta valida.
- `rekognition_error` en la API: revisar logs del servidor para distinguir entre
  fallo de STS, region incorrecta o permisos insuficientes del rol.
