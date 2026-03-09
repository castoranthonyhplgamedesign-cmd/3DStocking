import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { BLOCK_HEIGHT, POWERUP_SPAWN_CHANCE } from "./constants";
import { createPowerUpAura } from "./particles";

export type PowerUpType = "magnet" | "expand" | "slowmo" | "freeze";

export interface PowerUp {
  type: PowerUpType;
  mesh: Mesh;
  aura: ParticleSystem;
}

const POWERUP_COLORS: Record<PowerUpType, string> = {
  magnet: "#FF6B6B",
  expand: "#7BC67E",
  slowmo: "#45B7D1",
  freeze: "#A66CFF",
};

const POWERUP_POOL: PowerUpType[] = ["magnet", "expand", "slowmo", "freeze"];

export function shouldSpawnPowerUp(): boolean {
  return Math.random() < POWERUP_SPAWN_CHANCE;
}

export function pickRandomPowerUp(): PowerUpType {
  return POWERUP_POOL[Math.floor(Math.random() * POWERUP_POOL.length)];
}

export function createPowerUpMesh(
  scene: Scene,
  type: PowerUpType,
  x: number,
  z: number,
  y: number
): PowerUp {
  const mesh = MeshBuilder.CreateBox(
    `powerup_${type}_${y}`,
    { width: 0.4, height: 0.4, depth: 0.4 },
    scene
  );
  const mat = new StandardMaterial(`mat_pu_${y}`, scene);
  mat.diffuseColor = Color3.FromHexString(POWERUP_COLORS[type]);
  mat.emissiveColor = Color3.FromHexString(POWERUP_COLORS[type]).scale(0.4);
  mat.specularColor = new Color3(0.5, 0.5, 0.5);
  mesh.material = mat;
  mesh.position.set(x, y + BLOCK_HEIGHT / 2 + 0.4, z);
  mesh.rotation.y = Math.PI / 4;

  // Attach particle aura
  const aura = createPowerUpAura(scene, mesh, type);

  return { type, mesh, aura };
}

export function animatePowerUp(powerUp: PowerUp, scene: Scene): void {
  const baseY = powerUp.mesh.position.y;
  let time = 0;
  const observer = scene.onBeforeRenderObservable.add(() => {
    if (powerUp.mesh.isDisposed()) {
      scene.onBeforeRenderObservable.remove(observer);
      return;
    }
    const dt = scene.getEngine().getDeltaTime() / 1000;
    time += dt;
    powerUp.mesh.position.y = baseY + Math.sin(time * 3) * 0.15;
    powerUp.mesh.rotation.y += dt * 2;
  });
}

export function disposePowerUp(powerUp: PowerUp | null): void {
  if (!powerUp) return;
  if (powerUp.aura) {
    powerUp.aura.stop();
    powerUp.aura.dispose();
  }
  if (!powerUp.mesh.isDisposed()) {
    powerUp.mesh.material?.dispose();
    powerUp.mesh.dispose();
  }
}

export function getPowerUpLabel(type: PowerUpType): string {
  switch (type) {
    case "magnet": return "MAGNET";
    case "expand": return "EXPAND";
    case "slowmo": return "SLOW-MO";
    case "freeze": return "FREEZE";
  }
}
