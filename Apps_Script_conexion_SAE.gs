/**
 * API de solo lectura para el informe SAE.
 * Expone exclusivamente la hoja agregada "Nuevos datos sin duplicar".
 * NO expone Base_Maestra, Base_Maestra_Activos, Tamizajes ni datos personales.
 */
const SAE_CONFIG = {
  SPREADSHEET_ID: '1uNksGeRXqdvfOqDJ4qosopUKcMNIfLN_',
  SHEET_NAME: 'Nuevos datos sin duplicar'
};

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const callback = String(params.callback || '');
  let result;

  try {
    if (params.action !== 'resumen') {
      throw new Error('Acción no permitida.');
    }

    const ss = SpreadsheetApp.openById(SAE_CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SAE_CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('No se encontró la pestaña de resumen.');

    const lastRow = sheet.getLastRow();
    const lastCol = Math.min(sheet.getLastColumn(), 11);
    if (lastRow < 2 || lastCol < 11) {
      throw new Error('La pestaña de resumen no contiene las 11 columnas esperadas.');
    }

    // La interfaz espera filas sin encabezado; la estructura A:K se conserva.
    const rows = sheet.getRange(2, 1, lastRow - 1, 11).getValues()
      .filter(row => row.some(value => String(value).trim() !== ''));

    result = { ok: true, sheet: SAE_CONFIG.SHEET_NAME, updatedAt: new Date().toISOString(), rows: rows };
  } catch (err) {
    result = { ok: false, error: String(err && err.message ? err.message : err) };
  }

  const json = JSON.stringify(result);
  // JSONP evita problemas CORS al consultar Apps Script desde una página HTML externa.
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
