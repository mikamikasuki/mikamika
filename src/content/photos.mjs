import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { PLACES, PLACE_CODES } from './states.mjs';
const supported=/\.(jpe?g|png|webp|heic)$/i;
const convert=promisify(execFile);
async function imageData(file,source){
 if(!/\.heic$/i.test(file))return source;
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'mikamika-heic-'));
 try{
  const output=path.join(temp,'photo.jpg');
  await convert('heif-convert',['--quiet','-q','95',file,output]);
  return await fs.readFile(output);
 }finally{await fs.rm(temp,{recursive:true,force:true});}
}
const natural=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
const within=(root,p)=>p===root||p.startsWith(root+path.sep);
export async function scanPhotos(root,config,out,{cache='.cache/photos'}={}){
 root=await fs.realpath(root);await fs.mkdir(cache,{recursive:true});await fs.mkdir(path.join(out,'photos'),{recursive:true});
 const dirs=new Map(),warnings=[];
 async function walk(dir){
  for(const e of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>natural.compare(a.name,b.name))){
   if(e.name.startsWith('.'))continue;const p=path.join(dir,e.name),real=await fs.realpath(p);
   if(!within(root,real))throw new Error(`Photo link escapes photos root: ${path.relative(root,p)}`);
   if(e.isSymbolicLink()){warnings.push(`Skipped symbolic link: ${path.relative(root,p)}`);continue;}
   if(e.isDirectory()){
    if(PLACE_CODES.includes(e.name.toUpperCase())){const code=e.name.toUpperCase();if(dirs.has(code))throw new Error(`Duplicate state directories: ${code}`);dirs.set(code,p);}else await walk(p);
   }
  }
 }
 await walk(root);
 const states=[];
 for(const base of PLACES){
  const c=(base.kind==='district'?config.regions?.[base.code]:config.states[base.code])??{},dir=dirs.get(base.code),valid=[];
  if(dir&&c.visited!==false){
   const files=(await fs.readdir(dir,{withFileTypes:true})).filter(e=>!e.name.startsWith('.')&&!e.isDirectory()&&supported.test(e.name)).sort((a,b)=>natural.compare(a.name,b.name));
   for(const f of files){const p=path.join(dir,f.name);const real=await fs.realpath(p);if(!within(root,real))throw new Error(`Photo link escapes photos root: ${base.code}/${f.name}`);if(f.isSymbolicLink()){warnings.push(`Skipped symbolic link: ${base.code}/${f.name}`);continue;}
    try {
     const source=await fs.readFile(p),focus=c.photo_focus?.[f.name]??[.5,.5];
     const hash=crypto.createHash('sha256').update(source).update(JSON.stringify({v:2,focus,width:1800,thumb:[420,260]})).digest('hex').slice(0,24);
     const thumb=`${hash}-thumb.webp`,full=`${hash}.webp`;
     try{await fs.access(path.join(cache,thumb));await fs.access(path.join(cache,full));}catch{
      const data=await imageData(p,source);
      const {data:normal,info}=await sharp(data,{limitInputPixels:60_000_000}).rotate().toColourspace('srgb').resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer({resolveWithObject:true});
      const scale=Math.max(420/info.width,260/info.height),w=Math.ceil(info.width*scale),h=Math.ceil(info.height*scale);
      const left=Math.max(0,Math.min(w-420,Math.round(w*focus[0]-210))),top=Math.max(0,Math.min(h-260,Math.round(h*focus[1]-130)));
      await sharp(normal).resize(w,h).extract({left,top,width:420,height:260}).webp({quality:78}).toFile(path.join(cache,thumb));await fs.writeFile(path.join(cache,full),normal);
     }
     await fs.copyFile(path.join(cache,thumb),path.join(out,'photos',thumb));await fs.copyFile(path.join(cache,full),path.join(out,'photos',full));
     valid.push({name:f.name,thumb:`photos/${thumb}`,src:`photos/${full}`,focus});
    }catch(error){
     if(/\.heic$/i.test(f.name))throw new Error(`Could not convert HEIC photo ${base.code}/${f.name}: ${error.message}`);
     warnings.push(`Invalid image skipped: ${base.code}/${f.name}`);
    }
   }
  }
  const rank=f=>c.photo_order?.indexOf(f.name)??-1;
  valid.sort((a,b)=>{const ai=rank(a),bi=rank(b);return (ai<0?999:ai)-(bi<0?999:bi)||natural.compare(a.name,b.name);});
  const cover=valid.find(f=>f.name===c.cover)??valid.find(f=>/^cover\./i.test(f.name))??valid[0];
  if(c.cover&&!valid.some(f=>f.name===c.cover)&&c.visited!==false)warnings.push(`Configured cover unavailable: ${base.code}/${c.cover}`);
  const visited=c.visited===true||(c.visited!==false&&config.map.infer_visited_from_photos&&valid.length>0);
  let preview=c.preview_photos?c.preview_photos.map(name=>valid.find(f=>f.name===name)).filter(Boolean):[cover,...valid.filter(f=>f!==cover)].filter(Boolean);
  preview=[...new Set(preview)].slice(0,config.preview.max_photos);
  // Unvisited photos are neither referenced nor copied into the publish tree.
  if(!visited){for(const f of valid){/* files may be shared by hash; prune globally below */} }
  states.push({...base,visited,title:c.title??base.name,subtitle:c.subtitle??'',color:c.color??config.map.visited_color,preview_enabled:c.preview_enabled!==false,photos:visited?valid:[],preview:visited?preview:[]});
 }
 const used=new Set(states.flatMap(s=>s.photos.flatMap(f=>[path.basename(f.src),path.basename(f.thumb)])));
 for(const f of await fs.readdir(path.join(out,'photos')))if(!used.has(f))await fs.unlink(path.join(out,'photos',f));
 return {schema_version:1,visited:states.filter(s=>s.kind==='state'&&s.visited).length,states:states.filter(s=>s.kind==='state'),regions:states.filter(s=>s.kind==='district'),warnings};
}
