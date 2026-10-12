# 技术参考

优先使用官方文档与可验证的基础实现。以下链接用于开发参考，不代表它们已实现本项目完整 Animus 效果。

- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)：完整 GLB/GLTF 导入、标准 PBR 和压缩扩展。
- [Three.js MeshSurfaceSampler](https://threejs.org/docs/pages/MeshSurfaceSampler.html)：根据表面积采样模型表面，为数字碎片获取目标位置/法线。
- [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)：大量方片 / 三角片实例化渲染。
- [Three.js SkinnedMesh](https://threejs.org/docs/pages/SkinnedMesh.html)：骨骼动画模型在 Shader 中的空间坐标处理参考。
- [Three.js Animation System](https://threejs.org/manual/pages/animation-system.html)：导入模型自带动画和时间控制。
- [Three.js EffectComposer](https://threejs.org/docs/pages/EffectComposer.html)：分层后处理与同步扫光视觉。
- [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)：复杂 Mesh 的加速射线与空间查询，按需引入。

搜索用语：**Animus memory corridor / world reconstruction / radial wavefront reveal / procedural assembly / materialization / mesh surface instancing / wireframe to PBR / fragment reassembly / digital environment loading**。

视觉参考：参考 Animus 场景从白色虚空向历史建筑逐步重建的节奏；不直接包含或复制游戏美术资产。
