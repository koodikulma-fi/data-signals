function t(t,e,s){return null!=s?null==t?e.findIndex((t=>t[s]<0)):t<0?e.findIndex((e=>null!=e[s]&&e[s]<0&&e[s]>t)):e.findIndex((e=>null==e[s]||e[s]<0||e[s]>t)):null==t?e.findIndex((t=>t<0)):t<0?e.findIndex((e=>null!=e&&e<0&&e>t)):e.findIndex((e=>null==e||e<0||e>t))}var e,s;function n(t,e,s=-1){if(t===e)return!0;if(t&&s&&'object'==typeof t){if(!e||'object'!=typeof e)return!1;const i=t.constructor;if(i!==e.constructor)return!1;s--;let r=!1;switch(i){case Object:break;case Array:r=!0;break;case Set:r=!0,t=[...t],e=[...e];break;case Map:if(t.size!==e.size)return!1;for(const[i,r]of t){if(!e.has(i))return!1;if(s?!n(e.get(i),r,s):e.get(i)!==r)return!1}return!0;default:const i=t.toString();'[object NodeList]'!==i&&'[object HTMLCollection]'!==i||(r=!0)}if(r){const i=t.length;if(i!==e.length)return!1;for(let r=0;r<i;r++)if(s?!n(t[r],e[r],s):t[r]!==e[r])return!1}else{for(const i in e){if(!t.hasOwnProperty(i))return!1;if(s?!n(t[i],e[i],s):t[i]!==e[i])return!1}for(const s in t)if(!e.hasOwnProperty(s))return!1}return!0}return!1}function i(t,e,s=0){let i,r;const o='string'==typeof s?exports.CompareDataDepthEnum[s]:s;return(...s)=>{const a=t(...s);if(i)if(o<-1){if(-2!==o)return r}else if(n(a,i,o))return r;return i=a,r=e(...i),r}}function r(t,e){for(const s of t.slice()){const n=s[2]||0;if(n&exports.SignalListenerFlags.OneShot){const e=s[4]||t,n=e.indexOf(s);-1!==n&&e.splice(n,1)}n&exports.SignalListenerFlags.Deferred?setTimeout((()=>s[0](...s[1]&&e?[...e,...s[1]]:e||s[1]||[])),0):s[0](...s[1]&&e?[...e,...s[1]]:e||s[1]||[])}}Object.defineProperty(exports,'__esModule',{value:!0}),exports.CompareDataDepthEnum=void 0,(e=exports.CompareDataDepthEnum||(exports.CompareDataDepthEnum={}))[e.never=-3]='never',e[e.always=-2]='always',e[e.deep=-1]='deep',e[e.changed=0]='changed',e[e.shallow=1]='shallow',e[e.double=2]='double',exports.SignalListenerFlags=void 0,(s=exports.SignalListenerFlags||(exports.SignalListenerFlags={}))[s.OneShot=1]='OneShot',s[s.Deferred=2]='Deferred',s[s.None=0]='None',s[s.All=3]='All';class o extends(a(Object)){}function a(t){return class extends t{constructor(){super(...arguments),this.signals={}}listenTo(t,e,s,n=exports.SignalListenerFlags.None,i){var r,o;let a=this.signals[t];const l=[e,s||null,n||exports.SignalListenerFlags.None,null!=i?i:null];a?a.some(((t,s)=>t[0]===e&&(a[s]=l)))||a.push(l):this.signals[t]=a=[l],l[2]&exports.SignalListenerFlags.OneShot&&l.push(a),null===(o=(r=this.constructor).onListener)||void 0===o||o.call(r,this,t,a.indexOf(l),!0)}unlistenTo(t,e,s){var n,i;null==t?t=Object.keys(this.signals):'string'==typeof t&&(t=[t]);const r=null!=s;for(const o of t){const t=this.signals[o];if(t){for(let a=t.length-1;a>=0;a--)e&&t[a][0]!==e||r&&t[a][3]!==s||(null===(i=(n=this.constructor).onListener)||void 0===i||i.call(n,this,o,a,!1),t.splice(a,1));t[0]||delete this.signals[o]}}}isListening(t,e,s){return null==t?Object.keys(this.signals).some((t=>this.isListening(t,e,s))):!!this.signals[t]&&(!(e&&!this.signals[t].some((t=>t[0]===e)))&&!(null!=s&&!this.signals[t].some((t=>t[3]===s))))}sendSignal(t,...e){const s=this.constructor.getListenersFor?this.constructor.getListenersFor(this,t):this.signals[t];s&&r(s,e)}static onListener(t,e,s,n){}}}function l(t,e,s){const n=s&&(s.includes('first')||s.includes('first-true')),i=s&&(n||s.includes('last')),r=s&&s.includes('no-false'),o=s&&s.includes('no-null');let a=[];for(const l of t.slice()){const c=l[2]||0;if(c&exports.SignalListenerFlags.OneShot){const e=l[4]||t,s=e.indexOf(l);-1!==s&&e.splice(s,1)}if(c&exports.SignalListenerFlags.Deferred)setTimeout((()=>l[0](...l[1]&&e?[...e,...l[1]]:e||l[1]||[])),0);else{const t=l[0](...l[1]&&e?[...e,...l[1]]:e||l[1]||[]);if(!t&&(void 0===t||r||o&&null==t))continue;if(i?a[0]=t:a.push(t),n&&(t||!s.includes('first-true')))break}}return i?a[0]:a}class c extends(u(Object)){}function u(t){return class extends(a(t)){sendSignalAs(t,e,...s){const n='string'==typeof t?[t]:t,i=n.includes('delay')||n.includes('pre-delay'),o=n.includes('first')||n.includes('first-true'),a=n.includes('multi')||!o&&!n.includes('last');if(n.includes('await'))return new Promise((async t=>{i&&await this.afterRefresh(n.includes('delay'));const r=this.constructor.getListenersFor?this.constructor.getListenersFor(this,e):this.signals[e];if(!r)return t(a?[]:void 0);let c=(await Promise.all(l(r,s))).filter((t=>!(void 0===t||null==t&&n.includes('no-null')||!t&&n.includes('no-false'))));o&&n.includes('first-true')&&(c=c.filter((t=>t)));const u=c.length;u?o?t(a?[c[0]]:c[0]):n.includes('last')?t(a?[c[u-1]]:c[u-1]):t(c):t(a?[]:void 0)}));if(!i){const t=this.constructor.getListenersFor?this.constructor.getListenersFor(this,e):this.signals[e];return t?l(t,s,n):n.includes('last')||o?void 0:[]}(async()=>{await this.afterRefresh(n.includes('delay'));const t=this.constructor.getListenersFor?this.constructor.getListenersFor(this,e):this.signals[e];t&&(o?l(t,s,n):r(t,s))})()}afterRefresh(t=!1){return new Promise((e=>setTimeout(t&&this.awaitDelay?async()=>{await this.awaitDelay(),e()}:e,0)))}}}class h extends(d(Object)){}function d(t){return class extends t{constructor(){super(...arguments),this.dataListeners=new Map}listenToData(...t){var e;let s=1;const n=t.length,i='boolean'==typeof t[n-s]&&t[n-s++],r='object'==typeof t[0],o=r?t[0]:Array.isArray(t[n-s])?null===(e=t[n-s++])||void 0===e?void 0:e.slice():void 0,a=r?Object.keys(t[0]):t.slice(0,n-s),l=t[n-s];this.dataListeners.set(l,[o,...a]),i&&l(...this.getDataArgsBy(a,o))}unlistenToData(t){return!!this.dataListeners.has(t)&&(this.dataListeners.delete(t),!0)}getInData(t,e=void 0){}setInData(t,e,s,n){}getDataArgsBy(t,e){return e?Array.isArray(e)?t.map(((t,s)=>this.getInData(t,e[s]))):[t.reduce(((t,s)=>(t[s]=this.getInData(s,e[s]),t)),{})]:t.map(((t,e)=>this.getInData(t)))}callDataBy(t=!0,e){if(e||!this.constructor.callDataListenersFor)for(const[e,[s,...n]]of this.dataListeners.entries())(!0===t||t.some((t=>n.some((e=>e===t||e.startsWith(t+'.')||t.startsWith(e+'.'))))))&&e(...this.getDataArgsBy(n,s));else this.constructor.callDataListenersFor(this,t)}}}class f extends(g(Object)){}function g(t){return class extends(d(t)){constructor(...t){super(...t.slice(1)),this.dataListeners=new Map,this.dataKeysPending=null,this.data=t[0]||{}}getData(){return this.data}getInData(t,e){if(!this.data)return e;if(!t)return this.data;const s=t.split('.');let n=this.data;for(const t of s){if(!n)return e;n=n[t]}return void 0===n?e:n}setData(t,e=!0,s=!0,n){this.data=!1!==e?Object.assign(Object.assign({},this.data),t):t,s?this.refreshData(!0,n):this.addRefreshKeys(!0)}setInData(t,e,s=!0,n=!0,i){var r,o;if(t){const n=t.split('.'),i=n.pop();if(!i)return;let a=this.data=Object.assign({},this.data);for(const t of n)a=a[t]=(null===(r=a[t])||void 0===r?void 0:r.constructor)===Object?Object.assign({},a[t]):a[t]||{};a[i]=s&&(null===(o=a[i])||void 0===o?void 0:o.constructor)===Object?Object.assign(Object.assign({},a[i]),e):e}else this.data=s&&this.data?Object.assign(Object.assign({},this.data),e):e;n?this.refreshData(t||!0,i):this.addRefreshKeys(t||!0)}refreshData(t,e){if(t&&this.addRefreshKeys(t),null!=e)return void setTimeout((()=>this.refreshData(null)),e);const s=this.dataKeysPending;this.dataKeysPending=null,s&&this.callDataBy(s)}addRefreshKeys(t){if(!0===t)this.dataKeysPending=!0;else if(t&&!0!==this.dataKeysPending)if('string'==typeof t&&(t=[t]),this.dataKeysPending)for(const e of t)this.dataKeysPending.some((t=>t===e||e.startsWith(t+'.')))||this.dataKeysPending.push(e);else this.dataKeysPending=[...t]}}}class p extends o{constructor(...t){super(),this.promise=Promise.resolve(),this.state='',this.pendingInitializer=t[0],this.pending=this.pendingInitializer?this.pendingInitializer():void 0}trigger(t,e){return this.state?void 0!==e&&this.extend(e):(this.state='waiting',this.promise=new Promise((t=>this._resolvePromise=()=>{delete this._resolvePromise,t()})),this.extend(void 0===e?t:e),this.sendSignal('onStart')),this.promise}extend(t,e=!0){'resolving'!==this.state&&(this.clearTimer(),null===t?this.resolve():this.state?void 0!==t&&(this.timer=setTimeout((()=>{delete this.timer,this.resolve()}),t)):e&&this.trigger(t))}clearTimer(){void 0!==this.timer&&(clearTimeout(this.timer),delete this.timer)}resetPending(){const t=this.pending;return this.pending=this.pendingInitializer?this.pendingInitializer():void 0,t}resolve(){if('waiting'!==this.state)return;this.state='resolving',this.clearTimer();const t=this.resetPending();this.sendSignal('onResolve');let e=0;const s=(t=!1)=>{var s;1&e?t||2&e||'resolving'!==this.state||(e|=2,this.state=''):(e|=t?1:3,t||(this.state=''),null===(s=this._resolvePromise)||void 0===s||s.call(this))};this.sendSignal('onRefresh',t,s),s(),this.sendSignal('onFinish',!1)}reject(){var t;'waiting'===this.state&&(this.state='resolving',this.clearTimer(),this.resetPending(),this.sendSignal('onResolve'),this.state='',null===(t=this._resolvePromise)||void 0===t||t.call(this),this.sendSignal('onFinish',!0))}}class y extends(g(u(Object))){constructor(t,e){super(t),this.settings=this.constructor.getDefaultSettings(),this.contextAPIs=new Map,this.preDelayCycle=new p,this.delayCycle=new p,e&&this.modifySettings(e),this.constructor.initializeCyclesFor(this)}modifySettings(t){var e;const s=this.constructor.getDefaultSettings();for(const n in t)this.settings[n]=void 0!==t[n]?t[n]:null!==(e=this.settings[n])&&void 0!==e?e:s[n]}triggerRefresh(t){this.preDelayCycle.trigger(this.settings.refreshTimeout,t)}afterRefresh(t=!1,e){return t?this.delayCycle.trigger(void 0,e):this.preDelayCycle.trigger(this.settings.refreshTimeout,e)}async awaitDelay(){const t=new Set;for(const e of this.contextAPIs.keys())t.add(e.afterRefresh(!0));await Promise.all(t)}refreshData(t,e){t&&this.addRefreshKeys(t),this.triggerRefresh(e)}static getListenersFor(t,e){let s=t.signals[e]||[];for(const[n,i]of t.contextAPIs)for(const t of i){const i=n.constructor.getListenersFor?n.constructor.getListenersFor(n,t+'.'+e):n.signals[t+'.'+e];i&&(s=s.concat(i))}return s[0]&&s}static getDefaultSettings(){return{refreshTimeout:0}}static initializeCyclesFor(t){t.preDelayCycle.listenTo('onRefresh',((e,s)=>t.constructor.runPreDelayFor(t,s))),t.delayCycle.listenTo('onRefresh',((e,s)=>t.constructor.runDelayFor(t,s))),t.preDelayCycle.listenTo('onFinish',(()=>{t.delayCycle.trigger(),'waiting'===t.delayCycle.state&&(t.awaitDelay?t.awaitDelay().then((()=>t.delayCycle.resolve())):t.delayCycle.resolve())})),t.delayCycle.listenTo('onStart',(()=>t.preDelayCycle.trigger())),t.delayCycle.listenTo('onResolve',(()=>t.preDelayCycle.resolve()))}static runPreDelayFor(t,e){const s=t.dataKeysPending;if(t.dataKeysPending=null,e(),s){for(const[e,[n,...i]]of t.dataListeners.entries())(!0===s||s.some((t=>i.some((e=>e===t||e.startsWith(t+'.')||t.startsWith(e+'.'))))))&&e(...t.getDataArgsBy(i,n));for(const[e,n]of t.contextAPIs.entries())e.callDataBy(!0===s?n:n.reduce(((t,e)=>t.concat(s.map((t=>t?e+'.'+t:e)))),[]))}}static runDelayFor(t,e){}}class x extends(d(u(Object))){constructor(t){super(),this.contexts=Object.assign({},t),this.dataListeners=new Map}afterRefresh(t=!1,e){return this.awaitDelay?this.awaitDelay():Promise.resolve()}sendSignal(t,...e){var s;const n=t.indexOf('.');-1!==n&&(null===(s=this.getContext(t.slice(0,n)))||void 0===s||s.sendSignal(t.slice(n+1),...e))}sendSignalAs(t,e,...s){const n=e.indexOf('.'),i=-1===n?null:this.getContext(e.slice(0,n));if(i)return i.sendSignalAs(t,e.slice(n+1),...s);const r='string'==typeof t?[t]:t,o=r.includes('last')||r.includes('first')||r.includes('first-true')?void 0:[];return r.includes('await')?Promise.resolve(o):o}getInData(t,e=void 0){const s=t.indexOf('.'),n=this.getContext(-1===s?t:t.slice(0,s));return n?-1===s?n.getData():n.getInData(t.slice(s+1),e):e}setInData(t,e,s,n,i){const r=t.indexOf('.'),o=this.getContext(-1===r?t:t.slice(0,r));o&&(-1===r?o.setData(e,s,n,i):o.setInData(t.slice(r+1),e,s,n,i))}refreshData(t,e){var s,n;const i={};for(const e of'string'==typeof t?[t]:t){const t=e.indexOf('.'),n=-1===t?e:e.slice(0,t);void 0!==i[n]&&(i[n]=this.getContext(n)),null===(s=i[n])||void 0===s||s.addRefreshKeys(-1===t||e.slice(n.length+1))}for(const t in i)null===(n=i[t])||void 0===n||n.refreshData(null,e)}refreshDataBy(t,e){const s=this.getContexts(t);for(const n in s){const i=s[n];i&&i.refreshData(t[n],e)}}getContext(t){return this.contexts[t]}getContexts(t,e=!1){if(!t)return Object.assign({},this.contexts);const s=t.constructor===Set?t:t.constructor===Array?new Set(t):new Set(Object.keys(t)),n={};for(const t in this.contexts)!s.has(t)||void 0===this.contexts[t]||e&&null===this.contexts[t]||(n[t]=this.contexts[t]);return n}newContext(t,e,s=!0){const n=new y(t);return e&&this.setContext(e,n,s),n}newContexts(t,e=!1,s=!0){const n={};for(const e in t)n[e]=new y(t[e]);return e&&this.setContexts(n,s),n}setContext(t,e,s=!0){const n=this.contexts[t];if(n===e)return!1;if(n){const e=n.contextAPIs.get(this);if(e){const s=e.filter((e=>e!==t));s.length?n.contextAPIs.set(this,s):n.contextAPIs.delete(this)}}if(e){const s=e.contextAPIs.get(this)||[];s.includes(t)||s.push(t),e.contextAPIs.set(this,s)}return void 0!==e?this.contexts[t]=e:delete this.contexts[t],s&&this.callDataBy([t]),!0}setContexts(t,e=!0){let s=!1;for(const e in t)s=this.setContext(e,t[e],!1)||s;return e&&s&&this.callDataBy(Object.keys(t)),s}static parseContextDataKey(t){const e=t.indexOf('.');return-1===e?[t,'']:[t.slice(0,e),t.slice(e+1)]}static readContextNamesFrom(t){return t.reduce(((t,e)=>{const s=e.indexOf('.'),n=-1===s?e:e.slice(0,s);return n&&!t.includes(n)&&t.push(n),t}),[])}static readContextDictionaryFrom(t){const e={};for(const s of t){const[t,n]=x.parseContextDataKey(s);!0!==e[t]&&(n?(e[t]||(e[t]=[])).push(n):e[t]=!0)}return e}}exports.Context=y,exports.ContextAPI=x,exports.DataBoy=h,exports.DataMan=f,exports.RefreshCycle=p,exports.SignalBoy=o,exports.SignalMan=c,exports.areEqual=n,exports.areEqualBy=function(t,e,s){var i;const r=!t||!e;for(const o in s){const a=s[o],l='number'==typeof a?a:null!==(i=exports.CompareDataDepthEnum[a])&&void 0!==i?i:0;if(l<-1){if(-2===l)return!1}else{if(r)return!t&&!e;if(0===l){if(t[o]!==e[o])return!1}else if(!n(t[o],e[o],l))return!1}}return!0},exports.askListeners=l,exports.callListeners=r,exports.cleanIndex=function(t,e){return e?'number'==typeof t?t<0?Math.max(0,t+e):Math.min(t,e-1):e-1:-1},exports.createCachedSource=function(t,e,s,n=0){const r={};return(...o)=>{const a=s(...o,r);return r[a]||(r[a]=i(t,e,n)),r[a](...o)}},exports.createDataMemo=function(t,e=0){let s,i;const r='string'==typeof e?exports.CompareDataDepthEnum[e]:e;return(...e)=>{if(i)if(r<-1){if(-2!==r)return s}else if(n(i,e,r>=0?r+1:r))return s;return i=e,s=t(...e),s}},exports.createDataSource=i,exports.createDataTrigger=function(t,e,s=1){const i='string'==typeof s?exports.CompareDataDepthEnum[s]:s;let r;return(s,o=!1,a)=>{const l=e;if(i<-1){if(-2!==i)return!1}else if(!o&&n(l,s,i))return!1;return void 0!==a&&(r&&r(l,s),r=void 0,t=a||void 0),e=s,t&&(r=t(s,l)||void 0),!1}},exports.deepCopy=function t(e,s=-1){if(!e||!s||'object'!=typeof e)return e;s--;let n=null;switch(e.constructor){case Object:break;case Array:n=e;break;case Set:return new Set(s?[...e].map((e=>t(e,s))):e);case Map:return new Map(s?[...e].map((([e,n])=>[t(e,s),t(n,s)])):e);default:const i=e.toString();'[object NodeList]'!==i&&'[object HTMLCollection]'!==i||(n=[...e])}if(n)return s?n.map((e=>t(e,s))):[...n];if(!s)return Object.assign({},e);const i=new e.constructor;for(const n in e)i[n]=t(e[n],s);return i},exports.mixinDataBoy=d,exports.mixinDataMan=g,exports.mixinSignalBoy=a,exports.mixinSignalMan=u,exports.numberRange=function(t,e,s=1,n=!1){const i=s<0;let[r,o]=null==e?[0,t]:[t,e];const a=r<o;s=s?a!==i?s:-s:a?1:-1;const l=[];if(n)for(;a?r<=o:r>=o;)l.push(r),r+=s;else for(;a?r<o:r>o;)l.push(r),r+=s;return i&&l.reverse(),l},exports.orderArray=function(e,s){const n=[],i='string'==typeof s;for(let r=0,o=e.length;r<o;r++){const o=i?e[r][s]:s[r],a=t(o,n,0);-1===a?n.push([o,e[r]]):n.splice(a,0,[o,e[r]])}return n.map((t=>t[1]))},exports.orderedIndex=t;
