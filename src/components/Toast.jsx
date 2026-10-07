import { useContext } from "react";
import { ToastContext } from "../contexts/ToastContext.jsx";

// Ports the #toast markup (index.html:146), driven by ToastContext instead of the
// global toast() function (public/legacy-app.js:984).
//
// role="status" + aria-live="polite" para que el lector de pantalla anuncie el
// aviso: antes era un <div> mudo y quien no ve la pantalla no se enteraba de que
// la acción se había guardado (ni de que había fallado).
export function Toast() {
  const { message, visible } = useContext(ToastContext) || {};

  return (
    <div className={"toast" + (visible ? " show" : "")} role="status" aria-live="polite" aria-atomic="true">
      {visible ? message : ""}
    </div>
  );
}
