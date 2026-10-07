import { td, addD } from "../../lib/date.js";
import { normTxt } from "./matching.js";

// Ports soDateFromText/soDuration/soAmount/soActivities/soHealth/soClauseActivity
// (public/legacy-app.js:2751-2778,2915-2955): the keyword/regex field extractors that pull
// a date, duration, amount, and activity/health type out of one clause's text.

export function soDateFromText(txt, def) {
  const t = normTxt(txt);
  const d = def || td();
  if (t.includes("pasado manana")) return addD(td(), 2);
  // normTxt quita la tilde, así que "esta mañana" (hoy) quedaba como "...manana" y se leía
  // como "mañana" (el día siguiente), programando la tarea un día tarde. Las referencias al
  // momento del día de HOY se comprueban antes que "manana".
  if (t.includes("esta manana") || t.includes("esta tarde") || t.includes("esta noche")) return td();
  if (t.includes("manana")) return addD(td(), 1);
  if (t.includes("ayer")) return addD(td(), -1);
  if (t.includes("hoy")) return td();
  const days = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 };
  for (const k in days) {
    if (t.includes(k)) {
      // "el viernes" se cuenta desde la fecha base de la orden (`def`), no desde hoy: con una
      // fecha por defecto distinta de hoy el cálculo caía en otra semana.
      const cur = new Date(d + "T12:00:00").getDay();
      let diff = (days[k] - cur + 7) % 7;
      if (diff === 0) diff = 7;
      return addD(d, diff);
    }
  }
  return d;
}

export function soDuration(txt) {
  const t = normTxt(txt);
  let m = t.match(/(\d{1,3})\s*(min|minutos|m)\b/);
  if (m) return Number(m[1]);
  m = t.match(/(\d{1,2})\s*(h|hora|horas)\b/);
  if (m) return Number(m[1]) * 60;
  if (t.includes("media hora")) return 30;
  if (t.includes("un cuarto")) return 15;
  if (t.includes("suave") || t.includes("corto")) return 30;
  return null;
}

// Forma española de un número: o con grupos de millar ("1.500", "1 200,50") o simple
// ("85", "95,50"). La alternativa con grupos va PRIMERA para que el motor la pruebe antes y
// no se quede con los tres últimos dígitos.
const SO_NUMBER = "\\d{1,3}(?:[.\\s]\\d{3})+(?:,\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?";

// Quita solo las tildes, conservando los puntos y comas del número (normTxt los sustituye
// por espacios, que era justamente por lo que la rama de palabras clave no veía el importe).
function soDeaccent(s) {
  return (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function soParseNumber(s) {
  let t = String(s || "").replace(/\s/g, "");
  // Grupos de millar con punto: el punto es separador de millares, no decimal.
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(t)) t = t.replace(/\./g, "");
  t = t.replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// Antes "coste 1.500€" devolvía 500 y "coste de 1.500" devolvía 1: la primera expresión
// retrocedía hasta los tres últimos dígitos de un número con punto de millar y la segunda
// se evaluaba sobre normTxt(raw), que ya había convertido el punto y la coma en espacios.
// Ahora se reconoce la forma completa del número y la rama de palabras clave trabaja sobre
// el texto en minúsculas y sin tildes, pero con su puntuación intacta.
export function soAmount(txt) {
  const low = soDeaccent(txt);
  let m = low.match(new RegExp("(" + SO_NUMBER + ")\\s*(?:€|euros?\\b|eur\\b)"));
  if (m) return soParseNumber(m[1]);
  m = low.match(
    new RegExp("(?:coste|costo|vale|valio|precio|factura|cobro)\\s*(?:de\\s*)?(" + SO_NUMBER + ")")
  );
  return m ? soParseNumber(m[1]) : null;
}

export function soActivities(seg) {
  const t = normTxt(seg);
  const a = [];
  const add = (id, label, notes) => {
    if (!a.some((x) => x.activity === id && x.label === label)) a.push({ activity: id, label: label || id, notes: notes || "" });
  };
  if (t.includes("paddock") || t.includes("padock")) add("paddock", "Paddock");
  if (t.includes("caminador")) add("caminador", "Caminador");
  if (t.includes("paseo de la mano") || t.includes("pasear de la mano") || t.includes("paseo mano") || t.includes("de la mano") || t.includes("mano"))
    add("paseo_mano", "Paseo de la mano");
  if (t.includes("longe") || t.includes("cuerda") || t.includes("dar cuerda")) add("longe", "Cuerda");
  if (t.includes("salto") || t.includes("saltar") || t.includes("saltado") || t.includes("salta")) add("salto", "Salto");
  if (t.includes("campo")) add("campo", "Campo");
  if (t.includes("doma")) add("doma", "Doma");
  if (t.includes("bano") || t.includes("ducha")) add("bano", "Baño");
  if (t.includes("montar") || t.includes("monte") || t.includes("monta") || t.includes("montarlo") || t.includes("montarla")) {
    if (t.includes("suave") || t.includes("tranquilo") || t.includes("flojo")) add("trabajo_suave", "Montar suave", "Trabajo suave");
    else add("monta", "Monta");
  }
  return a;
}

export function soHealth(seg) {
  const t = normTxt(seg);
  const out = [];
  const add = (type, label) => {
    if (!out.some((x) => x.type === type && x.label === label)) out.push({ type, label });
  };
  if (t.includes("infiltr")) add("otro", "Infiltración");
  if (t.includes("vacun")) add("vacuna", "Vacunación");
  if (t.includes("desparas")) add("despar", "Desparasitación");
  if (t.includes("herraj") || t.includes("herrador")) add("herraje", "Herraje");
  if (t.includes("veterin") || t.includes("revision vet")) add("otro", "Revisión veterinaria");
  if (t.includes("cojer") || t.includes("lesion") || t.includes("menudillo") || t.includes("tendon")) add("otro", "Observación veterinaria");
  return out;
}

// Ports soClauseActivity (public/legacy-app.js:2944-2955): returns every activity detected
// in the clause, falling back to a couple of "ha ido a/llevar al X" phrasings when
// soActivities finds nothing.
export function soClauseActivity(clause) {
  const acts = soActivities(clause);
  if (acts.length) return acts;
  const t = normTxt(clause);
  if (t.includes("ha ido") || t.includes("ir al") || t.includes("llevar al")) {
    if (t.includes("caminador")) return [{ activity: "caminador", label: "Caminador", notes: "" }];
    if (t.includes("paddock") || t.includes("padock")) return [{ activity: "paddock", label: "Paddock", notes: "" }];
  }
  return [];
}
