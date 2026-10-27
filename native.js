"use strict";
/* Puente con Android (Capacitor). En el navegador todo degrada sin romper. */
const NATIVE=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
const P=n=>NATIVE?window.Capacitor.Plugins[n]:null;
const ID={timer:1001,remind:2000,later:3000};
async function nativeInit(){const LN=P("LocalNotifications");if(!LN)return;
  try{let p=await LN.checkPermissions();if(p.display!=="granted")p=await LN.requestPermissions();
    await LN.createChannel({id:"timer",name:"Temporizador",description:"Fin de descanso y de series con tiempo",importance:5,visibility:1,vibration:true,sound:"campana.wav"});
    await LN.createChannel({id:"remind",name:"Recordatorios",description:"Qué toca entrenar hoy",importance:4,visibility:1,vibration:true});
    const A=P("App");A&&A.addListener("appStateChange",st=>{if(st.isActive)onResume&&onResume()});
  }catch(e){console.warn("notif",e)}}
async function notifyPermissionOk(){const LN=P("LocalNotifications");if(!LN)return true;try{return (await LN.checkPermissions()).display==="granted"}catch(e){return false}}
async function scheduleTimerNotif(sec,title,body){const LN=P("LocalNotifications");if(!LN)return;
  try{await LN.cancel({notifications:[{id:ID.timer}]});
    await LN.schedule({notifications:[{id:ID.timer,title,body,channelId:"timer",schedule:{at:new Date(Date.now()+sec*1000),allowWhileIdle:true},smallIcon:"ic_stat_diario",iconColor:"#7F93A3"}]})}catch(e){console.warn(e)}}
async function cancelTimerNotif(){const LN=P("LocalNotifications");if(!LN)return;try{await LN.cancel({notifications:[{id:ID.timer}]})}catch(e){}}
const atTime=(d,hhmm)=>{const [h,m]=String(hhmm||"18:30").split(":").map(Number);const x=new Date(d);x.setHours(h||0,m||0,0,0);return x};
/* Recordatorios de los próximos 14 días según la semana y el plan */
async function scheduleReminders(){const LN=P("LocalNotifications");if(!LN)return;
  try{const ids=Array.from({length:40},(_,i)=>({id:ID.remind+i}));await LN.cancel({notifications:ids});if(!S.settings.remindOn)return;
    const list=[];let k=0;const now=new Date();
    for(let i=0;i<14&&k<40;i++){const d=new Date();d.setDate(now.getDate()+i);const rs=todayList(d);
      const mob=rs.filter(r=>r.mobility),main=rs.filter(r=>!r.mobility);
      const tm=atTime(d,S.settings.morningTime),tr=atTime(d,S.settings.remindTime);
      if(mob.length&&tm>now)list.push({id:ID.remind+k++,title:mob[0].name,body:"10 minutos de movilidad para empezar el día.",channelId:"remind",schedule:{at:tm,allowWhileIdle:true},smallIcon:"ic_stat_diario",iconColor:"#7F93A3"});
      if(main.length&&tr>now)list.push({id:ID.remind+k++,title:`Hoy toca: ${main.map(r=>r.name).join(" + ")}`,body:"Abre EaZy-Workout para ver la sesión de esta semana.",channelId:"remind",schedule:{at:tr,allowWhileIdle:true},smallIcon:"ic_stat_diario",iconColor:"#7F93A3"})}
    if(list.length)await LN.schedule({notifications:list})}catch(e){console.warn(e)}}
async function remindLater(r,when){const LN=P("LocalNotifications");if(!LN)return false;
  try{await LN.schedule({notifications:[{id:ID.later+Math.floor(Math.random()*900),title:`Toca ${r.name}`,body:"Lo dejaste para ahora. Abre EaZy-Workout y empieza.",channelId:"remind",schedule:{at:when,allowWhileIdle:true},smallIcon:"ic_stat_diario",iconColor:"#7F93A3"}]});return true}catch(e){return false}}
function haptic(kind){const H=P("Haptics");try{if(H)kind==="heavy"?H.notification({type:"SUCCESS"}):H.impact({style:"LIGHT"});else navigator.vibrate&&navigator.vibrate(kind==="heavy"?[120,60,120]:15)}catch(e){}}
async function shareText(title,text){const Sh=P("Share");
  if(!Sh&&navigator.share){try{await navigator.share({title,text});return "shared"}catch(e){if(e&&e.name==="AbortError")return "cancel"}}
  if(Sh){try{await Sh.share({title,text,dialogTitle:title});return "shared"}catch(e){if(String(e&&e.message).includes("cancel"))return "cancel"}}
  try{await navigator.clipboard.writeText(text);return "copied"}catch(e){return "fail"}}
async function shareFile(name,text){const FS=P("Filesystem"),Sh=P("Share");
  if(FS&&Sh){try{const r=await FS.writeFile({path:name,data:text,directory:"CACHE",encoding:"utf8"});await Sh.share({title:name,url:r.uri,dialogTitle:"Guardar copia"});return "shared"}catch(e){return "cancel"}}
  try{const f=new File([text],name,{type:"application/json"});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return "shared"}}catch(e){if(e&&e.name==="AbortError")return "cancel"}
  try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"application/json"}));a.download=name;document.body.appendChild(a);a.click();a.remove();return "shared"}catch(e){}
  return shareText(name,text)}
/* Sonido en primer plano: campana corta con Web Audio */
let actx=null;
function unlockAudio(){try{if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();if(actx.state==="suspended")actx.resume()}catch(e){}}
function bell(){try{if(!actx)return;const t=actx.currentTime;[0,.22,.44].forEach((d,i)=>{const o=actx.createOscillator(),g=actx.createGain();o.type="sine";o.frequency.value=i===2?1175:880;
  g.gain.setValueAtTime(.0001,t+d);g.gain.exponentialRampToValueAtTime(.35,t+d+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d+.35);o.connect(g);g.connect(actx.destination);o.start(t+d);o.stop(t+d+.4)})}catch(e){}}
let wl=null;async function keepAwake(){try{if(navigator.wakeLock&&!wl){wl=await navigator.wakeLock.request("screen");wl.addEventListener("release",()=>wl=null)}}catch(e){}}

/* Teclado: la hoja inferior y el campo enfocado quedan siempre por encima */
function setKb(h){document.documentElement.style.setProperty("--kb",Math.max(0,Math.round(h))+"px");
  const a=document.activeElement;if(h>0&&a&&/INPUT|TEXTAREA/.test(a.tagName))setTimeout(()=>a.scrollIntoView({block:"center",behavior:"smooth"}),220)}
(function kbInit(){const K=P("Keyboard");
  if(K){K.addListener("keyboardWillShow",i=>setKb(i.keyboardHeight));K.addListener("keyboardDidShow",i=>setKb(i.keyboardHeight));K.addListener("keyboardWillHide",()=>setKb(0))}
  else if(window.visualViewport){const vv=window.visualViewport;vv.addEventListener("resize",()=>setKb(window.innerHeight-vv.height-vv.offsetTop))}
  document.addEventListener("focusin",e=>{if(/INPUT|TEXTAREA/.test(e.target.tagName))setTimeout(()=>e.target.scrollIntoView({block:"center",behavior:"smooth"}),350)});
})();

/* Versión web (iPhone): guardar de forma persistente, offline e invitar a instalar */
const IS_IOS=/iPhone|iPad|iPod/.test(navigator.userAgent),STANDALONE=window.matchMedia&&matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
if(!NATIVE){try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
  if("serviceWorker" in navigator&&location.protocol==="https:")window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}
function installHint(){if(NATIVE||STANDALONE||!IS_IOS)return "";
  return `<div class="card" style="margin-top:16px;--c:var(--accent)"><p class="lbl">Instálala en tu iPhone</p><p class="sub" style="margin-top:6px">En Safari toca <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b>. Así se abre como una app y tus datos se guardan mejor.</p></div>`}
