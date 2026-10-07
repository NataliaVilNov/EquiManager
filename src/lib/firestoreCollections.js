import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebaseClient.js";
import { cleanForFirestore } from "./cleanForFirestore.js";
import { reportWriteError, reportReadError } from "./errorReporter.js";

// Límite duro de operaciones por writeBatch en Firestore.
export const BATCH_LIMIT = 500;

export function stableCollection(stableId, ...pathSegments) {
  return collection(db, "stables", stableId, ...pathSegments);
}

export function stableDoc(stableId, ...pathSegments) {
  return doc(db, "stables", stableId, ...pathSegments);
}

export async function writeDoc(ref, data) {
  try {
    await setDoc(ref, cleanForFirestore(data));
  } catch (err) {
    reportWriteError(err);
    throw err;
  }
}

// Like writeDoc, but merges onto the existing document instead of replacing it wholesale —
// for sparse docs with more than one independent writer (e.g. tasks/{id}/occurrences/{date},
// where status and overrideAssignedTo are set by two different mutators and neither should
// wipe out a field the other one set).
export async function writeDocMerged(ref, data) {
  try {
    await setDoc(ref, cleanForFirestore(data), { merge: true });
  } catch (err) {
    reportWriteError(err);
    throw err;
  }
}

export async function patchDoc(ref, partial) {
  try {
    await updateDoc(ref, cleanForFirestore(partial));
  } catch (err) {
    reportWriteError(err);
    throw err;
  }
}

export async function deleteDocRef(ref) {
  try {
    await deleteDoc(ref);
  } catch (err) {
    reportWriteError(err);
    throw err;
  }
}

// Every mutator that batches several writes together (a health record + its linked expense,
// a settlement + the expenses it settles, a template application, ...) commits through this
// instead of calling batch.commit() directly, so a failure reports the same way a single
// writeDoc/patchDoc/deleteDocRef failure does, in exactly one place.
export async function commitBatch(batch) {
  try {
    await batch.commit();
  } catch (err) {
    reportWriteError(err);
    throw err;
  }
}

// Reparte una lista de operaciones en tandas de BATCH_LIMIT y las confirma en orden. Cada
// operación es una función que recibe el batch y añade su escritura. Firestore rechaza un
// writeBatch con más de 500 operaciones y el rechazo tumba el commit COMPLETO, así que todo
// mutador cuyo número de escrituras dependa de los datos (repetir la semana anterior =
// caballos × 7 celdas, liquidar gastos, aplicar una plantilla, confirmar un pedido...) debe
// pasar por aquí en lugar de montar un writeBatch único. Generaliza el troceado que
// batchDeleteQuery ya hacía solo para borrados.
export async function commitInChunks(ops) {
  const list = (ops || []).filter(Boolean);
  if (!list.length) return;
  try {
    for (let i = 0; i < list.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      list.slice(i, i + BATCH_LIMIT).forEach((apply) => apply(batch));
      await batch.commit();
    }
  } catch (err) {
    reportWriteError(err);
    throw err;
  }
}

// onSnapshot's error callback is optional and easy to forget — without one, a listener that
// fails (e.g. a security-rules rejection on read) just stops silently, with nothing visibly
// wrong except data that never arrives. Every subscribe helper below reports through the same
// path as the write helpers. Los fallos aquí son de LECTURA, así que se avisan con
// reportReadError y no con el mensaje de "error guardando los cambios".
function reportedOnSnapshot(ref, onNext, onError) {
  return onSnapshot(ref, onNext, (err) => {
    reportReadError(err);
    if (onError) onError(err);
  });
}

export function subscribeToCollection(ref, onChange, onError) {
  return reportedOnSnapshot(
    ref,
    (snap) => {
      onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    onError
  );
}

export function subscribeToDoc(ref, onChange, onError) {
  return reportedOnSnapshot(
    ref,
    (snap) => {
      onChange(snap.exists() ? snap.data() : null);
    },
    onError
  );
}

// Firestore collectionGroup queries can't filter by ancestor path segments, so every doc in
// a group-queried subcollection carries an explicit stableId field to filter on instead.
export function subscribeToCollectionGroup(collectionId, stableId, onChange, onError) {
  const q = query(collectionGroup(db, collectionId), where("stableId", "==", stableId));
  return reportedOnSnapshot(
    q,
    (snap) => {
      onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    onError
  );
}

export async function batchDeleteQuery(queryRef) {
  let refs;
  try {
    const snap = await getDocs(queryRef);
    refs = snap.docs.map((d) => d.ref);
  } catch (err) {
    reportWriteError(err);
    throw err;
  }
  return commitInChunks(refs.map((r) => (batch) => batch.delete(r)));
}
