import{MapView,mapPoint,MAP_WIDTH,MAP_HEIGHT}from'./map-view.js';
export function attachMapControls({root,zoom,draw,player,onZoom}){
 const canvas=root.querySelector('#large-map'),view=new MapView(zoom);let drag=null;
 if(view.zoom>1)view.centreOn(mapPoint(player()));
 function repaint(save=false){
  draw(canvas,view);canvas.dataset.zoom=String(view.zoom);canvas.dataset.panX=String(view.panX);canvas.dataset.panY=String(view.panY);
  root.querySelector('#map-zoom-value').textContent=`${Math.round(view.zoom*100)}%`;root.querySelector('#map-zoom-out').disabled=view.zoom<=1;root.querySelector('#map-zoom-in').disabled=view.zoom>=3;canvas.classList.toggle('can-pan',view.zoom>1);if(save)onZoom(view.zoom);
 }
 function change(next,anchor){const previous=view.zoom;view.setZoom(next,anchor);repaint(previous!==view.zoom)}
 const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*MAP_WIDTH,y:(e.clientY-r.top)/r.height*MAP_HEIGHT}};
 root.querySelector('#map-zoom-in').onclick=()=>change(view.zoom+.25);root.querySelector('#map-zoom-out').onclick=()=>change(view.zoom-.25);
 root.querySelector('#map-reset').onclick=()=>{const old=view.zoom;view.reset();repaint(old!==1)};
 root.querySelector('#map-locate').onclick=()=>{view.centreOn(mapPoint(player()));repaint()};
 canvas.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey||e.deltaY===0)return;e.preventDefault();change(view.zoom+(e.deltaY<0?.25:-.25),point(e))},{passive:false});
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;canvas.focus({preventScroll:true});if(view.zoom<=1||drag)return;e.preventDefault();drag={id:e.pointerId,...point(e)};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging')});
 canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const p=point(e);view.panBy(p.x-drag.x,p.y-drag.y);drag={id:drag.id,...p};repaint()});
 const end=e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;canvas.classList.remove('dragging');if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,end);
 canvas.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const arrows={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};if(arrows[e.key]){e.preventDefault();view.panBy(...arrows[e.key]);repaint()}else if(e.key==='+'||e.key==='='){e.preventDefault();change(view.zoom+.25)}else if(e.key==='-'){e.preventDefault();change(view.zoom-.25)}else if(e.key==='0'){e.preventDefault();const old=view.zoom;view.reset();repaint(old!==1)}});
 repaint();
}
