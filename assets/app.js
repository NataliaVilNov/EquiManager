/* EquiLog · interfaz */
(function () {
  'use strict';
  const E = window.EQ, F = E.fecha;
  const S = () => E.state;
  const ROOT = document.body.dataset.root || '';
  const PAGE = document.body.dataset.page || 'index';
  const Q = new URLSearchParams(location.search);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let CTX = {};
  let RENDER = () => {};
  const refresh = () => RENDER();

  /* ================= Utilidades ================= */
  function href(page, params, hash) {
    const base = ROOT + (page === 'index' ? 'index.html' : 'pages/' + page + '.html');
    const p = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== '') p.set(k, v); });
    const qs = p.toString();
    return base + (qs ? '?' + qs : '') + (hash || '');
  }
  const go = (p, q, h) => { location.href = href(p, q, h); };
  const money = n => (+n || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: (+n % 1) ? 2 : 0 });
  const DF = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  const DFL = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' });
  const MF = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
  function fdate(iso) {
    if (!iso) return '';
    const d = F.diffDays(F.today(), iso);
    if (d === 0) return 'Hoy';
    if (d === 1) return 'Mañana';
    if (d === -1) return 'Ayer';
    return DF.format(F.parse(iso)).replace(/\./g, '');
  }
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.append(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 1800);
  }
  const save = () => E.save();

  /* ================= Iconos ================= */
  const P = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    grid: 'M3 5h18v14H3zM3 10h18M9 5v14M15 5v14',
    shoe: 'M6 20v-8a6 6 0 0 1 12 0v8M4 20h4M16 20h4M9 10h.01M15 10h.01M8.6 15h.01M15.4 15h.01',
    folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    euro: 'M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10h10M4 14h10',
    sliders: 'M4 7h9M17 7h3M15 5v4M4 17h3M11 17h9M9 15v4',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2.2.8 3.5 3 3.5 6',
    plus: 'M12 5v14M5 12h14',
    heart: 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z',
    bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
    doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6',
    note: 'M5 4h14v11l-5 5H5zM14 20v-5h5M8 9h8M8 13h4',
    wallet: 'M3 7h18v13H3zM3 7l3-3h12l3 3M16 13.5h2',
    hammer: 'M14 3l7 7-3 3-7-7zM12.5 8.5 4 17l3 3 8.5-8.5',
    vet: 'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z',
    chev: 'M9 6l6 6-6 6',
    back: 'M15 5l-7 7 7 7',
    check: 'M5 12.5l4.5 4.5L19 7',
    lock: 'M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
    share: 'M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v7h14v-7',
    pin: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
    trash: 'M5 7h14M9.5 7V4h5v3M7 7l1 13h8l1-13',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    cap: 'M2 9.5 12 5l10 4.5L12 14zM6 11.5V16c3.5 2.5 8.5 2.5 12 0v-4.5',
    repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
    x: 'M6 6l12 12M18 6 6 18',
    camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
    alert: 'M12 4 2.5 20h19zM12 10v4.5M12 17.5h.01',
    broom: 'M14 4l6 6M17 7l-6 6M4 20c1-4 3-7 7-7 0 4-3 6-7 7z',
    link: 'M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1',
    up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6'
  };
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.note}"/></svg>`;

  /* ================= Piezas visuales ================= */
  const inicial = u => ((u.mote || u.nombre || '?').trim().charAt(0) || '?').toUpperCase();
  function av(u, size = 36) {
    if (!u) return `<span class="av" style="width:${size}px;height:${size}px"></span>`;
    return `<span class="av" style="width:${size}px;height:${size}px;background:${esc(u.color || '#8C8377')};font-size:${Math.round(size * .42)}px" title="${esc(u.nombre)}">${u.foto ? `<img src="${u.foto}" alt="">` : esc(inicial(u))}</span>`;
  }
  const iniciales = n => (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  function thumb(c, cls = '') {
    if (c && c.foto) return `<img class="photo ${cls}" src="${c.foto}" alt="">`;
    return `<span class="horse-init ${cls}" aria-hidden="true">${esc(iniciales(c && c.nombre))}</span>`;
  }
  const tile = (i, tone = '', color) => `<span class="tile ${tone}" ${color ? `style="background:${color}22;color:${color}"` : ''}>${ic(i)}</span>`;
  const uName = id => (E.get.user(id) || {}).nombre || '';
  const cName = id => (E.get.caballo(id) || {}).nombre || '';
  function row({ href: h, onclick, icon, lead, t, s, end, cls = '', data = '' }) {
    const tag = h ? 'a' : (onclick !== false ? 'button' : 'div');
    const attrs = h ? `href="${h}"` : (tag === 'button' ? 'type="button"' : '');
    return `<${tag} class="row ${cls}" ${attrs} ${data}>${lead || (icon ? tile(icon) : '')}<span class="body"><span class="t">${t}</span>${s ? `<div class="s">${s}</div>` : ''}</span>${end !== undefined ? `<span class="end">${end}</span>` : (h ? `<span class="end">${ic('chev', 's')}</span>` : '')}</${tag}>`;
  }
  const empty = (icon, title, text, extra = '') => `<div class="card empty">${ic(icon)}<b>${title}</b>${text ? `<div>${text}</div>` : ''}${extra ? `<div style="margin-top:14px">${extra}</div>` : ''}</div>`;
  const section = (title, right = '', id = '') => `<div class="section" ${id ? `id="${id}"` : ''}><h2>${title}</h2>${right}</div>`;
  const actColor = code => (S().actividades.find(a => a.id === code) || { color: '#777' }).color;
  const actLabel = code => (S().actividades.find(a => a.id === code) || { codigo: code }).codigo;
  const codeChip = code => `<span class="code" style="--c:${actColor(code)}">${esc(actLabel(code))}</span>`;
  function seg(items, active) {
    return `<nav class="seg" aria-label="Secciones">${items.map(it => `<a href="${it.href}" class="${it.k === active ? 'on' : ''}" ${it.k === active ? 'aria-current="page"' : ''}>${esc(it.l)}</a>`).join('')}</nav>`;
  }
  const PALETA = ['#2F5D46', '#3F76A8', '#9A5B2A', '#7D62AE', '#B3362B', '#B8871B', '#5B8C51', '#C0577A', '#3F8A8A', '#5F5A53'];

  /* ================= Hojas ================= */
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
      close(instant) {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
        abierta = null;
        if (instant) { back.remove(); el.remove(); return; }
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
    setTimeout(() => {
      if (window.innerWidth < 700) return;
      const f = $('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea', b);
      if (f) f.focus();
    }, 260);
    return api;
  }
  const confirmar = (msg) => window.confirm(msg);

  /* ================= Formularios ================= */
  function fieldHTML(f, v) {
    const val = v !== undefined ? v : (f.def !== undefined ? f.def : '');
    const id = 'f_' + f.key;
    const hint = f.hint ? `<div class="hint">${esc(f.hint)}</div>` : '';
    const lab = `<label class="lab" for="${id}">${esc(f.label)}</label>`;
    const open = (cls = '') => `<div class="field ${cls}" data-key="${f.key}">`;
    switch (f.type) {
      case 'toggle':
        return `${open('inline')}<span class="lab">${esc(f.label)}</span><span class="switch"><input type="checkbox" name="${f.key}" ${val ? 'checked' : ''} aria-label="${esc(f.label)}"><i></i></span></div>`;
      case 'select':
        return `${open()}${lab}<select id="${id}">${f.options.map(o => `<option value="${esc(o.v)}" ${String(o.v) === String(val) ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select>${hint}</div>`;
      case 'segment':
        return `${open()}<span class="lab">${esc(f.label)}</span><div class="pick" role="radiogroup">${f.options.map(o => `<label><input type="radio" name="${id}" value="${esc(o.v)}" ${String(o.v) === String(val) ? 'checked' : ''}><span>${esc(o.l)}</span></label>`).join('')}</div>${hint}</div>`;
      case 'chips': {
        const arr = Array.isArray(val) ? val : [];
        return `${open()}<span class="lab">${esc(f.label)}</span><div class="pick">${f.options.map(o => `<label><input type="checkbox" value="${esc(o.v)}" ${arr.includes(o.v) ? 'checked' : ''}><span>${esc(o.l)}</span></label>`).join('') || '<span class="hint">No hay opciones todavía.</span>'}</div>${hint}</div>`;
      }
      case 'acts': {
        const arr = Array.isArray(val) ? val : [];
        return `${open()}<span class="lab">${esc(f.label)}</span><div class="pick acts">${S().actividades.map(a => `<label style="--c:${a.color}"><input type="checkbox" value="${esc(a.id)}" ${arr.includes(a.id) ? 'checked' : ''}><span><span class="dot" style="background:${a.color}"></span>${esc(a.nombre)}</span></label>`).join('')}</div>${hint}</div>`;
      }
      case 'color':
        return `${open()}<span class="lab">${esc(f.label)}</span><div class="swatches">${PALETA.concat(PALETA.includes(val) || !val ? [] : [val]).map(c => `<label><input type="radio" name="${id}" value="${c}" ${c === (val || PALETA[0]) ? 'checked' : ''} aria-label="Color ${c}"><span style="--c:${c}"></span></label>`).join('')}</div></div>`;
      case 'textarea':
        return `${open()}${lab}<textarea id="${id}" placeholder="${esc(f.ph || '')}">${esc(val)}</textarea>${hint}</div>`;
      case 'photo':
        return `${open()}<span class="lab">${esc(f.label)}</span><div class="photo-field"><div class="prev">${val ? `<img src="${val}" alt="">` : ic('camera')}</div><div class="btns" style="flex:1"><label class="btn sm soft">Elegir foto<input type="file" accept="image/*" hidden></label>${val ? '<button type="button" class="btn sm ghost" data-clear>Quitar</button>' : ''}</div><input type="hidden" value="${esc(val)}"></div></div>`;
      case 'file':
        return `${open()}<span class="lab">${esc(f.label)}</span><input type="file" id="${id}" ${f.accept ? `accept="${f.accept}"` : ''}>${hint}</div>`;
      case 'owners': case 'accesos': {
        const rows = Array.isArray(val) ? val : [];
        return `${open('rows-edit')}<span class="lab">${esc(f.label)}</span><div class="re-list">${rows.map(r => reRow(f, r)).join('')}</div><button type="button" class="link" data-add>${ic('plus', 's')} Añadir</button>${hint}</div>`;
      }
      case 'note':
        return `<div class="field" data-key="${f.key || ''}"><div class="hint" style="margin:0">${esc(f.label)}</div></div>`;
      default:
        return `${open()}${lab}<input id="${id}" type="${f.type || 'text'}" value="${esc(val)}" placeholder="${esc(f.ph || '')}" ${f.type === 'number' ? 'inputmode="decimal" step="any"' : ''} ${f.type === 'tel' ? 'inputmode="tel"' : ''}>${hint}</div>`;
    }
  }
  const ROLES_ACC = { copropietario: 'Copropietario', jinete: 'Jinete / responsable', veterinario: 'Veterinario', invitado: 'Invitado', gerente: 'Gerente (autorizado)' };
  function reRow(f, r) {
    const users = S().usuarios.map(u => `<option value="${u.id}" ${u.id === r.userId ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('');
    const extra = f.type === 'owners'
      ? `<input type="number" inputmode="decimal" placeholder="%" value="${esc(r.pct ?? '')}" aria-label="Porcentaje">`
      : `<select aria-label="Rol">${Object.entries(ROLES_ACC).map(([k, l]) => `<option value="${k}" ${k === r.rol ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    return `<div class="re"><select aria-label="Persona"><option value="">Elegir persona…</option>${users}</select>${extra}<button type="button" class="x" aria-label="Quitar">${ic('x', 's')}</button></div>`;
  }
  function formHTML(fields, values) {
    const groups = [{ title: '', items: [] }];
    fields.forEach(f => {
      if (f.type === 'title') groups.push({ title: f.label, items: [] });
      else groups[groups.length - 1].items.push(fieldHTML(f, values[f.key]));
    });
    return groups.filter(g => g.items.length).map(g => (g.title ? `<div class="form-title">${esc(g.title)}</div>` : '') + `<div class="group">${g.items.join('')}</div>`).join('');
  }
  function readForm(root, fields) {
    const out = {};
    fields.forEach(f => {
      if (!f.key || f.type === 'title' || f.type === 'note') return;
      const r = $(`[data-key="${f.key}"]`, root);
      if (!r) return;
      switch (f.type) {
        case 'toggle': out[f.key] = $('input', r).checked; break;
        case 'chips': case 'acts': out[f.key] = $$('input:checked', r).map(i => i.value); break;
        case 'segment': case 'color': out[f.key] = ($('input:checked', r) || {}).value || ''; break;
        case 'number': { const s = $('input', r).value.replace(',', '.'); out[f.key] = s === '' ? '' : +s; break; }
        case 'photo': out[f.key] = $('input[type=hidden]', r).value; break;
        case 'file': out[f.key] = $('input', r).files[0] || null; break;
        case 'owners': out[f.key] = $$('.re', r).map(x => ({ userId: $('select', x).value, pct: $('input', x).value === '' ? '' : +$('input', x).value })).filter(x => x.userId); break;
        case 'accesos': out[f.key] = $$('.re', r).map(x => ({ userId: $$('select', x)[0].value, rol: $$('select', x)[1].value })).filter(x => x.userId); break;
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
      const setVal = val => {
        $('input[type=hidden]', r).value = val;
        $('.prev', r).innerHTML = val ? `<img src="${val}" alt="">` : ic('camera');
      };
      $('input[type=file]', r).onchange = async e => { const file = e.target.files[0]; if (file) setVal(await imgData(file)); };
      r.addEventListener('click', e => { if (e.target.closest('[data-clear]')) { setVal(''); e.target.closest('[data-clear]').remove(); } });
    });
    fields.filter(f => f.type === 'owners' || f.type === 'accesos').forEach(f => {
      const r = $(`[data-key="${f.key}"]`, root);
      r.addEventListener('click', e => {
        if (e.target.closest('[data-add]')) $('.re-list', r).insertAdjacentHTML('beforeend', reRow(f, {}));
        const x = e.target.closest('.x'); if (x) x.closest('.re').remove();
      });
    });
    upd();
  }
  function imgData(file, max = 360) {
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
  const fileData = file => new Promise(res => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.readAsDataURL(file); });

  /* Formulario genérico en hoja */
  function openForm({ title, fields, values = {}, onSave, onDelete, deleteLabel = 'Eliminar', doneLabel = 'Guardar', intro = '' }) {
    const body = document.createElement('div');
    body.innerHTML = intro + formHTML(fields, values) + (onDelete ? `<button type="button" class="btn danger block" data-del style="margin-top:8px">${ic('trash', 's')} ${esc(deleteLabel)}</button>` : '');
    return sheet({
      title, body, doneLabel,
      mount: () => {
        bindForm(body, fields);
        const d = $('[data-del]', body);
        if (d) d.onclick = () => { if (onDelete() !== false) { abierta && abierta.close(); save(); refresh(); } };
      },
      done: () => {
        const v = readForm(body, fields);
        for (const f of fields) {
          if (!f.req) continue;
          const row = $(`[data-key="${f.key}"]`, body);
          if (row && row.classList.contains('hidden')) continue;
          const val = v[f.key];
          if (val === '' || val == null || (Array.isArray(val) && !val.length)) { toast('Falta: ' + f.label); return false; }
        }
        const r = onSave(v);
        if (r === false) return false;
        save(); refresh();
        return true;
      }
    });
  }

  /* Opciones de selección */
  const opt = (arr, lab = 'nombre', blank) => (blank !== undefined ? [{ v: '', l: blank }] : []).concat(arr.map(x => ({ v: x.id, l: x[lab] })));
  const optUsers = blank => opt(S().usuarios, 'nombre', blank);
  const sedeDe = id => E.get.sede(id);
  const conSede = (x) => ({ id: x.id, nombre: x.nombre + (sedeDe(x.sedeId) ? ' — ' + sedeDe(x.sedeId).nombre : '') });

  /* ================= Vistas, accesos directos y barra ================= */
  function vistaActual(u) {
    const vs = E.vistasDe(u);
    const v = S().sesion.vista;
    if (vs.includes(v)) return v;
    return vs.includes(u.vistaInicial) ? u.vistaInicial : vs[0];
  }
  function cuadraSesion(u) {
    const list = E.cuadrasDe(u);
    const id = S().sesion.cuadraId;
    return (list.find(c => c.id === id) || list[0] || {}).id || '';
  }
  function escuelaSesion(u) {
    const id = S().sesion.escuelaId;
    if (E.get.escuela(id)) return id;
    const k = S().clases.find(c => c.profesorId === u.id);
    return (k && k.escuelaId) || (S().escuelas[0] || {}).id || '';
  }
  const TODAS = ['gerencia', 'cuadra', 'caballos', 'clases', 'admin'];
  const ATAJOS = {
    'cuadra-inicio': { l: 'Mi cuadra', i: 'home', v: ['cuadra'], to: u => ['cuadra-privada', { id: cuadraSesion(u) }] },
    pizarra: { l: 'Pizarra', i: 'grid', v: ['cuadra', 'caballos'], to: u => ['pizarra', { cuadra: cuadraSesion(u) }] },
    'caballos-cuadra': { l: 'Caballos', i: 'shoe', v: ['cuadra'], to: u => ['caballos', { cuadra: cuadraSesion(u) }] },
    carpetas: { l: 'Carpetas', i: 'folder', v: TODAS, to: () => ['carpetas'] },
    hoy: { l: 'Hoy importa', i: 'bell', v: ['gerencia', 'admin'], to: () => ['index', {}, '#hoy'] },
    cobros: { l: 'Cobros', i: 'euro', v: ['gerencia', 'admin'], perm: u => E.puedeEconomia(u), to: () => ['cuadra-general', { tab: 'cobros' }] },
    config: { l: 'Ajustes', i: 'sliders', v: ['gerencia', 'admin'], perm: u => E.puedeConfig(u), to: () => ['configuracion'] },
    clases: { l: 'Clases', i: 'cal', v: ['clases', 'gerencia', 'admin'], to: u => ['clases', { escuela: escuelaSesion(u) }] },
    disponibles: { l: 'Caballos', i: 'shoe', v: ['clases'], to: u => ['escuela', { id: escuelaSesion(u), tab: 'caballos' }] },
    alumnos: { l: 'Alumnos', i: 'users', v: ['clases', 'admin'], to: u => ['escuela', { id: escuelaSesion(u), tab: 'alumnos' }] },
    'cobros-escuela': { l: 'Cobros', i: 'euro', v: ['clases', 'admin'], perm: u => E.puedeEconomia(u), to: u => ['escuela', { id: escuelaSesion(u), tab: 'cobros' }] },
    'mis-caballos': { l: 'Caballos', i: 'shoe', v: ['caballos', 'gerencia'], to: () => ['mis-caballos'] },
    salud: { l: 'Veterinario', tl: 'Salud', i: 'heart', v: ['caballos', 'cuadra'], to: () => ['mis-caballos', { tab: 'salud' }] },
    gastos: { l: 'Gastos', i: 'wallet', v: ['caballos'], to: () => ['mis-caballos', { tab: 'gastos' }] },
    recordatorios: { l: 'Recordatorios', tl: 'Avisos', i: 'bell', v: ['caballos', 'cuadra'], to: () => ['mis-caballos', { tab: 'recordatorios' }] },
    perfil: { l: 'Perfil', i: 'user', v: TODAS, to: () => ['perfil'] }
  };
  const DEF_ATAJOS = {
    cuadra: ['pizarra', 'caballos-cuadra', 'recordatorios', 'cuadra-inicio'],
    clases: ['clases', 'disponibles', 'cobros-escuela', 'alumnos'],
    caballos: ['mis-caballos', 'salud', 'gastos', 'recordatorios'],
    gerencia: ['carpetas', 'hoy', 'cobros', 'config'],
    admin: ['cobros', 'cobros-escuela', 'alumnos', 'carpetas']
  };
  const atajoOK = (u, v, k) => ATAJOS[k] && ATAJOS[k].v.includes(v) && (!ATAJOS[k].perm || ATAJOS[k].perm(u));
  function atajosDe(u, v) {
    const lista = (u.atajos && u.atajos[v]) || DEF_ATAJOS[v] || [];
    return lista.filter(k => atajoOK(u, v, k));
  }
  function atajoLink(u, k) { const [p, q, h] = ATAJOS[k].to(u); return { k, l: ATAJOS[k].l, tl: ATAJOS[k].tl || ATAJOS[k].l, i: ATAJOS[k].i, page: p, params: q || {}, href: href(p, q, h) }; }

  function tabbarHTML() {
    const u = E.me();
    let tabs;
    if (CTX.enCuadra) {
      const id = CTX.cuadraId;
      tabs = [
        { l: 'Inicio', i: 'home', page: 'cuadra-privada', params: {}, href: href('cuadra-privada', { id }) },
        { l: 'Pizarra', i: 'grid', page: 'pizarra', params: {}, href: href('pizarra', { cuadra: id }) },
        { l: 'Caballos', i: 'shoe', page: 'caballos', params: {}, href: href('caballos', { cuadra: id }) }
      ];
    } else {
      const v = vistaActual(u);
      tabs = [{ l: 'Inicio', i: 'home', page: 'index', params: {}, href: href('index') }].concat(atajosDe(u, v).filter(k => k !== 'hoy').slice(0, 3).map(k => atajoLink(u, k)));
    }
    const activo = t => t.page === PAGE && (t.params.tab || '') === (Q.get('tab') || '') && (PAGE !== 'caballo');
    return `<nav class="tabbar" aria-label="Navegación principal"><div class="tabs">${tabs.map(t => `<a class="tab ${activo(t) ? 'on' : ''}" href="${t.href}" ${activo(t) ? 'aria-current="page"' : ''}>${ic(t.i)}<span>${esc(t.tl || t.l)}</span></a>`).join('')}</div><button class="fab" id="fab" type="button" aria-label="Nuevo registro">${ic('plus')}</button></nav>`;
  }

  function shell({ title = '', sub = '', back, actions = '', desc = '' }) {
    const u = E.me();
    document.title = (title ? title + ' · ' : '') + 'EquiLog';
    $('#app').innerHTML = `<div class="app">
      <header class="bar">${back ? `<a class="icon-btn" href="${back}" aria-label="Volver">${ic('back')}</a>` : ''}<span class="crumb">${esc(sub)}</span><span class="spacer"></span>${actions}<button class="acct" id="acct" type="button" aria-label="Cuenta y vistas">${av(u, 44)}</button></header>
      ${title ? `<div class="head"><h1>${esc(title)}</h1>${desc ? `<p>${desc}</p>` : ''}</div>` : ''}
      <main class="main" id="main"></main></div>${tabbarHTML()}`;
    $('#acct').onclick = cuentaSheet;
    $('#fab').onclick = () => registroSheet(CTX);
    return $('#main');
  }
  const editBtn = (id, label = 'Editar') => `<button class="icon-btn" id="${id}" type="button" aria-label="${label}">${ic('edit')}</button>`;

  /* Cuenta: vista activa y cambio de usuario */
  function cuentaSheet() {
    const u = E.me(), v = vistaActual(u);
    const vs = E.vistasDe(u);
    const body = `
      <div class="list" style="margin-top:6px">${row({ href: href('perfil'), lead: av(u, 44), t: esc(u.nombre), s: u.roles.map(r => E.ROLES[r]).join(', ') || 'Sin rol' })}</div>
      <div class="form-title">Vista activa</div>
      <div class="list">${vs.map(k => row({ t: E.VISTAS[k].nombre, s: E.VISTAS[k].desc, icon: E.VISTAS[k].icon, end: k === v ? ic('check') : '', data: `data-vista="${k}"` })).join('')}</div>
      <div class="form-title">Cambiar de usuario (pruebas)</div>
      <div class="list">${S().usuarios.map(x => row({ lead: av(x, 40), t: esc(x.nombre), s: x.roles.map(r => E.ROLES[r]).join(', '), end: x.id === u.id ? ic('check') : '', data: `data-user="${x.id}"` })).join('')}</div>
      ${E.puedeConfig(u) ? `<div class="list" style="margin-top:14px">${row({ href: href('configuracion'), icon: 'sliders', t: 'Configuración del centro' })}</div>` : ''}`;
    sheet({
      title: 'Cuenta', body, cancelLabel: 'Cerrar',
      mount: api => {
        api.body.addEventListener('click', e => {
          const a = e.target.closest('[data-vista]'), b = e.target.closest('[data-user]');
          if (a) { api.close(true); activarVista(a.dataset.vista); }
          if (b) {
            const nu = E.get.user(b.dataset.user);
            S().sesion.userId = nu.id; S().sesion.vista = null;
            S().sesion.vista = vistaActual(nu); save(); api.close(true);
            go('index');
          }
        });
      }
    });
  }
  function activarVista(v) {
    const u = E.me();
    S().sesion.vista = v;
    if (v === 'cuadra') S().sesion.cuadraId = cuadraSesion(u);
    if (v === 'clases') S().sesion.escuelaId = escuelaSesion(u);
    save();
    if (PAGE === 'index') refresh(); else go('index');
  }

  /* ================= Registro rápido ================= */
  const TIPOS_REG = {
    pizarra: { l: 'Pizarra', i: 'grid', d: 'Trabajo del día. Sin importe.' },
    gasto: { l: 'Gasto', i: 'wallet', d: 'Con importe y pagador.' },
    veterinario: { l: 'Veterinario', i: 'vet', d: 'Actuación y próxima cita.' },
    herrador: { l: 'Herrador', i: 'hammer', d: 'Herraje, recorte o revisión.' },
    recordatorio: { l: 'Recordatorio', i: 'bell', d: 'Una fecha que no se olvide.' },
    documento: { l: 'Documento', i: 'doc', d: 'Enlace o archivo pequeño.' },
    nota: { l: 'Nota', i: 'note', d: 'Texto rápido sobre un caballo.' }
  };
  function personasDe(caballos) {
    const ids = new Set();
    caballos.forEach(c => {
      c.propietarios.forEach(p => ids.add(p.userId));
      if (c.responsableId) ids.add(c.responsableId);
      (c.accesos || []).forEach(a => ids.add(a.userId));
      const cp = E.get.cp(c.cuadraPrivadaId);
      if (cp) { ids.add(cp.adminId); cp.accesos.forEach(a => ids.add(a.userId)); }
    });
    const list = S().usuarios.filter(u => ids.has(u.id));
    return list.length ? list : S().usuarios;
  }
  function tiposPermitidos(u, ctx, horses) {
    let t = Object.keys(TIPOS_REG);
    if (!u.permisos.crear && !E.esGlobal(u)) return [];
    if (ctx.cuadraId) {
      const acc = E.cuadraAcceso(u, E.get.cp(ctx.cuadraId));
      if (!acc) return [];
      if (acc.nivel === 'pizarra') return ['pizarra'];
      if (acc.nivel === 'lectura') return [];
      if (!acc.gastos) t = t.filter(x => x !== 'gasto');
      if (!acc.salud) t = t.filter(x => !['veterinario', 'herrador', 'documento'].includes(x));
    }
    if (ctx.vista === 'clases' || ctx.vista === 'gerencia' || ctx.vista === 'admin') {
      if (!E.puedeEconomia(u)) t = t.filter(x => x !== 'gasto');
    }
    if (!horses.length) return [];
    return t;
  }
  function regFields(tipo, horses, pre, ctx) {
    const t = F.today();
    const hs = opt(horses);
    const cab = { key: 'caballoId', label: 'Caballo', type: 'select', options: hs, def: pre.caballoId || (hs[0] || {}).v, req: true };
    const people = personasDe(horses);
    const recFields = (plazos, defP) => [
      { type: 'title', label: 'Próxima vez' },
      { key: 'recordar', label: 'Crear recordatorio', type: 'toggle', def: tipo === 'herrador' },
      { key: 'plazo', label: 'Recordar dentro de', type: 'segment', options: plazos, def: defP, when: v => v.recordar },
      { key: 'recFecha', label: 'Fecha del recordatorio', type: 'date', def: F.addMonths(t, 1), when: v => v.recordar && v.plazo === 'fecha' }
    ];
    switch (tipo) {
      case 'pizarra': return [
        { key: 'fecha', label: 'Fecha', type: 'date', def: pre.fecha || t, req: true }, cab,
        { key: 'codigos', label: 'Actividad', type: 'acts', req: true },
        { key: 'personaId', label: 'Quién lo hace', type: 'select', options: opt(people, 'nombre', 'Sin asignar') },
        { key: 'nota', label: 'Nota', type: 'text', ph: 'Opcional' }];
      case 'gasto': return [
        { key: 'fecha', label: 'Fecha', type: 'date', def: t, req: true }, cab,
        { key: 'concepto', label: 'Concepto', type: 'text', ph: 'Concurso, material, transporte…', req: true, def: pre.concepto },
        { key: 'importe', label: 'Importe (€)', type: 'number', req: true, def: pre.importe },
        { key: 'pagadorId', label: 'Paga', type: 'select', options: optUsers('—'), def: E.me().id },
        { key: 'pagado', label: 'Pagado', type: 'toggle' },
        { key: 'ambito', label: 'Visible para', type: 'segment', options: [{ v: 'privado', l: 'Privado' }, { v: 'compartido', l: 'Compartido con el centro' }], def: ['gerencia', 'admin'].includes(ctx.vista) ? 'compartido' : 'privado' },
        { key: 'nota', label: 'Nota', type: 'text', ph: 'Opcional' }];
      case 'veterinario': return [
        { key: 'fecha', label: 'Fecha de la actuación', type: 'date', def: t, req: true }, cab,
        { key: 'concepto', label: 'Concepto', type: 'text', ph: 'Vacuna, revisión, tratamiento…', req: true, def: pre.concepto },
        { key: 'importe', label: 'Importe (€)', type: 'number', ph: 'Opcional', def: pre.importe },
        { key: 'enlace', label: 'Documento o enlace', type: 'url', ph: 'https://… (opcional)' },
        { key: 'nota', label: 'Nota', type: 'text', ph: 'Opcional' },
        ...recFields([{ v: '1', l: '1 mes' }, { v: '3', l: '3 meses' }, { v: '6', l: '6 meses' }, { v: '12', l: '1 año' }, { v: 'fecha', l: 'Otra fecha' }], '6')];
      case 'herrador': return [
        { key: 'fecha', label: 'Fecha de la actuación', type: 'date', def: t, req: true }, cab,
        { key: 'subtipo', label: 'Tipo', type: 'segment', options: [{ v: 'Herraje', l: 'Herraje' }, { v: 'Recorte', l: 'Recorte' }, { v: 'Revisión', l: 'Revisión' }], def: 'Herraje' },
        { key: 'importe', label: 'Importe (€)', type: 'number', ph: 'Opcional', def: pre.importe },
        { key: 'nota', label: 'Nota', type: 'text', ph: 'Opcional' },
        ...recFields([{ v: 's4', l: '4 semanas' }, { v: 's6', l: '6 semanas' }, { v: 's8', l: '8 semanas' }, { v: 'fecha', l: 'Otra fecha' }], 's6')];
      case 'recordatorio': return [
        { key: 'fecha', label: 'Fecha del recordatorio', type: 'date', def: F.addDays(t, 7), req: true }, cab,
        { key: 'concepto', label: 'Qué hay que recordar', type: 'text', req: true, def: pre.concepto },
        { key: 'responsableId', label: 'Responsable', type: 'select', options: opt(people, 'nombre', 'Sin responsable'), def: E.me().id },
        { key: 'nota', label: 'Nota', type: 'text', ph: 'Opcional' }];
      case 'documento': return [
        cab,
        { key: 'docTipo', label: 'Tipo de documento', type: 'select', options: ['Pasaporte', 'Seguro', 'Analítica', 'Radiografía', 'Factura', 'Contrato', 'Otro'].map(x => ({ v: x, l: x })) },
        { key: 'enlace', label: 'Enlace', type: 'url', ph: 'https://…' },
        { key: 'archivo', label: 'O archivo (máx. 400 KB)', type: 'file', accept: 'image/*,application/pdf' },
        { key: 'fecha', label: 'Fecha', type: 'date', def: t },
        { key: 'nota', label: 'Nota', type: 'text', ph: 'Opcional' }];
      case 'nota': return [
        cab, { key: 'fecha', label: 'Fecha', type: 'date', def: t },
        { key: 'nota', label: 'Nota', type: 'textarea', req: true },
        { key: 'visible', label: 'Visible para', type: 'segment', options: [{ v: 'todos', l: 'Todos con acceso' }, { v: 'propietarios', l: 'Propietarios' }, { v: 'yo', l: 'Solo yo' }], def: 'todos' }];
    }
    return [];
  }
  function upsertCelda(caballoId, fecha, datos) {
    let c = S().pizarra.find(p => p.caballoId === caballoId && p.fecha === fecha);
    if (!c) { c = { id: E.uid('pz'), caballoId, fecha, codigos: [], personaId: '', nota: '', hecho: false }; S().pizarra.push(c); }
    if (datos.add) datos.add.forEach(x => { if (!c.codigos.includes(x)) c.codigos.push(x); });
    if (datos.personaId) c.personaId = datos.personaId;
    if (datos.nota) c.nota = c.nota ? c.nota + ' · ' + datos.nota : datos.nota;
    if (datos.hecho !== undefined) c.hecho = datos.hecho;
    return c;
  }
  async function guardarRegistro(tipo, v, ctx) {
    const u = E.me();
    const t = F.today();
    if (tipo === 'pizarra') {
      upsertCelda(v.caballoId, v.fecha, { add: v.codigos, personaId: v.personaId, nota: v.nota });
      return 'Añadido a la pizarra';
    }
    const ambito = v.ambito || (['gerencia', 'admin'].includes(ctx.vista) ? 'compartido' : 'privado');
    const r = { id: E.uid('r'), tipo, fecha: v.fecha || t, caballoId: v.caballoId, concepto: v.concepto || '', importe: v.importe === '' || v.importe == null ? null : v.importe, nota: v.nota || '', ambito, autorId: u.id };
    if (tipo === 'gasto') Object.assign(r, { pagadorId: v.pagadorId, pagado: !!v.pagado });
    if (tipo === 'veterinario') r.enlace = v.enlace;
    if (tipo === 'herrador') { r.subtipo = v.subtipo; r.concepto = v.subtipo; r.pagado = false; }
    if (tipo === 'recordatorio') Object.assign(r, { responsableId: v.responsableId, hecho: false });
    if (tipo === 'documento') {
      r.concepto = v.docTipo; r.enlace = v.enlace;
      if (v.archivo) {
        if (v.archivo.size > 400 * 1024) { toast('El archivo supera 400 KB. Usa un enlace.'); return false; }
        r.archivo = await fileData(v.archivo); r.archivoNombre = v.archivo.name;
      }
    }
    if (tipo === 'nota') { r.visible = v.visible; r.concepto = 'Nota'; }
    S().registros.push(r);
    if ((tipo === 'veterinario' || tipo === 'herrador')) {
      const code = tipo === 'veterinario' ? 'VET' : 'H';
      upsertCelda(r.caballoId, r.fecha, { add: [code], hecho: r.fecha < t ? true : undefined });
      if (v.recordar) {
        let f = v.recFecha;
        if (v.plazo && v.plazo !== 'fecha') f = v.plazo[0] === 's' ? F.addDays(r.fecha, 7 * +v.plazo.slice(1)) : F.addMonths(r.fecha, +v.plazo);
        S().registros.push({ id: E.uid('r'), tipo: 'recordatorio', fecha: f, caballoId: r.caballoId, concepto: (tipo === 'veterinario' ? 'Veterinario: ' : 'Herrador: ') + r.concepto, responsableId: u.id, hecho: false, nota: '', ambito, autorId: u.id, origenId: r.id });
        return 'Guardado. Recordatorio el ' + DFL.format(F.parse(f));
      }
    }
    return 'Registro guardado';
  }
  function registroSheet(ctx, pre = {}) {
    const u = E.me();
    let horses = E.caballosContexto(u, ctx);
    if (ctx.caballoId && !horses.some(h => h.id === ctx.caballoId)) {
      const c = E.get.caballo(ctx.caballoId); if (c && E.caballoNivel(u, c)) horses = [c].concat(horses);
    }
    pre = Object.assign({ caballoId: ctx.caballoId }, pre);
    const tipos = tiposPermitidos(u, ctx, horses);
    const lugar = ctx.cuadraId ? (E.get.cp(ctx.cuadraId) || {}).nombre : ctx.vista ? E.VISTAS[ctx.vista].nombre : '';
    const body = document.createElement('div');
    const api = sheet({ title: 'Nuevo registro', body });
    const plantillas = S().plantillas.filter(p => tipos.includes(p.tipo));
    function paso1() {
      api.setTitle('Nuevo registro'); api.setDone('', null);
      if (!tipos.length) {
        body.innerHTML = empty('lock', horses.length ? 'Sin permiso para registrar aquí' : 'No hay caballos en este contexto', horses.length ? 'Pide acceso de edición a quien administra esta carpeta.' : 'Crea o asigna un caballo para empezar a registrar.', !horses.length && E.puedeEditarCaballos(u) ? `<button class="btn" data-newhorse>${ic('plus', 's')} Crear caballo</button>` : '');
        const nb = $('[data-newhorse]', body); if (nb) nb.onclick = () => { api.close(true); caballoForm(null, { cuadraPrivadaId: ctx.cuadraId || '' }); };
        return;
      }
      body.innerHTML = `<p class="muted small" style="margin:4px 4px 10px">${lugar ? 'En ' + esc(lugar) + ' · ' : ''}${horses.length} caballo${horses.length === 1 ? '' : 's'} disponibles</p>
        <div class="types">${tipos.map(k => `<button class="type" type="button" data-t="${k}">${tile(TIPOS_REG[k].i)}<b>${TIPOS_REG[k].l}</b><small>${TIPOS_REG[k].d}</small></button>`).join('')}</div>
        ${plantillas.length ? `<div class="form-title">Plantillas</div><div class="pick">${plantillas.map(p => `<button type="button" class="btn sm ghost" data-pl="${p.id}">${esc(p.nombre)}</button>`).join('')}</div>` : ''}`;
      body.onclick = e => {
        const b = e.target.closest('[data-t]'); if (b) paso2(b.dataset.t, {});
        const p = e.target.closest('[data-pl]'); if (p) { const pl = S().plantillas.find(x => x.id === p.dataset.pl); paso2(pl.tipo, { concepto: pl.concepto, importe: pl.importe }); }
      };
      if (pre.tipo && tipos.includes(pre.tipo)) paso2(pre.tipo, {});
    }
    function paso2(tipo, extra) {
      body.onclick = null;
      pre.tipo = null;
      const fields = regFields(tipo, horses, Object.assign({}, pre, extra), ctx);
      api.setTitle(TIPOS_REG[tipo].l);
      body.innerHTML = (tipos.length > 1 ? `<button type="button" class="link" data-back>${ic('back', 's')} Cambiar tipo</button>` : '') + formHTML(fields, {});
      bindForm(body, fields);
      const bb = $('[data-back]', body); if (bb) bb.onclick = paso1;
      api.setDone('Guardar', () => {
        const v = readForm(body, fields);
        for (const f of fields) {
          if (!f.req) continue;
          const val = v[f.key];
          if (val === '' || val == null || (Array.isArray(val) && !val.length)) { toast('Falta: ' + f.label); return false; }
        }
        guardarRegistro(tipo, v, ctx).then(msg => {
          if (msg === false) return;
          save(); api.close(); toast(msg); refresh();
        });
        return false;
      });
    }
    paso1();
  }
  /* Editar un registro existente */
  function editarRegistro(r) {
    const u = E.me(), c = E.get.caballo(r.caballoId);
    const n = E.caballoNivel(u, c);
    const puede = r.autorId === u.id || n === 'total' || E.esGlobal(u);
    const base = [{ key: 'fecha', label: 'Fecha', type: 'date', req: true }];
    const f = {
      gasto: [...base, { key: 'concepto', label: 'Concepto', req: true }, { key: 'importe', label: 'Importe (€)', type: 'number' }, { key: 'pagadorId', label: 'Paga', type: 'select', options: optUsers('—') }, { key: 'pagado', label: 'Pagado', type: 'toggle' }, { key: 'ambito', label: 'Visible para', type: 'segment', options: [{ v: 'privado', l: 'Privado' }, { v: 'compartido', l: 'Compartido con el centro' }] }, { key: 'nota', label: 'Nota' }],
      veterinario: [...base, { key: 'concepto', label: 'Concepto', req: true }, { key: 'importe', label: 'Importe (€)', type: 'number' }, { key: 'pagado', label: 'Pagado', type: 'toggle' }, { key: 'enlace', label: 'Enlace', type: 'url' }, { key: 'nota', label: 'Nota' }],
      herrador: [...base, { key: 'subtipo', label: 'Tipo', type: 'segment', options: ['Herraje', 'Recorte', 'Revisión'].map(x => ({ v: x, l: x })) }, { key: 'importe', label: 'Importe (€)', type: 'number' }, { key: 'pagado', label: 'Pagado', type: 'toggle' }, { key: 'nota', label: 'Nota' }],
      recordatorio: [...base, { key: 'concepto', label: 'Concepto', req: true }, { key: 'responsableId', label: 'Responsable', type: 'select', options: optUsers('Sin responsable') }, { key: 'hecho', label: 'Hecho', type: 'toggle' }, { key: 'nota', label: 'Nota' }],
      documento: [...base, { key: 'concepto', label: 'Tipo' }, { key: 'enlace', label: 'Enlace', type: 'url' }, { key: 'nota', label: 'Nota' }],
      nota: [...base, { key: 'nota', label: 'Nota', type: 'textarea', req: true }, { key: 'visible', label: 'Visible para', type: 'segment', options: [{ v: 'todos', l: 'Todos con acceso' }, { v: 'propietarios', l: 'Propietarios' }, { v: 'yo', l: 'Solo yo' }] }]
    }[r.tipo];
    const link = r.enlace || r.archivo;
    const intro = `<p class="muted small" style="margin:4px 4px 0">${esc(cName(r.caballoId))} · creado por ${esc(uName(r.autorId) || '—')}</p>${link ? `<a class="btn soft block" style="margin-top:10px" href="${esc(link)}" target="_blank" rel="noopener" ${r.archivo ? `download="${esc(r.archivoNombre || 'documento')}"` : ''}>${ic('link', 's')} Abrir documento</a>` : ''}`;
    if (!puede) {
      sheet({ title: TIPOS_REG[r.tipo].l, cancelLabel: 'Cerrar', body: intro + `<div class="group">${f.map(x => x.key ? `<div class="field"><span class="lab">${esc(x.label)}</span>${esc(fmtVal(x, r[x.key]))}</div>` : '').join('')}</div>` });
      return;
    }
    openForm({
      title: TIPOS_REG[r.tipo].l, fields: f, values: r, intro,
      onSave: v => { if (v.importe === '') v.importe = null; Object.assign(r, v); if (r.tipo === 'herrador') r.concepto = r.subtipo; toast('Guardado'); },
      onDelete: () => { if (!confirmar('¿Eliminar este registro?')) return false; S().registros = S().registros.filter(x => x.id !== r.id); toast('Eliminado'); }
    });
  }
  function fmtVal(f, v) {
    if (f.type === 'toggle') return v ? 'Sí' : 'No';
    if (f.type === 'date') return v ? DFL.format(F.parse(v)) : '—';
    if (f.type === 'number') return v == null || v === '' ? '—' : money(v);
    if (f.type === 'select') return (f.options.find(o => o.v === v) || {}).l || '—';
    return v || '—';
  }
  const REG_ICON = { gasto: 'wallet', veterinario: 'vet', herrador: 'hammer', recordatorio: 'bell', documento: 'doc', nota: 'note' };
  function regRow(r, conCaballo = true) {
    const bits = [fdate(r.fecha)];
    if (conCaballo) bits.push(esc(cName(r.caballoId)));
    if (r.tipo === 'recordatorio' && r.responsableId) bits.push(esc(uName(r.responsableId)));
    let end = '';
    if (r.importe != null && r.importe !== '') end = `<span class="money">${money(r.importe)}</span>` + (r.tipo === 'gasto' || r.pagado !== undefined ? (r.pagado ? '' : ' <span class="chip warn">Pendiente</span>') : '');
    if (r.tipo === 'recordatorio') end = r.hecho ? '<span class="chip ok">Hecho</span>' : (r.fecha < F.today() ? '<span class="chip danger">Vencido</span>' : '');
    const txt = r.tipo === 'nota' ? esc(r.nota).slice(0, 90) : esc(r.concepto || TIPOS_REG[r.tipo].l);
    return row({ icon: REG_ICON[r.tipo], t: txt, s: bits.join(' · '), end, data: `data-reg="${r.id}"` });
  }
  function bindRegs(root) {
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-reg]');
      if (b) editarRegistro(S().registros.find(r => r.id === b.dataset.reg));
    });
  }

  /* ================= Formularios de entidades ================= */
  function sedeForm(s) {
    const nueva = !s;
    s = s || { id: E.uid('s'), nombre: '', direccion: '', color: PALETA[0], tipo: 'Centro con escuela', notas: '', zonas: [] };
    const fields = [
      { key: 'nombre', label: 'Nombre', req: true, ph: 'Sede norte' },
      { key: 'direccion', label: 'Dirección', ph: 'Opcional' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['Centro con escuela', 'Pupilaje', 'Escuela', 'Competición', 'Otra'].map(x => ({ v: x, l: x })) },
      { key: 'color', label: 'Color', type: 'color' },
      { key: 'zonas', label: 'Pistas, zonas o boxes', ph: 'Pista 1, Pista cubierta, Paddock A', hint: 'Separadas por comas.' },
      { key: 'notas', label: 'Notas', type: 'textarea' }
    ];
    if (nueva) fields.push({ type: 'title', label: 'Crear dentro' }, { key: 'crear', label: 'Carpetas', type: 'chips', options: [{ v: 'escuela', l: 'Escuela' }, { v: 'cg', l: 'Cuadra general' }], def: ['escuela', 'cg'] });
    openForm({
      title: nueva ? 'Nueva sede' : 'Editar sede', fields, values: Object.assign({}, s, { zonas: (s.zonas || []).join(', ') }),
      onSave: v => {
        Object.assign(s, v, { zonas: v.zonas.split(',').map(z => z.trim()).filter(Boolean) });
        delete s.crear;
        if (nueva) {
          S().sedes.push(s);
          if ((v.crear || []).includes('escuela')) S().escuelas.push({ id: E.uid('e'), sedeId: s.id, nombre: 'Escuela ' + s.nombre });
          if ((v.crear || []).includes('cg')) S().cuadrasGenerales.push({ id: E.uid('g'), sedeId: s.id, nombre: 'Cuadra general ' + s.nombre });
        }
        toast(nueva ? 'Sede creada' : 'Sede guardada');
      },
      onDelete: nueva ? null : () => {
        if (!confirmar('¿Eliminar la sede? Sus escuelas y cuadras generales también se eliminarán. Los caballos se conservan sin sede.')) return false;
        const st = S();
        st.sedes = st.sedes.filter(x => x.id !== s.id);
        const eIds = st.escuelas.filter(x => x.sedeId === s.id).map(x => x.id);
        const gIds = st.cuadrasGenerales.filter(x => x.sedeId === s.id).map(x => x.id);
        st.escuelas = st.escuelas.filter(x => x.sedeId !== s.id);
        st.cuadrasGenerales = st.cuadrasGenerales.filter(x => x.sedeId !== s.id);
        st.cuadrasPrivadas.forEach(x => { if (x.sedeId === s.id) x.sedeId = ''; });
        st.caballos.forEach(c => { if (c.sedeId === s.id) c.sedeId = ''; if (gIds.includes(c.cuadraGeneralId)) c.cuadraGeneralId = ''; if (eIds.includes(c.escuelaId)) c.escuelaId = ''; });
        if (PAGE === 'sede') setTimeout(() => go('carpetas'), 50);
      }
    });
  }
  function simpleForm(kind, x, preset = {}) {
    const cfg = {
      escuela: { arr: 'escuelas', t: 'escuela', p: 'e', ph: 'Escuela' },
      cg: { arr: 'cuadrasGenerales', t: 'cuadra general', p: 'g', ph: 'Cuadra general' },
      cp: { arr: 'cuadrasPrivadas', t: 'cuadra privada', p: 'p', ph: 'Cuadra privada' }
    }[kind];
    const nueva = !x;
    x = x || Object.assign({ id: E.uid(cfg.p), nombre: '', sedeId: '' }, kind === 'cp' ? { adminId: E.me().id, accesos: [], notas: '' } : {}, preset);
    const fields = [
      { key: 'nombre', label: 'Nombre', req: true, ph: cfg.ph + ' ' + ((sedeDe(x.sedeId) || {}).nombre || '') },
      { key: 'sedeId', label: 'Sede', type: 'select', options: opt(S().sedes, 'nombre', kind === 'cp' ? 'Sin sede' : undefined), req: kind !== 'cp' }
    ];
    if (kind === 'cp') fields.push({ key: 'adminId', label: 'Administra', type: 'select', options: optUsers(), hint: 'Quien la administra la ve completa y decide con quién compartirla.' }, { key: 'notas', label: 'Notas', type: 'textarea' });
    if (!S().sedes.length && kind !== 'cp') { toast('Crea primero una sede'); return; }
    openForm({
      title: (nueva ? 'Nueva ' : 'Editar ') + cfg.t, fields, values: x,
      onSave: v => { Object.assign(x, v); if (nueva) S()[cfg.arr].push(x); toast('Guardado'); },
      onDelete: nueva ? null : () => {
        if (!confirmar('¿Eliminar ' + cfg.t + '? Los caballos se conservan.')) return false;
        S()[cfg.arr] = S()[cfg.arr].filter(y => y.id !== x.id);
        S().caballos.forEach(c => {
          if (kind === 'cg' && c.cuadraGeneralId === x.id) c.cuadraGeneralId = '';
          if (kind === 'cp' && c.cuadraPrivadaId === x.id) c.cuadraPrivadaId = '';
          if (kind === 'escuela' && c.escuelaId === x.id) c.escuelaId = '';
        });
        if (['cuadra-privada', 'cuadra-general', 'escuela'].includes(PAGE)) setTimeout(() => go('carpetas'), 50);
      }
    });
  }
  function userForm(u) {
    const yo = E.me();
    const admin = E.puedeConfig(yo);
    const nueva = !u;
    u = u || { id: E.uid('u'), nombre: '', mote: '', foto: '', contacto: '', color: PALETA[1], roles: [], vistaInicial: 'caballos', permisos: { ...E.PERMISOS_BASE }, atajos: {} };
    const fields = [
      { key: 'foto', label: 'Foto', type: 'photo' },
      { key: 'nombre', label: 'Nombre', req: true },
      { key: 'mote', label: 'Mote', ph: 'Cómo aparece en la pizarra', hint: 'La inicial y el color identifican a la persona en la pizarra.' },
      { key: 'contacto', label: 'Email o teléfono', ph: 'Opcional' },
      { key: 'color', label: 'Color', type: 'color' }
    ];
    if (admin) fields.push(
      { type: 'title', label: 'Roles y vista' },
      { key: 'roles', label: 'Roles (puede tener varios)', type: 'chips', options: Object.entries(E.ROLES).map(([v, l]) => ({ v, l })) },
      { key: 'vistaInicial', label: 'Vista inicial', type: 'select', options: Object.entries(E.VISTAS).map(([v, o]) => ({ v, l: o.nombre })) },
      { type: 'title', label: 'Permisos' },
      { key: 'p_economia', label: 'Ver datos económicos', type: 'toggle' },
      { key: 'p_crear', label: 'Crear registros', type: 'toggle' },
      { key: 'p_editarCaballos', label: 'Crear y editar caballos', type: 'toggle' },
      { key: 'p_verPrivadas', label: 'Ver todas las cuadras privadas', type: 'toggle', hint: 'Normalmente desactivado: cada cuadra privada se comparte desde dentro.' },
      { key: 'p_config', label: 'Configurar el centro', type: 'toggle' },
      { key: 'p_global', label: 'Acceso total', type: 'toggle', hint: 'Ve todo, incluido lo privado. Úsalo con cuidado.' }
    );
    const vals = Object.assign({}, u);
    Object.keys(E.PERMISOS_BASE).forEach(k => { vals['p_' + k] = u.permisos[k]; });
    openForm({
      title: nueva ? 'Nuevo perfil' : 'Editar perfil', fields, values: vals,
      onSave: v => {
        ['foto', 'nombre', 'mote', 'contacto', 'color'].forEach(k => { u[k] = v[k]; });
        if (admin) {
          u.roles = v.roles; u.vistaInicial = v.vistaInicial;
          Object.keys(E.PERMISOS_BASE).forEach(k => { u.permisos[k] = !!v['p_' + k]; });
        }
        if (nueva) S().usuarios.push(u);
        toast(nueva ? 'Perfil creado' : 'Perfil guardado');
      },
      onDelete: nueva || !admin || u.id === yo.id ? null : () => {
        if (!confirmar('¿Eliminar este perfil?')) return false;
        S().usuarios = S().usuarios.filter(x => x.id !== u.id);
        S().caballos.forEach(c => { c.propietarios = c.propietarios.filter(p => p.userId !== u.id); if (c.responsableId === u.id) c.responsableId = ''; c.accesos = c.accesos.filter(a => a.userId !== u.id); });
        S().cuadrasPrivadas.forEach(cp => { cp.accesos = cp.accesos.filter(a => a.userId !== u.id); });
      }
    });
  }
  function caballoForm(c, preset = {}) {
    const nueva = !c;
    const yo = E.me();
    c = c || Object.assign({ id: E.uid('c'), nombre: '', foto: '', tipo: 'caballo', propietarios: yo.roles.includes('propietario') ? [{ userId: yo.id, pct: 100 }] : [], responsableId: '', sedeId: (S().sedes[0] || {}).id || '', cuadraGeneralId: '', cuadraPrivadaId: '', escuelaId: '', usoEscuela: false, box: '', estado: 'Activo', mensualidad: '', notasCentro: '', notas: '', accesos: [] }, preset);
    if (nueva && c.cuadraPrivadaId && !c.sedeId) c.sedeId = (E.get.cp(c.cuadraPrivadaId) || {}).sedeId || '';
    if (nueva && !c.cuadraGeneralId) c.cuadraGeneralId = (S().cuadrasGenerales.find(g => g.sedeId === c.sedeId) || {}).id || '';
    const fields = [
      { key: 'foto', label: 'Foto', type: 'photo' },
      { key: 'nombre', label: 'Nombre', req: true },
      { key: 'tipo', label: 'Tipo', type: 'segment', options: [{ v: 'caballo', l: 'Caballo' }, { v: 'pony', l: 'Pony' }] },
      { key: 'estado', label: 'Estado', type: 'segment', options: ['Activo', 'Descanso', 'Lesionado', 'Baja'].map(x => ({ v: x, l: x })) },
      { type: 'title', label: 'Propiedad' },
      { key: 'propietarios', label: 'Propietarios y % (opcional)', type: 'owners', hint: 'Sin propietario = caballo del centro.' },
      { key: 'responsableId', label: 'Jinete / responsable', type: 'select', options: optUsers('Sin responsable') },
      { type: 'title', label: 'Dónde está' },
      { key: 'sedeId', label: 'Sede actual', type: 'select', options: opt(S().sedes, 'nombre', 'Sin sede') },
      { key: 'cuadraGeneralId', label: 'Cuadra general (alojamiento)', type: 'select', options: opt(S().cuadrasGenerales.map(conSede), 'nombre', 'Ninguna') },
      { key: 'box', label: 'Box o ubicación', ph: 'B3' },
      { key: 'cuadraPrivadaId', label: 'Cuadra privada', type: 'select', options: opt(S().cuadrasPrivadas.filter(cp => E.cuadraAcceso(yo, cp) || cp.id === c.cuadraPrivadaId || E.puedeConfig(yo)).map(conSede), 'nombre', 'Ninguna') },
      { type: 'title', label: 'Centro' },
      { key: 'mensualidad', label: 'Mensualidad del centro (€)', type: 'number', ph: '0' },
      { key: 'usoEscuela', label: 'Disponible para escuela', type: 'toggle' },
      { key: 'escuelaId', label: 'Escuela', type: 'select', options: opt(S().escuelas.map(conSede), 'nombre', 'Cualquiera de su sede'), when: v => v.usoEscuela },
      { key: 'notasCentro', label: 'Observaciones del centro', type: 'textarea' },
      { type: 'title', label: 'Privado' },
      { key: 'notas', label: 'Notas privadas', type: 'textarea' },
      { key: 'accesos', label: 'Accesos a este caballo', type: 'accesos', hint: 'Copropietario, jinete, veterinario o invitado.' }
    ];
    openForm({
      title: nueva ? 'Nuevo caballo' : 'Editar caballo', fields, values: c,
      onSave: v => {
        Object.assign(c, v);
        c.mensualidad = +v.mensualidad || 0;
        if (!c.usoEscuela) c.escuelaId = '';
        const g = E.get.cg(c.cuadraGeneralId); if (g && !c.sedeId) c.sedeId = g.sedeId;
        if (nueva) S().caballos.push(c);
        toast(nueva ? 'Caballo creado' : 'Caballo guardado');
      },
      onDelete: nueva ? null : () => {
        if (!confirmar('¿Eliminar ' + c.nombre + ' y todos sus registros?')) return false;
        const st = S();
        st.caballos = st.caballos.filter(x => x.id !== c.id);
        st.registros = st.registros.filter(r => r.caballoId !== c.id);
        st.pizarra = st.pizarra.filter(p => p.caballoId !== c.id);
        st.cobros = st.cobros.filter(k => k.caballoId !== c.id);
        if (PAGE === 'caballo') setTimeout(() => history.length > 1 ? history.back() : go('index'), 50);
      }
    });
  }
  const profesores = () => S().usuarios.filter(u => u.roles.includes('profesor'));
  const caballosEscuela = eid => { const e = E.get.escuela(eid); return S().caballos.filter(c => c.usoEscuela && c.estado !== 'Baja' && (c.escuelaId === eid || (!c.escuelaId && e && c.sedeId === e.sedeId))); };
  function alumnoForm(a, escuelaId) {
    const nueva = !a;
    a = a || { id: E.uid('a'), escuelaId: escuelaId || (S().escuelas[0] || {}).id, nombre: '', foto: '', edad: '', nivel: 'Iniciación', contacto: '', profesorId: E.me().roles.includes('profesor') ? E.me().id : '', caballoId: '', bonoTotal: 0, bonoBase: 0, notas: '' };
    const fields = [
      { key: 'foto', label: 'Foto', type: 'photo' },
      { key: 'nombre', label: 'Nombre', req: true },
      { key: 'edad', label: 'Edad', type: 'number', ph: 'Opcional' },
      { key: 'nivel', label: 'Nivel', type: 'segment', options: ['Iniciación', 'Básico', 'Medio', 'Avanzado', 'Competición'].map(x => ({ v: x, l: x })) },
      { key: 'contacto', label: 'Responsable / teléfono', type: 'tel', ph: 'Opcional' },
      { key: 'escuelaId', label: 'Escuela', type: 'select', options: opt(S().escuelas.map(conSede)) },
      { key: 'profesorId', label: 'Profesor/a habitual', type: 'select', options: opt(profesores(), 'nombre', '—') },
      { key: 'caballoId', label: 'Caballo / pony habitual', type: 'select', options: opt(caballosEscuela(a.escuelaId), 'nombre', '—') },
      { key: 'bonoTotal', label: 'Clases del bono', type: 'number', ph: '0 = sin bono' },
      { key: 'notas', label: 'Observaciones', type: 'textarea' }
    ];
    openForm({
      title: nueva ? 'Nuevo alumno' : 'Editar alumno', fields, values: a,
      onSave: v => { Object.assign(a, v, { bonoTotal: +v.bonoTotal || 0 }); if (nueva) S().alumnos.push(a); toast('Guardado'); },
      onDelete: nueva ? null : () => {
        if (!confirmar('¿Eliminar alumno?')) return false;
        S().alumnos = S().alumnos.filter(x => x.id !== a.id);
        S().clases.forEach(k => { k.alumnos = k.alumnos.filter(x => x.alumnoId !== a.id); });
        if (PAGE === 'alumno') setTimeout(() => go('escuela', { id: a.escuelaId, tab: 'alumnos' }), 50);
      }
    });
  }
  function claseForm(k, escuelaId, fecha) {
    const nueva = !k;
    const eid = (k && k.escuelaId) || escuelaId;
    const esc_ = E.get.escuela(eid);
    const sede = esc_ && sedeDe(esc_.sedeId);
    k = k || { id: E.uid('k'), escuelaId: eid, tipo: 'Grupo', fecha: fecha || F.today(), hora: '17:00', duracion: 60, profesorId: E.me().roles.includes('profesor') ? E.me().id : ((profesores()[0] || {}).id || ''), pista: (sede && sede.zonas[0]) || '', aforo: 6, precio: 25, notas: '', alumnos: [] };
    const alumnos = S().alumnos.filter(a => a.escuelaId === eid);
    const fields = [
      { key: 'tipo', label: 'Tipo de clase', type: 'segment', options: S().tiposClase.map(x => ({ v: x, l: x })) },
      { key: 'fecha', label: 'Fecha', type: 'date', req: true },
      { key: 'hora', label: 'Hora', type: 'time', req: true },
      { key: 'duracion', label: 'Duración (min)', type: 'number' },
      { key: 'profesorId', label: 'Profesor/a', type: 'select', options: opt(profesores(), 'nombre', '—') },
      { key: 'pista', label: 'Pista', type: 'select', options: [{ v: '', l: '—' }].concat(((sede && sede.zonas) || []).map(z => ({ v: z, l: z }))) },
      { key: 'aforo', label: 'Aforo máximo', type: 'number', when: v => v.tipo !== 'Particular' },
      { key: 'precio', label: 'Precio por alumno (€)', type: 'number' }
    ];
    if (nueva) fields.push({ key: 'alumnosSel', label: 'Alumnos', type: 'chips', options: alumnos.map(a => ({ v: a.id, l: a.nombre })), hint: 'Podrás asignar caballo a cada uno al abrir la clase.' });
    fields.push({ key: 'notas', label: 'Notas', type: 'textarea' });
    openForm({
      title: nueva ? 'Nueva clase' : 'Datos de la clase', fields, values: k,
      onSave: v => {
        const sel = v.alumnosSel || [];
        delete v.alumnosSel;
        if (v.tipo === 'Particular') { v.aforo = 1; if (nueva && sel.length > 1) { toast('Una clase particular es de un solo alumno'); return false; } }
        if (nueva && v.aforo && sel.length > +v.aforo) { toast('Hay más alumnos que aforo'); return false; }
        Object.assign(k, v, { aforo: +v.aforo || 1, precio: +v.precio || 0, duracion: +v.duracion || 60 });
        if (nueva) {
          k.alumnos = sel.map(id => { const a = E.get.alumno(id); return { alumnoId: id, caballoId: a.caballoId || '', asistencia: null, modo: a.bonoTotal ? 'bono' : 'suelta', recuperacion: false, pagado: false }; });
          S().clases.push(k);
        }
        toast(nueva ? 'Clase creada' : 'Clase guardada');
      },
      onDelete: nueva ? null : () => { if (!confirmar('¿Eliminar clase?')) return false; S().clases = S().clases.filter(x => x.id !== k.id); }
    });
  }
  /* Detalle de clase: alumnos, caballos, asistencia */
  function claseSheet(k) {
    const w = JSON.parse(JSON.stringify(k));
    const u = E.me();
    const eco = E.puedeEconomia(u);
    const horses = caballosEscuela(k.escuelaId);
    const body = document.createElement('div');
    function draw() {
      const usados = {};
      w.alumnos.forEach(x => { if (x.caballoId) usados[x.caballoId] = (usados[x.caballoId] || 0) + 1; });
      const libres = S().alumnos.filter(a => a.escuelaId === w.escuelaId && !w.alumnos.some(x => x.alumnoId === a.id));
      const lleno = w.alumnos.length >= (w.tipo === 'Particular' ? 1 : +w.aforo || 99);
      body.innerHTML = `
        <div class="card" style="padding:14px 16px;margin-top:6px;display:flex;gap:14px;align-items:center">
          <div class="time">${esc(w.hora)}</div>
          <div style="flex:1"><b>${esc(w.tipo)}</b><div class="s muted small">${fdate(w.fecha)} · ${esc(w.pista || 'Sin pista')} · ${esc(uName(w.profesorId) || 'Sin profesor')}</div></div>
          <button type="button" class="btn sm ghost" data-edit>Editar</button>
        </div>
        <div class="form-title">Alumnos ${w.alumnos.length}/${w.tipo === 'Particular' ? 1 : w.aforo}</div>
        <div class="card">${w.alumnos.map((x, i) => {
          const a = E.get.alumno(x.alumnoId) || { nombre: '—' };
          const rs = a.id ? E.alumnoResumen(a) : {};
          return `<div class="student" data-i="${i}">
            <div class="top">${av({ nombre: a.nombre, color: '#8C8377', foto: a.foto }, 34)}<span class="t">${esc(a.nombre)}</span>
              <div class="att" role="group" aria-label="Asistencia"><button type="button" class="yes ${x.asistencia === true ? 'on' : ''}" data-att="1" aria-label="Asiste">${ic('check', 's')}</button><button type="button" class="no ${x.asistencia === false ? 'on' : ''}" data-att="0" aria-label="Falta">${ic('x', 's')}</button></div></div>
            <select data-horse aria-label="Caballo o pony para ${esc(a.nombre)}"><option value="">Sin caballo asignado</option>${horses.map(h => `<option value="${h.id}" ${h.id === x.caballoId ? 'selected' : ''}>${esc(h.nombre)}${usados[h.id] > 1 && h.id === x.caballoId ? ' (repetido)' : ''}</option>`).join('')}</select>
            <div class="opts">
              <div class="pick" style="padding:0"><label><input type="radio" name="m${i}" value="bono" ${x.modo === 'bono' ? 'checked' : ''} data-modo><span>Bono${a.bonoTotal ? ` · quedan ${rs.restantes}` : ''}</span></label><label><input type="radio" name="m${i}" value="suelta" ${x.modo === 'suelta' ? 'checked' : ''} data-modo><span>Suelta</span></label>
              <label><input type="checkbox" ${x.recuperacion ? 'checked' : ''} data-rec><span>Recuperación</span></label>
              ${eco && x.modo === 'suelta' ? `<label><input type="checkbox" ${x.pagado ? 'checked' : ''} data-pag><span>Pagada</span></label>` : ''}</div>
              <button type="button" class="link" data-quitar style="margin-left:auto">Quitar</button>
            </div></div>`;
        }).join('') || '<div class="empty">Sin alumnos todavía.</div>'}</div>
        ${libres.length && !lleno ? `<div class="group" style="margin-top:12px"><div class="field"><label class="lab" for="addA">Añadir alumno</label><select id="addA"><option value="">Elegir…</option>${libres.map(a => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('')}</select></div></div>` : ''}
        ${lleno && w.tipo !== 'Particular' ? '<p class="muted small" style="margin:10px 6px">Clase completa.</p>' : ''}
        <div class="group"><div class="field"><label class="lab" for="knotas">Notas</label><textarea id="knotas">${esc(w.notas)}</textarea></div></div>`;
    }
    body.addEventListener('click', e => {
      const st = e.target.closest('.student');
      if (e.target.closest('[data-edit]')) { commit(); api.close(true); claseForm(k); return; }
      if (!st) return;
      const x = w.alumnos[+st.dataset.i];
      const att = e.target.closest('[data-att]');
      if (att) { const val = att.dataset.att === '1'; x.asistencia = x.asistencia === val ? null : val; draw(); }
      if (e.target.closest('[data-quitar]')) { w.alumnos.splice(+st.dataset.i, 1); draw(); }
    });
    body.addEventListener('change', e => {
      if (e.target.id === 'addA' && e.target.value) {
        const a = E.get.alumno(e.target.value);
        w.alumnos.push({ alumnoId: a.id, caballoId: a.caballoId || '', asistencia: null, modo: a.bonoTotal ? 'bono' : 'suelta', recuperacion: false, pagado: false });
        draw(); return;
      }
      if (e.target.id === 'knotas') { w.notas = e.target.value; return; }
      const st = e.target.closest('.student'); if (!st) return;
      const x = w.alumnos[+st.dataset.i];
      if (e.target.matches('[data-horse]')) { x.caballoId = e.target.value; draw(); }
      if (e.target.matches('[data-modo]')) { x.modo = e.target.value; draw(); }
      if (e.target.matches('[data-rec]')) x.recuperacion = e.target.checked;
      if (e.target.matches('[data-pag]')) x.pagado = e.target.checked;
    });
    function commit() { const n = $('#knotas', body); if (n) w.notas = n.value; Object.assign(k, w); save(); }
    const api = sheet({ title: 'Clase', body, done: () => { commit(); refresh(); toast('Clase guardada'); } });
    draw();
  }

  /* ================= Hoy importa ================= */
  function hoyImporta(u, vista, cuadraId) {
    const t = F.today(), st = S(), it = [];
    const regs = st.registros.filter(r => E.verRegistro(u, r));
    let horses;
    if (cuadraId) horses = st.caballos.filter(c => c.cuadraPrivadaId === cuadraId);
    else if (vista === 'cuadra') horses = st.caballos.filter(c => c.cuadraPrivadaId && E.cuadraAcceso(u, E.get.cp(c.cuadraPrivadaId)));
    else if (vista === 'caballos') horses = E.misCaballos(u);
    else horses = E.caballosVisibles(u);
    const hs = new Set(horses.map(c => c.id));
    const cab = id => E.get.caballo(id) || { nombre: '' };
    if (cuadraId || vista === 'cuadra' || vista === 'caballos') {
      const pz = st.pizarra.filter(p => hs.has(p.caballoId) && p.fecha === t);
      pz.filter(p => !p.hecho && p.codigos.some(c => c === 'VET' || c === 'H')).forEach(p => it.push({ i: p.codigos.includes('VET') ? 'vet' : 'hammer', tone: 'danger', t: `${esc(cab(p.caballoId).nombre)}: ${p.codigos.includes('VET') ? 'veterinario' : 'herrador'} hoy`, s: esc(p.nota || ''), h: href('caballo', { id: p.caballoId, cuadra: cuadraId }) }));
      regs.filter(r => hs.has(r.caballoId) && r.tipo === 'recordatorio' && !r.hecho && r.fecha <= F.addDays(t, 7)).sort((a, b) => a.fecha.localeCompare(b.fecha))
        .forEach(r => it.push({ i: 'bell', tone: r.fecha <= t ? 'warn' : '', t: `${esc(r.concepto)}`, s: `${esc(cab(r.caballoId).nombre)} · ${r.fecha < t ? 'vencido ' : ''}${fdate(r.fecha)}`, reg: r.id }));
      const gp = regs.filter(r => hs.has(r.caballoId) && r.tipo === 'gasto' && !r.pagado);
      if (gp.length) it.push({ i: 'wallet', tone: 'warn', t: `${gp.length} gasto${gp.length > 1 ? 's' : ''} pendiente${gp.length > 1 ? 's' : ''}`, s: money(gp.reduce((a, r) => a + (+r.importe || 0), 0)), h: cuadraId ? href('cuadra-privada', { id: cuadraId }, '#gastos') : href('mis-caballos', { tab: 'gastos' }) });
      if (cuadraId || vista === 'cuadra') {
        const sin = horses.filter(c => c.estado === 'Activo' && !pz.some(p => p.caballoId === c.id && p.codigos.length));
        if (sin.length && horses.length) it.push({ i: 'grid', tone: '', t: sin.length === 1 ? `${esc(sin[0].nombre)} sin plan hoy` : `${sin.length} caballos sin plan hoy`, s: 'Pizarra sin completar', h: href('pizarra', { cuadra: cuadraId || cuadraSesion(u) }) });
        pz.filter(p => p.codigos.includes('M') && !p.personaId).forEach(p => it.push({ i: 'user', tone: 'warn', t: `${esc(cab(p.caballoId).nombre)}: monta sin responsable`, s: 'Asigna quién lo monta hoy', h: href('pizarra', { cuadra: cuadraId || cuadraSesion(u) }) }));
      }
    }
    if (vista === 'clases') {
      const mias = st.clases.filter(k => k.fecha === t && (k.profesorId === u.id || !E.has(u, 'profesor'))).sort((a, b) => a.hora.localeCompare(b.hora));
      mias.forEach(k => {
        const sinC = k.alumnos.filter(x => !x.caballoId).length;
        it.push({ i: 'cal', tone: sinC ? 'warn' : '', t: `${esc(k.hora)} · ${esc(k.tipo)}`, s: `${k.alumnos.length}/${k.tipo === 'Particular' ? 1 : k.aforo} alumnos${sinC ? ` · ${sinC} sin caballo` : ''} · ${esc(k.pista || '')}`, clase: k.id });
      });
      const al = st.alumnos.filter(a => st.clases.some(k => k.profesorId === u.id && k.alumnos.some(x => x.alumnoId === a.id)) || !E.has(u, 'profesor'));
      const res = al.map(a => [a, E.alumnoResumen(a)]);
      const pend = res.filter(([, r]) => r.pendiente > 0);
      if (pend.length && E.puedeEconomia(u)) it.push({ i: 'euro', tone: 'warn', t: `${pend.length} alumno${pend.length > 1 ? 's' : ''} con pago pendiente`, s: money(pend.reduce((a, [, r]) => a + r.pendiente, 0)), h: href('escuela', { id: escuelaSesion(u), tab: 'cobros' }) });
      const rec = res.filter(([, r]) => r.recuperaciones > 0);
      if (rec.length) it.push({ i: 'repeat', tone: '', t: `${rec.length} recuperación${rec.length > 1 ? 'es' : ''} pendiente${rec.length > 1 ? 's' : ''}`, s: rec.map(([a]) => esc(a.nombre)).join(', '), h: href('escuela', { id: escuelaSesion(u), tab: 'alumnos' }) });
    }
    if (vista === 'gerencia' || vista === 'admin') {
      const mes = t.slice(0, 7);
      if (E.puedeEconomia(u)) {
        E.asegurarMensualidades(mes);
        const pm = st.cobros.filter(k => k.mes <= mes && !k.pagado);
        if (pm.length) it.push({ i: 'euro', tone: 'warn', t: `${pm.length} cobro${pm.length > 1 ? 's' : ''} del centro pendiente${pm.length > 1 ? 's' : ''}`, s: money(pm.reduce((a, k) => a + (+k.importe || 0), 0)), h: href('cuadra-general', { tab: 'cobros' }) });
      }
      const sinResp = st.caballos.filter(c => c.propietarios.length && !c.responsableId && c.estado !== 'Baja');
      if (sinResp.length) it.push({ i: 'user', tone: '', t: `${sinResp.length} caballo${sinResp.length > 1 ? 's' : ''} sin responsable`, s: sinResp.slice(0, 3).map(c => esc(c.nombre)).join(', '), h: href('caballos') });
      regs.filter(r => r.tipo === 'recordatorio' && !r.hecho && !r.responsableId && r.fecha <= F.addDays(t, 7)).forEach(r => it.push({ i: 'bell', tone: 'warn', t: `${esc(r.concepto)} sin responsable`, s: `${esc(cab(r.caballoId).nombre)} · ${fdate(r.fecha)}`, reg: r.id }));
      if (vista === 'admin') {
        const pend = st.alumnos.map(a => E.alumnoResumen(a)).filter(r => r.pendiente > 0);
        if (pend.length && E.puedeEconomia(u)) it.push({ i: 'cap', tone: 'warn', t: `${pend.length} alumno${pend.length > 1 ? 's' : ''} con clases sin pagar`, s: money(pend.reduce((a, r) => a + r.pendiente, 0)), h: href('escuela', { id: escuelaSesion(u), tab: 'cobros' }) });
      }
      st.cuadrasPrivadas.filter(cp => cp.adminId !== u.id && cp.accesos.some(a => a.userId === u.id)).forEach(cp => it.push({ i: 'share', tone: '', t: `${esc(cp.nombre)} compartida contigo`, s: uName(cp.adminId) ? 'De ' + esc(uName(cp.adminId)) : '', h: href('cuadra-privada', { id: cp.id }) }));
    }
    return it.slice(0, 6);
  }
  function hoyHTML(items) {
    if (!items.length) return `<div class="card ok-line">${tile('check')}<span><b style="color:var(--ink)">Todo en orden</b><br><span class="small">Nada urgente por ahora.</span></span></div>`;
    return `<div class="list">${items.map(x => {
      const lead = tile(x.i, x.tone);
      if (x.h) return row({ href: x.h, lead, t: x.t, s: x.s, cls: 'today-item' });
      return row({ lead, t: x.t, s: x.s, cls: 'today-item', data: x.reg ? `data-reg="${x.reg}"` : x.clase ? `data-clase="${x.clase}"` : '', end: ic('chev', 's') });
    }).join('')}</div>`;
  }
  function bindHoy(root) {
    bindRegs(root);
    root.addEventListener('click', e => { const b = e.target.closest('[data-clase]'); if (b) claseSheet(E.get.clase(b.dataset.clase)); });
  }

  /* ================= Páginas ================= */
  const pages = {};

  /* ---------- Bienvenida y asistente ---------- */
  function bienvenida() {
    document.title = 'Configurar centro · EquiLog';
    const app = $('#app');
    let paso = 0;
    const datos = { centro: { nombre: '', color: PALETA[0], logo: '' }, sede: { nombre: '', direccion: '', crear: ['escuela', 'cg'] }, yo: { nombre: '', mote: '', color: PALETA[2], roles: ['gerente'] } };
    const pasos = [
      { t: 'Tu centro', f: [{ key: 'nombre', label: 'Nombre del centro', req: true, ph: 'Club Hípico…' }, { key: 'logo', label: 'Logo o foto (opcional)', type: 'photo' }, { key: 'color', label: 'Color principal', type: 'color' }], d: 'centro' },
      { t: 'Primera sede', f: [{ key: 'nombre', label: 'Nombre de la sede', req: true, ph: 'Sede principal' }, { key: 'direccion', label: 'Dirección', ph: 'Opcional' }, { key: 'crear', label: 'Qué hay en esta sede', type: 'chips', options: [{ v: 'escuela', l: 'Escuela' }, { v: 'cg', l: 'Cuadra general' }] }], d: 'sede', note: 'Podrás crear más sedes, cuadras privadas y caballos desde Configuración.' },
      { t: 'Tu perfil', f: [{ key: 'nombre', label: 'Tu nombre', req: true }, { key: 'mote', label: 'Mote', ph: 'Opcional' }, { key: 'color', label: 'Tu color', type: 'color' }, { key: 'roles', label: 'Tus roles', type: 'chips', options: Object.entries(E.ROLES).map(([v, l]) => ({ v, l })) }], d: 'yo' }
    ];
    function inicio() {
      app.innerHTML = `<div class="welcome"><div class="logo-mark">${ic('shoe')}</div><h1>EquiLog</h1><p class="lead">Tu centro ecuestre, ordenado por carpetas: sedes, cuadras, caballos, pizarra y clases.</p>
        <div style="display:grid;gap:10px"><button class="btn block" id="cfg">Configurar mi centro</button><button class="btn ghost block" id="demo">Probar con datos de ejemplo</button></div>
        <p class="muted small" style="margin-top:22px">Los datos se guardan solo en este dispositivo.</p></div>`;
      $('#cfg').onclick = () => { paso = 0; dibujar(); };
      $('#demo').onclick = () => { E.reset(true); go('index'); };
    }
    function dibujar() {
      const p = pasos[paso];
      app.innerHTML = `<div class="welcome"><div class="steps">${pasos.map((_, i) => `<i class="${i <= paso ? 'on' : ''}"></i>`).join('')}</div><h1>${p.t}</h1>${p.note ? `<p class="lead">${p.note}</p>` : ''}<div id="wf">${formHTML(p.f, datos[p.d])}</div>
        <div class="btns" style="margin-top:8px"><button class="btn ghost" id="atras" type="button">Atrás</button><button class="btn" id="sig" type="button">${paso === pasos.length - 1 ? 'Empezar' : 'Siguiente'}</button></div></div>`;
      const fm = $('#wf'); bindForm(fm, p.f);
      $('#atras').onclick = () => { Object.assign(datos[p.d], readForm(fm, p.f)); paso ? (paso--, dibujar()) : inicio(); };
      $('#sig').onclick = () => {
        const v = readForm(fm, p.f);
        for (const f of p.f) if (f.req && !v[f.key]) { toast('Falta: ' + f.label); return; }
        Object.assign(datos[p.d], v);
        if (paso < pasos.length - 1) { paso++; dibujar(); return; }
        terminar();
      };
    }
    function terminar() {
      E.reset(false);
      const st = S();
      st.centro = { nombre: datos.centro.nombre, color: datos.centro.color, logo: datos.centro.logo };
      const sid = E.uid('s');
      st.sedes.push({ id: sid, nombre: datos.sede.nombre, direccion: datos.sede.direccion, color: datos.centro.color, tipo: 'Centro con escuela', notas: '', zonas: [] });
      if (datos.sede.crear.includes('escuela')) st.escuelas.push({ id: E.uid('e'), sedeId: sid, nombre: 'Escuela ' + datos.sede.nombre });
      if (datos.sede.crear.includes('cg')) st.cuadrasGenerales.push({ id: E.uid('g'), sedeId: sid, nombre: 'Cuadra general ' + datos.sede.nombre });
      const roles = datos.yo.roles.length ? datos.yo.roles : ['gerente'];
      const uid = E.uid('u');
      st.usuarios.push({ id: uid, nombre: datos.yo.nombre, mote: datos.yo.mote, foto: '', contacto: '', color: datos.yo.color, roles, vistaInicial: roles.includes('gerente') ? 'gerencia' : 'caballos', permisos: { ...E.PERMISOS_BASE, economia: true, editarCaballos: true, config: true }, atajos: {} });
      st.sesion = { userId: uid, vista: null, cuadraId: null, escuelaId: null };
      save(); go('index');
    }
    inicio();
  }

  /* ---------- Inicio ---------- */
  pages.index = function () {
    if (!S().centro || !S().usuarios.length) return bienvenida();
    const u = E.me();
    const v = vistaActual(u);
    CTX = { vista: v };
    const main = shell({ title: 'Hola, ' + (u.mote || u.nombre), sub: S().centro.nombre });
    const vs = E.vistasDe(u);
    const cuadras = E.cuadrasDe(u);
    const at = atajosDe(u, v);
    main.innerHTML = `
      ${vs.length > 1 ? section('Mis vistas') + `<div class="views">${vs.map(k => `<button type="button" class="view ${k === v ? 'on' : ''}" data-vista="${k}" aria-pressed="${k === v}">${tile(E.VISTAS[k].icon)}<b>${E.VISTAS[k].nombre}</b><span>${E.VISTAS[k].desc}</span></button>`).join('')}</div>` : ''}
      ${v === 'cuadra' ? section(cuadras.length > 1 ? 'Tus cuadras' : 'Tu cuadra') + `<div class="list">${cuadras.map(cp => row({ href: href('cuadra-privada', { id: cp.id }), icon: 'home', t: esc(cp.nombre), s: `${S().caballos.filter(c => c.cuadraPrivadaId === cp.id).length} caballos${cp.adminId !== u.id ? ' · compartida contigo' : ''}` })).join('')}</div>` : ''}
      ${section('Hoy importa', '', 'hoy')}${hoyHTML(hoyImporta(u, v))}
      ${section('Accesos directos', '<button class="link" id="editAt" type="button">Editar</button>')}
      <div class="shortcuts">${at.map(k => { const l = atajoLink(u, k); return `<a class="sc" href="${l.href}">${tile(l.i)}<span>${esc(l.l)}</span></a>`; }).join('') || '<p class="muted">Sin accesos. Pulsa Editar.</p>'}</div>`;
    main.addEventListener('click', e => { const b = e.target.closest('[data-vista]'); if (b) activarVista(b.dataset.vista); });
    bindHoy(main);
    $('#editAt').onclick = () => atajosSheet(u, v);
  };
  function atajosSheet(u, v) {
    const disp = Object.keys(ATAJOS).filter(k => atajoOK(u, v, k));
    let sel = atajosDe(u, v).slice();
    const body = document.createElement('div');
    function draw() {
      const resto = disp.filter(k => !sel.includes(k));
      body.innerHTML = `<p class="muted small" style="margin:6px 6px 10px">Vista: ${E.VISTAS[v].nombre}. Los tres primeros aparecen en la barra inferior.</p>
        <div class="list">${sel.map((k, i) => row({ icon: ATAJOS[k].i, t: ATAJOS[k].l, s: i < 3 ? 'En la barra inferior' : '', onclick: false, end: `<span class="inline"><button type="button" class="icon-btn" style="width:36px;height:36px;box-shadow:none" data-up="${i}" aria-label="Subir" ${i ? '' : 'disabled'}>${ic('up', 's')}</button><button type="button" class="icon-btn" style="width:36px;height:36px;box-shadow:none;color:var(--danger)" data-rm="${i}" aria-label="Quitar">${ic('x', 's')}</button></span>` })).join('') || '<div class="empty">Ningún acceso seleccionado.</div>'}</div>
        ${resto.length ? `<div class="form-title">Añadir</div><div class="list">${resto.map(k => row({ icon: ATAJOS[k].i, t: ATAJOS[k].l, end: ic('plus', 's'), data: `data-add="${k}"` })).join('')}</div>` : ''}`;
    }
    body.addEventListener('click', e => {
      const up = e.target.closest('[data-up]'), rm = e.target.closest('[data-rm]'), ad = e.target.closest('[data-add]');
      if (up) { const i = +up.dataset.up; [sel[i - 1], sel[i]] = [sel[i], sel[i - 1]]; draw(); }
      if (rm) { sel.splice(+rm.dataset.rm, 1); draw(); }
      if (ad) { sel.push(ad.dataset.add); draw(); }
    });
    sheet({ title: 'Accesos directos', body, done: () => { u.atajos = u.atajos || {}; u.atajos[v] = sel; save(); refresh(); toast('Accesos guardados'); } });
    draw();
  }

  /* ---------- Carpetas ---------- */
  pages.carpetas = function () {
    const u = E.me();
    CTX = { vista: vistaActual(u) };
    const main = shell({ title: 'Carpetas', sub: S().centro ? S().centro.nombre : '' });
    const centro = E.esCentro(u) || E.esGlobal(u);
    let html = '';
    const sedes = S().sedes.filter(s => centro || S().cuadrasPrivadas.some(cp => cp.sedeId === s.id && E.cuadraAcceso(u, cp)) || (E.has(u, 'profesor') && S().escuelas.some(e => e.sedeId === s.id)) || E.misCaballos(u).some(c => c.sedeId === s.id));
    html += section('Sedes', E.puedeConfig(u) ? `<button class="link" id="nuevaSede" type="button">${ic('plus', 's')} Crear sede</button>` : '');
    if (!sedes.length) html += empty('folder', 'Sin sedes', E.puedeConfig(u) ? 'Crea la primera sede para empezar a organizar el centro.' : 'Todavía no tienes acceso a ninguna sede.');
    sedes.forEach(s => {
      const esc_ = S().escuelas.filter(e => e.sedeId === s.id);
      const cgs = S().cuadrasGenerales.filter(g => g.sedeId === s.id);
      const cps = S().cuadrasPrivadas.filter(cp => cp.sedeId === s.id);
      const conAcc = cps.filter(cp => E.cuadraAcceso(u, cp));
      const sin = cps.length - conAcc.length;
      html += `<div class="list folder-sede">${row({ href: href('sede', { id: s.id }), lead: tile('folder', '', s.color), t: esc(s.nombre), s: [s.tipo, S().caballos.filter(c => c.sedeId === s.id).length + ' caballos'].filter(Boolean).join(' · ') })}
        <div class="sub-rows">
        ${(centro || E.has(u, 'profesor')) ? esc_.map(e => row({ href: href('escuela', { id: e.id }), icon: 'cap', t: esc(e.nombre), s: 'Escuela' })).join('') : ''}
        ${centro ? cgs.map(g => row({ href: href('cuadra-general', { id: g.id }), icon: 'home', t: esc(g.nombre), s: 'Cuadra general · alojamiento y mensualidades' })).join('') : ''}
        ${conAcc.map(cp => row({ href: href('cuadra-privada', { id: cp.id }), icon: 'grid', t: esc(cp.nombre), s: 'Cuadra privada' + (cp.adminId === u.id ? '' : ' · compartida contigo') })).join('')}
        ${sin > 0 ? row({ icon: 'lock', t: `${sin} cuadra${sin > 1 ? 's' : ''} privada${sin > 1 ? 's' : ''}`, s: 'Sin acceso. Su contenido es privado.', onclick: false, end: '' }) : ''}
        </div></div>`;
    });
    const sueltas = S().cuadrasPrivadas.filter(cp => !cp.sedeId && E.cuadraAcceso(u, cp));
    html += section('Tus carpetas');
    html += `<div class="list">
      ${row({ href: href('mis-caballos'), icon: 'shoe', t: 'Mis caballos', s: `${E.misCaballos(u).length} caballos, estén donde estén` })}
      ${sueltas.map(cp => row({ href: href('cuadra-privada', { id: cp.id }), icon: 'grid', t: esc(cp.nombre), s: 'Cuadra privada sin sede' })).join('')}
      ${E.puedeConfig(u) ? row({ href: href('configuracion'), icon: 'sliders', t: 'Configuración', s: 'Sedes, perfiles, caballos y permisos' }) : ''}
      ${row({ href: href('perfil'), icon: 'user', t: 'Perfil', s: esc(u.nombre) })}
    </div>`;
    main.innerHTML = html;
    const ns = $('#nuevaSede'); if (ns) ns.onclick = () => sedeForm();
  };

  /* ---------- Sede ---------- */
  pages.sede = function () {
    const u = E.me();
    const s = E.get.sede(Q.get('id'));
    CTX = { vista: vistaActual(u) };
    if (!s) { shell({ title: 'Sede', back: href('carpetas') }).innerHTML = empty('folder', 'Sede no encontrada', ''); return; }
    const cfg = E.puedeConfig(u), centro = E.esCentro(u) || E.esGlobal(u);
    const main = shell({ title: s.nombre, sub: 'Sede', back: href('carpetas'), actions: cfg ? editBtn('ed') : '', desc: esc([s.direccion, s.tipo].filter(Boolean).join(' · ')) });
    const esc_ = S().escuelas.filter(e => e.sedeId === s.id);
    const cgs = S().cuadrasGenerales.filter(g => g.sedeId === s.id);
    const cps = S().cuadrasPrivadas.filter(cp => cp.sedeId === s.id);
    const conAcc = cps.filter(cp => E.cuadraAcceso(u, cp));
    const nCab = S().caballos.filter(c => c.sedeId === s.id).length;
    const personal = new Set();
    S().usuarios.forEach(x => { if (E.has(x, 'gerente') || E.has(x, 'encargado')) personal.add(x.id); });
    S().clases.filter(k => esc_.some(e => e.id === k.escuelaId)).forEach(k => personal.add(k.profesorId));
    cps.forEach(cp => personal.add(cp.adminId));
    main.innerHTML = `
      ${section('Carpetas')}
      <div class="list">
        ${esc_.map(e => row({ href: href('escuela', { id: e.id }), icon: 'cap', t: esc(e.nombre), s: `${S().alumnos.filter(a => a.escuelaId === e.id).length} alumnos` })).join('')}
        ${centro ? cgs.map(g => row({ href: href('cuadra-general', { id: g.id }), icon: 'home', t: esc(g.nombre), s: `${S().caballos.filter(c => c.cuadraGeneralId === g.id).length} caballos alojados` })).join('') : ''}
        ${conAcc.map(cp => row({ href: href('cuadra-privada', { id: cp.id }), icon: 'grid', t: esc(cp.nombre), s: 'Cuadra privada' })).join('')}
        ${cps.length - conAcc.length > 0 ? row({ icon: 'lock', t: `${cps.length - conAcc.length} cuadra(s) privada(s)`, s: 'Sin acceso', onclick: false, end: '' }) : ''}
        ${centro ? row({ href: href('caballos', { sede: s.id }), icon: 'shoe', t: 'Caballos en la sede', s: nCab + ' caballos' }) : ''}
      </div>
      ${cfg ? `<div class="btns" style="margin-top:12px"><button class="btn sm soft" data-new="escuela">${ic('plus', 's')} Escuela</button><button class="btn sm soft" data-new="cg">${ic('plus', 's')} Cuadra general</button><button class="btn sm soft" data-new="cp">${ic('plus', 's')} Cuadra privada</button><button class="btn sm soft" data-new="caballo">${ic('plus', 's')} Caballo</button></div>` : ''}
      ${section('Pistas y zonas', cfg ? '<button class="link" type="button" id="ez">Editar</button>' : '')}
      ${s.zonas.length ? `<div class="chips">${s.zonas.map(z => `<span class="chip" style="background:var(--card);box-shadow:var(--shadow)">${ic('pin', 's')} ${esc(z)}</span>`).join('')}</div>` : '<p class="muted" style="margin:0 4px">Sin pistas ni zonas.</p>'}
      ${personal.size ? section('Personal') + `<div class="list">${[...personal].map(id => E.get.user(id)).filter(Boolean).map(x => row({ lead: av(x, 40), t: esc(x.nombre), s: x.roles.map(r => E.ROLES[r]).join(', '), onclick: false, end: '' })).join('')}</div>` : ''}
      ${s.notas ? section('Notas') + `<div class="card" style="padding:14px 16px">${esc(s.notas)}</div>` : ''}`;
    if (cfg) { $('#ed').onclick = () => sedeForm(s); $('#ez').onclick = () => sedeForm(s); }
    main.addEventListener('click', e => {
      const b = e.target.closest('[data-new]'); if (!b) return;
      if (b.dataset.new === 'caballo') caballoForm(null, { sedeId: s.id, cuadraGeneralId: (cgs[0] || {}).id || '' });
      else simpleForm(b.dataset.new, null, { sedeId: s.id });
    });
  };

  /* ---------- Cuadra general ---------- */
  pages['cuadra-general'] = function () {
    const u = E.me();
    CTX = { vista: 'gerencia' };
    const id = Q.get('id');
    const cg = id && E.get.cg(id);
    const tab = Q.get('tab') || (cg ? 'caballos' : 'cobros');
    if (!E.esCentro(u) && !E.esGlobal(u)) { shell({ title: 'Cuadra general', back: href('carpetas') }).innerHTML = empty('lock', 'Sin acceso', 'La cuadra general la gestiona gerencia y administración.'); return; }
    const cgs = cg ? [cg] : S().cuadrasGenerales;
    const main = shell({ title: cg ? cg.nombre : 'Cobros del centro', sub: cg ? (sedeDe(cg.sedeId) || {}).nombre || '' : 'Mensualidades y extras', back: cg ? href('sede', { id: cg.sedeId }) : href('index'), actions: cg && E.puedeConfig(u) ? editBtn('ed') : '' });
    if (cg && E.puedeConfig(u)) $('#ed').onclick = () => simpleForm('cg', cg);
    const eco = E.puedeEconomia(u);
    const ids = new Set(cgs.map(g => g.id));
    const horses = S().caballos.filter(c => ids.has(c.cuadraGeneralId));
    const mesAct = F.today().slice(0, 7);
    let html = cg ? `<div class="sticky-seg">${seg([{ k: 'caballos', l: 'Caballos', href: href('cuadra-general', { id }) }, { k: 'cobros', l: 'Propietarios y cobros', href: href('cuadra-general', { id, tab: 'cobros' }) }], tab)}</div>` : '';
    if (tab === 'caballos') {
      if (eco) E.asegurarMensualidades(mesAct);
      html += horses.length ? `<div class="list">${horses.map(c => {
        const k = S().cobros.find(x => x.caballoId === c.id && x.mes === mesAct && x.tipo === 'mensualidad');
        const props = c.propietarios.map(p => uName(p.userId)).filter(Boolean).join(', ') || 'Centro';
        const s = [props, c.responsableId ? 'Resp. ' + uName(c.responsableId) : 'Sin responsable', c.box ? 'Box ' + c.box : ''].filter(Boolean).map(esc).join(' · ') + (c.notasCentro ? `<br>${esc(c.notasCentro)}` : '');
        const end = eco && c.mensualidad ? `<span class="money">${money(c.mensualidad)}</span>${k ? (k.pagado ? '<span class="chip ok">Pagada</span>' : '<span class="chip warn">Pendiente</span>') : ''}` : (c.estado !== 'Activo' ? `<span class="chip">${esc(c.estado)}</span>` : '');
        return row({ href: href('caballo', { id: c.id }), lead: thumb(c), t: esc(c.nombre), s, end });
      }).join('')}</div>` : empty('shoe', 'Sin caballos alojados', 'Asigna caballos a esta cuadra general desde su ficha.');
      if (E.puedeEditarCaballos(u)) html += `<button class="btn soft block" id="nc" style="margin-top:12px">${ic('plus', 's')} Alojar caballo</button>`;
      main.innerHTML = html;
      const nc = $('#nc'); if (nc) nc.onclick = () => caballoForm(null, { cuadraGeneralId: cg ? cg.id : '', sedeId: cg ? cg.sedeId : '' });
      return;
    }
    if (!eco) { main.innerHTML = html + empty('lock', 'Sin permiso económico', 'Pide a gerencia acceso a los datos económicos.'); return; }
    const mes = Q.get('mes') || mesAct;
    E.asegurarMensualidades(mes);
    const prev = F.addMonths(mes + '-01', -1).slice(0, 7), next = F.addMonths(mes + '-01', 1).slice(0, 7);
    const cobros = S().cobros.filter(k => ids.has(k.cuadraGeneralId) && k.mes === mes);
    const grupos = {};
    cobros.forEach(k => { const c = E.get.caballo(k.caballoId); const pid = (c && (c.propietarios[0] || {}).userId) || k.propietarioId || ''; (grupos[pid] = grupos[pid] || []).push(k); });
    const totP = cobros.filter(k => !k.pagado).reduce((a, k) => a + (+k.importe || 0), 0);
    html += `<div class="pz-top"><a class="icon-btn" href="${href('cuadra-general', { id, tab: 'cobros', mes: prev })}" aria-label="Mes anterior">${ic('back')}</a><div class="wk">${cap(MF.format(F.parse(mes + '-01')))}</div><a class="icon-btn" href="${href('cuadra-general', { id, tab: 'cobros', mes: next })}" aria-label="Mes siguiente">${ic('chev')}</a></div>
      <div class="card total-line"><span>Pendiente del mes</span><span class="money">${money(totP)}</span></div>`;
    html += Object.keys(grupos).length ? Object.entries(grupos).map(([pid, ks]) => {
      const pu = E.get.user(pid);
      const pend = ks.filter(k => !k.pagado).reduce((a, k) => a + (+k.importe || 0), 0);
      const pag = ks.filter(k => k.pagado).reduce((a, k) => a + (+k.importe || 0), 0);
      return `${section(esc(pu ? pu.nombre : 'Centro (sin propietario)'), pend ? `<button class="link" type="button" data-allpaid="${pid}">Marcar todo pagado</button>` : '<span class="chip ok">Al día</span>')}
        <div class="list">${ks.map(k => row({ lead: `<span class="tile" style="${k.pagado ? '' : 'background:var(--warn-soft);color:var(--warn)'}">${ic(k.pagado ? 'check' : 'euro')}</span>`, t: esc(cName(k.caballoId)) + (k.tipo === 'extra' ? ' · ' + esc(k.concepto) : ''), s: (k.pagado ? 'Pagado' : '<b style="color:var(--warn)">Pendiente</b>') + ' · ' + (k.tipo === 'extra' ? 'Extra' : 'Mensualidad') + ' · toca para cambiar', end: `<span class="money">${money(k.importe)}</span>`, data: `data-cobro="${k.id}" aria-label="Cambiar estado de pago"` })).join('')}
        <div class="total-line" style="border-top:1px solid var(--line)"><span class="muted small">Pagado ${money(pag)}</span><span>Pendiente ${money(pend)}</span></div></div>`;
    }).join('') : empty('euro', 'Sin cobros este mes', 'Las mensualidades se generan con los caballos alojados que tienen mensualidad.');
    html += `<button class="btn soft block" id="extra" style="margin-top:14px">${ic('plus', 's')} Añadir extra del centro</button>
      <p class="muted small" style="margin:12px 6px">Aquí solo aparecen cobros del centro. Los gastos privados de cada propietario no se muestran.</p>`;
    main.innerHTML = html;
    main.addEventListener('click', e => {
      const b = e.target.closest('[data-cobro]');
      if (b) { const k = S().cobros.find(x => x.id === b.dataset.cobro); k.pagado = !k.pagado; save(); refresh(); toast(k.pagado ? 'Marcado como pagado' : 'Marcado como pendiente'); }
      const a = e.target.closest('[data-allpaid]');
      if (a) { grupos[a.dataset.allpaid].forEach(k => { k.pagado = true; }); save(); refresh(); toast('Todo pagado'); }
    });
    $('#extra').onclick = () => {
      if (!horses.length) { toast('No hay caballos alojados'); return; }
      openForm({
        title: 'Extra del centro', fields: [
          { key: 'caballoId', label: 'Caballo', type: 'select', options: opt(horses), req: true },
          { key: 'concepto', label: 'Concepto', req: true, ph: 'Cama extra, suplemento, transporte…' },
          { key: 'importe', label: 'Importe (€)', type: 'number', req: true },
          { key: 'pagado', label: 'Pagado', type: 'toggle' }
        ], values: {},
        onSave: v => { const c = E.get.caballo(v.caballoId); S().cobros.push({ id: E.uid('k'), tipo: 'extra', caballoId: c.id, cuadraGeneralId: c.cuadraGeneralId, propietarioId: (c.propietarios[0] || {}).userId || '', mes, concepto: v.concepto, importe: +v.importe, pagado: v.pagado }); toast('Extra añadido'); }
      });
    };
  };

  /* ---------- Cuadra privada ---------- */
  pages['cuadra-privada'] = function () {
    const u = E.me();
    const id = Q.get('id') || cuadraSesion(u);
    const cp = E.get.cp(id);
    const acc = E.cuadraAcceso(u, cp);
    if (!cp || !acc) { CTX = { vista: vistaActual(u) }; shell({ title: 'Cuadra privada', back: href('carpetas') }).innerHTML = empty('lock', 'Carpeta privada', 'Solo pueden verla las personas con las que se ha compartido.'); return; }
    S().sesion.cuadraId = cp.id; save();
    CTX = { vista: 'cuadra', cuadraId: cp.id, enCuadra: true };
    const main = shell({ title: cp.nombre, sub: (sedeDe(cp.sedeId) || {}).nombre || 'Cuadra privada', back: href('index'), actions: acc.admin || E.puedeConfig(u) ? editBtn('ed') : '' });
    if ($('#ed')) $('#ed').onclick = () => simpleForm('cp', cp);
    const horses = S().caballos.filter(c => c.cuadraPrivadaId === cp.id);
    const t = F.today();
    const pzHoy = S().pizarra.filter(p => p.fecha === t && horses.some(h => h.id === p.caballoId));
    let html = '';
    if (acc.nivel === 'pizarra') {
      html += `<div class="card" style="padding:16px">Tienes acceso a la pizarra de esta cuadra.</div><a class="btn block" style="margin-top:12px" href="${href('pizarra', { cuadra: cp.id })}">${ic('grid', 's')} Abrir pizarra</a>`;
      main.innerHTML = html; return;
    }
    html += `<div class="views" style="grid-template-columns:1fr 1fr">
      <a class="view" href="${href('pizarra', { cuadra: cp.id })}">${tile('grid')}<b>Pizarra</b><span>${pzHoy.reduce((a, p) => a + p.codigos.length, 0)} tareas hoy</span></a>
      <a class="view" href="${href('caballos', { cuadra: cp.id })}">${tile('shoe')}<b>Caballos</b><span>${horses.length} en esta cuadra</span></a></div>`;
    html += section('Hoy importa') + hoyHTML(hoyImporta(u, 'cuadra', cp.id));
    const regs = S().registros.filter(r => horses.some(h => h.id === r.caballoId) && E.verRegistro(u, r));
    if (acc.salud) {
      const prox = regs.filter(r => (r.tipo === 'recordatorio' && !r.hecho && r.fecha >= t) || (['veterinario', 'herrador'].includes(r.tipo) && r.fecha >= t)).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 5);
      html += section('Próximos veterinario y herrador') + (prox.length ? `<div class="list">${prox.map(r => regRow(r)).join('')}</div>` : '<p class="muted" style="margin:0 4px">Nada programado.</p>');
    }
    if (acc.gastos) {
      const gp = regs.filter(r => r.tipo === 'gasto' && !r.pagado);
      html += section('Gastos pendientes', '', 'gastos') + (gp.length ? `<div class="list">${gp.map(r => regRow(r)).join('')}<div class="total-line" style="border-top:1px solid var(--line)"><span>Total</span><span class="money">${money(gp.reduce((a, r) => a + (+r.importe || 0), 0))}</span></div></div>` : '<p class="muted" style="margin:0 4px">Sin gastos pendientes.</p>');
    }
    const NIV = { lectura: 'Solo lectura', edicion: 'Edición', pizarra: 'Solo pizarra' };
    const adm = E.get.user(cp.adminId);
    html += section('Personal y accesos', acc.admin ? `<button class="link" id="share" type="button">${ic('share', 's')} Compartir</button>` : '');
    html += `<div class="list">${adm ? row({ lead: av(adm, 40), t: esc(adm.nombre), s: 'Administra la cuadra', onclick: false, end: '' }) : ''}
      ${cp.accesos.map((a, i) => { const x = E.get.user(a.userId); if (!x) return ''; return row({ lead: av(x, 40), t: esc(x.nombre), s: [NIV[a.nivel], a.gastos ? 'gastos' : '', a.salud ? 'salud' : ''].filter(Boolean).join(' · '), onclick: acc.admin ? undefined : false, end: acc.admin ? ic('chev', 's') : '', data: acc.admin ? `data-acc="${i}"` : '' }); }).join('')}</div>
      <p class="muted small" style="margin:10px 6px">Gerencia ve estos caballos en la cuadra general, pero no esta pizarra ni sus gastos, salvo que lo compartas.</p>`;
    main.innerHTML = html;
    bindRegs(main);
    const shareForm = (a) => {
      const nueva = !a;
      a = a || { userId: '', nivel: 'lectura', gastos: false, salud: true };
      const libres = S().usuarios.filter(x => x.id !== cp.adminId && (!nueva || !cp.accesos.some(y => y.userId === x.id)));
      openForm({
        title: nueva ? 'Compartir cuadra' : 'Acceso de ' + uName(a.userId), values: a,
        fields: [
          ...(nueva ? [{ key: 'userId', label: 'Con quién', type: 'select', options: opt(libres, 'nombre', 'Elegir…'), req: true, hint: 'Para compartir con gerencia, elige al gerente.' }] : []),
          { key: 'nivel', label: 'Nivel', type: 'segment', options: [{ v: 'lectura', l: 'Solo lectura' }, { v: 'edicion', l: 'Edición' }, { v: 'pizarra', l: 'Solo pizarra' }] },
          { key: 'gastos', label: 'Ver gastos', type: 'toggle', when: v => v.nivel !== 'pizarra' },
          { key: 'salud', label: 'Ver salud (veterinario, herrador, documentos)', type: 'toggle', when: v => v.nivel !== 'pizarra' }
        ],
        doneLabel: nueva ? 'Compartir' : 'Guardar', deleteLabel: 'Revocar acceso',
        onSave: v => { Object.assign(a, v); if (nueva) cp.accesos.push(a); toast(nueva ? 'Compartida' : 'Acceso actualizado'); },
        onDelete: nueva ? null : () => { cp.accesos = cp.accesos.filter(x => x !== a); toast('Acceso revocado'); }
      });
    };
    if ($('#share')) $('#share').onclick = () => shareForm();
    main.addEventListener('click', e => { const b = e.target.closest('[data-acc]'); if (b) shareForm(cp.accesos[+b.dataset.acc]); });
  };

  /* ---------- Pizarra ---------- */
  pages.pizarra = function () {
    const u = E.me();
    const cid = Q.get('cuadra') || '';
    const cp = cid && E.get.cp(cid);
    const acc = cp && E.cuadraAcceso(u, cp);
    let horses, editable;
    if (cp) {
      if (!acc) { CTX = { vista: vistaActual(u) }; shell({ title: 'Pizarra', back: href('index') }).innerHTML = empty('lock', 'Pizarra privada', 'No tienes acceso a esta cuadra.'); return; }
      horses = S().caballos.filter(c => c.cuadraPrivadaId === cp.id);
      editable = E.puedeEditarPizarra(acc);
      CTX = { vista: 'cuadra', cuadraId: cp.id, enCuadra: true };
    } else {
      horses = E.misCaballos(u);
      editable = true;
      CTX = { vista: vistaActual(u) };
    }
    horses = horses.filter(c => c.estado !== 'Baja');
    const t = F.today();
    const w = Q.get('w') || F.weekStart(t);
    const dias = [...Array(7)].map((_, i) => F.addDays(w, i));
    const main = shell({ title: 'Pizarra', sub: cp ? cp.nombre : 'Mis caballos', back: cp ? null : href('index') });
    const celdas = S().pizarra.filter(p => dias.includes(p.fecha) && horses.some(h => h.id === p.caballoId));
    const personas = personasDe(horses);
    const DN = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const fin = F.addDays(w, 6);
    let html = `<div class="pz-top"><a class="icon-btn" href="${href('pizarra', { cuadra: cid, w: F.addDays(w, -7) })}" aria-label="Semana anterior">${ic('back')}</a>
      <div class="wk">${F.parse(w).getDate()}–${DFL.format(F.parse(fin))}</div>
      <a class="icon-btn" href="${href('pizarra', { cuadra: cid, w: F.addDays(w, 7) })}" aria-label="Semana siguiente">${ic('chev')}</a></div>
      ${w !== F.weekStart(t) ? `<a class="btn sm soft block" style="margin-bottom:12px" href="${href('pizarra', { cuadra: cid })}">Volver a esta semana</a>` : ''}
      <div class="legend">${personas.map(p => `<span class="chip">${av(p, 20)} ${esc(p.mote || p.nombre)}</span>`).join('')}${S().actividades.map(a => `<span class="chip">${codeChip(a.id)} ${esc(a.nombre)}</span>`).join('')}</div>`;
    if (!horses.length) {
      html += empty('shoe', 'Sin caballos', cp ? 'Añade caballos a esta cuadra para planificar la semana.' : 'No tienes caballos asignados.');
    } else {
      html += `<div class="board-wrap"><table class="board"><thead><tr><th class="horse" scope="col">Caballo</th>${dias.map((d, i) => `<th scope="col" class="${d === t ? 'hoy' : ''} ${i > 4 ? 'we' : ''}">${DN[i]}<b>${F.parse(d).getDate()}</b></th>`).join('')}</tr></thead><tbody>
        ${horses.map(h => `<tr><th class="horse" scope="row"><a href="${href('caballo', { id: h.id, cuadra: cid })}">${thumb(h)}<span>${esc(h.nombre)}</span></a></th>${dias.map((d, i) => {
          const c = celdas.find(p => p.caballoId === h.id && p.fecha === d);
          const pu = c && E.get.user(c.personaId);
          const label = `${h.nombre}, ${DN[i]} ${F.parse(d).getDate()}: ${c && c.codigos.length ? c.codigos.map(x => (S().actividades.find(a => a.id === x) || {}).nombre).join(', ') : 'vacío'}${pu ? ', ' + pu.nombre : ''}${c && c.hecho ? ', hecho' : ''}`;
          return `<td class="${d === t ? 'hoy' : ''} ${i > 4 ? 'we' : ''}"><button type="button" class="cell ${c && c.hecho ? 'done' : ''}" data-h="${h.id}" data-d="${d}" aria-label="${esc(label)}" ${editable ? '' : 'disabled'}>
            ${c && c.hecho ? `<span class="tick">${ic('check')}</span>` : ''}${c && c.nota ? '<span class="nt"></span>' : ''}
            ${c && c.codigos.length ? `<span class="codes">${c.codigos.map(codeChip).join('')}</span>` : (editable ? `<span class="add">${ic('plus', 's')}</span>` : '')}
            ${pu ? `<span class="who">${av(pu, 20)}</span>` : ''}</button></td>`;
        }).join('')}</tr>`).join('')}</tbody></table></div>`;
      if (editable) html += `<div class="btns" style="margin-top:14px"><button class="btn ghost sm" id="rep" aria-label="Repetir la semana anterior">${ic('repeat', 's')} Repetir semana</button><button class="btn ghost sm" id="clr">${ic('broom', 's')} Limpiar semana</button></div>`;
      else html += '<p class="muted small" style="margin:12px 6px">Pizarra en modo lectura.</p>';
    }
    main.innerHTML = html;
    const wrap = $('.board-wrap', main), th = $('thead th.hoy', main);
    if (wrap && th) wrap.scrollLeft = Math.max(0, th.offsetLeft - 112 - 72);
    if (!editable || !horses.length) return;
    main.addEventListener('click', e => { const b = e.target.closest('.cell'); if (b) celdaSheet(b.dataset.h, b.dataset.d, personas); });
    $('#rep').onclick = () => {
      const prev = S().pizarra.filter(p => horses.some(h => h.id === p.caballoId) && p.fecha >= F.addDays(w, -7) && p.fecha < w);
      if (!prev.length) { toast('La semana anterior está vacía'); return; }
      let n = 0;
      prev.forEach(p => {
        const f = F.addDays(p.fecha, 7);
        if (S().pizarra.some(x => x.caballoId === p.caballoId && x.fecha === f && x.codigos.length)) return;
        S().pizarra = S().pizarra.filter(x => !(x.caballoId === p.caballoId && x.fecha === f));
        S().pizarra.push({ id: E.uid('pz'), caballoId: p.caballoId, fecha: f, codigos: p.codigos.slice(), personaId: p.personaId, nota: '', hecho: false }); n++;
      });
      save(); refresh(); toast(n ? `${n} casillas copiadas` : 'No había casillas libres');
    };
    $('#clr').onclick = () => {
      if (!confirmar('¿Vaciar todas las casillas de esta semana?')) return;
      S().pizarra = S().pizarra.filter(p => !(dias.includes(p.fecha) && horses.some(h => h.id === p.caballoId)));
      save(); refresh(); toast('Semana limpia');
    };
  };
  function celdaSheet(hid, d, personas) {
    const h = E.get.caballo(hid);
    const c = S().pizarra.find(p => p.caballoId === hid && p.fecha === d) || { codigos: [], personaId: '', nota: '', hecho: false };
    const fields = [
      { key: 'codigos', label: 'Actividad', type: 'acts' },
      { key: 'personaId', label: 'Quién', type: 'select', options: opt(personas, 'nombre', 'Sin asignar') },
      { key: 'nota', label: 'Nota', type: 'text', ph: 'Opcional' },
      { key: 'hecho', label: 'Hecho', type: 'toggle' }
    ];
    openForm({
      title: `${h.nombre} · ${fdate(d)}`, fields, values: c, doneLabel: 'Guardar',
      onSave: v => {
        S().pizarra = S().pizarra.filter(p => !(p.caballoId === hid && p.fecha === d));
        if (v.codigos.length || v.nota || v.personaId || v.hecho) S().pizarra.push({ id: c.id || E.uid('pz'), caballoId: hid, fecha: d, codigos: v.codigos, personaId: v.personaId, nota: v.nota, hecho: v.hecho });
      },
      onDelete: c.id ? () => { S().pizarra = S().pizarra.filter(p => p.id !== c.id); toast('Casilla vaciada'); } : null, deleteLabel: 'Vaciar casilla'
    });
  }

  /* ---------- Caballos (listado contextual) ---------- */
  pages.caballos = function () {
    const u = E.me();
    const cid = Q.get('cuadra'), sid = Q.get('sede');
    const cp = cid && E.get.cp(cid);
    let horses, titulo = 'Caballos', sub = '', back = null, preset = {};
    if (cp) {
      const acc = E.cuadraAcceso(u, cp);
      if (!acc) { CTX = { vista: vistaActual(u) }; shell({ title: 'Caballos', back: href('index') }).innerHTML = empty('lock', 'Sin acceso', ''); return; }
      CTX = { vista: 'cuadra', cuadraId: cp.id, enCuadra: true };
      horses = S().caballos.filter(c => c.cuadraPrivadaId === cp.id); sub = cp.nombre; preset = { cuadraPrivadaId: cp.id };
    } else if (sid) {
      CTX = { vista: vistaActual(u) };
      const s = E.get.sede(sid);
      horses = E.caballosVisibles(u).filter(c => c.sedeId === sid); sub = s ? s.nombre : ''; back = href('sede', { id: sid }); preset = { sedeId: sid };
    } else {
      CTX = { vista: vistaActual(u) };
      horses = E.caballosVisibles(u); sub = 'Todos los que puedes ver'; back = href('index');
    }
    const puedeNuevo = E.puedeEditarCaballos(u) || (cp && E.cuadraAcceso(u, cp).admin);
    const main = shell({ title: titulo, sub, back });
    main.innerHTML = `${horses.length > 6 ? `<div class="group" style="margin-top:0"><div class="field" style="display:flex;align-items:center;gap:10px">${ic('search', 's')}<input type="search" id="q" placeholder="Buscar caballo" aria-label="Buscar caballo"></div></div>` : ''}
      ${horses.length ? `<div class="list" id="lst">${horses.map(c => {
        const s = [c.box ? 'Box ' + c.box : '', c.propietarios.map(p => uName(p.userId)).join(', ') || 'Centro', c.responsableId ? 'Resp. ' + uName(c.responsableId) : ''].filter(Boolean).map(esc).join(' · ');
        return row({ href: href('caballo', { id: c.id, cuadra: cid }), lead: thumb(c), t: esc(c.nombre), s, end: c.estado !== 'Activo' ? `<span class="chip ${c.estado === 'Lesionado' ? 'danger' : ''}">${esc(c.estado)}</span>` : undefined, data: `data-n="${esc(c.nombre.toLowerCase())}"` });
      }).join('')}</div>` : empty('shoe', 'Sin caballos', 'Todavía no hay caballos aquí.')}
      ${puedeNuevo ? `<button class="btn soft block" id="nc" style="margin-top:12px">${ic('plus', 's')} Nuevo caballo</button>` : ''}`;
    const q = $('#q'); if (q) q.oninput = () => $$('#lst .row').forEach(r => r.classList.toggle('hidden', !r.dataset.n.includes(q.value.toLowerCase())));
    const nc = $('#nc'); if (nc) nc.onclick = () => caballoForm(null, preset);
  };

  /* ---------- Ficha de caballo ---------- */
  pages.caballo = function () {
    const u = E.me();
    const c = E.get.caballo(Q.get('id'));
    const cid = Q.get('cuadra') || '';
    const n = c && E.caballoNivel(u, c);
    CTX = cid ? { vista: 'cuadra', cuadraId: cid, enCuadra: true, caballoId: c && c.id } : { vista: vistaActual(u), caballoId: c && c.id };
    if (!c || !n) { shell({ title: 'Caballo', back: href('index') }).innerHTML = empty('lock', 'Sin acceso a este caballo', ''); return; }
    const puedeEditar = E.puedeEditarCaballos(u) || n === 'total';
    const main = shell({ sub: cid ? (E.get.cp(cid) || {}).nombre : 'Caballo', back: cid ? href('caballos', { cuadra: cid }) : 'javascript:history.back()', actions: puedeEditar ? editBtn('ed') : '' });
    if (puedeEditar) $('#ed').onclick = () => caballoForm(c);
    const tab = Q.get('tab') || 'resumen';
    const probar = tipo => E.verRegistro(u, { tipo, caballoId: c.id, ambito: 'privado', autorId: '' });
    const verGastos = probar('gasto'), verSalud = probar('veterinario');
    const regs = S().registros.filter(r => r.caballoId === c.id && E.verRegistro(u, r)).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const sede = sedeDe(c.sedeId), cg = E.get.cg(c.cuadraGeneralId), cp = E.get.cp(c.cuadraPrivadaId);
    const eco = E.puedeEconomia(u) || n === 'total';
    const tabs = [{ k: 'resumen', l: 'Resumen' }, { k: 'semana', l: 'Semana' }].concat(verSalud ? [{ k: 'salud', l: 'Salud' }] : [], verGastos ? [{ k: 'gastos', l: 'Gastos' }] : [], [{ k: 'notas', l: 'Notas' }]).map(x => Object.assign(x, { href: href('caballo', { id: c.id, cuadra: cid, tab: x.k }) }));
    let html = `<div class="hero" style="padding:0 4px 16px">${thumb(c, 'big')}<div><h1>${esc(c.nombre)}</h1><p>${esc([sede && sede.nombre, c.box && 'Box ' + c.box].filter(Boolean).join(' · ') || 'Sin ubicación')}</p><div class="chips" style="margin-top:6px"><span class="chip ${c.estado === 'Activo' ? 'ok' : c.estado === 'Lesionado' ? 'danger' : ''}">${esc(c.estado)}</span>${c.tipo === 'pony' ? '<span class="chip">Pony</span>' : ''}${c.usoEscuela ? '<span class="chip">Escuela</span>' : ''}</div></div></div>
      <div class="sticky-seg">${seg(tabs, tab)}</div>`;
    if (tab === 'resumen') {
      html += `<div class="kv">
        <div><small>Propietario${c.propietarios.length > 1 ? 's' : ''}</small><b>${esc(c.propietarios.map(p => uName(p.userId) + (p.pct && c.propietarios.length > 1 ? ` (${p.pct}%)` : '')).join(', ') || 'Centro')}</b></div>
        <div><small>Jinete / responsable</small><b>${esc(uName(c.responsableId) || '—')}</b></div>
        <div><small>Cuadra general</small><b>${esc(cg ? cg.nombre : '—')}</b></div>
        <div><small>Cuadra privada</small><b>${esc(cp ? cp.nombre : '—')}</b></div>
        ${eco && c.mensualidad ? `<div><small>Mensualidad</small><b>${money(c.mensualidad)}</b></div>` : ''}
      </div>`;
      const prox = regs.filter(r => r.tipo === 'recordatorio' && !r.hecho).sort((a, b) => a.fecha.localeCompare(b.fecha));
      html += section('Recordatorios') + (prox.length ? `<div class="list">${prox.map(r => regRow(r, false)).join('')}</div>` : '<p class="muted" style="margin:0 4px">Sin recordatorios.</p>');
      html += section('Últimos registros') + (regs.length ? `<div class="list">${regs.filter(r => r.tipo !== 'recordatorio').slice(0, 5).map(r => regRow(r, false)).join('') || '<div class="empty">Sin registros.</div>'}</div>` : '<p class="muted" style="margin:0 4px">Sin registros todavía.</p>');
      if (n === 'total') {
        html += section('Accesos', puedeEditar ? '<button class="link" id="ga" type="button">Gestionar</button>' : '');
        const lst = c.propietarios.map(p => [p.userId, 'Propietario/a']).concat(c.responsableId ? [[c.responsableId, 'Jinete / responsable']] : [], c.accesos.map(a => [a.userId, ROLES_ACC[a.rol]]));
        html += `<div class="list">${lst.map(([id, rol]) => { const x = E.get.user(id); return x ? row({ lead: av(x, 36), t: esc(x.nombre), s: rol, onclick: false, end: '' }) : ''; }).join('') || '<div class="empty">Sin accesos.</div>'}</div>`;
      }
    }
    if (tab === 'semana') {
      const w = F.weekStart(F.today());
      const DN = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
      html += `<div class="week-strip">${[...Array(7)].map((_, i) => { const d = F.addDays(w, i); const p = S().pizarra.find(x => x.caballoId === c.id && x.fecha === d); const pu = p && E.get.user(p.personaId); return `<div class="${d === F.today() ? 'hoy' : ''}"><b>${DN[i]}</b>${F.parse(d).getDate()}${p ? `<span class="codes" style="display:flex;flex-direction:column;gap:3px;align-items:center">${p.codigos.map(codeChip).join('')}</span>${pu ? av(pu, 18) : ''}${p.hecho ? ic('check', 's') : ''}` : ''}</div>`; }).join('')}</div>`;
      if (cp && E.cuadraAcceso(u, cp)) html += `<a class="btn soft block" style="margin-top:14px" href="${href('pizarra', { cuadra: cp.id })}">${ic('grid', 's')} Abrir pizarra de ${esc(cp.nombre)}</a>`;
      else if (E.esMio(u, c)) html += `<a class="btn soft block" style="margin-top:14px" href="${href('pizarra')}">${ic('grid', 's')} Abrir mi pizarra</a>`;
    }
    if (tab === 'salud') {
      const sal = regs.filter(r => ['veterinario', 'herrador'].includes(r.tipo) || (r.tipo === 'recordatorio' && /^(Veterinario|Herrador)/.test(r.concepto)));
      html += `<div class="btns" style="margin-bottom:12px"><button class="btn soft" data-rt="veterinario">${ic('vet', 's')} Veterinario</button><button class="btn soft" data-rt="herrador">${ic('hammer', 's')} Herrador</button></div>`;
      html += sal.length ? `<div class="list">${sal.map(r => regRow(r, false)).join('')}</div>` : empty('heart', 'Sin registros de salud', 'Añade la primera visita del veterinario o del herrador.');
    }
    if (tab === 'gastos') {
      const g = regs.filter(r => r.tipo === 'gasto' || (['veterinario', 'herrador'].includes(r.tipo) && r.importe));
      const pend = g.filter(r => !r.pagado).reduce((a, r) => a + (+r.importe || 0), 0);
      html += `<div class="card total-line"><span>Pendiente</span><span class="money">${money(pend)}</span></div><div style="height:12px"></div>`;
      html += g.length ? `<div class="list">${g.map(r => regRow(r, false)).join('')}</div>` : empty('wallet', 'Sin gastos', '');
      html += `<button class="btn soft block" style="margin-top:12px" data-rt="gasto">${ic('plus', 's')} Añadir gasto</button>`;
    }
    if (tab === 'notas') {
      if (c.notasCentro && (E.esCentro(u) || n === 'total')) html += section('Observaciones del centro') + `<div class="card" style="padding:14px 16px">${esc(c.notasCentro)}</div>`;
      if (c.notas && n === 'total') html += section('Notas privadas') + `<div class="card" style="padding:14px 16px">${esc(c.notas)}</div>`;
      const nd = regs.filter(r => r.tipo === 'nota' || r.tipo === 'documento');
      html += section('Notas y documentos') + (nd.length ? `<div class="list">${nd.map(r => regRow(r, false)).join('')}</div>` : '<p class="muted" style="margin:0 4px">Nada todavía.</p>');
      html += `<div class="btns" style="margin-top:12px"><button class="btn soft" data-rt="nota">${ic('note', 's')} Nota</button><button class="btn soft" data-rt="documento">${ic('doc', 's')} Documento</button></div>`;
    }
    main.innerHTML = html;
    bindRegs(main);
    main.addEventListener('click', e => { const b = e.target.closest('[data-rt]'); if (b) registroSheet(CTX, { tipo: b.dataset.rt, caballoId: c.id }); });
    const ga = $('#ga'); if (ga) ga.onclick = () => caballoForm(c);
  };

  /* ---------- Escuela ---------- */
  function escuelaActual(u) { return E.get.escuela(Q.get('id') || Q.get('escuela')) || E.get.escuela(escuelaSesion(u)); }
  const puedeEscuela = u => E.has(u, 'profesor') || E.esCentro(u) || E.esGlobal(u);
  function claseRow(k) {
    const sinC = k.alumnos.filter(x => !x.caballoId).length;
    const afo = k.tipo === 'Particular' ? 1 : k.aforo;
    return row({ lead: `<span class="time">${esc(k.hora)}</span>`, t: esc(k.tipo) + (k.pista ? ' · ' + esc(k.pista) : ''), s: `${esc(uName(k.profesorId) || 'Sin profesor')} · ${k.alumnos.length}/${afo} alumnos`, end: sinC ? `<span class="chip warn">${sinC} sin caballo</span>` : ic('chev', 's'), data: `data-clase="${k.id}"` });
  }
  pages.escuela = function () {
    const u = E.me();
    const e = escuelaActual(u);
    CTX = { vista: 'clases', escuelaId: e && e.id };
    if (!e || !puedeEscuela(u)) { shell({ title: 'Escuela', back: href('index') }).innerHTML = empty(e ? 'lock' : 'cap', e ? 'Sin acceso' : 'No hay escuelas', e ? 'La escuela es para profesores y gerencia.' : 'Crea una escuela dentro de una sede.'); return; }
    S().sesion.escuelaId = e.id; save();
    const tab = Q.get('tab') || 'hoy';
    const main = shell({ title: e.nombre, sub: (sedeDe(e.sedeId) || {}).nombre || 'Escuela', back: href('index'), actions: E.puedeConfig(u) ? editBtn('ed') : '' });
    if ($('#ed')) $('#ed').onclick = () => simpleForm('escuela', e);
    const eco = E.puedeEconomia(u);
    const tabs = [{ k: 'hoy', l: 'Hoy' }, { k: 'alumnos', l: 'Alumnos' }, { k: 'caballos', l: 'Caballos' }].concat(eco ? [{ k: 'cobros', l: 'Cobros' }] : []).map(x => Object.assign(x, { href: href('escuela', { id: e.id, tab: x.k === 'hoy' ? '' : x.k }) }));
    let html = `<div class="sticky-seg">${seg(tabs, tab)}</div>`;
    const alumnos = S().alumnos.filter(a => a.escuelaId === e.id);
    const t = F.today();
    if (tab === 'hoy') {
      const hoy = S().clases.filter(k => k.escuelaId === e.id && k.fecha === t).sort((a, b) => a.hora.localeCompare(b.hora));
      html += hoy.length ? `<div class="list">${hoy.map(claseRow).join('')}</div>` : empty('cal', 'Sin clases hoy', '');
      html += `<div class="btns" style="margin-top:12px"><a class="btn ghost" href="${href('clases', { escuela: e.id })}">${ic('cal', 's')} Calendario</a><button class="btn soft" id="nk">${ic('plus', 's')} Clase</button></div>`;
    }
    if (tab === 'alumnos') {
      html += alumnos.length ? `<div class="list">${alumnos.map(a => { const r = E.alumnoResumen(a); return row({ href: href('alumno', { id: a.id }), lead: av({ nombre: a.nombre, color: '#8C8377', foto: a.foto }, 44), t: esc(a.nombre), s: [a.nivel, a.bonoTotal ? `Bono: quedan ${r.restantes}` : 'Sin bono', r.recuperaciones ? `${r.recuperaciones} recup.` : ''].filter(Boolean).map(esc).join(' · '), end: eco && r.pendiente ? `<span class="chip warn">${money(r.pendiente)}</span>` : undefined }); }).join('')}</div>` : empty('users', 'Sin alumnos', 'Crea el primer alumno de la escuela.');
      html += `<button class="btn soft block" id="na" style="margin-top:12px">${ic('plus', 's')} Nuevo alumno</button>`;
    }
    if (tab === 'caballos') {
      const hs = caballosEscuela(e.id);
      html += '<p class="muted small" style="margin:0 6px 10px">Solo caballos y ponis de escuela o autorizados para clase.</p>';
      html += hs.length ? `<div class="list">${hs.map(h => {
        const hoy = S().clases.filter(k => k.fecha === t && k.alumnos.some(x => x.caballoId === h.id)).map(k => k.hora + ' ' + (E.get.alumno(k.alumnos.find(x => x.caballoId === h.id).alumnoId) || {}).nombre);
        return row({ href: href('caballo', { id: h.id }), lead: thumb(h), t: esc(h.nombre), s: hoy.length ? 'Hoy: ' + esc(hoy.join(', ')) : 'Libre hoy', end: h.estado !== 'Activo' ? `<span class="chip ${h.estado === 'Lesionado' ? 'danger' : ''}">${esc(h.estado)}</span>` : (hoy.length ? `<span class="chip">${hoy.length} clase${hoy.length > 1 ? 's' : ''}</span>` : '<span class="chip ok">Disponible</span>') });
      }).join('')}</div>` : empty('shoe', 'Sin caballos de escuela', 'Marca un caballo como “Disponible para escuela” en su ficha.');
      if (E.puedeEditarCaballos(u)) html += `<button class="btn soft block" id="nh" style="margin-top:12px">${ic('plus', 's')} Caballo de escuela</button>`;
    }
    if (tab === 'cobros' && eco) {
      const res = alumnos.map(a => [a, E.alumnoResumen(a)]);
      const pend = res.filter(([, r]) => r.pendiente > 0);
      const bonos = res.filter(([a, r]) => a.bonoTotal && r.restantes <= 1);
      html += section('Clases sueltas sin pagar') + (pend.length ? `<div class="list">${pend.map(([a, r]) => row({ href: href('alumno', { id: a.id }), lead: av({ nombre: a.nombre, color: '#8C8377', foto: a.foto }, 40), t: esc(a.nombre), s: `${r.pendientes.length} clase${r.pendientes.length > 1 ? 's' : ''}`, end: `<span class="money">${money(r.pendiente)}</span>` })).join('')}</div>` : '<p class="muted" style="margin:0 4px">Todo cobrado.</p>');
      html += section('Bonos por renovar') + (bonos.length ? `<div class="list">${bonos.map(([a, r]) => row({ href: href('alumno', { id: a.id }), lead: av({ nombre: a.nombre, color: '#8C8377', foto: a.foto }, 40), t: esc(a.nombre), s: `Quedan ${r.restantes} de ${a.bonoTotal}`, end: '<span class="chip warn">Renovar</span>' })).join('')}</div>` : '<p class="muted" style="margin:0 4px">Ningún bono a punto de acabar.</p>');
    }
    main.innerHTML = html;
    main.addEventListener('click', ev => { const b = ev.target.closest('[data-clase]'); if (b) claseSheet(E.get.clase(b.dataset.clase)); });
    if ($('#nk')) $('#nk').onclick = () => claseForm(null, e.id);
    if ($('#na')) $('#na').onclick = () => alumnoForm(null, e.id);
    if ($('#nh')) $('#nh').onclick = () => caballoForm(null, { usoEscuela: true, escuelaId: e.id, sedeId: e.sedeId, tipo: 'pony' });
  };

  /* ---------- Calendario de clases ---------- */
  pages.clases = function () {
    const u = E.me();
    const e = escuelaActual(u);
    CTX = { vista: 'clases', escuelaId: e && e.id };
    if (!e || !puedeEscuela(u)) { shell({ title: 'Clases', back: href('index') }).innerHTML = empty('cal', e ? 'Sin acceso' : 'No hay escuelas', ''); return; }
    const t = F.today();
    const d = Q.get('d') || t;
    const w = F.weekStart(d);
    const soloMias = E.has(u, 'profesor') && Q.get('todas') !== '1';
    const main = shell({ title: 'Clases', sub: e.nombre, back: href('escuela', { id: e.id }) });
    const base = S().clases.filter(k => k.escuelaId === e.id && (!soloMias || k.profesorId === u.id));
    const DN = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const escs = S().escuelas;
    let html = '';
    if (escs.length > 1) html += `<div class="seg" style="margin-bottom:10px">${escs.map(x => `<a href="${href('clases', { escuela: x.id, d })}" class="${x.id === e.id ? 'on' : ''}">${esc(x.nombre)}</a>`).join('')}</div>`;
    html += `<div class="pz-top"><a class="icon-btn" href="${href('clases', { escuela: e.id, d: F.addDays(w, -7), todas: Q.get('todas') })}" aria-label="Semana anterior">${ic('back')}</a><div class="wk">${cap(MF.format(F.parse(d)))}</div><a class="icon-btn" href="${href('clases', { escuela: e.id, d: F.addDays(w, 7), todas: Q.get('todas') })}" aria-label="Semana siguiente">${ic('chev')}</a></div>
      <div class="days">${[...Array(7)].map((_, i) => { const x = F.addDays(w, i); const n = base.filter(k => k.fecha === x).length; return `<a class="day ${x === d ? 'on' : ''} ${x === t ? 'hoy' : ''}" href="${href('clases', { escuela: e.id, d: x, todas: Q.get('todas') })}" aria-label="${DN[i]} ${F.parse(x).getDate()}, ${n} clases">${DN[i]}<b>${F.parse(x).getDate()}</b>${n ? '<i></i>' : ''}</a>`; }).join('')}</div>`;
    if (E.has(u, 'profesor')) html += `<div class="seg" style="margin-bottom:12px"><a href="${href('clases', { escuela: e.id, d })}" class="${soloMias ? 'on' : ''}">Mis clases</a><a href="${href('clases', { escuela: e.id, d, todas: 1 })}" class="${soloMias ? '' : 'on'}">Todas</a></div>`;
    const lista = base.filter(k => k.fecha === d).sort((a, b) => a.hora.localeCompare(b.hora));
    html += section(cap(fdate(d)) + (d !== t && Math.abs(F.diffDays(t, d)) > 1 ? '' : ''));
    html += lista.length ? `<div class="list">${lista.map(claseRow).join('')}</div>` : empty('cal', 'Sin clases este día', '');
    html += `<button class="btn block" id="nk" style="margin-top:14px">${ic('plus', 's')} Nueva clase</button>`;
    main.innerHTML = html;
    main.addEventListener('click', ev => { const b = ev.target.closest('[data-clase]'); if (b) claseSheet(E.get.clase(b.dataset.clase)); });
    $('#nk').onclick = () => claseForm(null, e.id, d);
  };

  /* ---------- Alumno ---------- */
  pages.alumno = function () {
    const u = E.me();
    const a = E.get.alumno(Q.get('id'));
    CTX = { vista: 'clases', escuelaId: a && a.escuelaId };
    if (!a || !puedeEscuela(u)) { shell({ title: 'Alumno', back: href('index') }).innerHTML = empty('user', 'Alumno no disponible', ''); return; }
    const r = E.alumnoResumen(a);
    const eco = E.puedeEconomia(u);
    const main = shell({ sub: 'Alumno', back: href('escuela', { id: a.escuelaId, tab: 'alumnos' }), actions: editBtn('ed') });
    $('#ed').onclick = () => alumnoForm(a);
    const pct = a.bonoTotal ? Math.min(100, Math.round(r.consumidas / a.bonoTotal * 100)) : 0;
    main.innerHTML = `<div class="hero" style="padding:0 4px 16px">${av({ nombre: a.nombre, color: '#8C8377', foto: a.foto }, 84).replace('class="av"', 'class="av big"')}<div><h1>${esc(a.nombre)}</h1><p>${esc([a.nivel, a.edad ? a.edad + ' años' : ''].filter(Boolean).join(' · '))}</p></div></div>
      <div class="kv">
        <div><small>Profesor/a habitual</small><b>${esc(uName(a.profesorId) || '—')}</b></div>
        <div><small>Caballo habitual</small><b>${esc(cName(a.caballoId) || '—')}</b></div>
        <div><small>Recuperaciones</small><b>${r.recuperaciones || 'Ninguna'}</b></div>
        ${eco ? `<div><small>Pendiente de pago</small><b>${money(r.pendiente)}</b></div>` : ''}
        ${a.contacto ? `<div style="grid-column:1/-1"><small>Responsable / teléfono</small><b><a href="tel:${esc(a.contacto)}">${esc(a.contacto)}</a></b></div>` : ''}
      </div>
      ${section('Bono', `<button class="link" id="renov" type="button">${a.bonoTotal ? 'Renovar' : 'Crear bono'}</button>`)}
      <div class="card" style="padding:16px">${a.bonoTotal ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${r.consumidas} de ${a.bonoTotal} usadas</b><span class="muted">Quedan ${r.restantes}</span></div><div class="bar-prog" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>` : '<span class="muted">Sin bono. Paga por clase suelta.</span>'}</div>
      ${eco && r.pendiente ? `<button class="btn soft block" id="alDia" style="margin-top:12px">${ic('check', 's')} Marcar clases sueltas como pagadas</button>` : ''}
      ${section('Historial de clases')}
      ${r.entradas.length ? `<div class="list">${r.entradas.map(({ clase: k, e }) => row({ icon: 'cal', t: `${fdate(k.fecha)} · ${esc(k.hora)} · ${esc(k.tipo)}`, s: [cName(e.caballoId) || 'Sin caballo', e.modo === 'bono' ? 'Bono' : 'Suelta', e.recuperacion ? 'Recuperación' : ''].filter(Boolean).map(esc).join(' · '), end: e.asistencia === true ? '<span class="chip ok">Asistió</span>' : e.asistencia === false ? '<span class="chip danger">Faltó</span>' : '<span class="chip">Pendiente</span>', data: `data-clase="${k.id}"` })).join('')}</div>` : '<p class="muted" style="margin:0 4px">Todavía no tiene clases.</p>'}
      ${a.notas ? section('Observaciones') + `<div class="card" style="padding:14px 16px">${esc(a.notas)}</div>` : ''}`;
    main.addEventListener('click', ev => { const b = ev.target.closest('[data-clase]'); if (b) claseSheet(E.get.clase(b.dataset.clase)); });
    $('#renov').onclick = () => openForm({
      title: a.bonoTotal ? 'Renovar bono' : 'Nuevo bono', fields: [{ key: 'n', label: 'Clases del nuevo bono', type: 'number', req: true, def: a.bonoTotal || 8 }], values: {},
      onSave: v => { const usadasClases = r.entradas.filter(x => x.e.modo === 'bono' && x.e.asistencia === true).length; a.bonoTotal = +v.n; a.bonoBase = -usadasClases; toast('Bono de ' + v.n + ' clases'); }
    });
    if ($('#alDia')) $('#alDia').onclick = () => { r.pendientes.forEach(x => { x.e.pagado = true; }); save(); refresh(); toast('Pagos al día'); };
  };

  /* ---------- Mis caballos ---------- */
  pages['mis-caballos'] = function () {
    const u = E.me();
    CTX = { vista: 'caballos' };
    const tab = Q.get('tab') || 'caballos';
    const main = shell({ title: 'Mis caballos', sub: 'Estén donde estén' });
    const horses = E.misCaballos(u);
    const hs = new Set(horses.map(c => c.id));
    const regs = S().registros.filter(r => hs.has(r.caballoId) && E.verRegistro(u, r));
    const t = F.today();
    const tabs = [{ k: 'caballos', l: 'Caballos' }, { k: 'salud', l: 'Salud' }, { k: 'gastos', l: 'Gastos' }, { k: 'recordatorios', l: 'Recordatorios' }].map(x => Object.assign(x, { href: href('mis-caballos', { tab: x.k === 'caballos' ? '' : x.k }) }));
    let html = `<div class="sticky-seg">${seg(tabs, tab)}</div>`;
    if (!horses.length) {
      main.innerHTML = html + empty('shoe', 'Todavía no tienes caballos', 'Cuando seas propietario o responsable de un caballo aparecerá aquí.', E.puedeEditarCaballos(u) ? `<button class="btn" id="nc">${ic('plus', 's')} Crear caballo</button>` : '');
      if ($('#nc')) $('#nc').onclick = () => caballoForm();
      return;
    }
    if (tab === 'caballos') {
      const grupos = {};
      horses.forEach(c => { (grupos[c.sedeId || ''] = grupos[c.sedeId || ''] || []).push(c); });
      Object.entries(grupos).forEach(([sid, list]) => {
        html += section(esc((sedeDe(sid) || {}).nombre || 'Sin sede'));
        html += `<div class="list">${list.map(c => {
          const nx = regs.filter(r => r.caballoId === c.id && r.tipo === 'recordatorio' && !r.hecho).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
          const lugar = [E.get.cg(c.cuadraGeneralId) && 'Cuadra general', c.box && 'Box ' + c.box, E.get.cp(c.cuadraPrivadaId) && E.get.cp(c.cuadraPrivadaId).nombre].filter(Boolean).join(' · ');
          return row({ href: href('caballo', { id: c.id }), lead: thumb(c), t: esc(c.nombre), s: esc(lugar || 'Sin ubicación') + (E.caballoNivel(u, c) === 'responsable' ? ' · Eres responsable' : ''), end: nx ? `<span class="chip ${nx.fecha <= t ? 'warn' : ''}">${ic('bell', 's')} ${fdate(nx.fecha)}</span>` : undefined });
        }).join('')}</div>`;
      });
    }
    if (tab === 'salud') {
      const sal = regs.filter(r => ['veterinario', 'herrador'].includes(r.tipo)).sort((a, b) => b.fecha.localeCompare(a.fecha));
      const prox = regs.filter(r => r.tipo === 'recordatorio' && !r.hecho && /^(Veterinario|Herrador)/.test(r.concepto)).sort((a, b) => a.fecha.localeCompare(b.fecha));
      html += `<div class="btns" style="margin-bottom:6px"><button class="btn soft" data-rt="veterinario">${ic('vet', 's')} Veterinario</button><button class="btn soft" data-rt="herrador">${ic('hammer', 's')} Herrador</button></div>`;
      if (prox.length) html += section('Próximas citas') + `<div class="list">${prox.map(r => regRow(r)).join('')}</div>`;
      html += section('Historial') + (sal.length ? `<div class="list">${sal.map(r => regRow(r)).join('')}</div>` : empty('heart', 'Sin registros de salud', ''));
    }
    if (tab === 'gastos') {
      const g = regs.filter(r => r.tipo === 'gasto' || (['veterinario', 'herrador'].includes(r.tipo) && r.importe)).sort((a, b) => b.fecha.localeCompare(a.fecha));
      const pend = g.filter(r => !r.pagado).reduce((a, r) => a + (+r.importe || 0), 0);
      const centro = S().cobros.filter(k => !k.pagado && hs.has(k.caballoId) && E.get.caballo(k.caballoId).propietarios.some(p => p.userId === u.id));
      html += `<div class="card total-line"><span>Gastos pendientes</span><span class="money">${money(pend)}</span></div>`;
      if (centro.length) html += section('Pendiente con el centro') + `<div class="list">${centro.map(k => row({ icon: 'euro', t: esc(k.concepto) + ' · ' + esc(cName(k.caballoId)), s: cap(MF.format(F.parse(k.mes + '-01'))), onclick: false, end: `<span class="money">${money(k.importe)}</span>` })).join('')}</div>`;
      html += section('Gastos privados', '<button class="link" type="button" data-rt="gasto">Añadir</button>') + (g.length ? `<div class="list">${g.map(r => regRow(r)).join('')}</div>` : empty('wallet', 'Sin gastos', ''));
    }
    if (tab === 'recordatorios') {
      const rec = regs.filter(r => r.tipo === 'recordatorio');
      const pend = rec.filter(r => !r.hecho).sort((a, b) => a.fecha.localeCompare(b.fecha));
      const hechos = rec.filter(r => r.hecho).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);
      html += pend.length ? `<div class="list">${pend.map(r => `<div style="display:flex;align-items:center">${regRow(r).replace('class="row ', 'style="flex:1" class="row ')}<button type="button" class="icon-btn" style="box-shadow:none;margin-right:10px" data-done="${r.id}" aria-label="Marcar hecho">${ic('check')}</button></div>`).join('')}</div>` : empty('bell', 'Sin recordatorios pendientes', '');
      html += `<button class="btn soft block" style="margin-top:12px" data-rt="recordatorio">${ic('plus', 's')} Recordatorio</button>`;
      if (hechos.length) html += section('Hechos recientemente') + `<div class="list">${hechos.map(r => regRow(r)).join('')}</div>`;
    }
    main.innerHTML = html;
    bindRegs(main);
    main.addEventListener('click', e => {
      const b = e.target.closest('[data-rt]'); if (b) registroSheet(CTX, { tipo: b.dataset.rt });
      const d = e.target.closest('[data-done]'); if (d) { const r = S().registros.find(x => x.id === d.dataset.done); r.hecho = true; save(); refresh(); toast('Hecho'); }
    });
  };

  /* ---------- Perfil ---------- */
  pages.perfil = function () {
    const u = E.me();
    const v = vistaActual(u);
    CTX = { vista: v };
    const main = shell({ sub: 'Perfil', actions: editBtn('ed') });
    $('#ed').onclick = () => userForm(u);
    const at = atajosDe(u, v);
    main.innerHTML = `<div class="hero" style="padding:0 4px 16px">${av(u, 84)}<div><h1>${esc(u.nombre)}</h1><p>${esc(u.roles.map(r => E.ROLES[r]).join(', ') || 'Sin rol')}${u.contacto ? ' · ' + esc(u.contacto) : ''}</p></div></div>
      ${section('Mis vistas')}
      <div class="list">${E.vistasDe(u).map(k => row({ icon: E.VISTAS[k].icon, t: E.VISTAS[k].nombre, s: k === u.vistaInicial ? 'Vista inicial' : E.VISTAS[k].desc, end: k === v ? '<span class="chip ok">Activa</span>' : '', data: `data-vista="${k}"` })).join('')}</div>
      ${section('Accesos directos', '<button class="link" id="eat" type="button">Editar</button>')}
      <div class="chips">${at.map(k => `<span class="chip" style="background:var(--card);box-shadow:var(--shadow)">${ic(ATAJOS[k].i, 's')} ${esc(ATAJOS[k].l)}</span>`).join('') || '<span class="muted">Ninguno</span>'}</div>
      ${section('Usuario')}
      <div class="list">${row({ icon: 'users', t: 'Cambiar de usuario', s: 'Para probar otras vistas y permisos', data: 'data-switch' })}${E.puedeConfig(u) ? row({ href: href('configuracion'), icon: 'sliders', t: 'Configuración del centro' }) : ''}</div>
      ${section('Datos en este dispositivo')}
      <div class="list">
        ${row({ icon: 'share', t: 'Exportar copia', s: 'Descarga un archivo con todos los datos', data: 'data-exp' })}
        ${row({ icon: 'doc', t: 'Importar copia', s: 'Sustituye los datos por los de un archivo', data: 'data-imp' })}
        ${row({ icon: 'repeat', t: 'Restaurar datos de ejemplo', data: 'data-demo' })}
        ${row({ icon: 'trash', t: 'Borrar datos locales', s: 'Empieza de cero con el asistente', data: 'data-del' })}
      </div>
      <input type="file" id="impf" accept="application/json" hidden>
      <p class="muted small" style="margin:14px 6px">Todo se guarda automáticamente en este navegador.</p>`;
    $('#eat').onclick = () => atajosSheet(u, v);
    main.addEventListener('click', e => {
      const t = e.target.closest('[data-vista],[data-switch],[data-exp],[data-imp],[data-demo],[data-del]');
      if (!t) return;
      if (t.dataset.vista) activarVista(t.dataset.vista);
      if (t.hasAttribute('data-switch')) cuentaSheet();
      if (t.hasAttribute('data-exp')) {
        const blob = new Blob([JSON.stringify(S(), null, 1)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'equilog-' + F.today() + '.json'; a.click();
      }
      if (t.hasAttribute('data-imp')) $('#impf').click();
      if (t.hasAttribute('data-demo') && confirmar('¿Sustituir tus datos por los de ejemplo?')) { E.reset(true); go('index'); }
      if (t.hasAttribute('data-del') && confirmar('¿Borrar todos los datos de este dispositivo? No se puede deshacer.')) { E.clear(); go('index'); }
    });
    $('#impf').onchange = async ev => {
      const f = ev.target.files[0]; if (!f) return;
      try { const d = JSON.parse(await f.text()); if (d.version !== 1) throw 0; E.state = d; save(); go('index'); }
      catch (err) { toast('El archivo no es una copia de EquiLog'); }
    };
  };

  /* ---------- Configuración ---------- */
  pages.configuracion = function () {
    const u = E.me();
    CTX = { vista: vistaActual(u) };
    if (!E.puedeConfig(u)) { shell({ title: 'Configuración', back: href('index') }).innerHTML = empty('lock', 'Sin permiso', 'Solo gerencia puede configurar el centro.'); return; }
    const main = shell({ title: 'Configuración', sub: S().centro.nombre, back: href('carpetas') });
    const st = S();
    const add = (id, l) => `<button class="link" type="button" id="${id}">${ic('plus', 's')} ${l}</button>`;
    const grupo = (arr, fn) => arr.length ? `<div class="list">${arr.map(fn).join('')}</div>` : '<p class="muted" style="margin:0 4px">Nada todavía.</p>';
    main.innerHTML = `
      ${section('Centro')}
      <div class="list">${row({ lead: st.centro.logo ? `<img class="photo" src="${st.centro.logo}" alt="">` : tile('home', '', st.centro.color), t: esc(st.centro.nombre), s: 'Nombre, logo y color', data: 'data-centro' })}</div>
      ${section('Sedes', add('ns', 'Crear sede'))}
      ${grupo(st.sedes, s => row({ lead: tile('folder', '', s.color), t: esc(s.nombre), s: esc([s.tipo, s.zonas.length ? s.zonas.length + ' zonas' : ''].filter(Boolean).join(' · ')), data: `data-sede="${s.id}"` }))}
      ${section('Escuelas', add('ne', 'Escuela'))}
      ${grupo(st.escuelas, x => row({ icon: 'cap', t: esc(x.nombre), s: esc((sedeDe(x.sedeId) || {}).nombre || ''), data: `data-escuela="${x.id}"` }))}
      ${section('Cuadras generales', add('ng', 'Cuadra general'))}
      ${grupo(st.cuadrasGenerales, x => row({ icon: 'home', t: esc(x.nombre), s: esc((sedeDe(x.sedeId) || {}).nombre || ''), data: `data-cg="${x.id}"` }))}
      ${section('Cuadras privadas', add('np', 'Cuadra privada'))}
      ${grupo(st.cuadrasPrivadas, x => { const acc = E.cuadraAcceso(u, x); return row({ icon: acc ? 'grid' : 'lock', t: esc(x.nombre), s: 'Administra ' + esc(uName(x.adminId) || '—') + (acc ? '' : ' · contenido privado'), data: `data-cp="${x.id}"` }); })}
      ${section('Perfiles', add('nu', 'Perfil'))}
      ${grupo(st.usuarios, x => row({ lead: av(x, 40), t: esc(x.nombre), s: x.roles.map(r => E.ROLES[r]).join(', ') || 'Sin rol', data: `data-user="${x.id}"` }))}
      ${section('Caballos', add('nc', 'Caballo'))}
      ${grupo(st.caballos, c => row({ lead: thumb(c), t: esc(c.nombre), s: esc([(sedeDe(c.sedeId) || {}).nombre, c.propietarios.map(p => uName(p.userId)).join(', ') || 'Centro'].filter(Boolean).join(' · ')), data: `data-cab="${c.id}"` }))}
      ${section('Códigos de pizarra', add('na', 'Código'))}
      <div class="list">${st.actividades.map(a => row({ lead: `<span class="tile" style="background:${a.color}22">${codeChip(a.id)}</span>`, t: esc(a.nombre), data: `data-act="${a.id}"` })).join('')}</div>
      ${section('Tipos de clase', '<button class="link" type="button" id="tk">Editar</button>')}
      <div class="chips">${st.tiposClase.map(x => `<span class="chip" style="background:var(--card);box-shadow:var(--shadow)">${esc(x)}</span>`).join('')}</div>
      ${section('Tarifas y mensualidades', add('nt', 'Tarifa'))}
      ${grupo(st.tarifas, x => row({ icon: 'euro', t: esc(x.nombre), s: esc(x.tipo), end: `<span class="money">${money(x.importe)}</span>`, data: `data-tar="${x.id}"` }))}
      ${section('Plantillas de registro', add('npl', 'Plantilla'))}
      ${grupo(st.plantillas, x => row({ icon: REG_ICON[x.tipo] || 'note', t: esc(x.nombre), s: esc(TIPOS_REG[x.tipo].l + (x.importe ? ' · ' + money(x.importe) : '')), data: `data-pl="${x.id}"` }))}
      <p class="muted small" style="margin:18px 6px">Las cuadras privadas se comparten desde dentro de cada cuadra, en “Personal y accesos”.</p>`;
    $('#ns').onclick = () => sedeForm();
    $('#ne').onclick = () => simpleForm('escuela');
    $('#ng').onclick = () => simpleForm('cg');
    $('#np').onclick = () => simpleForm('cp');
    $('#nu').onclick = () => userForm();
    $('#nc').onclick = () => caballoForm();
    $('#na').onclick = () => actForm();
    $('#nt').onclick = () => tarifaForm();
    $('#npl').onclick = () => plantillaForm();
    $('#tk').onclick = () => openForm({ title: 'Tipos de clase', fields: [{ key: 'tipos', label: 'Tipos', type: 'textarea', hint: 'Uno por línea.' }], values: { tipos: st.tiposClase.join('\n') }, onSave: v => { st.tiposClase = v.tipos.split('\n').map(x => x.trim()).filter(Boolean); } });
    main.addEventListener('click', e => {
      const b = e.target.closest('[data-centro],[data-sede],[data-escuela],[data-cg],[data-cp],[data-user],[data-cab],[data-act],[data-tar],[data-pl]');
      if (!b) return;
      const d = b.dataset;
      if ('centro' in d) openForm({ title: 'Centro', fields: [{ key: 'nombre', label: 'Nombre', req: true }, { key: 'logo', label: 'Logo o foto', type: 'photo' }, { key: 'color', label: 'Color principal', type: 'color' }], values: st.centro, onSave: v => Object.assign(st.centro, v) });
      if (d.sede) sedeForm(E.get.sede(d.sede));
      if (d.escuela) simpleForm('escuela', E.get.escuela(d.escuela));
      if (d.cg) simpleForm('cg', E.get.cg(d.cg));
      if (d.cp) simpleForm('cp', E.get.cp(d.cp));
      if (d.user) userForm(E.get.user(d.user));
      if (d.cab) caballoForm(E.get.caballo(d.cab));
      if (d.act) actForm(st.actividades.find(a => a.id === d.act));
      if (d.tar) tarifaForm(st.tarifas.find(a => a.id === d.tar));
      if (d.pl) plantillaForm(st.plantillas.find(a => a.id === d.pl));
    });
  };
  function actForm(a) {
    const nueva = !a;
    a = a || { id: E.uid('act'), codigo: '', nombre: '', color: PALETA[3] };
    openForm({
      title: nueva ? 'Nuevo código' : 'Código de pizarra', values: a,
      fields: [{ key: 'codigo', label: 'Código corto', req: true, ph: 'Máx. 4 letras' }, { key: 'nombre', label: 'Nombre', req: true }, { key: 'color', label: 'Color', type: 'color' }],
      onSave: v => { v.codigo = v.codigo.slice(0, 4); Object.assign(a, v); if (nueva) S().actividades.push(a); },
      onDelete: nueva ? null : () => { if (!confirmar('¿Eliminar este código? Desaparecerá de la pizarra.')) return false; S().actividades = S().actividades.filter(x => x.id !== a.id); S().pizarra.forEach(p => { p.codigos = p.codigos.filter(c => c !== a.id); }); }
    });
  }
  function tarifaForm(x) {
    const nueva = !x;
    x = x || { id: E.uid('t'), nombre: '', importe: '', tipo: 'Mensualidad' };
    openForm({
      title: nueva ? 'Nueva tarifa' : 'Tarifa', values: x,
      fields: [{ key: 'nombre', label: 'Nombre', req: true }, { key: 'importe', label: 'Importe (€)', type: 'number', req: true }, { key: 'tipo', label: 'Tipo', type: 'segment', options: ['Mensualidad', 'Bono', 'Clase', 'Extra'].map(t => ({ v: t, l: t })) }],
      onSave: v => { Object.assign(x, v); if (nueva) S().tarifas.push(x); },
      onDelete: nueva ? null : () => { S().tarifas = S().tarifas.filter(t => t.id !== x.id); }
    });
  }
  function plantillaForm(x) {
    const nueva = !x;
    x = x || { id: E.uid('pl'), nombre: '', tipo: 'gasto', concepto: '', importe: '' };
    openForm({
      title: nueva ? 'Nueva plantilla' : 'Plantilla', values: x,
      fields: [{ key: 'nombre', label: 'Nombre', req: true, ph: 'Vacuna gripe' }, { key: 'tipo', label: 'Tipo', type: 'segment', options: ['gasto', 'veterinario', 'herrador', 'recordatorio'].map(t => ({ v: t, l: TIPOS_REG[t].l })) }, { key: 'concepto', label: 'Concepto' }, { key: 'importe', label: 'Importe (€)', type: 'number', when: v => v.tipo !== 'recordatorio' }],
      onSave: v => { Object.assign(x, v); if (nueva) S().plantillas.push(x); },
      onDelete: nueva ? null : () => { S().plantillas = S().plantillas.filter(t => t.id !== x.id); }
    });
  }

  /* ================= Arranque ================= */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register(ROOT + 'sw.js').catch(() => {});
  }
  if (PAGE !== 'index' && (!S().centro || !S().usuarios.length)) { go('index'); return; }
  RENDER = pages[PAGE] || pages.index;
  RENDER();
  window.addEventListener('storage', e => { if (e.key === E.KEY) { E.load(); refresh(); } });
})();
