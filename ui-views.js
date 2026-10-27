"use strict";
function startBase(r){active={id:uid(),routineId:r.id,name:r.name,note:r.note,week:planWeek(),start:Date.now(),items:r.items.map(x=>newItem(x.ex,x.sets,x.target,x.kg,x.rest))};saveActive();keepAwake();stack.length=0;tab="today";render()}
function laterSheet(r){const opt=[[60,"En 1 hora"],[120,"En 2 horas"],[180,"En 3 horas"]];
  openSheet(`<h3>Recordar ${esc(r.name)}</h3><p class="sub">Te llega una notificación a esa hora.</p><div class="stack" style="margin-top:16px">
    ${opt.map(([m,t])=>`<button class="btn wide" data-m="${m}" type="button">${t}</button>`).join("")}
    <div class="row"><input type="time" id="ltTime" value="${esc(S.settings.remindTime)}" class="grow"><button class="btn" id="ltSet" type="button">A esa hora</button></div></div>`,()=>{
    const set=async when=>{if(when<=new Date()){toast("Esa hora ya ha pasado hoy");return}const ok=await remindLater(r,when);closeSheet();
      toast(ok?`Aviso a las ${when.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}`:"Los avisos solo funcionan en la app del móvil")};
    document.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>set(new Date(Date.now()+b.dataset.m*60000)));
    $("#ltSet").onclick=()=>set(atTime(new Date(),$("#ltTime").value))})}

/* ===== Rutinas ===== */
function daySheet(d){const cur=new Set(S.schedule[d]||[]);
  openSheet(`<h3>${["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][d]}</h3><p class="sub">Marca lo que toca ese día.</p>
  <div class="stack" style="margin-top:16px">${S.routines.map(r=>`<button class="btn wide ${cur.has(r.id)?"main":""}" style="${cur.has(r.id)?"min-height:48px;font:500 15px var(--sans);letter-spacing:0;text-transform:none;justify-content:center":""}" data-r="${esc(r.id)}" type="button">${esc(r.name)}</button>`).join("")}
  <button class="btn wide" id="dsOk" type="button" style="margin-top:8px">Hecho</button></div>`,()=>{
    document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{const id=b.dataset.r;cur.has(id)?cur.delete(id):cur.add(id);
      S.schedule[d]=S.routines.map(r=>r.id).filter(x=>cur.has(x)).sort((a,b)=>(routineById(b).mobility?1:0)-(routineById(a).mobility?1:0));save();daySheet(d)});
    $("#dsOk").onclick=()=>{closeSheet();render();scheduleReminders()}})}
function openEditor(rid){push({render:()=>viewEditor(rid)})}
function viewEditor(rid){const r=routineById(rid);if(!r){back();return}
  view().innerHTML=`${backBtn()}<p class="lbl">Editar rutina</p>
  <div class="stack" style="margin-top:8px"><label class="f"><span class="lbl">Nombre</span><input id="edN" value="${esc(r.name)}"></label>
  <label class="f"><span class="lbl">Notas</span><textarea id="edNote">${esc(r.note||"")}</textarea></label>
  <span class="lbl">Color</span><div class="swatches" id="edSw">${SWATCHES.map(c=>`<button type="button" data-c="${c}" style="--c:${c}" class="${catColor(r)===c?"on":""}" aria-label="Color ${c}"></button>`).join("")}</div>
  <label class="f"><span class="lbl">Tipo</span><select id="edCat">${Object.entries(CATS).map(([k,v])=>`<option value="${k}" ${catOf(r)===k?"selected":""}>${v.n}</option>`).join("")}</select></label></div>
  <h2 class="lbl">Ejercicios · valores base</h2>
  <div class="stack">${r.items.map((x,ix)=>{const e=exById(x.ex),T=TYPE[e.t],wk=x.wk?Object.entries(x.wk).map(([k,v])=>v[0]?`S${k} ${v[0]}×${v[1]}`:`S${k} no`).join(" · "):"";
    return `<div class="card" data-ix="${ix}"><div class="row"><div class="grow" style="font-weight:500">${esc(e.n)}</div>
    <button class="btn sm" data-up type="button" aria-label="Subir" ${ix?"":"disabled"}>↑</button><button class="btn sm" data-dn type="button" aria-label="Bajar" ${ix<r.items.length-1?"":"disabled"}>↓</button><button class="btn sm" data-x type="button" aria-label="Quitar">×</button></div>
    <div class="row" style="margin-top:10px"><label class="f grow"><span class="lbl">Series</span><input inputmode="numeric" data-k="sets" value="${x.sets}"></label>
      <label class="f grow"><span class="lbl">${T.obj}</span><input inputmode="decimal" data-k="target" value="${x.target}"></label>
      ${e.t==="kg"?`<label class="f grow"><span class="lbl">kg</span><input inputmode="decimal" data-k="kg" value="${x.kg}"></label>`:""}
      <label class="f grow"><span class="lbl">Desc. s</span><input inputmode="numeric" data-k="rest" value="${x.rest}"></label></div>
    ${wk?`<p class="mono" style="margin-top:8px;text-transform:none;letter-spacing:0">Plan: ${esc(wk)}</p>`:""}</div>`}).join("")||`<p class="sub">Sin ejercicios todavía.</p>`}</div>
  <div class="stack" style="margin-top:16px"><button class="btn wide" id="edAdd" type="button">Añadir ejercicio</button>
  <div class="row"><button class="btn grow" id="edDup" type="button">Duplicar</button><button class="btn danger grow" id="edDel" type="button">Borrar</button></div></div>`;
  bindBack();
  $("#edN").onchange=e=>{r.name=e.target.value.trim()||r.name;save()};$("#edNote").onchange=e=>{r.note=e.target.value;save()};view().querySelectorAll("#edSw [data-c]").forEach(b=>b.onclick=()=>{r.color=b.dataset.c;save();view().querySelectorAll("#edSw [data-c]").forEach(x=>x.classList.toggle("on",x===b));toast("Color guardado")});$("#edCat").onchange=e=>{r.cat=e.target.value;r.mobility=e.target.value==="mob";save()};
  view().querySelectorAll(".card[data-ix]").forEach(c=>{const ix=+c.dataset.ix,x=r.items[ix];
    c.querySelectorAll("[data-k]").forEach(i=>i.onchange=()=>{x[i.dataset.k]=Math.max(0,num(i.value));if(i.dataset.k==="sets")x.sets=Math.max(1,Math.round(x.sets));save()});
    c.querySelector("[data-up]").onclick=()=>{[r.items[ix-1],r.items[ix]]=[r.items[ix],r.items[ix-1]];save();viewEditor(rid)};
    c.querySelector("[data-dn]").onclick=()=>{[r.items[ix+1],r.items[ix]]=[r.items[ix],r.items[ix+1]];save();viewEditor(rid)};
    c.querySelector("[data-x]").onclick=()=>confirmSheet(`¿Quitar ${exById(x.ex).n}?`,"Se quita de la rutina. Tus sesiones pasadas no cambian.","Quitar",()=>{r.items.splice(ix,1);save();viewEditor(rid)})});
  $("#edAdd").onclick=()=>picker(ex=>{const t=exById(ex).t;r.items.push({ex,sets:3,target:{reps:10,time:30,run:4,rounds:2,kg:10}[t],kg:0,rest:60,wk:null});save();viewEditor(rid)});
  $("#edDup").onclick=()=>{const c=structuredClone(r);c.id="r-"+uid();c.name+=" (copia)";S.routines.push(c);save();stack.pop();openEditor(c.id);toast("Rutina duplicada")};
  $("#edDel").onclick=()=>confirmSheet(`¿Borrar ${r.name}?`,"Las sesiones ya hechas se conservan.","Borrar rutina",()=>{S.routines=S.routines.filter(x=>x.id!==r.id);
    for(const d in S.schedule)S.schedule[d]=(S.schedule[d]||[]).filter(x=>x!==r.id);save();stack.length=0;render();scheduleReminders();toast("Rutina borrada")});
}

/* ===== Progreso ===== */
function onResume(){resumeTimer();if(active)keepAwake();scheduleReminders();softRender()}
(async()=>{
  document.querySelectorAll(".navbtn").forEach(b=>b.onclick=()=>go(b.dataset.tab));
  $("#btnSettings").onclick=settingsSheet;
  $("#tMinus").onclick=()=>shiftTimer(-15);$("#tPlus").onclick=()=>shiftTimer(15);$("#tSkip").onclick=stopTimer;
  $("#importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{let d;try{d=JSON.parse(rd.result)}catch(x){toast("Ese archivo no es una copia válida");return}
    confirmSheet("¿Reemplazar tus datos?",`Se cargarán ${(d.routines||[]).length} rutinas y ${(d.sessions||[]).length} sesiones. Lo que tienes ahora se sustituye.`,"Importar",()=>{try{importJSON(rd.result);render();scheduleReminders();toast("Datos importados")}catch(x){toast("Ese archivo no es una copia de EaZy-Workout")}},false)};rd.readAsText(f);e.target.value=""};
  setInterval(()=>{const el=$("#elapsed");if(el&&active)el.textContent=fmtClock((Date.now()-active.start)/1000)},1000);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")onResume()});
  await load();if(!S.profile)startOnboarding();else render();
  await nativeInit();scheduleReminders();
  const A=P("App");if(A)A.addListener("backButton",()=>{if(!back())A.minimizeApp()});
})();
