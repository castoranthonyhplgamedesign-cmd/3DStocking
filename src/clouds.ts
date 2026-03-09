import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";

interface Cloud {
  root: Mesh;
  baseX: number;
  baseZ: number;
  baseY: number;
  driftSpeed: number;
  bobSpeed: number;
  bobAmount: number;
  driftAngle: number;
  driftRadius: number;
}

const CLOUD_COUNT = 14;
const CLOUD_MIN_Y = 2;
const CLOUD_MAX_Y = 50;
// Minimum distance from center — keeps clouds away from the tower
const CLOUD_MIN_DIST = 22;
const CLOUD_MAX_DIST = 45;

let clouds: Cloud[] = [];
let cloudMaterial: StandardMaterial | null = null;

function getCloudMaterial(scene: Scene): StandardMaterial {
  if (!cloudMaterial || cloudMaterial.getScene() === null) {
    cloudMaterial = new StandardMaterial("cloudMat", scene);
    cloudMaterial.diffuseColor = new Color3(1, 1, 1);
    cloudMaterial.emissiveColor = new Color3(0.75, 0.78, 0.84);
    cloudMaterial.specularColor = new Color3(0, 0, 0);
    cloudMaterial.alpha = 0.7;
    cloudMaterial.backFaceCulling = false;
  }
  return cloudMaterial;
}

function createSingleCloud(scene: Scene, index: number, forceAngle?: number, forceDist?: number, forceY?: number): Cloud {
  const root = new Mesh(`cloud_root_${index}`, scene);
  const mat = getCloudMaterial(scene);

  // Smaller clouds so they don't dominate the screen
  const cloudScale = 0.7 + Math.random() * 0.9;

  // 5-9 overlapping ellipsoids per cloud
  const puffCount = 5 + Math.floor(Math.random() * 5);

  for (let i = 0; i < puffCount; i++) {
    const diameterXZ = (0.8 + Math.random() * 1.0) * cloudScale;
    const diameterY = diameterXZ * (0.3 + Math.random() * 0.2);

    const puff = MeshBuilder.CreateSphere(
      `puff_${index}_${i}`,
      { diameter: 1, segments: 6 },
      scene
    );
    puff.scaling.set(diameterXZ, diameterY, diameterXZ);
    puff.material = mat;
    puff.position.set(
      (Math.random() - 0.5) * 2.5 * cloudScale,
      (Math.random() - 0.5) * 0.4 * cloudScale,
      (Math.random() - 0.5) * 1.8 * cloudScale
    );
    puff.parent = root;
  }

  // 1-2 core puffs
  const coreCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < coreCount; i++) {
    const diam = (1.2 + Math.random() * 0.8) * cloudScale;
    const core = MeshBuilder.CreateSphere(
      `core_${index}_${i}`,
      { diameter: 1, segments: 6 },
      scene
    );
    core.scaling.set(diam, diam * (0.3 + Math.random() * 0.15), diam);
    core.material = mat;
    core.position.set(
      (Math.random() - 0.5) * 1.0 * cloudScale,
      (Math.random() - 0.3) * 0.2 * cloudScale,
      (Math.random() - 0.5) * 0.8 * cloudScale
    );
    core.parent = root;
  }

  const angle = forceAngle ?? (Math.random() * Math.PI * 2);
  const dist = forceDist ?? (CLOUD_MIN_DIST + Math.random() * (CLOUD_MAX_DIST - CLOUD_MIN_DIST));
  const baseX = Math.cos(angle) * dist;
  const baseZ = Math.sin(angle) * dist;
  const baseY = forceY ?? (CLOUD_MIN_Y + Math.random() * (CLOUD_MAX_Y - CLOUD_MIN_Y));

  root.position.set(baseX, baseY, baseZ);

  return {
    root,
    baseX,
    baseZ,
    baseY,
    driftSpeed: 0.03 + Math.random() * 0.08,
    bobSpeed: 0.15 + Math.random() * 0.25,
    bobAmount: 0.1 + Math.random() * 0.2,
    driftAngle: Math.random() * Math.PI * 2,
    driftRadius: 1 + Math.random() * 2,
  };
}

export function createClouds(scene: Scene): void {
  disposeClouds();

  // Place clouds far from the tower so they never cover gameplay
  const guaranteedPositions = [
    { angle: Math.PI * 0.5, dist: 28, y: 8 },
    { angle: Math.PI * 0.8, dist: 32, y: 18 },
    { angle: Math.PI * 1.0, dist: 25, y: 30 },
    { angle: Math.PI * 1.3, dist: 30, y: 40 },
    { angle: Math.PI * 0.2, dist: 35, y: 12 },
    { angle: Math.PI * 1.6, dist: 28, y: 45 },
  ];

  for (let i = 0; i < guaranteedPositions.length; i++) {
    const p = guaranteedPositions[i];
    clouds.push(createSingleCloud(scene, i, p.angle, p.dist, p.y));
  }

  for (let i = guaranteedPositions.length; i < CLOUD_COUNT; i++) {
    clouds.push(createSingleCloud(scene, i));
  }

  // Animate
  let time = Math.random() * 100;
  scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime() / 1000;
    time += dt;

    for (const cloud of clouds) {
      if (cloud.root.isDisposed()) continue;
      cloud.root.position.x = cloud.baseX + Math.sin(time * cloud.driftSpeed + cloud.driftAngle) * cloud.driftRadius;
      cloud.root.position.z = cloud.baseZ + Math.cos(time * cloud.driftSpeed + cloud.driftAngle) * cloud.driftRadius;
      cloud.root.position.y = cloud.baseY + Math.sin(time * cloud.bobSpeed) * cloud.bobAmount;
    }
  });
}

export function disposeClouds(): void {
  for (const cloud of clouds) {
    if (!cloud.root.isDisposed()) {
      const children = cloud.root.getChildMeshes();
      for (const child of children) {
        child.dispose();
      }
      cloud.root.dispose();
    }
  }
  clouds = [];
}
