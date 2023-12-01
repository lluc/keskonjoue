try{self["workbox:core:6.5.4"]&&_()}catch{}const B=(s,...e)=>{let t=s;return e.length>0&&(t+=` :: ${JSON.stringify(e)}`),t},H=B;class h extends Error{constructor(e,t){const n=H(e,t);super(n),this.name=e,this.details=t}}try{self["workbox:routing:6.5.4"]&&_()}catch{}const q="GET",E=s=>s&&typeof s=="object"?s:{handle:s},$=s=>new URL(String(s),location.href).href.replace(new RegExp(`^${location.origin}`),"");class V{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",e=>{const{request:t}=e,n=this.handleRequest({request:t,event:e});n&&e.respondWith(n)})}addCacheListener(){self.addEventListener("message",e=>{if(e.data&&e.data.type==="CACHE_URLS"){const{payload:t}=e.data,n=Promise.all(t.urlsToCache.map(r=>{typeof r=="string"&&(r=[r]);const a=new Request(...r);return this.handleRequest({request:a,event:e})}));e.waitUntil(n),e.ports&&e.ports[0]&&n.then(()=>e.ports[0].postMessage(!0))}})}handleRequest({request:e,event:t}){const n=new URL(e.url,location.href);if(!n.protocol.startsWith("http"))return;const r=n.origin===location.origin,{params:a,route:c}=this.findMatchingRoute({event:t,request:e,sameOrigin:r,url:n});let i=c&&c.handler;const o=e.method;if(!i&&this._defaultHandlerMap.has(o)&&(i=this._defaultHandlerMap.get(o)),!i)return;let l;try{l=i.handle({url:n,request:e,event:t,params:a})}catch(u){l=Promise.reject(u)}const p=c&&c.catchHandler;return l instanceof Promise&&(this._catchHandler||p)&&(l=l.catch(async u=>{if(p)try{return await p.handle({url:n,request:e,event:t,params:a})}catch(D){D instanceof Error&&(u=D)}if(this._catchHandler)return this._catchHandler.handle({url:n,request:e,event:t});throw u})),l}findMatchingRoute({url:e,sameOrigin:t,request:n,event:r}){const a=this._routes.get(n.method)||[];for(const c of a){let i;const o=c.match({url:e,sameOrigin:t,request:n,event:r});if(o)return i=o,(Array.isArray(i)&&i.length===0||o.constructor===Object&&Object.keys(o).length===0||typeof o=="boolean")&&(i=void 0),{route:c,params:i}}return{}}setDefaultHandler(e,t=q){this._defaultHandlerMap.set(t,E(e))}setCatchHandler(e){this._catchHandler=E(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new h("unregister-route-but-not-found-with-method",{method:e.method});const t=this._routes.get(e.method).indexOf(e);if(t>-1)this._routes.get(e.method).splice(t,1);else throw new h("unregister-route-route-not-registered")}}let g;const v=()=>(g||(g=new V,g.addFetchListener(),g.addCacheListener()),g);try{self["workbox:strategies:6.5.4"]&&_()}catch{}const f={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:typeof registration!="undefined"?registration.scope:""},b=s=>[f.prefix,s,f.suffix].filter(e=>e&&e.length>0).join("-"),G=s=>{for(const e of Object.keys(f))s(e)},I={updateDetails:s=>{G(e=>{typeof s[e]=="string"&&(f[e]=s[e])})},getGoogleAnalyticsName:s=>s||b(f.googleAnalytics),getPrecacheName:s=>s||b(f.precache),getPrefix:()=>f.prefix,getRuntimeName:s=>s||b(f.runtime),getSuffix:()=>f.suffix};function M(s,e){const t=new URL(s);for(const n of e)t.searchParams.delete(n);return t.href}async function Q(s,e,t,n){const r=M(e.url,t);if(e.url===r)return s.match(e,n);const a=Object.assign(Object.assign({},n),{ignoreSearch:!0}),c=await s.keys(e,a);for(const i of c){const o=M(i.url,t);if(r===o)return s.match(i,n)}}class z{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}const J=new Set;async function X(){for(const s of J)await s()}function A(s){return new Promise(e=>setTimeout(e,s))}function m(s){return typeof s=="string"?new Request(s):s}class Y{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new z,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const n of this._plugins)this._pluginStateMap.set(n,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:t}=this;let n=m(e);if(n.mode==="navigate"&&t instanceof FetchEvent&&t.preloadResponse){const c=await t.preloadResponse;if(c)return c}const r=this.hasCallback("fetchDidFail")?n.clone():null;try{for(const c of this.iterateCallbacks("requestWillFetch"))n=await c({request:n.clone(),event:t})}catch(c){if(c instanceof Error)throw new h("plugin-error-request-will-fetch",{thrownErrorMessage:c.message})}const a=n.clone();try{let c;c=await fetch(n,n.mode==="navigate"?void 0:this._strategy.fetchOptions);for(const i of this.iterateCallbacks("fetchDidSucceed"))c=await i({event:t,request:a,response:c});return c}catch(c){throw r&&await this.runCallbacks("fetchDidFail",{error:c,event:t,originalRequest:r.clone(),request:a.clone()}),c}}async fetchAndCachePut(e){const t=await this.fetch(e),n=t.clone();return this.waitUntil(this.cachePut(e,n)),t}async cacheMatch(e){const t=m(e);let n;const{cacheName:r,matchOptions:a}=this._strategy,c=await this.getCacheKey(t,"read"),i=Object.assign(Object.assign({},a),{cacheName:r});n=await caches.match(c,i);for(const o of this.iterateCallbacks("cachedResponseWillBeUsed"))n=await o({cacheName:r,matchOptions:a,cachedResponse:n,request:c,event:this.event})||void 0;return n}async cachePut(e,t){const n=m(e);await A(0);const r=await this.getCacheKey(n,"write");if(!t)throw new h("cache-put-with-no-response",{url:$(r.url)});const a=await this._ensureResponseSafeToCache(t);if(!a)return!1;const{cacheName:c,matchOptions:i}=this._strategy,o=await self.caches.open(c),l=this.hasCallback("cacheDidUpdate"),p=l?await Q(o,r.clone(),["__WB_REVISION__"],i):null;try{await o.put(r,l?a.clone():a)}catch(u){if(u instanceof Error)throw u.name==="QuotaExceededError"&&await X(),u}for(const u of this.iterateCallbacks("cacheDidUpdate"))await u({cacheName:c,oldResponse:p,newResponse:a.clone(),request:r,event:this.event});return!0}async getCacheKey(e,t){const n=`${e.url} | ${t}`;if(!this._cacheKeys[n]){let r=e;for(const a of this.iterateCallbacks("cacheKeyWillBeUsed"))r=m(await a({mode:t,request:r,event:this.event,params:this.params}));this._cacheKeys[n]=r}return this._cacheKeys[n]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const n of this.iterateCallbacks(e))await n(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if(typeof t[e]=="function"){const n=this._pluginStateMap.get(t);yield a=>{const c=Object.assign(Object.assign({},a),{state:n});return t[e](c)}}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,n=!1;for(const r of this.iterateCallbacks("cacheWillUpdate"))if(t=await r({request:this.request,response:t,event:this.event})||void 0,n=!0,!t)break;return n||t&&t.status!==200&&(t=void 0),t}}class F{constructor(e={}){this.cacheName=I.getRuntimeName(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,n=typeof e.request=="string"?new Request(e.request):e.request,r="params"in e?e.params:void 0,a=new Y(this,{event:t,request:n,params:r}),c=this._getResponse(a,n,t),i=this._awaitComplete(c,a,n,t);return[c,i]}async _getResponse(e,t,n){await e.runCallbacks("handlerWillStart",{event:n,request:t});let r;try{if(r=await this._handle(t,e),!r||r.type==="error")throw new h("no-response",{url:t.url})}catch(a){if(a instanceof Error){for(const c of e.iterateCallbacks("handlerDidError"))if(r=await c({error:a,event:n,request:t}),r)break}if(!r)throw a}for(const a of e.iterateCallbacks("handlerWillRespond"))r=await a({event:n,request:t,response:r});return r}async _awaitComplete(e,t,n,r){let a,c;try{a=await e}catch{}try{await t.runCallbacks("handlerDidRespond",{event:r,request:n,response:a}),await t.doneWaiting()}catch(i){i instanceof Error&&(c=i)}if(await t.runCallbacks("handlerDidComplete",{event:r,request:n,response:a,error:c}),t.destroy(),c)throw c}}try{self["workbox:cacheable-response:6.5.4"]&&_()}catch{}const Z=(s,e)=>e.some(t=>s instanceof t);let x,N;function ee(){return x||(x=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function te(){return N||(N=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const j=new WeakMap,U=new WeakMap,W=new WeakMap,R=new WeakMap,K=new WeakMap;function se(s){const e=new Promise((t,n)=>{const r=()=>{s.removeEventListener("success",a),s.removeEventListener("error",c)},a=()=>{t(w(s.result)),r()},c=()=>{n(s.error),r()};s.addEventListener("success",a),s.addEventListener("error",c)});return e.then(t=>{t instanceof IDBCursor&&j.set(t,s)}).catch(()=>{}),K.set(e,s),e}function ne(s){if(U.has(s))return;const e=new Promise((t,n)=>{const r=()=>{s.removeEventListener("complete",a),s.removeEventListener("error",c),s.removeEventListener("abort",c)},a=()=>{t(),r()},c=()=>{n(s.error||new DOMException("AbortError","AbortError")),r()};s.addEventListener("complete",a),s.addEventListener("error",c),s.addEventListener("abort",c)});U.set(s,e)}let T={get(s,e,t){if(s instanceof IDBTransaction){if(e==="done")return U.get(s);if(e==="objectStoreNames")return s.objectStoreNames||W.get(s);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return w(s[e])},set(s,e,t){return s[e]=t,!0},has(s,e){return s instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in s}};function re(s){T=s(T)}function ae(s){return s===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const n=s.call(C(this),e,...t);return W.set(n,e.sort?e.sort():[e]),w(n)}:te().includes(s)?function(...e){return s.apply(C(this),e),w(j.get(this))}:function(...e){return w(s.apply(C(this),e))}}function ce(s){return typeof s=="function"?ae(s):(s instanceof IDBTransaction&&ne(s),Z(s,ee())?new Proxy(s,T):s)}function w(s){if(s instanceof IDBRequest)return se(s);if(R.has(s))return R.get(s);const e=ce(s);return e!==s&&(R.set(s,e),K.set(e,s)),e}const C=s=>K.get(s),ie=["get","getKey","getAll","getAllKeys","count"],oe=["put","add","delete","clear"],k=new Map;function O(s,e){if(!(s instanceof IDBDatabase&&!(e in s)&&typeof e=="string"))return;if(k.get(e))return k.get(e);const t=e.replace(/FromIndex$/,""),n=e!==t,r=oe.includes(t);if(!(t in(n?IDBIndex:IDBObjectStore).prototype)||!(r||ie.includes(t)))return;const a=async function(c,...i){const o=this.transaction(c,r?"readwrite":"readonly");let l=o.store;return n&&(l=l.index(i.shift())),(await Promise.all([l[t](...i),r&&o.done]))[0]};return k.set(e,a),a}re(s=>({...s,get:(e,t,n)=>O(e,t)||s.get(e,t,n),has:(e,t)=>!!O(e,t)||s.has(e,t)}));try{self["workbox:expiration:6.5.4"]&&_()}catch{}try{self["workbox:recipes:6.5.4"]&&_()}catch{}function le(s){v().setCatchHandler(s)}function S(s,e){const t=e();return s.waitUntil(t),t}try{self["workbox:precaching:6.5.4"]&&_()}catch{}const he="__WB_REVISION__";function ue(s){if(!s)throw new h("add-to-cache-list-unexpected-type",{entry:s});if(typeof s=="string"){const a=new URL(s,location.href);return{cacheKey:a.href,url:a.href}}const{revision:e,url:t}=s;if(!t)throw new h("add-to-cache-list-unexpected-type",{entry:s});if(!e){const a=new URL(t,location.href);return{cacheKey:a.href,url:a.href}}const n=new URL(t,location.href),r=new URL(t,location.href);return n.searchParams.set(he,e),{cacheKey:n.href,url:r.href}}class fe{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:n})=>{if(e.type==="install"&&t&&t.originalRequest&&t.originalRequest instanceof Request){const r=t.originalRequest.url;n?this.notUpdatedURLs.push(r):this.updatedURLs.push(r)}return n}}}class de{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:t,params:n})=>{const r=(n==null?void 0:n.cacheKey)||this._precacheController.getCacheKeyForURL(t.url);return r?new Request(r,{headers:t.headers}):t},this._precacheController=e}}let y;function pe(){if(y===void 0){const s=new Response("");if("body"in s)try{new Response(s.body),y=!0}catch{y=!1}y=!1}return y}async function ge(s,e){let t=null;if(s.url&&(t=new URL(s.url).origin),t!==self.location.origin)throw new h("cross-origin-copy-response",{origin:t});const n=s.clone(),r={headers:new Headers(n.headers),status:n.status,statusText:n.statusText},a=e?e(r):r,c=pe()?n.body:await n.blob();return new Response(c,a)}class d extends F{constructor(e={}){e.cacheName=I.getPrecacheName(e.cacheName),super(e),this._fallbackToNetwork=e.fallbackToNetwork!==!1,this.plugins.push(d.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const n=await t.cacheMatch(e);return n||(t.event&&t.event.type==="install"?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,t){let n;const r=t.params||{};if(this._fallbackToNetwork){const a=r.integrity,c=e.integrity,i=!c||c===a;n=await t.fetch(new Request(e,{integrity:e.mode!=="no-cors"?c||a:void 0})),a&&i&&e.mode!=="no-cors"&&(this._useDefaultCacheabilityPluginIfNeeded(),await t.cachePut(e,n.clone()))}else throw new h("missing-precache-entry",{cacheName:this.cacheName,url:e.url});return n}async _handleInstall(e,t){this._useDefaultCacheabilityPluginIfNeeded();const n=await t.fetch(e);if(!await t.cachePut(e,n.clone()))throw new h("bad-precaching-response",{url:e.url,status:n.status});return n}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[n,r]of this.plugins.entries())r!==d.copyRedirectedCacheableResponsesPlugin&&(r===d.defaultPrecacheCacheabilityPlugin&&(e=n),r.cacheWillUpdate&&t++);t===0?this.plugins.push(d.defaultPrecacheCacheabilityPlugin):t>1&&e!==null&&this.plugins.splice(e,1)}}d.defaultPrecacheCacheabilityPlugin={async cacheWillUpdate({response:s}){return!s||s.status>=400?null:s}};d.copyRedirectedCacheableResponsesPlugin={async cacheWillUpdate({response:s}){return s.redirected?await ge(s):s}};class ye{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:n=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new d({cacheName:I.getPrecacheName(e),plugins:[...t,new de({precacheController:this})],fallbackToNetwork:n}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const t=[];for(const n of e){typeof n=="string"?t.push(n):n&&n.revision===void 0&&t.push(n.url);const{cacheKey:r,url:a}=ue(n),c=typeof n!="string"&&n.revision?"reload":"default";if(this._urlsToCacheKeys.has(a)&&this._urlsToCacheKeys.get(a)!==r)throw new h("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(a),secondEntry:r});if(typeof n!="string"&&n.integrity){if(this._cacheKeysToIntegrities.has(r)&&this._cacheKeysToIntegrities.get(r)!==n.integrity)throw new h("add-to-cache-list-conflicting-integrities",{url:a});this._cacheKeysToIntegrities.set(r,n.integrity)}if(this._urlsToCacheKeys.set(a,r),this._urlsToCacheModes.set(a,c),t.length>0){const i=`Workbox is precaching URLs without revision info: ${t.join(", ")}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(i)}}}install(e){return S(e,async()=>{const t=new fe;this.strategy.plugins.push(t);for(const[a,c]of this._urlsToCacheKeys){const i=this._cacheKeysToIntegrities.get(c),o=this._urlsToCacheModes.get(a),l=new Request(a,{integrity:i,cache:o,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:c},request:l,event:e}))}const{updatedURLs:n,notUpdatedURLs:r}=t;return{updatedURLs:n,notUpdatedURLs:r}})}activate(e){return S(e,async()=>{const t=await self.caches.open(this.strategy.cacheName),n=await t.keys(),r=new Set(this._urlsToCacheKeys.values()),a=[];for(const c of n)r.has(c.url)||(await t.delete(c),a.push(c.url));return{deletedURLs:a}})}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const t=e instanceof Request?e.url:e,n=this.getCacheKeyForURL(t);if(n)return(await self.caches.open(this.strategy.cacheName)).match(n)}createHandlerBoundToURL(e){const t=this.getCacheKeyForURL(e);if(!t)throw new h("non-precached-url",{url:e});return n=>(n.request=new Request(e),n.params=Object.assign({cacheKey:t},n.params),this.strategy.handle(n))}}let L;const we=()=>(L||(L=new ye),L);function P(s){return we().matchPrecache(s)}function me(s={}){const e=s.pageFallback||"offline.html",t=s.imageFallback||!1,n=s.fontFallback||!1;self.addEventListener("install",a=>{const c=[e];t&&c.push(t),n&&c.push(n),a.waitUntil(self.caches.open("workbox-offline-fallbacks").then(i=>i.addAll(c)))}),le(async a=>{const c=a.request.destination,i=await self.caches.open("workbox-offline-fallbacks");return c==="document"?await P(e)||await i.match(e)||Response.error():c==="image"&&t!==!1?await P(t)||await i.match(t)||Response.error():c==="font"&&n!==!1&&(await P(n)||await i.match(n))||Response.error()})}function be(s){v().setDefaultHandler(s)}class Re extends F{constructor(e={}){super(e),this._networkTimeoutSeconds=e.networkTimeoutSeconds||0}async _handle(e,t){let n,r;try{const a=[t.fetch(e)];if(this._networkTimeoutSeconds){const c=A(this._networkTimeoutSeconds*1e3);a.push(c)}if(r=await Promise.race(a),!r)throw new Error(`Timed out the network response after ${this._networkTimeoutSeconds} seconds.`)}catch(a){a instanceof Error&&(n=a)}if(!r)throw new h("no-response",{url:e.url,error:n});return r}}const Ce=[{"revision":null,"url":"assets/index.17649a23.js"},{"revision":null,"url":"assets/index.62f502b0.css"},{"revision":"962ba10cb115103b48532e25367ac434","url":"index.html"},{"revision":"a003ba854e1732c1d4a092b796f322f1","url":"offline.html"},{"revision":"cb3fa123be73b4605f59a072a2500389","url":"images/pwa/icon-maskable.png"},{"revision":"f2d3e1038be35c6c04c543e45bf31d49","url":"images/pwa/icon-72x72.png"},{"revision":"f9d7e2f668c15d1e6f6e5f0f2156f8b1","url":"images/pwa/icon-96x96.png"},{"revision":"8f882d01c5a7fff1c27c03f5e4ba5e74","url":"images/pwa/icon-128x128.png"},{"revision":"44202967b2d0b625ce4d73853874b6c2","url":"images/pwa/icon-144x144.png"},{"revision":"1370bc8c6d9c34f5694abe675b5f06b4","url":"images/pwa/icon-152x152.png"},{"revision":"726242e6393d8392fa076e8971a9b0d5","url":"images/pwa/icon-192x192.png"},{"revision":"ce8b67535246b691e801adb6bdfe48b2","url":"images/pwa/icon-384x384.png"},{"revision":"cb3fa123be73b4605f59a072a2500389","url":"images/pwa/icon-512x512.png"},{"revision":"0e40805c66b97b3d06fa339e880d5afd","url":"manifest.webmanifest"}];console.log(Ce);be(new Re);me({pageFallback:"/offline.html"});
