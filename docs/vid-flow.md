# Flujo VID

Este documento describe cómo los sistemas confiables pueden invocar el **flujo VID (Verificador de Identidad Dominicano)** de Cuenta Única y obtener señales sólidas de identidad redirigiendo a sus usuarios hacia un endpoint similar a OAuth. La experiencia replica una solicitud de autorización clásica: la aplicación construye una URL con parámetros definidos, el Registro de Cuenta Única valida al ciudadano y ejecuta la prueba biométrica de vida, y finalmente redirige al usuario a uno de los redirect URIs registrados para el cliente.

## Prerrequisitos

- Contar con un cliente OAuth2 creado en Cuenta Única. Guarde el `client_id` y configure al menos un redirect URI porque el flujo VID reutiliza esa misma información (`src/common/lib/oauth.ts`).
- El redirect URI debe ser una URL HTTPS absoluta o una ruta interna de Cuenta Única. Las rutas internas pueden ser relativas (por ejemplo, `/es/register/callback`); las URLs externas tienen que coincidir exactamente con lo configurado en Cuenta Única.
- El ciudadano debe existir en el padrón (API de Cédula) ya que la pantalla VID consulta sus datos básicos antes de mostrar el saludo (`findCitizen` en `src/actions/citizen.action.ts`).
- (Opcional) Si necesita procesar automáticamente el resultado de la prueba de vida, asegúrese de que el endpoint detrás de su redirect URI pueda recibir cualquier contexto adicional que usted codifique en sus propios parámetros o estado (el flujo VID no agrega estado adicional).

## 1. Construya la solicitud de autorización

```
GET /{lang}/vid?client_id=UUID&redirect_uri=URL&access_token=TOKEN
Host: cuentaunica.gob.do
```

| Parámetro      | Requerido | Descripción                                                                                                                  |
| -------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `lang`         | ✅        | Idioma ISO usado en la app (`es`, `en`, …). Controla toda la localización del flujo.                                         |
| `client_id`    | ✅        | UUID del cliente OAuth2 en Cuenta Única. El backend verifica su existencia.                                                  |
| `redirect_uri` | ✅        | Debe coincidir exactamente con uno de los URIs configurados para `client_id`. URLs absolutas generan redirecciones externas. |
| `access_token` | ✅        | `access_token` de la sesión ciudadana emitido por CUC. El backend lo introspecciona para obtener la cédula asociada.         |

Si algún parámetro falla (token inactivo, ciudadano inexistente, cédula inválida, redirect no autorizado, cliente inexistente) se lanza `notFound()` y se muestra `src/app/[lang]/vid/not-found.tsx`, informando que la solicitud no puede continuar.

### Ejemplo

```
https://cuentaunica.gob.do/es/vid?client_id=7f87...&redirect_uri=https%3A%2F%2Fpartner.gov.do%2Fvid%2Fcallback&access_token=ory_at_...
```

## 2. Redirección a URL limpia (Flow ID)

Por seguridad, el sistema **no mantiene el `access_token` visible en la barra de direcciones**. Tras validar los parámetros iniciales:

1. El servidor crea una sesión temporal (flow) con TTL de 120 segundos.
2. Los datos validados (cédula, nombre, redirect URI) se almacenan en una cookie httpOnly.
3. El usuario es redirigido automáticamente a una URL limpia:

```
/{lang}/vid?flow=abc123-def456-...
```

Este diseño evita que el token aparezca en:

- El historial del navegador
- Capturas de pantalla accidentales
- URLs compartidas por error

Si el flow expira o es inválido, se muestra la página `not-found`.

## 3. Validación previa y saludo

Una vez establecido el flow:

1. La página recupera los datos validados de la cookie del flow.
2. El redirect URI se propaga a los componentes cliente (`Form` → `LivenessModal` → `LivenessQuickStart`).
3. La UI muestra la lista de condiciones (`intl.step2.*`) para que el usuario confirme que tiene cámara, permite capturas del rostro y entiende la advertencia sobre luces intermitentes.

No se inicia ninguna captura biométrica hasta que el usuario haga clic en **INICIAR PROCESO**.

## 4. Lanzamiento de la sesión VID

Al iniciar, el modal (`LivenessModal`) abre y monta el `FaceLivenessDetector` de AWS:

1. `LivenessQuickStart` envía un POST a `/api/biometric` para crear una nueva sesión (`sessionId`). Cualquier error aparece en SnackAlert y se registra en Sentry con la `cedula` del usuario.
2. El detector corre totalmente en el cliente. Si el usuario cancela, se genera una sesión nueva para reintentar sin salir del flujo.
3. Al completar el análisis, el cliente realiza `GET /api/biometric/{sessionId}/{cedula}`. El handler compara el resultado con el registro del ciudadano. Si hay coincidencia, se continúa; de lo contrario, se reinicia la sesión mostrando el error localizado (`intl.errors.liveness.*`).

Detalles técnicos:

- El detector recarga automáticamente la página después de `LIVENESS_TIMEOUT_SECONDS` para evitar sesiones obsoletas.
- Los errores de cámara, firmas, uso en horizontal, etc., se traducen a mensajes específicos antes de mostrarse al usuario.

## 5. Manejo del redirect (respuesta estilo OAuth)

Cuando la coincidencia es positiva `handleSuccessfulMatch` ejecuta la estrategia de redirección (`src/components/LivenessQuickStart/index.tsx`):

- **Redirects externos** (`https://…`): navegación completa mediante `window.location.assign`.
- **Redirects relativos** (`/es/register/success`): navegación interna con el router de Next.js.
- **Redirect faltante** (no debería ocurrir si la URL se construyó bien): redirige por defecto a `register`.

Como el flujo actúa igual que la fase de redirección de OAuth, usted es responsable de codificar cualquier estado adicional dentro del mismo `redirect_uri` (por ejemplo, `https://partner.gov.do/vid/callback?state=abc123`). Guarde `state` en su sistema antes de redirigir y recupérelo cuando el usuario regrese.

## Superficies de error y recuperación

| Etapa                      | Disparador                                                                     | Qué ve el usuario / cómo recupera                                                                |
| -------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Validación de URL          | LUHN inválido, ciudadano no encontrado, cliente desconocido, redirect inválido | Página `vid/not-found` con instrucciones localizadas. Corregir parámetros y reintentar.          |
| Flow expirado              | Han pasado más de 120 segundos desde la validación inicial                     | Página `vid/not-found`. Reiniciar el flujo desde el sistema origen.                              |
| Creación de sesión         | Falla `/api/biometric` (red, AWS, etc.)                                        | SnackAlert con el error localizado + registro en Sentry. El modal queda abierto para reintentar. |
| Problemas de dispositivo   | Permisos de cámara negados, cámara no soportada                                | Mensajes específicos `intl.liveness.camera.*`; el usuario ajusta permisos y reintenta.           |
| No coincidencia biométrica | El rostro no coincide con la foto de la JCE o baja confianza                   | Mensaje (ej. `liveness.noMatch`), reseteo automático de la sesión para otro intento.             |
| Timeout                    | El usuario tomó demasiado tiempo en posicionarse                               | Recarga automática tras `LIVENESS_TIMEOUT_SECONDS`; inicia una sesión nueva.                     |

## Referencias de implementación

- Entrada y validaciones: `src/app/[lang]/vid/page.tsx` y `src/app/[lang]/vid/input.schema.ts`
- Gestión de flows: `src/app/[lang]/vid/flow.action.ts`
- Modal y detector: `src/components/LivenessModal` y `src/components/LivenessQuickStart`
- Middleware que expone `x-pathname`: `src/proxy.ts` (permite ajustar layout y navegación en `/vid`)
- Consulta del cliente OAuth: `src/common/lib/oauth.ts`

## Checklist de pruebas para integradores

1. Registre un redirect URI en Cuenta Única que controle y prepare una cédula de pruebas.
2. Navegue manualmente a la URL VID para validar que aparece el saludo y la lista de condiciones.
3. Verifique que la URL cambia a `?flow=...` sin mostrar el token.
4. Ejecute una captura completa en un dispositivo compatible y confirme que llega a su redirect URI.
5. Simule fallas (bloquear cámara, cancelar sesión, usar sesión expirada) para asegurar que su UX explica el reintento.
6. Pruebe que el flow expira después de 120 segundos mostrando la página not-found.
7. Monitoree los logs de su endpoint de redirect para confirmar que puede correlacionar al usuario que regresa (por ejemplo, con su token `state`).

Siguiendo estos pasos, su integración VID se comportará como un bucle OAuth estándar mientras aprovecha la verificación biométrica administrada por el gobierno.
