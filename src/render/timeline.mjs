import {spring,smooth} from './motion.mjs';
export const ease=spring;
const progress=(t,[a,b],curve=spring)=>curve((t-a)/(b-a));
export const layerSpread=(t,phases,index)=>progress(t,[phases.expand[0]+index*40,phases.expand[1]+index*40])*(1-progress(t,[phases.collapse[0]+index*40,phases.collapse[1]+index*40],smooth));
export function frameAt(timeMs,preview,states){
 if(!preview.enabled||!states.length||timeMs<preview.initial_idle_ms)return {state:null,opacity:0,highlight:0,spread:0,lift:10,scale:.96};
 const elapsed=timeMs-preview.initial_idle_ms, index=Math.floor(elapsed/preview.state_cycle_ms)%states.length,t=elapsed%preview.state_cycle_ms,p=preview.phases;
 const opacity=progress(t,p.enter)*(1-progress(t,p.exit,smooth)),highlight=progress(t,p.highlight)*(1-progress(t,p.restore));
 return {state:states[index],t,index,opacity,highlight,spread:progress(t,p.expand)*(1-progress(t,p.collapse)),lift:8*(1-opacity),scale:.96+.04*opacity};
}
export function selectPreviews(manifest,preview,date='1970-01-01'){
 let a=[...manifest.states,...(manifest.regions??[])].filter(s=>s.visited&&s.preview_enabled&&s.preview.length);a.sort((x,y)=>{const ix=preview.order.indexOf(x.code),iy=preview.order.indexOf(y.code);return (ix<0?999:ix)-(iy<0?999:iy)||x.code.localeCompare(y.code);});
 if(preview.selection==='daily'&&a.length){const k=Math.floor(Date.parse(date)/86400000)%a.length;a=[...a.slice(k),...a.slice(0,k)];}
 return preview.enabled?a.slice(0,preview.max_states):[];
}
