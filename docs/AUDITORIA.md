# Auditoría del sistema Mapa de Aprendizajes (goethe-carga-notas)

> Auditoría adversarial de solo lectura previa a la modernización. Destino de
> referencia: la metodología estándar del colegio
> (`METODOLOGIA_PROYECTOS_AZURE.md` del repo `servicios-goethe/goethe-ats`):
> .NET LTS + React/TS + Azure SQL + Container Apps, seguridad alineada a ISO
> 27001, trabajo por hitos con prueba en dev antes de prod.
>
> El plan de acción derivado de esta auditoría está en
> [`PLAN_MIGRACION_AZURE.md`](PLAN_MIGRACION_AZURE.md). Los pendientes vivos se
> registran en [`PLAN_MEJORAS.md`](PLAN_MEJORAS.md).

## Resumen ejecutivo

El sistema **funciona y está en producción con datos reales** (1.468 alumnos,
259 mapas/consignas, ~6.500 cargas en 2026), pero su arquitectura —frontend
estático público + Google Apps Script + Google Sheets como base de datos— tiene
límites estructurales que ya se manifestaron como **caídas de producción** y
como **debilidades de seguridad que no se pueden cerrar sin cambiar de stack**.
No es un problema de código mal escrito: el código es razonable para lo que es.
Es que la plataforma no da para los requisitos (autorización por curso,
auditoría de notas, PII protegida, operación sin caídas).

**Top 5 hallazgos**

| # | Severidad | Hallazgo | Evidencia |
|---|---|---|---|
| 1 | **Alta** | Cualquier **docente** del dominio puede leer y escribir cargas de **cualquier** curso: no existe relación docente↔curso. (Los alumnos NO entran: usan `@goethemail.net`, bloqueados por el control de dominio.) | `apps-script/Codigo.gs:79-90`, `:157-164` |
| 2 | **Crítica** | El cierre de carga (`EstadoCarga=cerrado`) lo respeta solo el frontend; el backend acepta sobrescribir una evaluación finalizada. | `apps-script/Codigo.gs:86-90` |
| 3 | **Alta** | PII (nombre + DNI de alumnos, notas) y el `idToken` de Google viajan por querystring (GET/JSONP) y quedan en logs de intermediarios. | `app.js:1583`, `apps-script/Codigo.gs:127-142` |
| 4 | **Alta** | Sin auditoría ni historial: el guardado es *last-write-wins*; ante una disputa de nota no hay evidencia de quién la puso ni cuándo. | `apps-script/Codigo.gs:190-225` |
| 5 | **Alta** | Operación frágil: deploy manual del backend (2 caídas en la última sesión), deploys de Pages intermitentes, sin tests ni monitoreo, "restore" = historial de versiones de Sheets. | ver §Fase 0 y §Riesgos |

**Camino recomendado**: migrar a la metodología estándar (Azure), reescribiendo
el sistema en .NET + React/TS con Azure SQL propia. La mayoría de los hallazgos
**no se arreglan en el sistema actual sin rehacerlo**, así que corregir en GAS
sería trabajo tirado. **Decisión tomada**: no se toca más el GAS productivo; el
sistema nuevo se construye en paralelo y al terminar se apaga el viejo. Todos
los hallazgos abiertos se resuelven en la migración (ver §Fase 2).

---

## Fase 0 — Reconocimiento (inventario)

### Stack real

| Capa | Hoy | Fin de soporte / riesgo |
|---|---|---|
| Frontend | Vanilla JS, **2.810 líneas** en un solo `app.js`, sin framework, sin build, sin tests | No hay obsolescencia de runtime (es el navegador), pero sí de **mantenibilidad**: un archivo monolítico sin tipos ni pruebas |
| Hosting frontend | GitHub Pages (repo **público**, obligatorio en el plan gratuito) | Deploys intermitentes (`Deployment failed, try again later.` recurrente); "dev" es una carpeta `/dev/` en el mismo hosting, no un ambiente aislado |
| Backend | Google Apps Script, **274 líneas** (`apps-script/Codigo.gs`), deploy **manual** | Sin CI/CD; cada publicación es un click; 2 outages en la última sesión por deployment mal versionado o mal configurado |
| Base de datos | Google Sheets (solapas Alumnos, Mapas, Cargas, Admins) | Sin transacciones, sin índices, sin constraints; límite de tamaño ya alcanzado (bootstrap explotó con 6.220 filas) |
| Transporte lectura | JSONP (`<script src>`) porque el Web App de GAS solo permite GET anónimo cross-origin así | idToken + parámetros en la URL |
| Transporte escritura | Form POST a un `<iframe>` oculto, *fire-and-forget* (no se lee la respuesta) | No hay confirmación real de escritura; se re-lee con un GET posterior |
| Identidad | Google Identity Services (One Tap), idToken validado server-side (`aud` + dominio `hd`) contra `oauth2.googleapis.com/tokeninfo` | Correcto en concepto; el problema es qué se hace *después* de identificar (autorización) |
| Secretos | No hay secretos server-side reales; el `SPREADSHEET_ID` y el `GOOGLE_CLIENT_ID` están en el código (`Codigo.gs:1`, `:4`) — ambos ya públicos por diseño de la plataforma | El Client ID es público por naturaleza; el Spreadsheet ID no es un secreto pero identifica el almacén |

### Puntos de entrada

- **`doGet(e)`** (`Codigo.gs:46-77`): acciones `health`, `me`, `bootstrap`,
  `alumnos`, `mapas`, `cargas`, `admins`. Todas salvo `health` exigen `idToken`.
- **`doPost(e)`** (`Codigo.gs:79-102`): acciones `savecargas` (cualquier
  docente) y `savemapas`/`upsertmapas` (solo admins, `:93`).

### Integraciones externas

- Google Sheets (datastore), Google Identity (login), Google tokeninfo
  (validación de token). El frontend se **embebe en el portal Treffpunkt**
  (iframe), lo que motivó el cache-busting por versión.

### Verificación del estado real

No hay build ni suite de tests que ejecutar (no existen). La verificación se
hizo **leyendo el código** y, durante la sesión, con pruebas Playwright ad-hoc
sobre copias de trabajo. El sistema está vivo en producción y respondió
`health OK {version: 2026-07-02-cargas-por-curso}` en la última verificación.

---

## Fase 1 — Hallazgos con evidencia

### ALTA-1 — Autorización por curso inexistente

**Evidencia**: `apps-script/Codigo.gs:86-90` (`savecargas`) y `:157-164`
(`readCargas`).

```js
// Codigo.gs:86-90
if (action === "savecargas") {
  const securedData = data.map(row => Object.assign({}, row, { DocenteEmail: user.email }));
  const rows = upsertRows(SHEETS.cargas, CARGAS_HEADERS, securedData, ["CargaID"]);
  return jsonOk({ rows });
}
```

`authorizeUser` (`:112-122`) solo verifica que el email termine en
`@goethe.edu.ar`. **No existe ninguna tabla ni chequeo que relacione un docente
con los cursos/materias que le corresponden.** Cualquier usuario autenticado del
dominio puede:
- **Leer** las cargas de cualquier curso: `GET ?action=cargas&curso=EP5A&idToken=…`
  (`:71`, `readCargas` filtra por el curso que el cliente pida, sin validar que
  sea suyo).
- **Escribir** notas de cualquier curso: un `POST savecargas` con `CargaID` y
  `Curso` arbitrarios entra sin objeción; `DocenteEmail` se setea al del token,
  pero eso no impide la escritura, solo la "firma".

**Escenario que lo dispara**: un docente autenticado arma un `POST savecargas`
(o un `GET ?action=cargas&curso=…`) con un curso que no es suyo. `DocenteEmail`
se firma con su token, pero la escritura entra igual.

**Alcance acotado (confirmado)**: los **alumnos usan `@goethemail.net`**, un
dominio distinto, así que el control `endsWith("@goethe.edu.ar")`
(`Codigo.gs:117`) **los bloquea por completo**: nunca pueden loguear ni hacer
POST. El vector alumno-edita-su-nota **no aplica**. El riesgo real es entre
docentes (un docente alterando el curso de otro) y de repudio, no de alumnos.
Por eso este hallazgo es **Alto**, no Crítico. Igual debe cerrarse: la
integridad de las notas no puede depender de que ningún docente arme un POST a
mano.

### CRÍTICA-2 — El cierre de carga es solo cosmético (frontend)

**Evidencia**: `apps-script/Codigo.gs:86-90`.

El estado `cerrado` de una evaluación por curso se guarda como valor en la
columna `EstadoCarga`, y el **frontend** deshabilita los inputs cuando lo ve
(`app.js`, `currentLoadIsClosed`). Pero `doPost`/`savecargas` **no consulta el
estado previo**: un POST con `EstadoCarga=borrador` sobre una carga ya cerrada
la reabre y la sobrescribe. El cierre no tiene fuerza en el servidor, que es el
único lugar donde importa.

### ALTA-3 — PII y token en la URL (Ley 25.326)

**Evidencia**: `app.js:1583`, `apps-script/Codigo.gs:127-142`.

```js
// app.js:1583 — el idToken y todos los params van en el querystring
const payload = await jsonpRequest(url, { action, ...params, idToken: googleIdToken, t: Date.now() });
```

El transporte JSONP obliga a mandar **todo por GET**: el `idToken` (JWT de
Google, ~1.226 chars), y en las respuestas, nombre + DNI de alumnos y sus notas.
Las URLs quedan registradas en logs de servidores intermedios, historial del
navegador y referrers. El JWT es de corta vida (~1h) pero durante ese lapso es
reutilizable si se intercepta. Datos personales de menores (nombre, DNI,
desempeño académico) circulando por querystring es un problema de cumplimiento
bajo la **Ley 25.326 de Protección de Datos Personales**.

### ALTA-4 — Sin auditoría ni historial; guardado last-write-wins

**Evidencia**: `apps-script/Codigo.gs:190-225` (`upsertRows`).

El upsert busca la fila por clave (`CargaID`) y la **pisa** con
`setValues(...)`. No hay tabla de auditoría, ni versionado de notas, ni registro
de quién cambió qué y cuándo (más allá de `FechaGuardado`/`DocenteEmail` de la
*última* escritura, que también se pisan). Ante una disputa ("mi hijo tenía un 7
y ahora figura un 4") **no hay evidencia**. La metodología exige tabla
`Auditoria` append-only escrita en la misma transacción que la mutación
(regla 0.6); acá no existe el concepto de transacción.

### ALTA-5 — Operación frágil (deploy, tests, monitoreo, restore)

- **Deploy backend manual**: publicar el Web App de GAS es un paso manual y
  propenso a error; **dos caídas de producción en la última sesión** se
  originaron en deployments (uno por configuración de acceso, otro por versión
  desincronizada).
- **Deploy frontend intermitente**: GitHub Pages devolvió `Deployment failed,
  try again later.` repetidas veces; hubo que resetear la fuente en Settings
  varias veces por deploy.
- **Sin tests automatizados** (0 archivos de test en el repo).
- **Sin monitoreo/alertas**: si el backend cae, se entera un docente.
- **"Restore"** = historial de versiones de Google Sheets, no un backup con
  política ni prueba de restauración.

### MEDIA-6 — Escalabilidad de la plataforma

- El **bootstrap ya explotó** por tamaño de payload cuando Cargas creció a
  6.220+ filas; se mitigó filtrando por curso en el servidor (`readCargas`,
  `:157-164`) y con carga perezosa por curso en el frontend. Es un parche sobre
  un límite de plataforma, no una solución.
- **Cold start** de GAS medido en ~6 s en la primera llamada (arranque en frío).
- **JSONP** limita el tamaño de la respuesta (es una URL de `<script>`).
- Sheets no tiene índices ni transacciones: toda lectura es "traé la solapa
  entera y filtrá en memoria" (`readSheetObjects`, `:166-181`).

### MEDIA-7 — `ensureHeaders` pisa encabezados divergentes en silencio

**Evidencia**: `apps-script/Codigo.gs:227-237`.

Si los encabezados de una solapa no coinciden exactamente con los esperados,
`ensureHeaders` los **sobrescribe sin avisar** (`:234-236`). Un reordenamiento
manual de columnas en la planilla puede desalinear datos silenciosamente.

### MEDIA-8 — Repo público forzado

GitHub Pages gratuito exige repo público. El código del frontend (incluida toda
la lógica de negocio y los IDs de conexión) es visible para cualquiera. No es
explotable por sí mismo —la seguridad no depende de ocultar el código— pero
combinado con ALTA-1 baja la barrera para construir el POST malicioso.

### BAJA-9 — Misceláneos

- **XLSX artesanal**: el export arma el ZIP/OOXML a mano en el cliente
  (sin dependencias). Funciona, pero es código frágil de mantener.
- **Borradores en localStorage** sin expiración: notas en borrador quedan en el
  dispositivo indefinidamente (`app.js`, `saveLocalDraft`).

### Supuestos y hechos confirmados

1. **Los alumnos NO pueden loguear** → confirmado por Joaquín: usan
   `@goethemail.net`, un dominio distinto al `@goethe.edu.ar` que exige el
   control de acceso (`Codigo.gs:117`). El vector alumno-edita-su-nota está
   cerrado por diseño; por eso ALTA-1 no es Crítica.
2. **MFA está exigido en las cuentas Google del dominio** → validar en la
   consola de Google Workspace. La metodología lo exige (§2.1).
3. **El backend de GAS corre "como yo" (el dueño) con acceso "Cualquiera"** →
   confirmado durante la sesión (es lo que hace funcionar el JSONP anónimo).

### Riesgos que el sistema NO aborda hoy

- Alteración de notas por un docente sobre cursos ajenos (actor interno).
- Repudio: no se puede probar quién puso una nota.
- Continuidad: no hay ambiente de dev real, ni rollback, ni backup probado.
- Cumplimiento: PII de menores sin las garantías de la Ley 25.326.

---

## Fase 2 — Propuesta (qué corregir dónde)

**Decisión de Joaquín**: no se toca más el sistema actual en GAS. Se construye
el sistema nuevo **en paralelo**, y cuando esté listo se apaga todo lo viejo
(corte, Hito 6). Los hallazgos abiertos se resuelven **todos en la migración**,
no en GAS: parchear una plataforma que se va a apagar es trabajo tirado, y
tocar el GAS productivo agrega riesgo de caída sin beneficio duradero.

### Ya resuelto en esta sesión (antes de esta decisión)

- Cargas por curso en el servidor (mitiga el límite de payload) — `readCargas`.
- Flujo de selección gated Materia→Período→Evaluación→Curso.
- Fix de la race condition que perdía cargas al cambiar de curso.
- Modal bloqueante mientras cargan los registros de un curso.
- Validación server-side del idToken (`aud` + dominio).

### Los hallazgos abiertos NO se parchean en GAS

Los quick wins que se habían considerado (rechazar sobrescritura de cargas
cerradas, validar pertenencia docente↔curso) **no se implementan**: implican
tocar `Codigo.gs` productivo. Se aceptan como **riesgo residual acotado** hasta
el corte (recordar: los alumnos no pueden loguear, así que el vector externo
está cerrado; el residual es entre docentes). Todo se cierra de raíz en la
migración.

### Todo → migración

Autorización por asignación, auditoría append-only, PII fuera de la URL,
transacciones, CI/CD, tests, monitoreo, ambiente de dev real, backup con
restore probado: **no son parcheables sobre Sheets/GAS**. Se resuelven de raíz
en el stack estándar. El detalle por hitos está en
[`PLAN_MIGRACION_AZURE.md`](PLAN_MIGRACION_AZURE.md).

---

## Fase 3 — Repositorio y versionado (resumen)

El detalle operativo (repo privado nuevo, congelamiento del GAS actual,
`CLAUDE.md`, escaneo de secretos) está en el Hito 0 de
[`PLAN_MIGRACION_AZURE.md`](PLAN_MIGRACION_AZURE.md). Nota de secretos: el
código actual no contiene credenciales rotables —el `GOOGLE_CLIENT_ID` es
público por diseño y el `SPREADSHEET_ID` identifica un almacén, no autoriza por
sí mismo—, así que no hay nada que rotar hoy; el control de secretos vía Key
Vault arranca con el sistema nuevo.
