window.EquiData = {
  users:[
    {id:'gerente',name:'Gerente',role:'gerente',initial:'G',views:['gerencia','cuadra-campomanes'],canSeeGeneric:true,canSeePrivate:['ale:shared'],canSeePrivateCosts:false},
    {id:'ale',name:'Ale',role:'jinete',initial:'A',views:['cuadra-privada-ale','mis-caballos'],canSeeGeneric:false,canSeePrivate:['ale'],canSeePrivateCosts:true},
    {id:'alberto',name:'Alberto',role:'profesor/jinete',initial:'AL',views:['mis-clases','cuadra-privada-alberto','mis-caballos'],canSeeGeneric:false,canSeePrivate:['alberto'],canSeePrivateCosts:true}
  ],
  sites:[{id:'campomanes',name:'Campomanes',type:'sede',folders:['cuadra-campomanes','escuela-campomanes']}],
  horses:[
    {id:'caleste',name:'Caleste',owner:'Ale',stable:'Campomanes',privateStable:'ale',responsible:'Ale',monthly:420,paid:true,extras:[{concept:'Trabajo extra febrero',amount:60,paid:false}],privateCosts:[{concept:'Veterinario concurso',amount:180},{concept:'Transporte concurso',amount:90}]},
    {id:'chacoon',name:'Chacoon',owner:'Ale',stable:'Campomanes',privateStable:'ale',responsible:'Ale',monthly:420,paid:false,extras:[{concept:'Cama extra',amount:35,paid:false}],privateCosts:[{concept:'Inscripción concurso',amount:85}]},
    {id:'dassini',name:'Dassini',owner:'Ale',stable:'Campomanes',privateStable:'ale',responsible:'Ale',monthly:420,paid:true,extras:[],privateCosts:[{concept:'Fisio',amount:70}]},
    {id:'houston',name:'Houston',owner:'Ale',stable:'Campomanes',privateStable:'ale',responsible:'Ale',monthly:420,paid:false,extras:[{concept:'Suplemento',amount:45,paid:true}],privateCosts:[]},
    {id:'gogo',name:'Gogo',owner:'Ale',stable:'Campomanes',privateStable:'ale',responsible:'Ale',monthly:420,paid:true,extras:[],privateCosts:[]},
    {id:'basilea',name:'Basilea',owner:'Ale',stable:'Campomanes',privateStable:'ale',responsible:'Ale',monthly:420,paid:false,extras:[{concept:'Vendaje',amount:20,paid:false}],privateCosts:[{concept:'Veterinario ojo',amount:110}]},
    {id:'casado',name:'Casado',owner:'Ale',stable:'Campomanes',privateStable:'ale',responsible:'Ale',monthly:420,paid:true,extras:[],privateCosts:[]},
    {id:'alfa',name:'Alfa',owner:'Alberto',stable:'Campomanes',privateStable:'alberto',responsible:'Alberto',monthly:420,paid:true,extras:[{concept:'Herrador extra',amount:75,paid:true}],privateCosts:[{concept:'Entrenamiento concurso',amount:120}]},
    {id:'bruma',name:'Bruma',owner:'Alberto',stable:'Campomanes',privateStable:'alberto',responsible:'Alberto',monthly:420,paid:false,extras:[],privateCosts:[{concept:'Veterinario particular',amount:95}]}
  ],
  privateStables:[
    {id:'ale',name:'Cuadra privada de Ale',owner:'Ale',sharedWithManager:true,horses:['caleste','chacoon','dassini','houston','gogo','basilea','casado'],people:['Ale','Natalia','Isa','Sonso']},
    {id:'alberto',name:'Cuadra privada de Alberto',owner:'Alberto',sharedWithManager:false,horses:['alfa','bruma'],people:['Alberto']}
  ],
  board:{
    ale:{
      caleste:{mar:'✓A',mie:'✓N',jue:'P'},
      chacoon:{mar:'✓N',mie:'✓N ✓A',jue:'P',sab:'Show',dom:'Show'},
      dassini:{mar:'Isa',mie:'✓A ✓S',jue:'P · Javi',sab:'Show',dom:'Show'},
      houston:{mar:'Isa',mie:'✓C',jue:'P'},
      gogo:{mar:'✓N ✓A',mie:'Isa',jue:'N'},
      basilea:{mar:'Irene',mie:'✓A ✓S',jue:'C+P',sab:'Show',dom:'Show'},
      casado:{lun:'C',jue:'P'}
    },
    alberto:{alfa:{lun:'P',mie:'M',vie:'C'},bruma:{mar:'P',jue:'V'}}
  },
  school:{
    classes:[
      {id:'cl1',day:'Lunes',time:'17:00',type:'grupo',teacher:'Alberto',students:['Lucía','Mateo','Clara'],horses:['Poni 1','Poni 2','Poni 3'],paid:'pendiente'},
      {id:'cl2',day:'Miércoles',time:'18:00',type:'particular',teacher:'Alberto',students:['Sofía'],horses:['Caballo escuela 1'],paid:'pagado'}
    ]
  }
}
