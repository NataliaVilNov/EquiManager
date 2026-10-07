import { useId, useState } from "react";
import { register } from "./authActions.js";
import { authErrorMessage } from "./authErrorMessage.js";

export function RegisterForm() {
  const fid = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="f">
        <label htmlFor={`${fid}-name`}>Nombre completo</label>
        <input
          id={`${fid}-name`}
          autoComplete="name"
          type="text"
          placeholder="Laura García"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="f">
        <label htmlFor={`${fid}-email`}>Email</label>
        <input
          id={`${fid}-email`}
          autoComplete="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="f">
        <label htmlFor={`${fid}-password`}>Contraseña</label>
        <input
          id={`${fid}-password`}
          autoComplete="new-password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <div role="alert" style={{ fontSize: ".78rem", color: "var(--ro)", marginBottom: ".75rem" }}>
          {error}
        </div>
      )}
      <button type="submit" className="btn bts btbl" style={{ marginBottom: ".65rem" }} disabled={saving}>
        {saving ? "Creando cuenta…" : "Crear cuenta →"}
      </button>
    </form>
  );
}
