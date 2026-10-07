import { useEffect, useRef } from "react";

// The bottom-sheet backdrop + slide-up panel chrome, extracted here because the weekly
// board's new note/done/vet sheets would otherwise be the 4th-6th near-identical copy of
// this markup (StablePanel.jsx and UserPanel.jsx each already build it inline; MorePanel.jsx
// established the .sheet-overlay/.sheet/.sheet-head classes this reuses). StablePanel/
// UserPanel are not migrated to this component here — out of scope for this change, just an
// opportunity now available.
//
// Añadido: una vista modal necesita una salida obvia y no debe dejar escapar el foco
// por detrás. Esta hoja cierra con Escape, mueve el foco dentro al abrirse, lo
// devuelve al elemento que la abrió al cerrarse, retiene el tabulador dentro del
// diálogo y bloquea el desplazamiento del fondo.
export function SlideUpSheet({ title, onClose, children }) {
  const sheetRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    openerRef.current = document.activeElement;
    const sheet = sheetRef.current;

    const focusables = () =>
      sheet
        ? Array.from(
            sheet.querySelectorAll(
              'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.offsetParent !== null)
        : [];

    const first = focusables()[0];
    if (first) first.focus();
    else if (sheet) sheet.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      const opener = openerRef.current;
      if (opener && typeof opener.focus === "function" && document.contains(opener)) opener.focus();
    };
  }, [onClose]);

  return (
    <div
      className="sheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={sheetRef} tabIndex={-1}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="ib" onClick={onClose} aria-label="Cerrar">
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
