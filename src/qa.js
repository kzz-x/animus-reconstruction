import * as T from 'three';
import { zip,download } from './archive.js';
import { presets } from './presets.js';

// Browser-run integration suite. It exercises the public engine against actual GLB/PBR assets.
export async function runQA(app){
 const report={date:new Date().toISOString(),checks:[],errors:[],captures:[]},files=[];
 const panel=document.createElement('div');panel.id='qa-result';panel.style.cssText='position:fixed;right:20px;top:65px;width:310px;max-height:75vh;overflow:auto;padding:20px;background:#12241fed;border:1px solid #8faa9a;color:#d9eade;z-index:999;font:12px Segoe UI;line-height:1.8';document.body.append(panel);
 const status=text=>panel.innerHTML=`<b>实际渲染验收</b><p>${text}</p>`;
 const check=(name,ok,details)=>{report.checks.push({name,pass:!!ok,details});if(!ok)report.errors.push(name);};
 const settle=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const capture=async name=>{app.draw();await settle();const blob=await app.capturePNG();files.push({name:name+'.png',blob});report.captures.push({name,bytes:blob.size,...app.audit()});};
 const control=(key,value)=>{const input=document.querySelector(`input[data-key="${key}"]`);if(!input)throw new Error('Missing control '+key);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));};
 const fingerprint=async()=>{app.draw();await settle();const blob=await app.capturePNG();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(n=>n.toString(16).padStart(2,'0')).join('');};
 status('检查汽车场景、端点保真与真实采样…');
 const saved=app.projectData();app.state.bloom=0;app.state.guides=false;app.setTime(10);
 check('汽车真实 PBR 资产',app.engine.records.length>90,app.audit());
 check('重建完成恢复原材质对象',app.audit().materialRestored,app.audit());await capture('car_final');
 const timeInput=document.getElementById('current-time');timeInput.value='6.25';timeInput.dispatchEvent(new Event('input',{bubbles:true}));check('精确时间输入立即响应',Math.abs(app.state.time-6.25)<1e-6);app.setTime(10);
 const nodes=['BodyUnderside','BodyWindshield'].map(name=>app.engine.root.getObjectByName(name));const transforms=nodes.map(o=>o.matrixWorld.toArray());for(const name of ['BodyUnderside','BodyWindshield'])document.querySelector(`input[aria-label="选择 ${name}"]`).click();document.getElementById('group-selected').click();check('对象分组保留世界变换',nodes.every((o,i)=>o.matrixWorld.toArray().every((value,j)=>Math.abs(value-transforms[i][j])<1e-6)));await app.openProject(saved);app.state.guides=false;
 app.setTime(0);check('起点为空且碎片无可见体积',app.engine.uniforms.uProgress.value===0,app.audit());await capture('car_void');
 app.setTime(4.2);await capture('car_memory');
 status('用真实帧差验证灯光、反射、摄影与景深控件…');app.setTime(10);document.querySelector('[data-panel="lighting"]').click();let reference=await fingerprint();control('keyAzimuth',35);check('主光方向改变真实渲染帧',reference!==await fingerprint());reference=await fingerprint();control('envIntensity',.25);check('环境反射强度改变真实渲染帧',reference!==await fingerprint());reference=await fingerprint();control('exposure',.65);check('曝光改变真实渲染帧',reference!==await fingerprint());
 document.querySelector('[data-panel="camera"]').click();reference=await fingerprint();control('fov',28);check('镜头视角改变真实渲染帧',reference!==await fingerprint());reference=await fingerprint();control('aperture',7);check('景深强度改变真实渲染帧',reference!==await fingerprint());await app.openProject(saved);app.setTime(4.2);
 const sampleA=app.engine.samples.slice(0,20).map(s=>s.pos.toArray());app.engine.rebuildFragments();check('随机种子可复现',JSON.stringify(sampleA)===JSON.stringify(app.engine.samples.slice(0,20).map(s=>s.pos.toArray())),{seed:app.state.seed});
 app.state.seed=84;app.runtime.seed=84;app.engine.rebuildFragments();check('改变种子改变采样',JSON.stringify(sampleA)!==JSON.stringify(app.engine.samples.slice(0,20).map(s=>s.pos.toArray())));app.state.seed=42;app.runtime.seed=42;app.engine.rebuildFragments();
 document.querySelector('[data-panel="fragments"]').click();control('thickness',.5);app.draw();check('厚度控件改变 GPU 参数',app.engine.uniforms.uThickness.value===.5);
 control('drift',2.1);app.draw();check('漂移控件改变 GPU 参数',Math.abs(app.engine.uniforms.uDrift.value-2.1)<1e-5);
 control('density',3200);await new Promise(r=>setTimeout(r,180));check('密度控件重新创建实体碎片',app.engine.samples.length===3200);
 for(const mode of ['radial','sphere','direction']){app.state.mode=mode;app.setTime(5);check('空间传播模式 '+mode,app.engine.uniforms.uMode.value===({radial:0,sphere:1,direction:2}[mode]));}
 app.state.paramKeys.exposure=[{time:0,value:.5},{time:10,value:1.5}];app.setTime(5);check('参数关键帧真实插值',Math.abs(app.runtime.exposure-1)<1e-6);delete app.state.paramKeys.exposure;
 document.querySelector('[data-panel="presets"]').click();control('speed',.5);check('速度真实重定时',app.state.duration===20&&app.state.time===10);app.setTime(20);check('低速结束无强制补全跳变',app.audit().materialRestored&&app.engine.uniforms.uFront.value>app.engine.range);await app.openProject(saved);app.state.range=.4;app.setTime(10);check('有限范围末帧保留局部范围',app.engine.uniforms.uScopeR.value>0&&!app.audit().materialRestored);await app.openProject(saved);app.setTime(5);
 for(const preset of presets){status('检验预设：'+preset.name);app.applyPreset(preset.id);app.setTime(5);await settle();check('预设 '+preset.name,app.audit().preset===preset.id,{material:app.state.shardMaterial,mode:app.state.mode,background:app.state.background});await capture('preset_'+preset.id);}
 app.applyPreset('assembly');app.state.drift=.8;app.setTime(6.5);await capture('car_assembly');
 app.applyPreset('glass');app.state.density=3500;app.runtime.density=3500;app.engine.rebuildFragments();app.setTime(5);await capture('car_glass');
 document.querySelector('[data-panel="fragments"]').click();control('ior',1.1);await settle();reference=await fingerprint();control('ior',1.8);await settle();check('玻璃折射率改变真实渲染帧',reference!==await fingerprint());
 status('检查对象排除、完整工程保存与恢复…');
 const body=app.engine.records.find(r=>!r.o.userData.noFragments);body.o.userData.exclude=true;app.setTime(0);check('排除对象保持原始材质',body.o.material===body.original);body.o.userData.exclude=false;
 const project=app.projectData();const before={meshes:app.engine.records.length,bounds:app.audit().bounds,keys:JSON.stringify(app.state.cameraKeys)};await app.openProject(project);check('完整工程往返保留几何层级',app.engine.records.length===before.meshes,{before,after:app.audit()});app.setTime(10);check('工程恢复后原材质仍可还原',app.audit().materialRestored);
 // Second imported format exercises relative resource resolution and multi-material hierarchy.
 status('检查带独立 BIN 的 GLTF 导入…');
 const positions=new Float32Array([-1,0,0,1,0,0,0,2,0]),bufferFile=new File([positions],'triangle.bin');const gltf={asset:{version:'2.0'},buffers:[{uri:'triangle.bin',byteLength:36}],bufferViews:[{buffer:0,byteOffset:0,byteLength:36}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-1,0,0],max:[1,2,0]}],materials:[{pbrMetallicRoughness:{baseColorFactor:[.2,.5,.8,1],metallicFactor:.7,roughnessFactor:.25},doubleSided:true}],meshes:[{primitives:[{attributes:{POSITION:0},material:0}]}],nodes:[{mesh:0,name:'测试三角形'}],scenes:[{nodes:[0]}],scene:0};await app.importFiles([new File([JSON.stringify(gltf)],'test.gltf'),bufferFile]);check('GLTF 关联 BIN 导入',app.engine.records.length===1&&app.state.scene==='import',app.audit());app.setTime(10);check('导入材质保真',app.audit().materialRestored);
 status('检查建筑街区与重复换场景…');await app.switchScene('district');app.applyPreset('memory');app.state.bloom=.05;app.state.guides=false;app.setTime(4.8);await capture('district_memory');app.setTime(10);await capture('district_final');check('第二场景复用同一引擎',app.engine.records.length>30&&app.audit().materialRestored,app.audit());
 const instanceRoot=new T.Group();instanceRoot.name='实例场景';const instances=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:'#548caa'}),2);instances.setMatrixAt(0,new T.Matrix4().makeTranslation(-3,.5,0));instances.setMatrixAt(1,new T.Matrix4().makeTranslation(3,.5,0));instanceRoot.add(instances);const instanceProject={...app.projectData(),scene:instanceRoot.toJSON(),animations:[],asset:'import',label:'实例网格验收',scale:10,target:[0,1,0],home:[10,5,10],camera:{position:[10,5,10],target:[0,1,0],fov:38}};await app.openProject(instanceProject);app.setTime(5);const xs=app.engine.samples.map(s=>s.pos.x);check('实例网格按各实例真实表面采样',Math.min(...xs)<-2.5&&Math.max(...xs)>2.5,{min:Math.min(...xs),max:Math.max(...xs)});app.setTime(10);check('实例网格完成端点保真',app.audit().materialRestored);
 await app.switchScene('district');app.applyPreset('memory');
 const resourcesBefore=app.renderer.info.memory.geometries;app.engine.rebuildFragments();app.draw();check('重新采样没有叠加旧碎片',app.engine.fragments.length===5,{geometriesBefore:resourcesBefore,after:app.renderer.info.memory.geometries});
 await app.switchScene('courtyard');app.applyPreset('memory');app.state.width=2;app.state.size=.09;app.state.drift=1.4;app.state.guides=false;app.setTime(5);await capture('courtyard_memory');app.setTime(10);await capture('courtyard_final');check('古典庭院同一传播场',app.engine.records.length>8&&app.audit().materialRestored,app.audit());
 await app.openProject(saved);app.setTime(5.8);
 check('所有材质与阴影 Shader 编译无错误',app.audit().shaderErrors===0);check('真实 HDRI 已加载',app.audit().hdrLoaded);
 report.summary={passed:report.checks.filter(c=>c.pass).length,total:report.checks.length,failures:report.errors};files.push({name:'qa-report.json',blob:new Blob([JSON.stringify(report,null,2)],{type:'application/json'})});
 panel.innerHTML=`<b>验收完成：${report.summary.passed}/${report.summary.total}</b><p id="qa-status">${report.errors.length?'失败：'+report.errors.join('、'):'全部检查通过'}</p><p>汽车、街区、8 套预设、工程往返与关联 GLTF 已实际运行。</p><button id="qa-download" style="background:#c3ddca;color:#153220">保存渲染帧与报告</button><button id="qa-hide">收起</button><pre style="font-size:9px;white-space:pre-wrap">${JSON.stringify(report.summary,null,2)}</pre>`;
 document.getElementById('qa-download').onclick=async()=>download(await zip(files),'Animus_QA_Evidence.zip');document.getElementById('qa-hide').onclick=()=>panel.remove();
 // DOM-readable assertions; inspection does not require accessing private JS state.
 const out=document.createElement('script');out.id='qa-report';out.type='application/json';out.textContent=JSON.stringify(report);document.body.append(out);
}
