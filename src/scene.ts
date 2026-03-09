import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4, Color3 } from "@babylonjs/core/Maths/math.color";
import { createClouds } from "./clouds";

export interface SceneContext {
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
}

function getResponsiveRadius(): number {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;

  if (aspect < 0.7) return 18;
  if (aspect < 1) return 16;
  return 14;
}

export function createScene(canvas: HTMLCanvasElement): SceneContext {
  const engine = new Engine(canvas, true, {
    stencil: true,
    preserveDrawingBuffer: true,
    adaptToDeviceRatio: true,
  });
  const scene = new Scene(engine);

  // Sky blue background
  scene.clearColor = new Color4(0.53, 0.81, 0.98, 1);

  const radius = getResponsiveRadius();
  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 4,
    Math.PI / 3,
    radius,
    new Vector3(0, 2, 0),
    scene
  );
  camera.lowerRadiusLimit = radius;
  camera.upperRadiusLimit = radius;
  camera.detachControl();

  // Bright sky ambient light
  const hemiLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.85;
  hemiLight.groundColor = new Color3(0.6, 0.65, 0.75);

  // Sun-like directional light
  const dirLight = new DirectionalLight("dir", new Vector3(-1, -2, 1), scene);
  dirLight.intensity = 0.6;

  // Floating clouds
  createClouds(scene);

  // Handle resize + orientation change
  const onResize = () => {
    engine.resize();
    const newRadius = getResponsiveRadius();
    camera.radius = newRadius;
    camera.lowerRadiusLimit = newRadius;
    camera.upperRadiusLimit = newRadius;
  };
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", () => {
    setTimeout(onResize, 100);
  });

  return { engine, scene, camera };
}
