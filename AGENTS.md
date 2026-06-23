# Instrucciones para contribuyentes

Actúa como un ingeniero senior construyendo un portal público de identidad con
requisitos altos de seguridad. Prioriza corrección, contratos explícitos,
mantenibilidad y testabilidad por encima de atajos.

## Prioridades del proyecto

- Preservar el protocolo de seguridad del registro. Un usuario solo puede
  obtener una identidad Ory después de validar cédula, validar el draft de
  cuenta, completar liveness y superar comparación facial.
- Mantener el diseño visual consistente salvo que la tarea pida explícitamente
  un rediseño de UI.
- Preferir cambios pequeños, verificables y con pruebas enfocadas.
- Usar contratos de respuesta tipados y códigos de error estables. No ramificar
  lógica de negocio usando texto traducido.
- Mantener secretos fuera del repositorio y fuera de logs.

## Antes de cambiar registro

Leer:

- `README.md`
- `docs/registration-architecture.md`
- `lib/types/registration/*`
- la ruta o servicio afectado bajo `app/api/registration/*` o
  `lib/services/registration/*`

No omitir validaciones backend porque el wizard visual parezca imponer un paso.
El backend debe seguir siendo la autoridad.

## Reglas de código

- TypeScript solamente; evitar `any` salvo que una forma externa del SDK exija
  un adaptador estrecho.
- Usar `safeParse` para input no confiable.
- Mantener route handlers delgados. Colocar reglas de negocio en servicios.
- Mantener servicios cliente como wrappers de transporte; no duplicar
  autorización ni validación del lado servidor en ellos.
- Usar `FormMessage` y el estado de `react-hook-form` para errores de
  validación de formularios.
- Agregar comentarios solo cuando el código no sea autoexplicativo.

## Manejo de errores

- Los errores de API deben devolver `{ success: false, code }`.
- Incluir `fieldErrors` para fallos de campos de cuenta.
- Incluir `stage` cuando una ruta pueda fallar en múltiples fases, como
  liveness más creación de cuenta.
- Registrar detalles del lado servidor con prefijos contextuales, pero devolver
  códigos sanitizados al cliente.
- No tragar errores silenciosamente ni reemplazarlos por mensajes ambiguos.

## Reglas de seguridad

- Las cookies de registro que contengan estado deben ser `httpOnly`.
- Los drafts sensibles de registro deben estar cifrados y tener vida corta.
- Nunca confiar en estado de sesión enviado por el cliente.
- No cambiar umbrales biométricos sin aprobación explícita de producto/seguridad
  y actualización de pruebas.
- Validar `return_url` antes de persistirlo o redirigir.
- Reenviar cookies de Ory de forma deliberada al completar flujos del navegador.

## Pruebas

Para cambios normales:

```sh
bun run check
bun run lint
bun run test
```

Para cambios de registro, agregar o actualizar pruebas para cada transición de
estado, código de error y comportamiento de cookies afectado. Se espera
validación con navegador para comportamiento visible del registro. Ejecutar:

```sh
bun run test:playwright:registration
```

## Git

Usar Conventional Commits:

- `feat: ...`
- `fix: ...`
- `test: ...`
- `docs: ...`
- `refactor: ...`
- `chore: ...`

No mencionar herramientas ni automatización en mensajes de commit.
