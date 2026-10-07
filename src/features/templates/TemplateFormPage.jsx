import { useId, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStableData } from "../../hooks/useStableData.js";
import { useToast } from "../../hooks/useToast.js";
import { uid } from "../../lib/id.js";
import { AK, activityById } from "../../lib/constants.js";

// Ports rETpl/addTT/saveTpl (public/legacy-app.js:3503-3551). The in-progress task list
// held in local component state replaces legacy's V._tt view-state field.
//
// El componente exterior espera a que llegue `taskTemplates`: con la colección vacía
// (recarga o enlace directo a la URL de edición) `[...tpl.tasks]` reventaba en cuanto la
// plantilla no traía el campo, y si lo traía vacío Guardar lo escribía encima del real.
export function TemplateFormPage() {
  const { tplid } = useParams();
  const { taskTemplates, isLoaded } = useStableData();

  if (!isLoaded("horses", "team", "taskTemplates")) {
    return (
      <div className="view">
        <div className="ld">
          <div className="sp"></div>
          <p>Cargando plantilla...</p>
        </div>
      </div>
    );
  }

  const tpl = tplid ? taskTemplates.find((t) => t.id === tplid) : null;

  if (tplid && !tpl) {
    return (
      <div className="view">
        <p>No encontrada.</p>
      </div>
    );
  }

  return <TemplateForm key={tplid || "new"} tpl={tpl} />;
}

function TemplateForm({ tpl }) {
  const editing = !!tpl;
  const { horses, team, addTemplate, updateTemplate, deleteTemplate } = useStableData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fid = useId();

  const [name, setName] = useState(tpl ? tpl.name || "" : "");
  // `tpl.tasks` puede faltar en plantillas antiguas: [...undefined] lanzaba una excepción y
  // tumbaba la pantalla entera.
  const [taskList, setTaskList] = useState(() => (tpl && Array.isArray(tpl.tasks) ? [...tpl.tasks] : []));

  const [newHid, setNewHid] = useState("");
  const [newActivity, setNewActivity] = useState(AK[0].id);
  const [newPid, setNewPid] = useState("");
  const [newDur, setNewDur] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleAddRow() {
    if (!newHid) {
      showToast("Selecciona un caballo");
      return;
    }
    setTaskList((prev) => [
      ...prev,
      { horseId: newHid, activity: newActivity, assignedTo: newPid || null, dur: Number(newDur) || 30 },
    ]);
  }

  function handleRemoveRow(i) {
    setTaskList((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (saving) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nombre obligatorio");
      showToast("Nombre obligatorio");
      return;
    }
    if (!taskList.length) {
      setError("Añade al menos una tarea");
      showToast("Añade al menos una tarea");
      return;
    }
    setError("");
    setSaving(true);
    try {
      if (editing) await updateTemplate({ id: tpl.id, name: trimmedName, tasks: taskList });
      else await addTemplate({ id: uid(), name: trimmedName, tasks: taskList });
      showToast("Plantilla guardada");
      navigate("/templates");
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo guardar la plantilla. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving) return;
    if (!window.confirm("¿Eliminar esta plantilla?")) return;
    setError("");
    setSaving(true);
    try {
      await deleteTemplate(tpl.id);
      showToast("Plantilla eliminada");
      navigate("/templates");
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo eliminar la plantilla. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="view">
      <div className="vh">
        <button className="ib" onClick={() => navigate("/templates")} aria-label="Volver a las plantillas">
          ←
        </button>
        <h1>{editing ? "Editar" : "Nueva"} plantilla</h1>
      </div>
      <div className="f">
        <label htmlFor={`${fid}-name`}>Nombre</label>
        <input
          id={`${fid}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Lunes habitual"
        />
      </div>
      <h2 style={{ fontSize: ".93rem", marginBottom: ".5rem" }}>Tareas</h2>
      <div>
        {taskList.length ? (
          taskList.map((t, i) => {
            const a = activityById(t.activity);
            const h = horses.find((x) => x.id === t.horseId);
            const m = team.find((x) => x.id === t.assignedTo);
            return (
              <div className="tkc" style={{ cursor: "default" }} key={i}>
                <div className="tkb">
                  <div className="tkt">
                    <span aria-hidden="true">{a.i}</span> {a.l} — {h ? h.name : "?"}
                  </div>
                  {m ? (
                    <span className="tka">
                      <span aria-hidden="true">{m.emoji || "👤"}</span> {m.name}
                    </span>
                  ) : (
                    <span style={{ fontSize: ".73rem", color: "var(--gr)" }}>Sin asignar</span>
                  )}
                </div>
                <button
                  type="button"
                  className="db"
                  onClick={() => handleRemoveRow(i)}
                  aria-label={`Quitar la tarea ${i + 1} de la plantilla`}
                >
                  ✕
                </button>
              </div>
            );
          })
        ) : (
          <p style={{ fontSize: ".78rem", color: "var(--gr)", marginBottom: ".7rem" }}>Sin tareas.</p>
        )}
      </div>
      <div className="card" style={{ borderStyle: "dashed", padding: ".8rem" }}>
        <div className="r2">
          <div className="f">
            <label htmlFor={`${fid}-newhid`}>Caballo</label>
            <select id={`${fid}-newhid`} value={newHid} onChange={(e) => setNewHid(e.target.value)}>
              <option value="">Caballo...</option>
              {horses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div className="f">
            <label htmlFor={`${fid}-newactivity`}>Actividad</label>
            <select id={`${fid}-newactivity`} value={newActivity} onChange={(e) => setNewActivity(e.target.value)}>
              {AK.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.i} {a.l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="r2">
          <div className="f">
            <label htmlFor={`${fid}-newpid`}>Persona</label>
            <select id={`${fid}-newpid`} value={newPid} onChange={(e) => setNewPid(e.target.value)}>
              <option value="">Sin asignar</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.emoji || "👤"} {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="f">
            <label htmlFor={`${fid}-newdur`}>Min.</label>
            <input
              id={`${fid}-newdur`}
              type="number"
              min="5"
              value={newDur}
              onChange={(e) => setNewDur(e.target.value)}
            />
          </div>
        </div>
        <button type="button" className="btn btg btbl" onClick={handleAddRow}>
          + Añadir
        </button>
      </div>
      {error && (
        <div role="alert" style={{ fontSize: ".78rem", color: "var(--ro)", marginTop: ".6rem" }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gap: ".42rem", marginTop: ".5rem" }}>
        <button type="button" className="btn bts btbl" onClick={handleSubmit} disabled={saving}>
          {saving ? "Guardando…" : "Guardar plantilla"}
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
