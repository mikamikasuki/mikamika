import * as fontkit from 'fontkit';
const fonts={};for(const weight of [400,700,800])fonts[weight]=fontkit.openSync(new URL(`../../node_modules/@fontsource/nunito/files/nunito-latin-${weight}-normal.woff`,import.meta.url).pathname);
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function tulip(x,y,size){return `<g transform="translate(${x} ${y}) scale(${size/40})"><path d="M20 40V15" stroke="#6d9a36" stroke-width="2.3"/><path d="M20 36Q2 17 6 25Q15 24 20 36M20 32Q37 14 34 22Q27 25 20 32" fill="#91bf42"/><path d="M20 24Q5 22 5 4Q14 0 20 10Q27 0 35 4Q35 22 20 24" fill="#ed6597"/><path d="M20 23Q12 17 13 1Q20 3 23 10Q25 2 30 2Q29 19 20 23" fill="#d73977"/></g>`;}
export function measure(s,size,weight=700){const f=fonts[weight];return [...s].reduce((n,c)=>n+(c==='🌷'||c==='♡'?f.unitsPerEm:f.glyphForCodePoint(c.codePointAt(0)).advanceWidth),0)*size/f.unitsPerEm;}
export function fitText(s,size,width,weight=700){while(s.length&&measure(s,size,weight)>width)s=s.slice(0,-1);return s;}
export function ellipsis(s,size,width){if(measure(s,size,400)<=width)return s;return fitText(s,size,width-measure('…',size,400),400)+'…';}
export function text(s,x,y,size,color,{anchor='start',weight=700,maxWidth}={}){
 if(maxWidth)size=Math.min(size,size*maxWidth/Math.max(measure(s,size,weight),1));const width=measure(s,size,weight);let cursor=anchor==='middle'?x-width/2:anchor==='end'?x-width:x;const font=fonts[weight],scale=size/font.unitsPerEm;let out='';
 for(const c of [...s]){if(c==='🌷')out+=tulip(cursor,y-size*.93,size);else if(c==='♡')out+=`<path d="M0 4C0 -3 8 -4 10 2C13 -4 20 -3 20 4C20 10 10 17 10 17C10 17 0 10 0 4Z" transform="translate(${cursor} ${y-size*.8}) scale(${size/22})" fill="none" stroke="${color}" stroke-width="1.8"/>`;else{const glyph=font.glyphForCodePoint(c.codePointAt(0));out+=`<path d="${glyph.path.toSVG()}" transform="translate(${cursor.toFixed(3)} ${y}) scale(${scale} ${-scale})"/>`;}
 cursor+=(c==='🌷'||c==='♡'?font.unitsPerEm:font.glyphForCodePoint(c.codePointAt(0)).advanceWidth)*scale;
 }
 return `<g fill="${color}" aria-label="${esc(s)}">${out}</g>`;
}
