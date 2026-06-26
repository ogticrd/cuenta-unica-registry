# Credenciales AWS locales para Rekognition

Esta guia explica como configurar acceso local a AWS Rekognition usando un
IAM user personal y un rol temporal asumido desde la computadora del developer.

El objetivo es que desarrollo local no dependa de credenciales compartidas de
larga vida en `.env`. Cada developer autentica con su propio IAM user y la app
usa la cadena de credenciales por defecto del AWS SDK mediante `AWS_PROFILE`.

## Modelo

```text
Developer PC
  -> AWS profile local del IAM user
  -> AssumeRole hacia CuentaUnicaRegistryLocalDeveloperRole
  -> Credenciales temporales
  -> Rekognition
```

En Cloud Run, el proyecto no usa este flujo local. Cloud Run usa federacion OIDC
con Google y el rol configurado en `AWS_ROLE_ARN`.

## Responsabilidad del administrador

El administrador debe crear o reutilizar un rol de AWS para desarrollo local,
darle permisos minimos de Rekognition y permitir que los IAM users humanos lo
asuman.

Variables sugeridas para PowerShell:

```powershell
$AWS_ACCOUNT_ID = "280686762883"
$AWS_REGION = "us-east-1"
$LOCAL_ROLE_NAME = "CuentaUnicaRegistryLocalDeveloperRole"
$LOCAL_ROLE_ARN = "arn:aws:iam::$AWS_ACCOUNT_ID`:role/$LOCAL_ROLE_NAME"
```

### Crear la politica de Rekognition

```powershell
@'
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
'@ | Set-Content -Path ".\rekognition-local-dev-policy.json"
```

### Crear el trust policy del rol

Agregar un ARN por cada IAM user humano que deba desarrollar localmente.

```powershell
@"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::$AWS_ACCOUNT_ID`:user/tomas.familia",
          "arn:aws:iam::$AWS_ACCOUNT_ID`:user/jeffrey.mesa",
          "arn:aws:iam::$AWS_ACCOUNT_ID`:user/kevin.jimenez",
          "arn:aws:iam::$AWS_ACCOUNT_ID`:user/marluan.guerrero",
          "arn:aws:iam::$AWS_ACCOUNT_ID`:user/melida.pina"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@ | Set-Content -Path ".\local-dev-trust-policy.json"
```

Crear el rol si no existe:

```powershell
aws iam create-role `
  --role-name $LOCAL_ROLE_NAME `
  --assume-role-policy-document file://local-dev-trust-policy.json
```

Si el rol ya existe, actualizar el trust policy:

```powershell
aws iam update-assume-role-policy `
  --role-name $LOCAL_ROLE_NAME `
  --policy-document file://local-dev-trust-policy.json
```

Adjuntar o actualizar la politica inline de Rekognition:

```powershell
aws iam put-role-policy `
  --role-name $LOCAL_ROLE_NAME `
  --policy-name CuentaUnicaRegistryLocalRekognitionAccess `
  --policy-document file://rekognition-local-dev-policy.json
```

### Permitir que cada IAM user asuma el rol

Para cada developer, agregar una politica inline a su IAM user.

```powershell
$DEV_USER_NAME = "tomas.familia"

@"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "$LOCAL_ROLE_ARN"
    }
  ]
}
"@ | Set-Content -Path ".\assume-local-dev-role-policy.json"

aws iam put-user-policy `
  --user-name $DEV_USER_NAME `
  --policy-name CuentaUnicaRegistryAssumeLocalDeveloperRole `
  --policy-document file://assume-local-dev-role-policy.json
```

Repetir cambiando `$DEV_USER_NAME` para cada developer autorizado.

## Responsabilidad del developer

Cada developer necesita AWS CLI instalado y credenciales locales de su propio
IAM user. Esas credenciales no se copian al repositorio ni al `.env`.

El IAM user personal no debe tener permisos directos de Rekognition. Su permiso
local debe limitarse a `sts:AssumeRole` hacia el rol de desarrollo.

### Configurar el perfil base del IAM user

Este perfil representa al usuario personal del developer. AWS CLI guardara las
credenciales en el perfil local del sistema operativo.

```powershell
aws configure --profile cuenta-unica-user
```

Valores esperados:

- `AWS Access Key ID`: access key del IAM user personal.
- `AWS Secret Access Key`: secret key del IAM user personal.
- `Default region name`: `us-east-1`.
- `Default output format`: `json`.

### Configurar el perfil de la app

Editar el archivo local de configuracion de AWS:

```powershell
notepad "$env:USERPROFILE\.aws\config"
```

Agregar:

```ini
[profile cuenta-unica-dev]
role_arn = arn:aws:iam::280686762883:role/CuentaUnicaRegistryLocalDeveloperRole
source_profile = cuenta-unica-user
region = us-east-1
```

El perfil `cuenta-unica-dev` no guarda permisos permanentes de Rekognition. Solo
indica que AWS CLI debe usar el perfil base para pedir credenciales temporales
del rol local.

### Validar el acceso

```powershell
aws sts get-caller-identity --profile cuenta-unica-dev
```

La respuesta debe mostrar un ARN parecido a:

```text
arn:aws:sts::280686762883:assumed-role/CuentaUnicaRegistryLocalDeveloperRole/...
```

### Configurar `.env`

En `.env`, dejar:

```env
AWS_REGION=us-east-1
AWS_PROFILE=cuenta-unica-dev
```

No agregar credenciales AWS permanentes al `.env`.

### Ejecutar la app

```powershell
bun run dev
```

La primera llamada local a Rekognition puede tardar un poco mas porque AWS CLI
debe resolver el perfil y asumir el rol. Luego el SDK reutiliza credenciales
temporales hasta que expiren.

## Agregar un nuevo developer

1. El administrador crea o identifica el IAM user del developer.
2. El administrador agrega el ARN del IAM user al trust policy de
   `CuentaUnicaRegistryLocalDeveloperRole`.
3. El administrador agrega al IAM user la politica inline que permite
   `sts:AssumeRole` hacia ese rol.
4. El developer configura `cuenta-unica-user` con sus credenciales personales.
5. El developer configura `cuenta-unica-dev` con `role_arn` y `source_profile`.
6. El developer valida con `aws sts get-caller-identity --profile cuenta-unica-dev`.
7. El developer usa `AWS_PROFILE=cuenta-unica-dev` en `.env`.

## Revocar acceso

Para revocar a un developer:

1. Remover su ARN del trust policy del rol.
2. Remover la politica inline `CuentaUnicaRegistryAssumeLocalDeveloperRole` de
   su IAM user, o desactivar/eliminar el IAM user si ya no debe tener acceso.
3. Rotar sus access keys si hubo sospecha de exposicion.

## Notas de seguridad

- No usar credenciales compartidas entre developers.
- No commitear archivos de `.aws`, `.env` ni salidas de comandos con secretos.
- Rotar o desactivar access keys de IAM users cuando una persona salga del
  equipo o cuando exista sospecha de exposicion.
- El rol local debe mantenerse limitado a las acciones de Rekognition requeridas
  por el flujo de registro.
- Los permisos de Cloud Run se administran por separado con OIDC y no requieren
  IAM users humanos.
