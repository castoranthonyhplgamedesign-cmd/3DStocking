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

const CLOUD_COUNT = 18;
const CLOUD_MIN_Y = 0;
const CLOUD_MAX_Y = 45;

let clouds: Cloud[] = [];
let cloudMaterial: StandardMaterial | null = null;

function getCloudMaterial(scene: Scene): StandardMaterial {
  if (!cloudMaterial || cloudMaterial.getScene() === null) {
    cloudMaterial = new StandardMaterial("cloudMat", scene);
    cloudMaterial.diffuseColor = new Color3(1, 1, 1);
    cloudMaterial.emissiveColor = new Color3(0.7, 0.72, 0.78);
    cloudMaterial.specularColor = new Color3(0, 0, 0);
    cloudMaterial.alpha = 0.92;
    cloudMaterial.backFaceCulling = false;
  }
  return cloudMaterial;
}

function createSingleCloud(scene: Scene, index: number, forceAngle?: number, forceDist?: number, forceY?: number): Cloud {
  const root = new Mesh(`cloud_root_${index}`, scene);
  const mat = getCloudMaterial(scene);

  const cloudScale = 1.2 + Math.random() * 1.8;

  // Wide, flat cluster of 8-14 overlapping ellipsoids
  const puffCount = 8 + Math.floor(Math.random() * 7);

  for (let i = 0; i < puffCount; i++) {
    const diameterXZ = (1.0 + Math.random() * 1.5) * cloudScale;
    const diameterY = diameterXZ * (0.3 + Math.random() * 0.25);

    const puff = MeshBuilder.CreateSphere(
      `puff_${index}_${i}`,
      { diameter: 1, segments: 8 },
      scene
    );
    puff.scaling.set(diameterXZ, diameterY, diameterXZ);
    puff.material = mat;

    puff.position.set(
      (Math.random() - 0.5) * 3.5 * cloudScale,
      (Math.random() - 0.5) * 0.5 * cloudScale,
      (Math.random() - 0.5) * 2.5 * cloudScale
    );
    puff.parent = root;
  }

  // Bigger core puffs for volume
  const coreCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < coreCount; i++) {
    const diam = (1.8 + Math.random() * 1.2) * cloudScale;
    const core = MeshBuilder.CreateSphere(
      `core_${index}_${i}`,
      { diameter: 1, segments: 8 },
      scene
    );
    core.scaling.set(diam, diam * (0.35 + Math.random() * 0.15), diam);
    core.material = mat;
    core.position.set(
      (Math.random() - 0.5) * 1.5 * cloudScale,
      (Math.random() - 0.3) * 0.3 * cloudScale,
      (Math.random() - 0.5) * 1.0 * cloudScale
    );
    core.parent = root;
  }

  // Position cloud
  // Camera looks from roughly (-PI/4 alpha, PI/3 beta) at radius 14-18
  // That means camera is at roughly (+x, +y, -z) looking toward origin
  // Place clouds in the VISIBLE hemisphere — mostly in front of the camera
  const angle = forceAngle ?? (Math.random() * Math.PI * 2);
  const dist = forceDist ?? (8 + Math.random() * 20);
  const baseX = Math.cos(angle) * dist;
  const baseZ = Math.sin(angle) * dist;
  const baseY = forceY ?? (CLOUD_MIN_Y + Math.random() * (CLOUD_MAX_Y - CLOUD_MIN_Y));

  root.position.set(baseX, baseY, baseZ);

  return {
    root,
    baseX,
    baseZ,
    baseY,
    driftSpeed: 0.05 + Math.random() * 0.12,
    bobSpeed: 0.2 + Math.random() * 0.3,
    bobAmount: 0.15 + Math.random() * 0.3,
    driftAngle: Math.random() * Math.PI * 2,
    driftRadius: 1.5 + Math.random() * 3,
  };
}

export function createClouds(scene: Scene): void {
  disposeClouds();

  // Camera is at alpha=-PI/4, so it looks from the +x/-z quadrant toward origin.
  // Place several guaranteed-visible clouds in the camera's field of view.
  // These are placed at angles that are roughly BEHIND the tower from camera POV,
  // so they appear as backdrop.

  // Guaranteed visible clouds — placed in the directions the camera can see
  const guaranteedPositions = [
    { angle: Math.PI * 0.6, dist: 12, y: 5 },
    { angle: Math.PI * 0.8, dist: 15, y: 12 },
    { angle: Math.PI * 1.0, dist: 10, y: 20 },
    { angle: Math.PI * 1.2, dist: 14, y: 28 },
    { angle: Math.PI * 0.4, dist: 16, y: 8 },
    { angle: Math.PI * 1.4, dist: 12, y: 35 },
  ];

  for (let i = 0; i < guaranteedPositions.length; i++) {
    const p = guaranteedPositions[i];
    clouds.push(createSingleCloud(scene, i, p.angle, p.dist, p.y));
  }

  // Fill the rest randomly
  for (let i = guaranteedPositions.length; i < CLOUD_COUNT; i++) {
    clouds.push(createSingleCloud(scene, i));
  }

  // Animate clouds
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
