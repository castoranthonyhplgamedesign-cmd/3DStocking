import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4, Color3 } from "@babylonjs/core/Maths/math.color";

export interface SceneContext {
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
}

function getResponsiveRadius(): number {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;

  // Portrait (mobile): pull camera back so blocks aren't cropped
  if (aspect < 0.7) return 18;
  // Narrow portrait
  if (aspect < 1) return 16;
  // Landscape / desktop
  return 14;
}

export function createScene(canvas: HTMLCanvasElement): SceneContext {
  const engine = new Engine(canvas, true, {
    stencil: true,
    preserveDrawingBuffer: true,
    adaptToDeviceRatio: true,
  });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.95, 0.92, 0.88, 1); // warm cream

  // Camera: isometric-ish view, locked controls
  const radius = getResponsiveRadius();
  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 4,     // alpha (horizontal rotation)
    Math.PI / 3,      // beta (vertical tilt)
    radius,
    new Vector3(0, 2, 0),
    scene
  );
  camera.lowerRadiusLimit = radius;
  camera.upperRadiusLimit = radius;
  camera.detachControl();

  // Ambient light
  const hemiLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.7;
  hemiLight.groundColor = new Color3(0.4, 0.4, 0.45);

  // Directional light for depth
  const dirLight = new DirectionalLight("dir", new Vector3(-1, -2, 1), scene);
  dirLight.intensity = 0.5;

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
    // Delay to let the browser settle after orientation change
    setTimeout(onResize, 100);
  });

  return { engine, scene, camera };
}
