import { Scene } from "@babylonjs/core/scene";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

// Side-effect imports to register particle shaders (required for tree-shaken builds)
import "@babylonjs/core/Shaders/particles.vertex";
import "@babylonjs/core/Shaders/particles.fragment";

import type { PowerUpType } from "./powerups";

// Generate a soft circle texture procedurally (no external assets needed)
let _particleTextureUrl: string | null = null;
function getParticleTexture(scene: Scene): Texture {
  if (!_particleTextureUrl) {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.8)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    _particleTextureUrl = canvas.toDataURL();
  }
  return new Texture(_particleTextureUrl, scene);
}

// ── Ambient aura around floating power-up (loops while power-up exists) ──

export function createPowerUpAura(scene: Scene, emitter: Mesh, type: PowerUpType): ParticleSystem {
  const ps = new ParticleSystem(`aura_${type}`, 40, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = emitter;

  ps.minSize = 0.05;
  ps.maxSize = 0.18;
  ps.minLifeTime = 0.6;
  ps.maxLifeTime = 1.2;
  ps.emitRate = 25;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, 0.3, 0);

  // Emit in a small sphere around the gem
  ps.minEmitBox = new Vector3(-0.25, -0.15, -0.25);
  ps.maxEmitBox = new Vector3(0.25, 0.15, 0.25);
  ps.direction1 = new Vector3(-0.3, 0.5, -0.3);
  ps.direction2 = new Vector3(0.3, 1.0, 0.3);
  ps.minEmitPower = 0.2;
  ps.maxEmitPower = 0.5;

  switch (type) {
    case "magnet":
      // Red/orange sparks swirling inward
      ps.color1 = new Color4(1, 0.3, 0.3, 0.9);
      ps.color2 = new Color4(1, 0.6, 0.2, 0.7);
      ps.colorDead = new Color4(1, 0.1, 0.1, 0);
      ps.direction1 = new Vector3(-0.5, 0.2, -0.5);
      ps.direction2 = new Vector3(0.5, 0.8, 0.5);
      ps.minEmitPower = 0.1;
      ps.maxEmitPower = 0.4;
      ps.minSize = 0.06;
      ps.maxSize = 0.15;
      break;

    case "expand":
      // Green sparkles radiating outward
      ps.color1 = new Color4(0.3, 1, 0.4, 0.9);
      ps.color2 = new Color4(0.5, 1, 0.3, 0.7);
      ps.colorDead = new Color4(0.2, 0.8, 0.2, 0);
      ps.direction1 = new Vector3(-0.8, 0.3, -0.8);
      ps.direction2 = new Vector3(0.8, 1.2, 0.8);
      ps.minEmitPower = 0.3;
      ps.maxEmitPower = 0.7;
      ps.minSize = 0.04;
      ps.maxSize = 0.14;
      break;

    case "slowmo":
      // Blue drifting snowflake-like particles
      ps.color1 = new Color4(0.3, 0.7, 1, 0.8);
      ps.color2 = new Color4(0.5, 0.9, 1, 0.6);
      ps.colorDead = new Color4(0.2, 0.5, 1, 0);
      ps.gravity = new Vector3(0, -0.1, 0);
      ps.direction1 = new Vector3(-0.2, 0.1, -0.2);
      ps.direction2 = new Vector3(0.2, 0.4, 0.2);
      ps.minEmitPower = 0.05;
      ps.maxEmitPower = 0.2;
      ps.minLifeTime = 1.0;
      ps.maxLifeTime = 2.0;
      ps.minSize = 0.06;
      ps.maxSize = 0.2;
      ps.emitRate = 18;
      break;

    case "freeze":
      // Purple/icy crystal particles spiraling up
      ps.color1 = new Color4(0.7, 0.4, 1, 0.9);
      ps.color2 = new Color4(0.5, 0.6, 1, 0.7);
      ps.colorDead = new Color4(0.4, 0.2, 1, 0);
      ps.direction1 = new Vector3(-0.4, 0.8, -0.4);
      ps.direction2 = new Vector3(0.4, 1.5, 0.4);
      ps.minEmitPower = 0.2;
      ps.maxEmitPower = 0.6;
      ps.minSize = 0.04;
      ps.maxSize = 0.16;
      ps.emitRate = 30;
      break;
  }

  ps.start();
  return ps;
}

// ── Burst when collecting a power-up ──

export function burstPowerUpCollect(scene: Scene, position: Vector3, type: PowerUpType): void {
  const ps = new ParticleSystem(`burst_${type}`, 80, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.08;
  ps.maxSize = 0.25;
  ps.minLifeTime = 0.4;
  ps.maxLifeTime = 0.9;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, -2, 0);
  ps.targetStopDuration = 0.15;
  ps.disposeOnStop = true;

  // Explode in all directions
  ps.direction1 = new Vector3(-2, 1, -2);
  ps.direction2 = new Vector3(2, 3, 2);
  ps.minEmitPower = 1.5;
  ps.maxEmitPower = 3.5;
  ps.emitRate = 500; // burst

  switch (type) {
    case "magnet":
      ps.color1 = new Color4(1, 0.3, 0.2, 1);
      ps.color2 = new Color4(1, 0.6, 0.1, 1);
      ps.colorDead = new Color4(1, 0.1, 0, 0);
      break;
    case "expand":
      ps.color1 = new Color4(0.2, 1, 0.3, 1);
      ps.color2 = new Color4(0.5, 1, 0.2, 1);
      ps.colorDead = new Color4(0.1, 0.7, 0.1, 0);
      break;
    case "slowmo":
      ps.color1 = new Color4(0.2, 0.6, 1, 1);
      ps.color2 = new Color4(0.4, 0.9, 1, 1);
      ps.colorDead = new Color4(0.1, 0.3, 1, 0);
      break;
    case "freeze":
      ps.color1 = new Color4(0.6, 0.3, 1, 1);
      ps.color2 = new Color4(0.4, 0.5, 1, 1);
      ps.colorDead = new Color4(0.3, 0.1, 1, 0);
      break;
  }

  ps.start();
}

// ── Perfect placement sparkle burst ──

export function burstPerfect(scene: Scene, position: Vector3, comboCount: number): void {
  const intensity = Math.min(comboCount, 8);
  const count = 30 + intensity * 15;

  const ps = new ParticleSystem(`perfect_${Date.now()}`, count, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.05;
  ps.maxSize = 0.15 + intensity * 0.02;
  ps.minLifeTime = 0.3;
  ps.maxLifeTime = 0.8 + intensity * 0.1;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, -1, 0);
  ps.targetStopDuration = 0.1;
  ps.disposeOnStop = true;

  ps.direction1 = new Vector3(-1.5, 1, -1.5);
  ps.direction2 = new Vector3(1.5, 3, 1.5);
  ps.minEmitPower = 1 + intensity * 0.3;
  ps.maxEmitPower = 2.5 + intensity * 0.5;
  ps.emitRate = 600;

  // Gold/white sparkle, gets more colorful with higher combos
  if (comboCount >= 5) {
    // Rainbow at high combos
    ps.color1 = new Color4(1, 0.8, 0.2, 1);
    ps.color2 = new Color4(0.8, 0.3, 1, 1);
    ps.colorDead = new Color4(1, 0.5, 0, 0);
  } else if (comboCount >= 3) {
    // Golden
    ps.color1 = new Color4(1, 0.85, 0.2, 1);
    ps.color2 = new Color4(1, 0.95, 0.5, 1);
    ps.colorDead = new Color4(1, 0.6, 0, 0);
  } else {
    // White sparkle
    ps.color1 = new Color4(1, 1, 1, 0.9);
    ps.color2 = new Color4(1, 1, 0.8, 0.7);
    ps.colorDead = new Color4(1, 1, 1, 0);
  }

  ps.start();
}

// ── Freeze activation effect (icy ring expanding outward) ──

export function burstFreeze(scene: Scene, position: Vector3): void {
  const ps = new ParticleSystem(`freeze_act_${Date.now()}`, 120, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.06;
  ps.maxSize = 0.2;
  ps.minLifeTime = 0.5;
  ps.maxLifeTime = 1.2;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, 0.5, 0);
  ps.targetStopDuration = 0.2;
  ps.disposeOnStop = true;

  // Expand outward in a flat ring
  ps.direction1 = new Vector3(-3, 0.2, -3);
  ps.direction2 = new Vector3(3, 1, 3);
  ps.minEmitPower = 2;
  ps.maxEmitPower = 4;
  ps.emitRate = 600;

  ps.color1 = new Color4(0.6, 0.4, 1, 1);
  ps.color2 = new Color4(0.7, 0.8, 1, 1);
  ps.colorDead = new Color4(0.5, 0.5, 1, 0);

  ps.start();
}

// ── Slow-mo activation (blue trails floating down) ──

export function burstSlowMo(scene: Scene, position: Vector3): void {
  const ps = new ParticleSystem(`slowmo_act_${Date.now()}`, 60, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.08;
  ps.maxSize = 0.22;
  ps.minLifeTime = 0.8;
  ps.maxLifeTime = 1.8;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, -0.5, 0);
  ps.targetStopDuration = 0.3;
  ps.disposeOnStop = true;

  ps.direction1 = new Vector3(-1, 0, -1);
  ps.direction2 = new Vector3(1, 2, 1);
  ps.minEmitPower = 0.5;
  ps.maxEmitPower = 1.5;
  ps.emitRate = 200;

  ps.color1 = new Color4(0.2, 0.6, 1, 0.9);
  ps.color2 = new Color4(0.4, 0.85, 1, 0.7);
  ps.colorDead = new Color4(0.1, 0.4, 1, 0);

  ps.start();
}

// ── Magnet activation (particles pull inward) ──

export function burstMagnet(scene: Scene, position: Vector3): void {
  const ps = new ParticleSystem(`magnet_act_${Date.now()}`, 60, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.06;
  ps.maxSize = 0.18;
  ps.minLifeTime = 0.4;
  ps.maxLifeTime = 0.8;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, 1, 0);
  ps.targetStopDuration = 0.15;
  ps.disposeOnStop = true;

  // Start far and pull inward (negative power with outward direction = inward)
  ps.direction1 = new Vector3(-1.5, -0.5, -1.5);
  ps.direction2 = new Vector3(1.5, 1.5, 1.5);
  ps.minEmitPower = 1;
  ps.maxEmitPower = 2.5;
  ps.emitRate = 400;

  ps.color1 = new Color4(1, 0.3, 0.2, 1);
  ps.color2 = new Color4(1, 0.5, 0.1, 0.8);
  ps.colorDead = new Color4(1, 0.2, 0, 0);

  ps.start();
}

// ── Expand activation (green burst outward) ──

export function burstExpand(scene: Scene, position: Vector3): void {
  const ps = new ParticleSystem(`expand_act_${Date.now()}`, 80, scene);
  ps.particleTexture = getParticleTexture(scene);
  ps.emitter = position.clone();

  ps.minSize = 0.06;
  ps.maxSize = 0.2;
  ps.minLifeTime = 0.4;
  ps.maxLifeTime = 1.0;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, -0.5, 0);
  ps.targetStopDuration = 0.15;
  ps.disposeOnStop = true;

  // Spread outward flat
  ps.direction1 = new Vector3(-3, 0.2, -3);
  ps.direction2 = new Vector3(3, 1.5, 3);
  ps.minEmitPower = 2;
  ps.maxEmitPower = 4;
  ps.emitRate = 500;

  ps.color1 = new Color4(0.3, 1, 0.3, 1);
  ps.color2 = new Color4(0.6, 1, 0.4, 0.8);
  ps.colorDead = new Color4(0.1, 0.8, 0.1, 0);

  ps.start();
}
