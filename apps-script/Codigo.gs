const SPREADSHEET_ID = "1GXOSs1tNHBbv4AOYhOpgrOB4Jz5p6QU3HTqBzufFXDc";
const ALLOWED_DOMAIN = "goethe.edu.ar";
// Client ID del frontend (Google Identity). Se usa para validar el `aud` del idToken.
const GOOGLE_CLIENT_ID = "225474160522-7rk742a5qubfaf0te9uqiokfr4umj7al.apps.googleusercontent.com";
const API_VERSION = "2026-07-02-cargas-por-curso";

const SHEETS = {
  alumnos: "Alumnos",
  mapas: "Mapas",
  cargas: "Cargas",
  admins: "Admins"
};

// Las columnas nuevas van AL FINAL a proposito: asi el orden de las columnas
// existentes en la solapa Mapas no cambia y el frontend viejo (produccion)
// sigue funcionando sin enterarse.
// TipoCalificacion: numerica (default) | conceptual. EscalaConceptual: valores
// separados por | (ej. Logrado|En proceso|Iniciado), editable por materia.
const MAPAS_HEADERS = [
  "MapaID", "MateriaID", "MateriaNombre", "EvaluacionID", "EvaluacionNombre",
  "Nivel", "Curso", "AnioLectivo", "ConsignaID", "ConsignaContenido",
  "ConsignaPuntajeMax", "ConsignaIncremento", "ConsignaOrden",
  "ConsignaActiva", "FechaCaducidad", "Competencia", "Eje", "PeriodoEvaluacion",
  "TipoCalificacion", "EscalaConceptual"
];

const CARGAS_HEADERS = [
  "CargaID", "EvaluacionID", "ConsignaID", "DNI", "Curso", "DocenteEmail",
  "Puntaje", "UsoMaterial", "PudoResolver", "Observacion", "EstadoCarga",
  "FechaGuardado", "FechaCierre", "EstadoAlumno"
];

// El spreadsheet se abre una sola vez por ejecucion (openById es caro).
let _spreadsheet = null;
function getSpreadsheet() {
  if (!_spreadsheet) _spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return _spreadsheet;
}

function authorizeSetup() {
  // Ejecutar manualmente una vez para autorizar los scopes (Sheets + UrlFetch).
  SpreadsheetApp.openById(SPREADSHEET_ID).getSheets();
  UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token=ping", { muteHttpExceptions: true });
}

function doGet(e) {
  try {
    const action = normalizeAction(e.parameter.action);
    if (action === "health") return output(e, { ok: true, data: { version: API_VERSION } });

    const user = authorizeUser(e.parameter.idToken);
    if (action === "me") return output(e, { ok: true, data: user });

    // Una sola llamada que devuelve todo: evita varios arranques en frio.
    // Pasar ?curso=EP2A limita las cargas a ese curso (ver readCargas).
    if (action === "bootstrap") {
      return output(e, {
        ok: true,
        user,
        data: {
          alumnos: readSheetObjects(SHEETS.alumnos),
          mapas: readSheetObjects(SHEETS.mapas),
          cargas: readCargas(e.parameter.curso),
          admins: readSheetObjects(SHEETS.admins)
        }
      });
    }

    if (action === "alumnos") return output(e, { ok: true, data: readSheetObjects(SHEETS.alumnos), user });
    if (action === "mapas") return output(e, { ok: true, data: readSheetObjects(SHEETS.mapas), user });
    if (action === "cargas") return output(e, { ok: true, data: readCargas(e.parameter.curso), user });
    if (action === "admins" || action === "admin") return output(e, { ok: true, data: readSheetObjects(SHEETS.admins), user });
    return output(e, { ok: false, error: "Accion GET no soportada: " + action });
  } catch (error) {
    return output(e, { ok: false, error: error.message });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.parameter && e.parameter.payload) || (e.postData && e.postData.contents) || "{}");
    const user = authorizeUser(payload.idToken);
    const action = normalizeAction(payload.action);
    const data = payload.data || [];

    if (action === "savecargas") {
      const securedData = data.map(row => Object.assign({}, row, { DocenteEmail: user.email }));
      const rows = upsertRows(SHEETS.cargas, CARGAS_HEADERS, securedData, ["CargaID"]);
      return jsonOk({ rows });
    }

    if (action === "savemapas" || action === "upsertmapas") {
      if (!isAdminEmail(user.email)) throw new Error("Solo administradores pueden modificar mapas.");
      const rows = upsertRows(SHEETS.mapas, MAPAS_HEADERS, data, ["MapaID", "Curso", "ConsignaID"]);
      return jsonOk({ rows });
    }

    return jsonError("Accion POST no soportada: " + action);
  } catch (error) {
    return jsonError(error.message);
  }
}

function normalizeAction(value) {
  return String(value || "").trim().toLowerCase();
}

// Identifica al usuario validando el idToken que manda el frontend.
// Asi funciona para CUALQUIER docente del dominio, sin depender de la sesion
// de Google del navegador (Session.getActiveUser da vacio en acceso anonimo).
// Cae a Session.getActiveUser solo como respaldo (p. ej. si no llega token).
function authorizeUser(idToken) {
  let email = idToken ? verifyIdToken(idToken) : "";
  if (!email) email = String(Session.getActiveUser().getEmail() || "").toLowerCase();
  email = email.toLowerCase();

  if (!email || !email.endsWith("@" + ALLOWED_DOMAIN)) {
    throw new Error("Usuario no autorizado: " + (email || "(sin email)"));
  }

  return { email, isGoethe: true };
}

// Valida el JWT contra el endpoint publico de Google. Devuelve el email si el
// token es valido (firma + vigencia las verifica Google con el 200), el aud
// coincide con nuestro Client ID y el dominio es el permitido. Si no, "".
function verifyIdToken(idToken) {
  try {
    const response = UrlFetchApp.fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken),
      { muteHttpExceptions: true }
    );
    if (response.getResponseCode() !== 200) return "";
    const info = JSON.parse(response.getContentText());
    if (GOOGLE_CLIENT_ID && info.aud !== GOOGLE_CLIENT_ID) return "";
    const email = String(info.email || "").toLowerCase();
    if (info.hd && String(info.hd).toLowerCase() !== ALLOWED_DOMAIN) return "";
    return email;
  } catch (error) {
    return "";
  }
}

function isAdminEmail(email) {
  const target = String(email || "").trim().toLowerCase();
  return readSheetObjects(SHEETS.admins).some(row => {
    const adminEmail = String(row.Email || row.email || row.Mail || row.mail || row.Usuario || row.usuario || "").trim().toLowerCase();
    const active = String(row.Activo || row.activo || "TRUE").trim().toLowerCase();
    return adminEmail === target && !["false", "0", "no", "n"].includes(active);
  });
}

// Cargas filtradas por curso en el servidor (?curso=EP2A): bajar la solapa
// completa falla por tamaño desde que crecio con uso real. Sin curso devuelve
// todo por compatibilidad con el frontend anterior (que fallara igual que hoy
// hasta actualizarse, pero sin riesgo de mostrar datos incompletos).
function readCargas(curso) {
  const target = String(curso || "").trim();
  const rows = readSheetObjects(SHEETS.cargas);
  if (!target) return rows;
  return rows.filter(function(row) {
    return String(row.Curso || "").trim() === target;
  });
}

function readSheetObjects(sheetName) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);

  return values.slice(1)
    .filter(row => row.some(value => value !== ""))
    .map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = formatValue(row[index]);
      });
      return item;
    });
}

function replaceSheet(sheetName, headers, objects) {
  const sheet = getSheet(sheetName);
  sheet.clearContents();
  const rows = [headers].concat(objects.map(item => headers.map(header => item[header] ?? "")));
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
}

function upsertRows(sheetName, headers, objects, keyHeaders) {
  const sheet = getSheet(sheetName);
  ensureHeaders(sheet, headers);

  const existing = sheet.getDataRange().getValues();
  const existingHeaders = existing[0].map(String);
  const keyToRow = new Map();

  existing.slice(1).forEach((row, index) => {
    const key = keyHeaders.map(header => row[existingHeaders.indexOf(header)]).join("||");
    if (key) keyToRow.set(key, index + 2);
  });

  // Acumula filas nuevas para escribirlas de una sola vez (appendRow por fila
  // es lento). Las actualizaciones de filas existentes se escriben en su lugar.
  let written = 0;
  const appended = [];
  objects.forEach(item => {
    const key = keyHeaders.map(header => item[header]).join("||");
    const rowValues = headers.map(header => item[header] ?? "");
    const rowNumber = keyToRow.get(key);

    if (rowNumber) {
      sheet.getRange(rowNumber, 1, 1, headers.length).setValues([rowValues]);
    } else {
      appended.push(rowValues);
    }
    written += 1;
  });

  if (appended.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, appended.length, headers.length).setValues(appended);
  }

  return written;
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }

  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
  if (!headers.every((header, index) => current[index] === header)) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function getSheet(sheetName) {
  const spreadsheet = getSpreadsheet();
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function formatValue(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return value == null ? "" : String(value);
}

function jsonOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(error) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error }))
    .setMimeType(ContentService.MimeType.JSON);
}

function output(e, payload) {
  const callback = e && e.parameter && e.parameter.callback;
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + JSON.stringify(payload) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
