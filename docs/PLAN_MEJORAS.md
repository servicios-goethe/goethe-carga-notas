# Plan de mejoras / registro de pendientes

> Registro único de pendientes de **este** repo (`goethe-carga-notas`), según la
> regla de "registro único de pedidos" de la metodología estándar. Cuando exista
> el repo nuevo (`goethe-mapas`), este rol pasa a
> `PLAN_MEJORAS_WORKFLOW.md` + `BACKLOG_AJUSTES.md` allá.
>
> Contexto general: [`AUDITORIA.md`](AUDITORIA.md) ·
> [`PLAN_MIGRACION_AZURE.md`](PLAN_MIGRACION_AZURE.md)

## Estado del sistema actual

El sistema está en producción y estable tras los fixes de la última sesión.
**Decisión de Joaquín: no se toca más el GAS productivo.** El sistema nuevo se
construye **en paralelo** en Azure y, cuando esté listo, se apaga todo lo viejo
(corte). Nada de parches sobre la plataforma que se va a apagar.

## Pendientes (todos se resuelven en la migración, no en GAS)

| ID | Prioridad | Pendiente | Estado |
|---|---|---|---|
| M-01 | Alta | **Autorización por curso** (relación docente↔curso↔alumno): que cada docente solo vea y cargue **sus** cursos autorizados. Hoy cualquier docente ve cualquier curso. **En algún momento —Claude decide cuándo, según cómo avance la migración— puede convenir introducir la lectura de esa tabla de relación**; el lugar natural es el sistema nuevo (Hito 2 `DocentesAsignaciones` + Hito 3 auth por endpoint del [plan](PLAN_MIGRACION_AZURE.md)). Cierra ALTA-1 de la auditoría. | Planificado en la migración |
| M-02 | Crítica | **Cierre de carga server-side**: que una evaluación cerrada no se pueda reabrir/sobrescribir desde el backend. Cierra CRÍTICA-2. | Planificado en la migración (Hito 3) |
| M-03 | Baja | Expiración/limpieza de borradores en `localStorage`. | Planificado en la migración (Hito 4) |

> Nota: estos pendientes **no se parchean en GAS**. El riesgo residual (entre
> docentes; los alumnos no pueden loguear porque usan `@goethemail.net`) se
> acepta como acotado hasta el corte.

## Ya resuelto en esta sesión

- Validación server-side del `idToken` (aud + dominio).
- Cargas por curso en el servidor (mitiga el límite de payload del bootstrap).
- Jerarquía Competencia / Eje / Período; calificación conceptual con escala por
  consigna.
- Refactor del editor de consignas (borrador, nueva evaluación, duplicar).
- Avisos en modal propio (sin `alert()`/`confirm()` nativos).
- Orden alfabético de alumnos; export XLSX real.
- Cache-busting por versión (`?v=`) para el iframe de Treffpunkt.
- Fix de la race condition que perdía cargas al cambiar de curso.
- Flujo de selección gated Materia→Período→Evaluación→Curso.
- Modal bloqueante mientras cargan los registros de un curso.

## Preguntas abiertas para el ETL de export a LakeGoetheSee

Estas venían de [`integracion-sql-server.md`](integracion-sql-server.md); siguen
vigentes, pero ahora aplican al **ETL de export** (Hito 5b del plan), no al
diseño de la base del sistema (que es Azure SQL propia). Condicionan la
automatización del export:

1. **Backend del Lake**: ¿la API de LakeGoetheSee (RefreshToken/Fidu) está
   activa, en qué tecnología, y puede recibir el export? ¿O el export escribe
   directo a tablas/vistas del SQL Server on-prem?
2. **Asignatura madre**: ¿`EsMadre`/`ID_Madre` representa la materia transversal
   y la Evaluación debe colgar de ahí en el Lake?
3. **Período**: `Calificaciones.Periodo` es `int` — ¿la convención es 1/2/3
   (trimestres)? El sistema hoy usa texto ("1er Trimestre").
4. **KG**: ¿los mapas de KG califican directo a nivel Competencia (sin
   consignas) en el modelo del Lake?
5. **Matriculaciones**: ¿`Personas_Asignatura` está poblada para todos los
   niveles/materias donde se carga, o el ETL debe generarla/reportarla?
6. **Conectividad**: ¿el SQL/API del Lake es accesible desde Azure
   (brazilsouth), o es solo red interna? Define si el export corre desde Azure,
   desde on-prem, o vía un componente puente.

## Pedidos nuevos

_(Se agregan acá al recibirse, con fecha e ID.)_
