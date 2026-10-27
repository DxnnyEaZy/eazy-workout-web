"use strict";
/* Biblioteca. t: reps · time (segundos) · run (min por bloque, km opcional) · rounds (min por round) · kg (peso × reps)
   lumbar: carga la zona baja. Material solo de casa: suelo, silla, mesa, toalla, mochila, saco. */
const GROUPS=["Pecho","Espalda","Hombro","Pierna","Core","Cardio","Boxeo","Movilidad","Con peso"];
const LIB=[
 ["flexiones","Flexiones","Pecho","reps"],["flex-diamante","Flexiones diamante","Pecho","reps"],["flex-decl","Flexiones declinadas (pies en silla)","Pecho","reps"],
 ["flex-abiertas","Flexiones abiertas","Pecho","reps"],["fondos-silla","Fondos en silla","Pecho","reps"],
 ["remo-invertido","Remo invertido bajo mesa","Espalda","reps"],["remo-toalla","Remo con toalla en puerta","Espalda","reps"],["ytw","Elevaciones Y-T-W","Espalda","reps"],
 ["superman","Superman","Espalda","reps",1],["angeles","Ángeles boca abajo","Espalda","reps"],["dominadas","Dominadas (si consigues barra)","Espalda","reps"],
 ["pike","Pike push-ups","Hombro","reps"],["pike-elev","Pike con pies en silla","Hombro","reps"],["lat-mochila","Elevaciones laterales con mochila","Hombro","kg"],
 ["sentadilla","Sentadillas","Pierna","reps"],["zancadas","Zancadas (por pierna)","Pierna","reps"],["zancada-atras","Zancada atrás (por pierna)","Pierna","reps"],
 ["bulgara","Sentadilla búlgara (por pierna)","Pierna","reps"],["puente","Puente de glúteo","Pierna","reps"],["puente-uni","Puente a una pierna (por pierna)","Pierna","reps"],
 ["gemelos","Gemelos a una pierna (por pierna)","Pierna","reps"],["pared","Sentadilla isométrica en pared","Pierna","time"],
 ["plancha","Plancha","Core","time"],["plancha-lat","Plancha lateral (por lado)","Core","time"],["mountain","Mountain climbers","Core","reps"],
 ["giros","Giros de tronco","Core","reps"],["dead-bug","Dead bug","Core","reps"],["bird-dog","Bird-dog (por lado)","Core","reps"],["hollow","Hollow hold","Core","time"],
 ["carrera","Carrera · bloque trotando","Cardio","run"],["test-partida","Test de partida · trote seguido","Cardio","run"],["carrera-cont","Carrera continua","Cardio","run"],
 ["comba","Comba","Cardio","rounds"],["burpees","Burpees","Cardio","reps"],
 ["saco","Saco","Boxeo","rounds"],["sombra","Sombra","Boxeo","rounds"],
 ["gato-camello","Gato-camello","Movilidad","reps"],["nino","Postura del niño","Movilidad","time"],["psoas","Estiramiento de psoas (por lado)","Movilidad","time"],
 ["isquios","Isquiotibiales sentado (por lado)","Movilidad","time"],["torsion","Torsión espinal (por lado)","Movilidad","time"],
 ["rodillas-pecho","Rodillas al pecho","Movilidad","time"],["cobra","Cobra / esfinge","Movilidad","time"],
 ["sent-mochila","Sentadilla con mochila","Con peso","kg"],["remo-mochila","Remo con mochila","Con peso","kg",1],["curl-mochila","Curl con mochila","Con peso","kg"]
].map(([id,n,g,t,l])=>({id,n,g,t,lumbar:!!l}));
const TYPE={
 reps:{a:"reps",obj:"reps",best:"reps",timed:false},
 time:{a:"seg",obj:"seg",best:"s",timed:true,sec:v=>v},
 run:{a:"min",b:"km",obj:"min",best:"min",timed:true,sec:v=>v*60},
 rounds:{a:"min",obj:"min/round",best:"rounds",timed:true,sec:v=>v*60},
 kg:{a:"kg",b:"reps",obj:"reps",best:"kg",timed:false}
};

/* Plan de 5 semanas. wk: {semana:[series, objetivo]} · series 0 = esa semana no toca */
const I=(ex,sets,target,rest,wk,kg)=>({ex,sets,target,rest,kg:kg||0,wk:wk||null});
const PLAN_NOTES={1:"Reintroducción al 70%. Vigila el cuádriceps.",2:"Progresión 1. Volumen completo.",3:"Progresión 2. La semana más exigente.",4:"Descarga. Baja el volumen y asimila.",5:"Semana de test. Cada prueba en su día."};
function defaultRoutines(){return [
 {id:"lumbar",name:"Rutina lumbar",mobility:true,cat:"mob",note:"Cada mañana, unos 10 min. Dolor agudo o que baja por la pierna: parar.",
  items:[I("gato-camello",1,10,0),I("nino",1,40,0),I("psoas",2,30,0),I("isquios",2,30,0),I("torsion",2,30,0),I("rodillas-pecho",1,40,0),I("cobra",1,25,0),I("bird-dog",1,9,0)]},
 {id:"cal-a",cat:"str",name:"Calentamiento A",note:"Tren superior + core rotacional. Controla no arquear la lumbar en Y-T-W.",test:"Test S5: todas las series completas y con rango completo.",
  items:[I("flexiones",4,12,60,{1:[3,11],4:[2,10]}),I("flex-diamante",3,9,60,{1:[2,8],4:[2,8]}),I("pike",3,9,60,{1:[2,8],4:[2,8]}),
   I("remo-invertido",3,11,60,{1:[3,9],4:[2,9]}),I("giros",3,20,45,{1:[3,15],4:[2,15]}),I("plancha",3,40,45,{1:[2,30],4:[2,30]}),
   I("mountain",3,20,45,{1:[2,15],4:[2,15]}),I("ytw",2,10,45,{1:[0,0],2:[0,0],4:[0,0]}),I("sombra",1,10,60,{1:[0,0],4:[0,0]})]},
 {id:"cal-b",cat:"str",name:"Calentamiento B",note:"Tren inferior + core. Sombra solo golpeo, pies quietos. Para si el cuádriceps duele más que al empezar.",test:"Test S5: todas las series completas y con rango completo.",
  items:[I("sentadilla",4,17,60,{1:[3,13],4:[2,13]}),I("zancadas",3,12,60,{1:[2,10],4:[2,10]}),I("bulgara",3,10,60,{1:[2,8],4:[2,8]}),
   I("puente",3,15,45,{1:[2,12],4:[2,12]}),I("plancha-lat",3,30,45,{1:[2,25],4:[2,25]}),I("burpees",2,10,60,{1:[0,0],2:[2,8],4:[0,0]}),I("sombra",1,10,60,{1:[0,0],4:[0,0]})]},
 {id:"carrera-l",cat:"run",name:"Carrera lunes",note:"Ritmo conversacional. Si te quedas sin aire a los pocos minutos, baja el ritmo antes de parar. Bloques: trote + 1 min andando.",test:"Test S5: 25 min seguidos sin parar a andar.",
  items:[I("test-partida",1,10,300,{2:[0,0],3:[0,0],4:[0,0],5:[0,0]}),I("carrera",4,6,60,{1:[0,0],3:[3,10],4:[3,4],5:[0,0]}),I("carrera-cont",1,25,0,{1:[0,0],2:[0,0],3:[0,0],4:[0,0]})]},
 {id:"carrera-x",cat:"run",name:"Carrera miércoles",note:"Ritmo conversacional. Bloques: trote + 1 min andando.",
  items:[I("carrera",4,4,60,{2:[4,6],3:[2,15],4:[3,4],5:[0,0]})]},
 {id:"saco",cat:"box",name:"Saco + comba",note:"1 min de descanso entre rounds.",test:"Test S5: 5 rounds × 3 min con intensidad constante, sin cortar.",
  items:[I("saco",3,2,60,{2:[4,2.5],3:[4,3],4:[3,2],5:[5,3]}),I("comba",2,1,60,{2:[3,1.5],3:[3,2],4:[0,0],5:[0,0]})]},
 {id:"empuje",cat:"ext",name:"Empuje en casa",note:"Extra opcional: pecho, hombro y tríceps.",items:[I("flexiones",4,12,60),I("flex-decl",3,10,60),I("pike-elev",3,8,90),I("fondos-silla",3,12,60),I("flex-diamante",3,10,60)]},
 {id:"tiron",cat:"ext",name:"Tirón en casa",note:"Extra opcional para ensanchar espalda y hombro. Superman carga la lumbar: sin forzar.",items:[I("remo-invertido",4,10,90),I("remo-toalla",3,12,60),I("ytw",3,10,45),I("angeles",3,12,45),I("superman",2,12,45)]},
 {id:"pierna",cat:"ext",name:"Pierna en casa",note:"Extra opcional. Vigila el cuádriceps.",items:[I("sentadilla",4,20,60),I("bulgara",3,10,90),I("zancada-atras",3,12,60),I("puente-uni",3,12,45),I("gemelos",3,15,45),I("pared",2,45,60)]},
 {id:"full",cat:"ext",name:"Full body en casa",note:"Extra opcional.",items:[I("flexiones",3,12,60),I("remo-invertido",3,10,60),I("sentadilla",3,20,60),I("pike",3,8,60),I("hollow",3,25,45),I("burpees",2,10,60)]}
];}
/* Calendario semanal: lista de rutinas por día (0 = domingo) */
const DEFAULT_SCHEDULE={1:["lumbar","carrera-l"],2:["lumbar","cal-a"],3:["lumbar","carrera-x"],4:["lumbar","cal-b"],5:["lumbar"],6:["lumbar","saco"],0:["lumbar"]};
const DAYS=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DAY_ORDER=[1,2,3,4,5,6,0];
