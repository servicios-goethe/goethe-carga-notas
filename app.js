let consignas = [
  { id: 1, scoreKey: 0, titulo: "Representación de números", max: 1, step: 0.5, active: true },
  { id: 2, scoreKey: 1, titulo: "Orden de la serie numérica", max: 2, step: 0.5, active: true },
  { id: 3, scoreKey: 2, titulo: "Recta numérica", max: 3, step: 0.5, active: true },
  { id: 4, scoreKey: 3, titulo: "Anterior y posterior", max: 2, step: 0.5, active: true },
  { id: 5, scoreKey: 4, titulo: "Sumas", max: 1.5, step: 0.5, active: true },
  { id: 6, scoreKey: 5, titulo: "Restas", max: 1.5, step: 0.5, active: true },
  { id: 7, scoreKey: 6, titulo: "Doble y mitad", max: 2, step: 0.5, active: true },
  { id: 8, scoreKey: 7, titulo: "Uso del dinero", max: 2, step: 0.5, active: true }
];

const alumnosPorCurso = {
  EP2A: [
    ["A001", "ARCHERI, Franco"], ["A002", "BARALDO, Rafael"], ["A003", "BATTISTON, Francisca"],
    ["A004", "BOERR, Lena"], ["A005", "BULE, Ana Katarina"], ["A006", "CORDOBA, Maite Lilou"],
    ["A007", "ECHEVERRIA PAPP, Maia"], ["A008", "FAISST, Joshua Sebastian"], ["A009", "GEBAUER, Josefina"],
    ["A010", "GONZALEZ BERNALDO DE QUIROS MIORI, Pedro"], ["A011", "IGARZABAL, Franco Josue"]
  ],
  EP2B: [
    ["B001", "AGRES, Felipe Andres"], ["B002", "AGUIRRE, Manuel"], ["B003", "BUCK, Valentin"],
    ["B004", "D' AMICO, Beltran"], ["B005", "DIETRICH, Vera"], ["B006", "FARONI, Catalina"],
    ["B007", "GALLENTI, Ella"], ["B008", "GOMEZ, Helena"], ["B009", "HOFFMANN, Chloe"],
    ["B010", "LEONHARDT, Adela"], ["B011", "MEINEL VON TANNENBERG, Benjamin"]
  ],
  EP2C: [
    ["C001", "Alford, Igor Daniel"], ["C002", "Almiron Schroeder, Pedro"], ["C003", "Andino Diaz, Fausto Francisco"],
    ["C004", "Balestrini, Lara"], ["C005", "Caffo, Joaquin"], ["C006", "Canuti Schimpf, Mirko Gabriel"],
    ["C007", "Destefano, Pedro"], ["C008", "Engstfeld, Apolo"], ["C009", "Estevez Rocca, Camila Ines"],
    ["C010", "Furnari, Julia"], ["C011", "Gimenez Casco, Delfina"]
  ]
};

let state = {};

const table = document.getElementById("gradeTable");
const courseFilter = document.getElementById("courseFilter");
const subjectFilter = document.getElementById("subjectFilter");
const evaluationFilter = document.getElementById("evaluationFilter");
const searchInput = document.getElementById("searchInput");
const showIncomplete = document.getElementById("showIncomplete");
const criteriaModal = document.getElementById("criteriaModal");
const criteriaList = document.getElementById("criteriaList");
const tableWrap = document.querySelector(".table-wrap");

function activeConsignas() {
  return consignas.filter(c => c.active);
}

function totalMaximo() {
  return activeConsignas().reduce((sum, item) => sum + item.max, 0);
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

function ensureCourseState(course) {
  if (state[course]) return;
  state[course] = alumnosPorCurso[course].map(([id, nombre], index) => ({
    id,
    nombre,
    scores: consignas.map((c, scoreIndex) => {
      if (index === 7 && course === "EP2A") return "";
      const base = c.max - ((index + scoreIndex) % 5 === 0 ? c.step : 0);
      return Math.max(0, base);
    }),
    material: index === 5 ? "Si" : "No",
    pudoResolver: index === 7 && course === "EP2A" ? "No" : "Si",
    observacion: index === 5 ? "Evaluacion con adecuacion" : ""
  }));
}

function renderHeader() {
  const thead = table.querySelector("thead");
  const visible = activeConsignas();
  const maxRow = visible.map(c => `<th>${c.max}</th>`).join("");
  const titleRow = visible.map(c => `<th>${c.id}</th>`).join("");
  thead.innerHTML = `
    <tr>
      <th class="sticky-col" rowspan="2">Nr.</th>
      <th class="student-col" rowspan="2">Alumno</th>
      ${titleRow}
      <th rowspan="2">Puntaje</th>
      <th rowspan="2">Calificación</th>
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
  const porcentaje = Math.round((puntaje / totalMaximo()) * 1000) / 10;
  return { puntaje, porcentaje, completo, alertas };
}

function renderBody() {
  const course = courseFilter.value;
  ensureCourseState(course);
  const query = searchInput.value.trim().toLowerCase();
  const tbody = table.querySelector("tbody");
  const onlyIncomplete = showIncomplete.checked;
  tbody.innerHTML = "";

  state[course].forEach((alumno, index) => {
    const totals = studentTotals(alumno);
    if (query && !alumno.nombre.toLowerCase().includes(query)) return;
    if (onlyIncomplete && totals.completo) return;

    const tr = document.createElement("tr");
    tr.className = `${totals.completo ? "complete" : "incomplete"} ${totals.alertas ? "has-alert" : ""}`;
    tr.innerHTML = `
      <td class="sticky-col row-number">${index + 1}</td>
      <td class="student-col student-name">${alumno.nombre}</td>
      ${activeConsignas().map((c) => {
        const scoreIndex = c.scoreKey;
        const value = alumno.scores[scoreIndex] ?? "";
        const invalid = !scoreIsValid(value, c);
        return `<td class="score-cell ${invalid ? "invalid" : ""}">
          <input type="number" min="0" max="${c.max}" step="${c.step}" value="${value}" data-id="${alumno.id}" data-score="${scoreIndex}" title="${c.titulo}">
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
  const alumnos = state[courseFilter.value] || [];
  const totals = alumnos.map(studentTotals);
  const completos = totals.filter(t => t.completo).length;
  const alertas = totals.reduce((sum, t) => sum + t.alertas, 0);
  const promedio = totals.length ? totals.reduce((sum, t) => sum + t.porcentaje, 0) / totals.length : 0;
  document.getElementById("studentCount").textContent = alumnos.length;
  document.getElementById("completeCount").textContent = completos;
  document.getElementById("averageScore").textContent = `${promedio.toFixed(1)}%`;
  document.getElementById("alertCount").textContent = alertas;
  document.getElementById("gridTitle").textContent = courseFilter.options[courseFilter.selectedIndex].text;
  document.getElementById("gridSubtitle").textContent = `${subjectFilter.value} · ${evaluationFilter.value}`;
}

function renderCriteriaEditor() {
  criteriaList.innerHTML = consignas.map((c, index) => `
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
  `).join("");
}

function normalizeConsignas() {
  consignas = consignas.sort((a, b) => a.id - b.id);
  Object.values(state).flat().forEach(alumno => {
    while (alumno.scores.length < consignas.length) alumno.scores.push("");
  });
}

function findStudent(id) {
  return state[courseFilter.value].find(alumno => alumno.id === id);
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

table.addEventListener("keydown", event => {
  if (event.key !== "Tab") return;

  const controls = editableControls();
  const currentIndex = controls.indexOf(event.target);
  if (currentIndex === -1) return;

  event.preventDefault();
  const direction = event.shiftKey ? -1 : 1;
  const nextIndex = currentIndex + direction;
  const nextControl = controls[nextIndex];

  if (nextControl) focusGridControl(nextControl);
});

table.addEventListener("input", event => {
  const target = event.target;
  const id = target.dataset.id;
  if (!id) return;
  const alumno = findStudent(id);
  if (target.dataset.score !== undefined) {
    const scoreIndex = Number(target.dataset.score);
    alumno.scores[scoreIndex] = target.value === "" ? "" : Number(target.value);
    document.getElementById("saveStatus").textContent = "Cambios sin guardar";
    renderBody();
    const next = table.querySelector(`[data-id="${id}"][data-score="${scoreIndex}"]`);
    if (next) focusGridControl(next);
  } else if (target.dataset.field) {
    alumno[target.dataset.field] = target.value;
    document.getElementById("saveStatus").textContent = "Cambios sin guardar";
  }
});

table.addEventListener("change", event => {
  const target = event.target;
  const id = target.dataset.id;
  if (!id || !target.dataset.field) return;
  findStudent(id)[target.dataset.field] = target.value;
  document.getElementById("saveStatus").textContent = "Cambios sin guardar";
  renderBody();
});

[courseFilter, subjectFilter, evaluationFilter, searchInput, showIncomplete].forEach(control => {
  control.addEventListener("input", () => {
    ensureCourseState(courseFilter.value);
    renderBody();
  });
});

document.getElementById("saveBtn").addEventListener("click", () => {
  const now = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("saveStatus").textContent = `Guardado ${now}`;
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const course = courseFilter.value;
  const visible = activeConsignas();
  const headers = ["evaluacion", "curso", "alumno_id", "alumno", ...visible.map(c => `consigna_${c.id}`), "puntaje", "calificacion", "material", "pudo_resolver", "observacion"];
  const rows = state[course].map(alumno => {
    const totals = studentTotals(alumno);
    return [evaluationFilter.value, course, alumno.id, alumno.nombre, ...visible.map(c => alumno.scores[c.scoreKey] ?? ""), totals.puntaje.toFixed(1), totals.porcentaje.toFixed(1), alumno.material, alumno.pudoResolver, alumno.observacion];
  });
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `resultados_${course}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById("loadMasterBtn").addEventListener("click", () => {
  document.getElementById("masterFile").click();
});

document.getElementById("masterFile").addEventListener("change", () => {
  document.getElementById("saveStatus").textContent = "Maestro listo para importar";
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
  const nextKey = Math.max(...consignas.map(c => c.scoreKey)) + 1;
  consignas.push({ id: consignas.length + 1, scoreKey: nextKey, titulo: "Nueva consigna", max: 1, step: 0.5, active: true });
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
  renderHeader();
  renderBody();
  criteriaModal.hidden = true;
  document.getElementById("saveStatus").textContent = "Configuracion actualizada";
});

renderHeader();
ensureCourseState(courseFilter.value);
renderBody();
