/* EquiLog · datos, guardado local y permisos */
(function () {
  'use strict';

  const KEY = 'equilog.v1';

  /* ---------- Fechas ---------- */
  const pad = n => String(n).padStart(2, '0');
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => toISO(new Date());
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return toISO(d); };
  const addMonths = (s, n) => { const d = parse(s); d.setMonth(d.getMonth() + n); return toISO(d); };
  const weekStart = s => { const d = parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toISO(d); };
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const uid = p => p + '_' + Math.random().toString(36).slice(2, 8);

  /* ---------- Catálogos ---------- */
  const ROLES = {
    gerente: 'Gerente',
    profesor: 'Profesor/a',
    propietario: 'Propietario/a',
    jinete: 'Jinete / responsable',
    administracion: 'Administración',
    encargado: 'Encargado de cuadra',
    invitado: 'Invitado'
  };

  const VISTAS = {
    gerencia: { nombre: 'Gerencia', desc: 'Sedes, cuadras generales y cobros del centro', icon: 'folder' },
    cuadra: { nombre: 'Mi cuadra privada', desc: 'Pizarra, caballos y registros', icon: 'grid' },
    caballos: { nombre: 'Mis caballos', desc: 'Todos tus caballos, estén donde estén', icon: 'shoe' },
    clases: { nombre: 'Mis clases', desc: 'Clases, alumnos y caballos de escuela', icon: 'cal' },
    admin: { nombre: 'Administración', desc: 'Mensualidades, bonos y cobros', icon: 'euro' }
  };

  const ACTIVIDADES = [
    { id: 'P', codigo: 'P', nombre: 'Paddock', color: '#5B8C51' },
    { id: 'C', codigo: 'C', nombre: 'Caminador', color: '#3F76A8' },
    { id: 'CU', codigo: 'Cu', nombre: 'Cuerda', color: '#7D62AE' },
    { id: 'M', codigo: 'M', nombre: 'Monta', color: '#9A5B2A' },
    { id: 'VET', codigo: 'VET', nombre: 'Veterinario', color: '#B3362B' },
    { id: 'H', codigo: 'H', nombre: 'Herrador', color: '#5F5A53' },
    { id: 'SHOW', codigo: 'Show', nombre: 'Concurso', color: '#B8871B' },
    { id: 'N', codigo: 'Nota', nombre: 'Nota', color: '#6F7B88' }
  ];

  const TIPOS_CLASE = ['Particular', 'Grupo', 'Grupo ponis', 'Iniciación', 'Recuperación', 'Tecnificación', 'Clase suelta'];

  const PERMISOS_BASE = { economia: false, crear: true, editarCaballos: false, verPrivadas: false, config: false, global: false };

  /* ---------- Estado vacío ---------- */
  function vacio() {
    return {
      version: 1,
      centro: null,
      sedes: [], escuelas: [], cuadrasGenerales: [], cuadrasPrivadas: [],
      usuarios: [], caballos: [], alumnos: [], clases: [],
      pizarra: [], registros: [], cobros: [],
      actividades: ACTIVIDADES.map(a => ({ ...a })),
      tiposClase: TIPOS_CLASE.slice(),
      tarifas: [],
      plantillas: [],
      sesion: { userId: null, vista: null, cuadraId: null, escuelaId: null }
    };
  }

  /* ---------- Datos de ejemplo (mínimos) ---------- */
  function demo() {
    const s = vacio();
    const t = today();
    const lun = weekStart(t);
    s.centro = { nombre: 'Centro Ecuestre', color: '#2F5D46', logo: '' };
    s.sedes.push({ id: 's1', nombre: 'Sede 1', direccion: '', color: '#2F5D46', tipo: 'Centro con escuela', notas: '', zonas: ['Pista 1', 'Pista cubierta', 'Paddock A'] });
    s.escuelas.push({ id: 'e1', sedeId: 's1', nombre: 'Escuela Sede 1' });
    s.cuadrasGenerales.push({ id: 'g1', sedeId: 's1', nombre: 'Cuadra general Sede 1' });
    s.usuarios = [
      { id: 'u1', nombre: 'Gerente', mote: 'Gerencia', foto: '', contacto: '', color: '#2F5D46', roles: ['gerente', 'administracion'], vistaInicial: 'gerencia', permisos: { ...PERMISOS_BASE, economia: true, editarCaballos: true, config: true }, atajos: {} },
      { id: 'u2', nombre: 'Propietario/a 1', mote: 'Prop', foto: '', contacto: '', color: '#9A5B2A', roles: ['propietario', 'jinete'], vistaInicial: 'cuadra', permisos: { ...PERMISOS_BASE, editarCaballos: true }, atajos: {} },
      { id: 'u3', nombre: 'Profesor/a 1', mote: 'Profe', foto: '', contacto: '', color: '#3F76A8', roles: ['profesor'], vistaInicial: 'clases', permisos: { ...PERMISOS_BASE, economia: true }, atajos: {} },
      { id: 'u4', nombre: 'Jinete 1', mote: 'Jinete', foto: '', contacto: '', color: '#7D62AE', roles: ['jinete'], vistaInicial: 'cuadra', permisos: { ...PERMISOS_BASE }, atajos: {} }
    ];
    s.cuadrasPrivadas.push({ id: 'p1', sedeId: 's1', nombre: 'Cuadra privada 1', adminId: 'u2', notas: '', accesos: [{ userId: 'u4', nivel: 'pizarra', gastos: false, salud: false }] });
    const cab = (o) => Object.assign({ foto: '', tipo: 'caballo', propietarios: [], responsableId: '', sedeId: 's1', cuadraGeneralId: 'g1', cuadraPrivadaId: '', escuelaId: '', usoEscuela: false, box: '', estado: 'Activo', mensualidad: 0, notasCentro: '', notas: '', accesos: [] }, o);
    s.caballos = [
      cab({ id: 'c1', nombre: 'Caballo 1', propietarios: [{ userId: 'u2', pct: 100 }], responsableId: 'u4', cuadraPrivadaId: 'p1', box: 'B3', mensualidad: 450 }),
      cab({ id: 'c2', nombre: 'Caballo 2', propietarios: [{ userId: 'u2', pct: 100 }], responsableId: 'u2', cuadraPrivadaId: 'p1', box: 'B4', mensualidad: 450 }),
      cab({ id: 'c3', nombre: 'Pony 1', tipo: 'pony', usoEscuela: true, escuelaId: 'e1', box: 'P1' })
    ];
    s.alumnos = [
      { id: 'a1', escuelaId: 'e1', nombre: 'Alumno 1', foto: '', edad: 9, nivel: 'Iniciación', contacto: '', profesorId: 'u3', caballoId: 'c3', bonoTotal: 8, bonoBase: 2, notas: '' },
      { id: 'a2', escuelaId: 'e1', nombre: 'Alumno 2', foto: '', edad: 14, nivel: 'Medio', contacto: '', profesorId: 'u3', caballoId: '', bonoTotal: 0, bonoBase: 0, notas: '' }
    ];
    s.clases = [
      { id: 'k1', escuelaId: 'e1', tipo: 'Grupo', fecha: t, hora: '17:00', duracion: 60, profesorId: 'u3', pista: 'Pista 1', aforo: 6, precio: 25, notas: '',
        alumnos: [{ alumnoId: 'a1', caballoId: 'c3', asistencia: null, modo: 'bono', recuperacion: false, pagado: false }, { alumnoId: 'a2', caballoId: '', asistencia: null, modo: 'suelta', recuperacion: false, pagado: false }] },
      { id: 'k2', escuelaId: 'e1', tipo: 'Particular', fecha: addDays(t, 1), hora: '18:30', duracion: 45, profesorId: 'u3', pista: 'Pista cubierta', aforo: 1, precio: 40, notas: '',
        alumnos: [{ alumnoId: 'a2', caballoId: 'c3', asistencia: null, modo: 'suelta', recuperacion: false, pagado: false }] }
    ];
    const pz = (c, d, codigos, personaId, extra) => s.pizarra.push(Object.assign({ id: uid('pz'), caballoId: c, fecha: addDays(lun, d), codigos, personaId: personaId || '', nota: '', hecho: false }, extra || {}));
    pz('c1', 0, ['P', 'M'], 'u4', { hecho: true });
    pz('c1', 1, ['C'], '');
    pz('c1', 2, ['M'], 'u4');
    pz('c2', 0, ['P'], '', { hecho: true });
    pz('c2', 1, ['M'], 'u2');
    pz('c2', 3, ['H'], '', { nota: 'Herraje completo' });
    pz('c1', 5, ['SHOW'], 'u2');
    s.registros = [
      { id: uid('r'), tipo: 'gasto', fecha: addDays(t, -3), caballoId: 'c1', concepto: 'Inscripción concurso', importe: 85, pagadorId: 'u2', pagado: false, ambito: 'privado', nota: '', autorId: 'u2' },
      { id: uid('r'), tipo: 'recordatorio', fecha: addDays(t, 5), caballoId: 'c2', concepto: 'Desparasitación', responsableId: 'u2', nota: '', hecho: false, ambito: 'privado', autorId: 'u2' }
    ];
    s.tarifas = [{ id: 't1', nombre: 'Pupilaje completo', importe: 450, tipo: 'Mensualidad' }, { id: 't2', nombre: 'Bono 8 clases', importe: 180, tipo: 'Bono' }];
    s.sesion = { userId: 'u2', vista: 'cuadra', cuadraId: 'p1', escuelaId: 'e1' };
    return s;
  }

  /* ---------- Guardado ---------- */
  let S;
  function load() {
    try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
    if (!S || S.version !== 1) S = vacio();
    const base = vacio();
    for (const k in base) if (S[k] === undefined) S[k] = base[k];
    return S;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); return true; }
    catch (e) { alert('No se ha podido guardar: el almacenamiento local está lleno. Usa fotos más pequeñas.'); return false; }
  }
  function reset(conDemo) { S = conDemo ? demo() : vacio(); save(); API.state = S; }
  function clear() { localStorage.removeItem(KEY); S = vacio(); API.state = S; }

  /* ---------- Búsquedas ---------- */
  const by = (arr, id) => (arr || []).find(x => x.id === id) || null;
  const get = {
    user: id => by(S.usuarios, id), caballo: id => by(S.caballos, id), sede: id => by(S.sedes, id),
    escuela: id => by(S.escuelas, id), cg: id => by(S.cuadrasGenerales, id), cp: id => by(S.cuadrasPrivadas, id),
    alumno: id => by(S.alumnos, id), clase: id => by(S.clases, id), act: id => by(S.actividades, id)
  };

  /* ---------- Permisos ---------- */
  const me = () => get.user(S.sesion.userId) || S.usuarios[0] || null;
  const has = (u, r) => !!u && u.roles.includes(r);
  const esGlobal = u => !!(u && u.permisos.global);
  const puedeConfig = u => !!u && (esGlobal(u) || has(u, 'gerente') || !!u.permisos.config);
  const puedeEconomia = u => !!u && (esGlobal(u) || !!u.permisos.economia);
  const puedeEditarCaballos = u => !!u && (esGlobal(u) || puedeConfig(u) || !!u.permisos.editarCaballos);
  const esCentro = u => has(u, 'gerente') || has(u, 'administracion') || has(u, 'encargado');

  /* Acceso a una cuadra privada: null = sin acceso */
  function cuadraAcceso(u, cp) {
    if (!u || !cp) return null;
    if (esGlobal(u) || cp.adminId === u.id) return { nivel: 'edicion', gastos: true, salud: true, admin: true };
    const a = (cp.accesos || []).find(x => x.userId === u.id);
    if (a) return { nivel: a.nivel, gastos: !!a.gastos, salud: !!a.salud, admin: false };
    if (u.permisos.verPrivadas) return { nivel: 'lectura', gastos: false, salud: true, admin: false };
    return null;
  }
  const puedeEditarCuadra = acc => !!acc && acc.nivel === 'edicion';
  const puedeEditarPizarra = acc => !!acc && (acc.nivel === 'edicion' || acc.nivel === 'pizarra');

  /* Nivel sobre un caballo: total | responsable | cuadra | escuela | centro | rol de acceso | null */
  function caballoNivel(u, c) {
    if (!u || !c) return null;
    if (esGlobal(u)) return 'total';
    if (c.propietarios.some(p => p.userId === u.id)) return 'total';
    const ac = (c.accesos || []).find(a => a.userId === u.id);
    if (ac && ac.rol === 'copropietario') return 'total';
    if (c.responsableId === u.id) return 'responsable';
    if (ac) return ac.rol;
    if (c.cuadraPrivadaId && cuadraAcceso(u, get.cp(c.cuadraPrivadaId))) return 'cuadra';
    if (!c.propietarios.length && esCentro(u)) return 'total';
    if (c.usoEscuela && has(u, 'profesor')) return 'escuela';
    if (esCentro(u)) return 'centro';
    return null;
  }
  const esMio = (u, c) => !!u && !!c && (c.propietarios.some(p => p.userId === u.id) || c.responsableId === u.id || (c.accesos || []).some(a => a.userId === u.id && a.rol === 'copropietario'));

  const SALUD = ['veterinario', 'herrador', 'documento'];
  function verRegistro(u, r) {
    if (!u) return false;
    if (r.autorId === u.id || esGlobal(u)) return true;
    const c = get.caballo(r.caballoId);
    if (!c) return false;
    const n = caballoNivel(u, c);
    if (!n) return false;
    if (r.tipo === 'nota' && r.visible === 'yo') return false;
    if (n === 'total') return true;
    if (r.tipo === 'nota' && r.visible === 'propietarios') return false;
    if (n === 'responsable' || n === 'jinete') return r.tipo !== 'gasto';
    if (n === 'veterinario') return SALUD.includes(r.tipo) || r.tipo === 'recordatorio';
    if (n === 'cuadra') {
      const acc = cuadraAcceso(u, get.cp(c.cuadraPrivadaId));
      if (acc.nivel === 'pizarra') return false;
      if (r.tipo === 'gasto') return acc.gastos;
      if (SALUD.includes(r.tipo)) return acc.salud;
      return true;
    }
    if (n === 'escuela') return r.tipo !== 'gasto';
    // centro / gerente / invitado: solo lo que se comparte
    if (r.ambito !== 'compartido') return false;
    return r.tipo !== 'gasto' || puedeEconomia(u);
  }

  const cuadrasDe = u => S.cuadrasPrivadas.filter(cp => cuadraAcceso(u, cp));
  const caballosVisibles = u => S.caballos.filter(c => caballoNivel(u, c));
  const misCaballos = u => S.caballos.filter(c => esMio(u, c));

  function vistasDe(u) {
    if (!u) return [];
    const v = [];
    if (has(u, 'gerente') || esGlobal(u)) v.push('gerencia');
    if (cuadrasDe(u).length) v.push('cuadra');
    if (has(u, 'propietario') || misCaballos(u).length) v.push('caballos');
    if (has(u, 'profesor')) v.push('clases');
    if (has(u, 'administracion')) v.push('admin');
    if (!v.length) v.push('caballos');
    return v;
  }

  /* Caballos que pueden aparecer en un registro según el contexto actual */
  function caballosContexto(u, ctx) {
    let list;
    if (ctx.cuadraId) list = S.caballos.filter(c => c.cuadraPrivadaId === ctx.cuadraId);
    else if (ctx.vista === 'caballos') list = misCaballos(u);
    else if (ctx.vista === 'clases') list = S.caballos.filter(c => c.usoEscuela && (!ctx.escuelaId || !c.escuelaId || c.escuelaId === ctx.escuelaId));
    else if (ctx.vista === 'cuadra') list = S.caballos.filter(c => c.cuadraPrivadaId && cuadraAcceso(u, get.cp(c.cuadraPrivadaId)));
    else list = caballosVisibles(u);
    return list.filter(c => caballoNivel(u, c));
  }

  /* ---------- Cobros del centro ---------- */
  function asegurarMensualidades(mes) {
    if (mes > today().slice(0, 7)) return;
    let cambio = false;
    S.caballos.forEach(c => {
      if (!c.cuadraGeneralId || !(+c.mensualidad > 0) || c.estado === 'Baja') return;
      if (!S.cobros.some(k => k.caballoId === c.id && k.mes === mes && k.tipo === 'mensualidad')) {
        S.cobros.push({ id: uid('k'), tipo: 'mensualidad', caballoId: c.id, cuadraGeneralId: c.cuadraGeneralId, propietarioId: (c.propietarios[0] || {}).userId || '', mes, concepto: 'Mensualidad', importe: +c.mensualidad, pagado: false });
        cambio = true;
      }
    });
    if (cambio) save();
  }

  /* ---------- Escuela (datos derivados) ---------- */
  function alumnoResumen(a) {
    const entradas = [];
    S.clases.forEach(k => k.alumnos.forEach(x => { if (x.alumnoId === a.id) entradas.push({ clase: k, e: x }); }));
    entradas.sort((p, q) => (q.clase.fecha + q.clase.hora).localeCompare(p.clase.fecha + p.clase.hora));
    const consumidas = (+a.bonoBase || 0) + entradas.filter(x => x.e.modo === 'bono' && x.e.asistencia === true).length;
    const faltas = entradas.filter(x => x.e.asistencia === false).length;
    const recUsadas = entradas.filter(x => x.e.recuperacion).length;
    const pendientes = entradas.filter(x => x.e.modo === 'suelta' && x.e.asistencia !== false && !x.e.pagado && x.clase.fecha <= today());
    return {
      entradas, consumidas, restantes: Math.max(0, (+a.bonoTotal || 0) - consumidas),
      recuperaciones: Math.max(0, faltas - recUsadas),
      pendiente: pendientes.reduce((t, x) => t + (+x.clase.precio || 0), 0), pendientes
    };
  }

  const API = {
    KEY, get state() { return S; }, set state(v) { S = v; },
    load, save, reset, clear, demo, uid,
    fecha: { today, addDays, addMonths, weekStart, diffDays, parse, toISO },
    ROLES, VISTAS, TIPOS_CLASE, PERMISOS_BASE,
    get, me, has, esGlobal, puedeConfig, puedeEconomia, puedeEditarCaballos, esCentro,
    cuadraAcceso, puedeEditarCuadra, puedeEditarPizarra, caballoNivel, esMio, verRegistro,
    cuadrasDe, caballosVisibles, misCaballos, vistasDe, caballosContexto,
    asegurarMensualidades, alumnoResumen
  };
  load();
  window.EQ = API;
})();
