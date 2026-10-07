import { useId, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStableData } from "../../hooks/useStableData.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { useToast } from "../../hooks/useToast.js";
import { uid } from "../../lib/id.js";
import { td } from "../../lib/date.js";
import { HK } from "../../lib/constants.js";

// Ports rNH (public/legacy-app.js:1995-2027). The route-level PermissionRoute("health")
// replaces requirePermissionView.
//
// Este componente exterior solo espera a que lleguen los datos: sembrar el useState con
// `health` todavía vacío (recarga o enlace directo a la URL de edición) hacía que Guardar
// escribiera los valores por defecto encima del registro real.
export function HealthFormPage() {
  const { hid, eid } = useParams();
  const { horses, health, isLoaded } = useStableData();

  if (!isLoaded("horses", "health")) {
    return (
      <div className="view">
        <div className="ld">
          <div className="sp"></div>
          <p>Cargando registro...</p>
        </div>
      </div>
    );
  }

  const horse = horses.find((h) => h.id === hid);
  const record = eid ? health.find((r) => r.id === eid) : null;

  if (!horse) {
    return (
      <div className="view">
        <p>No encontrado.</p>
      </div>
    );
  }
  if (eid && !record) {
    return (
      <div className="view">
        <p>Registro no encontrado.</p>
      </div>
    );
  }

  return <HealthForm key={`${hid}:${eid || "new"}`} horse={horse} record={record} />;
}

function HealthForm({ horse, record }) {
  const hid = horse.id;
  const editing = !!record;
  const { addHealthRecord, updateHealthRecord, deleteHealthRecord } = useStableData();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fid = useId();

  const [type, setType] = useState(record ? record.type : "herraje");
  const [label, setLabel] = useState(record ? record.label || "" : "");
  const [date, setDate] = useState(record ? record.date : td());
  const [nxt, setNxt] = useState(record && record.nxt ? record.nxt : "");
  const [notes, setNotes] = useState(record ? record.notes || "" : "");
  const [amount, setAmount] = useState(record && record.amount ? record.amount : "");
  const [payStatus, setPayStatus] = useState(record ? record.payStatus || "pendiente" : "pendiente");
  const [payee, setPayee] = useState(record ? record.payee || "" : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleBack() {
    navigate(`/horses/${hid}?tab=salud`);
  }

  async function handleSubmit() {
    if (saving) return;
    const rec = {
      id: editing ? record.id : uid(),
      hid,
      type,
      label: label.trim(),
      date: date || td(),
      nxt: nxt || null,
      notes: notes.trim(),
      amount: Number(amount) || 0,
      payStatus,
      payee: payee.trim(),
    };
    setError("");
    setSaving(true);
    try {
      if (editing) await updateHealthRecord(rec);
      else await addHealthRecord(rec);
      showToast(editing ? "Guardado" : "Registro añadido");
      handleBack();
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo guardar el registro. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving) return;
    if (!window.confirm("¿Eliminar este registro sanitario?")) return;
    setError("");
    setSaving(true);
    try {
      await deleteHealthRecord(record.id);
      showToast("Registro eliminado");
      handleBack();
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo eliminar el registro. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="view">
      <div className="vh">
        <button className="ib" onClick={handleBack} aria-label="Volver a la salud del caballo">
          ←
        </button>
        <h1>
          {editing ? "Editar" : "Nuevo"} registro · {horse.name}
        </h1>
      </div>
      <div className="f">
        <label id={`${fid}-type-label`}>Tipo</label>
        <div className="og og4" role="group" aria-labelledby={`${fid}-type-label`}>
          {HK.map((ht) => (
            <button
              type="button"
              key={ht.id}
              className={"oo" + (type === ht.id ? " active" : "")}
              aria-pressed={type === ht.id}
              onClick={() => setType(ht.id)}
            >
              <span className="ic" aria-hidden="true">
                {ht.i}
              </span>
              {ht.l}
            </button>
          ))}
        </div>
      </div>
      <div className="f">
        <label htmlFor={`${fid}-label`}>Descripción / Producto</label>
        <input
          id={`${fid}-label`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ivermectina, Vacuna..."
        />
      </div>
      <div className="r2">
        <div className="f">
          <label htmlFor={`${fid}-date`}>Fecha realizado</label>
          <input id={`${fid}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="f">
          <label htmlFor={`${fid}-nxt`}>Próxima vez</label>
          <input id={`${fid}-nxt`} type="date" value={nxt} onChange={(e) => setNxt(e.target.value)} />
        </div>
      </div>
      <div className="f">
        <label htmlFor={`${fid}-notes`}>Notas</label>
        <textarea id={`${fid}-notes`} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="card" style={{ padding: ".75rem", marginBottom: ".85rem" }}>
        <div
          style={{
            fontSize: ".7rem",
            fontWeight: 700,
            color: "var(--gr)",
            textTransform: "uppercase",
            letterSpacing: ".07em",
            marginBottom: ".6rem",
          }}
        >
          <span aria-hidden="true">💰</span> Gasto asociado (opcional)
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
            <label htmlFor={`${fid}-paystatus`}>Estado del pago</label>
            <select id={`${fid}-paystatus`} value={payStatus} onChange={(e) => setPayStatus(e.target.value)}>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="parcial">Parcial</option>
            </select>
          </div>
        </div>
        <div className="f" style={{ marginBottom: 0 }}>
          <label htmlFor={`${fid}-payee`}>Proveedor / A quién se paga</label>
          <input
            id={`${fid}-payee`}
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="Ej: Veterinario García, Herrador José..."
          />
        </div>
      </div>
      {error && (
        <div role="alert" style={{ fontSize: ".78rem", color: "var(--ro)", marginBottom: ".6rem" }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gap: ".42rem" }}>
        <button type="button" className="btn bts btbl" onClick={handleSubmit} disabled={saving}>
          {saving ? "Guardando…" : editing ? "Guardar cambios" : "Añadir registro"}
        </button>
        {editing && can("deleteItems") && (
          <button type="button" className="btn btr btbl" onClick={handleDelete} disabled={saving}>
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
