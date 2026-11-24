const t=globalThis,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let n=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const i=this.t;if(e&&void 0===t){const e=void 0!==i&&1===i.length;e&&(t=s.get(i)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&s.set(i,t))}return t}toString(){return this.cssText}};const o=(t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new n(s,t,i)},r=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,i))(e)})(t):t,{is:a,defineProperty:h,getOwnPropertyDescriptor:l,getOwnPropertyNames:c,getOwnPropertySymbols:d,getPrototypeOf:u}=Object,p=globalThis,_=p.trustedTypes,f=_?_.emptyScript:"",g=p.reactiveElementPolyfillSupport,m=(t,e)=>t,$={toAttribute(t,e){switch(e){case Boolean:t=t?f:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},v=(t,e)=>!a(t,e),y={attribute:!0,type:String,converter:$,reflect:!1,useDefault:!1,hasChanged:v};Symbol.metadata??=Symbol("metadata"),p.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&h(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=l(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const o=s?.call(this);n?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(m("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(m("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m("properties"))){const t=this.properties,e=[...c(t),...d(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(r(t))}else void 0!==t&&e.push(r(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{if(e)i.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of s){const s=document.createElement("style"),n=t.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=e.cssText,i.appendChild(s)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:$).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:$;this._$Em=s;const o=n.fromAttribute(e,t.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const o=this.constructor;if(!1===s&&(n=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??v)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==n||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[m("elementProperties")]=new Map,b[m("finalized")]=new Map,g?.({ReactiveElement:b}),(p.reactiveElementVersions??=[]).push("2.1.2");const A=globalThis,w=t=>t,E=A.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,x="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+C,U=`<${P}>`,R=document,M=()=>R.createComment(""),T=t=>null===t||"object"!=typeof t&&"function"!=typeof t,k=Array.isArray,N="[ \t\n\f\r]",O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,H=/-->/g,L=/>/g,z=RegExp(`>|${N}(?:([^\\s"'>=/]+)(${N}*=${N}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),D=/'/g,j=/"/g,B=/^(?:script|style|textarea|title)$/i,I=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),V=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),q=new WeakMap,F=R.createTreeWalker(R,129);function J(t,e){if(!k(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const K=(t,e)=>{const i=t.length-1,s=[];let n,o=2===e?"<svg>":3===e?"<math>":"",r=O;for(let e=0;e<i;e++){const i=t[e];let a,h,l=-1,c=0;for(;c<i.length&&(r.lastIndex=c,h=r.exec(i),null!==h);)c=r.lastIndex,r===O?"!--"===h[1]?r=H:void 0!==h[1]?r=L:void 0!==h[2]?(B.test(h[2])&&(n=RegExp("</"+h[2],"g")),r=z):void 0!==h[3]&&(r=z):r===z?">"===h[0]?(r=n??O,l=-1):void 0===h[1]?l=-2:(l=r.lastIndex-h[2].length,a=h[1],r=void 0===h[3]?z:'"'===h[3]?j:D):r===j||r===D?r=z:r===H||r===L?r=O:(r=z,n=void 0);const d=r===z&&t[e+1].startsWith("/>")?" ":"";o+=r===O?i+U:l>=0?(s.push(a),i.slice(0,l)+x+i.slice(l)+C+d):i+C+(-2===l?e:d)}return[J(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Z{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,o=0;const r=t.length-1,a=this.parts,[h,l]=K(t,e);if(this.el=Z.createElement(h,i),F.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=F.nextNode())&&a.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(x)){const e=l[o++],i=s.getAttribute(t).split(C),r=/([.?@])?(.*)/.exec(e);a.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?tt:"?"===r[1]?et:"@"===r[1]?it:Y}),s.removeAttribute(t)}else t.startsWith(C)&&(a.push({type:6,index:n}),s.removeAttribute(t));if(B.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],M()),F.nextNode(),a.push({type:2,index:++n});s.append(t[e],M())}}}else if(8===s.nodeType)if(s.data===P)a.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)a.push({type:7,index:n}),t+=C.length-1}n++}}static createElement(t,e){const i=R.createElement("template");return i.innerHTML=t,i}}function G(t,e,i=t,s){if(e===V)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const o=T(e)?void 0:e._$litDirective$;return n?.constructor!==o&&(n?._$AO?.(!1),void 0===o?n=void 0:(n=new o(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=G(t,n._$AS(t,e.values),n,s)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??R).importNode(e,!0);F.currentNode=s;let n=F.nextNode(),o=0,r=0,a=i[0];for(;void 0!==a;){if(o===a.index){let e;2===a.type?e=new X(n,n.nextSibling,this,t):1===a.type?e=new a.ctor(n,a.name,a.strings,this,t):6===a.type&&(e=new st(n,this,t)),this._$AV.push(e),a=i[++r]}o!==a?.index&&(n=F.nextNode(),o++)}return F.currentNode=R,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=G(this,t,e),T(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==V&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>k(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&T(this._$AH)?this._$AA.nextSibling.data=t:this.T(R.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Z.createElement(J(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Q(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=q.get(t.strings);return void 0===e&&q.set(t.strings,e=new Z(t)),e}k(t){k(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new X(this.O(M()),this.O(M()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=w(t).nextSibling;w(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class Y{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(t,e=this,i,s){const n=this.strings;let o=!1;if(void 0===n)t=G(this,t,e,0),o=!T(t)||t!==this._$AH&&t!==V,o&&(this._$AH=t);else{const s=t;let r,a;for(t=n[0],r=0;r<n.length-1;r++)a=G(this,s[i+r],e,r),a===V&&(a=this._$AH[r]),o||=!T(a)||a!==this._$AH[r],a===W?t=W:t!==W&&(t+=(a??"")+n[r+1]),this._$AH[r]=a}o&&!s&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class tt extends Y{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class et extends Y{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class it extends Y{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=G(this,t,e,0)??W)===V)return;const i=this._$AH,s=t===W&&i!==W||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==W&&(i===W||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class st{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){G(this,t)}}const nt=A.litHtmlPolyfillSupport;nt?.(Z,X),(A.litHtmlVersions??=[]).push("3.3.3");const ot=globalThis;class rt extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new X(e.insertBefore(M(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}rt._$litElement$=!0,rt.finalized=!0,ot.litElementHydrateSupport?.({LitElement:rt});const at=ot.litElementPolyfillSupport;at?.({LitElement:rt}),(ot.litElementVersions??=[]).push("4.2.2");const ht={en:{arriving:"Arriving",noService:"No service",directionMissing:"Direction not found",unavailable:"Unavailable",min:"min",updatedJustNow:"Updated just now",updatedAgo:t=>`Updated ${t} min ago`,refresh:"Refresh"},th:{arriving:"มาถึงแล้ว",noService:"ไม่มีบริการ",directionMissing:"ไม่พบทิศทาง",unavailable:"ไม่พร้อมใช้งาน",min:"นาที",updatedJustNow:"อัปเดตเมื่อสักครู่",updatedAgo:t=>`อัปเดต ${t} นาทีที่แล้ว`,refresh:"รีเฟรช"}},lt=/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/,ct=["auto","en","th"];function dt(t){if("string"!=typeof t)return null;const e=lt.exec(t.trim());if(!e)return null;const[i,s,n,o,r]=e.slice(1).map(Number);return s<1||s>12||i<1||i>31||o>23||r>59?null:Date.UTC(n,s-1,i,o-7,r)}function ut(t){const e=t??{},i=e.entities;if(!Array.isArray(i)||0===i.length||!i.every(t=>"string"==typeof t&&t.length>0))throw new Error("entities must be a non-empty list of entity ids");const s="number"==typeof e.trains&&Number.isFinite(e.trains)?Math.min(3,Math.max(1,Math.round(e.trains))):3,n=ct.includes(e.language)?e.language:"auto",o={type:"string"==typeof e.type?e.type:"custom:bts-arrival-card",entities:[...i],trains:s,language:n,auto_refresh:!0===e.auto_refresh};return"string"==typeof e.title&&e.title&&(o.title=e.title),o}const pt="bts-arrival-card",_t="bts-arrival-card-editor";function ft(t){return Object.values(t.entities??{}).filter(e=>"bts_arrival_time"===e.platform&&Array.isArray(t.states[e.entity_id]?.attributes.upcoming)).map(t=>t.entity_id).sort()}function gt(t,e){const i=t?.attributes[e];return"string"==typeof i?i:""}class mt extends rt{constructor(){super(...arguments),this._refreshing=!1,this._cooldown=!1,this._autoRefreshPending=!1,this._onVisibilityChange=()=>{"visible"===document.visibilityState&&(this._autoRefreshPending=!0,this._maybeAutoRefresh())}}static getConfigElement(){return document.createElement(_t)}static getStubConfig(t){return{entities:ft(t).slice(0,1)}}setConfig(t){this._config=ut(t)}getCardSize(){return this._config?this._config.entities.length+(this._config.title?1:0)+1:1}connectedCallback(){super.connectedCallback(),this._tick=setInterval(()=>this.requestUpdate(),3e4),this._autoRefreshPending=!0,document.addEventListener("visibilitychange",this._onVisibilityChange),this._maybeAutoRefresh()}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this._tick),clearTimeout(this._cooldownTimer),this._cooldown=!1,document.removeEventListener("visibilitychange",this._onVisibilityChange)}_maybeAutoRefresh(){this._autoRefreshPending&&this._config&&(this._config.auto_refresh&&"hidden"!==document.visibilityState?this._hassReady()&&(this._autoRefreshPending=!1,this._refresh(!0).catch(()=>{})):this._autoRefreshPending=!1)}_hassReady(){const t=this.hass;return!(!t||!1===t.connected)&&(!t.services||!!t.services.homeassistant?.update_entity)}shouldUpdate(t){if(this._maybeAutoRefresh(),!this._config)return!1;if(!t.has("hass")||t.size>1)return!0;const e=t.get("hass");return!e||!this.hass||(e.locale?.language!==this.hass.locale?.language||this._config.entities.some(t=>e.states[t]!==this.hass.states[t]))}get _lang(){return t=this._config?.language,e=this.hass?.locale?.language??"en","en"===t||"th"===t?t:e.toLowerCase().startsWith("th")?"th":"en";var t,e}render(){if(!this._config||!this.hass)return W;const t=this._lang,e=this._config.entities.map(t=>this.hass.states[t]);return I`
      <ha-card .header=${this._config.title}>
        <div class="rows ${this._config.title?"":"no-header"}">
          ${this._config.entities.map((i,s)=>this._renderRow(i,e[s],t))}
        </div>
        ${this._renderFooter(e,t)}
      </ha-card>
    `}_renderRow(t,e,i){const s=function(t){return!t||"unavailable"===t.state||"unknown"===t.state&&!0!==t.attributes.no_service?"unavailable":!0===t.attributes.platform_missing?"direction_missing":!0===t.attributes.no_service?"no_service":"ok"}(e),n=ht[i],o="th"===i&&gt(e,"station_name_th")||gt(e,"station_name"),r="th"===i&&gt(e,"destination_name_th")||gt(e,"destination_name"),a=o&&r?`${o} → ${r}`:o||t,h=gt(e,"line_color")||"var(--primary-color)";let l;if("ok"===s){const t=function(t,e,i){return Array.isArray(t)?t.slice(0,e).map(t=>{const e=t?.status,s=Number(t?.minutes);return"arriving"===e||"arrival"===e||Number.isFinite(s)&&s<=0?ht[i].arriving:String(t?.minutes??"")}):[]}(e.attributes.upcoming,this._config.trains,i),s=t.every(t=>t===n.arriving);l=I`<span class="times"
        >${t.join(" · ")}${t.length&&!s?` ${n.min}`:""}</span
      >`}else{const t={unavailable:n.unavailable,direction_missing:n.directionMissing,no_service:n.noService}[s];l=I`<span class="times muted">${t}</span>`}return I`
      <div class="row">
        <span class="stripe" style="background: ${h}"></span>
        <span class="label">${a}</span>
        ${l}
      </div>
    `}_renderFooter(t,e){const i=ht[e],s=function(t){const e=t.map(dt).filter(t=>null!==t);return e.length?Math.min(...e):null}(t.map(t=>t?.attributes.api_updated)),n=Date.now();let o=W,r=!1;if(null!==s){const t=(a=s,h=n,Math.max(0,Math.floor((h-a)/6e4)));o=0===t?i.updatedJustNow:i.updatedAgo(t),r=function(t,e){return e-t>18e4}(s,n)}var a,h;return I`
      <div class="footer">
        <span class="updated ${r?"stale":""}">${o}</span>
        <ha-icon-button
          class=${this._refreshing?"spinning":""}
          .label=${i.refresh}
          title=${i.refresh}
          .disabled=${this._refreshing||this._cooldown}
          @click=${()=>this._refresh()}
        >
          <ha-icon icon="mdi:refresh"></ha-icon>
        </ha-icon-button>
      </div>
    `}async _refresh(t=!1){if(this.hass&&this._config&&!this._refreshing&&!this._cooldown){this._refreshing=!0;try{await this.hass.callService("homeassistant","update_entity",{entity_id:this._config.entities},void 0,!t)}finally{this._refreshing=!1,this._cooldown=!0,clearTimeout(this._cooldownTimer),this._cooldownTimer=setTimeout(()=>{this._cooldown=!1},5e3)}}}}mt.properties={hass:{attribute:!1},_config:{state:!0},_refreshing:{state:!0},_cooldown:{state:!0}},mt.styles=o`
    .rows {
      padding: 8px 16px 0;
    }
    .rows.no-header {
      padding-top: 16px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 40px;
    }
    .row + .row {
      border-top: 1px solid var(--divider-color);
    }
    .stripe {
      flex: none;
      width: 4px;
      align-self: stretch;
      margin: 6px 0;
      border-radius: 2px;
    }
    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--primary-text-color);
    }
    .times {
      flex: none;
      font-variant-numeric: tabular-nums;
      color: var(--primary-text-color);
      font-weight: 500;
    }
    .muted {
      color: var(--secondary-text-color);
      font-weight: normal;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      padding: 0 4px 0 16px;
      color: var(--secondary-text-color);
      font-size: 0.85em;
    }
    .updated {
      flex: 1;
    }
    .updated.stale {
      color: var(--warning-color);
    }
    ha-icon-button {
      --mdc-icon-button-size: 36px;
      --mdc-icon-size: 20px;
      color: var(--secondary-text-color);
    }
    .spinning ha-icon {
      display: inline-flex;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;const $t=[{name:"title",selector:{text:{}}},{name:"trains",selector:{number:{min:1,max:3,mode:"box"}}},{name:"language",selector:{select:{mode:"dropdown",options:[{value:"auto",label:"Auto (follow user language)"},{value:"en",label:"English"},{value:"th",label:"ไทย"}]}}},{name:"auto_refresh",selector:{boolean:{}}}],vt={title:"Title",trains:"Trains per row",language:"Language",auto_refresh:"Refresh when the dashboard opens"};class yt extends rt{constructor(){super(...arguments),this._raw={}}setConfig(t){let e;this._raw=t;try{e=ut(t)}catch{e=ut({...t,entities:["placeholder"]}),e.entities=[]}this._config=e}connectedCallback(){super.connectedCallback(),async function(){if(customElements.get("ha-entity-picker"))return;const t=customElements.get("hui-entities-card");await(t?.getConfigElement?.())}().then(()=>this.requestUpdate())}render(){if(!this.hass||!this._config)return W;const t=ft(this.hass),e=this._config.entities;return I`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${$t}
        .computeLabel=${t=>vt[t.name]??t.name}
        @value-changed=${this._formChanged}
      ></ha-form>
      <div class="entities">
        <div class="heading">Stations</div>
        ${e.map((i,s)=>I`
            <div class="entity">
              <ha-entity-picker
                .hass=${this.hass}
                .value=${i}
                .includeEntities=${t}
                allow-custom-entity
                @value-changed=${t=>this._entityChanged(s,t.detail.value)}
              ></ha-entity-picker>
              <ha-icon-button
                .label=${"Move up"}
                .disabled=${0===s}
                @click=${()=>this._move(s,-1)}
                ><ha-icon icon="mdi:arrow-up"></ha-icon
              ></ha-icon-button>
              <ha-icon-button
                .label=${"Move down"}
                .disabled=${s===e.length-1}
                @click=${()=>this._move(s,1)}
                ><ha-icon icon="mdi:arrow-down"></ha-icon
              ></ha-icon-button>
              <ha-icon-button
                .label=${"Remove"}
                @click=${()=>this._remove(s)}
                ><ha-icon icon="mdi:close"></ha-icon
              ></ha-icon-button>
            </div>
          `)}
        <ha-entity-picker
          .hass=${this.hass}
          .value=${""}
          .includeEntities=${t}
          @value-changed=${this._added}
        ></ha-entity-picker>
      </div>
    `}_formChanged(t){t.stopPropagation();const e=t.detail.value;this._update({title:e.title,trains:e.trains??3,language:e.language??"auto",auto_refresh:e.auto_refresh??!1})}_entityChanged(t,e){if(!e)return void this._remove(t);const i=[...this._config.entities];i[t]=e,this._update({entities:i})}_added(t){t.stopPropagation();const e=t.detail.value;e&&(t.target.value="",this._update({entities:[...this._config.entities,e]}))}_move(t,e){const i=[...this._config.entities],s=t+e;s<0||s>=i.length||([i[t],i[s]]=[i[s],i[t]],this._update({entities:i}))}_remove(t){const e=this._config.entities.filter((e,i)=>i!==t);this._update({entities:e})}_update(t){this._config={...this._config,...t};const e=function(t,e){const i={...t,...e};return i.title||delete i.title,3===i.trains&&delete i.trains,"auto"===i.language&&delete i.language,i.auto_refresh||delete i.auto_refresh,i}(this._raw,t);this._raw=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}}yt.properties={hass:{attribute:!1},_config:{state:!0}},yt.styles=o`
    .entities {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .heading {
      font-weight: 500;
    }
    .entity {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .entity ha-entity-picker {
      flex: 1;
    }
  `,customElements.get(pt)||customElements.define(pt,mt),customElements.get(_t)||customElements.define(_t,yt),window.customCards=window.customCards??[],window.customCards.some(t=>t.type===pt)||window.customCards.push({type:pt,name:"BTS Arrivals",description:"Upcoming BTS Skytrain trains for one or more stations.",preview:!0});
