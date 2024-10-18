var t;function callListeners(t,e){for(const s of t.slice()){const i=s[2]||0;if(i&exports.SignalListenerFlags.OneShot){const e=s[4]||t,i=e.indexOf(s);-1!==i&&e.splice(i,1)}i&exports.SignalListenerFlags.Deferred?setTimeout((()=>s[0](...s[1]&&e?[...e,...s[1]]:e||s[1]||[])),0):s[0](...s[1]&&e?[...e,...s[1]]:e||s[1]||[])}}Object.defineProperty(exports,'__esModule',{value:!0}),exports.SignalListenerFlags=void 0,(t=exports.SignalListenerFlags||(exports.SignalListenerFlags={}))[t.OneShot=1]='OneShot',t[t.Deferred=2]='Deferred',t[t.None=0]='None',t[t.All=3]='All';class SignalBoy extends(mixinSignalBoy(Object)){}function mixinSignalBoy(t){return class SignalBoy extends t{constructor(){super(...arguments),this.signals={}}listenTo(t,e,s,i=exports.SignalListenerFlags.None,n){var r,a;let o=this.signals[t];const l=[e,s||null,i||exports.SignalListenerFlags.None,null!=n?n:null];o?o.some(((t,s)=>t[0]===e&&(o[s]=l)))||o.push(l):this.signals[t]=o=[l],l[2]&exports.SignalListenerFlags.OneShot&&l.push(o),null===(a=(r=this.constructor).onListener)||void 0===a||a.call(r,this,t,o.indexOf(l),!0)}unlistenTo(t,e,s){var i,n;null==t?t=Object.keys(this.signals):'string'==typeof t&&(t=[t]);const r=null!=s;for(const a of t){const t=this.signals[a];if(t){for(let o=t.length-1;o>=0;o--)e&&t[o][0]!==e||r&&t[o][3]!==s||(null===(n=(i=this.constructor).onListener)||void 0===n||n.call(i,this,a,o,!1),t.splice(o,1));t[0]||delete this.signals[a]}}}isListening(t,e,s){if(null==t)return Object.keys(this.signals).some((t=>this.isListening(t,e,s)));const i=this.signals[t];return!!i&&(!(e&&!i.some((t=>t[0]===e)))&&!(null!=s&&!i.some((t=>t[3]===s))))}sendSignal(t,...e){const s=this.constructor.getListenersFor?this.constructor.getListenersFor(this,t):this.signals[t];s&&callListeners(s,e)}static onListener(t,e,s,i){}}}function askListeners(t,e,s){const i=s&&(s.includes('first')||s.includes('first-true')),n=s&&(i||s.includes('last')),r=s&&s.includes('no-false'),a=s&&s.includes('no-null');let o=[];for(const l of t.slice()){const c=l[2]||0;if(c&exports.SignalListenerFlags.OneShot){const e=l[4]||t,s=e.indexOf(l);-1!==s&&e.splice(s,1)}if(c&exports.SignalListenerFlags.Deferred)setTimeout((()=>l[0](...l[1]&&e?[...e,...l[1]]:e||l[1]||[])),0);else{const t=l[0](...l[1]&&e?[...e,...l[1]]:e||l[1]||[]);if(!t&&(void 0===t||r||a&&null==t))continue;if(n?o[0]=t:o.push(t),i&&(t||!s.includes('first-true')))break}}return n?o[0]:o}class SignalMan extends(mixinSignalMan(Object)){}function mixinSignalMan(t){return class SignalMan extends(mixinSignalBoy(t)){sendSignalAs(t,e,...s){const i='string'==typeof t?[t]:t,n=i.includes('delay')||i.includes('pre-delay'),r=i.includes('first')||i.includes('first-true'),a=i.includes('multi')||!r&&!i.includes('last');if(i.includes('await'))return new Promise((async t=>{n&&await this.afterRefresh(i.includes('delay'));const o=this.constructor.getListenersFor?this.constructor.getListenersFor(this,e):this.signals[e];if(!o)return t(a?[]:void 0);let l=(await Promise.all(askListeners(o,s))).filter((t=>!(void 0===t||null==t&&i.includes('no-null')||!t&&i.includes('no-false'))));r&&i.includes('first-true')&&(l=l.filter((t=>t)));const c=l.length;c?r?t(a?[l[0]]:l[0]):i.includes('last')?t(a?[l[c-1]]:l[c-1]):t(l):t(a?[]:void 0)}));if(!n){const t=this.constructor.getListenersFor?this.constructor.getListenersFor(this,e):this.signals[e];return t?askListeners(t,s,i):i.includes('last')||r?void 0:[]}(async()=>{await this.afterRefresh(i.includes('delay'));const t=this.constructor.getListenersFor?this.constructor.getListenersFor(this,e):this.signals[e];t&&(r?askListeners(t,s,i):callListeners(t,s))})()}afterRefresh(t=!1){return new Promise((e=>setTimeout(t&&this.awaitDelay?async()=>{await this.awaitDelay(),e()}:e,0)))}}}class DataBoy extends(mixinDataBoy(Object)){}function mixinDataBoy(t){return class DataBoy extends t{constructor(){super(...arguments),this.dataListeners=new Map}listenToData(...t){var e;let s=1;const i=t.length,n='boolean'==typeof t[i-s]&&t[i-s++],r='object'==typeof t[0],a=r?t[0]:Array.isArray(t[i-s])?null===(e=t[i-s++])||void 0===e?void 0:e.slice():void 0,o=r?Object.keys(t[0]):t.slice(0,i-s),l=t[i-s];this.dataListeners.set(l,[a,...o]),n&&l(...this.getDataArgsBy(o,a))}unlistenToData(t){return!!this.dataListeners.has(t)&&(this.dataListeners.delete(t),!0)}getInData(t,e=void 0){return e}setInData(t,e,s,i){}refreshData(t,e){t&&('string'==typeof t&&(t=[t]),null!=e?setTimeout((()=>this.callDataBy(t))):this.callDataBy(t))}getDataArgsBy(t,e){return e?Array.isArray(e)?t.map(((t,s)=>this.getInData(t,e[s]))):[t.reduce(((t,s)=>(t[s]=this.getInData(s,e[s]),t)),{})]:t.map(((t,e)=>this.getInData(t)))}callDataBy(t=!0,e){if(e||!this.constructor.callDataListenersFor)for(const[e,[s,...i]]of this.dataListeners.entries())(!0===t||t.some((t=>i.some((e=>e===t||e.startsWith(t+'.')||t.startsWith(e+'.'))))))&&e(...this.getDataArgsBy(i,s));else this.constructor.callDataListenersFor(this,t)}}}class DataMan extends(mixinDataMan(Object)){constructor(t){super(t)}}function mixinDataMan(t){return class DataMan extends(mixinDataBoy(t)){constructor(...t){super(...t.slice(1)),this.dataListeners=new Map,this.dataKeysPending=null,this.data=t[0]||{}}getData(){return this.data}getInData(t,e){if(!this.data)return e;if(!t)return this.data;const s=t.split('.');let i=this.data;for(const t of s){if(!i)return e;i=i[t]}return void 0===i?e:i}setData(t,e=!0,s=!0,i){this.data=!1!==e?Object.assign(Object.assign({},this.data),t):t,s?this.refreshData(!0,i):this.addRefreshKeys(!0)}setInData(t,e,s=!0,i=!0,n){var r;if(t){const i=t.split('.'),n=i.pop();if(!n)return;const a=this.constructor.createPathTo(this,i);if(!a)return;a[n]=s&&(null===(r=a[n])||void 0===r?void 0:r.constructor)===Object?Object.assign(Object.assign({},a[n]),e):e}else this.data=s&&this.data?Object.assign(Object.assign({},this.data),e):e;i?this.refreshData(t||!0,n):this.addRefreshKeys(t||!0)}refreshData(t,e){if(t&&this.addRefreshKeys(t),null!=e)return void setTimeout((()=>this.refreshData(null)),e);const s=this.dataKeysPending;this.dataKeysPending=null,s&&this.callDataBy(s)}addRefreshKeys(t){if(!0===t)this.dataKeysPending=!0;else if(t&&!0!==this.dataKeysPending)if('string'==typeof t&&(t=[t]),this.dataKeysPending)for(const e of t)this.dataKeysPending.some((t=>t===e||e.startsWith(t+'.')))||this.dataKeysPending.push(e);else this.dataKeysPending=[...t]}static createPathTo(t,e){var s;let i=t.data=Object.assign({},t.data);for(const t of e)i=i[t]=(null===(s=i[t])||void 0===s?void 0:s.constructor)===Object?Object.assign({},i[t]):i[t]||{};return i}}}class RefreshCycle extends SignalBoy{constructor(...t){super(),this.state='',this.settings=t[0]||{},this.settings.autoRenewPromise?this.initPromise():this.promise=Promise.resolve(),this.pending=this.settings.initPending?this.settings.initPending():void 0}start(t){if(this.state)return;const e=this.signals;this.setState('waiting'),this._resolve&&this.settings.autoRenewPromise||this.initPromise();const s=void 0===t?void 0===this.nextTimeout?this.settings.defaultTimeout:this.nextTimeout:t;this.extend(s),e.onStart&&this.sendSignal('onStart'),null===s&&this.resolve()}trigger(t,e){const s=void 0===e?void 0===this.nextTimeout?t:this.nextTimeout:e;return this.state?void 0!==s&&this.extend(s,'instant'):this.start(s),this.promise}extend(t,e){switch(this.state){case'':void 0===t?delete this.nextTimeout:this.nextTimeout=t,(!0===e||e&&null===t)&&this.start();break;case'waiting':this.clearTimer(),null===t?e?this.resolve():this.nextTimeout=null:void 0!==t&&(this.timer=setTimeout((()=>{delete this.timer,this.resolve()}),t))}}clearTimer(){delete this.nextTimeout,void 0!==this.timer&&(clearTimeout(this.timer),delete this.timer)}resetPending(){const t=this.pending;return this.pending=this.settings.initPending?this.settings.initPending():void 0,t}resolve(){if('waiting'!==this.state)return;this.setState('resolving'),this.clearTimer();const t=this.resetPending(),e=this.signals;e.onResolve&&this.sendSignal('onResolve');let s=0;const resolvePromise=(t=!1)=>{1&s?t||2&s||'resolving'!==this.state||(s|=2,this.setState(''),this._resolve&&this._resolve()):(s|=t?1:3,t||'resolving'!==this.state||this.setState(''),this._resolve&&this._resolve())};e.onRefresh&&this.sendSignal('onRefresh',t,resolvePromise),resolvePromise(),this.settings.autoRenewPromise&&this.initPromise(),e.onFinish&&this.sendSignal('onFinish',!1)}reject(){if('waiting'!==this.state)return;this.setState('resolving'),this.clearTimer(),this.resetPending();const t=this.signals;t.onResolve&&this.sendSignal('onResolve'),this.setState(''),this.settings.autoRenewPromise?this.initPromise():this._resolve&&this._resolve(),t.onFinish&&this.sendSignal('onFinish',!0)}initPromise(){this._resolve&&this._resolve(),this.promise=new Promise((t=>this._resolve=()=>{delete this._resolve,t()}))}setState(t){this.state=t,this.signals.onState&&this.sendSignal('onState',this.state)}}class Context extends(mixinDataMan(mixinSignalMan(Object))){constructor(t,e){super(t),this.settings=this.constructor.getDefaultSettings(),this.contextAPIs=new Map,this.preDelayCycle=new RefreshCycle,this.delayCycle=new RefreshCycle({autoRenewPromise:!0}),e&&this.modifySettings(e),this.constructor.initializeCyclesFor(this)}modifySettings(t){var e;const s=this.constructor.getDefaultSettings();for(const i in t)this.settings[i]=void 0!==t[i]?t[i]:null!==(e=this.settings[i])&&void 0!==e?e:s[i]}triggerRefresh(t){this.preDelayCycle.trigger(this.settings.refreshTimeout,t)}afterRefresh(t=!1,e){return t&&this.delayCycle.state||this.preDelayCycle.trigger(this.settings.refreshTimeout,e),t?this.delayCycle.promise:this.preDelayCycle.promise}async awaitDelay(){const t=new Set;for(const e of this.contextAPIs.keys())t.add(e.afterRefresh(!0));await Promise.all(t)}refreshData(t,e){t&&this.addRefreshKeys(t),this.triggerRefresh(e)}static getListenersFor(t,e){let s=t.signals[e]||[];for(const[i,n]of t.contextAPIs)for(const t of n){const n=i.constructor.getListenersFor?i.constructor.getListenersFor(i,t+'.'+e):i.signals[t+'.'+e];n&&(s=s.concat(n))}return s[0]&&s}static createPathTo(t,e){switch(t.settings.dataSetMode){case'root':return super.createPathTo(t,e);case'leaf':{let s=t.data;for(const t of e)s=s[t]=s[t]?s[t]:{};return s}case'only':{let s=t.data;for(const t of e){if(!s[t])return;s=s[t]}return s}default:return}}static getDefaultSettings(){return{refreshTimeout:0,dataSetMode:'leaf'}}static initializeCyclesFor(t){t.preDelayCycle.listenTo('onRefresh',((e,s)=>t.constructor.runPreDelayFor(t,s))),t.delayCycle.listenTo('onRefresh',((e,s)=>t.constructor.runDelayFor(t,s))),t.preDelayCycle.listenTo('onFinish',(()=>{t.delayCycle.trigger(),'waiting'===t.delayCycle.state&&(t.awaitDelay?t.awaitDelay().then((()=>t.delayCycle.resolve())):t.delayCycle.resolve())})),t.delayCycle.listenTo('onResolve',(()=>t.preDelayCycle.resolve()))}static runPreDelayFor(t,e){const s=t.dataKeysPending;if(t.dataKeysPending=null,e(),s){for(const[e,[i,...n]]of t.dataListeners.entries())(!0===s||s.some((t=>n.some((e=>e===t||e.startsWith(t+'.')||t.startsWith(e+'.'))))))&&e(...t.getDataArgsBy(n,i));for(const[e,i]of t.contextAPIs.entries())e.callDataBy(!0===s?i:i.reduce(((t,e)=>t.concat(s.map((t=>t?e+'.'+t:e)))),[]))}}static runDelayFor(t,e){}}const createContexts=(t,e)=>{const s={};for(const i in t)s[i]=new Context(t[i],e);return s};class ContextAPI extends(mixinDataBoy(mixinSignalMan(Object))){constructor(t,e){super(),this.contexts=Object.assign({},t),e&&(this.inheritedContexts=Object.assign({},e)),this.dataListeners=new Map}afterRefresh(t=!1,e){return this.awaitDelay?this.awaitDelay():Promise.resolve()}sendSignal(t,...e){var s;const i=t.indexOf('.');-1!==i&&(null===(s=this.getContext(t.slice(0,i)))||void 0===s||s.sendSignal(t.slice(i+1),...e))}sendSignalAs(t,e,...s){const i=e.indexOf('.'),n=-1===i?null:this.getContext(e.slice(0,i));if(n)return n.sendSignalAs(t,e.slice(i+1),...s);const r='string'==typeof t?[t]:t,a=r.includes('last')||r.includes('first')||r.includes('first-true')?void 0:[];return r.includes('await')?Promise.resolve(a):a}getInData(t,e=void 0){const s=t.indexOf('.'),i=this.getContext(-1===s?t:t.slice(0,s));return i?-1===s?i.getData():i.getInData(t.slice(s+1),e):e}setInData(t,e,s,i,n){const r=t.indexOf('.'),a=this.getContext(-1===r?t:t.slice(0,r));a&&(-1===r?a.setData(e,s,i,n):a.setInData(t.slice(r+1),e,s,i,n))}refreshData(t,e){if(!t)return;const s={};for(const e of!0===t?Object.keys(this.getContexts()):'string'==typeof t?[t]:t){const t=e.indexOf('.'),i=-1===t?e:e.slice(0,t);let n=s[i];void 0===n&&(n=s[i]=this.getContext(i)||null),n&&n.addRefreshKeys(-1===t||e.slice(i.length+1))}for(const t in s)s[t]&&s[t].refreshData(null,e)}refreshDataBy(t,e){const s=this.getContexts(t);for(const i in s){const n=s[i];n&&n.refreshData(t[i],e)}}getContext(t,e=!0){return void 0!==this.contexts[t]?this.contexts[t]:e&&this.inheritedContexts?this.inheritedContexts[t]:void 0}getContexts(t,e=!0,s=!1){if(!t)return Object.assign(Object.assign({},e?this.inheritedContexts:void 0),this.contexts);const i=t.constructor===Set?t:t.constructor===Array?new Set(t):new Set(Object.keys(t)),n={},r=e&&this.inheritedContexts?Object.assign(Object.assign({},this.inheritedContexts),this.contexts):this.contexts;for(const t in r)!i.has(t)||void 0===r[t]||s&&null===r[t]||(n[t]=r[t]);return n}newContext(t,e,s,i=!0){const n=new Context(t,e);return s&&this.setContext(s,n,i),n}newContexts(t,e,s=!1,i=!0){const n=createContexts(t,e);return s&&this.setContexts(n,i),n}setContext(t,e,s=!0,i=!1){return void 0!==this.constructor.modifyContexts(this,{[t]:e},s,i)[0]}setContexts(t,e=!0,s=!1){return this.constructor.modifyContexts(this,t,e,s)}setInheritedContexts(t,e=!0,s=!1){const i=s?{}:Object.assign({},this.inheritedContexts);for(const t in i)i[t]=void 0;const n=this.setContexts(Object.assign(Object.assign({},i),t),!1,!0);return e&&n&&this.callDataBy(Object.keys(t)),n}refreshContext(t,e){var s;null===(s=this.getContext(t))||void 0===s||s.triggerRefresh(e)}refreshContexts(t,e){if(!t||Array.isArray(t))for(const s of t||Object.keys(this.getContexts()))this.refreshContext(s,e);else for(const s in t)this.refreshContext(s,void 0===t[s]?e:t[s])}static modifyContexts(t,e,s,i){let n=[];for(const s in e){const r=e[s],a=t.getContext(s),o=i?t.inheritedContexts||(t.inheritedContexts={}):t.contexts;if(a===r){(i?(t.inheritedContexts&&t.inheritedContexts[s])!==r:t.contexts[s]!==r)&&(void 0!==r?o[s]=r:delete o[s]);break}if(a){const e=a.contextAPIs.get(t);if(e){const i=e.filter((t=>t!==s));i.length?a.contextAPIs.set(t,i):a.contextAPIs.delete(t)}}if(r){const e=r.contextAPIs.get(t)||[];e.includes(s)||e.push(s),r.contextAPIs.set(t,e)}void 0!==r?o[s]=r:delete o[s],n.push(s)}return s&&void 0!==n[0]&&t.callDataBy(n),n}static parseContextDataKey(t){const e=t.indexOf('.');return-1===e?[t,'']:[t.slice(0,e),t.slice(e+1)]}static readContextNamesFrom(t,e){return t.reduce(((t,s)=>{const i=s.indexOf('.'),n=-1===i?s:s.slice(0,i);return(e||n&&!t.includes(n))&&t.push(n),t}),[])}static readContextDictionaryFrom(t){const e={};for(const s of t){const[t,i]=ContextAPI.parseContextDataKey(s);!0!==e[t]&&(i?(e[t]||(e[t]=[])).push(i):e[t]=!0)}return e}}exports.Context=Context,exports.ContextAPI=ContextAPI,exports.DataBoy=DataBoy,exports.DataMan=DataMan,exports.RefreshCycle=RefreshCycle,exports.SignalBoy=SignalBoy,exports.SignalMan=SignalMan,exports.askListeners=askListeners,exports.callListeners=callListeners,exports.createContexts=createContexts,exports.mixinDataBoy=mixinDataBoy,exports.mixinDataMan=mixinDataMan,exports.mixinSignalBoy=mixinSignalBoy,exports.mixinSignalMan=mixinSignalMan;
