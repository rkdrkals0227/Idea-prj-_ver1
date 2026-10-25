import * as THREE from 'three';
function rng(seed=73){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
export function riverAt(z){return {x:-28+Math.sin(z*.18)*.45,width:1.25+Math.sin(z*.29)*.18}}
export function naturalTerrain(group) {
 const random=rng(),c=document.createElement('canvas');c.width=1536;c.height=1280;const ctx=c.getContext('2d'),sx=c.width/66,sy=c.height/56;
 const grad=ctx.createLinearGradient(0,0,c.width,c.height);grad.addColorStop(0,'#aebf83');grad.addColorStop(.5,'#bbcc91');grad.addColorStop(1,'#9fb981');ctx.fillStyle=grad;ctx.fillRect(0,0,c.width,c.height);
 for(let i=0;i<150;i++){const x=random()*c.width,y=random()*c.height,r=30+random()*110,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%2?'#d7ddaa40':'#789b5b28');g.addColorStop(1,'#acc78900');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
 const point=([x,z])=>[(x+33)*sx,(z+28)*sy];
 function trail(points,width){ctx.lineCap='round';ctx.lineJoin='round';for(const [w,color] of [[width+.3,'#b5bc9480'],[width,'#d4c5a5'],[width-.15,'#d8c9aa']]){ctx.beginPath();points.forEach((p,i)=>{const [x,y]=point(p);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)});ctx.strokeStyle=color;ctx.lineWidth=w*sx;ctx.stroke()}}
 trail([[-24,3.05],[26,3.05]],3.6);
 trail([[1,-6],[1,3.05],[1,8]],2.8);trail([[-10,-1],[-10,3.05]],2.6);
 trail([[1,-6],[5,-6],[8,-10],[26,-10]],2.4);
 // The repaired route follows the main school-to-apartment road.
 for(let i=0;i<16000;i++){const x=random()*c.width,y=random()*c.height;ctx.strokeStyle=i%3?'#75955712':'#fff5d31b';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(random()-.5)*3,y-1-random()*2);ctx.stroke()}
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(66,56),new THREE.MeshStandardMaterial({map:texture,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=.005;ground.receiveShadow=true;ground.userData.naturalTerrain=true;group.add(ground);
 const shore=[],water=[];
 for(let side=0;side<2;side++)for(let i=0;i<=48;i++){const z=side?24-i:-24+i,{x,width}=riverAt(z),direction=side?1:-1;shore.push(new THREE.Vector2(x+direction*(width+.45),-z));water.push(new THREE.Vector2(x+direction*width,-z))}
 function surface(points,color,y){const shape=new THREE.Shape(points),mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color,roughness:.65}));mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;group.add(mesh);return mesh}
 surface(shore,0xb5bd92,.015);const stream=surface(water,0x77b8bc,.025);stream.userData.naturalRiver=true;
 const rippleMat=new THREE.LineBasicMaterial({color:0xc3dfd2,transparent:true,opacity:.4});
 for(let i=0;i<23;i++){const z=-22+i*2,{x}=riverAt(z),points=[];for(let j=0;j<8;j++)points.push(new THREE.Vector3(x-.65+j*.15,.033,z+Math.sin(j*.5)*.08));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),rippleMat);group.add(line)}
 return {ground,stream};
}
function canvasPanel(width,height,paint){const c=document.createElement('canvas');c.width=width;c.height=height;paint(c.getContext('2d'),c);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:t}));m.userData.ownedTexture=true;return m}
export function decorateClassroom(room,rules) {
 const make=(color,size,pos)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness:.9}));m.position.set(...pos);room.add(m);return m};
 make(0xa4c5bd,[15.6,1,.16],[0,.5,-6.75]);make(0xc29565,[12.5,4.9,.28],[0,2.9,-6.65]);
 const board=canvasPanel(1600,840,(x,c)=>{x.fillStyle='#355f54';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#83a18b30';for(let i=0;i<80;i++){x.beginPath();x.moveTo((i*273)%1600,i*11);x.lineTo((i*273)%1600+120,i*11);x.stroke()}
 x.fillStyle='#f8f1cc';x.font='bold 52px sans-serif';x.fillText(`${rules.month}  우리 학급 회의 결과`,80,95);x.font='32px sans-serif';x.fillStyle='#d4e7d4';x.fillText('함께 정하고, 함께 지켜요 ♡',85,150);
 let y=225;for(const r of rules.rules){x.fillStyle='#eedba1';x.font='bold 31px sans-serif';x.fillText(r.group,85,y);y+=48;x.fillStyle='#fffbe8';x.font='36px sans-serif';let line='';for(const char of r.text){if(x.measureText(line+char).width>1400){x.fillText(line,100,y);y+=42;line=''}line+=char}x.fillText(line,100,y);y+=77}
 });board.scale.set(12.1,4.5,1);board.position.set(0,2.9,-6.47);room.add(board);
 make(0xd3b088,[12.7,.18,.5],[0,.48,-6.3]);make(0xf7edcf,[.6,.09,.12],[-3,.62,-6.15]);make(0xf1ce98,[.3,.1,.18],[-2,.62,-6.15]);
 for(const x of [-4.7,4.7])for(const z of [-.8,2.6]){
  make(0xe8c28e,[2.6,.25,1.5],[x,1.4,z]);for(const dx of [-1,1])for(const dz of [-.5,.5])make(0xa8beb7,[.12,1.4,.12],[x+dx,.7,z+dz]);
  make(0xa6c6b5,[1.1,.16,1],[x,.8,z+1.2]);make(0xa6c6b5,[1.1,.9,.12],[x,1.25,z+1.65]);
  make(0xf9f3d9,[.55,.045,.6],[x-.5,1.56,z]);make(0xd9907e,[.5,.08,.65],[x+.4,1.57,z]);
 }
 for(const z of [-3,1]){make(0xc29169,[.18,2.5,2.7],[-7.72,2.5,z]);const window=canvasPanel(300,300,(x)=>{x.fillStyle='#bce0df';x.fillRect(0,0,300,300);x.fillStyle='#f7faf0';for(const [a,b] of [[70,80],[170,160],[50,235]]){x.beginPath();x.ellipse(a,b,70,22,0,0,Math.PI*2);x.fill()}x.fillStyle='#eedac0';x.fillRect(143,0,14,300);x.fillRect(0,143,300,14)});window.rotation.y=Math.PI/2;window.scale.set(2.4,2.2,1);window.position.set(-7.6,2.5,z);room.add(window)}
 const rug=new THREE.Mesh(new THREE.CircleGeometry(1.2,48),new THREE.MeshStandardMaterial({color:0xc8d9b4}));rug.rotation.x=-Math.PI/2;rug.scale.set(1.1,1.7,1);rug.position.set(0,.03,1);room.add(rug);
 make(0xe9b99e,[1.7,.5,.4],[5.8,3,-6.35]);
 const banner=canvasPanel(600,130,(x)=>{x.fillStyle='#f4dfb8';x.fillRect(0,0,600,130);x.fillStyle='#6c806c';x.font='bold 54px sans-serif';x.fillText('우리의 작은 교실',50,85)});banner.scale.set(3.8,.8,1);banner.position.set(4.9,3.8,-6.4);room.add(banner);
}
