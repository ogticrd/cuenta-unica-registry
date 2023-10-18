![logo-cuenta-unica.svg](public/assets/logo.svg)

# Portal de Registro de Cuenta Única

[![Linters](https://github.com/opticrd/cuenta-unica-registry/actions/workflows/linter.yml/badge.svg)](https://github.com/opticrd/cuenta-unica-registry/actions/workflows/linter.yml)
[![Staging Deployment](https://github.com/opticrd/cuenta-unica-registry/actions/workflows/deploy-to-staging.yml/badge.svg)](https://github.com/opticrd/cuenta-unica-registry/actions/workflows/deploy-to-staging.yml)
[![Prod Deployment](https://github.com/opticrd/cuenta-unica-registry/actions/workflows/deploy-to-prod.yml/badge.svg)](https://github.com/opticrd/cuenta-unica-registry/actions/workflows/deploy-to-prod.yml)
[![License](https://img.shields.io/github/license/opticrd/cuenta-unica-registry?style&color=blue)](LICENSE)

## Tabla de contenidos

- [Portal de Registro de Cuenta Única](#portal-de-registro-de-cuenta-única)
  - [Tabla de contenidos](#tabla-de-contenidos)
  - [Descripción y contexto](#descripción-y-contexto)
  - [Guía de usuario](#guía-de-usuario)
  - [Guía de instalación](#guía-de-instalación)
    - [Dependencias](#dependencias)
  - [Tecnologías](#tecnologías)
  - [Autor/es](#autores)
  - [Información adicional](#información-adicional)
  - [Agradecimientos](#agradecimientos)

## Descripción y contexto

Esta es la plataforma de registro para la creación de una **Cuenta Única** ciudadana, la cual tiene como finalidad simplificar la obtención de Servicios Gubernamentales, permitiendo a los ciudadanos el acceso a los portales, trámites y servicios que las instituciones ofrezcan de forma digital, con una única cuenta. El proceso de registro consiste en identificarse con su número de cédula, realizar una prueba de vida y crear su cuenta seleccionando un correo y contraseña.

## Guía de usuario

- El usuario se **identifica** con su número de cédula:
  - Se consulta el API de la JCE para obtener la información de la misma
- Acepta **términos y condiciones** (en proceso de revisión)
- Realiza una **prueba de vida**:
  - Se toman fotos y se hace una validación con tecnología de **anti-spoofing** (validar que no sea una grabación, deepfake, etc.)
  - Si la prueba de vida es exitosa se validan las fotos capturadas contra la foto de la cédula de identidad de la Junta Central Electoral (**JCE**).
- El ciudadano selecciona un correo y una contraseña para la creación de su cuenta:
  - La contraseña debe cumplir con el estándar de [**NIST 800-63B**](https://pages.nist.gov/800-63-3/sp800-63b.html)
  - Como parte del estándar [NIST](https://pages.nist.gov/800-63-3/sp800-63b.html) también se evalúa que la contraseña no se encuentre en **filtraciones de datos** en internet.
- Se envía un correo de verificación con un enlace que debe clickear
- Se habilita la cuenta en la plataforma de Gestión de Identidades y Accesos (IAM)
- Ya está listo para usar su cuenta en los portales del Estado Dominicano

## Guía de instalación

Existen 2 formas de instalar la aplicación en su máquina o servidor. La forma más fácil y recomendada es utilizando `Docker`:

```bash
git clone --depth 1 https://github.com/opticrd/cuenta-unica-registry.git
cd cuenta-unica-registry
docker build --target runner -t cuenta-unica .
docker run -d cuenta-unica
```

La segunda es utilizando `pnpm`:

```bash
git clone https://github.com/opticrd/cuenta-unica-registry.git
cd cuenta-unica-registry
pnpm install
pnpm start
```

### Dependencias

> [!WARNING]
> Actualmente este aplicativo depende de múltiple servicios externos para su funcionamiento, por lo que puede ser complejo replicar el proyecto en su totalidad en un ambiente local.

Confirma que tengas todas las variables de entorno configuradas como actualmente se establecen en el archivo de ejemplo `.env.example`.

Este proyecto depende de las siguientes recursos externos:

- El API de consulta de cédulas de la [Junta Central Electoral](https://jce.gob.do/)
- [reCAPTCHA Enterprise](https://cloud.google.com/recaptcha-enterprise)
- [Amazon Rekognition Face Liveness](https://aws.amazon.com/rekognition/face-liveness/)
- [Ory Kratos](https://www.ory.sh/kratos/)

## Tecnologías

- Framework: [Next.js](https://nextjs.org/)
- Lenguaje: [TypeScript](https://www.typescriptlang.org/)
- UI Framework: [Material UI](https://material-ui.com/)
- Liveness Detection: [Amazon Rekognition Face Liveness](https://aws.amazon.com/rekognition/face-liveness/)
- IAM: [Ory Kratos](https://www.ory.sh/kratos/)
- Case Management: [Ballerine](https://ballerine.com/) (en proceso de implementación)
- CI/CD: [GitHub Actions](https://github.com/features/actions)
- Interoperabilidad: [X-Road](https://x-road.global/)
- Hosting: [Google Cloud Platform](https://cloud.google.com/)

## Autor/es

- **Gustavo Valverde** - _Product Manager_ - [@gustavovalverde](https://github.com/gustavovalverde)
- **Marluan Espiritusanto** - *Technical Lead* - [@marluanespiritusanto](https://github.com/marluanespiritusanto)
- **José Álvarez** - *Developer* - [@JE1999](https://github.com/JE1999)
- **Deyvison García** - _UI/UX Designer_ - [@DeyvisonGarcia](https://github.com/DeyvisonGarcia)

## Información adicional

Próximamente podrás tener más información sobre el proyecto en [https://cuentaunica.gob.do/](https://cuentaunica.gob.do/)

## Agradecimientos

- [Junta Central Electoral](https://jce.gob.do/)
- [Superintendencia de Bancos](https://www.sib.gob.do/)
- [Ministerio de Hacienda](https://www.hacienda.gob.do/)
- [Centro Nacional de Ciberseguridad](https://cncs.gob.do/)
