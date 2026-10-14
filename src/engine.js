import * as T from 'three';

const fieldGLSL = `
uniform vec3 uOrigin; uniform vec3 uAxis; uniform float uMode;
uniform float uFront; uniform float uWidth; uniform float uProgress;
uniform float uOrder; uniform float uMin; uniform float uWire; uniform float uWhite;
uniform float uLag; uniform float uGlitch; uniform float uTime;
uniform float uScopeR;
float field(vec3 p) {
 vec3 q=p-uOrigin;
 float d=uMode<.5?length(q.xz):(uMode<1.5?length(q):dot(q,uAxis)-uMin);
 return d+max(q.y,0.)*uOrder;
}
float phase(vec3 p) {return (uFront-field(p))/max(uWidth,.001);}
`;
export function seeded(seed) {let s=seed>>>0;return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function ease(v,curve){v=T.MathUtils.clamp(v,0,1);return curve==='linear'?v:curve==='steps'?Math.floor(v*20)/20:v*v*(3-2*v);}
function polygon(n,irregular=false){const s=new T.Shape();for(let i=0;i<n;i++){const a=i/n*Math.PI*2, r=irregular?(.3+(i%3)*.13):.5;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?s.lineTo(x,y):s.moveTo(x,y);}s.closePath();const g=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.012,bevelThickness:.01});g.translate(0,0,-.5);return g;}
function makeShape(type){return type==='triangle'?polygon(3):type==='hexagon'?polygon(6):type==='irregular'?polygon(5,true):type==='strip'?new T.BoxGeometry(.24,1,1):new T.BoxGeometry(1,1,1);}

// One world-space field drives source, shadows, points, outlines and volumetric pieces.
// Original materials remain untouched and are re-attached at the completed endpoint.
export class ReconstructionEngine {
 constructor(scene,state){this.scene=scene;this.state=state;this.root=null;this.records=[];this.fragments=[];this.pointCloud=null;this.range=1;
 this.uniforms={uOrigin:{value:new T.Vector3()},uAxis:{value:new T.Vector3(1,0,0)},uMode:{value:0},uFront:{value:0},uWidth:{value:1},uProgress:{value:0},uOrder:{value:0},uMin:{value:0},uWire:{value:.4},uWhite:{value:1},uLag:{value:.5},uGlitch:{value:0},uTime:{value:0},uScopeR:{value:-1},uDrift:{value:1},uSpin:{value:2},uSize:{value:1},uThickness:{value:.15}};
 }
 patchSurface(material,kind='surface'){
  const m=material.clone();const previous=m.onBeforeCompile;
  m.onBeforeCompile=(s,r)=>{previous?.(s,r);Object.assign(s.uniforms,this.uniforms);
   s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>\nvarying vec3 vReconWorld;\n${fieldGLSL}`).replace('#include <project_vertex>',`#include <project_vertex>\nvec4 reconPosition=${kind==='line'?'vec4(position,1.0)':'vec4(transformed,1.0)'};\n#ifdef USE_INSTANCING\nreconPosition=instanceMatrix*reconPosition;\n#endif\nvReconWorld = (modelMatrix * reconPosition).xyz;`);
   if(kind!=='line')s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nif(uProgress<.9999 && uGlitch>0.){vec3 wp=(modelMatrix*vec4(transformed,1.)).xyz;float ph=phase(wp);float gate=smoothstep(-.2,.2,ph)*(1.-smoothstep(.4,2.,ph));float shift=step(.5,fract(floor(wp.y*8.)*.123+floor(uTime*10.)*.7))-.5;transformed.x+=shift*uGlitch*uWidth*.13*gate;}`);
   s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 vReconWorld;\n${fieldGLSL}`);
   if(kind==='surface'){
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nif(uScopeR>=0. && field(vReconWorld)>uScopeR)discard;
    if(uProgress<.9999){float ph=phase(vReconWorld);if(ph<.10) discard;
    float matPhase=smoothstep(.16+uLag,.78+uLag,ph);
    diffuseColor.rgb=mix(vec3(.82,.86,.88),diffuseColor.rgb,1.-uWhite*(1.-matPhase));
    float cells=step(.94,fract((vReconWorld.x+vReconWorld.z)*22.));
    diffuseColor.rgb+=vec3(.25,.4,.46)*cells*uGlitch*(1.-matPhase)*step(.5,fract(uTime*9.));}`);
   }else if(kind==='depth'){
    s.fragmentShader=s.fragmentShader.replace('void main() {','void main() {\nif(uScopeR>=0. && field(vReconWorld)>uScopeR)discard;\nif(uProgress<.9999 && phase(vReconWorld)<.10) discard;');
   }else{
    s.fragmentShader=s.fragmentShader.replace('void main() {','void main() {\nif(uScopeR>=0. && field(vReconWorld)>uScopeR)discard;\nfloat ph=phase(vReconWorld); if(uProgress>=.9999 || ph<-.55 || ph>1.6+uLag) discard;');
   }
  };m.customProgramCacheKey=()=>`animus-${kind}-v4`;return m;
 }
 setRoot(root){this.clear();this.root=root;this.scene.add(root);root.updateMatrixWorld(true);
  root.traverse(o=>{if(!o.isMesh)return; const original=o.material;const mats=Array.isArray(original)?original:[original];
   const effects=mats.map(m=>this.patchSurface(m));
   const record={o,original,effect:Array.isArray(original)?effects:effects[0],oldDepth:o.customDepthMaterial,depth:this.patchSurface(new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking}),'depth'),edges:null};
   o.material=record.effect;o.customDepthMaterial=record.depth;
   if(!o.isSkinnedMesh && !o.isInstancedMesh){const edge=this.patchSurface(new T.LineBasicMaterial({color:0xb7d2dd,transparent:true,opacity:.25}),'line');const lines=new T.LineSegments(new T.EdgesGeometry(o.geometry,26),edge);lines.matrixAutoUpdate=false;lines.matrix.copy(o.matrixWorld);lines.name='__recon_edges';this.scene.add(lines);record.edges=lines;}
   this.records.push(record);
  });
  this.box=new T.Box3();this.records.filter(r=>!this.isExcluded(r.o)).forEach(r=>this.box.union(new T.Box3().setFromObject(r.o)));if(this.box.isEmpty())this.box.setFromObject(root);this.rebuildFragments();this.update(this.state.time/this.state.duration);
 }
 surfaceSamples(count){
  const triangles=[];let total=0;const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),edge=new T.Vector3(),cross=new T.Vector3();
  for(const rec of this.records){const o=rec.o;if(!this.isVisible(o)||this.isExcluded(o)||o.userData.noFragments)continue;
   const p=o.geometry.attributes.position,ix=o.geometry.index;if(!p)continue;const n=ix?ix.count:p.count;
   const matrices=[];if(o.isInstancedMesh){const step=Math.max(1,Math.ceil(o.count/256));for(let instance=0;instance<o.count;instance+=step){const m=new T.Matrix4();o.getMatrixAt(instance,m);matrices.push(o.matrixWorld.clone().multiply(m));}}else matrices.push(o.matrixWorld);
   // Bounded stratified candidate selection protects interactive imports from giant meshes.
   const stride=Math.max(1,Math.ceil(n/3*matrices.length/50000));
   for(const matrix of matrices)for(let i=0;i+2<n;i+=3*stride){a.fromBufferAttribute(p,ix?ix.getX(i):i).applyMatrix4(matrix);b.fromBufferAttribute(p,ix?ix.getX(i+1):i+1).applyMatrix4(matrix);c.fromBufferAttribute(p,ix?ix.getX(i+2):i+2).applyMatrix4(matrix);
    cross.subVectors(b,a).cross(edge.subVectors(c,a));const area=cross.length()*.5*stride;if(area<1e-10)continue;const matIndex=o.geometry.groups.find(g=>i>=g.start&&i<g.start+g.count)?.materialIndex||0;const sourceMat=Array.isArray(rec.original)?rec.original[matIndex]||rec.original[0]:rec.original;total+=area;triangles.push({a:a.clone(),b:b.clone(),c:c.clone(),normal:cross.clone().normalize(),total,color:sourceMat.color?.clone()||new T.Color('white'),uuid:o.uuid});
   }
  }
  if(!triangles.length)return [];const rnd=seeded(this.state.seed),samples=[];
  for(let i=0;i<count;i++){const target=rnd()*total;let lo=0,hi=triangles.length-1;while(lo<hi){const mid=(lo+hi)>>1;triangles[mid].total<target?lo=mid+1:hi=mid;}const tr=triangles[lo];const r=Math.sqrt(rnd()),v=rnd();const pos=tr.a.clone().multiplyScalar(1-r).addScaledVector(tr.b,r*(1-v)).addScaledVector(tr.c,r*v);samples.push({pos,normal:tr.normal,color:tr.color,uuid:tr.uuid,seed:rnd(),size:.45+rnd()*1.1});}
  return samples;
 }
 isExcluded(o){for(let p=o;p;p=p.parent){if(p.userData.exclude)return true;}return false;}
 isVisible(o){for(let p=o;p;p=p.parent){if(!p.visible)return false;}return true;}
 fragmentMaterial(){const s=this.state;const base={color:s.shardColor,roughness:s.roughness,metalness:s.shardMaterial==='metal'?s.metalness:0,clearcoat:1,clearcoatRoughness:.08};
   if(s.shardMaterial==='glass')Object.assign(base,{transmission:s.transmission,thickness:.22,ior:s.ior,roughness:s.roughness,metalness:0,dispersion:.03,attenuationColor:new T.Color(s.shardColor),attenuationDistance:2});
  if(s.shardMaterial==='iridescent')Object.assign(base,{metalness:.35,iridescence:1,iridescenceIOR:1.35,iridescenceThicknessRange:[100,430]});
  if(s.shardMaterial==='original')Object.assign(base,{vertexColors:true,color:'#ffffff',metalness:.35});
  const m=new T.MeshPhysicalMaterial(base);m.onBeforeCompile=(shader)=>{Object.assign(shader.uniforms,this.uniforms);
   shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\n${fieldGLSL}\nattribute vec3 aTarget; attribute vec3 aNormal; attribute float aSeed;\nuniform float uDrift; uniform float uSpin; uniform float uSize; uniform float uThickness;\n`);
   shader.vertexShader=shader.vertexShader.replace('void main() {',`void main() {
   float ph=phase(aTarget); float settle=smoothstep(-.35,.85,ph);
   float pieceVisibility=smoothstep(-.7,-.35,ph)*(1.-smoothstep(.55,1.1,ph));
   pieceVisibility*=step(.00001,uProgress)*(1.-step(.9999,uProgress));
   if(uScopeR>=0. && field(aTarget)>uScopeR)pieceVisibility=0.;
   float angle=(1.-settle)*(aSeed*6.283+uSpin*3.14159);
   mat3 rot=mat3(cos(angle),0.,sin(angle),0.,1.,0.,-sin(angle),0.,cos(angle));
   `);
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\ntransformed.z*=uThickness; transformed=rot*transformed*uSize*pieceVisibility;`);
   shader.vertexShader=shader.vertexShader.replace('#include <defaultnormal_vertex>',`objectNormal=rot*objectNormal;\n#include <defaultnormal_vertex>`);
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 mvPosition=instanceMatrix*vec4(transformed,1.0);
   float lift=(1.-settle)*uDrift;
   mvPosition.xyz+=aNormal*lift+vec3(sin(aSeed*61.+settle*3.),.35+sin(aSeed*34.),cos(aSeed*57.))*lift*.45;
   mvPosition=modelViewMatrix*mvPosition;gl_Position=projectionMatrix*mvPosition;`);
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>\n#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined( USE_SHADOWMAP ) || defined( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0\nworldPosition.xyz+=aNormal*lift+vec3(sin(aSeed*61.+settle*3.),.35+sin(aSeed*34.),cos(aSeed*57.))*lift*.45;\n#endif`);
  };m.customProgramCacheKey=()=>`animus-fragment-v4`;return m;
 }
 rebuildFragments(){
  for(const f of this.fragments){this.scene.remove(f);f.geometry.dispose();f.material.dispose();f.customDepthMaterial?.dispose();}this.fragments=[];
  if(this.pointCloud){this.scene.remove(this.pointCloud);this.pointCloud.geometry.dispose();this.pointCloud.material.dispose();}
  const samples=this.surfaceSamples(Math.min(24000,Math.max(200,Math.round(this.state.density))));this.samples=samples;
  const types=this.state.shape==='mixed'?['triangle','square','hexagon','strip','irregular']:[this.state.shape];
  const buckets=types.map(()=>[]);samples.forEach((s,i)=>buckets[i%types.length].push(s));const dummy=new T.Object3D(),q=new T.Quaternion();
  buckets.forEach((list,k)=>{const geo=makeShape(types[k]);const targets=[],normals=[],seeds=[];const mesh=new T.InstancedMesh(geo,this.fragmentMaterial(),list.length);mesh.frustumCulled=false;mesh.name='__recon_fragments';
   list.forEach((s,i)=>{dummy.position.copy(s.pos);q.setFromUnitVectors(new T.Vector3(0,0,1),s.normal);dummy.quaternion.copy(q);dummy.rotateZ(s.seed*6.283);dummy.scale.setScalar(s.size);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(this.state.shardMaterial==='original')mesh.setColorAt(i,s.color);targets.push(...s.pos);normals.push(...s.normal);seeds.push(s.seed);});
   mesh.castShadow=true;mesh.customDepthMaterial=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking});mesh.customDepthMaterial.onBeforeCompile=mesh.material.onBeforeCompile;mesh.customDepthMaterial.customProgramCacheKey=()=> 'animus-fragment-depth-v5';
   geo.setAttribute('aTarget',new T.InstancedBufferAttribute(new Float32Array(targets),3));geo.setAttribute('aNormal',new T.InstancedBufferAttribute(new Float32Array(normals),3));geo.setAttribute('aSeed',new T.InstancedBufferAttribute(new Float32Array(seeds),1));this.scene.add(mesh);this.fragments.push(mesh);
  });
  const geo=new T.BufferGeometry().setFromPoints(samples.filter((_,i)=>i%2===0).map(s=>s.pos));
  const mat=new T.PointsMaterial({color:0xc3e6f2,size:.027,transparent:true,opacity:.5});mat.onBeforeCompile=s=>{Object.assign(s.uniforms,this.uniforms);s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>\n${fieldGLSL}`);s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>\nfloat ph=phase(position);gl_PointSize*=smoothstep(-1.,-.2,ph)*(1.-smoothstep(.5,1.8,ph))*step(.00001,uProgress)*(1.-step(.9999,uProgress));`);};this.pointCloud=new T.Points(geo,mat);this.scene.add(this.pointCloud);
 }
 computeField(){const s=this.state,u=this.uniforms;u.uOrigin.value.set(s.originX,s.originY,s.originZ);u.uAxis.value.set(Math.cos(s.axis*Math.PI/180),0,Math.sin(s.axis*Math.PI/180));u.uMode.value=s.mode==='radial'?0:s.mode==='sphere'?1:2;u.uOrder.value=s.order==='ground'?.3:0;
  const values=[];for(let x of [this.box.min.x,this.box.max.x])for(let y of [this.box.min.y,this.box.max.y])for(let z of [this.box.min.z,this.box.max.z]){let p=new T.Vector3(x,y,z).sub(u.uOrigin.value);values.push((u.uMode.value===0?Math.hypot(p.x,p.z):u.uMode.value===1?p.length():p.dot(u.uAxis.value))+Math.max(p.y,0)*u.uOrder.value);}
  u.uMin.value=s.mode==='direction'?Math.min(...values):0;this.range=Math.max(...values)-u.uMin.value;
 }
 update(progress){if(!this.root)return;const s=this.state,u=this.uniforms;this.computeField();const p=s.reverse?1-progress:progress;u.uProgress.value=T.MathUtils.clamp(p,0,1);u.uTime.value=s.time;u.uWidth.value=s.width;u.uScopeR.value=s.range<.9999?this.range*s.range:-1;u.uFront.value=ease(p,s.curve)*(this.range*s.range+s.width*(3+s.materialLag))-s.width;u.uLag.value=s.materialLag;u.uWire.value=s.wire;u.uWhite.value=s.white;u.uGlitch.value=s.glitch;u.uDrift.value=s.drift;u.uSpin.value=s.spin;u.uSize.value=s.size;u.uThickness.value=s.thickness;
  for(const rec of this.records){const excluded=this.isExcluded(rec.o),complete=p>=.9999&&s.range>=.9999;rec.o.material=complete||excluded?rec.original:rec.effect;rec.o.customDepthMaterial=complete||excluded?rec.oldDepth:rec.depth;
   if(rec.edges){rec.edges.visible=!excluded&&this.isVisible(rec.o)&&s.wire>0&&p>0&&p<.9999;rec.edges.material.opacity=s.wire*.65;}
  }
  if(this.pointCloud){this.pointCloud.visible=s.points>0;this.pointCloud.material.opacity=s.points;}
  for(const f of this.fragments)if(f.material.transmission>0)f.material.thickness=s.size*s.thickness;
 }
 audit(){return {meshes:this.records.length,fragments:this.samples?.length||0,range:this.range,materialRestored:this.records.every(r=>r.o.material===r.original),excluded:this.records.filter(r=>this.isExcluded(r.o)).length,seed:this.state.seed,bounds:this.box?.getSize(new T.Vector3()).toArray()};}
 clear(){for(const rec of this.records){rec.o.material=rec.original;rec.o.customDepthMaterial=rec.oldDepth;(Array.isArray(rec.effect)?rec.effect:[rec.effect]).forEach(m=>m.dispose());rec.depth.dispose();if(rec.edges){this.scene.remove(rec.edges);rec.edges.geometry.dispose();rec.edges.material.dispose();}}
  for(const f of this.fragments){this.scene.remove(f);f.geometry.dispose();f.material.dispose();f.customDepthMaterial?.dispose();}this.fragments=[];if(this.pointCloud){this.scene.remove(this.pointCloud);this.pointCloud.geometry.dispose();this.pointCloud.material.dispose();this.pointCloud=null;}if(this.root)this.scene.remove(this.root);this.records=[];
 }
}
