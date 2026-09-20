/* ============================================================================
   EquiLog — PIZARRA SEMANAL
   Puerto de "EquiLog_pizarra_semanal_codigo_v16" (Next + D1) a EquiLog
   (Vite + Firebase). No hay segunda base de datos: todo vive en el mismo
   documento de Firestore  stables/{id}/data/main  que ya usa EquiLog.

   Se carga como script clásico DESPUÉS de legacy-app.js, por lo que comparte
   su ámbito global: D, V, save(), render(), uid(), td(), addD(), esc(),
   toast(), canPerm(), HK, EK, ...
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ datos */

  var DAY_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  var COLORS = ['mint', 'sky', 'lilac', 'sand', 'sage', 'rose', 'ochre', 'forest', 'vet', 'competition', 'gray'];
  var TONE2COLOR = { green: 'sage', blue: 'sky', purple: 'lilac', amber: 'ochre', teal: 'forest', gray: 'gray', red: 'rose' };

  var DEFAULT_TOOLS = [
    { code: 'N', label: 'Natalia', category: 'person', color: 'mint' },
    { code: 'A', label: 'Ale', category: 'person', color: 'sky' },
    { code: 'I', label: 'Isa', category: 'person', color: 'lilac' },
    { code: 'S', label: 'Sonso', category: 'person', color: 'sand' },
    { code: 'C', label: 'Caminador', category: 'activity', color: 'sage' },
    { code: 'CU', label: 'Cuerda', category: 'activity', color: 'rose' },
    { code: 'PM', label: 'Paseo mano', category: 'activity', color: 'ochre' },
    { code: 'P', label: 'Paddock', category: 'activity', color: 'forest' },
    { code: 'VET', label: 'Veterinario', category: 'activity', color: 'vet' },
    { code: 'CON', label: 'Concurso', category: 'activity', color: 'competition' }
  ];

  /* estado de sesión (no se persiste) */
  var tool = null;          // código activo, o 'note' | 'done' | 'copy' | 'erase'
  var copySource = null;    // {hid,date}
  var hint = '';
  var hintBad = false;
  var modal = null;         // estado del modal abierto
  var bound = false;

  /* --------------------------------------------------------------- utilidades */

  function E(s) { return esc(s == null ? '' : String(s)); }
  function byId(id) { return document.getElementById(id); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function num(x) { return Number(x) || 0; }
  function clean(s) { return (s == null ? '' : String(s)).trim(); }

  function normCode(c) {
    return clean(c).toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ0-9]/g, '').slice(0, 4);
  }

  function dateLabel(d) {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function weekRange(start) {
    var a = new Date(start + 'T12:00:00'), b = new Date(addD(start, 6) + 'T12:00:00');
    var ma = a.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    var mb = b.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    if (a.getMonth() === b.getMonth()) return a.getDate() + '–' + b.getDate() + ' ' + mb + ' ' + b.getFullYear();
    return a.getDate() + ' ' + ma + ' – ' + b.getDate() + ' ' + mb + ' ' + b.getFullYear();
  }
  function addMonths(dateStr, n) {
    var d = new Date(dateStr + 'T12:00:00'); d.setMonth(d.getMonth() + n);
    return d.toISOString().slice(0, 10);
  }
  function delayToDate(amount, unit) {
    var n = Math.max(1, Math.round(num(amount)));
    if (unit === 'days') return addD(td(), n);
    if (unit === 'weeks') return addD(td(), n * 7);
    return addMonths(td(), n);
  }

  /* ------------------------------------------------- datos de la pizarra en D */

  function ensure() {
    if (!D || typeof D !== 'object') return;
    var changed = false;
    if (!Array.isArray(D.weeklyPlans)) { D.weeklyPlans = []; changed = true; }

    /* 1. Botones de la pizarra (por cuadra). Si la cuadra ya tenía la antigua
          configuración de actividades (D.boardConfig.activities) la respetamos
          para no perder la planificación existente. */
    if (!Array.isArray(D.boardTools) || !D.boardTools.length) {
      var legacy = (D.boardConfig && Array.isArray(D.boardConfig.activities)) ? D.boardConfig.activities : [];
      var used = {};
      D.weeklyPlans.forEach(function (p) { arr(p.activities).forEach(function (a) { used[a] = true; }); });
      var out = [], seen = {};
      legacy.forEach(function (a) {
        if (!used[a.id]) return;
        var c = normCode(a.code) || normCode(a.label) || 'X';
        if (seen[c]) return;
        seen[c] = true;
        out.push({ code: c, label: a.label || c, category: 'activity', color: TONE2COLOR[a.tone] || 'forest' });
      });
      DEFAULT_TOOLS.forEach(function (t) { if (!seen[t.code]) { seen[t.code] = true; out.push({ code: t.code, label: t.label, category: t.category, color: t.color }); } });
      D.boardTools = out;
      changed = true;
    }

    /* 2. Migración de planes antiguos: guardaban ids de actividad, no códigos. */
    if (!D.boardPlansMigrated) {
      var map = {};
      ((D.boardConfig && D.boardConfig.activities) || []).forEach(function (a) {
        map[a.id] = normCode(a.code) || normCode(a.label);
      });
      D.weeklyPlans.forEach(function (p) {
        p.activities = arr(p.activities).map(function (x) { return map[x] || x; });
      });
      D.boardPlansMigrated = true;
      changed = true;
    }

    /* 3. Caballos: campos de pizarra. */
    arr(D.horses).forEach(function (h) {
      if (h.active === undefined || h.active === null) { h.active = true; changed = true; }
      if (h.status === undefined || h.status === null) { h.status = h.active ? 'Activo' : 'Inactivo'; changed = true; }
      if (h.location === undefined || h.location === null) { h.location = ''; changed = true; }
    });

    /* 4. Normaliza planes. */
    D.weeklyPlans.forEach(function (p) {
      if (!Array.isArray(p.activities)) p.activities = [];
      if (!Array.isArray(p.done)) p.done = [];
      if (typeof p.note !== 'string') p.note = p.note ? String(p.note) : '';
    });

    if (changed && window._ACTIVE_STABLE_ID) save();
  }

  function tools() { return arr(D.boardTools); }
  function toolByCode(c) { var t = null; tools().forEach(function (x) { if (x.code === c) t = x; }); return t; }
  function isVetCode(c) { var t = toolByCode(c); return !!t && (t.vet === true || t.code === 'VET'); }
  function isActiveHorse(h) {
    if (!h) return false;
    if (h.active === false) return false;
    if (h.status === 'Inactivo' || h.status === 'Vendido') return false;
    return true;
  }
  function boardHorses() { return arr(D.horses).filter(isActiveHorse); }
  function horseById(id) { var h = null; arr(D.horses).forEach(function (x) { if (x.id === id) h = x; }); return h; }

  function plan(hid, date) {
    var p = null;
    arr(D.weeklyPlans).forEach(function (x) { if (x.hid === hid && x.date === date) p = x; });
    return p;
  }
  function ensurePlan(hid, date) {
    var p = plan(hid, date);
    if (!p) { p = { hid: hid, date: date, activities: [], done: [], note: '', vet: null }; D.weeklyPlans.push(p); }
    if (!Array.isArray(p.activities)) p.activities = [];
    if (!Array.isArray(p.done)) p.done = [];
    if (typeof p.note !== 'string') p.note = '';
    return p;
  }
  function isEmptyPlan(p) {
    return !p || (!p.activities.length && !p.done.length && !clean(p.note) && !(p.vet && clean(p.vet.text)));
  }
  function prune(p) { if (isEmptyPlan(p)) D.weeklyPlans = arr(D.weeklyPlans).filter(function (x) { return x !== p; }); }
  function sortCodes(list) {
    var order = tools().map(function (t) { return t.code; });
    return list.slice().sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
  }

  /* ------------------------------------------------------------ estado guardado */

  var saveState = 'saved';
  function paintSaveState() {
    var el = byId('pz-save');
    if (!el) return;
    var s = navigator.onLine === false ? 'offline' : saveState;
    var txt = s === 'saving' ? 'Guardando…' : s === 'offline' ? 'Sin conexión' : s === 'error' ? 'No guardado' : 'Guardado';
    el.setAttribute('data-state', s);
    el.innerHTML = '<i></i>' + txt;
    el.title = s === 'error' ? 'La última escritura en Firebase ha fallado' : txt;
  }
  document.addEventListener('equilog-save-status', function (ev) { saveState = ev.detail || 'saved'; paintSaveState(); });
  window.addEventListener('online', paintSaveState);
  window.addEventListener('offline', paintSaveState);

  function setHint(msg, bad) { hint = msg || ''; hintBad = !!bad; paintHint(); }
  function paintHint() {
    var el = byId('pz-hint-text');
    if (!el) return;
    el.textContent = hint || defaultHint();
    el.style.color = hintBad ? '#a2483d' : '';
    var chip = byId('pz-hint-chip');
    if (chip) chip.textContent = toolGlyph(tool);
    var clear = byId('pz-clear-copy');
    if (clear) clear.style.display = (tool === 'copy' && copySource) ? '' : 'none';
  }
  function toolGlyph(t) {
    if (t === 'erase') return '⌫'; if (t === 'note') return '✎';
    if (t === 'done') return '✓'; if (t === 'copy') return '⧉';
    return t || '·';
  }
  function defaultHint() {
    if (tool === 'erase') return 'Toca una casilla para borrarla por completo';
    if (tool === 'note') return 'Toca una casilla para escribir o editar su nota';
    if (tool === 'done') return 'Toca una casilla para marcar qué se ha hecho';
    if (tool === 'copy') return copySource ? 'Toca casillas, un día o un caballo para pegar' : 'Elige la casilla que quieres copiar';
    if (isVetCode(tool)) return 'Toca una casilla para añadir VET. Vuelve a tocarla para explicar qué ha pasado';
    return 'Toca casillas para añadir o quitar ' + (tool || '');
  }

  /* =========================================================================
     RENDER DE LA PIZARRA
     ========================================================================= */

  function renderBoard() {
    ensure();
    var week = V.boardWeek || boardStartOfWeek(td());
    V.boardWeek = week;
    var dates = [], i;
    for (i = 0; i < 7; i++) dates.push(addD(week, i));
    var hs = boardHorses();
    var today = td();
    if (!tool || (!toolByCode(tool) && ['note', 'done', 'copy', 'erase'].indexOf(tool) < 0)) {
      tool = (tools()[0] || {}).code || 'note';
    }

    var persons = tools().filter(function (t) { return t.category === 'person'; });
    var acts = tools().filter(function (t) { return t.category !== 'person'; });

    var html = '<div class="pz" id="pz">';

    /* --- acciones rápidas --- */
    html += '<div class="pz-actions">' +
      '<button class="pz-btn primary" data-pz="quick">＋ Registro</button>' +
      '<button class="pz-btn" data-pz="horses">＋ Caballos</button>' +
      '<button class="pz-btn ghost" data-pz="more" title="Más opciones">•••</button>' +
      '<span class="pz-spacer"></span>' +
      '<span class="pz-save" id="pz-save" data-state="saved"><i></i>Guardado</span>' +
      '</div>';

    /* --- herramientas --- */
    html += '<div class="pz-toolbar">' +
      '<div class="pz-group pz-persons"><p>Personas</p><div class="pz-tools">' +
      (persons.length ? persons.map(toolBtn).join('') : '<span style="font-size:11px;color:#8a958f">Añade personas en ⚙</span>') +
      '</div></div>' +
      '<div class="pz-group"><p>Actividades</p><div class="pz-tools">' +
      acts.map(toolBtn).join('') +
      utilBtn('note', '✎', 'Nota') + utilBtn('done', '✓', 'Hecho') +
      utilBtn('copy', '⧉', 'Copiar') + utilBtn('erase', '⌫', 'Borrar') +
      '<button class="pz-tool pz-t-edit" data-pz="tools"><strong>⚙</strong><span>Editar botones</span></button>' +
      '</div></div></div>';

    /* --- navegación semanal --- */
    html += '<div class="pz-week">' +
      '<button data-pz="week" data-a="-1" aria-label="Semana anterior">←<span class="pz-lbl"> Anterior</span></button>' +
      '<button class="pz-today" data-pz="today">◎<span class="pz-lbl"> Hoy</span></button>' +
      '<button data-pz="week" data-a="1" aria-label="Semana siguiente"><span class="pz-lbl">Siguiente </span>→</button>' +
      '<button class="pz-repeat" data-pz="repeat" aria-label="Repetir semana anterior">↻<span class="pz-lbl"> Repetir anterior</span></button>' +
      '<p>' + E(weekRange(week)) + '</p>' +
      '</div>';

    /* --- cuadrícula --- */
    html += '<div class="pz-board"><div class="pz-grid" id="pz-grid">';
    if (!hs.length) {
      html += '</div><div class="pz-empty-board"><div><b>Sin caballos activos</b><p style="margin-top:.35rem;font-size:12px">Pulsa <b>＋ Caballos</b> para añadir el primero.</p></div></div></div>';
    } else {
      html += '<div class="pz-head">Caballo</div>';
      dates.forEach(function (d, idx) {
        var t = new Date(d + 'T12:00:00');
        html += '<button class="pz-day' + (d === today ? ' pz-is-today' : '') + (tool === 'copy' && copySource ? ' pz-copy-target' : '') + '" data-pz="day" data-d="' + d + '">' +
          '<span>' + DAY_SHORT[idx] + '</span><strong>' + t.getDate() + '</strong>' +
          (d === today ? '<em>HOY</em>' : '') + '</button>';
      });
      hs.forEach(function (h) {
        html += '<button class="pz-horse' + (tool === 'copy' && copySource ? ' pz-copy-target' : '') + '" data-pz="horse" data-h="' + E(h.id) + '">' +
          '<span>' + E(h.name) + '</span><em>' + (tool === 'copy' && copySource ? '⧉' : '✎') + '</em></button>';
        dates.forEach(function (d) { html += cellHTML(h, d, today); });
      });
      html += '</div></div>';
    }

    /* --- pista --- */
    html += '<div class="pz-hint"><span class="pz-chip" id="pz-hint-chip">' + E(toolGlyph(tool)) + '</span>' +
      '<p id="pz-hint-text">' + E(hint || defaultHint()) + '</p>' +
      '<button id="pz-clear-copy" data-pz="clearcopy" style="display:' + (tool === 'copy' && copySource ? '' : 'none') + '">Cambiar origen</button></div>';

    html += '</div>';
    return html;
  }

  function toolBtn(t) {
    return '<button class="pz-tool pz-c-' + E(t.color || 'forest') + (tool === t.code ? ' selected' : '') +
      '" data-pz="tool" data-a="' + E(t.code) + '" aria-pressed="' + (tool === t.code) + '">' +
      '<strong>' + E(t.code) + '</strong><span>' + E(t.label) + '</span></button>';
  }
  function utilBtn(id, glyph, label) {
    return '<button class="pz-tool pz-t-' + id + (tool === id ? ' selected' : '') +
      '" data-pz="tool" data-a="' + id + '"><strong>' + glyph + '</strong><span>' + label + '</span></button>';
  }

  function cellClasses(p, date, today, hid) {
    var c = 'pz-cell';
    if (date === today) c += ' pz-is-today';
    if (p && p.activities.length) c += ' has-codes';
    if (p && p.activities.length && p.done.length >= p.activities.length) c += ' all-done';
    if (p && (clean(p.note) || (p.vet && clean(p.vet.text)))) c += ' has-note';
    if (copySource && copySource.hid === hid && copySource.date === date) c += ' copy-source';
    return c;
  }

  function cellInner(p) {
    if (!p || (!p.activities.length && !clean(p.note))) return '<span class="pz-codes"><span class="pz-empty">·</span></span>';
    var codes = '';
    p.activities.forEach(function (code, i) {
      var t = toolByCode(code);
      var done = p.done.indexOf(code) >= 0;
      var kind = (t && t.category === 'person') ? 'person' : 'activity';
      codes += '<span class="pz-code ' + kind + (done ? ' is-done' : '') + '">' +
        (i > 0 ? '<b>+</b>' : '') + (done ? '<i>✓</i>' : '') + E(code) +
        (isVetCode(code) ? '<em class="pz-vet' + (p.vet && clean(p.vet.text) ? ' done' : '') + '">' + (p.vet && clean(p.vet.text) ? '✓' : '?') + '</em>' : '') +
        '</span>';
    });
    return (codes ? '<span class="pz-codes">' + codes + '</span>' : '') +
      (clean(p.note) ? '<span class="pz-note">' + E(p.note) + '</span>' : '');
  }

  function cellHTML(h, date, today) {
    var p = plan(h.id, date);
    return '<button class="' + cellClasses(p, date, today, h.id) + '" data-pz="cell" data-h="' + E(h.id) + '" data-d="' + date + '" ' +
      'aria-label="' + E(h.name + ', ' + date) + '">' + cellInner(p) + '</button>';
  }

  function repaintCell(hid, date) {
    var el = document.querySelector('.pz-cell[data-h="' + hid + '"][data-d="' + date + '"]');
    if (!el) return;
    var p = plan(hid, date);
    el.className = cellClasses(p, date, td(), hid);
    el.innerHTML = cellInner(p);
  }

  /* ajuste de alturas: la pizarra entera debe caber en el viewport */
  function fit() {
    /* la altura real de la cabecera manda: así la pizarra ocupa
       exactamente el resto del viewport y la página nunca se desplaza */
    var hdr = byId('main-header');
    if (hdr) {
      var hh = Math.round(hdr.getBoundingClientRect().height);
      if (hh > 0) document.documentElement.style.setProperty('--pz-header-h', hh + 'px');
    }
    var grid = byId('pz-grid');
    if (!grid) return;
    var rows = boardHorses().length;
    if (!rows) return;
    var head = grid.querySelector('.pz-head');
    var headH = head ? head.getBoundingClientRect().height : 34;
    var avail = grid.clientHeight - headH;
    var per = avail / rows;
    var min = Math.max(22, Math.min(30, Math.floor(per)));
    grid.style.setProperty('--pz-row-min', min + 'px');
    /* columna de caballos proporcional al nombre más largo, sin pasarse */
    var longest = 0;
    boardHorses().forEach(function (h) { longest = Math.max(longest, (h.name || '').length); });
    var w = window.innerWidth;
    var colMax = w < 420 ? 80 : w < 760 ? 96 : 150;
    var col = Math.max(w < 420 ? 52 : 64, Math.min(colMax, 18 + longest * (w < 760 ? 6 : 8)));
    grid.style.setProperty('--pz-horse-col', col + 'px');
  }
  var fitTimer = null;
  window.addEventListener('resize', function () { clearTimeout(fitTimer); fitTimer = setTimeout(fit, 80); });
  window.addEventListener('orientationchange', function () { setTimeout(fit, 250); });

  /* =========================================================================
     ACCIONES SOBRE LAS CASILLAS
     ========================================================================= */

  function canEditBoard() {
    if (typeof canPerm === 'function' && !canPerm('tasks') && !canPerm('trainings') && !canPerm('horses')) {
      setHint('No tienes permiso para modificar la planificación.', true);
      return false;
    }
    return true;
  }

  function toggleCode(hid, date, code) {
    var p = ensurePlan(hid, date);
    var i = p.activities.indexOf(code);
    if (i >= 0) {
      p.activities.splice(i, 1);
      p.done = p.done.filter(function (c) { return c !== code; });
      if (isVetCode(code)) p.vet = null;
    } else {
      p.activities = sortCodes(p.activities.concat([code]));
    }
    prune(p);
    save();
    repaintCell(hid, date);
    vibrate();
  }

  function eraseCell(hid, date) {
    var p = plan(hid, date);
    if (isEmptyPlan(p)) { setHint('Esa casilla ya está vacía.'); return; }
    var hasVet = p.vet && clean(p.vet.text);
    var important = hasVet || clean(p.note) || p.done.length;
    if (important) {
      var msg = '¿Borrar esta casilla?\n\nSe eliminarán las actividades, la nota y el estado de realizado.';
      if (hasVet) msg += '\n\nTambién se eliminará la actuación veterinaria guardada en la ficha sanitaria del caballo' + (p.vet.expenseId ? ' y su gasto asociado' : '') + '.';
      if (!confirm(msg)) return;
    }
    if (hasVet) removeVetRecords(p);
    D.weeklyPlans = arr(D.weeklyPlans).filter(function (x) { return !(x.hid === hid && x.date === date); });
    save();
    repaintCell(hid, date);
    setHint('Casilla borrada.');
    vibrate();
  }

  function removeVetRecords(p) {
    if (!p.vet) return;
    if (p.vet.healthId) D.health = arr(D.health).filter(function (r) { return r.id !== p.vet.healthId; });
    if (p.vet.expenseId) D.expenses = arr(D.expenses).filter(function (e) { return e.id !== p.vet.expenseId; });
    p.vet = null;
  }

  function pasteTo(targets) {
    if (!copySource) return;
    var src = plan(copySource.hid, copySource.date);
    if (!src) { setHint('La casilla de origen ya no tiene contenido.', true); return; }
    var codes = src.activities.slice(), note = src.note || '';
    var n = 0;
    targets.forEach(function (t) {
      if (t.hid === copySource.hid && t.date === copySource.date) return;
      var p = ensurePlan(t.hid, t.date);
      p.activities = sortCodes(codes.slice());
      p.done = [];                 /* lo copiado queda SIEMPRE pendiente */
      p.note = note;
      /* el detalle VET no se copia: pertenece a un día concreto */
      if (p.vet) removeVetRecords(p);
      prune(p);
      n++;
    });
    if (!n) return;
    save();
    targets.forEach(function (t) { repaintCell(t.hid, t.date); });
    setHint(n === 1 ? 'Casilla copiada · las tareas quedan pendientes' : n + ' casillas copiadas · las tareas quedan pendientes');
    vibrate();
  }

  function onCell(hid, date) {
    if (!canEditBoard()) return;
    var p = plan(hid, date);

    if (tool === 'note') { openNote(hid, date); return; }
    if (tool === 'done') {
      if (p && p.activities.length) openDone(hid, date);
      else setHint('Esa casilla no tiene tareas que marcar.', true);
      return;
    }
    if (tool === 'copy') {
      if (!copySource) {
        if (isEmptyPlan(p)) { setHint('Esa casilla está vacía. Elige una con planificación.', true); return; }
        copySource = { hid: hid, date: date };
        setHint('Origen elegido. Toca las casillas, el día o el caballo donde copiarlo.');
        refresh();
      } else if (copySource.hid === hid && copySource.date === date) {
        copySource = null;
        setHint('Origen desmarcado. Elige otra casilla.');
        refresh();
      } else {
        pasteTo([{ hid: hid, date: date }]);
      }
      return;
    }
    if (tool === 'erase') { eraseCell(hid, date); return; }

    if (isVetCode(tool) && p && p.activities.indexOf(tool) >= 0) { openVet(hid, date); return; }
    toggleCode(hid, date, tool);
  }

  function onHorseName(hid) {
    if (tool === 'copy' && copySource) {
      var week = V.boardWeek, t = [];
      for (var i = 0; i < 7; i++) t.push({ hid: hid, date: addD(week, i) });
      pasteTo(t);
      return;
    }
    openHorses({ type: 'horse', id: hid });
  }

  function onDayHeader(date) {
    if (tool === 'copy' && copySource) {
      pasteTo(boardHorses().map(function (h) { return { hid: h.id, date: date }; }));
    }
  }

  function repeatPreviousWeek() {
    if (!canEditBoard()) return;
    var week = V.boardWeek || boardStartOfWeek(td());
    var prev = addD(week, -7);
    var copied = 0, kept = 0, i, j;
    var hs = boardHorses();
    for (i = 0; i < hs.length; i++) {
      for (j = 0; j < 7; j++) {
        var src = plan(hs[i].id, addD(prev, j));
        if (isEmptyPlan(src)) continue;
        var dstDate = addD(week, j);
        var dst = plan(hs[i].id, dstDate);
        if (!isEmptyPlan(dst)) { kept++; continue; }   /* nunca se borra lo existente */
        var p = ensurePlan(hs[i].id, dstDate);
        p.activities = sortCodes(src.activities.slice());
        p.done = [];                                    /* no se copia lo hecho */
        p.note = src.note || '';
        p.vet = null;
        copied++;
      }
    }
    if (!copied && !kept) { setHint('La semana anterior no tiene planificación que copiar.', true); return; }
    if (copied) save();
    refresh();
    setHint(copied + ' casilla' + (copied === 1 ? '' : 's') + ' traída' + (copied === 1 ? '' : 's') + ' de la semana anterior' +
      (kept ? ' · ' + kept + ' ya tenían plan y se han conservado' : ''));
  }

  function vibrate() { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { } }

  /* refresco completo de la vista (mantiene el modal abierto) */
  function refresh() {
    if (V.name !== 'board') return;
    var app = byId('app');
    if (!app) return;
    app.innerHTML = renderBoard();
    paintSaveState();
    fit();
  }

  /* =========================================================================
     MODALES
     ========================================================================= */

  function modalRoot() {
    var r = byId('pz-modal-root');
    if (!r) { r = document.createElement('div'); r.id = 'pz-modal-root'; document.body.appendChild(r); }
    return r;
  }
  function closeModal() { modal = null; modalRoot().innerHTML = ''; }
  function paintModal(html) {
    modalRoot().innerHTML = '<div class="pz-backdrop" data-pz="backdrop"><section class="pz-sheet" role="dialog" aria-modal="true">' + html + '</section></div>';
  }
  function head(eyebrow, title) {
    return '<div class="pz-sheet-head"><div><p>' + E(eyebrow) + '</p><h2>' + E(title) + '</h2></div>' +
      '<button data-pz="close" aria-label="Cerrar">×</button></div>';
  }
  function field(label, inner) { return '<label class="pz-field"><span>' + E(label) + '</span>' + inner + '</label>'; }
  function msg(m, bad) { return m ? '<p class="pz-msg' + (bad ? ' bad' : '') + '">' + E(m) + '</p>' : ''; }
  function val(id) { var e = byId(id); return e ? clean(e.value) : ''; }
  function checked(id) { var e = byId(id); return !!(e && e.checked); }

  /* ------------------------------------------------------------------- NOTA */
  function openNote(hid, date) {
    var h = horseById(hid); if (!h) return;
    var p = plan(hid, date);
    modal = { type: 'note', hid: hid, date: date };
    paintModal(
      head('Nota puntual', h.name + ' · ' + dateLabel(date)) +
      '<textarea id="pz-note" maxlength="240" placeholder="Ej.: No montar, pequeña herida en la mano…">' + E(p ? p.note : '') + '</textarea>' +
      '<div class="pz-sheet-actions">' +
      ((p && clean(p.note)) ? '<button class="pz-danger" data-pz="note-clear">Borrar nota</button>' : '') +
      '<button class="pz-secondary" data-pz="close">Cancelar</button>' +
      '<button class="pz-primary" style="width:auto" data-pz="note-save">Guardar nota</button></div>'
    );
    setTimeout(function () { var t = byId('pz-note'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 40);
  }
  function saveNote(clearIt) {
    var m = modal; if (!m) return;
    var text = clearIt ? '' : clean(val('pz-note')).slice(0, 240);
    var p = ensurePlan(m.hid, m.date);
    p.note = text;
    prune(p);
    save();
    repaintCell(m.hid, m.date);
    closeModal();
    setHint(text ? 'Nota guardada.' : 'Nota borrada.');
  }

  /* ------------------------------------------------------------------ HECHO */
  function openDone(hid, date) {
    var h = horseById(hid), p = plan(hid, date);
    if (!h || !p) return;
    modal = { type: 'done', hid: hid, date: date };
    paintDone();
  }
  function paintDone() {
    var m = modal, h = horseById(m.hid), p = plan(m.hid, m.date);
    if (!p) { closeModal(); return; }
    paintModal(
      head('Trabajo realizado', h.name + ' · ' + dateLabel(m.date)) +
      '<p class="pz-help">Toca cada tarea para marcarla o desmarcarla. Se guarda al instante.</p>' +
      '<div class="pz-tasklist">' + p.activities.map(function (c) {
        var t = toolByCode(c), on = p.done.indexOf(c) >= 0;
        return '<button class="' + (on ? 'checked' : '') + '" data-pz="done-toggle" data-a="' + E(c) + '">' +
          '<strong>' + (on ? '✓' : E(c)) + '</strong><span>' + E(t ? t.label : c) + '</span>' +
          '<em>' + (on ? 'Hecho' : 'Pendiente') + '</em></button>';
      }).join('') + '</div>' +
      '<div class="pz-sheet-actions"><button class="pz-secondary" data-pz="close">Cerrar</button></div>'
    );
  }
  function toggleDone(code) {
    var m = modal, p = plan(m.hid, m.date); if (!p) return;
    var i = p.done.indexOf(code);
    if (i >= 0) p.done.splice(i, 1); else p.done.push(code);
    save();
    repaintCell(m.hid, m.date);
    paintDone();
    vibrate();
  }

  /* -------------------------------------------------------------------- VET */
  function payerOptions(hids) {
    var out = [], seen = {};
    function add(n) { n = clean(n); if (!n || seen[n.toLowerCase()]) return; seen[n.toLowerCase()] = true; out.push(n); }
    add('Cuadra');
    (hids || []).forEach(function (hid) {
      var h = horseById(hid); if (!h) return;
      (h.owners && h.owners.length ? h.owners : (h.owner ? [{ nombre: h.owner }] : [])).forEach(function (o) { add(o.nombre || o.name); });
    });
    arr(D.team).forEach(function (m) { add(m.name); });
    return out.slice(0, 8);
  }
  function payerChips(hids, current) {
    return '<div class="pz-payers">' + payerOptions(hids).map(function (n) {
      return '<button type="button" data-pz="payer" data-a="' + E(n) + '" class="' + (clean(current).toLowerCase() === n.toLowerCase() ? 'on' : '') + '">👤 ' + E(n) + '</button>';
    }).join('') + '</div>';
  }
  function delayFields(prefix) {
    return '<div class="pz-grid2">' +
      field('Dentro de', '<input type="number" min="1" step="1" inputmode="numeric" id="' + prefix + '-num" placeholder="3">') +
      field('Plazo', '<select id="' + prefix + '-unit"><option value="days">Días</option><option value="weeks">Semanas</option><option value="months" selected>Meses</option></select>') +
      '</div>';
  }

  function openVet(hid, date) {
    var h = horseById(hid); if (!h) return;
    var p = ensurePlan(hid, date);
    var v = p.vet || {};
    modal = { type: 'vet', hid: hid, date: date, payer: v.payer || '', err: '' };
    paintVet();
  }
  function paintVet() {
    var m = modal, h = horseById(m.hid), p = ensurePlan(m.hid, m.date), v = p.vet || {};
    paintModal(
      head('Veterinario', h.name + ' · ' + dateLabel(m.date)) +
      '<p class="pz-help">Explica qué ha pasado o qué se ha hecho. Se guardará en la ficha sanitaria real del caballo.</p>' +
      field('¿Qué ha ocurrido o qué se ha hecho?', '<textarea id="pz-vet-text" maxlength="700" placeholder="Ej.: Inflamación ojo izquierdo. El veterinario revisa y prescribe tratamiento.">' + E(v.text || '') + '</textarea>') +
      field('Veterinario o proveedor (opcional)', '<input id="pz-vet-payee" value="' + E(v.payee || '') + '" placeholder="Nombre del profesional">') +
      '<div class="pz-block money"><label class="pz-check"><input type="checkbox" id="pz-vet-exp"' + (v.amount ? ' checked' : '') + ' data-pz="toggle-block" data-a="pz-vet-exp-fields"><span>Tiene un gasto asociado</span></label>' +
      '<div id="pz-vet-exp-fields" style="display:' + (v.amount ? '' : 'none') + ';margin-top:10px">' +
      '<div class="pz-grid2">' + field('Importe (€)', '<input type="number" min="0" step="0.01" inputmode="decimal" id="pz-vet-amount" value="' + (v.amount || '') + '">') +
      field('Categoría', '<select id="pz-vet-cat">' + EK.map(function (c) { return '<option value="' + c.id + '"' + ((v.cat || 'vet') === c.id ? ' selected' : '') + '>' + E(c.l) + '</option>'; }).join('') + '</select>') + '</div>' +
      field('Pagado por', '<input id="pz-vet-payer" value="' + E(m.payer || '') + '" placeholder="Quién lo ha pagado">') +
      payerChips([m.hid], m.payer) + '</div></div>' +
      '<div class="pz-block"><label class="pz-check"><input type="checkbox" id="pz-vet-follow"' + (v.nxt ? ' checked' : '') + ' data-pz="toggle-block" data-a="pz-vet-follow-fields"><span>Crear recordatorio o revisión posterior</span></label>' +
      '<div id="pz-vet-follow-fields" style="display:' + (v.nxt ? '' : 'none') + ';margin-top:10px">' +
      field('Fecha de la revisión', '<input type="date" id="pz-vet-nxt" value="' + E(v.nxt || '') + '">') +
      '<p class="pz-help" style="margin:0">Si lo prefieres, deja la fecha vacía e indica un plazo:</p>' + delayFields('pz-vet-d') +
      '</div></div>' +
      msg(m.err, true) +
      '<div class="pz-sheet-actions">' +
      (p.activities.indexOf('VET') >= 0 ? '<button class="pz-danger" data-pz="vet-remove">Quitar VET</button>' : '') +
      '<button class="pz-secondary" data-pz="close">Cancelar</button>' +
      '<button class="pz-primary" style="width:auto" data-pz="vet-save">Guardar</button></div>'
    );
    setTimeout(function () { var t = byId('pz-vet-text'); if (t) t.focus(); }, 40);
  }

  function saveVet() {
    var m = modal, p = ensurePlan(m.hid, m.date);
    var text = clean(val('pz-vet-text'));
    if (!text) { m.err = 'Escribe qué ha pasado o qué se ha hecho.'; paintVet(); return; }
    if (typeof canPerm === 'function' && !canPerm('health')) { m.err = 'No tienes permiso para registrar información sanitaria.'; paintVet(); return; }

    var payee = clean(val('pz-vet-payee'));
    var withExp = checked('pz-vet-exp');
    var amount = withExp ? num(val('pz-vet-amount')) : 0;
    var cat = val('pz-vet-cat') || 'vet';
    var payer = clean(val('pz-vet-payer'));
    var follow = checked('pz-vet-follow');
    var nxt = follow ? (val('pz-vet-nxt') || (val('pz-vet-d-num') ? delayToDate(val('pz-vet-d-num'), val('pz-vet-d-unit')) : '')) : '';
    if (withExp && amount <= 0) { m.err = 'Indica el importe del gasto.'; paintVet(); return; }
    if (withExp && !payer) { m.err = 'Indica quién ha pagado el gasto.'; paintVet(); return; }
    if (follow && !nxt) { m.err = 'Indica la fecha o el plazo de la revisión.'; paintVet(); return; }

    var v = p.vet || {};
    /* --- registro sanitario real de EquiLog (sin duplicados) --- */
    var hid = v.healthId && arr(D.health).some(function (r) { return r.id === v.healthId; }) ? v.healthId : uid();
    var rec = {
      id: hid, hid: m.hid, type: 'otro', label: 'Veterinario', date: m.date,
      nxt: nxt || null, notes: text, amount: amount, payStatus: 'pendiente', payee: payee,
      createdBy: (window._FBUSER && window._FBUSER.uid) || null, source: 'pizarra'
    };
    if (arr(D.health).some(function (r) { return r.id === hid; })) {
      D.health = D.health.map(function (r) { return r.id === hid ? rec : r; });
    } else {
      D.health = arr(D.health).concat([rec]);
    }

    /* --- gasto vinculado (se actualiza, nunca se duplica) --- */
    var expId = v.expenseId || null;
    if (withExp) {
      var exp = {
        id: expId || uid(), hid: m.hid, concept: text.slice(0, 60), amount: amount, date: m.date,
        cat: cat, payer: payer, payee: payee, status: 'pendiente', notes: text, splits: [],
        healthId: hid, createdBy: (window._FBUSER && window._FBUSER.uid) || null
      };
      if (expId && arr(D.expenses).some(function (e) { return e.id === expId; })) {
        D.expenses = D.expenses.map(function (e) { return e.id === expId ? exp : e; });
      } else {
        D.expenses = arr(D.expenses).concat([exp]);
        expId = exp.id;
      }
    } else if (expId) {
      D.expenses = arr(D.expenses).filter(function (e) { return e.id !== expId; });
      expId = null;
    }

    if (p.activities.indexOf('VET') < 0) p.activities = sortCodes(p.activities.concat(['VET']));
    p.vet = { text: text, healthId: hid, expenseId: expId, payee: payee, payer: payer, amount: amount, cat: cat, nxt: nxt || '', savedAt: new Date().toISOString() };
    save();
    repaintCell(m.hid, m.date);
    closeModal();
    setHint('Actuación veterinaria guardada en la ficha del caballo.');
  }

  function removeVet() {
    var m = modal, p = ensurePlan(m.hid, m.date);
    if (p.vet && clean(p.vet.text) && !confirm('Se quitará VET de la casilla y se eliminará la actuación de la ficha sanitaria del caballo. ¿Continuar?')) return;
    removeVetRecords(p);
    p.activities = p.activities.filter(function (c) { return c !== 'VET'; });
    p.done = p.done.filter(function (c) { return c !== 'VET'; });
    prune(p);
    save();
    repaintCell(m.hid, m.date);
    closeModal();
    setHint('VET retirado de la casilla.');
  }

  /* ------------------------------------------------------- EDITAR BOTONES */
  function openTools() {
    modal = { type: 'tools', drafts: tools().map(function (t) { return { code: t.code, label: t.label, category: t.category, color: t.color, orig: t.code }; }), err: '' };
    paintTools();
  }
  function paintTools() {
    var m = modal;
    paintModal(
      head('Personalizar pizarra', 'Editar botones') +
      '<p class="pz-help">El código es lo que aparece en la casilla (1–4 caracteres, único). El nombre sirve para reconocerlo en la barra.</p>' +
      m.drafts.map(function (t, i) {
        return '<div class="pz-editor-row">' +
          '<input class="pz-code-input" maxlength="4" value="' + E(t.code) + '" data-pz="tool-code" data-a="' + i + '" aria-label="Código">' +
          '<input value="' + E(t.label) + '" maxlength="24" data-pz="tool-label" data-a="' + i + '" aria-label="Nombre">' +
          '<select data-pz="tool-cat" data-a="' + i + '"><option value="person"' + (t.category === 'person' ? ' selected' : '') + '>Persona</option>' +
          '<option value="activity"' + (t.category !== 'person' ? ' selected' : '') + '>Actividad</option></select>' +
          '<span class="pz-move"><button data-pz="tool-up" data-a="' + i + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button>' +
          '<button data-pz="tool-down" data-a="' + i + '" ' + (i === m.drafts.length - 1 ? 'disabled' : '') + '>↓</button></span>' +
          '<button class="pz-del" data-pz="tool-del" data-a="' + i + '" aria-label="Eliminar">×</button>' +
          '</div><div class="pz-swatches">' + COLORS.map(function (c) {
            return '<button class="pz-swatch pz-c-' + c + (t.color === c ? ' on' : '') + '" data-pz="tool-color" data-a="' + i + '" data-c="' + c + '" aria-label="Color ' + c + '"></button>';
          }).join('') + '</div>';
      }).join('') +
      '<button class="pz-add" data-pz="tool-add">＋ Añadir botón</button>' +
      msg(m.err, true) +
      '<div class="pz-sheet-actions"><button class="pz-secondary" data-pz="close">Cancelar</button>' +
      '<button class="pz-primary" style="width:auto" data-pz="tool-save">Guardar botones</button></div>'
    );
  }
  function saveTools() {
    var m = modal;
    var cleaned = m.drafts.map(function (t) { return { code: normCode(t.code), label: clean(t.label), category: t.category === 'person' ? 'person' : 'activity', color: t.color || 'forest', orig: t.orig }; });
    if (!cleaned.length) { m.err = 'Debe quedar al menos un botón.'; paintTools(); return; }
    var seen = {}, bad = false;
    cleaned.forEach(function (t) {
      if (!t.code || !t.label) bad = true;
      if (seen[t.code]) bad = true;
      seen[t.code] = true;
    });
    if (bad) { m.err = 'Usa códigos únicos de 1 a 4 caracteres y pon un nombre a cada botón.'; paintTools(); return; }

    /* renombrados y eliminaciones se aplican a la planificación existente */
    var rename = {}, kept = {};
    cleaned.forEach(function (t) { if (t.orig && t.orig !== t.code) rename[t.orig] = t.code; kept[t.code] = true; });
    var valid = {};
    cleaned.forEach(function (t) { valid[t.code] = true; });
    arr(D.weeklyPlans).forEach(function (p) {
      p.activities = arr(p.activities).map(function (c) { return rename[c] || c; }).filter(function (c) { return valid[c]; });
      p.done = arr(p.done).map(function (c) { return rename[c] || c; }).filter(function (c) { return p.activities.indexOf(c) >= 0; });
    });
    D.weeklyPlans = arr(D.weeklyPlans).filter(function (p) { return !isEmptyPlan(p); });
    D.boardTools = cleaned.map(function (t) { return { code: t.code, label: t.label, category: t.category, color: t.color }; });
    if (!toolByCode(tool) && ['note', 'done', 'copy', 'erase'].indexOf(tool) < 0) tool = D.boardTools[0].code;
    save();
    closeModal();
    refresh();
    setHint('Botones actualizados.');
  }

  /* ---------------------------------------------------------------- CABALLOS */
  function openHorses(mode) {
    modal = { type: 'horses', mode: mode || { type: 'list' }, err: '', ok: '' };
    paintHorses();
  }
  function paintHorses() {
    var m = modal;
    if (m.mode.type === 'list') return paintHorseList();
    if (m.mode.type === 'new') return paintHorseForm(null);
    var h = horseById(m.mode.id);
    if (!h) { m.mode = { type: 'list' }; return paintHorseList(); }
    return paintHorseForm(h);
  }
  function paintHorseList() {
    var m = modal, list = arr(D.horses);
    paintModal(
      head('EquiLog', 'Caballos') +
      '<button class="pz-add" data-pz="horse-new" style="margin:0 0 10px">＋ Añadir caballo</button>' +
      '<div class="pz-horse-list">' + (list.length ? list.map(function (h, i) {
        return '<div class="pz-horse-item">' +
          '<button class="pz-horse-edit" data-pz="horse-open" data-a="' + E(h.id) + '">' +
          '<span>' + E(h.name) + '</span>' +
          '<em class="' + (isActiveHorse(h) ? 'on' : 'off') + '">' + E(h.status || (isActiveHorse(h) ? 'Activo' : 'Inactivo')) + '</em><b>Editar</b></button>' +
          '<div class="pz-order"><button data-pz="horse-up" data-a="' + i + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button>' +
          '<button data-pz="horse-down" data-a="' + i + '" ' + (i === list.length - 1 ? 'disabled' : '') + '>↓</button></div></div>';
      }).join('') : '<p class="pz-help">Todavía no hay caballos en esta cuadra.</p>') + '</div>' +
      '<p class="pz-help" style="margin-top:10px">El orden de esta lista es el orden de la pizarra y lo ven todos los usuarios de la cuadra. Los caballos inactivos no aparecen en la pizarra.</p>' +
      msg(m.ok) + msg(m.err, true) +
      '<div class="pz-sheet-actions"><button class="pz-secondary" data-pz="close">Cerrar</button></div>'
    );
  }
  function paintHorseForm(h) {
    var m = modal, isNew = !h;
    var st = h ? (h.status || 'Activo') : 'Activo';
    var states = ['Activo', 'Descanso', 'Lesionado', 'Inactivo', 'Vendido'];
    paintModal(
      head(isNew ? 'Nuevo' : 'Editar caballo', isNew ? 'Añadir caballo' : h.name) +
      '<button class="pz-back" data-pz="horse-list">← Todos los caballos</button>' +
      field('Nombre *', '<input id="pz-h-name" value="' + E(h ? h.name : '') + '" placeholder="Nombre del caballo">') +
      '<div class="pz-grid2">' +
      field('Estado', '<select id="pz-h-status">' + states.map(function (s) { return '<option' + (s === st ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>') +
      field('Ubicación', '<input id="pz-h-loc" value="' + E(h ? (h.location || '') : '') + '" placeholder="Cuadra, campo…">') +
      '</div>' +
      field('Notas', '<textarea id="pz-h-notes" placeholder="Información breve del caballo…">' + E(h ? (h.notes || '') : '') + '</textarea>') +
      '<label class="pz-check" style="margin:2px 0 10px"><input type="checkbox" id="pz-h-active"' + ((h ? isActiveHorse(h) : true) ? ' checked' : '') + '><span>Mostrar en la pizarra semanal</span></label>' +
      msg(m.err, true) + msg(m.ok) +
      '<button class="pz-primary" data-pz="horse-save">' + (isNew ? 'Crear caballo' : 'Guardar cambios') + '</button>' +
      (h ? '<div class="pz-quick-links"><p>Desde este caballo</p><div>' +
        '<button data-pz="quick" data-a="health:' + E(h.id) + '">🩺 Salud</button>' +
        '<button data-pz="quick" data-a="expense:' + E(h.id) + '">💸 Gasto</button>' +
        '<button data-pz="quick" data-a="reminder:' + E(h.id) + '">🔔 Recordatorio</button>' +
        '<button data-pz="horse-full" data-a="' + E(h.id) + '">📋 Ficha completa</button>' +
        '</div></div>' : '')
    );
    setTimeout(function () { var i = byId('pz-h-name'); if (i && isNew) i.focus(); }, 40);
  }
  function saveHorse() {
    var m = modal;
    if (typeof canPerm === 'function' && !canPerm('horses')) { m.err = 'No tienes permiso para crear o editar caballos.'; paintHorses(); return; }
    var name = val('pz-h-name');
    if (!name) { m.err = 'El nombre es obligatorio.'; paintHorses(); return; }
    var status = val('pz-h-status') || 'Activo';
    var active = checked('pz-h-active') && status !== 'Inactivo' && status !== 'Vendido';
    var isNew = m.mode.type === 'new';
    var h = isNew ? null : horseById(m.mode.id);
    if (isNew) {
      h = {
        id: uid(), name: name, owner: '', owners: [], breed: '', aliases: '', origin: '',
        dob: '', arrival: '', notes: val('pz-h-notes'), sire: '', dam: '', gsire: '', gdam: '',
        mgsire: '', mgdam: '', horsetelex: '', photo: null,
        active: active, status: status, location: val('pz-h-loc')
      };
      D.horses = arr(D.horses).concat([h]);
    } else {
      if (!h) { m.mode = { type: 'list' }; paintHorses(); return; }
      h.name = name; h.status = status; h.active = active;
      h.location = val('pz-h-loc'); h.notes = val('pz-h-notes');
    }
    save();
    m.err = ''; m.ok = isNew ? 'Caballo creado y añadido a la pizarra.' : 'Cambios guardados.';
    m.mode = { type: 'horse', id: h.id };
    refresh();
    paintHorses();
  }
  function moveHorse(index, dir) {
    var list = arr(D.horses), t = index + dir;
    if (t < 0 || t >= list.length) return;
    var tmp = list[index]; list[index] = list[t]; list[t] = tmp;
    D.horses = list;
    save();
    refresh();
    modal.ok = 'Orden actualizado para toda la cuadra.';
    paintHorses();
  }

  /* --------------------------------------------------------- REGISTRO RÁPIDO */
  function openQuick(kind, hid) {
    modal = {
      type: 'quick', kind: kind || 'health',
      sel: hid ? [hid] : [], err: '', ok: '', payer: ''
    };
    paintQuick();
  }
  function paintQuick() {
    var m = modal;
    var hs = boardHorses();
    var kinds = [['health', '🩺', 'Salud'], ['expense', '💸', 'Gasto'], ['reminder', '🔔', 'Recordatorio']];
    var titles = { health: 'Actuación sanitaria', expense: 'Datos del gasto', reminder: 'Qué hay que recordar' };
    var body = '';

    body += '<div class="pz-kinds">' + kinds.map(function (k) {
      return '<button class="' + (m.kind === k[0] ? 'active' : '') + '" data-pz="quick-kind" data-a="' + k[0] + '"><span>' + k[1] + '</span>' + k[2] + '</button>';
    }).join('') + '</div>';

    body += '<div class="pz-chips-wrap"><div class="pz-chips">' + hs.map(function (h) {
      var on = m.sel.indexOf(h.id) >= 0;
      return '<button class="' + (on ? 'on' : '') + '" data-pz="quick-horse" data-a="' + E(h.id) + '"><i>' + (on ? '✓' : E((h.name || '?').slice(0, 1))) + '</i>' + E(h.name) + '</button>';
    }).join('') + '</div></div>' +
      (hs.length > 1 ? '<button class="pz-selall" data-pz="quick-all">' + (m.sel.length === hs.length ? 'Quitar todos' : 'Seleccionar todos') + '</button>' : '');

    body += '<h3 style="margin:10px 0 8px;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:17px;color:#173f35">' + titles[m.kind] + '</h3>';

    if (m.kind === 'health') {
      body += field('¿Qué ha pasado o qué se ha hecho? *', '<input id="pz-q-title" placeholder="Ej.: Desparasitación">') +
        '<div class="pz-grid2">' +
        field('Tipo', '<select id="pz-q-type">' + HK.map(function (t) { return '<option value="' + t.id + '"' + (t.id === 'otro' ? ' selected' : '') + '>' + E(t.l) + '</option>'; }).join('') + '</select>') +
        field('Fecha', '<input type="date" id="pz-q-date" value="' + td() + '">') + '</div>' +
        field('Profesional o proveedor', '<input id="pz-q-payee" placeholder="Opcional">') +
        field('Notas', '<textarea id="pz-q-notes" placeholder="Detalles opcionales…"></textarea>') +
        '<div class="pz-block"><label class="pz-check"><input type="checkbox" id="pz-q-follow" data-pz="toggle-block" data-a="pz-q-follow-fields"><span>Crear recordatorio o revisión</span></label>' +
        '<div id="pz-q-follow-fields" style="display:none;margin-top:10px">' + field('Fecha concreta', '<input type="date" id="pz-q-nxt">') + delayFields('pz-q-d') + '</div></div>' +
        '<div class="pz-block money"><label class="pz-check"><input type="checkbox" id="pz-q-exp" data-pz="toggle-block" data-a="pz-q-exp-fields"><span>Tiene un gasto asociado</span></label>' +
        '<div id="pz-q-exp-fields" style="display:none;margin-top:10px">' + expenseFields(m) + '</div></div>';
    } else if (m.kind === 'expense') {
      body += field('Concepto *', '<input id="pz-q-title" placeholder="Ej.: Porte a concurso">') +
        field('Fecha', '<input type="date" id="pz-q-date" value="' + td() + '">') +
        expenseFields(m) +
        field('Notas', '<textarea id="pz-q-notes" placeholder="Detalles opcionales…"></textarea>');
    } else {
      body += field('¿Qué hay que hacer? *', '<input id="pz-q-title" placeholder="Ej.: Vacunar">') +
        field('Fecha concreta', '<input type="date" id="pz-q-nxt">') +
        '<p class="pz-help" style="margin:0 0 6px">O bien indica un plazo:</p>' + delayFields('pz-q-d') +
        field('Notas', '<textarea id="pz-q-notes" placeholder="Detalles opcionales…"></textarea>');
    }

    paintModal(
      head('Registro rápido', m.kind === 'health' ? 'Salud' : m.kind === 'expense' ? 'Gasto' : 'Recordatorio') + body +
      msg(m.err, true) + msg(m.ok) +
      '<div style="margin-top:12px"><button class="pz-primary" data-pz="quick-save">Guardar para ' + (m.sel.length || '…') + ' ' + (m.sel.length === 1 ? 'caballo' : 'caballos') + '</button></div>'
    );
  }
  function expenseFields(m) {
    return '<div class="pz-grid2">' +
      field('Importe (€)', '<input type="number" min="0" step="0.01" inputmode="decimal" id="pz-q-amount">') +
      field('Categoría', '<select id="pz-q-cat">' + EK.map(function (c) { return '<option value="' + c.id + '">' + E(c.l) + '</option>'; }).join('') + '</select>') +
      '</div>' +
      field('Proveedor', '<input id="pz-q-provider" placeholder="Veterinario, tienda…">') +
      field('Pagado por *', '<input id="pz-q-payer" value="' + E(m.payer || '') + '" placeholder="Quién lo ha pagado">') +
      payerChips(m.sel, m.payer);
  }

  function saveQuick() {
    var m = modal;
    if (!m.sel.length) { m.err = 'Selecciona al menos un caballo.'; return paintQuickKeep(); }
    var title = val('pz-q-title');
    if (!title) { m.err = m.kind === 'health' ? 'Indica qué ha pasado o qué se ha hecho.' : 'Escribe el concepto.'; return paintQuickKeep(); }

    var notes = val('pz-q-notes');
    var date = val('pz-q-date') || td();
    var created = (window._FBUSER && window._FBUSER.uid) || null;

    if (m.kind === 'health') {
      if (typeof canPerm === 'function' && !canPerm('health')) { m.err = 'No tienes permiso para registrar salud.'; return paintQuickKeep(); }
      var follow = checked('pz-q-follow');
      var nxt = follow ? (val('pz-q-nxt') || (val('pz-q-d-num') ? delayToDate(val('pz-q-d-num'), val('pz-q-d-unit')) : '')) : '';
      if (follow && !nxt) { m.err = 'Indica la fecha o el plazo del recordatorio.'; return paintQuickKeep(); }
      var withExp = checked('pz-q-exp');
      var amount = withExp ? num(val('pz-q-amount')) : 0;
      var payer = clean(val('pz-q-payer'));
      if (withExp && amount <= 0) { m.err = 'Indica el importe del gasto.'; return paintQuickKeep(); }
      if (withExp && !payer) { m.err = 'Indica quién ha pagado.'; return paintQuickKeep(); }
      var type = val('pz-q-type') || 'otro';
      var payee = clean(val('pz-q-payee'));
      m.sel.forEach(function (hid) {
        var rid = uid();
        D.health = arr(D.health).concat([{
          id: rid, hid: hid, type: type, label: title, date: date, nxt: nxt || null,
          notes: notes, amount: amount, payStatus: 'pendiente', payee: payee, createdBy: created, source: 'registro'
        }]);
        if (withExp) {
          D.expenses = arr(D.expenses).concat([{
            id: uid(), hid: hid, concept: title, amount: amount, date: date,
            cat: val('pz-q-cat') || 'vet', payer: payer, payee: clean(val('pz-q-provider')) || payee,
            status: 'pendiente', notes: notes, splits: [], healthId: rid, createdBy: created
          }]);
        }
      });
    } else if (m.kind === 'expense') {
      if (typeof canPerm === 'function' && !canPerm('expenses')) { m.err = 'No tienes permiso para registrar gastos.'; return paintQuickKeep(); }
      var amt = num(val('pz-q-amount'));
      var pay = clean(val('pz-q-payer'));
      if (amt <= 0) { m.err = 'Indica el importe.'; return paintQuickKeep(); }
      if (!pay) { m.err = 'Indica quién ha pagado.'; return paintQuickKeep(); }
      m.sel.forEach(function (hid) {
        var h = horseById(hid);
        var splits = (h && h.owners && h.owners.length) ? h.owners.map(function (o) { return { name: o.nombre || o.name || '', pct: num(o.pct) }; }).filter(function (x) { return x.name && x.pct > 0; }) : [];
        D.expenses = arr(D.expenses).concat([{
          id: uid(), hid: hid, concept: title, amount: amt, date: date,
          cat: val('pz-q-cat') || 'otro_g', payer: pay, payee: clean(val('pz-q-provider')),
          status: 'pendiente', notes: notes, splits: splits, createdBy: created
        }]);
      });
    } else {
      if (typeof canPerm === 'function' && !canPerm('health')) { m.err = 'No tienes permiso para crear recordatorios.'; return paintQuickKeep(); }
      var when = val('pz-q-nxt') || (val('pz-q-d-num') ? delayToDate(val('pz-q-d-num'), val('pz-q-d-unit')) : '');
      if (!when) { m.err = 'Indica una fecha concreta o un plazo.'; return paintQuickKeep(); }
      m.sel.forEach(function (hid) {
        D.health = arr(D.health).concat([{
          id: uid(), hid: hid, type: 'otro', label: title, date: td(), nxt: when,
          notes: notes, amount: 0, payStatus: 'pendiente', payee: '', createdBy: created, reminder: true, source: 'registro'
        }]);
      });
    }

    save();
    var n = m.sel.length;
    m.err = '';
    m.ok = (n === 1 ? 'Registro guardado' : n + ' registros guardados') + ' en la ficha de ' + (n === 1 ? 'ese caballo' : 'esos caballos') + '.';
    m.sel = [];
    paintQuick();
    toast(n === 1 ? 'Registro guardado' : n + ' registros guardados');
  }
  /* repinta conservando lo escrito en los campos */
  function paintQuickKeep() {
    var m = modal;
    var keep = {};
    ['pz-q-title', 'pz-q-notes', 'pz-q-date', 'pz-q-amount', 'pz-q-payer', 'pz-q-provider', 'pz-q-payee', 'pz-q-nxt', 'pz-q-d-num'].forEach(function (id) {
      var e = byId(id); if (e) keep[id] = e.value;
    });
    paintQuick();
    Object.keys(keep).forEach(function (id) { var e = byId(id); if (e) e.value = keep[id]; });
    m.err = m.err;
  }

  /* =========================================================================
     EVENTOS (delegación única)
     ========================================================================= */

  function bind() {
    if (bound) return;
    bound = true;

    document.addEventListener('click', function (ev) {
      var el = ev.target.closest ? ev.target.closest('[data-pz]') : null;
      if (!el) return;
      var cmd = el.getAttribute('data-pz');
      var a = el.getAttribute('data-a');

      /* cierre de modal pulsando fuera */
      if (cmd === 'backdrop') { if (ev.target === el) closeModal(); return; }
      if (cmd === 'close') { closeModal(); return; }

      switch (cmd) {
        /* --- pizarra --- */
        case 'tool':
          tool = a;
          if (a !== 'copy') copySource = null; else copySource = null;
          setHint('');
          refresh();
          return;
        case 'cell': onCell(el.getAttribute('data-h'), el.getAttribute('data-d')); return;
        case 'horse': onHorseName(el.getAttribute('data-h')); return;
        case 'day': onDayHeader(el.getAttribute('data-d')); return;
        case 'week': V.boardWeek = addD(V.boardWeek || boardStartOfWeek(td()), Number(a) * 7); copySource = null; setHint(''); refresh(); return;
        case 'today': V.boardWeek = boardStartOfWeek(td()); copySource = null; setHint(''); refresh(); return;
        case 'repeat': repeatPreviousWeek(); return;
        case 'clearcopy': copySource = null; setHint('Elige otra casilla de origen.'); refresh(); return;
        case 'more': if (typeof openMorePanel === 'function') openMorePanel(); return;

        /* --- modales --- */
        case 'quick':
          if (a) { var parts = a.split(':'); closeModal(); openQuick(parts[0], parts[1]); }
          else openQuick('health', null);
          return;
        case 'horses': openHorses({ type: 'list' }); return;
        case 'tools': openTools(); return;

        case 'note-save': saveNote(false); return;
        case 'note-clear': saveNote(true); return;
        case 'done-toggle': toggleDone(a); return;
        case 'vet-save': saveVet(); return;
        case 'vet-remove': removeVet(); return;

        case 'toggle-block': {
          var box = byId(a);
          if (box) box.style.display = el.checked ? '' : 'none';
          return;
        }
        case 'payer': {
          var inp = byId('pz-vet-payer') || byId('pz-q-payer');
          if (inp) inp.value = a;
          if (modal) modal.payer = a;
          el.parentElement.querySelectorAll('button').forEach(function (b) { b.classList.remove('on'); });
          el.classList.add('on');
          return;
        }

        /* --- editor de botones --- */
        case 'tool-add': modal.drafts.push({ code: '', label: '', category: 'activity', color: 'forest', orig: null }); paintTools(); return;
        case 'tool-del': modal.drafts.splice(Number(a), 1); paintTools(); return;
        case 'tool-up': { var i = Number(a); var d = modal.drafts; var t0 = d[i - 1]; d[i - 1] = d[i]; d[i] = t0; paintTools(); return; }
        case 'tool-down': { var j = Number(a); var d2 = modal.drafts; var t1 = d2[j + 1]; d2[j + 1] = d2[j]; d2[j] = t1; paintTools(); return; }
        case 'tool-color': modal.drafts[Number(a)].color = el.getAttribute('data-c'); paintTools(); return;
        case 'tool-save': saveTools(); return;

        /* --- caballos --- */
        case 'horse-new': modal.mode = { type: 'new' }; modal.err = ''; modal.ok = ''; paintHorses(); return;
        case 'horse-open': modal.mode = { type: 'horse', id: a }; modal.err = ''; modal.ok = ''; paintHorses(); return;
        case 'horse-list': modal.mode = { type: 'list' }; modal.err = ''; modal.ok = ''; paintHorses(); return;
        case 'horse-save': saveHorse(); return;
        case 'horse-up': moveHorse(Number(a), -1); return;
        case 'horse-down': moveHorse(Number(a), 1); return;
        case 'horse-full': closeModal(); V = { name: 'horse', hid: a, tab: 'entrenos' }; render(); return;

        /* --- registro rápido --- */
        case 'quick-kind': modal.kind = a; modal.err = ''; modal.ok = ''; paintQuick(); return;
        case 'quick-horse': {
          var k = modal.sel.indexOf(a);
          if (k >= 0) modal.sel.splice(k, 1); else modal.sel.push(a);
          paintQuickKeep();
          return;
        }
        case 'quick-all': {
          var all = boardHorses().map(function (h) { return h.id; });
          modal.sel = modal.sel.length === all.length ? [] : all;
          paintQuickKeep();
          return;
        }
        case 'quick-save': saveQuick(); return;
      }
    });

    /* campos del editor de botones (se escriben sin repintar) */
    document.addEventListener('input', function (ev) {
      var el = ev.target;
      if (!el || !el.getAttribute) return;
      var cmd = el.getAttribute('data-pz');
      if (!cmd || !modal) return;
      var i = Number(el.getAttribute('data-a'));
      if (cmd === 'tool-code' && modal.drafts) modal.drafts[i].code = el.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ0-9]/g, '');
      if (cmd === 'tool-label' && modal.drafts) modal.drafts[i].label = el.value;
    });
    document.addEventListener('change', function (ev) {
      var el = ev.target;
      if (!el || !el.getAttribute) return;
      var cmd = el.getAttribute('data-pz');
      if (cmd === 'tool-cat' && modal && modal.drafts) modal.drafts[Number(el.getAttribute('data-a'))].category = el.value;
      if (cmd === 'toggle-block') { var box = byId(el.getAttribute('data-a')); if (box) box.style.display = el.checked ? '' : 'none'; }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && modal) closeModal();
    });
  }

  /* =========================================================================
     API pública usada por legacy-app.js
     ========================================================================= */

  window.rBoard = function () { bind(); return renderBoard(); };
  window.pzMounted = function () { paintSaveState(); fit(); setTimeout(fit, 60); };
  window.pzOpenQuick = function (kind, hid) { bind(); openQuick(kind || 'health', hid || null); };
  window.pzOpenHorses = function () { bind(); openHorses({ type: 'list' }); };
  window.pzOpenTools = function () { bind(); openTools(); };
  window.pzGoBoard = function () { V = { name: 'board', boardWeek: V.boardWeek || boardStartOfWeek(td()) }; render(); };
})();
