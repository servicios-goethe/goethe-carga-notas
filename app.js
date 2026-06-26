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
  MapaID, MateriaID, MateriaNombre, EvaluacionID, EvaluacionNombre, Nivel: "EP", Curso, AnioLectivo, ConsignaID, ConsignaContenido, ConsignaPuntajeMax, ConsignaIncremento, ConsignaOrden, ConsignaActiva, FechaCaducidad: ""
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
    active: !["false", "0", "no", "n"].includes(normalizeText(row.consignaactiva).toLowerCase())
  };
}

function syncConsignasFromSelection() {
  const { curso, materia, evaluacion } = selectedContext();
  const rows = mapas
    .filter(row => rowAppliesToCourse(row, curso) && rowIsActiveByDate(row) && row.MateriaNombre === materia && row.EvaluacionNombre === evaluacion)
    .sort((a, b) => Number(a.ConsignaOrden) - Number(b.ConsignaOrden));

  consignas = rows.map((row, index) => mapRowToConsigna({
    consignaorden: row.ConsignaOrden,
    consignaid: row.ConsignaID,
    consignacontenido: row.ConsignaContenido,
    consignapuntajemax: row.ConsignaPuntajeMax,
    consignaincremento: row.ConsignaIncremento,
    consignaactiva: row.ConsignaActiva
  }, index));
}

function validCriteriaConfig() {
  return consignas.every(c =>
    Number.isFinite(c.id) &&
    Number.isFinite(c.max) &&
    Number.isFinite(c.step) &&
    c.id >= 1 &&
    c.max > 0 &&
    c.step > 0 &&
    c.titulo.trim()
  );
}

function alumnoNombre(alumno) {
  return `${alumno.Apellido}, ${alumno.Nombres}`.replace(/^,\s*/, "").trim();
}

function alumnosDelCurso() {
  return alumnos.filter(alumno => alumno.Curso === courseFilter.value);
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

  const evaluaciones = unique(mapas
    .filter(row => rowAppliesToCourse(row, courseFilter.value) && rowIsActiveByDate(row) && row.MateriaNombre === subjectFilter.value)
    .map(row => row.EvaluacionNombre));
  populateSelect(evaluationFilter, evaluaciones, keepSelection ? previous.evaluacion : "");

  syncConsignasFromSelection();
}

function renderHeader() {
  const thead = table.querySelector("thead");
  const visible = activeConsignas();
  const maxRow = visible.map(c => `<th class="criteria-max">${escapeHTML(c.max)}</th>`).join("");
  const emptySummaryRow = Array.from({ length: 3 }, () => `<th class="header-empty"></th>`).join("");
  const titleRow = visible.map(c => `
    <th class="criteria-title" title="${escapeHTML(c.titulo)}">
      <span class="criteria-name">${escapeHTML(c.titulo)}</span>
    </th>
  `).join("");
  thead.innerHTML = `
    <tr>
      <th class="sticky-col">Nr.</th>
      <th class="student-col student-head">Nombre</th>
      <th>Alumno</th>
      ${titleRow}
      <th>Puntaje</th>
      <th>Calificacion</th>
      <th>Observaciones</th>
    </tr>
    <tr>
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
  const scores = activeConsignas().map((consigna) => {
    const value = alumno.scores[consigna.scoreKey] ?? "";
    const number = parseScoreValue(value);
    const valid = scoreIsValid(value, consigna, alumno);
    if (!valid) alertas += 1;
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
  const closed = currentLoadIsClosed();
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
        const max = isInclusion(alumno) ? 9 : c.max;
        const disabled = isAbsent(alumno) || closed ? " disabled" : "";
        const cellState = scoreCellState(alumno, c);
        return `<td class="score-cell ${cellState}">
          <input type="number" inputmode="decimal" min="0" max="${max}" step="${c.step}" value="${value}" data-id="${alumno.id}" data-score="${c.scoreKey}" title="${c.titulo}"${disabled}>
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
    const max = isInclusion(alumno) ? 9 : consigna.max;
    input.max = String(max);
    input.disabled = isAbsent(alumno) || currentLoadIsClosed();
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
  document.getElementById("gridSubtitle").textContent = `${subjectFilter.value || "Sin materia"} - ${evaluationFilter.value || "Sin evaluacion"}${closed ? " - carga finalizada" : ""}`;
}

function currentRows() {
  ensureGridState();
  return state[stateKey()] || [];
}

function renderCriteriaEditor() {
  const { curso } = selectedContext();
  const evaluationRows = mapas.filter(row =>
    row.MateriaNombre === subjectFilter.value &&
    row.EvaluacionNombre === evaluationFilter.value &&
    row.EvaluacionID === currentEvaluationId()
  );
  const selectedCourses = unique(evaluationRows.map(row => row.Curso).filter(Boolean));
  const groupedCourses = cursosPorNivel();
  const expiration = evaluationRows.find(row => row.FechaCaducidad)?.FechaCaducidad || "";

  criteriaList.innerHTML = `
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
    </div>
    ${consignas.map((c, index) => `
    <div class="criteria-row">
      <label>
        Visible
        <span class="active-field"><input type="checkbox" ${c.active ? "checked" : ""} data-criteria="${index}" data-field="active"> Consigna ${c.id}</span>
      </label>
      <label>
        Contenido
        <input type="text" value="${c.titulo}" data-criteria="${index}" data-field="titulo">
      </label>
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
    </div>
  `).join("")}
  `;
}

function selectedCriteriaCourses() {
  return [...criteriaList.querySelectorAll("[data-course]:checked")].map(input => input.dataset.course);
}

function upsertMapRowsFromCriteria() {
  const selectedCourses = selectedCriteriaCourses();
  if (!selectedCourses.length) {
    alert("Selecciona al menos un curso.");
    return null;
  }

  const expiration = document.getElementById("criteriaExpiration")?.value || "";
  const baseRows = mapas.filter(row =>
    row.MateriaNombre === subjectFilter.value &&
    row.EvaluacionNombre === evaluationFilter.value &&
    row.EvaluacionID === currentEvaluationId()
  );
  const base = baseRows[0] || {};
  const materiaNombre = subjectFilter.value;
  const evaluacionNombre = evaluationFilter.value;
  const materiaId = base.MateriaID || materiaNombre.toUpperCase().slice(0, 3);
  const evaluacionId = base.EvaluacionID || evaluacionNombre.toUpperCase().replace(/\s+/g, "-");
  const mapaId = base.MapaID || `MAP-${evaluacionId}`;
  const anioLectivo = base.AnioLectivo || String(new Date().getFullYear());

  const targetCourseSet = new Set(selectedCourses);
  mapas = mapas.filter(row => !(
    row.MateriaNombre === materiaNombre &&
    row.EvaluacionNombre === evaluacionNombre &&
    row.EvaluacionID === evaluacionId &&
    targetCourseSet.has(row.Curso)
  ));

  const changedRows = [];

  selectedCourses.forEach(course => {
    consignas.forEach((consigna, index) => {
      const row = {
        MapaID: mapaId,
        MateriaID: materiaId,
        MateriaNombre: materiaNombre,
        EvaluacionID: evaluacionId,
        EvaluacionNombre: evaluacionNombre,
        Nivel: nivelFromCurso(course),
        Curso: course,
        AnioLectivo: anioLectivo,
        ConsignaID: consigna.consignaId || String(consigna.scoreKey),
        ConsignaContenido: consigna.titulo,
        ConsignaPuntajeMax: String(consigna.max),
        ConsignaIncremento: String(consigna.step),
        ConsignaOrden: String(index + 1),
        ConsignaActiva: consigna.active ? "TRUE" : "FALSE",
        FechaCaducidad: expiration
      };
      mapas.push(row);
      changedRows.push(row);
    });
  });

  return changedRows;
}

function normalizeConsignas() {
  consignas = consignas.sort((a, b) => a.id - b.id);
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
    alert(`Hay DNI duplicados: ${unique(duplicates).join(", ")}`);
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
    FechaCaducidad: row.fechacaducidad || row.caducidad || ""
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
      const parsedPuntaje = parseScoreValue(puntaje);
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
      } else {
        showSaveModal("Guardado parcial", `${check.confirmed}/${check.expected} registros confirmados. Faltan ${check.missing.length}.`, "Revisar", true);
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
    alumno.scores[consigna.scoreKey] = puntaje === "" ? "" : String(puntaje).replace(",", ".");
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

function requireGoogleLogin() {
  if (googleIdToken) return true;
  alert("Primero inicia sesion con Google.");
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

function requireScriptUrl() {
  const url = scriptUrl();
  if (!url) {
    alert("Primero pega y guarda la URL de Apps Script.");
    connectionModal.hidden = false;
    return "";
  }
  return url;
}

async function sheetsGet(action, { attempts = 2 } = {}) {
  const url = requireScriptUrl();
  if (!url) return null;
  if (!requireGoogleLogin()) return null;
  // Reintento ante timeout: Apps Script tarda mucho en el arranque en frio.
  // El primer intento "despierta" la instancia; el segundo ya corre caliente.
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const payload = await jsonpRequest(url, { action, idToken: googleIdToken, t: Date.now() });
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

async function confirmSavedCargas(expectedRows) {
  await wait(1800);
  const remoteRows = normalizeCargaRows(await sheetsGet("cargas"));
  const remoteIds = new Set(remoteRows.map(row => row.CargaID).filter(Boolean));
  const expectedIds = expectedRows.map(row => row.CargaID);
  const missing = expectedIds.filter(id => !remoteIds.has(id));

  return {
    expected: expectedIds.length,
    confirmed: expectedIds.length - missing.length,
    missing
  };
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
  googleIdToken = credentialResponse.credential;
  const payload = decodeJwtPayload(googleIdToken);
  docenteEmail = payload.email || "";
  debugLog("Login OK |", docenteEmail || "(sin email)", "| aud:", payload.aud, "| hd:", payload.hd, "| token:", maskToken(googleIdToken));
  saveStatus.textContent = docenteEmail ? `Sesion: ${docenteEmail}` : "Sesion Google iniciada";
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

  google.accounts.id.initialize({
    client_id: clientId,
    auto_select: false,
    use_fedcm_for_prompt: false,
    use_fedcm_for_button: false,
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

function prepareGoogleButton(attempt = 0) {
  if (!scriptUrl() || !googleClientId() || googleIdToken) return;
  if (renderGoogleButton()) {
    setLoginMessage("Usa el boton oficial de Google para ingresar con tu cuenta @goethe.edu.ar.");
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

async function syncFromSheets({ showLoading = false } = {}) {
  if (showLoading) {
    showSaveModal("Cargando", "Sincronizando alumnos, mapas, cargas y permisos con Google Sheets. La primera carga puede tardar hasta un minuto.", "Sincronizando...");
  }
  saveStatus.textContent = "Sincronizando Sheets...";
  try {
    // En serie a proposito: Apps Script serializa las ejecuciones concurrentes
    // del mismo usuario, asi que disparar varias en paralelo (Promise.all) hace
    // que las ultimas esperen en cola y superen el timeout del cliente.
    const remoteAlumnos = await sheetsGet("alumnos");
    const remoteMapas = await sheetsGet("mapas");
    const remoteCargas = await sheetsGet("cargas");
    debugLog("Sync recibido | alumnos:", remoteAlumnos?.length ?? 0, "| mapas:", remoteMapas?.length ?? 0, "| cargas:", remoteCargas?.length ?? 0);
    applyImportedAlumnos(normalizeSheetRows(remoteAlumnos));
    applyImportedMapas(normalizeSheetRows(remoteMapas));
    applyImportedCargas(normalizeSheetRows(remoteCargas));
    try {
      const remoteAdmins = await sheetsGet("admins");
      applyImportedAdmins(remoteAdmins);
    } catch (adminError) {
      applyImportedAdmins([]);
      console.warn("No se pudo leer Admins:", adminError);
      saveStatus.textContent = "Sheets sincronizado - falta publicar Admins";
    }
    if (admins.length) saveStatus.textContent = "Sheets sincronizado";
    if (showLoading) closeSaveModal();
  } catch (error) {
    saveStatus.textContent = "Error al sincronizar Sheets";
    if (showLoading) {
      showSaveModal("No se pudo sincronizar", error.message, "Error", true);
    } else {
      alert(`No se pudo sincronizar: ${error.message}`);
    }
  }
}

function csvBlob(csv) {
  return new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
}

function exportCargas() {
  const { curso, materia, evaluacion } = selectedContext();
  const headers = ["CargaID", "EvaluacionID", "ConsignaID", "DNI", "Curso", "DocenteEmail", "Puntaje", "UsoMaterial", "PudoResolver", "Observacion", "EstadoCarga", "FechaGuardado", "FechaCierre", "EstadoAlumno"];
  const data = buildCargaRows("borrador").map(row => headers.map(header => row[header]));

  const csv = [headers, ...data].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = csvBlob(csv);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cargas_${curso}_${materia}_${evaluacion}.csv`.replace(/\s+/g, "_");
  link.click();
  URL.revokeObjectURL(url);
}

function exportVisibleGrid() {
  const { curso, materia, evaluacion } = selectedContext();
  const criteria = activeConsignas();
  const headers = ["Nr.", "Nombre", "Alumno", ...criteria.map(c => c.titulo), "Puntaje", "Calificacion", "Observaciones"];
  const maxRow = ["", "Valor maximo", "", ...criteria.map(c => c.max), "", "", ""];
  const rows = currentRows().map((alumno, index) => {
    const totals = studentTotals(alumno);
    return [
      index + 1,
      alumno.nombre,
      alumno.estadoAlumno || "Presente",
      ...criteria.map(c => alumno.scores[c.scoreKey] ?? ""),
      totals.puntaje.toFixed(1),
      `${totals.porcentaje.toFixed(1)}%`,
      alumno.observacion
    ];
  });
  const csv = [headers, maxRow, ...rows].map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = csvBlob(csv);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `grilla_${curso}_${materia}_${evaluacion}.csv`.replace(/\s+/g, "_");
  link.click();
  URL.revokeObjectURL(url);
}

function exportMapas() {
  const headers = ["MapaID", "MateriaID", "MateriaNombre", "EvaluacionID", "EvaluacionNombre", "Nivel", "Curso", "AnioLectivo", "ConsignaID", "ConsignaContenido", "ConsignaPuntajeMax", "ConsignaIncremento", "ConsignaOrden", "ConsignaActiva", "FechaCaducidad"];
  const rows = mapas.map(row => headers.map(header => row[header] ?? ""));
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = csvBlob(csv);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mapas_actualizados.csv";
  link.click();
  URL.revokeObjectURL(url);
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

[searchInput, showIncomplete].forEach(control => {
  control.addEventListener("input", renderBody);
});

document.getElementById("saveBtn").addEventListener("click", () => {
  if (!scriptUrl() || !googleIdToken) {
    alert("Para guardar, primero inicia sesion y conecta Google Sheets.");
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
    alert("Para finalizar, primero inicia sesion y conecta Google Sheets.");
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
    alert("Solo administradores pueden exportar mapas.");
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
    alert("Pega una URL valida de Apps Script.");
    return;
  }
  if (!clientId.endsWith(".apps.googleusercontent.com")) {
    alert("Pega un Google Client ID valido.");
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

document.getElementById("criteriaBtn").addEventListener("click", () => {
  if (!isAdmin) {
    alert("Solo administradores pueden editar consignas.");
    return;
  }
  renderCriteriaEditor();
  criteriaModal.hidden = false;
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
  if (!Number.isInteger(index) || !field) return;
  if (field === "active") consignas[index][field] = target.checked;
  else if (field === "titulo") consignas[index][field] = target.value;
  else consignas[index][field] = Number(target.value);
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
    if (Number.isInteger(index)) consignas[index].active = event.target.checked;
  }
});

document.getElementById("addCriteriaBtn").addEventListener("click", () => {
  consignas.push({
    id: consignas.length + 1,
    scoreKey: `NEW-${Date.now()}`,
    consignaId: `NEW-${Date.now()}`,
    titulo: "Nueva consigna",
    max: 1,
    step: 0.5,
    active: true
  });
  normalizeConsignas();
  renderCriteriaEditor();
});

document.getElementById("applyCriteriaBtn").addEventListener("click", () => {
  if (!isAdmin) {
    alert("Solo administradores pueden aplicar cambios en consignas.");
    return;
  }
  if (!activeConsignas().length) {
    alert("Debe quedar al menos una consigna visible.");
    return;
  }
  if (!validCriteriaConfig()) {
    alert("Revisa las consignas: cada una debe tener nombre, orden, puntaje maximo e incremento validos.");
    return;
  }
  normalizeConsignas();
  const changedMapRows = upsertMapRowsFromCriteria();
  if (!changedMapRows) return;
  refreshFilters();
  renderHeader();
  renderBody();
  criteriaModal.hidden = true;
  saveStatus.textContent = "Mapas actualizados";
  if (scriptUrl()) {
    sheetsPost("upsertMapas", changedMapRows)
      .then(result => {
        saveStatus.textContent = `Mapas guardados en Sheets (${result?.rows || 0} filas actualizadas)`;
      })
      .catch(error => {
        saveStatus.textContent = "Mapas actualizados localmente";
        alert(`No se pudo guardar Mapas en Sheets: ${error.message}`);
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

refreshConfigVisibility();
refreshAdminState();
if (window.self !== window.top) {
  setLoginMessage("La app esta embebida en otra plataforma. Si Google no muestra el selector de cuentas, abri el Mapa en una pestaña nueva.", "warning");
} else {
  setLoginMessage("Usa una cuenta @goethe.edu.ar. Si el selector de Google no aparece, revisa que el navegador permita ventanas emergentes y cookies.");
}

if (scriptUrl() && googleClientId()) {
  alumnos = [];
  mapas = [];
  saveStatus.textContent = "Esperando login";
  prepareGoogleButton();
} else {
  alumnos = demoAlumnos;
  mapas = demoMapas;
  refreshFilters({ keepSelection: false });
  renderHeader();
  renderBody();
}
