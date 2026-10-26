export const MAP_WIDTH=820,MAP_HEIGHT=550;
export function normaliseMapZoom(value){const n=Number(value);return Number.isFinite(n)&&n>=1&&n<=3?Math.round(n*100)/100:1}
export function mapPoint(position){return{x:(position.x+33)/66*MAP_WIDTH,y:(position.z+28)/56*MAP_HEIGHT}}
export class MapView{
 constructor(zoom=1){this.zoom=normaliseMapZoom(zoom);this.panX=0;this.panY=0}
 clamp(){const x=MAP_WIDTH*(this.zoom-1)/2,y=MAP_HEIGHT*(this.zoom-1)/2;this.panX=Math.max(-x,Math.min(x,this.panX))||0;this.panY=Math.max(-y,Math.min(y,this.panY))||0}
 setZoom(value,anchor={x:MAP_WIDTH/2,y:MAP_HEIGHT/2}){
  if(!Number.isFinite(value))return;
  const next=Math.round(Math.max(1,Math.min(3,value))*100)/100,ratio=next/this.zoom,dx=anchor.x-MAP_WIDTH/2,dy=anchor.y-MAP_HEIGHT/2;
  this.panX=dx-(dx-this.panX)*ratio;this.panY=dy-(dy-this.panY)*ratio;this.zoom=next;this.clamp();
 }
 panBy(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return;this.panX+=x;this.panY+=y;this.clamp()}
 centreOn(point){this.panX=(MAP_WIDTH/2-point.x)*this.zoom;this.panY=(MAP_HEIGHT/2-point.y)*this.zoom;this.clamp()}
 reset(){this.zoom=1;this.panX=0;this.panY=0}
}
