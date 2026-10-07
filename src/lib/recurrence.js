import { addD, td, toISODate } from "./date.js";

const WEEKDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// Lunes de la semana ISO a la que pertenece la fecha dada.
function isoWeekStart(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay() || 7; // 1 = lunes ... 7 = domingo
  d.setDate(d.getDate() - day + 1);
  return toISODate(d);
}

// Firestore-free, framework-free — pure date math so this stays independently checkable.
export function weekdayCode(dateStr) {
  return WEEKDAY_CODES[new Date(dateStr + "T12:00:00").getDay()];
}

// 1-based "this is the Nth <weekday> of its month" ordinal, or the count from the end
// (-1 = last, -2 = second-to-last, ...) when `fromEnd` is true.
export function nthWeekdayOfMonth(dateStr, fromEnd = false) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDate();
  if (!fromEnd) return Math.ceil(day / 7);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return -Math.ceil((lastDay - day + 1) / 7);
}

function monthDayCount(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// Whole `freq` periods elapsed between two ISO date strings — used for interval matching
// ("every 2 weeks"). Assumes `to >= from`.
function elapsedPeriods(freq, from, to) {
  const fromDate = new Date(from + "T12:00:00");
  const toDate = new Date(to + "T12:00:00");
  if (freq === "daily") {
    return Math.round((toDate - fromDate) / 86400000);
  }
  if (freq === "weekly") {
    // Una regla "cada N semanas" agrupa por SEMANA DE CALENDARIO, no por múltiplos de 7 días
    // contados desde el día de inicio. Al dividir la diferencia cruda de días entre 7 los
    // tramos quedaban anclados al día de la semana de la fecha de inicio: empezando un
    // miércoles con interval 2 y byWeekday [MO, WE], el lunes siguiente (2 días después)
    // caía en el tramo 0 (semana activa) y el lunes de la semana activa real caía en el
    // tramo 1 (semana apagada) — se disparaban los lunes equivocados. Ahora ambas fechas se
    // llevan a su lunes ISO antes de restar, con lo que el índice de tramo es el número de
    // semanas de calendario transcurridas.
    const fromWeek = new Date(isoWeekStart(from) + "T12:00:00");
    const toWeek = new Date(isoWeekStart(to) + "T12:00:00");
    return Math.round((toWeek - fromWeek) / (7 * 86400000));
  }
  // monthly
  return (
    (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
    (toDate.getMonth() - fromDate.getMonth())
  );
}

export function matchesRule(rule, dateStr, anchorStartDate) {
  if (dateStr < anchorStartDate) return false;
  if (rule.until && dateStr > rule.until) return false;

  const freq = rule.freq;
  const interval = rule.interval || 1;
  const elapsed = elapsedPeriods(freq, anchorStartDate, dateStr);
  if (elapsed < 0 || elapsed % interval !== 0) return false;

  if (freq === "daily") return true;

  if (freq === "weekly") {
    if (rule.byWeekday && rule.byWeekday.length) {
      return rule.byWeekday.includes(weekdayCode(dateStr));
    }
    return weekdayCode(dateStr) === weekdayCode(anchorStartDate);
  }

  // monthly
  if (rule.byMonthDay) {
    const day = new Date(dateStr + "T12:00:00").getDate();
    return day === Math.min(rule.byMonthDay, monthDayCount(dateStr));
  }
  if (rule.byWeekday && rule.byWeekday.length && rule.bySetPos) {
    if (!rule.byWeekday.includes(weekdayCode(dateStr))) return false;
    return nthWeekdayOfMonth(dateStr, rule.bySetPos < 0) === rule.bySetPos;
  }
  return new Date(dateStr + "T12:00:00").getDate() === new Date(anchorStartDate + "T12:00:00").getDate();
}

// Safety cap so a non-count-bounded series can't loop indefinitely — well beyond any
// realistic day/week/month view this app renders.
const MAX_WALK_DAYS = 366 * 3;

// Tope de seguridad del recorrido por tramos de una serie acotada por `count`: cubre de
// sobra los casos reales (una serie semanal de 500 repeticiones examina ~3.500 días
// candidatos) sin dejar que un `count` absurdo bloquee el render.
const MAX_CANDIDATE_CHECKS = 50000;

// Cota SUPERIOR de la fecha de la última ocurrencia posible de una serie acotada por
// `count`. Nunca puede quedarse corta (eso perdería ocurrencias), solo sobrar:
//   - diaria: las ocurrencias están en inicio + k*interval días, k < count.
//   - semanal: una semana activa puede tener hasta 7 ocurrencias (varios byWeekday), pero
//     tiene al menos 1, así que `count` ocurrencias caben en `count` semanas activas como
//     máximo; se cierra al final (domingo) de esa última semana.
//   - mensual: como mucho una ocurrencia por mes activo, se cierra al último día del mes.
function lastPossibleDate(rule, startDate) {
  const interval = rule.interval || 1;
  const periods = Math.max(0, (rule.count - 1) * interval);
  if (rule.freq === "daily") return addD(startDate, periods);
  if (rule.freq === "weekly") return addD(isoWeekStart(startDate), periods * 7 + 6);
  const d = new Date(startDate + "T12:00:00");
  return toISODate(new Date(d.getFullYear(), d.getMonth() + periods + 1, 0));
}

// Días candidatos del tramo `p` (el mismo índice que devuelve elapsedPeriods respecto a la
// fecha de inicio), en orden ascendente. Siempre es un superconjunto de lo que matchesRule
// puede aceptar en ese tramo, así que recorrer tramo a tramo y filtrar con matchesRule da
// exactamente las mismas ocurrencias que recorrer día a día, pero sin visitar los tramos
// apagados por `interval`.
function periodCandidateDates(freq, startDate, p) {
  if (freq === "daily") return [addD(startDate, p)];
  if (freq === "weekly") {
    const weekStart = addD(isoWeekStart(startDate), p * 7);
    return Array.from({ length: 7 }, (_, i) => addD(weekStart, i));
  }
  // mensual
  const from = new Date(startDate + "T12:00:00");
  const first = new Date(from.getFullYear(), from.getMonth() + p, 1);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const prefix = toISODate(first).slice(0, 8);
  return Array.from({ length: days }, (_, i) => prefix + String(i + 1).padStart(2, "0"));
}

// Una serie acotada por `count` necesita el histórico real de ocurrencias para saber cuántas
// han pasado ya, así que antes recorría día a día desde su propia fecha de inicio — y el tope
// MAX_WALK_DAYS (3 años) hacía que una serie empezada mucho antes se cortase ANTES de llegar
// al rango visible y devolviese [] (una serie semanal con count 500 iniciada en 2019 no
// mostraba nada en octubre de 2026). Ahora se calcula primero la fecha de la última
// ocurrencia posible: si la serie ya terminó antes del rango no hay nada que recorrer, y si
// no, el recorrido salta de tramo activo en tramo activo (no día a día), de modo que el
// contador sigue siendo exacto y el coste pasa a ser proporcional al número de repeticiones,
// no al número de días transcurridos.
export function expandOccurrences(task, rangeStart, rangeEnd) {
  const rule = task.recurrenceRule;
  if (!rule) {
    return task.startDate >= rangeStart && task.startDate <= rangeEnd ? [task.startDate] : [];
  }

  const dates = [];

  if (rule.count) {
    const lastPossible = lastPossibleDate(rule, task.startDate);
    const hardEnd = rule.until && rule.until < lastPossible ? rule.until : lastPossible;
    if (hardEnd < rangeStart) return dates;
    const interval = rule.interval || 1;
    let remaining = rule.count;
    let checks = 0;
    for (let p = 0; ; p += interval) {
      const candidates = periodCandidateDates(rule.freq, task.startDate, p);
      if (candidates[0] > hardEnd || candidates[0] > rangeEnd) return dates;
      for (let i = 0; i < candidates.length; i++) {
        const d = candidates[i];
        if (d > hardEnd || d > rangeEnd) return dates;
        if (++checks > MAX_CANDIDATE_CHECKS) return dates;
        if (!matchesRule(rule, d, task.startDate)) continue;
        if (d >= rangeStart) dates.push(d);
        remaining--;
        if (remaining <= 0) return dates;
      }
    }
  }

  // Sin `count`, matchesRule es autocontenida respecto al ancla, así que el recorrido puede
  // empezar directamente en el rango visible: O(longitud del rango), no O(días desde que se
  // creó la tarea).
  const walkStart = task.startDate > rangeStart ? task.startDate : rangeStart;
  let walked = 0;
  let d = walkStart;
  while (walked < MAX_WALK_DAYS && d <= rangeEnd) {
    if (rule.until && d > rule.until) break;
    if (matchesRule(rule, d, task.startDate)) dates.push(d);
    d = addD(d, 1);
    walked++;
  }
  return dates;
}

export { td };
