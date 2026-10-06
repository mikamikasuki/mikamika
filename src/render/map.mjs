import fs from 'node:fs';
import { feature } from 'topojson-client';
import { geoIdentity, geoPath } from 'd3-geo';
import polylabel from 'polylabel';
import { STATES, PLACES } from '../content/states.mjs';
export function buildMap(layout,{includeRegions=false}={}){
 const places=includeRegions?PLACES:STATES;
 const topology=JSON.parse(fs.readFileSync(new URL('../../vendor/us-states-albers-10m.json',import.meta.url)));
 const collection=feature(topology,topology.objects.states);collection.features=collection.features.filter(f=>places.some(s=>s.fips===String(f.id).padStart(2,'0')));
 const [x,y,w,h]=layout.map.box,projection=geoIdentity().fitExtent([[x,y],[x+w,y+h]],collection),draw=geoPath(projection);
 return collection.features.map(f=>{
  const state=places.find(s=>s.fips===String(f.id).padStart(2,'0'));
  const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
  const area=r=>Math.abs(r.reduce((n,p,i)=>{const q=r[(i+1)%r.length];return n+p[0]*q[1]-q[0]*p[1];},0));
  const largest=[...polygons].sort((a,b)=>area(b[0])-area(a[0]))[0];
  const anchor=projection(polylabel(largest,.5));
  return {...state,path:draw(f),anchor,bounds:draw.bounds(f)};
 });
}
