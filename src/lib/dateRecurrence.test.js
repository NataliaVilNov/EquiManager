import { describe, it, expect } from "vitest";
import { td, dU, addD, toISODate, isValidISODate } from "./date.js";
import { expandOccurrences, weekdayCode } from "./recurrence.js";

// Fecha local de hoy construida a mano, sin pasar por date.js, para comprobar que td() no
// se va al día anterior/siguiente por leer la hora en UTC.
function localTodayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

describe("date.js", () => {
  it("td() devuelve la fecha LOCAL de hoy", () => {
    expect(td()).toBe(localTodayISO());
  });

  it("dU(hoy) es 0", () => {
    expect(dU(td())).toBe(0);
  });

  it("dU(ayer) es -1", () => {
    expect(dU(addD(td(), -1))).toBe(-1);
  });

  it("dU(mañana) es 1", () => {
    expect(dU(addD(td(), 1))).toBe(1);
  });

  it("toISODate lee las partes locales del Date", () => {
    expect(toISODate(new Date(2026, 9, 7, 23, 30))).toBe("2026-10-07");
    expect(toISODate(new Date(2026, 0, 1, 0, 15))).toBe("2026-01-01");
  });

  it("isValidISODate acepta solo fechas YYYY-MM-DD reales", () => {
    expect(isValidISODate("2026-10-07")).toBe(true);
    expect(isValidISODate("2026-10-7")).toBe(false);
    expect(isValidISODate("2026-13-01")).toBe(false);
    expect(isValidISODate("")).toBe(false);
    expect(isValidISODate(undefined)).toBe(false);
  });
});

describe("expandOccurrences", () => {
  it("una regla semanal con interval 2 ancla los tramos en la semana de calendario", () => {
    const task = {
      startDate: "2026-10-07", // miércoles
      recurrenceRule: { freq: "weekly", interval: 2, byWeekday: ["MO", "WE"] },
    };
    expect(expandOccurrences(task, "2026-10-01", "2026-11-08")).toEqual([
      "2026-10-07",
      "2026-10-19",
      "2026-10-21",
      "2026-11-02",
      "2026-11-04",
    ]);
  });

  it("una serie acotada por count iniciada años antes sigue apareciendo en el rango", () => {
    const task = {
      startDate: "2019-01-01",
      recurrenceRule: { freq: "weekly", interval: 1, count: 500 },
    };
    const dates = expandOccurrences(task, "2026-10-01", "2026-10-31");
    expect(dates.length).toBeGreaterThan(0);
    // 2019-01-01 fue martes: todas las ocurrencias deben caer en martes.
    dates.forEach((d) => expect(weekdayCode(d)).toBe("TU"));
  });

  it("count se respeta de forma exacta: no hay ocurrencias más allá de la enésima", () => {
    const task = {
      startDate: "2026-10-07",
      recurrenceRule: { freq: "daily", interval: 1, count: 3 },
    };
    expect(expandOccurrences(task, "2026-10-01", "2026-10-31")).toEqual([
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
    ]);
  });

  it("una serie acotada por count ya terminada no devuelve nada", () => {
    const task = {
      startDate: "2019-01-01",
      recurrenceRule: { freq: "weekly", interval: 1, count: 10 },
    };
    expect(expandOccurrences(task, "2026-10-01", "2026-10-31")).toEqual([]);
  });
});
