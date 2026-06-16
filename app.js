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
let isAdmin = false;
const APP_CONFIG = {
  scriptUrl: "https://script.google.com/macros/s/AKfycbxrwC0TARz15BwQqwGVzJEqs_ZnLlBy4Q681fim94px4NlrgTVNgHMzkJw9bS3DUkUi/exec",
  googleClientId: "225474160522-7rk742a5qubfaf0te9uqiokfr4umj7al.apps.googleusercontent.com"
};
const storagePrefix = "goethe-mapa-aprendizajes";
const scriptUrlStorageKey = `${storagePrefix}||apps-script-url`;
const googleClientIdStorageKey = `${storagePrefix}||google-client-id`;

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

function activeConsignas() {
  return consignas.filter(c => c.active);
}

function totalMaximo() {
  return activeConsignas().reduce((sum, item) => sum + item.max, 0);
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
      scores[consigna.scoreKey] = 0;
    });
    return {
      id: alumno.DNI,
      dni: alumno.DNI,
      nombre: alumnoNombre(alumno),
      email: alumno.eMail,
      scores,
      material: "No",
      pudoResolver: "Si",
      observacion: ""
    };
  });
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
  const titleRow = visible.map(c => `
    <th class="criteria-title" title="${escapeHTML(c.titulo)}">
      <span class="criteria-code">${escapeHTML(c.consignaId || c.id)}</span>
      <span class="criteria-name">${escapeHTML(c.titulo)}</span>
    </th>
  `).join("");
  thead.innerHTML = `
    <tr>
      <th class="sticky-col" rowspan="2">Nr.</th>
      <th class="student-col student-head">
        <span>Alumno</span>
        <small>Valor máximo</small>
      </th>
      ${titleRow}
      <th rowspan="2">Puntaje</th>
      <th rowspan="2">Calificacion</th>
      <th rowspan="2">Material</th>
      <th rowspan="2">Resolvio</th>
      <th rowspan="2">Observaciones</th>
    </tr>
    <tr>
      <th class="student-col max-label">Referencia</th>
      ${maxRow}
    </tr>
  `;
}

function scoreIsValid(value, consigna) {
  if (value === "") return true;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > consigna.max) return false;
  return Math.abs(number / consigna.step - Math.round(number / consigna.step)) < 0.001;
}

function studentTotals(alumno) {
  let alertas = 0;
  const scores = activeConsignas().map((consigna) => {
    const value = alumno.scores[consigna.scoreKey] ?? "";
    const valid = scoreIsValid(value, consigna);
    if (!valid) alertas += 1;
    return valid && value !== "" ? Number(value) : 0;
  });
  const completo = activeConsignas().every((consigna) => {
    const value = alumno.scores[consigna.scoreKey] ?? "";
    return value !== "" && scoreIsValid(value, consigna);
  });
  const puntaje = scores.reduce((sum, value) => sum + value, 0);
  const maximo = totalMaximo();
  const porcentaje = maximo ? Math.round((puntaje / maximo) * 1000) / 10 : 0;
  return { puntaje, porcentaje, completo, alertas };
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
      ${activeConsignas().map((c) => {
        const value = alumno.scores[c.scoreKey] ?? "";
        const invalid = !scoreIsValid(value, c);
        return `<td class="score-cell ${invalid ? "invalid" : ""}">
          <input type="number" min="0" max="${c.max}" step="${c.step}" value="${value}" data-id="${alumno.id}" data-score="${c.scoreKey}" title="${c.titulo}">
        </td>`;
      }).join("")}
      <td class="calculated">${totals.puntaje.toFixed(1)}</td>
      <td class="calculated">${totals.porcentaje.toFixed(1)}%</td>
      <td><select data-id="${alumno.id}" data-field="material"><option${alumno.material === "No" ? " selected" : ""}>No</option><option${alumno.material === "Si" ? " selected" : ""}>Si</option></select></td>
      <td><select data-id="${alumno.id}" data-field="pudoResolver"><option${alumno.pudoResolver === "Si" ? " selected" : ""}>Si</option><option${alumno.pudoResolver === "No" ? " selected" : ""}>No</option></select></td>
      <td class="observations"><input type="text" value="${alumno.observacion}" data-id="${alumno.id}" data-field="observacion"></td>
    `;
    tbody.appendChild(tr);
  });
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
  document.getElementById("gridSubtitle").textContent = `${subjectFilter.value || "Sin materia"} - ${evaluationFilter.value || "Sin evaluacion"}`;
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
  const stickyWidth = 52 + 260;
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
  const data = [];

  currentRows().forEach(alumno => {
    activeConsignas().forEach(consigna => {
      const puntaje = alumno.scores[consigna.scoreKey] ?? "";
      if (Number(puntaje) === 0) return;
      data.push({
        CargaID: `${evaluacionId}-${alumno.dni}-${consigna.consignaId}`,
        EvaluacionID: evaluacionId,
        ConsignaID: consigna.consignaId,
        DNI: alumno.dni,
        Curso: curso,
        DocenteEmail: docenteEmail,
        Puntaje: puntaje,
        UsoMaterial: alumno.material,
        PudoResolver: alumno.pudoResolver,
        Observacion: alumno.observacion,
        EstadoCarga: estado,
        FechaGuardado: fecha,
        FechaCierre: estado === "cerrado" ? fecha : ""
      });
    });
  });

  return data;
}

function applyCargaRows(rows) {
  const byDni = new Map(currentRows().map(alumno => [String(alumno.dni), alumno]));
  const byConsigna = new Map(consignas.map(consigna => [String(consigna.consignaId), consigna]));
  let applied = 0;

  rows.forEach(row => {
    const alumno = byDni.get(String(row.DNI || row.dni));
    const consigna = byConsigna.get(String(row.ConsignaID || row.consignaid));
    if (!alumno || !consigna) return;

    const puntaje = row.Puntaje ?? row.puntaje ?? "";
    alumno.scores[consigna.scoreKey] = puntaje === "" ? "" : Number(String(puntaje).replace(",", "."));
    alumno.material = row.UsoMaterial || row.usomaterial || alumno.material;
    alumno.pudoResolver = row.PudoResolver || row.pudoresolver || alumno.pudoResolver;
    alumno.observacion = row.Observacion || row.observacion || alumno.observacion;
    applied += 1;
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

function applyImportedCargas(rows) {
  const mapped = normalizeCargaRows(rows).filter(row => row.DNI && row.ConsignaID);

  const currentEvaluation = currentEvaluationId();
  const filtered = mapped.filter(row =>
    (!row.Curso || row.Curso === courseFilter.value) &&
    (!row.EvaluacionID || row.EvaluacionID === currentEvaluation || row.EvaluacionID === evaluationFilter.value)
  );
  const applied = applyCargaRows(filtered);
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

async function sheetsGet(action) {
  const url = requireScriptUrl();
  if (!url) return null;
  if (!requireGoogleLogin()) return null;
  const payload = await jsonpRequest(url, { action, idToken: googleIdToken, t: Date.now() });
  if (!payload.ok) throw new Error(payload.error || "Respuesta invalida");
  return payload.data;
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

    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Tiempo de espera agotado al consultar Apps Script."));
    }, 20000);

    function cleanup() {
      window.clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = payload => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("No se pudo cargar Apps Script. Revisa la URL /exec y el despliegue."));
    };

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

function submitToAppsScript(url, payload) {
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

function handleGoogleCredential(credentialResponse) {
  googleLoginInProgress = false;
  googleIdToken = credentialResponse.credential;
  const payload = decodeJwtPayload(googleIdToken);
  docenteEmail = payload.email || "";
  saveStatus.textContent = docenteEmail ? `Sesion: ${docenteEmail}` : "Sesion Google iniciada";
  refreshAdminState();
  loginGate.hidden = true;
  syncFromSheets();
}

function ensureGoogleIdentityInitialized() {
  const clientId = googleClientId();
  if (!clientId) {
    alert("Primero carga el Google Client ID en Conectar Sheets.");
    connectionModal.hidden = false;
    return false;
  }

  if (!window.google?.accounts?.id) {
    alert("Google Identity Services todavia no cargo. Espera unos segundos y proba de nuevo.");
    return false;
  }

  if (googleInitializedClientId === clientId) return true;

  google.accounts.id.initialize({
    client_id: clientId,
    callback: handleGoogleCredential
  });
  googleInitializedClientId = clientId;
  return true;
}

function startGoogleLogin() {
  if (googleIdToken) {
    loginGate.hidden = true;
    syncFromSheets();
    return;
  }

  if (googleLoginInProgress) return;
  if (!ensureGoogleIdentityInitialized()) return;

  googleLoginInProgress = true;
  google.accounts.id.prompt();
  window.setTimeout(() => {
    googleLoginInProgress = false;
  }, 3000);
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

async function syncFromSheets() {
  saveStatus.textContent = "Sincronizando Sheets...";
  try {
    const [remoteAlumnos, remoteMapas, remoteCargas] = await Promise.all([
      sheetsGet("alumnos"),
      sheetsGet("mapas"),
      sheetsGet("cargas")
    ]);
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
  } catch (error) {
    saveStatus.textContent = "Error al sincronizar Sheets";
    alert(`No se pudo sincronizar: ${error.message}`);
  }
}

function exportCargas() {
  const { curso, materia, evaluacion } = selectedContext();
  const headers = ["CargaID", "EvaluacionID", "ConsignaID", "DNI", "Curso", "DocenteEmail", "Puntaje", "UsoMaterial", "PudoResolver", "Observacion", "EstadoCarga", "FechaGuardado", "FechaCierre"];
  const data = buildCargaRows("borrador").map(row => headers.map(header => row[header]));

  const csv = [headers, ...data].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cargas_${curso}_${materia}_${evaluacion}.csv`.replace(/\s+/g, "_");
  link.click();
  URL.revokeObjectURL(url);
}

function exportMapas() {
  const headers = ["MapaID", "MateriaID", "MateriaNombre", "EvaluacionID", "EvaluacionNombre", "Nivel", "Curso", "AnioLectivo", "ConsignaID", "ConsignaContenido", "ConsignaPuntajeMax", "ConsignaIncremento", "ConsignaOrden", "ConsignaActiva", "FechaCaducidad"];
  const rows = mapas.map(row => headers.map(header => row[header] ?? ""));
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
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
    alumno.scores[scoreKey] = target.value === "" ? "" : Number(target.value);
    saveStatus.textContent = "Cambios sin guardar";
    renderBody();
    const next = table.querySelector(`[data-id="${id}"][data-score="${scoreKey}"]`);
    if (next) focusGridControl(next);
  } else if (target.dataset.field) {
    alumno[target.dataset.field] = target.value;
    saveStatus.textContent = "Cambios sin guardar";
  }
});

table.addEventListener("change", event => {
  const target = event.target;
  const id = target.dataset.id;
  if (!id || !target.dataset.field) return;
  findStudent(id)[target.dataset.field] = target.value;
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
  saveLocalDraft();
  const rows = buildCargaRows("borrador");
  if (!rows.length) {
    showSaveModal("Sin cambios para guardar", "No hay puntajes mayores a 0 para enviar a Sheets.", "Sin registros", true);
    return;
  }
  showSaveModal("Guardando borrador", `Enviando ${rows.length} registros con puntaje mayor a 0.`, "Enviando...");
  saveStatus.textContent = `Enviando borrador a Sheets (${rows.length} filas)...`;
  sheetsPost("saveCargas", rows)
    .then(result => {
      showSaveModal("Confirmando guardado", `Verificando ${result?.rows || 0} registros en la solapa Cargas.`, "Confirmando...");
      saveStatus.textContent = `Confirmando guardado (${result?.rows || 0} filas)...`;
      return confirmSavedCargas(rows);
    })
    .then(check => {
      if (!check.missing.length) {
        showSaveModal("Guardado confirmado", `${check.confirmed}/${check.expected} registros quedaron guardados en Sheets.`, "Listo", true);
        saveStatus.textContent = `Guardado confirmado (${check.confirmed}/${check.expected} filas)`;
      } else {
        showSaveModal("Guardado parcial", `${check.confirmed}/${check.expected} registros confirmados. Faltan ${check.missing.length}.`, "Revisar", true);
        saveStatus.textContent = `Guardado parcial (${check.confirmed}/${check.expected} filas)`;
      }
    })
    .catch(error => {
      showSaveModal("No se pudo confirmar", error.message, "Error", true);
      saveStatus.textContent = "Error al guardar";
    });
});

document.getElementById("exportBtn").addEventListener("click", exportCargas);
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
document.getElementById("gateLoginBtn").addEventListener("click", startGoogleLogin);
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

refreshConfigVisibility();
refreshAdminState();

if (scriptUrl() && googleClientId()) {
  alumnos = [];
  mapas = [];
  saveStatus.textContent = "Esperando login";
} else {
  alumnos = demoAlumnos;
  mapas = demoMapas;
  refreshFilters({ keepSelection: false });
  renderHeader();
  renderBody();
}
