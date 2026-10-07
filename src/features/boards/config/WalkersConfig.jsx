import { useState } from "react";
import { useStableData } from "../../../hooks/useStableData.js";
import { uid } from "../../../lib/id.js";
import { SlotListEditor } from "./SlotListEditor.jsx";

const EMPTY_FORM = { name: "", capacity: 4, slots: [] };

// Ports addWalker/editWalker/deleteWalker (public/legacy-app.js:1462-1464), replacing
// legacy's chained prompt() calls (name, then capacity, then a comma-separated slot list
// via promptSlots) with a real inline form — see SlotListEditor.jsx for how this also
// structurally fixes the slot-id-regeneration bug documented in docs/components/boards.md.
export function WalkersConfig() {
  const { boardConfig, addWalker, updateWalker, deleteWalker } = useStableData();
  const [editingId, setEditingId] = useState(null); // null = closed, "new" = adding
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function startAdd() {
    setForm(EMPTY_FORM);
    setError("");
    setEditingId("new");
  }
  function startEdit(w) {
    setForm({ name: w.name, capacity: w.capacity, slots: w.slots });
    setError("");
    setEditingId(w.id);
  }
  function cancel() {
    setError("");
    setEditingId(null);
  }
  // Antes: un nombre vacío cancelaba el guardado sin decir nada, los horarios incompletos
  // se tiraban en silencio y una capacidad borrada o 0 se convertía calladamente en 4.
  // Ahora cada caso se valida y se avisa en castellano.
  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    const name = form.name.trim();
    if (!name) {
      setError("Escribe un nombre para el caminador.");
      return;
    }
    const rawCapacity = String(form.capacity ?? "").trim();
    const capacity = Number(rawCapacity);
    if (!rawCapacity || !Number.isFinite(capacity) || !Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
      setError("El número de huecos debe ser un número entero entre 1 y 20.");
      return;
    }
    const isTime = (v) => /^\d{2}:\d{2}$/.test(v || "");
    const incomplete = form.slots.filter((s) => !isTime(s.start) || !isTime(s.end));
    if (incomplete.length) {
      setError(
        incomplete.length === 1
          ? "Hay un horario sin hora de inicio o de fin. Complétalo o bórralo."
          : `Hay ${incomplete.length} horarios sin hora de inicio o de fin. Complétalos o bórralos.`
      );
      return;
    }
    const invertido = form.slots.filter((s) => s.end <= s.start);
    if (invertido.length) {
      setError("La hora de fin de cada horario debe ser posterior a la de inicio.");
      return;
    }
    const slots = form.slots.map((s) => (s.id ? s : { ...s, id: uid() }));
    setError("");
    setSaving(true);
    try {
      if (editingId === "new") await addWalker(name, capacity, slots);
      else await updateWalker(editingId, { name, capacity, slots });
      setEditingId(null);
    } catch (err) {
      setError((err && err.message) || "No se pudo guardar el caminador. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }
  function remove(id) {
    if (!window.confirm("¿Eliminar este caminador?")) return;
    deleteWalker(id);
  }

  return (
    <section className="config-section">
      <div className="section-title">
        <div>
          <h2>Caminadores</h2>
          <p>Cada caminador puede tener sus propios huecos y horarios.</p>
        </div>
        {editingId === null && (
          <button className="btn btsm" onClick={startAdd}>
            + Añadir
          </button>
        )}
      </div>

      {editingId !== null && (
        <form className="card" style={{ padding: ".85rem", marginBottom: ".75rem" }} onSubmit={submit}>
          <div className="fcol">
            <label htmlFor="walker-name">Nombre</label>
            <input
              id="walker-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Caminador principal"
            />
          </div>
          <div className="fcol">
            <label htmlFor="walker-capacity">Número de huecos</label>
            <input
              id="walker-capacity"
              type="number"
              min="1"
              max="20"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </div>
          <label>Horarios</label>
          <SlotListEditor slots={form.slots} onChange={(slots) => setForm({ ...form, slots })} />
          {error && (
            <div role="alert" style={{ fontSize: ".75rem", color: "var(--ro)", marginTop: ".5rem" }}>
              {error}
            </div>
          )}
          <div className="r2" style={{ marginTop: ".6rem" }}>
            <button type="button" className="btn btg btsm" onClick={cancel} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btsm btbl" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {boardConfig.walkers.length ? (
        boardConfig.walkers.map((w) => (
          <div className="config-card" key={w.id}>
            <div className="config-card-head">
              <div>
                <b>{w.name}</b>
                <small>{w.capacity} huecos</small>
              </div>
              <div>
                <button className="btn btg btsm" onClick={() => startEdit(w)}>
                  Editar
                </button>
                <button className="db" onClick={() => remove(w.id)} aria-label={`Eliminar ${w.name}`}>
                  ×
                </button>
              </div>
            </div>
            <div className="slot-list">
              {w.slots.length ? (
                w.slots.map((s) => (
                  <span key={s.id}>
                    {s.start}–{s.end}
                  </span>
                ))
              ) : (
                <small>Sin horarios</small>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-soft">
          <span>C</span>
          <div>
            <b>Sin caminadores</b>
            <p>Añade el primero cuando quieras.</p>
          </div>
        </div>
      )}
    </section>
  );
}
