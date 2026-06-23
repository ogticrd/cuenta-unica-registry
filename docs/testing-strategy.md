# Estrategia de Pruebas

Este repositorio protege un flujo de identidad. Las pruebas deben demostrar las
reglas de negocio sin introducir atajos que puedan convertirse en bypasses.

## Capas

- Unitarias: componentes, servicios cliente, schemas, mappers y utilidades.
- Integracion: rutas Next.js, cookies, contratos Ory, Rekognition y APIs
  externas mockeadas en el borde.
- Playwright: comportamiento visible en navegador, hidratacion, validaciones,
  navegacion entre pasos y montaje de Rekognition.
- Manual/asistida: prueba de vida real con AWS Rekognition y verificacion OTP
  contra Ory cuando se necesita validar el ambiente completo.

## Comandos

```sh
bun run check
bun run lint
bun run test
bun run test:playwright:registration
```

Para la matriz Playwright completa:

```sh
bun run test:playwright
```

En una instalacion limpia, primero ejecutar:

```sh
bunx playwright install
```

## Registro

La suite `playwright/register-validation.spec.ts` cubre:

- errores visibles de cedula invalida sin overlay de runtime;
- errores visibles del paso cuenta sin guardar draft invalido;
- avance desde identificacion hasta el montaje de Rekognition;
- guardado del draft de cuenta antes de crear la sesion liveness;
- ejecucion en Chromium, Firefox, WebKit y perfiles mobile configurados.

La redireccion posterior a liveness exitoso se cubre en unitarias de
`StepVerification` y en integracion de `liveness-complete`. No se debe agregar un
stub productivo para simular una prueba de vida exitosa en Playwright. Si se
requiere un e2e de extremo a extremo, debe ser asistido con Rekognition real.

La activacion OTP debe conservar mensajes visibles y codigos de error estables.
Los errores de `verifyCodeAction` se prueban unitariamente porque dependen del
contrato del lado servidor con Ory y cookies del navegador.

Los errores de formulario deben probarse en dos niveles: las rutas deben
devolver `fieldErrors` tipados para `cedula`, `email` o `password` cuando el
fallo pertenece a un campo concreto, y los componentes deben renderizarlos con
`FormMessage`/`react-hook-form`. Los cuerpos JSON malformados siguen siendo
errores generales `invalid_payload` sin `fieldErrors`.

## Reglas

- No depender de texto traducido para contratos de API; usar codigos estables.
- No exponer secretos ni payloads sensibles en snapshots o logs.
- No desactivar validaciones para hacer pasar e2e.
- No reducir umbrales biometricos en pruebas.
- Si una prueba usa mocks, el mock debe estar en el borde externo del sistema,
  no en reglas internas del flujo.
