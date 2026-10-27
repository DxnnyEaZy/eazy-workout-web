"use strict";
/* ===== Perfil, plantillas, objetivos y primer arranque (versión para amigos) ===== */
const APP_VERSION="2.5";
/* ejercicios de gimnasio */
[["press-banca","Press banca","Pecho","kg"],["press-militar","Press militar","Hombro","kg",1],["elev-lat","Elevaciones laterales","Hombro","kg"],
 ["fondos","Fondos en paralelas","Pecho","reps"],["ext-triceps","Extensión de tríceps","Con peso","kg"],["jalon","Jalón al pecho","Espalda","kg"],
 ["remo-barra","Remo con barra","Espalda","kg",1],["curl-biceps","Curl de bíceps","Con peso","kg"],["sent-barra","Sentadilla con barra","Pierna","kg",1],
 ["prensa","Prensa","Pierna","kg"],["pmr","Peso muerto rumano","Pierna","kg",1],["curl-fem","Curl femoral","Pierna","kg"],["hip-thrust","Hip thrust","Pierna","kg"],
 ["peso-muerto","Peso muerto","Espalda","kg",1]].forEach(([id,n,g,t,l])=>{if(!LIB.some(e=>e.id===id))LIB.push({id,n,g,t,lumbar:!!l})});
Object.assign(EX_POSE,{"press-banca":"supine","press-militar":"burpee","elev-lat":"curl","fondos":"dip","ext-triceps":"curl","jalon":"row","remo-barra":"bentrow",
 "curl-biceps":"curl","sent-barra":"squat","prensa":"squat","pmr":"bentrow","curl-fem":"supine","hip-thrust":"bridge","peso-muerto":"bentrow"});

const GOAL_OPTS=[{k:"home",n:"Fuerza en casa",d:"Peso corporal, sin material"},{k:"gym",n:"Gimnasio",d:"Pesas y máquinas"},{k:"run",n:"Correr",d:"De cero a correr seguido"},
 {k:"box",n:"Boxeo",d:"Saco, sombra y comba"},{k:"mob",n:"Movilidad",d:"10 min diarios de estiramientos"}];
const ZONE_OPTS=[["lumbar","Lumbar"],["rodilla","Rodilla"],["hombro","Hombro"],["cuello","Cuello"],["muneca","Muñeca"],["tobillo","Tobillo"]];
const TEMPLATES={
 home:[{id:"t-casa-a",cat:"str",name:"Fuerza en casa A",note:"Cuerpo completo. Técnica antes que cantidad.",items:[I("flexiones",3,10,60),I("sentadilla",3,15,60),I("remo-invertido",3,8,60),I("puente",3,12,45),I("plancha",3,30,45),I("mountain",3,15,45)]},
       {id:"t-casa-b",cat:"str",name:"Fuerza en casa B",note:"Cuerpo completo, variantes.",items:[I("pike",3,8,60),I("zancadas",3,10,60),I("flex-diamante",3,8,60),I("bulgara",3,8,60),I("angeles",3,12,45),I("plancha-lat",3,25,45),I("giros",3,16,45)]}],
 gym:[{id:"t-gym-empuje",cat:"str",name:"Empuje",note:"Pecho, hombro y tríceps.",items:[I("press-banca",4,8,120,null,40),I("press-militar",3,8,90,null,25),I("fondos",3,8,90),I("elev-lat",3,12,60,null,6),I("ext-triceps",3,12,60,null,15)]},
      {id:"t-gym-tiron",cat:"str",name:"Tirón",note:"Espalda y bíceps.",items:[I("dominadas",4,6,120),I("jalon",3,10,90,null,40),I("remo-barra",3,10,90,null,35),I("curl-biceps",3,10,60,null,10)]},
      {id:"t-gym-pierna",cat:"str",name:"Pierna",note:"Los marcados Lumbar cargan la zona baja: técnica antes que peso.",items:[I("sent-barra",4,8,120,null,40),I("prensa",3,10,90,null,80),I("pmr",3,10,90,null,40),I("curl-fem",3,12,60,null,25),I("gemelos",3,15,45)]}],
 run:[{id:"t-run-suave",cat:"run",name:"Carrera suave",note:"Ritmo conversacional: trote + 1 min andando. Si te quedas sin aire, baja el ritmo antes de parar.",items:[I("carrera",4,5,60)]},
      {id:"t-run-series",cat:"run",name:"Series",note:"Bloques algo más rápidos con 90 s andando entre medias.",items:[I("carrera",6,2,90)]}],
 box:[{id:"t-box-saco",cat:"box",name:"Saco + comba",note:"1 min de descanso entre rounds.",items:[I("saco",4,2,60),I("comba",3,1,60)]},
      {id:"t-box-sombra",cat:"box",name:"Sombra + core",note:"Juego de pies y guardia alta.",items:[I("sombra",3,3,60),I("plancha",3,30,45),I("giros",3,20,45),I("burpees",3,8,60)]}],
 mob:[{id:"t-movilidad",cat:"mob",mobility:true,name:"Movilidad",note:"Cada mañana, unos 10 min. Si algo duele de forma aguda, para.",items:[I("gato-camello",1,10,0),I("nino",1,40,0),I("psoas",2,30,0),I("isquios",2,30,0),I("torsion",2,30,0),I("cobra",1,25,0),I("bird-dog",1,9,0)]}]};
const isDani=()=>S.profile&&S.profile.template==="dani";
const planLen=()=>(S.profile&&S.profile.weeks)||4;
function planNote(w){if(isDani())return PLAN_NOTES[w]||"";if(w%4===0)return "Descarga. Baja el volumen y asimila.";if(w===1)return "Semana 1. Coge el ritmo sin forzar.";return `Semana ${w}. Un poco más que la anterior.`}
/* progresión automática para rutinas sin ajustes por semana */
const INC={reps:1,time:5,run:1,rounds:0,kg:0};
function autoWeek(it,w){if(isDani())return null;const t=exById(it.ex).t,cyc=w-1-Math.floor((w-1)/4);
  if(w%4===0)return {sets:Math.max(1,it.sets-1),target:it.target,kg:it.kg};
  return {sets:it.sets,target:it.target+INC[t]*cyc,kg:t==="kg"?(it.kg||0)+2.5*cyc:it.kg}}
const zoneVal=(f,id)=>f?(f.zones&&f.zones[id]!=null?f.zones[id]:f[id]):null;

/* ===== Generar plan desde el perfil ===== */
function buildFromProfile(p){const beg=p.level==="new",scale=it=>{const c=structuredClone(it);if(beg){c.sets=Math.max(1,c.sets-1);c.target=Math.max(1,Math.round(c.target*.8))}return c};
  const pick=k=>TEMPLATES[k].map(r=>({...structuredClone(r),items:r.items.map(scale)}));
  const routines=[];const mains=[];
  for(const k of p.goals.filter(g=>g!=="mob")){const rs=pick(k);routines.push(...rs);mains.push(rs)}
  const wantMob=p.goals.includes("mob")||p.zones.length>0;if(wantMob)routines.push(...pick("mob"));
  const order=[];for(let i=0;i<4;i++)for(const g of mains)if(g[i])order.push(g[i].id);
  const schedule={0:[],1:[],2:[],3:[],4:[],5:[],6:[]};
  p.days.slice().sort((a,b)=>DAY_ORDER.indexOf(a)-DAY_ORDER.indexOf(b)).forEach((d,i)=>{if(order.length)schedule[d].push(order[i%order.length])});
  if(wantMob)for(const d of [0,1,2,3,4,5,6])schedule[d].unshift("t-movilidad");
  const goals=[];
  if(p.goals.includes("home"))goals.push({id:uid(),kind:"ex",ex:"flexiones",n:"Flexiones seguidas",target:beg?15:25,unit:"reps"});
  if(p.goals.includes("gym"))goals.push({id:uid(),kind:"ex",ex:"sent-barra",n:"Sentadilla con barra",target:beg?40:70,unit:"kg"});
  if(p.goals.includes("run"))goals.push({id:uid(),kind:"run",n:"Correr seguido",target:beg?20:30,unit:"min"});
  if(p.goals.includes("box"))goals.push({id:uid(),kind:"ex",ex:"saco",n:"Rounds de saco de 3 min",target:5,minA:3,unit:"rounds"});
  return {routines,schedule,goals}}
function danifyIfNeeded(d){/* datos de antes de la v2.5: perfil de Dani con su plan */
  if(S.profile)return;S.profile={name:"Dani",template:"dani",goals:["home","run","box","mob"],level:"mid",days:[1,2,3,4,6],weeks:5,
    zones:[{id:"lumbar",n:"Lumbar"},{id:"quad",n:"Cuádriceps / rodilla"}]};
  S.goals=[{id:"g-run",kind:"run",n:"Carrera seguida",target:25,unit:"min"},{id:"g-saco",kind:"ex",ex:"saco",n:"Saco",target:5,minA:3,unit:"rounds de 3 min"},
    {id:"g-a",kind:"routine",rid:"cal-a",week:3,n:"Calentamiento A",target:100,unit:"%"},{id:"g-b",kind:"routine",rid:"cal-b",week:3,n:"Calentamiento B",target:100,unit:"%"}]}

/* ===== Objetivos ===== */
function goalValue(g){const R=real();
  if(g.kind==="run"){let v=0;for(const s of R)for(const i of s.items)if(["carrera","test-partida","carrera-cont"].includes(i.ex))for(const z of i.sets)if(z.done)v=Math.max(v,num(z.a));return v}
  if(g.kind==="routine"){const r=routineById(g.rid);if(!r)return 0;const plan=routineItems(r,g.week||planLen()).reduce((a,b)=>a+b.sets,0);
    const last=R.filter(s=>s.routineId===g.rid).sort((a,b)=>b.start-a.start)[0];if(!last||!plan)return 0;
    return Math.min(100,Math.round(last.items.reduce((a,i)=>a+i.sets.filter(z=>z.done).length,0)/plan*100))}
  const t=exById(g.ex).t;let v=0;for(const s of R)for(const i of s.items)if(i.ex===g.ex){const d=i.sets.filter(z=>z.done&&(!g.minA||num(z.a)>=g.minA));
    v=Math.max(v,t==="rounds"?d.length:d.length?Math.max(...d.map(z=>num(z.a))):0)}return v}
function goalSheet(){let ex="flexiones";
  openSheet(`<h3>Nuevo objetivo</h3><p class="sub">Elige un ejercicio y la marca a la que quieres llegar.</p>
  <div class="stack" style="margin-top:16px"><button class="btn wide" id="gEx" type="button">${esc(exById(ex).n)}</button>
  <label class="f"><span class="lbl">Marca objetivo</span><input id="gT" inputmode="decimal" placeholder="Ej. 25"></label>
  <button class="btn main" id="gOk" type="button"><span>Guardar objetivo</span><span>→</span></button></div>`,()=>{
    $("#gEx").onclick=()=>picker(id=>{ex=id;goalSheetPicked(id)});
    $("#gOk").onclick=()=>saveGoal(ex)})}
function goalSheetPicked(id){openSheet(`<h3>Nuevo objetivo</h3><div class="stack" style="margin-top:16px"><div class="item"><div class="thumb">${poseSVG(id)}</div><div class="grow t">${esc(exById(id).n)}</div></div>
  <label class="f"><span class="lbl">Marca objetivo (${TYPE[exById(id).t].best})</span><input id="gT" inputmode="decimal" placeholder="Ej. 25"></label>
  <button class="btn main" id="gOk" type="button"><span>Guardar objetivo</span><span>→</span></button></div>`,()=>{$("#gOk").onclick=()=>saveGoal(id)})}
function saveGoal(ex){const t=num($("#gT").value);if(!t){toast("Pon la marca a la que quieres llegar");return}const e=exById(ex);
  S.goals.push({id:uid(),kind:e.t==="run"?"run":"ex",ex,n:e.n,target:t,unit:TYPE[e.t].best});save();closeSheet();render();toast("Objetivo guardado")}

/* ===== Primer arranque ===== */
let OB=null;
function startOnboarding(redo=false){OB={step:0,redo,p:{name:(S.profile&&S.profile.name)||"",goals:[],level:"mid",days:[1,3,5],zones:[],weeks:6}};
  document.body.classList.add("onb");renderOnb()}
function obChips(opts,sel,attr,multi=true){return `<div class="stack">${opts.map(o=>`<button type="button" class="tap item ${sel.includes(o.k)?"on":""}" data-${attr}="${o.k}" style="min-height:56px">
  <div class="grow"><div class="t">${esc(o.n)}</div>${o.d?`<div class="s">${esc(o.d)}</div>`:""}</div><span class="obck">${sel.includes(o.k)?"✓":""}</span></button>`).join("")}</div>`}
function renderOnb(){const p=OB.p,st=OB.step,steps=6;
  const head=`<div class="row" style="margin-bottom:8px">${Array.from({length:steps},(_,i)=>`<i class="obdot ${i<=st?"on":""}"></i>`).join("")}</div>`;
  let body="";
  if(st===0)body=`<p class="lbl">Bienvenido</p><h1>EaZy-Workout</h1><p class="sub">Tu plan de entreno en el móvil: qué toca hoy, temporizadores para series y descansos, y tu progreso. Cinco preguntas y empiezas.</p>
    ${installHint()}<label class="f" style="margin-top:20px"><span class="lbl">¿Cómo te llamas?</span><input id="obName" value="${esc(p.name)}" autocomplete="given-name" placeholder="Tu nombre"></label>`;
  if(st===1)body=`<p class="lbl">Paso 1 de 5</p><h1>¿Qué quieres entrenar?</h1><p class="sub">Puedes marcar varias.</p><div style="margin-top:16px">${obChips(GOAL_OPTS,p.goals,"g")}</div>`;
  if(st===2)body=`<p class="lbl">Paso 2 de 5</p><h1>¿Qué días entrenas?</h1><p class="sub">La app reparte tus rutinas en esos días.</p>
    <div class="days" style="margin-top:16px">${DAY_ORDER.map(d=>`<button type="button" data-d="${d}" class="${p.days.includes(d)?"on":""}">${DAYS[d]}</button>`).join("")}</div>`;
  if(st===3)body=`<p class="lbl">Paso 3 de 5</p><h1>¿Cómo vas?</h1><div style="margin-top:16px">${obChips([{k:"new",n:"Empezando",d:"Llevo poco o vuelvo tras un parón"},{k:"mid",n:"Ya entreno",d:"Tengo constancia desde hace meses"}],[p.level],"l")}</div>`;
  if(st===4)body=`<p class="lbl">Paso 4 de 5</p><h1>¿Alguna molestia que vigilar?</h1><p class="sub">Al terminar cada entreno te preguntará cómo está. Si marcas alguna, añade movilidad diaria.</p>
    <div style="margin-top:16px">${obChips(ZONE_OPTS.map(([k,n])=>({k,n})),p.zones.map(z=>z.id),"z")}</div>`;
  if(st===5)body=`<p class="lbl">Paso 5 de 5</p><h1>¿Cuántas semanas dura tu plan?</h1><p class="sub">Cada semana sube un poco. Cada cuarta semana baja para recuperar.</p>
    <div class="seg" id="obW" style="grid-template-columns:repeat(3,1fr);margin-top:16px"><span class="slider" style="width:calc(33.33% - 1.3px)"></span>${[4,6,8].map(w=>`<button type="button" data-w="${w}" class="${p.weeks===w?"on":""}">${w} semanas</button>`).join("")}</div>`;
  view().innerHTML=`<div class="onbwrap rise">${head}${body}
    <div class="row" style="margin-top:24px">${st?`<button class="btn" id="obBack" type="button">Atrás</button>`:""}<button class="btn main grow" id="obNext" type="button"><span>${st===steps-1?"Crear mi plan":"Siguiente"}</span><span>→</span></button></div></div>`;
  const nm=$("#obName");if(nm)nm.oninput=e=>p.name=e.target.value;
  const tg=(arr,v)=>arr.includes(v)?arr.filter(x=>x!==v):arr.concat(v);
  view().querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{p.goals=tg(p.goals,b.dataset.g);renderOnb()});
  view().querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{p.days=tg(p.days,+b.dataset.d);renderOnb()});
  view().querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{p.level=b.dataset.l;renderOnb()});
  view().querySelectorAll("[data-z]").forEach(b=>b.onclick=()=>{const id=b.dataset.z;p.zones=p.zones.some(z=>z.id===id)?p.zones.filter(z=>z.id!==id):p.zones.concat({id,n:ZONE_OPTS.find(x=>x[0]===id)[1]});renderOnb()});
  const sg=$("#obW");if(sg){const bs=[...sg.querySelectorAll("button")],sl=sg.querySelector(".slider"),pl=()=>sl.style.transform=`translateX(${bs.findIndex(b=>b.classList.contains("on"))*100}%)`;pl();
    bs.forEach(b=>b.onclick=()=>{p.weeks=+b.dataset.w;bs.forEach(x=>x.classList.toggle("on",x===b));pl()})}
  const bk=$("#obBack");if(bk)bk.onclick=()=>{OB.step--;renderOnb()};
  $("#obNext").onclick=()=>{if(st===0&&!p.name.trim()){toast("Escribe tu nombre");return}if(st===1&&!p.goals.length){toast("Elige al menos una opción");return}
    if(st===2&&!p.days.length&&p.goals.some(g=>g!=="mob")){toast("Elige al menos un día");return}
    if(st<steps-1){OB.step++;renderOnb();window.scrollTo(0,0);return}finishOnboarding()}}
function finishOnboarding(){const p=OB.p;p.name=p.name.trim();p.template="custom";const b=buildFromProfile(p);
  if(OB.redo){S.routines=S.routines.filter(r=>!r.id.startsWith("t-")).concat(b.routines)}else S.routines=b.routines;
  S.schedule=b.schedule;S.goals=b.goals;S.profile=p;S.settings.planStart=isoDay(mondayOf(new Date()));S.settings.weekOverride=0;
  save();OB=null;document.body.classList.remove("onb");stack.length=0;tab="today";render();scheduleReminders();tourSheet()}
function tourSheet(i=0){const T=[["Mira antes de empezar","Toca una rutina para ver qué toca hoy. Nada empieza hasta que pulses Empezar, y puedes dejarla para más tarde con un aviso."],
  ["Marca y descansa",`Cada serie que marcas arranca el descanso. ${NATIVE?"El aviso suena aunque bloquees el móvil.":"Suena mientras tengas la app abierta."} Plancha, carrera y rounds tienen su cuenta atrás.`],
  ["Mira cómo avanzas","En Progreso ves tus objetivos, tu semana y tu peso. En Ajustes puedes enviarme sugerencias por WhatsApp."]];
  openSheet(`<p class="lbl">${i+1} de 3</p><h3>${T[i][0]}</h3><p class="sub" style="margin-top:6px">${T[i][1]}</p>
    <button class="btn main" id="tNext" type="button" style="margin-top:20px"><span>${i<2?"Siguiente":"Empezar"}</span><span>→</span></button>`,()=>{$("#tNext").onclick=()=>{if(i<2)tourSheet(i+1);else closeSheet()}})}

/* ===== Sugerencias por WhatsApp ===== */
function feedbackSheet(){let useful="";
  openSheet(`<h3>Enviar sugerencia</h3><p class="sub">Se abre WhatsApp con el mensaje listo. Elige a quien te pasó la app.</p>
  <div class="stack" style="margin-top:16px"><span class="lbl">¿Te resulta útil?</span>
  <div class="seg" id="fbU" style="grid-template-columns:repeat(3,1fr)"><span class="slider" style="width:calc(33.33% - 1.3px);opacity:0"></span><button type="button" data-u="Sí">Sí</button><button type="button" data-u="A medias">A medias</button><button type="button" data-u="No">No</button></div>
  <label class="f"><span class="lbl">¿Qué cambiarías o añadirías?</span><textarea id="fbT" placeholder="Lo que sea: algo que no entiendes, algo que falla, algo que echas de menos"></textarea></label>
  <button class="btn main" id="fbSend" type="button"><span>Enviar por WhatsApp</span><span>→</span></button></div>`,()=>{
    const sg=$("#fbU"),bs=[...sg.querySelectorAll("button")],sl=sg.querySelector(".slider");
    bs.forEach((b,i)=>b.onclick=()=>{useful=b.dataset.u;bs.forEach(x=>x.classList.toggle("on",x===b));sl.style.opacity=1;sl.style.transform=`translateX(${i*100}%)`});
    $("#fbSend").onclick=async()=>{const t=$("#fbT").value.trim();if(!t&&!useful){toast("Escribe algo o marca si te es útil");return}
      const p=S.profile||{},msg=`[EaZy-Workout ${APP_VERSION}] Sugerencia de ${p.name||"un amigo"}\n¿Útil?: ${useful||"-"}\n${t}\n—\nObjetivos: ${(p.goals||[]).join(", ")} · ${NATIVE?"Android":"Web"} · ${real().length} sesiones`;
      if(NATIVE){const r=await shareText("Sugerencia EaZy-Workout",msg);if(r==="copied")toast("Copiado: pégalo en WhatsApp")}
      else{location.href="https://wa.me/?text="+encodeURIComponent(msg)}closeSheet()}})}
