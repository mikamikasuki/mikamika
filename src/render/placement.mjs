const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// The tail stays fixed in local bubble coordinates; only the whole bubble moves.
export function bubbleOrigin(anchor,layout){
 const [x,y,w]=layout.boxes.bubble,[rx,ry]=layout.bubble.origin_anchor??[930,307];const [minX,maxX,minY,maxY]=layout.bubble.max_shift??[-22,83,-12,12];
 return [clamp(x+clamp((anchor?.[0]??rx)-rx,minX,maxX),16,layout.canvas.width-w-16),y+clamp(((anchor?.[1]??ry)-ry)*.2,minY,maxY)];
}
