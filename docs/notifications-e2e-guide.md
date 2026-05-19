# Cuenta Unica + Buzon Ciudadano: guia de pruebas E2E

Esta guia valida el flujo local completo entre Cuenta Unica Ciudadana y Buzon Ciudadano sin exponer credenciales ni enviar la cedula por URL. Cuenta Unica solo expone en su portal notificaciones de cuenta y seguridad; otros temas pueden existir en Buzon para otros canales o productores, pero se filtran fuera del portal CUC.

## Requisitos

- Docker disponible.
- Bun `>=1.3.11`.
- Repositorios locales:
  - `/Users/marluan/work/ogtic/projects/cuenta-unica-registry`
  - `/Users/marluan/work/ogtic/projects/buzon-ciudadano`
- Credenciales de prueba configuradas en el `.env` de Cuenta Unica bajo la seccion `# Computer Use`.

## 1. Levantar Buzon Ciudadano

```bash
cd /Users/marluan/work/ogtic/projects/buzon-ciudadano
cp .env.example .env.local
docker compose up -d postgres
DATABASE_URL=postgres://postgres:postgres@localhost:5433/buzon_ciudadano bun run db:push
bun run dev
```

Buzon debe quedar disponible en `http://localhost:3010`.

## 2. Configurar Cuenta Unica

En `/Users/marluan/work/ogtic/projects/cuenta-unica-registry/.env`, confirmar que existan estas variables server-only:

```bash
BUZON_API_BASE_URL=http://localhost:3010
BUZON_PORTAL_API_KEY=portal-dev-key
```

Luego levantar Cuenta Unica:

```bash
cd /Users/marluan/work/ogtic/projects/cuenta-unica-registry
bun run dev
```

El portal debe quedar disponible en `http://localhost:3000`.

## 3. Ejecutar el flujo E2E automatizado

Con ambos proyectos levantados:

```bash
cd /Users/marluan/work/ogtic/projects/cuenta-unica-registry
bun run test:notifications:e2e
```

El runner:

- Lee la cedula local desde `.env` o `E2E_CITIZEN_ID`.
- Crea una notificacion real en Buzon usando `Idempotency-Key`.
- Valida rechazo sin API key.
- Valida rechazo sin `Idempotency-Key`.
- Marca la notificacion como leida.
- La marca como no leida.
- La archiva y confirma que desaparece del inbox por defecto.
- Consulta archivadas para confirmar que el estado canonico permanece.
- Actualiza una preferencia `tema x canal`, valida persistencia y restaura el valor anterior.

## 4. Validar el portal en navegador

1. Abrir `http://localhost:3000`.
2. Iniciar sesion con el usuario de staging configurado en `.env`.
3. Confirmar que el badge de notificaciones del header usa el conteo real de no leidas.
4. Abrir el drawer de notificaciones.
5. Confirmar que aparecen las notificaciones creadas en Buzon.
6. Marcar una notificacion como leida y confirmar que baja el badge.
7. Marcarla como no leida y confirmar que sube el badge.
8. Archivarla y confirmar que desaparece del drawer y del listado por defecto.
9. Entrar a `/notifications` y probar filtros `Todas`, `No leidas`, `Leidas` y `Archivadas`.
10. Entrar a `/settings` y confirmar que la seccion de preferencias solo muestra los temas `Seguridad` y `Cuenta`, y permite guardar canales por esos temas. En local puede mostrarse un aviso controlado de Ory Settings si el ambiente de identidad no permite `localhost` como URL de retorno; ese aviso no bloquea las preferencias de notificacion.

## 5. Validaciones de calidad

Cuenta Unica:

```bash
cd /Users/marluan/work/ogtic/projects/cuenta-unica-registry
bun run check
bun run typecheck
bun run test:unit
bun run test:integration
bun run build
```

Buzon Ciudadano:

```bash
cd /Users/marluan/work/ogtic/projects/buzon-ciudadano
bun run typecheck
bun run test
bun run build
```

## 6. Comportamiento esperado si Buzon esta caido

El portal no debe volver a mocks ni bloquear el dashboard. Las APIs internas de Cuenta Unica deben responder con colecciones vacias y `unavailable: true`, permitiendo que la UI degrade sin romper la sesion del ciudadano.
