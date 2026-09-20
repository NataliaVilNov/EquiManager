export const STORAGE_KEY = 'equilog.modular.roles.sharedhorses.v1';

const today = new Date();
const iso = d => d.toISOString().slice(0,10);
const add = n => { const d = new Date(today); d.setDate(d.getDate()+n); return iso(d); };

export const seedData = {
  activeProfileId: 'gerente',
  activeView: 'inicio',
  settings: {
    centerName: 'EquiLog',
    accent: '#1f3a2e'
  },
  profiles: [
    { id:'gerente', name:'Gerente', short:'G', color:'#1f3a2e', photo:'', roles:['gerente','profesor'], privateStableId:null, ownerName:'Gerencia', canCreate:true },
    { id:'prof1', name:'Profesor/a 1', short:'P1', color:'#3f5f8f', photo:'', roles:['profesor'], privateStableId:null, ownerName:'Profesor/a 1', canCreate:true },
    { id:'ale', name:'Ale', short:'A', color:'#7a5ba0', photo:'', roles:['jinete','propietario'], privateStableId:'priv_ale', ownerName:'Ale', canCreate:true },
    { id:'alberto', name:'Alberto', short:'AL', color:'#a8721f', photo:'', roles:['jinete','propietario'], privateStableId:'priv_alberto', ownerName:'Alberto', canCreate:true }
  ],
  stables: [
    { id:'campomanes', name:'Cuadra Campomanes', type:'general', visibleTo:['gerente'], color:'#1f3a2e' },
    { id:'priv_ale', name:'Cuadra privada de Ale', type:'private', ownerProfileId:'ale', sharedWith:[], color:'#7a5ba0' },
    { id:'priv_alberto', name:'Cuadra privada de Alberto', type:'private', ownerProfileId:'alberto', sharedWith:[], color:'#a8721f' }
  ],
  horses: [
    { id:'caleste', name:'Caleste', photo:'', ownerProfileIds:['ale'], riderProfileId:'ale', homeStableId:'campomanes', linkedStableIds:['campomanes','priv_ale'], type:'privado', status:'activo', notes:'Caballo compartido entre cuadra general y cuadra privada.' },
    { id:'houston', name:'Houston', photo:'', ownerProfileIds:['ale'], riderProfileId:'ale', homeStableId:'campomanes', linkedStableIds:['campomanes','priv_ale'], type:'privado', status:'activo', notes:'' },
    { id:'gogo', name:'Gogo', photo:'', ownerProfileIds:['ale'], riderProfileId:'ale', homeStableId:'campomanes', linkedStableIds:['campomanes','priv_ale'], type:'privado', status:'activo', notes:'' },
    { id:'caballo_alberto_1', name:'Caballo Alberto 1', photo:'', ownerProfileIds:['alberto'], riderProfileId:'alberto', homeStableId:'campomanes', linkedStableIds:['campomanes','priv_alberto'], type:'privado', status:'activo', notes:'' },
    { id:'pony1', name:'Pony Escuela 1', photo:'', ownerProfileIds:['gerente'], riderProfileId:'', homeStableId:'campomanes', linkedStableIds:['campomanes'], type:'escuela', status:'disponible', notes:'Disponible para clases.' },
    { id:'pony2', name:'Pony Escuela 2', photo:'', ownerProfileIds:['gerente'], riderProfileId:'', homeStableId:'campomanes', linkedStableIds:['campomanes'], type:'escuela', status:'disponible', notes:'Disponible para clases.' }
  ],
  students: [
    { id:'alumno1', name:'Alumno 1', level:'Iniciación', notes:'' },
    { id:'alumno2', name:'Alumno 2', level:'Ponis', notes:'' },
    { id:'alumno3', name:'Alumno 3', level:'Intermedio', notes:'' }
  ],
  classes: [
    { id:'clase1', date:add(0), time:'17:00', type:'grupo', title:'Grupo ponis', teacherId:'prof1', place:'Pista cubierta', studentIds:['alumno1','alumno2'], assignments:{ alumno1:'pony1', alumno2:'pony2' }, attendance:{ alumno1:'pendiente', alumno2:'pendiente' }, notes:{} },
    { id:'clase2', date:add(1), time:'18:00', type:'particular', title:'Clase particular', teacherId:'prof1', place:'Pista 1', studentIds:['alumno3'], assignments:{ alumno3:'pony1' }, attendance:{ alumno3:'pendiente' }, notes:{} }
  ],
  board: [
    { id:'b1', stableId:'priv_ale', horseId:'caleste', date:add(0), code:'P', personProfileId:'ale', done:false, note:'' },
    { id:'b2', stableId:'priv_ale', horseId:'houston', date:add(1), code:'C', personProfileId:'ale', done:false, note:'' },
    { id:'b3', stableId:'priv_alberto', horseId:'caballo_alberto_1', date:add(0), code:'M', personProfileId:'alberto', done:false, note:'' }
  ],
  records: [
    { id:'r1', type:'recordatorio', horseId:'caleste', profileId:'ale', date:add(7), reminderDate:add(7), title:'Revisar vacunas', amount:null, note:'' }
  ],
  quickLinks: {
    gerente: ['clases','caballos','equipo'],
    prof1: ['clases','alumnos','caballos'],
    ale: ['pizarra','caballos','registro'],
    alberto: ['pizarra','caballos','registro']
  }
};
