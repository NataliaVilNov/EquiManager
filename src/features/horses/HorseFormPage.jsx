import { useId, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStableData } from "../../hooks/useStableData.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { useToast } from "../../hooks/useToast.js";
import { uid } from "../../lib/id.js";
import { canViewHorseInfo, isHorseRestricted } from "./horseAccess.js";
import { AccessLimited } from "../../components/AccessLimited.jsx";
import { OwnerSplitEditor } from "./OwnerSplitEditor.jsx";
import { PedigreeFields } from "./PedigreeFields.jsx";
import { HorseAccessEditor } from "./HorseAccessEditor.jsx";
import { duplicateOwnerNames } from "../expenses/expenseSplits.js";

const PEDIGREE_KEYS = ["sire", "dam", "gsire", "gdam", "mgsire", "mgdam"];

function ownersFromHorse(horse) {
  if (horse && horse.owners && horse.owners.length) return horse.owners.map((o) => ({ ...o }));
  if (horse && horse.owner) return [{ nombre: horse.owner, pct: 100 }];
  return [{ nombre: "", pct: 100 }];
}

function fieldsFromHorse(horse) {
  const base = {
    name: "",
    breed: "",
    aliases: "",
    origin: "",
    dob: "",
    arrival: "",
    notes: "",
    photo: null,
    horsetelex: "",
  };
  PEDIGREE_KEYS.forEach((k) => (base[k] = ""));
  if (!horse) return base;
  return {
    ...base,
    name: horse.name || "",
    breed: horse.breed || "",
    aliases: horse.aliases || horse.alias || "",
    origin: horse.origin || "",
    dob: horse.dob || "",
    arrival: horse.arrival || "",
    notes: horse.notes || "",
    photo: horse.photo || null,
    horsetelex: horse.horsetelex || "",
    sire: horse.sire || "",
    dam: horse.dam || "",
    gsire: horse.gsire || "",
    gdam: horse.gdam || "",
    mgsire: horse.mgsire || "",
    mgdam: horse.mgdam || "",
  };
}

// Ports rHF (public/legacy-app.js:1576-1643) and the horse-save handler in attach()
// (public/legacy-app.js:3622-3646). The route-level PermissionRoute("horses") replaces
// requirePermissionView.
//
// Este componente exterior solo ESPERA los datos. Era el caso más grave de todos: `horses`
// arranca vacío, así que al entrar directo a /horses/:hid/edit el formulario se sembraba con
// la ficha en blanco y, como updateHorse es un setDoc completo (reemplaza el documento),
// pulsar Guardar borraba nombre, propietarios, pedigrí y foto del caballo real. El formulario
// se monta aparte y con `key`, así sus inicializadores corren una sola vez con datos reales.
export function HorseFormPage() {
  const { hid } = useParams();
  const { horses, isLoaded } = useStableData();
  const { isAdmin, uid: myUid } = usePermissions();

  if (!isLoaded("horses", "team")) {
    return (
      <div className="view">
        <div className="ld">
          <div className="sp"></div>
          <p>Cargando ficha...</p>
        </div>
      </div>
    );
  }

  const horse = hid ? horses.find((h) => h.id === hid) : null;

  if (hid && !horse) {
    return (
      <div className="view">
        <p>No encontrado.</p>
      </div>
    );
  }
  if (horse && !canViewHorseInfo(horse, isAdmin, myUid)) {
    return <AccessLimited />;
  }

  return <HorseForm key={hid || "new"} horse={horse} />;
}

function HorseForm({ horse }) {
  const editing = !!horse;
  const { team, addHorse, updateHorse, deleteHorse, uploadHorsePhoto } = useStableData();
  const { can, isAdmin, uid: myUid } = usePermissions();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fid = useId();

  // Generated up front (not just at submit) so a photo picked before saving can upload
  // straight to its final Storage path under this horse's own id.
  const [id] = useState(() => (editing ? horse.id : uid()));
  const [fields, setFields] = useState(() => fieldsFromHorse(horse));
  const [owners, setOwners] = useState(() => ownersFromHorse(horse));
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [restricted, setRestricted] = useState(() => isHorseRestricted(horse));
  const [allowedUids, setAllowedUids] = useState(() =>
    isHorseRestricted(horse) ? horse.allowedUids : editing ? [] : myUid ? [myUid] : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pedigree = useMemo(() => {
    const p = {};
    PEDIGREE_KEYS.forEach((k) => (p[k] = fields[k]));
    return p;
  }, [fields]);

  function setField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handlePedigreeImport(updates) {
    setFields((prev) => ({ ...prev, ...updates }));
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const photo = await uploadHorsePhoto(id, file, () => {});
      setField("photo", photo);
    } catch (_err) {
      showToast("Error subiendo la foto");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit() {
    if (saving) return;
    const name = fields.name.trim();
    if (!name) {
      setError("Nombre obligatorio");
      showToast("Nombre obligatorio");
      return;
    }
    const ownersArr = owners
      .map((o) => ({ nombre: (o.nombre || "").trim(), pct: Number(o.pct) || 0 }))
      .filter((o) => o.nombre);
    const totalPct = ownersArr.reduce((s, o) => s + o.pct, 0);
    if (ownersArr.length && Math.abs(totalPct - 100) > 0.5) {
      setError("Los porcentajes deben sumar 100%");
      showToast("Los porcentajes deben sumar 100%");
      return;
    }
    // Los repartos de gastos y la liquidación de venta identifican al propietario por su
    // nombre: dos nombres iguales no se pueden distinguir y su parte quedaría mal imputada.
    const dups = duplicateOwnerNames(ownersArr);
    if (dups.length) {
      const msg = `Hay propietarios con el mismo nombre (${dups.join(", ")}). Usa nombres distintos.`;
      setError(msg);
      showToast(msg);
      return;
    }
    const record = {
      id,
      name,
      owner: ownersArr.length ? ownersArr[0].nombre : "",
      owners: ownersArr,
      breed: fields.breed.trim(),
      aliases: fields.aliases.trim(),
      origin: fields.origin.trim(),
      dob: fields.dob,
      arrival: fields.arrival,
      notes: fields.notes.trim(),
      sire: fields.sire.trim(),
      dam: fields.dam.trim(),
      gsire: fields.gsire.trim(),
      gdam: fields.gdam.trim(),
      mgsire: fields.mgsire.trim(),
      mgdam: fields.mgdam.trim(),
      horsetelex: fields.horsetelex.trim(),
      photo: fields.photo,
    };
    if (editing && horse.sale) record.sale = horse.sale;
    record.allowedUids = isAdmin
      ? restricted
        ? allowedUids
        : null
      : editing
      ? horse.allowedUids ?? null
      : [myUid];
    setError("");
    setSaving(true);
    try {
      if (editing) await updateHorse(record);
      else await addHorse(record);
      showToast(editing ? "Guardado" : "Caballo añadido");
      navigate(`/horses/${id}?tab=entrenos`);
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo guardar el caballo. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving) return;
    if (!window.confirm("¿Eliminar este caballo y todos sus datos?")) return;
    setError("");
    setSaving(true);
    try {
      await deleteHorse(horse.id);
      showToast("Caballo eliminado");
      navigate("/horses");
    } catch (err) {
      setError(err && err.message ? err.message : "No se pudo eliminar el caballo. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="view">
      <div className="vh">
        <button
          className="ib"
          onClick={() => navigate(editing ? `/horses/${horse.id}?tab=entrenos` : "/horses")}
          aria-label="Volver"
        >
          ←
        </button>
        <h1>{editing ? "Editar caballo" : "Nuevo caballo"}</h1>
      </div>
      <div className="f">
        <label>Foto</label>
        <div className="pu">
          <div className="pp">
            {uploadingPhoto ? "…" : fields.photo ? <img src={fields.photo.url} alt="" /> : "🐴"}
          </div>
          <label className="fl" htmlFor={`${fid}-photo`}>
            Elegir foto
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
        <label htmlFor={`${fid}-name`}>Nombre *</label>
        <input
          id={`${fid}-name`}
          value={fields.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Ej: Tornado"
        />
      </div>
      <div className="f">
        <label htmlFor={`${fid}-breed`}>Raza</label>
        <input
          id={`${fid}-breed`}
          value={fields.breed}
          onChange={(e) => setField("breed", e.target.value)}
          placeholder="PRE"
        />
      </div>
      <div className="f">
        <label htmlFor={`${fid}-aliases`}>Alias / motes</label>
        <input
          id={`${fid}-aliases`}
          value={fields.aliases}
          onChange={(e) => setField("aliases", e.target.value)}
          placeholder="Ej: Chaco, Cales, Go Go"
        />
      </div>
      <OwnerSplitEditor owners={owners} onChange={setOwners} />
      <div className="f">
        <label htmlFor={`${fid}-origin`}>Origen / Procedencia</label>
        <input
          id={`${fid}-origin`}
          value={fields.origin}
          onChange={(e) => setField("origin", e.target.value)}
          placeholder="Ej: Yeguada Santa Cruz, Sevilla"
        />
      </div>
      <PedigreeFields
        pedigree={pedigree}
        onFieldChange={setField}
        horsetelex={fields.horsetelex}
        onHorsetelexChange={(v) => setField("horsetelex", v)}
        onImport={handlePedigreeImport}
        current={fields}
      />
      <div className="r2">
        <div className="f">
          <label htmlFor={`${fid}-dob`}>Nacimiento</label>
          <input
            id={`${fid}-dob`}
            type="date"
            value={fields.dob}
            onChange={(e) => setField("dob", e.target.value)}
          />
        </div>
        <div className="f">
          <label htmlFor={`${fid}-arrival`}>Llegada</label>
          <input
            id={`${fid}-arrival`}
            type="date"
            value={fields.arrival}
            onChange={(e) => setField("arrival", e.target.value)}
          />
        </div>
      </div>
      <div className="f">
        <label htmlFor={`${fid}-notes`}>Notas</label>
        <textarea
          id={`${fid}-notes`}
          value={fields.notes}
          onChange={(e) => setField("notes", e.target.value)}
        />
      </div>
      {isAdmin ? (
        <HorseAccessEditor
          team={team}
          restricted={restricted}
          onRestrictedChange={setRestricted}
          allowedUids={allowedUids}
          onAllowedUidsChange={setAllowedUids}
        />
      ) : (
        editing &&
        isHorseRestricted(horse) && (
          <div className="card" style={{ padding: ".85rem", marginBottom: ".85rem", fontSize: ".82rem" }}>
            🔒 Compartido con:{" "}
            {team
              .filter((m) => horse.allowedUids.includes(m.uid || m.userId || m.authUid))
              .map((m) => m.name)
              .join(", ") || "nadie más (solo administradores)"}
          </div>
        )
      )}
      {error && (
        <div role="alert" style={{ fontSize: ".78rem", color: "var(--ro)", marginBottom: ".6rem" }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gap: ".42rem" }}>
        <button type="button" className="btn bts btbl" onClick={handleSubmit} disabled={saving}>
          {saving ? "Guardando…" : editing ? "Guardar cambios" : "Añadir caballo"}
        </button>
        {editing && can("deleteItems") && (
          <button type="button" className="btn btr btbl" onClick={handleDelete} disabled={saving}>
            Eliminar caballo
          </button>
        )}
      </div>
    </div>
  );
}
