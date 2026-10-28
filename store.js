"use strict";
/* ===== Estado y guardado ===== */
const S={routines:[],custom:[],schedule:{},sessions:[],body:[],goals:[],profile:null,demoDone:false,
  settings:{planStart:"",weekOverride:0,remindOn:true,remindTime:"18:30",morningTime:"08:30"}};
let active=null;
const KEY="diario.v2", KEY_ACTIVE="diario.active";
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const num=v=>{const n=parseFloat(String(v??"").replace(",","."));return isNaN(n)?0:n};
const Pref=()=>window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()?window.Capacitor.Plugins.Preferences:null;
async function kvGet(k){try{const p=Pref();if(p){const r=await p.get({key:k});return r.value?JSON.parse(r.value):null}return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}}
async function kvSet(k,v){try{const p=Pref(),s=v==null?null:JSON.stringify(v);if(p){s==null?await p.remove({key:k}):await p.set({key:k,value:s});return}
  s==null?localStorage.removeItem(k):localStorage.setItem(k,s)}catch(e){console.warn(e)}}
let saveT=null;
const snapshot=()=>({v:2,routines:S.routines,custom:S.custom,schedule:S.schedule,sessions:S.sessions,body:S.body,goals:S.goals,profile:S.profile,demoDone:S.demoDone,settings:S.settings});
/* guardado inmediato (sin esperas): en web también a localStorage de forma síncrona, para no perder nada si se cierra la app */
let LOADED=false;
function save(){if(!LOADED)return;clearTimeout(saveT);const d=snapshot();try{if(!Pref())localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}saveT=setTimeout(()=>kvSet(KEY,d),0)}
function flush(){if(!LOADED)return;try{const d=snapshot();if(!Pref())localStorage.setItem(KEY,JSON.stringify(d));else kvSet(KEY,d);if(active)kvSet(KEY_ACTIVE,active)}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flush()});window.addEventListener("pagehide",flush);
function saveActive(){kvSet(KEY_ACTIVE,active)}
function mondayOf(d){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
const isoDay=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`};
async function load(){const d=await kvGet(KEY);
  if(d){Object.assign(S,{routines:d.routines||defaultRoutines(),custom:d.custom||[],schedule:d.schedule||structuredClone(DEFAULT_SCHEDULE),sessions:d.sessions||[],body:d.body||[],goals:d.goals||[],profile:d.profile||null,demoDone:!!d.demoDone});
    const defs=defaultRoutines();for(const r of S.routines){const df=defs.find(x=>x.id===r.id);if(df&&!r.cat)r.cat=df.cat}Object.assign(S.settings,d.settings||{});danifyIfNeeded(d)}
  else{S.routines=[];S.schedule={0:[],1:[],2:[],3:[],4:[],5:[],6:[]}}
  if(!S.settings.planStart)S.settings.planStart=isoDay(mondayOf(new Date()));
  active=await kvGet(KEY_ACTIVE);
  LOADED=true;save();
}

/* ===== Plan ===== */
function planWeekRaw(){const s=new Date(S.settings.planStart+"T00:00:00");return Math.floor((mondayOf(new Date())-mondayOf(s))/(7*864e5))+1}
function planWeek(){if(S.settings.weekOverride)return S.settings.weekOverride;return Math.min(planLen(),Math.max(1,planWeekRaw()))}
const blockOver=()=>!S.settings.weekOverride&&planWeekRaw()>planLen();
function itemWeek(it,w){const o=it.wk&&it.wk[w];if(o)return {sets:o[0],target:o[1]};return (!it.wk&&autoWeek(it,w))||{sets:it.sets,target:it.target}}
function routineItems(r,w){return r.items.map(it=>({...it,...itemWeek(it,w)})).filter(it=>it.sets>0)}

/* ===== Consultas ===== */
const allEx=()=>LIB.concat(S.custom);
const exById=id=>allEx().find(e=>e.id===id)||{id,n:id,g:"Otros",t:"reps"};
const routineById=id=>S.routines.find(r=>r.id===id);
const todayList=(d=new Date())=>(S.schedule[d.getDay()]||[]).map(routineById).filter(Boolean);
const sorted=()=>S.sessions.slice().sort((a,b)=>b.start-a.start);
const real=()=>S.sessions.filter(s=>!s.demo);
function best(t,sets){const d=sets.filter(s=>s.done);if(!d.length)return 0;if(t==="rounds")return d.length;return Math.max(...d.map(s=>num(s.a)))}
function volume(s){let v=0;for(const i of s.items)if(exById(i.ex).t==="kg")for(const z of i.sets)if(z.done)v+=num(z.a)*num(z.b);return Math.round(v)}
function lastFor(exId,skipId){for(const s of sorted()){if(s.id===skipId||(s.demo&&real().length))continue;const i=s.items.find(x=>x.ex===exId);if(i&&i.sets.some(z=>z.done))return {date:s.start,sets:i.sets.filter(z=>z.done)}}return null}
function prMap(before){const m={};for(const s of real()){if(before&&s.start>=before)continue;for(const i of s.items){const t=exById(i.ex).t,b=best(t,i.sets);
  if(b>0&&(!m[i.ex]||b>m[i.ex].v))m[i.ex]={v:b,date:s.start}}}return m}
const isMob=s=>{const r=routineById(s.routineId);return !!(r&&r.mobility)};
function streak(){const weeks=new Set(real().filter(s=>!isMob(s)).map(s=>mondayOf(s.start).getTime()));let w=mondayOf(new Date());if(!weeks.has(w.getTime()))w.setDate(w.getDate()-7);
  let n=0;while(weeks.has(w.getTime())){n++;w.setDate(w.getDate()-7)}return n}
function fmtSet(t,s){if(t==="kg")return `${s.a}kg×${s.b}`;if(t==="time")return `${s.a}s`;if(t==="run")return `${s.a}'${s.b?`/${s.b}km`:""}`;if(t==="rounds")return `${s.a}'`;return `${s.a}`}

/* ===== Datos de ejemplo (no cuentan en récords ni racha) ===== */
function makeDemo(){const out=[],mon=mondayOf(new Date());
  const plan=[["carrera-x",3],["cal-a",2],["cal-b",4],["saco",6]];
  for(let w=3;w>=1;w--)for(const [rid,dow] of plan){const r=routineById(rid)||defaultRoutines().find(x=>x.id===rid);
    const d=new Date(mon);d.setDate(mon.getDate()-w*7+(dow-1));d.setHours(19,0,0,0);const p=3-w;
    const items=routineItems(r,2).map(x=>{const t=exById(x.ex).t;return {ex:x.ex,sets:Array.from({length:x.sets},()=>({a:t==="reps"?Math.max(1,x.target-2+p):t==="time"?x.target-10+p*5:t==="run"?x.target-2+p:x.target,b:"",done:true}))}});
    out.push({id:"demo-"+rid+"-"+w,demo:true,routineId:rid,name:r.name,start:d.getTime(),end:d.getTime()+(30+p*3)*60000,items,feel:{rpe:6+p%2,lumbar:2,quad:1,note:""}})}
  return out}

/* ===== Exportar / informe ===== */
function exportJSON(){return JSON.stringify({app:"diario",v:2,exported:new Date().toISOString(),routines:S.routines,custom:S.custom,schedule:S.schedule,settings:S.settings,sessions:S.sessions,body:S.body,goals:S.goals,profile:S.profile})}
function importJSON(txt){const d=JSON.parse(txt);if(!d||!Array.isArray(d.routines)||!Array.isArray(d.sessions))throw new Error("formato");
  S.routines=d.routines;S.custom=d.custom||[];S.schedule=d.schedule||structuredClone(DEFAULT_SCHEDULE);S.sessions=d.sessions;S.body=d.body||[];S.goals=d.goals||S.goals;S.profile=d.profile||S.profile;S.demoDone=true;Object.assign(S.settings,d.settings||{});save()}
function weeklyReport(days=7){const from=Date.now()-days*864e5,w=planWeek(),ss=real().filter(s=>s.start>=from).sort((a,b)=>a.start-b.start);
  const L=[`Resumen EaZy-Workout · ${(S.profile&&S.profile.name)||""} · ${new Date().toLocaleDateString("es-ES")} · Semana ${w} de ${planLen()}${blockOver()?" (bloque terminado)":""}`,`Sesiones últimos ${days} días: ${ss.length}`,""];
  const plan=[];for(let i=days-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);if(isoDay(d)<S.settings.planStart)continue;for(const r of todayList(d)){if(r.mobility)continue;
    const did=ss.some(s=>s.routineId===r.id&&isoDay(s.start)===isoDay(d));plan.push(`${DAYS[d.getDay()]} ${d.getDate()}: ${r.name} ${did?"✓ hecha":"✗ no hecha"}`)}}
  L.push("Plan vs hecho:",...plan,"");
  for(const s of ss){L.push(`${new Date(s.start).toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"})} · ${s.name} · ${Math.round((s.end-s.start)/60000)} min`);
    for(const i of s.items){const e=exById(i.ex);L.push(`  - ${e.n}: ${i.sets.filter(z=>z.done).map(z=>fmtSet(e.t,z)).join(", ")}`)}
    if(s.feel)L.push(`  Sensación ${s.feel.rpe??"-"}/10${((S.profile&&S.profile.zones)||[]).map(z=>` · ${z.n} ${zoneVal(s.feel,z.id)??"-"}/10`).join("")}${s.feel.note?` · Nota: ${s.feel.note}`:""}`)}
  const pr=prMap(),newPr=Object.entries(pr).filter(([,p])=>p.date>=from).map(([id,p])=>`${exById(id).n} ${p.v} ${TYPE[exById(id).t].best}`);
  const bw=S.body.slice().sort((a,b)=>a.t-b.t);if(bw.length)L.push("",`Peso: ${bw.slice(-4).map(x=>`${x.kg} kg (${new Date(x.t).toLocaleDateString("es-ES",{day:"numeric",month:"short"})})`).join(" → ")}`);
  L.push("",`Récords nuevos: ${newPr.length?newPr.join("; "):"ninguno"}`,`Racha: ${streak()} semanas`);
  return L.join("\n")}
