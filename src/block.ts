import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { BLOCK_HEIGHT, FALL_GRAVITY, SWING_RANGE } from "./constants";
import { getBlockColor } from "./colors";
import { createRoundedBox } from "./roundedBox";

export interface BlockState {
  mesh: Mesh;
  width: number;
  depth: number;
  x: number;
  z: number;
  y: number;
}

export interface SliceResult {
  survived: BlockState;
  overhang: Mesh;
}

function createMaterial(scene: Scene, color: Color3, name: string): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = color;
  mat.specularColor = new Color3(0.2, 0.2, 0.2);
  return mat;
}

export function createBlock(
  scene: Scene,
  layer: number,
  width: number,
  depth: number,
  x: number,
  z: number,
  axis: "x" | "z"
): BlockState {
  const y = layer * BLOCK_HEIGHT;
  const mesh = createRoundedBox(
    `block_${layer}`,
    { width, height: BLOCK_HEIGHT, depth },
    scene
  );
  mesh.material = createMaterial(scene, getBlockColor(layer), `mat_${layer}`);

  mesh.position.set(
    axis === "x" ? SWING_RANGE : x,
    y,
    axis === "z" ? SWING_RANGE : z
  );

  return { mesh, width, depth, x, z, y };
}

export function createBaseBlock(scene: Scene): BlockState {
  const width = 3;
  const depth = 3;
  const mesh = createRoundedBox("base", { width, height: BLOCK_HEIGHT, depth }, scene);
  mesh.material = createMaterial(scene, getBlockColor(0), "mat_base");
  mesh.position.set(0, 0, 0);
  return { mesh, width, depth, x: 0, z: 0, y: 0 };
}

export function updateSwingBlock(block: BlockState, axis: "x" | "z", time: number, speed: number): void {
  const pos = Math.sin(time * speed) * SWING_RANGE;
  if (axis === "x") {
    block.mesh.position.x = pos;
    block.x = pos;
  } else {
    block.mesh.position.z = pos;
    block.z = pos;
  }
}

export function sliceBlock(
  current: BlockState,
  previous: BlockState,
  axis: "x" | "z",
  scene: Scene,
  layer: number
): SliceResult | null {
  current.x = current.mesh.position.x;
  current.z = current.mesh.position.z;

  const isX = axis === "x";
  const currentPos = isX ? current.x : current.z;
  const currentSize = isX ? current.width : current.depth;
  const prevPos = isX ? previous.x : previous.z;
  const prevSize = isX ? previous.width : previous.depth;

  const currentLeft = currentPos - currentSize / 2;
  const currentRight = currentPos + currentSize / 2;
  const prevLeft = prevPos - prevSize / 2;
  const prevRight = prevPos + prevSize / 2;

  const overlapLeft = Math.max(currentLeft, prevLeft);
  const overlapRight = Math.min(currentRight, prevRight);
  const overlap = overlapRight - overlapLeft;

  if (overlap <= 0) return null;

  const survivedCenter = (overlapLeft + overlapRight) / 2;
  const survivedSize = overlap;

  const overhangSize = currentSize - overlap;
  const overhangOnRight = currentRight > prevRight;
  const overhangCenter = overhangOnRight
    ? overlapRight + overhangSize / 2
    : overlapLeft - overhangSize / 2;

  current.mesh.material?.dispose();
  current.mesh.dispose();

  const color = getBlockColor(layer);

  // Survived piece
  const survWidth = isX ? survivedSize : current.width;
  const survDepth = isX ? current.depth : survivedSize;
  const survX = isX ? survivedCenter : current.x;
  const survZ = isX ? current.z : survivedCenter;

  const survMesh = createRoundedBox(
    `survived_${layer}`,
    { width: survWidth, height: BLOCK_HEIGHT, depth: survDepth },
    scene
  );
  survMesh.material = createMaterial(scene, color, `mat_surv_${layer}`);
  survMesh.position.set(survX, current.y, survZ);

  const survived: BlockState = {
    mesh: survMesh,
    width: survWidth,
    depth: survDepth,
    x: survX,
    z: survZ,
    y: current.y,
  };

  // Overhang piece
  const ohWidth = isX ? overhangSize : current.width;
  const ohDepth = isX ? current.depth : overhangSize;
  const ohX = isX ? overhangCenter : current.x;
  const ohZ = isX ? current.z : overhangCenter;

  const ohMesh = createRoundedBox(
    `overhang_${layer}`,
    { width: ohWidth, height: BLOCK_HEIGHT, depth: ohDepth },
    scene
  );
  const ohMat = createMaterial(scene, color, `mat_oh_${layer}`);
  ohMat.alpha = 0.8;
  ohMesh.material = ohMat;
  ohMesh.position.set(ohX, current.y, ohZ);

  return { survived, overhang: ohMesh };
}

export function animateOverhangFall(mesh: Mesh, scene: Scene): void {
  let velocity = 0;
  const rotSpeedX = (Math.random() - 0.5) * 3;
  const rotSpeedZ = (Math.random() - 0.5) * 3;

  const observer = scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime() / 1000;
    velocity += FALL_GRAVITY * dt;
    mesh.position.y -= velocity * dt;
    mesh.rotation.x += rotSpeedX * dt;
    mesh.rotation.z += rotSpeedZ * dt;

    if (mesh.position.y < -20) {
      mesh.material?.dispose();
      mesh.dispose();
      scene.onBeforeRenderObservable.remove(observer);
    }
  });
}
