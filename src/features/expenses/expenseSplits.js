import { expenseCategoryById } from "../../lib/constants.js";

// Ports expSplitsForDisplay/splitAmount/expenseSplitSummary/defaultExpenseSplitsForHorse/
// ownerListForHorse/ownerKeyName/expenseIsOut/settlementCandidateExpenses/calcOwnerSettlement
// (public/legacy-app.js:894-953). All take explicit params instead of reading the global D.

export function expSplitsForDisplay(e) {
  return e && Array.isArray(e.splits) ? e.splits.filter((x) => x && Number(x.pct || 0) > 0) : [];
}

// Importe de UNA cuota aislada, redondeado a céntimos. Sigue siendo útil para mostrar una
// cuota suelta, pero NO debe usarse para repartir un gasto entre varias cuotas: redondear
// cada parte por separado hace que las partes no sumen el total (10€ al 33,33/33,33/33,34
// daban 9,99€). Para eso está distributeShares.
export function splitAmount(total, pct) {
  return Math.round((Number(total) || 0) * (Number(pct) || 0)) / 100;
}

// Reparte `total` entre las cuotas `pcts` trabajando en CÉNTIMOS ENTEROS: cada cuota recibe
// sus céntimos truncados y los céntimos sobrantes se asignan de mayor a menor resto (método
// del resto mayor), así que la suma de las partes coincide EXACTAMENTE con el importe
// repartido — el total completo cuando las cuotas suman 100%. Devuelve euros.
export function distributeShares(total, pcts) {
  const list = (pcts || []).map((p) => Number(p) || 0);
  const cents = Math.round((Number(total) || 0) * 100);
  const sumPct = list.reduce((a, b) => a + b, 0);
  if (!cents || !sumPct) return list.map(() => 0);
  const targetCents = Math.round((cents * sumPct) / 100);
  const raw = list.map((p) => (cents * p) / 100);
  const out = raw.map((v) => Math.floor(v));
  let rest = targetCents - out.reduce((a, b) => a + b, 0);
  const order = out
    .map((_, i) => i)
    .sort((a, b) => raw[b] - out[b] - (raw[a] - out[a]) || raw[b] - raw[a] || a - b);
  for (let k = 0; rest > 0 && k < order.length; k++, rest--) out[order[k]] += 1;
  return out.map((c) => c / 100);
}

// Porcentajes de un reparto a partes iguales que suman EXACTAMENTE 100: cada cuota recibe
// la centésima de punto truncada y el resto se acumula en la primera (3 → 33,34/33,33/33,33).
// Antes se redondeaba cada cuota por separado (100/3 → 33 tres veces = 99%) y el propio
// formulario rechazaba el reparto que acababa de generar.
export function equalSplitPcts(n) {
  const count = Math.max(0, Math.floor(Number(n) || 0));
  if (!count) return [];
  const base = Math.floor(10000 / count);
  const pcts = new Array(count).fill(base / 100);
  pcts[0] = (base + (10000 - base * count)) / 100;
  return pcts;
}

export function expenseSplitSummary(e) {
  const sp = expSplitsForDisplay(e);
  if (!sp.length) return "";
  const amounts = distributeShares(e && e.amount, sp.map((x) => x.pct));
  return sp
    .map((x, i) => `${x.name || ""} ${Number(x.pct || 0)}% (${amounts[i].toFixed(2)}€)`)
    .join(" · ");
}

export function defaultExpenseSplitsForHorse(h, e) {
  if (e && Array.isArray(e.splits) && e.splits.length) return e.splits;
  const owners = h && h.owners && h.owners.length ? h.owners : h && h.owner ? [{ nombre: h.owner, pct: 100 }] : [];
  return owners.map((o) => ({ name: o.nombre || "", pct: Number(o.pct || 0) }));
}

export function ownerListForHorse(h) {
  return h && h.owners && h.owners.length
    ? h.owners.map((o) => ({ name: o.nombre || o.name || "", pct: Number(o.pct || 0) }))
    : h && h.owner
    ? [{ name: h.owner, pct: 100 }]
    : [];
}

export function ownerKeyName(n) {
  return (n || "").trim().toLowerCase();
}

// Los mapas por propietario se indexaban por nombre normalizado: dos propietarios llamados
// "Juan" (o dos sin nombre, ambos con clave "") compartían un mismo apunte, de modo que un
// gasto se sumaba dos veces a la misma clave y luego AMBAS filas leían el total entero.
// Ahora la clave es la POSICIÓN del propietario y los nombres de repartos/pagadores se
// resuelven a esa posición; un nombre que no identifica a un único propietario no se imputa
// a nadie (queda avisado) en vez de cobrarse dos veces.
export const OWNER_UNMATCHED = -1;
export const OWNER_AMBIGUOUS = -2;

export function resolveOwnerIndex(ownerNames, name) {
  const key = ownerKeyName(name);
  if (!key) return OWNER_UNMATCHED;
  const hits = [];
  (ownerNames || []).forEach((n, i) => {
    if (ownerKeyName(n) === key) hits.push(i);
  });
  if (!hits.length) return OWNER_UNMATCHED;
  if (hits.length > 1) return OWNER_AMBIGUOUS;
  return hits[0];
}

// Nombres repetidos (o en blanco) entre los propietarios de un caballo: no se pueden
// distinguir en un reparto, así que la interfaz debe avisar antes de guardar.
export function duplicateOwnerNames(owners) {
  const seen = {};
  const dups = [];
  (owners || []).forEach((o) => {
    const key = ownerKeyName(o && (o.nombre || o.name));
    if (!key) return;
    seen[key] = (seen[key] || 0) + 1;
    if (seen[key] === 2) dups.push((o.nombre || o.name || "").trim());
  });
  return dups;
}

export function expenseIsOut(e) {
  return expenseCategoryById(e && e.cat).d === "out";
}

export function settlementCandidateExpenses(expenses, hid, includeSettled = false) {
  return (expenses || []).filter((e) => e.hid === hid && expenseIsOut(e) && (includeSettled || !e.settled));
}

export function calcOwnerSettlement(horse, expenses, ids) {
  const owners = ownerListForHorse(horse);
  const ownerNames = owners.map((o) => o.name);
  // Un apunte por POSICIÓN de propietario, no por nombre (ver nota sobre nombres repetidos).
  const rows = owners.map((o, i) => ({
    key: String(i),
    index: i,
    name: o.name,
    pct: o.pct,
    paid: 0,
    owed: 0,
    balance: 0,
  }));
  const warnings = [];
  const dups = duplicateOwnerNames(owners);
  if (dups.length) {
    warnings.push(
      `Hay varios propietarios con el mismo nombre (${dups.join(", ")}) en la ficha del caballo: no se pueden distinguir en los repartos. Renómbralos para que el ajuste sea correcto.`
    );
  }
  if (owners.some((o) => !ownerKeyName(o.name))) {
    warnings.push("Hay propietarios sin nombre en la ficha del caballo: sus partes no se pueden imputar.");
  }
  let total = 0;
  const used = [];
  (expenses || [])
    .filter((e) => ids.includes(e.id))
    .forEach((e) => {
      const amt = Number(e.amount || 0);
      if (!amt || !expenseIsOut(e)) return;
      total += amt;
      used.push(e);
      const payerIdx = resolveOwnerIndex(ownerNames, e.payer);
      if (payerIdx >= 0) rows[payerIdx].paid += amt;
      else if (payerIdx === OWNER_AMBIGUOUS)
        warnings.push(
          `Hay varios propietarios llamados "${(e.payer || "").trim()}": no sé quién pagó "${e.concept || "gasto"}".`
        );
      else
        warnings.push(`No encuentro pagador propietario para "${e.concept || "gasto"}" (${e.payer || "sin pagador"}).`);
      let shares = expSplitsForDisplay(e)
        .map((x) => ({ name: x.name, pct: Number(x.pct || 0) }))
        .filter((x) => x.name && x.pct > 0);
      if (!shares.length) shares = owners.map((o) => ({ name: o.name, pct: Number(o.pct || 0) }));
      const sum = shares.reduce((a, b) => a + Number(b.pct || 0), 0);
      if (Math.abs(sum - 100) > 0.5) warnings.push(`El reparto de "${e.concept || "gasto"}" suma ${sum.toFixed(0)}%.`);
      const amounts = distributeShares(amt, shares.map((x) => x.pct));
      shares.forEach((sh, i) => {
        const idx = resolveOwnerIndex(ownerNames, sh.name);
        if (idx >= 0) rows[idx].owed += amounts[i];
        else if (idx === OWNER_AMBIGUOUS)
          warnings.push(
            `Hay varios propietarios llamados "${(sh.name || "").trim()}": no puedo imputar su parte de "${
              e.concept || "gasto"
            }".`
          );
        else warnings.push(`No encuentro propietario "${sh.name}" en el reparto de "${e.concept || "gasto"}".`);
      });
    });
  rows.forEach((o) => {
    o.paid = Math.round(o.paid * 100) / 100;
    o.owed = Math.round(o.owed * 100) / 100;
    o.balance = Math.round((o.paid - o.owed) * 100) / 100;
  });
  const debtors = rows
    .filter((o) => o.balance < -0.01)
    .map((o) => ({ ...o, amount: -o.balance }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = rows
    .filter((o) => o.balance > 0.01)
    .map((o) => ({ ...o, amount: o.balance }))
    .sort((a, b) => b.amount - a.amount);
  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const v = Math.round(Math.min(debtors[i].amount, creditors[j].amount) * 100) / 100;
    if (v > 0.01) transfers.push({ from: debtors[i].name, to: creditors[j].name, amount: v });
    debtors[i].amount = Math.round((debtors[i].amount - v) * 100) / 100;
    creditors[j].amount = Math.round((creditors[j].amount - v) * 100) / 100;
    if (debtors[i].amount <= 0.01) i++;
    if (creditors[j].amount <= 0.01) j++;
  }
  return { owners: rows, warnings, total, used, transfers };
}
