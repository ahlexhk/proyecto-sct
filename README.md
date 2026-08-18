# SCT — Sistema de Control Técnico (Frontend)

Aplicación Angular 18 (Material + plantilla Spike) para la gestión de soporte técnico e inventario de equipos:

- **Centro de soporte** (dashboard): métricas de incidencias (abiertas, en proceso, críticas, resueltas hoy, tiempo promedio de resolución) y lista de pendientes.
- **Incidencias**: registro de solicitudes de soporte con prioridad, solicitante, ubicación, equipo del inventario afectado (opcional) y fotos adjuntas; asignación de técnico (solo rol `tecnico`), cambios de estado con comentarios e historial completo (requiere sesión).
- **Hoja de vida del equipo**: al buscar por Bien Nacional con sesión activa se muestra el historial de movimientos de inventario y las incidencias de soporte del equipo.
- **Notificaciones**: campana en el encabezado que avisa (sondeo cada 30 s) cuando entra una nueva solicitud de soporte o cambia una incidencia.
- **Consulta de equipos** (dashboard): búsqueda pública por Bien Nacional con estado, ubicación y último movimiento.
- **Registro de equipos**: alta de equipos en el inventario (requiere sesión).
- **Control de equipos**: cambios de estado/ubicación/asignación con motivo y observación; cada cambio queda registrado como reporte (requiere sesión).
- **Reportes**: métricas por período (reparados, tiempo promedio de reparación, reubicaciones, retiros) con descarga en PDF y Excel (requiere sesión).

## Desarrollo

```
npm install
npm start        # ng serve en http://localhost:4200
npm run build    # build de producción (dist/)
```

En desarrollo la API se consume por ruta relativa `/api` a través de `proxy.conf.json` (redirige a `http://localhost:3000`), lo que permite probar desde otros dispositivos o exponer la app con un túnel:

```
cloudflared tunnel --url http://localhost:4200
```

(arrancar `ng serve` con `--host 0.0.0.0 --disable-host-check` para aceptar el host del túnel). En producción la URL de la API se configura en `src/environments/environment.prod.ts`.

## Autenticación

- Login con DNI y contraseña contra la API (`/api/users/login`), que devuelve un JWT con expiración de 1 hora.
- `auth.interceptor.ts` adjunta el token a todas las peticiones a la API y redirige al login cuando la sesión expira (401).
- `auth.guard.service.ts` protege las rutas de inventario y reportes; la validez del token (expiración) se verifica localmente antes de considerarlo activo.

## Estructura relevante

```
src/app/
  services/          # auth, interceptor, equipos, reportes, incidencias, notificaciones
  pages/starter/     # centro de soporte + consulta pública de equipos
  pages/ui-components/
    incidents/           # incidencias de soporte (flujo completo)
    equipment/           # registro de equipos
    equipment-control/   # control de cambios (inventario)
    reports/             # reportes y descargas
  layouts/           # shell (sidebar, header con notificaciones)
```
