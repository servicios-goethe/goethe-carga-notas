# Cobertura funcional del sistema GAS — contrato de paridad

> Hito 0 de [`PLAN_MIGRACION_AZURE.md`](PLAN_MIGRACION_AZURE.md). Documenta TODO
> lo que el sistema actual (GAS/Sheets, congelado en el commit `01a0c44`,
> frontend v2026-07-04.1, GAS `2026-07-02-cargas-por-curso`) hace hoy. El
> sistema nuevo se mide contra esta lista: cada ítem se marca cuando la
> funcionalidad equivalente está probada en dev por Joaquín. Este archivo se
> copia al repo `goethe-mapas` en el Hito 1 y se mantiene ahí.
>
> Referencias al código congelado: `app.js` / `apps-script/Codigo.gs` de
> `goethe-carga-notas@01a0c44`.

## 1. Identidad y acceso

| # | Funcionalidad hoy (GAS) | Detalle a preservar | Hito | ✔ |
|---|---|---|---|---|
| 1.1 | Login Google solo dominio `goethe.edu.ar` | Los alumnos usan `@goethemail.net` y NO deben poder entrar. En el nuevo: consentimiento OAuth **Interno** + validación de dominio + usuario ACTIVO en `Usuarios`. | 1 | ☐ |
| 1.2 | Sesión sobrevive recarga (~1 h del idToken, sessionStorage) | Nuevo: cookie auth persistente + mensaje "sesión expirada" amable. Mejora, no paridad exacta. | 1 | ☐ |
| 1.3 | Admins definidos en solapa `Admins` (email + Activo) | Habilita botones Consignas/Exportar mapas. Nuevo: roles en `Usuarios` + matriz en código con tests. | 2-3 | ☐ |
| 1.4 | Cualquier docente ve cualquier curso | **NO se preserva**: el nuevo restringe por `DocentesAsignaciones` (ALTA-1). Requiere ABM de asignaciones + decidir la carga inicial (¿quién asigna docente↔curso×materia?). | 2-3 | ☐ |

## 2. Selección y navegación

| # | Funcionalidad hoy | Detalle a preservar | Hito | ✔ |
|---|---|---|---|---|
| 2.1 | Flujo gated Materia → Período → Evaluación → Curso | La grilla NO aparece hasta elegir todo; ningún selector tiene default; al cambiar Materia se resetean Evaluación/Curso. | 4 | ☐ |
| 2.2 | Período opcional ("Todos"), oculto si los mapas no traen período | — | 4 | ☐ |
| 2.3 | Curso lista SOLO cursos con mapa vigente para materia+evaluación, agrupados por nivel (`optgroup`) | Vigencia = `FechaCaducidad` vacía o futura, `ConsignaActiva`. | 4 | ☐ |
| 2.4 | Cambio de curso conserva lo ya cargado/tipeado de otros cursos | En el nuevo es natural (server-side), pero probarlo explícito: A→B→A no pierde nada. | 4 | ☐ |
| 2.5 | Mientras cargan los registros de un curso: modal bloqueante + botones deshabilitados | Nuevo: spinner/skeleton equivalente; nunca grilla editable con datos incompletos. | 4 | ☐ |
| 2.6 | Buscador de alumno (filtro por nombre) y toggle "Solo incompletos" | — | 4 | ☐ |

## 3. Grilla de carga

| # | Funcionalidad hoy | Detalle a preservar | Hito | ✔ |
|---|---|---|---|---|
| 3.1 | Encabezado con jerarquía **Eje > Competencia > consignas** (grupos con colspan) | Orden de consignas por `ConsignaOrden`. | 4 | ☐ |
| 3.2 | Alumnos en **orden alfabético** (apellido, nombre), numerados | — | 4 | ☐ |
| 3.3 | Consigna **numérica**: input con `max` (PuntajeMax) e incremento (`step`); inválido = alerta visual | Validación: 0 ≤ valor ≤ max, múltiplo del incremento. | 4 | ☐ |
| 3.4 | Consigna **conceptual**: select con la escala de ESA consigna (`EscalaConceptual`, ej. `Logrado\|En proceso\|Iniciado`); escalas distintas pueden convivir en una evaluación | Nuevo: entidades `Escalas`/`EscalasDetalles`. | 2, 4 | ☐ |
| 3.5 | **Estado del alumno**: Presente / Ausente / **Inclusión** | Ausente: fila deshabilitada, cuenta como completa, no suma. Inclusión: el valor **9 = eximido** en esa consigna (no suma puntaje ni máximo) y permite superar el max normal de la celda. | 4 | ☐ |
| 3.6 | **Observación** por alumno (texto libre, sin límite práctico — pedido KG) | — | 4 | ☐ |
| 3.7 | Totales por alumno: puntaje y % (solo consignas numéricas; las conceptuales cuentan para completitud/alertas pero no suman) | Fila completa = todas las consignas con valor válido (o Ausente). | 4 | ☐ |
| 3.8 | Resumen del curso: Alumnos / Completos / Promedio % / Alertas | — | 4 | ☐ |
| 3.9 | Campos legacy `UsoMaterial` y `PudoResolver` viajan en Cargas pero la UI actual ya no los edita | **Decisión pendiente**: ¿migran al modelo nuevo o se archivan? (Está en PLAN_MEJORAS como pregunta del ETL.) | 5 | ☐ |

## 4. Guardado, cierre y borradores

| # | Funcionalidad hoy | Detalle a preservar | Hito | ✔ |
|---|---|---|---|---|
| 4.1 | **Guardar borrador**: sube filas con `EstadoCarga=borrador` (solo celdas con valor; Ausente sube igual) | Nuevo: upsert transaccional + `Auditoria`. | 3 | ☐ |
| 4.2 | **Finalizar carga**: exige todo completo, confirma, sube TODO con `EstadoCarga=cerrado` + `FechaCierre` | Nuevo: cierre **server-side** por curso×evaluación (CRÍTICA-2): rechazar toda escritura posterior. | 3 | ☐ |
| 4.3 | Carga cerrada: grilla y botones bloqueados, subtítulo "carga finalizada", aviso al entrar | — | 3-4 | ☐ |
| 4.4 | Borrador local (localStorage) por curso+materia+evaluación: restaura al volver, aviso "Borrador recuperado" | Nuevo: puede simplificarse (el borrador vive en el server), pero el docente no debe perder tipeo por un F5. | 4 | ☐ |
| 4.5 | Identificación de la carga: `CargaID = evaluacionId-DNI-consignaId` | Pasa a ser el `LegacyId` en el ETL. | 2, 5 | ☐ |
| 4.6 | `DocenteEmail` lo firma el servidor con el email del token (no confiable del cliente) | Igual en el nuevo (identidad de la cookie). | 3 | ☐ |

## 5. Administración de mapas/consignas (solo admins)

| # | Funcionalidad hoy | Detalle a preservar | Hito | ✔ |
|---|---|---|---|---|
| 5.1 | Editor en modal, **modo borrador**: cancelar = descartar todo; nada se aplica hasta "Aplicar cambios" | — | 4 | ☐ |
| 5.2 | Editar consignas de la evaluación: contenido, puntaje máx, incremento, orden, activa, Competencia, Eje, Período, tipo (numérica/conceptual) y escala si es conceptual | La escala solo aparece si el tipo es conceptual (reemplaza puntaje/incremento/orden en la UI). | 4 | ☐ |
| 5.3 | **Nueva evaluación** desde el front (con materia existente o **materia nueva**) | ConsignaIDs autogenerados limpios (C01, C02...). | 4 | ☐ |
| 5.4 | **Duplicar** evaluación existente como punto de partida | — | 4 | ☐ |
| 5.5 | Alcance por cursos: curso puntual o `*` (todos los del nivel), `Nivel`, `FechaCaducidad` | Nuevo: `EvaluacionesCursos` explícito. | 2, 4 | ☐ |
| 5.6 | Exportar mapas (CSV de la solapa Mapas) | Equivalente admin en el nuevo. | 3-4 | ☐ |
| 5.7 | Tras aplicar, los filtros saltan a la evaluación editada/creada | Detalle de UX que los admins ya esperan. | 4 | ☐ |

## 6. Export e importadores

| # | Funcionalidad hoy | Detalle a preservar | Hito | ✔ |
|---|---|---|---|---|
| 6.1 | **Exportar grilla a XLSX** (curso actual: alumnos, estados, notas, totales, observaciones) | Nuevo: server-side (ClosedXML). Nombre de archivo con curso+evaluación+fecha. | 3 | ☐ |
| 6.2 | Import de alumnos por CSV (masivo, valida DNI duplicados) | Nuevo: ABM + import; definir si sigue siendo CSV manual o llega de otro sistema. | 3 | ☐ |
| 6.3 | Import de mapas y de cargas por CSV (herramienta de admin/debug) | Probablemente muere después del ETL; confirmar antes de descartar. | 5 | ☐ |

## 7. Plataforma / operación

| # | Funcionalidad hoy | Detalle a preservar | Hito | ✔ |
|---|---|---|---|---|
| 7.1 | **Embebido en Treffpunkt** (iframe) | Nuevo: `frame-ancestors` solo `goethe.edu.ar` (excepción explícita, resto DENY). Probar el login dentro del iframe (cookies de terceros: puede requerir `SameSite=None; Secure`). | 1, 4 | ☐ |
| 7.2 | Botón "Abrir en pestaña nueva" (fallback si el login no anda embebido) | Conservar hasta verificar 7.1 en producción. | 4 | ☐ |
| 7.3 | Versión visible en consola + cache-busting `?v=` | Nuevo: hash de build de Vite lo resuelve solo; dejar un `/healthz` con versión. | 1 | ☐ |
| 7.4 | Utilidades de diagnóstico (`goethe.status()`, `goethe.ping()`, modo debug) | Equivalente razonable: App Insights + `/healthz`; no hace falta paridad exacta. | 1 | ☐ |
| 7.5 | Responsive básico | Nuevo: patrón `tabla-cards` en mobile (regla de la metodología). | 4 | ☐ |
| 7.6 | Modales propios (nunca `alert()`/`confirm()` nativos) | Ya es regla en ambos sistemas. | 4 | ☐ |

## 8. Datos existentes (entrada del ETL — Hito 5)

- `Alumnos`: ~1.468 filas (Nombres, Apellido, DNI texto, Nivel, Curso, eMail).
- `Mapas`: ~259 filas (una por consigna; ver `MAPAS_HEADERS` en `Codigo.gs:19`).
- `Cargas`: ~6.500+ filas y creciendo (ver `CARGAS_HEADERS` en `Codigo.gs:27`).
- `Admins`: 2 filas (email + Activo).
- Verificación del ETL: conteos por curso×evaluación contra Sheets, reporte de
  no-matcheados ANTES de mover nada, re-ejecutable sin duplicar (LegacyId).
