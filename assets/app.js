(function(){
const D=window.EquiData;
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const store={get user(){return localStorage.getItem('eq_user')||'gerente'},set user(v){localStorage.setItem('eq_user',v)},get shortcuts(){try{return JSON.parse(localStorage.getItem('eq_shortcuts')||'{}')}catch(e){return{}}},set shortcuts(v){localStorage.setItem('eq_shortcuts',JSON.stringify(v))},get records(){try{return JSON.parse(localStorage.getItem('eq_records')||'[]')}catch(e){return[]}},set records(v){localStorage.setItem('eq_records',JSON.stringify(v))}};
const user=()=>D.users.find(u=>u.id===store.user)||D.users[0];
const horse=id=>D.horses.find(h=>h.id===id); const money=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(n||0);
const params=new URLSearchParams(location.search); const privateId=()=>params.get('id')||'ale';
function init(){ renderUser(); bindCommon(); const page=document.body.dataset.page; if(pages[page]) pages[page](); }
function renderUser(){ const box=$('[data-userbox]'); if(!box)return; const u=user(); box.innerHTML=`<span class="avatar">${u.initial}</span><div><b>${u.name}</b><div class="mini muted">${u.role}</div></div>`; const sel=$('[data-userselect]'); if(sel){sel.value=u.id;} }
function bindCommon(){ document.addEventListener('click',e=>{const a=e.target.closest('[data-action]'); if(!a)return; const ac=a.dataset.action; if(actions[ac]){e.preventDefault(); actions[ac](a,e)}}); document.addEventListener('change',e=>{const el=e.target;if(el.matches('[data-userselect]')){store.user=el.value; location.reload()} if(el.matches('[data-shortcut-toggle]'))toggleShortcut(el.value,el.checked);}); }
function toggleShortcut(key,on){let s=store.shortcuts; const v=document.body.dataset.view||'general'; s[v]=s[v]||defaultShortcuts(v); if(on && !s[v].includes(key))s[v].push(key); if(!on)s[v]=s[v].filter(x=>x!==key); store.shortcuts=s; renderShortcuts();}
function defaultShortcuts(v){return {privada:['inicio','pizarra','caballos','rapido'],clases:['clases','disponibles','cobros','rapido'],caballos:['veterinario','gastos','recordatorios'],gerencia:['carpetas','campomanes','hoy']}[v]||['inicio'];}
function shortcutDefs(){return {
 inicio:{t:'Inicio',s:'Volver',url:'../index.html'},pizarra:{t:'Pizarra',s:'Semana',url:'pizarra-privada.html?id='+privateId()},caballos:{t:'Caballos',s:'De esta cuadra',url:'caballos-privada.html?id='+privateId()},rapido:{t:'+ Registro',s:'Gasto, veterinario...',act:'quick'},personal:{t:'Personal',s:'Accesos',url:'personal-privada.html?id='+privateId()},clases:{t:'Clases',s:'Horario',url:'escuela-campomanes.html'},disponibles:{t:'Caballos disponibles',s:'Escuela',url:'caballos-escuela.html'},cobros:{t:'Cobros',s:'Clases y bonos',url:'cobros-escuela.html'},veterinario:{t:'Veterinario',s:'Mis caballos',url:'mis-caballos.html#vet'},gastos:{t:'Gastos',s:'Desglose',url:'mis-caballos.html#gastos'},recordatorios:{t:'Recordatorios',s:'Próximos avisos',url:'mis-caballos.html#recordatorios'},carpetas:{t:'Carpetas',s:'Sedes y cuadras',url:'carpetas.html'},campomanes:{t:'Cuadra Campomanes',s:'General',url:'cuadra-campomanes.html'},hoy:{t:'Hoy importa',s:'Resumen',url:'../index.html#hoy'}}
}
function renderShortcuts(){ const box=$('[data-shortcuts]'); if(!box)return; const v=document.body.dataset.view||'general'; const s=store.shortcuts[v]||defaultShortcuts(v); const defs=shortcutDefs(); box.innerHTML=s.map(k=>{const d=defs[k]; if(!d)return''; return d.act?`<button data-action="${d.act}"><b>${d.t}</b><small>${d.s}</small></button>`:`<a href="${d.url}"><b>${d.t}</b><small>${d.s}</small></a>`}).join(''); const cfg=$('[data-shortcut-config]'); if(cfg){ cfg.innerHTML=Object.entries(defs).map(([k,d])=>`<label class="row"><span><b>${d.t}</b><span class="mini muted">${d.s}</span></span><input type="checkbox" data-shortcut-toggle value="${k}" ${s.includes(k)?'checked':''}></label>`).join('');}}
function bottom(kind='privada'){ const el=$('[data-bottom]'); if(!el)return; if(kind==='privada'){el.innerHTML=`<nav><a href="../index.html">⌂<span>Inicio</span></a><a href="pizarra-privada.html?id=${privateId()}">▦<span>Pizarra</span></a><a href="caballos-privada.html?id=${privateId()}">♞<span>Caballos</span></a><button data-action="quick"><span class="plus">+</span><span>Registro</span></button></nav>`} else {el.innerHTML=`<nav><a href="../index.html">⌂<span>Inicio</span></a><a href="carpetas.html">▣<span>Carpetas</span></a><a href="cuadra-campomanes.html">♞<span>Cuadra</span></a><button data-action="quick"><span class="plus">+</span><span>Registro</span></button></nav>`} }
function canPrivate(id){const u=user(); return u.canSeePrivate.includes(id)||u.canSeePrivate.includes(id+':shared')||u.id==='gerente'&&D.privateStables.find(s=>s.id===id)?.sharedWithManager}
function canPrivateCosts(id){const u=user(); return u.canSeePrivateCosts && u.canSeePrivate.includes(id)}
function stable(id){return D.privateStables.find(s=>s.id===id)}
function privateHorses(id){return stable(id).horses.map(horse).filter(Boolean)}
function genericRows(){ const owners={}; D.horses.forEach(h=>{owners[h.owner]=owners[h.owner]||[]; owners[h.owner].push(h)}); return Object.entries(owners).map(([owner,hs])=>{ const monthly=hs.reduce((a,h)=>a+h.monthly,0); const unpaid=hs.reduce((a,h)=>a+(h.paid?0:h.monthly)+h.extras.filter(x=>!x.paid).reduce((b,x)=>b+x.amount,0),0); const extras=hs.reduce((a,h)=>a+h.extras.reduce((b,x)=>b+x.amount,0),0); return `<div class="card"><h3>${owner}</h3><div class="row"><span>Mensualidades</span><b>${money(monthly)}</b></div><div class="row"><span>Extras centro</span><b>${money(extras)}</b></div><div class="row"><span>Pendiente</span><b class="amount ${unpaid?'':'muted'}">${money(unpaid)}</b></div><a class="btn small" href="propietario-campomanes.html?owner=${encodeURIComponent(owner)}">Ver desglose</a></div>`}).join('') }
function horseCard(h,mode='generic'){ return `<div class="card"><div class="row"><div style="display:flex;gap:10px;align-items:center"><span class="horse-dot">${h.name[0]}</span><div><b>${h.name}</b><div class="mini muted">Propietario: ${h.owner} · Responsable: ${h.responsible}</div></div></div><span class="pill ${h.paid?'green':'red'}">${h.paid?'Mensualidad pagada':'Pendiente'}</span></div>${mode==='generic'?`<div class="row"><span>Mensualidad Campomanes</span><b>${money(h.monthly)}</b></div><div class="row"><span>Extras del centro</span><b>${money(h.extras.reduce((a,x)=>a+x.amount,0))}</b></div>`:''}${mode==='private'?`<div class="row"><span>Gastos privados</span><b>${money(h.privateCosts.reduce((a,x)=>a+x.amount,0))}</b></div><div class="mini muted">Estos gastos no forman parte de la cuadra genérica del centro.</div>`:''}</div>`}
function boardTable(id){ const st=stable(id); const hs=privateHorses(id); const b=D.board[id]||{}; const days=[['lun','LUN'],['mar','MAR'],['mie','MIÉ'],['jue','JUE'],['vie','VIE'],['sab','SÁB'],['dom','DOM']]; return `<div class="board-wrap"><table class="board"><thead><tr><th class="horse">Caballo</th>${days.map(d=>`<th class="${d[0]==='jue'?'today ':''}${['sab','dom'].includes(d[0])?'weekend':''}">${d[1]}${d[0]==='jue'?'<br><span class="pill green">Hoy</span>':''}</th>`).join('')}</tr></thead><tbody>${hs.map(h=>`<tr><td class="horse"><a href="caballo.html?id=${h.id}">${h.name}</a></td>${days.map(d=>cell(b[h.id]?.[d[0]],d[0])).join('')}</tr>`).join('')}</tbody></table></div>` }
function cell(v,day){ let cls=day==='jue'?'today ':['sab','dom'].includes(day)?'weekend ':''; if(!v)return`<td class="${cls}"><span class="muted">·</span></td>`; let c='code'; if(/P/.test(v))c+=' c-p'; if(/C/.test(v))c+=' c-c'; if(/V/.test(v))c+=' c-v'; if(/Show/.test(v))c+=' c-show'; return `<td class="${cls}"><span class="${c}" data-action="editCell" data-day="${day}">${v}</span></td>` }

function currentContext(){const page=document.body.dataset.page||'home';const view=document.body.dataset.view||'general';const id=privateId();return {page,view,privateId:id};}
function ownsOrRides(h,u=user()){return h.owner===u.name||h.responsible===u.name;}
function accessibleHorsesForQuick(type){
  const u=user(); const ctx=currentContext();
  let list=[];
  if(ctx.view==='privada'||['private','pizarra','privateHorses'].includes(ctx.page)){
    const st=stable(ctx.privateId);
    if(st){
      // Dentro de una cuadra privada no deben salir todos los caballos del centro.
      // El propietario/responsable de la cuadra ve los de esa carpeta; invitados solo los que montan/gestionan.
      const stableHs=st.horses.map(horse).filter(Boolean);
      if(u.name===st.owner||u.canSeePrivate.includes(st.id)) list=stableHs.filter(h=>ownsOrRides(h,u)||u.name===st.owner);
      else if(u.id==='gerente'&&st.sharedWithManager) list=stableHs; // gerencia solo para incidencias/registros de centro, no gastos privados.
      else list=stableHs.filter(h=>ownsOrRides(h,u));
    }
  }else if(ctx.view==='caballos'||ctx.page==='miscaballos'){
    list=D.horses.filter(h=>ownsOrRides(h,u));
  }else if(ctx.view==='clases'||ctx.page==='clases'){
    // En escuela: caballos/ponis disponibles de escuela. Datos demo pendientes de estructura real.
    list=D.horses.filter(h=>h.stable==='Campomanes' && (u.id==='gerente'||h.responsible===u.name||h.owner===u.name));
  }else if(u.id==='gerente'){
    // Gerencia: puede registrar elementos del centro sobre alojados, pero no gastos privados personales.
    list=D.horses;
  }else{
    list=D.horses.filter(h=>ownsOrRides(h,u));
  }
  const seen=new Set();
  return list.filter(h=>h&&!seen.has(h.id)&&seen.add(h.id));
}
function quickTypeFrom(mode){return mode||'gasto'}
function boardCodes(){return [['P','Paddock'],['C','Caminador'],['M','Monta'],['V','Veterinario'],['H','Herrador'],['Show','Concurso'],['N','Nota']];}
function recordsForHorse(id){return store.records.filter(r=>r.horseId===id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));}
const pages={
 home(){renderShortcuts(); const u=user(); const box=$('[data-views]'); if(box){box.innerHTML=u.views.map(v=>`<a class="card folder" href="${viewUrl(v)}"><span class="ico">${viewIcon(v)}</span><span><h3>${viewTitle(v)}</h3><p class="mini muted">${viewDesc(v)}</p></span></a>`).join('')} bottom('global')},
 carpetas(){ const box=$('[data-tree]'); if(box){box.innerHTML=`<details open><summary>📍 Campomanes</summary><div class="children"><div class="child"><a class="btn small" href="cuadra-campomanes.html">Cuadra genérica de Campomanes</a><p class="mini muted">Todos los caballos alojados, mensualidades, extras del centro y deudas por propietaria.</p></div><div class="child"><a class="btn small" href="escuela-campomanes.html">Escuela Campomanes</a><p class="mini muted">Clases, alumnos, ponis/caballos de escuela y profesores.</p></div><div class="child"><b>Cuadras privadas vinculadas</b><div class="grid cols2" style="margin-top:8px">${D.privateStables.map(s=>`<div class="card ${canPrivate(s.id)?'':'locked'}"><h3>${s.name}</h3><p class="mini muted">Propietario: ${s.owner} · ${s.sharedWithManager?'Compartida con gerencia':'No compartida con gerencia'}</p>${canPrivate(s.id)?`<a class="btn small" href="cuadra-privada.html?id=${s.id}">Abrir</a>`:`<span class="pill red">Sin acceso</span>`}</div>`).join('')}</div></div></div></details>`} bottom('global')},
 campomanes(){ $('[data-summary]').innerHTML=genericRows(); $('[data-horses]').innerHTML=D.horses.map(h=>horseCard(h,'generic')).join(''); bottom('global')},
 owner(){ const owner=params.get('owner')||'Ale'; const hs=D.horses.filter(h=>h.owner===owner); $('[data-owner-title]').textContent='Desglose de '+owner; $('[data-owner]').innerHTML=hs.map(h=>`<div class="card"><h3>${h.name}</h3><div class="row"><span>Mensualidad</span><b>${money(h.monthly)} · ${h.paid?'pagado':'pendiente'}</b></div>${h.extras.map(x=>`<div class="row"><span>${x.concept}</span><b>${money(x.amount)} · ${x.paid?'pagado':'pendiente'}</b></div>`).join('')}<div class="row"><span>Total pendiente</span><b class="amount">${money((h.paid?0:h.monthly)+h.extras.filter(x=>!x.paid).reduce((a,x)=>a+x.amount,0))}</b></div></div>`).join(''); bottom('global')},
 private(){ const id=privateId(); if(!canPrivate(id)){ $('[data-private]').innerHTML=`<div class="card"><h2>Sin acceso</h2><p>Esta cuadra privada no está compartida contigo.</p></div>`; bottom('privada'); return;} const st=stable(id); $('[data-private-name]').textContent=st.name; $('[data-private]').innerHTML=`<section class="quick" data-shortcuts></section><section class="card" style="margin-top:14px"><h2>Hoy importa</h2><div class="today-list"><div class="row"><span>Pizarra de hoy</span><b>Revisar paddock/caminador/monta</b></div><div class="row"><span>Caballos</span><b>${st.horses.length} en esta cuadra privada</b></div><div class="row"><span>Privacidad</span><b>${st.sharedWithManager?'Compartida parcialmente con gerencia':'No compartida con gerencia'}</b></div></div></section>`; document.body.dataset.view='privada'; renderShortcuts(); bottom('privada')},
 pizarra(){ const id=privateId(); if(!canPrivate(id)){$('[data-board]').innerHTML='<div class="card"><h2>Sin acceso</h2></div>'} else {$('[data-board]').innerHTML=boardTable(id)} bottom('privada')},
 privateHorses(){ const id=privateId(); if(!canPrivate(id)){$('[data-private-horses]').innerHTML='<div class="card"><h2>Sin acceso</h2></div>'} else { const mode=canPrivateCosts(id)?'private':'plain'; $('[data-private-horses]').innerHTML=privateHorses(id).map(h=>horseCard(h,mode)).join('')} bottom('privada')},
 caballo(){ const h=horse(params.get('id')); if(!h)return; $('[data-horse-title]').textContent=h.name; const privateAllowed=canPrivate(h.privateStable); $('[data-horse]').innerHTML=`${horseCard(h,privateAllowed&&canPrivateCosts(h.privateStable)?'private':'generic')}<div class="card"><h2>Ficha</h2><div class="row"><span>Ubicación</span><b>${h.stable}</b></div><div class="row"><span>Cuadra privada</span><b>${privateAllowed?stable(h.privateStable).name:'No compartida'}</b></div><div class="row"><span>Responsable/jinete</span><b>${h.responsible}</b></div></div><div class="card"><h2>Últimos registros</h2>${recordsForHorse(h.id).slice(0,8).map(r=>`<div class="row"><span>${r.date} · ${r.type}</span><b>${r.concept||r.board||r.note||''}${r.amount?' · '+money(r.amount):''}</b></div>`).join('')||'<p class="mini muted">Sin registros todavía.</p>'}</div>`; bottom(privateAllowed?'privada':'global')},
 clases(){ const box=$('[data-classes]'); box.innerHTML=D.school.classes.map(c=>`<div class="card"><div class="row"><div><h3>${c.day} ${c.time} · ${c.type}</h3><p class="mini muted">Profesor: ${c.teacher} · ${c.students.length} alumnos</p></div><span class="pill ${c.type==='grupo'?'blue':'purple'}">${c.type}</span></div><div class="row"><span>Alumnos</span><b>${c.students.join(', ')}</b></div><div class="row"><span>Caballos/ponis asignados</span><b>${c.horses.join(', ')}</b></div><div class="row"><span>Cobro</span><b>${c.paid}</b></div></div>`).join(''); bottom('global')},
 miscaballos(){ const u=user(); const hs=D.horses.filter(h=>h.owner===u.name||h.responsible===u.name); $('[data-myhorses]').innerHTML=hs.length?hs.map(h=>`<div class="card"><h3>${h.name}</h3><div class="row"><span>Ubicación</span><b>${h.stable}</b></div><div class="row" id="vet"><span>Veterinario</span><b>Próximo: pendiente de revisar</b></div><div class="row" id="gastos"><span>Gastos</span><b>${money(h.privateCosts.reduce((a,x)=>a+x.amount,0))}</b></div><div class="row" id="recordatorios"><span>Recordatorios</span><b>Herrador / vacunas / desparasitación</b></div></div>`).join(''):'<div class="card"><h2>No tienes caballos asignados</h2></div>'; bottom('global')}
};
function viewUrl(v){return {gerencia:'pages/carpetas.html','cuadra-campomanes':'pages/cuadra-campomanes.html','cuadra-privada-ale':'pages/cuadra-privada.html?id=ale','cuadra-privada-alberto':'pages/cuadra-privada.html?id=alberto','mis-caballos':'pages/mis-caballos.html','mis-clases':'pages/escuela-campomanes.html'}[v]||'pages/carpetas.html'}
function viewTitle(v){return {gerencia:'Gerencia','cuadra-campomanes':'Cuadra Campomanes','cuadra-privada-ale':'Mi cuadra privada','cuadra-privada-alberto':'Mi cuadra privada','mis-caballos':'Mis caballos','mis-clases':'Mis clases'}[v]||v}
function viewIcon(v){return v.includes('clase')?'🏇':v.includes('caballo')?'🐴':v.includes('privada')?'📁':v.includes('gerencia')?'🗂️':'🏠'}
function viewDesc(v){return {gerencia:'Sedes, escuelas, cuadras y accesos compartidos.','cuadra-campomanes':'Caballos alojados, propietarios, mensualidades y extras del centro.','cuadra-privada-ale':'Pizarra, caballos, registros rápidos y personal.','cuadra-privada-alberto':'Pizarra, caballos, registros rápidos y personal.','mis-caballos':'Tus caballos aunque estén en distintas cuadras.','mis-clases':'Horario, alumnos, asignación de ponis/caballos y cobros.'}[v]||''}
const actions={
  quick(el){openQuick(el?.dataset?.mode||'')},
  closeModal(){closeModal()},
  qTypeChange(){renderQuickFields()},
  saveQuick(){saveQuick()},
  editCell(el){openQuick('pizarra')},
}
function openQuick(mode){
  const forced=quickTypeFrom(mode);
  const types=[['gasto','Gasto'],['veterinario','Veterinario'],['herrador','Herrador'],['recordatorio','Recordatorio'],['pizarra','Pizarra / trabajo']];
  const horses=accessibleHorsesForQuick(forced);
  const opts=horses.map(h=>`<option value="${h.id}">${h.name}</option>`).join('');
  $('#modal').innerHTML=`<div class="modal-box"><h2>Registro rápido</h2><p class="mini muted" style="margin-top:-6px">Solo aparecen los caballos que este usuario puede gestionar en esta vista.</p><div class="form"><label>Tipo<select id="qType" class="select" data-action="qTypeChange">${types.map(([v,l])=>`<option value="${v}" ${v===forced?'selected':''}>${l}</option>`).join('')}</select></label><label>Caballo<select id="qHorse" class="select">${opts||'<option value="">No hay caballos disponibles</option>'}</select></label><div id="qDynamic"></div><label>Nota<textarea id="qNote" placeholder="Escribe lo mínimo imprescindible"></textarea></label><div class="form-actions"><button class="btn" data-action="closeModal">Cancelar</button><button class="btn primary" data-action="saveQuick">Guardar</button></div></div></div>`;
  $('#modal').classList.add('show');
  renderQuickFields();
}
function renderQuickFields(){
  const type=$('#qType')?.value||'gasto'; const box=$('#qDynamic'); if(!box)return;
  const today=new Date().toISOString().slice(0,10);
  const dateField=`<label>Fecha asignada<input id="qDate" class="input" type="date" value="${today}"></label>`;
  const reminderField=`<label>Recordatorio opcional<input id="qReminder" class="input" type="date"></label>`;
  if(type==='pizarra'){
    box.innerHTML=`${dateField}<label>Trabajo / pizarra<select id="qBoard" class="select">${boardCodes().map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label><label>Persona / quien lo hace<input id="qPerson" class="input" placeholder="Ej. Ale, Natalia, Isa..."></label>`;
  }else if(type==='gasto'){
    box.innerHTML=`${dateField}<label>Importe<input id="qAmt" class="input" type="number" min="0" step="0.01" placeholder="0"></label><label>Concepto<input id="qConcept" class="input" placeholder="Pienso, suplemento, salida, material..."></label><label><span>Pagado</span><select id="qPaid" class="select"><option value="no">No</option><option value="si">Sí</option></select></label>`;
  }else if(type==='veterinario'||type==='herrador'){
    box.innerHTML=`${dateField}${reminderField}<label>Concepto<input id="qConcept" class="input" placeholder="Vacuna, revisión, herraje, tratamiento..."></label><label>Importe opcional<input id="qAmt" class="input" type="number" min="0" step="0.01" placeholder="0"></label>`;
  }else if(type==='recordatorio'){
    box.innerHTML=`${dateField}${reminderField}<label>Motivo<input id="qConcept" class="input" placeholder="Vacuna, desparasitación, llamar veterinario..."></label>`;
  }
}
function saveQuick(){
  const type=$('#qType')?.value; const horseId=$('#qHorse')?.value; const h=horse(horseId);
  if(!type||!horseId||!h){alert('Selecciona un caballo válido.');return;}
  const rec={id:'r_'+Date.now(),type,horseId,horse:h.name,user:user().name,context:currentContext(),date:$('#qDate')?.value||new Date().toISOString().slice(0,10),reminder:$('#qReminder')?.value||'',amount:Number($('#qAmt')?.value||0),concept:$('#qConcept')?.value||'',paid:$('#qPaid')?.value==='si',board:$('#qBoard')?.value||'',person:$('#qPerson')?.value||'',note:$('#qNote')?.value||'',createdAt:new Date().toISOString()};
  const rs=store.records; rs.push(rec); store.records=rs;
  // Si es pizarra y estamos dentro de una cuadra privada, reflejamos visualmente el código en la maqueta de pizarra.
  if(type==='pizarra'){
    const pid=currentContext().privateId; D.board[pid]=D.board[pid]||{}; D.board[pid][horseId]=D.board[pid][horseId]||{};
    const map=['lun','mar','mie','jue','vie','sab','dom']; const day=new Date(rec.date+'T00:00:00'); const key=map[(day.getDay()+6)%7];
    D.board[pid][horseId][key]=rec.board+(rec.person?' · '+rec.person:'');
  }
  alert('Registro guardado en la maqueta: '+[type,h.name,rec.date,rec.amount?money(rec.amount):'',rec.reminder?'recordatorio '+rec.reminder:''].filter(Boolean).join(' · '));
  closeModal();
  if(document.body.dataset.page) pages[document.body.dataset.page]?.();
}
function closeModal(){ $('#modal').classList.remove('show') }
window.addEventListener('DOMContentLoaded',init);
})();
