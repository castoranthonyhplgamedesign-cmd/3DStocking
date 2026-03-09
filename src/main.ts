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
import { waitForMRAIDReady, isMRAID, onViewableChange, isCurrentlyViewable } from "./mraid";
import { pauseAudio, resumeAudio } from "./sound";

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

  // MRAID viewability: audio MUST stop when ad is not visible (top rejection reason)
  onViewableChange((isViewable) => {
    if (isViewable) {
      resumeAudio();
    } else {
      pauseAudio();
    }
  });

  // If MRAID and not currently viewable at boot, pause audio immediately
  if (isMRAID() && !isCurrentlyViewable()) {
    pauseAudio();
  }

  // Also handle browser tab visibility (non-MRAID environments)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseAudio();
    } else {
      resumeAudio();
    }
  });
}

boot();
