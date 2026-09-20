import { STORAGE_KEY, seedData } from './data.js';

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = (p='id') => p + '_' + Math.random().toString(36).slice(2,9);
const todayIso = () => new Date().toISOString().slice(0,10);
const addDays = (iso,n) => { const d = new Date(iso); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const dayLong = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const monday = (iso=todayIso()) => { const d = new Date(iso); const day = (d.getDay()+6)%7; d.setDate(d.getDate()-day); return d.toISOString().slice(0,10); };
const weekDates = (base=todayIso()) => Array.from({length:7},(_,i)=>addDays(monday(base),i));
const fmt = iso => new Date(iso).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
const clone = x => JSON.parse(JSON.stringify(x));

let S = load();
let route = location.hash.replace('#','') || 'inicio';
let ctx = { stableId:null, horseId:null, classId:null, tab:null };

function load(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || clone(seedData); }
  catch { return clone(seedData); }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }
function reset(){ S = clone(seedData); save(); route='inicio'; location.hash='inicio'; render(); }
function me(){ return S.profiles.find(p=>p.id===S.activeProfileId) || S.profiles[0]; }
const hasRole = role => me().roles.includes(role) || me().roles.includes('gerente');
const horse = id => S.horses.find(h=>h.id===id);
const profile = id => S.profiles.find(p=>p.id===id);
const stable = id => S.stables.find(s=>s.id===id);
const student = id => S.students.find(s=>s.id===id);
const klass = id => S.classes.find(c=>c.id===id);

function visibleStableIds(p=me()){
  if(p.roles.includes('gerente')) return S.stables.map(s=>s.id);
  const ids = new Set();
  S.stables.forEach(st=>{
    if(st.ownerProfileId===p.id || (st.sharedWith||[]).includes(p.id)) ids.add(st.id);
  });
  return [...ids];
}
function canSeeHorse(h, p=me()){
  if(!h) return false;
  if(p.roles.includes('gerente')) return true;
  if((h.ownerProfileIds||[]).includes(p.id)) return true;
  if(h.riderProfileId === p.id) return true;
  if(p.roles.includes('jinete') && p.privateStableId && (h.linkedStableIds||[]).includes(p.privateStableId)) return true;
  return false;
}
function visibleHorses(p=me()){
  return S.horses.filter(h => canSeeHorse(h,p));
}
function stableHorses(stableId, p=me()){
  return S.horses.filter(h => (h.linkedStableIds||[]).includes(stableId) && canSeeHorse(h,p));
}
function canEditHorse(h,p=me()){
  if(p.roles.includes('gerente')) return true;
  if((h.ownerProfileIds||[]).includes(p.id)) return true;
  if(h.riderProfileId===p.id) return true;
  return false;
}
function canSeeClasses(p=me()){
  return p.roles.includes('gerente') || p.roles.includes('profesor') || p.classAccess;
}
function teacherClasses(p=me()){
  if(p.roles.includes('gerente')) return S.classes;
  return S.classes.filter(c => c.teacherId===p.id || p.roles.includes('profesor'));
}
function schoolHorses(){ return S.horses.filter(h => h.type==='escuela' && h.status!=='no disponible'); }
function viewModules(){
  const p=me(), mods=[];
  mods.push({id:'caballos', icon:'🐴', title:p.roles.includes('propietario')?'Mis caballos':'Caballos', desc:'Fichas y caballos compartidos'});
  if(canSeeClasses(p)) mods.push({id:'clases', icon:'🎓', title:'Clases', desc:'Calendario, asistencia y alumnos'});
  if(p.roles.includes('jinete') || p.privateStableId) mods.push({id:'pizarra', icon:'🗓️', title:'Mi pizarra', desc:'Cuadra privada y trabajo diario'});
  if(p.roles.includes('gerente')) mods.push({id:'equipo', icon:'👥', title:'Equipo', desc:'Perfiles, roles y accesos'});
  mods.push({id:'registro', icon:'＋', title:'Registro rápido', desc:'Pizarra, veterinario, herrador o nota'});
  return mods;
}

function setHash(r){ location.hash = r; }
window.addEventListener('hashchange',()=>{ route = location.hash.replace('#','') || 'inicio'; render(); });

function top(){
  const p=me();
  return `<div class="top"><div class="top-row">
    <button class="brand" data-go="inicio"><span class="mark">E</span><span><h1>${esc(S.settings.centerName)}</h1><small>${esc(p.name)} · ${p.roles.map(r=>cap(r)).join(' · ')}</small></span></button>
    <button class="avatar" data-modal="profiles" title="Cambiar perfil">${p.photo?`<img src="${p.photo}" alt="">`:esc(p.short||p.name[0])}</button>
  </div></div>`;
}
function nav(){
  const items = [{id:'inicio',ico:'⌂',t:'Inicio'}];
  if(canSeeClasses()) items.push({id:'clases',ico:'🎓',t:'Clases'});
  items.push({id:'caballos',ico:'🐴',t:'Caballos'});
  items.push({id:'registro',ico:'＋',t:'+'});
  items.push({id:'mas',ico:'☰',t:'Más'});
  return `<div class="nav">${items.slice(0,5).map(it=>`<button class="${route===it.id?'active':''}" data-go="${it.id}">${it.id==='registro'?`<span class="plus">＋</span><span>${it.t}</span>`:`<span class="ico">${it.ico}</span><span>${it.t}</span>`}</button>`).join('')}</div>`;
}
function layout(content){ return `<div class="app">${top()}<main class="main">${content}</main>${nav()}<div class="toast" id="toast"></div><div class="modal-back" id="modalBack" data-close="1"></div><div class="modal" id="modal"><div class="modal-inner" id="modalInner"></div></div></div>`; }
function cap(s){ return s? s[0].toUpperCase()+s.slice(1):''; }
function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }

function render(){
  let content;
  if(route.startsWith('horse/')) { ctx.horseId = route.split('/')[1]; content = vHorse(ctx.horseId); }
  else if(route.startsWith('stable/')) { ctx.stableId = route.split('/')[1]; content = vStable(ctx.stableId); }
  else if(route.startsWith('class/')) { ctx.classId = route.split('/')[1]; content = vClass(ctx.classId); }
  else content = ({inicio:vInicio, clases:vClases, caballos:vCaballos, pizarra:vPizarra, equipo:vEquipo, mas:vMas, registro:vRegistro}[route] || vInicio)();
  $('#app').innerHTML = layout(content);
}

function vInicio(){
  const p=me();
  const today = todayIso();
  const myClasses = teacherClasses(p).filter(c=>c.date===today);
  const myHorses = visibleHorses(p);
  const reminders = S.records.filter(r=>r.reminderDate && r.reminderDate<=addDays(today,3) && myHorses.some(h=>h.id===r.horseId));
  const links = S.quickLinks[p.id] || viewModules().map(m=>m.id).slice(0,4);
  const allMods = viewModules();
  const linkMods = links.map(id=>allMods.find(m=>m.id===id)).filter(Boolean);
  return `<section class="headline"><div><h2>Inicio</h2><p>Solo lo que corresponde a tu perfil.</p></div><div class="actions"><button class="btn" data-modal="profiles">Cambiar perfil</button><button class="btn primary" data-go="registro">+ Registro</button></div></section>
  <div class="grid">
    <div class="card span8"><h3>Hoy importa</h3>
      ${myClasses.length? `<div class="row"><div class="row-main"><div class="row-title">${myClasses.length} clase${myClasses.length>1?'s':''} hoy</div><div class="row-sub">Puedes pasar asistencia desde el módulo de Clases.</div></div><button class="btn small" data-go="clases">Ver</button></div>`:''}
      ${reminders.length? reminders.map(r=>`<div class="row"><div class="row-main"><div class="row-title">${esc(r.title)}</div><div class="row-sub">${esc(horse(r.horseId)?.name||'Caballo')} · ${fmt(r.reminderDate)}</div></div><span class="pill warn">Recordatorio</span></div>`).join(''):''}
      ${!myClasses.length && !reminders.length ? `<div class="empty">Nada urgente ahora mismo.</div>`:''}
    </div>
    <div class="card span4"><h3>Tu perfil</h3>${profileCard(p)}<div class="actions" style="margin-top:12px"><button class="btn small" data-modal="editProfile" data-id="${p.id}">Editar</button></div></div>
    <div class="card"><h3>Accesos directos</h3><div class="module-grid">${linkMods.map(moduleCard).join('')}</div><div class="actions" style="margin-top:12px"><button class="btn small" data-modal="quickLinks">Personalizar</button></div></div>
  </div>`;
}
function moduleCard(m){ return `<button class="module" data-go="${m.id}"><span class="ico">${m.icon}</span><b>${m.title}</b><small>${m.desc}</small></button>`; }
function profileCard(p){ return `<div class="horse-card"><span class="avatar" style="background:${p.color}">${p.photo?`<img src="${p.photo}">`:esc(p.short||p.name[0])}</span><div><div class="row-title">${esc(p.name)}</div><div class="row-sub">${p.roles.map(r=>cap(r)).join(' · ') || 'Sin roles'}</div></div></div>`; }

function vCaballos(){
  const horses = visibleHorses();
  return `<section class="headline"><div><h2>${me().roles.includes('propietario')?'Mis caballos':'Caballos'}</h2><p>Un caballo puede aparecer en varias cuadras, pero su ficha es única.</p></div><div class="actions"><button class="btn primary" data-modal="newHorse">+ Caballo</button></div></section>
  <div class="grid"><div class="card">${horses.length? horses.map(horseRow).join(''):`<div class="empty">No tienes caballos asignados.</div>`}</div></div>`;
}
function horseRow(h){
  const owners=(h.ownerProfileIds||[]).map(id=>profile(id)?.name).filter(Boolean).join(', ');
  const stables=(h.linkedStableIds||[]).map(id=>stable(id)?.name).filter(Boolean).join(' · ');
  return `<div class="row" data-go="horse/${h.id}"><div class="horse-pic">${h.photo?`<img src="${h.photo}">`:esc(h.name[0])}</div><div class="row-main"><div class="row-title">${esc(h.name)}</div><div class="row-sub">${esc(owners||'Sin propietario')} · ${esc(stables||'Sin cuadra')}</div></div><span class="pill ${h.type==='escuela'?'blue':'violet'}">${esc(h.type)}</span></div>`;
}
function vHorse(id){
  const h=horse(id); if(!h||!canSeeHorse(h)) return denied('No tienes acceso a este caballo.');
  const can=canEditHorse(h);
  const recs=S.records.filter(r=>r.horseId===h.id).sort((a,b)=>b.date.localeCompare(a.date));
  const boards=S.board.filter(b=>b.horseId===h.id).sort((a,b)=>b.date.localeCompare(a.date));
  return `<section class="headline"><div><h2>${esc(h.name)}</h2><p>Ficha única. Cualquier cambio común se ve en todas las cuadras donde esté compartido.</p></div><div class="actions"><button class="btn" data-go="caballos">← Volver</button>${can?`<button class="btn primary" data-modal="editHorse" data-id="${h.id}">Editar</button>`:''}</div></section>
  <div class="grid">
    <div class="card span6"><h3>Datos</h3>
      ${horseRow(h)}
      <div class="row"><div class="row-main"><div class="row-title">Compartido en</div><div class="row-sub">${esc((h.linkedStableIds||[]).map(id=>stable(id)?.name).filter(Boolean).join(' · '))}</div></div><button class="btn small" data-modal="shareHorse" data-id="${h.id}">Compartir</button></div>
      <div class="row"><div class="row-main"><div class="row-title">Jinete/responsable</div><div class="row-sub">${esc(profile(h.riderProfileId)?.name || 'Sin asignar')}</div></div></div>
      <div class="row"><div class="row-main"><div class="row-title">Notas</div><div class="row-sub">${esc(h.notes||'Sin notas')}</div></div></div>
    </div>
    <div class="card span6"><h3>Últimos registros</h3>${recs.length?recs.map(recordRow).join(''):`<div class="empty">Sin registros.</div>`}</div>
    <div class="card"><h3>Pizarra / trabajo</h3>${boards.length?boards.map(boardRow).join(''):`<div class="empty">Sin trabajos de pizarra.</div>`}</div>
  </div>`;
}
function recordRow(r){ return `<div class="row"><div class="row-main"><div class="row-title">${esc(r.title||cap(r.type))}</div><div class="row-sub">${fmt(r.date)}${r.reminderDate?` · recordatorio ${fmt(r.reminderDate)}`:''}${r.note?` · ${esc(r.note)}`:''}</div></div><span class="pill">${esc(r.type)}</span></div>`; }
function boardRow(b){ return `<div class="row"><div class="row-main"><div class="row-title">${esc(horse(b.horseId)?.name||'Caballo')} · ${esc(b.code)}</div><div class="row-sub">${fmt(b.date)} · ${esc(profile(b.personProfileId)?.name||'Sin persona')}${b.note?` · ${esc(b.note)}`:''}</div></div><span class="pill ${b.done?'ok':'blue'}">${b.done?'Hecho':'Pendiente'}</span></div>`; }

function vPizarra(){
  const p=me();
  const sid = p.privateStableId || visibleStableIds(p).find(id=>stable(id)?.type==='private');
  if(!sid) return denied('Tu perfil no tiene cuadra privada ni acceso a pizarra.');
  return vStable(sid, true);
}
function vStable(id, forcePizarra=false){
  const st=stable(id); if(!st || !visibleStableIds().includes(id)) return denied('No tienes acceso a esta cuadra.');
  const hs=stableHorses(id); const dates=weekDates();
  const weekBoard = S.board.filter(b=>b.stableId===id && dates.includes(b.date));
  const table = `<div class="table-wrap"><table><thead><tr><th>Caballo</th>${dates.map((d,i)=>`<th class="${d===todayIso()?'today':''}">${days[i]}<br>${fmt(d)}</th>`).join('')}</tr></thead><tbody>${hs.map(h=>`<tr><td>${esc(h.name)}</td>${dates.map(d=>{ const cell=weekBoard.filter(b=>b.horseId===h.id && b.date===d); return `<td class="${d===todayIso()?'today':''}" data-modal="boardCell" data-horse="${h.id}" data-stable="${id}" data-date="${d}">${cell.length?cell.map(b=>`<span class="cell-chip ${b.done?'done':''}" title="${esc(b.note||'')}">${esc(b.code)}</span>`).join(' '):'·'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
  return `<section class="headline"><div><h2>${esc(st.name)}</h2><p>${st.type==='private'?'Cuadra privada':'Cuadra general'} · ficha del caballo compartida, pizarra propia de esta cuadra.</p></div><div class="actions"><button class="btn" data-go="inicio">Inicio</button><button class="btn primary" data-modal="quickRecord" data-stable="${id}">+ Registro</button></div></section>
  <div class="tabs"><button class="tab active">Pizarra</button><button class="tab" data-go="caballos">Caballos</button></div>
  <div class="grid"><div class="card"><h3>Pizarra semanal</h3>${table}<p class="small muted">Toca una casilla para añadir Paddock, Caminador, Monta, Veterinario, Herrador, Concurso, Nota o Hecho.</p></div></div>`;
}

function vClases(){
  if(!canSeeClasses()) return denied('El módulo de clases solo aparece para perfiles con rol Profesor/a o Gerencia.');
  const classes=teacherClasses().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  return `<section class="headline"><div><h2>Clases</h2><p>Organiza clases y pasa asistencia.</p></div><div class="actions"><button class="btn primary" data-modal="newClass">+ Clase</button><button class="btn" data-modal="newStudent">+ Alumno</button></div></section>
  <div class="grid"><div class="card span8"><h3>Calendario</h3>${classes.map(classCard).join('') || '<div class="empty">Sin clases.</div>'}</div><div class="card span4"><h3>Caballos disponibles</h3>${schoolHorses().map(horseRow).join('') || '<div class="empty">No hay caballos de escuela.</div>'}</div></div>`;
}
function classCard(c){
  const t=profile(c.teacherId);
  return `<div class="class-item" data-go="class/${c.id}"><div class="class-head"><div><b>${esc(c.title)}</b><div class="row-sub">${fmt(c.date)} · ${c.time} · ${esc(t?.name||'Sin profesor')} · ${esc(c.place||'')}</div></div><span class="pill ${c.type==='grupo'?'blue':'violet'}">${c.type}</span></div><div class="row-sub">${c.studentIds.length} alumno${c.studentIds.length!==1?'s':''}</div></div>`;
}
function vClass(id){
  const c=klass(id); if(!c || !canSeeClasses()) return denied('No tienes acceso a esta clase.');
  return `<section class="headline"><div><h2>${esc(c.title)}</h2><p>${fmt(c.date)} · ${c.time} · ${esc(profile(c.teacherId)?.name||'Sin profesor')}</p></div><div class="actions"><button class="btn" data-go="clases">← Clases</button><button class="btn primary" data-modal="editClass" data-id="${c.id}">Editar</button></div></section>
  <div class="grid"><div class="card"><h3>Asistencia y asignación</h3>${c.studentIds.map(sid=>studentAttendanceLine(c,sid)).join('')}<div class="actions" style="margin-top:12px"><button class="btn" data-action="allAttend" data-id="${c.id}">Marcar todos vinieron</button></div></div></div>`;
}
function studentAttendanceLine(c,sid){
  const s=student(sid); const assigned=horse(c.assignments?.[sid]); const status=c.attendance?.[sid]||'pendiente';
  return `<div class="student-line"><div><b>${esc(s?.name||'Alumno')}</b><div class="row-sub">${esc(s?.level||'')}</div></div><select class="input" data-change="assignHorse" data-class="${c.id}" data-student="${sid}"><option value="">Sin caballo</option>${schoolHorses().map(h=>`<option value="${h.id}" ${assigned?.id===h.id?'selected':''}>${esc(h.name)}</option>`).join('')}</select><select class="input" data-change="attendance" data-class="${c.id}" data-student="${sid}"><option value="pendiente" ${status==='pendiente'?'selected':''}>Pendiente</option><option value="vino" ${status==='vino'?'selected':''}>✓ Vino</option><option value="no_vino" ${status==='no_vino'?'selected':''}>No vino</option><option value="recuperar" ${status==='recuperar'?'selected':''}>Recuperar</option></select></div>`;
}

function vEquipo(){
  if(!hasRole('gerente')) return denied('Solo gerencia puede editar perfiles y roles.');
  return `<section class="headline"><div><h2>Equipo</h2><p>Roles por perfil: profesor, propietario, jinete, administración.</p></div><div class="actions"><button class="btn primary" data-modal="newProfile">+ Perfil</button></div></section><div class="grid"><div class="card">${S.profiles.map(p=>`<div class="row"><div class="row-main">${profileCard(p)}<div class="row-sub">${p.roles.map(cap).join(' · ')}</div></div><button class="btn small" data-modal="editProfile" data-id="${p.id}">Editar</button></div>`).join('')}</div></div>`;
}
function vMas(){
  const modules=viewModules();
  return `<section class="headline"><div><h2>Más</h2><p>Ajustes, perfiles y datos locales.</p></div></section><div class="grid"><div class="card"><h3>Módulos disponibles para ${esc(me().name)}</h3><div class="module-grid">${modules.map(moduleCard).join('')}</div></div><div class="card"><h3>Datos</h3><div class="actions"><button class="btn" data-go="equipo">Equipo</button><button class="btn danger" data-action="reset">Restaurar demo</button></div></div></div>`;
}
function vRegistro(){ return `<section class="headline"><div><h2>Registro rápido</h2><p>Contextual según tu perfil y tus caballos.</p></div></section>${quickRecordForm({})}`; }
function denied(msg){ return `<section class="headline"><div><h2>Sin acceso</h2><p>${esc(msg)}</p></div><div class="actions"><button class="btn" data-go="inicio">Volver al inicio</button></div></section>`; }

function quickRecordForm({stableId='', horseId='', date=todayIso()}={}){
  const horses = stableId ? stableHorses(stableId) : visibleHorses();
  return `<div class="card"><form class="form" data-form="quickRecord">
    <div class="field"><label>Tipo</label><select class="input" name="type"><option value="pizarra">Pizarra / trabajo</option><option value="veterinario">Veterinario</option><option value="herrador">Herrador</option><option value="recordatorio">Recordatorio</option><option value="nota">Nota</option></select></div>
    <div class="field"><label>Caballo</label><select class="input" name="horseId">${horses.map(h=>`<option value="${h.id}" ${horseId===h.id?'selected':''}>${esc(h.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Fecha</label><input class="input" type="date" name="date" value="${date}"></div>
    <div class="field"><label>Código de pizarra (solo si tipo Pizarra)</label><select class="input" name="code"><option value="P">Paddock</option><option value="C">Caminador</option><option value="M">Monta</option><option value="CU">Cuerda</option><option value="VET">Veterinario</option><option value="H">Herrador</option><option value="SHOW">Concurso</option><option value="N">Nota</option><option value="✓">Hecho</option></select></div>
    <div class="field"><label>Concepto / nota</label><input class="input" name="title" placeholder="Ej. Vacuna, herrador, paddock, revisar..." /></div>
    <div class="field"><label>Recordatorio futuro opcional</label><input class="input" type="date" name="reminderDate" /></div>
    <input type="hidden" name="stableId" value="${stableId}">
    <button class="btn primary" type="submit">Guardar registro</button>
  </form><p class="small muted">Pizarra no pide importe. Veterinario, herrador y recordatorio admiten fecha de recordatorio.</p></div>`;
}

function openModal(kind, data={}){
  const back=$('#modalBack'), m=$('#modal'), inner=$('#modalInner');
  inner.innerHTML = modalContent(kind,data);
  back.classList.add('show'); m.classList.add('show');
}
function closeModal(){ $('#modalBack')?.classList.remove('show'); $('#modal')?.classList.remove('show'); }
function modalContent(kind,d){
  if(kind==='profiles') return `<h3>Cambiar perfil</h3>${S.profiles.map(p=>`<button class="row" style="width:100%;text-align:left" data-set-profile="${p.id}"><div class="row-main">${profileCard(p)}</div>${p.id===me().id?'<span class="pill ok">Activo</span>':''}</button>`).join('')}<div class="modal-actions"><button class="btn" data-close="1">Cerrar</button></div>`;
  if(kind==='quickRecord') return `<h3>Registro rápido</h3>${quickRecordForm({stableId:d.stable,date:d.date||todayIso()})}`;
  if(kind==='boardCell') return `<h3>Casilla de pizarra</h3>${quickRecordForm({stableId:d.stable,horseId:d.horse,date:d.date})}`;
  if(kind==='quickLinks') { const p=me(), all=viewModules(), active=S.quickLinks[p.id]||[]; return `<h3>Accesos directos</h3><form class="form" data-form="quickLinks"><div class="check-grid">${all.map(m=>`<label class="check"><input type="checkbox" name="links" value="${m.id}" ${active.includes(m.id)?'checked':''}>${m.icon} ${m.title}</label>`).join('')}</div><button class="btn primary" type="submit">Guardar</button></form>`; }
  if(kind==='editProfile'||kind==='newProfile') { const p = kind==='newProfile'?{id:'',name:'',short:'',color:'#3f5f8f',photo:'',roles:[],privateStableId:'',ownerName:'',canCreate:true}:profile(d.id); return `<h3>${kind==='newProfile'?'Nuevo perfil':'Editar perfil'}</h3><form class="form" data-form="profile" data-id="${p.id}"><div class="field"><label>Nombre</label><input class="input" name="name" value="${esc(p.name)}"></div><div class="field"><label>Iniciales</label><input class="input" name="short" value="${esc(p.short||'')}"></div><div class="field"><label>Color</label><input class="input" type="color" name="color" value="${p.color||'#3f5f8f'}"></div><div class="field"><label>Foto</label><input class="input" type="file" name="photo" accept="image/*"></div><div class="field"><label>Nombre como propietario</label><input class="input" name="ownerName" value="${esc(p.ownerName||p.name)}"></div><div class="field"><label>Cuadra privada</label><select class="input" name="privateStableId"><option value="">Sin cuadra privada</option>${S.stables.filter(s=>s.type==='private').map(s=>`<option value="${s.id}" ${p.privateStableId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div><div class="field"><label>Roles</label><div class="check-grid">${['gerente','profesor','propietario','jinete','administracion'].map(r=>`<label class="check"><input type="checkbox" name="roles" value="${r}" ${(p.roles||[]).includes(r)?'checked':''}>${cap(r)}</label>`).join('')}</div></div><button class="btn primary" type="submit">Guardar perfil</button></form>`; }
  if(kind==='editHorse'||kind==='newHorse') { const h = kind==='newHorse'?{id:'',name:'',type:'privado',status:'activo',ownerProfileIds:[],riderProfileId:'',homeStableId:'campomanes',linkedStableIds:['campomanes'],notes:'',photo:''}:horse(d.id); return `<h3>${kind==='newHorse'?'Nuevo caballo':'Editar caballo'}</h3><form class="form" data-form="horse" data-id="${h.id}"><div class="field"><label>Nombre</label><input class="input" name="name" value="${esc(h.name)}"></div><div class="field"><label>Foto</label><input class="input" type="file" name="photo" accept="image/*"></div><div class="field"><label>Tipo</label><select class="input" name="type"><option value="privado" ${h.type==='privado'?'selected':''}>Privado</option><option value="escuela" ${h.type==='escuela'?'selected':''}>Escuela</option></select></div><div class="field"><label>Propietarios</label><div class="check-grid">${S.profiles.map(p=>`<label class="check"><input type="checkbox" name="owners" value="${p.id}" ${(h.ownerProfileIds||[]).includes(p.id)?'checked':''}>${esc(p.name)}</label>`).join('')}</div></div><div class="field"><label>Jinete/responsable</label><select class="input" name="riderProfileId"><option value="">Sin jinete</option>${S.profiles.map(p=>`<option value="${p.id}" ${h.riderProfileId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>Compartido en cuadras</label><div class="check-grid">${S.stables.map(s=>`<label class="check"><input type="checkbox" name="linkedStableIds" value="${s.id}" ${(h.linkedStableIds||[]).includes(s.id)?'checked':''}>${esc(s.name)}</label>`).join('')}</div></div><div class="field"><label>Notas</label><textarea class="input" name="notes">${esc(h.notes||'')}</textarea></div><button class="btn primary" type="submit">Guardar caballo</button></form>`; }
  if(kind==='shareHorse') { const h=horse(d.id); return `<h3>Compartir ${esc(h.name)}</h3><p class="muted">Es el mismo caballo en todas las cuadras. Marca dónde debe aparecer.</p><form class="form" data-form="shareHorse" data-id="${h.id}"><div class="check-grid">${S.stables.map(s=>`<label class="check"><input type="checkbox" name="linkedStableIds" value="${s.id}" ${(h.linkedStableIds||[]).includes(s.id)?'checked':''}>${esc(s.name)}</label>`).join('')}</div><button class="btn primary" type="submit">Guardar</button></form>`; }
  if(kind==='newClass'||kind==='editClass') { const c = kind==='newClass'?{id:'',title:'',date:todayIso(),time:'17:00',type:'grupo',teacherId:me().roles.includes('profesor')?me().id:'',place:'',studentIds:[]}:klass(d.id); return `<h3>${kind==='newClass'?'Nueva clase':'Editar clase'}</h3><form class="form" data-form="class" data-id="${c.id}"><div class="field"><label>Título</label><input class="input" name="title" value="${esc(c.title)}" placeholder="Grupo ponis, particular..."></div><div class="field"><label>Fecha</label><input class="input" type="date" name="date" value="${c.date}"></div><div class="field"><label>Hora</label><input class="input" type="time" name="time" value="${c.time}"></div><div class="field"><label>Tipo</label><select class="input" name="type"><option value="grupo" ${c.type==='grupo'?'selected':''}>Grupo</option><option value="particular" ${c.type==='particular'?'selected':''}>Particular</option><option value="grupo_ponis" ${c.type==='grupo_ponis'?'selected':''}>Grupo ponis</option></select></div><div class="field"><label>Profesor</label><select class="input" name="teacherId">${S.profiles.filter(p=>p.roles.includes('profesor')||p.roles.includes('gerente')).map(p=>`<option value="${p.id}" ${c.teacherId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>Lugar</label><input class="input" name="place" value="${esc(c.place||'')}"></div><div class="field"><label>Alumnos</label><div class="check-grid">${S.students.map(s=>`<label class="check"><input type="checkbox" name="students" value="${s.id}" ${(c.studentIds||[]).includes(s.id)?'checked':''}>${esc(s.name)}</label>`).join('')}</div></div><button class="btn primary" type="submit">Guardar clase</button></form>`; }
  if(kind==='newStudent') return `<h3>Nuevo alumno</h3><form class="form" data-form="student"><div class="field"><label>Nombre</label><input class="input" name="name"></div><div class="field"><label>Nivel</label><input class="input" name="level"></div><div class="field"><label>Notas</label><textarea class="input" name="notes"></textarea></div><button class="btn primary" type="submit">Guardar alumno</button></form>`;
  return `<h3>Opciones</h3><button class="btn" data-close="1">Cerrar</button>`;
}

function formData(form){ return Object.fromEntries(new FormData(form).entries()); }
function readFile(file){ return new Promise(res=>{ if(!file) return res(''); const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(file); }); }

async function handleForm(form){
  const type=form.dataset.form, data=formData(form);
  if(type==='quickRecord'){
    const h=horse(data.horseId); if(!canSeeHorse(h)) return toast('No tienes acceso a ese caballo');
    if(data.type==='pizarra'){
      const sid = data.stableId || me().privateStableId || h.linkedStableIds[0];
      S.board.push({id:uid('b'),stableId:sid,horseId:h.id,date:data.date,code:data.code,personProfileId:me().id,done:data.code==='✓',note:data.title||''});
    } else {
      S.records.push({id:uid('r'),type:data.type,horseId:h.id,profileId:me().id,date:data.date,reminderDate:data.reminderDate||'',title:data.title||cap(data.type),amount:null,note:data.title||''});
    }
    save(); closeModal(); render(); toast('Registro guardado'); return;
  }
  if(type==='quickLinks'){
    S.quickLinks[me().id] = [...form.querySelectorAll('input[name="links"]:checked')].map(i=>i.value);
    save(); closeModal(); render(); return;
  }
  if(type==='profile'){
    let p = data.id ? profile(data.id) : null;
    if(!p){ p={id:uid('p'),name:'',short:'',color:'#3f5f8f',photo:'',roles:[],privateStableId:'',ownerName:'',canCreate:true}; S.profiles.push(p); }
    p.name=data.name; p.short=data.short || data.name.slice(0,2).toUpperCase(); p.color=data.color; p.ownerName=data.ownerName||data.name; p.privateStableId=data.privateStableId||null;
    p.roles=[...form.querySelectorAll('input[name="roles"]:checked')].map(i=>i.value);
    const file=form.photo?.files?.[0]; const photo=await readFile(file); if(photo) p.photo=photo;
    save(); closeModal(); render(); return;
  }
  if(type==='horse'){
    let h = data.id ? horse(data.id) : null;
    if(!h){ h={id:uid('h'),name:'',photo:'',ownerProfileIds:[],riderProfileId:'',homeStableId:'campomanes',linkedStableIds:[],type:'privado',status:'activo',notes:''}; S.horses.push(h); }
    h.name=data.name; h.type=data.type; h.riderProfileId=data.riderProfileId||''; h.notes=data.notes||'';
    h.ownerProfileIds=[...form.querySelectorAll('input[name="owners"]:checked')].map(i=>i.value);
    h.linkedStableIds=[...form.querySelectorAll('input[name="linkedStableIds"]:checked')].map(i=>i.value);
    const file=form.photo?.files?.[0]; const photo=await readFile(file); if(photo) h.photo=photo;
    save(); closeModal(); render(); return;
  }
  if(type==='shareHorse'){
    const h=horse(form.dataset.id); h.linkedStableIds=[...form.querySelectorAll('input[name="linkedStableIds"]:checked')].map(i=>i.value); save(); closeModal(); render(); return;
  }
  if(type==='class'){
    let c = form.dataset.id ? klass(form.dataset.id) : null;
    if(!c){ c={id:uid('c'),assignments:{},attendance:{},notes:{}}; S.classes.push(c); }
    c.title=data.title||'Clase'; c.date=data.date; c.time=data.time; c.type=data.type; c.teacherId=data.teacherId; c.place=data.place;
    const old = new Set(c.studentIds||[]); c.studentIds=[...form.querySelectorAll('input[name="students"]:checked')].map(i=>i.value);
    c.studentIds.forEach(sid=>{ if(!c.attendance[sid]) c.attendance[sid]='pendiente'; });
    [...old].filter(sid=>!c.studentIds.includes(sid)).forEach(sid=>{ delete c.attendance[sid]; delete c.assignments[sid]; });
    save(); closeModal(); render(); return;
  }
  if(type==='student'){
    S.students.push({id:uid('s'),name:data.name||'Alumno',level:data.level||'',notes:data.notes||''}); save(); closeModal(); render(); return;
  }
}

function actions(e){
  const go=e.target.closest('[data-go]'); if(go){ setHash(go.dataset.go); return; }
  const modal=e.target.closest('[data-modal]'); if(modal){ openModal(modal.dataset.modal, modal.dataset); return; }
  if(e.target.closest('[data-close]')){ closeModal(); return; }
  const setP=e.target.closest('[data-set-profile]'); if(setP){ S.activeProfileId=setP.dataset.setProfile; save(); closeModal(); setHash('inicio'); render(); return; }
  const act=e.target.closest('[data-action]'); if(act){ if(act.dataset.action==='reset') reset(); if(act.dataset.action==='allAttend'){ const c=klass(act.dataset.id); c.studentIds.forEach(sid=>c.attendance[sid]='vino'); save(); render(); } }
}
function changes(e){
  const el=e.target;
  if(el.dataset.change==='assignHorse'){ const c=klass(el.dataset.class); c.assignments[el.dataset.student]=el.value; save(); render(); }
  if(el.dataset.change==='attendance'){ const c=klass(el.dataset.class); c.attendance[el.dataset.student]=el.value; save(); render(); }
}
document.addEventListener('click', actions);
document.addEventListener('change', changes);
document.addEventListener('submit', e=>{ e.preventDefault(); handleForm(e.target); });

render();
