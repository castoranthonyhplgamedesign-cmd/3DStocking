import { Scene } from "@babylonjs/core/scene";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import "@babylonjs/core/Shaders/particles.vertex";
import "@babylonjs/core/Shaders/particles.fragment";

import type { PowerUpType } from "./powerups";

// Generate a bright glowing circle texture
let _particleTextureUrl: string | null = null;
function getParticleTexture(scene: Scene): Texture {
  if (!_particleTextureUrl) {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const c = canvas.getContext("2d")!;
    const half = size / 2;
    const gradient = c.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.4)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = gradient;
    c.fillRect(0, 0, size, size);
    _particleTextureUrl = canvas.toDataURL();
  }
  return new Texture(_particleTextureUrl, scene);
}

// ── EVERY BLOCK DROP — landing impact burst ──

export function burstLanding(scene: Scene, position: Vector3): void {
  const ps = new ParticleSystem(`land_${Date.now()}`, 200, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.15;
  ps.maxSize = 0.45;
  ps.minLifeTime = 0.3;
  ps.maxLifeTime = 0.8;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, -3, 0);
  ps.targetStopDuration = 0.08;
  ps.disposeOnStop = true;

  // Flat outward explosion
  ps.direction1 = new Vector3(-4, 0.5, -4);
  ps.direction2 = new Vector3(4, 2, 4);
  ps.minEmitPower = 3;
  ps.maxEmitPower = 6;
  ps.emitRate = 2000;

  ps.color1 = new Color4(1, 1, 1, 0.8);
  ps.color2 = new Color4(1, 0.9, 0.7, 0.6);
  ps.colorDead = new Color4(1, 0.8, 0.5, 0);

  ps.start();
}

// ── Ambient aura around floating power-up ──

export function createPowerUpAura(scene: Scene, emitter: Mesh, type: PowerUpType): ParticleSystem {
  const ps = new ParticleSystem(`aura_${type}`, 120, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = emitter;

  ps.minSize = 0.1;
  ps.maxSize = 0.35;
  ps.minLifeTime = 0.8;
  ps.maxLifeTime = 1.5;
  ps.emitRate = 60;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, 0.5, 0);

  ps.minEmitBox = new Vector3(-0.4, -0.2, -0.4);
  ps.maxEmitBox = new Vector3(0.4, 0.2, 0.4);
  ps.direction1 = new Vector3(-0.8, 0.5, -0.8);
  ps.direction2 = new Vector3(0.8, 2.0, 0.8);
  ps.minEmitPower = 0.5;
  ps.maxEmitPower = 1.2;

  switch (type) {
    case "magnet":
      ps.color1 = new Color4(1, 0.2, 0.1, 1);
      ps.color2 = new Color4(1, 0.5, 0.1, 0.8);
      ps.colorDead = new Color4(1, 0.1, 0, 0);
      ps.emitRate = 70;
      break;
    case "expand":
      ps.color1 = new Color4(0.1, 1, 0.3, 1);
      ps.color2 = new Color4(0.4, 1, 0.1, 0.8);
      ps.colorDead = new Color4(0, 0.8, 0, 0);
      ps.direction1 = new Vector3(-1.5, 0.3, -1.5);
      ps.direction2 = new Vector3(1.5, 1.5, 1.5);
      ps.minEmitPower = 0.8;
      ps.maxEmitPower = 1.5;
      break;
    case "slowmo":
      ps.color1 = new Color4(0.1, 0.5, 1, 1);
      ps.color2 = new Color4(0.3, 0.8, 1, 0.8);
      ps.colorDead = new Color4(0, 0.3, 1, 0);
      ps.gravity = new Vector3(0, -0.3, 0);
      ps.minLifeTime = 1.5;
      ps.maxLifeTime = 2.5;
      ps.minSize = 0.12;
      ps.maxSize = 0.4;
      ps.emitRate = 40;
      break;
    case "freeze":
      ps.color1 = new Color4(0.6, 0.2, 1, 1);
      ps.color2 = new Color4(0.4, 0.5, 1, 0.9);
      ps.colorDead = new Color4(0.3, 0.1, 1, 0);
      ps.direction1 = new Vector3(-0.6, 1.5, -0.6);
      ps.direction2 = new Vector3(0.6, 3, 0.6);
      ps.minEmitPower = 0.5;
      ps.maxEmitPower = 1.5;
      ps.emitRate = 80;
      break;
  }

  ps.start();
  return ps;
}

// ── Power-up COLLECT explosion ──

export function burstPowerUpCollect(scene: Scene, position: Vector3, type: PowerUpType): void {
  const ps = new ParticleSystem(`burst_${type}`, 400, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.2;
  ps.maxSize = 0.6;
  ps.minLifeTime = 0.5;
  ps.maxLifeTime = 1.2;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, -4, 0);
  ps.targetStopDuration = 0.12;
  ps.disposeOnStop = true;

  ps.direction1 = new Vector3(-5, 2, -5);
  ps.direction2 = new Vector3(5, 8, 5);
  ps.minEmitPower = 4;
  ps.maxEmitPower = 10;
  ps.emitRate = 3000;

  switch (type) {
    case "magnet":
      ps.color1 = new Color4(1, 0.2, 0.1, 1);
      ps.color2 = new Color4(1, 0.6, 0, 1);
      ps.colorDead = new Color4(1, 0, 0, 0);
      break;
    case "expand":
      ps.color1 = new Color4(0, 1, 0.2, 1);
      ps.color2 = new Color4(0.5, 1, 0, 1);
      ps.colorDead = new Color4(0, 0.6, 0, 0);
      break;
    case "slowmo":
      ps.color1 = new Color4(0, 0.5, 1, 1);
      ps.color2 = new Color4(0.3, 0.9, 1, 1);
      ps.colorDead = new Color4(0, 0.2, 1, 0);
      break;
    case "freeze":
      ps.color1 = new Color4(0.5, 0.1, 1, 1);
      ps.color2 = new Color4(0.3, 0.5, 1, 1);
      ps.colorDead = new Color4(0.2, 0, 1, 0);
      break;
  }

  ps.start();
}

// ── PERFECT placement — massive sparkle explosion ──

export function burstPerfect(scene: Scene, position: Vector3, comboCount: number): void {
  const intensity = Math.min(comboCount, 10);
  const count = 300 + intensity * 100;

  const ps = new ParticleSystem(`perfect_${Date.now()}`, count, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.15 + intensity * 0.03;
  ps.maxSize = 0.5 + intensity * 0.06;
  ps.minLifeTime = 0.5;
  ps.maxLifeTime = 1.5 + intensity * 0.15;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, -2, 0);
  ps.targetStopDuration = 0.15;
  ps.disposeOnStop = true;

  const spread = 4 + intensity * 0.8;
  ps.direction1 = new Vector3(-spread, 2, -spread);
  ps.direction2 = new Vector3(spread, 8 + intensity, spread);
  ps.minEmitPower = 3 + intensity * 0.8;
  ps.maxEmitPower = 8 + intensity * 1.5;
  ps.emitRate = 3000 + intensity * 500;

  if (comboCount >= 5) {
    // RAINBOW EXPLOSION
    ps.color1 = new Color4(1, 0.3, 0, 1);
    ps.color2 = new Color4(0.5, 0, 1, 1);
    ps.colorDead = new Color4(1, 1, 0, 0);
    // Second system for extra rainbow
    const ps2 = new ParticleSystem(`perfect2_${Date.now()}`, count, scene);
    ps2.particleTexture = getParticleTexture(scene);
    ps2.emitter = position.clone();
    ps2.minSize = 0.1;
    ps2.maxSize = 0.4;
    ps2.minLifeTime = 0.6;
    ps2.maxLifeTime = 1.8;
    ps2.blendMode = ParticleSystem.BLENDMODE_ADD;
    ps2.gravity = new Vector3(0, -1, 0);
    ps2.targetStopDuration = 0.2;
    ps2.disposeOnStop = true;
    ps2.direction1 = new Vector3(-spread, 1, -spread);
    ps2.direction2 = new Vector3(spread, 6, spread);
    ps2.minEmitPower = 2;
    ps2.maxEmitPower = 6;
    ps2.emitRate = 2000;
    ps2.color1 = new Color4(0, 1, 0.5, 1);
    ps2.color2 = new Color4(0, 0.5, 1, 1);
    ps2.colorDead = new Color4(0, 1, 1, 0);
    ps2.start();
  } else if (comboCount >= 3) {
    // GOLDEN FIREWORKS
    ps.color1 = new Color4(1, 0.85, 0, 1);
    ps.color2 = new Color4(1, 0.6, 0, 1);
    ps.colorDead = new Color4(1, 0.3, 0, 0);
  } else {
    // WHITE-GOLD BURST
    ps.color1 = new Color4(1, 1, 0.8, 1);
    ps.color2 = new Color4(1, 0.9, 0.4, 1);
    ps.colorDead = new Color4(1, 1, 1, 0);
  }

  ps.start();
}

// ── FREEZE activation — massive icy explosion ──

export function burstFreeze(scene: Scene, position: Vector3): void {
  const ps = new ParticleSystem(`freeze_act_${Date.now()}`, 500, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.15;
  ps.maxSize = 0.5;
  ps.minLifeTime = 0.6;
  ps.maxLifeTime = 1.5;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, 1, 0);
  ps.targetStopDuration = 0.2;
  ps.disposeOnStop = true;

  // Massive outward ring
  ps.direction1 = new Vector3(-8, 0.5, -8);
  ps.direction2 = new Vector3(8, 3, 8);
  ps.minEmitPower = 5;
  ps.maxEmitPower = 12;
  ps.emitRate = 3000;

  ps.color1 = new Color4(0.5, 0.2, 1, 1);
  ps.color2 = new Color4(0.6, 0.8, 1, 1);
  ps.colorDead = new Color4(0.3, 0.3, 1, 0);

  ps.start();

  // Second wave — upward ice crystals
  const ps2 = new ParticleSystem(`freeze_up_${Date.now()}`, 200, scene);
  ps2.particleTexture = getParticleTexture(scene);
  ps2.emitter = position.clone();
  ps2.minSize = 0.1;
  ps2.maxSize = 0.35;
  ps2.minLifeTime = 0.8;
  ps2.maxLifeTime = 2.0;
  ps2.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps2.gravity = new Vector3(0, 2, 0);
  ps2.targetStopDuration = 0.3;
  ps2.disposeOnStop = true;
  ps2.direction1 = new Vector3(-2, 5, -2);
  ps2.direction2 = new Vector3(2, 12, 2);
  ps2.minEmitPower = 3;
  ps2.maxEmitPower = 8;
  ps2.emitRate = 1500;
  ps2.color1 = new Color4(0.8, 0.6, 1, 1);
  ps2.color2 = new Color4(1, 1, 1, 1);
  ps2.colorDead = new Color4(0.5, 0.5, 1, 0);
  ps2.start();
}

// ── SLOW-MO activation — dreamy blue cascade ──

export function burstSlowMo(scene: Scene, position: Vector3): void {
  const ps = new ParticleSystem(`slowmo_act_${Date.now()}`, 300, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.15;
  ps.maxSize = 0.5;
  ps.minLifeTime = 1.0;
  ps.maxLifeTime = 3.0;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, -1, 0);
  ps.targetStopDuration = 0.4;
  ps.disposeOnStop = true;

  ps.direction1 = new Vector3(-4, 1, -4);
  ps.direction2 = new Vector3(4, 6, 4);
  ps.minEmitPower = 2;
  ps.maxEmitPower = 5;
  ps.emitRate = 1500;

  ps.color1 = new Color4(0, 0.4, 1, 1);
  ps.color2 = new Color4(0.3, 0.8, 1, 1);
  ps.colorDead = new Color4(0, 0.2, 1, 0);

  ps.start();
}

// ── MAGNET activation — fiery implosion then explosion ──

export function burstMagnet(scene: Scene, position: Vector3): void {
  const ps = new ParticleSystem(`magnet_act_${Date.now()}`, 300, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.12;
  ps.maxSize = 0.4;
  ps.minLifeTime = 0.4;
  ps.maxLifeTime = 1.0;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, 2, 0);
  ps.targetStopDuration = 0.15;
  ps.disposeOnStop = true;

  ps.direction1 = new Vector3(-5, -1, -5);
  ps.direction2 = new Vector3(5, 4, 5);
  ps.minEmitPower = 3;
  ps.maxEmitPower = 8;
  ps.emitRate = 2500;

  ps.color1 = new Color4(1, 0.15, 0, 1);
  ps.color2 = new Color4(1, 0.5, 0, 1);
  ps.colorDead = new Color4(1, 0, 0, 0);

  ps.start();
}

// ── EXPAND activation — green shockwave ──

export function burstExpand(scene: Scene, position: Vector3): void {
  const ps = new ParticleSystem(`expand_act_${Date.now()}`, 400, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.15;
  ps.maxSize = 0.5;
  ps.minLifeTime = 0.5;
  ps.maxLifeTime = 1.2;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, -1, 0);
  ps.targetStopDuration = 0.15;
  ps.disposeOnStop = true;

  // Massive flat shockwave
  ps.direction1 = new Vector3(-8, 0.5, -8);
  ps.direction2 = new Vector3(8, 3, 8);
  ps.minEmitPower = 5;
  ps.maxEmitPower = 12;
  ps.emitRate = 3000;

  ps.color1 = new Color4(0, 1, 0.2, 1);
  ps.color2 = new Color4(0.5, 1, 0, 1);
  ps.colorDead = new Color4(0, 0.6, 0, 0);

  ps.start();
}

// ── SLICE — sparks flying off the cut ──

export function burstSlice(scene: Scene, position: Vector3): void {
  const ps = new ParticleSystem(`slice_${Date.now()}`, 150, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.08;
  ps.maxSize = 0.25;
  ps.minLifeTime = 0.3;
  ps.maxLifeTime = 0.7;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, -5, 0);
  ps.targetStopDuration = 0.06;
  ps.disposeOnStop = true;

  ps.direction1 = new Vector3(-3, 1, -3);
  ps.direction2 = new Vector3(3, 4, 3);
  ps.minEmitPower = 3;
  ps.maxEmitPower = 7;
  ps.emitRate = 2500;

  ps.color1 = new Color4(1, 0.8, 0.3, 1);
  ps.color2 = new Color4(1, 0.5, 0.1, 0.8);
  ps.colorDead = new Color4(1, 0.3, 0, 0);

  ps.start();
}

// ── GAME OVER — dramatic red/dark explosion ──

export function burstGameOver(scene: Scene, position: Vector3): void {
  const ps = new ParticleSystem(`gameover_${Date.now()}`, 600, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.2;
  ps.maxSize = 0.7;
  ps.minLifeTime = 0.8;
  ps.maxLifeTime = 2.5;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, -3, 0);
  ps.targetStopDuration = 0.3;
  ps.disposeOnStop = true;

  ps.direction1 = new Vector3(-6, 2, -6);
  ps.direction2 = new Vector3(6, 10, 6);
  ps.minEmitPower = 4;
  ps.maxEmitPower = 12;
  ps.emitRate = 3000;

  ps.color1 = new Color4(1, 0.1, 0, 1);
  ps.color2 = new Color4(1, 0.4, 0, 0.8);
  ps.colorDead = new Color4(0.3, 0, 0, 0);

  ps.start();
}
