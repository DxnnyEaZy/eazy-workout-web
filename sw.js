// Offline: guarda la app al instalarla y sirve primero desde caché; se actualiza al publicar una versión nueva.
const V="eazy-workout-2.6-1793136225";
const FILES=["./","index.html","style.css","data.js","store.js","native.js","poses.js","profile.js","ui-core.js","ui-session.js","ui-home.js","ui-progress.js","ui-views.js",
 "fonts/inter-latin-400-normal.woff2","fonts/inter-latin-500-normal.woff2","fonts/jetbrains-mono-latin-400-normal.woff2","fonts/barlow-condensed-latin-900-italic.woff2","fonts/barlow-condensed-latin-700-normal.woff2","manifest.webmanifest","icons/icon-192.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
