export const defaults = {
  preset:'memory', scene:'car', duration:10, fps:30, time:4.2, mode:'radial', axis:0,
  originX:0,originY:0,originZ:0, width:1.8, speed:1, range:1, curve:'smooth', order:'ground',
  density:7000, size:.045, thickness:.15, drift:.65, spin:2.5, seed:42, shape:'mixed',
  shardMaterial:'ceramic', shardColor:'#afbec7', roughness:.3, metalness:.75, transmission:.75, ior:1.5,
  wire:.38, white:.7, points:.22, glitch:0, materialLag:.5,
  environment:'studio', envIntensity:.9, envRotation:0, background:'#e8edef',
  keyAzimuth:135,keyElevation:48,keyIntensity:2.8,keyTemp:5800,keySize:4,fill:.7,rim:2.5,
  exposure:.95,bloom:.06,focus:9, aperture:0,fov:38, fog:.008,
  cameraMotion:'locked', cameraKeys:[], paramKeys:{}, loop:true, reverse:false, grid:false, guides:true,
  quality:'high', aspect:'16:9', transparent:false
};
export const presets = [
 {id:'memory',name:'记忆重建',en:'ANIMUS MEMORY',color:'#c4e1ec',desc:'白色虚空 · 细碎陶瓷 · 径向扩展',values:{...defaults}},
 {id:'assembly',name:'电影拼装',en:'CINEMATIC ASSEMBLY',color:'#d6b389',desc:'深色影棚 · 金属薄片 · 缓入吸附',values:{background:'#101619',environment:'studio',shardMaterial:'metal',shardColor:'#b7c6cb',shape:'triangle',size:.07,drift:.95,spin:3.5,wire:.12,white:.4,points:0,materialLag:.32,keyIntensity:3.5,fill:.3,rim:4,exposure:.9,bloom:.08,fog:.002,curve:'smooth',mode:'direction',keyTemp:4600}},
 {id:'blueprint',name:'工业蓝图',en:'TECHNICAL BLUEPRINT',color:'#7ca7b6',desc:'工程线稿 · 点云定位 · 逐层成形',values:{background:'#16313b',shardMaterial:'ceramic',shardColor:'#b7d6dc',shape:'strip',wire:1,white:1,points:.75,size:.04,drift:.8,mode:'sphere',order:'ground',materialLag:1.3,keyIntensity:3,fill:1.8,rim:1,bloom:.12,fog:.006}},
 {id:'voxel',name:'多边形翻转',en:'VOXEL MOSAIC',color:'#ce987b',desc:'六角模块 · 大幅翻转 · 阶梯节奏',values:{background:'#e8e0d4',shardMaterial:'ceramic',shardColor:'#b7a593',shape:'hexagon',size:.19,thickness:.3,drift:1.5,spin:5,wire:.08,points:0,white:.55,curve:'steps',materialLag:.2,mode:'direction',keyTemp:4300,keyIntensity:4,fill:1,rim:2,bloom:0}},
 {id:'glass',name:'玻璃数据',en:'GLASS DATA',color:'#97bdc9',desc:'透射晶体 · 冷暖轮廓 · 球形聚合',values:{background:'#253b43',shardMaterial:'glass',shardColor:'#b6d3db',shape:'hexagon',size:.085,thickness:.38,drift:.9,spin:2,wire:.15,white:.6,points:.1,mode:'sphere',keyIntensity:3.5,fill:.5,rim:4,envIntensity:1.3,bloom:.08,keyTemp:4200,materialLag:.7,transmission:.98,roughness:.06}},
 {id:'signal',name:'信号重组',en:'SIGNAL GLITCH',color:'#a1a9d1',desc:'离散分区 · 短暂错位 · 快速稳定',values:{background:'#e3e5ee',shardMaterial:'iridescent',shardColor:'#aeb6d2',shape:'strip',size:.065,drift:2,spin:6,wire:.5,white:.5,points:.5,glitch:.7,curve:'linear',mode:'direction',materialLag:.25,bloom:.08,keyIntensity:3,fill:1.2,rim:3}},
 {id:'sync',name:'材质同步',en:'MATERIAL SYNC',color:'#b6c7af',desc:'白模结构先行 · 表面材质追随',values:{background:'#e7e9e3',shardMaterial:'original',shape:'square',size:.05,drift:.55,spin:1,wire:.5,white:1,points:.08,mode:'direction',materialLag:2.1,bloom:0,keyIntensity:3,fill:1.5,rim:2}},
 {id:'reverse',name:'逆向崩解',en:'REVERSE COLLAPSE',color:'#acb8bd',desc:'真实世界 · 有序解构 · 回归虚空',values:{background:'#dfe5e8',shardMaterial:'metal',shape:'mixed',size:.09,drift:3,spin:4,wire:.4,white:.6,points:.35,reverse:true,mode:'radial',materialLag:.6,keyIntensity:4,fill:1,rim:3}}
];
