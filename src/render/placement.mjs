const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// The tail base is centered; the tip stays on the target even at an edge.
export function placeBubble(anchor,{width,height,boundsWidth,edge=8,tailLength=36,minY=8}){
 const x=clamp(anchor[0]-width/2,edge,boundsWidth-width-edge),y=Math.max(minY,anchor[1]-height-tailLength);
 return {x,y,baseX:width/2,tipX:anchor[0]-x,tipY:anchor[1]-y};
}
export function bubblePlacement(anchor,layout){const [,,width,height]=layout.boxes.bubble;return placeBubble(anchor,{width,height,boundsWidth:layout.canvas.width,tailLength:layout.bubble.tail_length});}
export function bubbleOrigin(anchor,layout){const {x,y}=bubblePlacement(anchor,layout);return [x,y];}
