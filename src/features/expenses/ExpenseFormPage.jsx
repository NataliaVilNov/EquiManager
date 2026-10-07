import { useId, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStableData } from "../../hooks/useStableData.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { useToast } from "../../hooks/useToast.js";
import { uid } from "../../lib/id.js";
import { td } from "../../lib/date.js";
import { EK } from "../../lib/constants.js";
import { defaultExpenseSplitsForHorse, distributeShares, equalSplitPcts } from "./expenseSplits.js";
import { canViewHorseInfo } from "../horses/horseAccess.js";
import { AccessLimited } from "../../components/AccessLimited.jsx";

const STATUSES = [
  { id: "pendiente", label: "Pendiente" },
  { id: "pagado", label: "Pagado" },
  { id: "parcial", label: "Parcial" },
];

// Ports rNE (public/legacy-app.js:2069-2130) and the expense-save handler
// (public/legacy-app.js:3713-3730). Deviates from legacy in one small way: the new-expense
// category default is EK[0].id ("vet") instead of legacy's mismatched literal "servicio"
// (which doesn't match any EK id, so no pill actually shows as selected until clicked) —
// see docs/components/expenses.md.
//
// Este componente exterior solo ESPERA los datos: `horses`/`expenses` arrancan vacíos y se
// llenan con el primer snapshot, así que al entrar directo a la URL de edición (recarga o
// enlace) el formulario sembraba su useState con valores por defecto vacíos y al pulsar
// Guardar escribía ESO encima del gasto real (amount 0, splits []). El formulario de verdad
// se monta aparte y con `key`, de modo que sus inicializadores corren una sola vez y ya con
// los datos reales (y se reinician al navegar entre dos gastos distintos de esta ruta).
export function ExpenseFormPage() {
  const { hid, eid } = useParams();
  const { horses, expenses, isLoaded } = useStableData();
  const { isAdmin, uid: myUid } = usePermissions();

  if (!isLoaded("horses", "expenses")) {
    return (
      <div className="view">
        <div className="ld">
          <div className="sp"></div>
          <p>Cargando gasto...</p>
        </div>
      </div>
    );
  }

  const horse = horses.find((h) => h.id === hid);
  const expense = eid ? expenses.find((e) => e.id === eid) : null;

  if (!horse) {
    return (
      <div className="view">
        <p>No encontrado.</p>
      </div>
    );
  }
  if (!canViewHorseInfo(horse, isAdmin, myUid)) {
    return <AccessLimited />;
  }
  if (eid && !expense) {
    return (
      <div className="view">
        <p>Gasto no encontrado.</p>
      </div>
    );
  }

  return <ExpenseForm key={`${hid}:${eid || "new"}`} horse={horse} expense={expense} />;
}

function ExpenseForm({ horse, expense }) {
  const hid = horse.id;
  const editing = !!expense;
  const { addExpense, updateExpense, deleteExpense } = useStableData();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fid = useId();

  const [cat, setCat] = useState(expense ? expense.cat : EK[0].id);
  const [concept, setConcept] = useState(expense ? expense.concept || "" : "");
  const [amount, setAmount] = useState(expense ? expense.amount : "");
  const [date, setDate] = useState(expense ? expense.date : td());
  const [payer, setPayer] = useState(expense ? expense.payer || "" : "");
  const [payee, setPayee] = useState(expense ? expense.payee || "" : "");
  const [status, setStatus] = useState(expense ? expense.status : "pendiente");
  const [notes, setNotes] = useState(expense ? expense.notes || "" : "");
  const [useSplits, setUseSplits] = useState(
    !!(expense && Array.isArray(expense.splits) && expense.splits.length)
  );
  const [splits, setSplits] = useState(() => defaultExpenseSplitsForHorse(horse, expense));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const direction = (EK.find((c) => c.id === cat) || {}).d || "out";
  const owners =
    horse.owners && horse.owners.length ? horse.owners : horse.owner ? [{ nombre: horse.owner, pct: 100 }] : [];
  const payerMatchesOwner = owners.some((o) => (o.nombre || "") === payer);
  const splitTotal = splits.reduce((s, x) => s + (Number(x.pct) || 0), 0);
  const splitWarn = useSplits && splits.length > 1 && Math.abs(splitTotal - 100) > 0.5;
  const splitAmounts = distributeShares(amount, splits.map((s) => s.pct));

  function handleBack() {
    navigate(`/horses/${hid}?tab=gastos`);
  }

  function updateSplit(i, field, value) {
    setSplits((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  // Redondear 100/n por separado nunca sumaba 100 salvo para unos pocos n (3 → 33+33+33=99,
  // 6 → 102, 8 → 104) y el propio submit rechazaba el reparto recién generado. Ahora el
  // resto se acumula en la primera cuota, así que el reparto suma exactamente 100%.
  function handleEqualSplit() {
    setSplits((prev) => {
      const pcts = equalSplitPcts(prev.length);
      return prev.map((s, i) => ({ ...s, pct: pcts[i] }));
    });
  }

  async function handleSubmit() {
    if (saving) return;
    const trimmedConcept = concept.trim();
    if (!trimmedConcept) {
      setError("Concepto obligatorio");
      showToast("Concepto obligatorio");
      return;
    }
    let finalSplits = [];
    if (useSplits) {
      finalSplits = splits
        .map((s) => ({ name: (s.name || "").trim(), pct: Number(s.pct) || 0 }))
        .filter((s) => s.name && s.pct > 0);
      const total = finalSplits.reduce((s, x) => s + x.pct, 0);
      if (Math.abs(total - 100) > 0.5) {
        setError("El reparto debe sumar 100%");
        showToast("El reparto debe sumar 100%");
        return;
      }
    }
    const id = editing ? expense.id : uid();
    const record = {
      id,
      createdBy: null,
      hid,
      concept: trimmedConcept,
      amount: Number(amount) || 0,
      date: date || td(),
      cat,
      payer,
      payee: payee.trim(),
      status,
      notes: notes.trim(),
      splits: finalSplits,
    };
    setError("");
    setSaving(true);
    try {
      // El aviso de éxito y la navegación iban ANTES de saber si la escritura había salido
      // bien: sin conexión (o con las reglas rechazando) el usuario veía "Gasto añadido" y
      // aterrizaba en una lista sin la fila. Ahora se espera la promesa del mutador.
      if (editing) await updateExpense(record);
      else await addExpense(record);
      showToast(editing ? "Actualizado" : "Gasto añadido");
      handleBack();
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo guardar el gasto. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving) return;
    if (!window.confirm("¿Eliminar este gasto?")) return;
    setError("");
    setSaving(true);
    try {
      await deleteExpense(expense.id);
      showToast("Gasto eliminado");
      handleBack();
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo eliminar el gasto. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="view">
      <div className="vh">
        <button className="ib" onClick={handleBack} aria-label="Volver a los gastos del caballo">
          ←
        </button>
        <h1>
          {editing ? "Editar" : "Nuevo"} gasto · {horse.name}
        </h1>
      </div>
      <div className="f">
        <label id={`${fid}-cat-label`}>Categoría</label>
        <div className="og og3" role="group" aria-labelledby={`${fid}-cat-label`}>
          {EK.map((c) => (
            <button
              type="button"
              key={c.id}
              className={"oo" + (cat === c.id ? " active" : "")}
              aria-pressed={cat === c.id}
              onClick={() => setCat(c.id)}
            >
              <span className="ic" aria-hidden="true">
                {c.i}
              </span>
              {c.l}
            </button>
          ))}
        </div>
      </div>
      <div className="f">
        <label htmlFor={`${fid}-concept`}>Concepto</label>
        <input
          id={`${fid}-concept`}
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Pensión mensual, Herrador..."
        />
      </div>
      <div className="r2">
        <div className="f">
          <label htmlFor={`${fid}-amount`}>Importe (€)</label>
          <input
            id={`${fid}-amount`}
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="f">
          <label htmlFor={`${fid}-date`}>Fecha</label>
          <input id={`${fid}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {splits.length > 0 && (
        <div className="card" style={{ padding: ".75rem", marginBottom: ".85rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: ".6rem",
              marginBottom: ".55rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: ".7rem",
                  fontWeight: 700,
                  color: "var(--gr)",
                  textTransform: "uppercase",
                  letterSpacing: ".07em",
                }}
              >
                <span aria-hidden="true">👥</span> Reparto del gasto
              </div>
              <div style={{ fontSize: ".72rem", color: "var(--gr)", marginTop: ".1rem" }}>
                Para gastos compartidos: mitad, porcentajes entre propietarios, etc.
              </div>
            </div>
            <label
              htmlFor={`${fid}-usesplits`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".35rem",
                fontSize: ".72rem",
                color: "var(--vd)",
                fontWeight: 700,
                margin: 0,
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              <input
                id={`${fid}-usesplits`}
                type="checkbox"
                checked={useSplits}
                onChange={(e) => setUseSplits(e.target.checked)}
                style={{ width: "auto" }}
              />{" "}
              Repartir
            </label>
          </div>
          {useSplits && (
            <div>
              {splits.map((sp, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 76px 82px",
                    gap: ".45rem",
                    alignItems: "center",
                    marginBottom: ".45rem",
                  }}
                >
                  <input
                    id={`${fid}-split-name-${i}`}
                    aria-label={`Nombre del reparto ${i + 1}`}
                    value={sp.name || ""}
                    placeholder="Nombre"
                    onChange={(e) => updateSplit(i, "name", e.target.value)}
                    style={{ fontSize: ".82rem", padding: ".45rem .55rem" }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "var(--ar)",
                      borderRadius: "8px",
                      padding: ".22rem .45rem",
                    }}
                  >
                    <input
                      id={`${fid}-split-pct-${i}`}
                      aria-label={`Porcentaje del reparto ${i + 1}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={sp.pct ?? 0}
                      onChange={(e) => updateSplit(i, "pct", Number(e.target.value) || 0)}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: ".2rem .1rem",
                        fontSize: ".82rem",
                        fontWeight: 700,
                        textAlign: "right",
                      }}
                    />
                    <span style={{ fontSize: ".75rem", color: "var(--gr)", fontWeight: 700 }}>%</span>
                  </div>
                  <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--vd)", textAlign: "right" }}>
                    {splitAmounts[i].toFixed(2)}€
                  </div>
                </div>
              ))}
              {splitWarn && (
                <div style={{ fontSize: ".72rem", color: "var(--am)", fontWeight: 700, marginTop: ".25rem" }}>
                  <span aria-hidden="true">⚠️</span> El reparto suma {splitTotal.toFixed(2)}%. Debe sumar 100%.
                </div>
              )}
              <button type="button" className="btn btg btsm" onClick={handleEqualSplit}>
                Repartir a partes iguales
              </button>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ padding: ".75rem", marginBottom: ".85rem" }}>
        <div
          style={{
            fontSize: ".7rem",
            fontWeight: 700,
            color: "var(--gr)",
            textTransform: "uppercase",
            letterSpacing: ".07em",
            marginBottom: ".5rem",
          }}
        >
          {direction === "in" ? "INGRESO: ¿Quién paga?" : "GASTO: ¿A quién?"}
        </div>
        <div className="r2">
          <div className="f">
            <label htmlFor={`${fid}-payer`}>{direction === "in" ? "De (propietario)" : "De (cuadra)"}</label>
            {owners.length ? (
              <>
                <select
                  id={`${fid}-payer`}
                  value={payerMatchesOwner ? payer : ""}
                  onChange={(e) => setPayer(e.target.value)}
                  style={{ marginBottom: ".35rem" }}
                >
                  <option value="">— Otro / Escribir —</option>
                  {owners.map((o, i) => (
                    <option key={i} value={o.nombre || ""}>
                      {o.nombre || ""} ({o.pct}%)
                    </option>
                  ))}
                </select>
                {!payerMatchesOwner && (
                  <input
                    id={`${fid}-payer-other`}
                    aria-label="Otro pagador"
                    value={payer}
                    onChange={(e) => setPayer(e.target.value)}
                    placeholder="Otro pagador..."
                  />
                )}
              </>
            ) : (
              <input
                id={`${fid}-payer`}
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                placeholder={direction === "in" ? "Ej: María Pérez" : "Cuadra Vilela"}
              />
            )}
          </div>
          <div className="f">
            <label htmlFor={`${fid}-payee`}>{direction === "in" ? "A (cuadra)" : "A (proveedor)"}</label>
            <input
              id={`${fid}-payee`}
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              placeholder={direction === "in" ? "Cuadra Vilela" : "Ej: Herrador José"}
            />
          </div>
        </div>
      </div>

      <div className="f">
        <label id={`${fid}-status-label`}>Estado</label>
        <div className="og og3" role="group" aria-labelledby={`${fid}-status-label`}>
          {STATUSES.map((s) => (
            <button
              type="button"
              key={s.id}
              className={"oo" + (status === s.id ? " active" : "")}
              aria-pressed={status === s.id}
              onClick={() => setStatus(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="f">
        <label htmlFor={`${fid}-notes`}>Notas</label>
        <textarea id={`${fid}-notes`} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && (
        <div role="alert" style={{ fontSize: ".78rem", color: "var(--ro)", marginBottom: ".6rem" }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gap: ".42rem" }}>
        <button type="button" className="btn bts btbl" onClick={handleSubmit} disabled={saving}>
          {saving ? "Guardando…" : editing ? "Guardar cambios" : "Añadir gasto"}
        </button>
        {editing && can("expenses") && (
          <button type="button" className="btn btr btbl" onClick={handleDelete} disabled={saving}>
            Eliminar gasto
          </button>
        )}
      </div>
    </div>
  );
}
