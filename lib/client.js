window.__ModuleLoader__.load({id:"dsh-mini-usage",factory:(require)=>{var module={exports:{}};var exports=module.exports;
"use strict";var E=Object.defineProperty;var W=Object.getOwnPropertyDescriptor;var Y=Object.getOwnPropertyNames;var K=Object.prototype.hasOwnProperty;var X=(t,n)=>{for(var a in n)E(t,a,{get:n[a],enumerable:!0})},Z=(t,n,a,d)=>{if(n&&typeof n=="object"||typeof n=="function")for(let r of Y(n))!K.call(t,r)&&r!==a&&E(t,r,{get:()=>n[r],enumerable:!(d=W(n,r))||d.enumerable});return t};var G=t=>Z(E({},"__esModule",{value:!0}),t);var oe={};X(oe,{apply:()=>ae,inject:()=>te});module.exports=G(oe);var i=require("react"),T=require("react-dom"),e=require("react/jsx-runtime"),b=t=>t===null?"\u2014":new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:1}).format(t),c=t=>t===null?"\u2014":new Intl.NumberFormat("zh-CN").format(t);function L({refresh:t=!1}){return(0,e.jsx)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",children:t?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M20 7v5h-5M4 17v-5h5"}),(0,e.jsx)("path",{d:"M6.1 7a7 7 0 0 1 11.5-1L20 9M4 15l2.4 3A7 7 0 0 0 18 17"})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"m12 3 9 5-9 5-9-5 9-5Z"}),(0,e.jsx)("path",{d:"m3 12 9 5 9-5M3 16l9 5 9-5"})]})})}function J(t,n){return t.total?Math.min(4,Math.max(1,Math.ceil(4*Math.sqrt(t.total/n)))):0}function Q({days:t,today:n}){let a=Math.max(1,...t.map(d=>d.total??0));return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{className:"dmu-section-heading",children:[(0,e.jsx)("span",{children:"\u7528\u91CF\u5206\u5E03"}),(0,e.jsx)("span",{className:"dmu-subtle",children:"\u8FD1 12 \u5468"})]}),(0,e.jsx)("div",{className:"dmu-heatmap",role:"group","aria-label":"\u6700\u8FD1\u5341\u4E8C\u5468\u6BCF\u65E5\u7528\u91CF\uFF0C\u5468\u4E00\u81F3\u5468\u65E5",children:t.map(d=>{let s=`${new Date(`${d.date}T12:00:00`).toLocaleDateString("zh-CN",{year:"numeric",month:"long",day:"numeric"})} \xB7 ${d.future?"\u672A\u6765\u65E5\u671F":d.total===null?d.missing?"\u7528\u91CF\u6682\u4E0D\u53EF\u7528":"\u6682\u65E0\u8BB0\u5F55":`${c(d.total)} \u4E2A Token`}`;return(0,e.jsx)("span",{className:`dmu-cell dmu-level-${J(d,a)}`,"data-unknown":!d.future&&d.total===null||void 0,"data-future":d.future||void 0,"data-today":d.date===n||void 0,title:s,"aria-label":s,tabIndex:d.future?-1:0,children:(0,e.jsx)("span",{className:"dmu-tooltip",role:"tooltip",children:s})},d.date)})}),(0,e.jsxs)("div",{className:"dmu-legend",children:[(0,e.jsx)("span",{children:"\u5C11"}),[0,1,2,3,4].map(d=>(0,e.jsx)("i",{className:`dmu-level-${d}`},d)),(0,e.jsx)("span",{children:"\u591A"}),(0,e.jsx)("span",{className:"dmu-unknown-key",children:"\u865A\u7EBF \xB7 \u65E0\u8BB0\u5F55"})]})]})}function V({models:t,period:n,setPeriod:a}){let d=t[n];return(0,e.jsxs)("section",{className:"dmu-models","aria-label":"\u6A21\u578B\u7528\u91CF",children:[(0,e.jsxs)("div",{className:"dmu-section-heading",children:[(0,e.jsx)("span",{children:"\u4F7F\u7528\u6A21\u578B"}),(0,e.jsx)("div",{className:"dmu-period",role:"group","aria-label":"\u6A21\u578B\u7EDF\u8BA1\u8303\u56F4",children:["today","month"].map(r=>(0,e.jsx)("button",{type:"button","aria-pressed":n===r,onClick:()=>a(r),children:r==="today"?"\u4ECA\u5929":"\u672C\u6708"},r))})]}),d.length?(0,e.jsx)("div",{className:"dmu-model-list",role:"list","aria-label":`${n==="today"?"\u4ECA\u5929":"\u672C\u6708"}\u4F7F\u7528\u7684\u6A21\u578B`,children:d.map(r=>(0,e.jsx)(_,{row:r},r.id))}):(0,e.jsxs)("p",{className:"dmu-empty dmu-model-empty",children:[n==="today"?"\u4ECA\u5929":"\u672C\u6708","\u6682\u65E0\u6A21\u578B\u8C03\u7528\u8BB0\u5F55"]})]})}function _({row:t}){let n=t.model??"\u672A\u6807\u6CE8\u6A21\u578B";return(0,e.jsxs)("div",{className:"dmu-model-row",role:"listitem","aria-label":`${n}\uFF0C${t.provider??"\u6765\u6E90\u672A\u6807\u6CE8"}\uFF0C\u8F93\u5165 ${c(t.input)}\uFF0C\u8F93\u51FA ${c(t.output)}\uFF0C\u603B\u91CF ${c(t.total)}`,title:t.missing?"\u90E8\u5206\u8C03\u7528\u672A\u8FD4\u56DE\u53EF\u9760\u7528\u91CF":`${n} \xB7 ${t.provider??"\u6765\u6E90\u672A\u6807\u6CE8"} \xB7 ${c(t.total)} \u4E2A Token`,children:[(0,e.jsxs)("div",{className:"dmu-model-top",children:[(0,e.jsx)("span",{className:"dmu-model-name",title:n,children:n}),(0,e.jsx)("strong",{children:b(t.total)})]}),(0,e.jsxs)("div",{className:"dmu-model-meta",children:[(0,e.jsx)("span",{className:"dmu-model-provider",title:t.provider??"\u6765\u6E90\u672A\u6807\u6CE8",children:t.provider??"\u6765\u6E90\u672A\u6807\u6CE8"}),(0,e.jsxs)("span",{children:["\u8F93\u5165 ",b(t.input),(0,e.jsx)("i",{}),"\u8F93\u51FA ",b(t.output)]})]})]})}function A({wide:t,load:n}){let[a,d]=(0,i.useState)(),[r,s]=(0,i.useState)(!1),[H,C]=(0,i.useState)(!1),[w,R]=(0,i.useState)(!1),[S,U]=(0,i.useState)(!1),[I,B]=(0,i.useState)("today"),[,F]=(0,i.useState)(0),p=(0,i.useRef)(null),k=(0,i.useRef)(null),g=(0,i.useRef)(null),N=(0,i.useRef)(!1),h=(0,i.useRef)(!0),D=(0,i.useId)(),M=async()=>{if(!N.current){N.current=!0,s(!0);try{let o=await n();h.current&&(d(o),C(!1))}catch{h.current&&C(!0)}finally{N.current=!1,h.current&&s(!1)}}};(0,i.useEffect)(()=>{h.current=!0,M();let o=setInterval(()=>void M(),3e5),l=setInterval(()=>F(u=>u+1),3e4);return()=>{h.current=!1,clearInterval(o),clearInterval(l)}},[n]),(0,i.useEffect)(()=>{if(!k.current)return;let o=new ResizeObserver(l=>U(l[0].contentRect.width<112));return o.observe(k.current),()=>o.disconnect()},[]);function f(){if(!p.current||!g.current)return;let o=p.current.getBoundingClientRect(),l=g.current,u=10,v=Math.min(312,window.innerWidth-2*u);l.style.width=`${v}px`,l.style.maxHeight=`${window.innerHeight-2*u}px`;let m=l.getBoundingClientRect().height,x=o.left,$=o.top-m-8;$<u&&(x=o.right+8,$=o.bottom-m),l.style.left=`${Math.max(u,Math.min(x,window.innerWidth-v-u))}px`,l.style.top=`${Math.max(u,Math.min($,window.innerHeight-m-u))}px`}(0,i.useEffect)(()=>{let o=g.current;if(!o)return;let l=()=>{let m=o.matches(":popover-open");R(m),!m&&document.activeElement===document.body&&p.current?.focus()},u=m=>{m.key==="Escape"&&o.matches(":popover-open")&&(m.preventDefault(),o.hidePopover(),p.current?.focus())},v=m=>{let x=m.target;!o.contains(x)&&!p.current?.contains(x)&&o.matches(":popover-open")&&o.hidePopover()};return o.addEventListener("toggle",l),document.addEventListener("keydown",u,!0),document.addEventListener("click",v),()=>{o.removeEventListener("toggle",l),document.removeEventListener("keydown",u,!0),document.removeEventListener("click",v)}},[]),(0,i.useEffect)(()=>{if(!w)return;f();let o=new ResizeObserver(f);return p.current&&o.observe(p.current),g.current&&o.observe(g.current),window.addEventListener("resize",f),window.addEventListener("scroll",f,!0),()=>{o.disconnect(),window.removeEventListener("resize",f),window.removeEventListener("scroll",f,!0)}},[w,t,S,a,I]);let y=H||a?.stale,z=a?.syncedAt?Math.max(0,Math.floor((Date.now()-a.syncedAt)/6e4)):null,q=y?"\u540C\u6B65\u6682\u4E0D\u53EF\u7528 \xB7 \u6570\u636E\u53EF\u80FD\u5DF2\u8FC7\u671F":a?.error??(z===null?"\u5C1A\u672A\u540C\u6B65":z===0?"\u521A\u521A\u540C\u6B65":`${z} \u5206\u949F\u524D\u540C\u6B65`),O=()=>{let o=g.current;if(o){if(o.matches(":popover-open")){o.hidePopover();return}o.showPopover(),f(),o.querySelector("button")?.focus()}};return(0,e.jsxs)("div",{ref:k,className:"dmu-root",children:[(0,e.jsxs)("button",{ref:p,type:"button",className:"dmu-trigger","aria-label":`\u7528\u91CF\u7EDF\u8BA1\uFF0C\u4ECA\u65E5 ${c(a?.today.total??null)} \u4E2A Token${y?"\uFF0C\u6570\u636E\u5DF2\u8FC7\u671F":""}`,"aria-expanded":w,"aria-controls":D,"aria-haspopup":"dialog",title:`\u4ECA\u65E5 ${c(a?.today.total??null)} \u4E2A Token`,onClick:O,children:[(0,e.jsx)(L,{}),t&&!S&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("span",{className:"dmu-trigger-label",children:"\u4ECA\u65E5\u7528\u91CF"}),(0,e.jsx)("span",{className:"dmu-trigger-number",children:b(a?.today.total??null)})]}),y&&(0,e.jsx)("i",{className:"dmu-stale-dot"})]}),(0,T.createPortal)((0,e.jsxs)("div",{ref:g,id:D,popover:"auto",className:"dmu-card",role:"dialog","aria-label":"\u7528\u91CF\u7EDF\u8BA1",children:[(0,e.jsxs)("header",{children:[(0,e.jsx)("span",{className:"dmu-title-icon",children:(0,e.jsx)(L,{})}),(0,e.jsx)("h2",{children:"\u7528\u91CF\u7EDF\u8BA1"}),(0,e.jsx)("span",{className:"dmu-local",children:"\u672C\u673A\u7EDF\u8BA1"}),(0,e.jsx)("button",{className:`dmu-refresh ${r?"dmu-spinning":""}`,onClick:()=>void M(),disabled:r,"aria-label":"\u5237\u65B0\u7528\u91CF",title:"\u5237\u65B0\u7528\u91CF",children:(0,e.jsx)(L,{refresh:!0})})]}),!a&&r?(0,e.jsxs)("div",{className:"dmu-skeleton","aria-label":"\u6B63\u5728\u52A0\u8F7D\u7528\u91CF",children:[(0,e.jsx)("i",{}),(0,e.jsx)("i",{}),(0,e.jsx)("i",{})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("section",{className:"dmu-today",children:[(0,e.jsx)("div",{className:"dmu-eyebrow",children:"\u4ECA\u65E5\u7528\u91CF"}),(0,e.jsx)("div",{className:"dmu-big",children:c(a?.today.total??null)}),(0,e.jsx)("div",{className:"dmu-subtle",children:"\u4E2A Token"}),(0,e.jsxs)("div",{className:"dmu-breakdown",children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("span",{children:"\u8F93\u5165"}),(0,e.jsx)("strong",{children:b(a?.today.input??null)})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("span",{children:"\u8F93\u51FA"}),(0,e.jsx)("strong",{children:b(a?.today.output??null)})]})]}),a?.today.total===null&&(0,e.jsx)("p",{className:"dmu-empty",children:a.today.missing?"\u90E8\u5206\u8C03\u7528\u672A\u8FD4\u56DE\u53EF\u9760\u7528\u91CF":"\u4ECA\u5929\u6682\u65E0\u7528\u91CF\u8BB0\u5F55"})]}),(0,e.jsxs)("section",{className:"dmu-month",children:[(0,e.jsx)("span",{className:"dmu-eyebrow",children:"\u672C\u6708\u7D2F\u8BA1"}),(0,e.jsxs)("span",{children:[(0,e.jsx)("strong",{children:b(a?.month.total??null)})," ",(0,e.jsx)("small",{children:"Token"})]})]}),a&&(0,e.jsx)(V,{models:a.models,period:I,setPeriod:B}),(0,e.jsx)("section",{className:"dmu-activity",children:a?(0,e.jsx)(Q,{days:a.days,today:a.today.date}):(0,e.jsx)("p",{className:"dmu-empty",children:"\u6682\u65F6\u65E0\u6CD5\u83B7\u53D6\u7528\u91CF\uFF0C\u8BF7\u5C1D\u8BD5\u5237\u65B0"})})]}),(0,e.jsxs)("footer",{"aria-live":"polite",children:[(0,e.jsx)("span",{className:y?"dmu-status dmu-status-stale":"dmu-status"}),(0,e.jsx)("span",{children:r&&a?"\u6B63\u5728\u540C\u6B65\u2026":q})]})]}),document.body)]})}var P=`.dmu-root,
.dmu-card {
  --dmu-bg:#fff;
  --dmu-glass:rgba(250, 252, 255, .84);
  --dmu-sheen:rgba(255, 255, 255, .68);
  --dmu-surface:rgba(255, 255, 255, .48);
  --dmu-outline:rgba(255, 255, 255, .85);
  --dmu-text:#20242b;
  --dmu-muted:#747d8b;
  --dmu-line:#e8ebef;
  --dmu-hover:#f1f4f8;
  --dmu-accent:#3a87b9;
  --dmu-l0:#e9edf1;
  --dmu-l1:#c7e3f4;
  --dmu-l2:#91c9e9;
  --dmu-l3:#5eaddc;
  --dmu-l4:#3186bb;
  color: var(--dmu-text);
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  box-sizing: border-box;
}
body[data-ds-dark-theme] .dmu-root,
body[data-ds-dark-theme] .dmu-card {
  --dmu-bg:#1b1e23;
  --dmu-glass:rgba(24, 29, 36, .82);
  --dmu-sheen:rgba(175, 212, 240, .065);
  --dmu-surface:rgba(170, 200, 230, .045);
  --dmu-outline:rgba(180, 210, 245, .14);
  --dmu-text:#ecf0f5;
  --dmu-muted:#89929e;
  --dmu-line:#2c3139;
  --dmu-hover:#282e36;
  --dmu-accent:#99d4f5;
  --dmu-l0:#2c323b;
  --dmu-l1:#304c62;
  --dmu-l2:#477a9b;
  --dmu-l3:#6aaccf;
  --dmu-l4:#a4ddf7;
  color-scheme: dark;
}
.dmu-root {
  flex: 1 1 128px;
  min-width: 32px;
  max-width: 100%;
  overflow: hidden;
}
.dmu-trigger {
  height: 32px;
  width: 100%;
  min-width: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--dmu-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 8px;
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
}
.dmu-trigger:hover,
.dmu-trigger[aria-expanded=true] {
  background: var(--dmu-hover);
  color: var(--dmu-text);
}
.dmu-trigger svg {
  flex: none;
  color: var(--dmu-accent);
}
.dmu-trigger-label {
  overflow: hidden;
  text-overflow: ellipsis;
}
.dmu-trigger-number {
  margin-left: auto;
  color: var(--dmu-text);
  font-weight: 550;
}
.dmu-stale-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #bd975c;
  flex: none;
}
.dmu-card {
  position: fixed;
  inset: auto;
  margin: 0;
  padding: 0;
  width: 312px;
  max-width: calc(100vw - 20px);
  border: 1px solid var(--dmu-line);
  border-radius: 18px;
  background: var(--dmu-bg);
  box-shadow:
    0 18px 56px rgba(0, 12, 30, .2),
    0 3px 12px rgba(0, 12, 30, .08),
    inset 0 1px 0 var(--dmu-outline);
  overflow: auto;
}
.dmu-card:popover-open {
  animation: dmu-in .16s ease-out;
}
.dmu-card::backdrop {
  background: transparent;
}
.dmu-card * {
  box-sizing: border-box;
}
.dmu-card header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px 20px 12px;
}
.dmu-title-icon {
  display: flex;
  color: var(--dmu-accent);
}
.dmu-card h2 {
  font-size: 12px;
  letter-spacing: .01em;
  font-weight: 600;
  margin: 0;
}
.dmu-refresh {
  margin-left: auto;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dmu-muted);
  cursor: pointer;
}
.dmu-refresh:hover {
  background: var(--dmu-hover);
  color: var(--dmu-text);
}
.dmu-refresh:disabled {
  cursor: default;
  opacity: .5;
}
.dmu-root button:focus-visible,
.dmu-card button:focus-visible,
.dmu-cell:focus-visible {
  outline: 2px solid var(--dmu-accent);
  outline-offset: 2px;
}
.dmu-today {
  padding: 6px 20px 18px;
}
.dmu-eyebrow,
.dmu-section-heading > span:first-child {
  font-size: 10px;
  font-weight: 550;
  letter-spacing: .07em;
  color: var(--dmu-muted);
}
.dmu-big {
  font-size: 40px;
  font-weight: 500;
  letter-spacing: -1.8px;
  line-height: 1.15;
  margin-top: 8px;
  overflow-wrap: anywhere;
}
.dmu-subtle {
  color: var(--dmu-muted);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
}
.dmu-breakdown {
  display: flex;
  gap: 28px;
  margin-top: 16px;
}
.dmu-breakdown > div {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: var(--dmu-muted);
}
.dmu-breakdown strong {
  font-weight: 500;
  color: var(--dmu-text);
}
.dmu-month {
  margin: 0 20px;
  padding: 14px 0;
  border-top: 1px solid var(--dmu-line);
  border-bottom: 1px solid var(--dmu-line);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dmu-month strong {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -.4px;
}
.dmu-month small {
  font-size: 10px;
  color: var(--dmu-muted);
}
.dmu-activity {
  padding: 16px 20px 18px;
}
.dmu-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.dmu-heatmap {
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-flow: column;
  gap: 4px;
}
.dmu-cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: 3px;
  display: block;
  min-width: 0;
}
.dmu-level-0 {
  background: var(--dmu-l0);
}
.dmu-level-1 {
  background: var(--dmu-l1);
}
.dmu-level-2 {
  background: var(--dmu-l2);
}
.dmu-level-3 {
  background: var(--dmu-l3);
}
.dmu-level-4 {
  background: var(--dmu-l4);
}
.dmu-cell[data-unknown] {
  background: transparent;
  border: 1px dashed var(--dmu-line);
}
.dmu-cell[data-future] {
  background: transparent;
  opacity: .18;
  border: 1px solid var(--dmu-muted);
}
.dmu-cell[data-today] {
  outline: 1px solid var(--dmu-accent);
  outline-offset: 1px;
}
.dmu-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--dmu-text);
  color: var(--dmu-bg);
  font-size: 9px;
  white-space: nowrap;
  padding: 6px 8px;
  border-radius: 5px;
  z-index: 2;
  pointer-events: none;
}
.dmu-cell:nth-child(-n+21) .dmu-tooltip {
  left: 0;
  transform: none;
}
.dmu-cell:nth-child(n+64) .dmu-tooltip {
  left: auto;
  right: 0;
  transform: none;
}
.dmu-cell:hover .dmu-tooltip,
.dmu-cell:focus-visible .dmu-tooltip {
  display: block;
}
.dmu-legend {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 10px;
  font-size: 9px;
  color: var(--dmu-muted);
}
.dmu-legend i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.dmu-legend > span:first-child {
  margin-right: 3px;
}
.dmu-legend > span:nth-last-child(2) {
  margin-left: 3px;
}
.dmu-unknown-key {
  margin-left: auto;
}
.dmu-card footer {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 11px 20px;
  border-top: 1px solid var(--dmu-line);
  font-size: 10px;
  color: var(--dmu-muted);
}
.dmu-status {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--dmu-accent);
  flex: none;
}
.dmu-status-stale {
  background: #bd975c;
}
.dmu-empty {
  font-size: 10px;
  line-height: 1.5;
  color: var(--dmu-muted);
  margin: 12px 0 0;
}
.dmu-skeleton {
  padding: 20px 22px;
  height: 395px;
}
.dmu-skeleton i {
  display: block;
  background: var(--dmu-hover);
  height: 48px;
  margin-bottom: 25px;
  border-radius: 6px;
  animation: dmu-pulse 1.5s infinite;
}
.dmu-skeleton i:last-child {
  height: 160px;
}
.dmu-spinning svg {
  animation: dmu-spin 1s linear infinite;
}
@keyframes dmu-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes dmu-pulse {
  50% {
    opacity: .4;
  }
}
@keyframes dmu-in {
  from {
    opacity: 0;
    transform: translateY(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion:reduce) {
  .dmu-card:popover-open,
  .dmu-spinning svg,
  .dmu-skeleton i {
    animation: none;
  }
}
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .dmu-card {
    background:
      linear-gradient(
        145deg,
        var(--dmu-sheen),
        transparent 45%),
      var(--dmu-glass);
    border-color: var(--dmu-outline);
    -webkit-backdrop-filter: blur(24px) saturate(145%);
    backdrop-filter: blur(24px) saturate(145%);
  }
}
.dmu-local {
  margin-left: auto;
  padding: 3px 6px;
  font-size: 9px;
  color: var(--dmu-muted);
  border: 1px solid var(--dmu-line);
  border-radius: 5px;
}
.dmu-card header .dmu-refresh {
  margin-left: 1px;
}
.dmu-models {
  margin: 0 20px;
  padding: 14px 0;
  border-bottom: 1px solid var(--dmu-line);
}
.dmu-models .dmu-section-heading {
  margin-bottom: 10px;
}
.dmu-period {
  display: flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--dmu-line);
  border-radius: 7px;
  background: var(--dmu-surface);
}
.dmu-period button {
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 10px;
  padding: 3px 7px;
  border-radius: 4px;
  color: var(--dmu-muted);
  cursor: pointer;
}
.dmu-period button[aria-pressed=true] {
  color: var(--dmu-accent);
  background: var(--dmu-hover);
  box-shadow: 0 1px 2px #00000009;
}
.dmu-model-list {
  display: grid;
  gap: 6px;
  max-height: 126px;
  overflow: auto;
  scrollbar-width: thin;
}
.dmu-model-row {
  min-width: 0;
  padding: 9px 10px;
  border-radius: 9px;
  border: 1px solid var(--dmu-line);
  background: var(--dmu-surface);
}
.dmu-model-top {
  display: flex;
  gap: 9px;
  align-items: center;
  font-size: 11px;
}
.dmu-model-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 550;
}
.dmu-model-top strong {
  flex: none;
  font-size: 12px;
  font-weight: 550;
  color: var(--dmu-accent);
}
.dmu-model-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 5px;
  font-size: 9px;
  color: var(--dmu-muted);
}
.dmu-model-provider {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dmu-model-meta > span:last-child {
  flex: none;
  white-space: nowrap;
}
.dmu-model-meta i {
  display: inline-block;
  margin: 0 6px;
  height: 6px;
  width: 1px;
  background: var(--dmu-line);
}
.dmu-model-empty {
  margin: 0;
  padding: 5px 0;
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .dmu-card {
    background: var(--dmu-bg);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--dmu-line);
  }
}
`;var j=require("react/jsx-runtime"),te=["slots"];function ae(t){let n,a=new AbortController,d=()=>n??(n=fetch("/api/dsh-mini-usage",{headers:{"x-dsh-mini-usage":"1"},signal:AbortSignal.any([a.signal,AbortSignal.timeout(6e4)])}).then(async r=>{if(!r.ok)throw new Error("Unavailable");let s=await r.json();if(!s.today||!s.month||s.days?.length!==84||!Array.isArray(s.models?.today)||!Array.isArray(s.models?.month))throw new Error("Invalid response");return s}).finally(()=>{n=void 0}));t.effect(()=>{let r=document.createElement("style");return r.dataset.dshMiniUsage="",r.textContent=P,document.head.append(r),()=>{r.remove(),a.abort()}},"dsh-mini-usage: scoped style and request cleanup"),t.slots.inject("sidebar.footer.action",()=>t.slots.register({name:"sidebar.footer.action",id:"dsh-mini-usage",order:30},({wide:r})=>(0,j.jsx)(A,{wide:r,load:d})))}

return module.exports;}});
