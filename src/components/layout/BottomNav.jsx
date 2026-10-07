import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { ModalContext } from "../../contexts/ModalContext.jsx";
import { usePermissions } from "../../hooks/usePermissions.js";

const navLinkClassName = ({ isActive }) => "nb" + (isActive ? " active" : "");

// Ports the <nav class="bn"> bottom navigation (index.html:132-138), plus the
// nb-team visibility toggle from applyNavPermissions (public/legacy-app.js:684-689).
export function BottomNav() {
  const { openModal } = useContext(ModalContext) || {};
  const { can } = usePermissions();

  return (
    <nav className="bn" aria-label="Navegación principal">
      <NavLink to="/home" className={navLinkClassName}>
        <span className="ni" aria-hidden="true">⌂</span>Inicio
      </NavLink>
      <NavLink to="/horses" className={navLinkClassName}>
        <span className="ni" aria-hidden="true">🐴</span>Caballos
      </NavLink>
      <NavLink to="/day" className={navLinkClassName}>
        <span className="ni" aria-hidden="true">✓</span>Hoy
      </NavLink>
      {can("team") && (
        <NavLink to="/team" className={navLinkClassName}>
          <span className="ni" aria-hidden="true">👥</span>Equipo
        </NavLink>
      )}
      {/* "Más" abre una hoja, no navega: se anuncia como control de diálogo. */}
      <button type="button" className="nb" onClick={() => openModal && openModal("morePanel")} aria-haspopup="dialog">
        <span className="ni" aria-hidden="true">•••</span>Más
      </button>
    </nav>
  );
}
