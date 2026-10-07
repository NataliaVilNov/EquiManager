import { useId, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStableData } from "../../hooks/useStableData.js";
import { useToast } from "../../hooks/useToast.js";
import { uid } from "../../lib/id.js";
import { EM } from "../../lib/constants.js";
import { defaultTeamPermissions } from "../../lib/permissions.js";

const PERM_OPTS = [
  ["horses", "Añadir/editar caballos", "Puede crear caballos y editar datos básicos"],
  ["trainings", "Entrenamientos", "Puede añadir entrenamientos y rellenar fichas"],
  ["tasks", "Tareas", "Puede crear y modificar sus tareas"],
  ["expenses", "Gastos", "Puede añadir y editar gastos, sin eliminarlos"],
  ["health", "Salud / Herrajes / Vacunas", "Puede añadir y editar registros sanitarios"],
  ["reports", "Informes", "Puede generar informes de caballos"],
  ["stats", "Estadísticas", "Puede ver estadísticas generales"],
  ["team", "Equipo", "Puede ver/gestionar equipo y plantillas"],
  ["stable", "Cuadra", "Puede ver/gestionar tareas y gastos de cuadra"],
  ["sale", "Venta", "Puede ver precios de venta y liquidaciones"],
  ["deleteItems", "Eliminar registros", "Puede eliminar gastos, salud, entrenos, tareas o caballos"],
];

// Ports rMF (public/legacy-app.js:3379-3419). The 11-checkbox permissions editor is kept
// inline rather than a separate component — one consumer, same call made for Home (Phase 4).
//
// El componente exterior espera a que llegue `team`: sembrar el useState con la colección
// vacía (recarga o enlace directo a la URL de edición) hacía que Guardar escribiera un
// miembro en blanco —y con los permisos por defecto— encima del real.
export function TeamMemberFormPage() {
  const { mid } = useParams();
  const { team, isLoaded } = useStableData();

  if (!isLoaded("team")) {
    return (
      <div className="view">
        <div className="ld">
          <div className="sp"></div>
          <p>Cargando miembro...</p>
        </div>
      </div>
    );
  }

  const member = mid ? team.find((m) => m.id === mid) : null;

  if (mid && !member) {
    return (
      <div className="view">
        <p>No encontrado.</p>
      </div>
    );
  }

  return <TeamMemberForm key={mid || "new"} member={member} />;
}

function TeamMemberForm({ member }) {
  const editing = !!member;
  const { addTeamMember, updateTeamMember, deleteTeamMember, uploadTeamMemberPhoto } = useStableData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fid = useId();

  // Generated up front so a photo picked before saving can upload straight to its final
  // Storage path under this member's own id.
  const [id] = useState(() => (editing ? member.id : uid()));

  const [photo, setPhoto] = useState(member ? member.photo || null : null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [emoji, setEmoji] = useState(member ? member.emoji || "👤" : "👤");
  const [name, setName] = useState(member ? member.name || "" : "");
  const [role, setRole] = useState(member ? member.role || "" : "");
  const [aliases, setAliases] = useState(member ? member.aliases || member.alias || "" : "");
  const [phone, setPhone] = useState(member ? member.phone || "" : "");
  const [email, setEmail] = useState(member ? member.email || "" : "");
  const [permissions, setPermissions] = useState(() => ({
    ...defaultTeamPermissions(),
    ...(member && member.permissions ? member.permissions : {}),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const uploaded = await uploadTeamMemberPhoto(id, file, () => {});
      setPhoto(uploaded);
    } catch (_err) {
      showToast("Error subiendo la foto");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function togglePermission(key) {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit() {
    if (saving) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nombre obligatorio");
      showToast("Nombre obligatorio");
      return;
    }
    const record = {
      id,
      name: trimmedName,
      role: role.trim(),
      aliases: aliases.trim(),
      phone: phone.trim(),
      email: email.trim(),
      emoji: emoji || "👤",
      photo,
      permissions,
      uid: editing ? member.uid || null : null,
      userId: editing ? member.userId || null : null,
      authUid: editing ? member.authUid || null : null,
      linkedAt: editing ? member.linkedAt || null : null,
      linkedName: editing ? member.linkedName || null : null,
      linkedEmail: editing ? member.linkedEmail || null : null,
    };
    setError("");
    setSaving(true);
    try {
      if (editing) await updateTeamMember(record);
      else await addTeamMember(record);
      showToast(editing ? "Guardado" : "Miembro añadido");
      navigate("/team");
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo guardar el miembro. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving) return;
    if (!window.confirm("¿Eliminar este miembro del equipo?")) return;
    setError("");
    setSaving(true);
    try {
      await deleteTeamMember(member.id);
      showToast("Eliminado");
      navigate("/team");
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo eliminar el miembro. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="view">
      <div className="vh">
        <button className="ib" onClick={() => navigate("/team")} aria-label="Volver al equipo">
          ←
        </button>
        <h1>{editing ? "Editar" : "Nuevo"} miembro</h1>
      </div>
      <div className="f">
        <label>Foto</label>
        <div className="pu">
          <div className="pp" style={{ borderRadius: "50%" }}>
            {uploadingPhoto ? "…" : photo ? <img src={photo.url} alt="" /> : emoji}
          </div>
          <label className="fl" htmlFor={`${fid}-photo`}>
            Foto
            <input
              id={`${fid}-photo`}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={uploadingPhoto}
            />
          </label>
        </div>
      </div>
      <div className="f">
        <label id={`${fid}-emoji-label`}>Avatar</label>
        <div className="pch" role="group" aria-labelledby={`${fid}-emoji-label`}>
          {EM.map((e) => (
            <button
              type="button"
              key={e}
              className={"pc" + (emoji === e ? " active" : "")}
              aria-pressed={emoji === e}
              aria-label={`Avatar ${e}`}
              onClick={() => setEmoji(e)}
              style={{ fontSize: "1.2rem", padding: ".3rem .5rem" }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="f">
        <label htmlFor={`${fid}-name`}>Nombre *</label>
        <input
          id={`${fid}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Laura García"
        />
      </div>
      <div className="f">
        <label htmlFor={`${fid}-role`}>Rol</label>
        <input
          id={`${fid}-role`}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Mozo de cuadra"
        />
      </div>
      <div className="f">
        <label htmlFor={`${fid}-aliases`}>Alias / mote para órdenes</label>
        <input
          id={`${fid}-aliases`}
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          placeholder="Ej: Ale, Alex, Isa, Nati"
        />
      </div>
      <div className="f">
        <label htmlFor={`${fid}-phone`}>Contacto</label>
        <input
          id={`${fid}-phone`}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="600 000 000"
        />
      </div>
      <div className="f">
        <label htmlFor={`${fid}-email`}>Email de acceso (opcional)</label>
        <input
          id={`${fid}-email`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="persona@email.com"
        />
      </div>
      <div className="card" style={{ padding: ".85rem", marginBottom: ".85rem" }}>
        <div
          style={{
            fontSize: ".7rem",
            fontWeight: 700,
            color: "var(--gr)",
            textTransform: "uppercase",
            letterSpacing: ".07em",
            marginBottom: ".65rem",
          }}
        >
          Permisos del integrante
        </div>
        {PERM_OPTS.map(([key, label, desc]) => (
          <label
            key={key}
            htmlFor={`${fid}-perm-${key}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: ".55rem",
              textTransform: "none",
              letterSpacing: 0,
              fontSize: ".82rem",
              color: "var(--ti)",
              fontWeight: 700,
              marginBottom: ".55rem",
            }}
          >
            <input
              id={`${fid}-perm-${key}`}
              type="checkbox"
              checked={!!permissions[key]}
              onChange={() => togglePermission(key)}
              style={{ width: "auto", marginTop: ".15rem" }}
            />
            <span>
              {label}
              <br />
              <small style={{ fontWeight: 400, color: "var(--gr)" }}>{desc}</small>
            </span>
          </label>
        ))}
      </div>
      {error && (
        <div role="alert" style={{ fontSize: ".78rem", color: "var(--ro)", marginBottom: ".6rem" }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gap: ".42rem" }}>
        <button type="button" className="btn bts btbl" onClick={handleSubmit} disabled={saving}>
          {saving ? "Guardando…" : editing ? "Guardar cambios" : "Añadir al equipo"}
        </button>
        {editing && (
          <button type="button" className="btn btr btbl" onClick={handleDelete} disabled={saving}>
            Eliminar miembro
          </button>
        )}
      </div>
    </div>
  );
}
