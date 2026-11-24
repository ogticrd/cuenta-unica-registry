# Arquitectura del Registro

Este documento describe el flujo de registro como contrato de negocio. Cualquier
cambio en este dominio debe conservar estos estados, errores y validaciones.

## Objetivo

Crear una identidad Ory solamente cuando una persona:

1. provee una cedula dominicana valida;
2. no posee una identidad existente para esa cedula;
3. existe en las APIs ciudadanas;
4. provee credenciales validas;
5. supera prueba de vida y comparacion facial;
6. queda encaminada a activacion de email cuando Ory lo requiere.

## Estados y Cookies

| Estado | Fuente | Proposito |
| --- | --- | --- |
| `registration_session: identified` | `/api/registration/citizen` | Cedula validada e identificada; habilita captura de cuenta y liveness. |
| `registration_account_draft` | `/api/registration/account-draft` | Draft cifrado de email/password para sobrevivir reloads durante liveness. |
| `registration_liveness_challenge` | `/api/registration/verification/liveness-session` | Challenge firmado que liga la sesion Rekognition a `registration_session`. |
| `registration_biometric_state` | `/api/registration/verification/liveness-session` | Estado firmado de intentos biométricos, sesión activa y ventana de enfriamiento por cédula. |
| `registration_session: verified` | liveness exitoso | Biometria aprobada; habilita creacion de cuenta en backend. |

Reglas:

- `registration_account_draft` debe estar cifrada con una clave derivada para
  este proposito, autenticada contra su contexto de cookie, ser `httpOnly`,
  expirar y limpiarse en reset o exito.
- `registration_session` debe estar firmada con una clave derivada para este
  proposito, ser `httpOnly`, expirar y rechazar formatos alterados.
- `registration_account_draft` debe pertenecer al mismo `sessionId` de
  `registration_session`; un draft de otra sesion no puede finalizar cuenta,
  aunque tenga la misma cedula.
- Rekognition no puede iniciarse ni consumirse sin un
  `registration_account_draft` valido ligado a la misma
  `registration_session`; el orden cuenta -> liveness se aplica en backend, no
  solo en el wizard.
- `registration_account_draft` no puede sobrevivir a `registration_session`;
  su `expiresAt` y `maxAge` deben limitarse al tiempo restante de la sesion.
- La promocion de `registration_session` de `identified` a `verified` debe
  conservar `sessionId`, `issuedAt` y `expiresAt`; liveness no renueva la
  ventana temporal del registro.
- `registration_liveness_challenge` debe existir y coincidir con
  `registration_session.sessionId` y el `sessionId` de Rekognition antes de
  consultar resultados; una prueba de vida creada en otra sesion se rechaza.
- La creación de sesiones biométricas reutiliza durante tres minutos el desafío
  activo de la misma sesión de registro. Crear una sesión nueva consume uno de
  los tres intentos disponibles y, al agotarlos, aplica una espera de quince
  minutos. Los valores se pueden ajustar mediante `BIOMETRIC_MAX_ATTEMPTS`,
  `BIOMETRIC_COOLDOWN_SECONDS` y `BIOMETRIC_STATE_TTL_SECONDS`.
- El estado biométrico se firma, se almacena en una cookie `httpOnly` y se liga
  a un hash de la cédula. Nunca se debe aceptar un contador enviado en el body.
- `return_url` se valida antes de firmar `registration_session`: solo se acepta
  el origen actual de la peticion o los origenes configurados en
  `REGISTRATION_ALLOWED_RETURN_ORIGINS`.
- `verified` sin draft no puede crear cuenta automaticamente; debe volver a
  cuenta con error accionable.
- Si `POST /api/registration/account` recibe credenciales directas y existe un
  draft de la misma sesion, las credenciales deben coincidir con el draft; un
  body no puede reemplazar email/password despues de liveness.
- `POST /api/registration/account` no puede finalizar una cuenta sin
  `registration_account_draft`; las credenciales en body son toleradas solo si
  son redundantes y coinciden con el draft cifrado vigente.
- El backend es la autoridad. No confiar en pasos visuales del wizard para
  permitir acciones criticas.

## Endpoints

### Recuperación desde el registro

Cuando identificación devuelve `identity_exists`, el botón “Recuperar acceso”
envía una nueva solicitud con `recoverAccess: true`. El servidor vuelve a validar
cédula y reCAPTCHA, exige una identidad única y vincula su ID a la sesión
firmada en `recovery.identityId`.

El wizard muestra “Modo recuperación” debajo del indicador del paso y conserva
el orden identificación, datos de cuenta y biometría. La sesión hidratada
mantiene ese modo después de una recarga y el reset lo limpia.

Después de aprobar la biometría y validar el draft, la finalización actualiza
correo y contraseña sobre la identidad existente. Se conservan ID, schema,
traits adicionales y metadata, y se revocan las sesiones anteriores. Un fallo
al enviar la verificación del correo permite reintentar la finalización con el
draft y la sesión verificada vigentes.

Al recuperar una sesión verificada, la pantalla informa que la identidad ya
fue validada y espera una continuación explícita. Una recarga permite retomar
el proceso sin abrir el modal biométrico ni enviar solicitudes de finalización
automáticamente.

La revocación consulta todas las páginas de sesiones activas antes de
desactivarlas, para evitar saltos al paginar por posición. Acepta enlaces
relativos y paginación por token o por número de página; una lista vacía
termina la consulta aunque Ory incluya un enlace a la siguiente página.
Una sesión eliminada concurrentemente puede devolver 404.
Un error de esta operación mantiene la recuperación verificada para reintentar.

La recuperación rechaza identidades inactivas, ausentes o de otra cédula.

| Endpoint | Responsabilidad |
| --- | --- |
| `POST /api/registration/citizen` | Validar cedula, buscar identidad Ory existente, consultar ciudadano y firmar sesion `identified`. |
| `POST /api/registration/account-draft` | Validar email/password y guardar draft cifrado. |
| `POST /api/registration/verification/liveness-session` | Crear sesion Rekognition solo si existe draft de cuenta valido para la sesion. |
| `POST /api/registration/verification/liveness-result` | Validar liveness con draft de cuenta vigente y actualizar cookie a `verified`; mantiene compatibilidad. |
| `POST /api/registration/verification/liveness-complete` | Validar liveness con draft de cuenta vigente y finalizar cuenta con draft cifrado. |
| `POST /api/registration/account` | Crear cuenta Ory si la sesion esta `verified`; requiere draft cifrado vigente. |
| `POST /api/registration/session/reset` | Limpiar sesion, draft y challenge de liveness. |

## Integraciones

### Ory

- El username de Ory es la cedula normalizada.
- Si Ory devuelve `continue_with.show_verification_ui`, la app redirige a
  `/register/email-sent?flow=...`.
- Si Ory crea identidad sin `continue_with`, se debe crear explicitamente un
  verification flow de codigo.
- Un verification flow puede incluir `ui` después de enviar el correo. Solo
  `error` o mensajes de tipo `error` en el formulario indican un rechazo;
  los mensajes informativos permiten continuar a la verificación del correo.
- Solo se puede redirigir a login o `return_url` cuando Ory reporta el email
  como verificado.
- `verifyCodeAction` debe reenviar cookies del navegador a Ory.

### Umbrales biométricos compartidos por registro y VID

La configuración se alinea con v1: liveness exige confianza **mayor que 85**;
comparación facial exige coincidencia devuelta por Rekognition con similitud
**mayor o igual que 95**. Una confianza exactamente igual a 85 se rechaza.
Los valores ausentes o fuera del rango (0, 100] usan esos umbrales base.
Este ajuste sustituye los valores anteriores de v2 (90 y 80) a petición del
responsable del proyecto. Revisar las variables ya creadas en GitHub: un valor
explícito del ambiente tiene prioridad sobre el valor por defecto del workflow.

### APIs Ciudadanas

- La validación completa de cédula ocurre en servidor: formato de once dígitos
  sin valores repetidos, Luhn, excepciones por hash y, como último recurso,
  `CEDULA_VALIDATION_API/{cedula}/validate`. Solo `valid: true` permite seguir.
  El navegador valida formato y longitud para no bloquear excepciones antes
  de consultar el servidor; conserva los mensajes de validación del campo.
- El endpoint de identificación comprueba reCAPTCHA antes de consultar esa API.
  La petición usa `cache: "no-store"` y validación del JSON, sin un timeout
  definido por la aplicación. Un rechazo explícito devuelve `invalid_cedula`
  (400); un fallo de configuración, transporte o respuesta devuelve `cedula_validation_unavailable`
  (503) y permite reintentar. La finalización aplica la misma regla y conserva
  el draft verificado si la consulta falla.
- Antes de consultar Ory o las APIs ciudadanas, identificación valida un token
  de Google reCAPTCHA Enterprise para la acción `form_submit`. El umbral por
  defecto es `0.3`, configurable con `RECAPTCHA_SCORE_THRESHOLD`.
- La recuperación valida la acción `recovery_submit` y emite una prueba firmada
  de un solo uso antes de permitir que el proxy envíe el formulario a Ory.
- La API de informacion basica se usa para confirmar existencia y nombre.
- La API de nacimiento se usa para completar traits Ory.
- La API de foto se usa para comparacion facial.
- Las respuestas externas no deben filtrarse completas al cliente.

### Rekognition

- Liveness y comparacion facial son checks distintos.
- No modificar `LIVENESS_CONFIDENCE_THRESHOLD` ni `FACE_SIMILARITY_THRESHOLD`
  sin pruebas que cubran el cambio.
- Si liveness pasa pero cuenta falla, conservar sesion `verified` y mostrar
  error de cuenta para corregir sin repetir biometria.

## Errores

Todas las rutas de registro deben responder con contratos tipados:

```ts
{ success: false, code: "..." }
```

Los cuerpos JSON de rutas de registro, y de cualquier API que exponga errores
codificados, deben leerse y validarse con los helpers compartidos de
`lib/services/api-response.ts`, para conservar una sola semantica de
`invalid_payload`, body opcional y `fieldErrors`.

Cuando el error pertenece a un campo editable del formulario, la API debe
devolver `fieldErrors` con claves de traduccion estables, no texto renderizado:

```ts
{
  success: false,
  code: "...",
  fieldErrors: {
    cedula?: "identification.id_invalid",
    email?: "account.validation.email_invalid" | "identities.messages....",
    password?: "account.validation...." | "identities.messages....",
  },
}
```

`fieldErrors` solo debe emitirse cuando el backend puede asociar el fallo a un
campo concreto. Un JSON malformado conserva `{ success: false, code:
"invalid_payload" }` sin `fieldErrors`, porque no hay payload confiable.

`liveness-complete` distingue etapas:

```ts
{ success: false, stage: "verification", code: "..." }
{ success: false, stage: "account", code: "...", fieldErrors?: ... }
```

No usar mensajes ambiguos como unica fuente de verdad. El UI puede traducir
mensajes, pero la logica debe depender de codigos.

Las server actions de activacion, como `verifyCodeAction`, tambien deben
devolver un `code` estable junto al mensaje visible.

## Pruebas Obligatorias Para Cambios En Registro

Ejecutar:

```sh
bun run check
bun run lint
bun run test
bun run test:playwright:registration
```

Para cambios profundos, agregar o actualizar pruebas que cubran:

- hidratacion del wizard por estado de cookie;
- rechazo de payloads invalidos;
- draft cifrado, expirado o alterado;
- liveness exitoso y fallido;
- creacion Ory con `continue_with`;
- fallback cuando Ory crea identidad no verificada sin `continue_with`;
- activacion OTP con errores codificados;
- errores Ory mapeados a `fieldErrors`;
- errores de payload de `cedula`, `email` y `password` propagados a
  `FormMessage`;
- reset limpiando cookies de registro;
- validaciones visibles de formularios.

## Cobertura E2E

La suite inicial `playwright/register-validation.spec.ts` cubre validaciones
visibles del registro, protege contra overlays/runtime errors durante la
validacion y verifica el avance asistido hasta Rekognition. Los siguientes
escenarios e2e siguen pendientes:

- liveness exitoso redirige a activacion de email;
- OTP invalido muestra error;
- sesion autenticada accede al dashboard.

La estrategia de pruebas completa vive en `docs/testing-strategy.md`.
