import * as THREE from 'three';

const UI = {
  money: document.getElementById('money'),
  level: document.getElementById('level'),
  rep: document.getElementById('rep'),
  speed: document.getElementById('speed'),
  missionName: document.getElementById('missionName'),
  missionText: document.getElementById('missionText'),
  missionReward: document.getElementById('missionReward'),
  missionState: document.getElementById('missionState'),
  missionProgressBar: document.getElementById('missionProgressBar'),
  garagePanel: document.getElementById('garagePanel'),
  helpPanel: document.getElementById('helpPanel'),
  cheatPanel: document.getElementById('cheatPanel'),
  toast: document.getElementById('toast'),
  loading: document.getElementById('loading')
};

const state = {
  money: 300,
  level: 1,
  rep: 0,
  moneyBoost: 1,
  speedBonus: 1,
  tractionBonus: 1,
  color: 0xd0ff4d,
  speed: 0,
  yaw: 0,
  boostUntil: 0,
  jumpUntil: 0,
  missionIndex: 0,
  completed: 0,
  missionProgress: 0,
  garageOpen: false,
  lastTime: performance.now(),
  toastTimer: null,
  missionTimer: 0
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9cc7dd);
scene.fog = new THREE.Fog(0x9cc7dd, 180, 640);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.1, 1200);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.querySelector('#game').prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xeaf8ff, 0x435644, 2.2));
const sun = new THREE.DirectionalLight(0xfff3ca, 3.2);
sun.position.set(-80, 150, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -220; sun.shadow.camera.right = 220; sun.shadow.camera.top = 220; sun.shadow.camera.bottom = -220;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshStandardMaterial({ color: 0x5e6d58, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.12;
ground.receiveShadow = true;
scene.add(ground);

const roadMat = new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.95 });
const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x9d9c93, roughness: 1 });
const laneMat = new THREE.MeshStandardMaterial({ color: 0xe7dc86, emissive: 0x524d1c });
const buildingColors = [0xd7ccb2, 0x8fa7b2, 0xc9d0cf, 0xac9d88, 0x9aa3a7, 0xd5d5d3];
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cityColliders = [];
const travelLimit = 420;

function seeded(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const BLOCK = 80;
for (let i = -4; i <= 4; i++) {
  const hor = new THREE.Mesh(new THREE.PlaneGeometry(780, 22), roadMat);
  hor.rotation.x = -Math.PI / 2;
  hor.position.set(0, -0.08, i * BLOCK);
  hor.receiveShadow = true;
  scene.add(hor);

  const ver = new THREE.Mesh(new THREE.PlaneGeometry(22, 780), roadMat);
  ver.rotation.x = -Math.PI / 2;
  ver.position.set(i * BLOCK, -0.08, 0);
  ver.receiveShadow = true;
  scene.add(ver);

  for (let d = -360; d < 360; d += 18) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(5, 0.07, 0.26), laneMat);
    dash.position.set(d + 3, 0.04, i * BLOCK); scene.add(dash);
    const dash2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 5), laneMat);
    dash2.position.set(i * BLOCK, 0.04, d + 3); scene.add(dash2);
  }
}

let buildingId = 0;
for (let gx = -5; gx < 5; gx++) {
  for (let gz = -5; gz < 5; gz++) {
    const cx = gx * BLOCK + BLOCK / 2;
    const cz = gz * BLOCK + BLOCK / 2;
    const lot = new THREE.Mesh(new THREE.BoxGeometry(58, 0.12, 58), sidewalkMat);
    lot.position.set(cx, -0.01, cz);
    lot.receiveShadow = true;
    scene.add(lot);

    const count = 2 + Math.floor(seeded(++buildingId) * 3);
    for (let b = 0; b < count; b++) {
      const r = seeded(buildingId * 9 + b + 77);
      const w = 9 + r * 11;
      const depth = 9 + seeded(buildingId * 7 + b + 31) * 13;
      const h = 9 + seeded(buildingId * 4 + b + 11) * (r > 0.72 ? 40 : 20);
      const ox = (seeded(buildingId * 3 + b + 150) - 0.5) * 34;
      const oz = (seeded(buildingId * 6 + b + 211) - 0.5) * 34;

      const material = new THREE.MeshStandardMaterial({
        color: buildingColors[Math.floor(r * buildingColors.length)],
        roughness: 0.86
      });
      const building = new THREE.Mesh(boxGeo, material);
      building.scale.set(w, h, depth);
      building.position.set(cx + ox, h / 2, cz + oz);
      building.castShadow = true;
      building.receiveShadow = true;
      scene.add(building);

      cityColliders.push({ x: building.position.x, z: building.position.z, rx: w / 2 + 2.2, rz: depth / 2 + 2.2 });
    }
  }
}

const bike = new THREE.Group();
const rider = new THREE.Group();
bike.add(rider);
scene.add(bike);

const rubber = new THREE.MeshStandardMaterial({ color: 0x15191d, roughness: 0.85 });
const metal = new THREE.MeshStandardMaterial({ color: 0xc9d7dc, metalness: 0.7, roughness: 0.28 });
const frameMat = new THREE.MeshStandardMaterial({ color: 0xd0ff4d, metalness: 0.25, roughness: 0.38 });
const dark = new THREE.MeshStandardMaterial({ color: 0x212a31, roughness: 0.65 });
const jacketMat = new THREE.MeshStandardMaterial({ color: 0xe24f34, roughness: 0.82 });
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a3d57, roughness: 0.84 });
const helmetMat = new THREE.MeshStandardMaterial({ color: 0xf3f1e9, roughness: 0.3, metalness: 0.14 });
const skinMat = new THREE.MeshStandardMaterial({ color: 0xc78c68, roughness: 0.82 });

function cylinderBetween(parent, a, b, radius, material, segments = 8) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.75, radius, direction.length(), segments), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function part(parent, geometry, material, position, scale = null) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

for (const z of [-0.78, 0.82]) {
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.11, 12, 20), rubber);
  wheel.rotation.y = Math.PI / 2;
  wheel.position.set(0, 0.51, z);
  wheel.castShadow = true;
  bike.add(wheel);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 12), metal);
  hub.rotation.z = Math.PI / 2;
  hub.position.set(0, 0.51, z);
  bike.add(hub);
}

cylinderBetween(bike, [0, .52, -.78], [0, 1.1, -.18], 0.08, metal);
cylinderBetween(bike, [0, .52, .82], [0, 1.02, .18], 0.08, metal);
cylinderBetween(bike, [0, 1.04, -.18], [0, .92, .48], 0.09, frameMat);
cylinderBetween(bike, [0, .88, .48], [0, .54, .82], 0.07, metal);
part(bike, new THREE.BoxGeometry(0.46, 0.28, 0.7), frameMat, [0, 1.06, 0.12]);
part(bike, new THREE.BoxGeometry(0.44, 0.12, 0.44), dark, [0, 1.2, 0.74]);
part(bike, new THREE.BoxGeometry(0.12, 0.06, 0.26), new THREE.MeshStandardMaterial({ color: 0xff5d36, emissive: 0x8c1d0d }), [0, 1.02, 1.0]);
part(bike, new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffedac, emissive: 0x866326 }), [0, 1.15, -0.34], [1, 1, 0.68]);

part(rider, new THREE.CapsuleGeometry(0.22, 0.5, 4, 8), jacketMat, [0, 1.72, 0.2], [1, 0.9, 0.82]);
part(rider, new THREE.CapsuleGeometry(0.17, 0.38, 4, 8), pantsMat, [0, 1.3, 0.43], [1, 0.9, 0.8]);
part(rider, new THREE.SphereGeometry(0.18, 12, 9), skinMat, [0, 2.02, 0.03]);
part(rider, new THREE.SphereGeometry(0.25, 14, 10), helmetMat, [0, 2.28, -0.04], [1, 1.05, 1.09]);
part(rider, new THREE.BoxGeometry(0.32, 0.1, 0.08), dark, [0, 2.25, -0.28]);

cylinderBetween(rider, [-0.18, 1.82, 0.12], [-0.36, 1.42, -0.2], 0.09, jacketMat);
cylinderBetween(rider, [0.18, 1.82, 0.12], [0.36, 1.42, -0.2], 0.09, jacketMat);
cylinderBetween(rider, [-0.12, 1.24, 0.42], [-0.27, 0.7, 0.62], 0.10, pantsMat);
cylinderBetween(rider, [0.12, 1.24, 0.42], [0.27, 0.7, 0.62], 0.10, pantsMat);
part(rider, new THREE.BoxGeometry(0.18, 0.12, 0.32), dark, [-0.27, 0.56, 0.62]);
part(rider, new THREE.BoxGeometry(0.18, 0.12, 0.32), dark, [0.27, 0.56, 0.62]);

const garage = new THREE.Group();
const garageBase = new THREE.Mesh(new THREE.BoxGeometry(18, 5, 18), new THREE.MeshStandardMaterial({ color: 0x737581, roughness: 0.8 }));
garageBase.position.set(180, 2.5, 25);
const garageRoof = new THREE.Mesh(new THREE.BoxGeometry(20, 1.2, 20), new THREE.MeshStandardMaterial({ color: 0x5c5a5e, roughness: 0.6 }));
garageRoof.position.set(180, 5.8, 25);
garage.add(garageBase); garage.add(garageRoof); scene.add(garage);

const carMaterials = [0xe04f35, 0x2b69a3, 0xe8e3d7, 0x3b404a, 0xe5b540].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15 }));
const traffic = [];
const policeCars = [];

function makeCar(x, z, direction, index, isPolice = false) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 4), isPolice ? new THREE.MeshStandardMaterial({ color: 0x233a79, roughness: 0.5 }) : carMaterials[index % carMaterials.length]);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.72, 1.8), new THREE.MeshStandardMaterial({ color: 0xb7ced7, roughness: 0.32, metalness: 0.18 }));
  cabin.position.set(0, 1.25, -0.12);
  group.add(cabin);

  for (const wx of [-1, 1]) {
    for (const wz of [-1.25, 1.25]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.2, 10), rubber);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.38, wz);
      group.add(wheel);
    }
  }

  group.position.set(x, 0, z);
  group.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  scene.add(group);

  if (isPolice) policeCars.push({ group, x, z, direction, speed: 12 + seeded(index + 1000) * 7 });
  else traffic.push({ group, x, z, direction, speed: 5 + seeded(index + 50) * 6 });
}

for (let i = 0; i < 26; i++) {
  makeCar(-380 + seeded(i + 44) * 760, Math.round((-4 + seeded(i + 7) * 8)) * BLOCK + (seeded(i + 13) > 0.5 ? 8 : -8), i % 2 ? 1 : -1, i);
}
for (let i = 0; i < 4; i++) {
  makeCar(-150 + i * 110, 260 + i * 12, -1, 20 + i, true);
}

const missions = [
  {
    name: 'Sortie du garage',
    text: 'Démarre et rejoins le point de départ en ville.',
    reward: 150,
    type: 'reach',
    target: { x: 130, z: 5 },
    radius: 18,
    state: 'active'
  },
  {
    name: 'Livraison rapide',
    text: 'Rends-toi au quartier commercial et livre la caisse.',
    reward: 220,
    type: 'reach',
    target: { x: -190, z: -200 },
    radius: 18,
    state: 'locked'
  },
  {
    name: 'Course nocturne',
    text: 'Suit les checkpoints de la piste et termine sans sortir des limites.',
    reward: 350,
    type: 'race',
    checkpoints: [{ x: 180, z: -110 }, { x: 180, z: 110 }, { x: -180, z: 110 }, { x: -180, z: -180 }],
    radius: 18,
    state: 'locked'
  },
  {
    name: 'Évasion police',
    text: 'Échappe à la police pendant 20 secondes.',
    reward: 440,
    type: 'escape',
    target: { x: -300, z: 260 },
    radius: 32,
    duration: 20,
    state: 'locked'
  },
  {
    name: 'Défi du quartier',
    text: 'Gagne la course finale contre un autre motard.',
    reward: 620,
    type: 'boss',
    target: { x: 220, z: 220 },
    radius: 26,
    state: 'locked'
  }
];

const missionMarkers = [];
function placeMissionMarker(x, z, color = 0xd0ff4d) {
  const marker = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 6, 8), new THREE.MeshStandardMaterial({ color, emissive: 0x2a2d1b, emissiveIntensity: 0.6 }));
  beam.position.y = 3;
  const top = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7 }));
  top.position.y = 7.2;
  marker.add(beam, top);
  marker.position.set(x, 0, z);
  marker.visible = true;
  scene.add(marker);
  missionMarkers.push(marker);
}

missions.forEach((mission, index) => {
  if (mission.type === 'race') {
    mission.checkpoints.forEach((p) => placeMissionMarker(p.x, p.z, index === state.missionIndex ? 0x7ce7ff : 0x9dfd5a));
  } else {
    placeMissionMarker(mission.target.x, mission.target.z, index === state.missionIndex ? 0x7ce7ff : 0x9dfd5a);
  }
});

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function showToast(message) {
  UI.toast.textContent = message;
  UI.toast.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => UI.toast.classList.remove('show'), 2200);
}

function updateHud() {
  UI.money.textContent = `$${state.money}`;
  UI.level.textContent = String(state.level);
  UI.rep.textContent = String(state.rep);
  UI.speed.textContent = String(Math.round(Math.abs(state.speed) * 3.6));
}

function updateMissionPanel() {
  const mission = missions[state.missionIndex];
  if (!mission) return;
  UI.missionName.textContent = mission.name;
  UI.missionText.textContent = mission.text;
  UI.missionReward.textContent = `Récompense: $${mission.reward}`;
  UI.missionState.textContent = (mission.state === 'active') ? 'En cours' : 'Bloquée';

  let value = 0;
  if (mission.type === 'reach' || mission.type === 'boss' || mission.type === 'escape') {
    value = state.missionProgress;
  } else if (mission.type === 'race') {
    value = (mission.progress || 0) / Math.max(mission.checkpoints.length, 1) * 100;
  }
  UI.missionProgressBar.style.width = `${clamp(value, 0, 100)}%`;
}

function insideBuilding(x, z) {
  return cityColliders.some(c => Math.abs(x - c.x) < c.rx && Math.abs(z - c.z) < c.rz);
}

const input = { left: false, right: false, accelerate: false, brake: false, boost: false };
const keyMap = {
  ArrowUp: 'accelerate', KeyW: 'accelerate', KeyZ: 'accelerate',
  ArrowDown: 'brake', KeyS: 'brake', Space: 'brake',
  ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'boost', ShiftRight: 'boost'
};

addEventListener('keydown', (event) => {
  const action = keyMap[event.code];
  if (action) {
    input[action] = true;
    event.preventDefault();
  }
});

addEventListener('keyup', (event) => {
  const action = keyMap[event.code];
  if (action) input[action] = false;
});

for (const button of document.querySelectorAll('[data-control]')) {
  const action = button.dataset.control;
  const press = (event) => {
    event.preventDefault();
    input[action] = true;
    button.classList.add('pressed');
  };
  const release = (event) => {
    event.preventDefault();
    input[action] = false;
    button.classList.remove('pressed');
  };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
}

function applyUpgrade(type) {
  const prices = { turbo: 220, engine: 300, tires: 180, paint: 120 };
  const cost = prices[type];
  if (state.money < cost) {
    showToast('Pas assez d’argent.');
    return;
  }

  state.money -= cost;
  if (type === 'turbo') state.speedBonus += 0.18;
  if (type === 'engine') state.speedBonus += 0.28;
  if (type === 'tires') state.tractionBonus += 0.2;
  if (type === 'paint') {
    state.color = new THREE.Color(Math.random() * 0xffffff).getHex();
    frameMat.color.setHex(state.color);
  }
  updateHud();
  showToast('Amélioration installée !');
}

for (const button of document.querySelectorAll('.upgrade-btn')) {
  button.addEventListener('click', () => applyUpgrade(button.dataset.upgrade));
}

function getCodes() {
  try {
    return { ...{ TURBO: 'turbo', REPARER: 'repair', COULEUR: 'paint', SAUT: 'moon' }, ...JSON.parse(localStorage.getItem('motoRushCodes') || '{}') };
  } catch {
    return { TURBO: 'turbo', REPARER: 'repair', COULEUR: 'paint', SAUT: 'moon' };
  }
}

function triggerCodeEffect(effect) {
  if (effect === 'turbo') {
    state.boostUntil = performance.now() + 10000;
    showToast('Turbo activé !');
  }
  if (effect === 'repair') {
    showToast('Moto réparée.');
  }
  if (effect === 'paint') {
    state.color = new THREE.Color(Math.random() * 0xffffff).getHex();
    frameMat.color.setHex(state.color);
    showToast('Couleur changée.');
  }
  if (effect === 'moon') {
    state.jumpUntil = performance.now() + 8000;
    showToast('Saut renforcé !');
  }
}

document.getElementById('codeForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const code = document.getElementById('codeInput').value.trim().toUpperCase();
  const effect = document.getElementById('effectSelect').value;
  if (!code || code.length < 3) {
    showToast('Code trop court.');
    return;
  }
  const codes = getCodes();
  codes[code] = effect;
  localStorage.setItem('motoRushCodes', JSON.stringify(codes));
  document.getElementById('codeInput').value = '';
  showToast(`Code ${code} enregistré.`);
});

document.getElementById('activateForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const code = document.getElementById('activateInput').value.trim().toUpperCase();
  const action = getCodes()[code];
  if (!action) {
    showToast('Code inconnu.');
    return;
  }
  triggerCodeEffect(action);
  document.getElementById('activateInput').value = '';
});

for (const id of ['garageBtn', 'helpBtn', 'cheatBtn']) {
  const button = document.getElementById(id);
  const target = id === 'garageBtn' ? '#garagePanel' : id === 'helpBtn' ? '#helpPanel' : '#cheatPanel';
  button.addEventListener('click', () => document.querySelector(target).classList.toggle('hidden'));
}
for (const close of document.querySelectorAll('[data-close]')) {
  close.addEventListener('click', () => document.getElementById(close.dataset.close).classList.add('hidden'));
}

let lookPointer = null;
let lastPointerX = 0;
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch') {
    lookPointer = event.pointerId;
    lastPointerX = event.clientX;
  }
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (lookPointer === event.pointerId) {
    state.yaw -= (event.clientX - lastPointerX) * 0.004;
    lastPointerX = event.clientX;
  }
});
renderer.domElement.addEventListener('pointerup', (event) => {
  if (lookPointer === event.pointerId) lookPointer = null;
});

function completeMission() {
  const mission = missions[state.missionIndex];
  if (!mission) return;
  state.money += Math.round(mission.reward * state.moneyBoost);
  state.rep += 10 + state.missionIndex * 5;
  state.level = 1 + Math.floor(state.rep / 50);
  state.completed += 1;
  mission.state = 'completed';
  state.missionIndex = Math.min(state.missionIndex + 1, missions.length - 1);
  if (state.missionIndex < missions.length) {
    missions[state.missionIndex].state = 'active';
  }
  state.missionProgress = 0;
  updateHud();
  updateMissionPanel();
  showToast(`Mission terminée ! +$${Math.round(mission.reward * state.moneyBoost)}`);
}

function triggerMissionUpdate() {
  const mission = missions[state.missionIndex];
  if (!mission) return;

  if (mission.type === 'reach') {
    const dx = bike.position.x - mission.target.x;
    const dz = bike.position.z - mission.target.z;
    const dist = Math.hypot(dx, dz);
    state.missionProgress = 100 - Math.min(100, dist / mission.radius * 100);
    if (dist < mission.radius) completeMission();
  }

  if (mission.type === 'race') {
    const cp = mission.checkpoints[(mission.progressIndex || 0)] || mission.checkpoints[0];
    const dx = bike.position.x - cp.x;
    const dz = bike.position.z - cp.z;
    const dist = Math.hypot(dx, dz);
    if (dist < mission.radius) {
      mission.progressIndex = (mission.progressIndex || 0) + 1;
      mission.progress = mission.progressIndex / mission.checkpoints.length * 100;
      if (mission.progressIndex >= mission.checkpoints.length) completeMission();
    }
    state.missionProgress = mission.progress || 0;
  }

  if (mission.type === 'escape') {
    mission.timeLeft = (mission.timeLeft ?? mission.duration) - 1 / 60;
    state.missionProgress = Math.max(0, ((mission.duration - mission.timeLeft) / mission.duration) * 100);
    if (mission.timeLeft <= 0) completeMission();
  }

  if (mission.type === 'boss') {
    const dx = bike.position.x - mission.target.x;
    const dz = bike.position.z - mission.target.z;
    const dist = Math.hypot(dx, dz);
    state.missionProgress = 100 - Math.min(100, dist / mission.radius * 100);
    if (dist < mission.radius) completeMission();
  }

  updateMissionPanel();
}

const cameraTarget = new THREE.Vector3();
const chaseTarget = { x: 0, z: 0 };

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - state.lastTime) / 1000, 0.05);
  state.lastTime = now;

  const turbo = input.boost || now < state.boostUntil;
  const maxSpeed = (24 + state.speedBonus * 10) * (turbo ? 1.55 : 1);

  if (input.accelerate) state.speed = Math.min(maxSpeed, state.speed + (turbo ? 31 : 18) * dt * state.speedBonus);
  else state.speed = Math.max(0, state.speed - 5.5 * dt);

  if (input.brake) state.speed = Math.max(-8, state.speed - 24 * dt);

  const steer = Number(input.right) - Number(input.left);
  if (Math.abs(state.speed) > 0.4) {
    state.yaw += steer * dt * (0.58 + Math.min(Math.abs(state.speed) / 22, 0.82)) * (state.speed > 0 ? 1 : -1);
  }

  bike.rotation.y = state.yaw;
  bike.rotation.z = THREE.MathUtils.damp(bike.rotation.z, -steer * Math.min(Math.abs(state.speed) / 24, 0.42), 10, dt);

  const direction = new THREE.Vector3(Math.sin(state.yaw), 0, -Math.cos(state.yaw));
  const nextX = bike.position.x + direction.x * state.speed * dt;
  const nextZ = bike.position.z + direction.z * state.speed * dt;

  if (Math.abs(nextX) < travelLimit && Math.abs(nextZ) < travelLimit && !insideBuilding(nextX, nextZ)) {
    bike.position.x = nextX;
    bike.position.z = nextZ;
  } else {
    state.speed *= -0.18;
    showToast('Heurt ! La moto a touché un obstacle.');
  }

  if (state.jumpUntil > now) {
    bike.position.y = Math.abs(Math.sin(now * 0.01)) * 1.6;
    bike.rotation.x = Math.sin(now * 0.012) * 0.08;
  } else {
    bike.position.y = 0;
    bike.rotation.x = 0;
  }

  for (const car of traffic) {
    car.x += car.direction * car.speed * dt;
    if (car.x > 410) car.x = -410;
    if (car.x < -410) car.x = 410;
    car.group.position.x = car.x;
    const dist = Math.hypot(car.x - bike.position.x, car.z - bike.position.z);
    if (dist < 2.7) {
      state.speed *= 0.8;
    }
  }

  for (const car of policeCars) {
    const dist = Math.hypot(car.x - bike.position.x, car.z - bike.position.z);
    if (state.missionIndex >= 3 && dist < 140) {
      const dx = bike.position.x - car.x;
      const dz = bike.position.z - car.z;
      const ang = Math.atan2(dz, dx);
      car.group.rotation.y = -ang + Math.PI / 2;
      car.x += Math.cos(ang) * (car.speed * 0.9) * dt;
      car.z += Math.sin(ang) * (car.speed * 0.9) * dt;
      car.group.position.set(car.x, 0, car.z);
      if (dist < 8) state.speed *= 0.7;
    }
  }

  if (state.missionIndex > 0 || missions[0].state === 'completed') {
    const objective = missions[state.missionIndex];
    if (objective && objective.type === 'reach') {
      const dx = bike.position.x - objective.target.x;
      const dz = bike.position.z - objective.target.z;
      if (Math.hypot(dx, dz) < objective.radius + 30) {
        missionMarkers[state.missionIndex].scale.setScalar(1.2);
      }
    }
  }

  triggerMissionUpdate();

  const cameraDistance = 7.4;
  const cameraHeight = 4.4;
  cameraTarget.set(
    bike.position.x - direction.x * cameraDistance,
    bike.position.y + cameraHeight,
    bike.position.z - direction.z * cameraDistance
  );
  camera.position.lerp(cameraTarget, 1 - Math.exp(-6 * dt));

  const lookAt = new THREE.Vector3(bike.position.x + direction.x * 2, bike.position.y + 1.2, bike.position.z + direction.z * 2);
  camera.lookAt(lookAt);

  updateHud();
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
});

missions[0].state = 'active';
updateHud();
updateMissionPanel();
setTimeout(() => UI.loading.classList.add('done'), 500);
