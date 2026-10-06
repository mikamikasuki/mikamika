// One-shot entrance. Removing the animation restores the original SVG attributes.
export const cardEase='cubic-bezier(.16,1,.3,1)';
const regions=[
 {start:0,end:125,codes:['NY','MA','NJ','ME','CT','RI','NH','VT','DC']},
 {start:120,end:280,codes:['DE','MD','PA','VA','WV','NC','SC','GA','FL']},
 {start:285,end:590,codes:['OH','MI','IN','IL','WI','MN','IA','NE','SD','KY','TN','AL','MS','MO','AR','LA','KS','OK','ND','TX']},
 {start:595,end:795,codes:['CO','WY','MT','UT','AZ','ID','NM']},
 {start:832,end:880,codes:['NV','CA','OR','WA','AK','HI']},
];
export function visitedEntranceWave(map,places){
 const visited=new Set(places.filter(s=>s.visited).map(s=>s.code)),wave=[];
 for(const region of regions){
  const codes=region.codes.filter(code=>visited.has(code)&&map.some(s=>s.code===code));
  codes.forEach((code,i)=>wave.push({code,delay:Math.round(180+region.start+i*(region.end-region.start)/Math.max(1,codes.length-1)),duration:420+(i%3)*25,color:places.find(s=>s.code===code).color}));
 }
 return wave;
}
function overshootColor(from,to){return '#'+[1,3,5].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(from.slice(i,i+2),16)+1.07*(parseInt(to.slice(i,i+2),16)-parseInt(from.slice(i,i+2),16))))).toString(16).padStart(2,'0')).join('');}
export function cardEntranceStyles(wave,unvisited){
 return `@keyframes scene-row-in{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@keyframes scene-track-in{from{opacity:0}to{opacity:1}}
@keyframes scene-rank-draw{from{opacity:0;stroke-dasharray:0 276.4602}2%{opacity:1}to{opacity:1;stroke-dasharray:var(--scene-rank-length) 276.4602}}
@keyframes scene-streak-draw{from{opacity:0;stroke-dasharray:0 276.4602;transform:rotate(-90deg)}2%{opacity:1}to{opacity:1;stroke-dasharray:276.4602 276.4602;transform:rotate(-90deg)}}
@keyframes scene-flame-in{from{opacity:0}to{opacity:1}}
@keyframes scene-map-settle{from{transform:scale(1.08)}to{transform:scale(1)}}
.scene-row-intro{animation:scene-row-in 520ms ${cardEase} backwards}
.scene-rank-track{animation:scene-track-in 400ms ${cardEase} backwards}
.scene-rank-draw{animation:scene-rank-draw 1200ms ${cardEase} backwards}
.scene-streak-draw{transform-box:view-box;animation:scene-streak-draw 1200ms ${cardEase} 100ms backwards}
.scene-flame-intro{animation:scene-flame-in 420ms ${cardEase} 650ms backwards}
#scene-map-intro{transform-box:view-box;animation:scene-map-settle 1400ms ${cardEase} 180ms backwards}
${wave.map(({code,delay,duration,color})=>`@keyframes scene-state-in-${code}{0%{fill:${unvisited};animation-timing-function:${cardEase}}72%{fill:${overshootColor(unvisited,color)};animation-timing-function:cubic-bezier(.33,0,.67,1)}100%{fill:${color}}}#state-${code}{animation:scene-state-in-${code} ${duration}ms ${cardEase} ${delay}ms backwards}`).join('')}
svg[data-card-intro="pending"] .scene-card-intro{animation-play-state:paused}
svg[data-card-intro="complete"] .scene-card-intro{animation:none}
@media(prefers-reduced-motion:reduce){.scene-card-intro{animation:none!important}}`;
}
