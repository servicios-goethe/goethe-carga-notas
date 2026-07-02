const demoAlumnos = [
  { Nombres: "Franco", Apellido: "ARCHERI", DNI: "A001", Nivel: "EP", Curso: "EP2A", eMail: "" },
  { Nombres: "Rafael", Apellido: "BARALDO", DNI: "A002", Nivel: "EP", Curso: "EP2A", eMail: "" },
  { Nombres: "Francisca", Apellido: "BATTISTON", DNI: "A003", Nivel: "EP", Curso: "EP2A", eMail: "" },
  { Nombres: "Lena", Apellido: "BOERR", DNI: "A004", Nivel: "EP", Curso: "EP2A", eMail: "" },
  { Nombres: "Ana Katarina", Apellido: "BULE", DNI: "A005", Nivel: "EP", Curso: "EP2A", eMail: "" },
  { Nombres: "Felipe Andres", Apellido: "AGRES", DNI: "B001", Nivel: "EP", Curso: "EP2B", eMail: "" },
  { Nombres: "Manuel", Apellido: "AGUIRRE", DNI: "B002", Nivel: "EP", Curso: "EP2B", eMail: "" },
  { Nombres: "Valentin", Apellido: "BUCK", DNI: "B003", Nivel: "EP", Curso: "EP2B", eMail: "" }
];

const demoMapas = [
  ["MAP-EP2-MAT-DIAG", "MAT", "Matematica", "EVA-001", "Diagnostico de numeracion", "EP2A", "2026", "C01", "Representacion de numeros", "1", "0.5", "1", "TRUE"],
  ["MAP-EP2-MAT-DIAG", "MAT", "Matematica", "EVA-001", "Diagnostico de numeracion", "EP2A", "2026", "C02", "Orden de la serie numerica", "2", "0.5", "2", "TRUE"],
  ["MAP-EP2-MAT-DIAG", "MAT", "Matematica", "EVA-001", "Diagnostico de numeracion", "EP2A", "2026", "C03", "Recta numerica", "3", "0.5", "3", "TRUE"],
  ["MAP-EP2-MAT-DIAG", "MAT", "Matematica", "EVA-001", "Diagnostico de numeracion", "EP2A", "2026", "C04", "Anterior y posterior", "2", "0.5", "4", "TRUE"],
  ["MAP-EP2-MAT-DIAG", "MAT", "Matematica", "EVA-001", "Diagnostico de numeracion", "EP2A", "2026", "C05", "Sumas", "1.5", "0.5", "5", "TRUE"],
  ["MAP-EP2-MAT-DIAG", "MAT", "Matematica", "EVA-001", "Diagnostico de numeracion", "EP2A", "2026", "C06", "Restas", "1.5", "0.5", "6", "TRUE"],
  ["MAP-EP2-MAT-DIAG", "MAT", "Matematica", "EVA-001", "Diagnostico de numeracion", "EP2A", "2026", "C07", "Doble y mitad", "2", "0.5", "7", "TRUE"],
  ["MAP-EP2-MAT-DIAG", "MAT", "Matematica", "EVA-001", "Diagnostico de numeracion", "EP2A", "2026", "C08", "Uso del dinero", "2", "0.5", "8", "TRUE"],
  ["MAP-EP2-MAT-DIAG", "MAT", "Matematica", "EVA-001", "Diagnostico de numeracion", "EP2B", "2026", "C01", "Representacion de numeros", "1", "0.5", "1", "TRUE"],
  ["MAP-EP2-MAT-DIAG", "MAT", "Matematica", "EVA-001", "Diagnostico de numeracion", "EP2B", "2026", "C02", "Orden de la serie numerica", "2", "0.5", "2", "TRUE"]
].map(([MapaID, MateriaID, MateriaNombre, EvaluacionID, EvaluacionNombre, Curso, AnioLectivo, ConsignaID, ConsignaContenido, ConsignaPuntajeMax, ConsignaIncremento, ConsignaOrden, ConsignaActiva]) => ({
  MapaID, MateriaID, MateriaNombre, EvaluacionID, EvaluacionNombre, Nivel: "EP", Curso, AnioLectivo, ConsignaID, ConsignaContenido, ConsignaPuntajeMax, ConsignaIncremento, ConsignaOrden, ConsignaActiva, FechaCaducidad: "",
  // Jerarquia demo: consignas 1-4 eje Numeracion, 5-8 eje Operaciones.
  Competencia: "Resolucion de problemas",
  Eje: Number(ConsignaOrden) <= 4 ? "Numeracion" : "Operaciones",
  PeriodoEvaluacion: "1er Trimestre"
}));

let alumnos = [];
let mapas = [];
let consignas = [];
let state = {};
let admins = [];
let cargas = [];
let isAdmin = false;
let closedNoticeKey = "";
const APP_CONFIG = {
  scriptUrl: "https://script.google.com/macros/s/AKfycbxrwC0TARz15BwQqwGVzJEqs_ZnLlBy4Q681fim94px4NlrgTVNgHMzkJw9bS3DUkUi/exec",
  googleClientId: "225474160522-7rk742a5qubfaf0te9uqiokfr4umj7al.apps.googleusercontent.com"
};
const APP_VERSION = "2026-07-02.4";
const ALLOWED_DOMAIN = "goethe.edu.ar";
const storagePrefix = "goethe-mapa-aprendizajes";
const scriptUrlStorageKey = `${storagePrefix}||apps-script-url`;
const googleClientIdStorageKey = `${storagePrefix}||google-client-id`;
const debugStorageKey = `${storagePrefix}||debug`;

// --- Fase 0: diagnostico ---
// Logger apagado por defecto. Prender con goethe.enableDebug() en la consola
// (o localStorage["goethe-mapa-aprendizajes||debug"] = "1") y recargar.
let debugEnabled = false;
try { debugEnabled = localStorage.getItem(debugStorageKey) === "1"; } catch {}

function debugLog(...args) {
  if (debugEnabled) console.log("[goethe]", ...args);
}

function maskToken(token) {
  const value = String(token || "");
  return value ? `${value.slice(0, 12)}…(${value.length} chars)` : "(vacio)";
}

const table = document.getElementById("gradeTable");
const courseFilter = document.getElementById("courseFilter");
const subjectFilter = document.getElementById("subjectFilter");
const evaluationFilter = document.getElementById("evaluationFilter");
const periodFilter = document.getElementById("periodFilter");
const periodLabel = document.getElementById("periodLabel");
const searchInput = document.getElementById("searchInput");
const showIncomplete = document.getElementById("showIncomplete");
const criteriaModal = document.getElementById("criteriaModal");
const criteriaList = document.getElementById("criteriaList");
const connectionModal = document.getElementById("connectionModal");
const scriptUrlInput = document.getElementById("scriptUrlInput");
const googleClientIdInput = document.getElementById("googleClientIdInput");
const tableWrap = document.querySelector(".table-wrap");
const saveStatus = document.getElementById("saveStatus");
const loginGate = document.getElementById("loginGate");
const loginHelp = document.getElementById("loginHelp");
const gateLoginBtn = document.getElementById("gateLoginBtn");
const openStandaloneBtn = document.getElementById("openStandaloneBtn");
const googleButtonWrap = document.getElementById("googleButtonWrap");
const saveModal = document.getElementById("saveModal");
const saveModalTitle = document.getElementById("saveModalTitle");
const saveModalMessage = document.getElementById("saveModalMessage");
const saveModalIndicator = document.getElementById("saveModalIndicator");
const closeSaveModalBtn = document.getElementById("closeSaveModalBtn");

scriptUrlInput.value = APP_CONFIG.scriptUrl || localStorage.getItem(scriptUrlStorageKey) || "";
googleClientIdInput.value = APP_CONFIG.googleClientId || localStorage.getItem(googleClientIdStorageKey) || "";

let googleIdToken = "";
let docenteEmail = "";
let googleInitializedClientId = "";
let googleLoginInProgress = false;
let googleLoginFallbackTimer = 0;
let googleButtonRenderedClientId = "";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeHeader(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function normalizeDniKey(value) {
  return normalizeHeader(value).replace(/[^a-z0-9]/g, "");
}

function consignaOrderKey(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? String(Number(digits)) : "";
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some(cell => normalizeText(cell))) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some(cell => normalizeText(cell))) rows.push(row);

  const headers = rows.shift()?.map(normalizeHeader) ?? [];
  return rows.map(values => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = normalizeText(values[index]);
    });
    return item;
  });
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const naturalSorter = new Intl.Collator("es", { numeric: true, sensitivity: "base" });
const levelOrder = ["KG", "EP", "ES"];

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function selectedContext() {
  return {
    curso: courseFilter.value,
    materia: subjectFilter.value,
    evaluacion: evaluationFilter.value
  };
}

function rowAppliesToCourse(row, curso) {
  if (row.Curso === curso) return true;
  if (!row.Curso || row.Curso === "*") return !row.Nivel || row.Nivel === nivelFromCurso(curso);
  return false;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function rowIsActiveByDate(row) {
  return !row.FechaCaducidad || row.FechaCaducidad >= todayISO();
}

function currentEvaluationId() {
  const { curso, materia, evaluacion } = selectedContext();
  return mapas.find(row =>
    rowAppliesToCourse(row, curso) &&
    rowIsActiveByDate(row) &&
    row.MateriaNombre === materia &&
    row.EvaluacionNombre === evaluacion
  )?.EvaluacionID || evaluacion;
}

const ALL_PERIODS = "__todos__";

function selectedPeriod() {
  const value = periodFilter?.value || "";
  return value === ALL_PERIODS ? "" : value;
}

// Una fila sin periodo aplica a todos los periodos (compatibilidad con mapas
// anteriores a la jerarquia Competencia/Eje/Periodo).
function periodMatches(row) {
  const periodo = selectedPeriod();
  return !periodo || !row.PeriodoEvaluacion || row.PeriodoEvaluacion === periodo;
}

function populatePeriodFilter(periodos, selectedValue) {
  if (!periodLabel || !periodFilter) return;
  if (!periodos.length) {
    periodFilter.innerHTML = "";
    periodLabel.hidden = true;
    return;
  }
  periodLabel.hidden = false;
  const options = [[ALL_PERIODS, "Todos"], ...periodos.map(p => [p, p])];
  periodFilter.innerHTML = options
    .map(([value, text]) => `<option value="${escapeHTML(value)}">${escapeHTML(text)}</option>`)
    .join("");
  if (selectedValue && periodos.includes(selectedValue)) periodFilter.value = selectedValue;
}

function stateKey() {
  const { curso, materia, evaluacion } = selectedContext();
  return `${curso}||${materia}||${evaluacion}`;
}

function storageKey() {
  return `${storagePrefix}||${stateKey()}`;
}

function currentClosedRows() {
  const { curso } = selectedContext();
  const evaluacionId = currentEvaluationId();
  return cargas.filter(row =>
    row.Curso === curso &&
    row.EvaluacionID === evaluacionId &&
    String(row.EstadoCarga || "").toLowerCase() === "cerrado"
  );
}

function currentLoadIsClosed() {
  return currentClosedRows().length > 0;
}

function notifyClosedLoadIfNeeded() {
  const key = stateKey();
  if (!currentLoadIsClosed() || closedNoticeKey === key) return;
  closedNoticeKey = key;
  showSaveModal("Carga finalizada", "Este curso ya tiene una carga finalizada para esta evaluacion. La grilla queda solo para consulta.", "Consulta", true);
}

function activeConsignas() {
  return consignas.filter(c => c.active);
}

function totalMaximo() {
  return activeConsignas().reduce((sum, item) => sum + item.max, 0);
}

function isAbsent(alumno) {
  return alumno.estadoAlumno === "Ausente";
}

function isInclusion(alumno) {
  return alumno.estadoAlumno === "Inclusion";
}

function normalizeEstadoAlumno(value) {
  const normalized = normalizeHeader(value);
  if (normalized === "ausente") return "Ausente";
  if (normalized === "inclusion") return "Inclusion";
  return "Presente";
}

function parseScoreValue(value) {
  if (value === "") return null;
  const text = String(value ?? "").trim().replace(",", ".");
  if (!text || /[.,]$/.test(String(value).trim())) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function mapRowToConsigna(row, index) {
  return {
    id: Number(row.consignaorden) || index + 1,
    scoreKey: normalizeText(row.consignaid) || `C${index + 1}`,
    consignaId: normalizeText(row.consignaid) || `C${index + 1}`,
    titulo: normalizeText(row.consignacontenido) || `Consigna ${index + 1}`,
    max: Number(String(row.consignapuntajemax).replace(",", ".")) || 1,
    step: Number(String(row.consignaincremento).replace(",", ".")) || 0.5,
    active: !["false", "0", "no", "n"].includes(normalizeText(row.consignaactiva).toLowerCase()),
    competencia: normalizeText(row.competencia),
    eje: normalizeText(row.eje),
    tipo: normalizeHeader(row.tipocalificacion) === "conceptual" ? "conceptual" : "numerica",
    escala: normalizeText(row.escalaconceptual)
  };
}

// Calificacion conceptual (KG y otros niveles): la consigna se evalua con una
// escala de valores definida por materia (ej. Logrado|En proceso|Iniciado) en
// vez de puntaje numerico. No participa de totales ni porcentajes.
function isConceptual(consigna) {
  return consigna.tipo === "conceptual";
}

function escalaValues(consigna) {
  return String(consigna.escala || "")
    .split("|")
    .map(normalizeText)
    .filter(Boolean);
}

// Normaliza la escala tipeada por el admin: acepta | , o ; como separador.
function normalizeEscalaInput(value) {
  return String(value || "")
    .split(/[|,;]/)
    .map(normalizeText)
    .filter(Boolean)
    .join("|");
}

// La escala es editable POR MATERIA: toma la ya definida en cualquier mapa de
// esa materia como valor por defecto.
function escalaDeMateria(materiaNombre) {
  return mapas.find(row =>
    normalizeHeader(row.MateriaNombre) === normalizeHeader(materiaNombre) &&
    normalizeText(row.EscalaConceptual)
  )?.EscalaConceptual || "";
}

function syncConsignasFromSelection() {
  const { curso, materia, evaluacion } = selectedContext();
  const rows = mapas
    .filter(row => rowAppliesToCourse(row, curso) && rowIsActiveByDate(row) && row.MateriaNombre === materia && row.EvaluacionNombre === evaluacion && periodMatches(row))
    .sort((a, b) => Number(a.ConsignaOrden) - Number(b.ConsignaOrden));

  consignas = rows.map((row, index) => mapRowToConsigna({
    consignaorden: row.ConsignaOrden,
    consignaid: row.ConsignaID,
    consignacontenido: row.ConsignaContenido,
    consignapuntajemax: row.ConsignaPuntajeMax,
    consignaincremento: row.ConsignaIncremento,
    consignaactiva: row.ConsignaActiva,
    competencia: row.Competencia,
    eje: row.Eje,
    tipocalificacion: row.TipoCalificacion,
    escalaconceptual: row.EscalaConceptual
  }, index));
}

function validCriteriaConfig(list = consignas) {
  return list.every(c =>
    Number.isFinite(c.id) &&
    Number.isFinite(c.max) &&
    Number.isFinite(c.step) &&
    c.id >= 1 &&
    c.max > 0 &&
    c.step > 0 &&
    c.titulo.trim()
  );
}

// --- Editor de consignas ---
// El modal trabaja sobre un BORRADOR (draftConsignas): "Aplicar cambios"
// confirma, cerrar descarta. Antes editaba el array global en vivo y cerrar
// sin aplicar dejaba la grilla modificada.
// Modo "edit": edita la evaluacion seleccionada en los filtros.
// Modo "new": crea una evaluacion nueva (y materia nueva si hace falta)
// enteramente desde el front; se persiste con el mismo upsertMapas.
let draftConsignas = [];
let criteriaMode = "edit";
// Seleccion PROPIA del modal (independiente de los filtros de carga): el
// admin administra cualquier materia/evaluacion sin mover la grilla.
let editingMateria = "";
let editingEvaluacion = "";
// Precarga del formulario "nueva evaluacion" (usada por Duplicar).
let newEvaluationPrefillMateria = "";
let newEvaluationPrefillNombre = "";

// Consignas de una evaluacion, para cualquier materia/evaluacion (sin
// depender del curso seleccionado): unifica por ConsignaID entre cursos.
function consignasForEvaluation(materiaNombre, evaluacionNombre) {
  const rows = mapas.filter(row =>
    row.MateriaNombre === materiaNombre &&
    row.EvaluacionNombre === evaluacionNombre
  );
  const byId = new Map();
  rows.forEach(row => {
    const key = normalizeText(row.ConsignaID);
    if (!byId.has(key)) byId.set(key, row);
  });
  return [...byId.values()]
    .sort((a, b) => Number(a.ConsignaOrden) - Number(b.ConsignaOrden))
    .map((row, index) => mapRowToConsigna({
      consignaorden: row.ConsignaOrden,
      consignaid: row.ConsignaID,
      consignacontenido: row.ConsignaContenido,
      consignapuntajemax: row.ConsignaPuntajeMax,
      consignaincremento: row.ConsignaIncremento,
      consignaactiva: row.ConsignaActiva,
      competencia: row.Competencia,
      eje: row.Eje,
      tipocalificacion: row.TipoCalificacion,
      escalaconceptual: row.EscalaConceptual
    }, index));
}

function materiasDisponibles() {
  return unique(mapas.map(row => row.MateriaNombre)).sort(naturalSorter.compare);
}

function evaluacionesDeMateria(materiaNombre) {
  return unique(mapas
    .filter(row => row.MateriaNombre === materiaNombre)
    .map(row => row.EvaluacionNombre));
}

function blankConsigna(orden) {
  return {
    id: orden,
    scoreKey: `NEW-${Date.now()}-${orden}`,
    consignaId: "",
    titulo: "",
    max: 1,
    step: 0.5,
    active: true,
    competencia: "",
    eje: "",
    tipo: "numerica",
    escala: ""
  };
}

// Asigna ConsignaID C01, C02... a las consignas nuevas del borrador,
// respetando los IDs ya usados (los existentes no cambian: las cargas
// guardadas los referencian).
function assignConsignaIds(list) {
  const used = new Set(list.map(c => c.consignaId).filter(Boolean));
  let next = 1;
  list.forEach(consigna => {
    if (consigna.consignaId) return;
    while (used.has(`C${String(next).padStart(2, "0")}`)) next += 1;
    consigna.consignaId = `C${String(next).padStart(2, "0")}`;
    used.add(consigna.consignaId);
  });
}

function alumnoNombre(alumno) {
  return `${alumno.Apellido}, ${alumno.Nombres}`.replace(/^,\s*/, "").trim();
}

function alumnosDelCurso() {
  // Orden alfabetico (Apellido, Nombres) con collator español: independiente
  // del orden en que esten cargados en la solapa Alumnos.
  return alumnos
    .filter(alumno => alumno.Curso === courseFilter.value)
    .sort((a, b) => naturalSorter.compare(alumnoNombre(a), alumnoNombre(b)));
}

function sortCourses(courses) {
  return courses.sort((a, b) => {
    const levelDiff = levelSortValue(nivelFromCurso(a)) - levelSortValue(nivelFromCurso(b));
    return levelDiff || naturalSorter.compare(a, b);
  });
}

function todosLosCursos() {
  return sortCourses(unique(alumnos.map(alumno => alumno.Curso)));
}

function cursoTieneMapaVigente(curso) {
  return mapas.some(row => rowAppliesToCourse(row, curso) && rowIsActiveByDate(row));
}

function cursosDisponibles() {
  return sortCourses(todosLosCursos().filter(cursoTieneMapaVigente));
}

function nivelFromCurso(curso) {
  return alumnos.find(alumno => alumno.Curso === curso)?.Nivel || "";
}

function levelSortValue(level) {
  const index = levelOrder.indexOf(level);
  return index === -1 ? 99 : index;
}

function agruparCursosPorNivel(cursos) {
  const groups = cursos.reduce((result, curso) => {
    const nivel = nivelFromCurso(curso) || "Sin nivel";
    result[nivel] = result[nivel] || [];
    result[nivel].push(curso);
    return result;
  }, {});
  return Object.fromEntries(
    Object.entries(groups).sort(([a], [b]) => levelSortValue(a) - levelSortValue(b) || naturalSorter.compare(a, b))
  );
}

function cursosPorNivel() {
  return agruparCursosPorNivel(todosLosCursos());
}

function ensureGridState() {
  const key = stateKey();
  if (state[key]) return;

  state[key] = alumnosDelCurso().map((alumno, index) => {
    const scores = {};
  consignas.forEach((consigna) => {
      scores[consigna.scoreKey] = "";
    });
    return {
      id: alumno.DNI,
      dni: alumno.DNI,
      nombre: alumnoNombre(alumno),
      email: alumno.eMail,
      scores,
      estadoAlumno: "Presente",
      pudoResolver: "Si",
      observacion: ""
    };
  });
  applyRemoteCargasForSelection();
  restoreLocalDraft(false);
}

function populateSelect(select, values, selectedValue) {
  select.innerHTML = values.map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join("");
  if (selectedValue && values.includes(selectedValue)) select.value = selectedValue;
}

function populateCourseSelect(selectedValue) {
  const grouped = agruparCursosPorNivel(cursosDisponibles());
  if (!Object.keys(grouped).length) {
    courseFilter.innerHTML = "";
    return;
  }
  courseFilter.innerHTML = Object.entries(grouped).map(([level, courses]) => `
    <optgroup label="${escapeHTML(level)}">
      ${courses.map(course => `<option value="${escapeHTML(course)}">${escapeHTML(course)}</option>`).join("")}
    </optgroup>
  `).join("");
  const allCourses = Object.values(grouped).flat();
  if (selectedValue && allCourses.includes(selectedValue)) courseFilter.value = selectedValue;
}

function refreshFilters({ keepSelection = true } = {}) {
  const previous = selectedContext();
  populateCourseSelect(keepSelection ? previous.curso : "");
  if (!courseFilter.value) {
    populateSelect(subjectFilter, [], "");
    populateSelect(evaluationFilter, [], "");
    consignas = [];
    updateSummary();
    return;
  }

  const materias = unique(mapas
    .filter(row => rowAppliesToCourse(row, courseFilter.value) && rowIsActiveByDate(row))
    .map(row => row.MateriaNombre));
  populateSelect(subjectFilter, materias, keepSelection ? previous.materia : "");

  const periodos = unique(mapas
    .filter(row => rowAppliesToCourse(row, courseFilter.value) && rowIsActiveByDate(row) && row.MateriaNombre === subjectFilter.value)
    .map(row => row.PeriodoEvaluacion));
  populatePeriodFilter(periodos, keepSelection ? selectedPeriod() : "");

  const evaluaciones = unique(mapas
    .filter(row => rowAppliesToCourse(row, courseFilter.value) && rowIsActiveByDate(row) && row.MateriaNombre === subjectFilter.value && periodMatches(row))
    .map(row => row.EvaluacionNombre));
  populateSelect(evaluationFilter, evaluaciones, keepSelection ? previous.evaluacion : "");

  syncConsignasFromSelection();
}

// Celdas de agrupacion: fusiona valores adyacentes iguales con colspan
// (Competencia y Eje son niveles superiores de la consigna).
function groupedHeaderCells(values, className) {
  const cells = [];
  let index = 0;
  while (index < values.length) {
    let span = 1;
    while (index + span < values.length && values[index + span] === values[index]) span += 1;
    cells.push(`<th class="${className}" colspan="${span}" title="${escapeHTML(values[index])}">${escapeHTML(values[index])}</th>`);
    index += span;
  }
  return cells.join("");
}

function groupRowHTML(label, values, className) {
  return `
    <tr class="group-row">
      <th class="sticky-col header-empty"></th>
      <th class="student-col group-label">${escapeHTML(label)}</th>
      <th class="header-empty"></th>
      ${groupedHeaderCells(values, className)}
      <th class="header-empty"></th>
      <th class="header-empty"></th>
      <th class="header-empty"></th>
    </tr>
  `;
}

function renderHeader() {
  const thead = table.querySelector("thead");
  const visible = activeConsignas();
  const maxRow = visible.map(c => `<th class="criteria-max">${isConceptual(c) ? "—" : escapeHTML(c.max)}</th>`).join("");
  const emptySummaryRow = Array.from({ length: 3 }, () => `<th class="header-empty"></th>`).join("");
  const titleRow = visible.map(c => `
    <th class="criteria-title" title="${escapeHTML(c.titulo)}">
      <span class="criteria-name">${escapeHTML(c.titulo)}</span>
    </th>
  `).join("");
  const competencias = visible.map(c => c.competencia || "");
  const ejes = visible.map(c => c.eje || "");
  const competenciaRow = competencias.some(Boolean) ? groupRowHTML("Competencia", competencias, "criteria-group competencia-cell") : "";
  const ejeRow = ejes.some(Boolean) ? groupRowHTML("Eje", ejes, "criteria-group eje-cell") : "";
  thead.innerHTML = `
    ${competenciaRow}
    ${ejeRow}
    <tr>
      <th class="sticky-col">Nr.</th>
      <th class="student-col student-head">Nombre</th>
      <th>Alumno</th>
      ${titleRow}
      <th>Puntaje</th>
      <th>Calificacion</th>
      <th>Observaciones</th>
    </tr>
    <tr class="max-row">
      <th class="sticky-col header-empty"></th>
      <th class="student-col max-label">Valor maximo</th>
      <th class="header-empty"></th>
      ${maxRow}
      ${emptySummaryRow}
    </tr>
  `;
}

function scoreIsValid(value, consigna, alumno = null) {
  if (value === "") return true;
  if (isConceptual(consigna)) return escalaValues(consigna).includes(normalizeText(value));
  const number = parseScoreValue(value);
  if (number === null) return false;
  if (number === 9) return Boolean(alumno && isInclusion(alumno));
  if (!Number.isFinite(number) || number < 0 || number > consigna.max) return false;
  return Math.abs(number / consigna.step - Math.round(number / consigna.step)) < 0.001;
}

function scoreCellState(alumno, consigna) {
  const value = alumno.scores[consigna.scoreKey] ?? "";
  const number = parseScoreValue(value);
  const invalid = !scoreIsValid(value, consigna, alumno);
  if (isAbsent(alumno)) return "not-required";
  if (value === "") return "pending";
  if (invalid) return "invalid";
  if (number === 9) return "exempt";
  return "valid";
}

function studentTotals(alumno) {
  if (isAbsent(alumno)) {
    return { puntaje: 0, porcentaje: 0, completo: true, alertas: 0, maximo: 0 };
  }

  let alertas = 0;
  let maximo = 0;
  // Solo las consignas numericas suman al puntaje/porcentaje; las
  // conceptuales cuentan para completitud y alertas pero no para totales.
  const scores = activeConsignas().map((consigna) => {
    const value = alumno.scores[consigna.scoreKey] ?? "";
    const valid = scoreIsValid(value, consigna, alumno);
    if (!valid) alertas += 1;
    if (isConceptual(consigna)) return 0;
    const number = parseScoreValue(value);
    if (number !== 9) maximo += consigna.max;
    return valid && number !== null ? number : 0;
  });
  const completo = activeConsignas().every((consigna) => {
    const value = alumno.scores[consigna.scoreKey] ?? "";
    return value !== "" && scoreIsValid(value, consigna, alumno);
  });
  const puntaje = scores.reduce((sum, value) => sum + (value === 9 ? 0 : value), 0);
  const porcentaje = maximo ? Math.round((puntaje / maximo) * 1000) / 10 : 0;
  return { puntaje, porcentaje, completo, alertas, maximo };
}

function renderBody() {
  if (!courseFilter.value) {
    table.querySelector("tbody").innerHTML = "";
    updateSummary();
    return;
  }
  ensureGridState();
  const key = stateKey();
  const query = searchInput.value.trim().toLowerCase();
  const tbody = table.querySelector("tbody");
  const onlyIncomplete = showIncomplete.checked;
  // Bloqueada si la carga esta cerrada O si los registros del curso todavia
  // no llegaron del backend (evita tipear sobre datos incompletos).
  const pending = cargasPendingForCourse();
  const closed = currentLoadIsClosed() || pending;
  tableWrap?.classList.toggle("loading-cargas", pending);
  tbody.innerHTML = "";

  state[key].forEach((alumno, index) => {
    const totals = studentTotals(alumno);
    if (query && !alumno.nombre.toLowerCase().includes(query)) return;
    if (onlyIncomplete && totals.completo) return;

    const tr = document.createElement("tr");
    tr.className = `${totals.completo ? "complete" : "incomplete"} ${totals.alertas ? "has-alert" : ""}`;
    tr.innerHTML = `
      <td class="sticky-col row-number">${index + 1}</td>
      <td class="student-col student-name">${alumno.nombre}</td>
      <td>
        <select data-id="${alumno.id}" data-field="estadoAlumno"${closed ? " disabled" : ""}>
          <option${alumno.estadoAlumno === "Presente" ? " selected" : ""}>Presente</option>
          <option${alumno.estadoAlumno === "Ausente" ? " selected" : ""}>Ausente</option>
          <option${alumno.estadoAlumno === "Inclusion" ? " selected" : ""}>Inclusion</option>
        </select>
      </td>
      ${activeConsignas().map((c) => {
        const value = alumno.scores[c.scoreKey] ?? "";
        const disabled = isAbsent(alumno) || closed ? " disabled" : "";
        const cellState = scoreCellState(alumno, c);
        if (isConceptual(c)) {
          const options = escalaValues(c).map(option =>
            `<option value="${escapeHTML(option)}"${normalizeText(value) === option ? " selected" : ""}>${escapeHTML(option)}</option>`
          ).join("");
          return `<td class="score-cell ${cellState}">
            <select class="concept-select" data-id="${alumno.id}" data-score="${c.scoreKey}" title="${escapeHTML(c.titulo)}"${disabled}>
              <option value=""></option>
              ${options}
            </select>
          </td>`;
        }
        const max = isInclusion(alumno) ? 9 : c.max;
        return `<td class="score-cell ${cellState}">
          <input type="number" inputmode="decimal" min="0" max="${max}" step="${c.step}" value="${value}" data-id="${alumno.id}" data-score="${c.scoreKey}" title="${escapeHTML(c.titulo)}"${disabled}>
        </td>`;
      }).join("")}
      <td class="calculated" data-total="puntaje">${totals.puntaje.toFixed(1)}</td>
      <td class="calculated" data-total="porcentaje">${totals.porcentaje.toFixed(1)}%</td>
      <td class="observations"><input type="text" value="${alumno.observacion}" data-id="${alumno.id}" data-field="observacion"${closed ? " disabled" : ""}></td>
    `;
    tbody.appendChild(tr);
  });
  updateSummary();
  notifyClosedLoadIfNeeded();
}

function updateRenderedStudentRow(id) {
  const alumno = findStudent(id);
  if (!alumno) return;
  const control = table.querySelector(`tbody [data-id="${CSS.escape(id)}"]`);
  const tr = control ? control.closest("tr") : null;
  if (!tr) return;

  const totals = studentTotals(alumno);
  tr.className = `${totals.completo ? "complete" : "incomplete"} ${totals.alertas ? "has-alert" : ""}`;
  activeConsignas().forEach((consigna) => {
    const input = tr.querySelector(`[data-score="${CSS.escape(consigna.scoreKey)}"]`);
    if (!input) return;
    const cell = input.closest(".score-cell");
    if (input.type === "number") {
      input.max = String(isInclusion(alumno) ? 9 : consigna.max);
    }
    input.disabled = isAbsent(alumno) || currentLoadIsClosed() || cargasPendingForCourse();
    if (cell) cell.className = `score-cell ${scoreCellState(alumno, consigna)}`;
  });
  const puntajeCell = tr.querySelector('[data-total="puntaje"]');
  const porcentajeCell = tr.querySelector('[data-total="porcentaje"]');
  if (puntajeCell) puntajeCell.textContent = totals.puntaje.toFixed(1);
  if (porcentajeCell) porcentajeCell.textContent = `${totals.porcentaje.toFixed(1)}%`;
  updateSummary();
}

function updateSummary() {
  const rows = state[stateKey()] || [];
  const totals = rows.map(studentTotals);
  const completos = totals.filter(t => t.completo).length;
  const alertas = totals.reduce((sum, t) => sum + t.alertas, 0);
  const promedio = totals.length ? totals.reduce((sum, t) => sum + t.porcentaje, 0) / totals.length : 0;
  document.getElementById("studentCount").textContent = rows.length;
  document.getElementById("completeCount").textContent = completos;
  document.getElementById("averageScore").textContent = `${promedio.toFixed(1)}%`;
  document.getElementById("alertCount").textContent = alertas;
  document.getElementById("gridTitle").textContent = courseFilter.value || "Sin curso";
  const closed = currentLoadIsClosed();
  const pending = cargasPendingForCourse();
  document.getElementById("gridSubtitle").textContent = `${subjectFilter.value || "Sin materia"} - ${evaluationFilter.value || "Sin evaluacion"}${closed ? " - carga finalizada" : ""}${pending ? " - cargando registros..." : ""}`;
}

function currentRows() {
  ensureGridState();
  return state[stateKey()] || [];
}

function renderCriteriaEditor() {
  const { curso } = selectedContext();
  const isNew = criteriaMode === "new";
  const evaluationRows = isNew ? [] : mapas.filter(row =>
    row.MateriaNombre === editingMateria &&
    row.EvaluacionNombre === editingEvaluacion
  );
  const selectedCourses = unique(evaluationRows.map(row => row.Curso).filter(Boolean));
  const groupedCourses = cursosPorNivel();
  const expiration = evaluationRows.find(row => row.FechaCaducidad)?.FechaCaducidad || "";
  const periodo = evaluationRows.find(row => row.PeriodoEvaluacion)?.PeriodoEvaluacion || "";
  const knownEscalas = unique(mapas.map(row => normalizeText(row.EscalaConceptual)));
  const knownPeriods = unique(mapas.map(row => row.PeriodoEvaluacion));
  const knownMaterias = materiasDisponibles();

  const title = document.getElementById("criteriaTitle");
  if (title) title.textContent = isNew ? "Nueva evaluación" : "Administrar mapas";

  const headerFields = isNew ? `
    <div class="criteria-config">
      <label>
        Materia (existente o nueva)
        <input id="criteriaMateria" type="text" list="materiaSuggestions" placeholder="Matemática" value="${escapeHTML(newEvaluationPrefillMateria || "")}">
        <datalist id="materiaSuggestions">
          ${knownMaterias.map(m => `<option value="${escapeHTML(m)}"></option>`).join("")}
        </datalist>
      </label>
      <label>
        Nombre de la evaluación
        <input id="criteriaEvaluacion" type="text" placeholder="Evaluación Final" value="${escapeHTML(newEvaluationPrefillNombre || "")}">
      </label>
    </div>
  ` : `
    <div class="criteria-config">
      <label>
        Materia
        <select id="criteriaMateriaSelect">
          ${knownMaterias.map(m => `<option value="${escapeHTML(m)}"${m === editingMateria ? " selected" : ""}>${escapeHTML(m)}</option>`).join("")}
        </select>
      </label>
      <label>
        Evaluación
        <select id="criteriaEvaluacionSelect">
          ${evaluacionesDeMateria(editingMateria).map(e => `<option value="${escapeHTML(e)}"${e === editingEvaluacion ? " selected" : ""}>${escapeHTML(e)}</option>`).join("")}
        </select>
      </label>
      <label>
        &nbsp;
        <button id="duplicateEvaluationBtn" type="button">Duplicar como nueva</button>
      </label>
    </div>
  `;

  criteriaList.innerHTML = `
    ${headerFields}
    <div class="criteria-config">
      <label>
        Aplicar a cursos
        <div class="course-checks">
          ${Object.entries(groupedCourses).map(([level, courses]) => `
            <div class="course-group">
              <label class="level-check">
                <input type="checkbox" data-level="${level}">
                ${level}
              </label>
              <div class="course-items">
                ${courses.map(course => `
                  <span><input type="checkbox" data-course="${course}" ${selectedCourses.includes("*") || selectedCourses.includes(course) || (!selectedCourses.length && course === curso) ? "checked" : ""}> ${course}</span>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </label>
      <label>
        Fecha de caducidad
        <input id="criteriaExpiration" type="date" value="${expiration}">
      </label>
      <label>
        Período de evaluación
        <input id="criteriaPeriod" type="text" list="periodSuggestions" placeholder="1er Trimestre" value="${escapeHTML(periodo)}">
        <datalist id="periodSuggestions">
          ${knownPeriods.map(p => `<option value="${escapeHTML(p)}"></option>`).join("")}
        </datalist>
      </label>
    </div>
    <datalist id="escalaSuggestions">
      ${knownEscalas.map(e => `<option value="${escapeHTML(e)}"></option>`).join("")}
    </datalist>
    ${draftConsignas.map((c, index) => `
    <div class="criteria-row">
      <label>
        Visible
        <span class="active-field"><input type="checkbox" ${c.active ? "checked" : ""} data-criteria="${index}" data-field="active"> Consigna ${c.id}</span>
      </label>
      <label>
        Contenido
        <input type="text" value="${escapeHTML(c.titulo)}" data-criteria="${index}" data-field="titulo" placeholder="Contenido de la consigna">
      </label>
      <label>
        Tipo
        <select data-criteria="${index}" data-field="tipo">
          <option value="numerica"${c.tipo !== "conceptual" ? " selected" : ""}>Numérica</option>
          <option value="conceptual"${c.tipo === "conceptual" ? " selected" : ""}>Conceptual</option>
        </select>
      </label>
      <label>
        Competencia
        <input type="text" value="${escapeHTML(c.competencia || "")}" data-criteria="${index}" data-field="competencia" placeholder="Nivel superior">
      </label>
      <label>
        Eje
        <input type="text" value="${escapeHTML(c.eje || "")}" data-criteria="${index}" data-field="eje" placeholder="Nivel superior">
      </label>
      ${isConceptual(c) ? `
      <label class="escala-field">
        Escala (separada por comas)
        <input type="text" list="escalaSuggestions" value="${escapeHTML(c.escala || "")}" data-criteria="${index}" data-field="escala" placeholder="Logrado, En proceso, Iniciado">
      </label>
      ` : `
      <label>
        Puntaje max.
        <input type="number" min="0.5" step="0.5" value="${c.max}" data-criteria="${index}" data-field="max">
      </label>
      <label>
        Incremento
        <input type="number" min="0.25" step="0.25" value="${c.step}" data-criteria="${index}" data-field="step">
      </label>
      <label>
        Orden
        <input type="number" min="1" step="1" value="${c.id}" data-criteria="${index}" data-field="id">
      </label>
      `}
    </div>
  `).join("")}
  `;
}

function selectedCriteriaCourses() {
  return [...criteriaList.querySelectorAll("[data-course]:checked")].map(input => input.dataset.course);
}

function evaluationExists(materiaNombre, evaluacionNombre) {
  return mapas.some(row =>
    normalizeHeader(row.MateriaNombre) === normalizeHeader(materiaNombre) &&
    normalizeHeader(row.EvaluacionNombre) === normalizeHeader(evaluacionNombre)
  );
}

function uniqueEvaluacionId(evaluacionNombre) {
  const baseId = evaluacionNombre.toUpperCase().replace(/\s+/g, "-");
  let id = baseId;
  let suffix = 2;
  while (mapas.some(row => row.EvaluacionID === id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function upsertMapRowsFromCriteria() {
  const isNew = criteriaMode === "new";
  const selectedCourses = selectedCriteriaCourses();
  if (!selectedCourses.length) {
    showNotice("Selecciona al menos un curso.");
    return null;
  }

  let materiaNombre;
  let evaluacionNombre;
  let base = {};

  if (isNew) {
    materiaNombre = normalizeText(document.getElementById("criteriaMateria")?.value);
    evaluacionNombre = normalizeText(document.getElementById("criteriaEvaluacion")?.value);
    if (!materiaNombre || !evaluacionNombre) {
      showNotice("Completa la materia y el nombre de la evaluación.");
      return null;
    }
    if (evaluationExists(materiaNombre, evaluacionNombre)) {
      showNotice(`Ya existe "${evaluacionNombre}" en ${materiaNombre}. Seleccionala en los filtros para editarla.`);
      return null;
    }
  } else {
    materiaNombre = editingMateria;
    evaluacionNombre = editingEvaluacion;
    if (!materiaNombre || !evaluacionNombre) {
      showNotice("Selecciona una materia y una evaluación para editar.");
      return null;
    }
    base = mapas.find(row =>
      row.MateriaNombre === materiaNombre &&
      row.EvaluacionNombre === evaluacionNombre
    ) || {};
  }

  const expiration = document.getElementById("criteriaExpiration")?.value || "";
  const periodoEvaluacion = normalizeText(document.getElementById("criteriaPeriod")?.value);
  const sinEscala = draftConsignas
    .filter(c => c.tipo === "conceptual" && !normalizeEscalaInput(c.escala))
    .map(c => `Consigna ${c.id}`);
  if (sinEscala.length) {
    showNotice(`Completa la escala de: ${sinEscala.join(", ")} (ej. Logrado, En proceso, Iniciado).`, "Falta la escala conceptual");
    return null;
  }
  const materiaId = base.MateriaID ||
    mapas.find(row => normalizeHeader(row.MateriaNombre) === normalizeHeader(materiaNombre))?.MateriaID ||
    materiaNombre.toUpperCase().slice(0, 3);
  const evaluacionId = base.EvaluacionID || uniqueEvaluacionId(evaluacionNombre);
  const mapaId = base.MapaID || `MAP-${evaluacionId}`;
  const anioLectivo = base.AnioLectivo || String(new Date().getFullYear());

  assignConsignaIds(draftConsignas);

  const targetCourseSet = new Set(selectedCourses);
  mapas = mapas.filter(row => !(
    row.MateriaNombre === materiaNombre &&
    row.EvaluacionNombre === evaluacionNombre &&
    row.EvaluacionID === evaluacionId &&
    targetCourseSet.has(row.Curso)
  ));

  const changedRows = [];

  selectedCourses.forEach(course => {
    draftConsignas.forEach((consigna, index) => {
      const row = {
        MapaID: mapaId,
        MateriaID: materiaId,
        MateriaNombre: materiaNombre,
        EvaluacionID: evaluacionId,
        EvaluacionNombre: evaluacionNombre,
        Nivel: nivelFromCurso(course),
        Curso: course,
        AnioLectivo: anioLectivo,
        ConsignaID: consigna.consignaId,
        ConsignaContenido: consigna.titulo,
        ConsignaPuntajeMax: String(consigna.max),
        ConsignaIncremento: String(consigna.step),
        ConsignaOrden: String(index + 1),
        ConsignaActiva: consigna.active ? "TRUE" : "FALSE",
        FechaCaducidad: expiration,
        Competencia: normalizeText(consigna.competencia),
        Eje: normalizeText(consigna.eje),
        PeriodoEvaluacion: periodoEvaluacion,
        TipoCalificacion: consigna.tipo === "conceptual" ? "conceptual" : "numerica",
        EscalaConceptual: consigna.tipo === "conceptual" ? normalizeEscalaInput(consigna.escala) : ""
      };
      mapas.push(row);
      changedRows.push(row);
    });
  });

  return { changedRows, materiaNombre, evaluacionNombre, courses: selectedCourses };
}

function sortConsignasByOrder(list) {
  list.sort((a, b) => a.id - b.id);
}

function backfillScoreKeys() {
  Object.values(state).flat().forEach(alumno => {
    consignas.forEach(consigna => {
      if (!(consigna.scoreKey in alumno.scores)) alumno.scores[consigna.scoreKey] = "";
    });
  });
}

function findStudent(id) {
  return currentRows().find(alumno => alumno.id === id);
}

function editableControls() {
  return [...table.querySelectorAll("tbody input, tbody select")]
    .filter(control => !control.disabled && control.offsetParent !== null);
}

function focusGridControl(control) {
  if (!control) return;
  control.focus();
  control.select?.();

  const cell = control.closest("td");
  if (!cell || !tableWrap) return;

  const wrapBox = tableWrap.getBoundingClientRect();
  const cellBox = cell.getBoundingClientRect();
  const stickyWidth = 40 + 260;
  const leftSafe = wrapBox.left + stickyWidth + 18;
  const rightSafe = wrapBox.right - 18;

  if (cellBox.left < leftSafe) {
    tableWrap.scrollLeft += cellBox.left - leftSafe;
  } else if (cellBox.right > rightSafe) {
    tableWrap.scrollLeft += cellBox.right - rightSafe;
  }

  control.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function applyImportedAlumnos(rows) {
  const mapped = rows.map(row => ({
    Nombres: row.nombres,
    Apellido: row.apellido,
    DNI: row.dni,
    Nivel: row.nivel || "",
    Curso: row.curso,
    eMail: row.email || row.emailalumno || row["e-mail"] || ""
  })).filter(row => row.DNI && row.Curso);

  const dnis = mapped.map(row => row.DNI);
  const duplicates = dnis.filter((dni, index) => dnis.indexOf(dni) !== index);
  if (duplicates.length) {
    showNotice(`Hay DNI duplicados: ${unique(duplicates).join(", ")}`);
    return;
  }

  alumnos = mapped;
  state = {};
  refreshFilters({ keepSelection: false });
  renderHeader();
  renderBody();
  saveStatus.textContent = `Alumnos importados: ${alumnos.length}`;
}

function applyImportedMapas(rows) {
  mapas = rows.map(row => ({
    MapaID: row.mapaid,
    MateriaID: row.materiaid || row.idmateria,
    MateriaNombre: row.materianombre || row.materia || row.idmateria,
    EvaluacionID: row.evaluacionid || row.evaluacion,
    EvaluacionNombre: row.evaluacionnombre || row.evaluacion,
    Nivel: row.nivel || "",
    Curso: row.curso,
    AnioLectivo: row.aniolectivo || row.anolectivo || "",
    ConsignaID: row.consignaid || `${row.evaluacion || "EVA"}-${row.consignaorden}`,
    ConsignaContenido: row.consignacontenido,
    ConsignaPuntajeMax: row.consignapuntajemax,
    ConsignaIncremento: row.consignaincremento,
    ConsignaOrden: row.consignaorden,
    ConsignaActiva: row.consignaactiva || "TRUE",
    FechaCaducidad: row.fechacaducidad || row.caducidad || "",
    Competencia: row.competencia || "",
    Eje: row.eje || "",
    PeriodoEvaluacion: row.periodoevaluacion || row.periodo || "",
    TipoCalificacion: row.tipocalificacion || "",
    EscalaConceptual: row.escalaconceptual || ""
  })).filter(row => row.MateriaNombre && row.EvaluacionNombre && row.ConsignaContenido);

  state = {};
  refreshFilters({ keepSelection: false });
  renderHeader();
  renderBody();
  saveStatus.textContent = `Mapas importados: ${mapas.length} consignas`;
}

function buildCargaRows(estado = "borrador") {
  const { curso, evaluacion } = selectedContext();
  const evaluacionId = currentEvaluationId();
  const fecha = new Date().toISOString();
  const isFinal = estado === "cerrado";
  const data = [];

  currentRows().forEach(alumno => {
    activeConsignas().forEach(consigna => {
      const puntaje = alumno.scores[consigna.scoreKey] ?? "";
      // Conceptual: el valor de la escala viaja como texto en Puntaje.
      const parsedPuntaje = isConceptual(consigna) ? normalizeText(puntaje) : parseScoreValue(puntaje);
      if (!isFinal && !isAbsent(alumno) && puntaje === "") return;
      if (!isAbsent(alumno) && !scoreIsValid(puntaje, consigna, alumno)) return;
      data.push({
        CargaID: `${evaluacionId}-${alumno.dni}-${consigna.consignaId}`,
        EvaluacionID: evaluacionId,
        ConsignaID: consigna.consignaId,
        DNI: alumno.dni,
        Curso: curso,
        DocenteEmail: docenteEmail,
        Puntaje: isAbsent(alumno) ? "" : parsedPuntaje,
        EstadoAlumno: alumno.estadoAlumno || "Presente",
        UsoMaterial: "",
        PudoResolver: "",
        Observacion: alumno.observacion,
        EstadoCarga: estado,
        FechaGuardado: fecha,
        FechaCierre: estado === "cerrado" ? fecha : ""
      });
    });
  });

  return data;
}

function validateFinalLoad() {
  const missing = [];
  currentRows().forEach(alumno => {
    if (isAbsent(alumno)) return;
    activeConsignas().forEach(consigna => {
      const value = alumno.scores[consigna.scoreKey] ?? "";
      if (value === "" || !scoreIsValid(value, consigna, alumno)) {
        missing.push(`${alumno.nombre} - ${consigna.consignaId}`);
      }
    });
  });
  return missing;
}

function sendCargaRows(rows, labels) {
  showSaveModal(labels.title, labels.message(rows.length), "Enviando...");
  saveStatus.textContent = labels.status(rows.length);
  sheetsPost("saveCargas", rows)
    .then(result => {
      showSaveModal("Confirmando guardado", `Verificando ${result?.rows || 0} registros en la solapa Cargas.`, "Confirmando...");
      saveStatus.textContent = `Confirmando guardado (${result?.rows || 0} filas)...`;
      return confirmSavedCargas(rows);
    })
    .then(check => {
      if (!check.missing.length) {
        showSaveModal(labels.successTitle, `${check.confirmed}/${check.expected} registros quedaron guardados en Sheets.`, "Listo", true);
        saveStatus.textContent = `${labels.successTitle} (${check.confirmed}/${check.expected} filas)`;
        if (rows.some(row => row.EstadoCarga === "cerrado")) closedNoticeKey = stateKey();
        syncFromSheets();
      } else if (check.confirmed === 0) {
        showSaveModal("No se pudo guardar", `No quedo ningun registro en Sheets. Suele pasar cuando la sesion vencio: cerra este aviso, volve a iniciar sesion con tu cuenta @${ALLOWED_DOMAIN} y proba de nuevo.`, "Error", true);
        saveStatus.textContent = "No se guardo (revisar sesion)";
      } else {
        showSaveModal("Guardado parcial", `${check.confirmed}/${check.expected} registros confirmados. Faltan ${check.missing.length}. Puede ser demora de Google Sheets: espera unos segundos y volve a guardar.`, "Revisar", true);
        saveStatus.textContent = `Guardado parcial (${check.confirmed}/${check.expected} filas)`;
      }
    })
    .catch(error => {
      showSaveModal("No se pudo confirmar", error.message, "Error", true);
      saveStatus.textContent = "Error al guardar";
    });
}

function applyCargaRows(rows) {
  const byDni = new Map(currentRows().map(alumno => [normalizeDniKey(alumno.dni), alumno]));
  const active = activeConsignas();
  const byConsigna = new Map(active.map(consigna => [normalizeHeader(consigna.consignaId), consigna]));
  const byOrden = new Map(active.map((consigna, index) => [consignaOrderKey(consigna.id || index + 1), consigna]));
  const pendingByAlumno = new Map();
  let applied = 0;

  function applyCargaValue(alumno, consigna, row) {
    if (!alumno || !consigna) return 0;
    const puntaje = row.Puntaje ?? row.puntaje ?? "";
    alumno.scores[consigna.scoreKey] = puntaje === "" ? "" :
      (isConceptual(consigna) ? normalizeText(puntaje) : String(puntaje).replace(",", "."));
    alumno.estadoAlumno = normalizeEstadoAlumno(row.EstadoAlumno || row.estadoalumno || alumno.estadoAlumno || "Presente");
    alumno.pudoResolver = row.PudoResolver || row.pudoresolver || alumno.pudoResolver;
    alumno.observacion = row.Observacion || row.observacion || alumno.observacion;
    return 1;
  }

  rows.forEach((row, index) => {
    const alumno = byDni.get(normalizeDniKey(row.DNI || row.dni));
    const rawConsignaId = String(row.ConsignaID || row.consignaid || "");
    const consigna = byConsigna.get(normalizeHeader(rawConsignaId)) || byOrden.get(consignaOrderKey(rawConsignaId));
    if (!alumno) return;
    if (consigna) {
      applied += applyCargaValue(alumno, consigna, row);
      return;
    }

    const key = normalizeDniKey(row.DNI || row.dni);
    const items = pendingByAlumno.get(key) || [];
    items.push({ row, index });
    pendingByAlumno.set(key, items);
  });

  pendingByAlumno.forEach((items, dniKey) => {
    const alumno = byDni.get(dniKey);
    items
      .sort((a, b) => {
        const orderA = Number(consignaOrderKey(a.row.ConsignaID || a.row.consignaid)) || a.index + 1;
        const orderB = Number(consignaOrderKey(b.row.ConsignaID || b.row.consignaid)) || b.index + 1;
        return orderA - orderB;
      })
      .forEach((item, index) => {
        const consigna = active[index];
        if (!consigna || alumno.scores[consigna.scoreKey] !== "") return;
        applied += applyCargaValue(alumno, consigna, item.row);
      });
  });

  return applied;
}

function saveLocalDraft() {
  const payload = {
    savedAt: new Date().toISOString(),
    context: selectedContext(),
    cargas: buildCargaRows("borrador")
  };
  localStorage.setItem(storageKey(), JSON.stringify(payload));
  return payload;
}

function restoreLocalDraft(showStatus = true) {
  const raw = localStorage.getItem(storageKey());
  if (!raw) return false;

  try {
    const payload = JSON.parse(raw);
    applyCargaRows(payload.cargas || []);
    if (showStatus) {
      const date = new Date(payload.savedAt).toLocaleString("es-AR");
      saveStatus.textContent = `Borrador recuperado ${date}`;
    }
    return true;
  } catch {
    localStorage.removeItem(storageKey());
    return false;
  }
}

// Aplica a la grilla actual las cargas remotas (array global `cargas`) que
// corresponden al curso + evaluacion seleccionados. Se llama al construir el
// estado de cada curso/evaluacion (ensureGridState), por eso las notas ya
// cargadas aparecen al cambiar de curso, no solo en el que estaba al sincronizar.
function applyRemoteCargasForSelection() {
  if (!courseFilter.value || !cargas.length) return 0;
  const curso = courseFilter.value;
  const evaluacionId = currentEvaluationId();
  const filtered = cargas.filter(row =>
    (!row.Curso || row.Curso === curso) &&
    (!row.EvaluacionID || row.EvaluacionID === evaluacionId || row.EvaluacionID === evaluationFilter.value)
  );
  return applyCargaRows(filtered);
}

function applyImportedCargas(rows) {
  const mapped = normalizeCargaRows(rows).filter(row => row.DNI && row.ConsignaID);
  cargas = mapped;

  const applied = applyRemoteCargasForSelection();
  renderBody();
  saveStatus.textContent = `Cargas importadas: ${applied} registros aplicados`;
}

function readCSVFile(file, callback) {
  const reader = new FileReader();
  reader.onload = () => callback(parseCSV(String(reader.result)));
  reader.readAsText(file, "utf-8");
}

function scriptUrl() {
  return normalizeText(APP_CONFIG.scriptUrl || scriptUrlInput.value || localStorage.getItem(scriptUrlStorageKey));
}

function googleClientId() {
  return normalizeText(APP_CONFIG.googleClientId || googleClientIdInput.value || localStorage.getItem(googleClientIdStorageKey));
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

// --- Sesion persistente (app embebida) ---
// El ID token de Google dura ~1 hora. Lo guardamos en sessionStorage (por
// pestaña, no queda en maquinas compartidas) para que una recarga dentro del
// sitio institucional no obligue a re-loguear.
const idTokenStorageKey = `${storagePrefix}||session-token`;

function tokenSecondsLeft(token = googleIdToken) {
  const exp = Number(decodeJwtPayload(token).exp);
  if (!Number.isFinite(exp)) return 0;
  return Math.floor(exp - Date.now() / 1000);
}

function persistSession(token) {
  try { sessionStorage.setItem(idTokenStorageKey, token); } catch {}
}

function clearStoredSession() {
  googleIdToken = "";
  docenteEmail = "";
  try { sessionStorage.removeItem(idTokenStorageKey); } catch {}
}

function restoreStoredSession() {
  try {
    const token = sessionStorage.getItem(idTokenStorageKey) || "";
    if (!token) return false;
    const payload = decodeJwtPayload(token);
    const email = String(payload.email || "").toLowerCase();
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) return false;
    if (tokenSecondsLeft(token) < 120) return false;
    googleIdToken = token;
    docenteEmail = email;
    debugLog("Sesion restaurada de sessionStorage |", email, "| vence en", tokenSecondsLeft(token), "s");
    return true;
  } catch {
    return false;
  }
}

// La sesion vencio o el backend la rechazo: volver al gate y reintentar One Tap.
function handleSessionExpired(message = `Tu sesion vencio. Volve a ingresar con tu cuenta @${ALLOWED_DOMAIN}.`) {
  clearStoredSession();
  loginGate.hidden = false;
  setLoginMessage(message, "warning");
  prepareGoogleButton();
}

function requireGoogleLogin() {
  if (googleIdToken && tokenSecondsLeft() < 30) {
    handleSessionExpired();
    return false;
  }
  if (googleIdToken) return true;
  showNotice("Primero inicia sesion con Google.");
  return false;
}

function applyImportedAdmins(rows) {
  admins = normalizeSheetRows(rows).map(row => ({
    Email: row.email || row.mail || row.emailadmin || row.docenteemail || row.usuario,
    Nombre: row.nombre,
    Rol: row.rol || "admin",
    Activo: row.activo || "TRUE"
  })).filter(row => row.Email);
  refreshAdminState();
}

function refreshAdminState() {
  const email = docenteEmail.toLowerCase();
  isAdmin = admins.some(admin =>
    normalizeText(admin.Email).toLowerCase() === email &&
    !["false", "0", "no", "n"].includes(normalizeText(admin.Activo).toLowerCase())
  );
  document.querySelectorAll(".admin-action").forEach(element => {
    element.style.display = isAdmin ? "inline-flex" : "none";
  });
  const exportButton = document.getElementById("exportBtn");
  if (exportButton) exportButton.textContent = isAdmin ? "Exportar cargas" : "Exportar grilla";
}

function refreshConfigVisibility() {
  const configuredInCode = Boolean(APP_CONFIG.scriptUrl && APP_CONFIG.googleClientId);
  document.querySelectorAll(".config-action").forEach(element => {
    element.style.display = configuredInCode ? "none" : "inline-flex";
  });
}

function showSaveModal(title, message, indicator = "Procesando", canClose = false) {
  saveModalTitle.textContent = title;
  saveModalMessage.textContent = message;
  saveModalIndicator.textContent = indicator;
  saveModalIndicator.className = "saving-indicator";
  if (["Error", "Revisar", "Incompleta"].includes(indicator)) saveModalIndicator.classList.add("warning");
  if (indicator === "Listo") saveModalIndicator.classList.add("success");
  closeSaveModalBtn.hidden = !canClose;
  saveModal.hidden = false;
}

function closeSaveModal() {
  saveModal.hidden = true;
}

// Aviso simple en modal propio (reemplaza los alert() nativos del navegador).
// El modal de aviso esta despues en el DOM que el de consignas, asi que se
// apila encima cuando este esta abierto.
function showNotice(message, title = "Atención") {
  showSaveModal(title, message, "Revisar", true);
}

function requireScriptUrl() {
  const url = scriptUrl();
  if (!url) {
    showNotice("Primero pega y guarda la URL de Apps Script.");
    connectionModal.hidden = false;
    return "";
  }
  return url;
}

async function sheetsGet(action, { attempts = 2, params = {} } = {}) {
  const url = requireScriptUrl();
  if (!url) return null;
  if (!requireGoogleLogin()) return null;
  // Reintento ante timeout: Apps Script tarda mucho en el arranque en frio.
  // El primer intento "despierta" la instancia; el segundo ya corre caliente.
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const payload = await jsonpRequest(url, { action, ...params, idToken: googleIdToken, t: Date.now() });
      if (!payload.ok) throw new Error(payload.error || "Respuesta invalida");
      return payload.data;
    } catch (error) {
      lastError = error;
      debugLog(`sheetsGet ${action} intento ${attempt}/${attempts} fallo:`, error.message);
      if (attempt < attempts) await wait(1500);
    }
  }
  throw lastError;
}

async function sheetsPost(action, data) {
  const url = requireScriptUrl();
  if (!url) return null;
  if (!requireGoogleLogin()) return null;
  submitToAppsScript(url, { action, idToken: googleIdToken, data });
  return { rows: Array.isArray(data) ? data.length : 0 };
}

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function normalizeCargaRows(rows) {
  return normalizeSheetRows(rows).map(row => ({
    CargaID: row.cargaid,
    EvaluacionID: row.evaluacionid,
    ConsignaID: row.consignaid,
    DNI: row.dni,
    Curso: row.curso,
    DocenteEmail: row.docenteemail,
    Puntaje: row.puntaje,
    EstadoAlumno: row.estadoalumno || row.estado || "Presente",
    UsoMaterial: row.usomaterial,
    PudoResolver: row.pudoresolver,
    Observacion: row.observacion,
    EstadoCarga: row.estadocarga,
    FechaGuardado: row.fechaguardado,
    FechaCierre: row.fechacierre
  }));
}

async function confirmSavedCargas(expectedRows, { attempts = 3 } = {}) {
  const expectedIds = expectedRows.map(row => row.CargaID);
  let confirmed = 0;
  let missing = expectedIds.slice();

  // El POST es asincrono (iframe) y Sheets tarda en reflejar la escritura, asi
  // que reintentamos la lectura antes de declarar un guardado parcial.
  // Solo se leen las cargas del curso actual (todas las esperadas son de el).
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await wait(attempt === 1 ? 1800 : 2500);
    const remoteRows = normalizeCargaRows(await sheetsGet("cargas", { params: { curso: courseFilter.value } }));
    const remoteIds = new Set(remoteRows.map(row => row.CargaID).filter(Boolean));
    missing = expectedIds.filter(id => !remoteIds.has(id));
    confirmed = expectedIds.length - missing.length;
    debugLog(`confirmSavedCargas intento ${attempt}/${attempts}: ${confirmed}/${expectedIds.length} confirmados`);
    if (!missing.length) break;
  }

  return { expected: expectedIds.length, confirmed, missing };
}

function jsonpRequest(baseUrl, params) {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const url = new URL(baseUrl);

    Object.entries({ ...params, callback: callbackName }).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const startedAt = Date.now();
    debugLog("JSONP →", params.action || "?", "| base:", baseUrl, "| idToken:", maskToken(params.idToken));

    const timer = window.setTimeout(() => {
      cleanup();
      debugLog("JSONP ✗ TIMEOUT", params.action, "tras", Date.now() - startedAt, "ms — el callback nunca llego. Causas tipicas: deployment NO es 'Cualquier persona', o doGet no envuelve la respuesta en el callback.");
      reject(new Error("Tiempo de espera agotado al consultar Apps Script."));
    }, 60000);

    function cleanup() {
      window.clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = payload => {
      cleanup();
      debugLog("JSONP ←", params.action, "en", Date.now() - startedAt, "ms |", payload && payload.ok ? "ok" : "ERROR", payload);
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      debugLog("JSONP ✗ onerror", params.action, "tras", Date.now() - startedAt, "ms — el <script> no cargo. Suele ser que /exec respondio HTML (login de Google) en vez de JS. Revisa permisos del deployment.");
      reject(new Error("No se pudo cargar Apps Script. Revisa la URL /exec y el despliegue."));
    };

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

function submitToAppsScript(url, payload) {
  debugLog("POST →", payload.action, Array.isArray(payload.data) ? `${payload.data.length} filas` : "", "| idToken:", maskToken(payload.idToken), "(respuesta no legible: iframe cross-origin)");
  const iframeName = `gas_post_${Date.now()}`;
  const iframe = document.createElement("iframe");
  iframe.name = iframeName;
  iframe.hidden = true;
  document.body.appendChild(iframe);

  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.target = iframeName;
  form.hidden = true;

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "payload";
  input.value = JSON.stringify(payload);
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();

  window.setTimeout(() => {
    form.remove();
    iframe.remove();
  }, 15000);
}

function setLoginMessage(message, type = "") {
  if (!loginHelp) return;
  loginHelp.textContent = message;
  loginHelp.classList.toggle("is-warning", type === "warning");
  loginHelp.classList.toggle("is-error", type === "error");
}

function resetLoginButton() {
  googleLoginInProgress = false;
  if (gateLoginBtn) {
    gateLoginBtn.disabled = false;
    gateLoginBtn.textContent = "Reintentar login";
  }
}

function loginBlockedMessage(reason = "") {
  const extra = reason ? ` (${reason})` : "";
  setLoginMessage(`Google no mostro el selector de cuentas${extra}. Permiti ventanas emergentes y cookies, o abri la app en una pestaña nueva.`, "warning");
  resetLoginButton();
}

function handleGoogleCredential(credentialResponse) {
  window.clearTimeout(googleLoginFallbackTimer);
  googleLoginInProgress = false;
  if (gateLoginBtn) {
    gateLoginBtn.disabled = false;
    gateLoginBtn.textContent = "Reintentar login";
  }
  const token = credentialResponse.credential;
  const payload = decodeJwtPayload(token);
  const email = String(payload.email || "").toLowerCase();

  // El hd del initialize es solo una sugerencia del selector: validamos aca
  // para rechazar de verdad cuentas que no sean del dominio institucional.
  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    googleIdToken = "";
    docenteEmail = "";
    debugLog("Login rechazado: dominio no permitido |", email || "(sin email)");
    setLoginMessage(`La cuenta ${email || "seleccionada"} no es @${ALLOWED_DOMAIN}. Inicia sesion con tu cuenta institucional.`, "error");
    if (window.google?.accounts?.id) google.accounts.id.disableAutoSelect();
    return;
  }

  googleIdToken = token;
  docenteEmail = email;
  persistSession(token);
  debugLog("Login OK |", docenteEmail, "| aud:", payload.aud, "| hd:", payload.hd, "| token:", maskToken(googleIdToken));
  saveStatus.textContent = `Sesion: ${docenteEmail}`;
  refreshAdminState();
  loginGate.hidden = true;
  syncFromSheets({ showLoading: true });
}

function ensureGoogleIdentityInitialized() {
  const clientId = googleClientId();
  if (!clientId) {
    setLoginMessage("Falta configurar el Google Client ID para poder iniciar sesion.", "error");
    connectionModal.hidden = false;
    return false;
  }

  if (!window.google?.accounts?.id) {
    setLoginMessage("Google todavia no termino de cargar. Espera unos segundos y volve a intentar.", "warning");
    return false;
  }

  if (googleInitializedClientId === clientId) return true;

  // auto_select: si el docente tiene UNA sola sesion de Google (la
  // institucional, caso tipico dentro del sitio Goethe) el login es silencioso,
  // sin clicks. FedCM + itp_support: el flujo sigue andando cuando el navegador
  // bloquea cookies de terceros (Chrome las esta eliminando; Safari ya).
  google.accounts.id.initialize({
    client_id: clientId,
    auto_select: true,
    hd: ALLOWED_DOMAIN,
    itp_support: true,
    use_fedcm_for_prompt: true,
    callback: handleGoogleCredential
  });
  googleInitializedClientId = clientId;
  return true;
}

function renderGoogleButton() {
  if (!ensureGoogleIdentityInitialized() || !googleButtonWrap) return false;
  const clientId = googleClientId();
  if (googleButtonRenderedClientId === clientId && googleButtonWrap.children.length) return true;
  googleButtonWrap.innerHTML = "";
  google.accounts.id.renderButton(googleButtonWrap, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "signin_with",
    shape: "rectangular",
    logo_alignment: "left",
    width: 280
  });
  googleButtonRenderedClientId = clientId;
  return true;
}

function startGoogleLogin() {
  if (googleLoginInProgress) return;
  if (!renderGoogleButton()) return;

  googleIdToken = "";
  docenteEmail = "";
  google.accounts.id.disableAutoSelect();
  googleLoginInProgress = true;
  if (gateLoginBtn) {
    gateLoginBtn.disabled = true;
    gateLoginBtn.textContent = "Preparando login...";
  }
  setLoginMessage("Usa el boton oficial de Google que aparece arriba. Si no responde, abri la app en una pestaña nueva.", "warning");
  window.clearTimeout(googleLoginFallbackTimer);
  googleLoginFallbackTimer = window.setTimeout(() => {
    if (googleLoginInProgress && !googleIdToken) {
      resetLoginButton();
    }
  }, 4500);
}

// One Tap: pide la credencial sin click. Con auto_select y una unica sesion
// institucional, el docente entra directo. Si Google no puede mostrarlo
// (iframe sin permiso, cookies), el boton oficial queda como fallback.
function attemptOneTap() {
  if (googleIdToken || !window.google?.accounts?.id) return;
  try {
    // Sin callback de estado: esos metodos estan deprecados con FedCM y
    // Google loguea un warning si se usan.
    google.accounts.id.prompt();
    debugLog("One Tap solicitado");
  } catch (error) {
    debugLog("One Tap no disponible:", error.message);
  }
}

function prepareGoogleButton(attempt = 0) {
  if (!scriptUrl() || !googleClientId() || googleIdToken) return;
  if (renderGoogleButton()) {
    setLoginMessage("Usa el boton oficial de Google para ingresar con tu cuenta @goethe.edu.ar.");
    attemptOneTap();
    return;
  }
  if (attempt < 20) {
    window.setTimeout(() => prepareGoogleButton(attempt + 1), 250);
  }
}

function normalizeSheetRows(rows) {
  return (rows || []).map(row => {
    const normalized = {};
    Object.entries(row).forEach(([key, value]) => {
      normalized[normalizeHeader(key)] = normalizeText(value);
    });
    return normalized;
  });
}

// Cursos cuyas cargas ya se trajeron del backend (se piden por curso: la
// solapa Cargas crecio tanto que bajarla entera rompe la transferencia).
let cargasLoadedCursos = new Set();
let cargasFetchInFlight = new Set();

// Mientras los registros del curso no llegaron, la grilla queda bloqueada:
// si el docente pudiera tipear sobre la grilla "vacia", lo remoto despues le
// pisaria lo tipeado (o editaria una carga que en realidad esta cerrada).
function cargasPendingForCourse(curso = courseFilter.value) {
  if (!curso) return false;
  if (!scriptUrl() || !googleClientId() || !googleIdToken) return false;
  return !cargasLoadedCursos.has(curso);
}

// Trae los datos maestros + las cargas SOLO del curso indicado. Intenta la
// accion 'bootstrap' (1 sola llamada). Si el backend no la expone, cae a las
// lecturas individuales en serie.
async function fetchBootstrapBundle(curso = "") {
  const params = curso ? { curso } : {};
  try {
    const data = await sheetsGet("bootstrap", { params });
    if (data && (data.alumnos || data.mapas || data.cargas || data.admins)) {
      return {
        alumnos: data.alumnos || [],
        mapas: data.mapas || [],
        cargas: data.cargas || [],
        admins: data.admins || []
      };
    }
    debugLog("bootstrap devolvio vacio, uso llamadas individuales");
  } catch (error) {
    debugLog("bootstrap no disponible, uso llamadas individuales:", error.message);
  }

  // Fallback: en serie a proposito (Apps Script serializa las ejecuciones
  // concurrentes del mismo usuario; en paralelo las ultimas superan el timeout).
  const alumnos = await sheetsGet("alumnos");
  const mapas = await sheetsGet("mapas");
  const cargas = await sheetsGet("cargas", { params });
  let admins = [];
  try {
    admins = await sheetsGet("admins");
  } catch (adminError) {
    console.warn("No se pudo leer Admins:", adminError);
  }
  return {
    alumnos: alumnos || [],
    mapas: mapas || [],
    cargas: cargas || [],
    admins: admins || []
  };
}

// Carga perezosa de las cargas de un curso la primera vez que se lo visita.
// La grilla queda bloqueada (cargasPendingForCourse) hasta que lleguen.
async function ensureCargasForCourse(curso) {
  if (!curso || cargasLoadedCursos.has(curso) || cargasFetchInFlight.has(curso)) return;
  if (!scriptUrl() || !googleClientId() || !googleIdToken) return;
  cargasFetchInFlight.add(curso);
  saveStatus.textContent = `Cargando registros de ${curso}...`;
  try {
    const remote = normalizeCargaRows(normalizeSheetRows(await sheetsGet("cargas", { params: { curso } })))
      .filter(row => row.DNI && row.ConsignaID);
    // Reemplaza las cargas de ese curso y reaplica sobre la grilla actual,
    // preservando el borrador local (se aplica despues, y pisa lo remoto).
    cargas = cargas.filter(row => row.Curso !== curso).concat(remote);
    debugLog(`Cargas de ${curso}:`, remote.length, "filas");
    cargasLoadedCursos.add(curso);
    applyRemoteCargasForSelection();
    restoreLocalDraft(false);
    saveStatus.textContent = "Sheets sincronizado";
  } catch (error) {
    saveStatus.textContent = `No se pudieron cargar los registros de ${curso}`;
    showNotice(`No se pudieron traer los registros de ${curso} (${error.message}). La grilla queda bloqueada: volve a seleccionar el curso para reintentar.`, "Registros del curso");
    debugLog(`ensureCargasForCourse ${curso} fallo:`, error.message);
  } finally {
    cargasFetchInFlight.delete(curso);
    // Re-render con el estado final: desbloquea si llegaron los datos.
    if (courseFilter.value === curso) renderBody();
  }
}

async function syncFromSheets({ showLoading = false } = {}) {
  if (showLoading) {
    showSaveModal("Cargando", "Sincronizando alumnos, mapas, cargas y permisos con Google Sheets. La primera carga puede tardar hasta un minuto.", "Sincronizando...");
  }
  saveStatus.textContent = "Sincronizando Sheets...";
  try {
    // Las cargas viajan solo para el curso visible; el resto se pide al
    // entrar a cada curso (ensureCargasForCourse). En el primer login todavia
    // no hay alumnos importados y courseFilter tiene el valor demo del HTML:
    // en ese caso no se pide curso (las trae ensureCargasForCourse despues).
    const cursoInicial = alumnos.length ? (courseFilter.value || "") : "";
    // Sin curso conocido se manda un centinela que no matchea ninguno: el
    // backend sin parametro devolveria TODAS las cargas (6000+ filas y
    // creciendo), que es exactamente lo que tiro abajo el bootstrap.
    const bundle = await fetchBootstrapBundle(cursoInicial || "__sin_curso__");
    debugLog("Sync recibido | alumnos:", bundle.alumnos.length, "| mapas:", bundle.mapas.length, "| cargas:", bundle.cargas.length, `(curso: ${cursoInicial || "ninguno"})`, "| admins:", bundle.admins.length);
    applyImportedAlumnos(normalizeSheetRows(bundle.alumnos));
    applyImportedMapas(normalizeSheetRows(bundle.mapas));
    applyImportedCargas(normalizeSheetRows(bundle.cargas));
    applyImportedAdmins(bundle.admins);
    cargasLoadedCursos = new Set(cursoInicial ? [cursoInicial] : []);
    saveStatus.textContent = admins.length ? "Sheets sincronizado" : "Sheets sincronizado - falta publicar Admins";
    if (showLoading) closeSaveModal();
    // El curso autoseleccionado tras importar alumnos puede no ser el del
    // bootstrap: traer sus cargas si falta.
    ensureCargasForCourse(courseFilter.value);
  } catch (error) {
    saveStatus.textContent = "Error al sincronizar Sheets";
    if (/no autorizado/i.test(error.message)) {
      if (showLoading) closeSaveModal();
      handleSessionExpired();
      return;
    }
    if (showLoading) {
      showSaveModal("No se pudo sincronizar", error.message, "Error", true);
    } else {
      showNotice(`No se pudo sincronizar: ${error.message}`);
    }
  }
}

function csvBlob(csv) {
  return new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
}

// Descarga robusta: agrega el <a> al DOM (Firefox/algunos navegadores no
// disparan el click si no esta en el documento) y difiere el revoke para no
// cancelar la descarga.
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1500);
}

// --- Exportacion a XLSX real, sin dependencias ---
// El CSV con comas se abre mal en Excel en espa\u00f1ol (usa ; como separador) y
// los decimales con punto quedan como texto. Generamos un .xlsx valido para
// que abra siempre bien, con numeros como numeros.
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const xlsxEncoder = new TextEncoder();

// Empaqueta archivos en un ZIP sin compresion (metodo "store"), suficiente
// para un .xlsx valido.
function zipStore(files) {
  const chunks = [];
  const central = [];
  let offset = 0;

  function bytesLE(value, length) {
    const arr = new Uint8Array(length);
    let v = value >>> 0;
    for (let i = 0; i < length; i += 1) {
      arr[i] = v & 0xFF;
      v = Math.floor(v / 256);
    }
    return arr;
  }

  files.forEach(file => {
    const nameBytes = xlsxEncoder.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    const local = [
      bytesLE(0x04034b50, 4), bytesLE(20, 2), bytesLE(0, 2), bytesLE(0, 2),
      bytesLE(0, 2), bytesLE(0, 2), bytesLE(crc, 4), bytesLE(size, 4),
      bytesLE(size, 4), bytesLE(nameBytes.length, 2), bytesLE(0, 2), nameBytes
    ];
    local.forEach(part => chunks.push(part));
    chunks.push(file.data);

    const localLength = local.reduce((sum, part) => sum + part.length, 0);

    const cen = [
      bytesLE(0x02014b50, 4), bytesLE(20, 2), bytesLE(20, 2), bytesLE(0, 2),
      bytesLE(0, 2), bytesLE(0, 2), bytesLE(0, 2), bytesLE(crc, 4),
      bytesLE(size, 4), bytesLE(size, 4), bytesLE(nameBytes.length, 2),
      bytesLE(0, 2), bytesLE(0, 2), bytesLE(0, 2), bytesLE(0, 2),
      bytesLE(0, 4), bytesLE(offset, 4), nameBytes
    ];
    central.push(cen);

    offset += localLength + file.data.length;
  });

  const centralStart = offset;
  let centralSize = 0;
  central.forEach(cen => {
    cen.forEach(part => {
      chunks.push(part);
      centralSize += part.length;
    });
  });

  const end = [
    bytesLE(0x06054b50, 4), bytesLE(0, 2), bytesLE(0, 2),
    bytesLE(files.length, 2), bytesLE(files.length, 2),
    bytesLE(centralSize, 4), bytesLE(centralStart, 4), bytesLE(0, 2)
  ];
  end.forEach(part => chunks.push(part));

  const total = chunks.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  chunks.forEach(part => { out.set(part, pos); pos += part.length; });
  return out;
}

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function xlsxColName(index) {
  let name = "";
  let n = index;
  do {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return name;
}

// Convierte un valor a numero para la celda solo si es claramente numerico,
// preservando como texto los IDs/DNI con ceros a la izquierda.
function numericCell(value) {
  if (value === "" || value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? value : "";
  const text = String(value).trim();
  if (/^-?\d+(?:[.,]\d+)?$/.test(text) && !/^0\d/.test(text)) {
    return Number(text.replace(",", "."));
  }
  return String(value);
}

function sheetXml(aoa) {
  const rowsXml = aoa.map((row, r) => {
    const cellsXml = row.map((cell, c) => {
      const ref = xlsxColName(c) + (r + 1);
      if (typeof cell === "number" && Number.isFinite(cell)) {
        return `<c r="${ref}"><v>${cell}</v></c>`;
      }
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(cell)}</t></is></c>`;
    }).join("");
    return `<row r="${r + 1}">${cellsXml}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`;
}

function sanitizeSheetName(name) {
  const clean = String(name || "Hoja1").replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31);
  return clean || "Hoja1";
}

function downloadXlsx(filename, sheetName, aoa) {
  const safeSheet = xmlEscape(sanitizeSheetName(sheetName));
  const files = [
    { name: "[Content_Types].xml", text:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
      `</Types>` },
    { name: "_rels/.rels", text:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `</Relationships>` },
    { name: "xl/workbook.xml", text:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets><sheet name="${safeSheet}" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", text:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
      `</Relationships>` },
    { name: "xl/worksheets/sheet1.xml", text: sheetXml(aoa) }
  ].map(file => ({ name: file.name, data: xlsxEncoder.encode(file.text) }));

  const blob = new Blob([zipStore(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  triggerDownload(blob, filename);
}

function exportCargas() {
  const { curso, materia, evaluacion } = selectedContext();
  const headers = ["CargaID", "EvaluacionID", "ConsignaID", "DNI", "Curso", "DocenteEmail", "Puntaje", "UsoMaterial", "PudoResolver", "Observacion", "EstadoCarga", "FechaGuardado", "FechaCierre", "EstadoAlumno"];
  const data = buildCargaRows("borrador").map(row =>
    headers.map(header => header === "Puntaje" ? numericCell(row[header]) : (row[header] ?? ""))
  );

  const filename = `cargas_${curso}_${materia}_${evaluacion}.xlsx`.replace(/\s+/g, "_");
  downloadXlsx(filename, "Cargas", [headers, ...data]);
}

function exportVisibleGrid() {
  const { curso, materia, evaluacion } = selectedContext();
  const criteria = activeConsignas();
  const headers = ["Nr.", "Nombre", "Estado", ...criteria.map(c => c.titulo), "Puntaje", "Calificacion", "Observaciones"];
  const extraRows = [];
  if (criteria.some(c => c.competencia)) {
    extraRows.push(["", "Competencia", "", ...criteria.map(c => c.competencia || ""), "", "", ""]);
  }
  if (criteria.some(c => c.eje)) {
    extraRows.push(["", "Eje", "", ...criteria.map(c => c.eje || ""), "", "", ""]);
  }
  const maxRow = ["", "Valor maximo", "", ...criteria.map(c => isConceptual(c) ? "" : numericCell(c.max)), "", "", ""];
  const rows = currentRows().map((alumno, index) => {
    const totals = studentTotals(alumno);
    return [
      index + 1,
      alumno.nombre,
      alumno.estadoAlumno || "Presente",
      ...criteria.map(c => numericCell(alumno.scores[c.scoreKey] ?? "")),
      Number(totals.puntaje.toFixed(1)),
      `${totals.porcentaje.toFixed(1)}%`,
      alumno.observacion
    ];
  });
  const filename = `grilla_${curso}_${materia}_${evaluacion}.xlsx`.replace(/\s+/g, "_");
  downloadXlsx(filename, `${curso} ${materia}`, [headers, ...extraRows, maxRow, ...rows]);
}

function exportMapas() {
  const headers = ["MapaID", "MateriaID", "MateriaNombre", "EvaluacionID", "EvaluacionNombre", "Nivel", "Curso", "AnioLectivo", "ConsignaID", "ConsignaContenido", "ConsignaPuntajeMax", "ConsignaIncremento", "ConsignaOrden", "ConsignaActiva", "FechaCaducidad", "Competencia", "Eje", "PeriodoEvaluacion", "TipoCalificacion", "EscalaConceptual"];
  const rows = mapas.map(row => headers.map(header => row[header] ?? ""));
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  triggerDownload(csvBlob(csv), "mapas_actualizados.csv");
}

table.addEventListener("keydown", event => {
  if (event.key !== "Tab") return;

  const controls = editableControls();
  const currentIndex = controls.indexOf(event.target);
  if (currentIndex === -1) return;

  event.preventDefault();
  const direction = event.shiftKey ? -1 : 1;
  const nextControl = controls[currentIndex + direction];

  if (nextControl) focusGridControl(nextControl);
});

table.addEventListener("input", event => {
  const target = event.target;
  const id = target.dataset.id;
  if (!id) return;
  const alumno = findStudent(id);
  if (target.dataset.score !== undefined) {
    const scoreKey = target.dataset.score;
    alumno.scores[scoreKey] = target.value.trim();
    saveStatus.textContent = "Cambios sin guardar";
    updateRenderedStudentRow(id);
  } else if (target.dataset.field) {
    alumno[target.dataset.field] = target.value;
    saveStatus.textContent = "Cambios sin guardar";
  }
});

table.addEventListener("change", event => {
  const target = event.target;
  const id = target.dataset.id;
  if (!id) return;
  const alumno = findStudent(id);
  if (target.dataset.score !== undefined) {
    alumno.scores[target.dataset.score] = target.value.trim();
    saveStatus.textContent = "Cambios sin guardar";
    updateRenderedStudentRow(id);
    return;
  } else if (target.dataset.field) {
    alumno[target.dataset.field] = target.dataset.field === "estadoAlumno" ? normalizeEstadoAlumno(target.value) : target.value;
  } else {
    return;
  }
  saveStatus.textContent = "Cambios sin guardar";
  renderBody();
});

courseFilter.addEventListener("input", () => {
  refreshFilters();
  renderHeader();
  renderBody();
  restoreLocalDraft();
  ensureCargasForCourse(courseFilter.value);
});

subjectFilter.addEventListener("input", () => {
  refreshFilters();
  renderHeader();
  renderBody();
  restoreLocalDraft();
});

evaluationFilter.addEventListener("input", () => {
  syncConsignasFromSelection();
  renderHeader();
  renderBody();
  restoreLocalDraft();
});

periodFilter.addEventListener("input", () => {
  refreshFilters();
  renderHeader();
  renderBody();
  restoreLocalDraft();
});

[searchInput, showIncomplete].forEach(control => {
  control.addEventListener("input", renderBody);
});

document.getElementById("saveBtn").addEventListener("click", () => {
  if (!scriptUrl() || !googleIdToken) {
    showNotice("Para guardar, primero inicia sesion y conecta Google Sheets.");
    return;
  }
  if (cargasPendingForCourse()) {
    showNotice("Todavia se estan cargando los registros del curso. Espera unos segundos.");
    return;
  }
  if (currentLoadIsClosed()) {
    showSaveModal("Carga finalizada", "Este curso ya tiene la carga finalizada para esta evaluacion.", "Bloqueada", true);
    return;
  }
  saveLocalDraft();
  const rows = buildCargaRows("borrador");
  if (!rows.length) {
    showSaveModal("Sin cambios para guardar", "No hay puntajes cargados ni ausentes para enviar a Sheets.", "Sin registros", true);
    return;
  }
  sendCargaRows(rows, {
    title: "Guardando borrador",
    message: count => `Enviando ${count} registros cargados a Sheets.`,
    status: count => `Enviando borrador a Sheets (${count} filas)...`,
    successTitle: "Guardado confirmado"
  });
});

document.getElementById("finishBtn").addEventListener("click", () => {
  if (!scriptUrl() || !googleIdToken) {
    showNotice("Para finalizar, primero inicia sesion y conecta Google Sheets.");
    return;
  }
  if (cargasPendingForCourse()) {
    showNotice("Todavia se estan cargando los registros del curso. Espera unos segundos.");
    return;
  }
  if (currentLoadIsClosed()) {
    showSaveModal("Carga finalizada", "Este curso ya tiene la carga finalizada para esta evaluacion.", "Bloqueada", true);
    return;
  }
  const missing = validateFinalLoad();
  if (missing.length) {
    const preview = missing.slice(0, 18).join("\n");
    const rest = missing.length > 18 ? `\n... y ${missing.length - 18} pendientes mas.` : "";
    showSaveModal("Faltan datos", `Hay ${missing.length} consignas pendientes o invalidas:\n${preview}${rest}`, "Incompleta", true);
    return;
  }
  const rows = buildCargaRows("cerrado");
  sendCargaRows(rows, {
    title: "Finalizando carga",
    message: count => `Enviando ${count} registros finales a Sheets.`,
    status: count => `Finalizando carga (${count} filas)...`,
    successTitle: "Carga finalizada"
  });
});

document.getElementById("exportBtn").addEventListener("click", () => {
  if (isAdmin) exportCargas();
  else exportVisibleGrid();
});
document.getElementById("exportMapsBtn").addEventListener("click", () => {
  if (!isAdmin) {
    showNotice("Solo administradores pueden exportar mapas.");
    return;
  }
  exportMapas();
});

document.getElementById("connectionBtn").addEventListener("click", () => {
  scriptUrlInput.value = localStorage.getItem(scriptUrlStorageKey) || "";
  googleClientIdInput.value = localStorage.getItem(googleClientIdStorageKey) || "";
  connectionModal.hidden = false;
});

document.getElementById("gateConnectionBtn").addEventListener("click", () => {
  scriptUrlInput.value = localStorage.getItem(scriptUrlStorageKey) || "";
  googleClientIdInput.value = localStorage.getItem(googleClientIdStorageKey) || "";
  connectionModal.hidden = false;
});

document.getElementById("closeConnectionBtn").addEventListener("click", () => {
  connectionModal.hidden = true;
});

document.getElementById("saveConnectionBtn").addEventListener("click", () => {
  const url = normalizeText(scriptUrlInput.value);
  const clientId = normalizeText(googleClientIdInput.value);
  if (!url.startsWith("https://script.google.com/")) {
    showNotice("Pega una URL valida de Apps Script.");
    return;
  }
  if (!clientId.endsWith(".apps.googleusercontent.com")) {
    showNotice("Pega un Google Client ID valido.");
    return;
  }
  localStorage.setItem(scriptUrlStorageKey, url);
  localStorage.setItem(googleClientIdStorageKey, clientId);
  connectionModal.hidden = true;
  saveStatus.textContent = "Conexion guardada";
});

document.getElementById("syncSheetsBtn").addEventListener("click", syncFromSheets);
document.getElementById("googleLoginBtn").addEventListener("click", startGoogleLogin);
gateLoginBtn.addEventListener("click", startGoogleLogin);
openStandaloneBtn.addEventListener("click", () => {
  window.open(window.location.href, "_blank", "noopener,noreferrer");
});
closeSaveModalBtn.addEventListener("click", closeSaveModal);

document.getElementById("loadMasterBtn").addEventListener("click", () => {
  document.getElementById("masterFile").click();
});

document.getElementById("loadMapsBtn").addEventListener("click", () => {
  document.getElementById("mapsFile").click();
});

document.getElementById("loadLoadsBtn").addEventListener("click", () => {
  document.getElementById("loadsFile").click();
});

document.getElementById("masterFile").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (file) readCSVFile(file, applyImportedAlumnos);
  event.target.value = "";
});

document.getElementById("mapsFile").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (file) readCSVFile(file, applyImportedMapas);
  event.target.value = "";
});

document.getElementById("loadsFile").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (file) readCSVFile(file, applyImportedCargas);
  event.target.value = "";
});

function loadEditingDraft() {
  draftConsignas = consignasForEvaluation(editingMateria, editingEvaluacion).map(c => ({ ...c }));
  if (!draftConsignas.length) draftConsignas = [blankConsigna(1)];
}

function openCriteriaModal(mode) {
  criteriaMode = mode;
  if (mode === "new") {
    newEvaluationPrefillMateria = newEvaluationPrefillMateria || subjectFilter.value || "";
    draftConsignas = [blankConsigna(1)];
  } else {
    // Arranca en lo que este mirando la grilla (comodo para el docente-admin),
    // pero desde el selector del modal se navega a cualquier materia/evaluacion.
    const materias = materiasDisponibles();
    editingMateria = materias.includes(subjectFilter.value) ? subjectFilter.value : (materias[0] || "");
    const evaluaciones = evaluacionesDeMateria(editingMateria);
    editingEvaluacion = evaluaciones.includes(evaluationFilter.value) ? evaluationFilter.value : (evaluaciones[0] || "");
    loadEditingDraft();
  }
  renderCriteriaEditor();
  criteriaModal.hidden = false;
}

document.getElementById("criteriaBtn").addEventListener("click", () => {
  if (!isAdmin) {
    showNotice("Solo administradores pueden editar consignas.");
    return;
  }
  newEvaluationPrefillMateria = "";
  newEvaluationPrefillNombre = "";
  // Sin mapas cargados se abre directo en modo creacion.
  openCriteriaModal(materiasDisponibles().length ? "edit" : "new");
});

document.getElementById("newEvaluationBtn").addEventListener("click", () => {
  if (criteriaMode === "new") return;
  newEvaluationPrefillMateria = editingMateria || subjectFilter.value || "";
  newEvaluationPrefillNombre = "";
  draftConsignas = [blankConsigna(1)];
  criteriaMode = "new";
  renderCriteriaEditor();
});

// Selector propio del modal (cambiar materia/evaluacion recarga el borrador)
// y duplicacion: delegados porque el contenido del modal se re-renderiza.
criteriaList.addEventListener("change", event => {
  if (event.target.id === "criteriaMateriaSelect") {
    editingMateria = event.target.value;
    editingEvaluacion = evaluacionesDeMateria(editingMateria)[0] || "";
    loadEditingDraft();
    renderCriteriaEditor();
  } else if (event.target.id === "criteriaEvaluacionSelect") {
    editingEvaluacion = event.target.value;
    loadEditingDraft();
    renderCriteriaEditor();
  }
});

criteriaList.addEventListener("click", event => {
  if (event.target.id !== "duplicateEvaluationBtn") return;
  // Clona las consignas de la evaluacion elegida hacia una evaluacion nueva:
  // la forma rapida de extender mapas a otros niveles/materias/periodos.
  newEvaluationPrefillMateria = editingMateria;
  newEvaluationPrefillNombre = `${editingEvaluacion} (copia)`;
  draftConsignas = consignasForEvaluation(editingMateria, editingEvaluacion)
    .map((c, index) => ({ ...c, consignaId: "", scoreKey: `NEW-${Date.now()}-${index}` }));
  if (!draftConsignas.length) draftConsignas = [blankConsigna(1)];
  criteriaMode = "new";
  renderCriteriaEditor();
});

document.getElementById("closeCriteriaBtn").addEventListener("click", () => {
  criteriaModal.hidden = true;
});

criteriaModal.addEventListener("click", event => {
  if (event.target === criteriaModal) criteriaModal.hidden = true;
});

criteriaList.addEventListener("input", event => {
  const target = event.target;
  const index = Number(target.dataset.criteria);
  const field = target.dataset.field;
  if (!Number.isInteger(index) || !field || !draftConsignas[index]) return;
  if (field === "active") draftConsignas[index][field] = target.checked;
  else if (["titulo", "competencia", "eje", "tipo", "escala"].includes(field)) draftConsignas[index][field] = target.value;
  else draftConsignas[index][field] = Number(target.value);

  // Cambiar el tipo intercambia los campos de la fila (escala <-> puntajes):
  // re-render preservando lo tipeado en el formulario superior.
  if (field === "tipo") {
    const consigna = draftConsignas[index];
    if (consigna.tipo === "conceptual" && !normalizeText(consigna.escala)) {
      const materiaRef = criteriaMode === "new"
        ? (document.getElementById("criteriaMateria")?.value || "")
        : editingMateria;
      consigna.escala = escalaDeMateria(materiaRef);
    }
    const saved = captureCriteriaFormState();
    renderCriteriaEditor();
    restoreCriteriaFormState(saved);
  }
});

criteriaList.addEventListener("change", event => {
  if (event.target.dataset.level) {
    const group = event.target.closest(".course-group");
    group?.querySelectorAll("[data-course]").forEach(input => {
      input.checked = event.target.checked;
    });
    return;
  }

  if (event.target.type === "checkbox") {
    const index = Number(event.target.dataset.criteria);
    if (Number.isInteger(index) && draftConsignas[index]) draftConsignas[index].active = event.target.checked;
  }
});

// El formulario superior se reconstruye al re-renderizar (p. ej. al agregar
// una consigna): capturamos lo tipeado para no perderlo.
function captureCriteriaFormState() {
  return {
    materia: document.getElementById("criteriaMateria")?.value,
    evaluacion: document.getElementById("criteriaEvaluacion")?.value,
    expiration: document.getElementById("criteriaExpiration")?.value,
    period: document.getElementById("criteriaPeriod")?.value,
    courses: selectedCriteriaCourses()
  };
}

function restoreCriteriaFormState(saved) {
  if (!saved) return;
  const setValue = (id, value) => {
    const input = document.getElementById(id);
    if (input && value !== undefined) input.value = value;
  };
  setValue("criteriaMateria", saved.materia);
  setValue("criteriaEvaluacion", saved.evaluacion);
  setValue("criteriaExpiration", saved.expiration);
  setValue("criteriaPeriod", saved.period);
  const courseSet = new Set(saved.courses);
  criteriaList.querySelectorAll("[data-course]").forEach(input => {
    input.checked = courseSet.has(input.dataset.course);
  });
}

document.getElementById("addCriteriaBtn").addEventListener("click", () => {
  const saved = captureCriteriaFormState();
  const nextOrden = draftConsignas.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0) + 1;
  draftConsignas.push(blankConsigna(nextOrden));
  sortConsignasByOrder(draftConsignas);
  renderCriteriaEditor();
  restoreCriteriaFormState(saved);
});

// Deja los filtros apuntando a la evaluacion recien creada/editada.
function focusEvaluationInFilters(materiaNombre, evaluacionNombre, courses) {
  refreshFilters();
  if (courses.length && !courses.includes(courseFilter.value)) {
    courseFilter.value = courses[0];
    refreshFilters();
  }
  if ([...subjectFilter.options].some(option => option.value === materiaNombre)) {
    subjectFilter.value = materiaNombre;
    refreshFilters();
  }
  if (periodFilter && !periodLabel.hidden && selectedPeriod()) {
    periodFilter.value = ALL_PERIODS;
    refreshFilters();
  }
  if ([...evaluationFilter.options].some(option => option.value === evaluacionNombre)) {
    evaluationFilter.value = evaluacionNombre;
    syncConsignasFromSelection();
  }
}

document.getElementById("applyCriteriaBtn").addEventListener("click", () => {
  if (!isAdmin) {
    showNotice("Solo administradores pueden aplicar cambios en consignas.");
    return;
  }
  if (!draftConsignas.some(c => c.active)) {
    showNotice("Debe quedar al menos una consigna visible.");
    return;
  }
  if (!validCriteriaConfig(draftConsignas)) {
    showNotice("Revisa las consignas: cada una debe tener nombre, orden, puntaje maximo e incremento validos.");
    return;
  }
  sortConsignasByOrder(draftConsignas);
  const result = upsertMapRowsFromCriteria();
  if (!result) return;
  focusEvaluationInFilters(result.materiaNombre, result.evaluacionNombre, result.courses);
  backfillScoreKeys();
  renderHeader();
  renderBody();
  criteriaModal.hidden = true;
  saveStatus.textContent = "Mapas actualizados";
  if (scriptUrl()) {
    sheetsPost("upsertMapas", result.changedRows)
      .then(postResult => {
        saveStatus.textContent = `Mapas guardados en Sheets (${postResult?.rows || 0} filas actualizadas)`;
      })
      .catch(error => {
        saveStatus.textContent = "Mapas actualizados localmente";
        showNotice(`No se pudo guardar Mapas en Sheets: ${error.message}`);
      });
  }
});

// --- Fase 0: consola de diagnostico ---
// Desde DevTools: goethe.help()
window.goethe = {
  help() {
    console.log([
      "Diagnostico Goethe — comandos:",
      "  goethe.enableDebug()   prende los logs detallados (persiste, recarga)",
      "  goethe.disableDebug()  apaga los logs",
      "  goethe.status()        muestra config, login y datos en memoria",
      "  goethe.testUrl('alumnos')  imprime la URL /exec exacta para pegar en el navegador",
      "  goethe.ping('alumnos')     hace el GET real y muestra la respuesta",
      "  acciones validas: alumnos | mapas | cargas | admins"
    ].join("\n"));
  },
  enableDebug() {
    debugEnabled = true;
    try { localStorage.setItem(debugStorageKey, "1"); } catch {}
    console.log("[goethe] debug ON");
  },
  disableDebug() {
    debugEnabled = false;
    try { localStorage.removeItem(debugStorageKey); } catch {}
    console.log("[goethe] debug OFF");
  },
  status() {
    const info = {
      version: APP_VERSION,
      scriptUrl: scriptUrl() || "(sin configurar)",
      googleClientId: googleClientId() || "(sin configurar)",
      logueado: Boolean(googleIdToken),
      docenteEmail: docenteEmail || "(sin sesion)",
      esAdmin: isAdmin,
      embebidoEnIframe: window.self !== window.top,
      enMemoria: { alumnos: alumnos.length, mapas: mapas.length, cargas: cargas.length, admins: admins.length }
    };
    console.table ? console.table(info) : console.log(info);
    return info;
  },
  testUrl(action = "alumnos") {
    const base = scriptUrl();
    if (!base) { console.warn("Falta scriptUrl"); return ""; }
    const url = new URL(base);
    url.searchParams.set("action", action);
    url.searchParams.set("idToken", googleIdToken || "");
    url.searchParams.set("t", Date.now());
    url.searchParams.set("callback", "console.log");
    const full = url.toString();
    console.log("Pega esta URL en una pestaña nueva. Esperado: console.log({ok:true,...}). Si ves HTML/login → deployment mal configurado.\n", full);
    return full;
  },
  ping(action = "alumnos") {
    console.log(`[goethe] ping ${action}…`);
    return sheetsGet(action)
      .then(data => { console.log(`[goethe] ${action} OK:`, Array.isArray(data) ? `${data.length} filas` : data, data); return data; })
      .catch(error => { console.error(`[goethe] ${action} FALLO:`, error.message); throw error; });
  }
};

// Sello de version SIEMPRE visible en consola (independiente del debug):
// permite verificar de un vistazo que el navegador/iframe no este sirviendo
// una version cacheada tras un deploy.
console.info(`[goethe] Mapa de Aprendizajes v${APP_VERSION}`);

refreshConfigVisibility();
refreshAdminState();
if (window.self !== window.top) {
  setLoginMessage("La app esta embebida en otra plataforma. Si Google no muestra el selector de cuentas, abri el Mapa en una pestaña nueva.", "warning");
} else {
  setLoginMessage("Usa una cuenta @goethe.edu.ar. Si el selector de Google no aparece, revisa que el navegador permita ventanas emergentes y cookies.");
}

// Identificacion visual del entorno de pruebas (carpeta /dev/ o localhost).
const IS_DEV_ENV = /\/dev\/|-dev\//.test(window.location.pathname) ||
  ["localhost", "127.0.0.1"].includes(window.location.hostname);
if (IS_DEV_ENV) {
  document.title = `[DEV] ${document.title}`;
  const badge = document.createElement("div");
  badge.className = "dev-badge";
  badge.textContent = "ENTORNO DE PRUEBAS";
  document.body.appendChild(badge);
}

if (scriptUrl() && googleClientId()) {
  alumnos = [];
  mapas = [];
  if (restoreStoredSession()) {
    saveStatus.textContent = `Sesion: ${docenteEmail}`;
    refreshAdminState();
    loginGate.hidden = true;
    syncFromSheets({ showLoading: true });
  } else {
    saveStatus.textContent = "Esperando login";
    prepareGoogleButton();
  }
} else {
  alumnos = demoAlumnos;
  mapas = demoMapas;
  refreshFilters({ keepSelection: false });
  renderHeader();
  renderBody();
}
