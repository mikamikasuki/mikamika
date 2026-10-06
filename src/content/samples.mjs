import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export async function addSamplePreviews(manifest,travel,out){
 if(!travel.preview.sample_photos_when_empty)return;
 const places=[...manifest.states,...manifest.regions];
 if(!places.some(s=>s.visited&&s.photos.length<travel.preview.max_photos))return;
 await fs.mkdir(path.join(out,'samples'),{recursive:true});
 const samples=[];
 for(let i=1;i<=3;i++){
  const source=new URL(`../../assets/samples/${i}.svg`,import.meta.url);
  const src=`samples/${i}.webp`,thumb=`samples/${i}-thumb.webp`;
  await sharp(source.pathname).webp({quality:85}).toFile(path.join(out,src));
  await sharp(source.pathname).resize(420,260).webp({quality:85}).toFile(path.join(out,thumb));
  samples.push({name:`Sample image ${i}`,sample:true,src,thumb});
 }
 manifest.sample_photos=samples;
 for(const s of places){
  if(!s.visited||s.photos.length>=travel.preview.max_photos)continue;
  const real=[...s.preview,...s.photos.filter(f=>!s.preview.includes(f))];
  s.preview=[...real,...samples.slice(0,travel.preview.max_photos-real.length)];
 }
}
