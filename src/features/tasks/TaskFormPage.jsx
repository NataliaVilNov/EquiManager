import { useContext, useId, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext.jsx";
import { useStableData } from "../../hooks/useStableData.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { useToast } from "../../hooks/useToast.js";
import { uid } from "../../lib/id.js";
import { td } from "../../lib/date.js";
import { AK } from "../../lib/constants.js";
import { RecurrencePicker } from "./RecurrencePicker.jsx";

// Ports rNTask (public/legacy-app.js:3244-3277) unified with rNCT
// (public/legacy-app.js:2286-2311) — a task is now either horse-linked or a general chore,
// and optionally recurring, rather than two separate forms/collections. The route-level
// PermissionRoute("tasks") replaces requirePermissionView.
//
// El componente exterior espera a que lleguen los datos: con `tasks` todavía vacío (recarga
// o enlace directo a la URL de edición) el formulario se sembraba en blanco y Guardar
// escribía esos valores por defecto encima de la tarea real.
export function TaskFormPage() {
  const { tid } = useParams();
  const { tasks, isLoaded } = useStableData();

  if (!isLoaded("horses", "team", "tasks")) {
    return (
      <div className="view">
        <div className="ld">
          <div className="sp"></div>
          <p>Cargando tarea...</p>
        </div>
      </div>
    );
  }

  const task = tid ? tasks.find((t) => t.id === tid) : null;

  if (tid && !task) {
    return (
      <div className="view">
        <p>No encontrado.</p>
      </div>
    );
  }

  return <TaskForm key={tid || "new"} task={task} />;
}

function TaskForm({ task }) {
  const editing = !!task;
  const [searchParams] = useSearchParams();
  const { horses, team, addTask, updateTask, deleteTask } = useStableData();
  const { isAdmin, can, myTeamMember } = usePermissions();
  const { user } = useContext(AuthContext) || {};
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fid = useId();

  const [hid, setHid] = useState(task ? task.horseId || "" : "");
  // `task.activity` puede no existir en documentos antiguos: sin el respaldo, activity queda
  // undefined, el input pasa de no controlado a controlado (aviso de React) y activity.trim()
  // revienta al enviar.
  const [activity, setActivity] = useState(task ? task.activity || "monta" : "monta");
  const [date, setDate] = useState(task ? task.startDate : searchParams.get("d") || td());
  const [time, setTime] = useState(task && task.time ? task.time : "");
  const [dur, setDur] = useState(task ? task.dur ?? 30 : 30);
  const [pid, setPid] = useState(() => {
    if (isAdmin) return task ? task.assignedTo || "" : "";
    return (task && task.assignedTo) || (myTeamMember ? myTeamMember.id : "") || "";
  });
  const [notes, setNotes] = useState(task ? task.notes || "" : "");
  const [recurrenceRule, setRecurrenceRule] = useState(task ? task.recurrenceRule || null : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Lets a caller (e.g. the month board view) send the user back to where they started
  // instead of the default /day. Absent for every existing entry point (DayBoardPage's FAB,
  // HomePage's quick action), so this is purely additive — their behavior is unchanged.
  const returnTo = searchParams.get("return");
  function goBack() {
    navigate(returnTo ? decodeURIComponent(returnTo) : `/day?d=${date || td()}`);
  }

  function handleHorseChange(nextHid) {
    setHid(nextHid);
    setActivity(nextHid ? AK[0].id : "");
  }

  async function handleSubmit() {
    if (saving) return;
    if (!hid && !activity.trim()) {
      setError("Escribe qué tarea es");
      showToast("Escribe qué tarea es");
      return;
    }
    // Una regla semanal sin ningún día marcado se guardaba igual y la expansión caía en el
    // día de la semana de la fecha de inicio, con la interfaz mostrando cero días elegidos.
    if (recurrenceRule && recurrenceRule.freq === "weekly" && !(recurrenceRule.byWeekday || []).length) {
      setError("Elige al menos un día de la semana para la repetición");
      showToast("Elige al menos un día de la semana para la repetición");
      return;
    }
    const record = {
      id: editing ? task.id : uid(),
      createdBy: editing ? task.createdBy || null : (user && user.uid) || null,
      horseId: hid || null,
      activity: hid ? activity : activity.trim(),
      startDate: date || td(),
      time: time || null,
      dur: Number(dur) || 30,
      assignedTo: pid || null,
      notes: notes.trim(),
      recurrenceRule,
      status: editing ? task.status || "pending" : "pending",
    };
    setError("");
    setSaving(true);
    try {
      if (editing) await updateTask(record);
      else await addTask(record);
      showToast(editing ? "Actualizada" : "Tarea añadida");
      goBack();
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo guardar la tarea. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving) return;
    const msg = task.recurrenceRule
      ? "Esta tarea es recurrente: se eliminará TODA la serie y todas sus repeticiones. ¿Eliminar toda la serie?"
      : "¿Eliminar esta tarea?";
    if (!window.confirm(msg)) return;
    setError("");
    setSaving(true);
    try {
      await deleteTask(task.id);
      showToast(task.recurrenceRule ? "Serie eliminada" : "Tarea eliminada");
      goBack();
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo eliminar la tarea. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="view">
      <div className="vh">
        <button className="ib" onClick={goBack} aria-label="Volver">
          ←
        </button>
        <h1>{editing ? "Editar" : "Nueva"} tarea</h1>
      </div>
      <div className="f">
        <label htmlFor={`${fid}-horse`}>Caballo</label>
        <select id={`${fid}-horse`} value={hid} onChange={(e) => handleHorseChange(e.target.value)}>
          <option value="">Ninguno · tarea general</option>
          {horses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>
      {hid ? (
        <div className="f">
          <label id={`${fid}-activity-label`}>Actividad</label>
          <div className="og og3" role="group" aria-labelledby={`${fid}-activity-label`}>
            {AK.map((a) => (
              <button
                type="button"
                key={a.id}
                className={"oo" + (activity === a.id ? " active" : "")}
                aria-pressed={activity === a.id}
                onClick={() => setActivity(a.id)}
              >
                <span className="ic" aria-hidden="true">
                  {a.i}
                </span>
                {a.l}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="f">
          <label htmlFor={`${fid}-activity`}>Tarea *</label>
          <input
            id={`${fid}-activity`}
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="Limpiar telarañas, revisar vallado..."
          />
        </div>
      )}
      <div className="r2">
        <div className="f">
          <label htmlFor={`${fid}-date`}>Fecha</label>
          <input id={`${fid}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="f">
          <label htmlFor={`${fid}-time`}>Hora</label>
          <input id={`${fid}-time`} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div className="f">
        <label htmlFor={`${fid}-dur`}>Duración estimada</label>
        <div className="slrow">
          <input
            id={`${fid}-dur`}
            type="range"
            min="5"
            max="180"
            step="5"
            value={dur}
            onChange={(e) => setDur(Number(e.target.value))}
          />
          <span className="slv">{dur} min</span>
        </div>
      </div>
      <div className="f">
        <label id={`${fid}-pid-label`}>Persona responsable</label>
        {isAdmin ? (
          <div className="pch" role="group" aria-labelledby={`${fid}-pid-label`}>
            <button
              type="button"
              className={"pc" + (!pid ? " active" : "")}
              aria-pressed={!pid}
              onClick={() => setPid("")}
            >
              Sin asignar
            </button>
            {team.map((m) => (
              <button
                type="button"
                key={m.id}
                className={"pc" + (pid === m.id ? " active" : "")}
                aria-pressed={pid === m.id}
                onClick={() => setPid(m.id)}
              >
                <span aria-hidden="true">{m.emoji || "👤"}</span> {m.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: ".65rem", marginBottom: 0 }}>
            <div style={{ fontSize: ".82rem", color: "var(--gr)" }}>
              Asignada a: <b>{myTeamMember ? myTeamMember.name : "mi usuario"}</b>
            </div>
          </div>
        )}
      </div>
      <div className="f">
        <label htmlFor={`${fid}-notes`}>Notas</label>
        <input
          id={`${fid}-notes`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detalles opcionales..."
        />
      </div>
      <RecurrencePicker value={recurrenceRule} onChange={setRecurrenceRule} startDate={date} />
      {error && (
        <div role="alert" style={{ fontSize: ".78rem", color: "var(--ro)", marginBottom: ".6rem" }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gap: ".42rem" }}>
        <button type="button" className="btn bts btbl" onClick={handleSubmit} disabled={saving}>
          {saving ? "Guardando…" : editing ? "Guardar" : "Añadir tarea"}
        </button>
        {editing && can("deleteItems") && (
          <button type="button" className="btn btr btbl" onClick={handleDelete} disabled={saving}>
            {task.recurrenceRule ? "Eliminar toda la serie" : "Eliminar tarea"}
          </button>
        )}
      </div>
    </div>
  );
}
