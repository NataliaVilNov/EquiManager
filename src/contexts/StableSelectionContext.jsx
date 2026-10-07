import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  or,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  deleteField,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseClient.js";
import { subscribeToDoc } from "../lib/firestoreCollections.js";
import { deleteStableCascade } from "../lib/deleteStableCascade.js";
import { canManageStable } from "../lib/permissions.js";
import { boardDefaults } from "../features/boards/boardDefaults.js";
import { AuthContext } from "./AuthContext.jsx";

export const StableSelectionContext = createContext(null);

// Los códigos de invitación eran de 6 caracteres sacados de Math.random().toString(36) y se
// escribían con un setDoc sin comprobar nada: una colisión SOBREESCRIBÍA el código de otra
// cuadra en silencio, de modo que un código ya impreso y repartido empezaba a resolver a una
// cuadra distinta. Ahora son de 8 caracteres (espacio de claves ~1000 veces mayor) sobre un
// alfabeto sin caracteres ambiguos (ni 0/O ni 1/I), y se acuñan dentro de una transacción
// que falla si el documento ya existe.
const INVITE_CODE_LENGTH = 8;
const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_MAX_ATTEMPTS = 8;
const INVITE_CODE_TAKEN = "INVITE_CODE_TAKEN";

function randomInviteCode() {
  let out = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    out += INVITE_CODE_ALPHABET[Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)];
  }
  return out;
}

// Acuña un código libre y ejecuta `writes(tx, code, codeRef)` en la MISMA transacción, para
// que el código y lo que lo acompaña (la cuadra recién creada, por ejemplo) se escriban de
// forma atómica. Si el código sorteado ya existe, reintenta con otro hasta un número acotado
// de veces.
async function withFreshInviteCode(writes) {
  for (let attempt = 0; attempt < INVITE_CODE_MAX_ATTEMPTS; attempt++) {
    const code = randomInviteCode();
    try {
      // eslint-disable-next-line no-await-in-loop
      await runTransaction(db, async (tx) => {
        const codeRef = doc(db, "inviteCodes", code);
        const existing = await tx.get(codeRef);
        if (existing.exists()) throw new Error(INVITE_CODE_TAKEN);
        await writes(tx, code, codeRef);
      });
      return code;
    } catch (e) {
      if (e && e.message === INVITE_CODE_TAKEN) continue;
      throw e;
    }
  }
  throw new Error("No se pudo generar un código de invitación libre. Vuelve a intentarlo.");
}

export function StableSelectionProvider({ children }) {
  const { user, profile } = useContext(AuthContext) || {};
  const [stables, setStables] = useState([]);
  const [activeStableId, setActiveStableId] = useState(null);
  const [activeStable, setActiveStable] = useState(null);
  const [pendingJoin, setPendingJoin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ports renderStableList's data fetch (public/legacy-app.js:334-365), minus the DOM
  // rendering, which is now StableListScreen's job.
  const refreshStables = useCallback(async () => {
    if (!user) {
      setStables([]);
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, "stables"),
        where("memberIds", "array-contains", user.uid)
      );
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setStables(list);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Ports _fbSwitchStable (public/legacy-app.js:367-427), minus D loading and legacy
  // screen switching — StableDataContext reacts to activeStableId, and routing owns
  // which screen is shown.
  const switchStable = useCallback(
    async (stableId) => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const snap = await getDoc(doc(db, "stables", stableId));
        if (!snap.exists()) {
          await setDoc(doc(db, "users", user.uid), { lastStable: null }, { merge: true });
          setActiveStableId(null);
          setActiveStable(null);
          setError(new Error("La cuadra ya no existe o fue eliminada"));
          return;
        }
        const stableData = snap.data();
        if (!(stableData.memberIds || []).includes(user.uid)) {
          await setDoc(doc(db, "users", user.uid), { lastStable: null }, { merge: true });
          setActiveStableId(null);
          setActiveStable(null);
          setError(new Error("Ya no perteneces a esa cuadra"));
          return;
        }
        await setDoc(doc(db, "users", user.uid), { lastStable: stableId }, { merge: true });
        setActiveStableId(stableId);
        setActiveStable({ id: stableId, ...stableData });
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // `activeStable` se cargaba con un único getDoc en switchStable y no se refrescaba JAMÁS,
  // pese a ser lo que alimenta canManageStable: a un integrante ascendido a administrador le
  // seguía faltando la interfaz de administración hasta recargar la página, y a un
  // administrador degradado le seguía apareciendo (y sus escrituras empezaban a ser
  // rechazadas por las reglas). Ahora el doc de la cuadra activa se escucha en vivo.
  // switchStable sigue existiendo para la validación inicial (que exista y que el usuario
  // sea miembro) y para guardar `lastStable`.
  useEffect(() => {
    if (!activeStableId) {
      setActiveStable(null);
      return;
    }
    return subscribeToDoc(doc(db, "stables", activeStableId), (data) => {
      if (!data) {
        // La cuadra ha sido eliminada (por otro administrador o desde otro dispositivo):
        // se suelta la selección en lugar de seguir mostrando datos de algo que ya no existe.
        setActiveStable(null);
        setActiveStableId(null);
        return;
      }
      setActiveStable({ id: activeStableId, ...data });
    });
  }, [activeStableId]);

  // Ports the "if(profile.lastStable) _fbSwitchStable(profile.lastStable)" branch of
  // onAuthStateChanged (former src/firebase.js:28-38, deleted in the Phase 8c cutover).
  // Nothing else in the React port re-selects a returning user's last-used stable — without
  // this, every login lands on the stable list with no stable chosen. Runs once per signed-in
  // user (tracked by uid), not on every render, so it doesn't fight a manual switchStable/
  // exitActiveStable call later in the same session.
  const autoSelectedForUid = useRef(null);
  useEffect(() => {
    if (!user) {
      autoSelectedForUid.current = null;
      return;
    }
    if (!profile || autoSelectedForUid.current === user.uid) return;
    autoSelectedForUid.current = user.uid;
    if (profile.lastStable) switchStable(profile.lastStable);
  }, [user, profile, switchStable]);

  // Ports doCreateStable (public/legacy-app.js:464-492).
  const createStable = useCallback(
    async ({ name, description }) => {
      if (!user || !name || !name.trim()) throw new Error("El nombre es obligatorio");
      const stableName = name.trim();
      // Antes esto eran tres escrituras independientes (cuadra, pizarra, código): si fallaba
      // la del código, la cuadra quedaba creada anunciando un inviteCode que no resolvía a
      // nada y unirse con él devolvía "Código no válido" para siempre. Las tres van ahora en
      // una sola transacción, así que o se crea todo o no se crea nada. El id de la cuadra
      // se reserva en cliente (doc() sin datos) porque una transacción no puede usar addDoc.
      const stableRef = doc(collection(db, "stables"));
      await withFreshInviteCode(async (tx, code, codeRef) => {
        tx.set(stableRef, {
          name: stableName,
          description: (description || "").trim(),
          ownerId: user.uid,
          memberIds: [user.uid],
          members: {
            [user.uid]: {
              name: (profile && profile.name) || user.displayName || "",
              email: user.email,
              role: "admin",
              joined: new Date().toISOString(),
            },
          },
          inviteCode: code,
          created: serverTimestamp(),
        });
        tx.set(doc(db, "stables", stableRef.id, "boardConfig", "main"), boardDefaults());
        tx.set(codeRef, {
          stableId: stableRef.id,
          name: stableName,
          created: serverTimestamp(),
        });
      });
      await switchStable(stableRef.id);
      return stableRef.id;
    },
    [user, profile, switchStable]
  );

  // Ports linkUserToTeamMember (public/legacy-app.js:595-617): now a single targeted field
  // update on the team member's own doc instead of a read-modify-write of the whole stable.
  const linkUserToTeamMember = useCallback(
    async (stableId, teamMemberId, linkedName) => {
      if (!user || !stableId || !teamMemberId) return;
      await updateDoc(doc(db, "stables", stableId, "team", teamMemberId), {
        uid: user.uid,
        userId: user.uid,
        authUid: user.uid,
        email: user.email || "",
        linkedName,
        linkedAt: new Date().toISOString(),
      });
    },
    [user]
  );

  // Ports joinByCode (public/legacy-app.js:496-559): joins the stable, then either
  // auto-links (a direct per-member invite) or hands back pendingJoin so the caller can
  // show the "which team member are you" picker, mirroring _pendingJoin/showJoinTeamModal.
  const joinByCode = useCallback(
    async (rawCode) => {
      if (!user) throw new Error("Inicia sesión primero");
      const code = (rawCode || "").trim().toUpperCase();
      if (!code) throw new Error("Introduce un código de invitación");

      const codeSnap = await getDoc(doc(db, "inviteCodes", code));
      if (!codeSnap.exists()) throw new Error("Código no válido");
      const codeData = codeSnap.data() || {};
      const stableId = codeData.stableId;
      if (!stableId) throw new Error("Código sin cuadra asociada");

      const stableRef = doc(db, "stables", stableId);
      const memberName = (profile && profile.name) || user.displayName || user.email || "";

      // Ya NO se lee stables/{stableId} antes de entrar: la regla de lectura exige ser
      // miembro, así que ese getDoc previo era un permission-denied garantizado para quien
      // está canjeando un código y rompía el alta por completo. Se pasa directamente al
      // update de entrada usando solo lo que trae inviteCodes/{code} (stableId y name), y la
      // cuadra se lee DESPUÉS, cuando ya se pertenece a ella.
      let stableData = null;
      try {
        await updateDoc(stableRef, {
          memberIds: arrayUnion(user.uid),
          [`members.${user.uid}`]: {
            name: memberName,
            email: user.email || "",
            role: "miembro",
            teamMemberId: codeData.teamMemberId || null,
            teamName: codeData.teamMemberName || null,
            joined: new Date().toISOString(),
          },
        });
      } catch (_joinErr) {
        // Las reglas deniegan este update en dos casos distintos: si ya eres miembro (no se
        // puede "entrar" dos veces) y si la cuadra no existe. El fallo del update sustituye
        // al antiguo exists(), y leer el documento ahora los distingue: stables/{id} solo lo
        // pueden leer sus miembros, así que si la lectura funciona es que ya se pertenecía a
        // la cuadra y se puede continuar con el alta como antes.
        const snap = await getDoc(stableRef).catch(() => null);
        if (!snap || !snap.exists()) {
          throw new Error("La cuadra ya no existe o el código no es válido");
        }
        stableData = snap.data() || {};
      }

      // Lecturas que ahora exigen ser miembro, por lo que van después del alta.
      if (!stableData) {
        const snap = await getDoc(stableRef).catch(() => null);
        stableData = snap && snap.exists() ? snap.data() : { name: codeData.name || "" };
      }
      const teamSnap = await getDocs(collection(db, "stables", stableId, "team"));
      const team = teamSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (codeData.teamMemberId) {
        await linkUserToTeamMember(stableId, codeData.teamMemberId, memberName);
        await switchStable(stableId);
        return { status: "linked", memberName: codeData.teamMemberName || "integrante" };
      }

      const pending = { code, codeData, stableId, stableData, team };
      setPendingJoin(pending);
      return { status: "needs-member-selection", pendingJoin: pending };
    },
    [user, profile, linkUserToTeamMember, switchStable]
  );

  // Ports confirmJoinAs (public/legacy-app.js:619-637).
  const confirmJoinAs = useCallback(
    async (teamMemberId) => {
      if (!pendingJoin) throw new Error("No hay invitación pendiente");
      const memberName =
        (profile && profile.name) || (user && user.displayName) || (user && user.email) || "";
      const selected = teamMemberId
        ? (pendingJoin.team || []).find((m) => m.id === teamMemberId)
        : null;
      if (teamMemberId) {
        await linkUserToTeamMember(pendingJoin.stableId, teamMemberId, memberName);
      }
      const stableId = pendingJoin.stableId;
      setPendingJoin(null);
      await switchStable(stableId);
      return selected ? selected.name : null;
    },
    [pendingJoin, profile, user, linkUserToTeamMember, switchStable]
  );

  const cancelJoin = useCallback(() => setPendingJoin(null), []);

  // Ports createMemberInvite (public/legacy-app.js:737-767), minus the "already linked?"
  // confirm dialog and the clipboard/toast UI, which are the caller's job (same split as
  // deleteStable/leaveStable leaving window.confirm() to StablePanel). Takes the full
  // member object rather than an id, since StableSelectionContext has no access to
  // StableDataContext's `team` slice to look one up itself.
  const createMemberInvite = useCallback(
    async (member) => {
      if (!user || !activeStable) throw new Error("No hay cuadra activa");
      if (!canManageStable(activeStable, user)) {
        throw new Error("Solo el administrador puede crear invitaciones vinculadas");
      }
      // Mismo problema que en createStable: un setDoc sin comprobar podía pisar el código de
      // otra cuadra. withFreshInviteCode acuña uno libre dentro de una transacción.
      return withFreshInviteCode((tx, code, codeRef) => {
        tx.set(codeRef, {
          stableId: activeStable.id,
          name: activeStable.name || "",
          teamMemberId: member.id,
          teamMemberName: member.name || "",
          createdBy: user.uid,
          created: new Date().toISOString(),
        });
      });
    },
    [user, activeStable]
  );

  // Ports goAfterStableExit (public/legacy-app.js:770-781).
  const exitActiveStable = useCallback(async () => {
    setActiveStableId(null);
    setActiveStable(null);
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), { lastStable: null }, { merge: true });
      } catch (_e) {
        // ignore
      }
    }
    await refreshStables();
  }, [user, refreshStables]);

  // Ports deleteStable (public/legacy-app.js:783-815). The caller is responsible for
  // confirming with the user before calling this — no window.confirm() here.
  // Solo el PROPIETARIO puede eliminar la cuadra. Antes bastaba con canManageStable
  // (propietario o administrador) y eso es ahora destructivo: deleteStableCascade() corre
  // primero, así que un administrador que pulsara "eliminar" vaciaba la cuadra entera y solo
  // después se le denegaba el borrado del documento — datos destruidos y cuadra en pie. La
  // interfaz debe ocultar el botón usando `canDeleteStable`.
  const canDeleteStable = useMemo(
    () => !!(user && activeStable && activeStable.ownerId === user.uid),
    [user, activeStable]
  );

  const deleteStable = useCallback(async () => {
    if (!user || !activeStable) return;
    if (activeStable.ownerId !== user.uid) {
      throw new Error("Solo el propietario puede eliminar la cuadra");
    }
    // Antes el doc stables/{id} se borraba ANTES del código de invitación, y además solo se
    // borraba `activeStable.inviteCode`: los códigos vinculados a cada integrante quedaban
    // vivos apuntando a una cuadra inexistente. deleteStableCascade borra ahora TODOS los
    // códigos de la cuadra (consulta por stableId) y lo hace en primer lugar, antes de
    // cualquier otro borrado; el doc de la cuadra se elimina al final.
    await deleteStableCascade(activeStable.id);
    await deleteDoc(doc(db, "stables", activeStable.id));
    await exitActiveStable();
  }, [user, activeStable, exitActiveStable]);

  // Ports leaveStable (public/legacy-app.js:817-874). The caller confirms with the user
  // first.
  const leaveStable = useCallback(async () => {
    if (!user || !activeStable) return;
    if (activeStable.ownerId === user.uid) {
      throw new Error("El propietario no puede abandonar: debe eliminar la cuadra");
    }
    const members = activeStable.memberIds || [];
    if (members.length <= 1) {
      throw new Error("Eres el único miembro. Elimina la cuadra.");
    }
    try {
      const teamRef = collection(db, "stables", activeStable.id, "team");
      const snap = await getDocs(
        query(
          teamRef,
          or(
            where("uid", "==", user.uid),
            where("userId", "==", user.uid),
            where("authUid", "==", user.uid)
          )
        )
      );
      await Promise.all(
        snap.docs.map((d) =>
          updateDoc(d.ref, {
            uid: deleteField(),
            userId: deleteField(),
            authUid: deleteField(),
            linkedName: deleteField(),
            linkedAt: deleteField(),
            linkedEmail: deleteField(),
          })
        )
      );
    } catch (_e) {
      // non-fatal, mirrors legacy behavior: don't block leaving the stable
    }
    await updateDoc(doc(db, "stables", activeStable.id), {
      memberIds: arrayRemove(user.uid),
      [`members.${user.uid}`]: deleteField(),
    });
    await exitActiveStable();
  }, [user, activeStable, exitActiveStable]);

  const value = useMemo(
    () => ({
      stables,
      activeStableId,
      activeStable,
      pendingJoin,
      loading,
      error,
      refreshStables,
      switchStable,
      createStable,
      joinByCode,
      confirmJoinAs,
      cancelJoin,
      deleteStable,
      canDeleteStable,
      leaveStable,
      exitActiveStable,
      createMemberInvite,
    }),
    [
      stables,
      activeStableId,
      activeStable,
      pendingJoin,
      loading,
      error,
      refreshStables,
      switchStable,
      createStable,
      joinByCode,
      confirmJoinAs,
      cancelJoin,
      deleteStable,
      canDeleteStable,
      leaveStable,
      exitActiveStable,
      createMemberInvite,
    ]
  );

  return (
    <StableSelectionContext.Provider value={value}>
      {children}
    </StableSelectionContext.Provider>
  );
}
