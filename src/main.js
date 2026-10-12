// P0 starter: only scene inspection + GLB import + origin picking.
// See docs/ROADMAP.md; P1 reconstruction animation is not implemented yet.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const stage = document.getElementById('stage');
const fileInput = document.getElementById('model-file');
const status = document.getElementById('scene-status');
const originLabel = document.getElementById('origin-label');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#dae2e9');
const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 5000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
scene.add(new THREE.HemisphereLight(0xf5f8ff, 0x85929f, 2.0));
const key = new THREE.DirectionalLight(0xffffff, 3.1);
key.position.set(8, 15, 10);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -50;
key.shadow.camera.right = key.shadow.camera.top = 50;
scene.add(key);

const grid = new THREE.GridHelper(40, 40, 0x8595a4, 0xb3c1cc);
scene.add(grid);
const marker = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshBasicMaterial({ color: 0x0d9de0, depthTest: false }));
marker.renderOrder = 100;
scene.add(marker);
const origin = new THREE.Vector3();
let target = null;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const loader = new GLTFLoader();

function disposeGroup(group) {
  if (!group) return;
  const geometries = new Set();
  const materials = new Set();
  group.traverse((node) => {
    if (!node.isMesh) return;
    if (node.geometry) geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) if (material) materials.add(material);
  });
  for (const g of geometries) g.dispose();
  for (const m of materials) {
    // Resources from replaced imports are owned by this viewer, not by the future reusable engine.
    for (const value of Object.values(m)) if (value?.isTexture) value.dispose();
    m.dispose();
  }
}

function fitCamera(root) {
  root.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.length() * 0.65, 1);
  const distance = radius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.copy(center).add(new THREE.Vector3(distance * 0.75, distance * 0.5, distance));
  controls.target.copy(center);
  camera.near = Math.max(distance / 1000, 0.01);
  camera.far = Math.max(distance * 30, 100);
  camera.updateProjectionMatrix();
  controls.update();
  const desiredOrigin = new THREE.Vector3(center.x, box.min.y, center.z);
  setOrigin(desiredOrigin);
  grid.position.y = box.min.y - 0.01;
  grid.scale.setScalar(Math.max(0.1, size.length() / 25));
}
function setOrigin(point) {
  origin.copy(point);
  marker.position.copy(origin);
  marker.scale.setScalar(Math.max(.4, new THREE.Box3().setFromObject(target).getSize(new THREE.Vector3()).length() / 25));
  originLabel.textContent = `X ${origin.x.toFixed(2)} / Y ${origin.y.toFixed(2)} / Z ${origin.z.toFixed(2)}`;
}
function replaceTarget(root, label) {
  if (target) { scene.remove(target); disposeGroup(target); }
  target = root;
  scene.add(root);
  fitCamera(root);
  status.textContent = label;
}
function sampleScene() {
  const group = new THREE.Group();
  const matte = new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: .83 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x6c7e8e, roughness: .93 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x263c50, metalness: .7, roughness: .31 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xe0a35e, metalness: .8, roughness: .26 });
  const add = (geometry, material, x, y, z) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };
  add(new THREE.BoxGeometry(14, .3, 14), matte, 0, -.15, 0);
  for (const [x,z,height] of [[-4,-3,4],[-1,-3,6],[3,-3,3],[-4,2,5],[0,2,2.4],[4,3,5.5]]) {
    add(new THREE.BoxGeometry(1.8, height, 1.8), stone, x, height / 2, z);
    add(new THREE.BoxGeometry(2.1, .15, 2.1), copper, x, height + .075, z);
  }
  add(new THREE.BoxGeometry(3.6, .35, 2.3), metal, 0, .65, -0.2);
  for (const [x,z] of [[-1.5,-1.1],[1.5,-1.1],[-1.5,.7],[1.5,.7]]) add(new THREE.BoxGeometry(.16, .7, .16), metal, x, .35, z-.2);
  add(new THREE.TorusGeometry(1.0, .13, 12, 64), copper, 0, 2.3, 0).rotation.x = Math.PI/2;
  return group;
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  status.textContent = `正在读取 ${file.name}…`;
  const url = URL.createObjectURL(file);
  try {
    const gltf = await loader.loadAsync(url);
    // Imported animations are preserved in gltf; P4 will add timeline control.
    replaceTarget(gltf.scene, `已导入 ${file.name}`);
  } catch (error) {
    status.textContent = `导入失败：${error.message ?? error}`;
  } finally {
    URL.revokeObjectURL(url);
    fileInput.value = '';
  }
});
document.getElementById('demo-btn').addEventListener('click', () => replaceTarget(sampleScene(), '内置测试场景已恢复'));

function pickOrigin(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObject(target, true);
  if (intersections.length) setOrigin(intersections[0].point);
}
renderer.domElement.addEventListener('pointerdown', (event) => { if (event.shiftKey && event.button === 0 && target) pickOrigin(event.clientX, event.clientY); });

for (const name of ['dragenter','dragover']) stage.addEventListener(name, (e) => { e.preventDefault(); });
stage.addEventListener('drop', async (e) => {
  e.preventDefault();
  const file = [...e.dataTransfer.files].find((f) => f.name.toLowerCase().endsWith('.glb'));
  if (!file) { status.textContent = '当前基座只支持拖入单个 GLB；关联资源 GLTF 后续支持。'; return; }
  // Use the dropped file directly; do not mutate the file input's FileList.
  const url = URL.createObjectURL(file);
  try { const gltf = await loader.loadAsync(url); replaceTarget(gltf.scene, `已导入 ${file.name}`); }
  catch (err) { status.textContent = `导入失败：${err.message ?? err}`; }
  finally { URL.revokeObjectURL(url); fileInput.value = ''; }
});

function resize() {
  const width = stage.clientWidth, height = stage.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
replaceTarget(sampleScene(), '内置测试场景已加载');
resize();
function frame() { controls.update(); renderer.render(scene, camera); requestAnimationFrame(frame); }
frame();
