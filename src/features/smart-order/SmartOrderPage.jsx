import { useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStableData } from "../../hooks/useStableData.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { useToast } from "../../hooks/useToast.js";
import { td } from "../../lib/date.js";
import { buildSmartOrderDraft } from "./buildDraft.js";
import { SmartOrderReview } from "./SmartOrderReview.jsx";

const EXAMPLE =
  "Mañana Fandango paddock y caminador. A Nerón montarlo suave 30 minutos. A Luna paseo de la mano 20 minutos porque ayer la veterinaria la infiltró del menudillo, coste 200€.";

// Ports rSmartOrder/smartAnalyzeOrder/confirmSmartOrder (public/legacy-app.js:3013-3123).
// The permission gate (canPerm('tasks')||canPerm('health')||canPerm('expenses')) lives in
// the route (PermissionRoute requires={["tasks","health","expenses"]}), not here. The 🎤
// voice-input button is not ported — same scope cut as the training/session-report forms.
export function SmartOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ds = searchParams.get("d") || td();
  const { horses, team, confirmSmartOrderDraft } = useStableData();
  const { isAdmin, myTeamMember, can } = usePermissions();
  const { showToast } = useToast();
  const fid = useId();

  const [date, setDate] = useState(ds);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function analyze() {
    const trimmed = text.trim();
    if (!trimmed) {
      showToast("Escribe o dicta una orden");
      return;
    }
    setResult(
      buildSmartOrderDraft(trimmed, date, {
        horses,
        team,
        isAdmin,
        myMemberId: myTeamMember ? myTeamMember.id : null,
        canTasks: can("tasks"),
        canHealth: can("health"),
        canExpenses: can("expenses"),
      })
    );
  }

  function updateItem(id, patch) {
    setResult((prev) => (prev ? { ...prev, items: prev.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) } : prev));
  }

  function clear() {
    setResult({ items: [], noHorsesFound: false });
  }

  // Sin el guard de doble envío un doble toque confirmaba DOS VECES el lote entero (los ids
  // se generan dentro del mutador, así que no hay idempotencia posible), y sin el `await`
  // confirmSmartOrderDraft —ahora asíncrono— el aviso imprimía "[object Promise]" y la
  // navegación ocurría antes de saber si la escritura había salido bien.
  async function confirm() {
    if (saving) return;
    if (!result || !result.items.length) {
      setError("No hay nada que crear");
      showToast("No hay nada que crear");
      return;
    }
    const toCreate = result.items.filter((x) => x.checked && x.allowed);
    setError("");
    setSaving(true);
    try {
      const created = await confirmSmartOrderDraft(toCreate);
      showToast(`Creados ${created} registro${created === 1 ? "" : "s"}`);
      navigate(`/day?d=${date}`);
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo crear la orden. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="view">
      <div className="vh">
        <button className="ib" onClick={() => navigate(`/day?d=${ds}`)} aria-label="Volver al día">
          ←
        </button>
        <h1>Orden inteligente</h1>
      </div>
      <div className="card" style={{ background: "var(--vl)" }}>
        <div style={{ fontSize: ".86rem", color: "var(--vd)", fontWeight: 700, marginBottom: ".25rem" }}>
          Escribe o dicta como si mandaras un WhatsApp
        </div>
        <div style={{ fontSize: ".76rem", color: "var(--gr)" }}>
          La app propondrá tareas, salud y gastos. Revisa antes de crear.
        </div>
      </div>
      <div className="f">
        <label htmlFor={`${fid}-date`}>Fecha por defecto</label>
        <input id={`${fid}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="f">
        <label htmlFor={`${fid}-text`}>Orden</label>
        <textarea
          id={`${fid}-text`}
          style={{ minHeight: "160px" }}
          placeholder={EXAMPLE}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <button type="button" className="btn bts btbl" onClick={analyze} disabled={saving}>
        Analizar orden
      </button>
      {error && (
        <div role="alert" style={{ fontSize: ".78rem", color: "var(--ro)", marginTop: ".6rem" }}>
          {error}
        </div>
      )}
      <div style={{ marginTop: ".9rem" }}>
        {result && (
          <SmartOrderReview
            items={result.items}
            noHorsesFound={result.noHorsesFound}
            horses={horses}
            team={team}
            onChangeItem={updateItem}
            onClear={clear}
            onConfirm={confirm}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}
