// El token de integración de Notion vive ÚNICAMENTE en el almacenamiento de este navegador,
// con clave por usuario. Deliberadamente nunca se escribe en Firestore (cualquier miembro de
// una cuadra puede leer sus documentos) ni forma parte del build (los valores VITE_* son
// públicos en el bundle). Todo acceso va envuelto: el almacenamiento puede no estar
// disponible (ventanas privadas, datos de sitio bloqueados) y la función debe comportarse
// entonces como "no conectado".
//
// RIESGO DE ORIGEN COMPARTIDO (por qué sessionStorage y no localStorage)
// ----------------------------------------------------------------------
// La aplicación se publica en GitHub Pages, en nataliavilnov.github.io/equilog, y TODOS los
// sitios de Pages de esa cuenta comparten UN MISMO ORIGEN (nataliavilnov.github.io). El
// almacenamiento del navegador se aísla por origen, no por ruta, así que un token de larga
// vida guardado en localStorage sería legible por cualquier otra página que esa cuenta
// publique en Pages (y por cualquier script inyectado en ella), para siempre y en segundo
// plano. Pasándolo a sessionStorage el token muere con la pestaña: sigue siendo legible
// desde el mismo origen mientras la pestaña vive, pero deja de ser un secreto persistente
// en el disco del usuario, y un ordenador compartido (la oficina de la cuadra) no lo
// conserva entre sesiones.
//
// SOLUCIÓN DURADERA: el token no debería llegar nunca al navegador. Hay que proxear las
// llamadas a Notion a través de una Cloud Function que guarde el token en el servidor
// (Secret Manager) y exponga solo los endpoints de sincronización que la app necesita,
// autenticados con el ID token de Firebase. Mientras eso no exista, esto es mitigación.
const tokenKey = (uid) => `equilog:notion-token:${uid}`;

export function getNotionToken(uid) {
  if (!uid) return "";
  try {
    return sessionStorage.getItem(tokenKey(uid)) || "";
  } catch (_err) {
    return "";
  }
}

// Returns false when the token could not be stored (the caller says so instead of pretending).
export function setNotionToken(uid, token) {
  if (!uid) return false;
  try {
    sessionStorage.setItem(tokenKey(uid), token);
    return true;
  } catch (_err) {
    return false;
  }
}

export function clearNotionToken(uid) {
  if (!uid) return;
  try {
    sessionStorage.removeItem(tokenKey(uid));
  } catch (_err) {
    // nothing stored, nothing to clear
  }
  // Limpia también el valor heredado de localStorage: cualquier usuario que ya tuviese el
  // token guardado antes de este cambio lo seguiría teniendo ahí para siempre, que es
  // justamente lo que este cambio pretende eliminar.
  try {
    localStorage.removeItem(tokenKey(uid));
  } catch (_err) {
    // nothing stored, nothing to clear
  }
}
