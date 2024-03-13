![logo-cuenta-unica.svg](public/assets/logo.svg)

# Portal de Registro de Cuenta Única

[![Linters](https://github.com/opticrd/cuenta-unica-registry/actions/workflows/ci-check-linters.yml/badge.svg)](https://github.com/opticrd/cuenta-unica-registry/actions/workflows/ci-check-linters.yml)
[![Staging Deployment](https://github.com/opticrd/cuenta-unica-registry/actions/workflows/cd-deploy-to-test.yml/badge.svg)](https://github.com/opticrd/cuenta-unica-registry/actions/workflows/cd-deploy-to-test.yml)
[![Prod Deployment](https://github.com/opticrd/cuenta-unica-registry/actions/workflows/cd-deploy-to-prod.yml/badge.svg)](https://github.com/opticrd/cuenta-unica-registry/actions/workflows/cd-deploy-to-prod.yml)
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

## Pasos para utilizar contenedores de desarrollo

### Requisitos:

* Visual Studio Code: instale [VS Code](https://code.visualstudio.com/) .
* Docker: asegúrese de que [Docker](https://www.docker.com/products/docker-desktop/) esté instalado en su máquina.
* Extensiones de VS Code: instale la extensión ["Dev Containers"](https://code.visualstudio.com/docs/devcontainers/tutorial)  en VS Code.

### Configuración del contenedor de desarrollo:

Dentro de su espacio de trabajo de `VS Code`, existe una carpeta llamada `.devcontainer`.
Dentro de esta carpeta, existe un archivo llamado `devcontainer.json` que se utiliza para definir la configuración del contenedor.
Se deben de hacer los ajustes necesarios como Dockerfile, Docker Compose, puertos, montajes de volumen, variables de entorno, etc.

### Ejecute el contenedor de desarrollo:

* Abra su proyecto en `VS Code`.
* Ejecute la paleta de comandos de VS Code (`Ctrl+Shift+P` o `Cmd+Shift+P`) y seleccione el comando `"Dev Containers: Open Folder in Container"`.
* Seleccione el espacio de trabajo que contiene la configuración del contenedor definida en la carpeta `.devcontainer`.

### Configuración de depuración:

Dentro de su espacio de trabajo de `VS Code`, existe un archivo llamado `launch.json` ubicado en la carpeta `.vscode`.
Este archivo contiene las configuraciones para depurar su aplicación específica.

### Ejecute la aplicación en modo de depuración:

* Dirijase al apartado Run and Debug in Visual Studio Code o presione `Ctrl+Shift+D` 
* Seleccione la opción de debug en la lista desplegable.
* Haga clic en el botón "Iniciar depuración" o presione `F5`. Si desea reiniciar la depuración presione `Ctrl+Shift+F5`
* Esto debería iniciar su aplicación dentro del contenedor Docker y permitirle depurarla.

### Detener el contenedor de desarrollo

Para detener un contenedor de desarrollo en Visual Studio Code, puede seguir estos pasos:

* Abra la paleta de comandos presionando `Ctrl+Shift+P` (Windows/Linux) o `Cmd+Shift+P` (Mac).
* Escriba y seleccione `"Remote: Close Remote Conenction"`.

Alternativamente, puede ir a la esquina inferior derecha de la ventana de VS Code donde verá el ícono verde "><". Al hacer clic en él, se mostrará el Explorador remoto. Desde allí, puede hacer clic derecho en el contenedor asociado con su proyecto y seleccionar `"Remote: Close Remote Conenction"`. Esta acción detendrá el contenedor asociado con su proyecto. Si desea iniciarlo de nuevo, puede utilizar el comando `"Dev Containers: Open Folder in Container"`.

Tener en cuenta que detener el contenedor no lo eliminará; simplemente lo detiene. Si desea eliminar el contenedor por completo, puede hacerlo usando los comandos de Docker en la terminal o usando una herramienta GUI de Docker.


## Autor/es

- **Gustavo Valverde** - _Product Manager_ - [@gustavovalverde](https://github.com/gustavovalverde)
- **Marluan Espiritusanto** - *Technical Lead* - [@marluanespiritusanto](https://github.com/marluanespiritusanto)
- **José Álvarez** - *Developer* - [@JE1999](https://github.com/JE1999)
- **Jeffrey Mesa** - *Developer* - [@jeffreyart1](https://github.com/jeffreyart1)
- **Deyvison García** - _UI/UX Designer_ - [@DeyvisonGarcia](https://github.com/DeyvisonGarcia)
- **Genesis Alvarez** - *DevOps* - [@UsernameAlvarez](https://github.com/UsernameAlvarez)

## Información adicional

Próximamente podrás tener más información sobre el proyecto en [https://cuentaunica.gob.do/](https://cuentaunica.gob.do/)

## Agradecimientos

- [Junta Central Electoral](https://jce.gob.do/)
- [Superintendencia de Bancos](https://www.sib.gob.do/)
- [Ministerio de Hacienda](https://www.hacienda.gob.do/)
- [Centro Nacional de Ciberseguridad](https://cncs.gob.do/)
