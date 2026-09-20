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
    { id: 'P', codigo: 'P', nombre: 'Paddock', color: '#3C7A52', visible: true },
    { id: 'C', codigo: 'C', nombre: 'Caminador', color: '#8C5F36', visible: true },
    { id: 'CU', codigo: 'CU', nombre: 'Cuerda', color: '#7C60A8', visible: true },
    { id: 'M', codigo: 'M', nombre: 'Monta', color: '#A85C25', visible: true },
    { id: 'VET', codigo: 'VET', nombre: 'Veterinario', color: '#1D6454', visible: true },
    { id: 'H', codigo: 'H', nombre: 'Herrador', color: '#6B655B', visible: true },
    { id: 'SHOW', codigo: 'SHOW', nombre: 'Concurso', color: '#8A6412', visible: true },
    { id: 'PM', codigo: 'PM', nombre: 'Paseo de la mano', color: '#4F5F39', visible: true }
  ];

  function vacio() {
    return {
      version: 2,
      perfil: { nombre: 'Jinete', codigo: 'J', color: '#275F51', foto: '', rol: 'Jinete', vistaInicial: 'pizarra' },
      caballos: [], personas: [], actividades: ACTIVIDADES.map(a => ({ ...a })),
      celdas: [], registros: []
    };
  }

  function demo() {
    const s = vacio();
    const t = today(), lun = weekStart(t);
    const caballo = (nombre, extra) => Object.assign({ id: uid('c'), nombre, foto: '', propietario: '', responsableId: '', estado: 'Activo', notas: '', visible: true }, extra || {});
    s.personas = [
      { id: 'per1', codigo: 'J', nombre: 'Jinete 1', color: '#275F51', rol: 'Jinete', visible: true },
      { id: 'per2', codigo: 'A', nombre: 'Ayudante 1', color: '#3E7396', rol: 'Ayudante', visible: true },
      { id: 'per3', codigo: 'I', nombre: 'Persona 1', color: '#7C60A8', rol: 'Propietario', visible: true }
    ];
    s.perfil.nombre = 'Jinete 1';
    s.caballos = [
      caballo('Caleste', { responsableId: 'per1' }),
      caballo('Chacoon', { responsableId: 'per1' }),
      caballo('Dassini', { responsableId: 'per2' }),
      caballo('Houston', {}),
      caballo('Gogo', { responsableId: 'per3' }),
      caballo('Basilea', { estado: 'Descanso' })
    ];
    const c = s.caballos;
    const cel = (h, dia, codigos, extra) => s.celdas.push(Object.assign({
      id: uid('z'), caballoId: h.id, fecha: addDays(lun, Math.min(6, Math.max(0, dia))), codigos, hechos: [], nota: '', vet: ''
    }, extra || {}));
    const hoyIdx = diffDays(lun, t);
    cel(c[0], 0, ['per1', 'P']); cel(c[0], 1, ['per1', 'PM', 'P']); cel(c[0], 4, ['per2', 'M']); cel(c[0], 5, ['P']);
    cel(c[1], 0, ['PM']); cel(c[1], 1, ['per2', 'C']); cel(c[1], 4, ['C']); cel(c[1], 5, ['per1', 'C', 'P']);
    cel(c[2], 0, ['per1', 'M'], { hechos: ['per1', 'M'] }); cel(c[2], 1, ['P']); cel(c[2], 5, ['per2', 'M', 'P']);
    cel(c[3], 0, ['C']); cel(c[3], 1, ['per3', 'C']); cel(c[3], 5, ['P']);
    cel(c[4], 0, ['per1', 'P']); cel(c[4], 1, ['PM']); cel(c[4], 2, ['per1', 'M']); cel(c[4], 4, ['M']); cel(c[4], 5, ['P']);
    cel(c[5], 0, ['per3', 'CU']); cel(c[5], 1, ['P']); cel(c[5], 4, [], { nota: 'Descanso' }); cel(c[5], 5, ['C']);
    if (!s.celdas.some(z => z.fecha === t && z.caballoId === c[0].id)) cel(c[0], hoyIdx, ['per1', 'M']);
    if (!s.celdas.some(z => z.fecha === t && z.caballoId === c[1].id)) cel(c[1], hoyIdx, ['P']);
    if (!s.celdas.some(z => z.fecha === t && z.caballoId === c[4].id)) cel(c[4], hoyIdx, ['per2', 'C', 'P']);
    cel(c[3], hoyIdx + 2, ['H'], { nota: 'Herrador 9:00' });
    const reg = o => s.registros.push(Object.assign({ id: uid('r'), fecha: t, nota: '', enlace: '' }, o));
    reg({ tipo: 'veterinario', caballoId: c[0].id, fecha: addDays(t, -2), concepto: 'Vacuna de gripe', nota: 'Sin reacción.' });
    reg({ tipo: 'recordatorio', caballoId: c[0].id, fecha: addMonths(addDays(t, -2), 6), concepto: 'Veterinario: Vacuna de gripe', responsableId: 'per1', hecho: false });
    reg({ tipo: 'herrador', caballoId: c[2].id, fecha: addDays(t, -12), concepto: 'Herraje', subtipo: 'Herraje', nota: 'Manos con barras.' });
    reg({ tipo: 'recordatorio', caballoId: c[2].id, fecha: addDays(t, 2), concepto: 'Herrador: Herraje', responsableId: 'per2', hecho: false });
    reg({ tipo: 'recordatorio', caballoId: c[4].id, fecha: addDays(t, 5), concepto: 'Desparasitación', responsableId: '', hecho: false });
    reg({ tipo: 'nota', caballoId: c[5].id, fecha: addDays(t, -1), concepto: 'Nota', nota: 'Sale algo cargada de la mano derecha. Ojo esta semana.' });
    reg({ tipo: 'documento', caballoId: c[0].id, fecha: addDays(t, -30), concepto: 'Pasaporte', enlace: 'https://ejemplo.com/pasaporte' });
    return s;
  }

  /* ---------- Persistencia ---------- */
  let S;
  function migrar(d) {
    if (!d) return null;
    if (d.version === 1) {
      (d.personas || []).forEach(p => { if (!p.codigo) p.codigo = p.inicial || (p.nombre || '?').charAt(0).toUpperCase(); });
      (d.celdas || []).forEach(z => {
        z.codigos = z.codigos || [];
        if (z.personaId) { if (!z.codigos.includes(z.personaId)) z.codigos.unshift(z.personaId); delete z.personaId; }
        z.hechos = z.hecho ? z.codigos.slice() : [];
        delete z.hecho;
        z.vet = z.vet || '';
      });
      d.version = 2;
    }
    return d.version === 2 ? d : null;
  }
  function load() {
    try { S = migrar(JSON.parse(localStorage.getItem(KEY))); } catch (e) { S = null; }
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
    boton: id => by(S.personas, id) || by(S.actividades, id),
    registro: id => by(S.registros, id),
    celda: (caballoId, fecha) => S.celdas.find(c => c.caballoId === caballoId && c.fecha === fecha) || null
  };

  const caballosPizarra = () => S.caballos.filter(c => c.visible !== false && c.estado !== 'Baja');
  const personasVisibles = () => S.personas.filter(p => p.visible !== false);
  const actividadesVisibles = () => S.actividades.filter(a => a.visible !== false);
  /* Botones de la pizarra: personas primero, luego actividades. Marca el orden dentro de la casilla. */
  const botones = () => personasVisibles().map(p => Object.assign({ grupo: 'persona' }, p)).concat(actividadesVisibles().map(a => Object.assign({ grupo: 'actividad' }, a)));
  const ordenBotones = () => botones().map(b => b.id);
  const esVet = b => !!b && String(b.codigo || '').toUpperCase() === 'VET';

  function upsertCelda(caballoId, fecha, cambios) {
    let c = get.celda(caballoId, fecha);
    if (!c) { c = { id: uid('z'), caballoId, fecha, codigos: [], hechos: [], nota: '', vet: '' }; S.celdas.push(c); }
    Object.assign(c, cambios);
    c.hechos = (c.hechos || []).filter(k => c.codigos.includes(k));
    limpiarCelda(c);
    return c;
  }
  function limpiarCelda(c) {
    if (!c.codigos.length && !c.nota && !c.vet) S.celdas = S.celdas.filter(x => x.id !== c.id);
  }
  function vaciarCelda(caballoId, fecha) {
    const c = get.celda(caballoId, fecha);
    if (c) S.celdas = S.celdas.filter(x => x.id !== c.id);
  }
  function toggleCodigo(caballoId, fecha, codigo) {
    const c = get.celda(caballoId, fecha) || upsertCelda(caballoId, fecha, {});
    if (c.codigos.includes(codigo)) {
      c.codigos = c.codigos.filter(k => k !== codigo);
      c.hechos = c.hechos.filter(k => k !== codigo);
    } else {
      const orden = ordenBotones();
      c.codigos = c.codigos.concat([codigo]).sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
    }
    limpiarCelda(c);
    return c;
  }

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
    get, caballosPizarra, personasVisibles, actividadesVisibles, botones, ordenBotones, esVet,
    upsertCelda, limpiarCelda, vaciarCelda, toggleCodigo, recordatorios, registrosDe
  };
  load();
  window.EQ = API;
})();
