import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cleanForFirestore } from "../lib/cleanForFirestore.js";
import { writeBatch, query, where } from "firebase/firestore";
import {
  stableCollection,
  stableDoc,
  writeDoc,
  writeDocMerged,
  patchDoc,
  deleteDocRef,
  subscribeToCollection,
  subscribeToCollectionGroup,
  subscribeToDoc,
  batchDeleteQuery,
  commitBatch,
  commitInChunks,
} from "../lib/firestoreCollections.js";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage, db } from "../lib/firebaseClient.js";
import { catFromHealthType, activityById } from "../lib/constants.js";
import { taskNeedsReturn } from "../features/tasks/taskHelpers.js";
import { boardDefaults } from "../features/boards/boardDefaults.js";
import { boardAssignment, horseConflict, safeBoardId } from "../features/boards/boardHelpers.js";
import { isHorseRestricted } from "../features/horses/horseAccess.js";
import { canManageStable } from "../lib/permissions.js";
import { uid } from "../lib/id.js";
import { td, addD } from "../lib/date.js";
import { AuthContext } from "./AuthContext.jsx";
import { StableSelectionContext } from "./StableSelectionContext.jsx";

// Ports uploadFileWithProgress (public/legacy-app.js:1097-1109), minus the DOM status
// write — callers pass an onProgress(pct) callback instead.
function uploadFileWithProgress(ref, file, metadata, onProgress) {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref, file, metadata);
    task.on(
      "state_changed",
      (snap) => {
        onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      reject,
      async () => {
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

function safeStorageName(name) {
  return (name || "documento")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 120);
}

// Weekly-plan cells are always looked up by (hid, date), never by an opaque id, so a
// deterministic id lets every mutator target a cell's doc directly instead of first finding
// its existing random id.
function weeklyPlanCellId(hid, date) {
  return `${hid}__${date}`;
}

// Mirrors ensureBoardData's defensive defaulting (public/legacy-app.js:1289-1299) applied to
// the boardConfig doc read from its own collection instead of the shared blob.
function normalizeBoardConfig(raw) {
  if (!raw || typeof raw !== "object") return boardDefaults();
  const defaults = boardDefaults();
  const cfg = { ...raw };
  ["activities", "periodicColumns", "walkers", "paddocks", "paddockSlots"].forEach((k) => {
    if (!Array.isArray(cfg[k])) cfg[k] = defaults[k];
  });
  // Backfills the "vet" activity onto stables created before the weekly board's VET flow
  // existed — new stables already get it from boardDefaults() above.
  if (!cfg.activities.some((a) => a.id === "vet")) {
    cfg.activities = [...cfg.activities, defaults.activities.find((a) => a.id === "vet")];
  }
  return cfg;
}

// Toda colección de este contexto arrancaba en [] (y boardConfig en boardDefaults()) sin
// ninguna señal de "esto aún no ha llegado": un formulario de edición sembraba su useState
// con datos vacíos y al guardar escribía ESO, borrando el registro real. `loaded` da una
// bandera por colección para que la interfaz pueda esperar al primer snapshot.
const LOADED_KEYS = [
  "horses",
  "trainings",
  "health",
  "expenses",
  "healthDocs",
  "team",
  "tasks",
  "sessionAlerts",
  "taskTemplates",
  "stableExpenses",
  "absences",
  "expenseSettlements",
  "weeklyPlans",
  "periodicBoardDates",
  "boardAssignments",
  "boardConfig",
];

function noneLoaded() {
  const out = {};
  LOADED_KEYS.forEach((k) => {
    out[k] = false;
  });
  return out;
}

// Par (onNext, onError) de un listener que marca su colección como cargada en AMBOS casos:
// si una lectura es rechazada por las reglas o falta un índice, la bandera igualmente pasa a
// true para que la interfaz no se quede esperando indefinidamente (el fallo ya se avisa por
// su cuenta desde firestoreCollections.js).
// Fija una bandera de `loaded` a un valor concreto. Hace falta poder volver a ponerla en
// FALSE, no solo marcarla: una colección leída con listeners por caballo se vuelve a cargar
// desde cero cada vez que cambia el conjunto de caballos visibles.
function setLoadedFlag(setLoaded, key, value) {
  setLoaded((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
}

function trackedHandlers(setLoaded, key, apply) {
  const mark = () => setLoaded((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  return [
    (data) => {
      apply(data);
      mark();
    },
    mark,
  ];
}

const BOARD_CONFIG_NOT_LOADED =
  "La configuración de la pizarra todavía no se ha cargado. Espera un momento y vuelve a intentarlo.";

export const StableDataContext = createContext(null);

export function StableDataProvider({ stableId, children }) {
  // Needed to split the expenses read path below by role — can't use usePermissions() here,
  // since that hook itself reads from this same context (circular).
  const { user } = useContext(AuthContext) || {};
  const { activeStable } = useContext(StableSelectionContext) || {};
  const isAdmin = useMemo(() => canManageStable(activeStable, user), [activeStable, user]);
  const myUid = user ? user.uid : null;

  const [horses, setHorses] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [health, setHealth] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [healthDocs, setHealthDocs] = useState([]);
  const [team, setTeam] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sessionAlerts, setSessionAlerts] = useState([]);
  const [taskTemplates, setTaskTemplates] = useState([]);
  const [stableExpenses, setStableExpenses] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [expenseSettlements, setExpenseSettlements] = useState([]);
  const [weeklyPlans, setWeeklyPlans] = useState([]);
  const [periodicBoardDates, setPeriodicBoardDates] = useState([]);
  const [boardAssignments, setBoardAssignments] = useState([]);
  const [boardConfig, setBoardConfig] = useState(boardDefaults());
  // ¿Existe realmente el doc boardConfig/main? Las cuadras creadas antes de que boardConfig
  // tuviera su propio documento no lo tienen, y updateDoc falla sobre un doc inexistente, así
  // que los mutadores de la pizarra necesitan saberlo para elegir entre updateDoc y la
  // creación inicial.
  const [boardConfigExists, setBoardConfigExists] = useState(false);
  const [loaded, setLoaded] = useState(noneLoaded);

  // Al cambiar de cuadra todas las banderas vuelven a false: los datos de la cuadra anterior
  // ya no valen y la interfaz debe volver a esperar. Declarado ANTES de las suscripciones
  // para que el reinicio ocurra antes de que se enganchen los nuevos listeners.
  useEffect(() => {
    setLoaded(noneLoaded());
    setBoardConfigExists(false);
  }, [stableId]);

  useEffect(() => {
    if (!stableId) {
      setHorses([]);
      return;
    }
    return subscribeToCollection(
      stableCollection(stableId, "horses"),
      ...trackedHandlers(setLoaded, "horses", setHorses)
    );
  }, [stableId]);

  useEffect(() => {
    if (!stableId) {
      setTeam([]);
      return;
    }
    return subscribeToCollection(
      stableCollection(stableId, "team"),
      ...trackedHandlers(setLoaded, "team", setTeam)
    );
  }, [stableId]);

  useEffect(() => {
    if (!stableId) {
      setTasks([]);
      return;
    }
    return subscribeToCollection(
      stableCollection(stableId, "tasks"),
      ...trackedHandlers(setLoaded, "tasks", setTasks)
    );
  }, [stableId]);

  useEffect(() => {
    if (!stableId) {
      setSessionAlerts([]);
      return;
    }
    return subscribeToCollection(
      stableCollection(stableId, "sessionAlerts"),
      ...trackedHandlers(setLoaded, "sessionAlerts", setSessionAlerts)
    );
  }, [stableId]);

  useEffect(() => {
    if (!stableId) {
      setTaskTemplates([]);
      return;
    }
    return subscribeToCollection(
      stableCollection(stableId, "taskTemplates"),
      ...trackedHandlers(setLoaded, "taskTemplates", setTaskTemplates)
    );
  }, [stableId]);

  useEffect(() => {
    if (!stableId) {
      setStableExpenses([]);
      return;
    }
    return subscribeToCollection(
      stableCollection(stableId, "stableExpenses"),
      ...trackedHandlers(setLoaded, "stableExpenses", setStableExpenses)
    );
  }, [stableId]);

  useEffect(() => {
    if (!stableId) {
      setAbsences([]);
      return;
    }
    return subscribeToCollection(
      stableCollection(stableId, "absences"),
      ...trackedHandlers(setLoaded, "absences", setAbsences)
    );
  }, [stableId]);

  useEffect(() => {
    if (!stableId) {
      setExpenseSettlements([]);
      return;
    }
    return subscribeToCollection(
      stableCollection(stableId, "expenseSettlements"),
      ...trackedHandlers(setLoaded, "expenseSettlements", setExpenseSettlements)
    );
  }, [stableId]);

  useEffect(() => {
    if (!stableId) {
      setWeeklyPlans([]);
      return;
    }
    return subscribeToCollection(
      stableCollection(stableId, "weeklyPlans"),
      ...trackedHandlers(setLoaded, "weeklyPlans", setWeeklyPlans)
    );
  }, [stableId]);

  useEffect(() => {
    if (!stableId) {
      setPeriodicBoardDates([]);
      return;
    }
    return subscribeToCollection(
      stableCollection(stableId, "periodicBoardDates"),
      ...trackedHandlers(setLoaded, "periodicBoardDates", setPeriodicBoardDates)
    );
  }, [stableId]);

  useEffect(() => {
    if (!stableId) {
      setBoardAssignments([]);
      return;
    }
    return subscribeToCollection(
      stableCollection(stableId, "boardAssignments"),
      ...trackedHandlers(setLoaded, "boardAssignments", setBoardAssignments)
    );
  }, [stableId]);

  useEffect(() => {
    if (!stableId) {
      setBoardConfig(boardDefaults());
      return;
    }
    return subscribeToDoc(
      stableDoc(stableId, "boardConfig", "main"),
      ...trackedHandlers(setLoaded, "boardConfig", (raw) => {
        setBoardConfigExists(!!raw);
        setBoardConfig(normalizeBoardConfig(raw));
      })
    );
  }, [stableId]);

  // Admins read these horse subcollections through a single stable-wide collectionGroup
  // listener. Non-admins can't: a restricted horse's allowedUids makes the collectionGroup
  // rule's read check depend on resource.data.hid, a field the query doesn't filter on —
  // Firestore rejects a list request outright (not per-document) if its rule can't be proven
  // true for every possible result using only the query's own where() clauses (see
  // firestore.rules' comment on the expenses collectionGroup block). So non-admins get one
  // listener per horse they're actually allowed to see instead, merged into the same state —
  // bounded by how many horses that member can see, not by the stable's total horse count.
  // La lista de ids se mantiene como ARRAY memoizado; antes se serializaba con .join(",")
  // para usarla como dependencia y luego se reconstruía con .split(","), de modo que un id
  // vacío (o la cadena vacía) producía un fragmento "" que al pasarlo a stableCollection
  // daba un segmento de ruta vacío — una excepción de Firestore que tumbaba el provider
  // entero. Ahora los ids vacíos se filtran y la serialización solo se usa como clave de
  // dependencia.
  const visibleHorseIds = useMemo(() => {
    if (isAdmin) return [];
    return horses
      .filter((h) => !isHorseRestricted(h) || (myUid && h.allowedUids.includes(myUid)))
      .map((h) => h.id)
      .filter((id) => typeof id === "string" && id.length > 0)
      .sort();
  }, [horses, isAdmin, myUid]);

  const visibleHorseIdsKey = useMemo(() => JSON.stringify(visibleHorseIds), [visibleHorseIds]);

  // Dependencia que permite a las suscripciones por caballo volver a decidir cuando `horses`
  // termina de cargar (una lista de ids vacía significa cosas distintas antes y después de
  // ese momento). Para un administrador vale true desde el principio y por tanto nunca
  // cambia, así que su listener único de grupo no se vuelve a montar por esto.
  const horsesSettled = isAdmin || loaded.horses;

  // Monta la suscripción a una subcolección de caballo con el reparto por rol descrito
  // arriba y devuelve la función de baja. `expenses` ya lo hacía así; trainings, health y
  // healthDocs usaban un único collectionGroup para TODOS los usuarios, y con las reglas
  // nuevas (isHorseRelated depende de resource.data.hid) eso es un rechazo garantizado del
  // `list` completo para cualquiera que no sea administrador: el historial veterinario, los
  // entrenos y los documentos sanitarios se quedaban vacíos para los mozos. Ahora las cuatro
  // comparten este mismo camino.
  const subscribeHorseSubcollection = useCallback(
    (collectionId, loadedKey, setRows) => {
      if (isAdmin) {
        return subscribeToCollectionGroup(
          collectionId,
          stableId,
          ...trackedHandlers(setLoaded, loadedKey, setRows)
        );
      }
      if (!visibleHorseIds.length) {
        setRows([]);
        // Sin caballos visibles no hay ningún listener que pueda marcar la bandera, así que
        // se decide aquí, y la decisión depende de si `horses` ya ha llegado:
        //   * `horses` cargado y aun así ningún caballo visible → este miembro realmente no
        //     ve ninguno: la bandera se resuelve a true para no dejarlo en un spinner eterno.
        //   * `horses` todavía en vuelo → la lista vacía es PROVISIONAL, así que la bandera
        //     se queda (o vuelve a) false.
        setLoadedFlag(setLoaded, loadedKey, horsesSettled);
        return () => {};
      }
      // Los listeners por caballo se montan de nuevo, así que la bandera vuelve a false
      // hasta que TODOS hayan dado señales. Antes solo sabía pasar a true: la que se marcaba
      // en la pasada previa sin caballos visibles se quedaba pegada, y quedaba un render con
      // la bandera en true y las filas todavía vacías — un "no encontrado" espurio al entrar
      // por enlace directo a la ficha de un registro.
      setLoadedFlag(setLoaded, loadedKey, false);
      const perHorse = {};
      // Con un listener POR CABALLO la colección solo se considera cargada cuando todos han
      // dado señales (datos o error): marcarla con el primero dejaría la bandera en true con
      // la lista todavía a medias.
      const reported = new Set();
      const markReported = (hid) => {
        reported.add(hid);
        if (reported.size < visibleHorseIds.length) return;
        setLoadedFlag(setLoaded, loadedKey, true);
      };
      const unsubs = visibleHorseIds.map((hid) =>
        subscribeToCollection(
          stableCollection(stableId, "horses", hid, collectionId),
          (docs) => {
            perHorse[hid] = docs;
            setRows(Object.values(perHorse).flat());
            markReported(hid);
          },
          () => markReported(hid)
        )
      );
      return () => unsubs.forEach((u) => u());
    },
    [stableId, isAdmin, visibleHorseIds, horsesSettled]
  );

  // `subscribeHorseSubcollection` no va en las dependencias a propósito: depende de
  // `visibleHorseIds`, que cambia de identidad con cada snapshot de `horses` aunque su
  // contenido sea el mismo, y volver a suscribirse por eso sería un desperdicio.
  // visibleHorseIdsKey cambia exactamente cuando cambia el contenido.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!stableId) {
      setExpenses([]);
      return;
    }
    return subscribeHorseSubcollection("expenses", "expenses", setExpenses);
  }, [stableId, isAdmin, visibleHorseIdsKey, horsesSettled]);

  useEffect(() => {
    if (!stableId) {
      setTrainings([]);
      return;
    }
    return subscribeHorseSubcollection("trainings", "trainings", setTrainings);
  }, [stableId, isAdmin, visibleHorseIdsKey, horsesSettled]);

  useEffect(() => {
    if (!stableId) {
      setHealth([]);
      return;
    }
    return subscribeHorseSubcollection("health", "health", setHealth);
  }, [stableId, isAdmin, visibleHorseIdsKey, horsesSettled]);

  useEffect(() => {
    if (!stableId) {
      setHealthDocs([]);
      return;
    }
    return subscribeHorseSubcollection("healthDocs", "healthDocs", setHealthDocs);
  }, [stableId, isAdmin, visibleHorseIdsKey, horsesSettled]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Ports the horse CRUD portion of the save-horse-btn handler in attach()
  // (public/legacy-app.js:3622-3646) and delHorse (public/legacy-app.js:1644-1653).
  // Todos los mutadores DEVUELVEN su promesa: antes se lanzaban sin await ni catch, así que
  // la página mostraba su aviso de "guardado" aunque la escritura hubiera fallado, y el
  // rechazo quedaba como unhandled promise rejection. Devolverla permite al llamante
  // esperarla y tratar el error; a propósito no se añade ningún .catch() aquí, que
  // volvería a esconder el fallo.
  const addHorse = useCallback(
    (horse) => writeDoc(stableDoc(stableId, "horses", horse.id), horse),
    [stableId]
  );

  const updateHorse = useCallback(
    (horse) => writeDoc(stableDoc(stableId, "horses", horse.id), horse),
    [stableId]
  );

  // trainings/health/healthDocs/expenses are subcollections of the horse doc itself, so
  // deleting it just deletes them too; tasks is a stable-level collection, so its cascade
  // needs its own query.
  const deleteHorse = useCallback(
    async (id) => {
      await Promise.all([
        batchDeleteQuery(stableCollection(stableId, "horses", id, "trainings")),
        batchDeleteQuery(stableCollection(stableId, "horses", id, "health")),
        batchDeleteQuery(stableCollection(stableId, "horses", id, "expenses")),
        batchDeleteQuery(stableCollection(stableId, "horses", id, "healthDocs")),
        batchDeleteQuery(query(stableCollection(stableId, "tasks"), where("horseId", "==", id))),
      ]);
      await deleteDocRef(stableDoc(stableId, "horses", id));
    },
    [stableId]
  );

  // Sets each horse's sortOrder to its index in orderedIds — the shared order used by both
  // the horse list and the weekly board's rows (see sortHorsesByOrder in
  // features/horses/horseOrder.js). Horses missing from orderedIds keep their existing
  // sortOrder (defensive — shouldn't happen, the caller always passes every horse id).
  const reorderHorses = useCallback(
    (orderedIds) => {
      // batch.set(..., {merge:true}) en vez de batch.update: un update sobre un caballo que
      // otro usuario acabara de borrar aborta el batch COMPLETO, con lo que no se reordenaba
      // ninguno. Y commitInChunks en lugar de un writeBatch único, por el límite de 500.
      const ops = horses
        .filter((h) => {
          const idx = orderedIds.indexOf(h.id);
          return idx !== -1 && idx !== h.sortOrder;
        })
        .map((h) => (batch) =>
          batch.set(stableDoc(stableId, "horses", h.id), { sortOrder: orderedIds.indexOf(h.id) }, { merge: true })
        );
      return commitInChunks(ops);
    },
    [horses, stableId]
  );

  // Ports the training portion of save-training-btn (public/legacy-app.js:3648-3651) and
  // the training-delete inline handler in the "entrenos" tab (public/legacy-app.js:1707).
  // No update mutator — legacy has no training-edit UI.
  const addTraining = useCallback(
    (training) =>
      writeDoc(stableDoc(stableId, "horses", training.hid, "trainings", training.id), {
        ...training,
        stableId,
      }),
    [stableId]
  );

  const deleteTraining = useCallback(
    (id) => {
      const t = trainings.find((x) => x.id === id);
      if (!t) return Promise.resolve();
      return deleteDocRef(stableDoc(stableId, "horses", t.hid, "trainings", id));
    },
    [trainings, stableId]
  );

  // Ports the health portion of save-health-btn (public/legacy-app.js:3644-3665): adding or
  // editing a health record with amount > 0 auto-creates/updates a linked expense entry —
  // batched so both docs commit together.
  const addHealthRecord = useCallback(
    (record) => {
      const batch = writeBatch(db);
      batch.set(
        stableDoc(stableId, "horses", record.hid, "health", record.id),
        cleanForFirestore({ ...record, stableId })
      );
      if (Number(record.amount) > 0) {
        const expenseId = uid();
        batch.set(
          stableDoc(stableId, "horses", record.hid, "expenses", expenseId),
          cleanForFirestore({
            id: expenseId,
            stableId,
            hid: record.hid,
            concept: record.label || record.type,
            amount: record.amount,
            date: record.date,
            cat: catFromHealthType(record.type),
            payer: "Cuadra",
            payee: record.payee,
            status: record.payStatus,
            notes: "",
            healthId: record.id,
          })
        );
      }
      return commitBatch(batch);
    },
    [stableId]
  );

  const updateHealthRecord = useCallback(
    (record) => {
      const batch = writeBatch(db);
      batch.set(
        stableDoc(stableId, "horses", record.hid, "health", record.id),
        cleanForFirestore({ ...record, stableId })
      );
      const linked = expenses.find((e) => e.healthId === record.id);
      const amount = Number(record.amount) || 0;
      if (linked && amount > 0) {
        // set con merge en vez de update: si el gasto vinculado ya había sido borrado, el
        // update lo hacía fallar y el batch entero se abortaba, de modo que se perdía
        // TAMBIÉN la edición del registro sanitario.
        batch.set(
          stableDoc(stableId, "horses", record.hid, "expenses", linked.id),
          cleanForFirestore({
            amount: record.amount,
            status: record.payStatus,
            payee: record.payee,
            concept: record.label || record.type,
          }),
          { merge: true }
        );
      } else if (linked && amount === 0) {
        // Faltaba este caso: al poner el importe a 0 (o vaciarlo) el gasto que se había
        // creado automáticamente se quedaba ahí para siempre, descuadrando las cuentas.
        batch.delete(stableDoc(stableId, "horses", record.hid, "expenses", linked.id));
      } else if (!linked && amount > 0) {
        const expenseId = uid();
        batch.set(
          stableDoc(stableId, "horses", record.hid, "expenses", expenseId),
          cleanForFirestore({
            id: expenseId,
            stableId,
            hid: record.hid,
            concept: record.label || record.type,
            amount: record.amount,
            date: record.date,
            cat: catFromHealthType(record.type),
            payer: "Cuadra",
            payee: record.payee,
            status: record.payStatus,
            notes: "",
            healthId: record.id,
          })
        );
      }
      return commitBatch(batch);
    },
    [expenses, stableId]
  );

  const deleteHealthRecord = useCallback(
    (id) => {
      const record = health.find((r) => r.id === id);
      if (!record) return Promise.resolve();
      // Borraba solo el registro sanitario y dejaba huérfano el gasto que él mismo había
      // creado: el importe seguía contando en los gastos del caballo sin nada que lo
      // explicara. Ambos se borran ahora juntos, en un único batch.
      const batch = writeBatch(db);
      batch.delete(stableDoc(stableId, "horses", record.hid, "health", id));
      expenses
        .filter((e) => e.healthId === id)
        .forEach((e) => batch.delete(stableDoc(stableId, "horses", e.hid, "expenses", e.id)));
      return commitBatch(batch);
    },
    [health, expenses, stableId]
  );

  // Ports addHealthDocLink (public/legacy-app.js:1116-1130).
  const addHealthDocLink = useCallback(
    ({ hid, category, date, notes, title, url, userId }) => {
      const horse = horses.find((x) => x.id === hid);
      const id = uid();
      const doc = {
        id,
        stableId,
        hid,
        horseName: horse ? horse.name : "",
        category: category || "otro",
        date: date || td(),
        notes: notes || "",
        title: title || "Documento enlazado",
        name: title || "Documento enlazado",
        url,
        source: "link",
        createdBy: userId || null,
        createdAt: new Date().toISOString(),
      };
      return writeDoc(stableDoc(stableId, "horses", hid, "healthDocs", id), doc);
    },
    [horses, stableId]
  );

  // Ports uploadHealthDocs (public/legacy-app.js:1132-1176): uploads every file to Firebase
  // Storage, then writes all resulting doc records in a single batch (matching legacy's
  // single loop + one save()), reporting progress via onProgress(label, pct).
  const uploadHealthDocs = useCallback(
    async ({ hid, files, category, date, notes, userId, onProgress }) => {
      const horse = horses.find((x) => x.id === hid);
      const added = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const id = uid();
        const path = `stables/${stableId}/horses/${hid}/health_docs/${Date.now()}_${id}_${safeStorageName(
          file.name
        )}`;
        const ref = storageRef(storage, path);
        const metadata = {
          contentType: file.type || "application/octet-stream",
          customMetadata: { stableId, horseId: hid, uploadedBy: userId || "", originalName: file.name },
        };
        const url = await uploadFileWithProgress(ref, file, metadata, (pct) =>
          onProgress && onProgress(`${i + 1}/${files.length}`, pct)
        );
        added.push({
          id,
          stableId,
          hid,
          horseName: horse ? horse.name : "",
          category: category || "otro",
          date: date || td(),
          notes: notes || "",
          name: file.name,
          title: file.name,
          type: file.type || "",
          size: file.size || 0,
          path,
          url,
          createdBy: userId || null,
          createdAt: new Date().toISOString(),
        });
      }
      await commitInChunks(
        added.map((doc) => (batch) =>
          batch.set(stableDoc(stableId, "horses", hid, "healthDocs", doc.id), cleanForFirestore(doc))
        )
      );
      return added;
    },
    [horses, stableId]
  );

  // Uploads a horse's photo to Storage, mirroring uploadHealthDocs's pattern. Returns
  // {path, url} for the caller to store on the horse record (via addHorse/updateHorse) —
  // this mutator doesn't touch the horse doc itself, since the form already writes the full
  // record on submit.
  const uploadHorsePhoto = useCallback(
    async (hid, file, onProgress) => {
      const path = `stables/${stableId}/horses/${hid}/photo/${Date.now()}_${safeStorageName(file.name)}`;
      const ref = storageRef(storage, path);
      const metadata = { contentType: file.type || "application/octet-stream" };
      const url = await uploadFileWithProgress(ref, file, metadata, onProgress);
      return { path, url };
    },
    [stableId]
  );

  // Uploads a team member's photo to Storage, same pattern as uploadHorsePhoto.
  const uploadTeamMemberPhoto = useCallback(
    async (mid, file, onProgress) => {
      const path = `stables/${stableId}/team/${mid}/photo/${Date.now()}_${safeStorageName(file.name)}`;
      const ref = storageRef(storage, path);
      const metadata = { contentType: file.type || "application/octet-stream" };
      const url = await uploadFileWithProgress(ref, file, metadata, onProgress);
      return { path, url };
    },
    [stableId]
  );

  // Ports deleteHealthDoc (public/legacy-app.js:1177-1188).
  const deleteHealthDoc = useCallback(
    async (id) => {
      const doc = healthDocs.find((x) => x.id === id);
      if (!doc) return;
      if (doc.path) {
        try {
          await deleteObject(storageRef(storage, doc.path));
        } catch (_e) {
          // non-fatal, mirrors legacy behavior
        }
      }
      await deleteDocRef(stableDoc(stableId, "horses", doc.hid, "healthDocs", id));
    },
    [healthDocs, stableId]
  );

  // Ports the expense-save handler (public/legacy-app.js:3713-3730) and deleteExpense
  // (public/legacy-app.js:2132-2143 — deliberately doesn't touch a linked health record,
  // matching the legacy comment there).
  const addExpense = useCallback(
    (expense) =>
      writeDoc(stableDoc(stableId, "horses", expense.hid, "expenses", expense.id), {
        ...expense,
        stableId,
      }),
    [stableId]
  );

  const updateExpense = useCallback(
    (expense) =>
      writeDoc(stableDoc(stableId, "horses", expense.hid, "expenses", expense.id), {
        ...expense,
        stableId,
      }),
    [stableId]
  );

  const deleteExpense = useCallback(
    (id) => {
      const expense = expenses.find((e) => e.id === id);
      if (!expense) return Promise.resolve();
      return deleteDocRef(stableDoc(stableId, "horses", expense.hid, "expenses", id));
    },
    [expenses, stableId]
  );

  // Ports confirmExpenseSettlement (public/legacy-app.js:969-976): records the settlement
  // and marks every settled expense.
  const addExpenseSettlement = useCallback(
    (settlement) => {
      // Una liquidación marca un gasto por cada uno de los seleccionados, así que el total
      // crece con los datos y podía pasar de 500 operaciones — y entonces Firestore
      // rechazaba el commit COMPLETO, sin liquidar nada. Va por tandas.
      const ops = [
        (batch) =>
          batch.set(
            stableDoc(stableId, "expenseSettlements", settlement.id),
            cleanForFirestore({ ...settlement, stableId })
          ),
        ...expenses
          .filter((e) => settlement.expenseIds.includes(e.id))
          .map((e) => (batch) =>
            batch.update(
              stableDoc(stableId, "horses", e.hid, "expenses", e.id),
              cleanForFirestore({
                settled: true,
                settlementId: settlement.id,
                settledDate: settlement.date,
              })
            )
          ),
      ];
      return commitInChunks(ops);
    },
    [expenses, stableId]
  );

  // Ports saleUpdate/saleOwnerUpdate/saleAddOwner/saleRemoveOwner
  // (public/legacy-app.js:3584-3614) as one generic mutator: the venta tab has no separate
  // save button in legacy either — every field writes straight through, debounced same as
  // everything else.
  const updateHorseSale = useCallback(
    (hid, updater) => {
      const h = horses.find((x) => x.id === hid);
      const currentSale = (h && h.sale) || { precio: 0, owners: [{ nombre: "", pct: 100 }] };
      const nextSale = typeof updater === "function" ? updater(currentSale) : { ...currentSale, ...updater };
      return patchDoc(stableDoc(stableId, "horses", hid), { sale: nextSale });
    },
    [horses, stableId]
  );

  // Ports the task-save handler (public/legacy-app.js:3669-3676) and its inline delete
  // handler (public/legacy-app.js:3274, which also clears any salerts tied to the task).
  const addTask = useCallback(
    (task) => writeDoc(stableDoc(stableId, "tasks", task.id), { ...task, stableId }),
    [stableId]
  );

  const updateTask = useCallback(
    (task) => writeDoc(stableDoc(stableId, "tasks", task.id), { ...task, stableId }),
    [stableId]
  );

  // Los tres borrados se lanzaban EN PARALELO. Firestore no borra subcolecciones en cascada,
  // así que si el doc de la tarea desaparecía primero y el borrado de su subcolección
  // `occurrences` fallaba después, esos documentos quedaban huérfanos para siempre: ya no
  // hay nada que los enumere ni ruta por la que la interfaz llegue a ellos. Ahora se espera
  // a cada paso en orden: primero las excepciones por fecha, el doc de la tarea al final.
  const deleteTask = useCallback(
    async (id) => {
      await commitInChunks(
        sessionAlerts
          .filter((s) => s.tid === id)
          .map((s) => (batch) => batch.delete(stableDoc(stableId, "sessionAlerts", s.id)))
      );
      await batchDeleteQuery(stableCollection(stableId, "tasks", id, "occurrences"));
      return deleteDocRef(stableDoc(stableId, "tasks", id));
    },
    [sessionAlerts, stableId]
  );

  // Ports cycleTask (public/legacy-app.js:3226-3242): cycling a task to "done" auto-creates
  // a pending session-report alert for activities that require one (AK[].r) and that are
  // linked to a horse — a general chore has no horse to attach a training report to; cycling
  // away from "done" removes any unanswered alert it created.
  const cycleTaskStatus = useCallback(
    async (id) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      let nextStatus;
      if (taskNeedsReturn(task.activity)) {
        nextStatus = { pending: "inprogress", inprogress: "done", done: "pending" }[task.status] || "pending";
      } else {
        nextStatus = task.status === "done" ? "pending" : "done";
      }
      await writeDoc(stableDoc(stableId, "tasks", id), { ...task, status: nextStatus, stableId });
      if (nextStatus === "done") {
        const activity = activityById(task.activity);
        if (activity.r && task.horseId != null && !sessionAlerts.some((s) => s.tid === id && !s.ans)) {
          const horse = horses.find((h) => h.id === task.horseId);
          const alertId = uid();
          return writeDoc(stableDoc(stableId, "sessionAlerts", alertId), {
            id: alertId,
            stableId,
            tid: id,
            hid: task.horseId,
            hn: horse ? horse.name : "",
            act: task.activity,
            date: task.startDate,
            pid: task.assignedTo,
            ans: false,
          });
        }
      } else {
        return commitInChunks(
          sessionAlerts
            .filter((s) => s.tid === id && !s.ans)
            .map((s) => (batch) => batch.delete(stableDoc(stableId, "sessionAlerts", s.id)))
        );
      }
    },
    [tasks, horses, sessionAlerts, stableId]
  );

  // Reassigns one date's occurrence of a recurring task, without touching that date's status
  // exception (if any) — writeDocMerged, not writeDoc, since occurrence docs are sparse and
  // this mutator and cycleOccurrenceStatus below are two independent writers of the same doc.
  const setOccurrenceAssignee = useCallback(
    (occurrenceTask, memberId) => {
      const { id, occurrenceDate: date } = occurrenceTask;
      return writeDocMerged(stableDoc(stableId, "tasks", id, "occurrences", date), {
        taskId: id,
        stableId,
        date,
        overrideAssignedTo: memberId,
      });
    },
    [stableId]
  );

  // Cycles one date's occurrence of a recurring task, mirroring cycleTaskStatus but writing
  // to that date's sparse exception doc (tasks/{id}/occurrences/{date}) instead of the task's
  // own status field, since a recurring task's status is per-occurrence, not per-task.
  // `occurrenceTask` is the resolved view-model useTaskOccurrences already produced for this
  // date (correct `status`, plus the task's own `activity`/`horseId`/`assignedTo`) — this
  // mutator doesn't need its own occurrence subscription to compute the next status from it.
  const cycleOccurrenceStatus = useCallback(
    async (occurrenceTask) => {
      const { id, occurrenceDate: date } = occurrenceTask;
      let nextStatus;
      if (taskNeedsReturn(occurrenceTask.activity)) {
        nextStatus = { pending: "inprogress", inprogress: "done", done: "pending" }[occurrenceTask.status] || "pending";
      } else {
        nextStatus = occurrenceTask.status === "done" ? "pending" : "done";
      }
      await writeDocMerged(stableDoc(stableId, "tasks", id, "occurrences", date), { taskId: id, stableId, date, status: nextStatus });
      if (nextStatus === "done") {
        const activity = activityById(occurrenceTask.activity);
        if (
          activity.r &&
          occurrenceTask.horseId != null &&
          !sessionAlerts.some((s) => s.tid === id && s.date === date && !s.ans)
        ) {
          const horse = horses.find((h) => h.id === occurrenceTask.horseId);
          const alertId = uid();
          return writeDoc(stableDoc(stableId, "sessionAlerts", alertId), {
            id: alertId,
            stableId,
            tid: id,
            hid: occurrenceTask.horseId,
            hn: horse ? horse.name : "",
            act: occurrenceTask.activity,
            date,
            pid: occurrenceTask.assignedTo,
            ans: false,
          });
        }
      } else {
        return commitInChunks(
          sessionAlerts
            .filter((s) => s.tid === id && s.date === date && !s.ans)
            .map((s) => (batch) => batch.delete(stableDoc(stableId, "sessionAlerts", s.id)))
        );
      }
    },
    [horses, sessionAlerts, stableId]
  );

  // Ports the save-session-btn handler (public/legacy-app.js:3706-3712): answering a
  // pending session-report alert creates a new training record and marks the alert
  // answered, in one atomic action (legacy treats it as one user action, not two).
  const answerSessionAlert = useCallback(
    (alertId, sessionData) => {
      const alert = sessionAlerts.find((s) => s.id === alertId);
      if (!alert) return Promise.resolve();
      const training = {
        id: uid(),
        hid: alert.hid,
        date: alert.date,
        dur: sessionData.dur,
        wtype: alert.act === "longe" ? "longe" : "doma",
        state: sessionData.state,
        feel: sessionData.feel,
        notes: sessionData.notes,
        rating: sessionData.rating,
      };
      // Las dos escrituras son una sola acción del usuario, así que van en un único batch
      // (antes eran dos writeDoc independientes: podía quedar el entreno creado sin marcar
      // el aviso como respondido, o al revés).
      const batch = writeBatch(db);
      batch.set(
        stableDoc(stableId, "horses", alert.hid, "trainings", training.id),
        cleanForFirestore({ ...training, stableId })
      );
      batch.set(stableDoc(stableId, "sessionAlerts", alertId), cleanForFirestore({ ...alert, ans: true }));
      return commitBatch(batch);
    },
    [sessionAlerts, stableId]
  );

  // Ports saveTpl/applyTpl (public/legacy-app.js:3503-3551).
  const addTemplate = useCallback(
    (template) => writeDoc(stableDoc(stableId, "taskTemplates", template.id), { ...template, stableId }),
    [stableId]
  );

  const updateTemplate = useCallback(
    (template) => writeDoc(stableDoc(stableId, "taskTemplates", template.id), { ...template, stableId }),
    [stableId]
  );

  const deleteTemplate = useCallback(
    (id) => deleteDocRef(stableDoc(stableId, "taskTemplates", id)),
    [stableId]
  );

  const applyTemplate = useCallback(
    (templateId, date) => {
      const tpl = taskTemplates.find((t) => t.id === templateId);
      if (!tpl) return Promise.resolve();
      // Una plantilla puede tener tantas tareas como se quiera: por tandas, para no superar
      // el límite de 500 operaciones y perder la aplicación entera.
      return commitInChunks(
        (tpl.tasks || []).map((t) => (batch) => {
          const id = uid();
          batch.set(
            stableDoc(stableId, "tasks", id),
            cleanForFirestore({
              id,
              stableId,
              horseId: t.horseId,
              activity: t.activity,
              assignedTo: t.assignedTo,
              dur: t.dur,
              startDate: date,
              status: "pending",
              notes: "",
              time: null,
              recurrenceRule: null,
            })
          );
        })
      );
    },
    [taskTemplates, stableId]
  );

  // Ports save-member-btn (public/legacy-app.js:3677-3685) and the inline delete handler
  // in rMF (public/legacy-app.js:3416), which also nulls out `pid` on any task assigned to
  // the deleted member rather than leaving it dangling.
  const addTeamMember = useCallback(
    (member) => writeDoc(stableDoc(stableId, "team", member.id), member),
    [stableId]
  );

  const updateTeamMember = useCallback(
    (member) => writeDoc(stableDoc(stableId, "team", member.id), member),
    [stableId]
  );

  const deleteTeamMember = useCallback(
    async (id) => {
      // set con merge (no update) y por tandas: un update sobre una tarea ya borrada por
      // otro usuario abortaba el batch COMPLETO y entonces ni se desasignaban las tareas ni
      // se borraba el integrante.
      await commitInChunks(
        tasks
          .filter((t) => t.assignedTo === id)
          .map((t) => (batch) =>
            batch.set(stableDoc(stableId, "tasks", t.id), { assignedTo: null }, { merge: true })
          )
      );
      return deleteDocRef(stableDoc(stableId, "team", id));
    },
    [tasks, stableId]
  );

  // Ports toggleAbsence (public/legacy-app.js:3314-3321): toggles a single day on/off as a
  // rest/absence day for a team member.
  const toggleAbsence = useCallback(
    (pid, date) => {
      const existing = absences.find((a) => a.pid === pid && a.date === date);
      if (existing) {
        return deleteDocRef(stableDoc(stableId, "absences", existing.id));
      }
      const id = uid();
      return writeDoc(stableDoc(stableId, "absences", id), { id, stableId, pid, date, type: "descanso", note: "" });
    },
    [absences, stableId]
  );

  // Ports save-ce-btn (public/legacy-app.js:3697-3704) — stable-wide expenses.
  const addStableExpense = useCallback(
    (expense) => writeDoc(stableDoc(stableId, "stableExpenses", expense.id), { ...expense, stableId }),
    [stableId]
  );

  const updateStableExpense = useCallback(
    (expense) => writeDoc(stableDoc(stableId, "stableExpenses", expense.id), { ...expense, stableId }),
    [stableId]
  );

  const deleteStableExpense = useCallback(
    (id) => deleteDocRef(stableDoc(stableId, "stableExpenses", id)),
    [stableId]
  );

  // Ports saveBoardCell (public/legacy-app.js:1323-1328): full-array replace of a horse's
  // planned activities for one day, deleting the record when it becomes empty. Always
  // assigns an id (legacy's version only does for records created via the quick-toggle
  // path, boardQuickCell — harmless normalization since lookup is always by hid+date).
  const setWeeklyPlanActivities = useCallback(
    (hid, date, activities) => {
      const id = weeklyPlanCellId(hid, date);
      const existing = weeklyPlans.find((p) => p.hid === hid && p.date === date);
      // A cell is only deleted when it's fully empty — activities plus the note/vet-link
      // fields added after this mutator was first written — so clearing the activity order
      // doesn't silently drop a cell's note or vet link.
      const hasOtherContent = !!(existing && (existing.note || existing.vetHealthId));
      if (activities.length || hasOtherContent) {
        return writeDoc(stableDoc(stableId, "weeklyPlans", id), {
          id,
          stableId,
          hid,
          date,
          activities,
          note: existing?.note || "",
          completed: (existing?.completed || []).filter((c) => activities.includes(c)),
          vetHealthId: existing?.vetHealthId || null,
        });
      }
      if (existing) {
        return deleteDocRef(stableDoc(stableId, "weeklyPlans", id));
      }
      return Promise.resolve();
    },
    [weeklyPlans, stableId]
  );

  // Ports the quick-assign toggle inside boardQuickCell (public/legacy-app.js:1387-1396).
  const toggleWeeklyPlanActivity = useCallback(
    (hid, date, activityId) => {
      const id = weeklyPlanCellId(hid, date);
      const existing = weeklyPlans.find((p) => p.hid === hid && p.date === date);
      if (!existing) {
        return writeDoc(stableDoc(stableId, "weeklyPlans", id), {
          id,
          stableId,
          hid,
          date,
          activities: [activityId],
          completed: [],
          note: "",
          vetHealthId: null,
        });
      }
      const activities = Array.isArray(existing.activities) ? existing.activities : [];
      const removing = activities.includes(activityId);
      const nextActivities = removing ? activities.filter((a) => a !== activityId) : [...activities, activityId];
      // Removing an activity also drops its completed-state, matching setWeeklyPlanActivities.
      const nextCompleted = removing
        ? (existing.completed || []).filter((c) => c !== activityId)
        : existing.completed || [];
      return writeDoc(stableDoc(stableId, "weeklyPlans", id), {
        ...existing,
        stableId,
        activities: nextActivities,
        completed: nextCompleted,
      });
    },
    [weeklyPlans, stableId]
  );

  // Sets or clears a weekly-plan cell's free-text note. Deletes the cell entirely if it
  // becomes fully empty (no activities, no note, no vet link), matching
  // setWeeklyPlanActivities's existing "empty cell is removed" convention.
  const setWeeklyPlanNote = useCallback(
    (hid, date, note) => {
      const id = weeklyPlanCellId(hid, date);
      const existing = weeklyPlans.find((p) => p.hid === hid && p.date === date);
      const trimmed = (note || "").trim().slice(0, 240);
      if (!existing) {
        if (!trimmed) return Promise.resolve();
        return writeDoc(stableDoc(stableId, "weeklyPlans", id), {
          id,
          stableId,
          hid,
          date,
          activities: [],
          completed: [],
          note: trimmed,
          vetHealthId: null,
        });
      }
      const hasOtherContent = !!((existing.activities || []).length || existing.vetHealthId);
      if (!trimmed && !hasOtherContent) {
        return deleteDocRef(stableDoc(stableId, "weeklyPlans", id));
      }
      return writeDoc(stableDoc(stableId, "weeklyPlans", id), { ...existing, stableId, note: trimmed });
    },
    [weeklyPlans, stableId]
  );

  // Toggles one activity id in/out of a weekly-plan cell's completed set. No-ops if the id
  // isn't currently assigned to that cell (the UI only ever offers currently-assigned
  // activities, so this is a defensive guard, not an expected path).
  const toggleWeeklyPlanCompleted = useCallback(
    (hid, date, activityId) => {
      const existing = weeklyPlans.find((p) => p.hid === hid && p.date === date);
      if (!existing) return Promise.resolve();
      if (!(existing.activities || []).includes(activityId)) return Promise.resolve();
      const completed = existing.completed || [];
      const nextCompleted = completed.includes(activityId)
        ? completed.filter((c) => c !== activityId)
        : [...completed, activityId];
      return writeDoc(stableDoc(stableId, "weeklyPlans", weeklyPlanCellId(hid, date)), {
        ...existing,
        stableId,
        completed: nextCompleted,
      });
    },
    [weeklyPlans, stableId]
  );

  // For every weekly-plan cell in the 7 days before weekStart that had content, writes that
  // same activities+note into the corresponding day this week (date shifted +7). Only
  // writes cells that had source content — never touches a cell whose corresponding source
  // day was empty, even if that cell already has different content today.
  const repeatPreviousWeek = useCallback(
    (weekStart) => {
      const prevWeekStart = addD(weekStart, -7);
      const prevWeekDates = new Set(Array.from({ length: 7 }, (_, i) => addD(prevWeekStart, i)));
      const sourceRows = weeklyPlans.filter(
        (p) => prevWeekDates.has(p.date) && ((p.activities || []).length || p.note)
      );
      if (!sourceRows.length) return Promise.resolve();
      // Caballos × 7 días: con 72 caballos ya se pasa de las 500 operaciones y Firestore
      // rechazaba el commit COMPLETO, así que no se copiaba nada. Va por tandas.
      return commitInChunks(
        sourceRows.map((source) => (batch) => {
          const targetDate = addD(source.date, 7);
          const id = weeklyPlanCellId(source.hid, targetDate);
          batch.set(
            stableDoc(stableId, "weeklyPlans", id),
            cleanForFirestore({
              id,
              stableId,
              hid: source.hid,
              date: targetDate,
              activities: [...(source.activities || [])],
              completed: [],
              note: source.note || "",
              vetHealthId: null,
            })
          );
        })
      );
    },
    [weeklyPlans, stableId]
  );

  // Fully wipes one weekly-plan cell (activities, completed, note, vet link). Does NOT
  // delete the linked Health record if one exists — clearing a board cell shouldn't erase
  // real health history, only the board's reference to it.
  const eraseWeeklyPlanCell = useCallback(
    (hid, date) => deleteDocRef(stableDoc(stableId, "weeklyPlans", weeklyPlanCellId(hid, date))),
    [stableId]
  );

  // Links a weekly-plan cell to the Health record its VET detail was saved into. The
  // caller (the board's VET detail sheet) calls addHealthRecord/updateHealthRecord itself,
  // then this, rather than this mutator duplicating that logic. Assumes the cell already
  // exists (the VET activity must already be assigned before its detail sheet can open) —
  // a no-op if not.
  const setWeeklyPlanVetLink = useCallback(
    (hid, date, healthId) => {
      const existing = weeklyPlans.find((p) => p.hid === hid && p.date === date);
      if (!existing) return Promise.resolve();
      return writeDoc(stableDoc(stableId, "weeklyPlans", weeklyPlanCellId(hid, date)), {
        ...existing,
        stableId,
        vetHealthId: healthId,
      });
    },
    [weeklyPlans, stableId]
  );

  // Ports setBoardPeriodic (public/legacy-app.js:1311-1317). Lookup is always by
  // (hid, columnId), so it uses a deterministic id, same precedent as weekly-plan cells.
  const setBoardPeriodic = useCallback(
    (hid, columnId, date) => {
      const id = `${hid}__${columnId}`;
      if (date) {
        return writeDoc(stableDoc(stableId, "periodicBoardDates", id), { id, stableId, hid, columnId, date });
      }
      return deleteDocRef(stableDoc(stableId, "periodicBoardDates", id));
    },
    [stableId]
  );

  // Ports assignBoardHorse (public/legacy-app.js:1416-1423). Validation/occupied/conflict
  // outcomes are returned as a status for the caller to toast/confirm on, rather than
  // calling toast()/confirm() here directly (same split used throughout this context).
  // Pass { force: true } to place anyway after the caller confirms a reported conflict.
  const assignBoardHorse = useCallback(
    (hid, type, date, resourceId, slotId, position, { force } = {}) => {
      if (!hid) throw new Error("Selecciona un caballo");
      const occupied = boardAssignment(boardAssignments, type, date, resourceId, slotId, position);
      if (occupied) return { status: "occupied" };
      const conflict = horseConflict(boardConfig, boardAssignments, hid, date, type, slotId);
      if (conflict && !force) return { status: "conflict" };
      const id = uid();
      // `status` se sigue devolviendo de forma SÍNCRONA (el llamante decide con él si pedir
      // confirmación), y la promesa de la escritura se expone aparte en `write` para que
      // pueda esperarse y tratarse su error.
      const write = writeDoc(stableDoc(stableId, "boardAssignments", id), {
        id,
        stableId,
        type,
        date,
        resourceId,
        slotId,
        position: Number(position),
        hid,
      });
      return { status: "ok", write };
    },
    [boardAssignments, boardConfig, stableId]
  );

  // Ports moveBoardAssignment (public/legacy-app.js:1416-1423). Fix: also runs the same
  // horseConflict check assignBoardHorse does — legacy's version skips it, so dragging an
  // already-placed horse into a time-overlapping slot bypassed the warning a fresh
  // placement of the same horse into the same slot would show. The moved assignment itself
  // is excluded from the conflict check so its own pre-move slot isn't compared against
  // itself.
  const moveBoardAssignment = useCallback(
    (id, type, date, resourceId, slotId, position, { force } = {}) => {
      const a = boardAssignments.find((x) => x.id === id);
      if (!a) return { status: "not-found" };
      const occupied = boardAssignment(boardAssignments, type, date, resourceId, slotId, position);
      if (occupied && occupied.id !== id) return { status: "occupied" };
      const others = boardAssignments.filter((x) => x.id !== id);
      const conflict = horseConflict(boardConfig, others, a.hid, date, type, slotId);
      if (conflict && !force) return { status: "conflict" };
      const write = writeDoc(stableDoc(stableId, "boardAssignments", id), {
        ...a,
        stableId,
        type,
        date,
        resourceId,
        slotId,
        position: Number(position),
      });
      return { status: "ok", write };
    },
    [boardAssignments, boardConfig, stableId]
  );

  // Ports removeBoardAssignment (public/legacy-app.js:1416-1423).
  const removeBoardAssignment = useCallback(
    (id) => deleteDocRef(stableDoc(stableId, "boardAssignments", id)),
    [stableId]
  );

  // Los once mutadores de boardConfig hacían writeDoc(ref, {...boardConfig, campo:x}): un
  // REEMPLAZO COMPLETO del documento a partir del estado de cliente. Si un administrador
  // tocaba la pizarra antes de que llegara el primer snapshot, `boardConfig` todavía valía
  // boardDefaults() y esa escritura sustituía la configuración real de la cuadra (todos sus
  // caminadores, paddocks, franjas y actividades) por los valores por defecto. Ahora pasan
  // todos por aquí: si la configuración aún no se ha cargado la operación se rechaza con un
  // error en lugar de escribir, y si ya existe el documento se hace un updateDoc con
  // alcance de campo en vez de reemplazarlo entero.
  const writeBoardConfigField = useCallback(
    (patch) => {
      if (!loaded.boardConfig) throw new Error(BOARD_CONFIG_NOT_LOADED);
      const ref = stableDoc(stableId, "boardConfig", "main");
      if (boardConfigExists) return patchDoc(ref, patch);
      // La cuadra no tiene todavía documento de configuración (creada antes de que
      // boardConfig viviera en su propio doc): updateDoc fallaría, así que se crea una vez
      // con los valores normalizados más el campo nuevo.
      return writeDoc(ref, { ...boardConfig, ...patch });
    },
    [loaded.boardConfig, boardConfigExists, boardConfig, stableId]
  );

  // Ports addBoardActivity/deleteBoardActivity/addPeriodicColumn/deletePeriodicColumn
  // (public/legacy-app.js:1457-1460). Legacy has no edit for either of these, only add and
  // delete, so neither gets an update mutator. Deleting one has no cascade cleanup of
  // weeklyPlans/periodicBoardDates that reference it — matches legacy's intentional design,
  // confirmed by its own confirm-dialog text ("Las fechas guardadas dejarán de mostrarse").
  const addBoardActivity = useCallback(
    (code, label) =>
      writeBoardConfigField({
        activities: [...boardConfig.activities, { id: safeBoardId("act", label), code, label, tone: "blue" }],
      }),
    [boardConfig, writeBoardConfigField]
  );

  const deleteBoardActivity = useCallback(
    (id) =>
      writeBoardConfigField({
        activities: boardConfig.activities.filter((x) => x.id !== id),
      }),
    [boardConfig, writeBoardConfigField]
  );

  const addPeriodicColumn = useCallback(
    (label) =>
      writeBoardConfigField({
        periodicColumns: [...boardConfig.periodicColumns, { id: safeBoardId("periodic", label), label, tone: "blue" }],
      }),
    [boardConfig, writeBoardConfigField]
  );

  const deletePeriodicColumn = useCallback(
    (id) =>
      writeBoardConfigField({
        periodicColumns: boardConfig.periodicColumns.filter((x) => x.id !== id),
      }),
    [boardConfig, writeBoardConfigField]
  );

  // Ports addWalker/editWalker/deleteWalker (public/legacy-app.js:1462-1464). Fix: slots
  // are taken as given from the caller (the per-row array editor built in Phase 6e), which
  // preserves each existing row's id — unlike legacy's promptSlots, which re-parses a
  // retyped "HH:MM-HH:MM, ..." string and mints a fresh id for every row on every edit,
  // silently orphaning any boardAssignments that referenced the old ids.
  const addWalker = useCallback(
    (name, capacity, slots) =>
      writeBoardConfigField({
        walkers: [...boardConfig.walkers, { id: safeBoardId("walker", name), name, capacity, slots }],
      }),
    [boardConfig, writeBoardConfigField]
  );

  const updateWalker = useCallback(
    (id, { name, capacity, slots }) =>
      writeBoardConfigField({
        walkers: boardConfig.walkers.map((w) => (w.id === id ? { ...w, name, capacity, slots } : w)),
      }),
    [boardConfig, writeBoardConfigField]
  );

  const deleteWalker = useCallback(
    async (id) => {
      await writeBoardConfigField({ walkers: boardConfig.walkers.filter((x) => x.id !== id) });
      return batchDeleteQuery(
        query(stableCollection(stableId, "boardAssignments"), where("resourceId", "==", id))
      );
    },
    [boardConfig, stableId, writeBoardConfigField]
  );

  // Ports addPaddock/deletePaddock (public/legacy-app.js:1465-1466).
  const addPaddock = useCallback(
    (name) =>
      writeBoardConfigField({
        paddocks: [...boardConfig.paddocks, { id: safeBoardId("paddock", name), name, capacity: 1 }],
      }),
    [boardConfig, writeBoardConfigField]
  );

  const deletePaddock = useCallback(
    async (id) => {
      await writeBoardConfigField({ paddocks: boardConfig.paddocks.filter((x) => x.id !== id) });
      return batchDeleteQuery(
        query(stableCollection(stableId, "boardAssignments"), where("resourceId", "==", id))
      );
    },
    [boardConfig, stableId, writeBoardConfigField]
  );

  // Ports addPaddockSlot/deletePaddockSlot (public/legacy-app.js:1467-1468). Legacy's
  // addPaddockSlot parses a comma-separated list from promptSlots and can add several at
  // once; here the caller's form adds one slot at a time, so this takes a single
  // start/end pair instead of an array — the same prompt()-to-form adaptation used
  // throughout this migration. The shared list stays sorted by start time either way.
  const addPaddockSlot = useCallback(
    (start, end) => {
      const paddockSlots = [...boardConfig.paddockSlots, { id: uid(), start, end }].sort((a, b) =>
        a.start.localeCompare(b.start)
      );
      return writeBoardConfigField({ paddockSlots });
    },
    [boardConfig, writeBoardConfigField]
  );

  const deletePaddockSlot = useCallback(
    async (id) => {
      await writeBoardConfigField({ paddockSlots: boardConfig.paddockSlots.filter((x) => x.id !== id) });
      return batchDeleteQuery(
        query(stableCollection(stableId, "boardAssignments"), where("slotId", "==", id))
      );
    },
    [boardConfig, stableId, writeBoardConfigField]
  );

  // Ports the write side of confirmSmartOrder (public/legacy-app.js:3095-3109): builds one
  // tasks/health/expenses record per confirmed draft item and writes them all in a single
  // writeBatch (same batching precedent as applyTemplate). The caller is expected to
  // have already filtered `items` down to the ones the user checked and is allowed to
  // create — this mutator just builds records from whatever it's given, same split used
  // throughout this context. Unlike the regular health form, a health item here never
  // auto-creates a linked expense: legacy's own smartAnalyzeOrder already emits a separate
  // sibling 'expense' draft item when an amount was detected, so the two stay independent
  // records here too.
  // Devuelve una PROMESA con el número de registros creados (antes devolvía el número de
  // forma síncrona y la escritura quedaba suelta, así que se anunciaba "Creados N registros"
  // aunque el commit hubiera fallado). Va por tandas: un pedido puede traer más de 500
  // elementos y el rechazo tumbaría el commit completo.
  const confirmSmartOrderDraft = useCallback(
    async (items) => {
      let created = 0;
      const ops = [];
      (items || []).forEach((x) => {
        if (x.kind === "task") {
          const id = uid();
          ops.push((batch) =>
            batch.set(
              stableDoc(stableId, "tasks", id),
              cleanForFirestore({
                id,
                stableId,
                horseId: x.hid,
                activity: x.activity,
                startDate: x.date,
                time: null,
                dur: Number(x.dur) || 30,
                assignedTo: x.pid || null,
                notes: x.notes || "",
                status: "pending",
              })
            )
          );
          created++;
        } else if (x.kind === "health") {
          const id = uid();
          ops.push((batch) =>
            batch.set(
              stableDoc(stableId, "horses", x.hid, "health", id),
              cleanForFirestore({
                id,
                stableId,
                hid: x.hid,
                type: x.type || "otro",
                label: x.label || "Registro sanitario",
                date: x.date,
                nxt: null,
                notes: x.notes || "",
                amount: Number(x.amount) || 0,
                payStatus: x.payStatus || "pendiente",
                payee: x.payee || "",
              })
            )
          );
          created++;
        } else if (x.kind === "expense") {
          const id = uid();
          ops.push((batch) =>
            batch.set(
              stableDoc(stableId, "horses", x.hid, "expenses", id),
              cleanForFirestore({
                id,
                stableId,
                hid: x.hid,
                concept: x.concept || "Gasto",
                amount: Number(x.amount) || 0,
                date: x.date,
                cat: x.cat || "vet",
                payer: x.payer || "Cuadra",
                payee: x.payee || "",
                status: x.status || "pendiente",
                notes: x.notes || "",
              })
            )
          );
          created++;
        }
      });
      await commitInChunks(ops);
      return created;
    },
    [stableId]
  );

  // isLoaded("horses", "team") → true solo si TODAS las claves indicadas ya han recibido su
  // primer snapshot (o su error). Es lo que debe consultar cualquier formulario antes de
  // sembrar su estado inicial a partir de estos datos.
  const isLoaded = useCallback((...keys) => keys.every((k) => !!loaded[k]), [loaded]);

  const value = useMemo(
    () => ({
      stableId,
      loaded,
      isLoaded,
      horses,
      trainings,
      health,
      expenses,
      healthDocs,
      team,
      tasks,
      sessionAlerts,
      taskTemplates,
      stableExpenses,
      absences,
      expenseSettlements,
      weeklyPlans,
      periodicBoardDates,
      boardAssignments,
      boardConfig,
      addHorse,
      updateHorse,
      deleteHorse,
      reorderHorses,
      addTraining,
      deleteTraining,
      addHealthRecord,
      updateHealthRecord,
      deleteHealthRecord,
      addHealthDocLink,
      uploadHealthDocs,
      uploadHorsePhoto,
      uploadTeamMemberPhoto,
      deleteHealthDoc,
      addExpense,
      updateExpense,
      deleteExpense,
      addExpenseSettlement,
      updateHorseSale,
      addTask,
      updateTask,
      deleteTask,
      cycleTaskStatus,
      cycleOccurrenceStatus,
      setOccurrenceAssignee,
      answerSessionAlert,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      applyTemplate,
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,
      toggleAbsence,
      addStableExpense,
      updateStableExpense,
      deleteStableExpense,
      setWeeklyPlanActivities,
      toggleWeeklyPlanActivity,
      setWeeklyPlanNote,
      toggleWeeklyPlanCompleted,
      repeatPreviousWeek,
      eraseWeeklyPlanCell,
      setWeeklyPlanVetLink,
      setBoardPeriodic,
      assignBoardHorse,
      moveBoardAssignment,
      removeBoardAssignment,
      addBoardActivity,
      deleteBoardActivity,
      addPeriodicColumn,
      deletePeriodicColumn,
      addWalker,
      updateWalker,
      deleteWalker,
      addPaddock,
      deletePaddock,
      addPaddockSlot,
      deletePaddockSlot,
      confirmSmartOrderDraft,
    }),
    [
      stableId,
      loaded,
      isLoaded,
      horses,
      trainings,
      health,
      expenses,
      healthDocs,
      team,
      tasks,
      sessionAlerts,
      taskTemplates,
      stableExpenses,
      absences,
      expenseSettlements,
      weeklyPlans,
      periodicBoardDates,
      boardAssignments,
      boardConfig,
      addHorse,
      updateHorse,
      deleteHorse,
      reorderHorses,
      addTraining,
      deleteTraining,
      addHealthRecord,
      updateHealthRecord,
      deleteHealthRecord,
      addHealthDocLink,
      uploadHealthDocs,
      uploadHorsePhoto,
      uploadTeamMemberPhoto,
      deleteHealthDoc,
      addExpense,
      updateExpense,
      deleteExpense,
      addExpenseSettlement,
      updateHorseSale,
      addTask,
      updateTask,
      deleteTask,
      cycleTaskStatus,
      cycleOccurrenceStatus,
      setOccurrenceAssignee,
      answerSessionAlert,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      applyTemplate,
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,
      toggleAbsence,
      addStableExpense,
      updateStableExpense,
      deleteStableExpense,
      setWeeklyPlanActivities,
      toggleWeeklyPlanActivity,
      setWeeklyPlanNote,
      toggleWeeklyPlanCompleted,
      repeatPreviousWeek,
      eraseWeeklyPlanCell,
      setWeeklyPlanVetLink,
      setBoardPeriodic,
      assignBoardHorse,
      moveBoardAssignment,
      removeBoardAssignment,
      addBoardActivity,
      deleteBoardActivity,
      addPeriodicColumn,
      deletePeriodicColumn,
      addWalker,
      updateWalker,
      deleteWalker,
      addPaddock,
      deletePaddock,
      addPaddockSlot,
      deletePaddockSlot,
      confirmSmartOrderDraft,
    ]
  );

  return (
    <StableDataContext.Provider value={value}>
      {children}
    </StableDataContext.Provider>
  );
}
