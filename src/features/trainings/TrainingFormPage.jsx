import { useId, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStableData } from "../../hooks/useStableData.js";
import { useToast } from "../../hooks/useToast.js";
import { uid } from "../../lib/id.js";
import { td } from "../../lib/date.js";
import { WK } from "../../lib/constants.js";

// Ports rNT (public/legacy-app.js:1975-1993). The route-level PermissionRoute("trainings")
// replaces requirePermissionView. The voice-dictation mic button (legacy's voice(),
// public/legacy-app.js:2745, Web Speech API) is intentionally not ported — see
// docs/components/trainings.md known gaps.
export function TrainingFormPage() {
  const { hid } = useParams();
  const { horses, addTraining, isLoaded } = useStableData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fid = useId();

  const [date, setDate] = useState(td());
  const [dur, setDur] = useState(45);
  const [wtype, setWtype] = useState("doma");
  const [state, setState] = useState("");
  const [feel, setFeel] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(7);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const horse = horses.find((h) => h.id === hid);

  if (!isLoaded("horses")) {
    return (
      <div className="view">
        <div className="ld">
          <div className="sp"></div>
          <p>Cargando caballo...</p>
        </div>
      </div>
    );
  }
  if (!horse) {
    return (
      <div className="view">
        <p>No encontrado.</p>
      </div>
    );
  }

  function handleBack() {
    navigate(`/horses/${hid}?tab=entrenos`);
  }

  async function handleSubmit() {
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      await addTraining({
        id: uid(),
        createdBy: null,
        hid,
        // Al vaciar el campo de fecha se guardaba "" y StatsPage mostraba "Invalid Date":
        // mismo respaldo que usan los demás formularios.
        date: date || td(),
        dur,
        wtype,
        state: state.trim(),
        feel: feel.trim(),
        notes: notes.trim(),
        rating,
      });
      showToast("Entrenamiento guardado");
      handleBack();
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo guardar el entrenamiento. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="view">
      <div className="vh">
        <button className="ib" onClick={handleBack} aria-label="Volver a los entrenos del caballo">
          ←
        </button>
        <h1>Entreno · {horse.name}</h1>
      </div>
      <div className="r2">
        <div className="f">
          <label htmlFor={`${fid}-date`}>Fecha</label>
          <input id={`${fid}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="f">
          <label htmlFor={`${fid}-dur`}>Duración</label>
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
      </div>
      <div className="f">
        <label id={`${fid}-wtype-label`}>Tipo de trabajo</label>
        <div className="og og5" role="group" aria-labelledby={`${fid}-wtype-label`}>
          {WK.map((w) => (
            <button
              type="button"
              key={w.id}
              className={"oo" + (wtype === w.id ? " active" : "")}
              aria-pressed={wtype === w.id}
              onClick={() => setWtype(w.id)}
            >
              <span className="ic" aria-hidden="true">
                {w.i}
              </span>
              {w.l}
            </button>
          ))}
        </div>
      </div>
      <div className="f">
        <label htmlFor={`${fid}-state`}>Estado del caballo</label>
        <input
          id={`${fid}-state`}
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="Relajado, tenso..."
        />
      </div>
      <div className="f">
        <label htmlFor={`${fid}-feel`}>Sensaciones</label>
        <textarea
          id={`${fid}-feel`}
          value={feel}
          onChange={(e) => setFeel(e.target.value)}
          placeholder="¿Cómo ha ido?"
        />
      </div>
      <div className="f">
        <label htmlFor={`${fid}-notes`}>Observaciones</label>
        <textarea
          id={`${fid}-notes`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detalles..."
        />
      </div>
      <div className="f">
        <label id={`${fid}-rating-label`}>
          Valoración: <span>{rating}</span>/10
        </label>
        <div className="rg" role="group" aria-labelledby={`${fid}-rating-label`}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              type="button"
              key={n}
              className={"ro" + (rating === n ? " active" : "")}
              aria-pressed={rating === n}
              aria-label={`Valoración ${n} de 10`}
              onClick={() => setRating(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div role="alert" style={{ fontSize: ".78rem", color: "var(--ro)", marginBottom: ".6rem" }}>
          {error}
        </div>
      )}
      <button type="button" className="btn bts btbl" onClick={handleSubmit} disabled={saving}>
        {saving ? "Guardando…" : "Guardar entrenamiento"}
      </button>
    </div>
  );
}
