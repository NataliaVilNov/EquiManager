/* EquiLog · módulo jinete — datos y guardado local */
(function () {
  'use strict';

  const KEY = 'equilog.jinete.v1';

  /* ---------- Fechas ---------- */
  const pad = n => String(n).padStart(2, '0');
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => toISO(new Date());
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return toISO(d); };
  const addMonths = (s, n) => { const d = parse(s); d.setMonth(d.getMonth() + n); return toISO(d); };
  const addWeeks = (s, n) => addDays(s, n * 7);
  const weekStart = s => { const d = parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toISO(d); };
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const uid = p => p + '_' + Math.random().toString(36).slice(2, 8);

  const ESTADOS = ['Activo', 'Descanso', 'Lesionado', 'Fuera temporalmente', 'Baja'];
  const TIPOS_REG = {
    pizarra: { nombre: 'Pizarra', desc: 'Actividad del día' },
    veterinario: { nombre: 'Veterinario', desc: 'Actuación y próxima cita' },
    herrador: { nombre: 'Herrador', desc: 'Herraje, recorte o revisión' },
    recordatorio: { nombre: 'Recordatorio', desc: 'Una fecha que no se olvide' },
    nota: { nombre: 'Nota', desc: 'Texto rápido' },
    documento: { nombre: 'Documento', desc: 'Enlace o archivo' }
  };

  const ACTIVIDADES = [
    { id: 'P', codigo: 'P', nombre: 'Paddock', color: '#5C8C4F', visible: true },
    { id: 'C', codigo: 'C', nombre: 'Caminador', color: '#3E7396', visible: true },
    { id: 'CU', codigo: 'CU', nombre: 'Cuerda', color: '#7C60A8', visible: true },
    { id: 'M', codigo: 'M', nombre: 'Monta', color: '#A85C25', visible: true },
    { id: 'VET', codigo: 'VET', nombre: 'Veterinario', color: '#B03A2E', visible: true },
    { id: 'H', codigo: 'H', nombre: 'Herrador', color: '#6B655B', visible: true },
    { id: 'SHOW', codigo: 'Show', nombre: 'Concurso', color: '#B0851C', visible: true },
    { id: 'N', codigo: 'N', nombre: 'Nota', color: '#2F6B4F', visible: true }
  ];

  function vacio() {
    return {
      version: 1,
      perfil: { nombre: 'Jinete', inicial: 'J', color: '#2F6B4F', foto: '', rol: 'Jinete', vistaInicial: 'pizarra' },
      caballos: [], personas: [], actividades: ACTIVIDADES.map(a => ({ ...a })),
      celdas: [], registros: []
    };
  }

  function demo() {
    const s = vacio();
    const t = today(), lun = weekStart(t);
    const caballo = (nombre, extra) => Object.assign({ id: uid('c'), nombre, foto: '', propietario: '', responsableId: '', estado: 'Activo', notas: '', visible: true }, extra || {});
    s.personas = [
      { id: 'p1', nombre: 'Jinete 1', inicial: 'J', color: '#2F6B4F', rol: 'Jinete', visible: true },
      { id: 'p2', nombre: 'Ayudante 1', inicial: 'A', color: '#3E7396', visible: true, rol: 'Ayudante' },
      { id: 'p3', nombre: 'Persona 1', inicial: 'I', color: '#7C60A8', rol: 'Propietario', visible: true }
    ];
    s.perfil.nombre = 'Jinete 1';
    s.caballos = [
      caballo('Caleste', { responsableId: 'p1' }),
      caballo('Chacoon', { responsableId: 'p1' }),
      caballo('Dassini', { responsableId: 'p2' }),
      caballo('Houston', {}),
      caballo('Gogo', { responsableId: 'p3' }),
      caballo('Basilea', { estado: 'Descanso' })
    ];
    const [c1, c2, c3, c4, c5, c6] = s.caballos;
    const cel = (c, dia, codigos, personaId, extra) => s.celdas.push(Object.assign({
      id: uid('z'), caballoId: c.id, fecha: addDays(lun, dia), codigos, personaId: personaId || '', nota: '', hecho: false
    }, extra || {}));
    const hoyIdx = diffDays(lun, t);
    const dh = n => Math.min(6, Math.max(0, hoyIdx + n));
    cel(c1, 0, ['P'], 'p1'); cel(c1, 1, ['N', 'P'], 'p1'); cel(c1, 4, ['M'], 'p2'); cel(c1, 5, ['P'], '');
    cel(c2, 0, ['N'], ''); cel(c2, 1, ['C'], 'p2'); cel(c2, 4, ['N'], ''); cel(c2, 5, ['C', 'P'], 'p1');
    cel(c3, 0, ['M'], 'p1', { hecho: true }); cel(c3, 1, ['P'], ''); cel(c3, 5, ['M', 'P'], 'p2');
    cel(c4, 0, ['C'], ''); cel(c4, 1, ['C'], 'p3'); cel(c4, 5, ['P'], '');
    cel(c5, 0, ['P'], 'p1'); cel(c5, 1, ['N'], ''); cel(c5, 2, ['M'], 'p1'); cel(c5, 4, ['M'], ''); cel(c5, 5, ['N'], '');
    cel(c6, 0, ['CU'], 'p3'); cel(c6, 1, ['P'], ''); cel(c6, 4, [], '', { nota: 'Descanso' }); cel(c6, 5, ['C'], '');
    if (!s.celdas.some(z => z.fecha === t && z.caballoId === c1.id)) cel(c1, hoyIdx, ['M'], 'p1');
    if (!s.celdas.some(z => z.fecha === t && z.caballoId === c2.id)) cel(c2, hoyIdx, ['P'], '');
    if (!s.celdas.some(z => z.fecha === t && z.caballoId === c5.id)) cel(c5, hoyIdx, ['C', 'P'], 'p2');
    cel(c4, dh(2), ['H'], '', { nota: 'Herrador 9:00' });
    const reg = o => s.registros.push(Object.assign({ id: uid('r'), fecha: t, nota: '', enlace: '' }, o));
    reg({ tipo: 'veterinario', caballoId: c1.id, fecha: addDays(t, -2), concepto: 'Vacuna de gripe', nota: 'Sin reacción.' });
    reg({ tipo: 'recordatorio', caballoId: c1.id, fecha: addMonths(addDays(t, -2), 6), concepto: 'Veterinario: Vacuna de gripe', responsableId: 'p1', hecho: false });
    reg({ tipo: 'herrador', caballoId: c3.id, fecha: addDays(t, -12), concepto: 'Herraje', subtipo: 'Herraje', nota: 'Manos con barras.' });
    reg({ tipo: 'recordatorio', caballoId: c3.id, fecha: addDays(t, 2), concepto: 'Herrador: Herraje', responsableId: 'p2', hecho: false });
    reg({ tipo: 'recordatorio', caballoId: c5.id, fecha: addDays(t, 5), concepto: 'Desparasitación', responsableId: '', hecho: false });
    reg({ tipo: 'nota', caballoId: c6.id, fecha: addDays(t, -1), concepto: 'Nota', nota: 'Sale algo cargada de la mano derecha. Ojo esta semana.' });
    reg({ tipo: 'documento', caballoId: c1.id, fecha: addDays(t, -30), concepto: 'Pasaporte', enlace: 'https://ejemplo.com/pasaporte' });
    return s;
  }

  /* ---------- Persistencia ---------- */
  let S;
  function load() {
    try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
    if (!S || S.version !== 1) S = null;
    if (!S) { S = demo(); guardar(); }
    const base = vacio();
    for (const k in base) if (S[k] === undefined) S[k] = base[k];
    API.state = S;
    return S;
  }
  let pend = null;
  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); API.estado = 'guardado'; return true; }
    catch (e) { API.estado = 'error'; alert('No se ha podido guardar: el almacenamiento está lleno. Usa fotos más pequeñas.'); return false; }
  }
  function save() {
    API.estado = 'guardando';
    if (API.onEstado) API.onEstado(API.estado);
    clearTimeout(pend);
    pend = setTimeout(() => { guardar(); if (API.onEstado) API.onEstado(API.estado); }, 120);
  }
  function reset(conDemo) { S = conDemo ? demo() : vacio(); guardar(); API.state = S; }

  const by = (arr, id) => (arr || []).find(x => x.id === id) || null;
  const get = {
    caballo: id => by(S.caballos, id),
    persona: id => by(S.personas, id),
    act: id => by(S.actividades, id),
    registro: id => by(S.registros, id),
    celda: (caballoId, fecha) => S.celdas.find(c => c.caballoId === caballoId && c.fecha === fecha) || null
  };

  /* Caballos visibles en la pizarra, en su orden */
  const caballosPizarra = () => S.caballos.filter(c => c.visible !== false && c.estado !== 'Baja');
  const personasVisibles = () => S.personas.filter(p => p.visible !== false);
  const actividadesVisibles = () => S.actividades.filter(a => a.visible !== false);

  function upsertCelda(caballoId, fecha, cambios) {
    let c = get.celda(caballoId, fecha);
    if (!c) { c = { id: uid('z'), caballoId, fecha, codigos: [], personaId: '', nota: '', hecho: false }; S.celdas.push(c); }
    Object.assign(c, cambios);
    limpiarCelda(c);
    return c;
  }
  function limpiarCelda(c) {
    if (!c.codigos.length && !c.nota && !c.personaId && !c.hecho) S.celdas = S.celdas.filter(x => x.id !== c.id);
  }
  function toggleCodigo(caballoId, fecha, codigo, personaId) {
    const c = get.celda(caballoId, fecha) || upsertCelda(caballoId, fecha, {});
    const i = c.codigos.indexOf(codigo);
    if (i >= 0) c.codigos.splice(i, 1);
    else { c.codigos.push(codigo); if (personaId) c.personaId = personaId; }
    limpiarCelda(c);
    return c;
  }

  /* Recordatorios pendientes ordenados */
  function recordatorios(soloPendientes) {
    return S.registros.filter(r => r.tipo === 'recordatorio' && (!soloPendientes || !r.hecho))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
  const registrosDe = id => S.registros.filter(r => r.caballoId === id).sort((a, b) => b.fecha.localeCompare(a.fecha));

  const API = {
    KEY, state: null, estado: 'guardado', onEstado: null,
    load, save, reset, demo,
    borrar() { localStorage.removeItem(KEY); S = vacio(); API.state = S; },
    uid, ESTADOS, TIPOS_REG,
    fecha: { today, addDays, addMonths, addWeeks, weekStart, diffDays, parse, toISO },
    get, caballosPizarra, personasVisibles, actividadesVisibles,
    upsertCelda, toggleCodigo, limpiarCelda, recordatorios, registrosDe
  };
  load();
  window.EQ = API;
})();
