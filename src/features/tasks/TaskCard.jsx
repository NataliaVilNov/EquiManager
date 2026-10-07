import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { activityById } from "../../lib/constants.js";
import { taskStatusIcon, taskStatusLabel, taskNeedsReturn } from "./taskHelpers.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { useStableData } from "../../hooks/useStableData.js";
import { useToast } from "../../hooks/useToast.js";

// Ports tcard (public/legacy-app.js:3205-3224). Also reused by HomePage (Phase 4c).
export function TaskCard({ task }) {
  const { horses, team, cycleTaskStatus, cycleOccurrenceStatus, setOccurrenceAssignee, deleteTask } = useStableData();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const horse = horses.find((h) => h.id === task.horseId);
  const a = activityById(task.activity);
  const member = task.assignedTo ? team.find((x) => x.id === task.assignedTo) : null;
  const icon = taskStatusIcon(task);
  const label = taskStatusLabel(task);
  const dbl = taskNeedsReturn(task.activity);
  // Reassigning a single occurrence writes to the same doc/collection the new rules gate on
  // the `tasks` permission — keep the UI gate matching what the rules would allow.
  const canReassign = task.isRecurringOccurrence && can("tasks");

  async function handleCycle() {
    try {
      if (task.isRecurringOccurrence) await cycleOccurrenceStatus(task);
      else await cycleTaskStatus(task.id);
    } catch (err) {
      showToast("⚠️ " + ((err && err.message) || "No se pudo cambiar el estado"));
    }
  }

  // `task.id` es SIEMPRE el id de la serie, también cuando esta fila es una sola ocurrencia
  // de una tarea recurrente, así que borrar aquí elimina el año entero. El contexto no expone
  // ningún mutador que escriba una excepción de "día cancelado" (cycleOccurrenceStatus solo
  // cambia el estado y las ocurrencias se expanden sin filtrar por él), así que no se puede
  // borrar un único día: la interfaz ofrece explícitamente eliminar TODA la serie y el texto
  // de confirmación dice exactamente qué se va a borrar.
  async function handleDelete() {
    if (deleting) return;
    const msg = task.isRecurringOccurrence
      ? "Esta tarea es recurrente y no se puede borrar solo este día: se eliminará TODA la serie con todas sus repeticiones. ¿Eliminar toda la serie?"
      : "¿Eliminar esta tarea?";
    if (!window.confirm(msg)) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      showToast(task.isRecurringOccurrence ? "Serie eliminada" : "Tarea eliminada");
    } catch (err) {
      showToast("⚠️ " + ((err && err.message) || "No se pudo eliminar la tarea"));
      setDeleting(false);
    }
  }

  async function handleReassign(memberId) {
    setPickerOpen(false);
    try {
      await setOccurrenceAssignee(task, memberId);
    } catch (err) {
      showToast("⚠️ " + ((err && err.message) || "No se pudo reasignar la tarea"));
    }
  }

  return (
    <div className={"tkc" + (task.status === "done" ? " done" : "")}>
      <button
        type="button"
        className={"ck " + task.status}
        onClick={handleCycle}
        title={dbl ? "Pendiente → llevado → recogido" : "Pendiente → hecho"}
        aria-label={`Cambiar estado (${label})`}
        style={icon === "✓✓" ? { fontSize: ".68rem" } : undefined}
      >
        {icon}
      </button>
      <div className="tkb">
        <div className="tkt">
          <span aria-hidden="true">{a.i}</span> {a.l} — {horse ? horse.name : "Tarea general"}
        </div>
        <div className="tkm">
          {task.dur ? task.dur + "min" : ""}
          {task.notes ? " · " + task.notes : ""}
        </div>
        {canReassign ? (
          <button
            type="button"
            className="tka"
            aria-expanded={pickerOpen}
            aria-label={`Reasignar tarea (ahora: ${member ? member.name : "sin asignar"})`}
            onClick={() => setPickerOpen((o) => !o)}
          >
            {member ? `${member.emoji || "👤"} ${member.name}` : "Sin asignar"}
          </button>
        ) : (
          member && (
            <span className="tka">
              <span aria-hidden="true">{member.emoji || "👤"}</span> {member.name}
            </span>
          )
        )}
        <span
          style={{
            fontSize: ".68rem",
            color: task.status === "done" ? "var(--v)" : task.status === "inprogress" ? "var(--am)" : "var(--gr)",
            marginLeft: ".3rem",
            fontWeight: 700,
          }}
        >
          {label}
        </span>
        {task.time && (
          <span style={{ fontSize: ".7rem", color: "var(--gr)", marginLeft: ".3rem" }}>🕐 {task.time}</span>
        )}
        {task.recurrenceRule && (
          <span
            style={{ fontSize: ".7rem", color: "var(--gr)", marginLeft: ".3rem" }}
            title="Tarea recurrente"
            role="img"
            aria-label="Tarea recurrente"
          >
            🔁
          </span>
        )}
        {pickerOpen && canReassign && (
          <div className="pch" role="group" aria-label="Reasignar esta repetición">
            <button
              type="button"
              className={"pc" + (!task.assignedTo ? " active" : "")}
              aria-pressed={!task.assignedTo}
              onClick={() => handleReassign(null)}
            >
              Sin asignar
            </button>
            {team.map((m) => (
              <button
                type="button"
                key={m.id}
                className={"pc" + (task.assignedTo === m.id ? " active" : "")}
                aria-pressed={task.assignedTo === m.id}
                onClick={() => handleReassign(m.id)}
              >
                <span aria-hidden="true">{m.emoji || "👤"}</span> {m.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: ".25rem" }}>
        <button
          type="button"
          className="ib"
          style={{ width: "27px", height: "27px", fontSize: ".72rem" }}
          aria-label={`Editar tarea ${a.l}`}
          onClick={() => navigate(`/tasks/${task.id}/edit?d=${task.occurrenceDate || task.startDate}`)}
        >
          ✏️
        </button>
        {can("deleteItems") && (
          <button
            type="button"
            className="db"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={task.isRecurringOccurrence ? "Eliminar toda la serie recurrente" : "Eliminar tarea"}
            title={task.isRecurringOccurrence ? "Eliminar toda la serie recurrente" : "Eliminar tarea"}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
