# Plan de mejoras / registro de pendientes

> Registro único de pendientes de **este** repo (`goethe-carga-notas`), según la
> regla de "registro único de pedidos" de la metodología estándar. Cuando exista
> el repo nuevo (`goethe-mapas`), este rol pasa a
> `PLAN_MEJORAS_WORKFLOW.md` + `BACKLOG_AJUSTES.md` allá.
>
> Contexto general: [`AUDITORIA.md`](AUDITORIA.md) ·
> [`PLAN_MIGRACION_AZURE.md`](PLAN_MIGRACION_AZURE.md)

## Estado del sistema actual

El sistema está en producción y estable tras los fixes de la última sesión. La
decisión tomada es **migrar a Azure** (ver plan). Mientras dura la migración, el
sistema GAS/Sheets sigue operativo y se toca lo mínimo indispensable.

## Pendientes en el sistema actual (GAS/Sheets)

| ID | Prioridad | Pendiente | Estado |
|---|---|---|---|
| M-01 | Alta | **Quick win de seguridad en GAS**: rechazar sobrescritura de cargas `cerrado` en `savecargas` (cierra CRÍTICA-2 de forma barata). | Propuesto — **espera aprobación de Joaquín** |
| M-02 | Alta | **Quick win de seguridad en GAS**: exigir `curso` y validar pertenencia docente↔curso en `readCargas`/`savecargas`, o al menos loguear accesos (mitiga CRÍTICA-1). | Propuesto — **espera aprobación** |
| M-03 | Baja | Expiración/limpieza de borradores en `localStorage`. | Propuesto |

> Nota: no se ejecutó ningún cambio en GAS en la entrega de auditoría (las fases
> de auditoría son de solo lectura). M-01/M-02 se implementan solo si Joaquín
> los aprueba y solo si el corte de migración no es inminente (para no arreglar
> dos veces).

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
