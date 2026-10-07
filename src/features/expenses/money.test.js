import { describe, expect, it } from "vitest";
import { soAmount, soDateFromText } from "../smart-order/extractors.js";
import {
  calcOwnerSettlement,
  distributeShares,
  duplicateOwnerNames,
  equalSplitPcts,
  expenseSplitSummary,
  resolveOwnerIndex,
} from "./expenseSplits.js";
import { computeSaleLiquidation } from "../horses/sale/saleLiquidation.js";
import { td, addD } from "../../lib/date.js";

// --- Importes dictados -------------------------------------------------------------------
// Los seis casos verificados: antes "coste 1.500€" daba 500, "cobro 1.200 euros" daba 200,
// "coste de 1.500" daba 1 y "1.200,50€" daba 200,5 — la primera expresión retrocedía hasta
// los tres últimos dígitos de un número con punto de millar y la segunda miraba un texto
// donde el punto y la coma ya habían sido sustituidos por espacios.
describe("soAmount", () => {
  it("lee la forma española del número, con punto de millar y coma decimal", () => {
    expect(soAmount("coste 1.500€")).toBe(1500);
    expect(soAmount("el herrador cobro 1.200 euros")).toBe(1200);
    expect(soAmount("coste de 1.500")).toBe(1500);
    expect(soAmount("1.200,50€")).toBe(1200.5);
    expect(soAmount("85€")).toBe(85);
    expect(soAmount("coste 95")).toBe(95);
  });

  it("acepta tildes, espacios como separador de millar y cantidades sueltas", () => {
    expect(soAmount("el herrador cobró 1.200 euros")).toBe(1200);
    expect(soAmount("1 500 euros")).toBe(1500);
    expect(soAmount("precio 2.000,25 eur")).toBe(2000.25);
    expect(soAmount("95,50€")).toBe(95.5);
    expect(soAmount("vale 20")).toBe(20);
  });

  it("devuelve null cuando no hay importe", () => {
    expect(soAmount("montar suave 30 minutos")).toBe(null);
    expect(soAmount("")).toBe(null);
    expect(soAmount(null)).toBe(null);
  });
});

describe("soDateFromText", () => {
  it("entiende 'esta mañana' como hoy y no como mañana", () => {
    expect(soDateFromText("esta mañana paddock", "2026-01-15")).toBe(td());
    expect(soDateFromText("mañana paddock", "2026-01-15")).toBe(addD(td(), 1));
    expect(soDateFromText("pasado mañana paddock", "2026-01-15")).toBe(addD(td(), 2));
  });

  it("cuenta el día de la semana desde la fecha base, no desde hoy", () => {
    // 2026-01-15 es jueves; el viernes siguiente es el 16.
    expect(soDateFromText("el viernes monta", "2026-01-15")).toBe("2026-01-16");
    // Si el día coincide con el ancla, salta a la semana siguiente.
    expect(soDateFromText("el jueves monta", "2026-01-15")).toBe("2026-01-22");
  });

  it("deja la fecha base cuando el texto no dice nada", () => {
    expect(soDateFromText("montar suave", "2026-01-15")).toBe("2026-01-15");
  });
});

// --- Reparto a partes iguales ------------------------------------------------------------
describe("equalSplitPcts", () => {
  it("suma exactamente 100 para cualquier número de cuotas", () => {
    for (let n = 1; n <= 25; n++) {
      const pcts = equalSplitPcts(n);
      expect(pcts).toHaveLength(n);
      const total = pcts.reduce((a, b) => a + b, 0);
      expect(Math.abs(total - 100)).toBeLessThan(1e-9);
    }
  });

  it("acumula el resto en la primera cuota (3 → 33,34/33,33/33,33)", () => {
    expect(equalSplitPcts(3)).toEqual([33.34, 33.33, 33.33]);
    expect(equalSplitPcts(2)).toEqual([50, 50]);
    expect(equalSplitPcts(4)).toEqual([25, 25, 25, 25]);
  });

  it("los casos que antes quedaban bloqueados (99%, 102%, 98%, 104%) ya cuadran", () => {
    [3, 6, 7, 8].forEach((n) => {
      const total = equalSplitPcts(n).reduce((a, b) => a + b, 0);
      expect(Math.abs(total - 100)).toBeLessThanOrEqual(0.5);
    });
  });

  it("devuelve una lista vacía sin cuotas", () => {
    expect(equalSplitPcts(0)).toEqual([]);
    expect(equalSplitPcts(null)).toEqual([]);
  });
});

// --- Céntimos en los repartos ------------------------------------------------------------
describe("distributeShares", () => {
  it("las partes suman exactamente el total", () => {
    const shares = distributeShares(10, [33.33, 33.33, 33.34]);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(10, 10);
  });

  it("reparte el céntimo suelto, no lo pierde", () => {
    expect(distributeShares(10, [33.34, 33.33, 33.33])).toEqual([3.34, 3.33, 3.33]);
    expect(distributeShares(0.1, [50, 50])).toEqual([0.05, 0.05]);
  });

  it("cuadra con cualquier importe y cualquier número de cuotas", () => {
    const amounts = [10, 0.03, 1234.56, 999.99, 7, 100.01];
    [2, 3, 6, 7, 11].forEach((n) => {
      const pcts = equalSplitPcts(n);
      amounts.forEach((amt) => {
        const shares = distributeShares(amt, pcts);
        const sum = Math.round(shares.reduce((a, b) => a + b, 0) * 100);
        expect(sum).toBe(Math.round(amt * 100));
      });
    });
  });

  it("solo reparte la fracción indicada cuando las cuotas no suman 100", () => {
    const shares = distributeShares(100, [40, 40]);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(80, 10);
  });

  it("devuelve ceros sin importe o sin cuotas", () => {
    expect(distributeShares(0, [50, 50])).toEqual([0, 0]);
    expect(distributeShares(10, [])).toEqual([]);
    expect(distributeShares(10, [0, 0])).toEqual([0, 0]);
  });
});

describe("expenseSplitSummary", () => {
  it("muestra importes que suman el total del gasto", () => {
    const summary = expenseSplitSummary({
      amount: 10,
      splits: [
        { name: "Ana", pct: 33.34 },
        { name: "Juan", pct: 33.33 },
        { name: "Eva", pct: 33.33 },
      ],
    });
    expect(summary).toBe("Ana 33.34% (3.34€) · Juan 33.33% (3.33€) · Eva 33.33% (3.33€)");
  });
});

// --- Nombres de propietario repetidos ----------------------------------------------------
describe("resolveOwnerIndex / duplicateOwnerNames", () => {
  it("resuelve por posición y marca lo ambiguo", () => {
    const names = ["Ana", "Juan", "Juan", ""];
    expect(resolveOwnerIndex(names, "Ana")).toBe(0);
    expect(resolveOwnerIndex(names, " ana ")).toBe(0);
    expect(resolveOwnerIndex(names, "Juan")).toBe(-2);
    expect(resolveOwnerIndex(names, "Eva")).toBe(-1);
    expect(resolveOwnerIndex(names, "")).toBe(-1);
  });

  it("detecta los nombres repetidos", () => {
    expect(duplicateOwnerNames([{ nombre: "Juan" }, { nombre: "juan" }, { nombre: "Ana" }])).toEqual(["juan"]);
    expect(duplicateOwnerNames([{ nombre: "" }, { nombre: "" }])).toEqual([]);
  });
});

describe("calcOwnerSettlement", () => {
  const horse = { id: "h1", owners: [{ nombre: "Ana", pct: 50 }, { nombre: "Juan", pct: 50 }] };

  it("las partes imputadas suman el total del gasto", () => {
    const expenses = [{ id: "e1", hid: "h1", cat: "vet", amount: 10, concept: "Vet", payer: "Ana", splits: [] }];
    const res = calcOwnerSettlement(horse, expenses, ["e1"]);
    const owed = res.owners.reduce((s, o) => s + o.owed, 0);
    expect(owed).toBeCloseTo(10, 10);
    expect(res.owners.find((o) => o.name === "Ana").paid).toBe(10);
    expect(res.transfers).toEqual([{ from: "Juan", to: "Ana", amount: 5 }]);
  });

  it("no cobra el doble cuando dos propietarios se llaman igual", () => {
    const twins = { id: "h2", owners: [{ nombre: "Juan", pct: 50 }, { nombre: "Juan", pct: 50 }] };
    const expenses = [{ id: "e1", hid: "h2", cat: "vet", amount: 1000, concept: "Vet", payer: "Juan", splits: [] }];
    const res = calcOwnerSettlement(twins, expenses, ["e1"]);
    // Antes ambas filas leían el mismo apunte con 1000€ (2000€ en total).
    const owed = res.owners.reduce((s, o) => s + o.owed, 0);
    expect(owed).toBe(0);
    expect(res.owners.every((o) => o.owed === 0)).toBe(true);
    expect(res.warnings.join(" ")).toContain("mismo nombre");
  });

  it("reparte tres partes de 33,33/33,33/33,34 sin perder céntimos", () => {
    const trio = {
      id: "h3",
      owners: [{ nombre: "Ana", pct: 34 }, { nombre: "Juan", pct: 33 }, { nombre: "Eva", pct: 33 }],
    };
    const expenses = [
      {
        id: "e1",
        hid: "h3",
        cat: "vet",
        amount: 10,
        concept: "Vet",
        payer: "Ana",
        splits: [
          { name: "Ana", pct: 33.34 },
          { name: "Juan", pct: 33.33 },
          { name: "Eva", pct: 33.33 },
        ],
      },
    ];
    const res = calcOwnerSettlement(trio, expenses, ["e1"]);
    expect(res.owners.reduce((s, o) => s + o.owed, 0)).toBeCloseTo(10, 10);
  });
});

describe("computeSaleLiquidation", () => {
  it("no imputa dos veces un gasto prorrateado a dos propietarios homónimos", () => {
    const horse = {
      id: "h1",
      sale: { precio: 0, owners: [{ nombre: "Juan", pct: 50 }, { nombre: "Juan", pct: 50 }] },
    };
    const expenses = [{ id: "e1", hid: "h1", cat: "vet", amount: 1000, concept: "Vet", payer: "Cuadra" }];
    const res = computeSaleLiquidation(horse, expenses);
    const total = res.ownerBreakdown.reduce((s, b) => s + b.gastosAsignados, 0);
    expect(total).toBeCloseTo(1000, 10);
    expect(res.warnings.join(" ")).toContain("mismo nombre");
  });

  it("el prorrateo por % de propiedad suma el importe del gasto", () => {
    const horse = {
      id: "h1",
      sale: {
        precio: 0,
        owners: [{ nombre: "Ana", pct: 33.34 }, { nombre: "Juan", pct: 33.33 }, { nombre: "Eva", pct: 33.33 }],
      },
    };
    const expenses = [{ id: "e1", hid: "h1", cat: "vet", amount: 10, concept: "Vet", payer: "Cuadra" }];
    const res = computeSaleLiquidation(horse, expenses);
    expect(res.ownerBreakdown.reduce((s, b) => s + b.gastosProrrata, 0)).toBeCloseTo(10, 10);
  });
});
