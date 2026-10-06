import fs from 'node:fs/promises';import sharp from 'sharp';import assert from 'node:assert/strict';
await fs.mkdir('.test-output/reference',{recursive:true});const results=[];
// Exclude dynamic metrics/dates, travel colors and fixture photos. Keep all labels and primary geometry.
const masks=[[206,232,40,154],[305,276,56,49],[444,263,151,37],[443,330,170,29],[685,262,52,43],[668,357,83,27],[890,243,238,135],[892,378,236,16],[872,88,202,105]];
for(const [name,left,top,width,height] of [['p1-idle',39,69,1970,663],['p2-bubble',37,70,1973,664]]){
 const reference=await sharp(`reference/${name.startsWith('p1')?'p1-idle':'p2-bubble'}.png`).extract({left,top,width,height}).resize(1200,404).removeAlpha().raw().toBuffer();
 const actual=await sharp(`.test-output/${name}.png`).resize(1200,404).removeAlpha().raw().toBuffer();let sum=0,n=0,diff=Buffer.alloc(reference.length,255);
 for(let y=0;y<404;y++)for(let x=0;x<1200;x++){if(masks.some(([mx,my,mw,mh])=>x>=mx&&x<mx+mw&&y>=my&&y<my+mh))continue;for(let c=0;c<3;c++){const i=(y*1200+x)*3+c,d=Math.abs(reference[i]-actual[i]);sum+=d;n++;diff[i]=255-Math.min(255,d*3);}}
 const mae=sum/n;assert.ok(mae<18,`${name}: unmasked color difference ${mae}`);
 await sharp(reference,{raw:{width:1200,height:404,channels:3}}).png().toFile(`.test-output/reference/${name}-normalized.png`);
 await sharp(diff,{raw:{width:1200,height:404,channels:3}}).png().toFile(`.test-output/reference/${name}-difference.png`);
 results.push({name,mean_absolute_rgb_difference:+mae.toFixed(3),threshold:18,masked_rectangles:masks});
}
await fs.writeFile('.test-output/reference-comparison.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({name,mean_absolute_rgb_difference})=>({name,mean_absolute_rgb_difference}))));
