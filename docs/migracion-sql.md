# Plan de migración: Google Sheets → SQL

> **SUPERSEDED** — El plan de migración vigente es
> [`PLAN_MIGRACION_AZURE.md`](PLAN_MIGRACION_AZURE.md): reescritura del sistema
> en .NET + React/TS con **Azure SQL propia**, según la metodología estándar del
> colegio. La integración con LakeGoetheSee pasa a ser un **ETL de export**, no
> el destino directo.
>
> Este documento se conserva solo como registro histórico del análisis de
> opciones de base de datos (Supabase vs. SQL Server, fases generales). No usar
> como plan de acción.

## 1. Por qué migrar

Hoy el spreadsheet (`Alumnos` ~1.500 filas, `Mapas` ~260, `Cargas` ~3.300)
funciona, pero la extensión a **todos los niveles y materias** lo rompe por
diseño:

- **Volumen**: ~1.500 alumnos × ~10 materias × ~4 evaluaciones × ~8 consignas
  ≈ **500.000 filas de Cargas por año**. Sheets admite 10M de celdas, pero la
  performance degrada mucho antes (el `upsert` del GAS recorre toda la solapa
  en cada guardado).
- **Descarga total**: el `bootstrap` baja *todo* al navegador en cada login.
  Con 500k cargas son decenas de MB por docente por sesión.
- **Concurrencia**: varios admins y decenas de docentes guardando a la vez;
  Apps Script serializa ejecuciones y no hay transacciones.
- **Integridad**: sin claves foráneas, un typo en `ConsignaID` o `DNI` crea
  filas huérfanas silenciosas.

## 2. Opciones evaluadas

| | A. Supabase (Postgres) ⭐ | B. Cloud SQL + API propia | C. Cloud SQL MySQL + GAS (JDBC) |
|---|---|---|---|
| Backend a mantener | Ninguno (PostgREST + RLS) | Servicio en Cloud Run (Node) | El GAS actual |
| Auth | Google OAuth integrado (mismas cuentas @goethe.edu.ar) | A implementar | idToken actual |
| Cambios de frontend | Capa de datos (acotada) | Capa de datos | Ninguno |
| Performance | Buena (REST directo, índices) | Buena | Mala (JDBC en GAS, cuotas) |
| Operación/costo | Free tier; ~USD 25/mes si crece | Instancia + Cloud Run siempre | Instancia MySQL |
| Riesgo principal | Depender de Supabase | Hay que desarrollar y operar una API | Hereda cold starts y deploys del GAS |

**Recomendación: A (Supabase)**. Mantiene la arquitectura actual —frontend
estático en GitHub Pages, sin servidores propios— y elimina justo las piezas
que dieron problemas (cold start del GAS, deploys manuales, permisos del
deployment). La seguridad pasa al motor: **Row Level Security** con el JWT de
Google (dominio `goethe.edu.ar` verificado en la base, no en el cliente).
La opción C sirve solo como puente de emergencia; la B recién tiene sentido si
la escuela quiere todo dentro de Google Cloud con equipo propio.

## 3. Esquema propuesto (normaliza el Mapas denormalizado)

```sql
create table usuarios (
  email       text primary key,          -- @goethe.edu.ar
  nombre      text,
  rol         text not null default 'docente'   -- docente | admin
);

create table alumnos (
  dni         text primary key,
  apellido    text not null,
  nombres     text not null,
  nivel       text not null,             -- KG | EP | ES
  curso       text not null,
  email       text
);

create table materias (
  id          text primary key,          -- MAT, LEN...
  nombre      text not null unique
);

create table evaluaciones (
  id              text primary key,      -- EVA-MAT-001
  materia_id      text not null references materias(id),
  nombre          text not null,
  anio_lectivo    int  not null,
  periodo         text,                  -- 1er Trimestre...
  fecha_caducidad date,
  unique (materia_id, nombre, anio_lectivo)
);

create table evaluacion_cursos (
  evaluacion_id text references evaluaciones(id),
  curso         text not null,
  primary key (evaluacion_id, curso)
);

create table consignas (
  id            bigint generated always as identity primary key,
  evaluacion_id text not null references evaluaciones(id),
  codigo        text not null,           -- C01, C02 (compatibilidad CargaID)
  orden         int  not null,
  contenido     text not null,
  competencia   text,
  eje           text,
  tipo          text not null default 'numerica',  -- numerica | conceptual
  escala        text[],                  -- {Logrado,"En proceso",Iniciado}
  puntaje_max   numeric,
  incremento    numeric,
  activa        boolean not null default true,
  unique (evaluacion_id, codigo)
);

create table cargas (
  id             bigint generated always as identity primary key,
  consigna_id    bigint not null references consignas(id),
  alumno_dni     text  not null references alumnos(dni),
  curso          text  not null,
  docente_email  text  not null references usuarios(email),
  puntaje        numeric,                -- consignas numericas
  valor_escala   text,                   -- consignas conceptuales
  estado_alumno  text  not null default 'Presente',
  observacion    text,                   -- sin limite (pedido KG)
  estado_carga   text  not null default 'borrador',  -- borrador | cerrado
  guardado_en    timestamptz not null default now(),
  cerrado_en     timestamptz,
  unique (consigna_id, alumno_dni)       -- el upsert natural
);
create index on cargas (curso);
create index on cargas (docente_email);
```

Seguridad (RLS, esbozo): lectura para todo JWT con email `@goethe.edu.ar`;
`insert/update` de `cargas` solo sobre filas propias (`docente_email = jwt.email`)
y con la evaluación no cerrada; `consignas/evaluaciones/materias` solo `rol='admin'`.

## 4. Fases

**Fase 0 — Preparación (sin tocar nada)**
1. Crear proyecto Supabase + habilitar login con Google (mismo Client ID u
   otro dedicado; agregar los orígenes de Pages).
2. Crear esquema + políticas RLS. Cargar `usuarios` desde la solapa Admins.

**Fase 1 — Migración de datos (script una sola vez)**
3. Exportar Alumnos/Mapas/Cargas a CSV (la app ya exporta; o desde Sheets).
4. Script de carga (Node) que normaliza: `Mapas` → materias + evaluaciones +
   evaluacion_cursos + consignas; `Cargas` → cargas (resolviendo consigna_id
   por `EvaluacionID+ConsignaID`). Reporte de huérfanos antes de insertar.

**Fase 2 — Frontend con doble backend (en /dev/)**
5. Capa de datos: los puntos de contacto ya están encapsulados —
   `fetchBootstrapBundle()`, `sheetsPost("saveCargas")`, `sheetsPost("upsertMapas")` —
   se implementa el equivalente con `supabase-js` detrás de un flag
   `APP_CONFIG.dataBackend = "sheets" | "sql"`.
6. Carga selectiva (la gran ganancia): en vez de bajar todo, pedir alumnos y
   consignas del curso + cargas de la evaluación visible. Adiós bootstrap
   gigante y cold start.
7. `/dev/` corre con `sql`; producción sigue en `sheets`. Comparar paridad
   (misma grilla, mismos totales) con los E2E existentes.

**Fase 3 — Corte**
8. Congelar carga en Sheets (aviso a docentes), correr la migración final de
   Cargas, apuntar producción a `sql`.
9. El spreadsheet queda como archivo histórico de solo lectura.

**Fase 4 — Post-corte (opcional pero recomendado)**
10. Espejo nocturno SQL → un Sheet de solo lectura (para dirección/reportes
    que viven en planillas), vía GitHub Action o función programada.
11. Backups automáticos (Supabase los incluye) + export mensual a CSV en el repo.

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Políticas RLS mal definidas (fuga o bloqueo) | Suite E2E de permisos antes del corte; revisar con un docente no-admin real |
| Docentes cargando durante el corte | Ventana de corte corta y fuera de horario; estado "solo lectura" en la app |
| Diferencias de datos migrados | Script idempotente + conteos de control (filas por curso/evaluación) comparados contra Sheets |
| Dependencia de un proveedor | Es Postgres estándar: `pg_dump` sale a cualquier hosting (Cloud SQL, Neon, RDS) |

## 6. Esfuerzo estimado

- Fase 0–1: 1 jornada (esquema + script de migración + carga de prueba).
- Fase 2: 2–3 jornadas (capa de datos + carga selectiva + E2E de paridad).
- Fase 3: horas, con checklist.

Total: ~1 semana de trabajo efectivo, sin apuro y probando todo en `/dev/`.
