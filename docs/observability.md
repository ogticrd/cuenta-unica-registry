# Logs de v2 en Google Cloud

Cloud Run recoge las líneas JSON escritas a stdout y stderr. El proyecto usa
lib/logging/logger.ts como interfaz propia sobre Pino para emitirlas a stdout;
no requiere SDK de Google ni cuenta de
Sentry. La integración de Next.js permanece en instrumentation.ts.

## Datos y formato

Pino controla la serialización JSON, la fecha y los niveles. LOG_LEVEL permite
establecer el nivel mínimo al iniciar el proceso: trace, debug, info, warn,
error, fatal o silent. Si está vacío o no es válido, se usa info en producción
y debug en los demás ambientes. fatal se traduce a CRITICAL; no termina el proceso.
Todos los niveles se escriben a stdout con severity, incluido ERROR.
La interfaz conserva logger.info(message, context) y
logger.error(message, context, error); los servicios no importan Pino directamente.

Cada entrada puede incluir severidad, mensaje, operación, evento, formulario,
origen, etapa, código, estado HTTP propio y del proveedor, tipo de error y digest.
También incluye ambiente, release, servicio y revisión del contenedor.

Los handlers API usan withRequestLogging para aislar el contexto por solicitud
con AsyncLocalStorage. Se genera un requestId y se propagan la ruta del handler,
el método, el tiempo transcurrido y la traza de Cloud Run. Solicitudes concurrentes
no comparten contexto. El wrapper conserva el body, las cookies y el estado HTTP.
Cuando la solicitud contiene una cookie analytics_context firmada, vigente y
con un journeyId UUID válido, el wrapper incluye ese journeyId en los logs.
Así puede relacionarse un recorrido de analítica con sus solicitudes técnicas.
Sin una cookie válida se omite el campo; el logger no crea otro recorrido ni
acepta identificadores del body o de cabeceras arbitrarias.
En account, liveness-session y liveness-complete, el journey guardado en la
sesión de registro firmada tiene prioridad mientras su contexto de analítica
esté vigente. Esto coincide con los eventos que esas rutas emiten y conserva
la correlación si cambia la cookie de analítica durante registro o recuperación.
Las respuestas 4xx se registran como WARNING y las 5xx como ERROR; los resultados
biométricos y las transiciones relevantes se registran también como INFO.

GOOGLE_CLOUD_PROJECT habilita el campo logging.googleapis.com/trace.
El workflow obtiene el proyecto del contexto de despliegue y establece APP_ENV.
También permite configurar LOG_LEVEL mediante la variable de GitHub del mismo
nombre; si no está definida, el despliegue usa info.
Cloud Run proporciona K_SERVICE y K_REVISION. No se agregan credenciales de Google.

## Correspondencia con Sentry en v1

| Captura en v1 | Captura en v2 |
| --- | --- |
| Excepciones de Next.js en servidor | instrumentation.ts, tipo, frames sanitizados, digest y ruta |
| Excepciones globales del navegador | instrumentation-client.ts y error boundaries, mediante un endpoint de reporte |
| Errores de identificación, registro y recuperación | Formulario, código estable, origen y etapa |
| Errores de verificación de correo | Código y IDs de mensajes de Ory; sin OTP |
| Errores de reCAPTCHA | Operación, configuración/consulta y estado del proveedor; sin tokens ni claves |
| Creación y bloqueo de sesiones biométricas | Origen registration/vid, evento, intento y espera |
| Resultados de prueba de vida | Confianza y umbral, sin imágenes |
| Comparación facial | Inicio, resultado, similitud y umbral, sin imágenes |
| Errores del detector | Estado del detector y tipo de error |
| Fallos de registro en Ory | Estado HTTP, código, formulario y etapa |
| Fallos de recuperación de identidad | Actualización/revocación en v2, conservando el ID existente |
| Feedback con datos de contacto | Presencia de contacto y longitud; el contenido sigue en la API de feedback |
| Ambiente y release | Ambiente, package/version, servicio y revisión |
| Trazas de rendimiento del SDK | Correlación de traza y duración; no instrumentación completa de spans |
| Session Replay | Pendiente para Sentry; los logs no graban sesiones del navegador |

V1 borraba la identidad al recuperar acceso. V2 la actualiza; registra esa
operación en lugar de una eliminación que ya no ocurre.

## Protección de información

El logger selecciona campos explícitos. No serializa configuraciones Axios,
headers, cookies, payloads de proveedores, datos de formularios ni archivos.
Los mensajes deben ser estáticos o controlados por la aplicación.
La redacción de campos de Pino agrega una defensa adicional; no sustituye esta
selección ni la sanitización del contexto y de los frames.

Se omite el mensaje original de las excepciones y se conservan frames
sanitizados. Se enmascaran URLs, correos, cédulas, UUID, IPv4, JWT y patrones
comunes de credenciales. Los IDs de identidad, sesión y flow se convierten en
referencias HMAC con un contexto separado y la clave de la sesión de registro;
si falta esa clave, las referencias se omiten.

El sanitizador no sustituye seleccionar campos seguros. No se registran
contraseñas, OTP, tokens ni evidencia biométrica.

## Reportes del navegador

POST /api/observability/client-errors acepta un esquema estricto de eventos,
formularios y códigos conocidos. Exige mismo origen, JSON y hasta 2048 bytes.
Marca los eventos con origin: browser: son información reportada por un cliente,
no una prueba de que ocurrió un evento de seguridad.

El navegador deduplica y limita a diez reportes por carga de página. El receptor
acepta hasta 120 por minuto por instancia y rechaza el exceso con HTTP 429 y
Retry-After. No registra los rechazos de este endpoint para evitar amplificarlos.
Este límite local controla el volumen de diagnóstico; no es un rate limiter
distribuido ni sustituye la protección de infraestructura contra ataques.
Un fallo del reporte no altera formularios ni genera reintentos automáticos.

## Consultas en Logs Explorer

Errores del servidor:

~~~text
resource.type="cloud_run_revision"
severity>=ERROR
jsonPayload.origin="server"
~~~

Errores biométricos:

~~~text
resource.type="cloud_run_revision"
jsonPayload.operation=~"biometric|liveness"
severity>=WARNING
~~~

Reportes de formularios del navegador:

~~~text
resource.type="cloud_run_revision"
jsonPayload.origin="browser"
jsonPayload.form="register"
~~~

Usar requestId o trace para relacionar entradas de una solicitud.
La correlación no activa por sí sola el muestreo de Cloud Trace.

## Incorporar Sentry después

Se mantienen los puntos de captura y sus contextos. Falta agregar el SDK,
configurar DSN/ambiente/release, aplicar beforeSend y sanitización de breadcrumbs,
y configurar source maps en CI con un token exclusivo del proceso de build.
El contenedor ejecuta Bun: se debe verificar la compatibilidad del SDK elegido
con la versión del runtime y mantener coherentes build y ejecución. El release
de los source maps debe coincidir con el release enviado por Sentry.

Se agrega un destino al logger para mapear operation, form, source y code a tags,
y las mediciones a context/extra. No se debe restaurar el uso de cédulas o correos
como identificadores de diagnóstico. La instrumentación de Next.js sigue
en su archivo separado.
logger.error() actualmente solo escribe logs; no envía excepciones a Sentry.
Al incorporar el SDK, se debe separar la captura explícita de excepciones de la
escritura habitual de logs, sin enviar automáticamente cada WARNING o ERROR.

En el navegador se inicializa Sentry en instrumentation-client y se decide
si reemplaza el transporte HTTP o convive con él. No se deben activar ambos
capturadores globales indiscriminadamente: habría eventos duplicados.
Lo mismo aplica a onRequestError y al adaptador del logger en servidor.

Replay, navegación, spans, muestreo y feedback de Sentry se configuran en esa
integración. No están emulados por Cloud Logging. No es necesario modificar
los flujos de identidad ni esperar esa cuenta para utilizar los logs actuales.

## Comprobación

Probar concurrencia, trazas, sanitización, validación de reportes del navegador,
límites y fallos del transporte. Después del despliegue, generar un fallo
controlado y verificar severity, jsonPayload y correlación en Logs Explorer.
Las pruebas locales validan formato y comportamiento, no el acceso al proyecto GCP.

Referencias: https://docs.cloud.google.com/run/docs/logging y
https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/bun/
