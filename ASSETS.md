# 资产与研究来源

汽车：**Car Concept**，Eric Chadwick / Darmstadt Graphics Group GmbH，2024。CC BY 4.0。原始模型与贴图保留；本工具增加归中心的展示根节点、重建与灯光。保留原模型自带的 Khronos / 3D Commerce 标识，相关商标不包含在模型版权授权中。

- 来源：https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept
- 读取版本：`edc7c9e67c639d230715049ee31f9a96a6babbbe`
- 许可证：https://creativecommons.org/licenses/by/4.0/
- 随包原文：`public/licenses/CarConcept-LICENSE.md`

反射环境：**Studio Small 08**，Sergej Majboroda / Poly Haven，CC0，使用 1K HDR 版本。

- 来源：https://polyhaven.com/a/studio_small_08
- 许可证：https://polyhaven.com/license

现代街区、古典柱廊庭院、石板、楼层板、立面鳍片、石柱凹槽与齿饰：本项目以参数几何生成；不使用游戏截图的几何或纹理。

代码依赖 Three.js（MIT）、Vite（MIT），压缩解码器使用 Three.js 随包 Draco / Basis / Meshopt。源工程 `package-lock.json` 固定安装版本。

研究取舍：

- 用户提供的 Animus 图片：提炼白色虚空、脚下传播、白模先行与材质追随。截图仅用于观察，未作为产品贴图或宣传素材使用。
- [ManvsMachine / Air Max](https://mvsm.rbln7.com/project/air-max)：借鉴其负空间、材料隐喻、主体优先的思路；未复制影片素材。
- [Three.js MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)：清漆、透射、厚度、折射与虹彩。
- [Three.js 实例化示例](https://threejs.org/examples/webgl_instancing_dynamic.html)：将高数量碎片批处理并放到 GPU 运算。
- Sponza 调研版本附带 CRYENGINE Limited License，未打包进入商业创作工具。改为本项目原创古典柱廊模型。

初始仓库基线：`kzz-x/animus-reconstruction`，`main @ 3b4f3479725750b9c2d4f8f21f517e758694768e`。原始克隆保存在工作目录作为恢复点。
