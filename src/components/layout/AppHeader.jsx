import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext.jsx";
import { StableSelectionContext } from "../../contexts/StableSelectionContext.jsx";
import { ModalContext } from "../../contexts/ModalContext.jsx";

// Ports the #main-header markup (index.html:96-105).
export function AppHeader() {
  const { user, profile } = useContext(AuthContext) || {};
  const { activeStable } = useContext(StableSelectionContext) || {};
  const { openModal } = useContext(ModalContext) || {};

  const userName = (profile && profile.name) || (user && user.displayName) || (user && user.email) || "";

  return (
    <header id="main-header">
      <div className="bar">
        {/* Abre el panel de cuadra: es un menú, así que lo anuncia como tal. */}
        <button
          type="button"
          className="logo"
          onClick={() => openModal && openModal("stablePanel")}
          aria-haspopup="dialog"
          aria-label={activeStable ? `Cuadra activa: ${activeStable.name}. Cambiar de cuadra` : "Elegir cuadra"}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: ".45rem", textAlign: "left", minHeight: "var(--tap)" }}
        >
          EquiLog <span className="ltag">Beta</span>
          {activeStable && <span className="stable-chip">{activeStable.name}</span>}
        </button>
        <div style={{ display: "flex", gap: ".4rem", alignItems: "center", minWidth: 0 }}>
          <span className="header-user">{userName}</span>
          <button
            type="button"
            className="ib"
            onClick={() => openModal && openModal("userPanel")}
            aria-haspopup="dialog"
            aria-label="Mi perfil"
          >
            <span aria-hidden="true">👤</span>
          </button>
        </div>
      </div>
    </header>
  );
}
