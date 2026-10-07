// Ports the #loading-screen markup (index.html:147).
export function LoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 480,
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: ".75rem",
      }}
    >
      <div className="sp" aria-hidden="true"></div>
      <div style={{ fontSize: "var(--fs-base)", color: "var(--text-muted)" }}>Cargando…</div>
    </div>
  );
}
