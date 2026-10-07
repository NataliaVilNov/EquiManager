import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useStableData } from "../../../hooks/useStableData.js";
import { useToast } from "../../../hooks/useToast.js";
import { boardActivity, boardPlanActs, boardStartOfWeek, boardToneClass, boardDateLabel } from "../boardHelpers.js";

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Ports rBoardCell/boardAddActivity/boardMoveActivity/saveBoardCell
// (public/legacy-app.js:1323-1346). Fix: the activity order is real array state with
// up/down reorder controls, not (as legacy does) DOM node order read via
// querySelectorAll at save time — there's no React-idiomatic equivalent of reading final
// order from the DOM, so this is a mechanical adaptation forced by the framework, not a
// behavior change.
//
// El componente exterior espera a que lleguen los datos: `weeklyPlans` arranca vacío, así
// que al recargar sobre esta URL el orden se sembraba vacío y Guardar BORRABA la celda
// completa del plan semanal (setWeeklyPlanActivities elimina la celda cuando se queda sin
// contenido).
export function BoardCellPage() {
  const { hid, date } = useParams();
  const [searchParams] = useSearchParams();
  const week = searchParams.get("week") || boardStartOfWeek(date);
  const navigate = useNavigate();
  const { horses, weeklyPlans, isLoaded } = useStableData();

  if (!isLoaded("horses", "weeklyPlans", "boardConfig")) {
    return (
      <div className="view">
        <div className="ld">
          <div className="sp"></div>
          <p>Cargando pizarra...</p>
        </div>
      </div>
    );
  }

  const horse = horses.find((h) => h.id === hid);

  if (!horse) {
    return (
      <div className="view">
        <p>Caballo no encontrado.</p>
      </div>
    );
  }

  return (
    <BoardCellForm
      key={`${hid}:${date}`}
      horse={horse}
      date={date}
      initialOrder={boardPlanActs(weeklyPlans, hid, date)}
      onBack={() => navigate(`/boards?tab=weekly&week=${week}`)}
    />
  );
}

function BoardCellForm({ horse, date, initialOrder, onBack }) {
  const hid = horse.id;
  const { boardConfig, setWeeklyPlanActivities } = useStableData();
  const { showToast } = useToast();
  const [order, setOrder] = useState(() => initialOrder);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addActivity(id) {
    if (order.includes(id)) {
      showToast("La actividad ya está añadida");
      return;
    }
    setOrder((o) => [...o, id]);
  }
  function moveActivity(i, dir) {
    setOrder((o) => {
      const j = i + dir;
      if (j < 0 || j >= o.length) return o;
      const next = o.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function removeActivity(i) {
    setOrder((o) => o.filter((_, idx) => idx !== i));
  }
  async function save() {
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      await setWeeklyPlanActivities(hid, date, order);
      showToast("Pizarra actualizada");
      onBack();
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo guardar la planificación. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="view">
      <div className="vh">
        <button className="ib" onClick={onBack} aria-label="Volver a la pizarra semanal">
          ←
        </button>
        <div>
          <span className="ey">Pizarra semanal</span>
          <h1>
            {horse.name} · {capitalize(boardDateLabel(date))}
          </h1>
        </div>
      </div>
      <div className="board-help info">
        <b>Orden cronológico</b>
        <span>Coloca las actividades en el mismo orden en que debe realizarlas el caballo.</span>
      </div>
      <div className="card">
        <label>Plan del día</label>
        <div className="board-order-list">
          {order.length ? (
            order.map((id, i) => {
              const a = boardActivity(boardConfig.activities, id);
              return (
                <div key={id} className={"board-act-order " + boardToneClass(a.tone)}>
                  <span className="board-code">{a.code}</span>
                  <b>{a.label}</b>
                  <span className="board-order-actions">
                    <button
                      type="button"
                      onClick={() => moveActivity(i, -1)}
                      aria-label={`Subir ${a.label}`}
                      disabled={i === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveActivity(i, 1)}
                      aria-label={`Bajar ${a.label}`}
                      disabled={i === order.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => removeActivity(i)}
                      aria-label={`Quitar ${a.label} del plan`}
                    >
                      ×
                    </button>
                  </span>
                </div>
              );
            })
          ) : (
            <div className="empty-soft board-empty">
              <span aria-hidden="true">＋</span>
              <div>
                <b>Sin actividades</b>
                <p>Añade las actividades previstas para este día.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="card">
        <label>Añadir actividad</label>
        <div className="board-activity-picker">
          {boardConfig.activities.map((a) => (
            <button
              type="button"
              key={a.id}
              className={"board-pick " + boardToneClass(a.tone)}
              onClick={() => addActivity(a.id)}
              aria-label={`Añadir ${a.label}`}
            >
              <span>{a.code}</span>
              <small>{a.label}</small>
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div role="alert" style={{ fontSize: ".78rem", color: "var(--ro)", marginBottom: ".6rem" }}>
          {error}
        </div>
      )}
      <button type="button" className="btn bts btbl" onClick={save} disabled={saving}>
        {saving ? "Guardando…" : "Guardar planificación"}
      </button>
    </div>
  );
}
