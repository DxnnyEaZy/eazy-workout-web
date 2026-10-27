"use strict";
/* Siluetas de ejercicio. viewBox 0 0 140 110, trazo = currentColor. Cabeza = cuadrado (esquinas rectas, marca Dxnny). */
const H=(x,y)=>`<rect x="${x-7}" y="${y-7}" width="14" height="14"/>`;
const L=(...p)=>{let s="";for(let i=0;i<p.length;i+=4)s+=`<line x1="${p[i]}" y1="${p[i+1]}" x2="${p[i+2]}" y2="${p[i+3]}"/>`;return s};
const G=y=>`<line class="gr" x1="6" y1="${y}" x2="134" y2="${y}"/>`;
const POSES={
 pushup:G(92)+L(14,88,84,60, 84,60,92,76, 92,76,98,92)+H(88,52),
 diamond:G(92)+L(14,88,84,60, 84,60,90,76, 90,76,92,92)+`<path class="acc" d="M86 98 L92 92 L98 98"/>`+H(88,52),
 decline:G(96)+`<rect class="acc" x="6" y="70" width="22" height="26"/>`+L(16,68,84,64, 84,64,92,80, 92,80,96,96)+H(90,56),
 pike:G(94)+L(108,94,62,40, 62,40,24,94)+H(34,82),
 plank:G(92)+L(14,88,84,62, 84,62,90,80, 90,80,96,92)+H(88,54),
 sideplank:G(92)+L(110,90,46,58, 46,58,16,90)+L(76,72,62,30)+H(100,48),
 mountain:G(94)+L(104,92,84,58, 84,58,44,64, 44,64,56,78, 44,64,18,92)+H(90,50),
 row:`<line class="acc" x1="8" y1="30" x2="132" y2="30"/>`+L(20,30,20,16, 120,30,120,16)+L(98,30,60,58, 60,58,22,92)+H(104,40)+G(96),
 prone:G(92)+L(26,86,104,86, 26,86,10,76, 104,84,130,66)+H(114,80),
 squat:G(96)+L(60,96,76,68, 76,68,44,66, 44,66,48,34, 48,40,22,48)+H(46,24),
 lunge:G(96)+L(30,94,60,70, 60,70,96,68, 96,96,96,68, 60,70,58,34)+H(56,24),
 bulgarian:G(96)+`<rect class="acc" x="12" y="72" width="26" height="24"/>`+L(24,72,62,72, 62,72,100,70, 100,96,100,70, 62,72,60,34)+H(58,24),
 bridge:G(92)+L(102,92,118,90, 102,92,66,62, 66,62,46,78, 46,78,42,92)+H(124,86),
 calf:G(96)+L(70,30,70,64, 70,64,64,90, 64,90,72,96, 70,64,76,90, 76,90,84,96, 70,38,56,56, 70,38,84,56)+H(70,20),
 wall:`<line class="acc" x1="34" y1="10" x2="34" y2="96"/>`+G(96)+L(40,26,40,64, 40,64,78,64, 78,64,78,96, 40,34,62,44)+H(40,16),
 dip:`<rect class="acc" x="70" y="58" width="44" height="38"/>`+G(96)+L(70,58,64,62, 64,62,58,64, 58,40,58,78, 58,78,28,80, 28,80,24,96)+H(58,28),
 run:G(96)+L(76,34,60,62, 64,42,80,52, 64,42,48,32, 60,62,76,80, 76,80,68,96, 60,62,40,76, 40,76,24,66)+H(80,24),
 bag:G(96)+L(102,6,102,20)+`<rect class="acc" x="86" y="20" width="32" height="64"/>`+L(44,32,44,64, 44,44,30,32, 44,44,70,40, 44,64,30,96, 44,64,58,96)+H(44,22),
 shadow:G(96)+L(64,34,62,64, 62,44,80,38, 80,38,92,32, 62,44,72,30, 62,64,48,96, 62,64,78,96)+H(66,22),
 rope:G(96)+L(66,30,66,62, 66,62,58,90, 66,62,74,90, 66,40,50,52, 66,40,82,52)+`<path class="acc" d="M50 52 Q66 104 82 52"/>`+H(66,20),
 burpee:G(96)+L(70,90,70,58, 70,58,70,30, 70,40,52,14, 70,40,88,14, 70,58,58,90, 70,58,82,90)+H(70,22),
 cat:G(96)+`<path d="M44 56 Q70 32 96 56"/>`+L(44,56,44,96, 96,56,96,96, 38,51,44,56)+H(33,46),
 child:G(94)+L(110,82,36,90, 110,82,114,94, 60,86,56,94, 80,84,78,94)+H(30,88),
 psoas:G(96)+L(38,96,62,68, 102,96,102,78, 102,78,62,68, 62,68,58,38, 62,68,78,82)+H(56,28),
 hamstring:G(94)+L(36,90,114,92, 36,90,28,94)+`<path d="M36 90 Q68 60 96 82"/>`+L(96,82,110,90)+H(100,74),
 twist:G(96)+`<path class="acc" d="M44 92 Q64 100 92 92"/>`+L(64,92,64,52, 64,52,92,44, 64,52,40,62)+H(62,40),
 kneechest:G(90)+L(102,90,72,90)+`<path d="M72 90 Q50 90 48 60 Q48 66 64 64"/>`+L(88,84,60,66)+H(110,84),
 cobra:G(94)+L(102,94,132,94)+`<path d="M102 94 Q76 90 62 58"/>`+L(62,58,50,82, 50,82,46,94)+H(58,48),
 birddog:G(96)+L(46,96,46,60, 92,96,92,60, 46,60,92,60)+`<path class="acc" d="M46 60 L16 52 M92 60 L124 50"/>`+H(38,54),
 supine:G(92)+L(34,86,96,86, 96,86,104,58, 104,58,118,58, 44,86,40,56)+H(24,82),
 curl:G(96)+L(70,30,70,64, 70,64,60,96, 70,64,80,96, 70,38,62,54, 62,54,72,48)+`<rect class="acc" x="70" y="40" width="10" height="10"/>`+H(70,20),
 bentrow:G(96)+L(40,46,80,58, 80,58,70,96, 80,58,92,96, 52,50,54,76)+`<rect class="acc" x="46" y="76" width="16" height="12"/>`+H(32,42),
 stand:G(96)+L(70,30,70,64, 70,64,60,96, 70,64,80,96, 70,38,56,58, 70,38,84,58)+H(70,20)
};
const EX_POSE={"flexiones":"pushup","flex-abiertas":"pushup","flex-diamante":"diamond","flex-decl":"decline","fondos-silla":"dip",
 "remo-invertido":"row","remo-toalla":"row","dominadas":"row","ytw":"prone","superman":"prone","angeles":"prone",
 "pike":"pike","pike-elev":"pike","lat-mochila":"curl","sentadilla":"squat","sent-mochila":"squat","zancadas":"lunge","zancada-atras":"lunge",
 "bulgara":"bulgarian","puente":"bridge","puente-uni":"bridge","gemelos":"calf","pared":"wall","plancha":"plank","plancha-lat":"sideplank",
 "mountain":"mountain","giros":"twist","dead-bug":"supine","hollow":"supine","bird-dog":"birddog","carrera":"run","test-partida":"run","carrera-cont":"run",
 "comba":"rope","burpees":"burpee","saco":"bag","sombra":"shadow","gato-camello":"cat","nino":"child","psoas":"psoas","isquios":"hamstring",
 "torsion":"twist","rodillas-pecho":"kneechest","cobra":"cobra","remo-mochila":"bentrow","curl-mochila":"curl"};
const GROUP_POSE={Pecho:"pushup",Espalda:"row",Hombro:"pike",Pierna:"squat",Core:"plank",Cardio:"run",Boxeo:"bag",Movilidad:"cat","Con peso":"curl"};
function poseSVG(exId,cls=""){const e=exById(exId),k=EX_POSE[exId]||GROUP_POSE[e.g]||"stand";
  return `<svg class="pose ${cls}" viewBox="0 0 140 110" aria-hidden="true">${POSES[k]}</svg>`}
/* Categoría y color de cada rutina, como las vistas previas de DXFX */
const CATS={run:{n:"Carrera",c:"#35E0C0"},box:{n:"Boxeo",c:"#FF4D5A"},str:{n:"Fuerza",c:"#5B8CFF"},mob:{n:"Movilidad",c:"#5FD38D"},ext:{n:"Extra",c:"#FF2BD6"}};
function catOf(r){if(!r)return "str";if(r.cat)return r.cat;if(r.mobility)return "mob";
  const gs=r.items.map(i=>exById(i.ex).g);const has=g=>gs.includes(g);
  if(has("Boxeo"))return "box";if(gs.length&&gs.every(g=>g==="Cardio"))return "run";if(gs.length&&gs.every(g=>g==="Movilidad"))return "mob";return "str"}
const catColor=r=>(r&&r.color)||CATS[catOf(r)].c;
const SWATCHES=["#35E0C0","#FF4D5A","#5B8CFF","#5FD38D","#FF2BD6","#FFD34D","#FF8A3D","#B18CFF","#7F93A3","#F4F5F6"];
