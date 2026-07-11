# Plan de migración a Azure — Mapa de Aprendizajes

> Plan de acción derivado de [`AUDITORIA.md`](AUDITORIA.md). Converge a la
> metodología estándar del colegio (`METODOLOGIA_PROYECTOS_AZURE.md`, repo
> `servicios-goethe/goethe-ats`). Pendientes vivos en
> [`PLAN_MEJORAS.md`](PLAN_MEJORAS.md).
>
> **Estado**: propuesta. Nada de esto está ejecutado. La creación del repo
> nuevo y de recursos Azure es tarea de Joaquín (con aprobación explícita por
> hito). Esta sesión solo produce documentación.

## Por qué migrar (en una línea)

El sistema actual funciona pero su plataforma (Sheets + GAS + Pages público) no
permite cerrar los hallazgos críticos de la auditoría —autorización por curso,
auditoría de notas, PII protegida, operación sin caídas— sin cambiar de stack.
Migrar es más barato que parchear lo imparcheable.

## Decisiones de arquitectura

| Tema | Decisión |
|---|---|
| Repo | **Nuevo, privado**: `servicios-goethe/goethe-mapas` (lo crea Joaquín; esta sesión no tiene permiso de creación de repos). El actual `goethe-carga-notas` se congela con tag y se deja como histórico. |
| Backend | .NET LTS (hoy 10), minimal APIs, EF Core |
| Base | **Azure SQL Database propia** (`sqldb-goethe-mapas`), Basic al inicio. *Una base por sistema*: nada de escribir directo en LakeGoetheSee. La integración con el Lake es por **ETL de export documentado** (ver Hito 5). |
| Frontend | React + TypeScript + Vite, SPA servida por el backend; i18n ES/DE si se pide |
| Secretos | Azure Key Vault (prod con purge protection); los carga Joaquín por el portal |
| Hosting | Azure Container Apps (dev min-replicas 0; prod min-replicas 1 + ReadyToRun) |
| Observabilidad | Log Analytics + Application Insights por ambiente |
| Identidad | Google OAuth (dominio `goethe.edu.ar`) + tabla `Usuarios` propia; cookie auth |
| CI/CD | GitHub Actions con OIDC federado (cero secretos de Azure en GitHub); deploy-dev automático, deploy-prod manual con SHA + confirmación "DESPLEGAR" |
| Región | brazilsouth |
| Naming | `rg-goethe-mapas-dev\|prod`, `app-goethe-mapas-*`, `sql-goethe-mapas-*` / `sqldb-goethe-mapas`, `kv-goethe-mapas-*`, `stgoethemapas<env>`, `cae-goethe-mapas-*`, `appi-goethe-mapas-*`, ACR `acrgoethemapasdev` |

**Deprecación de GitHub Pages**: el frontend actual deja de ser el sistema. En
el corte, `goethe-carga-notas` (Pages) sirve solo una página de redirección a
la URL nueva, y se actualiza el iframe del portal Treffpunkt.

## Alcance funcional (paridad con el sistema actual)

Todo lo que el sistema hace hoy y debe seguir haciendo. Es el checklist contra
el que se mide la migración (se materializa en `COBERTURA_VS_CHECKLIST_GAS.md`
en el Hito 0):

- Login con cuenta del dominio `@goethe.edu.ar`.
- Flujo de selección **gated** Materia → Período → Evaluación → Curso (recién
  rediseñado; se porta tal cual: la grilla no aparece hasta elegir los cuatro, y
  Curso solo lista los cursos con mapa vigente de esa materia+evaluación).
- Grilla de carga con **jerarquía Eje > Competencia** como agrupamiento de
  encabezados.
- **Calificación numérica** (puntaje máx + incremento por consigna) y
  **conceptual** (escala de valores por consigna, ej. `Logrado|En proceso|
  Iniciado`), pudiendo coexistir distintas escalas en una misma evaluación.
- **Estado del alumno** en la evaluación: Presente / Ausente / Inclusión.
- **Observación** por alumno (texto largo, sin límite práctico — pedido KG).
- **Borrador y cierre** de carga por curso × evaluación (el cierre debe ser
  server-side esta vez — cierra CRÍTICA-2).
- **Export** de la grilla a XLSX (ahora server-side, ver Hito 3).
- **Administración de mapas/consignas**: editor borrador (cancelar = descartar),
  crear evaluación/materia nueva, duplicar existente, ConsignaIDs autogenerados.
- **Embebido en Treffpunkt** (iframe): excepción explícita de `frame-ancestors`
  solo para `goethe.edu.ar`.
- Modales propios (ya es regla cumplida; nunca `alert()`/`confirm()` nativos).
- Responsive (patrón `tabla-cards` en mobile para la grilla).

## Roadmap por hitos

Cada hito: se prueba **en dev primero**; prod solo con aprobación explícita de
Joaquín. Esfuerzos en semanas-persona, orientativos.

### Hito 0 — Preparación y arranque (~1 sem)

- Crear repo privado `servicios-goethe/goethe-mapas` con `.gitignore` correcto
  (credenciales, `.env`, backups, artefactos) y `CLAUDE.md` (propósito,
  arquitectura, comandos build/test/deploy, nombres de variables de entorno
  **sin valores**, convenciones).
- **Congelar** el GAS actual: tag en `goethe-carga-notas`, y
  `COBERTURA_VS_CHECKLIST_GAS.md` (funcionalidad actual vs. la nueva).
- Escaneo de secretos antes del primer push (no debería haber credenciales
  rotables; confirmarlo).
- Resource groups `rg-goethe-mapas-dev|prod` + **presupuestos con alertas
  50/80/100%** en ambos.
- **Proyecto GCP propio** para el cliente OAuth (no reusar el de otro sistema —
  lección aprendida de la metodología), con redirect URIs `<url>/signin-google`.
- Key Vaults (prod con purge protection); secretos cargados por Joaquín.
- **Riesgos**: acceso a Azure/GCP; que el Client ID nuevo requiera reconfigurar
  el consentimiento del dominio. **Prueba**: `rg` creados, presupuesto activo,
  login de prueba contra el proyecto GCP nuevo.

### Hito 1 — Esqueleto (~1-2 sem)

- .NET 10 minimal APIs + EF Core; React/TS/Vite servida por el backend.
- `/healthz`; **cookie auth con Google OAuth** (solo en `/auth/login`); dominio
  permitido + usuario **ACTIVO** en tabla `Usuarios` (si no: 401/403 JSON, nunca
  redirect en llamadas API).
- Tabla `Usuarios` + **superadmin hardcodeado** `servicios@goethe.edu.ar`.
- Tabla `Auditoria` append-only desde el día 1.
- CI/CD OIDC (deploy-dev automático, deploy-prod manual con "DESPLEGAR");
  Container Apps + App Insights por ambiente.
- **Regla**: ninguna feature antes de que esto esté verde en dev.
- **Prueba**: login real de Joaquín en dev, `/healthz` OK, una entrada de
  auditoría registrada, deploy-prod manual ejerciendo el gate.

### Hito 2 — Modelo de datos + DER (~1 sem)

`docs/DER.md` en mermaid (convenciones §4 de la metodología: español,
PascalCase, plural; PK `Id`; strings con MaxLength; fechas UTC `datetime2`;
CHECK constraints para dominios cerrados; `LegacyId` UNIQUE en migradas).

Entidades:

- **Usuarios**, **Alumnos** (LegacyId = DNI), **Cursos**, **Materias**.
- **Evaluaciones** (nombre, período, año, vigencia) y **EvaluacionesCursos**
  (alcance por curso + **cierre**: `Estado`, `FechaCierre`, `CerradoPor`).
- **Consignas** (Competencia, Eje, Orden, Contenido, TipoCalificacion,
  PuntajeMax, Incremento) colgando de Evaluación.
- **Escalas** + **EscalasDetalles** (valor literal + valor numérico + umbral) —
  reemplaza el texto `Logrado|...` por una entidad reutilizable.
- **Cargas** (nota numérica o referencia a EscalaDetalle, estado del alumno).
- **ObservacionesAlumnos** (texto largo por alumno × evaluación).
- **DocentesAsignaciones** (docente ↔ curso × materia) — **la tabla que cierra ALTA-1**; ABM administrado por superadmin.
- **OpcionesMaestras** (Tipo + Valor), **Parametros** (clave/valor con
  allowlist en código), **Auditoria** (append-only, DetalleJson).
- CHECK constraints generados desde los catálogos del código (Domain) para que
  código y base no diverjan.
- `docs/ROLES_Y_PERMISOS.md` con la **matriz de permisos en código + tests**
  (no editable por pantalla).
- **Prueba**: migraciones EF aplicadas en dev, DER commiteado en el mismo commit
  que el esquema, tests de la matriz de permisos verdes.

### Hito 3 — Backend seguro (~2-3 sem)

- **Autorización server-side en cada endpoint** por `DocentesAsignaciones`: un
  docente solo lee/escribe cargas de sus cursos × materias (cierra ALTA-1).
- **Bootstrap selectivo** por curso/materia (muere la descarga total y el
  JSONP; la PII deja de viajar por URL — cierra ALTA-3).
- **Upsert de cargas transaccional**: validación allowlist (rangos de puntaje,
  valores de escala, estados), **chequeo de cierre server-side** (cierra
  CRÍTICA-2) y **escritura en `Auditoria` en la misma transacción** (cierra
  ALTA-4).
- Cierre de carga por curso × evaluación (endpoint dedicado).
- Administración de mapas/consignas (solo roles autorizados).
- **Export XLSX server-side** (ClosedXML) — reemplaza el ZIP artesanal del
  cliente (cierra BAJA-9).
- Import de alumnos (ABM o carga inicial).
- Endpoints públicos (si los hubiera): rate limiting, validación estricta.
- **Prueba**: suite xUnit (dominio con matriz de casos; servicios contra SQLite
  en memoria); intento explícito de escribir en curso ajeno / carga cerrada →
  rechazado con test que lo prueba.

### Hito 4 — Frontend pantalla por pantalla (~2-3 sem)

Joaquín prueba cada entrega en dev antes de seguir:

1. Login + shell (topbar, estado de sesión, "sesión expirada" amable).
2. **Selección gated + grilla de carga** (el corazón; portar el flujo
   rediseñado, jerarquía Eje>Competencia, numérica + conceptual, estados,
   observaciones, borrador/cierre).
3. Administración de consignas (borrador, nueva evaluación/materia, duplicar).
4. Export.

Todo con modales propios y responsive `tabla-cards`.

- **Prueba**: recorrido completo de un docente real en dev, pantalla por
  pantalla, con ajustes entrando como items AJ-0NN en el backlog.

### Hito 5 — ETL de datos (~1-2 sem)

**a) Migración inicial Sheets → Azure SQL** (idempotente):

1. Resolver identidades: DNI (Sheets, texto) → `Alumnos.LegacyId`; curso →
   `Cursos`; materia → `Materias`. **Reporte de no-matcheados ANTES de mover
   nada.**
2. Crear `Escalas`/`EscalasDetalles` desde las escalas usadas (`Logrado|...`).
3. Mapas → `Evaluaciones` + `EvaluacionesCursos` + `Consignas` (el
   `ConsignaID`/`Codigo` preserva el vínculo).
4. Cargas (~6.500 filas 2026) → `Cargas` + `ObservacionesAlumnos`.
5. **Verificación**: conteos por curso × evaluación comparados contra Sheets;
   el ETL es re-ejecutable sin duplicar (LegacyId UNIQUE).

**b) ETL de export hacia LakeGoetheSee** (pedido explícito de Joaquín —
documentar para automatizar):

- La base del sistema es propia y aislada (regla §4.1: nunca joins entre bases).
  La integración con el SQL Server 2022 on-prem (LakeGoetheSee) se hace por
  **export documentado**, no escribiendo el sistema directo en sus tablas.
- Documentar: **vistas SQL estables** en `sqldb-goethe-mapas` que expongan las
  notas en la forma que el Lake espera, y el **mapeo de entidades** hacia las
  tablas académicas del Lake (Calificaciones, Mapa_Aprendizaje(_Eje)
  (_Competencia), Personas_Asignatura, Escalas/EscalasDetalle). El análisis de
  ese mapeo ya existe en
  [`integracion-sql-server.md`](integracion-sql-server.md) y se **reutiliza como
  referencia** (queda claro que su rol pasó de "destino" a "spec del ETL de
  export").
- Definir la mecánica del job (frecuencia, disparo, idempotencia por LegacyId
  del lado del Lake) y quién lo corre. **Preguntas abiertas** que condicionan
  esto están listadas en [`PLAN_MEJORAS.md`](PLAN_MEJORAS.md).
- **Prueba**: correr el export contra un entorno de prueba del Lake y verificar
  conteos; nunca contra el Lake productivo sin aprobación.

### Hito 6 — UAT, producción y corte (~1-2 sem)

- `docs/UAT_CHECKLIST.md` por rol; email en modo prueba si aplica.
- Corte con checklist propio (`OPERACION_AZURE.md`, runbook + checklist):
  - GAS/Sheets a **solo lectura** (histórico).
  - **Deprecar GitHub Pages**: `goethe-carga-notas` sirve una redirección a la
    URL nueva.
  - Actualizar el **iframe de Treffpunkt** a la URL nueva.
  - **Prueba de restore** del backup de Azure SQL.
  - Entrega de accesos.
- **Prueba**: UAT firmado por rol; el sistema viejo redirige; restore probado.

## Documentos mínimos del repo nuevo (metodología §3.5)

README (stack + orden de lectura), `PLAN_MIGRACION_AZURE.md`, `bitacora/`,
`DER.md`, `ROLES_Y_PERMISOS.md`, `OPERACION_AZURE.md`, `SEGURIDAD_ISO27001.md`,
`UAT_CHECKLIST.md`, `PLAN_MEJORAS_WORKFLOW.md`, `BACKLOG_AJUSTES.md`,
`COBERTURA_VS_CHECKLIST_GAS.md`.

## Cómo se mapea cada hallazgo de la auditoría a este plan

| Hallazgo | Se cierra en |
|---|---|
| ALTA-1 (autorización por curso) | Hito 2 (`DocentesAsignaciones`) + Hito 3 (auth por endpoint) |
| CRÍTICA-2 (cierre solo frontend) | Hito 3 (chequeo de cierre server-side) |
| ALTA-3 (PII/token en URL) | Hito 1 (cookie auth) + Hito 3 (bootstrap selectivo, sin JSONP) |
| ALTA-4 (sin auditoría) | Hito 1 + Hito 3 (`Auditoria` en la transacción) |
| ALTA-5 (operación frágil) | Hito 1 (CI/CD, tests, App Insights) + Hito 6 (restore) |
| MEDIA-6 (escalabilidad) | Todo el plan (Azure SQL con índices/transacciones) |
| MEDIA-7 (`ensureHeaders`) | Desaparece con Sheets |
| MEDIA-8 (repo público) | Hito 0 (repo privado) |
| BAJA-9 (XLSX/localStorage) | Hito 3 (export server-side) + Hito 4 |
