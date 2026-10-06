import fs from 'node:fs/promises';
import path from 'node:path';
import { parse,stringify } from 'yaml';
import { build } from 'esbuild';
import sharp from 'sharp';
import { profileSchema,travelSchema } from '../src/content/schema.mjs';
import { addSamplePreviews } from '../src/content/samples.mjs';
import { scanPhotos } from '../src/content/photos.mjs';
import { fetchStats,localToken } from '../src/data/github.mjs';
import { buildMap } from '../src/render/map.mjs';
import { renderScene } from '../src/render/scene.mjs';
import { selectPreviews } from '../src/render/timeline.mjs';
export const fixtureMode=process.argv.includes('--fixtures');
const dest=fixtureMode?'.test-output/site':'dist';const stage=dest+'-next';
await fs.rm(stage,{recursive:true,force:true});await fs.mkdir(stage,{recursive:true});
const profile=profileSchema.parse(parse(await fs.readFile('content/profile.yaml','utf8')));
const travel=travelSchema.parse(parse(await fs.readFile('content/travel.yaml','utf8')));
const layout=JSON.parse(await fs.readFile('content/layout.json'));const buildDate=(process.env.BUILD_DATE??new Date().toISOString()).slice(0,10);
let photoRoot='photos';
if(fixtureMode){
 travel.states={};travel.regions={};
 photoRoot='.test-output/fixture-photos';await fs.rm(photoRoot,{recursive:true,force:true});
 for(const code of ['CA','NJ','AK','HI','RI','TX','NY','OR']){
  await fs.mkdir(`${photoRoot}/Testing/${code}`,{recursive:true});
  for(let i=0;i<3;i++)await sharp('tests/fixtures/landscape.png').modulate({hue:i*50}).resize(840,520).toFile(`${photoRoot}/Testing/${code}/${i?'测试 '+i+'.PNG':'cover.png'}`);
  travel.states[code]={visited:true,subtitle:code==='CA'?'Synthetic photo fixture · not a travel record':'Test images only',color:'#CAA3C2',preview_enabled:true};
 }
 travel.preview.order=['CA','NJ','AK','HI','RI','TX'];
}
const manifest=await scanPhotos(photoRoot,travel,stage);manifest.build_date=buildDate;await addSamplePreviews(manifest,travel,stage);
for(const warning of manifest.warnings)console.warn(warning);
const stats=fixtureMode?{status:'fixture',source:'visual-test fixture',stars:79,commits:63,prs:202,issues:26,contributed:134,total:394,created_at:'2025-05-11T00:00:00Z',rank:{level:'B+',percentile:45},streak:{count:7,start:'2025-09-29',end:'2025-10-05'}}:await fetchStats(profile,{token:process.env.OFFLINE==='1'?undefined:localToken()});
const map=buildMap(layout,{includeRegions:true});
const embedded=structuredClone(manifest);for(const s of selectPreviews(embedded,travel.preview,buildDate))for(const f of s.preview)f.dataURI='data:image/webp;base64,'+(await fs.readFile(path.join(stage,f.thumb))).toString('base64');
await fs.mkdir(path.join(stage,'assets/readme'),{recursive:true});
for(const theme of ['light','dark'])for(const motion of ['animated','static']){
 const svg=renderScene({profile,travel,layout,manifest:embedded,stats,map,theme,animated:motion==='animated',buildDate});
 const name=`profile-${theme}${motion==='static'?'-static':''}.svg`;await fs.writeFile(path.join(stage,'assets/readme',name),svg);
 console.log(`${name}: ${(Buffer.byteLength(svg)/1048576).toFixed(2)} MiB`);
 if(Buffer.byteLength(svg)>4*1048576)throw new Error('SVG exceeds the 4 MiB budget');
}
const publicData={profile,travel,layout,manifest,stats,map};
await fs.writeFile(path.join(stage,'data.json'),JSON.stringify(publicData));
await fs.writeFile(path.join(stage,'travel.yaml'),fixtureMode?stringify(travel):await fs.readFile('content/travel.yaml'));
await fs.mkdir(path.join(stage,'assets/fonts'),{recursive:true});
for(const weight of [400,700,800])await fs.copyFile(`node_modules/@fontsource/nunito/files/nunito-latin-${weight}-normal.woff2`,path.join(stage,`assets/fonts/nunito-${weight}.woff2`));
await fs.writeFile(path.join(stage,'scene-light.svg'),renderScene({...publicData,manifest:embedded,theme:'light'}));
await fs.writeFile(path.join(stage,'scene-dark.svg'),renderScene({...publicData,manifest:embedded,theme:'dark'}));
let html=await fs.readFile('src/site/index.html','utf8');html=html.replace('<!-- SCENE -->',renderScene({...publicData,manifest:embedded,theme:'light'}));
await fs.writeFile(path.join(stage,'index.html'),html);
await fs.copyFile('src/site/editor.html',path.join(stage,'editor.html'));await fs.copyFile('src/site/style.css',path.join(stage,'style.css'));
await build({entryPoints:['src/site/app.mjs','src/site/editor.mjs'],outdir:stage,bundle:true,format:'esm',target:'es2022',minify:true});
if(fixtureMode){await fs.writeFile(path.join(stage,'image-test.html'),'<!doctype html><html><body></body></html>');for(const [name,timeMs] of [['p1-idle',1000],['p2-bubble',2500],['p3-collapse',2850],['p4-idle',3500]])await fs.writeFile(path.join(stage,`${name}.svg`),renderScene({profile,travel,layout,manifest:embedded,stats,map,timeMs,theme:'light',buildDate}));}
await fs.rm(dest,{recursive:true,force:true});await fs.rename(stage,dest);
if(!fixtureMode){await fs.mkdir('assets/generated',{recursive:true});for(const theme of ['light','dark'])await fs.copyFile(`${dest}/assets/readme/profile-${theme}-static.svg`,`assets/generated/profile-${theme}-static.svg`);await fs.writeFile('assets/generated/stats.json',JSON.stringify(stats,null,2)+'\n');}
console.log(`Built ${dest}: ${manifest.visited} visited states, ${[...manifest.states,...manifest.regions].reduce((a,s)=>a+s.photos.length,0)} public photos.`);
