import { useNavigate } from "react-router-dom";
import { healthTypeById } from "../../lib/constants.js";
import { fD } from "../../lib/date.js";

// Ports scard (public/legacy-app.js:2374-2381). Also reused by HomePage (Phase 4c).
export function AlertCard({ alert }) {
  const navigate = useNavigate();
  const ht = healthTypeById(alert.type);
  const dt = alert.ov
    ? `Vencido hace ${Math.abs(alert.days)}d`
    : `En ${alert.days} día${alert.days === 1 ? "" : "s"}`;

  // Era un <div onClick> sin role, sin tabindex y sin teclado: para un usuario de teclado o
  // lector de pantalla la alerta no se podía abrir. Ahora es un botón real.
  return (
    <button
      type="button"
      className="xc"
      style={{ cursor: "pointer", width: "100%", textAlign: "left", font: "inherit", color: "inherit" }}
      onClick={() => navigate(`/horses/${alert.hid}?tab=salud`)}
    >
      <div className={"xi " + alert.type} aria-hidden="true">
        {ht.i}
      </div>
      <div className="xinf">
        <div className="xl">
          {alert.hn} · {alert.label}
        </div>
        <div className="xm">
          {dt} · {fD(alert.nxt)}
        </div>
      </div>
    </button>
  );
}
