"use strict";var SignalEmbed=(()=>{var Q,h,Ce,Ge,I,be,Se,Te,oe,q,O,Ee,se,ie,ae,Qe,K={},J=[],Xe=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,X=Array.isArray;function W(t,e){for(var n in e)t[n]=e[n];return t}function le(t){t&&t.parentNode&&t.parentNode.removeChild(t)}function Ze(t,e,n){var o,a,i,l={};for(i in e)i=="key"?o=e[i]:i=="ref"?a=e[i]:l[i]=e[i];if(arguments.length>2&&(l.children=arguments.length>3?Q.call(arguments,2):n),typeof t=="function"&&t.defaultProps!=null)for(i in t.defaultProps)l[i]===void 0&&(l[i]=t.defaultProps[i]);return V(t,l,o,a,null)}function V(t,e,n,o,a){var i={type:t,props:e,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:a??++Ce,__i:-1,__u:0};return a==null&&h.vnode!=null&&h.vnode(i),i}function L(t){return t.children}function Y(t,e){this.props=t,this.context=e}function U(t,e){if(e==null)return t.__?U(t.__,t.__i+1):null;for(var n;e<t.__k.length;e++)if((n=t.__k[e])!=null&&n.__e!=null)return n.__e;return typeof t.type=="function"?U(t):null}function et(t){if(t.__P&&t.__d){var e=t.__v,n=e.__e,o=[],a=[],i=W({},e);i.__v=e.__v+1,h.vnode&&h.vnode(i),_e(t.__P,i,e,t.__n,t.__P.namespaceURI,32&e.__u?[n]:null,o,n??U(e),!!(32&e.__u),a),i.__v=e.__v,i.__.__k[i.__i]=i,We(o,i,a),e.__e=e.__=null,i.__e!=n&&He(i)}}function He(t){if((t=t.__)!=null&&t.__c!=null)return t.__e=t.__c.base=null,t.__k.some(function(e){if(e!=null&&e.__e!=null)return t.__e=t.__c.base=e.__e}),He(t)}function ye(t){(!t.__d&&(t.__d=!0)&&I.push(t)&&!G.__r++||be!=h.debounceRendering)&&((be=h.debounceRendering)||Se)(G)}function G(){try{for(var t,e=1;I.length;)I.length>e&&I.sort(Te),t=I.shift(),e=I.length,et(t)}finally{I.length=G.__r=0}}function Pe(t,e,n,o,a,i,l,_,p,s,d){var v,r,c,m,T,k,x=o&&o.__k||J,g=e.length;for(p=tt(n,e,x,p,g),v=0;v<g;v++)(c=n.__k[v])!=null&&(r=c.__i!=-1&&x[c.__i]||K,c.__i=v,k=_e(t,c,r,a,i,l,_,p,s,d),m=c.__e,c.ref&&r.ref!=c.ref&&(r.ref&&ce(r.ref,null,c),d.push(c.ref,c.__c||m,c)),T==null&&m!=null&&(T=m),4&c.__u?(p=De(c,p,t),r.__e&&(r.__e=null)):typeof c.type=="function"&&k!==void 0?p=k:m&&(p=m.nextSibling),c.__u&=-7);return n.__e=T,p}function tt(t,e,n,o,a){var i,l,_,p,s,d=n.length,v=d,r=0;for(t.__k=new Array(a),i=0;i<a;i++)(l=e[i])!=null&&typeof l!="boolean"&&typeof l!="function"?(typeof l=="string"||typeof l=="number"||typeof l=="bigint"||l.constructor==String?l=t.__k[i]=V(null,l,null,null,null):X(l)?l=t.__k[i]=V(L,{children:l},null,null,null):l.constructor===void 0&&l.__b>0?l=t.__k[i]=V(l.type,l.props,l.key,l.ref?l.ref:null,l.__v):t.__k[i]=l,p=i+r,l.__=t,l.__b=t.__b+1,_=null,(s=l.__i=nt(l,n,p,v))!=-1&&(v--,(_=n[s])&&(_.__u|=2)),_==null||_.__v==null?(s==-1&&(a>d?r--:a<d&&r++),typeof l.type!="function"&&(l.__u|=4)):s!=p&&(s==p-1?r--:s==p+1?r++:(s>p?r--:r++,l.__u|=4))):t.__k[i]=null;if(v)for(i=0;i<d;i++)(_=n[i])!=null&&(2&_.__u)==0&&(_.__e==o&&(o=U(_)),Fe(_,_));return o}function De(t,e,n){var o,a;if(typeof t.type=="function"){for(o=t.__k,a=0;o&&a<o.length;a++)o[a]&&(o[a].__=t,e=De(o[a],e,n));return e}t.__e!=e&&(e&&t.type&&!e.parentNode&&(e=U(t)),e=n.insertBefore(t.__e,e||null));do e=e&&e.nextSibling;while(e!=null&&e.nodeType==8);return e}function nt(t,e,n,o){var a,i,l,_=t.key,p=t.type,s=e[n],d=s!=null&&(2&s.__u)==0;if(s===null&&_==null||d&&_==s.key&&p==s.type)return n;if(o>(d?1:0)){for(a=n-1,i=n+1;a>=0||i<e.length;)if((s=e[l=a>=0?a--:i++])!=null&&(2&s.__u)==0&&_==s.key&&p==s.type)return l}return-1}function ke(t,e,n){e[0]=="-"?t.setProperty(e,n??""):t[e]=n==null?"":typeof n!="number"||Xe.test(e)?n:n+"px"}function $(t,e,n,o,a){var i,l;e:if(e=="style")if(typeof n=="string")t.style.cssText=n;else{if(typeof o=="string"&&(t.style.cssText=o=""),o)for(e in o)n&&e in n||ke(t.style,e,"");if(n)for(e in n)o&&n[e]==o[e]||ke(t.style,e,n[e])}else if(e[0]=="o"&&e[1]=="n")i=e!=(e=e.replace(Ee,"$1")),l=e.toLowerCase(),e=l in t||e=="onFocusOut"||e=="onFocusIn"?l.slice(2):e.slice(2),t.l||(t.l={}),t.l[e+i]=n,n?o?n[O]=o[O]:(n[O]=se,t.addEventListener(e,i?ae:ie,i)):t.removeEventListener(e,i?ae:ie,i);else{if(a=="http://www.w3.org/2000/svg")e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!="width"&&e!="height"&&e!="href"&&e!="list"&&e!="form"&&e!="tabIndex"&&e!="download"&&e!="rowSpan"&&e!="colSpan"&&e!="role"&&e!="popover"&&e in t)try{t[e]=n??"";break e}catch{}typeof n=="function"||(n==null||n===!1&&e[4]!="-"?t.removeAttribute(e):t.setAttribute(e,e=="popover"&&n==1?"":n))}}function we(t){return function(e){if(this.l){var n=this.l[e.type+t];if(e[q]==null)e[q]=se++;else if(e[q]<n[O])return;return n(h.event?h.event(e):e)}}}function _e(t,e,n,o,a,i,l,_,p,s){var d,v,r,c,m,T,k,x,g,E,F,D,f,C,M,N,S=e.type;if(e.constructor!==void 0)return null;128&n.__u&&(p=!!(32&n.__u),i=[_=e.__e=n.__e]),(d=h.__b)&&d(e);e:if(typeof S=="function"){v=l.length;try{if(g=e.props,E=S.prototype&&S.prototype.render,F=(d=S.contextType)&&o[d.__c],D=d?F?F.props.value:d.__:o,n.__c?x=(r=e.__c=n.__c).__=r.__E:(E?e.__c=r=new S(g,D):(e.__c=r=new Y(g,D),r.constructor=S,r.render=ot),F&&F.sub(r),r.state||(r.state={}),r.__n=o,c=r.__d=!0,r.__h=[],r._sb=[]),E&&r.__s==null&&(r.__s=r.state),E&&S.getDerivedStateFromProps!=null&&(r.__s==r.state&&(r.__s=W({},r.__s)),W(r.__s,S.getDerivedStateFromProps(g,r.__s))),m=r.props,T=r.state,r.__v=e,c)E&&S.getDerivedStateFromProps==null&&r.componentWillMount!=null&&r.componentWillMount(),E&&r.componentDidMount!=null&&r.__h.push(r.componentDidMount);else{if(E&&S.getDerivedStateFromProps==null&&g!==m&&r.componentWillReceiveProps!=null&&r.componentWillReceiveProps(g,D),e.__v==n.__v||!r.__e&&r.shouldComponentUpdate!=null&&r.shouldComponentUpdate(g,r.__s,D)===!1){e.__v!=n.__v&&(r.props=g,r.state=r.__s,r.__d=!1),e.__e=n.__e,e.__k=n.__k,e.__k.some(function(w){w&&(w.__=e)}),J.push.apply(r.__h,r._sb),r._sb=[],r.__h.length&&l.push(r),_=U(n);break e}r.componentWillUpdate!=null&&r.componentWillUpdate(g,r.__s,D),E&&r.componentDidUpdate!=null&&r.__h.push(function(){r.componentDidUpdate(m,T,k)})}if(r.context=D,r.props=g,r.__P=t,r.__e=!1,f=h.__r,C=0,E)r.state=r.__s,r.__d=!1,f&&f(e),d=r.render(r.props,r.state,r.context),J.push.apply(r.__h,r._sb),r._sb=[];else do r.__d=!1,f&&f(e),d=r.render(r.props,r.state,r.context),r.state=r.__s;while(r.__d&&++C<25);r.state=r.__s,r.getChildContext!=null&&(o=W(W({},o),r.getChildContext())),E&&!c&&r.getSnapshotBeforeUpdate!=null&&(k=r.getSnapshotBeforeUpdate(m,T)),M=d!=null&&d.type===L&&d.key==null?Ie(d.props.children):d,_=Pe(t,X(M)?M:[M],e,n,o,a,i,l,_,p,s),r.base=e.__e,e.__u&=-161,r.__h.length&&l.push(r),x&&(r.__E=r.__=null)}catch(w){if(l.length=v,e.__v=null,p||i!=null){if(w.then){for(e.__u|=p?160:128;_&&_.nodeType==8&&_.nextSibling;)_=_.nextSibling;i!=null&&(i[i.indexOf(_)]=null),e.__e=_}else if(i!=null)for(N=i.length;N--;)le(i[N])}else e.__e=n.__e;e.__k==null&&(e.__k=n.__k||[]),w.then||Me(e),h.__e(w,e,n)}}else i==null&&e.__v==n.__v?(e.__k=n.__k,e.__e=n.__e):_=e.__e=rt(n.__e,e,n,o,a,i,l,p,s);return(d=h.diffed)&&d(e),128&e.__u?void 0:_}function Me(t){t&&(t.__c&&(t.__c.__e=!0),t.__k&&t.__k.some(Me))}function We(t,e,n){for(var o=0;o<n.length;o++)ce(n[o],n[++o],n[++o]);h.__c&&h.__c(e,t),t.some(function(a){try{t=a.__h,a.__h=[],t.some(function(i){i.call(a)})}catch(i){h.__e(i,a.__v)}})}function Ie(t){return typeof t!="object"||t==null||t.__b>0?t:X(t)?t.map(Ie):t.constructor!==void 0?null:W({},t)}function rt(t,e,n,o,a,i,l,_,p){var s,d,v,r,c,m,T,k=n.props||K,x=e.props,g=e.type;if(g=="svg"?a="http://www.w3.org/2000/svg":g=="math"?a="http://www.w3.org/1998/Math/MathML":a||(a="http://www.w3.org/1999/xhtml"),i!=null){for(s=0;s<i.length;s++)if((c=i[s])&&"setAttribute"in c==!!g&&(g?c.localName==g:c.nodeType==3)){t=c,i[s]=null;break}}if(t==null){if(g==null)return document.createTextNode(x);t=document.createElementNS(a,g,x.is&&x),_&&(h.__m&&h.__m(e,i),_=!1),i=null}if(g==null)k===x||_&&t.data==x||(t.data=x);else{if(i=g=="textarea"&&x.defaultValue!=null?null:i&&Q.call(t.childNodes),!_&&i!=null)for(k={},s=0;s<t.attributes.length;s++)k[(c=t.attributes[s]).name]=c.value;for(s in k)c=k[s],s=="dangerouslySetInnerHTML"?v=c:s=="children"||s in x||s=="value"&&"defaultValue"in x||s=="checked"&&"defaultChecked"in x||$(t,s,null,c,a);for(s in x)c=x[s],s=="children"?r=c:s=="dangerouslySetInnerHTML"?d=c:s=="value"?m=c:s=="checked"?T=c:_&&typeof c!="function"||k[s]===c||$(t,s,c,k[s],a);if(d)_||v&&(d.__html==v.__html||d.__html==t.innerHTML)||(t.innerHTML=d.__html),e.__k=[];else if(v&&(t.innerHTML=""),Pe(e.type=="template"?t.content:t,X(r)?r:[r],e,n,o,g=="foreignObject"?"http://www.w3.org/1999/xhtml":a,i,l,i?i[0]:n.__k&&U(n,0),_,p),i!=null)for(s=i.length;s--;)le(i[s]);_&&g!="textarea"||(s="value",g=="progress"&&m==null?t.removeAttribute("value"):m!=null&&(m!==t[s]||g=="progress"&&!m||g=="option"&&m!=k[s])&&$(t,s,m,k[s],a),s="checked",T!=null&&T!=t[s]&&$(t,s,T,k[s],a))}return t}function ce(t,e,n){try{if(typeof t=="function"){var o=typeof t.__u=="function";o&&t.__u(),o&&e==null||(t.__u=t(e))}else t.current=e}catch(a){h.__e(a,n)}}function Fe(t,e,n){var o,a;if(h.unmount&&h.unmount(t),(o=t.ref)&&(o.current&&o.current!=t.__e||ce(o,null,e)),(o=t.__c)!=null){if(o.componentWillUnmount)try{o.componentWillUnmount()}catch(i){h.__e(i,e)}o.base=o.__P=o.__n=null}if(o=t.__k)for(a=0;a<o.length;a++)o[a]&&Fe(o[a],e,n||typeof t.type!="function");n||le(t.__e),t.__c=t.__=t.__e=void 0}function ot(t,e,n){return this.constructor(t,n)}function pe(t,e,n){var o,a,i,l;e==document&&(e=document.documentElement),h.__&&h.__(t,e),a=(o=typeof n=="function")?null:n&&n.__k||e.__k,i=[],l=[],_e(e,t=(!o&&n||e).__k=Ze(L,null,[t]),a||K,K,e.namespaceURI,!o&&n?[n]:a?null:e.firstChild?Q.call(e.childNodes):null,i,!o&&n?n:a?a.__e:e.firstChild,o,l),We(i,t,l),t.props.children=null}Q=J.slice,h={__e:function(t,e,n,o){for(var a,i,l;e=e.__;)if((a=e.__c)&&!a.__)try{if((i=a.constructor)&&i.getDerivedStateFromError!=null&&(a.setState(i.getDerivedStateFromError(t)),l=a.__d),a.componentDidCatch!=null&&(a.componentDidCatch(t,o||{}),l=a.__d),l)return a.__E=a}catch(_){t=_}throw t}},Ce=0,Ge=function(t){return t!=null&&t.constructor===void 0},Y.prototype.setState=function(t,e){var n;n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=W({},this.state),typeof t=="function"&&(t=t(W({},n),this.props)),t&&W(n,t),t!=null&&this.__v&&(e&&this._sb.push(e),ye(this))},Y.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),ye(this))},Y.prototype.render=L,I=[],Se=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Te=function(t,e){return t.__v.__b-e.__v.__b},G.__r=0,oe=Math.random().toString(8),q="__d"+oe,O="__a"+oe,Ee=/(PointerCapture)$|Capture$/i,se=0,ie=we(!1),ae=we(!0),Qe=0;var R,b,ue,Ue,ee=0,Re=[],y=h,Ae=y.__b,Le=y.__r,Ne=y.diffed,je=y.__c,ze=y.unmount,Be=y.__;function fe(t,e){y.__h&&y.__h(b,t,ee||e),ee=0;var n=b.__H||(b.__H={__:[],__h:[]});return t>=n.__.length&&n.__.push({}),n.__[t]}function A(t){return ee=1,it(qe,t)}function it(t,e,n){var o=fe(R++,2);if(o.t=t,!o.__c&&(o.__=[n?n(e):qe(void 0,e),function(_){var p=o.__N?o.__N[0]:o.__[0],s=o.t(p,_);p!==s&&(o.__N=[s,o.__[1]],o.__c.setState({}))}],o.__c=b,!b.__f)){var a=function(_,p,s){if(!o.__c.__H)return!0;var d=!1,v=o.__c.props!==_;if(o.__c.__H.__.some(function(c){if(c.__N){d=!0;var m=c.__[0];c.__=c.__N,c.__N=void 0,m!==c.__[0]&&(v=!0)}}),i){var r=i.call(this,_,p,s);return d?r||v:r}return!d||v};b.__f=!0;var i=b.shouldComponentUpdate,l=b.componentWillUpdate;b.componentWillUpdate=function(_,p,s){if(this.__e){var d=i;i=void 0,a(_,p,s),i=d}l&&l.call(this,_,p,s)},b.shouldComponentUpdate=a}return o.__N||o.__}function te(t,e){var n=fe(R++,3);!y.__s&&$e(n.__H,e)&&(n.__=t,n.u=e,b.__H.__h.push(n))}function ge(t){return ee=5,he(function(){return{current:t}},[])}function he(t,e){var n=fe(R++,7);return $e(n.__H,e)&&(n.__=t(),n.__H=e,n.__h=t),n.__}function at(){for(var t;t=Re.shift();){var e=t.__H;if(t.__P&&e)try{e.__h.some(Z),e.__h.some(de),e.__h=[]}catch(n){e.__h=[],y.__e(n,t.__v)}}}y.__b=function(t){b=null,Ae&&Ae(t)},y.__=function(t,e){t&&e.__k&&e.__k.__m&&(t.__m=e.__k.__m),Be&&Be(t,e)},y.__r=function(t){Le&&Le(t),R=0;var e=(b=t.__c).__H;e&&(ue===b?(e.__h=[],b.__h=[],e.__.some(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(e.__h.some(Z),e.__h.some(de),e.__h=[],R=0)),ue=b},y.diffed=function(t){Ne&&Ne(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&(Re.push(e)!==1&&Ue===y.requestAnimationFrame||((Ue=y.requestAnimationFrame)||st)(at)),e.__H.__.some(function(n){n.u&&(n.__H=n.u,n.u=void 0)})),ue=b=null},y.__c=function(t,e){e.some(function(n){try{n.__h.some(Z),n.__h=n.__h.filter(function(o){return!o.__||de(o)})}catch(o){e.some(function(a){a.__h&&(a.__h=[])}),e=[],y.__e(o,n.__v)}}),je&&je(t,e)},y.unmount=function(t){ze&&ze(t);var e,n=t.__c;n&&n.__H&&(n.__H.__.some(function(o){try{Z(o)}catch(a){e=a}}),n.__H=void 0,e&&y.__e(e,n.__v))};var Oe=typeof requestAnimationFrame=="function";function st(t){var e,n=function(){clearTimeout(o),Oe&&cancelAnimationFrame(e),setTimeout(t)},o=setTimeout(n,35);Oe&&(e=requestAnimationFrame(n))}function Z(t){var e=b,n=t.__c;typeof n=="function"&&(t.__c=void 0,n()),b=e}function de(t){var e=b;t.__c=t.__(),b=e}function $e(t,e){return!t||t.length!==e.length||e.some(function(n,o){return n!==t[o]})}function qe(t,e){return typeof e=="function"?e(t):e}var lt=0;function u(t,e,n,o,a,i){e||(e={});var l,_,p=e;if("ref"in p)for(_ in p={},e)_=="ref"?l=e[_]:p[_]=e[_];var s={type:t,props:p,key:n,ref:l,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--lt,__i:-1,__u:0,__source:a,__self:i};if(typeof t=="function"&&(l=t.defaultProps))for(_ in l)p[_]===void 0&&(p[_]=l[_]);return h.vnode&&h.vnode(s),s}function _t(t){if(!t)return;let e={};return t.accent&&(e["--sig-accent"]=t.accent),t.bg&&(e["--sig-bg"]=t.bg),t.fg&&(e["--sig-fg"]=t.fg),t.panel&&(e["--sig-panel"]=t.panel),Object.keys(e).length?e:void 0}function ct(){let t="sig_vid",e=localStorage.getItem(t);if(e)return e;let n=crypto.randomUUID();return localStorage.setItem(t,n),n}function pt(t){return new Date(t).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"})}function Ve(){return u("svg",{class:"ico-fill",viewBox:"0 0 24 24","aria-hidden":"true",children:[u("rect",{x:"3.5",y:"13",width:"4",height:"8",rx:"1.2"}),u("rect",{x:"10",y:"8",width:"4",height:"13",rx:"1.2"}),u("rect",{x:"16.5",y:"3",width:"4",height:"18",rx:"1.2"})]})}function Ye(){return u("svg",{class:"ico-line",viewBox:"0 0 24 24","aria-hidden":"true",children:u("path",{d:"M6 6l12 12M18 6L6 18"})})}function ut(){return u("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:u("path",{d:"M5 12h14M13 6l6 6-6 6"})})}function Ke(t){let e=t.apiBase??"",[n,o]=A(!1),[a,i]=A(null),[l,_]=A(null),[p,s]=A([]),[d,v]=A(""),[r,c]=A(!1),m=ge(null),T=ge(null),k=he(()=>t.visitorId??(typeof localStorage<"u"?ct():"anon"),[t.visitorId]),x=t.publishableKey.replace(/[\u200B-\u200D\uFEFF]/g,"").trim(),g="sig-widget-title",E=!l&&p.length===1&&p[0]?.role==="assistant",F=l?"Offline":r?"Live":"Ready";te(()=>{if(!x.startsWith("pk_")||x.length<51){_("Publishable key looks incomplete. Paste the full pk_ key.");return}fetch(`${e}/api/public/v1/widget`,{headers:{"x-publishable-key":x}}).then(async f=>{let C=await f.json().catch(()=>null);if(!f.ok)throw new Error(C?.error?.message??"Could not load this widget");return C}).then(f=>{i(f),f.greeting&&s([{role:"assistant",content:f.greeting,at:Date.now()}])}).catch(f=>_(f.message))},[e,x]),te(()=>{if(!n)return;let f=C=>{C.key==="Escape"&&o(!1)};return window.addEventListener("keydown",f),T.current?.focus(),()=>window.removeEventListener("keydown",f)},[n]),te(()=>{let f=m.current;f&&(f.scrollTop=f.scrollHeight)},[p,n,r]);async function D(){if(!d.trim()||!a||r)return;let f=[...p,{role:"user",content:d.trim(),at:Date.now()}];s(f),v(""),c(!0);try{let C=await fetch(`${e}/api/public/v1/chat`,{method:"POST",headers:{"content-type":"application/json","x-publishable-key":x},body:JSON.stringify({agentId:a.agentId,visitorId:k,messages:f.map(({role:w,content:H})=>({role:w,content:H}))})});if(C.status===429){s(w=>[...w,{role:"assistant",content:"You've hit the rate limit. Try again in a moment.",at:Date.now()}]);return}if(!C.ok){let w=await C.json().catch(()=>({error:{message:"Request failed"}}));if(w?.error?.code==="quota_exceeded"){s(H=>[...H,{role:"assistant",content:"This workspace is over quota.",at:Date.now()}]);return}throw new Error(w?.error?.message??"Chat failed")}let M=C.body?.getReader(),N=new TextDecoder,S="";if(s(w=>[...w,{role:"assistant",content:"",at:Date.now()}]),M){for(;;){let{done:w,value:H}=await M.read();if(w)break;let j=N.decode(H,{stream:!0});for(let ve of j.split(`
`)){if(!ve.startsWith("data:"))continue;let ne=ve.slice(5).trim();if(!(!ne||ne==="[DONE]"))try{let z=JSON.parse(ne);if(z.type==="error"||z.errorText){S=z.errorText?.trim()||"The model provider rejected this request.",s(re=>{let P=[...re],B=P[P.length-1];return B&&(P[P.length-1]={...B,role:"assistant",content:S}),P});continue}let xe=z.delta??z.text??"";xe&&(S+=xe,s(re=>{let P=[...re],B=P[P.length-1];return B&&(P[P.length-1]={...B,role:"assistant",content:S}),P}))}catch{}}}S.trim()||s(w=>{let H=[...w],j=H[H.length-1];return j&&!j.content&&(H[H.length-1]={...j,role:"assistant",content:"The model did not reply. Check the credential and provider credits."}),H})}}catch(C){s(M=>[...M,{role:"assistant",content:C instanceof Error?C.message:"Error",at:Date.now()}])}finally{c(!1),m.current?.focus()}}return u("div",{class:"wrap",style:_t(a?.theme?.widget),children:[n?u("section",{class:"panel",role:"dialog","aria-modal":"true","aria-labelledby":g,children:[u("header",{class:"head",children:[u("div",{class:"brand",children:[u("span",{class:"mark","aria-hidden":"true",children:u(Ve,{})}),u("div",{class:"ident",children:[u("div",{class:"title",id:g,children:a?.name??"Signal"}),u("div",{class:`pill ${l?"off":"on"}`,children:[u("span",{class:"live"}),F]})]})]}),u("button",{class:"close",type:"button",onClick:()=>o(!1),"aria-label":"Close chat",children:u(Ye,{})})]}),u("div",{class:"transcript","aria-live":"polite",ref:m,tabIndex:-1,children:l?u("div",{class:"welcome",children:u("p",{children:l})}):E?u("div",{class:"welcome",children:[u("p",{class:"eyebrow",children:[u("span",{class:"live"}),"Here with you"]}),u("p",{children:p[0]?.content})]}):p.map((f,C)=>u("div",{class:`row ${f.role}`,children:[u("div",{class:`bubble ${f.role}`,children:f.content?f.content:u("span",{class:"dots","aria-label":"Typing",children:[u("i",{}),u("i",{}),u("i",{})]})}),f.content?u("time",{class:"stamp",children:pt(f.at)}):null]},C))}),u("form",{class:"foot",onSubmit:f=>{f.preventDefault(),D()},children:u("div",{class:"composer",children:[u("input",{ref:T,value:d,onInput:f=>v(f.target.value),placeholder:a?.placeholder??"Ask anything","aria-label":"Message",autoComplete:"off",disabled:!!l}),u("button",{class:"send",type:"submit",disabled:r||!!l,"aria-label":"Send message",children:u(ut,{})})]})})]}):null,u("button",{class:"launcher",type:"button",onClick:()=>o(f=>!f),"aria-expanded":n,"aria-label":n?"Close chat":"Open chat",children:n?u(Ye,{}):u(Ve,{})})]})}var Je=`
:host {
  all: initial;
  --sig-bg: #12141a;
  --sig-fg: #f6f1e8;
  --sig-accent: #ff4d19;
  --sig-live: #3ee0b0;
  --sig-line: #2a2e38;
  --sig-panel: #1a1d26;
  --sig-mute: #9aa0ab;
  --sig-font: "Mona Sans", "Segoe UI", Tahoma, sans-serif;
  --sig-display: "Iowan Old Style", Palatino, Georgia, serif;
  --sig-ease: cubic-bezier(0.23, 1, 0.32, 1);
  --sig-ease-io: cubic-bezier(0.77, 0, 0.175, 1);
  --sig-dur: 200ms;
  --sig-press: 140ms;
  font-family: var(--sig-font);
  font-synthesis: none;
  line-height: 1.45;
  color: var(--sig-fg);
  -webkit-font-smoothing: antialiased;
}
:host * { box-sizing: border-box; }
button, input { font: inherit; letter-spacing: inherit; word-spacing: normal; }
button { color: inherit; }
:focus { outline: none; }
:focus-visible {
  outline: 2px solid var(--sig-accent);
  outline-offset: 2px;
}
.wrap {
  position: fixed; right: 20px; bottom: 20px; z-index: 2147483000;
  font-family: var(--sig-font);
  color: var(--sig-fg);
}
.launcher {
  width: 56px; height: 56px; border: 0; border-radius: 18px;
  background: var(--sig-accent); color: #fff; cursor: pointer;
  display: grid; place-items: center;
  box-shadow: 0 10px 28px color-mix(in oklab, var(--sig-accent) 38%, transparent);
  transition: transform var(--sig-press) var(--sig-ease), box-shadow var(--sig-press) var(--sig-ease);
}
.launcher svg { width: 22px; height: 22px; }
.ico-fill { fill: currentColor; }
.ico-line { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
.launcher:hover { transform: translateY(-1px); }
.launcher:active { transform: scale(0.97); }
.launcher[aria-expanded="true"] {
  background: var(--sig-panel);
  color: var(--sig-fg);
  box-shadow: 0 8px 20px rgba(0,0,0,.35);
  border: 1px solid var(--sig-line);
}
.panel {
  position: absolute; right: 0; bottom: 72px;
  width: min(372px, calc(100vw - 28px));
  max-height: min(520px, calc(100vh - 112px));
  display: flex; flex-direction: column;
  background:
    radial-gradient(120% 70% at 0% -8%, color-mix(in oklab, var(--sig-accent) 20%, transparent), transparent 46%),
    linear-gradient(180deg, var(--sig-panel) 0%, var(--sig-bg) 42%);
  color: var(--sig-fg);
  border: 1px solid color-mix(in oklab, var(--sig-line) 80%, white 8%);
  border-radius: 22px;
  box-shadow:
    0 24px 60px rgba(0,0,0,.45),
    0 0 0 1px rgba(255,255,255,.03) inset;
  overflow: hidden;
  transform-origin: bottom right;
  animation: enter var(--sig-dur) var(--sig-ease);
}
.panel::after {
  content: "";
  position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
  background: repeating-linear-gradient(-18deg, transparent, transparent 3px, rgba(255,255,255,.018) 3px, rgba(255,255,255,.018) 4px);
}
@keyframes enter {
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.head {
  position: relative; z-index: 1;
  padding: 14px 14px 12px 16px;
  display: flex; align-items: center; gap: 10px;
}
.brand { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.mark {
  width: 30px; height: 30px; border-radius: 9px; flex: none;
  display: grid; place-items: center;
  background: color-mix(in oklab, var(--sig-accent) 18%, var(--sig-panel));
  color: var(--sig-accent);
}
.mark svg { width: 14px; height: 14px; fill: currentColor; }
.ident { min-width: 0; }
.title {
  font-family: var(--sig-display);
  font-size: 22px; font-style: italic; font-weight: 400;
  letter-spacing: 0.01em; word-spacing: 0.06em;
  line-height: 1.1; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.pill {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 4px; padding: 2px 8px 2px 6px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--sig-fg) 6%, transparent);
  color: var(--sig-mute);
  font-size: 11px; letter-spacing: 0.02em; word-spacing: 0.08em;
  line-height: 1.3;
}
.pill.on { color: color-mix(in oklab, var(--sig-live) 70%, var(--sig-fg)); }
.pill.off { color: var(--sig-mute); }
.live {
  width: 7px; height: 7px; border-radius: 99px; flex: none;
  background: var(--sig-mute);
}
.pill.on .live {
  background: var(--sig-live);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--sig-live) 22%, transparent);
  animation: pulse 1.8s var(--sig-ease-io) infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 3px color-mix(in oklab, var(--sig-live) 18%, transparent); }
  50% { box-shadow: 0 0 0 5px color-mix(in oklab, var(--sig-live) 8%, transparent); }
}
.close {
  width: 32px; height: 32px; border-radius: 10px; flex: none;
  display: grid; place-items: center; cursor: pointer;
  background: color-mix(in oklab, var(--sig-fg) 5%, transparent);
  border: 1px solid var(--sig-line); color: var(--sig-fg);
  transition: background var(--sig-press) var(--sig-ease), transform var(--sig-press) var(--sig-ease);
}
.close svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 1.8; }
.close:hover { background: color-mix(in oklab, var(--sig-fg) 10%, transparent); }
.close:active { transform: scale(0.97); }
.transcript {
  position: relative; z-index: 1;
  flex: 1 1 auto; overflow: auto;
  min-height: 168px; max-height: 340px;
  padding: 4px 14px 8px;
  display: flex; flex-direction: column; gap: 10px;
}
.welcome {
  margin: auto 0 8px;
  padding: 18px 16px 16px;
  border-radius: 16px;
  background:
    linear-gradient(180deg, color-mix(in oklab, var(--sig-accent) 10%, var(--sig-panel)), var(--sig-panel));
  border: 1px solid color-mix(in oklab, var(--sig-accent) 18%, var(--sig-line));
}
.eyebrow {
  display: flex; align-items: center; gap: 7px;
  margin: 0 0 8px;
  color: color-mix(in oklab, var(--sig-live) 72%, var(--sig-fg));
  font-size: 11px; letter-spacing: 0.04em; word-spacing: 0.1em;
  text-transform: uppercase;
}
.eyebrow .live { background: var(--sig-live); }
.welcome p {
  margin: 0;
  font-size: 17px; line-height: 1.45;
  letter-spacing: 0.01em; word-spacing: 0.06em;
}
.row { display: flex; flex-direction: column; gap: 4px; max-width: 88%; }
.row.user { align-self: flex-end; align-items: flex-end; }
.row.assistant { align-self: flex-start; align-items: flex-start; }
.bubble {
  padding: 10px 13px;
  font-size: 14px; line-height: 1.5;
  letter-spacing: 0.01em; word-spacing: 0.05em;
  white-space: pre-wrap; overflow-wrap: anywhere;
}
.bubble.assistant {
  background: color-mix(in oklab, var(--sig-panel) 88%, white 4%);
  border: 1px solid var(--sig-line);
  border-radius: 4px 16px 16px 16px;
}
.bubble.user {
  background: color-mix(in oklab, var(--sig-accent) 88%, black);
  color: #fff;
  border: 0;
  border-radius: 16px 16px 4px 16px;
}
.stamp {
  font-size: 10px; letter-spacing: 0.03em; word-spacing: 0.08em;
  color: var(--sig-mute); padding: 0 4px;
}
.dots { display: flex; gap: 5px; padding: 2px 0; }
.dots i {
  display: block; width: 6px; height: 6px; border-radius: 99px;
  background: var(--sig-mute);
  animation: hop 1s var(--sig-ease-io) infinite;
}
.dots i:nth-child(2) { animation-delay: 120ms; }
.dots i:nth-child(3) { animation-delay: 240ms; }
@keyframes hop {
  0%, 80%, 100% { transform: translateY(0); opacity: .45; }
  40% { transform: translateY(-3px); opacity: 1; }
}
.foot { position: relative; z-index: 1; padding: 8px 12px 12px; }
.composer {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 5px 5px 14px;
  background: var(--sig-panel);
  border: 1px solid var(--sig-line);
  border-radius: 16px;
  transition: border-color var(--sig-press) var(--sig-ease), box-shadow var(--sig-press) var(--sig-ease);
}
.composer:focus-within {
  border-color: color-mix(in oklab, var(--sig-accent) 50%, var(--sig-line));
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--sig-accent) 18%, transparent);
}
.composer input {
  flex: 1; min-width: 0; background: transparent; border: 0;
  color: var(--sig-fg); padding: 9px 0; outline: none;
  letter-spacing: 0.01em; word-spacing: 0.08em;
}
.composer input::placeholder { color: var(--sig-mute); letter-spacing: 0.01em; word-spacing: 0.08em; }
.composer input:focus-visible { outline: none; }
.send {
  width: 40px; height: 40px; border: 0; border-radius: 12px; flex: none;
  display: grid; place-items: center; cursor: pointer;
  background: var(--sig-accent); color: #fff;
  transition: transform var(--sig-press) var(--sig-ease), opacity var(--sig-press) var(--sig-ease);
}
.send svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.send:hover { transform: translateY(-1px); }
.send:active { transform: scale(0.97); }
.send:disabled { opacity: .45; cursor: default; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .panel { animation: none; }
  .launcher, .close, .send, .composer { transition: none; }
  .pill.on .live, .dots i { animation: none; }
}
`;function me(t,e){let n=document.createElement("signal-widget"),o=n.attachShadow({mode:"open"}),a=document.createElement("style");a.textContent=Je;let i=document.createElement("div");return o.append(a,i),t.appendChild(n),pe(u(Ke,{...e}),i),{unmount(){pe(null,i),n.remove()}}}function dt(){let t=document.currentScript??document.querySelector("script[data-key]"),e=t?.dataset.key?.replace(/[\u200B-\u200D\uFEFF]/g,"").trim();if(!e)return;let n=t?.dataset.api??"";me(document.body,{publishableKey:e,apiBase:n})}dt();window.SignalWidget={mount:me};})();
