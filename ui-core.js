"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const view=()=>$("#view");
const ICON={check:`<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,play:`<svg viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z"/></svg>`};
const fmtDate=ms=>new Date(ms).toLocaleDateString("es-ES",{day:"numeric",month:"short"});
const fmtDur=ms=>{const m=Math.round(ms/60000);return m>=60?`${Math.floor(m/60)} h ${m%60} min`:`${m} min`};
const fmtClock=s=>{s=Math.max(0,Math.round(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`};
const plural=(n,w)=>`${n} ${w}${n===1?"":"s"}`;
function toast(msg){const r=$("#toastRoot");r.innerHTML=`<div class="toast" role="status">${esc(msg)}</div>`;clearTimeout(toast.t);toast.t=setTimeout(()=>r.innerHTML="",2600)}

/* hoja inferior y confirmaciones dentro de la app */
function openSheet(html,mount){$("#sheetRoot").innerHTML=`<div class="scrim" id="scrim"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  $("#scrim").addEventListener("click",e=>{if(e.target.id==="scrim")closeSheet()});mount&&mount()}
function closeSheet(){$("#sheetRoot").innerHTML=""}
function confirmSheet(title,body,yes,onYes,danger=true){openSheet(`<h3>${esc(title)}</h3><p class="sub">${esc(body)}</p>
  <div class="row" style="margin-top:20px"><button class="btn grow" id="cfNo" type="button">Cancelar</button><button class="btn ${danger?"danger":""} grow" id="cfYes" type="button">${esc(yes)}</button></div>`,()=>{
  $("#cfNo").onclick=closeSheet;$("#cfYes").onclick=()=>{closeSheet();onYes()}})}

/* router: pestañas + pantallas apiladas (vista previa, editor) */
let tab="today";const stack=[];
const TABS=["today","routines","progress","calendar"];
function render(){const i=TABS.indexOf(tab);
  document.querySelectorAll(".navbtn").forEach(b=>b.setAttribute("aria-current",b.dataset.tab===tab?"page":"false"));
  $("#navInd").style.transform=`translateX(${i*100}%)`;
  const w=planWeek();$("#hdrSub").textContent=blockOver()?"Plan terminado":planNote(w).split(".")[0];$("#hdrWk").textContent=w;$("#hdrLen").textContent="/"+planLen();
  document.body.style.removeProperty("--c");const top=stack[stack.length-1];
  if(top)return top.render();
  if(tab==="today"&&active)return viewSession();
  ({today:viewToday,routines:viewRoutines,progress:viewProgress,calendar:viewCalendar})[tab]();
}
function push(screen){stack.push(screen);render();window.scrollTo(0,0)}
function back(){if($("#sheetRoot").innerHTML){closeSheet();return true}if(stack.length){stack.pop();render();return true}if(tab!=="today"){go("today");return true}return false}
function go(t){stack.length=0;tab=t;render();window.scrollTo(0,0)}
function softRender(){if($("#sheetRoot").innerHTML)return;if(tab==="today"&&active&&!stack.length)return;render()}
const backBtn=label=>`<button class="btn sm" id="back" type="button" style="margin-bottom:8px">‹ ${esc(label||"Volver")}</button>`;
function bindBack(){const b=$("#back");if(b)b.onclick=back}

/* ajustes */
function settingsSheet(){const st=S.settings,w=planWeek(),demoN=S.sessions.filter(s=>s.demo).length;
  const pr=S.profile||{zones:[]};
  openSheet(`<h3>Ajustes</h3>
  <div class="stack" style="margin-top:16px">
    <button class="btn main" id="stFb" type="button" style="--c:#25D366"><span>Enviar sugerencia</span><span>→</span></button>
    ${NATIVE?"":`<p class="note" style="margin-top:8px">En la versión web (iPhone) no hay avisos con el móvil bloqueado: los temporizadores suenan mientras tengas la app abierta.</p>`}
    <div ${NATIVE?"":"hidden"} class="stack"><span class="lbl" style="margin-top:8px">Avisos de cada día</span><p class="sub" style="font-size:12px">A esta hora te avisa de lo que toca ese día.</p>
    <div class="seg" id="segR" style="grid-template-columns:repeat(2,1fr)"><span class="slider" style="width:50%"></span>
      <button type="button" data-r="1" class="${st.remindOn?"on":""}">Activados</button><button type="button" data-r="0" class="${st.remindOn?"":"on"}">Apagados</button></div>
    <div class="row"><label class="f grow"><span class="lbl">Hora movilidad</span><input type="time" id="stMorning" value="${esc(st.morningTime)}"></label>
      <label class="f grow"><span class="lbl">Hora entreno</span><input type="time" id="stRemind" value="${esc(st.remindTime)}"></label></div></div>
    <label class="f"><span class="lbl">Tu nombre</span><input id="stName" value="${esc(pr.name||"")}"></label>
    <span class="lbl">Molestias que vigilo</span>
    <div class="row" style="flex-wrap:wrap">${ZONE_OPTS.map(([k,n])=>`<button type="button" class="btn sm ${pr.zones.some(z=>z.id===k)?"on-z":""}" data-zone="${k}">${n}</button>`).join("")}</div>
    <span class="lbl">Semana del plan</span>
    <div class="seg" id="segW" style="grid-template-columns:repeat(${planLen()+1},1fr)"><span class="slider" style="width:calc(${100/(planLen()+1)}% - 1px)"></span>
      ${["Auto",...Array.from({length:planLen()},(_,i)=>i+1)].map((x,i)=>`<button type="button" data-w="${i}" class="${(st.weekOverride||0)===i?"on":""}">${i?"S"+x:x}</button>`).join("")}</div>
    <p class="sub" style="font-size:12px">Auto calcula la semana desde el inicio del plan. Ahora mismo: S${w}.</p>
    <span class="lbl">Duración del plan</span><div class="row">${[4,5,6,8].map(n=>`<button type="button" class="btn sm grow ${planLen()===n?"on-z":""}" data-len="${n}">${n} sem</button>`).join("")}</div>
    <label class="f"><span class="lbl">Inicio del plan (lunes de la semana 1)</span><input type="date" id="stStart" value="${esc(st.planStart)}"></label>
    <span class="lbl" style="margin-top:8px">Tus datos</span>
    <button class="btn wide" id="stReport" type="button">Exportar resumen semanal</button>
    <button class="btn wide" id="stExport" type="button">Exportar copia completa (.json)</button>
    <button class="btn wide" id="stImport" type="button">Importar copia</button>
    <button class="btn wide" id="stDemo" type="button" ${demoN?"":"disabled"}>Borrar datos de ejemplo (${demoN})</button>
    ${NATIVE?`<button class="btn wide" id="stTest" type="button">Probar notificación en 5 s</button>`:""}
    <button class="btn wide" id="stRedo" type="button">Volver a configurar mi plan</button>
    <p class="lbl" style="text-align:center;margin-top:8px">EaZy-Workout ${APP_VERSION} · Dxnny</p>
    <button class="btn wide" id="stClose" type="button" style="margin-top:8px">Cerrar</button>
  </div>`,()=>{
    const seg=(id,attr,get)=>{const el=$(id),btns=[...el.querySelectorAll("button")],sl=el.querySelector(".slider");
      const place=()=>{const i=btns.findIndex(b=>b.classList.contains("on"));sl.style.transform=`translateX(${i*100}%)`};place();
      btns.forEach(b=>b.onclick=()=>{btns.forEach(x=>x.classList.toggle("on",x===b));place();get(b.getAttribute(attr))})};
    seg("#segW","data-w",v=>{st.weekOverride=+v;save();render();scheduleReminders()});
    seg("#segR","data-r",v=>{st.remindOn=v==="1";save();scheduleReminders()});
    $("#stStart").onchange=e=>{if(e.target.value){st.planStart=isoDay(mondayOf(e.target.value+"T00:00:00"));save();render();scheduleReminders()}};
    $("#stMorning").onchange=e=>{st.morningTime=e.target.value;save();scheduleReminders();toast("Aviso de movilidad a las "+e.target.value)};
    $("#stRemind").onchange=e=>{st.remindTime=e.target.value;save();scheduleReminders();toast("Aviso de entreno a las "+e.target.value)};
    $("#stReport").onclick=async()=>{const r=await shareText("Resumen EaZy-Workout",weeklyReport(7));if(r==="copied")toast("Resumen copiado")};
    $("#stExport").onclick=async()=>{const r=await shareFile(`eazy-workout-${isoDay(new Date())}.json`,exportJSON());if(r==="copied")toast("Copia copiada al portapapeles")};
    $("#stImport").onclick=()=>$("#importFile").click();
    $("#stDemo").onclick=()=>{S.sessions=S.sessions.filter(s=>!s.demo);save();closeSheet();render();toast("Datos de ejemplo borrados")};
    if($("#stTest"))$("#stTest").onclick=async()=>{if(!NATIVE){toast("Solo funciona en la app del móvil");return}
      if(!(await notifyPermissionOk())){toast("Activa las notificaciones de EaZy-Workout en Ajustes de Android");return}
      await scheduleTimerNotif(5,"Prueba de EaZy-Workout","Si oyes la campana, los temporizadores sonarán con la pantalla bloqueada.");toast("Bloquea la pantalla y espera 5 s")};
    $("#stFb").onclick=feedbackSheet;
    $("#stName").onchange=e=>{if(S.profile){S.profile.name=e.target.value.trim();save();render()}};
    document.querySelectorAll("[data-zone]").forEach(b=>b.onclick=()=>{if(!S.profile)return;const id=b.dataset.zone,z=S.profile.zones;S.profile.zones=z.some(x=>x.id===id)?z.filter(x=>x.id!==id):z.concat({id,n:ZONE_OPTS.find(x=>x[0]===id)[1]});b.classList.toggle("on-z");save()});
    document.querySelectorAll("[data-len]").forEach(b=>b.onclick=()=>{if(!S.profile)return;S.profile.weeks=+b.dataset.len;S.settings.weekOverride=0;save();closeSheet();render();settingsSheet()});
    $("#stRedo").onclick=()=>confirmSheet("¿Volver a configurar tu plan?","Se crean rutinas nuevas según tus respuestas. Tus sesiones, récords y peso se conservan.","Configurar",()=>startOnboarding(true),false);
    $("#stClose").onclick=closeSheet});
}
