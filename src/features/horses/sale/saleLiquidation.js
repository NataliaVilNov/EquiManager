import { expenseCategoryById } from "../../../lib/constants.js";
import {
  OWNER_AMBIGUOUS,
  distributeShares,
  duplicateOwnerNames,
  expSplitsForDisplay,
  resolveOwnerIndex,
} from "../../expenses/expenseSplits.js";

// Ports the venta/sale computation block of rHorse (public/legacy-app.js:1787-1944) as one
// pure function — the single most complex calculation in the app: per-category expense
// totals, income tracking, and per-owner expense attribution (by split, by payer match, or
// by ownership-% fallback), feeding a final per-owner liquidation.

export const SALE_EXPENSE_CATEGORIES = ["concurso", "pupilaje", "veterinario", "herrajes", "compra", "nomina", "otros"];

export const SALE_EXPENSE_CATEGORY_LABELS = {
  concurso: "Concurso",
  pupilaje: "Pupilaje / Servicio",
  veterinario: "Veterinario",
  herrajes: "Herrador / Herrajes",
  compra: "Compra / Pienso",
  nomina: "Nóminas",
  otros: "Otros",
};

function categoryBucket(cat) {
  if (cat === "concurso" || cat === "entrada") return "concurso";
  if (cat === "pupilaje") return "pupilaje";
  if (cat === "vet" || cat === "salud") return "veterinario";
  if (cat === "herrador" || cat === "herraje") return "herrajes";
  if (cat === "compra" || cat === "pienso") return "compra";
  if (cat === "nomina") return "nomina";
  return "otros";
}

// `expenses` is the list already filtered to this horse (same shape ExpensesTab computes).
export function computeSaleLiquidation(horse, expenses) {
  const catTotals = {};
  SALE_EXPENSE_CATEGORIES.forEach((c) => (catTotals[c] = 0));
  const owners = (horse.sale && horse.sale.owners) || [{ nombre: "", pct: 100 }];
  const ownerNames = owners.map((o) => o.nombre);
  // Todos los apuntes por propietario se indexan por POSICIÓN, no por nombre normalizado:
  // dos propietarios llamados igual (o dos sin nombre) compartían una misma clave, así que
  // un gasto prorrateado se sumaba dos veces a ella y luego AMBAS filas leían el importe
  // entero, cobrando el doble. Un nombre que no identifica a un único propietario pasa a
  // "sin asignar" (ya avisado en la interfaz) en vez de imputarse mal.
  const ingresosPorPropietario = owners.map(() => 0);
  const gastosPorPropietario = owners.map(() => 0);
  const gastosPorDefecto = owners.map(() => 0);
  const gastosPorReparto = owners.map(() => 0);
  const warnings = [];
  const dups = duplicateOwnerNames(owners);
  if (dups.length) {
    warnings.push(
      `Hay varios propietarios con el mismo nombre (${dups.join(
        ", "
      )}): no se pueden distinguir en los repartos. Renómbralos en la ficha del caballo.`
    );
  }

  let totalIngresos = 0;
  expenses.forEach((e) => {
    const ec = expenseCategoryById(e.cat);
    const amt = Number(e.amount || 0);
    if (ec.d !== "out") {
      totalIngresos += amt;
      const idx = resolveOwnerIndex(ownerNames, e.payee);
      if (idx >= 0) ingresosPorPropietario[idx] += amt;
      else if (idx === OWNER_AMBIGUOUS)
        warnings.push(
          `Hay varios propietarios llamados "${(e.payee || "").trim()}": no sé quién cobró "${
            e.concept || "ingreso"
          }".`
        );
      return;
    }
    catTotals[categoryBucket(e.cat)] += amt;
  });

  const totalGastosBruto = Object.values(catTotals).reduce((a, b) => a + b, 0);
  const totalGastos = totalGastosBruto - totalIngresos;
  const precioVenta = Number((horse.sale && horse.sale.precio) || 0);
  const beneficioNeto = precioVenta - totalGastos;
  const totalPct = Math.round(owners.reduce((s, o) => s + Number(o.pct || 0), 0) * 100) / 100;

  let gastosNoAsignados = 0;
  let gastosConReparto = 0;
  expenses.forEach((e) => {
    const ec = expenseCategoryById(e.cat);
    if (ec.d !== "out") return;
    const amt = Number(e.amount || 0);
    const sp = expSplitsForDisplay(e);
    if (sp.length) {
      gastosConReparto += amt;
      const amounts = distributeShares(amt, sp.map((x) => x.pct));
      sp.forEach((x, i) => {
        const idx = resolveOwnerIndex(ownerNames, x.name);
        const v = amounts[i];
        if (idx >= 0) {
          gastosPorPropietario[idx] += v;
          gastosPorReparto[idx] += v;
        } else {
          if (idx === OWNER_AMBIGUOUS)
            warnings.push(
              `Hay varios propietarios llamados "${(x.name || "").trim()}": su parte de "${
                e.concept || "gasto"
              }" queda sin asignar.`
            );
          gastosNoAsignados += v;
        }
      });
      return;
    }
    const pagadorIdx = resolveOwnerIndex(ownerNames, e.payer);
    if (pagadorIdx >= 0) {
      gastosPorPropietario[pagadorIdx] += amt;
    } else {
      if (pagadorIdx === OWNER_AMBIGUOUS)
        warnings.push(
          `Hay varios propietarios llamados "${(e.payer || "").trim()}": "${
            e.concept || "gasto"
          }" se imputa por % de propiedad.`
        );
      const amounts = distributeShares(amt, owners.map((o) => Number(o.pct || 0)));
      owners.forEach((_o, i) => {
        gastosPorPropietario[i] += amounts[i];
        gastosPorDefecto[i] += amounts[i];
      });
      gastosNoAsignados += amt;
    }
  });

  const ownerBreakdown = owners.map((o, i) => {
    const pct = Number(o.pct || 0);
    const gastosAsignados = gastosPorPropietario[i] || 0;
    const gastosRepartidos = gastosPorReparto[i] || 0;
    const gastosProrrata = gastosPorDefecto[i] || 0;
    const ingresosRecibidos = ingresosPorPropietario[i] || 0;
    const ventaBruta = (precioVenta * pct) / 100;
    const ingresosTeoricos = (totalIngresos * pct) / 100;
    const totalRecibe = ventaBruta - gastosAsignados + ingresosTeoricos - ingresosRecibidos;
    return {
      index: i,
      nombre: o.nombre,
      pct,
      gastosAsignados,
      gastosRepartidos,
      gastosProrrata,
      ingresosRecibidos,
      ventaBruta,
      ingresosTeoricos,
      totalRecibe,
    };
  });

  return {
    catTotals,
    totalIngresos,
    totalGastos,
    precioVenta,
    beneficioNeto,
    owners,
    totalPct,
    ownerBreakdown,
    gastosNoAsignados,
    gastosConReparto,
    warnings,
  };
}
