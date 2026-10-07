// Ports the #fab floating action button (index.html:131). Unlike the legacy version,
// which centrally decides visibility from the current view name inside render(), each
// page mounts this itself when it wants a FAB — a natural fit for React's composition
// model now that routing (not a single render() switch) owns which page is showing.
//
// `label` es lo que se ve (normalmente "+"); `a11yLabel` es lo que se anuncia. Un
// botón cuyo nombre accesible es "más" no dice nada: cada pantalla pasa el suyo
// ("Añadir caballo", "Nueva tarea"…).
export function Fab({ onClick, label = "+", a11yLabel = "Añadir" }) {
  return (
    <button type="button" className="fab" onClick={onClick} aria-label={a11yLabel} title={a11yLabel}>
      <span aria-hidden="true">{label}</span>
    </button>
  );
}
