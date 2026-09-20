/* EquiLog · módulo jinete — interfaz */
(function () {
  'use strict';
  const E = window.EQ, F = E.fecha;
  const S = () => E.state;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = () => $('#app');

  /* ---------- Fechas ---------- */
  const DF = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  const DFL = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' });
  const MS = new Intl.DateTimeFormat('es-ES', { month: 'short' });
  const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const limpia = s => s.replace(/\./g, '');
  function fdate(iso) {
    if (!iso) return '';
    const d = F.diffDays(F.today(), iso);
    if (d === 0) return 'Hoy';
    if (d === 1) return 'Mañana';
    if (d === -1) return 'Ayer';
    const f = F.parse(iso);
    const ano = f.getFullYear() !== new Date().getFullYear() ? ' ' + f.getFullYear() : '';
    return limpia(DF.format(f)) + ano;
  }
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  /* ---------- Iconos ---------- */
  const P = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    grid: 'M3 5h18v14H3zM3 10h18M9 5v14M15 5v14',
    horse: 'M6 20v-8a6 6 0 0 1 12 0v8M4 20h4M16 20h4M9 10h.01M15 10h.01M8.6 15h.01M15.4 15h.01',
    list: 'M4 7h16M4 12h16M4 17h10',
    dots: 'M5 12h.01M12 12h.01M19 12h.01',
    plus: 'M12 5v14M5 12h14',
    check: 'M5 12.5l4.5 4.5L19 7',
    x: 'M6 6l12 12M18 6 6 18',
    back: 'M15 5l-7 7 7 7',
    chev: 'M9 6l6 6-6 6',
    bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
    vet: 'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z',
    hammer: 'M14 3l7 7-3 3-7-7zM12.5 8.5 4 17l3 3 8.5-8.5',
    note: 'M5 4h14v11l-5 5H5zM14 20v-5h5M8 9h8M8 13h4',
    doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
    trash: 'M5 7h14M9.5 7V4h5v3M7 7l1 13h8l1-13',
    gear: 'M4 7h9M17 7h3M15 5v4M4 17h3M11 17h9M9 15v4',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2.2.8 3.5 3 3.5 6',
    repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
    copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
    eraser: 'M8 20H4l-1-4 11-11 6 6-9 9M13 9l5 5',
    dot: 'M12 12h.01',
    eye: 'M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    eyeoff: 'M4 4l16 16M10.5 6.3A9.7 9.7 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.7M6.6 8.3A16.6 16.6 0 0 0 2 12s3.6 6 10 6c1.4 0 2.6-.3 3.7-.7',
    up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6',
    camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
    link: 'M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1',
    help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3M12 17h.01',
    save: 'M5 4h11l3 3v13H5zM8 4v6h7V4M8 20v-6h8v6'
  };
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.dot}"/></svg>`;

  /* ---------- Piezas ---------- */
  const iniciales = n => (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  function hthumb(c, cls = '') {
    return `<span class="hthumb ${cls}">${c && c.foto ? `<img src="${c.foto}" alt="">` : esc(iniciales(c && c.nombre))}</span>`;
  }
  function pav(p, size = 34) {
    if (!p) return '';
    return `<span class="av" style="width:${size}px;height:${size}px;background:${esc(p.color || '#8C8377')};font-size:${Math.round(size * .42)}px">${p.foto ? `<img src="${p.foto}" alt="">` : esc(p.codigo || iniciales(p.nombre))}</span>`;
  }
  const cName = id => (E.get.caballo(id) || {}).nombre || '';
  const pName = id => (E.get.persona(id) || {}).nombre || '';
  function row({ href, icon, lead, t, s, end, data = '', cls = '' }) {
    const tag = href ? 'a' : 'button';
    return `<${tag} class="row ${cls}" ${href ? `href="${href}"` : 'type="button"'} ${data}>${lead || (icon ? `<span class="tile">${ic(icon)}</span>` : '')}<span class="body"><span class="t">${t}</span>${s ? `<span class="s">${s}</span>` : ''}</span><span class="end">${end !== undefined ? end : ic('chev', 's')}</span></${tag}>`;
  }
  const sec = (h, right = '') => `<div class="sec"><h2>${h}</h2>${right}</div>`;
  const vacio = (icon, t, s, extra = '') => `<div class="card empty">${ic(icon, 'l')}<b style="margin-top:6px">${t}</b>${s ? `<div class="small">${s}</div>` : ''}${extra ? `<div style="margin-top:14px">${extra}</div>` : ''}</div>`;
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.append(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 1700);
  }
  const PALETA = ['#2F6B4F', '#3E7396', '#A85C25', '#7C60A8', '#B03A2E', '#B0851C', '#5C8C4F', '#B5618A', '#3F8A8A', '#6B655B'];

  /* ---------- Hojas ---------- */
  let abierta = null;
  function sheet({ title = '', body = '', done, doneLabel = 'Guardar', cancelLabel = 'Cancelar', mount }) {
    if (abierta) abierta.close(true);
    const back = document.createElement('div'); back.className = 'sheet-back';
    const el = document.createElement('div'); el.className = 'sheet';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', title);
    el.innerHTML = `<div class="grab"></div><div class="sheet-h"><div class="l"><button type="button" data-x>${esc(cancelLabel)}</button></div><h3></h3><div class="r"></div></div><div class="sheet-b"></div>`;
    $('h3', el).textContent = title;
    const b = $('.sheet-b', el);
    if (typeof body === 'string') b.innerHTML = body; else if (body) b.append(body);
    document.body.append(back, el);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { back.classList.add('in'); el.classList.add('in'); });
    const prev = document.activeElement;
    const onKey = e => { if (e.key === 'Escape') api.close(); };
    const api = {
      el, body: b,
      close(inst) {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
        abierta = null;
        if (inst) { back.remove(); el.remove(); return; }
        back.classList.remove('in'); el.classList.remove('in');
        setTimeout(() => { back.remove(); el.remove(); }, 260);
        if (prev && prev.focus) prev.focus();
      },
      setTitle(t) { $('h3', el).textContent = t; },
      setDone(label, fn) {
        const r = $('.r', el); r.innerHTML = '';
        if (!fn) return;
        const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = label;
        btn.onclick = () => { if (fn(api) !== false) api.close(); };
        r.append(btn);
      }
    };
    document.addEventListener('keydown', onKey);
    back.onclick = () => api.close();
    $('[data-x]', el).onclick = () => api.close();
    if (done) api.setDone(doneLabel, done);
    abierta = api;
    if (mount) mount(api);
    return api;
  }

  /* ---------- Formularios ---------- */
  function fieldHTML(f, v) {
    const val = v !== undefined && v !== null ? v : (f.def !== undefined ? f.def : '');
    const id = 'f_' + f.key;
    const hint = f.hint ? `<div class="fhint">${esc(f.hint)}</div>` : '';
    const lab = `<label class="lab" for="${id}">${esc(f.label)}</label>`;
    const open = (cls = '') => `<div class="field ${cls}" data-key="${f.key}">`;
    switch (f.type) {
      case 'toggle':
        return `${open('inline')}<span class="lab">${esc(f.label)}</span><span class="switch"><input type="checkbox" ${val ? 'checked' : ''} aria-label="${esc(f.label)}"><i></i></span></div>`;
      case 'select':
        return `${open()}${lab}<select id="${id}">${f.options.map(o => `<option value="${esc(o.v)}" ${String(o.v) === String(val) ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select>${hint}</div>`;
      case 'segment':
        return `${open()}<span class="lab">${esc(f.label)}</span><div class="pick ${f.col ? 'col' : ''}" role="radiogroup" aria-label="${esc(f.label)}">${f.options.map(o => `<label><input type="radio" name="${id}" value="${esc(o.v)}" ${String(o.v) === String(val) ? 'checked' : ''}><span>${esc(o.l)}</span></label>`).join('')}</div>${hint}</div>`;
      case 'botones': {
        const arr = Array.isArray(val) ? val : [];
        return `${open()}<span class="lab">${esc(f.label)}</span><div class="pick">${E.botones().map(b => `<label><input type="checkbox" value="${esc(b.id)}" ${arr.includes(b.id) ? 'checked' : ''}><span><b style="color:${b.color}">${esc(b.codigo)}</b> ${esc(b.nombre)}</span></label>`).join('')}</div>${hint}</div>`;
      }
      case 'color':
        return `${open()}<span class="lab">${esc(f.label)}</span><div class="swatches">${PALETA.concat(PALETA.includes(val) || !val ? [] : [val]).map(c => `<label><input type="radio" name="${id}" value="${c}" ${c === (val || PALETA[0]) ? 'checked' : ''} aria-label="Color ${c}"><span style="--c:${c}"></span></label>`).join('')}</div></div>`;
      case 'textarea':
        return `${open()}${lab}<textarea id="${id}" placeholder="${esc(f.ph || '')}">${esc(val)}</textarea>${hint}</div>`;
      case 'photo':
        return `${open()}<span class="lab">${esc(f.label)}</span><div class="photo-field"><span class="prev">${val ? `<img src="${val}" alt="">` : ic('camera')}</span><span class="btns"><label class="btn sm">Elegir foto<input type="file" accept="image/*" hidden></label><button type="button" class="btn sm" data-clear>Quitar</button></span><input type="hidden" value="${esc(val)}"></div></div>`;
      case 'nota':
        return `<div class="field" data-key="${f.key || 'n'}"><div class="fhint" style="margin:0">${esc(f.label)}</div></div>`;
      default:
        return `${open()}${lab}<input id="${id}" type="${f.type || 'text'}" value="${esc(val)}" placeholder="${esc(f.ph || '')}" ${f.type === 'number' ? 'inputmode="decimal" step="any"' : ''}>${hint}</div>`;
    }
  }
  function formHTML(fields, values = {}) {
    const g = [{ t: '', items: [] }];
    fields.forEach(f => {
      if (f.type === 'title') g.push({ t: f.label, items: [] });
      else g[g.length - 1].items.push(fieldHTML(f, values[f.key]));
    });
    return g.filter(x => x.items.length).map(x => (x.t ? `<div class="ftitle">${esc(x.t)}</div>` : '') + `<div class="group">${x.items.join('')}</div>`).join('');
  }
  function readForm(root, fields) {
    const out = {};
    fields.forEach(f => {
      if (!f.key || f.type === 'title' || f.type === 'nota') return;
      const r = $(`[data-key="${f.key}"]`, root); if (!r) return;
      switch (f.type) {
        case 'toggle': out[f.key] = $('input', r).checked; break;
        case 'botones': out[f.key] = $$('input:checked', r).map(i => i.value); break;
        case 'segment': case 'color': out[f.key] = ($('input:checked', r) || {}).value || ''; break;
        case 'number': { const s = $('input', r).value.replace(',', '.'); out[f.key] = s === '' ? '' : +s; break; }
        case 'photo': out[f.key] = $('input[type=hidden]', r).value; break;
        default: out[f.key] = ($('input,select,textarea', r).value || '').trim();
      }
    });
    return out;
  }
  function bindForm(root, fields) {
    const upd = () => {
      const v = readForm(root, fields);
      fields.forEach(f => { if (f.when && f.key) { const r = $(`[data-key="${f.key}"]`, root); if (r) r.classList.toggle('hidden', !f.when(v)); } });
    };
    root.addEventListener('change', upd);
    root.addEventListener('input', upd);
    fields.filter(f => f.type === 'photo').forEach(f => {
      const r = $(`[data-key="${f.key}"]`, root);
      const set = val => { $('input[type=hidden]', r).value = val; $('.prev', r).innerHTML = val ? `<img src="${val}" alt="">` : ic('camera'); };
      $('input[type=file]', r).onchange = async e => { const file = e.target.files[0]; if (file) set(await imgData(file)); };
      $('[data-clear]', r).onclick = () => set('');
    });
    upd();
  }
  function imgData(file, max = 420) {
    return new Promise(res => {
      const rd = new FileReader();
      rd.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', .8));
        };
        img.onerror = () => res('');
        img.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
  }
  function openForm({ title, fields, values = {}, onSave, onDelete, deleteLabel = 'Eliminar', doneLabel = 'Guardar', intro = '' }) {
    const body = document.createElement('div');
    body.innerHTML = intro + formHTML(fields, values) + (onDelete ? `<button type="button" class="btn danger block" data-del style="margin:6px 0 4px">${ic('trash', 's')} ${esc(deleteLabel)}</button>` : '');
    return sheet({
      title, body, doneLabel,
      mount: () => {
        bindForm(body, fields);
        const d = $('[data-del]', body);
        if (d) d.onclick = () => { if (onDelete() !== false) { abierta && abierta.close(); E.save(); render(); } };
      },
      done: () => {
        const v = readForm(body, fields);
        for (const f of fields) {
          if (!f.req) continue;
          const r = $(`[data-key="${f.key}"]`, body);
          if (r && r.classList.contains('hidden')) continue;
          const val = v[f.key];
          if (val === '' || val == null || (Array.isArray(val) && !val.length)) { toast('Falta: ' + f.label); return false; }
        }
        if (onSave(v) === false) return false;
        E.save(); render();
        return true;
      }
    });
  }
  const opt = (arr, blank) => (blank !== undefined ? [{ v: '', l: blank }] : []).concat(arr.map(x => ({ v: x.id, l: x.nombre })));

  /* ================= Registro rápido ================= */
  function regFields(tipo, pre) {
    const t = F.today();
    const cab = { key: 'caballoId', label: 'Caballo', type: 'select', options: opt(S().caballos), def: pre.caballoId || (S().caballos[0] || {}).id, req: true };
    const per = (label, blank) => ({ key: 'personaId', label, type: 'select', options: opt(E.personasVisibles(), blank) });
    const rec = (plazos, def) => [
      { type: 'title', label: 'Próxima vez' },
      { key: 'recordar', label: 'Crear recordatorio', type: 'toggle', def: tipo === 'herrador' },
      { key: 'plazo', label: 'Recordar dentro de', type: 'segment', options: plazos, def, when: v => v.recordar },
      { key: 'recFecha', label: 'Fecha del recordatorio', type: 'date', def: F.addMonths(t, 6), when: v => v.recordar && v.plazo === 'otra' }
    ];
    switch (tipo) {
      case 'pizarra': return [
        { key: 'fecha', label: 'Fecha', type: 'date', def: pre.fecha || t, req: true }, cab,
        { key: 'codigos', label: 'Personas y actividades', type: 'botones', req: true },
        { key: 'nota', label: 'Nota', ph: 'Opcional' },
        { key: 'hecho', label: 'Marcar como hecho', type: 'toggle' }];
      case 'veterinario': return [
        { key: 'fecha', label: 'Fecha de la actuación', type: 'date', def: t, req: true }, cab,
        { key: 'concepto', label: 'Concepto', ph: 'Vacuna, revisión, tratamiento…', req: true, def: pre.concepto },
        { key: 'nota', label: 'Nota', type: 'textarea', ph: 'Opcional' },
        { key: 'enlace', label: 'Documento o enlace', type: 'url', ph: 'https://… (opcional)' },
        ...rec([{ v: '1', l: '1 mes' }, { v: '3', l: '3 meses' }, { v: '6', l: '6 meses' }, { v: '12', l: '1 año' }, { v: 'otra', l: 'Otra fecha' }], '6')];
      case 'herrador': return [
        { key: 'fecha', label: 'Fecha de la actuación', type: 'date', def: t, req: true }, cab,
        { key: 'subtipo', label: 'Tipo', type: 'segment', options: ['Herraje', 'Recorte', 'Revisión'].map(x => ({ v: x, l: x })), def: 'Herraje' },
        { key: 'nota', label: 'Nota', type: 'textarea', ph: 'Opcional' },
        ...rec([{ v: 's4', l: '4 semanas' }, { v: 's6', l: '6 semanas' }, { v: 's8', l: '8 semanas' }, { v: 'otra', l: 'Otra fecha' }], 's6')];
      case 'recordatorio': return [
        { key: 'fecha', label: 'Fecha', type: 'date', def: pre.fecha || F.addDays(t, 7), req: true }, cab,
        { key: 'concepto', label: 'Qué hay que recordar', req: true, def: pre.concepto },
        per('Responsable', 'Sin responsable'),
        { key: 'nota', label: 'Nota', ph: 'Opcional' }];
      case 'nota': return [
        { key: 'fecha', label: 'Fecha', type: 'date', def: t, req: true }, cab,
        { key: 'nota', label: 'Nota', type: 'textarea', req: true },
        { key: 'visibilidad', label: 'Visibilidad', type: 'segment', options: [{ v: 'todos', l: 'Visible para todos' }, { v: 'yo', l: 'Solo yo' }], def: 'todos' }];
      case 'documento': return [
        cab,
        { key: 'concepto', label: 'Título', req: true, ph: 'Pasaporte, seguro, analítica…' },
        { key: 'enlace', label: 'Enlace', type: 'url', ph: 'https://…' },
        { key: 'fecha', label: 'Fecha', type: 'date', def: t },
        { key: 'nota', label: 'Nota', ph: 'Opcional' }];
    }
    return [];
  }
  function guardarRegistro(tipo, v) {
    const t = F.today();
    if (tipo === 'pizarra') {
      const c = E.upsertCelda(v.caballoId, v.fecha, {});
      const orden = E.ordenBotones();
      v.codigos.forEach(x => { if (!c.codigos.includes(x)) c.codigos.push(x); });
      c.codigos.sort((x, y) => orden.indexOf(x) - orden.indexOf(y));
      if (v.nota) c.nota = c.nota ? c.nota + ' · ' + v.nota : v.nota;
      c.hechos = v.hecho ? c.codigos.slice() : (c.hechos || []);
      E.limpiarCelda(c);
      return 'Añadido a la pizarra';
    }
    const r = { id: E.uid('r'), tipo, fecha: v.fecha || t, caballoId: v.caballoId, concepto: v.concepto || '', nota: v.nota || '', enlace: v.enlace || '' };
    if (tipo === 'herrador') { r.subtipo = v.subtipo; r.concepto = v.subtipo; }
    if (tipo === 'recordatorio') { r.responsableId = v.personaId || ''; r.hecho = false; }
    if (tipo === 'nota') { r.concepto = 'Nota'; r.visibilidad = v.visibilidad; }
    S().registros.push(r);
    if (tipo === 'veterinario' || tipo === 'herrador') {
      const buscado = tipo === 'veterinario' ? 'VET' : 'H';
      const bot = S().actividades.find(x => (x.codigo || '').toUpperCase() === buscado);
      if (bot) {
        const c = E.upsertCelda(r.caballoId, r.fecha, {});
        const orden = E.ordenBotones();
        if (!c.codigos.includes(bot.id)) c.codigos.push(bot.id);
        c.codigos.sort((x, y) => orden.indexOf(x) - orden.indexOf(y));
        if (r.fecha < t) c.hechos = c.codigos.slice();
        E.limpiarCelda(c);
      }
      if (v.recordar) {
        let f = v.recFecha;
        if (v.plazo && v.plazo !== 'otra') f = v.plazo[0] === 's' ? F.addWeeks(r.fecha, +v.plazo.slice(1)) : F.addMonths(r.fecha, +v.plazo);
        S().registros.push({ id: E.uid('r'), tipo: 'recordatorio', fecha: f, caballoId: r.caballoId, concepto: (tipo === 'veterinario' ? 'Veterinario: ' : 'Herrador: ') + r.concepto, responsableId: '', nota: '', hecho: false, origenId: r.id });
        return 'Guardado. Recordatorio el ' + DFL.format(F.parse(f));
      }
    }
    return 'Registro guardado';
  }
  function registroSheet(pre = {}) {
    const body = document.createElement('div');
    const api = sheet({ title: 'Nuevo registro', body });
    function paso1() {
      api.setTitle('Nuevo registro'); api.setDone('', null);
      body.innerHTML = `<div class="types">${Object.entries(E.TIPOS_REG).map(([k, o]) => `<button class="type" type="button" data-t="${k}"><span class="tile">${ic(k === 'pizarra' ? 'grid' : k === 'veterinario' ? 'vet' : k === 'herrador' ? 'hammer' : k === 'recordatorio' ? 'bell' : k === 'nota' ? 'note' : 'doc')}</span><b>${o.nombre}</b><small>${o.desc}</small></button>`).join('')}</div>`;
      body.onclick = e => { const b = e.target.closest('[data-t]'); if (b) paso2(b.dataset.t); };
    }
    function paso2(tipo) {
      body.onclick = null;
      const fields = regFields(tipo, pre);
      api.setTitle(E.TIPOS_REG[tipo].nombre);
      body.innerHTML = `<button type="button" class="link" data-back>${ic('back', 's')} Cambiar tipo</button>` + formHTML(fields, {});
      bindForm(body, fields);
      $('[data-back]', body).onclick = paso1;
      api.setDone('Guardar', () => {
        const v = readForm(body, fields);
        for (const f of fields) {
          if (!f.req) continue;
          const r = $(`[data-key="${f.key}"]`, body);
          if (r && r.classList.contains('hidden')) continue;
          const val = v[f.key];
          if (val === '' || val == null || (Array.isArray(val) && !val.length)) { toast('Falta: ' + f.label); return false; }
        }
        const msg = guardarRegistro(tipo, v);
        E.save(); render(); toast(msg);
        return true;
      });
    }
    if (!S().caballos.length) {
      body.innerHTML = vacio('horse', 'Primero, un caballo', 'Crea un caballo para poder registrar cosas.', '<button class="btn dark" data-nc>Crear caballo</button>');
      $('[data-nc]', body).onclick = () => { api.close(true); caballoForm(); };
      return;
    }
    if (pre.tipo) paso2(pre.tipo); else paso1();
  }
  function editarRegistro(r) {
    const fields = {
      veterinario: [{ key: 'fecha', label: 'Fecha', type: 'date', req: true }, { key: 'caballoId', label: 'Caballo', type: 'select', options: opt(S().caballos) }, { key: 'concepto', label: 'Concepto', req: true }, { key: 'nota', label: 'Nota', type: 'textarea' }, { key: 'enlace', label: 'Enlace', type: 'url' }],
      herrador: [{ key: 'fecha', label: 'Fecha', type: 'date', req: true }, { key: 'caballoId', label: 'Caballo', type: 'select', options: opt(S().caballos) }, { key: 'subtipo', label: 'Tipo', type: 'segment', options: ['Herraje', 'Recorte', 'Revisión'].map(x => ({ v: x, l: x })) }, { key: 'nota', label: 'Nota', type: 'textarea' }],
      recordatorio: [{ key: 'fecha', label: 'Fecha', type: 'date', req: true }, { key: 'caballoId', label: 'Caballo', type: 'select', options: opt(S().caballos) }, { key: 'concepto', label: 'Concepto', req: true }, { key: 'responsableId', label: 'Responsable', type: 'select', options: opt(E.personasVisibles(), 'Sin responsable') }, { key: 'hecho', label: 'Hecho', type: 'toggle' }, { key: 'nota', label: 'Nota' }],
      nota: [{ key: 'fecha', label: 'Fecha', type: 'date', req: true }, { key: 'caballoId', label: 'Caballo', type: 'select', options: opt(S().caballos) }, { key: 'nota', label: 'Nota', type: 'textarea', req: true }, { key: 'visibilidad', label: 'Visibilidad', type: 'segment', options: [{ v: 'todos', l: 'Visible para todos' }, { v: 'yo', l: 'Solo yo' }] }],
      documento: [{ key: 'caballoId', label: 'Caballo', type: 'select', options: opt(S().caballos) }, { key: 'concepto', label: 'Título', req: true }, { key: 'enlace', label: 'Enlace', type: 'url' }, { key: 'fecha', label: 'Fecha', type: 'date' }, { key: 'nota', label: 'Nota' }]
    }[r.tipo];
    const intro = r.enlace ? `<a class="btn block" style="margin:8px 0" href="${esc(r.enlace)}" target="_blank" rel="noopener">${ic('link', 's')} Abrir enlace</a>` : '';
    openForm({
      title: E.TIPOS_REG[r.tipo].nombre, fields, values: r, intro,
      onSave: v => { Object.assign(r, v); if (r.tipo === 'herrador') r.concepto = r.subtipo; toast('Guardado'); },
      onDelete: () => { if (!confirm('¿Eliminar este registro?')) return false; S().registros = S().registros.filter(x => x.id !== r.id); toast('Eliminado'); }
    });
  }
  const REG_IC = { veterinario: 'vet', herrador: 'hammer', recordatorio: 'bell', nota: 'note', documento: 'doc' };
  function regRow(r, conCaballo = true) {
    const bits = [fdate(r.fecha)];
    if (conCaballo) bits.push(esc(cName(r.caballoId)));
    if (r.tipo === 'recordatorio' && r.responsableId) bits.push(esc(pName(r.responsableId)));
    if (r.nota && r.tipo !== 'nota') bits.push(esc(r.nota.slice(0, 40)));
    let end = ic('chev', 's');
    if (r.tipo === 'recordatorio') end = r.hecho ? '<span class="chip ok">Hecho</span>' : (r.fecha < F.today() ? '<span class="chip danger">Vencido</span>' : `<span class="chip">${fdate(r.fecha)}</span>`);
    const txt = r.tipo === 'nota' ? esc(r.nota) : esc(r.concepto || E.TIPOS_REG[r.tipo].nombre);
    return row({ icon: REG_IC[r.tipo], t: txt, s: bits.join(' · '), end, data: `data-reg="${r.id}"` });
  }
  function bindRegs(root) {
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-reg]');
      if (b) editarRegistro(E.get.registro(b.dataset.reg));
    });
  }

  /* ================= Formularios de entidades ================= */
  function caballoForm(c) {
    const nuevo = !c;
    c = c || { id: E.uid('c'), nombre: '', foto: '', propietario: '', responsableId: '', estado: 'Activo', notas: '', visible: true };
    openForm({
      title: nuevo ? 'Nuevo caballo' : 'Editar caballo', values: c,
      fields: [
        { key: 'foto', label: 'Foto', type: 'photo' },
        { key: 'nombre', label: 'Nombre', req: true },
        { key: 'estado', label: 'Estado', type: 'segment', options: E.ESTADOS.map(x => ({ v: x, l: x })) },
        { key: 'responsableId', label: 'Responsable / jinete', type: 'select', options: opt(S().personas, 'Sin responsable') },
        { key: 'propietario', label: 'Propietario', ph: 'Opcional' },
        { key: 'notas', label: 'Notas', type: 'textarea' },
        { key: 'visible', label: 'Mostrar en la pizarra', type: 'toggle' }
      ],
      onSave: v => { Object.assign(c, v); if (nuevo) S().caballos.push(c); toast(nuevo ? 'Caballo creado' : 'Guardado'); },
      onDelete: nuevo ? null : () => {
        if (!confirm('¿Eliminar ' + c.nombre + ' con sus registros y su pizarra?')) return false;
        S().caballos = S().caballos.filter(x => x.id !== c.id);
        S().registros = S().registros.filter(r => r.caballoId !== c.id);
        S().celdas = S().celdas.filter(z => z.caballoId !== c.id);
        if (location.hash.startsWith('#/caballo/')) location.hash = '#/caballos';
      }
    });
  }
  function personaForm(p) {
    const nueva = !p;
    p = p || { id: E.uid('per'), nombre: '', codigo: '', color: PALETA[1], rol: '', visible: true };
    openForm({
      title: nueva ? 'Nueva persona' : 'Editar persona', values: p,
      fields: [
        { key: 'nombre', label: 'Nombre', req: true, ph: 'Jinete 1, Ayudante 1…' },
        { key: 'codigo', label: 'Inicial o código', ph: 'J', hint: 'Es lo que se ve en la casilla de la pizarra.' },
        { key: 'color', label: 'Color', type: 'color' },
        { key: 'rol', label: 'Rol', ph: 'Opcional: jinete, ayudante…' },
        { key: 'visible', label: 'Mostrar en la pizarra', type: 'toggle' }
      ],
      onSave: v => { Object.assign(p, v); p.codigo = (p.codigo || p.nombre.charAt(0)).toUpperCase().slice(0, 4); if (nueva) S().personas.push(p); toast('Guardado'); },
      onDelete: nueva ? null : () => {
        if (!confirm('¿Eliminar a ' + p.nombre + '?')) return false;
        S().personas = S().personas.filter(x => x.id !== p.id);
        S().celdas.forEach(z => { z.codigos = z.codigos.filter(k => k !== p.id); z.hechos = (z.hechos || []).filter(k => k !== p.id); E.limpiarCelda(z); });
        S().caballos.forEach(c => { if (c.responsableId === p.id) c.responsableId = ''; });
      }
    });
  }
  function actForm(a) {
    const nueva = !a;
    a = a || { id: E.uid('a'), codigo: '', nombre: '', color: PALETA[0], visible: true };
    openForm({
      title: nueva ? 'Nueva actividad' : 'Editar actividad', values: a,
      fields: [
        { key: 'codigo', label: 'Código corto', req: true, ph: 'P, C, VET…', hint: 'Máximo 4 caracteres.' },
        { key: 'nombre', label: 'Nombre', req: true, ph: 'Paddock' },
        { key: 'color', label: 'Color', type: 'color' },
        { key: 'visible', label: 'Mostrar en la pizarra', type: 'toggle' }
      ],
      onSave: v => { Object.assign(a, v, { codigo: v.codigo.slice(0, 4) }); if (nueva) S().actividades.push(a); toast('Guardado'); },
      onDelete: nueva ? null : () => {
        if (!confirm('¿Eliminar la actividad? Se quitará de las casillas.')) return false;
        S().actividades = S().actividades.filter(x => x.id !== a.id);
        S().celdas.forEach(z => { z.codigos = z.codigos.filter(k => k !== a.id); E.limpiarCelda(z); });
      }
    });
  }
  function perfilForm() {
    const p = S().perfil;
    openForm({
      title: 'Mi perfil', values: p,
      fields: [
        { key: 'foto', label: 'Foto', type: 'photo' },
        { key: 'nombre', label: 'Nombre', req: true },
        { key: 'codigo', label: 'Inicial', ph: 'J' },
        { key: 'color', label: 'Color', type: 'color' },
        { key: 'rol', label: 'Rol', type: 'segment', options: [{ v: 'Jinete', l: 'Jinete' }, { v: 'Responsable', l: 'Responsable' }] },
        { key: 'vistaInicial', label: 'Vista inicial', type: 'segment', options: [{ v: 'inicio', l: 'Inicio' }, { v: 'pizarra', l: 'Pizarra' }, { v: 'caballos', l: 'Caballos' }] }
      ],
      onSave: v => { Object.assign(p, v); toast('Perfil guardado'); }
    });
  }

  /* ================= Vistas ================= */
  const vistas = {};
  function cabecera({ eyebrow = 'EquiLog', titulo, acciones = '', guardado = false }) {
    return `<header class="top"><div class="brand">
      <span class="mark">E</span>
      <span><span class="eyebrow">${esc(eyebrow)}</span><h1 class="title">${esc(titulo)}</h1></span>
      </div><div class="top-actions">${guardado ? `<span class="saved" id="saved"><i></i>Guardado</span>` : ''}${acciones}</div></header>`;
  }

  /* ================= Pizarra ================= */
  let semana = F.weekStart(F.today());
  let tool = null;            // {t:'code', id} | {t:'note'|'done'|'copy'|'erase'}
  let copia = null;           // {caballoId, fecha}
  let copiaMsg = '';
  const botonDe = id => E.get.boton(id) || { id, codigo: id, nombre: id, color: '#6B655B' };
  const codigosTexto = cel => (cel ? cel.codigos : []).map(id => (botonDe(id).codigo || '').toUpperCase());

  function cellHTML(cel) {
    if (!cel || (!cel.codigos.length && !cel.nota)) return '<span class="empty-dot" aria-hidden="true">·</span>';
    const codes = cel.codigos.map((id, i) => {
      const b = botonDe(id);
      const hecho = (cel.hechos || []).includes(id);
      const vet = E.esVet(b) ? `<em class="vet-indicator ${cel.vet ? 'complete' : ''}">${cel.vet ? '✓' : '?'}</em>` : '';
      return `<span class="cell-code ${hecho ? 'is-done' : ''}" style="--c:${b.color}">${i ? '<b>+</b>' : ''}${hecho ? '<i>✓</i>' : ''}<span class="txt">${esc(b.codigo)}</span>${vet}</span>`;
    }).join('');
    return `${cel.codigos.length ? `<span class="cell-codes">${codes}</span>` : ''}${cel.nota ? `<span class="cell-note">${esc(cel.nota)}</span>` : ''}`;
  }
  function cellLabel(c, cel, fecha, i) {
    const p = [c.nombre + ',', DIAS[i] + ' ' + F.parse(fecha).getDate() + ':'];
    p.push(cel && cel.codigos.length ? cel.codigos.map(id => botonDe(id).nombre).join(' más ') : 'sin instrucciones');
    if (cel && cel.codigos.some(id => E.esVet(botonDe(id)))) p.push(cel.vet ? 'Veterinario: ' + cel.vet : 'veterinario pendiente de explicar');
    if (cel && (cel.hechos || []).length) p.push(cel.hechos.length + ' realizadas');
    if (cel && cel.nota) p.push('Nota: ' + cel.nota);
    return p.join(' ');
  }
  function hintInfo() {
    if (!tool) return { badge: '✎', txt: 'Toca una casilla para abrir su editor, o elige un botón de arriba' };
    if (tool.t === 'note') return { badge: '✎', txt: 'Toca una casilla para escribir o editar una nota' };
    if (tool.t === 'done') return { badge: '✓', txt: 'Toca una casilla para marcar sus tareas realizadas' };
    if (tool.t === 'erase') return { badge: '⌫', txt: 'Toca una casilla para borrar sus códigos y su nota' };
    if (tool.t === 'copy') return { badge: '⧉', txt: copiaMsg || (copia ? 'Toca casillas, días o nombres de caballos para pegar' : 'Elige la casilla que quieres copiar'), clear: !!copia };
    const b = botonDe(tool.id);
    return { badge: b.codigo, txt: `Toca casillas para añadir o quitar ${b.nombre}`, color: b.color };
  }
  function elegirTool(t, id) {
    const igual = tool && tool.t === t && tool.id === id;
    tool = igual ? null : { t, id };
    copia = null;
    copiaMsg = t === 'copy' && !igual ? 'Elige la casilla que quieres copiar.' : '';
    render();
  }
  function pegarEn(destinos) {
    if (!copia) return;
    const o = E.get.celda(copia.caballoId, copia.fecha);
    if (!o) { copia = null; return; }
    let n = 0;
    destinos.forEach(d => {
      if (d.caballoId === copia.caballoId && d.fecha === copia.fecha) return;
      E.vaciarCelda(d.caballoId, d.fecha);
      E.upsertCelda(d.caballoId, d.fecha, { codigos: o.codigos.slice(), hechos: [], nota: o.nota, vet: '' });
      n++;
    });
    copiaMsg = n === 1 ? 'Casilla copiada · las tareas quedan pendientes' : `${n} casillas copiadas · las tareas quedan pendientes`;
    E.save(); render();
  }
  function tocarCelda(hid, fecha) {
    const cel = E.get.celda(hid, fecha);
    if (!tool) { celdaSheet(hid, fecha); return; }
    if (tool.t === 'note') { notaSheet(hid, fecha); return; }
    if (tool.t === 'done') {
      if (cel && cel.codigos.length) tareasSheet(hid, fecha);
      else toast('Esa casilla no tiene tareas');
      return;
    }
    if (tool.t === 'erase') { E.vaciarCelda(hid, fecha); E.save(); render(); return; }
    if (tool.t === 'copy') {
      if (!copia) {
        if (!cel) { copiaMsg = 'Esa casilla está vacía. Elige una con planificación.'; render(); return; }
        copia = { caballoId: hid, fecha };
        copiaMsg = 'Origen elegido. Toca casillas, días o caballos para pegarlo.';
        render(); return;
      }
      if (copia.caballoId === hid && copia.fecha === fecha) { copia = null; copiaMsg = 'Origen desmarcado. Elige otra casilla.'; render(); return; }
      pegarEn([{ caballoId: hid, fecha }]); return;
    }
    const b = botonDe(tool.id);
    if (E.esVet(b) && cel && cel.codigos.includes(tool.id)) { vetSheet(hid, fecha); return; }
    E.toggleCodigo(hid, fecha, tool.id);
    E.save(); render();
  }
  const tituloCelda = (hid, fecha) => `${(E.get.caballo(hid) || {}).nombre} · ${fdate(fecha)}`;
  function notaSheet(hid, fecha) {
    const cel = E.get.celda(hid, fecha) || { nota: '' };
    openForm({
      title: tituloCelda(hid, fecha), doneLabel: 'Guardar nota',
      fields: [{ key: 'nota', label: 'Nota puntual', type: 'textarea', ph: 'Ej.: no montar, pequeña herida en la mano…' }],
      values: cel,
      onSave: v => { E.upsertCelda(hid, fecha, { nota: v.nota.slice(0, 240) }); },
      onDelete: cel.nota ? () => { E.upsertCelda(hid, fecha, { nota: '' }); toast('Nota vaciada'); } : null,
      deleteLabel: 'Vaciar nota'
    });
  }
  function tareasSheet(hid, fecha) {
    const body = document.createElement('div');
    function draw() {
      const cel = E.get.celda(hid, fecha) || { codigos: [], hechos: [] };
      body.innerHTML = `<p class="small muted" style="margin:6px 4px 12px">Toca cada instrucción para marcarla o desmarcarla. Se guarda al instante.</p>
        <div class="task-list">${cel.codigos.map(id => {
          const b = botonDe(id), ok = (cel.hechos || []).includes(id);
          return `<button type="button" class="${ok ? 'checked' : ''}" data-code="${id}" aria-pressed="${ok}" style="--c:${b.color}"><strong>${ok ? '✓' : esc(b.codigo)}</strong><span>${esc(b.nombre)}</span><em>${ok ? 'Hecho' : 'Pendiente'}</em></button>`;
        }).join('')}</div>`;
    }
    body.addEventListener('click', e => {
      const b = e.target.closest('[data-code]'); if (!b) return;
      const cel = E.get.celda(hid, fecha); if (!cel) return;
      const id = b.dataset.code;
      cel.hechos = (cel.hechos || []).includes(id) ? cel.hechos.filter(x => x !== id) : (cel.hechos || []).concat([id]);
      E.save(); draw(); render();
    });
    sheet({ title: tituloCelda(hid, fecha), body, cancelLabel: 'Cerrar' });
    draw();
  }
  function vetSheet(hid, fecha) {
    const cel = E.get.celda(hid, fecha) || { vet: '' };
    openForm({
      title: 'Veterinario · ' + tituloCelda(hid, fecha), doneLabel: 'Guardar',
      fields: [
        { key: 'vet', label: '¿Qué ha pasado?', type: 'textarea', req: true, ph: 'Ej.: ha venido por inflamación en la mano izquierda…' },
        { key: 'guardarReg', label: 'Guardar también en el historial del caballo', type: 'toggle', def: true }
      ],
      values: cel,
      onSave: v => {
        const c = E.upsertCelda(hid, fecha, { vet: v.vet.slice(0, 700) });
        if (v.guardarReg) {
          const r = c.vetRegId && E.get.registro(c.vetRegId);
          if (r) { r.nota = c.vet; r.fecha = fecha; }
          else {
            const nuevo = { id: E.uid('r'), tipo: 'veterinario', fecha, caballoId: hid, concepto: 'Veterinario', nota: c.vet, enlace: '' };
            S().registros.push(nuevo);
            c.vetRegId = nuevo.id;
          }
        }
        toast('Detalle guardado');
      }
    });
  }
  function celdaSheet(hid, fecha) {
    const cel = E.get.celda(hid, fecha) || { codigos: [], hechos: [], nota: '', vet: '' };
    const todo = cel.codigos.length && cel.codigos.every(id => (cel.hechos || []).includes(id));
    openForm({
      title: tituloCelda(hid, fecha),
      fields: [
        { key: 'codigos', label: 'Personas y actividades', type: 'botones' },
        { key: 'nota', label: 'Nota', ph: 'Opcional' },
        { key: 'hecho', label: 'Todo hecho', type: 'toggle', def: todo }
      ],
      values: Object.assign({}, cel, { hecho: todo }),
      onSave: v => {
        const orden = E.ordenBotones();
        const codigos = v.codigos.slice().sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
        E.upsertCelda(hid, fecha, { codigos, nota: v.nota, hechos: v.hecho ? codigos.slice() : (cel.hechos || []).filter(k => codigos.includes(k)) });
      },
      onDelete: cel.id ? () => { E.vaciarCelda(hid, fecha); toast('Casilla vacía'); } : null,
      deleteLabel: 'Vaciar casilla'
    });
  }
  function botonesSheet() {
    const body = document.createElement('div');
    let filas = E.state.personas.map(p => ({ ...p, grupo: 'persona' })).concat(E.state.actividades.map(a => ({ ...a, grupo: 'actividad' })));
    function leer() {
      return $$('.tool-editor-row', body).map((r, i) => {
        const [cod, nom] = $$('input[type=text]', r);
        return Object.assign({}, filas[i], {
          codigo: cod.value.trim().toUpperCase().slice(0, 4),
          nombre: nom.value.trim(),
          grupo: $('select', r).value,
          color: $('input[type=color]', r).value
        });
      });
    }
    function draw() {
      body.innerHTML = `<p class="small muted" style="margin:6px 4px 12px">El código es lo que se ve en la casilla. El nombre identifica el botón en la barra.</p>
        ${filas.map((f, i) => `<div class="tool-editor-row" data-i="${i}">
          <input type="text" class="code-input" maxlength="4" value="${esc(f.codigo || '')}" aria-label="Código">
          <input type="text" value="${esc(f.nombre || '')}" aria-label="Nombre" placeholder="Nombre">
          <select aria-label="Grupo"><option value="persona" ${f.grupo === 'persona' ? 'selected' : ''}>Persona</option><option value="actividad" ${f.grupo === 'actividad' ? 'selected' : ''}>Actividad</option></select>
          <input type="color" class="swatch-mini" value="${esc(f.color || '#275F51')}" aria-label="Color">
          <button type="button" class="delete-tool" data-del="${i}" aria-label="Eliminar ${esc(f.nombre || f.codigo || '')}">×</button>
        </div>`).join('')}
        <button type="button" class="add-tool" data-add>＋ Añadir botón</button>`;
    }
    body.addEventListener('click', e => {
      const del = e.target.closest('[data-del]');
      if (del) { filas = leer(); filas.splice(+del.dataset.del, 1); draw(); }
      if (e.target.closest('[data-add]')) { filas = leer().concat([{ codigo: '', nombre: '', grupo: 'actividad', color: '#275F51', visible: true }]); draw(); }
    });
    sheet({
      title: 'Editar botones', body, doneLabel: 'Guardar botones',
      done: () => {
        const v = leer();
        if (v.some(f => !f.codigo || !f.nombre)) { toast('Cada botón necesita código y nombre'); return false; }
        if (new Set(v.map(f => f.codigo)).size !== v.length) { toast('Usa códigos distintos'); return false; }
        const usados = new Set(v.map(f => f.id).filter(Boolean));
        S().personas = v.filter(f => f.grupo === 'persona').map(f => ({ id: f.id || E.uid('per'), codigo: f.codigo, nombre: f.nombre, color: f.color, rol: f.rol || '', visible: f.visible !== false }));
        S().actividades = v.filter(f => f.grupo === 'actividad').map(f => ({ id: f.id || E.uid('a'), codigo: f.codigo, nombre: f.nombre, color: f.color, visible: f.visible !== false }));
        S().celdas.forEach(z => {
          z.codigos = z.codigos.filter(id => usados.has(id));
          z.hechos = (z.hechos || []).filter(id => usados.has(id));
          E.limpiarCelda(z);
        });
        S().caballos.forEach(h => { if (h.responsableId && !usados.has(h.responsableId)) h.responsableId = ''; });
        if (tool && tool.t === 'code' && !usados.has(tool.id)) tool = null;
        E.save(); render(); toast('Botones guardados');
        return true;
      }
    });
    draw();
  }
  function repetirSemana() {
    const ant = F.addWeeks(semana, -1);
    const ids = E.caballosPizarra().map(c => c.id);
    const origen = S().celdas.filter(z => ids.includes(z.caballoId) && z.fecha >= ant && z.fecha < semana);
    if (!origen.length) { copiaMsg = 'La semana anterior no tiene planificación para copiar.'; render(); return; }
    let n = 0;
    origen.forEach(z => {
      const f = F.addWeeks(z.fecha, 1);
      if (E.get.celda(z.caballoId, f)) return;
      E.upsertCelda(z.caballoId, f, { codigos: z.codigos.slice(), hechos: [], nota: z.nota, vet: '' });
      n++;
    });
    E.save(); render();
    toast(n ? `${n} casillas traídas de la semana anterior` : 'No había casillas libres');
  }

  vistas.pizarra = function () {
    const t = F.today();
    const dias = [...Array(7)].map((_, i) => F.addDays(semana, i));
    const caballos = E.caballosPizarra();
    const personas = E.personasVisibles();
    const acts = E.actividadesVisibles();
    const h = hintInfo();
    const fin = dias[6];
    const mes = m => limpia(MS.format(F.parse(m)));
    const rango = F.parse(semana).getMonth() === F.parse(fin).getMonth()
      ? `${F.parse(semana).getDate()}–${F.parse(fin).getDate()} ${mes(fin)} ${F.parse(fin).getFullYear()}`
      : `${F.parse(semana).getDate()} ${mes(semana)} – ${F.parse(fin).getDate()} ${mes(fin)} ${F.parse(fin).getFullYear()}`;
    const pegando = tool && tool.t === 'copy' && copia;
    const btn = b => {
      const sel = tool && tool.t === 'code' && tool.id === b.id;
      return `<button type="button" class="tool ${sel ? 'selected' : ''}" style="--c:${b.color}" data-code="${b.id}" aria-pressed="${!!sel}"><strong>${esc(b.codigo)}</strong><span>${esc(b.nombre)}</span></button>`;
    };
    const herr = (k, simbolo, etiqueta) => `<button type="button" class="tool plain ${tool && tool.t === k ? 'selected' : ''}" data-tool="${k}" aria-pressed="${!!(tool && tool.t === k)}"><strong>${simbolo}</strong><span>${etiqueta}</span></button>`;
    return `<div class="wrap">
      ${cabecera({ titulo: 'Pizarra semanal', guardado: true, acciones: `<button class="btn" data-nuevo-registro>${ic('plus', 's')} Registro</button><button class="btn dark" data-nuevo-caballo>${ic('plus', 's')} Caballos</button>` })}
      <section class="toolbar" aria-label="Botones de la pizarra">
        <div class="tool-group"><p>Personas</p><div class="tool-row">
          ${personas.map(btn).join('')}
          <button type="button" class="tool plain" data-nueva-persona aria-label="Nueva persona"><strong>＋</strong><span>Persona</span></button>
        </div></div>
        <div class="tool-group activities"><p>Actividades</p><div class="tool-row">
          ${acts.map(btn).join('')}
          ${herr('note', '✎', 'Nota')}${herr('done', '✓', 'Hecho')}${herr('copy', '⧉', 'Copiar')}${herr('erase', '⌫', 'Borrar')}
          <button type="button" class="tool plain" data-editar-botones aria-label="Editar botones"><strong>⚙</strong><span>Editar botones</span></button>
        </div></div>
      </section>
      <nav class="week-nav" aria-label="Navegación semanal">
        <button data-w="-1" aria-label="Semana anterior">← <span class="lbl">Anterior</span></button>
        <button class="today-button" data-w="0" aria-label="Semana de hoy">◎ <span class="lbl">Hoy</span></button>
        <button data-w="1" aria-label="Semana siguiente"><span class="lbl">Siguiente</span> →</button>
        <button class="repeat-week" data-repetir aria-label="Repetir semana anterior">↻ <span class="lbl">Repetir anterior</span></button>
        <p>${esc(rango)}</p>
      </nav>
      ${caballos.length ? `<section class="board-card" aria-label="Planificación del ${esc(rango)}">
        <div class="board-grid board-head">
          <div class="horse-heading">Caballo</div>
          ${dias.map((d, i) => `<button class="day-heading ${d === t ? 'is-today' : ''} ${pegando ? 'copy-target' : ''}" ${pegando ? `data-dia="${d}"` : 'disabled'} aria-label="${pegando ? 'Copiar en todo el ' + DIAS[i] : DIAS[i] + ' ' + F.parse(d).getDate()}"><span>${DIAS[i].toUpperCase()}</span><strong>${F.parse(d).getDate()}</strong>${d === t ? '<em>HOY</em>' : ''}</button>`).join('')}
        </div>
        ${caballos.map(c => `<div class="board-grid board-row">
          <button type="button" class="horse-name ${pegando ? 'copy-target' : ''}" data-caballo="${c.id}" aria-label="${pegando ? 'Copiar en toda la semana de ' + esc(c.nombre) : 'Abrir ficha de ' + esc(c.nombre)}"><span>${esc(c.nombre)}</span><em>${pegando ? '⧉' : '✎'}</em></button>
          ${dias.map((d, i) => {
            const cel = E.get.celda(c.id, d);
            const todo = cel && cel.codigos.length && cel.codigos.every(id => (cel.hechos || []).includes(id));
            const src = copia && copia.caballoId === c.id && copia.fecha === d;
            const cls = [d === t ? 'is-today' : '', cel && cel.codigos.length ? 'has-codes' : '', todo ? 'all-done' : '', cel && cel.nota ? 'has-note' : '', src ? 'copy-source' : ''].filter(Boolean).join(' ');
            return `<button type="button" class="cell ${cls}" data-c="${c.id}" data-d="${d}" aria-label="${esc(cellLabel(c, cel, d, i))}">${cellHTML(cel)}</button>`;
          }).join('')}
        </div>`).join('')}
      </section>
      <footer class="hint"><span class="selected-code" ${h.color ? `style="background:${h.color}"` : ''}>${esc(h.badge)}</span><p>${esc(h.txt)}</p>${h.clear ? '<button type="button" class="clear-copy" data-clear-copy>Cambiar origen</button>' : ''}</footer>`
      : vacio('horse', 'Sin caballos todavía', 'Crea el primero y aparecerá aquí.', '<button class="btn dark" data-nuevo-caballo>Crear caballo</button>')}
    </div>`;
  };
  vistas.pizarra.after = function (root) {
    root.addEventListener('click', e => {
      const code = e.target.closest('[data-code]'), herr = e.target.closest('[data-tool]');
      const cell = e.target.closest('[data-c][data-d]'), cab = e.target.closest('[data-caballo]');
      const dia = e.target.closest('[data-dia]'), w = e.target.closest('[data-w]');
      if (code) elegirTool('code', code.dataset.code);
      else if (herr) elegirTool(herr.dataset.tool);
      else if (cell) tocarCelda(cell.dataset.c, cell.dataset.d);
      else if (dia) pegarEn(E.caballosPizarra().map(c => ({ caballoId: c.id, fecha: dia.dataset.dia })));
      else if (cab) {
        if (tool && tool.t === 'copy' && copia) pegarEn([...Array(7)].map((_, i) => ({ caballoId: cab.dataset.caballo, fecha: F.addDays(semana, i) })));
        else location.hash = '#/caballo/' + cab.dataset.caballo;
      }
      else if (w) { const n = +w.dataset.w; semana = n === 0 ? F.weekStart(F.today()) : F.addWeeks(semana, n); copia = null; render(); }
      else if (e.target.closest('[data-repetir]')) repetirSemana();
      else if (e.target.closest('[data-editar-botones]')) botonesSheet();
      else if (e.target.closest('[data-nueva-persona]')) personaForm();
      else if (e.target.closest('[data-clear-copy]')) { copia = null; copiaMsg = 'Elige otra casilla de origen.'; render(); }
    });
  };

  /* ---------- Inicio ---------- */
  function hoyImporta() {
    const t = F.today(), it = [];
    const cabs = E.caballosPizarra();
    const celdasHoy = S().celdas.filter(z => z.fecha === t);
    E.recordatorios(true).filter(r => r.fecha <= t).forEach(r => it.push({ i: 'bell', tone: 'danger', t: esc(r.concepto), s: `${esc(cName(r.caballoId))} · ${r.fecha < t ? 'vencido ' : ''}${fdate(r.fecha)}`, reg: r.id }));
    celdasHoy.forEach(z => {
      const cods = codigosTexto(z);
      if (!cods.includes('VET') && !cods.includes('H')) return;
      const esV = cods.includes('VET');
      it.push({ i: esV ? 'vet' : 'hammer', tone: 'warn', t: `${esc(cName(z.caballoId))}: ${esV ? 'veterinario' : 'herrador'} hoy`, s: esc(z.vet || z.nota || 'Anotado en la pizarra'), hash: '#/caballo/' + z.caballoId });
    });
    E.recordatorios(true).filter(r => r.fecha > t && r.fecha <= F.addDays(t, 7)).forEach(r => it.push({ i: 'bell', tone: 'warn', t: esc(r.concepto), s: `${esc(cName(r.caballoId))} · ${fdate(r.fecha)}`, reg: r.id }));
    const sin = cabs.filter(c => !celdasHoy.some(z => z.caballoId === c.id && (z.codigos.length || z.nota)));
    if (sin.length && cabs.length) it.push({ i: 'grid', tone: '', t: sin.length === 1 ? `${esc(sin[0].nombre)} sin plan hoy` : `${sin.length} caballos sin plan hoy`, s: 'Pizarra sin completar', hash: '#/pizarra' });
    S().registros.filter(r => r.tipo === 'nota' && F.diffDays(r.fecha, t) <= 2 && r.fecha <= t).forEach(r => it.push({ i: 'note', tone: '', t: esc(r.nota.slice(0, 70)), s: `${esc(cName(r.caballoId))} · ${fdate(r.fecha)}`, reg: r.id }));
    return it.slice(0, 6);
  }
  vistas.inicio = function () {
    const t = F.today();
    const p = S().perfil;
    const items = hoyImporta();
    const cabs = E.caballosPizarra();
    const prox = E.recordatorios(true).slice(0, 4);
    return `<div class="wrap">
      ${cabecera({ eyebrow: cap(limpia(DF.format(F.parse(t)))), titulo: 'Hola, ' + (p.nombre || 'jinete'), acciones: `<button class="btn dark" data-nuevo-registro>${ic('plus', 's')} Registro</button>` })}
      <div class="quick">
        <a class="qbtn" href="#/pizarra">${ic('grid', 'l')}<span>Pizarra<br><span class="small muted">Semana en curso</span></span></a>
        <button class="qbtn" type="button" data-nuevo-registro>${ic('plus', 'l')}<span>Registro rápido<br><span class="small muted">Pizarra, vet, herrador…</span></span></button>
        <a class="qbtn" href="#/caballos">${ic('horse', 'l')}<span>Caballos<br><span class="small muted">${cabs.length} en la pizarra</span></span></a>
        <a class="qbtn" href="#/config/caballos">${ic('gear', 'l')}<span>Configuración<br><span class="small muted">Caballos y botones</span></span></a>
      </div>
      ${sec('Hoy importa')}
      ${items.length ? `<div class="list today-list">${items.map(x => row({ href: x.hash, lead: `<span class="tile ${x.tone}">${ic(x.i)}</span>`, t: x.t, s: x.s, data: x.reg ? `data-reg="${x.reg}"` : '' })).join('')}</div>`
        : `<div class="card pad" style="display:flex;gap:12px;align-items:center"><span class="tile" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:var(--green-soft);color:var(--green)">${ic('check')}</span><span>Todo en orden por hoy.</span></div>`}
      ${sec('La pizarra de hoy', '<a class="link" href="#/pizarra">Ver semana</a>')}
      ${cabs.length ? `<div class="list">${cabs.map(c => {
        const z = E.get.celda(c.id, t);
        const codes = z && z.codigos.length ? z.codigos.map(id => { const b = botonDe(id); return `<span style="color:${b.color};font-weight:800">${esc(b.codigo)}</span>`; }).join(' + ') : '<span class="muted">Sin actividad</span>';
        const todo = z && z.codigos.length && z.codigos.every(id => (z.hechos || []).includes(id));
        return row({ lead: hthumb(c), t: esc(c.nombre), s: codes + (z && z.nota ? ' · ' + esc(z.nota) : ''), end: todo ? `<span class="chip ok">${ic('check', 's')} Hecho</span>` : '', data: `data-celda="${c.id}"` });
      }).join('')}</div>` : vacio('horse', 'Sin caballos', 'Crea el primero desde Caballos.')}
      ${sec('Próximos recordatorios', '<a class="link" href="#/registros">Ver todos</a>')}
      ${prox.length ? `<div class="list">${prox.map(r => regRow(r)).join('')}</div>` : `<div class="card pad muted">Ningún recordatorio pendiente.</div>`}
    </div>`;
  };
  vistas.inicio.after = function (root) {
    bindRegs(root);
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-celda]');
      if (b) celdaSheet(b.dataset.celda, F.today());
    });
  };

  /* ---------- Caballos ---------- */
  vistas.caballos = function () {
    const t = F.today();
    return `<div class="wrap">
      ${cabecera({ titulo: 'Caballos', acciones: `<button class="btn dark" data-nuevo-caballo>${ic('plus', 's')} Caballo</button>` })}
      ${S().caballos.length ? `<div class="list">${S().caballos.map(c => {
        const r = E.recordatorios(true).find(x => x.caballoId === c.id);
        const resp = E.get.persona(c.responsableId);
        return row({
          href: '#/caballo/' + c.id, lead: hthumb(c), t: esc(c.nombre),
          s: [c.estado, resp ? 'Resp. ' + esc(resp.nombre) : '', c.visible === false ? 'Oculto en pizarra' : ''].filter(Boolean).join(' · '),
          end: r ? `<span class="chip ${r.fecha <= t ? 'warn' : ''}">${ic('bell', 's')} ${fdate(r.fecha)}</span>` : ic('chev', 's')
        });
      }).join('')}</div>` : vacio('horse', 'Sin caballos', 'Crea tu primer caballo.', '<button class="btn dark" data-nuevo-caballo>Crear caballo</button>')}
    </div>`;
  };

  vistas.caballo = function (id) {
    const c = E.get.caballo(id);
    if (!c) return `<div class="wrap">${cabecera({ titulo: 'Caballo' })}${vacio('horse', 'No encontrado', '')}</div>`;
    const regs = E.registrosDe(c.id);
    const recs = regs.filter(r => r.tipo === 'recordatorio' && !r.hecho).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const salud = regs.filter(r => r.tipo === 'veterinario' || r.tipo === 'herrador').slice(0, 4);
    const notas = regs.filter(r => r.tipo === 'nota').slice(0, 3);
    const docs = regs.filter(r => r.tipo === 'documento');
    const resp = E.get.persona(c.responsableId);
    const dias = [...Array(7)].map((_, i) => F.addDays(F.weekStart(F.today()), i));
    return `<div class="wrap">
      <header class="top"><button class="icon-btn" data-atras aria-label="Volver">${ic('back')}</button><span class="spacer" style="flex:1"></span>
        <button class="btn" data-editar-caballo>${ic('edit', 's')} Editar</button></header>
      <div class="hero">${hthumb(c)}<div><h1>${esc(c.nombre)}</h1><p>${esc([c.estado, resp ? 'Resp. ' + resp.nombre : '', c.propietario ? 'Prop. ' + c.propietario : ''].filter(Boolean).join(' · '))}</p></div></div>
      <div class="btns"><button class="btn dark" data-nuevo-registro data-cab="${c.id}">${ic('plus', 's')} Registro</button>
        <button class="btn" data-recordatorio="${c.id}">${ic('bell', 's')} Recordatorio</button></div>
      ${sec('Esta semana', '<a class="link" href="#/pizarra">Pizarra</a>')}
      <div class="card" style="display:flex;overflow-x:auto">${dias.map((d, i) => {
        const z = E.get.celda(c.id, d);
        return `<button type="button" class="cell" data-celda="${c.id}" data-d="${d}" style="min-width:54px;border-right:1px solid var(--line-2)" aria-label="${esc(cellLabel(c, z, d, i))}">
          <span class="small muted">${DIAS[i]} ${F.parse(d).getDate()}</span>${cellHTML(z)}</button>`;
      }).join('')}</div>
      ${sec('Próximos recordatorios')}
      ${recs.length ? `<div class="list">${recs.map(r => regRow(r, false)).join('')}</div>` : '<div class="card pad muted">Ninguno pendiente.</div>'}
      ${sec('Veterinario y herrador', `<a class="link" href="#/registros">Ver todo</a>`)}
      ${salud.length ? `<div class="list">${salud.map(r => regRow(r, false)).join('')}</div>` : '<div class="card pad muted">Sin registros todavía.</div>'}
      ${sec('Notas')}
      ${notas.length ? `<div class="list">${notas.map(r => regRow(r, false)).join('')}</div>` : '<div class="card pad muted">Sin notas.</div>'}
      ${c.notas ? `<div class="card pad" style="margin-top:10px">${esc(c.notas)}</div>` : ''}
      ${sec('Documentos y enlaces')}
      ${docs.length ? `<div class="list">${docs.map(r => regRow(r, false)).join('')}</div>` : '<div class="card pad muted">Sin documentos.</div>'}
    </div>`;
  };
  vistas.caballo.after = function (root, id) {
    bindRegs(root);
    root.addEventListener('click', e => {
      if (e.target.closest('[data-atras]')) { history.length > 1 ? history.back() : (location.hash = '#/caballos'); }
      if (e.target.closest('[data-editar-caballo]')) caballoForm(E.get.caballo(id));
      const r = e.target.closest('[data-recordatorio]'); if (r) registroSheet({ tipo: 'recordatorio', caballoId: r.dataset.recordatorio });
      const z = e.target.closest('[data-celda][data-d]'); if (z) celdaSheet(z.dataset.celda, z.dataset.d);
    });
  };

  /* ---------- Registros ---------- */
  let filtro = { tipo: 'todos', caballo: '' };
  vistas.registros = function () {
    let regs = S().registros.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
    if (filtro.tipo !== 'todos') regs = regs.filter(r => r.tipo === filtro.tipo);
    if (filtro.caballo) regs = regs.filter(r => r.caballoId === filtro.caballo);
    const f = [['todos', 'Todos'], ['recordatorio', 'Recordatorios'], ['veterinario', 'Veterinario'], ['herrador', 'Herrador'], ['nota', 'Notas'], ['documento', 'Documentos']];
    return `<div class="wrap">
      ${cabecera({ titulo: 'Registros', acciones: `<button class="btn dark" data-nuevo-registro>${ic('plus', 's')} Registro</button>` })}
      <div class="filters">${f.map(([k, l]) => `<button type="button" class="${filtro.tipo === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
      <div class="group" style="margin-top:0"><div class="field"><label class="lab" for="fc">Caballo</label>
        <select id="fc">${[{ v: '', l: 'Todos los caballos' }].concat(opt(S().caballos)).map(o => `<option value="${o.v}" ${o.v === filtro.caballo ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select></div></div>
      ${regs.length ? `<div class="list">${regs.map(r => regRow(r)).join('')}</div>` : vacio('list', 'Sin registros', 'Prueba a quitar filtros o añade uno nuevo.')}
    </div>`;
  };
  vistas.registros.after = function (root) {
    bindRegs(root);
    root.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { filtro.tipo = b.dataset.f; render(); } });
    $('#fc', root).onchange = e => { filtro.caballo = e.target.value; render(); };
  };

  /* ---------- Más y configuración ---------- */
  vistas.mas = function () {
    const p = S().perfil;
    return `<div class="wrap">
      ${cabecera({ titulo: 'Más' })}
      <div class="list">
        ${row({ href: '#/config/caballos', icon: 'horse', t: 'Caballos', s: S().caballos.length + ' en total' })}
        ${row({ href: '#/config/personas', icon: 'users', t: 'Personas', s: S().personas.length + ' en la pizarra' })}
        ${row({ href: '#/config/actividades', icon: 'grid', t: 'Actividades y códigos', s: S().actividades.length + ' botones' })}
      </div>
      ${sec('Perfil')}
      <div class="list">${row({ lead: pav(p, 40), t: esc(p.nombre), s: `${esc(p.rol || 'Jinete')} · empieza en ${esc(p.vistaInicial)}`, data: 'data-perfil' })}</div>
      ${sec('Datos')}
      <div class="list">
        ${row({ icon: 'save', t: 'Exportar copia', s: 'Descarga un archivo con todo', data: 'data-exp' })}
        ${row({ icon: 'doc', t: 'Importar copia', s: 'Sustituye los datos actuales', data: 'data-imp' })}
        ${row({ icon: 'repeat', t: 'Restaurar datos de ejemplo', data: 'data-demo' })}
        ${row({ icon: 'trash', t: 'Borrar datos locales', s: 'Empieza de cero', data: 'data-borrar' })}
      </div>
      <input type="file" id="impf" accept="application/json" hidden>
      ${sec('Ayuda')}
      <div class="list">${row({ icon: 'help', t: 'Cómo va la pizarra', data: 'data-ayuda' })}</div>
      <p class="small muted" style="margin:16px 4px">Todo se guarda automáticamente en este navegador. Sin cuentas ni servidores.</p>
    </div>`;
  };
  vistas.mas.after = function (root) {
    root.addEventListener('click', e => {
      const t = e.target;
      if (t.closest('[data-perfil]')) perfilForm();
      if (t.closest('[data-exp]')) {
        const blob = new Blob([JSON.stringify(S(), null, 1)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'equilog-jinete-' + F.today() + '.json'; a.click();
      }
      if (t.closest('[data-imp]')) $('#impf', root).click();
      if (t.closest('[data-demo]') && confirm('¿Sustituir los datos actuales por los de ejemplo?')) { E.reset(true); render(); toast('Datos de ejemplo restaurados'); }
      if (t.closest('[data-borrar]') && confirm('¿Borrar todos los datos de este dispositivo?')) { E.borrar(); render(); toast('Datos borrados'); }
      if (t.closest('[data-ayuda]')) sheet({
        title: 'Cómo va la pizarra', cancelLabel: 'Cerrar',
        body: `<div class="card pad" style="margin-top:8px;line-height:1.6">
          <p style="margin-top:0"><b>Toca una casilla</b> y se abre su editor: actividad, quién, nota y hecho.</p>
          <p><b>Elige una actividad</b> de la leyenda y las casillas que toques la añaden o la quitan, sin abrir nada.</p>
          <p><b>Elige una persona</b> y al tocar casillas la asignas o la quitas.</p>
          <p><b>Hecho, Copiar y Borrar</b> funcionan igual: se activan y tocas casillas.</p>
          <p><b>Repetir anterior</b> copia la planificación de la semana pasada sin pisar lo que ya tengas.</p>
          <p style="margin-bottom:0"><b>Veterinario y herrador</b> se marcan solos en la pizarra el día de la actuación y pueden crearte el recordatorio de la próxima.</p></div>`
      });
    });
    $('#impf', root).onchange = async ev => {
      const f = ev.target.files[0]; if (!f) return;
      try {
        const d = JSON.parse(await f.text());
        if (d.version !== 1) throw 0;
        E.state = d; E.save(); render(); toast('Copia importada');
      } catch (err) { toast('Ese archivo no es una copia de EquiLog'); }
    };
  };

  function listaConfig({ titulo, items, nuevo, tipo }) {
    return `<div class="wrap">
      <header class="top"><button class="icon-btn" data-atras aria-label="Volver">${ic('back')}</button>
        <div class="brand" style="flex:1;margin-left:4px"><span><span class="eyebrow">Configuración</span><h1 class="title">${esc(titulo)}</h1></span></div>
        <button class="btn dark" data-nuevo>${ic('plus', 's')} Nuevo</button></header>
      ${items.length ? `<div class="list">${items}</div>` : vacio(tipo === 'caballos' ? 'horse' : tipo === 'personas' ? 'users' : 'grid', 'Nada todavía', 'Crea el primero con el botón Nuevo.')}
      ${nuevo || ''}
    </div>`;
  }
  vistas['config/caballos'] = function () {
    const cs = S().caballos;
    return listaConfig({
      titulo: 'Caballos', tipo: 'caballos',
      items: cs.map((c, i) => `<div class="row">${hthumb(c)}<span class="body"><span class="t">${esc(c.nombre)}</span><span class="s">${esc(c.estado)}${c.visible === false ? ' · oculto' : ''}</span></span>
        <span class="end"><span class="ord">
          <button type="button" data-up="${i}" aria-label="Subir" ${i ? '' : 'disabled'}>${ic('up', 's')}</button>
          <button type="button" data-down="${i}" aria-label="Bajar" ${i < cs.length - 1 ? '' : 'disabled'}>${ic('down', 's')}</button>
          <button type="button" data-vis="${c.id}" aria-label="${c.visible === false ? 'Mostrar' : 'Ocultar'} en pizarra">${ic(c.visible === false ? 'eyeoff' : 'eye', 's')}</button>
          <button type="button" data-edit="${c.id}" aria-label="Editar">${ic('edit', 's')}</button>
        </span></span></div>`).join('')
    });
  };
  vistas['config/caballos'].after = function (root) {
    root.addEventListener('click', e => {
      const up = e.target.closest('[data-up]'), dn = e.target.closest('[data-down]'), vi = e.target.closest('[data-vis]'), ed = e.target.closest('[data-edit]');
      const cs = S().caballos;
      if (up) { const i = +up.dataset.up; [cs[i - 1], cs[i]] = [cs[i], cs[i - 1]]; E.save(); render(); }
      if (dn) { const i = +dn.dataset.down; [cs[i + 1], cs[i]] = [cs[i], cs[i + 1]]; E.save(); render(); }
      if (vi) { const c = E.get.caballo(vi.dataset.vis); c.visible = c.visible === false; E.save(); render(); }
      if (ed) caballoForm(E.get.caballo(ed.dataset.edit));
      if (e.target.closest('[data-nuevo]')) caballoForm();
    });
  };
  vistas['config/personas'] = function () {
    return listaConfig({
      titulo: 'Personas', tipo: 'personas',
      items: S().personas.map(p => `<div class="row">${pav(p, 38)}<span class="body"><span class="t">${esc(p.nombre)}</span><span class="s">${esc(p.codigo || '')}${p.rol ? ' · ' + esc(p.rol) : ''}${p.visible === false ? ' · oculta' : ''}</span></span>
        <span class="end"><span class="ord"><button type="button" data-vis="${p.id}" aria-label="Mostrar u ocultar">${ic(p.visible === false ? 'eyeoff' : 'eye', 's')}</button><button type="button" data-edit="${p.id}" aria-label="Editar">${ic('edit', 's')}</button></span></span></div>`).join('')
    });
  };
  vistas['config/personas'].after = function (root) {
    root.addEventListener('click', e => {
      const vi = e.target.closest('[data-vis]'), ed = e.target.closest('[data-edit]');
      if (vi) { const p = E.get.persona(vi.dataset.vis); p.visible = p.visible === false; E.save(); render(); }
      if (ed) personaForm(E.get.persona(ed.dataset.edit));
      if (e.target.closest('[data-nuevo]')) personaForm();
    });
  };
  vistas['config/actividades'] = function () {
    return listaConfig({
      titulo: 'Actividades', tipo: 'actividades',
      items: S().actividades.map(a => `<div class="row"><span class="hthumb" style="color:${a.color};font-family:var(--sans);font-weight:800;font-size:13px">${esc(a.codigo)}</span>
        <span class="body"><span class="t">${esc(a.nombre)}</span><span class="s">Código ${esc(a.codigo)}${a.visible === false ? ' · oculta' : ''}</span></span>
        <span class="end"><span class="ord"><button type="button" data-vis="${a.id}" aria-label="Mostrar u ocultar">${ic(a.visible === false ? 'eyeoff' : 'eye', 's')}</button><button type="button" data-edit="${a.id}" aria-label="Editar">${ic('edit', 's')}</button></span></span></div>`).join(''),
      nuevo: '<p class="small muted" style="margin:14px 4px">Estos botones son los que aparecen en la leyenda de la pizarra.</p>'
    });
  };
  vistas['config/actividades'].after = function (root) {
    root.addEventListener('click', e => {
      const vi = e.target.closest('[data-vis]'), ed = e.target.closest('[data-edit]');
      if (vi) { const a = E.get.act(vi.dataset.vis); a.visible = a.visible === false; E.save(); render(); }
      if (ed) actForm(E.get.act(ed.dataset.edit));
      if (e.target.closest('[data-nuevo]')) actForm();
    });
  };

  /* ================= Navegación ================= */
  const TABS = [
    { k: 'inicio', l: 'Inicio', i: 'home', h: '#/inicio' },
    { k: 'pizarra', l: 'Pizarra', i: 'grid', h: '#/pizarra' },
    { k: 'caballos', l: 'Caballos', i: 'horse', h: '#/caballos' },
    { k: 'registros', l: 'Registros', i: 'list', h: '#/registros' },
    { k: 'mas', l: 'Más', i: 'dots', h: '#/mas' }
  ];
  function navHTML(activa) {
    return `<nav class="nav" aria-label="Secciones">${TABS.map(t => `<a href="${t.h}" class="${t.k === activa ? 'on' : ''}" ${t.k === activa ? 'aria-current="page"' : ''}>${ic(t.i)}<span>${t.l}</span></a>`).join('')}</nav>`;
  }
  function ruta() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    if (!h) return { v: S().perfil.vistaInicial || 'pizarra', id: null };
    if (h.startsWith('caballo/')) return { v: 'caballo', id: h.split('/')[1] };
    if (vistas[h]) return { v: h, id: null };
    return { v: 'inicio', id: null };
  }
  let atado = false;
  function render() {
    const { v, id } = ruta();
    const fn = vistas[v] || vistas.inicio;
    const activa = v === 'caballo' ? 'caballos' : v.startsWith('config/') ? 'mas' : v;
    app().innerHTML = fn(id) + navHTML(activa);
    document.title = 'EquiLog · ' + (v === 'pizarra' ? 'Pizarra' : cap(v.replace('config/', '')));
    const root = $('.wrap', app()) || app();
    if (fn.after) fn.after(root, id);
    if (!atado) {
      atado = true;
      app().addEventListener('click', e => {
        if (e.target.closest('[data-nuevo-registro]')) {
          const b = e.target.closest('[data-nuevo-registro]');
          registroSheet(b.dataset.cab ? { caballoId: b.dataset.cab } : {});
        }
        if (e.target.closest('[data-nuevo-caballo]')) caballoForm();
        if (e.target.closest('[data-atras]')) { if (!location.hash.startsWith('#/caballo/')) location.hash = '#/mas'; }
      });
    }
    pintarEstado();
  }
  function pintarEstado() {
    const el = $('#saved');
    if (!el) return;
    const g = E.estado === 'guardado';
    el.classList.toggle('busy', !g);
    el.lastChild.textContent = g ? 'Guardado' : 'Guardando…';
  }
  E.onEstado = pintarEstado;

  window.addEventListener('hashchange', render);
  window.addEventListener('storage', e => { if (e.key === E.KEY) { E.load(); render(); } });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  render();
})();
