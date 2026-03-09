import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Scene } from "@babylonjs/core/scene";

const FILLET = 0.08;
const LAT = 14;
const LON = 28;

/**
 * Creates a box mesh with uniformly rounded edges and corners.
 * Uses a constant fillet radius so curves are visible on all edges,
 * even on thin/flat blocks.
 */
export function createRoundedBox(
  name: string,
  options: { width: number; height: number; depth: number },
  scene: Scene
): Mesh {
  const w = options.width;
  const h = options.height;
  const d = options.depth;

  // Clamp fillet so it never exceeds 35% of smallest half-dimension
  const r = Math.min(FILLET, w * 0.35, h * 0.35, d * 0.35);
  const hw = w / 2 - r;
  const hh = h / 2 - r;
  const hd = d / 2 - r;

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  // Project unit sphere vertices onto rounded box surface.
  // For each sphere direction d, find the closest point on the inner box,
  // then offset outward by fillet radius r.
  for (let i = 0; i <= LAT; i++) {
    const phi = (Math.PI * i) / LAT;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    for (let j = 0; j <= LON; j++) {
      const theta = (2 * Math.PI * j) / LON;

      // Unit sphere direction
      const dx = sinPhi * Math.cos(theta);
      const dy = cosPhi;
      const dz = sinPhi * Math.sin(theta);

      // Extend direction far and clamp to inner box → closest box point
      const FAR = 1000;
      const cx = Math.max(-hw, Math.min(hw, dx * FAR));
      const cy = Math.max(-hh, Math.min(hh, dy * FAR));
      const cz = Math.max(-hd, Math.min(hd, dz * FAR));

      // Offset direction: from inner box point toward the sphere ray
      let ox = dx * FAR - cx;
      let oy = dy * FAR - cy;
      let oz = dz * FAR - cz;
      let len = Math.sqrt(ox * ox + oy * oy + oz * oz);

      if (len < 0.001) {
        ox = dx; oy = dy; oz = dz;
        len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1;
      }

      ox /= len;
      oy /= len;
      oz /= len;

      // Surface point = inner box point + fillet radius * outward normal
      positions.push(cx + r * ox, cy + r * oy, cz + r * oz);
      normals.push(ox, oy, oz);
      uvs.push(j / LON, i / LAT);
    }
  }

  // Triangle indices
  for (let i = 0; i < LAT; i++) {
    for (let j = 0; j < LON; j++) {
      const a = i * (LON + 1) + j;
      const b = a + 1;
      const c = a + (LON + 1);
      const dd = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, dd);
    }
  }

  const mesh = new Mesh(name, scene);
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.normals = normals;
  vertexData.indices = indices;
  vertexData.uvs = uvs;
  vertexData.applyToMesh(mesh);

  return mesh;
}
