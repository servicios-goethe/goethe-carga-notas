# Integración con SQL Server 2022 (modelo LakeGoetheSee)

> **Rol actualizado** — Ya **no** es el destino de la migración. El sistema
> migra a **Azure SQL propia** (ver [`PLAN_MIGRACION_AZURE.md`](PLAN_MIGRACION_AZURE.md),
> "una base por sistema"). Este documento se conserva como **referencia/spec del
> ETL de export** hacia LakeGoetheSee (Hito 5b del plan): el mapeo de entidades
> a las tablas académicas del Lake que hay acá abajo es exactamente lo que ese
> ETL necesita. Las preguntas abiertas de la §5 se movieron a
> [`PLAN_MEJORAS.md`](PLAN_MEJORAS.md) reencuadradas para el export.
>
> _(Contexto original abajo — la escuela tiene SQL Server 2022 con el modelo
> LakeGoetheSee, DER en Lucid, 80 tablas.)_

## 1. Lo que el DER ya resuelve (mapeo directo)

| Concepto en la app | Tabla(s) LakeGoetheSee | Notas |
|---|---|---|
| Curso ("EP2A") | `Grupos` | `NivelAbrev` + `NivelNro` + `Letra` ↔ "EP"+"2"+"A". Confirmar convención de armado. |
| Alumno | `Personas` + `Personas_Grupo` (rol alumno) | La app hoy identifica por DNI texto; `Personas.DNI` es `int`. |
| Docente (login Google) | `Personas` + `Email` | El email institucional resuelve `ID_Persona` vía tabla `Email`. |
| Materia | `Asignatura` (por `ID_Grupo` y `Año`) | Existe `ID_Madre`/`EsMadre`: la "asignatura madre" encaja con la materia transversal de la app (un mapa aplica a varios cursos). |
| Matriculación alumno×materia | `Personas_Asignatura` | **Requisito**: debe estar poblada para todo curso/materia donde se cargue. `Calificaciones` cuelga de acá (`ID_PersAsig`). |
| Jerarquía Eje > Competencia | `Mapa_Aprendizaje` → `Mapa_Aprendizaje_Eje` → `Mapa_Aprendizaje_Competencia` | Ya existe tal cual. `Asignatura_Competencia` vincula competencias a materias. |
| Escala conceptual | `Escalas` + `EscalasDetalle` (`ValorLiteral`, `ValorNumerico`) + `TipoCalificacion` | Mejor que el texto `Logrado\|En proceso\|...` de Sheets: la escala es entidad, con umbral de aprobación y equivalencia numérica. Las "escalas por materia" de la app = filas de `Escalas` reutilizables. |
| Nota | `Calificaciones` | `CalificacionNum` (numérica), `CalificacionLit` (conceptual/texto), `ID_TipoCalificacion`→escala, `ID_Modificador` (docente), `Periodo`, `NombreParcial`, `FechaModificacion`. Ya referencia `ID_Competencia`. |
| Rol admin de consignas | `Personas_Roles` / `Personas_Permisos` | Reemplaza la solapa Admins. |

## 2. Lo que falta (gaps) y propuesta mínima

La app genera cuatro cosas sin lugar natural hoy:

**a) Consigna** (ítem evaluable de EP: contenido + puntaje máx + incremento +
orden, debajo de una Competencia). En el DER la hoja calificable es la
Competencia — que coincide con KG (Eje > Competencia > calificación), pero EP
califica consignas.

**b) Evaluación** como entidad (nombre, período, vigencia, cursos alcanzados,
**cierre de carga por curso**). Hoy `Calificaciones.Periodo` + `NombreParcial`
lo aproximan, pero sin fechas, estado ni cierre.

**c) Estado del alumno en la evaluación** (Presente / Ausente / Inclusión) y
**observación por alumno×evaluación** (texto largo de KG).

**d) Estado de carga** borrador/cerrado — en la app el cierre es por
curso×evaluación.

### DDL propuesto (estilo del DER)

```sql
CREATE TABLE [Evaluacion] (
  [ID_Evaluacion]     uniqueidentifier PRIMARY KEY,
  [ID_Mapa]           uniqueidentifier REFERENCES Mapa_Aprendizaje(ID_Mapa),
  [ID_AsignaturaMadre] uniqueidentifier REFERENCES Asignatura(ID_Asignatura),
  [Nombre]            varchar(200),
  [Año]               int,
  [Periodo]           int,            -- convención de Calificaciones.Periodo
  [FechaCaducidad]    date,
  [ID_Creador]        uniqueidentifier REFERENCES Personas(ID_Persona),
  [FechaCreacion]     datetime,
  [FechaModificacion] datetime
);

CREATE TABLE [Evaluacion_Grupo] (      -- alcance y cierre por curso
  [ID_Evaluacion]  uniqueidentifier REFERENCES Evaluacion(ID_Evaluacion),
  [ID_Grupo]       uniqueidentifier REFERENCES Grupos(ID_Grupo),
  [Estado]         varchar(10) DEFAULT 'abierta',   -- abierta | cerrada
  [FechaCierre]    datetime,
  [ID_CerradoPor]  uniqueidentifier REFERENCES Personas(ID_Persona),
  PRIMARY KEY (ID_Evaluacion, ID_Grupo)
);

CREATE TABLE [Mapa_Aprendizaje_Consigna] (
  [ID_Consigna]        uniqueidentifier PRIMARY KEY,
  [ID_Competencia]     uniqueidentifier REFERENCES Mapa_Aprendizaje_Competencia(ID_Competencia),
  [ID_Evaluacion]      uniqueidentifier REFERENCES Evaluacion(ID_Evaluacion),
  [Codigo]             varchar(10),    -- C01, C02 (compatibilidad histórico)
  [NroOrden]           int,
  [Contenido]          varchar(500),
  [ID_TipoCalificacion] uniqueidentifier REFERENCES TipoCalificacion(ID_TipoCalificacion),
  [PuntajeMax]         decimal(15,2),  -- NULL si la escala no es numérica
  [Incremento]         decimal(15,2),
  [Habilitado]         bit DEFAULT 1,
  [FechaCreacion]      datetime,
  [FechaModificacion]  datetime
);

CREATE TABLE [Evaluacion_Alumno] (     -- estado + observación por alumno
  [ID_EvaluacionAlumno] uniqueidentifier PRIMARY KEY,
  [ID_Evaluacion]  uniqueidentifier REFERENCES Evaluacion(ID_Evaluacion),
  [ID_PersAsig]    uniqueidentifier REFERENCES Personas_Asignatura(ID_PersonaAsignatura),
  [EstadoAlumno]   varchar(20) DEFAULT 'Presente',  -- Presente|Ausente|Inclusion
  [Observacion]    varchar(max),       -- pedido KG: sin límite
  [FechaModificacion] datetime,
  CONSTRAINT UQ_EvalAlumno UNIQUE (ID_Evaluacion, ID_PersAsig)
);

-- Calificaciones: dos columnas nuevas, nullable (no rompe lo existente)
ALTER TABLE [Calificaciones] ADD
  [ID_Consigna]      uniqueidentifier NULL REFERENCES Mapa_Aprendizaje_Consigna(ID_Consigna),
  [ID_EscalaDetalle] uniqueidentifier NULL REFERENCES EscalasDetalle(ID_EscalaDetalle);
```

**Cómo queda una nota**: fila en `Calificaciones` con `ID_PersAsig` (alumno ×
materia), `ID_Consigna` (nueva FK; en KG puede ir directo `ID_Competencia` y
consigna NULL), `CalificacionNum` para numéricas o `ID_EscalaDetalle` para
conceptuales (con `CalificacionLit` como redundancia legible si lo prefieren),
`ID_Modificador` = docente, `Periodo`/`NombreParcial` desde la Evaluación
(mantiene compatibilidad con los reportes actuales de Calificaciones).
El upsert natural es `UNIQUE (ID_PersAsig, ID_Consigna)`.

### Alternativa evaluada y descartada

El motor `Formulario`/`Observacion`/`Items_Observacion`/`Submit`/`Valores` (+
`Autorizadores` para el cierre) podría alojar la app casi sin DDL. Se descarta
porque son formularios genéricos: las notas quedarían fuera de
`Calificaciones` y de todo lo que ya calcula promedios/reportes sobre ella
(`IncidePromInterno`, ponderadores, Colegium). Los datos académicos deben
vivir en las tablas académicas.

## 3. Arquitectura de integración

SQL Server no se expone al navegador: hace falta **API**. El DER muestra que
ya existe un backend (RefreshToken, Tokens_Fidu, motor de formularios), así
que lo razonable es **agregarle endpoints** en vez de crear otro servicio:

```
GET  /api/mapa/bootstrap?grupo=&asignatura=      → alumnos, consignas, cargas, permisos
POST /api/mapa/cargas                            → upsert Calificaciones + Evaluacion_Alumno
POST /api/mapa/evaluaciones                      → upsert Evaluacion/_Grupo/Consignas (admins)
POST /api/mapa/cerrar?evaluacion=&grupo=         → Evaluacion_Grupo.Estado = cerrada
```

- **Auth**: mismo esquema actual — la app manda el `idToken` de Google; la API
  valida firma/`aud`/dominio (igual que hoy el GAS) y resuelve `ID_Persona`
  por `Email`. Si el backend ya tiene sesión propia (RefreshToken), puede
  canjearse el idToken por su token interno.
- **CORS**: habilitar el origen `https://servicios-goethe.github.io`.
- **Frontend**: los puntos de contacto ya están encapsulados
  (`fetchBootstrapBundle`, `saveCargas`, `upsertMapas`) → se agrega
  `APP_CONFIG.dataBackend = "sheets" | "api"` y `/dev/` prueba contra la API
  mientras producción sigue en Sheets. Bonus: bootstrap **selectivo** por
  curso/materia (se acaba la descarga total).

## 4. Migración de lo ya cargado en Sheets

1. Resolver identidades: DNI (Sheets, texto) → `Personas`; curso → `Grupos`;
   materia → `Asignatura` madre. Reporte de no-matcheados **antes** de mover nada.
2. Crear `Escalas`/`EscalasDetalle` desde las escalas usadas (`Logrado|...`).
3. Mapas → `Mapa_Aprendizaje(_Eje)(_Competencia)` + `Evaluacion(_Grupo)` +
   `Mapa_Aprendizaje_Consigna` (el `Codigo` C01... preserva el vínculo).
4. Cargas → `Calificaciones` (+ `Evaluacion_Alumno` para estado/observación).
   Requiere `Personas_Asignatura` poblada; generar las faltantes o reportarlas.
5. Verificación: conteos por curso×evaluación comparados contra Sheets.

## 5. Preguntas abiertas (definen el diseño fino)

1. **¿Backend existente?** ¿La API de LakeGoetheSee (la de RefreshToken/Fidu)
   está activa y en qué tecnología? ¿Le podemos agregar los 4 endpoints, o
   preferís un servicio aparte contra la misma base?
2. **Asignatura madre**: ¿confirmás que `EsMadre`/`ID_Madre` representa la
   materia transversal (p. ej. "Matemática EP") y que la Evaluación debe
   colgar de ahí?
3. **Periodo**: `Calificaciones.Periodo` es `int` — ¿la convención es 1/2/3
   (trimestres)? La app hoy usa texto ("1er Trimestre").
4. **KG**: ¿los mapas de KG califican directo a nivel `Competencia` (sin
   consignas), como sugiere el DER? La FK nullable lo permite.
5. **Matriculaciones**: ¿`Personas_Asignatura` está poblada para todos los
   niveles/materias donde se va a cargar, o hay que generarla?
6. **Conectividad**: ¿el SQL/API es accesible desde internet (la app corre en
   GitHub Pages) o está solo en la red interna? Si es interno, hay que decidir
   dónde se hostea el frontend (o exponer la API con proxy).
