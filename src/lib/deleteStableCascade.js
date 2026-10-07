import { collection, collectionGroup, doc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "./firebaseClient.js";
import { batchDeleteQuery } from "./firestoreCollections.js";

const STABLE_SUBCOLLECTIONS = [
  "horses",
  "team",
  "tasks",
  "stableExpenses",
  "sessionAlerts",
  "taskTemplates",
  "absences",
  "expenseSettlements",
  "weeklyPlans",
  "periodicBoardDates",
  "boardAssignments",
  // Datos de la integración con Notion: la configuración (integrations/notion) y el mapa de
  // páginas ya sincronizadas (notionLinks/{key}). Quedaban huérfanos al borrar la cuadra.
  "integrations",
  "notionLinks",
];

// Collections nested more than one level below stables/{id} — unreachable by deleting their
// parent docs, since Firestore never cascade-deletes subcollections — so they're cleaned via
// a collectionGroup query instead, scoped by the stableId field every such doc carries.
const NESTED_COLLECTION_GROUPS = ["trainings", "health", "healthDocs", "expenses", "occurrences"];

export async function deleteStableCascade(stableId) {
  // Los códigos de invitación viven en una colección RAÍZ (inviteCodes/{code}), no bajo
  // stables/{id}, así que no los alcanzaba ningún borrado de subcolecciones: cada cuadra
  // eliminada dejaba vivo su código general y uno por cada invitación vinculada a un
  // integrante, y un código impreso seguía resolviendo a una cuadra inexistente. Se borran
  // PRIMERO, antes que el propio doc de la cuadra, para que nunca exista la ventana en la
  // que el código apunta a una cuadra ya borrada.
  await batchDeleteQuery(query(collection(db, "inviteCodes"), where("stableId", "==", stableId)));
  for (const name of NESTED_COLLECTION_GROUPS) {
    await batchDeleteQuery(query(collectionGroup(db, name), where("stableId", "==", stableId)));
  }
  for (const name of STABLE_SUBCOLLECTIONS) {
    await batchDeleteQuery(collection(db, "stables", stableId, name));
  }
  await deleteDoc(doc(db, "stables", stableId, "boardConfig", "main"));
}
