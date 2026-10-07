import { useStableData } from "../../../hooks/useStableData.js";
import { boardAssignment, horseConflict } from "../boardHelpers.js";

// Ports resourceCell (public/legacy-app.js:1443-1447): a single droppable/clickable slot,
// free or occupied. Drag-and-drop uses the same {hid} (new placement) vs {assignmentId}
// (move) dataTransfer payload distinction as legacy.
export function ResourceSlot({ type, date, resourceId, slotId, position, onDropCell, onClickCell }) {
  const { horses, boardConfig, boardAssignments } = useStableData();
  const assignment = boardAssignment(boardAssignments, type, date, resourceId, slotId, position);

  function handleDragOver(ev) {
    ev.preventDefault();
  }
  function handleDrop(ev) {
    onDropCell(ev, resourceId, slotId, position);
  }

  // La celda libre era un <td onClick> y el caballo asignado un <div onClick>: sin role, sin
  // tabindex y sin teclado, así que la pizarra de recursos era inoperable sin ratón. Ahora el
  // elemento pulsable de cada caso es un botón real (el <td> conserva el drop).
  if (!assignment) {
    return (
      <td className="resource-cell free" onDragOver={handleDragOver} onDrop={handleDrop}>
        <button
          type="button"
          onClick={() => onClickCell(resourceId, slotId, position, null)}
          aria-label="Hueco libre: asignar un caballo"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            width: "100%",
            height: "100%",
            font: "inherit",
            color: "inherit",
          }}
        >
          <span>＋ Libre</span>
        </button>
      </td>
    );
  }

  const horse = horses.find((h) => h.id === assignment.hid);
  const conflict = horseConflict(boardConfig, boardAssignments, assignment.hid, date, type, slotId);

  function handleDragStart(ev) {
    try {
      ev.dataTransfer.setData("text/plain", JSON.stringify({ assignmentId: assignment.id }));
    } catch (e) {}
  }

  return (
    <td className={"resource-cell occupied" + (conflict ? " conflict" : "")} onDragOver={handleDragOver} onDrop={handleDrop}>
      <button
        type="button"
        className="assigned-horse"
        draggable="true"
        onDragStart={handleDragStart}
        aria-label={`${horse ? horse.name : "Caballo"}${conflict ? " · coincidencia de horario" : ""}: cambiar o quitar`}
        onClick={(ev) => {
          ev.stopPropagation();
          onClickCell(resourceId, slotId, position, assignment);
        }}
      >
        <span aria-hidden="true">{horse && horse.photo ? <img src={horse.photo.url} alt="" /> : "🐴"}</span>
        <b>{horse ? horse.name : "Caballo"}</b>
        <small aria-hidden="true">{conflict ? "⚠ Coincidencia" : "Arrastra para mover"}</small>
      </button>
    </td>
  );
}
