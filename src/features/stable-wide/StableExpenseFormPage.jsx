import { useId, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStableData } from "../../hooks/useStableData.js";
import { useToast } from "../../hooks/useToast.js";
import { uid } from "../../lib/id.js";
import { td } from "../../lib/date.js";

const CATEGORIES = [
  { id: "material", label: "Material", icon: "🛒" },
  { id: "nomina", label: "Nómina", icon: "💼" },
  { id: "mantenimiento", label: "Mantenim.", icon: "🔧" },
  { id: "suministros", label: "Suministros", icon: "💡" },
  { id: "otro", label: "Otro", icon: "💸" },
];

const STATUSES = [
  { id: "pagado", label: "Pagado" },
  { id: "pendiente", label: "Pendiente" },
  { id: "parcial", label: "Parcial" },
];

// Ports rNCE (public/legacy-app.js:2313-2342).
//
// El componente exterior espera a que llegue `stableExpenses`: sembrar el useState con la
// colección todavía vacía (recarga o enlace directo a la URL de edición) hacía que Guardar
// escribiera los valores por defecto encima del gasto real.
export function StableExpenseFormPage() {
  const { eid } = useParams();
  const { stableExpenses, isLoaded } = useStableData();

  if (!isLoaded("stableExpenses")) {
    return (
      <div className="view">
        <div className="ld">
          <div className="sp"></div>
          <p>Cargando gasto...</p>
        </div>
      </div>
    );
  }

  const expense = eid ? stableExpenses.find((e) => e.id === eid) : null;

  if (eid && !expense) {
    return (
      <div className="view">
        <p>Gasto no encontrado.</p>
      </div>
    );
  }

  return <StableExpenseForm key={eid || "new"} expense={expense} />;
}

function StableExpenseForm({ expense }) {
  const editing = !!expense;
  const { addStableExpense, updateStableExpense, deleteStableExpense } = useStableData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fid = useId();

  const [cat, setCat] = useState(expense ? expense.cat : CATEGORIES[0].id);
  const [concept, setConcept] = useState(expense ? expense.concept || "" : "");
  const [payee, setPayee] = useState(expense ? expense.payee || "" : "");
  const [amount, setAmount] = useState(expense ? expense.amount : "");
  const [date, setDate] = useState(expense ? expense.date : td());
  const [status, setStatus] = useState(expense ? expense.status : "pendiente");
  const [notes, setNotes] = useState(expense ? expense.notes || "" : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleBack() {
    navigate("/cuadra?tab=gastos");
  }

  async function handleSubmit() {
    if (saving) return;
    const trimmedConcept = concept.trim();
    if (!trimmedConcept) {
      setError("Concepto obligatorio");
      showToast("Concepto obligatorio");
      return;
    }
    const record = {
      id: editing ? expense.id : uid(),
      concept: trimmedConcept,
      cat,
      amount: Number(amount) || 0,
      date: date || td(),
      payee: payee.trim(),
      status,
      notes: notes.trim(),
    };
    setError("");
    setSaving(true);
    try {
      if (editing) await updateStableExpense(record);
      else await addStableExpense(record);
      showToast(editing ? "Actualizado" : "Gasto añadido");
      handleBack();
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo guardar el gasto. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving) return;
    if (!window.confirm("¿Eliminar este gasto de cuadra?")) return;
    setError("");
    setSaving(true);
    try {
      await deleteStableExpense(expense.id);
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
        <button className="ib" onClick={handleBack} aria-label="Volver a los gastos de cuadra">
          ←
        </button>
        <h1>{editing ? "Editar" : "Nuevo"} gasto de cuadra</h1>
      </div>
      <div className="f">
        <label id={`${fid}-cat-label`}>Categoría</label>
        <div className="og og3" role="group" aria-labelledby={`${fid}-cat-label`}>
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              className={"oo" + (cat === c.id ? " active" : "")}
              aria-pressed={cat === c.id}
              onClick={() => setCat(c.id)}
            >
              <span className="ic" aria-hidden="true">
                {c.icon}
              </span>
              {c.label}
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
          placeholder="Jaboncillo, Sueldo..."
        />
      </div>
      {cat === "nomina" && (
        <div className="f">
          <label htmlFor={`${fid}-payee`}>Trabajador</label>
          <input
            id={`${fid}-payee`}
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="Laura García"
          />
        </div>
      )}
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
        {editing && (
          <button type="button" className="btn btr btbl" onClick={handleDelete} disabled={saving}>
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
