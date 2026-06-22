# Cuenta Unica Ciudadana Registry

Portal de identidad digital para la Republica Dominicana. El objetivo del
repositorio es proveer un registro ciudadano verificable, seguro y mantenible,
integrado con Ory Network, AWS Rekognition Face Liveness, APIs oficiales de
ciudadanos y Buzon Ciudadano.

## Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS.
- Ory Network para identidad, sesiones, registro, login y verificacion por
  codigo.
- AWS Rekognition Face Liveness para prueba de vida y comparacion facial.
- `next-intl` para internacionalizacion.
- Vitest y Testing Library para pruebas unitarias e integracion.
- Playwright para e2e; las suites viven en `playwright/`.

## Primeros Pasos

1. Instalar dependencias:

   ```sh
   bun install
   ```

2. Instalar browsers de Playwright si se ejecutaran pruebas e2e:

   ```sh
   bunx playwright install
   ```

3. Crear `.env` desde `.env.example` y completar credenciales locales.

4. Levantar el tunnel de Ory para desarrollo local:

   ```sh
   ory tunnel http://localhost:3000 --project focused-gagarin-ywepc2q5bu --dev
   ```

5. Levantar la aplicacion:

   ```sh
   bun dev
   ```

6. Abrir `http://localhost:3000/register`.

## Comandos

```sh
bun run check
bun run lint
bun run test
bun run test:unit
bun run test:integration
bun run test:playwright
bun run test:playwright:registration
```

Antes de entregar cambios en registro, ejecutar como minimo:

```sh
bun run check
bun run lint
bun run test
bun run test:playwright:registration
```

## Flujo Critico de Registro

El registro no es solo UI. Es un protocolo de estado entre browser, Next.js,
Ory, APIs ciudadanas y Rekognition:

1. Identificacion: valida cedula, confirma que no exista identidad en Ory,
   consulta APIs ciudadanas y crea cookie `registration_session` con estado
   `identified`.
2. Cuenta: valida email/password, guarda un draft temporal cifrado en cookie
   `registration_account_draft` y avanza a biometria.
3. Prueba de vida: crea sesion de Rekognition, valida liveness y compara la
   imagen oficial del ciudadano contra la imagen de referencia.
4. Finalizacion: solo despues de biometria exitosa se crea la cuenta Ory. Si el
   email no esta verificado, se debe redirigir a `/register/email-sent?flow=...`.

Invariantes:

- Ningun cliente puede crear cuenta sin una `registration_session` verificada.
- Una cookie `verified` no sustituye la prueba de vida interactiva salvo que
  exista draft cifrado pendiente para continuar una finalizacion interrumpida.
- La cuenta no debe enviarse a login si Ory no prueba que el email ya esta
  verificado.
- Los errores de API deben devolver `{ success: false, code }` y, si aplica,
  `fieldErrors`.
- No se deben cambiar umbrales biometricos sin actualizar pruebas y documentar
  la razon operativa.

Mas detalle en `docs/registration-architecture.md` y `docs/testing-strategy.md`.

## Estructura Principal

- `app/api/registration/*`: endpoints server-side del protocolo de registro.
- `components/auth/register/*`: wizard visual y pasos de registro.
- `lib/services/registration/*`: reglas de negocio, integraciones y cookies del
  registro.
- `lib/schemas/registration/*`: validacion de formularios y payloads.
- `lib/types/registration/*`: contratos de respuesta y codigos de error.
- `__tests__/unit` y `__tests__/integration`: pruebas automatizadas.
- `playwright/*`: pruebas e2e de comportamiento visible en browser.

## Convenciones de Seguridad

- Secretos solo en `.env`; nunca commitear valores reales.
- Cookies de registro deben ser `httpOnly`, `sameSite: "strict"` cuando
  contengan estado sensible.
- Passwords temporales solo pueden persistir cifrados y con TTL corto.
- El backend debe hacer cumplir cada paso critico; la UI solo guia al usuario.
- No exponer detalles sensibles en errores visibles al usuario.
- `return_url` de activacion solo puede redirigir al origen actual o a origenes
  definidos en `REGISTRATION_ALLOWED_RETURN_ORIGINS`.

## Estado de Calidad

El repositorio ya tiene cobertura importante de registro y autenticacion. La
suite Playwright inicial cubre validaciones visibles del registro y avance
asistido hasta Rekognition. Queda deuda e2e pendiente para liveness exitoso,
activacion de email, login y dashboard autenticado.
