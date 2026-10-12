# 引擎结构与实现建议

设计为**独立渲染效果引擎 + 场景工作台**，不要让重建逻辑依赖右侧 UI。优先使用 Three.js / Vite / 原生 JS 或 TS；保持组件可集成进已有 Three.js Scene。

## 公共接口（目标形态）

```ts
const fx = new ReconstructionEngine({ renderer, scene, camera });
fx.attach(targetRoot);                    // THREE.Object3D，任意复杂层级
fx.setOrigin(new THREE.Vector3(x, y, z));
fx.setOptions({ preset: 'animus', wave: { mode: 'horizontal', heightDelay: 0.2 } });
fx.setProgress(0.45);                    // 0..1，确定性可往返
fx.exclude(object3D);                   // 如保留人物
fx.dispose();                           // 恢复原对象/资源并释放自身资源
```

## 统一时钟

- 效果进度 `p ∈ [0,1]` 是唯一源头。所有 pass 使用同一 `progress` 与固定随机种子，不依赖累计 frame delta；才能任意定位、倒放、准确导出。
- `position -> distanceMetric -> arrivalTime -> localPhase`：按顶点/表面在世界空间中到重建源的距离计算经过时刻。
- 水平径向 `length(worldPos.xz-origin.xz)`；球形 `length(worldPos-origin)`；竖向和自定义路径为后续扩展。距离需按目标场景包围范围归一化；提供可调传播速度、波前宽度、噪声/延迟、按高度二次生长。
- 确定性材质状态：未触达=不可见；构建带=虚线/点云/白模/碎片；已触达=真实材质。整场景中不应出现物体因 pivot 在远处而突然整件显现的问题。

## 层级模块建议

1. **SceneAdapter**：遍历 `Object3D`，记录矩阵、层级、Mesh、原始材质（含材质数组）、动画、可见性、包围盒；可排除对象、自动构图；保存/恢复状态。
2. **WavefrontField**：统一世界空间波前和局部重建相位；CPU 用于 UI/范围，GPU 用于每像素/顶点的局部显现；避免对大型场景逐三角 CPU 拆分。
3. **MaterialTransition**：尽量通过标准 PBR 材质 Shader patch 或并行渲染 pass 做波前剔除与白模→原材质；纹理、法线、透明和物理属性在 `p=1` 应恢复。为定制 Shader 保留可显式选择的兼容降级路径。
4. **FragmentField**：`MeshSurfaceSampler` 采样表面，缓存局部位置和法线；少量形状原型使用 `InstancedMesh` / GPU 顶点动画；只在窄波前中出现，带随机（但可重放）相位、翻转、吸附与淡出。支持每区域密度上限和视距 LOD。
5. **WireframePass / GhostPass**：精细几何线框、浅灰白模、半透明扫描边界；避免直接对每个三角形做密集杂乱线框。
6. **PresetController**：四种风格组合相同的通道和参数 schema；可序列化 JSON。
7. **Timeline & Camera**：独立进度/关键帧轨道；相机运镜与构建使用统一时钟。
8. **Export**：相同的 `renderAt(time)` 用于实时预览、固定步长帧输出、浏览器录屏；分别暴露分辨率/FPS 设置。

## 工程与性能要点

- 计算波前必须基于**模型实际世界坐标**，不能只基于对象中心或二维屏幕坐标；正确处理嵌套 transform、大小不同的场景、非均匀缩放。
- patch 标准材质时，检查 skinning / morph / instance 变换后的顶点位置；不要在 shader 中简单拿未变换的局部 position 当 worldPos。
- 原始材质不可被永久覆盖；备份 / 还原 WebGL 资源生命周期，防止换场景时纹理丢失。
- 碎片主要表现窄带构建，模型终态由原模型自己渲染；避免将整座城市细分成真实 voxel mesh。碎片预算、距离剔除、LOD、缓存都需可调。
- 单独控制地面优先、建筑高度延迟、物体顺序权重（可按命名/层级覆盖），制造“地面铺展→建筑逐段长出”的叙事节奏。
- 对透明玻璃/叠层材质、阴影、双面对象、环境贴图与特种 Shader 做兼容策略；阶段性记录不支持项目，不阻碍基本场景闭环。
- 最终输出要保留成品场景的色彩空间、Tone Mapping、阴影。需要特效时可以接入 `EffectComposer`，不能默认把全场景压成无光塑料。

## 组件开发顺序

`SceneAdapter + WavefrontField + MaterialTransition` → `FragmentField + Ghost/Wireframe` → `PresetController + Controls + Timeline/Camera` → `Export + Embeddable API`。

**反例**：对整场景加单一 opacity 淡入、用一张全屏扫光贴图伪装、仅能在默认演示球体上运行、每次拖动进度都重新导入 GLB，均不满足目标。
