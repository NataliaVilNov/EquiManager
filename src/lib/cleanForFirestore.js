// Un objeto literal ({...}) es el único que conviene recorrer campo a campo.
function isPlainObject(value) {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function cleanForFirestore(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(cleanForFirestore);
  // Solo se recorren los objetos planos. Un Date, un Timestamp de Firestore o un centinela
  // de FieldValue (serverTimestamp(), arrayUnion(), deleteField()...) no tienen claves
  // propias enumerables, así que el recorrido genérico los convertía en {} y el dato se
  // perdía o el centinela dejaba de aplicarse. Se reconocen por su prototipo: cualquier
  // cosa que no sea un objeto literal se pasa tal cual a Firestore, que ya sabe tratarla.
  if (isPlainObject(value)) {
    const out = {};
    Object.keys(value).forEach((k) => {
      const v = value[k];
      out[k] = v === undefined ? null : cleanForFirestore(v);
    });
    return out;
  }
  return value;
}
