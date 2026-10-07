// Lets plain (non-React) modules like firestoreCollections.js surface a write failure to the
// user, without importing React context machinery into a lib file. ToastProvider registers
// itself as the handler on mount; until then (or if it's ever unmounted) failures still land
// in the console instead of vanishing silently.
let handler = null;

export function registerErrorReporter(fn) {
  handler = fn;
}

export function reportWriteError(err) {
  console.error("Firestore write failed:", err);
  if (handler) handler("Error guardando los cambios. Vuelve a intentarlo.");
}

// Un fallo de LECTURA (un listener rechazado por las reglas, un índice compuesto que falta,
// una caída de red) se avisaba con el mensaje de escritura: el usuario leía que no se habían
// guardado sus cambios cuando en realidad no se habían podido cargar los datos.
export function reportReadError(err) {
  console.error("Firestore read failed:", err);
  if (handler) handler("No se pudieron cargar los datos. Comprueba tu conexión.");
}
