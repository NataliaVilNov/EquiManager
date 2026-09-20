(function(){
  const LS = 'equilog.v43.roles.clases.pizarra';
  const root = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const DAYS = ['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];
  const DAY_NAMES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const ACTIVITIES = [
    {id:'P', label:'Paddock', cls:'paddock'},
    {id:'C', label:'Caminador', cls:'caminador'},
    {id:'CU', label:'Cuerda', cls:'cuerda'},
    {id:'M', label:'Monta', cls:'nota'},
    {id:'VET', label:'Veterinario', cls:'vet'},
    {id:'H', label:'Herrador', cls:'vet'},
    {id:'SHOW', label:'Concurso', cls:'show'},
    {id:'N', label:'Nota', cls:'nota'},
    {id:'OK', label:'Hecho', cls:'hecho'}
  ];
  const ROLE_LABELS = { gerente:'Gerente', profesor:'Profesor/a', propietario:'Propietario/a', jinete:'Jinete/responsable', admin:'Administración' };

  let S = load();
  let view = S.settings.activeView || 'inicio';
  let weekOffset = 0;
  let classTab = 'semana';

  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  function load(){
    try{ const s = JSON.parse(localStorage.getItem(LS)); if(s && s.profiles && s.horses) return s; }catch(e){}
    const s = clone(window.EQ_SEED); localStorage.setItem(LS, JSON.stringify(s)); return s;
  }
  function save(){ S.settings.activeView = view; localStorage.setItem(LS, JSON.stringify(S)); }
  function uid(p){ return p + '_' + Math.random().toString(36).slice(2,9); }
  function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function profile(id){ return S.profiles.find(p=>p.id===id); }
  function horse(id){ return S.horses.find(h=>h.id===id); }
  function student(id){ return S.students.find(x=>x.id===id); }
  function cls(id){ return S.classes.find(x=>x.id===id); }
  function me(){ return profile(S.activeProfileId) || S.profiles[0]; }
  function hasRole(r){ const m=me(); return (m.roles||[]).includes(r); }
  function isManager(){ return hasRole('gerente'); }
  function todayIso(){ const d=new Date(); d.setHours(0,0,0,0); return iso(d); }
  function iso(d){ return d.toISOString().slice(0,10); }
  function fromIso(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
  function dow(d){ return (d.getDay()+6)%7; }
  function monday(offset=0){ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-dow(d)+offset*7); return d; }
  function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
  function weekDates(offset=0){ const m=monday(offset); return Array.from({length:7},(_,i)=>iso(addDays(m,i))); }
  function fmtDate(s){ const d=fromIso(s); return `${d.getDate()}/${d.getMonth()+1}`; }
  function initials(name){ return String(name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }
  function avatar(p, big=false){ return `<span class="avatar ${big?'big':''}" style="background:${p.color||'#1f3a2e'}">${p.photo?`<img src="${esc(p.photo)}" alt="">`:esc(initials(p.alias||p.name))}</span>`; }
  function rolesText(p){ return (p.roles||[]).map(r=>ROLE_LABELS[r]||r).join(' · ') || 'Sin rol'; }

  function canSeeClasses(){ return isManager() || hasRole('profesor') || !!me().permissions?.canCreateClass; }
  function canUseBoard(){ return isManager() || hasRole('jinete') || accessibleHorses().length>0; }
  function canCreateHorse(){ return isManager() || hasRole('jinete') || hasRole('propietario') || !!me().permissions?.canCreateHorse; }
  function canEditProfiles(){ return isManager() || !!me().permissions?.canEditProfiles; }

  function accessibleHorses(){
    const m=me();
    if(isManager()) return S.horses;
    return S.horses.filter(h => {
      if((m.roles||[]).includes('propietario') && (h.ownerIds||[]).includes(m.id)) return true;
      if((m.roles||[]).includes('jinete') && (h.riderId===m.id || (m.privateStableId && (h.stableIds||[]).includes(m.privateStableId)))) return true;
      if((m.roles||[]).includes('profesor') && h.school) return true;
      return false;
    });
  }
  function accessibleClasses(){
    const m=me();
    if(isManager()) return S.classes;
    if(hasRole('profesor')) return S.classes.filter(c=>c.professorId===m.id);
    return [];
  }

  function navItems(){
    const items=[['inicio','Inicio','⌂']];
    if(canUseBoard()) items.push(['pizarra','Pizarra','▦']);
    items.push(['caballos','Caballos','♞']);
    if(canSeeClasses()) items.push(['clases','Clases','✓']);
    items.push(['mas','Más','⋯']);
    return items;
  }
  function setView(v){ view=v; save(); render(); }
  function shell(content){
    const m=me();
    const nav=navItems();
    return `<div class="app">
      <header class="topbar">
        <div class="brand"><div class="brand-mark">E</div><div><p class="brand-eyebrow">EquiLog v43</p><h1>${titleFor(view)}</h1></div></div>
        <button class="profile-pill" data-action="profile-switch">${avatar(m)}<span class="label">${esc(m.name)}</span></button>
      </header>
      ${content}
    </div>
    <nav class="bottom-nav">${nav.map(([id,label,ico])=>`<button class="nav-btn ${view===id?'active':''}" data-view="${id}"><span class="ico">${ico}</span><span>${label}</span></button>`).join('')}</nav>`;
  }
  function titleFor(v){ return ({inicio:'Inicio',pizarra:'Pizarra semanal',caballos:'Caballos',clases:'Clases',mas:'Más'}[v]||'EquiLog'); }

  function render(){
    let html='';
    if(!navItems().some(x=>x[0]===view)) view='inicio';
    if(view==='inicio') html=viewInicio();
    if(view==='pizarra') html=viewPizarra();
    if(view==='caballos') html=viewCaballos();
    if(view==='clases') html=viewClases();
    if(view==='mas') html=viewMas();
    root.innerHTML=shell(html);
  }

  function todayItems(){
    const t=todayIso();
    const horses=accessibleHorses();
    const hids=new Set(horses.map(h=>h.id));
    const board=S.boardEntries.filter(b=>b.date===t && hids.has(b.horseId));
    const classes=accessibleClasses().filter(c=>c.date===t);
    const reminders=S.records.filter(r=>r.reminderDate===t && (!r.horseId || hids.has(r.horseId)));
    return {board,classes,reminders};
  }
  function viewInicio(){
    const m=me();
    const ti=todayItems();
    return `<section class="view-title"><h2>Hola, ${esc(m.alias||m.name)}</h2><p>${esc(rolesText(m))}. Solo ves lo que tienes asignado.</p></section>
      <section class="card"><h3>Hoy importa</h3>
        ${ti.board.length||ti.classes.length||ti.reminders.length?'' : '<p class="muted small">No hay nada urgente para hoy.</p>'}
        <div class="list">
          ${ti.classes.map(c=>`<button class="row-card" data-action="open-class" data-id="${c.id}"><span class="avatar" style="background:#3f5f8f">C</span><span class="row-card-main"><b>${esc(c.time)} · ${esc(c.title)}</b><small>${c.studentIds.length} alumno(s) · asistencia pendiente</small></span></button>`).join('')}
          ${ti.board.map(b=>`<button class="row-card" data-view="pizarra"><span class="avatar" style="background:#3f5f8f">${esc(b.activity)}</span><span class="row-card-main"><b>${esc(horse(b.horseId)?.name||'Caballo')}</b><small>Pizarra de hoy · ${esc(activityLabel(b.activity))}</small></span></button>`).join('')}
          ${ti.reminders.map(r=>`<button class="row-card" data-action="open-horse" data-id="${r.horseId||''}"><span class="avatar" style="background:#a8721f">R</span><span class="row-card-main"><b>${esc(r.title)}</b><small>${esc(horse(r.horseId)?.name||'Recordatorio')}</small></span></button>`).join('')}
        </div>
      </section>
      <section class="section"><h3>Accesos</h3><div class="quick-cards">
        ${canUseBoard()?`<button class="quick-card" data-view="pizarra"><b>Pizarra</b><span>Caballos por días</span></button>`:''}
        <button class="quick-card" data-view="caballos"><b>Caballos</b><span>${accessibleHorses().length} visibles para ti</span></button>
        ${canSeeClasses()?`<button class="quick-card" data-view="clases"><b>Clases</b><span>Asistencia y alumnos</span></button>`:''}
        <button class="quick-card" data-action="quick-record"><b>+ Registro</b><span>Pizarra, vet, herrador, nota</span></button>
      </div></section>`;
  }

  function viewPizarra(){
    const horses=accessibleHorses().filter(h=>!hasRole('profesor') || isManager() || hasRole('jinete') || hasRole('propietario') || h.school);
    const dates=weekDates(weekOffset);
    const range=`${fmtDate(dates[0])}–${fmtDate(dates[6])}`;
    const people=S.profiles.filter(p=>p.roles.includes('jinete')||p.roles.includes('profesor')||p.roles.includes('gerente'));
    return `<section class="legend">
        <div class="legend-group"><p class="legend-label">Personas</p><div class="legend-pills">${people.map(p=>`<span class="pill person" style="background:${soft(p.color)};color:${p.color}"><span class="code">${esc(initials(p.alias||p.name))}</span>${esc(p.alias||p.name)}</span>`).join('')}</div></div>
        <div class="legend-group"><p class="legend-label">Actividades</p><div class="legend-pills">
          ${ACTIVITIES.map(a=>`<span class="pill ${a.cls}"><span class="code">${a.id==='SHOW'?'★':a.id==='OK'?'✓':a.id}</span>${a.label}</span>`).join('')}
        </div></div>
      </section>
      <div class="weeknav">
        <button class="btn" data-action="week" data-n="-1">← Anterior</button>
        <button class="btn-today" data-action="week" data-n="0">◷ Hoy</button>
        <button class="btn" data-action="week" data-n="1">Siguiente →</button>
        <button class="btn" data-action="repeat-week">↻ Repetir anterior</button>
        <button class="btn btn-primary" data-action="quick-record" data-kind="pizarra">+ Registro</button>
        ${canCreateHorse()?`<button class="btn" data-action="new-horse">+ Caballo</button>`:''}
        <span class="weekrange">${range}</span>
      </div>
      ${horses.length? `<div class="board-scroll"><div class="board"><table><thead><tr><th class="horse-col">Caballo</th>${dates.map((d,i)=>`<th class="${d===todayIso()?'today':''} ${i>4?'weekend':''}"><span class="daylabel">${DAYS[i]}</span><span class="daynum">${fromIso(d).getDate()}</span>${d===todayIso()?'<span class="hoy-tag">Hoy</span>':''}${i>4?'<span class="weekend-tag">Fin semana</span>':''}</th>`).join('')}</tr></thead><tbody>${horses.map(h=>`<tr><td class="horse-col">${esc(h.name)} <button class="edit-ic" data-action="open-horse" data-id="${h.id}">✎</button></td>${dates.map((d,i)=>cellHtml(h.id,d,i)).join('')}</tr>`).join('')}</tbody></table></div></div>` : `<div class="notice"><span>ℹ️</span><span><b>Sin caballos.</b> Tu perfil no tiene caballos asignados o no tiene acceso a pizarra.</span></div>`}`;
  }
  function soft(color){
    const c=color.replace('#',''); if(c.length!==6) return '#e3e9f4';
    const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);
    return `rgba(${r},${g},${b},.14)`;
  }
  function activityLabel(id){ return ACTIVITIES.find(a=>a.id===id)?.label || id; }
  function activityClass(id){ return ACTIVITIES.find(a=>a.id===id)?.cls || 'nota'; }
  function cellHtml(horseId,date,i){
    const entries=S.boardEntries.filter(b=>b.horseId===horseId && b.date===date);
    const inside = entries.length ? entries.map(entryBadge).join('<br>') : '<span class="dot">·</span>';
    return `<td class="cell ${date===todayIso()?'today':''} ${i>4?'weekend':''}"><button class="cell-btn" data-action="cell" data-horse="${horseId}" data-date="${date}">${inside}</button></td>`;
  }
  function entryBadge(b){
    const cls=activityClass(b.activity);
    if(b.done) return `<span class="done">✓${esc(initials(profile(b.personId)?.alias||profile(b.personId)?.name||''))}</span>`;
    if(b.activity==='SHOW') return `<span class="chip-show">Show</span>`;
    if(b.note && (b.activity==='M'||b.activity==='N'||b.activity==='P')) return `<span class="stack"><span class="chip ${cls}">${esc(b.code||b.activity)}</span><span class="sub">${esc(b.note)}</span></span>`;
    return `<span class="chip ${cls}">${esc(b.code||b.activity)}</span>`;
  }

  function viewCaballos(){
    const horses=accessibleHorses();
    return `<section class="view-title"><h2>Caballos</h2><p>${horses.length} caballo(s) visibles para tu perfil.</p></section>
      <div class="btn-row">${canCreateHorse()?`<button class="btn btn-primary" data-action="new-horse">+ Caballo</button>`:''}<button class="btn" data-action="quick-record">+ Registro</button></div>
      <section class="section list">${horses.map(h=>horseRow(h)).join('')||'<div class="notice"><span>ℹ️</span><span>No tienes caballos asignados.</span></div>'}</section>`;
  }
  function horseRow(h){
    const owners=(h.ownerIds||[]).map(id=>profile(id)?.name).filter(Boolean).join(', ')||'Sin propietario';
    const rider=profile(h.riderId)?.name||'Sin jinete';
    return `<button class="row-card" data-action="open-horse" data-id="${h.id}"><span class="avatar" style="background:#3f5f8f">${esc(initials(h.name))}</span><span class="row-card-main"><b>${esc(h.name)}</b><small>${esc(h.type)} · ${esc(rider)} · ${esc(owners)}</small></span>${h.school?'<span class="tag ok">Escuela</span>':''}</button>`;
  }

  function viewClases(){
    if(!canSeeClasses()) return `<div class="notice"><span>🔒</span><span>No tienes acceso al módulo de clases.</span></div>`;
    const classes=accessibleClasses().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    return `<section class="view-title"><h2>Clases</h2><p>Organiza clases, asigna caballo o poni y marca asistencia.</p></section>
      <div class="tabs"><button class="tab-chip ${classTab==='semana'?'active':''}" data-action="class-tab" data-tab="semana">Semana</button><button class="tab-chip ${classTab==='alumnos'?'active':''}" data-action="class-tab" data-tab="alumnos">Alumnos</button><button class="tab-chip ${classTab==='profesores'?'active':''}" data-action="class-tab" data-tab="profesores">Profesores</button></div>
      <div class="btn-row"><button class="btn btn-primary" data-action="new-class">+ Clase</button><button class="btn" data-action="new-student">+ Alumno</button></div>
      ${classTab==='semana'?`<section class="section list">${classes.map(classCard).join('')||'<div class="notice"><span>ℹ️</span><span>No hay clases todavía.</span></div>'}</section>`:''}
      ${classTab==='alumnos'?studentsView():''}
      ${classTab==='profesores'?professorsView():''}`;
  }
  function classCard(c){
    const prof=profile(c.professorId)?.name||'Sin profesor';
    const done=Object.values(c.attendance||{}).filter(x=>x==='vino').length;
    return `<button class="class-card" data-action="open-class" data-id="${c.id}">
      <b>${esc(c.date)} · ${esc(c.time)} · ${esc(c.title)}</b><br><span class="muted small">${esc(c.type)} · ${esc(prof)} · ${c.studentIds.length} alumno(s) · ${done}/${c.studentIds.length} asistencia</span>
    </button>`;
  }
  function studentsView(){
    return `<section class="section list">${S.students.map(s=>`<button class="row-card" data-action="open-student" data-id="${s.id}"><span class="avatar" style="background:#a8721f">${esc(initials(s.name))}</span><span class="row-card-main"><b>${esc(s.name)}</b><small>${esc(s.level)} · habitual: ${esc(horse(s.usualHorseId)?.name||'sin asignar')}</small></span></button>`).join('')}</section>`;
  }
  function professorsView(){
    const ps=S.profiles.filter(p=>(p.roles||[]).includes('profesor'));
    return `<section class="section list">${ps.map(p=>`<button class="row-card" data-action="edit-profile" data-id="${p.id}">${avatar(p)}<span class="row-card-main"><b>${esc(p.name)}</b><small>${esc(rolesText(p))}</small></span></button>`).join('')}</section>`;
  }

  function viewMas(){
    const m=me();
    return `<section class="view-title"><h2>Más</h2><p>Perfil, roles y ajustes.</p></section>
      <section class="card"><div style="display:flex;gap:12px;align-items:center">${avatar(m,true)}<div><h3>${esc(m.name)}</h3><p class="muted small">${esc(rolesText(m))}</p></div></div><div class="btn-row"><button class="btn" data-action="edit-profile" data-id="${m.id}">Editar mi perfil</button><button class="btn" data-action="profile-switch">Cambiar perfil demo</button></div></section>
      <section class="section grid">
        ${canEditProfiles()?`<button class="quick-card" data-action="new-profile"><b>+ Perfil</b><span>Crear persona y roles</span></button>`:''}
        <button class="quick-card" data-action="quick-record"><b>+ Registro</b><span>Pizarra, vet, herrador...</span></button>
        ${canCreateHorse()?`<button class="quick-card" data-action="new-horse"><b>+ Caballo</b><span>Alta rápida</span></button>`:''}
        <button class="quick-card" data-action="reset-demo"><b>Restaurar demo</b><span>Borrar datos locales</span></button>
      </section>
      ${canEditProfiles()?`<section class="section"><h3>Perfiles</h3><div class="list">${S.profiles.map(p=>`<button class="row-card" data-action="edit-profile" data-id="${p.id}">${avatar(p)}<span class="row-card-main"><b>${esc(p.name)}</b><small>${esc(rolesText(p))}</small></span></button>`).join('')}</div></section>`:''}`;
  }

  function openModal(html){ modalRoot.innerHTML=`<div class="modal-back" data-action="close-modal"><div class="modal" onclick="event.stopPropagation()">${html}</div></div>`; }
  function closeModal(){ modalRoot.innerHTML=''; }
  function formVal(id){ return document.getElementById(id)?.value || ''; }
  function formCheckedAll(name){ return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(x=>x.value); }

  function modalProfileSwitch(){
    openModal(`<div class="modal-head"><h3>Cambiar perfil</h3><button class="btn" data-action="close-modal">Cerrar</button></div><div class="list">${S.profiles.map(p=>`<button class="row-card" data-action="set-profile" data-id="${p.id}">${avatar(p)}<span class="row-card-main"><b>${esc(p.name)}</b><small>${esc(rolesText(p))}</small></span>${p.id===S.activeProfileId?'<span class="tag ok">Activo</span>':''}</button>`).join('')}</div>`);
  }
  function modalEditProfile(id){
    const p = profile(id) || {id:uid('p'), name:'', alias:'', color:'#3f5f8f', roles:[], privateStableId:null, permissions:{}};
    const can = canEditProfiles() || p.id===me().id;
    if(!can){ alert('No tienes permiso para editar este perfil'); return; }
    openModal(`<div class="modal-head"><h3>${id?'Perfil':'Nuevo perfil'}</h3><button class="btn" data-action="close-modal">Cerrar</button></div>
      <div class="form-grid">
        <label class="field"><span>Nombre</span><input id="pf-name" class="input" value="${esc(p.name)}"></label>
        <label class="field"><span>Mote / alias</span><input id="pf-alias" class="input" value="${esc(p.alias||'')}"></label>
        <label class="field"><span>Color</span><input id="pf-color" type="color" class="input" value="${esc(p.color||'#3f5f8f')}"></label>
        <label class="field"><span>Foto URL/base64</span><input id="pf-photo" class="input" value="${esc(p.photo||'')}" placeholder="opcional"></label>
      </div>
      <div class="field" style="margin-top:12px"><span>Roles</span><div class="check-row">${Object.entries(ROLE_LABELS).map(([r,l])=>`<label class="check-pill"><input type="checkbox" name="pf-roles" value="${r}" ${(p.roles||[]).includes(r)?'checked':''} ${canEditProfiles()?'':'disabled'}>${l}</label>`).join('')}</div></div>
      <div class="modal-actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="save-profile" data-id="${p.id}" data-new="${id?'0':'1'}">Guardar</button></div>`);
  }

  function modalHorse(id){
    const h=horse(id);
    if(!h) return;
    const canEdit=isManager() || (h.ownerIds||[]).includes(me().id) || h.riderId===me().id;
    const owners=(h.ownerIds||[]).map(id=>profile(id)?.name).filter(Boolean).join(', ')||'Sin propietario';
    const records=S.records.filter(r=>r.horseId===h.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
    openModal(`<div class="modal-head"><h3>${esc(h.name)}</h3><button class="btn" data-action="close-modal">Cerrar</button></div>
      <p class="muted small">${esc(h.type)} · Prop.: ${esc(owners)} · Jinete: ${esc(profile(h.riderId)?.name||'Sin asignar')}</p>
      <div class="btn-row"><button class="btn btn-primary" data-action="quick-record" data-horse="${h.id}">+ Registro</button>${canEdit?`<button class="btn" data-action="edit-horse" data-id="${h.id}">Editar</button>`:''}</div>
      <section class="section"><h3>Últimos registros</h3><div class="list">${records.map(r=>`<div class="row-card"><span class="avatar" style="background:#a8721f">${esc(r.type[0].toUpperCase())}</span><span class="row-card-main"><b>${esc(r.title||r.type)}</b><small>${esc(r.date)}${r.reminderDate?` · recordatorio ${esc(r.reminderDate)}`:''}${r.note?` · ${esc(r.note)}`:''}</small></span></div>`).join('') || '<p class="muted small">Sin registros.</p>'}</div></section>`);
  }
  function modalNewHorse(id){
    const h = id? horse(id): null;
    const owners=S.profiles.filter(p=>p.roles.includes('propietario') || p.roles.includes('jinete'));
    const riders=S.profiles.filter(p=>p.roles.includes('jinete') || p.roles.includes('profesor'));
    openModal(`<div class="modal-head"><h3>${h?'Editar caballo':'+ Caballo'}</h3><button class="btn" data-action="close-modal">Cerrar</button></div>
      <div class="form-grid">
        <label class="field"><span>Nombre</span><input id="h-name" class="input" value="${esc(h?.name||'')}"></label>
        <label class="field"><span>Tipo</span><input id="h-type" class="input" value="${esc(h?.type||'Caballo')}"></label>
        <label class="field"><span>Jinete/responsable</span><select id="h-rider" class="input"><option value="">Sin asignar</option>${riders.map(p=>`<option value="${p.id}" ${h?.riderId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
        <label class="field"><span>Uso escuela</span><select id="h-school" class="input"><option value="0" ${h&&!h.school?'selected':''}>No</option><option value="1" ${h?.school?'selected':''}>Sí</option></select></label>
      </div>
      <div class="field" style="margin-top:12px"><span>Propietarios</span><div class="check-row">${owners.map(p=>`<label class="check-pill"><input type="checkbox" name="h-owners" value="${p.id}" ${(h?.ownerIds||[]).includes(p.id)||(!h&&!isManager()&&p.id===me().id)?'checked':''}>${esc(p.name)}</label>`).join('')}</div></div>
      <div class="modal-actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="save-horse" data-id="${h?.id||''}">Guardar</button></div>`);
  }

  function modalQuickRecord(defaults={}){
    const horses=accessibleHorses();
    const fixedHorse=defaults.horseId || defaults.horse || '';
    const type=defaults.kind || 'pizarra';
    openModal(`<div class="modal-head"><h3>+ Registro</h3><button class="btn" data-action="close-modal">Cerrar</button></div>
      <div class="form-grid">
        <label class="field"><span>Tipo</span><select id="r-type" class="input" data-action="record-type-change"><option value="pizarra" ${type==='pizarra'?'selected':''}>Pizarra</option><option value="veterinario">Veterinario</option><option value="herrador">Herrador</option><option value="recordatorio">Recordatorio</option><option value="nota">Nota</option></select></label>
        <label class="field"><span>Fecha</span><input id="r-date" type="date" class="input" value="${defaults.date || todayIso()}"></label>
        <label class="field"><span>Caballo</span><select id="r-horse" class="input">${horses.map(h=>`<option value="${h.id}" ${fixedHorse===h.id?'selected':''}>${esc(h.name)}</option>`).join('')}</select></label>
      </div>
      <div id="record-extra">${recordExtraHtml(type)}</div>
      <div class="modal-actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="save-record">Guardar</button></div>`);
  }
  function recordExtraHtml(type){
    if(type==='pizarra') return `<div class="form-grid" style="margin-top:12px"><label class="field"><span>Actividad</span><select id="r-activity" class="input">${ACTIVITIES.map(a=>`<option value="${a.id}">${a.label}</option>`).join('')}</select></label><label class="field"><span>Persona</span><select id="r-person" class="input">${S.profiles.map(p=>`<option value="${p.id}" ${p.id===me().id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label class="field"><span>Nota opcional</span><input id="r-note" class="input" placeholder="persona externa, detalle..."></label></div><p class="muted small">La pizarra no pide importe.</p>`;
    if(type==='veterinario'||type==='herrador') return `<div class="form-grid" style="margin-top:12px"><label class="field"><span>Concepto</span><input id="r-title" class="input" value="${type==='veterinario'?'Veterinario':'Herrador'}"></label><label class="field"><span>Recordatorio futuro opcional</span><input id="r-reminder" type="date" class="input"></label><label class="field"><span>Nota</span><input id="r-note" class="input"></label></div>`;
    if(type==='recordatorio') return `<div class="form-grid" style="margin-top:12px"><label class="field"><span>Concepto</span><input id="r-title" class="input" value="Recordatorio"></label><label class="field"><span>Fecha recordatorio</span><input id="r-reminder" type="date" class="input" value="${todayIso()}"></label><label class="field"><span>Nota</span><input id="r-note" class="input"></label></div>`;
    return `<div class="field" style="margin-top:12px"><span>Nota</span><textarea id="r-note" class="input"></textarea></div>`;
  }

  function modalClass(id){
    const c=cls(id);
    if(!c) return;
    const schoolHorses=S.horses.filter(h=>h.school || isManager());
    openModal(`<div class="modal-head"><h3>${esc(c.title)}</h3><button class="btn" data-action="close-modal">Cerrar</button></div>
      <p class="muted small">${esc(c.date)} · ${esc(c.time)} · ${esc(profile(c.professorId)?.name||'Sin profesor')} · ${esc(c.place||'')}</p>
      <section class="section"><h3>Alumnos y asistencia</h3>
        ${c.studentIds.map(sid=>{ const s=student(sid); return `<div class="attendance-row"><div><b>${esc(s?.name||'Alumno')}</b><br><small class="muted">${esc(s?.level||'')}</small></div><select class="input" data-action="assign-horse" data-class="${c.id}" data-student="${sid}"><option value="">Sin asignar</option>${schoolHorses.map(h=>`<option value="${h.id}" ${(c.assignments||{})[sid]===h.id?'selected':''}>${esc(h.name)}</option>`).join('')}</select><div class="attendance-toggle"><button class="mini-btn ${(c.attendance||{})[sid]==='vino'?'active':''}" data-action="attendance" data-class="${c.id}" data-student="${sid}" data-v="vino">✓ vino</button><button class="mini-btn ${(c.attendance||{})[sid]==='no'?'active':''}" data-action="attendance" data-class="${c.id}" data-student="${sid}" data-v="no">no vino</button></div></div>`; }).join('')}
      </section>
      <div class="btn-row"><button class="btn" data-action="edit-class" data-id="${c.id}">Editar clase</button><button class="btn btn-primary" data-action="mark-all" data-id="${c.id}">Marcar todos ✓</button></div>`);
  }
  function modalNewClass(id){
    const c = id? cls(id): null;
    const profs=S.profiles.filter(p=>p.roles.includes('profesor')||p.roles.includes('gerente'));
    openModal(`<div class="modal-head"><h3>${c?'Editar clase':'+ Clase'}</h3><button class="btn" data-action="close-modal">Cerrar</button></div>
      <div class="form-grid"><label class="field"><span>Título</span><input id="c-title" class="input" value="${esc(c?.title||'Clase')}"></label><label class="field"><span>Tipo</span><select id="c-type" class="input"><option value="particular" ${c?.type==='particular'?'selected':''}>Particular</option><option value="grupo" ${c?.type==='grupo'?'selected':''}>Grupo</option><option value="ponis" ${c?.type==='ponis'?'selected':''}>Grupo ponis</option></select></label><label class="field"><span>Fecha</span><input id="c-date" type="date" class="input" value="${esc(c?.date||todayIso())}"></label><label class="field"><span>Hora</span><input id="c-time" type="time" class="input" value="${esc(c?.time||'17:00')}"></label><label class="field"><span>Profesor</span><select id="c-prof" class="input">${profs.map(p=>`<option value="${p.id}" ${(c?.professorId||me().id)===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label class="field"><span>Lugar</span><input id="c-place" class="input" value="${esc(c?.place||'Pista')}"></label></div>
      <div class="field" style="margin-top:12px"><span>Alumnos</span><div class="check-row">${S.students.map(s=>`<label class="check-pill"><input type="checkbox" name="c-students" value="${s.id}" ${(c?.studentIds||[]).includes(s.id)?'checked':''}>${esc(s.name)}</label>`).join('')}</div></div>
      <div class="modal-actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="save-class" data-id="${c?.id||''}">Guardar</button></div>`);
  }
  function modalNewStudent(id){
    const s=id?student(id):null;
    openModal(`<div class="modal-head"><h3>${s?'Alumno':'Nuevo alumno'}</h3><button class="btn" data-action="close-modal">Cerrar</button></div><div class="form-grid"><label class="field"><span>Nombre</span><input id="s-name" class="input" value="${esc(s?.name||'')}"></label><label class="field"><span>Nivel</span><input id="s-level" class="input" value="${esc(s?.level||'')}"></label><label class="field"><span>Caballo/pony habitual</span><select id="s-horse" class="input"><option value="">Sin asignar</option>${S.horses.filter(h=>h.school).map(h=>`<option value="${h.id}" ${s?.usualHorseId===h.id?'selected':''}>${esc(h.name)}</option>`).join('')}</select></label></div><div class="field" style="margin-top:12px"><span>Notas</span><textarea id="s-notes" class="input">${esc(s?.notes||'')}</textarea></div><div class="modal-actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="save-student" data-id="${s?.id||''}">Guardar</button></div>`);
  }

  function saveProfileAction(btn){
    const id=btn.dataset.id || uid('p');
    let p=profile(id);
    if(!p){ p={id, permissions:{}, privateStableId:null}; S.profiles.push(p); }
    p.name=formVal('pf-name')||'Perfil'; p.alias=formVal('pf-alias'); p.color=formVal('pf-color')||'#3f5f8f'; p.photo=formVal('pf-photo');
    if(canEditProfiles()) p.roles=formCheckedAll('pf-roles');
    save(); closeModal(); render();
  }
  function saveHorseAction(btn){
    const id=btn.dataset.id || uid('h');
    let h=horse(id);
    if(!h){ h={id, stableIds:[], health:[]}; S.horses.push(h); }
    h.name=formVal('h-name')||'Caballo'; h.type=formVal('h-type')||'Caballo'; h.riderId=formVal('h-rider'); h.school=formVal('h-school')==='1'; h.ownerIds=formCheckedAll('h-owners');
    if(hasRole('jinete') && me().privateStableId && !h.stableIds.includes(me().privateStableId)) h.stableIds.push(me().privateStableId);
    if(!isManager() && hasRole('propietario') && !h.ownerIds.includes(me().id)) h.ownerIds.push(me().id);
    save(); closeModal(); render();
  }
  function saveRecordAction(){
    const type=formVal('r-type'), date=formVal('r-date'), horseId=formVal('r-horse');
    if(!horseId){ alert('Elige un caballo'); return; }
    if(type==='pizarra'){
      const act=formVal('r-activity');
      const person=formVal('r-person');
      const note=formVal('r-note');
      S.boardEntries.push({id:uid('b'), horseId, date, activity:act, code:act==='SHOW'?'Show':act==='OK'?'✓':act, personId:person, done:act==='OK', note});
      S.records.push({id:uid('r'), type:'pizarra', horseId, date, title:`Pizarra: ${activityLabel(act)}`, note});
    } else {
      const title=formVal('r-title') || (type==='nota'?'Nota':type);
      S.records.push({id:uid('r'), type, horseId, date, reminderDate:formVal('r-reminder'), title, note:formVal('r-note')});
    }
    save(); closeModal(); render();
  }
  function saveClassAction(btn){
    const id=btn.dataset.id || uid('c');
    let c=cls(id);
    if(!c){ c={id, attendance:{}, assignments:{}}; S.classes.push(c); }
    c.title=formVal('c-title')||'Clase'; c.type=formVal('c-type'); c.date=formVal('c-date'); c.time=formVal('c-time'); c.professorId=formVal('c-prof'); c.place=formVal('c-place'); c.studentIds=formCheckedAll('c-students'); c.assignments=c.assignments||{}; c.attendance=c.attendance||{};
    save(); closeModal(); render();
  }
  function saveStudentAction(btn){
    const id=btn.dataset.id || uid('s');
    let s=student(id);
    if(!s){ s={id}; S.students.push(s); }
    s.name=formVal('s-name')||'Alumno'; s.level=formVal('s-level')||''; s.usualHorseId=formVal('s-horse'); s.notes=formVal('s-notes');
    save(); closeModal(); render();
  }
  function repeatPreviousWeek(){
    const cur=weekDates(weekOffset), prev=weekDates(weekOffset-1);
    const hids=new Set(accessibleHorses().map(h=>h.id));
    const prevEntries=S.boardEntries.filter(b=>prev.includes(b.date) && hids.has(b.horseId));
    prevEntries.forEach(b=>{
      const idx=prev.indexOf(b.date);
      const exists=S.boardEntries.some(x=>x.horseId===b.horseId && x.date===cur[idx] && x.activity===b.activity && x.code===b.code && x.note===b.note);
      if(!exists) S.boardEntries.push({...clone(b), id:uid('b'), date:cur[idx], done:false});
    });
    save(); render();
  }

  document.addEventListener('click', e=>{
    const btn=e.target.closest('button,[data-action],[data-view]'); if(!btn) return;
    if(btn.dataset.view){ setView(btn.dataset.view); return; }
    const a=btn.dataset.action;
    if(a==='close-modal'){ closeModal(); return; }
    if(a==='profile-switch'){ modalProfileSwitch(); return; }
    if(a==='set-profile'){ S.activeProfileId=btn.dataset.id; save(); closeModal(); view='inicio'; render(); return; }
    if(a==='week'){ const n=Number(btn.dataset.n); weekOffset = n===0?0:weekOffset+n; render(); return; }
    if(a==='repeat-week'){ repeatPreviousWeek(); return; }
    if(a==='quick-record'){ modalQuickRecord({kind:btn.dataset.kind, horse:btn.dataset.horse}); return; }
    if(a==='cell'){ modalQuickRecord({kind:'pizarra', horse:btn.dataset.horse, date:btn.dataset.date}); return; }
    if(a==='new-horse'){ modalNewHorse(); return; }
    if(a==='edit-horse'){ modalNewHorse(btn.dataset.id); return; }
    if(a==='open-horse'){ modalHorse(btn.dataset.id); return; }
    if(a==='new-class'){ modalNewClass(); return; }
    if(a==='edit-class'){ modalNewClass(btn.dataset.id); return; }
    if(a==='open-class'){ modalClass(btn.dataset.id); return; }
    if(a==='new-student'){ modalNewStudent(); return; }
    if(a==='open-student'){ modalNewStudent(btn.dataset.id); return; }
    if(a==='class-tab'){ classTab=btn.dataset.tab; render(); return; }
    if(a==='new-profile'){ modalEditProfile(); return; }
    if(a==='edit-profile'){ modalEditProfile(btn.dataset.id); return; }
    if(a==='save-profile'){ saveProfileAction(btn); return; }
    if(a==='save-horse'){ saveHorseAction(btn); return; }
    if(a==='save-record'){ saveRecordAction(); return; }
    if(a==='save-class'){ saveClassAction(btn); return; }
    if(a==='save-student'){ saveStudentAction(btn); return; }
    if(a==='mark-all'){ const c=cls(btn.dataset.id); c.studentIds.forEach(sid=>c.attendance[sid]='vino'); save(); modalClass(c.id); render(); return; }
    if(a==='attendance'){ const c=cls(btn.dataset.class); c.attendance=c.attendance||{}; c.attendance[btn.dataset.student]=btn.dataset.v; save(); modalClass(c.id); render(); return; }
    if(a==='reset-demo'){ if(confirm('¿Restaurar datos de ejemplo?')){ localStorage.removeItem(LS); S=load(); view='inicio'; render(); } return; }
  });
  document.addEventListener('change', e=>{
    const el=e.target;
    if(el.dataset.action==='record-type-change'){
      document.getElementById('record-extra').innerHTML=recordExtraHtml(el.value);
    }
    if(el.dataset.action==='assign-horse'){
      const c=cls(el.dataset.class); c.assignments=c.assignments||{}; c.assignments[el.dataset.student]=el.value; save();
    }
  });

  render();
})();
