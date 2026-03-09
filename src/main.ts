// Side-effect imports: register shaders needed by tree-shaken Babylon.js
import "@babylonjs/core/Shaders/default.vertex";
import "@babylonjs/core/Shaders/default.fragment";
import "@babylonjs/core/Shaders/layer.vertex";
import "@babylonjs/core/Shaders/layer.fragment";
import "@babylonjs/core/Shaders/particles.vertex";
import "@babylonjs/core/Shaders/particles.fragment";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Lights/hemisphericLight";
import "@babylonjs/core/Lights/directionalLight";

import { createScene } from "./scene";
import { createUI } from "./ui";
import { initGame } from "./game";
import { waitForMRAIDReady, isMRAID } from "./mraid";

async function boot() {
  // Wait for MRAID container if running inside an ad network
  if (isMRAID()) {
    await waitForMRAIDReady();
  }

  const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  if (!canvas) throw new Error("Canvas not found");

  const { engine, scene, camera } = createScene(canvas);
  const ui = createUI();
  initGame(scene, engine, camera, ui);
}

boot();
