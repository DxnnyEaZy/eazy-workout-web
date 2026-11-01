"use strict";
/* ===== Hoy ===== */
function doneOn(rid,d){return S.sessions.some(s=>s.routineId===rid&&isoDay(s.start)===isoDay(d))}
function weekStrip(){const mon=mondayOf(new Date()),today=(new Date().getDay()+6)%7;let h="";
  for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);const rs=todayList(d),main=rs.filter(r=>!r.mobility),mob=rs.filter(r=>r.mobility);
    const doneS=S.sessions.find(s=>isoDay(s.start)===isoDay(d)&&!isMob(s)),mobDone=mob.some(r=>doneOn(r.id,d));
    const c=doneS?catColor(routineById(doneS.routineId)):main[0]?catColor(main[0]):"var(--line2)",past=i<today;
    h+=`<div class="day"><div class="clip ${doneS?"done":main.length?(past?"miss":"plan"):""}" style="--c:${c}"></div>
      <div class="clip mob ${mobDone?"done":mob.length?"plan":""}" style="--c:var(--mob)"></div><span class="dl ${i===today?"today":""}">${"LMXJVSD"[i]}</span></div>`}
  return `<div class="week">${h}<span class="head" style="left:calc(${(today+.5)/7*100}% - 1px)"></span></div>`}
function heroPose(r,its){return poseSVG((its[0]||r.items[0]||{ex:"stand"}).ex)}
function tileHTML(r,{hero=false,today=false}={}){const w=planWeek(),its=routineItems(r,w),c=catColor(r),done=today&&doneOn(r.id,new Date());
  const sets=its.reduce((a,b)=>a+b.sets,0);
  return `<button class="tile rise ${hero?"hero":""}" style="--c:${c}" data-prev="${esc(r.id)}" type="button">
    <div class="pv"><span class="badge">${CATS[catOf(r)].n}${today&&r.mobility?" · mañana":""}</span>${done?`<span class="tag fill done">Hecha</span>`:""}${heroPose(r,its)}</div>
    <div class="nm"><b>${esc(r.name)}</b><small>${its.length?`${plural(its.length,"ejercicio")} · ${sets} series`:"Esta semana no toca"}</small>
    ${hero?`<div class="go"><span class="lbl">Ver la sesión</span><span class="chev">→</span></div>`:""}</div></button>`}
function viewToday(){const now=new Date(),rs=todayList(now),w=planWeek(),main=rs.filter(r=>!r.mobility),mob=rs.filter(r=>r.mobility),pend=pendingYesterday(),yk=isoDay(new Date(Date.now()-864e5));
  const recent=sorted().slice(0,3);
  view().innerHTML=`<p class="lbl">${S.profile&&S.profile.name?`Hola, ${esc(S.profile.name)} · `:""}${now.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}</p>
  <h1>${main.length?"Hoy toca":"Hoy descansas"}</h1><p class="sub">${esc(planNote(w))}</p>
  ${weekStrip()}${pend.map(r=>`<div class="card pend" style="margin-top:16px;--c:var(--warn)"><p class="lbl" style="color:var(--warn)">Pendiente de ayer · ${fmtDay(yk)}</p>
    <h3 style="margin:6px 0 14px;color:${catColor(r)}">${esc(r.name)}</h3>
    <div class="row"><button class="btn grow on" type="button" data-pd="${esc(r.id)}" data-to="0">Hacer hoy</button><button class="btn grow" type="button" data-pd="${esc(r.id)}" data-to="1">Mañana</button><button class="btn grow" type="button" data-pd="${esc(r.id)}" data-to="x">Otro día</button></div>
    <button class="btn wide ghost" type="button" data-pdskip="${esc(r.id)}" style="margin-top:8px">Dejarla (cuenta como saltada)</button></div>`).join("")}${installHint()}${demoBanner()}
  ${blockOver()?`<div class="card" style="margin-top:16px"><p class="lbl">Plan terminado</p><p style="margin:6px 0 12px">Exporta tu resumen y empieza un plan nuevo desde Ajustes.</p><button class="btn wide" id="repNow" type="button">Exportar resumen</button></div>`:""}
  <div class="tiles" style="margin-top:20px">${main.map(r=>tileHTML(r,{hero:true,today:true})).join("")}${mob.map(r=>tileHTML(r,{today:true})).join("")}
    <button class="tile rise" id="otherR" type="button" style="--c:var(--accent)"><div class="pv"><span class="badge">Elegir</span>${POSE_GRID}</div><div class="nm"><b>Otra rutina</b><small>o una sesión libre</small></div></button></div>
  <h2>Últimas sesiones</h2><div class="stack">${recent.map(sessRow).join("")||`<p class="sub">Aquí aparecerán tus entrenos.</p>`}</div>`;
  view().querySelectorAll("[data-prev]").forEach(b=>b.onclick=()=>openPreview(b.dataset.prev,isoDay(now)));
  view().querySelectorAll("[data-pd]").forEach(b=>b.onclick=()=>{const t=b.dataset.to;if(t==="x"){moveSheet(b.dataset.pd,yk);return}
    const d=new Date();d.setDate(d.getDate()+(+t));moveRoutine(b.dataset.pd,yk,isoDay(d));scheduleReminders();render();toast(t==="0"?"Movida a hoy":"Movida a mañana")});
  view().querySelectorAll("[data-pdskip]").forEach(b=>b.onclick=()=>{moveRoutine(b.dataset.pdskip,yk,null);render();toast("Marcada como saltada")});
  $("#otherR").onclick=()=>go("routines");
  const rn=$("#repNow");if(rn)rn.onclick=()=>shareText("Resumen EaZy-Workout",weeklyReport(42)).then(r=>r==="copied"&&toast("Informe copiado"));
  bindSessRows();bindDemo();
}
const POSE_GRID=`<svg class="pose" viewBox="0 0 140 110" aria-hidden="true"><rect x="40" y="25" width="26" height="26" fill="none" stroke="currentColor" stroke-width="5"/><rect x="74" y="25" width="26" height="26" fill="none" stroke="currentColor" stroke-width="5"/><rect x="40" y="59" width="26" height="26" fill="none" stroke="currentColor" stroke-width="5"/><path d="M87 62v20M77 72h20" stroke-width="5"/></svg>`;
function sessRow(s){const r=routineById(s.routineId),c=catColor(r||{items:s.items}),ex=(s.items[0]||{}).ex||"stand";
  return `<button class="tap item rise" data-sess="${esc(s.id)}" type="button" style="--c:${c}"><div class="thumb" style="width:52px;height:42px">${poseSVG(ex)}</div><div class="grow"><div class="t">${esc(s.name)} ${s.demo?`<span class="tag">Ejemplo</span>`:""}</div>
  <div class="s">${fmtDate(s.start)} · ${fmtDur(s.end-s.start)}${s.feel&&s.feel.rpe!=null?` · ${s.feel.rpe}/10`:""}</div></div><span class="chev">→</span></button>`}
function bindSessRows(){view().querySelectorAll("[data-sess]").forEach(b=>b.onclick=()=>sessionSheet(b.dataset.sess))}

/* ===== Vista previa ===== */
function openPreview(rid,day){push({render:()=>viewPreview(rid,day)})}
function viewPreview(rid,day){const r=routineById(rid);if(!r){back();return}const w=planWeek(),its=routineItems(r,w),c=catColor(r),canMove=day&&todayList(new Date(day+"T12:00:00")).includes(r)&&!S.sessions.some(s=>s.routineId===rid&&isoDay(s.start)===day);
  document.body.style.setProperty("--c",c);
  view().innerHTML=`${backBtn()}<div class="tile hero" style="--c:${c};cursor:default"><div class="pv"><span class="badge">${CATS[catOf(r)].n} · semana ${w} de ${planLen()}</span>${heroPose(r,its)}</div>
    <div class="nm"><b>${esc(r.name)}</b><small>${its.length?`${plural(its.length,"ejercicio")} · ${its.reduce((a,b)=>a+b.sets,0)} series`:"Esta semana no toca"}</small></div></div>
  <p class="lbl" style="margin-top:12px">${NATIVE?(r.notifyOff?"Sin aviso":`Aviso a las ${esc(routineTime(r))}`):""}</p>${r.note?`<p class="note" style="margin-top:10px">${esc(r.note)}</p>`:""}
  ${isDani()&&w===5&&r.test?`<p class="note" style="margin-top:8px;color:var(--tx)">${esc(r.test)}</p>`:""}
  <div class="stack" style="margin-top:16px"><button class="btn main" id="pvStart" type="button"><span>Empezar ahora</span><span>→</span></button>
  <div class="row"><button class="btn grow" id="pvLater" type="button">Recordármelo</button>${canMove?`<button class="btn grow" id="pvMove" type="button">Mover a…</button>`:""}<button class="btn grow" id="pvEdit" type="button">Editar</button></div></div>
  <div class="stack" style="margin-top:16px">${its.length?its.map(x=>{const e=exById(x.ex),T=TYPE[e.t],l=lastFor(x.ex);return `<div class="item rise"><div class="thumb">${poseSVG(x.ex)}</div>
    <div class="grow"><div class="t">${esc(e.n)}</div><div class="s" style="color:var(--c)">${x.ex==="test-partida"?"Trota hasta tener que parar":`${x.sets} × ${x.target} ${T.obj}`}${x.rest?` · ${x.ex==="test-partida"?"luego 5 min andando":x.rest+"s desc."}`:""}</div>
    ${l?`<div class="s">Última: ${l.sets.map(z=>fmtSet(e.t,z)).join(" · ")}</div>`:""}</div>${e.lumbar?`<span class="tag warn">Lumbar</span>`:""}</div>`}).join(""):`<p class="sub">Esta semana esta rutina no toca. Puedes empezarla igualmente con los valores base.</p>`}</div>
`;
  bindBack();
  $("#pvStart").onclick=e=>{e.currentTarget.classList.add("wipe");setTimeout(()=>{if(its.length)startSession(rid);else startBase(r)},220)};
  $("#pvEdit").onclick=()=>openEditor(rid);$("#pvLater").onclick=()=>laterSheet(r);if($("#pvMove"))$("#pvMove").onclick=()=>moveSheet(rid,day,true);
}

/* «Mover a…» (2.10.2): solo esa vez; la semana fija no cambia */
function moveSheet(rid,from,fromPreview){const r=routineById(rid),t0=new Date(),days=Array.from({length:7},(_,i)=>{const d=new Date(t0);d.setDate(t0.getDate()+i);return isoDay(d)}).filter(k=>k!==from);
  openSheet(`<h3>Mover ${esc(r.name)}</h3><p class="sub">Tocaba el ${new Date(from+"T12:00:00").toLocaleDateString("es-ES",{weekday:"long",day:"numeric"})}. Solo esta vez: tu semana no cambia.</p>
  <div class="row" style="margin-top:14px">${days.slice(0,2).map((k,i)=>`<button class="btn grow ${i?"":"on"}" type="button" data-mv="${k}">${k===isoDay(t0)?"Hoy":"Mañana"}</button>`).join("")}</div>
  <span class="lbl" style="display:block;margin:14px 0 8px">O elige día</span><div class="chips7">${days.map(k=>{const d=new Date(k+"T12:00:00");return `<button type="button" data-mv="${k}"><small>${d.toLocaleDateString("es-ES",{weekday:"short"})}</small><b>${d.getDate()}</b></button>`}).join("")}</div>
  <button class="btn wide" type="button" id="mvSkip" style="margin-top:12px">Dejarla (saltada)</button><button class="btn wide" id="mvCancel" type="button" style="margin-top:8px">Cancelar</button>`,()=>{
  document.querySelectorAll("#sheetRoot [data-mv]").forEach(b=>b.onclick=()=>{moveRoutine(rid,from,b.dataset.mv);closeSheet();scheduleReminders();if(fromPreview)back();render();toast(`Movida al ${fmtDay(b.dataset.mv)}`)});
  $("#mvSkip").onclick=()=>{moveRoutine(rid,from,null);closeSheet();if(fromPreview)back();render();toast("Marcada como saltada")};$("#mvCancel").onclick=closeSheet})}

/* ===== Rutinas ===== */
function viewRoutines(){const groups=["mob","str","run","box","ext"];
  view().innerHTML=`<p class="lbl">Semana ${planWeek()} de ${planLen()}</p><h1>Rutinas</h1><p class="sub">Toca una para ver qué incluye. Nada empieza hasta que pulses Empezar.</p>
  <h2>Tu semana</h2><div class="stack">${DAY_ORDER.map(d=>`<button class="tap item" data-day="${d}" type="button" style="min-height:56px"><span class="lbl" style="width:36px;color:var(--tx)">${DAYS[d]}</span>
    <div class="grow" style="display:flex;flex-wrap:wrap;gap:4px">${(S.schedule[d]||[]).map(id=>routineById(id)).filter(Boolean).map(r=>`<span class="tag fill" style="--c:${catColor(r)}">${esc(r.name)}</span>`).join("")||`<span class="s">Descanso</span>`}</div><span class="chev">→</span></button>`).join("")}</div>
  ${groups.map(g=>{const rs=S.routines.filter(r=>catOf(r)===g);return rs.length?`<h2>${CATS[g].n}</h2><div class="tiles">${rs.map(r=>tileHTML(r)).join("")}</div>`:""}).join("")}
  <div class="row" style="margin-top:16px"><button class="btn grow" id="newR" type="button">Nueva rutina</button><button class="btn grow" id="freeS" type="button">Sesión libre</button></div>`;
  view().querySelectorAll("[data-prev]").forEach(b=>b.onclick=()=>openPreview(b.dataset.prev));
  view().querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>daySheet(+b.dataset.day));
  $("#newR").onclick=()=>{const r={id:"r-"+uid(),name:"Nueva rutina",note:"",cat:"ext",items:[]};S.routines.push(r);save();openEditor(r.id)};
  $("#freeS").onclick=()=>startSession(null);
}

/* Borrar ejemplos de un toque */
function demoBanner(){const n=S.sessions.filter(s=>s.demo).length;if(!n)return "";
  return `<div class="card row" style="margin-top:16px"><div class="grow"><p class="lbl">Datos de ejemplo</p><p class="sub" style="font-size:13px">${n} sesiones de prueba mezcladas con las tuyas.</p></div><button class="btn sm" data-demodel type="button">Borrar</button></div>`}
function bindDemo(){view().querySelectorAll("[data-demodel]").forEach(b=>b.onclick=()=>{S.sessions=S.sessions.filter(s=>!s.demo);save();render();toast("Sesiones de ejemplo borradas")})}
