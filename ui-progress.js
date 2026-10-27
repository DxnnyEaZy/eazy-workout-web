"use strict";
/* ===== Progreso: camino al test, semana, peso, ejercicio ===== */
let progEx=null;
function goalData(){const col={run:"var(--run)",routine:"var(--str)"};return S.goals.map(g=>{const v=goalValue(g);
  const c=g.kind==="ex"?catColor({items:[{ex:g.ex}],cat:{Cardio:"run",Boxeo:"box",Movilidad:"mob"}[exById(g.ex).g]||"str"}):col[g.kind];
  return {id:g.id,n:g.n,v,max:g.target,u:g.unit,c,txt:g.kind==="routine"?`${v} % del volumen de la semana ${g.week}`:`${v} / ${g.target} ${g.unit}`,pct:g.kind==="routine"}})}
function goalHTML(g){const p=Math.min(100,g.v/g.max*100);g.max=g.pct?1:g.max;return `<div class="goal rise" style="--c:${g.c}"><div class="top"><span class="lbl grow" style="color:var(--tx)">${g.n}</span>
  <span class="big" style="font-size:30px;color:var(--c)">${g.pct?Math.round(p)+"%":g.v}</span>${g.pct?"":`<span class="lbl">/ ${g.max} ${esc(g.u)}</span>`}<button class="btn sm" data-gdel="${g.id}" type="button" aria-label="Quitar objetivo" style="min-height:28px;padding:0 8px">×</button></div>
  <div class="meter"><b style="width:${p}%"></b><i style="left:calc(100% - 2px)"></i></div><p class="s mono" style="font-size:11px;color:var(--mut);margin-top:6px">${g.txt}</p></div>`}
function weekSummary(){const mon=mondayOf(new Date());let plan=0;for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);plan+=todayList(d).filter(r=>!r.mobility).length}
  const ss=real().filter(s=>s.start>=mon.getTime()),main=ss.filter(s=>!isMob(s)),mins=Math.round(ss.reduce((a,s)=>a+(s.end-s.start),0)/60000);
  const rp=ss.map(s=>s.feel&&s.feel.rpe).filter(v=>v!=null),avg=rp.length?(rp.reduce((a,b)=>a+b,0)/rp.length).toFixed(1):"–";
  return `<div class="stats"><div class="stat" style="--c:var(--run)"><div class="big">${main.length}<span class="lbl" style="font-style:normal"> /${plan}</span></div><div class="lbl">sesiones</div></div>
  <div class="stat" style="--c:var(--str)"><div class="big">${mins}</div><div class="lbl">minutos</div></div>
  <div class="stat" style="--c:var(--box)"><div class="big">${avg}</div><div class="lbl">sensación</div></div></div>`}
function lineChart(pts,unit,color){if(pts.length<2)return `<p class="sub" style="padding:16px">Con 2 registros verás aquí la evolución.</p>`;
  const W=400,H=200,L=36,R=10,T=26,B=24,xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);let y0=Math.min(...ys),y1=Math.max(...ys);if(y0===y1){y0-=1;y1+=1}
  const pad=(y1-y0)*.15;y0=Math.max(0,y0-pad);y1+=pad;const x0=Math.min(...xs),x1=Math.max(...xs);
  const sx=x=>L+(x-x0)/(x1-x0||1)*(W-L-R),sy=y=>T+(1-(y-y0)/(y1-y0))*(H-T-B),r1=v=>Math.round(v*10)/10;
  const line=pts.map((p,i)=>`${i?"L":"M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(""),lp=pts[pts.length-1],ticks=[0,1,2,3].map(k=>y0+(y1-y0)*k/3);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución">
  ${ticks.map(t=>`<line x1="${L}" x2="${W-R}" y1="${sy(t)}" y2="${sy(t)}" stroke="#454C54" stroke-width="1"/><text x="${L-6}" y="${sy(t)+4}" text-anchor="end" fill="#AEB6BD" style="font:11px var(--mono)">${r1(t)}</text>`).join("")}
  ${[pts[0],lp].map((p,i)=>`<text x="${sx(p.x)}" y="${H-5}" text-anchor="${i?"end":"start"}" fill="#AEB6BD" style="font:11px var(--mono)">${fmtDate(p.x)}</text>`).join("")}
  <path d="${line}L${sx(x1)},${H-B}L${sx(x0)},${H-B}Z" fill="${color}" fill-opacity=".16"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2.5"/>
  ${pts.map(p=>`<rect x="${sx(p.x)-3}" y="${sy(p.y)-3}" width="6" height="6" fill="#32383E" stroke="${p.demo?"#86909A":color}" stroke-width="1.5"/>`).join("")}
  <rect x="${sx(lp.x)-5}" y="${sy(lp.y)-5}" width="10" height="10" fill="${color}"/>
  <text x="${Math.min(sx(lp.x),W-R)}" y="${T-10}" text-anchor="end" fill="#F4F5F6" style="font:900 italic 20px var(--disp)">${lp.y} ${unit}</text></svg>`}
function series(exId){const useReal=real().some(s=>s.items.some(i=>i.ex===exId));
  return S.sessions.filter(s=>(!useReal||!s.demo)&&s.items.some(i=>i.ex===exId&&i.sets.some(z=>z.done))).sort((a,b)=>a.start-b.start)
    .map(s=>({x:s.start,y:best(exById(exId).t,s.items.find(i=>i.ex===exId).sets),demo:!!s.demo}))}
function viewProgress(){const used=[...new Set(S.sessions.flatMap(s=>s.items.map(i=>i.ex)))].map(exById).sort((a,b)=>a.n.localeCompare(b.n,"es"));
  if(!progEx||!used.some(e=>e.id===progEx))progEx=(used.find(e=>e.id==="flexiones")||used[0]||{}).id;
  const bw=S.body.slice().sort((a,b)=>a.t-b.t),bLast=bw[bw.length-1],bDelta=bw.length>1?(bLast.kg-bw[0].kg):0;
  const prs=prMap(),list=Object.entries(prs).map(([id,p])=>({e:exById(id),...p})).sort((a,b)=>b.date-a.date);
  let exBlock="";if(progEx){const e=exById(progEx),pts=series(progEx),u=TYPE[e.t].best,pr=prs[progEx],ec=CATS[{Cardio:"run",Boxeo:"box",Movilidad:"mob"}[e.g]||"str"].c;
    exBlock=`<div class="row"><div class="thumb" style="--c:${ec}">${poseSVG(progEx)}</div><select id="pgSel" class="grow" aria-label="Ejercicio">${used.map(x=>`<option value="${esc(x.id)}" ${x.id===progEx?"selected":""}>${esc(x.n)}</option>`).join("")}</select></div>
    <div class="row" style="margin:8px 0"><span class="lbl">Récord</span><span class="big" style="font-size:26px;color:${ec}">${pr?pr.v:"–"}</span><span class="lbl">${u}</span><span class="grow"></span><span class="lbl">${pts.length} sesiones</span></div>
    <div class="chart">${lineChart(pts,u,ec)}</div>${pts.length&&pts.every(p=>p.demo)?`<p class="lbl" style="margin-top:6px">Datos de ejemplo</p>`:""}`}
  view().innerHTML=`<h1>Progreso</h1><p class="sub">Tus objetivos, tu semana y tu peso.</p>
  <h2>Mis objetivos</h2><div class="stack">${goalData().map(goalHTML).join("")||`<p class="sub">Aún no tienes objetivos.</p>`}<button class="btn wide" id="gAdd" type="button">Añadir objetivo</button></div>
  <h2>Esta semana</h2>${weekSummary()}
  <h2>Peso corporal</h2><div class="card" style="--c:var(--accent)"><div class="row"><span class="big">${bLast?bLast.kg:"–"}</span><span class="lbl">kg</span><span class="grow"></span>
    ${bw.length>1?`<span class="tag ${bDelta>=0?"good":"warn"}">${bDelta>=0?"+":""}${bDelta.toFixed(1)} kg desde ${fmtDate(bw[0].t)}</span>`:""}</div>
    <div class="row" style="margin-top:12px"><input id="bwIn" inputmode="decimal" placeholder="Hoy, en kg" class="grow"><button class="btn" id="bwAdd" type="button">Añadir</button></div>
    ${bw.length>1?`<div class="chart" style="margin-top:12px;border:0;padding:0">${lineChart(bw.map(x=>({x:x.t,y:x.kg})),"kg","#7F93A3")}</div>`:`<p class="sub" style="margin-top:8px;font-size:13px">Pésate una vez por semana, mismo día y misma hora.</p>`}
    ${bw.length?`<button class="btn sm" id="bwDel" type="button" style="margin-top:10px">Borrar último registro</button>`:""}</div>
  <h2>Por ejercicio</h2>${exBlock||`<p class="sub">Termina tu primera sesión y aquí verás la evolución.</p>`}
  <h2>Récords personales</h2><div class="stack">${list.map(p=>`<div class="item rise"><div class="thumb" style="width:52px;height:42px">${poseSVG(p.e.id)}</div><div class="grow"><div class="t">${esc(p.e.n)}</div><div class="s">${fmtDate(p.date)}</div></div><span class="big" style="font-size:24px;color:var(--gold)">${p.v}</span><span class="lbl">${TYPE[p.e.t].best}</span></div>`).join("")||`<p class="sub">Aún sin récords propios: los de ejemplo no cuentan.</p>`}</div>`;
  $("#gAdd").onclick=goalSheet;view().querySelectorAll("[data-gdel]").forEach(b=>b.onclick=()=>{const g=S.goals.find(x=>x.id===b.dataset.gdel);confirmSheet(`¿Quitar el objetivo ${g.n}?`,"Tus sesiones no cambian.","Quitar",()=>{S.goals=S.goals.filter(x=>x!==g);save();viewProgress()})});
  const sel=$("#pgSel");if(sel)sel.onchange=ev=>{progEx=ev.target.value;viewProgress()};
  $("#bwAdd").onclick=()=>{const kg=num($("#bwIn").value);if(kg<30||kg>200){toast("Pon tu peso en kg, por ejemplo 69.5");return}S.body.push({t:Date.now(),kg:Math.round(kg*10)/10});save();viewProgress();toast("Peso guardado")};
  const bd=$("#bwDel");if(bd)bd.onclick=()=>confirmSheet("¿Borrar el último peso?","Se elimina solo el registro más reciente.","Borrar",()=>{const last=S.body.slice().sort((a,b)=>b.t-a.t)[0];S.body=S.body.filter(x=>x!==last);save();viewProgress()});
}

/* ===== Calendario ===== */
let calM=null;
function viewCalendar(){const now=new Date();if(!calM)calM=new Date(now.getFullYear(),now.getMonth(),1);const y=calM.getFullYear(),m=calM.getMonth();
  const byDay={};for(const s of S.sessions){const k=isoDay(s.start);(byDay[k]=byDay[k]||[]).push(catColor(routineById(s.routineId)||{items:s.items}))}
  const first=(new Date(y,m,1).getDay()+6)%7,len=new Date(y,m+1,0).getDate(),inM=sorted().filter(s=>{const d=new Date(s.start);return d.getFullYear()===y&&d.getMonth()===m});
  let c="";for(let i=0;i<first;i++)c+=`<div class="d out"></div>`;
  for(let d=1;d<=len;d++){const k=isoDay(new Date(y,m,d)),cols=[...new Set(byDay[k]||[])];c+=`<div class="d ${isoDay(now)===k?"today":""}">${d}<span class="dots">${cols.map(x=>`<i style="--c:${x}"></i>`).join("")}</span></div>`}
  const mName=calM.toLocaleDateString("es-ES",{month:"long",year:"numeric"});
  view().innerHTML=`<h1>Calendario</h1><p class="sub">Cada color es un tipo de entreno. La racha cuenta semanas seguidas con al menos un entreno.</p>
  <div class="stats" style="margin-top:16px"><div class="stat" style="--c:var(--gold)"><div class="big">${streak()}</div><div class="lbl">semanas racha</div></div>
  <div class="stat" style="--c:var(--run)"><div class="big">${new Set(inM.filter(s=>!isMob(s)&&!s.demo).map(s=>isoDay(s.start))).size}</div><div class="lbl">días entreno</div></div>
  <div class="stat" style="--c:var(--mob)"><div class="big">${new Set(inM.filter(s=>isMob(s)).map(s=>isoDay(s.start))).size}</div><div class="lbl">días lumbar</div></div></div>
  <div class="row" style="margin:24px 0 12px"><button class="btn sm" id="cP" type="button" aria-label="Mes anterior">‹</button><div class="grow" style="text-align:center;font:700 22px var(--disp);text-transform:uppercase">${mName}</div><button class="btn sm" id="cN" type="button" aria-label="Mes siguiente">›</button></div>
  <div class="cal">${["L","M","X","J","V","S","D"].map(h=>`<div class="h">${h}</div>`).join("")}${c}</div>
  <div class="legend">${Object.values(CATS).map(x=>`<span><i style="--c:${x.c}"></i>${x.n}</span>`).join("")}</div>
  <h2>Sesiones del mes</h2><div class="stack">${inM.map(sessRow).join("")||`<p class="sub">Ninguna este mes.</p>`}</div>`;
  $("#cP").onclick=()=>{calM=new Date(y,m-1,1);viewCalendar()};$("#cN").onclick=()=>{calM=new Date(y,m+1,1);viewCalendar()};bindSessRows()}
