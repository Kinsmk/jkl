import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc7e8);
scene.fog = new THREE.Fog(0x9bc7e8, 170, 590);
const camera = new THREE.PerspectiveCamera(67, innerWidth / innerHeight, 0.1, 900);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.querySelector('#game').prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd7edff, 0x59604a, 2.1));
const sun = new THREE.DirectionalLight(0xffedcc, 3.2);
sun.position.set(-90, 150, 70);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -180; sun.shadow.camera.right = 180; sun.shadow.camera.top = 180; sun.shadow.camera.bottom = -180;
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: 0x566456, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.13; ground.receiveShadow = true; scene.add(ground);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x30363c, roughness: .92 });
const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x9b9b91, roughness: 1 });
const lineMat = new THREE.MeshStandardMaterial({ color: 0xe7d978, emissive: 0x554b1b });
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cityColliders = [];
const seeded = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const BLOCK = 80, ROAD = 20;

for (let i = -5; i <= 5; i++) {
  const road = new THREE.Mesh(new THREE.PlaneGeometry(850, ROAD), roadMat);
  road.rotation.x = -Math.PI / 2; road.position.set(0, -.07, i * BLOCK); road.receiveShadow = true; scene.add(road);
  const cross = new THREE.Mesh(new THREE.PlaneGeometry(ROAD, 850), roadMat);
  cross.rotation.x = -Math.PI / 2; cross.position.set(i * BLOCK, -.065, 0); cross.receiveShadow = true; scene.add(cross);
  for (let d = -420; d < 420; d += 18) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(5, .025, .22), lineMat);
    dash.position.set(d + 2.5, .02, i * BLOCK); scene.add(dash);
    const dash2 = new THREE.Mesh(new THREE.BoxGeometry(.22, .025, 5), lineMat);
    dash2.position.set(i * BLOCK, .021, d + 2.5); scene.add(dash2);
  }
}
const buildingColors = [0xc6b7a3,0x899aa4,0xd1c9b9,0x858b86,0xb7a58d,0x9ba9ad,0xd4d0c4];
let buildingId = 0;
for (let gx = -5; gx < 5; gx++) for (let gz = -5; gz < 5; gz++) {
  const cx = gx * BLOCK + BLOCK / 2, cz = gz * BLOCK + BLOCK / 2;
  const lot = new THREE.Mesh(new THREE.BoxGeometry(58, .12, 58), sidewalkMat);
  lot.position.set(cx, -.015, cz); lot.receiveShadow = true; scene.add(lot);
  const count = 2 + Math.floor(seeded(++buildingId) * 3);
  for (let b = 0; b < count; b++) {
    const r = seeded(buildingId * 8 + b + 40);
    const w = 9 + r * 9, depth = 9 + seeded(buildingId * 5 + b + 90) * 12;
    const h = 9 + seeded(buildingId * 4 + b + 10) * (r > .72 ? 42 : 22);
    const ox = (seeded(buildingId * 3 + b + 150) - .5) * 34;
    const oz = (seeded(buildingId * 7 + b + 200) - .5) * 34;
    const material = new THREE.MeshStandardMaterial({ color: buildingColors[Math.floor(r * buildingColors.length)], roughness: .84 });
    const building = new THREE.Mesh(boxGeo, material);
    building.scale.set(w, h, depth); building.position.set(cx + ox, h / 2, cz + oz);
    building.castShadow = true; building.receiveShadow = true; scene.add(building);
    cityColliders.push({ x: building.position.x, z: building.position.z, rx: w / 2 + 1.8, rz: depth / 2 + 1.8 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0xa9d9e8, emissive: 0x233d47, roughness: .3 });
    for (let floor = 1; floor < Math.min(5, Math.floor(h / 4)); floor++) {
      const windows = new THREE.Mesh(new THREE.BoxGeometry(w * .72, .35, .08), windowMat);
      windows.position.set(building.position.x, floor * 3.2, building.position.z + depth / 2 + .045); scene.add(windows);
    }
  }
}

const poleMat = new THREE.MeshStandardMaterial({ color: 0x343b40, metalness: .5, roughness: .5 });
const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe6a3, emissive: 0x87632a });
for (let i = -4; i <= 4; i += 2) for (const side of [-1, 1]) {
  const x = i * BLOCK + side * 12, z = -12;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.12, .17, 7, 8), poleMat); pole.position.set(x, 3.5, z); pole.castShadow = true; scene.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, .12, .12), poleMat); arm.position.set(x + side, 6.8, z); scene.add(arm);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.28, 8, 6), lampMat); bulb.position.set(x + side * 2, 6.7, z); scene.add(bulb);
}

const bike = new THREE.Group(); scene.add(bike);
const rider = new THREE.Group(); bike.add(rider);
const rubber = new THREE.MeshStandardMaterial({ color: 0x171a1c, roughness: .82 });
const metal = new THREE.MeshStandardMaterial({ color: 0xaeb9bd, metalness: .72, roughness: .28 });
const frameMat = new THREE.MeshStandardMaterial({ color: 0xb8ff3b, metalness: .28, roughness: .38 });
const dark = new THREE.MeshStandardMaterial({ color: 0x20272c, roughness: .62 });
const jacketMat = new THREE.MeshStandardMaterial({ color: 0xe34e32, roughness: .78 });
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x263953, roughness: .85 });
const helmetMat = new THREE.MeshStandardMaterial({ color: 0xf3f0e7, metalness: .18, roughness: .3 });
const skinMat = new THREE.MeshStandardMaterial({ color: 0xc98e69, roughness: .8 });
function cylinderBetween(parent, a, b, radius, material, segments = 8) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * .78, radius, direction.length(), segments), material);
  mesh.position.copy(start).add(end).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true; parent.add(mesh); return mesh;
}
function part(parent, geometry, material, position, scale) {
  const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); if (scale) mesh.scale.set(...scale); mesh.castShadow = true; parent.add(mesh); return mesh;
}
for (const z of [-.78, .82]) {
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(.4, .105, 10, 20), rubber);
  wheel.rotation.y = Math.PI / 2; wheel.position.set(0, .48, z); wheel.castShadow = true; bike.add(wheel);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .22, 12), metal); hub.rotation.z = Math.PI / 2; hub.position.set(0, .48, z); bike.add(hub);
}
cylinderBetween(bike, [0,.5,-.78],[0,1.05,-.18],.075,metal);
cylinderBetween(bike, [0,.5,.82],[0,1.02,.16],.065,metal);
cylinderBetween(bike, [0,1.02,-.18],[0,.88,.48],.09,frameMat);
cylinderBetween(bike, [0,.88,.48],[0,.5,.82],.07,metal);
part(bike,new THREE.BoxGeometry(.46,.29,.68),frameMat,[0,1.04,.12]);
part(bike,new THREE.BoxGeometry(.42,.12,.43),dark,[0,1.2,.72]);
part(bike,new THREE.BoxGeometry(.34,.24,.25),metal,[0,.82,.83]);
part(bike,new THREE.BoxGeometry(.06,.08,.28),new THREE.MeshStandardMaterial({color:0xff422b,emissive:0x9c160b}),[0,1.02,1.0]);
cylinderBetween(bike,[-.5,1.34,-.25],[.5,1.34,-.25],.045,metal);
part(bike,new THREE.SphereGeometry(.12,12,8),new THREE.MeshStandardMaterial({color:0xfff1b1,emissive:0x806c28}),[0,1.15,-.34],[1,1,.65]);
part(rider,new THREE.CapsuleGeometry(.23,.48,4,8),jacketMat,[0,1.68,.22],[1,.93,.8]);
part(rider,new THREE.CapsuleGeometry(.17,.37,4,8),pantsMat,[0,1.29,.43],[1,.9,.8]);
part(rider,new THREE.SphereGeometry(.19,12,9),skinMat,[0,2.0,.03]);
part(rider,new THREE.SphereGeometry(.25,14,10),helmetMat,[0,2.28,-.04],[1,1.05,1.08]);
part(rider,new THREE.BoxGeometry(.32,.11,.08),dark,[0,2.25,-.255]);
cylinderBetween(rider,[-.17,1.8,.12],[-.34,1.43,-.24],.09,jacketMat);
cylinderBetween(rider,[.17,1.8,.12],[.34,1.43,-.24],.09,jacketMat);
part(rider,new THREE.SphereGeometry(.085,8,6),dark,[-.34,1.42,-.25]); part(rider,new THREE.SphereGeometry(.085,8,6),dark,[.34,1.42,-.25]);
cylinderBetween(rider,[-.13,1.22,.42],[-.28,.68,.62],.105,pantsMat);
cylinderBetween(rider,[.13,1.22,.42],[.28,.68,.62],.105,pantsMat);
part(rider,new THREE.BoxGeometry(.2,.14,.32),dark,[-.28,.56,.63]);part(rider,new THREE.BoxGeometry(.2,.14,.32),dark,[.28,.56,.63]);

const carMaterials = [0xe14a38,0x315e9d,0xe6e1d3,0x373d43,0xe0b342].map(color => new THREE.MeshStandardMaterial({ color, roughness: .48, metalness: .18 }));
const traffic = [];
function makeCar(x,z,direction,index) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1,.72,4), carMaterials[index % carMaterials.length]); body.position.y=.62; body.castShadow=true; group.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65,.72,1.85), new THREE.MeshStandardMaterial({color:0x9fc3cf,metalness:.25,roughness:.22})); cabin.position.set(0,1.28,-.15); group.add(cabin);
  for (const wx of [-1,1]) for (const wz of [-1.25,1.25]) { const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.2,10),rubber);wheel.rotation.z=Math.PI/2;wheel.position.set(wx,.38,wz);group.add(wheel); }
  group.position.set(x,0,z); group.rotation.y=direction>0?Math.PI/2:-Math.PI/2; scene.add(group);
  traffic.push({group,x,z,direction,speed:5+seeded(index+990)*5});
}
for(let i=0;i<22;i++) makeCar(-380+seeded(i+44)*760,Math.round((-4+seeded(i+4)*8))*BLOCK+ (seeded(i+20)>.5?6:-6),i%2?1:-1,i);

const input = { left:false,right:false,accelerate:false,brake:false,boost:false };
const keyMap = {ArrowUp:'accelerate',KeyW:'accelerate',KeyZ:'accelerate',ArrowDown:'brake',KeyS:'brake',Space:'brake',ArrowLeft:'left',KeyA:'left',KeyQ:'left',ArrowRight:'right',KeyD:'right',ShiftLeft:'boost',ShiftRight:'boost'};
addEventListener('keydown',e=>{const action=keyMap[e.code];if(action){input[action]=true;e.preventDefault();}});
addEventListener('keyup',e=>{const action=keyMap[e.code];if(action)input[action]=false;});
for(const button of document.querySelectorAll('[data-control]')){
  const action=button.dataset.control;
  const on=e=>{e.preventDefault();input[action]=true;button.classList.add('pressed');button.setPointerCapture?.(e.pointerId);};
  const off=e=>{e.preventDefault();input[action]=false;button.classList.remove('pressed');};
  button.addEventListener('pointerdown',on);button.addEventListener('pointerup',off);button.addEventListener('pointercancel',off);button.addEventListener('lostpointercapture',off);
}

let speed=0,yaw=0,boostUntil=0,jumpUntil=0,lastTime=performance.now(),toastTimer;
const toast=(text)=>{const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2300);};
function insideBuilding(x,z){return cityColliders.some(c=>Math.abs(x-c.x)<c.rx&&Math.abs(z-c.z)<c.rz);}
function actionFor(effect){
  if(effect==='turbo'){boostUntil=performance.now()+10000;toast('TURBO ACTIVÉ — 10 secondes !');}
  else if(effect==='repair'){speed=Math.max(speed,0);toast('Moto réparée !');}
  else if(effect==='paint'){frameMat.color.setHSL(Math.random(),.78,.55);toast('Nouvelle couleur !');}
  else if(effect==='moon'){jumpUntil=performance.now()+10000;toast('Sauts renforcés pendant 10 secondes !');}
}
const defaults={TURBO:'turbo',REPARER:'repair',COULEUR:'paint'};
function getCodes(){try{return {...defaults,...JSON.parse(localStorage.getItem('motoRushCodes')||'{}')};}catch{return defaults;}}
document.querySelector('#codeForm').addEventListener('submit',e=>{e.preventDefault();const code=document.querySelector('#codeInput').value.trim().toUpperCase();const effect=document.querySelector('#effectSelect').value;if(code.length<3){toast('Choisis un code de 3 caractères minimum.');return;}const codes=getCodes();codes[code]=effect;localStorage.setItem('motoRushCodes',JSON.stringify(codes));document.querySelector('#codeInput').value='';toast(`Code ${code} enregistré !`);});
document.querySelector('#activateForm').addEventListener('submit',e=>{e.preventDefault();const code=document.querySelector('#activateInput').value.trim().toUpperCase();const effect=getCodes()[code];if(!effect){toast('Code inconnu. Vérifie ton code.');return;}actionFor(effect);document.querySelector('#activateInput').value='';});
for(const id of ['helpBtn','cheatBtn'])document.querySelector(`#${id}`).addEventListener('click',()=>{const panel=document.querySelector(id==='helpBtn'?'#helpPanel':'#cheatPanel');panel.classList.toggle('hidden');});
for(const button of document.querySelectorAll('[data-close]'))button.addEventListener('click',()=>document.getElementById(button.dataset.close).classList.add('hidden'));

let lookPointer=null,lastPointerX=0;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){lookPointer=e.pointerId;lastPointerX=e.clientX;}});
renderer.domElement.addEventListener('pointermove',e=>{if(lookPointer===e.pointerId){yaw-=(e.clientX-lastPointerX)*.004;lastPointerX=e.clientX;}});
renderer.domElement.addEventListener('pointerup',e=>{if(lookPointer===e.pointerId)lookPointer=null;});

const cameraTarget=new THREE.Vector3();
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;
  const turbo=input.boost||now<boostUntil;
  const maxSpeed=turbo?39:25;
  if(input.accelerate)speed=Math.min(maxSpeed,speed+(turbo?27:17)*dt);
  else speed=Math.max(0,speed-5.2*dt);
  if(input.brake)speed=Math.max(-7,speed-25*dt);
  const steer=(Number(input.right)-Number(input.left));
  if(Math.abs(speed)>.4)yaw+=steer*dt*(.56+Math.min(Math.abs(speed)/22,.75))*Math.sign(speed);
  bike.rotation.y=yaw;
  bike.rotation.z=THREE.MathUtils.damp(bike.rotation.z,-steer*Math.min(Math.abs(speed)/28,.4),5,dt);
  const direction=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));
  const nextX=bike.position.x+direction.x*speed*dt, nextZ=bike.position.z+direction.z*speed*dt;
  if(Math.abs(nextX)<420&&Math.abs(nextZ)<420&&!insideBuilding(nextX,nextZ)){bike.position.x=nextX;bike.position.z=nextZ;}
  else {speed*=-.2;toast('Attention ! Tu as heurté un obstacle.');}
  bike.position.y=jumpUntil>now?Math.abs(Math.sin(now*.008))*1.6:.0;
  bike.rotation.x=jumpUntil>now?Math.sin(now*.008)*.08:0;
  for(const car of traffic){car.x+=car.direction*car.speed*dt;if(car.x>410)car.x=-410;if(car.x<-410)car.x=410;car.group.position.x=car.x;if(Math.hypot(car.x-bike.position.x,car.z-bike.position.z)<2.5){speed*=.91;}}
  const followDistance=7.8,followHeight=4.2;
  cameraTarget.set(bike.position.x-direction.x*followDistance,bike.position.y+followHeight,bike.position.z-direction.z*followDistance);
  camera.position.lerp(cameraTarget,1-Math.exp(-4.5*dt));
  const lookAt=new THREE.Vector3(bike.position.x+direction.x*2,bike.position.y+1.15,bike.position.z+direction.z*2);camera.lookAt(lookAt);
  document.querySelector('#speed').textContent=Math.round(Math.abs(speed)*3.6);
  document.querySelector('#gear').textContent=turbo?'TURBO ACTIVÉ':speed<.5?'PRÊT À ROULER':'EN ROUTE';
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));});
setTimeout(()=>document.querySelector('#loading').classList.add('done'),500);
