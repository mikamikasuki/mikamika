// Critically damped, normalized spring: continuous motion with no overshoot.
// Both SVG samples and browser keyframes use this response.
export const spring=t=>{t=Math.max(0,Math.min(1,t));return (1-(1+8*t)*Math.exp(-8*t))/(1-9*Math.exp(-8));};
export const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const motionSamples=(fn,count=40)=>Array.from({length:count+1},(_,i)=>({...fn(i/count),offset:i/count}));
