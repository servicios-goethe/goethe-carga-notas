const demoAlumnos = [
  { Nombres: "Franco", Apellido: "ARCHERI", DNI: "A001", Curso: "EP2A", eMail: "" },
  { Nombres: "Rafael", Apellido: "BARALDO", DNI: "A002", Curso: "EP2A", eMail: "" },
  { Nombres: "Francisca", Apellido: "BATTISTON", DNI: "A003", Curso: "EP2A", eMail: "" },
  { Nombres: "Lena", Apellido: "BOERR", DNI: "A004", Curso: "EP2A", eMail: "" },
  { Nombres: "Ana Katarina", Apellido: "BULE", DNI: "A005", Curso: "EP2A", eMail: "" },
  { Nombres: "Felipe Andres", Apellido: "AGRES", DNI: "B001", Curso: "EP2B", eMail: "" },
  { Nombres: "Manuel", Apellido: "AGUIRRE", DNI: "B002", Curso: "EP2B", eMail: "" },
  { Nombres: "Valentin", Apellido: "BUCK", DNI: "B003", Curso: "EP2B", eMail: "" }
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
  MapaID, MateriaID, MateriaNombre, EvaluacionID, EvaluacionNombre, Curso, AnioLectivo, ConsignaID, ConsignaContenido, ConsignaPuntajeMax, ConsignaIncremento, ConsignaOrden, ConsignaActiva, FechaCaducidad: ""
}));

let alumnos = [];
let mapas = [];
let consignas = [];
let state = {};
const storagePrefix = "goethe-mapa-aprendizajes";

const table = document.getElementById("gradeTable");
const courseFilter = document.getElementById("courseFilter");
const subjectFilter = document.getElementById("subjectFilter");
const evaluationFilter = document.getElementById("evaluationFilter");
const searchInput = document.getElementById("searchInput");
const showIncomplete = document.getElementById("showIncomplete");
const criteriaModal = document.getElementById("criteriaModal");
const criteriaList = document.getElementById("criteriaList");
const tableWrap = document.querySelector(".table-wrap");
const saveStatus = document.getElementById("saveStatus");

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

function selectedContext() {
  return {
    curso: courseFilter.value,
    materia: subjectFilter.value,
    evaluacion: evaluationFilter.value
  };
}

function rowAppliesToCourse(row, curso) {
  return !row.Curso || row.Curso === "*" || row.Curso === curso;
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

function cursosDisponibles() {
  return unique(alumnos.map(alumno => alumno.Curso));
}

function ensureGridState() {
  const key = stateKey();
  if (state[key]) return;

  state[key] = alumnosDelCurso().map((alumno, index) => {
    const scores = {};
    consignas.forEach((consigna, scoreIndex) => {
      const base = consigna.max - ((index + scoreIndex) % 5 === 0 ? consigna.step : 0);
      scores[consigna.scoreKey] = Math.max(0, base);
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
  select.innerHTML = values.map(value => `<option value="${value}">${value}</option>`).join("");
  if (selectedValue && values.includes(selectedValue)) select.value = selectedValue;
}

function refreshFilters({ keepSelection = true } = {}) {
  const previous = selectedContext();
  const cursos = cursosDisponibles();
  populateSelect(courseFilter, cursos, keepSelection ? previous.curso : "");

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
  const maxRow = visible.map(c => `<th>${c.max}</th>`).join("");
  const titleRow = visible.map(c => `<th title="${c.titulo}">${c.id}</th>`).join("");
  thead.innerHTML = `
    <tr>
      <th class="sticky-col" rowspan="2">Nr.</th>
      <th class="student-col" rowspan="2">Alumno</th>
      ${titleRow}
      <th rowspan="2">Puntaje</th>
      <th rowspan="2">Calificacion</th>
      <th rowspan="2">Material</th>
      <th rowspan="2">Resolvio</th>
      <th rowspan="2">Observaciones</th>
    </tr>
    <tr>${maxRow}</tr>
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
  const courses = cursosDisponibles();
  const expiration = evaluationRows.find(row => row.FechaCaducidad)?.FechaCaducidad || "";

  criteriaList.innerHTML = `
    <div class="criteria-config">
      <label>
        Aplicar a cursos
        <div class="course-checks">
          ${courses.map(course => `
            <span><input type="checkbox" data-course="${course}" ${selectedCourses.includes("*") || selectedCourses.includes(course) || (!selectedCourses.length && course === curso) ? "checked" : ""}> ${course}</span>
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
    return false;
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

  selectedCourses.forEach(course => {
    consignas.forEach((consigna, index) => {
      mapas.push({
        MapaID: mapaId,
        MateriaID: materiaId,
        MateriaNombre: materiaNombre,
        EvaluacionID: evaluacionId,
        EvaluacionNombre: evaluacionNombre,
        Curso: course,
        AnioLectivo: anioLectivo,
        ConsignaID: consigna.consignaId || String(consigna.scoreKey),
        ConsignaContenido: consigna.titulo,
        ConsignaPuntajeMax: String(consigna.max),
        ConsignaIncremento: String(consigna.step),
        ConsignaOrden: String(index + 1),
        ConsignaActiva: consigna.active ? "TRUE" : "FALSE",
        FechaCaducidad: expiration
      });
    });
  });

  return true;
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
      data.push({
        CargaID: `${evaluacionId}-${alumno.dni}-${consigna.consignaId}`,
        EvaluacionID: evaluacionId,
        ConsignaID: consigna.consignaId,
        DNI: alumno.dni,
        Curso: curso,
        DocenteEmail: "",
        Puntaje: alumno.scores[consigna.scoreKey] ?? "",
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
  const mapped = rows.map(row => ({
    EvaluacionID: row.evaluacionid,
    ConsignaID: row.consignaid,
    DNI: row.dni,
    Curso: row.curso,
    Puntaje: row.puntaje,
    UsoMaterial: row.usomaterial,
    PudoResolver: row.pudoresolver,
    Observacion: row.observacion
  })).filter(row => row.DNI && row.ConsignaID);

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
  const headers = ["MapaID", "MateriaID", "MateriaNombre", "EvaluacionID", "EvaluacionNombre", "Curso", "AnioLectivo", "ConsignaID", "ConsignaContenido", "ConsignaPuntajeMax", "ConsignaIncremento", "ConsignaOrden", "ConsignaActiva", "FechaCaducidad"];
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
  const now = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  saveLocalDraft();
  saveStatus.textContent = `Borrador guardado ${now}`;
});

document.getElementById("exportBtn").addEventListener("click", exportCargas);
document.getElementById("exportMapsBtn").addEventListener("click", exportMapas);

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
  if (event.target.type === "checkbox") {
    const index = Number(event.target.dataset.criteria);
    consignas[index].active = event.target.checked;
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
  if (!activeConsignas().length) {
    alert("Debe quedar al menos una consigna visible.");
    return;
  }
  if (!validCriteriaConfig()) {
    alert("Revisa las consignas: cada una debe tener nombre, orden, puntaje maximo e incremento validos.");
    return;
  }
  normalizeConsignas();
  if (!upsertMapRowsFromCriteria()) return;
  refreshFilters();
  renderHeader();
  renderBody();
  criteriaModal.hidden = true;
  saveStatus.textContent = "Mapas actualizados";
});

alumnos = demoAlumnos;
mapas = demoMapas;
refreshFilters({ keepSelection: false });
renderHeader();
renderBody();
