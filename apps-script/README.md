# Backend Apps Script

Código fuente del Web App de Google Apps Script que la app usa como backend
(lee/escribe el spreadsheet `1GXOSs1tNHBbv4AOYhOpgrOB4Jz5p6QU3HTqBzufFXDc`).

- `Codigo.gs` → contenido del archivo `Código.gs` del proyecto Apps Script.
- `appsscript.json` → manifiesto del proyecto (habilitarlo en ⚙️ Configuración
  del proyecto → "Mostrar el archivo de manifiesto appsscript.json").

## Cómo desplegar una nueva versión (manteniendo la URL)

1. Abrir el editor: desde el Sheet → **Extensiones → Apps Script**.
2. Pegar el contenido de `Codigo.gs` y `appsscript.json` (completos).
3. Si el manifiesto agregó permisos: ejecutar una vez la función
   `authorizeSetup` (▶ Ejecutar) y aceptar los permisos.
4. **Implementar → Gestionar implementaciones → ✏️ Editar** sobre la
   implementación activa → **Versión: Nueva versión** → **Implementar**.
   - ⚠️ NO crear una "Nueva implementación": cambiaría la URL `/exec` y habría
     que actualizar `APP_CONFIG.scriptUrl` en `app.js`.

## ⚠️ Configuración crítica del deployment

En "Gestionar implementaciones", la implementación debe quedar:

| Campo | Valor obligatorio |
|---|---|
| Ejecutar como | **Yo** (la cuenta que administra el Sheet) |
| Quién tiene acceso | **Cualquier persona** (anónimo — NO "Cualquiera con una cuenta de Google") |

La lectura se hace por JSONP (`<script src>`), que es una request **anónima**:
si el acceso queda restringido a cuentas de Google, Google corta la request
antes de llegar al código y la app muestra "No se pudo cargar Apps Script"
para todos los usuarios menos el dueño. La seguridad real la da la validación
del `idToken` (dominio `goethe.edu.ar` + Client ID) dentro de `authorizeUser`.

## Esquema de la solapa Mapas (jerarquía y tipos de calificación)

`MAPAS_HEADERS` incluye al final: `Competencia`, `Eje`, `PeriodoEvaluacion`,
`TipoCalificacion` y `EscalaConceptual`. Van al final a propósito: el orden de
las columnas existentes no cambia y el frontend de producción anterior sigue
funcionando aunque el backend ya escriba las columnas nuevas.

- `TipoCalificacion`: `numerica` (default) o `conceptual`.
- `EscalaConceptual`: valores separados por `|` (ej. `Logrado|En proceso|Iniciado`),
  editable por materia. Las consignas conceptuales se cargan con un desplegable
  y no suman al puntaje; el valor elegido se guarda como texto en `Puntaje`
  de la solapa Cargas (sin cambios de esquema en Cargas).

Todo se administra desde el modal "Administrar mapas" de la app (admins); no
hace falta cargar nada a mano en el Sheet.
