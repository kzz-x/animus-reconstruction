import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seeded } from './engine.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

let textureRenderer;
export function configureLoaders(renderer){textureRenderer=renderer;}
export function createLoader(manager){const d=new DRACOLoader(manager).setDecoderPath('./draco/');const l=new GLTFLoader(manager).setDRACOLoader(d).setMeshoptDecoder(MeshoptDecoder);let ktx;if(textureRenderer){ktx=new KTX2Loader(manager).setTranscoderPath('./basis/').detectSupport(textureRenderer);l.setKTX2Loader(ktx);}return {loader:l,draco:d,ktx};}
export function courtyardScene(){
 const root=new T.Group();root.name='COLONNADE · 古典建筑庭院';const grain=texture(57);
 const limestone=new T.MeshStandardMaterial({color:'#c6c1b5',roughness:.74,bumpMap:grain,bumpScale:.018});const bronze=new T.MeshPhysicalMaterial({color:'#74614a',metalness:.78,roughness:.3});
 const paving=[];for(let x=-13;x<14;x++)for(let z=-11;z<12;z++)paving.push(box(.98,.12,.98,x,-.06,z));root.add(merged(paving,limestone,'石板庭院'));
 const steps=[];for(let i=0;i<4;i++)steps.push(box(19-i*.6,.25,11-i*.5,0,.125+i*.25,-2));root.add(merged(steps,limestone,'四级台阶与基座'));
 const shafts=[],bases=[],capitals=[];for(let x of [-7.5,-4.5,-1.5,1.5,4.5,7.5])for(let z of [2,-6]){
  const shaft=new T.CylinderGeometry(.31,.4,6.5,96,12),pos=shaft.attributes.position;
  for(let i=0;i<pos.count;i++){const xx=pos.getX(i),zz=pos.getZ(i),y=pos.getY(i);if(Math.abs(y)<3.249){const a=Math.atan2(zz,xx),r=Math.hypot(xx,zz)-.028*(.5+.5*Math.cos(a*24));pos.setXYZ(i,Math.cos(a)*r,y,Math.sin(a)*r);}}shaft.computeVertexNormals();shaft.translate(x,4.65,z);shafts.push(shaft);
  for(let [r,h,y] of [[.53,.13,1.1],[.44,.12,1.24],[.48,.14,8.01],[.56,.15,8.15]]){const ring=new T.CylinderGeometry(r,r,h,48);ring.translate(x,y,z);bases.push(ring);}capitals.push(box(1.12,.19,1.12,x,8.32,z));
 }root.add(merged(shafts,limestone,'凹槽石柱'),merged(bases,limestone,'柱础与柱头环'),merged(capitals,limestone,'柱头承托'));
 const cornice=[];for(let [w,h,d,y] of [[17.8,.34,10.4,8.61],[18.1,.13,10.7,8.87],[18.4,.16,11,9.02]])cornice.push(box(w,h,d,0,y,-2));root.add(merged(cornice,limestone,'层叠檐口'));
 const teeth=[];for(let x=-8.6;x<=8.6;x+=.48)teeth.push(box(.17,.18,.25,x,8.95,3.44));root.add(merged(teeth,limestone,'齿饰细节'));
 const pediment=new T.Shape();pediment.moveTo(-9,0);pediment.lineTo(9,0);pediment.lineTo(0,3);pediment.closePath();const pedGeo=new T.ExtrudeGeometry(pediment,{depth:10,bevelEnabled:false,steps:1});pedGeo.translate(0,9.15,-7);root.add(mesh(pedGeo,limestone,'三角山墙'));
 const back=[];for(let x=-8;x<9;x+=1.2)for(let y=1.6;y<7.8;y+=.55)back.push(box(1.17,.53,.28,x,y,-6.6));root.add(merged(back,limestone,'背墙砌石'));
 const rails=[];for(let side of [-1,1]){rails.push(box(.05,.05,8,side*9.5,1.15,-1));for(let z=-5;z<=3;z+=2)rails.push(box(.04,1.15,.04,side*9.5,.57,z));}root.add(merged(rails,bronze,'庭院围栏'));
 return {root,label:'古典庭院 · 柱廊记忆',target:new T.Vector3(0,4,0),camera:new T.Vector3(18,12,24),scale:30,animations:[],asset:'courtyard'};
}
function texture(seed=11){const rnd=seeded(seed),c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),im=ctx.createImageData(256,256);for(let i=0;i<im.data.length;i+=4){const v=160+rnd()*65;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}ctx.putImageData(im,0,0);const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(8,8);return tex;}
function mesh(geo,mat,name){const m=new T.Mesh(geo,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;return m;}
function box(w,h,d,x,y,z,ry=0){const g=new T.BoxGeometry(w,h,d);g.rotateY(ry);g.translate(x,y,z);return g;}
function merged(list,mat,name){return mesh(mergeGeometries(list,false),mat,name);}
export async function carScene(){const root=new T.Group();root.name='AUTOMOTIVE · 汽车影棚';const {loader,draco}=createLoader();
 const gltf=await loader.loadAsync('./assets/CarConcept.glb');draco.dispose();const car=gltf.scene;car.name='Car Concept · 主体';
 car.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;});
 car.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(car),center=bounds.getCenter(new T.Vector3());car.position.set(-center.x,-bounds.min.y,-center.z);root.add(car);
 const floorMat=new T.MeshPhysicalMaterial({color:'#b8c2c5',roughness:.67,metalness:.03,clearcoat:.1,bumpMap:texture(),bumpScale:.004});
 const floor=mesh(new T.BoxGeometry(2000,.12,2000),floorMat,'摄影棚地面');floor.position.y=-.062;floor.userData.noFragments=true;floor.userData.exclude=true;root.add(floor);
 return {root,label:'汽车 · 光学摄影棚',target:new T.Vector3(0,.65,0),camera:new T.Vector3(5.4,2.4,6.7),scale:5,animations:gltf.animations,asset:'car'};
}
export function districtScene(){const root=new T.Group();root.name='DISTRICT · 建筑街区';const noise=texture(42);
 const stone=new T.MeshStandardMaterial({color:'#c9c6be',roughness:.78,bumpMap:noise,bumpScale:.023});const darkStone=new T.MeshStandardMaterial({color:'#737d81',roughness:.67,bumpMap:noise,bumpScale:.014});
 const bronze=new T.MeshPhysicalMaterial({color:'#8b7760',metalness:.85,roughness:.32,clearcoat:.4});
 const glass=new T.MeshPhysicalMaterial({color:'#384f5c',metalness:.35,roughness:.18,clearcoat:1,clearcoatRoughness:.1});
 const roadMat=new T.MeshStandardMaterial({color:'#454d52',roughness:.92,bumpMap:noise,bumpScale:.024});const marking=new T.MeshStandardMaterial({color:'#d5d0ba',roughness:.86});
 const ground=new T.Group();ground.name='道路与铺装';ground.add(mesh(box(38,.18,38,0,-.11,0),stone,'基座'));
 ground.add(mesh(box(8,.025,36,0,.002,0),roadMat,'中央道路'));const pavers=[];for(let x=-18;x<=18;x+=1.4)for(let z=-18;z<=18;z+=1.4){if(Math.abs(x)<4.8)continue;pavers.push(box(1.36,.035,1.36,x,.02,z));}ground.add(merged(pavers,stone,'石材铺装'));
 const lanes=[];for(let z=-17;z<18;z+=3)lanes.push(box(.075,.03,1.35,0,.033,z));for(let side of [-1,1])lanes.push(box(.08,.03,35,side*3.65,.033,0));ground.add(merged(lanes,marking,'道路标线'));root.add(ground);
 const building=(x,z,w,d,h,index)=>{const g=new T.Group();g.name=`建筑 ${String(index).padStart(2,'0')} · ${index===1?'弧形总部':'办公立面'}`;const shells=[],frames=[],windows=[],fins=[];
  const levels=Math.round(h/1.25);shells.push(box(w,.35,d,x,.15,z));shells.push(box(w,.25,d,x,h,z));
  for(let k=0;k<=levels;k++){const y=k*h/levels;frames.push(box(w,.14,d,x,y,z));}
  const cols=Math.round(w/.8);for(let j=0;j<=cols;j++){const xx=x-w/2+j*w/cols;fins.push(box(.07,h,.17,xx,h/2,z+d/2+.1));fins.push(box(.07,h,.17,xx,h/2,z-d/2-.1));}
  for(let k=0;k<levels;k++)for(let j=0;j<cols;j++){const xx=x-w/2+(j+.5)*w/cols,y=(k+.5)*h/levels;windows.push(box(w/cols-.10,h/levels-.2,.055,xx,y,z+d/2));windows.push(box(w/cols-.10,h/levels-.2,.055,xx,y,z-d/2));}
  for(let side of [-1,1]){shells.push(box(.2,h,d,x+side*w/2,h/2,z));for(let j=0;j<Math.round(d/.7);j++){fins.push(box(.17,h,.065,x+side*(w/2+.08),h/2,z-d/2+j*.7));}}
  // Ground-level colonnade and recessed entrance establish human scale.
  for(let j=0;j<cols;j+=2)shells.push(box(.25,1.25,.3,x-w/2+(j+.5)*w/cols,.62,z+d/2+.35));
  g.add(merged(shells,index%2?stone:darkStone,'混凝土结构'),merged(frames,stone,'楼层板'),merged(windows,glass,'反射玻璃立面'),merged(fins,bronze,'金属遮阳鳍片'));root.add(g);
 };
 [[-8,-9,6,5,10],[-8,-1,6,6,7],[-9,9,7,6,12],[8,-11,6,5,8],[8,-3,6,5,11],[9,6,8,6,6],[8,14,6,5,10]].forEach((b,i)=>building(...b,i+1));
 // Curved pavilion: real repeated geometry, open ground floor and a layered cornice.
 const pav=new T.Group();pav.name='弧形展馆 · 地标';const columns=[],roof=[];for(let i=0;i<31;i++){const a=-.7+i/30*2.5,r=6.5;columns.push(box(.14,3.4,.6,-10+Math.cos(a)*r,1.7,-15+Math.sin(a)*r,-a));roof.push(box(.45,.24,.9,-10+Math.cos(a)*r,3.55,-15+Math.sin(a)*r,-a));}pav.add(merged(columns,stone,'弧形柱廊'),merged(roof,bronze,'檐口'));root.add(pav);
 const furniture=new T.Group();furniture.name='街道设施与植被';const poles=[],benches=[],trunks=[],leaves=[];const steel=new T.MeshStandardMaterial({color:'#28383e',metalness:.7,roughness:.38}),wood=new T.MeshStandardMaterial({color:'#746148',roughness:.72}),green=new T.MeshStandardMaterial({color:'#485b4c',roughness:.92});
 for(let side of [-1,1])for(let z=-15;z<=15;z+=6){const x=side*4.8;poles.push(box(.07,3.3,.07,x,1.65,z),box(1.1,.07,.07,x-side*.5,3.25,z));benches.push(box(1.3,.09,.38,side*5.6,.49,z+1.7),box(1.3,.35,.08,side*5.6,.65,z+1.95));for(let dx of [-.5,.5])poles.push(box(.07,.45,.28,side*5.6+dx,.23,z+1.7));trunks.push(box(.16,1.7,.16,side*5.7,.85,z-1.4));const leaf=new T.IcosahedronGeometry(.7,2);leaf.scale(.8,1.5,.8);leaf.translate(side*5.7,2.1,z-1.4);leaves.push(leaf);}
 furniture.add(merged(poles,steel,'路灯与金属构件'),merged(benches,wood,'长椅'),merged(trunks,wood,'树干'),merged(leaves,green,'树冠'));root.add(furniture);
 return {root,label:'街区 · 现代城市记忆',target:new T.Vector3(0,2,-2),camera:new T.Vector3(23,17,29),scale:38,animations:[],asset:'district'};
}
