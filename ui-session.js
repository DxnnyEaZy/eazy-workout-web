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
  bindSession();updateCount();
}
function updateCount(){const all=active.items.flatMap(i=>i.sets),d=all.filter(s=>s.done).length;const el=$("#setCount");if(el)el.textContent=`${d}/${all.length} series`;const tl=$("#tl");if(tl)tl.innerHTML=timelineHTML()}
function exCard(it,ix){const e=exById(it.ex),T=TYPE[e.t],last=lastFor(it.ex,active.id),two=!!T.b,timed=T.timed;
  const cls=timed?"timed":two?"":"one";
  return `<div class="ex rise" data-ix="${ix}"><div class="ex-h"><div class="thumb">${poseSVG(it.ex)}</div><div class="grow"><div class="n">${esc(e.n)}</div>
    ${it.ex==="test-partida"?`<div class="obj">Pulsa ▶, trota a ritmo conversacional y pulsa Parar cuando tengas que andar</div>`:it.target?`<div class="obj">Objetivo ${it.sets.length}×${it.target} ${T.obj}</div>`:""}
    <div class="last">${last?`Última (${fmtDate(last.date)}): ${last.sets.map(z=>fmtSet(e.t,z)).join(" · ")}`:"Primera vez"}</div></div>
    <div class="stack" style="align-items:flex-end;gap:4px">${e.lumbar?`<span class="tag warn">Lumbar</span>`:""}${it.rest?`<span class="tag">${it.rest}s desc.</span>`:""}</div></div>
    ${it.sets.map((s,si)=>`<div class="set ${cls} ${s.done?"done":""}" data-si="${si}"><span class="i">${si+1}</span>
      <div><input inputmode="decimal" data-f="a" value="${esc(s.a)}" aria-label="${T.a} serie ${si+1}"><div class="u">${T.a}</div></div>
      ${two&&!timed?`<div><input inputmode="decimal" data-f="b" value="${esc(s.b)}" aria-label="${T.b} serie ${si+1}"><div class="u">${T.b}</div></div>`:""}
      ${timed?`<button class="play" data-play type="button" aria-label="Iniciar cuenta atrás">${ICON.play}</button>`:""}
      <button class="check" data-done type="button" aria-label="Marcar serie ${si+1}">${ICON.check}</button></div>`).join("")}
    <div class="ex-f"><button class="btn sm" data-add type="button">+ Serie</button><button class="btn sm" data-rm type="button">− Serie</button><span class="grow"></span><button class="btn sm" data-del type="button">Quitar</button></div></div>`}
function markDone(it,s,row,on){s.done=on;row.classList.toggle("done",on);saveActive();updateCount();
  if(on){haptic();if(it.rest){const next=nextLabel(it);startTimer("rest",it.rest,`Descanso · ${next}`)}}}
function nextLabel(it){const i=active.items.indexOf(it),rest=it.sets.some(s=>!s.done);if(rest)return exById(it.ex).n;const n=active.items[i+1];return n?exById(n.ex).n:"última serie"}
function bindSession(){
  $("#elapsed")&&0;
  view().querySelectorAll(".ex").forEach(card=>{const ix=+card.dataset.ix,it=active.items[ix],e=exById(it.ex);
    card.querySelectorAll(".set").forEach(row=>{const si=+row.dataset.si,s=it.sets[si];
      row.querySelectorAll("input").forEach(inp=>inp.onchange=()=>{s[inp.dataset.f]=inp.value;saveActive()});
      row.querySelector("[data-done]").onclick=()=>{unlockAudio();markDone(it,s,row,!s.done)};
      const pl=row.querySelector("[data-play]");if(pl&&it.ex==="test-partida")pl.onclick=()=>{unlockAudio();startStopwatch(`${e.n}`,min=>{if(!active)return;s.a=min;const inp=row.querySelector("input");if(inp)inp.value=min;markDone(it,s,row,true)})};else if(pl)pl.onclick=()=>{unlockAudio();const sec=TYPE[e.t].sec(num(s.a));if(!sec){toast("Pon la duración primero");return}
        startTimer("work",sec,`${e.n} · serie ${si+1}`,()=>{const r2=view().querySelector(`.ex[data-ix="${ix}"] .set[data-si="${si}"]`);if(r2)markDone(it,s,r2,true);else{s.done=true;saveActive()}})}});
    card.querySelector("[data-add]").onclick=()=>{const l=it.sets[it.sets.length-1]||{a:it.target||0,b:""};it.sets.push({a:l.a,b:l.b,done:false});saveActive();viewSession()};
    card.querySelector("[data-rm]").onclick=()=>{const i=it.sets.map(s=>s.done).lastIndexOf(false);if(i<0||it.sets.length<2){toast("No quedan series sin hacer que quitar");return}it.sets.splice(i,1);saveActive();viewSession()};
    card.querySelector("[data-del]").onclick=()=>confirmSheet(`¿Quitar ${e.n}?`,it.sets.some(s=>s.done)?"Tiene series hechas; se perderán de esta sesión.":"Se quita solo de esta sesión.","Quitar",()=>{active.items.splice(ix,1);saveActive();viewSession()})});
  $("#addEx").onclick=()=>picker(ex=>{active.items.push(newItem(ex,3,0,0,60));saveActive();viewSession()});
  $("#finish").onclick=finishFlow;
  $("#discard").onclick=()=>confirmSheet("¿Descartar la sesión?","No se guardará nada de este entreno.","Descartar",()=>{active=null;saveActive();stopTimer();render()});
}

/* ===== Temporizador: descanso o trabajo ===== */
const TM={mode:null,end:0,total:0,int:null,onDone:null,label:""};
function startTimer(mode,sec,label,onDone){TM.mode=mode;TM.total=sec;TM.end=Date.now()+sec*1000;TM.onDone=onDone||null;TM.label=label;
  $("#timer").hidden=false;$("#timer").classList.toggle("work",mode==="work");$("#timerLbl").textContent=label;document.body.classList.add("timer-on");
  scheduleTimerNotif(sec,mode==="work"?"Tiempo":"Descanso terminado",mode==="work"?`${label}: hecho.`:`Siguiente: ${label.replace(/^Descanso · /,"")}`);
  clearInterval(TM.int);TM.int=setInterval(tick,200);tick()}
function tick(){const left=(TM.end-Date.now())/1000;$("#timerClock").textContent=fmtClock(Math.ceil(left));$("#timerBar").style.width=`${Math.min(100,(1-left/TM.total)*100)}%`;
  if(left<=0){clearInterval(TM.int);TM.int=null;if(document.visibilityState==="visible"){cancelTimerNotif();bell();haptic("heavy")}
    const cb=TM.onDone;TM.onDone=null;$("#timerLbl").textContent=TM.mode==="work"?"Hecho":"A por la siguiente";
    setTimeout(()=>{if(!TM.int)hideTimer()},1800);cb&&cb()}}
function startStopwatch(label,onStop){clearInterval(TM.int);TM.mode="up";TM.end=Date.now();TM.total=0;TM.label=label;TM.onDone=null;TM.onStop=onStop;
  const t=$("#timer");t.hidden=false;t.classList.add("work");$("#timerLbl").textContent=label+" · cronómetro";document.body.classList.add("timer-on");
  $("#tMinus").hidden=$("#tPlus").hidden=true;$("#tSkip").textContent="Parar";$("#timerBar").style.width="0";
  TM.int=setInterval(()=>{$("#timerClock").textContent=fmtClock((Date.now()-TM.end)/1000)},250)}
function hideTimer(){$("#tMinus").hidden=$("#tPlus").hidden=false;$("#tSkip").textContent="Saltar";$("#timer").hidden=true;document.body.classList.remove("timer-on")}
function stopTimer(){if(TM.mode==="up"&&TM.onStop){const min=Math.round((Date.now()-TM.end)/6000)/10,cb=TM.onStop;TM.onStop=null;clearInterval(TM.int);TM.int=null;TM.mode=null;hideTimer();cb(min);return}clearInterval(TM.int);TM.int=null;TM.onDone=null;cancelTimerNotif();hideTimer()}
function shiftTimer(d){if(!TM.int||TM.mode==="up")return;TM.end+=d*1000;TM.total=Math.max(1,TM.total+d);const left=Math.max(1,Math.round((TM.end-Date.now())/1000));
  scheduleTimerNotif(left,TM.mode==="work"?"Tiempo":"Descanso terminado",TM.label);tick()}
function resumeTimer(){if(TM.int&&TM.mode!=="up")tick()}

/* ===== Terminar: sensaciones y resumen ===== */
function scaleHTML(id,from,val){return `<div class="scale" id="${id}">${Array.from({length:11},(_,i)=>i).filter(i=>i>=from).map(i=>`<button type="button" data-v="${i}" class="${val===i?"on":""}">${i}</button>`).join("")}</div>`}
function finishFlow(){const done=active.items.some(i=>i.sets.some(s=>s.done));if(!done){toast("Marca al menos una serie antes de terminar");return}
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
  S.sessions.push(sess);save();active=null;saveActive();stopTimer();haptic("heavy");
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
