import { useState } from "react";
import { LoginForm } from "./LoginForm.jsx";
import { RegisterForm } from "./RegisterForm.jsx";

// Ports the #auth-screen markup and authTab() (index.html:16-42, public/legacy-app.js:17-22).
//
// Los estilos en línea de las pestañas se han sustituido por las clases del
// sistema (.tabs/.tab): la pestaña activa llevaba `background:"#fff"` fijo, que
// en modo oscuro dejaba un rectángulo blanco con texto verde claro encima.
// Ahora son pestañas de verdad para el lector de pantalla (tablist/tab/tabpanel)
// y no un par de botones sueltos.
export function AuthScreen() {
  const [tab, setTab] = useState("login");

  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="auth-logo">EquiLog</div>
        <div className="ey">Gestión ecuestre</div>
      </div>

      <div className="tabs" role="tablist" aria-label="Entrar o registrarse">
        <button
          type="button"
          role="tab"
          id="auth-tab-login"
          aria-selected={tab === "login"}
          aria-controls="auth-panel-login"
          className={"tab" + (tab === "login" ? " active" : "")}
          onClick={() => setTab("login")}
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          id="auth-tab-register"
          aria-selected={tab === "register"}
          aria-controls="auth-panel-register"
          className={"tab" + (tab === "register" ? " active" : "")}
          onClick={() => setTab("register")}
        >
          Registrarse
        </button>
      </div>

      {tab === "login" ? (
        <div role="tabpanel" id="auth-panel-login" aria-labelledby="auth-tab-login">
          <LoginForm />
        </div>
      ) : (
        <div role="tabpanel" id="auth-panel-register" aria-labelledby="auth-tab-register">
          <RegisterForm />
        </div>
      )}

      <p className="auth-note">Tus datos se guardan en la nube y son accesibles desde cualquier dispositivo.</p>
    </div>
  );
}
