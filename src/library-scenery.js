import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {libraryBooks} from './data/library-books.js';
// Shared resources stay bounded when learners enter and leave repeatedly.
const shapes={box:new THREE.BoxGeometry(1,1,1),round:new RoundedBoxGeometry(1,1,1,2,.09),cylinder:new THREE.CylinderGeometry(.5,.5,1,24),sphere:new THREE.SphereGeometry(.5,12,8),plane:new THREE.PlaneGeometry(1,1)};
const materials=new Map(),panels=new Map();
function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.95}));return materials.get(color)}
function make(room,type,color,size,pos){const m=new THREE.Mesh(shapes[type],material(color));m.scale.set(...size);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;room.add(m);return m}
function panel(room,key,w,h,paint,size,pos,rotation=0){
 if(!panels.has(key)){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');paint(ctx,canvas);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;panels.set(key,new THREE.MeshBasicMaterial({map,transparent:['garland','rug','table-book'].includes(key)}))}
 const mesh=new THREE.Mesh(shapes.plane,panels.get(key));mesh.scale.set(...size,1);mesh.position.set(...pos);mesh.rotation.y=rotation;room.add(mesh);return mesh;
}
function openBook(ctx,x,y,w,h){ctx.fillStyle='#fffae9';ctx.strokeStyle='#91a896';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w*.22,y-h*.15,x+w*.5,y);ctx.quadraticCurveTo(x+w*.78,y-h*.15,x+w,y);ctx.lineTo(x+w,y+h);ctx.quadraticCurveTo(x+w*.72,y+h*.83,x+w*.5,y+h);ctx.quadraticCurveTo(x+w*.25,y+h*.83,x,y+h);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x+w*.5,y);ctx.lineTo(x+w*.5,y+h);ctx.stroke()}
function floorTexture(ctx,c){ctx.fillStyle='#e6cda6';ctx.fillRect(0,0,c.width,c.height);for(let row=0;row<14;row++){ctx.fillStyle=row%2?'#e9d4b2':'#dfc49e';ctx.fillRect(0,row*74,c.width,71);ctx.strokeStyle='#b89b7326';ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(0,row*74+9+i*12);ctx.bezierCurveTo(300,row*74+i*12,700,row*74+17+i*12,1024,row*74+9+i*12);ctx.stroke()}ctx.strokeStyle='#c8ae88';ctx.beginPath();ctx.moveTo((row%3)*310+100,row*74);ctx.lineTo((row%3)*310+100,row*74+71);ctx.stroke()}}
export function decorateLibrary(room){
 const group=new THREE.Group();group.name='cozy-library';group.userData.libraryDecor=true;room.add(group);
 const colliders=[],shelves=[],books=[];
 const floor=panel(group,'floor',1024,1024,floorTexture,[15.7,13.7],[0,.018,0]);floor.rotation.x=-Math.PI/2;
 make(group,'box','#abc8bb',[15.5,.85,.12],[0,.45,-6.78]);make(group,'box','#abc8bb',[.12,.85,13.5],[-7.78,.45,0]);
 const spines=[],palette=['#c88f7d','#9bb8a2','#d5bd78','#96b8c8','#c0a8bd','#dfb18f'];
 for(const x of [-5,0,5]){
  const back=make(group,'round','#a87d58',[4.2,2.9,.55],[x,1.5,-6.23]);shelves.push(back);
  for(const dx of [-2.05,2.05])make(group,'box','#c69a6c',[.16,2.9,.95],[x+dx,1.5,-6.02]);
  for(const y of [.2,1.05,1.9,2.85])make(group,'box','#d4ad7f',[4.2,.15,1.02],[x,y,-6.03]);
  for(let row=0;row<3;row++)for(let j=0;j<14;j++){const h=.48+(j*7+row*3)%5*.055;spines.push({color:palette[(j+row)%palette.length],size:[.17+(j%3)*.02,h,.42],pos:[x-1.8+j*.265,.29+row*.85+h/2,-5.65],tilt:(j%5===0?.06:0)})}
 }
 const dummy=new THREE.Object3D();for(const color of palette){const batch=spines.filter(b=>b.color===color),mesh=new THREE.InstancedMesh(shapes.box,material(color),batch.length);batch.forEach((b,i)=>{dummy.position.set(...b.pos);dummy.scale.set(...b.size);dummy.rotation.set(0,0,b.tilt);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;group.add(mesh)}
 colliders.push({x:0,z:-6.05,w:14.7,d:1.3});
 make(group,'round','#c6a172',[9.6,.2,1.1],[0,.85,-5.33]);colliders.push({x:0,z:-5.33,w:9.6,d:1.1});
 libraryBooks.forEach((book,i)=>{
  const x=(i-2)*1.55,mesh=make(group,'round',book.color,[.92,1.28,.36],[x,1.62,-5.22]);mesh.userData.bookId=book.id;books.push(mesh);
  panel(group,'cover:'+book.id,256,384,(ctx,c)=>{ctx.fillStyle=book.color;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#ffffff66';ctx.fillRect(12,12,232,360);openBook(ctx,60,65,138,96);ctx.fillStyle='#466650';ctx.textAlign='center';ctx.font='bold 28px sans-serif';ctx.fillText(book.subtitle.split('·')[0],128,235);ctx.font='22px sans-serif';ctx.fillText('진주 이야기',128,290);ctx.fillStyle='#c3925f';ctx.beginPath();ctx.arc(128,335,8,0,Math.PI*2);ctx.fill()},[.8,1.16],[x,1.62,-5.027]);
 });
 const banner=panel(group,'banner',1000,150,(ctx,c)=>{ctx.fillStyle='#faf0d5';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#476c59';ctx.font='bold 58px sans-serif';ctx.textAlign='center';ctx.fillText('우리 동네 이야기 도서관',500,96)},[9.7,1.02],[0,3.55,-6.72]);banner.userData.libraryBanner=true;
 panel(group,'garland',1000,100,(ctx,c)=>{ctx.clearRect(0,0,c.width,c.height);ctx.strokeStyle='#c5ae8d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,15);ctx.quadraticCurveTo(500,80,1000,15);ctx.stroke();for(let i=0;i<13;i++){const x=35+i*76,y=20+Math.sin(i/12*Math.PI)*26;ctx.fillStyle=palette[i%palette.length];ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+45,y);ctx.lineTo(x+22,y+45);ctx.fill()}},[13.5,1.1],[0,4.2,-6.7]);
 const rug=panel(group,'rug',512,512,(ctx,c)=>{ctx.clearRect(0,0,512,512);ctx.fillStyle='#b8cfb0';ctx.beginPath();ctx.ellipse(256,256,245,245,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#edf0d2';ctx.lineWidth=10;ctx.beginPath();ctx.arc(256,256,223,0,Math.PI*2);ctx.stroke();openBook(ctx,140,205,232,130);ctx.fillStyle='#f5e7ac';for(const [x,y]of[[110,120],[390,150],[120,370],[385,370]]){ctx.beginPath();ctx.arc(x,y,12,0,7);ctx.fill()}},[4.5,4.9],[0,.035,.6]);rug.rotation.x=-Math.PI/2;rug.material.transparent=true;
 // Reading table and soft chairs sit alongside, never across the centre aisle.
 make(group,'cylinder','#b68d65',[.55,1.03,.55],[4.8,.52,-.2]);make(group,'cylinder','#d9b98b',[3.3,.16,3.3],[4.8,1.1,-.2]);make(group,'cylinder','#f2ddba',[3.16,.07,3.16],[4.8,1.21,-.2]);
 colliders.push({x:4.8,z:-.2,w:3.3,d:3.3});
 for(const x of [3.5,6.1]){make(group,'round','#9ebcac',[1.15,.23,1.1],[x,.65,2.1]);make(group,'round','#a9c5b4',[1.15,.9,.2],[x,1.12,2.63]);for(const dx of [-.4,.4])make(group,'cylinder','#b08b69',[.13,.62,.13],[x+dx,.31,2.1]);colliders.push({x,z:2.2,w:1.2,d:1.45})}
 const tableBook=panel(group,'table-book',400,300,(ctx,c)=>{ctx.clearRect(0,0,400,300);openBook(ctx,25,40,350,210)},[1.15,.85],[4.6,1.26,-.25]);tableBook.rotation.x=-Math.PI/2;tableBook.material.transparent=true;
 make(group,'round','#c6a37b',[3.1,.45,1.65],[-5.4,.4,-.8]);make(group,'round','#d5bdab',[3.1,.35,1.55],[-5.4,.78,-.8]);make(group,'round','#b8c9ab',[3.1,.75,.3],[-5.4,1.15,-1.48]);for(const x of [-6.2,-4.65]){const cushion=make(group,'round',x<-5?'#e3c796':'#b2c9c7',[.95,.22,1.05],[x,1,-.75]);cushion.rotation.y=x<-5?.1:-.12}colliders.push({x:-5.4,z:-.8,w:3.15,d:1.85});
 make(group,'round','#bb936a',[2.8,1.1,1.35],[-4.5,.59,3.2]);make(group,'round','#edcf9e',[3,.16,1.55],[-4.5,1.2,3.2]);colliders.push({x:-4.5,z:3.2,w:3,d:1.55});
 panel(group,'desk-sign',600,140,(ctx,c)=>{ctx.fillStyle='#f7edce';ctx.fillRect(0,0,600,140);ctx.fillStyle='#53735d';ctx.font='bold 44px sans-serif';ctx.textAlign='center';ctx.fillText('책과 친구가 되는 곳',300,90)},[2.45,.57],[-4.5,.75,3.89]);
 for(let i=0;i<3;i++)make(group,'round',palette[i],[.68,.09,.85],[-4.7,1.34+i*.1,3.1]);
 make(group,'cylinder','#c69b7b',[.85,.85,.85],[-6.7,.45,3.5]);for(const [dx,dy,dz]of[[0,1.2,0],[-.3,1.4,.1],[.25,1.55,0]]){const leaf=make(group,'sphere','#8dae87',[.75,1,.5],[-6.7+dx,dy,3.5+dz]);leaf.rotation.z=dx}colliders.push({x:-6.7,z:3.5,w:1.1,d:1.1});
 const window=panel(group,'window',480,600,(ctx,c)=>{ctx.fillStyle='#ead8b8';ctx.fillRect(0,0,480,600);ctx.fillStyle='#bfddd9';ctx.fillRect(20,20,440,560);ctx.fillStyle='#fff8e4';for(const [x,y]of[[150,150],[310,240],[100,345]]){ctx.beginPath();ctx.ellipse(x,y,90,25,0,0,7);ctx.fill()}ctx.fillStyle='#a7c395';ctx.beginPath();ctx.moveTo(20,530);ctx.quadraticCurveTo(200,360,460,500);ctx.lineTo(460,580);ctx.lineTo(20,580);ctx.fill();ctx.fillStyle='#ead8b8';ctx.fillRect(232,20,16,560);ctx.fillRect(20,290,440,16)},[2.6,3],[-7.68,2.3,3.1],Math.PI/2);window.userData.libraryWindow=true;
 const mural=panel(group,'mural',1024,576,(ctx,c)=>{ctx.fillStyle='#e9dfbd';ctx.fillRect(0,0,c.width,c.height);openBook(ctx,280,170,464,250)},[4.8,2.7],[-7.65,2.6,-2.5],Math.PI/2);mural.userData.libraryMural=true;
 const texture=mural.material.map;if(!texture.userData.imageStatus){texture.userData.imageStatus='loading';const img=new Image();img.onload=()=>{const ctx=texture.image.getContext('2d');ctx.drawImage(img,0,0,1024,576);texture.needsUpdate=true;texture.userData.imageStatus='ready'};img.onerror=()=>{texture.userData.imageStatus='fallback'};img.src=`${import.meta.env.BASE_URL}illustrations/library-mural.webp`}
 group.userData.furnitureCount=colliders.length;group.userData.bookCount=books.length;
 return{group,colliders,shelves,books};
}
