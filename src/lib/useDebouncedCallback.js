import { useCallback, useEffect, useRef } from "react";

// Debounces invocation, not the value — each debounced call, once it fires, runs the LATEST
// fn with the args it was called with, so callers that read fresh state inside fn (e.g.
// updateHorseSale reading live `horses` context) stay correct even though the call is delayed.
export function useDebouncedCallback(fn, delayMs = 250) {
  const timerRef = useRef(null);
  const pendingArgsRef = useRef(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  // Ejecuta la llamada pendiente ya mismo (si hay alguna) y cancela el temporizador.
  const flush = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    const args = pendingArgsRef.current || [];
    pendingArgsRef.current = null;
    fnRef.current(...args);
  }, []);

  const debounced = useCallback(
    (...args) => {
      pendingArgsRef.current = args;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const pending = pendingArgsRef.current || [];
        pendingArgsRef.current = null;
        fnRef.current(...pending);
      }, delayMs);
    },
    [delayMs]
  );

  // Al desmontar se EJECUTA la llamada pendiente en vez de solo cancelar el temporizador:
  // antes se descartaba en silencio, así que escribir el precio de venta y cambiar de
  // pestaña antes de los 250 ms perdía el dato sin aviso.
  useEffect(() => () => flush(), [flush]);

  debounced.flush = flush;
  return debounced;
}
