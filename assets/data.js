(function(){
  const today = new Date(); today.setHours(0,0,0,0);
  const iso = d => d.toISOString().slice(0,10);
  const add = n => { const d = new Date(today); d.setDate(d.getDate()+n); return iso(d); };
  const dow = (today.getDay()+6)%7;
  const mon = new Date(today); mon.setDate(today.getDate()-dow);
  const w = n => { const d = new Date(mon); d.setDate(mon.getDate()+n); return iso(d); };

  window.EQ_SEED = {
    activeProfileId: 'p_gerente',
    settings: { activeView: 'inicio' },
    profiles: [
      { id:'p_gerente', name:'Gerente', alias:'Gerente', color:'#1f3a2e', photo:'', roles:['gerente'], privateStableId:null, permissions:{ canCreateHorse:true, canEditProfiles:true, canCreateClass:true } },
      { id:'p_prof1', name:'Profesor/a 1', alias:'Profe 1', color:'#3f5f8f', photo:'', roles:['profesor'], privateStableId:null, permissions:{ canCreateClass:true, canAssignHorse:true } },
      { id:'p_jinete', name:'Jinete 1', alias:'Jinete', color:'#a8721f', photo:'', roles:['jinete'], privateStableId:'cuadra_demo', permissions:{ canCreateBoard:true, canCreateHorse:true } },
      { id:'p_prop', name:'Propietario/a 1', alias:'Prop.', color:'#7a5ba0', photo:'', roles:['propietario'], privateStableId:null, permissions:{ canCreateReminder:true } }
    ],
    stables: [
      { id:'cuadra_demo', name:'Cuadra privada', people:['p_jinete'], sharedWith:[] }
    ],
    horses: [
      { id:'h_caleste', name:'Caleste', photo:'', type:'Caballo', ownerIds:['p_prop'], riderId:'p_jinete', stableIds:['cuadra_demo'], school:false, notes:'', health:[] },
      { id:'h_chacoon', name:'Chacoon', photo:'', type:'Caballo', ownerIds:['p_jinete'], riderId:'p_jinete', stableIds:['cuadra_demo'], school:false, notes:'', health:[] },
      { id:'h_dassini', name:'Dassini', photo:'', type:'Caballo', ownerIds:['p_jinete'], riderId:'p_jinete', stableIds:['cuadra_demo'], school:false, notes:'', health:[] },
      { id:'h_pony1', name:'Pony 1', photo:'', type:'Poni escuela', ownerIds:[], riderId:'p_prof1', stableIds:[], school:true, notes:'Poni tranquilo para iniciación', health:[] },
      { id:'h_pony2', name:'Pony 2', photo:'', type:'Poni escuela', ownerIds:[], riderId:'p_prof1', stableIds:[], school:true, notes:'Mejor para niños pequeños', health:[] }
    ],
    students: [
      { id:'s_alumno1', name:'Alumno/a 1', level:'Iniciación', notes:'', usualHorseId:'h_pony1' },
      { id:'s_alumno2', name:'Alumno/a 2', level:'Grupo ponis', notes:'', usualHorseId:'h_pony2' },
      { id:'s_alumno3', name:'Alumno/a 3', level:'Intermedio', notes:'', usualHorseId:'' }
    ],
    classes: [
      { id:'c_1', date:w(1), time:'17:00', title:'Grupo ponis', type:'grupo', professorId:'p_prof1', place:'Pista', studentIds:['s_alumno1','s_alumno2'], assignments:{s_alumno1:'h_pony1',s_alumno2:'h_pony2'}, attendance:{}, notes:'' },
      { id:'c_2', date:w(3), time:'18:00', title:'Clase particular', type:'particular', professorId:'p_prof1', place:'Picadero', studentIds:['s_alumno3'], assignments:{s_alumno3:'h_pony1'}, attendance:{}, notes:'' }
    ],
    boardEntries: [
      { id:'b1', horseId:'h_caleste', date:w(1), code:'A', activity:'P', personId:'p_jinete', done:true, note:'' },
      { id:'b2', horseId:'h_chacoon', date:w(3), code:'P', activity:'P', personId:'p_jinete', done:false, note:'' },
      { id:'b3', horseId:'h_dassini', date:w(3), code:'P', activity:'P', personId:'p_jinete', done:false, note:'Javi Obama' },
      { id:'b4', horseId:'h_chacoon', date:w(5), code:'Show', activity:'SHOW', personId:'p_jinete', done:false, note:'' }
    ],
    records: [
      { id:'r1', type:'recordatorio', horseId:'h_caleste', date:add(3), reminderDate:add(3), title:'Revisar herrador', note:'Confirmar si toca esta semana', visibleTo:'horse' }
    ]
  };
})();
