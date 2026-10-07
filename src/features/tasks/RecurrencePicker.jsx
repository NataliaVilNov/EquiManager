import { useEffect, useId, useRef } from "react";
import { weekdayCode, nthWeekdayOfMonth } from "../../lib/recurrence.js";

const WEEKDAYS = [
  { code: "MO", label: "L" },
  { code: "TU", label: "M" },
  { code: "WE", label: "X" },
  { code: "TH", label: "J" },
  { code: "FR", label: "V" },
  { code: "SA", label: "S" },
  { code: "SU", label: "D" },
];

const WEEKDAY_NAMES = {
  MO: "lunes",
  TU: "martes",
  WE: "miércoles",
  TH: "jueves",
  FR: "viernes",
  SA: "sábado",
  SU: "domingo",
};

const FREQ_OPTIONS = [
  { id: "none", label: "No se repite" },
  { id: "daily", label: "Diaria" },
  { id: "weekly", label: "Semanal" },
  { id: "monthly", label: "Mensual" },
];

const END_OPTIONS = [
  { id: "never", label: "Nunca" },
  { id: "until", label: "Hasta una fecha" },
  { id: "count", label: "Tras N veces" },
];

function ordinalLabel(n) {
  if (n < 0) return "último";
  return ["1º", "2º", "3º", "4º", "5º"][n - 1] || `${n}º`;
}

function monthDayOf(dateStr) {
  return dateStr ? new Date(dateStr + "T12:00:00").getDate() : null;
}

// Controlled: `value` is a recurrenceRule shaped for src/lib/recurrence.js (or null for a
// one-off task), `onChange` receives the next rule or null. `startDate` supplies the anchor
// day used to pre-fill weekday/day-of-month defaults when a mode is first selected.
export function RecurrencePicker({ value, onChange, startDate }) {
  const fid = useId();
  const freq = value ? value.freq : "none";
  const interval = value ? value.interval || 1 : 1;
  const byWeekday = value && value.byWeekday ? value.byWeekday : [];
  const monthlyMode = value && value.byMonthDay ? "day" : "weekday";
  const endMode = value ? (value.until ? "until" : value.count ? "count" : "never") : "never";

  function emit(patch) {
    onChange({ ...value, ...patch });
  }

  function setFreq(nextFreq) {
    if (nextFreq === "none") {
      onChange(null);
      return;
    }
    onChange({
      freq: nextFreq,
      interval,
      byWeekday: nextFreq === "weekly" ? (startDate ? [weekdayCode(startDate)] : []) : null,
      bySetPos: null,
      byMonthDay: nextFreq === "monthly" ? monthDayOf(startDate) || 1 : null,
      until: value ? value.until : null,
      count: value ? value.count : null,
    });
  }

  function toggleWeekday(code) {
    const next = byWeekday.includes(code) ? byWeekday.filter((c) => c !== code) : [...byWeekday, code];
    emit({ byWeekday: next });
  }

  function setMonthlyMode(mode) {
    if (mode === "day") {
      emit({ byMonthDay: monthDayOf(startDate) || 1, byWeekday: null, bySetPos: null });
    } else {
      emit({
        byMonthDay: null,
        byWeekday: startDate ? [weekdayCode(startDate)] : [],
        bySetPos: startDate ? nthWeekdayOfMonth(startDate) : 1,
      });
    }
  }

  function setEndMode(mode) {
    if (mode === "never") emit({ until: null, count: null });
    else if (mode === "until") emit({ until: startDate, count: null });
    else emit({ until: null, count: 5 });
  }

  // La regla se capturaba al elegir el modo pero las etiquetas se pintaban a partir de
  // `startDate` EN VIVO: al cambiar la fecha el chip decía "El día 20 de cada mes" mientras
  // la regla guardada seguía diciendo el día 7, y la tarea no caía en su propio día de
  // inicio. Al cambiar la fecha, la parte de la regla derivada del ancla se vuelve a
  // calcular, y las etiquetas se leen de `value` (la regla real), no de `startDate`.
  const prevStartDate = useRef(startDate);
  useEffect(() => {
    const prev = prevStartDate.current;
    if (prev === startDate) return;
    prevStartDate.current = startDate;
    if (!value || !startDate) return;
    if (value.freq === "weekly") {
      // Solo se re-deriva si el usuario no había tocado los chips (seguían siendo justo el
      // día de la semana del ancla anterior): una selección propia de varios días se respeta.
      const untouched =
        !value.byWeekday ||
        !value.byWeekday.length ||
        (value.byWeekday.length === 1 && prev && value.byWeekday[0] === weekdayCode(prev));
      if (untouched) onChange({ ...value, byWeekday: [weekdayCode(startDate)] });
    } else if (value.freq === "monthly") {
      // El día del mes y la posición del día de la semana solo salen del ancla: no hay otra
      // forma de fijarlos en la interfaz, así que siempre siguen a la fecha de inicio.
      if (value.byMonthDay) onChange({ ...value, byMonthDay: monthDayOf(startDate) || 1 });
      else onChange({ ...value, byWeekday: [weekdayCode(startDate)], bySetPos: nthWeekdayOfMonth(startDate) });
    }
  }, [startDate, value, onChange]);

  const ruleMonthDay = value && value.byMonthDay ? value.byMonthDay : monthDayOf(startDate);
  const ruleSetPos = value && value.bySetPos ? value.bySetPos : startDate ? nthWeekdayOfMonth(startDate) : null;
  const ruleWeekdayCode = (value && value.byWeekday && value.byWeekday[0]) || (startDate ? weekdayCode(startDate) : null);
  const ruleWeekday = WEEKDAYS.find((w) => w.code === ruleWeekdayCode);

  return (
    <div className="f">
      <label id={`${fid}-freq-label`}>Repetición</label>
      <div className="og og4" role="group" aria-labelledby={`${fid}-freq-label`}>
        {FREQ_OPTIONS.map((o) => (
          <button
            type="button"
            key={o.id}
            className={"oo" + (freq === o.id ? " active" : "")}
            aria-pressed={freq === o.id}
            onClick={() => setFreq(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {freq !== "none" && (
        <>
          <div className="f">
            <label htmlFor={`${fid}-interval`}>Cada</label>
            <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
              <input
                id={`${fid}-interval`}
                type="number"
                min="1"
                max="30"
                value={interval}
                onChange={(e) => emit({ interval: Math.max(1, Number(e.target.value) || 1) })}
                style={{ width: "60px" }}
              />
              <span style={{ fontSize: ".82rem", color: "var(--gr)" }}>
                {freq === "daily" ? "día(s)" : freq === "weekly" ? "semana(s)" : "mes(es)"}
              </span>
            </div>
          </div>

          {freq === "weekly" && (
            <div className="f">
              <label id={`${fid}-weekday-label`}>Días de la semana</label>
              <div className="pch" role="group" aria-labelledby={`${fid}-weekday-label`}>
                {WEEKDAYS.map((w) => (
                  <button
                    type="button"
                    key={w.code}
                    className={"pc" + (byWeekday.includes(w.code) ? " active" : "")}
                    aria-pressed={byWeekday.includes(w.code)}
                    aria-label={WEEKDAY_NAMES[w.code]}
                    onClick={() => toggleWeekday(w.code)}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
              {!byWeekday.length && (
                <div style={{ fontSize: ".72rem", color: "var(--am)", fontWeight: 700, marginTop: ".3rem" }}>
                  <span aria-hidden="true">⚠️</span> Elige al menos un día de la semana.
                </div>
              )}
            </div>
          )}

          {freq === "monthly" && (
            <div className="f">
              <label id={`${fid}-monthly-label`}>Cuándo</label>
              <div className="pch" role="group" aria-labelledby={`${fid}-monthly-label`}>
                <button
                  type="button"
                  className={"pc" + (monthlyMode === "day" ? " active" : "")}
                  aria-pressed={monthlyMode === "day"}
                  onClick={() => setMonthlyMode("day")}
                >
                  El día {ruleMonthDay || ""} de cada mes
                </button>
                <button
                  type="button"
                  className={"pc" + (monthlyMode === "weekday" ? " active" : "")}
                  aria-pressed={monthlyMode === "weekday"}
                  onClick={() => setMonthlyMode("weekday")}
                >
                  {ruleSetPos
                    ? `El ${ordinalLabel(ruleSetPos)} ${ruleWeekday ? ruleWeekday.label : ""} del mes`
                    : "Por día de la semana"}
                </button>
              </div>
            </div>
          )}

          <div className="f">
            <label id={`${fid}-end-label`}>Termina</label>
            <div className="pch" role="group" aria-labelledby={`${fid}-end-label`}>
              {END_OPTIONS.map((o) => (
                <button
                  type="button"
                  key={o.id}
                  className={"pc" + (endMode === o.id ? " active" : "")}
                  aria-pressed={endMode === o.id}
                  onClick={() => setEndMode(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {endMode === "until" && (
            <div className="f">
              <label htmlFor={`${fid}-until`}>Fecha final</label>
              <input
                id={`${fid}-until`}
                type="date"
                value={(value && value.until) || ""}
                onChange={(e) => emit({ until: e.target.value })}
              />
            </div>
          )}

          {endMode === "count" && (
            <div className="f">
              <label htmlFor={`${fid}-count`}>Número de repeticiones</label>
              <input
                id={`${fid}-count`}
                type="number"
                min="1"
                max="365"
                value={(value && value.count) || 5}
                onChange={(e) => emit({ count: Math.max(1, Number(e.target.value) || 1) })}
                style={{ width: "80px" }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
