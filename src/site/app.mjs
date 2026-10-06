import {layerSpread} from '../render/timeline.mjs';
import {spring,smooth,motionSamples} from '../render/motion.mjs';
import {placeBubble} from '../render/placement.mjs';
const $=s=>document.querySelector(s);const data=await (await fetch('./data.json')).json();const {profile,travel,layout:l,manifest,stats,map}=data;const places=[...manifest.states,...(manifest.regions??[])];
const scene=$('#scene'),bubble=$('#bubble'),album=$('#album'),lightbox=$('#lightbox'),select=$('#state-select');
let mode='idle',active=null,pinned=null,enterTimer,leaveTimer,restoreFocus=null,photoIndex=0,albumState=null,theme='system',target=null,animationGeneration=0,cardIntroStarted=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),dark=matchMedia('(prefers-color-scheme: dark)');

function state(code){return places.find(s=>s.code===code);}
function manual(){clearTimeout(enterTimer);clearTimeout(leaveTimer);}
function baseColor(s){return s.visited?s.color:(document.documentElement.dataset.theme==='dark'?'#40394D':travel.map.unvisited_color);}
function blend(a,b,t){return "#"+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,"0")).join("");}
function colorMap(code,amount=1){for(const p of document.querySelectorAll('path[data-state]')){const s=state(p.dataset.state);p.setAttribute('fill',s.code===code?blend(baseColor(s),travel.map.active_color,amount):baseColor(s));}for(const m of document.querySelectorAll('.active-marker'))m.remove();if(code){const shape=map.find(s=>s.code===code);for(const svg of document.querySelectorAll('#travel-map')){const ns='http://www.w3.org/2000/svg',circle=document.createElementNS(ns,'circle');circle.setAttribute('cx',shape.anchor[0]);circle.setAttribute('cy',shape.anchor[1]);circle.setAttribute('r','4');circle.setAttribute('fill',travel.map.active_color);circle.setAttribute('stroke','#fff');circle.setAttribute('stroke-width','1.3');circle.setAttribute('opacity',amount);circle.setAttribute('class','active-marker');circle.setAttribute('pointer-events','none');svg.append(circle);}}}
function pointerTarget(e,code){const svg=$('#travel-map'),point=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());target={code,point:[point.x,point.y]};}
function positionBubble(){
 if(bubble.hidden)return;const svg=$('#travel-map'),shape=map.find(s=>s.code===active);if(!shape)return;
 const point=target?.code===active?target.point:shape.anchor,projected=new DOMPoint(...point).matrixTransform(svg.getScreenCTM()),ax=projected.x,ay=projected.y,width=Math.min(300*(l.bubble.scale??1),innerWidth-28),scale=width/l.boxes.bubble[2],uiScale=width/300;
 bubble.style.setProperty('--ui-scale',uiScale);bubble.style.width=`${width}px`;bubble.style.padding=`${12*scale}px`;bubble.style.setProperty('--title-size',`${l.bubble.title_size*scale}px`);bubble.style.setProperty('--subtitle-size',`${l.bubble.subtitle_size*scale}px`);bubble.style.setProperty('--photo-width',`${l.bubble.photo[2]*scale}px`);bubble.style.setProperty('--photo-height',`${l.bubble.photo[3]*scale}px`);bubble.style.setProperty('--stack-height',`${(l.bubble.photo[3]+18)*scale}px`);
 const placement=placeBubble([ax,ay],{width,height:bubble.offsetHeight,boundsWidth:innerWidth,edge:14,tailLength:36*uiScale,minY:16});
 bubble.style.left=`${placement.x}px`;bubble.style.top=`${placement.y}px`;bubble.style.transformOrigin=`${placement.tipX}px ${placement.tipY}px`;
 bubble.style.setProperty('--tail-height',`${placement.tipY-bubble.offsetHeight}px`);bubble.style.setProperty('--tail-clip',`polygon(${(placement.baseX-11*uiScale)/width*100}% 0,${(placement.baseX+11*uiScale)/width*100}% 0,${placement.tipX/width*100}% 100%)`);
 bubble.dataset.tipX=ax;bubble.dataset.tipY=ay;bubble.dataset.baseX=placement.baseX;
 const count=bubble.querySelectorAll('img').length,factor=Math.min(1,(l.boxes.bubble[2]-24-(l.bubble.offsets[count-1]?.[0]??54))/l.bubble.photo[2]);
 for(const img of bubble.querySelectorAll('img')){const i=+img.dataset.index,[dx,dy]=l.bubble.offsets[i]??[54,27];img.style.setProperty('--dx',`${dx*scale}px`);img.style.setProperty('--dy',`${dy*scale}px`);img.style.setProperty('--scale',factor);img.style.setProperty('--blur',`${i*.75*scale}px`);img.style.rotate='0deg';}
}
function animateOpen(){
 animationGeneration++;bubble.getAnimations().forEach(a=>a.cancel());for(const img of bubble.querySelectorAll('img'))img.getAnimations().forEach(a=>a.cancel());if(reduced.matches)return;
 bubble.animate(motionSamples(t=>({opacity:spring(t),transform:`scale(${.96+.04*spring(t)})`})),{duration:280});
 for(const img of bubble.querySelectorAll('img')){const i=+img.dataset.index,dx=parseFloat(img.style.getPropertyValue('--dx')),dy=parseFloat(img.style.getPropertyValue('--dy'));
 const duration=travel.preview.phases.expand[1]+(bubble.querySelectorAll('img').length-1)*40;img.animate(motionSamples(t=>{const spread=layerSpread(t*duration,travel.preview.phases,i);return {left:`${dx*spread}px`,top:`${dy*spread}px`};}),{duration});}
}

function show(code,nextMode='hover-preview',spread=1,highlight=1){const changed=bubble.hidden||active!==code;const s=state(code);active=code;mode=nextMode;colorMap(code,highlight);select.value=code;
 if(!s?.visited){bubble.hidden=true;$('#state-note').textContent=`${s.title} · Not visited yet`;return;}
 $('#state-note').textContent='';$('#no-photos').hidden=!!s.preview.length;$('#photo-stack').hidden=!s.preview.length;$('#open-album').hidden=!s.preview.length;$('#bubble-photo-count').textContent=s.preview.some(f=>f.sample)?'':`${s.photos.length} ${s.photos.length===1?'photo':'photos'}`;bubble.querySelector('h2').textContent=s.title;bubble.querySelector('.subtitle').textContent='Visited: '+(s.subtitle||'—');bubble.dataset.spread=spread;if(nextMode!=='idle')bubble.querySelectorAll('img').forEach(img=>delete img.dataset.spread);
 const stack=$('#photo-stack');if(stack.dataset.state!==code){stack.replaceChildren();for(let i=s.preview.length-1;i>=0;i--){const img=document.createElement('img');img.src=s.preview[i].thumb;img.alt=s.preview[i].sample?s.preview[i].name:`${s.title} — ${s.preview[i].name}`;img.dataset.index=i;img.style.setProperty('--layer-index',i);stack.append(img);}stack.dataset.state=code;}
 bubble.hidden=false;bubble.style.opacity='1';bubble.style.transform='none';positionBubble();if(changed)animateOpen();
}
function closePreview({focus=false}={}){
 clearTimeout(enterTimer);clearTimeout(leaveTimer);const generation=++animationGeneration;$('#photo-stack').dataset.state='';const finish=()=>{if(generation===animationGeneration)bubble.hidden=true;};
 if(bubble.hidden||reduced.matches)finish();else{bubble.getAnimations().forEach(a=>a.cancel());const phases=travel.preview.phases,start=phases.collapse[0],duration=phases.exit[1]-start;
 for(const img of bubble.querySelectorAll('img')){img.getAnimations().forEach(a=>a.cancel());const i=+img.dataset.index,dx=parseFloat(img.style.getPropertyValue('--dx')),dy=parseFloat(img.style.getPropertyValue('--dy'));img.animate(motionSamples(t=>{const spread=layerSpread(start+t*duration,phases,i);return {left:`${dx*spread}px`,top:`${dy*spread}px`};}),{duration,fill:'forwards'});}
 const animation=bubble.animate(motionSamples(t=>{const opacity=1-smooth((start+t*duration-phases.exit[0])/(phases.exit[1]-phases.exit[0]));return {opacity,transform:`scale(${.96+.04*opacity})`};}),{duration,fill:'forwards'});animation.finished.then(finish).catch(()=>{});}
 pinned=null;active=null;target=null;mode='idle';colorMap(null);select.value='';$('#state-note').textContent='';if(focus)restoreFocus?.focus();
}
function choose(code,node,e){manual();if(e?.detail)pointerTarget(e,code);else target=null;restoreFocus=node??select;pinned=code;show(code,'pinned');}

function attachMap(){for(const path of document.querySelectorAll('#travel-map path[id^="state-"]')){const code=path.id.slice(6);path.dataset.state=code;path.removeAttribute('id');path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',`${state(code).title}${state(code).visited?', visited':''}`);
 path.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;manual();if(pinned)return;pointerTarget(e,code);enterTimer=setTimeout(()=>show(code),140);});
 path.addEventListener('pointermove',e=>{if(!pinned&&e.pointerType!=='touch'){pointerTarget(e,code);if(active===code)positionBubble();}});
 path.addEventListener('pointerleave',()=>{clearTimeout(enterTimer);if(!pinned)leaveTimer=setTimeout(()=>closePreview(),250);});
 path.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')e.preventDefault();});path.addEventListener('click',e=>{e.stopPropagation();choose(code,path,e);});path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(code,path);}});
 }}
function createMap(){
 const svg=$('#travel-map'),[x,y,w,h]=l.map.box;svg.setAttribute('viewBox',`${x-14} ${y-12} ${w+28} ${h+24}`);svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.replaceChildren();
 for(const shape of map){const ns='http://www.w3.org/2000/svg',p=document.createElementNS(ns,'path');p.id=`state-${shape.code}`;p.setAttribute('d',shape.path);p.setAttribute('fill',baseColor(state(shape.code)));p.setAttribute('stroke','var(--map-border)');p.setAttribute('stroke-width','.68');p.setAttribute('stroke-linejoin','round');const title=document.createElementNS(ns,'title');title.textContent=state(shape.code).title;p.append(title);svg.append(p);}
 attachMap();
}
function renderPlaces(){
 const list=$('#visited-places');list.replaceChildren();for(const s of places.filter(s=>s.visited).sort((a,b)=>a.name.localeCompare(b.name))){const button=document.createElement('button');button.className='place-chip';button.dataset.code=s.code;const code=document.createElement('span');code.className='place-code';code.textContent=s.code;const name=document.createElement('span');name.textContent=s.title;button.append(code,name);if(s.photos.length){const n=document.createElement('span');n.className='place-photo-count';n.textContent=s.photos.length;button.append(n);}button.addEventListener('click',()=>{$('#travel-map').scrollIntoView({block:'center',behavior:'instant'});choose(s.code,button);});list.append(button);}
 const districts=(manifest.regions??[]).filter(s=>s.visited);$('#journey-summary').textContent=`${manifest.visited} / 50 states`;$('#state-count').textContent=`${manifest.visited} / 50`;$('#district-note').textContent=districts.length?'Washington, D.C. is listed separately.':'';const albums=places.filter(s=>s.visited&&s.photos.length).length;$('#album-total').textContent=albums?`${albums} photo albums`:'';
}
async function setTheme(value){theme=value;localStorage.setItem('mika-theme',value);const resolved=value==='system'?(dark.matches?'dark':'light'):value;document.documentElement.dataset.theme=resolved;
 const source=await (await fetch(`./scene-${resolved}.svg`)).text();scene.innerHTML=source.replace('<svg ',`<svg data-card-intro="${cardIntroStarted?'complete':'pending'}" `);if($('#about').open&&!cardIntroStarted)startCardIntro();const mobile=document.createElement('div');mobile.className='mobile-about';for(const line of profile.about){const p=document.createElement('p');p.textContent=line;mobile.append(p);}scene.append(mobile);createMap();colorMap(active);positionBubble();}
for(const s of places){const o=document.createElement('option');o.value=s.code;o.textContent=`${s.code} — ${s.title}${s.visited?' ♡':''}`;select.append(o);}
select.addEventListener('change',()=>{if(select.value)choose(select.value,select);else{manual();closePreview();}});
bubble.addEventListener('pointerenter',()=>clearTimeout(leaveTimer));bubble.addEventListener('pointerleave',()=>{if(!pinned)leaveTimer=setTimeout(()=>closePreview(),250);});
$('#close-preview').addEventListener('click',()=>{manual();closePreview({focus:true});});
document.addEventListener('click',e=>{if(!e.target.closest('#bubble,[data-state],select,dialog,.place-chip')){manual();closePreview();}});
function openAlbum(code,{hash=true}={}){const original=state(code);if(!original?.visited||!original.preview.length)return;const s={...original,photos:original.photos.length?original.photos:original.preview};manual();albumState=s;mode='album';bubble.hidden=true;$('#album-title').textContent=s.title;$('#album-subtitle').textContent='Visited: '+(s.subtitle||'—');album.querySelector('.section-kicker').textContent='PHOTO ALBUM';const grid=$('#album-grid');grid.replaceChildren();s.photos.forEach((f,i)=>{const button=document.createElement('button'),img=document.createElement('img');button.setAttribute('aria-label',`Open photo ${i+1}: ${f.name}`);img.src=f.thumb;img.loading='lazy';img.alt=f.name;button.append(img);button.addEventListener('click',()=>openPhoto(i));grid.append(button);});if(!album.open)album.showModal();if(hash)history.replaceState(null,'',`#state=${s.code}`);}
function closeAlbum(){album.close();mode=pinned?'pinned':'idle';history.replaceState(null,'',location.pathname+location.search);if(pinned)show(pinned,'pinned');else closePreview();restoreFocus?.focus();}
function displayPhoto(){const f=albumState.photos[photoIndex];$('#large-photo').src=f.src;$('#large-photo').alt=`${albumState.title} — ${f.name}`;$('#photo-counter').textContent=`${photoIndex+1} / ${albumState.photos.length}`;}
function openPhoto(i){manual();photoIndex=i;displayPhoto();mode='lightbox';lightbox.showModal();}
function closePhoto(){lightbox.close();mode='album';album.querySelectorAll('#album-grid button')[photoIndex]?.focus();}
$('#open-album').addEventListener('click',()=>openAlbum(active));$('#photo-stack').addEventListener('click',()=>openAlbum(active));$('#close-album').addEventListener('click',closeAlbum);$('#close-lightbox').addEventListener('click',closePhoto);
$('#previous-photo').addEventListener('click',()=>{photoIndex=(photoIndex-1+albumState.photos.length)%albumState.photos.length;displayPhoto();});$('#next-photo').addEventListener('click',()=>{photoIndex=(photoIndex+1)%albumState.photos.length;displayPhoto();});
album.addEventListener('cancel',e=>{e.preventDefault();closeAlbum();});lightbox.addEventListener('cancel',e=>{e.preventDefault();closePhoto();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!album.open&&!lightbox.open){manual();closePreview({focus:true});}if(lightbox.open&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();photoIndex=(photoIndex+(e.key==='ArrowRight'?1:-1)+albumState.photos.length)%albumState.photos.length;displayPhoto();}});
$('#theme').value=localStorage.getItem('mika-theme')??'system';$('#theme').addEventListener('change',()=>setTheme($('#theme').value));dark.addEventListener('change',()=>{if(theme==='system')setTheme('system');});await setTheme($('#theme').value);renderPlaces();$('#about-link').addEventListener('click',()=>{$('#about').open=true;});
function startCardIntro(){cardIntroStarted=true;scene.querySelector('svg')?.removeAttribute('data-card-intro');}
$('#about').addEventListener('toggle',()=>{if($('#about').open&&!cardIntroStarted)startCardIntro();});
$('#stats-note').textContent=`${stats.source}; ${stats.status}. ${stats.fetched_at?'Fetched '+stats.fetched_at:'No successful fetch yet'}. Commits: ${stats.window?.from??'—'} to ${stats.window?.to??'—'}. Contributions: ${stats.created_at??'—'} to present. Streak timezone: ${profile.stats_timezone}; yesterday continues a streak until today ends. GitHub contribution dates use the API’s calendar dates. Rank uses github-readme-stats; it is not a GitHub badge.`;
function readHash(){const code=new URLSearchParams(location.hash.slice(1)).get('state');if(code&&state(code)){restoreFocus=select;pinned=code;openAlbum(code,{hash:false});}}readHash();addEventListener('hashchange',readHash);
document.fonts.ready.then(positionBubble);new ResizeObserver(positionBubble).observe($('#travel-map'));
addEventListener('resize',positionBubble);addEventListener('scroll',positionBubble,{passive:true});
// Local editor preview messages never persist content or accept code/HTML.
addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='mika-preview')return;manual();const patch=e.data.travel;Object.assign(travel,patch);for(const s of places){const c=(s.kind==='district'?patch.regions?.[s.code]:patch.states?.[s.code])??{};s.visited=c.visited===true||(c.visited!==false&&patch.map.infer_visited_from_photos&&s.photos.length>0);s.subtitle=c.subtitle??'';s.color=c.color??patch.map.visited_color;s.title=c.title??s.name;let photos=c.preview_photos?.map(n=>s.photos.find(f=>f.name===n)).filter(Boolean)??[...s.photos];if(!s.photos.length&&patch.preview.sample_photos_when_empty)photos=manifest.sample_photos??[];const cover=s.photos.find(f=>f.name===c.cover);if(cover&&!c.preview_photos)photos=[cover,...photos.filter(f=>f!==cover)];s.preview=photos.slice(0,patch.preview.max_photos);s.preview_enabled=c.preview_enabled!==false;}manifest.visited=manifest.states.filter(s=>s.visited).length;renderPlaces();

closePreview();if(e.data.code){pinned=e.data.code;show(e.data.code,'pinned');if(e.data.play)animateOpen();}});
if(window.parent!==window)window.parent.postMessage({type:'mika-ready'},location.origin);
