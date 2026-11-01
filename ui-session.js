"use strict";
/* ===== Sesión activa ===== */
function startSession(rid){const r=rid&&routineById(rid),w=planWeek();
  active={id:uid(),routineId:rid||"",name:r?r.name:"Sesión libre",note:r?r.note:"",week:w,start:Date.now(),
    items:r?routineItems(r,w).map(x=>newItem(x.ex,x.sets,x.target,x.kg,x.rest)):[]};
  saveActive();keepAwake();stack.length=0;tab="today";render();window.scrollTo(0,0)}
function newItem(ex,sets,target,kg,rest){const t=exById(ex).t,last=lastFor(ex);
  return {ex,rest:rest??60,target:target||0,sets:Array.from({length:sets||3},(_,i)=>{const p=last&&last.sets[Math.min(i,last.sets.length-1)];
    if(t==="kg")return {a:p?p.a:(kg||0),b:p?p.b:(target||10),done:false};
    if(t==="run")return {a:target||(p?p.a:4),b:"",done:false};
    if(t==="time"||t==="rounds")return {a:target||(p?p.a:30),done:false};
    return {a:p?Math.max(num(p.a),0):(target||10),done:false}})}}
function timelineHTML(){return active.items.map((it,ix)=>(ix?`<i class="gap"></i>`:"")+it.sets.map(s=>`<i class="${s.done?"done":""}"></i>`).join("")).join("")}
function sessColor(){return active?catColor(routineById(active.routineId)||{items:active.items}):"var(--accent)"}
function viewSession(){const a=active;document.body.style.setProperty("--c",sessColor());
  view().innerHTML=`<div class="sesshead"><p class="lbl">${a.week?`Semana ${a.week} · `:""}En curso</p><h1>${esc(a.name)}</h1>
  <div class="row"><span class="big" id="elapsed">${fmtClock((Date.now()-a.start)/1000)}</span><span class="grow"></span><span class="lbl" id="setCount"></span></div>
  <div class="tl" id="tl">${timelineHTML()}</div></div>
  ${a.note?`<p class="note" style="margin-top:12px">${esc(a.note)}</p>`:""}
  <div class="stack" style="margin-top:16px" id="exList">${a.items.map(exCard).join("")||`<p class="sub">Añade el primer ejercicio.</p>`}</div>
  <div class="stack" style="margin-top:16px"><button class="btn wide" id="addEx" type="button">Añadir ejercicio</button>
  <button class="btn main" id="finish" type="button"><span>Terminar entreno</span><span>→</span></button>
  <button class="btn danger wide" id="discard" type="button">Descartar sesión</button></div>`;
  bindSession();updateCount();if(tmS()&&!TM_INT)tmLoop();
}
function updateCount(){const all=active.items.flatMap(i=>i.sets),d=all.filter(s=>s.done).length;const el=$("#setCount");if(el)el.textContent=`${d}/${all.length} series`;const tl=$("#tl");if(tl)tl.innerHTML=timelineHTML()}
function exCard(it,ix){const e=exById(it.ex),T=TYPE[e.t],last=lastFor(it.ex,active.id),two=!!T.b,timed=T.timed;
  const cls=timed?(two?"timed timed2":"timed"):two?"":"one";
  return `<div class="ex rise" data-ix="${ix}"><div class="ex-h"><div class="thumb">${poseSVG(it.ex)}</div><div class="grow"><div class="n">${esc(e.n)}</div>
    ${it.ex==="test-partida"?`<div class="obj">Pulsa ▶, trota a ritmo conversacional y pulsa Parar cuando tengas que andar</div>`:it.target?`<div class="obj">Objetivo ${it.sets.length}×${it.target} ${T.obj}</div>`:""}
    <div class="last">${last?`Última (${fmtDate(last.date)}): ${last.sets.map(z=>fmtSet(e.t,z)).join(" · ")}`:"Primera vez"}</div></div>
    <div class="stack" style="align-items:flex-end;gap:4px">${e.lumbar?`<span class="tag warn">Lumbar</span>`:""}${it.rest?`<span class="tag">${it.rest}s desc.</span>`:""}</div></div>
    ${it.sets.map((s,si)=>`<div class="set ${cls} ${s.done?"done":""}" data-si="${si}"><span class="i">${si+1}</span>
      <div><input inputmode="decimal" data-f="a" value="${esc(s.a)}" aria-label="${T.a} serie ${si+1}"><div class="u">${T.a}</div></div>
      ${two?`<div><input inputmode="decimal" data-f="b" value="${esc(s.b)}" aria-label="${T.b} serie ${si+1}"><div class="u">${T.b}</div></div>`:""}
      ${timed?`<button class="play" data-play type="button" aria-label="Iniciar cuenta atrás">${ICON.play}</button>`:""}
      <button class="check" data-done type="button" aria-label="Marcar serie ${si+1}">${ICON.check}</button></div>`).join("")}
    <div class="ex-f"><button class="btn sm" data-add type="button">+ Serie</button><button class="btn sm" data-rm type="button">− Serie</button><span class="grow"></span><button class="btn sm" data-del type="button">Quitar</button></div></div>`}
function markDone(it,s,row,on){s.done=on;row.classList.toggle("done",on);saveActive();updateCount();if(on)scrollNext(row);
  if(on){haptic();const next=nextLabel(it);if(it.rest&&next)tmStart([{k:"r",sec:it.rest,lbl:"Descanso",nx:next}],false)}}
function nextLabel(it){const i=active.items.indexOf(it),rest=it.sets.some(s=>!s.done);if(rest)return exById(it.ex).n;const n=active.items.slice(i+1).find(x=>x.sets.some(z=>!z.done));return n?exById(n.ex).n:""}
function bindSession(){
  $("#elapsed")&&0;
  view().querySelectorAll(".ex").forEach(card=>{const ix=+card.dataset.ix,it=active.items[ix],e=exById(it.ex);
    card.querySelectorAll(".set").forEach(row=>{const si=+row.dataset.si,s=it.sets[si];
      row.querySelectorAll("input").forEach(inp=>{inp.oninput=()=>{s[inp.dataset.f]=inp.value;saveActive()};inp.onfocus=()=>setTimeout(()=>inp.select(),0)});
      row.querySelector("[data-done]").onclick=()=>{unlockAudio();markDone(it,s,row,!s.done)};
      const pl=row.querySelector("[data-play]");if(pl&&it.ex==="test-partida")pl.onclick=()=>startStopwatch(ix,si);
        else if(pl)pl.onclick=()=>{if(!(TYPE[e.t].sec(num(s.a))>0)){toast("Pon la duración primero");return}tmStart(buildChain(ix,si),true)}});
    card.querySelector("[data-add]").onclick=()=>{const l=it.sets[it.sets.length-1]||{a:it.target||0,b:""};it.sets.push({a:l.a,b:l.b,done:false});saveActive();viewSession()};
    card.querySelector("[data-rm]").onclick=()=>{const i=it.sets.map(s=>s.done).lastIndexOf(false);if(i<0||it.sets.length<2){toast("No quedan series sin hacer que quitar");return}it.sets.splice(i,1);saveActive();viewSession()};
    card.querySelector("[data-del]").onclick=()=>confirmSheet(`¿Quitar ${e.n}?`,it.sets.some(s=>s.done)?"Tiene series hechas; se perderán de esta sesión.":"Se quita solo de esta sesión.","Quitar",()=>{active.items.splice(ix,1);saveActive();viewSession()})});
  $("#addEx").onclick=()=>picker(ex=>{active.items.push(newItem(ex,3,0,0,60));saveActive();viewSession()});
  $("#finish").onclick=finishFlow;
  $("#discard").onclick=()=>confirmSheet("¿Descartar la sesión?","No se guardará nada de este entreno.","Descartar",()=>{stopTimer();active=null;saveActive();allowSleep();render()});
}

/* una mano (2.10.3): tras marcar una serie, la siguiente pendiente queda a la vista sin hacer scroll */
function scrollNext(row){const rows=[...view().querySelectorAll(".set")],i=rows.indexOf(row),n=rows.slice(i+1).find(x=>!x.classList.contains("done"));
  if(n){const rc=n.getBoundingClientRect(),limit=window.innerHeight-(document.body.classList.contains("timer-on")?260:150);if(rc.bottom>limit)window.scrollBy({top:rc.bottom-limit+40,behavior:"smooth"})}}

/* ===== Temporizador (2.10.1): pasos encadenados, guardados en la sesión =====
   active.tm = {fs, steps:[{k:"w"|"r",ix,si,sec,lbl,nx}], i, end, paused} · o {fs:true,up:true,start,ix,si} para el cronómetro.
   Cada paso termina en end = fin del anterior + su duración, así al volver de la pantalla bloqueada se ponen al día solos. */
let TM_INT=null,TM_BEEP=null;
const tmS=()=>active&&active.tm;
const setLbl=(e,it,si)=>`${e.n}${it.sets.length>1?` · ${e.t==="rounds"?"round":"serie"} ${si+1} de ${it.sets.length}`:""}`;
/* pasos desde la serie (ix,si): sus series con tiempo pendientes y las de los ejercicios con tiempo que siguen; sin descanso al final */
function buildChain(ix,si){const steps=[];
  for(let i=ix;i<active.items.length;i++){const it=active.items[i],e=exById(it.ex),T=TYPE[e.t];if(!T.timed||it.ex==="test-partida")break;
    it.sets.forEach((s,j)=>{if((i===ix&&j<si)||s.done)return;const sec=T.sec(num(s.a));if(sec>0)steps.push({k:"w",ix:i,si:j,sec,lbl:setLbl(e,it,j)},{k:"r",sec:it.rest||0,lbl:"Descanso"})})}
  while(steps.length&&steps[steps.length-1].k==="r")steps.pop();
  const out=steps.filter(x=>x.sec>0);out.forEach((x,i)=>{const n=out.slice(i+1).find(y=>y.k==="w");x.nx=n?n.lbl:""});return out}
function tmStart(steps,fs){if(!steps.length)return;unlockAudio();TM_BEEP=null;active.tm={fs,steps,i:0,end:Date.now()+steps[0].sec*1000,paused:null};saveActive();
  cue(steps[0].k==="w"?"work":"rest");tmSchedule();tmLoop()}
function tmLoop(){clearInterval(TM_INT);TM_INT=setInterval(tmTick,200);tmTick()}
function tmTick(){const t=tmS();if(!t){clearInterval(TM_INT);TM_INT=null;tmHide();return}
  if(t.up){tmDraw(t,(Date.now()-t.start)/1000);return}
  if(t.paused!=null){tmDraw(t,t.paused);return}
  let left=(t.end-Date.now())/1000;
  while(left<=0){const late=left<-1.5;tmNext(t,late);if(!tmS())return;left=(t.end-Date.now())/1000}
  const vis=document.visibilityState==="visible",whole=Math.ceil(left);
  if(vis&&whole!==TM_BEEP&&(whole===10||whole<=3)&&t.steps[t.i].sec>whole){TM_BEEP=whole;cue(whole===10?"ten":"count")}
  if(vis&&left<0.7)cancelTimerNotif(t.i);
  tmDraw(t,left)}
/* fin del paso actual; late = ya pasó hace rato (la app estaba en segundo plano): sin sonido */
function tmNext(t,late){const st=t.steps[t.i];
  if(st.k==="w"){const it=active.items[st.ix],s=it&&it.sets[st.si];if(s&&!s.done){s.done=true;rowDone(st.ix,st.si)}}
  t.i++;TM_BEEP=null;
  if(t.i>=t.steps.length){active.tm=null;saveActive();if(!late)cue("end");tmHide();updateCount();return}
  t.end+=t.steps[t.i].sec*1000;saveActive();updateCount();if(!late)cue(t.steps[t.i].k==="w"?"work":"rest")}
function rowDone(ix,si){const r=view().querySelector(`.ex[data-ix="${ix}"] .set[data-si="${si}"]`);if(r)r.classList.add("done")}
/* avisos nativos de todos los pasos que quedan (suenan con la pantalla bloqueada) */
function tmSchedule(){const t=tmS();cancelTimerNotifs();if(!t||t.up||t.paused!=null)return;let at=t.end;const list=[];
  for(let i=t.i;i<t.steps.length;i++){if(i>t.i)at+=t.steps[i].sec*1000;const st=t.steps[i],nx=t.steps[i+1];
    list.push({k:i,at,title:!nx?"Hecho":nx.k==="w"?`¡Vamos! ${nx.lbl}`:`Descanso ${fmtClock(nx.sec)}`,body:!nx?`${st.lbl}: terminado.`:nx.k==="r"&&nx.nx?`Luego: ${nx.nx}`:st.lbl})}
  scheduleTimerNotifs(list)}
function tmPause(){const t=tmS();if(!t||t.up)return;if(t.paused==null)t.paused=Math.max(0,(t.end-Date.now())/1000);else{t.end=Date.now()+t.paused*1000;t.paused=null}
  haptic();saveActive();tmSchedule();tmTick()}
function tmSkip(){const t=tmS();if(!t)return;if(t.up){stopTimer();return}t.paused=null;t.end=Date.now();tmNext(t,false);if(tmS()){tmSchedule();tmTick()}}
function tmDraw(t,left){const st=t.up?null:t.steps[t.i],clock=fmtClock(Math.max(0,t.up?Math.floor(left):Math.ceil(left)));
  if(t.fs){const fs=$("#fs");fs.hidden=false;document.body.classList.add("fs-on");fs.classList.toggle("rest",!t.up&&st.k==="r");fs.classList.toggle("paused",t.paused!=null);
    $("#fsClock").textContent=clock;
    $("#fsLbl").textContent=t.up?"Cronómetro":st.k==="w"?st.lbl:"Descanso";
    $("#fsHint").textContent=t.up?"":t.paused!=null?"En pausa · toca para seguir":st.k==="r"&&st.nx?`${st.nx} empieza solo`:"Toca en cualquier sitio para pausar";
    $("#fsNext").textContent=t.up?"Mantén «parar» 1 s al terminar":st.nx?`Después: ${st.k==="w"?"descanso → ":""}${st.nx}`:"Último";
    $("#fsSkip").textContent=t.up?"Mantén: parar":"Mantén: saltar";
    $("#fsBar").style.width=t.up?"0":`${Math.min(100,(1-left/st.sec)*100)}%`;$("#timer").hidden=true;document.body.classList.remove("timer-on");return}
  $("#fs").hidden=true;document.body.classList.remove("fs-on");
  const tm=$("#timer");tm.hidden=false;document.body.classList.add("timer-on");
  $("#timerLbl").textContent=st.lbl+(st.nx?` · ${st.nx}`:"");$("#timerClock").textContent=clock;$("#timerBar").style.width=`${Math.min(100,(1-left/st.sec)*100)}%`}
function tmHide(){$("#fs").hidden=true;$("#timer").hidden=true;document.body.classList.remove("fs-on","timer-on")}
function startStopwatch(ix,si){unlockAudio();active.tm={fs:true,up:true,start:Date.now(),ix,si};saveActive();cue("work");tmLoop()}
/* para el cronómetro (guarda los minutos) o corta lo que esté en marcha sin contar el paso actual */
function stopTimer(){const t=tmS();clearInterval(TM_INT);TM_INT=null;cancelTimerNotifs();
  if(t&&t.up){const min=Math.round((Date.now()-t.start)/600)/100,it=active.items[t.ix],s=it&&it.sets[t.si];active.tm=null;
    if(s){s.a=min;s.done=true}saveActive();cue("end");tmHide();viewSession();return}
  if(active){active.tm=null;saveActive()}tmHide();if(active&&$("#setCount"))updateCount()}
function shiftTimer(d){const t=tmS();if(!t||t.up||t.paused!=null)return;t.end+=d*1000;t.steps[t.i].sec=Math.max(1,t.steps[t.i].sec+d);saveActive();tmSchedule();tmTick()}
function resumeTimer(){if(tmS())tmLoop()}
/* mantener pulsado 1 s (vale con guantes y evita saltos por un golpe) */
function holdBtn(el,fn){let h=null;const off=()=>{clearTimeout(h);h=null;el.classList.remove("holding")};
  el.addEventListener("pointerdown",e=>{e.stopPropagation();el.classList.add("holding");h=setTimeout(()=>{off();haptic("heavy");fn()},1000)});
  ["pointerup","pointerleave","pointercancel"].forEach(ev=>el.addEventListener(ev,e=>{e.stopPropagation();off()}));
  el.addEventListener("click",e=>e.stopPropagation())}

/* ===== Terminar: sensaciones y resumen ===== */
function scaleHTML(id,from,val){return `<div class="scale" id="${id}">${Array.from({length:11},(_,i)=>i).filter(i=>i>=from).map(i=>`<button type="button" data-v="${i}" class="${val===i?"on":""}">${i}</button>`).join("")}</div>`}
function finishFlow(){const done=active.items.some(i=>i.sets.some(s=>s.done));if(!done){toast("Marca al menos una serie antes de terminar");return}
  const r=routineById(active.routineId);if(r&&r.mobility)return quickFinish();fullFinish()}
/* movilidad (2.10.3): un toque guarda; «Más detalle» abre las escalas */
function quickFinish(){openSheet(`<h3>¿Qué tal?</h3><div class="big3" style="margin-top:16px">${[["mal","Mal","☹"],["normal","Normal","–"],["bien","Bien","☺"]].map(([k,n,ic])=>`<button class="btn" type="button" data-mood="${k}"><b>${ic}</b>${n}</button>`).join("")}</div>
  <button class="btn wide ghost" id="fMore" type="button" style="margin-top:8px">Más detalle (molestias, nota)</button>`,()=>{
  document.querySelectorAll("#sheetRoot [data-mood]").forEach(b=>b.onclick=()=>saveSession({rpe:null,zones:{},note:"",mood:b.dataset.mood}));$("#fMore").onclick=fullFinish})}
function fullFinish(){
  const f={rpe:null,zones:{},note:""},Z=(S.profile&&S.profile.zones)||[];
  openSheet(`<h3>¿Cómo ha ido?</h3><p class="sub">Esto va en el informe semanal para ajustar el plan.</p>
  <div class="stack" style="margin-top:16px"><span class="lbl">Sensación general (1 muy fácil · 10 al límite)</span>${scaleHTML("fRpe",1,null)}
  ${Z.map(z=>`<span class="lbl">Molestia ${esc(z.n.toLowerCase())} (0 nada · 10 fuerte)</span>${scaleHTML("fz-"+z.id,0,null)}`).join("")}
  <label class="f"><span class="lbl">Nota (qué costó, qué notaste)</span><textarea id="fNote" placeholder="Opcional"></textarea></label>
  <button class="btn main" id="fSave" type="button"><span>Guardar entreno</span><span>→</span></button></div>`,()=>{
    const pickers=[["#fRpe",v=>f.rpe=v],...Z.map(z=>["#fz-"+z.id,v=>f.zones[z.id]=v])];
    pickers.forEach(([id,setv])=>$(id).querySelectorAll("button").forEach(b=>b.onclick=()=>{setv(+b.dataset.v);$(id).querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b))}));
    $("#fNote").oninput=e=>f.note=e.target.value;$("#fSave").onclick=()=>saveSession(f)})}
function saveSession(feel){const a=active,prev=prMap();
  const items=a.items.map(i=>({ex:i.ex,sets:i.sets.filter(s=>s.done).map(s=>({a:num(s.a),b:s.b===""||s.b==null?"":num(s.b),done:true}))})).filter(i=>i.sets.length);
  const sess={id:a.id,routineId:a.routineId,name:a.name,week:a.week,start:a.start,end:Date.now(),items,feel};
  const prs=items.map(i=>{const e=exById(i.ex),b=best(e.t,i.sets),p=prev[i.ex];return (!p||b>p.v)&&b>0?{n:e.n,v:b,u:TYPE[e.t].best,old:p?p.v:null}:null}).filter(Boolean);
  stopTimer();S.sessions.push(sess);save();active=null;saveActive();allowSleep();haptic("heavy");autoBackup(true);
  const sets=items.reduce((n,i)=>n+i.sets.length,0),v=volume(sess);
  openSheet(`<p class="lbl acc">Guardado</p><h3>${esc(sess.name)}</h3><div class="stats" style="margin:16px 0">
    <div class="stat"><div class="v">${Math.round((sess.end-sess.start)/60000)}</div><div class="lbl">minutos</div></div>
    <div class="stat"><div class="v">${sets}</div><div class="lbl">series</div></div>
    <div class="stat"><div class="v">${v?v.toLocaleString("es-ES"):prs.length}</div><div class="lbl">${v?"kg volumen":"récords"}</div></div></div>
    <span class="lbl">Récords nuevos</span><div class="stack" style="margin-top:8px">${prs.length?prs.map(p=>`<div class="item rise"><div class="grow"><div class="t">${esc(p.n)}</div><div class="s">${p.old!=null?`antes ${p.old} ${p.u}`:"primera marca"}</div></div><span class="tag good">${p.v} ${p.u}</span></div>`).join(""):`<p class="sub">Sin récords esta vez.</p>`}</div>
    <button class="btn main" style="margin-top:20px" id="ok" type="button"><span>Listo</span><span>→</span></button>`,()=>{$("#ok").onclick=()=>{closeSheet();render()}});
}

/* ===== Ver y corregir una sesión guardada ===== */
function sessionSheet(id){const s=S.sessions.find(x=>x.id===id);if(!s)return;const f=s.feel||{};
  openSheet(`<p class="lbl">${new Date(s.start).toLocaleString("es-ES",{weekday:"long",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}${s.demo?" · ejemplo":""}</p><h3>${esc(s.name)}</h3>
  <p class="sub">${fmtDur(s.end-s.start)}${f.rpe!=null?` · sensación ${f.rpe}/10`:""}${((S.profile&&S.profile.zones)||[]).map(z=>zoneVal(f,z.id)!=null?` · ${z.n.toLowerCase()} ${zoneVal(f,z.id)}`:"").join("")}</p>
  <div class="stack" style="margin-top:16px">${s.items.map((i,ix)=>{const e=exById(i.ex),T=TYPE[e.t];return `<div class="card"><div class="t" style="font-weight:500">${esc(e.n)}</div>
    <div class="row" style="flex-wrap:wrap;margin-top:8px">${i.sets.map((z,si)=>`<input class="num" style="width:${T.b&&e.t==="kg"?"64px":"72px"};min-height:40px;text-align:center" data-e="${ix}.${si}.a" value="${esc(z.a)}" aria-label="${T.a}">${e.t==="kg"?`<input class="num" style="width:56px;min-height:40px;text-align:center" data-e="${ix}.${si}.b" value="${esc(z.b)}" aria-label="reps">`:""}`).join("")}</div><div class="u" style="text-align:left">${T.a}${e.t==="kg"?" × reps":""}</div></div>`}).join("")}</div>
  ${f.note?`<p class="note" style="margin-top:12px">${esc(f.note)}</p>`:""}
  <div class="stack" style="margin-top:16px"><button class="btn main" id="sSave" type="button"><span>Guardar cambios</span><span>→</span></button>
  <button class="btn danger wide" id="sDel" type="button">Borrar sesión</button></div>`,()=>{
    $("#sSave").onclick=()=>{document.querySelectorAll("[data-e]").forEach(inp=>{const [ix,si,k]=inp.dataset.e.split(".");s.items[+ix].sets[+si][k]=num(inp.value)});save();closeSheet();render();toast("Sesión corregida")};
    $("#sDel").onclick=()=>confirmSheet("¿Borrar esta sesión?","Se elimina del historial, los récords y el calendario.","Borrar",()=>{S.sessions=S.sessions.filter(x=>x.id!==id);save();render();toast("Sesión borrada")})})}

/* ===== Selector de ejercicios ===== */
function picker(cb){let g="Todos",q="";
  const draw=()=>{const l=allEx().filter(e=>(g==="Todos"||e.g===g)&&e.n.toLowerCase().includes(q.toLowerCase()));
    $("#pkList").innerHTML=l.map(e=>`<button class="tap item" data-pk="${esc(e.id)}" type="button"><div class="grow"><div class="t">${esc(e.n)}</div><div class="s">${esc(e.g)} · ${TYPE[e.t].a}${TYPE[e.t].b?" + "+TYPE[e.t].b:""}</div></div>${e.lumbar?`<span class="tag warn">Lumbar</span>`:""}</button>`).join("")||`<p class="sub">No hay ninguno con ese nombre. Créalo abajo.</p>`;
    document.querySelectorAll("[data-pk]").forEach(b=>b.onclick=()=>{closeSheet();cb(b.dataset.pk)})};
  const opts=GROUPS.concat("Otros").map(x=>`<option>${x}</option>`).join("");
  openSheet(`<h3>Añadir ejercicio</h3><div class="stack" style="margin-top:12px"><input id="pkQ" placeholder="Buscar" autocomplete="off"><select id="pkG"><option>Todos</option>${opts}</select>
    <div class="stack" id="pkList" style="max-height:40vh;overflow:auto"></div>
    <span class="lbl" style="margin-top:12px">Ejercicio propio</span><input id="nwN" placeholder="Nombre">
    <div class="row"><select id="nwG" class="grow">${opts}</select><select id="nwT" class="grow"><option value="reps">Repeticiones</option><option value="time">Tiempo (seg)</option><option value="run">Carrera (min)</option><option value="rounds">Rounds (min)</option><option value="kg">Peso × reps</option></select></div>
    <button class="btn wide" id="nwAdd" type="button">Crear y añadir</button></div>`,()=>{
    $("#pkQ").oninput=e=>{q=e.target.value;draw()};$("#pkG").onchange=e=>{g=e.target.value;draw()};draw();
    $("#nwAdd").onclick=()=>{const n=$("#nwN").value.trim();if(!n){toast("Ponle un nombre");return}
      const e={id:"c-"+uid(),n,g:$("#nwG").value,t:$("#nwT").value,lumbar:false};S.custom.push(e);save();closeSheet();cb(e.id)}})}
