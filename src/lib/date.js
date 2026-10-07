function pad2(n) {
  return String(n).padStart(2, "0");
}

// Formatea un Date como "YYYY-MM-DD" leyendo sus partes LOCALES. Antes varias funciones de
// este módulo construían un Date local a las 12:00 y luego leían .toISOString(), que es UTC:
// con un desfase de +13/+14 horas (Pacífico) ese mediodía local cae en el día siguiente en
// UTC y la fecha salía desplazada un día. Al leer getFullYear/getMonth/getDate nunca hay
// conversión de zona horaria.
export function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

// La fecha de HOY en la zona del usuario. Antes usaba toISOString(), que es UTC: en España
// (UTC+1/+2) entre medianoche y la 1-2 de la madrugada devolvía el día ANTERIOR.
export function td() {
  return toISODate(new Date());
}

// Comprueba que la cadena tenga forma "YYYY-MM-DD" y sea una fecha real.
export function isValidISODate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00"));
}

export function addD(s, n) {
  const d = new Date(s + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

// ISO-8601 week number (weeks start Monday; week 1 contains the year's first Thursday).
export function isoWeek(s) {
  const d = new Date(s + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); // Thursday of this week
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3);
  return 1 + Math.round((d - firstThursday) / (7 * 86400000));
}

export function fD(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function fDL(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Días hasta la fecha dada (0 = hoy, -1 = ayer). Antes restaba la medianoche local de HOY
// del MEDIODÍA local del día objetivo, dejando siempre un +0.5 que Math.round convertía en
// un día entero de más: dU(hoy) daba 1 y dU(ayer) daba -0. Ahora el objetivo también se
// interpreta a medianoche local. Se mantiene Math.round para absorber los cambios de hora
// (un tramo con DST de por medio mide 23 o 25 horas).
export function dU(s) {
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return Math.round((new Date(s + "T00:00:00") - n) / 86400000);
}

// Generic month math, originally written for the team absence calendar
// (public/legacy-app.js:3300-3313) — moved here so any other month-grid view (e.g. the
// board's month tab) can reuse it instead of duplicating it. teamCalendarHelpers.js
// re-exports these so its existing callers don't need to change their import.
export function monthStartStr(m) {
  return (m || td().slice(0, 7)) + "-01";
}

export function addMonth(m, n) {
  const d = new Date(monthStartStr(m) + "T12:00:00");
  d.setMonth(d.getMonth() + n);
  return toISODate(d).slice(0, 7);
}

export function monthLabel(m) {
  return new Date(monthStartStr(m) + "T12:00:00").toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
}
