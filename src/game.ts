import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { getBlockColor } from "./colors";
import {
  BLOCK_HEIGHT,
  INITIAL_BLOCK_SIZE,
  STARTING_STACK,
  SWING_SPEED,
  SPEED_INCREMENT,
  MAX_SPEED,
  CAMERA_LERP_SPEED,
  PERFECT_THRESHOLD,
  COMBO_PERFECT_MIN,
  POWERUP_MAGNET_THRESHOLD,
  POWERUP_EXPAND_AMOUNT,
  POWERUP_EXPAND_MAX,
  POWERUP_SLOWMO_MULTIPLIER,
  POWERUP_SLOWMO_DURATION,
  POWERUP_FREEZE_DURATION,
} from "./constants";
import type { BlockState } from "./block";
import {
  createBaseBlock,
  createBlock,
  updateSwingBlock,
  sliceBlock,
  animateOverhangFall,
} from "./block";
import type { UIElements } from "./ui";
import {
  updateScore,
  showGameOver,
  showNameInput,
  hideGameOver,
  showStartScreen,
  hideStartScreen,
  showComboText,
  showPowerUpText,
  updateActivePowerUps,
} from "./ui";
import { isHighScore, saveHighScore, getHighScores } from "./highscore";
import { isPlayableMode, showCTA } from "./cta";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import {
  burstLanding,
  burstPowerUpCollect,
  burstPerfect,
  burstFreeze,
  burstSlowMo,
  burstMagnet,
  burstExpand,
  burstSlice,
  burstGameOver,
} from "./particles";
import type { PowerUp, PowerUpType } from "./powerups";
import {
  shouldSpawnPowerUp,
  pickRandomPowerUp,
  createPowerUpMesh,
  animatePowerUp,
  disposePowerUp,
  getPowerUpLabel,
} from "./powerups";
import {
  unlockAudio,
  startMusic,
  stopMusic,
  playGameStart,
  playDrop,
  playPerfect,
  playCombo,
  playSlice,
  playPowerUpCollect,
  playMagnetActivate,
  playExpandActivate,
  playSlowMoActivate,
  playFreezeActivate,
  playGameOver,
} from "./sound";

type GameState = "READY" | "PLAYING" | "FROZEN" | "GAME_OVER";

interface GameContext {
  scene: Scene;
  engine: Engine;
  camera: ArcRotateCamera;
  ui: UIElements;
  state: GameState;
  score: number;
  layer: number;
  playerDrops: number; // blocks placed by the player (for speed ramp)
  axis: "x" | "z";
  speed: number;
  currentBlock: BlockState | null;
  previousBlock: BlockState | null;
  allMeshes: Mesh[];
  time: number;
  cameraTargetY: number;
  // Combo
  comboCount: number;
  // Power-ups
  activePowerUp: PowerUp | null;
  hasMagnet: boolean;
  slowMoRemaining: number;
  freezeTimer: number;
}

export function initGame(
  scene: Scene,
  engine: Engine,
  camera: ArcRotateCamera,
  ui: UIElements
): void {
  const ctx: GameContext = {
    scene,
    engine,
    camera,
    ui,
    state: "READY",
    score: 0,
    layer: 0,
    playerDrops: 0,
    axis: "x",
    speed: SWING_SPEED,
    currentBlock: null,
    previousBlock: null,
    allMeshes: [],
    time: 0,
    cameraTargetY: 2,
    comboCount: 0,
    activePowerUp: null,
    hasMagnet: false,
    slowMoRemaining: 0,
    freezeTimer: 0,
  };

  showStartScreen(ui);
  resetGame(ctx);

  // Input: pointer (click/tap)
  scene.onPointerDown = () => handleInput(ctx);

  // Input: spacebar
  scene.onKeyboardObservable.add((kbInfo) => {
    if (kbInfo.type === KeyboardEventTypes.KEYDOWN && kbInfo.event.code === "Space") {
      handleInput(ctx);
    }
  });

  // Restart button
  ui.restartButton.onPointerUpObservable.add(() => {
    if (ctx.state === "GAME_OVER") {
      hideGameOver(ui);
      resetGame(ctx);
      showStartScreen(ui);
      ctx.state = "READY";
    }
  });

  // Render loop
  engine.runRenderLoop(() => {
    const dt = engine.getDeltaTime() / 1000;

    if (ctx.state === "PLAYING" && ctx.currentBlock) {
      ctx.time += dt;
      const effectiveSpeed = ctx.slowMoRemaining > 0
        ? ctx.speed * POWERUP_SLOWMO_MULTIPLIER
        : ctx.speed;
      updateSwingBlock(ctx.currentBlock, ctx.axis, ctx.time, effectiveSpeed);
    }

    // Freeze countdown
    if (ctx.state === "FROZEN") {
      ctx.freezeTimer -= dt;
      if (ctx.freezeTimer <= 0) {
        ctx.state = "PLAYING";
      }
    }

    // Smooth camera follow
    camera.target.y += (ctx.cameraTargetY - camera.target.y) * CAMERA_LERP_SPEED;
    camera.alpha = -Math.PI / 4;

    scene.render();
  });
}

function handleInput(ctx: GameContext): void {
  if (ctx.state === "READY") {
    unlockAudio();
    hideStartScreen(ctx.ui);
    ctx.state = "PLAYING";
    ctx.ui.scoreText.isVisible = true;
    updateScore(ctx.ui, ctx.score);
    playGameStart();
    startMusic();
    return;
  }

  if ((ctx.state === "PLAYING" || ctx.state === "FROZEN") && ctx.currentBlock && ctx.previousBlock) {
    dropBlock(ctx);
  }
}

function getComboMultiplier(comboCount: number): number {
  if (comboCount < COMBO_PERFECT_MIN) return 1;
  return 1 + (comboCount - COMBO_PERFECT_MIN + 1) * 0.5;
}

function getBlockTopPosition(ctx: GameContext): Vector3 {
  const y = ctx.layer * BLOCK_HEIGHT;
  const prev = ctx.previousBlock;
  return new Vector3(prev ? prev.x : 0, y + BLOCK_HEIGHT / 2, prev ? prev.z : 0);
}

function applyPowerUp(ctx: GameContext, type: PowerUpType): void {
  showPowerUpText(ctx.ui, getPowerUpLabel(type));
  const pos = getBlockTopPosition(ctx);

  switch (type) {
    case "magnet":
      ctx.hasMagnet = true;
      burstMagnet(ctx.scene, pos);
      playMagnetActivate();
      updateActivePowerUps(ctx.ui, getActiveList(ctx));
      break;
    case "expand":
      if (ctx.previousBlock) {
        const prev = ctx.previousBlock;
        prev.width = Math.min(prev.width + POWERUP_EXPAND_AMOUNT, POWERUP_EXPAND_MAX);
        prev.depth = Math.min(prev.depth + POWERUP_EXPAND_AMOUNT, POWERUP_EXPAND_MAX);
      }
      burstExpand(ctx.scene, pos);
      playExpandActivate();
      break;
    case "slowmo":
      ctx.slowMoRemaining = POWERUP_SLOWMO_DURATION;
      burstSlowMo(ctx.scene, pos);
      playSlowMoActivate();
      updateActivePowerUps(ctx.ui, getActiveList(ctx));
      break;
    case "freeze":
      ctx.freezeTimer = POWERUP_FREEZE_DURATION;
      ctx.state = "FROZEN";
      burstFreeze(ctx.scene, pos);
      playFreezeActivate();
      updateActivePowerUps(ctx.ui, getActiveList(ctx));
      break;
  }
}

function getActiveList(ctx: GameContext): string[] {
  const list: string[] = [];
  if (ctx.hasMagnet) list.push("MAGNET (next)");
  if (ctx.slowMoRemaining > 0) list.push(`SLOW-MO (${ctx.slowMoRemaining})`);
  if (ctx.freezeTimer > 0) list.push("FREEZE");
  return list;
}

function dropBlock(ctx: GameContext): void {
  const { currentBlock, previousBlock, axis, scene, layer } = ctx;
  if (!currentBlock || !previousBlock) return;

  // Collect power-up if present
  if (ctx.activePowerUp) {
    const puType = ctx.activePowerUp.type;
    const puPos = ctx.activePowerUp.mesh.position.clone();
    burstPowerUpCollect(scene, puPos, puType);
    playPowerUpCollect();
    disposePowerUp(ctx.activePowerUp);
    ctx.activePowerUp = null;
    applyPowerUp(ctx, puType);
  }

  // Check for magnet auto-snap
  const isX = axis === "x";
  const currentPos = isX ? currentBlock.mesh.position.x : currentBlock.mesh.position.z;
  const prevPos = isX ? previousBlock.x : previousBlock.z;
  const diff = Math.abs(currentPos - prevPos);

  const isPerfect = diff < PERFECT_THRESHOLD || (ctx.hasMagnet && diff < POWERUP_MAGNET_THRESHOLD);

  if (ctx.hasMagnet && diff < POWERUP_MAGNET_THRESHOLD) {
    ctx.hasMagnet = false;
    updateActivePowerUps(ctx.ui, getActiveList(ctx));
  }

  if (isPerfect) {
    // Perfect placement
    if (isX) {
      currentBlock.mesh.position.x = previousBlock.x;
      currentBlock.x = previousBlock.x;
    } else {
      currentBlock.mesh.position.z = previousBlock.z;
      currentBlock.z = previousBlock.z;
    }
    currentBlock.width = previousBlock.width;
    currentBlock.depth = previousBlock.depth;

    currentBlock.mesh.material?.dispose();
    currentBlock.mesh.dispose();

    const perfectMesh = MeshBuilder.CreateBox(
      `perfect_${layer}`,
      { width: currentBlock.width, height: BLOCK_HEIGHT, depth: currentBlock.depth },
      scene
    );
    const mat = new StandardMaterial(`mat_perfect_${layer}`, scene);
    mat.diffuseColor = getBlockColor(layer);
    mat.specularColor = new Color3(0.2, 0.2, 0.2);
    mat.emissiveColor = new Color3(0.5, 0.5, 0.5);
    setTimeout(() => { mat.emissiveColor = Color3.Black(); }, 150);
    perfectMesh.material = mat;
    perfectMesh.position.set(
      isX ? previousBlock.x : currentBlock.x,
      currentBlock.y,
      isX ? currentBlock.z : previousBlock.z
    );

    currentBlock.mesh = perfectMesh;
    ctx.allMeshes.push(perfectMesh);
    ctx.previousBlock = { ...currentBlock };

    // Combo
    ctx.comboCount++;
    playPerfect();
    if (ctx.comboCount >= COMBO_PERFECT_MIN) {
      showComboText(ctx.ui, ctx.comboCount);
      playCombo(ctx.comboCount);
    }
    // Perfect placement particles + landing impact
    burstPerfect(scene, perfectMesh.position.clone(), ctx.comboCount);
    burstLanding(scene, perfectMesh.position.clone());
  } else {
    // Normal slice
    const result = sliceBlock(currentBlock, previousBlock, axis, scene, layer);
    if (!result) {
      burstGameOver(scene, currentBlock.mesh.position.clone());
      animateOverhangFall(currentBlock.mesh, scene);
      gameOver(ctx);
      return;
    }

    playDrop();
    playSlice();
    burstLanding(scene, result.survived.mesh.position.clone());
    burstSlice(scene, result.overhang.position.clone());
    ctx.allMeshes.push(result.survived.mesh);
    animateOverhangFall(result.overhang, scene);
    ctx.previousBlock = result.survived;

    // Reset combo
    ctx.comboCount = 0;
  }

  // Score with combo multiplier
  const multiplier = getComboMultiplier(ctx.comboCount);
  const points = Math.floor(1 * multiplier);
  ctx.score += points;
  ctx.layer++;
  ctx.playerDrops++;
  ctx.axis = ctx.axis === "x" ? "z" : "x";
  ctx.speed = Math.min(SWING_SPEED + ctx.playerDrops * SPEED_INCREMENT, MAX_SPEED);

  // Slow-mo countdown
  if (ctx.slowMoRemaining > 0) {
    ctx.slowMoRemaining--;
    updateActivePowerUps(ctx.ui, getActiveList(ctx));
  }

  updateScore(ctx.ui, ctx.score);

  // Camera
  ctx.cameraTargetY = ctx.layer * BLOCK_HEIGHT + 2;

  // Spawn next block
  const prev = ctx.previousBlock!;
  ctx.currentBlock = createBlock(
    scene,
    ctx.layer,
    prev.width,
    prev.depth,
    prev.x,
    prev.z,
    ctx.axis
  );
  ctx.time = 0;
  ctx.state = "PLAYING";

  // Maybe spawn a power-up on the new block
  if (shouldSpawnPowerUp()) {
    const puType = pickRandomPowerUp();
    ctx.activePowerUp = createPowerUpMesh(
      scene, puType, prev.x, prev.z, ctx.layer * BLOCK_HEIGHT
    );
    animatePowerUp(ctx.activePowerUp, scene);
  }
}

function gameOver(ctx: GameContext): void {
  ctx.state = "GAME_OVER";
  stopMusic();
  playGameOver();
  disposePowerUp(ctx.activePowerUp);
  ctx.activePowerUp = null;
  updateActivePowerUps(ctx.ui, []);

  // Playable ad mode: show CTA end card
  if (isPlayableMode()) {
    showCTA(ctx.score, () => {
      resetGame(ctx);
      showStartScreen(ctx.ui);
      ctx.state = "READY";
    });
    return;
  }

  // Normal mode: high score flow
  if (isHighScore(ctx.score)) {
    showNameInput(ctx.ui, ctx.score);
    ctx.ui.onNameSubmit((name) => {
      const scores = saveHighScore(name, ctx.score);
      showGameOver(ctx.ui, ctx.score, scores);
    });
  } else {
    showGameOver(ctx.ui, ctx.score, getHighScores());
  }
}

function resetGame(ctx: GameContext): void {
  // Dispose all existing meshes
  for (const mesh of ctx.allMeshes) {
    if (!mesh.isDisposed()) {
      mesh.material?.dispose();
      mesh.dispose();
    }
  }
  if (ctx.currentBlock && !ctx.currentBlock.mesh.isDisposed()) {
    ctx.currentBlock.mesh.material?.dispose();
    ctx.currentBlock.mesh.dispose();
  }
  if (ctx.previousBlock && !ctx.previousBlock.mesh.isDisposed()) {
    ctx.previousBlock.mesh.material?.dispose();
    ctx.previousBlock.mesh.dispose();
  }
  disposePowerUp(ctx.activePowerUp);

  ctx.allMeshes = [];
  ctx.score = 0;
  ctx.layer = 0;
  ctx.playerDrops = 0;
  ctx.axis = "x";
  ctx.speed = SWING_SPEED;
  ctx.time = 0;
  ctx.cameraTargetY = 2;
  ctx.comboCount = 0;
  ctx.activePowerUp = null;
  ctx.hasMagnet = false;
  ctx.slowMoRemaining = 0;
  ctx.freezeTimer = 0;

  ctx.camera.target.y = 2;

  updateActivePowerUps(ctx.ui, []);

  // Build pre-stacked tower
  const base = createBaseBlock(ctx.scene);
  ctx.allMeshes.push(base.mesh);
  ctx.previousBlock = base;

  for (let i = 1; i <= STARTING_STACK; i++) {
    const y = i * BLOCK_HEIGHT;
    const mesh = MeshBuilder.CreateBox(
      `prestack_${i}`,
      { width: INITIAL_BLOCK_SIZE, height: BLOCK_HEIGHT, depth: INITIAL_BLOCK_SIZE },
      ctx.scene
    );
    const mat = new StandardMaterial(`mat_prestack_${i}`, ctx.scene);
    mat.diffuseColor = getBlockColor(i);
    mat.specularColor = new Color3(0.2, 0.2, 0.2);
    mesh.material = mat;
    mesh.position.set(0, y, 0);
    ctx.allMeshes.push(mesh);
    ctx.previousBlock = {
      mesh,
      width: INITIAL_BLOCK_SIZE,
      depth: INITIAL_BLOCK_SIZE,
      x: 0,
      z: 0,
      y,
    };
  }

  ctx.layer = STARTING_STACK + 1;
  ctx.cameraTargetY = ctx.layer * BLOCK_HEIGHT + 2;
  ctx.camera.target.y = ctx.cameraTargetY;

  ctx.currentBlock = createBlock(
    ctx.scene,
    ctx.layer,
    ctx.previousBlock.width,
    ctx.previousBlock.depth,
    ctx.previousBlock.x,
    ctx.previousBlock.z,
    ctx.axis
  );

  ctx.scene.clearColor = new Color4(0.95, 0.92, 0.88, 1);
}
